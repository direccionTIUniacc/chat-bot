<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Automatizaciones</h1>
        <p class="text-gray-600">Gestiona workflows automáticos para optimizar el proceso de admisión</p>
      </div>
      
      <div class="flex space-x-3">
        <button
          @click="openTemplatesModal"
          class="btn-secondary"
        >
          <FileText class="w-4 h-4 mr-2" />
          Templates
        </button>
        <button
          @click="openCreateModal"
          class="btn-primary"
        >
          <Plus class="w-4 h-4 mr-2" />
          Nueva Automatización
        </button>
      </div>
    </div>

    <!-- Métricas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Automatizaciones"
        :value="automatizaciones.stats.value?.total_automatizaciones || 0"
        :icon="Zap"
        icon-background-class="bg-blue-500"
      />
      
      <MetricCard
        title="Activas"
        :value="automatizaciones.stats.value?.activas || 0"
        :icon="Play"
        icon-background-class="bg-green-500"
      />
      
      <MetricCard
        title="Ejecuciones Hoy"
        :value="automatizaciones.stats.value?.total_ejecuciones_hoy || 0"
        :icon="Activity"
        icon-background-class="bg-orange-500"
      />
      
      <MetricCard
        title="Tasa de Éxito"
        :value="automatizaciones.stats.value?.tasa_exito_promedio || 0"
        :icon="TrendingUp"
        icon-background-class="bg-purple-500"
        format="percentage"
        :decimals="1"
      />
    </div>

    <!-- Configuración global -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Configuración Global</h3>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">Automatizaciones</span>
          <button
            @click="toggleGlobalAutomatizaciones"
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-uniacc-primary focus:ring-offset-2',
              automatizaciones.config.value?.habilitadas ? 'bg-uniacc-primary' : 'bg-gray-200'
            ]"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                automatizaciones.config.value?.habilitadas ? 'translate-x-5' : 'translate-x-0'
              ]"
            />
          </button>
        </div>
      </div>
      
      <div v-if="automatizaciones.config.value" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Máximo por prospecto/día
          </label>
          <input
            v-model.number="automatizaciones.config.value.max_por_prospecto_dia"
            type="number"
            min="1"
            max="10"
            class="input-field w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Horario de funcionamiento
          </label>
          <div class="flex space-x-2">
            <input
              v-model="automatizaciones.config.value.horario_global.inicio"
              type="time"
              class="input-field flex-1"
            />
            <span class="self-center text-gray-500">-</span>
            <input
              v-model="automatizaciones.config.value.horario_global.fin"
              type="time"
              class="input-field flex-1"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Canales habilitados
          </label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                v-model="automatizaciones.config.value.canales_habilitados.email"
                type="checkbox"
                class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
              />
              <span class="ml-2 text-sm">Email</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="automatizaciones.config.value.canales_habilitados.whatsapp"
                type="checkbox"
                class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
              />
              <span class="ml-2 text-sm">WhatsApp</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="automatizaciones.config.value.canales_habilitados.sms"
                type="checkbox"
                class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
              />
              <span class="ml-2 text-sm">SMS</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card p-4">
      <div class="flex flex-wrap items-center gap-4">
        <select
          v-model="filtroCategoria"
          class="input-field"
        >
          <option value="">Todas las categorías</option>
          <option value="bienvenida">Bienvenida</option>
          <option value="seguimiento">Seguimiento</option>
          <option value="conversion">Conversión</option>
          <option value="reactivacion">Reactivación</option>
          <option value="otras">Otras</option>
        </select>
        
        <select
          v-model="filtroEstado"
          class="input-field"
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activas</option>
          <option value="inactiva">Inactivas</option>
        </select>
        
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar automatización..."
          class="input-field"
        />
        
        <button
          @click="refreshData"
          class="btn-secondary"
          :disabled="automatizaciones.loading.value"
        >
          <RotateCcw :class="{ 'animate-spin': automatizaciones.loading.value }" class="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- Lista de automatizaciones -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="automatizacion in automatizacionesFiltradas"
        :key="automatizacion.id"
        class="card p-6 hover:shadow-md transition-shadow"
      >
        <!-- Header de la card -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ automatizacion.nombre }}</h3>
              <span 
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  automatizacion.activa 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ automatizacion.activa ? 'Activa' : 'Inactiva' }}
              </span>
              <span 
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getCategoriaColor(automatizacion)
                ]"
              >
                {{ getCategoria(automatizacion) }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-3">{{ automatizacion.descripcion }}</p>
          </div>
          
          <!-- Menú de acciones -->
          <div class="relative" ref="menuRef">
            <button
              @click="toggleMenu(automatizacion.id)"
              class="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreVertical class="w-5 h-5" />
            </button>
            
            <div
              v-if="menuAbierto === automatizacion.id"
              class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
            >
              <div class="py-1">
                <button
                  @click="editarAutomatizacion(automatizacion)"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit class="w-4 h-4 mr-2" />
                  Editar
                </button>
                <button
                  @click="duplicarAutomatizacion(automatizacion.id)"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy class="w-4 h-4 mr-2" />
                  Duplicar
                </button>
                <button
                  @click="testearAutomatizacion(automatizacion.id)"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <TestTube class="w-4 h-4 mr-2" />
                  Probar
                </button>
                <hr class="my-1" />
                <button
                  @click="eliminarAutomatizacion(automatizacion.id)"
                  class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 class="w-4 h-4 mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Trigger info -->
        <div class="mb-4">
          <div class="flex items-center space-x-2 mb-2">
            <Zap class="w-4 h-4 text-yellow-500" />
            <span class="text-sm font-medium text-gray-700">Disparador</span>
          </div>
          <p class="text-sm text-gray-600 ml-6">
            {{ formatTrigger(automatizacion.trigger) }}
          </p>
        </div>

        <!-- Acciones -->
        <div class="mb-4">
          <div class="flex items-center space-x-2 mb-2">
            <Settings class="w-4 h-4 text-blue-500" />
            <span class="text-sm font-medium text-gray-700">Acciones ({{ automatizacion.acciones.length }})</span>
          </div>
          <div class="ml-6 space-y-1">
            <div
              v-for="(accion, index) in automatizacion.acciones.slice(0, 2)"
              :key="index"
              class="text-sm text-gray-600"
            >
              {{ index + 1 }}. {{ formatAccion(accion) }}
            </div>
            <div v-if="automatizacion.acciones.length > 2" class="text-xs text-gray-500">
              +{{ automatizacion.acciones.length - 2 }} más...
            </div>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div class="text-center">
            <p class="text-lg font-bold text-gray-900">{{ automatizacion.veces_ejecutada }}</p>
            <p class="text-xs text-gray-500">Ejecuciones</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-green-600">{{ automatizacion.tasa_exito.toFixed(1) }}%</p>
            <p class="text-xs text-gray-500">Éxito</p>
          </div>
          <div class="text-center">
            <p class="text-xs font-medium text-gray-900">
              {{ automatizacion.ultima_ejecucion ? formatearFecha(automatizacion.ultima_ejecucion) : 'Nunca' }}
            </p>
            <p class="text-xs text-gray-500">Última vez</p>
          </div>
        </div>

        <!-- Acciones de la card -->
        <div class="flex space-x-2">
          <button
            @click="automatizaciones.toggleAutomatizacion(automatizacion.id)"
            :class="[
              'flex-1 py-2 px-3 text-sm font-medium rounded transition-colors',
              automatizacion.activa
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            ]"
          >
            {{ automatizacion.activa ? 'Desactivar' : 'Activar' }}
          </button>
          
          <button
            @click="verDetalles(automatizacion)"
            class="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 px-3 text-sm font-medium rounded transition-colors"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-if="automatizacionesFiltradas.length === 0" class="text-center py-12">
      <Zap class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No hay automatizaciones</h3>
      <p class="text-gray-500 mb-4">
        {{ automatizaciones.automatizaciones.value.length === 0 ? 'Crea tu primera automatización para optimizar el proceso' : 'No se encontraron automatizaciones con los filtros aplicados' }}
      </p>
      <button
        v-if="automatizaciones.automatizaciones.value.length === 0"
        @click="openTemplatesModal"
        class="btn-primary"
      >
        Explorar Templates
      </button>
    </div>

    <!-- Modal de templates -->
    <TemplatesModal
      v-if="showTemplatesModal"
      @close="closeTemplatesModal"
      @create="crearDesdeTemplate"
    />

    <!-- Modal de crear/editar -->
    <AutomatizacionModal
      v-if="showCreateModal"
      :automatizacion="automatizacionEnEdicion"
      @close="closeCreateModal"
      @save="guardarAutomatizacion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Plus, 
  Zap, 
  Play, 
  Activity, 
  TrendingUp,
  FileText,
  RotateCcw,
  MoreVertical,
  Edit,
  Copy,
  TestTube,
  Trash2,
  Settings
} from 'lucide-vue-next'
import { useAutomatizaciones } from '@/composables/useAutomatizaciones'
import type { Automatizacion, CreateAutomatizacion, TemplateAutomatizacion } from '@/types'
import MetricCard from '@/components/common/MetricCard.vue'
import TemplatesModal from '@/components/automatizaciones/TemplatesModal.vue'
import AutomatizacionModal from '@/components/automatizaciones/AutomatizacionModal.vue'

