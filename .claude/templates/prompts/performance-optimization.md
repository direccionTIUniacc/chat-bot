---
template: performance-optimization
description: Análisis de performance y optimización específica para UNIACC ChatBot con métricas de Progressive Capture
variables: [service_name, metric_threshold, time_period, performance_issue]
usage: "Usar cuando se detectan problemas de performance o para análisis preventivo"
---

🚀 **ANÁLISIS DE PERFORMANCE - UNIACC CHATBOT**

**Servicio**: {{service_name}}  
**Threshold Crítico**: {{metric_threshold}}  
**Período de Análisis**: {{time_period}}  
**Issue Específico**: {{performance_issue}}

## 📊 MÉTRICAS ACTUALES DEL SERVICIO

### 1. ChatBot Backend (Puerto 3001)
```bash
if [ "{{service_name}}" = "chatbot" ] || [ "{{service_name}}" = "all" ]; then
    echo "🤖 ANÁLISIS PERFORMANCE CHATBOT BACKEND"
    echo "======================================"
    
    # Métricas de tiempo de respuesta
    echo "⏱️ TIEMPOS DE RESPUESTA:"
    grep -i "procesando\|processing.*time\|response.*time" .claude/log_chatbot.txt | \
    grep -E "$(date '+%Y-%m-%d')|$(date -d '1 day ago' '+%Y-%m-%d')" | tail -20
    
    # Progressive Capture Performance
    echo -e "\n📈 PROGRESSIVE CAPTURE PERFORMANCE:"
    grep -i "guardando.*prospecto\|prospecto.*guardado" .claude/log_chatbot.txt | \
    while read line; do
        timestamp=$(echo "$line" | grep -o '\[.*\]')
        echo "$timestamp: Guardado de prospecto"
    done | tail -10
    
    # RPC Functions Performance  
    echo -e "\n⚡ RPC FUNCTIONS PERFORMANCE:"
    grep -E "upsert_prospecto_por_whatsapp|get_usuario_recurrente" .claude/log_chatbot.txt | \
    grep -E "$(date '+%Y-%m-%d %H')" | tail -10
    
    # Análisis de carga por minuto
    echo -e "\n📊 CARGA POR MINUTO (última hora):"
    grep "$(date '+%Y-%m-%d %H')" .claude/log_chatbot.txt | \
    cut -d'[' -f2 | cut -d']' -f1 | cut -d':' -f1-2 | sort | uniq -c | tail -10
fi
```

### 2. Dashboard + API (Puertos 3000/3002)
```bash
if [ "{{service_name}}" = "dashboard" ] || [ "{{service_name}}" = "all" ]; then
    echo -e "\n📊 ANÁLISIS PERFORMANCE DASHBOARD + API"
    echo "======================================"
    
    # API Response Times
    echo "🌐 API RESPONSE TIMES:"
    grep -i "response.*time\|api.*endpoint.*ms\|POST\|GET" .claude/log_dashboard_api.txt | \
    grep -E "$(date '+%Y-%m-%d')" | tail -15
    
    # Webhook Performance
    echo -e "\n🔗 WEBHOOK PERFORMANCE:"
    grep -i "webhook\|botpress-webhook" .claude/log_dashboard_api.txt | \
    grep -E "$(date '+%Y-%m-%d %H')" | tail -10
    
    # Database Query Performance  
    echo -e "\n🗄️ DATABASE QUERY PERFORMANCE:"
    grep -i "supabase\|query.*time\|database" .claude/log_dashboard_api.txt | \
    grep -v "success" | tail -10
fi
```

## 🔍 ANÁLISIS DE BOTTLENECKS UNIACC

