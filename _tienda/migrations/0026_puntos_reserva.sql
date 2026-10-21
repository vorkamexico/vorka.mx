-- Auditoría de Puntos Vorka (octubre 2026)
-- Puntos apartados por cada orden. Antes se deducían de descuento_centavos durante 24 h; ahora el descuento de la orden
-- puede juntar puntos y el código de un socio, y los puntos quedan apartados mientras la orden siga pendiente
-- (OXXO dura 3 días), sin límite de tiempo: se liberan cuando la orden pasa a failed (vencida o rechazada).
ALTER TABLE orders ADD COLUMN puntos_usados INTEGER NOT NULL DEFAULT 0;
UPDATE orders SET puntos_usados = CAST(ROUND(descuento_centavos / 100.0) AS INTEGER) WHERE puntos_email IS NOT NULL AND descuento_centavos > 0;
CREATE INDEX idx_orders_puntos ON orders (puntos_email, estado);

-- Motivo para revisar una orden a mano (p. ej. al confirmarse el pago ya no alcanzaban los puntos canjeados)
ALTER TABLE orders ADD COLUMN revisar TEXT;
