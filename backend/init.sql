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

-- 4. Tablas del Dominio Farmacéutico
CREATE TABLE IF NOT EXISTS proveedores (
    id BIGSERIAL PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    nit VARCHAR(30) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    direccion VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicamentos (
    id BIGSERIAL PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    nombre_comercial VARCHAR(120) NOT NULL,
    principio_activo VARCHAR(120) NOT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lotes (
    id BIGSERIAL PRIMARY KEY,
    numero_lote VARCHAR(50) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    stock_actual INTEGER DEFAULT 0,
    medicamento_id BIGINT REFERENCES medicamentos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
    id BIGSERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cliente_nombre VARCHAR(120) NOT NULL,
    estado VARCHAR(30) DEFAULT 'Completada'
);

-- 5. Tablas del Dominio E-Commerce Multitienda
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(30) DEFAULT 'Cliente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'Pendiente',
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- SEEDERS INICIALES (Datos de Prueba en Español)
-- ====================================================================

-- Proyectos iniciales
INSERT INTO projects (id, name, client, status, puds_phase) VALUES
('proj_veterinaria_1', 'Sistema de Gestión Veterinaria', 'Clínica Veterinaria San Roque', 'Diseño', 'Elaboración'),
('proj_farmacia_1', 'Sistema de Farmacia & Lotes', 'Farmacias del Sur S.A.', 'Normalización', 'Elaboración'),
('proj_ecommerce_1', 'Plataforma E-Commerce Multitienda', 'Retail Express Corp', 'Implementación', 'Construcción')
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

-- Proveedores iniciales
INSERT INTO proveedores (id, razon_social, nit, telefono, direccion) VALUES
(1, 'Laboratorios Farmacéuticos Andinos', '1029384756', '+591 2 2456789', 'Zona Industrial #500'),
(2, 'Distribuidora Médica Global S.R.L.', '9847362019', '+591 3 3341122', 'Av. Banzer Km 6'),
(3, 'Insumos Hospitalarios Santa Cruz', '5566778899', '+591 4 4567890', 'Calle Sucre #230')
ON CONFLICT (id) DO NOTHING;

-- Medicamentos iniciales
INSERT INTO medicamentos (id, codigo_barras, nombre_comercial, principio_activo, precio, stock) VALUES
(1, '7771234567890', 'Amoxicilina 500mg', 'Amoxicilina Trihidrato', 15.50, 120),
(2, '7779876543210', 'Ibuprofeno Forte 400mg', 'Ibuprofeno', 8.00, 250),
(3, '7774561237895', 'Paracetamol Jarabe 120ml', 'Paracetamol', 12.00, 80)
ON CONFLICT (id) DO NOTHING;

-- Lotes iniciales
INSERT INTO lotes (id, numero_lote, fecha_vencimiento, stock_actual, medicamento_id) VALUES
(1, 'LT-2026-09A', '2028-06-30', 120, 1),
(2, 'LT-2026-11C', '2027-12-15', 250, 2)
ON CONFLICT (id) DO NOTHING;

-- Ventas iniciales
INSERT INTO ventas (id, fecha_hora, total, cliente_nombre, estado) VALUES
(1, '2026-09-20 10:30:00', 45.50, 'Mariana Flores', 'Completada'),
(2, '2026-09-21 15:45:00', 112.00, 'Roberto Vaca', 'Completada')
ON CONFLICT (id) DO NOTHING;

-- Usuarios tienda iniciales
INSERT INTO usuarios (id, email, nombre, rol) VALUES
(1, 'cliente.vip@gmail.com', 'Diego Morales', 'Cliente'),
(2, 'laura.compras@empresa.bo', 'Laura Paz', 'Cliente'),
(3, 'admin.store@tienda.com', 'Administrador Tienda', 'Admin')
ON CONFLICT (id) DO NOTHING;

-- Productos iniciales
INSERT INTO productos (id, sku, nombre, precio, stock) VALUES
(1, 'PROD-LAPTOP-01', 'Laptop Ultrabook 14"', 850.00, 15),
(2, 'PROD-MOUSE-02', 'Mouse Ergonómico Inalámbrico', 25.00, 60),
(3, 'PROD-KEYB-03', 'Teclado Mecánico RGB', 65.00, 35)
ON CONFLICT (id) DO NOTHING;

-- Pedidos iniciales
INSERT INTO pedidos (id, fecha, total, estado, usuario_id) VALUES
(1, '2026-09-19', 875.00, 'Enviado', 1),
(2, '2026-09-20', 90.00, 'Entregado', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('clientes_id_seq', COALESCE((SELECT MAX(id) FROM clientes), 1));
SELECT setval('veterinarios_id_seq', COALESCE((SELECT MAX(id) FROM veterinarios), 1));
SELECT setval('mascotas_id_seq', COALESCE((SELECT MAX(id) FROM mascotas), 1));
SELECT setval('citas_medicas_id_seq', COALESCE((SELECT MAX(id) FROM citas_medicas), 1));
SELECT setval('proveedores_id_seq', COALESCE((SELECT MAX(id) FROM proveedores), 1));
SELECT setval('medicamentos_id_seq', COALESCE((SELECT MAX(id) FROM medicamentos), 1));
SELECT setval('lotes_id_seq', COALESCE((SELECT MAX(id) FROM lotes), 1));
SELECT setval('ventas_id_seq', COALESCE((SELECT MAX(id) FROM ventas), 1));
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 1));
SELECT setval('productos_id_seq', COALESCE((SELECT MAX(id) FROM productos), 1));
SELECT setval('pedidos_id_seq', COALESCE((SELECT MAX(id) FROM pedidos), 1));
