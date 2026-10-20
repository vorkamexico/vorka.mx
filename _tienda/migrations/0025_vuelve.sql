-- Vuelve (tarjetas de lealtad digitales para negocios locales; tercera app de Diversificación, en os.vorka.mx/vuelve/).
-- A diferencia de Cupo y Brindi, Vuelve se cobra por SUSCRIPCIÓN (Stripe Billing): el negocio paga cada mes o cada año
-- y Stripe renueva solo. La prueba de 7 días vive en os.vorka.mx (sin tarjeta); aquí solo se vende la suscripción.
-- contenido.suscripcion: { intervalo: 'month' | 'year', extra: <id del producto de sucursal adicional del mismo intervalo> }
-- Entran INACTIVOS: se activan desde Vorka México → Tienda → Productos cuando Stripe tenga el portal de clientes y los
-- eventos de suscripción en el webhook (ver _tienda/README-TIENDA.md, sección Vuelve).

CREATE TABLE IF NOT EXISTS suscripciones (
  id                 TEXT PRIMARY KEY,               -- id de la suscripción en Stripe (sub_…)
  email              TEXT NOT NULL,
  app                TEXT NOT NULL,                  -- contenido.acceso.app del producto (p. ej. 'vuelve')
  product_id         TEXT NOT NULL,
  order_id           TEXT,                           -- orden de la primera compra
  customer_id        TEXT,
  estado             TEXT NOT NULL,                  -- estado de Stripe: active, trialing, past_due, canceled, unpaid, incomplete, incomplete_expired, paused
  intervalo          TEXT NOT NULL DEFAULT 'month',
  periodo_fin        TEXT,                           -- fin del periodo pagado (ISO)
  cancelar_al_final  INTEGER NOT NULL DEFAULT 0,
  sucursales         INTEGER NOT NULL DEFAULT 0,     -- sucursales adicionales pagadas (además de la incluida)
  monto_centavos     INTEGER NOT NULL DEFAULT 0,     -- lo que se cobra cada periodo
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_suscripciones_email ON suscripciones (email, app);

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_vuelve_mensual', 'vuelve-mensual', 'Vuelve · plan mensual', 'Tarjeta de lealtad digital para tu negocio: sellos o puntos en el celular de tus clientes, avisos automáticos y el dinero que te traen de vuelta, medido. Clientes ilimitados.', 39900, 0, 'Lealtad', 40, '[]', '/assets/tienda/vuelve.webp',
  json('{"acceso":{"app":"vuelve","tipo":"suscripcion","ruta":"/tienda/vuelve/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve","detalle":"Suscripción mensual · cancela cuando quieras"},"suscripcion":{"intervalo":"month","extra":"prod_vuelve_sucursal_mensual"}}')),
('prod_vuelve_anual', 'vuelve-anual', 'Vuelve · plan anual', 'Todo Vuelve por un año, con 2 meses gratis. Clientes ilimitados, avisos automáticos y reporte de dinero recuperado.', 399000, 0, 'Lealtad', 41, '[]', '/assets/tienda/vuelve.webp',
  json('{"oculto":true,"acceso":{"app":"vuelve","tipo":"suscripcion","ruta":"/tienda/vuelve/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve","detalle":"Suscripción anual · 2 meses gratis"},"suscripcion":{"intervalo":"year","extra":"prod_vuelve_sucursal_anual"}}')),
('prod_vuelve_sucursal_mensual', 'vuelve-sucursal-mensual', 'Vuelve · sucursal adicional (mensual)', 'Una sucursal más en tu programa de Vuelve, con su ubicación, su equipo y sus avisos por cercanía.', 24900, 0, 'Lealtad', 42, '[]', '/assets/tienda/vuelve.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"vuelve","tipo":"sucursal","ruta":"/tienda/vuelve/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"},"suscripcion":{"intervalo":"month"}}')),
('prod_vuelve_sucursal_anual', 'vuelve-sucursal-anual', 'Vuelve · sucursal adicional (anual)', 'Una sucursal más en tu programa de Vuelve por un año, con 2 meses gratis.', 249000, 0, 'Lealtad', 43, '[]', '/assets/tienda/vuelve.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"vuelve","tipo":"sucursal","ruta":"/tienda/vuelve/","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"},"suscripcion":{"intervalo":"year"}}'));
