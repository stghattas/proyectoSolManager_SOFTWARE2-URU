-- ============================================================
-- BASE DE DATOS: sol_manager (PostgreSQL 14+)
-- ============================================================
-- Eliminar esquema público si existe (¡CUIDADO! Borra todo)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ROLES, ESTADOS Y UNIDADES
-- ============================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT
);

CREATE TABLE estados_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE estados_devolucion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE estados_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE unidades_medida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    abreviatura VARCHAR(10) NOT NULL UNIQUE
);

-- ============================================================
-- 2. USUARIOS Y DIRECCIONES
-- ============================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(150) UNIQUE,                     -- puede ser nulo para personas sin login
    telefono VARCHAR(20),
    cedula VARCHAR(20),
    password_hash VARCHAR(255),                    -- puede ser nulo para personas sin login
    rol_id UUID NOT NULL REFERENCES roles(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE direcciones_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL DEFAULT 'Maracaibo',
    referencia TEXT,
    codigo_postal VARCHAR(10),
    principal BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================
-- 3. CATEGORÍAS Y PRODUCTOS
-- ============================================================
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    categoria_padre_id UUID REFERENCES categorias(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    especificaciones TEXT,
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    precio_bs NUMERIC(12,2) NOT NULL,
    precio_usd NUMERIC(12,2) NOT NULL,
    unidad_medida_base_id UUID NOT NULL REFERENCES unidades_medida(id),
    stock_minimo NUMERIC(10,2) NOT NULL DEFAULT 0,
    imagen_url VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. ALMACENES E INVENTARIO
-- ============================================================
CREATE TABLE almacenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE inventario_almacen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    almacen_id UUID NOT NULL REFERENCES almacenes(id),
    producto_id UUID NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(almacen_id, producto_id)
);

-- ============================================================
-- 5. CARRITO, PEDIDOS, PAGOS
-- ============================================================
CREATE TABLE carritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE carrito_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(10,2) NOT NULL,
    unidad_id UUID NOT NULL REFERENCES unidades_medida(id),
    precio_unitario_bs NUMERIC(12,2) NOT NULL,
    precio_unitario_usd NUMERIC(12,2) NOT NULL
);

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),         -- puede ser NULL para ventas rápidas sin cliente
    cajero_id UUID REFERENCES usuarios(id),
    direccion_entrega_id UUID REFERENCES direcciones_entrega(id),
    estado_id UUID NOT NULL REFERENCES estados_pedido(id),
    repartidor_id UUID REFERENCES usuarios(id),
    fecha_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subtotal_bs NUMERIC(12,2) NOT NULL,
    subtotal_usd NUMERIC(12,2) NOT NULL,
    descuento_bs NUMERIC(12,2) NOT NULL DEFAULT 0,
    descuento_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
    impuesto_bs NUMERIC(12,2) NOT NULL DEFAULT 0,
    impuesto_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_bs NUMERIC(12,2) NOT NULL,
    total_usd NUMERIC(12,2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL,
    datos_pago JSONB,
    cupon_codigo VARCHAR(30),
    comentario TEXT,
    fecha_entrega TIMESTAMPTZ,
    tiempo_estimado_minutos INTEGER,                 -- nuevo campo
    activo BOOLEAN NOT NULL DEFAULT TRUE             -- para ocultar pedidos del historial
);

CREATE TABLE pedido_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(10,2) NOT NULL,
    unidad_id UUID NOT NULL REFERENCES unidades_medida(id),
    precio_unitario_bs NUMERIC(12,2) NOT NULL,
    precio_unitario_usd NUMERIC(12,2) NOT NULL,
    subtotal_bs NUMERIC(12,2) NOT NULL,
    subtotal_usd NUMERIC(12,2) NOT NULL
);

-- ============================================================
-- 6. DEVOLUCIONES, CUPONES, CIERRE DE CAJA
-- ============================================================
CREATE TABLE devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    motivo TEXT NOT NULL,
    foto_url VARCHAR(500),
    estado_id UUID NOT NULL REFERENCES estados_devolucion(id),
    comentario_gerente TEXT,
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_resolucion TIMESTAMPTZ
);

CREATE TABLE devolucion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucion_id UUID NOT NULL REFERENCES devoluciones(id) ON DELETE CASCADE,
    pedido_item_id UUID NOT NULL REFERENCES pedido_items(id),
    cantidad NUMERIC(10,2) NOT NULL,
    producto_id UUID NOT NULL REFERENCES productos(id)
);

