-- Simuladores: los exámenes de práctica dejan de llamarse "oficiales" (se confundía con el examen del College Board o de
-- la UNAM) y el PAA ya no promete minutos, porque la única guía oficial disponible es de 2020. Los avisos de "no es
-- oficial" se quedan igual: solo cambian "examen Oficial", "exámenes oficiales" y los tiempos de la PAA.
UPDATE products SET
  descripcion_corta = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(descripcion_corta,
    'exámenes oficiales', 'exámenes completos'), 'examen Oficial', 'examen completo'),
    '175 reactivos y 3 horas', '175 reactivos'), '(175 reactivos, 3 horas)', '(175 reactivos)'), '175 reactivos en 3 horas', '175 reactivos'),
  contenido = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(contenido,
    'exámenes oficiales', 'exámenes completos'), 'examen Oficial', 'examen completo'),
    'Cada Oficial adicional', 'Cada examen completo adicional'), 'u otro Oficial', 'u otro examen completo'),
    'el Oficial usan', 'el examen completo usan'), '(175 reactivos, 3 horas)', '(175 reactivos)'),
    '175 reactivos en 3 horas', '175 reactivos'), 'el mismo tiempo y el nivel', 'el nivel'),
    'la cantidad de preguntas y el tiempo del real', 'la cantidad de preguntas del real'), 'exámenes oficiales de', 'exámenes completos de')
WHERE slug LIKE 'simulador-%';
