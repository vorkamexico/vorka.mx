-- Ana Laura · Makeup: tienda en línea y productos de Ana Laura Hernández en Vende (vende.vorka.mx).
-- Vendedora: 88b11614-16ea-4bd8-b8bd-d882d1ddadd5 (slug ana-laura-hernandez). Generado con los textos de su catálogo oficial.
--
-- QUÉ HACE (idempotente: se puede correr varias veces con el mismo resultado)
--   1. Marcas «Ana Laura» y «Oleynick» (si no existen).
--   2. Seis productos con id fijo: textos, precio, contenido neto, foto principal, categoría (Rostro / Cuidado / Cabello),
--      destacados (los 4 de rostro) y el shampoo como personalizado (pregunta, hasta 3 fotos, preparación hasta 7 días hábiles).
--      No se duplica un producto si ella ya tiene uno activo con el mismo nombre. NO toca ni borra sus otros productos.
--      Ojo: volver a correrlo restablece nombre, textos, precio, categoría y fotos de ESTOS 6 productos a los del catálogo.
--   3. Fotos de reverso (base líquida y corrector) en producto_fotos.
--   4. Mi tienda: nombre, frase, color #9C3656, letra elegante, envío $250 con tope $250 y gratis desde $3,000,
--      tarifas por estado vacías (si ya tiene, se respetan), 24 h para pagar, políticas del catálogo y sitio autorizado
--      https://vorka.mx (se agrega a los que ya tenga).
--   NO captura datos bancarios (banco, CLABE y titular los pone ella en Más › Tienda en línea › Mi tienda) y deja la tienda
--   APAGADA mientras no estén completos. Aun encendida, Vende no confirma pedidos sin datos bancarios (revisarTienda).
--
-- ANTES: migracion_007_tienda.sql aplicada y fotos subidas a R2 con subir-fotos.sh (mismas claves que abajo).
-- APLICAR (desde la carpeta del repo vende, que tiene wrangler.jsonc con la base «vende»):
--   npx wrangler d1 execute vende --remote --file <ruta>/anaoleynick/makeup/_vende/ana-laura-makeup.sql -y
-- Sin BEGIN/COMMIT a propósito: D1 no los acepta en --file. Cada sentencia es segura por sí sola
-- (todas revisan que la vendedora exista; si no existe, no hacen nada).

-- 1. Marcas
INSERT INTO marcas (vendedora_id, nombre) SELECT '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'Ana Laura' WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  ON CONFLICT (vendedora_id, nombre) DO NOTHING;
INSERT INTO marcas (vendedora_id, nombre) SELECT '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'Oleynick' WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  ON CONFLICT (vendedora_id, nombre) DO NOTHING;

-- 2. Productos
-- Base Líquida Mate · $900 · 40 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'ad42ff9c-8a27-444b-b634-6262c8b4261d', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ana Laura'), 'Ana Laura', 'producto', 'Base Líquida Mate', 'La Base Líquida Mate Ana Laura es maquillaje de nivel profesional, creada para quienes buscan resultados visibles, piel impecable y un acabado que se nota desde la primera aplicación.

Cobertura media. Fórmula no comedogénica y Cruelty Free, con tecnología de adaptación que se integra a tu tono de piel y acabado mate natural.

Tip: aplica poca cantidad y difumina bien.
Contenido neto: 40 g', 90000, '40 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/ad42ff9c-8a27-444b-b634-6262c8b4261d-al1.webp', 'Rostro', 1, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'ad42ff9c-8a27-444b-b634-6262c8b4261d' AND activo = 1 AND lower(nombre) = lower('Base Líquida Mate'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria, destacado = excluded.destacado, pregunta = excluded.pregunta, pide_fotos = excluded.pide_fotos, preparacion = excluded.preparacion,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Base en Crema Cobertura Máxima · $900 · 30 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '1d3c8a4d-4335-4f43-b382-75c9f5232efb', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ana Laura'), 'Ana Laura', 'producto', 'Base en Crema Cobertura Máxima', 'La Base en Crema Máxima Cobertura Ana Laura es el maquillaje ideal para quienes exigen resultados de alto impacto: cobertura impresionante, piel uniforme desde la primera aplicación y un acabado que se mantiene durante horas, aun en condiciones exigentes.

Fórmula de larga duración, fácil de aplicar y difuminar, sin sensación pesada.

Contenido neto: 30 ml', 90000, '30 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/1d3c8a4d-4335-4f43-b382-75c9f5232efb-al1.webp', 'Rostro', 1, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '1d3c8a4d-4335-4f43-b382-75c9f5232efb' AND activo = 1 AND lower(nombre) = lower('Base en Crema Cobertura Máxima'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria, destacado = excluded.destacado, pregunta = excluded.pregunta, pide_fotos = excluded.pide_fotos, preparacion = excluded.preparacion,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Corrector en Crema Camouflage · $350 · 5.7 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '46bb533d-d272-4604-99d0-420ee3ee224a', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ana Laura'), 'Ana Laura', 'producto', 'Corrector en Crema Camouflage', 'El Corrector en Crema Camouflage Ana Laura es una herramienta de maquillaje de alto rendimiento, diseñada para neutralizar, corregir y cubrir imperfecciones con precisión profesional desde la primera aplicación.

