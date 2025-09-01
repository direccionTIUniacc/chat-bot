/**
 * Framework principal para testing de flujos conversacionales
 */

import { MockUniaccBot } from '../mocks/mock-bot'
import { 
  FlowTestCase, 
  FlowTestResult, 
  StepTestResult, 
  AssertionResult,
  AssertionType,
  TestReport,
  TestSuite,
  PerformanceMetrics
} from '../types/test-types'
import { TEST_CONFIG } from '../config/test-environment'

export class FlowTester {
  private bot: MockUniaccBot
  private results: FlowTestResult[] = []
  private startTime: Date = new Date()

  constructor(botConfig?: any) {
    this.bot = new MockUniaccBot(botConfig || {
      enableLogging: TEST_CONFIG.ENABLE_LOGGING_MOCK,
      enableSupabase: TEST_CONFIG.ENABLE_SUPABASE_MOCK,
      enableWebhooks: TEST_CONFIG.ENABLE_WEBHOOK_MOCK,
      simulateNetworkDelay: TEST_CONFIG.SIMULATE_USER_TYPING,
      memoryTracking: true,
      performanceTracking: true
    })
  }

  // ============================================================================
  // MÉTODOS PRINCIPALES DE TESTING
  // ============================================================================

  /**
   * Ejecuta un caso de prueba individual
   */
  async runFlowTest(testCase: FlowTestCase): Promise<FlowTestResult> {
    const testUserId = this.generateTestUserId()
    const startTime = new Date()
    
    console.log(`🧪 Ejecutando test: ${testCase.name}`)

    const stepResults: StepTestResult[] = []
    let currentStep = 0

    try {
      // Setup inicial si existe
      if (testCase.setup) {
        await testCase.setup()
      }

      // Configurar estado inicial si existe
      if (testCase.initialState) {
        this.bot.setInitialState(testUserId, testCase.initialState)
      }

      // Ejecutar cada paso del test
      for (const step of testCase.steps) {
        currentStep = step.stepNumber
        
        console.log(`   📝 Paso ${step.stepNumber}: ${step.description}`)

        // BeforeStep hook
        if (step.beforeStep) {
          await step.beforeStep()
        }

        const stepResult = await this.executeStep(testUserId, step)
        stepResults.push(stepResult)

        // AfterStep hook
        if (step.afterStep) {
          await step.afterStep()
        }

        // Si el paso falló, detener la ejecución
        if (!stepResult.success) {
          console.log(`   ❌ Paso ${step.stepNumber} falló: ${stepResult.error}`)
          break
        } else {
          console.log(`   ✅ Paso ${step.stepNumber} exitoso`)
        }

        // Delay entre pasos si está configurado
        if (step.delay) {
          await this.delay(step.delay)
        }
      }

      const endTime = new Date()
      const success = stepResults.every(r => r.success)
      const finalState = this.bot.getInternalState(testUserId)
      const dataSaved = this.bot.hasDataBeenSaved()
      const savedData = this.bot.getLastSavedData()
      const performanceMetrics = this.aggregatePerformanceMetrics(
        this.bot.getPerformanceMetrics(testUserId)
      )

      const result: FlowTestResult = {
        testCase,
        success,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        stepsExecuted: stepResults.length,
        stepsTotal: testCase.steps.length,
        stepResults,
        finalState,
        dataSaved,
        savedData,
        memoryUsage: process.memoryUsage(),
        performance: performanceMetrics,
        failedStep: stepResults.find(r => !r.success)?.stepNumber
      }

      if (!success) {
        result.error = `Test falló en paso ${result.failedStep}: ${testCase.steps[result.failedStep! - 1]?.description}`
      }

      // Teardown si existe
      if (testCase.teardown) {
        await testCase.teardown()
      }

      this.results.push(result)
      return result

    } catch (error) {
      const endTime = new Date()
      const errorResult: FlowTestResult = {
        testCase,
        success: false,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        stepsExecuted: currentStep,
        stepsTotal: testCase.steps.length,
        stepResults: stepResults,
        error: error instanceof Error ? error.message : String(error),
        failedStep: currentStep,
        memoryUsage: process.memoryUsage()
      }

      this.results.push(errorResult)
      return errorResult
    } finally {
      // Limpiar estado del bot para el siguiente test
      this.bot.resetUser(testUserId)
    }
  }

