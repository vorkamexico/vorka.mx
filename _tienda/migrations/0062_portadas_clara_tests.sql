-- Portadas v3 para los productos que se veían con la portada genérica de la V (simulador/portadas_v3.py → assets/tienda/v3/):
-- Clara (captura real de la app), Test vocacional, ¿Qué proyecto social hago? y Evaluación de liderazgo. De paso, los productos
-- ocultos de líneas que ya tenían portada v3 y se quedaron sin imagen o con la vieja (planes y extras de Brindi, sillas de Vende,
-- intentos y exámenes adicionales de los simuladores), para que el correo de compra, Vorka OS y Puntos muestren la misma.
-- Solo toca la imagen; no cambia precios, nombres ni si están a la venta. Las rutas son estáticas del sitio (no R2).
UPDATE products SET imagen = '/assets/tienda/v3/clara-portada.webp' WHERE slug IN ('clara-mensual', 'clara-anual');
UPDATE products SET imagen = '/assets/tienda/v3/test-vocacional-portada.webp' WHERE slug = 'test-vocacional' OR slug LIKE 'test-vocacional-grupo-%';
UPDATE products SET imagen = '/assets/tienda/v3/que-proyecto-social-portada.webp' WHERE slug = 'que-proyecto-social';
UPDATE products SET imagen = '/assets/tienda/v3/evaluacion-liderazgo-portada.webp' WHERE slug = 'evaluacion-liderazgo';
UPDATE products SET imagen = '/assets/tienda/v3/brindi-portada.webp' WHERE slug LIKE 'brindi-%' AND imagen IS NULL;
UPDATE products SET imagen = '/assets/tienda/v3/vende-portada.webp' WHERE slug IN ('vende-silla-mensual', 'vende-silla-anual');
UPDATE products SET imagen = '/assets/tienda/v3/simulador-paa-portada.webp' WHERE slug IN ('simulador-paa-intento', 'simulador-paa-examen') AND imagen IS NULL;
UPDATE products SET imagen = '/assets/tienda/v3/simulador-unam-portada.webp' WHERE slug IN ('simulador-unam-intento', 'simulador-unam-examen') AND imagen IS NULL;
UPDATE products SET imagen = '/assets/tienda/v3/simulador-ecoems-portada.webp' WHERE slug IN ('simulador-ecoems-intento', 'simulador-ecoems-examen') AND imagen IS NULL;
UPDATE products SET imagen = '/assets/tienda/v3/simulador-prepa-ug-portada.webp' WHERE slug IN ('simulador-prepa-ug-intento', 'simulador-prepa-ug-examen') AND imagen IS NULL;
