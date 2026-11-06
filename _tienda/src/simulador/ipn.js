// Simulador IPN (vorka.mx/simulador-ipn): examen de admisión a licenciatura (nivel superior) del Instituto Politécnico
// Nacional. Para el bachillerato del IPN (CECyT y CET) el examen es el del ECOEMS: ese es el Simulador ECOEMS.
// Datos de la convocatoria (Base Sexta, ago 2026-ene 2027 y feb-jul 2027): 140 reactivos de opción múltiple en tres horas
// efectivas; tres áreas (Ingeniería y Ciencias Físico Matemáticas, Ciencias Médico Biológicas, Ciencias Sociales y
// Administrativas); los lugares se asignan por número total de aciertos, de mayor a menor, hasta agotar el cupo de cada
// carrera. El IPN NO publica cuántos reactivos hay de cada materia: usamos la distribución de referencia que difunden las
// guías de preparación (cada área suma 140) y la página lo dice así.
// Banco: los reactivos 100 % originales de Vorka que ya usan el Simulador UNAM (Matemáticas, Física, Química, Biología,
// Historia y Español) y el Simulador PAA (Lectura, Redacción, Matemáticas e Inglés), acomodados en las 8 materias del IPN.
// Planes: Práctica, Examen (2 exámenes completos) y Completo (los dos). Adicionales: 1 Medio o 1 examen más.
import { crearSimulador } from './motor.js';
import { paginaVentaSimulador } from './venta.js';
import { armarPorMaterias } from './armar-por-area.js';
import * as PAA_BANCO from './banco.js';
import { TEMAS_MATEMATICAS, REACTIVOS_MATEMATICAS } from './unam/matematicas.js';
import { TEMAS_FISICA, REACTIVOS_FISICA } from './unam/fisica.js';
import { TEMAS_QUIMICA, REACTIVOS_QUIMICA } from './unam/quimica.js';
import { TEMAS_BIOLOGIA, REACTIVOS_BIOLOGIA } from './unam/biologia.js';
import { TEMAS_HISTORIA_UNIVERSAL, REACTIVOS_HISTORIA_UNIVERSAL } from './unam/historia_universal.js';
import { TEMAS_HISTORIA_MEXICO, REACTIVOS_HISTORIA_MEXICO } from './unam/historia_mexico.js';
import { TEMAS_ESPANOL, TEXTOS_ESPANOL, REACTIVOS_ESPANOL } from './unam/espanol.js';

// ---------- banco: cada reactivo y cada tema a su materia del IPN ----------
// Sección de origen → materia del IPN. Del Español de la UNAM, lo que es de lecturas va a Competencia lectora y lo demás
// (gramática, ortografía, puntuación, redacción, vocabulario) a Competencia escrita.
const DE_PAA = { lectura: 'lectora', redaccion: 'escrita', matematicas: 'matematicas', ingles: 'ingles' };
const ESPANOL_LECTORA = ['comprension_lectura', 'tipos_funciones_texto'];
// Mismo id de tema en dos bancos con distinta materia: el del Español de la UNAM se renombra
const RENOMBRA = { vocabulario: 'vocabulario_espanol' };
const deEspanol = t => (ESPANOL_LECTORA.includes(t) ? 'lectora' : 'escrita');
const temaEsp = t => RENOMBRA[t] || t;

const TEMAS = {}, TEXTOS = {}, REACTIVOS = [];
const sumarTemas = (temas, materia, renombra = x => x) => { for (const [k, v] of Object.entries(temas)) TEMAS[renombra(k)] = { ...v, seccion: materia(k) }; };
const sumarTextos = (textos, materia) => { for (const [k, v] of Object.entries(textos)) TEXTOS[k] = { ...v, seccion: materia(v) }; };
const sumar = (rs, materia, renombra = x => x) => { for (const r of rs) REACTIVOS.push({ ...r, seccion: materia(r), tema: renombra(r.tema) }); };

