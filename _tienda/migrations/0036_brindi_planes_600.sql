-- Brindi · planes de octubre 2026: nuevo plan Íntimo (150) y más lugares en Esencial (300) y Celebración (600).
-- Escalera: Íntimo $299 · Esencial $449 · Celebración $699 · Premium $1,290 (sin cambio). Las mejoras cobran la diferencia exacta.
-- Paquete Organizador: 5 Celebración por $2,390 ($478 por evento; ahorra $1,105, 32 %). Aprobado el 24 de octubre de 2026.
-- Los límites viven en os.vorka.mx (br_planes): publica os ANTES que esta migración.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, contenido) VALUES
('prod_brindi_intimo', 'brindi-intimo', 'Brindi · Plan Íntimo', 'Invitación digital con enlace, QR general y confirmación de asistencia para hasta 150 invitados.', 29900, 1, 'Invitaciones', 19, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"plan","plan":"intimo","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Crear mi invitación","detalle":"Un evento · en línea hasta 30 días después de la fecha"}}')),
('prod_brindi_mejora_esencial', 'brindi-mejora-esencial', 'Brindi · Mejora a Esencial', 'Cambia un evento Íntimo a Esencial, hasta 300 invitados (pagas solo la diferencia).', 15000, 1, 'Invitaciones', 31, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"mejora","plan":"esencial","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Aplicarla a mi evento","detalle":"Para eventos con plan Íntimo"}}'));
UPDATE products SET precio_centavos = 44900, descripcion_corta = 'Invitación digital con enlace, QR general y confirmación de asistencia para hasta 300 invitados.', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_esencial';
UPDATE products SET precio_centavos = 69900, descripcion_corta = 'Invitaciones digitales con enlace y QR por invitado, control de acompañantes y estadísticas. Hasta 600 invitados.', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_celebracion';
UPDATE products SET precio_centavos = 239000, descripcion_corta = 'Cinco eventos con plan Celebración (hasta 600 invitados cada uno) para organizadores, salones y fotógrafos. 32 % de descuento.', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_organizador';
UPDATE products SET precio_centavos = 25000, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_mejora_celebracion';
UPDATE products SET precio_centavos = 59100, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_mejora_premium';
