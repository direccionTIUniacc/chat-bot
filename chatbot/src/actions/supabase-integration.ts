import axios from 'axios'

export interface ProspectoData {
  nombre: string
  email: string
  telefono: string
  whatsapp: string
  carrera_interes?: string
  nivel_interes?: string
  source: string
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
    error?: string
  }> {
    try {
      console.log('📤 Enviando prospecto al dashboard:', data.email)

      const payload = {
        ...data,
        timestamp: new Date().toISOString(),
        canal: 'whatsapp_bot',
        estado: 'nuevo'
      }

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookSecret}`,
          'User-Agent': 'UNIACC-WhatsApp-Bot/1.0'
        },
        timeout: 15000
      })

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Prospecto guardado exitosamente')
        return {
          success: true,
          prospectoId: response.data.prospecto_id || response.data.id
        }
      } else {
        console.error('❌ Error HTTP enviando prospecto:', response.status)
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }

    } catch (error: any) {
      console.error('💥 Error crítico enviando prospecto:', error.message)
      
      // Intentar guardar en fallback local
      await this.guardarFallbackLocal(data)
      
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
      const payload = {
        whatsapp,
        mensaje_usuario: mensaje,
        respuesta_bot: respuesta,
        timestamp: new Date().toISOString(),
        tipo: 'conversacion'
      }

      // Enviar a endpoint de interacciones (si existe)
      const interaccionUrl = this.webhookUrl.replace('/api/botpress-webhook', '/api/interacciones')
      
      await axios.post(interaccionUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookSecret}`
        },
        timeout: 5000
      })

      console.log(`📊 Interacción registrada para ${whatsapp}`)

    } catch (error) {
      // No es crítico si falla el registro de interacciones
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
