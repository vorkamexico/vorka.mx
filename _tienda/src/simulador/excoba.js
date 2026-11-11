// Simulador EXCOBA (vorka.mx/simulador-excoba): el Examen de Competencias Básicas (de Métrica Educativa, A.C.) que usan
// la UAQ y la UG para licenciatura. UN solo simulador para las dos: el estudiante elige las 3 asignaturas de bachillerato
// de su carrera y las páginas por universidad (excoba-universidades.js) le dicen cuáles son.
// Datos verificados (11-nov-2026) en los instructivos oficiales de la UAQ y de la UG (excoba/FUENTES.md): 180 preguntas
// = primaria (Español y Matemáticas, 20 c/u) + secundaria (Español, Matemáticas, Ciencias naturales y Ciencias sociales,
// 20 c/u) + 3 asignaturas de bachillerato de 20; respuesta semiconstruida con crédito parcial. Ritmo: «en promedio un
// minuto por pregunta» (instructivo de la UAQ; no hay tiempo total oficial: es un supuesto del simulador).
// Banco: reactivos 100 % originales de Vorka (excoba/INSTRUCCIONES.md): opción única de 4 opciones y los tipos
// semiconstruidos del motor: 'multiple', 'numerica' y 'clasificar' (simulador/logica.js › calificar).
// Planes: Práctica ($149), Examen ($199: 2 exámenes completos) y Completo ($299). Adicionales: 1 Medio ($49) o 1 examen ($79).
import { crearSimulador } from './motor.js';
import { paginaVentaSimulador } from './venta.js';
import { armarPorMaterias } from './armar-por-area.js';
import { TEMAS_PRI_ESPANOL, REACTIVOS_PRI_ESPANOL } from './excoba/pri_espanol.js';
import { TEMAS_PRI_MATEMATICAS, REACTIVOS_PRI_MATEMATICAS } from './excoba/pri_matematicas.js';
import { TEMAS_SEC_ESPANOL, REACTIVOS_SEC_ESPANOL } from './excoba/sec_espanol.js';
import { TEMAS_SEC_MATEMATICAS, REACTIVOS_SEC_MATEMATICAS } from './excoba/sec_matematicas.js';
import { TEMAS_SEC_CIENCIAS_NATURALES, REACTIVOS_SEC_CIENCIAS_NATURALES } from './excoba/sec_ciencias_naturales.js';
import { TEMAS_SEC_CIENCIAS_SOCIALES, REACTIVOS_SEC_CIENCIAS_SOCIALES } from './excoba/sec_ciencias_sociales.js';
import { TEMAS_MAT_ESTADISTICA, REACTIVOS_MAT_ESTADISTICA } from './excoba/mat_estadistica.js';
import { TEMAS_MAT_CALCULO, REACTIVOS_MAT_CALCULO } from './excoba/mat_calculo.js';
import { TEMAS_FISICA, REACTIVOS_FISICA } from './excoba/fisica.js';
import { TEMAS_BIOLOGIA, REACTIVOS_BIOLOGIA } from './excoba/biologia.js';
import { TEMAS_LENGUAJE, REACTIVOS_LENGUAJE } from './excoba/lenguaje.js';
import { TEMAS_QUIMICA, REACTIVOS_QUIMICA } from './excoba/quimica.js';
import { TEMAS_CIENCIAS_SOCIALES, REACTIVOS_CIENCIAS_SOCIALES } from './excoba/ciencias_sociales.js';
import { TEMAS_HUMANIDADES, REACTIVOS_HUMANIDADES } from './excoba/humanidades.js';
import { TEMAS_ECONOMICO_ADMIN, REACTIVOS_ECONOMICO_ADMIN } from './excoba/economico_admin.js';

const TEMAS = { ...TEMAS_PRI_ESPANOL, ...TEMAS_PRI_MATEMATICAS, ...TEMAS_SEC_ESPANOL, ...TEMAS_SEC_MATEMATICAS,
  ...TEMAS_SEC_CIENCIAS_NATURALES, ...TEMAS_SEC_CIENCIAS_SOCIALES, ...TEMAS_MAT_ESTADISTICA, ...TEMAS_MAT_CALCULO,
  ...TEMAS_FISICA, ...TEMAS_BIOLOGIA, ...TEMAS_LENGUAJE, ...TEMAS_QUIMICA, ...TEMAS_CIENCIAS_SOCIALES, ...TEMAS_HUMANIDADES,
  ...TEMAS_ECONOMICO_ADMIN };
