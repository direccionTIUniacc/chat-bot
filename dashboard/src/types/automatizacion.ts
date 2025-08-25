import { z } from 'zod'

// Esquemas para el sistema de automatizaciones
export const AutomatizacionSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  activa: z.boolean().default(true),
  
  // Trigger - qué evento activa la automatización
  trigger: z.object({
    tipo: z.enum([
      'prospecto_creado',
      'estado_cambiado',
      'tiempo_transcurrido',
      'inactividad',
      'horario_programado',
      'ejecutivo_asignado'
    ]),
    condiciones: z.record(z.string(), z.any()).optional(),
    delay_minutos: z.number().default(0) // Delay antes de ejecutar
  }),
  
  // Filtros - a qué prospectos se aplica
  filtros: z.object({
    fuente: z.array(z.string()).optional(),
    estado: z.array(z.string()).optional(),
    facultad: z.array(z.string()).optional(),
    ejecutivo_id: z.string().optional(),
    nivel_interes: z.array(z.string()).optional()
  }).optional(),
  
  // Acciones - qué se ejecuta
  acciones: z.array(z.object({
    tipo: z.enum([
      'enviar_email',
      'enviar_whatsapp',
      'asignar_ejecutivo',
      'cambiar_estado',
      'crear_tarea',
      'webhook_externo',
      'agregar_nota'
    ]),
    parametros: z.record(z.string(), z.any()),
    orden: z.number().default(1)
  })),
  
  // Configuración
  max_ejecuciones: z.number().optional(), // Límite de ejecuciones por prospecto
  horario_activo: z.object({
    inicio: z.string(), // HH:mm
    fin: z.string(), // HH:mm
    dias_semana: z.array(z.number()) // 0=domingo, 1=lunes, etc.
  }).optional(),
  
  // Estadísticas
  veces_ejecutada: z.number().default(0),
  tasa_exito: z.number().default(0),
  ultima_ejecucion: z.string().optional(),
  
  // Timestamps
  created_at: z.string(),
  updated_at: z.string()
})

export const CreateAutomatizacionSchema = AutomatizacionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  veces_ejecutada: true,
  tasa_exito: true,
  ultima_ejecucion: true
})

// Esquema para logs de ejecución
export const AutomatizacionLogSchema = z.object({
  id: z.string().uuid(),
  automatizacion_id: z.string().uuid(),
  prospecto_id: z.string().uuid(),
  ejecutado_en: z.string(),
  exito: z.boolean(),
  acciones_ejecutadas: z.array(z.object({
    tipo: z.string(),
    exito: z.boolean(),
    error: z.string().optional(),
    resultado: z.record(z.string(), z.any()).optional()
  })),
  tiempo_ejecucion_ms: z.number(),
  error: z.string().optional(),
  created_at: z.string()
})

// Tipos TypeScript
export type Automatizacion = z.infer<typeof AutomatizacionSchema>
export type CreateAutomatizacion = z.infer<typeof CreateAutomatizacionSchema>
export type AutomatizacionLog = z.infer<typeof AutomatizacionLogSchema>

// Templates de automatizaciones predefinidas
export interface TemplateAutomatizacion {
  nombre: string
  descripcion: string
  categoria: 'bienvenida' | 'seguimiento' | 'conversion' | 'reactivacion'
  template: Omit<CreateAutomatizacion, 'nombre' | 'descripcion'>
}

// Estadísticas de automatizaciones
export interface AutomatizacionStats {
  total_automatizaciones: number
  activas: number
  total_ejecuciones_hoy: number
  tasa_exito_promedio: number
  automatizacion_mas_usada: {
    id: string
    nombre: string
    ejecuciones: number
  }
  impacto_conversion: number // % de mejora en conversión
}

// Configuración global de automatizaciones
export interface ConfigAutomatizaciones {
  habilitadas: boolean
  max_por_prospecto_dia: number
  horario_global: {
    inicio: string
    fin: string
  }
  canales_habilitados: {
    email: boolean
    whatsapp: boolean
    sms: boolean
  }
}
