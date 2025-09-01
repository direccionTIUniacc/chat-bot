<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Prospectos</h1>
        <p class="text-gray-600">Gestiona los prospectos generados por el ChatBot</p>
      </div>
      <button 
        @click="prospectosStore.openModal('create')"
        class="btn-primary"
      >
        <Plus class="w-4 h-4 mr-2" />
        Nuevo Prospecto
      </button>
    </div>

    <!-- Filtros y búsqueda -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por nombre o email..."
          class="input-field"
          @input="handleSearch"
        />
        
        <select
          v-model="selectedStatus"
          class="input-field"
          @change="handleFilterChange"
        >
          <option value="">Todos los estados</option>
          <option value="nuevo">Nuevo</option>
          <option value="contactado">Contactado</option>
          <option value="interesado">Interesado</option>
          <option value="matriculado">Matriculado</option>
          <option value="descartado">Descartado</option>
        </select>
        
        <select
          v-model="selectedSource"
          class="input-field"
          @change="handleFilterChange"
        >
          <option value="">Todas las fuentes</option>
          <option value="chatbot">ChatBot</option>
          <option value="web">Sitio Web</option>
          <option value="social">Redes Sociales</option>
          <option value="referido">Referido</option>
        </select>
        
        <select
          v-model="selectedTipoConsulta"
          class="input-field"
          @change="handleFilterChange"
        >
          <option value="">Todos los tipos</option>
          <option value="solicitud de asesor" class="text-red-600 font-bold">🚨 URGENTE - Solicitud de Asesor</option>
          <option value="consulta carrera">Consulta Carrera</option>
          <option value="consulta proceso admision">Consulta Proceso Admisión</option>
          <option value="consulta costos y/o becas">Consulta Costos y/o Becas</option>
          <option value="consulta de modalidades de estudio">Consulta de Modalidades de Estudio</option>
          <option value="consulta general">Consulta General</option>
        </select>
        
        <button
          @click="clearFilters"
          class="btn-secondary"
        >
          <FilterX class="w-4 h-4 mr-2" />
          Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Tabla de prospectos -->
    <div class="card">
      <LoadingSpinner 
        v-if="prospectosStore.loading" 
        text="Cargando prospectos..."
        container-class="py-12"
      />
      
      <div v-else-if="prospectosStore.prospectos.length === 0" class="text-center py-12">
        <Users class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No hay prospectos</h3>
        <p class="text-gray-500 mb-4">Comienza creando tu primer prospecto</p>
        <button 
          @click="prospectosStore.openModal('create')"
          class="btn-primary"
        >
          Crear Prospecto
        </button>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prospecto
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consulta
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carrera
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fuente
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="prospecto in prospectosStore.prospectos" 
              :key="prospecto.whatsapp"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ prospecto.nombre }}
                  </div>
                  <div class="text-sm text-gray-500">{{ prospecto.email }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatTipoConsulta((prospecto as any).tipo_consulta_actual || (prospecto as any).tipo_consulta) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ prospecto.carrera_interes || 'No especificada' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col gap-1">
                  <span :class="[
                    'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                    getStatusColor(prospecto.estado)
                  ]">
                    {{ formatStatus(prospecto.estado) }}
                  </span>
                  <span v-if="(prospecto as any).nivel_interes === 'urgente'" 
                    class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 animate-pulse">
                    🚨 URGENTE
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                  getSourceColor(prospecto.fuente || 'uniacc_chatbot')
                ]">
                  {{ formatSource(prospecto.fuente || 'uniacc_chatbot') }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDateTimeChile((prospecto as any).primera_interaccion || (prospecto as any).created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end items-center space-x-1">
                  <!-- 🚀 CONTACTO DIRECTO INTELIGENTE -->
                  
                  <!-- 📱 WhatsApp Inteligente -->
                  <button
                    @click="contactarWhatsAppInteligente(prospecto)"
                    :class="[
                      'p-2 rounded-full transition-all duration-200 relative group',
                      (prospecto as any).nivel_interes === 'urgente' 
                        ? 'bg-red-100 text-red-600 animate-pulse hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    ]"
                    :title="`WhatsApp: ${prospecto.nombre} (${prospecto.estado})`"
                  >
                    <MessageCircle class="w-4 h-4" />
                    <!-- Badge de urgencia -->
                    <span 
                      v-if="(prospecto as any).nivel_interes === 'urgente'"
                      class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                    ></span>
                  </button>
                  
                  <!-- 📞 Llamada Inteligente -->
                  <button
                    @click="llamarDirectoInteligente(prospecto)"
                    :class="[
                      'p-2 rounded-full transition-all duration-200',
                      esMejorHorario(prospecto) 
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    ]"
                    :title="esMejorHorario(prospecto) ? `Llamar a ${prospecto.nombre} (buen momento)` : `Llamar a ${prospecto.nombre} (fuera de horario óptimo)`"
                  >
                    <Phone class="w-4 h-4" />
                    <!-- Indicador de horario óptimo -->
                    <Clock 
                      v-if="!esMejorHorario(prospecto)"
                      class="absolute -top-1 -right-1 w-2 h-2 text-orange-500"
                    />
                  </button>
                  
                  <!-- 📧 Email Contextual -->
                  <button
                    v-if="prospecto.email"
                    @click="enviarEmailContextual(prospecto)"
                    class="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all duration-200"
                    :title="`Email: ${prospecto.email}`"
                  >
                    <Mail class="w-4 h-4" />
                  </button>
                  
                  <!-- Separador visual -->
                  <div class="w-px h-4 bg-gray-300 mx-1"></div>
                  
                  <!-- 👁️ Ver Perfil Completo -->
                  <button
                    @click="verPerfilCompleto(prospecto)"
                    class="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200"
                    title="Ver perfil completo"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  
                  <!-- ⚙️ Más Acciones -->
                  <div class="relative">
                    <button 
                      @click="toggleDropdown((prospecto as any).whatsapp || prospecto.id)"
                      class="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                      title="Más acciones"
                    >
                      <MoreVertical class="w-4 h-4" />
                    </button>
                    
                    <!-- Dropdown de acciones adicionales -->
                    <div 
                      v-if="activeDropdown === ((prospecto as any).whatsapp || prospecto.id)" 
                      class="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                    >
                      <div class="py-1">
                        <button
                          @click="prospectosStore.openModal('edit', prospecto); activeDropdown = null"
                          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          ✏️ Editar Datos
                        </button>
                        <button
                          @click="handleDelete((prospecto as any).whatsapp || prospecto.id); activeDropdown = null"
                          class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          🗑️ Eliminar
                        </button>
                        <hr class="my-1">
                        <button
                          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          disabled
                        >
                          📅 Programar Seguimiento
                        </button>
                        <button
                          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          disabled
                        >
                          👤 Asignar Ejecutivo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="prospectosStore.pagination.totalPages > 1" class="flex justify-center">
      <nav class="flex space-x-2">
        <button
          v-for="page in paginationPages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-md',
            page === prospectosStore.pagination.page
              ? 'bg-uniacc-primary text-white'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          {{ page }}
        </button>
      </nav>
    </div>

    <!-- Modal de Detalle del Prospecto -->
    <ProspectoDetailModal
      :show="showDetailModal"
      :prospecto="selectedProspecto"
      @close="cerrarModal"
      @reactivar="reactivarCaptura"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Users, Eye, Edit, Trash2, FilterX, MessageCircle, Phone, Mail, MoreVertical, Clock } from 'lucide-vue-next'
