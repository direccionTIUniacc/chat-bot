create table ejecutivos
(
    id                         uuid                     default gen_random_uuid() not null
        primary key,
    created_at                 timestamp with time zone default now(),
    updated_at                 timestamp with time zone default now(),
    nombre                     text                                               not null,
    email                      text                                               not null
        unique
        constraint valid_email
            check (email ~ '^[^@]+@[^@]+\.[^@]+$'::text),
    telefono                   text,
    avatar_url                 text,
    carreras_especializacion   text[]                   default '{}'::text[],
    regiones_cobertura         text[]                   default '{}'::text[],
    max_prospectos_simultaneos integer                  default 50
        constraint valid_max_prospectos
            check (max_prospectos_simultaneos > 0),
    prospectos_activos         integer                  default 0,
    tasa_conversion            numeric(5, 2)            default 0.00,
    total_conversiones         integer                  default 0,
    horario_inicio             time                     default '09:00:00'::time without time zone,
    horario_fin                time                     default '18:00:00'::time without time zone,
    timezone                   text                     default 'America/Santiago'::text,
    dias_trabajo               integer[]                default '{1,2,3,4,5}'::integer[],
    activo                     boolean                  default true,
    disponible                 boolean                  default true,
    ultimo_login               timestamp with time zone,
    configuracion              jsonb                    default '{}'::jsonb
);

alter table ejecutivos
    owner to postgres;

create index idx_ejecutivos_email
    on ejecutivos (email);

create index idx_ejecutivos_activo
    on ejecutivos (activo);

create index idx_ejecutivos_disponible
    on ejecutivos (disponible);

create index idx_ejecutivos_carreras
    on ejecutivos using gin (carreras_especializacion);

grant delete, insert, references, select, trigger, truncate, update on ejecutivos to anon;

grant delete, insert, references, select, trigger, truncate, update on ejecutivos to authenticated;

grant delete, insert, references, select, trigger, truncate, update on ejecutivos to service_role;

create table prospectos
(
    id                    uuid                     default gen_random_uuid()        not null
        primary key,
    created_at            timestamp with time zone default now(),
    updated_at            timestamp with time zone default now(),
    nombre                text                                                      not null,
    email                 text
        constraint valid_email
            check ((email ~ '^[^@]+@[^@]+\.[^@]+$'::text) OR (email IS NULL)),
    telefono              text,
    whatsapp              text                                                      not null
        constraint valid_whatsapp
            check (whatsapp ~ '^\+?[0-9]{8,15}$'::text),
    edad                  integer,
    ocupacion             text,
    carrera_interes       text,
    nivel_educacion       text,
    experiencia_previa    text,
    region                text,
    ciudad                text,
    pais                  text                     default 'Chile'::text,
    estado                text                     default 'nuevo'::text
        constraint prospectos_estado_check
            check (estado = ANY
                   (ARRAY ['nuevo'::text, 'contactado'::text, 'interesado'::text, 'matriculado'::text, 'descartado'::text])),
    nivel_interes         text                     default 'medio'::text
        constraint prospectos_nivel_interes_check
            check (nivel_interes = ANY
                   (ARRAY ['bajo'::text, 'medio'::text, 'alto'::text, 'muy_alto'::text, 'urgente'::text])),
    assigned_to           uuid
        references ejecutivos,
    ejecutivo_asignado_at timestamp with time zone,
    fuente                text                     default 'whatsapp_bot'::text
        constraint prospectos_fuente_check
            check (fuente = ANY
                   (ARRAY ['whatsapp_bot'::text, 'web_form'::text, 'facebook_ads'::text, 'google_ads'::text, 'referido'::text, 'uniacc_chatbot'::text, 'demo_chatbot'::text, 'asesor_request'::text])),
    metadata              jsonb                    default '{}'::jsonb,
    notas                 text,
    tags                  text[],
    ultimo_contacto       timestamp with time zone,
    proximo_seguimiento   timestamp with time zone,
    facultad_interes      text,
    tipo_consulta         text                     default 'consulta_general'::text not null
        constraint prospectos_tipo_consulta_check
            check (tipo_consulta = ANY
                   (ARRAY ['consulta_general'::text, 'consulta carrera'::text, 'consulta proceso admision'::text, 'consulta costos y/o becas'::text, 'consulta de modalidades de estudio'::text, 'solicitud de asesor'::text, 'ingreso solo datos basicos'::text]))
);

