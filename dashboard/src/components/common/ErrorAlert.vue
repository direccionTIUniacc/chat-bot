<template>
  <div 
    v-if="show"
    :class="[
      'rounded-lg p-4 border',
      typeClasses,
      containerClass
    ]"
    role="alert"
  >
    <div class="flex items-start">
      <!-- Icono -->
      <div class="flex-shrink-0">
        <component 
          :is="icon" 
          :class="['w-5 h-5', iconClass]"
        />
      </div>
      
      <div class="ml-3 flex-1">
        <!-- Título -->
        <h3 v-if="title" :class="['text-sm font-medium', titleClass]">
          {{ title }}
        </h3>
        
        <!-- Mensaje -->
        <div :class="['text-sm', messageClass, title ? 'mt-1' : '']">
          <p v-if="typeof message === 'string'">{{ message }}</p>
          <ul v-else-if="Array.isArray(message)" class="list-disc list-inside space-y-1">
            <li v-for="(msg, index) in message" :key="index">{{ msg }}</li>
          </ul>
        </div>
        
        <!-- Acciones -->
        <div v-if="actions || dismissible" class="mt-3 flex space-x-3">
          <button
            v-for="action in actions"
            :key="action.label"
            @click="action.handler"
            :class="[
              'text-sm font-medium underline hover:no-underline',
              actionClass
            ]"
          >
            {{ action.label }}
          </button>
          
          <button
            v-if="dismissible"
            @click="dismiss"
            :class="[
              'text-sm font-medium underline hover:no-underline',
              actionClass
            ]"
          >
            Cerrar
          </button>
        </div>
      </div>
      
      <!-- Botón de cerrar -->
      <div v-if="dismissible && !hideCloseButton" class="ml-4 flex-shrink-0">
        <button
          @click="dismiss"
          :class="[
            'rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2',
            closeButtonClass
          ]"
        >
          <span class="sr-only">Cerrar</span>
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertTriangle, CheckCircle, Info, X, AlertCircle } from 'lucide-vue-next'

type AlertType = 'error' | 'warning' | 'success' | 'info'

interface Action {
  label: string
  handler: () => void
}

interface Props {
  type?: AlertType
  title?: string
  message: string | string[]
  dismissible?: boolean
  hideCloseButton?: boolean
  actions?: Action[]
  containerClass?: string
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  dismissible: true,
  hideCloseButton: false,
  containerClass: '',
  autoHide: false,
  autoHideDelay: 5000
})

const emit = defineEmits<{
  dismiss: []
}>()

const show = ref(true)

// Auto-hide functionality
if (props.autoHide) {
  setTimeout(() => {
    dismiss()
  }, props.autoHideDelay)
}

const dismiss = () => {
  show.value = false
  emit('dismiss')
}

const typeClasses = computed(() => {
  const classes = {
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    success: 'border-green-200 bg-green-50',
    info: 'border-blue-200 bg-blue-50'
  }
  return classes[props.type]
})

const icon = computed(() => {
  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info
  }
  return icons[props.type]
})

const iconClass = computed(() => {
  const classes = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    success: 'text-green-400',
    info: 'text-blue-400'
  }
  return classes[props.type]
})

const titleClass = computed(() => {
  const classes = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    success: 'text-green-800',
    info: 'text-blue-800'
  }
  return classes[props.type]
})

const messageClass = computed(() => {
  const classes = {
    error: 'text-red-700',
    warning: 'text-yellow-700',
    success: 'text-green-700',
    info: 'text-blue-700'
  }
  return classes[props.type]
})

const actionClass = computed(() => {
  const classes = {
    error: 'text-red-700 hover:text-red-600',
    warning: 'text-yellow-700 hover:text-yellow-600',
    success: 'text-green-700 hover:text-green-600',
    info: 'text-blue-700 hover:text-blue-600'
  }
  return classes[props.type]
})

const closeButtonClass = computed(() => {
  const classes = {
    error: 'text-red-400 hover:text-red-500 focus:ring-red-500',
    warning: 'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500',
    success: 'text-green-400 hover:text-green-500 focus:ring-green-500',
    info: 'text-blue-400 hover:text-blue-500 focus:ring-blue-500'
  }
  return classes[props.type]
})
</script>
