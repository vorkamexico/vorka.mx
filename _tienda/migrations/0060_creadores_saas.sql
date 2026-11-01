-- Creadores que venden su propio SaaS / app por suscripción (Stripe Billing) en vorka.mx/tienda.
-- Ver src/creadores-saas.js. Reglas de dinero:
--   · Vorka se queda SIEMPRE con al menos 20 % de cada cobro de una suscripción de creador (primer pago y cada renovación):
--     comisión efectiva = max(20, creadores.comision_pct). Se hace cumplir en el código y aquí abajo con un CHECK.
--   · Cada factura pagada (invoice.paid) programa UNA transferencia al creador (idempotente por factura), con el mismo patrón
--     de "cargo de Vorka + transferencia" de los productos descargables.

-- 1) transferencias: se rehace para ligar cada transferencia a su factura de Stripe (renovaciones sin orden nueva).
--    SQLite no deja quitar un UNIQUE ni un NOT NULL con ALTER TABLE: tabla nueva, copiar, borrar, renombrar.
PRAGMA defer_foreign_keys = true;

CREATE TABLE transferencias_nueva (
  id                    TEXT PRIMARY KEY,           -- trf_xxx
  order_id              TEXT REFERENCES orders (id),-- orden de la compra (en suscripciones: la de la primera compra, si existe)
  creador_id            TEXT NOT NULL REFERENCES creadores (id),
  venta_centavos        INTEGER NOT NULL,
  comision_vorka_centavos INTEGER NOT NULL,
  comision_stripe_centavos INTEGER NOT NULL,
  monto_centavos        INTEGER NOT NULL,
  moneda                TEXT NOT NULL DEFAULT 'MXN',
  -- por_calcular: factura pagada cuya comisión de Stripe aún no se conoce (el cron la completa y la pasa a programada)
  estado                TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('por_calcular','programada','enviada','cancelada','revertida','error')),
  disponible_en         TEXT NOT NULL,
  stripe_transfer_id    TEXT,
  intentos              INTEGER NOT NULL DEFAULT 0,
  error                 TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  enviada_at            TEXT,
  -- Suscripciones de creadores
  suscripcion_id        TEXT,                       -- sub_…
  factura_id            TEXT,                       -- in_… (una transferencia por factura)
  pago_id               TEXT,                       -- pi_… de la factura (para reembolsos y disputas)
  cargo_id              TEXT,                       -- ch_… (source_transaction de la transferencia)
  comision_pct          REAL,                       -- % efectivo con el que se calculó (en suscripciones, nunca < 20)
  CHECK (order_id IS NOT NULL OR factura_id IS NOT NULL),
  -- Piso de Vorka en suscripciones: ninguna herramienta puede registrar una transferencia de factura con menos de 20 %
  CHECK (factura_id IS NULL OR (comision_pct >= 20 AND comision_vorka_centavos * 100 >= venta_centavos * 20))
);

INSERT INTO transferencias_nueva (id, order_id, creador_id, venta_centavos, comision_vorka_centavos, comision_stripe_centavos, monto_centavos, moneda,
    estado, disponible_en, stripe_transfer_id, intentos, error, created_at, enviada_at)
  SELECT id, order_id, creador_id, venta_centavos, comision_vorka_centavos, comision_stripe_centavos, monto_centavos, moneda,
    estado, disponible_en, stripe_transfer_id, intentos, error, created_at, enviada_at FROM transferencias;
DROP TABLE transferencias;
ALTER TABLE transferencias_nueva RENAME TO transferencias;

-- Pagos únicos: una por orden y creador (como antes). Suscripciones: una por factura y creador.
CREATE UNIQUE INDEX ux_transf_orden ON transferencias (order_id, creador_id) WHERE factura_id IS NULL;
CREATE UNIQUE INDEX ux_transf_factura ON transferencias (factura_id, creador_id) WHERE factura_id IS NOT NULL;
CREATE INDEX idx_transf_estado ON transferencias (estado, disponible_en);
CREATE INDEX idx_transf_creador ON transferencias (creador_id, created_at);
CREATE INDEX idx_transf_pago ON transferencias (pago_id) WHERE pago_id IS NOT NULL;
CREATE INDEX idx_transf_suscripcion ON transferencias (suscripcion_id) WHERE suscripcion_id IS NOT NULL;

-- 2) Suscripciones: de qué creador es (para su API, sus métricas y sus avisos) y cuándo se canceló
ALTER TABLE suscripciones ADD COLUMN creador_id TEXT;
ALTER TABLE suscripciones ADD COLUMN cancelada_at TEXT;
CREATE INDEX idx_suscripciones_creador ON suscripciones (creador_id, email) WHERE creador_id IS NOT NULL;

-- 3) Renglones: el intervalo elegido (mensual o anual) de un producto de creador que tiene los dos precios
ALTER TABLE order_items ADD COLUMN intervalo TEXT CHECK (intervalo IS NULL OR intervalo IN ('month','year'));

-- 4) Integración del creador con su app: llave de API (solo su hash) y URL para los avisos firmados.
--    El secreto de firma no se guarda: se deriva de DOWNLOAD_TOKEN_SECRET + creador + versión (rotar = subir la versión).
ALTER TABLE creadores ADD COLUMN api_llave_hash TEXT;
ALTER TABLE creadores ADD COLUMN api_llave_pista TEXT;         -- últimos 4 caracteres, para reconocerla en el portal
ALTER TABLE creadores ADD COLUMN api_llave_creada_at TEXT;
ALTER TABLE creadores ADD COLUMN api_usada_at TEXT;
ALTER TABLE creadores ADD COLUMN webhook_url TEXT;
ALTER TABLE creadores ADD COLUMN webhook_version INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX ux_creadores_api ON creadores (api_llave_hash) WHERE api_llave_hash IS NOT NULL;

-- 5) Avisos (webhooks) de Vorka a la app del creador: cola con reintentos (cron de cada hora)
CREATE TABLE creador_avisos (
  id            TEXT PRIMARY KEY,                   -- avi_xxx (va en el cuerpo y en Vorka-Aviso-Id)
  creador_id    TEXT NOT NULL REFERENCES creadores (id),
  clave         TEXT NOT NULL UNIQUE,               -- tipo + objeto: Stripe repite webhooks, el aviso sale una vez
  tipo          TEXT NOT NULL,                      -- suscripcion.alta | suscripcion.renovada | suscripcion.pago_fallido | suscripcion.cancelada | prueba
  cuerpo        TEXT NOT NULL,                      -- JSON exacto que se firma y se manda
  estado        TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviado','fallido')),
  intentos      INTEGER NOT NULL DEFAULT 0,
  proximo_at    TEXT NOT NULL,
  ultimo_status INTEGER,
  ultimo_error  TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  enviado_at    TEXT
);
CREATE INDEX idx_avisos_pendientes ON creador_avisos (estado, proximo_at);
CREATE INDEX idx_avisos_creador ON creador_avisos (creador_id, created_at);
