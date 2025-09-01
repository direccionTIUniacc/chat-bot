/**
 * Ejecutor interactivo para testing y debugging en tiempo real
 * Permite interactuar manualmente con el bot y ver métricas en vivo
 */

import * as readline from 'readline'
import { FlowTester } from '../framework/flow-tester'
import { MockUniaccBot } from '../mocks/mock-bot'
import { FlowTestCase, PerformanceMetrics } from '../types/test-types'
import { capturaInicialTestCases } from '../fixtures/flow-test-cases/captura-inicial'
import { menuPrincipalTestCases } from '../fixtures/flow-test-cases/menu-principal'

interface InteractiveSession {
  userId: string
  bot: MockUniaccBot
  tester: FlowTester
  startTime: Date
  messageCount: number
  totalResponseTime: number
  errors: string[]
}

export class InteractiveTestRunner {
  private rl: readline.Interface
  private session: InteractiveSession | null = null
  private debugMode: boolean = false
  private performanceMode: boolean = false

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 UNIACC-BOT> '
    })
  }

  /**
   * Inicia sesión interactiva
   */
  async startInteractiveSession(): Promise<void> {
    this.showWelcome()
    this.createNewSession()
    this.setupHandlers()
    
    console.log('\n🎯 Sesión interactiva iniciada. Escribe "help" para ver comandos disponibles.')
    this.rl.prompt()
  }

  /**
   * Muestra mensaje de bienvenida
   */
  private showWelcome(): void {
    console.clear()
    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║              🧪 UNIACC BOT - TESTING INTERACTIVO          ║')
    console.log('║                                                          ║')
    console.log('║  Herramienta para testing manual y debugging del bot    ║')
    console.log('║  • Interacción en tiempo real                           ║')
    console.log('║  • Métricas de performance                               ║')
    console.log('║  • Debugging de estados internos                        ║')
    console.log('║  • Ejecución de tests predefinidos                      ║')
    console.log('╚══════════════════════════════════════════════════════════╝')
  }

  /**
   * Crea nueva sesión de testing
   */
  private createNewSession(): void {
    const userId = `interactive-${Date.now()}`
    const bot = new MockUniaccBot({
      enableLogging: this.debugMode,
      enableSupabase: false,
      memoryTracking: true,
      performanceTracking: true,
      simulateNetworkDelay: false
    })
    
    const tester = new FlowTester()

    this.session = {
      userId,
      bot,
      tester,
      startTime: new Date(),
      messageCount: 0,
      totalResponseTime: 0,
      errors: []
    }

    console.log(`\n✅ Nueva sesión creada: ${userId}`)
  }

  /**
   * Configura manejadores de entrada
   */
  private setupHandlers(): void {
    this.rl.on('line', async (input: string) => {
      const trimmedInput = input.trim()
      
      if (trimmedInput.startsWith('/')) {
        await this.handleCommand(trimmedInput)
      } else if (trimmedInput.length > 0) {
        await this.handleUserMessage(trimmedInput)
      }
      
      this.rl.prompt()
    })

    this.rl.on('close', () => {
      console.log('\n👋 Sesión interactiva finalizada.')
      this.showSessionSummary()
      process.exit(0)
    })
  }

  /**
   * Maneja comandos especiales
   */
  private async handleCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.slice(1).split(' ')

    switch (cmd.toLowerCase()) {
      case 'help':
        this.showHelp()
        break

      case 'debug':
        this.debugMode = !this.debugMode
        console.log(`🔧 Modo debug: ${this.debugMode ? 'ON' : 'OFF'}`)
        break

      case 'performance':
        this.performanceMode = !this.performanceMode
        console.log(`📊 Modo performance: ${this.performanceMode ? 'ON' : 'OFF'}`)
        break

      case 'state':
        this.showCurrentState()
        break

      case 'stats':
        this.showSessionStats()
        break

      case 'data':
        this.showSavedData()
        break

      case 'reset':
        this.resetSession()
        break

      case 'test':
        await this.runPredefinedTest(args[0])
        break

      case 'flow':
        await this.runFlowTest(args[0])
        break

      case 'stress':
        await this.runQuickStressTest(parseInt(args[0]) || 10)
        break

      case 'memory':
        this.showMemoryUsage()
        break

      case 'export':
        await this.exportSession(args[0] || 'session')
        break

      case 'clear':
        console.clear()
        this.showWelcome()
        break

      case 'exit':
      case 'quit':
        this.rl.close()
        break

      default:
        console.log(`❓ Comando desconocido: ${cmd}. Escribe "/help" para ver comandos disponibles.`)
    }
  }

  /**
   * Maneja mensajes del usuario al bot
   */
  private async handleUserMessage(message: string): Promise<void> {
    if (!this.session) {
      console.log('❌ No hay sesión activa. Error interno.')
      return
    }

    const startTime = performance.now()

    try {
      console.log(`\n📤 Usuario: ${message}`)
      
      const { response, metrics } = await this.session.bot.procesarMensajeConMetricas(
        this.session.userId,
        message
      )

      const endTime = performance.now()
      const responseTime = endTime - startTime

      this.session.messageCount++
      this.session.totalResponseTime += responseTime

      console.log(`📥 Bot: ${response}`)

      if (this.performanceMode) {
        console.log(`⏱️  Tiempo de respuesta: ${responseTime.toFixed(2)}ms`)
        console.log(`🧠 Memoria: ${(metrics.memoryAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      }

      if (this.debugMode) {
        this.showDebugInfo(metrics)
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.session.errors.push(errorMsg)
      console.log(`💥 Error: ${errorMsg}`)
    }
  }

  /**
   * Muestra ayuda de comandos
   */
  private showHelp(): void {
    console.log('\n📚 COMANDOS DISPONIBLES:')
    console.log('━'.repeat(50))
    console.log('  /help          - Muestra esta ayuda')
    console.log('  /debug         - Activa/desactiva modo debug')
    console.log('  /performance   - Activa/desactiva métricas de performance')
    console.log('  /state         - Muestra estado interno del bot')
    console.log('  /stats         - Muestra estadísticas de la sesión')
    console.log('  /data          - Muestra datos guardados')
    console.log('  /reset         - Reinicia la sesión')
    console.log('  /test <nombre> - Ejecuta test predefinido')
    console.log('  /flow <flujo>  - Ejecuta flujo específico')
    console.log('  /stress <num>  - Ejecuta stress test rápido')
    console.log('  /memory        - Muestra uso de memoria')
    console.log('  /export <file> - Exporta sesión a archivo')
    console.log('  /clear         - Limpia pantalla')
    console.log('  /exit          - Salir')
    console.log('\n💡 Simplemente escribe un mensaje para interactuar con el bot.')
  }

  /**
   * Muestra estado actual del bot
   */
  private showCurrentState(): void {
    if (!this.session) return

    const state = this.session.bot.getInternalState(this.session.userId)
    
    console.log('\n🔍 ESTADO INTERNO DEL BOT:')
    console.log('━'.repeat(40))
    console.log(`  Flujo actual: ${state.flujo_actual || 'null'}`)
    console.log(`  Paso actual: ${state.paso_actual || 'null'}`)
    console.log(`  Opción menú: ${state.opcion_menu_seleccionada || 'ninguna'}`)
    console.log(`  Usuario recurrente: ${state.es_usuario_recurrente ? 'Sí' : 'No'}`)
    console.log(`  Intentos captura: ${state.intentos_captura}`)
    
    if (state.datos_prospecto && Object.keys(state.datos_prospecto).length > 0) {
      console.log('\n👤 Datos del prospecto:')
      Object.entries(state.datos_prospecto).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          console.log(`    ${key}: ${value}`)
        }
      })
    }

    if (state.facultad_seleccionada) {
      console.log(`\n🏫 Facultad seleccionada: ${state.facultad_seleccionada}`)
    }
    
    if (state.carrera_seleccionada) {
      console.log(`🎓 Carrera seleccionada: ${state.carrera_seleccionada}`)
    }
  }

  /**
   * Muestra estadísticas de la sesión
   */
  private showSessionStats(): void {
    if (!this.session) return

    const duration = Date.now() - this.session.startTime.getTime()
    const avgResponseTime = this.session.messageCount > 0 ? 
      this.session.totalResponseTime / this.session.messageCount : 0

    console.log('\n📊 ESTADÍSTICAS DE LA SESIÓN:')
    console.log('━'.repeat(40))
    console.log(`  Duración: ${(duration / 1000).toFixed(1)}s`)
    console.log(`  Mensajes enviados: ${this.session.messageCount}`)
    console.log(`  Tiempo promedio respuesta: ${avgResponseTime.toFixed(2)}ms`)
    console.log(`  Errores: ${this.session.errors.length}`)
    console.log(`  Datos guardados: ${this.session.bot.hasDataBeenSaved() ? 'Sí' : 'No'}`)
    
    const metrics = this.session.bot.getPerformanceMetrics(this.session.userId)
    if (metrics.length > 0) {
      const totalMemory = metrics.reduce((sum, m) => sum + m.memoryDelta.heapUsed, 0)
      console.log(`  Memoria total utilizada: ${(totalMemory / 1024 / 1024).toFixed(2)}MB`)
    }
  }

  /**
   * Muestra datos guardados
   */
  private showSavedData(): void {
    if (!this.session) return

    const savedData = this.session.bot.getMockSupabaseData()
    
    console.log('\n💾 DATOS GUARDADOS:')
    console.log('━'.repeat(30))
    
    if (savedData.length === 0) {
      console.log('  No hay datos guardados')
      return
    }

    savedData.forEach((data, index) => {
      console.log(`\n📋 Registro ${index + 1}:`)
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`    ${key}: ${value}`)
        }
      })
    })
  }

  /**
   * Muestra información de debug
   */
  private showDebugInfo(metrics: PerformanceMetrics): void {
    console.log('\n🔧 DEBUG INFO:')
    console.log(`    Memory delta: ${(metrics.memoryDelta.heapUsed / 1024).toFixed(2)}KB`)
    console.log(`    Response time: ${metrics.responseTime.toFixed(2)}ms`)
  }

  /**
   * Reinicia la sesión
   */
  private resetSession(): void {
    console.log('\n🔄 Reiniciando sesión...')
    this.createNewSession()
    console.log('✅ Sesión reiniciada')
  }

  /**
   * Ejecuta test predefinido
   */
  private async runPredefinedTest(testName?: string): Promise<void> {
    if (!this.session) return

    const availableTests = new Map([
      ['captura-inicial', capturaInicialTestCases[0]],
      ['menu-principal', menuPrincipalTestCases[0]],
      ['telefono-manual', capturaInicialTestCases[1]]
    ])

    if (!testName) {
      console.log('\n🧪 Tests disponibles:')
      Array.from(availableTests.keys()).forEach(name => {
        console.log(`  - ${name}`)
      })
      return
    }

    const testCase = availableTests.get(testName)
    if (!testCase) {
      console.log(`❌ Test "${testName}" no encontrado`)
      return
    }

    console.log(`\n🚀 Ejecutando test: ${testCase.name}`)
    
    try {
      // Resetear usuario para el test
      this.session.bot.resetUser(this.session.userId)
      
      const result = await this.session.tester.runFlowTest(testCase)
      
      console.log(`\n${result.success ? '✅' : '❌'} Test ${result.success ? 'exitoso' : 'fallido'}`)
      console.log(`⏱️  Duración: ${result.duration}ms`)
      console.log(`📊 Pasos: ${result.stepsExecuted}/${result.stepsTotal}`)
      
      if (!result.success && result.error) {
        console.log(`💥 Error: ${result.error}`)
      }
      
    } catch (error) {
      console.log(`💥 Error ejecutando test: ${error}`)
    }
  }

  /**
   * Ejecuta stress test rápido
   */
  private async runQuickStressTest(users: number): Promise<void> {
    console.log(`\n🚀 Ejecutando stress test rápido con ${users} usuarios...`)
    
    const { StressTestRunner } = await import('./stress-runner')
    const runner = new StressTestRunner()
    
    const testCase: FlowTestCase = {
      id: 'quick-stress',
      name: 'Quick Stress Test',
      description: 'Test rápido de estrés',
      category: 'integration' as any,
      priority: 'medium' as any,
      tags: ['stress'],
      steps: [
        {
          stepNumber: 1,
          description: 'Saludo',
          userMessage: 'Hola',
          expectedResponse: { contains: ['teléfono'] }
        }
      ]
    }

    try {
      const result = await runner.runStressTest(testCase, {
        concurrentUsers: users,
        messagesPerUser: 1,
        duration: 10000,
        rampUpTime: 2000,
        rampDownTime: 1000,
        targetThroughput: users * 2
      })

      console.log(`\n📊 Resultados del stress test:`)
      console.log(`  ✅ Sesiones exitosas: ${result.successfulSessions}/${result.totalUsers}`)
      console.log(`  ⚡ Throughput: ${result.throughput.toFixed(1)} msg/s`)
      console.log(`  🕐 Tiempo promedio: ${result.averageResponseTime.toFixed(0)}ms`)
      console.log(`  ❌ Tasa de error: ${(result.errorRate * 100).toFixed(1)}%`)
      
    } catch (error) {
      console.log(`💥 Error en stress test: ${error}`)
    }
  }

  /**
   * Muestra uso de memoria
   */
  private showMemoryUsage(): void {
    const usage = process.memoryUsage()
    
    console.log('\n🧠 USO DE MEMORIA:')
    console.log('━'.repeat(25))
    console.log(`  RSS: ${(usage.rss / 1024 / 1024).toFixed(2)}MB`)
    console.log(`  Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    console.log(`  Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`)
    console.log(`  External: ${(usage.external / 1024 / 1024).toFixed(2)}MB`)
  }

  /**
   * Exporta sesión a archivo
   */
  private async exportSession(filename: string): Promise<void> {
    if (!this.session) return

    const sessionData = {
      userId: this.session.userId,
      startTime: this.session.startTime,
      duration: Date.now() - this.session.startTime.getTime(),
      messageCount: this.session.messageCount,
      totalResponseTime: this.session.totalResponseTime,
      errors: this.session.errors,
      state: this.session.bot.getInternalState(this.session.userId),
      savedData: this.session.bot.getMockSupabaseData(),
      callHistory: this.session.bot.getCallHistory(this.session.userId),
      performanceMetrics: this.session.bot.getPerformanceMetrics(this.session.userId)
    }

    try {
      const fs = await import('fs/promises')
      const filepath = `${filename}-${Date.now()}.json`
      await fs.writeFile(filepath, JSON.stringify(sessionData, null, 2))
      console.log(`💾 Sesión exportada a: ${filepath}`)
    } catch (error) {
      console.log(`❌ Error exportando sesión: ${error}`)
    }
  }

  /**
   * Muestra resumen de la sesión al salir
   */
  private showSessionSummary(): void {
    if (!this.session) return

    console.log('\n📋 RESUMEN DE LA SESIÓN:')
    console.log('═'.repeat(40))
    this.showSessionStats()
    
    if (this.session.errors.length > 0) {
      console.log('\n❌ Errores encontrados:')
      this.session.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }
    
    console.log('\n🎯 ¡Gracias por usar el testing interactivo!')
  }
}

// Función para ejecutar desde CLI
export async function runInteractiveFromCLI() {
  const runner = new InteractiveTestRunner()
  await runner.startInteractiveSession()
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runInteractiveFromCLI().catch(console.error)
}
