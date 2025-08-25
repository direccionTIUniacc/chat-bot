import { ref, computed } from 'vue'
import { useSupabase } from './useSupabase'
import { useEjecutivos } from './useEjecutivos'
import type { 
  Automatizacion, 
  CreateAutomatizacion, 
  AutomatizacionLog,
  AutomatizacionStats,
  TemplateAutomatizacion,
  ConfigAutomatizaciones,
  Prospecto,
  ApiResponse 
} from '@/types'

export function useAutomatizaciones() {
  const { supabase, handleSupabaseError, handleSupabaseSuccess } = useSupabase()
  const ejecutivos = useEjecutivos()
  
  // Estado reactivo
  const automatizaciones = ref<Automatizacion[]>([])
  const logs = ref<AutomatizacionLog[]>([])
  const stats = ref<AutomatizacionStats | null>(null)
  const config = ref<ConfigAutomatizaciones | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Templates predefinidos
  const templates: TemplateAutomatizacion[] = [
    {
      nombre: 'Bienvenida WhatsApp',
      descripcion: 'Mensaje automático de bienvenida para nuevos prospectos de WhatsApp',
      categoria: 'bienvenida',
      template: {
        trigger: {
          tipo: 'prospecto_creado',
          condiciones: { fuente: 'whatsapp_bot' },
          delay_minutos: 0
        },
        filtros: {
          fuente: ['whatsapp_bot']
        },
        acciones: [
          {
            tipo: 'enviar_whatsapp',
            parametros: {
              mensaje: '¡Hola! 👋 Gracias por tu interés en UNIACC. En breve un asesor se pondrá en contacto contigo para ayudarte con toda la información que necesites.',
              incluir_info_carreras: true
            },
            orden: 1
          },
          {
            tipo: 'cambiar_estado',
            parametros: {
              nuevo_estado: 'contacto_inicial'
            },
            orden: 2
          }
        ],
        activa: true
      }
    },
    {
      nombre: 'Asignación por Facultad',
      descripcion: 'Asigna automáticamente prospectos a ejecutivos según su facultad de interés',
      categoria: 'bienvenida',
      template: {
        trigger: {
          tipo: 'prospecto_creado',
          condiciones: { tiene_facultad: true },
          delay_minutos: 2
        },
        acciones: [
          {
            tipo: 'asignar_ejecutivo',
            parametros: {
              criterio: 'facultad_especialidad',
              backup_criterio: 'menor_carga'
            },
            orden: 1
          },
          {
            tipo: 'agregar_nota',
            parametros: {
              nota: 'Prospecto asignado automáticamente por facultad de interés'
            },
            orden: 2
          }
        ],
        activa: true
      }
    },
    {
      nombre: 'Seguimiento 24h',
      descripcion: 'Seguimiento automático si no hay contacto en 24 horas',
      categoria: 'seguimiento',
      template: {
        trigger: {
          tipo: 'tiempo_transcurrido',
          condiciones: { horas: 24 },
          delay_minutos: 0
        },
        filtros: {
          estado: ['nuevo', 'contacto_inicial']
        },
        acciones: [
          {
            tipo: 'enviar_email',
            parametros: {
              template: 'seguimiento_24h',
              destinatario: 'ejecutivo_asignado',
              asunto: 'Prospecto requiere seguimiento - 24h sin contacto'
            },
            orden: 1
          },
          {
            tipo: 'cambiar_estado',
            parametros: {
              nuevo_estado: 'contactado'
            },
            orden: 2
          }
        ],
        max_ejecuciones: 1,
        activa: true
      }
    },
    {
      nombre: 'Reactivación Dormidos',
      descripción: 'Reactiva prospectos que no han tenido actividad en 7 días',
      categoria: 'reactivacion',
      template: {
        trigger: {
          tipo: 'inactividad',
          condiciones: { dias: 7 },
          delay_minutos: 0
        },
        filtros: {
          estado: ['interesado', 'contactado']
        },
        acciones: [
          {
            tipo: 'enviar_whatsapp',
            parametros: {
              mensaje: 'Hola! 😊 Queríamos saber si aún tienes dudas sobre tu carrera de interés. ¿Te gustaría agendar una reunión con nuestro asesor?',
              incluir_link_agendamiento: true
            },
            orden: 1
          },
          {
            tipo: 'crear_tarea',
            parametros: {
              titulo: 'Llamar prospecto - Reactivación',
              descripcion: 'Prospecto inactivo por 7 días, realizar llamada de seguimiento',
              prioridad: 'media',
              ejecutivo_id: 'asignado'
            },
            orden: 2
          }
        ],
        max_ejecuciones: 2,
        activa: true
      }
    }
  ]

  // Datos mock para desarrollo
  const mockAutomatizaciones: Automatizacion[] = [
    {
      id: '1',
      nombre: 'Bienvenida WhatsApp',
      descripcion: 'Mensaje automático de bienvenida para nuevos prospectos de WhatsApp',
      activa: true,
      trigger: {
        tipo: 'prospecto_creado',
        condiciones: { fuente: 'whatsapp_bot' },
        delay_minutos: 0
      },
      filtros: {
        fuente: ['whatsapp_bot']
      },
      acciones: [
        {
          tipo: 'enviar_whatsapp',
          parametros: {
            mensaje: '¡Hola! 👋 Gracias por tu interés en UNIACC.',
            incluir_info_carreras: true
          },
          orden: 1
        }
      ],
      veces_ejecutada: 152,
      tasa_exito: 98.5,
      ultima_ejecucion: '2024-01-22T16:45:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-22T16:45:00Z'
    },
    {
      id: '2',
      nombre: 'Asignación por Facultad',
      descripcion: 'Asigna automáticamente prospectos según facultad de interés',
      activa: true,
      trigger: {
        tipo: 'prospecto_creado',
        condiciones: { tiene_facultad: true },
        delay_minutos: 2
      },
      acciones: [
        {
          tipo: 'asignar_ejecutivo',
          parametros: {
            criterio: 'facultad_especialidad'
          },
          orden: 1
        }
      ],
      veces_ejecutada: 89,
      tasa_exito: 94.2,
      ultima_ejecucion: '2024-01-22T15:20:00Z',
      created_at: '2024-01-15T11:00:00Z',
      updated_at: '2024-01-22T15:20:00Z'
    },
    {
      id: '3',
      nombre: 'Seguimiento 24h',
      descripcion: 'Recordatorio si no hay contacto en 24 horas',
      activa: false,
      trigger: {
        tipo: 'tiempo_transcurrido',
        condiciones: { horas: 24 },
        delay_minutos: 0
      },
      filtros: {
        estado: ['nuevo', 'contacto_inicial']
      },
      acciones: [
        {
          tipo: 'enviar_email',
          parametros: {
            template: 'seguimiento_24h',
            destinatario: 'ejecutivo_asignado'
          },
          orden: 1
        }
      ],
      veces_ejecutada: 23,
      tasa_exito: 87.0,
      ultima_ejecucion: '2024-01-21T14:30:00Z',
      created_at: '2024-01-20T09:00:00Z',
      updated_at: '2024-01-21T14:30:00Z'
    }
  ]

  const mockStats: AutomatizacionStats = {
    total_automatizaciones: 3,
    activas: 2,
    total_ejecuciones_hoy: 28,
    tasa_exito_promedio: 93.2,
    automatizacion_mas_usada: {
      id: '1',
      nombre: 'Bienvenida WhatsApp',
      ejecuciones: 152
    },
    impacto_conversion: 18.5
  }

  const mockConfig: ConfigAutomatizaciones = {
    habilitadas: true,
    max_por_prospecto_dia: 3,
    horario_global: {
      inicio: '09:00',
      fin: '19:00'
    },
    canales_habilitados: {
      email: true,
      whatsapp: true,
      sms: false
    }
  }

  // Computed
  const automatizacionesActivas = computed(() => 
    automatizaciones.value.filter(a => a.activa)
  )
  
  const automatizacionesInactivas = computed(() => 
    automatizaciones.value.filter(a => !a.activa)
  )

  const automatizacionesPorCategoria = computed(() => {
    const grupos: Record<string, Automatizacion[]> = {}
    
    automatizaciones.value.forEach(auto => {
      const categoria = getCategoria(auto)
      if (!grupos[categoria]) grupos[categoria] = []
      grupos[categoria].push(auto)
    })
    
    return grupos
  })

  // Métodos principales
  const fetchAutomatizaciones = async (): Promise<ApiResponse<Automatizacion[]>> => {
    try {
      loading.value = true
      error.value = null

      await new Promise(resolve => setTimeout(resolve, 600))
      automatizaciones.value = mockAutomatizaciones

      return handleSupabaseSuccess(mockAutomatizaciones)
    } catch (err) {
      error.value = 'Error al cargar automatizaciones'
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async (): Promise<ApiResponse<AutomatizacionStats>> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      stats.value = mockStats
      return handleSupabaseSuccess(mockStats)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const fetchConfig = async (): Promise<ApiResponse<ConfigAutomatizaciones>> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      config.value = mockConfig
      return handleSupabaseSuccess(mockConfig)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const createAutomatizacion = async (automatizacion: CreateAutomatizacion): Promise<ApiResponse<Automatizacion>> => {
    try {
      const nuevaAutomatizacion: Automatizacion = {
        ...automatizacion,
        id: `auto_${Date.now()}`,
        veces_ejecutada: 0,
        tasa_exito: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      automatizaciones.value.unshift(nuevaAutomatizacion)
      return handleSupabaseSuccess(nuevaAutomatizacion)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const updateAutomatizacion = async (id: string, updates: Partial<CreateAutomatizacion>): Promise<ApiResponse<Automatizacion>> => {
    try {
      const index = automatizaciones.value.findIndex(a => a.id === id)
      if (index >= 0) {
        const updated = {
          ...automatizaciones.value[index],
          ...updates,
          updated_at: new Date().toISOString()
        }
        automatizaciones.value[index] = updated
        return handleSupabaseSuccess(updated)
      }
      throw new Error('Automatización no encontrada')
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const toggleAutomatizacion = async (id: string): Promise<ApiResponse<Automatizacion>> => {
    try {
      const automatizacion = automatizaciones.value.find(a => a.id === id)
      if (!automatizacion) {
        throw new Error('Automatización no encontrada')
      }
      
      return await updateAutomatizacion(id, { activa: !automatizacion.activa })
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const deleteAutomatizacion = async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      const index = automatizaciones.value.findIndex(a => a.id === id)
      if (index >= 0) {
        automatizaciones.value.splice(index, 1)
        return handleSupabaseSuccess(true)
      }
      throw new Error('Automatización no encontrada')
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const duplicarAutomatizacion = async (id: string): Promise<ApiResponse<Automatizacion>> => {
    try {
      const original = automatizaciones.value.find(a => a.id === id)
      if (!original) {
        throw new Error('Automatización no encontrada')
      }

      const duplicada: CreateAutomatizacion = {
        nombre: `${original.nombre} (Copia)`,
        descripcion: original.descripcion,
        activa: false, // Las copias inician inactivas
        trigger: { ...original.trigger },
        filtros: original.filtros ? { ...original.filtros } : undefined,
        acciones: [...original.acciones],
        max_ejecuciones: original.max_ejecuciones,
        horario_activo: original.horario_activo ? { ...original.horario_activo } : undefined
      }

      return await createAutomatizacion(duplicada)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const crearDesdeTemplate = async (template: TemplateAutomatizacion): Promise<ApiResponse<Automatizacion>> => {
    try {
      const automatizacion: CreateAutomatizacion = {
        ...template.template,
        nombre: template.nombre,
        descripcion: template.descripcion
      }

      return await createAutomatizacion(automatizacion)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Ejecución de automatizaciones
  const ejecutarAutomatizacion = async (id: string, prospectoId: string): Promise<ApiResponse<AutomatizacionLog>> => {
    try {
      const automatizacion = automatizaciones.value.find(a => a.id === id)
      if (!automatizacion) {
        throw new Error('Automatización no encontrada')
      }

      console.log(`🤖 Ejecutando automatización "${automatizacion.nombre}" para prospecto ${prospectoId}`)

      const inicioEjecucion = Date.now()
      const resultados: any[] = []

      // Simular ejecución de acciones
      for (const accion of automatizacion.acciones) {
        try {
          const resultado = await ejecutarAccion(accion, prospectoId)
          resultados.push({
            tipo: accion.tipo,
            exito: true,
            resultado
          })
        } catch (error) {
          resultados.push({
            tipo: accion.tipo,
            exito: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          })
        }
      }

      const log: AutomatizacionLog = {
        id: `log_${Date.now()}`,
        automatizacion_id: id,
        prospecto_id: prospectoId,
        ejecutado_en: new Date().toISOString(),
        exito: resultados.every(r => r.exito),
        acciones_ejecutadas: resultados,
        tiempo_ejecucion_ms: Date.now() - inicioEjecucion,
        created_at: new Date().toISOString()
      }

      // Actualizar estadísticas
      automatizacion.veces_ejecutada += 1
      automatizacion.ultima_ejecucion = log.ejecutado_en
      
      // Recalcular tasa de éxito (simplificado)
      const exitosos = resultados.filter(r => r.exito).length
      automatizacion.tasa_exito = (exitosos / resultados.length) * 100

      logs.value.unshift(log)

      console.log(`✅ Automatización ejecutada: ${log.exito ? 'ÉXITO' : 'ERROR'}`)
      
      return handleSupabaseSuccess(log)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const ejecutarAccion = async (accion: any, prospectoId: string): Promise<any> => {
    // Simular delay de ejecución
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

    switch (accion.tipo) {
      case 'enviar_whatsapp':
        console.log(`📱 Enviando WhatsApp a prospecto ${prospectoId}:`, accion.parametros.mensaje)
        return { mensaje_id: `wa_${Date.now()}`, entregado: true }

      case 'enviar_email':
        console.log(`📧 Enviando email a prospecto ${prospectoId}:`, accion.parametros.asunto)
        return { email_id: `email_${Date.now()}`, enviado: true }

      case 'asignar_ejecutivo':
        const ejecutivoAsignado = await asignarEjecutivoAutomatico(prospectoId, accion.parametros.criterio)
        console.log(`👤 Asignando ejecutivo ${ejecutivoAsignado?.nombre} a prospecto ${prospectoId}`)
        return { ejecutivo_id: ejecutivoAsignado?.id, nombre: ejecutivoAsignado?.nombre }

      case 'cambiar_estado':
        console.log(`🔄 Cambiando estado de prospecto ${prospectoId} a:`, accion.parametros.nuevo_estado)
        return { estado_anterior: 'nuevo', estado_nuevo: accion.parametros.nuevo_estado }

      case 'agregar_nota':
        console.log(`📝 Agregando nota a prospecto ${prospectoId}:`, accion.parametros.nota)
        return { nota_id: `nota_${Date.now()}` }

      case 'crear_tarea':
        console.log(`✅ Creando tarea para prospecto ${prospectoId}:`, accion.parametros.titulo)
        return { tarea_id: `tarea_${Date.now()}` }

      case 'webhook_externo':
        console.log(`🔗 Llamando webhook externo para prospecto ${prospectoId}`)
        return { webhook_response: 'success', timestamp: new Date().toISOString() }

      default:
        throw new Error(`Tipo de acción no soportado: ${accion.tipo}`)
    }
  }

  const asignarEjecutivoAutomatico = async (prospectoId: string, criterio: string) => {
    await ejecutivos.fetchEjecutivos()
    
    switch (criterio) {
      case 'menor_carga':
        return ejecutivos.ejecutivosDisponibles.value.reduce((mejor, actual) => 
          actual.prospectos_activos < mejor.prospectos_activos ? actual : mejor
        )
      
      case 'facultad_especialidad':
        // Simplificado: devolver primer ejecutivo disponible
        return ejecutivos.ejecutivosDisponibles.value[0]
      
      default:
        return ejecutivos.ejecutivosDisponibles.value[0]
    }
  }

  // Utilidades
  const getCategoria = (automatizacion: Automatizacion): string => {
    if (automatizacion.nombre.toLowerCase().includes('bienvenida')) return 'bienvenida'
    if (automatizacion.nombre.toLowerCase().includes('seguimiento')) return 'seguimiento'
    if (automatizacion.nombre.toLowerCase().includes('reactivacion')) return 'reactivacion'
    if (automatizacion.nombre.toLowerCase().includes('conversion')) return 'conversion'
    return 'otras'
  }

  const testAutomatizacion = async (id: string): Promise<ApiResponse<any>> => {
    try {
      // Crear prospecto de prueba
      const prospectoTest = 'test_' + Date.now()
      
      console.log(`🧪 Probando automatización ${id} con prospecto de prueba ${prospectoTest}`)
      
      const resultado = await ejecutarAutomatizacion(id, prospectoTest)
      
      return handleSupabaseSuccess({
        test_ejecutado: true,
        prospecto_test: prospectoTest,
        resultado: resultado.data
      })
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const getTemplates = (): TemplateAutomatizacion[] => {
    return templates
  }

  const updateConfig = async (newConfig: Partial<ConfigAutomatizaciones>): Promise<ApiResponse<ConfigAutomatizaciones>> => {
    try {
      config.value = { ...config.value!, ...newConfig }
      return handleSupabaseSuccess(config.value)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Inicializar datos
  const inicializar = async () => {
    await Promise.all([
      fetchAutomatizaciones(),
      fetchStats(),
      fetchConfig()
    ])
  }

  return {
    // Estado
    automatizaciones,
    logs,
    stats,
    config,
    loading,
    error,

    // Computed
    automatizacionesActivas,
    automatizacionesInactivas,
    automatizacionesPorCategoria,

    // Métodos CRUD
    fetchAutomatizaciones,
    fetchStats,
    fetchConfig,
    createAutomatizacion,
    updateAutomatizacion,
    toggleAutomatizacion,
    deleteAutomatizacion,
    duplicarAutomatizacion,
    crearDesdeTemplate,

    // Ejecución
    ejecutarAutomatizacion,
    testAutomatizacion,

    // Utilidades
    getTemplates,
    updateConfig,
    inicializar
  }
}
