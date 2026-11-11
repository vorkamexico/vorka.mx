// Simulador EXANI-II (vorka.mx/simulador-exani-ii): el examen de admisión a licenciatura de CENEVAL que usan muchas
// universidades públicas. UN solo simulador para todas: el estudiante elige los dos módulos que le pide su universidad y
// carrera, y las páginas por universidad (exani-universidades.js) le dicen cuáles son.
// Datos verificados (10-nov-2026) en ceneval.edu.mx/examenes-ingreso-exani_ii/: una sesión de 4 h 30 min, tres opciones
// por reactivo; Comprensión lectora 30, Redacción indirecta 30, Pensamiento matemático 30 y dos módulos de conocimientos
// disciplinares de 24 (el puntaje global sale de esos 138), más Inglés 30 como información diagnóstica (total 168).
// 16 módulos específicos (la universidad elige dos según la carrera) o los 2 generales juntos.
// Módulos del banco (v1): los 2 generales y los 8 específicos que más pide la UANL en su tabla de noviembre de 2026
// (uanl.mx › Tipos_de_examen_2026_nov_v5.pdf). Las parejas (AREAS) son las que piden de verdad las universidades.
// Banco: reactivos 100 % originales de Vorka, de tres opciones, nivel bachillerato (exani-ii/INSTRUCCIONES.md).
// Planes: Práctica ($149), Examen ($199: 2 exámenes completos) y Completo ($299). Adicionales: 1 Medio ($49) o 1 examen ($79).
import { crearSimulador } from './motor.js';
import { paginaVentaSimulador } from './venta.js';
import { armarPorMaterias } from './armar-por-area.js';
import { TEMAS_COMPRENSION_LECTORA, TEXTOS_COMPRENSION_LECTORA, REACTIVOS_COMPRENSION_LECTORA } from './exani-ii/comprension_lectora.js';
import { TEMAS_REDACCION_INDIRECTA, REACTIVOS_REDACCION_INDIRECTA } from './exani-ii/redaccion_indirecta.js';
import { TEMAS_PENSAMIENTO_MATEMATICO, REACTIVOS_PENSAMIENTO_MATEMATICO } from './exani-ii/pensamiento_matematico.js';
import { TEMAS_INGLES, TEXTOS_INGLES, REACTIVOS_INGLES } from './exani-ii/ingles.js';
import { TEMAS_CIENCIAS_EXPERIMENTALES, REACTIVOS_CIENCIAS_EXPERIMENTALES } from './exani-ii/ciencias_experimentales.js';
import { TEMAS_CIENCIAS_SOCIALES, REACTIVOS_CIENCIAS_SOCIALES } from './exani-ii/ciencias_sociales.js';
import { TEMAS_BIOLOGIA, REACTIVOS_BIOLOGIA } from './exani-ii/biologia.js';
import { TEMAS_CIENCIAS_SALUD, REACTIVOS_CIENCIAS_SALUD } from './exani-ii/ciencias_salud.js';
import { TEMAS_QUIMICA, REACTIVOS_QUIMICA } from './exani-ii/quimica.js';
import { TEMAS_FISICA, REACTIVOS_FISICA } from './exani-ii/fisica.js';
import { TEMAS_ARITMETICA, REACTIVOS_ARITMETICA } from './exani-ii/aritmetica.js';
import { TEMAS_PROBABILIDAD_ESTADISTICA, REACTIVOS_PROBABILIDAD_ESTADISTICA } from './exani-ii/probabilidad_estadistica.js';
import { TEMAS_ADMINISTRACION, REACTIVOS_ADMINISTRACION } from './exani-ii/administracion.js';
import { TEMAS_HISTORIA, REACTIVOS_HISTORIA } from './exani-ii/historia.js';

const TEMAS = { ...TEMAS_COMPRENSION_LECTORA, ...TEMAS_REDACCION_INDIRECTA, ...TEMAS_PENSAMIENTO_MATEMATICO, ...TEMAS_INGLES,
  ...TEMAS_CIENCIAS_EXPERIMENTALES, ...TEMAS_CIENCIAS_SOCIALES, ...TEMAS_BIOLOGIA, ...TEMAS_CIENCIAS_SALUD, ...TEMAS_QUIMICA,
  ...TEMAS_FISICA, ...TEMAS_ARITMETICA, ...TEMAS_PROBABILIDAD_ESTADISTICA, ...TEMAS_ADMINISTRACION, ...TEMAS_HISTORIA };
