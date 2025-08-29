// 🎓 TIPOS DE FLUJO UNIVERSITARIO ESTÁNDAR - Basado en mejores prácticas globales

// ========================================
// FLUJOS PRINCIPALES - ESTÁNDAR UNIVERSITARIO
// ========================================

export const FLUJOS = {
  // 🚀 DISCOVERY PHASE - Descubrimiento universitario
  WELCOME: 'welcome',                           // Bienvenida inicial
  UNIVERSITY_DISCOVERY: 'university_discovery', // Exploración general de la universidad
  PROGRAM_DISCOVERY: 'program_discovery',       // Descubrimiento de programas académicos
  
  // 🎯 GUIDANCE PHASE - Orientación académica
  ACADEMIC_GUIDANCE: 'academic_guidance',       // Orientación vocacional
  PROGRAM_COMPARISON: 'program_comparison',     // Comparación de programas
  CAREER_EXPLORATION: 'career_exploration',     // Exploración de carreras
  
  // 📋 ADMISSION PHASE - Proceso de admisión
  ADMISSION_INQUIRY: 'admission_inquiry',       // Consultas sobre admisión
  APPLICATION_SUPPORT: 'application_support',   // Apoyo en aplicación
  REQUIREMENTS_CHECK: 'requirements_check',     // Verificación de requisitos
  
  // 💰 FINANCIAL PHASE - Información financiera
  FINANCIAL_INQUIRY: 'financial_inquiry',       // Consultas financieras
  SCHOLARSHIP_GUIDANCE: 'scholarship_guidance', // Orientación sobre becas
  PAYMENT_SUPPORT: 'payment_support',           // Apoyo en pagos
  
  // 👥 ENGAGEMENT PHASE - Compromiso y seguimiento
  ADVISOR_CONNECTION: 'advisor_connection',     // Conexión con asesores
  CAMPUS_EXPERIENCE: 'campus_experience',       // Experiencia de campus
  STUDENT_SERVICES: 'student_services',         // Servicios estudiantiles
  
  // 📊 DATA COLLECTION - Recolección de datos
  PROSPECT_CAPTURE: 'prospect_capture',         // Captura de prospectos
  LEAD_QUALIFICATION: 'lead_qualification',     // Calificación de leads
  FOLLOW_UP_SCHEDULING: 'follow_up_scheduling', // Programación de seguimiento
  
  // 🔄 RETENTION & SUPPORT - Retención y soporte
  STUDENT_SUPPORT: 'student_support',           // Soporte a estudiantes actuales
  ALUMNI_ENGAGEMENT: 'alumni_engagement',       // Engagement con alumni
  FEEDBACK_COLLECTION: 'feedback_collection'    // Recolección de feedback
} as const

// ========================================
// PASOS ESPECÍFICOS - CUSTOMER JOURNEY UNIVERSITARIO
// ========================================

export const PASOS = {
  // 🚀 DISCOVERY STEPS - Pasos de descubrimiento
  SHOW_WELCOME: 'show_welcome',                     // Mostrar bienvenida
  ASSESS_VISITOR_TYPE: 'assess_visitor_type',       // Evaluar tipo de visitante
  SHOW_MAIN_OPTIONS: 'show_main_options',           // Mostrar opciones principales
  CAPTURE_INITIAL_INTEREST: 'capture_initial_interest', // Capturar interés inicial
  
  // 🎯 GUIDANCE STEPS - Pasos de orientación
  ACADEMIC_PROFILE_ASSESSMENT: 'academic_profile_assessment', // Evaluación de perfil académico
  PROGRAM_RECOMMENDATION: 'program_recommendation',           // Recomendación de programas
  CAREER_MATCHING: 'career_matching',                         // Matching de carreras
  SHOW_PROGRAM_DETAILS: 'show_program_details',               // Mostrar detalles del programa
  COMPARE_PROGRAMS: 'compare_programs',                       // Comparar programas
  
  // 📋 ADMISSION STEPS - Pasos de admisión
  CHECK_ADMISSION_REQUIREMENTS: 'check_admission_requirements', // Verificar requisitos
  EXPLAIN_APPLICATION_PROCESS: 'explain_application_process',   // Explicar proceso de aplicación
  SCHEDULE_ADMISSION_INTERVIEW: 'schedule_admission_interview', // Programar entrevista
  PROVIDE_DOCUMENT_CHECKLIST: 'provide_document_checklist',     // Proporcionar lista de documentos
  
  // 💰 FINANCIAL STEPS - Pasos financieros
  SHOW_TUITION_FEES: 'show_tuition_fees',                     // Mostrar costos de matrícula
  EXPLAIN_PAYMENT_OPTIONS: 'explain_payment_options',         // Explicar opciones de pago
  SCHOLARSHIP_ELIGIBILITY: 'scholarship_eligibility',         // Elegibilidad para becas
  FINANCIAL_AID_GUIDANCE: 'financial_aid_guidance',           // Orientación sobre ayuda financiera
  
  // 👥 ENGAGEMENT STEPS - Pasos de compromiso
  CONNECT_WITH_ADVISOR: 'connect_with_advisor',               // Conectar con asesor
  SCHEDULE_CAMPUS_VISIT: 'schedule_campus_visit',             // Programar visita al campus
  JOIN_VIRTUAL_EVENT: 'join_virtual_event',                   // Unirse a evento virtual
  CONNECT_WITH_STUDENTS: 'connect_with_students',             // Conectar con estudiantes actuales
  
  // 📊 DATA COLLECTION STEPS - Pasos de recolección de datos
  COLLECT_BASIC_INFO: 'collect_basic_info',                   // Recopilar información básica
  COLLECT_ACADEMIC_BACKGROUND: 'collect_academic_background', // Recopilar antecedentes académicos
  COLLECT_CONTACT_PREFERENCES: 'collect_contact_preferences', // Recopilar preferencias de contacto
  QUALIFY_LEAD_INTENT: 'qualify_lead_intent',                 // Calificar intención del lead
  
  // 🔄 FOLLOW-UP STEPS - Pasos de seguimiento
  SCHEDULE_FOLLOW_UP: 'schedule_follow_up',                   // Programar seguimiento
  SEND_INFORMATION_PACKET: 'send_information_packet',         // Enviar paquete de información
  NURTURE_RELATIONSHIP: 'nurture_relationship',               // Nutrir relación
  
  // 🎓 SPECIALIZED STEPS - Pasos especializados
  EVALUATE_TRANSFER_CREDITS: 'evaluate_transfer_credits',     // Evaluar créditos de transferencia
  INTERNATIONAL_STUDENT_SUPPORT: 'international_student_support', // Soporte para estudiantes internacionales
  ACCESSIBILITY_SUPPORT: 'accessibility_support',             // Soporte de accesibilidad
  CONTINUING_EDUCATION: 'continuing_education'                // Educación continua
} as const