comment on column prospectos.tipo_consulta is 'Tipo de consulta específica según opción del menú: consulta carrera, consulta proceso admision, consulta costos y/o becas, consulta de modalidades de estudio, solicitud de asesor, consulta general. Las solicitudes de asesor se marcan como urgentes.';

alter table prospectos
    owner to postgres;

create index idx_prospectos_whatsapp
    on prospectos (whatsapp);

create index idx_prospectos_email
    on prospectos (email);

create index idx_prospectos_estado
    on prospectos (estado);

create index idx_prospectos_asignado
    on prospectos (assigned_to);

create index idx_prospectos_fuente
    on prospectos (fuente);

create index idx_prospectos_carrera
    on prospectos (carrera_interes);

create index idx_prospectos_region
    on prospectos (region);

create index idx_prospectos_created_at
    on prospectos (created_at);

create index idx_prospectos_facultad_interes
    on prospectos (facultad_interes);

create index idx_prospectos_carrera_interes
    on prospectos (carrera_interes);

create index idx_prospectos_tipo_consulta
    on prospectos (tipo_consulta);

create index idx_prospectos_urgentes
    on prospectos (tipo_consulta, nivel_interes, created_at)
    where (tipo_consulta = 'solicitud de asesor'::text);

create index idx_prospectos_reconocimiento
    on prospectos (whatsapp asc, created_at desc);

comment on index idx_prospectos_reconocimiento is 'Índice optimizado para consultas de reconocimiento de usuarios por WhatsApp y fecha.';

create index idx_prospectos_dashboard_filters
    on prospectos (estado asc, tipo_consulta asc, created_at desc);

create index idx_prospectos_carrera_text_search
    on prospectos using gin (to_tsvector('spanish'::regconfig, COALESCE(carrera_interes, ''::text)));

grant delete, insert, references, select, trigger, truncate, update on prospectos to anon;

grant delete, insert, references, select, trigger, truncate, update on prospectos to authenticated;

grant delete, insert, references, select, trigger, truncate, update on prospectos to service_role;

create table conversaciones
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    created_at      timestamp with time zone default now(),
    updated_at      timestamp with time zone default now(),
    external_id     text
        unique,
    phone_number    text                                               not null,
    contact_name    text,
    prospecto_id    uuid
        references prospectos,
    assigned_to     uuid
        references ejecutivos,
    status          text                     default 'active'::text
        constraint conversaciones_status_check
            check (status = ANY (ARRAY ['active'::text, 'paused'::text, 'closed'::text, 'archived'::text])),
    last_message_at timestamp with time zone default now(),
    message_count   integer                  default 0,
    unread_count    integer                  default 0,
    contact_info    jsonb                    default '{}'::jsonb,
    tags            text[]                   default '{}'::text[],
    priority        text                     default 'normal'::text
        constraint conversaciones_priority_check
            check (priority = ANY (ARRAY ['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
    notas           text
);

alter table conversaciones
    owner to postgres;

create index idx_conversaciones_phone
    on conversaciones (phone_number);

create index idx_conversaciones_prospecto
    on conversaciones (prospecto_id);

create index idx_conversaciones_asignado
    on conversaciones (assigned_to);

create index idx_conversaciones_status
    on conversaciones (status);

create index idx_conversaciones_last_message
    on conversaciones (last_message_at);

grant delete, insert, references, select, trigger, truncate, update on conversaciones to anon;

grant delete, insert, references, select, trigger, truncate, update on conversaciones to authenticated;

grant delete, insert, references, select, trigger, truncate, update on conversaciones to service_role;

create table mensajes
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    created_at      timestamp with time zone default now(),
    conversacion_id uuid
        references conversaciones
            on delete cascade,
    external_id     text,
    content         text                                               not null,
    message_type    text                     default 'text'::text
        constraint mensajes_message_type_check
            check (message_type = ANY
                   (ARRAY ['text'::text, 'image'::text, 'document'::text, 'audio'::text, 'video'::text, 'location'::text, 'contact'::text])),
    type            text                                               not null
        constraint mensajes_type_check
            check (type = ANY (ARRAY ['user'::text, 'bot'::text, 'agent'::text])),
    sender_id       text,
    sender_name     text,
    is_read         boolean                  default false,
    delivered_at    timestamp with time zone,
    read_at         timestamp with time zone,
    metadata        jsonb                    default '{}'::jsonb
);

alter table mensajes
    owner to postgres;

create index idx_mensajes_conversacion
    on mensajes (conversacion_id);

create index idx_mensajes_created_at
    on mensajes (created_at);

create index idx_mensajes_type
    on mensajes (type);

create index idx_mensajes_read
    on mensajes (is_read);

grant delete, insert, references, select, trigger, truncate, update on mensajes to anon;

grant delete, insert, references, select, trigger, truncate, update on mensajes to authenticated;

grant delete, insert, references, select, trigger, truncate, update on mensajes to service_role;

create table automatizaciones
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    created_at      timestamp with time zone default now(),
    updated_at      timestamp with time zone default now(),
    nombre          text                                               not null,
    descripcion     text,
    activa          boolean                  default true,
    trigger_config  jsonb                                              not null,
    actions_config  jsonb                                              not null,
    condiciones     jsonb                    default '{}'::jsonb,
    total_ejecutado integer                  default 0,
    total_exitoso   integer                  default 0,
    total_fallido   integer                  default 0,
    schedule_config jsonb                    default '{}'::jsonb,
    metadata        jsonb                    default '{}'::jsonb,
    created_by      uuid
        references ejecutivos
);

