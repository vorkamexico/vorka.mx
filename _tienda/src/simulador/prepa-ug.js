// Simulador prepa UG (vorka.mx/simulador-prepa-ug): EXANI-I de CENEVAL, el examen que pide la Universidad de Guanajuato
// para entrar a su bachillerato (Bachillerato General y Bivalente).
// Datos verificados (proceso ago-dic 2026): convocatoria del Colegio del Nivel Medio Superior (EXANI-I 70 %, examen
// diagnóstico de la SEG 20 %, promedio de 1.º y 2.º de secundaria 10 %) y ficha técnica del Bachillerato General de la
// ENMS León (160 reactivos en 4 h 30 min; áreas, reactivos y pesos de abajo). Tres opciones por reactivo: guía del nuevo
// EXANI-I de CENEVAL (la que liga la ficha). Del proceso 2027 de primer ingreso no hay nada publicado.
// Planes: Práctica ($129), Examen ($179: 2 exámenes completos) y Completo ($249: los dos). Adicionales: 1 Medio
// ($49) o 1 examen más ($79).
import { crearSimulador } from './motor.js';
import { paginaVentaSimulador } from './venta.js';
import { armarPorMaterias } from './armar-por-area.js';
import { TEMAS_COMPRENSION_LECTORA, TEXTOS_COMPRENSION_LECTORA, REACTIVOS_COMPRENSION_LECTORA } from './prepa-ug/comprension_lectora.js';
import { TEMAS_REDACCION_INDIRECTA, REACTIVOS_REDACCION_INDIRECTA } from './prepa-ug/redaccion_indirecta.js';
import { TEMAS_PENSAMIENTO_MATEMATICO, REACTIVOS_PENSAMIENTO_MATEMATICO } from './prepa-ug/pensamiento_matematico.js';
import { REACTIVOS_PENSAMIENTO_MATEMATICO_USOS } from './prepa-ug/pensamiento_matematico_usos.js';
import { TEMAS_PENSAMIENTO_CIENTIFICO, REACTIVOS_PENSAMIENTO_CIENTIFICO } from './prepa-ug/pensamiento_cientifico.js';
import { TEMAS_INGLES_UG, TEXTOS_INGLES_UG, REACTIVOS_INGLES_UG } from './prepa-ug/ingles.js';

const TEMAS = { ...TEMAS_COMPRENSION_LECTORA, ...TEMAS_REDACCION_INDIRECTA, ...TEMAS_PENSAMIENTO_MATEMATICO, ...TEMAS_PENSAMIENTO_CIENTIFICO, ...TEMAS_INGLES_UG };
const TEXTOS = { ...TEXTOS_COMPRENSION_LECTORA, ...TEXTOS_INGLES_UG };
const REACTIVOS = [...REACTIVOS_COMPRENSION_LECTORA, ...REACTIVOS_REDACCION_INDIRECTA, ...REACTIVOS_PENSAMIENTO_MATEMATICO,
  ...REACTIVOS_PENSAMIENTO_MATEMATICO_USOS, ...REACTIVOS_PENSAMIENTO_CIENTIFICO, ...REACTIVOS_INGLES_UG];

