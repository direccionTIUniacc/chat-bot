# 🧪 Sistema de Testing Automatizado - Chatbot UNIACC

## 📁 Estructura del Testing

```
src/testing/
├── README.md                 # Este archivo
├── config/                   # Configuración de testing
│   ├── jest.config.ts       # Configuración Jest específica
│   └── test-environment.ts  # Variables de entorno para tests
├── framework/                # Framework core de testing
│   ├── test-runner.ts       # Ejecutor principal de tests
│   ├── flow-tester.ts       # Tester específico para flujos
│   ├── assertion-engine.ts  # Motor de aserciones
│   └── reporter.ts          # Generador de reportes
├── mocks/                    # Mocks y simulaciones
│   ├── mock-bot.ts          # Bot simulado para testing
│   ├── mock-supabase.ts     # Supabase simulado
│   └── mock-webhooks.ts     # Webhooks simulados
├── types/                    # Tipos específicos para testing
│   ├── test-types.ts        # Interfaces y tipos de test
│   └── flow-types.ts        # Tipos específicos de flujos
├── fixtures/                 # Datos de prueba y casos de test
│   ├── flow-test-cases/     # Casos de prueba por flujo
│   │   ├── captura-inicial.ts
│   │   ├── menu-principal.ts
│   │   ├── exploracion-carreras.ts
│   │   ├── detalle-carrera.ts
│   │   ├── proceso-admision.ts
│   │   ├── busqueda-directa.ts
│   │   ├── costos-becas.ts
│   │   ├── modalidades.ts
│   │   ├── advisor-connection.ts
│   │   └── menu-contextual.ts
│   ├── mock-data.ts         # Datos mock para pruebas
│   └── test-scenarios.ts    # Escenarios completos de test
├── utils/                    # Utilidades de testing
│   ├── test-helpers.ts      # Funciones helper
│   ├── data-generators.ts   # Generadores de datos de prueba
│   └── validation-utils.ts  # Utilidades de validación
└── runners/                  # Ejecutores especializados
    ├── flow-runner.ts       # Ejecutor de flujos específicos
    ├── integration-runner.ts # Ejecutor de tests de integración
    ├── stress-runner.ts     # Ejecutor de tests de estrés
    └── interactive-runner.ts # Ejecutor interactivo para debugging
```

## 🚀 Comandos de Testing

### Comandos Básicos
```bash
npm run test                    # Ejecutar todos los tests
npm run test:watch              # Ejecutar tests en modo watch
npm run test:coverage           # Ejecutar con coverage
```

### Comandos Específicos
```bash
npm run test:flows              # Solo tests de flujos
npm run test:integration        # Solo tests de integración
npm run test:unit               # Solo tests unitarios
```

### Comandos Avanzados
```bash
npm run test:flows:interactive  # Ejecutor interactivo de flujos
npm run test:flows:report       # Generar reporte detallado
npm run test:stress             # Tests de estrés y performance
```

## 🎯 Tipos de Testing

### 1. **Flow Testing** - Pruebas de Flujos Conversacionales
- Simula conversaciones completas usuario-bot
- Verifica transiciones de estado correctas
- Valida respuestas contextuales
- Comprueba guardado de datos

### 2. **Integration Testing** - Pruebas de Integración
- Testing con Supabase real/mock
- Verificación de webhooks
- Pruebas de timeout y reconexión
- Validación de persistencia de datos

### 3. **Unit Testing** - Pruebas Unitarias
- Funciones individuales del bot
- Validadores y formateadores
- Utilidades y helpers
- Lógica de negocio aislada

### 4. **Stress Testing** - Pruebas de Estrés
- Múltiples usuarios simultáneos
- Timeouts y reconexiones
- Memoria y performance
- Límites del sistema

## 📊 Métricas y Reportes

### Cobertura de Flujos
- ✅ Captura Inicial (Usuario Nuevo)
- ✅ Menú Principal (6 opciones)
- ✅ Exploración Carreras (5 facultades)
- ✅ Detalle Carrera (4 acciones)
- ✅ Proceso Admisión
- ✅ Búsqueda Directa
- ✅ Costos y Becas
- ✅ Modalidades de Estudio
- ✅ Advisor Connection
- ✅ Menú Contextual (Usuarios Recurrentes)

### Métricas de Performance
- Tiempo promedio de respuesta
- Memoria utilizada por sesión
- Throughput de mensajes/segundo
- Tasa de éxito en guardado de datos

## 🔧 Configuración Avanzada

### Variables de Entorno para Testing
```bash
NODE_ENV=test
TEST_SUPABASE_URL=mock
TEST_WEBHOOK_URL=mock
TEST_ENABLE_LOGGING=false
TEST_SIMULATE_DELAYS=false
TEST_ERROR_RATE=0
```

### Configuración de Mocks
- **Supabase Mock**: Simula BD sin conexión real
- **Webhook Mock**: Intercepta llamadas HTTP
- **Timer Mock**: Control total sobre timeouts
- **Logger Mock**: Captura logs para verificación

## 📝 Ejemplo de Uso

```typescript
import { FlowTester } from './framework/flow-tester'
import { capturaInicialTests } from './fixtures/flow-test-cases/captura-inicial'

// Ejecutar un flujo específico
const tester = new FlowTester()
const results = await tester.runFlowTest(capturaInicialTests.usuarioNuevo)

// Generar reporte
const report = tester.generateReport(results)
console.log(report)
```

## 🎯 Objetivos del Testing

1. **Cobertura 100%** de todos los flujos conversacionales
2. **Validación automática** de respuestas y estados
3. **Detección temprana** de regresiones
4. **Performance benchmarking** para optimización
5. **Documentación viva** de comportamientos esperados

---

*Sistema diseñado para garantizar la calidad y confiabilidad del chatbot UNIACC* 🎓
