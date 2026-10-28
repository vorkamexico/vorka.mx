// Simulador PAA (vorka.mx/simulador-paa): configuración para el motor (motor.js) y contenido de su página de venta.
// Planes (migración 0029, nombres de 0047): "Práctica" ($199: entrenar sin límite), "Examen" ($249: 2 exámenes completos)
// y "Completo" ($379: los dos). La compra de antes (simulador-paa) conserva lo que traía: 2 Calentamientos, 2 Medios y 1 Oficial.
// "Simulacro adicional" ($50) suma 1 Medio y "Examen PAA completo adicional" ($100) suma 1 examen.
import { crearSimulador } from './motor.js';
import { paginaVentaSimulador } from './venta.js';
import { SECCIONES, SECCIONES_EXAMEN, TEMAS, TEXTOS, REACTIVOS } from './banco.js';
import { armarCompleto, armarExamen, armarCalentamiento } from './armar.js';
import { SECCIONES_CALENTAMIENTO, INCLUIDOS } from './niveles.js';
import { UNIVERSIDADES } from './paa-universidades.js';

const SITIO = 'https://vorka.mx';
const IMG = `${SITIO}/tienda/img/portadas`;
const EXAMEN_REACTIVOS = SECCIONES_EXAMEN.reduce((t, x) => t + x.reactivos, 0), EXAMEN_HORAS = SECCIONES_EXAMEN.reduce((t, x) => t + x.minutos, 0) / 60;
const CORTO_REACTIVOS = SECCIONES.reduce((t, x) => t + x.reactivos, 0);
const CAL_REACTIVOS = SECCIONES_CALENTAMIENTO.reduce((t, x) => t + x.reactivos, 0);
const DESCRIPCION = 'Simulador PAA en línea con preguntas tipo examen de Lectura, Redacción, Matemáticas e Inglés, cronómetro real, tutor con pistas, explicación paso a paso y puntaje estimado.';
// Datos de la guía oficial de estudio de la PAA (College Board)
export const FAQ_PAA = [
  { p: '¿Qué es la PAA?', r: 'La Prueba de Aptitud Académica (PAA) del College Board es un examen de admisión que usan universidades de México, Puerto Rico y América Latina. Evalúa razonamiento verbal y matemático, y aprovechamiento en español, matemáticas e inglés.' },
  { p: '¿Qué secciones tiene la PAA?', r: 'Cuatro: Lectura, Redacción, Matemáticas e Inglés. Las preguntas son de opción múltiple con cuatro opciones, y algunas de Matemáticas piden escribir la respuesta. El College Board define el número de preguntas y los tiempos de cada aplicación: confírmalos con la universidad donde vas a presentar.' },
  { p: '¿Cómo se califica la PAA?', r: 'Cada sección se califica en una escala de 200 a 800 puntos y no se resta por respuesta incorrecta, así que conviene contestar todo. Nuestro simulador estima tu puntaje en esa misma escala para que veas qué tan cerca estás de tu meta.' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura y el tipo de preguntas de la PAA. No está afiliado al College Board y el puntaje es una estimación para orientar tu estudio.' },
  { p: '¿Hay reembolso?', r: 'Solo si aún no lo usas: puedes pedirlo dentro de los 5 días hábiles siguientes a tu compra escribiendo a hola@vorka.mx. Una vez que empiezas un simulacro, un examen o una práctica ya no hay reembolso, aunque no lo termines (igual que un archivo ya descargado). Si algo falla y no te deja usarlo, lo resolvemos o te devolvemos tu dinero. Detalles en la política de reembolsos.' },
  { p: '¿Cuál es la diferencia entre los planes?', r: `Práctica ($199) es para entrenar: Calentamientos (${CAL_REACTIVOS} reactivos) y simulacros Medios (${CORTO_REACTIVOS} reactivos) sin límite, práctica por sección y por tema, y un tutor que te da pistas cuando fallas. No incluye los exámenes completos. Examen ($249) es para medirte como el día de la PAA: 2 exámenes completos de ${EXAMEN_REACTIVOS} reactivos con cronómetro y reporte de preparación. El primero va con tutor para que entrenes el formato; el segundo, sin pistas. No incluye la práctica ilimitada. Completo ($379) trae las dos cosas: practicas sin límite y cierras con los 2 exámenes. Por separado cuestan $448, así que ahorras $69. Es el que recomendamos: practicar sin medirte no te dice si ya estás listo, y medirte sin practicar no te ayuda a subir tu puntaje.` },
  { p: '¿Se repiten las preguntas?', r: `El banco tiene ${REACTIVOS.length} reactivos originales y cada simulacro o examen prioriza los que todavía no has visto, así que tus primeros intentos traen preguntas prácticamente distintas. Las gráficas y figuras de Matemáticas son originales de Vorka México.` },
  { p: '¿Lo puedo regalar?', r: 'Sí. Al comprar elige Para regalar y cuántos: te llega una liga por cada regalo para que la compartas. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre, así que no se puede compartir.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador de tu celular, tablet o computadora, sin instalar nada. Tu historial se guarda en tu cuenta.' },
];

export const APP = 'simulador-paa';
export const PLANES = { practica: 'simulador-paa-practica', completo: 'simulador-paa-completo', paquete: 'simulador-paa-paquete' };
export const SLUG_INTENTO = 'simulador-paa-intento';
export const SLUG_EXAMEN = 'simulador-paa-examen';   // examen PAA completo adicional ($100)

// Sin minutos en la página: la guía oficial disponible del College Board es de 2020 y los tiempos pueden haber cambiado
const secciones = SECCIONES.map(s => { const x = SECCIONES_EXAMEN.find(e => e.id === s.id); return `<tr><th scope="row"><span class="sv-dot s-${s.color}"></span>${s.nombre}</th><td class="num">${x.reactivos}</td><td class="num">${s.reactivos}</td><td>${s.descripcion}</td></tr>`; }).join('')
  + `<tr><th scope="row">Total</th><td class="num"><b>${EXAMEN_REACTIVOS}</b></td><td class="num">${CORTO_REACTIVOS}</td><td></td></tr>`;
const ej = REACTIVOS.find(r => r.id === 'R-cnx-2');

export const PAA = crearSimulador({
  app: APP, ruta: '/simulador-paa', cookie: 'vk_paa', firma: 'simulador', nombre: 'PAA', titulo: 'Simulador PAA',
  planes: PLANES, slugIntento: SLUG_INTENTO, slugExamen: SLUG_EXAMEN, incluidos: INCLUIDOS,
  escala: { tipo: 'paa' },
  banco: { SECCIONES, SECCIONES_EXAMEN, SECCIONES_CALENTAMIENTO, TEMAS, TEXTOS, REACTIVOS },
  armar: { corto: armarCompleto, examen: armarExamen, calentamiento: armarCalentamiento },
  // Lo que la app necesita saber del examen (textos, escala y meta)
  cliente: { examen: 'PAA', escala: 'paa', examenReactivos: EXAMEN_REACTIVOS, examenHoras: EXAMEN_HORAS, globalSecciones: ['lectura', 'redaccion', 'matematicas'],
    oficial: 'College Board' },
  venta: (env, req, url) => paginaVentaSimulador(PAA, VENTA, env, req, url),
});

const VENTA = {
  slugLegado: APP, sku: 'prod_simulador_paa', nombreProducto: 'Simulador PAA en línea', descripcion: DESCRIPCION,
  tituloSEO: 'Simulador PAA 2026 en línea: examen de práctica | Vorka México',
  og: `${SITIO}/assets/tienda/v3/simulador-paa-og.jpg`, imagenesLD: [`${SITIO}/assets/tienda/v3/simulador-paa-portada.webp`, `${SITIO}/assets/tienda/v3/simulador-paa-og.jpg`, `${IMG}/simulador-paa-reporte.png`],
  imagenes: { portada: '/assets/tienda/v3/simulador-paa-portada.webp', og: '/assets/tienda/v3/simulador-paa-og.jpg', paso1: '/assets/tienda/v3/simulador-paa-paso-reloj.webp', paso2: '/assets/tienda/v3/simulador-paa-paso-tutor.webp', reporte: '/tienda/img/portadas/simulador-paa-reporte.png', regalo: '/tienda/img/portadas/simulador-paa-regalo.png' },
  banco: REACTIVOS.length,
  chip: `Nuevo · ${REACTIVOS.length} reactivos originales`,
  hero: {
    h1: 'Simulador PAA en línea: practica como si fuera el día del examen',
    lead: 'Preguntas tipo PAA de Lectura, Redacción, Matemáticas e Inglés, con cronómetro como en el examen real. Si fallas, un tutor te da una pista para intentarlo otra vez; al final, un reporte te dice exactamente qué reforzar.',
    sellos: ['Práctica ilimitada con tutor', `Examen completo como el real: ${EXAMEN_REACTIVOS} reactivos`, 'Puntaje estimado 200–800', 'En celular o computadora'],
    alt: 'Simulador PAA de Vorka México: pregunta de Redacción con pista del tutor y medidor de preparación',
  },
  planesVenta: [
    { k: 'practica', nombre: 'Práctica', para: 'Solo entrenar, sin límite y con tutor', falta: 'No incluye los exámenes completos', trae: () => ['Calentamientos y simulacros Medios sin límite', 'Práctica por sección y por tema', 'Tutor con pistas y explicación paso a paso', 'Puntaje estimado y qué reforzar'] },
    { k: 'completo', nombre: 'Examen', para: `Solo medirte: 2 exámenes completos de ${EXAMEN_REACTIVOS} reactivos`, falta: 'No incluye la práctica ilimitada', trae: () => [`2 exámenes completos de ${EXAMEN_REACTIVOS} reactivos`, 'Con cronómetro y la dificultad de la PAA', 'El 1.º con tutor para entrenar; el 2.º sin pistas, como el día del examen', 'Reporte de preparación por sección'] },
    { k: 'paquete', nombre: 'Completo', para: 'Práctica sin límite + los 2 exámenes completos', trae: () => ['Todo lo del plan Práctica: entrenas sin límite con tutor', `Todo lo del plan Examen: 2 exámenes de ${EXAMEN_REACTIVOS} reactivos`, '6 meses de acceso a todo'] },
  ],
  // Tabla "¿Cuál es la diferencia?": [qué, Práctica, Examen, Completo]
  diferencias: [
    ['Calentamientos y simulacros Medios sin límite', true, false, true],
    ['Práctica por sección y por tema', true, false, true],
    ['Tutor con pistas y solución paso a paso', true, 'En el 1.er examen', true],
    [`2 exámenes completos de ${EXAMEN_REACTIVOS} reactivos con cronómetro`, false, true, true],
    ['Puntaje estimado 200–800 y qué reforzar', true, true, true],
  ],
  cifras: [[REACTIVOS.length, 'reactivos originales'], [Object.keys(TEXTOS).length, 'lecturas en español e inglés'], [Object.keys(TEMAS).length, 'temas medidos en tu reporte'], [EXAMEN_REACTIVOS, 'reactivos en el examen completo']],
  pasos: [['Contesta como en la PAA', 'Las cuatro secciones con cronómetro, como en el examen real. El reloj se pausa mientras lees las explicaciones.'], null,
    [null, 'Puntaje estimado por sección, distancia a tu meta, tus fortalezas y los temas que más puntos te restan, con práctica dirigida.']],
  ejemplo: { ...ej, etiqueta: 'Redacción · Conectores' },
  planInicial: 'paquete',   // el que recomendamos: practicar y medirte
  incluye: [
    { titulo: 'Calentamientos', tag: 'Práctica', texto: `${CAL_REACTIVOS} reactivos de dificultad básica e intermedia con tutor, para entrar en ritmo sin frustrarte. Todos los que quieras.` },
    { titulo: 'Simulacros Medios', tag: 'Práctica', texto: `Las cuatro secciones en ${CORTO_REACTIVOS} reactivos, la mayoría de dificultad alta, con cronómetro y tutor. Sin límite: cada uno trae preguntas que no has visto.` },
    { titulo: 'Examen completo', tag: 'Examen', oro: true, texto: `2 exámenes de ${EXAMEN_REACTIVOS} reactivos con cronómetro, con la cantidad de preguntas y la dificultad de la PAA real. El primero, con tutor para entrenar el formato; el segundo, sin pistas como el día del examen. ¿Otro? Cuesta $100.` },
    { titulo: 'Por sección y por tema', tag: 'Práctica', texto: 'Repite cada sección por separado y practica tus temas débiles todas las veces que quieras.' },
    { titulo: 'Medidor de preparación', texto: 'Una conclusión clara y basada en tus datos: qué tan listo estás y a cuántos puntos de tu meta.' },
    { titulo: 'Historial en tu cuenta', texto: 'Tu avance se guarda: compara tus simulacros y entra desde cualquier dispositivo durante 6 meses.' },
  ],
  comparar: [
    ['Cronómetro en cada simulacro', true, false],
    ['Pista de método cuando fallas (sin darte la respuesta)', true, false],
    ['Explicación paso a paso y la regla detrás', true, 'A veces'],
    ['Puntaje estimado por sección (200–800)', true, false],
    ['Plan de qué reforzar según tus errores', true, false],
    ['Preguntas nuevas en cada simulacro', true, false],
  ],
  estructura: {
    titulo: 'Las 4 secciones, en dos formatos',
    lead: 'El <b>examen completo</b> tiene la cantidad de preguntas de la PAA. El <b>simulacro corto</b> es una versión compacta para practicar en una sola sentada.',
    tabla: `<table class="sv-tabla sec"><thead><tr><th scope="col">Sección</th><th scope="col">Examen completo<br><small>reactivos</small></th><th scope="col">Simulacro corto<br><small>reactivos</small></th><th scope="col">Qué evalúa</th></tr></thead><tbody>${secciones}</tbody></table>`,
  },
  // Ligas a las páginas por universidad (requisitos verificados de cada una)
  antesRegalo: `<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">PAA por universidad</span><h2 class="h2" style="margin-top:14px">Lo que pide cada universidad</h2>
  <p class="lead">Puntajes, vigencia y reglas de la PAA, con la fuente oficial de cada una.</p></div>
  <div class="sv-grid">${Object.entries(UNIVERSIDADES).map(([k, u]) => `<a class="sv-card" style="text-decoration:none;color:inherit" href="/simulador-paa/${k}/"><h3>PAA ${u.nombre}</h3><p>${u.completo}</p></a>`).join('')}</div>
</div></section>`,
  faqTitulo: 'Sobre la PAA y el simulador',
  faq: FAQ_PAA,
  final: 'Haz un simulacro corto hoy para ver qué temas te faltan y, cuando estés listo, el examen completo para medirte como el día del examen.',
  aviso: 'Simulador de práctica de Vorka México con reactivos originales. No está afiliado al College Board; PAA es una prueba del College Board. El puntaje es una estimación para orientar tu estudio.',
};
