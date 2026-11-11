# Banco del Simulador EXCOBA · cómo se escribe

Contenido **100 % original de Vorka México**. Se usa para practicar el **Excoba** (Examen de Competencias Básicas, de
Métrica Educativa, A.C.), el examen de admisión a licenciatura de la UAQ y de la UG. Hechos verificados en los
instructivos oficiales (ver `FUENTES.md` en esta carpeta):

- 180 preguntas: **primaria** (Español 20, Matemáticas 20), **secundaria** (Español, Matemáticas, Ciencias naturales y
  Ciencias sociales, 20 c/u) y **bachillerato** (3 asignaturas de 20 que dependen de la carrera).
- Respuesta **semiconstruida**: arrastrar elementos (clasificar, ubicar), seleccionar varios elementos, escribir un número
  o una expresión algebraica. Algunas piden una sola respuesta (1 o 0 puntos); las de varias respuestas se califican
  **parcialmente** (si clasificas 4 elementos, cada uno vale 0.25).
- Las 9 asignaturas de bachillerato posibles: Matemáticas para estadística, Matemáticas para cálculo, Física, Biología,
  Lenguaje, Química, Ciencias sociales, Humanidades y (solo en la UG) Ciencias económico-administrativas.

**No se copia ni se parafrasea ningún reactivo, texto o ejemplo** del demo del Excoba, de guías de universidades, libros,
simuladores ni exámenes de nadie. Inventa situaciones, datos y textos nuevos. No nombres al Excoba, a Métrica Educativa
ni a ninguna universidad dentro de los reactivos.

## Archivos (uno por asignatura, 50 reactivos cada uno)

