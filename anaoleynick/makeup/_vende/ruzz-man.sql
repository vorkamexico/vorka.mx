-- Ruzz Man (línea de barbería) en la tienda de Ana Laura Hernández en Vende. Textos y precios del catálogo oficial en Canva.
-- Vendedora: 88b11614-16ea-4bd8-b8bd-d882d1ddadd5 (slug ana-laura-hernandez).
--
-- QUÉ HACE (idempotente: se puede correr varias veces con el mismo resultado)
--   1. Marca «Ruzz Man» (si no existe).
--   2. 34 productos con id fijo: nombre, descripción, precio, contenido, foto principal y categoría (Afeitado / Cabello / Peinado / Barbería).
--      No duplica un producto si ella ya tiene uno activo con el mismo nombre. NO toca ni borra sus otros productos.
--      Volver a correrlo restablece nombre, textos, precio, categoría y foto de ESTOS 34 a los del catálogo.
--   3. Presentaciones con precio propio como variantes (250/500 ml, 250/500/1000 g, 150/300 g, 10/20 g).
--   NO toca la tienda (sigue como esté: apagada mientras no tenga datos bancarios).
--
-- ANTES: fotos subidas a R2 con subir-fotos-ruzz-man.sh (mismas claves que abajo).
-- APLICAR (desde la carpeta del repo vende):
--   npx wrangler d1 execute vende --remote --file <ruta>/anaoleynick/makeup/_vende/ruzz-man.sql -y

-- 1. Marca
INSERT INTO marcas (vendedora_id, nombre) SELECT '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'Ruzz Man' WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  ON CONFLICT (vendedora_id, nombre) DO NOTHING;

-- 2. Productos
-- Shaving Gel Rosa · $150 (desde) · 250 ml · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'dfd72f6b-8c61-5a27-85c2-187d6f691f70', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Shaving Gel Rosa', 'Haz de cada afeitado una experiencia diferente con el Shaving Gel Rosa, una fragancia con un toque dulce, suave y moderno que aporta una sensación de frescura y limpieza. Su fórmula hidratante facilita el deslizamiento del rastrillo, ayuda a prevenir la irritación y deja la piel suave, protegida y con un agradable aroma que perdura.

Ideal para barberías, salones y uso personal. Disfruta de un afeitado profesional con la fragancia de tu color favorito y una piel protegida en cada aplicación.

Beneficios:
• Hidrata y protege la piel.
• Ayuda a prevenir la irritación.
• Favorece un afeitado suave y preciso.
• Apto para todo tipo de piel.
• Fragancia dulce y duradera.

