-- Simuladores (nov 2026): seguimiento automático del diagnóstico gratis y puntaje real del examen.
--
-- 1. Seguimiento del diagnóstico (src/simulador/seguimiento.js, cron de cada hora). Solo diagnósticos desde SEGUIMIENTO_DESDE
--    (los anteriores se siguieron a mano por WhatsApp). A quien no compró:
--      · no terminó: un correo para retomarlo (24 h después de pedir su clave);
--      · terminó: a los 2 días, su sección más débil con consejos de los temas que le tocaron;
--      · 3 días después: un código personal de 10 % que vence en 72 h (codigos_descuento, 1 uso).
--    Cada correo trae una liga para darse de baja (seg_baja_at).
ALTER TABLE simulador_diagnosticos ADD COLUMN seg_retomar_at TEXT;
ALTER TABLE simulador_diagnosticos ADD COLUMN seg_tema_at TEXT;
ALTER TABLE simulador_diagnosticos ADD COLUMN seg_oferta_at TEXT;
ALTER TABLE simulador_diagnosticos ADD COLUMN seg_codigo TEXT;
ALTER TABLE simulador_diagnosticos ADD COLUMN seg_baja_at TEXT;

-- 2. Puntaje real: después de pedir la reseña, le preguntamos a quien usó el simulador cuánto sacó en el examen de verdad
--    (/tienda/puntaje/<token>). Una vez por correo y simulador. Solo se publica con su permiso (publicar = 1) y con el
--    nombre que eligió; el equipo lo ve en Vorka OS › Tienda › Reseñas › Puntajes.
CREATE TABLE simulador_puntajes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash     TEXT NOT NULL UNIQUE,
  app            TEXT NOT NULL,
  email          TEXT NOT NULL,
  order_id       TEXT,
  pedida_at      TEXT NOT NULL,
  puntaje        INTEGER,
  universidad    TEXT,
  quedo          TEXT CHECK (quedo IS NULL OR quedo IN ('si', 'no', 'espera')),
  comentario     TEXT,
  nombre_publico TEXT,
  publicar       INTEGER NOT NULL DEFAULT 0,
  respondida_at  TEXT,
  UNIQUE (app, email)
);
