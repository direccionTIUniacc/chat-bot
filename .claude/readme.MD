# Claude Code Context - UNIACC ChatBot

**Autor:** Juan Pablo Silva feat Claude AI

## 🎯 Estado Actual del Proyecto
- **Última sesión**: 2025-08-28
- **Fase**: Progressive Capture System IMPLEMENTADO ✅
- **Rama principal**: dev (con Progressive Capture funcional)
- **Estado**: 🚀 MAJOR FEATURE COMPLETADO - Sistema sin pérdida de datos

## 🏗️ Arquitectura del Sistema

### Microservicios (3 servicios independientes)
```
chatboot-uniacc/
├── 🤖 chatbot/           # Backend ChatBot (Puerto 3001)
├── 📊 dashboard/         # Frontend + API (Puerto 3000 + 3002)
└── 🗄️ Supabase         # Base de datos PostgreSQL con constraints
```

### Puertos de Desarrollo
- **3001**: ChatBot Backend (Node.js + TypeScript)
- **3000**: Dashboard Frontend (Vue.js 3 + Vite)
- **3002**: Dashboard API Server (Express.js)

## 🧠 Lógica de Negocio Clave (ACTUALIZADA)

### Flujos del ChatBot (5 opciones principales)
1. **Conocer carreras** → Exploración por facultades A-E → 1 prospecto al final
2. **Proceso admisión 2025** → Info completa de matrícula → 1 prospecto al final
3. **Costos y becas** → Información financiera actualizada → 1 prospecto al final
4. **Modalidades de estudio** → Presencial/Online/Híbrida → 1 prospecto al final
5. **Hablar con asesor** → Captura PROGRESIVA sin pérdida + conexión humana → **PROSPECTO URGENTE**

### Sistema Progressive Capture (IMPLEMENTADO - AGOSTO 2025) 🔥
```
NOMBRE → Crea prospecto inicial → EMAIL → Actualiza → EDAD → Actualiza → REGIÓN → Actualiza → TELÉFONO → Completa
```

**BENEFICIOS CRÍTICOS:**
- ✅ **ZERO DATA LOSS**: Cada campo se guarda inmediatamente
- ✅ **7 tipos de abandono**: Clasificación granular según completitud
- ✅ **Análisis avanzado**: Saber exactamente dónde abandonan usuarios
- ✅ **Recuperación de leads**: Datos parciales son valiosos

### Sistema Anti-Duplicados (MEJORADO)
```
Progressive Capture → Selecciona flujo → Completa flujo → ACTUALIZA PROSPECTO → Reset usuario → "Escribe Hola para nueva consulta"
```

### Clasificación Automática de Prospectos + Progressive Capture
**Flujos Informativos:**
- **Consulta General** (`alto`) - Flujos informativos
- **Costos y Becas** (`alto`) - Interés en financiamiento  
- **Modalidades de Estudio** (`alto`) - Interés en formatos
- **Exploración de Carreras** (`alto`) - Interés académico
- **Solicitud de Asesor** (`urgente`) - **PRIORIDAD MÁXIMA**

**Estados Progressive Capture:**
- `captura en proceso` - Usuario completando datos activamente
- `abandono solo nombre` - Abandonó después de dar solo nombre
- `abandono con email` - Abandonó después de nombre + email  
- `abandono con edad` - Abandonó después de nombre + email + edad
- `abandono con region` - Abandonó después de nombre + email + edad + región
- `abandono incompleto` - Timeout durante proceso
- `captura completa` - Completó todos los campos (teléfono incluido)

### Base de Datos (Supabase) - ACTUALIZADA
- **prospectos**: Datos principales con PROGRESSIVE CAPTURE (7 tipos abandono)
- **conversaciones**: Sesiones de chat por teléfono
- **mensajes**: Historial completo de intercambios  
- **ejecutivos**: Gestión de asesores para prospectos urgentes
- **Constraints actualizados**: 
  - `prospectos_fuente_check` incluye `asesor_request`, `uniacc_chatbot`, `demo_chatbot`
  - `prospectos_nivel_interes_check` incluye `urgente`
