import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { UniaccBot } from './actions/uniacc-scripts'
import { WhatsAppSender } from './utils/whatsapp-sender'
import { emailValidator, phoneValidator, nameValidator } from './utils/validators'
import { SupabaseIntegration } from './actions/supabase-integration'

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.BOT_PORT || 3001

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.tailwindcss.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}))
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Inicializar servicios
const whatsappSender = new WhatsAppSender(
  process.env.WHATSAPP_ACCESS_TOKEN!,
  process.env.WHATSAPP_PHONE_NUMBER_ID!
)

const supabaseIntegration = new SupabaseIntegration(
  process.env.VUE_WEBHOOK_URL!,
  process.env.VUE_WEBHOOK_SECRET!
)

const uniaccBot = new UniaccBot()

// 💾 Base de datos en memoria para el MVP
const prospectos: any[] = []
const stats = {
  total: 0,
  nuevos: 0,
  contactados: 0,
  interesados: 0,
  matriculados: 0,
  descartados: 0,
  conversion_rate: 0
}

// 📊 Función para agregar prospecto en memoria
function agregarProspecto(datos: any) {
  const prospecto = {
    id: `prospecto-${Date.now()}`,
    nombre: datos.nombre || 'Sin nombre',
    email: datos.email || 'sin-email@example.com', 
    telefono: datos.telefono || 'Sin teléfono',
    whatsapp: datos.whatsapp,
    carrera_interes: datos.carrera_interes || 'Sin especificar',
    source: 'uniacc_chatbot',
    estado: 'nuevo',
    fuente: 'uniacc_chatbot',
    nivel_interes: 'alto',
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
  
  prospectos.push(prospecto)
  
  // Actualizar stats
  stats.total = prospectos.length
  stats.nuevos = prospectos.filter(p => p.estado === 'nuevo').length
  
  console.log(`✅ Prospecto guardado en memoria: ${prospecto.nombre}`)
  return prospecto
}

// Hacer función disponible globalmente
;(global as any).agregarProspecto = agregarProspecto

// Función para validar webhook de WhatsApp (versión simplificada)
function validarWhatsAppWebhook(body: any) {
  // Para demo, aceptamos cualquier mensaje que tenga la estructura básica
  if (body && body.from && body.message) {
    return {
      valido: true,
      data: {
        from: body.from,
        message: body.message,
        messageId: body.messageId || `msg-${Date.now()}`
      }
    }
  }
  
  // También aceptamos webhook format estándar de WhatsApp
  if (body.entry && body.entry[0] && body.entry[0].changes) {
    try {
      const messages = body.entry[0].changes[0].value.messages
      if (messages && messages[0]) {
        const msg = messages[0]
        return {
          valido: true,
          data: {
            from: msg.from,
            message: msg.text?.body || 'mensaje',
            messageId: msg.id
          }
        }
      }
    } catch (e) {
      // Continuar con validación fallida
    }
  }
  
  return {
    valido: false,
    error: 'Formato de webhook inválido'
  }
}

// Rate limiting simple
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function limitarRateLimiting(from: string): boolean {
  const now = Date.now()
  const maxRequests = 10
  const windowMs = 60000 // 1 minuto
  
  const userLimit = rateLimitMap.get(from)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(from, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  return true
}

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`)
  next()
})

// **ENDPOINT PRINCIPAL: Webhook de WhatsApp**
app.post('/webhook', async (req: Request, res: Response) => {
  try {
    console.log('📨 Webhook recibido:', JSON.stringify(req.body, null, 2))

    // Validar webhook de WhatsApp
    const validacion = validarWhatsAppWebhook(req.body)
    
    if (!validacion.valido) {
      console.error('❌ Webhook inválido:', validacion.error)
      return res.status(400).json({ error: validacion.error })
    }

    const { from, message, messageId } = validacion.data!

    // Rate limiting
    if (!limitarRateLimiting(from)) {
      console.warn(`⚠️ Rate limit excedido para ${from}`)
      return res.status(429).json({ error: 'Too many requests' })
    }

    console.log(`📱 Mensaje de ${from}: "${message}"`)

    // Procesar mensaje con el bot UNIACC
    const respuesta = await uniaccBot.procesarMensaje(from, message)

    // Enviar respuesta vía WhatsApp
    const enviado = await whatsappSender.enviarMensajeConReintentos(from, respuesta)

    if (!enviado) {
      console.error(`❌ Error enviando respuesta a ${from}`)
      return res.status(500).json({ error: 'Error enviando respuesta' })
    }

    // ✅ Las interacciones se registran solo localmente por ahora
    // await supabaseIntegration.registrarInteraccion(from, message, respuesta)

    // Si el usuario completó la captura de datos, enviar al dashboard
    // ✅ Los prospectos ahora se guardan directamente en uniacc-scripts.ts
    // Esta sección se comenta para evitar el loop infinito
    /*
    const prospectoData = uniaccBot.getProspectoData(from)
    if (prospectoData.nombre && prospectoData.email && prospectoData.telefono) {
      console.log('💾 Enviando prospecto completo al dashboard...')
      // ... código comentado para evitar duplicados
    }
    */

    return res.status(200).json({ 
      status: 'success', 
      messageId: messageId,
      response: respuesta 
    })

  } catch (error: any) {
    console.error('💥 Error crítico en webhook:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// **ENDPOINT: Verificación de webhook (requerido por WhatsApp)**
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado exitosamente')
    res.status(200).send(challenge)
  } else {
    console.error('❌ Error verificando webhook')
    res.status(403).send('Forbidden')
  }
})

// **ENDPOINT: Página web de demostración**
app.get('/', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UNIACC ChatBot MVP - Demostración</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .chat-message { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="bg-blue-600 text-white p-6 rounded-t-lg">
            <h1 class="text-3xl font-bold">🎓 UNIACC ChatBot MVP</h1>
            <p class="text-blue-100">Asistente virtual para captura de prospectos universitarios</p>
        </div>

        <!-- Demo Buttons -->
        <div class="bg-white p-6 border-x border-gray-200">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button onclick="runDemo()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    🚀 Demo Automático
                </button>
                <button onclick="showCareers()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    🎓 Ver Carreras
                </button>
                <button onclick="showStats()" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    📊 Estadísticas
                </button>
            </div>

            <!-- Interactive Chat -->
            <div class="border-t pt-6">
                <h3 class="text-xl font-semibold mb-4">💬 Chat Interactivo</h3>
                <div class="flex gap-2 mb-4">
                    <input type="text" id="messageInput" placeholder="Escribe un mensaje (ej: hola)" 
                           class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button onclick="sendMessage()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                        Enviar
                    </button>
                </div>
            </div>
        </div>

        <!-- Results Area -->
        <div class="bg-white p-6 rounded-b-lg border-x border-b border-gray-200">
            <div id="results" class="space-y-4">
                <div class="text-gray-500 text-center py-8">
                    👆 Haz clic en uno de los botones de arriba para comenzar la demostración
                </div>
            </div>
        </div>

        <!-- Features -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="text-2xl mb-2">🤖</div>
                <h4 class="font-semibold">IA Conversacional</h4>
                <p class="text-sm text-gray-600">Flujos inteligentes y naturales</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="text-2xl mb-2">📊</div>
                <h4 class="font-semibold">Captura de Leads</h4>
                <p class="text-sm text-gray-600">Datos estructurados para CRM</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="text-2xl mb-2">🎓</div>
                <h4 class="font-semibold">Catálogo Completo</h4>
                <p class="text-sm text-gray-600">13 carreras, 5 facultades</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="text-2xl mb-2">🔗</div>
                <h4 class="font-semibold">Integración</h4>
                <p class="text-sm text-gray-600">WhatsApp + Supabase + Vue</p>
            </div>
        </div>
    </div>

    <script>
        const resultsDiv = document.getElementById('results');
        const messageInput = document.getElementById('messageInput');
        const currentPhone = '56912345' + Math.floor(Math.random() * 1000);

        function addResult(title, data, type = 'json') {
            const div = document.createElement('div');
            div.className = 'chat-message border border-gray-200 rounded-lg p-4';
            
            if (type === 'conversation') {
                div.innerHTML = \`
                    <h4 class="font-semibold text-green-600 mb-2">\${title}</h4>
                    <div class="space-y-2">
                        \${data.conversacion_completa.map(msg => \`
                            <div class="border-l-4 border-blue-500 pl-3 py-1">
                                <div class="text-sm font-semibold text-gray-600">Usuario: \${msg.usuario}</div>
                                <div class="text-sm whitespace-pre-line">\${msg.bot}</div>
                            </div>
                        \`).join('')}
                    </div>
                    <div class="mt-4 p-3 bg-green-50 rounded">
                        <strong>📊 Prospecto Capturado:</strong> \${data.total_intercambios} intercambios
                    </div>
                \`;
            } else if (type === 'careers') {
                div.innerHTML = \`
                    <h4 class="font-semibold text-blue-600 mb-2">\${title}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        \${data.facultades.map(fac => \`
                            <div class="border rounded p-3">
                                <h5 class="font-semibold">\${fac.emoji} \${fac.nombre}</h5>
                                <p class="text-sm text-gray-600">\${fac.total_carreras} carreras disponibles</p>
                                <div class="mt-2 space-y-1">
                                    \${fac.carreras.map(car => \`
                                        <div class="text-xs bg-gray-50 p-1 rounded">
                                            \${car.nombre} - \${car.duracion}
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                \`;
            } else if (type === 'chat') {
                div.innerHTML = \`
                    <div class="border-l-4 border-green-500 pl-3">
                        <div class="text-sm font-semibold text-gray-600">Usuario: \${data.conversation.user_message}</div>
                        <div class="text-sm whitespace-pre-line mt-1">\${data.conversation.bot_response}</div>
                    </div>
                \`;
            } else {
                div.innerHTML = \`
                    <h4 class="font-semibold text-purple-600 mb-2">\${title}</h4>
                    <pre class="bg-gray-50 p-3 rounded text-sm overflow-x-auto">\${JSON.stringify(data, null, 2)}</pre>
                \`;
            }
            
            resultsDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth' });
        }

        async function runDemo() {
            resultsDiv.innerHTML = '<div class="text-center py-4">🔄 Ejecutando demo automático...</div>';
            
            try {
                const response = await fetch('/demo-flujo', { method: 'POST' });
                const data = await response.json();
                
                resultsDiv.innerHTML = '';
                addResult('🚀 Demo Completo - Conversación UNIACC', data, 'conversation');
            } catch (error) {
                resultsDiv.innerHTML = '<div class="text-red-500 text-center py-4">❌ Error ejecutando demo</div>';
            }
        }

        async function showCareers() {
            resultsDiv.innerHTML = '<div class="text-center py-4">🔄 Cargando carreras...</div>';
            
            try {
                const response = await fetch('/carreras');
                const data = await response.json();
                
                resultsDiv.innerHTML = '';
                addResult(\`🎓 Catálogo UNIACC - \${data.total_carreras} Carreras en \${data.total_facultades} Facultades\`, data, 'careers');
            } catch (error) {
                resultsDiv.innerHTML = '<div class="text-red-500 text-center py-4">❌ Error cargando carreras</div>';
            }
        }

        async function showStats() {
            resultsDiv.innerHTML = '<div class="text-center py-4">🔄 Cargando estadísticas...</div>';
            
            try {
                const response = await fetch('/stats');
                const data = await response.json();
                
                resultsDiv.innerHTML = '';
                addResult('📊 Estadísticas del Sistema', data);
            } catch (error) {
                resultsDiv.innerHTML = '<div class="text-red-500 text-center py-4">❌ Error cargando estadísticas</div>';
            }
        }

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            messageInput.value = '';
            messageInput.disabled = true;

            try {
                const response = await fetch('/test-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: currentPhone, message })
                });
                const data = await response.json();
                
                addResult('💬 Respuesta del Bot', data, 'chat');
            } catch (error) {
                addResult('❌ Error', { error: 'No se pudo enviar el mensaje' });
            }

            messageInput.disabled = false;
            messageInput.focus();
        }

        // Enter key support
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Auto-focus
        messageInput.focus();
    </script>
</body>
</html>
  `;
  
  res.send(html);
})

