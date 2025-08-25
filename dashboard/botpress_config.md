# 🤖 Configuración Botpress - ChatBot UNIACC

## 🚀 INSTALACIÓN Y SETUP INICIAL

### 1. Crear Proyecto Botpress
```bash
# Crear directorio del proyecto
mkdir uniacc-botpress-chatbot
cd uniacc-botpress-chatbot

# Inicializar proyecto Node.js
npm init -y

# Instalar Botpress
npm install @botpress/sdk @botpress/cli

# Instalar dependencias adicionales
npm install axios dotenv express cors helmet
npm install -D @types/node typescript nodemon

# Crear estructura de carpetas
mkdir -p src/{actions,hooks,data,utils,integrations}
mkdir -p logs conversations
```

### 2. Estructura del Proyecto
```
uniacc-botpress-chatbot/
├── package.json
├── .env
├── .env.example
├── tsconfig.json
├── bot.config.ts
├── src/
│   ├── index.ts
│   ├── actions/
│   │   ├── uniacc-scripts.ts
│   │   ├── supabase-integration.ts
│   │   ├── validaciones.ts
│   │   └── webhook-handler.ts
│   ├── hooks/
│   │   ├── before-incoming.ts
│   │   ├── after-incoming.ts
│   │   └── before-outgoing.ts
│   ├── data/
│   │   ├── programas-uniacc.ts
│   │   ├── costos-2025.ts
│   │   └── respuestas-predefinidas.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── integrations/
│   │   └── whatsapp.config.ts
│   └── types/
│       ├── index.ts
│       └── whatsapp.ts
├── conversations/
│   └── templates/
└── logs/
    └── .gitkeep
```

## ⚙️ ARCHIVOS DE CONFIGURACIÓN

### package.json
```json
{
  "name": "uniacc-botpress-chatbot",
  "version": "1.0.0",
  "description": "ChatBot UNIACC para captura de prospectos universitarios",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "test": "echo \"No tests yet\""
  },
  "dependencies": {
    "@botpress/sdk": "^12.0.0",
    "@botpress/cli": "^12.0.0",
    "axios": "^1.6.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "typescript": "^5.2.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["utils/*"],
      "@/data/*": ["data/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### .env.example
```bash
# Botpress Configuration
NODE_ENV=development
BOT_PORT=3001
BOT_HOST=localhost

# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=uniacc_verify_token_123
WHATSAPP_ACCESS_TOKEN=tu_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_WEBHOOK_SECRET=tu_webhook_secret

# Supabase Integration (para guardar prospectos)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_KEY=tu_supabase_service_key

# Vue Dashboard Webhook
VUE_WEBHOOK_URL=https://tu-vue-app.netlify.app/api/webhook
VUE_WEBHOOK_SECRET=tu_vue_webhook_secret

# UNIACC Specific
UNIACC_WEBSITE=https://www.uniacc.cl
UNIACC_CONTACT_EMAIL=admision@uniacc.cl
UNIACC_PHONE=+56226406000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/bot.log
```

## 🤖 CONFIGURACIÓN PRINCIPAL DEL BOT

### src/index.ts
```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { webhookHandler } from './actions/webhook-handler'
import { setupRoutes } from './utils/routes'

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.BOT_PORT || 3001

// Middlewares
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Rutas principales
setupRoutes(app)

// Webhook de WhatsApp
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado')
    res.status(200).send(challenge)
  } else {
    console.error('❌ Error verificando webhook')
    res.sendStatus(403)
  }
})

app.post('/webhook', webhookHandler)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: process.env.NODE_ENV
  })
})

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🤖 Bot UNIACC ejecutándose en puerto ${PORT}`)
  console.log(`📱 Webhook URL: ${process.env.BOT_HOST}:${PORT}/webhook`)
  console.log(`🏥 Health check: ${process.env.BOT_HOST}:${PORT}/health`)
})

export default app
```

## 📊 DATOS DE UNIACC

