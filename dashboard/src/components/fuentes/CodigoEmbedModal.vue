<template>
  <div v-if="fuente" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Código de Integración</h2>
          <p class="text-sm text-gray-600 mt-1">{{ fuente.nombre }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-full"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="tabActivo = tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              tabActivo === tab.id
                ? 'border-uniacc-primary text-uniacc-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4 inline mr-2" />
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- JavaScript Embed -->
        <div v-if="tabActivo === 'javascript'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">JavaScript Embed</h3>
            <button
              @click="copiarCodigo(codigoJavaScript)"
              class="btn-secondary text-sm"
            >
              <Copy class="w-4 h-4 mr-1" />
              Copiar
            </button>
          </div>
          
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-green-400 text-sm"><code>{{ codigoJavaScript }}</code></pre>
          </div>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 mb-2">📝 Instrucciones:</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• Copia el código y pégalo en tu sitio web</li>
              <li>• El formulario aparecerá automáticamente</li>
              <li>• Los leads se enviarán a tu dashboard</li>
            </ul>
          </div>
        </div>

        <!-- HTML Form -->
        <div v-if="tabActivo === 'html'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Formulario HTML</h3>
            <button
              @click="copiarCodigo(codigoHTML)"
              class="btn-secondary text-sm"
            >
              <Copy class="w-4 h-4 mr-1" />
              Copiar
            </button>
          </div>
          
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-green-400 text-sm"><code>{{ codigoHTML }}</code></pre>
          </div>
          
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 class="font-medium text-green-900 mb-2">✅ Ventajas del HTML directo:</h4>
            <ul class="text-sm text-green-800 space-y-1">
              <li>• Control total sobre el estilo y diseño</li>
              <li>• Mayor velocidad de carga</li>
              <li>• Fácil personalización con CSS</li>
            </ul>
          </div>
        </div>

        <!-- React Component -->
        <div v-if="tabActivo === 'react'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Componente React</h3>
            <button
              @click="copiarCodigo(codigoReact)"
              class="btn-secondary text-sm"
            >
              <Copy class="w-4 h-4 mr-1" />
              Copiar
            </button>
          </div>
          
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-green-400 text-sm"><code>{{ codigoReact }}</code></pre>
          </div>
        </div>

        <!-- WordPress Plugin -->
        <div v-if="tabActivo === 'wordpress'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Shortcode WordPress</h3>
            <button
              @click="copiarCodigo(codigoWordPress)"
              class="btn-secondary text-sm"
            >
              <Copy class="w-4 h-4 mr-1" />
              Copiar
            </button>
          </div>
          
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-green-400 text-sm"><code>{{ codigoWordPress }}</code></pre>
          </div>
        </div>

        <!-- Vista previa -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 border-t border-gray-200 pt-6">
            Vista Previa del Formulario
          </h3>
          
          <div class="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <form class="space-y-4 max-w-md">
              <div v-for="campo in camposRequeridos" :key="campo" class="space-y-1">
                <label :for="campo" class="block text-sm font-medium text-gray-700">
                  {{ getCampoLabel(campo) }}
                </label>
                
                <select
                  v-if="campo === 'carrera_interes'"
                  :id="campo"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-uniacc-primary focus:border-transparent"
                >
                  <option value="">Seleccionar carrera</option>
                  <option value="comunicacion-audiovisual">Comunicación Audiovisual</option>
                  <option value="periodismo">Periodismo</option>
                  <option value="arquitectura">Arquitectura</option>
                </select>
                
                <input
                  v-else
                  :id="campo"
                  :type="getCampoTipo(campo)"
                  :placeholder="getCampoPlaceholder(campo)"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-uniacc-primary focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                class="w-full bg-uniacc-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Enviar Información
              </button>
            </form>
          </div>
        </div>

        <!-- Configuración UTM -->
        <div class="space-y-4 border-t border-gray-200 pt-6">
          <h3 class="text-lg font-semibold text-gray-900">Parámetros UTM Configurados</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <span class="text-sm font-medium text-gray-700">UTM Source:</span>
              <p class="text-sm text-gray-900">{{ fuente.utm_source || 'No definido' }}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <span class="text-sm font-medium text-gray-700">UTM Medium:</span>
              <p class="text-sm text-gray-900">{{ fuente.utm_medium || 'No definido' }}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <span class="text-sm font-medium text-gray-700">UTM Campaign:</span>
              <p class="text-sm text-gray-900">{{ fuente.utm_campaign || 'No definido' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          @click="$emit('close')"
          class="btn-secondary"
        >
          Cerrar
        </button>
        <a
          :href="linkDocumentacion"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-primary inline-flex items-center"
        >
          <ExternalLink class="w-4 h-4 mr-2" />
          Ver Documentación
        </a>
      </div>
    </div>

    <!-- Toast de éxito -->
    <div
      v-if="showCopySuccess"
      class="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
    >
      ✅ Código copiado al portapapeles
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, ExternalLink, Code, Braces, FileCode, FileText, X } from 'lucide-vue-next'

interface FuenteLead {
  id: string
  nombre: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  campos_requeridos?: string[]
  configuracion?: {
    tema?: string
  }
}

const props = defineProps<{
  fuente: FuenteLead | null
}>()

const emit = defineEmits<{
  close: []
}>()

const tabActivo = ref('javascript')
const showCopySuccess = ref(false)

const tabs = [
  { id: 'javascript', name: 'JavaScript', icon: Code },
  { id: 'html', name: 'HTML', icon: FileCode },
  { id: 'react', name: 'React', icon: Braces },
  { id: 'wordpress', name: 'WordPress', icon: FileText }
]

const camposRequeridos = computed(() => props.fuente?.campos_requeridos || [])

// Generar códigos usando funciones separadas para evitar problemas con template literals
const codigoJavaScript = computed(() => {
  if (!props.fuente) return ''
  
  const sourceId = props.fuente.id
  const theme = props.fuente.configuracion?.tema || 'uniacc'
  const utmSource = props.fuente.utm_source || ''
  const utmMedium = props.fuente.utm_medium || ''
  const utmCampaign = props.fuente.utm_campaign || ''

  return `<!-- Formulario UNIACC -->
<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://forms.uniacc.cl/embed.js';
  script.dataset.source = '${sourceId}';
  script.dataset.theme = '${theme}';
  script.dataset.utm_source = '${utmSource}';
  script.dataset.utm_medium = '${utmMedium}';
  script.dataset.utm_campaign = '${utmCampaign}';
  document.head.appendChild(script);
})();
<\/script>

<!-- Contenedor del formulario -->
<div id="uniacc-form-${sourceId}"></div>`
})

const codigoHTML = computed(() => {
  if (!props.fuente) return ''
  
  const campos = camposRequeridos.value.map(campo => {
    const tipo = getCampoTipo(campo)
    const label = getCampoLabel(campo)
    const placeholder = getCampoPlaceholder(campo)
    
    if (campo === 'carrera_interes') {
      return `    <div class="form-group">
      <label for="${campo}">${label}</label>
      <select id="${campo}" name="${campo}" required>
        <option value="">Seleccionar carrera</option>
        <option value="comunicacion-audiovisual">Comunicación Audiovisual</option>
        <option value="periodismo">Periodismo</option>
        <option value="arquitectura">Arquitectura</option>
      </select>
    </div>`
    }
    
    return `    <div class="form-group">
      <label for="${campo}">${label}</label>
      <input type="${tipo}" id="${campo}" name="${campo}" placeholder="${placeholder}" required>
    </div>`
  }).join('\n')

  const sourceId = props.fuente.id
  const utmSource = props.fuente.utm_source || ''
  const utmMedium = props.fuente.utm_medium || ''
  const utmCampaign = props.fuente.utm_campaign || ''

  return `<form id="uniacc-form" action="https://api.uniacc.cl/leads" method="POST">
  <input type="hidden" name="source_id" value="${sourceId}">
  <input type="hidden" name="utm_source" value="${utmSource}">
  <input type="hidden" name="utm_medium" value="${utmMedium}">
  <input type="hidden" name="utm_campaign" value="${utmCampaign}">
  
${campos}
  
  <button type="submit">Enviar Información</button>
</form>`
})

const codigoReact = computed(() => {
  if (!props.fuente) return ''
  
  return `import React, { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('https://api.uniacc.cl/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sourceId: '${props.fuente.id}',
          utm_source: '${props.fuente.utm_source || ''}',
          utm_medium: '${props.fuente.utm_medium || ''}',
          utm_campaign: '${props.fuente.utm_campaign || ''}'
        })
      });
      
      if (response.ok) {
        console.log('Lead enviado exitosamente');
        setFormData({});
      }
    } catch (error) {
      console.error('Error enviando lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="uniacc-form">
      {/* Campos del formulario aquí */}
      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar Información'}
      </button>
    </form>
  );
}

export default ContactForm;`
})

const codigoWordPress = computed(() => {
  if (!props.fuente) return ''
  
  const atributos = [
    `source="${props.fuente.id}"`,
    `theme="${props.fuente.configuracion?.tema || 'uniacc'}"`,
    props.fuente.utm_source ? `utm_source="${props.fuente.utm_source}"` : '',
    props.fuente.utm_medium ? `utm_medium="${props.fuente.utm_medium}"` : '',
    props.fuente.utm_campaign ? `utm_campaign="${props.fuente.utm_campaign}"` : ''
  ].filter(Boolean).join(' ')

  return `[uniacc_form ${atributos}]

<!-- Personalización adicional -->
[uniacc_form 
  source="${props.fuente.id}" 
  theme="${props.fuente.configuracion?.tema || 'uniacc'}"
  title="Información UNIACC"
  button_text="Enviar"
]`
})

const linkDocumentacion = computed(() => 
  `https://docs.uniacc.cl/integraciones/formularios?source=${props.fuente?.id}`
)

// Métodos
const copiarCodigo = async (codigo: string) => {
  try {
    await navigator.clipboard.writeText(codigo)
    showCopySuccess.value = true
    setTimeout(() => {
      showCopySuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('Error copiando código:', error)
  }
}

// Utilidades
const getCampoLabel = (campo: string): string => {
  const labels = {
    nombre: 'Nombre completo',
    email: 'Correo electrónico',
    telefono: 'Teléfono',
    whatsapp: 'WhatsApp',
    carrera_interes: 'Carrera de interés',
    nivel_interes: 'Nivel de interés',
    edad: 'Edad',
    ocupacion: 'Ocupación',
    ciudad: 'Ciudad',
    comentarios: 'Comentarios'
  } as Record<string, string>
  
  return labels[campo] || campo
}

const getCampoTipo = (campo: string): string => {
  const tipos = {
    email: 'email',
    telefono: 'tel',
    whatsapp: 'tel',
    edad: 'number'
  } as Record<string, string>
  
  return tipos[campo] || 'text'
}

const getCampoPlaceholder = (campo: string): string => {
  const placeholders = {
    nombre: 'Ej: Juan Pérez',
    email: 'ejemplo@correo.com',
    telefono: '+56 9 1234 5678',
    whatsapp: '+56 9 1234 5678',
    carrera_interes: 'Selecciona una carrera',
    nivel_interes: 'Nivel de interés',
    edad: 'Tu edad',
    ocupacion: 'Tu ocupación actual',
    ciudad: 'Tu ciudad',
    comentarios: 'Comentarios adicionales'
  } as Record<string, string>
  
  return placeholders[campo] || `Ingresa tu ${campo}`
}
</script>
