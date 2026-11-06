-- Comisión real que cobró Stripe por cada orden (centavos, de su balance_transaction). Se guarda al confirmarse el pago;
-- las órdenes anteriores se completan solas en el cron de cada hora (admin.js › completarComisionesStripe).
-- NULL = aún no se sabe (o la orden no pasó por Stripe).
ALTER TABLE orders ADD COLUMN stripe_fee_centavos INTEGER;