// ========================================
// OPCIONES DE MENÚ
// ========================================

export const OPCIONES_MENU = {
  EXPLORAR_CARRERAS: 'explorar_carreras',
  PROCESO_ADMISION: 'proceso_admision',
  COSTOS_BECAS: 'costos_becas',
  MODALIDADES_ESTUDIO: 'modalidades_estudio',
  HABLAR_ASESOR: 'hablar_asesor',
  BUSQUEDA_DIRECTA: 'busqueda_directa'
} as const

// ========================================
// TIPOS DE CONSULTA
// ========================================

export const TIPOS_CONSULTA = {
  // Captura completa
  CAPTURA_COMPLETA: 'captura_completa',
  
  // Abandonos con datos parciales
  ABANDONO_SOLO_NOMBRE: 'abandono_solo_nombre',
  ABANDONO_CON_EMAIL: 'abandono_con_email',
  ABANDONO_CON_EDAD: 'abandono_con_edad',
  ABANDONO_CON_REGION: 'abandono_con_region',
  
  // Consultas específicas
  EXPLORACION_CARRERAS: 'exploracion_carreras',
  SOLICITUD_ASESOR: 'solicitud_asesor',
  CONSULTA_ADMISION: 'consulta_admision',
  CONSULTA_COSTOS: 'consulta_costos',
  
  // Entrada con datos básicos
  INGRESO_DATOS_BASICOS: 'ingreso_datos_basicos'
} as const

// ========================================
// NIVELES DE INTERÉS
// ========================================

export const NIVELES_INTERES = {
  BAJO: 'bajo',        // Timeout, abandono temprano
  MEDIO: 'medio',      // Exploración básica
  ALTO: 'alto',        // Solicitud de asesor, captura completa
  MUY_ALTO: 'muy_alto' // Múltiples interacciones, alta engagement
} as const

// ========================================
// FUENTES DE ENTRADA
// ========================================

export const FUENTES = {
  UNIACC_CHATBOT: 'uniacc_chatbot',
  ASESOR_REQUEST: 'asesor_request',
  EXPLORACION_WEB: 'exploracion_web',
  BUSQUEDA_DIRECTA: 'busqueda_directa'
} as const

// ========================================
// TIPOS TYPESCRIPT
// ========================================

export type Flujo = typeof FLUJOS[keyof typeof FLUJOS]
export type Paso = typeof PASOS[keyof typeof PASOS]
export type OpcionMenu = typeof OPCIONES_MENU[keyof typeof OPCIONES_MENU]
export type TipoConsulta = typeof TIPOS_CONSULTA[keyof typeof TIPOS_CONSULTA]
export type NivelInteres = typeof NIVELES_INTERES[keyof typeof NIVELES_INTERES]
export type Fuente = typeof FUENTES[keyof typeof FUENTES]

// ========================================
// INTERFACES MEJORADAS
// ========================================

