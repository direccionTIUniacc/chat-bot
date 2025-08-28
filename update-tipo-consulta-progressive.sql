-- Script para agregar valores de tipo_consulta para progressive capture
-- Ejecutar en Supabase SQL Editor

-- Primero, verificar constraint actual
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.prospectos'::regclass 
AND conname = 'prospectos_tipo_consulta_check';

-- Eliminar constraint existente
ALTER TABLE public.prospectos 
DROP CONSTRAINT IF EXISTS prospectos_tipo_consulta_check;

-- Agregar constraint actualizada con valores de progressive capture
ALTER TABLE public.prospectos 
ADD CONSTRAINT prospectos_tipo_consulta_check 
CHECK (tipo_consulta IN (
    -- Valores originales
    'info_carreras',
    'info_admision', 
    'info_costos',
    'info_modalidades',
    'solicitar_asesor',
    'ingreso solo datos basicos',
    'consulta multiple carrera especifica',
    'consulta multiple general',
    
    -- Nuevos valores para progressive capture
    'captura en proceso',
    'abandono solo nombre',
    'abandono con email', 
    'abandono con edad',
    'abandono con region',
    'abandono incompleto',
    'captura completa'
));

-- Verificar que el constraint se aplicó correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.prospectos'::regclass 
AND conname = 'prospectos_tipo_consulta_check';

-- Comentario: Este script agrega los nuevos valores necesarios para el sistema de progressive capture:
-- - abandono solo nombre: Usuario ingresó solo nombre y abandonó
-- - abandono con email: Usuario ingresó nombre y email, luego abandonó  
-- - abandono con edad: Usuario ingresó hasta edad y abandonó
-- - abandono con region: Usuario ingresó hasta región y abandonó
-- - abandono incompleto: Usuario abandonó en cualquier punto sin datos suficientes
-- - captura completa: Usuario completó todo el formulario de datos básicos