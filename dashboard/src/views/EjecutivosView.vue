<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Ejecutivos de Admisión</h1>
        <p class="text-gray-600">Gestiona el equipo de asesores y su asignación de prospectos</p>
      </div>
      <button 
        @click="openModal('create')"
        class="btn-primary"
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Nuevo Ejecutivo
      </button>
    </div>

    <!-- Métricas del equipo -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Ejecutivos"
        :value="ejecutivos.ejecutivosActivos.value?.length || 0"
        :icon="Users"
        icon-background-class="bg-blue-500"
      />
      
      <MetricCard
        title="Disponibles Ahora"
        :value="ejecutivos.ejecutivosDisponibles.value?.length || 0"
        :icon="UserCheck"
        icon-background-class="bg-green-500"
      />
      
      <MetricCard
        title="Prospectos Activos"
        :value="totalProspectosActivos"
        :icon="Target"
        icon-background-class="bg-orange-500"
      />
      
      <MetricCard
        title="Conversión Promedio"
        :value="conversionPromedio"
        :icon="TrendingUp"
        icon-background-class="bg-purple-500"
        format="percentage"
        :decimals="1"
      />
    </div>

    <!-- Filtros -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar ejecutivo..."
          class="input-field"
        />
        
        <select
          v-model="filtroFacultad"
          class="input-field"
        >
          <option value="">Todas las facultades</option>
          <option 
            v-for="(facultad, key) in FACULTADES_UNIACC"
            :key="key"
            :value="key"
          >
            {{ facultad.emoji }} {{ key }}
          </option>
        </select>
        
        <select
          v-model="filtroEstado"
          class="input-field"
        >
          <option value="">Todos los estados</option>
          <option value="disponible">Disponibles</option>
          <option value="ocupado">Ocupados</option>
          <option value="offline">Desconectados</option>
        </select>
        
        <button
          @click="refreshData"
          class="btn-secondary"
          :disabled="ejecutivos.loading.value"
        >
          <RotateCcw class="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- Lista de ejecutivos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="ejecutivo in ejecutivosFiltrados"
        :key="ejecutivo.id"
        class="card p-6 hover:shadow-md transition-shadow"
      >
        <!-- Header del card -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <img
                :src="ejecutivo.avatar_url || defaultAvatar"
                :alt="ejecutivo.nombre"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div 
                :class="[
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                  getEstadoColor(ejecutivo)
                ]"
              ></div>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ ejecutivo.nombre }}</h3>
              <p class="text-sm text-gray-600">{{ ejecutivo.email }}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              @click="toggleDisponibilidad(ejecutivo.id)"
              :class="[
                'p-1 rounded-full',
                ejecutivo.disponible 
                  ? 'text-green-600 hover:bg-green-50' 
                  : 'text-gray-400 hover:bg-gray-50'
              ]"
              :title="ejecutivo.disponible ? 'Marcar como no disponible' : 'Marcar como disponible'"
            >
              <Power class="w-4 h-4" />
            </button>
            
            <button
              @click="openModal('edit', ejecutivo)"
              class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
              title="Editar ejecutivo"
            >
              <Edit class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Facultades asignadas -->
        <div class="mb-4">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Facultades
          </p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="facultad in ejecutivo.facultades_asignadas || []"
              :key="facultad"
              class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
            >
              {{ getFacultadEmoji(facultad) }} {{ getFacultadNombre(facultad) }}
            </span>
          </div>
          
          <div v-if="!ejecutivo.facultades_asignadas?.length" class="text-xs text-gray-400">
            Sin facultades asignadas
          </div>
        </div>

        <!-- Métricas -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-900">{{ ejecutivo.prospectos_activos }}</p>
            <p class="text-xs text-gray-500">Activos</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ ejecutivo.tasa_conversion }}%</p>
            <p class="text-xs text-gray-500">Conversión</p>
          </div>
        </div>

        <!-- Progress bar de capacidad -->
        <div class="mb-4">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Capacidad</span>
            <span>{{ ejecutivo.prospectos_activos }}/{{ ejecutivo.max_prospectos_simultaneos }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              :class="[
                'h-2 rounded-full transition-all',
                getCapacidadColor(ejecutivo)
              ]"
              :style="{ 
                width: `${(ejecutivo.prospectos_activos / ejecutivo.max_prospectos_simultaneos) * 100}%` 
              }"
            ></div>
          </div>
        </div>

        <!-- Estado y horario -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-1">
            <Clock class="w-3 h-3 text-gray-400" />
            <span class="text-gray-500">
              {{ estaEnHorario(ejecutivo) ? 'En horario' : 'Fuera de horario' }}
            </span>
          </div>
          
          <div class="flex items-center space-x-1">
            <span :class="[
              'px-2 py-1 rounded-full text-xs font-medium',
              ejecutivo.disponible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            ]">
              {{ ejecutivo.disponible ? 'Disponible' : 'No disponible' }}
            </span>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="mt-4 pt-4 border-t border-gray-100">
          <div class="flex space-x-2">
            <button
              @click="verDetalles(ejecutivo)"
              class="flex-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-3 rounded transition-colors"
            >
              Ver Detalles
            </button>
            <button
              @click="asignarProspecto(ejecutivo.id)"
              class="flex-1 text-xs bg-uniacc-primary hover:bg-blue-700 text-white py-2 px-3 rounded transition-colors"
              :disabled="!ejecutivo.disponible"
            >
              Asignar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de crear/editar ejecutivo -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div
        class="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-lg font-semibold">
            {{ modalMode === 'create' ? 'Nuevo Ejecutivo' : 'Editar Ejecutivo' }}
          </h2>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
        
        <div class="p-6">
          <EjecutivoForm
            :ejecutivo="selectedEjecutivo"
            :mode="modalMode"
            @save="handleSave"
            @cancel="closeModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Users, 
  UserCheck, 
  UserPlus,
  Target, 
  TrendingUp,
  Power,
  Edit,
  Clock,
  RotateCcw,
  X
} from 'lucide-vue-next'
import { useEjecutivos } from '@/composables/useEjecutivos'
import { FACULTADES_UNIACC } from '@/utils/constants'
import type { Ejecutivo, CreateEjecutivo, UpdateEjecutivo } from '@/types'
import MetricCard from '@/components/common/MetricCard.vue'
import EjecutivoForm from '@/components/ejecutivos/EjecutivoForm.vue'

