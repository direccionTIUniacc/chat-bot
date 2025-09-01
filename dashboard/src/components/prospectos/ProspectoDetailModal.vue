<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Overlay -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')"></div>
    
    <!-- Modal -->
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div>
            <h2 class="text-xl font-bold">📋 Detalle del Prospecto</h2>
            <p class="text-blue-100">Progressive Capture System</p>
          </div>
          <button 
            @click="$emit('close')"
            class="text-white hover:text-gray-200 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div class="p-6 space-y-6">
            <!-- Información Básica -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <User class="w-5 h-5 mr-2" />
                Información Básica
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Nombre</label>
                  <p class="mt-1 text-sm text-gray-900">{{ prospecto?.nombre || 'No especificado' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">WhatsApp</label>
                  <p class="mt-1 text-sm text-gray-900">{{ prospecto?.whatsapp || 'No especificado' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Email</label>
                  <p class="mt-1 text-sm text-gray-900">{{ prospecto?.email || 'No especificado' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Teléfono</label>
                  <p class="mt-1 text-sm text-gray-900">{{ prospecto?.telefono || 'No especificado' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Edad</label>
                  <p class="mt-1 text-sm text-gray-900">{{ prospecto?.edad || 'No especificado' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Región</label>
                  <p class="mt-1 text-sm text-gray-900">{{ prospecto?.region || 'No especificado' }}</p>
                </div>
              </div>
            </div>

            <!-- Estado Progressive Capture -->
            <div class="bg-blue-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <Target class="w-5 h-5 mr-2" />
                Estado Progressive Capture
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tipo de Consulta</label>
                  <span 
                    class="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getTipoConsultaColor(prospecto?.tipo_consulta_actual)"
                  >
                    {{ formatTipoConsulta(prospecto?.tipo_consulta_actual || 'Sin especificar') }}
                  </span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Estado</label>
                  <span 
                    class="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getEstadoColor(prospecto?.estado)"
                  >
                    {{ formatStatus(prospecto?.estado || 'nuevo') }}
                  </span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Nivel de Interés</label>
                  <span 
                    class="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getNivelInteresColor(prospecto?.nivel_interes)"
                  >
                    {{ formatNivelInteres(prospecto?.nivel_interes || 'medio') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Métricas de Sesiones -->
            <div class="bg-green-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 class="w-5 h-5 mr-2" />
                Métricas de Sesiones
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">{{ prospecto?.total_sesiones || 1 }}</div>
                  <div class="text-sm text-gray-600">Total Sesiones</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{{ prospecto?.perfil_usuario || 'N/A' }}</div>
                  <div class="text-sm text-gray-600">Perfil Usuario</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold" :class="prospecto?.es_prioritario ? 'text-red-600' : 'text-gray-600'">
                    {{ prospecto?.es_prioritario ? 'SÍ' : 'NO' }}
                  </div>
                  <div class="text-sm text-gray-600">Prioritario</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">
                    {{ formatTimeAgo(prospecto?.primera_interaccion) }}
                  </div>
                  <div class="text-sm text-gray-600">Primera Interacción</div>
                </div>
              </div>
            </div>

            <!-- Campos Capturados -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle class="w-5 h-5 mr-2" />
                Progreso de Captura
              </h3>
              <div class="space-y-3">
                <div v-for="campo in camposCapturados" :key="campo.nombre" class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div 
                      class="w-4 h-4 rounded-full flex items-center justify-center"
                      :class="campo.capturado ? 'bg-green-500' : 'bg-gray-300'"
                    >
                      <Check v-if="campo.capturado" class="w-3 h-3 text-white" />
                      <X v-else class="w-3 h-3 text-gray-500" />
                    </div>
                    <span class="font-medium">{{ campo.nombre }}</span>
                  </div>
                  <div class="text-sm text-gray-600">
                    {{ campo.capturado ? campo.valor : 'No capturado' }}
                  </div>
                </div>
              </div>
              
              <!-- Barra de progreso -->
              <div class="mt-4">
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progreso de captura</span>
                  <span>{{ progresoCaptura }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-green-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: progresoCaptura + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Carrera e Intereses -->
            <div class="bg-yellow-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <GraduationCap class="w-5 h-5 mr-2" />
                Intereses Académicos
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Carrera de Interés</label>
                  <p class="mt-1 text-sm text-gray-900">{{ prospecto?.carrera_interes || 'Sin especificar' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Facultad de Interés</label>
                  <p class="mt-1 text-sm text-gray-900">{{ prospecto?.facultad_interes || 'Sin especificar' }}</p>
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div class="bg-purple-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <Clock class="w-5 h-5 mr-2" />
                Timeline de Actividad
              </h3>
              <div class="space-y-3">
                <div class="flex items-center space-x-3 p-3 bg-white rounded border-l-4 border-blue-500">
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div class="flex-1">
                    <div class="text-sm font-medium">Primera Interacción</div>
                    <div class="text-xs text-gray-500">{{ formatDateTime(prospecto?.primera_interaccion) }}</div>
                  </div>
                </div>
                
                <div class="flex items-center space-x-3 p-3 bg-white rounded border-l-4 border-green-500">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div class="flex-1">
                    <div class="text-sm font-medium">Última Actividad</div>
                    <div class="text-xs text-gray-500">{{ formatDateTime(prospecto?.ultima_interaccion) }}</div>
                  </div>
                </div>
                
                <div v-if="prospecto?.updated_at" class="flex items-center space-x-3 p-3 bg-white rounded border-l-4 border-purple-500">
                  <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div class="flex-1">
                    <div class="text-sm font-medium">Última Actualización</div>
                    <div class="text-xs text-gray-500">{{ formatDateTime(prospecto?.updated_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer con acciones -->
        <div class="border-t bg-gray-50 px-6 py-4">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-500">
              Última actualización: {{ formatTimeAgo(prospecto?.updated_at || prospecto?.ultima_interaccion) }}
            </div>
            <div class="flex space-x-3">
              <button
                v-if="puedeReactivar"
                @click="$emit('reactivar', prospecto)"
                class="btn-secondary text-sm"
              >
                🔄 Reactivar Captura
              </button>
              <button
                @click="$emit('close')"
                class="btn-primary text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  X, 
  User, 
  Target, 
  BarChart3, 
  CheckCircle, 
  Check, 
  GraduationCap, 
  Clock 
} from 'lucide-vue-next'
import { formatDateTime, formatTimeAgo, formatTipoConsulta, formatStatus } from '@/utils/formatters'

// Props
interface Props {
  show: boolean
  prospecto: any
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  close: []
  reactivar: [prospecto: any]
}>()

// Computed
const camposCapturados = computed(() => [
  { nombre: 'Nombre', capturado: !!props.prospecto?.nombre, valor: props.prospecto?.nombre },
  { nombre: 'Email', capturado: !!props.prospecto?.email, valor: props.prospecto?.email },
  { nombre: 'Teléfono', capturado: !!props.prospecto?.telefono, valor: props.prospecto?.telefono },
  { nombre: 'Edad', capturado: !!props.prospecto?.edad, valor: props.prospecto?.edad?.toString() },
  { nombre: 'Región', capturado: !!props.prospecto?.region, valor: props.prospecto?.region },
])

const progresoCaptura = computed(() => {
  const total = camposCapturados.value.length
  const capturados = camposCapturados.value.filter(c => c.capturado).length
  return Math.round((capturados / total) * 100)
})

const puedeReactivar = computed(() => {
  return props.prospecto?.tipo_consulta_actual?.includes('abandono') || 
         props.prospecto?.tipo_consulta_actual === 'timeout_session'
})

// Funciones de colores
const getTipoConsultaColor = (tipo?: string): string => {
  if (!tipo) return 'bg-gray-100 text-gray-800'
  if (tipo.includes('captura completa')) return 'bg-green-100 text-green-800'
  if (tipo.includes('captura en proceso')) return 'bg-blue-100 text-blue-800'
  if (tipo.includes('abandono')) return 'bg-red-100 text-red-800'
  if (tipo === 'timeout_session') return 'bg-gray-100 text-gray-800'
  return 'bg-purple-100 text-purple-800'
}

const getEstadoColor = (estado?: string): string => {
  const colors = {
    'nuevo': 'bg-blue-100 text-blue-800',
    'recurrente': 'bg-green-100 text-green-800',
    'frecuente': 'bg-purple-100 text-purple-800',
    'contactado': 'bg-yellow-100 text-yellow-800',
    'interesado': 'bg-orange-100 text-orange-800',
    'matriculado': 'bg-emerald-100 text-emerald-800',
    'descartado': 'bg-red-100 text-red-800'
  }
  return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getNivelInteresColor = (nivel?: string): string => {
  const colors = {
    'bajo': 'bg-gray-100 text-gray-800',
    'medio': 'bg-blue-100 text-blue-800',
    'alto': 'bg-orange-100 text-orange-800',
    'muy_alto': 'bg-red-100 text-red-800',
    'urgente': 'bg-red-200 text-red-900'
  }
  return colors[nivel as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const formatNivelInteres = (nivel: string): string => {
  const labels = {
    'bajo': 'Bajo',
    'medio': 'Medio', 
    'alto': 'Alto',
    'muy_alto': 'Muy Alto',
    'urgente': '🚨 Urgente'
  }
  return labels[nivel as keyof typeof labels] || nivel
}
</script>