sumarTemas(TEMAS_MATEMATICAS, () => 'matematicas'); sumar(REACTIVOS_MATEMATICAS, () => 'matematicas');
sumarTemas(TEMAS_FISICA, () => 'fisica'); sumar(REACTIVOS_FISICA, () => 'fisica');
sumarTemas(TEMAS_QUIMICA, () => 'quimica'); sumar(REACTIVOS_QUIMICA, () => 'quimica');
sumarTemas(TEMAS_BIOLOGIA, () => 'biologia'); sumar(REACTIVOS_BIOLOGIA, () => 'biologia');
sumarTemas(TEMAS_HISTORIA_MEXICO, () => 'historia'); sumar(REACTIVOS_HISTORIA_MEXICO, () => 'historia');
sumarTemas(TEMAS_HISTORIA_UNIVERSAL, () => 'historia'); sumar(REACTIVOS_HISTORIA_UNIVERSAL, () => 'historia');
sumarTemas(TEMAS_ESPANOL, deEspanol, temaEsp); sumarTextos(TEXTOS_ESPANOL, () => 'lectora'); sumar(REACTIVOS_ESPANOL, r => deEspanol(r.tema), temaEsp);
// PAA: sus temas de matemáticas que ya existen en la UNAM (álgebra) se quedan con el nombre y consejo de la UNAM
for (const [k, v] of Object.entries(PAA_BANCO.TEMAS)) if (DE_PAA[v.seccion] && !TEMAS[k]) TEMAS[k] = { ...v, seccion: DE_PAA[v.seccion] };
sumarTextos(Object.fromEntries(Object.entries(PAA_BANCO.TEXTOS).filter(([, v]) => DE_PAA[v.seccion])), v => DE_PAA[v.seccion]);
sumar(PAA_BANCO.REACTIVOS.filter(r => DE_PAA[r.seccion]), r => DE_PAA[r.seccion]);

// ---------- materias, áreas y examen ----------
// [id, nombre, color, qué evalúa, fracción en lecturas]
const MATERIA = [
  ['matematicas', 'Matemáticas', 'verde', 'Aritmética, álgebra, geometría, trigonometría, geometría analítica, cálculo, probabilidad y estadística.', 0],
  ['escrita', 'Competencia escrita', 'tinta', 'Gramática, ortografía, puntuación, concordancia, conectores y la mejor forma de escribir una idea.', 0],
  ['lectora', 'Competencia lectora', 'morado', 'Idea central, inferencias, vocabulario en contexto, evidencia en el texto, propósito y tono.', 1],
  ['quimica', 'Química', 'oro', 'Materia, átomo, tabla periódica, enlaces, nomenclatura, estequiometría, disoluciones y química orgánica.', 0],
  ['fisica', 'Física', 'tinta', 'Cinemática, dinámica, energía, fluidos, termodinámica, ondas, electricidad, magnetismo y óptica.', 0],
  ['biologia', 'Biología', 'verde', 'Biomoléculas, célula, metabolismo, genética, evolución, biodiversidad, ecología y cuerpo humano.', 0],
  ['historia', 'Historia', 'morado', 'Historia de México y universal: de la época prehispánica y la Antigüedad al mundo contemporáneo.', 0],
  ['ingles', 'Inglés', 'oro', 'Vocabulario, gramática (tiempos y condicionales), estructura de la oración y comprensión de lectura.', 0.5],
];
// Reactivos por materia en cada área (examen de 140). Distribución de referencia de las guías de preparación: el IPN no la publica.
const DISTRIBUCION = {
  icfm: { matematicas: 37, escrita: 20, lectora: 20, quimica: 17, fisica: 17, biologia: 9, historia: 10, ingles: 10 },
  cmb: { matematicas: 33, escrita: 20, lectora: 20, quimica: 17, fisica: 13, biologia: 17, historia: 10, ingles: 10 },
  csa: { matematicas: 35, escrita: 25, lectora: 20, quimica: 10, fisica: 10, biologia: 10, historia: 20, ingles: 10 },
};
const NOMBRE_AREA = {
  icfm: 'Ingeniería y Ciencias Físico Matemáticas',
  cmb: 'Ciencias Médico Biológicas',
  csa: 'Ciencias Sociales y Administrativas',
};
const CORTO_AREA = { icfm: 'Ingeniería y Físico Matemáticas', cmb: 'Médico Biológicas', csa: 'Sociales y Administrativas' };
const EXAMEN_REACTIVOS = 140, EXAMEN_MINUTOS = 180;
const MIN_POR_REACTIVO = EXAMEN_MINUTOS / EXAMEN_REACTIVOS;
// Práctica libre por materia: 10 reactivos al ritmo del examen
const SECCIONES = MATERIA.map(([id, nombre, color, descripcion, lecturas]) => ({ id, nombre, color, descripcion, lecturas, reactivos: 10, minutos: Math.round(10 * MIN_POR_REACTIVO) }));
const LECTURAS = Object.fromEntries(MATERIA.map(m => [m[0], m[4]]));
// Medio = la mitad de cada materia (mismo ritmo); Calentamiento = la cuarta parte, de dificultad básica e intermedia
const specs = (area, f = 1) => MATERIA.map(([id]) => id).filter(id => DISTRIBUCION[area][id])
  .map(id => ({ id, lecturas: LECTURAS[id], reactivos: Math.max(f === 1 ? 1 : 2, Math.round(DISTRIBUCION[area][id] * f)) }));
