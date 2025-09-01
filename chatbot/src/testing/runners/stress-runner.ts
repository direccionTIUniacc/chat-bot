/**
 * Ejecutor de Stress Testing para manejar múltiples conexiones concurrentes
 * Simula carga real con muchos usuarios simultáneos
 */

import { FlowTester } from '../framework/flow-tester'
import { MockUniaccBot } from '../mocks/mock-bot'
import { 
  StressTestConfig, 
  FlowTestCase, 
  FlowTestResult, 
  PerformanceMetrics,
  TestReport 
} from '../types/test-types'

interface StressTestResult {
  config: StressTestConfig
  startTime: Date
  endTime: Date
  totalDuration: number
  totalUsers: number
  totalMessages: number
  successfulSessions: number
  failedSessions: number
  averageResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  throughput: number
  errorRate: number
  memoryUsage: {
    start: NodeJS.MemoryUsage
    peak: NodeJS.MemoryUsage
    end: NodeJS.MemoryUsage
  }
  concurrencyMetrics: {
    peakConcurrentUsers: number
    averageConcurrentUsers: number
    queuedUsers: number
  }
  errors: Array<{
    userId: string
    error: string
    timestamp: Date
    step?: number
  }>
  userSessions: Map<string, {
    userId: string
    startTime: Date
    endTime?: Date
    messages: number
    success: boolean
    error?: string
    responseTime: number
  }>
}

export class StressTestRunner {
  private activeSessions: Map<string, MockUniaccBot> = new Map()
  private completedSessions: Map<string, any> = new Map()
  private errors: Array<any> = []
  private responseTimeTracker: number[] = []
  private memoryTracker: NodeJS.MemoryUsage[] = []
  private concurrencyTracker: number[] = []

  constructor(private globalConfig?: any) {}

  /**
   * Ejecuta test de estrés con múltiples usuarios concurrentes
   */
  async runStressTest(
    testCase: FlowTestCase,
    config: StressTestConfig
  ): Promise<StressTestResult> {
    console.log(`🚀 Iniciando stress test: ${config.concurrentUsers} usuarios concurrentes`)
    
    const startTime = new Date()
    const startMemory = process.memoryUsage()
    
    const result: StressTestResult = {
      config,
      startTime,
      endTime: new Date(),
      totalDuration: 0,
      totalUsers: config.concurrentUsers,
      totalMessages: 0,
      successfulSessions: 0,
      failedSessions: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      throughput: 0,
      errorRate: 0,
      memoryUsage: {
        start: startMemory,
        peak: startMemory,
        end: startMemory
      },
      concurrencyMetrics: {
        peakConcurrentUsers: 0,
        averageConcurrentUsers: 0,
        queuedUsers: 0
      },
      errors: [],
      userSessions: new Map()
    }

    try {
      // Crear usuarios de forma escalonada (ramp-up)
      const userPromises: Promise<void>[] = []
      const rampUpDelay = config.rampUpTime / config.concurrentUsers

      for (let i = 0; i < config.concurrentUsers; i++) {
        const userId = `stress-user-${i}-${Date.now()}`
        
        // Delay para ramp-up
        const delay = i * rampUpDelay
        
        userPromises.push(
          this.createDelayedUser(userId, testCase, delay, result)
        )
      }

      // Monitoreo en tiempo real
      const monitoringInterval = setInterval(() => {
        this.updateMetrics(result)
      }, 1000)

      // Esperar a que todos los usuarios completen
      await Promise.all(userPromises)

      clearInterval(monitoringInterval)

      // Cálculos finales
      const endTime = new Date()
      result.endTime = endTime
      result.totalDuration = endTime.getTime() - startTime.getTime()
      result.endMemory = process.memoryUsage()
      
      this.calculateFinalMetrics(result)

      console.log(`✅ Stress test completado: ${result.successfulSessions}/${result.totalUsers} usuarios exitosos`)
      
      return result

    } catch (error) {
      console.error('💥 Error en stress test:', error)
      throw error
    } finally {
      this.cleanup()
    }
  }

