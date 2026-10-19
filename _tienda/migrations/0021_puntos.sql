-- Programa de puntos Vorka: cualquiera crea su cuenta con su correo, comparte su liga y por cada compra que entra por
-- ella gana 10 puntos (1 punto = $1 MXN) que canjea en cualquier producto de la tienda.
-- Los afiliados con comisión en DINERO siguen existiendo, pero solo por invitación (los da de alta el equipo).
ALTER TABLE affiliates ADD COLUMN tipo TEXT NOT NULL DEFAULT 'dinero' CHECK (tipo IN ('dinero', 'puntos'));
CREATE INDEX idx_affiliates_email ON affiliates (email, tipo);

-- Acceso a la cuenta de puntos: enlace por correo (30 min, un uso) → sesión en cookie (60 días)
CREATE TABLE puntos_accesos (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('enlace', 'sesion')),
  expira_at  TEXT NOT NULL,
  usado_at   TEXT
);
CREATE INDEX idx_puntos_accesos_email ON puntos_accesos (email);

-- Movimientos: ganado (+10 por compra con tu liga), revertido (reembolso de esa compra), canje (−puntos usados en una
-- compra), devuelto (reembolso de una compra pagada con puntos), ajuste (manual del equipo). Una vez por orden y tipo.
CREATE TABLE puntos_movimientos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('ganado', 'revertido', 'canje', 'devuelto', 'ajuste')),
  puntos     INTEGER NOT NULL,
  order_id   TEXT,
  nota       TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_puntos_email ON puntos_movimientos (email, created_at);
CREATE UNIQUE INDEX idx_puntos_orden ON puntos_movimientos (order_id, tipo) WHERE order_id IS NOT NULL;

-- Descuento con puntos en la orden: monto_centavos ya es el neto que se cobra
ALTER TABLE orders ADD COLUMN descuento_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN puntos_email TEXT;