const total = l => l.reduce((t, x) => t + x.reactivos, 0);
const AREAS = Object.keys(DISTRIBUCION).map(a => {
  const ex = specs(a), co = specs(a, 0.5), ca = specs(a, 0.25);
  return { id: a, nombre: NOMBRE_AREA[a], corto: CORTO_AREA[a], materias: ex,
    examen: { reactivos: total(ex), minutos: Math.round(total(ex) * MIN_POR_REACTIVO) },
    medio: { reactivos: total(co), minutos: Math.round(total(co) * MIN_POR_REACTIVO) },
    calentamiento: { reactivos: total(ca), minutos: Math.round(total(ca) * MIN_POR_REACTIVO) } };
});
const BANCO = { REACTIVOS, TEXTOS };
const area = a => (DISTRIBUCION[a] ? a : 'icfm');

export const APP = 'simulador-ipn';
export const PLANES = { practica: 'simulador-ipn-practica', completo: 'simulador-ipn-completo', paquete: 'simulador-ipn-paquete' };

export const IPN = crearSimulador({
  app: APP, ruta: '/simulador-ipn', cookie: 'vk_ipn', firma: APP, nombre: 'IPN', titulo: 'Simulador IPN',
  planes: PLANES, slugIntento: 'simulador-ipn-intento', slugExamen: 'simulador-ipn-examen',
  incluidos: { calentamiento: 0, corto: 0, examen: 0 },
  escala: { tipo: 'aciertos', total: EXAMEN_REACTIVOS },
  banco: { SECCIONES, SECCIONES_CALENTAMIENTO: SECCIONES, TEMAS, TEXTOS, REACTIVOS, AREAS },
  armar: {
    corto: (azar, vistos, a) => armarPorMaterias(BANCO, specs(area(a), 0.5), azar, vistos, 'medio'),
    examen: (azar, vistos, a) => armarPorMaterias(BANCO, specs(area(a)), azar, vistos, 'oficial'),
    calentamiento: (azar, vistos, a) => armarPorMaterias(BANCO, specs(area(a), 0.25), azar, vistos, 'calentamiento'),
    minutos: (tipo, materia, n) => Math.round(n * MIN_POR_REACTIVO),
  },
  cliente: { examen: 'IPN', escala: 'aciertos', examenReactivos: EXAMEN_REACTIVOS, examenHoras: 3, meta: { inicial: 95, min: 50, max: 140, paso: 1 },
    oficial: 'el IPN', regalo: '/tienda/simulador-ipn-paquete/?regalo=1#comprar',
    metaNota: 'El IPN asigna los lugares por número total de aciertos, de mayor a menor, hasta llenar el cupo de cada carrera. Ponte una meta y mide qué tan cerca estás.' },
  venta: (env, req, url) => paginaVentaSimulador(IPN, VENTA, env, req, url),
});

