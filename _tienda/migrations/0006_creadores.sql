-- Marketplace de creadores (Stripe Connect, cargo de Vorka + transferencia al creador). Ver _tienda/PLAN-MARKETPLACE.md

CREATE TABLE creadores (
  id                TEXT PRIMARY KEY,                -- cre_xxx
  nombre            TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  telefono          TEXT,
  ciudad            TEXT,
  que_vende         TEXT NOT NULL DEFAULT '',        -- descripción de su solicitud
  enlaces           TEXT NOT NULL DEFAULT '',        -- redes, portafolio
  estado            TEXT NOT NULL DEFAULT 'solicitud' CHECK (estado IN ('solicitud','aprobado','rechazado','suspendido')),
  nota              TEXT,                            -- motivo de rechazo / suspensión (lo ve el creador)
  comision_pct      REAL NOT NULL DEFAULT 20 CHECK (comision_pct >= 0 AND comision_pct <= 100),
  stripe_account_id TEXT UNIQUE,
  stripe_listo      INTEGER NOT NULL DEFAULT 0,      -- stripe_transfers y payouts activos
  stripe_revisado_at TEXT,
  acepto_terminos_at TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  aprobado_at       TEXT
);
CREATE INDEX idx_creadores_estado ON creadores (estado, created_at);

-- Acceso al portal por enlace mágico (sin contraseña)
CREATE TABLE creador_accesos (
  token_hash  TEXT PRIMARY KEY,
  creador_id  TEXT NOT NULL REFERENCES creadores (id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('enlace','sesion')),
  expira_at   TEXT NOT NULL,
  usado_at    TEXT
);
CREATE INDEX idx_accesos_creador ON creador_accesos (creador_id);

-- Productos de creadores: dueño y revisión. Los de Vorka tienen creador_id NULL y revision 'aprobado'.
ALTER TABLE products ADD COLUMN creador_id TEXT REFERENCES creadores (id);
ALTER TABLE products ADD COLUMN revision TEXT NOT NULL DEFAULT 'aprobado' CHECK (revision IN ('borrador','en_revision','aprobado','rechazado'));
ALTER TABLE products ADD COLUMN nota_revision TEXT;
CREATE INDEX idx_products_creador ON products (creador_id);

-- Renglones: a quién le toca y con qué % (copia al momento de la compra)
ALTER TABLE order_items ADD COLUMN creador_id TEXT;
ALTER TABLE order_items ADD COLUMN comision_pct REAL;

-- Cargo real en Stripe (para source_transaction y la comisión exacta)
ALTER TABLE orders ADD COLUMN provider_charge_id TEXT;

-- Transferencias a creadores: se programan al pagarse la orden y salen pasado el plazo de reembolso
CREATE TABLE transferencias (
  id                    TEXT PRIMARY KEY,           -- trf_xxx
  order_id              TEXT NOT NULL REFERENCES orders (id),
  creador_id            TEXT NOT NULL REFERENCES creadores (id),
  venta_centavos        INTEGER NOT NULL,           -- lo que pagó el comprador por sus productos
  comision_vorka_centavos INTEGER NOT NULL,
  comision_stripe_centavos INTEGER NOT NULL,        -- parte proporcional de la comisión real de Stripe
  monto_centavos        INTEGER NOT NULL,           -- lo que recibe el creador
  moneda                TEXT NOT NULL DEFAULT 'MXN',
  estado                TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada','enviada','cancelada','revertida','error')),
  disponible_en         TEXT NOT NULL,              -- no antes de esta fecha
  stripe_transfer_id    TEXT,
  intentos              INTEGER NOT NULL DEFAULT 0,
  error                 TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  enviada_at            TEXT,
  UNIQUE (order_id, creador_id)
);
CREATE INDEX idx_transf_estado ON transferencias (estado, disponible_en);
CREATE INDEX idx_transf_creador ON transferencias (creador_id, created_at);