const TEXTOS = { ...TEXTOS_COMPRENSION_LECTORA, ...TEXTOS_INGLES };
const REACTIVOS = [...REACTIVOS_COMPRENSION_LECTORA, ...REACTIVOS_REDACCION_INDIRECTA, ...REACTIVOS_PENSAMIENTO_MATEMATICO,
  ...REACTIVOS_INGLES, ...REACTIVOS_CIENCIAS_EXPERIMENTALES, ...REACTIVOS_CIENCIAS_SOCIALES, ...REACTIVOS_BIOLOGIA,
  ...REACTIVOS_CIENCIAS_SALUD, ...REACTIVOS_QUIMICA, ...REACTIVOS_FISICA, ...REACTIVOS_ARITMETICA,
  ...REACTIVOS_PROBABILIDAD_ESTADISTICA, ...REACTIVOS_ADMINISTRACION, ...REACTIVOS_HISTORIA];

// ---------- secciones ----------
// [id, nombre, color, qué evalúa, reactivos en el examen, fracción en lecturas]
const COMUNES = [
  ['comprension_lectora', 'Comprensión lectora', 'morado', 'Textos académicos, literarios y de opinión: identificar información, interpretar y evaluar la forma y el contenido.', 30, 1],
  ['redaccion_indirecta', 'Redacción indirecta', 'tinta', 'Elegir la mejor forma de escribir: orden y propósito de las ideas, gramática, precisión de las palabras y ortografía.', 30, 0],
  ['pensamiento_matematico', 'Pensamiento matemático', 'verde', 'Aritmética, álgebra, funciones, geometría, estadística y probabilidad aplicadas a problemas.', 30, 0],
];
const INGLES = ['ingles', 'Inglés', 'oro', 'Nivel B1: leer textos de uso cotidiano y académico, y completar mensajes y reportes. Es diagnóstico: no entra al puntaje global.', 30, 0.5];
// Módulos de conocimientos disciplinares: 24 reactivos cada uno. [id, nombre, color, qué evalúa]
export const MODULOS = [
  ['ciencias_experimentales', 'Ciencias experimentales', 'verde', 'Módulo general: biología, química y física de bachillerato, con énfasis en interpretar datos y experimentos.'],
  ['ciencias_sociales', 'Ciencias sociales', 'morado', 'Módulo general: historia, geografía, formación cívica, economía y sociedad.'],
  ['biologia', 'Biología', 'verde', 'Célula, metabolismo, genética, evolución y ecología.'],
  ['ciencias_salud', 'Ciencias de la salud', 'oro', 'Cuerpo humano, salud pública, nutrición, microorganismos e inmunidad.'],
  ['quimica', 'Química', 'oro', 'Materia, átomo y tabla periódica, enlaces y nomenclatura, reacciones y estequiometría, disoluciones.'],
  ['fisica', 'Física', 'tinta', 'Cinemática, dinámica y energía, fluidos y calor, ondas y óptica, electricidad y magnetismo.'],
  ['aritmetica', 'Aritmética', 'verde', 'Números y divisibilidad, fracciones y decimales, proporción, porcentajes, potencias y raíces.'],
  ['probabilidad_estadistica', 'Probabilidad y estadística', 'tinta', 'Estadística descriptiva, dispersión, técnicas de conteo y probabilidad.'],
  ['administracion', 'Administración', 'morado', 'Fundamentos, proceso administrativo, la empresa y sus áreas, costos y finanzas básicas.'],
  ['historia', 'Historia', 'morado', 'Historia de México de Mesoamérica a nuestros días e historia universal moderna y contemporánea.'],
];
const MOD = Object.fromEntries(MODULOS.map(m => [m[0], m]));
export const NOMBRE_MODULO = Object.fromEntries(MODULOS.map(m => [m[0], m[1]]));
const MODULO_REACTIVOS = 24;

