-- Simulador ECOEMS (vorka.mx/simulador-ecoems): examen para el bachillerato de la UNAM y del IPN («Mi derecho, mi lugar»),
-- 128 reactivos en 3 horas, sin áreas. Mismos planes que el UNAM, con precios para quien sale de secundaria (pagan los papás):
--   Práctica ilimitada ($129): Calentamientos, simulacros Medios (64 reactivos) y práctica por materia y por tema sin límite.
--   Simulador completo ($179): 2 exámenes completos (128 reactivos, 3 horas, sin tutor) con reporte.
--   Paquete ($249): los dos.
-- Adicionales (solo para quien ya tiene el simulador): 1 simulacro Medio ($49) o 1 examen completo ($79).
-- Entran inactivos, como todo producto nuevo: se activan en producción tras revisar la página en vivo. Imágenes: assets/tienda/simulador-ecoems-*.png (simulador/portadas_ecoems.py).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido) VALUES
('prod_ecoems_practica', 'simulador-ecoems-practica', 'Simulador ECOEMS · Práctica ilimitada',
  'Calentamientos, simulacros Medios y práctica por materia y por tema sin límite para el examen de la prepa UNAM e IPN, con tutor y reporte.',
  12900, 0, '/assets/tienda/simulador-ecoems-portada.png', 'Exámenes', 6, '[]',
  '{"acceso":{"app":"simulador-ecoems","ruta":"/simulador-ecoems/","boton":"Entrar al simulador","tipo":"practica","ilimitado":true,"intentos":0,"examenes":0,"calentamientos":0},"plan":"practica","regalable":true,"titular":"Practica el examen para la prepa UNAM e IPN","subtitulo":"Calentamientos, simulacros Medios y práctica por materia sin límite, con un tutor que te guía cuando fallas y un reporte de qué reforzar.","portada":"Simulador ECOEMS"}'),
('prod_ecoems_completo', 'simulador-ecoems-completo', 'Simulador ECOEMS · Simulador completo',
  '2 exámenes completos de 128 reactivos en 3 horas, sin pistas, con aciertos estimados por materia.',
  17900, 0, '/assets/tienda/simulador-ecoems-portada.png', 'Exámenes', 7, '[]',
  '{"acceso":{"app":"simulador-ecoems","ruta":"/simulador-ecoems/","boton":"Entrar al simulador","tipo":"completo","intentos":0,"examenes":2,"calentamientos":0},"plan":"completo","regalable":true,"titular":"Mídete como el día del examen","subtitulo":"2 exámenes de 128 reactivos en 3 horas con las 10 materias y un reporte de aciertos.","portada":"Simulador ECOEMS"}'),
('prod_ecoems_paquete', 'simulador-ecoems-paquete', 'Simulador ECOEMS · Paquete completo',
  'Práctica ilimitada y Simulador completo juntos: practica sin límite y presenta 2 exámenes completos.',
  24900, 0, '/assets/tienda/simulador-ecoems-portada.png', 'Exámenes', 8, '[]',
  '{"acceso":{"app":"simulador-ecoems","ruta":"/simulador-ecoems/","boton":"Entrar al simulador","tipo":"paquete","ilimitado":true,"intentos":0,"examenes":2,"calentamientos":0},"plan":"paquete","regalable":true,"titular":"Prepárate para el examen de la prepa UNAM e IPN","subtitulo":"Práctica sin límite con tutor y 2 exámenes completos de 128 reactivos en 3 horas.","portada":"Simulador ECOEMS"}'),
('prod_ecoems_intento', 'simulador-ecoems-intento', 'Simulacro adicional · Simulador ECOEMS',
  'Un simulacro Medio adicional del Simulador ECOEMS: 64 reactivos con tutor y reporte.',
  4900, 0, NULL, 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-ecoems","ruta":"/simulador-ecoems/","boton":"Volver al simulador","tipo":"intento","intentos":1}}'),
('prod_ecoems_examen', 'simulador-ecoems-examen', 'Examen completo adicional · Simulador ECOEMS',
  'Un examen completo más del Simulador ECOEMS: 128 reactivos en 3 horas, sin pistas.',
  7900, 0, NULL, 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-ecoems","ruta":"/simulador-ecoems/","boton":"Volver al simulador","tipo":"examen","intentos":0,"examenes":1}}');
