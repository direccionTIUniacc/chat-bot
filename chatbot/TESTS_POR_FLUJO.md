# 🎯 Tests por Flujo Conversacional - Chatbot UNIACC

## 🚀 **Nueva Funcionalidad: Testing Específico por Flujos**

Hemos implementado **10 tests específicos** que prueban cada uno de los flujos conversacionales identificados en el mapeo inicial del chatbot.

## 🖥️ **Cómo Acceder**

1. **Abrir la interfaz web:**
   ```
   http://localhost:3000/chat-demo.html
   ```

2. **Ir a la pestaña "🧪 Testing Panel"**

3. **Buscar la sección "🎯 Tests por Flujo"**

## 🎪 **Flujos Disponibles para Testing**

### **1. 📝 Captura Inicial**
- **Objetivo**: Prueba el flujo completo de captura de datos de prospectos
- **Secuencia**: `Hola → Juan Pérez → juan@test.com → 25 → Metropolitana`
- **Valida**: `nombre, email, edad, región`
- **Propósito**: Verificar que el bot capture correctamente todos los datos iniciales

### **2. 🏠 Menú Principal**
- **Objetivo**: Prueba la navegación del menú principal
- **Secuencia**: `Hola → Test Usuario → test@email.com → 1`
- **Valida**: `opciones, menú, elegir, carreras`
- **Propósito**: Verificar que el menú principal presente las opciones correctas

### **3. 🔍 Exploración Carreras**
- **Objetivo**: Prueba la exploración de carreras por facultad
- **Secuencia**: `Hola → Test Usuario → test@email.com → 1 → 1`
- **Valida**: `carreras, facultad, programas, ingeniería`
- **Propósito**: Verificar el listado y navegación de carreras

### **4. 📚 Detalle Carrera**
- **Objetivo**: Prueba la visualización de detalles específicos de una carrera
- **Secuencia**: `Hola → Test Usuario → test@email.com → 1 → 1 → 1`
- **Valida**: `carrera, detalle, información, duración`
- **Propósito**: Verificar que se muestren detalles completos de la carrera

### **5. 🎓 Proceso Admisión**
- **Objetivo**: Prueba el flujo de información sobre admisión
- **Secuencia**: `Hola → Test Usuario → test@email.com → 2`
- **Valida**: `admisión, requisitos, proceso, documentos`
- **Propósito**: Verificar información clara sobre el proceso de admisión

### **6. 🔎 Búsqueda Directa**
- **Objetivo**: Prueba la búsqueda directa por nombre de carrera
- **Secuencia**: `Hola → Test Usuario → test@email.com → ingeniería`
- **Valida**: `búsqueda, encontrado, resultados, ingeniería`
- **Propósito**: Verificar la funcionalidad de búsqueda por texto libre

### **7. 💰 Costos y Becas**
- **Objetivo**: Prueba la consulta de información financiera
- **Secuencia**: `Hola → Test Usuario → test@email.com → 3`
- **Valida**: `costos, becas, financiamiento, arancel`
- **Propósito**: Verificar información sobre costos y opciones de financiamiento

### **8. 📖 Modalidades**
- **Objetivo**: Prueba la información sobre modalidades de estudio
- **Secuencia**: `Hola → Test Usuario → test@email.com → 4`
- **Valida**: `modalidades, presencial, online, horarios`
- **Propósito**: Verificar información sobre diferentes modalidades de estudio

### **9. 🎯 Menú Contextual**
- **Objetivo**: Prueba el menú contextual de información universitaria
- **Secuencia**: `Hola → Test Usuario → test@email.com → 5`
- **Valida**: `universidad, campus, sedes, ubicación`
- **Propósito**: Verificar información institucional y de ubicaciones

### **10. 👨‍💼 Captura Asesor**
- **Objetivo**: Prueba la conexión con asesor educativo
- **Secuencia**: `Hola → Test Usuario → test@email.com → asesor`
- **Valida**: `asesor, contacto, ejecutivo, llamada`
- **Propósito**: Verificar el flujo de conexión con asesor humano

## 🎯 **Cómo Ejecutar Tests por Flujo**

### **Ejecución Individual:**
```
1. Click en cualquier botón de flujo (ej: "📝 Captura Inicial")
2. Ver logs en tiempo real del progreso
3. Observar validación de palabras clave
4. Revisar métricas de éxito/fallo
```

