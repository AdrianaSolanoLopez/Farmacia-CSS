--CREATE DATABASE FarmaciaDB;

USE FarmaciaDB;
GO


-- Estructura normalizada
-- Relaciones claras entre tablas
-- Campos útiles para trazabilidad
-- Facilidad para manejar lotes, inventario, ventas y compras
	
---

-- 1. Tabla: Usuarios

CREATE TABLE Usuarios (
    usuario_id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    correo NVARCHAR(100),
	contraseña NVARCHAR (50),
    rol NVARCHAR(50),
    estado BIT DEFAULT 1
);

---

-- 2. Tabla: Proveedores

CREATE TABLE Proveedores (
    proveedor_id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    contacto NVARCHAR(100),
    telefono NVARCHAR(50),
    correo NVARCHAR(100)
);

---

-- 3. Tabla: Temperaturas

CREATE TABLE Temperaturas (
  	temperatura_id INT IDENTITY(1,1) PRIMARY KEY,
    descripcion NVARCHAR(100),
	rango_temperatura NVARCHAR(50)
    
);

---

-- 4. Tabla: Productos (Medicamentos)

CREATE TABLE Productos (
    producto_id INT PRIMARY KEY IDENTITY(1,1),
	codigo_barras NVARCHAR(50),
    nombre_producto NVARCHAR(50) NOT NULL,
    concentracion NVARCHAR(50),
    forma_farmaceutica NVARCHAR(50),
    presentacion NVARCHAR(50) NOT NULL,
    laboratorio NVARCHAR(50),
    registro_sanitario NVARCHAR(50),
    temperatura_id INT, -- Relación con tabla Temperaturas
    proveedor_id INT,
    categoria NVARCHAR(50),
    stock INT DEFAULT 0, -- Suma de la cantidad de todos los lotes asociados
    estado BIT NOT NULL DEFAULT 0,
    FOREIGN KEY (temperatura_id) REFERENCES Temperaturas(temperatura_id),
	FOREIGN KEY (proveedor_id) REFERENCES Proveedores(proveedor_id)

);

---

-- 5. Tabla: Lotes (por producto)

CREATE TABLE Lotes (
    lote_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    producto_id INT NOT NULL, -- Relación con Productos    
    fecha_vencimiento DATE NOT NULL,
    cantidad_disponible INT NOT NULL DEFAULT 0, -- Unidades en stock del lote
    precio_compra DECIMAL(10,2) NOT NULL, -- Precio de compra por unidad
	observaciones NVARCHAR (MAX) NULL,
    estado BIT NOT NULL DEFAULT 0, -- 1 = Activo, 0 = Inactivo
	fecha_ingreso DATETIME DEFAULT GETDATE(),
	FOREIGN KEY (producto_id) REFERENCES Productos(producto_id)
);

---

-- Tabla de presentaciones y precios de venta
CREATE TABLE Precios (
    precio_id INT PRIMARY KEY IDENTITY(1,1),
    producto_id INT NOT NULL,
    presentacion NVARCHAR(50) NOT NULL, -- Ejemplo: Caja, Blíster, Tableta
    equivalencia INT NOT NULL, -- Cantidad en unidades base que representa
    precio_venta DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES Productos(producto_id)
);

----
 -- 6. Tabla: Inventario (Resumen por producto)

CREATE TABLE Inventario (
    inventario_id INT IDENTITY(1,1) PRIMARY KEY,
    producto_id INT FOREIGN KEY REFERENCES Productos(producto_id),
    stock_total INT DEFAULT 0,
    ultima_actualizacion DATETIME DEFAULT GETDATE()
);

---

-- 7. Tabla: Actas de Recepción

