-- Clara (finanzas personales para jóvenes desde 15 años y para quien no entiende de tarjetas; app propia en clara.vorka.mx, Worker `clara`).
-- Se cobra por SUSCRIPCIÓN (Stripe Billing), como Cuentas y Vende. El plan gratis (1 tarjeta) y la prueba de 7 días de Pro sin tarjeta
-- viven en la app; aquí solo se vende Clara Pro. La app consulta por RPC Admin.suscripcionApp(correo, 'clara').
-- Entran INACTIVOS: se activan desde Vorka OS › Tienda cuando Vorka decida abrir la venta (falta revisión legal de /legal/clara/).
-- Sin imagen propia todavía: el catálogo dibuja la portada con la V y "portada" (como los productos sin imagen).
-- Anual: $490 = 10 × $49 (2 meses gratis). Oculto en el catálogo (se elige en /tienda/clara/ junto al mensual), como el anual de Vende.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_clara_mensual', 'clara-mensual', 'Clara Pro · plan mensual', 'Tus tarjetas y tu dinero claros: recordatorios del corte y del pago, ¿Me alcanza?, presupuesto y metas de ahorro. Gratis con 1 tarjeta; Pro con 7 días de prueba.', 4900, 0, 'Finanzas personales', 54, '[]', NULL,
  json('{"portada":"Clara","acceso":{"app":"clara","tipo":"suscripcion","ruta":"/tienda/clara/","url":"https://clara.vorka.mx/entrar/","boton":"Entrar a Clara","detalle":"Suscripción mensual · cancela cuando quieras"},"suscripcion":{"intervalo":"month"}}'));
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_clara_anual', 'clara-anual', 'Clara Pro · plan anual', 'Todo Clara Pro por un año: tarjetas ilimitadas, ¿Con cuál tarjeta pago hoy?, presupuesto, metas, meses anteriores y Excel. 2 meses gratis contra el mensual.', 49000, 0, 'Finanzas personales', 55, '[]', NULL,
  json('{"oculto":true,"portada":"Clara","acceso":{"app":"clara","tipo":"suscripcion","ruta":"/tienda/clara/","url":"https://clara.vorka.mx/entrar/","boton":"Entrar a Clara","detalle":"Suscripción anual · 2 meses gratis"},"suscripcion":{"intervalo":"year"}}'));
