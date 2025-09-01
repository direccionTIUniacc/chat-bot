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
        references ??? (),
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
        references ??? ()
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

create table prospecto_actual
(
    whatsapp              text not null
        primary key,
    nombre                text not null,
    email                 text,
    telefono              text,
    edad                  integer,
    region                text,
    ciudad                text,
    pais                  text                     default 'Chile'::text,
    carrera_interes       text                     default 'Sin especificar'::text,
    facultad_interes      text                     default ''::text,
    nivel_interes         text                     default 'medio'::text
        constraint prospecto_actual_nivel_interes_check
            check (nivel_interes = ANY
                   (ARRAY ['bajo'::text, 'medio'::text, 'alto'::text, 'muy_alto'::text, 'urgente'::text])),
    estado                text                     default 'nuevo'::text
        constraint prospecto_actual_estado_check
            check (estado = ANY
                   (ARRAY ['nuevo'::text, 'contactado'::text, 'interesado'::text, 'matriculado'::text, 'descartado'::text, 'recurrente'::text, 'frecuente'::text, 'activo'::text])),
    assigned_to           uuid
        references ejecutivos,
    ejecutivo_asignado_at timestamp with time zone,
    ultimo_contacto       timestamp with time zone,
    proximo_seguimiento   timestamp with time zone,
    total_sesiones        integer                  default 1,
    primera_interaccion   timestamp with time zone default now(),
    ultima_interaccion    timestamp with time zone default now(),
    tipo_consulta_actual  text,
    perfil_usuario        text generated always as (
        CASE
            WHEN ((total_sesiones = 1) AND (tipo_consulta_actual ~~ 'abandono%'::text)) THEN 'abandono_inicial'::text
            WHEN ((total_sesiones > 1) AND (tipo_consulta_actual !~~ 'abandono%'::text)) THEN 'reconvertido'::text
            WHEN (total_sesiones > 3) THEN 'altamente_interesado'::text
            WHEN (carrera_interes <> 'Sin especificar'::text) THEN 'interes_definido'::text
            ELSE 'exploratorio'::text
            END) stored,
    es_prioritario        boolean generated always as (((total_sesiones > 2) OR (nivel_interes = ANY
                                                                                 (ARRAY ['alto'::text, 'muy_alto'::text, 'urgente'::text])) OR
                                                        (tipo_consulta_actual = 'solicitar_asesor'::text))) stored,
    fuente                text                     default 'uniacc_chatbot'::text,
    utm_source            text,
    utm_campaign          text,
    metadata              jsonb                    default '{}'::jsonb,
    notas                 text,
    tags                  text[],
    created_at            timestamp with time zone default now(),
    updated_at            timestamp with time zone default now()
);

comment on table prospecto_actual is 'Estado actual de cada prospecto. Optimizada para consultas frecuentes del dashboard. 1 registro por WhatsApp.';

comment on constraint prospecto_actual_estado_check on prospecto_actual is 'Estados permitidos incluyendo recurrente y frecuente para análisis de comportamiento';

alter table prospecto_actual
    owner to postgres;

