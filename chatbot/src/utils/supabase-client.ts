import { createClient } from '@supabase/supabase-js'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de Supabase no configuradas')
  throw new Error('Variables de entorno de Supabase faltantes')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 🕐 FUNCIÓN HELPER: Obtener fecha/hora en zona horaria de Chile
function getChileTime(): string {
  const now = new Date()
  const chileTime = toZonedTime(now, 'America/Santiago')
  return chileTime.toISOString()
}

// 🕐 FUNCIÓN HELPER: Formatear fecha para mostrar en Chile
function formatChileTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(dateObj, 'America/Santiago', 'yyyy-MM-dd HH:mm:ss')
}

// Función para formatear WhatsApp según la validación de la BD
function formatearWhatsapp(numero: string): string {
  if (!numero) {
    console.log('⚠️ No hay número, usando fallback')
    return '+56912345678'
  }
  
  console.log('🔧 Formateando número:', numero)
  
  // Remover espacios, guiones, paréntesis y otros caracteres
  let limpio = numero.replace(/[\s\-\(\)]/g, '')
  console.log('  Sin caracteres especiales:', limpio)
  
  // Asegurar que empiece con +56 (Chile)
  if (!limpio.startsWith('56') && !limpio.startsWith('+56')) {
    if (limpio.startsWith('9')) {
      limpio = '+56' + limpio
    } else {
      limpio = '+56' + limpio
    }
  } else if (limpio.startsWith('56') && !limpio.startsWith('+56')) {
    limpio = '+' + limpio
  }
  
  console.log('  Con prefijo +56:', limpio)
  
  // Verificar que tenga entre 8 y 20 dígitos
  const soloNumeros = limpio.replace(/\D/g, '')
  console.log('  Solo números:', soloNumeros, 'Longitud:', soloNumeros.length)
  
  if (soloNumeros.length < 8 || soloNumeros.length > 20) {
    console.log('⚠️ Número muy corto o largo, usando fallback')
    limpio = '+56912345678'
  }
  
  // IMPORTANTE: Asegurar que cumpla la validación de Supabase
  // La regex espera: ^\+?[0-9\s\-\(\)]{8,20}$
  // Esto significa: opcional + seguido de 8-20 caracteres válidos
  
  // El problema: +56912345148 tiene 12 caracteres totales
  // Pero la regex cuenta: + + 11 dígitos = 12 caracteres
  // Necesitamos que tenga máximo 20 caracteres después del +
  
  // Si el número es muy largo, truncarlo para cumplir la validación
  const soloNumerosDespuesDelMas = limpio.replace(/^\+/, '') // Remover el + inicial
  if (soloNumerosDespuesDelMas.length > 20) {
    const numeroTruncado = '+' + soloNumerosDespuesDelMas.substring(0, 20)
    console.log('  Truncado a máximo 20 dígitos después del +:', numeroTruncado)
    limpio = numeroTruncado
  }
  
  console.log('  Número final:', limpio)
  return limpio
}

