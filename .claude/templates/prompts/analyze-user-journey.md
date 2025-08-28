---
template: analyze-user-journey
description: Análisis profundo del journey de usuario en el chatbot UNIACC con Progressive Capture analytics
variables: [user_whatsapp, journey_type, time_period, abandonment_point]
usage: "Usar para análisis post-mortem de usuarios o identificar puntos de fricción"
---

Analiza el journey completo del usuario **{{user_whatsapp}}** en el sistema UNIACC ChatBot.

**Tipo de análisis**: {{journey_type}}  
**Período**: {{time_period}}  
**Punto de abandono** (si aplica): {{abandonment_point}}

## 🔍 RECOPILACIÓN DE DATOS

### 1. Extraer Logs de Conversación
```bash
echo "📱 ANALIZANDO USUARIO: {{user_whatsapp}}"
echo "======================================="

# Extraer todas las interacciones del usuario
grep "{{user_whatsapp}}" .claude/log_chatbot.txt > user_journey_{{user_whatsapp}}.log

# Mostrar timeline completo
echo "📅 TIMELINE DE INTERACCIONES:"
grep "{{user_whatsapp}}" .claude/log_chatbot.txt | while read line; do
    timestamp=$(echo "$line" | grep -o '\[.*\]' | head -1)
    message=$(echo "$line" | cut -d']' -f2-)
    echo "$timestamp: $message"
done

# Análisis de estados y transiciones
echo -e "\n🔄 TRANSICIONES DE ESTADO:"
grep -A2 -B2 "Estado.*{{user_whatsapp}}" .claude/log_chatbot.txt | \
grep -E "Estado|Procesando"
```

### 2. Análisis de Progressive Capture
```bash
echo -e "\n📊 PROGRESSIVE CAPTURE ANALYSIS:"

# Verificar campos capturados
echo "Campos completados:"
grep "{{user_whatsapp}}" .claude/log_chatbot.txt | \
grep -E "nombre|email|edad|region|telefono" | \
while read line; do
    field=$(echo "$line" | grep -oE "nombre|email|edad|region|telefono")
    value=$(echo "$line" | cut -d':' -f3)
    echo "  ✅ $field: $value"
done

# Punto de abandono específico
if [ "{{abandonment_point}}" != "" ]; then
    echo -e "\n⚠️ ABANDONO DETECTADO EN: {{abandonment_point}}"
    grep -A5 -B5 "{{abandonment_point}}" user_journey_{{user_whatsapp}}.log
fi
```

### 3. Consulta a Base de Datos
```sql
-- Verificar estado actual en BD
SELECT 
    nombre, email, telefono, edad, region,
    tipo_consulta, nivel_interes, created_at, updated_at,
    facultad_interes, carrera_interes
FROM prospectos 
WHERE whatsapp = '{{user_whatsapp}}'
ORDER BY created_at DESC;

-- Verificar conversaciones asociadas  
SELECT 
    c.status, c.message_count, c.last_message_at,
    COUNT(m.id) as total_messages
FROM conversaciones c
LEFT JOIN mensajes m ON c.id = m.conversacion_id  
WHERE c.phone_number = '{{user_whatsapp}}'
GROUP BY c.id, c.status, c.message_count, c.last_message_at;
```

## 📊 ANÁLISIS ESPECÍFICO UNIACC

### Journey Mapping Visual
```
Usuario: {{user_whatsapp}} ({{journey_type}})
Período: {{time_period}}

FLUJO PROGRESSIVE CAPTURE:
Saludo → Nombre → Email → Edad → Región → Teléfono → Menú
  ✅      ✅       ✅      ❌      -        -         -
 0:00    0:30     1:15   2:45   [ABANDONO]

Punto de abandono: {{abandonment_point}}
Tiempo total: XX:XX minutos
Datos preservados: ✅ Nombre, Email | ❌ Edad, Región, Teléfono
```

### Análisis de Comportamiento
- **Patrón de respuesta**: ¿Respuestas rápidas o lentas?
- **Punto de fricción**: ¿Dónde tardó más? ¿Dónde abandonó?
- **Tipo de mensajes**: ¿Seguía instrucciones o enviaba mensajes off-topic?
- **Momento del día**: ¿Horario de alta/baja actividad?

