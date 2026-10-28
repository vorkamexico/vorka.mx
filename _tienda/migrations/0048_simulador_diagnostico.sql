-- Diagnóstico gratis de los simuladores (oct 2026): quien deja nombre, correo y WhatsApp recibe una clave de 6 dígitos
-- en su correo (así se valida) y con ella hace un simulacro breve con tutor. Al terminar ve su puntaje estimado y le
-- llega por correo. Es la lista de interesados a los que el equipo da seguimiento (Vorka OS › Tienda › Diagnósticos).
-- Uno por correo y simulador: si vuelve a pedir la clave, retoma el suyo o ve su resultado.
CREATE TABLE IF NOT EXISTS simulador_diagnosticos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app TEXT NOT NULL,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  acepto_at TEXT NOT NULL,                 -- aceptó el aviso de privacidad y que le escribamos por correo y WhatsApp
  ref_code TEXT,
  codigo_hash TEXT,
  codigo_expira_at TEXT,
  codigo_intentos INTEGER NOT NULL DEFAULT 0,
  verificado_at TEXT,
  items TEXT,                              -- JSON: ids de los reactivos que le tocaron (fijos para que no cambien al recargar)
  resultado TEXT,                          -- JSON: { global, secciones: [{ id, aciertos, total, puntaje }], ... }
  terminado_at TEXT,
  contactado_at TEXT,                      -- el equipo ya le escribió (se marca desde Vorka OS)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (app, email)
);
CREATE INDEX IF NOT EXISTS idx_sim_diag_fecha ON simulador_diagnosticos (created_at);
