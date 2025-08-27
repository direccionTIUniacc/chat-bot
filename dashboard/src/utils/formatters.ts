import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// Formatear fechas
export const formatDate = (date: string | Date, pattern: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, pattern, { locale: es })
  } catch {
    return 'Fecha inválida'
  }
}

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export const formatDateTimeChile = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    // Convertir a hora de Chile (UTC-3 o UTC-4 según DST)
    const chileDate = new Date(dateObj.toLocaleString("en-US", {timeZone: "America/Santiago"}))
    return format(chileDate, 'dd/MM/yyyy HH:mm', { locale: es }) + ' (Chile)'
  } catch {
    return 'Fecha inválida'
  }
}

export const formatTimeAgo = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: es })
  } catch {
    return 'Fecha inválida'
  }
}

// Formatear números
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

export const formatCurrency = (amount: number, currency: string = 'CLP'): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`
}

// Formatear texto
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const capitalizeWords = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  )
}

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .trim()
}

// Formatear contacto
export const formatPhone = (phone: string): string => {
  if (!phone) return ''
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Formato chileno
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    return `+56 9 ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`
  }
  
  // Formato fijo chileno
  if (cleanPhone.length === 9 && !cleanPhone.startsWith('9')) {
    return `+56 ${cleanPhone.slice(0, 1)} ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`
  }
  
  return phone
}

export const formatEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

// Formatear identificadores
export const formatRut = (rut: string): string => {
  if (!rut) return ''
  
  const cleanRut = rut.replace(/[.-]/g, '')
  if (cleanRut.length < 8) return rut
  
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)
  
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedBody}-${dv}`
}

// Formatear estados y etiquetas
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'nuevo': 'Nuevo',
    'contactado': 'Contactado',
    'interesado': 'Interesado',
    'matriculado': 'Matriculado',
    'descartado': 'Descartado',
    'active': 'Activo',
    'inactive': 'Inactivo',
    'pending': 'Pendiente'
  }
  
  return statusMap[status] || capitalizeFirst(status)
}

export const formatSource = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'chatbot': 'ChatBot',
    'web': 'Sitio Web',
    'social': 'Redes Sociales',
    'referido': 'Referido',
    'email': 'Email',
    'phone': 'Teléfono'
  }
  
  return sourceMap[source] || capitalizeFirst(source)
}

export const formatTipoConsulta = (tipoConsulta: string): string => {
  if (!tipoConsulta) return 'Consulta General'
  
  const tipoConsultaMap: Record<string, string> = {
    'consulta carrera': 'Consulta Carrera',
    'consulta proceso admision': 'Consulta Proceso Admisión',
    'consulta costos y/o becas': 'Consulta Costos y/o Becas',
    'consulta de modalidades de estudio': 'Consulta de Modalidades de Estudio',
    'solicitud de asesor': '🚨 Solicitud de Asesor',
    'consulta general': 'Consulta General',
    // Retrocompatibilidad con valores antiguos
    'conocer_carreras': 'Consulta Carrera',
    'proceso_admision': 'Consulta Proceso Admisión',
    'costos_becas': 'Consulta Costos y/o Becas',
    'modalidades_estudio': 'Consulta de Modalidades de Estudio',
    'hablar_asesor': '🚨 Solicitud de Asesor',
    'exploracion_carreras': 'Consulta Carrera',
    'contacto_asesor': '🚨 Solicitud de Asesor',
    'detalle_carrera': 'Consulta Carrera',
    'captura_datos': '🚨 Solicitud de Asesor',
    'menu_principal': 'Consulta General'
  }
  
  return tipoConsultaMap[tipoConsulta] || 'Consulta General'
}

// Formatear duración
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

// Formatear tamaño de archivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Formatear arrays para display
export const formatList = (items: string[], separator: string = ', ', lastSeparator: string = ' y '): string => {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return items.join(lastSeparator)
  
  const allButLast = items.slice(0, -1)
  const last = items[items.length - 1]
  
  return allButLast.join(separator) + lastSeparator + last
}

// Formatear metadatos JSON para display
export const formatMetadata = (metadata: any): string => {
  if (!metadata || typeof metadata !== 'object') return ''
  
  try {
    return Object.entries(metadata)
      .map(([key, value]) => `${capitalizeFirst(key)}: ${value}`)
      .join(', ')
  } catch {
    return 'Metadata inválida'
  }
}

// Helper para generar iniciales
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
