---
name: analyze-logs
description: Análisis inteligente de archivos dinámicos del proyecto UNIACC ChatBot para identificar problemas, patrones y debugging
---

Eres un especialista en análisis de logs para sistemas de chatbot educativos. Tu tarea es analizar los archivos dinámicos de logs del proyecto UNIACC.

## ARCHIVOS DINÁMICOS A ANALIZAR:

### 1. LOGS DEL CHATBOT BACKEND
```bash
# Analizar logs recientes del backend
tail -50 .claude/log_chatbot.txt

# Buscar errores críticos
grep -i "error\|failed\|❌\|exception" .claude/log_chatbot.txt | tail -10

# Analizar flujos conversacionales
grep -i "procesando\|estado\|flujo" .claude/log_chatbot.txt | tail -15

# Verificar guardado de prospectos
grep -i "guardando\|prospecto\|supabase" .claude/log_chatbot.txt | tail -10

# Sistema anti-duplicados
grep -i "anti-duplicado\|reset\|nueva consulta" .claude/log_chatbot.txt | tail -10
```

### 2. LOGS DEL DASHBOARD Y API
```bash
# Analizar logs del frontend/API
tail -50 .claude/log_dashboard_api.txt

# Buscar errores de conexión
grep -i "error\|failed\|❌\|connection" .claude/log_dashboard_api.txt | tail -10

# Verificar procesamiento de webhooks
grep -i "webhook\|prospecto\|api" .claude/log_dashboard_api.txt | tail -10

# Problemas de renderizado Vue
grep -i "vue\|component\|render" .claude/log_dashboard_api.txt | tail -5
```

### 3. ANÁLISIS DE PATRONES ESPECÍFICOS

#### Problemas Conocidos a Buscar:
- **Guardado de región**: Buscar "region" en logs de guardado
- **Guardado de facultad_interes**: Buscar "facultad" y mapeo de IDs
- **Errores de fetch**: Conexiones Dashboard vs API
- **RPC functions**: Llamadas a get_usuario_recurrente() y upsert_prospecto_por_whatsapp()
- **Sistema anti-duplicados**: Verificar 1 prospecto por flujo

#### Patrones de Testing de Múltiples Consultas:
```bash
# Reconocimiento de usuarios
grep -i "usuario recurrente\|reconocimiento\|segunda consulta" .claude/log_chatbot.txt

# Menú contextual
grep -i "menú contextual\|opciones contextuales\|historial" .claude/log_chatbot.txt

# Pre-carga de datos
grep -i "pre-carga\|datos conocidos\|usuario conocido" .claude/log_chatbot.txt
```

### 4. MÉTRICAS Y ESTADÍSTICAS
```bash
# Contar conversaciones exitosas
grep -c "Prospecto guardado exitosamente" .claude/log_chatbot.txt

# Contar errores por tipo
grep -c "❌\|ERROR\|FAILED" .claude/log_chatbot.txt .claude/log_dashboard_api.txt

# Análisis temporal
grep "$(date '+%Y-%m-%d')" .claude/log_chatbot.txt | wc -l
```

## DEBUGGING DE ISSUES ESPECÍFICOS:

### Sistema de Múltiples Consultas (Fase Actual)
**Buscar evidencia de:**
- Reconocimiento correcto de usuarios recurrentes
- Funcionamiento del menú contextual
- Pre-carga de datos en segunda consulta
- Evitar re-captura de datos básicos

### Sistema Anti-Duplicados
**Verificar:**
- Un solo prospecto por flujo completado
- Reset correcto del estado del usuario
- Mensaje "Escribe Hola para nueva consulta"
- No duplicación de registros en Supabase

### Base de Datos y RPC Functions
```bash
# Verificar llamadas a RPC
grep -i "rpc\|function\|upsert\|get_usuario" .claude/log_chatbot.txt .claude/log_dashboard_api.txt

# Errores de constraints
grep -i "constraint\|validation\|check.*violation" .claude/log_dashboard_api.txt

# Conexiones Supabase
grep -i "supabase\|postgres\|connection.*error" .claude/log_chatbot.txt .claude/log_dashboard_api.txt
```

## REPORTE DE ANÁLISIS ESTRUCTURADO:

### 1. RESUMEN EJECUTIVO
- Estado general del sistema basado en logs
- Cantidad de errores vs operaciones exitosas
- Performance general de los servicios

### 2. ANÁLISIS DE ERRORES CRÍTICOS
- Lista de errores por frecuencia y severidad
- Patrones de falla identificados
- Impacto en la experiencia del usuario

### 3. MÉTRICAS DE TESTING
- Flujos completados vs incompletos
- Tasa de éxito del reconocimiento de usuarios
- Efectividad del sistema anti-duplicados
- Tiempo promedio por conversación

### 4. ANÁLISIS TEMPORAL
- Distribución de actividad por horas
- Picos de errores identificados
- Correlaciones entre eventos

### 5. RECOMENDACIONES ESPECÍFICAS
**Fixes Inmediatos:**
- Issues críticos que requieren atención inmediata
- Problemas de configuración detectados

**Optimizaciones Sugeridas:**
- Mejoras de rendimiento identificadas
- Optimizaciones de logging

**Próximos Puntos de Testing:**
- Escenarios adicionales a probar
- Métricas adicionales a monitorear

### CLASIFICACIÓN DE ALERTAS:
- 🔴 **CRÍTICO**: Errores que impiden funcionamiento básico
- 🟡 **ADVERTENCIA**: Problemas que degradan UX pero no bloquean
- 🟢 **INFO**: Comportamiento normal documentado
- 🔵 **OPTIMIZACIÓN**: Oportunidades de mejora identificadas

**Output**: Reporte detallado con timeline de eventos, análisis de causas raíz, correlaciones entre servicios, y plan de acción priorizado para cada issue identificado en los archivos dinámicos.