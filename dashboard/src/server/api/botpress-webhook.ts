import type { IncomingMessage, ServerResponse } from 'http'
import crypto from 'crypto'
import { BotpressEventSchema, BotpressLeadSchema } from '@/types/botpress'
import { useSupabase } from '@/composables/useSupabase'

interface WebhookRequest extends IncomingMessage {
  body?: any
}

// Mapear flujo del chatbot al tipo de consulta para la DB
function mapearFlujoATipoConsulta(flujoActual: string): string {
  const mapeo: Record<string, string> = {
    'conocer_carreras': 'consulta carrera',
    'proceso_admision': 'consulta proceso admision', 
    'costos_becas': 'consulta costos y/o becas',
    'modalidades_estudio': 'consulta de modalidades de estudio',
    'hablar_asesor': 'solicitud de asesor',
    // Mapeos adicionales por si llegan otros flujos
    'exploracion_carreras': 'consulta carrera',
    'detalle_carrera': 'consulta carrera',
    'captura_datos': 'solicitud de asesor',
    'menu_principal': 'consulta general'
  }
  
  return mapeo[flujoActual] || 'consulta general'
}

// Determinar nivel de interés basado en el tipo de consulta
function determinarNivelInteres(tipoConsulta: string, nivelOriginal?: string): string {
  if (tipoConsulta === 'solicitud de asesor') {
    return 'urgente'
  }
  return nivelOriginal || 'alto'
}

// Verificar firma del webhook para seguridad
function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  )
}

// Procesar evento de lead capturado (UNIACC ChatBot)
async function processLeadCaptured(eventData: any) {
  try {
    const { supabase } = useSupabase()

    console.log('📊 Procesando prospecto UNIACC:', eventData)
    console.log('🔧 DEBUG - flujo_actual recibido:', eventData.flujo_actual)
    console.log('🔧 DEBUG - tipo_consulta mapeado:', mapearFlujoATipoConsulta(eventData.flujo_actual))

    // Crear prospecto en Supabase con estructura UNIACC
    const { data, error } = await supabase
      .from('prospectos')
      .insert({
        nombre: eventData.nombre,
        email: eventData.email,
        telefono: eventData.telefono,
        whatsapp: eventData.whatsapp,
        carrera_interes: eventData.carrera_interes,
        nivel_interes: determinarNivelInteres(mapearFlujoATipoConsulta(eventData.flujo_actual), eventData.nivel_interes),
        fuente: eventData.source || 'uniacc_chatbot',
        estado: 'nuevo',
        campus_preferido: eventData.campus_preferido,
        tipo_consulta: mapearFlujoATipoConsulta(eventData.flujo_actual),
        created_at: new Date(eventData.timestamp || new Date().toLocaleString("en-US", {timeZone: "America/Santiago"})),
        metadata: {
          bot_source: 'uniacc_direct',
          conversation_flow: eventData.flujo_actual,
          utm_source: eventData.utm_source,
          utm_medium: eventData.utm_medium,
          utm_campaign: eventData.utm_campaign,
          ...eventData.datos_adicionales
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creando prospecto UNIACC:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Prospecto UNIACC guardado:', data.id)
    
    // Crear notificación para ejecutivos
    await supabase
      .from('notificaciones')
      .insert({
        tipo: 'nuevo_prospecto',
        titulo: `Nuevo prospecto: ${data.nombre}`,
        mensaje: `Interesado en ${data.carrera_interes || 'consulta general'}`,
        datos: { prospecto_id: data.id },
        created_at: new Date()
      })

    return { success: true, prospecto_id: data.id, data }
  } catch (error) {
    console.error('💥 Error procesando lead UNIACC:', error)
    return { success: false, error: 'Error interno procesando prospecto' }
  }
}

// Procesar inicio de conversación
async function processConversationStarted(eventData: any) {
  try {
    const { supabase } = useSupabase()
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        id: eventData.conversationId,
        started_at: eventData.timestamp,
        status: 'active',
        messages_count: 0,
        metadata: {
          botId: eventData.botId,
          userId: eventData.userId,
          channel: eventData.data?.channel || 'web'
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating chat session:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error processing conversation start:', error)
    return { success: false, error: 'Invalid conversation data' }
  }
}

// Procesar mensaje
async function processMessage(eventData: any) {
  try {
    const { supabase } = useSupabase()
    
    // Insertar mensaje
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: eventData.conversationId,
        type: eventData.data?.direction === 'incoming' ? 'user' : 'bot',
        content: eventData.data?.text || '',
        timestamp: eventData.timestamp,
        metadata: eventData.data
      })

    if (messageError) {
      console.error('Error saving message:', messageError)
    }

    // Actualizar contador de mensajes en la sesión
    const { error: sessionError } = await supabase.rpc('increment_message_count', {
      session_id: eventData.conversationId
    })

    if (sessionError) {
      console.error('Error updating message count:', sessionError)
    }

    return { success: true }
  } catch (error) {
    console.error('Error processing message:', error)
    return { success: false, error: 'Invalid message data' }
  }
}

// Procesar fin de conversación
async function processConversationEnded(eventData: any) {
  try {
    const { supabase } = useSupabase()
    
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        ended_at: eventData.timestamp,
        status: 'ended',
        duration: eventData.data?.duration,
        outcome: eventData.data?.outcome
      })
      .eq('id', eventData.conversationId)

    if (error) {
      console.error('Error ending chat session:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error processing conversation end:', error)
    return { success: false, error: 'Invalid conversation data' }
  }
}

// Handler principal del webhook
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

  try {
    // Obtener el body del request
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        // Verificar firma del webhook
        const signature = req.headers['x-botpress-signature'] as string
        const webhookSecret = process.env.VITE_BOTPRESS_WEBHOOK_SECRET

        if (webhookSecret && signature) {
          const isValid = verifyWebhookSignature(body, signature, webhookSecret)
          if (!isValid) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid signature' }))
            return
          }
        }

        // Parsear el evento
        const parsedData = JSON.parse(body)
        
        // Si tiene estructura de chatbot directo UNIACC
        if (parsedData.source === 'uniacc_chatbot' || parsedData.source === 'demo_chatbot') {
          console.log('🤖 Webhook de UNIACC ChatBot Directo recibido')
          result = await processLeadCaptured(parsedData)
        } else {
          // Procesar eventos Botpress tradicionales
          const validatedEvent = BotpressEventSchema.parse(parsedData)
          console.log('Received Botpress event:', validatedEvent.eventType)

          switch (validatedEvent.eventType) {
            case 'lead_captured':
              result = await processLeadCaptured(validatedEvent.data)
              break
            
            case 'conversation_started':
              result = await processConversationStarted(validatedEvent)
              break
            
            case 'message':
              result = await processMessage(validatedEvent)
              break
            
            case 'conversation_ended':
              result = await processConversationEnded(validatedEvent)
              break
            
            default:
              console.log('Unhandled event type:', validatedEvent.eventType)
              result = { success: true, message: 'Event ignored' }
          }
        }

        // Responder al webhook
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))

      } catch (error) {
        console.error('Webhook processing error:', error)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          error: 'Invalid webhook data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
}

// Función SQL para incrementar contador de mensajes
export const incrementMessageCountSQL = `
CREATE OR REPLACE FUNCTION increment_message_count(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE chat_sessions 
  SET messages_count = messages_count + 1,
      updated_at = NOW()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;
`
