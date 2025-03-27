
-- Procedimiento para guardar un acta
CREATE OR ALTER PROCEDURE sp_GuardarActa
    @fecha_recepcion DATE,
    @ciudad NVARCHAR(50),
    @Responsable NVARCHAR(50),
    @numero_factura NVARCHAR(50),
    @proveedor NVARCHAR(50),
    @tipo_acta NVARCHAR(50),
    @observaciones NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @acta_id INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificar si el acta ya existe con el mismo número de factura y tipo de acta
        IF EXISTS (
            SELECT 1 
            FROM Actas 
            WHERE numero_factura = @numero_factura 
              AND tipo_acta = @tipo_acta
        )
        BEGIN
            -- Validar si está cargada al inventario
            IF EXISTS (
                SELECT 1 
                FROM Actas 
                WHERE numero_factura = @numero_factura 
                  AND tipo_acta = @tipo_acta 
                  AND Cargada_Inventario = 1
            )
            BEGIN
                -- Crear una nueva acta si la existente está cargada al inventario
                INSERT INTO Actas (
                    fecha_recepcion, 
                    ciudad, 
                    Responsable, 
                    numero_factura, 
                    proveedor, 
                    tipo_acta, 
                    observaciones, 
                    Cargada_Inventario, 
                    estado
                )
                VALUES (
                    @fecha_recepcion,
                    @ciudad,
                    @Responsable,
                    @numero_factura,
                    @proveedor,
                    @tipo_acta,
                    @observaciones,
                    0,
                    1
                );

                SET @acta_id = SCOPE_IDENTITY();
            END
            ELSE
            BEGIN
                -- Actualizar los campos del acta existente si no está cargada al inventario
                UPDATE Actas
                SET 
                    fecha_recepcion = @fecha_recepcion,
                    ciudad = @ciudad,
                    Responsable = @Responsable,
                    proveedor = @proveedor,
                    observaciones = @observaciones,
                    estado = 1
                WHERE numero_factura = @numero_factura 
                  AND tipo_acta = @tipo_acta;

                SET @acta_id = (SELECT acta_id FROM Actas WHERE numero_factura = @numero_factura AND tipo_acta = @tipo_acta);
            END
        END
        ELSE
        BEGIN
            -- Insertar una nueva acta si no existe
            INSERT INTO Actas (
                fecha_recepcion, 
                ciudad, 
                Responsable, 
                numero_factura, 
                proveedor, 
                tipo_acta, 
                observaciones, 
                Cargada_Inventario, 
                estado
            )
            VALUES (
                @fecha_recepcion,
                @ciudad,
                @Responsable,
                @numero_factura,
                @proveedor,
                @tipo_acta,
                @observaciones,
                0,
                1
            );

            SET @acta_id = SCOPE_IDENTITY();
        END

        -- Devolver el acta creada o actualizada
        SELECT 
            acta_id,
            fecha_recepcion,
            ciudad,
            Responsable,
            numero_factura,
            proveedor,
            tipo_acta,
            observaciones,
            Cargada_Inventario,
            estado,
            fecha_creacion
        FROM Actas
        WHERE acta_id = @acta_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO


 -- Procedimiento para buscar productos
CREATE OR ALTER PROCEDURE sp_searchProduct
    @busqueda NVARCHAR(50)
AS
BEGIN
    SELECT * 
    FROM Productos
    WHERE nombre_producto LIKE '%' + @busqueda + '%'
       OR codigo_barras LIKE '%' + @busqueda + '%';
END;
GO


