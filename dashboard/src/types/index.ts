export * from './prospecto'
export * from './chatbot'
export * from './supabase'
export * from './botpress'
export * from './ejecutivo'
export * from './automatizacion'

// Tipos comunes
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// 🎯 Tipos para sistema de asignación
export interface AsignacionResult {
  conversacion_id: string
  ejecutivo_asignado: {
    id: string
    nombre: string
    email: string
    avatar_url?: string
  }
  prospecto_info: {
    whatsapp: string
    nombre: string
    carrera_interes: string
    nivel_interes: string
  }
  handoff_timestamp: string
  context_transferido: boolean
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface FilterOptions {
  search?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  source?: string
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}
