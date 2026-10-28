# Banco del Simulador prepa UG (EXANI-I) · cómo se escribe

Contenido **100 % original de Vorka México**. Se usa para practicar el EXANI-I de CENEVAL, el examen que pide la
Universidad de Guanajuato para entrar a su bachillerato (prepa). Según la ficha técnica de la UG (proceso ago-dic 2026)
y la guía del nuevo EXANI-I de CENEVAL: 160 reactivos de opción múltiple con **tres opciones**, en 4 h 30 min.

| Área (sección) | Reactivos en el examen | Reactivos en el banco |
|---|---|---|
| `comprension_lectora` | 30 | 75 |
| `redaccion_indirecta` | 30 | 75 |
| `pensamiento_matematico` | 40 | 100 |
| `pensamiento_cientifico` | 30 | 75 |
| `ingles` | 30 | 75 |

El temario es el de **secundaria** (plan de estudios de la SEP) y la estructura de la guía de CENEVAL, pero **no se copia
ni se parafrasea ningún reactivo, texto o ejemplo** de guías de CENEVAL, de la UG, de libros, simuladores ni exámenes
de nadie. Inventa situaciones, datos y textos nuevos.

## Archivo

Un módulo ES por área en `_tienda/src/simulador/prepa-ug/<seccion>.js` que exporta:

```js
// Banco prepa UG · <Área> (contenido 100 % original de Vorka México).
export const TEMAS_<SECCION> = {
  <tema_id>: { seccion: '<seccion>', nombre: 'Nombre visible del tema', consejo: 'Qué repasar y cómo, en 1–2 oraciones concretas.' },
  …
};
export const TEXTOS_<SECCION> = { … };   // solo comprension_lectora e ingles
export const REACTIVOS_<SECCION> = [ … ];
```

Reactivo:

```js
{ id: 'UG-<abreviatura>-<n>', seccion: '<seccion>', tema: '<tema_id>', dificultad: 1|2|3,
  texto?: '<id de TEXTOS>',            // solo si la pregunta es sobre una lectura
  enunciado: '…',
  tabla?: [['Encabezado 1', 'Encabezado 2'], ['dato', 'dato'], …],   // opcional: la 1.ª fila son los encabezados
  figura?: '<svg viewBox="…" …>…</svg>',   // opcional: SVG en línea, sencillo, con texto legible y sin colores fijos de fondo
  opciones: ['…', '…', '…'], correcta: 0–2,
  pista: '…',      // tras el 1.er error: orienta el MÉTODO sin dar la respuesta ni descartar opciones por letra
  pasos: ['…', '…'],   // solución paso a paso (2–5 pasos), termina mostrando por qué la correcta es correcta
  regla: '…' }     // el concepto o regla general detrás, y el error típico que lleva a los distractores
```

Lectura (TEXTOS): `{ <id>: { seccion: '<seccion>', tipo: 'literario'|'no_literario', titulo: '…', genero: '…', autor?: '…', parrafos: ['…', …] } }`.
Las lecturas deben ser **originales** (preferible) o de **dominio público** (autor fallecido hace más de 100 años; si es
así pon `autor` y respeta el texto). Nunca uses fragmentos de autores con derechos vigentes.

## Temas por área (usa exactamente estos ids; puedes poner `nombre` y `consejo` a tu criterio)

Siguen la estructura por subárea de la guía de CENEVAL. Reparte el banco en proporción a la columna «banco».

**pensamiento_cientifico** (abreviatura `cie`, 75): 25 por subárea.
- `cie_identificacion` — Identificación de variables, conceptos y procesos: célula y organelos (vegetal/animal), evolución y
  genética básica; biomoléculas en el cuerpo humano, modelos atómicos y tipos de enlace; estados de la materia, fuerzas,
  equilibrio, fricción y flotación.
- `cie_relacion` — Relación con la sociedad: ciencia aplicada al cuerpo humano (nutrición, sistemas), procesos fisicoquímicos
  cotidianos, manipulación genética y productos químicos con sus consecuencias en salud y ambiente, ciencia y entorno.
- `cie_argumentacion` — Interpretación y argumentación a partir de evidencias y representaciones: leer tablas, gráficas y
  esquemas de experimentos, identificar variables, sacar conclusiones válidas, composición de sustancias, energía.

**comprension_lectora** (abreviatura `lec`, 75): **todos** los reactivos van ligados a una lectura (`texto`). Cada lectura
lleva **3 o 6 preguntas** (como en el examen). Ámbitos: estudio 30 reactivos (artículo de divulgación, texto expositivo,
reseña, infografía en prosa), literario 30 (cuento, fábula, poema, fragmento de obra de teatro, leyenda), participación
social 15 (reglamento, carta formal, anuncio, convocatoria, noticia, texto de opinión). Lecturas de 180–450 palabras.
Temas (tipo de habilidad, mezclados en todos los ámbitos, ~25 cada uno):
- `lec_identificar` — Identificación de información (datos explícitos, quién, cuándo, dónde, secuencia).
- `lec_interpretar` — Interpretación (idea principal, propósito, inferencias, sentido de una palabra o frase en contexto).
- `lec_evaluar` — Evaluación de la forma y el contenido (estructura, recursos, tipo de texto, intención, pertinencia de un ejemplo).
Pon en `genero` el tipo de texto y en `tipo` 'literario' o 'no_literario'. Distribuye ámbitos con la clave adicional
`ambito: 'estudio'|'literario'|'social'` en cada TEXTO.

