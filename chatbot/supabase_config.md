# 🗄️ Configuración Supabase - UNIACC ChatBot Dashboard MVP

## 🚀 SETUP INICIAL DE SUPABASE

### 1. Crear Proyecto
```bash
# 1. Ve a: https://supabase.com/
# 2. Sign up / Log in
# 3. "New project"
# 4. Nombre: "uniacc-chatbot-dashboard"
# 5. Database Password: [generar password seguro]
# 6. Región: South America (São Paulo) - más cercana a Chile
# 7. Plan: Free tier (hasta 500MB)
```

### 2. Configurar Variables de Entorno
```bash
# .env.local
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

## 📊 ESQUEMA COMPLETO DE BASE DE DATOS MVP

### 1. Tabla Prospectos (Mejorada)
```sql
-- Crear tabla principal de prospectos con campos adicionales
CREATE TABLE prospectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
    -- Información personal
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  whatsapp TEXT NOT NULL,
  edad INTEGER,
  ocupacion TEXT,
  
  -- Información académica
  carrera_interes TEXT,
  nivel_educacion TEXT,
  experiencia_previa TEXT,
  
  -- Localización
  region TEXT,
  ciudad TEXT,
  pais TEXT DEFAULT 'Chile',
  
  -- Estados y gestión
  estado TEXT DEFAULT 'nuevo' CHECK (estado IN (
    'nuevo', 
    'contactado', 
    'interesado', 
    'matriculado',
    'descartado'
  )),
  nivel_interes TEXT DEFAULT 'medio' CHECK (nivel_interes IN (
    'bajo', 'medio', 'alto', 'muy_alto'
  )),
  
  -- Asignación y seguimiento
  assigned_to UUID REFERENCES ejecutivos(id),
  ejecutivo_asignado_at TIMESTAMP WITH TIME ZONE,
  
  -- Fuente y tracking
  fuente TEXT DEFAULT 'whatsapp_bot' CHECK (fuente IN (
    'whatsapp_bot', 'web_form', 'facebook_ads', 'google_ads', 'referido'
  )),
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}',
  notas TEXT,
  tags TEXT[],
  
  -- Campos de contacto
  ultimo_contacto TIMESTAMP WITH TIME ZONE,
  proximo_seguimiento TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$' OR email IS NULL),
  CONSTRAINT valid_whatsapp CHECK (whatsapp ~ '^\\+?[0-9\\s\\-\\(\\)]{8,20}$')
);

-- Índices para optimización
CREATE INDEX idx_prospectos_whatsapp ON prospectos(whatsapp);
CREATE INDEX idx_prospectos_email ON prospectos(email);
CREATE INDEX idx_prospectos_estado ON prospectos(estado);
CREATE INDEX idx_prospectos_asignado ON prospectos(assigned_to);
CREATE INDEX idx_prospectos_fuente ON prospectos(fuente);
CREATE INDEX idx_prospectos_carrera ON prospectos(carrera_interes);
CREATE INDEX idx_prospectos_region ON prospectos(region);
CREATE INDEX idx_prospectos_created_at ON prospectos(created_at);
```

### 2. Tabla Ejecutivos (Nueva)
```sql
-- Crear tabla de ejecutivos de admisión
CREATE TABLE ejecutivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Información personal
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  avatar_url TEXT,
  
  -- Especialización
  carreras_especializacion TEXT[] DEFAULT '{}',
  regiones_cobertura TEXT[] DEFAULT '{}',
  
  -- Capacidad y limites
  max_prospectos_simultaneos INTEGER DEFAULT 50,
  prospectos_activos INTEGER DEFAULT 0,
  
  -- Performance
  tasa_conversion DECIMAL(5,2) DEFAULT 0.00,
  total_conversiones INTEGER DEFAULT 0,
  
  -- Horarios de trabajo
  horario_inicio TIME DEFAULT '09:00',
  horario_fin TIME DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/Santiago',
  dias_trabajo INTEGER[] DEFAULT '{1,2,3,4,5}', -- Lunes a Viernes
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  disponible BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP WITH TIME ZONE,
  
  -- Configuración
  configuracion JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  CONSTRAINT valid_max_prospectos CHECK (max_prospectos_simultaneos > 0)
);

