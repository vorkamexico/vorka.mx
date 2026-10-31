// Guías para prepararte (vorka.mx/<simulador>/guias/<guía>/): contenido útil para quien busca en Google cómo es su examen,
// cuánto necesita y cómo estudiar, con liga al simulador que le toca. Mismo patrón que brindi-guias.js: los datos aquí,
// la página la arma paginaGuia(). Cada simulador tiene su índice (/<simulador>/guias/) y su sección en la página de venta.
// Reglas (política de la organización: sin inventar datos):
//  - Todo dato concreto sale de la fuente que la guía cita en «Fuentes» (revisadas el 31 de octubre de 2026).
//  - Lo que es consejo nuestro se presenta como tal. Ejemplos de preguntas: solo propios y marcados.
//  - PAA: sin minutos por sección (la única guía del College Board con tiempos es de 2020; ver commit 5501997).
//  - Nunca «oficial» para el simulador: es un simulador de práctica de Vorka México.
import { esc, pagina } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';
import { UNIVERSIDADES } from './paa-universidades.js';

const SITIO = 'https://vorka.mx';
export const ACTUALIZADO = '2026-10-31';
const ACTUALIZADO_TXT = 'octubre de 2026';

// ---------- fuentes (todas revisadas el 31 de octubre de 2026) ----------
const F = {
  cbPaa: { nombre: 'College Board Puerto Rico y América Latina: página de la PAA', url: 'https://latam.collegeboard.org/paa/' },
  cb2020: { nombre: 'College Board: PAA, preguntas y respuestas (2020)', url: 'https://latam.collegeboard.org/wp-content/uploads/2020/04/2020-PAA-Preguntas-y-Respuestas.pdf' },
  unamInstr: { nombre: 'DGAE UNAM: Instructivo del Concurso de Selección Ingreso a Licenciatura 2026', url: 'https://repositorio.dgae.unam.mx/Licenciatura2026/instructivo_licenciatura2026.pdf' },
  unamOferta: { nombre: 'UNAM: Oferta académica de licenciatura por área', url: 'https://oferta.unam.mx/' },
  unamComision: { nombre: 'Gaceta UNAM: Recomendación de la Comisión Técnica sobre el examen de control presencial (agosto de 2026)', url: 'https://www.gaceta.unam.mx/wp-content/uploads/2026/08/260803-recomendacion-comision-tecnica-de-la-unam.pdf' },
  forbesControl: { nombre: 'Forbes México: la UNAM anuncia fechas del examen de control presencial (4 de agosto de 2026)', url: 'https://forbes.com.mx/unam-anuncia-fechas-del-examen-de-control-presencial-para-licenciatura/' },
  excelsiorInforme: { nombre: 'Excélsior: el informe técnico de la UNAM sobre el examen de licenciatura 2026', url: 'https://www.excelsior.com.mx/nacional/unam-opero-examen-virtual-con-matriz-hace-15-anos' },
  mdmlConv: { nombre: 'Mi derecho, mi lugar: Convocatoria 2026 (fecha ampliada)', url: 'https://www.miderechomilugar.gob.mx/blog/wp-content/uploads/2026/04/CONVOCATORIA-2026_Fecha-ampliada.pdf' },
  mdmlInstr: { nombre: 'Mi derecho, mi lugar: Instructivo 2026 (fecha ampliada)', url: 'https://www.miderechomilugar.gob.mx/blog/wp-content/uploads/2026/04/INSTRUCTIVO-2026_Fecha-ampliada.pdf' },
  mdmlCatalogo: { nombre: 'Mi derecho, mi lugar: Catálogo de opciones educativas con examen 2026', url: 'https://www.miderechomilugar.gob.mx/blog/wp-content/uploads/2026/02/CATALOGO-DE-OPCIONES-EDUCATIVAS-CON-EXAMEN-2026.pdf' },
  mdmlBuscador: { nombre: 'Mi derecho, mi lugar: buscador de opciones educativas', url: 'https://www.miderechomilugar.gob.mx/buscador-escuelas' },
  ugConv: { nombre: 'Universidad de Guanajuato: Convocatoria Bachillerato General y Bivalente, primer semestre, agosto-diciembre 2026', url: 'https://www.ugto.mx/admisionug/images/convocatorias/agosto2026/convocatoria_bachillerato_primer_nivel_ago_dic_final_v3.pdf' },
  ugFicha: { nombre: 'Universidad de Guanajuato: Ficha técnica del Bachillerato General, ENMS León, agosto-diciembre 2026', url: 'https://www.ugto.mx/admisionug/images/nms/2026/fichas/Ficha_tecnica_PE_Bachillerato_General_ENMS_Le%C3%B3n_EXANI26.pdf' },
  ugBach: { nombre: 'Universidad de Guanajuato: Admisión a bachillerato', url: 'https://www.ugto.mx/admisionug/bachilleratos' },
  exani: { nombre: 'CENEVAL: Guía para el sustentante del nuevo EXANI-I', url: 'https://ceneval.edu.mx/wp-content/uploads/2021/09/1_Guia-EXANI-I_sm.pdf' },
};
const uniFuentes = claves => claves.flatMap(k => UNIVERSIDADES[k].fuentes);

// ---------- los simuladores ----------
export const SIMS = {
  'simulador-paa': {
    nombre: 'PAA', titulo: 'Simulador PAA', og: `${SITIO}/assets/tienda/v3/simulador-paa-og.jpg`,
    indice: {
      titulo: 'Guías de la PAA: qué viene, puntaje y preparación',
      descripcion: 'Guías para la PAA del College Board: qué viene en el examen, cómo se calcula el puntaje, cuánto pide cada universidad y un plan de 4 semanas.',
      h1: 'Guías para prepararte para la PAA',
      lead: 'Lo que necesitas saber de la Prueba de Aptitud Académica, con fuentes oficiales, y cómo practicar sin perder tiempo.',
    },
    aviso: 'No estamos afiliados al College Board ni a ninguna universidad; PAA es una prueba del College Board.',
  },
  'simulador-unam': {
    nombre: 'UNAM', titulo: 'Simulador UNAM', og: `${SITIO}/assets/tienda/v3/simulador-unam-og.jpg`,
    indice: {
      titulo: 'Guías del examen UNAM de licenciatura',
      descripcion: 'Guías para el examen de admisión a licenciatura de la UNAM: qué viene según tu área, cómo estudiar y de qué dependen los aciertos para entrar.',
      h1: 'Guías para el examen de la UNAM',
      lead: 'Cómo es el examen de licenciatura, cómo se asignan los lugares y un plan de estudio, con lo que publica la propia UNAM.',
    },
    aviso: 'No estamos afiliados a la UNAM.',
  },
  'simulador-ecoems': {
    nombre: 'ECOEMS', titulo: 'Simulador ECOEMS', og: `${SITIO}/assets/tienda/v3/simulador-ecoems-og.jpg`,
    indice: {
      titulo: 'Guías ECOEMS: examen, opciones y preparación',
      descripcion: 'Guías para el proceso «Mi derecho, mi lugar» (antes COMIPEMS): qué viene en el examen de la UNAM y el IPN, cómo elegir tus opciones y cómo prepararte.',
      h1: 'Guías para el examen ECOEMS',
      lead: 'Para quien va a entrar a la prepa en la zona metropolitana del Valle de México, y para su familia: el proceso, el examen y cómo elegir.',
    },
    aviso: 'No estamos afiliados a la UNAM, al IPN, al ECOEMS ni a la SEP.',
  },
  'simulador-prepa-ug': {
    nombre: 'prepa UG', titulo: 'Simulador prepa UG', og: `${SITIO}/assets/tienda/v3/simulador-prepa-ug-og.jpg`,
    indice: {
      titulo: 'Guías para entrar a la prepa de la UG',
      descripcion: 'Guías para el examen de admisión a la prepa de la Universidad de Guanajuato: qué viene en el EXANI-I, cómo se calcula tu resultado y cómo prepararte.',
      h1: 'Guías para la prepa de la UG',
      lead: 'El examen de admisión al bachillerato de la Universidad de Guanajuato, explicado con su convocatoria y su ficha técnica.',
    },
    aviso: 'No estamos afiliados a la Universidad de Guanajuato, a CENEVAL ni a la Secretaría de Educación de Guanajuato.',
  },
};

