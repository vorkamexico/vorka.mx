-- Código público de Puntos Vorka: cada persona puede cambiar el código que comparte (embajadores de venta en Vorka OS).
-- affiliates.code NO cambia (lo usan órdenes, visitas y puntos): el nuevo es un alias que apunta a él. Los códigos
-- anteriores siguen funcionando para siempre (QR impresos, ligas ya compartidas).
ALTER TABLE affiliates ADD COLUMN publico TEXT;              -- el que se muestra y se comparte (NULL = code)
ALTER TABLE affiliates ADD COLUMN publico_cambiado_at TEXT;  -- una vez cada 30 días
CREATE TABLE affiliate_alias (
  alias      TEXT PRIMARY KEY CHECK (alias = UPPER(alias) AND length(alias) BETWEEN 4 AND 12),
  code       TEXT NOT NULL REFERENCES affiliates (code),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_alias_code ON affiliate_alias (code);