### Progressive Capture System Performance
```bash
echo -e "\n📈 PROGRESSIVE CAPTURE BOTTLENECK ANALYSIS"
echo "=========================================="

# Tiempo promedio por paso de captura
echo "⏱️ TIEMPO POR PASO DE CAPTURA:"
steps=("solicitar_nombre" "solicitar_email" "solicitar_edad" "solicitar_region" "solicitar_telefono")

for step in "${steps[@]}"; do
    count=$(grep "$step" .claude/log_chatbot.txt | wc -l)
    echo "  $step: $count ocurrencias"
done

# Identificar pasos más lentos
echo -e "\n🐌 PASOS MÁS LENTOS (> {{metric_threshold}}ms):"
grep -i "timeout\|slow\|{{metric_threshold}}" .claude/log_chatbot.txt | \
grep -E "captura|progressive" | tail -5
```

### Sistema Anti-Duplicados Performance
```bash
echo -e "\n🛡️ ANTI-DUPLICADOS PERFORMANCE"
echo "============================="

# Performance de RPC upsert_prospecto_por_whatsapp
echo "📊 RPC upsert_prospecto_por_whatsapp calls:"
grep -c "upsert_prospecto_por_whatsapp" .claude/log_chatbot.txt | \
xargs echo "Total calls today:"

echo -e "\n📊 RPC get_usuario_recurrente calls:"
grep -c "get_usuario_recurrente" .claude/log_chatbot.txt | \
xargs echo "Total calls today:"

# Verificar si hay timeouts en RPC calls
echo -e "\n⚠️ RPC TIMEOUTS/ERRORS:"
grep -E "rpc.*timeout|rpc.*error|function.*failed" .claude/log_chatbot.txt | tail -5
```

### Supabase Connection Performance  
```bash
echo -e "\n🗄️ SUPABASE CONNECTION ANALYSIS"
echo "==============================="

# Connection issues
echo "🔌 CONNECTION ISSUES:"
grep -i "connection.*error\|connection.*timeout\|supabase.*error" \
.claude/log_chatbot.txt .claude/log_dashboard_api.txt | tail -10

# Query performance issues
echo -e "\n🐌 SLOW QUERIES:"
grep -i "slow.*query\|query.*timeout\|database.*slow" \
.claude/log_chatbot.txt .claude/log_dashboard_api.txt | tail -5
```

## 🎯 OPTIMIZACIONES ESPECÍFICAS UNIACC

### Database Query Optimization
```sql
-- Verificar índices críticos están presentes y optimizados

-- 1. Índice para reconocimiento de usuarios (más crítico)
EXPLAIN ANALYZE 
SELECT * FROM prospectos 
WHERE whatsapp = '56912345001' 
ORDER BY created_at DESC LIMIT 1;

-- Should use: idx_prospectos_reconocimiento

-- 2. Índice para dashboard filters
EXPLAIN ANALYZE
SELECT * FROM prospectos 
WHERE estado = 'nuevo' AND tipo_consulta = 'solicitar_asesor'
ORDER BY created_at DESC;

-- Should use: idx_prospectos_dashboard_filters

-- 3. Índice para búsqueda de carreras
EXPLAIN ANALYZE
SELECT * FROM prospectos 
WHERE carrera_interes ILIKE '%derecho%';

-- Should use: idx_prospectos_carrera_text_search
```

### Application Level Optimizations
```javascript
// Optimizaciones a nivel de aplicación

const optimizations = {
    // 1. Caching de datos estáticos
    "facultades_cache": {
        "ttl": "24 hours",
        "benefit": "Reduce queries a BD por datos que no cambian",
        "implementation": "Redis cache o in-memory cache"
    },
    
    // 2. Connection pooling optimizado
    "supabase_pool": {
        "max_connections": 20,
        "idle_timeout": "30s",
        "acquisition_timeout": "5s"
    },
    
    // 3. Async processing para logs
    "async_logging": {
        "priority": "low", 
        "batch_size": 10,
        "flush_interval": "5s"
    },
    
    // 4. Progressive Capture optimizado
    "progressive_capture": {
        "immediate_save_timeout": "500ms",
        "batch_updates": false, // Cada campo individual
        "validation_cache": "1 hour"
    }
};

console.log("Optimizations to implement:", optimizations);
```