create table conversaciones
(
    id                   uuid                     default gen_random_uuid() not null
        primary key,
    created_at           timestamp with time zone default now(),
    updated_at           timestamp with time zone default now(),
    external_id          text
        unique,
    phone_number         text                                               not null,
    contact_name         text,
    prospecto_id         text
        references prospecto_actual,
    assigned_to          uuid
        references ejecutivos,
    status               text                     default 'active'::text
        constraint conversaciones_status_check
            check (status = ANY (ARRAY ['active'::text, 'paused'::text, 'closed'::text, 'archived'::text])),
    last_message_at      timestamp with time zone default now(),
    message_count        integer                  default 0,
    unread_count         integer                  default 0,
    contact_info         jsonb                    default '{}'::jsonb,
    tags                 text[]                   default '{}'::text[],
    priority             text                     default 'normal'::text
        constraint conversaciones_priority_check
            check (priority = ANY (ARRAY ['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
    notas                text,
    handoff_status       text                     default 'bot'::text
        constraint conversaciones_handoff_status_check
            check (handoff_status = ANY (ARRAY ['bot'::text, 'queued'::text, 'agent'::text, 'resolved'::text])),
    handoff_requested_at timestamp with time zone,
    handoff_accepted_at  timestamp with time zone,
    agent_last_activity  timestamp with time zone
);

alter table conversaciones
    owner to postgres;

create index idx_conversaciones_phone
    on conversaciones (phone_number);

create index idx_conversaciones_asignado
    on conversaciones (assigned_to);

create index idx_conversaciones_status
    on conversaciones (status);

create index idx_conversaciones_last_message
    on conversaciones (last_message_at);

create index idx_conversaciones_prospecto
    on conversaciones (prospecto_id);

create index idx_conversaciones_handoff_status
    on conversaciones (handoff_status, handoff_requested_at);

create index idx_conversaciones_ejecutivo_activo
    on conversaciones (assigned_to, status)
    where ((assigned_to IS NOT NULL) AND (status = 'active'::text));

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

create index idx_actual_prioridad
    on prospecto_actual (es_prioritario, nivel_interes, ultima_interaccion);

create index idx_actual_perfil
    on prospecto_actual (perfil_usuario, total_sesiones);

create index idx_actual_asignacion
    on prospecto_actual (assigned_to, estado)
    where (assigned_to IS NOT NULL);

create index idx_actual_seguimiento
    on prospecto_actual (proximo_seguimiento)
    where (proximo_seguimiento IS NOT NULL);

create index idx_actual_carrera
    on prospecto_actual (carrera_interes, facultad_interes)
    where (carrera_interes <> 'Sin especificar'::text);

create index idx_actual_actividad
    on prospecto_actual (ultima_interaccion desc);

create index idx_actual_utm
    on prospecto_actual (utm_source, utm_campaign)
    where (utm_source IS NOT NULL);

create table prospecto_historial
(
    id                      uuid                     default gen_random_uuid() not null
        primary key,
    whatsapp                text                                               not null,
    sesion_numero           integer                                            not null,
    tipo_consulta           text                                               not null,
    nombre                  text                                               not null,
    email                   text,
    telefono                text,
    edad                    integer,
    region                  text,
    carrera_interes         text                     default 'Sin especificar'::text,
    facultad_interes        text                     default ''::text,
    nivel_interes           text                     default 'medio'::text,
    duracion_sesion         interval,
    mensajes_intercambiados integer                  default 0,
    flujo_completado        boolean                  default false,
    razon_finalizacion      text                     default 'completado'::text
        constraint prospecto_historial_razon_finalizacion_check
            check (razon_finalizacion = ANY
                   (ARRAY ['completado'::text, 'timeout'::text, 'abandono'::text, 'derivado_asesor'::text])),
    paso_abandono           text,
    datos_capturados        jsonb                    default '{}'::jsonb,
    sesion_inicio           timestamp with time zone default now(),
    sesion_fin              timestamp with time zone,
    created_at              timestamp with time zone default now(),
    fuente                  text                     default 'uniacc_chatbot'::text,
    metadata                jsonb                    default '{}'::jsonb,
    evolucion_interes       text generated always as (
        CASE
            WHEN ((carrera_interes <> 'Sin especificar'::text) AND (sesion_numero = 1)) THEN 'interes_inicial'::text
            WHEN ((carrera_interes <> 'Sin especificar'::text) AND (sesion_numero > 1)) THEN 'definicion_interes'::text
            WHEN ((tipo_consulta ~~ 'abandono%'::text) AND (sesion_numero = 1)) THEN 'abandono_inicial'::text
            WHEN ((tipo_consulta !~~ 'abandono%'::text) AND (sesion_numero > 1)) THEN 'reconversion'::text
            ELSE 'exploracion'::text
            END) stored,
    unique (whatsapp, sesion_numero)
);

comment on table prospecto_historial is 'Historial completo de todas las sesiones. Optimizada para analytics y reporting. Múltiples registros por WhatsApp.';

alter table prospecto_historial
    owner to postgres;

create index idx_historial_whatsapp_sesion
    on prospecto_historial (whatsapp, sesion_numero);

create index idx_historial_fecha
    on prospecto_historial (created_at desc);

create index idx_historial_evolucion
    on prospecto_historial (evolucion_interes, carrera_interes);

create index idx_historial_reconversion
    on prospecto_historial (whatsapp, sesion_numero)
    where (sesion_numero > 1);

create index idx_historial_abandono
    on prospecto_historial (razon_finalizacion, paso_abandono)
    where (razon_finalizacion = ANY (ARRAY ['timeout'::text, 'abandono'::text]));

create index idx_historial_tipo_consulta
    on prospecto_historial (tipo_consulta, created_at);

create index idx_historial_duracion
    on prospecto_historial (duracion_sesion)
    where (duracion_sesion IS NOT NULL);

create view dashboard_prospectos
            (whatsapp, nombre, email, telefono, carrera_interes, facultad_interes, nivel_interes, estado,
             perfil_usuario, total_sesiones, es_prioritario, primera_interaccion, ultima_interaccion, assigned_to,
             proximo_seguimiento, recencia, horas_engagement)
as
SELECT whatsapp,
       nombre,
       email,
       telefono,
       carrera_interes,
       facultad_interes,
       nivel_interes,
       estado,
       perfil_usuario,
       total_sesiones,
       es_prioritario,
       primera_interaccion,
       ultima_interaccion,
       assigned_to,
       proximo_seguimiento,
       CASE
           WHEN ultima_interaccion >= (now() - '01:00:00'::interval) THEN 'muy_reciente'::text
           WHEN ultima_interaccion >= (now() - '1 day'::interval) THEN 'reciente'::text
           WHEN ultima_interaccion >= (now() - '7 days'::interval) THEN 'esta_semana'::text
           ELSE 'antigua'::text
           END                                                                      AS recencia,
       EXTRACT(epoch FROM ultima_interaccion - primera_interaccion) / 3600::numeric AS horas_engagement
FROM prospecto_actual
ORDER BY es_prioritario DESC, ultima_interaccion DESC;

comment on view dashboard_prospectos is 'Vista optimizada para el dashboard principal con métricas pre-calculadas.';

alter table dashboard_prospectos
    owner to postgres;

create view analytics_reconversion
            (fecha, nuevos_usuarios, usuarios_reconvertidos, tasa_reconversion_pct, promedio_sesiones_por_dia) as
WITH stats_diarias AS (SELECT date_trunc('day'::text, prospecto_historial.created_at)       AS fecha,
                              count(*) FILTER (WHERE prospecto_historial.sesion_numero = 1) AS nuevos_usuarios,
                              count(*) FILTER (WHERE prospecto_historial.sesion_numero > 1) AS sesiones_reconversion,
                              count(DISTINCT prospecto_historial.whatsapp)
                              FILTER (WHERE prospecto_historial.sesion_numero > 1)          AS usuarios_reconvertidos,
                              avg(prospecto_historial.sesion_numero)                        AS promedio_sesiones_por_dia
                       FROM prospecto_historial
                       WHERE prospecto_historial.created_at >= (CURRENT_DATE - '30 days'::interval)
                       GROUP BY (date_trunc('day'::text, prospecto_historial.created_at)))
SELECT fecha,
       nuevos_usuarios,
       usuarios_reconvertidos,
       round(usuarios_reconvertidos::numeric * 100.0 / NULLIF(nuevos_usuarios, 0)::numeric, 2) AS tasa_reconversion_pct,
       promedio_sesiones_por_dia
FROM stats_diarias
ORDER BY fecha DESC;

comment on view analytics_reconversion is 'Vista de analytics con métricas de reconversión por día de los últimos 30 días.';

alter table analytics_reconversion
    owner to postgres;

create view metricas_carreras
            (carrera_interes, usuarios_unicos, total_consultas, promedio_sesiones_por_usuario, reconversiones,
             duracion_promedio_sesion)
as
SELECT carrera_interes,
       count(DISTINCT whatsapp)                                              AS usuarios_unicos,
       count(*)                                                              AS total_consultas,
       round(count(*)::numeric * 1.0 / count(DISTINCT whatsapp)::numeric, 2) AS promedio_sesiones_por_usuario,
       count(*) FILTER (WHERE evolucion_interes = 'reconversion'::text)      AS reconversiones,
       avg(duracion_sesion) FILTER (WHERE duracion_sesion IS NOT NULL)       AS duracion_promedio_sesion
FROM prospecto_historial
WHERE carrera_interes <> 'Sin especificar'::text
  AND created_at >= (CURRENT_DATE - '30 days'::interval)
GROUP BY carrera_interes
HAVING count(DISTINCT whatsapp) >= 2
ORDER BY (count(DISTINCT whatsapp)) DESC;

alter table metricas_carreras
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

create trigger update_prospecto_actual_updated_at
    before update
    on prospecto_actual
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

create function sync_prospecto_actual() returns trigger
    language plpgsql
as
$$
BEGIN
  -- Insertar o actualizar en tabla principal automáticamente
  INSERT INTO prospecto_actual (
    whatsapp,
    nombre,
    email,
    telefono,
    edad,
    region,
    ciudad,
    carrera_interes,
    facultad_interes,
    nivel_interes,
    tipo_consulta_actual,
    total_sesiones,
    primera_interaccion,
    ultima_interaccion,
    fuente,
    metadata
  ) VALUES (
    NEW.whatsapp,
    NEW.nombre,
    NEW.email,
    NEW.telefono,
    NEW.edad,
    NEW.region,
    NEW.ciudad,
    NEW.carrera_interes,
    NEW.facultad_interes,
    NEW.nivel_interes,
    NEW.tipo_consulta,
    NEW.sesion_numero,
    CASE WHEN NEW.sesion_numero = 1 THEN NEW.created_at
         ELSE (SELECT MIN(created_at) FROM prospecto_historial WHERE whatsapp = NEW.whatsapp)
    END,
    NEW.created_at,
    NEW.fuente,
    NEW.metadata
  )
  ON CONFLICT (whatsapp) DO UPDATE SET
    -- Solo actualizar si es la sesión más reciente
    nombre = CASE WHEN EXCLUDED.total_sesiones >= prospecto_actual.total_sesiones
                  THEN EXCLUDED.nombre ELSE prospecto_actual.nombre END,
    email = COALESCE(EXCLUDED.email, prospecto_actual.email),
    telefono = COALESCE(EXCLUDED.telefono, prospecto_actual.telefono),
    edad = COALESCE(EXCLUDED.edad, prospecto_actual.edad),
    region = COALESCE(EXCLUDED.region, prospecto_actual.region),
    ciudad = COALESCE(EXCLUDED.ciudad, prospecto_actual.ciudad),
    carrera_interes = CASE WHEN EXCLUDED.total_sesiones >= prospecto_actual.total_sesiones
                           THEN EXCLUDED.carrera_interes ELSE prospecto_actual.carrera_interes END,
    facultad_interes = CASE WHEN EXCLUDED.total_sesiones >= prospecto_actual.total_sesiones
                            THEN EXCLUDED.facultad_interes ELSE prospecto_actual.facultad_interes END,
    nivel_interes = CASE WHEN EXCLUDED.total_sesiones >= prospecto_actual.total_sesiones
                         THEN EXCLUDED.nivel_interes ELSE prospecto_actual.nivel_interes END,
    tipo_consulta_actual = CASE WHEN EXCLUDED.total_sesiones >= prospecto_actual.total_sesiones
                                THEN EXCLUDED.tipo_consulta_actual ELSE prospecto_actual.tipo_consulta_actual END,
    total_sesiones = EXCLUDED.total_sesiones,
    ultima_interaccion = CASE WHEN EXCLUDED.ultima_interaccion > prospecto_actual.ultima_interaccion
                              THEN EXCLUDED.ultima_interaccion ELSE prospecto_actual.ultima_interaccion END,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

alter function sync_prospecto_actual() owner to postgres;

create function insertar_sesion_prospecto(p_whatsapp text, p_nombre text, p_email text DEFAULT NULL::text, p_telefono text DEFAULT NULL::text, p_edad integer DEFAULT NULL::integer, p_region text DEFAULT NULL::text, p_carrera_interes text DEFAULT 'Sin especificar'::text, p_facultad_interes text DEFAULT ''::text, p_tipo_consulta text DEFAULT 'consulta_general'::text, p_nivel_interes text DEFAULT 'medio'::text, p_fuente text DEFAULT 'uniacc_chatbot'::text, p_datos_capturados jsonb DEFAULT '{}'::jsonb, p_duracion_sesion interval DEFAULT NULL::interval, p_mensajes integer DEFAULT 0, p_flujo_completado boolean DEFAULT false, p_razon_finalizacion text DEFAULT 'completado'::text, p_paso_abandono text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
    returns TABLE(historial_id uuid, sesion_numero integer, es_nuevo_usuario boolean, perfil_usuario text)
    language plpgsql
as
$$
DECLARE
  nuevo_sesion_numero INTEGER;
  new_historial_id UUID;
  es_nuevo BOOLEAN;
  perfil TEXT;
BEGIN
  -- Verificar si es usuario nuevo
  SELECT COUNT(*) = 0 INTO es_nuevo
  FROM prospecto_historial
  WHERE whatsapp = p_whatsapp;

  -- Obtener siguiente número de sesión
  SELECT COALESCE(MAX(h.sesion_numero), 0) + 1
  INTO nuevo_sesion_numero
  FROM prospecto_historial h
  WHERE h.whatsapp = p_whatsapp;

  -- Determinar perfil del usuario
  perfil := CASE
    WHEN es_nuevo THEN 'nuevo'
    WHEN nuevo_sesion_numero = 2 THEN 'recurrente_temprano'
    WHEN nuevo_sesion_numero <= 5 THEN 'recurrente_medio'
    ELSE 'recurrente_avanzado'
  END;

  -- 1️⃣ INSERTAR EN HISTORIAL (como antes)
  INSERT INTO prospecto_historial (
    whatsapp,
    nombre,
    email,
    telefono,
    edad,
    region,
    carrera_interes,
    facultad_interes,
    tipo_consulta,
    nivel_interes,
    fuente,
    datos_capturados,
    sesion_numero,
    duracion_sesion,
    mensajes_intercambiados,
    flujo_completado,
    razon_finalizacion,
    paso_abandono,
    metadata
  ) VALUES (
    p_whatsapp,
    p_nombre,
    p_email,
    p_telefono,
    p_edad,
    p_region,
    p_carrera_interes,
    p_facultad_interes,
    p_tipo_consulta,
    p_nivel_interes,
    p_fuente,
    p_datos_capturados,
    nuevo_sesion_numero,
    p_duracion_sesion,
    p_mensajes,
    p_flujo_completado,
    p_razon_finalizacion,
    p_paso_abandono,
    p_metadata
  ) RETURNING id INTO new_historial_id;

  -- 2️⃣ UPSERT EN PROSPECTO_ACTUAL (manual, sin trigger)
  INSERT INTO prospecto_actual (
    whatsapp,
    nombre,
    email,
    telefono,
    edad,
    region,
    carrera_interes,
    facultad_interes,
    nivel_interes,
    estado,
    tipo_consulta_actual,
    total_sesiones,
    ultima_interaccion,
    fuente,
    metadata
  ) VALUES (
    p_whatsapp,
    p_nombre,
    p_email,
    p_telefono,
    p_edad,
    p_region,
    p_carrera_interes,
    p_facultad_interes,
    p_nivel_interes,
    CASE WHEN es_nuevo THEN 'nuevo' ELSE 'recurrente' END,
    p_tipo_consulta,
    nuevo_sesion_numero,
    NOW(),
    p_fuente,
    p_metadata
  )
  ON CONFLICT (whatsapp) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = COALESCE(EXCLUDED.email, prospecto_actual.email),
    telefono = COALESCE(EXCLUDED.telefono, prospecto_actual.telefono),
    edad = COALESCE(EXCLUDED.edad, prospecto_actual.edad),
    region = COALESCE(EXCLUDED.region, prospecto_actual.region),
    carrera_interes = EXCLUDED.carrera_interes,
    facultad_interes = EXCLUDED.facultad_interes,
    nivel_interes = EXCLUDED.nivel_interes,
    estado = CASE
      WHEN EXCLUDED.total_sesiones = 1 THEN 'nuevo'
      WHEN EXCLUDED.total_sesiones <= 3 THEN 'recurrente'
      ELSE 'frecuente'
    END,
    tipo_consulta_actual = EXCLUDED.tipo_consulta_actual,
    total_sesiones = EXCLUDED.total_sesiones,
    ultima_interaccion = NOW(),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN QUERY SELECT new_historial_id, nuevo_sesion_numero, es_nuevo, perfil;
END;
$$;

comment on function insertar_sesion_prospecto(text, text, text, text, integer, text, text, text, text, text, text, jsonb, interval, integer, boolean, text, text, jsonb) is 'Función híbrida: inserta en historial + mantiene prospecto_actual actualizado. Sin triggers externos.';

alter function insertar_sesion_prospecto(text, text, text, text, integer, text, text, text, text, text, text, jsonb, interval, integer, boolean, text, text, jsonb) owner to postgres;

create function sync_conversacion_prospecto() returns trigger
    language plpgsql
as
$$
BEGIN
  -- Cuando se asigna un ejecutivo a una conversación,
  -- sincronizar con prospecto_actual
  IF NEW.assigned_to IS NOT NULL AND
     (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN

    UPDATE prospecto_actual
    SET
      assigned_to = NEW.assigned_to,
      ejecutivo_asignado_at = NOW(),
      estado = CASE
        WHEN estado = 'nuevo' THEN 'contactado'
        ELSE estado
      END,
      ultimo_contacto = NOW(),
      updated_at = NOW()
    WHERE whatsapp = NEW.prospecto_id;

  END IF;

  RETURN NEW;
END;
$$;

alter function sync_conversacion_prospecto() owner to postgres;

create trigger trigger_sync_conversacion_prospecto
    after update
    on conversaciones
    for each row
execute procedure sync_conversacion_prospecto();

