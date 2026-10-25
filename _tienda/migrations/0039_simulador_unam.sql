-- Simulador UNAM (vorka.mx/simulador-unam), examen de selección de licenciatura de la UNAM (4 áreas). Mismos planes que el PAA,
-- con precios más bajos:
--   Práctica ilimitada ($149): Calentamientos, simulacros Medios (60 reactivos) y práctica por materia y por tema sin límite.
--   Simulador completo ($199): 2 exámenes oficiales de su área (120 reactivos, 3 horas, sin tutor) con reporte.
--   Paquete ($299): los dos.
-- Adicionales (solo para quien ya tiene el simulador): 1 simulacro Medio ($49) o 1 examen oficial ($79).
-- Entran inactivos, como todo producto nuevo: se activan en producción tras revisar la página en vivo. Imágenes: assets/tienda/simulador-unam-*.png (simulador/portadas_unam.py).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido) VALUES
('prod_unam_practica', 'simulador-unam-practica', 'Simulador UNAM · Práctica ilimitada',
  'Calentamientos, simulacros Medios y práctica por materia y por tema sin límite para el examen de licenciatura de la UNAM, con tutor y reporte.',
  14900, 0, '/assets/tienda/simulador-unam-portada.png', 'Exámenes', 3, '[]',
  '{"acceso":{"app":"simulador-unam","ruta":"/simulador-unam/","boton":"Entrar al simulador","tipo":"practica","ilimitado":true,"intentos":0,"examenes":0,"calentamientos":0},"plan":"practica","regalable":true,"titular":"Practica el examen UNAM de tu área","subtitulo":"Calentamientos, simulacros Medios y práctica por materia sin límite, con un tutor que te guía cuando fallas y un reporte de qué reforzar.","portada":"Simulador UNAM"}'),
('prod_unam_completo', 'simulador-unam-completo', 'Simulador UNAM · Simulador completo',
  '2 exámenes oficiales de tu área como el de la UNAM: 120 reactivos en 3 horas, sin pistas, con aciertos estimados por materia.',
  19900, 0, '/assets/tienda/simulador-unam-portada.png', 'Exámenes', 4, '[]',
  '{"acceso":{"app":"simulador-unam","ruta":"/simulador-unam/","boton":"Entrar al simulador","tipo":"completo","intentos":0,"examenes":2,"calentamientos":0},"plan":"completo","regalable":true,"titular":"Mídete como el día del examen UNAM","subtitulo":"2 exámenes de 120 reactivos en 3 horas con el peso de las materias de tu área y un reporte de aciertos.","portada":"Simulador UNAM"}'),
('prod_unam_paquete', 'simulador-unam-paquete', 'Simulador UNAM · Paquete completo',
  'Práctica ilimitada y Simulador completo juntos: practica sin límite y presenta 2 exámenes oficiales de tu área.',
  29900, 0, '/assets/tienda/simulador-unam-portada.png', 'Exámenes', 5, '[]',
  '{"acceso":{"app":"simulador-unam","ruta":"/simulador-unam/","boton":"Entrar al simulador","tipo":"paquete","ilimitado":true,"intentos":0,"examenes":2,"calentamientos":0},"plan":"paquete","regalable":true,"titular":"Prepárate para el examen UNAM de tu área","subtitulo":"Práctica sin límite con tutor y 2 exámenes oficiales de 120 reactivos en 3 horas.","portada":"Simulador UNAM"}'),
('prod_unam_intento', 'simulador-unam-intento', 'Simulacro adicional · Simulador UNAM',
  'Un simulacro Medio adicional del Simulador UNAM: 60 reactivos de tu área con tutor y reporte.',
  4900, 0, NULL, 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-unam","ruta":"/simulador-unam/","boton":"Volver al simulador","tipo":"intento","intentos":1}}'),
('prod_unam_examen', 'simulador-unam-examen', 'Examen UNAM completo adicional · Simulador UNAM',
  'Un examen UNAM completo más: 120 reactivos de tu área en 3 horas, como el real.',
  7900, 0, NULL, 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-unam","ruta":"/simulador-unam/","boton":"Volver al simulador","tipo":"examen","intentos":0,"examenes":1}}');
