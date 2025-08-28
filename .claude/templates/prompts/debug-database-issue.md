---
template: debug-database-issue
description: Debugging sistemático de issues de base de datos en UNIACC ChatBot con Progressive Capture focus
variables: [issue_type, affected_table, error_message, user_whatsapp]
usage: "Usar cuando hay errores de BD, constraints, o RPC functions"
---

🔧 **DEBUGGING DATABASE ISSUE**

**Issue Type**: {{issue_type}}  
**Affected Table**: {{affected_table}}  
**Error Message**: {{error_message}}  
**User WhatsApp** (si aplica): {{user_whatsapp}}

## 🔍 DIAGNÓSTICO SISTEMÁTICO

### 1. Verificar Schema Actual
```bash
echo "🗄️ VERIFICANDO SCHEMA DE {{affected_table}}"
echo "============================================"

# Verificar estructura de tabla afectada
echo "📋 ESTRUCTURA ACTUAL:"
grep -A30 "create table {{affected_table}}" .claude/supabase_config_actual.sql

echo -e "\n🔒 CONSTRAINTS ACTIVOS:"
grep -A10 -B5 "constraint.*{{affected_table}}\|{{affected_table}}.*constraint" .claude/supabase_config_actual.sql

echo -e "\n📊 ÍNDICES RELACIONADOS:"
grep "idx_{{affected_table}}" .claude/supabase_config_actual.sql

echo -e "\n⚙️ TRIGGERS ACTIVOS:"
grep -A5 -B5 "trigger.*{{affected_table}}" .claude/supabase_config_actual.sql
```

### 2. Análisis de Logs de Error
```bash
echo -e "\n🚨 ANÁLISIS DE LOGS DE ERROR"
echo "============================"

# Buscar errores específicos en logs
echo "🔍 Errores relacionados con '{{error_message}}':"
grep -i "{{error_message}}" .claude/log_chatbot.txt .claude/log_dashboard_api.txt | head -10

echo -e "\n🔍 Errores relacionados con tabla '{{affected_table}}':"
grep -i "{{affected_table}}" .claude/log_chatbot.txt .claude/log_dashboard_api.txt | \
grep -i "error\|failed\|constraint\|violation" | head -10

# Si hay usuario específico, buscar su contexto
if [ "{{user_whatsapp}}" != "" ]; then
    echo -e "\n👤 Contexto del usuario {{user_whatsapp}}:"
    grep "{{user_whatsapp}}" .claude/log_chatbot.txt | \
    grep -A3 -B3 -i "error\|{{affected_table}}" | tail -10
fi

echo -e "\n📊 Patrones de error recientes:"
grep -A5 -B5 "database\|supabase\|constraint\|rpc" .claude/log_chatbot.txt | \
grep -E "$(date '+%Y-%m-%d')|$(date -d '1 day ago' '+%Y-%m-%d')" | tail -15
```

### 3. Verificar RPC Functions (si aplica)
```bash
echo -e "\n⚡ VERIFICANDO RPC FUNCTIONS"
echo "=========================="

# Si el issue involucra RPC functions críticas de UNIACC
if [[ "{{issue_type}}" == *"rpc"* ]] || [[ "{{error_message}}" == *"function"* ]]; then
    echo "🔧 RPC Functions relacionadas con {{affected_table}}:"
    grep -A20 "create.*function.*{{affected_table}}\|upsert_prospecto\|get_usuario_recurrente" .claude/supabase_config_actual.sql
fi
```

## 🎯 DEBUGGING ESPECÍFICO UNIACC

### Progressive Capture Issues
```bash
if [ "{{affected_table}}" = "prospectos" ]; then
    echo -e "\n📈 DEBUGGING PROGRESSIVE CAPTURE"
    echo "==============================="
    
    echo "✅ Verificando constraints de tipo_consulta:"
    grep -A10 "prospectos_tipo_consulta_check" .claude/supabase_config_actual.sql
    
    echo -e "\n✅ Valores permitidos actuales:"
    grep -oE "'[^']*'" .claude/supabase_config_actual.sql | \
    grep -E "captura|abandono|completa" | sort | uniq
    
    echo -e "\n✅ Verificando constraints de email (nullable):"
    grep -A5 -B5 "valid_email" .claude/supabase_config_actual.sql
    
    echo -e "\n✅ Verificando constraints de WhatsApp:"
    grep -A5 -B5 "valid_whatsapp" .claude/supabase_config_actual.sql
fi
```

