-- Vende · red de la directora (oct 2026): una vendedora líder anota a las vendedoras de su red y paga una silla por cada una
-- ($49 al mes o $490 al año por silla); ellas usan Vende completo sin pagar. Es un complemento de Vende Pro, como las
-- sucursales de Vuelve: la app de Vende cambia la cantidad con Admin.lugaresApp(correo, 'vende', n, 'sucursal').
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_vende_silla_mensual', 'vende-silla-mensual', 'Vende · silla de vendedora (mensual)', 'Una vendedora más en tu red de Vende: usa la app completa sin pagar y tú ves cómo va.', 4900, 1, 'Ventas', 48, '[]', '/assets/tienda/vende.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"vende","tipo":"sucursal","ruta":"/tienda/vende/","url":"https://vende.vorka.mx/entrar/","boton":"Entrar a Vende"},"suscripcion":{"intervalo":"month"}}')),
('prod_vende_silla_anual', 'vende-silla-anual', 'Vende · silla de vendedora (anual)', 'Una vendedora más en tu red de Vende por un año, con 2 meses gratis.', 49000, 1, 'Ventas', 49, '[]', '/assets/tienda/vende.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"vende","tipo":"sucursal","ruta":"/tienda/vende/","url":"https://vende.vorka.mx/entrar/","boton":"Entrar a Vende"},"suscripcion":{"intervalo":"year"}}'));
UPDATE products SET contenido = json_set(contenido, '$.suscripcion.extra', 'prod_vende_silla_mensual') WHERE id = 'prod_vende_mensual';
UPDATE products SET contenido = json_set(contenido, '$.suscripcion.extra', 'prod_vende_silla_anual') WHERE id = 'prod_vende_anual';