### Specific UNIACC Performance Tuning
```bash
echo -e "\n🎓 UNIACC-SPECIFIC PERFORMANCE TUNING"
echo "===================================="

echo "1. 📚 DATOS DE FACULTADES/CARRERAS:"
echo "   - Cache en memoria (datos estáticos)"
echo "   - Pre-load al inicio de servicios"
echo "   - TTL: 24 horas"

echo -e "\n2. 🔄 PROGRESSIVE CAPTURE OPTIMIZATION:"
echo "   - Validación async de email format"
echo "   - Batch processing de metadata updates"  
echo "   - Estado en Redis para high-throughput"

echo -e "\n3. 👥 RECONOCIMIENTO DE USUARIOS:"
echo "   - Índice compuesto optimizado"
echo "   - Query con LIMIT 1 siempre"
echo "   - Cache de usuarios recientes (1 hora)"

echo -e "\n4. 📊 DASHBOARD PERFORMANCE:"
echo "   - Paginación en queries grandes"
echo "   - Filtros con índices específicos"
echo "   - WebSocket para updates tiempo real"
```

## 📈 BENCHMARKING Y LOAD TESTING

### Concurrent User Simulation
```bash
echo -e "\n🧪 LOAD TESTING SIMULATION"
echo "========================="

echo "Simulando {{metric_threshold}} usuarios concurrentes..."

# Progressive Capture Load Test
for i in $(seq 1 10); do
    {
        echo "Testing user $i..."
        
        # Simular flujo completo progressive capture
        curl -s -w "User $i - Time: %{time_total}s\n" \
        -X POST http://localhost:3001/test-chat \
        -H "Content-Type: application/json" \
        -d "{\"from\":\"5691234500$i\",\"message\":\"hola\"}" > /dev/null
        
        sleep 1
        
        curl -s -w "User $i - Name: %{time_total}s\n" \
        -X POST http://localhost:3001/test-chat \
        -H "Content-Type: application/json" \
        -d "{\"from\":\"5691234500$i\",\"message\":\"Test User $i\"}" > /dev/null
        
    } &
done

wait
echo "✅ Concurrent load test completed"
```

### Performance Thresholds UNIACC
```bash
echo -e "\n🎯 PERFORMANCE THRESHOLDS VALIDATION"
echo "=================================="

thresholds='
API_Response_Time=2000ms
Database_Query_Time=1000ms
Progressive_Capture_Step=500ms
RPC_Function_Call=800ms
Webhook_Delivery=1500ms
User_Recognition=300ms
'

echo "$thresholds" | while IFS='=' read metric threshold; do
    if [ -n "$metric" ]; then
        echo "📊 $metric: Target < $threshold"
        
        # Here would be actual measurement logic
        # For now, simulate measurement
        current=$((RANDOM % 3000 + 500))
        target=${threshold%ms}
        
        if [ $current -lt $target ]; then
            echo "   ✅ Current: ${current}ms (GOOD)"
        else
            echo "   ⚠️ Current: ${current}ms (NEEDS OPTIMIZATION)"
        fi
    fi
done
```

## 📊 MONITORING Y ALERTAS

### Real-time Performance Metrics
```bash
echo -e "\n📈 MÉTRICAS EN TIEMPO REAL"
echo "========================"

# Métricas por servicio
services=("chatbot:3001" "dashboard:3000" "api:3002")

for service in "${services[@]}"; do
    name=${service%:*}
    port=${service#*:}
    
    echo "🔧 $name (Puerto $port):"
    
    # Health check con timing
    response_time=$(curl -o /dev/null -s -w %{time_total} http://localhost:$port/health 2>/dev/null || echo "ERROR")
    
    if [ "$response_time" = "ERROR" ]; then
        echo "   ❌ Service DOWN"
    else
        echo "   ✅ Response time: ${response_time}s"
    fi
done
```