### Sistema Anti-Duplicados Issues
```bash
echo -e "\n🛡️ DEBUGGING SISTEMA ANTI-DUPLICADOS"
echo "===================================="

echo "🔧 RPC upsert_prospecto_por_whatsapp:"
grep -A25 "create.*function.*upsert_prospecto_por_whatsapp" .claude/supabase_config_actual.sql | head -30

echo -e "\n🔧 RPC get_usuario_recurrente:"  
grep -A15 "create.*function.*get_usuario_recurrente" .claude/supabase_config_actual.sql | head -20

echo -e "\n📊 Índice de reconocimiento:"
grep -A3 -B3 "idx_prospectos_reconocimiento" .claude/supabase_config_actual.sql
```

### Constraint Violations Específicas
```sql
-- Template de verificación de constraints comunes en UNIACC

-- 1. Verificar constraint prospectos_fuente_check
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'prospectos_fuente_check';

-- 2. Verificar constraint prospectos_nivel_interes_check  
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'prospectos_nivel_interes_check';

-- 3. Verificar constraint prospectos_tipo_consulta_check
SELECT constraint_name, check_clause
FROM information_schema.check_constraints  
WHERE constraint_name = 'prospectos_tipo_consulta_check';

-- 4. Si hay usuario específico, verificar sus datos
{{#if user_whatsapp}}
SELECT * FROM prospectos 
WHERE whatsapp = '{{user_whatsapp}}'
ORDER BY created_at DESC LIMIT 3;
{{/if}}
```

## 🔧 DIAGNÓSTICO POR TIPO DE ERROR

### Constraint Violation Errors
```bash
if [[ "{{error_message}}" == *"constraint"* ]]; then
    echo "🔒 CONSTRAINT VIOLATION DETECTED"
    echo "==============================="
    
    # Identificar constraint específico
    constraint_name=$(echo "{{error_message}}" | grep -oE '[a-z_]+_check|valid_[a-z]+')
    echo "🎯 Constraint violado: $constraint_name"
    
    # Mostrar definición del constraint
    grep -A5 -B5 "$constraint_name" .claude/supabase_config_actual.sql
    
    # Sugerir valores válidos
    echo -e "\n💡 VALORES VÁLIDOS:"
    case "$constraint_name" in
        "prospectos_fuente_check")
            echo "  - 'whatsapp_bot', 'uniacc_chatbot', 'demo_chatbot', 'asesor_request', 'web_form'"
            ;;
        "prospectos_nivel_interes_check") 
            echo "  - 'bajo', 'medio', 'alto', 'muy_alto', 'urgente'"
            ;;
        "prospectos_tipo_consulta_check")
            echo "  - Progressive Capture: 'captura en proceso', 'abandono solo nombre', 'abandono con email', etc."
            echo "  - Flujos: 'info_carreras', 'info_admision', 'info_costos', 'solicitar_asesor'"
            ;;
        "valid_email")
            echo "  - Formato email válido o NULL"
            ;;
    esac
fi
```

