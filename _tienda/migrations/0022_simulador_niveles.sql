-- Simulador PAA por niveles: Calentamiento (fácil), Medio y Oficial; banco más difícil (642 reactivos).
UPDATE products SET
  descripcion_corta = 'Simulador PAA en línea por niveles: 2 Calentamientos, 2 simulacros Medios con tutor y 1 examen Oficial como el real (175 reactivos, 3 horas). 642 reactivos originales con nivel de PAA real. También para regalar.',
  contenido = json_set(contenido,
    '$.incluye', json('[
      {"titulo": "Nivel 1 · 2 Calentamientos de 24 reactivos.", "texto": "Preguntas accesibles con tutor para agarrar ritmo y conocer el formato antes de subir de nivel."},
      {"titulo": "Nivel 2 · 2 simulacros Medios de 46 reactivos.", "texto": "Casi todas las preguntas de dificultad alta, con el ritmo por pregunta de la PAA y el tutor de dos intentos. Cada Medio adicional cuesta $50."},
      {"titulo": "Nivel 3 · 1 examen Oficial, como el real.", "texto": "175 reactivos en 3 horas, sin pistas: la misma cantidad de preguntas, el mismo tiempo y el nivel de la PAA. Cada Oficial adicional cuesta $100."},
      {"titulo": "642 reactivos originales.", "texto": "Lectura con segmentos y lecturas pareadas, Redacción, Matemáticas (con gráficas, figuras y respuesta abierta) e Inglés. Cada intento prioriza preguntas que no has visto."},
      {"titulo": "Medidor de preparación.", "texto": "Puntaje estimado por sección (200 a 800), distancia a tu meta y los temas exactos que debes reforzar."}
    ]'),
    '$.faq', json('[
      {"p": "¿Es el examen oficial?", "r": "No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura, el tipo de preguntas y el nivel de la PAA del College Board. El puntaje es una estimación para orientar tu estudio, no un resultado oficial."},
      {"p": "¿Qué incluye la compra?", "r": "Tres niveles: 2 Calentamientos de 24 reactivos para agarrar ritmo, 2 simulacros Medios de 46 reactivos con tutor y 1 examen Oficial con la cantidad de preguntas y el tiempo del real (175 reactivos, 3 horas). Desde el simulador compras otro Medio por $50 u otro Oficial por $100. La práctica por sección no tiene límite."},
      {"p": "¿Qué tan difícil es?", "r": "El Calentamiento es accesible a propósito. El Medio y el Oficial usan casi solo reactivos de dificultad alta, calibrados con guías de estudio públicas de la PAA, para que el día del examen nada te tome por sorpresa."},
      {"p": "¿Se repiten las preguntas?", "r": "El banco tiene 642 reactivos y cada intento prioriza los que no has visto, así que tus primeros intentos traen preguntas prácticamente distintas."},
      {"p": "¿Lo puedo regalar?", "r": "Sí. Elige Para regalar al comprar: te llega una liga por cada regalo. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre."},
      {"p": "¿Cuánto tiempo tengo acceso?", "r": "Un año a partir de tu compra, en todos tus dispositivos."}
    ]')
  ),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'prod_simulador_paa';

UPDATE products SET
  descripcion_corta = 'Un simulacro Medio adicional del Simulador PAA: 46 reactivos de nivel alto con tutor y reporte.',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'prod_simulador_paa_intento';