// ---------- piezas de contenido ----------
const p = t => `<p>${t}</p>`;
const ul = l => `<ul class="gu-lista">${l.map(x => `<li>${x}</li>`).join('')}</ul>`;
const ol = l => `<ol class="gu-pasos">${l.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>`;
const tabla = (cab, filas, nota = '') => `<div class="gu-tabla-w"><table class="gu-tabla"><thead><tr>${cab.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${filas.map(([a, ...r]) => `<tr><th scope="row">${a}</th>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${nota ? `<p class="gu-nota">${nota}</p>` : ''}`;
const nota = t => `<p class="gu-nota">${t}</p>`;
const caja = (t, d) => `<div class="gu-caja"><b>${t}</b>${d}</div>`;
// Ejemplo de pregunta: siempre propio y marcado como tal
const ejemplo = (enunciado, opciones, correcta, explicacion) => `<div class="gu-ej"><span class="gu-ej-t">Ejemplo propio de Vorka México (no es un reactivo del examen)</span>
<p class="gu-ej-p">${enunciado}</p><ol class="gu-ej-o">${opciones.map((o, i) => `<li><span>${'ABCD'[i]}</span>${o}</li>`).join('')}</ol>
<details><summary>Ver respuesta</summary><p><b>${'ABCD'[correcta]})</b> ${explicacion}</p></details></div>`;
const a = (href, t) => `<a href="${href}">${t}</a>`;
const ext = (href, t) => `<a href="${href}" rel="noopener">${t}</a>`;
const g = (sim, slug) => `/${sim}/guias/${slug}/`;

// ---------- las guías (las de mayor potencial primero en cada simulador) ----------
export const GUIAS = [
  // ===================== PAA =====================
  {
    sim: 'simulador-paa', slug: 'que-es-la-paa', busqueda: 'qué es la PAA y qué viene',
    titulo: 'Qué es la PAA y qué viene en el examen | Vorka México',
    descripcion: 'La PAA del College Board explicada: sus tres partes (Lectura y Redacción, Matemáticas e Inglés), cuántas preguntas trae, qué mide y cómo se califica.',
    h1: 'Qué es la PAA y qué viene en el examen',
    lead: 'La Prueba de Aptitud Académica es el examen de admisión que piden la UDEM, el Tec, la UdeG, el ITAM, el ITESO y otras universidades. Aquí está qué es, qué trae cada parte y cómo se califica, con lo que publica el College Board.',
    secciones: [
      { h2: 'Qué es la PAA', html: p('La PAA es una prueba del College Board de Puerto Rico y América Latina para estudiantes de habla hispana que planean seguir estudiando después de la prepa. Las universidades la usan para <b>admitir</b> y también para <b>ubicar</b> a sus alumnos de nuevo ingreso en el nivel que les corresponde.')
        + p('No la presentas «por tu cuenta»: la aplica la universidad a la que quieres entrar, en las fechas que ella fija. Según el College Board se aplica en papel y, en ciertas regiones, en línea; tu universidad te dice cuál te toca.') },
      { h2: 'Las tres partes de la PAA', html: p('El College Board divide la PAA en tres partes, cada una con sus subáreas:')
        + tabla(['Parte', 'Qué evalúa', 'Ejercicios (guía 2020)'], [
          ['Lectura y Redacción', 'Lectura de textos literarios y no literarios, vocabulario en contexto, análisis, interpretación e inferencias, y redacción (la coherencia y la cohesión de un texto).', '70'],
          ['Matemáticas', 'Aritmética, álgebra, geometría, y análisis de datos y probabilidad, con énfasis en problemas de situaciones comunes.', '55'],
          ['Inglés', 'Lengua y vocabulario, lectura y redacción indirecta.', '50'],
        ], 'Número de ejercicios: guía de preguntas y respuestas del College Board de 2020. Es la versión más reciente que publica esos datos; confirma con tu universidad si cambió.')
        + p('Los ejercicios son de selección múltiple con <b>cuatro opciones</b>, y algunos de Matemáticas te piden escribir tú la respuesta. La misma guía dice que todos los de Matemáticas se pueden resolver sin calculadora y que no se usa calculadora en esa parte (salvo acomodo razonable).') },
      { h2: 'Cómo se califica', html: p('Cada parte se califica en una escala de <b>200 a 800 puntos</b>. Además, cada subárea tiene una subpuntuación de 10 a 40 que sirve para ver tus fortalezas, pero no se suma para dar un total. Tu reporte también trae el <b>percentil</b>: el porcentaje de personas que sacaron lo mismo o menos que tú.')
        + p(`Cada universidad decide cómo usa ese resultado: unas suman las partes y piden un mínimo, otras lo combinan con tu promedio. Lo explicamos a detalle en ${a(g('simulador-paa', 'puntaje-paa'), 'cómo se calcula el puntaje de la PAA')}.`) },
      { h2: '¿Cuánto dura?', html: p('No te damos minutos por sección a propósito: la única guía del College Board que los publica es de 2020 y los tiempos pueden haber cambiado. La universidad donde la presentes te dice la duración y el horario; pregúntalo al registrarte y practica con cronómetro para acostumbrarte a trabajar a ritmo.') },
      { h2: 'Qué hacer con esta información', html: ol([
        ['Confirma qué partes cuentan para tu universidad', 'Según el College Board, la mayoría de las universidades toma en cuenta Lectura y Redacción y Matemáticas; algunas usan Inglés para diagnóstico o ubicación.'],
        ['Mide tu punto de partida', 'Antes de estudiar temas sueltos, haz un diagnóstico para saber qué parte te resta más puntos.'],
        ['Practica el formato, no solo los temas', 'Cuatro opciones, textos largos y matemáticas sin calculadora: la velocidad se entrena.'],
      ]) },
    ],
    faq: [
      { p: '¿Qué es la PAA?', r: 'Es la Prueba de Aptitud Académica del College Board de Puerto Rico y América Latina. Las universidades la usan para admitir y ubicar a estudiantes de habla hispana que van a seguir estudiando después de la prepa.' },
      { p: '¿Qué partes tiene la PAA?', r: 'Tres: Lectura y Redacción, Matemáticas e Inglés. Según la guía del College Board de 2020, traen 70, 55 y 50 ejercicios de selección múltiple con cuatro opciones.' },
      { p: '¿Se puede usar calculadora en la PAA?', r: 'Según la guía del College Board de 2020, no: todos los ejercicios de Matemáticas se pueden resolver sin calculadora, y solo la usan quienes tienen un acomodo razonable que lo requiera.' },
      { p: '¿Cuánto dura la PAA?', r: 'Confírmalo con la universidad donde la vas a presentar. La única guía del College Board con tiempos es de 2020 y pueden haber cambiado, por eso no damos minutos.' },
    ],
    fuentes: [F.cbPaa, F.cb2020],
    relacionadas: [g('simulador-paa', 'puntaje-paa'), g('simulador-paa', 'como-prepararte-para-la-paa'), g('simulador-paa', 'paa-vs-examen-unam')],
  },
  {
    sim: 'simulador-paa', slug: 'puntaje-paa', busqueda: 'cómo se calcula el puntaje de la PAA / puntaje PAA para entrar a <universidad>',
    titulo: 'Puntaje de la PAA: cómo se calcula y cuánto piden | Vorka',
    descripcion: 'La escala de 200 a 800, qué es el percentil y cuánto piden la UDEM, el Tec, la UdeG, el ITAM y el ITESO en la PAA, con la fuente de cada una.',
    h1: 'Puntaje de la PAA: cómo se calcula y cuánto pide cada universidad',
    lead: 'Un «1,200 en la PAA» no significa lo mismo en todas las universidades. Aquí está cómo califica el College Board y cómo usa ese puntaje cada universidad que revisamos.',
    secciones: [
      { h2: 'La escala: de 200 a 800 por parte', html: p('El College Board califica cada parte de la PAA (Lectura y Redacción, Matemáticas e Inglés) en una escala de <b>200 a 800</b>. El promedio teórico de la escala es <b>500</b>. Mucha gente suma las partes para hablar de un solo número, pero el College Board recomienda leer cada puntuación por separado.')
        + p('Tu reporte trae además:')
        + ul(['<b>El percentil</b> de cada parte: el porcentaje de quienes presentaron que sacaron lo mismo o menos que tú. Según el College Board, es la mejor forma de saber si tu puntaje es bueno.',
          '<b>Subpuntuaciones de 10 a 40</b> por subárea (por ejemplo, Álgebra o Vocabulario en contexto). Sirven para ver qué reforzar; no se suman para dar un total.']) },
      { h2: 'Cuánto pide cada universidad', html: p('Cada universidad decide cómo usa tu puntaje. Esto dicen sus documentos oficiales (revisados en octubre de 2026):')
        + tabla(['Universidad', 'Cómo usa la PAA', 'Detalle'], [
          [a('/simulador-paa/udem/', 'UDEM'), 'Mínimo de 1,200 en total, 550 en razonamiento verbal y 550 en matemático, y promedio de 80.', 'Enfermería: 1,100, 500, 500 y promedio de 70.'],
          [a('/simulador-paa/tec-de-monterrey/', 'Tec de Monterrey'), 'No publica un mínimo: un Comité de Admisión evalúa todo tu expediente.', 'Solo cuenta la PAA aplicada por un campus del Tec.'],
          [a('/simulador-paa/udeg/', 'UdeG'), 'La PAA pesa 50 % y tu promedio de bachillerato 50 %, ambos en escala de 0 a 100.', 'El puntaje para entrar cambia por carrera, centro y ciclo.'],
          [a('/simulador-paa/itam/', 'ITAM'), 'Aplica la PAA en línea (ePAA); su página no publica un mínimo.', 'Se presenta una vez por periodo.'],
          [a('/simulador-paa/iteso/', 'ITESO'), 'Valida tu PAA de otra universidad si no tiene más de año y medio.', 'La Beca Descubre STEM pide más de 1,250 puntos.'],
        ], 'Cada fila liga a nuestra página de esa universidad, con el documento oficial y el numeral o artículo de cada regla.') },
      { h2: '¿Puedo repetirla y cuál puntaje cuenta?', html: p('El College Board dice que no hay un límite de veces para repetir la PAA y que la mayoría de las universidades usa tu puntaje más alto. Pero cada universidad pone sus propias reglas: si la presentas en la UDEM, puedes hacerlo dos veces en el mismo periodo; el Tec hasta tres veces con tiempos de espera, y el ITAM una vez por periodo. Antes de presentarla, revisa la regla de la tuya.') },
      { h2: 'Cómo ponerte una meta realista', html: p('Esto ya es consejo nuestro:') + ol([
        ['Busca el requisito de tu universidad', 'Si hay mínimo por parte (como en la UDEM), tu meta es por parte, no solo el total.'],
        ['Mide dónde estás hoy', 'Un diagnóstico te da un puntaje estimado por parte y la distancia a tu meta.'],
        ['Sube primero la parte más baja', 'Suele ser donde más puntos ganas por hora de estudio, y es la que te puede dejar fuera de un mínimo.'],
        ['Deja margen', 'Un puntaje estimado no es una garantía: apunta un poco arriba de tu meta.'],
      ]) },
    ],
    faq: [
      { p: '¿Cuál es el puntaje máximo de la PAA?', r: 'Cada parte se califica de 200 a 800 puntos, así que el máximo por parte es 800. El promedio teórico de la escala es 500.' },
      { p: '¿Qué es un buen puntaje en la PAA?', r: 'Depende de tu universidad y de tu carrera. Según el College Board, la mejor referencia es tu percentil: el porcentaje de personas que sacaron lo mismo o menos que tú. Para entrar, lo que manda es el requisito de la universidad.' },
      { p: '¿Cuánto necesito en la PAA para la UDEM?', r: 'Según su lineamiento de admisión, al menos 1,200 en total, 550 en razonamiento verbal, 550 en matemático y promedio de 80. En Enfermería: 1,100, 500, 500 y promedio de 70.' },
      { p: '¿Se suman las subpuntuaciones de la PAA?', r: 'No. Las subpuntuaciones van de 10 a 40 y sirven para ver fortalezas y áreas a reforzar; el College Board aclara que no se suman para dar una puntuación total.' },
    ],
    fuentes: [F.cb2020, ...uniFuentes(['udem', 'tec-de-monterrey', 'udeg', 'itam', 'iteso'])],
    relacionadas: [g('simulador-paa', 'que-es-la-paa'), g('simulador-paa', 'como-prepararte-para-la-paa'), '/simulador-paa/udem/', '/simulador-paa/udeg/'],
  },
  {
    sim: 'simulador-paa', slug: 'como-prepararte-para-la-paa', busqueda: 'cómo prepararte para la PAA en 4 semanas',
    titulo: 'Cómo prepararte para la PAA en 4 semanas | Vorka México',
    descripcion: 'Un plan de 4 semanas para la PAA: diagnóstico, Lectura y Redacción, Matemáticas sin calculadora, Inglés y simulacro final, con ejemplos propios.',
    h1: 'Cómo prepararte para la PAA en 4 semanas',
    lead: 'Si tu examen es en un mes, no necesitas estudiar todo: necesitas saber qué te resta más puntos y practicar el formato. Este es el plan que recomendamos.',
    secciones: [
      { h2: 'Antes de empezar', html: p('La PAA mide lectura, redacción y matemáticas (más Inglés), no la memoria de un temario. Por eso cuatro semanas bien usadas sirven: no vas a aprender todo de cero, pero sí puedes subir tu velocidad, cerrar huecos y llegar sin sorpresas.')
        + caja('Lo que necesitas', ul(['Menos de una hora al día, cinco días a la semana (es nuestra sugerencia, ajústala a tu tiempo).', 'Un lugar sin celular a la mano.', 'Lápiz y hojas: en Matemáticas no hay calculadora, según la guía del College Board.'])) },
      { h2: 'Semana 1: mide y entiende el formato', html: ol([
        ['Haz un diagnóstico', `Contesta un examen corto para ver tu puntaje estimado por parte. En Vorka hay ${a('/simulador-paa/diagnostico/', 'un diagnóstico gratis')}.`],
        ['Haz una lista de tus 3 temas más débiles', 'No «Matemáticas» en general: «porcentajes», «conectores», «inferencias».'],
        ['Lee cómo es cada parte', `Repasa ${a(g('simulador-paa', 'que-es-la-paa'), 'qué viene en la PAA')} para que nada del formato te tome por sorpresa.`],
      ]) },
      { h2: 'Semana 2: Lectura y Redacción', html: p('Practica textos literarios y no literarios. Al contestar, ubica en el texto la frase que justifica tu respuesta: la PAA pide inferencias, no opiniones.')
        + ejemplo('Elige el conector que mejor completa la oración: «El equipo entrenó todo el mes; ______, perdió la final por un gol».', ['por lo tanto', 'sin embargo', 'además', 'es decir'], 1, 'La segunda idea contradice lo que esperarías de la primera (entrenar mucho y aun así perder), así que necesitas un conector de contraste: «sin embargo».') },
      { h2: 'Semana 3: Matemáticas sin calculadora', html: p('Repasa aritmética, álgebra, geometría y análisis de datos, y entrena el cálculo mental: fracciones, porcentajes y despejes rápidos.')
        + ejemplo('Una sudadera cuesta $480 y tiene 15 % de descuento. ¿Cuánto pagas?', ['$408', '$420', '$465', '$72'], 0, 'El 10 % de 480 es 48 y el 5 % es la mitad, 24: el descuento es 48 + 24 = 72. Pagas 480 − 72 = $408. Ojo con la D: 72 es el descuento, no el precio final.') },
      { h2: 'Semana 4: Inglés y simulacro completo', html: ol([
        ['Repasa Inglés', 'Vocabulario, lectura y redacción indirecta. Pregunta si tu universidad usa esta parte para admisión o para ubicarte.'],
        ['Haz un examen completo con cronómetro', 'Una sola sentada, sin pistas, para medir tu resistencia y tu ritmo.'],
        ['Repasa solo tus errores', 'Los dos últimos días no son para temas nuevos: revisa lo que fallaste y descansa.'],
      ]) },
      { h2: 'El día del examen', html: ul(['Lleva lo que pida tu universidad (identificación, pase, lápiz) y llega con tiempo.', 'Si una pregunta te atora, márcala y sigue; regresa al final.', 'Lee todas las opciones antes de elegir: dos suelen parecer correctas.']) },
    ],
    faq: [
      { p: '¿Alcanzan 4 semanas para prepararse para la PAA?', r: 'Para subir tu puntaje, sí, si las usas bien: un diagnóstico para saber qué te falta, práctica enfocada en tus temas débiles y un examen completo al final. Es un consejo nuestro; mientras más tiempo tengas, mejor.' },
      { p: '¿Qué estudio primero para la PAA?', r: 'La parte donde sacas menos en tu diagnóstico, sobre todo si tu universidad pide un mínimo por parte. Ahí suele estar la mayor ganancia por hora de estudio.' },
      { p: '¿Hay práctica gratis del College Board?', r: 'Sí. En su página de la PAA, el College Board ofrece una prueba de práctica que se puede descargar y una plataforma digital de práctica sin costo.' },
    ],
    fuentes: [F.cbPaa, F.cb2020],
    relacionadas: [g('simulador-paa', 'que-es-la-paa'), g('simulador-paa', 'puntaje-paa'), g('simulador-paa', 'paa-vs-examen-unam')],
  },
  {
    sim: 'simulador-paa', slug: 'paa-vs-examen-unam', busqueda: 'PAA vs examen UNAM',
    titulo: 'PAA vs examen UNAM: diferencias y cómo prepararte | Vorka',
    descripcion: 'PAA del College Board contra el examen de licenciatura de la UNAM: quién lo hace, cuántas preguntas trae, cómo se califica y qué estudiar para cada uno.',
    h1: 'PAA vs examen de la UNAM: en qué se parecen y en qué no',
    lead: 'Si vas a presentar los dos, o no sabes cuál te toca, esta comparación te ayuda a organizar tu estudio. Cada dato lleva su fuente.',
    secciones: [
      { h2: 'La comparación rápida', html: tabla(['', 'PAA', 'Examen UNAM (licenciatura)'], [
        ['Quién lo hace', 'El College Board; lo aplica cada universidad que la pide.', 'La propia UNAM, solo para entrar a la UNAM.'],
        ['Qué evalúa', 'Lectura y Redacción, Matemáticas e Inglés.', 'Las asignaturas de cada área de conocimiento; el peso cambia según el área de tu carrera.'],
        ['Preguntas', '70, 55 y 50 ejercicios por parte (guía del College Board de 2020).', '120 preguntas (concurso 2026).'],
        ['Tiempo', 'Te lo confirma tu universidad.', 'Máximo tres horas efectivas (concurso 2026).'],
        ['Opciones de respuesta', 'Cuatro; algunas de Matemáticas piden escribir la respuesta.', 'Cuatro, con una correcta (informe técnico de 2026, según Excélsior).'],
        ['Calificación', 'De 200 a 800 por parte, con percentil.', 'Número de aciertos.'],
        ['Calculadora', 'No en Matemáticas (guía de 2020).', 'No: está entre el material no permitido (instructivo 2026).'],
        ['¿Sirve en otra universidad?', 'Depende: la UDEM y el ITESO aceptan la de otra institución; el Tec solo la que aplicó el Tec.', 'No: es solo para la UNAM.'],
      ]) },
      { h2: 'La diferencia que más cambia tu forma de estudiar', html: p('La PAA mide <b>habilidades</b>: entender textos, redactar con coherencia y resolver problemas. El examen de la UNAM mide <b>conocimientos</b> de las asignaturas de tu área. Por eso para la PAA conviene practicar mucho el formato y la velocidad, y para la UNAM, repasar temario materia por materia.')
        + p(`Si vas a presentar los dos, lo que más se comparte es comprensión de lectura y matemáticas. Empieza por ahí y luego separa: Inglés para la PAA, y las demás materias de tu área para la UNAM (ve ${a(g('simulador-unam', 'examen-unam-por-area'), 'qué viene en el examen UNAM por área')}).`) },
      { h2: 'Cómo repartir tu tiempo si presentas los dos', html: p('Esto es consejo nuestro:') + ol([
        ['Haz un diagnóstico de cada uno', `Uno de ${a('/simulador-paa/diagnostico/', 'la PAA')} y uno de ${a('/simulador-unam/diagnostico/', 'la UNAM')}: así sabes cuál te pide más trabajo.`],
        ['Ordena por fecha', 'El examen más cercano manda. La PAA la fija tu universidad; la UNAM publica su calendario en la convocatoria.'],
        ['Cierra cada uno con un examen completo', 'Con cronómetro y sin pistas, una o dos semanas antes de cada fecha.'],
      ]) },
    ],
    faq: [
      { p: '¿La UNAM acepta la PAA?', r: 'No para su concurso de selección a licenciatura: la UNAM aplica su propio examen de 120 preguntas y asigna los lugares por aciertos.' },
      { p: '¿Cuál es más difícil, la PAA o el examen de la UNAM?', r: 'Miden cosas distintas: la PAA, habilidades de lectura, redacción y matemáticas; la UNAM, conocimientos de las asignaturas de tu área. Lo difícil depende de tu preparación en cada cosa; un diagnóstico de cada uno te lo dice.' },
      { p: '¿Puedo usar calculadora en alguno de los dos?', r: 'En ninguno. La guía de la PAA del College Board de 2020 dice que en Matemáticas no se usa calculadora, y el instructivo de la UNAM 2026 la incluye entre el material no permitido.' },
    ],
    fuentes: [F.cb2020, F.cbPaa, F.unamInstr, F.excelsiorInforme, ...uniFuentes(['udem', 'tec-de-monterrey', 'iteso'])],
    relacionadas: [g('simulador-paa', 'que-es-la-paa'), g('simulador-unam', 'examen-unam-por-area'), g('simulador-unam', 'como-estudiar-para-el-examen-unam')],
  },

  // ===================== UNAM =====================
  {
    sim: 'simulador-unam', slug: 'examen-unam-por-area', busqueda: 'qué viene en el examen UNAM por área',
    titulo: 'Qué viene en el examen UNAM según tu área | Vorka México',
    descripcion: 'El examen de licenciatura de la UNAM: 120 preguntas en máximo 3 horas, las 4 áreas de conocimiento y cómo saber qué estudiar según tu carrera.',
    h1: 'Qué viene en el examen de la UNAM según tu área',
    lead: 'Todas las personas presentan 120 preguntas, pero no las mismas: el peso de cada asignatura depende del área de tu carrera. Esto es lo que publica la UNAM y lo que no.',
    secciones: [
      { h2: 'Cómo es el examen (concurso 2026)', html: ul([
        '<b>120 preguntas</b> en un máximo de <b>tres horas efectivas</b>, según el instructivo de la DGAE.',
        'En 2026 se presentó <b>en línea</b>, con un navegador seguro, cámara y micrófono. Solo se permitían dos hojas blancas, lápiz, goma y sacapuntas; calculadoras, celulares y acordeones, no.',
        'Según el informe técnico de la UNAM citado por Excélsior, las preguntas son de opción múltiple con <b>cuatro opciones</b> y una correcta, repartidas entre las asignaturas de cada área.',
      ]) + caja('Ojo: 2026 tuvo examen de control', p(`Después de detectar irregularidades en el examen en línea, la UNAM aplicó en agosto de 2026 un examen de control presencial a parte de los aspirantes. Lo explicamos en ${a(g('simulador-unam', 'cuantos-aciertos-para-entrar-a-la-unam'), 'cuántos aciertos necesitas')}. Revisa en la próxima convocatoria cómo será la aplicación.`)) },
      { h2: 'Las cuatro áreas', html: p('La UNAM organiza sus licenciaturas en cuatro áreas de conocimiento. Tu área la define la carrera que registras:')
        + tabla(['Área', 'Ejemplos de carreras'], [
          ['1 · Ciencias Físico-Matemáticas y de las Ingenierías', 'Ingenierías, Matemáticas, Física, Ciencias de la Computación.'],
          ['2 · Ciencias Biológicas, Químicas y de la Salud', 'Médico Cirujano, Enfermería, Química, Biología.'],
          ['3 · Ciencias Sociales', 'Derecho, Economía, Contaduría, Administración.'],
          ['4 · Humanidades y de las Artes', 'Pedagogía, Historia, Artes Visuales, Música.'],
        ], `Consulta la lista completa de cada área en ${ext('https://oferta.unam.mx/', 'oferta.unam.mx')}.`) },
      { h2: 'Cuántas preguntas hay de cada materia', html: p('<b>La UNAM no publica el número de preguntas por asignatura.</b> El informe técnico citado por Excélsior dice que ese reparto está en tablas de especificaciones internas, y que las tablas renovadas se usarán en un proceso que se espera concluir en 2027.')
        + p('Lo que sí tienes: con tu pago por derecho a examen, la UNAM te da la <b>Guía para preparar el examen de selección</b>, con los temas. Úsala como tu temario principal.')
        + p(`En el ${a('/simulador-unam/', 'simulador de Vorka')} usamos una distribución de referencia por área, en la que coinciden las guías de preparación. Es una referencia para practicar, no el reparto de la UNAM.`) },
      { h2: 'Qué hacer con esto', html: ol([
        ['Confirma tu área', 'Revisa en qué área está tu carrera en la oferta de la UNAM.'],
        ['Descarga tu guía en cuanto pagues', 'Es tu temario. En 2026 se podía descargar del 26 de enero al 22 de mayo.'],
        ['Practica con el peso de tu área', 'Las asignaturas con más peso en tu área merecen más horas.'],
      ]) },
    ],
    faq: [
      { p: '¿Cuántas preguntas tiene el examen de la UNAM?', r: 'En el concurso de licenciatura 2026, 120 preguntas para resolver en un máximo de tres horas efectivas, según el instructivo de la DGAE.' },
      { p: '¿Cuáles son las cuatro áreas de la UNAM?', r: 'Área 1, Ciencias Físico-Matemáticas y de las Ingenierías; Área 2, Ciencias Biológicas, Químicas y de la Salud; Área 3, Ciencias Sociales; y Área 4, Humanidades y de las Artes.' },
      { p: '¿Cuántas preguntas vienen de cada materia?', r: 'La UNAM no lo publica. El temario está en la guía que te da con tu pago; los repartos que circulan en internet, incluido el del simulador de Vorka, son referencias para practicar.' },
      { p: '¿Se puede usar calculadora en el examen de la UNAM?', r: 'No. El instructivo 2026 incluye las calculadoras entre el material no permitido; solo se permitían dos hojas blancas, lápiz, goma y sacapuntas.' },
    ],
    fuentes: [F.unamInstr, F.unamOferta, F.excelsiorInforme, F.unamComision],
    relacionadas: [g('simulador-unam', 'como-estudiar-para-el-examen-unam'), g('simulador-unam', 'cuantos-aciertos-para-entrar-a-la-unam'), g('simulador-paa', 'paa-vs-examen-unam')],
  },
  {
    sim: 'simulador-unam', slug: 'cuantos-aciertos-para-entrar-a-la-unam', busqueda: 'cuántos aciertos necesito para entrar a la UNAM',
    titulo: '¿Cuántos aciertos necesito para entrar a la UNAM? | Vorka',
    descripcion: 'No hay un número fijo de aciertos para entrar a la UNAM: depende de tu carrera, plantel y año. Cómo se asignan los lugares y qué pasó en 2026.',
    h1: '¿Cuántos aciertos necesitas para entrar a la UNAM?',
    lead: 'La respuesta corta: no hay un número fijo. Depende de la carrera, el plantel y el año. Aquí está cómo se decide, con lo que dice la UNAM, y cómo ponerte una meta.',
    secciones: [
      { h2: 'Cómo se asignan los lugares', html: ul([
        'Te registras para <b>una sola</b> combinación de carrera, plantel y sistema o modalidad. Tienes que obtener los aciertos necesarios para ser seleccionado en esa combinación.',
        'Si tus aciertos no alcanzan para la que registraste, <b>no te asignan a otra</b> carrera ni a otro plantel.',
        'La convocatoria publica cuántos lugares ofrece cada licenciatura. Como el cupo es fijo, los aciertos que alcanzan dependen de cuántas personas compiten y de cuántos aciertos sacan.',
        'Además, para inscribirte necesitas haber terminado el bachillerato con promedio mínimo de 7.0, y algunas carreras tienen requisitos adicionales.',
      ]) + nota('Fuente: instructivo del Concurso de Selección 2026 de la DGAE.') },
      { h2: 'Lo que pasó en 2026', html: p('En 2026 el examen se aplicó en línea por primera vez y la UNAM detectó resultados fuera de lo normal. Según su Comisión Técnica:')
        + ul(['Entre 2021 y 2025, el <b>3.5 %</b> de los aspirantes obtuvo 100 aciertos o más; en 2026, el <b>16.3 %</b>.', 'Con 110 o más, la proporción pasó de alrededor de <b>0.9 %</b> a <b>5.5 %</b>.'])
        + p('Por eso la UNAM aplicó un examen de control presencial a quienes recibieron aviso de selección y a quienes alcanzaron, en su programa, plantel y modalidad, <b>el menor número de aciertos requerido entre 2021 y 2026</b>, alrededor de 58,000 aspirantes. Para eso publicó el mínimo de esos años por programa. Busca esa referencia de tu carrera en la DGAE.')
        + caja('Qué significa para ti', p('Los aciertos de 2026 en línea no son buena referencia para tu meta: estuvieron inflados. Usa la de años anteriores o la que publique la UNAM para tu carrera y plantel.')) },
      { h2: 'Cómo ponerte una meta de aciertos', html: p('Esto es consejo nuestro:') + ol([
        ['Busca la referencia de tu carrera y plantel', 'La de varios años, no solo uno. El mismo programa puede pedir muy distinto en dos planteles.'],
        ['Súmale margen', 'El mínimo de un año fue el último que entró, no el que entró tranquilo.'],
        ['Mide cuánto te falta', `Haz ${a('/simulador-unam/diagnostico/', 'un diagnóstico')} y compara tus aciertos estimados con tu meta.`],
        ['Elige con estrategia', 'Si tu carrera es de muy alta demanda en un plantel, revisa si se imparte en otro o en otra modalidad.'],
      ]) },
    ],
    faq: [
      { p: '¿Cuál es el mínimo de aciertos para entrar a la UNAM?', r: 'No hay un mínimo fijo. La UNAM asigna los lugares de cada carrera y plantel según los aciertos y el cupo, así que el número que alcanza cambia cada año y en cada combinación de carrera y plantel.' },
      { p: '¿Si no me alcanza para mi carrera, me dan otra?', r: 'No. Según el instructivo 2026, solo concursas por la carrera, plantel y sistema o modalidad que registraste; si tus aciertos no alcanzan, no te asignan a otra.' },
      { p: '¿Qué fue el examen de control de la UNAM en 2026?', r: 'Un examen presencial que la UNAM aplicó en agosto de 2026 a quienes recibieron aviso de selección y a quienes alcanzaron el menor número de aciertos requerido entre 2021 y 2026 en su programa, después de detectar una proporción inusual de puntajes altos en el examen en línea.' },
    ],
    fuentes: [F.unamInstr, F.unamComision, F.forbesControl],
    relacionadas: [g('simulador-unam', 'examen-unam-por-area'), g('simulador-unam', 'como-estudiar-para-el-examen-unam')],
  },
  {
    sim: 'simulador-unam', slug: 'como-estudiar-para-el-examen-unam', busqueda: 'cómo estudiar para el examen de la UNAM',
    titulo: 'Cómo estudiar para el examen de la UNAM | Vorka México',
    descripcion: 'Un plan para estudiar para el examen de licenciatura de la UNAM: tu área, la guía oficial, cuánto repasar de cada materia y cómo medir tu avance.',
    h1: 'Cómo estudiar para el examen de la UNAM',
    lead: 'Son 120 preguntas de muchas asignaturas: si estudias todo por igual, no te alcanza el tiempo. Este es un plan para repartir tu esfuerzo según tu área.',
    secciones: [
      { h2: 'Primero, lo que no es negociable', html: ul([
        `<b>Tu área.</b> Define qué asignaturas pesan más. Si no la tienes clara, revisa ${a(g('simulador-unam', 'examen-unam-por-area'), 'qué viene en el examen por área')}.`,
        '<b>La guía de la UNAM.</b> Viene incluida en tu pago por derecho a examen y es tu temario.',
        '<b>Las fechas.</b> En 2026 el registro fue del 23 de enero al 3 de febrero y el examen del 23 de mayo al 10 de junio. Revisa la convocatoria de tu año en dgae.unam.mx.',
      ]) },
      { h2: 'Un plan de 8 semanas', html: p('Esto es consejo nuestro; ajústalo a tu tiempo:') + ol([
        ['Semana 1: diagnóstico', `Haz un examen de tu área para saber cuántos aciertos llevas y en qué asignaturas. En Vorka, ${a('/simulador-unam/diagnostico/', 'el diagnóstico es gratis')}.`],
        ['Semanas 2 a 5: asignaturas de más peso', 'Empieza por las que más pesan en tu área y en las que sacaste menos. En la distribución de referencia del simulador, Matemáticas y Español son las de más reactivos en las cuatro áreas. Un tema por día, con ejercicios.'],
        ['Semana 6: el resto del temario', 'Repaso rápido de las asignaturas de menos peso: un acierto vale lo mismo en cualquiera.'],
        ['Semana 7: examen completo', '120 preguntas en tres horas, de una sentada. Revisa cada error y su regla.'],
        ['Semana 8: solo tus errores', 'Repasa lo que fallaste, duerme bien y prepara tu equipo si el examen es en línea.'],
      ]) },
      { h2: 'Cómo estudiar cada asignatura', html: p('Guíate por las asignaturas y los temas que trae tu guía de la UNAM. Algunas ideas:') + ul([
        '<b>Matemáticas y Física:</b> haz ejercicios, no solo leas la teoría. Sin calculadora, como en el examen.',
        '<b>Español y Literatura:</b> practica comprensión de lectura con textos variados y repasa reglas de ortografía y puntuación.',
        '<b>Historia, Geografía, Biología y Química:</b> líneas del tiempo, mapas y esquemas; luego, preguntas para comprobar que lo recuerdas.',
        '<b>Errores:</b> lleva una lista. Un error repetido es el tema que más aciertos te puede dar.',
      ]) },
      { h2: 'Si el examen es en línea', html: p('En 2026 el examen fue en línea con un navegador seguro, cámara y micrófono, y la UNAM habilitó una prueba práctica y un simulador de la plataforma antes del examen. No te los saltes: según el instructivo, si descargas el navegador o haces las pruebas ya iniciado el examen, o entras tarde, el tiempo no se repone. Revisa cómo será la aplicación en la convocatoria de tu año.') },
    ],
    faq: [
      { p: '¿Con cuánto tiempo debo empezar a estudiar para la UNAM?', r: 'Mientras antes, mejor. Como consejo nuestro, dos meses de estudio constante alcanzan para repasar el temario con orden y hacer al menos un examen completo antes de la fecha.' },
      { p: '¿Dónde consigo la guía de la UNAM?', r: 'Viene incluida en el pago por derecho a examen. En 2026 se descargaba en la pestaña «Guía para preparar el examen» de TU SITIO, del 26 de enero al 22 de mayo.' },
      { p: '¿Qué materias estudio primero?', r: 'Las que más pesan en tu área y en las que sacaste menos en tu diagnóstico. Así cada hora de estudio rinde más aciertos.' },
    ],
    fuentes: [F.unamInstr, F.unamOferta],
    relacionadas: [g('simulador-unam', 'examen-unam-por-area'), g('simulador-unam', 'cuantos-aciertos-para-entrar-a-la-unam'), g('simulador-paa', 'paa-vs-examen-unam')],
  },

  // ===================== ECOEMS =====================
  {
    sim: 'simulador-ecoems', slug: 'que-viene-en-el-examen-ecoems', busqueda: 'qué viene en el examen COMIPEMS / ECOEMS',
    titulo: 'Qué viene en el examen ECOEMS (antes COMIPEMS) | Vorka',
    descripcion: 'Qué es el ECOEMS y «Mi derecho, mi lugar», quién presenta examen (solo UNAM e IPN), qué evalúa y qué requisito de promedio piden en 2026.',
    h1: 'Qué viene en el examen ECOEMS (antes COMIPEMS)',
    lead: 'Desde que el proceso se llama «Mi derecho, mi lugar», muchas familias tienen dudas: ¿todavía hay examen?, ¿quién lo presenta?, ¿qué viene? Aquí está lo que dice la convocatoria 2026.',
    secciones: [
      { h2: 'ECOEMS, COMIPEMS y «Mi derecho, mi lugar»', html: p('El <b>ECOEMS</b> (Espacio de Coordinación de la Educación Media Superior) es el grupo de instituciones que convoca el proceso para entrar a la prepa en la zona metropolitana del Valle de México: las 16 alcaldías de la Ciudad de México y 22 municipios del Estado de México. El proceso se llama <b>«Mi derecho, mi lugar»</b>. Mucha gente lo sigue llamando COMIPEMS, como se conocía antes.') },
      { h2: '¿Quién presenta examen?', html: p('Según la convocatoria 2026, <b>solo la UNAM y el IPN</b> asignan sus lugares con examen de admisión, y en 2026 fue en línea. Las demás instituciones (COLBACH, CONALEP, DGB, DGETAyCM, DGETI, IEMS, SECTI y el plantel Texcoco de la UAEMéx) dan acceso directo, sin examen.')
        + p(`Si eliges opciones de la UNAM (prepas y CCH) o del IPN (CECyT y CET), presentas el examen. Cómo combinar opciones con y sin examen lo explicamos en ${a(g('simulador-ecoems', 'como-elegir-tus-opciones-ecoems'), 'cómo elegir tus opciones')}.`) },
      { h2: 'Qué evalúa', html: p('El instructivo 2026 dice que, para asignar sus lugares, la UNAM y el IPN toman como base <b>los conocimientos básicos y las habilidades generales</b>, y que cada institución diseña, aplica y califica su examen.')
        + p('La convocatoria y el instructivo <b>no publican</b> el número de preguntas ni la duración: esos detalles se dan a quienes concluyen su registro para examen (en 2026, del 18 al 22 de mayo, en miderechomilugar.gob.mx).')
        + p(`En el ${a('/simulador-ecoems/', 'simulador de Vorka')} practicas con un examen de referencia de 128 reactivos en 3 horas, con habilidad verbal, habilidad matemática y ocho materias de secundaria. Es una referencia para entrenar, no el formato garantizado del examen.`) },
      { h2: 'Requisitos para que te asignen', html: ul([
        'Presentar el examen y tener <b>promedio mínimo de 7.0</b> en secundaria (base 8.3 de la convocatoria).',
        'La asignación toma en cuenta tus <b>aciertos</b>, el <b>orden de tus preferencias</b> y los <b>lugares disponibles</b> en cada opción.',
        'Contar con tu certificado de secundaria y cumplir los requisitos de cada institución para inscribirte.',
      ]) + nota('En 2026 los resultados se publicaron el 18 de agosto en la Gaceta Electrónica de Resultados. Del proceso 2027 todavía no hay convocatoria: revisa miderechomilugar.gob.mx.') },
    ],
    faq: [
      { p: '¿Todavía existe el examen COMIPEMS?', r: 'El proceso ahora se llama «Mi derecho, mi lugar» y lo convoca el ECOEMS. Según la convocatoria 2026, solo la UNAM y el IPN aplican examen; las demás instituciones dan acceso directo sin examen.' },
      { p: '¿Cuántas preguntas tiene el examen de la UNAM y el IPN para prepa?', r: 'La convocatoria y el instructivo 2026 no lo publican; esos detalles se informan a quienes se registran para el examen. Revisa la información de tu año en miderechomilugar.gob.mx.' },
      { p: '¿Qué promedio piden para la UNAM y el IPN?', r: 'Un promedio mínimo de 7.0 en secundaria, según la convocatoria 2026.' },
    ],
    fuentes: [F.mdmlConv, F.mdmlInstr, F.mdmlCatalogo],
    relacionadas: [g('simulador-ecoems', 'como-elegir-tus-opciones-ecoems'), g('simulador-ecoems', 'como-prepararte-para-el-examen-ecoems')],
  },
  {
    sim: 'simulador-ecoems', slug: 'como-elegir-tus-opciones-ecoems', busqueda: 'cómo elegir tus opciones COMIPEMS / ECOEMS',
    titulo: 'Cómo elegir tus opciones en Mi derecho, mi lugar | Vorka',
    descripcion: 'Las tres modalidades del proceso de prepa en el Valle de México, cuántas opciones puedes registrar y cómo ordenarlas para no quedarte sin lugar.',
    h1: 'Cómo elegir tus opciones de prepa (ECOEMS)',
    lead: 'El orden de tu lista importa tanto como tus aciertos: se usa para asignarte. Aquí están las reglas de la convocatoria 2026 y cómo armar una lista con cabeza.',
    secciones: [
      { h2: 'Las tres modalidades', html: tabla(['Modalidad', 'Qué eliges', 'Cuántas opciones'], [
        ['1 · Sin examen', 'Solo instituciones de acceso directo.', 'Entre 5 y 10.'],
        ['2 · Con examen', 'Solo opciones de la UNAM y el IPN.', 'Hasta 5 del IPN y hasta 5 de la UNAM.'],
        ['3 · Combinada', 'Dos listas: una sin examen y otra con examen.', 'Hasta 20: máximo 10 sin examen y 10 con examen.'],
      ], 'Fuente: convocatoria 2026 de «Mi derecho, mi lugar». En 2026 se ofrecieron 1,073 opciones educativas en 545 planteles.') },
      { h2: 'Qué pasa si no te alcanza', html: ul([
        '<b>Modalidad 3:</b> si no quedas en tus opciones de la UNAM o el IPN, te asignan en alguna de tus opciones sin examen.',
        '<b>Modalidad 2:</b> si no quedas, puedes registrarte en el periodo extemporáneo y elegir una opción sin examen que todavía tenga lugares.',
        'Las opciones con examen se asignan por aciertos, orden de preferencia y lugares disponibles. Las de acceso directo, por tu orden de preferencia y los lugares de cada opción.',
      ]) + caja('Por eso', p('La modalidad 3 es la que te deja con una red de seguridad que tú elegiste. Es nuestra recomendación si vas a presentar examen.'))
      },
      { h2: 'Cómo ordenar tu lista', html: p('Esto es consejo nuestro:') + ol([
        ['Pon primero la que más quieres', 'Aunque sea difícil. El orden es tu preferencia real, no una apuesta.'],
        ['Mezcla niveles de demanda', 'Después de tus favoritas, incluye opciones con examen donde tus aciertos estimados tengan más margen.'],
        ['Piensa en el trayecto', 'Revisa la dirección de cada plantel en el catálogo y calcula cuánto tardarías en llegar diario.'],
        ['Revisa los requisitos de cada institución', 'Están en el documento «Requisitos e información de las instituciones».'],
        ['Decide en familia', 'La convocatoria pide ordenar las opciones según la preferencia de la persona aspirante, su mamá, papá o persona tutora.'],
      ]) + p(`Para saber dónde están tus aciertos hoy, haz ${a('/simulador-ecoems/diagnostico/', 'el diagnóstico gratis')}.`) },
    ],
    faq: [
      { p: '¿Cuántas opciones puedo elegir en «Mi derecho, mi lugar»?', r: 'Según la convocatoria 2026: entre 5 y 10 sin examen, hasta 5 del IPN y hasta 5 de la UNAM. En la modalidad combinada, hasta 20 en total.' },
      { p: '¿Importa el orden de mis opciones?', r: 'Sí. La convocatoria dice que el orden de preferencia se toma como criterio de asignación, junto con los aciertos y los lugares disponibles en las opciones con examen.' },
      { p: '¿Qué pasa si no quedo en la UNAM ni en el IPN?', r: 'Si elegiste la modalidad 3, te asignan en alguna de tus opciones sin examen. Si elegiste la 2, puedes registrarte en el periodo extemporáneo en una opción sin examen con lugares disponibles.' },
    ],
    fuentes: [F.mdmlConv, F.mdmlInstr, F.mdmlBuscador],
    relacionadas: [g('simulador-ecoems', 'que-viene-en-el-examen-ecoems'), g('simulador-ecoems', 'como-prepararte-para-el-examen-ecoems')],
  },
  {
    sim: 'simulador-ecoems', slug: 'como-prepararte-para-el-examen-ecoems', busqueda: 'cómo prepararte para el examen COMIPEMS / ECOEMS',
    titulo: 'Cómo prepararte para el examen ECOEMS | Vorka México',
    descripcion: 'Un plan para preparar el examen de la UNAM y el IPN para prepa: diagnóstico, repaso de secundaria, habilidades y examen completo. Con consejos para papás.',
    h1: 'Cómo prepararte para el examen ECOEMS',
    lead: 'El examen para la prepa de la UNAM y el IPN evalúa lo que viste en secundaria y tus habilidades. Este plan es para quien va a presentarlo y para la familia que lo acompaña.',
    secciones: [
      { h2: 'Qué tienes que saber primero', html: ul([
        `Solo presentas examen si eliges opciones de la UNAM o el IPN (${a(g('simulador-ecoems', 'que-viene-en-el-examen-ecoems'), 'qué viene en el examen')}).`,
        'Según el instructivo 2026, evalúa <b>conocimientos básicos y habilidades generales</b>.',
        'Necesitas promedio mínimo de 7.0 en secundaria para que te asignen en la UNAM o el IPN.',
      ]) },
      { h2: 'Un plan de 10 semanas', html: p('Esto es consejo nuestro; empieza con el tiempo que tengas:') + ol([
        ['Semana 1: diagnóstico', `Un examen corto para ver en qué materias vas bien y en cuáles no. ${a('/simulador-ecoems/diagnostico/', 'El de Vorka es gratis')}.`],
        ['Semanas 2 a 4: habilidades', 'Comprensión de lectura y razonamiento matemático: sucesiones, proporciones y problemas. Se entrenan con práctica diaria corta.'],
        ['Semanas 5 a 8: materias de secundaria', 'Repasa lo que viste en secundaria, empezando por lo que salió más bajo en tu diagnóstico. En el simulador de Vorka practicas Español, Matemáticas, Biología, Física, Química, Historia, Geografía y Formación cívica y ética.'],
        ['Semana 9: examen completo', 'Con cronómetro y de una sentada. Revisa cada error.'],
        ['Semana 10: repaso y descanso', 'Solo tus errores. Si el examen es en línea, prueba antes tu equipo y tu conexión.'],
      ]) },
      { h2: 'Para mamá, papá o quien acompaña', html: ul([
        '<b>Ayuden a armar la lista de opciones juntos.</b> El orden se usa para asignar el lugar.',
        '<b>Un horario fijo vale más que muchas horas.</b> 40 minutos diarios rinden más que una tarde entera el sábado.',
        '<b>Pregunten qué falló, no cuánto sacó.</b> El error repetido es lo que más puntos da al corregirlo.',
        '<b>Revisen las fechas en la fuente.</b> Solo miderechomilugar.gob.mx publica el calendario y los resultados oficiales.',
      ]) },
    ],
    faq: [
      { p: '¿Cuándo empezar a estudiar para el examen ECOEMS?', r: 'Como consejo nuestro, unos dos o tres meses antes alcanzan para repasar con orden y hacer al menos un examen completo. Lo importante es estudiar un poco cada día.' },
      { p: '¿Qué estudio para el examen de la UNAM y el IPN?', r: 'Según el instructivo 2026, el examen evalúa conocimientos básicos y habilidades generales. Repasa lo que viste en secundaria y practica comprensión de lectura y razonamiento matemático.' },
    ],
    fuentes: [F.mdmlConv, F.mdmlInstr],
    relacionadas: [g('simulador-ecoems', 'que-viene-en-el-examen-ecoems'), g('simulador-ecoems', 'como-elegir-tus-opciones-ecoems')],
  },

  // ===================== PREPA UG =====================
  {
    sim: 'simulador-prepa-ug', slug: 'examen-admision-prepa-ug', busqueda: 'examen de admisión prepa UG: qué viene y cómo prepararte',
    titulo: 'Examen de admisión prepa UG: qué viene y cómo prepararte',
    descripcion: 'El examen para la prepa de la Universidad de Guanajuato: EXANI-I de 160 preguntas en 4 horas y media, cuánto vale cada área y cómo prepararte.',
    h1: 'Examen de admisión a la prepa de la UG: qué viene y cómo prepararte',
    lead: 'Para entrar al Bachillerato General o Bivalente de la Universidad de Guanajuato presentas el EXANI-I de CENEVAL. Aquí está cómo fue en el proceso de agosto-diciembre 2026, con la convocatoria y la ficha técnica.',
    secciones: [
      { h2: 'Cómo te seleccionan', html: p('Según la convocatoria de agosto-diciembre 2026, tu resultado se arma con tres elementos:')
        + tabla(['Elemento', 'Peso'], [
          ['EXANI-I de CENEVAL', '70 %'],
          ['Examen diagnóstico para el ingreso a Media Superior (lo coordina la Secretaría de Educación de Guanajuato)', '20 %'],
          ['Promedio de 1.º y 2.º de secundaria', '10 %'],
        ]) + p('El EXANI-I es la parte que más pesa, y la que más puedes mover estudiando ahora.') },
      { h2: 'Qué viene en el EXANI-I', html: p('La ficha técnica del Bachillerato General de la Escuela de Nivel Medio Superior de León da estas áreas, reactivos y pesos:')
        + tabla(['Área', 'Reactivos', 'Peso UG'], [
          ['Comprensión lectora', '30', '20 %'], ['Redacción indirecta', '30', '20 %'], ['Pensamiento matemático', '40', '27 %'],
          ['Pensamiento científico', '30', '26 %'], ['Inglés', '30', '7 %'], ['<b>Total</b>', '<b>160</b>', '<b>100 %</b>'],
        ], 'Revisa la ficha técnica de la escuela que te interesa: cada programa publica la suya.')
        + ul(['<b>160 preguntas</b> de opción múltiple, cada una con <b>tres opciones</b> (guía de CENEVAL).', 'Duración máxima de <b>4 horas y media</b>; en 2026 fue <b>presencial</b>, en la escuela correspondiente.', 'Sin calculadora ni material de apoyo, según la guía de CENEVAL.', 'CENEVAL trata Inglés como información diagnóstica, fuera de su puntaje global; la ficha de la UG sí le da 7 %.']) },
      { h2: 'Fechas: lo que sabemos', html: p('En el proceso de agosto-diciembre 2026: registro del 2 de febrero al 11 de abril, examen diagnóstico de la SEG el 20 de marzo, EXANI-I el 22 de mayo y resultados desde el 19 de junio. La cédula de admisión costó $1,645.')
        + p(`Al 31 de octubre de 2026, la UG solo tiene abiertos los procesos para entrar a 2.º y 4.º semestre; <b>la convocatoria de primer semestre 2027 todavía no se publica</b>. Revísala en ${ext('https://www.ugto.mx/admisionug/bachilleratos', 'ugto.mx/admisionug')}.`) },
      { h2: 'Cómo prepararte', html: p('Esto es consejo nuestro:') + ol([
        ['Mide dónde estás', `Un diagnóstico por área te dice dónde se van los aciertos. ${a('/simulador-prepa-ug/diagnostico/', 'El de Vorka es gratis')}.`],
        ['Prioriza por peso', 'Pensamiento matemático (27 %) y científico (26 %) valen más de la mitad del examen en la ficha de León.'],
        ['Lectura y redacción, diario', 'Un texto corto y unas preguntas al día. Valen 40 % juntas y mejoran con constancia.'],
        ['Entrena la resistencia', 'Cuatro horas y media es mucho para alguien de secundaria. Haz al menos un examen completo con cronómetro.'],
        ['No olvides el promedio', 'El promedio de 1.º y 2.º ya está decidido; enfócate en lo que todavía puedes mover.'],
      ]) },
    ],
    faq: [
      { p: '¿Qué examen piden para entrar a la prepa de la UG?', r: 'El EXANI-I de CENEVAL, que en el proceso de agosto-diciembre 2026 valió 70 %. Además cuentan el examen diagnóstico de la Secretaría de Educación de Guanajuato (20 %) y el promedio de 1.º y 2.º de secundaria (10 %).' },
      { p: '¿Cuántas preguntas tiene el EXANI-I de la UG?', r: '160 preguntas de opción múltiple con tres opciones cada una, en un máximo de 4 horas y media, según la ficha técnica de la UG y la guía de CENEVAL.' },
      { p: '¿Cuándo sale la convocatoria 2027 de la prepa UG?', r: 'Al 31 de octubre de 2026 no se ha publicado. En el proceso anterior se publicó en enero y el registro fue del 2 de febrero al 11 de abril de 2026; revisa ugto.mx/admisionug.' },
    ],
    fuentes: [F.ugConv, F.ugFicha, F.exani, F.ugBach],
    relacionadas: [],
  },
];

// ---------- consultas ----------
export const guiasDe = sim => GUIAS.filter(x => x.sim === sim);
export const guia = (sim, slug) => GUIAS.find(x => x.sim === sim && x.slug === slug) || null;
export const rutaGuia = x => g(x.sim, x.slug);
export const rutaIndice = sim => `/${sim}/guias/`;
// Todas las URL para el sitemap: índices y guías
export const urlsGuias = () => [...Object.keys(SIMS).filter(s => guiasDe(s).length).map(rutaIndice), ...GUIAS.map(rutaGuia)];
const porRuta = ruta => GUIAS.find(x => rutaGuia(x) === ruta);
const nombreDe = ruta => porRuta(ruta)?.h1 || (UNIVERSIDADES[ruta.split('/')[2]] && `PAA para ${UNIVERSIDADES[ruta.split('/')[2]].nombre}`) || ruta;

// ---------- estilos (mismo lenguaje visual que las páginas de venta y de universidad) ----------
const CSS = `<style>
.gu-hero{padding:clamp(12px,3vw,40px) 0 clamp(24px,3vw,40px)}
.gu-hero h1{margin-top:14px;max-width:820px}.gu-hero .t-lead{margin-top:14px;max-width:720px}
.gu-meta{margin-top:14px;font-size:14px;color:var(--fg-2)}
.gu-botones{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.gu-cuerpo{display:grid;gap:32px 56px;align-items:start}
@media(min-width:980px){.gu-cuerpo{grid-template-columns:minmax(0,1fr) 300px}.gu-lado{position:sticky;top:110px}}
.gu-art{max-width:760px;font-size:17px;line-height:1.65}
.gu-art h2{font-size:clamp(22px,2.6vw,28px);letter-spacing:-.02em;line-height:1.25;margin:40px 0 12px;scroll-margin-top:100px}.gu-art h2:first-child{margin-top:0}
.gu-art p{margin:0 0 14px;color:var(--fg)}.gu-art a{color:var(--morado);text-decoration:underline;text-underline-offset:2px}
.gu-lista{list-style:disc;padding-left:22px;margin:0 0 14px;display:grid;gap:8px}
.gu-pasos{list-style:none;padding:0;margin:0 0 14px;display:grid;gap:10px;counter-reset:p}
.gu-pasos li{display:grid;grid-template-columns:40px 1fr;gap:4px 12px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px}
.gu-pasos li::before{counter-increment:p;content:counter(p);grid-row:span 2;width:32px;height:32px;border-radius:10px;background:var(--morado-suave);color:var(--morado);display:grid;place-items:center;font-weight:800;font-size:15px}
.gu-pasos b{font-size:16.5px}.gu-pasos span{color:var(--fg-2);font-size:15.5px;line-height:1.55}
.gu-tabla-w{overflow-x:auto;margin:6px 0 14px}
.gu-tabla{width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra)}
.gu-tabla th,.gu-tabla td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
.gu-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650}.gu-tabla tbody th{font-weight:650}
@media(max-width:640px){.gu-tabla{font-size:14px}.gu-tabla th,.gu-tabla td{padding:10px}}
.gu-nota{font-size:14px!important;color:var(--fg-2)!important}
.gu-caja{margin:6px 0 16px;padding:18px 20px;border-radius:var(--r);background:var(--morado-suave);border:1px solid color-mix(in srgb,var(--morado) 20%,transparent)}
.gu-caja > b{display:block;margin-bottom:6px;color:var(--fg)}.gu-caja p:last-child,.gu-caja ul:last-child{margin-bottom:0}
.gu-ej{margin:8px 0 18px;padding:18px 20px;border-radius:var(--r);border:1.5px dashed var(--line-2);background:var(--card)}
.gu-ej-t{display:inline-block;font-size:12.5px;font-weight:700;color:var(--morado);background:var(--morado-suave);padding:3px 10px;border-radius:999px}
.gu-ej-p{margin:12px 0 10px!important;font-weight:600}
.gu-ej-o{list-style:none;padding:0;margin:0 0 10px;display:grid;gap:6px}.gu-ej-o li{display:flex;gap:10px;align-items:center;font-size:16px}
.gu-ej-o span{width:26px;height:26px;border-radius:8px;background:var(--bg-2);display:grid;place-items:center;font-size:13px;font-weight:750;flex:none}
.gu-ej summary{cursor:pointer;font-weight:650;color:var(--morado)}.gu-ej details p{margin:8px 0 0}
.gu-toc{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px}
.gu-toc b{font-size:14px;color:var(--fg-2)}.gu-toc ol{list-style:decimal;padding-left:20px;margin:8px 0 0;display:grid;gap:6px;font-size:15px}.gu-toc a{color:inherit}
.gu-cta{margin-top:14px;padding:20px;border-radius:var(--r);background:var(--card);border:1.5px solid var(--line-2);box-shadow:var(--sombra-2)}
.gu-cta b{display:block;font-size:17px;letter-spacing:-.015em}.gu-cta p{font-size:14.5px;color:var(--fg-2);margin:6px 0 14px}
.gu-cta .btn{width:100%;justify-content:center;margin-top:8px}
.gu-fuentes{list-style:decimal;padding-left:22px;display:grid;gap:6px;font-size:15px}.gu-fuentes a{color:var(--morado);word-break:break-word}
.gu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:14px;margin-top:22px}
.gu-card{display:block;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px;box-shadow:var(--sombra);color:inherit;text-decoration:none;transition:border-color var(--t-rapido)}
.gu-card:hover{border-color:var(--line-2)}.gu-card h3{font-size:17.5px;letter-spacing:-.02em;margin-bottom:6px}.gu-card p{color:var(--fg-2);font-size:15px}
.gu-card em{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-style:normal;font-weight:700;font-size:14.5px;color:var(--morado)}.gu-card em svg{width:15px;height:15px}
</style>`;

const ld = x => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`;
const ORG = { '@type': 'Organization', name: 'Vorka México', url: `${SITIO}/`, logo: { '@type': 'ImageObject', url: `${SITIO}/vorka-logo.png` } };
const textoPlano = h => h.replace(/<[^>]+>/g, '');
const tarjeta = (href, t, d, cta = 'Leer la guía') => `<a class="gu-card" href="${href}"><h3>${esc(t)}</h3><p>${esc(d)}</p><em>${cta} ${FLECHA}</em></a>`;
const ctaSim = (sim, s) => `<aside class="gu-cta" aria-label="Practica con el simulador"><b>Practica con el ${esc(s.titulo)}</b><p>Reactivos originales, tutor que te da pistas cuando fallas y un reporte de qué reforzar.</p>
  <a class="btn tinta" href="/${sim}/#probar">Probar un reactivo gratis</a><a class="btn blanco" href="/${sim}/diagnostico/">Diagnóstico gratis</a><a class="btn blanco" href="/${sim}/">Ver el simulador</a></aside>`;

