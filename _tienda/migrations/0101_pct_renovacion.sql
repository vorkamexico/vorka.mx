-- % de renovación por cuenta (nov 2026): si una cuenta lo tiene, cada renovación de las suscripciones que vendió le da ese %
-- fijo (sin nivel, extra ni ×1.5 y sin límite de facturas), en lugar de la regla normal. NULL = regla normal.
-- Se pone a mano desde la base para acuerdos particulares; el código no guarda a quién.
ALTER TABLE puntos_cuentas ADD COLUMN pct_renovacion REAL;