  /**
   * Crea usuario con delay para ramp-up
   */
  private async createDelayedUser(
    userId: string,
    testCase: FlowTestCase,
    delay: number,
    result: StressTestResult
  ): Promise<void> {
    // Esperar delay de ramp-up
    await this.sleep(delay)

    const userStartTime = new Date()
    
    try {
      // Crear bot independiente para este usuario
      const bot = new MockUniaccBot({
        enableLogging: false,
        enableSupabase: false,
        memoryTracking: true,
        performanceTracking: true,
        simulateNetworkDelay: true,
        networkDelay: Math.random() * 100 + 50 // 50-150ms de delay realista
      })

      this.activeSessions.set(userId, bot)

      // Registrar sesión
      const session = {
        userId,
        startTime: userStartTime,
        messages: 0,
        success: false,
        responseTime: 0
      }
      result.userSessions.set(userId, session)

      // Ejecutar flujo de conversación
      let totalResponseTime = 0
      
      for (const step of testCase.steps) {
        const stepStartTime = performance.now()
        
        try {
          const { response, metrics } = await bot.procesarMensajeConMetricas(
            userId, 
            step.userMessage
          )
          
          const stepDuration = performance.now() - stepStartTime
          totalResponseTime += stepDuration
          session.messages++
          
          // Registrar tiempo de respuesta
          this.responseTimeTracker.push(stepDuration)
          
          // Simular delay entre mensajes del usuario
          if (step.delay) {
            await this.sleep(step.delay)
          } else {
            await this.sleep(Math.random() * 1000 + 500) // 0.5-1.5s aleatorio
          }
          
        } catch (stepError) {
          this.errors.push({
            userId,
            error: stepError instanceof Error ? stepError.message : String(stepError),
            timestamp: new Date(),
            step: step.stepNumber
          })
          throw stepError
        }
      }

      // Sesión exitosa
      session.success = true
      session.endTime = new Date()
      session.responseTime = totalResponseTime
      result.successfulSessions++

    } catch (error) {
      // Sesión fallida
      const session = result.userSessions.get(userId)
      if (session) {
        session.success = false
        session.error = error instanceof Error ? error.message : String(error)
        session.endTime = new Date()
      }
      result.failedSessions++
      
      this.errors.push({
        userId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      })
    } finally {
      // Limpiar sesión
      this.activeSessions.delete(userId)
      this.completedSessions.set(userId, result.userSessions.get(userId))
    }
  }

  /**
   * Actualiza métricas en tiempo real
   */
  private updateMetrics(result: StressTestResult): void {
    // Actualizar concurrencia
    const currentConcurrentUsers = this.activeSessions.size
    this.concurrencyTracker.push(currentConcurrentUsers)
    
    if (currentConcurrentUsers > result.concurrencyMetrics.peakConcurrentUsers) {
      result.concurrencyMetrics.peakConcurrentUsers = currentConcurrentUsers
    }

    // Actualizar memoria
    const currentMemory = process.memoryUsage()
    this.memoryTracker.push(currentMemory)
    
    if (currentMemory.heapUsed > result.memoryUsage.peak.heapUsed) {
      result.memoryUsage.peak = currentMemory
    }

    // Log de progreso
    const completed = result.userSessions.size - this.activeSessions.size
    const total = result.userSessions.size
    console.log(`📊 Progreso: ${completed}/${total} usuarios completados, ${currentConcurrentUsers} activos`)
  }

  /**
   * Calcula métricas finales
   */
  private calculateFinalMetrics(result: StressTestResult): void {
    // Tiempo de respuesta
    if (this.responseTimeTracker.length > 0) {
      result.averageResponseTime = this.responseTimeTracker.reduce((a, b) => a + b, 0) / this.responseTimeTracker.length
      result.maxResponseTime = Math.max(...this.responseTimeTracker)
      result.minResponseTime = Math.min(...this.responseTimeTracker)
    }

    // Throughput (mensajes por segundo)
    result.totalMessages = Array.from(result.userSessions.values()).reduce((sum, session) => sum + session.messages, 0)
    result.throughput = result.totalMessages / (result.totalDuration / 1000)

    // Tasa de error
    result.errorRate = result.failedSessions / result.totalUsers

    // Concurrencia promedio
    if (this.concurrencyTracker.length > 0) {
      result.concurrencyMetrics.averageConcurrentUsers = 
        this.concurrencyTracker.reduce((a, b) => a + b, 0) / this.concurrencyTracker.length
    }

    // Errores
    result.errors = this.errors
  }

  /**
   * Ejecuta múltiples escenarios de stress test
   */
  async runStressTestSuite(
    testCases: FlowTestCase[],
    baseConfig: StressTestConfig
  ): Promise<StressTestResult[]> {
    const results: StressTestResult[] = []

    for (const testCase of testCases) {
      console.log(`🎯 Ejecutando stress test para: ${testCase.name}`)
      
      try {
        const result = await this.runStressTest(testCase, baseConfig)
        results.push(result)
        
        // Cooldown entre tests
        await this.sleep(2000)
        
      } catch (error) {
        console.error(`❌ Error en stress test ${testCase.name}:`, error)
      }
    }

    return results
  }

  /**
   * Simula carga incremental
   */
  async runLoadTest(
    testCase: FlowTestCase,
    maxUsers: number,
    incrementStep: number = 10,
    stepDuration: number = 30000
  ): Promise<StressTestResult[]> {
    const results: StressTestResult[] = []

    for (let users = incrementStep; users <= maxUsers; users += incrementStep) {
      console.log(`📈 Load test: ${users} usuarios concurrentes`)
      
      const config: StressTestConfig = {
        concurrentUsers: users,
        messagesPerUser: testCase.steps.length,
        duration: stepDuration,
        rampUpTime: Math.min(users * 100, 5000), // Máximo 5s de ramp-up
        rampDownTime: 1000,
        targetThroughput: users * 2 // 2 mensajes por usuario por segundo
      }

      try {
        const result = await this.runStressTest(testCase, config)
        results.push(result)
        
        // Verificar si el sistema sigue estable
        if (result.errorRate > 0.1) { // Más del 10% de errores
          console.warn(`⚠️ Alta tasa de errores (${(result.errorRate * 100).toFixed(1)}%) con ${users} usuarios`)
        }
        
        if (result.averageResponseTime > 5000) { // Más de 5 segundos
          console.warn(`⚠️ Tiempo de respuesta alto (${result.averageResponseTime.toFixed(0)}ms) con ${users} usuarios`)
        }
        
      } catch (error) {
        console.error(`💥 Load test falló con ${users} usuarios:`, error)
        break // Detener si falla
      }
    }

    return results
  }