| Archivo / sección (`seccion`) | Abreviatura | Nivel | Temas (ids exactos y reparto) |
|---|---|---|---|
| `pri_espanol` | `pe` | primaria (5.º–6.º) | `pe_textos` 10 (recuento histórico, reportaje, texto científico vs. de divulgación, cuestionarios, instructivos), `pe_cuento` 10 (partes del cuento, personajes, metáfora, símil, analogía, reiteración), `pe_ortografia` 10 (b/v, s/c/z, ll/y, g/j, homófonas, agudas/graves/esdrújulas, monosílabos, puntuación), `pe_gramatica` 10 (partes de la oración simple, concordancia, oraciones compuestas y nexos, significado por contexto, uso del diccionario), `pe_organizar` 10 (clasificar información en secciones temáticas, jerarquizar ideas, tiempos verbales en instructivos) |
| `pri_matematicas` | `pm` | primaria | `pm_naturales` 10 (las cuatro operaciones con naturales en problemas), `pm_fracciones_decimales` 10, `pm_geometria` 10 (elementos de figuras, perímetros, áreas, cuerpos y volumen), `pm_medicion_proporcion` 10 (unidades, conversiones, proporcionalidad, escalas), `pm_datos_azar` 10 (tablas, gráficas, probabilidad simple) |
| `sec_espanol` | `se` | secundaria | `se_medios` 10 (publicidad, elementos de la noticia, fuente, hecho vs. opinión, postura del autor), `se_informativos` 10 (propósito, oración temática, recursos gráficos, puntos de vista, coma en adversativas, causales, condicionales y concesivas), `se_entrevista_informe` 10 (reporte de entrevista, discurso directo e indirecto, nexos, acento diacrítico y enfático, informe técnico, voz pasiva, impersonal, cohesión), `se_literarios` 10 (géneros, figuras en poemas, reseña y prólogo, sinónimos, sustitución léxica y pronominal), `se_administrativos` 10 (cartas de solicitud o reclamo, reglamentos, documentos que garantizan derechos) |
| `sec_matematicas` | `sm` | secundaria | `sm_numeros_algebra` 10 (reales, potencias y raíces, literales, polinomios, sucesiones aritméticas), `sm_ecuaciones` 10 (primer y segundo grado, sistemas 2×2), `sm_funciones` 10 (recta y pendiente, parábola, proporcionalidad inversa), `sm_geometria` 10 (simetrías, traslación, rotación, ángulos entre paralelas, Pitágoras, desarrollos, áreas y volúmenes, semejanza, Tales, seno/coseno/tangente), `sm_estadistica` 10 (conteo, gráficas circulares y de barras, media, mediana, moda, rango) |
| `sec_ciencias_naturales` | `sn` | secundaria | `sn_biologia` 17 (biodiversidad, adaptación, nutrición, respiración, reproducción, mitosis y meiosis, genes y cromosomas; salud sexual solo con datos científicos y lenguaje respetuoso), `sn_fisica` 17 (movimiento, velocidad, aceleración, gráficas, fuerzas y leyes de Newton, energía cinética y potencial, presión, calor y temperatura, modelo atómico y electromagnetismo), `sn_quimica` 16 (propiedades intensivas/extensivas, conservación de la masa, mezclas y separación, tabla periódica, enlaces, ácidos y bases, oxidación y reducción) |
| `sec_ciencias_sociales` | `ss` | secundaria | `ss_geografia` 17 (mapas, coordenadas, escalas, recursos naturales, población y migración, globalización, IDH, diversidad cultural), `ss_historia` 17 (siglos XVI–XX en el mundo, culturas prehispánicas, Nueva España, independencia, Revolución mexicana, guerras mundiales), `ss_civica` 16 (democracia, derechos humanos, Estado mexicano, participación ciudadana, convivencia y diversidad; solo datos estables) |
| `mat_estadistica` | `me` | bachillerato | `me_algebra` 10 (jerarquía de operaciones, polinomios, factorización, ecuaciones lineales y cuadráticas), `me_estadistica` 10 (tendencia central y dispersión en datos agrupados y no agrupados, tablas y gráficas), `me_probabilidad` 10 (conjuntos, leyes aditiva y multiplicativa, árboles, factorial, permutaciones y combinaciones), `me_funciones` 10 (dominio y rango, funciones especiales, polinomiales, racionales y asíntotas, exponenciales y logarítmicas), `me_financieras` 10 (reparto proporcional, progresiones aritméticas y geométricas, interés simple, valor actual, descuento simple) |
| `mat_calculo` | `mc` | bachillerato | `mc_algebra` 10 (polinomios, factorización, sistemas 2×2 y 3×3, cuadráticas y modelado), `mc_geometria_trigo` 10 (ángulos y triángulos, congruencia, Tales, polígonos, circunferencia, razones trigonométricas, ley de senos y de cosenos, grados y radianes), `mc_analitica` 10 (distancia, pendiente, paralelas y perpendiculares, ecuaciones de la recta, circunferencia, parábola y elipse), `mc_funciones` 10 (dominio y rango, inversa, valor absoluto, polinomiales, racionales, exponencial, logaritmo, seno y coseno: amplitud y periodo), `mc_estadistica` 10 (medidas de tendencia central y dispersión, probabilidad elemental) |
| `fisica` | `fi` | bachillerato | `fi_magnitudes` 8 (método científico, magnitudes y unidades, notación científica, vectores), `fi_movimiento` 10 (MRU, MRUA, caída libre, tiro parabólico, circular), `fi_dinamica` 10 (leyes de Newton, fricción, gravitación universal, leyes de Kepler), `fi_energia` 8 (trabajo, energía cinética y potencial, conservación, potencia), `fi_fluidos_calor` 7 (presión hidrostática, Pascal, Arquímedes, continuidad, calor específico, dilatación), `fi_electromagnetismo` 7 (carga, Coulomb, Ohm, circuitos serie y paralelo, potencia eléctrica, imanes, inducción) |
| `biologia` | `bi` | bachillerato | `bi_moleculas` 10 (niveles de organización, carbohidratos, lípidos, proteínas, ácidos nucleicos, replicación, ARN, síntesis de proteínas, código genético), `bi_celula` 10 (teoría celular, procariontes y eucariontes, organelos, metabolismo, ATP, autótrofos y heterótrofos, virus, dominios), `bi_herencia` 10 (reproducción, Mendel, cruzas, Sutton y Morgan, herencia ligada al sexo), `bi_evolucion` 8 (Darwin y Wallace, selección natural y artificial, variabilidad, biotecnología), `bi_organismos` 6 (tejidos y sistemas humanos, plantas: tejidos y características), `bi_ecologia` 6 (factores bióticos y abióticos, ecosistemas, flujo de energía, ciclos biogeoquímicos, áreas protegidas) |
| `lenguaje` | `le` | bachillerato | `le_comunicacion` 10 (elementos de la comunicación, funciones del lenguaje: emotiva, conativa, referencial, metalingüística, fática, poética), `le_redaccion` 10 (adecuación, coherencia, cohesión, prototipos textuales, textos expositivos, funcionales y persuasivos), `le_lexico` 10 (acentuación, grafías, homófonos, puntuación, sinónimos, antónimos, homógrafos, parónimos, polisemia, prefijos y sufijos griegos y latinos, vicios de dicción), `le_narrativa` 10 (literatura como arte, movimientos literarios, fábula y epopeya, mito y leyenda, cuento, tipos de novela), `le_lirica_drama` 10 (género lírico, recursos fónicos y morfosintácticos, géneros y subgéneros dramáticos, tragedia, comedia y drama) |
| `quimica` | `qu` | bachillerato | `qu_materia` 8 (propiedades y cambios de la materia, energía), `qu_atomo` 10 (modelos atómicos, partículas, número atómico y de masa, isótopos, configuración electrónica, números cuánticos, tabla periódica y propiedades periódicas), `qu_enlace` 10 (iónico, covalente, metálico, fuerzas intermoleculares, nomenclatura inorgánica UIQPA), `qu_reacciones` 8 (tipos, balanceo, entalpía, exotérmicas y endotérmicas, velocidad de reacción), `qu_estequiometria` 7 (mol, masa molar, leyes ponderales, cálculos estequiométricos), `qu_dispersos_carbono` 7 (disoluciones, coloides y suspensiones, % y molaridad, ácidos y bases, contaminación, compuestos del carbono, polímeros) |
| `ciencias_sociales` | `cs` | bachillerato | `cs_conocimiento` 10 (tipos de conocimiento, ciencias formales y fácticas, empirismo, racionalismo, Ilustración, positivismo, materialismo histórico, funcionalismo, teoría comprensiva y crítica), `cs_mexico_antiguo_colonia` 13 (escuelas de interpretación histórica, poblamiento de América, Mesoamérica, Aridoamérica y Oasisamérica, conquista, virreinato, independencia), `cs_mexico_xix_xx` 14 (liberales y conservadores, intervenciones extranjeras, Reforma, Porfiriato, Revolución, Constitución de 1917, Carranza, Obregón, Calles, Maximato, Cárdenas, México de 1940 a 2012: solo hechos indiscutibles), `cs_universal` 13 (imperialismo y Primera Guerra Mundial, Revolución rusa y totalitarismos, crisis de 1929, Segunda Guerra Mundial, Guerra Fría, descolonización, posguerra fría) |
| `humanidades` | `hu` | bachillerato | `hu_etica` 15 (ética y moral, juicios de valor, valores y antivalores, libertad, justicia, Estado de derecho, derechos humanos, identidad y multiculturalidad), `hu_bioetica_ambiente` 10 (bioética, avances médicos, manipulación genética, cambio climático, ética ambiental, eudemonismo, hedonismo, utilitarismo, formalismo), `hu_filosofia` 13 (filosofía, ciencia y religión, presocráticos, sofistas, Sócrates, Platón, Aristóteles, filosofía medieval, Renacimiento, racionalismo, empirismo, idealismo, posmodernidad), `hu_metodologia` 12 (investigación científica, tipos de conocimiento, métodos, enfoque cualitativo y cuantitativo, planteamiento del problema, marco teórico, resultados y conclusiones) |
| `economico_admin` | `ea` | bachillerato (solo UG) | `ea_contabilidad` 13 (evolución y obligaciones contables, cargo y abono, activo, pasivo, capital, ingresos y egresos, sistema analítico, utilidad o pérdida), `ea_administracion` 12 (historia y teorías de la administración, proceso administrativo), `ea_estructura_mexico` 13 (crecimiento y desarrollo económico, modelos económicos de México 1940–1982, globalización y bloques, sector terciario, economía informal; solo hechos indiscutibles), `ea_informatica` 12 (sistema operativo y seguridad de la información, procesador de textos, presentaciones, algoritmos y diagramas de flujo, hojas de cálculo: fórmulas, funciones, referencias) |