// ---------- página de venta ----------
const SITIO = 'https://vorka.mx';
const IMG = '/assets/tienda';
const DESCRIPCION = 'Simulador del examen de admisión del IPN (nivel superior) en línea para las 3 áreas: 140 reactivos en 3 horas, tutor con pistas y aciertos estimados por materia.';
const FAQ = [
  { p: '¿Cómo es el examen de admisión a licenciatura del IPN?', r: 'Según la convocatoria, son 140 reactivos de opción múltiple que se resuelven en tres horas efectivas. Hay tres áreas: Ingeniería y Ciencias Físico Matemáticas, Ciencias Médico Biológicas, y Ciencias Sociales y Administrativas. Tu área depende de la carrera que elijas, y el simulador arma tu examen según esa área.' },
  { p: '¿Qué materias vienen?', r: 'Las mismas ocho en las tres áreas: Matemáticas, Competencia escrita, Competencia lectora, Química, Física, Biología, Historia e Inglés. Lo que cambia es cuántas preguntas hay de cada una: por ejemplo, Ingeniería tiene más Matemáticas y Física, Médico Biológicas más Biología y Sociales más Historia y Competencia escrita.' },
  { p: '¿Cuántos reactivos hay de cada materia?', r: 'El IPN no publica un desglose oficial por materia. El simulador usa la distribución de referencia que difunden las guías de preparación (cada área suma 140), que ves en la tabla de arriba. Úsala para saber qué pesa más en tu área, no como dato oficial.' },
  { p: '¿Cuántos aciertos necesito para entrar?', r: 'No hay un mínimo fijo: según la convocatoria, el IPN asigna los lugares por número total de aciertos, de mayor a menor, hasta agotar el cupo de cada carrera, así que cambia cada año y por carrera. Ponte una meta en el simulador y mide qué tan cerca estás en cada simulacro.' },
  { p: '¿Sirve para entrar a una vocacional del IPN (CECyT o CET)?', r: 'No: para el bachillerato del IPN el examen es el del ECOEMS, el mismo que para la prepa de la UNAM. Para eso está nuestro <a href="/simulador-ecoems/">Simulador ECOEMS</a>. Este simulador es para licenciatura (nivel superior).' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con reactivos originales que siguen el temario del examen. No está afiliado al IPN y los aciertos son una estimación para orientar tu estudio. Revisa siempre la convocatoria vigente en ipn.mx.' },
  { p: '¿Cuál es la diferencia entre los planes?', r: 'Práctica es para entrenar: Calentamientos, simulacros Medios de unos 70 reactivos y práctica por materia y por tema, sin límite y con tutor; no incluye los exámenes completos. Examen es para medirte como el día del examen: 2 exámenes completos de 140 reactivos en 3 horas, de tu área: el primero con tutor y el segundo sin pistas; no incluye la práctica ilimitada. Completo trae las dos cosas, más plan de estudio, recordatorios y apuntes, y cuesta menos que comprarlas por separado.' },
  { p: '¿Hay reembolso?', r: 'Solo si aún no lo usas: puedes pedirlo dentro de los 5 días hábiles siguientes a tu compra escribiendo a hola@vorka.mx. Una vez que empiezas un simulacro, un examen o una práctica ya no hay reembolso. Si algo falla y no te deja usarlo, lo resolvemos o te devolvemos tu dinero.' },
  { p: '¿Lo puedo regalar?', r: 'Sí. Al comprar elige Para regalar y cuántos: te llega una liga por cada regalo. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador de tu celular, tablet o computadora, y con el plan Completo lo puedes instalar como app. Tu historial se guarda en tu cuenta durante 6 meses.' },
];
const tablaAreas = `<table class="sv-tabla"><thead><tr><th scope="col">Materia</th>${AREAS.map(a => `<th scope="col" class="num">${a.corto}</th>`).join('')}</tr></thead><tbody>${
  MATERIA.map(([id, nombre, color]) => `<tr><th scope="row"><span class="sv-dot s-${color}"></span>${nombre}</th>${AREAS.map(a => `<td class="num">${DISTRIBUCION[a.id][id] || '—'}</td>`).join('')}</tr>`).join('')
}<tr><th scope="row">Total</th>${AREAS.map(() => '<td class="num"><b>140 · 3 h</b></td>').join('')}</tr></tbody></table>`;
const ej = REACTIVOS.find(r => r.seccion === 'fisica' && r.dificultad === 2 && !r.texto && !r.figura) || REACTIVOS[0];

const VENTA = {
  sku: 'prod_simulador_ipn', nombreProducto: 'Simulador IPN en línea', descripcion: DESCRIPCION, planInicial: 'paquete',
  tituloSEO: 'Simulador examen IPN 2027 en línea: nivel superior, las 3 áreas | Vorka México',
  og: `${SITIO}${IMG}/v3/simulador-ipn-og.jpg`, imagenesLD: [`${SITIO}${IMG}/v3/simulador-ipn-portada.webp`, `${SITIO}${IMG}/v3/simulador-ipn-og.jpg`],
  imagenes: { portada: `${IMG}/v3/simulador-ipn-portada.webp`, og: `${IMG}/v3/simulador-ipn-og.jpg`, paso1: `${IMG}/v3/simulador-ipn-paso-reloj.webp`, paso2: `${IMG}/v3/simulador-ipn-paso-tutor.webp`, reporte: `${IMG}/simulador-ipn-reporte.png`, regalo: `${IMG}/simulador-ipn-regalo.png` },
  banco: REACTIVOS.length,
  chip: `Nuevo · ${REACTIVOS.length} reactivos originales · 3 áreas`,
  hero: {
    h1: 'Simulador del examen IPN: practica para tu área como el día del examen',
    lead: 'Elige tu área y practica con 140 reactivos en 3 horas, con el peso de cada materia de tu área. Si fallas, un tutor te da una pista para intentarlo otra vez; al final, un reporte te dice cuántos aciertos llevas y qué reforzar.',
    sellos: ['Las 3 áreas de nivel superior', 'Examen completo: 140 reactivos en 3 horas', 'Aciertos estimados por materia', 'En celular o computadora'],
    alt: 'Simulador IPN de Vorka México: pregunta con pista del tutor y reporte de aciertos por materia',
  },
  queEs: {
    apoyo: 'Elige tu área y practica con 140 reactivos en 3 horas, con el peso de cada materia de tu área.',
    texto: 'Un examen de práctica en línea para el examen de admisión a licenciatura del IPN, armado con las 8 materias y el peso del área de tu carrera. <b>Si fallas, un tutor te da una pista</b> para intentarlo otra vez; al final, un reporte te dice cuántos aciertos llevas y qué reforzar.',
    para: [['Si vas a presentar el examen del IPN', 'No sabes cuántos aciertos sacarías hoy en tu área.'], ['Si ya estudiaste con guías en PDF', 'Te falta practicar con el tiempo real y saber qué materias te faltan.'], ['Mamá, papá o quien quiera apoyar', 'Quieres regalarle algo que de verdad le ayude a prepararse.']],
  },
  planesVenta: [
    { k: 'practica', nombre: 'Práctica', para: 'Solo entrenar, sin límite y con tutor', falta: 'No incluye los exámenes completos', trae: () => ['Calentamientos y simulacros Medios sin límite', 'Práctica por materia y por tema', 'Tutor con pistas y explicación paso a paso', 'Aciertos estimados y qué reforzar'] },
    { k: 'completo', nombre: 'Examen', para: 'Solo medirte: 2 exámenes completos como el real', falta: 'No incluye la práctica ilimitada', trae: () => ['2 exámenes completos de tu área: 140 reactivos en 3 horas', 'El 1.º con tutor para entrenar; el 2.º sin pistas, como el día del examen', 'Aciertos por materia y temas a reforzar', 'Cambia de área cuando quieras'] },
    { k: 'paquete', nombre: 'Completo', para: 'Práctica sin límite + los 2 exámenes completos', trae: () => ['Todo lo del plan Práctica: entrenas sin límite con tutor', 'Todo lo del plan Examen: los 2 exámenes completos de 3 horas', 'Plan de estudio con recordatorios, apuntes y app en tu celular', '6 meses de acceso a todo'] },
  ],
  diferencias: [
    ['Calentamientos y simulacros Medios sin límite', true, false, true],
    ['Práctica por materia y por tema', true, false, true],
    ['Tutor con pistas y solución paso a paso', true, 'En el 1.er examen', true],
    ['2 exámenes completos con cronómetro', false, true, true],
    ['Plan de estudio, recordatorios y apuntes', false, false, true],
    ['Aciertos estimados y qué reforzar', true, true, true],
  ],
  cifras: [[REACTIVOS.length, 'reactivos originales'], [8, 'materias del examen'], [Object.keys(TEMAS).length, 'temas medidos en tu reporte'], [140, 'reactivos en el examen completo']],
  pasos: [['Contesta como en el examen', 'Las materias de tu área con su peso y el mismo ritmo que el examen real (140 reactivos en 3 horas). El reloj se pausa mientras lees las explicaciones.'], null,
    [null, 'Aciertos estimados sobre 140, distancia a tu meta, tus materias fuertes y los temas que más aciertos te cuestan, con práctica dirigida.']],
  ejemplo: { ...ej, etiqueta: `Física · ${TEMAS[ej.tema]?.nombre || ''}` },
  incluye: [
    { titulo: 'Elige tu área', texto: 'El simulador arma cada examen con las 8 materias y el peso del área de tu carrera. Puedes cambiar de área cuando quieras.' },
    { titulo: 'Calentamientos y Medios', tag: 'Práctica', texto: 'Calentamientos de unos 35 reactivos y simulacros Medios de unos 70, con cronómetro y tutor. Sin límite: cada uno trae preguntas que no has visto.' },
    { titulo: 'Examen completo', tag: 'Examen', oro: true, texto: '2 exámenes de 140 reactivos en 3 horas, con la distribución de tu área: el primero con tutor y el segundo sin pistas, como el día del examen. Al final, tu reporte de aciertos.' },
    { titulo: 'Por materia y por tema', tag: 'Práctica', texto: 'Practica cada materia por separado y tus temas débiles todas las veces que quieras.' },
    { titulo: 'Medidor de preparación', texto: 'Una conclusión clara y basada en tus datos: qué tan listo estás y a cuántos aciertos de tu meta.' },
    { titulo: 'Historial en tu cuenta', texto: 'Tu avance se guarda: compara tus simulacros y entra desde cualquier dispositivo durante 6 meses.' },
  ],
  comparar: [
    ['Examen armado según tu área', true, false],
    ['Pista de método cuando fallas (sin darte la respuesta)', true, false],
    ['Explicación paso a paso y la regla detrás', true, 'A veces'],
    ['Aciertos estimados por materia', true, false],
    ['Plan de qué reforzar según tus errores', true, false],
    ['Preguntas nuevas en cada simulacro', true, false],
  ],
  estructura: {
    titulo: 'Las materias de cada área',
    lead: 'El <b>examen completo</b> tiene 140 reactivos en 3 horas con el peso de tu área. El <b>simulacro Medio</b> es la mitad (unos 70 reactivos en hora y media) con el mismo ritmo. Distribución de referencia de las guías de preparación: el IPN no publica un desglose oficial por materia.',
    tabla: tablaAreas,
  },
  faqTitulo: 'Sobre el examen del IPN y el simulador',
  faq: FAQ,
  final: 'Haz un simulacro Medio hoy para ver en hora y media qué materias te faltan y, cuando estés listo, el examen completo de tu área con el tiempo real.',
  aviso: 'Simulador de práctica de Vorka México con reactivos originales. No está afiliado al Instituto Politécnico Nacional. La distribución por materia es de referencia y los aciertos son una estimación para orientar tu estudio. Fuente del formato: convocatoria de admisión a nivel superior del IPN.',
};
