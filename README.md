# 🎓 UNIACC ChatBot - Sistema Completo de Captación de Prospectos

**Autor:** Juan Pablo Silva feat Claude AI

## 📋 Descripción

Sistema completo de chatbot conversacional para UNIACC con arquitectura de microservicios:
- **🤖 Chatbot Backend** (Node.js/TypeScript) - Puerto 3001
- **📊 Dashboard Frontend** (Vue 3 + TypeScript) - Puerto 3000  
- **🔌 Dashboard API Server** (Node.js/Express) - Puerto 3002
- **🗄️ Base de Datos** (Supabase PostgreSQL)

## 🏗️ Arquitectura de Microservicios

```
chatboot-uniacc/
├── 📁 chatbot/           # Backend del ChatBot (Puerto 3001)
│   ├── src/actions/      # Lógica conversacional y integraciones
│   ├── src/data/         # Datos de UNIACC (facultades, carreras)
│   ├── src/utils/        # Utilidades y clientes
│   └── .env             # Variables de entorno
├── 📁 dashboard/         # Dashboard Frontend y API
│   ├── src/             # Frontend Vue.js (Puerto 3000)
│   ├── server.js        # API Server (Puerto 3002)
│   └── .env             # Variables de entorno
├── 📄 arquitectura.md   # Documentación técnica completa
└── 📄 README.md         # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js >= 18
- npm >= 9

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/direccionTIUniacc/chat-bot.git
cd chatboot-uniacc

# Instalar dependencias del chatbot
cd chatbot
npm install

# Instalar dependencias del dashboard
cd ../dashboard
npm install
```

