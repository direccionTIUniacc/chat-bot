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

create trigger update_ejecutivos_updated_at
    before update
    on ejecutivos
    for each row
execute procedure update_updated_at_column();

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

create trigger update_prospectos_updated_at
    before update
    on prospectos
    for each row
execute procedure update_updated_at_column();

create trigger update_ejecutivo_count_trigger
    after update
    on prospectos
    for each row
execute procedure update_ejecutivo_prospectos_count();

create trigger update_fuente_stats_trigger
    after insert or update
    on prospectos
    for each row
execute procedure update_fuente_stats();

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

create trigger update_conversaciones_updated_at
    before update
    on conversaciones
    for each row
execute procedure update_updated_at_column();

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

create trigger update_automatizaciones_updated_at
    before update
    on automatizaciones
    for each row
execute procedure update_updated_at_column();

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

create trigger update_fuentes_updated_at
    before update
    on fuentes_leads
    for each row
execute procedure update_updated_at_column();

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

