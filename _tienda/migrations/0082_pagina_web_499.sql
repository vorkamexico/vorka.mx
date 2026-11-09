-- Tu página web (plan solo): la suscripción pasa de $349 a $499 MXN al mes (decisión del usuario, 9-11-2026).
-- Las suscripciones ya abiertas en Stripe conservan su precio; las nuevas se crean con este. Negocio Completo sigue en $749.
UPDATE products SET precio_centavos = 49900 WHERE slug = 'pagina-web-mensual';