alter table automatizaciones
    owner to postgres;

create index idx_automatizaciones_activa
    on automatizaciones (activa);

create index idx_automatizaciones_created_by
    on automatizaciones (created_by);

grant delete, insert, references, select, trigger, truncate, update on automatizaciones to anon;

grant delete, insert, references, select, trigger, truncate, update on automatizaciones to authenticated;

grant delete, insert, references, select, trigger, truncate, update on automatizaciones to service_role;

create table automatizacion_ejecuciones
(
    id                uuid                     default gen_random_uuid() not null
        primary key,
    created_at        timestamp with time zone default now(),
    automatizacion_id uuid
        references automatizaciones
            on delete cascade,
    prospecto_id      uuid
        references prospectos,
    estado            text                     default 'pendiente'::text
        constraint automatizacion_ejecuciones_estado_check
            check (estado = ANY
                   (ARRAY ['pendiente'::text, 'ejecutando'::text, 'completado'::text, 'fallido'::text, 'cancelado'::text])),
    trigger_data      jsonb                    default '{}'::jsonb,
    resultado         jsonb                    default '{}'::jsonb,
    error_message     text,
    iniciado_at       timestamp with time zone,
    completado_at     timestamp with time zone,
    metadata          jsonb                    default '{}'::jsonb
);

alter table automatizacion_ejecuciones
    owner to postgres;

create index idx_ejecuciones_automatizacion
    on automatizacion_ejecuciones (automatizacion_id);

create index idx_ejecuciones_prospecto
    on automatizacion_ejecuciones (prospecto_id);

create index idx_ejecuciones_estado
    on automatizacion_ejecuciones (estado);

grant delete, insert, references, select, trigger, truncate, update on automatizacion_ejecuciones to anon;

grant delete, insert, references, select, trigger, truncate, update on automatizacion_ejecuciones to authenticated;

grant delete, insert, references, select, trigger, truncate, update on automatizacion_ejecuciones to service_role;

create table fuentes_leads
(
    id                uuid                     default gen_random_uuid() not null
        primary key,
    created_at        timestamp with time zone default now(),
    updated_at        timestamp with time zone default now(),
    nombre            text                                               not null,
    tipo              text                                               not null
        constraint fuentes_leads_tipo_check
            check (tipo = ANY
                   (ARRAY ['formulario_web'::text, 'landing_page'::text, 'facebook_ads'::text, 'google_ads'::text, 'whatsapp_bot'::text, 'referido'::text])),
    url               text,
    activa            boolean                  default true,
    configuracion     jsonb                    default '{}'::jsonb,
    utm_source        text,
    utm_medium        text,
    utm_campaign      text,
    utm_term          text,
    utm_content       text,
    campos_requeridos text[]                   default '{}'::text[],
    campos_opcionales text[]                   default '{}'::text[],
    mensaje_gracias   text,
    redirect_url      text,
    total_leads       integer                  default 0,
    leads_hoy         integer                  default 0,
    tasa_conversion   numeric(5, 2)            default 0.00,
    costo_por_lead    numeric(8, 2),
    metadata          jsonb                    default '{}'::jsonb
);

