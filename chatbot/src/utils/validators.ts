// Validadores básicos simplificados para MVP (sin zod)

export const emailValidator = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const phoneValidator = (phone: string): boolean => {
  return phone.length >= 8
}

export const nameValidator = (name: string): boolean => {
  return name.length >= 2
}

// Validador de RUT chileno simplificado
export const rutValidator = (rut: string): boolean => {
  if (!rut) return false
  
  // Remover puntos y guión
  const cleanRut = rut.replace(/[.-]/g, '')
  
  // Verificar formato
  if (!/^\d{7,8}[\dkK]$/.test(cleanRut)) return false
  
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1).toLowerCase()
  
  // Calcular dígito verificador
  let sum = 0
  let multiplier = 2
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  
  const remainder = sum % 11
  const calculatedDv = remainder === 0 ? '0' : remainder === 1 ? 'k' : (11 - remainder).toString()
  
  return dv === calculatedDv
}

// Validador de fecha
export const dateValidator = (date: string): boolean => {
  if (!date) return true // Fecha opcional
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

// Validador de fecha futura
export const futureDateValidator = (date: string): boolean => {
  if (!date) return true
  const parsedDate = new Date(date)
  return parsedDate > new Date()
}

// Validador de URL
export const urlValidator = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Validador de texto con longitud
export const textValidator = (text: string, min: number = 1, max: number = 255): boolean => {
  return text.length >= min && text.length <= max
}

// Validador de número entero positivo
export const positiveIntValidator = (num: number): boolean => {
  return Number.isInteger(num) && num > 0
}

// Rate limiting simple
interface RateLimit {
  count: number
  resetTime: number
}

const rateLimitCache: Record<string, RateLimit> = {}

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now()
  const limit = rateLimitCache[key]
  
  if (!limit || now > limit.resetTime) {
    rateLimitCache[key] = { count: 1, resetTime: now + windowMs }
    return true
  }
  
  if (limit.count >= maxRequests) {
    return false
  }
  
  limit.count++
  return true
}

// Validador de UTM parameters
export const utmValidator = (utm: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(utm)
}

// Validador de campos requeridos
export const requiredFieldValidator = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

// Limpiar y validar texto
export const sanitizeText = (text: string): string => {
  return text.trim().replace(/[<>]/g, '')
}

// Validar datos de prospecto
export interface ProspectoValidation {
  nombre: string
  email: string
  telefono: string
  whatsapp?: string
  carrera_interes?: string
}

export const validateProspecto = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!nameValidator(data.nombre)) {
    errors.push('Nombre debe tener al menos 2 caracteres')
  }
  
  if (!emailValidator(data.email)) {
    errors.push('Email inválido')
  }
  
  if (!phoneValidator(data.telefono)) {
    errors.push('Teléfono debe tener al menos 8 dígitos')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}