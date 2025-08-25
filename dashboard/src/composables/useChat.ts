import { ref, computed, watch } from 'vue'
import { useSupabase } from './useSupabase'
import { useEjecutivos } from './useEjecutivos'
import type { 
  ChatMessage, 
  ChatSession, 
  Prospecto,
  Ejecutivo,
  ApiResponse 
} from '@/types'

export function useChat() {
  const { supabase, handleSupabaseError, handleSupabaseSuccess } = useSupabase()
  const ejecutivos = useEjecutivos()
  
  // Estado reactivo
  const conversaciones = ref<ChatSession[]>([])
  const mensajes = ref<Record<string, ChatMessage[]>>({}) // sessionId -> mensajes
  const conversacionActiva = ref<ChatSession | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Estado de escritura en tiempo real
  const usuariosEscribiendo = ref<Record<string, string[]>>({}) // sessionId -> [userId]
  
  // Notificaciones
  const mensajesNoLeidos = ref<Record<string, number>>({}) // sessionId -> count
  const notificaciones = ref<ChatMessage[]>([])

  // 🧹 DATOS LIMPIADOS PARA TESTING DE INTEGRACIÓN
  const mockConversaciones: ChatSession[] = []
  const mockMensajes: Record<string, ChatMessage[]> = {}

  // Computed
  const totalConversaciones = computed(() => conversaciones.value.length)
  const conversacionesActivas = computed(() => 
    conversaciones.value.filter(c => c.status === 'active')
  )
  const conversacionesPendientes = computed(() => 
    conversaciones.value.filter(c => !c.assigned_to)
  )
  const totalMensajesNoLeidos = computed(() => 
    Object.values(mensajesNoLeidos.value).reduce((sum, count) => sum + count, 0)
  )

  // Inicializar datos (carga desde la API del chatbot)
  const inicializar = async (): Promise<ApiResponse<boolean>> => {
    try {
      loading.value = true
      error.value = null

      // Cargar conversaciones desde el chatbot
      const response = await fetch('http://localhost:3001/api/conversaciones')
      const result = await response.json()

      if (result.success && result.data) {
        conversaciones.value = result.data
        console.log('✅ Conversaciones cargadas desde chatbot:', result.data.length)
      } else {
        console.error('❌ Error cargando conversaciones:', result.error)
        conversaciones.value = []
      }

      return handleSupabaseSuccess(true)
    } catch (err) {
      console.error('❌ Error de conexión con chatbot:', err)
      error.value = 'Error inicializando chat'
      conversaciones.value = []
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  // Obtener mensajes de una conversación
  const obtenerMensajes = async (sessionId: string): Promise<ApiResponse<ChatMessage[]>> => {
    try {
      if (mensajes.value[sessionId]) {
        return handleSupabaseSuccess(mensajes.value[sessionId])
      }

      // Cargar mensajes desde el chatbot
      const response = await fetch(`http://localhost:3001/api/conversaciones/${sessionId}/mensajes`)
      const result = await response.json()

      if (result.success && result.data) {
        mensajes.value[sessionId] = result.data
        console.log(`✅ Mensajes cargados para conversación ${sessionId}:`, result.data.length)
        return handleSupabaseSuccess(result.data)
      } else {
        console.error('❌ Error cargando mensajes:', result.error)
        mensajes.value[sessionId] = []
        return handleSupabaseSuccess([])
      }
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Enviar mensaje
  const enviarMensaje = async (
    sessionId: string, 
    content: string, 
    type: 'ejecutivo' = 'ejecutivo'
  ): Promise<ApiResponse<ChatMessage>> => {
    try {
      const mensaje: Partial<ChatMessage> = {
        session_id: sessionId,
        type,
        content,
        timestamp: new Date().toISOString(),
        message_type: 'text',
        status: 'sent',
        is_automated: false
      }

      // Agregar a array local
      if (!mensajes.value[sessionId]) {
        mensajes.value[sessionId] = []
      }
      mensajes.value[sessionId].push(mensaje as ChatMessage)

      return handleSupabaseSuccess(mensaje as ChatMessage)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Asignar conversación a ejecutivo
  const asignarConversacion = async (
    sessionId: string, 
    ejecutivoId: string
  ): Promise<ApiResponse<boolean>> => {
    try {
      const conversacion = conversaciones.value.find(c => c.id === sessionId)
      if (conversacion) {
        conversacion.assigned_to = ejecutivoId
      }

      return handleSupabaseSuccess(true)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Marcar conversación como leída
  const marcarComoLeida = async (sessionId: string): Promise<void> => {
    if (mensajesNoLeidos.value[sessionId]) {
      mensajesNoLeidos.value[sessionId] = 0
    }
  }

  // Métodos auxiliares para chat
  const getContactAvatar = (conversacion: ChatSession): string => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getContactName(conversacion))}&background=3b82f6&color=ffffff`
  }

  const getContactName = (conversacion: ChatSession): string => {
    // 🆕 Mapear campos del chatbot
    if ((conversacion as any).contact_name) {
      return (conversacion as any).contact_name
    }
    // Intentar obtener nombre del prospecto si está relacionado
    if ((conversacion as any).prospecto?.nombre) {
      return (conversacion as any).prospecto.nombre
    }
    // Fallback al phone_number o external_id
    return (conversacion as any).phone_number || (conversacion as any).external_id || 'Usuario sin nombre'
  }

  const getEjecutivoNombre = (ejecutivoId: string): string => {
    const ejecutivo = ejecutivos.ejecutivos.value.find(e => e.id === ejecutivoId)
    return ejecutivo?.nombre || 'Sin asignar'
  }

  const formatearTiempo = (timestamp: string): string => {
    try {
      const fecha = new Date(timestamp)
      const ahora = new Date()
      const diffMs = ahora.getTime() - fecha.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Ahora'
      if (diffMins < 60) return `${diffMins}m`
      if (diffHours < 24) return `${diffHours}h`
      if (diffDays < 7) return `${diffDays}d`
      return fecha.toLocaleDateString()
    } catch {
      return 'Fecha inválida'
    }
  }

  return {
    // Estado
    conversaciones,
    mensajes,
    conversacionActiva,
    loading,
    error,
    usuariosEscribiendo,
    mensajesNoLeidos,
    notificaciones,

    // Computed
    totalConversaciones,
    conversacionesActivas,
    conversacionesPendientes,
    totalMensajesNoLeidos,

    // Métodos
    inicializar,
    obtenerMensajes,
    enviarMensaje,
    asignarConversacion,
    marcarComoLeida,

    // Métodos auxiliares
    getContactAvatar,
    getContactName,
    getEjecutivoNombre,
    formatearTiempo,

    // Para testing
    setConversacionActiva: (conversacion: ChatSession | null) => {
      conversacionActiva.value = conversacion
    },

    // 🆕 MÉTODO QUE FALTABA
    seleccionarConversacion: (conversacion: ChatSession) => {
      conversacionActiva.value = conversacion
      // Cargar mensajes de la conversación seleccionada
      obtenerMensajes(conversacion.id)
    }
  }
}