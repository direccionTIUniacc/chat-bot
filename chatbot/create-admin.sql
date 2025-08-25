-- Crear usuario administrador para acceder al backoffice
-- Ejecutar en Supabase SQL Editor

-- Insertar ejecutivo admin
INSERT INTO ejecutivos (
    id,
    nombre,
    email,
    telefono,
    rol,
    activo,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Admin UNIACC',
    'admin@uniacc.cl',
    '+56226406000',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verificar creación
SELECT * FROM ejecutivos WHERE email = 'admin@uniacc.cl';

-- Mensaje de confirmación
SELECT '✅ Usuario admin creado - Email: admin@uniacc.cl' as status;
