-- Tu página web para proyectos sociales (17 nov 2026): con el código SOCIAL no se cobra el diseño personalizado ($499 de
-- pago único, migración 0091). No es un código de descuento (codigos_descuento exige pct > 0 y aquí el plan se cobra completo):
-- es una lista de códigos en el plan, suscripcion.sin_instalacion_con, que quita el pago único obligatorio en el checkout.
-- Vorka lo da por WhatsApp a ONG, colectivos y proyectos sociales: liga vorka.mx/tienda/pagina-web/?cupon=SOCIAL
UPDATE products SET
  contenido = json_set(contenido, '$.suscripcion.sin_instalacion_con', json('["SOCIAL"]')),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'prod_pagina_web_mensual';