// Página de una guía, o null si no existe
export function paginaGuia(sim, slug) {
  const x = guia(sim, slug), s = SIMS[sim];
  if (!x || !s) return null;
  const ruta = rutaGuia(x), ids = x.secciones.map((_, i) => `s${i + 1}`);
  const datos = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: x.h1, description: x.descripcion, inLanguage: 'es-MX', image: [s.og],
      datePublished: x.publicado || ACTUALIZADO, dateModified: x.actualizado || ACTUALIZADO, author: ORG, publisher: ORG,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITIO}${ruta}` }, citation: x.fuentes.map(f => f.url) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: s.titulo, item: `${SITIO}/${sim}/` },
      { '@type': 'ListItem', position: 2, name: `Guías ${s.nombre}`, item: `${SITIO}${rutaIndice(sim)}` },
      { '@type': 'ListItem', position: 3, name: x.h1, item: `${SITIO}${ruta}` }] },
    ...(x.faq?.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: x.faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) }] : []),
  ];
  // Relacionadas: las que la guía pide y, si faltan, las demás del mismo simulador
  const rel = [...new Set([...x.relacionadas, ...guiasDe(sim).map(rutaGuia)])].filter(r => r !== ruta).slice(0, 3);
  return pagina({ titulo: x.titulo, ruta, descripcion: x.descripcion, imagen: s.og, ogTipo: 'article',
    head: ld(datos) + CSS,
    cuerpo: `
