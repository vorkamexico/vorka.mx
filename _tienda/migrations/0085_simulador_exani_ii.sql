-- Simulador EXANI-II (vorka.mx/simulador-exani-ii): el examen de admisión a licenciatura de CENEVAL que usan la BUAP,
-- la UANL, la UADY, la UAA, la UAdeC y otras universidades públicas. UN solo simulador para todas: el estudiante elige los
-- dos módulos de su carrera; vorka.mx/simulador-exani-ii/universidades/ le dice qué examen pide su universidad.
-- 168 reactivos de tres opciones en 4 h 30 min (3 áreas de 30, 2 módulos de 24 e Inglés 30). Mismos precios que UNAM e IPN:
--   Práctica ($149): Calentamientos, simulacros Medios y práctica por área, módulo y tema sin límite.
--   Examen ($199): 2 exámenes completos con sus módulos (168 reactivos, 4 h 30 min): el 1.º con tutor, el 2.º sin pistas.
--   Completo ($299): los dos (y con eso, plan de estudio, recordatorios, apuntes y la app).
-- Adicionales (solo para quien ya tiene el simulador): 1 simulacro Medio ($49) o 1 examen completo más ($79).
-- Entran INACTIVOS, como todo producto nuevo: se activan en producción tras revisar la página en vivo.
-- Imágenes: assets/tienda/v3/simulador-exani-ii-*.webp (simulador/portadas_v3.py, SOLO=simulador-exani-ii).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido) VALUES
('prod_exani2_practica', 'simulador-exani-ii-practica', 'Simulador EXANI-II · Práctica',
  'Calentamientos, simulacros Medios y práctica por área, módulo y tema sin límite para el EXANI-II, con tutor y reporte.',
  14900, 0, '/assets/tienda/v3/simulador-exani-ii-portada.webp', 'Exámenes', 12, '[]',
  '{"acceso":{"app":"simulador-exani-ii","ruta":"/simulador-exani-ii/","boton":"Entrar al simulador","tipo":"practica","ilimitado":true,"intentos":0,"examenes":0,"calentamientos":0},"plan":"practica","regalable":true,"titular":"Practica el EXANI-II con tus módulos","subtitulo":"Calentamientos, simulacros Medios y práctica por área y módulo sin límite, con un tutor que te guía cuando fallas y un reporte de qué reforzar.","portada":"Simulador EXANI-II"}'),
('prod_exani2_completo', 'simulador-exani-ii-completo', 'Simulador EXANI-II · Examen',
  '2 exámenes completos del EXANI-II con tus módulos: 168 reactivos en 4 horas y media, con aciertos por área.',
  19900, 0, '/assets/tienda/v3/simulador-exani-ii-portada.webp', 'Exámenes', 13, '[]',
  '{"acceso":{"app":"simulador-exani-ii","ruta":"/simulador-exani-ii/","boton":"Entrar al simulador","tipo":"completo","intentos":0,"examenes":2,"calentamientos":0},"plan":"completo","regalable":true,"titular":"Mídete como el día del EXANI-II","subtitulo":"2 exámenes de 168 reactivos en 4 horas y media con los módulos de tu carrera y un reporte de aciertos.","portada":"Simulador EXANI-II"}'),
('prod_exani2_paquete', 'simulador-exani-ii-paquete', 'Simulador EXANI-II · Completo (práctica + examen)',
  'Práctica sin límite y los 2 exámenes completos con tus módulos, con plan de estudio, recordatorios y apuntes.',
  29900, 0, '/assets/tienda/v3/simulador-exani-ii-portada.webp', 'Exámenes', 14, '[]',
  '{"acceso":{"app":"simulador-exani-ii","ruta":"/simulador-exani-ii/","boton":"Entrar al simulador","tipo":"paquete","ilimitado":true,"intentos":0,"examenes":2,"calentamientos":0},"plan":"paquete","regalable":true,"titular":"Prepárate para el EXANI-II de tu universidad","subtitulo":"Práctica sin límite con tutor y 2 exámenes completos de 168 reactivos en 4 horas y media.","portada":"Simulador EXANI-II"}'),
('prod_exani2_intento', 'simulador-exani-ii-intento', 'Simulacro adicional · Simulador EXANI-II',
  'Un simulacro Medio adicional del Simulador EXANI-II: unos 84 reactivos con tus módulos, tutor y reporte.',
  4900, 0, '/assets/tienda/v3/simulador-exani-ii-portada.webp', 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-exani-ii","ruta":"/simulador-exani-ii/","boton":"Volver al simulador","tipo":"intento","intentos":1}}'),
('prod_exani2_examen', 'simulador-exani-ii-examen', 'Examen EXANI-II completo adicional · Simulador EXANI-II',
  'Un examen EXANI-II completo más: 168 reactivos con tus módulos en 4 horas y media, como el real.',
  7900, 0, '/assets/tienda/v3/simulador-exani-ii-portada.webp', 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-exani-ii","ruta":"/simulador-exani-ii/","boton":"Volver al simulador","tipo":"examen","intentos":0,"examenes":1}}');
