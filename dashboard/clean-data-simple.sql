-- Script SIMPLE para limpiar datos mock del Dashboard UNIACC
-- Ejecutar en Supabase SQL Editor

-- Limpiar todas las tablas (orden importante por foreign keys)
DELETE FROM mensajes;
DELETE FROM conversaciones;
DELETE FROM prospectos;
DELETE FROM notificaciones;

-- Si existen otras tablas relacionadas
DELETE FROM automatizaciones WHERE true;
DELETE FROM chat_sessions WHERE true;
DELETE FROM chat_messages WHERE true;

-- Verificar limpieza
SELECT 'prospectos' as tabla, COUNT(*) as registros FROM prospectos
UNION ALL
SELECT 'conversaciones', COUNT(*) FROM conversaciones  
UNION ALL
SELECT 'mensajes', COUNT(*) FROM mensajes
UNION ALL
SELECT 'notificaciones', COUNT(*) FROM notificaciones;

-- Mensaje de confirmación
SELECT '✅ Base de datos limpia - Lista para testing de integración' as status;