const REACTIVOS = [...REACTIVOS_PRI_ESPANOL, ...REACTIVOS_PRI_MATEMATICAS, ...REACTIVOS_SEC_ESPANOL, ...REACTIVOS_SEC_MATEMATICAS,
  ...REACTIVOS_SEC_CIENCIAS_NATURALES, ...REACTIVOS_SEC_CIENCIAS_SOCIALES, ...REACTIVOS_MAT_ESTADISTICA, ...REACTIVOS_MAT_CALCULO,
  ...REACTIVOS_FISICA, ...REACTIVOS_BIOLOGIA, ...REACTIVOS_LENGUAJE, ...REACTIVOS_QUIMICA, ...REACTIVOS_CIENCIAS_SOCIALES,
  ...REACTIVOS_HUMANIDADES, ...REACTIVOS_ECONOMICO_ADMIN];
const TEXTOS = {};

// ---------- secciones ----------
// [id, nombre, color, qué evalúa] · cada asignatura del examen trae 20 preguntas
const POR_ASIGNATURA = 20;
export const BASICAS = [
  ['pri_espanol', 'Español de primaria', 'tinta', 'Leer reportajes, cuentos y textos de divulgación, ortografía, puntuación y partes de la oración.'],
  ['pri_matematicas', 'Matemáticas de primaria', 'verde', 'Operaciones con naturales, fracciones y decimales, figuras y cuerpos, medidas, proporciones y datos.'],
  ['sec_espanol', 'Español de secundaria', 'tinta', 'Noticias y publicidad, textos informativos, entrevistas e informes, literatura y documentos formales.'],
  ['sec_matematicas', 'Matemáticas de secundaria', 'verde', 'Álgebra, ecuaciones y sistemas, funciones, geometría y trigonometría, conteo y estadística.'],
  ['sec_ciencias_naturales', 'Ciencias naturales', 'oro', 'Biología, física y química de secundaria.'],
  ['sec_ciencias_sociales', 'Ciencias sociales', 'morado', 'Geografía, historia de México y del mundo, y formación cívica y ética.'],
];
// Asignaturas de bachillerato: el estudiante presenta las 3 de su carrera. [id, nombre, corto, color, qué evalúa, solo en]
export const ASIGNATURAS = [
  ['mat_estadistica', 'Matemáticas para estadística', 'Mat. para estadística', 'verde', 'Álgebra, estadística, probabilidad y conteo, funciones y matemáticas financieras.'],
  ['mat_calculo', 'Matemáticas para cálculo', 'Mat. para cálculo', 'verde', 'Álgebra, geometría y trigonometría, geometría analítica y funciones.'],
  ['fisica', 'Física', 'Física', 'tinta', 'Magnitudes y vectores, movimiento, leyes de Newton, energía, fluidos, calor y electromagnetismo.'],
  ['biologia', 'Biología', 'Biología', 'verde', 'Biomoléculas, célula y metabolismo, herencia, evolución, organismos y ecología.'],
  ['lenguaje', 'Lenguaje', 'Lenguaje', 'tinta', 'Funciones del lenguaje, redacción, léxico y ortografía, narrativa, lírica y drama.'],
  ['quimica', 'Química', 'Química', 'oro', 'Materia, átomo y tabla periódica, enlaces y nomenclatura, reacciones, mol y disoluciones.'],
  ['ciencias_sociales', 'Ciencias sociales', 'C. sociales', 'morado', 'Corrientes de las ciencias sociales, historia de México e historia universal contemporánea.'],
  ['humanidades', 'Humanidades', 'Humanidades', 'morado', 'Ética y valores, bioética, filosofía y metodología de la investigación.'],
  ['economico_admin', 'Ciencias económico-administrativas', 'C. económico-adm.', 'oro', 'Contabilidad, administración, estructura socioeconómica de México e informática.', 'ug'],
];
const ASIG = Object.fromEntries(ASIGNATURAS.map(a => [a[0], a]));
export const NOMBRE_ASIGNATURA = Object.fromEntries(ASIGNATURAS.map(a => [a[0], a[1]]));

