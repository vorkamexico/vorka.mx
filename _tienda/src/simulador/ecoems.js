// Simulador ECOEMS (vorka.mx/simulador-ecoems): examen para entrar al bachillerato de la UNAM y del IPN dentro del
// proceso «Mi derecho, mi lugar». ECOEMS es el Espacio de Coordinación que convoca, no el nombre del examen.
// Datos verificados (convocatoria 2026): examen en línea de 128 reactivos en 3 horas, sin áreas. El reparto por materia
// (Habilidad verbal 16, Habilidad matemática 16 y 12 de cada una de las otras 8) sale de la guía conjunta UNAM-IPN, que
// solo encontramos en un sitio comercial: en la página se presenta como "de referencia".
// Planes: Práctica ilimitada ($129), Simulador completo ($179: 2 exámenes completos) y Paquete ($249). Adicionales: 1 Medio
// ($49) o 1 examen más ($79).
import { crearSimulador } from './motor.js';
import { paginaVentaSimulador } from './venta.js';
import { armarPorMaterias } from './armar-por-area.js';
import { TEMAS_HABILIDAD_VERBAL, TEXTOS_HABILIDAD_VERBAL, REACTIVOS_HABILIDAD_VERBAL } from './ecoems/habilidad_verbal.js';
import { TEMAS_HABILIDAD_MATEMATICA, REACTIVOS_HABILIDAD_MATEMATICA } from './ecoems/habilidad_matematica.js';
import { TEMAS_ESPANOL, TEXTOS_ESPANOL, REACTIVOS_ESPANOL } from './ecoems/espanol.js';
import { TEMAS_MATEMATICAS, REACTIVOS_MATEMATICAS } from './ecoems/matematicas.js';
import { TEMAS_BIOLOGIA, REACTIVOS_BIOLOGIA } from './ecoems/biologia.js';
import { TEMAS_FISICA, REACTIVOS_FISICA } from './ecoems/fisica.js';
import { TEMAS_QUIMICA, REACTIVOS_QUIMICA } from './ecoems/quimica.js';
import { TEMAS_HISTORIA, REACTIVOS_HISTORIA } from './ecoems/historia.js';
import { TEMAS_GEOGRAFIA, REACTIVOS_GEOGRAFIA } from './ecoems/geografia.js';
import { TEMAS_FORMACION_CIVICA, REACTIVOS_FORMACION_CIVICA } from './ecoems/formacion_civica.js';

const TEMAS = { ...TEMAS_HABILIDAD_VERBAL, ...TEMAS_HABILIDAD_MATEMATICA, ...TEMAS_ESPANOL, ...TEMAS_MATEMATICAS, ...TEMAS_BIOLOGIA,
  ...TEMAS_FISICA, ...TEMAS_QUIMICA, ...TEMAS_HISTORIA, ...TEMAS_GEOGRAFIA, ...TEMAS_FORMACION_CIVICA };
const TEXTOS = { ...TEXTOS_HABILIDAD_VERBAL, ...TEXTOS_ESPANOL };
const REACTIVOS = [...REACTIVOS_HABILIDAD_VERBAL, ...REACTIVOS_HABILIDAD_MATEMATICA, ...REACTIVOS_ESPANOL, ...REACTIVOS_MATEMATICAS,
  ...REACTIVOS_BIOLOGIA, ...REACTIVOS_FISICA, ...REACTIVOS_QUIMICA, ...REACTIVOS_HISTORIA, ...REACTIVOS_GEOGRAFIA, ...REACTIVOS_FORMACION_CIVICA];