// Composables
const ejecutivos = useEjecutivos()

// Estado local
const searchTerm = ref('')
const filtroFacultad = ref('')
const filtroEstado = ref('')
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const selectedEjecutivo = ref<Ejecutivo | null>(null)

const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'

// Computed
const ejecutivosFiltrados = computed(() => {
  let filtered = ejecutivos.ejecutivos.value

  // Filtro por texto
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(e => 
      e.nombre.toLowerCase().includes(search) ||
      e.email.toLowerCase().includes(search)
    )
  }

  // Filtro por facultad
  if (filtroFacultad.value) {
    filtered = filtered.filter(e => 
      e.facultades_asignadas?.includes(filtroFacultad.value)
    )
  }

  // Filtro por estado
  if (filtroEstado.value) {
    filtered = filtered.filter(e => {
      switch (filtroEstado.value) {
        case 'disponible':
          return e.disponible && e.activo
        case 'ocupado':
          return !e.disponible && e.activo
        case 'offline':
          return !e.activo
        default:
          return true
      }
    })
  }

  return filtered
})

const totalProspectosActivos = computed(() =>
  ejecutivos.ejecutivos.value?.reduce((sum, e) => sum + e.prospectos_activos, 0) || 0
)

const conversionPromedio = computed(() => {
  const activos = ejecutivos.ejecutivosActivos.value
  if (!activos || activos.length === 0) return 0
  
  return activos.reduce((sum, e) => sum + e.tasa_conversion, 0) / activos.length
})

// Métodos
const refreshData = async () => {
  await ejecutivos.fetchEjecutivos()
}

const openModal = (mode: 'create' | 'edit', ejecutivo?: Ejecutivo) => {
  modalMode.value = mode
  selectedEjecutivo.value = ejecutivo || null
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedEjecutivo.value = null
}

const handleSave = async (data: CreateEjecutivo | UpdateEjecutivo) => {
  if (modalMode.value === 'create') {
    await ejecutivos.createEjecutivo(data as CreateEjecutivo)
  } else if (selectedEjecutivo.value) {
    await ejecutivos.updateEjecutivo(selectedEjecutivo.value.id, data as UpdateEjecutivo)
  }
  closeModal()
}

const toggleDisponibilidad = async (id: string) => {
  await ejecutivos.toggleDisponibilidad(id)
}

const verDetalles = (ejecutivo: Ejecutivo) => {
  // Navegar a vista de detalles o abrir modal de estadísticas
  console.log('Ver detalles de:', ejecutivo.nombre)
}

const asignarProspecto = (ejecutivoId: string) => {
  // Abrir modal de asignación manual de prospectos
  console.log('Asignar prospecto a:', ejecutivoId)
}

const getEstadoColor = (ejecutivo: Ejecutivo) => {
  if (!ejecutivo.activo) return 'bg-gray-400'
  return ejecutivo.disponible ? 'bg-green-400' : 'bg-yellow-400'
}

const getCapacidadColor = (ejecutivo: Ejecutivo) => {
  const porcentaje = (ejecutivo.prospectos_activos / ejecutivo.max_prospectos_simultaneos) * 100
  
  if (porcentaje >= 90) return 'bg-red-500'
  if (porcentaje >= 70) return 'bg-orange-500'
  if (porcentaje >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

const estaEnHorario = (ejecutivo: Ejecutivo) => {
  return ejecutivos.estaEnHorarioTrabajo(ejecutivo)
}

const getFacultadEmoji = (facultad: string) => {
  return FACULTADES_UNIACC[facultad as keyof typeof FACULTADES_UNIACC]?.emoji || '🎓'
}

const getFacultadNombre = (facultad: string) => {
  return facultad.replace('Facultad de ', '')
}

// Lifecycle
onMounted(refreshData)
</script>