  /**
   * Ejecuta una suite completa de tests
   */
  async runTestSuite(suite: TestSuite): Promise<TestReport> {
    console.log(`🎯 Ejecutando suite: ${suite.name}`)
    this.startTime = new Date()

    try {
      // Setup de la suite
      if (suite.setup) {
        await suite.setup()
      }

      const results: FlowTestResult[] = []

      // Ejecutar tests en paralelo o secuencialmente
      if (suite.parallel) {
        const promises = suite.testCases.map(testCase => this.runFlowTest(testCase))
        const parallelResults = await Promise.all(promises)
        results.push(...parallelResults)
      } else {
        for (const testCase of suite.testCases) {
          const result = await this.runFlowTest(testCase)
          results.push(result)
          
          // Si hay reintentos configurados y el test falló
          if (!result.success && suite.retries && suite.retries > 0) {
            for (let retry = 1; retry <= suite.retries; retry++) {
              console.log(`🔄 Reintento ${retry}/${suite.retries} para: ${testCase.name}`)
              this.bot.clearMockData()
              const retryResult = await this.runFlowTest(testCase)
              if (retryResult.success) {
                // Reemplazar el resultado fallido con el exitoso
                results[results.length - 1] = retryResult
                break
              }
            }
          }
        }
      }

      // Teardown de la suite
      if (suite.teardown) {
        await suite.teardown()
      }

      return this.generateReport(suite.name, results)

    } catch (error) {
      throw new Error(`Error ejecutando suite ${suite.name}: ${error}`)
    }
  }

  // ============================================================================
  // MÉTODOS DE EJECUCIÓN DE PASOS
  // ============================================================================

