<template>
  <div class="flex h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Sidebar de conversaciones -->
    <div class="w-80 border-r border-gray-200 flex flex-col">
      <!-- Header del sidebar -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Conversaciones</h3>
          <div class="flex items-center space-x-2">
            <span 
              v-if="chat.totalMensajesNoLeidos.value > 0"
              class="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full"
            >
              {{ chat.totalMensajesNoLeidos.value }}
            </span>
            <button
              @click="refreshConversaciones"
              class="p-1 text-gray-400 hover:text-gray-600 rounded"
              :disabled="chat.loading.value"
            >
              <RotateCcw :class="{ 'animate-spin': chat.loading.value }" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Filtros rápidos -->
        <div class="flex space-x-2">
          <button
            @click="filtroActivo = 'todos'"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              filtroActivo === 'todos' 
                ? 'bg-uniacc-primary text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            Todos ({{ chat.conversaciones.value.length }})
          </button>
          <button
            @click="filtroActivo = 'pendientes'"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              filtroActivo === 'pendientes' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            Pendientes ({{ chat.conversacionesPendientes.value.length }})
          </button>
        </div>
      </div>

      <!-- Lista de conversaciones -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="conversacion in conversacionesFiltradas"
          :key="conversacion.id"
          @click="seleccionarConversacion(conversacion)"
          :class="[
            'p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50',
            chat.conversacionActiva.value?.id === conversacion.id ? 'bg-blue-50 border-blue-200' : ''
          ]"
        >
          <div class="flex items-start space-x-3">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
              <img
                :src="chat.getContactAvatar(conversacion)"
                :alt="chat.getContactName(conversacion)"
                class="w-12 h-12 rounded-full object-cover"
              />
              <!-- Indicador de estado -->
              <div 
                :class="[
                  'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
                  getEstadoColor(conversacion)
                ]"
              ></div>
              <!-- Badge de mensajes no leídos -->
              <div
                v-if="chat.mensajesNoLeidos.value[conversacion.id] > 0"
                class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
              >
                {{ chat.mensajesNoLeidos.value[conversacion.id] > 9 ? '9+' : chat.mensajesNoLeidos.value[conversacion.id] }}
              </div>
            </div>

            <!-- Contenido -->
            <div class="flex-1 min-w-0">
              <!-- Nombre y timestamp -->
              <div class="flex items-center justify-between mb-1">
                <h4 class="text-sm font-medium text-gray-900 truncate">
                  {{ chat.getContactName(conversacion) }}
                </h4>
                <span class="text-xs text-gray-500">
                  {{ chat.formatearTiempo(conversacion.last_message_at) }}
                </span>
              </div>

              <!-- Último mensaje -->
              <p class="text-sm text-gray-600 truncate mb-2">
                {{ getUltimoMensaje(conversacion) }}
              </p>

              <!-- Tags y asignación -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1">
                  <!-- Tags -->
                  <span
                    v-for="tag in conversacion.tags.slice(0, 2)"
                    :key="tag"
                    class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded"
                  >
                    {{ tag }}
                  </span>
                </div>

                <!-- Ejecutivo asignado -->
                <div v-if="conversacion.assigned_to" class="flex items-center space-x-1">
                  <UserCheck class="w-3 h-3 text-green-600" />
                  <span class="text-xs text-green-600">
                    {{ chat.getEjecutivoNombre(conversacion.assigned_to) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="conversacionesFiltradas.length === 0" class="p-8 text-center">
          <MessageSquare class="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">
            {{ filtroActivo === 'pendientes' ? 'No hay conversaciones pendientes' : 'No hay conversaciones' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Panel de chat principal -->
    <div class="flex-1 flex flex-col">
      <!-- Header del chat -->
      <div v-if="chat.conversacionActiva.value" class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <img
              :src="chat.getContactAvatar(chat.conversacionActiva.value)"
              :alt="chat.getContactName(chat.conversacionActiva.value)"
              class="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ chat.getContactName(chat.conversacionActiva.value) }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ chat.conversacionActiva.value.phone_number }} • 
                {{ getEstadoTexto(chat.conversacionActiva.value) }}
              </p>
            </div>
          </div>

          <!-- Acciones del header -->
          <div class="flex items-center space-x-2">
            <!-- Asignar ejecutivo -->
            <select
              v-if="!chat.conversacionActiva.value.assigned_to"
              @change="asignarEjecutivo($event.target.value)"
              class="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Asignar a...</option>
              <option
                v-for="ejecutivo in ejecutivos.ejecutivosDisponibles.value"
                :key="ejecutivo.id"
                :value="ejecutivo.id"
              >
                {{ ejecutivo.nombre }}
              </option>
            </select>

            <!-- Cerrar conversación -->
            <button
              @click="cerrarConversacion"
              class="p-2 text-gray-400 hover:text-gray-600 rounded"
              title="Cerrar conversación"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Área de mensajes -->
      <div 
        v-if="chat.conversacionActiva.value"
        ref="mensajesContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div
          v-for="mensaje in mensajesActivos"
          :key="mensaje.id"
          :class="[
            'flex',
            mensaje.type === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <!-- Mensaje del usuario -->
          <div
            v-if="mensaje.type === 'user'"
            class="max-w-xs lg:max-w-md"
          >
            <div class="bg-blue-500 text-white rounded-lg px-4 py-2">
              <p class="text-sm">{{ mensaje.content }}</p>
            </div>
            <div class="flex items-center justify-end mt-1 space-x-1">
              <span class="text-xs text-gray-500">
                {{ formatearHora(mensaje.timestamp) }}
              </span>
              <component 
                :is="getStatusIcon(mensaje.status)" 
                class="w-3 h-3 text-gray-400"
              />
            </div>
          </div>

          <!-- Mensaje del bot o ejecutivo -->
          <div
            v-else
            class="max-w-xs lg:max-w-md"
          >
            <div class="flex items-start space-x-2">
              <!-- Avatar del remitente -->
              <div class="flex-shrink-0">
                <div 
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                    mensaje.type === 'bot' ? 'bg-gray-100 text-gray-600' : 'bg-uniacc-primary text-white'
                  ]"
                >
                  {{ mensaje.type === 'bot' ? '🤖' : (mensaje.sender_name?.[0] || 'E') }}
                </div>
              </div>

              <!-- Contenido del mensaje -->
              <div>
                <div 
                  :class="[
                    'rounded-lg px-4 py-2',
                    mensaje.type === 'bot' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                  ]"
                >
                  <p class="text-sm">{{ mensaje.content }}</p>
                </div>
                <div class="flex items-center mt-1 space-x-1">
                  <span class="text-xs text-gray-500">
                    {{ mensaje.sender_name || (mensaje.type === 'bot' ? 'ChatBot' : 'Ejecutivo') }}
                  </span>
                  <span class="text-xs text-gray-400">•</span>
                  <span class="text-xs text-gray-500">
                    {{ formatearHora(mensaje.timestamp) }}
                  </span>
                  <span 
                    v-if="mensaje.is_automated"
                    class="text-xs text-blue-500"
                    title="Mensaje automático"
                  >
                    🤖
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicador de escritura -->
        <div
          v-if="usuariosEscribiendoActivos.length > 0"
          class="flex justify-start"
        >
          <div class="max-w-xs lg:max-w-md">
            <div class="bg-gray-100 rounded-lg px-4 py-2">
              <div class="flex items-center space-x-1">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
                <span class="text-xs text-gray-500 ml-2">escribiendo...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de escritura -->
      <div 
        v-if="chat.conversacionActiva.value"
        class="p-4 border-t border-gray-200"
      >
        <form @submit.prevent="enviarMensaje" class="flex space-x-3">
          <input
            v-model="nuevoMensaje"
            @input="manejarEscritura"
            type="text"
            placeholder="Escribe tu mensaje..."
            class="flex-1 input-field"
            :disabled="!puedeResponder"
          />
          <button
            type="submit"
            class="btn-primary"
            :disabled="!nuevoMensaje.trim() || !puedeResponder"
          >
            <Send class="w-4 h-4" />
          </button>
        </form>
        
        <p v-if="!puedeResponder" class="text-xs text-amber-600 mt-2">
          ⚠️ Esta conversación debe ser asignada a un ejecutivo para poder responder
        </p>
      </div>

      <!-- Estado vacío -->
      <div v-if="!chat.conversacionActiva.value" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <MessageSquare class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Selecciona una conversación</h3>
          <p class="text-gray-500">Elige una conversación de la lista para empezar a chatear</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { 
  MessageSquare, 
  RotateCcw, 
  UserCheck, 
  X, 
  Send,
  Check,
  CheckCheck,
  Clock
} from 'lucide-vue-next'
import { useChat } from '@/composables/useChat'
import { useEjecutivos } from '@/composables/useEjecutivos'
import type { ChatSession, ChatMessage } from '@/types'

// Composables
const chat = useChat()
const ejecutivos = useEjecutivos()

// Estado local
const filtroActivo = ref<'todos' | 'pendientes'>('todos')
const nuevoMensaje = ref('')
const mensajesContainer = ref<HTMLElement>()

// Props (si se usa como componente embebido)
interface Props {
  ejecutivoId?: string // Para filtrar conversaciones de un ejecutivo específico
}

const props = defineProps<Props>()

// Computed
const conversacionesFiltradas = computed(() => {
  let filtered = chat.conversaciones.value

  if (props.ejecutivoId) {
    filtered = filtered.filter(c => c.assigned_to === props.ejecutivoId)
  }

  switch (filtroActivo.value) {
    case 'pendientes':
      return chat.conversacionesPendientes.value
    default:
      return filtered
  }
})

const mensajesActivos = computed(() => {
  if (!chat.conversacionActiva.value) return []
  return chat.mensajes.value[chat.conversacionActiva.value.id] || []
})

const usuariosEscribiendoActivos = computed(() => {
  if (!chat.conversacionActiva.value) return []
  return chat.usuariosEscribiendo.value[chat.conversacionActiva.value.id] || []
})

const puedeResponder = computed(() => {
  return chat.conversacionActiva.value?.assigned_to !== null
})

// Métodos
const refreshConversaciones = async () => {
  await chat.fetchConversaciones()
}

const seleccionarConversacion = async (conversacion: ChatSession) => {
  await chat.seleccionarConversacion(conversacion.id)
  scrollToBottom()
}

const enviarMensaje = async () => {
  if (!nuevoMensaje.value.trim() || !chat.conversacionActiva.value) return

  const ejecutivoId = chat.conversacionActiva.value.assigned_to
  if (!ejecutivoId) return

  await chat.enviarMensaje(
    chat.conversacionActiva.value.id,
    nuevoMensaje.value.trim(),
    ejecutivoId
  )

  nuevoMensaje.value = ''
  scrollToBottom()
}

const asignarEjecutivo = async (ejecutivoId: string) => {
  if (!chat.conversacionActiva.value || !ejecutivoId) return

  await chat.asignarConversacion(chat.conversacionActiva.value.id, ejecutivoId)
}

const cerrarConversacion = async () => {
  if (!chat.conversacionActiva.value) return

  await chat.cerrarConversacion(chat.conversacionActiva.value.id)
}

const manejarEscritura = () => {
  if (!chat.conversacionActiva.value) return
  
  chat.iniciarEscritura(chat.conversacionActiva.value.id, 'ejecutivo_current')
}

const scrollToBottom = async () => {
  await nextTick()
  if (mensajesContainer.value) {
    mensajesContainer.value.scrollTop = mensajesContainer.value.scrollHeight
  }
}

// Utilidades
const getUltimoMensaje = (conversacion: ChatSession): string => {
  const mensajes = chat.mensajes.value[conversacion.id]
  if (!mensajes || mensajes.length === 0) return 'Sin mensajes'
  
  const ultimo = mensajes[mensajes.length - 1]
  const prefijo = ultimo.type === 'user' ? '' : 
                 ultimo.type === 'bot' ? '🤖 ' : 
                 `${ultimo.sender_name}: `
  
  return `${prefijo}${ultimo.content}`
}

const getEstadoColor = (conversacion: ChatSession): string => {
  switch (conversacion.status) {
    case 'active': return 'bg-green-400'
    case 'pending': return 'bg-yellow-400'
    case 'closed': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

const getEstadoTexto = (conversacion: ChatSession): string => {
  const estados = {
    active: 'Activa',
    pending: 'Pendiente',
    closed: 'Cerrada'
  }
  return estados[conversacion.status] || 'Desconocido'
}

const formatearHora = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusIcon = (status: ChatMessage['status']) => {
  switch (status) {
    case 'sent': return Clock
    case 'delivered': return Check
    case 'read': return CheckCheck
    case 'failed': return X
    default: return Clock
  }
}

// Watchers
watch(() => chat.conversacionActiva.value, () => {
  scrollToBottom()
})

watch(() => mensajesActivos.value.length, () => {
  scrollToBottom()
})

// Lifecycle
onMounted(async () => {
  await chat.inicializar()
})
</script>

<style scoped>
.animate-bounce {
  animation: bounce 1.4s infinite;
}

.delay-100 {
  animation-delay: 0.1s;
}

.delay-200 {
  animation-delay: 0.2s;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}
</style>
