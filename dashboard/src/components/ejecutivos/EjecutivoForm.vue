<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Información básica -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Nombre completo *
        </label>
        <input
          v-model="form.nombre"
          type="text"
          required
          class="input-field w-full"
          placeholder="Juan Pérez"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Email corporativo *
        </label>
        <input
          v-model="form.email"
          type="email"
          required
          class="input-field w-full"
          placeholder="juan.perez@uniacc.cl"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Teléfono
        </label>
        <input
          v-model="form.telefono"
          type="tel"
          class="input-field w-full"
          placeholder="+56912345678"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          URL de Avatar
        </label>
        <input
          v-model="form.avatar_url"
          type="url"
          class="input-field w-full"
          placeholder="https://example.com/avatar.jpg"
        />
      </div>
    </div>

    <!-- Facultades asignadas -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Facultades asignadas
      </label>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label
          v-for="(facultad, key) in FACULTADES_UNIACC"
          :key="key"
          class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="checkbox"
            :value="key"
            v-model="form.facultades_asignadas"
            class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
          />
          <span class="text-sm">
            {{ facultad.emoji }} {{ key }}
          </span>
        </label>
      </div>
    </div>

    <!-- Especialidades -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Carreras de especialidad
      </label>
      <div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
        <label
          v-for="carrera in carrerasDisponibles"
          :key="carrera"
          class="flex items-center space-x-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
        >
          <input
            type="checkbox"
            :value="carrera"
            v-model="form.especialidades"
            class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
          />
          <span>{{ carrera }}</span>
        </label>
      </div>
    </div>

    <!-- Configuración de trabajo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Máximo prospectos simultáneos
        </label>
        <input
          v-model.number="form.max_prospectos_simultaneos"
          type="number"
          min="1"
          max="50"
          class="input-field w-full"
        />
      </div>
      
      <div class="flex items-center space-x-6">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.auto_asignacion"
            type="checkbox"
            class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
          />
          <span class="text-sm text-gray-700">Auto-asignación</span>
        </label>
        
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.activo"
            type="checkbox"
            class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
          />
          <span class="text-sm text-gray-700">Activo</span>
        </label>
      </div>
      
      <div class="flex items-center space-x-6">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.notificaciones_email"
            type="checkbox"
            class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
          />
          <span class="text-sm text-gray-700">Notificaciones Email</span>
        </label>
        
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.notificaciones_push"
            type="checkbox"
            class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
          />
          <span class="text-sm text-gray-700">Notificaciones Push</span>
        </label>
      </div>
    </div>

    <!-- Horario de trabajo -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Horario de trabajo
      </label>
      <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div
          v-for="dia in diasSemana"
          :key="dia.key"
          class="space-y-2"
        >
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              v-model="diasActivos[dia.key]"
              type="checkbox"
              class="w-4 h-4 text-uniacc-primary focus:ring-uniacc-primary border-gray-300 rounded"
            />
            <span class="text-sm font-medium">{{ dia.label }}</span>
          </label>
          
          <div v-if="diasActivos[dia.key]" class="space-y-1">
            <input
              v-model="form.horario_trabajo![dia.key]!.inicio"
              type="time"
              class="input-field w-full text-xs"
              placeholder="09:00"
            />
            <input
              v-model="form.horario_trabajo![dia.key]!.fin"
              type="time"
              class="input-field w-full text-xs"
              placeholder="18:00"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Botones -->
    <div class="flex justify-end space-x-3 pt-6 border-t">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn-secondary"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn-primary"
        :disabled="loading"
      >
        {{ loading ? 'Guardando...' : (mode === 'create' ? 'Crear Ejecutivo' : 'Actualizar') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { FACULTADES_UNIACC } from '@/utils/constants'
import type { Ejecutivo, CreateEjecutivo, UpdateEjecutivo } from '@/types'

interface Props {
  ejecutivo?: Ejecutivo | null
  mode: 'create' | 'edit'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [data: CreateEjecutivo | UpdateEjecutivo]
  cancel: []
}>()

// Estado
const loading = ref(false)

// Días de la semana para el horario
const diasSemana = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
  { key: 'sabado', label: 'Sáb' },
  { key: 'domingo', label: 'Dom' }
] as const

// Estado para controlar qué días están activos
const diasActivos = ref<Record<string, boolean>>({
  lunes: true,
  martes: true,
  miercoles: true,
  jueves: true,
  viernes: true,
  sabado: false,
  domingo: false
})

// Formulario
const form = ref<CreateEjecutivo & { horario_trabajo: NonNullable<CreateEjecutivo['horario_trabajo']> }>({
  nombre: '',
  email: '',
  telefono: '',
  avatar_url: '',
  facultades_asignadas: [],
  especialidades: [],
  activo: true,
  disponible: true,
  max_prospectos_simultaneos: 10,
  auto_asignacion: true,
  notificaciones_email: true,
  notificaciones_push: true,
  horario_trabajo: {
    lunes: { inicio: '09:00', fin: '18:00' },
    martes: { inicio: '09:00', fin: '18:00' },
    miercoles: { inicio: '09:00', fin: '18:00' },
    jueves: { inicio: '09:00', fin: '18:00' },
    viernes: { inicio: '09:00', fin: '17:00' },
    sabado: undefined,
    domingo: undefined
  }
})

// Computed
const carrerasDisponibles = computed(() => {
  if (!form.value.facultades_asignadas?.length) return []
  
  return form.value.facultades_asignadas.flatMap(facultad => 
    FACULTADES_UNIACC[facultad as keyof typeof FACULTADES_UNIACC]?.carreras || []
  )
})

// Watchers
watch(diasActivos, (newDias) => {
  // Agregar/quitar días del horario según estén activos
  Object.keys(newDias).forEach(dia => {
    const diaKey = dia as keyof typeof form.value.horario_trabajo
    
    if (newDias[dia] && !form.value.horario_trabajo[diaKey]) {
      form.value.horario_trabajo[diaKey] = { inicio: '09:00', fin: '18:00' }
    } else if (!newDias[dia] && form.value.horario_trabajo[diaKey]) {
      form.value.horario_trabajo[diaKey] = undefined
    }
  })
}, { deep: true })

// Watcher para limpiar especialidades cuando cambian facultades
watch(() => form.value.facultades_asignadas, () => {
  // Filtrar especialidades que ya no son válidas
  const carrerasValidas = carrerasDisponibles.value
  form.value.especialidades = form.value.especialidades?.filter(
    carrera => carrerasValidas.includes(carrera)
  ) || []
})

// Métodos
const handleSubmit = async () => {
  loading.value = true
  
  try {
    // Limpiar horarios de días inactivos
    const horarioLimpio = { ...form.value.horario_trabajo }
    Object.keys(horarioLimpio).forEach(dia => {
      const diaKey = dia as keyof typeof horarioLimpio
      if (!diasActivos.value[dia]) {
        horarioLimpio[diaKey] = undefined
      }
    })

    const data = {
      ...form.value,
      horario_trabajo: horarioLimpio
    }

    emit('save', data)
  } finally {
    loading.value = false
  }
}

const loadEjecutivo = () => {
  if (props.ejecutivo && props.mode === 'edit') {
    // Cargar datos del ejecutivo existente
    const ejecutivo = props.ejecutivo
    
    form.value = {
      nombre: ejecutivo.nombre,
      email: ejecutivo.email,
      telefono: ejecutivo.telefono || '',
      avatar_url: ejecutivo.avatar_url || '',
      facultades_asignadas: ejecutivo.facultades_asignadas || [],
      especialidades: ejecutivo.especialidades || [],
      activo: ejecutivo.activo,
      disponible: ejecutivo.disponible,
      max_prospectos_simultaneos: ejecutivo.max_prospectos_simultaneos,
      auto_asignacion: ejecutivo.auto_asignacion,
      notificaciones_email: ejecutivo.notificaciones_email,
      notificaciones_push: ejecutivo.notificaciones_push,
      horario_trabajo: ejecutivo.horario_trabajo || {
        lunes: { inicio: '09:00', fin: '18:00' },
        martes: { inicio: '09:00', fin: '18:00' },
        miercoles: { inicio: '09:00', fin: '18:00' },
        jueves: { inicio: '09:00', fin: '18:00' },
        viernes: { inicio: '09:00', fin: '17:00' }
      }
    }

    // Actualizar días activos según el horario
    Object.keys(diasActivos.value).forEach(dia => {
      const diaKey = dia as keyof typeof ejecutivo.horario_trabajo
      diasActivos.value[dia] = !!(ejecutivo.horario_trabajo?.[diaKey])
    })
  }
}

// Lifecycle
onMounted(loadEjecutivo)

// Watcher para recargar cuando cambie el ejecutivo
watch(() => props.ejecutivo, loadEjecutivo)
</script>
