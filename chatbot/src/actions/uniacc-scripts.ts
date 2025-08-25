import { FACULTADES_UNIACC, getFacultadById, getCarreraById, BECAS_UNIACC } from '../data/programas-uniacc'
import { RESPUESTAS } from '../data/respuestas-predefinidas'

export interface UsuarioState {
  flujo_actual: string | null
  paso_actual: string | null
  datos_prospecto: {
    nombre?: string
    email?: string
    telefono?: string
    carrera_interes?: string
    nivel_interes?: string
    campus_preferido?: string
  }
  facultad_seleccionada?: string
  carrera_seleccionada?: string
  intentos_captura: number
}

export class UniaccBot {
  private usuarios: Map<string, UsuarioState> = new Map()

  private getUsuarioState(userId: string): UsuarioState {
    if (!this.usuarios.has(userId)) {
      this.usuarios.set(userId, {
        flujo_actual: null,
        paso_actual: null,
        datos_prospecto: {},
        intentos_captura: 0
      })
    }
    return this.usuarios.get(userId)!
  }

  private setUsuarioState(userId: string, state: Partial<UsuarioState>) {
    const currentState = this.getUsuarioState(userId)
    this.usuarios.set(userId, { ...currentState, ...state })
  }

  private resetUsuario(userId: string) {
    this.usuarios.set(userId, {
      flujo_actual: null,
      paso_actual: null,
      datos_prospecto: {},
      intentos_captura: 0
    })
  }

  // Método principal para procesar mensajes
  async procesarMensaje(userId: string, mensaje: string): Promise<string> {
    const state = this.getUsuarioState(userId)
    const textoLimpio = mensaje.toLowerCase().trim()

    console.log(`🤖 [${userId}] Procesando: "${mensaje}" | Estado: ${state.flujo_actual}/${state.paso_actual}`)

    // Si es saludo o inicio, reiniciar
    if (this.esSaludo(textoLimpio) || !state.flujo_actual) {
      return this.iniciarConversacion(userId)
    }

    // Procesar según el flujo actual
    switch (state.flujo_actual) {
      case 'menu_principal':
        return this.procesarMenuPrincipal(userId, textoLimpio)
      
      case 'exploracion_carreras':
        return this.procesarExploracionCarreras(userId, textoLimpio)
      
      case 'detalle_carrera':
        return this.procesarDetalleCarrera(userId, textoLimpio)
      
      case 'captura_datos':
        return await this.procesarCapturaDatos(userId, textoLimpio)
      
      case 'proceso_admision':
        return this.procesarProcesoAdmision(userId, textoLimpio)
      
      default:
        return this.manejarNoEntendido(userId)
    }
  }

  private iniciarConversacion(userId: string): string {
    this.resetUsuario(userId)
    this.setUsuarioState(userId, {
      flujo_actual: 'menu_principal',
      paso_actual: 'inicio'
    })
    return RESPUESTAS.bienvenida
  }

  private procesarMenuPrincipal(userId: string, mensaje: string): string {
    if (mensaje.includes('1') || mensaje.includes('carrera')) {
      this.setUsuarioState(userId, {
        flujo_actual: 'exploracion_carreras',
        paso_actual: 'seleccion_facultad'
      })
      return RESPUESTAS.menu_facultades
    }

    if (mensaje.includes('2') || mensaje.includes('admision') || mensaje.includes('proceso')) {
      this.setUsuarioState(userId, {
        flujo_actual: 'proceso_admision',
        paso_actual: 'info_general'
      })
      return RESPUESTAS.proceso_admision
    }

    if (mensaje.includes('3') || mensaje.includes('costo') || mensaje.includes('beca')) {
      return this.mostrarCostosYBecas(userId)
    }

    if (mensaje.includes('4') || mensaje.includes('modalidad')) {
      return this.mostrarModalidades(userId)
    }

    if (mensaje.includes('5') || mensaje.includes('asesor') || mensaje.includes('humano')) {
      this.setUsuarioState(userId, {
        flujo_actual: 'captura_datos',
        paso_actual: 'nombre'
      })
      return this.iniciarCapturaDatos(userId)
    }

    return this.manejarNoEntendido(userId)
  }

