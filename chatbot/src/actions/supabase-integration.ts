import axios from 'axios'
import logger, { LogCategory } from '../utils/enhanced-logger'

export interface ProspectoData {
  nombre: string
  email: string | null
  telefono: string | null
  whatsapp: string
  edad?: number
  region?: string
  carrera_interes?: string
  facultad_interes?: string
  nivel_interes?: string
  tipo_consulta?: string
  source: string
  flujo_actual?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  datos_adicionales?: Record<string, any>
}

export class SupabaseIntegration {
  private webhookUrl: string
  private webhookSecret: string

  constructor(webhookUrl: string, webhookSecret: string) {
    this.webhookUrl = webhookUrl
    this.webhookSecret = webhookSecret
  }

  async enviarProspecto(data: ProspectoData): Promise<{
    success: boolean
    prospectoId?: string
    sesionNumero?: number
    esNuevoUsuario?: boolean
    perfilUsuario?: string
    error?: string
  }> {
    try {
      console.log('📤 [NUEVA BD] Guardando sesión para:', data.whatsapp)
      console.log('🔧 DEBUG - Datos:', JSON.stringify(data, null, 2))

      // 🎯 USAR NUEVA FUNCIÓN DE BD DIRECTAMENTE
      const payload = {
        p_whatsapp: data.whatsapp,
        p_nombre: data.nombre,
        p_email: data.email,
        p_telefono: data.telefono,
        p_edad: data.edad || null,
        p_region: data.region || null,
        p_carrera_interes: data.carrera_interes || 'Sin especificar',
        p_facultad_interes: data.facultad_interes || '',
        p_tipo_consulta: data.flujo_actual || data.tipo_consulta || 'consulta_general',
        p_nivel_interes: data.nivel_interes || 'medio',
        p_fuente: data.source || 'uniacc_chatbot',
        p_datos_capturados: JSON.stringify({
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
          edad: data.edad,
          region: data.region
        }),
        p_duracion_sesion: null, // TODO: calcular si tienes timestamp inicio
        p_mensajes: 0, // TODO: contar mensajes si tienes contador
        p_flujo_completado: !data.tipo_consulta?.includes('abandono'),
        p_razon_finalizacion: data.tipo_consulta?.includes('abandono') ? 'timeout' : 'completado',
        p_paso_abandono: data.tipo_consulta?.includes('abandono') ? data.tipo_consulta : null,
        p_metadata: JSON.stringify({
          bot_source: 'uniacc_direct',
        timestamp: new Date().toISOString(),
          ...data.datos_adicionales
        })
      }

      console.log('🔧 DEBUG - Payload para función BD:', JSON.stringify(payload, null, 2))
      
      // 🎯 LLAMAR DIRECTAMENTE A LA FUNCIÓN DE BD
      const response = await axios.post(`${this.webhookUrl}/rpc/insertar_sesion_prospecto`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.webhookSecret,
          'Authorization': `Bearer ${this.webhookSecret}`,
          'User-Agent': 'UNIACC-ChatBot-Direct/1.0'
        },
        timeout: 15000
      })

      console.log('🔧 DEBUG - Response status:', response.status)
      console.log('🔧 DEBUG - Response data:', JSON.stringify(response.data, null, 2))

