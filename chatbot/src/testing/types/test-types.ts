/**
 * Tipos específicos para el sistema de testing del chatbot UNIACC
 */

// ============================================================================
// TIPOS BASE PARA TESTING DE FLUJOS
// ============================================================================

export interface FlowTestCase {
  id: string
  name: string
  description: string
  category: FlowCategory
  priority: TestPriority
  tags: string[]
  initialState?: Partial<UsuarioState>
  steps: FlowTestStep[]
  expectedFinalState?: Partial<UsuarioState>
  expectedDataSaved?: boolean
  timeout?: number
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
}

export interface FlowTestStep {
  stepNumber: number
  description: string
  userMessage: string
  expectedResponse?: ResponseExpectation
  expectedState?: StateExpectation
  customAssertions?: string[]
  delay?: number
  beforeStep?: () => Promise<void>
  afterStep?: () => Promise<void>
}

export interface ResponseExpectation {
  contains?: string[]
  notContains?: string[]
  patterns?: RegExp[]
  minLength?: number
  maxLength?: number
  startsWith?: string
  endsWith?: string
  exactMatch?: string
  containsAny?: string[] // Al menos una de estas debe estar presente
  containsAll?: string[] // Todas deben estar presentes
}

export interface StateExpectation {
  flujo_actual?: string | null
  paso_actual?: string | null
  opcion_menu_seleccionada?: string
  datos_prospecto?: Partial<ProspectoData>
  facultad_seleccionada?: string
  carrera_seleccionada?: string
  es_usuario_recurrente?: boolean
  prospecto_id?: string | null
  campos_capturados?: string[]
}

// ============================================================================
// TIPOS PARA RESULTADOS Y REPORTES
// ============================================================================

export interface FlowTestResult {
  testCase: FlowTestCase
  success: boolean
  startTime: Date
  endTime: Date
  duration: number
  stepsExecuted: number
  stepsTotal: number
  failedStep?: number
  error?: string
  stepResults: StepTestResult[]
  finalState?: UsuarioState
  dataSaved?: boolean
  savedData?: any
  memoryUsage?: NodeJS.MemoryUsage
  performance?: PerformanceMetrics
}

export interface StepTestResult {
  stepNumber: number
  success: boolean
  userMessage: string
  botResponse: string
  expectedResponse?: ResponseExpectation
  actualState?: UsuarioState
  expectedState?: StateExpectation
  assertions: AssertionResult[]
  duration: number
  error?: string
  warnings?: string[]
}

export interface AssertionResult {
  assertion: string
  type: AssertionType
  success: boolean
  expected: any
  actual: any
  error?: string
  severity: 'error' | 'warning' | 'info'
}

// ============================================================================
// TIPOS PARA SUITES Y REPORTES
// ============================================================================

export interface TestSuite {
  name: string
  description: string
  category: FlowCategory
  testCases: FlowTestCase[]
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
  parallel?: boolean
  retries?: number
}

export interface TestReport {
  suiteName: string
  executionId: string
  startTime: Date
  endTime: Date
  totalDuration: number
  environment: TestEnvironment
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  results: FlowTestResult[]
  coverage: TestCoverage
  performance: PerformanceReport
  errors: TestError[]
  warnings: string[]
  recommendations: string[]
}

export interface TestCoverage {
  flows: {
    [flowName: string]: {
      tested: boolean
      coverage: number
      stepsTotal: number
      stepsTested: number
    }
  }
  totalFlows: number
  coveredFlows: number
  percentageCovered: number
  uncoveredFlows: string[]
}

export interface PerformanceReport {
  averageResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  averageMemoryUsage: number
  maxMemoryUsage: number
  throughput: number // mensajes por segundo
  errorRate: number
}

// ============================================================================
// TIPOS PARA CONFIGURACIÓN Y MOCKS
// ============================================================================

export interface MockBotConfig {
  enableLogging?: boolean
  enableSupabase?: boolean
  enableWebhooks?: boolean
  simulateNetworkDelay?: boolean
  simulateErrors?: boolean
  errorRate?: number
  networkDelay?: number
  memoryTracking?: boolean
  performanceTracking?: boolean
}