<section class="gu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="/${sim}/">${esc(s.titulo)}</a> / <a href="${rutaIndice(sim)}">Guías</a></nav>
  <h1 class="t-h1">${esc(x.h1)}</h1>
  <p class="t-lead">${esc(x.lead)}</p>
  <p class="gu-meta">Por Vorka México · Actualizado: <time datetime="${x.actualizado || ACTUALIZADO}">${ACTUALIZADO_TXT}</time> · Con fuentes oficiales al final</p>
</div></section>

<section class="t-sec" style="padding-top:0"><div class="marco gu-cuerpo">
  <article class="gu-art">
    ${x.secciones.map((y, i) => `<h2 id="${ids[i]}">${esc(y.h2)}</h2>\n${y.html}`).join('\n')}
    ${x.faq?.length ? `<h2 id="preguntas">Preguntas frecuentes</h2><div class="t-faq">${x.faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>` : ''}
    <h2 id="fuentes">Fuentes</h2>
    <ol class="gu-fuentes">${x.fuentes.map(f => `<li>${ext(esc(f.url), esc(f.nombre))}</li>`).join('')}</ol>
    <p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; los requisitos y las fechas cambian cada año, así que confírmalos siempre en la convocatoria vigente.</p>
  </article>
  <div class="gu-lado">
    <nav class="gu-toc" aria-label="En esta guía"><b>En esta guía</b><ol>${x.secciones.map((y, i) => `<li><a href="#${ids[i]}">${esc(y.h2)}</a></li>`).join('')}${x.faq?.length ? '<li><a href="#preguntas">Preguntas frecuentes</a></li>' : ''}<li><a href="#fuentes">Fuentes</a></li></ol></nav>
    ${ctaSim(sim, s)}
  </div>
