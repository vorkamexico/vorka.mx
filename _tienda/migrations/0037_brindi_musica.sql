-- Brindi · Música y mensaje de voz (octubre 2026): biblioteca con licencia (Kevin MacLeod, CC BY 4.0, con crédito en la invitación)
-- o un audio propio de hasta 60 s. Incluido en Premium; complemento de $99 para los demás planes. Aprobado el 24 de octubre de 2026.
-- Se publica DESPUÉS de os.vorka.mx (la app debe conocer el tipo "musica").
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, contenido) VALUES
('prod_brindi_musica', 'brindi-musica', 'Brindi · Música y mensaje de voz', 'Tu invitación suena al abrirla: elige una pieza de la biblioteca o sube un mensaje de voz de hasta un minuto.', 9900, 1, 'Invitaciones', 36, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"musica","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Aplicarlo a mi evento","detalle":"Se aplica desde Ajustes del evento"}}'));
