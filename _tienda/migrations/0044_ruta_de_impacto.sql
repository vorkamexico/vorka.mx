-- Ruta de Impacto (curso interactivo para jóvenes de 15 a 29 años que hacen proyectos sociales). La app vive en Vorka OS
-- con dominio aislado: ruta.vorka.mx (ver vorka-os/PLAN-RUTA-DE-IMPACTO.md). Aquí solo se vende: ficha en
-- /tienda/ruta-de-impacto/ (src/ruta.js).
-- Decisión de Dirección del 26-10-2026: $99 MXN, PAGO ÚNICO, acceso por 1 año, regalable («regálaselo a un joven»).
-- Lo recibido va para IMPACTO (soyimpacto.org).
--
-- contenido.acceso.app = 'ruta': al pagarse, la tienda NO usa su propio enlace: le pide el acceso a Vorka OS por service
-- binding (RUTA → entrypoint Ruta) con darAcceso({ correo, nombre, orden, curso, dias }) y el correo lleva el enlace que
-- regresa. Para regalar, crearRegalo da la liga ruta.vorka.mx/regalo/… (una por unidad). Reembolso → revocar. Ver src/ruta.js.
-- acceso.url: si alguien entra con el enlace de /descargas/<token>, ruta.vorka.mx lo valida con Admin.validarAcceso(token, 'ruta').
-- acceso.curso y acceso.dias: lo que se pide a os ('jovenes', 365).
-- Entra INACTIVO: se activa desde Vorka OS › Tienda › Productos (o con el UPDATE de README-TIENDA.md, sección Ruta de Impacto).

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_ruta_de_impacto', 'ruta-de-impacto', 'Ruta de Impacto', 'Curso interactivo para sacar adelante tu proyecto social: lecciones cortas, racha diaria y un tutor que te guía paso a paso. Lo pruebas en tu comunidad con entrevistas y un piloto. Para jóvenes de 15 a 29 años.', 9900, 0, 'Educación', 9, '[]', '/assets/tienda/v3/ruta-de-impacto-portada.webp',
  json('{"regalable":true,"acceso":{"app":"ruta","curso":"jovenes","dias":365,"tipo":"curso","ruta":"/tienda/ruta-de-impacto/","url":"https://ruta.vorka.mx/entrar/","boton":"Empezar mi Ruta","detalle":"Pago único · acceso por 1 año"},"incluye":["6 niveles y el proyecto final, con lecciones de 3 a 5 minutos","Tutor con pistas y explicación paso a paso","Calificación sobre 100 y constancia"]}'));
