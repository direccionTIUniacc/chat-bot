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
