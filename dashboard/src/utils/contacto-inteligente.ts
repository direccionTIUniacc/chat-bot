/**
 * Utilidades para Contacto Directo Inteligente
 * Funciones para generar mensajes contextuales y validar horarios óptimos
 */

export interface ProspectoContacto {
  whatsapp?: string
  telefono?: string
  nombre?: string
  email?: string
  carrera_interes?: string
  estado?: string
  nivel_interes?: string
  perfil_usuario?: string
  tipo_consulta_actual?: string
  primera_interaccion?: string
  ultima_interaccion?: string
  total_sesiones?: number
}

export interface UsuarioActual {
  id: string
  nombre: string
  email: string
  carreras_especializacion?: string[]
}

// 📱 GENERACIÓN DE MENSAJES WHATSAPP CONTEXTUALES
export const generarMensajeWhatsApp = (prospecto: ProspectoContacto, usuario: UsuarioActual): string => {
  const nombre = prospecto.nombre || 'Hola'
  const carrera = prospecto.carrera_interes || 'nuestras carreras'
  const ejecutivo = usuario.nombre || 'el equipo de UNIACC'
  
  // Plantillas por contexto
  const plantillas = {
    // 🆕 Prospecto nuevo - Primera vez
    nuevo: `¡Hola ${nombre}! 👋 Soy ${ejecutivo} de UNIACC. Vi que consultaste sobre ${carrera}. ¿Tienes 2 minutos para una consulta rápida? Te puedo resolver todas tus dudas 🎓`,
    
    // 🔄 Prospecto recurrente - Ya nos conoce
    recurrente: `Hola ${nombre}! 😊 Como ya nos conoces, tengo novedades sobre ${carrera} que te van a interesar. ¿Conversamos? Es más rápido por WhatsApp`,
    
    // ⚠️ Abandono con datos - Reactivación
    abandono_con_telefono: `${nombre}, vi que estuviste consultando sobre ${carrera} pero no pudimos completar la información. ¿Te gustaría que conversemos por WhatsApp? Es más rápido y personal 😊`,
    
    abandono_con_email: `Hola ${nombre}! 👋 Quedamos pendientes de tu consulta sobre ${carrera}. ¿Tienes un momento para conversar? Te puedo aclarar todas las dudas que tengas 🎓`,
    
    // 🚨 Casos urgentes
    urgente: `🚨 ${nombre}, vi que tienes una consulta urgente sobre ${carrera}. Soy ${ejecutivo} y te contacto ahora para ayudarte. ¿Estás disponible?`,
    
    // 🎯 Alto interés - Prospecto muy interesado
    altamente_interesado: `Hola ${nombre}! 🌟 Como veo que estás muy interesado en ${carrera}, te quiero contar sobre una oportunidad especial que tenemos. ¿Conversamos?`,
    
    // 📞 Solicitud de asesor específica
    solicitar_asesor: `¡Hola ${nombre}! 👨‍🎓 Soy ${ejecutivo}, el asesor especializado en ${carrera} que solicitaste. Estoy aquí para resolver todas tus dudas. ¿Empezamos?`,
    
    // ⏰ Timeout - Sesión expirada
    timeout_session: `Hola ${nombre}! Vi que se cortó nuestra conversación sobre ${carrera}. No te preocupes, retomamos desde donde quedamos. ¿Te parece bien? 😊`,
    
    // 🎓 Interés definido - Sabe qué quiere
    interes_definido: `Hola ${nombre}! 🎯 Perfecto que tengas claro tu interés en ${carrera}. Te puedo dar toda la información específica que necesitas. ¿Conversamos?`
  }
  
  // Determinar el contexto del prospecto
  let contexto = 'nuevo'
  
  if (prospecto.nivel_interes === 'urgente') {
    contexto = 'urgente'
  } else if (prospecto.tipo_consulta_actual === 'solicitar_asesor') {
    contexto = 'solicitar_asesor'
  } else if (prospecto.tipo_consulta_actual === 'timeout_session') {
    contexto = 'timeout_session'
  } else if (prospecto.tipo_consulta_actual?.includes('abandono')) {
    if (prospecto.tipo_consulta_actual.includes('telefono')) {
      contexto = 'abandono_con_telefono'
    } else {
      contexto = 'abandono_con_email'
    }
  } else if (prospecto.perfil_usuario === 'altamente_interesado') {
    contexto = 'altamente_interesado'
  } else if (prospecto.perfil_usuario === 'interes_definido') {
    contexto = 'interes_definido'
  } else if (prospecto.estado === 'recurrente' || (prospecto.total_sesiones && prospecto.total_sesiones > 1)) {
    contexto = 'recurrente'
  }
  
  return plantillas[contexto as keyof typeof plantillas] || plantillas.nuevo
}