- **RPC**: `upsert_prospecto_por_whatsapp()` evita duplicados

## 🔧 Decisiones Técnicas Importantes (ACTUALIZADAS)

### Backend (ChatBot - Puerto 3001)
- **TypeScript estricto** con tipado fuerte
- **Estado por usuario** mantenido en memoria con **reset automático**
- **Sistema anti-duplicados**: 1 prospecto por flujo completado
- **Integración dual**: WhatsApp Business API + Testing web
- **Modularización**: actions/, data/, utils/
- **Endpoint clave**: `/test-chat` para desarrollo
- **Webhook actualizado**: Envía a `/api/botpress-webhook`

### Frontend (Dashboard - Puerto 3000)
- **Vue 3 Composition API** (no Options API)
- **TypeScript + Vite** para desarrollo rápido
- **Tailwind CSS** responsive design
- **Composables** reutilizables (useChat, useProspectos, useMetricas)
- **Componentes modulares** organizados por funcionalidad
- **Identificación visual** de prospectos urgentes
- **Filtros avanzados** por tipo de consulta y prioridad

### API Server (Puerto 3002) - ACTUALIZADA
- **Express.js puro** sin frameworks adicionales
- **Proxy directo a Supabase** con validaciones
- **Mapeo automático** de tipos de consulta:
  - `consulta_general` → `consulta general`
  - `costos_becas` → `consulta costos y/o becas`
  - `modalidades_estudio` → `consulta modalidades de estudio`  
  - `hablar_asesor` → `solicitud de asesor`
- **Gestión de prioridades**: `urgente` para solicitudes de asesor
- **CORS configurado** para desarrollo
- **Error handling** estructurado con constraints validation

## 🎨 Convenciones de Código

### Naming
- **Componentes**: PascalCase (`ChatInterface.vue`)
- **Variables/Functions**: camelCase (`upsertProspecto`, `guardarProspectoFinalFlujo`)
- **Database**: snake_case (`created_at`, `tipo_consulta`)
- **URLs**: kebab-case (`/api/conversaciones`)

### Estructura de Archivos
- **Chatbot**: `src/{actions,data,utils}/`
- **Dashboard**: `src/{components,composables,views,types}/`
- **Components**: Organizados por dominio (`chat/`, `prospectos/`)

### TypeScript
- **Interfaces explícitas** para todo
- **Tipos de respuesta** de API definidos
- **Validaciones en runtime** con tipos
- **Métodos async/await** para operaciones de BD

## 🚀 Comandos de Desarrollo (ACTUALIZADOS)

### Inicio Completo - Opción Recomendada
```bash
# Una sola terminal para dashboard completo
cd dashboard && npm run dev:full
```

### Inicio Separado (3 terminales)
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

## 🆕 Nuevas Funcionalidades Implementadas (Agosto 2025)

### Sistema Anti-Duplicados
- ✅ **1 prospecto por flujo completado** - No más duplicados
- ✅ **Reset automático del usuario** después de guardar
- ✅ **Validación de datos mínimos** antes de guardar
- ✅ **Mensaje consistente de reinicio**: "Escribe 'Hola' para comenzar con una nueva consulta"

### Sistema de Múltiples Consultas (NUEVO - Agosto 28)
- ✅ **Reconocimiento de usuarios recurrentes** por WhatsApp (30 días)
- ✅ **Menú contextual** con historial de consultas
- ✅ **Pre-carga de datos** para usuarios conocidos
- ✅ **RPC functions** para anti-duplicados y reconocimiento
- 🔧 **Bug fix**: Guardado de región y facultad_interes
- 🔧 **Bug fix**: Procesamiento de menú contextual