import { useProspectosStore } from '@/stores/prospectos'
import { formatDate, formatStatus, formatSource, formatTipoConsulta, formatDateTimeChile } from '@/utils/formatters'
import { PROSPECTO_ESTADOS_COLORS, PROSPECTO_FUENTES_COLORS } from '@/utils/constants'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ProspectoDetailModal from '@/components/prospectos/ProspectoDetailModal.vue'
import { 
  generarMensajeWhatsApp, 
  validarHorarioLaboral, 
  calcularMejorHorario, 
  calcularConfianzaContacto,
  limpiarNumero,
  generarEmailContextual,
  registrarAccion,
  type ProspectoContacto,
  type UsuarioActual
} from '@/utils/contacto-inteligente'

// Store
const prospectosStore = useProspectosStore()

// Estado local
const searchTerm = ref('')
const selectedStatus = ref('')
const selectedSource = ref('')
const selectedTipoConsulta = ref('')

// Estado para contacto inteligente
const activeDropdown = ref<string | null>(null)
const currentUser = ref<UsuarioActual>({
  id: 'current-user-id', // TODO: Obtener del store de autenticación
  nombre: 'Ejecutivo UNIACC', // TODO: Obtener del store de autenticación
  email: 'ejecutivo@uniacc.cl' // TODO: Obtener del store de autenticación
})