  private procesarExploracionCarreras(userId: string, mensaje: string): string {
    const state = this.getUsuarioState(userId)

    if (state.paso_actual === 'seleccion_facultad') {
      let facultadId = ''
      
      if (mensaje.includes('a') || mensaje.includes('arte')) {
        facultadId = 'artes'
      } else if (mensaje.includes('b') || mensaje.includes('comunicacion')) {
        facultadId = 'comunicaciones'
      } else if (mensaje.includes('c') || mensaje.includes('arquitectura')) {
        facultadId = 'arquitectura_diseno'
      } else if (mensaje.includes('d') || mensaje.includes('derecho') || mensaje.includes('psicologia')) {
        facultadId = 'ciencias_juridicas'
      } else if (mensaje.includes('e') || mensaje.includes('negocio') || mensaje.includes('comercial')) {
        facultadId = 'negocios_tecnologia'
      }

      if (facultadId) {
        this.setUsuarioState(userId, {
          facultad_seleccionada: facultadId,
          paso_actual: 'lista_carreras'
        })
        return this.mostrarCarrerasFacultad(facultadId)
      }
    }

    if (state.paso_actual === 'lista_carreras' && state.facultad_seleccionada) {
      const facultad = getFacultadById(state.facultad_seleccionada)
      if (facultad) {
        // Detectar selección de carrera por número o nombre
        const numeroCarrera = parseInt(mensaje)
        let carreraSeleccionada = null

        if (numeroCarrera && numeroCarrera <= facultad.carreras.length) {
          carreraSeleccionada = facultad.carreras[numeroCarrera - 1]
        } else {
          // Buscar por nombre
          carreraSeleccionada = facultad.carreras.find(c => 
            mensaje.includes(c.nombre.toLowerCase()) ||
            c.nombre.toLowerCase().includes(mensaje)
          )
        }

        if (carreraSeleccionada) {
          this.setUsuarioState(userId, {
            carrera_seleccionada: carreraSeleccionada.id,
            flujo_actual: 'detalle_carrera',
            paso_actual: 'mostrar_info'
          })
          return this.mostrarDetalleCarrera(state.facultad_seleccionada, carreraSeleccionada.id)
        }
      }
    }

    return this.manejarNoEntendido(userId)
  }

  private procesarDetalleCarrera(userId: string, mensaje: string): string {
    if (mensaje.includes('mas') || mensaje.includes('información') || mensaje.includes('info')) {
      return this.mostrarInformacionAdicional(userId)
    }

    if (mensaje.includes('asesor') || mensaje.includes('contacto') || mensaje.includes('hablar')) {
      this.setUsuarioState(userId, {
        flujo_actual: 'captura_datos',
        paso_actual: 'nombre'
      })
      return this.iniciarCapturaDatos(userId)
    }

    if (mensaje.includes('otra') || mensaje.includes('menu') || mensaje.includes('volver')) {
      return this.iniciarConversacion(userId)
    }

    return `🤔 ¿Te interesa esta carrera?

💬 **Opciones:**
• Escribe "más información" para detalles
• Escribe "asesor" para hablar con alguien
• Escribe "menú" para ver otras carreras`
  }

