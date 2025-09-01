/**
 * Configuración específica de Jest para el sistema de testing
 */

import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  // Configuración base
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Rutas de testing
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/src/testing/**/*.test.ts',
    '**/src/testing/**/*.spec.ts'
  ],
  
  // Transformaciones
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Cobertura
  collectCoverageFrom: [
    'src/actions/**/*.ts',
    'src/utils/**/*.ts',
    'src/types/**/*.ts',
    '!src/testing/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  
  // Reportes de cobertura
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup
  setupFilesAfterEnv: [
    '<rootDir>/src/testing/config/test-environment.ts'
  ],
  
  // Resolución de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@testing/(.*)$': '<rootDir>/src/testing/$1'
  },
  
  // Timeouts
  testTimeout: 30000,
  
  // Performance
  maxWorkers: '50%',
  
  // Configuración para tests concurrentes
  maxConcurrency: 10,
  
  // Verbose output
  verbose: true,
  
  // Configuración de reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'UNIACC Chatbot - Test Report'
      }
    ]
  ],
  
  // Configuración global para tests
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2018',
          lib: ['es2018'],
          moduleResolution: 'node',
          declaration: false,
          strict: true,
          noImplicitAny: true,
          strictNullChecks: true,
          noImplicitThis: true,
          alwaysStrict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          moduleDetection: 'auto',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true
        }
      }
    }
  }
}

export default config
