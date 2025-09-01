/**
 * Ejemplo completo de uso del sistema de testing
 * Demuestra todas las capacidades del framework
 */

import { FlowTestRunner } from '../runners/flow-runner'
import { StressTestRunner } from '../runners/stress-runner'
import { InteractiveTestRunner } from '../runners/interactive-runner'
import { PerformanceMonitor } from '../utils/performance-monitor'
import { FlowTester } from '../framework/flow-tester'
import { MockUniaccBot } from '../mocks/mock-bot'
import { 
  FlowTestCase, 
  StressTestConfig, 
  FlowCategory, 
  TestPriority 
} from '../types/test-types'

export class CompleteTestingDemo {
  
  /**
   * Demo 1: Test básico de un flujo
   */
  static async demoBasicFlowTest(): Promise<void> {
    console.log('\n🎯 DEMO 1: Test Básico de Flujo')
    console.log('='.repeat(40))
    
    const tester = new FlowTester()
    
    const testCase: FlowTestCase = {
      id: 'demo-basic',
      name: 'Demo - Flujo Básico',
      description: 'Prueba básica de saludo y navegación',
      category: FlowCategory.ONBOARDING,
      priority: TestPriority.HIGH,
      tags: ['demo', 'basic'],
      steps: [
        {
          stepNumber: 1,
          description: 'Usuario saluda',
          userMessage: 'Hola',
          expectedResponse: {
            contains: ['teléfono', 'confirmar', '1️⃣', '2️⃣', '3️⃣']
          },
          expectedState: {
            flujo_actual: 'captura_inicial',
            paso_actual: 'confirmar_telefono'
          }
        },
        {
          stepNumber: 2,
          description: 'Usuario confirma teléfono',
          userMessage: '1',
          expectedResponse: {
            contains: ['Perfecto', 'nombre completo']
          },
          expectedState: {
            paso_actual: 'solicitar_nombre'
          },
          customAssertions: ['should_have_prospecto_id']
        }
      ]
    }
    
    try {
      const result = await tester.runFlowTest(testCase)
      
      console.log(`${result.success ? '✅' : '❌'} Test ${result.success ? 'EXITOSO' : 'FALLIDO'}`)
      console.log(`⏱️  Duración: ${result.duration}ms`)
      console.log(`📊 Pasos ejecutados: ${result.stepsExecuted}/${result.stepsTotal}`)
      
      if (result.dataSaved) {
        console.log(`💾 Datos guardados: ✅`)
      }
      
      if (!result.success) {
        console.log(`💥 Error: ${result.error}`)
        result.stepResults.forEach(step => {
          if (!step.success) {
            console.log(`   - Paso ${step.stepNumber}: ${step.error}`)
          }
        })
      }
      
    } catch (error) {
      console.error('Error en demo básico:', error)
    }
  }

  /**
   * Demo 2: Testing de múltiples usuarios concurrentes
   */
  static async demoConcurrentTesting(): Promise<void> {
    console.log('\n🚀 DEMO 2: Testing Concurrente')
    console.log('='.repeat(40))
    
    const monitor = new PerformanceMonitor(500) // Actualizar cada 500ms
    monitor.start()
    
    // Simular múltiples usuarios
    const userPromises: Promise<void>[] = []
    const numberOfUsers = 5
    
    for (let i = 0; i < numberOfUsers; i++) {
      userPromises.push(this.simulateUserSession(i + 1, monitor))
    }
    
    console.log(`👥 Simulando ${numberOfUsers} usuarios concurrentes...`)
    
    try {
      await Promise.all(userPromises)
      
      monitor.stop()
      const report = monitor.generateReport()
      
      console.log('\n📊 RESULTADOS CONCURRENCIA:')
      console.log(`⚡ Throughput: ${report.performance.throughput.toFixed(1)} req/s`)
      console.log(`🕐 Tiempo promedio: ${report.performance.averageResponseTime.toFixed(0)}ms`)
      console.log(`📈 P95: ${report.performance.p95ResponseTime.toFixed(0)}ms`)
      console.log(`❌ Tasa de error: ${report.performance.errorRate.toFixed(1)}%`)
      console.log(`🧠 Memoria pico: ${(report.resources.peakMemoryUsage).toFixed(1)}%`)
      
    } catch (error) {
      console.error('Error en demo concurrente:', error)
    }
  }

