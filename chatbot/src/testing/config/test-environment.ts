/**
 * Configuración del entorno de testing
 */

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-key'
process.env.WEBHOOK_URL = 'https://test-webhook.com'
process.env.WEBHOOK_SECRET = 'test-secret'

// Variables específicas para testing
process.env.TEST_ENABLE_LOGGING = 'false'
process.env.TEST_SIMULATE_DELAYS = 'false'
process.env.TEST_ERROR_RATE = '0'
process.env.TEST_TIMEOUT = '30000'

// Mock de console para tests más limpios (pero manteniendo error para debugging)
const originalConsole = { ...console }

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Mantener errores para debugging
}

// Configurar timeout para tests
jest.setTimeout(30000)

// Mock de axios globalmente
jest.mock('axios', () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}))

// Limpiar mocks antes de cada test
beforeEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
  jest.useFakeTimers()
})

// Restaurar timers después de cada test
afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

// Configuración global de testing
export const TEST_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 5000,
  FLOW_TIMEOUT: 10000,
  INTEGRATION_TIMEOUT: 15000,
  
  // Delays para simular tiempo real
  SIMULATE_USER_TYPING: false,
  USER_TYPING_DELAY: 100,
  BOT_PROCESSING_DELAY: 50,
  
  // Configuración de mocks
  ENABLE_SUPABASE_MOCK: true,
  ENABLE_WEBHOOK_MOCK: true,
  ENABLE_LOGGING_MOCK: true,
  
  // Configuración de errores simulados
  SIMULATE_NETWORK_ERRORS: false,
  NETWORK_ERROR_RATE: 0.1,
  SIMULATE_TIMEOUT_ERRORS: false,
  
  // Configuración de datos
  USE_MOCK_DATA: true,
  SAVE_TEST_RESULTS: true,
  GENERATE_DETAILED_REPORTS: true
} as const

export type TestConfig = typeof TEST_CONFIG

export {}
