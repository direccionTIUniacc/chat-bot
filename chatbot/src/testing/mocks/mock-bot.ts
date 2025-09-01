/**
 * Mock avanzado del bot para testing automatizado
 */

import { UniaccBot } from '../../actions/uniacc-scripts'
import { MockBotConfig, PerformanceMetrics, UsuarioState } from '../types/test-types'

export class MockUniaccBot extends UniaccBot {
  private mockConfig: MockBotConfig
  private mockSupabaseData: Map<string, any> = new Map()
  private mockWebhookCalls: any[] = []
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map()
  private callHistory: Map<string, any[]> = new Map()

  constructor(config: MockBotConfig = {}) {
    // Inicializar con configuración mock
    super('https://mock-webhook.com', 'mock-secret')
    
    this.mockConfig = {
      enableLogging: false,
      enableSupabase: false,
      enableWebhooks: false,
      simulateNetworkDelay: false,
      simulateErrors: false,
      errorRate: 0,
      networkDelay: 100,
      memoryTracking: true,
      performanceTracking: true,
      ...config
    }
    
    this.setupMocks()
  }

  // ============================================================================
  // SETUP Y CONFIGURACIÓN
  // ============================================================================

  private setupMocks() {
    this.setupSupabaseMock()
    this.setupLoggingMock()
    this.setupWebhookMock()
  }

