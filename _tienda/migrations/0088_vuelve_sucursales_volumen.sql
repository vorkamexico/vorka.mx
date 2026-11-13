-- Vuelve: precio por volumen de sucursales (escalonado). La 2ª y la 3ª sucursal siguen a $249 al mes; de la 4ª a la 10ª, $199;
-- de la 11ª en adelante, $169 (anual: $2,490, $1,990 y $1,690). Cada tramo es su propio complemento (oculto) y la tienda
-- reparte la cantidad entre ellos (ver TRAMOS_SUCURSAL en src/suscripciones.js). Todos cuentan como sucursales.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_vuelve_sucursal4_mensual', 'vuelve-sucursal4-mensual', 'Vuelve · sucursal adicional, desde la 4ª (mensual)', 'Sucursales de la 4ª a la 10ª con precio por volumen.', 19900, 1, 'Lealtad', 44, '[]', '/assets/tienda/vuelve.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"vuelve","tipo":"sucursal","ruta":"/tienda/vuelve/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"},"suscripcion":{"intervalo":"month"}}')),
('prod_vuelve_sucursal11_mensual', 'vuelve-sucursal11-mensual', 'Vuelve · sucursal adicional, desde la 11ª (mensual)', 'Sucursales de la 11ª en adelante con precio por volumen.', 16900, 1, 'Lealtad', 45, '[]', '/assets/tienda/vuelve.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"vuelve","tipo":"sucursal","ruta":"/tienda/vuelve/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"},"suscripcion":{"intervalo":"month"}}')),
('prod_vuelve_sucursal4_anual', 'vuelve-sucursal4-anual', 'Vuelve · sucursal adicional, desde la 4ª (anual)', 'Sucursales de la 4ª a la 10ª con precio por volumen, por un año.', 199000, 1, 'Lealtad', 46, '[]', '/assets/tienda/vuelve.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"vuelve","tipo":"sucursal","ruta":"/tienda/vuelve/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"},"suscripcion":{"intervalo":"year"}}')),
('prod_vuelve_sucursal11_anual', 'vuelve-sucursal11-anual', 'Vuelve · sucursal adicional, desde la 11ª (anual)', 'Sucursales de la 11ª en adelante con precio por volumen, por un año.', 169000, 1, 'Lealtad', 47, '[]', '/assets/tienda/vuelve.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"vuelve","tipo":"sucursal","ruta":"/tienda/vuelve/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"},"suscripcion":{"intervalo":"year"}}'));
