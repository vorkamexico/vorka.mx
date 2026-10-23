-- Brindi · Álbum de invitados (octubre 2026): desde el día del evento, los invitados suben sus fotos desde la invitación y el anfitrión
-- aprueba cuáles se ven. Incluido en Premium; complemento para Esencial y Celebración. Hasta 400 fotos por evento (ver os/src/brindi/album.js).
-- Entra INACTIVO como los demás productos de Brindi: actívalo en Vorka México → Tienda DESPUÉS de publicar os.vorka.mx (la app ya debe conocer el tipo "album").
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, contenido) VALUES
('prod_brindi_album', 'brindi-album', 'Brindi · Álbum de invitados', 'Tus invitados suben sus fotos desde la invitación el día del evento; tú eliges cuáles se ven y las descargas todas. Hasta 400 fotos.', 19900, 0, 'Invitaciones', 35, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"album","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Aplicarlo a mi evento","detalle":"Se aplica desde Ajustes del evento"}}'));
