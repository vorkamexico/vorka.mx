-- Tu página web (nov 2026): el diseño personalizado deja de ir «sin costo con el plan de 12 meses» y se cobra UNA vez,
-- $499, junto con el primer mes (como la instalación de Negocio Completo: renglón sin recurring en la sesión de Stripe).
-- A diferencia de Negocio Completo, aquí no es opcional: suscripcion.instalacion_obligatoria hace que el checkout lo agregue
-- siempre. El plan de 12 meses y el dominio aparte se quedan igual. No se vende solo (contenido.instalacion_de).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_pagina_web_diseno', 'pagina-web-diseno', 'Diseño personalizado de tu página', 'Diseñamos tu página web con tu logo, tus fotos y tus colores. Pago único con tu primer mes.', 49900, 1, 'Servicios', 61, '[]', NULL,
  json('{"oculto":true,"instalacion_de":"prod_pagina_web_mensual"}'));

UPDATE products SET
  contenido = json_set(contenido, '$.suscripcion.instalacion', 'prod_pagina_web_diseno', '$.suscripcion.instalacion_obligatoria', json('true')),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'prod_pagina_web_mensual';
