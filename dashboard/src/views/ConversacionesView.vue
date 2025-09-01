<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Conversaciones WhatsApp</h1>
        <p class="text-gray-600">Gestiona las conversaciones en tiempo real con prospectos</p>
      </div>
      
      <!-- Estadísticas rápidas -->
      <div class="flex items-center space-x-4 text-sm">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-green-400 rounded-full"></div>
          <span>{{ chat.conversacionesActivas.value.length }} Activas</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <span>{{ chat.conversacionesPendientes.value.length }} Pendientes</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-red-400 rounded-full"></div>
          <span>{{ chat.totalMensajesNoLeidos.value }} No leídos</span>
        </div>
      </div>
    </div>

    <!-- Métricas de conversaciones -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Conversaciones Totales"
        :value="chat.conversaciones.value.length"
        :icon="MessageSquare"
        icon-background-class="bg-blue-500"
      />
      
      <MetricCard
        title="Mensajes No Leídos"
        :value="chat.totalMensajesNoLeidos.value"
        :icon="Bell"
        icon-background-class="bg-red-500"
      />
      
      <MetricCard
        title="Sin Asignar"
        :value="chat.conversacionesPendientes && chat.conversacionesPendientes.value ? chat.conversacionesPendientes.value.length : 0"
        :icon="AlertCircle"
        icon-background-class="bg-orange-500"
      />
      
      <MetricCard
        title="Ejecutivos Online"
        :value="ejecutivos.ejecutivosDisponibles.value.length"
        :icon="UserCheck"
        icon-background-class="bg-green-500"
      />
    </div>

    <!-- Interfaz de chat principal -->
    <ChatInterface />

    <!-- Panel de asignaciones rápidas -->
    <div v-if="chat.conversacionesPendientes && chat.conversacionesPendientes.value && chat.conversacionesPendientes.value.length > 0" class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          🚨 Conversaciones sin asignar ({{ chat.conversacionesPendientes.value.length }})
        </h3>
        <div class="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
          ⚡ Requieren asignación inmediata
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="conversacion in chat.conversacionesPendientes.value"
          :key="conversacion.id"
          class="border border-orange-200 rounded-lg p-4 bg-orange-50"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <img
                :src="chat.getContactAvatar(conversacion)"
                :alt="chat.getContactName(conversacion)"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p class="font-medium text-gray-900">{{ chat.getContactName(conversacion) }}</p>
                <p class="text-xs text-gray-500">{{ chat.formatearTiempo(conversacion.last_message_at) }}</p>
              </div>
            </div>
            
            <span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
              Pendiente
            </span>
          </div>
          
          <p class="text-sm text-gray-600 mb-3 line-clamp-2">
            {{ getUltimoMensaje(conversacion) }}
          </p>
          
          <div class="flex space-x-2">
            <select
              @change="asignarRapido(conversacion.id, ($event.target as HTMLSelectElement).value)"
              class="flex-1 text-xs border-2 border-orange-300 bg-orange-50 text-orange-800 rounded px-2 py-1 font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              <option value="">🎯 Asignar a ejecutivo...</option>
              <option
                v-for="ejecutivo in ejecutivos.ejecutivosDisponibles.value"
                :key="ejecutivo.id"
                :value="ejecutivo.id"
              >
                👤 {{ ejecutivo.nombre }}
              </option>
            </select>
            
            <button
              @click="abrirRespuestaRapida(conversacion)"
              class="text-xs bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 transition-colors"
            >
              🚀 Responder
            </button>
            
            <button
              @click="chat.seleccionarConversacion(conversacion.id)"
              class="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
            >
              Ver
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de ejecutivos activos -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Ejecutivos en línea
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="ejecutivo in ejecutivos.ejecutivosDisponibles.value"
          :key="ejecutivo.id"
          class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div class="relative">
            <img
              :src="ejecutivo.avatar_url || defaultAvatar"
              :alt="ejecutivo.nombre"
              class="w-10 h-10 rounded-full object-cover"
            />
            <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate">{{ ejecutivo.nombre }}</p>
            <p class="text-xs text-gray-500">
              {{ ejecutivo.prospectos_activos }}/{{ ejecutivo.max_prospectos_simultaneos }} prospectos
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de respuesta rápida -->
    <RespuestaRapidaModal
      v-if="showRespuestaModal"
      :conversacion="conversacionParaRespuesta!"
      @close="closeRespuestaModal"
      @enviado="handleMensajeEnviado"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MessageSquare, Bell, AlertCircle, UserCheck } from 'lucide-vue-next'
import { useChat } from '@/composables/useChat'
import { useEjecutivos } from '@/composables/useEjecutivos'
import type { ChatSession } from '@/types'
import MetricCard from '@/components/common/MetricCard.vue'
import ChatInterface from '@/components/chat/ChatInterface.vue'
import RespuestaRapidaModal from '@/components/chat/RespuestaRapidaModal.vue'

// Composables
const chat = useChat()
const ejecutivos = useEjecutivos()

// Estado local para respuesta rápida
const showRespuestaModal = ref(false)
const conversacionParaRespuesta = ref<ChatSession | null>(null)

const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'

// Métodos
const getUltimoMensaje = (conversacion: ChatSession): string => {
  const mensajes = chat.mensajes.value[conversacion.id]
  if (!mensajes || mensajes.length === 0) return 'Sin mensajes'
  
  const ultimo = mensajes[mensajes.length - 1]
  return ultimo.content
}

const asignarRapido = async (conversacionId: string, ejecutivoId: string) => {
  if (!ejecutivoId) return
  
  try {
    console.log(`🎯 Asignando conversación ${conversacionId} a ejecutivo ${ejecutivoId}`)
    
    const result = await chat.asignarConversacion(conversacionId, ejecutivoId, {
      manual: true,
      priority: 'normal'
    })
    
    if (result.success) {
      console.log('✅ Asignación exitosa:', result.data)
      
      // 🔄 Recargar conversaciones para actualizar la UI
      await chat.inicializar()
      
      // Mostrar notificación de éxito
      alert(`✅ Conversación asignada exitosamente a ${result.data.ejecutivo_asignado?.nombre || 'ejecutivo'}`)
    } else {
      console.error('❌ Error en asignación:', result.error)
      alert(`Error al asignar: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    alert(`Error inesperado: ${error}`)
  }
}

// Métodos de respuesta rápida
const abrirRespuestaRapida = (conversacion: ChatSession) => {
  conversacionParaRespuesta.value = conversacion
  showRespuestaModal.value = true
}

const closeRespuestaModal = () => {
  showRespuestaModal.value = false
  conversacionParaRespuesta.value = null
}

const handleMensajeEnviado = async () => {
  closeRespuestaModal()
  // Refresh data to show updated conversation state
  await chat.inicializar()
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    chat.inicializar(),
    ejecutivos.fetchEjecutivos()
  ])
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>