// Parejas de módulos que se pueden elegir: [id, módulo 1, módulo 2]. Las de la UANL (tabla oficial de nov 2026) y los
// módulos generales; las que empiezan con un módulo general sirven para practicar la BUAP (su segundo módulo es de área
// y no tiene equivalente exacto: lo dice su página).
export const PAREJAS = [
  ['generales', 'ciencias_experimentales', 'ciencias_sociales'],
  ['bio-sal', 'biologia', 'ciencias_salud'],
  ['bio-qui', 'biologia', 'quimica'],
  ['qui-sal', 'quimica', 'ciencias_salud'],
  ['ari-fis', 'aritmetica', 'fisica'],
  ['ari-qui', 'aritmetica', 'quimica'],
  ['ari-bio', 'aritmetica', 'biologia'],
  ['ari-pye', 'aritmetica', 'probabilidad_estadistica'],
  ['ari-his', 'aritmetica', 'historia'],
  ['adm-pye', 'administracion', 'probabilidad_estadistica'],
  ['adm-his', 'administracion', 'historia'],
  ['cex-sal', 'ciencias_experimentales', 'ciencias_salud'],
  ['cex-fis', 'ciencias_experimentales', 'fisica'],
  ['cso-adm', 'ciencias_sociales', 'administracion'],
  ['cso-his', 'ciencias_sociales', 'historia'],
];
export const nombrePareja = id => { const p = PAREJAS.find(x => x[0] === id); return p ? `${NOMBRE_MODULO[p[1]]} + ${NOMBRE_MODULO[p[2]]}` : ''; };

const EXAMEN_MINUTOS = 270;
const EXAMEN_REACTIVOS = COMUNES.reduce((t, s) => t + s[4], 0) + 2 * MODULO_REACTIVOS + INGLES[4];   // 168
const GLOBAL_REACTIVOS = EXAMEN_REACTIVOS - INGLES[4];   // 138
const MIN_POR_REACTIVO = EXAMEN_MINUTOS / EXAMEN_REACTIVOS;
const sec = ([id, nombre, color, descripcion, , lecturas = 0], reactivos) => ({ id, nombre, color, descripcion, reactivos, lecturas, minutos: Math.round(reactivos * MIN_POR_REACTIVO) });
// Práctica libre por sección: 10 reactivos al ritmo del examen
const SECCIONES = [...COMUNES, ...MODULOS, INGLES].map(s => sec(s, 10));
const LECTURAS = Object.fromEntries([...COMUNES, INGLES].map(s => [s[0], s[5]]));
// Examen de una pareja: las 3 áreas comunes, sus 2 módulos y el Inglés, en el orden del examen. f: fracción (Medio ½, Calentamiento ¼)
const specs = (pareja, f = 1) => {
  const p = PAREJAS.find(x => x[0] === pareja) || PAREJAS[0];
  const filas = [...COMUNES.map(s => [s[0], s[4]]), [p[1], MODULO_REACTIVOS], [p[2], MODULO_REACTIVOS], [INGLES[0], INGLES[4]]];
  return filas.map(([id, n]) => ({ id, lecturas: LECTURAS[id] || 0, reactivos: Math.max(2, Math.round(n * f)) }));
};
const total = l => l.reduce((t, x) => t + x.reactivos, 0);
const AREAS = PAREJAS.map(([id, m1, m2]) => {
  const ex = specs(id), me = specs(id, 0.5), ca = specs(id, 0.25);
  return { id, nombre: `${NOMBRE_MODULO[m1]} y ${NOMBRE_MODULO[m2]}`, corto: `${NOMBRE_MODULO[m1]} + ${NOMBRE_MODULO[m2]}`, materias: ex,
    examen: { reactivos: total(ex), minutos: Math.round(total(ex) * MIN_POR_REACTIVO) },
    medio: { reactivos: total(me), minutos: Math.round(total(me) * MIN_POR_REACTIVO) },
    calentamiento: { reactivos: total(ca), minutos: Math.round(total(ca) * MIN_POR_REACTIVO) } };
});
const BANCO = { REACTIVOS, TEXTOS };
const pareja = a => (PAREJAS.some(x => x[0] === a) ? a : PAREJAS[0][0]);
const MEDIO_REACTIVOS = AREAS[0].medio.reactivos, CAL_REACTIVOS = AREAS[0].calentamiento.reactivos;

export const APP = 'simulador-exani-ii';
export const RUTA = '/simulador-exani-ii';
export const PLANES = { practica: 'simulador-exani-ii-practica', completo: 'simulador-exani-ii-completo', paquete: 'simulador-exani-ii-paquete' };