  private async procesarCapturaDatos(userId: string, mensaje: string): Promise<string> {
    const state = this.getUsuarioState(userId)

    switch (state.paso_actual) {
      case 'nombre':
        if (mensaje.length >= 2) {
          this.setUsuarioState(userId, {
            datos_prospecto: { ...state.datos_prospecto, nombre: mensaje },
            paso_actual: 'email'
          })
          return `¡Hola ${mensaje}! 👋

📧 ¿Cuál es tu **email**?`
        } else {
          return 'Por favor, ingresa tu nombre completo'
        }

      case 'email':
        if (this.validarEmail(mensaje)) {
          this.setUsuarioState(userId, {
            datos_prospecto: { ...state.datos_prospecto, email: mensaje },
            paso_actual: 'telefono'
          })
          return '📱 ¿Tu **número de teléfono**?'
        } else {
          return '📧 Email inválido. Ejemplo: juan@gmail.com'
        }

      case 'telefono':
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, telefono: mensaje },
          paso_actual: 'carrera_interes'
        })
        return '🎓 ¿Qué **carrera te interesa**? (puedes escribir el nombre)'

      case 'carrera_interes':
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, carrera_interes: mensaje },
          paso_actual: 'completado'
        })
        return await this.finalizarCapturaDatos(userId)

      default:
        return this.manejarNoEntendido(userId)
    }
  }

  private procesarProcesoAdmision(userId: string, mensaje: string): string {
    if (mensaje.includes('requisito')) {
      return `📋 **REQUISITOS DE ADMISIÓN**

✅ **Documentos obligatorios:**
1️⃣ Licencia de Enseñanza Media
2️⃣ Concentración de notas
3️⃣ Cédula de identidad (ambos lados)
4️⃣ PSU/PDT (opcional, mejora tu ranking)

💡 **¿Sabías que?** UNIACC tiene proceso independiente

¿Necesitas ayuda con algún documento específico?`
    }

    if (mensaje.includes('fecha') || mensaje.includes('plazo')) {
      return `📅 **FECHAS IMPORTANTES ADMISIÓN 2025**

🟢 **MATRÍCULAS ABIERTAS**
• Hasta: 28 de Febrero 2025
• Proceso continuo: ¡Postula cuando quieras!

📚 **INICIO DE CLASES**
• Fecha: 10 de Marzo 2025
• Inducción: 3-7 de Marzo

¿Te ayudo con el proceso de postulación?`
    }

    if (mensaje.includes('asesor') || mensaje.includes('ayuda')) {
      this.setUsuarioState(userId, {
        flujo_actual: 'captura_datos',
        paso_actual: 'nombre'
      })
      return this.iniciarCapturaDatos(userId)
    }

    return this.iniciarConversacion(userId)
  }

  // Métodos auxiliares
  private mostrarCarrerasFacultad(facultadId: string): string {
    const facultad = getFacultadById(facultadId)
    if (!facultad) return this.manejarNoEntendido('')

    let mensaje = `${facultad.emoji} **${facultad.nombre.toUpperCase()}**\n\n`
    
    facultad.carreras.forEach((carrera, index) => {
      const destacado = carrera.destacado ? ' 🏆' : ''
      mensaje += `${index + 1}️⃣ **${carrera.nombre}**${destacado}\n`
      mensaje += `   └ ${carrera.duracion} • ${carrera.modalidad}\n\n`
    })

    mensaje += `Escribe el **número** de la carrera que te interesa 📝`
    return mensaje
  }

  private mostrarDetalleCarrera(facultadId: string, carreraId: string): string {
    const carrera = getCarreraById(facultadId, carreraId)
    const facultad = getFacultadById(facultadId)
    
    if (!carrera || !facultad) return this.manejarNoEntendido('')

    let mensaje = `🎓 **${carrera.nombre.toUpperCase()}**\n`
    mensaje += `${facultad.emoji} ${facultad.nombre}\n\n`
    
    mensaje += `📚 **Duración:** ${carrera.duracion}\n`
    mensaje += `🏫 **Modalidad:** ${carrera.modalidad}\n`
    mensaje += `💰 **Costo aprox:** $${carrera.costo_aprox.toLocaleString()}/año\n\n`
    
    mensaje += `📖 **Descripción:**\n${carrera.descripcion}\n\n`

    if (carrera.requisitos_especiales?.length) {
      mensaje += `⚠️ **Requisitos especiales:**\n`
      carrera.requisitos_especiales.forEach(req => mensaje += `• ${req}\n`)
      mensaje += `\n`
    }

    mensaje += `💬 **¿Te interesa?**\n`
    mensaje += `• Escribe "asesor" para hablar con alguien\n`
    mensaje += `• Escribe "más información"\n`
    mensaje += `• Escribe "menú" para ver otras carreras`

    return mensaje
  }

  private mostrarCostosYBecas(userId: string): string {
    let mensaje = `💰 **COSTOS Y BECAS UNIACC 2025**\n\n`
    
    mensaje += `💵 **COSTOS PROMEDIO:**\n`
    mensaje += `• Matrícula: $450.000 - $650.000\n`
    mensaje += `• Arancel anual: $11M - $16.5M\n`
    mensaje += `• Depende de la carrera elegida\n\n`

    mensaje += `🎯 **BECAS DISPONIBLES:**\n\n`
    
    BECAS_UNIACC.forEach(beca => {
      mensaje += `🏆 **${beca.nombre}**\n`
      mensaje += `└ ${beca.descripcion}\n`
      mensaje += `└ Descuento: ${beca.descuento}\n\n`
    })

    mensaje += `¿Quieres saber sobre becas para una carrera específica?`
    
    this.setUsuarioState(userId, {
      flujo_actual: 'menu_principal',
      paso_actual: 'post_becas'
    })

    return mensaje
  }

  private mostrarModalidades(userId: string): string {
    let mensaje = `🏫 **MODALIDADES DE ESTUDIO UNIACC**\n\n`
    
    mensaje += `📍 **PRESENCIAL**\n`
    mensaje += `• Campus: Providencia (Metro Salvador)\n`
    mensaje += `• Horarios: Diurno y Vespertino\n`
    mensaje += `• Máxima interacción y networking\n\n`

    mensaje += `💻 **SEMIPRESENCIAL**\n`
    mensaje += `• 70% online + 30% presencial\n`
    mensaje += `• Flexibilidad para trabajar\n`
    mensaje += `• Carreras seleccionadas\n\n`

    mensaje += `🌐 **100% ONLINE** (próximamente)\n`
    mensaje += `• Total flexibilidad horaria\n`
    mensaje += `• Mismo título universitario\n\n`

    mensaje += `¿Qué modalidad te conviene más?`

    this.setUsuarioState(userId, {
      flujo_actual: 'menu_principal',
      paso_actual: 'post_modalidades'
    })

    return mensaje
  }

  private iniciarCapturaDatos(userId: string): string {
    return `📝 **Para brindarte la mejor atención personalizada**

Un asesor especializado te contactará para:
• Resolver todas tus dudas
• Procesos de admisión y becas  
• Visitas al campus
• Información detallada de carreras

👤 ¿Cuál es tu **nombre completo**?`
  }

  private async finalizarCapturaDatos(userId: string): Promise<string> {
    const state = this.getUsuarioState(userId)
    const datos = state.datos_prospecto

    console.log('📊 Nuevo prospecto capturado:', datos)

    // ✅ Guardar en Supabase primero, fallback a memoria
    try {
      const { guardarProspecto } = await import('../utils/supabase-client')
      
      const resultado = await guardarProspecto({
        ...datos,
        whatsapp: userId
      })

      if (resultado.success) {
        console.log('🎯 Prospecto guardado en Supabase:', resultado.data?.id)
      } else {
        console.warn('⚠️ Error Supabase, usando fallback:', resultado.error)
        // Fallback a memoria local
        if (typeof (global as any).agregarProspecto === 'function') {
          (global as any).agregarProspecto({
            ...datos,
            whatsapp: userId
          })
        }
      }
    } catch (error: any) {
      console.error('💥 Error crítico con Supabase:', error.message)
      // Fallback a memoria local
      if (typeof (global as any).agregarProspecto === 'function') {
        (global as any).agregarProspecto({
          ...datos,
          whatsapp: userId
        })
      }
    }

    this.resetUsuario(userId)

    return `✅ **¡Perfecto, ${datos.nombre}!**

📧 Email: ${datos.email}
📱 Teléfono: ${datos.telefono}
🎓 Interés: ${datos.carrera_interes}

**Un asesor te contactará en las próximas 24 horas** para brindarte información personalizada.

**¡Bienvenido a la familia UNIACC!** 🎓✨

*Universidad de Artes, Ciencias y Comunicaciones*`
  }

  private mostrarInformacionAdicional(userId: string): string {
    return `📞 **CONTACTA DIRECTAMENTE CON UNIACC**

📍 **Campus Providencia**
Av. Salvador 1200, Providencia
Metro Salvador (Línea 1)

📞 **Teléfonos:**
• Admisión: +56 2 2640 6000
• WhatsApp: +56 9 8765 4321

📧 **Emails:**
• admision@uniacc.cl
• info@uniacc.cl

🌐 **Web:** www.uniacc.cl

¿Necesitas algo más específico?`
  }

  private manejarNoEntendido(userId: string): string {
    this.setUsuarioState(userId, {
      flujo_actual: 'menu_principal',
      paso_actual: 'no_entendido'
    })
    return RESPUESTAS.no_entendido
  }

  private esSaludo(mensaje: string): boolean {
    const saludos = ['hola', 'buenas', 'hello', 'hi', 'inicio', 'start', 'empezar', 'comenzar']
    return saludos.some(saludo => mensaje.includes(saludo))
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  // Método para obtener datos del prospecto (para webhook)
  getProspectoData(userId: string) {
    const state = this.getUsuarioState(userId)
    return {
      whatsapp: userId,
      source: 'uniacc_chatbot',
      timestamp: new Date().toISOString(),
      ...state.datos_prospecto
    }
  }
}
