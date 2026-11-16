-- Códigos de descuento que en suscripciones solo aplican en ciertas apps (ver evaluarCodigo en src/descuentos.js).
-- sus_apps  NULL = cualquier suscripción (como hasta ahora) · lista separada por comas ('vuelve') = solo en los planes de
--           esas apps; los demás planes reciben un mensaje claro · '' = en ninguna suscripción (solo pagos únicos).
--           Los pagos únicos no cambian. Con meses (descuento por varias facturas) solo aplica en el plan mensual de esas apps.
ALTER TABLE codigos_descuento ADD COLUMN sus_apps TEXT;
