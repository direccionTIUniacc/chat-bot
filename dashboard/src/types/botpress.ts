import { z } from 'zod'

// Tipos de eventos que puede enviar Botpress
export const BotpressEventSchema = z.object({
  eventId: z.string(),
  eventType: z.enum([
    'message',
    'conversation_started',
    'conversation_ended', 
    'user_joined',
    'user_left',
    'lead_captured',
    'intent_matched'
  ]),
  timestamp: z.string(),
  conversationId: z.string(),
  userId: z.string(),
  botId: z.string(),
  data: z.record(z.string(), z.any())
})

// Esquema para mensajes de Botpress
export const BotpressMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  userId: z.string(),
  type: z.enum(['text', 'image', 'file', 'card', 'carousel', 'quick_reply']),
  text: z.string().optional(),
  payload: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: z.string(),
  direction: z.enum(['incoming', 'outgoing'])
})

// Esquema para conversaciones de Botpress
export const BotpressConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  botId: z.string(),
  status: z.enum(['active', 'inactive', 'archived']),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  messageCount: z.number(),
  lastActivity: z.string()
})

// Esquema para usuarios de Botpress
export const BotpressUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  createdAt: z.string(),
  lastSeen: z.string()
})

// Esquema para leads capturados
export const BotpressLeadSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  carrera_interes: z.string(),
  nivel_interes: z.enum(['bajo', 'medio', 'alto']).optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  capturedAt: z.string()
})

// Tipos TypeScript derivados
export type BotpressEvent = z.infer<typeof BotpressEventSchema>
export type BotpressMessage = z.infer<typeof BotpressMessageSchema>
export type BotpressConversation = z.infer<typeof BotpressConversationSchema>
export type BotpressUser = z.infer<typeof BotpressUserSchema>
export type BotpressLead = z.infer<typeof BotpressLeadSchema>

// Configuración del webhook
export interface BotpressWebhookConfig {
  url: string
  secret: string
  events: BotpressEvent['eventType'][]
  retryPolicy?: {
    maxRetries: number
    retryDelay: number
  }
}

// Respuesta del API de Botpress
export interface BotpressApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
    }
  }
}

// Configuración del bot
export interface BotpressConfig {
  botId: string
  apiUrl: string
  apiKey: string
  webhookSecret: string
  enabled: boolean
}

// Métricas específicas de Botpress
export interface BotpressMetrics {
  totalConversations: number
  activeConversations: number
  totalMessages: number
  avgMessagesPerConversation: number
  leadConversionRate: number
  mostUsedIntents: Array<{
    intent: string
    count: number
    percentage: number
  }>
  conversationsByChannel: Array<{
    channel: string
    count: number
  }>
  hourlyActivity: Array<{
    hour: number
    conversations: number
    messages: number
  }>
}