### src/data/programas-uniacc.ts
```typescript
export interface Carrera {
  id: string
  nombre: string
  duracion: string
  modalidad: string
  descripcion: string
  requisitos_especiales?: string[]
  costo_aprox: number
  destacado?: boolean
}

export interface Facultad {
  id: string
  nombre: string
  emoji: string
  carreras: Carrera[]
}

export const FACULTADES_UNIACC: Record<string, Facultad> = {
  artes: {
    id: 'artes',
    nombre: 'Facultad de Artes',
    emoji: '🎭',
    carreras: [
      {
        id: 'teatro',
        nombre: 'Teatro y Comunicación Escénica',
        duracion: '8 semestres',
        modalidad: 'Presencial',
        descripcion: 'Formación integral en artes escénicas con enfoque contemporáneo',
        requisitos_especiales: ['Audición', 'Taller de expresión corporal'],
        costo_aprox: 15500000
      },
      {
        id: 'danza',
        nombre: 'Danza y Coreografía',
        duracion: '8 semestres',
        modalidad: 'Presencial',
        descripcion: 'Danza contemporánea y creación coreográfica',
        requisitos_especiales: ['Audición obligatoria', 'Examen físico'],
        costo_aprox: 15500000
      },
      {
        id: 'musica_interpretacion',
        nombre: 'Música e Interpretación',
        duracion: '8 semestres',
        modalidad: 'Presencial',
        descripcion: 'Formación musical integral para intérpretes',
        requisitos_especiales: ['Audición musical'],
        costo_aprox: 16000000
      },
      {
        id: 'artes_visuales',
        nombre: 'Artes Visuales',
        duracion: '10 semestres',
        modalidad: 'Presencial',
        descripcion: 'Formación artística visual contemporánea',
        requisitos_especiales: ['Portfolio artístico'],
        costo_aprox: 15800000
      }
    ]
  },
  
  comunicaciones: {
    id: 'comunicaciones',
    nombre: 'Facultad de Comunicaciones',
    emoji: '📺',
    carreras: [
      {
        id: 'audiovisual',
        nombre: 'Comunicación Audiovisual',
        duracion: '10 semestres',
        modalidad: 'Presencial',
        descripcion: '🏆 Pioneros en Chile (1981). TV, cine y medios digitales',
        requisitos_especiales: ['Entrevista personal'],
        costo_aprox: 14500000,
        destacado: true
      },
      {
        id: 'periodismo',
        nombre: 'Periodismo',
        duracion: '10 semestres',
        modalidad: 'Presencial/Semipresencial',
        descripcion: 'Formación integral en comunicación periodística',
        costo_aprox: 13500000
      },
      {
        id: 'publicidad',
        nombre: 'Publicidad',
        duracion: '8 semestres',
        modalidad: 'Presencial',
        descripcion: 'Creatividad publicitaria y estrategia comunicacional',
        costo_aprox: 13800000
      }
    ]
  },

  arquitectura_diseno: {
    id: 'arquitectura_diseno',
    nombre: 'Facultad de Arquitectura y Diseño',
    emoji: '🏗️',
    carreras: [
      {
        id: 'arquitectura',
        nombre: 'Arquitectura',
        duracion: '11 semestres',
        modalidad: 'Presencial/Semipresencial',
        descripcion: 'Diseño arquitectónico con enfoque sustentable',
        requisitos_especiales: ['Prueba de habilidades espaciales'],
        costo_aprox: 16500000
      },
      {
        id: 'diseno_interiores',
        nombre: 'Diseño de Interiores y Ambientes',
        duracion: '8 semestres',
        modalidad: 'Presencial/Semipresencial',
        descripcion: 'Diseño de espacios habitables',
        costo_aprox: 14800000
      }
    ]
  },

  ciencias_juridicas: {
    id: 'ciencias_juridicas',
    nombre: 'Facultad de Ciencias Jurídicas y Sociales',
    emoji: '⚖️',
    carreras: [
      {
        id: 'derecho',
        nombre: 'Derecho',
        duracion: '12 semestres',
        modalidad: 'Presencial/Vespertino',
        descripcion: 'Formación jurídica integral',
        costo_aprox: 14000000
      },
      {
        id: 'psicologia',
        nombre: 'Psicología',
        duracion: '12 semestres',
        modalidad: 'Presencial/Semipresencial',
        descripcion: 'Psicología clínica, educacional y organizacional',
        costo_aprox: 13500000
      }
    ]
  },

  negocios_tecnologia: {
    id: 'negocios_tecnologia',
    nombre: 'Facultad de Negocios y Tecnología',
    emoji: '💼',
    carreras: [
      {
        id: 'ingenieria_comercial',
        nombre: 'Ingeniería Comercial',
        duracion: '10 semestres',
        modalidad: 'Presencial/Online',
        descripcion: 'Administración de empresas y negocios',
        costo_aprox: 12000000
      },
      {
        id: 'contador_auditor',
        nombre: 'Contador Auditor',
        duracion: '10 semestres',
        modalidad: 'Presencial/Online',
        descripcion: 'Contabilidad y auditoría empresarial',
        costo_aprox: 11500000
      }
    ]
  }
}

export const BECAS_UNIACC = [
  {
    nombre: 'Beca Mérito Académico',
    descripcion: 'Hasta 50% de descuento para estudiantes del 10% superior',
    descuento: 'Hasta 50%',
    requisitos: ['Top 10% de egreso de enseñanza media', 'Mantener promedio 5.5']
  },
  {
    nombre: 'Beca Apoyo Regional',
    descripcion: 'Descuento para estudiantes de regiones',
    descuento: '15-30%',
    requisitos: ['Residir fuera de RM', 'Documentación de residencia']
  }
]

// Helper functions
export const getFacultadById = (id: string): Facultad | undefined => FACULTADES_UNIACC[id]
export const getCarreraById = (facultadId: string, carreraId: string): Carrera | undefined => {
  const facultad = FACULTADES_UNIACC[facultadId]
  return facultad?.carreras.find(c => c.id === carreraId)
}
```

