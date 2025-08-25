import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProspectos } from '@/composables/useProspectos'
import { useMetricas } from '@/composables/useMetricas'
import type { Prospecto, FilterOptions, SortOptions } from '@/types'

export const useProspectosStore = defineStore('prospectos', () => {
  // Composables
  const {
    prospectos,
    loading,
    error,
    pagination,
    filters,
    sort,
    fetchProspectos,
    getProspecto,
    createProspecto,
    updateProspecto,
    deleteProspecto,
    getStats,
    clearFilters
  } = useProspectos()

  const { 
    prospectoMetrics,
    fetchProspectoMetrics 
  } = useMetricas()

  // Estado adicional del store
  const selectedProspecto = ref<Prospecto | null>(null)
  const showModal = ref(false)
  const modalMode = ref<'create' | 'edit' | 'view'>('create')

  // Computed
  const prospectosCount = computed(() => prospectos.value.length)
  const hasFilters = computed(() => Object.keys(filters.value).length > 0)
  
  const prospectosGroupedByStatus = computed(() => {
    const groups = prospectos.value.reduce((acc, prospecto) => {
      if (!acc[prospecto.estado]) {
        acc[prospecto.estado] = []
      }
      acc[prospecto.estado].push(prospecto)
      return acc
    }, {} as Record<string, Prospecto[]>)
    
    return groups
  })

  // Actions
  const loadProspectos = async (options?: {
    filters?: FilterOptions
    sort?: SortOptions
    page?: number
    pageSize?: number
  }) => {
    const result = await fetchProspectos(options)
    if (result.success) {
      await fetchProspectoMetrics()
    }
    return result
  }

  const selectProspecto = async (id: string) => {
    const result = await getProspecto(id)
    if (result.success && result.data) {
      selectedProspecto.value = result.data
    }
    return result
  }

  const openModal = (mode: 'create' | 'edit' | 'view', prospecto?: Prospecto) => {
    modalMode.value = mode
    selectedProspecto.value = prospecto || null
    showModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
    selectedProspecto.value = null
    modalMode.value = 'create'
  }

  const saveProspecto = async (prospectoData: any) => {
    let result
    
    if (modalMode.value === 'create') {
      result = await createProspecto(prospectoData)
    } else if (modalMode.value === 'edit' && selectedProspecto.value) {
      result = await updateProspecto(selectedProspecto.value.id, prospectoData)
    }

    if (result?.success) {
      await fetchProspectoMetrics()
      closeModal()
    }

    return result
  }

  const removeProspecto = async (id: string) => {
    const result = await deleteProspecto(id)
    if (result.success) {
      await fetchProspectoMetrics()
    }
    return result
  }

  const applyFilters = async (newFilters: FilterOptions) => {
    return await loadProspectos({ filters: newFilters, page: 1 })
  }

  const applySorting = async (newSort: SortOptions) => {
    return await loadProspectos({ sort: newSort })
  }

  const goToPage = async (page: number) => {
    return await loadProspectos({ page })
  }

  const resetFilters = async () => {
    clearFilters()
    return await loadProspectos()
  }

  const refreshData = async () => {
    await loadProspectos()
  }

  // Inicialización
  const initialize = async () => {
    await loadProspectos()
  }

  return {
    // Estado
    prospectos,
    loading,
    error,
    pagination,
    filters,
    sort,
    selectedProspecto,
    showModal,
    modalMode,
    prospectoMetrics,

    // Computed
    prospectosCount,
    hasFilters,
    prospectosGroupedByStatus,

    // Actions
    initialize,
    loadProspectos,
    selectProspecto,
    openModal,
    closeModal,
    saveProspecto,
    removeProspecto,
    applyFilters,
    applySorting,
    goToPage,
    resetFilters,
    refreshData,
    getStats
  }
})
