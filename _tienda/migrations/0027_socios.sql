-- Socios Vorka: programa de socios comerciales SOLO POR INVITACIÓN (los da de alta el equipo en Vorka OS).
-- Cada socio tiene un código (ANA-CELAYA) y su liga vorka.mx/tienda/?socio=CODIGO. Las ventas con su código le dan
-- comisión escalonada por mes (hora del centro de México): pendiente → disponible (tras la retención) → pagada (SPEI manual).
-- Montos en centavos. Ningún pago se hace solo: el equipo transfiere por SPEI y lo marca como pagado.

CREATE TABLE socios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT NOT NULL UNIQUE COLLATE NOCASE,   -- se guarda en MAYÚSCULAS; se busca sin importar mayúsculas
  nombre         TEXT NOT NULL,
  email          TEXT NOT NULL,
  telefono       TEXT,
  clabe          TEXT,                                  -- CLABE interbancaria (18 dígitos, dígito verificador revisado)
  banco          TEXT,
  rfc            TEXT,                                  -- opcional: para revisar retenciones y CFDI con el contador
  notas          TEXT,                                  -- internas, no las ve el socio
  descuento_pct  REAL NOT NULL DEFAULT 0 CHECK (descuento_pct >= 0 AND descuento_pct <= 50),   -- descuento para quien compra con su código
  niveles        TEXT,                                  -- JSON [{desde, pct}] propio; NULL = los generales
  estado         TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido')),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_socios_email ON socios (email);

-- Ajustes generales (JSON por clave): niveles, retencion_dias, facturas_suscripcion, correo_avisos
CREATE TABLE socios_ajustes (
  clave  TEXT PRIMARY KEY,
  valor  TEXT NOT NULL
);
INSERT INTO socios_ajustes (clave, valor) VALUES
  ('niveles', '[{"desde":1,"pct":15},{"desde":11,"pct":25}]'),
  ('retencion_dias', '7'),
  ('facturas_suscripcion', '12'),
  ('correo_avisos', '"hola@vorka.mx"');

ALTER TABLE orders ADD COLUMN socio_id INTEGER REFERENCES socios (id);
ALTER TABLE orders ADD COLUMN socio_descuento_centavos INTEGER NOT NULL DEFAULT 0;   -- parte de descuento_centavos que dio el código
CREATE INDEX idx_orders_socio ON orders (socio_id, paid_at);

-- Pagos a socios (SPEI manual): por_pagar → pagado (con clave de rastreo y fecha) o cancelado
CREATE TABLE socios_pagos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id       INTEGER NOT NULL REFERENCES socios (id),
  monto_centavos INTEGER NOT NULL DEFAULT 0,
  estado         TEXT NOT NULL DEFAULT 'por_pagar' CHECK (estado IN ('por_pagar', 'pagado', 'cancelado')),
  origen         TEXT NOT NULL CHECK (origen IN ('semanal', 'inmediato')),
  semana         TEXT,                                  -- lunes (AAAA-MM-DD) del lote semanal; NULL si fue inmediato
  clave_rastreo  TEXT,
  pagado_el      TEXT,                                  -- fecha del SPEI (AAAA-MM-DD)
  nota           TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  pagado_at      TEXT
);
CREATE UNIQUE INDEX idx_socios_pagos_semana ON socios_pagos (socio_id, semana) WHERE semana IS NOT NULL;
CREATE INDEX idx_socios_pagos_estado ON socios_pagos (estado, created_at);

-- Comisiones. clave = 'orden:<id>' | 'factura:<in_…>' | 'ajuste:<id de la comisión que compensa>' (idempotencia de webhooks)
-- base_centavos: lo efectivamente cobrado de productos de Vorka (neto de descuentos, IVA incluido, antes de la comisión de Stripe)
CREATE TABLE socios_comisiones (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id        INTEGER NOT NULL REFERENCES socios (id),
  order_id        TEXT REFERENCES orders (id),
  clave           TEXT NOT NULL UNIQUE,
  tipo            TEXT NOT NULL DEFAULT 'venta' CHECK (tipo IN ('venta', 'ajuste')),
  factura_id      TEXT,                                 -- factura de Stripe (renovación de una suscripción)
  suscripcion_id  TEXT,
  numero_factura  INTEGER,                              -- 1 = la compra; 2…N = renovaciones con comisión
  concepto        TEXT,                                 -- producto(s); nunca datos de quien compró
  base_centavos   INTEGER NOT NULL DEFAULT 0,
  pct             REAL NOT NULL DEFAULT 0,
  monto_centavos  INTEGER NOT NULL,                     -- negativo en ajustes
  venta_n         INTEGER,                              -- número de venta del socio en el mes (define el nivel)
  cuenta_nivel    INTEGER NOT NULL DEFAULT 1,           -- 1 = venta nueva (cuenta para el nivel); 0 = renovación o ajuste
  mes             TEXT NOT NULL,                        -- AAAA-MM (hora del centro de México)
  estado          TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'disponible', 'pagada', 'cancelada')),
  disponible_en   TEXT NOT NULL,
  pago_id         INTEGER REFERENCES socios_pagos (id),
  ajuste_de       INTEGER REFERENCES socios_comisiones (id),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_socios_comisiones_socio ON socios_comisiones (socio_id, mes, tipo);
CREATE INDEX idx_socios_comisiones_estado ON socios_comisiones (estado, disponible_en);
CREATE INDEX idx_socios_comisiones_orden ON socios_comisiones (order_id);
CREATE INDEX idx_socios_comisiones_pago ON socios_comisiones (pago_id);

-- Portal del socio: enlace por correo (30 min, un uso) → sesión en cookie (30 días). Sin contraseñas.
CREATE TABLE socios_accesos (
  token_hash  TEXT PRIMARY KEY,
  socio_id    INTEGER NOT NULL REFERENCES socios (id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('enlace', 'sesion')),
  expira_at   TEXT NOT NULL,
  usado_at    TEXT
);
CREATE INDEX idx_socios_accesos_socio ON socios_accesos (socio_id);