CREATE TABLE cupones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    descuento_porcentaje NUMERIC(5,2) CHECK (descuento_porcentaje BETWEEN 0 AND 100),
    descuento_monto_bs NUMERIC(12,2) DEFAULT 0,
    descuento_monto_usd NUMERIC(12,2) DEFAULT 0,
    fecha_expiracion DATE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE cierres_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cajero_id UUID NOT NULL REFERENCES usuarios(id),
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    monto_inicial_bs NUMERIC(12,2) NOT NULL,
    monto_inicial_usd NUMERIC(12,2) NOT NULL,
    monto_final_bs NUMERIC(12,2),
    monto_final_usd NUMERIC(12,2),
    diferencia_bs NUMERIC(12,2),
    diferencia_usd NUMERIC(12,2),
    comentario TEXT
);

-- ============================================================
-- 7. MOVIMIENTOS, PROVEEDORES, COMPRAS
-- ============================================================
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    almacen_id UUID NOT NULL REFERENCES almacenes(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada','salida','merma','ajuste','transferencia')),
    cantidad NUMERIC(10,2) NOT NULL,
    unidad_id UUID NOT NULL REFERENCES unidades_medida(id),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id UUID REFERENCES usuarios(id),
    referencia TEXT,
    motivo TEXT,
    lote VARCHAR(50)
);

CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(150),
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE compras_proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    almacen_id UUID NOT NULL REFERENCES almacenes(id),
    estado_id UUID NOT NULL REFERENCES estados_compra(id),
    fecha_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_recepcion TIMESTAMPTZ,
    total_bs NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
    comentario TEXT
);

CREATE TABLE compras_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras_proveedores(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(10,2) NOT NULL,
    unidad_id UUID NOT NULL REFERENCES unidades_medida(id),
    precio_unitario_bs NUMERIC(12,2) NOT NULL,
    precio_unitario_usd NUMERIC(12,2) NOT NULL,
    subtotal_bs NUMERIC(12,2) NOT NULL,
    subtotal_usd NUMERIC(12,2) NOT NULL
);

-- ============================================================
-- 8. MENSAJES, NOTIFICACIONES, LOG
-- ============================================================
CREATE TABLE mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    remitente_id UUID NOT NULL REFERENCES usuarios(id),
    destinatario_id UUID NOT NULL REFERENCES usuarios(id),
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50),
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    referencia_id UUID,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE log_actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    detalles TEXT,
    direccion_ip VARCHAR(45),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. CONFIGURACIÓN Y TASAS
-- ============================================================
CREATE TABLE configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT
);

CREATE TABLE tasas_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL UNIQUE,
    tasa_bs_usd NUMERIC(12,4) NOT NULL,
    fuente VARCHAR(100) DEFAULT 'BCV'
);

-- ============================================================
-- 10. INSERCIÓN DE DATOS INICIALES
-- ============================================================

-- Roles
INSERT INTO roles (id, nombre, descripcion) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin', 'Administrador del sistema'),
    ('a0000000-0000-0000-0000-000000000002', 'gerente', 'Gerente con acceso a reportes y configuración'),
    ('a0000000-0000-0000-0000-000000000003', 'cajero', 'Encargado de caja y ventas directas'),
    ('a0000000-0000-0000-0000-000000000004', 'almacenista', 'Gestión de inventario y proveedores'),
    ('a0000000-0000-0000-0000-000000000005', 'repartidor', 'Encargado de entregas a domicilio'),
    ('a0000000-0000-0000-0000-000000000006', 'cliente', 'Cliente final que compra en línea');

-- Estados de pedido
INSERT INTO estados_pedido (id, nombre) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'pendiente'),
    ('b0000000-0000-0000-0000-000000000002', 'en_preparacion'),
    ('b0000000-0000-0000-0000-000000000003', 'en_camino'),
    ('b0000000-0000-0000-0000-000000000004', 'entregado'),
    ('b0000000-0000-0000-0000-000000000005', 'cancelado'),
    ('b0000000-0000-0000-0000-000000000006', 'no_localizado');

-- Estados de devolución
INSERT INTO estados_devolucion (id, nombre) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'pendiente'),
    ('c0000000-0000-0000-0000-000000000002', 'aprobada'),
    ('c0000000-0000-0000-0000-000000000003', 'rechazada');