</div></section>
${rel.length ? `<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">Sigue leyendo</span><h2 class="h2" style="margin-top:14px">Guías relacionadas</h2></div>
  <div class="gu-grid">${rel.map(r => { const y = porRuta(r); return y ? tarjeta(r, y.h1, y.descripcion) : tarjeta(r, nombreDe(r), 'Requisitos de la PAA con la fuente oficial de la universidad.', 'Ver requisitos'); }).join('')}</div>
</div></section>` : ''}
<section class="t-sec"><div class="marco"><p class="t-nota">Guía informativa de Vorka México. El ${esc(s.titulo)} es un simulador de práctica con reactivos originales; los puntajes y aciertos que da son estimaciones para orientar el estudio. ${esc(s.aviso)}</p></div></section>`,
  });
}

// Índice de las guías de un simulador, o null
export function paginaIndiceGuias(sim) {
  const s = SIMS[sim], lista = guiasDe(sim);
  if (!s || !lista.length) return null;
  const ruta = rutaIndice(sim);
  const datos = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: s.indice.h1, description: s.indice.descripcion, inLanguage: 'es-MX', url: `${SITIO}${ruta}`, publisher: ORG,
      mainEntity: { '@type': 'ItemList', itemListElement: lista.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}${rutaGuia(x)}`, name: x.h1 })) } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: s.titulo, item: `${SITIO}/${sim}/` },
      { '@type': 'ListItem', position: 2, name: `Guías ${s.nombre}`, item: `${SITIO}${ruta}` }] },
  ];
  const otros = Object.keys(SIMS).filter(k => k !== sim && guiasDe(k).length);
  return pagina({ titulo: `${s.indice.titulo} | Vorka México`.length <= 60 ? `${s.indice.titulo} | Vorka México` : `${s.indice.titulo} | Vorka`, ruta, descripcion: s.indice.descripcion, imagen: s.og,
    head: ld(datos) + CSS,
    cuerpo: `
<section class="gu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="/${sim}/">${esc(s.titulo)}</a> / Guías</nav>
  <h1 class="t-h1">${esc(s.indice.h1)}</h1>
  <p class="t-lead">${esc(s.indice.lead)}</p>
  <div class="gu-botones"><a class="btn tinta" href="/${sim}/">Ver el ${esc(s.titulo)} ${FLECHA}</a><a class="btn blanco" href="/${sim}/diagnostico/">Diagnóstico gratis</a></div>
</div></section>
<section class="t-sec suave"><div class="marco">
  <div class="gu-grid" style="margin-top:0">${lista.map(x => tarjeta(rutaGuia(x), x.h1, x.descripcion)).join('')}</div>
  ${sim === 'simulador-paa' ? `<div class="cab" style="margin-top:40px"><h2 class="h2">La PAA en cada universidad</h2></div>
  <div class="gu-grid">${Object.entries(UNIVERSIDADES).map(([k, u]) => tarjeta(`/simulador-paa/${k}/`, `PAA ${u.nombre}`, u.completo, 'Ver requisitos')).join('')}</div>` : ''}
</div></section>
<section class="t-sec"><div class="marco">
  <div class="cab"><h2 class="h2">Guías de otros exámenes</h2></div>
  <div class="gu-grid">${otros.map(k => tarjeta(rutaIndice(k), SIMS[k].indice.h1, SIMS[k].indice.descripcion, 'Ver guías')).join('')}</div>
  <p class="t-nota" style="margin-top:28px">Guías informativas de Vorka México, con las fuentes oficiales al final de cada una. ${esc(s.aviso)}</p>
</div></section>`,
  });
}