// 📞 VALIDACIÓN DE HORARIOS ÓPTIMOS
export const validarHorarioLaboral = (fecha: Date = new Date()): boolean => {
  const hora = fecha.getHours()
  const dia = fecha.getDay() // 0=domingo, 6=sábado
  
  // Lunes a Viernes: 9:00 - 18:00
  if (dia >= 1 && dia <= 5) {
    return hora >= 9 && hora < 18
  }
  
  // Sábado: 9:00 - 13:00  
  if (dia === 6) {
    return hora >= 9 && hora < 13
  }
  
  // Domingo: No laboral
  return false
}

export const calcularMejorHorario = (prospecto: ProspectoContacto): string => {
  const ahora = new Date()
  const hora = ahora.getHours()
  
  // Analizar patrón de interacciones previas (si está disponible)
  if (prospecto.primera_interaccion) {
    const primeraInteraccion = new Date(prospecto.primera_interaccion)
    const horaPrimera = primeraInteraccion.getHours()
    
    if (horaPrimera >= 9 && horaPrimera < 12) {
      return 'en la mañana (9:00-12:00)'
    } else if (horaPrimera >= 12 && horaPrimera < 15) {
      return 'después del almuerzo (12:00-15:00)'
    } else if (horaPrimera >= 15 && horaPrimera < 18) {
      return 'en la tarde (15:00-18:00)'
    }
  }
  
  // Default por horario actual
  if (hora >= 9 && hora < 12) {
    return 'en la mañana'
  } else if (hora >= 12 && hora < 15) {
    return 'después del almuerzo'
  } else if (hora >= 15 && hora < 18) {
    return 'en la tarde'
  } else {
    return 'en horario laboral (Lun-Vie 9:00-18:00, Sáb 9:00-13:00)'
  }
}

export const calcularConfianzaContacto = (prospecto: ProspectoContacto, fecha: Date = new Date()): number => {
  let confidence = 0.5 // Base 50%
  
  // Horario laboral
  if (validarHorarioLaboral(fecha)) {
    confidence += 0.3
  }
  
  // Nivel de interés
  if (prospecto.nivel_interes === 'urgente') {
    confidence += 0.4
  } else if (prospecto.nivel_interes === 'alto') {
    confidence += 0.2
  }
  
  // Actividad reciente
  if (prospecto.ultima_interaccion) {
    const ultimaInteraccion = new Date(prospecto.ultima_interaccion)
    const horasDesdeUltimaInteraccion = (fecha.getTime() - ultimaInteraccion.getTime()) / (1000 * 60 * 60)
    
    if (horasDesdeUltimaInteraccion < 1) {
      confidence += 0.3 // Muy reciente
    } else if (horasDesdeUltimaInteraccion < 24) {
      confidence += 0.1 // Reciente
    }
  }
  
  // Perfil de usuario
  if (prospecto.perfil_usuario === 'altamente_interesado') {
    confidence += 0.2
  }
  
  return Math.min(confidence, 1.0) // Máximo 100%
}

// 🧹 LIMPIEZA Y FORMATO DE NÚMEROS
export const limpiarNumero = (numero: string | undefined): string => {
  if (!numero) return ''
  
  // Eliminar todos los caracteres no numéricos excepto '+'
  let cleaned = numero.replace(/[^\d+]/g, '')
  
  // Si no empieza con +, agregar +56 (Chile)
  if (!cleaned.startsWith('+')) {
    // Si empieza con 56, agregar +
    if (cleaned.startsWith('56')) {
      cleaned = '+' + cleaned
    } 
    // Si empieza con 9, agregar +56
    else if (cleaned.startsWith('9')) {
      cleaned = '+56' + cleaned
    }
    // Si es otro formato, agregar +56
    else {
      cleaned = '+56' + cleaned
    }
  }
  
  return cleaned
}

