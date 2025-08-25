<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ fuente ? 'Editar Fuente' : 'Nueva Fuente de Leads' }}
          </h2>
          <p class="text-gray-600">Configure los canales para captar nuevos prospectos</p>
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
                  Nombre de la fuente *
                </label>
                <input
                  v-model="form.nombre"
                  type="text"
                  required
                  class="input-field w-full"
                  placeholder="Ej: Formulario Contacto Principal"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de fuente *
                </label>
                <select
                  v-model="form.tipo"
                  required
                  class="input-field w-full"
                  @change="onTipoChange"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="whatsapp_bot">WhatsApp Bot</option>
                  <option value="formulario_web">Formulario Web</option>
                  <option value="landing_page">Landing Page</option>
                  <option value="facebook_ads">Facebook Ads</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="referido">Sistema de Referidos</option>
                </select>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  URL (opcional)
                </label>
                <input
                  v-model="form.url"
                  type="url"
                  class="input-field w-full"
                  placeholder="https://ejemplo.com/formulario"
                />
              </div>
              
              <div class="flex items-center space-x-6">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.activa"
                    type="checkbox"
                    class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                  />
                  <span class="text-sm text-gray-700">Fuente activa</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Parámetros UTM -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Parámetros de Seguimiento (UTM)
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  UTM Source
                </label>
                <input
                  v-model="form.utm_source"
                  type="text"
                  class="input-field w-full"
                  placeholder="facebook"
                />
                <p class="text-xs text-gray-500 mt-1">Origen del tráfico</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  UTM Medium
                </label>
                <input
                  v-model="form.utm_medium"
                  type="text"
                  class="input-field w-full"
                  placeholder="cpc"
                />
                <p class="text-xs text-gray-500 mt-1">Medio de marketing</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  UTM Campaign
                </label>
                <input
                  v-model="form.utm_campaign"
                  type="text"
                  class="input-field w-full"
                  placeholder="admision_2024"
                />
                <p class="text-xs text-gray-500 mt-1">Nombre de la campaña</p>
              </div>
            </div>
          </div>

          <!-- Campos del formulario -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Configuración de Campos
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Campos requeridos
                </label>
                <div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                  <label
                    v-for="campo in camposDisponibles"
                    :key="campo.value"
                    class="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      :value="campo.value"
                      v-model="form.campos_requeridos"
                      class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                    />
                    <span>{{ campo.label }}</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Campos opcionales
                </label>
                <div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                  <label
                    v-for="campo in camposDisponibles"
                    :key="campo.value"
                    class="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      :value="campo.value"
                      v-model="form.campos_opcionales"
                      :disabled="form.campos_requeridos.includes(campo.value)"
                      class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded disabled:opacity-50"
                    />
                    <span :class="{ 'text-gray-400': form.campos_requeridos.includes(campo.value) }">
                      {{ campo.label }}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Configuración específica por tipo -->
          <div v-if="form.tipo" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Configuración Específica
            </h3>
            
            <!-- WhatsApp Bot -->
            <div v-if="form.tipo === 'whatsapp_bot'" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Número de teléfono
                  </label>
                  <input
                    v-model="form.configuracion.numero_telefono"
                    type="tel"
                    class="input-field w-full"
                    placeholder="+56912345678"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    v-model="form.configuracion.webhook_url"
                    type="url"
                    class="input-field w-full"
                    placeholder="https://api.uniacc.cl/webhooks/whatsapp"
                  />
                </div>
              </div>
            </div>
            
            <!-- Formulario Web -->
            <div v-if="form.tipo === 'formulario_web'" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Tema visual
                  </label>
                  <select
                    v-model="form.configuracion.tema"
                    class="input-field w-full"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="uniacc">UNIACC (Personalizado)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    URL de redirección
                  </label>
                  <input
                    v-model="form.configuracion.redirect_after_submit"
                    type="url"
                    class="input-field w-full"
                    placeholder="https://uniacc.cl/gracias"
                  />
                </div>
              </div>
              
              <div class="flex items-center space-x-6">
                <label class="flex items-center space-x-2">
                  <input
                    v-model="form.configuracion.mostrar_carreras"
                    type="checkbox"
                    class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                  />
                  <span class="text-sm">Mostrar lista de carreras</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    v-model="form.configuracion.enviar_confirmacion"
                    type="checkbox"
                    class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                  />
                  <span class="text-sm">Enviar email de confirmación</span>
                </label>
              </div>
            </div>
            
            <!-- Facebook Ads -->
            <div v-if="form.tipo === 'facebook_ads'" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Campaign ID
                  </label>
                  <input
                    v-model="form.configuracion.campaign_id"
                    type="text"
                    class="input-field w-full"
                    placeholder="fb_camp_001"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Ad Account ID
                  </label>
                  <input
                    v-model="form.configuracion.ad_account_id"
                    type="text"
                    class="input-field w-full"
                    placeholder="act_123456789"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Pixel ID
                  </label>
                  <input
                    v-model="form.configuracion.pixel_id"
                    type="text"
                    class="input-field w-full"
                    placeholder="pixel_987654321"
                  />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Presupuesto diario estimado ($)
                </label>
                <input
                  v-model.number="form.configuracion.presupuesto_diario"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input-field w-full"
                  placeholder="50.00"
                />
              </div>
            </div>
            
            <!-- Google Ads -->
            <div v-if="form.tipo === 'google_ads'" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Campaign ID
                  </label>
                  <input
                    v-model="form.configuracion.campaign_id"
                    type="text"
                    class="input-field w-full"
                    placeholder="google_camp_001"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Account ID
                  </label>
                  <input
                    v-model="form.configuracion.account_id"
                    type="text"
                    class="input-field w-full"
                    placeholder="acc_123456789"
                  />
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Conversion ID
                  </label>
                  <input
                    v-model="form.configuracion.conversion_id"
                    type="text"
                    class="input-field w-full"
                    placeholder="conv_987654321"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    CPC Objetivo ($)
                  </label>
                  <input
                    v-model.number="form.configuracion.cpc_objetivo"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input-field w-full"
                    placeholder="2.50"
                  />
                </div>
              </div>
            </div>
            
            <!-- Landing Page -->
            <div v-if="form.tipo === 'landing_page'" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    v-model="form.configuracion.template"
                    class="input-field w-full"
                  >
                    <option value="modern">Moderno</option>
                    <option value="classic">Clásico</option>
                    <option value="minimal">Minimalista</option>
                    <option value="creative">Creativo</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Posición del formulario
                  </label>
                  <select
                    v-model="form.configuracion.form_position"
                    class="input-field w-full"
                  >
                    <option value="right">Derecha</option>
                    <option value="left">Izquierda</option>
                    <option value="bottom">Abajo</option>
                    <option value="modal">Modal</option>
                  </select>
                </div>
              </div>
              
              <div class="flex items-center space-x-6">
                <label class="flex items-center space-x-2">
                  <input
                    v-model="form.configuracion.show_testimonials"
                    type="checkbox"
                    class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                  />
                  <span class="text-sm">Mostrar testimonios</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    v-model="form.configuracion.show_hero_video"
                    type="checkbox"
                    class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
                  />
                  <span class="text-sm">Video hero</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Mensajes y redirecciones -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Mensajes y Redirecciones
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje de agradecimiento
                </label>
                <textarea
                  v-model="form.mensaje_gracias"
                  rows="3"
                  class="input-field w-full"
                  placeholder="¡Gracias por tu interés! Nos contactaremos contigo pronto."
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  URL de redirección
                </label>
                <input
                  v-model="form.redirect_url"
                  type="url"
                  class="input-field w-full"
                  placeholder="https://uniacc.cl/gracias"
                />
                <p class="text-xs text-gray-500 mt-1">Página a la que se redirige después del envío</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div class="text-sm text-gray-600">
          Fuente {{ form.activa ? 'activa' : 'inactiva' }} • {{ form.campos_requeridos.length }} campos requeridos
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
            {{ fuente ? 'Actualizar' : 'Crear' }} Fuente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import type { FuenteLead } from '@/composables/useFuentesLeads'

