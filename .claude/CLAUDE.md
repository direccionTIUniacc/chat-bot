# CLAUDE.md - Memory Bank UNIACC ChatBot

> Sistema de memoria principal para Claude Code - UNIACC ChatBot Project

## CONTEXTO FUNDAMENTAL

**SIEMPRE ejecutar primero:** `npm run init` o `node .claude/claude-init.js`

### Información Básica del Proyecto
- **Institución**: Universidad de Artes, Ciencias y Comunicaciones (UNIACC)
- **Objetivo**: Sistema de captura automática de prospectos vía WhatsApp
- **Estado**: Sistema Avanzado con Auto-Detección y Timeout Inteligente - Agosto 2025
- **Maintainer**: Juan Pablo Silva

## ARQUITECTURA DEL SISTEMA

### Microservicios (3 componentes críticos)
```
UNIACC-ChatBot/
├── chatbot/     → Backend Node.js + TypeScript (Puerto 3001)
├── dashboard/   → Vue.js 3 Frontend + API (Puertos 3000 + 3002)
└── Supabase     → PostgreSQL con RPC functions
```

### URLs de Desarrollo CRÍTICAS
- **Chat Testing**: http://localhost:3001/chat (PRINCIPAL PARA DEBUGGING - HTML/JS)
- **Chat Demo Vue**: http://localhost:3000/chat-demo (INTEGRADO EN DASHBOARD)
- **Dashboard**: http://localhost:3000
- **API Health**: http://localhost:3002/health
- **Bot Stats**: http://localhost:3001/stats

### NUEVAS HERRAMIENTAS DE TESTING (Agosto 2025)
- **Auto-Detección**: Prueba automática detección de números telefónicos
- **Timeout System**: Sistema de warnings y timeout automático con polling
- **Enhanced Logging**: Logs categorizados en tiempo real para debugging
- **Web Components**: Componentes reutilizables para integración externa

## SISTEMA DE TESTING AUTOMATIZADO ✅

### Testing Framework Completo (IMPLEMENTADO - Agosto 2025)
El proyecto cuenta con un sistema completo de testing automatizado para validar todos los flujos críticos del Progressive Capture System.

#### Comandos de Testing Disponibles
```bash
# Tests individuales por escenario
npm run test-progressive-capture    # Flujo completo de captura
npm run test-abandono-email        # Abandono después de email
npm run test-returning-user         # Reconocimiento de usuarios
npm run test-anti-duplicates        # Sistema anti-duplicados
npm run test-asesor-urgente         # Flujo asesor urgente

# Tests masivos
npm run run-test-scenario           # Comando principal
npm run test-all-scenarios          # Todos los escenarios
npm run test-with-services          # Con verificación previa
```

#### Escenarios Críticos Testeados
1. **NUEVO: Auto-Detection System** - Detección automática de números telefónicos
2. **NUEVO: Advanced Timeout System** - Warnings a 1.5min, timeout a 2min con guardado automático
3. **Progressive Capture Complete** - Flujo completo sin abandonos (MEJORADO con teléfono primero)
4. **Abandono con Email** - Manejo de abandonos parciales
5. **Returning User Recognition** - Sistema de reconocimiento automático con menús contextuales
6. **Anti-Duplicates Validation** - Prevención de prospectos duplicados
7. **Asesor Urgente Flow** - Flujo crítico de solicitud de asesor
8. **NUEVO: Enhanced Logging Validation** - Sistema de logs categorizados

#### Validaciones Automáticas
- ✅ **Zero Data Loss**: Cada campo se guarda inmediatamente en BD
- ✅ **NUEVO: Auto-Detection**: Teléfonos detectados y validados en formato E.164
- ✅ **NUEVO: Timeout Prevention**: Guardado automático en timeouts sin pérdida
- ✅ **Estado Evolution**: `captura en proceso` → `captura completa` (MEJORADO)
- ✅ **Database Consistency**: Verificación de constraints y RPC functions
- ✅ **Response Validation**: Validación de respuestas del bot
- ✅ **NUEVO: Enhanced Logging**: Logs categorizados con análisis automático
- ✅ **Performance Metrics**: Tiempos de respuesta y procesamiento