### RPC Function Errors
```bash
if [[ "{{error_message}}" == *"function"* ]]; then
    echo "⚡ RPC FUNCTION ERROR DETECTED"  
    echo "============================="
    
    # Identificar función problemática
    function_name=$(echo "{{error_message}}" | grep -oE "upsert_prospecto_por_whatsapp|get_usuario_recurrente")
    
    if [ "$function_name" = "upsert_prospecto_por_whatsapp" ]; then
        echo "🔧 Debugging upsert_prospecto_por_whatsapp:"
        echo "  - Verificar parámetros pasados"
        echo "  - Verificar lógica de horas_limite (default 24)"
        echo "  - Verificar constraints en INSERT/UPDATE"
        
        # Mostrar llamadas recientes a esta función
        grep -A5 -B5 "upsert_prospecto" .claude/log_chatbot.txt | tail -10
        
    elif [ "$function_name" = "get_usuario_recurrente" ]; then
        echo "🔧 Debugging get_usuario_recurrente:"
        echo "  - Verificar parámetro p_whatsapp format"
        echo "  - Verificar p_dias_limite (default 30)"
        echo "  - Verificar índice idx_prospectos_reconocimiento"
        
        # Mostrar llamadas recientes
        grep -A5 -B5 "get_usuario_recurrente" .claude/log_chatbot.txt | tail -10
    fi
fi
```

### Connection/Performance Issues
```bash
if [[ "{{error_message}}" == *"timeout"* ]] || [[ "{{error_message}}" == *"connection"* ]]; then
    echo "🌐 CONNECTION/PERFORMANCE ISSUE"
    echo "==============================="
    
    echo "📊 Verificando performance reciente:"
    grep -i "timeout\|slow\|performance" .claude/log_chatbot.txt | tail -10
    
    echo -e "\n🔍 Verificando conexiones a Supabase:"
    grep -i "supabase\|connection" .claude/log_chatbot.txt .claude/log_dashboard_api.txt | \
    grep -E "$(date '+%Y-%m-%d %H')" | tail -5
fi
```

## 🔧 PASOS DE RESOLUCIÓN

### 1. Identificar Causa Raíz
```bash
echo -e "\n🎯 ANÁLISIS DE CAUSA RAÍZ"
echo "========================"

# Determinar tipo de problema
if [[ "{{error_message}}" == *"constraint"* ]]; then
    echo "🔍 TIPO: Constraint violation"
    echo "🎯 CAUSA: Valor inválido para campo con constraint"
    echo "🔧 SOLUCIÓN: Verificar y corregir valor enviado"
    
elif [[ "{{error_message}}" == *"function"* ]]; then
    echo "🔍 TIPO: RPC function error"
    echo "🎯 CAUSA: Error en parámetros o lógica de función"
    echo "🔧 SOLUCIÓN: Verificar parámetros y función definition"
    
elif [[ "{{error_message}}" == *"timeout"* ]]; then
    echo "🔍 TIPO: Performance/Connection issue"  
    echo "🎯 CAUSA: Query lento o problema de conectividad"
    echo "🔧 SOLUCIÓN: Optimizar query o verificar conexión"
    
else
    echo "🔍 TIPO: Otro tipo de error"
    echo "🎯 CAUSA: Requiere análisis específico"
fi
```

### 2. Plan de Fix Inmediato

#### Para Constraint Violations:
```sql
-- Template de fix para constraints comunes

-- Si es prospectos_tipo_consulta_check:
ALTER TABLE prospectos 
DROP CONSTRAINT IF EXISTS prospectos_tipo_consulta_check;

ALTER TABLE prospectos
ADD CONSTRAINT prospectos_tipo_consulta_check 
CHECK (tipo_consulta = ANY (ARRAY[
    'info_carreras'::text, 
    'info_admision'::text, 
    'info_costos'::text, 
    'info_modalidades'::text, 
    'solicitar_asesor'::text,
    'captura en proceso'::text,
    'abandono solo nombre'::text,
    'abandono con email'::text,
    'abandono con edad'::text,
    'abandono con region'::text,
    'abandono incompleto'::text,
    'captura completa'::text
]));
```

#### Para RPC Function Issues:
```sql
-- Recrear función con fix
DROP FUNCTION IF EXISTS upsert_prospecto_por_whatsapp;

-- (Incluir definición corregida completa aquí)
```

