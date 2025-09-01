/**
 * Casos de prueba para el flujo de Menú Principal
 * Testing independiente - no modifica código del bot
 */

import { FlowTestCase, FlowCategory, TestPriority } from '../../types/test-types'

export const menuPrincipalTestCases: FlowTestCase[] = [
  {
    id: 'menu-principal-opcion-1-carreras',
    name: 'Menú Principal - Opción 1: Conocer Carreras',
    description: 'Usuario selecciona explorar carreras desde menú principal',
    category: FlowCategory.NAVIGATION,
    priority: TestPriority.CRITICAL,
    tags: ['menu-principal', 'exploracion-carreras', 'navegacion'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null,
      datos_prospecto: {
        nombre: 'Usuario Test',
        email: 'test@email.com'
      }
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario selecciona opción 1 - Conocer carreras',
        userMessage: '1',
        expectedResponse: {
          contains: ['🎨', '🎭', 'FACULTADES', 'ARTES', 'COMUNICACIONES', 'ARQUITECTURA', 'A)', 'B)', 'C)', 'D)', 'E)'],
          patterns: [/facultad/i]
        },
        expectedState: {
          flujo_actual: 'exploracion_carreras',
          paso_actual: 'seleccion_facultad',
          opcion_menu_seleccionada: 'conocer_carreras'
        }
      }
    ],
    timeout: 5000
  },

  {
    id: 'menu-principal-opcion-2-admision',
    name: 'Menú Principal - Opción 2: Proceso Admisión',
    description: 'Usuario selecciona información sobre proceso de admisión',
    category: FlowCategory.INFORMATION,
    priority: TestPriority.HIGH,
    tags: ['menu-principal', 'proceso-admision', 'informacion'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario selecciona opción 2 - Proceso admisión',
        userMessage: '2',
        expectedResponse: {
          contains: ['📋', 'ADMISIÓN 2025', 'requisitos', 'documentos', 'PSU', 'PDT', '1️⃣', '2️⃣', '3️⃣'],
          patterns: [/admisión|proceso/i]
        },
        expectedState: {
          flujo_actual: 'proceso_admision',
          paso_actual: 'info_general',
          opcion_menu_seleccionada: 'proceso_admision'
        }
      }
    ],
    timeout: 5000
  },

  {
    id: 'menu-principal-opcion-3-costos',
    name: 'Menú Principal - Opción 3: Costos y Becas',
    description: 'Usuario selecciona información sobre costos y becas',
    category: FlowCategory.INFORMATION,
    priority: TestPriority.HIGH,
    tags: ['menu-principal', 'costos-becas', 'financiamiento'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario selecciona opción 3 - Costos y becas',
        userMessage: '3',
        expectedResponse: {
          contains: ['💰', 'COSTOS', 'BECAS', 'matrícula', 'arancel', 'Excelencia', 'Deportiva', '1️⃣', '2️⃣', '3️⃣', '4️⃣'],
          patterns: [/beca|costo|financiamiento/i]
        },
        expectedState: {
          flujo_actual: 'costos_becas_decision',
          paso_actual: 'opciones',
          opcion_menu_seleccionada: 'costos_becas'
        }
      }
    ],
    timeout: 5000
  },

  {
    id: 'menu-principal-opcion-4-modalidades',
    name: 'Menú Principal - Opción 4: Modalidades de Estudio',
    description: 'Usuario selecciona información sobre modalidades',
    category: FlowCategory.INFORMATION,
    priority: TestPriority.MEDIUM,
    tags: ['menu-principal', 'modalidades', 'presencial', 'online'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario selecciona opción 4 - Modalidades',
        userMessage: '4',
        expectedResponse: {
          contains: ['🏫', 'MODALIDADES', 'PRESENCIAL', 'SEMIPRESENCIAL', 'Providencia', 'flexibilidad', '1️⃣', '2️⃣', '3️⃣', '4️⃣'],
          patterns: [/modalidad|presencial|online/i]
        },
        expectedState: {
          flujo_actual: 'modalidades_decision',
          paso_actual: 'opciones',
          opcion_menu_seleccionada: 'modalidades_estudio'
        }
      }
    ],
    timeout: 5000
  },

  {
    id: 'menu-principal-opcion-5-asesor',
    name: 'Menú Principal - Opción 5: Hablar con Asesor',
    description: 'Usuario solicita hablar con un asesor desde menú principal',
    category: FlowCategory.ADVISOR,
    priority: TestPriority.CRITICAL,
    tags: ['menu-principal', 'asesor', 'captura-datos'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null,
      datos_prospecto: {
        nombre: 'Usuario Completo',
        email: 'completo@email.com',
        telefono: '+56987654321'
      }
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario con datos completos solicita asesor',
        userMessage: '5',
        expectedResponse: {
          contains: ['🎉', 'Solicitud', 'Asesoramiento', 'confirmada', 'Usuario Completo', 'completo@email.com', '+56987654321', '24 horas'],
          patterns: [/asesor|contactará/i]
        },
        expectedState: {
          flujo_actual: 'menu_principal',
          paso_actual: null
        },
        customAssertions: ['data_should_be_saved']
      }
    ],
    timeout: 8000
  },

  {
    id: 'menu-principal-opcion-5-asesor-sin-datos',
    name: 'Menú Principal - Opción 5: Asesor Sin Datos Completos',
    description: 'Usuario sin datos completos solicita asesor',
    category: FlowCategory.ADVISOR,
    priority: TestPriority.HIGH,
    tags: ['menu-principal', 'asesor', 'captura-datos', 'incompleto'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null,
      datos_prospecto: {
        nombre: 'Usuario Parcial'
        // Faltan email y teléfono
      }
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario sin datos completos solicita asesor',
        userMessage: '5',
        expectedResponse: {
          contains: ['🎓', 'Asesor Académico', 'Especializado', 'email de contacto'],
          notContains: ['confirmada', 'registrados']
        },
        expectedState: {
          flujo_actual: 'PROSPECT_CAPTURE',
          paso_actual: 'COLLECT_BASIC_INFO',
          opcion_menu_seleccionada: 'hablar_asesor'
        }
      }
    ],
    timeout: 6000
  },

  {
    id: 'menu-principal-opcion-6-busqueda-directa',
    name: 'Menú Principal - Opción 6: Búsqueda Directa',
    description: 'Usuario utiliza búsqueda directa de carrera',
    category: FlowCategory.NAVIGATION,
    priority: TestPriority.MEDIUM,
    tags: ['menu-principal', 'busqueda-directa', 'carrera'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario selecciona búsqueda directa',
        userMessage: '6',
        expectedResponse: {
          contains: ['🚀', 'directo al grano', 'carrera que te interesa', 'ejemplo'],
          patterns: [/Psicología|Arquitectura|Diseño|Derecho/]
        },
        expectedState: {
          flujo_actual: 'busqueda_directa_carrera',
          paso_actual: 'solicitar_carrera',
          opcion_menu_seleccionada: 'busqueda_directa'
        }
      }
    ],
    timeout: 5000
  },

  {
    id: 'menu-principal-entrada-texto-libre',
    name: 'Menú Principal - Entrada con Texto Libre',
    description: 'Usuario escribe texto libre en lugar de números',
    category: FlowCategory.ERROR_HANDLING,
    priority: TestPriority.MEDIUM,
    tags: ['menu-principal', 'texto-libre', 'navegacion-inteligente'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario escribe "carreras" en lugar de número',
        userMessage: 'carreras',
        expectedResponse: {
          contains: ['FACULTADES', 'A)', 'B)', 'C)', 'D)', 'E)'],
          patterns: [/facultad/i]
        },
        expectedState: {
          flujo_actual: 'exploracion_carreras',
          paso_actual: 'seleccion_facultad'
        }
      }
    ],
    timeout: 5000
  },

  {
    id: 'menu-principal-entrada-invalida',
    name: 'Menú Principal - Entrada No Reconocida',
    description: 'Usuario envía mensaje no reconocido',
    category: FlowCategory.ERROR_HANDLING,
    priority: TestPriority.MEDIUM,
    tags: ['menu-principal', 'entrada-invalida', 'error-handling'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario envía mensaje no reconocido',
        userMessage: 'xyz123',
        expectedResponse: {
          contains: ['No entendí', 'ayudarte', 'opciones', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'],
          notContains: ['error', 'falló']
        },
        expectedState: {
          flujo_actual: 'menu_principal',
          paso_actual: 'no_entendido'
        }
      }
    ],
    timeout: 5000
  },

  {
    id: 'menu-principal-navegacion-secuencial',
    name: 'Navegación Secuencial - Múltiples Opciones',
    description: 'Usuario navega por múltiples opciones del menú secuencialmente',
    category: FlowCategory.NAVIGATION,
    priority: TestPriority.MEDIUM,
    tags: ['menu-principal', 'navegacion-secuencial', 'exploracion'],
    initialState: {
      flujo_actual: 'menu_principal',
      paso_actual: null,
      datos_prospecto: {
        nombre: 'Usuario Explorador',
        email: 'explorador@test.com'
      }
    },
    steps: [
      {
        stepNumber: 1,
        description: 'Usuario explora costos y becas',
        userMessage: '3',
        expectedResponse: {
          contains: ['💰', 'COSTOS', 'BECAS']
        },
        expectedState: {
          flujo_actual: 'costos_becas_decision'
        }
      },
      {
        stepNumber: 2,
        description: 'Usuario indica que ya tiene la info',
        userMessage: '4',
        expectedResponse: {
          contains: ['Genial', 'información', 'utilidad'],
          patterns: [/hola.*nueva.*consulta/i]
        },
        customAssertions: ['data_should_be_saved']
      },
      {
        stepNumber: 3,
        description: 'Usuario inicia nueva consulta',
        userMessage: 'Hola',
        expectedResponse: {
          contains: ['🎓', 'Te reconozco', 'Usuario Explorador'],
          patterns: [/qué.*puedo.*ayudarte/i]
        },
        expectedState: {
          flujo_actual: 'menu_contextual',
          paso_actual: 'opciones_recurrente'
        }
      }
    ],
    timeout: 15000
  }
]

// Test suite para menú principal
export const menuPrincipalTestSuite = {
  name: 'Menú Principal - Suite Completa',
  description: 'Tests completos para navegación en menú principal',
  category: FlowCategory.NAVIGATION,
  testCases: menuPrincipalTestCases,
  parallel: true, // Pueden ejecutarse en paralelo al ser independientes
  retries: 1
}
