-- Paquete Academias + Vuelve: «Mi academia» (grupos, alumnos, pase de lista y mensualidades) dentro de Vuelve, más la tarjeta de lealtad.
-- Se guarda con app 'academias-vuelve' (ver PAQUETES en src/suscripciones.js): Vuelve lo ve como su suscripción y abre Mi academia
-- (Vorka OS guarda el paquete en vu_cuentas.sus_paquete). $599 al mes o $5,990 al año (2 meses gratis). Precio por validar.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_academias_vuelve_mensual', 'academias-vuelve-mensual', 'Academias + Vuelve · plan mensual', 'Grupos, alumnos, pase de lista y mensualidades de tu academia, con tarjeta de lealtad para las familias y tu logo.', 59900, 1, 'Negocios', 64, '[]', NULL,
  json('{"oculto":true,"acceso":{"app":"academias-vuelve","apps":["academias","vuelve"],"tipo":"suscripcion","ruta":"/tienda/academias/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Mi academia","detalle":"Suscripción mensual · Academias + Vuelve"},"suscripcion":{"intervalo":"month"}}')),
('prod_academias_vuelve_anual', 'academias-vuelve-anual', 'Academias + Vuelve · plan anual', 'Academias + Vuelve por un año, con 2 meses gratis.', 599000, 1, 'Negocios', 65, '[]', NULL,
  json('{"oculto":true,"acceso":{"app":"academias-vuelve","apps":["academias","vuelve"],"tipo":"suscripcion","ruta":"/tienda/academias/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Mi academia","detalle":"Suscripción anual · Academias + Vuelve"},"suscripcion":{"intervalo":"year"}}'));
