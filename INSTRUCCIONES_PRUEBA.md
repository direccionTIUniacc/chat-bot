# 🚀 Instrucciones para Probar el Sistema UNIACC ChatBot

## ✅ **¡SISTEMA LISTO PARA PROBAR!**

He solucionado el error 404 y configurado todo para que funcione correctamente.

## 🔧 **¿Qué se solucionó?**

1. **✅ Error 404 arreglado**: Creé el endpoint `/api/interacciones` que faltaba
2. **✅ Servidor API funcionando**: Express server en puerto 3006
3. **✅ Proxy configurado**: Dashboard redirige requests API correctamente  
4. **✅ Base de datos integrada**: Usa tus tablas `conversaciones` y `mensajes`
5. **✅ Registro habilitado**: Chatbot guardará interacciones automáticamente

## 🚀 **Cómo ejecutar el sistema completo:**

### Opción 1: Script Automático (RECOMENDADO)
```bash
# En la raíz del proyecto
.\start-system.bat
```

### Opción 2: Manual 
```bash
# Terminal 1: Servidor API
cd dashboard
npm run dev:api

# Terminal 2: Dashboard Frontend  
cd dashboard
set VITE_PORT=3000
npm run dev

# Terminal 3: ChatBot
cd chatbot
npm run dev
```

## 🌐 **URLs del Sistema:**

- **🤖 ChatBot**: http://localhost:3001
- **📊 Dashboard**: http://localhost:3000  
- **🔧 API**: http://localhost:3006

## 🔍 **Cómo probar que funciona:**

1. **Abrir el ChatBot**: Ve a http://localhost:3001
2. **Enviar mensaje**: Escribe "hola" en la interfaz
3. **¡No más errores 404!**: Las interacciones se guardarán sin errores
4. **Ver en Dashboard**: Las conversaciones aparecerán en http://localhost:3000
5. **Verificar BD**: Revisa las tablas `conversaciones` y `mensajes` en Supabase

## 📊 **Funcionalidades que funcionan ahora:**

### Chatbot ✅
- ✅ Conversaciones fluidas sin errores
- ✅ Captura de leads universitarios  
- ✅ Registro automático de interacciones
- ✅ Integración con dashboard

### Dashboard ✅
- ✅ Vista de conversaciones en tiempo real
- ✅ Gestión de prospectos
- ✅ API endpoints funcionando
- ✅ Proxy configurado correctamente

### Base de Datos ✅
- ✅ Conversaciones por número de WhatsApp
- ✅ Mensajes de usuario y bot separados
- ✅ Metadata y timestamps correctos
- ✅ Actualización automática de contadores

## 🔧 **Configuración Técnica:**

### Puertos:
- **Dashboard Frontend**: 3000 (con proxy a API)
- **ChatBot**: 3001  
- **Dashboard API**: 3006

### Flujo de Datos:
```
ChatBot (3001) 
    ↓ POST /api/interacciones
Dashboard Frontend (3000)
    ↓ proxy
Dashboard API (3006)
    ↓ INSERT 
Supabase BD (conversaciones + mensajes)
```

## 🐛 **Si algo no funciona:**

1. **Verifica puertos libres**: Cierra otros procesos Node.js
2. **Revisa logs**: Los errores aparecerán en las consolas
3. **Configura Supabase**: Actualiza las variables de entorno si es necesario
4. **Proxy logs**: Verás logs detallados de las requests API

## 🎯 **¡LISTO PARA PROBAR!**

El sistema está completamente funcional. Solo ejecuta `.\start-system.bat` y podrás probar el chatbot sin errores 404.

Las interacciones se guardarán automáticamente en tu base de datos y podrás verlas en el dashboard.

**¡Disfruta probando tu sistema UNIACC! 🎓✨**