// Materias en el orden del examen: [id, nombre, color, qué evalúa, reactivos en el examen, minutos en el examen]
// Los minutos por materia son nuestros (la convocatoria solo fija 3 horas en total): suman 180, al ritmo de ~1.4 min por reactivo.
const MATERIA = [
  ['habilidad_verbal', 'Habilidad verbal', 'morado', 'Comprensión de lectura, sinónimos y antónimos, analogías, completar oraciones y sentido figurado.', 16, 22],
  ['habilidad_matematica', 'Habilidad matemática', 'verde', 'Sucesiones, razonamiento lógico y aritmético, proporciones, porcentajes e imaginación espacial.', 16, 22],
  ['espanol', 'Español', 'morado', 'Tipos de texto, gramática, ortografía, puntuación, literatura y fuentes de información.', 12, 17],
  ['matematicas', 'Matemáticas', 'verde', 'Números y operaciones, proporcionalidad, álgebra, ecuaciones, geometría, probabilidad y estadística.', 12, 17],
  ['biologia', 'Biología', 'verde', 'Biodiversidad, célula, nutrición, respiración y circulación, reproducción, herencia y ecología.', 12, 17],
  ['fisica', 'Física', 'tinta', 'Movimiento, fuerzas, energía, calor, electricidad y magnetismo, ondas, luz y sonido.', 12, 17],
  ['quimica', 'Química', 'oro', 'Materia y mezclas, átomo y tabla periódica, enlaces, reacciones, ácidos y bases.', 12, 17],
  ['historia', 'Historia', 'morado', 'Historia universal desde 1750 e historia de México, del México prehispánico al contemporáneo.', 12, 17],
  ['geografia', 'Geografía', 'verde', 'Mapas, la Tierra, climas y regiones, población, economía, cultura y geografía de México.', 12, 17],
  ['formacion_civica', 'Formación cívica y ética', 'tinta', 'Identidad, convivencia, derechos humanos, igualdad, democracia y legalidad.', 12, 17],
];
const MIN_POR_REACTIVO = 180 / 128;
const seccion = ([id, nombre, color, descripcion], reactivos, minutos) => ({ id, nombre, color, descripcion, reactivos, minutos });
const conRitmo = f => MATERIA.map(m => { const n = Math.round(m[4] * f); return seccion(m, n, Math.round(n * MIN_POR_REACTIVO)); });
// Examen: 128 reactivos en 180 min · Medio: la mitad (64) · Calentamiento: la cuarta parte (32), de dificultad básica e intermedia.
// Sin áreas: las secciones son fijas, como en el PAA (el Medio es también la práctica por materia).
const SECCIONES_EXAMEN = MATERIA.map(m => seccion(m, m[4], m[5]));
const SECCIONES = conRitmo(0.5);
const SECCIONES_CALENTAMIENTO = conRitmo(0.25);
const total = (l, k = 'reactivos') => l.reduce((t, x) => t + x[k], 0);
const EXAMEN_REACTIVOS = total(SECCIONES_EXAMEN), EXAMEN_HORAS = total(SECCIONES_EXAMEN, 'minutos') / 60;
const MEDIO_REACTIVOS = total(SECCIONES), CAL_REACTIVOS = total(SECCIONES_CALENTAMIENTO);
const BANCO = { REACTIVOS, TEXTOS };

export const APP = 'simulador-ecoems';
export const PLANES = { practica: 'simulador-ecoems-practica', completo: 'simulador-ecoems-completo', paquete: 'simulador-ecoems-paquete' };

