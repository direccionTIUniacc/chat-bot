# 🧪 **PLAN DE TESTING - Sistema de Múltiples Consultas UNIACC**

**Autor:** Juan Pablo Silva feat Claude AI  
**Versión:** 2.1 - Sistema de Reconocimiento de Usuarios  
**Fecha:** Agosto 2025  
**Objetivo:** Validar funcionamiento completo del sistema anti-duplicados y múltiples consultas

---

## 🎯 **INFORMACIÓN GENERAL**

### **📱 URLs de Testing:**
- **ChatBot Demo:** http://localhost:3001/chat
- **Dashboard Admin:** http://localhost:3000
- **API Server:** http://localhost:3002/health
- **Bot Stats:** http://localhost:3001/stats

### **⚙️ Prerequisitos:**
```bash
# Asegurar que todos los servicios estén funcionando
cd chatbot && npm run dev                    # Puerto 3001
cd dashboard && npm run dev:full             # Puerto 3000 + 3002
```

### **🎯 Objetivos del Testing:**
1. ✅ Verificar reconocimiento automático de usuarios
2. ✅ Validar menú contextual personalizado
3. ✅ Confirmar datos pre-cargados en consultas recurrentes
4. ✅ Probar sistema anti-duplicados mejorado
5. ✅ Verificar optimizaciones de base de datos

---

## 👤 **ESCENARIO 1: Juan Pérez - Exploración de Carreras**

### **🔄 SESIÓN 1: Primera Consulta (Usuario Nuevo)**

**🎯 Objetivo:** Probar flujo completo de exploración con guardado

**📋 PASOS DETALLADOS:**

1. **Abrir navegador en modo incógnito**
2. **Navegar a:** http://localhost:3001/chat
3. **Escribir:** `Hola`

4. **Captura Inicial - Completar todos los campos:**
   ```
   👤 Nombre: Juan Pérez
   📧 Email: juan.perez@gmail.com
   🎂 Edad: 22
   📍 Región: 7 (Metropolitana)
   📱 Teléfono: 987654321
   ```

5. **Flujo de Exploración:**
   ```
   Menú Principal → 1 (Conocer carreras)
   Facultades → D (Ciencias Jurídicas y Sociales)  
   Carreras → 1 (Derecho)
   Detalle → 1 (Me interesa, quiero más información)
   ```

**✅ RESULTADOS ESPERADOS:**

- [x] **Captura inicial completa sin errores**
- [x] **Navegación fluida por facultades y carreras**
- [x] **Guardado exitoso del prospecto**
- [x] **Mensaje de finalización:** "Escribe 'Hola' para comenzar con una nueva consulta"
- [x] **Dashboard muestra:** Juan Pérez, Derecho, Nivel Alto

**🔍 Verificación en Dashboard:**
1. Ir a http://localhost:3000
2. Verificar 1 prospecto nuevo: Juan Pérez
3. Confirmar: `carrera_interes: "Derecho"`, `tipo_consulta: "consulta carrera"`

---

### **🎯 SESIÓN 2: Segunda Consulta (Reconocimiento Automático)**

**🎯 Objetivo:** Validar reconocimiento y menú contextual

**📋 PASOS DETALLADOS:**

**⏰ Esperar 2 minutos después de la SESIÓN 1**

1. **En la misma ventana del chat, escribir:** `Hola`

**✅ RESULTADO ESPERADO - Reconocimiento:**
```
🎓 ¡Buenos días Juan! Te reconozco.

📚 Última consulta: Derecho

🌟 ¿En qué puedo ayudarte hoy?

1️⃣ Más info sobre Derecho
2️⃣ Ver carreras similares  
3️⃣ Proceso de admisión
4️⃣ Costos y becas
5️⃣ Hablar con un asesor
6️⃣ Consulta completamente nueva

Escribe el número de tu opción 📝
```

2. **Seleccionar:** `2` (Ver carreras similares)

