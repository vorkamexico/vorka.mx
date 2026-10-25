# Banco del Simulador ECOEMS (ingreso a bachillerato) · cómo se escribe

Contenido **100 % original de Vorka México**. Se usa para practicar el ECOEMS (antes COMIPEMS), el examen único de
ingreso a bachillerato en la Zona Metropolitana del Valle de México (UNAM: prepas y CCH; IPN: CECyT, y otras): 128
reactivos de opción múltiple en 3 horas. Habilidad verbal 16, Habilidad matemática 16, y 12 por cada una de Español,
Historia, Geografía, Formación cívica y ética, Matemáticas, Física, Química y Biología. El temario es el de **secundaria**
(plan de estudios de la SEP), pero **no se copia ni se parafrasea ningún reactivo** de guías, libros, simuladores ni
exámenes de nadie.

## Archivo

Un módulo ES por materia en `_tienda/src/simulador/ecoems/<materia>.js` que exporta:

```js
export const TEMAS_<MATERIA> = {
  <tema_id>: { seccion: '<materia>', nombre: 'Nombre visible del tema', consejo: 'Qué repasar y cómo, en 1–2 oraciones concretas.' },
  …
};
export const TEXTOS_<MATERIA> = { … };   // solo si la materia usa lecturas (Español, Literatura, Filosofía si aplica)
export const REACTIVOS_<MATERIA> = [ … ];
```

Reactivo:

```js
{ id: 'E-<mat>-<n>', seccion: '<materia>', tema: '<tema_id>', dificultad: 1|2|3,
  texto?: '<id de TEXTOS>',            // solo si la pregunta es sobre una lectura
  enunciado: '…',
  tabla?: [['Encabezado 1', 'Encabezado 2'], ['dato', 'dato'], …],   // opcional: la 1.ª fila son los encabezados
  figura?: '<svg viewBox="…" …>…</svg>',   // opcional: SVG en línea, sencillo y con texto legible (geometría, gráficas, vectores)
  opciones: ['…', '…', '…', '…'], correcta: 0–3,
  pista: '…',      // se muestra tras el 1.er error: orienta el MÉTODO sin dar la respuesta ni descartar opciones por letra
  pasos: ['…', '…'],   // solución paso a paso (2–5 pasos), termina mostrando por qué la correcta es correcta
  regla: '…' }     // el concepto o regla general detrás, y el error típico que lleva a los distractores
```

Lectura (TEXTOS): `{ <id>: { seccion: '<materia>', tipo: 'literario'|'no_literario', titulo: '…', genero: '…', autor?: '…', parrafos: ['…', …] } }`.
Las lecturas deben ser **originales** o de **dominio público** (autor fallecido hace más de 100 años, p. ej. Sor Juana,
Cervantes, Darío, Amado Nervo, Martí, Bécquer). Si es de dominio público, pon `autor` y respeta el texto. Nunca uses
fragmentos de autores con derechos vigentes (Rulfo, Paz, Fuentes, García Márquez, Castellanos, etc.): para preguntar por
ellos usa preguntas de conocimiento (obra, corriente, rasgos), no citas largas.

## Reglas de calidad (obligatorias)

1. **Exactitud absoluta.** Cada dato (fechas, nombres, fórmulas, constantes, resultados) debe ser correcto. Resuelve cada
   problema numérico tú mismo y comprueba el resultado. Si dudas de un dato histórico o científico, verifícalo con una
   fuente confiable (web) o no lo uses. Mejor un reactivo menos que uno con error.
2. **Una sola respuesta correcta**, sin ambigüedad. Los distractores deben ser plausibles y salir de errores típicos
   reales (signo, unidad, confundir conceptos o fechas cercanas), nunca absurdos ni "todas/ninguna de las anteriores".
3. **4 opciones distintas**, de longitud y estilo parecidos (que la correcta no se delate por ser la más larga).
   Varía la posición de la correcta (aprox. 25 % en cada índice 0–3).
4. **El cliente baraja las opciones.** En pista, pasos y regla NO escribas "la opción A/B…" ni "el inciso C". Si
   necesitas referirte a una opción, usa `{A}`, `{B}`, `{C}`, `{D}` (= posición en este archivo; el cliente la cambia por la letra
   que ve el estudiante) o, mejor, nómbrala por su contenido.
5. **Nivel:** fin de secundaria (estudiantes de 14–15 años), como el ECOEMS real: vocabulario sencillo y claro. Dificultad: ~30 % nivel 1 (dato o concepto directo),
   ~45 % nivel 2 (aplicar/relacionar), ~25 % nivel 3 (varios pasos, análisis). El examen real es de reactivos breves;
   evita enunciados larguísimos.
6. **Español de México**, claro y correcto: acentos, signos de apertura ¿¡, decimales con punto, miles con coma,
   unidades del SI con espacio (9.8 m/s²). Fórmulas en texto plano legible (x², √, π, ½, ≤, →); sin LaTeX.
7. **Cubre todos los temas** de la materia de forma equilibrada (ningún tema con menos de 4 reactivos).
8. **Pistas que enseñan:** la pista orienta el razonamiento ("¿qué se conserva en un choque elástico?"), no da el número.
   Los pasos deben poder seguirse sin el libro. La regla resume el concepto y el error típico.
9. Al terminar, valida: `node _tienda/scripts/validar-banco.mjs _tienda/src/simulador/ecoems/<materia>.js` debe decir ✓.
   Corrige todo lo que marque.