export const ECOEMS = crearSimulador({
  app: APP, ruta: '/simulador-ecoems', cookie: 'vk_ecoems', firma: APP, nombre: 'ECOEMS', titulo: 'Simulador ECOEMS',
  planes: PLANES, slugIntento: 'simulador-ecoems-intento', slugExamen: 'simulador-ecoems-examen',
  incluidos: { calentamiento: 0, corto: 0, examen: 0 },
  escala: { tipo: 'aciertos', total: EXAMEN_REACTIVOS },
  banco: { SECCIONES, SECCIONES_EXAMEN, SECCIONES_CALENTAMIENTO, TEMAS, TEXTOS, REACTIVOS },
  armar: {
    corto: (azar, vistos) => armarPorMaterias(BANCO, SECCIONES, azar, vistos, 'medio'),
    examen: (azar, vistos) => armarPorMaterias(BANCO, SECCIONES_EXAMEN, azar, vistos, 'oficial'),
    calentamiento: (azar, vistos) => armarPorMaterias(BANCO, SECCIONES_CALENTAMIENTO, azar, vistos, 'calentamiento'),
  },
  cliente: { examen: 'ECOEMS', escala: 'aciertos', examenReactivos: EXAMEN_REACTIVOS, examenHoras: EXAMEN_HORAS, meta: { inicial: 90, min: 40, max: EXAMEN_REACTIVOS, paso: 1 },
    oficial: 'la UNAM, el IPN ni el ECOEMS', metaNota: 'Ponte una meta de aciertos y mide en cada simulacro qué tan cerca estás. Puedes cambiarla cuando quieras.', regalo: '/tienda/simulador-ecoems-paquete/?regalo=1#comprar' },
  venta: (env, req, url) => paginaVentaSimulador(ECOEMS, VENTA, env, req, url),
});

