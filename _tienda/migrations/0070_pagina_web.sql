-- Tu página web (nov 2026): servicio de Vorka México por SUSCRIPCIÓN mensual (Stripe Billing, como Cuentas o Vuelve).
-- $299 MXN al mes: diseño sin costo con plan de 12 meses, hospedaje con SSL, hasta 3 cambios pequeños al mes, botón de
-- WhatsApp y formulario, y alta en Google. El dominio NO se cobra aquí: su costo se paga por transferencia a Vorka por
-- WhatsApp, una vez al año. No hay app que abrir: el correo y la página de gracias llevan a WhatsApp para empezar.
-- Página de compra: /tienda/pagina-web/ (src/paginaweb.js); página del servicio: /servicios/pagina-web/ (_sitio/paginaweb.py).
-- Da Puntos Vorka a quien recomienda, como las demás suscripciones (FACTURAS_SUSCRIPCION en src/puntos-reglas.js).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_pagina_web_mensual', 'pagina-web-mensual', 'Tu página web · plan mensual', 'La página de tu negocio, diseñada, publicada y mantenida por Vorka México: hospedaje con SSL, cambios cada mes, botón de WhatsApp y alta en Google.', 29900, 1, 'Servicios', 60, '[]', NULL,
  json('{"acceso":{"app":"pagina-web","tipo":"suscripcion","ruta":"/tienda/pagina-web/","boton":"Escribir por WhatsApp","detalle":"Suscripción mensual · plan de 12 meses"},"suscripcion":{"intervalo":"month"}}'));
