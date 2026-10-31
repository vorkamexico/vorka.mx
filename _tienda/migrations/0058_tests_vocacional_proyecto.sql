-- Test vocacional Vorka y «¿Qué proyecto social hago?» (src/tests/). Dos productos digitales de costo marginal cero: el
-- resultado sale de reglas y contenido propios (sin IA ni servicios de pago por uso). Todo vive en esta tienda:
--   vorka.mx/test-vocacional/          → test gratis (indexable) · /resultado/<id> resumen con vista previa · /reporte/<token> de pago
--   vorka.mx/que-proyecto-social/      → cuestionario gratis · /resultado/<id> · /reporte/<token> de pago
-- Precios (decisión de este PR, ver README-TIENDA.md › Tests): reporte vocacional $79, reporte de proyecto social $149,
-- licencias para grupo del test vocacional: 10 por $490 ($49 c/u), 30 por $1,170 ($39 c/u) y 100 por $2,900 ($29 c/u).
-- Entran ACTIVOS por encargo del dueño (la ficha y la compra funcionan en cuanto se publique el Worker con sus rutas).
--
-- contenido.acceso.app = 'test-vocacional' | 'proyecto-social': producto de acceso. Al pagarse, el correo de entrega lleva
-- el botón a vorka.mx/<app>/entrar/<token> (download_tokens, el mismo patrón que los simuladores), que abre el reporte.
-- El reporte no vence (se vuelve a abrir con la misma liga) mientras la compra siga pagada; un reembolso lo apaga.
-- acceso.tipo = 'grupo' + licencias: licencias para escuelas y orientadores (una liga para el grupo con N lugares y un
-- panel con los resultados de quienes aceptaron compartirlos). Ocultos del catálogo: se venden en la ficha del test.

-- Respuestas de cada test (gratis o de pago). id: 32 hex aleatorios (la liga del resultado gratis; no se adivina).
-- respuestas: JSON con lo que contestó · resumen: JSON con lo calculado para agregados (tipos, área), sin datos personales.
-- email / nombre: solo si la persona pidió su resultado por correo (consentimiento = 1) o compró (se copian de la orden).
-- novedades: 1 si además aceptó recibir novedades de Vorka (finalidad adicional, se puede negar).
-- order_id: la compra que desbloquea el reporte · grupo_order_id: la licencia de grupo por la que entró (si aplica)
-- comparte_grupo: 1 si aceptó que quien compró la licencia (su escuela u orientador) vea su resultado.
-- candado_at: primera vez que vio la vista previa con candado (para medir conversión).
-- cupon / cupon_hasta: el descuento real por terminar el test (un cupón de cupones_regalo de 1 uso, solo para ese
--   producto, que vence 24 h después de terminar; el sistema de cupones lo rechaza al vencer).
-- recordatorio_at: el único correo «tu resultado te espera» (al día siguiente, solo con novedades = 1 y sin compra).
-- baja: 1 si pidió no recibir ese correo (liga de un clic).
CREATE TABLE tests_resultados (
  id               TEXT PRIMARY KEY CHECK (length(id) = 32),
  producto         TEXT NOT NULL CHECK (producto IN ('vocacional', 'proyecto')),
  respuestas       TEXT NOT NULL DEFAULT '{}',
  resumen          TEXT NOT NULL DEFAULT '{}',
  email            TEXT,
  nombre           TEXT,
  consentimiento   INTEGER NOT NULL DEFAULT 0,
  novedades        INTEGER NOT NULL DEFAULT 0,
  order_id         TEXT REFERENCES orders (id),
  grupo_order_id   TEXT REFERENCES orders (id),
  comparte_grupo   INTEGER NOT NULL DEFAULT 0,
  candado_at       TEXT,
  cupon            TEXT,
  cupon_hasta      TEXT,
  recordatorio_at  TEXT,
  baja             INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_tests_order ON tests_resultados (order_id);
CREATE INDEX idx_tests_grupo ON tests_resultados (grupo_order_id);
CREATE INDEX idx_tests_email ON tests_resultados (email);
CREATE INDEX idx_tests_creado ON tests_resultados (producto, created_at);
CREATE INDEX idx_tests_recordatorio ON tests_resultados (created_at) WHERE recordatorio_at IS NULL AND novedades = 1 AND baja = 0;

-- Licencias para grupo: la liga para unirse (codigo, 24 hex, se comparte con el grupo) y cuántos lugares tiene.
-- Cada persona que se une crea una orden de $0 (proveedor 'regalo', regalo_de = esta compra), igual que un regalo.
CREATE TABLE tests_grupos (
  order_id   TEXT PRIMARY KEY REFERENCES orders (id),
  codigo     TEXT NOT NULL UNIQUE CHECK (length(codigo) = 24),
  producto   TEXT NOT NULL,
  cupo       INTEGER NOT NULL CHECK (cupo > 0),
  nombre     TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Embudo por día (sin datos personales): inicio, mitad, termino, correo, candado, checkout, recordatorio. Las compras
-- (con y sin cupón, y las recuperadas por el correo) salen de orders y tests_resultados.
-- (La tabla events de la tienda solo acepta view_product, begin_checkout y purchase.)
CREATE TABLE tests_metricas (
  dia      TEXT NOT NULL,
  producto TEXT NOT NULL,
  evento   TEXT NOT NULL CHECK (evento IN ('inicio', 'mitad', 'termino', 'correo', 'candado', 'checkout', 'recordatorio')),
  n        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, producto, evento)
);

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_test_vocacional', 'test-vocacional', 'Test vocacional Vorka · Reporte completo', 'Tu perfil de intereses (modelo RIASEC de Holland) con 20 carreras afines: qué se estudia, en qué se trabaja, en qué área o examen caen (UNAM, IPN, PAA), un plan de 30 días para decidir y preguntas para hablar con tu familia.', 7900, 1, 'Educación', 2, '[]', NULL,
  json('{"regalable":true,"portada":"Test vocacional","acceso":{"app":"test-vocacional","tipo":"reporte","ruta":"/test-vocacional/","boton":"Ver mi reporte","detalle":"Pago único · tu reporte no vence"},"incluye":["Perfil detallado de tus 3 tipos de interés","20 carreras afines con qué se estudia y en qué se trabaja","Área UNAM, rama IPN o PAA de cada una y el simulador que te toca","Plan de 30 días para decidir y preguntas para tu familia"]}')),
