// Estados de prospectos - UNIFICADOS
export const PROSPECTO_ESTADOS = {
  NUEVO: 'nuevo',
  CONTACTO_INICIAL: 'contacto_inicial',
  INFORMACION_ENVIADA: 'informacion_enviada',
  CONTACTADO: 'contactado',
  INTERESADO: 'interesado',
  EN_PROCESO: 'en_proceso',
  MATRICULADO: 'matriculado',
  NO_INTERESADO: 'no_interesado',
  DESCARTADO: 'descartado'
} as const

export const PROSPECTO_ESTADOS_LABELS = {
  [PROSPECTO_ESTADOS.NUEVO]: 'Nuevo',
  [PROSPECTO_ESTADOS.CONTACTO_INICIAL]: 'Contacto Inicial',
  [PROSPECTO_ESTADOS.INFORMACION_ENVIADA]: 'Información Enviada',
  [PROSPECTO_ESTADOS.CONTACTADO]: 'Contactado',
  [PROSPECTO_ESTADOS.INTERESADO]: 'Interesado',
  [PROSPECTO_ESTADOS.EN_PROCESO]: 'En Proceso',
  [PROSPECTO_ESTADOS.MATRICULADO]: 'Matriculado',
  [PROSPECTO_ESTADOS.NO_INTERESADO]: 'No Interesado',
  [PROSPECTO_ESTADOS.DESCARTADO]: 'Descartado'
}

export const PROSPECTO_ESTADOS_COLORS = {
  [PROSPECTO_ESTADOS.NUEVO]: 'bg-blue-100 text-blue-800',
  [PROSPECTO_ESTADOS.CONTACTO_INICIAL]: 'bg-indigo-100 text-indigo-800',
  [PROSPECTO_ESTADOS.INFORMACION_ENVIADA]: 'bg-purple-100 text-purple-800',
  [PROSPECTO_ESTADOS.CONTACTADO]: 'bg-yellow-100 text-yellow-800',
  [PROSPECTO_ESTADOS.INTERESADO]: 'bg-orange-100 text-orange-800',
  [PROSPECTO_ESTADOS.EN_PROCESO]: 'bg-cyan-100 text-cyan-800',
  [PROSPECTO_ESTADOS.MATRICULADO]: 'bg-green-100 text-green-800',
  [PROSPECTO_ESTADOS.NO_INTERESADO]: 'bg-red-100 text-red-800',
  [PROSPECTO_ESTADOS.DESCARTADO]: 'bg-gray-100 text-gray-800'
}

// Fuentes de prospectos - AMPLIADAS
export const PROSPECTO_FUENTES = {
  WHATSAPP_BOT: 'whatsapp_bot',
  WEB_FORM: 'web_form',
  FACEBOOK_ADS: 'facebook_ads',
  GOOGLE_ADS: 'google_ads',
  REFERIDO: 'referido',
  SOCIAL: 'social'
} as const

export const PROSPECTO_FUENTES_LABELS = {
  [PROSPECTO_FUENTES.WHATSAPP_BOT]: 'WhatsApp Bot',
  [PROSPECTO_FUENTES.WEB_FORM]: 'Formulario Web',
  [PROSPECTO_FUENTES.FACEBOOK_ADS]: 'Facebook Ads',
  [PROSPECTO_FUENTES.GOOGLE_ADS]: 'Google Ads',
  [PROSPECTO_FUENTES.REFERIDO]: 'Referido',
  [PROSPECTO_FUENTES.SOCIAL]: 'Redes Sociales'
}

export const PROSPECTO_FUENTES_COLORS = {
  [PROSPECTO_FUENTES.WHATSAPP_BOT]: 'bg-green-100 text-green-800',
  [PROSPECTO_FUENTES.WEB_FORM]: 'bg-blue-100 text-blue-800',
  [PROSPECTO_FUENTES.FACEBOOK_ADS]: 'bg-blue-100 text-blue-800',
  [PROSPECTO_FUENTES.GOOGLE_ADS]: 'bg-red-100 text-red-800',
  [PROSPECTO_FUENTES.REFERIDO]: 'bg-purple-100 text-purple-800',
  [PROSPECTO_FUENTES.SOCIAL]: 'bg-pink-100 text-pink-800'
}

// Niveles de interés
export const NIVEL_INTERES = {
  BAJO: 'bajo',
  MEDIO: 'medio',
  ALTO: 'alto'
} as const

export const NIVEL_INTERES_LABELS = {
  [NIVEL_INTERES.BAJO]: 'Bajo',
  [NIVEL_INTERES.MEDIO]: 'Medio',
  [NIVEL_INTERES.ALTO]: 'Alto'
}