CREATE TABLE Actas (
    acta_id INT PRIMARY KEY IDENTITY(1,1),
    usuario_id INT NOT NULL, -- Relación con Usuarios
    fecha_recepcion DATE NOT NULL,
    ciudad NVARCHAR(50) NOT NULL,
    responsable NVARCHAR(50) NOT NULL,
    numero_factura NVARCHAR(50) NOT NULL,
    proveedor_id INT NOT NULL, -- Relación con la tabla Proveedores
    tipo_acta NVARCHAR(50) NOT NULL, 
    observaciones NVARCHAR(MAX) NULL,
    cargada_inventario BIT NOT NULL DEFAULT 0, -- Indica si ya pasó al inventario
    estado VARCHAR(20) CHECK (estado IN ('Borrador', 'Aprobada')) NOT NULL DEFAULT 'Borrador',
    fecha_creacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (proveedor_id) REFERENCES Proveedores(proveedor_id)
);

---

-- 8. Detalle Actas de Recepción

CREATE TABLE ActasProductos (
    acta_producto_id INT PRIMARY KEY IDENTITY(1,1),
    acta_id INT NOT NULL,
    producto_id INT NOT NULL, -- Relación con Productos
	lote_id NVARCHAR(50) NOT NULL,
    cantidad_recibida INT NOT NULL, 
	precio_compra DECIMAL (10,2),
    FOREIGN KEY (acta_id) REFERENCES Actas(acta_id),
    FOREIGN KEY (producto_id) REFERENCES Productos(producto_id),
	FOREIGN KEY (lote_id) REFERENCES Lotes(lote_id)
);

---

-- 9. Ventas

CREATE TABLE Ventas (
    venta_id INT PRIMARY KEY IDENTITY(1,1),
    usuario_id INT NOT NULL, -- Relación con la tabla Usuarios
    fecha_venta DATETIME DEFAULT GETDATE(),
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia', 'Mixto')) NOT NULL,
    monto_efectivo DECIMAL(10,2) DEFAULT 0,
    monto_tarjeta DECIMAL(10,2) DEFAULT 0,
    monto_transferencia DECIMAL(10,2) DEFAULT 0,
    cambio DECIMAL(10,2),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
);

---

-- 10. Detalle de Ventas

CREATE TABLE DetalleVenta (
    detalle_venta_id INT PRIMARY KEY IDENTITY(1,1),
    venta_id INT NOT NULL,
	lote_id NVARCHAR (50),   	
    cantidad INT NOT NULL,
    unidad NVARCHAR(50) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL, -- Precio unitario del producto
    subtotal DECIMAL(10,2), -- Cálculo automático del subtotal
    FOREIGN KEY (venta_id) REFERENCES Ventas(Venta_id),
    FOREIGN KEY (lote_id) REFERENCES Lotes(lote_id)
);

---

-- 11. Clientes

CREATE TABLE Clientes (
    cliente_id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    documento NVARCHAR(20),
    telefono NVARCHAR(50),
    correo NVARCHAR(100),
    direccion NVARCHAR(150),
    tipo_cliente NVARCHAR(50)
);

---

-- 12. Alertas de Vencimiento

CREATE TABLE AlertasVencimiento (
    alerta_id INT IDENTITY(1,1) PRIMARY KEY,
    lote_id NVARCHAR (50) FOREIGN KEY REFERENCES Lotes(lote_id),
    fecha_alerta DATETIME,
    dias_anticipacion INT,
    estado BIT DEFAULT 0
);

---

-- 13. Devoluciones y Detalles

CREATE TABLE Devoluciones (
    devolucion_id INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATETIME DEFAULT GETDATE(),
    tipo NVARCHAR(50) CHECK (Tipo IN ('Cliente', 'Proveedor')),
    usuario_id INT FOREIGN KEY REFERENCES Usuarios(usuario_id),
    observaciones NVARCHAR(MAX)
);

CREATE TABLE DetalleDevolucion (
    detalle_id INT IDENTITY(1,1) PRIMARY KEY,
    devolucion_id INT FOREIGN KEY REFERENCES Devoluciones(devolucion_id),
    lote_id NVARCHAR (50) FOREIGN KEY REFERENCES Lotes(lote_id),
    cantidad INT
    
);

---

-- 14. Facturas