#### Estructura del Sistema de Testing
```
.claude/templates/
├── test-scenarios/    # Escenarios en JSON
├── scripts/          # Motor de ejecución
├── reports/          # Reportes generados
└── README.md         # Documentación completa
```

## ARCHIVOS DINÁMICOS CRÍTICOS

### Archivos que se actualizan durante desarrollo:

#### `log_chatbot.txt` - Logs del Backend ChatBot
- **Propósito**: Logs en tiempo real del backend Node.js (Puerto 3001)
- **Se actualiza**: Cuando Claude necesita analizar problemas del chatbot
- **Contiene**: Logs de conversaciones, errores Supabase, debug de flujos, estados de usuarios
- **Uso**: `tail -20 .claude/log_chatbot.txt` para ver logs recientes

#### `log_dashboard_api.txt` - Logs del Dashboard y API
- **Propósito**: Logs combinados del frontend Vue.js (3000) y API Express (3002)
- **Se actualiza**: Cuando Claude necesita analizar problemas de dashboard/API
- **Contiene**: Errores de API endpoints, problemas Supabase, logs de procesamiento
- **Uso**: `tail -20 .claude/log_dashboard_api.txt` para diagnóstico

#### `supabase_config_actual.sql` - Schema de Base de Datos
- **Propósito**: Estructura actualizada de BD con constraints y RPC functions
- **Se actualiza**: Cuando se realizan migraciones o cambios de schema
- **Contiene**: Definición completa de tablas, constraints, RPC functions, índices
- **Uso**: Referencia para desarrollo y debugging de BD

## LÓGICA DE NEGOCIO UNIACC

### 5 Flujos Conversacionales del ChatBot
1. **Conocer carreras** → Exploración por facultades A-E
2. **Proceso admisión 2025** → Información independiente del DEMRE
3. **Costos y becas** → Información financiera
4. **Modalidades** → Presencial/Online/Híbrida
5. **Hablar con asesor** → Captura progresiva de datos SIN PÉRDIDA (IMPLEMENTADO)

### Facultades UNIACC (Datos oficiales)
- **A) Artes**: Teatro, Danza, Música, Artes Visuales
- **B) Comunicaciones**: Audiovisual, Periodismo, Publicidad
- **C) Arquitectura y Diseño**: Arquitectura, Diseño de Interiores
- **D) Ciencias Jurídicas**: Derecho, Psicología
- **E) Negocios y Tecnología**: Ing. Comercial, Contador Auditor

### Sistema Progressive Capture (IMPLEMENTADO - AGOSTO 2025)
```
NOMBRE → Crea prospecto inicial → EMAIL → Actualiza prospecto → EDAD → Actualiza → REGIÓN → Actualiza → TELÉFONO → Finaliza como completo
```

**BENEFICIOS CRÍTICOS:**
- ✅ **ZERO DATA LOSS**: Cada campo se guarda inmediatamente en BD
- ✅ **Análisis granular**: Conocer exactamente dónde abandonan los usuarios
- ✅ **Clasificación inteligente**: 7 tipos de abandono según completitud
- ✅ **Recuperación de leads**: Datos parciales siguen siendo valiosos

**TIPOS DE CAPTURA PROGRESIVA:**
- `captura en proceso` - Usuario actualmente completando datos
- `abandono solo nombre` - Abandonó después de dar solo el nombre
- `abandono con email` - Abandonó después de nombre + email
- `abandono con edad` - Abandonó después de nombre + email + edad
- `abandono con region` - Abandonó después de nombre + email + edad + región
- `abandono incompleto` - Timeout durante proceso
- `captura completa` - Completó todos los campos (teléfono incluido)

### Sistema Anti-Duplicados (IMPLEMENTADO)
```
Captura progresiva → Selecciona flujo → Completa flujo → ACTUALIZA PROSPECTO EXISTENTE → Reset usuario → "Escribe Hola para nueva consulta"
```