export interface TestEnvironment {
  nodeVersion: string
  platform: string
  cpus: number
  memory: number
  testFramework: string
  timestamp: Date
  config: MockBotConfig
}

// ============================================================================
// ENUMS Y TIPOS AUXILIARES
// ============================================================================

export enum FlowCategory {
  ONBOARDING = 'onboarding',
  NAVIGATION = 'navigation',
  DATA_CAPTURE = 'data_capture',
  INFORMATION = 'information',
  ADVISOR = 'advisor',
  ERROR_HANDLING = 'error_handling',
  TIMEOUT = 'timeout',
  INTEGRATION = 'integration'
}

export enum TestPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum AssertionType {
  RESPONSE_CONTENT = 'response_content',
  STATE_VALIDATION = 'state_validation',
  DATA_PERSISTENCE = 'data_persistence',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom'
}

// ============================================================================
// TIPOS IMPORTADOS DEL BOT (Para referencia en tests)
// ============================================================================

export interface UsuarioState {
  flujo_actual: string | null
  paso_actual: string | null
  opcion_menu_seleccionada?: string
  datos_prospecto: {
    nombre?: string
    email?: string
    telefono?: string | null
    telefono_detectado?: string
    telefono_confirmado?: boolean
    whatsapp?: string
    edad?: number
    region?: string
    carrera_interes?: string
    nivel_interes?: string
    campus_preferido?: string
  }
  facultad_seleccionada?: string
  carrera_seleccionada?: string
  carreras_sugeridas?: any[]
  historial_consultas?: string[]
  ultima_carrera_consultada?: string
  es_usuario_recurrente?: boolean
  fecha_ultima_interaccion?: Date
  intentos_captura: number
  timeout_warning_sent?: boolean
  session_timeout_id?: NodeJS.Timeout
  warning_timeout_id?: NodeJS.Timeout
  prospecto_id?: string
  ultimo_campo_guardado?: 'nombre' | 'email' | 'telefono' | 'edad' | 'region'
  campos_capturados?: string[]
  fecha_creacion_prospecto?: Date
}

export interface ProspectoData {
  nombre: string
  email: string | null
  telefono: string | null
  whatsapp: string
  edad?: number
  region?: string
  carrera_interes: string
  facultad_interes?: string
  nivel_interes?: string
  tipo_consulta?: string
  source: string
  flujo_actual: string
}

// ============================================================================
// TIPOS PARA MÉTRICAS Y PERFORMANCE
// ============================================================================

export interface PerformanceMetrics {
  responseTime: number
  memoryBefore: NodeJS.MemoryUsage
  memoryAfter: NodeJS.MemoryUsage
  memoryDelta: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  cpuTime?: number
}

export interface TestError {
  type: 'assertion' | 'execution' | 'timeout' | 'memory' | 'network'
  message: string
  stack?: string
  step?: number
  testCase?: string
  timestamp: Date
  severity: 'critical' | 'high' | 'medium' | 'low'
}

// ============================================================================
// TIPOS PARA RUNNERS ESPECIALIZADOS
// ============================================================================

export interface StressTestConfig {
  concurrentUsers: number
  messagesPerUser: number
  duration: number // en milisegundos
  rampUpTime: number
  rampDownTime: number
  targetThroughput: number
}

export interface IntegrationTestConfig {
  useRealSupabase?: boolean
  useRealWebhooks?: boolean
  testDataCleanup?: boolean
  isolateTests?: boolean
}

// ============================================================================
// TIPOS PARA GENERADORES DE DATOS
// ============================================================================

export interface TestDataGenerator {
  generateUserId(): string
  generateUserData(): Partial<ProspectoData>
  generateConversationFlow(): FlowTestCase
  generateStressScenario(): StressTestConfig
}

export interface MockDataSet {
  users: Partial<ProspectoData>[]
  conversations: string[][]
  responses: string[]
  errors: string[]
}