### 3. Plan de Testing Post-Fix
```bash
echo -e "\n🧪 PLAN DE TESTING POST-FIX"
echo "=========================="

echo "1. Test básico de constraint:"
echo "   - Insertar valor válido → should succeed" 
echo "   - Insertar valor inválido → should fail gracefully"

echo -e "\n2. Test de RPC function:"
echo "   - Llamar con parámetros válidos → should work"
echo "   - Verificar performance < 1000ms"

echo -e "\n3. Test de integración:"
echo "   - Ejecutar flujo completo Progressive Capture"
echo "   - Verificar sistema anti-duplicados"
echo "   - Confirmar dashboard recibe datos"

if [ "{{user_whatsapp}}" != "" ]; then
    echo -e "\n4. Test específico del usuario afectado:"
    echo "   - Retry operación que falló para {{user_whatsapp}}"
    echo "   - Verificar datos en estado esperado"
fi
```

### 4. Prevención Futura
```bash
echo -e "\n🛡️ PREVENCIÓN DE ISSUES FUTUROS"
echo "=============================="

echo "📋 Checklist de validación pre-deploy:"
echo "  □ Verificar todos los constraints están actualizados"
echo "  □ Test de RPC functions con datos reales" 
echo "  □ Verificar índices de performance"
echo "  □ Test de carga con múltiples usuarios concurrentes"

echo -e "\n📊 Monitoring a implementar:"
echo "  □ Alertas automáticas para constraint violations"
echo "  □ Métricas de performance de RPC functions"
echo "  □ Dashboard de salud de BD en tiempo real"
```

## 📊 DOCUMENTACIÓN DE RESOLUCIÓN

### Issue Summary
```markdown
**Issue**: {{issue_type}} en tabla {{affected_table}}
**Error**: {{error_message}}
**Root Cause**: [Describir causa identificada]
**Impact**: [Describir impacto en usuarios/negocio]
**Resolution**: [Describir solución implementada]
**Prevention**: [Medidas para evitar recurrencia]
```

### Files to Update
```bash
echo "📝 ARCHIVOS A ACTUALIZAR POST-FIX:"

if [[ "{{issue_type}}" == *"constraint"* ]]; then
    echo "  ✏️ .claude/supabase_config_actual.sql - Actualizar constraint"
    echo "  ✏️ .claude/project-context.json - Documentar cambio"
    echo "  ✏️ .claude/CLAUDE.md - Agregar nota sobre fix"
fi

if [[ "{{issue_type}}" == *"rpc"* ]]; then
    echo "  ✏️ .claude/supabase_config_actual.sql - Actualizar RPC function"
    echo "  ✏️ chatbot/src/actions/supabase-integration.ts - Actualizar calls"
    echo "  ✏️ dashboard/server.js - Actualizar API calls si aplica"
fi

echo "  ✏️ .claude/README.md - Documentar issue resuelto"
```

### Success Criteria
```bash
echo -e "\n✅ CRITERIOS DE ÉXITO:"
echo "===================="

echo "□ Error específico ya no ocurre"
echo "□ Funcionalidad afectada restaurada"  
echo "□ Performance dentro de límites aceptables"
echo "□ Tests automatizados pasan"
echo "□ No hay regresiones en otros componentes"
echo "□ Documentación actualizada"

if [ "{{user_whatsapp}}" != "" ]; then
    echo "□ Usuario {{user_whatsapp}} puede completar flujo exitosamente"
fi
```

## 🔍 ANÁLISIS POST-MORTEM

### Timeline del Issue
- **Detección**: [Cuándo se detectó]
- **Impacto inicial**: [Usuarios/procesos afectados]  
- **Diagnóstico**: [Tiempo para identificar causa]
- **Fix implementado**: [Tiempo para implementar solución]
- **Validación**: [Tiempo para confirmar resolución]

### Lessons Learned
- ¿Cómo se pudo haber prevenido?
- ¿Qué monitoring adicional necesitamos?
- ¿Qué procesos de QA necesitamos mejorar?
- ¿Cómo mejorar tiempo de detección/resolución?

---

**Este template acelera el debugging sistemático de issues de BD específicos de UNIACC, manteniendo la integridad del Progressive Capture System y sistema anti-duplicados.**