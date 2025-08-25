<template>
  <div class="relative">
    <!-- Botón de notificaciones -->
    <button
      @click="toggleNotificaciones"
      class="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-uniacc-primary focus:ring-offset-2 rounded-md"
    >
      <MessageSquare class="w-5 h-5" />
      <!-- Badge de notificaciones -->
      <div
        v-if="totalNotificaciones > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse"
      >
        {{ totalNotificaciones > 9 ? '9+' : totalNotificaciones }}
      </div>
    </button>

    <!-- Panel de notificaciones -->
    <Transition name="notification-panel">
      <div
        v-if="showNotificaciones"
        class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        @click.stop
      >
        <!-- Header del panel -->
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Conversaciones</h3>
            <div class="flex items-center space-x-2">
              <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                {{ totalNotificaciones }} pendientes
              </span>
              <button
                @click="closeNotificaciones"
                class="text-gray-400 hover:text-gray-600"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de notificaciones -->
        <div class="max-h-96 overflow-y-auto">
          <!-- Conversaciones sin asignar -->
          <div v-if="chat.conversacionesSinAsignar.value.length > 0" class="p-4 border-b border-gray-100">
            <h4 class="text-sm font-medium text-orange-700 mb-3 flex items-center">
              <AlertTriangle class="w-4 h-4 mr-2" />
              Sin Asignar ({{ chat.conversacionesSinAsignar.value.length }})
            </h4>
            <div class="space-y-3">
              <div
                v-for="conversacion in chat.conversacionesSinAsignar.value.slice(0, 3)"
                :key="conversacion.id"
                class="flex items-center space-x-3 p-2 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
                @click="manejarConversacion(conversacion)"
              >
                <img
                  :src="chat.getContactAvatar(conversacion)"
                  :alt="chat.getContactName(conversacion)"
                  class="w-8 h-8 rounded-full object-cover"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ chat.getContactName(conversacion) }}
                  </p>
                  <p class="text-xs text-gray-600 truncate">
                    {{ getUltimoMensaje(conversacion) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ chat.formatearTiempo(conversacion.last_message_at) }}
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                </div>
              </div>
            </div>
            
            <div v-if="chat.conversacionesSinAsignar.value.length > 3" class="mt-3 text-center">
              <router-link 
                to="/conversaciones" 
                @click="closeNotificaciones"
                class="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Ver {{ chat.conversacionesSinAsignar.value.length - 3 }} más
              </router-link>
            </div>
          </div>

          <!-- Mensajes no leídos -->
          <div v-if="conversacionesConMensajesNoLeidos.length > 0" class="p-4 border-b border-gray-100">
            <h4 class="text-sm font-medium text-blue-700 mb-3 flex items-center">
              <MessageSquare class="w-4 h-4 mr-2" />
              No Leídos ({{ totalMensajesNoLeidos }})
            </h4>
            <div class="space-y-3">
              <div
                v-for="conversacion in conversacionesConMensajesNoLeidos.slice(0, 3)"
                :key="conversacion.id"
                class="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                @click="manejarConversacion(conversacion)"
              >
                <div class="relative">
                  <img
                    :src="chat.getContactAvatar(conversacion)"
                    :alt="chat.getContactName(conversacion)"
                    class="w-8 h-8 rounded-full object-cover"
                  />
                  <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {{ chat.mensajesNoLeidos.value[conversacion.id] }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ chat.getContactName(conversacion) }}
                  </p>
                  <p class="text-xs text-gray-600 truncate">
                    {{ getUltimoMensaje(conversacion) }}
                  </p>
                  <div class="flex items-center space-x-2 mt-1">
                    <p class="text-xs text-gray-500">
                      {{ chat.formatearTiempo(conversacion.last_message_at) }}
                    </p>
                    <span class="text-xs bg-green-100 text-green-800 px-1 rounded">
                      {{ chat.getEjecutivoNombre(conversacion.assigned_to!) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-if="totalNotificaciones === 0" class="p-8 text-center">
            <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h4 class="text-sm font-medium text-green-900 mb-1">¡Todo al día!</h4>
            <p class="text-xs text-green-700">No hay conversaciones pendientes</p>
          </div>
        </div>

        <!-- Footer del panel -->
        <div class="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div class="flex items-center justify-between">
            <div class="text-xs text-gray-600">
              Actualizado: {{ ultimaActualizacion }}
            </div>
            <div class="flex space-x-2">
              <button
                @click="refreshNotificaciones"
                class="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                :disabled="refreshing"
              >
                <RotateCcw :class="{ 'animate-spin': refreshing }" class="w-3 h-3 mr-1 inline" />
                Actualizar
              </button>
              <router-link
                to="/conversaciones"
                @click="closeNotificaciones"
                class="text-xs bg-uniacc-primary text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                Ver Todas
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal de respuesta rápida -->
    <RespuestaRapidaModal
      v-if="showRespuestaModal"
      :conversacion="conversacionSeleccionada!"
      @close="closeRespuestaModal"
      @enviado="handleMensajeEnviado"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  MessageSquare, 
  X, 
  AlertTriangle, 
  CheckCircle,
  RotateCcw
} from 'lucide-vue-next'
import { useChat } from '@/composables/useChat'
import type { ChatSession } from '@/types'
import RespuestaRapidaModal from './RespuestaRapidaModal.vue'

// Composables
const chat = useChat()
const router = useRouter()

// Estado local
const showNotificaciones = ref(false)
const showRespuestaModal = ref(false)
const conversacionSeleccionada = ref<ChatSession | null>(null)
const refreshing = ref(false)

// Computed
const conversacionesConMensajesNoLeidos = computed(() => {
  return chat.conversaciones.value.filter(c => 
    chat.mensajesNoLeidos.value[c.id] > 0
  )
})

const totalMensajesNoLeidos = computed(() => 
  chat.totalMensajesNoLeidos.value
)

const totalNotificaciones = computed(() => 
  chat.conversacionesPendientes.value.length + totalMensajesNoLeidos.value
)

const ultimaActualizacion = computed(() => {
  return new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Métodos
const toggleNotificaciones = () => {
  showNotificaciones.value = !showNotificaciones.value
}

const closeNotificaciones = () => {
  showNotificaciones.value = false
}

const getUltimoMensaje = (conversacion: ChatSession): string => {
  const mensajes = chat.mensajes.value[conversacion.id]
  if (!mensajes || mensajes.length === 0) return 'Sin mensajes'
  
  const ultimo = mensajes[mensajes.length - 1]
  return ultimo.content
}

const manejarConversacion = (conversacion: ChatSession) => {
  // Si la conversación no está asignada, abrir respuesta rápida
  if (!conversacion.assigned_to) {
    conversacionSeleccionada.value = conversacion
    showRespuestaModal.value = true
    closeNotificaciones()
  } else {
    // Si está asignada, ir directamente al chat
    router.push('/conversaciones')
    chat.setConversacionActiva(conversacion)
    closeNotificaciones()
  }
}

const closeRespuestaModal = () => {
  showRespuestaModal.value = false
  conversacionSeleccionada.value = null
}

const handleMensajeEnviado = () => {
  closeRespuestaModal()
  // Opcional: mostrar notificación de éxito
}

const refreshNotificaciones = async () => {
  refreshing.value = true
  await chat.inicializar()
  refreshing.value = false
}

// Cerrar panel al hacer click fuera
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (showNotificaciones.value && !target.closest('.relative')) {
    closeNotificaciones()
  }
}

// Auto-refresh cada 30 segundos
let refreshInterval: number

// Lifecycle
onMounted(async () => {
  await chat.inicializar()
  
  document.addEventListener('click', handleClickOutside)
  
  // Auto-refresh cada 30 segundos
  refreshInterval = setInterval(() => {
    if (!showNotificaciones.value) {
      chat.inicializar()
    }
  }, 30000)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.notification-panel-enter-active,
.notification-panel-leave-active {
  transition: all 0.2s ease;
}

.notification-panel-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.notification-panel-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
