# Claude Code Context - UNIACC ChatBot

## 🎯 Estado Actual del Proyecto
- **Última sesión**: 2025-08-26
- **Fase**: MVP Completado 
- **Rama principal**: main
- **Estado**: ✅ 100% funcional en desarrollo

## 🏗️ Arquitectura del Sistema

### Microservicios (3 servicios independientes)
```
chatboot-uniacc/
├── 🤖 chatbot/           # Backend ChatBot (Puerto 3001)
├── 📊 dashboard/         # Frontend + API (Puerto 3000 + 3002)
└── 🗄️ Supabase         # Base de datos PostgreSQL
```

### Puertos de Desarrollo
- **3001**: ChatBot Backend (Node.js + TypeScript)
- **3000**: Dashboard Frontend (Vue.js 3 + Vite)
- **3002**: Dashboard API Server (Express.js)

## 🧠 Lógica de Negocio Clave

### Flujos del ChatBot (5 opciones principales)
1. **Conocer carreras** → Exploración por facultades A-E
2. **Proceso admisión 2025** → Info completa de matrícula
3. **Costos y becas** → Información financiera actualizada
4. **Modalidades de estudio** → Presencial/Online/Híbrida
5. **Hablar con asesor** → Captura datos + conexión humana

### Captura de Prospectos (Flujo automático)
```
Usuario WhatsApp → Saludo → Nombre → Email → Edad/Región → Teléfono → Supabase
```

### Base de Datos (Supabase)
- **prospectos**: Datos principales de leads
- **conversaciones**: Sesiones de chat por teléfono
- **mensajes**: Historial completo de intercambios
- **RPC**: `upsert_prospecto_por_whatsapp()` evita duplicados

## 🔧 Decisiones Técnicas Importantes

### Backend (ChatBot - Puerto 3001)
- **TypeScript estricto** con tipado fuerte
- **Estado por usuario** mantenido en memoria
- **Integración dual**: WhatsApp Business API + Testing web
- **Modularización**: actions/, data/, utils/
- **Endpoint clave**: `/test-chat` para desarrollo

### Frontend (Dashboard - Puerto 3000)
- **Vue 3 Composition API** (no Options API)
- **TypeScript + Vite** para desarrollo rápido
- **Tailwind CSS** responsive design
- **Composables** reutilizables (useChat, useProspectos, useMetricas)
- **Componentes modulares** organizados por funcionalidad

### API Server (Puerto 3002)
- **Express.js puro** sin frameworks adicionales
- **Proxy directo a Supabase** con validaciones
- **CORS configurado** para desarrollo
- **Error handling** estructurado

## 🎨 Convenciones de Código

### Naming
- **Componentes**: PascalCase (`ChatInterface.vue`)
- **Variables/Functions**: camelCase (`upsertProspecto`)
- **Database**: snake_case (`created_at`)
- **URLs**: kebab-case (`/api/conversaciones`)

### Estructura de Archivos
- **Chatbot**: `src/{actions,data,utils}/`
- **Dashboard**: `src/{components,composables,views,types}/`
- **Components**: Organizados por dominio (`chat/`, `prospectos/`)

### TypeScript
- **Interfaces explícitas** para todo
- **Tipos de respuesta** de API definidos
- **Validaciones en runtime** con tipos

## 🚀 Comandos de Desarrollo

### Inicio Completo (3 terminales)
```bash
# Terminal 1: ChatBot Backend
cd chatbot && npm run dev

# Terminal 2: Dashboard API Server  
cd dashboard && npm run dev:server

# Terminal 3: Dashboard Frontend
cd dashboard && npm run dev
```

### URLs de Testing
- 🤖 **ChatBot Demo**: http://localhost:3001/chat
- 📊 **Dashboard**: http://localhost:3000
- 🔌 **API Health**: http://localhost:3002/health
- 📊 **Bot Stats**: http://localhost:3001/stats

## 🔄 Próximos Pasos

### Fase Actual: Integración WhatsApp Real
- [ ] Tokens reales de WhatsApp Business API
- [ ] Webhook público (ngrok/tunnel)
- [ ] Testing en WhatsApp real
- [ ] Ajustes de rate limiting

### Fase Siguiente: Producción
- [ ] Deploy en AWS/GCP
- [ ] CI/CD pipeline
- [ ] Monitoring y alertas
- [ ] SSL y seguridad

## 🧪 Testing y Desarrollo

### Chat Demo Completo
- **URL**: http://localhost:3001/chat
- **Funcionalidad**: Simula conversación WhatsApp completa
- **Estado**: Persistente por sesión
- **Datos**: Se guardan en Supabase real

### API Testing
- **Postman Collection**: Disponible en `/docs/`
- **Health Checks**: Todos los servicios
- **Data Validation**: Email, teléfono, campos requeridos

## 📚 Documentación de Referencia

### Archivos Clave
- **README.md**: Guía completa de instalación y uso
- **arquitectura.md**: Documentación técnica detallada
- **programas-uniacc.ts**: Datos actualizados de facultades/carreras
- **respuestas-predefinidas.ts**: Templates del bot

### Variables de Entorno Críticas
```env
# Chatbot
SUPABASE_URL=https://vtwdmyezyvhprwonengu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
VUE_WEBHOOK_URL=http://localhost:3002/api/prospectos

# Dashboard  
VITE_SUPABASE_URL=https://vtwdmyezyvhprwonengu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## ⚠️ Consideraciones Importantes para Claude Code

### Al trabajar en el proyecto, SIEMPRE:
1. **Revisar este contexto primero** antes de hacer cambios
2. **Mantener consistencia** entre los 3 microservicios
3. **Probar en `/chat`** antes de WhatsApp real
4. **Actualizar documentación** si cambias arquitectura
5. **Respetar convenciones** TypeScript establecidas

### Archivos críticos que NO tocar sin contexto:
- `supabase-client.ts` (configuración de BD)
- `programas-uniacc.ts` (datos oficiales UNIACC)
- `upsert_prospecto_por_whatsapp` (RPC function)
- Configuración de puertos (3000, 3001, 3002)

### Para nuevas funcionalidades:
1. **Definir en qué servicio** va la funcionalidad
2. **Crear tipos TypeScript** primero
3. **Implementar API** antes que UI
4. **Probar con datos reales** en Supabase
5. **Documentar cambios** en arquitectura.md

---

## 🎓 Contexto UNIACC
- **Institución**: Universidad de Artes, Ciencias y Comunicaciones
- **Objetivo**: Captar prospectos automáticamente vía WhatsApp
- **Facultades**: Artes, Comunicaciones, Arquitectura, Jurídicas, Negocios
- **Modalidades**: Presencial, Online, Híbrida
- **Proceso**: Independiente del DEMRE

**🔥 El sistema está 100% funcional y listo para integración WhatsApp real**