// Composables
const automatizaciones = useAutomatizaciones()

// Estado local
const searchTerm = ref('')
const filtroCategoria = ref('')
const filtroEstado = ref('')
const menuAbierto = ref<string | null>(null)
const showTemplatesModal = ref(false)
const showCreateModal = ref(false)
const automatizacionEnEdicion = ref<Automatizacion | null>(null)

// Computed
const automatizacionesFiltradas = computed(() => {
  let filtered = automatizaciones.automatizaciones.value

  // Filtro por búsqueda
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(a =>
      a.nombre.toLowerCase().includes(search) ||
      a.descripcion?.toLowerCase().includes(search)
    )
  }

  // Filtro por categoría
  if (filtroCategoria.value) {
    filtered = filtered.filter(a => getCategoria(a) === filtroCategoria.value)
  }

  // Filtro por estado
  if (filtroEstado.value) {
    filtered = filtered.filter(a => 
      filtroEstado.value === 'activa' ? a.activa : !a.activa
    )
  }

  return filtered
})

// Métodos
const refreshData = async () => {
  await automatizaciones.inicializar()
}

const toggleGlobalAutomatizaciones = async () => {
  if (automatizaciones.config.value) {
    await automatizaciones.updateConfig({
      habilitadas: !automatizaciones.config.value.habilitadas
    })
  }
}