### src/data/respuestas-predefinidas.ts
```typescript
export const RESPUESTAS = {
  bienvenida: `🎓 ¡Hola! Soy el asistente virtual de **UNIACC**
*Universidad de Artes, Ciencias y Comunicaciones*

🌟 **¡Bienvenidos a Crear!** 🌟

¿En qué puedo ayudarte hoy?

1️⃣ **Conocer nuestras carreras**
2️⃣ **Proceso de admisión 2025**  
3️⃣ **Costos y becas**
4️⃣ **Modalidades de estudio**
5️⃣ **Hablar con un asesor**

Escribe el número de tu opción 📝`,

  menu_facultades: `🎨 **FACULTADES Y CARRERAS UNIACC**

**A) 🎭 FACULTAD DE ARTES**
• Teatro y Comunicación Escénica
• Danza y Coreografía  
• Música (Interpretación/Composición)
• Artes Visuales

**B) 📺 FACULTAD DE COMUNICACIONES**  
• Comunicación Audiovisual (pioneros en Chile 🥇)
• Periodismo • Publicidad

**C) 🏗️ ARQUITECTURA Y DISEÑO**
• Arquitectura • Diseño de Interiores

**D) ⚖️ CIENCIAS JURÍDICAS Y SOCIALES**
• Derecho • Psicología

**E) 💼 NEGOCIOS Y TECNOLOGÍA**
• Ingeniería Comercial • Contador Auditor

¿Qué facultad te interesa? Escribe la letra (A, B, C, D o E)`,

  proceso_admision: `📋 **PROCESO DE ADMISIÓN UNIACC 2025**

📅 **FECHAS IMPORTANTES:**
• **Matrículas 2025:** Hasta 28 de Febrero
• **Inicio de clases:** 10 de Marzo 2025

✅ **REQUISITOS GENERALES:**
1️⃣ Licencia de Enseñanza Media
2️⃣ PSU/PDT o Ranking de Notas
3️⃣ Cédula de identidad

💡 **PROCESO INDEPENDIENTE:** 
¡No dependemos del DEMRE!

¿En qué paso necesitas ayuda?`,

  no_entendido: `❓ No estoy seguro de entender tu consulta.

Por favor, elige una opción:

1️⃣ Ver carreras disponibles
2️⃣ Proceso de admisión
3️⃣ Costos y becas
4️⃣ Hablar con asesor humano
5️⃣ Volver al menú principal

Escribe el número de tu opción 📝`
}
```

## 🔧 LÓGICA PRINCIPAL DEL CHATBOT