-- Procedimiento para agregar un producto a un acta
CREATE OR ALTER PROCEDURE sp_AgregarProductoActa
    @acta_id INT,
    @nombre_producto NVARCHAR(50),
    @concentracion NVARCHAR(50),
    @forma_farmaceutica NVARCHAR(50),
    @presentacion NVARCHAR(50),
    @laboratorio NVARCHAR(50),
    @registro_sanitario NVARCHAR(50),
    @temperatura_id INT,
    @codigo_barras NVARCHAR(50),
    @categoria NVARCHAR(50),
    @lote_id NVARCHAR(50),
    @fecha_vencimiento DATE,
    @cantidad_recibida INT,
    @precio_compra DECIMAL(10, 2),
    @observaciones NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Declarar variables para manejar el producto
        DECLARE @producto_id INT;

        -- Verificar si el acta existe
        IF NOT EXISTS (SELECT 1 FROM Actas WHERE acta_id = @acta_id)
        BEGIN
            THROW 50001, 'El acta especificada no existe.', 1;
        END

        -- Verificar si el acta ya fue cargada al inventario
        IF EXISTS (SELECT 1 FROM Actas WHERE acta_id = @acta_id AND Cargada_Inventario = 1)
        BEGIN
            THROW 50002, 'No se pueden agregar productos porque el acta ya fue cargada al inventario.', 1;
        END

        -- Buscar o crear el producto
        SELECT @producto_id = producto_id 
        FROM Productos 
        WHERE nombre_producto = @nombre_producto 
        AND presentacion = @presentacion;

        IF @producto_id IS NULL
        BEGIN
            INSERT INTO Productos (
                nombre_producto, concentracion, forma_farmaceutica, presentacion,
                laboratorio, registro_sanitario, temperatura_id,
                codigo_barras, categoria, stock, estado
            )
            VALUES (
                @nombre_producto, @concentracion, @forma_farmaceutica, @presentacion,
                @laboratorio, @registro_sanitario, @temperatura_id,
                @codigo_barras, @categoria, 0, 0
            );

            SET @producto_id = SCOPE_IDENTITY();
        END

        -- Verificar si el lote ya existe en la misma acta
        IF EXISTS (
            SELECT 1 
            FROM ActasProductos 
            WHERE acta_id = @acta_id 
              AND lote_id = @lote_id 
              AND producto_id = @producto_id
        )
        BEGIN
            THROW 50003, 'El lote ya existe para este producto en esta acta, debe editarlo.', 1;
        END

        -- Insertar el nuevo lote si no existe en el sistema
        IF NOT EXISTS (SELECT 1 FROM Lotes WHERE lote_id = @lote_id AND producto_id = @producto_id)
        BEGIN
            INSERT INTO Lotes (
                lote_id, producto_id, fecha_vencimiento, cantidad_disponible,
                precio_compra, observaciones, estado
            )
            VALUES (
                @lote_id, @producto_id, @fecha_vencimiento, 0,
                @precio_compra, @observaciones, 0
            );
        END

        -- Asociar el producto al acta
        INSERT INTO ActasProductos (
            acta_id, producto_id, lote_id, cantidad_recibida, precio_compra
        )
        VALUES (
            @acta_id, @producto_id, @lote_id, @cantidad_recibida, @precio_compra
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO


-- Procedimiento para ver productos de un acta
CREATE OR ALTER PROCEDURE sp_VerProductosActa
    @acta_id INT
AS
BEGIN
    SELECT 
        ap.acta_producto_id,
        p.producto_id,
        p.nombre_producto,
        p.concentracion,
        p.forma_farmaceutica,
        p.presentacion,
        p.laboratorio,
        p.registro_sanitario,
        t.descripcion AS temperatura,
        l.lote_id,
        CONVERT(VARCHAR(10), l.fecha_vencimiento, 23) AS fecha_vencimiento, -- Formato yyyy-MM-dd
        ap.cantidad_recibida,
        ap.precio_compra,
        l.observaciones
    FROM ActasProductos ap
    INNER JOIN Productos p ON ap.producto_id = p.producto_id
    INNER JOIN Lotes l ON ap.lote_id = l.lote_id
    LEFT JOIN Temperaturas t ON p.temperatura_id = t.temperatura_id
    WHERE ap.acta_id = @acta_id
    ORDER BY ap.acta_producto_id DESC;
END
GO


-- Procedimiento para editar un producto en el acta
CREATE OR ALTER PROCEDURE sp_EditarProductoActa
    @acta_id INT,
    @producto_id INT,
    @nombre_producto NVARCHAR(50) = NULL,
    @concentracion NVARCHAR(50) = NULL,
    @forma_farmaceutica NVARCHAR(50) = NULL,
    @presentacion NVARCHAR(50) = NULL,
    @laboratorio NVARCHAR(50) = NULL,
    @temperatura_id INT = NULL,
    @codigo_barras NVARCHAR(50) = NULL,
    @categoria NVARCHAR(50) = NULL,
    @lote_id NVARCHAR(50) = NULL,
    @fecha_vencimiento DATE = NULL,
    @cantidad_recibida INT = NULL,
    @precio_compra DECIMAL(10, 2) = NULL,
    @observaciones NVARCHAR(MAX) = NULL,
    @registro_sanitario NVARCHAR(50) = NULL
AS
BEGIN
    BEGIN TRANSACTION;
    
    -- Verificar si el acta ya fue cargada al inventario
    IF EXISTS (SELECT 1 FROM Actas WHERE acta_id = @acta_id AND Cargada_Inventario = 1)
    BEGIN
        THROW 50002, 'No se pueden agregar productos porque el acta ya fue cargada al inventario.', 1;
    END

    -- Verificar si el producto existe en ActasProductos
    IF EXISTS (SELECT 1 FROM ActasProductos WHERE acta_id = @acta_id AND producto_id = @producto_id)
    BEGIN
        -- Actualizar los detalles del producto en la tabla Productos
        UPDATE Productos
        SET 
            nombre_producto = ISNULL(@nombre_producto, nombre_producto),
            concentracion = ISNULL(@concentracion, concentracion),
            forma_farmaceutica = ISNULL(@forma_farmaceutica, forma_farmaceutica),
            presentacion = ISNULL(@presentacion, presentacion),
            laboratorio = ISNULL(@laboratorio, laboratorio),
            temperatura_id = ISNULL(@temperatura_id, temperatura_id),
            codigo_barras = ISNULL(@codigo_barras, codigo_barras),
            categoria = ISNULL(@categoria, categoria),
            registro_sanitario = ISNULL(@registro_sanitario, registro_sanitario)
        WHERE producto_id = @producto_id;

        -- Verificar si el lote ya existe
        IF NOT EXISTS (SELECT 1 FROM Lotes WHERE lote_id = @lote_id AND producto_id = @producto_id)
        BEGIN
            -- Insertar un nuevo lote si no existe
            INSERT INTO Lotes (
                lote_id, producto_id, fecha_vencimiento, cantidad_disponible, 
                precio_compra, observaciones, estado
            )
            VALUES (
                @lote_id, @producto_id, @fecha_vencimiento, 0, 
                @precio_compra, @observaciones, 0
            );
        END
        ELSE
        BEGIN
            -- Actualizar los detalles del lote si ya existe
            UPDATE Lotes
            SET 
                fecha_vencimiento = ISNULL(@fecha_vencimiento, fecha_vencimiento),
                precio_compra = ISNULL(@precio_compra, precio_compra),
                observaciones = ISNULL(@observaciones, observaciones)
            WHERE lote_id = @lote_id AND producto_id = @producto_id;
        END

        -- Actualizar los detalles del producto en la tabla ActasProductos
        UPDATE ActasProductos
        SET 
            cantidad_recibida = ISNULL(@cantidad_recibida, cantidad_recibida),
            precio_compra = ISNULL(@precio_compra, precio_compra)
        WHERE acta_id = @acta_id AND producto_id = @producto_id;

        -- Confirmar la transacción
        COMMIT TRANSACTION;
    END
    ELSE
    BEGIN
        -- Si el producto no está en el acta, revertir la transacción y lanzar un error
        ROLLBACK TRANSACTION;
        THROW 50001, 'El producto no existe en este acta.', 1;
    END
END
GO


------------------------------------------------------
-- Procedimiento para eliminar un producto de un acta
CREATE OR ALTER PROCEDURE sp_EliminarProductoActa
    @acta_producto_id INT
AS
BEGIN
    -- Declarar variables para validar si el acta está cargada al inventario
    DECLARE @acta_id INT;
    DECLARE @cargada_inventario BIT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Obtener el acta_id asociado al producto en el acta
        SELECT @acta_id = acta_id
        FROM ActasProductos
        WHERE acta_producto_id = @acta_producto_id;

        -- Validar si el acta está cargada al inventario
        SELECT @cargada_inventario = Cargada_Inventario
        FROM Actas
        WHERE acta_id = @acta_id;

        -- Si el acta ya fue cargada al inventario, no se permite eliminar el producto
        IF @cargada_inventario = 1
        BEGIN
            RAISERROR('El producto no puede ser eliminado porque el acta ya está cargada al inventario.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

 -- Eliminar el producto del acta
        DELETE FROM ActasProductos
        WHERE acta_producto_id = @acta_producto_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- Manejar errores
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Lanza el error original
        THROW;
    END CATCH
END
GO


-- Procedimiento para cargar el acta al inventario
CREATE OR ALTER PROCEDURE sp_CargarActaInventario
    @acta_id INT
AS
BEGIN
    BEGIN TRANSACTION;

    -- Verificar si el acta ya fue cargada
    IF EXISTS (SELECT 1 FROM Actas WHERE acta_id = @acta_id AND Cargada_Inventario = 1)
    BEGIN
        RAISERROR ('El acta ya fue cargada al inventario.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Actualizar las cantidades de los lotes y el stock de los productos
    UPDATE Lotes
    SET cantidad_disponible = cantidad_disponible + ap.cantidad_recibida,
        estado = CASE 
                    WHEN cantidad_disponible + ap.cantidad_recibida > 0 THEN 1 
                    ELSE estado 
                 END
    FROM Lotes l
    INNER JOIN ActasProductos ap ON l.lote_id = ap.lote_id
    WHERE ap.acta_id = @acta_id;

    -- Actualizar el stock de los productos
    UPDATE p
    SET stock = (
        SELECT SUM(cantidad_disponible)
        FROM Lotes l
        WHERE l.producto_id = p.producto_id
    ),
    estado = CASE 
                WHEN (SELECT SUM(cantidad_disponible) 
                      FROM Lotes l 
                      WHERE l.producto_id = p.producto_id) > 0 THEN 1 
                ELSE estado 
             END
    FROM Productos p
    INNER JOIN ActasProductos ap ON p.producto_id = ap.producto_id
    WHERE ap.acta_id = @acta_id;

    -- Marcar el acta como cargada
    UPDATE Actas
    SET Cargada_Inventario = 1
    WHERE acta_id = @acta_id;

    COMMIT TRANSACTION;
END
GO


-- Procedimiento para ver actas
CREATE OR ALTER PROCEDURE sp_ListarActas
    @fecha_inicio DATE = NULL,
    @fecha_fin DATE = NULL,
    @Responsable NVARCHAR(50) = NULL,
    @numero_factura NVARCHAR(50) = NULL,
    @proveedor NVARCHAR(50) = NULL,
    @tipo_acta NVARCHAR(50) = NULL
AS
BEGIN
    -- Selección de actas con filtros opcionales
    SELECT 
        acta_id,
        fecha_recepcion,
        ciudad,
        Responsable,
        numero_factura,
        proveedor,
        tipo_acta,
        observaciones,
        Cargada_Inventario,
        estado,
        fecha_creacion
    FROM Actas
    WHERE 
        -- Filtrar por fecha de recepción (si se especifica)
        (@fecha_inicio IS NULL OR fecha_recepcion >= @fecha_inicio) 
        AND (@fecha_fin IS NULL OR fecha_recepcion <= @fecha_fin)
        
        -- Filtrar por Responsable (si se especifica)
        AND (@Responsable IS NULL OR Responsable LIKE '%' + @Responsable + '%')
        
        -- Filtrar por número de factura (si se especifica)
        AND (@numero_factura IS NULL OR numero_factura LIKE '%' + @numero_factura + '%')
        
        -- Filtrar por proveedor (si se especifica)
        AND (@proveedor IS NULL OR proveedor LIKE '%' + @proveedor + '%')
        
        -- Filtrar por tipo de acta (si se especifica)
        AND (@tipo_acta IS NULL OR tipo_acta LIKE '%' + @tipo_acta + '%')
    ORDER BY fecha_recepcion DESC; -- Ordenar por fecha de recepción descendente (más reciente primero)
END
GO

 -- procedimiento para actualizar las observaciones de un acta
CREATE OR ALTER PROCEDURE sp_UpdateActaObservations
    @acta_id INT,
    @observaciones NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Actas
    SET observaciones = @observaciones
    WHERE acta_id = @acta_id;
END;
GO
