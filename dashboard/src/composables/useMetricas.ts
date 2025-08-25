import { ref, computed } from 'vue'
import { useSupabase } from './useSupabase'
import type { ChatbotMetrics, ProspectoStats, ApiResponse } from '@/types'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export function useMetricas() {
  const { supabase, handleSupabaseError, handleSupabaseSuccess } = useSupabase()
  
  // Estado reactivo
  const loading = ref(false)
  const error = ref<string | null>(null)
  const dateRange = ref({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  })

  // Métricas de prospectos
  const prospectoMetrics = ref<ProspectoStats>({
    total: 0,
    nuevos: 0,
    contactados: 0,
    interesados: 0,
    matriculados: 0,
    descartados: 0,
    conversion_rate: 0
  })

  // Métricas del chatbot
  const chatbotMetrics = ref<ChatbotMetrics>({
    total_sessions: 0,
    active_sessions: 0,
    completed_sessions: 0,
    avg_duration: 0,
    messages_per_session: 0,
    conversion_rate: 0,
    popular_queries: []
  })

  // Computed
  const totalInteracciones = computed(() => 
    prospectoMetrics.value.total + chatbotMetrics.value.total_sessions
  )

  const conversionGlobal = computed(() => {
    const total = prospectoMetrics.value.total
    const matriculados = prospectoMetrics.value.matriculados
    return total > 0 ? (matriculados / total) * 100 : 0
  })

  // Obtener métricas de prospectos
  const fetchProspectoMetrics = async (): Promise<ApiResponse<ProspectoStats>> => {
    try {
      loading.value = true
      error.value = null

      // Consultar estadísticas del chatbot
      const response = await fetch('http://localhost:3001/api/stats')
      const result = await response.json()
      
      if (result.success && result.data) {
        prospectoMetrics.value = result.data
        console.log('✅ Métricas de prospectos cargadas desde chatbot:', result.data)
        return handleSupabaseSuccess(result.data)
      } else {
        console.error('❌ Error cargando métricas:', result.error)
        // Fallback a stats vacías
        const stats: ProspectoStats = {
          total: 0,
          nuevos: 0,
          contactados: 0,
          interesados: 0,
          matriculados: 0,
          descartados: 0,
          conversion_rate: 0
        }
        prospectoMetrics.value = stats
        return handleSupabaseSuccess(stats)
      }
    } catch (err) {
      console.error('❌ Error de conexión con chatbot:', err)
      error.value = 'Error al cargar métricas de prospectos'
      // Fallback a stats vacías
      const stats: ProspectoStats = {
        total: 0,
        nuevos: 0,
        contactados: 0,
        interesados: 0,
        matriculados: 0,
        descartados: 0,
        conversion_rate: 0
      }
      prospectoMetrics.value = stats
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  // Obtener métricas del chatbot
  const fetchChatbotMetrics = async (): Promise<ApiResponse<ChatbotMetrics>> => {
    try {
      loading.value = true
      error.value = null

      // Por ahora, usar métricas simuladas basadas en los datos del chatbot
      // En el futuro, podríamos agregar endpoints específicos para métricas del bot
      const metrics: ChatbotMetrics = {
        total_sessions: prospectoMetrics.value.total, // Basado en prospectos capturados
        active_sessions: 0, // Por implementar
        completed_sessions: prospectoMetrics.value.total, // Todos los prospectos son sesiones completadas
        avg_duration: 5, // Promedio de 5 minutos por conversación
        messages_per_session: 8, // Promedio de 8 mensajes por conversación
        conversion_rate: prospectoMetrics.value.conversion_rate,
        popular_queries: [
          { query: 'Conocer carreras', count: 3 },
          { query: 'Proceso de admisión', count: 2 },
          { query: 'Costos y becas', count: 1 },
          { query: 'Hablar con asesor', count: 1 }
        ]
      }

      chatbotMetrics.value = metrics
      return handleSupabaseSuccess(metrics)
    } catch (err) {
      error.value = 'Error al cargar métricas del chatbot'
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  // Obtener datos para gráficos de tendencias
  const getTrendData = async (metric: 'prospectos' | 'sesiones', days: number = 30) => {
    try {
      // Datos simulados para gráficos
      const result = []
      const endDate = new Date()
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd')
        result.unshift({
          date,
          value: Math.floor(Math.random() * 10) + 1 // Valores aleatorios de ejemplo
        })
      }

      return handleSupabaseSuccess(result)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Actualizar rango de fechas
  const updateDateRange = (from: string, to: string) => {
    dateRange.value = { from, to }
  }

  // Cargar todas las métricas
  const loadAllMetrics = async () => {
    await Promise.all([
      fetchProspectoMetrics(),
      fetchChatbotMetrics()
    ])
  }

  return {
    // Estado
    loading,
    error,
    dateRange,
    prospectoMetrics,
    chatbotMetrics,

    // Computed
    totalInteracciones,
    conversionGlobal,

    // Métodos
    fetchProspectoMetrics,
    fetchChatbotMetrics,
    getTrendData,
    updateDateRange,
    loadAllMetrics
  }
}
