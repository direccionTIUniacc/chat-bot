import { ref, computed } from 'vue'
import { useSupabase } from './useSupabase'
import { useProspectos } from './useProspectos'
import type { 
  ApiResponse,
  Prospecto,
  CreateProspecto
} from '@/types'

// Tipos específicos para fuentes de leads
export interface FuenteLead {
  id: string
  nombre: string
  tipo: 'formulario_web' | 'landing_page' | 'facebook_ads' | 'google_ads' | 'whatsapp_bot' | 'referido'
  url?: string
  activa: boolean
  configuracion: Record<string, any>
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  
  // Estadísticas
  total_leads: number
  leads_hoy: number
  tasa_conversion: number
  costo_por_lead?: number
  
  // Configuración específica
  campos_requeridos: string[]
  campos_opcionales: string[]
  mensaje_gracias?: string
  redirect_url?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface FormularioWeb {
  id: string
  fuente_id: string
  nombre: string
  descripcion?: string
  activo: boolean
  
  // Configuración visual
  tema: 'light' | 'dark' | 'uniacc'
  colores: {
    primario: string
    secundario: string
    fondo: string
    texto: string
  }
  
  // Campos del formulario
  campos: CampoFormulario[]
  
  // Configuración de comportamiento
  mostrar_carreras: boolean
  permitir_multiple_carreras: boolean
  requerir_telefono: boolean
  enviar_email_confirmacion: boolean
  
  // Integración
  webhook_url?: string
  script_embed: string
  
  // Estadísticas
  visualizaciones: number
  envios: number
  tasa_conversion: number
  
  created_at: string
  updated_at: string
}

export interface CampoFormulario {
  id: string
  nombre: string
  tipo: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox' | 'radio'
  etiqueta: string
  placeholder?: string
  requerido: boolean
  opciones?: string[] // Para select, radio, checkbox
  orden: number
  validacion?: {
    min_length?: number
    max_length?: number
    pattern?: string
    mensaje_error?: string
  }
}

export interface LandingPage {
  id: string
  fuente_id: string
  nombre: string
  slug: string // URL amigable
  activa: boolean
  
  // Contenido
  titulo: string
  subtitulo?: string
  descripcion: string
  imagen_hero?: string
  video_url?: string
  
  // CTA (Call to Action)
  cta_texto: string
  cta_color: string
  mostrar_testimonios: boolean
  mostrar_carreras_destacadas: boolean
  
  // SEO
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  
  // Configuración de conversión
  formulario_id: string
  pixel_facebook?: string
  google_analytics_id?: string
  google_tag_manager?: string
  
  // Estadísticas
  visitas: number
  conversiones: number
  tasa_conversion: number
  tiempo_promedio_pagina: number
  
  created_at: string
  updated_at: string
}

export interface CampanaAds {
  id: string
  fuente_id: string
  plataforma: 'facebook' | 'google' | 'instagram' | 'tiktok'
  nombre: string
  estado: 'activa' | 'pausada' | 'finalizada'
  
  // Configuración de la campaña
  presupuesto_diario?: number
  presupuesto_total?: number
  fecha_inicio: string
  fecha_fin?: string
  
  // Targeting
  audiencia_objetivo: {
    edad_min?: number
    edad_max?: number
    genero?: 'masculino' | 'femenino' | 'todos'
    ubicaciones?: string[]
    intereses?: string[]
    comportamientos?: string[]
  }
  
  // Creative
  titulo: string
  descripcion: string
  imagen_url?: string
  video_url?: string
  landing_page_id?: string
  
  // Tracking
  utm_campaign: string
  utm_content?: string
  pixel_conversion?: string
  
  // Estadísticas
  impresiones: number
  clics: number
  ctr: number // Click-through rate
  cpc: number // Costo por clic
  leads_generados: number
  costo_por_lead: number
  roas: number // Return on ad spend
  
  created_at: string
  updated_at: string
}

export interface LeadTracking {
  id: string
  prospecto_id: string
  fuente_id: string
  
  // Datos de sesión
  session_id: string
  ip_address: string
  user_agent: string
  referrer?: string
  
  // UTM y tracking
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  
  // Geolocalización
  pais?: string
  ciudad?: string
  region?: string
  
  // Datos del formulario
  formulario_id?: string
  landing_page_id?: string
  campana_id?: string
  