      if (response.status === 200 || response.status === 201) {
        const result = response.data
        console.log(`✅ [NUEVA BD] Sesión guardada - Usuario: ${result.es_nuevo_usuario ? 'NUEVO' : 'RECURRENTE'}`)
        console.log(`📊 [NUEVA BD] Sesión #${result.sesion_numero} - Perfil: ${result.perfil_usuario}`)
        
        return {
          success: true,
          prospectoId: result.historial_id,
          sesionNumero: result.sesion_numero,
          esNuevoUsuario: result.es_nuevo_usuario,
          perfilUsuario: result.perfil_usuario
        }
      } else {
        console.error('❌ Error HTTP llamando función BD:', response.status)
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }

    } catch (error: any) {
      console.error('💥 Error crítico con nueva BD:', error.message)
      if (error.response) {
        console.error('🔧 DEBUG - Error status:', error.response.status)
        console.error('🔧 DEBUG - Error data:', JSON.stringify(error.response.data, null, 2))
        console.error('🔧 DEBUG - Error headers:', error.response.headers)
      }
      
      // FALLBACK DESHABILITADO - No crear archivos
      console.log('📄 [FALLBACK] Deshabilitado - No se guarda archivo local')
      // await this.guardarFallbackLocal(data)
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  private async guardarFallbackLocal(data: ProspectoData): Promise<void> {
    try {
      const fs = require('fs').promises
      const path = require('path')
      
      const fallbackDir = path.join(process.cwd(), 'logs', 'fallback-prospectos')
      await fs.mkdir(fallbackDir, { recursive: true })
      
      const filename = `prospecto-${Date.now()}-${data.whatsapp}.json`
      const filepath = path.join(fallbackDir, filename)
      
      await fs.writeFile(filepath, JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        fallback_reason: 'webhook_failed'
      }, null, 2))
      
      console.log(`💾 Prospecto guardado en fallback: ${filename}`)
      
    } catch (fallbackError) {
      console.error('💥 Error crítico en fallback:', fallbackError)
    }
  }

  async registrarInteraccion(whatsapp: string, mensaje: string, respuesta: string): Promise<void> {
    try {
      // 1. Crear o buscar conversación
      const { buscarConversacion, guardarConversacion, guardarMensaje } = await import('../utils/supabase-client')
      
      let conversacionId: string | undefined
      
      // Buscar conversación existente
      const conversacionExistente = await buscarConversacion(whatsapp)
      if (conversacionExistente.success && conversacionExistente.data) {
        conversacionId = conversacionExistente.data.id
        console.log(`🔍 [CONVERSACION] Encontrada existente: ${conversacionId}`)
      } else {
        // Crear nueva conversación
        const nuevaConversacion = await guardarConversacion({
          phone_number: whatsapp,
          contact_name: 'Usuario WhatsApp'
        })
        
        if (nuevaConversacion.success && nuevaConversacion.data) {
          conversacionId = nuevaConversacion.data.id
          console.log(`✅ [CONVERSACION] Nueva creada: ${conversacionId}`)
        }
      }
      
      if (!conversacionId) {
        console.warn('⚠️ No se pudo crear/encontrar conversación')
        return
      }
      
      // 2. Guardar mensaje del usuario
      const mensajeUsuario = await guardarMensaje({
        conversacion_id: conversacionId,
        content: mensaje,
        type: 'user',
        sender_id: whatsapp
      })
      
      if (mensajeUsuario.success) {
        console.log(`💬 [MENSAJE-USER] Guardado: "${mensaje.substring(0, 30)}..."`)
      } else {
        console.warn('⚠️ Error guardando mensaje usuario:', mensajeUsuario.error)
      }
      
      // 3. Guardar respuesta del bot
      const mensajeBot = await guardarMensaje({
        conversacion_id: conversacionId,
        content: respuesta,
        type: 'bot',
        sender_id: 'uniacc_bot'
      })
      
      if (mensajeBot.success) {
        console.log(`🤖 [MENSAJE-BOT] Guardado: "${respuesta.substring(0, 30)}..."`)
      } else {
        console.warn('⚠️ Error guardando mensaje bot:', mensajeBot.error)
      }
      
      console.log(`📊 Interacciones registradas para ${whatsapp} en conversación ${conversacionId}`)

    } catch (error) {
      console.warn('⚠️ Error registrando interacción (no crítico):', error)
    }
  }

  async obtenerEjecutivoDisponible(regionId?: string): Promise<{
    success: boolean
    ejecutivo?: {
      id: string
      nombre: string
      email: string
      telefono: string
      region: string
    }
    error?: string
  }> {
    try {
      const ejecutivosUrl = this.webhookUrl.replace('/api/botpress-webhook', '/api/ejecutivos/disponible')
      
      const params = regionId ? { region: regionId } : {}
      
      const response = await axios.get(ejecutivosUrl, {
        params,
        headers: {
          'Authorization': `Bearer ${this.webhookSecret}`
        },
        timeout: 5000
      })

      if (response.status === 200 && response.data.ejecutivo) {
        return {
          success: true,
          ejecutivo: response.data.ejecutivo
        }
      } else {
        return {
          success: false,
          error: 'No hay ejecutivos disponibles'
        }
      }

    } catch (error: any) {
      console.error('❌ Error obteniendo ejecutivo:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async notificarEjecutivo(ejecutivoId: string, prospectoData: ProspectoData): Promise<boolean> {
    try {
      const notificacionUrl = this.webhookUrl.replace('/api/botpress-webhook', '/api/notificaciones')
      
      const payload = {
        ejecutivo_id: ejecutivoId,
        tipo: 'nuevo_prospecto',
        prospecto: prospectoData,
        urgencia: 'normal',
        timestamp: new Date().toISOString()
      }

      const response = await axios.post(notificacionUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookSecret}`
        },
        timeout: 5000
      })

      return response.status === 200

    } catch (error) {
      console.error('❌ Error notificando ejecutivo:', error)
      return false
    }
  }

  // Método para sincronizar datos pendientes en fallback
  async sincronizarFallbacks(): Promise<number> {
    try {
      const fs = require('fs').promises
      const path = require('path')
      
      const fallbackDir = path.join(process.cwd(), 'logs', 'fallback-prospectos')
      const files = await fs.readdir(fallbackDir).catch(() => [])
      
      let sincronizados = 0
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filepath = path.join(fallbackDir, file)
            const content = await fs.readFile(filepath, 'utf8')
            const data = JSON.parse(content)
            
            const result = await this.enviarProspecto(data)
            
            if (result.success) {
              await fs.unlink(filepath) // Eliminar archivo sincronizado
              sincronizados++
              console.log(`✅ Sincronizado fallback: ${file}`)
            }
            
          } catch (error) {
            console.error(`❌ Error sincronizando ${file}:`, error)
          }
        }
      }
      
      if (sincronizados > 0) {
        console.log(`🔄 Sincronizados ${sincronizados} prospectos desde fallback`)
      }
      
      return sincronizados
      
    } catch (error) {
      console.error('💥 Error en sincronización de fallbacks:', error)
      return 0
    }
  }
}
