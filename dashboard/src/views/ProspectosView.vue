<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Prospectos</h1>
        <p class="text-gray-600">Gestiona los prospectos generados por el ChatBot</p>
      </div>
      <button 
        @click="prospectosStore.openModal('create')"
        class="btn-primary"
      >
        <Plus class="w-4 h-4 mr-2" />
        Nuevo Prospecto
      </button>
    </div>

    <!-- Filtros y búsqueda -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por nombre o email..."
          class="input-field"
          @input="handleSearch"
        />
        
        <select
          v-model="selectedStatus"
          class="input-field"
          @change="handleFilterChange"
        >
          <option value="">Todos los estados</option>
          <option value="nuevo">Nuevo</option>
          <option value="contactado">Contactado</option>
          <option value="interesado">Interesado</option>
          <option value="matriculado">Matriculado</option>
          <option value="descartado">Descartado</option>
        </select>
        
        <select
          v-model="selectedSource"
          class="input-field"
          @change="handleFilterChange"
        >
          <option value="">Todas las fuentes</option>
          <option value="chatbot">ChatBot</option>
          <option value="web">Sitio Web</option>
          <option value="social">Redes Sociales</option>
          <option value="referido">Referido</option>
        </select>
        
        <select
          v-model="selectedTipoConsulta"
          class="input-field"
          @change="handleFilterChange"
        >
          <option value="">Todos los tipos</option>
          <option value="solicitud de asesor" class="text-red-600 font-bold">🚨 URGENTE - Solicitud de Asesor</option>
          <option value="consulta carrera">Consulta Carrera</option>
          <option value="consulta proceso admision">Consulta Proceso Admisión</option>
          <option value="consulta costos y/o becas">Consulta Costos y/o Becas</option>
          <option value="consulta de modalidades de estudio">Consulta de Modalidades de Estudio</option>
          <option value="consulta general">Consulta General</option>
        </select>
        
        <button
          @click="clearFilters"
          class="btn-secondary"
        >
          <FilterX class="w-4 h-4 mr-2" />
          Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Tabla de prospectos -->
    <div class="card">
      <LoadingSpinner 
        v-if="prospectosStore.loading" 
        text="Cargando prospectos..."
        container-class="py-12"
      />
      
      <div v-else-if="prospectosStore.prospectos.length === 0" class="text-center py-12">
        <Users class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No hay prospectos</h3>
        <p class="text-gray-500 mb-4">Comienza creando tu primer prospecto</p>
        <button 
          @click="prospectosStore.openModal('create')"
          class="btn-primary"
        >
          Crear Prospecto
        </button>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prospecto
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consulta
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carrera
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fuente
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="prospecto in prospectosStore.prospectos" 
              :key="prospecto.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ prospecto.nombre }}
                  </div>
                  <div class="text-sm text-gray-500">{{ prospecto.email }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatTipoConsulta(prospecto.tipo_consulta) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ prospecto.carrera_interes || 'No especificada' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col gap-1">
                  <span :class="[
                    'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                    getStatusColor(prospecto.estado)
                  ]">
                    {{ formatStatus(prospecto.estado) }}
                  </span>
                  <span v-if="prospecto.nivel_interes === 'urgente'" 
                    class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 animate-pulse">
                    🚨 URGENTE
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                  getSourceColor(prospecto.fuente)
                ]">
                  {{ formatSource(prospecto.fuente) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDateTimeChile(prospecto.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="prospectosStore.openModal('view', prospecto)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    @click="prospectosStore.openModal('edit', prospecto)"
                    class="text-yellow-600 hover:text-yellow-900"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleDelete(prospecto.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="prospectosStore.pagination.totalPages > 1" class="flex justify-center">
      <nav class="flex space-x-2">
        <button
          v-for="page in paginationPages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-md',
            page === prospectosStore.pagination.page
              ? 'bg-uniacc-primary text-white'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          {{ page }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Users, Eye, Edit, Trash2, FilterX } from 'lucide-vue-next'
import { useProspectosStore } from '@/stores/prospectos'
import { formatDate, formatStatus, formatSource, formatTipoConsulta, formatDateTimeChile } from '@/utils/formatters'
import { PROSPECTO_ESTADOS_COLORS, PROSPECTO_FUENTES_COLORS } from '@/utils/constants'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

// Store
const prospectosStore = useProspectosStore()

// Estado local
const searchTerm = ref('')
const selectedStatus = ref('')
const selectedSource = ref('')
const selectedTipoConsulta = ref('')

// Computed
const paginationPages = computed(() => {
  const total = prospectosStore.pagination.totalPages
  const current = prospectosStore.pagination.page
  const pages = []
  
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Métodos
const handleSearch = () => {
  prospectosStore.applyFilters({ search: searchTerm.value })
}

const handleFilterChange = () => {
  prospectosStore.applyFilters({
    status: selectedStatus.value,
    source: selectedSource.value,
    tipo_consulta: selectedTipoConsulta.value
  })
}

const clearFilters = () => {
  searchTerm.value = ''
  selectedStatus.value = ''
  selectedSource.value = ''
  selectedTipoConsulta.value = ''
  prospectosStore.resetFilters()
}

const goToPage = (page: number) => {
  prospectosStore.goToPage(page)
}

const handleDelete = async (id: string) => {
  if (confirm('¿Estás seguro de que deseas eliminar este prospecto?')) {
    await prospectosStore.removeProspecto(id)
  }
}

const getStatusColor = (estado: string) => {
  return PROSPECTO_ESTADOS_COLORS[estado as keyof typeof PROSPECTO_ESTADOS_COLORS] || 'bg-gray-100 text-gray-800'
}

const getSourceColor = (fuente: string) => {
  return PROSPECTO_FUENTES_COLORS[fuente as keyof typeof PROSPECTO_FUENTES_COLORS] || 'bg-gray-100 text-gray-800'
}

// Lifecycle
onMounted(() => {
  prospectosStore.initialize()
})
</script>
