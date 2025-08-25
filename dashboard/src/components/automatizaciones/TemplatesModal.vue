<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Templates de Automatización</h2>
          <p class="text-gray-600">Elige un template predefinido para crear tu automatización</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Contenido -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <!-- Filtros por categoría -->
        <div class="mb-6">
          <div class="flex space-x-2">
            <button
              v-for="categoria in categorias"
              :key="categoria.id"
              @click="categoriaSeleccionada = categoria.id"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                categoriaSeleccionada === categoria.id
                  ? 'bg-uniacc-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ categoria.icon }} {{ categoria.nombre }}
            </button>
          </div>
        </div>

        <!-- Grid de templates -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="template in templatesFiltrados"
            :key="template.nombre"
            class="border border-gray-200 rounded-lg p-6 hover:border-uniacc-primary hover:shadow-md transition-all cursor-pointer"
            @click="seleccionarTemplate(template)"
          >
            <!-- Header del template -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">{{ template.nombre }}</h3>
                  <span 
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      getCategoriaColor(template.categoria)
                    ]"
                  >
                    {{ getCategoriaLabel(template.categoria) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-3">{{ template.descripcion }}</p>
              </div>
              
              <div class="text-2xl">{{ getCategoriaIcon(template.categoria) }}</div>
            </div>

            <!-- Preview del trigger -->
            <div class="mb-4">
              <div class="flex items-center space-x-2 mb-2">
                <Zap class="w-4 h-4 text-yellow-500" />
                <span class="text-sm font-medium text-gray-700">Disparador</span>
              </div>
              <p class="text-sm text-gray-600 ml-6">
                {{ formatTrigger(template.template.trigger) }}
              </p>
            </div>

            <!-- Preview de acciones -->
            <div class="mb-4">
              <div class="flex items-center space-x-2 mb-2">
                <Settings class="w-4 h-4 text-blue-500" />
                <span class="text-sm font-medium text-gray-700">Acciones ({{ template.template.acciones.length }})</span>
              </div>
              <div class="ml-6 space-y-1">
                <div
                  v-for="(accion, index) in template.template.acciones.slice(0, 3)"
                  :key="index"
                  class="text-sm text-gray-600"
                >
                  {{ index + 1 }}. {{ formatAccion(accion) }}
                </div>
                <div v-if="template.template.acciones.length > 3" class="text-xs text-gray-500">
                  +{{ template.template.acciones.length - 3 }} más...
                </div>
              </div>
            </div>

            <!-- Botón de acción -->
            <button
              @click.stop="crearDesdeTemplate(template)"
              class="w-full bg-uniacc-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Usar este Template
            </button>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="templatesFiltrados.length === 0" class="text-center py-12">
          <FileText class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay templates en esta categoría</h3>
          <p class="text-gray-500">Selecciona otra categoría para ver más opciones</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div class="text-sm text-gray-600">
          {{ templates.length }} templates disponibles
        </div>
        <div class="flex space-x-3">
          <button
            @click="$emit('close')"
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            class="btn-primary"
            @click="crearVacia"
          >
            <Plus class="w-4 h-4 mr-2" />
            Crear desde Cero
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Zap, Settings, FileText, Plus } from 'lucide-vue-next'
import { useAutomatizaciones } from '@/composables/useAutomatizaciones'
import type { TemplateAutomatizacion } from '@/types'

const emit = defineEmits<{
  close: []
  create: [template: TemplateAutomatizacion]
}>()

// Composables
const automatizaciones = useAutomatizaciones()

// Estado local
const categoriaSeleccionada = ref('todas')

// Data
const categorias = [
  { id: 'todas', nombre: 'Todas', icon: '📋' },
  { id: 'bienvenida', nombre: 'Bienvenida', icon: '👋' },
  { id: 'seguimiento', nombre: 'Seguimiento', icon: '📞' },
  { id: 'conversion', nombre: 'Conversión', icon: '💝' },
  { id: 'reactivacion', nombre: 'Reactivación', icon: '🔄' }
]

const templates = automatizaciones.getTemplates()

// Computed
const templatesFiltrados = computed(() => {
  if (categoriaSeleccionada.value === 'todas') {
    return templates
  }
  return templates.filter(t => t.categoria === categoriaSeleccionada.value)
})

// Métodos
const seleccionarTemplate = (template: TemplateAutomatizacion) => {
  // Highlight visual o mostrar más detalles
  console.log('Template seleccionado:', template.nombre)
}

const crearDesdeTemplate = (template: TemplateAutomatizacion) => {
  emit('create', template)
}

const crearVacia = () => {
  // Crear template vacío
  const templateVacio: TemplateAutomatizacion = {
    nombre: 'Nueva Automatización',
    descripcion: 'Automatización personalizada',
    categoria: 'seguimiento',
    template: {
      trigger: {
        tipo: 'prospecto_creado',
        condiciones: {},
        delay_minutos: 0
      },
      acciones: [],
      activa: false
    }
  }
  
  emit('create', templateVacio)
}

// Utilidades
const getCategoriaLabel = (categoria: string): string => {
  const labels = {
    bienvenida: 'Bienvenida',
    seguimiento: 'Seguimiento',
    conversion: 'Conversión',
    reactivacion: 'Reactivación',
    otras: 'Otras'
  }
  return labels[categoria as keyof typeof labels] || 'Otras'
}

const getCategoriaColor = (categoria: string): string => {
  const colores = {
    bienvenida: 'bg-blue-100 text-blue-800',
    seguimiento: 'bg-orange-100 text-orange-800',
    conversion: 'bg-green-100 text-green-800',
    reactivacion: 'bg-purple-100 text-purple-800',
    otras: 'bg-gray-100 text-gray-800'
  }
  return colores[categoria as keyof typeof colores] || colores.otras
}

const getCategoriaIcon = (categoria: string): string => {
  const iconos = {
    bienvenida: '👋',
    seguimiento: '📞',
    conversion: '💝',
    reactivacion: '🔄',
    otras: '⚙️'
  }
  return iconos[categoria as keyof typeof iconos] || '⚙️'
}

const formatTrigger = (trigger: any): string => {
  const tipos = {
    prospecto_creado: 'Cuando se crea un prospecto',
    estado_cambiado: 'Cuando cambia el estado',
    tiempo_transcurrido: 'Después de cierto tiempo',
    inactividad: 'Por inactividad',
    horario_programado: 'En horario programado',
    ejecutivo_asignado: 'Cuando se asigna ejecutivo'
  }
  
  let descripcion = tipos[trigger.tipo as keyof typeof tipos] || trigger.tipo
  
  if (trigger.delay_minutos > 0) {
    descripcion += ` (después de ${trigger.delay_minutos} min)`
  }
  
  return descripcion
}

const formatAccion = (accion: any): string => {
  const tipos = {
    enviar_email: 'Enviar email',
    enviar_whatsapp: 'Enviar WhatsApp',
    asignar_ejecutivo: 'Asignar ejecutivo',
    cambiar_estado: 'Cambiar estado',
    crear_tarea: 'Crear tarea',
    webhook_externo: 'Llamar webhook',
    agregar_nota: 'Agregar nota'
  }
  
  return tipos[accion.tipo as keyof typeof tipos] || accion.tipo
}
</script>
