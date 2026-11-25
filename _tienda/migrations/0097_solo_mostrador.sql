-- Solo Mostrador: «Mi mostrador» (vender con ticket, inventario y corte del día) sin la tarjeta de lealtad, para quien no quiere Vuelve.
-- App propia 'mostrador' (Vorka OS la consulta aparte para abrir Mi mostrador). $499 al mes o $4,990 al año.
-- El paquete Mostrador + Vuelve (0096) se queda en $799 al mes / $7,990 al año.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_mostrador_mensual', 'mostrador-mensual', 'Mostrador · plan mensual', 'Ventas con ticket, inventario y corte del día para tu negocio, con tu logo.', 49900, 1, 'Negocios', 68, '[]', NULL,
  json('{"oculto":true,"acceso":{"app":"mostrador","tipo":"suscripcion","ruta":"/tienda/mostrador/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Mi mostrador","detalle":"Suscripción mensual · Mostrador"},"suscripcion":{"intervalo":"month"}}')),
('prod_mostrador_anual', 'mostrador-anual', 'Mostrador · plan anual', 'Mostrador por un año, con 2 meses gratis.', 499000, 1, 'Negocios', 69, '[]', NULL,
  json('{"oculto":true,"acceso":{"app":"mostrador","tipo":"suscripcion","ruta":"/tienda/mostrador/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Mi mostrador","detalle":"Suscripción anual · Mostrador"},"suscripcion":{"intervalo":"year"}}'));