// 📧 GENERACIÓN DE EMAILS CONTEXTUALES
export const generarEmailContextual = (prospecto: ProspectoContacto, usuario: UsuarioActual) => {
  const nombre = prospecto.nombre || 'Estimado/a'
  const carrera = prospecto.carrera_interes || 'nuestras carreras'
  const ejecutivo = usuario.nombre || 'el equipo de UNIACC'
  
  const templates = {
    info_completa: {
      subject: `${nombre}, toda la información de ${carrera} que necesitas 📚`,
      body: `Hola ${nombre}!

Como prometí, aquí tienes toda la información sobre ${carrera}:

📋 Plan de estudios completo
💰 Costos y modalidades de pago  
🎓 Perfil de egreso y campo laboral
📅 Próximas fechas de inicio
🏛️ Modalidades: Presencial y Online
💡 Metodología de enseñanza

¿Te parece si coordinamos una reunión para resolver tus dudas específicas?

Estoy disponible por WhatsApp, teléfono o videollamada.

Saludos cordiales,
${ejecutivo}
UNIACC - Universidad`,
      template: 'info_completa'
    },
    
    seguimiento: {
      subject: `${nombre}, ¿cómo va tu decisión sobre ${carrera}? 🤔`,
      body: `Hola ${nombre}!

Hace unos días conversamos sobre ${carrera}. ¿Has tenido tiempo de revisar la información?

Me gustaría saber:
• ¿Hay algo específico que no te quede claro?
• ¿Necesitas información adicional?
• ¿Tienes dudas sobre el proceso de admisión?

Estoy aquí para resolver cualquier consulta y ayudarte a tomar la mejor decisión para tu futuro 😊

¡No dudes en contactarme!

${ejecutivo}
UNIACC - Universidad`,
      template: 'seguimiento'
    },
    
    reactivacion: {
      subject: `${nombre}, nuevas oportunidades en ${carrera} 🎯`,
      body: `Hola ${nombre}!

Tenemos excelentes noticias sobre ${carrera}:

🔥 Nuevos descuentos disponibles
📅 Nuevas fechas de inicio flexibles  
💡 Modalidades híbridas disponibles
🎓 Convenios con empresas para práctica

Como mostraste interés anteriormente, quería compartir estas novedades contigo.

¿Te interesa conocer más detalles? ¡Conversemos!

${ejecutivo}
UNIACC - Universidad`,
      template: 'reactivacion'
    },
    
    urgente: {
      subject: `🚨 ${nombre}, atención urgente para ${carrera}`,
      body: `Hola ${nombre}!

Vi que marcaste tu consulta como urgente. Estoy priorizando tu caso.

⚡ Respuesta inmediata garantizada
📞 Contacto directo conmigo
🎯 Solución rápida a tus dudas

Por favor, responde este email o contáctame por WhatsApp para atenderte de inmediato.

${ejecutivo}
UNIACC - Universidad
📱 WhatsApp: [TU_NÚMERO]`,
      template: 'urgente'
    }
  }
  
  // Determinar template por contexto
  let templateKey = 'seguimiento'
  
  if (prospecto.nivel_interes === 'urgente') {
    templateKey = 'urgente'
  } else if (prospecto.tipo_consulta_actual?.includes('abandono')) {
    templateKey = 'reactivacion'
  } else if (prospecto.estado === 'nuevo') {
    templateKey = 'info_completa'
  }
  
  return templates[templateKey as keyof typeof templates]
}

// 📊 REGISTRO DE ACCIONES
export interface AccionRegistro {
  prospecto_id: string
  tipo_accion: 'whatsapp_directo' | 'llamada_directa' | 'email_enviado' | 'accion_programada'
  datos_accion: Record<string, any>
  ejecutivo_id: string
  timestamp: Date
  resultado?: string
  notas?: string
}

export const registrarAccion = async (prospecto: ProspectoContacto, tipoAccion: AccionRegistro['tipo_accion'], datos: any) => {
  const accion: AccionRegistro = {
    prospecto_id: prospecto.whatsapp || '',
    tipo_accion: tipoAccion,
    datos_accion: datos,
    ejecutivo_id: datos.ejecutivo || '',
    timestamp: new Date()
  }
  
  // Aquí integraríamos con la API para guardar en BD
  console.log('📊 Acción registrada:', accion)
  
  // TODO: Implementar llamada a API
  // await fetch('/api/acciones', { method: 'POST', body: JSON.stringify(accion) })
}