### Base de Datos Migrada (migration_multiple_consultas.sql)
- ✅ **Funciones RPC** para reconocimiento: `get_usuario_recurrente()`
- ✅ **Anti-duplicados mejorado**: `upsert_prospecto_por_whatsapp()`
- ✅ **Vista optimizada**: `usuarios_recurrentes`
- ✅ **Índices de performance** para consultas de reconocimiento
- ✅ **Constraints mejorados** para tipo_consulta
- ✅ **Triggers automáticos** para metadata de reconocimiento

### Clasificación Inteligente
- ✅ **Mapeo automático** de flujos a tipos de consulta
- ✅ **Priorización automática** - Solicitudes de asesor = `urgente`
- ✅ **Identificación visual** en dashboard con badges
- ✅ **Filtros por prioridad** en vista de prospectos

### Gestión de Estado Avanzada
- ✅ **Estado independiente por usuario**
- ✅ **Limpieza automática** post-flujo
- ✅ **Preservación de datos** durante flujo activo
- ✅ **Validaciones en cada paso** del proceso

## 🔄 Próximos Pasos

### Fase Actual: Testing Sistema de Múltiples Consultas
- 🔧 **Testing completo** de 5 escenarios de usuarios
- 🔧 **Debugging** de guardado de región y facultad_interes
- 🔧 **Verificación** de funciones RPC en producción
- 🔧 **Resolución** de errores de fetch en dashboard
- [ ] **Validación** de reconocimiento automático funcional

### Fase Siguiente: Integración WhatsApp Real
- [ ] Tokens reales de WhatsApp Business API
- [ ] Webhook público (ngrok/tunnel)
- [ ] Testing en WhatsApp real con sistema anti-duplicados
- [ ] Ajustes de rate limiting y escalabilidad

### Fase Siguiente: Producción
- [ ] Deploy en AWS/GCP con microservicios
- [ ] CI/CD pipeline automatizado
- [ ] Monitoring y alertas para prospectos urgentes
- [ ] SSL y seguridad avanzada
- [ ] Sistema de asignación automática de ejecutivos

## 🧪 Testing y Desarrollo

### Chat Demo Completo
- **URL**: http://localhost:3001/chat
- **Funcionalidad**: Simula conversación WhatsApp con sistema de múltiples consultas
- **Estado**: Reconocimiento automático de usuarios recurrentes
- **Datos**: Se guardan en Supabase con anti-duplicados y clasificación automática

### Flujo de Prueba Actualizado (Testing Múltiples Consultas)
1. **Primera Consulta**: 
   - Ir a http://localhost:3001/chat
   - Completar captura inicial (nombre, email, edad, región, teléfono)
   - Seleccionar opción del menú (1-5) y completar flujo
   - Verificar guardado en dashboard
   
2. **Segunda Consulta (Reconocimiento)**:
   - Escribir "Hola" para nueva consulta
   - Verificar menú contextual con datos pre-cargados
   - Probar opciones: nueva consulta vs consulta relacionada
   - Verificar que no se duplican datos básicos

3. **Debugging**: Revisar logs para región y facultad_interes

### API Testing
- **Health Checks**: Todos los servicios funcionando
- **Data Validation**: Email, teléfono, campos requeridos
- **Constraint Validation**: Fuente y nivel_interes válidos
- **Webhook Testing**: `/api/botpress-webhook` operativo

## 📚 Documentación de Referencia

### Archivos Clave (ACTUALIZADOS)
- **README.md**: Guía completa con nuevas funcionalidades
- **arquitectura.md**: Documentación técnica v2.0 actualizada  
- **test.md**: Plan de testing de 5 escenarios de usuarios
- **flujos.md**: Diagramas de todos los flujos del chatbot
- **migration_multiple_consultas.sql**: Migración completa de BD
- **programas-uniacc.ts**: Datos actualizados de facultades/carreras
- **respuestas-predefinidas.ts**: Templates del bot
- **supabase_config_actual.sql**: Schema actualizado con constraints

