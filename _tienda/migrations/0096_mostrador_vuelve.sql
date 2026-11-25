-- Mostrador + Vuelve: la versión profesional para negocios con mercancía (boutiques, papelerías, ferreterías, regalos…):
-- «Mi mostrador» dentro de Vuelve (vender con ticket, inventario, corte del día) más la tarjeta de lealtad. App de paquete
-- 'mostrador-vuelve' (ver PAQUETES en src/suscripciones.js; Vorka OS la guarda en vu_cuentas.sus_paquete). $799 al mes o $7,990 al año.
-- Vende vuelve a ser solo para vendedoras por catálogo: el paquete Vende + Vuelve (0094) sale de la venta.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_mostrador_vuelve_mensual', 'mostrador-vuelve-mensual', 'Mostrador + Vuelve · plan mensual', 'Ventas con ticket, inventario, corte del día y tarjeta de lealtad para tu negocio, con tu logo.', 79900, 1, 'Negocios', 66, '[]', NULL,
  json('{"oculto":true,"acceso":{"app":"mostrador-vuelve","apps":["mostrador","vuelve"],"tipo":"suscripcion","ruta":"/tienda/mostrador/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Mi mostrador","detalle":"Suscripción mensual · Mostrador + Vuelve"},"suscripcion":{"intervalo":"month"}}')),
('prod_mostrador_vuelve_anual', 'mostrador-vuelve-anual', 'Mostrador + Vuelve · plan anual', 'Mostrador + Vuelve por un año, con 2 meses gratis.', 799000, 1, 'Negocios', 67, '[]', NULL,
  json('{"oculto":true,"acceso":{"app":"mostrador-vuelve","apps":["mostrador","vuelve"],"tipo":"suscripcion","ruta":"/tienda/mostrador/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Mi mostrador","detalle":"Suscripción anual · Mostrador + Vuelve"},"suscripcion":{"intervalo":"year"}}'));
UPDATE products SET activo = 0 WHERE slug IN ('vende-vuelve-mensual', 'vende-vuelve-anual');
