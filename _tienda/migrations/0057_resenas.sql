-- Reseñas de compradores verificados (ver src/resenas.js). Solo quien pagó una orden recibe, unos días después, un correo con
-- una liga única por producto (/tienda/resena/<token>) para calificarlo de 1 a 5 estrellas, con texto opcional y el nombre
-- con el que quiere aparecer. El equipo las aprueba u oculta en Vorka OS › Tienda; solo las aprobadas (y de órdenes que
-- siguen pagadas) se ven en la página del producto y en su JSON-LD (aggregateRating y review).
--
-- token_hash      SHA-256 del token; el token en claro solo va en el correo (como download_tokens)
-- order_id, product_id  una reseña por orden y producto (UNIQUE): también es la marca de «ya se pidió» de esa orden
-- email           correo de la orden (para no pedir dos veces el mismo producto a la misma persona y para ARCO)
-- estado          sin_escribir (se pidió y aún no la escribe) · pendiente (escrita, esperando aprobación; se puede editar)
--                 · aprobada (publicada) · oculta (el equipo decidió no publicarla) · borrada (ARCO: sin datos)
-- pedida_at       cuándo salió el correo que la pide · escrita_at la primera vez que la mandó · actualizada_at la última edición
-- decidida_*      quién del equipo la aprobó u ocultó y cuándo · borrada_* quién atendió la solicitud ARCO y cuándo
CREATE TABLE resenas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash      TEXT NOT NULL UNIQUE,
  order_id        TEXT NOT NULL REFERENCES orders (id),
  product_id      TEXT NOT NULL REFERENCES products (id),
  email           TEXT NOT NULL,
  estrellas       INTEGER CHECK (estrellas IS NULL OR estrellas BETWEEN 1 AND 5),
  texto           TEXT CHECK (texto IS NULL OR length(texto) <= 1000),
  nombre_publico  TEXT CHECK (nombre_publico IS NULL OR length(nombre_publico) <= 60),
  estado          TEXT NOT NULL DEFAULT 'sin_escribir' CHECK (estado IN ('sin_escribir', 'pendiente', 'aprobada', 'oculta', 'borrada')),
  pedida_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  escrita_at      TEXT,
  actualizada_at  TEXT,
  decidida_at     TEXT,
  decidida_por    TEXT,
  borrada_at      TEXT,
  borrada_por     TEXT,
  UNIQUE (order_id, product_id),
  CHECK (estado IN ('sin_escribir', 'borrada') OR (estrellas IS NOT NULL AND nombre_publico IS NOT NULL))
);
CREATE INDEX idx_resenas_producto ON resenas (product_id, estado, escrita_at);
CREATE INDEX idx_resenas_estado ON resenas (estado, escrita_at);
CREATE INDEX idx_resenas_email ON resenas (email, pedida_at);

-- Quien pidió no recibir más correos pidiendo reseñas (liga del propio correo). Solo el correo y cuándo.
CREATE TABLE resenas_bajas (
  email      TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