  // Timestamps
  primera_visita: string
  conversion: string
  created_at: string
}

export function useFuentesLeads() {
  const { supabase, handleSupabaseError, handleSupabaseSuccess } = useSupabase()
  const prospectos = useProspectos()
  
  // Estado reactivo
  const fuentes = ref<FuenteLead[]>([])
  const formularios = ref<FormularioWeb[]>([])
  const landingPages = ref<LandingPage[]>([])
  const campanas = ref<CampanaAds[]>([])
  const tracking = ref<LeadTracking[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Datos mock para desarrollo
  const mockFuentes: FuenteLead[] = [
    {
      id: '1',
      nombre: 'WhatsApp Bot Oficial',
      tipo: 'whatsapp_bot',
      activa: true,
      configuracion: {
        numero_telefono: '+56912345678',
        webhook_url: 'https://api.uniacc.cl/webhooks/whatsapp'
      },
      utm_source: 'whatsapp',
      utm_medium: 'bot',
      campos_requeridos: ['nombre', 'telefono'],
      campos_opcionales: ['email', 'carrera_interes'],
      total_leads: 1247,
      leads_hoy: 23,
      tasa_conversion: 34.5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-22T16:00:00Z'
    },
    {
      id: '2',
      nombre: 'Formulario Web Principal',
      tipo: 'formulario_web',
      url: 'https://uniacc.cl/contacto',
      activa: true,
      configuracion: {
        mostrar_carreras: true,
        tema: 'uniacc',
        redirect_after_submit: 'https://uniacc.cl/gracias'
      },
      utm_source: 'website',
      utm_medium: 'organic',
      campos_requeridos: ['nombre', 'email', 'telefono', 'carrera_interes'],
      campos_opcionales: ['nivel_interes', 'comentarios'],
      mensaje_gracias: '¡Gracias por tu interés! Nos contactaremos contigo pronto.',
      total_leads: 892,
      leads_hoy: 15,
      tasa_conversion: 28.7,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-22T14:30:00Z'
    },
    {
      id: '3',
      nombre: 'Campaña Facebook - Comunicaciones',
      tipo: 'facebook_ads',
      activa: true,
      configuracion: {
        campaign_id: 'fb_camp_001',
        ad_account_id: 'act_123456789',
        pixel_id: 'pixel_987654321'
      },
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'comunicaciones_2024',
      campos_requeridos: ['nombre', 'email', 'telefono'],
      campos_opcionales: ['edad', 'ocupacion'],
      total_leads: 456,
      leads_hoy: 8,
      tasa_conversion: 12.3,
      costo_por_lead: 15.75,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-22T16:45:00Z'
    },
    {
      id: '4',
      nombre: 'Google Ads - Carreras Técnicas',
      tipo: 'google_ads',
      activa: true,
      configuracion: {
        campaign_id: 'google_camp_001',
        account_id: 'acc_123456789',
        conversion_id: 'conv_987654321'
      },
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'carreras_tecnicas_2024',
      campos_requeridos: ['nombre', 'email', 'telefono', 'carrera_interes'],
      campos_opcionales: ['experiencia_previa'],
      total_leads: 321,
      leads_hoy: 12,
      tasa_conversion: 18.9,
      costo_por_lead: 22.40,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-22T15:20:00Z'
    },
    {
      id: '5',
      nombre: 'Landing Page - Arquitectura',
      tipo: 'landing_page',
      url: 'https://uniacc.cl/arquitectura-landing',
      activa: true,
      configuracion: {
        template: 'modern',
        show_testimonials: true,
        form_position: 'right'
      },
      utm_source: 'landing',
      utm_medium: 'direct',
      utm_campaign: 'arquitectura_promo',
      campos_requeridos: ['nombre', 'email', 'telefono'],
      campos_opcionales: ['nivel_educacion', 'experiencia'],
      total_leads: 178,
      leads_hoy: 5,
      tasa_conversion: 45.2,
      created_at: '2024-01-20T00:00:00Z',
      updated_at: '2024-01-22T13:15:00Z'
    }
  ]

  const mockFormularios: FormularioWeb[] = [
    {
      id: 'form_001',
      fuente_id: '2',
      nombre: 'Formulario Contacto Principal',
      descripcion: 'Formulario principal del sitio web para captar leads',
      activo: true,
      tema: 'uniacc',
      colores: {
        primario: '#1e40af',
        secundario: '#7c3aed',
        fondo: '#ffffff',
        texto: '#374151'
      },
      campos: [
        {
          id: 'campo_001',
          nombre: 'nombre',
          tipo: 'text',
          etiqueta: 'Nombre completo',
          placeholder: 'Ingresa tu nombre completo',
          requerido: true,
          orden: 1,
          validacion: {
            min_length: 2,
            max_length: 100,
            mensaje_error: 'El nombre debe tener entre 2 y 100 caracteres'
          }
        },
        {
          id: 'campo_002',
          nombre: 'email',
          tipo: 'email',
          etiqueta: 'Correo electrónico',
          placeholder: 'tu@email.com',
          requerido: true,
          orden: 2,
          validacion: {
            pattern: '^[^@]+@[^@]+\.[^@]+$',
            mensaje_error: 'Ingresa un email válido'
          }
        },
        {
          id: 'campo_003',
          nombre: 'telefono',
          tipo: 'tel',
          etiqueta: 'Teléfono',
          placeholder: '+56 9 1234 5678',
          requerido: true,
          orden: 3,
          validacion: {
            pattern: '^\\+?[0-9\\s\\-\\(\\)]{8,15}$',
            mensaje_error: 'Ingresa un teléfono válido'
          }
        },
        {
          id: 'campo_004',
          nombre: 'carrera_interes',
          tipo: 'select',
          etiqueta: 'Carrera de interés',
          requerido: true,
          orden: 4,
          opciones: [
            'Comunicación Audiovisual',
            'Periodismo',
            'Arquitectura',
            'Diseño Gráfico',
            'Ingeniería Comercial',
            'Psicología'
          ]
        }
      ],
      mostrar_carreras: true,
      permitir_multiple_carreras: false,
      requerir_telefono: true,
      enviar_email_confirmacion: true,
      script_embed: '<script src="https://uniacc.cl/forms/embed.js" data-form="form_001"></script>',
      visualizaciones: 3456,
      envios: 892,
      tasa_conversion: 25.8,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-22T14:30:00Z'
    }
  ]

  const mockLandingPages: LandingPage[] = [
    {
      id: 'lp_001',
      fuente_id: '5',
      nombre: 'Landing Arquitectura',
      slug: 'arquitectura-landing',
      activa: true,
      titulo: '¡Construye tu Futuro en Arquitectura!',
      subtitulo: 'Descubre tu pasión por el diseño y la construcción',
      descripcion: 'Nuestra carrera de Arquitectura te preparará para crear espacios únicos e innovadores. Con un enfoque práctico y tecnología de vanguardia.',
      imagen_hero: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
      cta_texto: 'Solicitar Información',
      cta_color: '#1e40af',
      mostrar_testimonios: true,
      mostrar_carreras_destacadas: false,
      meta_title: 'Estudia Arquitectura en UNIACC - Universidad de las Artes',
      meta_description: 'Carrera de Arquitectura con enfoque práctico y tecnología de vanguardia. ¡Inscríbete ahora!',
      meta_keywords: ['arquitectura', 'universidad', 'chile', 'diseño', 'construcción'],
      formulario_id: 'form_001',
      pixel_facebook: 'pixel_987654321',
      google_analytics_id: 'GA-123456789',
      visitas: 1247,
      conversiones: 178,
      tasa_conversion: 14.3,
      tiempo_promedio_pagina: 145,
      created_at: '2024-01-20T00:00:00Z',
      updated_at: '2024-01-22T13:15:00Z'
    }
  ]

  // Computed
  const fuentesActivas = computed(() => 
    fuentes.value.filter(f => f.activa)
  )
  
  const fuentesPorTipo = computed(() => {
    const grupos: Record<string, FuenteLead[]> = {}
    fuentes.value.forEach(fuente => {
      if (!grupos[fuente.tipo]) grupos[fuente.tipo] = []
      grupos[fuente.tipo].push(fuente)
    })
    return grupos
  })

  const estadisticasGenerales = computed(() => {
    return {
      total_fuentes: fuentes.value.length,
      fuentes_activas: fuentesActivas.value.length,
      total_leads_hoy: fuentes.value.reduce((sum, f) => sum + f.leads_hoy, 0),
      total_leads: fuentes.value.reduce((sum, f) => sum + f.total_leads, 0),
      tasa_conversion_promedio: fuentes.value.length > 0 
        ? fuentes.value.reduce((sum, f) => sum + f.tasa_conversion, 0) / fuentes.value.length 
        : 0,
      costo_promedio_lead: fuentes.value
        .filter(f => f.costo_por_lead)
        .reduce((sum, f, _, arr) => sum + (f.costo_por_lead! / arr.length), 0)
    }
  })

  const mejorFuente = computed(() => {
    return fuentes.value.reduce((mejor, actual) => 
      actual.tasa_conversion > mejor.tasa_conversion ? actual : mejor
    , fuentes.value[0])
  })

  // Métodos principales
  const fetchFuentes = async (): Promise<ApiResponse<FuenteLead[]>> => {
    try {
      loading.value = true
      error.value = null

      await new Promise(resolve => setTimeout(resolve, 600))
      fuentes.value = mockFuentes

      return handleSupabaseSuccess(mockFuentes)
    } catch (err) {
      error.value = 'Error al cargar fuentes de leads'
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  const fetchFormularios = async (): Promise<ApiResponse<FormularioWeb[]>> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      formularios.value = mockFormularios
      return handleSupabaseSuccess(mockFormularios)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const fetchLandingPages = async (): Promise<ApiResponse<LandingPage[]>> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      landingPages.value = mockLandingPages
      return handleSupabaseSuccess(mockLandingPages)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const createFuente = async (fuente: Omit<FuenteLead, 'id' | 'created_at' | 'updated_at' | 'total_leads' | 'leads_hoy' | 'tasa_conversion'>): Promise<ApiResponse<FuenteLead>> => {
    try {
      const nuevaFuente: FuenteLead = {
        ...fuente,
        id: `fuente_${Date.now()}`,
        total_leads: 0,
        leads_hoy: 0,
        tasa_conversion: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      fuentes.value.unshift(nuevaFuente)
      return handleSupabaseSuccess(nuevaFuente)
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const updateFuente = async (id: string, updates: Partial<FuenteLead>): Promise<ApiResponse<FuenteLead>> => {
    try {
      const index = fuentes.value.findIndex(f => f.id === id)
      if (index >= 0) {
        const updated = {
          ...fuentes.value[index],
          ...updates,
          updated_at: new Date().toISOString()
        }
        fuentes.value[index] = updated
        return handleSupabaseSuccess(updated)
      }
      throw new Error('Fuente no encontrada')
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  const toggleFuente = async (id: string): Promise<ApiResponse<FuenteLead>> => {
    try {
      const fuente = fuentes.value.find(f => f.id === id)
      if (!fuente) {
        throw new Error('Fuente no encontrada')
      }
      
      return await updateFuente(id, { activa: !fuente.activa })
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Procesamiento de leads entrantes
  const procesarLeadEntrante = async (data: {
    fuente_id: string
    datos_lead: Record<string, any>
    tracking_data?: Partial<LeadTracking>
  }): Promise<ApiResponse<Prospecto>> => {
    try {
      const fuente = fuentes.value.find(f => f.id === data.fuente_id)
      if (!fuente || !fuente.activa) {
        throw new Error('Fuente no encontrada o inactiva')
      }

      // Crear prospecto
      const nuevoProspecto: CreateProspecto = {
        nombre: data.datos_lead.nombre || '',
        email: data.datos_lead.email,
        telefono: data.datos_lead.telefono,
        whatsapp: data.datos_lead.whatsapp || data.datos_lead.telefono,
        carrera_interes: data.datos_lead.carrera_interes,
        nivel_interes: data.datos_lead.nivel_interes || 'medio',
        fuente: mapearTipoFuenteAEnum(fuente.tipo),
        estado: 'nuevo',
        region: data.datos_lead.ciudad || data.tracking_data?.ciudad,
        metadata: {
          fuente_id: data.fuente_id,
          utm_source: data.tracking_data?.utm_source || fuente.utm_source,
          utm_medium: data.tracking_data?.utm_medium || fuente.utm_medium,
          utm_campaign: data.tracking_data?.utm_campaign || fuente.utm_campaign,
          formulario_data: data.datos_lead,
          ip_address: data.tracking_data?.ip_address,
          user_agent: data.tracking_data?.user_agent,
          referrer: data.tracking_data?.referrer
        }
      }

      const resultado = await prospectos.createProspecto(nuevoProspecto)

      if (resultado.success && resultado.data) {
        // Actualizar estadísticas de la fuente
        fuente.total_leads += 1
        fuente.leads_hoy += 1
        
        // Crear tracking record
        if (data.tracking_data) {
          const trackingRecord: LeadTracking = {
            id: `track_${Date.now()}`,
            prospecto_id: resultado.data.id,
            fuente_id: data.fuente_id,
            session_id: data.tracking_data.session_id || '',
            ip_address: data.tracking_data.ip_address || '',
            user_agent: data.tracking_data.user_agent || '',
            referrer: data.tracking_data.referrer,
            utm_source: data.tracking_data.utm_source,
            utm_medium: data.tracking_data.utm_medium,
            utm_campaign: data.tracking_data.utm_campaign,
            utm_term: data.tracking_data.utm_term,
            utm_content: data.tracking_data.utm_content,
            pais: data.tracking_data.pais,
            ciudad: data.tracking_data.ciudad,
            region: data.tracking_data.region,
            formulario_id: data.tracking_data.formulario_id,
            landing_page_id: data.tracking_data.landing_page_id,
            campana_id: data.tracking_data.campana_id,
            primera_visita: data.tracking_data.primera_visita || new Date().toISOString(),
            conversion: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
          
          tracking.value.unshift(trackingRecord)
        }

        console.log(`✅ Nuevo lead procesado desde ${fuente.nombre}:`, resultado.data.nombre)
      }

      return resultado
    } catch (err) {
      return handleSupabaseError(err)
    }
  }

  // Generar código embed para formularios
  const generarCodigoEmbed = (formularioId: string): string => {
    return `<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://uniacc.cl/forms/embed.js';
  script.dataset.form = '${formularioId}';
  script.dataset.theme = 'uniacc';
  document.head.appendChild(script);
})();
</script>`
  }

  // Generar URL de landing page
  const generarUrlLanding = (slug: string, utmParams?: Record<string, string>): string => {
    let url = `https://uniacc.cl/landing/${slug}`
    
    if (utmParams) {
      const params = new URLSearchParams(utmParams)
      url += `?${params.toString()}`
    }
    
    return url
  }

  // Utilidades
  const mapearTipoFuenteAEnum = (tipo: FuenteLead['tipo']): CreateProspecto['fuente'] => {
    const mapeo = {
      'whatsapp_bot': 'whatsapp_bot',
      'formulario_web': 'web_form',
      'landing_page': 'web_form',
      'facebook_ads': 'facebook_ads',
      'google_ads': 'google_ads',
      'referido': 'referido'
    } as const
    
    return mapeo[tipo] || 'web_form'
  }

  const getIconoFuente = (tipo: FuenteLead['tipo']): string => {
    const iconos = {
      'whatsapp_bot': '💬',
      'formulario_web': '📝',
      'landing_page': '🎯',
      'facebook_ads': '📘',
      'google_ads': '🔍',
      'referido': '👥'
    }
    return iconos[tipo] || '📊'
  }

  const getColorFuente = (tipo: FuenteLead['tipo']): string => {
    const colores = {
      'whatsapp_bot': 'bg-green-100 text-green-800',
      'formulario_web': 'bg-blue-100 text-blue-800',
      'landing_page': 'bg-purple-100 text-purple-800',
      'facebook_ads': 'bg-blue-100 text-blue-800',
      'google_ads': 'bg-red-100 text-red-800',
      'referido': 'bg-yellow-100 text-yellow-800'
    }
    return colores[tipo] || 'bg-gray-100 text-gray-800'
  }

  // Inicializar datos
  const inicializar = async () => {
    await Promise.all([
      fetchFuentes(),
      fetchFormularios(),
      fetchLandingPages()
    ])
  }

  return {
    // Estado
    fuentes,
    formularios,
    landingPages,
    campanas,
    tracking,
    loading,
    error,

    // Computed
    fuentesActivas,
    fuentesPorTipo,
    estadisticasGenerales,
    mejorFuente,

    // Métodos CRUD
    fetchFuentes,
    fetchFormularios,
    fetchLandingPages,
    createFuente,
    updateFuente,
    toggleFuente,

    // Procesamiento
    procesarLeadEntrante,

    // Utilidades
    generarCodigoEmbed,
    generarUrlLanding,
    getIconoFuente,
    getColorFuente,
    inicializar
  }
}