**✅ RESULTADO ESPERADO:**
- [x] **Sin solicitar datos nuevamente**
- [x] **Muestra carreras similares a Derecho**
- [x] **Funciona directamente con datos pre-cargados**

3. **Seleccionar cualquier carrera similar, después elegir:** `1` (Me interesa)

**✅ RESULTADO ESPERADO:**
- [x] **Se guarda segundo prospecto o actualiza existente**
- [x] **Dashboard muestra actividad reciente**

4. **Escribir:** `Hola` nuevamente
5. **Seleccionar:** `6` (Consulta completamente nueva)

**✅ RESULTADO ESPERADO:**
```
🎓 ¡Perfecto! Empecemos de nuevo.

👤 ¿Cuál es tu nombre completo?
```

**🔍 Verificaciones:**
- [x] **Reinicio completo exitoso**
- [x] **Sistema olvida contexto anterior**
- [x] **Vuelve a solicitar datos desde cero**

---

## 👤 **ESCENARIO 2: María González - Solicitud Urgente de Asesor**

### **🔄 SESIÓN 1: Primera Consulta (Prospecto Urgente)**

**🎯 Objetivo:** Probar clasificación automática de urgencia

**📋 PASOS DETALLADOS:**

1. **Abrir nueva ventana incógnito**
2. **Navegar a:** http://localhost:3001/chat  
3. **Escribir:** `Hola`

4. **Captura Inicial:**
   ```
   👤 Nombre: María González  
   📧 Email: maria.gonzalez@outlook.com
   🎂 Edad: 25
   📍 Región: 6 (Valparaíso)
   📱 Teléfono: 956123456
   ```

5. **Flujo de Asesor:**
   ```
   Menú Principal → 5 (Hablar con un asesor)
   ```

**✅ RESULTADOS ESPERADOS:**

- [x] **Guardado INMEDIATO del prospecto**
- [x] **Clasificación:** `nivel_interes: "urgente"`
- [x] **Mensaje:** "Un asesor especializado te contactará en las próximas 24 horas"
- [x] **Dashboard muestra badge "URGENTE" en rojo**

**🔍 Verificación Dashboard:**
1. Prospecto María González visible
2. Badge o indicador visual de urgencia
3. `tipo_consulta: "solicitud de asesor"`

---

### **🎯 SESIÓN 2: Consulta de Seguimiento**

**🎯 Objetivo:** Verificar manejo de usuarios con solicitud pendiente

**📋 PASOS:**

**⏰ Al día siguiente o después de 1 hora**

1. **En la misma ventana, escribir:** `Hola`

**✅ RESULTADO ESPERADO:**
```  
🎓 ¡Buenos días María! Te reconozco.

👨‍💼 Estado: Un asesor se pondrá en contacto contigo pronto.

🌟 ¿En qué puedo ayudarte hoy?

1️⃣ Explorar carreras
2️⃣ Proceso de admisión 2025
3️⃣ Costos y becas  
4️⃣ Modalidades de estudio
5️⃣ Hablar con un asesor
6️⃣ Búsqueda directa de carrera
```

2. **Seleccionar:** `3` (Costos y becas)

**✅ RESULTADO ESPERADO:**
- [x] **Información mostrada sin solicitar datos**
- [x] **Opciones post-información disponibles**
- [x] **Flujo continúa normalmente**

---

## 👤 **ESCENARIO 3: Carlos Silva - Shortcut Búsqueda Directa**

### **🔄 SESIÓN 1: Flujo Optimizado**

**🎯 Objetivo:** Probar nueva funcionalidad de búsqueda directa

**📋 PASOS DETALLADOS:**

1. **Nueva ventana incógnito:** http://localhost:3001/chat
2. **Completar captura inicial:**
   ```
   👤 Nombre: Carlos Silva
   📧 Email: carlos.silva@gmail.com  
   🎂 Edad: 20
   📍 Región: 8 (Biobío)
   📱 Teléfono: 912345678
   ```

