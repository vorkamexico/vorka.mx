-- Tienda Vorka México · modelo de datos inicial
-- Montos siempre en centavos (INTEGER). Fechas en ISO 8601 UTC; se muestran en America/Mexico_City.

CREATE TABLE products (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,
  descripcion_corta TEXT NOT NULL DEFAULT '',
  precio_centavos   INTEGER NOT NULL CHECK (precio_centavos >= 0),
  moneda            TEXT NOT NULL DEFAULT 'MXN',
  activo            INTEGER NOT NULL DEFAULT 0,
  r2_keys           TEXT NOT NULL DEFAULT '[]',  -- [{ "key": "de-idea-a-proyecto/1_Guia.pdf", "nombre": "Guía (PDF)" }]
  imagen            TEXT,
  contenido         TEXT NOT NULL DEFAULT '{}',  -- secciones de la página de venta: titular, incluye, pasos, para_quien, faq…
  categoria         TEXT,
  orden             INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_products_activo ON products (activo, orden);

CREATE TABLE affiliates (
  code         TEXT PRIMARY KEY,               -- se guarda en MAYÚSCULAS
  nombre       TEXT NOT NULL,
  email        TEXT,
  comision_pct REAL NOT NULL DEFAULT 0 CHECK (comision_pct >= 0 AND comision_pct <= 100),
  activo       INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Una orden puede llevar varios productos (order_items) para que el carrito no requiera migrar después.
CREATE TABLE orders (
  id                  TEXT PRIMARY KEY,        -- UUID; viaja al proveedor como referencia
  email               TEXT NOT NULL,
  nombre              TEXT NOT NULL,
  monto_centavos      INTEGER NOT NULL CHECK (monto_centavos >= 0),
  moneda              TEXT NOT NULL DEFAULT 'MXN',
  estado              TEXT NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending','paid','failed','refunded')),
  proveedor           TEXT NOT NULL DEFAULT 'stripe',
  provider_session_id TEXT,                    -- Stripe Checkout Session / preferencia de Mercado Pago
  provider_payment_id TEXT,                    -- Stripe PaymentIntent / pago de Mercado Pago
  metodo_pago         TEXT,                    -- card, oxxo, customer_balance (SPEI)…
  ref_code            TEXT REFERENCES affiliates (code),
  comision_pct        REAL,                    -- copia al momento de la compra: si cambia el afiliado, el reporte no cambia
  correo_enviado_at   TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  paid_at             TEXT,
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_orders_estado ON orders (estado, created_at);
CREATE INDEX idx_orders_email ON orders (email);
CREATE INDEX idx_orders_ref ON orders (ref_code, paid_at);
CREATE UNIQUE INDEX idx_orders_session ON orders (proveedor, provider_session_id);

CREATE TABLE order_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL REFERENCES products (id),
  nombre          TEXT NOT NULL,                -- copia: el producto puede renombrarse después
  precio_centavos INTEGER NOT NULL,
  cantidad        INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_items_order ON order_items (order_id);
CREATE INDEX idx_items_product ON order_items (product_id);

CREATE TABLE download_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   TEXT NOT NULL REFERENCES orders (id),
  token_hash TEXT NOT NULL UNIQUE,              -- SHA-256 del token; el token en claro solo va en el correo
  expires_at TEXT NOT NULL,
  descargas  TEXT NOT NULL DEFAULT '{}',       -- { "<r2 key>": veces }
  revocado   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_tokens_order ON download_tokens (order_id);

CREATE TABLE webhook_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  proveedor  TEXT NOT NULL,
  evento_id  TEXT NOT NULL,
  tipo       TEXT,
  payload    TEXT NOT NULL,
  procesado  INTEGER NOT NULL DEFAULT 0,
  error      TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (proveedor, evento_id)
);

-- Analítica propia, sin cookies de terceros
CREATE TABLE events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT NOT NULL CHECK (tipo IN ('view_product','begin_checkout','purchase')),
  product_id TEXT,
  order_id   TEXT,
  ref_code   TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_events_tipo ON events (tipo, created_at);

-- Límite de peticiones por IP / correo (ventana fija)
CREATE TABLE rate_limits (
  clave   TEXT NOT NULL,                        -- "checkout:ip:<hash>", "reenviar:email:<hash>"
  ventana INTEGER NOT NULL,                     -- inicio de la ventana en segundos epoch
  conteo  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (clave, ventana)
);
