import { ref, onUnmounted } from 'vue'

// Tipos TypeScript para el Chat Demo
interface ChatMessage {
  id: string
  content: string
  type: 'user' | 'bot' | 'system'
  timestamp: Date
  isTimeout?: boolean
}

interface ChatResponse {
  status: string
  demo: boolean
  conversation: {
    phone: string
    user_message: string
    bot_response: string
    timestamp: string
  }
  prospecto: {
    data: any
    guardado: boolean
    id: string | null
  }
}

interface TimeoutCheckResponse {
  status: 'warning' | 'timeout' | 'active'
  message: string | null
  timestamp: string
}

export function useChatDemo() {
  // Estado reactivo
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const currentPhone = ref<string>()
  const isTimeoutActive = ref(false)
  
  // Referencias internas
  let timeoutInterval: number | null = null
  let messageCounter = 0

  // URLs configurables
  const chatbotBaseUrl = import.meta.env.VITE_CHATBOT_URL || 'http://localhost:3001'

  // Inicializar chat demo
  const initializeChat = () => {
    currentPhone.value = '56912345' + Math.floor(Math.random() * 1000)
    messages.value = [{
      id: 'welcome',
      content: '💬 Chat Demo iniciado. Escribe "hola" para comenzar...',
      type: 'system',
      timestamp: new Date()
    }]
    
    console.log(`🚀 [CHAT-DEMO] Inicializado con teléfono: ${currentPhone.value}`)
  }

  // Enviar mensaje
  const sendMessage = async (content: string): Promise<void> => {
    if (!content.trim() || !currentPhone.value) return

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user-${++messageCounter}`,
      content: content.trim(),
      type: 'user',
      timestamp: new Date()
    }
    messages.value.push(userMessage)

    // Iniciar polling si es el primer mensaje
    if (content.toLowerCase() === 'hola' && !isTimeoutActive.value) {
      startTimeoutPolling()
    }

    isLoading.value = true

    try {
      const response = await fetch(`${chatbotBaseUrl}/test-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: currentPhone.value, 
          message: content 
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ChatResponse = await response.json()

      // Agregar respuesta del bot
      const botMessage: ChatMessage = {
        id: `bot-${++messageCounter}`,
        content: data.conversation.bot_response,
        type: 'bot',
        timestamp: new Date()
      }
      messages.value.push(botMessage)

    } catch (error) {
      console.error('❌ [CHAT-DEMO] Error enviando mensaje:', error)
      
      const errorMessage: ChatMessage = {
        id: `error-${++messageCounter}`,
        content: `Error: ${(error as Error).message}`,
        type: 'system',
        timestamp: new Date()
      }
      messages.value.push(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // Iniciar polling de timeouts
  const startTimeoutPolling = () => {
    if (isTimeoutActive.value || !currentPhone.value) return

    isTimeoutActive.value = true
    console.log(`⏰ [POLLING] Iniciando polling para: ${currentPhone.value}`)

    timeoutInterval = window.setInterval(async () => {
      await checkForTimeouts()
    }, 3000) // Cada 3 segundos
  }

  // Verificar timeouts pendientes
  const checkForTimeouts = async (): Promise<void> => {
    if (!currentPhone.value || !isTimeoutActive.value) return

    try {
      const response = await fetch(`${chatbotBaseUrl}/check-timeout/${currentPhone.value}`)
      
      if (!response.ok) return // Silencioso si falla

      const data: TimeoutCheckResponse = await response.json()

      if (data.status === 'warning' || data.status === 'timeout') {
        console.log(`📱 [POLLING] Mensaje ${data.status} recibido`)

        const timeoutMessage: ChatMessage = {
          id: `timeout-${++messageCounter}`,
          content: data.message || 'Mensaje de timeout',
          type: 'system',
          timestamp: new Date(),
          isTimeout: true
        }
        messages.value.push(timeoutMessage)

        // Si es timeout final, detener polling
        if (data.status === 'timeout') {
          stopTimeoutPolling()
        }
      }

    } catch (error) {
      console.error('🔍 [POLLING] Error verificando timeouts:', error)
    }
  }

  // Detener polling
  const stopTimeoutPolling = () => {
    if (timeoutInterval) {
      clearInterval(timeoutInterval)
      timeoutInterval = null
    }
    isTimeoutActive.value = false
    console.log('⏰ [POLLING] Polling detenido')
  }

  // Limpiar chat
  const clearChat = () => {
    stopTimeoutPolling()
    messages.value = []
    initializeChat()
  }

  // Forzar timeout para testing
  const forceTimeout = async (): Promise<void> => {
    if (!currentPhone.value) {
      throw new Error('Chat no inicializado')
    }

    try {
      const response = await fetch(`${chatbotBaseUrl}/force-timeout/${currentPhone.value}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.message) {
        const timeoutMessage: ChatMessage = {
          id: `forced-timeout-${++messageCounter}`,
          content: data.message,
          type: 'system',
          timestamp: new Date(),
          isTimeout: true
        }
        messages.value.push(timeoutMessage)

        stopTimeoutPolling()
      }

    } catch (error) {
      console.error('🧪 [FORCE-TIMEOUT] Error:', error)
      throw error
    }
  }

  // Test polling manual
  const testPolling = async (): Promise<string | null> => {
    if (!currentPhone.value) return null

    try {
      const response = await fetch(`${chatbotBaseUrl}/check-timeout/${currentPhone.value}`)
      const data: TimeoutCheckResponse = await response.json()
      
      return data.message
    } catch (error) {
      console.error('🔍 [TEST-POLLING] Error:', error)
      return null
    }
  }

  // Cleanup al desmontar
  onUnmounted(() => {
    stopTimeoutPolling()
  })

  // Inicializar automáticamente
  initializeChat()

  return {
    // Estado reactivo
    messages: messages.value,
    isLoading,
    currentPhone,
    isTimeoutActive,
    
    // Métodos públicos
    sendMessage,
    clearChat,
    forceTimeout,
    testPolling,
    
    // Métodos de control
    startTimeoutPolling,
    stopTimeoutPolling
  }
}