export const EXANI_II = crearSimulador({
  app: APP, ruta: RUTA, cookie: 'vk_exani2', firma: APP, nombre: 'EXANI-II', titulo: 'Simulador EXANI-II',
  planes: PLANES, slugIntento: 'simulador-exani-ii-intento', slugExamen: 'simulador-exani-ii-examen',
  incluidos: { calentamiento: 0, corto: 0, examen: 0 },
  escala: { tipo: 'aciertos', total: EXAMEN_REACTIVOS },
  // Diagnóstico gratis: 12 preguntas de las 4 secciones que presenta todo mundo (los módulos dependen de la carrera)
  banco: { SECCIONES, SECCIONES_CALENTAMIENTO: SECCIONES, SECCIONES_DIAGNOSTICO: SECCIONES.filter(s => [...COMUNES.map(c => c[0]), 'ingles'].includes(s.id)), TEMAS, TEXTOS, REACTIVOS, AREAS },
  armar: {
    corto: (azar, vistos, a) => armarPorMaterias(BANCO, specs(pareja(a), 0.5), azar, vistos, 'medio'),
    examen: (azar, vistos, a) => armarPorMaterias(BANCO, specs(pareja(a)), azar, vistos, 'oficial'),
    calentamiento: (azar, vistos, a) => armarPorMaterias(BANCO, specs(pareja(a), 0.25), azar, vistos, 'calentamiento'),
    minutos: (tipo, materia, n) => Math.round(n * MIN_POR_REACTIVO),
  },
  cliente: { examen: 'EXANI-II', escala: 'aciertos', examenReactivos: EXAMEN_REACTIVOS, examenHoras: EXAMEN_MINUTOS / 60,
    meta: { inicial: 110, min: 60, max: EXAMEN_REACTIVOS, paso: 1 },
    globalSin: ['ingles'], globalSinNombre: 'Sin Inglés, como el puntaje global',
    oficial: 'CENEVAL ni de ninguna universidad', regalo: '/tienda/simulador-exani-ii-paquete/?regalo=1#comprar',
    metaNota: 'Cada universidad decide con cuánto entra cada carrera y cambia cada año. Ponte una meta de aciertos y mide en cada simulacro qué tan cerca estás.' },
  venta: (env, req, url) => paginaVentaSimulador(EXANI_II, VENTA, env, req, url),
});

