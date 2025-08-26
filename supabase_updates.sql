-- Actualizaciones a la base de datos para el nuevo flujo del chatbot
-- Ejecutar estos comandos en Supabase SQL Editor

-- 1. Actualizar la tabla prospectos para asegurar compatibilidad
-- La tabla ya tiene los campos necesarios, solo vamos a agregar algunos índices y optimizaciones

-- Agregar índice para búsquedas por whatsapp (importante para el chatbot)
CREATE INDEX IF NOT EXISTS idx_prospectos_whatsapp ON public.prospectos(whatsapp);

-- Agregar índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_prospectos_email ON public.prospectos(email);

-- Agregar índice para estado (para estadísticas rápidas)
CREATE INDEX IF NOT EXISTS idx_prospectos_estado ON public.prospectos(estado);

-- Agregar índice para fecha de creación (para reportes)
CREATE INDEX IF NOT EXISTS idx_prospectos_created_at ON public.prospectos(created_at);

-- 2. Actualizar el constraint del whatsapp para ser más flexible con formatos internacionales
ALTER TABLE public.prospectos 
DROP CONSTRAINT IF EXISTS prospectos_whatsapp_check;

ALTER TABLE public.prospectos 
ADD CONSTRAINT prospectos_whatsapp_check 
CHECK (whatsapp ~ '^\\+?[0-9\\s\\-\\(\\)]{8,25}$');

-- 3. Crear función para manejar duplicados por WhatsApp
-- Si ya existe un prospecto con el mismo WhatsApp, actualiza los datos en lugar de crear uno nuevo
CREATE OR REPLACE FUNCTION upsert_prospecto_por_whatsapp(
  p_whatsapp TEXT,
  p_nombre TEXT,
  p_email TEXT DEFAULT NULL,
  p_edad INTEGER DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_telefono TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prospecto_id UUID;
BEGIN
  -- Intentar encontrar prospecto existente por WhatsApp
  SELECT id INTO v_prospecto_id
  FROM public.prospectos
  WHERE whatsapp = p_whatsapp;

  IF v_prospecto_id IS NOT NULL THEN
    -- Actualizar prospecto existente
    UPDATE public.prospectos
    SET 
      nombre = COALESCE(p_nombre, nombre),
      email = COALESCE(p_email, email),
      edad = COALESCE(p_edad, edad),
      region = COALESCE(p_region, region),
      telefono = COALESCE(p_telefono, telefono),
      updated_at = NOW(),
      ultimo_contacto = NOW()
    WHERE id = v_prospecto_id;
  ELSE
    -- Crear nuevo prospecto
    INSERT INTO public.prospectos (
      whatsapp,
      nombre,
      email,
      edad,
      region,
      telefono,
      fuente,
      ultimo_contacto
    ) VALUES (
      p_whatsapp,
      p_nombre,
      p_email,
      p_edad,
      p_region,
      p_telefono,
      'whatsapp_bot',
      NOW()
    ) RETURNING id INTO v_prospecto_id;
  END IF;

  RETURN v_prospecto_id;
END;
$$;

-- 4. Crear función para obtener estadísticas rápidas de prospectos
CREATE OR REPLACE FUNCTION get_prospectos_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'nuevos', COUNT(*) FILTER (WHERE estado = 'nuevo'),
    'contactados', COUNT(*) FILTER (WHERE estado = 'contactado'),
    'interesados', COUNT(*) FILTER (WHERE estado = 'interesado'),
    'matriculados', COUNT(*) FILTER (WHERE estado = 'matriculado'),
    'descartados', COUNT(*) FILTER (WHERE estado = 'descartado'),
    'conversion_rate', CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE estado = 'matriculado') * 100.0 / COUNT(*)), 2)
      ELSE 0 
    END,
    'hoy', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
    'esta_semana', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'este_mes', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')
  ) INTO stats
  FROM public.prospectos;

  RETURN stats;
END;
$$;

-- 5. Actualizar RLS (Row Level Security) policies si es necesario
-- Permitir inserción de prospectos desde el chatbot
CREATE POLICY IF NOT EXISTS "Chatbot can insert prospectos" 
ON public.prospectos FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Permitir lectura de prospectos para estadísticas
CREATE POLICY IF NOT EXISTS "Anyone can read prospectos stats" 
ON public.prospectos FOR SELECT 
TO anon, authenticated
USING (true);

-- Permitir actualización de prospectos existentes
CREATE POLICY IF NOT EXISTS "Chatbot can update prospectos" 
ON public.prospectos FOR UPDATE 
TO anon, authenticated
USING (true);

-- 6. Crear trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prospectos_updated_at 
    BEFORE UPDATE ON public.prospectos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();