Nivel: el de la sección (primaria ≈ 5.º–6.º de primaria; secundaria ≈ 3.º de secundaria; bachillerato ≈ fin de
bachillerato). Dificultad en cada archivo: ~30 % nivel 1, ~45 % nivel 2, ~25 % nivel 3.

## Formato

Un módulo ES por sección en `_tienda/src/simulador/excoba/<seccion>.js`:

```js
// Banco EXCOBA · <Asignatura> (<nivel>) · contenido 100 % original de Vorka México.
export const TEMAS_<SECCION> = {
  <tema_id>: { seccion: '<seccion>', nombre: 'Nombre visible del tema', consejo: 'Qué repasar y cómo, en 1–2 oraciones concretas.' },
};
export const REACTIVOS_<SECCION> = [ … ];
```

`<SECCION>` en mayúsculas (p. ej. `REACTIVOS_SEC_CIENCIAS_NATURALES`). Ids: `EXC-<abreviatura>-<n>` (n de 1 a 50).
No hay lecturas aparte (no uses `texto`): si un reactivo necesita un fragmento, ponlo en el `enunciado` (máximo ~120
palabras), separado de la pregunta con `\n\n`. Puedes usar `**negritas**` para marcar la palabra que se pregunta.

Campos comunes de todo reactivo:

