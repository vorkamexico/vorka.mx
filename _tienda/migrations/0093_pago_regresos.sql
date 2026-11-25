-- Quien vuelve de la pasarela sin pagar (tocó «Regresar» en Stripe → /tienda/gracias?cancelado=1). Una fila por orden.
-- Sirve para medir la conversión del pago en Vorka OS › Tienda (tablero.ticket.volvieron). Aditiva: no toca otras tablas.
CREATE TABLE IF NOT EXISTS pago_regresos (
  order_id   TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_pago_regresos_fecha ON pago_regresos (created_at);
