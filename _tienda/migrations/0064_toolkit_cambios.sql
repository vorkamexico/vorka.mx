-- Toolkit Vorka: pasarse de Toolkit ($599) a Toolkit Pro ($1,199) desde Mi Toolkit (ver src/toolkit.js › cambiarAPro).
-- Se actualiza la MISMA suscripción de Stripe al precio de Pro con proration_behavior=always_invoice (se cobra ya la
-- diferencia por los días que quedan) y payment_behavior=pending_if_incomplete (si el cobro falla, Stripe no aplica el
-- cambio; anulamos la factura). En ese momento se abona la diferencia de saldo en proporción a lo que se pagó:
--   saldo = (bono Pro − bono Toolkit) × min(1, cobro / (precio Pro − precio Toolkit)), redondeado a centavos
-- como un movimiento 'abono' con la clave de siempre 'factura:<in_…>' de la factura de prorrateo: el webhook invoice.paid
-- de esa factura calcula lo mismo con la misma clave (INSERT OR IGNORE), así nunca se abona dos veces ni el bono completo.
-- Cada intento queda aquí (también los fallidos), para auditoría y para que el webhook reconozca la factura de prorrateo.
CREATE TABLE toolkit_cambios (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  suscripcion_id  TEXT NOT NULL,
  de_product_id   TEXT NOT NULL,
  a_product_id    TEXT NOT NULL,
  proration_date  INTEGER NOT NULL,             -- segundos Unix: el mismo de la vista previa y de la actualización
  cobro_centavos  INTEGER,                      -- lo que se cobró (total de la factura de prorrateo)
  saldo_centavos  INTEGER,                      -- lo que se abonó de saldo
  factura_id      TEXT UNIQUE,                  -- la factura de prorrateo de Stripe
  estado          TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'fallido')),
  error           TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- Un solo cambio en curso por suscripción (doble clic o dos pestañas: el segundo no llega a Stripe)
CREATE UNIQUE INDEX ux_toolkit_cambio_en_curso ON toolkit_cambios (suscripcion_id) WHERE estado = 'pendiente';
CREATE INDEX idx_toolkit_cambios_email ON toolkit_cambios (email, created_at);
