# UNIACC ChatBot Testing System

> Sistema completo de testing automatizado para el Progressive Capture System

## 📋 Descripción General

Este sistema de testing permite validar automáticamente todos los flujos críticos del ChatBot UNIACC, incluyendo el sistema de captura progresiva, reconocimiento de usuarios, prevención de duplicados, y manejo de errores.

## 🏗️ Estructura del Sistema

```
.claude/templates/
├── test-scenarios/           # Escenarios de testing en JSON
│   ├── progressive-capture-complete.json
│   ├── abandono-con-email.json
│   ├── returning-user-recognition.json
│   ├── anti-duplicates-validation.json
│   └── asesor-urgente-flow.json
├── scripts/
│   └── test-runner.js        # Motor de ejecución de tests
├── prompts/                  # Prompts para análisis
├── reports/                  # Reportes generados
└── commands/
    └── run-test-scenario.md  # Documentación de comandos
```

## 🚀 Comandos Disponibles

### Comandos de Testing Individual
```bash
# Ejecutar un escenario específico
npm run test-progressive-capture    # Test completo de captura progresiva
npm run test-abandono-email        # Test de abandono con email
npm run test-returning-user         # Test de reconocimiento de usuarios
npm run test-anti-duplicates        # Test del sistema anti-duplicados
npm run test-asesor-urgente         # Test del flujo de asesor urgente
```

### Comandos de Testing Masivo
```bash
# Ejecutar todos los escenarios
npm run test-all-scenarios

# Ejecutar con verificación previa de servicios
npm run test-with-services

# Comando principal (equivalente a run-test-scenario)
npm run run-test-scenario
```

## 📊 Escenarios de Testing

### 1. Progressive Capture Complete
**Archivo:** `progressive-capture-complete.json`
**Propósito:** Valida el flujo completo de captura progresiva sin abandonos

**Validaciones Clave:**
- ✅ Cada campo se guarda inmediatamente en BD
- ✅ Estado evoluciona: `captura en proceso` → `captura completa`  
- ✅ Zero data loss
- ✅ Usuario llega al menú principal

**Flujo Testeado:**
```
Hola → Nombre → Email → Edad → Región → Teléfono → Menú Principal
```

### 2. Abandono con Email
**Archivo:** `abandono-con-email.json`
**Propósito:** Valida el manejo de abandonos parciales

**Validaciones Clave:**
- ✅ Datos parciales se conservan en BD
- ✅ `tipo_consulta` = `abandono con email`
- ✅ Campos no capturados permanecen `null`
- ✅ Prospecto disponible para follow-up

### 3. Returning User Recognition
**Archivo:** `returning-user-recognition.json`
**Propósito:** Valida el sistema de reconocimiento automático

**Validaciones Clave:**
- ✅ Usuario reconocido automáticamente por WhatsApp
- ✅ RPC `get_usuario_recurrente()` funcional
- ✅ Menú contextual con historial
- ✅ No se solicitan datos básicos nuevamente

### 4. Anti-Duplicates Validation
**Archivo:** `anti-duplicates-validation.json`
**Propósito:** Valida que no se crean prospectos duplicados

**Validaciones Clave:**
- ✅ Solo 1 prospecto por WhatsApp
- ✅ Múltiples flujos actualizan mismo prospecto
- ✅ RPC anti-duplicados funcional
- ✅ Reset de estado entre consultas

### 5. Asesor Urgente Flow
**Archivo:** `asesor-urgente-flow.json`
**Propósito:** Valida el flujo crítico de solicitud de asesor

**Validaciones Clave:**
- ✅ `nivel_interes` = `urgente`
- ✅ `tipo_consulta` = `solicitud de asesor`
- ✅ Webhook enviado al dashboard
- ✅ Dashboard muestra prioridad visual

## 🛠️ Configuración y Uso

### Pre-requisitos
1. **Servicios activos:**
   - ChatBot: http://localhost:3001
   - Dashboard: http://localhost:3000  
   - API: http://localhost:3002

2. **Base de datos Supabase** configurada y accesible

### Iniciando los Tests

1. **Verificar servicios:**
```bash
cd .claude
npm run check-services
```