  /**
   * Genera reporte de stress testing
   */
  generateStressReport(results: StressTestResult[]): string {
    let report = '\n🚀 REPORTE DE STRESS TESTING\n'
    report += '=' .repeat(50) + '\n\n'

    results.forEach((result, index) => {
      report += `📊 Test ${index + 1}: ${result.config.concurrentUsers} usuarios concurrentes\n`
      report += `⏱️  Duración: ${(result.totalDuration / 1000).toFixed(1)}s\n`
      report += `✅ Sesiones exitosas: ${result.successfulSessions}/${result.totalUsers} (${((result.successfulSessions / result.totalUsers) * 100).toFixed(1)}%)\n`
      report += `❌ Tasa de error: ${(result.errorRate * 100).toFixed(1)}%\n`
      report += `⚡ Throughput: ${result.throughput.toFixed(1)} mensajes/s\n`
      report += `🕐 Tiempo respuesta promedio: ${result.averageResponseTime.toFixed(0)}ms\n`
      report += `📈 Tiempo respuesta máximo: ${result.maxResponseTime.toFixed(0)}ms\n`
      report += `👥 Pico de concurrencia: ${result.concurrencyMetrics.peakConcurrentUsers} usuarios\n`
      report += `🧠 Memoria pico: ${(result.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(1)}MB\n`
      
      if (result.errors.length > 0) {
        report += `🚨 Errores principales:\n`
        const errorGroups = new Map<string, number>()
        result.errors.forEach(error => {
          const key = error.error.substring(0, 50)
          errorGroups.set(key, (errorGroups.get(key) || 0) + 1)
        })
        Array.from(errorGroups.entries()).slice(0, 3).forEach(([error, count]) => {
          report += `   • ${error}... (${count}x)\n`
        })
      }
      
      report += '\n'
    })

    // Análisis y recomendaciones
    report += '🎯 ANÁLISIS Y RECOMENDACIONES\n'
    report += '-'.repeat(30) + '\n'

    const maxThroughput = Math.max(...results.map(r => r.throughput))
    const bestResult = results.find(r => r.throughput === maxThroughput)
    if (bestResult) {
      report += `🏆 Mejor throughput: ${maxThroughput.toFixed(1)} msg/s con ${bestResult.config.concurrentUsers} usuarios\n`
    }

    const highErrorTests = results.filter(r => r.errorRate > 0.05)
    if (highErrorTests.length > 0) {
      report += `⚠️  ${highErrorTests.length} tests con alta tasa de errores (>5%)\n`
    }

    const slowTests = results.filter(r => r.averageResponseTime > 2000)
    if (slowTests.length > 0) {
      report += `🐌 ${slowTests.length} tests con respuesta lenta (>2s)\n`
    }

    return report
  }

  /**
   * Limpia recursos y reinicia contadores
   */
  private cleanup(): void {
    this.activeSessions.clear()
    this.completedSessions.clear()
    this.errors = []
    this.responseTimeTracker = []
    this.memoryTracker = []
    this.concurrencyTracker = []
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Función de utilidad para ejecutar desde CLI
export async function runStressTestFromCLI() {
  const runner = new StressTestRunner()

  // Ejemplo de configuración
  const testCase: FlowTestCase = {
    id: 'stress-simple',
    name: 'Test de Estrés Simple',
    description: 'Flujo básico de saludo y navegación',
    category: FlowCategory.INTEGRATION,
    priority: TestPriority.HIGH,
    tags: ['stress', 'basic'],
    steps: [
      {
        stepNumber: 1,
        description: 'Saludo inicial',
        userMessage: 'Hola',
        expectedResponse: { contains: ['teléfono', 'confirmar'] }
      },
      {
        stepNumber: 2,
        description: 'Confirmar teléfono',
        userMessage: '1',
        expectedResponse: { contains: ['nombre'] }
      }
    ]
  }

  const config: StressTestConfig = {
    concurrentUsers: 50,
    messagesPerUser: 2,
    duration: 60000,
    rampUpTime: 10000,
    rampDownTime: 5000,
    targetThroughput: 100
  }

  try {
    console.log('🚀 Iniciando stress test desde CLI...')
    const result = await runner.runStressTest(testCase, config)
    
    const report = runner.generateStressReport([result])
    console.log(report)
    
  } catch (error) {
    console.error('💥 Error en stress test:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runStressTestFromCLI()
}

import { FlowCategory, TestPriority } from '../types/test-types'
