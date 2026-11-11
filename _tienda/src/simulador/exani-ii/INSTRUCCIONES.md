# Banco del Simulador EXANI-II · cómo se escribe

Contenido **100 % original de Vorka México**. Se usa para practicar el EXANI-II de CENEVAL, el examen de admisión a
licenciatura que usan muchas universidades públicas (BUAP, UANL, UADY, UAA, UV, UAdeC y otras). Según la página oficial
del EXANI-II (ceneval.edu.mx/examenes-ingreso-exani_ii/): reactivos de opción múltiple con **tres opciones**, una sola
sesión de 4 h 30 min; Comprensión lectora 30, Redacción indirecta 30, Pensamiento matemático 30, **dos módulos de
conocimientos disciplinares de 24** (los elige la universidad según la carrera) e Inglés 30 (diagnóstico, nivel B1).

| Archivo / sección | Abreviatura | Reactivos en el banco |
|---|---|---|
| `comprension_lectora` | `lec` | 75 |
| `redaccion_indirecta` | `red` | 75 |
| `pensamiento_matematico` | `mat` | 75 |
| `ingles` | `ing` | 75 |
| `ciencias_experimentales` (módulo general) | `cex` | 50 |
| `ciencias_sociales` (módulo general) | `cso` | 50 |
| `biologia` | `bio` | 50 |
| `ciencias_salud` | `sal` | 50 |
| `quimica` | `qui` | 50 |
| `fisica` | `fis` | 50 |
| `aritmetica` | `ari` | 50 |
| `probabilidad_estadistica` | `pye` | 50 |
| `administracion` | `adm` | 50 |
| `historia` | `his` | 50 |

El nivel es **fin de bachillerato** (17–18 años; plan de estudios de bachillerato de la SEP / programas de bachillerato
general). **No se copia ni se parafrasea ningún reactivo, texto o ejemplo** de guías de CENEVAL, de universidades, libros,
simuladores ni exámenes de nadie. Inventa situaciones, datos y textos nuevos.

## Archivo

Un módulo ES por sección en `_tienda/src/simulador/exani-ii/<seccion>.js`:

```js
// Banco EXANI-II · <Sección> (contenido 100 % original de Vorka México).
export const TEMAS_<SECCION> = {
  <tema_id>: { seccion: '<seccion>', nombre: 'Nombre visible del tema', consejo: 'Qué repasar y cómo, en 1–2 oraciones concretas.' },
};
export const TEXTOS_<SECCION> = { … };   // solo comprension_lectora e ingles
export const REACTIVOS_<SECCION> = [ … ];
```

`<SECCION>` en mayúsculas (p. ej. `REACTIVOS_PROBABILIDAD_ESTADISTICA`). Reactivo:

```js
{ id: 'EX2-<abreviatura>-<n>', seccion: '<seccion>', tema: '<tema_id>', dificultad: 1|2|3,
  texto?: '<id de TEXTOS>',            // solo si la pregunta es sobre una lectura
  enunciado: '…',
  tabla?: [['Encabezado 1', 'Encabezado 2'], ['dato', 'dato']],   // opcional: la 1.ª fila son los encabezados
  figura?: '<svg viewBox="…" …>…</svg>',   // opcional: SVG en línea sencillo, texto legible, stroke="currentColor", sin fondos de color
  opciones: ['…', '…', '…'], correcta: 0–2,
  pista: '…',      // tras el 1.er error: orienta el MÉTODO sin dar la respuesta ni descartar opciones por letra
  pasos: ['…', '…'],   // solución paso a paso (2–5 pasos), termina mostrando por qué la correcta es correcta
  regla: '…' }     // el concepto o regla general detrás, y el error típico que lleva a los distractores
```

Lectura (TEXTOS): `{ <id>: { seccion: '<seccion>', tipo: 'literario'|'no_literario', titulo: '…', genero: '…', autor?: '…', parrafos: ['…'] } }`.
Las lecturas deben ser **originales** (preferible) o de **dominio público** (autor fallecido hace más de 100 años; pon
`autor` y respeta el texto). Nunca uses fragmentos de autores con derechos vigentes. Ids de TEXTOS con prefijo de la
sección (`lec_t01`, `ing_t01`) para que no choquen.

## Temas por sección (usa exactamente estos ids; `nombre` y `consejo` a tu criterio). Reparte el banco parejo entre temas.

