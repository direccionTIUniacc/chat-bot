<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style="z-index: 9999;">
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">
          ✏️ Editar Datos - {{ prospecto?.nombre || 'Prospecto' }}
        </h2>
        <button 
          @click="cerrarModal"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      <form @submit.prevent="guardarCambios" class="space-y-6">
        <!-- SECCIÓN 1: Datos Personales -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">👤 Datos Personales</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                v-model="formData.nombre"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                v-model="formData.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                v-model="formData.telefono"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+56912345678"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Edad</label>
              <input
                v-model.number="formData.edad"
                type="number"
                min="16"
                max="80"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Región</label>
              <select
                v-model="formData.region"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar región</option>
                <option v-for="region in regiones" :key="region" :value="region">
                  {{ region }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                v-model="formData.ciudad"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Santiago"
              />
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: Información Académica -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">🎓 Información Académica</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Carrera de interés</label>
              <select
                v-model="formData.carrera_interes"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar carrera</option>
                <option v-for="carrera in carreras" :key="carrera" :value="carrera">
                  {{ carrera }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nivel de interés</label>
              <select
                v-model="formData.nivel_interes"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar nivel</option>
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
                <option value="muy_alto">Muy Alto</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Modalidad preferida</label>
              <select
                v-model="formData.modalidad_preferida"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar modalidad</option>
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="semipresencial">Semipresencial</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Horario preferido</label>
              <select
                v-model="formData.horario_preferido"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar horario</option>
                <option value="diurno">Diurno</option>
                <option value="vespertino">Vespertino</option>
                <option value="weekend">Weekend</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: Gestión Comercial -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">🏷️ Gestión Comercial</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Estado del prospecto</label>
              <select
                v-model="formData.estado"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar estado</option>
                <option value="nuevo">Nuevo</option>
                <option value="contactado">En contacto</option>
                <option value="interesado">Interesado</option>
                <option value="matriculado">Matriculado</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Perfil de usuario</label>
              <select
                v-model="formData.perfil_usuario"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar perfil</option>
                <option value="explorador">Explorador</option>
                <option value="decidido">Decidido</option>
                <option value="reconvertido">Reconvertido</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="flex items-center space-x-2">
                <input
                  v-model="formData.es_prioritario"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700">🔥 Es prioritario</span>
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Próximo seguimiento</label>
              <input
                v-model="formData.proximo_seguimiento"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notas privadas del ejecutivo</label>
              <textarea
                v-model="formData.notas"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas internas para el seguimiento del prospecto..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 4: Información del Sistema (Solo lectura) -->
        <div class="border rounded-lg p-4 bg-gray-50">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">📊 Información del Sistema</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span class="font-medium">Fuente de captación:</span>
              <span class="ml-2">{{ prospecto?.fuente || 'Chatbot UNIACC' }}</span>
            </div>
            <div>
              <span class="font-medium">Primera interacción:</span>
              <span class="ml-2">{{ formatDateTime(prospecto?.primera_interaccion) }}</span>
            </div>
            <div>
              <span class="font-medium">Total de sesiones:</span>
              <span class="ml-2">{{ prospecto?.total_sesiones || 0 }}</span>
            </div>
            <div>
              <span class="font-medium">Última actividad:</span>
              <span class="ml-2">{{ formatDateTime(prospecto?.ultima_interaccion) }}</span>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex justify-between items-center pt-4 border-t">
          <div class="flex space-x-2">
            <button
              type="button"
              @click="llamarProspecto"
              class="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
            >
              📞 Llamar
            </button>
            <button
              type="button"
              @click="enviarEmail"
              class="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              📧 Email
            </button>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="cerrarModal"
              class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="guardando"
              class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              <span v-if="guardando">💾 Guardando...</span>
              <span v-else>💾 Guardar Cambios</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { formatDateTime } from '@/utils/formatters'

// Props
interface Props {
  isOpen: boolean
  prospecto: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

// State
const guardando = ref(false)

// Datos del formulario
const formData = reactive({
  nombre: '',
  email: '',
  telefono: '',
  edad: null,
  region: '',
  ciudad: '',
  carrera_interes: '',
  nivel_interes: '',
  modalidad_preferida: '',
  horario_preferido: '',
  estado: '',
  perfil_usuario: '',
  es_prioritario: false,
  proximo_seguimiento: '',
  notas: ''
})

// Opciones para los selects
const regiones = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes'
]

const carreras = [
  'Ingeniería Comercial',
  'Psicología',
  'Derecho',
  'Comunicación Audiovisual',
  'Diseño Gráfico',
  'Arquitectura',
  'Periodismo',
  'Publicidad',
  'Trabajo Social',
  'Ingeniería en Sistemas',
  'Administración de Empresas',
  'Marketing',
  'Recursos Humanos',
  'Contabilidad y Auditoría',
  'Sin especificar'
]

// Watchers
watch(() => props.isOpen, (newValue) => {
  console.log('📱 Modal EditarProspecto - isOpen cambió a:', newValue)
  console.log('📋 Prospecto actual:', props.prospecto)
}, { immediate: true })

watch(() => props.prospecto, (newProspecto) => {
  console.log('📋 Prospecto cambió:', newProspecto)
  if (newProspecto) {
    cargarDatosProspecto()
  }
}, { immediate: true })

// Methods
const cargarDatosProspecto = () => {
  if (!props.prospecto) return

  Object.assign(formData, {
    nombre: props.prospecto.nombre || '',
    email: props.prospecto.email || '',
    telefono: props.prospecto.telefono || props.prospecto.whatsapp || '',
    edad: props.prospecto.edad || null,
    region: props.prospecto.region || '',
    ciudad: props.prospecto.ciudad || '',
    carrera_interes: props.prospecto.carrera_interes || '',
    nivel_interes: props.prospecto.nivel_interes || '',
    modalidad_preferida: props.prospecto.modalidad_preferida || '',
    horario_preferido: props.prospecto.horario_preferido || '',
    estado: props.prospecto.estado || '',
    perfil_usuario: props.prospecto.perfil_usuario || '',
    es_prioritario: props.prospecto.es_prioritario || false,
    proximo_seguimiento: props.prospecto.proximo_seguimiento ? 
      new Date(props.prospecto.proximo_seguimiento).toISOString().split('T')[0] : '',
    notas: props.prospecto.notas || ''
  })
}

const guardarCambios = async () => {
  if (guardando.value) return

  try {
    guardando.value = true
    
    // Emitir los datos al componente padre
    emit('save', {
      ...formData,
      whatsapp: props.prospecto?.whatsapp // Mantener el campo de identificación
    })

    console.log('✅ Datos guardados exitosamente')
  } catch (error) {
    console.error('❌ Error guardando datos:', error)
    alert('Error al guardar los datos. Inténtalo de nuevo.')
  } finally {
    guardando.value = false
  }
}

const cerrarModal = () => {
  emit('close')
}

const llamarProspecto = () => {
  if (formData.telefono) {
    window.open(`tel:${formData.telefono}`)
  } else {
    alert('No hay número de teléfono disponible')
  }
}

const enviarEmail = () => {
  if (formData.email) {
    const asunto = `Seguimiento UNIACC - ${formData.nombre}`
    const cuerpo = `Hola ${formData.nombre},\n\nEspero que te encuentres bien. Te contacto desde UNIACC para...\n\nSaludos cordiales.`
    window.open(`mailto:${formData.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`)
  } else {
    alert('No hay email disponible')
  }
}
</script>
