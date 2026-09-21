-- ====================================================================
-- CASE Enterprise Studio (PUDS) — Base de Datos PostgreSQL
-- Archivo de Inicialización Automática para AWS y Docker
-- ====================================================================

-- 1. Tabla de Usuarios del Sistema con Roles PUDS
CREATE TABLE IF NOT EXISTS system_users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('Analista', 'Diseñador', 'Implementador', 'Administrador')),
    color VARCHAR(16) DEFAULT '#3b82f6',
    status VARCHAR(16) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Proyectos y Fases de Software
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    client VARCHAR(150) NOT NULL,
    status VARCHAR(32) DEFAULT 'Diseño',
    puds_phase VARCHAR(32) DEFAULT 'Elaboración',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tablas de Demostración del Dominio Activo (Gestión Veterinaria)
CREATE TABLE IF NOT EXISTS clientes (
    id BIGSERIAL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    direccion VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS veterinarios (
    id BIGSERIAL PRIMARY KEY,
    matricula VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    especialidad VARCHAR(100),
    telefono VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mascotas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(50),
    fecha_nacimiento DATE,
    cliente_id BIGINT REFERENCES clientes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citas_medicas (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    diagnostico TEXT,
    costo DECIMAL(10,2) DEFAULT 0.00,
    mascota_id BIGINT REFERENCES mascotas(id) ON DELETE CASCADE,
    veterinario_id BIGINT REFERENCES veterinarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- SEEDERS INICIALES (Datos de Prueba en Español)
-- ====================================================================

-- Usuarios PUDS institucionales
INSERT INTO system_users (id, name, email, role, color, status) VALUES
('usr_migue', 'Migue', 'migue.director@case-enterprise.com', 'Administrador', '#f59e0b', 'active'),
('usr_sofia', 'Lic. Sofía Reyes', 'sofia.analista@case-enterprise.com', 'Analista', '#3b82f6', 'active'),
('usr_alex', 'Ing. Alex Rivera', 'alex.desarrollador@case-enterprise.com', 'Implementador', '#10b981', 'active'),
('usr_carlos', 'Arq. Carlos Mendoza', 'carlos.disenador@case-enterprise.com', 'Diseñador', '#a855f7', 'active')
ON CONFLICT (id) DO NOTHING;

-- Proyecto inicial
INSERT INTO projects (id, name, client, status, puds_phase) VALUES
('proj_veterinaria_1', 'Sistema de Gestión Veterinaria', 'Clínica Veterinaria San Roque', 'Diseño', 'Elaboración')
ON CONFLICT (id) DO NOTHING;

-- Clientes iniciales
INSERT INTO clientes (id, dni, nombre_completo, telefono, direccion) VALUES
(1, '74839201', 'Carlos Mendoza', '+591 71234567', 'Av. Las Palmas #420'),
(2, '78493021', 'Sofía Reyes', '+591 71239988', 'Calle Comercio #102'),
(3, '84930128', 'Juan Pablo Gómez', '+591 70011223', 'Av. América #890')
ON CONFLICT (id) DO NOTHING;

-- Veterinarios iniciales
INSERT INTO veterinarios (id, matricula, nombre, especialidad, telefono) VALUES
(1, 'VET-8832', 'Dra. Elena Ramos', 'Cirugía Menor', '+591 79876543'),
(2, 'VET-4410', 'Dr. Martín Cáceres', 'Medicina Felina', '+591 76543210')
ON CONFLICT (id) DO NOTHING;

-- Mascotas iniciales
INSERT INTO mascotas (id, nombre, especie, raza, fecha_nacimiento, cliente_id) VALUES
(1, 'Rocky', 'Canino', 'Golden Retriever', '2023-04-10', 1),
(2, 'Toby', 'Canino', 'Beagle', '2022-08-15', 2),
(3, 'Luna', 'Felino', 'Siamés', '2024-01-20', 3)
ON CONFLICT (id) DO NOTHING;

-- Citas iniciales
INSERT INTO citas_medicas (id, fecha, motivo, diagnostico, costo, mascota_id, veterinario_id) VALUES
(1, '2026-09-18', 'Control anual y vacunación', 'Paciente sano, administrada vacuna sextuple', 120.00, 1, 1),
(2, '2026-09-19', 'Revisión dental', 'Limpieza dental recomendada', 85.00, 2, 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));
SELECT setval('veterinarios_id_seq', (SELECT MAX(id) FROM veterinarios));
SELECT setval('mascotas_id_seq', (SELECT MAX(id) FROM mascotas));
SELECT setval('citas_medicas_id_seq', (SELECT MAX(id) FROM citas_medicas));
