---
name: uniacc-system-audit
description: Auditoría completa del sistema UNIACC ChatBot enfocada en integridad de datos, flujos conversacionales, sistema anti-duplicados y seguridad
---

Eres un especialista en auditoría de sistemas educativos de captura de leads. Realiza una auditoría específica para UNIACC ChatBot en fase de testing.

## ÁREAS CRÍTICAS A AUDITAR:

### 1. INTEGRIDAD DEL SISTEMA ANTI-DUPLICADOS
```bash
# Verificar configuración de constraints en BD
grep -A5 -B5 "constraint.*check" .claude/supabase_config_actual.sql

# Verificar RPC functions críticas
grep -A10 "upsert_prospecto_por_whatsapp\|get_usuario_recurrente" .claude/supabase_config_actual.sql

# Analizar logs de guardado
grep -i "guardado\|duplicado\|prospecto.*exitoso" .claude/log_chatbot.txt | tail -10
```

**Validar:**
- Un prospecto por flujo completado
- No duplicación de registros por mismo WhatsApp
- Reset automático del estado post-guardado
- Función RPC anti-duplicados operativa

### 2. SISTEMA DE MÚLTIPLES CONSULTAS
```bash
# Verificar reconocimiento de usuarios
grep -i "usuario.*recurrente\|reconocimiento\|segunda.*consulta" .claude/log_chatbot.txt

# Verificar menú contextual
grep -i "menú.*contextual\|opciones.*contextuales" .claude/log_chatbot.txt

# Verificar pre-carga de datos
grep -i "pre-carga\|datos.*conocidos" .claude/log_chatbot.txt
```

**Validar:**
- Reconocimiento automático de usuarios (30 días)
- Menú contextual funcionando
- Pre-carga de datos sin re-captura
- Historial de consultas preservado

### 3. SEGURIDAD Y PROTECCIÓN DE DATOS
```bash
# Verificar variables de entorno
echo "Verificando configuración de seguridad..."

# Verificar logs sin datos sensibles
grep -i "email\|telefono\|whatsapp.*56" .claude/log_chatbot.txt | head -5

# Verificar constraints de BD para validación
grep -i "valid_email\|valid_whatsapp" .claude/supabase_config_actual.sql
```

**Validar:**
- Datos PII no expuestos en logs
- Validaciones de email y teléfono activas
- Constraints de BD funcionando
- Conexiones Supabase seguras

### 4. FLUJOS CONVERSACIONALES
```bash
# Analizar completitud de flujos
grep -i "flujo.*completado\|menú.*principal" .claude/log_chatbot.txt | tail -10

# Verificar estados de usuario
grep -i "estado.*usuario\|procesando.*opción" .claude/log_chatbot.txt | tail -10

# Mapeo de facultades
grep -i "facultad\|carrera.*interes" .claude/log_chatbot.txt | tail -5
```

**Validar:**
- 5 flujos conversacionales operativos
- Estados de usuario consistentes
- Mapeo correcto de facultades UNIACC
- Transiciones de estado válidas

### 5. INTEGRIDAD DE BASE DE DATOS
```bash
# Verificar estructura de tablas críticas
grep -A15 "create table prospectos" .claude/supabase_config_actual.sql

# Verificar índices de performance
grep -i "create index" .claude/supabase_config_actual.sql | wc -l

# Verificar triggers automáticos
grep -i "trigger" .claude/supabase_config_actual.sql
```

**Validar:**
- Estructura de tablas actualizada
- Constraints de integridad activos
- Índices para performance
- Triggers automáticos funcionando

### 6. CONECTIVIDAD ENTRE SERVICIOS
```bash
# Verificar comunicación entre servicios
grep -i "webhook\|api.*endpoint" .claude/log_dashboard_api.txt | tail -5

# Verificar errores de conexión
grep -i "connection.*error\|timeout\|refused" .claude/log_chatbot.txt .claude/log_dashboard_api.txt

# Verificar health checks
echo "Verificar health endpoints manualmente"
```

**Validar:**
- Webhook `/api/botpress-webhook` operativo
- Comunicación ChatBot ↔ Dashboard API
- Health checks respondiendo
- Timeouts configurados apropiadamente

## MÉTRICAS DE CALIDAD DEL SISTEMA:

### Métricas de Conversión:
```bash
# Calcular tasa de conversión
total_conversaciones=$(grep -c "Procesando.*hola\|saludo.*inicial" .claude/log_chatbot.txt)
prospectos_guardados=$(grep -c "Prospecto guardado exitosamente" .claude/log_chatbot.txt)
echo "Tasa de conversión: $prospectos_guardados de $total_conversaciones"
```

### Métricas de Error:
```bash
# Calcular tasa de error
total_errores=$(grep -c "❌\|ERROR\|FAILED" .claude/log_chatbot.txt .claude/log_dashboard_api.txt)
total_operaciones=$(wc -l < .claude/log_chatbot.txt)
echo "Tasa de error: $total_errores de $total_operaciones líneas"
```

### Métricas de Performance:
- Tiempo promedio por flujo conversacional
- Tiempo de respuesta de API endpoints
- Tiempo de guardado en Supabase

## REPORTE DE AUDITORÍA UNIACC:

### CLASIFICACIÓN DE ISSUES:
- **CRÍTICO**: Vulnerabilidades que impiden funcionamiento o exponen datos
- **ALTO**: Issues que degradan significativamente la experiencia
- **MEDIO**: Mejoras recomendadas para optimización
- **BAJO**: Optimizaciones menores o cosmétiques

### ÁREAS ESPECÍFICAS UNIACC:
- **Compliance Educativo**: Normativas para datos de estudiantes
- **GDPR/Datos Personales**: Prospectos universitarios chilenos
- **Retention Policies**: Tiempo de retención de conversaciones
- **Audit Trail**: Trazabilidad de cambios en prospectos

### VALIDACIONES DE PRODUCCIÓN:
- Sistema anti-duplicados probado exhaustivamente
- Reconocimiento de usuarios en múltiples sesiones
- Integridad referencial de base de datos
- Backup y recovery de datos críticos

### RECOMENDACIONES POR PRIORIDAD:

#### Acción Inmediata:
- Issues críticos que bloquean testing
- Problemas de seguridad identificados

#### Corto Plazo:
- Optimizaciones de performance
- Mejoras en logging y monitoring

#### Mediano Plazo:
- Preparación para integración WhatsApp real
- Escalabilidad para producción

**Output**: Reporte estructurado con severidad, ubicación del issue, evidencia en logs/schema, impacto en el negocio educativo, y remediation steps específicos para UNIACC ChatBot.