Contenido neto: 250 ml · 500 ml', 15000, '250 ml · 500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/dfd72f6b-8c61-5a27-85c2-187d6f691f70-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'dfd72f6b-8c61-5a27-85c2-187d6f691f70' AND activo = 1 AND lower(nombre) = lower('Shaving Gel Rosa'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Shaving Gel Verde · $150 (desde) · 250 ml · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '653f144c-583d-5785-b5da-dd8e416b657d', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Shaving Gel Verde', 'Experimenta un afeitado refrescante con el Shaving Gel Verde, una fragancia inspirada en la frescura y vitalidad que brinda una sensación revitalizante durante y después del afeitado. Su fórmula hidratante ayuda a proteger la piel, facilita el deslizamiento del rastrillo y contribuye a reducir la irritación, dejando un acabado suave y confortable.

Ideal para barberías, salones y uso personal. Disfruta de un afeitado profesional con la fragancia de tu color favorito y una piel protegida en cada aplicación.

Beneficios:
• Hidrata y cuida la piel.
• Ayuda a minimizar la irritación.
• Permite un afeitado más cómodo y preciso.
• Apto para todo tipo de piel.
• Fragancia fresca y revitalizante de larga duración.

Contenido neto: 250 ml · 500 ml', 15000, '250 ml · 500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/653f144c-583d-5785-b5da-dd8e416b657d-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '653f144c-583d-5785-b5da-dd8e416b657d' AND activo = 1 AND lower(nombre) = lower('Shaving Gel Verde'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Shaving Gel Morado · $150 (desde) · 250 ml · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'af53a518-59bb-5b26-8c62-9fb2cd6b59ae', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Shaving Gel Morado', 'Eleva tu rutina de afeitado con el Shaving Gel Morado, una fragancia con un carácter intenso, elegante y sofisticado que deja una sensación de frescura y distinción. Su fórmula hidratante permite un deslizamiento suave del rastrillo, ayuda a prevenir la irritación y protege la piel, proporcionando un acabado limpio, cómodo y con un aroma duradero.

Ideal para barberías, salones y uso personal. Disfruta de un afeitado profesional con la fragancia de tu color favorito y una piel protegida en cada aplicación.

Beneficios:
• Hidrata y protege la piel.
• Ayuda a prevenir la irritación.
• Facilita un afeitado suave y preciso.
• Apto para todo tipo de piel.
• Fragancia intensa, elegante y de larga duración.

Contenido neto: 250 ml · 500 ml', 15000, '250 ml · 500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/af53a518-59bb-5b26-8c62-9fb2cd6b59ae-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'af53a518-59bb-5b26-8c62-9fb2cd6b59ae' AND activo = 1 AND lower(nombre) = lower('Shaving Gel Morado'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- After Shave Spray Rosa · $150 (desde) · 250 ml · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'fc671f66-8cc4-5d4a-8e06-2769f7f7b96a', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'After Shave Spray Rosa', 'Convierte el afeitado en una experiencia única con el After Shave Spray Rosa. Su fragancia dulce y moderna aporta un toque distintivo que permanece en la piel, mientras su fórmula hidrata, calma y ayuda a reducir la irritación posterior al afeitado. Deja una sensación de suavidad y bienestar que hace que cada servicio se sienta más completo y profesional.

Su aroma envolvente es perfecto para quienes buscan ofrecer un detalle diferente que marque la diferencia en la experiencia del cliente.

Ideal para Barberías y salones que desean ofrecer un servicio premium con una fragancia moderna, así como para uso personal de quienes prefieren aromas dulces y agradables.

Beneficios:
• Hidrata y suaviza la piel.
• Ayuda a disminuir la irritación después del afeitado.
• Refresca y brinda una sensación de confort.
• Fragancia dulce de larga duración.
• Apto para todo tipo de piel.

Contenido neto: 250 ml · 500 ml', 15000, '250 ml · 500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/fc671f66-8cc4-5d4a-8e06-2769f7f7b96a-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'fc671f66-8cc4-5d4a-8e06-2769f7f7b96a' AND activo = 1 AND lower(nombre) = lower('After Shave Spray Rosa'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- After Shave Spray Verde · $150 (desde) · 250 ml · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'After Shave Spray Verde', 'El After Shave Spray Verde ofrece una sensación revitalizante que devuelve el confort a la piel después del afeitado. Su fórmula ayuda a hidratar, refrescar y aliviar la piel, mientras su fragancia fresca y energizante deja un acabado limpio y agradable durante todo el día.

Es una excelente opción para complementar cualquier servicio de barbería, proporcionando un toque profesional que mejora la experiencia del cliente desde el primer momento.

Ideal para Barberías con alto flujo de clientes, salones de belleza, academias de barbería y personas que buscan una sensación de frescura y energía después de cada afeitado.

Beneficios:
• Hidrata y revitaliza la piel.
• Ayuda a reducir la irritación posterior al afeitado.
• Refresca y suaviza la piel.
• Fragancia fresca y duradera.
• Apto para todo tipo de piel.

Contenido neto: 250 ml · 500 ml', 15000, '250 ml · 500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095' AND activo = 1 AND lower(nombre) = lower('After Shave Spray Verde'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- After Shave Spray Morado · $150 (desde) · 250 ml · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'e3e255f1-3925-5fe7-bec7-41ee211d2c42', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'After Shave Spray Morado', 'Dale un acabado elegante a cada servicio con el After Shave Spray Morado. Su fragancia intensa y sofisticada se combina con una fórmula que hidrata, calma y protege la piel después del afeitado, ayudando a reducir la irritación y dejando un aroma que transmite presencia y distinción.

Pensado para quienes entienden que los pequeños detalles hacen la diferencia, este after shave convierte el final del afeitado en una experiencia premium que el cliente recordará.

Ideal para Barberías premium, salones de belleza, distribuidores de productos profesionales y hombres que buscan un acabado sofisticado con una fragancia elegante y duradera.

Beneficios:
• Hidrata y protege la piel.
• Ayuda a calmar la irritación y la sensibilidad.
• Suaviza y refresca el rostro.
• Fragancia intensa y de larga duración.
• Apto para todo tipo de piel.

Contenido neto: 250 ml · 500 ml', 15000, '250 ml · 500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/e3e255f1-3925-5fe7-bec7-41ee211d2c42-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'e3e255f1-3925-5fe7-bec7-41ee211d2c42' AND activo = 1 AND lower(nombre) = lower('After Shave Spray Morado'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- After Shave Spray Gris · $150 (desde) · 250 ml · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '03c9520a-26f1-5c1c-8e43-b7c727528dee', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'After Shave Spray Gris', 'El After Shave Spray Gris está diseñado para quienes buscan un acabado elegante y una sensación de confort después de cada afeitado. Su fórmula ayuda a hidratar y suavizar la piel, reduciendo la irritación y proporcionando una agradable sensación de frescura. Su fragancia de carácter sobrio y masculino aporta un toque de distinción que complementa cualquier servicio profesional.

Es el aliado perfecto para ofrecer una experiencia de barbería de alto nivel, dejando al cliente con una piel revitalizada y un aroma sofisticado que perdura durante horas.

Ideal para Barberías tradicionales, barberías premium, salones de belleza y profesionales que buscan ofrecer un servicio con una imagen clásica, elegante y de alta calidad.

Beneficios:
• Hidrata y protege la piel después del afeitado.
• Ayuda a reducir la irritación y el enrojecimiento.
• Suaviza y refresca la piel al instante.
• Fragancia elegante y masculina de larga duración.
• Apto para todo tipo de piel.

Contenido neto: 250 ml · 500 ml', 15000, '250 ml · 500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/03c9520a-26f1-5c1c-8e43-b7c727528dee-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '03c9520a-26f1-5c1c-8e43-b7c727528dee' AND activo = 1 AND lower(nombre) = lower('After Shave Spray Gris'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- After Shave Spray Rojo · $150 (desde) · 250 ml · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '859f3c1b-1a91-5433-a66d-a26bdd740c60', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'After Shave Spray Rojo', 'El After Shave Spray Rojo combina una fragancia intensa y cautivadora con una fórmula que brinda el cuidado que la piel necesita después del afeitado. Ayuda a hidratar, calmar y refrescar la piel, disminuyendo la sensación de irritación y dejando un acabado suave acompañado de un aroma con mucha personalidad.

Pensado para quienes desean que cada servicio termine con un toque distintivo, este after shave aporta una experiencia que transmite confianza, energía y estilo desde la primera aplicación.

Ideal para Barberías modernas, salones de belleza, distribuidores de productos profesionales y hombres que buscan un aroma con carácter para complementar su rutina de cuidado personal.

Beneficios:
• Hidrata y calma la piel después del afeitado.
• Ayuda a disminuir la irritación causada por el rastrillo.
• Refresca y deja una sensación de confort inmediato.
• Fragancia intensa y duradera.
• Apto para todo tipo de piel.

Contenido neto: 250 ml · 500 ml', 15000, '250 ml · 500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/859f3c1b-1a91-5433-a66d-a26bdd740c60-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '859f3c1b-1a91-5433-a66d-a26bdd740c60' AND activo = 1 AND lower(nombre) = lower('After Shave Spray Rojo'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Jabón con Minoxidil, Bergamota y Romero · $150 · 
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '6585aed1-cb23-527e-a969-a1aed9a57d04', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Jabón con Minoxidil, Bergamota y Romero', 'Descubre el equilibrio perfecto entre limpieza y cuidado con el Jabón con Minoxidil, Bergamota y Romero de Ruzz Man. Su fórmula está diseñada para limpiar profundamente la piel, el cuero cabelludo y la barba sin resecar, proporcionando una agradable sensación de frescura y bienestar en cada uso.

Enriquecido con minoxidil, bergamota y romero, este jabón es el complemento ideal para una rutina de cuidado personal, ayudando a mantener una piel limpia y un cabello o barba con una apariencia saludable. Sus ingredientes ofrecen una experiencia refrescante y revitalizante, ideal para el uso diario.

Ideal para Barberías, salones de belleza, spas, estéticas, distribuidores de productos profesionales y personas que buscan complementar su rutina de cuidado personal con un jabón de uso diario formulado con ingredientes de alta calidad. Su uso es apto tanto para hombres como para mujeres que desean mantener una piel y un cabello limpios, frescos y con una apariencia saludable.

Beneficios:
• Limpia profundamente sin resecar la piel.
• Enriquecido con minoxidil, bergamota y romero.
• Ayuda a mantener la piel fresca y con una sensación de hidratación.
• Ideal para el cuidado diario del cabello, la barba y el cuero cabelludo.
• Aporta una agradable sensación de frescura después de cada uso.
• Apto para todo tipo de piel.', 15000, NULL, 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/6585aed1-cb23-527e-a969-a1aed9a57d04-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '6585aed1-cb23-527e-a969-a1aed9a57d04' AND activo = 1 AND lower(nombre) = lower('Jabón con Minoxidil, Bergamota y Romero'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Talco con Aroma · $150 (desde) · 150 g · 300 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '23094b5d-e04c-53f7-9589-e92115162609', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Talco con Aroma', 'Mantén la piel fresca, seca y cómoda durante todo el día con el Talco Ultrafino. Su fórmula de textura ligera ayuda a absorber el exceso de humedad y a controlar la transpiración, proporcionando una sensación de frescura inmediata sin dejar residuos pesados. Es ideal para el uso diario y para mantener la piel protegida en cualquier momento del día.

Además de brindar confort y frescura, su versatilidad lo convierte en un gran aliado dentro de la barbería y el salón de belleza. En el peinado, es perfecto para aportar textura y volumen al cabello, especialmente en peinados con efecto mate. También es una excelente opción para mujeres que buscan elevar el volumen desde la raíz, logrando un acabado con mayor cuerpo y movimiento sin apelmazar el cabello.

Ideal para Barberías, salones de belleza, estilistas profesionales, academias de barbería y estética, distribuidores de productos profesionales y personas que buscan mantener la piel fresca o dar mayor volumen y textura a su peinado. Apto para hombres y mujeres, especialmente para quienes desean un acabado natural, con más cuerpo y fijación ligera en el cabello.

Beneficios:
• Ayuda a absorber la humedad y el exceso de grasa.
• Contribuye a controlar la transpiración.
• Proporciona una sensación de frescura y confort.
• Textura ultrafina que se distribuye fácilmente.
• Ideal para aportar textura y volumen al cabello.
• Ayuda a elevar el peinado desde la raíz con un acabado natural y mate.
• Apto para uso diario.

Contenido neto: 150 g · 300 g', 15000, '150 g · 300 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/23094b5d-e04c-53f7-9589-e92115162609-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '23094b5d-e04c-53f7-9589-e92115162609' AND activo = 1 AND lower(nombre) = lower('Talco con Aroma'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Facial Scrub · $230 · 240 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'd8a27cb0-b249-5565-9fde-0825effed208', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Facial Scrub', 'Renueva la piel con Facial Scrub, un exfoliante facial diseñado para eliminar impurezas, células muertas y el exceso de grasa, dejando el rostro limpio, suave y con una apariencia revitalizada. Su fórmula ayuda a preparar la piel para el afeitado o para cualquier rutina de cuidado facial, proporcionando una sensación de frescura desde la primera aplicación.

Su textura exfoliante limpia profundamente sin resecar, favoreciendo una piel más uniforme y de aspecto saludable. Es el complemento ideal para quienes buscan mantener una rutina de cuidado facial profesional desde casa o en la barbería.

Ideal para Barberías, salones de belleza, spas, estéticas, distribuidores de productos profesionales y personas que desean mantener una piel limpia, fresca y saludable como parte de su rutina de cuidado facial. Apto para hombres y mujeres.

Beneficios:
• Exfolia suavemente la piel.
• Ayuda a eliminar células muertas e impurezas.
• Limpia profundamente los poros.
• Favorece una piel más suave y uniforme.
• Prepara el rostro para el afeitado y otros tratamientos faciales.
• Aporta una agradable sensación de frescura.
• Apto para todo tipo de piel.

Contenido neto: 240 ml', 23000, '240 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/d8a27cb0-b249-5565-9fde-0825effed208-rz1.webp', 'Afeitado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'd8a27cb0-b249-5565-9fde-0825effed208' AND activo = 1 AND lower(nombre) = lower('Facial Scrub'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Shampoo con Minoxidil · $250 · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'e8afdccb-2bb3-5dc9-936e-12abffb85340', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Shampoo con Minoxidil', 'Fortalece tu rutina de cuidado capilar con el Shampoo con Minoxidil, una fórmula diseñada para limpiar profundamente el cuero cabelludo mientras ayuda a fortalecer el cabello desde la raíz. Su uso diario contribuye a mantener el cuero cabelludo limpio, fresco y en óptimas condiciones, favoreciendo una apariencia de mayor densidad y vitalidad.

Gracias a su fórmula de limpieza suave, elimina impurezas y el exceso de grasa sin resecar, dejando el cabello con una sensación de frescura, suavidad y manejabilidad. Es el complemento ideal para quienes buscan cuidar y fortalecer su cabello como parte de una rutina completa de cuidado capilar.

Beneficios:
• Limpia profundamente el cuero cabelludo y el cabello.
• Ayuda a fortalecer el cabello desde la raíz.
• Contribuye a reducir la apariencia de la caída por quiebre.
• Favorece una apariencia de mayor volumen y densidad.
• Aporta frescura, suavidad y brillo natural.
• Ideal para uso diario.
• Apto para todo tipo de cabello.

Contenido neto: 500 ml', 25000, '500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/e8afdccb-2bb3-5dc9-936e-12abffb85340-rz1.webp', 'Cabello', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'e8afdccb-2bb3-5dc9-936e-12abffb85340' AND activo = 1 AND lower(nombre) = lower('Shampoo con Minoxidil'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Smooth Pre Hair Cut · $270 · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'ec504a8e-27c2-5796-81d5-96d7f58fd015', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Smooth Pre Hair Cut', 'Prepara el cabello para un corte más preciso con Smooth Pre Hair Cut, la crema pre corte diseñada para facilitar el trabajo del estilista o barbero desde el primer paso. Su fórmula ayuda a suavizar y acondicionar el cabello, mejorando su manejabilidad para lograr cortes más limpios, uniformes y con mayor control.

Ideal para Barberías, salones de belleza, academias de barbería y estilismo, distribuidores de productos profesionales y personas que desean preparar el cabello antes del corte para obtener un acabado más limpio, preciso y profesional. Apto para hombres, mujeres y niños, ya que puede utilizarse en cualquier tipo de cabello antes del servicio de corte.

Beneficios:
• Suaviza y acondiciona el cabello antes del corte.
• Facilita el peinado y el manejo del cabello.
• Ayuda a realizar cortes más precisos y uniformes.
• Aporta hidratación ligera sin dejar residuos grasos.
• Reduce el frizz y mejora el control durante el servicio.
• Apto para todo tipo de cabello.
• Ideal para uso profesional y personal.

Contenido neto: 500 ml', 27000, '500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/ec504a8e-27c2-5796-81d5-96d7f58fd015-rz1.webp', 'Cabello', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'ec504a8e-27c2-5796-81d5-96d7f58fd015' AND activo = 1 AND lower(nombre) = lower('Smooth Pre Hair Cut'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Acondicionador en Aceite + Minoxidil · $200 · 50 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'e1eeb5b6-19c5-5c64-8cc8-e6ac186710ce', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Acondicionador en Aceite + Minoxidil', 'Dale a tu rutina capilar un impulso de nutrición y cuidado con Hair Minoxidil, un aceite enriquecido con bergamota y aminoácidos, formulado para ayudar a mantener un cabello con una apariencia más fuerte, suave y saludable. Su textura ligera facilita la aplicación sin dejar una sensación pesada, permitiendo que el cabello luzca con mayor brillo, hidratación y vitalidad.

Gracias a su combinación de ingredientes, ayuda a acondicionar el cabello, controlar el frizz y mejorar su manejabilidad, convirtiéndose en el complemento ideal para una rutina de cuidado capilar diaria. Es perfecto para quienes buscan mantener un cabello bien cuidado y con una apariencia saludable desde la raíz hasta las puntas.

Ideal para Barberías, salones de belleza, estéticas, academias de estilismo, distribuidores de productos profesionales y personas que desean complementar su rutina de cuidado capilar con un aceite de uso diario. Apto para hombres y mujeres que buscan mantener un cabello hidratado, nutrido y con una apariencia más saludable.

Beneficios:
• Ayuda a fortalecer la apariencia del cabello.
• Nutre e hidrata la fibra capilar.
• Enriquecido con bergamota y aminoácidos.
• Favorece un cabello más suave, brillante y manejable.
• Ayuda a controlar el frizz y el cabello rebelde.
• Textura ligera de rápida absorción.
• Ideal para uso diario.
• Apto para todo tipo de cabello.

Contenido neto: 50 ml', 20000, '50 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/e1eeb5b6-19c5-5c64-8cc8-e6ac186710ce-rz1.webp', 'Cabello', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'e1eeb5b6-19c5-5c64-8cc8-e6ac186710ce' AND activo = 1 AND lower(nombre) = lower('Acondicionador en Aceite + Minoxidil'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Acondicionador en Aceite · $200 · 50 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'a72bc784-35ae-5211-bd19-44361ae97316', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Acondicionador en Aceite', 'Dale a tu cabello el cuidado que merece con el Acondicionador en Aceite, una fórmula diseñada para nutrir, suavizar e hidratar la fibra capilar sin dejar sensación pesada. Su textura ligera ayuda a mejorar la manejabilidad del cabello, aportando brillo natural y una apariencia saludable desde la primera aplicación.

Ideal para Barberías, salones de belleza, estéticas, academias de estilismo, distribuidores de productos profesionales y personas que desean mantener su cabello hidratado, suave y con un aspecto saludable. Apto para hombres y mujeres, especialmente para cabellos secos, maltratados, con frizz o que requieren un extra de nutrición y brillo.

Beneficios:
• Nutre e hidrata profundamente el cabello.
• Ayuda a controlar el frizz y el cabello rebelde.
• Facilita el peinado y mejora la manejabilidad.
• Aporta brillo natural y suavidad.
• Textura ligera de rápida absorción.
• No deja sensación grasosa.
• Apto para todo tipo de cabello.

Contenido neto: 50 ml', 20000, '50 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/a72bc784-35ae-5211-bd19-44361ae97316-rz1.webp', 'Cabello', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'a72bc784-35ae-5211-bd19-44361ae97316' AND activo = 1 AND lower(nombre) = lower('Acondicionador en Aceite'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Bifasic24 Tratamiento Capilar · $250 · 250 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '4df8febf-6118-55dd-9c22-71d01b585b12', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Bifasic24 Tratamiento Capilar', 'Devuélvele vida a tu cabello con Bifasic24, un tratamiento capilar bifásico formulado para hidratar, nutrir y proteger la fibra capilar durante todo el día. Su fórmula ayuda a desenredar el cabello con facilidad, controlar el frizz y aportar un brillo saludable, dejando una sensación de suavidad y ligereza desde la primera aplicación.

Gracias a su acción hidratante de hasta 24 horas, es el complemento ideal para el cuidado diario, ayudando a mantener el cabello manejable, sedoso y con una apariencia saludable sin necesidad de enjuague.

Ideal para Salones de belleza, barberías, estéticas, academias de estilismo, distribuidores de productos profesionales y personas que desean mantener su cabello hidratado, suave y fácil de peinar. Apto para hombres, mujeres y niños, especialmente para cabellos secos, maltratados o con tendencia al frizz.

Beneficios:
• Ayuda a desenredar el cabello fácilmente.
• Proporciona hidratación de larga duración.
• Nutre la fibra capilar.
• Controla el frizz y el cabello rebelde.
• Aporta brillo y suavidad.
• No requiere enjuague.
• Apto para todo tipo de cabello.

Contenido neto: 250 ml', 25000, '250 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/4df8febf-6118-55dd-9c22-71d01b585b12-rz1.webp', 'Cabello', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '4df8febf-6118-55dd-9c22-71d01b585b12' AND activo = 1 AND lower(nombre) = lower('Bifasic24 Tratamiento Capilar'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Minoxidil 7% + Bergamota · $250 · 30 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'c42e93d0-56e5-50c5-95ba-ea2d50b2b30d', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Minoxidil 7% + Bergamota', 'Para quienes buscan una concentración mayor, el Minoxidil + Bergamota 7% ofrece una fórmula diseñada para complementar el cuidado capilar con una aplicación práctica y cómoda. Su textura ligera permite una distribución uniforme y una rápida absorción, mientras la bergamota proporciona una sensación refrescante.

Es una excelente alternativa para quienes desean fortalecer su rutina diaria de cuidado personal.

Ideal para Barberías, estéticas, distribuidores especializados y personas que buscan una concentración superior de minoxidil para complementar su rutina de cuidado capilar.

Beneficios:
• Solución concentrada al 7%.
• Fácil aplicación.
• Rápida absorción.
• Fórmula enriquecida con bergamota.
• Ideal para uso continuo.

Contenido neto: 30 ml', 25000, '30 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/c42e93d0-56e5-50c5-95ba-ea2d50b2b30d-rz1.webp', 'Cabello', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'c42e93d0-56e5-50c5-95ba-ea2d50b2b30d' AND activo = 1 AND lower(nombre) = lower('Minoxidil 7% + Bergamota'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Minoxidil 10% + Bergamota · $270 · 30 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '61767d15-dd4b-56cf-bb70-64b76be24f6c', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Minoxidil 10% + Bergamota', 'El Minoxidil + Bergamota 10% está desarrollado para quienes prefieren una solución de mayor concentración como parte de su rutina de cuidado capilar. Su fórmula facilita una aplicación uniforme y rápida, proporcionando una experiencia cómoda y práctica para el uso diario.

Gracias a su presentación compacta, es ideal para llevarlo a cualquier lugar y mantener la constancia en la aplicación.

Ideal para Barberías, salones de belleza, profesionales del cuidado capilar y personas que buscan una concentración más alta de minoxidil dentro de su rutina diaria.

Beneficios:
• Solución concentrada al 10%.
• Fácil aplicación.
• Rápida absorción.
• Presentación práctica.
• Complementa la rutina de cuidado capilar.

Contenido neto: 30 ml', 27000, '30 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/61767d15-dd4b-56cf-bb70-64b76be24f6c-rz1.webp', 'Cabello', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '61767d15-dd4b-56cf-bb70-64b76be24f6c' AND activo = 1 AND lower(nombre) = lower('Minoxidil 10% + Bergamota'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Gel Natural Extra Fuerte · $160 (desde) · 250 g · 500 g · 1000 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '314c2f43-772d-5b8a-a3ce-0419fd98bf73', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Gel Natural Extra Fuerte', 'Consigue un peinado firme y con acabado natural gracias al Gel Natural Azul. Su fórmula proporciona una fijación extra fuerte que mantiene el cabello en su lugar durante horas sin dejar residuos visibles ni sensación pegajosa. Ideal para crear peinados definidos, clásicos o modernos, ofreciendo control y una apariencia impecable durante todo el día.

Ideal para Barberías, salones de belleza, estilistas profesionales y personas que buscan una fijación resistente para peinados que requieren máxima duración sin perder un acabado natural.

Beneficios:
• Fijación extra fuerte de larga duración.
• No deja residuos visibles.
• Ayuda a mantener el peinado por más tiempo.
• Acabado natural y ligero.
• Fácil de aplicar y retirar.
• Apto para todo tipo de cabello.

Contenido neto: 250 g · 500 g · 1000 g', 16000, '250 g · 500 g · 1000 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/314c2f43-772d-5b8a-a3ce-0419fd98bf73-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '314c2f43-772d-5b8a-a3ce-0419fd98bf73' AND activo = 1 AND lower(nombre) = lower('Gel Natural Extra Fuerte'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Gel Natural Fuerte · $160 (desde) · 250 g · 500 g · 1000 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '33af1d93-1d57-5ca3-9d35-fb34a2eaa74b', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Gel Natural Fuerte', 'El Gel Natural Rosa ofrece el equilibrio perfecto entre control y flexibilidad. Su fijación fuerte permite moldear el cabello con facilidad, manteniendo el peinado definido sin endurecerlo en exceso. Ideal para quienes desean un estilo duradero con movimiento natural.

Ideal para Barberías, salones de belleza, uso diario y personas que buscan una fijación confiable para peinados con movimiento y un acabado natural.

Beneficios:
• Fijación fuerte y flexible.
• Mantiene el peinado durante horas.
• No deja residuos.
• Proporciona un acabado natural.
• Fácil aplicación.
• Apto para todo tipo de cabello.

Contenido neto: 250 g · 500 g · 1000 g', 16000, '250 g · 500 g · 1000 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/33af1d93-1d57-5ca3-9d35-fb34a2eaa74b-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '33af1d93-1d57-5ca3-9d35-fb34a2eaa74b' AND activo = 1 AND lower(nombre) = lower('Gel Natural Fuerte'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Gel Natural Medio · $160 (desde) · 250 g · 500 g · 1000 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '2c0f4400-5bc3-5c21-8199-77201c2b9002', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Gel Natural Medio', 'El Gel Natural Verde está pensado para quienes prefieren un peinado con apariencia natural y movimiento. Su fijación media permite controlar el cabello sin rigidez, facilitando retoques durante el día y proporcionando un acabado limpio y ligero.

Ideal para Barberías, salones de belleza, estilistas y personas que buscan un look natural con control ligero para el día a día.

Beneficios:
• Fijación media con acabado natural.
• Conserva el movimiento del cabello.
• No deja residuos ni sensación pesada.
• Fácil de peinar y remodelar.
• Ideal para uso diario.
• Apto para todo tipo de cabello.

Contenido neto: 250 g · 500 g · 1000 g', 16000, '250 g · 500 g · 1000 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/2c0f4400-5bc3-5c21-8199-77201c2b9002-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '2c0f4400-5bc3-5c21-8199-77201c2b9002' AND activo = 1 AND lower(nombre) = lower('Gel Natural Medio'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Cera Gel Máxima Fijación · $160 (desde) · 250 g · 500 g · 1000 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'be0fe5b6-3d20-5cc9-888d-e577427ab5d2', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Cera Gel Máxima Fijación', 'La Cera Gel combina la firmeza de un gel con la textura y definición de una cera, ofreciendo una máxima fijación para peinados que necesitan permanecer intactos durante todo el día. Su fórmula proporciona un excelente control sin dejar residuos visibles, permitiendo crear estilos estructurados con un acabado limpio y profesional.

Es ideal para peinados modernos, cabello corto o de longitud media, y estilos que requieren definición, textura y una fijación superior.

Ideal para Barberías, salones de belleza, academias de estilismo, distribuidores de productos profesionales y personas que buscan un producto de alto rendimiento para lograr peinados con máxima duración, definición y control, tanto para hombres como para mujeres.

Beneficios:
• Máxima fijación de larga duración.
• Define y aporta textura al peinado.
• No deja residuos visibles.
• Fácil de aplicar y distribuir.
• Ideal para peinados estructurados.
• Apto para todo tipo de cabello.

Contenido neto: 250 g · 500 g · 1000 g', 16000, '250 g · 500 g · 1000 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/be0fe5b6-3d20-5cc9-888d-e577427ab5d2-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'be0fe5b6-3d20-5cc9-888d-e577427ab5d2' AND activo = 1 AND lower(nombre) = lower('Cera Gel Máxima Fijación'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Pomade #1 Extra Fuerte · $200 · 150 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '171acc30-72e6-51fb-abb3-4fde189eed13', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Pomade #1 Extra Fuerte', 'Cuando el estilo no puede fallar, la Pomade #1 ofrece una fijación extra fuerte que mantiene el peinado impecable desde la mañana hasta la noche. Su fórmula proporciona un excelente control para crear estilos estructurados, clásicos o modernos, conservando una apariencia limpia y profesional durante horas.

Diseñada para quienes buscan un acabado de alto rendimiento, permite moldear el cabello con precisión sin dejar residuos visibles.

Ideal para Barberías, salones de belleza y personas que necesitan una fijación de alto desempeño para peinados impecables durante todo el día.

Beneficios:
• Fijación extra fuerte.
• Mantiene el peinado durante horas.
• Excelente control y definición.
• No deja residuos visibles.
• Fácil aplicación y retiro.

Contenido neto: 150 g', 20000, '150 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/171acc30-72e6-51fb-abb3-4fde189eed13-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '171acc30-72e6-51fb-abb3-4fde189eed13' AND activo = 1 AND lower(nombre) = lower('Pomade #1 Extra Fuerte'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Pomade #2 Fuerte · $200 · 150 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '960e6cef-0254-5cfe-91d8-5c7fcb1be242', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Pomade #2 Fuerte', 'La Pomade #2 está pensada para quienes desean un peinado definido sin llegar a una fijación extrema. Su fórmula brinda el equilibrio perfecto entre firmeza y flexibilidad, permitiendo mantener el estilo con una apariencia natural y bien cuidada.

Es una excelente opción para el uso diario, ofreciendo control, textura y un acabado profesional.

Ideal para Barberías, estilistas y personas que buscan una fijación confiable para un look limpio, elegante y duradero.

Beneficios:
• Fijación fuerte.
• Define el peinado sin endurecer en exceso.
• Conserva una apariencia natural.
• Fácil de distribuir.
• No deja sensación pegajosa.

Contenido neto: 150 g', 20000, '150 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/960e6cef-0254-5cfe-91d8-5c7fcb1be242-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '960e6cef-0254-5cfe-91d8-5c7fcb1be242' AND activo = 1 AND lower(nombre) = lower('Pomade #2 Fuerte'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Pomade #3 Media · $200 · 150 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '490168ed-48b6-50d1-9925-94974c574dc3', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Pomade #3 Media', 'La Pomade #3 fue creada para quienes prefieren un estilo relajado y con movimiento. Su fijación media proporciona el control suficiente para mantener el peinado ordenado sin perder naturalidad, permitiendo retocar el cabello cuando sea necesario.

Ideal para Salones de belleza, barberías y personas que prefieren un acabado natural con un toque de definición y flexibilidad.

Beneficios:
• Fijación media.
• Conserva el movimiento natural.
• Aporta textura y definición.
• No endurece el cabello.
• Ideal para uso diario.

Contenido neto: 150 g', 20000, '150 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/490168ed-48b6-50d1-9925-94974c574dc3-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '490168ed-48b6-50d1-9925-94974c574dc3' AND activo = 1 AND lower(nombre) = lower('Pomade #3 Media'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Pomade #4 Baja · $200 · 150 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '43cdf500-d747-5889-986b-64d33f69e3ed', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Pomade #4 Baja', 'Para quienes buscan un acabado natural, la Pomade #4 ofrece una fijación ligera que ayuda a controlar el cabello sin perder suavidad ni movimiento. Es perfecta para peinados casuales y para quienes desean un look fresco con una apariencia completamente natural.

Su fórmula permite acomodar el cabello fácilmente durante el día, proporcionando una sensación ligera y confortable.

Ideal para Hombres y mujeres que buscan un producto ligero para controlar el cabello sin rigidez, así como para barberías y salones que ofrecen estilos naturales.

Beneficios:
• Fijación ligera.
• Mantiene el movimiento natural.
• No deja residuos.
• Textura suave y fácil de aplicar.
• Ideal para peinados casuales.

Contenido neto: 150 g', 20000, '150 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/43cdf500-d747-5889-986b-64d33f69e3ed-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '43cdf500-d747-5889-986b-64d33f69e3ed' AND activo = 1 AND lower(nombre) = lower('Pomade #4 Baja'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Pomade #6 + Minoxidil Extra Fuerte · $200 · 150 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT 'c2ea3fd0-4c69-573b-83dc-27f297c98ca8', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Pomade #6 + Minoxidil Extra Fuerte', 'La Pomade #6 con Minoxidil fue desarrollada para ofrecer una fijación extra fuerte mientras complementa la rutina de cuidado capilar. Enriquecida con minoxidil, ayuda a mantener el peinado firme durante todo el día sin sacrificar una apariencia limpia y profesional.

Su textura facilita el moldeado del cabello, proporcionando control, definición y un acabado de calidad profesional desde la primera aplicación.

Ideal para: Barberías, salones de belleza, distribuidores de productos profesionales y personas que buscan una pomada de máxima fijación como parte de su rutina diaria de estilizado y cuidado capilar.

Beneficios:
• Fijación extra fuerte.
• Enriquecida con minoxidil.
• Excelente control y definición.
• Mantiene el peinado durante horas.
• Fácil de aplicar y retirar.

Contenido neto: 150 g', 20000, '150 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/c2ea3fd0-4c69-573b-83dc-27f297c98ca8-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> 'c2ea3fd0-4c69-573b-83dc-27f297c98ca8' AND activo = 1 AND lower(nombre) = lower('Pomade #6 + Minoxidil Extra Fuerte'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Spider Wax Fuerte · $200 · 150 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '4fb05402-aecf-517a-8755-1dbb734694a5', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Spider Wax Fuerte', 'Lleva tu creatividad al siguiente nivel con Spider Wax, una cera para peinar de fijación fuerte que permite crear estilos con textura, definición y un efecto flexible gracias a su característica consistencia tipo "telaraña". Su fórmula facilita moldear el cabello con precisión, aportando un acabado natural y permitiendo reajustar el peinado cuando sea necesario.

Es ideal para crear peinados modernos con volumen, separación de mechones y un look dinámico sin dejar residuos visibles.

Ideal para Barberías, salones de belleza, estilistas profesionales y personas que buscan crear peinados modernos con textura, volumen y movimiento sin perder el control del cabello.

Beneficios:
• Fijación fuerte de larga duración.
• Efecto fibra para mayor textura y definición.
• Permite remodelar el peinado.
• No deja residuos visibles.
• Acabado natural con excelente control.

Contenido neto: 150 g', 20000, '150 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/4fb05402-aecf-517a-8755-1dbb734694a5-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '4fb05402-aecf-517a-8755-1dbb734694a5' AND activo = 1 AND lower(nombre) = lower('Spider Wax Fuerte'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Pomade Matte Clay · $200 · 150 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '8f6c761d-82b6-59fc-8a9b-d2212a5cb0cf', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Pomade Matte Clay', 'La Matte Clay está diseñada para quienes prefieren un estilo natural y sofisticado. Su fórmula proporciona una fijación confiable con un acabado completamente mate, ayudando a dar textura y cuerpo al cabello sin aportar brillo.

Perfecta para crear peinados con efecto despeinado, volumen o estilos contemporáneos, ofreciendo una apariencia limpia y profesional durante todo el día.

Ideal para Barberías, salones de belleza, academias de estilismo y personas que buscan un look moderno, con textura y un acabado mate de aspecto natural.

Beneficios:
• Acabado completamente mate.
• Aporta textura y volumen.
• Controla el cabello sin dejar brillo.
• Fácil aplicación y distribución.
• No deja sensación grasosa.

Contenido neto: 150 g', 20000, '150 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/8f6c761d-82b6-59fc-8a9b-d2212a5cb0cf-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '8f6c761d-82b6-59fc-8a9b-d2212a5cb0cf' AND activo = 1 AND lower(nombre) = lower('Pomade Matte Clay'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Sea Salt Texturizing Spray · $150 · 236 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '3d4f93da-6587-529a-85e2-a214a3ca5684', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Sea Salt Texturizing Spray', 'Consigue un look con textura, volumen y movimiento natural con el Sea Salt Texturizing Spray. Su fórmula está diseñada para aportar cuerpo al cabello sin dejarlo pesado, logrando un acabado con efecto playero, moderno y desenfadado. Es ideal para crear peinados con mayor definición, textura y un aspecto natural tanto en cabello corto como largo.

Además de facilitar el peinado, ayuda a dar volumen desde la raíz y mejora la manejabilidad del cabello, convirtiéndose en un aliado para el estilizado diario.

Ideal para Barberías, salones de belleza, estilistas profesionales, academias de estilismo y personas que desean dar más volumen, textura y movimiento a su cabello. Apto para hombres y mujeres, especialmente para quienes buscan un acabado natural y moderno.

Beneficios:
• Aporta textura y volumen al cabello.
• Proporciona un acabado natural con efecto mate.
• Ayuda a crear un estilo con apariencia playera.
• Facilita el peinado y la definición de mechones.
• No deja sensación pesada ni residuos visibles.
• Ideal para uso diario.
• Apto para todo tipo de cabello.

Contenido neto: 236 ml', 15000, '236 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/3d4f93da-6587-529a-85e2-a214a3ca5684-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '3d4f93da-6587-529a-85e2-a214a3ca5684' AND activo = 1 AND lower(nombre) = lower('Sea Salt Texturizing Spray'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Volutex Polvo de Volumen · $150 (desde) · 10 g · 20 g
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '3c21125b-4b5d-53e3-b886-0424e246ad20', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Volutex Polvo de Volumen', 'Lleva tus peinados al siguiente nivel con Volutex, el polvo de volumen y textura diseñado para transformar cualquier estilo en segundos. Su fórmula ultraligera proporciona un efecto mate con control ligero, aportando cuerpo y volumen desde la raíz sin dejar el cabello pesado o con residuos visibles.

Ideal para Barberías, salones de belleza, estilistas profesionales, academias de barbería y personas que buscan dar mayor volumen, textura y cuerpo a su peinado. Apto para hombres y mujeres, especialmente para quienes tienen cabello fino o desean un acabado con más elevación, definición y un estilo natural sin brillo.

Beneficios:
• Aporta volumen inmediato desde la raíz.
• Proporciona textura para un mejor estilizado.
• Acabado mate de apariencia natural.
• Control ligero que conserva el movimiento del cabello.
• No deja residuos visibles ni sensación grasosa.
• Fácil aplicación y distribución.
• Ideal para todo tipo de cabello.

Contenido neto: 10 g · 20 g', 15000, '10 g · 20 g', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/3c21125b-4b5d-53e3-b886-0424e246ad20-rz1.webp', 'Peinado', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '3c21125b-4b5d-53e3-b886-0424e246ad20' AND activo = 1 AND lower(nombre) = lower('Volutex Polvo de Volumen'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Cool Plus 7 en 1 · $240 · 449 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '22b79e65-9938-5248-b8e4-1630244b9b7a', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Cool Plus 7 en 1', 'Mantén tus máquinas de corte en óptimas condiciones con Cool Plus 7 en 1, el spray indispensable para el cuidado y mantenimiento de cuchillas profesionales. Su fórmula multifuncional ayuda a enfriar, limpiar, lubricar y proteger las cuchillas durante y después de cada servicio, mejorando el rendimiento del equipo y prolongando su vida útil.

Su aplicación rápida elimina residuos acumulados entre las cuchillas, reduce la fricción durante el uso continuo y ayuda a prevenir la corrosión, permitiendo cortes más suaves, precisos y eficientes. Además, deja una agradable sensación de frescura y un aroma limpio que complementa el ambiente de trabajo en barberías y salones.

Ideal para Barberías, salones de belleza, academias de barbería, estilistas profesionales, distribuidores de herramientas de barbería y cualquier persona que desee mantener sus máquinas y cuchillas en excelentes condiciones, prolongando su rendimiento y ofreciendo un servicio más eficiente y profesional.

Beneficios:
• Enfría las cuchillas de forma inmediata.
• Ayuda a limpiar residuos de cabello y suciedad.
• Lubrica para un funcionamiento más suave.
• Contribuye a prevenir la corrosión y el desgaste.
• Favorece un mejor desempeño de la máquina.
• Deja un aroma fresco y agradable.
• Fácil aplicación en spray.

Contenido neto: 449 ml', 24000, '449 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/22b79e65-9938-5248-b8e4-1630244b9b7a-rz1.webp', 'Barbería', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '22b79e65-9938-5248-b8e4-1630244b9b7a' AND activo = 1 AND lower(nombre) = lower('Cool Plus 7 en 1'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Towel Essence · $220 · 500 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '641b5379-6458-5f5a-93a9-2c93d5159ddc', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Towel Essence', 'Convierte cada servicio en una experiencia más agradable con Towel Essence Spray, una esencia aromática especialmente formulada para perfumar las toallas utilizadas en barberías, salones de belleza y spas. Su fragancia aporta una agradable sensación de limpieza y frescura, creando un ambiente más profesional y brindando un toque de confort a cada cliente.

Ideal para Barberías, salones de belleza, spas, estéticas, hoteles, academias de barbería y estilismo, así como profesionales que buscan ofrecer un servicio con mayor calidad, confort y una experiencia sensorial que haga la diferencia para sus clientes.

Beneficios:
• Aromatiza las toallas con una fragancia agradable.
• Proporciona una sensación de limpieza y frescura.
• Ayuda a mejorar la experiencia del cliente.
• Fácil aplicación en spray.
• Ideal para uso profesional.
• Aroma de larga duración.

Contenido neto: 500 ml', 22000, '500 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/641b5379-6458-5f5a-93a9-2c93d5159ddc-rz1.webp', 'Barbería', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '641b5379-6458-5f5a-93a9-2c93d5159ddc' AND activo = 1 AND lower(nombre) = lower('Towel Essence'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;
-- Barbicidex · $260 · 1000 ml
INSERT INTO productos (id, vendedora_id, marca_id, marca, tipo, nombre, descripcion, precio_venta_c, unidad, activo, publico, foto, categoria, destacado, pregunta, pide_fotos, preparacion)
SELECT '6dd00546-9b47-5794-aa3b-fab3280edb97', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', (SELECT id FROM marcas WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND nombre = 'Ruzz Man'), 'Ruzz Man', 'producto', 'Barbicidex', 'Mantén un entorno de trabajo limpio y profesional con Barbicidex, una solución desinfectante al 12% especialmente formulada para la limpieza y desinfección de instrumental utilizado en barberías, salones de belleza, estéticas y centros de cuidado personal. Su fórmula ayuda a mantener las herramientas en óptimas condiciones de higiene, contribuyendo a ofrecer un servicio más seguro y confiable.

Además de su acción desinfectante, cuenta con propiedades anticorrosivas, ayudando a proteger el instrumental metálico del desgaste ocasionado por el uso constante y prolongando su vida útil.

Ideal para Barberías, salones de belleza, estéticas, spas, academias de barbería y estilismo, distribuidores de productos profesionales y cualquier establecimiento que requiera mantener sus herramientas de trabajo limpias, protegidas y listas para brindar un servicio con altos estándares de higiene.

Beneficios:
• Solución desinfectante al 12%.
• Ayuda a mantener el instrumental limpio e higienizado.
• Fórmula con acción anticorrosiva.
• Contribuye a prolongar la vida útil de las herramientas metálicas.
• Fácil de utilizar como parte del protocolo de limpieza.
• Ideal para uso profesional.

Contenido neto: 1000 ml', 26000, '1000 ml', 1, 1, 'productos/88b11614-16ea-4bd8-b8bd-d882d1ddadd5/6dd00546-9b47-5794-aa3b-fab3280edb97-rz1.webp', 'Barbería', 0, NULL, 0, NULL
WHERE EXISTS (SELECT 1 FROM personas WHERE id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
  AND NOT EXISTS (SELECT 1 FROM productos WHERE vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND id <> '6dd00546-9b47-5794-aa3b-fab3280edb97' AND activo = 1 AND lower(nombre) = lower('Barbicidex'))
ON CONFLICT (id) DO UPDATE SET marca_id = excluded.marca_id, marca = excluded.marca, nombre = excluded.nombre, descripcion = excluded.descripcion, precio_venta_c = excluded.precio_venta_c, unidad = excluded.unidad, activo = excluded.activo, publico = excluded.publico, foto = excluded.foto, categoria = excluded.categoria,
  actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now'), version = productos.version + 1
  WHERE productos.vendedora_id = excluded.vendedora_id;

-- 3. Presentaciones (variantes con precio propio; existencias sin control: stock NULL)
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'a0562ce028885332b4a78c48c705bd67', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'dfd72f6b-8c61-5a27-85c2-187d6f691f70', '250 ml', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'dfd72f6b-8c61-5a27-85c2-187d6f691f70' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '1f24f74fd3ee544cb8602c2e2a61dae8', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'dfd72f6b-8c61-5a27-85c2-187d6f691f70', '500 ml', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'dfd72f6b-8c61-5a27-85c2-187d6f691f70' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'cec1fd2089025f65829ce5db48884c41', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '653f144c-583d-5785-b5da-dd8e416b657d', '250 ml', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '653f144c-583d-5785-b5da-dd8e416b657d' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'b1af8058b036514da59b1bd9fb663116', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '653f144c-583d-5785-b5da-dd8e416b657d', '500 ml', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '653f144c-583d-5785-b5da-dd8e416b657d' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '920fc70556895a98a75881d160466d7f', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'af53a518-59bb-5b26-8c62-9fb2cd6b59ae', '250 ml', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'af53a518-59bb-5b26-8c62-9fb2cd6b59ae' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'ca7e87bdcac7509baede856b1252cc1d', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'af53a518-59bb-5b26-8c62-9fb2cd6b59ae', '500 ml', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'af53a518-59bb-5b26-8c62-9fb2cd6b59ae' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '7138fe556a2356fa9403e2689ccbc323', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'fc671f66-8cc4-5d4a-8e06-2769f7f7b96a', '250 ml', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'fc671f66-8cc4-5d4a-8e06-2769f7f7b96a' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'e295cb3e2d915e53949a6b734a1f547c', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'fc671f66-8cc4-5d4a-8e06-2769f7f7b96a', '500 ml', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'fc671f66-8cc4-5d4a-8e06-2769f7f7b96a' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '1659b9e08e7653adbf4ad6a5e33d6748', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095', '250 ml', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'c251eb8767ef52dcb88c320ae7c1515e', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095', '500 ml', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'ba9a850a239c55659acca93b1b440227', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'e3e255f1-3925-5fe7-bec7-41ee211d2c42', '250 ml', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'e3e255f1-3925-5fe7-bec7-41ee211d2c42' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '4701f1176c505d31980050379b0dff33', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'e3e255f1-3925-5fe7-bec7-41ee211d2c42', '500 ml', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'e3e255f1-3925-5fe7-bec7-41ee211d2c42' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '3dcad34923ed5556b40b761cc73421cc', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '03c9520a-26f1-5c1c-8e43-b7c727528dee', '250 ml', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '03c9520a-26f1-5c1c-8e43-b7c727528dee' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '9442b5f71db358f5984555faeca7f0b5', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '03c9520a-26f1-5c1c-8e43-b7c727528dee', '500 ml', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '03c9520a-26f1-5c1c-8e43-b7c727528dee' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '5da26b6564295498b972a74eb3c04afc', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '859f3c1b-1a91-5433-a66d-a26bdd740c60', '250 ml', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '859f3c1b-1a91-5433-a66d-a26bdd740c60' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '4f6de350415554ce978dd8e024b24dcd', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '859f3c1b-1a91-5433-a66d-a26bdd740c60', '500 ml', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '859f3c1b-1a91-5433-a66d-a26bdd740c60' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '090205046b7d55a4b736ce9b9e34dd4f', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '23094b5d-e04c-53f7-9589-e92115162609', '150 g', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '23094b5d-e04c-53f7-9589-e92115162609' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'ec00261982cd50bfa154359789bac49b', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '23094b5d-e04c-53f7-9589-e92115162609', '300 g', 22000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '23094b5d-e04c-53f7-9589-e92115162609' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'e8662313c38e5de8a06855a94b8821dc', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '314c2f43-772d-5b8a-a3ce-0419fd98bf73', '250 g', 16000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '314c2f43-772d-5b8a-a3ce-0419fd98bf73' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '35df6517f95f502c962c53a234664405', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '314c2f43-772d-5b8a-a3ce-0419fd98bf73', '500 g', 23000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '314c2f43-772d-5b8a-a3ce-0419fd98bf73' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '29d0889f68ad5e53a39b73dce1218846', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '314c2f43-772d-5b8a-a3ce-0419fd98bf73', '1000 g', 35000, 1, 2
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '314c2f43-772d-5b8a-a3ce-0419fd98bf73' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'a894d35cb66b5eff98e22ae257315457', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '33af1d93-1d57-5ca3-9d35-fb34a2eaa74b', '250 g', 16000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '33af1d93-1d57-5ca3-9d35-fb34a2eaa74b' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '836b9fe60387538587cddb294d4f7a5e', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '33af1d93-1d57-5ca3-9d35-fb34a2eaa74b', '500 g', 23000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '33af1d93-1d57-5ca3-9d35-fb34a2eaa74b' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '87e02e5aceb55f17812762da96a32c53', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '33af1d93-1d57-5ca3-9d35-fb34a2eaa74b', '1000 g', 35000, 1, 2
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '33af1d93-1d57-5ca3-9d35-fb34a2eaa74b' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '808858e12dd658b79cd1932b791cc4fe', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '2c0f4400-5bc3-5c21-8199-77201c2b9002', '250 g', 16000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '2c0f4400-5bc3-5c21-8199-77201c2b9002' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '38301f8f06a951efb84b589f6c8a34de', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '2c0f4400-5bc3-5c21-8199-77201c2b9002', '500 g', 23000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '2c0f4400-5bc3-5c21-8199-77201c2b9002' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '78cab81dee5d52afa6e00bcf7b9aeb10', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '2c0f4400-5bc3-5c21-8199-77201c2b9002', '1000 g', 35000, 1, 2
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '2c0f4400-5bc3-5c21-8199-77201c2b9002' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '36f757ca29dd5848a0a21c448072ff1e', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'be0fe5b6-3d20-5cc9-888d-e577427ab5d2', '250 g', 16000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'be0fe5b6-3d20-5cc9-888d-e577427ab5d2' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'd6269b8760ab5cb38a7e6972594176d6', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'be0fe5b6-3d20-5cc9-888d-e577427ab5d2', '500 g', 23000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'be0fe5b6-3d20-5cc9-888d-e577427ab5d2' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '854340d107865f1e9ef4b58886d8e53e', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', 'be0fe5b6-3d20-5cc9-888d-e577427ab5d2', '1000 g', 35000, 1, 2
WHERE EXISTS (SELECT 1 FROM productos WHERE id = 'be0fe5b6-3d20-5cc9-888d-e577427ab5d2' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT 'a9f8e7af31ca5785ac4e7b2a100f1c73', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '3c21125b-4b5d-53e3-b886-0424e246ad20', '10 g', 15000, 1, 0
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '3c21125b-4b5d-53e3-b886-0424e246ad20' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;
INSERT INTO variantes (id, vendedora_id, producto_id, nombre, precio_c, activo, orden) SELECT '9b8dcc8c067d58dc96f56f060bf31541', '88b11614-16ea-4bd8-b8bd-d882d1ddadd5', '3c21125b-4b5d-53e3-b886-0424e246ad20', '20 g', 25000, 1, 1
WHERE EXISTS (SELECT 1 FROM productos WHERE id = '3c21125b-4b5d-53e3-b886-0424e246ad20' AND vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5')
ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, precio_c = excluded.precio_c, activo = 1, orden = excluded.orden WHERE variantes.vendedora_id = excluded.vendedora_id;

-- 4. Revisión (no cambia nada)
SELECT p.nombre, p.precio_venta_c / 100 AS precio, p.categoria, p.foto IS NOT NULL AS con_foto, (SELECT count(*) FROM variantes v WHERE v.producto_id = p.id AND v.activo = 1) AS presentaciones
FROM productos p WHERE p.vendedora_id = '88b11614-16ea-4bd8-b8bd-d882d1ddadd5' AND p.marca = 'Ruzz Man' AND p.activo = 1 ORDER BY p.categoria, p.nombre;