interface Props {
  fuente?: FuenteLead | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

// Estado del formulario
const form = ref({
  nombre: '',
  tipo: '',
  url: '',
  activa: true,
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  campos_requeridos: ['nombre', 'email'],
  campos_opcionales: [],
  mensaje_gracias: '¡Gracias por tu interés! Nos contactaremos contigo pronto.',
  redirect_url: '',
  configuracion: {} as Record<string, any>
})

// Campos disponibles
const camposDisponibles = [
  { value: 'nombre', label: 'Nombre completo' },
  { value: 'email', label: 'Email' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'carrera_interes', label: 'Carrera de interés' },
  { value: 'nivel_interes', label: 'Nivel de interés' },
  { value: 'edad', label: 'Edad' },
  { value: 'ocupacion', label: 'Ocupación actual' },
  { value: 'ciudad', label: 'Ciudad' },
  { value: 'experiencia_previa', label: 'Experiencia previa' },
  { value: 'nivel_educacion', label: 'Nivel educativo' },
  { value: 'comentarios', label: 'Comentarios' }
]

// Computed
const formularioValido = computed(() => {
  return form.value.nombre.trim() && 
         form.value.tipo && 
         form.value.campos_requeridos.length > 0
})

// Watchers
watch(() => props.fuente, cargarDatos)

// Métodos
const cargarDatos = () => {
  if (props.fuente) {
    const fuente = props.fuente
    
    form.value = {
      nombre: fuente.nombre,
      tipo: fuente.tipo,
      url: fuente.url || '',
      activa: fuente.activa,
      utm_source: fuente.utm_source || '',
      utm_medium: fuente.utm_medium || '',
      utm_campaign: fuente.utm_campaign || '',
      campos_requeridos: [...fuente.campos_requeridos],
      campos_opcionales: [...fuente.campos_opcionales],
      mensaje_gracias: fuente.mensaje_gracias || '¡Gracias por tu interés! Nos contactaremos contigo pronto.',
      redirect_url: fuente.redirect_url || '',
      configuracion: { ...fuente.configuracion }
    }
  }
}

const onTipoChange = () => {
  // Resetear configuración específica cuando cambia el tipo
  form.value.configuracion = {}
  
  // Configurar campos por defecto según el tipo
  switch (form.value.tipo) {
    case 'whatsapp_bot':
      form.value.campos_requeridos = ['nombre', 'telefono']
      form.value.utm_source = 'whatsapp'
      form.value.utm_medium = 'bot'
      break
    case 'formulario_web':
      form.value.campos_requeridos = ['nombre', 'email', 'telefono']
      form.value.utm_source = 'website'
      form.value.utm_medium = 'organic'
      break
    case 'landing_page':
      form.value.campos_requeridos = ['nombre', 'email', 'telefono']
      form.value.utm_source = 'landing'
      form.value.utm_medium = 'direct'
      break
    case 'facebook_ads':
      form.value.campos_requeridos = ['nombre', 'email', 'telefono']
      form.value.utm_source = 'facebook'
      form.value.utm_medium = 'cpc'
      break
    case 'google_ads':
      form.value.campos_requeridos = ['nombre', 'email', 'telefono']
      form.value.utm_source = 'google'
      form.value.utm_medium = 'cpc'
      break
    case 'referido':
      form.value.campos_requeridos = ['nombre', 'email', 'telefono']
      form.value.utm_source = 'referral'
      form.value.utm_medium = 'referral'
      break
  }
}

const guardar = () => {
  if (!formularioValido.value) return
  
  emit('save', { ...form.value })
}

// Lifecycle
onMounted(cargarDatos)
</script>
