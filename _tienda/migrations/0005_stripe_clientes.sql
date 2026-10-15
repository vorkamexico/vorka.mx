-- Cliente de Stripe por correo. SPEI necesita un Customer para asignarle su CLABE; reusarlo evita crear
-- una cuenta bancaria virtual nueva en cada compra (Stripe limita cuántas se crean sin costo).
CREATE TABLE stripe_clientes (
  email       TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
