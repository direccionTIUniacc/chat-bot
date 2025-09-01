import { z } from 'zod'

// Esquemas para mensajes del chatbot - AMPLIADO PARA CHAT EN TIEMPO REAL
export const ChatMessageSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  type: z.enum(['user', 'bot', 'system', 'ejecutivo']), // Agregado ejecutivo
  content: z.string(),
  timestamp: z.string(),
  
  // Datos del remitente
  sender_id: z.string().optional(), // ID del ejecutivo si type = 'ejecutivo'
  sender_name: z.string().optional(), // Nombre para mostrar
  
  // Tipo de mensaje
  message_type: z.enum(['text', 'image', 'document', 'audio', 'quick_reply', 'card', 'typing']).default('text'),
  
  // Estado del mensaje
  status: z.enum(['sent', 'delivered', 'read', 'failed']).default('sent'),
  
  // Metadatos ampliados
  metadata: z.record(z.string(), z.any()).optional(),
  
  // Para mensajes de WhatsApp
  whatsapp_message_id: z.string().optional(),
  
  // Para respuestas automáticas
  is_automated: z.boolean().default(false),
  automated_trigger: z.string().optional()
})

export const ChatSessionSchema = z.object({
  id: z.string(),
  prospecto_id: z.string().nullable(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  status: z.enum(['active', 'pending', 'closed', 'ended', 'transferred']),
  
  // Campos para WhatsApp/Chat en tiempo real
  platform: z.enum(['whatsapp', 'web', 'botpress']).default('whatsapp'),
  phone_number: z.string().optional(),
  contact_name: z.string().optional(),
  last_message_at: z.string(),
  assigned_to: z.string().nullable(), // ID del ejecutivo asignado
  tags: z.array(z.string()).default([]),
  
  // 🎯 Campos para handoff inteligente
  handoff_status: z.enum(['bot', 'queued', 'agent', 'resolved']).default('bot'),
  handoff_requested_at: z.string().optional(),
  handoff_accepted_at: z.string().optional(),
  agent_last_activity: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notas: z.string().optional(),
  
  // Campos para seguimiento
  message_count: z.number().default(0),
  unread_count: z.number().default(0),
  contact_info: z.record(z.string(), z.any()).optional(),
  
  // Campos originales de Botpress
  messages_count: z.number().default(0),
  duration: z.number().nullable(),
  outcome: z.enum(['info_collected', 'appointment_scheduled', 'not_interested', 'transferred']).nullable(),
  metadata: z.record(z.string(), z.any()).optional()
})

export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.enum(['message_received', 'session_started', 'session_ended', 'lead_generated']),
  session_id: z.string(),
  data: z.record(z.string(), z.any()),
  timestamp: z.string(),
  processed: z.boolean()
})

// Tipos TypeScript
export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ChatSession = z.infer<typeof ChatSessionSchema>
export type WebhookEvent = z.infer<typeof WebhookEventSchema>

export type ChatMessageType = ChatMessage['type']
export type ChatSessionStatus = ChatSession['status']
export type ChatOutcome = ChatSession['outcome']

// Estadísticas del chatbot
export interface ChatbotMetrics {
  total_sessions: number
  active_sessions: number
  completed_sessions: number
  avg_duration: number
  messages_per_session: number
  conversion_rate: number
  popular_queries: Array<{
    query: string
    count: number
  }>
}

// Configuración del chatbot
export interface ChatbotConfig {
  welcome_message: string
  fallback_message: string
  max_session_duration: number
  auto_end_inactive: boolean
  collect_email: boolean
  collect_phone: boolean
  available_hours: {
    start: string
    end: string
    timezone: string
  }
}
