-- Archivo: seed_data.sql
-- Datos Iniciales de Prueba

USE FarmaciaDB;
GO

-- Insertar Productos
INSERT INTO Productos (nombre, presentacion, forma_farmaceutica, concentracion, laboratorio, codigo_barras, categoria, precio_venta_sugerido)
VALUES
('Acetaminofén 500mg', 'Caja x 10 tabletas x 10 unidades', 'Tableta', '500mg', 'Laboratorio ABC', '1234567890123', 'Medicamento', 5.00),
('Advil Max 400mg', 'Caja x 16 unidades (Blister x 4)', 'Cápsula blanda', '400mg', 'Laboratorio XYZ', '1234567890456', 'Medicamento', 10.00),
('Shampoo Anticaspa', 'Botella 200ml', NULL, NULL, 'Marca Salud', '1234567890789', 'Productos de aseo y Limpieza', 15.00),
('Crema Facial Hidratante', 'Tubo 100ml', NULL, NULL, 'Cosméticos Belleza', '1234567891234', 'Cosmetico', 20.00),
('Glucómetro UltraCheck', 'Unidad', NULL, NULL, 'Diagnóstico Seguro', '1234567891456', 'Dispositivo médico', 100.00),
('Reactivo de Glucosa', 'Caja x 50 tiras', NULL, NULL, 'LabTest', '1234567891678', 'Reactivo de Diagnóstico', 50.00);

-- Insertar Lotes
INSERT INTO Lotes (lote_id, producto_id, fecha_vencimiento, cantidad_total, cantidad_disponible, precio_compra, precio_venta)
VALUES
('LT2580541', 1, '2025-12-31', 500, 500, 3.50, 5.00),
('LT2565845', 2, '2024-06-30', 200, 200, 3.20, 5.00),
('LT2565468', 3, '2025-09-30', 300, 300, 7.50, 10.00),
('LT2351322', 4, '2026-03-31', 100, 100, 12.00, 15.00),
('LT2135122', 5, '2025-08-15', 80, 80, 18.00, 20.00),
('LT3513512', 6, '2027-01-01', 50, 50, 90.00, 100.00);

-- Insertar Unidades de Medida
INSERT INTO UnidadesMedida (producto_id, unidad_base, equivalencia, precio_venta)
VALUES
(1, 'Caja', 100, 500.00),
(1, 'Blister', 10, 50.00),
(1, 'Unidad', 1, 5.00),
(2, 'Caja', 16, 160.00),
(2, 'Blister', 4, 40.00),
(2, 'Unidad', 1, 10.00),
(3, 'Botella', 1, 15.00),
(4, 'Tubo', 1, 20.00),
(5, 'Unidad', 1, 100.00),
(6, 'Caja', 50, 50.00);

-- Insertar Ventas de Prueba
INSERT INTO Ventas (usuario_id, total, fecha_creacion)
VALUES
(1, 25.00, GETDATE()),
(2, 40.00, GETDATE());

-- Insertar Detalles de Ventas
INSERT INTO DetallesVentas (venta_id, lote_id, cantidad, unidad, subtotal)
VALUES
(1, 2, 5, 'Unidad', 25.00),
(2, 3, 10, 'Unidad', 40.00);


-- Insertar datos de ejemplo en Actas
INSERT INTO Actas (tipo_acta, numero_factura, proveedor, fecha_recepcion, observaciones)
VALUES 
('Medicamentos', 'F123456', 'Proveedor Farma', '2024-12-22', 'Acta para medicamentos básicos'),
('Cosméticos', 'F654321', 'Proveedor Belleza', '2024-12-21', 'Acta para productos de belleza'),
('Dispositivos médicos', 'F987654', 'Proveedor Medico', '2024-12-20', 'Acta para dispositivos quirúrgicos');

-- Insertar datos de ejemplo en ActasProductos
INSERT INTO ActasProductos (acta_id, producto_id, lote_id, cantidad_recibida, precio_compra, precio_venta)
VALUES 
(1, 1, 'LT2580541', 500, 20.00, 30.00),
(1, 2, 'LT2565845', 300, 15.00, 25.00),
(2, 3, 'LT2351322', 100, 10.00, 15.00),
(3, 4, 'LT3513512', 50, 50.00, 75.00);


-- Datos iniciales para Temperaturas
INSERT INTO Temperaturas (descripcion, rango_temperatura) VALUES
('Temperatura Ambiente', '15°C - 25°C'),
('Refrigeración', '2°C - 8°C'),
('Congelación', '-20°C - -10°C');