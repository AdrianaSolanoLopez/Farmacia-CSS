
-- Inserts para tabla Usuarios
INSERT INTO Usuarios (nombre, correo, contraseña, rol, estado) VALUES 
('Administrador', 'admin@farmacia.com', 'admin123', 'Admin', 1),
('Vendedor 1', 'vendedor1@farmacia.com', 'v123', 'Vendedor', 1);

-- Inserts para tabla Proveedores
INSERT INTO Proveedores (nombre, contacto, telefono, correo) VALUES 
('Laboratorio SaludPlus', 'Carlos Ruiz', '3123456789', 'contacto@saludplus.com'),
('Distribuidora Farma', 'Luisa Pérez', '3112345678', 'info@farma.com');

-- Inserts para tabla Temperaturas
INSERT INTO Temperaturas (descripcion, rango_temperatura) VALUES 
('Refrigerado', '2-8°C'),
('Ambiente', '15-25°C');

-- Inserts para tabla Productos
INSERT INTO Productos (codigo_barras, nombre_producto, concentracion, forma_farmaceutica, presentacion, laboratorio, registro_sanitario, temperatura_id, proveedor_id, categoria, stock, estado) VALUES 
('7701234567890', 'Paracetamol', '500mg', 'Tableta', 'Caja x 10', 'Genfar', 'NSC123456', 2, 1, 'Analgésico', 100, 1),
('7700987654321', 'Amoxicilina', '250mg', 'Cápsula', 'Blíster x 10', 'Pfizer', 'NSC654321', 2, 2, 'Antibiótico', 150, 1);

-- Inserts para tabla Lotes
INSERT INTO Lotes (lote_id, producto_id, fecha_vencimiento, cantidad_disponible, precio_compra, observaciones, estado) VALUES 
('L001', 1, '2025-12-31', 50, 150.00, 'Primer lote de Paracetamol', 1),
('L002', 2, '2026-06-30', 100, 300.00, 'Primer lote de Amoxicilina', 1);

-- Inserts para tabla Precios
INSERT INTO Precios (producto_id, presentacion, equivalencia, precio_venta) VALUES 
(1, 'Caja x 10', 10, 200.00),
(2, 'Blíster x 10', 10, 400.00);

-- Inserts para tabla Inventario
INSERT INTO Inventario (producto_id, stock_total) VALUES 
(1, 50),
(2, 100);

-- Inserts para tabla Clientes
INSERT INTO Clientes (nombre, documento, telefono, correo, direccion, tipo_cliente) VALUES 
('Juan Pérez', '12345678', '3100000000', 'juan@gmail.com', 'Calle 123', 'Natural'),
('Farmacia Aliada', '987654321', '3111111111', 'aliada@correo.com', 'Av. Principal', 'Jurídico');
