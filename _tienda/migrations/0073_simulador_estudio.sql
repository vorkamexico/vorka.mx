-- Simuladores como app (nov 2026): plan de estudio hasta el examen, recordatorios al celular (Web Push) y apuntes.
-- Solo para el plan Completo (práctica + examen); todo se guarda por correo y simulador, como los intentos.

-- Plan de estudio: fecha del examen, días y hora de los recordatorios, y las sesiones que armó la app (JSON compacto:
-- [{ f: 'AAAA-MM-DD', t: [ids de temas], k: 'temas' | 'simulacro' | 'repaso' }]) para que el aviso diga qué toca hoy
CREATE TABLE simulador_estudio (
  email          TEXT NOT NULL,
  app            TEXT NOT NULL,
  fecha_examen   TEXT NOT NULL,                 -- 'AAAA-MM-DD'
  dias           TEXT NOT NULL DEFAULT '1,2,3,4,5', -- días de la semana (0 = domingo)
  hora           INTEGER NOT NULL DEFAULT 19,   -- hora del centro de México (6 a 22)
  recordatorios  INTEGER NOT NULL DEFAULT 0,
  sesiones       TEXT NOT NULL DEFAULT '[]',
  ultimo_aviso   TEXT,                          -- 'AAAA-MM-DD' del último recordatorio (uno al día como máximo)
  creado_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (email, app)
);
CREATE INDEX idx_sim_estudio_aviso ON simulador_estudio (recordatorios, hora);

-- Celulares y navegadores que aceptaron los recordatorios
CREATE TABLE simulador_push (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL,
  app          TEXT NOT NULL,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  creado_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ultimo_ok    TEXT,
  ultimo_error TEXT
);
CREATE INDEX idx_sim_push ON simulador_push (email, app);

-- Apuntes: uno por pregunta ('r:<id>'), por tema ('t:<id>') o general ('general')
CREATE TABLE simulador_apuntes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL,
  app            TEXT NOT NULL,
  ref            TEXT NOT NULL,
  texto          TEXT NOT NULL,
  creado_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (email, app, ref)
);
