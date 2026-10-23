-- Puntos Vorka unificado (octubre 2026): Socios Vorka se integra a Puntos Vorka.
-- Cada compra con tu liga da un % de lo cobrado en puntos según tu nivel del semestre (10% a 30%; +10 en promociones o
-- productos que sugeriste, tope 40%). Las renovaciones de suscripciones también dan puntos (hasta la factura 12).
-- Transferencia a cuenta (SPEI manual) solo para cuentas que habilita el equipo; nunca se anuncia en textos públicos.
-- Las tablas socios_* se quedan como están (sin datos en producción al migrar); el código ya no las usa.

-- Movimientos: nuevo tipo 'retiro' (puntos que salen a una transferencia) y el detalle de cada 'ganado':
-- base (centavos cobrados de productos de Vorka), % aplicado, semestre, y clave/suscripción para renovaciones.
-- SQLite no permite cambiar un CHECK: se reconstruye la tabla con los mismos datos (igual que en 0023).
CREATE TABLE puntos_movimientos_v3 (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN ('ganado', 'revertido', 'canje', 'devuelto', 'ajuste', 'bono', 'retiro')),
  puntos         INTEGER NOT NULL,
  order_id       TEXT,
  nota           TEXT,
  product_id     TEXT,
  multiplicador  INTEGER NOT NULL DEFAULT 1,            -- 2 = con puntos extra (promoción o sugerencia)
  motivo         TEXT,                                  -- 'sugerencia' | 'promo' cuando hubo puntos extra
  base_centavos  INTEGER,                               -- lo cobrado de productos de Vorka sobre lo que se calculó el %
  pct            REAL,                                  -- % aplicado (nivel + extra, con tope)
  semestre       TEXT,                                  -- AAAA-1 | AAAA-2 (hora del centro de México)
  clave          TEXT,                                  -- 'factura:<in_…>' en renovaciones; 'retiro:<id>' en retiros
  suscripcion_id TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO puntos_movimientos_v3 (id, email, tipo, puntos, order_id, nota, product_id, multiplicador, motivo, created_at)
  SELECT id, email, tipo, puntos, order_id, nota, product_id, multiplicador, motivo, created_at FROM puntos_movimientos;
DROP TABLE puntos_movimientos;
ALTER TABLE puntos_movimientos_v3 RENAME TO puntos_movimientos;
CREATE INDEX idx_puntos_email ON puntos_movimientos (email, created_at);
CREATE UNIQUE INDEX idx_puntos_orden ON puntos_movimientos (order_id, tipo) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX idx_puntos_clave ON puntos_movimientos (clave) WHERE clave IS NOT NULL;
CREATE INDEX idx_puntos_tipo ON puntos_movimientos (tipo, created_at);
CREATE INDEX idx_puntos_suscripcion ON puntos_movimientos (suscripcion_id) WHERE suscripcion_id IS NOT NULL;

-- Transferencia a cuenta: la habilita el equipo por persona. CLABE, titular y banco para el SPEI.
ALTER TABLE puntos_cuentas ADD COLUMN puede_retirar INTEGER NOT NULL DEFAULT 0;
ALTER TABLE puntos_cuentas ADD COLUMN clabe TEXT;
ALTER TABLE puntos_cuentas ADD COLUMN titular TEXT;
ALTER TABLE puntos_cuentas ADD COLUMN banco TEXT;
ALTER TABLE puntos_cuentas ADD COLUMN notas TEXT;     -- internas (no las ve la persona)

-- Solicitudes de transferencia: por_pagar → pagado (clave de rastreo y fecha) o cancelado (los puntos regresan)
CREATE TABLE puntos_retiros (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL,
  puntos        INTEGER NOT NULL CHECK (puntos > 0),
  clabe         TEXT NOT NULL,
  titular       TEXT NOT NULL,
  banco         TEXT,
  estado        TEXT NOT NULL DEFAULT 'por_pagar' CHECK (estado IN ('por_pagar', 'pagado', 'cancelado')),
  clave_rastreo TEXT,
  pagado_el     TEXT,                                   -- fecha del SPEI (AAAA-MM-DD)
  nota          TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  decidido_at   TEXT
);
CREATE INDEX idx_retiros_estado ON puntos_retiros (estado, created_at);
CREATE INDEX idx_retiros_email ON puntos_retiros (email, created_at);
