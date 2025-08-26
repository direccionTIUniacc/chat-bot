@echo off
echo =====================================
echo 🚀 Iniciando Sistema UNIACC ChatBot
echo =====================================
echo.
echo 1. Levantando servidor API del Dashboard (puerto 3006)...
start "Dashboard API" cmd /k "cd /d C:\Users\juan.silva\WebstormProjects\chatboot-uniacc\dashboard && npm run dev:api"

echo.
timeout /t 3
echo 2. Levantando Dashboard Frontend (puerto 3000)...
start "Dashboard Frontend" cmd /k "cd /d C:\Users\juan.silva\WebstormProjects\chatboot-uniacc\dashboard && set VITE_PORT=3000 && npm run dev"

echo.
timeout /t 3
echo 3. Levantando ChatBot (puerto 3001)...
start "ChatBot" cmd /k "cd /d C:\Users\juan.silva\WebstormProjects\chatboot-uniacc\chatbot && npm run dev"

echo.
echo =====================================
echo ✅ Sistema iniciado exitosamente!
echo =====================================
echo.
echo 📊 Dashboard: http://localhost:3000
echo 🤖 ChatBot:   http://localhost:3001
echo 🔧 API:       http://localhost:3006
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul