/**
 * Casos de prueba para el flujo de Captura Inicial
 * Testing independiente sin modificar código del bot
 */

import { FlowTestCase, FlowCategory, TestPriority } from '../../types/test-types'

export const capturaInicialTestCases: FlowTestCase[] = [
  {
    id: 'captura-inicial-usuario-nuevo',
    name: 'Usuario Nuevo - Flujo Completo',
    description: 'Test completo de captura inicial para usuario nuevo con teléfono detectado',
    category: FlowCategory.ONBOARDING,
    priority: TestPriority.CRITICAL,
    tags: ['captura-inicial', 'usuario-nuevo', 'telefono-detectado'],
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario saluda',
        userMessage: 'Hola',
        expectedResponse: {
          contains: ['📞', 'confirmar', 'teléfono', '1️⃣', '2️⃣', '3️⃣'],
          patterns: [/\+569\d{8}/] // Patrón de teléfono chileno
        },
        expectedState: {
          flujo_actual: 'captura_inicial',
          paso_actual: 'confirmar_telefono'
        }
      },
      {
        stepNumber: 2,
        description: 'Usuario confirma teléfono detectado',
        userMessage: '1',
        expectedResponse: {
          contains: ['✅', 'Perfecto', 'nombre completo'],
          notContains: ['error', 'inválido']
        },
        expectedState: {
          flujo_actual: 'captura_inicial',
          paso_actual: 'solicitar_nombre',
          datos_prospecto: {
            telefono_confirmado: true
          }
        },
        customAssertions: ['should_have_prospecto_id']
      },
      {
        stepNumber: 3,
        description: 'Usuario proporciona nombre',
        userMessage: 'Juan Carlos Pérez',
        expectedResponse: {
          contains: ['Juan Carlos', 'email'],
          minLength: 20
        },
        expectedState: {
          flujo_actual: 'captura_inicial',
          paso_actual: 'solicitar_email',
          datos_prospecto: {
            nombre: 'Juan Carlos Pérez'
          }
        }
      },
      {
        stepNumber: 4,
        description: 'Usuario proporciona email',
        userMessage: 'juan.perez@gmail.com',
        expectedResponse: {
          contains: ['juan.perez@gmail.com', 'años', 'edad'],
          notContains: ['inválido', 'error']
        },
        expectedState: {
          flujo_actual: 'captura_inicial',
          paso_actual: 'solicitar_edad',
          datos_prospecto: {
            email: 'juan.perez@gmail.com'
          }
        }
      },
      {
        stepNumber: 5,
        description: 'Usuario proporciona edad',
        userMessage: '25',
        expectedResponse: {
          contains: ['25 años', 'región', '1️⃣', '7️⃣'], // Metropolitana
          notContains: ['teléfono'] // No debe pedir teléfono si ya está confirmado
        },
        expectedState: {
          flujo_actual: 'captura_inicial',
          paso_actual: 'solicitar_region',
          datos_prospecto: {
            edad: 25
          }
        }
      },
      {
        stepNumber: 6,
        description: 'Usuario selecciona región Metropolitana',
        userMessage: '7',
        expectedResponse: {
          contains: ['🎉', 'PERFECTO', 'JUAN CARLOS', 'Bienvenid@', 'UNIACC', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'],
          patterns: [/\+569\d{8}/] // Debe mostrar el teléfono confirmado
        },
        expectedState: {
          flujo_actual: 'menu_principal',
          paso_actual: null,
          datos_prospecto: {
            region: 'Metropolitana'
          }
        },
        customAssertions: ['data_should_be_saved']
      }
    ],
    expectedFinalState: {
      flujo_actual: 'menu_principal',
      datos_prospecto: {
        nombre: 'Juan Carlos Pérez',
        email: 'juan.perez@gmail.com',
        edad: 25,
        region: 'Metropolitana',
        telefono_confirmado: true
      }
    },
    expectedDataSaved: true,
    timeout: 10000
  },
  
  {
    id: 'captura-inicial-telefono-manual',
    name: 'Usuario Nuevo - Teléfono Manual',
    description: 'Usuario elige proporcionar teléfono manualmente',
    category: FlowCategory.ONBOARDING,
    priority: TestPriority.HIGH,
    tags: ['captura-inicial', 'telefono-manual'],
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario saluda',
        userMessage: 'Hola',
        expectedResponse: {
          contains: ['📞', 'confirmar', 'teléfono']
        },
        expectedState: {
          flujo_actual: 'captura_inicial',
          paso_actual: 'confirmar_telefono'
        }
      },
      {
        stepNumber: 2,
        description: 'Usuario elige dar otro número',
        userMessage: '2',
        expectedResponse: {
          contains: ['📱', 'número de contacto', 'Ejemplo', '+56912345678'],
          notContains: ['error']
        },
        expectedState: {
          paso_actual: 'solicitar_telefono_manual'
        }
      },
      {
        stepNumber: 3,
        description: 'Usuario proporciona teléfono válido',
        userMessage: '+56987654321',
        expectedResponse: {
          contains: ['✅', 'Perfecto', '+56987654321', 'nombre completo'],
          notContains: ['inválido', 'error']
        },
        expectedState: {
          paso_actual: 'solicitar_nombre',
          datos_prospecto: {
            telefono: '+56987654321',
            telefono_confirmado: true
          }
        },
        customAssertions: ['should_have_prospecto_id']
      }
    ],
    timeout: 8000
  },

  {
    id: 'captura-inicial-sin-telefono',
    name: 'Usuario Nuevo - Sin Teléfono',
    description: 'Usuario opta por continuar sin guardar teléfono',
    category: FlowCategory.ONBOARDING,
    priority: TestPriority.MEDIUM,
    tags: ['captura-inicial', 'sin-telefono', 'privacidad'],
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario saluda',
        userMessage: 'Hola',
        expectedResponse: {
          contains: ['📞', 'confirmar', 'teléfono']
        }
      },
      {
        stepNumber: 2,
        description: 'Usuario elige continuar sin teléfono',
        userMessage: '3',
        expectedResponse: {
          contains: ['✅', 'Entendido', 'sin guardar', 'nombre completo'],
          notContains: ['error']
        },
        expectedState: {
          paso_actual: 'solicitar_nombre',
          datos_prospecto: {
            telefono: null,
            telefono_confirmado: false
          }
        }
      },
      {
        stepNumber: 3,
        description: 'Usuario proporciona nombre',
        userMessage: 'María González',
        expectedResponse: {
          contains: ['María', 'email']
        },
        expectedState: {
          datos_prospecto: {
            nombre: 'María González'
          }
        }
      }
    ],
    timeout: 6000
  },

  {
    id: 'captura-inicial-telefono-invalido',
    name: 'Validación Teléfono Inválido',
    description: 'Usuario proporciona teléfono con formato inválido',
    category: FlowCategory.ERROR_HANDLING,
    priority: TestPriority.HIGH,
    tags: ['validacion', 'telefono-invalido', 'error-handling'],
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario saluda',
        userMessage: 'Hola',
        expectedState: {
          paso_actual: 'confirmar_telefono'
        }
      },
      {
        stepNumber: 2,
        description: 'Usuario elige dar otro número',
        userMessage: '2',
        expectedState: {
          paso_actual: 'solicitar_telefono_manual'
        }
      },
      {
        stepNumber: 3,
        description: 'Usuario proporciona teléfono inválido',
        userMessage: '123',
        expectedResponse: {
          contains: ['❌', 'no válido', 'formato', 'Ejemplos válidos'],
          patterns: [/\+56912345678/]
        },
        expectedState: {
          paso_actual: 'solicitar_telefono_manual' // Debe mantenerse en el mismo paso
        }
      },
      {
        stepNumber: 4,
        description: 'Usuario corrige con teléfono válido',
        userMessage: '956123456',
        expectedResponse: {
          contains: ['✅', 'Perfecto', 'nombre completo'],
          notContains: ['inválido']
        },
        expectedState: {
          paso_actual: 'solicitar_nombre'
        }
      }
    ],
    timeout: 8000
  },

  {
    id: 'captura-inicial-email-invalido',
    name: 'Validación Email Inválido',
    description: 'Usuario proporciona email con formato inválido',
    category: FlowCategory.ERROR_HANDLING,
    priority: TestPriority.HIGH,
    tags: ['validacion', 'email-invalido', 'error-handling'],
    initialState: {
      flujo_actual: 'captura_inicial',
      paso_actual: 'solicitar_email',
      datos_prospecto: {
        nombre: 'Test Usuario'
      }
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario proporciona email inválido sin @',
        userMessage: 'correo-invalido',
        expectedResponse: {
          contains: ['❌', 'email válido', '@', '.'],
          notContains: ['✅']
        },
        expectedState: {
          paso_actual: 'solicitar_email' // Debe mantenerse en el mismo paso
        }
      },
      {
        stepNumber: 2,
        description: 'Usuario proporciona email inválido sin dominio',
        userMessage: 'usuario@',
        expectedResponse: {
          contains: ['❌', 'email válido', '@', '.']
        },
        expectedState: {
          paso_actual: 'solicitar_email'
        }
      },
      {
        stepNumber: 3,
        description: 'Usuario corrige con email válido',
        userMessage: 'usuario@correo.com',
        expectedResponse: {
          contains: ['✅', 'usuario@correo.com', 'años', 'edad'],
          notContains: ['inválido']
        },
        expectedState: {
          paso_actual: 'solicitar_edad',
          datos_prospecto: {
            email: 'usuario@correo.com'
          }
        }
      }
    ],
    timeout: 6000
  },

  {
    id: 'captura-inicial-edad-invalida',
    name: 'Validación Edad Inválida',
    description: 'Usuario proporciona edad fuera de rango válido',
    category: FlowCategory.ERROR_HANDLING,
    priority: TestPriority.MEDIUM,
    tags: ['validacion', 'edad-invalida', 'error-handling'],
    initialState: {
      flujo_actual: 'captura_inicial',
      paso_actual: 'solicitar_edad',
      datos_prospecto: {
        nombre: 'Test Usuario',
        email: 'test@correo.com'
      }
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario proporciona edad muy baja',
        userMessage: '15',
        expectedResponse: {
          contains: ['❌', 'edad válida', '16', '80'],
          notContains: ['✅']
        },
        expectedState: {
          paso_actual: 'solicitar_edad'
        }
      },
      {
        stepNumber: 2,
        description: 'Usuario proporciona edad muy alta',
        userMessage: '85',
        expectedResponse: {
          contains: ['❌', 'edad válida', '16', '80']
        },
        expectedState: {
          paso_actual: 'solicitar_edad'
        }
      },
      {
        stepNumber: 3,
        description: 'Usuario proporciona texto no numérico',
        userMessage: 'veinticinco',
        expectedResponse: {
          contains: ['❌', 'edad válida']
        },
        expectedState: {
          paso_actual: 'solicitar_edad'
        }
      },
      {
        stepNumber: 4,
        description: 'Usuario corrige con edad válida',
        userMessage: '22',
        expectedResponse: {
          contains: ['✅', '22 años', 'región'],
          notContains: ['inválida']
        },
        expectedState: {
          paso_actual: 'solicitar_region',
          datos_prospecto: {
            edad: 22
          }
        }
      }
    ],
    timeout: 8000
  }
]

// Test suite para captura inicial
export const capturaInicialTestSuite = {
  name: 'Captura Inicial - Suite Completa',
  description: 'Tests completos para el flujo de captura inicial de usuarios nuevos',
  category: FlowCategory.ONBOARDING,
  testCases: capturaInicialTestCases,
  parallel: false, // Ejecutar secuencialmente para evitar interferencias
  retries: 2
}
