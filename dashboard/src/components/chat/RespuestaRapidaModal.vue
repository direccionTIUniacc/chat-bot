<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <img
            :src="chat.getContactAvatar(conversacion)"
            :alt="chat.getContactName(conversacion)"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              {{ chat.getContactName(conversacion) }}
            </h2>
            <p class="text-sm text-gray-600">{{ conversacion.phone_number }}</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Contenido -->
      <div class="flex flex-col max-h-[calc(90vh-140px)]">
        <!-- Últimos mensajes -->
        <div class="flex-1 overflow-y-auto p-6 bg-gray-50">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Últimos mensajes</h3>
          
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="mensaje in ultimosMensajes"
              :key="mensaje.id"
              :class="[
                'flex',
                mensaje.type === 'user' ? 'justify-end' : 'justify-start'
              ]"
            >
              <!-- Mensaje del usuario -->
              <div
                v-if="mensaje.type === 'user'"
                class="max-w-xs"
              >
                <div class="bg-blue-500 text-white rounded-lg px-3 py-2">
                  <p class="text-sm">{{ mensaje.content }}</p>
                </div>
                <div class="text-xs text-gray-500 mt-1 text-right">
                  {{ formatearHora(mensaje.timestamp) }}
                </div>
              </div>

              <!-- Mensaje del bot o ejecutivo -->
              <div
                v-else
                class="max-w-xs"
              >
                <div class="flex items-start space-x-2">
                  <div 
                    :class="[
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      mensaje.type === 'bot' ? 'bg-gray-100 text-gray-600' : 'bg-uniacc-primary text-white'
                    ]"
                  >
                    {{ mensaje.type === 'bot' ? '🤖' : (mensaje.sender_name?.[0] || 'E') }}
                  </div>
                  <div>
                    <div 
                      :class="[
                        'rounded-lg px-3 py-2',
                        mensaje.type === 'bot' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                      ]"
                    >
                      <p class="text-sm">{{ mensaje.content }}</p>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ formatearHora(mensaje.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="ultimosMensajes.length === 0" class="text-center py-8">
            <MessageSquare class="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p class="text-sm text-gray-500">No hay mensajes previos</p>
          </div>
        </div>

        <!-- Templates de respuesta rápida -->
        <div class="p-6 border-t border-gray-200 bg-white">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Templates de Respuesta</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <button
              v-for="template in templates"
              :key="template.id"
              @click="seleccionarTemplate(template)"
              class="text-left p-3 border border-gray-200 rounded-lg hover:border-uniacc-primary hover:bg-blue-50 transition-colors"
            >
              <div class="flex items-start space-x-2">
                <component :is="template.icon" class="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ template.titulo }}</p>
                  <p class="text-xs text-gray-600 truncate">{{ template.preview }}</p>
                </div>
              </div>
            </button>
          </div>

          <!-- Área de escritura -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tu respuesta
              </label>
              <textarea
                v-model="mensajeRespuesta"
                rows="4"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-uniacc-primary focus:border-transparent resize-none"
                placeholder="Escribe tu respuesta aquí..."
                @keydown.ctrl.enter="enviarMensaje"
              />
              <div class="flex justify-between items-center mt-2">
                <p class="text-xs text-gray-500">Presiona Ctrl+Enter para enviar</p>
                <p class="text-xs text-gray-500">{{ mensajeRespuesta.length }}/1000</p>
              </div>
            </div>

            <!-- Opciones adicionales -->
            <div class="flex items-center space-x-4">
              <label class="flex items-center space-x-2">
                <input
                  v-model="marcarComoLeido"
                  type="checkbox"
                  class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                />
                <span class="text-sm text-gray-700">Marcar como leído</span>
              </label>
              
              <label class="flex items-center space-x-2">
                <input
                  v-model="programarSeguimiento"
                  type="checkbox"
                  class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                />
                <span class="text-sm text-gray-700">Programar seguimiento</span>
              </label>
            </div>
            
            <!-- Fecha de seguimiento -->
            <div v-if="programarSeguimiento" class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Fecha</label>
                <input
                  v-model="fechaSeguimiento"
                  type="date"
                  :min="today"
                  class="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Hora</label>
                <input
                  v-model="horaSeguimiento"
                  type="time"
                  class="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div class="text-sm text-gray-600">
          Respondiendo como: 
          <span class="font-medium">{{ ejecutivoActual?.nombre || 'Sistema' }}</span>
        </div>
        <div class="flex space-x-3">
          <button
            @click="$emit('close')"
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            @click="enviarMensaje"
            :disabled="!mensajeRespuesta.trim() || enviando"
            class="btn-primary"
          >
            <Send class="w-4 h-4 mr-2" />
            {{ enviando ? 'Enviando...' : 'Enviar Mensaje' }}
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
  MessageSquare, 
  Send,
  Info,
  Calendar,
  Clock,
  FileText,
  Users,
  Phone
} from 'lucide-vue-next'
import { useChat } from '@/composables/useChat'
import { useEjecutivos } from '@/composables/useEjecutivos'
import type { ChatSession, ChatMessage } from '@/types'

interface Props {
  conversacion: ChatSession
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  enviado: []
}>()

// Composables
const chat = useChat()
const ejecutivos = useEjecutivos()

