-- Precios definitivos de lanzamiento (decisión de Dirección, 19-10-2026).
-- CUPO, por aforo: gratis hasta 30 · Pro hasta 100 $99 · hasta 300 $149 · hasta 1,000 $299 · hasta 3,000 $599.
-- Paquetes de 5 eventos (12 meses, ~20 % menos): de hasta 100 $399 · de hasta 300 $599 · de hasta 1,000 $1,199.
-- BRINDI: Esencial $399, Celebración $599 (igual), Premium $1,290; las mejoras cobran solo la diferencia.

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido)
SELECT 'prod_cupo_pro_100', 'cupo-pro-100', 'Cupo Pro · hasta 100 personas', 'Un evento de hasta 100 personas con correos automáticos, cover sin comisión, ligas para RPs y check-in con tu equipo.', 9900, 1, categoria, 29, '[]', imagen,
  json_set(contenido, '$.acceso.personas', 100, '$.acceso.detalle', 'Pago único · un evento de hasta 100 personas', '$.titular', 'Para fiestas, reuniones y eventos chicos',
    '$.faq', json('[{"p":"¿En qué se distingue de los otros niveles?","r":"Es lo mismo de Cupo Pro, para hasta 100 personas en un evento. Si van más, elige <a href=\"/tienda/cupo-pro/\">hasta 300 ($149)</a>, <a href=\"/tienda/cupo-pro-1000/\">hasta 1,000 ($299)</a> o <a href=\"/tienda/cupo-pro-3000/\">hasta 3,000 ($599)</a>."},{"p":"¿Qué incluye el plan gratis?","r":"Hasta 30 personas: página del evento, registro y entrada con QR, lista de espera y check-in. Sin correos, cover ni RPs."},{"p":"¿Cupo cobra comisión por mi cover?","r":"No. Las personas te pagan directo a ti. Solo pagas Cupo Pro una vez por evento."}]'))
FROM products WHERE id = 'prod_cupo_pro';

UPDATE products SET contenido = json_set(contenido, '$.faq[0].r', 'Elige <a href="/tienda/cupo-pro-1000/">hasta 1,000 personas ($299)</a> o <a href="/tienda/cupo-pro-3000/">hasta 3,000 ($599)</a>. Para menos de 100, <a href="/tienda/cupo-pro-100/">hasta 100 ($99)</a>. Si ya activaste uno y se te llena, subes de nivel desde tu evento.',
    '$.faq[1].r', 'Hasta 30 personas: página del evento, registro y entrada con QR, lista de espera y check-in. No manda correos: cada persona recupera su entrada en la página del evento con su correo y un NIP. Para correos, cover, RPs y más personas necesitas Pro.'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_cupo_pro';

UPDATE products SET nombre = 'Cupo · Paquete 5 eventos de hasta 300', orden = 34,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_cupo_paquete5';

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido)
SELECT 'prod_cupo_paquete5_100', 'cupo-paquete-5-100', 'Cupo · Paquete 5 eventos de hasta 100', 'Cinco eventos Pro de hasta 100 personas (correos, cover, RPs y más) para usar en 12 meses. Sale en $79.80 por evento.', 39900, 1, categoria, 33, '[]', imagen,
  json_set(contenido, '$.acceso.personas', 100, '$.acceso.detalle', 'Pago único · 5 eventos de hasta 100 personas en 12 meses', '$.titular', 'Cinco eventos chicos para todo el año',
    '$.subtitulo', 'Todo lo de Cupo Pro en cinco eventos de hasta 100 personas: sale en $79.80 por evento (ahorras $96 contra comprarlos sueltos). Los aplicas al publicar cada evento durante 12 meses.',
    '$.incluye', json('[{"titulo":"5 eventos Pro de hasta 100 personas","texto":"Correos y recordatorios, cover, ligas para RPs, aprobación, preguntas, avisos, check-in con equipo y Excel en cada uno."},{"titulo":"Ahorras $96","texto":"$399 por cinco eventos contra $495 sueltos."},{"titulo":"12 meses para usarlos","texto":"Ideal para cafés, talleres, comunidades y reuniones mensuales."}]'))
FROM products WHERE id = 'prod_cupo_paquete5';

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido)
SELECT 'prod_cupo_paquete5_1000', 'cupo-paquete-5-1000', 'Cupo · Paquete 5 eventos de hasta 1,000', 'Cinco eventos Pro de hasta 1,000 personas (correos, cover, RPs y más) para usar en 12 meses. Sale en $239.80 por evento.', 119900, 1, categoria, 35, '[]', imagen,
  json_set(contenido, '$.acceso.personas', 1000, '$.acceso.detalle', 'Pago único · 5 eventos de hasta 1,000 personas en 12 meses', '$.titular', 'Para antros y organizadores con temporada',
    '$.subtitulo', 'Todo lo de Cupo Pro en cinco eventos de hasta 1,000 personas: sale en $239.80 por evento (ahorras $296 contra comprarlos sueltos). Los aplicas al publicar cada evento durante 12 meses.',
    '$.incluye', json('[{"titulo":"5 eventos Pro de hasta 1,000 personas","texto":"Correos y recordatorios, cover, ligas para RPs, aprobación, preguntas, avisos, check-in con equipo y Excel en cada uno."},{"titulo":"Ahorras $296","texto":"$1,199 por cinco eventos contra $1,495 sueltos."},{"titulo":"12 meses para usarlos","texto":"Ideal para antros, bares y fiestas de temporada."}]'))
FROM products WHERE id = 'prod_cupo_paquete5';

-- Brindi
UPDATE products SET precio_centavos = 39900, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_esencial';
UPDATE products SET precio_centavos = 129000, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_premium';
UPDATE products SET precio_centavos = 20000, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_mejora_celebracion';
UPDATE products SET precio_centavos = 69100, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_mejora_premium';
