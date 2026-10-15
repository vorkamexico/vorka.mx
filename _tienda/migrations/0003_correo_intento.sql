-- Reserva del envío del correo de entrega: evita que dos webhooks simultáneos manden dos correos.
-- Si un envío se queda a medias, otro intento puede tomarlo después de 2 minutos.
ALTER TABLE orders ADD COLUMN correo_intento_at TEXT;
