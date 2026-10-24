-- Vende (registro de clientas, pedidos, cobros y ganancia para vendedoras independientes; app propia en vende.vorka.mx, Worker `vende`).
-- Se cobra por SUSCRIPCIÓN (Stripe Billing), como Cuentas y Vuelve. La prueba de 7 días y el plan gratis con límites viven en la app;
-- aquí solo se vende Vende Pro. La app consulta por RPC Admin.suscripcionApp(correo, 'vende').
-- Las vendedoras de programas patrocinados (marcas, distribuidores, directoras) no pagan aquí: el patrocinador paga a Vorka por fuera.
-- Entran INACTIVOS con precio PROVISIONAL (igual que Cuentas: $99 al mes, $799 al año). Se activan desde Vorka OS › Tienda cuando Vorka decida el precio.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_vende_mensual', 'vende-mensual', 'Vende Pro · plan mensual', 'Tu venta por catálogo o por encargo en orden: clientas, pedidos, cobros y ganancia real, con recordatorios por WhatsApp listos para enviar. Prueba 7 días gratis.', 9900, 0, 'Ventas', 46, '[]', '/assets/tienda/vende.webp',
  json('{"acceso":{"app":"vende","tipo":"suscripcion","ruta":"/tienda/vende/","url":"https://vende.vorka.mx/entrar/","boton":"Entrar a Vende","detalle":"Suscripción mensual · cancela cuando quieras"},"suscripcion":{"intervalo":"month"}}'));
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_vende_anual', 'vende-anual', 'Vende Pro · plan anual', 'Todo Vende Pro por un año: clientas, pedidos y productos sin límite, cobranza con estados de cuenta y tu página de catálogo.', 79900, 0, 'Ventas', 47, '[]', '/assets/tienda/vende.webp',
  json('{"oculto":true,"acceso":{"app":"vende","tipo":"suscripcion","ruta":"/tienda/vende/","url":"https://vende.vorka.mx/entrar/","boton":"Entrar a Vende","detalle":"Suscripción anual"},"suscripcion":{"intervalo":"year"}}'));
