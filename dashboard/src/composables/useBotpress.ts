import { ref, computed } from 'vue'
import axios from 'axios'
import type { 
  BotpressConfig,
  BotpressConversation,
  BotpressMessage,
  BotpressUser,
  BotpressMetrics,
  BotpressApiResponse,
  ApiResponse
} from '@/types'

export function useBotpress() {
  // Estado reactivo
  const loading = ref(false)
  const error = ref<string | null>(null)
  const config = ref<BotpressConfig>({
    botId: import.meta.env.VITE_BOTPRESS_BOT_ID || '',
    apiUrl: import.meta.env.VITE_BOTPRESS_API_URL || 'https://api.botpress.cloud',
    apiKey: import.meta.env.VITE_BOTPRESS_API_KEY || '',
    webhookSecret: import.meta.env.VITE_BOTPRESS_WEBHOOK_SECRET || '',
    enabled: !!import.meta.env.VITE_BOTPRESS_ENABLED
  })

  // Configuración de axios para Botpress API
  const botpressApi = computed(() => axios.create({
    baseURL: `${config.value.apiUrl}/v1/bots/${config.value.botId}`,
    headers: {
      'Authorization': `Bearer ${config.value.apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  }))

  // Helper para manejar respuestas
  const handleResponse = <T>(response: BotpressApiResponse<T>): ApiResponse<T> => {
    if (response.success) {
      return {
        success: true,
        data: response.data || null,
        error: null
      }
    } else {
      return {
        success: false,
        data: null,
        error: response.error || 'Error desconocido'
      }
    }
  }

  // Obtener conversaciones
  const getConversations = async (params?: {
    status?: 'active' | 'inactive' | 'archived'
    limit?: number
    offset?: number
  }): Promise<ApiResponse<BotpressConversation[]>> => {
    try {
      loading.value = true
      error.value = null

      if (!config.value.enabled) {
        // Datos mock si Botpress no está configurado
        const mockConversations: BotpressConversation[] = [
          {
            id: 'conv_1',
            userId: 'user_1',
            botId: config.value.botId,
            status: 'active',
            startedAt: new Date().toISOString(),
            endedAt: null,
            messageCount: 15,
            lastActivity: new Date().toISOString(),
            tags: ['prospecto', 'ingenieria'],
            metadata: { source: 'website' }
          },
          {
            id: 'conv_2', 
            userId: 'user_2',
            botId: config.value.botId,
            status: 'inactive',
            startedAt: new Date(Date.now() - 3600000).toISOString(),
            endedAt: new Date().toISOString(),
            messageCount: 8,
            lastActivity: new Date().toISOString(),
            tags: ['prospecto', 'psicologia']
          }
        ]

        return {
          success: true,
          data: mockConversations,
          error: null
        }
      }

      const response = await botpressApi.value.get<BotpressApiResponse<BotpressConversation[]>>('/conversations', {
        params
      })

      return handleResponse(response.data)
    } catch (err: any) {
      error.value = err.message || 'Error al obtener conversaciones'
      return {
        success: false,
        data: null,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  // Obtener mensajes de una conversación
  const getMessages = async (conversationId: string, params?: {
    limit?: number
    offset?: number
  }): Promise<ApiResponse<BotpressMessage[]>> => {
    try {
      loading.value = true
      error.value = null

      if (!config.value.enabled) {
        // Datos mock
        const mockMessages: BotpressMessage[] = [
          {
            id: 'msg_1',
            conversationId,
            userId: 'user_1',
            type: 'text',
            text: 'Hola, me interesa estudiar ingeniería',
            direction: 'incoming',
            timestamp: new Date().toISOString()
          },
          {
            id: 'msg_2',
            conversationId,
            userId: 'bot',
            type: 'text', 
            text: '¡Hola! Me alegra saber de tu interés. ¿Qué carrera de ingeniería te interesa más?',
            direction: 'outgoing',
            timestamp: new Date().toISOString()
          }
        ]

        return {
          success: true,
          data: mockMessages,
          error: null
        }
      }

      const response = await botpressApi.value.get<BotpressApiResponse<BotpressMessage[]>>(
        `/conversations/${conversationId}/messages`,
        { params }
      )

      return handleResponse(response.data)
    } catch (err: any) {
      error.value = err.message || 'Error al obtener mensajes'
      return {
        success: false,
        data: null,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  // Obtener métricas de Botpress
  const getMetrics = async (dateRange?: {
    from: string
    to: string
  }): Promise<ApiResponse<BotpressMetrics>> => {
    try {
      loading.value = true
      error.value = null

      if (!config.value.enabled) {
        // Métricas mock
        const mockMetrics: BotpressMetrics = {
          totalConversations: 245,
          activeConversations: 12,
          totalMessages: 3420,
          avgMessagesPerConversation: 14.2,
          leadConversionRate: 23.8,
          mostUsedIntents: [
            { intent: 'carrera_info', count: 89, percentage: 36.3 },
            { intent: 'becas_info', count: 67, percentage: 27.3 },
            { intent: 'admision_proceso', count: 45, percentage: 18.4 }
          ],
          conversationsByChannel: [
            { channel: 'website', count: 156 },
            { channel: 'facebook', count: 78 },
            { channel: 'whatsapp', count: 11 }
          ],
          hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            conversations: Math.floor(Math.random() * 20) + 1,
            messages: Math.floor(Math.random() * 100) + 10
          }))
        }

        return {
          success: true,
          data: mockMetrics,
          error: null
        }
      }

      const response = await botpressApi.value.get<BotpressApiResponse<BotpressMetrics>>('/analytics', {
        params: dateRange
      })

      return handleResponse(response.data)
    } catch (err: any) {
      error.value = err.message || 'Error al obtener métricas'
      return {
        success: false,
        data: null,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  // Enviar mensaje como bot
  const sendMessage = async (conversationId: string, message: {
    text?: string
    type?: 'text' | 'card' | 'carousel' | 'quick_reply'
    payload?: Record<string, any>
  }): Promise<ApiResponse<BotpressMessage>> => {
    try {
      loading.value = true
      error.value = null

      if (!config.value.enabled) {
        throw new Error('Botpress no está configurado')
      }

      const response = await botpressApi.value.post<BotpressApiResponse<BotpressMessage>>(
        `/conversations/${conversationId}/messages`,
        {
          type: message.type || 'text',
          text: message.text,
          payload: message.payload
        }
      )

      return handleResponse(response.data)
    } catch (err: any) {
      error.value = err.message || 'Error al enviar mensaje'
      return {
        success: false,
        data: null,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  // Verificar salud de la conexión
  const checkHealth = async (): Promise<boolean> => {
    try {
      if (!config.value.enabled) {
        return false
      }

      const response = await botpressApi.value.get('/health')
      return response.status === 200
    } catch {
      return false
    }
  }

  // Configurar webhook
  const configureWebhook = async (webhookUrl: string, events: string[]): Promise<ApiResponse<any>> => {
    try {
      loading.value = true
      error.value = null

      if (!config.value.enabled) {
        throw new Error('Botpress no está configurado')
      }

      const response = await botpressApi.value.post<BotpressApiResponse<any>>('/webhooks', {
        url: webhookUrl,
        events,
        secret: config.value.webhookSecret
      })

      return handleResponse(response.data)
    } catch (err: any) {
      error.value = err.message || 'Error al configurar webhook'
      return {
        success: false,
        data: null,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    loading,
    error,
    config,

    // Computed
    isConfigured: computed(() => config.value.enabled && !!config.value.apiKey),

    // Métodos
    getConversations,
    getMessages,
    getMetrics,
    sendMessage,
    checkHealth,
    configureWebhook
  }
}