export interface EstadoUsuarioNormalizado {
  flujo_actual: Flujo | null
  paso_actual: Paso | null
  opcion_menu_seleccionada?: OpcionMenu
  datos_prospecto: {
    nombre?: string
    email?: string
    telefono?: string
    edad?: number
    region?: string
    carrera_interes?: string
    nivel_interes?: NivelInteres
    campus_preferido?: string
  }
  contexto_navegacion: {
    facultad_seleccionada?: string
    carrera_seleccionada?: string
    carreras_sugeridas?: any[]
    historial_consultas?: string[]
    ultima_carrera_consultada?: string
  }
  sesion_info: {
    es_usuario_recurrente?: boolean
    fecha_ultima_interaccion?: Date
    intentos_captura: number
    prospecto_id?: string
    ultimo_campo_guardado?: 'nombre' | 'email' | 'telefono' | 'edad' | 'region'
    campos_capturados?: string[]
    fecha_creacion_prospecto?: Date
  }
  timeout_config: {
    timeout_warning_sent?: boolean
    session_timeout_id?: NodeJS.Timeout
    warning_timeout_id?: NodeJS.Timeout
  }
}

// ========================================
// MAPEO DE MIGRACIÓN - LEGACY TO UNIVERSITY STANDARD
// ========================================

export const MAPEO_FLUJOS_LEGACY = {
  // Mapear términos UNIACC actuales → Estándar universitario
  'captura_inicial': FLUJOS.PROSPECT_CAPTURE,
  'captura_datos': FLUJOS.PROSPECT_CAPTURE,
  'menu_principal': FLUJOS.WELCOME,
  'menu_contextual': FLUJOS.UNIVERSITY_DISCOVERY,
  'exploracion_carreras': FLUJOS.PROGRAM_DISCOVERY,
  'detalle_carrera': FLUJOS.CAREER_EXPLORATION,
  'busqueda_directa_carrera': FLUJOS.PROGRAM_DISCOVERY,
  'proceso_admision': FLUJOS.ADMISSION_INQUIRY,
  'costos_becas': FLUJOS.FINANCIAL_INQUIRY,
  'costos_becas_decision': FLUJOS.FINANCIAL_INQUIRY,
  'modalidades_estudio': FLUJOS.PROGRAM_COMPARISON,
  'modalidades_decision': FLUJOS.PROGRAM_COMPARISON,
  'solicitud_asesor': FLUJOS.ADVISOR_CONNECTION,
  'consulta_finalizada': FLUJOS.FOLLOW_UP_SCHEDULING
} as const

export const MAPEO_PASOS_LEGACY = {
  // Mapear pasos UNIACC actuales → Estándar universitario
  'solicitar_nombre': PASOS.COLLECT_BASIC_INFO,
  'solicitar_email': PASOS.COLLECT_BASIC_INFO,
  'solicitar_telefono': PASOS.COLLECT_BASIC_INFO,
  'solicitar_edad': PASOS.COLLECT_ACADEMIC_BACKGROUND,
  'solicitar_region': PASOS.COLLECT_CONTACT_PREFERENCES,
  'seleccion_facultad': PASOS.ACADEMIC_PROFILE_ASSESSMENT,
  'lista_carreras': PASOS.PROGRAM_RECOMMENDATION,
  'mostrar_info': PASOS.SHOW_PROGRAM_DETAILS,
  'mostrar_detalle': PASOS.SHOW_PROGRAM_DETAILS,
  'asesor_inteligente': PASOS.CONNECT_WITH_ADVISOR,
  'opciones_recurrente': PASOS.SHOW_MAIN_OPTIONS,
  'buscar_carrera': PASOS.CAREER_MATCHING,
  'solicitar_carrera': PASOS.CAREER_MATCHING,
  'seleccionar_sugerencia': PASOS.PROGRAM_RECOMMENDATION,
  'mostrar_sugerencias': PASOS.PROGRAM_RECOMMENDATION,
  'opciones': PASOS.SHOW_MAIN_OPTIONS,
  'info_general': PASOS.EXPLAIN_APPLICATION_PROCESS,
  'completado': PASOS.SCHEDULE_FOLLOW_UP
} as const

// ========================================
// FUNCIONES HELPER
// ========================================

export function normalizarFlujo(flujoLegacy: string): Flujo | null {
  return MAPEO_FLUJOS_LEGACY[flujoLegacy as keyof typeof MAPEO_FLUJOS_LEGACY] || flujoLegacy as Flujo
}

export function normalizarPaso(pasoLegacy: string): Paso | null {
  return MAPEO_PASOS_LEGACY[pasoLegacy as keyof typeof MAPEO_PASOS_LEGACY] || pasoLegacy as Paso
}

export function esFlujoValido(flujo: string): flujo is Flujo {
  return Object.values(FLUJOS).includes(flujo as Flujo)
}

export function esPasoValido(paso: string): paso is Paso {
  return Object.values(PASOS).includes(paso as Paso)
}

// ========================================
// VALIDACIONES
// ========================================

export function validarEstadoUsuario(estado: any): {
  valido: boolean
  errores: string[]
} {
  const errores: string[] = []
  
  if (estado.flujo_actual && !esFlujoValido(estado.flujo_actual)) {
    errores.push(`Flujo inválido: ${estado.flujo_actual}`)
  }
  
  if (estado.paso_actual && !esPasoValido(estado.paso_actual)) {
    errores.push(`Paso inválido: ${estado.paso_actual}`)
  }
  
  return {
    valido: errores.length === 0,
    errores
  }
}