// Sección «Guías para prepararte» de la página de venta de cada simulador ('' si no tiene guías)
export function seccionGuias(sim) {
  const lista = guiasDe(sim);
  if (!lista.length) return '';
  return `${CSS}<section class="t-sec" id="guias"><div class="marco">
  <div class="cab par"><div><span class="etiqueta">Gratis</span><h2 class="h2" style="margin-top:14px">Guías para prepararte</h2></div>
  <p class="lead">Qué viene en el examen, cómo se califica y cómo estudiar, con las fuentes oficiales. <a href="${rutaIndice(sim)}">Ver todas las guías</a></p></div>
  <div class="gu-grid">${lista.map(x => tarjeta(rutaGuia(x), x.h1, x.descripcion)).join('')}</div>
</div></section>`;
}

// /<simulador>/guias/ y /<simulador>/guias/<guía>/ (sin barra final: 301 a la de con barra)
export function rutasGuias(req, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const m = url.pathname.match(/^\/(simulador-[a-z-]+)\/guias(?:\/([a-z0-9-]{2,80}))?(\/?)$/);
  if (!m || !SIMS[m[1]]) return null;
  const r = m[2] ? paginaGuia(m[1], m[2]) : paginaIndiceGuias(m[1]);
  if (!r) return null;
  return m[3] ? r : Response.redirect(`${url.origin}/${m[1]}/guias/${m[2] ? m[2] + '/' : ''}`, 301);
}

// Para las pruebas: el texto de una guía sin etiquetas
export const textoDeGuia = x => [x.lead, ...x.secciones.map(y => textoPlano(y.html)), ...(x.faq || []).map(f => f.r)].join(' ');
