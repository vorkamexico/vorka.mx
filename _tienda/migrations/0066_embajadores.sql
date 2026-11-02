-- Embajadores Vorka (decisión del dueño, 2026-11-02): red de vendedores dentro de Puntos Vorka. Ver src/embajadores.js.
-- Principio: se gana por ventas reales a clientes, nunca por invitar. Participar es gratis y no hay que comprar nada.
--   Liga de invitación /tienda/puntos/unete/<código> → la cuenta nueva queda con patrocinador (fijo; solo un admin lo cambia,
--   con renglón en la bitácora). Sobre cada venta que da puntos a un vendedor: 5 % a su patrocinador (nivel 1) y 2 % al
--   patrocinador de su patrocinador (nivel 2), misma base que sus puntos, con tope total de 50 % por venta (vendedor + red +
--   descuento al cliente; se recorta primero el nivel 2). Bono de arranque: +50 puntos al vendedor nuevo si su primera venta
--   es dentro de 30 días desde su registro. Rangos del mes: Vendedor(a), Líder, Líder Élite (reconocimiento, sin dinero).

-- Patrocinador de cada cuenta (correo de quien invitó). NULL = sin patrocinador.
ALTER TABLE puntos_cuentas ADD COLUMN patrocinador TEXT;
ALTER TABLE puntos_cuentas ADD COLUMN patrocinado_at TEXT;
CREATE INDEX idx_puntos_cuentas_patrocinador ON puntos_cuentas (patrocinador) WHERE patrocinador IS NOT NULL;

-- Bitácora de cambios de patrocinador (alta por invitación y cambios del admin)
CREATE TABLE puntos_patrocinio_bitacora (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  antes      TEXT,
  despues    TEXT,
  motivo     TEXT NOT NULL,
  por        TEXT,                                    -- 'invitacion' o el correo de quien del equipo lo cambió
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_patrocinio_bitacora_email ON puntos_patrocinio_bitacora (email, id);

-- Rango más alto alcanzado en cada mes (hora del centro de México): para avisar una sola vez al subir y para el histórico
CREATE TABLE puntos_rangos (
  email      TEXT NOT NULL,
  mes        TEXT NOT NULL,                           -- AAAA-MM
  rango      TEXT NOT NULL CHECK (rango IN ('vendedor', 'lider', 'elite')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (email, mes)
);

-- Movimientos: nuevos tipos 'red' (ganancia por una venta de tu equipo; negativo = reversión por reembolso) y 'arranque'
-- (bono de arranque; negativo = reversión). Columnas nuevas: nivel_red (1 o 2), vendedor (correo de quien vendió) y venta
-- (order id o 'factura:<in_…>'). Los de red van con order_id NULL (el índice único (order_id, tipo) es de los del vendedor) y
-- su idempotencia va por clave: 'red:<venta>:<nivel>', 'red-rev:<venta>:<nivel>:<reembolsado|total>', 'arranque:<correo>',
-- 'arranque-rev:<correo>'. SQLite no permite cambiar un CHECK: se reconstruye la tabla con los mismos datos (como 0023 y 0033).
CREATE TABLE puntos_movimientos_v4 (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN ('ganado', 'revertido', 'canje', 'devuelto', 'ajuste', 'bono', 'retiro', 'red', 'arranque')),
  puntos         INTEGER NOT NULL,
  order_id       TEXT,
  nota           TEXT,
  product_id     TEXT,
  multiplicador  INTEGER NOT NULL DEFAULT 1,
  motivo         TEXT,
  base_centavos  INTEGER,
  pct            REAL,
  semestre       TEXT,
  clave          TEXT,
  suscripcion_id TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  factor         REAL,
  nivel_red      INTEGER CHECK (nivel_red IN (1, 2)),
  vendedor       TEXT,
  venta          TEXT,
  -- 1 = venta 'ganado' que NO cuenta para la red, los rangos ni el bono de arranque: quien compró es el patrocinador del
  -- vendedor o el patrocinador de su patrocinador (compras dentro de la propia red). El vendedor conserva sus puntos.
  excluida       INTEGER NOT NULL DEFAULT 0
);
INSERT INTO puntos_movimientos_v4 (id, email, tipo, puntos, order_id, nota, product_id, multiplicador, motivo, base_centavos, pct, semestre, clave, suscripcion_id, created_at, factor)
  SELECT id, email, tipo, puntos, order_id, nota, product_id, multiplicador, motivo, base_centavos, pct, semestre, clave, suscripcion_id, created_at, factor FROM puntos_movimientos;
DROP TABLE puntos_movimientos;
ALTER TABLE puntos_movimientos_v4 RENAME TO puntos_movimientos;
CREATE INDEX idx_puntos_email ON puntos_movimientos (email, created_at);
CREATE UNIQUE INDEX idx_puntos_orden ON puntos_movimientos (order_id, tipo) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX idx_puntos_clave ON puntos_movimientos (clave) WHERE clave IS NOT NULL;
CREATE INDEX idx_puntos_tipo ON puntos_movimientos (tipo, created_at);
CREATE INDEX idx_puntos_suscripcion ON puntos_movimientos (suscripcion_id) WHERE suscripcion_id IS NOT NULL;
CREATE INDEX idx_puntos_venta ON puntos_movimientos (venta) WHERE venta IS NOT NULL;
CREATE INDEX idx_puntos_vendedor ON puntos_movimientos (vendedor, created_at) WHERE vendedor IS NOT NULL;
