-- Puntos en suscripciones para el equipo de Vorka (decisión del dueño, 2026-11-01): cada persona del equipo elige
--   'unico'      → el % de su nivel (con el ×1.5 del equipo) solo en el primer pago; las renovaciones no dan puntos
--   'recurrente' → 5 % fijo (sin ×1.5) de cada pago, también las renovaciones, sin límite mientras siga en el equipo
-- La preferencia vive en la cuenta; cada venta guarda la suya al pagarse (orders.ref_modo) y no cambia después.
-- Fuera del equipo y en ventas anteriores (ref_modo NULL) sigue la regla de antes: % del nivel hasta la factura 12.
ALTER TABLE puntos_cuentas ADD COLUMN modo_suscripcion TEXT NOT NULL DEFAULT 'recurrente' CHECK (modo_suscripcion IN ('unico', 'recurrente'));
ALTER TABLE orders ADD COLUMN ref_modo TEXT CHECK (ref_modo IN ('unico', 'recurrente'));
