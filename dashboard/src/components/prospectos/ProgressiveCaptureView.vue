<template>
  <div class="space-y-6">
    <!-- Header con estadísticas -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-2">📋 Progressive Capture System</h1>
          <p class="text-blue-100">Análisis granular de captura de prospectos - Zero Data Loss</p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold">{{ stats.totalRegistros || 0 }}</div>
          <div class="text-sm text-blue-100">Total Registros</div>
        </div>
      </div>
    </div>

    <!-- Métricas de Progressive Capture -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="✅ Completas"
        :value="stats.capturaCompleta || 0"
        :color="'green'"
        :percentage="getPercentage(stats.capturaCompleta, stats.totalRegistros)"
        icon="CheckCircle"
      />
      <MetricCard
        title="🔄 En Proceso"
        :value="stats.capturaEnProceso || 0"
        :color="'blue'"
        :percentage="getPercentage(stats.capturaEnProceso, stats.totalRegistros)"
        icon="Clock"
      />
      <MetricCard
        title="⚠️ Abandonos"
        :value="stats.totalAbandonos || 0"
        :color="'orange'"
        :percentage="getPercentage(stats.totalAbandonos, stats.totalRegistros)"
        icon="AlertTriangle"
      />
      <MetricCard
        title="⏰ Timeouts"
        :value="stats.timeoutSessions || 0"
        :color="'gray'"
        :percentage="getPercentage(stats.timeoutSessions, stats.totalRegistros)"
        icon="Timer"
      />
    </div>

    <!-- Gráfico de Funnel de Abandono -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold mb-4">🔍 Funnel de Abandono - Progressive Capture</h3>
      <div class="space-y-3">
        <div
          v-for="(stage, index) in funnelStages"
          :key="stage.key"
          class="flex items-center justify-between p-3 rounded border-l-4"
          :class="stage.color"
        >
          <div class="flex items-center space-x-3">
            <div class="text-2xl">{{ stage.icon }}</div>
            <div>
              <div class="font-medium">{{ stage.label }}</div>
              <div class="text-sm text-gray-600">{{ stage.description }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold">{{ stage.count || 0 }}</div>
            <div class="text-sm text-gray-500">
              {{ getPercentage(stage.count, stats.totalRegistros) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y búsqueda -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex flex-wrap items-center gap-4 mb-6">
        <div class="flex-1 min-w-64">
          <input
            v-model="filtros.busqueda"
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            class="input-field w-full"
          />
        </div>
        
        <select v-model="filtros.tipoConsulta" class="input-field">
          <option value="">Todos los tipos</option>
          <option value="captura completa">✅ Captura Completa</option>
          <option value="captura en proceso">🔄 En Proceso</option>
          <option value="abandono solo nombre">⚠️ Solo Nombre</option>
          <option value="abandono con email">⚠️ Con Email</option>
          <option value="abandono con telefono">⚠️ Con Teléfono</option>
          <option value="abandono con edad">⚠️ Con Edad</option>
          <option value="abandono con region">⚠️ Con Región</option>
          <option value="abandono incompleto">❌ Incompleto</option>
          <option value="timeout_session">⏰ Timeout</option>
        </select>

        <select v-model="filtros.ultimasSemanas" class="input-field">
          <option value="1">Última semana</option>
          <option value="2">Últimas 2 semanas</option>
          <option value="4">Último mes</option>
          <option value="12">Últimos 3 meses</option>
          <option value="">Todo el tiempo</option>
        </select>

        <button
          @click="limpiarFiltros"
          class="btn-secondary text-sm"
        >
          Limpiar Filtros
        </button>
      </div>

      <!-- Tabla de resultados -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prospecto
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado Progressive
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campos Capturados
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Actividad
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="prospecto in prospectosFiltrados"
              :key="prospecto.whatsapp || prospecto.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ prospecto.nombre || 'Sin nombre' }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ prospecto.email || 'Sin email' }}
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ prospecto.whatsapp }}
                    </div>
                  </div>
                </div>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getTipoConsultaColor(prospecto.tipo_consulta_actual)"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ formatTipoConsulta(prospecto.tipo_consulta_actual || '') }}
                </span>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex space-x-1">
                  <span
                    v-for="campo in getCamposCapturados(prospecto)"
                    :key="campo.nombre"
                    :class="campo.capturado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'"
                    class="px-2 py-1 text-xs rounded-full"
                    :title="campo.valor || 'No capturado'"
                  >
                    {{ campo.nombre }}
                  </span>
                </div>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDateTime(prospecto.ultima_interaccion || prospecto.updated_at || new Date()) }}
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex space-x-2">
                  <button
                    @click="verDetalle(prospecto)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    Ver
                  </button>
                  <button
                    v-if="puedeReactivar(prospecto)"
                    @click="reactivarCaptura(prospecto)"
                    class="text-green-600 hover:text-green-900"
                  >
                    Reactivar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Estado vacío -->
        <div v-if="prospectosFiltrados.length === 0" class="text-center py-12">
          <FileText class="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay resultados</h3>
          <p class="text-gray-500">Ajusta los filtros para ver más prospectos</p>
        </div>
      </div>
    </div>

    <!-- Modal de detalle -->
    <ProspectoDetailModal
      :show="showDetailModal"
      :prospecto="selectedProspecto"
      @close="cerrarModal"
      @reactivar="reactivarCaptura"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Timer,
  FileText
} from 'lucide-vue-next'
import MetricCard from '@/components/common/MetricCard.vue'
import ProspectoDetailModal from '@/components/prospectos/ProspectoDetailModal.vue'
import { useProspectos } from '@/composables/useProspectos'
import { formatDateTime, formatTipoConsulta } from '@/utils/formatters'
import type { Prospecto } from '@/types'

