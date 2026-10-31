// Simulador UNAM (vorka.mx/simulador-unam): examen de selección de licenciatura de la UNAM.
// 120 reactivos de opción múltiple en 3 horas; las materias y su peso dependen del área. La UNAM no publica el desglose
// oficial por materia: usamos la distribución de referencia en la que coinciden las guías de preparación (cada área suma 120).
// Planes: Práctica, Examen (2 exámenes completos) y Completo (los dos). Adicionales: 1 Medio o 1 examen más.
import { crearSimulador } from './motor.js';
import { paginaVentaSimulador } from './venta.js';
import { armarPorMaterias } from './armar-por-area.js';
import { TEMAS_ESPANOL, TEXTOS_ESPANOL, REACTIVOS_ESPANOL } from './unam/espanol.js';
import { TEMAS_MATEMATICAS, REACTIVOS_MATEMATICAS } from './unam/matematicas.js';
import { TEMAS_FISICA, REACTIVOS_FISICA } from './unam/fisica.js';
import { TEMAS_QUIMICA, REACTIVOS_QUIMICA } from './unam/quimica.js';
import { TEMAS_BIOLOGIA, REACTIVOS_BIOLOGIA } from './unam/biologia.js';
import * as LIT from './unam/literatura.js';
import { TEMAS_GEOGRAFIA, REACTIVOS_GEOGRAFIA } from './unam/geografia.js';
import { TEMAS_HISTORIA_UNIVERSAL, REACTIVOS_HISTORIA_UNIVERSAL } from './unam/historia_universal.js';
import { TEMAS_HISTORIA_MEXICO, REACTIVOS_HISTORIA_MEXICO } from './unam/historia_mexico.js';
import * as FIL from './unam/filosofia.js';

const TEMAS = { ...TEMAS_ESPANOL, ...TEMAS_MATEMATICAS, ...TEMAS_FISICA, ...TEMAS_QUIMICA, ...TEMAS_BIOLOGIA, ...LIT.TEMAS_LITERATURA,
  ...TEMAS_GEOGRAFIA, ...TEMAS_HISTORIA_UNIVERSAL, ...TEMAS_HISTORIA_MEXICO, ...FIL.TEMAS_FILOSOFIA };
const TEXTOS = { ...TEXTOS_ESPANOL, ...(LIT.TEXTOS_LITERATURA || {}), ...(FIL.TEXTOS_FILOSOFIA || {}) };
const REACTIVOS = [...REACTIVOS_MATEMATICAS, ...REACTIVOS_FISICA, ...REACTIVOS_QUIMICA, ...REACTIVOS_BIOLOGIA, ...REACTIVOS_HISTORIA_UNIVERSAL,
  ...REACTIVOS_HISTORIA_MEXICO, ...LIT.REACTIVOS_LITERATURA, ...REACTIVOS_GEOGRAFIA, ...REACTIVOS_ESPANOL, ...FIL.REACTIVOS_FILOSOFIA];

// Materias (orden en que salen en el simulador) y su práctica libre por materia: 10 reactivos a 1.5 min c/u, como el examen
const MIN_POR_REACTIVO = 1.5;
const MATERIA = [
  ['matematicas', 'Matemáticas', 'verde', 'Aritmética, álgebra, geometría, trigonometría, geometría analítica, cálculo y probabilidad.'],
  ['fisica', 'Física', 'tinta', 'Cinemática, dinámica, energía, fluidos, termodinámica, ondas, electromagnetismo, óptica y física moderna.'],
  ['quimica', 'Química', 'oro', 'Materia, átomo, tabla periódica, enlaces, nomenclatura, estequiometría, disoluciones y química orgánica.'],
  ['biologia', 'Biología', 'verde', 'Biomoléculas, célula, metabolismo, genética, evolución, biodiversidad, ecología y cuerpo humano.'],
  ['historia_universal', 'Historia Universal', 'morado', 'De la Antigüedad al mundo contemporáneo: revoluciones, guerras mundiales, Guerra Fría y globalización.'],
  ['historia_mexico', 'Historia de México', 'morado', 'Del México prehispánico al contemporáneo: Nueva España, Independencia, Reforma, Porfiriato y Revolución.'],
  ['literatura', 'Literatura', 'oro', 'Géneros, figuras retóricas, versificación, corrientes literarias y obras y autores clave.'],
  ['geografia', 'Geografía', 'verde', 'Cartografía, dinámica terrestre, clima, hidrosfera, población, economía y geografía de México.'],
  ['espanol', 'Español', 'morado', 'Comprensión de lectura, gramática, ortografía, puntuación, vocabulario y redacción.'],
  ['filosofia', 'Filosofía', 'tinta', 'Lógica, ética, estética e historia de la filosofía (solo Área 4).'],
];
const SECCIONES = MATERIA.map(([id, nombre, color, descripcion]) => ({ id, nombre, color, descripcion, reactivos: 10, minutos: 15 }));

