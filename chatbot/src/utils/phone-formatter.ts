/**
 * 📱 UTILIDAD DE FORMATEO DE NÚMEROS TELEFÓNICOS
 * Estándar internacional E.164 para chatbots universitarios
 */

export interface PhoneValidation {
  isValid: boolean
  formatted?: string
  country?: string
  error?: string
}

/**
 * Formatea número a estándar E.164 internacional
 * Asume Chile como país por defecto
 */
export function formatToE164(phone: string, defaultCountryCode = '56'): PhoneValidation {
  try {
    // Limpiar número - solo dígitos
    const cleaned = phone.replace(/\D/g, '')
    
    // Casos especiales para Chile
    if (defaultCountryCode === '56') {
      return formatChileanNumber(cleaned)
    }
    
    // Formato genérico internacional
    if (cleaned.length >= 10) {
      const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`
      return {
        isValid: true,
        formatted,
        country: 'unknown'
      }
    }
    
    return {
      isValid: false,
      error: 'Número muy corto para formato internacional'
    }
    
  } catch (error) {
    return {
      isValid: false,
      error: `Error formateando número: ${error}`
    }
  }
}

/**
 * Formateo específico para números chilenos
 */
function formatChileanNumber(cleaned: string): PhoneValidation {
  // Caso 1: Número completo con código país (56912345678)
  if (cleaned.length === 11 && cleaned.startsWith('56')) {
    const mobile = cleaned.substring(2) // Quitar 56
    if (mobile.startsWith('9') && mobile.length === 9) {
      return {
        isValid: true,
        formatted: `+${cleaned}`,
        country: 'CL'
      }
    }
  }
  
  // Caso 2: Número móvil chileno sin código país (912345678)
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return {
      isValid: true,
      formatted: `+56${cleaned}`,
      country: 'CL'
    }
  }
  
  // Caso 3: Número móvil sin 9 inicial (12345678)
  if (cleaned.length === 8) {
    return {
      isValid: true,
      formatted: `+569${cleaned}`,
      country: 'CL'
    }
  }
  
  // Caso 4: Número con +56 al inicio
  if (cleaned.length === 13 && cleaned.startsWith('56')) {
    return {
      isValid: true,
      formatted: `+${cleaned}`,
      country: 'CL'
    }
  }
  
  return {
    isValid: false,
    error: 'Formato de número chileno no reconocido'
  }
}

/**
 * Detecta el número desde el userId (WhatsApp ID)
 */
export function detectPhoneFromUserId(userId: string): PhoneValidation {
  // WhatsApp ID generalmente viene como número@dominio o solo número
  const phoneOnly = userId.split('@')[0]
  return formatToE164(phoneOnly)
}

/**
 * Genera mensaje de confirmación con valor claro
 */
export function generatePhoneConfirmationMessage(formattedPhone: string): string {
  return `📱 Detectamos que escribes desde ${formattedPhone}

Para personalizar tu experiencia en UNIACC:

✅ Recordar tus consultas anteriores
✅ Enviarte info de carreras de tu interés  
✅ Conectarte directamente con asesores académicos
✅ Actualizaciones importantes de admisión

¿Confirmamos este número como tu contacto preferido?

1️⃣ Sí, usar para mejorar mi experiencia UNIACC
2️⃣ Prefiero dar otro número
3️⃣ Continuar sin guardar número

💡 Tip: Podrás cambiar estas preferencias cuando quieras
🔒 Tus datos están protegidos según nuestras políticas de privacidad`
}

/**
 * Valida si un número es válido para WhatsApp
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const validation = formatToE164(phone)
  
  if (!validation.isValid) return false
  
  // Verificar longitud mínima internacional (8-15 dígitos después del +)
  const numberPart = validation.formatted!.substring(1) // Quitar +
  return numberPart.length >= 8 && numberPart.length <= 15
}

/**
 * Obtiene el país desde el código
 */
export function getCountryFromPhone(formattedPhone: string): string {
  if (formattedPhone.startsWith('+56')) return 'Chile'
  if (formattedPhone.startsWith('+1')) return 'Estados Unidos/Canadá'
  if (formattedPhone.startsWith('+44')) return 'Reino Unido'
  if (formattedPhone.startsWith('+33')) return 'Francia'
  if (formattedPhone.startsWith('+49')) return 'Alemania'
  if (formattedPhone.startsWith('+34')) return 'España'
  if (formattedPhone.startsWith('+39')) return 'Italia'
  if (formattedPhone.startsWith('+55')) return 'Brasil'
  if (formattedPhone.startsWith('+52')) return 'México'
  if (formattedPhone.startsWith('+54')) return 'Argentina'
  if (formattedPhone.startsWith('+57')) return 'Colombia'
  if (formattedPhone.startsWith('+51')) return 'Perú'
  
  return 'País no identificado'
}

export default {
  formatToE164,
  detectPhoneFromUserId,
  generatePhoneConfirmationMessage,
  isValidWhatsAppNumber,
  getCountryFromPhone
}
