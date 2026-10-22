-- Cuentas (administrador de préstamos personales entre familiares y amigos; app propia en cuentas.vorka.mx, Worker `cuentas`).
-- Se cobra por SUSCRIPCIÓN mensual (Stripe Billing), como Vuelve. La prueba de 7 días vive en la app (sin tarjeta);
-- aquí solo se vende. La app consulta por RPC Admin.suscripcionApp(correo, 'cuentas').
-- Entra ACTIVO (decisión del usuario, 2026-10-22): Stripe ya tiene el portal de clientes y los eventos de suscripción.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_cuentas_mensual', 'cuentas-mensual', 'Cuentas · plan mensual', 'Lleva en orden lo que prestas a familiares y amigos: cada abono, intereses claros, el saldo al día y estados de cuenta en PDF y Excel. Prueba 7 días gratis.', 9900, 1, 'Finanzas personales', 44, '[]', '/assets/tienda/cuentas.webp',
  json('{"acceso":{"app":"cuentas","tipo":"suscripcion","ruta":"/tienda/cuentas/","url":"https://cuentas.vorka.mx/entrar/","boton":"Entrar a Cuentas","detalle":"Suscripción mensual · cancela cuando quieras"},"suscripcion":{"intervalo":"month"}}'));