### Configuración de Supabase
1. Crear proyecto en [Supabase](https://supabase.com/)
2. Ejecutar el esquema de BD desde `arquitectura.md`
3. Configurar variables de entorno con las credenciales

## 🛠️ Comandos de Desarrollo

### Levantar todos los servicios
```bash
# Terminal 1: ChatBot Backend (Puerto 3001)
cd chatbot
npm run dev

# Terminal 2: Dashboard completo (Frontend + API) (Puerto 3000 y 3002)
cd dashboard
npm run dev:full

# Comando alternativo para desarrollo separado:
# Terminal 2a: Dashboard API Server (Puerto 3002)
cd dashboard
npm run dev:server

# Terminal 3: Dashboard Frontend (Puerto 3000)
cd dashboard
npm run dev
```

### URLs de desarrollo
- 🤖 **Chatbot:** http://localhost:3001
- 📊 **Dashboard:** http://localhost:3000  
- 🔌 **API Server:** http://localhost:3002
- 💬 **Chat Demo:** http://localhost:3001/chat

## 🎯 Funcionalidades Implementadas (MVP)

### 🤖 Chatbot Backend (Puerto 3001)
- ✅ **Flujos conversacionales completos:**
  - Captura inicial de datos del prospecto
  - Exploración de carreras por facultad
  - Información de proceso de admisión 2025
  - Costos, becas y beneficios
  - Modalidades de estudio (presencial, online, híbrida)
  - Conexión con asesor humano (nivel urgente)
- ✅ **Gestión de estado por usuario con reset automático**
- ✅ **Integración con Supabase**
- ✅ **Validación de datos (email, teléfono, edad, región)**
- ✅ **Interfaz web de testing**
- ✅ **Webhooks para WhatsApp Business API**
- ✅ **Sistema anti-duplicados por flujo**
- ✅ **Reinicio automático de conversación**

### 📊 Dashboard Frontend (Puerto 3000)
- ✅ **Gestión de prospectos en tiempo real**
- ✅ **Lista de conversaciones activas**
- ✅ **Interfaz de chat para ejecutivos**
- ✅ **Métricas y estadísticas**
- ✅ **Identificación visual de prospectos urgentes**
- ✅ **Filtros por tipo de consulta y nivel de interés**
- ✅ **Responsive design**
- ✅ **TypeScript con tipado fuerte**

### 🔌 Dashboard API Server (Puerto 3002)
- ✅ **API REST completa**
- ✅ **Integración directa con Supabase**
- ✅ **Mapeo automático de tipos de consulta**
- ✅ **Gestión de niveles de interés (incluye 'urgente')**
- ✅ **Gestión de conversaciones y mensajes**
- ✅ **CORS configurado**
- ✅ **Validación de datos y constraints**
- ✅ **Webhook para recepción de prospectos**

### 🗄️ Base de Datos (Supabase)
- ✅ **Tabla de prospectos con campos completos**
- ✅ **Tabla de conversaciones**
- ✅ **Tabla de mensajes**
- ✅ **Función RPC para upsert de prospectos**
- ✅ **Constraints actualizados (fuente y nivel_interes)**
- ✅ **Índices para prospectos urgentes**
- ✅ **Triggers automáticos**
- ✅ **Timestamps automáticos**

## 🔗 Endpoints API

### Chatbot Backend (Puerto 3001)
- `GET /` - Página principal
- `GET /chat` - **Interfaz de testing del chat**
- `POST /webhook` - Webhook WhatsApp Business
- `POST /test-chat` - **Endpoint para probar conversaciones**
- `GET /health` - Health check
- `GET /stats` - Estadísticas del bot

### Dashboard API Server (Puerto 3002)
- `POST /api/interacciones` - **Registrar interacciones del bot**
- `POST /api/botpress-webhook` - **Webhook de Botpress para prospectos**
- `GET /api/prospectos` - Listar prospectos
- `GET /api/conversaciones` - **Listar conversaciones**
- `GET /api/conversaciones/:id/mensajes` - **Mensajes de conversación**
- `GET /api/stats` - **Estadísticas generales**
- `GET /health` - Health check

## 📈 Estado del Proyecto

### ✅ MVP Completado (Agosto 2025)
- [x] **Chatbot completo** con todos los flujos conversacionales
- [x] **Dashboard funcional** con gestión de prospectos y conversaciones  
- [x] **Integración Supabase** con persistencia de datos
- [x] **API REST completa** para comunicación entre servicios
- [x] **Sistema de captura** de prospectos con validaciones
- [x] **Interfaz web de testing** completamente funcional
- [x] **Documentación técnica** completa (arquitectura.md)
- [x] **Gestión de estado** avanzada por usuario
- [x] **Sistema anti-duplicados** - 1 prospecto por flujo completado
- [x] **Reinicio automático** de conversación post-flujo
- [x] **Niveles de prioridad** (urgente para solicitudes de asesor)
- [x] **Mapeo automático** de tipos de consulta
- [x] **Constraints de BD** actualizados y funcionales

### 🔄 Próximas Fases
- [ ] **Integración real** con WhatsApp Business API
- [ ] **Notificaciones en tiempo real** (WebSockets)
- [ ] **Deploy en producción** (AWS/GCP)
- [ ] **Tests automatizados** (Jest/Cypress)
- [ ] **Métricas avanzadas** y analytics
- [ ] **Sistema de roles** y permisos
- [ ] **CRM integrado** para seguimiento de leads

## 🚦 Guía de Inicio Rápido

### 1. **Configurar el proyecto:**
```bash
# Clonar repositorio
git clone https://github.com/direccionTIUniacc/chat-bot.git
cd chatboot-uniacc

# Instalar dependencias
cd chatbot && npm install
cd ../dashboard && npm install
```

### 2. **Configurar Supabase:**
- Crear proyecto en [Supabase](https://supabase.com/)
- Ejecutar el esquema SQL desde `arquitectura.md`
- Copiar credenciales a archivos `.env`

### 3. **Variables de entorno requeridas:**
```bash
# chatbot/.env
SUPABASE_URL=tu_url_supabase
SUPABASE_ANON_KEY=tu_anon_key
VUE_WEBHOOK_URL=http://localhost:3002/api/botpress-webhook

# dashboard/.env (para API Server)
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 4. **Levantar servicios:**
```bash
# Opción 1: Todo en uno (recomendado)
cd dashboard && npm run dev:full

# Opción 2: Por separado (3 terminales)
# Terminal 1: ChatBot Backend
cd chatbot && npm run dev

# Terminal 2: Dashboard API Server  
cd dashboard && npm run dev:server

# Terminal 3: Dashboard Frontend
cd dashboard && npm run dev
```

### 5. **Probar el sistema:**
- 💬 **Chat de prueba:** http://localhost:3001/chat
- 📊 **Dashboard:** http://localhost:3000
- 🔌 **API Health:** http://localhost:3002/health

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 💬 Flujos del Chatbot Implementados

### 🎯 **Menú Principal (5 Opciones)**
```
1️⃣ Conocer nuestras carreras
2️⃣ Proceso de admisión 2025  
3️⃣ Costos y becas
4️⃣ Modalidades de estudio
5️⃣ Hablar con un asesor (URGENTE)
```

### 📋 **Proceso de Captura de Prospectos**
```
1. Saludo inicial → Solicita nombre
2. Solicita email (con validación)
3. Solicita edad (validación numérica) y región (menú)
4. Solicita teléfono (validación longitud)
5. Muestra menú principal
6. Al completar flujo → Guarda prospecto + Reset usuario
```

### 🔄 **Sistema Anti-Duplicados**
- **1 prospecto por flujo completado**
- **Reset automático** del usuario post-guardado
- **Mensaje de reinicio:** "Escribe 'Hola' para comenzar con una nueva consulta"

### 🚨 **Clasificación de Prospectos**
- **Consulta General** (`alto`) - Flujos informativos
- **Costos y Becas** (`alto`) - Interés en financiamiento
- **Modalidades de Estudio** (`alto`) - Interés en formatos
- **Solicitud de Asesor** (`urgente`) - Requiere atención inmediata
- **Exploración de Carreras** (`alto`) - Interés académico específico

### 🎓 **Exploración de Carreras por Facultad**
- **A) Artes:** Teatro, Danza, Música, Artes Visuales
- **B) Comunicaciones:** Audiovisual, Periodismo, Publicidad
- **C) Arquitectura y Diseño:** Arquitectura, Diseño de Interiores
- **D) Ciencias Jurídicas:** Derecho, Psicología
- **E) Negocios y Tecnología:** Ing. Comercial, Contador Auditor

### 💰 **Información Completa de UNIACC**
- **Costos y becas** actualizados 2025
- **Modalidades:** Presencial, Semipresencial, Online
- **Proceso de admisión** independiente del DEMRE
- **Fechas importantes** de matrícula e inicio

## 🛠️ Stack Tecnológico

### **Backend**
- **Node.js 18+** + **Express.js**
- **TypeScript** con tipado fuerte
- **Supabase** PostgreSQL + RPC functions
- **dotenv** para configuración
- **CORS** y validación de datos

### **Frontend**
- **Vue 3** + **Composition API**
- **TypeScript** + **Vite**
- **Tailwind CSS** responsive
- **Componentes reutilizables**

### **Base de Datos**
- **Supabase PostgreSQL**
- **Tablas:** prospectos, conversaciones, mensajes, ejecutivos, automatizaciones
- **RPC:** upsert_prospecto_por_whatsapp
- **Constraints:** fuente_check, nivel_interes_check, tipo_consulta
- **Índices:** prospectos_urgentes, tipo_consulta
- **Real-time** subscriptions ready

### **Arquitectura**
- **Microservicios** independientes
- **API REST** para comunicación
- **Estado distribuido** por servicio
- **Anti-patrones** de duplicación implementados

## 📚 Documentación Completa

- 📄 **[arquitectura.md](./arquitectura.md)** - Documentación técnica detallada
- 🔗 **[Supabase Schema](./arquitectura.md#base-de-datos-supabase)** - Esquema de base de datos
- 🛠️ **[Variables de Entorno](./arquitectura.md#variables-de-entorno)** - Configuración completa
- 📊 **[Flujo de Datos](./arquitectura.md#flujo-de-datos)** - Diagramas de arquitectura

## 🚀 Deploy y Producción

### **Preparación para producción:**
```bash
# Build del chatbot
cd chatbot
npm run build

# Build del dashboard  
cd dashboard
npm run build
```

### **Variables de producción requeridas:**
- `WHATSAPP_ACCESS_TOKEN` - Token real de WhatsApp Business API
- `SUPABASE_URL` y `SUPABASE_ANON_KEY` - Credenciales de producción
- `NODE_ENV=production`

## 🎓 UNIACC - Universidad de Artes, Ciencias y Comunicaciones

- 🌐 **Sitio web:** https://www.uniacc.cl
- 📧 **Admisión:** admision@uniacc.cl  
- 📞 **Teléfono:** +56 2 2640 6000
- 📍 **Campus:** Av. Salvador 1200, Providencia (Metro Salvador)

---

## 📊 Métricas del MVP

| Métrica | Estado |
|---------|--------|
| **Flujos conversacionales** | ✅ 5 flujos completos |
| **Captura de prospectos** | ✅ 100% funcional |
| **Sistema anti-duplicados** | ✅ Implementado |
| **Clasificación de urgencia** | ✅ Prospectos urgentes |
| **Reinicio automático** | ✅ Reset post-flujo |
| **Integración BD** | ✅ Supabase operativa |
| **API Endpoints** | ✅ 12 endpoints activos |
| **Frontend responsivo** | ✅ Desktop + Mobile |
| **Documentación** | ✅ Completa |

**🎯 MVP Completado:** Agosto 2025  
**📈 Próximo hito:** Integración WhatsApp Business API real

---

**Desarrollado con ❤️ por Juan Pablo Silva feat Claude AI**