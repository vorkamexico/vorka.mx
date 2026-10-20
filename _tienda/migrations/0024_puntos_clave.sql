-- Puntos Vorka · contraseña por cuenta (antes se entraba solo con enlace o código por correo).
-- Las cuentas que ya existían crean su contraseña una vez con un código que llega a su correo (así nadie toma una cuenta ajena).
ALTER TABLE puntos_cuentas ADD COLUMN clave_hash TEXT;
ALTER TABLE puntos_cuentas ADD COLUMN clave_salt TEXT;