// **ENDPOINT: Health check**
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'UNIACC WhatsApp Bot'
  })
})

// **ENDPOINT: Estadísticas del bot**
app.get('/stats', (req: Request, res: Response) => {
  // En una implementación real, esto vendría de una base de datos
  res.status(200).json({
    usuarios_activos: 0, // Implementar contador real
    mensajes_procesados: 0, // Implementar contador real
    prospectos_capturados: 0, // Implementar contador real
    uptime: process.uptime(),
    memoria_uso: process.memoryUsage(),
    timestamp: new Date().toISOString()
  })
})

// **ENDPOINT: Chat de prueba (MVP/Demo)**
app.post('/test-chat', async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body

    if (!phone || !message) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos', 
        required: ['phone', 'message'],
        example: { phone: '56912345678', message: 'hola' }
      })
    }

    console.log(`🧪 [DEMO] Mensaje de ${phone}: "${message}"`)

    // Procesar mensaje con el bot UNIACC
    const respuestaBbot = await uniaccBot.procesarMensaje(phone, message)

    // Simular registro de interacción
    await supabaseIntegration.registrarInteraccion(phone, message, respuestaBbot)

    // Verificar si se completó captura de datos
    const prospectoData = uniaccBot.getProspectoData(phone)
    let prospectoGuardado = false
    let prospectoId = null

    if (prospectoData.nombre && prospectoData.email && prospectoData.telefono) {
      console.log('🧪 [DEMO] Prospecto completo detectado')
      
      const resultProspecto = await supabaseIntegration.enviarProspecto({
        nombre: prospectoData.nombre,
        email: prospectoData.email,
        telefono: prospectoData.telefono,
        whatsapp: phone,
        carrera_interes: prospectoData.carrera_interes,
        nivel_interes: 'alto',
        source: 'demo_chatbot'
      })

      prospectoGuardado = resultProspecto.success
      prospectoId = resultProspecto.prospectoId
    }

    return res.status(200).json({
      status: 'success',
      demo: true,
      conversation: {
        phone,
        user_message: message,
        bot_response: respuestaBbot,
        timestamp: new Date().toISOString()
      },
      prospecto: {
        data: prospectoData,
        guardado: prospectoGuardado,
        id: prospectoId
      }
    })

  } catch (error: any) {
    console.error('🧪 [DEMO] Error:', error)
    return res.status(500).json({ 
      error: 'Error en demo',
      details: error.message 
    })
  }
})

