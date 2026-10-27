-- Puntos Vorka · equipo de Vorka México: sus cuentas ganan sus puntos ×FACTOR_EQUIPO (puntos-reglas.js), con el tope de % de siempre.
-- Quién es del equipo lo manda Vorka OS por RPC (Admin.equipoPuntos) con los correos de las personas activas: marca
-- exactamente esas cuentas y desmarca a quien ya no esté (bajas). Los puntos ya ganados no cambian.
-- Va como 0046 para no chocar con 0045_codigos_descuento (rama cupones).
ALTER TABLE puntos_cuentas ADD COLUMN equipo INTEGER NOT NULL DEFAULT 0 CHECK (equipo IN (0, 1));
-- Factor aplicado a cada movimiento ganado (NULL o 1 = normal; 1.5 = equipo): sirve para auditar y para el texto de la actividad
ALTER TABLE puntos_movimientos ADD COLUMN factor REAL;
CREATE INDEX idx_puntos_cuentas_equipo ON puntos_cuentas (equipo) WHERE equipo = 1;
