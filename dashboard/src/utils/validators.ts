import { z } from 'zod'

// Validadores básicos
export const emailValidator = z.string().email('Email inválido')
export const phoneValidator = z.string().min(8, 'Teléfono debe tener al menos 8 dígitos')
export const nameValidator = z.string().min(2, 'Nombre debe tener al menos 2 caracteres')

// Validador de RUT chileno
export const rutValidator = z.string().refine((rut) => {
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
}, 'RUT inválido')

// Validador de fecha
export const dateValidator = z.string().refine((date) => {
  if (!date) return true // Fecha opcional
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}, 'Fecha inválida')

// Validador de fecha futura
export const futureDateValidator = z.string().refine((date) => {
  if (!date) return true
  const parsedDate = new Date(date)
  return parsedDate > new Date()
}, 'La fecha debe ser futura')

// Validador de URL
export const urlValidator = z.string().url('URL inválida')

// Validador de texto con longitud mínima y máxima
export const textValidator = (min: number = 1, max: number = 255) => 
  z.string().min(min, `Mínimo ${min} caracteres`).max(max, `Máximo ${max} caracteres`)

// Validador de número entero positivo
export const positiveIntValidator = z.number().int().positive('Debe ser un número entero positivo')

// Validador de porcentaje (0-100)
export const percentageValidator = z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%')

// Validador personalizado para contraseñas
export const passwordValidator = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/\d/, 'Debe contener al menos un número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe contener al menos un carácter especial')

// Función para validar archivos
export const fileValidator = (maxSize: number = 5 * 1024 * 1024, allowedTypes: string[] = []) => 
  z.instanceof(File)
    .refine((file) => file.size <= maxSize, `El archivo debe ser menor a ${maxSize / 1024 / 1024}MB`)
    .refine(
      (file) => allowedTypes.length === 0 || allowedTypes.includes(file.type),
      `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`
    )

// Validador de horario (HH:mm)
export const timeValidator = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')

// Validador de código postal chileno
export const postalCodeValidator = z.string().regex(/^\d{7}$/, 'Código postal debe tener 7 dígitos')

// Función helper para sanitizar strings
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ')
}

// Función helper para validar y sanitizar email
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

// Función helper para formatear RUT
export const formatRut = (rut: string): string => {
  const cleanRut = rut.replace(/[.-]/g, '')
  if (cleanRut.length < 8) return rut
  
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)
  
  // Agregar puntos cada 3 dígitos desde la derecha
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `${formattedBody}-${dv}`
}

// Función helper para formatear teléfono
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length === 9) {
    return `+56 9 ${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4)}`
  }
  
  return phone
}

// Validadores compuestos para formularios específicos
export const prospectFormValidators = {
  nombre: nameValidator,
  email: emailValidator,
  telefono: phoneValidator.optional(),
  carrera_interes: z.string().min(1, 'Selecciona una carrera'),
  nivel_interes: z.enum(['bajo', 'medio', 'alto'], { 
    message: 'Selecciona un nivel de interés'
  }),
  fuente: z.enum(['chatbot', 'web', 'social', 'referido'], {
    message: 'Selecciona una fuente'
  }),
  notas: textValidator(0, 1000).optional()
}
