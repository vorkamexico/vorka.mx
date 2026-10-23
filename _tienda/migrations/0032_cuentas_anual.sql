-- Cuentas · plan anual ($799 al año; 12 × $99 = $1,188 → ahorra $389). Misma maquinaria de suscripción que el mensual.
-- Oculto en el catálogo (se elige en /tienda/cuentas/ junto al mensual). Entra activo (decisión del usuario, 2026-10-22).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_cuentas_anual', 'cuentas-anual', 'Cuentas · plan anual', 'Todo Cuentas por un año: préstamos ilimitados, acuerdos claros, recibos y estados de cuenta. Ahorra $389 contra el plan mensual.', 79900, 1, 'Finanzas personales', 45, '[]', '/assets/tienda/cuentas.webp',
  json('{"oculto":true,"acceso":{"app":"cuentas","tipo":"suscripcion","ruta":"/tienda/cuentas/","url":"https://cuentas.vorka.mx/entrar/","boton":"Entrar a Cuentas","detalle":"Suscripción anual · ahorra $389"},"suscripcion":{"intervalo":"year"}}'));