  /**
   * Demo 3: Stress Testing
   */
  static async demoStressTesting(): Promise<void> {
    console.log('\n💪 DEMO 3: Stress Testing')
    console.log('='.repeat(40))
    
    const stressRunner = new StressTestRunner()
    
    const testCase: FlowTestCase = {
      id: 'stress-demo',
      name: 'Demo - Stress Test',
      description: 'Test de estrés con múltiples usuarios',
      category: FlowCategory.INTEGRATION,
      priority: TestPriority.CRITICAL,
      tags: ['stress', 'demo'],
      steps: [
        {
          stepNumber: 1,
          description: 'Saludo inicial',
          userMessage: 'Hola',
          expectedResponse: { contains: ['teléfono'] }
        },
        {
          stepNumber: 2,
          description: 'Confirmar teléfono',
          userMessage: '1',
          expectedResponse: { contains: ['nombre'] }
        },
        {
          stepNumber: 3,
          description: 'Proporcionar nombre',
          userMessage: 'Usuario Demo',
          expectedResponse: { contains: ['email'] }
        }
      ]
    }
    
    const config: StressTestConfig = {
      concurrentUsers: 20,
      messagesPerUser: 3,
      duration: 15000, // 15 segundos
      rampUpTime: 3000, // 3 segundos para alcanzar max usuarios
      rampDownTime: 1000,
      targetThroughput: 60 // 60 mensajes por segundo
    }
    
    try {
      console.log(`🚀 Iniciando stress test: ${config.concurrentUsers} usuarios...`)
      
      const result = await stressRunner.runStressTest(testCase, config)
      
      console.log('\n💪 RESULTADOS STRESS TEST:')
      console.log(`✅ Sesiones exitosas: ${result.successfulSessions}/${result.totalUsers}`)
      console.log(`❌ Sesiones fallidas: ${result.failedSessions}`)
      console.log(`⚡ Throughput: ${result.throughput.toFixed(1)} msg/s`)
      console.log(`🕐 Tiempo respuesta promedio: ${result.averageResponseTime.toFixed(0)}ms`)
      console.log(`📈 Tiempo respuesta máximo: ${result.maxResponseTime.toFixed(0)}ms`)
      console.log(`👥 Pico de concurrencia: ${result.concurrencyMetrics.peakConcurrentUsers}`)
      
      if (result.errors.length > 0) {
        console.log(`🚨 Errores encontrados: ${result.errors.length}`)
        result.errors.slice(0, 3).forEach(error => {
          console.log(`   • ${error.error}`)
        })
      }
      
    } catch (error) {
      console.error('Error en demo de stress:', error)
    }
  }

  /**
   * Demo 4: Pipeline completo de testing
   */
  static async demoCompletePipeline(): Promise<void> {
    console.log('\n🎯 DEMO 4: Pipeline Completo')
    console.log('='.repeat(40))
    
    const runner = new FlowTestRunner()
    
    const config = {
      mode: 'full' as const,
      enableMonitoring: true,
      generateReport: true,
      exportResults: true,
      maxConcurrency: 3
    }
    
    try {
      console.log('🚀 Ejecutando pipeline completo de testing...')
      
      const results = await runner.runFullTestSuite(config)
      
      console.log('\n🎉 PIPELINE COMPLETADO:')
      console.log(`📊 Tests ejecutados: ${results.summary.totalTests}`)
      console.log(`✅ Tests exitosos: ${results.summary.passedTests}`)
      console.log(`❌ Tests fallidos: ${results.summary.failedTests}`)
      console.log(`📈 Tasa de éxito: ${results.summary.successRate.toFixed(1)}%`)
      console.log(`⏱️  Duración total: ${(results.totalDuration / 1000).toFixed(1)}s`)
      
      if (results.performanceReport) {
        console.log('\n🔧 MÉTRICAS DE PERFORMANCE:')
        const perf = results.performanceReport.performance
        console.log(`⚡ Throughput: ${perf.throughput.toFixed(1)} req/s`)
        console.log(`🕐 Tiempo promedio: ${perf.averageResponseTime.toFixed(0)}ms`)
        console.log(`🧠 Memoria pico: ${results.performanceReport.resources.peakMemoryUsage.toFixed(1)}%`)
      }
      
      console.log('\n💡 RECOMENDACIONES:')
      results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
      
    } catch (error) {
      console.error('Error en pipeline completo:', error)
    }
  }