// Combinaciones de 3 asignaturas que piden de verdad la UAQ (Anexo I 2026-1) y la UG (tabla 2 de su instructivo), en el
// orden en que las lista la universidad. [id, asignatura I, II, III]
export const COMBOS = [
  ['est-bio-qui', 'mat_estadistica', 'biologia', 'quimica'],
  ['fis-bio-qui', 'fisica', 'biologia', 'quimica'],
  ['cal-fis-qui', 'mat_calculo', 'fisica', 'quimica'],
  ['cal-fis-len', 'mat_calculo', 'fisica', 'lenguaje'],
  ['est-len-hum', 'mat_estadistica', 'lenguaje', 'humanidades'],
  ['est-bio-len', 'mat_estadistica', 'biologia', 'lenguaje'],
  ['cal-cso-len', 'mat_calculo', 'ciencias_sociales', 'lenguaje'],
  ['cal-bio-qui', 'mat_calculo', 'biologia', 'quimica'],
  ['est-cso-cea', 'mat_estadistica', 'ciencias_sociales', 'economico_admin'],
  ['hum-cso-len', 'humanidades', 'ciencias_sociales', 'lenguaje'],
  ['cal-len-hum', 'mat_calculo', 'lenguaje', 'humanidades'],
  ['cso-len-cea', 'ciencias_sociales', 'lenguaje', 'economico_admin'],
  ['cso-hum-cea', 'ciencias_sociales', 'humanidades', 'economico_admin'],
  ['len-hum-cea', 'lenguaje', 'humanidades', 'economico_admin'],
  ['len-est-cea', 'lenguaje', 'mat_estadistica', 'economico_admin'],
];
const lista = n => (n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : n[0]);
export const nombreCombo = id => { const c = COMBOS.find(x => x[0] === id); return c ? lista(c.slice(1).map(a => NOMBRE_ASIGNATURA[a])) : ''; };

const MIN_POR_REACTIVO = 1;   // «en promedio, tienes un minuto para contestar cada pregunta» (instructivo de la UAQ)
const EXAMEN_REACTIVOS = (BASICAS.length + 3) * POR_ASIGNATURA;   // 180
const EXAMEN_MINUTOS = EXAMEN_REACTIVOS * MIN_POR_REACTIVO;
const sec = ([id, nombre, color, descripcion], reactivos) => ({ id, nombre, color, descripcion, reactivos, lecturas: 0, minutos: Math.round(reactivos * MIN_POR_REACTIVO) });
// Práctica libre por sección: 10 reactivos al ritmo del examen
const SECCIONES = [...BASICAS, ...ASIGNATURAS.map(([id, nombre, , color, d]) => [id, nombre, color, d])].map(s => sec(s, 10));
// Examen de una combinación: primaria, secundaria y las 3 asignaturas, en el orden del examen. f: Medio ½, Calentamiento ¼
const specs = (combo, f = 1) => {
  const c = COMBOS.find(x => x[0] === combo) || COMBOS[0];
  return [...BASICAS.map(s => s[0]), ...c.slice(1)].map(id => ({ id, lecturas: 0, reactivos: Math.max(2, Math.round(POR_ASIGNATURA * f)) }));
};
const total = l => l.reduce((t, x) => t + x.reactivos, 0);
const AREAS = COMBOS.map(([id, ...as]) => {
  const ex = specs(id), me = specs(id, 0.5), ca = specs(id, 0.25);
  return { id, nombre: lista(as.map(a => NOMBRE_ASIGNATURA[a])), corto: as.map(a => ASIG[a][2]).join(' + '), materias: ex,
    examen: { reactivos: total(ex), minutos: Math.round(total(ex) * MIN_POR_REACTIVO) },
    medio: { reactivos: total(me), minutos: Math.round(total(me) * MIN_POR_REACTIVO) },
    calentamiento: { reactivos: total(ca), minutos: Math.round(total(ca) * MIN_POR_REACTIVO) } };
});
const BANCO = { REACTIVOS, TEXTOS };
const combo = a => (COMBOS.some(x => x[0] === a) ? a : COMBOS[0][0]);
const MEDIO_REACTIVOS = AREAS[0].medio.reactivos, CAL_REACTIVOS = AREAS[0].calentamiento.reactivos;

export const APP = 'simulador-excoba';
export const RUTA = '/simulador-excoba';
export const PLANES = { practica: 'simulador-excoba-practica', completo: 'simulador-excoba-completo', paquete: 'simulador-excoba-paquete' };