// Tipo específico para la vista del dashboard
interface ProspectoActual extends Partial<Prospecto> {
  whatsapp?: string
  tipo_consulta_actual?: string
  primera_interaccion?: string
  ultima_interaccion?: string
  total_sesiones?: number
  perfil_usuario?: string
  es_prioritario?: boolean
  edad?: number
}

// Composables
const prospectos = useProspectos()

// Estado local
const filtros = ref({
  busqueda: '',
  tipoConsulta: '',
  ultimasSemanas: '4'
})

// Estado del modal
const showDetailModal = ref(false)
const selectedProspecto = ref<ProspectoActual | null>(null)

// Computed
const prospectosFiltrados = computed(() => {
  // 🔧 TEMPORAL: Mostrar todos los prospectos hasta que tengamos datos de Progressive Capture
  let filtered = (prospectos.prospectos.value as ProspectoActual[])
  
  // Si hay datos de Progressive Capture, filtrar por ellos
  if (filtered.some(p => p.tipo_consulta_actual && (
    p.tipo_consulta_actual.includes('captura') || 
    p.tipo_consulta_actual.includes('abandono') ||
    p.tipo_consulta_actual === 'timeout_session'
  ))) {
    filtered = filtered.filter(p => 
      p.tipo_consulta_actual && (
        p.tipo_consulta_actual.includes('captura') || 
        p.tipo_consulta_actual.includes('abandono') ||
        p.tipo_consulta_actual === 'timeout_session'
      )
    )
  }

  if (filtros.value.busqueda) {
    const search = filtros.value.busqueda.toLowerCase()
    filtered = filtered.filter(p => 
      p.nombre?.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search) ||
      p.whatsapp?.includes(search)
    )
  }

  if (filtros.value.tipoConsulta) {
    filtered = filtered.filter(p => p.tipo_consulta_actual === filtros.value.tipoConsulta)
  }

  if (filtros.value.ultimasSemanas) {
    const weeks = parseInt(filtros.value.ultimasSemanas)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - (weeks * 7))
    filtered = filtered.filter(p => new Date(p.primera_interaccion || p.created_at || new Date()) >= cutoff)
  }

  return filtered.sort((a, b) => 
    new Date(b.ultima_interaccion || b.updated_at || new Date()).getTime() - new Date(a.ultima_interaccion || a.updated_at || new Date()).getTime()
  )
})

const stats = computed(() => {
  const all = prospectosFiltrados.value
  return {
    totalRegistros: all.length,
    capturaCompleta: all.filter(p => p.tipo_consulta_actual === 'captura completa').length,
    capturaEnProceso: all.filter(p => p.tipo_consulta_actual === 'captura en proceso').length,
    totalAbandonos: all.filter(p => p.tipo_consulta_actual?.includes('abandono')).length,
    timeoutSessions: all.filter(p => p.tipo_consulta_actual === 'timeout_session').length,
    soloNombre: all.filter(p => p.tipo_consulta_actual === 'abandono solo nombre').length,
    conEmail: all.filter(p => p.tipo_consulta_actual === 'abandono con email').length,
    conTelefono: all.filter(p => p.tipo_consulta_actual === 'abandono con telefono').length,
    conEdad: all.filter(p => p.tipo_consulta_actual === 'abandono con edad').length,
    conRegion: all.filter(p => p.tipo_consulta_actual === 'abandono con region').length,
    incompleto: all.filter(p => p.tipo_consulta_actual === 'abandono incompleto').length
  }
})

