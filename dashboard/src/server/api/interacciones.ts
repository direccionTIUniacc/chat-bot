import type { IncomingMessage, ServerResponse } from 'http'
import { useSupabase } from '@/composables/useSupabase'

interface WebhookRequest extends IncomingMessage {
  body?: any
}

interface InteraccionData {
  whatsapp: string
  mensaje_usuario: string
  respuesta_bot: string
  timestamp: string
  tipo: string
}

// Verificar autorización del chatbot
function verifyAuthorization(req: IncomingMessage): boolean {
  const authHeader = req.headers.authorization
  const expectedToken = process.env.VITE_UNIACC_WEBHOOK_SECRET || 'uniacc_webhook_secret_123'
  
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  return token === expectedToken
}

// Registrar interacción en base de datos
async function registrarInteraccion(data: InteraccionData) {
  try {
    const { supabase } = useSupabase()
    
    // Buscar o crear conversación existente para este número
    let { data: conversacion, error: conversacionError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('phone_number', data.whatsapp)
      .single()

    // Si no existe la conversación, crearla
    if (conversacionError || !conversacion) {
      const { data: nuevaConversacion, error: crearError } = await supabase
        .from('conversaciones')
        .insert({
          phone_number: data.whatsapp,
          status: 'active',
          last_message_at: new Date(data.timestamp),
          message_count: 0
        })
        .select('id')
        .single()

      if (crearError) {
        console.error('❌ Error creando conversación:', crearError)
        return { success: false, error: crearError.message }
      }
      conversacion = nuevaConversacion
    }

    // Insertar mensaje del usuario
    const { error: mensajeUserError } = await supabase
      .from('mensajes')
      .insert({
        conversacion_id: conversacion.id,
        content: data.mensaje_usuario,
        type: 'user',
        message_type: 'text',
        metadata: {
          source: 'uniacc_chatbot',
          timestamp: data.timestamp
        }
      })

    if (mensajeUserError) {
      console.error('❌ Error guardando mensaje usuario:', mensajeUserError)
      return { success: false, error: mensajeUserError.message }
    }

    // Insertar respuesta del bot
    const { error: mensajeBotError } = await supabase
      .from('mensajes')
      .insert({
        conversacion_id: conversacion.id,
        content: data.respuesta_bot,
        type: 'bot',
        message_type: 'text',
        metadata: {
          source: 'uniacc_chatbot',
          timestamp: data.timestamp,
          response_length: data.respuesta_bot.length
        }
      })

    if (mensajeBotError) {
      console.error('❌ Error guardando mensaje bot:', mensajeBotError)
      return { success: false, error: mensajeBotError.message }
    }

    // Actualizar contador de mensajes y última actividad
    const { error: updateError } = await supabase
      .from('conversaciones')
      .update({
        message_count: supabase.raw('message_count + 2'), // +2 porque son 2 mensajes (user + bot)
        last_message_at: new Date(data.timestamp),
        updated_at: new Date()
      })
      .eq('id', conversacion.id)

    if (updateError) {
      console.error('⚠️ Error actualizando conversación:', updateError)
      // No es crítico si falla la actualización
    }

    console.log(`📊 Interacción registrada: ${data.whatsapp}`)
    return { success: true, conversacion_id: conversacion.id }

  } catch (error) {
    console.error('💥 Error procesando interacción:', error)
    return { success: false, error: 'Error interno' }
  }
}

// Handler principal del endpoint
export default async function handler(
  req: WebhookRequest,
  res: ServerResponse
) {
  // Solo aceptar POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  // Verificar autorización
  if (!verifyAuthorization(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  try {
    // Obtener el body del request
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const data: InteraccionData = JSON.parse(body)

        // Validar datos requeridos
        if (!data.whatsapp || !data.mensaje_usuario || !data.respuesta_bot) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing required fields' }))
          return
        }

        // Registrar interacción
        const result = await registrarInteraccion(data)

        // Responder
        const status = result.success ? 200 : 500
        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))

      } catch (error) {
        console.error('Error parsing request:', error)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          error: 'Invalid JSON data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    })

  } catch (error) {
    console.error('Handler error:', error)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
}

// El endpoint ya usa las tablas existentes 'conversaciones' y 'mensajes'
// No necesita funciones SQL adicionales ya que utiliza el esquema actual