```js
{ id, seccion, tema, dificultad: 1|2|3, enunciado,
  tabla?: [['Encabezado', '…'], ['dato', '…']],   // opcional; la 1.ª fila son encabezados
  figura?: '<svg viewBox="…">…</svg>',            // opcional: SVG sencillo, stroke="currentColor", texto legible, sin colores de fondo
  pista,   // tras el 1.er error: orienta el MÉTODO sin dar la respuesta
  pasos: ['…'],   // 2–5 pasos; el último muestra por qué la respuesta es la correcta
  regla }  // el concepto general y el error típico que lleva a fallar
```

Y según el tipo de respuesta (**mezcla los cuatro tipos en cada archivo**):

1. **Opción única** (sin `tipo`): `opciones: ['…','…','…','…']` (exactamente **4**), `correcta: 0–3`. Reparte la posición de la
   correcta (≈ un cuarto en cada índice) y cuida que la correcta **no** sea la más larga: opciones de longitud parecida.
2. **Seleccionar varios** (`tipo: 'multiple'`): `opciones` de 4 a 6, `correctas: [índices]` (2 o más, menos que el total).
   El enunciado **dice cuántas elegir con número o palabra** («Selecciona las **tres** …», «Elige 2 …»). Crédito parcial:
   cada correcta elegida vale 1/n.
3. **Escribir número o expresión** (`tipo: 'numerica'`): `respuestas: ['18']` (texto; la primera es la que se muestra;
   agrega equivalentes si hace falta: `['0.75', '3/4']`), `tolerancia?: 0.01` (absoluta, solo si hay redondeo; dilo en el
   enunciado: «Redondea a centésimos»), `unidad?: 'cm²'` (se muestra junto a la caja; el estudiante escribe solo el número).
   Con `expresion: true` la respuesta es algebraica (`respuestas: ['2x+6']`): el cliente acepta cualquier expresión
   equivalente (3(x+2) − x …). Si pides «desarrolla» o «simplifica», agrega `sinParentesis: true` (y dilo en el enunciado): así copiar la expresión original no cuenta. Variables de una sola letra; usa x, y, a, b, n. Úsalo solo donde escribir es natural
   (matemáticas, física, química, estadística, contabilidad); nunca para texto.
4. **Clasificar o ubicar** (`tipo: 'clasificar'`): `categorias: ['…','…']` (2 a 4) y `elementos: [{ texto: '…', categoria: 0 }, …]`
   (3 a 6 elementos, usando al menos 2 categorías). El enunciado dice qué hacer («Clasifica cada … como …»). Sirve también
   para ordenar o ubicar: categorías «1.º», «2.º», «3.º» o «Antes de 1810» / «Después de 1810». Crédito parcial: cada
   elemento bien clasificado vale 1/n. El cliente baraja el orden de los elementos.