// Reactivos por materia en cada área (examen de 120). Mismo orden que MATERIA.
const DISTRIBUCION = {
  1: { matematicas: 26, fisica: 16, quimica: 10, biologia: 10, historia_universal: 10, historia_mexico: 10, literatura: 10, geografia: 10, espanol: 18 },
  2: { matematicas: 24, fisica: 12, quimica: 13, biologia: 13, historia_universal: 10, historia_mexico: 10, literatura: 10, geografia: 10, espanol: 18 },
  3: { matematicas: 24, fisica: 10, quimica: 10, biologia: 10, historia_universal: 14, historia_mexico: 14, literatura: 10, geografia: 10, espanol: 18 },
  4: { matematicas: 22, fisica: 10, quimica: 10, biologia: 10, historia_universal: 10, historia_mexico: 10, literatura: 10, geografia: 10, espanol: 18, filosofia: 10 },
};
const NOMBRE_AREA = {
  1: 'Área 1 · Ciencias Físico-Matemáticas y de las Ingenierías',
  2: 'Área 2 · Ciencias Biológicas, Químicas y de la Salud',
  3: 'Área 3 · Ciencias Sociales',
  4: 'Área 4 · Humanidades y de las Artes',
};
// Medio = la mitad de cada materia (mismo ritmo); Calentamiento = la cuarta parte, de dificultad básica e intermedia
const specs = (area, f = 1) => MATERIA.map(([id]) => id).filter(id => DISTRIBUCION[area][id]).map(id => ({ id, reactivos: Math.max(f === 1 ? 1 : 2, Math.round(DISTRIBUCION[area][id] * f)) }));
const total = l => l.reduce((t, x) => t + x.reactivos, 0);
const AREAS = Object.keys(DISTRIBUCION).map(a => {
  const ex = specs(a), co = specs(a, 0.5), ca = specs(a, 0.25);
  return { id: a, nombre: NOMBRE_AREA[a], corto: NOMBRE_AREA[a].split(' · ')[1], materias: ex,
    examen: { reactivos: total(ex), minutos: Math.round(total(ex) * MIN_POR_REACTIVO) },
    medio: { reactivos: total(co), minutos: Math.round(total(co) * MIN_POR_REACTIVO) },
    calentamiento: { reactivos: total(ca), minutos: Math.round(total(ca) * MIN_POR_REACTIVO) } };
});
const BANCO = { REACTIVOS, TEXTOS };
const area = a => (DISTRIBUCION[a] ? a : '1');

export const APP = 'simulador-unam';
export const PLANES = { practica: 'simulador-unam-practica', completo: 'simulador-unam-completo', paquete: 'simulador-unam-paquete' };

export const UNAM = crearSimulador({
  app: APP, ruta: '/simulador-unam', cookie: 'vk_unam', firma: APP, nombre: 'UNAM', titulo: 'Simulador UNAM',
  planes: PLANES, slugIntento: 'simulador-unam-intento', slugExamen: 'simulador-unam-examen',
  incluidos: { calentamiento: 0, corto: 0, examen: 0 },
  escala: { tipo: 'aciertos', total: 120 },
  banco: { SECCIONES, SECCIONES_CALENTAMIENTO: SECCIONES, TEMAS, TEXTOS, REACTIVOS, AREAS },
  armar: {
    corto: (azar, vistos, a) => armarPorMaterias(BANCO, specs(area(a), 0.5), azar, vistos, 'medio'),
    examen: (azar, vistos, a) => armarPorMaterias(BANCO, specs(area(a)), azar, vistos, 'oficial'),
    calentamiento: (azar, vistos, a) => armarPorMaterias(BANCO, specs(area(a), 0.25), azar, vistos, 'calentamiento'),
    minutos: (tipo, materia, n) => Math.round(n * MIN_POR_REACTIVO),
  },
  cliente: { examen: 'UNAM', escala: 'aciertos', examenReactivos: 120, examenHoras: 3, meta: { inicial: 84, min: 40, max: 120, paso: 1 },
    oficial: 'la UNAM', regalo: '/tienda/simulador-unam-paquete/?regalo=1#comprar' },
  venta: (env, req, url) => paginaVentaSimulador(UNAM, VENTA, env, req, url),
});