### Variables de Entorno Críticas (ACTUALIZADAS)
```env
# Chatbot
SUPABASE_URL=https://vtwdmyezyvhprwonengu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
VUE_WEBHOOK_URL=http://localhost:3002/api/botpress-webhook  # ← ACTUALIZADO

# Dashboard  
VITE_SUPABASE_URL=https://vtwdmyezyvhprwonengu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## ⚠️ Consideraciones Importantes para Claude Code

### Al trabajar en el proyecto, SIEMPRE:
1. **Revisar este contexto primero** antes de hacer cambios
2. **Mantener el sistema anti-duplicados** - 1 prospecto por flujo
3. **Probar reset automático** en `/chat` 
4. **Verificar clasificación** de prospectos en dashboard
5. **Respetar constraints** de base de datos actualizados
6. **Mantener consistencia** entre los 3 microservicios

### Archivos críticos que NO tocar sin contexto:
- `supabase-client.ts` (configuración de BD)
- `programas-uniacc.ts` (datos oficiales UNIACC)
- `upsert_prospecto_por_whatsapp` (RPC function)
- `guardarProspectoFinalFlujo` (sistema anti-duplicados)
- Configuración de puertos (3000, 3001, 3002)
- Constraints de BD (`prospectos_fuente_check`, `prospectos_nivel_interes_check`)

### Funcionalidades críticas implementadas:
- **Sistema anti-duplicados** en `uniacc-scripts.ts`
- **Reset automático** de usuarios post-guardado
- **Mapeo de tipos** en `server.js`
- **Identificación de urgencia** en dashboard
- **Webhook consolidado** `/api/botpress-webhook`

### Para nuevas funcionalidades:
1. **Definir en qué servicio** va la funcionalidad
2. **Verificar impacto** en sistema anti-duplicados
3. **Crear tipos TypeScript** primero
4. **Implementar API** antes que UI
5. **Probar con datos reales** en Supabase
6. **Documentar cambios** en arquitectura.md v2.0

## 🏆 Logros Clave de Esta Versión

### ✅ Problemas Resueltos
- **Duplicados eliminados**: Sistema garantiza 1 prospecto por flujo
- **Pérdida de estado**: Reset controlado solo al finalizar
- **Falta de priorización**: Prospectos urgentes identificados
- **Constraints BD**: Valores permitidos validados
- **UX confusa**: Mensaje claro de reinicio
- **Reconocimiento de usuarios**: Múltiples consultas sin re-ingreso de datos

### 🔧 Bugs Identificados y En Proceso
- **Guardado de región**: No se está guardando correctamente en BD
- **Guardado de facultad_interes**: Falta mapeo de IDs a nombres
- **Errores de fetch**: Dashboard muestra errores durante testing
- **Menu contextual**: Corregido procesamiento de opciones generales

### ✅ Mejoras de Rendimiento  
- **Índices optimizados** para reconocimiento de usuarios
- **RPC functions** para consultas complejas
- **Vista materializada** usuarios_recurrentes
- **Queries eficientes** para dashboard
- **Validaciones tempranas** evitan errores
- **Mapeo automático** reduce procesamiento manual

### ✅ Calidad de Código
- **Debugging mejorado** con logs detallados
- **Métodos async/await** consistentes
- **Error handling** robusto
- **TypeScript strict** en todo el proyecto
- **Documentación completa** actualizada
- **Testing plan** de 5 escenarios documentado

---

## 🎓 Contexto UNIACC
- **Institución**: Universidad de Artes, Ciencias y Comunicaciones
- **Objetivo**: Captar prospectos automáticamente vía WhatsApp SIN DUPLICADOS
- **Facultades**: Artes, Comunicaciones, Arquitectura, Jurídicas, Negocios
- **Modalidades**: Presencial, Online, Híbrida
- **Proceso**: Independiente del DEMRE
- **Prioridad**: Solicitudes de asesor requieren atención URGENTE

**🔧 El sistema está en fase de testing con reconocimiento de usuarios múltiples y debugging de guardado de datos**

---

**Desarrollado con ❤️ por Juan Pablo Silva feat Claude AI**