**redaccion_indirecta** (abreviatura `red`, 75): reactivos sueltos (sin lectura); la mitad en contexto de estudio
(tareas, resúmenes, exposiciones) y la mitad de participación social (cartas, avisos, mensajes a la comunidad).
- `red_comunicativa` (25) — Comunicativa: propósito, orden lógico de ideas, conectores, coherencia, cohesión, registro adecuado.
- `red_gramatical` (25) — Gramatical y semántica: concordancia, tiempos verbales, pronombres, preposiciones, sinónimos en
  contexto, ambigüedad, palabras parónimas.
- `red_ortografica` (25) — Ortográfica: acentuación (agudas, graves, esdrújulas, diacrítica, hiato), b/v, c/s/z, g/j, h, ll/y,
  mayúsculas, puntuación (coma, punto y coma, dos puntos).
Formato típico: «¿Qué opción completa…?», «¿Cuál es la forma correcta de…?», «¿En qué oración…?», «¿Qué conector…?».

**pensamiento_matematico** (abreviatura `mat`, 100):
- Subárea Comprensión de lo matemático (60): `mat_conexiones` (15) relacionar representaciones (tabla, gráfica, expresión);
  `mat_estimacion` (15) estimar y aproximar, órdenes de magnitud, redondeo; `mat_sentido_numerico` (15) fracciones, decimales,
  porcentajes, proporcionalidad, números con signo, potencias y raíces; `mat_matematizacion` (15) plantear problemas en
  lenguaje algebraico (ecuaciones lineales, sistemas 2×2, cuadráticas sencillas).
- Subárea Desarrollo de usos (40): `mat_lenguaje` (20) interpretar y manipular expresiones algebraicas, sucesiones, fórmulas,
  geometría (áreas, perímetros, volúmenes, Pitágoras, ángulos, semejanza); `mat_resignificaciones` (20) usar lo aprendido en
  situaciones nuevas: probabilidad, estadística (media, mediana, moda, gráficas), funciones lineales y variación.
Todo resoluble sin calculadora (el EXANI-I no la permite en papel), con números amables.

**ingles** (abreviatura `ing`, 75), nivel **A2** del Marco Común Europeo. Enunciados y opciones en inglés; `pista`, `pasos`
y `regla` en **español** (para que el estudiante entienda por qué).
- `ing_orientarse` (19) — Leer para orientarse: avisos, horarios, anuncios, menús, letreros, mensajes cortos (con `texto`).
- `ing_informacion` (19) — Leer en busca de información y argumento: textos breves de 120–220 palabras (con `texto`).
  Lecturas de inglés: 3 o 5 preguntas cada una.
- `ing_redaccion_creativa` (19) — Redacción indirecta creativa: completar mensajes, postales, diálogos, historias (gramática y
  vocabulario A2: present simple/continuous, past simple, going to, comparativos, preposiciones, can/must, there is/are).
- `ing_reportes` (18) — Redacción de reportes y ensayos: ordenar ideas, conectores (because, so, but, first, then), elegir la
  oración que completa un informe o correo formal sencillo.

## Reglas de calidad (obligatorias)

1. **Exactitud absoluta.** Cada dato (fechas, nombres, fórmulas, constantes, resultados) debe ser correcto. Resuelve cada
   problema numérico tú mismo y comprueba el resultado. Si dudas de un dato, no lo uses. Mejor un reactivo menos que uno con error.
2. **Una sola respuesta correcta**, sin ambigüedad. Los distractores son plausibles y salen de errores típicos reales
   (signo, unidad, confundir conceptos), nunca absurdos ni «todas/ninguna de las anteriores».
3. **3 opciones distintas** (exactamente tres), de longitud y estilo parecidos (que la correcta no se delate por ser la más
   larga). Reparte la posición de la correcta: aprox. un tercio en cada índice 0–2.
4. **El cliente baraja las opciones.** En pista, pasos y regla NO escribas «la opción A/B…» ni «el inciso C». Si necesitas
   referirte a una opción, usa `{A}`, `{B}`, `{C}` (= posición en este archivo; el cliente la cambia por la letra que ve el
   estudiante) o, mejor, nómbrala por su contenido.
5. **Nivel:** fin de secundaria (14–15 años). Vocabulario sencillo. Dificultad: ~30 % nivel 1, ~45 % nivel 2, ~25 % nivel 3.
   Enunciados breves.
6. **Español de México**, claro y correcto: acentos, signos de apertura ¿¡, decimales con punto, miles con coma, unidades del
   SI con espacio (9.8 m/s²). Fórmulas en texto plano legible (x², √, π, ½, ≤, →); sin LaTeX.
7. Contextos variados y cercanos a un estudiante de Guanajuato o de México en general (escuela, familia, comunidad, comercio
   local, deporte, naturaleza), sin estereotipos, sin marcas comerciales y sin nombrar a la UG ni a CENEVAL.
8. **Pistas que enseñan:** la pista orienta el razonamiento, no da el número. Los pasos se siguen sin libro. La regla
   resume el concepto y el error típico.
9. Al terminar, valida: `node _tienda/scripts/validar-banco.mjs --opciones 3 _tienda/src/simulador/prepa-ug/<seccion>.js`
   debe decir ✓. Corrige todo lo que marque.