// Estado local
const mensajeRespuesta = ref('')
const marcarComoLeido = ref(true)
const programarSeguimiento = ref(false)
const fechaSeguimiento = ref('')
const horaSeguimiento = ref('09:00')
const enviando = ref(false)

// Templates predefinidos
const templates = [
  {
    id: 'info_general',
    titulo: 'Información General',
    preview: 'Gracias por tu interés en UNIACC...',
    icon: Info,
    contenido: `¡Hola! Gracias por tu interés en UNIACC. 

Somos una universidad enfocada en las artes, comunicaciones y negocios con más de 30 años de experiencia.

¿En qué carrera estás interesado(a)? Me encantaría ayudarte con más información específica. 😊`
  },
  {
    id: 'solicitar_datos',
    titulo: 'Solicitar Datos',
    preview: 'Para brindarte mejor información...',
    icon: FileText,
    contenido: `Para brindarte información más personalizada, me gustaría conocer:

• ¿Qué carrera te interesa?
• ¿En qué modalidad prefieres estudiar? (Presencial/Online)
• ¿Tienes experiencia previa en el área?

Así podré enviarte información específica que te ayude a tomar la mejor decisión. 📚`
  },
  {
    id: 'agendar_reunion',
    titulo: 'Agendar Reunión',
    preview: 'Me gustaría programar una reunión...',
    icon: Calendar,
    contenido: `Me gustaría programar una reunión virtual contigo para:

✅ Resolver todas tus dudas
✅ Mostrarte la malla curricular detallada  
✅ Explicarte el proceso de admisión
✅ Conocer las opciones de financiamiento

¿Qué día y hora te acomoda mejor esta semana? 📅`
  },
  {
    id: 'proceso_admision',
    titulo: 'Proceso de Admisión',
    preview: 'El proceso de admisión es muy simple...',
    icon: Users,
    contenido: `El proceso de admisión en UNIACC es muy simple:

1️⃣ Completar formulario online
2️⃣ Entrevista personal (virtual o presencial)  
3️⃣ Revisión de antecedentes académicos
4️⃣ ¡Matrícula!

Todo el proceso toma entre 3-5 días hábiles. ¿Te gustaría que iniciemos tu proceso ahora?`
  },
  {
    id: 'contacto_telefonico',
    titulo: 'Solicitar Llamada',
    preview: 'Me gustaría llamarte para...',
    icon: Phone,
    contenido: `Me gustaría llamarte personalmente para resolver todas tus dudas y brindarte información detallada sobre nuestras carreras.

¿Cuál es el mejor horario para contactarte?
• Mañana (9:00 - 12:00)
• Tarde (14:00 - 17:00)  
• Noche (18:00 - 20:00)

📞 La llamada toma aprox. 15-20 minutos.`
  },
  {
    id: 'seguimiento',
    titulo: 'Programar Seguimiento',
    preview: 'Te voy a contactar nuevamente...',
    icon: Clock,
    contenido: `Perfecto, he tomado nota de tu interés en nuestras carreras.

Te voy a contactar nuevamente en los próximos días para:
• Enviarte información actualizada
• Resolver nuevas dudas que puedan surgir
• Informarte sobre eventos y charlas informativas

¡Mantente atento(a) a nuestros mensajes! 🎓`
  }
]

// Computed
const ultimosMensajes = computed(() => {
  const mensajes = chat.mensajes.value[props.conversacion.id] || []
  return mensajes.slice(-6) // Últimos 6 mensajes
})

const ejecutivoActual = computed(() => {
  if (!props.conversacion.assigned_to) return null
  return ejecutivos.ejecutivos.value.find(e => e.id === props.conversacion.assigned_to)
})

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Métodos
const seleccionarTemplate = (template: any) => {
  mensajeRespuesta.value = template.contenido
}

const enviarMensaje = async () => {
  if (!mensajeRespuesta.value.trim() || enviando.value) return
  
  enviando.value = true
  
  try {
    // Enviar mensaje
    await chat.enviarMensaje(
      props.conversacion.id,
      mensajeRespuesta.value.trim(),
      props.conversacion.assigned_to || undefined
    )
    
    // Marcar como leído si está seleccionado
    if (marcarComoLeido.value) {
      await chat.marcarMensajesComoLeidos(props.conversacion.id)
    }
    
    // Programar seguimiento si está seleccionado
    if (programarSeguimiento.value && fechaSeguimiento.value && horaSeguimiento.value) {
      console.log('Programando seguimiento para:', {
        fecha: fechaSeguimiento.value,
        hora: horaSeguimiento.value,
        conversacion: props.conversacion.id
      })
      // Aquí se implementaría la lógica de programación de seguimiento
    }
    
    // Notificar éxito
    emit('enviado')
    
    // Limpiar formulario
    mensajeRespuesta.value = ''
    
  } catch (error) {
    console.error('Error al enviar mensaje:', error)
    // Aquí se podría mostrar una notificación de error
  } finally {
    enviando.value = false
  }
}

const formatearHora = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(async () => {
  // Cargar mensajes de la conversación si no están cargados
  if (!chat.mensajes.value[props.conversacion.id]) {
    await chat.fetchMensajes(props.conversacion.id)
  }
  
  // Configurar fecha de seguimiento por defecto (mañana)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  fechaSeguimiento.value = tomorrow.toISOString().split('T')[0]
})
</script>
