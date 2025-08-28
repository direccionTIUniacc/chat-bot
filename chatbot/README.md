# 🎓 UNIACC ChatBot con Progressive Capture

Sistema integral de chatbot conversacional con **Progressive Capture System** y dashboard administrativo para la Universidad UNIACC.

## 🆕 PROGRESSIVE CAPTURE SYSTEM - Zero Data Loss

**Estado:** ✅ IMPLEMENTADO Y FUNCIONAL

El sistema ahora guarda **cada campo inmediatamente** cuando el usuario lo ingresa, eliminando la pérdida de datos por abandono de formulario.

## 📋 Descripción del Proyecto

Este MVP consta de dos componentes principales:

1. **🤖 ChatBot Directo** - Bot conversacional para WhatsApp Business API
2. **📊 Dashboard Vue** - Panel administrativo para gestión de prospectos

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────┐    ┌─────────────────────┐
│   UNIACC ChatBot    │    │   Vue Dashboard     │
│   (Node.js/Express) │    │   (Vue 3 + Vite)    │
│   Puerto: 3001      │◄──►│   Puerto: 3000      │
│   + PROGRESSIVE     │    │   + API Server      │
│   CAPTURE SYSTEM    │    │   Puerto: 3002      │
└─────────────────────┘    └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   SUPABASE          │
│   PostgreSQL        │
│   + Progressive     │
│   Capture Schema    │
└─────────────────────┘
```

## 🗂️ Estructura de Proyectos

```
uniacc-chatbot-dashboard/          # Dashboard Vue administrativo
├── src/
│   ├── components/                # Componentes Vue
│   ├── views/                     # Vistas principales
│   ├── composables/               # Lógica reutilizable
│   └── types/                     # Definiciones TypeScript
├── package.json
└── vite.config.ts

uniacc-whatsapp-bot-direct/        # Bot conversacional
├── src/
│   ├── actions/                   # Lógica del bot
│   ├── utils/                     # Utilidades
│   ├── data/                      # Datos de UNIACC
│   └── index.ts                   # Servidor principal
├── .env                           # Variables de entorno
└── package.json
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm
- TypeScript

### 1. Configurar el ChatBot

```bash
cd uniacc-whatsapp-bot-direct
npm install
```

Configurar variables de entorno:
```bash
# Crear archivo .env basado en env.example
cp env.example .env
```

Variables críticas en `.env`:
```env
NODE_ENV=development
BOT_PORT=3001
VUE_WEBHOOK_URL=http://localhost:3000/api/botpress-webhook
VUE_WEBHOOK_SECRET=uniacc_webhook_secret_123
```

### 2. Configurar el Dashboard

```bash
cd uniacc-chatbot-dashboard
npm install
```

## 🎯 Funcionalidades Implementadas

### 🤖 ChatBot UNIACC

#### Flujos Conversacionales
- **🎓 Exploración de Carreras**: Navegación por facultades y programas
- **📚 Información Académica**: Detalles de carreras, costos, modalidades
- **📝 Captura de Prospectos**: Recolección de datos de contacto
- **🤝 Derivación a Asesores**: Conexión con ejecutivos comerciales

#### Facultades y Carreras
- **🎭 Facultad de Artes**: Teatro, Danza y Coreografía
- **📺 Facultad de Comunicaciones**: Comunicación Audiovisual, Periodismo  
- **⚖️ Ciencias Jurídicas**: Derecho, Psicología

#### Datos Capturados (Progressive Capture)
```typescript
interface ProspectoData {
  nombre: string
  email: string | null  // 🆕 Permite null para progressive capture
  telefono: string | null  // 🆕 Permite null para progressive capture
  whatsapp: string
  edad?: number
  region?: string
  carrera_interes?: string
  facultad_interes?: string
  nivel_interes?: string
  tipo_consulta?: string  // 🆕 Progressive capture status
  source: 'uniacc_chatbot' | 'timeout_session'
  flujo_actual?: string
}
```

#### 🔄 Progressive Capture States
1. **🔄 captura en proceso** - Usuario iniciando captura
2. **⚠️ abandono solo nombre** - Usuario ingresó solo nombre
3. **⚠️ abandono con email** - Usuario llegó hasta email
4. **⚠️ abandono con edad** - Usuario llegó hasta edad
5. **⚠️ abandono con region** - Usuario llegó hasta región
6. **❌ abandono incompleto** - Abandono sin datos suficientes
7. **✅ captura completa** - Usuario completó todos los datos

