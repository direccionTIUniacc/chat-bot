import { FACULTADES_UNIACC, getFacultadById, getCarreraById, BECAS_UNIACC } from '../data/programas-uniacc'
import { RESPUESTAS } from '../data/respuestas-predefinidas'
import { SupabaseIntegration, ProspectoData } from './supabase-integration'
import axios from 'axios'
import { 
  FLUJOS, 
  PASOS, 
  TIPOS_CONSULTA, 
  NIVELES_INTERES,
  FUENTES,
  normalizarFlujo, 
  normalizarPaso,
  type Flujo,
  type Paso,
  type TipoConsulta,
  type NivelInteres
} from '../types/flow-types'

export interface UsuarioState {
  flujo_actual: string | null
  paso_actual: string | null
  opcion_menu_seleccionada?: string
  datos_prospecto: {
    nombre?: string
    email?: string
    telefono?: string
    edad?: number
    region?: string
    carrera_interes?: string
    nivel_interes?: string
    campus_preferido?: string
  }
  facultad_seleccionada?: string
  carrera_seleccionada?: string
  carreras_sugeridas?: any[]
  historial_consultas?: string[]
  ultima_carrera_consultada?: string
  es_usuario_recurrente?: boolean
  fecha_ultima_interaccion?: Date
  intentos_captura: number
  // Nuevos campos para timeout
  timeout_warning_sent?: boolean
  session_timeout_id?: NodeJS.Timeout
  warning_timeout_id?: NodeJS.Timeout
  // Nuevos campos para captura incremental
  prospecto_id?: string  // UUID del prospecto en BD
  ultimo_campo_guardado?: 'nombre' | 'email' | 'telefono' | 'edad' | 'region'
  campos_capturados?: string[]
  fecha_creacion_prospecto?: Date
}

export class UniaccBot {
  private usuarios: Map<string, UsuarioState> = new Map()
  private supabaseIntegration: SupabaseIntegration
  private webhookUrl: string
  private webhookSecret: string
  
  // Sistema de mensajes pendientes para polling
  private mensajesPendientes: Map<string, {
    tipo: 'warning' | 'timeout'
    mensaje: string
    timestamp: Date
  }> = new Map()
  
  // Constantes de timeout
  private readonly SESSION_TIMEOUT = 120000 // 2 minutos
  private readonly WARNING_TIMEOUT = 90000  // 1.5 minutos

  constructor(webhookUrl: string, webhookSecret: string) {
    this.webhookUrl = webhookUrl
    this.webhookSecret = webhookSecret
    this.supabaseIntegration = new SupabaseIntegration(webhookUrl, webhookSecret)
  }

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
    // Limpiar timeouts antes de resetear
    this.clearTimeouts(userId)
    
