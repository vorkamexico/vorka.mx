-- Simulador IPN (vorka.mx/simulador-ipn), examen de admisión a licenciatura (nivel superior) del IPN: 3 áreas, 140
-- reactivos en 3 horas. Mismos planes y precios que el Simulador UNAM:
--   Práctica ($149): Calentamientos, simulacros Medios y práctica por materia y por tema sin límite.
--   Examen ($199): 2 exámenes completos de su área (140 reactivos, 3 horas): el 1.º con tutor, el 2.º sin pistas.
--   Completo ($299): los dos (y con eso, plan de estudio, recordatorios, apuntes y la app).
-- Adicionales (solo para quien ya tiene el simulador): 1 simulacro Medio ($49) o 1 examen completo más ($79).
-- Entran inactivos, como todo producto nuevo: se activan en producción tras revisar la página en vivo.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido) VALUES
('prod_ipn_practica', 'simulador-ipn-practica', 'Simulador IPN · Práctica',
  'Calentamientos, simulacros Medios y práctica por materia y por tema sin límite para el examen de licenciatura del IPN, con tutor y reporte.',
  14900, 0, '/assets/tienda/v3/simulador-ipn-portada.webp', 'Exámenes', 6, '[]',
  '{"acceso":{"app":"simulador-ipn","ruta":"/simulador-ipn/","boton":"Entrar al simulador","tipo":"practica","ilimitado":true,"intentos":0,"examenes":0,"calentamientos":0},"plan":"practica","regalable":true,"titular":"Practica el examen IPN de tu área","subtitulo":"Calentamientos, simulacros Medios y práctica por materia sin límite, con un tutor que te guía cuando fallas y un reporte de qué reforzar.","portada":"Simulador IPN"}'),
('prod_ipn_completo', 'simulador-ipn-completo', 'Simulador IPN · Examen',
  '2 exámenes completos de tu área como el del IPN: 140 reactivos en 3 horas, con aciertos estimados por materia.',
  19900, 0, '/assets/tienda/v3/simulador-ipn-portada.webp', 'Exámenes', 7, '[]',
  '{"acceso":{"app":"simulador-ipn","ruta":"/simulador-ipn/","boton":"Entrar al simulador","tipo":"completo","intentos":0,"examenes":2,"calentamientos":0},"plan":"completo","regalable":true,"titular":"Mídete como el día del examen del IPN","subtitulo":"2 exámenes de 140 reactivos en 3 horas con el peso de las materias de tu área y un reporte de aciertos.","portada":"Simulador IPN"}'),
('prod_ipn_paquete', 'simulador-ipn-paquete', 'Simulador IPN · Completo (práctica + examen)',
  'Práctica sin límite y los 2 exámenes completos de tu área, con plan de estudio, recordatorios y apuntes.',
  29900, 0, '/assets/tienda/v3/simulador-ipn-portada.webp', 'Exámenes', 8, '[]',
  '{"acceso":{"app":"simulador-ipn","ruta":"/simulador-ipn/","boton":"Entrar al simulador","tipo":"paquete","ilimitado":true,"intentos":0,"examenes":2,"calentamientos":0},"plan":"paquete","regalable":true,"titular":"Prepárate para el examen IPN de tu área","subtitulo":"Práctica sin límite con tutor y 2 exámenes completos de 140 reactivos en 3 horas.","portada":"Simulador IPN"}'),
('prod_ipn_intento', 'simulador-ipn-intento', 'Simulacro adicional · Simulador IPN',
  'Un simulacro Medio adicional del Simulador IPN: unos 70 reactivos de tu área con tutor y reporte.',
  4900, 0, '/assets/tienda/v3/simulador-ipn-portada.webp', 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-ipn","ruta":"/simulador-ipn/","boton":"Volver al simulador","tipo":"intento","intentos":1}}'),
('prod_ipn_examen', 'simulador-ipn-examen', 'Examen IPN completo adicional · Simulador IPN',
  'Un examen IPN completo más: 140 reactivos de tu área en 3 horas, como el real.',
  7900, 0, '/assets/tienda/v3/simulador-ipn-portada.webp', 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-ipn","ruta":"/simulador-ipn/","boton":"Volver al simulador","tipo":"examen","intentos":0,"examenes":1}}');