-- Estados de compra
INSERT INTO estados_compra (id, nombre) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'pendiente'),
    ('d0000000-0000-0000-0000-000000000002', 'recibida'),
    ('d0000000-0000-0000-0000-000000000003', 'cancelada');

-- Unidades de medida
INSERT INTO unidades_medida (id, nombre, abreviatura) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'unidad', 'ud'),
    ('e0000000-0000-0000-0000-000000000002', 'kilogramo', 'kg'),
    ('e0000000-0000-0000-0000-000000000003', 'libra', 'lb'),
    ('e0000000-0000-0000-0000-000000000004', 'caja', 'cj');

-- Categorías
INSERT INTO categorias (id, nombre, descripcion) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Alimentos básicos', 'Productos de primera necesidad'),
    ('f0000000-0000-0000-0000-000000000002', 'Lácteos', 'Productos lácteos y derivados'),
    ('f0000000-0000-0000-0000-000000000003', 'Bebidas', 'Refrescos, jugos, agua'),
    ('f0000000-0000-0000-0000-000000000004', 'Limpieza', 'Artículos de limpieza del hogar'),
    ('f0000000-0000-0000-0000-000000000005', 'Carnes', 'Carnes rojas, pollo, pescado'),
    ('f0000000-0000-0000-0000-000000000006', 'Granos', 'Arroz, pasta, legumbres');

-- Almacenes
INSERT INTO almacenes (id, nombre, direccion) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Almacén Principal', 'Calle 123, Maracaibo');

-- Usuarios de prueba
-- Contraseña: password123
-- Hash bcrypt generado con: bcrypt.hashSync('password123', 10)
INSERT INTO usuarios (id, nombre, apellido, email, telefono, cedula, password_hash, rol_id) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Admin', 'Principal', 'admin@sol.com', '0412-0000000', 'V00000001',
     '$2a$10$wxXaw8m0CNPL2Cdy3/1uq.l7vkGenqS/SGPbavICiccYnHKqSoqYG', 'a0000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000002', 'Gerente', 'General', 'gerente@sol.com', '0412-1111111', 'V00000002',
     '$2a$10$wxXaw8m0CNPL2Cdy3/1uq.l7vkGenqS/SGPbavICiccYnHKqSoqYG', 'a0000000-0000-0000-0000-000000000002'),
    ('10000000-0000-0000-0000-000000000003', 'Cajero', 'Uno', 'cajero@sol.com', '0412-2222222', 'V00000003',
     '$2a$10$wxXaw8m0CNPL2Cdy3/1uq.l7vkGenqS/SGPbavICiccYnHKqSoqYG', 'a0000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', 'Almacenista', 'Jefe', 'almacen@sol.com', '0412-3333333', 'V00000004',
     '$2a$10$wxXaw8m0CNPL2Cdy3/1uq.l7vkGenqS/SGPbavICiccYnHKqSoqYG', 'a0000000-0000-0000-0000-000000000004'),
    ('10000000-0000-0000-0000-000000000005', 'Repartidor', 'Veloz', 'repartidor@sol.com', '0412-4444444', 'V00000005',
     '$2a$10$wxXaw8m0CNPL2Cdy3/1uq.l7vkGenqS/SGPbavICiccYnHKqSoqYG', 'a0000000-0000-0000-0000-000000000005'),
    ('10000000-0000-0000-0000-000000000006', 'Cliente', 'Frecuente', 'cliente@sol.com', '0412-5555555', 'V00000006',
     '$2a$10$wxXaw8m0CNPL2Cdy3/1uq.l7vkGenqS/SGPbavICiccYnHKqSoqYG', 'a0000000-0000-0000-0000-000000000006'),
    -- Personas sin login (ejemplos)
    ('10000000-0000-0000-0000-000000000007', 'María', 'González', NULL, '0412-6666666', 'V12345678', NULL, 'a0000000-0000-0000-0000-000000000006'),
    ('10000000-0000-0000-0000-000000000008', 'Carlos', 'Pérez', NULL, '0412-7777777', 'V87654321', NULL, 'a0000000-0000-0000-0000-000000000006');

-- Direcciones (una para el cliente frecuente)
INSERT INTO direcciones_entrega (id, usuario_id, direccion, ciudad, referencia, principal)
VALUES ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006',
        'Calle 123, Casa #45, Maracaibo', 'Maracaibo', 'Cerca de la panadería', TRUE);