// Estado para modal de detalle
const showDetailModal = ref(false)
const selectedProspecto = ref<any>(null)

// Computed
const paginationPages = computed(() => {
  const total = prospectosStore.pagination.totalPages
  const current = prospectosStore.pagination.page
  const pages = []
  
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Métodos
const handleSearch = () => {
  prospectosStore.applyFilters({ search: searchTerm.value })
}

const handleFilterChange = () => {
  prospectosStore.applyFilters({
    status: selectedStatus.value,
    source: selectedSource.value,
    // tipo_consulta: selectedTipoConsulta.value  // Temporalmente deshabilitado
  })
}

const clearFilters = () => {
  searchTerm.value = ''
  selectedStatus.value = ''
  selectedSource.value = ''
  selectedTipoConsulta.value = ''
  prospectosStore.resetFilters()
}

const goToPage = (page: number) => {
  prospectosStore.goToPage(page)
}

// 🚀 FUNCIONES DE CONTACTO INTELIGENTE
const contactarWhatsAppInteligente = async (prospecto: any) => {
  const prospectoContacto: ProspectoContacto = {
    whatsapp: prospecto.whatsapp,
    telefono: prospecto.telefono,
    nombre: prospecto.nombre,
    email: prospecto.email,
    carrera_interes: prospecto.carrera_interes,
    estado: prospecto.estado,
    nivel_interes: (prospecto as any).nivel_interes,
    perfil_usuario: (prospecto as any).perfil_usuario,
    tipo_consulta_actual: (prospecto as any).tipo_consulta_actual,
    primera_interaccion: (prospecto as any).primera_interaccion,
    ultima_interaccion: (prospecto as any).ultima_interaccion,
    total_sesiones: (prospecto as any).total_sesiones
  }
  
  const mensaje = generarMensajeWhatsApp(prospectoContacto, currentUser.value)
  const numero = limpiarNumero(prospecto.whatsapp || prospecto.telefono)
  
  if (!numero) {
    alert('❌ Este prospecto no tiene número de WhatsApp registrado')
    return
  }
  
  // Abrir WhatsApp
  const whatsappURL = `https://wa.me/${numero.replace('+', '')}?text=${encodeURIComponent(mensaje)}`
  window.open(whatsappURL, '_blank')
  
  // Registrar acción
  await registrarAccion(prospectoContacto, 'whatsapp_directo', {
    mensaje_enviado: mensaje,
    ejecutivo: currentUser.value.id,
    numero_contactado: numero,
    timestamp: new Date()
  })
  
  // Mostrar confirmación
  console.log(`📱 WhatsApp enviado a ${prospecto.nombre}: ${mensaje}`)
}

const llamarDirectoInteligente = async (prospecto: any) => {
  const prospectoContacto: ProspectoContacto = {
    whatsapp: prospecto.whatsapp,
    telefono: prospecto.telefono,
    nombre: prospecto.nombre,
    primera_interaccion: (prospecto as any).primera_interaccion,
    nivel_interes: (prospecto as any).nivel_interes
  }
  
  const ahora = new Date()
  const esHorarioLaboral = validarHorarioLaboral(ahora)
  const mejorHorario = calcularMejorHorario(prospectoContacto)
  const confidence = calcularConfianzaContacto(prospectoContacto, ahora)
  
  if (!esHorarioLaboral) {
    const confirmar = confirm(
      `⏰ Estamos fuera del horario laboral.\n\n${prospecto.nombre} responde mejor ${mejorHorario}.\n\n¿Quieres llamar de todos modos?`
    )
    if (!confirmar) return
  }
  
  if (confidence < 0.7) {
    const confirmar = confirm(
      `⚠️ Según nuestros datos, ${prospecto.nombre} responde mejor ${mejorHorario}.\n\nConfianza de contacto: ${Math.round(confidence * 100)}%\n\n¿Quieres llamar ahora de todos modos?`
    )
    if (!confirmar) return
  }
  
  const numero = prospectoContacto.telefono || prospectoContacto.whatsapp
  if (!numero) {
    alert('❌ Este prospecto no tiene número de teléfono registrado')
    return
  }
  
  // Iniciar llamada
  window.open(`tel:${numero}`)
  
  // Registrar acción
  await registrarAccion(prospectoContacto, 'llamada_directa', {
    numero_llamado: numero,
    ejecutivo: currentUser.value.id,
    horario_llamada: ahora,
    confidence_score: confidence,
    timestamp: new Date()
  })
  
  // Programar modal de seguimiento (después de unos segundos)
  const timeoutId = setTimeout(() => {
    const resultado = prompt(
      `📞 Llamada a ${prospecto.nombre}\n\n¿Cómo fue la llamada?\n\n1. Exitosa - Respondió\n2. No respondió\n3. Buzón de voz\n4. Número no válido\n\nEscribe el número (1-4) y opcionalmente agrega notas:`
    )
    
    if (resultado) {
      const resultados = {
        '1': 'exitosa_respondio',
        '2': 'no_respondio', 
        '3': 'buzon_voz',
        '4': 'numero_invalido'
      }
      
      console.log(`📞 Resultado llamada: ${resultado}`)
      // TODO: Guardar resultado en BD
    }
  }, 5000) // 5 segundos después
  
  // Guardar referencia para poder cancelarlo si es necesario
  // (opcional: se podría implementar un sistema de cancelación)
}

const enviarEmailContextual = async (prospecto: any) => {
  if (!prospecto.email) {
    alert('❌ Este prospecto no tiene email registrado')
    return
  }
  
  const prospectoContacto: ProspectoContacto = {
    nombre: prospecto.nombre,
    email: prospecto.email,
    carrera_interes: prospecto.carrera_interes,
    estado: prospecto.estado,
    nivel_interes: (prospecto as any).nivel_interes,
    tipo_consulta_actual: (prospecto as any).tipo_consulta_actual
  }
  
  const emailData = generarEmailContextual(prospectoContacto, currentUser.value)
  
  // Abrir cliente de email
  const mailtoLink = `mailto:${prospecto.email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`
  window.open(mailtoLink)
  
  // Registrar acción
  await registrarAccion(prospectoContacto, 'email_enviado', {
    email_destinatario: prospecto.email,
    template_usado: emailData.template,
    subject: emailData.subject,
    ejecutivo: currentUser.value.id,
    timestamp: new Date()
  })
  
  console.log(`📧 Email enviado a ${prospecto.nombre}: ${emailData.subject}`)
}

const toggleDropdown = (prospectoId: string) => {
  activeDropdown.value = activeDropdown.value === prospectoId ? null : prospectoId
}

const esMejorHorario = (prospecto: any): boolean => {
  const prospectoContacto: ProspectoContacto = {
    primera_interaccion: (prospecto as any).primera_interaccion,
    nivel_interes: (prospecto as any).nivel_interes
  }
  
  const confidence = calcularConfianzaContacto(prospectoContacto)
  return confidence >= 0.7
}

// 📋 FUNCIONES PARA MODAL DE DETALLE
const verPerfilCompleto = (prospecto: any) => {
  selectedProspecto.value = prospecto
  showDetailModal.value = true
  // Cerrar dropdown si está abierto
  activeDropdown.value = null
}

const cerrarModal = () => {
  showDetailModal.value = false
  selectedProspecto.value = null
}

const reactivarCaptura = async (prospecto: any) => {
  console.log('🔄 Reactivando captura para:', prospecto.nombre)
  // TODO: Implementar lógica de reactivación
  // Esto podría enviar un WhatsApp automático o cambiar el estado
  
  // Ejemplo de implementación:
  try {
    // Cambiar estado del prospecto
    // await prospectosStore.updateProspecto(prospecto.id, { estado: 'reactivado' })
    
    // Enviar mensaje de reactivación automático
    await contactarWhatsAppInteligente(prospecto)
    
    // Cerrar modal
    cerrarModal()
    
    // Mostrar confirmación
    alert(`✅ Captura reactivada para ${prospecto.nombre}`)
  } catch (error) {
    console.error('Error reactivando captura:', error)
    alert('❌ Error al reactivar la captura')
  }
}

const handleDelete = async (id: string) => {
  if (confirm('¿Estás seguro de que deseas eliminar este prospecto?')) {
    await prospectosStore.removeProspecto(id)
  }
}

const getStatusColor = (estado: string) => {
  return PROSPECTO_ESTADOS_COLORS[estado as keyof typeof PROSPECTO_ESTADOS_COLORS] || 'bg-gray-100 text-gray-800'
}

const getSourceColor = (fuente: string) => {
  return PROSPECTO_FUENTES_COLORS[fuente as keyof typeof PROSPECTO_FUENTES_COLORS] || 'bg-gray-100 text-gray-800'
}

// Cerrar dropdown al hacer clic fuera
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    activeDropdown.value = null
  }
}

// Lifecycle
onMounted(() => {
  prospectosStore.initialize()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
