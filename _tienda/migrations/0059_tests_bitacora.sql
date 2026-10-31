-- Tests (src/tests/): bitácora de lo que toca datos de personas, para Vorka OS › Tienda › Tests. Ver src/tests/panel.js.
-- NUNCA guarda el dato borrado ni el correo de quien contestó: solo qué pasó, cuándo, quién y cuántas respuestas.
-- accion   'borrado_persona' la persona borró sus respuestas desde su resultado (botón «Borrar mis respuestas»)
--          'arco'            alguien del equipo borró las respuestas de un correo (solicitud ARCO por otro medio)
--          'liga_panel'      alguien del equipo sacó una liga nueva del panel de una licencia para grupo
--          'reenvio_panel'   alguien del equipo reenvió el correo del panel a quien compró la licencia
-- por      correo de quien del equipo lo hizo (desde Vorka OS) o 'persona' (ella misma, desde su resultado)
-- producto 'vocacional' | 'proyecto' (o NULL si el borrado ARCO tocó los dos)
-- order_id la licencia para grupo (solo en liga_panel y reenvio_panel)
-- n        cuántas respuestas se borraron (0 en las acciones de licencias)
CREATE TABLE tests_bitacora (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  accion    TEXT NOT NULL CHECK (accion IN ('borrado_persona', 'arco', 'liga_panel', 'reenvio_panel')),
  por       TEXT NOT NULL,
  producto  TEXT,
  order_id  TEXT,
  n         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_tests_bitacora_at ON tests_bitacora (at);