alter table fuentes_leads
    owner to postgres;

create index idx_fuentes_tipo
    on fuentes_leads (tipo);

create index idx_fuentes_activa
    on fuentes_leads (activa);

create index idx_fuentes_utm_source
    on fuentes_leads (utm_source);

create index idx_fuentes_utm_campaign
    on fuentes_leads (utm_campaign);

grant delete, insert, references, select, trigger, truncate, update on fuentes_leads to anon;

grant delete, insert, references, select, trigger, truncate, update on fuentes_leads to authenticated;

grant delete, insert, references, select, trigger, truncate, update on fuentes_leads to service_role;

create table leads_tracking
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    created_at      timestamp with time zone default now(),
    prospecto_id    uuid
        references prospectos
            on delete cascade,
    fuente_id       uuid
        references fuentes_leads,
    session_id      text,
    ip_address      inet,
    user_agent      text,
    referrer        text,
    utm_source      text,
    utm_medium      text,
    utm_campaign    text,
    utm_term        text,
    utm_content     text,
    pais            text,
    ciudad          text,
    region          text,
    formulario_id   text,
    landing_page_id text,
    campana_id      text,
    primera_visita  timestamp with time zone,
    conversion      timestamp with time zone,
    metadata        jsonb                    default '{}'::jsonb
);

alter table leads_tracking
    owner to postgres;

create index idx_tracking_prospecto
    on leads_tracking (prospecto_id);

create index idx_tracking_fuente
    on leads_tracking (fuente_id);

create index idx_tracking_session
    on leads_tracking (session_id);

create index idx_tracking_utm_campaign
    on leads_tracking (utm_campaign);

grant delete, insert, references, select, trigger, truncate, update on leads_tracking to anon;

grant delete, insert, references, select, trigger, truncate, update on leads_tracking to authenticated;

grant delete, insert, references, select, trigger, truncate, update on leads_tracking to service_role;

create view ejecutivos_metrics
            (id, nombre, email, prospectos_activos, tasa_conversion, total_prospectos, matriculados, prospectos_hoy) as
SELECT e.id,
       e.nombre,
       e.email,
       e.prospectos_activos,
       e.tasa_conversion,
       count(p.id)      AS total_prospectos,
       count(
               CASE
                   WHEN p.estado = 'matriculado'::text THEN 1
                   ELSE NULL::integer
                   END) AS matriculados,
       count(
               CASE
                   WHEN p.created_at >= CURRENT_DATE THEN 1
                   ELSE NULL::integer
                   END) AS prospectos_hoy
FROM ejecutivos e
         LEFT JOIN prospectos p ON e.id = p.assigned_to
WHERE e.activo = true
GROUP BY e.id, e.nombre, e.email, e.prospectos_activos, e.tasa_conversion;

alter table ejecutivos_metrics
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on ejecutivos_metrics to anon;

grant delete, insert, references, select, trigger, truncate, update on ejecutivos_metrics to authenticated;

grant delete, insert, references, select, trigger, truncate, update on ejecutivos_metrics to service_role;

create view fuentes_metrics
            (id, nombre, tipo, total_leads, leads_hoy, tasa_conversion, costo_por_lead, total_tracking_events,
             conversiones) as
SELECT f.id,
       f.nombre,
       f.tipo,
       f.total_leads,
       f.leads_hoy,
       f.tasa_conversion,
       f.costo_por_lead,
       count(t.id)      AS total_tracking_events,
       count(
               CASE
                   WHEN p.estado = 'matriculado'::text THEN 1
                   ELSE NULL::integer
                   END) AS conversiones