// ---------- página de venta ----------
// Solo datos verificados en la convocatoria 2026 de «Mi derecho, mi lugar», su catálogo de opciones con examen y la
// DGAE (fuentes en la respuesta de cada pregunta). Nada del proceso 2027: no hay nada publicado.
const SITIO = 'https://vorka.mx';
const IMG = '/assets/tienda';   // estáticas del sitio (assets/tienda/), no en R2
const DESCRIPCION = 'Simulador ECOEMS en línea para entrar a las prepas de la UNAM y del IPN: 128 reactivos en 3 horas, tutor que te da pistas, explicación paso a paso y aciertos estimados por materia.';
const FAQ = [
  { p: '¿Qué es el ECOEMS?', r: 'Es el Espacio de Coordinación que convoca el proceso de ingreso al bachillerato llamado «Mi derecho, mi lugar». Mucha gente le dice «examen ECOEMS» al examen que se presenta dentro de ese proceso.' },
  { p: '¿Quién tiene que presentar el examen?', r: 'Según la convocatoria 2026, el examen solo lo piden las opciones de la UNAM (las 9 Escuelas Nacionales Preparatorias y los 5 Colegios de Ciencias y Humanidades) y del IPN (los CECyT 1 al 15 y 19, y el CET 1), con promedio mínimo de 7.0. Las otras 8 instituciones del proceso son de acceso directo, sin examen.' },
  { p: '¿Cómo es el examen?', r: 'En 2026 fue un examen en línea de 128 reactivos para resolver en 3 horas, sin áreas: todos presentan las mismas materias. El reparto que usa el simulador es de referencia: Habilidad verbal 16, Habilidad matemática 16 y 12 de cada una de estas: Español, Matemáticas, Biología, Física, Química, Historia, Geografía y Formación cívica y ética.' },
  { p: '¿Cuándo es el examen 2027?', r: 'Todavía no hay nada publicado del proceso 2027. Como referencia, en 2026 el examen fue el 20, 21, 27 y 28 de junio, y los resultados se publicaron el 18 de agosto. Consulta siempre la convocatoria vigente en miderechomilugar.gob.mx.' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con reactivos originales que siguen el temario de secundaria y el tipo de preguntas del examen. No está afiliado a la UNAM, al IPN, al ECOEMS ni a la SEP, y los aciertos son una estimación para orientar el estudio.' },
  { p: '¿Qué plan me conviene?', r: `La Práctica ilimitada es para entrenar todos los días: Calentamientos de ${CAL_REACTIVOS} reactivos, simulacros Medios de ${MEDIO_REACTIVOS} y práctica por materia y por tema, sin límite y con tutor. El Simulador completo es para medirse como el día del examen: 2 exámenes completos de ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas, sin pistas. El paquete trae los dos y ahorra dinero.` },
  { p: 'Soy mamá o papá: ¿cómo funciona la compra?', r: 'Pagas una sola vez con tarjeta, OXXO o SPEI y el acceso llega al correo que escribas. Si lo compras para tu hijo o hija, elige Para regalar: te llega una liga que abre su propia cuenta, con su historial y su reporte. Dura un año desde la compra.' },
  { p: '¿Hay reembolso?', r: 'Solo si aún no lo usas: puedes pedirlo dentro de los 5 días hábiles siguientes a tu compra escribiendo a hola@vorka.mx. Una vez que empiezas un simulacro, un examen o una práctica ya no hay reembolso. Si algo falla y no te deja usarlo, lo resolvemos o te devolvemos tu dinero.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador del celular, la tablet o la computadora, sin instalar nada. El historial se guarda en la cuenta durante un año.' },
];
const tablaMaterias = `<table class="sv-tabla sec"><thead><tr><th scope="col">Materia</th><th scope="col" class="num">Examen completo</th><th scope="col" class="num">Simulacro Medio</th><th scope="col">Qué evalúa</th></tr></thead><tbody>${
  SECCIONES_EXAMEN.map((s, i) => `<tr><th scope="row"><span class="sv-dot s-${s.color}"></span>${s.nombre}</th><td class="num">${s.reactivos}</td><td class="num">${SECCIONES[i].reactivos}</td><td>${s.descripcion}</td></tr>`).join('')
}<tr><th scope="row">Total</th><td class="num"><b>${EXAMEN_REACTIVOS} · ${EXAMEN_HORAS} h</b></td><td class="num">${MEDIO_REACTIVOS}</td><td></td></tr></tbody></table>`;
const ej = REACTIVOS.find(r => r.seccion === 'habilidad_matematica' && r.dificultad === 2 && !r.texto && !r.figura && !r.tabla) || REACTIVOS[0];

const VENTA = {
  sku: 'prod_simulador_ecoems', nombreProducto: 'Simulador ECOEMS en línea', descripcion: DESCRIPCION, planInicial: 'practica',
  tituloSEO: 'Simulador ECOEMS 2027 en línea: examen para prepa UNAM e IPN | Vorka México',
  og: `${SITIO}${IMG}/v3/simulador-ecoems-og.jpg`, imagenesLD: [`${SITIO}${IMG}/v3/simulador-ecoems-portada.webp`, `${SITIO}${IMG}/v3/simulador-ecoems-og.jpg`],
  imagenes: { portada: `${IMG}/v3/simulador-ecoems-portada.webp`, og: `${IMG}/v3/simulador-ecoems-og.jpg`, paso1: `${IMG}/v3/simulador-ecoems-paso-reloj.webp`, paso2: `${IMG}/v3/simulador-ecoems-paso-tutor.webp`, reporte: `${IMG}/simulador-ecoems-reporte.png`, regalo: `${IMG}/simulador-ecoems-regalo.png` },
  banco: REACTIVOS.length,
  chip: `Nuevo · ${REACTIVOS.length} reactivos originales`,
  hero: {
    h1: 'Simulador ECOEMS: practica para la prepa de la UNAM y del IPN',
    lead: `Practica con un examen de ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas, con las 10 materias y cronómetro. Si fallas, un tutor te da una pista para intentarlo otra vez; al final, un reporte te dice cuántos aciertos llevas y qué reforzar.`,
    sellos: [`Examen completo: ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas`, 'Habilidades y las 8 materias de secundaria', 'Aciertos estimados por materia', 'En celular o computadora'],
    alt: 'Simulador ECOEMS de Vorka México: pregunta con pista del tutor y reporte de aciertos por materia',
  },
  planesVenta: [
    { k: 'practica', nombre: 'Práctica ilimitada', para: 'Para entrenar todos los días', trae: () => ['Calentamientos y simulacros Medios sin límite', 'Práctica por materia y por tema', 'Tutor con pistas y explicación paso a paso', 'Aciertos estimados y qué reforzar'] },
    { k: 'completo', nombre: 'Simulador completo', para: 'Para medirte como el día del examen', trae: () => [`2 exámenes completos: ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas`, 'Sin pistas: la revisión va al final', 'Aciertos por materia y temas a reforzar'] },
    { k: 'paquete', nombre: 'Paquete completo', para: 'Practica sin límite y cierra con el examen', trae: () => ['Todo lo de la Práctica ilimitada', 'Los 2 exámenes completos', 'Un año de acceso a todo'] },
  ],
  cifras: [[REACTIVOS.length, 'reactivos originales'], [MATERIA.length, 'materias del examen'], [Object.keys(TEMAS).length, 'temas medidos en tu reporte'], [EXAMEN_REACTIVOS, 'reactivos en el examen completo']],
  pasos: [['Contesta como en el examen', 'Las 10 materias con cronómetro, al ritmo de 3 horas para 128 reactivos. El reloj se pausa mientras lees las explicaciones.'], null,
    [null, `Aciertos estimados sobre ${EXAMEN_REACTIVOS}, distancia a tu meta, tus materias fuertes y los temas que más aciertos te cuestan, con práctica dirigida.`]],
  ejemplo: { ...ej, etiqueta: `Habilidad matemática · ${TEMAS[ej.tema]?.nombre || ''}` },
  incluye: [
    { titulo: 'Calentamientos y Medios', tag: 'Práctica ilimitada', texto: `Calentamientos de ${CAL_REACTIVOS} reactivos y simulacros Medios de ${MEDIO_REACTIVOS}, con cronómetro y tutor. Sin límite: cada uno trae preguntas que no has visto.` },
    { titulo: 'Examen completo', tag: 'Simulador completo', oro: true, texto: `2 exámenes de ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas, sin pistas. Al final, tu reporte de aciertos por materia.` },
    { titulo: 'Por materia y por tema', tag: 'Práctica ilimitada', texto: 'Practica cada materia por separado y tus temas débiles todas las veces que quieras.' },
    { titulo: 'Medidor de preparación', texto: 'Una conclusión clara y basada en tus datos: qué tan listo estás y a cuántos aciertos de tu meta.' },
    { titulo: 'Historial en tu cuenta', texto: 'Tu avance se guarda: compara tus simulacros y entra desde cualquier dispositivo durante un año.' },
    { titulo: 'Para regalar', texto: 'Mamá, papá o quien quiera apoyar lo compra y le llega una liga a quien va a presentar, con su propia cuenta.' },
  ],
  comparar: [
    ['Cronómetro en cada simulacro', true, false],
    ['Pista de método cuando fallas (sin darte la respuesta)', true, false],
    ['Explicación paso a paso y la regla detrás', true, 'A veces'],
    ['Aciertos estimados por materia', true, false],
    ['Plan de qué reforzar según tus errores', true, false],
    ['Preguntas nuevas en cada simulacro', true, false],
  ],
  estructura: {
    titulo: 'Las 10 materias del examen',
    lead: `El <b>examen completo</b> tiene ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas, sin áreas. El <b>simulacro Medio</b> es la mitad (${MEDIO_REACTIVOS} reactivos) con el mismo ritmo. Reparto por materia de referencia, tomado de la guía de estudio conjunta de la UNAM y el IPN.`,
    tabla: tablaMaterias,
  },
  faqTitulo: 'Sobre el examen y el simulador',
  faq: FAQ,
  final: 'Haz un Calentamiento hoy para ver qué materias te faltan y, cuando estés listo, el examen completo para medirte como el día del examen.',
  aviso: 'Simulador de práctica de Vorka México con reactivos originales. No está afiliado a la UNAM, al IPN, al ECOEMS ni a la SEP. El reparto por materia es de referencia y los aciertos son una estimación para orientar el estudio. Fuentes: convocatoria 2026 y catálogo de opciones con examen de «Mi derecho, mi lugar» (miderechomilugar.gob.mx) y DGAE de la UNAM.',
};