### src/actions/uniacc-scripts.ts
```typescript
import { FACULTADES_UNIACC, getFacultadById, getCarreraById } from '@/data/programas-uniacc'
import { RESPUESTAS } from '@/data/respuestas-predefinidas'
import { enviarProspectoAWebhook } from './supabase-integration'
import { validarEmail, validarTelefono, sanitizarInput } from '@/utils/validators'

interface TempData {
  flujo_actual?: string
  paso_actual?: string
  facultad_seleccionada?: string
  datos_prospecto: {
    nombre?: string
    email?: string
    telefono?: string
    programa_interes?: string
    facultad?: string
    region?: string
  }
  intentos_no_entendido?: number
}

// Simulamos el objeto temp global (en producción vendría de Botpress)
let temp: TempData = { datos_prospecto: {} }

export class UNIACCChatBot {
  private whatsappNumber: string
  private sendMessage: (text: string) => Promise<void>

  constructor(whatsappNumber: string, sendMessage: (text: string) => Promise<void>) {
    this.whatsappNumber = whatsappNumber
    this.sendMessage = sendMessage
  }

  async procesarMensaje(mensaje: string): Promise<void> {
    const mensajeLimpio = mensaje.toLowerCase().trim()

    // Detectar saludos o reinicio
    if (this.esSaludo(mensajeLimpio)) {
      await this.iniciarConversacion()
      return
    }

    // Detectar intención del usuario
    if (!temp.flujo_actual) {
      await this.manejarMenuPrincipal(mensajeLimpio)
      return
    }

    // Manejar flujos específicos
    switch (temp.flujo_actual) {
      case 'programas':
        await this.manejarFlujoCarreras(mensajeLimpio)
        break
      case 'admision':
        await this.sendMessage(RESPUESTAS.proceso_admision)
        temp.flujo_actual = null
        break
      case 'captura_datos':
        await this.manejarCapturaDatos(mensajeLimpio)
        break
      default:
        await this.manejarMensajeNoEntendido()
    }
  }

  private esSaludo(mensaje: string): boolean {
    const saludos = ['hola', 'buenas', 'hello', 'hi', 'inicio', 'empezar']
    return saludos.some(saludo => mensaje.includes(saludo))
  }

  private async iniciarConversacion(): Promise<void> {
    temp = { datos_prospecto: {} }
    await this.sendMessage(RESPUESTAS.bienvenida)
  }

  private async manejarMenuPrincipal(mensaje: string): Promise<void> {
    if (mensaje.includes('1') || mensaje.includes('carrera')) {
      temp.flujo_actual = 'programas'
      await this.sendMessage(RESPUESTAS.menu_facultades)
    } else if (mensaje.includes('2') || mensaje.includes('admision')) {
      temp.flujo_actual = 'admision'
      await this.sendMessage(RESPUESTAS.proceso_admision)
    } else if (mensaje.includes('5') || mensaje.includes('asesor')) {
      temp.flujo_actual = 'captura_datos'
      await this.iniciarCapturaDatos()
    } else {
      await this.sendMessage(RESPUESTAS.bienvenida)
    }
  }

  private async manejarFlujoCarreras(mensaje: string): Promise<void> {
    const letra = mensaje.toUpperCase()
    
    let facultadId = null
    if (letra.includes('A')) facultadId = 'artes'
    else if (letra.includes('B')) facultadId = 'comunicaciones'
    else if (letra.includes('C')) facultadId = 'arquitectura_diseno'
    else if (letra.includes('D')) facultadId = 'ciencias_juridicas'
    else if (letra.includes('E')) facultadId = 'negocios_tecnologia'
    
    if (facultadId) {
      temp.facultad_seleccionada = facultadId
      await this.mostrarCarrerasFacultad(facultadId)
    } else {
      await this.sendMessage('Por favor, selecciona una letra (A, B, C, D o E)')
    }
  }

  private async mostrarCarrerasFacultad(facultadId: string): Promise<void> {
    const facultad = getFacultadById(facultadId)
    
    if (!facultad) {
      await this.sendMessage('❌ Facultad no encontrada.')
      return
    }

    let mensaje = `\n${facultad.emoji} **${facultad.nombre.toUpperCase()}**\n\n`
    
    facultad.carreras.forEach((carrera, index) => {
      const numero = index + 1
      mensaje += `**${numero}) ${carrera.nombre}**\n`
      mensaje += `   📅 ${carrera.duracion} | 📍 ${carrera.modalidad}\n`
      mensaje += `   💰 $${carrera.costo_aprox.toLocaleString('es-CL')} aprox.\n`
      if (carrera.destacado) mensaje += `   🏆 ¡Programa pionero!\n`
      mensaje += `\n`
    })
    
    mensaje += `\n¿Qué carrera te interesa? Escribe el número (1-${facultad.carreras.length})`
    mensaje += `\n\n• 🔄 **OTRA** - Ver otra facultad`
    mensaje += `\n• 📞 **ASESOR** - Hablar con asesor`
    
    await this.sendMessage(mensaje)
    temp.paso_actual = 'seleccionar_carrera'
  }

  private async iniciarCapturaDatos(): Promise<void> {
    temp.flujo_actual = 'captura_datos'
    temp.paso_actual = 'nombre'
    
    await this.sendMessage(`📝 Para brindarte la mejor atención, necesito algunos datos:

