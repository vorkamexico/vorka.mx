-- Recordatorio (una sola vez) a órdenes que no se terminaron de pagar, desde el panel de Vorka OS
ALTER TABLE orders ADD COLUMN recordatorio_at TEXT;

-- Enlaces anteriores de cada producto: si se cambia el slug, el enlace viejo redirige (301) al nuevo
CREATE TABLE slugs_anteriores (
  slug        TEXT PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_slugs_anteriores_producto ON slugs_anteriores (product_id);
