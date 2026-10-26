-- Simuladores: máximo 2 dispositivos por cuenta (correo + simulador) y código por correo para reusar una liga.
-- Cada dispositivo que entra recibe un id que viaja firmado en su cookie. Al entrar un tercero se cierra el más
-- antiguo (revocado_at). "Cerrar sesión" también lo cierra y libera su lugar.
CREATE TABLE simulador_dispositivos (
  id          TEXT PRIMARY KEY,                 -- aleatorio; va en la cookie firmada
  email       TEXT NOT NULL,
  app         TEXT NOT NULL,
  etiqueta    TEXT,                             -- "iPhone · Safari": para el aviso al dueño
  creado_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  usado_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  revocado_at TEXT,
  motivo      TEXT                              -- 'limite' (entró un tercero) o 'salir'
);
CREATE INDEX idx_sim_disp ON simulador_dispositivos (email, app, revocado_at);

-- Código de 6 dígitos al correo del dueño cuando una liga que ya se usó se abre en un dispositivo nuevo
CREATE TABLE simulador_codigos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  app         TEXT NOT NULL,
  token_hash  TEXT NOT NULL,                    -- la liga con la que se pidió
  codigo_hash TEXT NOT NULL,
  expira_at   TEXT NOT NULL,
  intentos    INTEGER NOT NULL DEFAULT 0,
  usado_at    TEXT,
  creado_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sim_cod ON simulador_codigos (email, app, token_hash);

-- Primera vez que una liga del correo abre un simulador: esa entra directo; las siguientes piden código
ALTER TABLE download_tokens ADD COLUMN simulador_usado_at TEXT;