-- Índices
CREATE INDEX idx_ejecutivos_email ON ejecutivos(email);
CREATE INDEX idx_ejecutivos_activo ON ejecutivos(activo);
CREATE INDEX idx_ejecutivos_disponible ON ejecutivos(disponible);
CREATE INDEX idx_ejecutivos_carreras ON ejecutivos USING GIN(carreras_especializacion);
```

### 3. Tabla Conversaciones (Nueva)
```sql
-- Crear tabla para gestionar conversaciones de WhatsApp
CREATE TABLE conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identificación
  external_id TEXT UNIQUE, -- ID de Botpress/WhatsApp
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  
  -- Relaciones
  prospecto_id UUID REFERENCES prospectos(id),
  assigned_to UUID REFERENCES ejecutivos(id),
  
  -- Estado de la conversación
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'closed', 'archived'
  )),
  
  -- Metadata
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  
  -- Información del contacto
  contact_info JSONB DEFAULT '{}',
  
  -- Tags y categorización
  tags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Notas internas
  notas TEXT
);

-- Índices
CREATE INDEX idx_conversaciones_phone ON conversaciones(phone_number);
CREATE INDEX idx_conversaciones_prospecto ON conversaciones(prospecto_id);
CREATE INDEX idx_conversaciones_asignado ON conversaciones(assigned_to);
CREATE INDEX idx_conversaciones_status ON conversaciones(status);
CREATE INDEX idx_conversaciones_last_message ON conversaciones(last_message_at);
```

### 4. Tabla Mensajes (Nueva)
```sql
-- Crear tabla para almacenar mensajes de conversaciones
CREATE TABLE mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relación con conversación
  conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
  
  -- Identificación del mensaje
  external_id TEXT, -- ID de Botpress/WhatsApp
  
  -- Contenido
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'image', 'document', 'audio', 'video', 'location', 'contact'
  )),
  
  -- Dirección del mensaje
  type TEXT NOT NULL CHECK (type IN ('user', 'bot', 'agent')),
  
  -- Remitente
  sender_id TEXT,
  sender_name TEXT,
  
  -- Estado
  is_read BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id);
CREATE INDEX idx_mensajes_created_at ON mensajes(created_at);
CREATE INDEX idx_mensajes_type ON mensajes(type);
CREATE INDEX idx_mensajes_read ON mensajes(is_read);
```

### 5. Tabla Automatizaciones (Nueva)
```sql
-- Crear tabla para workflows de automatización
CREATE TABLE automatizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Información básica
  nombre TEXT NOT NULL,
  descripcion TEXT,
  
  -- Estado
  activa BOOLEAN DEFAULT true,
  
  -- Configuración del workflow
  trigger_config JSONB NOT NULL, -- Configuración del disparador
  actions_config JSONB NOT NULL, -- Configuración de las acciones
  
  -- Condiciones
  condiciones JSONB DEFAULT '{}',
  
  -- Estadísticas
  total_ejecutado INTEGER DEFAULT 0,
  total_exitoso INTEGER DEFAULT 0,
  total_fallido INTEGER DEFAULT 0,
  
  -- Configuración de programación
  schedule_config JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Creado por
  created_by UUID REFERENCES ejecutivos(id)
);

-- Índices
CREATE INDEX idx_automatizaciones_activa ON automatizaciones(activa);
CREATE INDEX idx_automatizaciones_created_by ON automatizaciones(created_by);
```

### 6. Tabla Ejecuciones Automatización (Nueva)
```sql
-- Crear tabla para logs de ejecución de automatizaciones
CREATE TABLE automatizacion_ejecuciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relación
  automatizacion_id UUID REFERENCES automatizaciones(id) ON DELETE CASCADE,
  prospecto_id UUID REFERENCES prospectos(id),
  
  -- Estado de ejecución
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente', 'ejecutando', 'completado', 'fallido', 'cancelado'
  )),
  
  -- Detalles
  trigger_data JSONB DEFAULT '{}',
  resultado JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Timestamps
  iniciado_at TIMESTAMP WITH TIME ZONE,
  completado_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_ejecuciones_automatizacion ON automatizacion_ejecuciones(automatizacion_id);