¿Cuál es tu **nombre completo**?`)
  }

  private async manejarCapturaDatos(mensaje: string): Promise<void> {
    switch (temp.paso_actual) {
      case 'nombre':
        if (mensaje.length >= 2) {
          temp.datos_prospecto.nombre = sanitizarInput(mensaje)
          temp.paso_actual = 'email'
          await this.sendMessage(`¡Hola ${mensaje}! 👋

📧 ¿Cuál es tu **email** para enviarte información?`)
        } else {
          await this.sendMessage('Por favor, ingresa tu nombre completo')
        }
        break
        
      case 'email':
        if (validarEmail(mensaje)) {
          temp.datos_prospecto.email = sanitizarInput(mensaje)
          temp.paso_actual = 'telefono'
          await this.sendMessage('📱 ¿Tu **número de teléfono**?')
        } else {
          await this.sendMessage('📧 Por favor, ingresa un email válido')
        }
        break
        
      case 'telefono':
        if (validarTelefono(mensaje)) {
          temp.datos_prospecto.telefono = sanitizarInput(mensaje)
          temp.paso_actual = 'region'
          await this.sendMessage('🌍 ¿De qué **ciudad o región** nos escribes?')
        } else {
          await this.sendMessage('📱 Por favor, ingresa un teléfono válido')
        }
        break
        
      case 'region':
        temp.datos_prospecto.region = sanitizarInput(mensaje)
        await this.finalizarCapturaDatos()
        break
    }
  }

  private async finalizarCapturaDatos(): Promise<void> {
    const datos = temp.datos_prospecto
    
    try {
      // Enviar a Supabase/Vue
      await enviarProspectoAWebhook({
        whatsapp: this.whatsappNumber,
        ...datos
      })
      
      // Mensaje de confirmación
      const mensaje = `✅ **¡Perfecto, ${datos.nombre}!**

📋 **Tus datos registrados:**
📧 Email: ${datos.email}
📱 Teléfono: ${datos.telefono}
🌍 Región: ${datos.region}

🎯 **PRÓXIMOS PASOS:**
1️⃣ Información detallada por email
2️⃣ Asesor te contactará en 24 horas
3️⃣ Invitación a conocer campus

📍 **UNIACC - Av. Salvador 1200, Providencia**

**¡Bienvenido a la familia UNIACC!** 🎓✨`
      
      await this.sendMessage(mensaje)
      
      // Limpiar datos temporales
      temp = { datos_prospecto: {} }
      
    } catch (error) {
      console.error('Error finalizando captura:', error)
      await this.sendMessage(`❌ Hubo un problema guardando tus datos.

📞 Por favor contacta: +56 2 2640 6000
📧 admision@uniacc.cl`)
    }
  }

  private async manejarMensajeNoEntendido(): Promise<void> {
    const intentos = temp.intentos_no_entendido || 0
    temp.intentos_no_entendido = intentos + 1
    
    if (intentos < 2) {
      await this.sendMessage(RESPUESTAS.no_entendido)
    } else {
      await this.sendMessage(`👤 **Te derivo con un asesor humano.**