3. **Flujo Shortcut:**
   ```
   Menú Principal → 6 (Ya sé qué carrera quiero)
   Escribir: "Psicología"
   Detalle → 1 (Me interesa, quiero más información)
   ```

**✅ RESULTADOS ESPERADOS:**

- [x] **Encuentra Psicología directamente**
- [x] **Menos pasos que exploración tradicional (3 vs 5 pasos)**
- [x] **Guardado con `carrera_interes: "Psicología"`**
- [x] **Flujo más eficiente**

**📊 Comparación de Pasos:**
- **Exploración tradicional:** Menú → Facultad → Lista → Detalle → Acción (5 pasos)
- **Búsqueda directa:** Menú → Nombre → Detalle → Acción (4 pasos) ✅

---

### **🎯 SESIÓN 2: Menú Contextual con Historial**

**📋 PASOS:**

1. **Escribir:** `Hola`

**✅ RESULTADO ESPERADO:**
```
🎓 ¡Buenas tardes Carlos! Te reconozco.

📚 Última consulta: Psicología

🌟 ¿En qué puedo ayudarte hoy?

1️⃣ Más info sobre Psicología
2️⃣ Ver carreras similares
3️⃣ Proceso de admisión  
4️⃣ Costos y becas
5️⃣ Hablar con un asesor
6️⃣ Consulta completamente nueva
```

2. **Seleccionar:** `2` (Ver carreras similares)

**✅ RESULTADO ESPERADO:**
- [x] **Lista de carreras similares a Psicología**
- [x] **Ej: Psicopedagogía, Terapia Ocupacional, etc.**
- [x] **Selección por números**

---

## 👤 **ESCENARIO 4: Ana Torres - Usuario Límite Temporal**

### **🔄 Testing de Límites de Reconocimiento**

**🎯 Objetivo:** Verificar límite de 30 días para reconocimiento

**📋 PREPARACIÓN:**
```sql
-- Opcional: Crear prospecto con fecha antigua en BD
INSERT INTO prospectos (nombre, email, whatsapp, created_at, carrera_interes) 
VALUES ('Ana Torres', 'ana@gmail.com', '987000000', NOW() - INTERVAL '35 days', 'Arquitectura');
```

**📋 PASOS:**

1. **Nueva ventana:** http://localhost:3001/chat  
2. **Simular WhatsApp:** `987000000` (modificar código temporalmente o usar BD)
3. **Escribir:** `Hola`

**✅ RESULTADO ESPERADO:**
- [x] **Si > 30 días:** Tratado como usuario nuevo (solicita captura completa)
- [x] **Si < 30 días:** Reconocimiento normal con menú contextual

---

## 🧪 **ESCENARIO 5: Casos Edge y Validaciones**

### **🔍 CASO 1: Búsqueda Sin Resultados**

**📋 PASOS:**
1. Usuario completa captura inicial
2. Menú → `6` (Ya sé qué carrera quiero)  
3. Escribir: `"Medicina"` (no existe en UNIACC)

**✅ RESULTADO ESPERADO:**
```
❌ No encontré "Medicina" en nuestras carreras

🔄 ¿Qué te gustaría hacer?

1️⃣ Ver todas las carreras por facultad
2️⃣ Hablar con un asesor  
3️⃣ Intentar con otro nombre

Escribe el número (1, 2 o 3):
```

### **🔍 CASO 2: Caracteres Especiales**

**📋 PASOS:**
1. Nombre con acentos: `José María Ñuñez-Pérez`
2. WhatsApp con +: `+56987654321`
3. Email con subdominios: `usuario@empresa.com.cl`

**✅ RESULTADO ESPERADO:**
- [x] **Manejo correcto de caracteres especiales**
- [x] **Validaciones funcionan apropiadamente**

### **🔍 CASO 3: Abandono de Flujo**

