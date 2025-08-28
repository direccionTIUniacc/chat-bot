import { z } from 'zod'

// Esquemas de validación con Zod - ESQUEMA UNIFICADO
export const ProspectoSchema = z.object({
  id: z.string().uuid(),
  // Datos personales
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  whatsapp: z.string().optional(), // Número WhatsApp (identificador único para bot)
  region: z.string().optional(), // Ciudad/región del prospecto
  
  // Interés académico
  carrera_interes: z.string().optional(), // Nombre de la carrera
  programa_interes: z.string().optional(), // ID del programa específico
  facultad: z.string().optional(), // Facultad de interés
  nivel_interes: z.enum(['bajo', 'medio', 'alto']).optional(),
  tipo_consulta: z.enum([
    // Valores originales
    'info_carreras',
    'info_admision', 
    'info_costos',
    'info_modalidades',
    'solicitar_asesor',
    'ingreso solo datos basicos',
    'consulta multiple carrera especifica',
    'consulta multiple general',
    // 🆕 Nuevos valores para progressive capture
    'captura en proceso',
    'abandono solo nombre',
    'abandono con email', 
    'abandono con edad',
    'abandono con region',
    'abandono incompleto',
    'captura completa'
  ]).optional(),
  
  // Gestión del prospecto
  fuente: z.enum(['whatsapp_bot', 'web_form', 'facebook_ads', 'google_ads', 'referido', 'social']),
  estado: z.enum([
    'nuevo', 
    'contacto_inicial', 
    'informacion_enviada',
    'contactado', 
    'interesado',
    'en_proceso', 
    'matriculado',
    'no_interesado',
    'descartado'
  ]),
  
  // Asignación y seguimiento
  ejecutivo_id: z.string().uuid().optional(), // Asesor asignado
  notas: z.string().optional(),
  fecha_contacto: z.string().nullable(),
  fecha_seguimiento: z.string().nullable(),
  ultima_interaccion: z.string().nullable(),
  
  // Metadatos y tracking
  metadata: z.record(z.string(), z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string()
})

export const CreateProspectoSchema = ProspectoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

export const UpdateProspectoSchema = CreateProspectoSchema.partial()

// Tipos TypeScript derivados de los esquemas
export type Prospecto = z.infer<typeof ProspectoSchema>
export type CreateProspecto = z.infer<typeof CreateProspectoSchema>
export type UpdateProspecto = z.infer<typeof UpdateProspectoSchema>

// Tipos auxiliares
export type ProspectoEstado = Prospecto['estado']
export type ProspectoFuente = Prospecto['fuente']
export type ProspectoNivelInteres = Prospecto['nivel_interes']

export interface ProspectoStats {
  total: number
  nuevos: number
  contactados: number
  interesados: number
  matriculados: number
  descartados: number
  conversion_rate: number
}