📞 **Llama directamente:** +56 2 2640 6000
📧 **Escribe a:** admision@uniacc.cl
⏰ **Horarios:** Lun-Jue 9:00-18:30

Un asesor te contactará pronto. 🙏`)
      
      // Reiniciar conversación
      temp = { datos_prospecto: {} }
    }
  }
}
```

## 🔗 INTEGRACIÓN CON SUPABASE

### src/actions/supabase-integration.ts
```typescript
import axios from 'axios'

interface ProspectoData {
  whatsapp: string
  nombre?: string
  email?: string
  telefono?: string
  programa_interes?: string
  facultad?: string
  region?: string
}

export async function enviarProspectoAWebhook(datos: ProspectoData): Promise<any> {
  try {
    const payload = {
      source: 'uniacc_chatbot',
      whatsapp: datos.whatsapp,
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono,
      programa: datos.programa_interes,
      facultad: datos.facultad,
      region: datos.region,
      notas: `Conversación completada: ${new Date().toISOString()}`,
      timestamp: new Date().toISOString()
    }

    const response = await axios.post(
      process.env.VUE_WEBHOOK_URL!,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VUE_WEBHOOK_SECRET}`
        },
        timeout: 10000
      }
    )

    console.log('✅ Prospecto enviado exitosamente:', response.data)
    return response.data

  } catch (error: any) {
    console.error('❌ Error enviando prospecto:', error.message)
    
    // Fallback: guardar localmente
    await guardarProspectoLocal(datos)
    throw error
  }
}

async function guardarProspectoLocal(datos: ProspectoData): Promise<void> {
  try {
    const fs = require('fs')
    const path = require('path')
    
    const logFile = path.join(__dirname, '../../logs/prospectos-fallback.json')
    
    const registro = {
      timestamp: new Date().toISOString(),
      whatsapp: datos.whatsapp,
      datos: datos,
      enviado: false
    }
    
    let registros = []
    if (fs.existsSync(logFile)) {
      const contenido = fs.readFileSync(logFile, 'utf8')
      registros = JSON.parse(contenido)
    }
    
    registros.push(registro)
    fs.writeFileSync(logFile, JSON.stringify(registros, null, 2))
    
    console.log('💾 Prospecto guardado localmente como fallback')
    
  } catch (error) {
    console.error('❌ Error guardando fallback:', error)
  }
}
```

## 📱 WEBHOOK HANDLER

### src/actions/webhook-handler.ts
```typescript
import { Request, Response } from 'express'
import { UNIACCChatBot } from './uniacc-scripts'
import { enviarMensajeWhatsApp } from '@/utils/whatsapp-sender'

export async function webhookHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body
    
    // Verificar que es un mensaje entrante de WhatsApp
    if (body.object === 'whatsapp_business_account') {
      const changes = body.entry?.[0]?.changes?.[0]
      const value = changes?.value
      
      if (value?.messages) {
        const message = value.messages[0]
        const from = message.from
        const messageBody = message.text?.body || 
                          message.interactive?.button_reply?.title || 
                          message.interactive?.list_reply?.title || ''
        
        console.log(`📱 Mensaje recibido de ${from}: ${messageBody}`)
        
        // Crear instancia del chatbot para este usuario
        const chatbot = new UNIACCChatBot(
          from,
          async (text: string) => {
            await enviarMensajeWhatsApp(from, text)
          }
        )
        
        // Procesar mensaje
        await chatbot.procesarMensaje(messageBody)
        
        // Responder OK a WhatsApp
        res.status(200).send('OK')
      } else {
        console.log('📱 Webhook recibido sin mensajes')
        res.status(200).send('OK')
      }
    } else {
      console.log('📱 Webhook de tipo desconocido')
      res.status(200).send('OK')
    }
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error)
    res.status(500).json({ error: 'Error interno' })
  }
}
```

## 📤 UTILIDAD PARA ENVIAR MENSAJES

### src/utils/whatsapp-sender.ts
```typescript
import axios from 'axios'

