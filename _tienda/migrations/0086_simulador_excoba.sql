-- Simulador EXCOBA (vorka.mx/simulador-excoba): el Examen de Competencias Básicas (de Métrica Educativa, A.C.) que usan la
-- UAQ y la UG para licenciatura. UN solo simulador para las dos: el estudiante elige las 3 asignaturas de bachillerato de
-- su carrera; vorka.mx/simulador-excoba/uaq/ y /ug/ le dicen cuáles son (instructivos oficiales, excoba/FUENTES.md).
-- 180 preguntas (primaria 40, secundaria 80 y 3 asignaturas de bachillerato de 20) con respuesta semiconstruida y crédito
-- parcial, al ritmo de 1 minuto por pregunta. Mismos precios que el EXANI-II:
--   Práctica ($149): Calentamientos, simulacros Medios y práctica por asignatura y tema sin límite.
--   Examen ($199): 2 exámenes completos con sus asignaturas (180 preguntas): el 1.º con tutor, el 2.º sin pistas.
--   Completo ($299): los dos (y con eso, plan de estudio, recordatorios, apuntes y la app).
-- Adicionales (solo para quien ya tiene el simulador): 1 simulacro Medio ($49) o 1 examen completo más ($79).
-- Entran INACTIVOS, como todo producto nuevo: se activan en producción tras revisar la página en vivo.
-- Imágenes: assets/tienda/v3/simulador-excoba-*.webp (simulador/portadas_v3.py, SOLO=simulador-excoba).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido) VALUES
('prod_excoba_practica', 'simulador-excoba-practica', 'Simulador EXCOBA · Práctica',
  'Calentamientos, simulacros Medios y práctica por asignatura y tema sin límite para el EXCOBA de la UAQ y la UG, con tutor y reporte.',
  14900, 0, '/assets/tienda/v3/simulador-excoba-portada.webp', 'Exámenes', 15, '[]',
  '{"acceso":{"app":"simulador-excoba","ruta":"/simulador-excoba/","boton":"Entrar al simulador","tipo":"practica","ilimitado":true,"intentos":0,"examenes":0,"calentamientos":0},"plan":"practica","regalable":true,"titular":"Practica el EXCOBA con las asignaturas de tu carrera","subtitulo":"Calentamientos, simulacros Medios y práctica por asignatura sin límite, con preguntas de clasificar, elegir varias y escribir, un tutor que te guía cuando fallas y un reporte de qué reforzar.","portada":"Simulador EXCOBA"}'),
('prod_excoba_completo', 'simulador-excoba-completo', 'Simulador EXCOBA · Examen',
  '2 exámenes completos del EXCOBA con tus asignaturas: 180 preguntas, con aciertos por sección y crédito parcial.',
  19900, 0, '/assets/tienda/v3/simulador-excoba-portada.webp', 'Exámenes', 16, '[]',
  '{"acceso":{"app":"simulador-excoba","ruta":"/simulador-excoba/","boton":"Entrar al simulador","tipo":"completo","intentos":0,"examenes":2,"calentamientos":0},"plan":"completo","regalable":true,"titular":"Mídete como el día del EXCOBA","subtitulo":"2 exámenes de 180 preguntas con las asignaturas de tu carrera y un reporte de aciertos por sección.","portada":"Simulador EXCOBA"}'),
('prod_excoba_paquete', 'simulador-excoba-paquete', 'Simulador EXCOBA · Completo (práctica + examen)',
  'Práctica sin límite y los 2 exámenes completos con tus asignaturas, con plan de estudio, recordatorios y apuntes.',
  29900, 0, '/assets/tienda/v3/simulador-excoba-portada.webp', 'Exámenes', 17, '[]',
  '{"acceso":{"app":"simulador-excoba","ruta":"/simulador-excoba/","boton":"Entrar al simulador","tipo":"paquete","ilimitado":true,"intentos":0,"examenes":2,"calentamientos":0},"plan":"paquete","regalable":true,"titular":"Prepárate para el EXCOBA de la UAQ o la UG","subtitulo":"Práctica sin límite con tutor y 2 exámenes completos de 180 preguntas con las asignaturas de tu carrera.","portada":"Simulador EXCOBA"}'),
('prod_excoba_intento', 'simulador-excoba-intento', 'Simulacro adicional · Simulador EXCOBA',
  'Un simulacro Medio adicional del Simulador EXCOBA: 90 preguntas con tus asignaturas, tutor y reporte.',
  4900, 0, '/assets/tienda/v3/simulador-excoba-portada.webp', 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-excoba","ruta":"/simulador-excoba/","boton":"Volver al simulador","tipo":"intento","intentos":1}}'),
('prod_excoba_examen', 'simulador-excoba-examen', 'Examen EXCOBA completo adicional · Simulador EXCOBA',
  'Un examen EXCOBA completo más: 180 preguntas con tus asignaturas, como el real.',
  7900, 0, '/assets/tienda/v3/simulador-excoba-portada.webp', 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-excoba","ruta":"/simulador-excoba/","boton":"Volver al simulador","tipo":"examen","intentos":0,"examenes":1}}');