const toggleMenu = (id: string) => {
  menuAbierto.value = menuAbierto.value === id ? null : id
}

const openTemplatesModal = () => {
  showTemplatesModal.value = true
}

const closeTemplatesModal = () => {
  showTemplatesModal.value = false
}

const openCreateModal = () => {
  automatizacionEnEdicion.value = null
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  automatizacionEnEdicion.value = null
}

const editarAutomatizacion = (automatizacion: Automatizacion) => {
  automatizacionEnEdicion.value = automatizacion
  showCreateModal.value = true
  menuAbierto.value = null
}

const duplicarAutomatizacion = async (id: string) => {
  await automatizaciones.duplicarAutomatizacion(id)
  menuAbierto.value = null
}

const testearAutomatizacion = async (id: string) => {
  const resultado = await automatizaciones.testAutomatizacion(id)
  console.log('Resultado del test:', resultado.data)
  menuAbierto.value = null
  
  // Mostrar notificación de éxito
  alert('Automatización probada exitosamente. Revisa la consola para ver los detalles.')
}

const eliminarAutomatizacion = async (id: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta automatización?')) {
    await automatizaciones.deleteAutomatizacion(id)
    menuAbierto.value = null
  }
}

const crearDesdeTemplate = async (template: TemplateAutomatizacion) => {
  await automatizaciones.crearDesdeTemplate(template)
  closeTemplatesModal()
}

const guardarAutomatizacion = async (data: CreateAutomatizacion) => {
  if (automatizacionEnEdicion.value) {
    await automatizaciones.updateAutomatizacion(automatizacionEnEdicion.value.id, data)
  } else {
    await automatizaciones.createAutomatizacion(data)
  }
  closeCreateModal()
}

const verDetalles = (automatizacion: Automatizacion) => {
  // Implementar modal de detalles o navegación
  console.log('Ver detalles de:', automatizacion.nombre)
}

// Utilidades
const getCategoria = (automatizacion: Automatizacion): string => {
  if (automatizacion.nombre.toLowerCase().includes('bienvenida')) return 'bienvenida'
  if (automatizacion.nombre.toLowerCase().includes('seguimiento')) return 'seguimiento'
  if (automatizacion.nombre.toLowerCase().includes('reactivacion')) return 'reactivacion'
  if (automatizacion.nombre.toLowerCase().includes('conversion')) return 'conversion'
  return 'otras'
}

const getCategoriaColor = (automatizacion: Automatizacion): string => {
  const categoria = getCategoria(automatizacion)
  const colores = {
    bienvenida: 'bg-blue-100 text-blue-800',
    seguimiento: 'bg-orange-100 text-orange-800',
    conversion: 'bg-green-100 text-green-800',
    reactivacion: 'bg-purple-100 text-purple-800',
    otras: 'bg-gray-100 text-gray-800'
  }
  return colores[categoria as keyof typeof colores] || colores.otras
}

const formatTrigger = (trigger: any): string => {
  const tipos = {
    prospecto_creado: 'Cuando se crea un prospecto',
    estado_cambiado: 'Cuando cambia el estado',
    tiempo_transcurrido: 'Después de cierto tiempo',
    inactividad: 'Por inactividad',
    horario_programado: 'En horario programado',
    ejecutivo_asignado: 'Cuando se asigna ejecutivo'
  }
  
  let descripcion = tipos[trigger.tipo as keyof typeof tipos] || trigger.tipo
  
  if (trigger.delay_minutos > 0) {
    descripcion += ` (después de ${trigger.delay_minutos} min)`
  }
  
  return descripcion
}

const formatAccion = (accion: any): string => {
  const tipos = {
    enviar_email: 'Enviar email',
    enviar_whatsapp: 'Enviar WhatsApp',
    asignar_ejecutivo: 'Asignar ejecutivo',
    cambiar_estado: 'Cambiar estado',
    crear_tarea: 'Crear tarea',
    webhook_externo: 'Llamar webhook',
    agregar_nota: 'Agregar nota'
  }
  
  return tipos[accion.tipo as keyof typeof tipos] || accion.tipo
}

const formatearFecha = (fecha: string): string => {
  const date = new Date(fecha)
  const ahora = new Date()
  const diff = ahora.getTime() - date.getTime()
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `${dias} días`
  
  return date.toLocaleDateString()
}

// Cerrar menú al hacer click fuera
const handleClickOutside = (event: Event) => {
  if (menuAbierto.value) {
    menuAbierto.value = null
  }
}

// Lifecycle
onMounted(async () => {
  await refreshData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
