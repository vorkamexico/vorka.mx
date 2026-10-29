-- Evaluación de liderazgo Vorka (aprobada por Dirección el 28-10-2026). La app vive en Vorka OS con dominio aislado:
-- liderazgo.vorka.mx (ver vorka-os/src/liderazgo/index.js). Aquí solo se vende: ficha en /tienda/evaluacion-liderazgo/ (src/liderazgo.js).
-- $149 MXN, PAGO ÚNICO, regalable. Incluye 2 aplicaciones: la inicial y una de seguimiento a partir de 90 días.
-- Es el primer paso de toda Mentoría: a los clientes se les manda sin costo desde Vorka OS (no pasa por esta tienda).
--
-- contenido.acceso.app = 'liderazgo': al pagarse, la tienda le pide a Vorka OS la liga personal por service binding
-- (LIDERAZGO → entrypoint Liderazgo) con darAcceso({ correo, nombre, orden }); para regalar, crearRegalo da una liga por unidad.
-- Reembolso → revocar. Mismo camino que Ruta de Impacto (src/ruta-entrega.js › APPS_OS).
-- Entra INACTIVO: se activa desde Vorka OS › Tienda › Productos cuando Dirección lo decida.

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_evaluacion_liderazgo', 'evaluacion-liderazgo', 'Evaluación de liderazgo Vorka', '80 preguntas para saber dónde estás como líder: tu resultado en 12 dimensiones, lo que crees de ti contra lo que has hecho, tus fortalezas y 3 acciones para los próximos 30 días. Incluye una segunda aplicación a los 90 días para medir tu avance.', 14900, 0, 'Educación', 10, '[]', NULL,
  json('{"regalable":true,"portada":"Evaluación de liderazgo","acceso":{"app":"liderazgo","tipo":"evaluacion","ruta":"/tienda/evaluacion-liderazgo/","url":"https://liderazgo.vorka.mx/","boton":"Empezar mi evaluación","detalle":"Pago único · 2 aplicaciones (hoy y a los 90 días)"},"incluye":["80 preguntas, unos 25 minutos","Resultado en 12 dimensiones y global sobre 100","Fortalezas, áreas de mejora y 3 acciones a 30 días","Segunda aplicación a los 90 días para medir tu avance"]}'));