Tono Yellow, ideal para neutralizar ojeras y manchas oscuras. Alta pigmentación con poca cantidad; fórmula libre de talco y parabenos.

Contenido neto: 5.7 g', 35000, '5.7 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/46bb533d-d272-4604-99d0-420ee3ee224a-al1.webp', 'Rostro', 1, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '46bb533d-d272-4604-99d0-420ee3ee224a' AND activo = 1 AND lower(nombre) = lower('Corrector en Crema Camouflage'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria, destacado = excluded.destacado, pregunta = excluded.pregunta, pide_fotos = excluded.pide_fotos, preparacion = excluded.preparacion,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Mineral HD Setting Powder · $650 · 19 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '721fb0c2-8d99-4758-aca6-143ae075667d', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ana Laura'), 'Ana Laura', 'producto', 'Mineral HD Setting Powder', 'El Mineral HD Setting Powder Ana Laura es el paso clave para sellar el maquillaje con un acabado impecable, ligero y de apariencia profesional, sin alterar el tono natural de la piel ni de la base.

Translúcido: se adapta a todos los tonos de piel sin dejar efecto blanco. Controla el brillo y difumina visualmente poros y líneas finas.

Contenido neto: 19 g', 65000, '19 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/721fb0c2-8d99-4758-aca6-143ae075667d-al1.webp', 'Rostro', 1, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '721fb0c2-8d99-4758-aca6-143ae075667d' AND activo = 1 AND lower(nombre) = lower('Mineral HD Setting Powder'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria, destacado = excluded.destacado, pregunta = excluded.pregunta, pide_fotos = excluded.pide_fotos, preparacion = excluded.preparacion,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Simply Clean Eye Makeup Remover · $800 · 118 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '1f662b45-a4bc-4291-839d-b3f5014cf6fa', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ana Laura'), 'Ana Laura', 'producto', 'Simply Clean Eye Makeup Remover', 'Simply Clean Eye Makeup Remover Ana Laura es un limpiador–desmaquillante en spray de grado profesional, formulado para remover el maquillaje de ojos de manera suave, eficaz y sin irritar.

2 en 1, desmaquillante y limpiador facial. Enriquecido con Aloe Vera; no deja sensación aceitosa.

