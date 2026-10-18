-- Panel de la tienda: archivar órdenes sin pagar y varios correos de seguimiento.
-- Simulador PAA: además de los simulacros cortos, un "Examen PAA completo" con la estructura real
-- (175 reactivos, 3 horas). La compra trae 2 cortos + 1 examen completo; cada examen extra cuesta $100.

-- "Borrar" una orden sin pagar la archiva: no sale en el panel, pero si el pago llega tarde se entrega normal
ALTER TABLE orders ADD COLUMN archivada_at TEXT;
-- Cuántos correos de seguimiento se le han mandado (máximo 3, con 48 h entre uno y otro)
ALTER TABLE orders ADD COLUMN seguimientos INTEGER NOT NULL DEFAULT 0;
UPDATE orders SET seguimientos = 1 WHERE recordatorio_at IS NOT NULL;

-- Tipo de intento: 'corto' (46 reactivos) o 'examen' (estructura real de la PAA)
ALTER TABLE simulador_intentos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'corto';
DROP INDEX IF EXISTS idx_simulador_intentos_email;
CREATE INDEX idx_simulador_intentos_email ON simulador_intentos (email, app, tipo, estado);

-- La compra del simulador incluye 1 examen completo (también para quienes ya lo compraron: se cuenta al vuelo)
UPDATE products SET contenido = json_set(contenido, '$.acceso.examenes', 1), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'prod_simulador_paa';

-- Examen completo adicional: se compra solo desde el simulador (oculto en el catálogo y en el sitemap)
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, contenido)
VALUES ('prod_simulador_paa_examen', 'simulador-paa-examen', 'Examen PAA completo adicional · Simulador PAA',
  'Un examen PAA completo más: 175 reactivos y 3 horas, como el real.', 10000, 1, 'Exámenes', 99, '[]', json('{
  "oculto": true,
  "acceso": { "app": "simulador-paa", "ruta": "/simulador-paa/", "boton": "Volver al simulador", "tipo": "examen", "intentos": 0, "examenes": 1 }
}'));

-- Ficha del simulador con la oferta nueva y el banco ampliado
UPDATE products SET
  descripcion_corta = 'Simulador PAA en línea: 1 examen completo como el real (175 reactivos, 3 horas) y 2 simulacros cortos con tutor, 406 reactivos originales y reporte de qué reforzar. También para regalar.',
  contenido = json_set(contenido,
    '$.incluye', json('[
      {"titulo": "1 Examen PAA completo, como el real.", "texto": "175 reactivos en 3 horas, sin pistas: la misma cantidad de preguntas y el mismo tiempo que la PAA. Cada examen completo adicional cuesta $100."},
      {"titulo": "2 simulacros cortos de 46 reactivos.", "texto": "Con el mismo ritmo por pregunta que la PAA y el tutor de dos intentos. Cada simulacro adicional cuesta $50."},
      {"titulo": "406 reactivos originales.", "texto": "Lectura, Redacción, Matemáticas (con gráficas y figuras) e Inglés. Cada intento prioriza preguntas que no has visto."},
      {"titulo": "Práctica ilimitada por sección y por tus temas débiles.", "texto": "Repite Lectura, Redacción, Matemáticas o Inglés por separado todas las veces que quieras."},
      {"titulo": "Medidor de preparación.", "texto": "Puntaje estimado por sección (200 a 800), distancia a tu meta y los temas exactos que debes reforzar."}
    ]'),
    '$.faq', json('[
      {"p": "¿Es el examen oficial?", "r": "No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura y el tipo de preguntas de la PAA del College Board. El puntaje es una estimación para orientar tu estudio, no un resultado oficial."},
      {"p": "¿Qué incluye la compra?", "r": "Un examen PAA completo con la cantidad de preguntas y el tiempo del real (175 reactivos, 3 horas) y 2 simulacros cortos de 46 reactivos con tutor. Desde el simulador compras otro examen completo por $100 o un simulacro corto por $50. La práctica por sección no tiene límite."},
      {"p": "¿Se repiten las preguntas?", "r": "El banco tiene 406 reactivos y cada intento prioriza los que no has visto, así que tus primeros intentos traen preguntas prácticamente distintas."},
      {"p": "¿Lo puedo regalar?", "r": "Sí. Elige Para regalar al comprar: te llega una liga por cada regalo. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre."},
      {"p": "¿Cuánto tiempo tengo acceso?", "r": "Un año a partir de tu compra, en todos tus dispositivos."}
    ]')
  ),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'prod_simulador_paa';