export const NIVEL_INTERES_COLORS = {
  [NIVEL_INTERES.BAJO]: 'bg-gray-100 text-gray-800',
  [NIVEL_INTERES.MEDIO]: 'bg-yellow-100 text-yellow-800',
  [NIVEL_INTERES.ALTO]: 'bg-red-100 text-red-800'
}

// Facultades y carreras de UNIACC
export const FACULTADES_UNIACC = {
  'Facultad de Artes': {
    emoji: '🎭',
    carreras: [
      'Teatro y Comunicación Escénica',
      'Danza y Coreografía',
      'Música e Interpretación',
      'Música y Composición',
      'Artes Visuales'
    ]
  },
  'Facultad de Comunicaciones': {
    emoji: '📺',
    carreras: [
      'Comunicación Audiovisual',
      'Periodismo',
      'Publicidad',
      'Licenciatura en Comunicación Digital - Videojuegos',
      'Licenciatura en Comunicación Digital - Animación'
    ]
  },
  'Facultad de Arquitectura y Diseño': {
    emoji: '🏗️',
    carreras: [
      'Arquitectura',
      'Diseño de Interiores y Ambientes',
      'Diseño Gráfico especialidad Multimedia',
      'Diseño de Imagen especialidad Moda'
    ]
  },
  'Facultad de Ciencias Jurídicas y Sociales': {
    emoji: '⚖️',
    carreras: [
      'Derecho',
      'Psicología',
      'Administración Pública',
      'Trabajo Social',
      'Bibliotecología y Gestión de la Información',
      'Traducción e Interpretariado Bilingüe'
    ]
  },
  'Facultad de Negocios y Tecnología': {
    emoji: '💼',
    carreras: [
      'Ingeniería Comercial',
      'Contador Auditor',
      'Ingeniería Informática Multimedia',
      'Ingeniería en Administración y Gestión de Negocios'
    ]
  }
} as const

// Array plano de todas las carreras para facilitar búsquedas
export const CARRERAS_UNIACC = Object.values(FACULTADES_UNIACC)
  .flatMap(facultad => facultad.carreras)

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
}

// Configuración de fecha
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
}

// Mensajes de la aplicación
export const MESSAGES = {
  SUCCESS: {
    PROSPECTO_CREATED: 'Prospecto creado exitosamente',
    PROSPECTO_UPDATED: 'Prospecto actualizado exitosamente',
    PROSPECTO_DELETED: 'Prospecto eliminado exitosamente'
  },
  ERROR: {
    GENERIC: 'Ha ocurrido un error inesperado',
    NETWORK: 'Error de conexión. Verifica tu conexión a internet',
    VALIDATION: 'Por favor verifica los datos ingresados',
    NOT_FOUND: 'El recurso solicitado no fue encontrado',
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción'
  },
  CONFIRM: {
    DELETE_PROSPECTO: '¿Estás seguro de que deseas eliminar este prospecto?'
  }
}

// URLs de la aplicación
export const APP_URLS = {
  DASHBOARD: '/dashboard',
  PROSPECTOS: '/prospectos',
  METRICAS: '/metricas'
}

// 🆕 CONSTANTES PROGRESSIVE CAPTURE
export const PROGRESSIVE_CAPTURE_CONSTANTS = {
  TIPOS_CONSULTA: {
    CAPTURA_EN_PROCESO: 'captura en proceso',
    ABANDONO_SOLO_NOMBRE: 'abandono solo nombre',
    ABANDONO_CON_EMAIL: 'abandono con email',
    ABANDONO_CON_TELEFONO: 'abandono con telefono',
    ABANDONO_CON_EDAD: 'abandono con edad',
    ABANDONO_CON_REGION: 'abandono con region',
    ABANDONO_INCOMPLETO: 'abandono incompleto',
    CAPTURA_COMPLETA: 'captura completa',
    TIMEOUT_SESSION: 'timeout_session'
  },
  ESTADOS_RECONOCIMIENTO: {
    NUEVO: 'nuevo',
    ABANDONO_PREVIO: 'abandono_previo',
    COMPLETO_PREVIO: 'completo_previo',
    PROCESO_PREVIO: 'proceso_previo'
  },
  CAMPOS_CAPTURA: {
    NOMBRE: 'nombre',
    EMAIL: 'email',
    TELEFONO: 'telefono',
    EDAD: 'edad',
    REGION: 'region'
  }
} as const

// Configuración del chatbot
export const CHATBOT_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos en ms
  TYPING_DELAY: 1000,
  // 🆕 Progressive Capture Config
  PROGRESSIVE_CAPTURE: {
    MAX_RETRIES: 3,
    TIMEOUT_WARNING_MINUTES: 5,
    SESSION_TIMEOUT_MINUTES: 10,
    AUTO_SAVE_ENABLED: true
  }
}