**comprension_lectora** (`lec`, 75): **todos** ligados a una lectura (`texto`), 3 o 6 preguntas por lectura; lecturas de
300–600 palabras: artículo de divulgación, ensayo breve, texto expositivo académico, reseña, cuento, poema, fragmento de
teatro, artículo de opinión, texto normativo o institucional. Temas: `lec_identificar` (datos explícitos, secuencia,
relaciones), `lec_interpretar` (idea principal, propósito, inferencias, sentido en contexto), `lec_evaluar` (estructura,
recursos, postura del autor, solidez de un argumento, pertinencia de un ejemplo). 25 cada uno.

**redaccion_indirecta** (`red`, 75), reactivos sueltos con contexto académico (ensayos, reportes, resúmenes) y
de participación social (cartas formales, avisos, solicitudes): `red_comunicativa` (25: propósito, orden de ideas,
conectores, coherencia, cohesión, registro, párrafo que falta), `red_gramatical` (25: concordancia, tiempos y modos
verbales, pronombres, preposiciones, dequeísmo, ambigüedad, precisión léxica, parónimos), `red_ortografica` (25:
acentuación incl. diacrítica e hiato, grafías b/v c/s/z g/j h ll/y x, mayúsculas, puntuación).

**pensamiento_matematico** (`mat`, 75): `mat_aritmetica` (15: proporciones, porcentajes, razones, fracciones, potencias),
`mat_algebra` (15: expresiones, ecuaciones e inecuaciones lineales, sistemas 2×2, cuadráticas, factorización),
`mat_funciones` (15: lineal, cuadrática, exponencial, interpretar gráficas y tablas, tasa de cambio),
`mat_geometria` (15: áreas, volúmenes, Pitágoras, semejanza, trigonometría básica, plano cartesiano),
`mat_estadistica` (15: media, mediana, moda, rango, gráficas, probabilidad clásica). Números amables, sin calculadora.

**ingles** (`ing`, 75), nivel **B1**. Enunciados, opciones y lecturas en inglés; `pista`, `pasos` y `regla` en **español**.
`ing_lectura_general` (19: idea general y propósito, con `texto`), `ing_lectura_detalle` (19: detalle, inferencia,
vocabulario en contexto, con `texto`; lecturas de 180–320 palabras, 3 o 5 preguntas cada una), `ing_gramatica` (19:
present perfect, past continuous, first/second conditional, passive voice, modals, relative clauses, gerund/infinitive),
`ing_redaccion` (18: conectores, ordenar oraciones, completar correos y reportes, registro formal/informal).

**ciencias_experimentales** (`cex`, 50; módulo general que integra biología, química y física de bachillerato):
`cex_biologia` (17), `cex_quimica` (17), `cex_fisica` (16). Prioriza reactivos que pidan aplicar e interpretar datos.

**ciencias_sociales** (`cso`, 50; módulo general): `cso_historia` (13: México y el mundo, siglos XIX–XX),
`cso_geografia` (12: población, regiones, recursos, ambiente), `cso_civica` (13: Constitución, derechos humanos, división
de poderes, participación ciudadana; solo datos estables y verificables), `cso_economia_sociedad` (12: conceptos básicos de
economía, sociología, problemas sociales; interpretar datos).

**biologia** (`bio`, 50): `bio_celula` (10: estructura, membrana, transporte, división), `bio_metabolismo` (10: biomoléculas,
enzimas, fotosíntesis, respiración), `bio_genetica` (10: ADN, síntesis de proteínas, Mendel, mutaciones), `bio_evolucion`
(10: selección natural, especiación, clasificación de los seres vivos), `bio_ecologia` (10: ecosistemas, flujo de energía,
ciclos, poblaciones).

**ciencias_salud** (`sal`, 50): `sal_anatomia` (13: sistemas del cuerpo humano y su función), `sal_salud_publica` (12:
determinantes de la salud, prevención, epidemiología básica: incidencia, prevalencia, interpretar tasas),
`sal_nutricion` (12: nutrimentos, plato del bien comer, metabolismo energético, IMC), `sal_microbiologia` (13: microorganismos,
infección, sistema inmune, vacunas, higiene). Nada de diagnóstico ni recomendaciones médicas personales.