('prod_test_vocacional_g10', 'test-vocacional-grupo-10', 'Test vocacional Vorka · 10 licencias para grupo', 'Reporte completo para 10 alumnas y alumnos, con una sola liga para tu grupo y un panel con los resultados de quienes acepten compartirlos.', 49000, 1, 'Educación', 90, '[]', NULL,
  json('{"oculto":true,"licencias":10,"acceso":{"app":"test-vocacional","tipo":"grupo","ruta":"/test-vocacional/","boton":"Abrir mi panel de grupo","detalle":"Pago único · 10 reportes completos"}}')),
('prod_test_vocacional_g30', 'test-vocacional-grupo-30', 'Test vocacional Vorka · 30 licencias para grupo', 'Reporte completo para 30 alumnas y alumnos, con una sola liga para tu grupo y un panel con los resultados de quienes acepten compartirlos.', 117000, 1, 'Educación', 91, '[]', NULL,
  json('{"oculto":true,"licencias":30,"acceso":{"app":"test-vocacional","tipo":"grupo","ruta":"/test-vocacional/","boton":"Abrir mi panel de grupo","detalle":"Pago único · 30 reportes completos"}}')),
('prod_test_vocacional_g100', 'test-vocacional-grupo-100', 'Test vocacional Vorka · 100 licencias para grupo', 'Reporte completo para 100 alumnas y alumnos, con una sola liga para tu escuela y un panel con los resultados de quienes acepten compartirlos.', 290000, 1, 'Educación', 92, '[]', NULL,
  json('{"oculto":true,"licencias":100,"acceso":{"app":"test-vocacional","tipo":"grupo","ruta":"/test-vocacional/","boton":"Abrir mi panel de grupo","detalle":"Pago único · 100 reportes completos"}}')),
('prod_proyecto_social', 'que-proyecto-social', '¿Qué proyecto social hago? · Reporte completo', 'De 5 a 8 proyectos sociales hechos a la medida de tu giro, tu experiencia, tu presupuesto y tu tiempo: objetivo, a quién beneficia, primeros pasos, indicadores, ODS, riesgos y cómo comunicarlo sin lavado de imagen.', 14900, 1, 'Proyectos sociales', 9, '[]', NULL,
  json('{"regalable":true,"portada":"¿Qué proyecto social hago?","acceso":{"app":"que-proyecto-social","tipo":"reporte","ruta":"/que-proyecto-social/","boton":"Ver mi reporte","detalle":"Pago único · tu reporte no vence"},"incluye":["De 5 a 8 proyectos a tu medida, cada uno con objetivo y primeros pasos","Recursos mínimos e indicadores simples para medir","ODS de la ONU con los que se alinea","Riesgos comunes y cómo comunicarlo sin lavado de imagen"]}'));