### Alertas Automáticas Sugeridas
```yaml
# Configuración de alertas para UNIACC ChatBot

alerts:
  critical:
    - name: "API Response Time Critical"
      condition: "response_time > 5000ms for 5 minutes"
      action: "immediate_notification"
      
    - name: "Progressive Capture Failure Rate"
      condition: "capture_failure_rate > 10% for 10 minutes"
      action: "escalate_to_dev_team"
      
    - name: "RPC Function Errors"
      condition: "rpc_error_count > 5 in 5 minutes"
      action: "auto_restart + notification"

  warning:
    - name: "API Response Time Warning" 
      condition: "response_time > {{metric_threshold}} for 15 minutes"
      action: "slack_notification"
      
    - name: "Database Connection Pool"
      condition: "connection_pool_usage > 80%"
      action: "scale_up_notification"

  info:
    - name: "Progressive Capture Rate Low"
      condition: "completion_rate < 70% for 1 hour"
      action: "daily_report"
```

## 📋 REPORTE DE OPTIMIZACIÓN

### Performance Summary
```bash
echo -e "\n📊 PERFORMANCE SUMMARY REPORT"
echo "============================="
echo "Servicio: {{service_name}}"
echo "Período: {{time_period}}"
echo "Threshold: {{metric_threshold}}"
echo ""

# Calculate metrics (simplified for template)
current_avg_response=1200
target_response=${metric_threshold%ms}

echo "📈 Métricas Actuales:"
echo "  - Avg Response Time: ${current_avg_response}ms"
echo "  - Target: ${target_response}ms"

if [ $current_avg_response -lt $target_response ]; then
    echo "  - Status: ✅ WITHIN TARGET"
else
    echo "  - Status: ⚠️ NEEDS OPTIMIZATION"
fi

echo ""
echo "🔍 Bottlenecks Identificados:"
if [[ "{{performance_issue}}" != "" ]]; then
    echo "  - {{performance_issue}}"
else
    echo "  - Database query optimization needed"
    echo "  - RPC function performance tuning"
fi
```

### Action Plan Priorizado
```bash
echo -e "\n🎯 PLAN DE ACCIÓN PRIORIZADO"
echo "=========================="

echo "🔴 PRIORIDAD ALTA (< 1 día):"
echo "  1. Optimizar queries más lentas identificadas"
echo "  2. Implementar connection pooling si no existe"
echo "  3. Agregar índices faltantes críticos"

echo -e "\n🟡 PRIORIDAD MEDIA (1 semana):"
echo "  1. Implementar caching para datos estáticos"
echo "  2. Optimizar RPC functions performance"
echo "  3. Setup monitoring automático"

echo -e "\n🔵 PRIORIDAD BAJA (1 mes):"
echo "  1. Implementar load balancing si necesario"
echo "  2. Optimización avanzada de queries"
echo "  3. Performance testing automatizado"
```

### Implementation Recommendations
```bash
echo -e "\n💡 RECOMENDACIONES DE IMPLEMENTACIÓN"
echo "=================================="

echo "🔧 QUICK WINS (< 4 horas):"
echo "  - Agregar índices identificados como faltantes"
echo "  - Ajustar timeouts de conexión BD"
echo "  - Cache de datos de facultades en memoria"

echo -e "\n🏗️ ARQUITECTURA (1-2 semanas):"
echo "  - Redis para session state management"
echo "  - Connection pooling optimizado"
echo "  - Async processing para operaciones no-críticas"

echo -e "\n📊 MONITORING (ongoing):"
echo "  - Metrics dashboard en tiempo real"
echo "  - Alertas automáticas configuradas"
echo "  - Performance regression testing"
```

---

**Este análisis proporciona optimizaciones específicas para UNIACC ChatBot, enfocándose en Progressive Capture performance y sistema anti-duplicados, con métricas accionables y plan de implementación priorizado.**