// **ENDPOINT: Enviar mensaje manual (para testing)**
app.post('/send-message', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body

    if (!to || !message) {
      return res.status(400).json({ error: 'Faltan parámetros: to, message' })
    }

    const enviado = await whatsappSender.enviarMensaje(to, message)
    
    if (enviado) {
      return res.status(200).json({ status: 'sent', to, message })
    } else {
      return res.status(500).json({ error: 'Error enviando mensaje' })
    }

  } catch (error) {
    console.error('Error en send-message:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// **ENDPOINT: Sincronizar fallbacks**
app.post('/sync-fallbacks', async (req: Request, res: Response) => {
  try {
    const sincronizados = await supabaseIntegration.sincronizarFallbacks()
    res.status(200).json({ 
      status: 'success', 
      sincronizados 
    })
  } catch (error) {
    console.error('Error sincronizando fallbacks:', error)
    res.status(500).json({ error: 'Error sincronizando' })
  }
})

// **ENDPOINT: Ver estado del usuario (Demo)**
app.get('/user-state/:phone', (req: Request, res: Response) => {
  const phone = req.params.phone
  const prospectoData = uniaccBot.getProspectoData(phone)
  
  res.status(200).json({
    phone,
    estado: prospectoData,
    timestamp: new Date().toISOString()
  })
})

// **ENDPOINT: Resetear usuario (testing)**
app.post('/reset-user/:phoneNumber', (req: Request, res: Response) => {
  const phoneNumber = req.params.phoneNumber
  // En implementación real, resetear estado del usuario
  console.log(`🔄 Usuario ${phoneNumber} reseteado`)
  res.status(200).json({ status: 'reset', phone: phoneNumber })
})

// **ENDPOINT: Información de carreras (Demo)**
app.get('/carreras', (req: Request, res: Response) => {
  const { FACULTADES_UNIACC } = require('./data/programas-uniacc')
  
  const resumen = Object.values(FACULTADES_UNIACC).map((facultad: any) => ({
    id: facultad.id,
    nombre: facultad.nombre,
    emoji: facultad.emoji,
    total_carreras: facultad.carreras.length,
    carreras: facultad.carreras.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      duracion: c.duracion,
      modalidad: c.modalidad,
      costo_aprox: c.costo_aprox,
      destacado: c.destacado || false
    }))
  }))
  
  res.status(200).json({
    total_facultades: resumen.length,
    total_carreras: resumen.reduce((sum: number, f: any) => sum + f.total_carreras, 0),
    facultades: resumen
  })
})

