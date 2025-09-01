/**
 * Ejecutor principal de flujos con soporte para concurrencia masiva
 * Orquesta tests, stress testing y monitoreo de performance
 */

import { FlowTester } from '../framework/flow-tester'
import { StressTestRunner } from './stress-runner'
import { PerformanceMonitor } from '../utils/performance-monitor'
import { 
  FlowTestCase, 
  TestSuite, 
  TestReport, 
  StressTestConfig,
  FlowCategory 
} from '../types/test-types'

// Importar casos de prueba
import { capturaInicialTestSuite, capturaInicialTestCases } from '../fixtures/flow-test-cases/captura-inicial'
import { menuPrincipalTestSuite, menuPrincipalTestCases } from '../fixtures/flow-test-cases/menu-principal'

interface ExecutionConfig {
  mode: 'sequential' | 'parallel' | 'stress' | 'load' | 'full'
  maxConcurrency?: number
  stressConfig?: StressTestConfig
  enableMonitoring?: boolean
  generateReport?: boolean
  exportResults?: boolean
  timeout?: number
}

interface ExecutionResult {
  config: ExecutionConfig
  startTime: Date
  endTime: Date
  totalDuration: number
  testResults: TestReport[]
  stressResults?: any[]
  performanceReport?: any
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    successRate: number
  }
  recommendations: string[]
}

export class FlowTestRunner {
  private monitor: PerformanceMonitor
  private stressRunner: StressTestRunner
  private isRunning: boolean = false

  constructor() {
    this.monitor = new PerformanceMonitor(1000)
    this.stressRunner = new StressTestRunner()
  }

  /**
   * Ejecuta suite completa de tests
   */
  async runFullTestSuite(config: ExecutionConfig = { mode: 'parallel' }): Promise<ExecutionResult> {
    console.log('🚀 Iniciando ejecución completa de tests del chatbot UNIACC')
    
    const startTime = new Date()
    this.isRunning = true
    
    // Iniciar monitoreo si está habilitado
    if (config.enableMonitoring) {
      this.monitor.start()
      if (process.env.SHOW_METRICS === 'true') {
        this.monitor.startConsoleDisplay()
      }
    }

    const result: ExecutionResult = {
      config,
      startTime,
      endTime: new Date(),
      totalDuration: 0,
      testResults: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: 0
      },
      recommendations: []
    }