  private async executeStep(userId: string, step: any): Promise<StepTestResult> {
    const stepStartTime = performance.now()

    try {
      // Ejecutar el mensaje
      const { response: botResponse, metrics } = await this.bot.procesarMensajeConMetricas(
        userId, 
        step.userMessage
      )
      
      const stepDuration = performance.now() - stepStartTime
      const actualState = this.bot.getInternalState(userId)

      // Verificar todas las aserciones
      const assertions = await this.runAllAssertions(
        userId,
        step,
        botResponse,
        actualState
      )

      const stepSuccess = assertions.every(a => a.success)

      const stepResult: StepTestResult = {
        stepNumber: step.stepNumber,
        success: stepSuccess,
        userMessage: step.userMessage,
        botResponse,
        expectedResponse: step.expectedResponse,
        actualState,
        expectedState: step.expectedState,
        assertions,
        duration: stepDuration
      }

      if (!stepSuccess) {
        const failedAssertions = assertions.filter(a => !a.success)
        stepResult.error = `Aserciones fallidas: ${failedAssertions.map(a => a.assertion).join(', ')}`
        stepResult.warnings = failedAssertions.filter(a => a.severity === 'warning').map(a => a.assertion)
      }

      return stepResult

    } catch (error) {
      const stepDuration = performance.now() - stepStartTime
      
      return {
        stepNumber: step.stepNumber,
        success: false,
        userMessage: step.userMessage,
        botResponse: '',
        assertions: [{
          assertion: 'Step execution',
          type: AssertionType.CUSTOM,
          success: false,
          expected: 'Successful execution',
          actual: 'Exception thrown',
          error: error instanceof Error ? error.message : String(error),
          severity: 'error'
        }],
        duration: stepDuration,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // ============================================================================
  // MOTOR DE ASERCIONES
  // ============================================================================

  private async runAllAssertions(
    userId: string,
    step: any,
    botResponse: string,
    actualState: any
  ): Promise<AssertionResult[]> {
    const assertions: AssertionResult[] = []

    // Aserciones de respuesta
    if (step.expectedResponse) {
      assertions.push(...this.validateResponse(botResponse, step.expectedResponse))
    }

    // Aserciones de estado
    if (step.expectedState) {
      assertions.push(...this.validateState(actualState, step.expectedState))
    }

    // Aserciones personalizadas
    if (step.customAssertions) {
      assertions.push(...await this.validateCustomAssertions(
        userId, 
        botResponse, 
        step.customAssertions
      ))
    }

    return assertions
  }

  private validateResponse(actualResponse: string, expectedResponse: any): AssertionResult[] {
    const assertions: AssertionResult[] = []

    // Contiene textos específicos
    if (expectedResponse.contains) {
      expectedResponse.contains.forEach((text: string) => {
        assertions.push({
          assertion: `Respuesta debe contener: "${text}"`,
          type: AssertionType.RESPONSE_CONTENT,
          success: actualResponse.includes(text),
          expected: `Contener "${text}"`,
          actual: actualResponse,
          severity: 'error',
          error: !actualResponse.includes(text) ? `No se encontró "${text}"` : undefined
        })
      })
    }

    // NO contiene textos específicos
    if (expectedResponse.notContains) {
      expectedResponse.notContains.forEach((text: string) => {
        assertions.push({
          assertion: `Respuesta NO debe contener: "${text}"`,
          type: AssertionType.RESPONSE_CONTENT,
          success: !actualResponse.includes(text),
          expected: `No contener "${text}"`,
          actual: actualResponse,
          severity: 'error',
          error: actualResponse.includes(text) ? `Se encontró "${text}" cuando no debería` : undefined
        })
      })
    }

    // Patrones regex
    if (expectedResponse.patterns) {
      expectedResponse.patterns.forEach((pattern: RegExp) => {
        const matches = pattern.test(actualResponse)
        assertions.push({
          assertion: `Respuesta debe coincidir con patrón: ${pattern}`,
          type: AssertionType.RESPONSE_CONTENT,
          success: matches,
          expected: `Coincidir con ${pattern}`,
          actual: actualResponse,
          severity: 'error',
          error: !matches ? `No coincide con el patrón` : undefined
        })
      })
    }

    // Longitud mínima
    if (expectedResponse.minLength) {
      assertions.push({
        assertion: `Respuesta debe tener al menos ${expectedResponse.minLength} caracteres`,
        type: AssertionType.RESPONSE_CONTENT,
        success: actualResponse.length >= expectedResponse.minLength,
        expected: `>= ${expectedResponse.minLength} caracteres`,
        actual: `${actualResponse.length} caracteres`,
        severity: 'warning',
        error: actualResponse.length < expectedResponse.minLength ? `Respuesta muy corta` : undefined
      })
    }

    // Coincidencia exacta
    if (expectedResponse.exactMatch) {
      assertions.push({
        assertion: `Respuesta debe ser exactamente: "${expectedResponse.exactMatch}"`,
        type: AssertionType.RESPONSE_CONTENT,
        success: actualResponse === expectedResponse.exactMatch,
        expected: expectedResponse.exactMatch,
        actual: actualResponse,
        severity: 'error',
        error: actualResponse !== expectedResponse.exactMatch ? `Texto no coincide exactamente` : undefined
      })
    }

    return assertions
  }

  private validateState(actualState: any, expectedState: any): AssertionResult[] {
    const assertions: AssertionResult[] = []

    // Validar cada campo del estado esperado
    Object.entries(expectedState).forEach(([key, expectedValue]) => {
      const actualValue = this.getNestedValue(actualState, key)
      
      assertions.push({
        assertion: `${key} debe ser: "${expectedValue}"`,
        type: AssertionType.STATE_VALIDATION,
        success: this.deepEqual(actualValue, expectedValue),
        expected: expectedValue,
        actual: actualValue,
        severity: 'error',
        error: !this.deepEqual(actualValue, expectedValue) ? 
          `Esperado: ${JSON.stringify(expectedValue)}, Actual: ${JSON.stringify(actualValue)}` : undefined
      })
    })

    return assertions
  }

  private async validateCustomAssertions(
    userId: string,
    botResponse: string,
    assertions: string[]
  ): Promise<AssertionResult[]> {
    const results: AssertionResult[] = []

    for (const assertion of assertions) {
      let success = false
      let error: string | undefined
      let actual: any = 'N/A'
      let expected: any = 'true'

      try {
        switch (assertion) {
          case 'data_should_be_saved':
            success = this.bot.hasDataBeenSaved()
            actual = this.bot.getMockSupabaseData().length
            error = !success ? 'No se guardaron datos' : undefined
            break
          
          case 'data_should_not_be_saved':
            success = !this.bot.hasDataBeenSaved()
            actual = this.bot.getMockSupabaseData().length
            error = !success ? 'Se guardaron datos cuando no se esperaba' : undefined
            break
          
          case 'should_have_prospecto_id':
            const state = this.bot.getInternalState(userId)
            success = !!state?.prospecto_id
            actual = state?.prospecto_id || 'null'
            error = !success ? 'No se encontró prospecto_id' : undefined
            break
          
          case 'should_reset_user':
            const currentState = this.bot.getInternalState(userId)
            success = !currentState?.flujo_actual || currentState.flujo_actual === null
            actual = currentState?.flujo_actual || 'null'
            error = !success ? 'Usuario no fue reseteado' : undefined
            break
          
          case 'response_should_be_interactive':
            success = this.isInteractiveResponse(botResponse)
            actual = `Interactive: ${success}`
            error = !success ? 'Respuesta no es interactiva' : undefined
            break

          default:
            success = false
            error = `Aserción desconocida: ${assertion}`
        }
      } catch (e) {
        success = false
        error = `Error ejecutando aserción: ${e}`
      }

      results.push({
        assertion,
        type: AssertionType.CUSTOM,
        success,
        expected,
        actual,
        severity: 'error',
        error
      })
    }

    return results
  }

  // ============================================================================
  // MÉTODOS DE REPORTE
  // ============================================================================

  generateReport(suiteName: string, results: FlowTestResult[]): TestReport {
    const endTime = new Date()
    const totalTests = results.length
    const passedTests = results.filter(r => r.success).length
    const failedTests = totalTests - passedTests

    return {
      suiteName,
      executionId: `exec-${Date.now()}`,
      startTime: this.startTime,
      endTime,
      totalDuration: endTime.getTime() - this.startTime.getTime(),
      environment: this.getTestEnvironment(),
      totalTests,
      passedTests,
      failedTests,
      skippedTests: 0,
      results,
      coverage: this.calculateCoverage(results),
      performance: this.calculatePerformanceReport(results),
      errors: this.extractErrors(results),
      warnings: this.extractWarnings(results),
      recommendations: this.generateRecommendations(results)
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  private generateTestUserId(): string {
    return `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (a == null || b == null) return a === b
    if (typeof a !== typeof b) return false
    if (typeof a === 'object') {
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)
      if (keysA.length !== keysB.length) return false
      return keysA.every(key => this.deepEqual(a[key], b[key]))
    }
    return false
  }

  private isInteractiveResponse(response: string): boolean {
    const interactivePatterns = [
      /\d+[️⃣]/,  // Números con emojis
      /escribe.*opción/i,
      /selecciona/i,
      /¿.*\?/,  // Preguntas
      /1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣/
    ]
    
    return interactivePatterns.some(pattern => pattern.test(response))
  }

  private aggregatePerformanceMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics | undefined {
    if (metrics.length === 0) return undefined

    const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0)
    const avgResponseTime = totalResponseTime / metrics.length

    return {
      responseTime: avgResponseTime,
      memoryBefore: metrics[0].memoryBefore,
      memoryAfter: metrics[metrics.length - 1].memoryAfter,
      memoryDelta: {
        rss: metrics.reduce((sum, m) => sum + m.memoryDelta.rss, 0),
        heapUsed: metrics.reduce((sum, m) => sum + m.memoryDelta.heapUsed, 0),
        heapTotal: metrics.reduce((sum, m) => sum + m.memoryDelta.heapTotal, 0),
        external: metrics.reduce((sum, m) => sum + m.memoryDelta.external, 0)
      }
    }
  }

  private getTestEnvironment(): any {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      cpus: require('os').cpus().length,
      memory: require('os').totalmem(),
      testFramework: 'jest',
      timestamp: new Date(),
      config: this.bot.config
    }
  }

  private calculateCoverage(results: FlowTestResult[]): any {
    // Implementar cálculo de cobertura
    return {
      flows: {},
      totalFlows: 0,
      coveredFlows: 0,
      percentageCovered: 0,
      uncoveredFlows: []
    }
  }

  private calculatePerformanceReport(results: FlowTestResult[]): any {
    const responseTimes = results.map(r => r.duration)
    
    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      averageMemoryUsage: 0,
      maxMemoryUsage: 0,
      throughput: results.length / (results.reduce((sum, r) => sum + r.duration, 0) / 1000),
      errorRate: results.filter(r => !r.success).length / results.length
    }
  }

  private extractErrors(results: FlowTestResult[]): any[] {
    return results
      .filter(r => !r.success)
      .map(r => ({
        type: 'execution',
        message: r.error || 'Unknown error',
        testCase: r.testCase.name,
        step: r.failedStep,
        timestamp: r.endTime,
        severity: 'high'
      }))
  }

  private extractWarnings(results: FlowTestResult[]): string[] {
    const warnings: string[] = []
    
    results.forEach(result => {
      result.stepResults?.forEach(step => {
        if (step.warnings) {
          warnings.push(...step.warnings)
        }
      })
    })

    return warnings
  }

  private generateRecommendations(results: FlowTestResult[]): string[] {
    const recommendations: string[] = []
    
    const failedTests = results.filter(r => !r.success)
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} tests fallaron. Revisar aserciones y lógica del bot.`)
    }

    const slowTests = results.filter(r => r.duration > 5000)
    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length} tests tardaron más de 5 segundos. Optimizar performance.`)
    }

    return recommendations
  }

  // Getters públicos
  get testResults(): FlowTestResult[] {
    return [...this.results]
  }

  get mockBot(): MockUniaccBot {
    return this.bot
  }
}
