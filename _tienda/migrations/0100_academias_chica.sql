-- Academias para academias chicas: hasta 25 alumnos por $399 al mes o $3,990 al año (2 meses gratis), el mismo precio que Vuelve.
-- Decisión del dueño (27-11-2026). Se guarda con app 'academias-chica' (PAQUETES en src/suscripciones.js): Vorka OS lo recibe en
-- vu_cuentas.sus_paquete, abre Mi academia y pone el tope de 25 alumnos activos (src/vuelve/academia.js). El plan de $599 queda para
-- academias de más de 25 alumnos (hasta 800). En el catálogo sale el chico, con «Desde $399 al mes»; el de $599 se ve en su página.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_academias_chica_mensual', 'academias-chica-mensual', 'Academias · hasta 25 alumnos, plan mensual', 'Grupos, alumnos, pase de lista y mensualidades de tu academia, para academias de hasta 25 alumnos.', 39900, 1, 'Negocios', 62, '[]', '/assets/tienda/v3/academias-portada.webp',
  json('{"acceso":{"app":"academias-chica","apps":["academias","vuelve"],"tipo":"suscripcion","ruta":"/tienda/academias/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Mi academia","detalle":"Suscripción mensual · Academias, hasta 25 alumnos"},"suscripcion":{"intervalo":"month"}}')),
('prod_academias_chica_anual', 'academias-chica-anual', 'Academias · hasta 25 alumnos, plan anual', 'Academias para hasta 25 alumnos por un año, con 2 meses gratis.', 399000, 1, 'Negocios', 63, '[]', NULL,
  json('{"oculto":true,"acceso":{"app":"academias-chica","apps":["academias","vuelve"],"tipo":"suscripcion","ruta":"/tienda/academias/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Mi academia","detalle":"Suscripción anual · Academias, hasta 25 alumnos"},"suscripcion":{"intervalo":"year"}}'));
UPDATE products SET contenido = json_set(contenido, '$.oculto', json('true')) WHERE slug = 'academias-vuelve-mensual';
