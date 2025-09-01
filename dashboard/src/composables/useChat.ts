import { ref, computed, watch } from 'vue'
import { useSupabase } from './useSupabase'
import { useEjecutivos } from './useEjecutivos'
import type { 
  ChatMessage, 
  ChatSession, 
  Prospecto,
  Ejecutivo,
  ApiResponse,
  AsignacionResult 
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
  const conversacionesPendientes = computed(() => {
    const pendientes = conversaciones.value.filter(c => {
      const sinAsignar = !c.assigned_to || c.assigned_to === null || c.assigned_to === ''
      const handoffBot = c.handoff_status === 'bot' || !c.handoff_status
      return sinAsignar && handoffBot
    })
    
    console.log('🔍 Filtro conversacionesPendientes:', {
      total: conversaciones.value.length,
      pendientes: pendientes.length,
      detalle: pendientes.map(c => ({
        id: c.id?.substring(0, 8) + '...',
        assigned_to: c.assigned_to || 'null',
        handoff_status: c.handoff_status || 'null'
      }))
    })
    
    return pendientes
  })
  const totalMensajesNoLeidos = computed(() => 
    Object.values(mensajesNoLeidos.value).reduce((sum, count) => sum + count, 0)
  )

  // Inicializar datos (carga desde la API del chatbot)
  const inicializar = async (): Promise<ApiResponse<boolean>> => {
    try {
      loading.value = true
      error.value = null

      // 1️⃣ Primero cargar ejecutivos para que estén disponibles
      console.log('🔄 Cargando ejecutivos primero...')
      await ejecutivos.fetchEjecutivos()
      console.log('✅ Ejecutivos cargados para useChat:', ejecutivos.ejecutivos.value.length)

      // 2️⃣ Luego cargar conversaciones
      const response = await fetch('http://localhost:3002/api/conversaciones')
      const result = await response.json()

      if (result.success && result.data) {
        conversaciones.value = result.data
        console.log(`✅ Conversaciones cargadas: ${result.data.length} encontradas`)
        // Logs de debug comentados para reducir spam
        // console.log('🔍 Estados de asignación:', result.data.map(c => ({
        //   id: c.id?.substring(0, 8) + '...',
        //   assigned_to: c.assigned_to ? c.assigned_to.substring(0, 8) + '...' : 'NO_ASIGNADO'
        // })))
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

      // Cargar mensajes desde el dashboard API
      const response = await fetch(`http://localhost:3002/api/conversaciones/${sessionId}/mensajes`)
      const result = await response.json()

      if (result.success && result.data) {
        // 🕐 Mapear mensajes del chatbot al formato del dashboard
        const mensajesMapeados: ChatMessage[] = result.data.map((msg: any) => ({
          id: msg.id,
          session_id: sessionId,
          type: msg.type === 'bot' ? 'bot' : msg.type === 'user' ? 'user' : 'ejecutivo',
          content: msg.content,
          timestamp: msg.created_at || msg.timestamp, // 🕐 Usar created_at del chatbot
          message_type: msg.message_type || 'text',
          sender_name: msg.sender_name,
          status: 'delivered',
          is_automated: msg.type === 'bot',
          metadata: msg.metadata || {}
        }))
        
        mensajes.value[sessionId] = mensajesMapeados
        console.log(`✅ Mensajes mapeados para conversación ${sessionId}:`, mensajesMapeados.length)
        return handleSupabaseSuccess(mensajesMapeados)
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

  // 🎯 Asignar conversación a ejecutivo con persistencia completa
  const asignarConversacion = async (
    sessionId: string, 
    ejecutivoId: string,
    metadata?: {
      manual?: boolean
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      notes?: string
    }
  ): Promise<ApiResponse<AsignacionResult>> => {
    try {
      loading.value = true
      error.value = null

      // 1️⃣ Validar que la conversación existe
      const conversacion = conversaciones.value.find(c => c.id === sessionId)
      if (!conversacion) {
        throw new Error(`Conversación ${sessionId} no encontrada`)
      }

      // 2️⃣ Llamar al endpoint de asignación
      const response = await fetch(`http://localhost:3002/api/conversaciones/${sessionId}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ejecutivoId,
          priority: metadata?.priority,
          notes: metadata?.notes
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error en asignación')
      }

      // 3️⃣ Actualizar estado local reactivo
      const localConversacion = conversaciones.value.find(c => c.id === sessionId)
      if (localConversacion) {
        localConversacion.assigned_to = ejecutivoId
        localConversacion.handoff_status = 'agent'
        localConversacion.handoff_accepted_at = new Date().toISOString()
        localConversacion.agent_last_activity = new Date().toISOString()
      }

      console.log(`✅ Conversación ${sessionId} asignada a ejecutivo ${ejecutivoId}`)

      return handleSupabaseSuccess(result.data)

    } catch (err: any) {
      error.value = err.message || 'Error al asignar conversación'
      console.error('❌ Error en asignarConversacion:', err)
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  // 🤖 Obtener contexto de handoff para ejecutivo
  const obtenerContextoHandoff = async (sessionId: string): Promise<any> => {
    try {
      // Obtener información del prospecto
      const conversacion = conversaciones.value.find(c => c.id === sessionId)
      if (!conversacion || !conversacion.prospecto_id) {
        return null
      }

      // Buscar en prospecto_actual
      const { data: prospecto } = await supabase
        .from('prospecto_actual')
        .select('*')
        .eq('whatsapp', conversacion.prospecto_id)
        .single()

      // Obtener últimos mensajes
      const mensajesRecientes = mensajes.value[sessionId]?.slice(-10) || []

      return {
        prospecto,
        mensajes_recientes: mensajesRecientes,
        resumen_sesion: `Prospecto interesado en ${(prospecto as any)?.carrera_interes || 'información general'}`
      }
    } catch (err) {
      console.warn('⚠️ Error obteniendo contexto de handoff:', err)
      return null
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
    // Obtener datos disponibles
    const nombre = (conversacion as any).prospecto?.nombre
    const telefono = (conversacion as any).phone_number
    
    // 1️⃣ Si tenemos nombre real del prospecto
    if (nombre && nombre !== 'Usuario WhatsApp') {
      // Con teléfono: "Juan Pérez (91234567)"
      if (telefono && /^\d+$/.test(telefono)) {
        const telefonoLimpio = telefono.replace(/^\+?56/, '').replace(/^56/, '')
        return `${nombre} (${telefonoLimpio})`
      }
      // Solo nombre: "Juan Pérez"
      return nombre
    }
    
    // 2️⃣ Si tenemos teléfono que parece real (solo números)
    if (telefono && /^\d+$/.test(telefono)) {
      const telefonoLimpio = telefono.replace(/^\+?56/, '').replace(/^56/, '')
      if (telefonoLimpio.length >= 8) {
        return `+56 ${telefonoLimpio.substring(0, 1)} ${telefonoLimpio.substring(1, 5)} ${telefonoLimpio.substring(5)}`
      }
      return `Usuario ${telefonoLimpio}`
    }
    
    // 3️⃣ Teléfono que parece ID de test
    if (telefono) {
      if (telefono.includes('test') || telefono.includes('menu')) {
        return `Sesión Test (${telefono.substring(0, 15)}...)`
      }
      return `ID: ${telefono.substring(0, 20)}...`
    }
    
    // 4️⃣ Fallback final
    return 'Prospecto Anónimo'
  }

  const getEjecutivoNombre = (ejecutivoId: string | null | undefined): string => {
    if (!ejecutivoId || ejecutivoId === 'null' || ejecutivoId === '') {
      return 'Sin asignar'
    }
    
    const ejecutivo = ejecutivos.ejecutivos.value.find(e => e.id === ejecutivoId)
    return ejecutivo?.nombre || `Ejecutivo ${ejecutivoId.substring(0, 8)}...`
  }

  // 🕐 Formatear tiempo en zona horaria de Chile
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

  // 🕐 Formatear hora específica para mensajes (timezone Chile)
  const formatearHoraMensaje = (timestamp: string): string => {
    try {
      const fecha = new Date(timestamp)
      // Formatear en hora local (el timestamp ya viene en timezone de Chile)
      return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago'
      })
    } catch {
      return 'Hora inválida'
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
    obtenerContextoHandoff,
    marcarComoLeida,

    // Métodos auxiliares
    getContactAvatar,
    getContactName,
    getEjecutivoNombre,
    formatearTiempo,
    formatearHoraMensaje, // 🕐 Nueva función para formatear horas

    // Para testing
    setConversacionActiva: (conversacion: ChatSession | null) => {
      conversacionActiva.value = conversacion
    },

    // 🆕 MÉTODO QUE FALTABA
    seleccionarConversacion: (conversacion: ChatSession) => {
      conversacionActiva.value = conversacion
      // Cargar mensajes de la conversación seleccionada
      obtenerMensajes(conversacion.id)
    },

    // 🆕 CERRAR CONVERSACIÓN
    cerrarConversacion: async (sessionId: string): Promise<ApiResponse<boolean>> => {
      try {
        loading.value = true
        error.value = null

        // Actualizar estado local
        const conversacion = conversaciones.value.find(c => c.id === sessionId)
        if (conversacion) {
          conversacion.status = 'closed'
        }

        // Limpiar conversación activa si es la misma
        if (conversacionActiva.value?.id === sessionId) {
          conversacionActiva.value = null
        }

        // TODO: En el futuro, sincronizar con Supabase
        console.log('✅ Conversación cerrada:', sessionId)
        return handleSupabaseSuccess(true)
      } catch (err) {
        error.value = 'Error cerrando conversación'
        return handleSupabaseError(err)
      } finally {
        loading.value = false
      }
    },

    // 🆕 INICIAR INDICADOR DE ESCRITURA
    iniciarEscritura: (sessionId: string, userId: string): void => {
      if (!usuariosEscribiendo.value[sessionId]) {
        usuariosEscribiendo.value[sessionId] = []
      }
      
      // Agregar usuario a la lista de escribiendo
      if (!usuariosEscribiendo.value[sessionId].includes(userId)) {
        usuariosEscribiendo.value[sessionId].push(userId)
      }

      // Remover después de 3 segundos
      setTimeout(() => {
        if (usuariosEscribiendo.value[sessionId]) {
          usuariosEscribiendo.value[sessionId] = usuariosEscribiendo.value[sessionId].filter(id => id !== userId)
        }
      }, 3000)
    }
  }
}