### Progressive Capture Insights
```bash
# Tiempo entre pasos
echo "⏱️ TIEMPOS ENTRE PASOS:"
grep "{{user_whatsapp}}" .claude/log_chatbot.txt | \
grep -E "Procesando.*hola|solicitar_nombre|solicitar_email|solicitar_edad|solicitar_region|solicitar_telefono" | \
while read line; do
    timestamp=$(echo "$line" | grep -o '\[.*\]')
    step=$(echo "$line" | grep -oE "solicitar_[a-z]+|hola")
    echo "  $timestamp - $step"
done
```

### Clasificación de Abandono (si aplica)
- **abandono solo nombre**: Valor bajo, pero email útil para remarketing
- **abandono con email**: Valor medio, lead recuperable via email  
- **abandono con edad**: Valor medio-alto, perfil demográfico disponible
- **abandono con región**: Valor alto, targeting geográfico posible
- **abandono incompleto**: Timeout técnico, re-engagement inmediato

## 🎯 INSIGHTS Y RECOMENDACIONES

### UX Improvements Identificadas
```bash
# Análizar mensajes que generaron confusión
echo "🤔 MENSAJES PROBLEMÁTICOS:"
grep "{{user_whatsapp}}" .claude/log_chatbot.txt | \
grep -A3 -B3 -i "no entiendo\|???\|qué\|error" 

# Identificar pasos lentos
echo -e "\n⏳ PASOS CON MAYOR FRICCIÓN:"
# (Lógica para identificar steps donde usuario tardó más)
```

### Optimizaciones Sugeridas
1. **Mensaje Optimization**: 
   - Si abandonó en email: Simplificar explicación
   - Si abandonó en edad: Explicar por qué es necesaria
   - Si abandonó en región: Ofrecer opciones más claras

2. **UX Flow Improvements**:
   - Reducir steps si possible
   - Clarificar value proposition en cada paso
   - Agregar progress indicators

3. **Follow-up Strategy**:
   - Email sequence para abandonos con email
   - WhatsApp remarketing para abandonos tempranos
   - Llamada directa para abandonos avanzados

### Technical Issues Detectados
```bash
# Buscar errores técnicos durante journey
echo "🔧 ERRORES TÉCNICOS:"
grep "{{user_whatsapp}}" .claude/log_chatbot.txt | \
grep -i "error\|failed\|timeout\|exception"
```

### Métricas del Journey
- **Tiempo total de interacción**: XX minutos
- **Número de mensajes**: XX intercambios  
- **Tasa de respuesta**: XX% de mensajes del bot respondidos
- **Completitud de datos**: XX% de campos capturados
- **Punto de máxima fricción**: Paso donde más tiempo tardó

## 📈 BUSINESS IMPACT ANALYSIS

### Valor del Prospecto
```javascript
// Calcular valor del lead basado en completitud
const leadValue = {
  'solo_nombre': 10,      // Valor base mínimo
  'con_email': 35,        // Email marketing possible  
  'con_edad': 50,         // Demographic targeting
  'con_region': 65,       // Geographic targeting
  'completo': 100         // Full lead value
};

const currentValue = leadValue['{{abandonment_point}}'] || 0;
console.log(`Valor actual del lead: ${currentValue}% del potencial máximo`);
```

### ROI de Recovery
- **Cost to acquire**: $X USD (costo de adquisición original)
- **Recovery cost**: $Y USD (costo de re-engagement)  
- **Potential value**: $Z USD (valor si convierte)
- **Recovery ROI**: (Z - Y) / Y * 100%

### Segmentación para Follow-up
- **Inmediato** (< 1 hora): Abandono técnico, alta probabilidad
- **Corto plazo** (1-7 días): Abandono con datos, remarketing  
- **Largo plazo** (7-30 días): Abandono temprano, nurturing campaign

## 📋 OUTPUT FINAL

### Journey Summary
```
👤 Usuario: {{user_whatsapp}}
🕐 Duración: XX minutos  
📊 Completitud: XX%
🎯 Abandono: {{abandonment_point}}
💰 Valor actual: XX% de potencial
🚀 Estrategia: [Immediate/Short-term/Long-term]
```

### Action Items Priorizados
1. **P0 (Inmediato)**: Fix técnico si hay error
2. **P1 (Esta semana)**: Setup follow-up sequence  
3. **P2 (Próximo sprint)**: UX optimization para punto de fricción

### Aprendizajes para Producto
- ¿Este patrón se repite en otros usuarios?
- ¿El abandono indica problema sistémico?
- ¿Necesitamos A/B test en este paso?
- ¿El mensaje es claro para el demografo objetivo?

---

**Este análisis proporciona insights accionables para mejorar tanto la experiencia individual como el sistema general de UNIACC ChatBot.**