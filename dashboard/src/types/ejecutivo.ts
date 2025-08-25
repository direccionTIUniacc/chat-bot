import { z } from 'zod'

// Esquemas para Ejecutivos de Admisión
export const EjecutivoSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  avatar_url: z.string().url().optional(),
  
  // Especialización
  facultades_asignadas: z.array(z.string()).optional(), // Facultades que maneja
  especialidades: z.array(z.string()).optional(), // Carreras específicas
  
  // Estado y disponibilidad
  activo: z.boolean().default(true),
  disponible: z.boolean().default(true), // Para chat en tiempo real
  max_prospectos_simultaneos: z.number().default(10),
  
  // Configuración
  auto_asignacion: z.boolean().default(true), // Recibe asignaciones automáticas
  notificaciones_email: z.boolean().default(true),
  notificaciones_push: z.boolean().default(true),
  
  // Horarios de trabajo
  horario_trabajo: z.object({
    lunes: z.object({ inicio: z.string(), fin: z.string() }).optional(),
    martes: z.object({ inicio: z.string(), fin: z.string() }).optional(),
    miercoles: z.object({ inicio: z.string(), fin: z.string() }).optional(),
    jueves: z.object({ inicio: z.string(), fin: z.string() }).optional(),
    viernes: z.object({ inicio: z.string(), fin: z.string() }).optional(),
    sabado: z.object({ inicio: z.string(), fin: z.string() }).optional(),
    domingo: z.object({ inicio: z.string(), fin: z.string() }).optional()
  }).optional(),
  
  // Métricas
  total_prospectos_asignados: z.number().default(0),
  prospectos_activos: z.number().default(0),
  tasa_conversion: z.number().default(0),
  
  // Timestamps
  created_at: z.string(),
  updated_at: z.string(),
  ultimo_acceso: z.string().optional()
})

export const CreateEjecutivoSchema = EjecutivoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  total_prospectos_asignados: true,
  prospectos_activos: true,
  tasa_conversion: true
})

export const UpdateEjecutivoSchema = CreateEjecutivoSchema.partial()

// Tipos TypeScript derivados
export type Ejecutivo = z.infer<typeof EjecutivoSchema>
export type CreateEjecutivo = z.infer<typeof CreateEjecutivoSchema>
export type UpdateEjecutivo = z.infer<typeof UpdateEjecutivoSchema>

// Estadísticas del ejecutivo
export interface EjecutivoStats {
  prospectos_asignados_hoy: number
  prospectos_contactados_hoy: number
  prospectos_convertidos_mes: number
  tiempo_respuesta_promedio: number // en minutos
  rating_satisfaccion: number // 1-5
  metas_mes: {
    contactos: number
    conversiones: number
    completado_contactos: number
    completado_conversiones: number
  }
}

// Disponibilidad en tiempo real
export interface EjecutivoPresencia {
  ejecutivo_id: string
  estado: 'online' | 'offline' | 'ocupado' | 'ausente'
  ultimo_acceso: string
  conversaciones_activas: number
}

// Asignación automática
export interface ReglasAsignacion {
  tipo: 'round_robin' | 'menor_carga' | 'especialidad' | 'manual'
  filtros: {
    facultad?: string
    region?: string
    nivel_interes?: string
    fuente?: string
  }
  prioridad: number
}
