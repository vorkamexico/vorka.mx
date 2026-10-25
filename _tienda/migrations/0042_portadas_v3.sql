-- Portadas v3 de toda la tienda (simulador/portadas_v3.py): cada producto con su color y datos legibles en la tarjeta.
-- Estáticas del sitio en assets/tienda/v3/ (no R2). Solo cambia la imagen de los productos que ya tenían una.
UPDATE products SET imagen = CASE
    WHEN slug LIKE 'simulador-paa%' THEN '/assets/tienda/v3/simulador-paa-portada.webp'
    WHEN slug LIKE 'simulador-unam%' THEN '/assets/tienda/v3/simulador-unam-portada.webp'
    WHEN slug LIKE 'simulador-ecoems%' THEN '/assets/tienda/v3/simulador-ecoems-portada.webp'
    WHEN slug LIKE 'brindi%' THEN '/assets/tienda/v3/brindi-portada.webp'
    WHEN slug LIKE 'cupo%' THEN '/assets/tienda/v3/cupo-portada.webp'
    WHEN slug LIKE 'vuelve%' THEN '/assets/tienda/v3/vuelve-portada.webp'
    WHEN slug LIKE 'cuentas%' THEN '/assets/tienda/v3/cuentas-portada.webp'
    WHEN slug LIKE 'vende%' THEN '/assets/tienda/v3/vende-portada.webp'
    WHEN slug = 'idea-en-orden' THEN '/assets/tienda/v3/idea-en-orden-portada.webp'
    WHEN slug = 'idea-negocio-kit-para-validar-tu-idea-y-hacer-tus-numeros' THEN '/assets/tienda/v3/idea-negocio-portada.webp'
    ELSE imagen END
WHERE imagen IS NOT NULL;
