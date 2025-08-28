---
name: project-status
description: Estado completo del proyecto UNIACC ChatBot con verificación de servicios, logs recientes y debugging de múltiples consultas
---

Eres un especialista en el proyecto UNIACC ChatBot System en fase de testing. Al ejecutar este comando:

## PASO 1: CARGAR CONTEXTO ACTUAL
```bash
node .claude/claude-init.js
```

## PASO 2: VERIFICAR SERVICIOS ESPECÍFICOS UNIACC
```bash
curl -s http://localhost:3001/health || echo "❌ ChatBot Backend (3001) - NO DISPONIBLE"
curl -s http://localhost:3002/health || echo "❌ Dashboard API (3002) - NO DISPONIBLE" 
curl -s http://localhost:3000 -I || echo "❌ Dashboard Frontend (3000) - NO DISPONIBLE"
```

## PASO 3: VERIFICAR ESTADO DE TESTING (LOGS DINÁMICOS)
```bash
echo "=== LOGS RECIENTES CHATBOT ==="
tail -10 .claude/log_chatbot.txt
echo "=== LOGS RECIENTES DASHBOARD/API ==="
tail -10 .claude/log_dashboard_api.txt
```

## PASO 4: REPORTE DE PROGRESO
```bash
node .claude/update-context.js --report
```

## ANÁLISIS ESPECÍFICO UNIACC:

### Estado de Servicios Críticos
- Verificar que los 3 microservicios estén corriendo
- Confirmar webhook `/api/botpress-webhook` operativo
- Validar conectividad con Supabase PostgreSQL

### Fase de Testing Actual - Sistema de Múltiples Consultas
**Funcionalidades en Testing:**
- Reconocimiento automático de usuarios recurrentes
- Sistema anti-duplicados funcionando
- Guardado correcto de región y facultad_interes
- Menú contextual con historial

### URLs de Testing Prioritarias
- **Chat Demo**: http://localhost:3001/chat (PRINCIPAL PARA DEBUGGING)
- **Dashboard**: http://localhost:3000 (Verificar prospectos)
- **Supabase**: Tablas prospectos, conversaciones, mensajes

### Debugging de Issues Conocidos
Revisar en logs dinámicos:
- **Guardado de región**: ¿Se está guardando correctamente?
- **Guardado de facultad_interes**: ¿Mapeo de IDs funcionando?
- **Errores de fetch**: ¿Dashboard conectando con API?
- **RPC functions**: ¿get_usuario_recurrente() operativa?

### Testing de 5 Escenarios Críticos
1. **Primera consulta completa** - Usuario nuevo con datos
2. **Segunda consulta mismo usuario** - Reconocimiento automático
3. **Flujo de asesor** - Prioridad urgente asignada
4. **Exploración de carreras** - Mapeo correcto de facultades
5. **Costos y becas** - Clasificación automática

### Comandos de Debugging Específicos
```bash
# Verificar logs recientes
npm run debug-logs

# Buscar errores específicos
npm run analyze-errors

# Probar chat demo
npm run test-chat

# Verificar dashboard
npm run test-dashboard

# Estado completo
npm run pre-testing
```

### Métricas del Sistema Anti-Duplicados
- Verificar que cada flujo genere exactamente 1 prospecto
- Confirmar reset automático post-guardado
- Validar mensaje "Escribe 'Hola' para nueva consulta"
- Comprobar reconocimiento de usuarios en segunda consulta

### Análisis de Base de Datos
```bash
# Verificar schema actual
head -50 .claude/supabase_config_actual.sql

# Buscar constraints críticos
grep -i "constraint.*check" .claude/supabase_config_actual.sql
```

**Formato de salida**: Estructurado con estado de cada componente, análisis de logs recientes, identificación de issues, y recomendaciones específicas para debugging del sistema de múltiples consultas.