FROM fuentes_leads f
         LEFT JOIN leads_tracking t ON f.id = t.fuente_id
         LEFT JOIN prospectos p ON t.prospecto_id = p.id
WHERE f.activa = true
GROUP BY f.id, f.nombre, f.tipo, f.total_leads, f.leads_hoy, f.tasa_conversion, f.costo_por_lead;

alter table fuentes_metrics
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on fuentes_metrics to anon;

grant delete, insert, references, select, trigger, truncate, update on fuentes_metrics to authenticated;

grant delete, insert, references, select, trigger, truncate, update on fuentes_metrics to service_role;

create view usuarios_recurrentes
            (whatsapp, nombre, email, carrera_interes, tipo_consulta, nivel_interes, created_at, recencia,
             consulta_numero) as
SELECT whatsapp,
       nombre,
       email,
       carrera_interes,
       tipo_consulta,
       nivel_interes,
       created_at,
       CASE
           WHEN created_at >= (now() - '7 days'::interval) THEN 'muy_reciente'::text
           WHEN created_at >= (now() - '30 days'::interval) THEN 'reciente'::text
           ELSE 'antiguo'::text
           END                                                            AS recencia,
       row_number() OVER (PARTITION BY whatsapp ORDER BY created_at DESC) AS consulta_numero
FROM prospectos
WHERE whatsapp IS NOT NULL
ORDER BY whatsapp, created_at DESC;

comment on view usuarios_recurrentes is 'Vista optimizada para reconocimiento de usuarios recurrentes con información de recencia y número de consultas.';

alter table usuarios_recurrentes
    owner to postgres;

create function update_updated_at_column() returns trigger
    language plpgsql
as
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

alter function update_updated_at_column() owner to postgres;

create trigger update_ejecutivos_updated_at
    before update
    on ejecutivos
    for each row
execute procedure update_updated_at_column();

create trigger update_prospectos_updated_at
    before update
    on prospectos
    for each row
execute procedure update_updated_at_column();

create trigger update_conversaciones_updated_at
    before update
    on conversaciones
    for each row
execute procedure update_updated_at_column();

create trigger update_automatizaciones_updated_at
    before update
    on automatizaciones
    for each row
execute procedure update_updated_at_column();

create trigger update_fuentes_updated_at
    before update
    on fuentes_leads
    for each row
execute procedure update_updated_at_column();

grant execute on function update_updated_at_column() to anon;

grant execute on function update_updated_at_column() to authenticated;

grant execute on function update_updated_at_column() to service_role;

create function update_ejecutivo_prospectos_count() returns trigger
    language plpgsql
as
$$
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
$$;

alter function update_ejecutivo_prospectos_count() owner to postgres;

create trigger update_ejecutivo_count_trigger
    after update
    on prospectos
    for each row
execute procedure update_ejecutivo_prospectos_count();

grant execute on function update_ejecutivo_prospectos_count() to anon;

grant execute on function update_ejecutivo_prospectos_count() to authenticated;

grant execute on function update_ejecutivo_prospectos_count() to service_role;

create function update_fuente_stats() returns trigger
    language plpgsql
as
$$
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
$$;

alter function update_fuente_stats() owner to postgres;

create trigger update_fuente_stats_trigger
    after insert or update
    on prospectos
    for each row
execute procedure update_fuente_stats();

grant execute on function update_fuente_stats() to anon;

grant execute on function update_fuente_stats() to authenticated;

grant execute on function update_fuente_stats() to service_role;

create function process_botpress_webhook(webhook_data jsonb) returns jsonb
    language plpgsql
as
$$
DECLARE
    result JSONB := '{"success": true}';
    prospecto_id UUID;
    conversacion_id UUID;
BEGIN
    -- Lógica de procesamiento implementada en el código TypeScript
    -- Esta función puede usarse para validaciones adicionales
    RETURN result;
END;
$$;

alter function process_botpress_webhook(jsonb) owner to postgres;

grant execute on function process_botpress_webhook(jsonb) to anon;

grant execute on function process_botpress_webhook(jsonb) to authenticated;

grant execute on function process_botpress_webhook(jsonb) to service_role;

create function get_prospectos_stats() returns json
    security definer
    language plpgsql
as
$$
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

