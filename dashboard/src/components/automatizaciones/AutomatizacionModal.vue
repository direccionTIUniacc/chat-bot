<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ automatizacion ? 'Editar Automatización' : 'Nueva Automatización' }}
          </h2>
          <p class="text-gray-600">Configure los triggers y acciones para automatizar procesos</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Contenido -->
      <div class="overflow-y-auto max-h-[calc(90vh-200px)]">
        <form @submit.prevent="guardar" class="p-6 space-y-8">
          <!-- Información básica -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Información Básica
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la automatización *
                </label>
                <input
                  v-model="form.nombre"
                  type="text"
                  required
                  class="input-field w-full"
                  placeholder="Ej: Bienvenida nuevos prospectos"
                />
              </div>
              
              <div class="flex items-center space-x-6">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.activa"
                    type="checkbox"
                    class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                  />
                  <span class="text-sm text-gray-700">Automatización activa</span>
                </label>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                v-model="form.descripcion"
                rows="3"
                class="input-field w-full"
                placeholder="Describe qué hace esta automatización..."
              />
            </div>
          </div>

          <!-- Trigger -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Zap class="w-5 h-5 mr-2 text-yellow-500" />
              Disparador (Trigger)
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de disparador *
                </label>
                <select
                  v-model="form.trigger.tipo"
                  required
                  class="input-field w-full"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="prospecto_creado">Prospecto creado</option>
                  <option value="estado_cambiado">Estado cambiado</option>
                  <option value="tiempo_transcurrido">Tiempo transcurrido</option>
                  <option value="inactividad">Inactividad</option>
                  <option value="horario_programado">Horario programado</option>
                  <option value="ejecutivo_asignado">Ejecutivo asignado</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Retraso (minutos)
                </label>
                <input
                  v-model.number="form.trigger.delay_minutos"
                  type="number"
                  min="0"
                  max="10080"
                  class="input-field w-full"
                  placeholder="0"
                />
              </div>
            </div>

            <!-- Condiciones del trigger -->
            <div v-if="form.trigger.tipo" class="space-y-4">
              <h4 class="text-md font-medium text-gray-800">Condiciones específicas</h4>
              
              <!-- Condiciones por tipo de trigger -->
              <div v-if="form.trigger.tipo === 'prospecto_creado'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Fuente del prospecto
                  </label>
                  <select
                    v-model="condicionFuente"
                    class="input-field w-full"
                  >
                    <option value="">Cualquier fuente</option>
                    <option value="whatsapp_bot">WhatsApp Bot</option>
                    <option value="web_form">Formulario Web</option>
                    <option value="facebook_ads">Facebook Ads</option>
                    <option value="google_ads">Google Ads</option>
                  </select>
                </div>
              </div>
              
              <div v-if="form.trigger.tipo === 'tiempo_transcurrido'" class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Horas</label>
                    <input
                      v-model.number="condicionTiempo.horas"
                      type="number"
                      min="0"
                      max="168"
                      class="input-field w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Días</label>
                    <input
                      v-model.number="condicionTiempo.dias"
                      type="number"
                      min="0"
                      max="30"
                      class="input-field w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Semanas</label>
                    <input
                      v-model.number="condicionTiempo.semanas"
                      type="number"
                      min="0"
                      max="52"
                      class="input-field w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtros -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Filter class="w-5 h-5 mr-2 text-blue-500" />
              Filtros (¿A quién aplicar?)
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Estados de prospecto
                </label>
                <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-3">
                  <label
                    v-for="estado in estadosProspecto"
                    :key="estado.valor"
                    class="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      :value="estado.valor"
                      v-model="filtroEstados"
                      class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                    />
                    <span>{{ estado.label }}</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Fuentes
                </label>
                <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-3">
                  <label
                    v-for="fuente in fuentesProspecto"
                    :key="fuente.valor"
                    class="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      :value="fuente.valor"
                      v-model="filtroFuentes"
                      class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                    />
                    <span>{{ fuente.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                <Settings class="w-5 h-5 mr-2 text-green-500" />
                Acciones ({{ form.acciones.length }})
              </h3>
              <button
                type="button"
                @click="agregarAccion"
                class="btn-secondary text-sm"
              >
                <Plus class="w-4 h-4 mr-1" />
                Agregar Acción
              </button>
            </div>
            
            <div class="space-y-4">
              <div
                v-for="(accion, index) in form.acciones"
                :key="index"
                class="border border-gray-200 rounded-lg p-4 relative"
              >
                <div class="flex items-center justify-between mb-4">
                  <span class="text-sm font-medium text-gray-700">Acción {{ index + 1 }}</span>
                  <button
                    type="button"
                    @click="eliminarAccion(index)"
                    class="text-red-500 hover:text-red-700"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de acción *
                    </label>
                    <select
                      v-model="accion.tipo"
                      required
                      class="input-field w-full"
                    >
                      <option value="">Seleccionar acción</option>
                      <option value="enviar_whatsapp">Enviar WhatsApp</option>
                      <option value="enviar_email">Enviar Email</option>
                      <option value="asignar_ejecutivo">Asignar Ejecutivo</option>
                      <option value="cambiar_estado">Cambiar Estado</option>
                      <option value="crear_tarea">Crear Tarea</option>
                      <option value="agregar_nota">Agregar Nota</option>
                      <option value="webhook_externo">Webhook Externo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Orden de ejecución
                    </label>
                    <input
                      v-model.number="accion.orden"
                      type="number"
                      min="1"
                      class="input-field w-full"
                    />
                  </div>
                </div>
                
                <!-- Parámetros específicos por tipo de acción -->
                <div v-if="accion.tipo" class="mt-4 space-y-4">
                  <h5 class="text-sm font-medium text-gray-700">Configuración</h5>
                  
                  <!-- WhatsApp -->
                  <div v-if="accion.tipo === 'enviar_whatsapp'" class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                      <textarea
                        v-model="accion.parametros.mensaje"
                        rows="3"
                        class="input-field w-full"
                        placeholder="Escribe el mensaje a enviar..."
                      />
                    </div>
                    <div class="flex items-center space-x-4">
                      <label class="flex items-center space-x-2">
                        <input
                          v-model="accion.parametros.incluir_info_carreras"
                          type="checkbox"
                          class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                        />
                        <span class="text-sm">Incluir info de carreras</span>
                      </label>
                      <label class="flex items-center space-x-2">
                        <input
                          v-model="accion.parametros.incluir_link_agendamiento"
                          type="checkbox"
                          class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                        />
                        <span class="text-sm">Incluir link de agendamiento</span>
                      </label>
                    </div>
                  </div>
                  
                  <!-- Email -->
                  <div v-if="accion.tipo === 'enviar_email'" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Destinatario</label>
                        <select
                          v-model="accion.parametros.destinatario"
                          class="input-field w-full"
                        >
                          <option value="prospecto">Prospecto</option>
                          <option value="ejecutivo_asignado">Ejecutivo asignado</option>
                          <option value="supervisor">Supervisor</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Template</label>
                        <select
                          v-model="accion.parametros.template"
                          class="input-field w-full"
                        >
                          <option value="bienvenida">Bienvenida</option>
                          <option value="seguimiento_24h">Seguimiento 24h</option>
                          <option value="informacion_carrera">Información carrera</option>
                          <option value="personalizado">Personalizado</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Asunto</label>
                      <input
                        v-model="accion.parametros.asunto"
                        type="text"
                        class="input-field w-full"
                        placeholder="Asunto del email"
                      />
                    </div>
                  </div>
                  
                  <!-- Asignar ejecutivo -->
                  <div v-if="accion.tipo === 'asignar_ejecutivo'" class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Criterio de asignación</label>
                      <select
                        v-model="accion.parametros.criterio"
                        class="input-field w-full"
                      >
                        <option value="facultad_especialidad">Por facultad/especialidad</option>
                        <option value="menor_carga">Menor carga de trabajo</option>
                        <option value="round_robin">Round robin</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                  </div>
                  
                  <!-- Cambiar estado -->
                  <div v-if="accion.tipo === 'cambiar_estado'" class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Nuevo estado</label>
                      <select
                        v-model="accion.parametros.nuevo_estado"
                        class="input-field w-full"
                      >
                        <option v-for="estado in estadosProspecto" :key="estado.valor" :value="estado.valor">
                          {{ estado.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                  
                  <!-- Crear tarea -->
                  <div v-if="accion.tipo === 'crear_tarea'" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Título</label>
                        <input
                          v-model="accion.parametros.titulo"
                          type="text"
                          class="input-field w-full"
                          placeholder="Título de la tarea"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                        <select
                          v-model="accion.parametros.prioridad"
                          class="input-field w-full"
                        >
                          <option value="baja">Baja</option>
                          <option value="media">Media</option>
                          <option value="alta">Alta</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                      <textarea
                        v-model="accion.parametros.descripcion"
                        rows="2"
                        class="input-field w-full"
                        placeholder="Descripción de la tarea"
                      />
                    </div>
                  </div>
                  
                  <!-- Agregar nota -->
                  <div v-if="accion.tipo === 'agregar_nota'" class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Nota</label>
                      <textarea
                        v-model="accion.parametros.nota"
                        rows="3"
                        class="input-field w-full"
                        placeholder="Nota a agregar al prospecto"
                      />
                    </div>
                  </div>
                  
                  <!-- Webhook -->
                  <div v-if="accion.tipo === 'webhook_externo'" class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">URL del webhook</label>
                      <input
                        v-model="accion.parametros.url"
                        type="url"
                        class="input-field w-full"
                        placeholder="https://api.ejemplo.com/webhook"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Método HTTP</label>
                      <select
                        v-model="accion.parametros.metodo"
                        class="input-field w-full"
                      >
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Mensaje si no hay acciones -->
              <div v-if="form.acciones.length === 0" class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Settings class="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p class="text-gray-500">No hay acciones configuradas</p>
                <button
                  type="button"
                  @click="agregarAccion"
                  class="btn-primary mt-2"
                >
                  Agregar Primera Acción
                </button>
              </div>
            </div>
          </div>

          <!-- Configuración adicional -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Configuración Adicional
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de ejecuciones por prospecto
                </label>
                <input
                  v-model.number="form.max_ejecuciones"
                  type="number"
                  min="1"
                  max="100"
                  class="input-field w-full"
                  placeholder="Sin límite"
                />
                <p class="text-xs text-gray-500 mt-1">Deja vacío para ejecutar sin límite</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Horario de funcionamiento
                </label>
                <div class="flex space-x-2">
                  <input
                    v-model="horarioInicio"
                    type="time"
                    class="input-field flex-1"
                  />
                  <span class="self-center text-gray-500">-</span>
                  <input
                    v-model="horarioFin"
                    type="time"
                    class="input-field flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div class="text-sm text-gray-600">
          Automatización {{ form.activa ? 'activa' : 'inactiva' }} • {{ form.acciones.length }} acciones configuradas
        </div>
        <div class="flex space-x-3">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="guardar"
            class="btn-primary"
            :disabled="!formularioValido"
          >
            {{ automatizacion ? 'Actualizar' : 'Crear' }} Automatización
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  X, 
  Zap, 
  Filter, 
  Settings, 
  Plus, 
  Trash2 
} from 'lucide-vue-next'
import { 
  PROSPECTO_ESTADOS_LABELS, 
  PROSPECTO_FUENTES_LABELS 
} from '@/utils/constants'
import type { Automatizacion, CreateAutomatizacion } from '@/types'

interface Props {
  automatizacion?: Automatizacion | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [data: CreateAutomatizacion]
}>()

// Estado del formulario
const form = ref<CreateAutomatizacion>({
  nombre: '',
  descripcion: '',
  activa: true,
  trigger: {
    tipo: 'prospecto_creado',
    condiciones: {},
    delay_minutos: 0
  },
  filtros: {},
  acciones: []
})

// Estados auxiliares
const condicionFuente = ref('')
const condicionTiempo = ref({ horas: 0, dias: 0, semanas: 0 })
const filtroEstados = ref<string[]>([])
const filtroFuentes = ref<string[]>([])
const horarioInicio = ref('09:00')
const horarioFin = ref('18:00')

// Data
const estadosProspecto = Object.entries(PROSPECTO_ESTADOS_LABELS).map(([valor, label]) => ({
  valor,
  label
}))

const fuentesProspecto = Object.entries(PROSPECTO_FUENTES_LABELS).map(([valor, label]) => ({
  valor,
  label
}))

// Computed
const formularioValido = computed(() => {
  return form.value.nombre.trim() && 
         form.value.trigger.tipo && 
         form.value.acciones.length > 0 &&
         form.value.acciones.every(a => a.tipo)
})

// Watchers
watch(() => props.automatizacion, cargarDatos)

watch(condicionFuente, (newValue) => {
  if (newValue) {
    form.value.trigger.condiciones = { fuente: newValue }
  }
})

watch(condicionTiempo, (newValue) => {
  if (newValue.horas || newValue.dias || newValue.semanas) {
    form.value.trigger.condiciones = { ...newValue }
  }
}, { deep: true })

watch(filtroEstados, (newValue) => {
  if (newValue.length > 0) {
    form.value.filtros!.estado = newValue
  } else {
    delete form.value.filtros!.estado
  }
})

watch(filtroFuentes, (newValue) => {
  if (newValue.length > 0) {
    form.value.filtros!.fuente = newValue
  } else {
    delete form.value.filtros!.fuente
  }
})

watch([horarioInicio, horarioFin], ([inicio, fin]) => {
  if (inicio && fin) {
    form.value.horario_activo = {
      inicio,
      fin,
      dias_semana: [1, 2, 3, 4, 5] // Lunes a viernes por defecto
    }
  }
})

// Métodos
const cargarDatos = () => {
  if (props.automatizacion) {
    const auto = props.automatizacion
    
    form.value = {
      nombre: auto.nombre,
      descripcion: auto.descripcion || '',
      activa: auto.activa,
      trigger: { ...auto.trigger },
      filtros: auto.filtros ? { ...auto.filtros } : {},
      acciones: auto.acciones.map(a => ({
        ...a,
        parametros: { ...a.parametros }
      })),
      max_ejecuciones: auto.max_ejecuciones,
      horario_activo: auto.horario_activo ? { ...auto.horario_activo } : undefined
    }
    
    // Cargar filtros
    if (auto.filtros?.estado) {
      filtroEstados.value = [...auto.filtros.estado]
    }
    if (auto.filtros?.fuente) {
      filtroFuentes.value = [...auto.filtros.fuente]
    }
    
    // Cargar horario
    if (auto.horario_activo) {
      horarioInicio.value = auto.horario_activo.inicio
      horarioFin.value = auto.horario_activo.fin
    }
  }
}

const agregarAccion = () => {
  form.value.acciones.push({
    tipo: 'enviar_whatsapp',
    parametros: {},
    orden: form.value.acciones.length + 1
  })
}

const eliminarAccion = (index: number) => {
  form.value.acciones.splice(index, 1)
  
  // Reordenar
  form.value.acciones.forEach((accion, i) => {
    accion.orden = i + 1
  })
}

const guardar = () => {
  if (!formularioValido.value) return
  
  // Limpiar filtros vacíos
  if (form.value.filtros && Object.keys(form.value.filtros).length === 0) {
    delete form.value.filtros
  }
  
  emit('save', { ...form.value })
}

// Lifecycle
onMounted(cargarDatos)
</script>
