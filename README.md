# 🎓 UNIACC ChatBot - Sistema Completo

## �� Descripción

Sistema completo de chatbot conversacional para UNIACC que incluye:
- **Chatbot WhatsApp** (Node.js/Express) 
- **Dashboard de Gestión** (Vue 3 + TypeScript)

## 🏗️ Arquitectura del Monorepo

\\\
chatboot-uniacc/
├── chatbot/          # Bot de WhatsApp (Node.js/Express)
├── dashboard/        # Dashboard de gestión (Vue 3)
├── docs/            # Documentación
├── package.json     # Scripts del monorepo
└── README.md        # Este archivo
\\\

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js >= 18
- npm >= 9

### Instalación
\\\ash
# Clonar repositorio
git clone https://github.com/direccionTIUniacc/chat-bot.git
cd chat-bot

# Instalar dependencias de todos los proyectos
npm install

# Configurar variables de entorno
cp chatbot/.env.example chatbot/.env
cp dashboard/.env.example dashboard/.env
\\\

## 🛠️ Comandos Disponibles

### Desarrollo
\\\ash
# Levantar ambos proyectos simultáneamente
npm run dev

# Levantar solo el chatbot
npm run dev:chatbot

# Levantar solo el dashboard
npm run dev:dashboard
\\\

### Producción
\\\ash
# Build de ambos proyectos
npm run build

# Build solo chatbot
npm run build:chatbot

# Build solo dashboard
npm run build:dashboard
\\\

## 🎯 Funcionalidades

### 🤖 Chatbot (\/chatbot\)
- Conversaciones inteligentes en WhatsApp
- Captura de leads universitarios
- API REST para integración
- Interfaz web de demostración
- Sistema de rate limiting
- Almacenamiento en memoria (MVP)

### 📊 Dashboard (\/dashboard\)
- Gestión de prospectos
- Métricas y analytics
- Conversaciones en tiempo real
- Automatizaciones
- Gestión de ejecutivos

## 🔗 Endpoints Principales

### Chatbot (Puerto 3001)
- \GET /\ - Interfaz de demostración
- \POST /webhook\ - Webhook de WhatsApp
- \GET /api/prospectos\ - Lista de prospectos
- \GET /api/stats\ - Estadísticas
- \GET /health\ - Health check

### Dashboard (Puerto 3000)
- \/\ - Dashboard principal
- \/prospectos\ - Gestión de prospectos
- \/conversaciones\ - Chat en tiempo real
- \/automatizaciones\ - Configuración de bots

## 📈 Estado del Proyecto

✅ **Completado:**
- Chatbot funcional con flujos conversacionales
- Dashboard con gestión de prospectos
- Integración entre ambos sistemas
- Estructura de monorepo
- Sistema de captura de leads

🔄 **En desarrollo:**
- Integración con WhatsApp Business API
- Deploy en producción
- Tests automatizados

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (\git checkout -b feature/nueva-funcionalidad\)
3. Commit cambios (\git commit -am 'Agregar nueva funcionalidad'\)
4. Push al branch (\git push origin feature/nueva-funcionalidad\)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🎓 UNIACC

**Universidad de Artes, Ciencias y Comunicación**
- Sitio web: https://www.uniacc.cl
- Email: admision@uniacc.cl
- Teléfono: +56 2 2640 6000

---

**Desarrollado con ❤️ para UNIACC**