### 📊 Dashboard Administrativo

#### Vistas Principales
- **🏠 Dashboard**: Métricas y resumen general
- **👥 Prospectos**: Gestión de leads capturados
- **💬 Conversaciones**: Interfaz de chat (preparado)
- **👨‍💼 Ejecutivos**: Gestión de equipo comercial
- **📈 Métricas**: Estadísticas y reportes

#### Métricas Implementadas
- Total de prospectos
- Conversión por estado
- Prospectos por fuente
- Estadísticas en tiempo real

## 🔄 Flujo de Integración

### 🆕 Progressive Capture Flow (Zero Data Loss)
1. **Usuario interactúa** con el bot via WhatsApp
2. **Bot procesa** la conversación usando flujos predefinidos
3. **🔄 CAMPO POR CAMPO:**
   - **Nombre ingresado** → Crea prospecto inicial en Supabase
   - **Email ingresado** → Actualiza prospecto existente
   - **Edad ingresada** → Actualiza prospecto existente
   - **Región ingresada** → Actualiza prospecto existente
   - **Teléfono ingresado** → Finaliza como "captura completa"
4. **🚨 Si abandona:** Prospecto queda clasificado según último campo completado
5. **⏰ Timeout inteligente:** Guarda datos parciales con clasificación apropiada
6. **Dashboard muestra** todos los estados de abandono con análisis granular

### API Endpoints

#### Bot → Dashboard
```http
GET http://localhost:3001/api/prospectos
GET http://localhost:3001/api/stats
```

### Ejemplo de Conversación

```
Bot: 🎓 ¡Hola! Soy el asistente virtual de UNIACC
     1️⃣ Conocer nuestras carreras
     2️⃣ Proceso de admisión 2025
     3️⃣ Costos y becas
     4️⃣ Hablar con un asesor

Usuario: 1

Bot: 🎨 FACULTADES Y CARRERAS UNIACC
     A) 🎭 FACULTAD DE ARTES
     B) 📺 FACULTAD DE COMUNICACIONES  
     C) ⚖️ CIENCIAS JURÍDICAS

Usuario: B

Bot: 📺 FACULTAD DE COMUNICACIONES
     1️⃣ Comunicación Audiovisual (pioneros 🥇)
     2️⃣ Periodismo

Usuario: 1

Bot: 🎓 COMUNICACIÓN AUDIOVISUAL
     📚 Duración: 10 semestres
     🏫 Modalidad: Presencial
     💰 Costo aprox: $14.500.000/año
     
     ¿Te interesa esta carrera?
     • Escribe "asesor" para hablar con alguien

Usuario: asesor

Bot: 📝 Para brindarte la mejor atención, ¿cuál es tu nombre completo?

Usuario: Juan Pérez

Bot: ¡Hola Juan! 👋 ¿Cuál es tu email?

Usuario: juan@gmail.com

Bot: 📱 ¿Tu número de teléfono?

Usuario: +56912345678

Bot: 🎓 ¿Qué carrera te interesa?

Usuario: Comunicación Audiovisual

Bot: ✅ ¡Perfecto, Juan!
     📧 Email: juan@gmail.com
     📱 Teléfono: +56912345678
     🎓 Interés: Comunicación Audiovisual
     
     Un asesor te contactará en las próximas 24 horas.
     ¡Bienvenido a la familia UNIACC! 🎓✨
```

## 🛠️ Comandos de Desarrollo

### Iniciar el ChatBot
```bash
cd uniacc-whatsapp-bot-direct
npm run dev
```

### Iniciar el Dashboard
```bash
cd uniacc-chatbot-dashboard
npm run dev
```

### Probar el Bot
```bash
# Demo automático completo
curl -X POST http://localhost:3001/demo-flujo

# Verificar endpoints
curl http://localhost:3001/api/prospectos
curl http://localhost:3001/api/stats
curl http://localhost:3001/health
```

## 🧪 Endpoints de Prueba