// ---------- página de venta ----------
const SITIO = 'https://vorka.mx';
const IMG = '/assets/tienda';   // estáticas del sitio (assets/tienda/), no en R2
const DESCRIPCION = 'Simulador del examen UNAM en línea para las 4 áreas: 120 reactivos en 3 horas, tutor con pistas, explicación paso a paso y aciertos por materia.';
const FAQ = [
  { p: '¿Cómo es el examen de admisión a licenciatura de la UNAM?', r: 'Es un examen de 120 reactivos de opción múltiple que se resuelve en 3 horas. Hay cuatro áreas de conocimiento y cada una pesa distinto las materias: por ejemplo, el Área 1 tiene más Matemáticas y Física, y el Área 4 incluye Filosofía. El simulador arma tu examen según el área que elijas.' },
  { p: '¿Cuáles son las cuatro áreas?', r: 'Área 1: Ciencias Físico-Matemáticas y de las Ingenierías. Área 2: Ciencias Biológicas, Químicas y de la Salud. Área 3: Ciencias Sociales. Área 4: Humanidades y de las Artes. Tu área depende de la carrera que elijas.' },
  { p: '¿Cuántos reactivos hay de cada materia?', r: 'La UNAM no publica un desglose oficial por materia. El simulador usa la distribución de referencia en la que coinciden las guías de preparación: Español siempre 18 y Matemáticas entre 22 y 26, según el área; el resto se reparte entre Física, Química, Biología, Historia Universal, Historia de México, Literatura, Geografía y, en el Área 4, Filosofía.' },
  { p: '¿Cuántos aciertos necesito para entrar?', r: 'No hay un mínimo fijo: la UNAM asigna los lugares por número de aciertos hasta cubrir el cupo de cada carrera y plantel, así que cambia cada año. Revisa los resultados de concursos anteriores de tu carrera, ponlo como meta en el simulador y mide qué tan cerca estás.' },
  { p: '¿Cuándo es el examen?', r: 'En el concurso 2026, según el calendario oficial de la DGAE, la convocatoria se publicó el 12 de enero, el registro fue del 23 de enero al 3 de febrero y el examen del 23 de mayo al 10 de junio. Consulta siempre la convocatoria vigente en dgae.unam.mx.' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con reactivos originales que siguen el temario y el tipo de preguntas del examen. No está afiliado a la UNAM y los aciertos son una estimación para orientar tu estudio.' },
  { p: '¿Cuál es la diferencia entre los planes?', r: 'Práctica es para entrenar: Calentamientos, simulacros Medios de 60 reactivos y práctica por materia y por tema, sin límite y con tutor; no incluye los exámenes completos. Examen es para medirte como el día del examen: 2 exámenes completos de 120 reactivos en 3 horas, de tu área: el primero con tutor y el segundo sin pistas, como el día del examen; no incluye la práctica ilimitada. Completo trae las dos cosas y cuesta menos que comprarlas por separado: es el que recomendamos, porque practicar sin medirte no te dice si ya estás listo y medirte sin practicar no te ayuda a subir.' },
  { p: '¿Hay reembolso?', r: 'Solo si aún no lo usas: puedes pedirlo dentro de los 5 días hábiles siguientes a tu compra escribiendo a hola@vorka.mx. Una vez que empiezas un simulacro, un examen o una práctica ya no hay reembolso. Si algo falla y no te deja usarlo, lo resolvemos o te devolvemos tu dinero.' },
  { p: '¿Lo puedo regalar?', r: 'Sí. Al comprar elige Para regalar y cuántos: te llega una liga por cada regalo. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador de tu celular, tablet o computadora, sin instalar nada. Tu historial se guarda en tu cuenta durante 6 meses.' },
];
const tablaAreas = `<table class="sv-tabla"><thead><tr><th scope="col">Materia</th>${AREAS.map(a => `<th scope="col" class="num">Área ${a.id}</th>`).join('')}</tr></thead><tbody>${
  MATERIA.map(([id, nombre, color]) => `<tr><th scope="row"><span class="sv-dot s-${color}"></span>${nombre}</th>${AREAS.map(a => `<td class="num">${DISTRIBUCION[a.id][id] || '—'}</td>`).join('')}</tr>`).join('')
}<tr><th scope="row">Total</th>${AREAS.map(() => '<td class="num"><b>120 · 3 h</b></td>').join('')}</tr></tbody></table>`;
const ej = REACTIVOS.find(r => r.seccion === 'quimica' && r.dificultad === 2 && !r.texto && !r.figura) || REACTIVOS[0];

const VENTA = {
  sku: 'prod_simulador_unam', nombreProducto: 'Simulador UNAM en línea', descripcion: DESCRIPCION, planInicial: 'paquete',
  tituloSEO: 'Simulador examen UNAM 2027 en línea: las 4 áreas | Vorka México',
  og: `${SITIO}${IMG}/v3/simulador-unam-og.jpg`, imagenesLD: [`${SITIO}${IMG}/v3/simulador-unam-portada.webp`, `${SITIO}${IMG}/v3/simulador-unam-og.jpg`],
  imagenes: { portada: `${IMG}/v3/simulador-unam-portada.webp`, og: `${IMG}/v3/simulador-unam-og.jpg`, paso1: `${IMG}/v3/simulador-unam-paso-reloj.webp`, paso2: `${IMG}/v3/simulador-unam-paso-tutor.webp`, reporte: `${IMG}/simulador-unam-reporte.png`, regalo: `${IMG}/simulador-unam-regalo.png` },
  banco: REACTIVOS.length,
  chip: `Nuevo · ${REACTIVOS.length} reactivos originales · 4 áreas`,
  hero: {
    h1: 'Simulador del examen UNAM: practica para tu área como el día del examen',
    lead: 'Elige tu área y practica con 120 reactivos en 3 horas, con el peso de cada materia de tu área. Si fallas, un tutor te da una pista para intentarlo otra vez; al final, un reporte te dice cuántos aciertos llevas y qué reforzar.',
    sellos: ['Las 4 áreas de licenciatura', 'Examen completo: 120 reactivos en 3 horas', 'Aciertos estimados por materia', 'En celular o computadora'],
    alt: 'Simulador UNAM de Vorka México: pregunta con pista del tutor y reporte de aciertos por materia',
  },
  planesVenta: [
    { k: 'practica', nombre: 'Práctica', para: 'Solo entrenar, sin límite y con tutor', falta: 'No incluye los exámenes completos', trae: () => ['Calentamientos y simulacros Medios sin límite', 'Práctica por materia y por tema', 'Tutor con pistas y explicación paso a paso', 'Aciertos estimados y qué reforzar'] },
    { k: 'completo', nombre: 'Examen', para: 'Solo medirte: 2 exámenes completos como el real', falta: 'No incluye la práctica ilimitada', trae: () => ['2 exámenes completos de tu área: 120 reactivos en 3 horas', 'El 1.º con tutor para entrenar; el 2.º sin pistas, como el día del examen', 'Aciertos por materia y temas a reforzar', 'Cambia de área cuando quieras'] },
    { k: 'paquete', nombre: 'Completo', para: 'Práctica sin límite + los 2 exámenes completos', trae: () => ['Todo lo del plan Práctica: entrenas sin límite con tutor', 'Todo lo del plan Examen: Los 2 exámenes completos de 3 horas', '6 meses de acceso a todo'] },
  ],
  diferencias: [
    ['Calentamientos y simulacros Medios sin límite', true, false, true],
    ['Práctica por materia y por tema', true, false, true],
    ['Tutor con pistas y solución paso a paso', true, 'En el 1.er examen', true],
    ['2 exámenes completos con cronómetro', false, true, true],
    ['Aciertos estimados y qué reforzar', true, true, true],
  ],
  cifras: [[REACTIVOS.length, 'reactivos originales'], [10, 'materias del examen'], [Object.keys(TEMAS).length, 'temas medidos en tu reporte'], [120, 'reactivos en el examen completo']],
  pasos: [['Contesta como en el examen', 'Las materias de tu área con su peso y el mismo tiempo por pregunta que el examen real (1.5 minutos). El reloj se pausa mientras lees las explicaciones.'], null,
    [null, 'Aciertos estimados sobre 120, distancia a tu meta, tus materias fuertes y los temas que más aciertos te cuestan, con práctica dirigida.']],
  ejemplo: { ...ej, etiqueta: `Química · ${TEMAS[ej.tema]?.nombre || ''}` },
  incluye: [
    { titulo: 'Elige tu área', texto: 'El simulador arma cada examen con las materias y el peso del área de tu carrera. Puedes cambiar de área cuando quieras.' },
    { titulo: 'Calentamientos y Medios', tag: 'Práctica', texto: 'Calentamientos de unos 30 reactivos y simulacros Medios de 60, con cronómetro y tutor. Sin límite: cada uno trae preguntas que no has visto.' },
    { titulo: 'Examen completo', tag: 'Examen', oro: true, texto: '2 exámenes de 120 reactivos en 3 horas, con la distribución de tu área: el primero con tutor y el segundo sin pistas, como el día del examen. Al final, tu reporte de aciertos.' },
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
    lead: 'El <b>examen completo</b> tiene 120 reactivos en 3 horas con el peso de tu área. El <b>simulacro Medio</b> es la mitad (60 reactivos en 90 minutos) con el mismo ritmo. Distribución de referencia: la UNAM no publica un desglose oficial por materia.',
    tabla: tablaAreas,
  },
  faqTitulo: 'Sobre el examen UNAM y el simulador',
  faq: FAQ,
  final: 'Haz un simulacro Medio hoy para ver en hora y media qué materias te faltan y, cuando estés listo, el examen completo de tu área con el tiempo real.',
  aviso: 'Simulador de práctica de Vorka México con reactivos originales. No está afiliado a la UNAM. La distribución por materia es de referencia y los aciertos son una estimación para orientar tu estudio.',
};
