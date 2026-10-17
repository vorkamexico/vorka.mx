-- Regalar productos de acceso (Simulador PAA): quien compra recibe una liga por cada unidad.
-- Cada liga se puede usar UNA sola vez: al canjearla queda ligada al correo de quien la recibe
-- (se crea una orden de $0, proveedor 'regalo', con regalo_de = la compra original) y deja de funcionar.

ALTER TABLE orders ADD COLUMN regalo INTEGER NOT NULL DEFAULT 0;   -- 1 = compra para regalar (no da acceso a quien paga)
ALTER TABLE orders ADD COLUMN regalo_para TEXT;                     -- nombre de quien recibe (opcional, va en la tarjeta)
ALTER TABLE orders ADD COLUMN regalo_mensaje TEXT;                  -- mensaje para quien recibe (opcional)
ALTER TABLE orders ADD COLUMN regalo_de TEXT REFERENCES orders (id); -- en la orden del canje: la compra que lo regaló
CREATE INDEX idx_orders_regalo_de ON orders (regalo_de);

CREATE TABLE regalos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        TEXT NOT NULL REFERENCES orders (id),   -- compra de regalo
  product_id      TEXT NOT NULL REFERENCES products (id),
  token_hash      TEXT NOT NULL UNIQUE,                   -- HMAC del token; el token en claro solo va en el correo del comprador
  estado          TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'canjeado', 'revocado')),
  canje_order_id  TEXT REFERENCES orders (id),
  canjeado_email  TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  canjeado_at     TEXT
);
CREATE INDEX idx_regalos_orden ON regalos (order_id, estado);

-- El simulador se puede regalar; el simulacro adicional no
UPDATE products SET contenido = json_set(contenido, '$.regalable', json('true')), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'prod_simulador_paa';

-- Producto gancho: el simulador va primero en la tienda (destacado) y su ficha habla del banco ampliado y del regalo
UPDATE products SET orden = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id != 'prod_simulador_paa' AND orden = 0;
UPDATE products SET
  orden = 0,
  nombre = 'Simulador PAA en línea',
  descripcion_corta = 'Simulacros tipo PAA con 235 reactivos originales, cronómetro real, tutor de dos intentos y reporte de qué reforzar. También para regalar.',
  contenido = json_set(contenido,
    '$.incluye', json('[
      {"titulo": "235 reactivos originales.", "texto": "Lectura, Redacción, Matemáticas e Inglés. Cada simulacro completo prioriza preguntas que no has visto."},
      {"titulo": "2 simulacros completos de 46 reactivos.", "texto": "Con el mismo ritmo por pregunta que la PAA. Cada simulacro adicional cuesta $50."},
      {"titulo": "Práctica ilimitada por sección y por tus temas débiles.", "texto": "Repite Lectura, Redacción, Matemáticas o Inglés por separado todas las veces que quieras."},
      {"titulo": "Tutor de dos intentos en cada pregunta.", "texto": "Si fallas, recibes una pista de método (no la respuesta) para intentarlo otra vez."},
      {"titulo": "Medidor de preparación.", "texto": "Puntaje estimado por sección (200 a 800), distancia a tu meta y los temas exactos que debes reforzar."}
    ]'),
    '$.faq', json('[
      {"p": "¿Es el examen oficial?", "r": "No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura y el tipo de preguntas de la PAA del College Board. El puntaje es una estimación para orientar tu estudio, no un resultado oficial."},
      {"p": "¿Se repiten las preguntas?", "r": "El banco tiene 235 reactivos y cada simulacro completo prioriza los que no has visto: tus primeros cinco simulacros traen preguntas prácticamente distintas."},
      {"p": "¿Cuántas veces puedo hacer el simulacro?", "r": "Tu compra incluye 2 simulacros completos. Cada simulacro adicional cuesta $50 y lo compras desde el mismo simulador. La práctica por sección y por temas no tiene límite."},
      {"p": "¿Lo puedo regalar?", "r": "Sí. Elige Para regalar al comprar: te llega una liga por cada regalo. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre."},
      {"p": "¿Cuánto tiempo tengo acceso?", "r": "Un año a partir de tu compra, en todos tus dispositivos."}
    ]')
  ),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'prod_simulador_paa';

-- Portada nueva (con el banco ampliado); nombre con versión porque las portadas se sirven con caché de un año
UPDATE products SET imagen = '/tienda/img/portadas/simulador-paa-v2.png' WHERE id = 'prod_simulador_paa';