// Áreas en el orden de la ficha técnica: [id, nombre, color, qué evalúa, reactivos, minutos, peso UG en %, fracción en lecturas]
// Los minutos por área son nuestros (la ficha solo fija 4 h 30 min en total): suman 270, al ritmo de ~1.7 min por reactivo.
const AREA = [
  ['comprension_lectora', 'Comprensión lectora', 'morado', 'Textos de estudio, literarios y de participación social: identificar información, interpretar y evaluar forma y contenido.', 30, 51, 20, 1],
  ['redaccion_indirecta', 'Redacción indirecta', 'tinta', 'Elegir la mejor forma de escribir: propósito y orden de las ideas, gramática, significado y ortografía.', 30, 51, 20, 0],
  ['pensamiento_matematico', 'Pensamiento matemático', 'verde', 'Sentido numérico, estimación, álgebra, geometría, probabilidad, estadística y variación.', 40, 67, 27, 0],
  ['pensamiento_cientifico', 'Pensamiento científico', 'oro', 'Biología, química y física de secundaria: conceptos, su relación con la salud y el ambiente, y conclusiones a partir de datos.', 30, 51, 26, 0],
  ['ingles', 'Inglés', 'morado', 'Nivel A2: leer avisos y textos breves, y completar mensajes y reportes sencillos.', 30, 50, 7, 0.5],
];
const MIN_POR_REACTIVO = 270 / 160;
const seccion = ([id, nombre, color, descripcion, , , , lecturas], reactivos, minutos) => ({ id, nombre, color, descripcion, reactivos, minutos, lecturas });
const conRitmo = f => AREA.map(a => { const n = Math.round(a[4] * f); return seccion(a, n, Math.round(n * MIN_POR_REACTIVO)); });
// Examen: 160 reactivos en 270 min · Medio: la mitad · Calentamiento: la cuarta parte, de dificultad básica e intermedia.
const SECCIONES_EXAMEN = AREA.map(a => seccion(a, a[4], a[5]));
const SECCIONES = conRitmo(0.5);
const SECCIONES_CALENTAMIENTO = conRitmo(0.25);
const PONDERACION = Object.fromEntries(AREA.map(a => [a[0], a[6]]));
const total = (l, k = 'reactivos') => l.reduce((t, x) => t + x[k], 0);
const EXAMEN_REACTIVOS = total(SECCIONES_EXAMEN), EXAMEN_HORAS = total(SECCIONES_EXAMEN, 'minutos') / 60;
const MEDIO_REACTIVOS = total(SECCIONES), CAL_REACTIVOS = total(SECCIONES_CALENTAMIENTO);
const BANCO = { REACTIVOS, TEXTOS };
const HORAS = String(EXAMEN_HORAS).replace(/^(\d+)\.5$/, '$1 horas y media');   // "4 horas y media"

export const APP = 'simulador-prepa-ug';
export const PLANES = { practica: 'simulador-prepa-ug-practica', completo: 'simulador-prepa-ug-completo', paquete: 'simulador-prepa-ug-paquete' };

export const PREPA_UG = crearSimulador({
  app: APP, ruta: '/simulador-prepa-ug', cookie: 'vk_prepaug', firma: APP, nombre: 'prepa UG', titulo: 'Simulador prepa UG',
  planes: PLANES, slugIntento: 'simulador-prepa-ug-intento', slugExamen: 'simulador-prepa-ug-examen',
  incluidos: { calentamiento: 0, corto: 0, examen: 0 },
  escala: { tipo: 'aciertos', total: EXAMEN_REACTIVOS },
  banco: { SECCIONES, SECCIONES_EXAMEN, SECCIONES_CALENTAMIENTO, TEMAS, TEXTOS, REACTIVOS },
  armar: {
    corto: (azar, vistos) => armarPorMaterias(BANCO, SECCIONES, azar, vistos, 'medio'),
    examen: (azar, vistos) => armarPorMaterias(BANCO, SECCIONES_EXAMEN, azar, vistos, 'oficial'),
    calentamiento: (azar, vistos) => armarPorMaterias(BANCO, SECCIONES_CALENTAMIENTO, azar, vistos, 'calentamiento'),
  },
  cliente: { examen: 'EXANI-I', escala: 'aciertos', examenReactivos: EXAMEN_REACTIVOS, examenHoras: EXAMEN_HORAS, meta: { inicial: 100, min: 50, max: EXAMEN_REACTIVOS, paso: 1 },
    ponderacion: PONDERACION, ponderacionNombre: 'Con los pesos de la ficha de la UG',
    oficial: 'la Universidad de Guanajuato ni de CENEVAL', metaNota: 'Ponte una meta de aciertos y mide en cada simulacro qué tan cerca estás. La UG no publica un mínimo de aciertos: puedes cambiar tu meta cuando quieras.', regalo: '/tienda/simulador-prepa-ug-paquete/?regalo=1#comprar' },
  venta: (env, req, url) => paginaVentaSimulador(PREPA_UG, VENTA, env, req, url),
});