export const EXCOBA = crearSimulador({
  app: APP, ruta: RUTA, cookie: 'vk_excoba', firma: APP, nombre: 'EXCOBA', titulo: 'Simulador EXCOBA',
  planes: PLANES, slugIntento: 'simulador-excoba-intento', slugExamen: 'simulador-excoba-examen',
  incluidos: { calentamiento: 0, corto: 0, examen: 0 },
  escala: { tipo: 'aciertos', total: EXAMEN_REACTIVOS },
  // Diagnóstico gratis: 12 preguntas de primaria y secundaria (las de bachillerato dependen de la carrera), solo de opción única
  banco: { SECCIONES, SECCIONES_CALENTAMIENTO: SECCIONES, SECCIONES_DIAGNOSTICO: SECCIONES.filter(s => BASICAS.some(b => b[0] === s.id)), TEMAS, TEXTOS, REACTIVOS, AREAS },
  armar: {
    corto: (azar, vistos, a) => armarPorMaterias(BANCO, specs(combo(a), 0.5), azar, vistos, 'medio'),
    examen: (azar, vistos, a) => armarPorMaterias(BANCO, specs(combo(a)), azar, vistos, 'oficial'),
    calentamiento: (azar, vistos, a) => armarPorMaterias(BANCO, specs(combo(a), 0.25), azar, vistos, 'calentamiento'),
    minutos: (tipo, materia, n) => Math.round(n * MIN_POR_REACTIVO),
  },
  cliente: { examen: 'EXCOBA', escala: 'aciertos', examenReactivos: EXAMEN_REACTIVOS, examenHoras: EXAMEN_MINUTOS / 60,
    meta: { inicial: 120, min: 40, max: EXAMEN_REACTIVOS, paso: 1 },
    areaTexto: { titulo: 'Tus asignaturas de bachillerato', nota: 'Elige las 3 que pide tu carrera (búscala en vorka.mx/simulador-excoba/uaq/ o /ug/). El examen y los simulacros se arman con primaria, secundaria y esas tres.' },
    oficial: 'Métrica Educativa, de la UAQ ni de la UG', regalo: '/tienda/simulador-excoba-paquete/?regalo=1#comprar',
    metaNota: 'La UAQ y la UG no publican un número de aciertos para entrar: cada carrera tiene su cupo y puede sumar otros instrumentos. Ponte una meta de aciertos y mide en cada simulacro qué tan cerca estás.' },
  venta: (env, req, url) => paginaVentaSimulador(EXCOBA, VENTA, env, req, url),
});

