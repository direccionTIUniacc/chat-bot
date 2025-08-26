import { ref, computed } from 'vue'
import { useSupabase } from './useSupabase'
import { useMockData } from './useMockData'
import type { 
  Prospecto, 
  CreateProspecto, 
  UpdateProspecto, 
  ProspectoStats,
  FilterOptions,
  SortOptions,
  PaginationMeta,
  ApiResponse 
} from '@/types'

export function useProspectos() {
  const { supabase, handleSupabaseError, handleSupabaseSuccess } = useSupabase()
  const mockData = useMockData()
  
  // Estado reactivo
  const prospectos = ref<Prospecto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  // Filtros y ordenamiento
  const filters = ref<FilterOptions>({})
  const sort = ref<SortOptions>({ field: 'created_at', direction: 'desc' })

  // Computed
  const hasProspectos = computed(() => prospectos.value.length > 0)
  const isEmpty = computed(() => !loading.value && prospectos.value.length === 0)

  // Obtener todos los prospectos con filtros y paginación
  const fetchProspectos = async (options?: {
    filters?: FilterOptions
    sort?: SortOptions
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<Prospecto[]>> => {
    try {
      loading.value = true
      error.value = null

      // Simular delay para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 500))

      // Consultar datos del bot
      const response = await fetch('http://localhost:3002/api/prospectos')
      const result = await response.json()

      let filteredData: Prospecto[] = []
      
      if (result.success && result.data) {
        filteredData = result.data
        prospectos.value = result.data
      }

      // Aplicar filtros
      if (options?.filters) {
        filters.value = { ...filters.value, ...options.filters }
        
        if (filters.value.search) {
          filteredData = filteredData.filter(p => 
            p.nombre.toLowerCase().includes(filters.value.search!.toLowerCase()) ||
            p.email.toLowerCase().includes(filters.value.search!.toLowerCase())
          )
        }
        if (filters.value.status) {
          filteredData = filteredData.filter(p => p.estado === filters.value.status)
        }
        if (filters.value.source) {
          filteredData = filteredData.filter(p => p.fuente === filters.value.source)
        }
      }

      // Actualizar paginación
      if (options?.page) pagination.value.page = options.page
      if (options?.pageSize) pagination.value.pageSize = options.pageSize

      pagination.value.total = filteredData.length
      pagination.value.totalPages = Math.ceil(filteredData.length / pagination.value.pageSize)

      // Aplicar paginación
      const startIndex = (pagination.value.page - 1) * pagination.value.pageSize
      const endIndex = startIndex + pagination.value.pageSize
      const paginatedData = filteredData.slice(startIndex, endIndex)

      prospectos.value = paginatedData

      return handleSupabaseSuccess(paginatedData)
    } catch (err) {
      error.value = 'Error al cargar prospectos'
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  // Obtener un prospecto por ID
  const getProspecto = async (id: string): Promise<ApiResponse<Prospecto>> => {
    try {
      const prospecto = mockProspectos.value.find(p => p.id === id)
      if (!prospecto) {
        throw new Error('Prospecto no encontrado')
      }
      return handleSupabaseSuccess(prospecto)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Crear nuevo prospecto
  const createProspecto = async (prospecto: CreateProspecto): Promise<ApiResponse<Prospecto>> => {
    try {
      // Simular creación con datos mock
      const newProspecto: Prospecto = {
        ...prospecto,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Actualizar lista local
      prospectos.value.unshift(newProspecto)
      pagination.value.total += 1

      return handleSupabaseSuccess(newProspecto)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Actualizar prospecto
  const updateProspecto = async (id: string, updates: UpdateProspecto): Promise<ApiResponse<Prospecto>> => {
    try {
      // Actualizar lista local mock
      const index = prospectos.value.findIndex(p => p.id === id)
      if (index >= 0) {
        const updatedProspecto = {
          ...prospectos.value[index],
          ...updates,
          updated_at: new Date().toISOString()
        }
        prospectos.value[index] = updatedProspecto
        return handleSupabaseSuccess(updatedProspecto)
      }

      throw new Error('Prospecto no encontrado')
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Eliminar prospecto
  const deleteProspecto = async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      // Actualizar lista local mock
      prospectos.value = prospectos.value.filter(p => p.id !== id)
      pagination.value.total -= 1

      return handleSupabaseSuccess(true)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Obtener estadísticas de prospectos
  const getStats = async (): Promise<ApiResponse<ProspectoStats>> => {
    try {
      // Consultar estadísticas del bot
      const response = await fetch('http://localhost:3006/api/stats')
      const result = await response.json()
      
      if (result.success && result.data) {
        return handleSupabaseSuccess(result.data)
      } else {
        // Fallback a stats vacías
        const stats = mockData.stats.value
        return handleSupabaseSuccess(stats)
      }
    } catch (err) {
      // Fallback a stats vacías en caso de error
      const stats = mockData.stats.value
      return handleSupabaseSuccess(stats)
    }
  }

  // Limpiar filtros
  const clearFilters = () => {
    filters.value = {}
    pagination.value.page = 1
  }

  return {
    // Estado
    prospectos,
    loading,
    error,
    pagination,
    filters,
    sort,

    // Computed
    hasProspectos,
    isEmpty,

    // Métodos
    fetchProspectos,
    getProspecto,
    createProspecto,
    updateProspecto,
    deleteProspecto,
    getStats,
    clearFilters
  }
}
