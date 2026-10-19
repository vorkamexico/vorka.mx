-- Cupo tiene una sola página de venta (/tienda/cupo/, como Brindi): todos sus productos apuntan ahí y en el catálogo
-- sale una sola tarjeta (la de Cupo Pro hasta 300; los demás niveles y paquetes quedan ocultos del listado).
UPDATE products SET contenido = json_set(contenido, '$.acceso.ruta', '/tienda/cupo/'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE json_extract(contenido, '$.acceso.app') = 'cupo';
UPDATE products SET contenido = json_set(contenido, '$.oculto', json('true')), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE json_extract(contenido, '$.acceso.app') = 'cupo' AND id != 'prod_cupo_pro';
