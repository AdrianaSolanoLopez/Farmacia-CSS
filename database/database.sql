-- Crear Base de Datos
CREATE DATABASE FarmaciaDB;
GO

USE FarmaciaDB;
GO

-- Tabla para gestionar temperaturas requeridas
CREATE TABLE Temperaturas (
    temperatura_id INT PRIMARY KEY IDENTITY(1,1),
    descripcion NVARCHAR(50) NOT NULL,
    rango_temperatura NVARCHAR(50) NOT NULL -- Ejemplo: "15°C - 25°C"
);

-- Tabla de productos
CREATE TABLE Productos (
    producto_id INT PRIMARY KEY IDENTITY(1,1),
    nombre_producto NVARCHAR(50) NOT NULL,
    concentracion NVARCHAR(50),
    forma_farmaceutica NVARCHAR(50),
    presentacion NVARCHAR(50) NOT NULL,
    laboratorio NVARCHAR(50),
    registro_sanitario NVARCHAR(50),
    temperatura_id INT, -- Relación con tabla Temperaturas
    codigo_barras NVARCHAR(50),
    categoria NVARCHAR(50),
    stock INT DEFAULT 0, -- Suma de la cantidad de todos los lotes asociados
    estado BIT NOT NULL DEFAULT 0,
    FOREIGN KEY (temperatura_id) REFERENCES Temperaturas(temperatura_id)
);
-- añadir principio activo, 


-- Tabla de lotes
CREATE TABLE Lotes (
    lote_id NVARCHAR(50) NOT NULL,
    producto_id INT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    cantidad_disponible INT,
    precio_compra DECIMAL(10, 2) NOT NULL, -- Precio por unidad base
    observaciones NVARCHAR(MAX) NULL,
    estado BIT NOT NULL DEFAULT 0,
    PRIMARY KEY (lote_id, producto_id),
    FOREIGN KEY (producto_id) REFERENCES Productos(producto_id)
);

-- Tabla de presentaciones y precios de venta
CREATE TABLE Precios (
    precio_id INT PRIMARY KEY IDENTITY(1,1),
    producto_id INT NOT NULL,
    presentacion NVARCHAR(50) NOT NULL, -- Ejemplo: Caja, Blíster, Tableta
    equivalencia INT NOT NULL, -- Cantidad en unidades base que representa
    precio_venta DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES Productos(producto_id)
);

-- Tabla de ventas
CREATE TABLE Ventas (
    venta_id INT PRIMARY KEY IDENTITY(1,1),
    usuario_id INT NOT NULL, -- Relación con usuarios si aplica
    total DECIMAL(10, 2) NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT GETDATE()
);

-- Tabla de detalles de ventas
CREATE TABLE DetallesVentas (
    detalle_id INT PRIMARY KEY IDENTITY(1,1),
    venta_id INT NOT NULL,
    lote_id NVARCHAR(50),
    cantidad INT NOT NULL,
    unidad NVARCHAR(50) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES Ventas(venta_id),
    FOREIGN KEY (lote_id) REFERENCES Lotes(lote_id)
);

-- Tabla de actas
CREATE TABLE Actas (
    acta_id INT PRIMARY KEY IDENTITY(1,1),
    fecha_recepcion DATE NOT NULL,
    ciudad NVARCHAR(50) NOT NULL,
    Responsable NVARCHAR(50) NOT NULL,
    numero_factura NVARCHAR(50) NOT NULL,
    proveedor NVARCHAR(50) NOT NULL,
    tipo_acta NVARCHAR(50) NOT NULL,
    observaciones NVARCHAR(MAX) NULL,
    Cargada_Inventario BIT NOT NULL DEFAULT 0,
    estado BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE()
);

-- Tabla de productos o lotes asociados a un acta
CREATE TABLE ActasProductos (
    acta_producto_id INT PRIMARY KEY IDENTITY(1,1),
    acta_id INT NOT NULL,
    producto_id INT NOT NULL,
    lote_id NVARCHAR(50) NOT NULL,
    cantidad_recibida INT NOT NULL,
    precio_compra DECIMAL(10, 2),
    FOREIGN KEY (acta_id) REFERENCES Actas(acta_id),
    FOREIGN KEY (producto_id) REFERENCES Productos(producto_id),
    FOREIGN KEY (lote_id) REFERENCES Lotes(lote_id)
);

-- Datos iniciales para Temperaturas
INSERT INTO Temperaturas (descripcion, rango_temperatura) VALUES
('Temperatura Ambiente', '15°C - 25°C'),
('Refrigeración', '2°C - 8°C'),
('Congelación', '-20°C - -10°C');