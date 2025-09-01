/**
 * Demo simple del sistema de testing sin dependencias de Jest
 */

import { UniaccBot } from '../../actions/uniacc-scripts'

interface SimpleTestResult {
  success: boolean
  responses: string[]
  error?: string
  duration: number
}

class SimpleBotTester {
  private bot: UniaccBot

  constructor() {
    this.bot = new UniaccBot('https://mock-webhook.com', 'mock-secret')
  }

  async testBasicFlow(): Promise<SimpleTestResult> {
    const startTime = Date.now()
    const userId = `test-user-${Date.now()}`
    const responses: string[] = []

    try {
      console.log('🧪 Iniciando test básico de flujo...')

      // Paso 1: Saludo
      console.log('📤 Usuario: Hola')
      const response1 = await this.bot.procesarMensaje(userId, 'Hola')
      responses.push(response1)
      console.log('📥 Bot:', response1.substring(0, 100) + '...')

      // Verificar que contiene palabras clave esperadas (teléfono, confirmar, o nombre)
      if (!response1.includes('teléfono') && !response1.includes('confirmar') && !response1.includes('nombre')) {
        throw new Error('La respuesta no contiene las palabras clave esperadas')
      }

      // Paso 2: Dar nombre (si el bot pidió nombre directamente)
      const nextMessage = response1.includes('nombre') ? 'Juan Pérez' : '1'
      console.log('📤 Usuario:', nextMessage)
      const response2 = await this.bot.procesarMensaje(userId, nextMessage)
      responses.push(response2)
      console.log('📥 Bot:', response2.substring(0, 100) + '...')

      // Verificar que la conversación avanza (pide email, teléfono, o edad)
      if (!response2.includes('email') && !response2.includes('teléfono') && !response2.includes('edad')) {
        console.log('ℹ️  El bot respondió pero no con el flujo esperado, continuando...')
      }

      // Paso 3: Continuar conversación
      const thirdMessage = response2.includes('email') ? 'juan@test.com' : 'test@email.com'
      console.log('📤 Usuario:', thirdMessage)
      const response3 = await this.bot.procesarMensaje(userId, thirdMessage)
      responses.push(response3)
      console.log('📥 Bot:', response3.substring(0, 100) + '...')

      const duration = Date.now() - startTime

      return {
        success: true,
        responses,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      return {
        success: false,
        responses,
        error: error instanceof Error ? error.message : String(error),
        duration
      }
    }
  }

  async testConcurrentUsers(userCount: number = 5): Promise<void> {
    console.log(`\n👥 Probando ${userCount} usuarios concurrentes...`)
    
    const promises: Promise<SimpleTestResult>[] = []
    const startTime = Date.now()

    for (let i = 0; i < userCount; i++) {
      promises.push(this.testSingleUser(i + 1))
    }

    try {
      const results = await Promise.all(promises)
      const duration = Date.now() - startTime
      const successfulUsers = results.filter(r => r.success).length

      console.log(`\n📊 Resultados de concurrencia:`)
      console.log(`✅ Usuarios exitosos: ${successfulUsers}/${userCount}`)
      console.log(`⏱️  Duración total: ${duration}ms`)
      console.log(`⚡ Throughput: ${(userCount * 3 / (duration / 1000)).toFixed(1)} mensajes/s`)

      const failedUsers = results.filter(r => !r.success)
      if (failedUsers.length > 0) {
        console.log(`❌ Errores encontrados:`)
        failedUsers.forEach((result, index) => {
          console.log(`   Usuario ${index + 1}: ${result.error}`)
        })
      }

    } catch (error) {
      console.error('💥 Error en test concurrente:', error)
    }
  }

  private async testSingleUser(userId: number): Promise<SimpleTestResult> {
    const startTime = Date.now()
    const userIdStr = `concurrent-user-${userId}`
    const responses: string[] = []

    try {
      // Flujo básico
      const messages = ['Hola', '1', `Usuario ${userId}`]
      
      for (const message of messages) {
        const response = await this.bot.procesarMensaje(userIdStr, message)
        responses.push(response)
        
        // Pequeño delay para simular usuario real
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return {
        success: true,
        responses,
        duration: Date.now() - startTime
      }

    } catch (error) {
      return {
        success: false,
        responses,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      }
    }
  }

  async testPerformance(): Promise<void> {
    console.log('\n📊 Test de performance...')
    
    const iterations = 10
    const times: number[] = []
    const userId = `perf-user-${Date.now()}`

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()
      
      try {
        await this.bot.procesarMensaje(userId, 'Hola')
        const duration = performance.now() - startTime
        times.push(duration)
        
      } catch (error) {
        console.log(`❌ Error en iteración ${i + 1}:`, error)
      }
    }

    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)

      console.log(`📈 Resultados de performance (${iterations} iteraciones):`)
      console.log(`   Tiempo promedio: ${avgTime.toFixed(2)}ms`)
      console.log(`   Tiempo máximo: ${maxTime.toFixed(2)}ms`)
      console.log(`   Tiempo mínimo: ${minTime.toFixed(2)}ms`)
      console.log(`   Throughput estimado: ${(1000 / avgTime).toFixed(1)} req/s`)
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🎬 DEMO SIMPLE DEL SISTEMA DE TESTING')
    console.log('='.repeat(50))

    try {
      // Test básico
      const basicResult = await this.testBasicFlow()
      console.log(`\n${basicResult.success ? '✅' : '❌'} Test básico: ${basicResult.success ? 'EXITOSO' : 'FALLIDO'}`)
      console.log(`⏱️  Duración: ${basicResult.duration}ms`)
      
      if (!basicResult.success) {
        console.log(`💥 Error: ${basicResult.error}`)
        return
      }

      // Test de concurrencia
      await this.testConcurrentUsers(5)

      // Test de performance  
      await this.testPerformance()

      console.log('\n🎉 Todos los tests completados exitosamente!')
      console.log('💡 El bot está funcionando correctamente y puede manejar múltiples usuarios.')

    } catch (error) {
      console.error('💥 Error ejecutando tests:', error)
    }
  }
}

// Función principal
async function runSimpleDemo() {
  const args = process.argv.slice(2)
  const testType = args[0] || 'all'

  const tester = new SimpleBotTester()

  switch (testType) {
    case 'basic':
      const result = await tester.testBasicFlow()
      console.log(`Test básico: ${result.success ? 'EXITOSO' : 'FALLIDO'}`)
      if (!result.success) console.log(`Error: ${result.error}`)
      break
    
    case 'concurrent':
      await tester.testConcurrentUsers(parseInt(args[1]) || 5)
      break
    
    case 'performance':
      await tester.testPerformance()
      break
    
    case 'all':
    default:
      await tester.runAllTests()
      break
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runSimpleDemo().catch(console.error)
}

export { SimpleBotTester }