const funnelStages = computed(() => [
  {
    key: 'iniciaron',
    label: 'Iniciaron Captura',
    description: 'Usuarios que comenzaron el proceso',
    icon: '🚀',
    count: stats.value.totalRegistros,
    color: 'border-blue-500 bg-blue-50'
  },
  {
    key: 'solo_nombre',
    label: 'Solo Nombre',
    description: 'Abandonaron después del nombre',
    icon: '👤',
    count: stats.value.soloNombre,
    color: 'border-red-500 bg-red-50'
  },
  {
    key: 'con_email',
    label: 'Con Email',
    description: 'Abandonaron después del email',
    icon: '📧',
    count: stats.value.conEmail,
    color: 'border-orange-500 bg-orange-50'
  },
  {
    key: 'con_telefono',
    label: 'Con Teléfono',
    description: 'Abandonaron después del teléfono',
    icon: '📱',
    count: stats.value.conTelefono,
    color: 'border-yellow-500 bg-yellow-50'
  },
  {
    key: 'con_edad',
    label: 'Con Edad',
    description: 'Abandonaron después de la edad',
    icon: '🎂',
    count: stats.value.conEdad,
    color: 'border-amber-500 bg-amber-50'
  },
  {
    key: 'completa',
    label: 'Captura Completa',
    description: 'Completaron todo el proceso',
    icon: '✅',
    count: stats.value.capturaCompleta,
    color: 'border-green-500 bg-green-50'
  }
])

// Métodos
const getPercentage = (value: number, total: number): string => {
  if (!total) return '0'
  return ((value / total) * 100).toFixed(1)
}

const getTipoConsultaColor = (tipo?: string): string => {
  if (!tipo) return 'bg-gray-100 text-gray-800'
  
  // Colores específicos para Progressive Capture
  if (tipo.includes('captura completa')) return 'bg-green-100 text-green-800'
  if (tipo.includes('captura en proceso')) return 'bg-blue-100 text-blue-800'
  if (tipo.includes('abandono')) return 'bg-red-100 text-red-800'
  if (tipo === 'timeout_session') return 'bg-gray-100 text-gray-800'
  
  // Color por defecto
  return 'bg-purple-100 text-purple-800'
}

const getCamposCapturados = (prospecto: ProspectoActual) => {
  const campos = [
    { nombre: 'Nombre', capturado: !!prospecto.nombre, valor: prospecto.nombre },
    { nombre: 'Email', capturado: !!prospecto.email, valor: prospecto.email },
    { nombre: 'Teléfono', capturado: !!prospecto.telefono, valor: prospecto.telefono },
    { nombre: 'Edad', capturado: !!prospecto.edad, valor: prospecto.edad?.toString() },
    { nombre: 'Región', capturado: !!prospecto.region, valor: prospecto.region }
  ]
  return campos
}

const puedeReactivar = (prospecto: any): boolean => {
  return prospecto.tipo_consulta_actual?.includes('abandono') || 
         prospecto.tipo_consulta_actual === 'timeout_session'
}

const verDetalle = (prospecto: ProspectoActual) => {
  selectedProspecto.value = prospecto
  showDetailModal.value = true
}

const prospectoActualizado = async (prospectoActualizado: any) => {
  console.log('✅ Prospecto actualizado en Progressive Capture:', prospectoActualizado.nombre)
  
  try {
    // Recargar los datos del Progressive Capture
    await cargarProspectosProgressiveCapture()
    
    // Actualizar el prospecto seleccionado con los nuevos datos
    selectedProspecto.value = prospectoActualizado
    
    console.log('🔄 Progressive Capture actualizado')
  } catch (error) {
    console.error('❌ Error recargando Progressive Capture:', error)
  }
}

const reactivarCaptura = (prospecto: ProspectoActual) => {
  // Implementar reactivación de captura
  console.log('Reactivar captura:', prospecto)
  // TODO: Implementar lógica para reactivar captura
  // Posiblemente enviar una notificación al chatbot
  showDetailModal.value = false
}

const cerrarModal = () => {
  showDetailModal.value = false
  selectedProspecto.value = null
}

const limpiarFiltros = () => {
  filtros.value = {
    busqueda: '',
    tipoConsulta: '',
    ultimasSemanas: '4'
  }
}

// Lifecycle
onMounted(async () => {
  await prospectos.fetchProspectos()
})
</script>
