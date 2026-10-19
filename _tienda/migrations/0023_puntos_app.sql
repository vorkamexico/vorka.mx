-- Puntos Vorka como mini app (vorka.mx/tienda/cuenta/): entrada con código de 6 dígitos (para la app instalada),
-- metas, niveles, sugerencias de productos con puntos dobles, promociones de puntos dobles, visitas a la liga,
-- avisos en la app y notificaciones push.

-- Movimientos: se agrega el tipo 'bono' (lo da el equipo) y de qué producto y con qué multiplicador salió cada 'ganado'.
-- SQLite no permite cambiar un CHECK: se reconstruye la tabla con los mismos datos.
CREATE TABLE puntos_movimientos_v2 (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('ganado', 'revertido', 'canje', 'devuelto', 'ajuste', 'bono')),
  puntos        INTEGER NOT NULL,
  order_id      TEXT,
  nota          TEXT,
  product_id    TEXT,                                  -- producto por el que se ganó (el de mayor multiplicador de la orden)
  multiplicador INTEGER NOT NULL DEFAULT 1,            -- 2 = puntos dobles
  motivo        TEXT,                                  -- 'sugerencia' | 'promo' cuando hubo puntos dobles
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO puntos_movimientos_v2 (id, email, tipo, puntos, order_id, nota, created_at)
  SELECT id, email, tipo, puntos, order_id, nota, created_at FROM puntos_movimientos;
DROP TABLE puntos_movimientos;
ALTER TABLE puntos_movimientos_v2 RENAME TO puntos_movimientos;
CREATE INDEX idx_puntos_email ON puntos_movimientos (email, created_at);
CREATE UNIQUE INDEX idx_puntos_orden ON puntos_movimientos (order_id, tipo) WHERE order_id IS NOT NULL;
CREATE INDEX idx_puntos_tipo ON puntos_movimientos (tipo, created_at);

-- Código de 6 dígitos que va en el mismo correo que el enlace: 15 minutos, un uso, 5 intentos. Solo se guarda su hash.
CREATE TABLE puntos_codigos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  codigo_hash TEXT NOT NULL,
  expira_at   TEXT NOT NULL,
  intentos    INTEGER NOT NULL DEFAULT 0,
  usado_at    TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_puntos_codigos_email ON puntos_codigos (email, created_at);

-- Preferencias de la cuenta: nombre para el ranking, meta personal (un producto) y si aparece en el Top del mes
CREATE TABLE puntos_cuentas (
  email           TEXT PRIMARY KEY,
  nombre          TEXT,
  meta_product_id TEXT,
  meta_desde      TEXT,
  ranking         INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Visitas a la liga: una por persona, por código y por día. "visitante" es un HMAC del IP con la fecha
-- (no se guarda el IP ni se puede seguir a alguien de un día a otro).
CREATE TABLE puntos_visitas (
  code      TEXT NOT NULL,
  dia       TEXT NOT NULL,                             -- YYYY-MM-DD, hora del centro de México
  visitante TEXT NOT NULL,
  PRIMARY KEY (code, dia, visitante)
);

-- Sugerencias de productos. Si el equipo la acepta y la liga a un producto, quien la sugirió gana puntos dobles
-- en las compras de ese producto con su liga (desde que se acepta).
CREATE TABLE puntos_sugerencias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  idea        TEXT NOT NULL,
  para_quien  TEXT,
  por_que     TEXT,
  estado      TEXT NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva', 'aceptada', 'descartada')),
  product_id  TEXT REFERENCES products (id),
  nota        TEXT,                                    -- respuesta del equipo (se muestra en la app)
  decidida_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sugerencias_email ON puntos_sugerencias (email, created_at);
CREATE INDEX idx_sugerencias_producto ON puntos_sugerencias (product_id, estado);

-- Promociones de puntos dobles de un producto (para todos), por fechas en hora del centro de México, ambos días incluidos
CREATE TABLE puntos_promos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    TEXT NOT NULL REFERENCES products (id),
  inicia        TEXT NOT NULL,                         -- YYYY-MM-DD
  termina       TEXT NOT NULL,                         -- YYYY-MM-DD
  multiplicador INTEGER NOT NULL DEFAULT 2 CHECK (multiplicador IN (2)),
  nota          TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_promos_producto ON puntos_promos (product_id, inicia, termina);

-- Avisos dentro de la app (y lo que se manda por push). "clave" evita repetir el mismo aviso (p. ej. ganado:<orden>).
CREATE TABLE puntos_notificaciones (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  clave      TEXT NOT NULL,
  tipo       TEXT NOT NULL,
  titulo     TEXT NOT NULL,
  cuerpo     TEXT NOT NULL DEFAULT '',
  url        TEXT,
  leida_at   TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (email, clave)
);
CREATE INDEX idx_notif_email ON puntos_notificaciones (email, id);

-- Celulares y navegadores con avisos push activados (Web Push). Se borran solos cuando el servicio responde 404/410.
CREATE TABLE puntos_push (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  ultimo_ok    TEXT,
  ultimo_error TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_puntos_push_email ON puntos_push (email);

-- Ajustes internos (la llave VAPID de Web Push se genera sola la primera vez)
CREATE TABLE puntos_ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
