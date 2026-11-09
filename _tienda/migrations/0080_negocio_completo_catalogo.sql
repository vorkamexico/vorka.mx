-- Negocio Completo aparece en el catálogo de la tienda (antes solo por liga directa). La instalación sigue oculta: se agrega
-- con la casilla de la página /tienda/negocio-completo/.
UPDATE products SET contenido = json_remove(contenido, '$.oculto') WHERE id = 'prod_negocio_completo_mensual';
