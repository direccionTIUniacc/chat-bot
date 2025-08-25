<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600">Resumen general del ChatBot de UNIACC</p>
    </div>

    <!-- Métricas principales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Prospectos"
        :value="metrics.prospectoMetrics.value.total"
        :icon="Users"
        icon-background-class="bg-blue-500"
        :change="5.2"
      />
      
      <MetricCard
        title="Conversión"
        :value="metrics.prospectoMetrics.value.conversion_rate"
        :icon="TrendingUp"
        icon-background-class="bg-green-500"
        format="percentage"
        :decimals="1"
        :change="2.1"
      />
      
      <MetricCard
        title="Sesiones Activas"
        :value="metrics.chatbotMetrics.value.active_sessions"
        :icon="MessageCircle"
        icon-background-class="bg-purple-500"
      />
      
      <MetricCard
        title="Matriculados"
        :value="metrics.prospectoMetrics.value.matriculados"
        :icon="GraduationCap"
        icon-background-class="bg-yellow-500"
        :change="12"
        change-unit=""
      />
    </div>

    <!-- Gráficos y tablas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Últimos prospectos -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Últimos Prospectos</h2>
          <router-link 
            to="/prospectos"
            class="text-sm text-uniacc-primary hover:text-blue-700"
          >
            Ver todos
          </router-link>
        </div>
        
        <div v-if="prospectosStore.loading" class="flex justify-center py-8">
          <LoadingSpinner text="Cargando prospectos..." />
        </div>
        
        <div v-else-if="prospectosStore.prospectos.length === 0" class="text-center py-8">
          <Users class="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">No hay prospectos registrados</p>
        </div>
        
        <div v-else class="space-y-3">
          <div
            v-for="prospecto in recentProspectos"
            :key="prospecto.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">{{ prospecto.nombre }}</p>
              <p class="text-sm text-gray-600">{{ prospecto.carrera_interes }}</p>
            </div>
            <div class="text-right">
              <span :class="[
                'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                getStatusColor(prospecto.estado)
              ]">
                {{ formatStatus(prospecto.estado) }}
              </span>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatTimeAgo(prospecto.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Estados de prospectos -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Estado de Prospectos</h2>
        
        <div class="space-y-4">
          <div
            v-for="(estado, key) in estadosData"
            :key="key"
            class="flex items-center justify-between"
          >
            <div class="flex items-center">
              <div :class="['w-3 h-3 rounded-full mr-3', estado.color]"></div>
              <span class="text-sm font-medium text-gray-900">{{ estado.label }}</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold text-gray-900">{{ estado.count }}</span>
              <span class="text-xs text-gray-500 ml-1">
                ({{ estado.percentage.toFixed(1) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversaciones que requieren atención -->
    <div class="card">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">🚨 Conversaciones - Atención Requerida</h2>
          <div class="flex items-center space-x-2">
            <span class="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {{ totalPendientes }} pendientes
            </span>
            <router-link 
              to="/conversaciones"
              class="text-sm text-uniacc-primary hover:text-blue-700"
            >
              Ver todas
            </router-link>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <div v-if="chat.loading && chat.loading.value" class="text-center py-8">
          <LoadingSpinner />
        </div>
        
        <div v-else class="space-y-6">
          <!-- Conversaciones sin asignar -->
          <div v-if="chat.conversacionesPendientes && chat.conversacionesPendientes.value && chat.conversacionesPendientes.value.length > 0">
            <h3 class="text-sm font-medium text-orange-700 mb-3 flex items-center">
              <AlertTriangle class="w-4 h-4 mr-2" />
              Sin Asignar ({{ chat.conversacionesPendientes.value.length }})
            </h3>
            <div class="space-y-3">
              <div
                v-for="conversacion in chat.conversacionesPendientes.value.slice(0, 3)"
                :key="conversacion.id"
                class="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <img
                    :src="chat.getContactAvatar(conversacion)"
                    :alt="chat.getContactName(conversacion)"
                    class="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p class="font-medium text-gray-900">{{ chat.getContactName(conversacion) }}</p>
                    <p class="text-sm text-gray-600 truncate max-w-xs">{{ getUltimoMensaje(conversacion) }}</p>
                    <p class="text-xs text-gray-500">{{ chat.formatearTiempo(conversacion.last_message_at) }}</p>
                  </div>
                </div>
                
                <div class="flex items-center space-x-2">
                  <select
                    @change="asignarRapido(conversacion.id, ($event.target as HTMLSelectElement).value)"
                    class="text-xs border border-orange-300 rounded px-2 py-1"
                  >
                    <option value="">Asignar...</option>
                    <option
                      v-for="ejecutivo in ejecutivos.ejecutivosDisponibles.value"
                      :key="ejecutivo.id"
                      :value="ejecutivo.id"
                    >
                      {{ ejecutivo.nombre }}
                    </option>
                  </select>
                  <button
                    @click="abrirRespuestaRapida(conversacion)"
                    class="bg-orange-600 text-white text-xs px-3 py-1 rounded hover:bg-orange-700 transition-colors"
                  >
                    Responder
                  </button>
                </div>
              </div>
            </div>
            <div v-if="chat.conversacionesPendientes && chat.conversacionesPendientes.value && chat.conversacionesPendientes.value.length > 3" class="text-center mt-3">
              <router-link 
                to="/conversaciones" 
                class="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                +{{ chat.conversacionesPendientes.value.length - 3 }} más sin asignar
              </router-link>
            </div>
          </div>

          <!-- Mensajes no leídos -->
          <div v-if="conversacionesConMensajesNoLeidos.length > 0">
            <h3 class="text-sm font-medium text-blue-700 mb-3 flex items-center">
              <MessageSquare class="w-4 h-4 mr-2" />
              Mensajes No Leídos ({{ totalMensajesNoLeidos }})
            </h3>
            <div class="space-y-3">
              <div
                v-for="conversacion in conversacionesConMensajesNoLeidos.slice(0, 3)"
                :key="conversacion.id"
                class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <div class="relative">
                    <img
                      :src="chat.getContactAvatar(conversacion)"
                      :alt="chat.getContactName(conversacion)"
                      class="w-10 h-10 rounded-full object-cover"
                    />
                    <div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {{ chat.mensajesNoLeidos.value[conversacion.id] }}
                    </div>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ chat.getContactName(conversacion) }}</p>
                    <p class="text-sm text-gray-600 truncate max-w-xs">{{ getUltimoMensaje(conversacion) }}</p>
                    <p class="text-xs text-gray-500">{{ chat.formatearTiempo(conversacion.last_message_at) }}</p>
                  </div>
                </div>
                
                <div class="flex items-center space-x-2">
                  <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {{ chat.getEjecutivoNombre(conversacion.assigned_to!) }}
                  </span>
                  <button
                    @click="abrirRespuestaRapida(conversacion)"
                    class="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    Responder
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-if="chat.conversaciones && chat.conversaciones.value && chat.conversaciones.value.length === 0" class="text-center py-8">
            <MessageSquare class="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500">No hay conversaciones disponibles</p>
          </div>

          <!-- Todas las conversaciones al día -->
          <div v-if="totalPendientes === 0 && chat.conversaciones && chat.conversaciones.value && chat.conversaciones.value.length > 0" class="text-center py-8">
            <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-green-900 mb-2">¡Todo al día! 🎉</h3>
            <p class="text-green-700">No hay conversaciones pendientes de atención</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de respuesta rápida -->
    <RespuestaRapidaModal
      v-if="showRespuestaModal && conversacionParaRespuesta"
      :conversacion="conversacionParaRespuesta"
      @close="closeRespuestaModal"
      @enviado="handleMensajeEnviado"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Users, 
  TrendingUp, 
  MessageCircle, 
  GraduationCap,
  MessageSquare,
  AlertTriangle,
  CheckCircle
} from 'lucide-vue-next'
import { useProspectosStore } from '@/stores/prospectos'
import { useMetricas } from '@/composables/useMetricas'
import { useChat } from '@/composables/useChat'
import { useEjecutivos } from '@/composables/useEjecutivos'
import { formatStatus, formatTimeAgo } from '@/utils/formatters'
import { PROSPECTO_ESTADOS_COLORS, PROSPECTO_ESTADOS_LABELS } from '@/utils/constants'
import type { ChatSession } from '@/types'
import MetricCard from '@/components/common/MetricCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import RespuestaRapidaModal from '@/components/chat/RespuestaRapidaModal.vue'

// Store y composables
const prospectosStore = useProspectosStore()
const metrics = useMetricas()
const chat = useChat()
const ejecutivos = useEjecutivos()

// Estado local
const showRespuestaModal = ref(false)
const conversacionParaRespuesta = ref<ChatSession | null>(null)

// Computed
const recentProspectos = computed(() => 
  prospectosStore.prospectos.slice(0, 5)
)

const conversacionesConMensajesNoLeidos = computed(() => {
  return chat.conversaciones.value.filter(c => 
    chat.mensajesNoLeidos.value[c.id] > 0
  )
})

const totalMensajesNoLeidos = computed(() => 
  chat.totalMensajesNoLeidos.value || 0
)

const totalPendientes = computed(() => {
  const pendientes = chat.conversacionesPendientes.value?.length || 0
  const noLeidos = totalMensajesNoLeidos.value || 0
  return pendientes + noLeidos
})

const estadosData = computed(() => {
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

const getStatusColor = (estado: string) => {
  return PROSPECTO_ESTADOS_COLORS[estado as keyof typeof PROSPECTO_ESTADOS_COLORS] || 'bg-gray-100 text-gray-800'
}

// Métodos para chat
const getUltimoMensaje = (conversacion: ChatSession): string => {
  const mensajes = chat.mensajes.value[conversacion.id]
  if (!mensajes || mensajes.length === 0) return 'Sin mensajes'
  
  const ultimo = mensajes[mensajes.length - 1]
  return ultimo.content
}

const asignarRapido = async (conversacionId: string, ejecutivoId: string) => {
  if (!ejecutivoId) return
  
  await chat.asignarConversacion(conversacionId, ejecutivoId)
  
  // Reset del select
  const select = event?.target as HTMLSelectElement
  if (select) select.value = ''
}

const abrirRespuestaRapida = (conversacion: ChatSession) => {
  conversacionParaRespuesta.value = conversacion
  showRespuestaModal.value = true
}

const closeRespuestaModal = () => {
  showRespuestaModal.value = false
  conversacionParaRespuesta.value = null
}

const handleMensajeEnviado = () => {
  closeRespuestaModal()
  // Refresh data or show success notification
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    prospectosStore.initialize(),
    metrics.loadAllMetrics(),
    chat.inicializar(),
    ejecutivos.fetchEjecutivos()
  ])
})
</script>