// ---------- página de venta ----------
const SITIO = 'https://vorka.mx';
const IMG = '/assets/tienda';
const semi = REACTIVOS.filter(r => r.tipo).length;
const DESCRIPCION = `Simulador del EXCOBA en línea para la UAQ y la UG: ${EXAMEN_REACTIVOS} preguntas con las 3 asignaturas de tu carrera, preguntas de arrastrar, elegir varias y escribir, tutor con pistas y crédito parcial como en el examen.`;
const FAQ = [
  { p: '¿Qué es el EXCOBA?', r: 'Es el Examen de Competencias Básicas, elaborado por Métrica Educativa, A.C. Es el examen de admisión a licenciatura de la Universidad Autónoma de Querétaro (UAQ) y de la Universidad de Guanajuato (UG). Mide lo que necesitas para cursar el primer año de licenciatura, desde primaria hasta bachillerato.' },
  { p: '¿Qué viene en el examen?', r: `${EXAMEN_REACTIVOS} preguntas: Español y Matemáticas de primaria (20 cada una); Español, Matemáticas, Ciencias naturales y Ciencias sociales de secundaria (20 cada una), y tres asignaturas de bachillerato de 20 preguntas que dependen de tu carrera. Así lo dicen los instructivos oficiales de la UAQ y de la UG. En la UG, la Licenciatura en Economía tiene 170 preguntas.` },
  { p: '¿Cuáles asignaturas de bachillerato me tocan?', r: `Las tres que pide tu carrera, de entre Matemáticas para estadística, Matemáticas para cálculo, Física, Biología, Lenguaje, Química, Ciencias sociales, Humanidades y, en la UG, Ciencias económico-administrativas. Por ejemplo, en la UAQ Medicina General lleva Matemáticas para estadística, Biología y Química, y en la UG Arquitectura lleva Matemáticas para el cálculo, Ciencias sociales y Lenguaje. Busca tu carrera en <a href="${RUTA}/uaq/">EXCOBA UAQ</a> o en <a href="${RUTA}/ug/">EXCOBA UG</a>.` },
  { p: '¿Cómo son las preguntas?', r: 'Según los instructivos oficiales, son de respuesta semiconstruida: arrastrar elementos para clasificarlos o ubicarlos, seleccionar varios elementos y escribir un número o una expresión algebraica. Algunas tienen una sola respuesta y valen 1 o 0; las de varias respuestas se califican por partes (si clasificas 4 elementos, cada uno vale 0.25). El simulador trae los cuatro tipos y los califica igual, por partes.' },
  { p: '¿Cuánto dura?', r: 'Los instructivos no dan un tiempo total oficial. El de la UAQ dice que, en promedio, tienes un minuto por pregunta, y el simulador usa ese ritmo: 3 horas para las 180 preguntas. Tu universidad te dice el horario de tu examen.' },
  { p: '¿Cuántos aciertos necesito?', r: 'No hay un número único: cada carrera tiene su cupo y algunas suman otros instrumentos de evaluación. El simulador te da tus aciertos sobre 180, con decimales por el crédito parcial, y te dice qué asignaturas y temas reforzar.' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con preguntas originales que siguen la estructura y el temario de los instructivos oficiales. No está afiliado a Métrica Educativa, a la UAQ ni a la UG, y los aciertos son una estimación para orientar tu estudio. Antes de tu examen haz también el demo oficial: en la UG es obligatorio.' },
  { p: '¿Cuál es la diferencia entre los planes?', r: `Práctica es para entrenar: Calentamientos de unas ${CAL_REACTIVOS} preguntas, simulacros Medios de unas ${MEDIO_REACTIVOS} y práctica por asignatura y tema, sin límite y con tutor; no incluye los exámenes completos. Examen es para medirte: 2 exámenes completos de ${EXAMEN_REACTIVOS} preguntas con tus asignaturas, el primero con tutor y el segundo sin pistas. Completo trae las dos cosas, más plan de estudio, recordatorios y apuntes, y cuesta menos que comprarlas por separado.` },
  { p: '¿Hay reembolso?', r: 'Solo si aún no lo usas: puedes pedirlo dentro de los 5 días hábiles siguientes a tu compra escribiendo a hola@vorka.mx. Una vez que empiezas un simulacro, un examen o una práctica ya no hay reembolso. Si algo falla y no te deja usarlo, lo resolvemos o te devolvemos tu dinero.' },
  { p: '¿Lo puedo regalar?', r: 'Sí. Al comprar elige Para regalar y cuántos: te llega una liga por cada regalo. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador de tu celular, tablet o computadora, también las preguntas de clasificar y elegir varias, y con el plan Completo lo puedes instalar como app. Tu historial se guarda en tu cuenta durante 6 meses.' },
];
const filaSec = ([, nombre, color, descripcion], n, nombreFila) => `<tr><th scope="row"><span class="sv-dot s-${color}"></span>${nombreFila || nombre}</th><td class="num">${n}</td><td class="num">${Math.round(n / 2)}</td><td>${descripcion}</td></tr>`;
const tablaAreas = `<table class="sv-tabla sec"><thead><tr><th scope="col">Sección</th><th scope="col" class="num">Examen completo</th><th scope="col" class="num">Simulacro Medio</th><th scope="col">Qué evalúa</th></tr></thead><tbody>${
  BASICAS.map(s => filaSec(s, POR_ASIGNATURA)).join('')}${
  filaSec(['bach', '', 'oro', `Las 3 que pide tu carrera, 20 preguntas cada una. En el simulador: ${ASIGNATURAS.map(a => a[1]).join(', ')}.`], 3 * POR_ASIGNATURA, 'Tus 3 asignaturas de bachillerato')
}<tr><th scope="row">Total</th><td class="num"><b>${EXAMEN_REACTIVOS} · 3&nbsp;h</b></td><td class="num">${MEDIO_REACTIVOS}</td><td>Ritmo de 1 minuto por pregunta, el promedio que sugiere el instructivo de la UAQ.</td></tr></tbody></table>`;
const ej = REACTIVOS.find(r => r.seccion === 'sec_matematicas' && !r.tipo && r.dificultad === 2 && !r.figura && !r.tabla) || REACTIVOS.find(r => !r.tipo) || REACTIVOS[0];

const VENTA = {
  sku: 'prod_simulador_excoba', nombreProducto: 'Simulador EXCOBA en línea', descripcion: DESCRIPCION, planInicial: 'paquete',
  tituloSEO: 'Simulador EXCOBA 2027 en línea para la UAQ y la UG | Vorka México',
  og: `${SITIO}${IMG}/v3/simulador-excoba-og.jpg`, imagenesLD: [`${SITIO}${IMG}/v3/simulador-excoba-portada.webp`, `${SITIO}${IMG}/v3/simulador-excoba-og.jpg`],
  imagenes: { portada: `${IMG}/v3/simulador-excoba-portada.webp`, og: `${IMG}/v3/simulador-excoba-og.jpg`, paso1: `${IMG}/v3/simulador-excoba-paso-reloj.webp`, paso2: `${IMG}/v3/simulador-excoba-paso-tutor.webp`, reporte: `${IMG}/simulador-excoba-reporte.png`, regalo: `${IMG}/simulador-excoba-regalo.png` },
  banco: REACTIVOS.length,
  chip: `Nuevo · ${REACTIVOS.length} preguntas originales · ${ASIGNATURAS.length} asignaturas de bachillerato`,
  hero: {
    h1: 'Simulador EXCOBA para la UAQ y la UG',
    lead: `Practica las ${EXAMEN_REACTIVOS} preguntas del Examen de Competencias Básicas con las 3 asignaturas de tu carrera: preguntas de clasificar, elegir varias y escribir tu respuesta, calificadas por partes como en el examen. Si fallas, un tutor te da una pista; al final, un reporte te dice qué reforzar.`,
    sellos: [`Examen completo: ${EXAMEN_REACTIVOS} preguntas`, 'Las 3 asignaturas de tu carrera', 'Clasificar, elegir varias y escribir', 'En celular o computadora'],
    alt: 'Simulador EXCOBA de Vorka México: pregunta de clasificar con pista del tutor y reporte de aciertos por asignatura',
  },
  queEs: {
    apoyo: `Elige las asignaturas de tu carrera y practica las ${EXAMEN_REACTIVOS} preguntas al ritmo de un minuto por pregunta.`,
    texto: 'Un examen de práctica en línea para el EXCOBA, el examen de admisión a licenciatura de la UAQ y de la UG. Primaria, secundaria y tus tres asignaturas de bachillerato, con los cuatro tipos de respuesta: una opción, elegir varias, clasificar y escribir un número o una expresión. <b>Si fallas, un tutor te da una pista</b> para intentarlo otra vez; al final, un reporte te dice cuántos aciertos llevas y qué reforzar.',
    para: [['Si vas a presentar en la UAQ o en la UG', 'No sabes cuántos aciertos sacarías hoy con tus asignaturas.'], ['Si no sabes qué asignaturas te tocan', 'Busca tu carrera en la página de tu universidad y te decimos cuáles son.'], ['Mamá, papá o quien quiera apoyar', 'Quieres regalarle algo que de verdad le ayude a prepararse.']],
  },
  planesVenta: [
    { k: 'practica', nombre: 'Práctica', para: 'Solo entrenar, sin límite y con tutor', falta: 'No incluye los exámenes completos', trae: () => ['Calentamientos y simulacros Medios sin límite', 'Práctica por asignatura y tema', 'Tutor con pistas y explicación paso a paso', 'Aciertos estimados y qué reforzar'] },
    { k: 'completo', nombre: 'Examen', para: 'Solo medirte: 2 exámenes completos', falta: 'No incluye la práctica ilimitada', trae: () => [`2 exámenes completos con tus asignaturas: ${EXAMEN_REACTIVOS} preguntas`, 'El 1.º con tutor para entrenar; el 2.º sin pistas, como el día del examen', 'Aciertos por asignatura y temas a reforzar', 'Cambia de asignaturas cuando quieras'] },
    { k: 'paquete', nombre: 'Completo', para: 'Práctica sin límite + los 2 exámenes completos', trae: () => ['Todo lo del plan Práctica: entrenas sin límite con tutor', 'Todo lo del plan Examen: los 2 exámenes completos', 'Plan de estudio con recordatorios, apuntes y app en tu celular', '6 meses de acceso a todo'] },
  ],
  diferencias: [
    ['Calentamientos y simulacros Medios sin límite', true, false, true],
    ['Práctica por asignatura y tema', true, false, true],
    ['Tutor con pistas y solución paso a paso', true, 'En el 1.er examen', true],
    ['2 exámenes completos con cronómetro', false, true, true],
    ['Plan de estudio, recordatorios y apuntes', false, false, true],
    ['Aciertos estimados y qué reforzar', true, true, true],
  ],
  cifras: [[REACTIVOS.length, 'preguntas originales'], [semi, 'de clasificar, elegir varias o escribir'], [Object.keys(TEMAS).length, 'temas medidos en tu reporte'], [EXAMEN_REACTIVOS, 'preguntas en el examen completo']],
  pasos: [['Contesta como en el examen', `Primaria, secundaria y tus 3 asignaturas, al ritmo de un minuto por pregunta. El reloj se pausa mientras lees las explicaciones.`], null,
    [null, `Aciertos estimados sobre ${EXAMEN_REACTIVOS}, con el crédito parcial de las preguntas de varias respuestas, tus asignaturas fuertes y los temas que más te cuestan, con práctica dirigida.`]],
  ejemplo: { ...ej, etiqueta: `Matemáticas de secundaria · ${TEMAS[ej.tema]?.nombre || ''}` },
  incluye: [
    { titulo: 'Las asignaturas de tu carrera', texto: `${COMBOS.length} combinaciones de 3 asignaturas, las que piden la UAQ y la UG. Cambia cuando quieras.` },
    { titulo: 'Calentamientos y Medios', tag: 'Práctica', texto: `Calentamientos de unas ${CAL_REACTIVOS} preguntas y simulacros Medios de unas ${MEDIO_REACTIVOS}, con cronómetro y tutor. Sin límite: cada uno trae preguntas que no has visto.` },
    { titulo: 'Examen completo', tag: 'Examen', oro: true, texto: `2 exámenes de ${EXAMEN_REACTIVOS} preguntas con tus asignaturas: el primero con tutor y el segundo sin pistas, como el día del examen.` },
    { titulo: 'Los cuatro tipos de respuesta', texto: 'Una opción, elegir varias, clasificar y escribir un número o una expresión, calificadas por partes.' },
    { titulo: 'Por asignatura y tema', tag: 'Práctica', texto: 'Practica cada asignatura por separado y tus temas débiles todas las veces que quieras.' },
    { titulo: 'Historial en tu cuenta', texto: 'Tu avance se guarda: compara tus simulacros y entra desde cualquier dispositivo durante 6 meses.' },
  ],
  comparar: [
    ['Examen armado con las asignaturas de tu carrera', true, false],
    ['Preguntas de clasificar, elegir varias y escribir', true, 'A veces'],
    ['Crédito parcial en las de varias respuestas', true, false],
    ['Pista de método cuando fallas (sin darte la respuesta)', true, false],
    ['Explicación paso a paso y la regla detrás', true, 'A veces'],
    ['Preguntas nuevas en cada simulacro', true, false],
  ],
  estructura: {
    titulo: 'Cómo es el EXCOBA',
    lead: `El <b>examen completo</b> tiene ${EXAMEN_REACTIVOS} preguntas, con la estructura de los instructivos oficiales de la UAQ y de la UG. El <b>simulacro Medio</b> es la mitad (${MEDIO_REACTIVOS} preguntas) con el mismo ritmo. ¿No sabes qué asignaturas te tocan? Búscalas en <a href="${RUTA}/uaq/">UAQ</a> o <a href="${RUTA}/ug/">UG</a>.`,
    tabla: tablaAreas,
  },
  faqTitulo: 'Sobre el EXCOBA y el simulador',
  faq: FAQ,
  final: 'Haz un Calentamiento hoy para ver qué secciones te faltan y, cuando estés listo, el examen completo con las asignaturas de tu carrera.',
  aviso: 'Simulador de práctica de Vorka México con preguntas originales. No está afiliado a Métrica Educativa, A.C., a la Universidad Autónoma de Querétaro ni a la Universidad de Guanajuato. Los aciertos son una estimación para orientar tu estudio. Fuente de la estructura: instructivos del Excoba publicados por la UAQ (dsa.uaq.mx) y la UG (ugto.mx/admisionug), consultados el 11 de noviembre de 2026.',
};
