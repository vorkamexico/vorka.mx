-- Tarjeta de Embajador(a) en Wallet personalizable desde la app de Puntos (2026-11-05): tema (colores de Vorka), a dónde lleva
-- el QR (tienda o catálogo con su código) y su foto (PNG cuadrado de 270 px en base64; si no hay, os pinta su emblema).
-- wallet_token: liga secreta de su foto para Google Wallet (que necesita una URL pública).
ALTER TABLE puntos_cuentas ADD COLUMN wallet_tema TEXT;
ALTER TABLE puntos_cuentas ADD COLUMN wallet_qr TEXT;
ALTER TABLE puntos_cuentas ADD COLUMN wallet_foto TEXT;
ALTER TABLE puntos_cuentas ADD COLUMN wallet_token TEXT;