### ChatBot (Puerto 3001)
- `GET /` - Interfaz web de demostración
- `POST /demo-flujo` - Ejecuta flujo completo automatizado
- `GET /api/prospectos` - Lista prospectos capturados
- `GET /api/stats` - Estadísticas de prospectos
- `GET /health` - Estado del servidor
- `POST /webhook` - Endpoint para WhatsApp Business API

### Dashboard (Puerto 3000)
- `GET /` - Vista principal del dashboard
- `GET /prospectos` - Gestión de prospectos
- `GET /conversaciones` - Interfaz de chat
- `GET /ejecutivos` - Gestión de equipo
- `GET /metricas` - Reportes y estadísticas

## 📊 Estado del Proyecto

### ✅ Completado
- [x] Bot conversacional funcional
- [x] Captura de prospectos
- [x] Dashboard administrativo
- [x] Integración API REST
- [x] Base de datos en memoria
- [x] Interfaz de demostración web
- [x] Sistema de métricas
- [x] Validaciones de datos
- [x] Gestión de estados de conversación

### ✅ Nuevas Funcionalidades Implementadas
- [x] **🔄 Progressive Capture System** - Zero data loss
- [x] **📊 Granular Abandonment Analysis** - 7 tipos de abandono
- [x] **⏰ Intelligent Timeout System** - Guarda datos parciales
- [x] **🗄️ Supabase Integration** - Base de datos real PostgreSQL
- [x] **📝 Enhanced Data Classification** - Estados detallados de captura
- [x] **🎯 Smart Lead Qualification** - Nivel de interés basado en completación
- [x] **📋 Dashboard Progressive Views** - Interfaz para todos los estados

### 🔄 En Progreso
- [ ] Integración con WhatsApp Business API real
- [ ] Sistema de notificaciones en tiempo real
- [ ] Asignación automática de ejecutivos
- [ ] Reportes avanzados de progressive capture

### 🎯 Próximas Mejoras
- [ ] Sistema de plantillas de respuesta
- [ ] Integración con CRM externo
- [ ] Analytics avanzados
- [ ] Sistema de tickets
- [ ] Automatizaciones adicionales

## 🔧 Tecnologías Utilizadas

### Backend (ChatBot)
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **Axios** - Cliente HTTP
- **Helmet** - Seguridad
- **CORS** - Cross-Origin Resource Sharing

### Frontend (Dashboard)
- **Vue 3** - Framework progresivo
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Lucide Icons** - Iconografía
- **Vue Router** - Enrutamiento
- **Pinia** - Gestión de estado

## 🔐 Seguridad

- **Helmet.js** configurado para CSP
- **CORS** restringido a dominios específicos
- **Variables de entorno** para secretos
- **Validación de datos** en entrada
- **Rate limiting** básico implementado

## 📝 Notas de Desarrollo

### Decisiones Técnicas
1. **Base de datos en memoria**: Para MVP, evita complejidad de setup
2. **API REST simple**: Comunicación directa entre componentes
3. **Vue 3 + Composition API**: Máxima flexibilidad y mantenibilidad
4. **TypeScript en ambos proyectos**: Tipado fuerte y mejor DX

### 🆕 Beneficios del Progressive Capture
- ✅ **Zero Data Loss** - Ningún dato se pierde por abandono
- ✅ **Análisis Granular** - Saber exactamente dónde abandonan los usuarios
- ✅ **Mejor Seguimiento** - Prospectos parciales pueden ser re-contactados
- ✅ **Clasificación Inteligente** - Estados detallados para mejor gestión
- ✅ **Persistencia Real** - Datos guardados en Supabase PostgreSQL
- ✅ **Dashboard Intuitivo** - Etiquetas claras para cada tipo de abandono

### Limitaciones Actuales
- Sin autenticación de usuarios
- Configuración manual de endpoints
- Integración con WhatsApp real pendiente

## 👥 Equipo

- **Desarrollo**: Asistente IA Claude (Anthropic)
- **Coordinación**: Juan Silva
- **Cliente**: Universidad UNIACC

## 📞 Información de Contacto UNIACC

- **Campus Providencia**: Av. Salvador 1200, Providencia
- **Teléfono**: +56 2 2640 6000
- **Email**: admision@uniacc.cl
- **Web**: www.uniacc.cl

---

**🎓 Universidad de Artes, Ciencias y Comunicaciones - UNIACC**  
*"¡Bienvenidos a Crear!"*