**📋 PASOS:**
1. Usuario completa captura inicial
2. Inicia exploración pero NO termina flujo
3. Regresa después y escribe `Hola`

**✅ RESULTADO ESPERADO:**
- [x] **Se reconoce porque tiene datos básicos**  
- [x] **Menú contextual genérico (sin carrera específica)**
- [x] **No se guardó prospecto porque no completó flujo**

---

## 📊 **VERIFICACIONES EN DASHBOARD**

### **🔍 PANEL PRINCIPAL - http://localhost:3000**

**✅ VERIFICAR Lista de Prospectos:**

| Nombre | Carrera | Tipo Consulta | Nivel | Badge/Indicador |
|--------|---------|---------------|-------|-----------------|
| Juan Pérez | Derecho | consulta carrera | alto | - |
| María González | - | solicitud de asesor | **urgente** | 🚨 URGENTE |  
| Carlos Silva | Psicología | consulta carrera | alto | - |

**✅ VERIFICAR Filtros Funcionando:**
- [x] **Filtro por tipo de consulta**
- [x] **Filtro por nivel de interés**  
- [x] **Ordenamiento por fecha**
- [x] **Búsqueda por nombre**

**✅ VERIFICAR Conversaciones:**
- [x] **Cada usuario tiene su conversación**
- [x] **Mensajes guardados correctamente**  
- [x] **Historial completo visible**

---

## 🔧 **TESTING TÉCNICO - APIs**

### **📡 ENDPOINT 1: Consulta de Reconocimiento**

```bash
# Verificar que el endpoint retorna usuarios existentes
curl "http://localhost:3002/api/prospectos?whatsapp=987654321"
```

**✅ RESPUESTA ESPERADA:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "nombre": "Juan Pérez",
      "email": "juan.perez@gmail.com",
      "carrera_interes": "Derecho",
      "tipo_consulta": "consulta carrera", 
      "created_at": "2025-08-27T10:30:00Z"
    }
  ]
}
```

### **📡 ENDPOINT 2: Health Check**

```bash
curl http://localhost:3002/health
curl http://localhost:3001/health  
```

**✅ RESPUESTA ESPERADA:** Status 200 OK

### **🗄️ VERIFICACIÓN BASE DE DATOS**

**📋 QUERIES DE VERIFICACIÓN:**

```sql
-- 1. Verificar constraint de tipo_consulta
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'prospectos'::regclass 
AND conname = 'prospectos_tipo_consulta_check';

-- 2. Verificar índices creados  
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'prospectos' 
AND indexname LIKE 'idx_prospectos_%';

-- 3. Verificar función RPC
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_usuario_recurrente';

-- 4. Verificar vista de usuarios recurrentes
SELECT * FROM usuarios_recurrentes LIMIT 5;

