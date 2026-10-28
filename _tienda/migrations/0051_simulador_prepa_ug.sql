-- Simulador prepa UG (vorka.mx/simulador-prepa-ug): EXANI-I de CENEVAL para entrar al bachillerato de la Universidad de
-- Guanajuato, 160 reactivos de tres opciones en 4 h 30 min, 5 áreas, sin áreas de elección. Mismos planes y precios que el
-- ECOEMS (pagan los papás):
--   Práctica ($129): Calentamientos, simulacros Medios (80 reactivos) y práctica por área y por tema sin límite.
--   Examen ($179): 2 exámenes completos (160 reactivos, 4 h 30 min; el 1.º con tutor) con reporte.
--   Completo ($249): los dos.
-- Adicionales (solo para quien ya tiene el simulador): 1 simulacro Medio ($49) o 1 examen completo ($79).
-- Entran inactivos, como todo producto nuevo: se activan en producción tras revisar la página en vivo.
-- Imágenes: assets/tienda/v3/simulador-prepa-ug-*.webp (simulador/portadas_v3.py).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido) VALUES
('prod_prepa_ug_practica', 'simulador-prepa-ug-practica', 'Simulador prepa UG · Práctica',
  'Calentamientos, simulacros Medios y práctica por área y por tema sin límite para el EXANI-I de la prepa UG, con tutor y reporte.',
  12900, 0, '/assets/tienda/v3/simulador-prepa-ug-portada.webp', 'Exámenes', 9, '[]',
  '{"acceso":{"app":"simulador-prepa-ug","ruta":"/simulador-prepa-ug/","boton":"Entrar al simulador","tipo":"practica","ilimitado":true,"intentos":0,"examenes":0,"calentamientos":0},"plan":"practica","regalable":true,"titular":"Practica el EXANI-I para la prepa UG","subtitulo":"Calentamientos, simulacros Medios y práctica por área sin límite, con un tutor que guía cuando fallas y un reporte de qué reforzar.","portada":"Simulador prepa UG"}'),
('prod_prepa_ug_completo', 'simulador-prepa-ug-completo', 'Simulador prepa UG · Examen',
  '2 exámenes completos de 160 reactivos en 4 horas y media, con aciertos estimados por área.',
  17900, 0, '/assets/tienda/v3/simulador-prepa-ug-portada.webp', 'Exámenes', 10, '[]',
  '{"acceso":{"app":"simulador-prepa-ug","ruta":"/simulador-prepa-ug/","boton":"Entrar al simulador","tipo":"completo","intentos":0,"examenes":2,"calentamientos":0},"plan":"completo","regalable":true,"titular":"Mídete como el día del examen","subtitulo":"2 exámenes de 160 reactivos en 4 horas y media con las 5 áreas del EXANI-I y un reporte de aciertos.","portada":"Simulador prepa UG"}'),
('prod_prepa_ug_paquete', 'simulador-prepa-ug-paquete', 'Simulador prepa UG · Completo (práctica + examen)',
  'Práctica y Examen juntos: practica sin límite y presenta 2 exámenes completos.',
  24900, 0, '/assets/tienda/v3/simulador-prepa-ug-portada.webp', 'Exámenes', 11, '[]',
  '{"acceso":{"app":"simulador-prepa-ug","ruta":"/simulador-prepa-ug/","boton":"Entrar al simulador","tipo":"paquete","ilimitado":true,"intentos":0,"examenes":2,"calentamientos":0},"plan":"paquete","regalable":true,"titular":"Prepárate para entrar a la prepa UG","subtitulo":"Práctica sin límite con tutor y 2 exámenes completos de 160 reactivos en 4 horas y media.","portada":"Simulador prepa UG"}'),
('prod_prepa_ug_intento', 'simulador-prepa-ug-intento', 'Simulacro adicional · Simulador prepa UG',
  'Un simulacro Medio adicional del Simulador prepa UG: 80 reactivos con tutor y reporte.',
  4900, 0, NULL, 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-prepa-ug","ruta":"/simulador-prepa-ug/","boton":"Volver al simulador","tipo":"intento","intentos":1}}'),
('prod_prepa_ug_examen', 'simulador-prepa-ug-examen', 'Examen completo adicional · Simulador prepa UG',
  'Un examen completo más del Simulador prepa UG: 160 reactivos en 4 horas y media, sin pistas.',
  7900, 0, NULL, 'Exámenes', 99, '[]',
  '{"oculto":true,"acceso":{"app":"simulador-prepa-ug","ruta":"/simulador-prepa-ug/","boton":"Volver al simulador","tipo":"examen","intentos":0,"examenes":1}}');
