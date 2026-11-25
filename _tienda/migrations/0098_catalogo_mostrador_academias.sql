-- Mostrador y Academias + Vuelve salen en el catálogo de la tienda (antes solo se llegaba por su página): el plan mensual de cada uno
-- deja de estar oculto y lleva su portada v3. Las tarjetas llevan a /tienda/mostrador/ y /tienda/academias/.
UPDATE products SET contenido = json_remove(contenido, '$.oculto'), imagen = '/assets/tienda/v3/mostrador-portada.webp' WHERE slug = 'mostrador-mensual';
UPDATE products SET contenido = json_remove(contenido, '$.oculto'), imagen = '/assets/tienda/v3/academias-portada.webp' WHERE slug = 'academias-vuelve-mensual';