-- 5. Contar prospectos por tipo
SELECT tipo_consulta, COUNT(*) 
FROM prospectos 
GROUP BY tipo_consulta;
```

---

## 📋 **CHECKLIST COMPLETO DE TESTING**

### **✅ FUNCIONALIDAD BÁSICA:**
- [ ] **Captura inicial completa sin errores**
- [ ] **Todos los flujos (1-6) funcionan correctamente**  
- [ ] **Guardado de prospectos exitoso**
- [ ] **Reset automático post-flujo**
- [ ] **Dashboard muestra datos correctos**

### **✅ MÚLTIPLES CONSULTAS:**
- [ ] **Reconocimiento automático funciona**
- [ ] **Menú contextual personalizado se muestra**
- [ ] **Datos están pre-cargados (no solicita repetir)**
- [ ] **Opción 6 (reinicio total) funciona**
- [ ] **Límite de 30 días se respeta**  
- [ ] **Saludos por horario (Buenos días/tardes/noches)**

### **✅ SISTEMA ANTI-DUPLICADOS:**
- [ ] **Solo 1 prospecto por flujo completado**
- [ ] **Función upsert previene duplicados en 24h**
- [ ] **Metadata se actualiza automáticamente**  
- [ ] **Triggers funcionan correctamente**

### **✅ OPTIMIZACIONES:**
- [ ] **Índices mejoran velocidad de consultas**
- [ ] **Constraints validan datos correctamente**
- [ ] **Shortcuts reducen pasos del usuario**
- [ ] **Prospectos urgentes se identifican visualmente**

### **✅ CASOS EDGE:**
- [ ] **Búsquedas sin resultados manejadas**
- [ ] **Caracteres especiales funcionan**  
- [ ] **Abandono de flujo manejado correctamente**
- [ ] **Validaciones de entrada robustas**

---

## 📈 **MÉTRICAS DE ÉXITO**

### **🎯 OBJETIVO PRINCIPAL:**
**✅ Usuarios NUNCA vuelven a ingresar datos básicos en consultas posteriores**

### **📊 KPIs A MEDIR:**

| Métrica | Meta | Método de Medición |
|---------|------|--------------------|
| **Reconocimiento Exitoso** | >95% | Usuarios reconocidos vs total consultas |
| **Reducción de Pasos** | -30% | Pasos segunda consulta vs primera |
| **Tiempo de Respuesta** | <2s | Query de reconocimiento |
| **Prevención Duplicados** | 100% | Prospectos únicos por flujo |
| **Satisfacción UX** | Visual | Flujo natural sin fricción |

### **🏆 RESULTADO ESPERADO FINAL:**

Al completar todo el testing:

- ✅ **4-5 prospectos únicos en dashboard**
- ✅ **Diferentes tipos de consulta representados**
- ✅ **Al menos 1 prospecto urgente identificado**  
- ✅ **Reconocimiento automático 100% funcional**
- ✅ **Sin duplicados confirmado**
- ✅ **Flujos optimizados completamente operativos**

---

## 🚀 **INSTRUCCIONES DE EJECUCIÓN**

### **📋 ORDEN RECOMENDADO:**

1. **[30 min] Escenario 1:** Juan Pérez (Exploración completa)
2. **[20 min] Escenario 2:** María González (Asesor urgente)  
3. **[20 min] Escenario 3:** Carlos Silva (Búsqueda directa)
4. **[15 min] Verificación Dashboard:** Prospectos y conversaciones
5. **[15 min] Testing Técnico:** APIs y base de datos  
6. **[10 min] Casos Edge:** Validaciones y límites

### **⏰ TIEMPO TOTAL ESTIMADO:** 2 horas

### **👥 ROLES:**
- **Tester Principal:** Ejecuta escenarios de usuarios
- **Verificador Dashboard:** Monitorea resultados en tiempo real
- **Verificador Técnico:** Valida APIs y base de datos

---

## 📝 **REGISTRO DE RESULTADOS**

### **📊 TEMPLATE DE REPORTE:**

```markdown
## RESULTADOS DE TESTING - [FECHA]

### ESCENARIO 1: Juan Pérez
- ✅/❌ Reconocimiento automático
- ✅/❌ Menú contextual  
- ✅/❌ Datos pre-cargados
- Observaciones: ___

### ESCENARIO 2: María González  
- ✅/❌ Clasificación urgente
- ✅/❌ Dashboard badge  
- ✅/❌ Flujo de seguimiento
- Observaciones: ___

[Continuar para todos los escenarios...]

### ISSUES ENCONTRADOS:
1. [Descripción del problema]
2. [Pasos para reproducir] 
3. [Impacto esperado]

### RECOMENDACIONES:
- [ ] [Mejora sugerida 1]
- [ ] [Mejora sugerida 2]
```

---

**🎓 Sistema de múltiples consultas listo para validación completa**  
**🚀 ChatBot universitario más avanzado de Chile en testing**

---

**Desarrollado con ❤️ por Juan Pablo Silva feat Claude AI**