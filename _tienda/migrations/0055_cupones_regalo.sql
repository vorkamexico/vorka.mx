-- Cupones de regalo (Vorka OS › Tienda › Regalar › Cupón de descuento). Ver src/cupones-regalo.js y src/descuentos.js.
-- Transferibles: NO están ligados a un correo; cualquiera que tenga el código lo usa en el mismo campo «código» de la compra.
-- Se aplican como cualquier código de descuento: no se acumulan con FUNDADOR30 ni con el 5 % por recomendación (gana el
-- mayor, en pesos); en pago único se suman los puntos de quien compra; siempre queda el cobro mínimo de $10; en suscripciones
-- solo el primer cobro ('once'). El uso cuenta al pagarse la orden (como FUNDADOR30). Lo que sobra de un monto fijo se pierde.
--
-- codigo          REGALO-XXXX-XXXX (MAYÚSCULAS, sin caracteres ambiguos). Único también frente a codigos_descuento.
-- lote            id de la tanda (varios cupones creados juntos con los mismos datos)
-- tipo            'pct' (pct de 5 a 100) o 'monto' (monto_centavos, en pesos enteros)
-- alcance         'tienda' (todo lo de Vorka, nunca de creadores) · 'linea' (linea = id de lineas.js: examenes, negocios,
--                 eventos, finanzas) · 'producto' (product_id)
-- max_usos        cuántas compras pagadas lo pueden usar (1 por omisión) · usos: compras pagadas con él
-- hasta           último día de vigencia (AAAA-MM-DD, día completo en hora del centro de México)
-- para, nota      solo referencia interna del equipo; nunca se manda a nadie
-- revocado_at     revocado desde el panel (deja de servir para compras nuevas)
-- envio_*         entrega opcional por correo («Enviar por correo» del panel): solo el ÚLTIMO envío (nombre y correo de quien
--                 lo recibió, cuándo, resultado y el error si falló) y cuántos envíos lleva. El correo NO amarra el cupón a esa
--                 persona: sigue siendo transferible. No se guarda historial de destinatarios anteriores.
CREATE TABLE cupones_regalo (
  codigo          TEXT PRIMARY KEY CHECK (codigo = UPPER(codigo) AND length(codigo) BETWEEN 8 AND 40),
  lote            TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('pct', 'monto')),
  pct             REAL CHECK (pct IS NULL OR (pct >= 5 AND pct <= 100)),
  monto_centavos  INTEGER CHECK (monto_centavos IS NULL OR monto_centavos > 0),
  alcance         TEXT NOT NULL CHECK (alcance IN ('tienda', 'linea', 'producto')),
  linea           TEXT,
  product_id      TEXT REFERENCES products (id),
  max_usos        INTEGER NOT NULL DEFAULT 1 CHECK (max_usos >= 1),
  usos            INTEGER NOT NULL DEFAULT 0,
  hasta           TEXT NOT NULL,
  para            TEXT,
  nota            TEXT,
  creado_por      TEXT,
  creado          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  revocado_at     TEXT,
  revocado_por    TEXT,
  envio_nombre    TEXT,
  envio_email     TEXT,
  envio_at        TEXT,
  envio_estado    TEXT CHECK (envio_estado IS NULL OR envio_estado IN ('enviado', 'fallo')),
  envio_error     TEXT,
  envios          INTEGER NOT NULL DEFAULT 0,
  CHECK ((tipo = 'pct' AND pct IS NOT NULL AND monto_centavos IS NULL) OR (tipo = 'monto' AND monto_centavos IS NOT NULL AND pct IS NULL)),
  CHECK ((alcance = 'tienda' AND linea IS NULL AND product_id IS NULL) OR (alcance = 'linea' AND linea IS NOT NULL AND product_id IS NULL)
      OR (alcance = 'producto' AND product_id IS NOT NULL AND linea IS NULL))
);
CREATE INDEX idx_cupones_regalo_lote ON cupones_regalo (lote);
CREATE INDEX idx_cupones_regalo_creado ON cupones_regalo (creado);

-- En la orden, un cupón de regalo queda como cualquier código: descuento_codigo = 'REGALO-…', descuento_pct (NULL si es
-- por monto), descuento_duracion = 'once' en suscripciones y descuento_codigo_centavos = lo que de verdad descontó.
-- descuento_monto_centavos: el valor del cupón por monto (para ver cuánto se perdió por el cobro mínimo o el precio).
ALTER TABLE orders ADD COLUMN descuento_monto_centavos INTEGER;