// ---------- página de venta ----------
// Solo datos verificados en la convocatoria de la prepa UG ago-dic 2026, la ficha técnica de la ENMS León y la guía del
// nuevo EXANI-I de CENEVAL (fuentes en el aviso). Nada del proceso 2027: no hay nada publicado.
const SITIO = 'https://vorka.mx';
const IMG = '/assets/tienda';   // estáticas del sitio (assets/tienda/), no en R2
const DESCRIPCION = `Simulador del EXANI-I en línea para la prepa de la Universidad de Guanajuato: ${EXAMEN_REACTIVOS} reactivos en ${HORAS}, tutor con pistas y aciertos por área.`;
const FAQ = [
  { p: '¿Qué examen piden para entrar a la prepa de la UG?', r: 'El EXANI-I de CENEVAL. En el proceso de agosto-diciembre 2026, la UG eligió a sus aspirantes de Bachillerato General y Bivalente con tres elementos: el EXANI-I (70 %), el examen diagnóstico para el ingreso a Media Superior que coordina la Secretaría de Educación de Guanajuato (20 %) y el promedio de 1.º y 2.º de secundaria (10 %).' },
  { p: '¿Cómo es el EXANI-I?', r: `Son ${EXAMEN_REACTIVOS} preguntas de opción múltiple, cada una con tres opciones, y dura un máximo de ${HORAS}. Según la ficha técnica de la UG tiene cinco áreas: Comprensión lectora (30 reactivos), Redacción indirecta (30), Pensamiento matemático (40), Pensamiento científico (30) e Inglés (30). En 2026 se presentó en persona, en la Escuela de Nivel Medio Superior de la UG correspondiente.` },
  { p: '¿Cuánto vale cada área?', r: 'En la ficha técnica 2026 del Bachillerato General de la Escuela de Nivel Medio Superior de León, la UG da estos pesos: Comprensión lectora 20 %, Redacción indirecta 20 %, Pensamiento matemático 27 %, Pensamiento científico 26 % e Inglés 7 %. La guía de CENEVAL presenta el inglés como información diagnóstica; la ficha de la UG sí le da 7 %. Revisa la ficha técnica de la escuela que te interesa.' },
  { p: '¿Cuándo es el examen 2027?', r: 'Todavía no hay convocatoria publicada para entrar a primer semestre en 2027. Como referencia, en el proceso de 2026 el registro fue del 2 de febrero al 11 de abril, el EXANI-I se presentó el 22 de mayo y los resultados se publicaron el 19 de junio. Consulta siempre la convocatoria vigente en ugto.mx/admisionug.' },
  { p: '¿El simulador incluye el examen diagnóstico de la SEG?', r: 'No. El simulador prepara para el EXANI-I, que es el 70 % de la selección. El examen diagnóstico lo coordina la Secretaría de Educación de Guanajuato y no encontramos publicado qué evalúa, así que no lo simulamos.' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con reactivos originales que siguen el temario de secundaria y las áreas del EXANI-I. No está afiliado a la Universidad de Guanajuato, a CENEVAL ni a la Secretaría de Educación de Guanajuato. Los aciertos y el cálculo con los pesos de la ficha son una estimación para orientar el estudio; no es el Índice CENEVAL.' },
  { p: '¿Cuál es la diferencia entre los planes?', r: `Práctica es para entrenar: Calentamientos de ${CAL_REACTIVOS} reactivos, simulacros Medios de ${MEDIO_REACTIVOS} y práctica por área y por tema, sin límite y con tutor; no incluye los exámenes completos. Examen es para medirse como el día del examen: 2 exámenes completos de ${EXAMEN_REACTIVOS} reactivos en ${HORAS}: el primero con tutor y el segundo sin pistas, como el día del examen; no incluye la práctica ilimitada. Completo trae las dos cosas y cuesta menos que comprarlas por separado: es el que recomendamos, porque practicar sin medirse no dice si ya se está listo y medirse sin practicar no ayuda a subir.` },
  { p: 'Soy mamá o papá: ¿cómo funciona la compra?', r: 'Pagas una sola vez con tarjeta, OXXO o SPEI y el acceso llega al correo que escribas. Si lo compras para tu hijo o hija, elige Para regalar: te llega una liga que abre su propia cuenta, con su historial y su reporte, y puedes ver con él o ella en qué áreas va bien y qué le falta. Dura 6 meses desde la compra.' },
  { p: '¿Hay reembolso?', r: 'Solo si aún no lo usas: puedes pedirlo dentro de los 5 días hábiles siguientes a tu compra escribiendo a hola@vorka.mx. Una vez que empiezas un simulacro, un examen o una práctica ya no hay reembolso. Si algo falla y no te deja usarlo, lo resolvemos o te devolvemos tu dinero.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador del celular, la tablet o la computadora, sin instalar nada. El historial se guarda en la cuenta durante 6 meses.' },
];
const tablaAreas = `<table class="sv-tabla sec"><thead><tr><th scope="col">Área</th><th scope="col" class="num">Examen completo</th><th scope="col" class="num">Simulacro Medio</th><th scope="col" class="num">Peso UG</th><th scope="col">Qué evalúa</th></tr></thead><tbody>${
  SECCIONES_EXAMEN.map((s, i) => `<tr><th scope="row"><span class="sv-dot s-${s.color}"></span>${s.nombre}</th><td class="num">${s.reactivos}</td><td class="num">${SECCIONES[i].reactivos}</td><td class="num">${PONDERACION[s.id]}&nbsp;%</td><td>${s.descripcion}</td></tr>`).join('')
}<tr><th scope="row">Total</th><td class="num"><b>${EXAMEN_REACTIVOS} · ${EXAMEN_HORAS}&nbsp;h</b></td><td class="num">${MEDIO_REACTIVOS}</td><td class="num">100&nbsp;%</td><td></td></tr></tbody></table>`;
const ej = REACTIVOS.find(r => r.seccion === 'pensamiento_matematico' && r.dificultad === 2 && !r.texto && !r.figura && !r.tabla) || REACTIVOS[0];

const VENTA = {
  sku: 'prod_simulador_prepa_ug', nombreProducto: 'Simulador prepa UG (EXANI-I) en línea', descripcion: DESCRIPCION, planInicial: 'paquete',
  tituloSEO: 'Simulador EXANI-I 2027 para la prepa de la UG en línea | Vorka México',
  og: `${SITIO}${IMG}/v3/simulador-prepa-ug-og.jpg`, imagenesLD: [`${SITIO}${IMG}/v3/simulador-prepa-ug-portada.webp`, `${SITIO}${IMG}/v3/simulador-prepa-ug-og.jpg`],
  imagenes: { portada: `${IMG}/v3/simulador-prepa-ug-portada.webp`, og: `${IMG}/v3/simulador-prepa-ug-og.jpg`, paso1: `${IMG}/v3/simulador-prepa-ug-paso-reloj.webp`, paso2: `${IMG}/v3/simulador-prepa-ug-paso-tutor.webp`, reporte: `${IMG}/simulador-prepa-ug-reporte.png`, regalo: `${IMG}/simulador-prepa-ug-regalo.png` },
  banco: REACTIVOS.length,
  chip: `Nuevo · ${REACTIVOS.length} reactivos originales`,
  hero: {
    h1: 'Simulador EXANI-I: prepárate para entrar a la prepa de la UG',
    lead: `Tu hijo o hija practica con un examen de ${EXAMEN_REACTIVOS} reactivos en ${HORAS}, con las 5 áreas del EXANI-I y cronómetro. Si falla, un tutor le da una pista para intentarlo otra vez; al final, un reporte dice cuántos aciertos lleva y qué reforzar.`,
    sellos: [`Examen completo: ${EXAMEN_REACTIVOS} reactivos en ${HORAS}`, 'Las 5 áreas, con 3 opciones por pregunta', 'Aciertos por área y con los pesos de la UG', 'En celular o computadora'],
    alt: 'Simulador EXANI-I para la prepa UG de Vorka México: pregunta con pista del tutor y reporte de aciertos por área',
  },
  planesVenta: [
    { k: 'practica', nombre: 'Práctica', para: 'Solo entrenar, sin límite y con tutor', falta: 'No incluye los exámenes completos', trae: () => ['Calentamientos y simulacros Medios sin límite', 'Práctica por área y por tema', 'Tutor con pistas y explicación paso a paso', 'Aciertos estimados y qué reforzar'] },
    { k: 'completo', nombre: 'Examen', para: 'Solo medirse: 2 exámenes completos como el real', falta: 'No incluye la práctica ilimitada', trae: () => [`2 exámenes completos: ${EXAMEN_REACTIVOS} reactivos en ${HORAS}`, 'El 1.º con tutor para entrenar; el 2.º sin pistas, como el día del examen', 'Aciertos por área y temas a reforzar'] },
    { k: 'paquete', nombre: 'Completo', para: 'Práctica sin límite + los 2 exámenes completos', trae: () => ['Todo lo del plan Práctica: entrena sin límite con tutor', 'Todo lo del plan Examen: los 2 exámenes completos', '6 meses de acceso a todo'] },
  ],
  diferencias: [
    ['Calentamientos y simulacros Medios sin límite', true, false, true],
    ['Práctica por área y por tema', true, false, true],
    ['Tutor con pistas y solución paso a paso', true, 'En el 1.er examen', true],
    ['2 exámenes completos con cronómetro', false, true, true],
    ['Aciertos estimados y qué reforzar', true, true, true],
  ],
  cifras: [[REACTIVOS.length, 'reactivos originales'], [AREA.length, 'áreas del EXANI-I'], [Object.keys(TEMAS).length, 'temas medidos en el reporte'], [EXAMEN_REACTIVOS, 'reactivos en el examen completo']],
  pasos: [['Contesta como en el examen', `Las 5 áreas con cronómetro, al ritmo de ${HORAS} para ${EXAMEN_REACTIVOS} reactivos. El reloj se pausa mientras lee las explicaciones.`], null,
    [null, `Aciertos estimados sobre ${EXAMEN_REACTIVOS}, un cálculo con los pesos de la ficha de la UG, las áreas fuertes y los temas que más aciertos cuestan, con práctica dirigida.`]],
  ejemplo: { ...ej, etiqueta: `Pensamiento matemático · ${TEMAS[ej.tema]?.nombre || ''}` },
  incluye: [
    { titulo: 'Calentamientos y Medios', tag: 'Práctica', texto: `Calentamientos de ${CAL_REACTIVOS} reactivos y simulacros Medios de ${MEDIO_REACTIVOS}, con cronómetro y tutor. Sin límite: cada uno trae preguntas que no ha visto.` },
    { titulo: 'Examen completo', tag: 'Examen', oro: true, texto: `2 exámenes de ${EXAMEN_REACTIVOS} reactivos en ${HORAS}: el primero con tutor y el segundo sin pistas, como el día del examen. Al final, el reporte de aciertos por área.` },
    { titulo: 'Por área y por tema', tag: 'Práctica', texto: 'Practica cada área por separado y los temas débiles todas las veces que quiera.' },
    { titulo: 'Medidor de preparación', texto: 'Una conclusión clara y basada en sus datos: qué tan listo está y a cuántos aciertos de su meta.' },
    { titulo: 'Historial en su cuenta', texto: 'El avance se guarda: compara sus simulacros y entra desde cualquier dispositivo durante 6 meses.' },
    { titulo: 'Para regalar', texto: 'Mamá, papá o quien quiera apoyar lo compra y le llega una liga a quien va a presentar, con su propia cuenta.' },
  ],
  comparar: [
    ['Cronómetro en cada simulacro', true, false],
    ['Pista de método cuando falla (sin darle la respuesta)', true, false],
    ['Explicación paso a paso y la regla detrás', true, 'A veces'],
    ['Aciertos estimados por área', true, false],
    ['Plan de qué reforzar según sus errores', true, false],
    ['Preguntas nuevas en cada simulacro', true, false],
  ],
  estructura: {
    titulo: 'Las 5 áreas del EXANI-I',
    lead: `El <b>examen completo</b> tiene ${EXAMEN_REACTIVOS} reactivos de tres opciones en ${HORAS}, con el reparto y los pesos de la ficha técnica 2026 de la UG. El <b>simulacro Medio</b> es la mitad (${MEDIO_REACTIVOS} reactivos) con el mismo ritmo.`,
    tabla: tablaAreas,
  },
  faqTitulo: 'Sobre el examen y el simulador',
  faq: FAQ,
  final: 'Que haga un Calentamiento hoy para ver qué áreas le faltan y, cuando esté listo, el examen completo para medirse como el día del examen.',
  aviso: 'Simulador de práctica de Vorka México con reactivos originales. No está afiliado a la Universidad de Guanajuato, a CENEVAL ni a la Secretaría de Educación de Guanajuato. Los aciertos y el cálculo con los pesos de la ficha son una estimación para orientar el estudio. Fuentes: convocatoria de la prepa UG agosto-diciembre 2026 y ficha técnica del Bachillerato General de la ENMS León (ugto.mx/admisionug), y guía del nuevo EXANI-I de CENEVAL.',
};