CREATE INDEX idx_ejecuciones_prospecto ON automatizacion_ejecuciones(prospecto_id);
CREATE INDEX idx_ejecuciones_estado ON automatizacion_ejecuciones(estado);
```

### 7. Tabla Fuentes de Leads (Nueva)
```sql
-- Crear tabla para gestionar múltiples fuentes de leads
CREATE TABLE fuentes_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Información básica
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'formulario_web', 'landing_page', 'facebook_ads', 'google_ads', 'whatsapp_bot', 'referido'
  )),
  url TEXT,
  activa BOOLEAN DEFAULT true,
  
  -- Configuración específica
  configuracion JSONB DEFAULT '{}',
  
  -- Parámetros UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Campos del formulario
  campos_requeridos TEXT[] DEFAULT '{}',
  campos_opcionales TEXT[] DEFAULT '{}',
  
  -- Configuración de respuesta
  mensaje_gracias TEXT,
  redirect_url TEXT,
  
  -- Estadísticas
  total_leads INTEGER DEFAULT 0,
  leads_hoy INTEGER DEFAULT 0,
  tasa_conversion DECIMAL(5,2) DEFAULT 0.00,
  costo_por_lead DECIMAL(8,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_fuentes_tipo ON fuentes_leads(tipo);
CREATE INDEX idx_fuentes_activa ON fuentes_leads(activa);
CREATE INDEX idx_fuentes_utm_source ON fuentes_leads(utm_source);
CREATE INDEX idx_fuentes_utm_campaign ON fuentes_leads(utm_campaign);
```

### 8. Tabla Tracking de Leads (Nueva)
```sql
-- Crear tabla para tracking detallado de leads
CREATE TABLE leads_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relaciones
  prospecto_id UUID REFERENCES prospectos(id) ON DELETE CASCADE,
  fuente_id UUID REFERENCES fuentes_leads(id),
  
  -- Datos de sesión
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Parámetros UTM capturados
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Geolocalización
  pais TEXT,
  ciudad TEXT,
  region TEXT,
  
  -- Datos del formulario
  formulario_id TEXT,
  landing_page_id TEXT,
  campana_id TEXT,
  
  -- Timestamps de eventos
  primera_visita TIMESTAMP WITH TIME ZONE,
  conversion TIMESTAMP WITH TIME ZONE,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_tracking_prospecto ON leads_tracking(prospecto_id);
CREATE INDEX idx_tracking_fuente ON leads_tracking(fuente_id);
CREATE INDEX idx_tracking_session ON leads_tracking(session_id);
CREATE INDEX idx_tracking_utm_campaign ON leads_tracking(utm_campaign);
```

## 🔄 FUNCIONES Y TRIGGERS

### 1. Función para actualizar updated_at
```sql
-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas las tablas principales
CREATE TRIGGER update_prospectos_updated_at 
    BEFORE UPDATE ON prospectos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ejecutivos_updated_at 
    BEFORE UPDATE ON ejecutivos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversaciones_updated_at 
    BEFORE UPDATE ON conversaciones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automatizaciones_updated_at 
    BEFORE UPDATE ON automatizaciones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuentes_updated_at 
    BEFORE UPDATE ON fuentes_leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Función para actualizar contadores de ejecutivos
```sql
-- Función para actualizar automáticamente el contador de prospectos activos
CREATE OR REPLACE FUNCTION update_ejecutivo_prospectos_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se asigna un nuevo ejecutivo
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
        UPDATE ejecutivos 
        SET prospectos_activos = (
            SELECT COUNT(*) FROM prospectos 
            WHERE assigned_to = NEW.assigned_to 
            AND estado NOT IN ('matriculado', 'descartado')
        )
        WHERE id = NEW.assigned_to;
    END IF;
    
    -- Si se desasigna un ejecutivo
    IF OLD.assigned_to IS NOT NULL AND (NEW.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
        UPDATE ejecutivos 
        SET prospectos_activos = (
            SELECT COUNT(*) FROM prospectos 
            WHERE assigned_to = OLD.assigned_to 
            AND estado NOT IN ('matriculado', 'descartado')
        )
        WHERE id = OLD.assigned_to;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ejecutivo_count_trigger
    AFTER UPDATE ON prospectos
    FOR EACH ROW EXECUTE FUNCTION update_ejecutivo_prospectos_count();
```

### 3. Función para estadísticas de fuentes
```sql
-- Función para actualizar estadísticas de fuentes de leads
CREATE OR REPLACE FUNCTION update_fuente_stats()
RETURNS TRIGGER AS $$
DECLARE
    fuente_record RECORD;
BEGIN
    -- Buscar la fuente basada en el metadata del prospecto
    IF NEW.metadata ? 'fuente_id' THEN
        SELECT * INTO fuente_record 
        FROM fuentes_leads 
        WHERE id = (NEW.metadata->>'fuente_id')::UUID;
        
        IF FOUND THEN
            UPDATE fuentes_leads 
            SET 
                total_leads = (
                    SELECT COUNT(*) FROM prospectos 
                    WHERE metadata->>'fuente_id' = fuente_record.id::text
                ),
                leads_hoy = (
                    SELECT COUNT(*) FROM prospectos 
                    WHERE metadata->>'fuente_id' = fuente_record.id::text
                    AND created_at >= CURRENT_DATE
                ),
                tasa_conversion = (
SELECT 
                        CASE 
                            WHEN COUNT(*) = 0 THEN 0
                            ELSE (COUNT(CASE WHEN estado = 'matriculado' THEN 1 END) * 100.0 / COUNT(*))
                        END
FROM prospectos 
                    WHERE metadata->>'fuente_id' = fuente_record.id::text
                )
            WHERE id = fuente_record.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fuente_stats_trigger
    AFTER INSERT OR UPDATE ON prospectos
    FOR EACH ROW EXECUTE FUNCTION update_fuente_stats();
```

## 🔐 CONFIGURACIÓN DE SEGURIDAD (RLS)

### 1. Habilitar RLS en todas las tablas
```sql
-- Habilitar Row Level Security
ALTER TABLE prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejecutivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE automatizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE automatizacion_ejecuciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuentes_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_tracking ENABLE ROW LEVEL SECURITY;
```

### 2. Políticas de acceso básicas
```sql
-- Política para ejecutivos: solo pueden ver sus prospectos asignados
CREATE POLICY "Ejecutivos pueden ver sus prospectos" ON prospectos
    FOR ALL USING (assigned_to = auth.uid());

-- Política para conversaciones: solo asignadas al ejecutivo
CREATE POLICY "Ejecutivos pueden ver sus conversaciones" ON conversaciones
    FOR ALL USING (assigned_to = auth.uid());

-- Política para administradores (service role puede ver todo)
CREATE POLICY "Service role acceso total" ON prospectos
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role acceso total conversaciones" ON conversaciones
    FOR ALL USING (auth.role() = 'service_role');

-- Repetir para todas las tablas...
```

## 📝 DATOS DE PRUEBA

### 1. Ejecutivos de muestra
```sql
-- Insertar ejecutivos de prueba
INSERT INTO ejecutivos (nombre, email, carreras_especializacion, regiones_cobertura) VALUES
('María González', 'maria.gonzalez@uniacc.cl', 
 ARRAY['Comunicación Audiovisual', 'Periodismo'], 
 ARRAY['Metropolitana', 'Valparaíso']),
('Carlos Rodríguez', 'carlos.rodriguez@uniacc.cl', 
 ARRAY['Arquitectura', 'Diseño Gráfico'], 
 ARRAY['Metropolitana', 'Biobío']),
('Ana Morales', 'ana.morales@uniacc.cl', 
 ARRAY['Ingeniería Comercial', 'Psicología'], 
 ARRAY['Metropolitana', 'La Araucanía']);
```

### 2. Fuentes de leads de muestra
```sql
-- Insertar fuentes de prueba
INSERT INTO fuentes_leads (nombre, tipo, configuracion, utm_source, utm_medium) VALUES
('WhatsApp Bot Principal', 'whatsapp_bot', 
 '{"numero_telefono": "+56912345678"}', 'whatsapp', 'bot'),
('Formulario Web Contacto', 'formulario_web', 
 '{"tema": "uniacc", "mostrar_carreras": true}', 'website', 'organic'),
('Campaña Facebook Comunicaciones', 'facebook_ads', 
 '{"campaign_id": "fb_001"}', 'facebook', 'cpc');
```

## 🔄 CONFIGURACIÓN PARA INTEGRACIÓN CON BOTPRESS

### 1. Webhook Handler (Ya implementado en el código)
```sql
-- Función para procesar webhooks de Botpress
CREATE OR REPLACE FUNCTION process_botpress_webhook(webhook_data JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{"success": true}';
    prospecto_id UUID;
    conversacion_id UUID;
BEGIN
    -- Lógica de procesamiento implementada en el código TypeScript
    -- Esta función puede usarse para validaciones adicionales
    RETURN result;
END;
$$ language 'plpgsql';
```

## 📊 VISTAS PARA ANALYTICS

### 1. Vista de métricas de ejecutivos
```sql
CREATE VIEW ejecutivos_metrics AS
SELECT 
    e.id,
    e.nombre,
    e.email,
    e.prospectos_activos,
    e.tasa_conversion,
    COUNT(p.id) as total_prospectos,
    COUNT(CASE WHEN p.estado = 'matriculado' THEN 1 END) as matriculados,
    COUNT(CASE WHEN p.created_at >= CURRENT_DATE THEN 1 END) as prospectos_hoy
FROM ejecutivos e
LEFT JOIN prospectos p ON e.id = p.assigned_to
WHERE e.activo = true
GROUP BY e.id, e.nombre, e.email, e.prospectos_activos, e.tasa_conversion;
```

### 2. Vista de métricas de fuentes
```sql
CREATE VIEW fuentes_metrics AS
SELECT 
    f.id,
    f.nombre,
    f.tipo,
    f.total_leads,
    f.leads_hoy,
    f.tasa_conversion,
    f.costo_por_lead,
    COUNT(t.id) as total_tracking_events,
    COUNT(CASE WHEN p.estado = 'matriculado' THEN 1 END) as conversiones
FROM fuentes_leads f
LEFT JOIN leads_tracking t ON f.id = t.fuente_id
LEFT JOIN prospectos p ON t.prospecto_id = p.id
WHERE f.activa = true
GROUP BY f.id, f.nombre, f.tipo, f.total_leads, f.leads_hoy, f.tasa_conversion, f.costo_por_lead;
```

## 🚀 PASOS PARA APLICAR EN SUPABASE

### 1. Ejecución paso a paso:
```bash
1. Conectar a tu proyecto Supabase
2. Ir a SQL Editor
3. Ejecutar los scripts en este orden:
   - Tablas principales (prospectos, ejecutivos, etc.)
   - Índices
   - Funciones y triggers
   - Vistas
   - Políticas RLS
   - Datos de prueba
```

### 2. Verificación:
```sql
-- Verificar que todas las tablas se crearon
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar índices
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 📋 RESUMEN DE CAMBIOS REALIZADOS

### ✅ Conversión VARCHAR → TEXT completada en todas las tablas:

**Tabla `prospectos`:**
- ✅ `nombre`, `email`, `telefono`, `whatsapp` → TEXT
- ✅ `ocupacion`, `carrera_interes`, `nivel_educacion` → TEXT  
- ✅ `region`, `ciudad`, `pais` → TEXT
- ✅ `estado`, `nivel_interes`, `fuente` → TEXT

**Tabla `ejecutivos`:**
- ✅ `nombre`, `email`, `telefono` → TEXT
- ✅ `timezone` → TEXT

**Tabla `conversaciones`:**
- ✅ `external_id`, `phone_number`, `contact_name` → TEXT
- ✅ `status`, `priority` → TEXT

**Tabla `mensajes`:**
- ✅ `external_id`, `message_type`, `type` → TEXT
- ✅ `sender_id`, `sender_name` → TEXT

**Tabla `automatizaciones`:**
- ✅ `nombre` → TEXT

**Tabla `automatizacion_ejecuciones`:**
- ✅ `estado` → TEXT

**Tabla `fuentes_leads`:**
- ✅ `nombre`, `tipo` → TEXT
- ✅ `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` → TEXT

**Tabla `leads_tracking`:**
- ✅ `session_id` → TEXT
- ✅ `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` → TEXT
- ✅ `pais`, `ciudad`, `region` → TEXT
- ✅ `formulario_id`, `landing_page_id`, `campana_id` → TEXT

### 🎯 Beneficios del cambio a TEXT:

1. **Mayor flexibilidad:** Sin limitaciones artificiales de longitud
2. **Simplicidad:** Un solo tipo de datos para todos los strings
3. **Futuro-proof:** Facilita cambios y evolución del esquema
4. **Performance:** PostgreSQL optimiza TEXT automáticamente
5. **Compatibilidad:** Mejor integración con ORMs y frameworks

### 📝 Notas importantes:

- ✅ Todos los constraints CHECK se mantienen para validación de datos
- ✅ Índices preservados para optimización de consultas
- ✅ Triggers y funciones actualizados automáticamente
- ✅ Datos de prueba compatibles sin cambios

Este esquema completo soporta todas las funcionalidades del MVP desarrollado con máxima flexibilidad y está optimizado para el rendimiento y escalabilidad del UNIACC ChatBot Dashboard.