  private setupSupabaseMock() {
    if (!this.mockConfig.enableSupabase) {
      // Mock del envío de prospectos
      jest.spyOn(this.supabaseIntegration, 'enviarProspecto').mockImplementation(async (data) => {
        if (this.mockConfig.simulateErrors && Math.random() < (this.mockConfig.errorRate || 0)) {
          return { 
            success: false, 
            error: 'Mock Supabase error: Connection timeout' 
          }
        }
        
        if (this.mockConfig.simulateNetworkDelay) {
          await this.simulateDelay(this.mockConfig.networkDelay || 100)
        }
        
        const id = `prospect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        this.mockSupabaseData.set(id, {
          ...data,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        return { 
          success: true, 
          prospectoId: id,
          data: this.mockSupabaseData.get(id)
        }
      })
    }
  }

  private setupLoggingMock() {
    if (!this.mockConfig.enableLogging) {
      const originalMethods = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error
      }

      // Interceptar pero mantener para debugging si es necesario
      jest.spyOn(console, 'log').mockImplementation((...args) => {
        if (process.env.DEBUG_TESTS) originalMethods.log(...args)
      })
      jest.spyOn(console, 'info').mockImplementation((...args) => {
        if (process.env.DEBUG_TESTS) originalMethods.info(...args)
      })
      jest.spyOn(console, 'warn').mockImplementation((...args) => {
        if (process.env.DEBUG_TESTS) originalMethods.warn(...args)
      })
      // Mantener errores siempre para debugging
      jest.spyOn(console, 'error').mockImplementation(originalMethods.error)
    }
  }

  private setupWebhookMock() {
    if (!this.mockConfig.enableWebhooks) {
      // Mock de llamadas a webhooks si las hubiera
      // Por ahora solo registramos las llamadas
    }
  }

  // ============================================================================
  // MÉTODOS DE TESTING MEJORADOS
  // ============================================================================

  /**
   * Procesa mensaje con métricas de performance
   */
  async procesarMensajeConMetricas(userId: string, mensaje: string): Promise<{
    response: string
    metrics: PerformanceMetrics
  }> {
    const memoryBefore = this.mockConfig.memoryTracking ? process.memoryUsage() : {} as NodeJS.MemoryUsage
    const startTime = performance.now()

    try {
      const response = await this.procesarMensaje(userId, mensaje)
      const endTime = performance.now()
      const memoryAfter = this.mockConfig.memoryTracking ? process.memoryUsage() : {} as NodeJS.MemoryUsage

      const metrics: PerformanceMetrics = {
        responseTime: endTime - startTime,
        memoryBefore,
        memoryAfter,
        memoryDelta: {
          rss: memoryAfter.rss - memoryBefore.rss,
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
          external: memoryAfter.external - memoryBefore.external,
        }
      }

      // Guardar métricas para análisis
      if (!this.performanceMetrics.has(userId)) {
        this.performanceMetrics.set(userId, [])
      }
      this.performanceMetrics.get(userId)!.push(metrics)

      // Guardar historial de llamadas
      this.recordCall(userId, mensaje, response, metrics)

      return { response, metrics }
    } catch (error) {
      const endTime = performance.now()
      const memoryAfter = this.mockConfig.memoryTracking ? process.memoryUsage() : {} as NodeJS.MemoryUsage

      const metrics: PerformanceMetrics = {
        responseTime: endTime - startTime,
        memoryBefore,
        memoryAfter,
        memoryDelta: {
          rss: memoryAfter.rss - memoryBefore.rss,
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
          external: memoryAfter.external - memoryBefore.external,
        }
      }

      throw error
    }
  }

  /**
   * Simula conversación completa con múltiples mensajes
   */
  async simularConversacion(userId: string, mensajes: string[]): Promise<{
    responses: string[]
    finalState: UsuarioState
    totalMetrics: PerformanceMetrics
    conversationFlow: string[]
  }> {
    const responses: string[] = []
    const conversationFlow: string[] = []
    let totalResponseTime = 0
    let memoryStart = process.memoryUsage()

    for (const mensaje of mensajes) {
      const { response, metrics } = await this.procesarMensajeConMetricas(userId, mensaje)
      responses.push(response)
      conversationFlow.push(`USER: ${mensaje}`)
      conversationFlow.push(`BOT: ${response}`)
      totalResponseTime += metrics.responseTime
    }

    const memoryEnd = process.memoryUsage()
    const finalState = this.getInternalState(userId)

    const totalMetrics: PerformanceMetrics = {
      responseTime: totalResponseTime,
      memoryBefore: memoryStart,
      memoryAfter: memoryEnd,
      memoryDelta: {
        rss: memoryEnd.rss - memoryStart.rss,
        heapUsed: memoryEnd.heapUsed - memoryStart.heapUsed,
        heapTotal: memoryEnd.heapTotal - memoryStart.heapTotal,
        external: memoryEnd.external - memoryStart.external,
      }
    }

    return {
      responses,
      finalState,
      totalMetrics,
      conversationFlow
    }
  }

  // ============================================================================
  // MÉTODOS DE INSPECCIÓN Y DEBUG
  // ============================================================================

  /**
   * Obtiene datos mock de Supabase guardados
   */
  getMockSupabaseData(): any[] {
    return Array.from(this.mockSupabaseData.values())
  }

  /**
   * Obtiene llamadas mock a webhooks
   */
  getMockWebhookCalls(): any[] {
    return [...this.mockWebhookCalls]
  }

  /**
   * Obtiene métricas de performance para un usuario
   */
  getPerformanceMetrics(userId: string): PerformanceMetrics[] {
    return this.performanceMetrics.get(userId) || []
  }

  /**
   * Obtiene historial completo de llamadas
   */
  getCallHistory(userId: string): any[] {
    return this.callHistory.get(userId) || []
  }

  /**
   * Obtiene estado interno para testing
   */
  getInternalState(userId: string): UsuarioState {
    return this.getUsuarios().get(userId) || {
      flujo_actual: null,
      paso_actual: null,
      datos_prospecto: {},
      intentos_captura: 0
    }
  }

  /**
   * Establece estado inicial para testing
   */
  setInitialState(userId: string, state: Partial<UsuarioState>) {
    const currentState = this.getInternalState(userId)
    this.getUsuarios().set(userId, { ...currentState, ...state })
  }

  /**
   * Simula usuario existente en BD
   */
  setMockExistingUser(userId: string, userData: any) {
    // Aquí iría el mock de verificarUsuarioExistente si fuera accesible
    // Por ahora guardamos en datos mock
    this.mockSupabaseData.set(`existing-${userId}`, userData)
  }

  // ============================================================================
  // MÉTODOS DE LIMPIEZA Y RESET
  // ============================================================================

  /**
   * Limpia todos los datos mock
   */
  clearMockData() {
    this.mockSupabaseData.clear()
    this.mockWebhookCalls.length = 0
    this.performanceMetrics.clear()
    this.callHistory.clear()
  }

  /**
   * Resetea completamente el mock
   */
  resetMock() {
    this.clearMockData()
    this.getUsuarios().clear()
    jest.clearAllMocks()
  }

  /**
   * Resetea solo un usuario específico
   */
  resetUser(userId: string) {
    this.getUsuarios().delete(userId)
    this.performanceMetrics.delete(userId)
    this.callHistory.delete(userId)
  }

  // ============================================================================
  // MÉTODOS DE SIMULACIÓN AVANZADA
  // ============================================================================

  /**
   * Simula timeout de forma controlada
   */
  async simulateTimeout(userId: string): Promise<string> {
    return await this.forceTimeout(userId)
  }

  /**
   * Simula delay de red
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Simula error de red
   */
  simulateNetworkError(): void {
    throw new Error('Mock network error: Connection refused')
  }

  // ============================================================================
  // MÉTODOS DE VALIDACIÓN
  // ============================================================================

  /**
   * Verifica si se guardaron datos
   */
  hasDataBeenSaved(): boolean {
    return this.mockSupabaseData.size > 0
  }

  /**
   * Obtiene último dato guardado
   */
  getLastSavedData(): any {
    const values = Array.from(this.mockSupabaseData.values())
    return values[values.length - 1] || null
  }

  /**
   * Verifica si un flujo específico fue ejecutado
   */
  hasFlowBeenExecuted(userId: string, flow: string): boolean {
    const state = this.getInternalState(userId)
    const history = this.getCallHistory(userId)
    
    return state.flujo_actual === flow || 
           history.some(call => call.state?.flujo_actual === flow)
  }

  /**
   * Cuenta cuántos mensajes ha procesado un usuario
   */
  getMessageCount(userId: string): number {
    return this.getCallHistory(userId).length
  }

  // ============================================================================
  // MÉTODOS PRIVADOS DE SOPORTE
  // ============================================================================

  private recordCall(userId: string, userMessage: string, botResponse: string, metrics: PerformanceMetrics) {
    if (!this.callHistory.has(userId)) {
      this.callHistory.set(userId, [])
    }

    this.callHistory.get(userId)!.push({
      timestamp: new Date(),
      userMessage,
      botResponse,
      state: this.getInternalState(userId),
      metrics,
      dataSnapshot: this.getLastSavedData()
    })
  }

  // ============================================================================
  // GETTERS PARA CONFIGURACIÓN
  // ============================================================================

  get config(): MockBotConfig {
    return { ...this.mockConfig }
  }

  get isLoggingEnabled(): boolean {
    return this.mockConfig.enableLogging || false
  }

  get isSupabaseEnabled(): boolean {
    return this.mockConfig.enableSupabase || false
  }

  get errorRate(): number {
    return this.mockConfig.errorRate || 0
  }
}
