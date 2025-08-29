import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { UniaccBot } from './actions/uniacc-scripts'
import { WhatsAppSender } from './utils/whatsapp-sender'
import { emailValidator, phoneValidator, nameValidator } from './utils/validators'
import { SupabaseIntegration } from './actions/supabase-integration'
import logger from './utils/enhanced-logger'

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
  origin: [
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:3009', 'http://127.0.0.1:3009',
    'http://localhost:3001', 'http://127.0.0.1:3001',
    'http://localhost:3002', 'http://127.0.0.1:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Servir archivos estáticos (CSS, JS, HTML)
app.use(express.static('public'))

// Inicializar servicios
const whatsappSender = new WhatsAppSender(
  process.env.WHATSAPP_ACCESS_TOKEN!,
  process.env.WHATSAPP_PHONE_NUMBER_ID!
)

const supabaseIntegration = new SupabaseIntegration(
  process.env.VUE_WEBHOOK_URL!,
  process.env.VUE_WEBHOOK_SECRET!
)

// Crear instancia del bot con configuración de webhook
const uniaccBot = new UniaccBot(
  process.env.VUE_WEBHOOK_URL!,
  process.env.VUE_WEBHOOK_SECRET!
)

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

    // ✅ Registrar interacciones en Supabase
    await supabaseIntegration.registrarInteraccion(from, message, respuesta)

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

// **ENDPOINT: Página principal - redireccionar a chat TypeScript**
app.get('/', (req: Request, res: Response) => {
  res.redirect('/chat-demo')
})

// **ENDPOINT: Chat Demo TypeScript (RECOMENDADO)**
app.get('/chat-demo', (req: Request, res: Response) => {
  res.sendFile('chat-demo.html', { root: 'public' })
})

// **ENDPOINT: Chat Demo JavaScript embebido (LEGACY)**
app.get('/chat', (req: Request, res: Response) => {
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
        
        /* WhatsApp-like chat background */
        .chat-background {
            background-color: #f0f2f5;
            background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.15) 1px, transparent 0);
            background-size: 20px 20px;
        }
        
        /* Message bubbles */
        .message-bubble-user {
            background: #dcf8c6;
            border-radius: 7.5px;
            border-bottom-right-radius: 0;
            box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
            max-width: 70%;
            margin-left: auto;
            padding: 8px 12px;
            margin-bottom: 8px;
        }
        
        .message-bubble-bot {
            background: white;
            border-radius: 7.5px;
            border-bottom-left-radius: 0;
            box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
            max-width: 70%;
            margin-right: auto;
            padding: 8px 12px;
            margin-bottom: 8px;
        }
        
        .message-time {
            color: #667781;
            font-size: 11px;
            margin-top: 4px;
        }
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

            <!-- Interactive Chat Title -->
            <div class="border-t pt-6">
                <h3 class="text-xl font-semibold mb-4">💬 Chat Interactivo</h3>
            </div>
        </div>

        <!-- Chat Area -->
        <div class="bg-white border-x border-gray-200 h-96 flex flex-col">
            <!-- Chat Messages -->
            <div id="results" class="flex-1 overflow-y-auto p-4 space-y-3 chat-background">
                <div class="text-gray-500 text-center py-4">
                    👆 Haz clic en uno de los botones de arriba para comenzar la demostración
                </div>
            </div>
        </div>

        <!-- Chat Input - Debajo del chat -->
        <div class="bg-white rounded-b-lg border-x border-b border-gray-200 p-4">
            <div class="flex gap-2">
                <input type="text" id="messageInput" placeholder="Escribe un mensaje (ej: hola)" 
                       class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button onclick="sendMessage()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                    Enviar
                </button>
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
                    <div class="space-y-2">
                        <div class="message-bubble-user">
                            <div class="text-sm text-gray-800">\${data.conversation.user_message}</div>
                            <div class="message-time text-right">Tú</div>
                        </div>
                        <div class="message-bubble-bot">
                            <div class="text-sm text-gray-800 whitespace-pre-line">\${data.conversation.bot_response}</div>
                            <div class="message-time">ChatBot UNIACC 🤖</div>
                        </div>
                    </div>
                \`;
                div.className = '';  // Remove border styling for chat messages
            } else {
                div.innerHTML = \`
                    <h4 class="font-semibold text-purple-600 mb-2">\${title}</h4>
                    <pre class="bg-gray-50 p-3 rounded text-sm overflow-x-auto">\${JSON.stringify(data, null, 2)}</pre>
                \`;
            }
            
            resultsDiv.appendChild(div);
            // Normal scroll to bottom
            setTimeout(() => {
                resultsDiv.scrollTop = resultsDiv.scrollHeight;
            }, 100);
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

            // ⏰ INICIAR POLLING DE TIMEOUT SI ES EL PRIMER MENSAJE
            if (message.toLowerCase() === 'hola' || message.toLowerCase() === 'hi') {
                console.log('🚀 [INIT] Iniciando polling de timeout...');
                setTimeout(() => {
                    startTimeoutChecking(currentPhone);
                }, 1000); // 1 segundo para que el mensaje se procese
            }

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

        // ⏰ SISTEMA DE TIMEOUT PARA DEMO
        let timeoutCheckInterval;
        let currentUserId = null;

        // Función para verificar mensajes de timeout
        async function checkForTimeoutMessages() {
            if (!currentUserId) {
                console.log('🔍 [POLLING] Sin usuario activo - saltando verificación');
                return;
            }
            
            console.log(\`🔍 [POLLING] Verificando timeouts para: \${currentUserId}\`);
            
            try {
                const response = await fetch(\`/check-timeout/\${currentUserId}\`);
                const data = await response.json();
                
                console.log('🔍 [POLLING] Respuesta del servidor:', data);
                
                if (data.status === 'warning' || data.status === 'timeout') {
                    console.log(\`🎯 [POLLING] ¡Mensaje encontrado! Tipo: \${data.status}\`);
                    
                    // Mostrar mensaje automático de timeout
                    addResult('⏰ Mensaje Automático del Sistema', { 
                        conversation: {
                            user_message: '(timeout automático)',
                            bot_response: data.message
                        }
                    }, 'chat');
                    
                    console.log(\`⚠️ [TIMEOUT] Mensaje mostrado - Tipo: \${data.status} - Usuario: \${currentUserId}\`);
                    
                    // Si es timeout final, detener el polling
                    if (data.status === 'timeout') {
                        console.log('⏰ [TIMEOUT-FINAL] Deteniendo polling - sesión terminada');
                        stopTimeoutChecking();
                    }
                } else {
                    console.log('🔍 [POLLING] Sin mensajes pendientes');
                }
            } catch (error) {
                console.error('🔍 [POLLING] Error verificando timeout:', error);
            }
        }

        // Función para iniciar el sistema de timeout cuando se inicia una conversación
        function startTimeoutChecking(userId) {
            console.log(\`🚀 [INIT] Iniciando timeout checking para: \${userId}\`);
            
            currentUserId = userId;
            
            // Verificar cada 3 segundos si hay mensajes de timeout (más frecuente para mejor UX)
            timeoutCheckInterval = setInterval(checkForTimeoutMessages, 3000);
            
            console.log(\`⏰ [POLLING] Sistema de timeout iniciado para usuario: \${userId} - Verificando cada 3s\`);
            console.log(\`⏰ [POLLING] Interval ID: \${timeoutCheckInterval}\`);
        }

        // Función para detener el sistema de timeout
        function stopTimeoutChecking() {
            if (timeoutCheckInterval) {
                clearInterval(timeoutCheckInterval);
                timeoutCheckInterval = null;
            }
            currentUserId = null;
            console.log('⏰ Sistema de timeout detenido');
        }

        // Event listener simplificado - la lógica de timeout está en sendMessage()
        // messageInput.addEventListener('keypress', function(e) {
        //     if (e.key === 'Enter') {
        //         sendMessage(); // Ya se maneja arriba
        //     }
        // });

        // Botón para forzar timeout (solo para testing)
        const forceTimeoutBtn = document.createElement('button');
        forceTimeoutBtn.textContent = '🧪 Forzar Timeout (Testing)';
        forceTimeoutBtn.className = 'mt-2 mr-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600';
        
        // Botón para testear polling manualmente
        const testPollingBtn = document.createElement('button');
        testPollingBtn.textContent = '🔍 Test Polling';
        testPollingBtn.className = 'mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
        forceTimeoutBtn.onclick = async () => {
            if (!currentUserId) {
                alert('Inicia una conversación primero escribiendo "hola"');
                return;
            }
            
            try {
                const response = await fetch(\`/force-timeout/\${currentUserId}\`, {
                    method: 'POST'
                });
                const data = await response.json();
                
                console.log('🧪 [FORCE-TIMEOUT] Respuesta:', data);
                
                if (data.message) {
                    addResult('🧪 Timeout Forzado para Testing', { 
                        conversation: {
                            user_message: '(timeout forzado manualmente)',
                            bot_response: data.message
                        }
                    }, 'chat');
                    
                    stopTimeoutChecking();
                }
            } catch (error) {
                console.error('🧪 [FORCE-TIMEOUT] Error:', error);
                alert('Error forzando timeout: ' + error.message);
            }
        };
        
        // Funcionalidad del botón de test polling
        testPollingBtn.onclick = async () => {
            const testPhone = currentUserId || currentPhone;
            console.log(\`🔍 [TEST] Testeando polling manual para: \${testPhone}\`);
            
            try {
                const response = await fetch(\`/check-timeout/\${testPhone}\`);
                const data = await response.json();
                
                console.log('🔍 [TEST] Respuesta del endpoint:', data);
                
                addResult('🔍 Test Polling Manual', {
                    phone: testPhone,
                    endpoint: \`/check-timeout/\${testPhone}\`,
                    response: data
                });
                
                if (data.message) {
                    alert(\`Mensaje encontrado: \${data.message.substring(0, 50)}...\`);
                } else {
                    alert('No hay mensajes pendientes');
                }
                
            } catch (error) {
                console.error('🔍 [TEST] Error:', error);
                alert('Error testeando polling: ' + error.message);
            }
        };
        
        // Agregar botones debajo del input
        const inputContainer = document.querySelector('.border.rounded.p-4') || document.body;
        inputContainer.appendChild(forceTimeoutBtn);
        inputContainer.appendChild(testPollingBtn);
        
        console.log('🧪 Sistema de timeout demo inicializado');
    </script>
</body>
</html>
  `;
  
  res.send(html);
})