2. **Ejecutar test específico:**
```bash
npm run test-progressive-capture
```

3. **Ejecutar todos los tests:**
```bash
npm run test-with-services
```

## 📈 Interpretando Resultados

### Reporte de Resultados
```
📊 RESULTADOS DE TESTING UNIACC CHATBOT
========================================
📈 Tests totales: 5
✅ Exitosos: 4
❌ Fallidos: 1
📊 Tasa de éxito: 80.00%

📝 DETALLES POR ESCENARIO:
  ✅ progressive-capture-complete: 3456ms
  ✅ abandono-con-email: 2123ms
  ❌ returning-user-recognition: 5678ms
     • RPC function timeout after 5000ms
  ✅ anti-duplicates-validation: 4321ms
  ✅ asesor-urgente-flow: 2987ms
```

### Estados de Pasos
- ✅ **Éxito:** El paso se ejecutó correctamente y cumple todas las validaciones
- ❌ **Fallo:** El paso falló en validaciones críticas
- ⚠️ **Advertencia:** El paso se ejecutó pero tiene advertencias menores

## 🔧 Personalización de Tests

### Crear Nuevo Escenario

1. **Crear archivo JSON** en `test-scenarios/`
```json
{
  "name": "Mi Nuevo Test",
  "description": "Descripción del test",
  "scenario": {
    "whatsapp": "56912345999",
    "steps": [
      {
        "step": 1,
        "action": "send_message",
        "message": "hola",
        "expected_response_contains": ["¡Hola!"],
        "expected_state": "captura_inicial/solicitar_nombre",
        "critical": true
      }
    ]
  }
}
```

2. **Agregar comando** en `package.json`
```json
"test-mi-nuevo-test": "node templates/scripts/test-runner.js mi-nuevo-test"
```

### Acciones Disponibles

- **`send_message`**: Envía mensaje y valida respuesta
- **`simulate_timeout`**: Simula timeout de usuario  
- **`verify_database_update`**: Verifica cambios en BD
- **`complete_full_capture`**: Completa captura automáticamente
- **`verify_webhook_call`**: Valida llamadas webhook

### Validaciones Disponibles

- **`expected_response_contains`**: Texto que debe contener la respuesta
- **`expected_response`**: Respuesta exacta esperada
- **`expected_state`**: Estado interno esperado del bot
- **`database_check`**: Validaciones de base de datos
- **`critical`**: Si falla, para la ejecución del test

## 🐛 Debugging y Troubleshooting

### Logs de Debugging
Los tests generan logs detallados en:
- Consola durante ejecución
- Archivos de log del sistema existente
- Reportes JSON estructurados

### Problemas Comunes

**🔴 Servicios no disponibles**
```
❌ ChatBot no está disponible: http://localhost:3001/health
```
**Solución:** Iniciar servicios con `npm run dev:full` en dashboard

**🔴 Timeout en RPC functions**
```
RPC function timeout after 5000ms
```
**Solución:** Verificar conectividad con Supabase

**🔴 Validación de respuesta falló**
```
⚠️ Respuesta no contiene: "¡Hola!"
```
**Solución:** Verificar lógica de respuestas en `uniacc-scripts.ts`

### Debug Mode
Para más detalles, modificar `testTimeout` y `stepTimeout` en el test runner.

## 📚 Integration con Desarrollo

### Uso con Claude Code
```bash
# Comando principal desde claude-code
/run-test-scenario

# Análisis post-test
npm run analyze-errors
npm run debug-logs
```

### CI/CD Integration
Los tests pueden integrarse en pipelines:
```bash
npm run test-with-services
echo "Exit code: $?"
```

### Reportes Automáticos
Los resultados se pueden exportar como JSON para análisis posterior o integración con sistemas de monitoreo.

---

## 📞 Soporte

Para problemas con el sistema de testing, verificar:
1. Estado de servicios con `npm run check-services`
2. Logs recientes con `npm run debug-logs`  
3. Contexto actualizado con `npm run init`

**Maintainer:** Juan Pablo Silva  
**Proyecto:** UNIACC ChatBot Progressive Capture System  
**Versión:** 1.0.0