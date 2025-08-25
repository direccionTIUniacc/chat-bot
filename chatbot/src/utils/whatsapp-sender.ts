import axios from 'axios'

export interface WhatsAppMessage {
  messaging_product: 'whatsapp'
  to: string
  type: 'text'
  text: {
    body: string
  }
}

export class WhatsAppSender {
  private accessToken: string
  private phoneNumberId: string
  private baseUrl: string

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
    this.baseUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
  }

  async enviarMensaje(to: string, mensaje: string): Promise<boolean> {
    try {
      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: mensaje
        }
      }

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      if (response.status === 200) {
        console.log(`✅ Mensaje enviado a ${to}:`, mensaje.substring(0, 50) + '...')
        return true
      } else {
        console.error(`❌ Error enviando mensaje a ${to}:`, response.data)
        return false
      }

    } catch (error: any) {
      console.error(`💥 Error crítico enviando mensaje a ${to}:`, error.message)
      return false
    }
  }

  async enviarMensajeConReintentos(to: string, mensaje: string, reintentos: number = 3): Promise<boolean> {
    for (let intento = 1; intento <= reintentos; intento++) {
      console.log(`📤 Enviando mensaje a ${to} (intento ${intento}/${reintentos})`)
      
      const exito = await this.enviarMensaje(to, mensaje)
      if (exito) return true

      if (intento < reintentos) {
        const delay = Math.pow(2, intento) * 1000 // Backoff exponencial
        console.log(`⏳ Reintentando en ${delay}ms...`)
        await this.sleep(delay)
      }
    }

    console.error(`❌ Falló envío después de ${reintentos} intentos a ${to}`)
    return false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Validar número de WhatsApp
  static validarNumeroWhatsApp(numero: string): boolean {
    // Formato esperado: +56912345678 o 56912345678
    const regex = /^(\+?56)?9\d{8}$/
    return regex.test(numero.replace(/\s+/g, ''))
  }

  // Normalizar número para WhatsApp API
  static normalizarNumero(numero: string): string {
    let limpio = numero.replace(/\D/g, '') // Solo números
    
    // Si empieza con 56, mantener
    if (limpio.startsWith('56')) {
      return limpio
    }
    
    // Si empieza con 9, agregar código país
    if (limpio.startsWith('9')) {
      return '56' + limpio
    }
    
    // Si es número local, agregar 56 y 9
    if (limpio.length === 8) {
      return '569' + limpio
    }
    
    return limpio
  }
}