**quimica** (`qui`, 50): `qui_materia` (10: propiedades, mezclas, métodos de separación), `qui_atomo` (10: modelo atómico,
configuración electrónica, tabla periódica, propiedades periódicas), `qui_enlace` (10: enlaces, nomenclatura inorgánica),
`qui_reacciones` (10: tipos, balanceo, estequiometría, mol), `qui_disoluciones` (10: concentración, pH, ácidos y bases,
química del carbono básica).

**fisica** (`fis`, 50): `fis_cinematica` (10), `fis_dinamica` (10: leyes de Newton, fricción, trabajo, energía, potencia),
`fis_fluidos_calor` (10: presión, Arquímedes, temperatura, calor, dilatación), `fis_ondas_optica` (10), `fis_electricidad`
(10: ley de Ohm, circuitos, potencia eléctrica, magnetismo). Usa g = 9.8 m/s² o 10 m/s² y dilo en el enunciado.

**aritmetica** (`ari`, 50): `ari_numeros` (10: enteros, divisibilidad, mcd y mcm, primos), `ari_fracciones` (10: fracciones,
decimales, operaciones y orden), `ari_proporcion` (10: razones, proporción directa e inversa, regla de tres, repartos),
`ari_porcentaje` (10: porcentajes, aumentos, descuentos, interés simple), `ari_potencias` (10: potencias, raíces, notación
científica, jerarquía de operaciones).

**probabilidad_estadistica** (`pye`, 50): `pye_descriptiva` (12: tablas de frecuencia, medidas de tendencia central),
`pye_dispersion` (12: rango, varianza, desviación estándar, cuartiles, diagramas de caja), `pye_conteo` (13: principio
multiplicativo, permutaciones, combinaciones), `pye_probabilidad` (13: clásica, eventos, complemento, unión, condicional,
independencia).

**administracion** (`adm`, 50): `adm_fundamentos` (10: concepto, enfoques y escuelas de la administración),
`adm_proceso` (15: planeación, organización, dirección, control), `adm_empresa` (13: tipos de empresa, áreas funcionales,
entorno, FODA), `adm_finanzas` (12: conceptos contables básicos, costos, punto de equilibrio sencillo, mercadotecnia básica).

**historia** (`his`, 50): `his_mexico_antiguo` (10: Mesoamérica y conquista), `his_novohispano_independencia` (10),
`his_mexico_xix` (10: Reforma, intervenciones, Porfiriato), `his_mexico_xx` (10: Revolución y México contemporáneo),
`his_universal` (10: revoluciones liberales, guerras mundiales, Guerra Fría). Solo fechas y hechos indiscutibles.

## Reglas de calidad (obligatorias)

1. **Exactitud absoluta.** Cada dato debe ser correcto. Resuelve cada problema tú mismo y comprueba el resultado. Si dudas
   de un dato, no lo uses. Mejor un reactivo menos que uno con error.
2. **Una sola respuesta correcta**, sin ambigüedad. Distractores plausibles que salen de errores típicos reales, nunca
   absurdos ni «todas/ninguna de las anteriores».
3. **Exactamente 3 opciones distintas**, de longitud y estilo parecidos. Reparte la posición de la correcta: aprox. un tercio
   en cada índice 0–2.
4. **El cliente baraja las opciones.** En pista, pasos y regla NO escribas «la opción A/B» ni «el inciso C». Si necesitas
   referirte a una opción usa `{A}`, `{B}`, `{C}` (posición en este archivo) o nómbrala por su contenido.
5. **Nivel:** fin de bachillerato. Dificultad: ~30 % nivel 1, ~45 % nivel 2, ~25 % nivel 3. Enunciados breves; el examen es
   de comprensión y aplicación, no de memoria pura.
6. **Español de México** correcto: acentos, ¿¡, decimales con punto, miles con coma, unidades del SI con espacio (9.8 m/s²).
   Fórmulas en texto plano (x², √, π, ½, ≤, →); sin LaTeX.
7. Contextos variados y cercanos a estudiantes de México, sin estereotipos, sin marcas comerciales, sin nombrar a CENEVAL
   ni a ninguna universidad.
8. **Pistas que enseñan:** orientan el razonamiento, no dan el resultado. Los pasos se siguen sin libro. La regla resume el
   concepto y el error típico.
9. Al terminar valida: `node _tienda/scripts/validar-banco.mjs --opciones 3 _tienda/src/simulador/exani-ii/<seccion>.js`
   (desde la raíz del repo) debe decir ✓. Corrige todo lo que marque.