    try {
      // Obtener todas las suites de test
      const testSuites = this.getAllTestSuites()
      
      console.log(`📋 Ejecutando ${testSuites.length} suites de test...`)

      // Ejecutar según el modo
      switch (config.mode) {
        case 'sequential':
          result.testResults = await this.runSequentialTests(testSuites)
          break
        
        case 'parallel':
          result.testResults = await this.runParallelTests(testSuites, config.maxConcurrency)
          break
        
        case 'stress':
          await this.runStressTests(testSuites, config.stressConfig, result)
          break
        
        case 'load':
          await this.runLoadTests(testSuites, result)
          break
        
        case 'full':
          await this.runFullTestPipeline(testSuites, config, result)
          break
      }

      // Calcular métricas finales
      result.endTime = new Date()
      result.totalDuration = result.endTime.getTime() - startTime.getTime()
      this.calculateSummary(result)
      this.generateRecommendations(result)

      // Obtener reporte de performance si está habilitado
      if (config.enableMonitoring) {
        this.monitor.stop()
        result.performanceReport = this.monitor.generateReport()
      }

      console.log('\n✅ Ejecución completa finalizada')
      this.printSummary(result)

      // Exportar resultados si está configurado
      if (config.exportResults) {
        await this.exportResults(result)
      }

      return result

    } catch (error) {
      console.error('💥 Error en ejecución de tests:', error)
      throw error
    } finally {
      this.isRunning = false
      if (this.monitor.isRunning) {
        this.monitor.stop()
      }
    }
  }

  /**
   * Ejecuta tests de forma secuencial
   */
  private async runSequentialTests(testSuites: TestSuite[]): Promise<TestReport[]> {
    console.log('📝 Ejecutando tests secuencialmente...')
    
    const results: TestReport[] = []
    const tester = new FlowTester()

    for (const suite of testSuites) {
      console.log(`\n🎯 Ejecutando suite: ${suite.name}`)
      
      try {
        const report = await tester.runTestSuite(suite)
        results.push(report)
        
        console.log(`${report.passedTests}/${report.totalTests} tests exitosos`)
        
      } catch (error) {
        console.error(`❌ Error en suite ${suite.name}:`, error)
      }
    }

    return results
  }

  /**
   * Ejecuta tests en paralelo con control de concurrencia
   */
  private async runParallelTests(testSuites: TestSuite[], maxConcurrency: number = 3): Promise<TestReport[]> {
    console.log(`🔀 Ejecutando tests en paralelo (max ${maxConcurrency} concurrentes)...`)
    
    const results: TestReport[] = []
    const semaphore = new Array(maxConcurrency).fill(null)
    
    const executeWithSemaphore = async (suite: TestSuite): Promise<TestReport> => {
      // Esperar por slot disponible
      await this.waitForSlot(semaphore)
      
      try {
        console.log(`🎯 Iniciando suite: ${suite.name}`)
        const tester = new FlowTester()
        const report = await tester.runTestSuite(suite)
        console.log(`✅ Suite ${suite.name}: ${report.passedTests}/${report.totalTests} exitosos`)
        return report
        
      } finally {
        // Liberar slot
        this.releaseSlot(semaphore)
      }
    }

    const promises = testSuites.map(suite => executeWithSemaphore(suite))
    const reports = await Promise.all(promises)
    
    return reports
  }

  /**
   * Ejecuta tests de estrés
   */
  private async runStressTests(
    testSuites: TestSuite[], 
    stressConfig?: StressTestConfig,
    result?: ExecutionResult
  ): Promise<void> {
    console.log('💪 Ejecutando tests de estrés...')
    
    const defaultConfig: StressTestConfig = {
      concurrentUsers: 20,
      messagesPerUser: 5,
      duration: 30000,
      rampUpTime: 5000,
      rampDownTime: 2000,
      targetThroughput: 100
    }

    const config = { ...defaultConfig, ...stressConfig }
    
    // Obtener casos representativos de cada suite
    const testCases = testSuites.flatMap(suite => 
      suite.testCases.filter(tc => tc.priority === 'critical' || tc.priority === 'high').slice(0, 2)
    )

    const stressResults = await this.stressRunner.runStressTestSuite(testCases, config)
    
    if (result) {
      result.stressResults = stressResults
    }

    console.log(`💪 Tests de estrés completados: ${stressResults.length} escenarios`)
  }

  /**
   * Ejecuta tests de carga incremental
   */
  private async runLoadTests(testSuites: TestSuite[], result: ExecutionResult): Promise<void> {
    console.log('📈 Ejecutando tests de carga incremental...')
    
    // Seleccionar test case crítico para load testing
    const criticalTestCase = this.selectCriticalTestCase(testSuites)
    
    if (!criticalTestCase) {
      console.warn('⚠️ No se encontró test case crítico para load testing')
      return
    }

    const loadResults = await this.stressRunner.runLoadTest(
      criticalTestCase,
      100, // Máximo 100 usuarios
      10,  // Incrementos de 10
      20000 // 20 segundos por step
    )

    result.stressResults = loadResults
    console.log(`📈 Load testing completado: ${loadResults.length} niveles de carga`)
  }

  /**
   * Ejecuta pipeline completo de testing
   */
  private async runFullTestPipeline(
    testSuites: TestSuite[], 
    config: ExecutionConfig, 
    result: ExecutionResult
  ): Promise<void> {
    console.log('🎯 Ejecutando pipeline completo de testing...')
    
    // 1. Tests unitarios en paralelo
    console.log('\n1️⃣ Fase: Tests funcionales')
    result.testResults = await this.runParallelTests(testSuites, 5)
    
    // 2. Tests de estrés básico
    console.log('\n2️⃣ Fase: Tests de estrés básico')
    await this.runStressTests(testSuites, {
      concurrentUsers: 10,
      messagesPerUser: 3,
      duration: 15000,
      rampUpTime: 3000,
      rampDownTime: 1000,
      targetThroughput: 50
    }, result)
    
    // 3. Load testing incremental
    console.log('\n3️⃣ Fase: Load testing incremental')
    await this.runLoadTests(testSuites, result)
    
    console.log('\n✅ Pipeline completo finalizado')
  }

  /**
   * Obtiene todas las suites de test disponibles
   */
  private getAllTestSuites(): TestSuite[] {
    return [
      capturaInicialTestSuite,
      menuPrincipalTestSuite
      // Agregar más suites aquí cuando estén disponibles
    ]
  }

  /**
   * Selecciona test case crítico para load testing
   */
  private selectCriticalTestCase(testSuites: TestSuite[]): FlowTestCase | null {
    for (const suite of testSuites) {
      const criticalTest = suite.testCases.find(tc => 
        tc.priority === 'critical' && 
        tc.category === FlowCategory.ONBOARDING
      )
      if (criticalTest) return criticalTest
    }
    return null
  }

  /**
   * Calcula resumen de resultados
   */
  private calculateSummary(result: ExecutionResult): void {
    const totalTests = result.testResults.reduce((sum, report) => sum + report.totalTests, 0)
    const passedTests = result.testResults.reduce((sum, report) => sum + report.passedTests, 0)
    const failedTests = totalTests - passedTests

    result.summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
    }
  }

  /**
   * Genera recomendaciones basadas en resultados
   */
  private generateRecommendations(result: ExecutionResult): void {
    const recommendations: string[] = []

    // Análisis de tasa de éxito
    if (result.summary.successRate < 90) {
      recommendations.push(`🔴 Tasa de éxito baja (${result.summary.successRate.toFixed(1)}%). Revisar tests fallidos.`)
    } else if (result.summary.successRate < 95) {
      recommendations.push(`🟡 Tasa de éxito moderada (${result.summary.successRate.toFixed(1)}%). Optimizar casos edge.`)
    }

    // Análisis de performance
    if (result.performanceReport) {
      const avgResponseTime = result.performanceReport.performance.averageResponseTime
      if (avgResponseTime > 2000) {
        recommendations.push(`🐌 Tiempo de respuesta alto (${avgResponseTime.toFixed(0)}ms). Optimizar lógica del bot.`)
      }

      const errorRate = result.performanceReport.performance.errorRate
      if (errorRate > 5) {
        recommendations.push(`❌ Alta tasa de errores (${errorRate.toFixed(1)}%). Revisar estabilidad.`)
      }

      const memoryUsage = result.performanceReport.resources.peakMemoryUsage
      if (memoryUsage > 80) {
        recommendations.push(`🧠 Alto uso de memoria (${memoryUsage.toFixed(1)}%). Revisar memory leaks.`)
      }
    }

    // Análisis de stress testing
    if (result.stressResults && result.stressResults.length > 0) {
      const stressFailures = result.stressResults.filter((sr: any) => sr.errorRate > 0.1)
      if (stressFailures.length > 0) {
        recommendations.push(`💪 ${stressFailures.length} escenarios de estrés con alta tasa de fallos. Revisar escalabilidad.`)
      }
    }

    // Recomendaciones generales
    if (recommendations.length === 0) {
      recommendations.push(`✅ Excelente! Todos los indicadores están en rangos óptimos.`)
      recommendations.push(`🚀 Considera aumentar la carga de tests para encontrar límites del sistema.`)
    }

    result.recommendations = recommendations
  }

  /**
   * Imprime resumen de resultados
   */
  private printSummary(result: ExecutionResult): void {
    console.log('\n╔══════════════════════════════════════════════════════════╗')
    console.log('║                   📊 RESUMEN DE EJECUCIÓN                 ║')
    console.log('╠══════════════════════════════════════════════════════════╣')
    console.log(`║ Modo: ${result.config.mode.toUpperCase().padEnd(20)} Duración: ${(result.totalDuration / 1000).toFixed(1)}s ║`)
    console.log(`║ Tests: ${result.summary.totalTests.toString().padEnd(19)} Exitosos: ${result.summary.passedTests} ║`)
    console.log(`║ Fallidos: ${result.summary.failedTests.toString().padEnd(16)} Tasa éxito: ${result.summary.successRate.toFixed(1)}% ║`)
    
    if (result.performanceReport) {
      const perf = result.performanceReport.performance
      console.log(`║ Throughput: ${perf.throughput.toFixed(1).padEnd(14)} Resp. Avg: ${perf.averageResponseTime.toFixed(0)}ms ║`)
      console.log(`║ Errores: ${perf.errorRate.toFixed(1).padEnd(17)}% P95: ${perf.p95ResponseTime.toFixed(0)}ms ║`)
    }
    
    console.log('╠══════════════════════════════════════════════════════════╣')
    console.log('║                    🎯 RECOMENDACIONES                    ║')
    console.log('╠══════════════════════════════════════════════════════════╣')
    
    result.recommendations.forEach(rec => {
      // Dividir líneas largas
      const lines = this.wrapText(rec, 58)
      lines.forEach(line => {
        console.log(`║ ${line.padEnd(58)} ║`)
      })
    })
    
    console.log('╚══════════════════════════════════════════════════════════╝')
  }

  /**
   * Exporta resultados completos
   */
  private async exportResults(result: ExecutionResult): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `test-results-${result.config.mode}-${timestamp}.json`
    
    try {
      const fs = await import('fs/promises')
      await fs.writeFile(filename, JSON.stringify(result, null, 2))
      console.log(`💾 Resultados exportados a: ${filename}`)
      
      // También exportar un resumen en texto
      const summaryFilename = filename.replace('.json', '-summary.txt')
      const summaryText = this.generateTextSummary(result)
      await fs.writeFile(summaryFilename, summaryText)
      console.log(`📄 Resumen exportado a: ${summaryFilename}`)
      
    } catch (error) {
      console.error(`❌ Error exportando resultados: ${error}`)
    }
  }

  /**
   * Genera resumen en texto plano
   */
  private generateTextSummary(result: ExecutionResult): string {
    let summary = `REPORTE DE TESTING CHATBOT UNIACC\n`
    summary += `${'='.repeat(50)}\n\n`
    summary += `Fecha: ${result.startTime.toLocaleString()}\n`
    summary += `Modo: ${result.config.mode}\n`
    summary += `Duración: ${(result.totalDuration / 1000).toFixed(1)}s\n\n`
    
    summary += `RESULTADOS:\n`
    summary += `- Tests totales: ${result.summary.totalTests}\n`
    summary += `- Tests exitosos: ${result.summary.passedTests}\n`
    summary += `- Tests fallidos: ${result.summary.failedTests}\n`
    summary += `- Tasa de éxito: ${result.summary.successRate.toFixed(1)}%\n\n`
    
    if (result.performanceReport) {
      summary += `PERFORMANCE:\n`
      const perf = result.performanceReport.performance
      summary += `- Throughput: ${perf.throughput.toFixed(1)} req/s\n`
      summary += `- Tiempo respuesta promedio: ${perf.averageResponseTime.toFixed(0)}ms\n`
      summary += `- P95: ${perf.p95ResponseTime.toFixed(0)}ms\n`
      summary += `- Tasa de error: ${perf.errorRate.toFixed(1)}%\n\n`
    }
    
    summary += `RECOMENDACIONES:\n`
    result.recommendations.forEach((rec, index) => {
      summary += `${index + 1}. ${rec}\n`
    })
    
    return summary
  }

  /**
   * Utilidades para manejo de concurrencia
   */
  private async waitForSlot(semaphore: any[]): Promise<void> {
    while (semaphore.every(slot => slot !== null)) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    const index = semaphore.findIndex(slot => slot === null)
    semaphore[index] = true
  }

  private releaseSlot(semaphore: any[]): void {
    const index = semaphore.findIndex(slot => slot === true)
    if (index !== -1) {
      semaphore[index] = null
    }
  }

  /**
   * Divide texto en líneas de ancho específico
   */
  private wrapText(text: string, width: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    
    if (currentLine) lines.push(currentLine)
    return lines
  }

  // Getters públicos
  get running(): boolean {
    return this.isRunning
  }
}

// Función para ejecutar desde CLI
export async function runFlowTestsFromCLI() {
  const runner = new FlowTestRunner()
  
  // Leer argumentos de línea de comandos
  const args = process.argv.slice(2)
  const mode = (args[0] as any) || 'parallel'
  const enableMonitoring = args.includes('--monitor')
  const exportResults = args.includes('--export')
  const showMetrics = args.includes('--show-metrics')
  
  if (showMetrics) {
    process.env.SHOW_METRICS = 'true'
  }

  const config: ExecutionConfig = {
    mode,
    enableMonitoring,
    exportResults,
    maxConcurrency: 5
  }

  try {
    console.log(`🚀 Ejecutando tests en modo: ${mode}`)
    if (enableMonitoring) console.log('📊 Monitoreo de performance habilitado')
    
    const results = await runner.runFullTestSuite(config)
    
    console.log('\n🎉 Testing completado exitosamente!')
    process.exit(0)
    
  } catch (error) {
    console.error('💥 Error en testing:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runFlowTestsFromCLI()
}
