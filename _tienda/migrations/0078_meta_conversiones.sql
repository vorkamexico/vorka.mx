-- Píxel de Meta + API de conversiones (src/meta.js). Todo aditivo: columnas nuevas, ningún dato cambia.
-- Al crear la orden se guarda con qué navegador llegó (cookies _fbp/_fbc de Meta, IP y navegador) para que la compra
-- que confirma el webhook (OXXO y SPEI llegan días después) se le atribuya al anuncio correcto.
ALTER TABLE orders ADD COLUMN meta_fbp TEXT;
ALTER TABLE orders ADD COLUMN meta_fbc TEXT;
ALTER TABLE orders ADD COLUMN meta_ip TEXT;
ALTER TABLE orders ADD COLUMN meta_ua TEXT;
-- Cuándo se le avisó a Meta de la compra (una sola vez por orden, aunque el webhook o la conciliación se repitan)
ALTER TABLE orders ADD COLUMN meta_compra_at TEXT;
