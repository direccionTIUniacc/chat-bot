# 🎓 UNIACC ChatBot - Sistema Completo

## 📋 Descripción

Sistema completo de chatbot conversacional para UNIACC que incluye:
- **Chatbot WhatsApp** (Node.js/Express) 
- **Dashboard de Gestión** (Vue 3 + TypeScript)

## 🏗️ Arquitectura del Monorepo

```
chatboot-uniacc/
├── chatbot/          # Bot de WhatsApp (Node.js/Express)
├── dashboard/        # Dashboard de gestión (Vue 3)
├── docs/            # Documentación
├── package.json     # Scripts del monorepo
└── README.md        # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js >= 18
- npm >= 9

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/direccionTIUniacc/chat-bot.git
cd chat-bot

# Instalar dependencias de todos los proyectos
npm install

# Configurar variables de entorno
cp chatbot/.env.example chatbot/.env
cp dashboard/.env.example dashboard/.env
```

## 🛠️ Comandos Disponibles

### Desarrollo
```bash
# Levantar ambos proyectos simultáneamente
npm run dev

# Levantar solo el chatbot
npm run dev:chatbot

# Levantar solo el dashboard
npm run dev:dashboard
```

### Producción
```bash
# Build de ambos proyectos
npm run build

# Build solo chatbot
npm run build:chatbot

# Build solo dashboard
npm run build:dashboard
```

## 🎯 Funcionalidades

### 🤖 Chatbot (`/chatbot`)
- ✅ Conversaciones inteligentes en WhatsApp
- ✅ Captura de leads universitarios
- ✅ API REST para integración
- ✅ Interfaz web de demostración
- ✅ Sistema de rate limiting
- ✅ Almacenamiento en memoria (MVP)

### 📊 Dashboard (`/dashboard`)
- ✅ Gestión de prospectos
- ✅ Métricas y analytics
- ✅ Conversaciones en tiempo real
- ✅ Automatizaciones
- ✅ Gestión de ejecutivos

## 🔗 Endpoints Principales

### Chatbot (Puerto 3001)
- `GET /` - Interfaz de demostración
- `POST /webhook` - Webhook de WhatsApp
- `GET /api/prospectos` - Lista de prospectos
- `GET /api/stats` - Estadísticas
- `GET /health` - Health check

### Dashboard (Puerto 3000)
- `/` - Dashboard principal
- `/prospectos` - Gestión de prospectos
- `/conversaciones` - Chat en tiempo real
- `/automatizaciones` - Configuración de bots

## 📈 Estado del Proyecto

### ✅ Completado
- [x] Chatbot funcional con flujos conversacionales
- [x] Dashboard con gestión de prospectos
- [x] Integración entre ambos sistemas
- [x] Estructura de monorepo
- [x] Sistema de captura de leads
- [x] Interfaz web de demostración

### 🔄 En desarrollo
- [ ] Integración con WhatsApp Business API
- [ ] Deploy en producción
- [ ] Tests automatizados
- [ ] Documentación técnica completa

## 🚦 Comenzar Desarrollo

1. **Clonar y configurar:**
   ```bash
   git clone https://github.com/direccionTIUniacc/chat-bot.git
   cd chat-bot
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   # Chatbot
   cp chatbot/.env.example chatbot/.env
   
   # Dashboard
   cp dashboard/.env.example dashboard/.env
   ```

3. **Levantar en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Acceder a las aplicaciones:**
   - 🤖 Chatbot: http://localhost:3001
   - 📊 Dashboard: http://localhost:3000

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📱 Demo del Chatbot

El chatbot incluye flujos conversacionales para:

- 🎓 **Información de carreras** por facultad
- 📝 **Captura de datos** de prospectos
- 🤝 **Solicitud de asesoría** personalizada
- 📊 **Integración automática** con dashboard

### Ejemplo de conversación:
```
Usuario: hola
Bot: 🎓 ¡Hola! Soy el asistente virtual de UNIACC...

Usuario: 1
Bot: 🎨 FACULTADES Y CARRERAS UNIACC...

Usuario: asesor
Bot: 📝 Para brindarte la mejor atención, ¿cuál es tu nombre completo?
```

## 🏗️ Tecnologías Utilizadas

### Backend (Chatbot)
- **Node.js** + **Express.js**
- **TypeScript**
- **dotenv** para variables de entorno
- **cors** y **helmet** para seguridad

### Frontend (Dashboard)
- **Vue 3** + **Composition API**
- **TypeScript**
- **Tailwind CSS**
- **Vite** como build tool

### DevOps
- **npm workspaces** para monorepo
- **concurrently** para desarrollo
- **Git** para versionado

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🎓 UNIACC

**Universidad de Artes, Ciencias y Comunicación**
- 🌐 Sitio web: https://www.uniacc.cl
- 📧 Email: admision@uniacc.cl
- 📞 Teléfono: +56 2 2640 6000

---

**Desarrollado con ❤️ para UNIACC**