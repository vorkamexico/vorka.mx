-- Suscripciones por transferencia (decisión del dueño, 2026-11-04): para gente cercana que paga mes a mes por transferencia o
-- para clientes de Vorka que la llevan incluida en sus servicios, sin la comisión de Stripe. Viven en la misma tabla que las de
-- Stripe (así todas las apps las ven igual con Admin.suscripcionApp), con id 'tra_…' y metodo 'transferencia'. Nunca se
-- mandan a Stripe. Se prenden y apagan desde Vorka OS › Tienda › Suscripciones; al registrar el pago en Cobranza se extiende
-- periodo_fin un periodo. Ver src/transferencias.js.
--   metodo       NULL = Stripe · 'transferencia'
--   cobrar       1 = se cobra (va a Cobranza) · 0 = sin cobro (incluida en sus servicios o de cortesía; no vence)
--   nombre, nota quién es y lo que haga falta recordar
--   gracia_dias  días que sigue el servicio después de vencer sin pago (estado 'past_due'); luego se pausa ('unpaid')
--   ultimo_pago  fecha del último pago registrado
ALTER TABLE suscripciones ADD COLUMN metodo TEXT;
ALTER TABLE suscripciones ADD COLUMN cobrar INTEGER NOT NULL DEFAULT 1;
ALTER TABLE suscripciones ADD COLUMN nombre TEXT;
ALTER TABLE suscripciones ADD COLUMN nota TEXT;
ALTER TABLE suscripciones ADD COLUMN gracia_dias INTEGER NOT NULL DEFAULT 10;
ALTER TABLE suscripciones ADD COLUMN ultimo_pago TEXT;
CREATE INDEX IF NOT EXISTS idx_suscripciones_metodo ON suscripciones (metodo, estado);
