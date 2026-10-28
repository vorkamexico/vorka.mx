-- Página pública de cada integrante del equipo: vorka.mx/equipo/<código> (fase 2 de Ventas en Vorka OS).
-- Opcional: solo existe la fila si la persona prendió su página en Vorka OS › Ventas › Mi tarjeta (y se borra al apagarla
-- o al darla de baja). La foto se copia aquí pequeña solo si la persona decide mostrarla; las del equipo siguen privadas en OS.
CREATE TABLE equipo_perfiles (
  code       TEXT PRIMARY KEY REFERENCES affiliates (code),   -- el code original (no el alias)
  nombre     TEXT NOT NULL,
  rol        TEXT,
  frase      TEXT,
  whatsapp   TEXT,                                            -- solo dígitos con lada de país (52…), o NULL si no lo muestra
  foto       TEXT,                                            -- JPEG en base64, o NULL
  foto_v     INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
