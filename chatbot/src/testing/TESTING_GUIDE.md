# 🧪 Guía Completa de Testing - Chatbot UNIACC

## 🎯 Sistema de Testing Independiente

Este sistema de testing está diseñado para funcionar **completamente en paralelo** sin modificar el código del chatbot existente. Permite manejar **múltiples conexiones concurrentes** y simular carga real de usuarios.

## 🚀 Inicio Rápido

### Instalación de Dependencias
```bash
npm install
```

### Comandos Básicos
```bash
# Test básico de flujos
npm run test

# Demo completo del sistema
npm run test:demo

# Testing interactivo
npm run test:flows:interactive

# Stress testing
npm run test:stress

# Pipeline completo con monitoreo
npm run test:pipeline
```

## 📊 Tipos de Testing Disponibles

### 1. **Testing de Flujos Conversacionales**
Simula conversaciones completas usuario-bot:

```bash
# Ejecutar tests de flujos específicos
npm run test:flows

# Tests de captura inicial
npm run test:demo:basic

# Testing interactivo para debugging
npm run test:flows:interactive
```

**Ejemplo de uso:**
```typescript
import { FlowTester } from './framework/flow-tester'

const tester = new FlowTester()
const result = await tester.runFlowTest(capturaInicialTest)
```

### 2. **Stress Testing - Conexiones Concurrentes**
Simula múltiples usuarios simultáneos:

```bash
# Stress test básico
npm run test:stress

# Demo de stress testing
npm run test:demo:stress

# Testing de carga incremental
npm run test:load
```

**Configuración de stress test:**
```typescript
const config: StressTestConfig = {
  concurrentUsers: 50,        // 50 usuarios simultáneos
  messagesPerUser: 5,         // 5 mensajes por usuario
  duration: 60000,            // 1 minuto de duración
  rampUpTime: 10000,          // 10s para alcanzar max usuarios
  rampDownTime: 5000,         // 5s para finalizar
  targetThroughput: 100       // 100 mensajes/segundo objetivo
}
```

### 3. **Testing Concurrente**
Maneja múltiples sesiones en paralelo:

```bash
# Demo de concurrencia
npm run test:demo:concurrent

# Comparación de performance
npm run test:performance
```

### 4. **Monitoreo en Tiempo Real**
Sistema de métricas avanzado:

```bash
# Pipeline con monitoreo habilitado
npm run test:pipeline

# Ver métricas en tiempo real
SHOW_METRICS=true npm run test:stress
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Habilitar debugging
DEBUG_TESTS=true

# Mostrar métricas en tiempo real
SHOW_METRICS=true

# Modo de testing
NODE_ENV=test

# Configuración de performance
TEST_SIMULATE_DELAYS=false
TEST_ERROR_RATE=0
```

### Configuración de Concurrencia
```typescript
const config = {
  mode: 'parallel',           // sequential | parallel | stress | load | full
  maxConcurrency: 10,         // Máximo tests en paralelo
  enableMonitoring: true,     // Habilitar métricas
  exportResults: true,        // Exportar resultados
  timeout: 30000             // Timeout por test
}
```

## 📈 Métricas y Reportes

### Métricas de Performance
- **Throughput**: Mensajes por segundo
- **Tiempo de respuesta**: Promedio, P95, P99
- **Uso de memoria**: Heap, RSS, total del sistema
- **CPU**: Porcentaje de uso y load average
- **Tasa de error**: Porcentaje de fallos
- **Concurrencia**: Usuarios simultáneos activos

### Reportes Automáticos
Los resultados se exportan automáticamente en:
- `test-results-{mode}-{timestamp}.json` - Datos completos
- `test-results-{mode}-{timestamp}-summary.txt` - Resumen legible

### Alertas Automáticas
El sistema genera alertas cuando:
- Uso de memoria > 80%
- Tiempo de respuesta > 2 segundos
- Tasa de error > 5%
- Uso de CPU > 80%

## 🎯 Casos de Uso Específicos