// ---------- página de venta ----------
const SITIO = 'https://vorka.mx';
const IMG = '/assets/tienda';
const HORAS = '4 horas y media';
const DESCRIPCION = `Simulador del EXANI-II en línea para licenciatura: ${EXAMEN_REACTIVOS} reactivos en ${HORAS}, los módulos que pide tu universidad, tutor con pistas y aciertos por área.`;
const FAQ = [
  { p: '¿Qué es el EXANI-II?', r: `Es el examen de admisión a licenciatura de CENEVAL. Lo usan muchas universidades públicas, entre ellas la BUAP, la UANL, la UADY, la UAA y la UAdeC. Según la página oficial de CENEVAL, se presenta en una sola sesión de máximo ${HORAS} y cada pregunta tiene tres opciones. Cada universidad publica su propia convocatoria con fechas, sedes y costo.` },
  { p: '¿Qué viene en el examen?', r: 'Tres áreas para todos: Comprensión lectora (30 reactivos), Redacción indirecta (30) y Pensamiento matemático (30). Dos módulos de conocimientos disciplinares de 24 reactivos, que elige tu universidad según la carrera. Y Inglés (30), que es diagnóstico. El puntaje global sale de las tres áreas y los dos módulos: 138 reactivos.' },
  { p: '¿Cuáles módulos me tocan?', r: 'Los elige tu universidad según tu carrera. Por ejemplo, en la UANL Medicina pide Biología y Ciencias de la salud, y Contaduría pide Administración y Probabilidad y estadística. En <a href="/simulador-exani-ii/universidades/">¿Cuál te sirve?</a> eliges tu universidad y te decimos qué módulos pide, con la fuente oficial. Dentro del simulador cambias tus módulos cuando quieras.' },
  { p: '¿Qué módulos trae el simulador?', r: `Los 2 módulos generales (Ciencias experimentales y Ciencias sociales) y 8 específicos: Biología, Ciencias de la salud, Química, Física, Aritmética, Probabilidad y estadística, Administración e Historia. Son los que más piden las universidades. Si tu carrera pide otro (por ejemplo Derecho o Psicología), practica las tres áreas comunes y el Inglés, que son ${COMUNES.reduce((t, s) => t + s[4], 0) + INGLES[4]} de los ${EXAMEN_REACTIVOS} reactivos, y escríbenos: estamos sumando módulos.` },
  { p: '¿Sirve para la BUAP?', r: 'Sí, con un matiz. La BUAP aplica el EXANI-II-EPIU desde casa: las tres áreas comunes, el Inglés, uno de los módulos generales (Ciencias sociales o Ciencias experimentales), un módulo propio del área de tu carrera y una sección de habilidades blandas. El simulador trae las tres áreas, el Inglés y los dos módulos generales tal cual; el módulo de área de la BUAP no tiene equivalente exacto, así que te sugerimos el más cercano. Los detalles están en <a href="/simulador-exani-ii/buap/">EXANI-II BUAP</a>.' },
  { p: '¿Cuántos aciertos necesito?', r: 'No hay un número único: cada universidad pone su corte y cambia cada año y por carrera. El simulador te da tus aciertos totales y, aparte, los aciertos sin Inglés, que es lo que cuenta para el puntaje global. Ponte una meta y mide qué tan cerca estás en cada simulacro.' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura del EXANI-II y el temario de bachillerato. No está afiliado a CENEVAL ni a ninguna universidad, y los aciertos son una estimación para orientar tu estudio: no es el Índice CENEVAL.' },
  { p: '¿Cuál es la diferencia entre los planes?', r: `Práctica es para entrenar: Calentamientos de unos ${CAL_REACTIVOS} reactivos, simulacros Medios de unos ${MEDIO_REACTIVOS} y práctica por área, módulo y tema, sin límite y con tutor; no incluye los exámenes completos. Examen es para medirte como el día del examen: 2 exámenes completos de ${EXAMEN_REACTIVOS} reactivos en ${HORAS} con tus módulos: el primero con tutor y el segundo sin pistas. Completo trae las dos cosas, más plan de estudio, recordatorios y apuntes, y cuesta menos que comprarlas por separado.` },
  { p: '¿Hay reembolso?', r: 'Solo si aún no lo usas: puedes pedirlo dentro de los 5 días hábiles siguientes a tu compra escribiendo a hola@vorka.mx. Una vez que empiezas un simulacro, un examen o una práctica ya no hay reembolso. Si algo falla y no te deja usarlo, lo resolvemos o te devolvemos tu dinero.' },
  { p: '¿Lo puedo regalar?', r: 'Sí. Al comprar elige Para regalar y cuántos: te llega una liga por cada regalo. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador de tu celular, tablet o computadora, y con el plan Completo lo puedes instalar como app. Tu historial se guarda en tu cuenta durante 6 meses.' },
];
const filaSec = ([id, nombre, color, descripcion, n]) => `<tr><th scope="row"><span class="sv-dot s-${color}"></span>${nombre}</th><td class="num">${n}</td><td class="num">${Math.round(n / 2)}</td><td>${descripcion}</td></tr>`;
const tablaAreas = `<table class="sv-tabla sec"><thead><tr><th scope="col">Área</th><th scope="col" class="num">Examen completo</th><th scope="col" class="num">Simulacro Medio</th><th scope="col">Qué evalúa</th></tr></thead><tbody>${
  COMUNES.map(filaSec).join('')}${
  filaSec(['modulos', 'Tus 2 módulos', 'oro', `Los que pide tu universidad para tu carrera, 24 reactivos cada uno. En el simulador: ${MODULOS.map(m => m[1]).join(', ')}.`, 2 * MODULO_REACTIVOS])}${
  filaSec(INGLES)
}<tr><th scope="row">Total</th><td class="num"><b>${EXAMEN_REACTIVOS} · 4.5&nbsp;h</b></td><td class="num">${MEDIO_REACTIVOS}</td><td>Puntaje global: los ${GLOBAL_REACTIVOS} reactivos sin Inglés.</td></tr></tbody></table>`;
const ej = REACTIVOS.find(r => r.seccion === 'pensamiento_matematico' && r.dificultad === 2 && !r.texto && !r.figura && !r.tabla) || REACTIVOS[0];

const VENTA = {
  sku: 'prod_simulador_exani_ii', nombreProducto: 'Simulador EXANI-II en línea', descripcion: DESCRIPCION, planInicial: 'paquete',
  tituloSEO: 'Simulador EXANI-II 2027 en línea: BUAP, UANL, UADY y más | Vorka México',
  og: `${SITIO}${IMG}/v3/simulador-exani-ii-og.jpg`, imagenesLD: [`${SITIO}${IMG}/v3/simulador-exani-ii-portada.webp`, `${SITIO}${IMG}/v3/simulador-exani-ii-og.jpg`],
  imagenes: { portada: `${IMG}/v3/simulador-exani-ii-portada.webp`, og: `${IMG}/v3/simulador-exani-ii-og.jpg`, paso1: `${IMG}/v3/simulador-exani-ii-paso-reloj.webp`, paso2: `${IMG}/v3/simulador-exani-ii-paso-tutor.webp`, reporte: `${IMG}/simulador-exani-ii-reporte.png`, regalo: `${IMG}/simulador-exani-ii-regalo.png` },
  banco: REACTIVOS.length,
  chip: `Nuevo · ${REACTIVOS.length} reactivos originales · ${MODULOS.length} módulos`,
  hero: {
    h1: 'Simulador EXANI-II: un solo simulador para tu universidad',
    lead: `Elige los módulos que pide tu universidad y practica con ${EXAMEN_REACTIVOS} reactivos de tres opciones en ${HORAS}, como el examen real. Si fallas, un tutor te da una pista para intentarlo otra vez; al final, un reporte te dice cuántos aciertos llevas y qué reforzar.`,
    sellos: [`Examen completo: ${EXAMEN_REACTIVOS} reactivos en ${HORAS}`, `${MODULOS.length} módulos para elegir los tuyos`, 'Aciertos con y sin Inglés', 'En celular o computadora'],
    alt: 'Simulador EXANI-II de Vorka México: pregunta con pista del tutor y reporte de aciertos por área',
  },
  queEs: {
    apoyo: `Elige los módulos que pide tu universidad y practica con ${EXAMEN_REACTIVOS} reactivos en ${HORAS}.`,
    texto: 'Un examen de práctica en línea para el EXANI-II de CENEVAL, el examen de admisión a licenciatura de la BUAP, la UANL, la UADY y muchas universidades más. Las tres áreas comunes, el Inglés y los dos módulos de tu carrera, con tres opciones por pregunta. <b>Si fallas, un tutor te da una pista</b> para intentarlo otra vez; al final, un reporte te dice cuántos aciertos llevas y qué reforzar.',
    para: [['Si vas a presentar el EXANI-II', 'No sabes cuántos aciertos sacarías hoy con tus módulos.'], ['Si no sabes qué examen te toca', 'En ¿Cuál te sirve? eliges tu universidad y te decimos qué examen y qué módulos pide.'], ['Mamá, papá o quien quiera apoyar', 'Quieres regalarle algo que de verdad le ayude a prepararse.']],
  },
  planesVenta: [
    { k: 'practica', nombre: 'Práctica', para: 'Solo entrenar, sin límite y con tutor', falta: 'No incluye los exámenes completos', trae: () => ['Calentamientos y simulacros Medios sin límite', 'Práctica por área, módulo y tema', 'Tutor con pistas y explicación paso a paso', 'Aciertos estimados y qué reforzar'] },
    { k: 'completo', nombre: 'Examen', para: 'Solo medirte: 2 exámenes completos como el real', falta: 'No incluye la práctica ilimitada', trae: () => [`2 exámenes completos con tus módulos: ${EXAMEN_REACTIVOS} reactivos en ${HORAS}`, 'El 1.º con tutor para entrenar; el 2.º sin pistas, como el día del examen', 'Aciertos por área y temas a reforzar', 'Cambia de módulos cuando quieras'] },
    { k: 'paquete', nombre: 'Completo', para: 'Práctica sin límite + los 2 exámenes completos', trae: () => ['Todo lo del plan Práctica: entrenas sin límite con tutor', 'Todo lo del plan Examen: los 2 exámenes completos', 'Plan de estudio con recordatorios, apuntes y app en tu celular', '6 meses de acceso a todo'] },
  ],
  diferencias: [
    ['Calentamientos y simulacros Medios sin límite', true, false, true],
    ['Práctica por área, módulo y tema', true, false, true],
    ['Tutor con pistas y solución paso a paso', true, 'En el 1.er examen', true],
    ['2 exámenes completos con cronómetro', false, true, true],
    ['Plan de estudio, recordatorios y apuntes', false, false, true],
    ['Aciertos estimados y qué reforzar', true, true, true],
  ],
  cifras: [[REACTIVOS.length, 'reactivos originales'], [MODULOS.length, 'módulos para elegir'], [Object.keys(TEMAS).length, 'temas medidos en tu reporte'], [EXAMEN_REACTIVOS, 'reactivos en el examen completo']],
  pasos: [['Contesta como en el examen', `Las tres áreas, tus dos módulos y el Inglés, al ritmo de ${HORAS} para ${EXAMEN_REACTIVOS} reactivos. El reloj se pausa mientras lees las explicaciones.`], null,
    [null, `Aciertos estimados sobre ${EXAMEN_REACTIVOS} y sin Inglés sobre ${GLOBAL_REACTIVOS}, tus áreas fuertes y los temas que más aciertos te cuestan, con práctica dirigida.`]],
  ejemplo: { ...ej, etiqueta: `Pensamiento matemático · ${TEMAS[ej.tema]?.nombre || ''}` },
  incluye: [
    { titulo: 'Elige tus módulos', texto: `${PAREJAS.length} parejas de módulos, las que piden de verdad las universidades. Cambia cuando quieras.` },
    { titulo: 'Calentamientos y Medios', tag: 'Práctica', texto: `Calentamientos de unos ${CAL_REACTIVOS} reactivos y simulacros Medios de unos ${MEDIO_REACTIVOS}, con cronómetro y tutor. Sin límite: cada uno trae preguntas que no has visto.` },
    { titulo: 'Examen completo', tag: 'Examen', oro: true, texto: `2 exámenes de ${EXAMEN_REACTIVOS} reactivos en ${HORAS} con tus módulos: el primero con tutor y el segundo sin pistas, como el día del examen.` },
    { titulo: 'Por área, módulo y tema', tag: 'Práctica', texto: 'Practica cada área o módulo por separado y tus temas débiles todas las veces que quieras.' },
    { titulo: 'Medidor de preparación', texto: 'Una conclusión clara y basada en tus datos: qué tan listo estás y a cuántos aciertos de tu meta.' },
    { titulo: 'Historial en tu cuenta', texto: 'Tu avance se guarda: compara tus simulacros y entra desde cualquier dispositivo durante 6 meses.' },
  ],
  comparar: [
    ['Examen armado con tus módulos', true, false],
    ['Pista de método cuando fallas (sin darte la respuesta)', true, false],
    ['Explicación paso a paso y la regla detrás', true, 'A veces'],
    ['Aciertos por área, con y sin Inglés', true, false],
    ['Plan de qué reforzar según tus errores', true, false],
    ['Preguntas nuevas en cada simulacro', true, false],
  ],
  estructura: {
    titulo: 'Cómo es el EXANI-II',
    lead: `El <b>examen completo</b> tiene ${EXAMEN_REACTIVOS} reactivos de tres opciones en ${HORAS}, con la estructura de la página oficial de CENEVAL. El <b>simulacro Medio</b> es la mitad (${MEDIO_REACTIVOS} reactivos) con el mismo ritmo. ¿No sabes qué módulos te tocan? <a href="${RUTA}/universidades/">Busca tu universidad</a>.`,
    tabla: tablaAreas,
  },
  faqTitulo: 'Sobre el EXANI-II y el simulador',
  faq: FAQ,
  final: 'Haz un Calentamiento hoy para ver qué áreas te faltan y, cuando estés listo, el examen completo con tus módulos y el tiempo real.',
  aviso: 'Simulador de práctica de Vorka México con reactivos originales. No está afiliado a CENEVAL ni a ninguna universidad; EXANI-II es un examen de CENEVAL. Los aciertos son una estimación para orientar tu estudio, no el Índice CENEVAL. Fuente de la estructura: ceneval.edu.mx/examenes-ingreso-exani_ii/ (consultada el 10 de noviembre de 2026).',
};
