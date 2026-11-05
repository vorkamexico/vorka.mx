-- Tu página web: el precio de la suscripción pasa de $299 a $349 MXN al mes (decisión del usuario, 5-11-2026).
-- Las suscripciones ya abiertas en Stripe conservan su precio; las nuevas se crean con este.
-- Se fija también la imagen de la portada propia del catálogo (assets/tienda/v3/pagina-web-portada.webp).
UPDATE products SET precio_centavos = 34900, imagen = '/assets/tienda/v3/pagina-web-portada.webp'
 WHERE slug = 'pagina-web-mensual';