Modo de uso: rocía el producto sobre un algodón y limpia suavemente el área de los ojos.
Contenido neto: 118 ml (4.0 fl oz)', 80000, '118 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/1f662b45-a4bc-4291-839d-b3f5014cf6fa-al1.webp', 'Cuidado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '1f662b45-a4bc-4291-839d-b3f5014cf6fa' AND activo = 1 AND lower(nombre) = lower('Simply Clean Eye Makeup Remover'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria, destacado = excluded.destacado, pregunta = excluded.pregunta, pide_fotos = excluded.pide_fotos, preparacion = excluded.preparacion,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Shampoo Personalizado 250 ml · $350 · 250 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'eba363c6-24b4-408e-aba3-3509b3c7ff0b', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Oleynick'), 'Oleynick', 'producto', 'Shampoo Personalizado 250 ml', 'Porque ningún cabello es igual, tu shampoo tampoco debería serlo.

Tú nos dices y nos muestras cómo es tu pelo (tipo, textura, necesidades y objetivos) y nosotros formulamos y enviamos el shampoo que mejor le convenga a tu cabello.

Contenido neto: 250 ml', 35000, '250 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/eba363c6-24b4-408e-aba3-3509b3c7ff0b-al1.webp', 'Cabello', 0, 'Cuéntanos cómo es tu cabello: tipo, textura, necesidades y objetivos', 3, 'Hasta 7 días hábiles'
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'eba363c6-24b4-408e-aba3-3509b3c7ff0b' AND activo = 1 AND lower(nombre) = lower('Shampoo Personalizado 250 ml'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria, destacado = excluded.destacado, pregunta = excluded.pregunta, pide_fotos = excluded.pide_fotos, preparacion = excluded.preparacion,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;

-- 3. Fotos adicionales (reverso). La principal está en productos.foto
-- (Sin reverso de la Base Líquida: la etiqueta muestra nombre y RFC del importador)
INSERT INTO producto_fotos (id, vendedora_id, producto_id, clave, orden)
SELECT '47252cfe224211e670d363a539587f4e', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '46bb533d-d272-4604-99d0-420ee3ee224a', 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/46bb533d-d272-4604-99d0-420ee3ee224a-al2.webp', 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '46bb533d-d272-4604-99d0-420ee3ee224a' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET clave = excluded.clave, orden = excluded.orden WHERE producto_fotos.vendedora_id = excluded.vendedora_id;

-- 4. Mi tienda (sin datos bancarios; apagada mientras no estén completos)
INSERT INTO tiendas (vendedora_id, activa, nombre, frase, descripcion, color, tipografia, envio_activo, envio_costo_c, envio_gratis_desde_c, envio_nota,
  envio_tarifas, envio_tope_c, recoger_activo, horas_pago, politica_envio, politica_cambios, politica_privacidad, origenes)
SELECT '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 0, 'Ana Laura · Makeup', 'Maquillaje de nivel profesional · by Oleynick', 'Bases, corrector, polvo HD y desmaquillante de la marca Ana Laura, más un shampoo personalizado para tu cabello. Envío a todo México.', '#9C3656', 'elegante', 1, 25000, 300000, 'Envío a todo México. Pedidos listos en 2 a 5 días hábiles (personalizados, hasta 7) y entrega en 2 a 6 días hábiles más, según paquetería y destino.',
  '{}', 25000, 0, 24,
  'Realizamos envíos a todo México.
Envío gratis en compras desde $3,000. En compras menores, el costo depende del destino, con un máximo de $250.
El tiempo de procesamiento de los pedidos es de 2 a 5 días hábiles una vez confirmado el pago.
En el caso de productos personalizados, el tiempo de preparación puede extenderse hasta 7 días hábiles, ya que se formulan especialmente para cada cliente.
El tiempo de entrega depende de la paquetería y del destino, y puede variar entre 2 y 6 días hábiles adicionales.
Una vez enviado el pedido, se proporcionará un número de guía para su seguimiento.
No nos hacemos responsables por retrasos ocasionados por la paquetería, condiciones climáticas, direcciones incorrectas o situaciones fuera de nuestro control.',
  'No se aceptan devoluciones ni reembolsos en productos personalizados, ya que son elaborados específicamente según las características indicadas por el cliente.
En productos no personalizados, solo se aceptarán cambios o reembolsos si el producto llega dañado, defectuoso o incorrecto.
Para solicitar un cambio o reembolso, el cliente deberá contactarnos dentro de las 48 horas posteriores a la recepción del producto, enviando evidencia fotográfica o en video.
El producto debe estar sin uso, en su empaque original y en perfectas condiciones.
Una vez validado el caso, se ofrecerá el reemplazo del producto o el reembolso correspondiente, según aplique.
No se realizan reembolsos por mal uso del producto o por resultados diferentes a los esperados, ya que estos pueden variar según cada persona.',
  'La información personal proporcionada por nuestros clientes es confidencial y de uso exclusivo para procesar pedidos, personalizar productos y brindar una mejor atención.
Los datos como nombre, dirección, teléfono, fotografías o información sobre el cabello no serán compartidos, vendidos ni distribuidos a terceros bajo ninguna circunstancia.
Las imágenes o información enviadas para la personalización de productos serán utilizadas únicamente con fines de análisis y formulación.
Nos comprometemos a proteger la privacidad y seguridad de nuestros clientes conforme a buenas prácticas de manejo de datos.',
  json_array('https://vorka.mx')
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (vendedora_id) DO UPDATE SET
  activa = CASE WHEN (tiendas.banco IS NOT NULL AND tiendas.titular IS NOT NULL AND length(coalesce(tiendas.clabe, '')) = 18) THEN tiendas.activa ELSE 0 END,
  nombre = excluded.nombre, frase = excluded.frase, descripcion = excluded.descripcion, color = excluded.color, tipografia = excluded.tipografia,
  envio_activo = 1, envio_costo_c = excluded.envio_costo_c, envio_gratis_desde_c = excluded.envio_gratis_desde_c, envio_nota = excluded.envio_nota,
  envio_tope_c = excluded.envio_tope_c, horas_pago = excluded.horas_pago,
  politica_envio = excluded.politica_envio, politica_cambios = excluded.politica_cambios, politica_privacidad = excluded.politica_privacidad,
  origenes = CASE WHEN EXISTS (SELECT 1 FROM json_each(tiendas.origenes) WHERE value = 'https://vorka.mx') THEN tiendas.origenes
                  ELSE json_insert(tiendas.origenes, '$[#]', 'https://vorka.mx') END,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 5. Revisión: lo que quedó (no cambia nada)
SELECT p.nombre, p.precio_venta_c / 100 AS precio, p.categoria, p.destacado, p.pide_fotos, p.preparacion, p.foto IS NOT NULL AS con_foto,
  (SELECT count(*) FROM producto_fotos f WHERE f.producto_id = p.id) AS fotos_extra
FROM productos p WHERE p.vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND p.activo = 1 ORDER BY p.destacado DESC, p.categoria, p.nombre;
SELECT activa, nombre, color, tipografia, envio_costo_c, envio_tope_c, envio_gratis_desde_c, horas_pago, origenes,
  banco IS NOT NULL AND clabe IS NOT NULL AND titular IS NOT NULL AS datos_bancarios FROM tiendas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5';
