-- Toolkit Vorka retirado por completo (decisión del dueño, 2026-11-05): nunca se publicó ni se vendió. Verificado en
-- producción antes de escribir esta migración: los dos productos con activo = 0, 0 suscripciones app = 'toolkit', 0 renglones
-- de orden, 0 órdenes con proveedor 'saldo' y las cuatro tablas toolkit_* vacías. Ninguna otra tabla apunta a ellas.
-- Las columnas orders.saldo_centavos y orders.toolkit_codigo (migración 0063) se quedan: están en 0 / NULL en todas las
-- filas, el código ya no las usa y quitar columnas de orders no aporta nada frente al riesgo.

-- Primero las tablas (toolkit_codigos tiene llave foránea a products)
DROP TABLE IF EXISTS toolkit_codigos;
DROP TABLE IF EXISTS toolkit_movimientos;
DROP TABLE IF EXISTS toolkit_revisar;
DROP TABLE IF EXISTS toolkit_cambios;

-- Filas dependientes de los productos (todas en 0 al verificar; por si acaso, para que el DELETE no choque con una llave)
DELETE FROM slugs_anteriores WHERE product_id IN ('prod_toolkit_mensual', 'prod_toolkit_pro_mensual');
DELETE FROM puntos_sugerencias WHERE product_id IN ('prod_toolkit_mensual', 'prod_toolkit_pro_mensual');
DELETE FROM puntos_promos WHERE product_id IN ('prod_toolkit_mensual', 'prod_toolkit_pro_mensual');
DELETE FROM cupones_regalo WHERE product_id IN ('prod_toolkit_mensual', 'prod_toolkit_pro_mensual');

DELETE FROM products WHERE id IN ('prod_toolkit_mensual', 'prod_toolkit_pro_mensual');