## ARCHIVOS CRÍTICOS (NO MODIFICAR SIN CONTEXTO)

### Backend ChatBot (chatbot/)
- `src/actions/uniacc-scripts.ts` → **LÓGICA PRINCIPAL + PROGRESSIVE CAPTURE**
- `src/actions/supabase-integration.ts` → **INTERFACES ACTUALIZADAS (email/telefono nullable)**
- `src/data/programas-uniacc.ts` → **DATOS OFICIALES UNIACC**
- `src/utils/supabase-client.ts` → **CONFIGURACIÓN BASE DE DATOS**

### Frontend Dashboard (dashboard/)
- `src/composables/useChat.ts` → **LÓGICA CHAT TIEMPO REAL**
- `server.js` → **API SERVER + MAPEO PROGRESSIVE CAPTURE**
- `src/types/prospecto.ts` → **ESQUEMA ACTUALIZADO PROGRESSIVE CAPTURE**
- `src/utils/formatters.ts` → **FORMATEO UI TIPOS DE ABANDONO**
- `src/components/chat/` → **COMPONENTES INTERFACE**

### Base de Datos (Supabase)
- **Tablas**: `prospectos` (CON PROGRESSIVE CAPTURE), `conversaciones`, `mensajes`, `ejecutivos`
- **RPC Functions**: `upsert_prospecto_por_whatsapp()`, `get_usuario_recurrente()`
- **Constraints Actualizados**: `prospectos_fuente_check`, `valid_email` (permite nulls)
- **Campo tipo_consulta**: 7 nuevos valores para progressive capture
- **URL**: https://vtwdmyezyvhprwonengu.supabase.co

## COMANDOS DE DESARROLLO

### Scripts de Contexto (desde .claude/)
- `npm run init` → Mostrar contexto completo con archivos dinámicos
- `npm run health` → Verificar servicios activos
- `npm run report` → Reporte de progreso detallado
- `npm run debug-logs` → Ver logs recientes de ambos servicios
- `npm run check-services` → Ping a todos los servicios
- `npm run pre-testing` → Contexto + health check completo
- `npm run analyze-errors` → Buscar errores en logs

### Comandos para Archivos Dinámicos
- `tail -20 log_chatbot.txt` → Logs recientes backend
- `tail -20 log_dashboard_api.txt` → Logs recientes frontend/API
- `grep -i "error" log_chatbot.txt | tail -10` → Errores recientes
- `head -50 supabase_config_actual.sql` → Schema actual BD

### Inicio de Servicios
```bash
# Opción recomendada - Una terminal
cd dashboard && npm run dev:full

# Opción separada - 3 terminales
cd chatbot && npm run dev        # Terminal 1
cd dashboard && npm run dev:server  # Terminal 2
cd dashboard && npm run dev      # Terminal 3
```

## COMANDOS CLAUDE CODE ESPECÍFICOS

### Disponibles en `.claude/commands/`
- `/project-status` → Estado completo del proyecto con logs
- `/analyze-logs` → Análisis inteligente de archivos dinámicos
- `/uniacc-system-audit` → Auditoría específica del sistema
- `/sync-database` → Sincronización de schema BD

### Agentes Especializados en `.claude/agents/`
- `uniacc-dynamic-files-sync` → Gestión de archivos dinámicos
- `uniacc-memory-sync` → Sincronización de documentación

## CONVENCIONES DE CÓDIGO

### Naming Standards
- **Componentes Vue**: PascalCase (`ChatInterface.vue`)
- **Variables/Functions**: camelCase (`upsertProspecto`, `guardarProspectoFinalFlujo`)
- **Database**: snake_case (`created_at`, `tipo_consulta`)
- **API Routes**: kebab-case (`/api/conversaciones`)

### TypeScript Requirements
- **Tipado fuerte obligatorio** en todo el código
- **Interfaces explícitas** para todas las responses
- **Validación runtime** combinada con tipos
- **Prohibido usar `any`** types

