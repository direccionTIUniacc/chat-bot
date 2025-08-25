<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Métricas</h1>
      <p class="text-gray-600">Análisis detallado del rendimiento del ChatBot</p>
    </div>

    <!-- Filtros de fecha -->
    <div class="card p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <input
            v-model="metrics.dateRange.value.from"
            type="date"
            class="input-field"
            @change="updateMetrics"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Hasta
          </label>
          <input
            v-model="metrics.dateRange.value.to"
            type="date"
            class="input-field"
            @change="updateMetrics"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="setPresetRange"
            class="btn-secondary"
          >
            <Calendar class="w-4 h-4 mr-2" />
            Últimos 30 días
          </button>
        </div>
      </div>
    </div>

    <!-- Métricas principales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Conversaciones"
        :value="metrics.chatbotMetrics.value.total_sessions"
        :icon="MessageCircle"
        icon-background-class="bg-blue-500"
      />
      
      <MetricCard
        title="Tasa de Conversión"
        :value="metrics.chatbotMetrics.value.conversion_rate"
        :icon="TrendingUp"
        icon-background-class="bg-green-500"
        format="percentage"
        :decimals="1"
      />
      
      <MetricCard
        title="Duración Promedio"
        :value="formatDuration(metrics.chatbotMetrics.value.avg_duration)"
        :icon="Clock"
        icon-background-class="bg-purple-500"
      />
      
      <MetricCard
        title="Mensajes por Sesión"
        :value="metrics.chatbotMetrics.value.messages_per_session"
        :icon="Hash"
        icon-background-class="bg-orange-500"
        :decimals="1"
      />
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Conversaciones por día -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Conversaciones por Día
        </h2>
        <div v-if="metrics.loading.value" class="flex justify-center py-8">
          <LoadingSpinner text="Cargando datos..." />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-gray-500">
          <BarChart3 class="w-8 h-8 mr-2" />
          <span>Gráfico de conversaciones</span>
        </div>
      </div>

      <!-- Estados de prospectos -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Distribución de Estados
        </h2>
        <div class="space-y-3">
          <div
            v-for="(item, key) in estadosDistribution"
            :key="key"
            class="flex items-center justify-between"
          >
            <div class="flex items-center">
              <div :class="['w-4 h-4 rounded mr-3', item.color]"></div>
              <span class="text-sm text-gray-900">{{ item.label }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-900">{{ item.count }}</span>
              <div class="w-20 bg-gray-200 rounded-full h-2">
                <div
                  :class="['h-2 rounded-full', item.color]"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
              <span class="text-xs text-gray-500 w-12 text-right">
                {{ item.percentage.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tablas de resumen -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Métricas de chatbot -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Rendimiento del ChatBot
        </h2>
        <dl class="space-y-3">
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Sesiones completadas</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ metrics.chatbotMetrics.value.completed_sessions }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Sesiones activas</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ metrics.chatbotMetrics.value.active_sessions }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Tiempo promedio de respuesta</dt>
            <dd class="text-sm font-medium text-gray-900">2.3s</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Satisfacción del usuario</dt>
            <dd class="text-sm font-medium text-gray-900">4.2/5</dd>
          </div>
        </dl>
      </div>

      <!-- Métricas de prospectos -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Generación de Prospectos
        </h2>
        <dl class="space-y-3">
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Total generados</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ metrics.prospectoMetrics.value.total }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Nuevos hoy</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ metrics.prospectoMetrics.value.nuevos }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Tasa de conversión</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ metrics.prospectoMetrics.value.conversion_rate.toFixed(1) }}%
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Matriculaciones</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ metrics.prospectoMetrics.value.matriculados }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { format, subDays } from 'date-fns'
import { 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  Hash, 
  BarChart3, 
  Calendar 
} from 'lucide-vue-next'
import { useMetricas } from '@/composables/useMetricas'
import { formatDuration } from '@/utils/formatters'
import { PROSPECTO_ESTADOS_LABELS } from '@/utils/constants'
import MetricCard from '@/components/common/MetricCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

// Composables
const metrics = useMetricas()

// Computed
const estadosDistribution = computed(() => {
  const total = metrics.prospectoMetrics.value.total || 1
  
  return {
    nuevo: {
      label: PROSPECTO_ESTADOS_LABELS.nuevo,
      count: metrics.prospectoMetrics.value.nuevos,
      percentage: (metrics.prospectoMetrics.value.nuevos / total) * 100,
      color: 'bg-blue-500'
    },
    contactado: {
      label: PROSPECTO_ESTADOS_LABELS.contactado,
      count: metrics.prospectoMetrics.value.contactados,
      percentage: (metrics.prospectoMetrics.value.contactados / total) * 100,
      color: 'bg-yellow-500'
    },
    interesado: {
      label: PROSPECTO_ESTADOS_LABELS.interesado,
      count: metrics.prospectoMetrics.value.interesados,
      percentage: (metrics.prospectoMetrics.value.interesados / total) * 100,
      color: 'bg-orange-500'
    },
    matriculado: {
      label: PROSPECTO_ESTADOS_LABELS.matriculado,
      count: metrics.prospectoMetrics.value.matriculados,
      percentage: (metrics.prospectoMetrics.value.matriculados / total) * 100,
      color: 'bg-green-500'
    },
    descartado: {
      label: PROSPECTO_ESTADOS_LABELS.descartado,
      count: metrics.prospectoMetrics.value.descartados,
      percentage: (metrics.prospectoMetrics.value.descartados / total) * 100,
      color: 'bg-gray-500'
    }
  }
})

// Métodos
const updateMetrics = () => {
  metrics.loadAllMetrics()
}

const setPresetRange = () => {
  const endDate = new Date()
  const startDate = subDays(endDate, 30)
  
  metrics.updateDateRange(
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd')
  )
  updateMetrics()
}

// Lifecycle
onMounted(() => {
  metrics.loadAllMetrics()
})
</script>