-- Productos con emojis
INSERT INTO productos (nombre, descripcion, categoria_id, precio_bs, precio_usd, unidad_medida_base_id, imagen_url) VALUES
('Harina Pan', 'Harina de maíz precocida 1kg', 'f0000000-0000-0000-0000-000000000001', 120.00, 2.50, 'e0000000-0000-0000-0000-000000000002', '🌽'),
('Arroz Blanco', 'Arroz de grano largo 1kg', 'f0000000-0000-0000-0000-000000000006', 90.00, 1.80, 'e0000000-0000-0000-0000-000000000002', '🍚'),
('Spaghetti', 'Pasta larga 500g', 'f0000000-0000-0000-0000-000000000006', 70.00, 1.40, 'e0000000-0000-0000-0000-000000000001', '🍝'),
('Aceite Vegetal', 'Aceite de girasol 1L', 'f0000000-0000-0000-0000-000000000001', 180.00, 3.60, 'e0000000-0000-0000-0000-000000000001', '🫒'),
('Leche Entera', 'Leche entera pasteurizada 1L', 'f0000000-0000-0000-0000-000000000002', 85.00, 1.70, 'e0000000-0000-0000-0000-000000000001', '🥛'),
('Queso Blanco', 'Queso blanco duro 500g', 'f0000000-0000-0000-0000-000000000002', 150.00, 3.00, 'e0000000-0000-0000-0000-000000000001', '🧀'),
('Huevos (cartón)', 'Cartón de 30 huevos', 'f0000000-0000-0000-0000-000000000001', 200.00, 4.00, 'e0000000-0000-0000-0000-000000000001', '🥚'),
('Pollo Entero', 'Pollo fresco entero por kg', 'f0000000-0000-0000-0000-000000000005', 250.00, 5.00, 'e0000000-0000-0000-0000-000000000002', '🍗'),
('Carne Molida', 'Carne de res molida 1kg', 'f0000000-0000-0000-0000-000000000005', 300.00, 6.00, 'e0000000-0000-0000-0000-000000000002', '🥩'),
('Refresco Cola', 'Refresco sabor cola 2L', 'f0000000-0000-0000-0000-000000000003', 60.00, 1.20, 'e0000000-0000-0000-0000-000000000001', '🥤'),
('Agua Mineral', 'Botella de agua 500ml', 'f0000000-0000-0000-0000-000000000003', 30.00, 0.60, 'e0000000-0000-0000-0000-000000000001', '💧'),
('Jabón en Polvo', 'Detergente para ropa 1kg', 'f0000000-0000-0000-0000-000000000004', 95.00, 1.90, 'e0000000-0000-0000-0000-000000000002', '🧼'),
('Cloro', 'Cloro líquido 1L', 'f0000000-0000-0000-0000-000000000004', 40.00, 0.80, 'e0000000-0000-0000-0000-000000000001', '🧴'),
('Papel Higiénico', 'Paquete de 4 rollos', 'f0000000-0000-0000-0000-000000000004', 65.00, 1.30, 'e0000000-0000-0000-0000-000000000001', '🧻'),
('Café Molido', 'Café molido 200g', 'f0000000-0000-0000-0000-000000000001', 110.00, 2.20, 'e0000000-0000-0000-0000-000000000001', '☕');

-- Inventario inicial (50 unidades/kg por producto en el almacén principal)
INSERT INTO inventario_almacen (almacen_id, producto_id, cantidad)
SELECT 'a1000000-0000-0000-0000-000000000001', id, 50 FROM productos;

-- Configuración
INSERT INTO configuracion (clave, valor, descripcion) VALUES
    ('impuesto_porcentaje', '16', 'Porcentaje de IVA'),
    ('tasa_bcv', '35.5', 'Tasa oficial Bs/USD (BCV)'),
    ('stock_minimo_default', '5', 'Alerta de stock bajo por defecto'),
    ('tiempo_maximo_entrega_horas', '2', 'Tiempo máximo de entrega en horas');

-- Tasa de cambio del día
INSERT INTO tasas_cambio (fecha, tasa_bs_usd, fuente) VALUES (CURRENT_DATE, 35.5, 'BCV');

-- Algunos proveedores de ejemplo
INSERT INTO proveedores (id, nombre, contacto, telefono, email) VALUES
    ('40000000-0000-0000-0000-000000000001', 'Distribuidora Alimentos Zulia', 'Juan Pérez', '0412-1112233', 'ventas@alimentoszulia.com'),
    ('40000000-0000-0000-0000-000000000002', 'Lácteos Maracaibo', 'Ana López', '0412-2223344', 'info@lacteosmbo.com');