// **ENDPOINT: Health check**
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'UNIACC WhatsApp Bot',
    database: 'unknown',
    supabase_config: {
      url_configured: !!process.env.SUPABASE_URL,
      key_configured: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY)
    }
  }

  // Test conexión Supabase
  try {
    const { testConexion } = await import('./utils/supabase-client')
    const resultado = await testConexion()
    health.database = resultado.success ? 'connected' : 'error'
    if (!resultado.success) {
      (health as any).database_error = resultado.message
    }
  } catch (error: any) {
    health.database = 'unavailable'
    ;(health as any).database_error = error.message
  }

  res.status(200).json(health)
})

// **ENDPOINT: Estadísticas del bot**
app.get('/stats', (req: Request, res: Response) => {
  try {
    const totalUsuarios = uniaccBot.getUsuarios().size
    const logStats = logger.getActivitySummary()
    
    res.json({
      bot: 'UNIACC WhatsApp Bot',
      status: 'Activo',
      timestamp: new Date().toISOString(),
      metrics: {
        usuarios_activos: totalUsuarios,
    uptime: process.uptime(),
        memoria_uso: process.memoryUsage()
      },
      logs: logStats
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// 📋 ENDPOINTS DE LOGGING Y DEBUGGING
app.get('/logs', (req: Request, res: Response) => {
  try {
    const { user, category, level, limit = 50, format = 'json' } = req.query
    
    let logs
    
    if (user) {
      logs = logger.getLogsByUser(user as string, parseInt(limit as string))
    } else if (category) {
      logs = logger.getLogsByCategory(category as any, parseInt(limit as string))
    } else if (level === 'error') {
      logs = logger.getErrorLogs(parseInt(limit as string))
    } else {
      logs = logger.exportLogs(format as 'json' | 'csv')
    }
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv')
      return res.send(logs)
    }
    
    res.json({
      total: Array.isArray(logs) ? logs.length : 'N/A',
      logs: logs,
      activity: logger.getActivitySummary()
    })
    
  } catch (error) {
    console.error('Error obteniendo logs:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// 🎯 ENDPOINT DE TESTING COMPLETO
app.get('/testing', (req: Request, res: Response) => {
  try {
    const flowsData = {
      "menu_principal": {
        "opciones": ["1", "2", "3", "4", "5", "6"],
        "descripcion": "Menú para usuarios nuevos y sin carrera específica"
      },
      "menu_contextual": {
        "con_carrera": {
          "opciones": ["1", "2", "3", "4", "5", "6"],
          "descripcion": "Menú para usuarios recurrentes con carrera consultada"
        },
        "sin_carrera": {
          "opciones": ["1", "2", "3", "4", "5", "6"],
          "descripcion": "Menú para usuarios recurrentes sin carrera específica"
        }
      },
      "exploracion_carreras": {
        "facultades": ["A", "B", "C", "D", "E"],
        "carreras_por_facultad": "Variable según facultad",
        "detalle_carrera": ["1", "2", "3", "4"]
      },
      "advisor_connection": {
        "datos_requeridos": ["nombre", "email", "telefono"],
        "captura_inteligente": "Solo pide datos faltantes"
      },
      "timeout_system": {
        "warning_time": "1.5 minutos",
        "final_timeout": "2 minutos",
        "data_saved": "Prospecto guardado en BD"
      }
    }
    
    const testingChecklist = [
      { test: "Usuario nuevo - hola", status: "pending" },
      { test: "Usuario recurrente - reconocimiento", status: "pending" },
      { test: "Explorar carreras - A-E", status: "pending" },
      { test: "Flujo asesor - datos faltantes", status: "critical" },
      { test: "Timeout - warning + final", status: "pending" },
      { test: "Base de datos - guardado", status: "pending" }
    ]
    
    res.json({
      flows: flowsData,
      testing: testingChecklist,
      logs: logger.getActivitySummary(),
      documentation: "Ver flujo.md para detalles completos"
    })
    
  } catch (error) {
    console.error('Error en testing endpoint:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
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

    // Registro de interacción
    await supabaseIntegration.registrarInteraccion(phone, message, respuestaBbot)

    // Los prospectos se envían al final de cada flujo, no automáticamente
    let prospectoGuardado = false
    let prospectoId = null

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
        data: uniaccBot.getProspectoData(phone),
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

// **ENDPOINT: Verificar timeouts pendientes (para polling automático)**
app.get('/check-timeout/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params

    console.log(`🔍 [TIMEOUT-CHECK] Verificando timeouts para ${phone}`)

    // Verificar cualquier mensaje pendiente usando el nuevo método
    const result = await uniaccBot.checkForPendingMessage(phone)
    
    if (result.status !== 'active') {
      console.log(`📱 [TIMEOUT-CHECK] Mensaje ${result.status} encontrado para ${phone}`)
    }

    return res.json({
      status: result.status,
      message: result.message,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('🔍 [TIMEOUT-CHECK] Error:', error)
    return res.status(500).json({ error: error.message })
  }
})

// **ENDPOINT: Forzar timeout para testing rápido**
app.post('/force-timeout/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params
    const timeoutMessage = await uniaccBot.forceTimeout(phone)
    
    console.log(`🧪 [FORCE-TIMEOUT] Timeout forzado para ${phone}`)
    
    return res.json({
      status: 'timeout_executed',
      message: timeoutMessage,
      phone,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('🧪 [FORCE-TIMEOUT] Error:', error)
    return res.status(500).json({ error: error.message })
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

// **ENDPOINT: Verificar mensajes de timeout para interfaz demo**
app.get('/check-timeout/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    // Verificar si hay warning pendiente
    const warningMessage = await uniaccBot.checkForTimeoutWarning(userId)
    
    res.json({
      success: true,
      hasTimeout: !!warningMessage,
      message: warningMessage,
      type: warningMessage ? 'warning' : null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error verificando timeout:', error)
    res.status(500).json({
      success: false,
      error: 'Error verificando timeout'
    })
  }
})

// **ENDPOINT: Forzar timeout para testing**
app.post('/force-timeout/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    const timeoutMessage = await uniaccBot.forceTimeout(userId)
    
    res.json({
      success: true,
      message: timeoutMessage,
      type: 'timeout',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error forzando timeout:', error)
    res.status(500).json({
      success: false,
      error: 'Error forzando timeout'
    })
  }
})

// Endpoints para el dashboard (con Supabase + fallback)
app.get('/api/prospectos', async (req: Request, res: Response) => {
  try {
    // Intentar obtener de Supabase primero
    try {
      const { supabase } = await import('./utils/supabase-client')
      
      const { data: supabaseData, error } = await supabase
        .from('prospectos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error && supabaseData) {
        console.log(`📊 Obtenidos ${supabaseData.length} prospectos de Supabase`)
        return res.json({ 
          success: true, 
          data: supabaseData,
          source: 'supabase'
        })
      } else {
        console.warn('⚠️ Error Supabase:', error?.message)
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase no disponible, usando memoria local')
    }

    // Fallback a memoria local
    res.json({ 
      success: true, 
      data: [...prospectos].reverse(),
      source: 'memory'
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
    // Intentar obtener stats de Supabase
    try {
      const { obtenerEstadisticas } = await import('./utils/supabase-client')
      
      const resultado = await obtenerEstadisticas()
      
      if (resultado.success) {
        console.log('📊 Stats obtenidas de Supabase')
        return res.json({
          success: true,
          data: resultado.data,
          source: 'supabase'
        })
      } else {
        console.warn('⚠️ Error stats Supabase:', resultado.error)
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase stats no disponible, usando memoria local')
    }

    // Fallback a stats en memoria
    res.json({
      success: true,
      data: stats,
      source: 'memory'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

// **ENDPOINTS DE CHAT EN TIEMPO REAL**

// **ENDPOINT: Obtener conversaciones**
app.get('/api/conversaciones', async (req: Request, res: Response) => {
  try {
    // Intentar obtener conversaciones de Supabase
    try {
      const { obtenerConversaciones } = await import('./utils/supabase-client')
      const resultado = await obtenerConversaciones()
      
      if (resultado.success) {
        console.log('💬 Conversaciones obtenidas de Supabase')
        return res.json({
          success: true,
          data: resultado.data,
          source: 'supabase'
        })
      } else {
        console.warn('⚠️ Error conversaciones Supabase:', resultado.error)
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase conversaciones no disponible, usando memoria local')
    }

    // Fallback: crear conversaciones basadas en prospectos
    const conversaciones = prospectos.map(prospecto => ({
      id: `conv_${prospecto.whatsapp}`,
      external_id: `whatsapp_${prospecto.whatsapp}`,
      phone_number: prospecto.whatsapp,
      contact_name: prospecto.nombre,
      prospecto_id: prospecto.id || `prosp_${prospecto.whatsapp}`,
      status: 'active',
      message_count: 0,
      contact_info: {
        platform: 'whatsapp',
        source: 'uniacc_bot'
      },
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString()
    }))

    res.json({ 
      success: true, 
      data: conversaciones,
      source: 'memory'
    })
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    })
  }
})

// **ENDPOINT: Obtener mensajes de una conversación**
app.get('/api/conversaciones/:id/mensajes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Intentar obtener mensajes de Supabase
    try {
      const { obtenerMensajes } = await import('./utils/supabase-client')
      const resultado = await obtenerMensajes(id)
      
      if (resultado.success) {
        console.log(`💬 Mensajes obtenidos de Supabase para conversación ${id}`)
        return res.json({
          success: true,
          data: resultado.data,
          source: 'supabase'
        })
      } else {
        console.warn('⚠️ Error mensajes Supabase:', resultado.error)
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase mensajes no disponible, usando memoria local')
    }

    // Fallback: mensajes simulados
    const mensajes = [
      {
        id: `msg_1_${id}`,
        conversacion_id: id,
        content: 'Hola, soy el asistente virtual de UNIACC. ¿En qué puedo ayudarte?',
        type: 'bot',
        message_type: 'text',
        sender_name: 'UNIACC Bot',
        created_at: new Date(Date.now() - 300000).toISOString() // 5 minutos atrás
      },
      {
        id: `msg_2_${id}`,
        conversacion_id: id,
        content: 'Me interesa conocer las carreras disponibles',
        type: 'user',
        message_type: 'text',
        created_at: new Date(Date.now() - 240000).toISOString() // 4 minutos atrás
      }
    ]

    res.json({ 
      success: true, 
      data: mensajes,
      source: 'memory'
    })
  } catch (error) {
    console.error('Error obteniendo mensajes:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    })
  }
})

// **ENDPOINT: Enviar mensaje a una conversación**
app.post('/api/conversaciones/:id/mensajes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content, type = 'agent' } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El contenido del mensaje es requerido'
      })
    }

    // Intentar guardar mensaje en Supabase
    try {
      const { guardarMensaje } = await import('./utils/supabase-client')
      const resultado = await guardarMensaje({
        conversacion_id: id,
        content: content.trim(),
        type: type as 'user' | 'bot' | 'agent'
      })
      
      if (resultado.success) {
        console.log(`💬 Mensaje guardado en Supabase para conversación ${id}`)
        return res.json({
          success: true,
          data: resultado.data
        })
      } else {
        console.warn('⚠️ Error guardando mensaje en Supabase:', resultado.error)
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase no disponible, usando memoria local')
    }

    // Fallback: guardar en memoria local
    const mensaje = {
      id: `msg_${Date.now()}_${id}`,
      conversacion_id: id,
      content: content.trim(),
      type: type as 'user' | 'bot' | 'agent',
      message_type: 'text',
      sender_name: type === 'agent' ? 'Agente UNIACC' : 'Usuario',
      created_at: new Date().toISOString()
    }

    // Aquí podrías almacenar en un array local si quisieras persistencia
    console.log(`💬 Mensaje guardado localmente:`, mensaje)

    res.json({
      success: true,
      data: mensaje,
      source: 'memory'
    })
  } catch (error) {
    console.error('Error enviando mensaje:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
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
console.log(`📋 Logs: http://localhost:${PORT}/logs`)
console.log(`🎯 Testing: http://localhost:${PORT}/testing`)

  console.log(`⚡ Ambiente: ${process.env.NODE_ENV || 'development'}`)
  
  // SINCRONIZACIÓN DE FALLBACKS DESHABILITADA
  console.log('📄 [FALLBACK] Sincronización automática deshabilitada')
  // setTimeout(() => {
  //   supabaseIntegration.sincronizarFallbacks()
  //     .then(count => {
  //       if (count > 0) {
  //         console.log(`🔄 Sincronizados ${count} prospectos pendientes`)
  //       }
  //     })
  //     .catch(error => console.error('Error inicial sincronizando:', error))
  // }, 5000)
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

