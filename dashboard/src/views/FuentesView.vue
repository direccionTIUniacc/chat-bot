<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Fuentes de Leads</h1>
        <p class="text-gray-600">Gestiona y optimiza todos tus canales de captación de prospectos</p>
      </div>
      
      <div class="flex space-x-3">
        <button
          @click="openAnalyticsModal"
          class="btn-secondary"
        >
          <BarChart3 class="w-4 h-4 mr-2" />
          Analytics
        </button>
        <button
          @click="openCreateModal"
          class="btn-primary"
        >
          <Plus class="w-4 h-4 mr-2" />
          Nueva Fuente
        </button>
      </div>
    </div>

    <!-- Métricas generales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <MetricCard
        title="Total Fuentes"
        :value="fuentesLeads.estadisticasGenerales.value.total_fuentes"
        :icon="Globe"
        icon-background-class="bg-blue-500"
      />
      
      <MetricCard
        title="Fuentes Activas"
        :value="fuentesLeads.estadisticasGenerales.value.fuentes_activas"
        :icon="CheckCircle"
        icon-background-class="bg-green-500"
      />
      
      <MetricCard
        title="Leads Hoy"
        :value="fuentesLeads.estadisticasGenerales.value.total_leads_hoy"
        :icon="TrendingUp"
        icon-background-class="bg-orange-500"
      />
      
      <MetricCard
        title="Total Leads"
        :value="fuentesLeads.estadisticasGenerales.value.total_leads"
        :icon="Users"
        icon-background-class="bg-purple-500"
      />
      
      <MetricCard
        title="Conversión Promedio"
        :value="fuentesLeads.estadisticasGenerales.value.tasa_conversion_promedio"
        :icon="Target"
        icon-background-class="bg-indigo-500"
        format="percentage"
        :decimals="1"
      />
    </div>

    <!-- Mejor fuente destacada -->
    <div v-if="fuentesLeads.mejorFuente.value" class="card p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="text-4xl">
            {{ fuentesLeads.getIconoFuente(fuentesLeads.mejorFuente.value.tipo) }}
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">🏆 Mejor Fuente del Mes</h3>
            <p class="text-2xl font-bold text-green-600">{{ fuentesLeads.mejorFuente.value.nombre }}</p>
            <p class="text-sm text-gray-600">
              {{ fuentesLeads.mejorFuente.value.tasa_conversion.toFixed(1) }}% de conversión • 
              {{ fuentesLeads.mejorFuente.value.total_leads }} leads totales
            </p>
          </div>
        </div>
        
        <div class="text-right">
          <p class="text-3xl font-bold text-green-600">{{ fuentesLeads.mejorFuente.value.leads_hoy }}</p>
          <p class="text-sm text-gray-600">leads hoy</p>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card p-4">
      <div class="flex flex-wrap items-center gap-4">
        <select
          v-model="filtroTipo"
          class="input-field"
        >
          <option value="">Todos los tipos</option>
          <option value="whatsapp_bot">WhatsApp Bot</option>
          <option value="formulario_web">Formulario Web</option>
          <option value="landing_page">Landing Page</option>
          <option value="facebook_ads">Facebook Ads</option>
          <option value="google_ads">Google Ads</option>
          <option value="referido">Referidos</option>
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
          placeholder="Buscar fuente..."
          class="input-field"
        />
        
        <select
          v-model="ordenPor"
          class="input-field"
        >
          <option value="leads_hoy">Leads hoy</option>
          <option value="total_leads">Total leads</option>
          <option value="tasa_conversion">Tasa conversión</option>
          <option value="nombre">Nombre</option>
          <option value="created_at">Fecha creación</option>
        </select>
        
        <button
          @click="refreshData"
          class="btn-secondary"
          :disabled="fuentesLeads.loading.value"
        >
          <RotateCcw :class="{ 'animate-spin': fuentesLeads.loading.value }" class="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- Grid de fuentes -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="fuente in fuentesFiltradas"
        :key="fuente.id"
        class="card hover:shadow-lg transition-all duration-200 overflow-hidden"
      >
        <!-- Header de la card -->
        <div class="p-6 pb-4">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="text-3xl">
                {{ fuentesLeads.getIconoFuente(fuente.tipo) }}
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">{{ fuente.nombre }}</h3>
                <div class="flex items-center space-x-2 mt-1">
                  <span :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    fuentesLeads.getColorFuente(fuente.tipo)
                  ]">
                    {{ getTipoLabel(fuente.tipo) }}
                  </span>
                  <span :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    fuente.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  ]">
                    {{ fuente.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Menú de acciones -->
            <div class="relative">
              <button
                @click="toggleMenu(fuente.id)"
                class="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreVertical class="w-5 h-5" />
              </button>
              
              <div
                v-if="menuAbierto === fuente.id"
                class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
              >
                <div class="py-1">
                  <button
                    @click="editarFuente(fuente)"
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit class="w-4 h-4 mr-2" />
                    Editar
                  </button>
                  <button
                    @click="verAnalytics(fuente.id)"
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <BarChart3 class="w-4 h-4 mr-2" />
                    Ver Analytics
                  </button>
                  <button
                    @click="generarCodigo(fuente)"
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Code class="w-4 h-4 mr-2" />
                    Código Embed
                  </button>
                  <hr class="my-1" />
                  <button
                    @click="fuentesLeads.toggleFuente(fuente.id)"
                    :class="[
                      'flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50',
                      fuente.activa ? 'text-red-600' : 'text-green-600'
                    ]"
                  >
                    <Power class="w-4 h-4 mr-2" />
                    {{ fuente.activa ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- URL si está disponible -->
          <div v-if="fuente.url" class="mb-4">
            <a
              :href="fuente.url"
              target="_blank"
              class="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <ExternalLink class="w-3 h-3 mr-1" />
              {{ truncateUrl(fuente.url) }}
            </a>
          </div>

          <!-- UTM Parameters -->
          <div v-if="fuente.utm_source || fuente.utm_medium || fuente.utm_campaign" class="mb-4">
            <div class="text-xs text-gray-500 mb-1">Parámetros UTM:</div>
            <div class="flex flex-wrap gap-1">
              <span v-if="fuente.utm_source" class="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                Source: {{ fuente.utm_source }}
              </span>
              <span v-if="fuente.utm_medium" class="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                Medium: {{ fuente.utm_medium }}
              </span>
              <span v-if="fuente.utm_campaign" class="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                Campaign: {{ fuente.utm_campaign }}
              </span>
            </div>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="px-6 pb-4">
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">{{ fuente.leads_hoy }}</p>
              <p class="text-xs text-gray-500">Hoy</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-purple-600">{{ fuente.total_leads }}</p>
              <p class="text-xs text-gray-500">Total</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">{{ fuente.tasa_conversion.toFixed(1) }}%</p>
              <p class="text-xs text-gray-500">Conversión</p>
            </div>
          </div>

          <!-- Costo por lead si está disponible -->
          <div v-if="fuente.costo_por_lead" class="text-center mb-4">
            <p class="text-lg font-semibold text-orange-600">${{ fuente.costo_por_lead.toFixed(2) }}</p>
            <p class="text-xs text-gray-500">Costo por lead</p>
          </div>

          <!-- Progress bar de rendimiento -->
          <div class="mb-4">
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span>Rendimiento</span>
              <span>{{ getRendimientoTexto(fuente.tasa_conversion) }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                :class="[
                  'h-2 rounded-full transition-all',
                  getRendimientoColor(fuente.tasa_conversion)
                ]"
                :style="{ width: `${Math.min(fuente.tasa_conversion * 2, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Footer con acciones -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div class="flex space-x-2">
            <button
              @click="verDetalles(fuente)"
              class="flex-1 text-sm bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded hover:bg-gray-50 transition-colors"
            >
              Ver Detalles
            </button>
            
            <button
              v-if="['formulario_web', 'landing_page'].includes(fuente.tipo)"
              @click="generarCodigo(fuente)"
              class="flex-1 text-sm bg-blue-100 text-blue-700 py-2 px-3 rounded hover:bg-blue-200 transition-colors"
            >
              <Code class="w-3 h-3 mr-1 inline" />
              Embed
            </button>
            
            <button
              @click="fuentesLeads.toggleFuente(fuente.id)"
              :class="[
                'flex-1 text-sm py-2 px-3 rounded transition-colors',
                fuente.activa
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              ]"
            >
              {{ fuente.activa ? 'Pausar' : 'Activar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-if="fuentesFiltradas.length === 0" class="text-center py-12">
      <Globe class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No hay fuentes de leads</h3>
      <p class="text-gray-500 mb-4">
        {{ fuentesLeads.fuentes.value.length === 0 ? 'Crea tu primera fuente para empezar a captar leads' : 'No se encontraron fuentes con los filtros aplicados' }}
      </p>
      <button
        v-if="fuentesLeads.fuentes.value.length === 0"
        @click="openCreateModal"
        class="btn-primary"
      >
        Crear Primera Fuente
      </button>
    </div>

    <!-- Modal de crear/editar fuente -->
    <FuenteModal
      v-if="showCreateModal"
      :fuente="fuenteEnEdicion"
      @close="closeCreateModal"
      @save="guardarFuente"
    />

    <!-- Modal de código embed -->
    <CodigoEmbedModal
      v-if="showCodigoModal"
      :fuente="fuenteParaCodigo"
      @close="closeCodigoModal"
    />

    <!-- Modal de analytics -->
    <AnalyticsModal
      v-if="showAnalyticsModal"
      :fuente-id="fuenteParaAnalytics"
      @close="closeAnalyticsModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Plus, 
  Globe, 
  CheckCircle,
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  RotateCcw,
  MoreVertical,
  Edit,
  Code,
  Power,
  ExternalLink
} from 'lucide-vue-next'
import { useFuentesLeads } from '@/composables/useFuentesLeads'
import type { FuenteLead } from '@/composables/useFuentesLeads'
import MetricCard from '@/components/common/MetricCard.vue'
import FuenteModal from '@/components/fuentes/FuenteModal.vue'
import CodigoEmbedModal from '@/components/fuentes/CodigoEmbedModal.vue'
import AnalyticsModal from '@/components/fuentes/AnalyticsModal.vue'

// Composables
const fuentesLeads = useFuentesLeads()

// Estado local
const searchTerm = ref('')
const filtroTipo = ref('')
const filtroEstado = ref('')
const ordenPor = ref('leads_hoy')
const menuAbierto = ref<string | null>(null)
const showCreateModal = ref(false)
const showCodigoModal = ref(false)
const showAnalyticsModal = ref(false)
const fuenteEnEdicion = ref<FuenteLead | null>(null)
const fuenteParaCodigo = ref<FuenteLead | null>(null)
const fuenteParaAnalytics = ref<string | null>(null)

// Computed
const fuentesFiltradas = computed(() => {
  let filtered = fuentesLeads.fuentes.value

  // Filtro por búsqueda
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(f =>
      f.nombre.toLowerCase().includes(search) ||
      f.tipo.toLowerCase().includes(search) ||
      f.utm_campaign?.toLowerCase().includes(search)
    )
  }

  // Filtro por tipo
  if (filtroTipo.value) {
    filtered = filtered.filter(f => f.tipo === filtroTipo.value)
  }

  // Filtro por estado
  if (filtroEstado.value) {
    filtered = filtered.filter(f => 
      filtroEstado.value === 'activa' ? f.activa : !f.activa
    )
  }

  // Ordenamiento
  filtered.sort((a, b) => {
    switch (ordenPor.value) {
      case 'leads_hoy':
        return b.leads_hoy - a.leads_hoy
      case 'total_leads':
        return b.total_leads - a.total_leads
      case 'tasa_conversion':
        return b.tasa_conversion - a.tasa_conversion
      case 'nombre':
        return a.nombre.localeCompare(b.nombre)
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  return filtered
})

// Métodos
const refreshData = async () => {
  await fuentesLeads.inicializar()
}

const toggleMenu = (id: string) => {
  menuAbierto.value = menuAbierto.value === id ? null : id
}

const openCreateModal = () => {
  fuenteEnEdicion.value = null
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  fuenteEnEdicion.value = null
}

const openAnalyticsModal = (fuenteId?: string) => {
  fuenteParaAnalytics.value = fuenteId || null
  showAnalyticsModal.value = true
}

const closeAnalyticsModal = () => {
  showAnalyticsModal.value = false
  fuenteParaAnalytics.value = null
}

const editarFuente = (fuente: FuenteLead) => {
  fuenteEnEdicion.value = fuente
  showCreateModal.value = true
  menuAbierto.value = null
}

const verAnalytics = (fuenteId: string) => {
  openAnalyticsModal(fuenteId)
  menuAbierto.value = null
}

const generarCodigo = (fuente: FuenteLead) => {
  fuenteParaCodigo.value = fuente
  showCodigoModal.value = true
  menuAbierto.value = null
}

const closeCodigoModal = () => {
  showCodigoModal.value = false
  fuenteParaCodigo.value = null
}

const guardarFuente = async (data: any) => {
  if (fuenteEnEdicion.value) {
    await fuentesLeads.updateFuente(fuenteEnEdicion.value.id, data)
  } else {
    await fuentesLeads.createFuente(data)
  }
  closeCreateModal()
}

const verDetalles = (fuente: FuenteLead) => {
  // Implementar navegación a vista de detalles o modal
  console.log('Ver detalles de:', fuente.nombre)
}

// Utilidades
const getTipoLabel = (tipo: FuenteLead['tipo']): string => {
  const labels = {
    'whatsapp_bot': 'WhatsApp Bot',
    'formulario_web': 'Formulario Web',
    'landing_page': 'Landing Page',
    'facebook_ads': 'Facebook Ads',
    'google_ads': 'Google Ads',
    'referido': 'Referido'
  }
  return labels[tipo] || tipo
}

const truncateUrl = (url: string): string => {
  return url.length > 40 ? url.substring(0, 40) + '...' : url
}

const getRendimientoTexto = (tasa: number): string => {
  if (tasa >= 30) return 'Excelente'
  if (tasa >= 20) return 'Bueno'
  if (tasa >= 10) return 'Regular'
  return 'Bajo'
}

const getRendimientoColor = (tasa: number): string => {
  if (tasa >= 30) return 'bg-green-500'
  if (tasa >= 20) return 'bg-yellow-500'
  if (tasa >= 10) return 'bg-orange-500'
  return 'bg-red-500'
}

// Cerrar menú al hacer click fuera
const handleClickOutside = () => {
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