### **Información en Logs:**
- ✅ **Descripción del flujo**: Qué se está probando
- 📤 **Paso a paso**: Cada mensaje enviado numerado
- 🎯 **Palabras clave encontradas**: Validación en tiempo real
- 📊 **Ratio de éxito**: Porcentaje de palabras clave encontradas
- ⏱️ **Duración**: Tiempo total de ejecución

## 🎨 **Interfaz Visual**

### **Botones por Color:**
- 🟣 **Indigo**: Captura Inicial
- 🟪 **Purple**: Menú Principal  
- 🩷 **Pink**: Exploración Carreras
- 🧡 **Orange**: Detalle Carrera
- 🔴 **Red**: Proceso Admisión
- 🟡 **Yellow**: Búsqueda Directa
- 🟢 **Emerald**: Costos y Becas
- 🔵 **Teal**: Modalidades
- 🟦 **Cyan**: Menú Contextual
- ⚫ **Slate**: Captura Asesor

### **Estados de Validación:**
- ✅ **Verde**: Palabras clave encontradas correctamente
- ⚡ **Azul**: Información de progreso
- ⚠️ **Amarillo**: Pocas palabras clave encontradas
- ❌ **Rojo**: Errores en la ejecución

## 📊 **Criterios de Éxito**

### **Sistema de Validación:**
- **30%+ palabras clave**: ✅ **Test EXITOSO**
- **<30% palabras clave**: ⚠️ **Test CON ADVERTENCIAS**
- **Error en ejecución**: ❌ **Test FALLIDO**

### **Métricas Capturadas:**
- 📈 **Duración total** del flujo
- 🎯 **Palabras clave encontradas** vs esperadas
- 📊 **Ratio de éxito** en porcentaje
- 📝 **Número de mensajes** intercambiados

## 🚀 **Casos de Uso**

### **Para Desarrollo:**
```
1. Hacer cambios en uniacc-scripts.ts
2. Ejecutar test del flujo específico modificado
3. Ver si las palabras clave esperadas aparecen
4. Ajustar lógica según resultados
```

### **Para QA:**
```
1. Ejecutar todos los flujos uno por uno
2. Verificar que cada flujo tenga >70% de éxito
3. Documentar flujos que fallen consistentemente
4. Reportar problemas específicos por flujo
```

### **Para Debugging:**
```
1. Ejecutar flujo problemático
2. Ver logs paso a paso
3. Identificar en qué mensaje específico falla
4. Revisar lógica de ese paso en el código
```

## 🎯 **Ejemplos de Ejecución**

### **Ejemplo: Test de Captura Inicial**
```
🎯 Iniciando test de flujo: Captura Inicial de Datos
📝 Descripción: Test completo del flujo de captura inicial de prospectos
👤 Iniciando flujo para usuario: captura_inicial-test-1756664835123
📤 Paso 1/5: "Hola"
🎯 Palabras clave encontradas: nombre
📤 Paso 2/5: "Juan Pérez"
🎯 Palabras clave encontradas: email
📤 Paso 3/5: "juan@test.com"
📤 Paso 4/5: "25"
🎯 Palabras clave encontradas: región
📤 Paso 5/5: "Metropolitana"
📊 Ratio de palabras clave: 75.0%
✅ Captura Inicial de Datos exitoso (2341ms)
📊 Mensajes enviados: 5
🎯 Palabras clave encontradas: nombre, email, región
```

### **Ejemplo: Test de Menú Principal**
```
🎯 Iniciando test de flujo: Navegación Menú Principal
📝 Descripción: Test del menú principal y navegación de opciones
👤 Iniciando flujo para usuario: menu_principal-test-1756664892456
📤 Paso 1/4: "Hola"
📤 Paso 2/4: "Test Usuario"
📤 Paso 3/4: "test@email.com"
📤 Paso 4/4: "1"
🎯 Palabras clave encontradas: opciones, elegir
📊 Ratio de palabras clave: 50.0%
✅ Navegación Menú Principal exitoso (1876ms)
```

## 🏆 **Beneficios de los Tests por Flujo**

- ✅ **Cobertura Completa**: Cada flujo conversacional está cubierto
- ✅ **Validación Específica**: Palabras clave relevantes por flujo
- ✅ **Feedback Inmediato**: Ver exactamente qué funciona y qué no
- ✅ **Debugging Preciso**: Identificar problemas específicos por paso
- ✅ **Regresión**: Detectar cuando cambios rompen flujos existentes
- ✅ **Documentación Viva**: Los tests sirven como documentación ejecutable

---

**🎓 ¡Ahora puedes probar cada flujo conversacional específico del Chatbot UNIACC con validación automática y logs detallados!** 🚀✨