alter function get_prospectos_stats() owner to postgres;

create function get_usuario_recurrente(p_whatsapp text, p_dias_limite integer DEFAULT 30)
    returns TABLE(id uuid, nombre text, email text, carrera_interes text, tipo_consulta text, created_at timestamp with time zone, es_reciente boolean)
    language plpgsql
as
$$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nombre,
    p.email,
    p.carrera_interes,
    p.tipo_consulta,
    p.created_at,
    (p.created_at >= NOW() - INTERVAL '1 day' * p_dias_limite) as es_reciente
  FROM prospectos p
  WHERE p.whatsapp = p_whatsapp
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$;

comment on function get_usuario_recurrente(text, integer) is 'Función para obtener información de usuarios recurrentes por WhatsApp. Usado para reconocimiento automático en múltiples consultas.';

alter function get_usuario_recurrente(text, integer) owner to postgres;

create function upsert_prospecto_por_whatsapp(p_whatsapp text, p_nombre text, p_email text DEFAULT NULL::text, p_telefono text DEFAULT NULL::text, p_carrera_interes text DEFAULT NULL::text, p_facultad_interes text DEFAULT NULL::text, p_tipo_consulta text DEFAULT 'consulta_general'::text, p_nivel_interes text DEFAULT 'alto'::text, p_fuente text DEFAULT 'uniacc_chatbot'::text, p_metadata jsonb DEFAULT '{}'::jsonb, p_horas_limite integer DEFAULT 24)
    returns TABLE(prospecto_id uuid, es_nuevo boolean, mensaje text)
    language plpgsql
as
$$
DECLARE
  existing_prospecto_id UUID;
  new_prospecto_id UUID;
BEGIN
  -- Verificar si existe un prospecto reciente con el mismo WhatsApp
  SELECT id INTO existing_prospecto_id
  FROM prospectos
  WHERE whatsapp = p_whatsapp
    AND created_at >= NOW() - INTERVAL '1 hour' * p_horas_limite
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si existe un prospecto reciente, retornarlo
  IF existing_prospecto_id IS NOT NULL THEN
    RETURN QUERY SELECT
      existing_prospecto_id,
      false,
      'Prospecto existente encontrado (anti-duplicados)'::text;
    RETURN;
  END IF;

  -- Si no existe, crear nuevo prospecto
  INSERT INTO prospectos (
    nombre, email, telefono, whatsapp,
    carrera_interes, facultad_interes, tipo_consulta,
    nivel_interes, fuente, metadata
  ) VALUES (
    p_nombre, p_email, p_telefono, p_whatsapp,
    p_carrera_interes, p_facultad_interes, p_tipo_consulta,
    p_nivel_interes, p_fuente, p_metadata
  ) RETURNING id INTO new_prospecto_id;

  RETURN QUERY SELECT
    new_prospecto_id,
    true,
    'Nuevo prospecto creado exitosamente'::text;

END;
$$;

comment on function upsert_prospecto_por_whatsapp(text, text, text, text, text, text, text, text, text, jsonb, integer) is 'Función anti-duplicados que crea nuevos prospectos solo si no existe uno reciente (24h por defecto) del mismo WhatsApp.';

alter function upsert_prospecto_por_whatsapp(text, text, text, text, text, text, text, text, text, jsonb, integer) owner to postgres;

create function update_prospecto_metadata() returns trigger
    language plpgsql
as
$$
BEGIN
  -- Contar consultas previas del mismo usuario
  NEW.metadata = NEW.metadata || jsonb_build_object(
    'consultas_previas', (
      SELECT COUNT(*)
      FROM prospectos
      WHERE whatsapp = NEW.whatsapp
      AND created_at < NEW.created_at
    ),
    'es_usuario_recurrente', (
      SELECT COUNT(*) > 0
      FROM prospectos
      WHERE whatsapp = NEW.whatsapp
      AND created_at < NEW.created_at
    ),
    'ultima_actualizacion', NOW()
  );

  RETURN NEW;
END;
$$;

alter function update_prospecto_metadata() owner to postgres;

create trigger trigger_update_prospecto_metadata
    before insert
    on prospectos
    for each row
execute procedure update_prospecto_metadata();

