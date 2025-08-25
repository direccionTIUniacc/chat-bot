<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Analytics de Fuente</h2>
          <p class="text-gray-600">{{ fuenteSeleccionada?.nombre || 'Todas las fuentes' }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Contenido -->
      <div class="overflow-y-auto max-h-[calc(90vh-200px)]">
        <div class="p-6 space-y-8">
          <!-- Filtros de fecha -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <select v-model="periodoSeleccionado" class="input-field">
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="custom">Personalizado</option>
              </select>
              
              <div v-if="periodoSeleccionado === 'custom'" class="flex items-center space-x-2">
                <input
                  v-model="fechaInicio"
                  type="date"
                  class="input-field"
                />
                <span class="text-gray-500">-</span>
                <input
                  v-model="fechaFin"
                  type="date"
                  class="input-field"
                />
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <button
                @click="exportarDatos"
                class="btn-secondary text-sm"
              >
                <Download class="w-4 h-4 mr-1" />
                Exportar
              </button>
              <button
                @click="refreshAnalytics"
                class="btn-secondary text-sm"
                :disabled="loading"
              >
                <RotateCcw :class="{ 'animate-spin': loading }" class="w-4 h-4 mr-1" />
                Actualizar
              </button>
            </div>
          </div>

          <!-- Métricas principales -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="card p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Visitantes</p>
                  <p class="text-3xl font-bold text-gray-900">{{ formatNumber(analytics.visitantes) }}</p>
                  <p class="text-sm text-green-600 mt-1">
                    <TrendingUp class="w-3 h-3 inline mr-1" />
                    +{{ analytics.visitantes_cambio }}%
                  </p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                  <Eye class="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div class="card p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Conversiones</p>
                  <p class="text-3xl font-bold text-gray-900">{{ formatNumber(analytics.conversiones) }}</p>
                  <p class="text-sm text-green-600 mt-1">
                    <TrendingUp class="w-3 h-3 inline mr-1" />
                    +{{ analytics.conversiones_cambio }}%
                  </p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                  <Target class="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div class="card p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                  <p class="text-3xl font-bold text-gray-900">{{ analytics.tasa_conversion.toFixed(1) }}%</p>
                  <p class="text-sm text-green-600 mt-1">
                    <TrendingUp class="w-3 h-3 inline mr-1" />
                    +{{ analytics.tasa_conversion_cambio }}%
                  </p>
                </div>
                <div class="p-3 bg-purple-100 rounded-full">
                  <BarChart3 class="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div class="card p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Costo por Lead</p>
                  <p class="text-3xl font-bold text-gray-900">${{ analytics.costo_por_lead.toFixed(2) }}</p>
                  <p class="text-sm text-red-600 mt-1">
                    <TrendingDown class="w-3 h-3 inline mr-1" />
                    -{{ analytics.costo_cambio }}%
                  </p>
                </div>
                <div class="p-3 bg-orange-100 rounded-full">
                  <DollarSign class="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <!-- Gráfico de conversiones por tiempo -->
          <div class="card p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Conversiones en el Tiempo</h3>
            <div class="h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <BarChart3 class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p class="text-gray-500 mb-2">Gráfico de conversiones por día</p>
                <p class="text-sm text-gray-400">Los datos se cargarían aquí con Chart.js o similar</p>
                <div class="mt-4 flex justify-center space-x-4 text-sm">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span>Visitantes</span>
                  </div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Conversiones</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Embudo de conversión -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="card p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Embudo de Conversión</h3>
              <div class="space-y-4">
                <div v-for="(paso, index) in embudoConversion" :key="index" class="relative">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">{{ paso.nombre }}</span>
                    <span class="text-sm text-gray-600">{{ formatNumber(paso.valor) }}</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                    <div
                      :class="[
                        'h-3 rounded-full transition-all duration-500',
                        getEmbudoColor(index)
                      ]"
                      :style="{ width: `${paso.porcentaje}%` }"
                    ></div>
                    <span class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {{ paso.porcentaje.toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Carreras Solicitadas</h3>
              <div class="space-y-3">
                <div
                  v-for="(carrera, index) in topCarreras"
                  :key="index"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <div :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold',
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    ]">
                      {{ index + 1 }}
                    </div>
                    <span class="font-medium text-gray-900">{{ carrera.nombre }}</span>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-gray-900">{{ carrera.leads }}</p>
                    <p class="text-xs text-gray-500">{{ carrera.porcentaje }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Análisis demográfico -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="card p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Por Región</h3>
              <div class="space-y-3">
                <div
                  v-for="region in topRegiones"
                  :key="region.nombre"
                  class="flex items-center justify-between"
                >
                  <span class="text-sm text-gray-700">{{ region.nombre }}</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-blue-500 h-2 rounded-full"
                        :style="{ width: `${region.porcentaje}%` }"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-900 w-8">{{ region.leads }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Por Edad</h3>
              <div class="space-y-3">
                <div
                  v-for="rango in rangoEdades"
                  :key="rango.rango"
                  class="flex items-center justify-between"
                >
                  <span class="text-sm text-gray-700">{{ rango.rango }}</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-green-500 h-2 rounded-full"
                        :style="{ width: `${rango.porcentaje}%` }"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-900 w-8">{{ rango.leads }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Dispositivos</h3>
              <div class="space-y-3">
                <div
                  v-for="dispositivo in topDispositivos"
                  :key="dispositivo.tipo"
                  class="flex items-center justify-between"
                >
                  <div class="flex items-center space-x-2">
                    <component :is="getDispositivoIcon(dispositivo.tipo)" class="w-4 h-4 text-gray-600" />
                    <span class="text-sm text-gray-700">{{ dispositivo.tipo }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-purple-500 h-2 rounded-full"
                        :style="{ width: `${dispositivo.porcentaje}%` }"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-900 w-8">{{ dispositivo.porcentaje }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recomendaciones -->
          <div class="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Lightbulb class="w-5 h-5 mr-2" />
              Recomendaciones para Optimizar
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="recomendacion in recomendaciones"
                :key="recomendacion.titulo"
                class="bg-white p-4 rounded-lg border border-blue-100"
              >
                <div class="flex items-start space-x-3">
                  <div :class="[
                    'p-2 rounded-full',
                    recomendacion.tipo === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                  ]">
                    <component 
                      :is="recomendacion.tipo === 'warning' ? AlertTriangle : CheckCircle" 
                      :class="[
                        'w-4 h-4',
                        recomendacion.tipo === 'warning' ? 'text-yellow-600' : 'text-green-600'
                      ]"
                    />
                  </div>
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">{{ recomendacion.titulo }}</h4>
                    <p class="text-sm text-gray-600 mt-1">{{ recomendacion.descripcion }}</p>
                    <p class="text-xs text-blue-600 mt-2 font-medium">{{ recomendacion.impacto }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div class="text-sm text-gray-600">
          Datos actualizados: {{ ultimaActualizacion }}
        </div>
        <div class="flex space-x-3">
          <button
            @click="generarReporte"
            class="btn-secondary"
          >
            <FileText class="w-4 h-4 mr-2" />
            Generar Reporte
          </button>
          <button
            @click="$emit('close')"
            class="btn-primary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  X, 
  Download, 
  RotateCcw,
  Eye,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Smartphone,
  Monitor,
  Tablet,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-vue-next'
import { useFuentesLeads } from '@/composables/useFuentesLeads'

interface Props {
  fuenteId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// Composables
const fuentesLeads = useFuentesLeads()

// Estado
const loading = ref(false)
const periodoSeleccionado = ref('30d')
const fechaInicio = ref('')
const fechaFin = ref('')

// Datos mock de analytics
const analytics = ref({
  visitantes: 12547,
  visitantes_cambio: 12.3,
  conversiones: 856,
  conversiones_cambio: 8.7,
  tasa_conversion: 6.8,
  tasa_conversion_cambio: 2.1,
  costo_por_lead: 18.45,
  costo_cambio: 5.2
})

const embudoConversion = ref([
  { nombre: 'Visitantes', valor: 12547, porcentaje: 100 },
  { nombre: 'Interacciones', valor: 4521, porcentaje: 36.0 },
  { nombre: 'Formulario Iniciado', valor: 1287, porcentaje: 10.3 },
  { nombre: 'Formulario Completado', valor: 856, porcentaje: 6.8 },
  { nombre: 'Lead Calificado', valor: 542, porcentaje: 4.3 }
])

const topCarreras = ref([
  { nombre: 'Comunicación Audiovisual', leads: 156, porcentaje: 18.2 },
  { nombre: 'Arquitectura', leads: 134, porcentaje: 15.7 },
  { nombre: 'Ingeniería Comercial', leads: 98, porcentaje: 11.4 },
  { nombre: 'Psicología', leads: 87, porcentaje: 10.2 },
  { nombre: 'Diseño Gráfico', leads: 72, porcentaje: 8.4 }
])

const topRegiones = ref([
  { nombre: 'Metropolitana', leads: 342, porcentaje: 85 },
  { nombre: 'Valparaíso', leads: 67, porcentaje: 60 },
  { nombre: 'Biobío', leads: 45, porcentaje: 45 },
  { nombre: 'La Araucanía', leads: 28, porcentaje: 30 },
  { nombre: 'Antofagasta', leads: 23, porcentaje: 25 }
])

const rangoEdades = ref([
  { rango: '18-22 años', leads: 287, porcentaje: 80 },
  { rango: '23-27 años', leads: 198, porcentaje: 65 },
  { rango: '28-35 años', leads: 156, porcentaje: 50 },
  { rango: '36-45 años', leads: 89, porcentaje: 30 },
  { rango: '45+ años', leads: 34, porcentaje: 15 }
])

const topDispositivos = ref([
  { tipo: 'Móvil', porcentaje: 68 },
  { tipo: 'Desktop', porcentaje: 28 },
  { tipo: 'Tablet', porcentaje: 4 }
])

const recomendaciones = ref([
  {
    titulo: 'Optimizar para móvil',
    descripcion: 'El 68% del tráfico viene de móvil. Mejorar la experiencia puede aumentar conversiones.',
    impacto: 'Impacto potencial: +15% conversiones',
    tipo: 'warning'
  },
  {
    titulo: 'Formulario simplificado',
    descripcion: 'Solo el 28% completa el formulario. Reducir campos puede mejorar la tasa.',
    impacto: 'Impacto potencial: +25% completaciones',
    tipo: 'warning'
  },
  {
    titulo: 'Comunicación Audiovisual popular',
    descripcion: 'Esta carrera genera más leads. Considera crear contenido específico.',
    impacto: 'Impacto potencial: +20% leads cualificados',
    tipo: 'success'
  },
  {
    titulo: 'Horarios peak identificados',
    descripcion: 'Mayor actividad entre 14:00-18:00. Programa campañas en estos horarios.',
    impacto: 'Impacto potencial: -15% costo por lead',
    tipo: 'success'
  }
])

// Computed
const fuenteSeleccionada = computed(() => {
  if (!props.fuenteId) return null
  return fuentesLeads.fuentes.value.find(f => f.id === props.fuenteId)
})

const ultimaActualizacion = computed(() => {
  return new Date().toLocaleString('es-ES')
})

// Métodos
const refreshAnalytics = async () => {
  loading.value = true
  // Simular carga de datos
  await new Promise(resolve => setTimeout(resolve, 1000))
  loading.value = false
}

const exportarDatos = () => {
  // Simular exportación de datos
  console.log('Exportando datos analytics...')
  
  const data = {
    fuente: fuenteSeleccionada.value?.nombre || 'Todas las fuentes',
    periodo: periodoSeleccionado.value,
    analytics: analytics.value,
    embudo: embudoConversion.value,
    carreras: topCarreras.value,
    regiones: topRegiones.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const generarReporte = () => {
  // Simular generación de reporte PDF
  console.log('Generando reporte PDF...')
}

// Utilidades
const formatNumber = (num: number): string => {
  return num.toLocaleString('es-ES')
}

const getEmbudoColor = (index: number): string => {
  const colores = [
    'bg-blue-500',
    'bg-indigo-500', 
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500'
  ]
  return colores[index] || 'bg-gray-500'
}

const getDispositivoIcon = (tipo: string) => {
  switch (tipo) {
    case 'Móvil': return Smartphone
    case 'Desktop': return Monitor
    case 'Tablet': return Tablet
    default: return Monitor
  }
}

// Lifecycle
onMounted(() => {
  refreshAnalytics()
})
</script>