  /**
   * Demo 5: Comparación de performance entre diferentes cargas
   */
  static async demoPerformanceComparison(): Promise<void> {
    console.log('\n📊 DEMO 5: Comparación de Performance')
    console.log('='.repeat(40))
    
    const stressRunner = new StressTestRunner()
    
    const testCase: FlowTestCase = {
      id: 'perf-comparison',
      name: 'Performance Comparison',
      description: 'Comparación de performance con diferentes cargas',
      category: FlowCategory.INTEGRATION,
      priority: TestPriority.HIGH,
      tags: ['performance', 'comparison'],
      steps: [
        {
          stepNumber: 1,
          description: 'Interacción básica',
          userMessage: 'Hola',
          expectedResponse: { contains: ['teléfono'] }
        }
      ]
    }
    
    const userCounts = [5, 10, 20, 30]
    const results: any[] = []
    
    for (const userCount of userCounts) {
      console.log(`\n🧪 Probando con ${userCount} usuarios...`)
      
      const config: StressTestConfig = {
        concurrentUsers: userCount,
        messagesPerUser: 1,
        duration: 10000,
        rampUpTime: 2000,
        rampDownTime: 500,
        targetThroughput: userCount * 2
      }
      
      try {
        const result = await stressRunner.runStressTest(testCase, config)
        results.push({
          users: userCount,
          throughput: result.throughput,
          avgResponseTime: result.averageResponseTime,
          errorRate: result.errorRate,
          successRate: (result.successfulSessions / result.totalUsers) * 100
        })
        
        console.log(`   ⚡ ${result.throughput.toFixed(1)} req/s`)
        console.log(`   🕐 ${result.averageResponseTime.toFixed(0)}ms avg`)
        console.log(`   ✅ ${((result.successfulSessions / result.totalUsers) * 100).toFixed(1)}% éxito`)
        
      } catch (error) {
        console.error(`Error con ${userCount} usuarios:`, error)
      }
      
      // Cooldown entre tests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Mostrar comparación
    console.log('\n📈 COMPARACIÓN DE RESULTADOS:')
    console.log('Usuarios | Throughput | Resp.Time | Éxito%')
    console.log('-'.repeat(45))
    
    results.forEach(result => {
      console.log(
        `${result.users.toString().padStart(8)} | ` +
        `${result.throughput.toFixed(1).padStart(10)} | ` +
        `${result.avgResponseTime.toFixed(0).padStart(9)} | ` +
        `${result.successRate.toFixed(1).padStart(6)}`
      )
    })
    
    // Encontrar punto óptimo
    const optimalResult = results.reduce((best, current) => {
      const currentScore = current.throughput * (current.successRate / 100) / Math.max(current.avgResponseTime / 1000, 1)
      const bestScore = best.throughput * (best.successRate / 100) / Math.max(best.avgResponseTime / 1000, 1)
      return currentScore > bestScore ? current : best
    })
    
    console.log(`\n🏆 CONFIGURACIÓN ÓPTIMA: ${optimalResult.users} usuarios concurrentes`)
  }

  /**
   * Simula una sesión de usuario individual
   */
  private static async simulateUserSession(userId: number, monitor: PerformanceMonitor): Promise<void> {
    const bot = new MockUniaccBot({
      enableLogging: false,
      simulateNetworkDelay: true,
      networkDelay: 50 + Math.random() * 100 // 50-150ms de delay
    })
    
    const userIdStr = `concurrent-user-${userId}`
    const messages = ['Hola', '1', 'Usuario Concurrente', 'test@email.com']
    
    try {
      for (const message of messages) {
        const startTime = performance.now()
        
        await bot.procesarMensaje(userIdStr, message)
        
        const responseTime = performance.now() - startTime
        monitor.recordResponseTime(responseTime)
        monitor.updateActiveConnections(userId) // Simular conexión activa
        
        // Delay aleatorio entre mensajes
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      }
      
    } catch (error) {
      monitor.recordError()
      console.log(`❌ Error en usuario ${userId}:`, error)
    }
  }

  /**
   * Ejecuta todos los demos
   */
  static async runAllDemos(): Promise<void> {
    console.log('🎬 EJECUTANDO TODOS LOS DEMOS DEL SISTEMA DE TESTING')
    console.log('='.repeat(60))
    
    try {
      await this.demoBasicFlowTest()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await this.demoConcurrentTesting()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await this.demoStressTesting()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await this.demoPerformanceComparison()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Pipeline completo al final (más intensivo)
      await this.demoCompletePipeline()
      
      console.log('\n🎉 TODOS LOS DEMOS COMPLETADOS EXITOSAMENTE!')
      console.log('\n💡 El sistema de testing está listo para usar en producción.')
      
    } catch (error) {
      console.error('💥 Error ejecutando demos:', error)
    }
  }
}

// Función para ejecutar desde CLI
export async function runTestingDemo() {
  const args = process.argv.slice(2)
  const demo = args[0] || 'all'
  
  switch (demo) {
    case 'basic':
      await CompleteTestingDemo.demoBasicFlowTest()
      break
    case 'concurrent':
      await CompleteTestingDemo.demoConcurrentTesting()
      break
    case 'stress':
      await CompleteTestingDemo.demoStressTesting()
      break
    case 'pipeline':
      await CompleteTestingDemo.demoCompletePipeline()
      break
    case 'performance':
      await CompleteTestingDemo.demoPerformanceComparison()
      break
    case 'all':
    default:
      await CompleteTestingDemo.runAllDemos()
      break
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTestingDemo().catch(console.error)
}