CREATE TABLE Facturas (
    factura_id INT IDENTITY(1,1) PRIMARY KEY,
    venta_id INT FOREIGN KEY REFERENCES Ventas(venta_id),
    cliente_id INT FOREIGN KEY REFERENCES Clientes(cliente_id),
    numero_factura NVARCHAR(50),
    fecha_emision DATETIME DEFAULT GETDATE(),
    estado NVARCHAR(20)
);

---

-- 15. justes de Inventario

CREATE TABLE AjustesInventario (
    ajuste_id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT FOREIGN KEY REFERENCES Usuarios(usuario_id),
    fecha DATETIME DEFAULT GETDATE(),
    motivo NVARCHAR(100),
    observaciones NVARCHAR(MAX)
);

CREATE TABLE DetalleAjusteInventario (
    detalle_id INT IDENTITY(1,1) PRIMARY KEY,
    ajuste_id INT FOREIGN KEY REFERENCES AjustesInventario(ajuste_id),
    lote_id NVARCHAR (50) FOREIGN KEY REFERENCES Lotes(lote_id),
    cantidad_antes INT,
    cantidad_despues INT
);

---

-- 16. Configuraciones del Sistema (Variables)

CREATE TABLE ConfiguracionSistema (
    clave NVARCHAR(50) PRIMARY KEY,
    valor NVARCHAR(MAX)
);

---

-- 19. Órdenes de Compra
CREATE TABLE OrdenesCompra (
    orden_compra_id INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATE DEFAULT GETDATE(),
    proveedor_id INT FOREIGN KEY REFERENCES Proveedores(proveedor_id),
    usuario_id INT FOREIGN KEY REFERENCES Usuarios(usuario_id),
    observaciones NVARCHAR(MAX),
    estado NVARCHAR(20) CHECK (Estado IN ('Pendiente', 'Recibida', 'Cancelada')) DEFAULT 'Pendiente'
);

CREATE TABLE DetalleOrdenCompra (
    detalle_id INT IDENTITY(1,1) PRIMARY KEY,
    orden_compra_id INT FOREIGN KEY REFERENCES OrdenesCompra(orden_compra_id),
    producto_id INT FOREIGN KEY REFERENCES Productos(producto_id),
    cantidad INT,
    precio_unitario DECIMAL(10,2)
);

-- 20. Órdenes de Salida
CREATE TABLE OrdenesSalida (
    orden_salida_id INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATE DEFAULT GETDATE(),
    usuario_id INT FOREIGN KEY REFERENCES Usuarios(usuario_id),
    motivo NVARCHAR(100),
    observaciones NVARCHAR(MAX)
);

CREATE TABLE DetalleOrdenSalida (
    detalle_id INT IDENTITY(1,1) PRIMARY KEY,
    orden_salida_id INT FOREIGN KEY REFERENCES OrdenesSalida(Orden_salida_id),
    lote_id NVARCHAR (50) FOREIGN KEY REFERENCES Lotes(lote_id),
    cantidad INT
);

-- 21. Historial de Cambios
CREATE TABLE HistorialCambios (
    cambio_id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT FOREIGN KEY REFERENCES Usuarios(usuario_id),
    tabla NVARCHAR(100),
    accion NVARCHAR(50),
    fecha DATETIME DEFAULT GETDATE(),
    detalles NVARCHAR(MAX)
);

---

CREATE TYPE DetalleVentaType AS TABLE (
    lote_id INT,
    cantidad INT,
    unidad NVARCHAR(50),
    precio_venta DECIMAL(10,2)
);

---

CREATE TYPE DetalleAjusteType AS TABLE (
    lote_id INT,
    cantidad_antes INT,
    cantidad_despues INT
);

---

CREATE TYPE RegistrarVentaType AS TABLE (
    lote_id INT,
    cantidad_antes INT,
    cantidad_despues INT
);

---

CREATE TYPE DetalleDevolucionType AS TABLE (
    lote_id INT,
    cantidad_antes INT,
    cantidad_despues INT
);


-- Base de datos para el sistema de inventario de farmacia