### 1. Testing de Desarrollo
```bash
# Testing rápido durante desarrollo
npm run test:demo:basic

# Testing interactivo para debugging
npm run test:flows:interactive
```

### 2. Testing de CI/CD
```bash
# Suite completa automatizada
npm run test

# Testing con cobertura
npm run test:coverage
```

### 3. Testing de Capacidad
```bash
# Encontrar límites del sistema
npm run test:load

# Stress test personalizado
npm run test:stress
```

### 4. Testing de Producción
```bash
# Pipeline completo con monitoreo
npm run test:pipeline

# Comparación de performance
npm run test:performance
```

## 💡 Ejemplos Prácticos

### Ejemplo 1: Test Simple de Flujo
```typescript
const testCase: FlowTestCase = {
  id: 'captura-completa',
  name: 'Captura Completa de Usuario',
  steps: [
    {
      stepNumber: 1,
      userMessage: 'Hola',
      expectedResponse: { contains: ['teléfono', 'confirmar'] }
    },
    {
      stepNumber: 2,
      userMessage: '1',
      expectedResponse: { contains: ['nombre'] },
      customAssertions: ['should_have_prospecto_id']
    }
  ]
}
```

### Ejemplo 2: Stress Test
```typescript
const stressRunner = new StressTestRunner()
const result = await stressRunner.runStressTest(testCase, {
  concurrentUsers: 20,
  messagesPerUser: 3,
  duration: 15000
})
```

### Ejemplo 3: Monitoreo en Tiempo Real
```typescript
const monitor = new PerformanceMonitor()
monitor.start()
monitor.startConsoleDisplay() // Muestra métricas en vivo

// Ejecutar tests...

monitor.stop()
const report = monitor.generateReport()
```

## 🔍 Debugging y Troubleshooting

### Debugging de Tests
```bash
# Ejecutar con debugging habilitado
DEBUG_TESTS=true npm run test:flows:interactive

# Ver logs detallados
npm run test:demo:basic
```

### Análisis de Performance
```bash
# Generar reporte detallado
npm run test:pipeline

# Exportar métricas para análisis
npm run test:stress
```

### Troubleshooting Común

1. **Tests lentos**: Reducir `maxConcurrency` o habilitar `simulateNetworkDelay: false`
2. **Errores de memoria**: Ajustar `maxConcurrency` y verificar memory leaks
3. **Timeouts**: Aumentar `timeout` en configuración de test
4. **Fallos aleatorios**: Revisar condiciones de carrera en tests concurrentes

## 📊 Benchmarks y Límites

### Performance Esperada (Hardware Moderno)
- **Throughput**: 200-500 mensajes/segundo
- **Tiempo de respuesta**: < 100ms promedio
- **Concurrencia**: 50-100 usuarios simultáneos
- **Memoria**: < 500MB para 100 usuarios
- **CPU**: < 60% con carga completa

### Límites del Sistema
- **Máximos recomendados**: 100 usuarios concurrentes
- **Duración máxima**: 5 minutos por stress test
- **Memoria límite**: 2GB total del proceso
- **Timeout máximo**: 30 segundos por test

## 🎯 Roadmap y Mejoras Futuras

### Próximas Funcionalidades
- [ ] Dashboard web en tiempo real
- [ ] Integración con CI/CD específica
- [ ] Tests de regresión automática
- [ ] Análisis predictivo de performance
- [ ] Testing de diferentes dispositivos
- [ ] Simulación de red lenta/inestable

### Optimizaciones Planificadas
- [ ] Paralelización mejorada
- [ ] Caché de resultados
- [ ] Compresión de reportes
- [ ] Optimización de memoria

## 📞 Soporte y Contribución

Para reportar issues o sugerir mejoras:
1. Revisar los logs de debugging
2. Ejecutar `npm run test:demo` para verificar setup
3. Generar reporte con `npm run test:pipeline`
4. Incluir métricas de sistema y configuración

---

**🎓 Sistema desarrollado para garantizar la calidad y escalabilidad del Chatbot UNIACC**
