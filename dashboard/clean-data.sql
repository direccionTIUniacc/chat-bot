-- Script para limpiar datos mock del Dashboard UNIACC
-- Ejecutar en Supabase SQL Editor

-- Limpiar mensajes primero (foreign keys)
DELETE FROM mensajes;

-- Limpiar conversaciones 
DELETE FROM conversaciones;

-- Limpiar prospectos
DELETE FROM prospectos;

-- Limpiar notificaciones
DELETE FROM notificaciones;

-- Limpiar automatizaciones (si existen)
DELETE FROM automatizaciones;

-- Resetear secuencias (IDs) - Solo si existen
DO $$
BEGIN
    -- Intentar resetear secuencias si existen
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'prospectos_id_seq') THEN
        ALTER SEQUENCE prospectos_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'conversaciones_id_seq') THEN
        ALTER SEQUENCE conversaciones_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'mensajes_id_seq') THEN
        ALTER SEQUENCE mensajes_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'notificaciones_id_seq') THEN
        ALTER SEQUENCE notificaciones_id_seq RESTART WITH 1;
    END IF;
END $$;

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
