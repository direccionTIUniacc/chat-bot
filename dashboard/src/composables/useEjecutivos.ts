import { ref, computed } from 'vue'
import { useSupabase } from './useSupabase'
import type { 
  Ejecutivo, 
  CreateEjecutivo, 
  UpdateEjecutivo, 
  EjecutivoStats,
  EjecutivoPresencia,
  ReglasAsignacion,
  ApiResponse 
} from '@/types'

export function useEjecutivos() {
  const { supabase, handleSupabaseError, handleSupabaseSuccess } = useSupabase()
  
  // Estado reactivo
  const ejecutivos = ref<Ejecutivo[]>([])
  const ejecutivoActual = ref<Ejecutivo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Presencia en tiempo real (simulado por ahora)
  const presencia = ref<Record<string, EjecutivoPresencia>>({})

  // Computed
  const ejecutivosActivos = computed(() => 
    ejecutivos.value.filter(e => e.activo)
  )
  
  const ejecutivosDisponibles = computed(() => 
    ejecutivosActivos.value.filter(e => e.disponible)
  )

  const ejecutivosPorFacultad = computed(() => {
    const grupos: Record<string, Ejecutivo[]> = {}
    
    ejecutivosActivos.value.forEach(ejecutivo => {
      if (ejecutivo.facultades_asignadas) {
        ejecutivo.facultades_asignadas.forEach(facultad => {
          if (!grupos[facultad]) grupos[facultad] = []
          grupos[facultad].push(ejecutivo)
        })
      }
    })
    
    return grupos
  })

  // Datos mock para desarrollo
  const mockEjecutivos: Ejecutivo[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      nombre: 'María González',
      email: 'maria.gonzalez@uniacc.cl',
      telefono: '+56912345678',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=150',
      facultades_asignadas: ['Facultad de Comunicaciones', 'Facultad de Artes'],
      especialidades: ['Comunicación Audiovisual', 'Periodismo'],
      activo: true,
      disponible: true,
      max_prospectos_simultaneos: 15,
      auto_asignacion: true,
      notificaciones_email: true,
      notificaciones_push: true,
      horario_trabajo: {
        lunes: { inicio: '09:00', fin: '18:00' },
        martes: { inicio: '09:00', fin: '18:00' },
        miercoles: { inicio: '09:00', fin: '18:00' },
        jueves: { inicio: '09:00', fin: '18:00' },
        viernes: { inicio: '09:00', fin: '17:00' }
      },
      total_prospectos_asignados: 342,
      prospectos_activos: 8,
      tasa_conversion: 23.5,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-22T15:30:00Z',
      ultimo_acceso: '2024-01-22T15:30:00Z'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      nombre: 'Carlos Mendoza',
      email: 'carlos.mendoza@uniacc.cl',
      telefono: '+56987654321',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      facultades_asignadas: ['Facultad de Negocios y Tecnología'],
      especialidades: ['Ingeniería Comercial', 'Contador Auditor'],
      activo: true,
      disponible: true,
      max_prospectos_simultaneos: 12,
      auto_asignacion: true,
      notificaciones_email: true,
      notificaciones_push: false,
      horario_trabajo: {
        lunes: { inicio: '10:00', fin: '19:00' },
        martes: { inicio: '10:00', fin: '19:00' },
        miercoles: { inicio: '10:00', fin: '19:00' },
        jueves: { inicio: '10:00', fin: '19:00' },
        viernes: { inicio: '10:00', fin: '18:00' }
      },
      total_prospectos_asignados: 289,
      prospectos_activos: 11,
      tasa_conversion: 31.2,
      created_at: '2024-01-10T14:00:00Z',
      updated_at: '2024-01-22T12:45:00Z',
      ultimo_acceso: '2024-01-22T12:45:00Z'
    },
    {
      id: '3',
      nombre: 'Ana Rodríguez',
      email: 'ana.rodriguez@uniacc.cl',
      telefono: '+56945678901',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      facultades_asignadas: ['Facultad de Ciencias Jurídicas y Sociales'],
      especialidades: ['Derecho', 'Psicología'],
      activo: true,
      disponible: false, // En reunión
      max_prospectos_simultaneos: 10,
      auto_asignacion: true,
      notificaciones_email: true,
      notificaciones_push: true,
      horario_trabajo: {
        lunes: { inicio: '08:30', fin: '17:30' },
        martes: { inicio: '08:30', fin: '17:30' },
        miercoles: { inicio: '08:30', fin: '17:30' },
        jueves: { inicio: '08:30', fin: '17:30' },
        viernes: { inicio: '08:30', fin: '16:30' }
      },
      total_prospectos_asignados: 198,
      prospectos_activos: 7,
      tasa_conversion: 28.8,
      created_at: '2024-01-20T09:00:00Z',
      updated_at: '2024-01-22T11:20:00Z',
      ultimo_acceso: '2024-01-22T11:20:00Z'
    }
  ]

  // Obtener todos los ejecutivos
  const fetchEjecutivos = async (): Promise<ApiResponse<Ejecutivo[]>> => {
    try {
      loading.value = true
      error.value = null

      // Obtener ejecutivos desde la API
      const response = await fetch('http://localhost:3002/api/ejecutivos')
      const result = await response.json()

      if (result.success && result.data) {
        ejecutivos.value = result.data
        console.log('✅ Ejecutivos cargados desde API:', result.data.length)
        return handleSupabaseSuccess(result.data)
      } else {
        // Si no hay ejecutivos en la BD, usar mock
        console.log('⚠️ No hay ejecutivos en BD, usando datos mock')
        ejecutivos.value = mockEjecutivos
        return handleSupabaseSuccess(mockEjecutivos)
      }
    } catch (err) {
      console.log('⚠️ Error con API, usando datos mock:', err)
      // Fallback a datos mock si hay error
      ejecutivos.value = mockEjecutivos
      return handleSupabaseSuccess(mockEjecutivos)
    } finally {
      loading.value = false
    }
  }

  // Obtener ejecutivo por ID
  const getEjecutivo = async (id: string): Promise<ApiResponse<Ejecutivo>> => {
    try {
      const ejecutivo = mockEjecutivos.find(e => e.id === id)
      if (!ejecutivo) {
        throw new Error('Ejecutivo no encontrado')
      }
      ejecutivoActual.value = ejecutivo
      return handleSupabaseSuccess(ejecutivo)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Crear nuevo ejecutivo
  const createEjecutivo = async (ejecutivo: CreateEjecutivo): Promise<ApiResponse<Ejecutivo>> => {
    try {
      const newEjecutivo: Ejecutivo = {
        ...ejecutivo,
        id: Date.now().toString(),
        total_prospectos_asignados: 0,
        prospectos_activos: 0,
        tasa_conversion: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      ejecutivos.value.unshift(newEjecutivo)
      return handleSupabaseSuccess(newEjecutivo)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Actualizar ejecutivo
  const updateEjecutivo = async (id: string, updates: UpdateEjecutivo): Promise<ApiResponse<Ejecutivo>> => {
    try {
      const index = ejecutivos.value.findIndex(e => e.id === id)
      if (index >= 0) {
        const updatedEjecutivo = {
          ...ejecutivos.value[index],
          ...updates,
          updated_at: new Date().toISOString()
        }
        ejecutivos.value[index] = updatedEjecutivo
        
        if (ejecutivoActual.value?.id === id) {
          ejecutivoActual.value = updatedEjecutivo
        }
        
        return handleSupabaseSuccess(updatedEjecutivo)
      }
      throw new Error('Ejecutivo no encontrado')
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Eliminar ejecutivo (desactivar)
  const deleteEjecutivo = async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      return await updateEjecutivo(id, { activo: false })
        .then(() => handleSupabaseSuccess(true))
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Cambiar disponibilidad
  const toggleDisponibilidad = async (id: string): Promise<ApiResponse<Ejecutivo>> => {
    try {
      const ejecutivo = ejecutivos.value.find(e => e.id === id)
      if (!ejecutivo) {
        throw new Error('Ejecutivo no encontrado')
      }
      
      return await updateEjecutivo(id, { disponible: !ejecutivo.disponible })
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Obtener estadísticas del ejecutivo
  const getEjecutivoStats = async (id: string): Promise<ApiResponse<EjecutivoStats>> => {
    try {
      // Stats simuladas
      const stats: EjecutivoStats = {
        prospectos_asignados_hoy: Math.floor(Math.random() * 10) + 1,
        prospectos_contactados_hoy: Math.floor(Math.random() * 8) + 1,
        prospectos_convertidos_mes: Math.floor(Math.random() * 15) + 5,
        tiempo_respuesta_promedio: Math.floor(Math.random() * 30) + 10,
        rating_satisfaccion: Math.round((Math.random() * 2 + 3) * 10) / 10,
        metas_mes: {
          contactos: 50,
          conversiones: 12,
          completado_contactos: Math.floor(Math.random() * 45) + 20,
          completado_conversiones: Math.floor(Math.random() * 10) + 5
        }
      }

      return handleSupabaseSuccess(stats)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Asignar prospecto a ejecutivo
  const asignarProspecto = async (
    prospectoId: string, 
    ejecutivoId: string, 
    motivo?: string
  ): Promise<ApiResponse<boolean>> => {
    try {
      // Lógica de asignación
      console.log(`Asignando prospecto ${prospectoId} a ejecutivo ${ejecutivoId}`, { motivo })
      
      // Actualizar contadores del ejecutivo
      const ejecutivo = ejecutivos.value.find(e => e.id === ejecutivoId)
      if (ejecutivo) {
        ejecutivo.prospectos_activos += 1
        ejecutivo.total_prospectos_asignados += 1
      }

      return handleSupabaseSuccess(true)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Algoritmo de asignación automática
  const asignacionAutomatica = (
    prospectoData: {
      facultad?: string
      carrera_interes?: string
      region?: string
      nivel_interes?: string
      fuente?: string
    },
    reglas?: ReglasAsignacion
  ): Ejecutivo | null => {
    const candidatos = ejecutivosDisponibles.value.filter(ejecutivo => {
      // Filtrar por facultad
      if (prospectoData.facultad && ejecutivo.facultades_asignadas) {
        if (!ejecutivo.facultades_asignadas.includes(prospectoData.facultad)) {
          return false
        }
      }

      // Filtrar por especialidad/carrera
      if (prospectoData.carrera_interes && ejecutivo.especialidades) {
        if (!ejecutivo.especialidades.includes(prospectoData.carrera_interes)) {
          return false
        }
      }

      // Verificar capacidad
      if (ejecutivo.prospectos_activos >= ejecutivo.max_prospectos_simultaneos) {
        return false
      }

      // Verificar auto-asignación habilitada
      if (!ejecutivo.auto_asignacion) {
        return false
      }

      return true
    })

    if (candidatos.length === 0) {
      return null
    }

    // Algoritmo de asignación (por ahora round-robin con menor carga)
    return candidatos.reduce((mejor, actual) => 
      actual.prospectos_activos < mejor.prospectos_activos ? actual : mejor
    )
  }

  // Actualizar presencia en tiempo real
  const updatePresencia = (ejecutivoId: string, estado: EjecutivoPresencia['estado']) => {
    presencia.value[ejecutivoId] = {
      ejecutivo_id: ejecutivoId,
      estado,
      ultimo_acceso: new Date().toISOString(),
      conversaciones_activas: presencia.value[ejecutivoId]?.conversaciones_activas || 0
    }
  }

  // Obtener ejecutivos por facultad
  const getEjecutivosPorFacultad = (facultad: string): Ejecutivo[] => {
    return ejecutivosActivos.value.filter(e => 
      e.facultades_asignadas?.includes(facultad)
    )
  }

  // Verificar si ejecutivo está trabajando (horario laboral)
  const estaEnHorarioTrabajo = (ejecutivo: Ejecutivo): boolean => {
    const ahora = new Date()
    const diaSemana = ahora.getDay() // 0=domingo, 1=lunes, etc.
    const horaActual = ahora.getHours() * 100 + ahora.getMinutes()

    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    const diaActual = diasSemana[diaSemana] as keyof typeof ejecutivo.horario_trabajo

    const horario = ejecutivo.horario_trabajo?.[diaActual]
    if (!horario) return false

    const [inicioHora, inicioMin] = horario.inicio.split(':').map(Number)
    const [finHora, finMin] = horario.fin.split(':').map(Number)
    
    const horaInicio = inicioHora * 100 + inicioMin
    const horaFin = finHora * 100 + finMin

    return horaActual >= horaInicio && horaActual <= horaFin
  }

  return {
    // Estado
    ejecutivos,
    ejecutivoActual,
    loading,
    error,
    presencia,

    // Computed
    ejecutivosActivos,
    ejecutivosDisponibles,
    ejecutivosPorFacultad,

    // Métodos CRUD
    fetchEjecutivos,
    getEjecutivo,
    createEjecutivo,
    updateEjecutivo,
    deleteEjecutivo,

    // Funcionalidades específicas
    toggleDisponibilidad,
    getEjecutivoStats,
    asignarProspecto,
    asignacionAutomatica,
    updatePresencia,
    getEjecutivosPorFacultad,
    estaEnHorarioTrabajo
  }
}