    this.usuarios.set(userId, {
      flujo_actual: null,
      paso_actual: null,
      datos_prospecto: {},
      intentos_captura: 0
    })
  }

  // Método principal para procesar mensajes - actualizado
  async procesarMensaje(userId: string, mensaje: string): Promise<string> {
    const state = this.getUsuarioState(userId)
    const textoLimpio = mensaje.toLowerCase().trim()

    console.log(`🤖 [${userId}] Procesando: "${mensaje}" | Estado: ${state.flujo_actual}/${state.paso_actual}`)

    // Configurar timeout para esta sesión
    this.setSessionTimeout(userId)

    // Si es saludo o inicio, reiniciar
    if (this.esSaludo(textoLimpio) || !state.flujo_actual) {
      return this.iniciarConversacion(userId)
    }

    // 🎓 PROCESAMIENTO CON ESTÁNDAR UNIVERSITARIO - Con mapeo de compatibilidad
    const flujoNormalizado = normalizarFlujo(state.flujo_actual!) || state.flujo_actual
    
    switch (flujoNormalizado) {
      // ✅ Flujos migrados
      case FLUJOS.PROSPECT_CAPTURE:
      case 'captura_inicial':
        return await this.procesarCapturaInicial(userId, mensaje)
        
      case FLUJOS.ADVISOR_CONNECTION:
        // 🎯 CAPTURA INTELIGENTE DE ASESOR
        return await this.procesarCapturaAsesor(userId, mensaje)
        
      case 'captura_datos':
        // 🔄 CAPTURA LEGACY 
        return await this.procesarCapturaDatos(userId, textoLimpio)
        
      // 🔄 Flujos legacy (mantener compatibilidad)
      case 'menu_principal':
      case FLUJOS.WELCOME:
        return await this.procesarMenuPrincipal(userId, textoLimpio)
      
      case 'exploracion_carreras':
      case FLUJOS.PROGRAM_DISCOVERY:
        return this.procesarExploracionCarreras(userId, textoLimpio)
      
      case 'detalle_carrera':
      case FLUJOS.CAREER_EXPLORATION:
        return await this.procesarDetalleCarrera(userId, textoLimpio)
      
      case 'proceso_admision':
      case FLUJOS.ADMISSION_INQUIRY:
        return await this.procesarProcesoAdmision(userId, textoLimpio)
      
      case 'busqueda_directa_carrera':
      case FLUJOS.PROGRAM_DISCOVERY:
        return await this.procesarBusquedaDirectaCarrera(userId, textoLimpio)
      
      case 'costos_becas_decision':
      case FLUJOS.FINANCIAL_INQUIRY:
        return await this.procesarCostosBecasDecision(userId, textoLimpio)
      
      case 'modalidades_decision':
      case FLUJOS.PROGRAM_COMPARISON:
        return await this.procesarModalidadesDecision(userId, textoLimpio)
      
      case 'menu_contextual':
      case FLUJOS.UNIVERSITY_DISCOVERY:
        return await this.procesarMenuContextual(userId, textoLimpio)
      
      default:
        console.log(`⚠️ [FLOW] Flujo no reconocido: ${state.flujo_actual} → ${flujoNormalizado}`)
        return this.manejarNoEntendido(userId)
    }
  }

  private async iniciarConversacion(userId: string): Promise<string> {
    // Verificar si es usuario recurrente
    const usuarioExistente = await this.verificarUsuarioExistente(userId)
    
    if (usuarioExistente) {
      // Usuario recurrente - mostrar menú contextual
      return this.mostrarMenuContextual(userId, usuarioExistente)
    } else {
      // Usuario nuevo - flujo normal
      this.resetUsuario(userId)
      this.setUsuarioState(userId, {
        flujo_actual: 'captura_inicial',
        paso_actual: 'solicitar_nombre'
      })
      return `🎓 ¡Hola! Para brindarte información personalizada sobre UNIACC:

👤 ¿Cuál es tu **nombre completo**?`
    }
  }

  private async procesarCapturaInicial(userId: string, mensaje: string): Promise<string> {
    const state = this.getUsuarioState(userId)
    
    switch (state.paso_actual) {
      case 'solicitar_nombre':
        // Guardar nombre y solicitar email
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, nombre: mensaje },
          paso_actual: 'solicitar_email'
        })
        
        // 🆕 PROGRESSIVE CAPTURE: Crear prospecto inicial con primer campo
        const prospectoId = await this.crearProspectoInicial(userId, mensaje)
        if (prospectoId) {
          // Actualizar estado con ID del prospecto para futuras actualizaciones
          this.setUsuarioState(userId, {
            prospecto_id: prospectoId,
            ultimo_campo_guardado: 'nombre',
            campos_capturados: ['nombre'],
            fecha_creacion_prospecto: new Date()
          })
        }
        
        return `¡Hola ${mensaje}! 👋

📧 ¿Cuál es tu **email**?`

      case 'solicitar_email':
        // Validar email básicamente y guardarlo
        if (!mensaje.includes('@') || !mensaje.includes('.')) {
          return `❌ Por favor ingresa un email válido (debe contener @ y .)`
        }
        
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, email: mensaje },
          paso_actual: 'solicitar_edad'
        })
        
        // 🆕 PROGRESSIVE CAPTURE: Actualizar email en prospecto existente
        if (state.prospecto_id) {
          await this.actualizarProspectoCampo(state.prospecto_id, 'email', mensaje)
          this.setUsuarioState(userId, {
            ultimo_campo_guardado: 'email',
            campos_capturados: [...(state.campos_capturados || []), 'email']
          })
        }
        
        return `✅ Email: ${mensaje}

🎂 ¿Cuántos **años** tienes?`

      case 'solicitar_edad':
        const edad = parseInt(mensaje)
        if (isNaN(edad) || edad < 16 || edad > 80) {
          return `❌ Por favor ingresa una edad válida (entre 16 y 80 años)`
        }
        
        // 🆕 PROGRESSIVE CAPTURE: Actualizar edad en prospecto existente
        if (state.prospecto_id) {
          await this.actualizarProspectoCampo(state.prospecto_id, 'edad', edad)
          this.setUsuarioState(userId, {
            ultimo_campo_guardado: 'edad',
            campos_capturados: [...(state.campos_capturados || []), 'edad']
          })
        }
        
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, edad },
          paso_actual: 'solicitar_region'
        })
        return `✅ Edad: ${edad} años

📍 ¿En qué **región** vives?

1️⃣ Arica y Parinacota
2️⃣ Tarapacá  
3️⃣ Antofagasta
4️⃣ Atacama
5️⃣ Coquimbo
6️⃣ Valparaíso
7️⃣ Metropolitana
8️⃣ O'Higgins
9️⃣ Maule
🔟 Ñuble
1️⃣1️⃣ Biobío
1️⃣2️⃣ La Araucanía
1️⃣3️⃣ Los Ríos
1️⃣4️⃣ Los Lagos
1️⃣5️⃣ Aysén
1️⃣6️⃣ Magallanes

Escribe el **número** de tu región:`

      case 'solicitar_region':
        const regiones = [
          'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
          'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
          'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
        ]
        
        const numeroRegion = parseInt(mensaje)
        if (isNaN(numeroRegion) || numeroRegion < 1 || numeroRegion > 16) {
          return `❌ Por favor selecciona un número válido del 1 al 16`
        }
        
        const regionSeleccionada = regiones[numeroRegion - 1]
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, region: regionSeleccionada },
          paso_actual: 'solicitar_telefono'
        })
        
        // 🆕 PROGRESSIVE CAPTURE: Actualizar región en prospecto existente
        if (state.prospecto_id) {
          await this.actualizarProspectoCampo(state.prospecto_id, 'region', regionSeleccionada)
          this.setUsuarioState(userId, {
            ultimo_campo_guardado: 'region',
            campos_capturados: [...(state.campos_capturados || []), 'region']
          })
        }
        
        return `✅ Región: ${regionSeleccionada}

📱 Por último, ¿cuál es tu **teléfono**?`

      case 'solicitar_telefono':
        // Validación básica de teléfono
        const telefonoLimpio = mensaje.replace(/\s/g, '')
        if (telefonoLimpio.length < 8) {
          return `❌ Por favor ingresa un número de teléfono válido`
        }
        
        const datos = state.datos_prospecto
        
        this.setUsuarioState(userId, {
          datos_prospecto: { ...datos, telefono: mensaje },
          flujo_actual: 'menu_principal',
          paso_actual: null
        })
        
        // 🆕 PROGRESSIVE CAPTURE: Actualizar teléfono y finalizar captura completa
        if (state.prospecto_id) {
          await this.actualizarProspectoCampo(state.prospecto_id, 'telefono', mensaje)
          
          // Finalizar prospecto con datos completos
          const tipoConsulta = 'captura completa'
          const nivelInteres = 'alto' // Usuario completó todo el proceso
          
          await this.finalizarProspecto(
            state.prospecto_id,
            tipoConsulta,
            nivelInteres
          )
          
          this.setUsuarioState(userId, {
            ultimo_campo_guardado: 'telefono',
            campos_capturados: [...(state.campos_capturados || []), 'telefono']
          })
        }
        
        return `🎉 **¡PERFECTO ${datos.nombre?.toUpperCase()}!**

📋 **Tus datos:**
👤 ${datos.nombre}
📧 ${datos.email}
🎂 ${datos.edad} años  
📍 ${datos.region}
📱 ${mensaje}

✅ **Datos guardados exitosamente**

---

🌟 **¡Bienvenid@ a UNIACC!** 🌟
*Universidad de Artes, Ciencias y Comunicaciones*

¿En qué puedo ayudarte hoy?

1️⃣ **Conocer nuestras carreras**
2️⃣ **Proceso de admisión 2025**  
3️⃣ **Costos y becas**
4️⃣ **Modalidades de estudio**
5️⃣ **Hablar con un asesor**

Escribe el número de tu opción 📝`

      default:
        return this.iniciarConversacion(userId)
    }
  }

  private async procesarMenuPrincipal(userId: string, mensaje: string): Promise<string> {
    if (mensaje.includes('1') || mensaje.includes('carrera')) {
      this.setUsuarioState(userId, {
        flujo_actual: 'exploracion_carreras',
        paso_actual: 'seleccion_facultad',
        opcion_menu_seleccionada: 'conocer_carreras'
      })
      return RESPUESTAS.menu_facultades
    }

    if (mensaje.includes('2') || mensaje.includes('admision') || mensaje.includes('proceso')) {
      this.setUsuarioState(userId, {
        flujo_actual: 'proceso_admision',
        paso_actual: 'info_general',
        opcion_menu_seleccionada: 'proceso_admision'
      })
      return RESPUESTAS.proceso_admision
    }

    if (mensaje.includes('3') || mensaje.includes('costo') || mensaje.includes('beca')) {
      this.setUsuarioState(userId, {
        opcion_menu_seleccionada: 'costos_becas'
      })
      return await this.mostrarCostosYBecas(userId)
    }

    if (mensaje.includes('4') || mensaje.includes('modalidad')) {
      this.setUsuarioState(userId, {
        opcion_menu_seleccionada: 'modalidades_estudio'
      })
      return await this.mostrarModalidades(userId)
    }

    if (mensaje.includes('5') || mensaje.includes('asesor') || mensaje.includes('humano')) {
      // Verificar si ya tiene datos completos antes de pedir nuevos datos
      const state = this.getUsuarioState(userId)
      const datos = state.datos_prospecto
      
      // IMPORTANTE: Guardar la opción seleccionada ANTES de cualquier otra lógica
      this.setUsuarioState(userId, {
        opcion_menu_seleccionada: 'hablar_asesor'
      })
      
      if (datos.nombre && datos.email && datos.telefono) {
        console.log('✅ Usuario', userId, 'ya tiene datos completos, finalizando solicitud de asesor')
        console.log('🔧 Opción guardada:', this.getUsuarioState(userId).opcion_menu_seleccionada)
        return await this.iniciarCapturaDatos(userId)
      } else {
        // Solo cambiar el flujo si no tiene datos completos
        this.setUsuarioState(userId, {
          flujo_actual: 'captura_datos',
          paso_actual: 'nombre'
        })
        return await this.iniciarCapturaDatos(userId)
      }
    }

    if (mensaje.includes('6') || mensaje.includes('ya se') || mensaje.includes('ya sé')) {
      this.setUsuarioState(userId, {
        flujo_actual: 'busqueda_directa_carrera',
        paso_actual: 'solicitar_carrera',
        opcion_menu_seleccionada: 'busqueda_directa'
      })
      return `🚀 **¡Perfecto! Vamos directo al grano**

🎓 **¿Cuál es la carrera que te interesa?**

Escribe el nombre de la carrera que quieres estudiar (ejemplo: "Psicología", "Arquitectura", "Diseño", "Derecho", etc.):`
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

  private async procesarDetalleCarrera(userId: string, mensaje: string): Promise<string> {
    // Solo procesar respuestas numéricas para mayor simplicidad
    if (mensaje === '1') {
      await this.guardarProspectoFinalFlujo(userId, 'exploracion_carreras')
      return `🎓 **¡Excelente elección!** Has tomado una gran decisión explorando esta carrera.

📞 **Próximos pasos:**
• Nuestro equipo académico se pondrá en contacto contigo
• Recibirás información detallada del programa
• Podrás resolver todas tus dudas específicas

🌟 **Te acompañamos en tu camino hacia el éxito profesional.**

💬 **Escribe "Hola" para realizar una nueva consulta**`
    }

    if (mensaje === '2') {
      await this.guardarProspectoFinalFlujo(userId, 'exploracion_carreras')
      return `📚 **Entendido.** Agradecemos que hayas explorado nuestras opciones académicas.

💡 **Recuerda que siempre puedes volver para consultar sobre otras carreras o hablar con un asesor.**

🎯 **UNIACC tiene múltiples caminos profesionales esperándote.**

💬 **Escribe "Hola" para realizar una nueva consulta**`
    }

    if (mensaje === '3') {
      // 🎓 MIGRACIÓN: Usar estándar universitario
      this.setUsuarioState(userId, {
        flujo_actual: FLUJOS.ADVISOR_CONNECTION,
        paso_actual: PASOS.CONNECT_WITH_ADVISOR,
        opcion_menu_seleccionada: 'hablar_asesor'
      })
      return await this.iniciarCapturaDatos(userId)
    }

    if (mensaje === '4') {
      this.setUsuarioState(userId, {
        flujo_actual: 'exploracion_carreras',
        paso_actual: 'seleccion_facultad'
      })
      return RESPUESTAS.menu_facultades
    }

    return `**¿Qué te gustaría hacer?**

1️⃣ Me interesa, quiero más información
2️⃣ No es para mí
3️⃣ Hablar con un asesor
4️⃣ Ver otra carrera

**Escribe solo el número (1, 2, 3 o 4):**`
  }

  private async procesarCapturaDatos(userId: string, mensaje: string): Promise<string> {
    const state = this.getUsuarioState(userId)

    switch (state.paso_actual) {
      case 'nombre':
        if (mensaje.length >= 2) {
          this.setUsuarioState(userId, {
            datos_prospecto: { ...state.datos_prospecto, nombre: mensaje },
            paso_actual: 'telefono'
          })
          return `¡Hola ${mensaje}! 👋

📱 ¿Cuál es tu **número de teléfono móvil**?`
        } else {
          return 'Por favor, ingresa tu nombre completo'
        }

      case 'telefono':
        // Validación básica de teléfono
        const telefonoLimpio = mensaje.replace(/\s/g, '')
        if (telefonoLimpio.length < 8) {
          return `❌ Por favor ingresa un número de teléfono válido`
        }
        
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, telefono: mensaje },
          paso_actual: 'email'
        })
        return `📱 **Teléfono:** ${mensaje}

📧 ¿Cuál es tu **email**?`

      case 'email':
        if (this.validarEmail(mensaje)) {
          this.setUsuarioState(userId, {
            datos_prospecto: { ...state.datos_prospecto, email: mensaje },
            paso_actual: 'carrera_interes'
          })
          return `📧 **Email:** ${mensaje}

🎓 ¿Qué **carrera te interesa**? (puedes escribir el nombre)`
        } else {
          return '📧 Email inválido. Ejemplo: juan@gmail.com'
        }

      case 'carrera_interes':
        // Buscar la facultad de la carrera ingresada
        const facultadEncontrada = this.buscarFacultadPorCarrera(mensaje)
        
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, carrera_interes: mensaje },
          carrera_seleccionada: mensaje,
          facultad_seleccionada: facultadEncontrada?.id,
          paso_actual: 'completado'
        })
        return await this.finalizarCapturaDatos(userId)

      default:
        return this.manejarNoEntendido(userId)
    }
  }

  private async procesarProcesoAdmision(userId: string, mensaje: string): Promise<string> {
    // Manejo simplificado con opciones numéricas directas
    if (mensaje === '1') {
      await this.guardarProspectoFinalFlujo(userId, 'proceso_admision')
      return `🎓 **¡Excelente!** Ya tienes toda la información necesaria sobre nuestro proceso de admisión 2025.

📋 **Próximos pasos:**
• Revisa los requisitos específicos de tu carrera
• Prepara tu documentación
• Inicia tu postulación cuando estés listo

🌟 **Te esperamos en UNIACC para ser parte de tu futuro profesional.**

💬 **Escribe "Hola" para realizar una nueva consulta**`
    }

    if (mensaje === '2') {
      // 🎓 MIGRACIÓN: Usar estándar universitario
      this.setUsuarioState(userId, {
        flujo_actual: FLUJOS.ADVISOR_CONNECTION,
        paso_actual: PASOS.CONNECT_WITH_ADVISOR,
        opcion_menu_seleccionada: 'hablar_asesor'
      })
      return await this.iniciarCapturaDatos(userId)
    }

    if (mensaje === '3') {
      this.setUsuarioState(userId, {
        flujo_actual: 'exploracion_carreras',
        paso_actual: 'seleccion_facultad'
      })
      return RESPUESTAS.menu_facultades
    }

    // Si no entiende, mostrar opciones claras
    return RESPUESTAS.proceso_admision + `\n\n**¿Qué quieres hacer ahora?**\n\n` +
           `1️⃣ Ya tengo toda la info, ¡gracias!\n` +
           `2️⃣ Hablar con un asesor\n` +
           `3️⃣ Ver qué carreras hay\n\n` +
           `**Escribe solo el número (1, 2 o 3):**`
  }

  private async procesarBusquedaDirectaCarrera(userId: string, mensaje: string): Promise<string> {
    const state = this.getUsuarioState(userId)

    if (state.paso_actual === 'solicitar_carrera') {
      // Buscar la carrera en todas las facultades
      const carreraEncontrada = this.buscarCarreraPorNombre(mensaje)
      
      if (carreraEncontrada) {
        // Mostrar detalle de la carrera encontrada
        this.setUsuarioState(userId, {
          facultad_seleccionada: carreraEncontrada.facultadId,
          carrera_seleccionada: carreraEncontrada.carrera.id,
          flujo_actual: 'detalle_carrera',
          paso_actual: 'mostrar_info'
        })
        
        return `🎯 **¡Encontré tu carrera!**\n\n` + 
               this.mostrarDetalleCarrera(carreraEncontrada.facultadId, carreraEncontrada.carrera.id)
      } else {
        // No se encontró la carrera exacta, mostrar opciones similares
        const carrerasSimilares = this.buscarCarrerasSimilares(mensaje)
        
        if (carrerasSimilares.length > 0) {
          let respuesta = `🔍 **No encontré exactamente "${mensaje}", pero estas carreras podrían interesarte:**\n\n`
          
          carrerasSimilares.forEach((item, index) => {
            respuesta += `${index + 1}️⃣ **${item.carrera.nombre}**\n`
            respuesta += `   └ ${item.facultad.nombre}\n\n`
          })
          
          respuesta += `**Escribe el número de la carrera que te interesa (1-${carrerasSimilares.length}):**`
          
          this.setUsuarioState(userId, {
            paso_actual: 'seleccionar_sugerencia',
            carreras_sugeridas: carrerasSimilares
          })
          
          return respuesta
        } else {
          return `❌ **No encontré "${mensaje}" en nuestras carreras**\n\n` +
                 `🔄 **¿Qué te gustaría hacer?**\n\n` +
                 `1️⃣ Ver todas las carreras por facultad\n` +
                 `2️⃣ Hablar con un asesor\n` +
                 `3️⃣ Intentar con otro nombre\n\n` +
                 `**Escribe el número (1, 2 o 3):**`
        }
      }
    }

    if (state.paso_actual === 'seleccionar_sugerencia') {
      const numero = parseInt(mensaje)
      const carrerasSugeridas = state.carreras_sugeridas
      
      if (numero && carrerasSugeridas && numero <= carrerasSugeridas.length && numero > 0) {
        const carreraSeleccionada = carrerasSugeridas[numero - 1]
        
        this.setUsuarioState(userId, {
          facultad_seleccionada: carreraSeleccionada.facultadId,
          carrera_seleccionada: carreraSeleccionada.carrera.id,
          flujo_actual: 'detalle_carrera',
          paso_actual: 'mostrar_info'
        })
        
        return this.mostrarDetalleCarrera(carreraSeleccionada.facultadId, carreraSeleccionada.carrera.id)
      }
    }

    // Manejar opciones cuando no se encuentra la carrera
    if (mensaje === '1') {
      this.setUsuarioState(userId, {
        flujo_actual: 'exploracion_carreras',
        paso_actual: 'seleccion_facultad'
      })
      return RESPUESTAS.menu_facultades
    }

    if (mensaje === '2') {
      // 🎓 MIGRACIÓN: Usar estándar universitario
      this.setUsuarioState(userId, {
        flujo_actual: FLUJOS.ADVISOR_CONNECTION,
        paso_actual: PASOS.CONNECT_WITH_ADVISOR,
        opcion_menu_seleccionada: 'hablar_asesor'
      })
      return await this.iniciarCapturaDatos(userId)
    }

    if (mensaje === '3') {
      return `🎯 **Intentemos de nuevo**\n\n` +
             `🎓 **¿Cuál es la carrera que te interesa?**\n\n` +
             `Escribe el nombre de la carrera (ejemplo: "Psicología", "Arquitectura", "Diseño"):`
    }

    return `🤔 **No entendí tu respuesta**\n\n` +
           `Por favor escribe el número de una de las opciones mostradas.`
  }

  private async procesarCostosBecasDecision(userId: string, mensaje: string): Promise<string> {
    if (mensaje === '1') {
      await this.guardarProspectoFinalFlujo(userId, 'costos_becas')
      return `💰 **¡Perfecto!** Esperamos que la información sobre costos y becas te sea de gran utilidad.

📊 **Recuerda que UNIACC ofrece:**
• Múltiples opciones de financiamiento
• Becas de excelencia académica
• Convenios con instituciones financieras

🎯 **Tu educación es una inversión en tu futuro profesional.**

💬 **Escribe "Hola" para realizar una nueva consulta**`
    }

    if (mensaje === '2') {
      // 🎓 MIGRACIÓN: Usar estándar universitario
      this.setUsuarioState(userId, {
        flujo_actual: FLUJOS.ADVISOR_CONNECTION,
        paso_actual: PASOS.CONNECT_WITH_ADVISOR,
        opcion_menu_seleccionada: 'hablar_asesor'
      })
      return await this.iniciarCapturaDatos(userId)
    }

    if (mensaje === '3') {
      this.setUsuarioState(userId, {
        flujo_actual: 'exploracion_carreras',
        paso_actual: 'seleccion_facultad'
      })
      return RESPUESTAS.menu_facultades
    }

    if (mensaje === '4') {
      await this.guardarProspectoFinalFlujo(userId, 'costos_becas')
      return `💰 **¡Excelente!** Nos alegra haberte proporcionado la información que necesitabas.

🎓 **UNIACC: Donde tu futuro profesional comienza.**

💬 **Escribe "Hola" para realizar una nueva consulta**`
    }

    return `**Elige una opción:**\n\n1️⃣ Sí, quiero más información\n2️⃣ Hablar con un asesor sobre becas\n3️⃣ Ver qué carreras hay\n4️⃣ Ya tengo la info que necesitaba\n\n**Escribe solo el número (1, 2, 3 o 4):**`
  }

  private async procesarModalidadesDecision(userId: string, mensaje: string): Promise<string> {
    if (mensaje === '1') {
      await this.guardarProspectoFinalFlujo(userId, 'modalidades_estudio')
      return `🏢 **¡Excelente elección!** La modalidad presencial te permitirá:

✨ **Beneficios del campus presencial:**
• Networking directo con compañeros y profesores
• Acceso completo a laboratorios y bibliotecas
• Experiencia universitaria integral
• Actividades extracurriculares y eventos

🎓 **Te esperamos en nuestro campus para vivir la experiencia UNIACC.**

💬 **Escribe "Hola" para realizar una nueva consulta**`
    }

    if (mensaje === '2') {
      await this.guardarProspectoFinalFlujo(userId, 'modalidades_estudio')
      return `💻 **¡Excelente elección!** La modalidad semipresencial te ofrece:

🔄 **Flexibilidad inteligente:**
• Clases presenciales estratégicas para networking
• Contenido digital de alta calidad
• Compatibilidad con horarios laborales
• Apoyo académico personalizado

⚖️ **El equilibrio perfecto entre autonomía y acompañamiento académico.**

💬 **Escribe "Hola" para realizar una nueva consulta**`
    }

    if (mensaje === '3') {
      // 🎓 MIGRACIÓN: Usar estándar universitario
      this.setUsuarioState(userId, {
        flujo_actual: FLUJOS.ADVISOR_CONNECTION,
        paso_actual: PASOS.CONNECT_WITH_ADVISOR,
        opcion_menu_seleccionada: 'hablar_asesor'
      })
      return await this.iniciarCapturaDatos(userId)
    }

    if (mensaje === '4') {
      await this.guardarProspectoFinalFlujo(userId, 'modalidades_estudio')
      return `📚 **¡Genial!** Esperamos que la información sobre nuestras modalidades te haya sido de gran utilidad.

🎯 **UNIACC se adapta a tu estilo de vida para que logres tus metas académicas.**

💬 **Escribe "Hola" para realizar una nueva consulta**`
    }

    return `**Elige una modalidad:**\n\n1️⃣ Presencial - Máxima interacción\n2️⃣ Semipresencial - Flexibilidad\n3️⃣ Hablar con un asesor\n4️⃣ Ya tengo la info que necesitaba\n\n**Escribe solo el número (1, 2, 3 o 4):**`
  }

  private async verificarUsuarioExistente(userId: string): Promise<any | null> {
    try {
      console.log(`🔍 [VERIFICAR] Buscando usuario ${userId} en prospecto_actual...`)
      
      // Buscar usuario en prospecto_actual por WhatsApp usando Supabase directo
      const response = await axios.get(`${this.webhookUrl}/prospecto_actual?whatsapp=eq.${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.webhookSecret,
          'Authorization': `Bearer ${this.webhookSecret}`,
          'User-Agent': 'UNIACC-ChatBot-Direct/1.0'
        },
        timeout: 10000
      })
      
      if (response.status !== 200 || !response.data || response.data.length === 0) {
        console.log(`🆕 [VERIFICAR] Usuario nuevo: ${userId}`)
        return null
      }
      
      const usuario = response.data[0]
      console.log(`✅ [VERIFICAR] Usuario existente encontrado: ${usuario.nombre} - ${usuario.total_sesiones} sesiones`)
      
      // Verificar que no sea muy antigua (más de 30 días)
      const fechaConsulta = new Date(usuario.ultima_interaccion)
      const ahora = new Date()
      const diasDiferencia = (ahora.getTime() - fechaConsulta.getTime()) / (1000 * 60 * 60 * 24)
      
      if (diasDiferencia > 30) {
        console.log(`⏰ [VERIFICAR] Usuario muy antiguo (${Math.round(diasDiferencia)} días), tratando como nuevo`)
        return null // Muy antigua, tratar como nuevo usuario
      }
      
      return usuario
      
    } catch (error) {
      console.error('⚠️ Error verificando usuario existente:', error)
      return null
    }
  }

  private mostrarMenuContextual(userId: string, usuario: any): string {
    // Cargar datos en estado para uso posterior
    this.setUsuarioState(userId, {
      datos_prospecto: {
        nombre: usuario.nombre,
        email: usuario.email,
        carrera_interes: usuario.carrera_interes
      },
      es_usuario_recurrente: true,
      ultima_carrera_consultada: usuario.carrera_interes,
      flujo_actual: 'menu_contextual',
      paso_actual: 'opciones_recurrente'
    })

    const nombreUsuario = usuario.nombre || 'amigo'
    const tiempoSaludo = this.obtenerSaludoTiempo()
    
    let mensaje = `🎓 ¡${tiempoSaludo} ${nombreUsuario}! Te reconozco.\n\n`
    
    // Personalizar según última consulta
    if (usuario.tipo_consulta === 'solicitud de asesor') {
      mensaje += `👤 **Estado:** Un asesor se pondrá en contacto contigo pronto.\n\n`
    } else if (usuario.carrera_interes && usuario.carrera_interes !== 'Sin especificar') {
      mensaje += `📚 **Última consulta:** ${usuario.carrera_interes}\n\n`
    }
    
    mensaje += `🌟 **¿En qué puedo ayudarte hoy?**\n\n`
    
    // Menú contextual basado en historial
    if (usuario.carrera_interes && usuario.carrera_interes !== 'Sin especificar') {
      mensaje += `1️⃣ Más info sobre **${usuario.carrera_interes}**\n`
      mensaje += `2️⃣ Ver carreras similares\n`
      mensaje += `3️⃣ Proceso de admisión\n`
      mensaje += `4️⃣ Costos y becas\n`
      mensaje += `5️⃣ Hablar con un asesor\n`
      mensaje += `6️⃣ Consulta completamente nueva\n\n`
    } else {
      // Menú general mejorado
      mensaje += `1️⃣ Explorar carreras\n`
      mensaje += `2️⃣ Proceso de admisión 2025\n`
      mensaje += `3️⃣ Costos y becas\n`
      mensaje += `4️⃣ Modalidades de estudio\n`
      mensaje += `5️⃣ Hablar con un asesor\n`
      mensaje += `6️⃣ Búsqueda directa de carrera\n\n`
    }
    
    mensaje += `**Escribe el número de tu opción 📝**`
    
    return mensaje
  }

  private obtenerSaludoTiempo(): string {
    const hora = new Date().getHours()
    if (hora < 12) return 'Buenos días'
    if (hora < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  private async procesarMenuContextual(userId: string, mensaje: string): Promise<string> {
    const state = this.getUsuarioState(userId)
    
    if (mensaje === '6') {
      // Consulta completamente nueva - reiniciar
      this.resetUsuario(userId)
      this.setUsuarioState(userId, {
        flujo_actual: 'captura_inicial',
        paso_actual: 'solicitar_nombre'
      })
      return `🎓 ¡Perfecto! Empecemos de nuevo.\n\n👤 ¿Cuál es tu **nombre completo**?`
    }
    
    // Para usuarios con historial de carrera específica
    if (state.ultima_carrera_consultada && state.ultima_carrera_consultada !== 'Sin especificar') {
      if (mensaje === '1') {
        // Más info sobre carrera anterior
        const carrera = this.buscarCarreraPorNombre(state.ultima_carrera_consultada)
        if (carrera) {
          this.setUsuarioState(userId, {
            facultad_seleccionada: carrera.facultadId,
            carrera_seleccionada: carrera.carrera.id,
            flujo_actual: 'detalle_carrera',
            paso_actual: 'mostrar_info'
          })
          return this.mostrarDetalleCarrera(carrera.facultadId, carrera.carrera.id)
        }
      }
      
      if (mensaje === '2') {
        // Ver carreras similares
        const similares = this.buscarCarrerasSimilares(state.ultima_carrera_consultada)
        if (similares.length > 0) {
          let respuesta = `🔍 **Carreras similares a ${state.ultima_carrera_consultada}:**\n\n`
          
          similares.forEach((item, index) => {
            respuesta += `${index + 1}️⃣ **${item.carrera.nombre}**\n`
            respuesta += `   └ ${item.facultad.nombre}\n\n`
          })
          
          respuesta += `**Escribe el número de la carrera que te interesa:**`
          
          this.setUsuarioState(userId, {
            flujo_actual: 'busqueda_directa_carrera',
            paso_actual: 'seleccionar_sugerencia',
            carreras_sugeridas: similares
          })
          
          return respuesta
        }
      }
      
      if (mensaje === '3') {
        this.setUsuarioState(userId, {
          flujo_actual: 'proceso_admision',
          paso_actual: 'info_general',
          opcion_menu_seleccionada: 'proceso_admision'
        })
        return RESPUESTAS.proceso_admision
      }
      
      if (mensaje === '4') {
        this.setUsuarioState(userId, {
          opcion_menu_seleccionada: 'costos_becas'
        })
        return await this.mostrarCostosYBecas(userId)
      }
      
      if (mensaje === '5') {
        this.setUsuarioState(userId, {
          opcion_menu_seleccionada: 'hablar_asesor'
        })
        return await this.iniciarCapturaDatos(userId)
      }
    } else {
      // Menú general para usuarios sin carrera específica
      // Procesar opciones 1-6 del menú contextual general
      if (mensaje === '1') {
        this.setUsuarioState(userId, {
          flujo_actual: 'exploracion_carreras',
          paso_actual: 'seleccion_facultad',
          opcion_menu_seleccionada: 'conocer_carreras'
        })
        return RESPUESTAS.menu_facultades
      }
      
      if (mensaje === '2') {
        this.setUsuarioState(userId, {
          flujo_actual: 'proceso_admision',
          paso_actual: 'info_general',
          opcion_menu_seleccionada: 'proceso_admision'
        })
        return RESPUESTAS.proceso_admision
      }
      
      if (mensaje === '3') {
        this.setUsuarioState(userId, {
          opcion_menu_seleccionada: 'costos_becas'
        })
        return await this.mostrarCostosYBecas(userId)
      }
      
      if (mensaje === '4') {
        this.setUsuarioState(userId, {
          opcion_menu_seleccionada: 'modalidades_estudio'
        })
        return await this.mostrarModalidades(userId)
      }
      
      if (mensaje === '5') {
        this.setUsuarioState(userId, {
          opcion_menu_seleccionada: 'hablar_asesor'
        })
        return await this.iniciarCapturaDatos(userId)
      }
      
      if (mensaje === '6') {
        this.setUsuarioState(userId, {
          flujo_actual: 'busqueda_directa_carrera',
          paso_actual: 'solicitar_carrera',
          opcion_menu_seleccionada: 'busqueda_directa'
        })
        return `🚀 **¡Perfecto! Vamos directo al grano**

🎓 **¿Cuál es la carrera que te interesa?**

Escribe el nombre de la carrera que quieres estudiar (ejemplo: "Psicología", "Arquitectura", "Diseño", "Derecho", etc.):`
      }
    }
    
    // Si no entiende la opción, mostrar menú nuevamente
    return this.mostrarMenuContextual(userId, {
      nombre: state.datos_prospecto.nombre,
      carrera_interes: state.ultima_carrera_consultada
    })
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

    mensaje += `**¿Qué te gustaría hacer?**\n\n`
    mensaje += `1️⃣ Me interesa, quiero más información\n`
    mensaje += `2️⃣ No es para mí\n`
    mensaje += `3️⃣ Hablar con un asesor\n`
    mensaje += `4️⃣ Ver otra carrera\n\n`
    mensaje += `**Escribe solo el número (1, 2, 3 o 4):**`

    return mensaje
  }

  private async mostrarCostosYBecas(userId: string): Promise<string> {
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

    mensaje += `**¿Te interesan nuestros costos y becas?**\n\n`
    mensaje += `1️⃣ Sí, quiero más información\n`
    mensaje += `2️⃣ Hablar con un asesor sobre becas\n`
    mensaje += `3️⃣ Ver qué carreras hay\n`
    mensaje += `4️⃣ Ya tengo la info que necesitaba\n\n`
    mensaje += `**Escribe solo el número (1, 2, 3 o 4):**`
    
    this.setUsuarioState(userId, {
      flujo_actual: 'costos_becas_decision',
      paso_actual: 'opciones'
    })

    return mensaje
  }

  private async mostrarModalidades(userId: string): Promise<string> {
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

    mensaje += `**¿Qué modalidad te interesa más?**\n\n`
    mensaje += `1️⃣ Presencial - Máxima interacción\n`
    mensaje += `2️⃣ Semipresencial - Flexibilidad\n`
    mensaje += `3️⃣ Hablar con un asesor\n`
    mensaje += `4️⃣ Ya tengo la info que necesitaba\n\n`
    mensaje += `**Escribe solo el número (1, 2, 3 o 4):**`

    this.setUsuarioState(userId, {
      flujo_actual: 'modalidades_decision',
      paso_actual: 'opciones'
    })

    return mensaje
  }

  private async iniciarCapturaDatos(userId: string): Promise<string> {
    const state = this.getUsuarioState(userId)
    const datos = state.datos_prospecto

    // 🧠 CAPTURA INTELIGENTE - Evaluar qué datos tenemos y cuáles faltan
    const datosCompletos = await this.evaluarDatosExistentes(userId, state)
    
    // Si tenemos todos los datos necesarios, finalizar directamente
    if (datosCompletos.nombre && datosCompletos.email && datosCompletos.telefono) {
      console.log(`✅ Usuario ${userId} ya tiene todos los datos necesarios, finalizando solicitud de asesor`)
      return await this.finalizarSolicitudAsesor(userId, datosCompletos, state)
    }
    
    // Si faltan datos, iniciar captura inteligente desde el campo faltante
    return await this.iniciarCapturaInteligente(userId, datosCompletos, state)
  }

  // 🧠 MÉTODOS DE CAPTURA INTELIGENTE

  private async evaluarDatosExistentes(userId: string, state: any): Promise<any> {
    let datos = {
      nombre: state.datos_prospecto.nombre || null,
      email: state.datos_prospecto.email || null,
      telefono: state.datos_prospecto.telefono || null,
      edad: state.datos_prospecto.edad || null,
      region: state.datos_prospecto.region || null,
      carrera_interes: state.datos_prospecto.carrera_interes || null
    }

    // Si es usuario recurrente, verificar datos en BD
    if (state.es_usuario_recurrente) {
      const usuarioExistente = await this.verificarUsuarioExistente(userId)
      
      if (usuarioExistente) {
        console.log(`🔍 Evaluando datos existentes para usuario recurrente ${userId}`)
        
        // Combinar datos del estado con datos de BD (prioridad a datos más recientes)
        datos = {
          nombre: datos.nombre || usuarioExistente.nombre,
          email: datos.email || usuarioExistente.email,
          telefono: datos.telefono || usuarioExistente.telefono,
          edad: datos.edad || usuarioExistente.edad,
          region: datos.region || usuarioExistente.region,
          carrera_interes: datos.carrera_interes || usuarioExistente.carrera_interes
        }
        
        console.log(`📊 Datos consolidados:`, {
          nombre: datos.nombre ? '✅' : '❌',
          email: datos.email ? '✅' : '❌',
          telefono: datos.telefono ? '✅' : '❌',
          edad: datos.edad ? '✅' : '❌',
          region: datos.region ? '✅' : '❌'
        })
      }
    }

    return datos
  }

  // 🎯 MÉTODO ESPECÍFICO PARA CAPTURA DE ASESOR
  private async procesarCapturaAsesor(userId: string, mensaje: string): Promise<string> {
    const state = this.getUsuarioState(userId)
    
    // Según el paso actual, procesar la respuesta
    switch (state.paso_actual) {
      case PASOS.COLLECT_BASIC_INFO:
        // Si está pidiendo nombre
        if (!state.datos_prospecto.nombre) {
          if (mensaje.length >= 2) {
            this.setUsuarioState(userId, {
              datos_prospecto: { ...state.datos_prospecto, nombre: mensaje }
            })
            
            // Evaluar datos y continuar inteligentemente
            const datosCompletos = await this.evaluarDatosExistentes(userId, this.getUsuarioState(userId))
            return await this.iniciarCapturaInteligente(userId, datosCompletos, this.getUsuarioState(userId))
          } else {
            return 'Por favor, ingresa tu nombre completo (mínimo 2 caracteres)'
          }
        }
        
        // Si está pidiendo email
        if (!state.datos_prospecto.email) {
          if (this.validarEmail(mensaje)) {
            this.setUsuarioState(userId, {
              datos_prospecto: { ...state.datos_prospecto, email: mensaje }
            })
            
            // Evaluar datos y continuar inteligentemente
            const datosCompletos = await this.evaluarDatosExistentes(userId, this.getUsuarioState(userId))
            return await this.iniciarCapturaInteligente(userId, datosCompletos, this.getUsuarioState(userId))
          } else {
            return '📧 Por favor ingresa un email válido (debe contener @ y .)'
          }
        }
        break
        
      case PASOS.COLLECT_CONTACT_PREFERENCES:
        // Pidiendo teléfono
        const telefonoLimpio = mensaje.replace(/\s/g, '')
        if (telefonoLimpio.length < 8) {
          return '📱 Por favor ingresa un número de teléfono válido (mínimo 8 dígitos)'
        }
        
        this.setUsuarioState(userId, {
          datos_prospecto: { ...state.datos_prospecto, telefono: mensaje }
        })
        
        // Finalizar con todos los datos
        const datosCompletos = await this.evaluarDatosExistentes(userId, this.getUsuarioState(userId))
        return await this.finalizarSolicitudAsesor(userId, datosCompletos, this.getUsuarioState(userId))
        
      default:
        // Si no está en un paso específico, evaluar datos y continuar
        const datosActuales = await this.evaluarDatosExistentes(userId, state)
        return await this.iniciarCapturaInteligente(userId, datosActuales, state)
    }
    
    return 'Ha ocurrido un error. Escribe "hola" para reiniciar.'
  }

  private async iniciarCapturaInteligente(userId: string, datos: any, state: any): Promise<string> {
    // 🎓 CAPTURA INTELIGENTE CON ESTÁNDAR UNIVERSITARIO
    
    if (!datos.nombre) {
      this.setUsuarioState(userId, {
        flujo_actual: FLUJOS.PROSPECT_CAPTURE,
        paso_actual: PASOS.COLLECT_BASIC_INFO,
        opcion_menu_seleccionada: 'hablar_asesor'
      })
      return `🎓 **Conectemos contigo con un Asesor Académico Especializado**

Nuestros asesores están capacitados para ayudarte con:
• 🎯 Orientación vocacional personalizada
• 📋 Proceso de admisión y requisitos
• 💰 Becas y financiamiento disponible
• 🏫 Visitas al campus e instalaciones

👤 Para comenzar, ¿cuál es tu **nombre completo**?`
    }
    
    if (!datos.email) {
      this.setUsuarioState(userId, {
        flujo_actual: FLUJOS.PROSPECT_CAPTURE,
        paso_actual: PASOS.COLLECT_BASIC_INFO,
        opcion_menu_seleccionada: 'hablar_asesor',
        datos_prospecto: {
          ...state.datos_prospecto,
          ...datos
        }
      })
      return `👋 **¡Hola ${datos.nombre}! Un placer conocerte**

Para que nuestro **Asesor Académico** pueda enviarte información personalizada y programar una llamada:

📧 ¿Cuál es tu **email de contacto**?

💡 *Recibirás información exclusiva sobre UNIACC y tus programas de interés*`
    }
    
    if (!datos.telefono) {
      this.setUsuarioState(userId, {
        flujo_actual: FLUJOS.PROSPECT_CAPTURE,
        paso_actual: PASOS.COLLECT_CONTACT_PREFERENCES,
        opcion_menu_seleccionada: 'hablar_asesor',
        datos_prospecto: {
          ...state.datos_prospecto,
          ...datos
        }
      })
      return `✅ **Perfecto ${datos.nombre}!**

📧 Email registrado: ${datos.email}

Para finalizar tu **solicitud de asesoramiento académico**:

📱 ¿Cuál es tu **número de teléfono**?

🎯 *Nuestro asesor se comunicará contigo en las próximas 24 horas*`
    }
    
    // Si llegamos aquí, todos los datos están completos
    return await this.finalizarSolicitudAsesor(userId, datos, state)
  }

  private async finalizarSolicitudAsesor(userId: string, datos: any, state: any): Promise<string> {
      // Obtener información de facultad y carrera si están disponibles
      let facultadInfo = ''
      let carreraInfo = ''
      let carreraInteres = datos.carrera_interes || ''
      
      if (state.facultad_seleccionada && state.carrera_seleccionada) {
        const facultad = getFacultadById(state.facultad_seleccionada)
        const carrera = getCarreraById(state.facultad_seleccionada, state.carrera_seleccionada)
        
        if (facultad && carrera) {
          facultadInfo = facultad.nombre
          carreraInfo = carrera.nombre
          carreraInteres = `${facultad.nombre} - ${carrera.nombre}`
        }
      } else if (state.facultad_seleccionada) {
        const facultad = getFacultadById(state.facultad_seleccionada)
        if (facultad) {
          facultadInfo = facultad.nombre
          carreraInteres = `${facultad.nombre} (explorando carreras)`
        }
      }
      
      // Guardar solicitud de asesor
      try {
        const prospectoData: ProspectoData = {
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          whatsapp: userId,
          edad: datos.edad,
          region: datos.region,
        carrera_interes: carreraInfo || datos.carrera_interes,
          facultad_interes: facultadInfo,
        nivel_interes: NIVELES_INTERES.ALTO, // Alto porque solicita asesor
        tipo_consulta: TIPOS_CONSULTA.SOLICITUD_ASESOR,
        source: FUENTES.UNIACC_CHATBOT,
          flujo_actual: state.opcion_menu_seleccionada || 'hablar_asesor'
        }

        console.log('📋 Guardando solicitud de asesor para:', datos.nombre)
      console.log('🔧 Datos completos enviados:', JSON.stringify(prospectoData, null, 2))

        const resultado = await this.supabaseIntegration.enviarProspecto(prospectoData)
        
        if (resultado.success) {
          console.log('✅ Solicitud de asesor guardada exitosamente:', resultado.prospectoId)
          
        // Resetear usuario después de guardar exitosamente
          this.resetUsuario(userId)
          console.log(`🔄 Usuario ${userId} reseteado para nueva consulta`)
        }
      } catch (error) {
        console.error('💥 Error guardando solicitud de asesor:', error)
      }

    // Mantener en menu principal
      this.setUsuarioState(userId, {
        flujo_actual: 'menu_principal',
        paso_actual: null
      })

      return `🎉 **¡Solicitud de Asesoramiento Académico Confirmada!**

✅ **Datos de contacto registrados:**
👤 **Nombre:** ${datos.nombre}
📧 **Email:** ${datos.email}
📱 **Teléfono:** ${datos.telefono}
${datos.edad ? `🎂 **Edad:** ${datos.edad} años` : ''}
${datos.region ? `📍 **Región:** ${datos.region}` : ''}
${carreraInfo ? `🎓 **Programa de Interés:** ${carreraInfo}` : facultadInfo ? `🏫 **Facultad de Interés:** ${facultadInfo}` : datos.carrera_interes && datos.carrera_interes !== 'Sin especificar' ? `🎓 **Área de Interés:** ${datos.carrera_interes}` : ''}

---

📞 **Tu Asesor Académico Personal te contactará en las próximas 24 horas**

🎯 **Recibirás información especializada sobre:**
${carreraInfo ? `• **${carreraInfo}** - Plan de estudios, campo laboral y oportunidades` : ''}
${facultadInfo && !carreraInfo ? `• **${facultadInfo}** - Programas académicos disponibles` : ''}
• 📚 **Proceso de Admisión 2025** - Requisitos y fechas importantes
• 💰 **Becas y Financiamiento** - Opciones personalizadas según tu perfil
• 🏫 **Campus y Modalidades** - Presencial, online y semipresencial
• 🚀 **Oportunidades de Práctica** - Convenios con empresas líderes

🌟 **¿Sabías que UNIACC es pionera en Comunicación Audiovisual en Chile?**

**¡Gracias por confiar en nosotros para tu futuro académico!** 🎓✨

*UNIACC - Universidad de Artes, Ciencias y Comunicaciones*
*"Bienvenidos a Crear"*

💬 **Escribe "Hola" para realizar una nueva consulta**`
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
        whatsapp: userId,
        carrera_interes: state.carrera_seleccionada || datos.carrera_interes,
        facultad_interes: state.facultad_seleccionada,
        region: datos.region
      })

      if (resultado.success) {
        console.log('🎯 Prospecto guardado en Supabase:', resultado.data?.id)
      } else {
        console.warn('⚠️ Error Supabase, usando fallback:', resultado.error)
        // Fallback a memoria local
        if (typeof (global as any).agregarProspecto === 'function') {
          (global as any).agregarProspecto({
            ...datos,
            whatsapp: userId,
            carrera_interes: state.carrera_seleccionada || datos.carrera_interes,
            facultad_interes: state.facultad_seleccionada,
            region: datos.region
          })
        }
      }
    } catch (error: any) {
      console.error('💥 Error crítico con Supabase:', error.message)
      // Fallback a memoria local
      if (typeof (global as any).agregarProspecto === 'function') {
        (global as any).agregarProspecto({
          ...datos,
          whatsapp: userId,
          carrera_interes: state.carrera_seleccionada || datos.carrera_interes,
          facultad_interes: state.facultad_seleccionada,
          region: datos.region
        })
      }
    }

    // Mantener en menu principal en lugar de resetear
    this.setUsuarioState(userId, {
      flujo_actual: 'menu_principal',
      paso_actual: null
    })

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

  private buscarFacultadPorCarrera(nombreCarrera: string): { id: string; nombre: string } | null {
    const carreraLimpia = nombreCarrera.toLowerCase().trim()
    
    // Buscar en todas las facultades
    for (const facultadId of Object.keys(FACULTADES_UNIACC)) {
      const facultad = FACULTADES_UNIACC[facultadId]
      
      // Buscar si alguna carrera coincide
      const carreraEncontrada = facultad.carreras.find(carrera => 
        carrera.nombre.toLowerCase().includes(carreraLimpia) ||
        carreraLimpia.includes(carrera.nombre.toLowerCase()) ||
        carrera.id.toLowerCase() === carreraLimpia
      )
      
      if (carreraEncontrada) {
        return {
          id: facultadId,
          nombre: facultad.nombre
        }
      }
    }
    
    return null
  }

  private buscarCarreraPorNombre(nombreCarrera: string): { facultadId: string; carrera: any } | null {
    const carreraLimpia = nombreCarrera.toLowerCase().trim()
    
    // Buscar en todas las facultades
    for (const facultadId of Object.keys(FACULTADES_UNIACC)) {
      const facultad = FACULTADES_UNIACC[facultadId]
      
      // Buscar si alguna carrera coincide exactamente
      const carreraEncontrada = facultad.carreras.find(carrera => 
        carrera.nombre.toLowerCase() === carreraLimpia ||
        carrera.nombre.toLowerCase().includes(carreraLimpia) ||
        carreraLimpia.includes(carrera.nombre.toLowerCase()) ||
        carrera.id.toLowerCase() === carreraLimpia
      )
      
      if (carreraEncontrada) {
        return {
          facultadId,
          carrera: carreraEncontrada
        }
      }
    }
    
    return null
  }

  private buscarCarrerasSimilares(nombreCarrera: string): { facultadId: string; facultad: any; carrera: any }[] {
    const carreraLimpia = nombreCarrera.toLowerCase().trim()
    const resultados: { facultadId: string; facultad: any; carrera: any }[] = []
    
    // Buscar en todas las facultades
    for (const facultadId of Object.keys(FACULTADES_UNIACC)) {
      const facultad = FACULTADES_UNIACC[facultadId]
      
      // Buscar carreras que contengan alguna palabra del término buscado
      const palabrasBusqueda = carreraLimpia.split(' ')
      
      facultad.carreras.forEach(carrera => {
        const nombreCarreraLimpio = carrera.nombre.toLowerCase()
        
        // Verificar si alguna palabra del término buscado está en el nombre de la carrera
        const tieneCoincidencia = palabrasBusqueda.some(palabra => 
          nombreCarreraLimpio.includes(palabra) && palabra.length > 2
        )
        
        if (tieneCoincidencia) {
          resultados.push({
            facultadId,
            facultad,
            carrera
          })
        }
      })
    }
    
    // Limitar a máximo 5 resultados y eliminar duplicados
    return resultados.slice(0, 5)
  }

  private mostrarMenuNavegacion(): string {
    return `📱 **¿QUÉ MÁS QUIERES SABER?**

1️⃣ **Conocer nuestras carreras**
2️⃣ **Proceso de admisión 2025**  
3️⃣ **Costos y becas**
4️⃣ **Modalidades de estudio**
5️⃣ **Hablar con un asesor**

Escribe el número de tu opción 📝`
  }

  // Método para obtener datos del prospecto (para webhook)
  getProspectoData(userId: string) {
    const state = this.getUsuarioState(userId)
    return {
      whatsapp: userId,
      source: 'uniacc_chatbot',
      timestamp: new Date().toISOString(),
      carrera_interes: state.carrera_seleccionada || state.datos_prospecto.carrera_interes,
      facultad_interes: state.facultad_seleccionada,
      flujo_actual: state.opcion_menu_seleccionada || 'consulta_general',
      ...state.datos_prospecto
    }
  }

  // Método para guardar prospecto al final de cada flujo
  private async guardarProspectoFinalFlujo(userId: string, tipoConsulta: string) {
    const state = this.getUsuarioState(userId)
    const datos = state.datos_prospecto
    
    // 🔄 PARA USUARIOS RECURRENTES: Usar datos de BD si no están en estado temporal
    if (state.es_usuario_recurrente && (!datos.nombre || !datos.email)) {
      console.log('🔄 Usuario recurrente detectado, recuperando datos de BD...')
      return await this.guardarProspectoRecurrente(userId, tipoConsulta)
    }
    
    // Solo guardar si tenemos los datos mínimos
    if (!datos.nombre || !datos.email || !datos.telefono) {
      console.log('⚠️ No se puede guardar prospecto, faltan datos básicos')
      return
    }

    try {
      // Obtener nombres legibles para facultad y carrera
      let facultadNombre = 'Sin especificar'
      let carreraNombre = 'Sin especificar'
      
      if (state.facultad_seleccionada) {
        const facultad = getFacultadById(state.facultad_seleccionada)
        if (facultad) {
          facultadNombre = facultad.nombre
        }
      }
      
      if (state.carrera_seleccionada && state.facultad_seleccionada) {
        const carrera = getCarreraById(state.facultad_seleccionada, state.carrera_seleccionada)
        if (carrera) {
          carreraNombre = carrera.nombre
        }
      } else if (datos.carrera_interes) {
        carreraNombre = datos.carrera_interes
      }

      const prospectoData: ProspectoData = {
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        whatsapp: userId,
        edad: datos.edad,
        region: datos.region,
        carrera_interes: carreraNombre,
        facultad_interes: facultadNombre,
        source: 'uniacc_chatbot',
        flujo_actual: tipoConsulta
      }

      console.log(`💾 Guardando prospecto al finalizar flujo ${tipoConsulta}:`, datos.nombre)
      console.log('🔍 DEBUG - Datos del estado completo:', JSON.stringify(state, null, 2))
      console.log('🔍 DEBUG - ProspectoData a enviar:', JSON.stringify(prospectoData, null, 2))
      const resultado = await this.supabaseIntegration.enviarProspecto(prospectoData)
      
      if (resultado.success) {
        console.log(`✅ Prospecto guardado exitosamente para flujo ${tipoConsulta}:`, resultado.prospectoId)
        
        // Resetear usuario después de guardar exitosamente para permitir nueva consulta
        this.resetUsuario(userId)
        console.log(`🔄 Usuario ${userId} reseteado para nueva consulta`)
      } else {
        console.error(`❌ Error guardando prospecto para flujo ${tipoConsulta}:`, resultado.error)
      }
    } catch (error) {
      console.error(`💥 Error al guardar prospecto para flujo ${tipoConsulta}:`, error)
    }
  }

  // 🔄 MÉTODO ESPECÍFICO PARA USUARIOS RECURRENTES
  private async guardarProspectoRecurrente(userId: string, tipoConsulta: string) {
    try {
      const state = this.getUsuarioState(userId)
      
      // Buscar datos del usuario en BD
      const usuarioExistente = await this.verificarUsuarioExistente(userId)
      if (!usuarioExistente) {
        console.log('⚠️ No se encontraron datos del usuario recurrente en BD')
        return
      }

      // Obtener nombres legibles para facultad y carrera ACTUAL
      let facultadNombre = 'Sin especificar'
      let carreraNombre = 'Sin especificar'
      
      if (state.facultad_seleccionada) {
        const facultad = getFacultadById(state.facultad_seleccionada)
        if (facultad) {
          facultadNombre = facultad.nombre
        }
      }
      
      if (state.carrera_seleccionada && state.facultad_seleccionada) {
        const carrera = getCarreraById(state.facultad_seleccionada, state.carrera_seleccionada)
        if (carrera) {
          carreraNombre = carrera.nombre
          console.log(`🎓 Carrera seleccionada en esta sesión: ${carreraNombre}`)
        }
      }

      const prospectoData: ProspectoData = {
        nombre: usuarioExistente.nombre,
        email: usuarioExistente.email,
        telefono: usuarioExistente.telefono,
        whatsapp: userId,
        edad: usuarioExistente.edad,
        region: usuarioExistente.region,
        carrera_interes: carreraNombre, // 🎯 ACTUALIZAR con carrera actual
        facultad_interes: facultadNombre, // 🎯 ACTUALIZAR con facultad actual
        nivel_interes: NIVELES_INTERES.ALTO, // Usuario recurrente que expresa interés
        tipo_consulta: tipoConsulta,
        source: FUENTES.UNIACC_CHATBOT,
        flujo_actual: tipoConsulta
      }

      console.log(`💾 [RECURRENTE] Guardando prospecto para ${usuarioExistente.nombre}`)
      console.log(`🎓 [RECURRENTE] Nueva carrera de interés: ${carreraNombre}`)
      console.log('🔍 DEBUG - ProspectoData recurrente:', JSON.stringify(prospectoData, null, 2))
      
      const resultado = await this.supabaseIntegration.enviarProspecto(prospectoData)
      
      if (resultado.success) {
        console.log(`✅ [RECURRENTE] Prospecto actualizado con nueva carrera: ${carreraNombre}`)
        
        // Resetear usuario después de guardar exitosamente
        this.resetUsuario(userId)
        console.log(`🔄 [RECURRENTE] Usuario ${userId} reseteado para nueva consulta`)
      } else {
        console.error('❌ [RECURRENTE] Error actualizando prospecto:', resultado.error)
      }
      
    } catch (error) {
      console.error('💥 Error guardando prospecto recurrente:', error)
    }
  }

  // 💾 MÉTODOS DE CAPTURA INCREMENTAL

  // Crear prospecto inicial con solo nombre
  private async crearProspectoInicial(userId: string, nombre: string): Promise<string | null> {
    try {
      const prospectoData: ProspectoData = {
        nombre: nombre,
        email: null, // null para cumplir constraint valid_email
        telefono: null, // null inicialmente
        whatsapp: userId,
        carrera_interes: "Sin especificar",
        facultad_interes: "",
        nivel_interes: 'medio',
        tipo_consulta: 'abandono solo nombre', // Estado inicial - puede cambiar
        source: 'uniacc_chatbot',
        flujo_actual: 'captura_inicial'
      }

      console.log(`💾 Creando prospecto inicial para ${userId}: ${nombre}`)
      const resultado = await this.supabaseIntegration.enviarProspecto(prospectoData)
      
      if (resultado.success) {
        console.log(`✅ Prospecto inicial creado: ${resultado.prospectoId}`)
        return resultado.prospectoId || null
      } else {
        console.error(`❌ Error creando prospecto inicial: ${resultado.error}`)
        return null
      }
      
    } catch (error) {
      console.error(`💥 Error crítico creando prospecto inicial:`, error)
      return null
    }
  }

  // Actualizar prospecto con campo específico
  private async actualizarProspectoCampo(
    prospectoId: string, 
    campo: string, 
    valor: any, 
    ultimoCampo?: string
  ): Promise<boolean> {
    try {
      // Para la actualización, usamos directamente Supabase
      console.log(`🔄 Actualizando campo ${campo} del prospecto ${prospectoId}: ${valor}`)
      
      // TODO: Implementar actualización directa via Supabase
      // Por ahora solo loggeamos la acción
      console.log(`📝 [SIMULADO] Prospecto ${prospectoId} → ${campo}: ${valor}`)
      
      if (ultimoCampo) {
        console.log(`📋 Último campo capturado: ${ultimoCampo}`)
      }
      
      return true
      
    } catch (error) {
      console.error(`❌ Error actualizando campo ${campo}:`, error)
      return false
    }
  }

  // Marcar prospecto como completo o con tipo específico de abandono
  private async finalizarProspecto(
    prospectoId: string, 
    tipoConsulta: string, 
    nivelInteres: string = 'medio'
  ): Promise<boolean> {
    try {
      console.log(`🏁 Finalizando prospecto ${prospectoId} como: ${tipoConsulta}`)
      
      // TODO: Implementar actualización final via Supabase
      console.log(`📝 [SIMULADO] Prospecto ${prospectoId} → tipo_consulta: ${tipoConsulta}, nivel_interes: ${nivelInteres}`)
      
      return true
      
    } catch (error) {
      console.error(`❌ Error finalizando prospecto:`, error)
      return false
    }
  }

  // ⏰ MÉTODOS DE TIMEOUT DE SESIÓN

  // Configurar timeout para cada mensaje
  private setSessionTimeout(userId: string): void {
    this.clearTimeouts(userId)
    
    const state = this.getUsuarioState(userId)
    state.fecha_ultima_interaccion = new Date()
    state.timeout_warning_sent = false
    
    // Warning a los 1.5 minutos
    const warningTimeout = setTimeout(async () => {
      await this.sendWarningMessage(userId)
    }, this.WARNING_TIMEOUT)
    
    // Timeout final a los 2 minutos
    const sessionTimeout = setTimeout(async () => {
      await this.handleSessionTimeout(userId)
    }, this.SESSION_TIMEOUT)
    
    // Guardar referencias para poder cancelarlos
    state.warning_timeout_id = warningTimeout
    state.session_timeout_id = sessionTimeout
  }
  
  // Limpiar timeouts existentes
  private clearTimeouts(userId: string): void {
    const state = this.usuarios.get(userId)
    if (state) {
      if (state.warning_timeout_id) {
        clearTimeout(state.warning_timeout_id)
        state.warning_timeout_id = undefined
      }
      if (state.session_timeout_id) {
        clearTimeout(state.session_timeout_id)
        state.session_timeout_id = undefined
      }
    }
  }
  
  // Enviar mensaje de advertencia personalizado
  private async sendWarningMessage(userId: string): Promise<string | null> {
    const state = this.getUsuarioState(userId)
    
    if (state.timeout_warning_sent) return null // Ya enviado
    
    state.timeout_warning_sent = true
    const warningMessage = this.generateWarningMessage(state)
    
    console.log(`⏰ Warning generado para ${userId}: ${warningMessage}`)
    
    // Guardar mensaje para polling del frontend
    this.mensajesPendientes.set(userId, {
      tipo: 'warning',
      mensaje: warningMessage,
      timestamp: new Date()
    })
    
    // TODO: Implementar envío por WhatsApp para producción
    // try {
    //   const { WhatsAppSender } = await import('../utils/whatsapp-sender')
    //   const sender = new WhatsAppSender(
    //     process.env.WHATSAPP_ACCESS_TOKEN!,
    //     process.env.WHATSAPP_PHONE_NUMBER_ID!
    //   )
    //   
    //   await sender.enviarMensaje(userId, warningMessage)
    //   console.log(`⏰ Warning enviado por WhatsApp a ${userId}`)
    //   
    // } catch (error) {
    //   console.error(`❌ Error enviando warning por WhatsApp a ${userId}:`, error)
    // }
    
    // Para modo demo: retornar el mensaje para mostrar en interfaz
    return warningMessage
  }
  
  // Manejar timeout de sesión
  private async handleSessionTimeout(userId: string): Promise<string> {
    const state = this.getUsuarioState(userId)
    
    console.log(`⏰ Sesión timeout para ${userId}, evaluando datos...`)
    
    // Decidir si guardar datos
    const shouldSave = this.shouldSaveTimeoutData(state)
    let dataSaved = false
    
    if (shouldSave) {
      try {
        await this.saveTimeoutSessionData(userId, state)
        dataSaved = true
        console.log(`💾 Datos parciales guardados para ${userId}`)
      } catch (error) {
        console.error(`❌ Error guardando datos parciales:`, error)
      }
    }
    
    // Generar mensaje de timeout personalizado
    const timeoutMessage = this.generateTimeoutMessage(state, dataSaved)
    
    console.log(`⏰ Timeout message generado para ${userId}: ${timeoutMessage}`)
    
    // Guardar mensaje para polling del frontend
    this.mensajesPendientes.set(userId, {
      tipo: 'timeout',
      mensaje: timeoutMessage,
      timestamp: new Date()
    })
    
    // TODO: Implementar envío por WhatsApp para producción
    // try {
    //   const { WhatsAppSender } = await import('../utils/whatsapp-sender')
    //   const sender = new WhatsAppSender(
    //     process.env.WHATSAPP_ACCESS_TOKEN!,
    //     process.env.WHATSAPP_PHONE_NUMBER_ID!
    //   )
    //   
    //   await sender.enviarMensaje(userId, timeoutMessage)
    //   console.log(`⏰ Timeout message enviado por WhatsApp a ${userId}`)
    //   
    // } catch (error) {
    //   console.error(`❌ Error enviando timeout message por WhatsApp:`, error)
    // }
    
    // Limpiar sesión
    this.clearTimeouts(userId)
    this.resetUsuario(userId)
    
    console.log(`🧹 Sesión limpiada para ${userId}`)
    
    // Para modo demo: retornar el mensaje para mostrar en interfaz
    return timeoutMessage
  }

  // Generar mensaje de warning personalizado
  private generateWarningMessage(state: UsuarioState): string {
    const nombre = state.datos_prospecto.nombre
    
    if (nombre && nombre.trim().length > 0) {
      return `⏰ ${nombre}, tu sesión caducará en 30 segundos por inactividad.`
    } else {
      return `⏰ Tu sesión caducará en 30 segundos por inactividad.`
    }
  }

  // Generar mensaje de timeout personalizado
  private generateTimeoutMessage(state: UsuarioState, dataSaved: boolean): string {
    const nombre = state.datos_prospecto.nombre
    
    if (dataSaved) {
      return `⏰ ${nombre ? `${nombre}, tu` : 'Tu'} sesión ha finalizado por inactividad.

📋 **Hemos guardado tus datos** para futuras consultas.

Un asesor podrá contactarte cuando lo necesites.

💬 **Escribe "Hola" para continuar explorando UNIACC**`
    } else {
      const nombreDisplay = nombre ? ` ${nombre}` : ''
      return `⏰ Sesión finalizada por inactividad.${nombreDisplay ? ` ¡Hasta pronto${nombreDisplay}!` : ''}

💬 **Escribe "Hola" para comenzar una nueva consulta**`
    }
  }

  // Evaluar si guardar datos por timeout (criterio mejorado con progressive capture)
  private shouldSaveTimeoutData(state: UsuarioState): boolean {
    const datos = state.datos_prospecto
    
    // 🆕 PROGRESSIVE: Si ya tiene prospecto_id, siempre actualizar
    if (state.prospecto_id) {
      return true
    }
    
    // ✅ GUARDAR si tiene al menos nombre (progressive capture creará inicial)
    return !!(datos.nombre)
  }

  // Guardar datos por timeout con progressive capture
  private async saveTimeoutSessionData(userId: string, state: UsuarioState): Promise<void> {
    const datos = state.datos_prospecto
    
    // 🆕 PROGRESSIVE: Si ya tiene prospecto_id, actualizar existente
    if (state.prospecto_id) {
      console.log(`💾 Actualizando prospecto existente por timeout: ${state.prospecto_id}`)
      
      // Determinar tipo_consulta según campos completados
      const camposCompletos = state.campos_capturados || []
      let tipoConsulta = 'abandono solo nombre'
      
      if (camposCompletos.includes('email')) {
        tipoConsulta = 'abandono con email'
      }
      if (camposCompletos.includes('edad')) {
        tipoConsulta = 'abandono con edad'
      }
      if (camposCompletos.includes('region')) {
        tipoConsulta = 'abandono con region'
      }
      if (camposCompletos.includes('telefono')) {
        tipoConsulta = 'ingreso solo datos basicos' // Completó datos básicos
      }
      
      // Finalizar prospecto con estado de abandono
      await this.finalizarProspecto(
        state.prospecto_id,
        tipoConsulta,
        'bajo' // Nivel bajo por timeout
      )
      
      console.log(`✅ Prospecto actualizado por timeout: ${state.prospecto_id} (${tipoConsulta})`)
      return
    }
    
    // 🄆 FALLBACK: Si no hay prospecto_id, crear uno nuevo (caso legacy)
    if (datos.nombre) {
      const prospectoId = await this.crearProspectoInicial(userId, datos.nombre)
      
      if (prospectoId) {
        // Actualizar campos adicionales si existen
        if (datos.email) await this.actualizarProspectoCampo(prospectoId, 'email', datos.email)
        if (datos.edad) await this.actualizarProspectoCampo(prospectoId, 'edad', datos.edad)
        if (datos.region) await this.actualizarProspectoCampo(prospectoId, 'region', datos.region)
        if (datos.telefono) await this.actualizarProspectoCampo(prospectoId, 'telefono', datos.telefono)
        
        // Finalizar como abandono
        const tipoConsulta = datos.telefono ? 'ingreso solo datos basicos' : 'abandono incompleto'
        await this.finalizarProspecto(prospectoId, tipoConsulta, 'bajo')
        
        console.log(`✅ Prospecto timeout creado y finalizado: ${prospectoId} (${tipoConsulta})`)
      }
    }
  }

  // ⏰ MÉTODOS PÚBLICOS PARA INTERFAZ DEMO

  // Verificar si hay pending timeout warning para mostrar en interfaz
  async checkForTimeoutWarning(userId: string): Promise<string | null> {
    const mensajePendiente = this.mensajesPendientes.get(userId)
    
    if (mensajePendiente && mensajePendiente.tipo === 'warning') {
      // Remover mensaje después de recuperarlo
      this.mensajesPendientes.delete(userId)
      console.log(`📱 [POLLING] Warning recuperado para ${userId}`)
      return mensajePendiente.mensaje
    }
    
    return null
  }

  // Verificar si hay pending timeout final para mostrar en interfaz
  async checkForSessionTimeout(userId: string): Promise<string | null> {
    const mensajePendiente = this.mensajesPendientes.get(userId)
    
    if (mensajePendiente && mensajePendiente.tipo === 'timeout') {
      // Remover mensaje después de recuperarlo
      this.mensajesPendientes.delete(userId)
      console.log(`📱 [POLLING] Timeout final recuperado para ${userId}`)
      return mensajePendiente.mensaje
    }
    
    return null
  }

  // Método para forzar timeout desde interfaz (para testing)
  async forceTimeout(userId: string): Promise<string> {
    return await this.handleSessionTimeout(userId)
  }

  // Verificar cualquier mensaje pendiente (warning o timeout)
  async checkForPendingMessage(userId: string): Promise<{ status: 'warning' | 'timeout' | 'active', message: string | null }> {
    const mensajePendiente = this.mensajesPendientes.get(userId)
    
    if (mensajePendiente) {
      // Remover mensaje después de recuperarlo
      this.mensajesPendientes.delete(userId)
      console.log(`📱 [POLLING] Mensaje ${mensajePendiente.tipo} recuperado para ${userId}`)
      
      return {
        status: mensajePendiente.tipo,
        message: mensajePendiente.mensaje
      }
    }
    
    return {
      status: 'active',
      message: null
    }
  }

}