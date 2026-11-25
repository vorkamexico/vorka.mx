-- App a la medida (nov 2026): Vorka diseña y desarrolla una app SOLO para ese negocio (no es Vuelve con otro logo) y la publica
-- en App Store y Google Play con la cuenta de desarrollador de Vorka, con la autorización del cliente para usar su marca.
-- Precio decidido por el usuario (25-11-2026): un mes de preparación de $1,500 y luego $999 al mes, plan mínimo de 12 meses.
-- Se cobra como Tu página web (0091): suscripción mensual de $999 + un pago único obligatorio de $501 con el primer mes,
-- así el primer cobro es exactamente $1,500 (el mes de preparación) y después $999 cada mes.
-- Página de compra: /tienda/app-a-la-medida/ (src/appmedida.js). No abre ninguna app: el correo y la página de gracias llevan a WhatsApp.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_app_medida_mensual', 'app-medida-mensual', 'App a la medida · plan mensual', 'Diseñamos y desarrollamos la app de tu negocio y la publicamos en App Store y Google Play. Un mes de preparación y luego la mensualidad.', 99900, 1, 'Servicios', 62, '[]', NULL,
  json('{"acceso":{"app":"app-medida","tipo":"suscripcion","ruta":"/tienda/app-a-la-medida/","boton":"Escribir por WhatsApp","detalle":"Suscripción mensual · plan de 12 meses"},"suscripcion":{"intervalo":"month","instalacion":"prod_app_medida_preparacion","instalacion_obligatoria":true}}')),
('prod_app_medida_preparacion', 'app-medida-preparacion', 'Mes de preparación de tu app', 'Diseño, desarrollo y publicación de tu app. Pago único con tu primer mes.', 50100, 1, 'Servicios', 63, '[]', NULL,
  json('{"oculto":true,"instalacion_de":"prod_app_medida_mensual"}'));
