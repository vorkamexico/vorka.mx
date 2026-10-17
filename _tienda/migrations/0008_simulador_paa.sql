-- Simulador PAA: producto de acceso (no de descarga) + historial de resultados por compra.
-- contenido.acceso.app marca que el producto abre una app en vorka.mx/<app> en lugar de entregar archivos.
-- El producto entra INACTIVO: el precio es provisional y se pone a la venta desde Vorka OS (Tienda → Productos).

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, contenido)
VALUES ('prod_simulador_paa', 'simulador-paa', 'Simulador PAA: Español e Inglés',
  'Simulacros tipo PAA con tutor de dos intentos, explicación paso a paso y medidor de preparación.',
  24900, 0, 'Educación', 5, '[]', json('{
  "acceso": { "app": "simulador-paa", "ruta": "/simulador-paa/", "boton": "Entrar al simulador" },
  "titular": "Practica la PAA como si fuera el día del examen",
  "subtitulo": "Simulacros cortos con la misma exigencia de tiempo que la prueba real, un tutor que te guía cuando fallas y un reporte que te dice exactamente qué reforzar.",
  "portada": "Simulador PAA",
  "incluye": [
    {"titulo": "Simulacro completo de 46 reactivos.", "texto": "Lectura, Redacción, Matemáticas e Inglés, con el mismo ritmo por pregunta que la PAA."},
    {"titulo": "Tutor de dos intentos.", "texto": "Si fallas, recibes una pista de método (no la respuesta) para intentarlo otra vez."},
    {"titulo": "Explicación paso a paso.", "texto": "Cada reactivo trae el desglose de la solución y la regla teórica detrás."},
    {"titulo": "Medidor de preparación.", "texto": "Puntaje estimado por sección, distancia a tu meta y los temas exactos que debes reforzar."},
    {"titulo": "Práctica por sección y por tus temas débiles.", "texto": "Repite solo lo que necesitas; tu historial se guarda en tu cuenta."}
  ],
  "pasos": [
    {"titulo": "Compra y recibe tu acceso por correo.", "texto": "Pagas con tarjeta, OXXO o SPEI. En cuanto se confirma el pago te llega un enlace para entrar."},
    {"titulo": "Haz un simulacro completo.", "texto": "Contesta con cronómetro. Si fallas una pregunta, el tutor te da una pista y otra oportunidad."},
    {"titulo": "Revisa tu reporte.", "texto": "Ves tu puntaje estimado por sección, tus fortalezas y los temas que más te restan puntos."},
    {"titulo": "Practica y vuelve a medirte.", "texto": "Refuerza tus temas débiles y repite el simulacro para ver tu avance."}
  ],
  "para_quien": [
    "Vas a presentar la PAA (Prueba de Aptitud Académica) para entrar a la universidad.",
    "Quieres saber qué tan preparado estás antes del examen real.",
    "Te cuesta organizar tu estudio y quieres saber exactamente qué temas reforzar.",
    "Eres docente o asesor y buscas una herramienta de práctica para tus alumnos."
  ],
  "faq": [
    {"p": "¿Es el examen oficial?", "r": "No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura y el tipo de preguntas de la PAA del College Board. El puntaje es una estimación para orientar tu estudio, no un resultado oficial."},
    {"p": "¿Cómo entro después de comprar?", "r": "Te llega un correo con el botón Entrar al simulador. Si cambias de celular o computadora, pide un enlace nuevo en vorka.mx/descargas/reenviar con el correo de tu compra."},
    {"p": "¿Cuánto tiempo tengo acceso?", "r": "Un año a partir de tu compra, en todos tus dispositivos. Puedes repetir los simulacros todas las veces que quieras."}
  ]
}'));

CREATE TABLE simulador_resultados (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   TEXT NOT NULL REFERENCES orders (id),
  app        TEXT NOT NULL DEFAULT 'simulador-paa',
  modo       TEXT NOT NULL,                    -- completo | seccion | practica
  resultado  TEXT NOT NULL,                    -- JSON que arma el cliente (puntajes, temas, tiempos)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_simulador_orden ON simulador_resultados (order_id, created_at);