## REGLAS CRÍTICAS PARA CLAUDE

### ANTES de cualquier modificación:
1. **Ejecutar** `npm run init` para contexto actual
2. **Verificar** servicios con `npm run check-services`
3. **Revisar logs** con `npm run debug-logs`
4. **Probar** cambios en http://localhost:3001/chat SIEMPRE
5. **Actualizar** contexto con archivos dinámicos

### Al trabajar con archivos dinámicos:
- **Logs**: Consultar siempre antes de debugging
- **Schema BD**: Verificar antes de cambios en base de datos
- **Estado actual**: Los archivos reflejan el estado real del sistema

### Para debugging de issues:
1. **Logs primero** - Revisar archivos dinámicos
2. **Contexto segundo** - Ejecutar npm run init
3. **Testing tercero** - Probar en interfaz de chat
4. **Documentar** - Actualizar contexto si se resuelve issue

## FLUJO DE DEBUGGING CON ARCHIVOS DINÁMICOS

### Cuando Claude necesite diagnosticar:
1. **Ejecutar contexto**: `npm run init`
2. **Verificar servicios**: `npm run check-services`
3. **Analizar logs**: `npm run debug-logs`
4. **Revisar errores**: `npm run analyze-errors`
5. **Consultar schema**: Si hay errores de BD, revisar `supabase_config_actual.sql`

## TESTING Y VALIDACIÓN

### URLs de Testing Obligatorias
- **Chat Demo Completo**: http://localhost:3001/chat
- **Health Check ChatBot**: http://localhost:3001/health
- **Health Check API**: http://localhost:3002/health
- **Dashboard Interface**: http://localhost:3000

### Progressive Capture System (IMPLEMENTADO - AGOSTO 2025)
- **Captura inmediata** de cada campo en base de datos
- **Clasificación inteligente** de abandono por nivel de completitud
- **Zero data loss** - Ningún dato se pierde por abandonos
- **7 tipos de estado** según progreso de captura
- **Interfaces actualizadas** para manejar campos nullable (email, teléfono)
- **Dashboard actualizado** con formateo de tipos de abandono

### Sistema de Múltiples Consultas (FUNCIONAL)
- **Reconocimiento automático** de usuarios recurrentes (30 días)
- **Menú contextual** con historial de consultas
- **Pre-carga de datos** para usuarios conocidos
- **Sistema anti-duplicados** operativo con progressive capture

## ESTADO ACTUAL Y PRÓXIMOS PASOS

### FASE ACTUAL: Progressive Capture System COMPLETADO ✅

#### ✅ IMPLEMENTACIONES COMPLETADAS (Agosto 2025):
1. **Progressive Data Capture**: Cada campo se guarda inmediatamente
2. **Database Schema Updates**: 7 nuevos valores tipo_consulta
3. **Backend Logic Extended**: UsuarioState con campos progressive capture
4. **Progressive Methods**: crearProspectoInicial(), actualizarProspectoCampo(), finalizarProspecto()
5. **Dashboard Integration**: Mapeo y formateo de nuevos estados
6. **TypeScript Updates**: Interfaces actualizadas para campos nullable
7. **Constraint Fixes**: Resueltos todos los conflictos de BD

#### 🔄 PRÓXIMOS PASOS:
- Testing exhaustivo del sistema progressive capture
- Análisis de métricas de abandono por campo
- Optimización basada en patrones de abandono detectados
- Integración con sistema de follow-up automático

### Issues Resueltos ✅
- **Constraint violations**: Corregidos prospectos_fuente_check y valid_email
- **TypeScript compilation**: Resueltos todos los errores de tipos
- **Interface consistency**: email y teléfono ahora son nullable
- **Database schema**: Actualizado completamente para progressive capture

---

**RECORDATORIO CRÍTICO**: Este proyecto maneja datos sensibles de prospectos universitarios. Los archivos dinámicos (logs, schema) se actualizan manualmente por Juan Pablo según necesidades de desarrollo y debugging.