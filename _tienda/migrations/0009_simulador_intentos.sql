-- Simulador PAA: la compra incluye 2 simulacros completos; cada intento adicional cuesta $50.
-- Los intentos se cuentan por correo del comprador (así se suman las compras de intentos a su acceso).
-- Las secciones sueltas y la práctica de temas débiles no gastan intentos.

-- Producto base: 2 intentos, categoría de la tienda "Exámenes", portada y copy de venta con los intentos
UPDATE products SET
  categoria = 'Exámenes',
  imagen = '/tienda/img/portadas/simulador-paa.png',
  descripcion_corta = 'Simulador de la PAA en línea: 2 simulacros completos con cronómetro, tutor de dos intentos por pregunta y reporte de qué reforzar.',
  contenido = json_set(contenido,
    '$.acceso.intentos', 2,
    '$.incluye', json('[
      {"titulo": "2 simulacros completos de 46 reactivos.", "texto": "Lectura, Redacción, Matemáticas e Inglés, con el mismo ritmo por pregunta que la PAA. Si quieres más, cada simulacro adicional cuesta $50."},
      {"titulo": "Práctica ilimitada por sección y por tus temas débiles.", "texto": "Repite Lectura, Redacción, Matemáticas o Inglés por separado todas las veces que quieras."},
      {"titulo": "Tutor de dos intentos en cada pregunta.", "texto": "Si fallas, recibes una pista de método (no la respuesta) para intentarlo otra vez."},
      {"titulo": "Explicación paso a paso.", "texto": "Cada reactivo trae el desglose de la solución y la regla teórica detrás."},
      {"titulo": "Medidor de preparación.", "texto": "Puntaje estimado por sección (200 a 800), distancia a tu meta y los temas exactos que debes reforzar."}
    ]'),
    '$.faq', json('[
      {"p": "¿Es el examen oficial?", "r": "No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura y el tipo de preguntas de la PAA del College Board. El puntaje es una estimación para orientar tu estudio, no un resultado oficial."},
      {"p": "¿Cuántas veces puedo hacer el simulacro?", "r": "Tu compra incluye 2 simulacros completos. Si quieres más, cada simulacro adicional cuesta $50 y lo compras desde el mismo simulador. La práctica por sección y por temas no tiene límite."},
      {"p": "¿Cómo entro después de comprar?", "r": "Te llega un correo con el botón Entrar al simulador. Si cambias de celular o computadora, pide un enlace nuevo en vorka.mx/descargas/reenviar con el correo de tu compra."},
      {"p": "¿Cuánto tiempo tengo acceso?", "r": "Un año a partir de tu compra, en todos tus dispositivos."}
    ]')
  ),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'prod_simulador_paa';

-- Intento adicional: se compra solo desde el simulador (oculto en el catálogo y en el sitemap)
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, contenido)
VALUES ('prod_simulador_paa_intento', 'simulador-paa-intento', 'Simulacro adicional · Simulador PAA',
  'Un simulacro completo más para tu Simulador PAA.', 5000, 1, 'Exámenes', 99, '[]', json('{
  "oculto": true,
  "acceso": { "app": "simulador-paa", "ruta": "/simulador-paa/", "boton": "Volver al simulador", "tipo": "intento", "intentos": 1 }
}'));

CREATE TABLE simulador_intentos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL,
  app            TEXT NOT NULL DEFAULT 'simulador-paa',
  items          TEXT NOT NULL,                       -- [[ids sección 1], [ids sección 2], …] armados por el servidor
  estado         TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'terminado', 'abandonado')),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  terminado_at   TEXT
);
CREATE INDEX idx_simulador_intentos_email ON simulador_intentos (email, app, estado);