// **ENDPOINT: Flujo completo de demo**
app.post('/demo-flujo', async (req: Request, res: Response) => {
  try {
    const phone = `56912345${Math.floor(Math.random() * 1000)}`
    const flujo = [
      'hola',
      '1',
      'b',
      '1',
      'asesor',
      'Juan Pérez Martínez',
      'juan.perez@gmail.com',
      '+56912345678',
      'Comunicación Audiovisual'
    ]
    
    const conversacion = []
    
    for (const mensaje of flujo) {
      const respuesta = await uniaccBot.procesarMensaje(phone, mensaje)
      conversacion.push({
        usuario: mensaje,
        bot: respuesta,
        timestamp: new Date().toISOString()
      })
      
      // Pequeña pausa para simular conversación real
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    const prospectoFinal = uniaccBot.getProspectoData(phone)
    
    res.status(200).json({
      status: 'demo_completado',
      phone,
      conversacion_completa: conversacion,
      prospecto_capturado: prospectoFinal,
      total_intercambios: conversacion.length
    })
    
  } catch (error: any) {
    res.status(500).json({ error: 'Error en demo flujo', details: error.message })
  }
})

// Manejo de errores global
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Error no manejado:', error)
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  })
})

// Endpoints para el dashboard
app.get('/api/prospectos', async (req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      data: [...prospectos].reverse() // Más recientes primero
    })
  } catch (error) {
    console.error('Error obteniendo prospectos:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    })
  }
})

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

// Manejo de rutas no encontradas
app.all('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method 
  })
})

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🤖 UNIACC WhatsApp Bot iniciado`)
  console.log(`🌐 Servidor corriendo en puerto ${PORT}`)
  console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`)
  console.log(`💚 Health check: http://localhost:${PORT}/health`)
  console.log(`📊 Stats: http://localhost:${PORT}/stats`)
  console.log(`⚡ Ambiente: ${process.env.NODE_ENV || 'development'}`)
  
  // Sincronizar fallbacks al inicio
  setTimeout(() => {
    supabaseIntegration.sincronizarFallbacks()
      .then(count => {
        if (count > 0) {
          console.log(`🔄 Sincronizados ${count} prospectos pendientes`)
        }
      })
      .catch(error => console.error('Error inicial sincronizando:', error))
  }, 5000)
})

// Manejo de señales de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...')
  process.exit(0)
})

export default app

