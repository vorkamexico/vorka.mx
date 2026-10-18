-- Portada de Brindi para la tienda (tres celulares con invitaciones reales de las plantillas).
-- Vive en el sitio (/assets/tienda/brindi.webp), así se publica con el repositorio sin subirla a R2.
UPDATE products SET imagen = '/assets/tienda/brindi.webp', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id LIKE 'prod_brindi_%' AND (imagen IS NULL OR imagen = '');