Reparto por archivo de 50: **30 a 32 de opción única** y **18 a 20 semiconstruidos**. En materias con cálculo
(pri_matematicas, sec_matematicas, mat_estadistica, mat_calculo, fisica, quimica, sec_ciencias_naturales) incluye al
menos 6 `numerica`; en las demás usa sobre todo `multiple` y `clasificar` (al menos 6 de cada una).

Ejemplos de forma (no los copies; son solo el formato):

```js
{ id: 'EXC-xx-1', seccion: 'sec_matematicas', tema: 'sm_ecuaciones', dificultad: 2, tipo: 'numerica',
  enunciado: 'Una papelería vende cuadernos a $18 y plumas a $7. Lucía gastó $104 y compró 2 plumas. ¿Cuántos cuadernos compró?',
  respuestas: ['5'], unidad: 'cuadernos',
  pista: 'Plantea una ecuación con el número de cuadernos como incógnita: lo que gastó en total menos lo de las plumas.',
  pasos: ['18c + 2(7) = 104.', '18c = 104 − 14 = 90.', 'c = 90 ÷ 18 = 5 cuadernos. Comprueba: 5(18) + 14 = 104.'],
  regla: '…' },
{ id: 'EXC-xx-2', seccion: 'sec_ciencias_sociales', tema: 'ss_civica', dificultad: 1, tipo: 'clasificar',
  enunciado: 'Clasifica cada facultad según el poder de la Unión que la ejerce.',
  categorias: ['Ejecutivo', 'Legislativo', 'Judicial'],
  elementos: [{ texto: 'Aprobar leyes federales', categoria: 1 }, { texto: '…', categoria: 0 }, …],
  pista: '…', pasos: ['…'], regla: '…' },
{ id: 'EXC-xx-3', seccion: 'biologia', tema: 'bi_celula', dificultad: 2, tipo: 'multiple',
  enunciado: 'Selecciona las **dos** estructuras que tienen las células vegetales pero no las animales.',
  opciones: ['Pared celular', 'Mitocondria', 'Cloroplasto', 'Ribosoma', 'Membrana plasmática'], correctas: [0, 2],
  pista: '…', pasos: ['…'], regla: '…' },
```

## Reglas de calidad (obligatorias)

1. **Exactitud absoluta.** Cada dato debe ser correcto. Resuelve cada problema tú mismo y comprueba el resultado (números
   amables: el examen permite calculadora, pero el simulador no la trae). Si dudas de un dato, no lo uses.
2. **Una sola respuesta correcta** (o un solo conjunto correcto), sin ambigüedad. Distractores plausibles que salen de
   errores típicos reales; nunca «todas/ninguna de las anteriores».
3. **El cliente baraja las opciones.** En pista, pasos y regla NO escribas «la opción A/B» ni «el inciso C». Si necesitas
   referirte a una opción usa `{A}`, `{B}`, `{C}`, `{D}`, `{E}`, `{F}` (posición en este archivo) o nómbrala por su contenido.
4. **Español de México** correcto: acentos, ¿¡, decimales con punto, miles con coma, unidades del SI con espacio (9.8 m/s²).
   Fórmulas en texto plano (x², √, π, ½, ≤, →); sin LaTeX.
5. Contextos variados y cercanos a estudiantes de México (Querétaro, Guanajuato y el resto del país), sin estereotipos, sin
   marcas comerciales, sin personas reales vivas salvo figuras históricas.
6. **Pistas que enseñan**: orientan el razonamiento, no dan el resultado. Los pasos se siguen sin libro. La regla resume el
   concepto y el error típico. En `multiple` y `clasificar`, los pasos explican cada elemento.
7. Al terminar, desde la raíz del repo: `node _tienda/scripts/validar-banco.mjs _tienda/src/simulador/excoba/<seccion>.js`
   debe decir ✓ y `node _tienda/scripts/sesgo-tres.mjs _tienda/src/simulador/excoba/<seccion>.js` también. Corrige todo
   lo que marquen.
