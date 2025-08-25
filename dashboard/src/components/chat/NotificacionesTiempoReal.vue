<template>
  <!-- Notificaciones flotantes -->
  <div class="fixed top-4 right-4 z-50 space-y-3">
    <Transition
      v-for="notificacion in notificacionesVisibles"
      :key="notificacion.id"
      name="notification"
      appear
    >
      <div
        :class="[
          'bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm cursor-pointer',
          'hover:shadow-xl transition-all duration-200',
          getNotificationStyle(notificacion.tipo)
        ]"
        @click="manejarClick(notificacion)"
      >
        <div class="flex items-start space-x-3">
          <!-- Avatar o icono -->
          <div class="flex-shrink-0">
            <img
              v-if="notificacion.avatar"
              :src="notificacion.avatar"
              :alt="notificacion.titulo"
              class="w-10 h-10 rounded-full object-cover"
            />
            <div
              v-else
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center',
                getIconBackground(notificacion.tipo)
              ]"
            >
              <component 
                :is="getIcon(notificacion.tipo)" 
                class="w-5 h-5 text-white"
              />
            </div>
          </div>

          <!-- Contenido -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ notificacion.titulo }}
              </p>
              <button
                @click.stop="cerrarNotificacion(notificacion.id)"
                class="text-gray-400 hover:text-gray-600"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            
            <p class="text-sm text-gray-600 line-clamp-2">
              {{ notificacion.mensaje }}
            </p>
            
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-500">
                {{ formatearTiempo(notificacion.timestamp) }}
              </span>
              
              <!-- Acciones rápidas -->
              <div v-if="notificacion.acciones" class="flex space-x-2">
                <button
                  v-for="accion in notificacion.acciones"
                  :key="accion.id"
                  @click.stop="ejecutarAccion(accion, notificacion)"
                  :class="[
                    'text-xs px-2 py-1 rounded transition-colors',
                    accion.tipo === 'primary' 
                      ? 'bg-uniacc-primary text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ accion.texto }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Badge de notificaciones en el header -->
  <div
    v-if="totalNotificaciones > 0"
    class="fixed top-4 left-1/2 transform -translate-x-1/2 z-40"
  >
    <div class="bg-red-500 text-white text-sm font-medium px-3 py-2 rounded-full shadow-lg">
      {{ totalNotificaciones }} {{ totalNotificaciones === 1 ? 'notificación' : 'notificaciones' }} nueva{{ totalNotificaciones === 1 ? '' : 's' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  MessageSquare, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Bell
} from 'lucide-vue-next'
import { useChat } from '@/composables/useChat'
import { useEjecutivos } from '@/composables/useEjecutivos'

interface Notificacion {
  id: string
  tipo: 'mensaje' | 'asignacion' | 'error' | 'exito' | 'sistema'
  titulo: string
  mensaje: string
  timestamp: string
  avatar?: string
  conversacionId?: string
  ejecutivoId?: string
  acciones?: AccionNotificacion[]
  duracion?: number // ms
  persistente?: boolean
}

interface AccionNotificacion {
  id: string
  texto: string
  tipo: 'primary' | 'secondary'
  accion: () => void
}

// Composables
const chat = useChat()
const ejecutivos = useEjecutivos()

// Estado
const notificaciones = ref<Notificacion[]>([])
const maxNotificacionesVisibles = 5

// Computed
const notificacionesVisibles = computed(() => 
  notificaciones.value.slice(0, maxNotificacionesVisibles)
)

const totalNotificaciones = computed(() => notificaciones.value.length)

// Métodos
const agregarNotificacion = (notificacion: Omit<Notificacion, 'id' | 'timestamp'>) => {
  const nuevaNotificacion: Notificacion = {
    ...notificacion,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  }

  notificaciones.value.unshift(nuevaNotificacion)

  // Auto-remover si no es persistente
  if (!nuevaNotificacion.persistente) {
    const duracion = nuevaNotificacion.duracion || 5000
    setTimeout(() => {
      cerrarNotificacion(nuevaNotificacion.id)
    }, duracion)
  }

  // Reproducir sonido de notificación
  reproducirSonidoNotificacion(notificacion.tipo)
}

const cerrarNotificacion = (id: string) => {
  const index = notificaciones.value.findIndex(n => n.id === id)
  if (index > -1) {
    notificaciones.value.splice(index, 1)
  }
}

const manejarClick = (notificacion: Notificacion) => {
  // Navegar a la conversación si es aplicable
  if (notificacion.conversacionId) {
    chat.seleccionarConversacion(notificacion.conversacionId)
  }
  
  // Cerrar la notificación
  cerrarNotificacion(notificacion.id)
}

const ejecutarAccion = (accion: AccionNotificacion, notificacion: Notificacion) => {
  accion.accion()
  cerrarNotificacion(notificacion.id)
}

// Utilidades de estilo
const getNotificationStyle = (tipo: Notificacion['tipo']): string => {
  switch (tipo) {
    case 'mensaje': return 'border-l-4 border-l-blue-500'
    case 'asignacion': return 'border-l-4 border-l-green-500'
    case 'error': return 'border-l-4 border-l-red-500'
    case 'exito': return 'border-l-4 border-l-emerald-500'
    case 'sistema': return 'border-l-4 border-l-gray-500'
    default: return 'border-l-4 border-l-gray-500'
  }
}

const getIconBackground = (tipo: Notificacion['tipo']): string => {
  switch (tipo) {
    case 'mensaje': return 'bg-blue-500'
    case 'asignacion': return 'bg-green-500'
    case 'error': return 'bg-red-500'
    case 'exito': return 'bg-emerald-500'
    case 'sistema': return 'bg-gray-500'
    default: return 'bg-gray-500'
  }
}

const getIcon = (tipo: Notificacion['tipo']) => {
  switch (tipo) {
    case 'mensaje': return MessageSquare
    case 'asignacion': return UserPlus
    case 'error': return AlertTriangle
    case 'exito': return CheckCircle
    case 'sistema': return Bell
    default: return Bell
  }
}

const formatearTiempo = (timestamp: string): string => {
  const fecha = new Date(timestamp)
  const ahora = new Date()
  const diferencia = ahora.getTime() - fecha.getTime()
  
  const minutos = Math.floor(diferencia / (1000 * 60))
  
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `${minutos}m`
  
  const horas = Math.floor(diferencia / (1000 * 60 * 60))
  if (horas < 24) return `${horas}h`
  
  return fecha.toLocaleDateString()
}

const reproducirSonidoNotificacion = (tipo: Notificacion['tipo']) => {
  // Solo en desarrollo, en producción sería configurable
  if (import.meta.env.DEV) {
    try {
      const audio = new Audio()
      
      switch (tipo) {
        case 'mensaje':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+XwtGURBzKI1v'
          break
        case 'error':
          // Sonido de error más grave
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+XwtGUR'
          break
        default:
          // Sonido neutro
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+XwtGUR'
      }
      
      audio.volume = 0.3
      audio.play().catch(() => {
        // Silenciosamente fallar si no se puede reproducir
      })
    } catch (error) {
      // Ignorar errores de audio
    }
  }
}

// Listeners para eventos del chat
const configurarListeners = () => {
  // Escuchar nuevos mensajes
  const originalEnviarMensaje = chat.enviarMensaje
  
  // Simular notificaciones de mensajes entrantes
  const simularMensajesEntrantes = () => {
    setInterval(() => {
      if (Math.random() < 0.05) { // 5% probabilidad cada 30 segundos
        const conversaciones = chat.conversaciones.value
        const conversacionAleatoria = conversaciones[Math.floor(Math.random() * conversaciones.length)]
        
        if (conversacionAleatoria && conversacionAleatoria.status === 'active') {
          agregarNotificacion({
            tipo: 'mensaje',
            titulo: `Nuevo mensaje de ${chat.getContactName(conversacionAleatoria)}`,
            mensaje: '¿Podrían enviarme más información sobre los horarios?',
            avatar: chat.getContactAvatar(conversacionAleatoria),
            conversacionId: conversacionAleatoria.id,
            acciones: [
              {
                id: 'responder',
                texto: 'Responder',
                tipo: 'primary',
                accion: () => chat.seleccionarConversacion(conversacionAleatoria.id)
              },
              {
                id: 'ver',
                texto: 'Ver chat',
                tipo: 'secondary',
                accion: () => chat.seleccionarConversacion(conversacionAleatoria.id)
              }
            ]
          })
        }
      }
    }, 30000) // Cada 30 segundos
  }

  // Escuchar asignaciones de ejecutivos
  const simularAsignaciones = () => {
    setInterval(() => {
      if (Math.random() < 0.03) { // 3% probabilidad cada 45 segundos
        const ejecutivosDisponibles = ejecutivos.ejecutivosDisponibles.value
        const ejecutivoAleatorio = ejecutivosDisponibles[Math.floor(Math.random() * ejecutivosDisponibles.length)]
        
        if (ejecutivoAleatorio) {
          agregarNotificacion({
            tipo: 'asignacion',
            titulo: 'Nueva asignación',
            mensaje: `Se asignó un nuevo prospecto a ${ejecutivoAleatorio.nombre}`,
            ejecutivoId: ejecutivoAleatorio.id,
            duracion: 4000
          })
        }
      }
    }, 45000) // Cada 45 segundos
  }

  // Notificaciones de sistema
  const notificacionesSistema = () => {
    // Notificación de bienvenida
    setTimeout(() => {
      agregarNotificacion({
        tipo: 'sistema',
        titulo: '¡Sistema de chat activo!',
        mensaje: 'Las conversaciones en tiempo real están funcionando correctamente',
        duracion: 3000
      })
    }, 2000)

    // Recordatorios periódicos
    setInterval(() => {
      const sinAsignar = chat.conversacionesSinAsignar.value.length
      
      if (sinAsignar > 0) {
        agregarNotificacion({
          tipo: 'error',
          titulo: `${sinAsignar} conversaciones sin asignar`,
          mensaje: 'Hay prospectos esperando atención. Considera asignarlos a un ejecutivo.',
          persistente: sinAsignar > 3,
          acciones: [
            {
              id: 'ver_pendientes',
              texto: 'Ver pendientes',
              tipo: 'primary',
              accion: () => {
                // Navegar a conversaciones
                console.log('Navegando a conversaciones pendientes')
              }
            }
          ]
        })
      }
    }, 300000) // Cada 5 minutos
  }

  // Iniciar simulaciones solo en desarrollo
  if (import.meta.env.DEV) {
    simularMensajesEntrantes()
    simularAsignaciones()
  }
  
  notificacionesSistema()
}

// Limpiar notificaciones al desmontar
const limpiarNotificaciones = () => {
  notificaciones.value = []
}

// Lifecycle
onMounted(() => {
  configurarListeners()
})

onUnmounted(() => {
  limpiarNotificaciones()
})

// Exponer métodos para uso externo
defineExpose({
  agregarNotificacion,
  cerrarNotificacion,
  limpiarNotificaciones
})
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