export async function enviarMensajeWhatsApp(numero: string, texto: string): Promise<void> {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: numero,
      type: 'text',
      text: {
        body: texto
      }
    }
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log('✅ Mensaje enviado exitosamente a', numero)
    
  } catch (error: any) {
    console.error('❌ Error enviando mensaje:', error.response?.data || error.message)
    throw error
  }
}
```

## 🛠️ UTILIDADES

### src/utils/validators.ts
```typescript
export function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export function validarTelefono(telefono: string): boolean {
  const telRegex = /^[\d\s\+\-\(\)]{7,15}$/
  return telRegex.test(telefono.trim())
}

export function sanitizarInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres peligrosos
    .slice(0, 200) // Limitar longitud
}

export function esNumeroChileno(numero: string): boolean {
  const numeroLimpio = numero.replace(/[\s\-\+\(\)]/g, '')
  return numeroLimpio.startsWith('56') && numeroLimpio.length >= 11
}
```

### src/utils/routes.ts
```typescript
import { Express } from 'express'

export function setupRoutes(app: Express): void {
  // Ruta de información del bot
  app.get('/', (req, res) => {
    res.json({
      bot: 'UNIACC ChatBot',
      version: '1.0.0',
      status: 'active',
      features: [
        'Información de carreras',
        'Proceso de admisión',
        'Captura de prospectos',
        'Integración con Supabase'
      ],
      endpoints: {
        webhook: '/webhook',
        health: '/health',
        test: '/test'
      }
    })
  })

  // Ruta de testing
  app.get('/test', (req, res) => {
    res.json({
      message: 'Bot funcionando correctamente',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    })
  })
}
```

## 🚀 COMANDOS DE DESARROLLO

### Scripts para desarrollo:
```bash
# Instalar dependencias
npm install

# Desarrollo con recarga automática
npm run dev

# Build para producción
npm run build

# Ejecutar en producción
npm start

# Verificar TypeScript
npm run lint
```

## 📋 TESTING DEL BOT

### Script de prueba:
```bash
# Crear archivo test-bot.js
node -e "
const axios = require('axios');

async function testBot() {
  try {
    const response = await axios.get('http://localhost:3001/health');
    console.log('✅ Bot funcionando:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBot();
"
```

## 🚀 DEPLOY EN RAILWAY

### railway.toml
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"

[env]
NODE_ENV = "production"
```

### Comandos para deploy:
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway new

# Deploy
railway up

# Ver logs
railway logs
```

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Proyecto Node.js creado
- [ ] Dependencies instaladas
- [ ] Estructura de carpetas creada
- [ ] Variables de entorno configuradas
- [ ] Scripts de conversación implementados
- [ ] Integración con WhatsApp configurada
- [ ] Webhook handler implementado
- [ ] Validaciones agregadas
- [ ] Sistema de fallback implementado
- [ ] Testing local completado
- [ ] Deploy en Railway configurado

## 🔧 CONFIGURACIÓN WHATSAPP BUSINESS API

### Pasos en Meta Developers:
1. Crear aplicación en https://developers.facebook.com/
2. Agregar producto WhatsApp
3. Configurar webhook: `https://tu-bot.railway.app/webhook`
4. Verificar webhook con tu VERIFY_TOKEN
5. Agregar tu número como tester
6. Copiar PHONE_NUMBER_ID y ACCESS_TOKEN

### Testing del webhook:
```bash
# Verificar webhook
curl -X GET "https://tu-bot.railway.app/webhook?hub.mode=subscribe&hub.challenge=CHALLENGE_ACCEPTED&hub.verify_token=tu_verify_token"

# Debe devolver: CHALLENGE_ACCEPTED
```

## 🚨 NOTAS IMPORTANTES

1. **Variables de entorno**: Nunca commitear archivos .env
2. **Rate limits**: WhatsApp tiene límites de mensajes por minuto
3. **Logs**: Monitorear logs en Railway dashboard
4. **Fallback**: Sistema guarda datos localmente si falla el webhook
5. **Testing**: Probar con tu número antes de lanzar

## 🔗 ENLACES ÚTILES

- **Railway Dashboard**: https://railway.app/dashboard
- **Meta Developers**: https://developers.facebook.com/
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **Botpress Docs**: https://botpress.com/docs