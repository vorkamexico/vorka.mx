-- Cupo Pro por aforo (decisión de Dirección, 19-10-2026, tras revisar competencia): pagas según cuántas personas recibes.
-- Hasta 300 personas $149 (producto cupo-pro), hasta 1,000 $299 y hasta 3,000 $599. Paquete de 5 eventos de hasta 300: $599.
-- contenido.acceso.personas le dice a os.vorka.mx el aforo de cada evento Pro (compras anteriores valen hasta 1,000).
UPDATE products SET nombre = 'Cupo Pro · hasta 300 personas', precio_centavos = 14900,
  descripcion_corta = 'Un evento de hasta 300 personas con correos automáticos, cover sin comisión, ligas para RPs y check-in con tu equipo.',
  contenido = json_set(contenido, '$.acceso.personas', 300, '$.acceso.detalle', 'Pago único · un evento de hasta 300 personas',
    '$.titular', 'Correos, cover y RPs para llenar tu evento',
    '$.faq', json('[{"p":"¿Y si van más de 300 personas?","r":"Elige <a href=\"/tienda/cupo-pro-1000/\">hasta 1,000 personas ($299)</a> o <a href=\"/tienda/cupo-pro-3000/\">hasta 3,000 ($599)</a>. Si ya activaste este y se te llena, subes de nivel desde tu evento."},{"p":"¿Qué incluye el plan gratis?","r":"Página del evento, registro y entrada con QR, lista de espera y check-in, hasta 100 personas. No manda correos: cada persona recupera su entrada en la página del evento con su correo y un NIP. Para correos, cover y RPs necesitas Pro."},{"p":"¿Puedo armar mi evento antes de pagar?","r":"Sí. En <a href=\"https://os.vorka.mx/cupo/\">os.vorka.mx/cupo</a> lo armas y ves cómo queda sin cuenta y sin pagar. Activas Pro solo cuando lo vas a publicar."},{"p":"¿Cómo funcionan las ligas de RP?","r":"En tu evento entras a “RPs”, escribes el nombre de cada uno y le compartes su liga y su panel. Tú ves el ranking; cada RP ve solo a su gente (nombre y si llegó), sin correos ni teléfonos."},{"p":"¿Cupo cobra comisión por mi cover?","r":"No. Las personas te pagan directo a ti y tú confirmas cada pago. Solo pagas Cupo Pro una vez por evento."},{"p":"¿Cupo o Brindi?","r":"Cupo es para eventos rápidos o informales: fiestas, antros, Halloween, networking y talleres. Para una boda, XV años o bautizo te conviene <a href=\"/tienda/brindi/\">Brindi</a>."}]')),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_cupo_pro';

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido)
SELECT 'prod_cupo_pro_1000', 'cupo-pro-1000', 'Cupo Pro · hasta 1,000 personas', 'Un evento de hasta 1,000 personas con correos automáticos, cover sin comisión, ligas para RPs y check-in con tu equipo.', 29900, 1, categoria, 31, '[]', imagen,
  json_set(contenido, '$.acceso.personas', 1000, '$.acceso.detalle', 'Pago único · un evento de hasta 1,000 personas', '$.titular', 'Para fiestas grandes, antros y conciertos',
    '$.faq', json('[{"p":"¿En qué se distingue del de 300?","r":"Es lo mismo de Cupo Pro, para hasta 1,000 personas en un evento."},{"p":"¿Y si van más de 1,000?","r":"Elige <a href=\"/tienda/cupo-pro-3000/\">hasta 3,000 personas ($599)</a>. Para más, escríbenos a hola@vorka.mx."},{"p":"¿Cupo cobra comisión por mi cover?","r":"No. Las personas te pagan directo a ti. Solo pagas Cupo Pro una vez por evento."}]'))
FROM products WHERE id = 'prod_cupo_pro';

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido)
SELECT 'prod_cupo_pro_3000', 'cupo-pro-3000', 'Cupo Pro · hasta 3,000 personas', 'Un evento de hasta 3,000 personas con correos automáticos, cover sin comisión, ligas para RPs y check-in con tu equipo.', 59900, 1, categoria, 32, '[]', imagen,
  json_set(contenido, '$.acceso.personas', 3000, '$.acceso.detalle', 'Pago único · un evento de hasta 3,000 personas', '$.titular', 'Para festivales, conciertos y eventos masivos',
    '$.faq', json('[{"p":"¿En qué se distingue de los otros niveles?","r":"Es lo mismo de Cupo Pro, para hasta 3,000 personas en un evento. Para más, escríbenos a hola@vorka.mx."},{"p":"¿Varias personas pueden hacer check-in?","r":"Sí: generas una liga de check-in para tu equipo y escanean desde su celular, sin cuenta, sin que nadie entre dos veces."},{"p":"¿Cupo cobra comisión por mi cover?","r":"No. Las personas te pagan directo a ti. Solo pagas Cupo Pro una vez por evento."}]'))
FROM products WHERE id = 'prod_cupo_pro';

UPDATE products SET orden = 33, precio_centavos = 59900,
  descripcion_corta = 'Cinco eventos Pro de hasta 300 personas (correos, cover, RPs y más) para usar en 12 meses. Sale en $119.80 por evento.',
  contenido = json_set(contenido, '$.acceso.personas', 300, '$.acceso.detalle', 'Pago único · 5 eventos de hasta 300 personas en 12 meses',
    '$.subtitulo', 'Todo lo de Cupo Pro en cinco eventos de hasta 300 personas: sale en $119.80 por evento (ahorras $146 contra comprarlos sueltos). Los aplicas al publicar cada evento durante 12 meses.',
    '$.incluye', json('[{"titulo":"5 eventos Pro de hasta 300 personas","texto":"Correos y recordatorios, cover, ligas para RPs, aprobación, preguntas, avisos, check-in con equipo y Excel en cada uno."},{"titulo":"Ahorras $146","texto":"$599 por cinco eventos contra $745 sueltos."},{"titulo":"Sin comisiones por boleto","texto":"El dinero del cover llega directo a ti."},{"titulo":"12 meses para usarlos","texto":"Ideal para eventos mensuales, fines de semana o temporadas."}]')),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_cupo_paquete5';
