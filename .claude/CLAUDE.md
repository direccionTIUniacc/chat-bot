# CLAUDE.md - Memory Bank UNIACC ChatBot

> Sistema de memoria principal para Claude Code - UNIACC ChatBot Project

## CONTEXTO FUNDAMENTAL

**SIEMPRE ejecutar primero:** `npm run init` o `node .claude/claude-init.js`

### Información Básica del Proyecto
- **Institución**: Universidad de Artes, Ciencias y Comunicaciones (UNIACC)
- **Objetivo**: Sistema de captura automática de prospectos vía WhatsApp
- **Estado**: Testing Sistema de Múltiples Consultas - Agosto 2025
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
- **Chat Testing**: http://localhost:3001/chat (PRINCIPAL PARA DEBUGGING)
- **Dashboard**: http://localhost:3000
- **API Health**: http://localhost:3002/health
- **Bot Stats**: http://localhost:3001/stats

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
5. **Hablar con asesor** → Captura automática de datos (PRIORITARIO)

### Facultades UNIACC (Datos oficiales)
- **A) Artes**: Teatro, Danza, Música, Artes Visuales
- **B) Comunicaciones**: Audiovisual, Periodismo, Publicidad
- **C) Arquitectura y Diseño**: Arquitectura, Diseño de Interiores
- **D) Ciencias Jurídicas**: Derecho, Psicología
- **E) Negocios y Tecnología**: Ing. Comercial, Contador Auditor

### Sistema Anti-Duplicados (IMPLEMENTADO)
```
Captura datos → Selecciona flujo → Completa flujo → GUARDA 1 PROSPECTO → Reset usuario → "Escribe Hola para nueva consulta"
```

## ARCHIVOS CRÍTICOS (NO MODIFICAR SIN CONTEXTO)

### Backend ChatBot (chatbot/)
- `src/actions/uniacc-scripts.ts` → **LÓGICA PRINCIPAL DEL BOT**
- `src/data/programas-uniacc.ts` → **DATOS OFICIALES UNIACC**
- `src/utils/supabase-client.ts` → **CONFIGURACIÓN BASE DE DATOS**

### Frontend Dashboard (dashboard/)
- `src/composables/useChat.ts` → **LÓGICA CHAT TIEMPO REAL**
- `server.js` → **API SERVER INTEGRACIÓN SUPABASE**
- `src/components/chat/` → **COMPONENTES INTERFACE**

### Base de Datos (Supabase)
- **Tablas**: `prospectos`, `conversaciones`, `mensajes`, `ejecutivos`
- **RPC Functions**: `upsert_prospecto_por_whatsapp()`, `get_usuario_recurrente()`
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

### Sistema de Múltiples Consultas (FASE ACTUAL)
- **Reconocimiento automático** de usuarios recurrentes (30 días)
- **Menú contextual** con historial de consultas
- **Pre-carga de datos** para usuarios conocidos
- **Sistema anti-duplicados** operativo

## ESTADO ACTUAL Y PRÓXIMOS PASOS

### Fase Actual: Testing Sistema de Múltiples Consultas
- Testing completo de 5 escenarios de usuarios
- Debugging de guardado de región y facultad_interes
- Verificación de funciones RPC en producción
- Resolución de errores de fetch en dashboard

### Issues Conocidos (Verificar en Logs)
- **Guardado de región**: Revisar en logs si se guarda correctamente
- **Guardado de facultad_interes**: Verificar mapeo de IDs
- **Errores de fetch**: Dashboard vs API connectivity
- **Menu contextual**: Procesamiento de opciones

---

**RECORDATORIO CRÍTICO**: Este proyecto maneja datos sensibles de prospectos universitarios. Los archivos dinámicos (logs, schema) se actualizan manualmente por Juan Pablo según necesidades de desarrollo y debugging.