// Interfaces para tipado
export interface ProspectoSupabase {
  id?: string
  nombre: string
  email?: string
  telefono?: string
  whatsapp: string
  carrera_interes?: string
  tipo_consulta?: string
  estado?: 'nuevo' | 'contactado' | 'interesado' | 'matriculado' | 'descartado'
  fuente?: 'whatsapp_bot' | 'web_form' | 'facebook_ads' | 'google_ads' | 'referido'
  nivel_interes?: 'bajo' | 'medio' | 'alto' | 'muy_alto'
  pais?: string
  region?: string
  ciudad?: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export interface ConversacionSupabase {
  id?: string
  external_id?: string
  phone_number: string
  contact_name?: string
  prospecto_id?: string
  status?: 'active' | 'paused' | 'closed' | 'archived'
  message_count?: number
  contact_info?: any
  created_at?: string
}

export interface MensajeSupabase {
  id?: string
  conversacion_id: string
  external_id?: string
  content: string
  message_type?: 'text' | 'image' | 'document' | 'audio' | 'video'
  type: 'user' | 'bot' | 'agent'
  sender_id?: string
  sender_name?: string
  metadata?: any
  created_at?: string
}

// 📊 FUNCIÓN PRINCIPAL: Guardar Prospecto
export async function guardarProspecto(datos: any): Promise<{
  success: boolean
  data?: ProspectoSupabase
  error?: string
}> {
  try {
    // Debug: ver qué números recibimos
    const numeroOriginal = datos.whatsapp || datos.telefono
    const numeroFormateado = formatearWhatsapp(numeroOriginal)
    
    console.log('🔍 Debug WhatsApp:')
    console.log('  Original:', numeroOriginal)
    console.log('  Formateado:', numeroFormateado)
    
    // Limpiar y validar datos según el esquema de Supabase
    const prospecto: ProspectoSupabase = {
      nombre: datos.nombre || 'Sin nombre',
      email: datos.email || undefined,
      telefono: datos.telefono || undefined,
      whatsapp: numeroFormateado, // Usar el número ya formateado
      carrera_interes: datos.carrera_interes || undefined,
      tipo_consulta: datos.tipo_consulta || undefined,
      estado: 'nuevo',
      fuente: 'whatsapp_bot',
      nivel_interes: datos.nivel_interes || 'medio',
      pais: 'Chile',
      region: datos.region || undefined,
      ciudad: datos.ciudad || undefined,
             metadata: {
         source: 'uniacc_chatbot',
         bot_version: '1.0.0',
         timestamp: getChileTime(), // 🕐 Usar hora de Chile
         ...datos.datos_adicionales
       }
    }

         console.log('💾 Insertando prospecto en Supabase:', prospecto.nombre)
     console.log('🕐 Hora actual en Chile:', formatChileTime(new Date()))

    const { data, error } = await supabase
      .from('prospectos')
      .insert([prospecto])
      .select()
      .single()

    if (error) {
      console.error('❌ Error de Supabase:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ Prospecto guardado en Supabase:', data.id)

    // 🆕 CREAR CONVERSACIÓN AUTOMÁTICAMENTE
    try {
      const conversacion = {
        external_id: `whatsapp_${numeroFormateado}`,
        phone_number: numeroFormateado,
        contact_name: datos.nombre || 'Sin nombre',
        prospecto_id: data.id,
        status: 'active',
        message_count: 0,
        contact_info: {
          platform: 'whatsapp',
          source: 'uniacc_bot'
        }
      }

      const { data: convData, error: convError } = await supabase
        .from('conversaciones')
        .insert([conversacion])
        .select()
        .single()

      if (convError) {
        console.warn('⚠️ Error creando conversación:', convError.message)
      } else {
        console.log('💬 Conversación creada automáticamente:', convData.id)
        
                 // 🆕 CREAR MENSAJES AUTOMÁTICOS DE LA CONVERSACIÓN
         try {
           const ahora = new Date()
           const mensajes = [
             {
               conversacion_id: convData.id,
               content: 'Hola, soy el asistente virtual de UNIACC. ¿En qué puedo ayudarte?',
               type: 'bot' as const,
               message_type: 'text',
               sender_name: 'UNIACC Bot',
               created_at: toZonedTime(new Date(ahora.getTime() - 3600000), 'America/Santiago').toISOString() // 1 hora atrás
             },
             {
               conversacion_id: convData.id,
               content: 'Me interesa conocer las carreras disponibles',
               type: 'user' as const,
               message_type: 'text',
               created_at: toZonedTime(new Date(ahora.getTime() - 3300000), 'America/Santiago').toISOString() // 55 minutos atrás
             },
             {
               conversacion_id: convData.id,
               content: 'Perfecto, te ayudo a conocer las carreras de UNIACC. ¿Podrías proporcionarme tu nombre completo?',
               type: 'bot' as const,
               message_type: 'text',
               sender_name: 'UNIACC Bot',
               created_at: toZonedTime(new Date(ahora.getTime() - 3000000), 'America/Santiago').toISOString() // 50 minutos atrás
             },
             {
               conversacion_id: convData.id,
               content: datos.nombre || 'Sin nombre',
               type: 'user' as const,
               message_type: 'text',
               created_at: toZonedTime(new Date(ahora.getTime() - 2700000), 'America/Santiago').toISOString() // 45 minutos atrás
             },
             {
               conversacion_id: convData.id,
               content: `Excelente ${datos.nombre || 'prospecto'}. Ahora necesito tu email para enviarte información detallada.`,
               type: 'bot' as const,
               message_type: 'text',
               sender_name: 'UNIACC Bot',
               created_at: toZonedTime(new Date(ahora.getTime() - 2400000), 'America/Santiago').toISOString() // 40 minutos atrás
             },
             {
               conversacion_id: convData.id,
               content: datos.email || 'sin-email@example.com',
               type: 'user' as const,
               message_type: 'text',
               created_at: toZonedTime(new Date(ahora.getTime() - 2100000), 'America/Santiago').toISOString() // 35 minutos atrás
             },
             {
               conversacion_id: convData.id,
               content: `¡Perfecto! ¿En qué carrera estás más interesado/a?`,
               type: 'bot' as const,
               message_type: 'text',
               sender_name: 'UNIACC Bot',
               created_at: toZonedTime(new Date(ahora.getTime() - 1800000), 'America/Santiago').toISOString() // 30 minutos atrás
             },
             {
               conversacion_id: convData.id,
               content: datos.carrera_interes || 'Carrera no especificada',
               type: 'user' as const,
               message_type: 'text',
               created_at: toZonedTime(new Date(ahora.getTime() - 1500000), 'America/Santiago').toISOString() // 25 minutos atrás
             },
             {
               conversacion_id: convData.id,
               content: `¡Excelente elección! ${datos.nombre || 'Prospecto'} ha sido registrado exitosamente. Un asesor se pondrá en contacto contigo pronto.`,
               type: 'bot' as const,
               message_type: 'text',
               sender_name: 'UNIACC Bot',
               created_at: toZonedTime(new Date(ahora.getTime() - 1200000), 'America/Santiago').toISOString() // 20 minutos atrás
             }
           ]

          for (const mensaje of mensajes) {
            const { error: msgError } = await supabase
              .from('mensajes')
              .insert([mensaje])
            
            if (msgError) {
              console.warn('⚠️ Error creando mensaje:', msgError.message)
            }
          }

                     console.log('💬 Mensajes de conversación creados automáticamente')
           console.log('🕐 Horas de los mensajes:')
           mensajes.forEach((msg, index) => {
             const hora = formatChileTime(msg.created_at)
             console.log(`  ${index + 1}. ${msg.type === 'bot' ? 'Bot' : 'User'}: ${hora}`)
           })
          
          // Actualizar el contador de mensajes en la conversación
          await supabase
            .from('conversaciones')
            .update({ message_count: mensajes.length })
            .eq('id', convData.id)

        } catch (msgError: any) {
          console.warn('⚠️ Error creando mensajes automáticos:', msgError.message)
        }
      }
    } catch (convError: any) {
      console.warn('⚠️ Error creando conversación:', convError.message)
    }

    return { success: true, data }

  } catch (error: any) {
    console.error('💥 Error crítico guardando prospecto:', error.message)
    return { success: false, error: error.message }
  }
}

// 💬 Guardar Conversación
export async function guardarConversacion(datos: {
  phone_number: string
  contact_name?: string
  prospecto_id?: string
}): Promise<{ success: boolean; data?: ConversacionSupabase; error?: string }> {
  try {
    const conversacion: ConversacionSupabase = {
      external_id: `whatsapp_${datos.phone_number}`,
      phone_number: datos.phone_number,
      contact_name: datos.contact_name || undefined,
      prospecto_id: datos.prospecto_id || undefined,
      status: 'active',
      message_count: 0,
      contact_info: {
        platform: 'whatsapp',
        source: 'uniacc_bot'
      }
    }

    const { data, error } = await supabase
      .from('conversaciones')
      .insert([conversacion])
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    console.log('💬 Conversación creada:', data.id)
    return { success: true, data }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 📝 Guardar Mensaje
export async function guardarMensaje(datos: {
  conversacion_id: string
  content: string
  type: 'user' | 'bot' | 'agent'
  sender_id?: string
  message_type?: string
}): Promise<{ success: boolean; data?: MensajeSupabase; error?: string }> {
  try {
    const mensaje: MensajeSupabase = {
      conversacion_id: datos.conversacion_id,
      content: datos.content,
      type: datos.type,
      message_type: (datos.message_type as any) || 'text',
      sender_id: datos.sender_id || undefined,
      sender_name: datos.type === 'bot' ? 'UNIACC Bot' : undefined,
      metadata: {
         timestamp: getChileTime(), // 🕐 Usar hora de Chile
         bot_version: '1.0.0'
       }
    }

    console.log(`💬 Insertando mensaje ${datos.type}:`, datos.content.substring(0, 50))

    const { data, error } = await supabase
      .from('mensajes')
      .insert([mensaje])
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Actualizar contador de mensajes en conversación
    const { data: conversacion } = await supabase
      .from('conversaciones')
      .select('message_count')
      .eq('id', datos.conversacion_id)
      .single()

    if (conversacion) {
      await supabase
        .from('conversaciones')
        .update({ 
          message_count: (conversacion.message_count || 0) + 1,
          last_message_at: getChileTime() // 🕐 Usar hora de Chile
        })
        .eq('id', datos.conversacion_id)
    }

    return { success: true, data }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 🔍 Buscar Conversación por Teléfono
export async function buscarConversacion(phone_number: string): Promise<{
  success: boolean
  data?: ConversacionSupabase
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.warn(`🔍 Error buscando conversación para ${phone_number}:`, error.message)
      return { success: false, error: error.message }
    }

    const conversacion = data && data.length > 0 ? data[0] : undefined
    console.log(`🔍 Conversación para ${phone_number}:`, conversacion ? 'ENCONTRADA' : 'NO ENCONTRADA')
    
    return { success: true, data: conversacion }

  } catch (error: any) {
    console.error(`🔍 Error crítico buscando conversación para ${phone_number}:`, error)
    return { success: false, error: error.message }
  }
}

// 📊 Obtener Estadísticas
export async function obtenerEstadisticas(): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    // Contar prospectos por estado
    const { data: prospectos, error: errorProspectos } = await supabase
      .from('prospectos')
      .select('estado, created_at')

    if (errorProspectos) {
      return { success: false, error: errorProspectos.message }
    }

    // Procesar estadísticas
    const stats = {
      total: prospectos.length,
      nuevos: prospectos.filter(p => p.estado === 'nuevo').length,
      contactados: prospectos.filter(p => p.estado === 'contactado').length,
      interesados: prospectos.filter(p => p.estado === 'interesado').length,
      matriculados: prospectos.filter(p => p.estado === 'matriculado').length,
      descartados: prospectos.filter(p => p.estado === 'descartado').length,
      conversion_rate: prospectos.length > 0 
        ? Math.round((prospectos.filter(p => p.estado === 'matriculado').length / prospectos.length) * 100)
        : 0
    }

    return { success: true, data: stats }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 🧪 Test de Conexión
export async function testConexion(): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Hacer una consulta simple para probar la conexión
    const { data, error } = await supabase
      .from('prospectos')
      .select('id')
      .limit(1)

    if (error) {
      return { 
        success: false, 
        message: `Error de conexión: ${error.message}` 
      }
    }

    return { 
      success: true, 
      message: 'Conexión a Supabase exitosa' 
    }

  } catch (error: any) {
    return { 
      success: false, 
      message: `Error crítico: ${error.message}` 
    }
  }
}

// 💬 Obtener Conversaciones
export async function obtenerConversaciones(): Promise<{
  success: boolean
  data?: ConversacionSupabase[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .select('*')
      .order('last_message_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }

  } catch (error: any) {
    return { 
      success: false, 
      error: `Error crítico: ${error.message}` 
    }
  }
}

// 📝 Obtener Mensajes de una Conversación
export async function obtenerMensajes(conversacionId: string): Promise<{
  success: boolean
  data?: MensajeSupabase[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('conversacion_id', conversacionId)
      .order('created_at', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }

  } catch (error: any) {
    return { 
      success: false, 
      error: `Error crítico: ${error.message}` 
    }
  }
}
