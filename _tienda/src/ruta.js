// Ruta de Impacto (curso interactivo para jóvenes de 15 a 29 años que hacen proyectos sociales). La app vive en Vorka OS con
// dominio aislado (ruta.vorka.mx, ver vorka-os/PLAN-RUTA-DE-IMPACTO.md). Aquí solo se vende:
//   /tienda/ruta-de-impacto/ → ficha comercial única: cómo funciona, los 6 niveles y el final, el trabajo de campo, la
//   calificación y la Revista Sparks, constancia, a dónde va lo recibido, para quién, regalar, preguntas y compra.
// Pago único de $99 MXN por un año, regalable. Lo recibido va para IMPACTO.
//
// Entrega: el acceso y las ligas de regalo los da Vorka OS por service binding (ver ruta-entrega.js).
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc, WHATSAPP } from './paginas.js';
import { refDeVisita, precio, navTienda, masTienda, seccionFaq, seccionCompra, formCompra, SCRIPT_COMPRA } from './tienda.js';
import { oferta, ofertas, migas } from './seo.js';
import { resenasDe, ldResenas, seccionResenas } from './resenas.js';
import { FLECHA } from './marco.generado.js';

export const SLUG_RUTA = 'ruta-de-impacto';
export const RUTA_RUTA = '/tienda/ruta-de-impacto/';
export const OG_RUTA = 'https://vorka.mx/assets/tienda/v3/ruta-de-impacto-og.jpg';
const APP = 'https://ruta.vorka.mx';
const IMPACTO_URL = 'https://soyimpacto.org/';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
const IMG = '/assets/tienda/ruta';
// Precio decidido por Dirección (26-10-2026): solo se usa en textos si el producto aún no está a la venta
const PRECIO_BASE = 99;

// ---------- contenido de la ficha (de PLAN-RUTA-DE-IMPACTO.md, secciones 1 a 7) ----------
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONO = {
  reloj: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'), fuego: ico('<path d="M12 21c-4 0-7-2.7-7-6.5 0-3 2-5 3.5-6.5.3 2 1.3 3 2.5 3.5C11 8 12 5 15 3c0 3 4 5.5 4 10 0 4.5-3 8-7 8z"/>'),
  brujula: ico('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'), lapiz: ico('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  medalla: ico('<circle cx="12" cy="15" r="5"/><path d="M8.5 3.5L12 10l3.5-6.5M12 13v4M10.5 15h3"/>'), corazon: ico('<path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z"/>'),
  voz: ico('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'), gente: ico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.4 3.5 5.2"/>'),
  foto: ico('<rect x="3" y="6.5" width="18" height="13" rx="2.5"/><path d="M8.5 6.5l1.5-2.5h4l1.5 2.5"/><circle cx="12" cy="13" r="3.5"/>'), escudo: ico('<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
  doc: ico('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'), regalo: ico('<rect x="3.5" y="9" width="17" height="11.5" rx="1.5"/><path d="M2.5 9h19v-3h-19zM12 6v14.5M12 6c-1-3-6-3.5-6-1s4 1 6 1c2 0 6 1.5 6-1s-5-2-6 1"/>'),
};
const NIVELES = [
  ['El problema', 'Problema contra síntoma, árbol de problemas, a quién le pasa y los datos que lo prueban.', 'Tu árbol de problemas: el problema central, 3 o más causas, 3 o más efectos y 2 datos con su fuente.'],
  ['Escuchar a la comunidad', 'Entrevistas sin sesgo, preguntas abiertas, consentimiento y ética con menores de edad.', '5 o más entrevistas registradas y la síntesis de 3 hallazgos.'],
  ['La solución', 'Lluvia de ideas, criterios para elegir, teoría de cambio y objetivos.', 'Tu teoría de cambio completa y un objetivo con verbo, cifra, fecha y lugar.'],
  ['Medir', 'Indicadores de proceso y de resultado, línea base, metas y cómo levantar datos.', '3 o más indicadores, cada uno con fórmula, línea base, meta y fuente.'],
  ['Recursos y aliados', 'Presupuesto, aportes en especie, aliados, fuentes de fondos y figuras legales básicas en México.', 'Un presupuesto que cuadra (la plataforma suma y revisa) y 2 o más aliados contactados.'],
  ['El piloto', 'Plan de piloto, riesgos, hacerlo en pequeño y comparar contra la línea base.', 'Tu piloto con 10 o más participantes: fecha, lugar, 3 o más fotos, lista de asistencia sin datos sensibles y resultados.'],
];
const FINAL = ['Proyecto final: cuenta tu proyecto', 'La ficha de una página de tu proyecto y tu siguiente paso.', 'Tu ficha final y el examen integrador, con casos y sin pistas.'];
const CALIFICACION = [['Exámenes de los 6 niveles', 36, 'Preguntas al azar, tiempo límite y 2 intentos: cuenta el último, no el mejor.'], ['Examen integrador', 14, 'Casos de proyectos, un solo intento y sin pistas.'],
  ['Retos de campo (7)', 42, 'Cada criterio que falta resta. Entregar más de 14 días después de abrir el nivel resta 1 punto.'], ['Constancia', 8, 'Todas las lecciones, sin saltarte ninguna, y tu racha.']];
const TEMAS = ['Educación', 'Medio ambiente', 'Salud y bienestar', 'Inclusión y discapacidad', 'Igualdad de género', 'Animales', 'Cultura y deporte', 'Comunidad y espacios públicos'];
const EJERCICIOS = ['Opción múltiple', 'Verdadero o falso con su razón', 'Ordenar pasos', 'Emparejar', 'Encuentra el error', 'Completar', 'Clasificar', 'Casos'];

const faq = ({ precioN = PRECIO_BASE } = {}) => [
  ['¿Qué es Ruta de Impacto?', 'Un curso interactivo para sacar adelante tu proyecto social, con lecciones cortas, ejercicios, racha diaria y un tutor que te guía paso a paso. Mientras aprendes, armas <b>tu</b> proyecto real dentro de la plataforma, lo pruebas en tu comunidad y terminas con una calificación sobre 100.'],
  ['¿Para quién es?', 'Para jóvenes de 15 a 29 años que quieren resolver un problema de su comunidad. No necesitas experiencia: empiezas con algo que te preocupa y, nivel por nivel, lo conviertes en un proyecto probado.'],
  ['¿Necesito tener ya un proyecto?', `No. Al empezar eliges el tema de tu proyecto (${TEMAS.join(', ').toLowerCase()}) y en el primer nivel escribes el problema que te preocupa. Si ya tienes uno en marcha, también te sirve para ordenarlo y probarlo.`],
  ['¿Cuánto tiempo le dedico?', 'Cada lección dura de 3 a 5 minutos. Tú eliges tu meta diaria (5, 10 o 15 minutos) y la racha te ayuda a no soltarlo. Tienes un año de acceso. Los retos de campo tienen plazo: entregarlos más de 14 días después de abrir el nivel resta 1 punto.'],
  ['¿Quién es el tutor?', 'Es el tutor de la plataforma: cuando te equivocas, primero te da una pista (no la respuesta); si vuelves a fallar, te explica paso a paso y te deja la regla. Las pistas y explicaciones las escribió el equipo de Vorka México. También revisa lo que escribes de tu proyecto con reglas automáticas (si tu objetivo tiene cifra y fecha, si una causa no es una solución disfrazada) y te dice qué falta.'],
  ['¿Qué tengo que hacer fuera de la app?', 'Trabajo de campo de verdad: al menos 5 entrevistas a personas de tu comunidad (con su consentimiento) y un piloto con 10 o más participantes, con fecha, lugar, fotos y resultados. Por eso, al terminar, tu proyecto no es una idea: está probado.'],
  ['¿Cómo se califica?', 'Sobre 100 y es muy difícil a propósito: 36 puntos de los exámenes de los 6 niveles, 14 del examen integrador, 42 de los 7 retos de campo y 8 de constancia. Sin terminar todo, no pasas de 94.'],
  ['¿Qué pasa si saco 95 o más?', 'Tu proyecto pasa a revisión de Vorka. El equipo revisa que tus evidencias sean reales y, si todo está en orden, tu proyecto se publica en la <a href="/sparks/">Revista Sparks</a> para que más gente lo conozca y lo apoye. Si se detectan evidencias falsas, no se publica y la calificación queda como «no validada».'],
  ['Soy menor de edad, ¿puedo publicar mi proyecto?', 'Sí, con permiso. Si tienes menos de 18 años, cuando tu proyecto se aprueba le mandamos a tu mamá, papá o tutor un enlace para autorizar la publicación. Sin su autorización no se publica. Tu curso y tu constancia no dependen de eso.'],
  ['¿Recibo constancia?', 'Sí. Todas las personas que terminan reciben su constancia digital con su calificación, aunque no lleguen a 95.'],
  ['¿A dónde va lo que pago?', `Lo recibido va para <a href="${IMPACTO_URL}" target="_blank" rel="noopener">IMPACTO</a>.`],
  ['¿Cómo lo regalo?', 'En la compra elige «Para regalar». Te llega por correo una liga por cada regalo para que se la mandes a quien quieras, por ejemplo por WhatsApp. Quien la abre confirma su correo y el acceso queda a su nombre: su año empieza ese día. Cada liga funciona una sola vez.'],
  ['¿Cómo recibo mi acceso?', `En cuanto se confirma tu pago te llega un correo con el botón «Empezar mi Ruta». Funciona una sola vez durante 7 días. Después entras en <a href="${APP}/">ruta.vorka.mx</a> con tu correo y creas tu contraseña. Funciona en el navegador del celular o de la computadora; no tienes que descargar nada.`],
  ['¿Cómo puedo pagar?', `Con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI. Es un pago único de $${precioN} MXN: no se renueva solo. El pago lo procesa Stripe; nosotros nunca vemos los datos de tu tarjeta.`],
  ['¿Hay reembolsos?', 'Por ser un producto digital de acceso inmediato no hay reembolso una vez que entras. Si algo no funciona, escríbenos y lo resolvemos. Consulta la <a href="/legal/reembolsos/">política de reembolsos</a>.'],
  ['¿Me pueden facturar?', 'Sí. Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tus datos fiscales y el número de orden que viene en tu correo, dentro del mismo mes de la compra.'],
];

// Captura real de la app en un celular (las imágenes están en assets/tienda/ruta/, sacadas de ruta.vorka.mx con datos de prueba)
const cel = (img, alt, alto, clase = '') => `<figure class="ri-cel ${clase}"><img src="${IMG}/${img}.webp" alt="${esc(alt)}" width="390" height="${alto}" loading="lazy" decoding="async"></figure>`;

export async function paginaRuta(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  // A la venta: activo. Si todavía no, la ficha se ve (para revisarla) pero sin compra y sin indexar.
  const p = await productoPorSlug(env, SLUG_RUTA);
  if (p && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code }, req);
  const precioN = p ? p.precio_centavos / 100 : PRECIO_BASE;
  const precioT = p ? precio(p) : `$${PRECIO_BASE} MXN`;
  const regalo = url.searchParams.get('regalo') === '1';
  const FAQ = faq({ precioN });
  const rs = p ? await resenasDe(env, RUTA_RUTA) : null;
  const descripcion = `Curso para jóvenes de 15 a 29 años: lecciones cortas y tutor para llevar tu proyecto social a tu comunidad. ${precioT}, un año. Lo recibido va para IMPACTO.`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Course', name: 'Ruta de Impacto', description: descripcion, url: `https://vorka.mx${RUTA_RUTA}`, image: [OG_RUTA], inLanguage: 'es-MX',
    provider: { '@type': 'Organization', name: 'Vorka México', sameAs: 'https://vorka.mx/' },
    audience: { '@type': 'PeopleAudience', suggestedMinAge: 15, suggestedMaxAge: 29 },
    teaches: NIVELES.map(n => n[0]).concat('Contar tu proyecto'),
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT5M' },
    offers: oferta({ ruta: RUTA_RUTA, price: precioN.toFixed(2), disponible: !!p, category: 'Paid' }), ...ldResenas(rs) },
  migas('Ruta de Impacto', RUTA_RUTA),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const comprar = p ? '#comprar' : '#ayuda';
  return pagina({ navActual: 'catalogo', navOscuro: true, entrar: { url: `${APP}/`, app: 'Ruta de Impacto' }, noindex: !p,
    titulo: 'Ruta de Impacto: curso para hacer tu proyecto social | Jóvenes de 15 a 29 años', ruta: RUTA_RUTA, imagen: OG_RUTA, descripcion,
    head: `<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: p ? SCRIPT_COMPRA : '',
    cuerpo: `<div class="ri">
<section class="ri-hero"><div class="marco ri-hero-g">
  <div class="ri-hero-txt">
    <span class="ri-marca"><i aria-hidden="true"></i>ruta de impacto</span>
    <h1 class="ri-h1">Tu proyecto social, <em>de la idea a la comunidad.</em></h1>
    <p class="ri-lead">Un curso interactivo como los de idiomas, pero para sacar adelante tu proyecto: lecciones de 3 a 5 minutos, racha diaria y un tutor que te guía paso a paso. Lo pruebas en tu comunidad con entrevistas y un piloto, y terminas con calificación y constancia.</p>
    <div class="ri-ctas"><a class="ri-btn" href="${comprar}">${p ? `Empezar por ${precioT}` : 'Muy pronto'} ${FLECHA}</a>${p ? `<a class="ri-btn ghost" href="?regalo=1#comprar">🎁 Regálaselo a un joven</a>` : ''}</div>
    <p class="t-ya">¿Ya lo tienes? <a href="${APP}/">Entra en ruta.vorka.mx</a></p>
    <ul class="ri-chips"><li>${ICONO.gente}De 15 a 29 años</li><li>${ICONO.reloj}Pago único · 1 año</li><li>${ICONO.corazon}Lo recibido va para IMPACTO</li></ul>
  </div>
  <div class="ri-escena">${cel('mapa', 'El mapa de la ruta en ruta.vorka.mx: racha, XP, meta del día y las lecciones del nivel 1, El problema', 844, 'hero')}
    <div class="ri-noti" aria-hidden="true"><span class="ri-noti-ic">${ICONO.fuego}</span><span><b>¡Lección terminada!</b>+10 XP · tu racha sigue</span></div></div>
</div>
${navTienda('ruta')}
</section>

<section class="ri-sec" id="como-funciona"><div class="marco">
  <div class="ri-cab"><span class="ri-et">Cómo funciona</span><h2>Aprendes como en una app de idiomas. Avanzas tu proyecto de verdad.</h2><p>Lecciones cortas con ejercicios, una ruta de niveles que se abre conforme avanzas y un tutor que no te deja solo.</p></div>
  <ul class="ri-ben">${[[ICONO.reloj, 'Lecciones de 3 a 5 minutos', `Con ejercicios: ${EJERCICIOS.join(', ').toLowerCase()}. La siguiente lección se abre al terminar la anterior.`],
    [ICONO.fuego, 'Racha, XP e insignias', 'Elige tu meta diaria (5, 10 o 15 minutos), cuida tu racha y gana insignias por nivel, por racha y por evidencias completas.'],
    [ICONO.brujula, 'Un tutor con pistas', 'Al primer error te da una pista, no la respuesta. Al segundo, la explicación paso a paso y la regla. Lo que fallas vuelve a salir para repasarlo.'],
    [ICONO.lapiz, 'Tu proyecto mientras aprendes', 'Lo que escribes de tu proyecto se usa en los siguientes ejercicios y se revisa con reglas: ¿tu objetivo tiene cifra? ¿tiene fecha?']].map(([ic, t, d]) => `<li>${ic}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
  <div class="ri-capturas">${cel('tutor', 'El tutor da una pista después del primer error en un ejercicio de opción múltiple', 844)}${cel('proyecto', 'Paso «Tu proyecto»: el alumno escribe su problema y queda guardado en su proyecto', 844)}${cel('examen', 'Resultado de un examen de nivel: aciertos, puntos e intento', 540, 'corta')}</div>
  <p class="ri-pie">Capturas reales de ruta.vorka.mx con datos de prueba.</p>
</div></section>

<section class="ri-sec ri-osc" id="niveles"><div class="marco">
  <div class="ri-cab"><span class="ri-et">La ruta</span><h2>6 niveles y el proyecto final.</h2><p>Cada nivel trae lecciones, un reto de campo con mínimos que se pueden verificar y un examen.</p></div>
  <ol class="ri-niveles">${NIVELES.map(([t, a, r], k) => `<li><span class="ri-num">Nivel ${k + 1}</span><b>${t}</b><p>${a}</p><p class="ri-reto"><span>Reto de campo</span>${r}</p></li>`).join('')}
    <li class="final"><span class="ri-num">Final</span><b>${FINAL[0]}</b><p>${FINAL[1]}</p><p class="ri-reto"><span>Reto final</span>${FINAL[2]}</p></li></ol>
</div></section>

<section class="ri-sec" id="en-la-calle"><div class="marco ri-dos">
  <div class="ri-cab izq"><span class="ri-et">En la calle</span><h2>Tu proyecto termina probado, no en una idea.</h2>
    <p>Lo que aprendes lo haces en tu comunidad. La plataforma revisa que cada reto cumpla sus mínimos antes de darte los puntos.</p>
    <ul class="ri-campo">${[[ICONO.voz, '5 o más entrevistas', 'Con tu guía de preguntas abiertas y el consentimiento de cada persona. Registras perfil, fecha, respuestas y el hallazgo principal, y al final 3 hallazgos.'],
      [ICONO.gente, 'Un piloto con 10 o más personas', 'Lo haces en pequeño, con fecha y lugar, y comparas tus resultados contra tu línea base.'],
      [ICONO.foto, 'Fotos y lista de asistencia', '3 o más fotos tomadas con permiso y una lista sin datos sensibles: nada de CURP, teléfonos ni domicilios.'],
      [ICONO.escudo, 'Con cuidado de las personas', 'Consentimiento informado y, con menores de edad, permiso de su mamá, papá o tutor. Sin fotos de menores sin permiso.']].map(([ic, t, d]) => `<li>${ic}<span><b>${t}</b>${d}</span></li>`).join('')}</ul></div>
  <div class="ri-capturas dos">${cel('entrevistas', 'Reto de campo del nivel 2: cinco entrevistas con sus criterios cumplidos', 760)}${cel('piloto', 'Reto de campo del nivel 6: el piloto con 10 o más participantes, fotos y resultados', 760)}</div>
</div></section>

<section class="ri-sec suave" id="calificacion"><div class="marco ri-dos">
  <div><div class="ri-cab izq"><span class="ri-et">Calificación</span><h2>Sobre 100. Y muy difícil.</h2><p>Sacar 95 exige casi todo perfecto: exámenes casi sin errores, todas las evidencias completas y a tiempo, y el integrador bien. Sin terminar todo, no pasas de 94.</p></div>
    <div class="ri-tabla-c"><table class="ri-tabla"><thead><tr><th scope="col">Parte</th><th scope="col">Puntos</th></tr></thead>
      <tbody>${CALIFICACION.map(([t, n, d]) => `<tr><th scope="row">${t}<small>${d}</small></th><td>${n}</td></tr>`).join('')}<tr class="tot"><th scope="row">Total</th><td>100</td></tr></tbody></table></div></div>
  <div class="ri-sparks">${cel('calificacion', 'La calificación del alumno en su perfil: 96 de 100 con el desglose por parte', 418, 'corta')}
    <div class="ri-sparks-t"><span class="ri-pill">95 o más</span><h3>Tu proyecto, en la Revista Sparks.</h3>
      <p>Con 95 o más, tu proyecto pasa a revisión de Vorka. El equipo revisa que tus evidencias sean reales y, si todo está en orden, se publica en la <a href="/sparks/">Revista Sparks</a> para que más gente lo conozca y lo siga apoyando.</p>
      <p><b>Si eres menor de edad,</b> se publica solo con el permiso de tu mamá, papá o tutor. Si se detectan evidencias falsas, no se publica.</p></div></div>
</div></section>

<section class="ri-sec" id="constancia"><div class="marco ri-tres">
  <article class="ri-caja">${ICONO.doc}<h3>Constancia para todos los que terminan</h3><p>Al terminar recibes tu constancia digital con tu calificación, llegues o no a 95.</p></article>
  <article class="ri-caja ri-impacto">${ICONO.corazon}<h3>Lo recibido va para IMPACTO.</h3><p><a href="${IMPACTO_URL}" target="_blank" rel="noopener">soyimpacto.org</a></p></article>
  <article class="ri-caja">${ICONO.medalla}<h3>Insignias por nivel y por racha</h3><p>Una por cada nivel, por 7 y 30 días de racha y por tener tus evidencias completas.</p></article>
</div></section>

<section class="ri-sec suave" id="para-quien"><div class="marco ri-dos">
  <div class="ri-cab izq"><span class="ri-et">Para quién es</span><h2>Para jóvenes de 15 a 29 años con ganas de cambiar algo.</h2>
    <p>Si te preocupa algo de tu colonia, tu escuela o tu ciudad y quieres hacer algo que funcione, esta ruta es para ti. No necesitas experiencia ni dinero para empezar tu proyecto.</p></div>
  <div><p class="ri-sub">Elige el tema de tu proyecto y los ejemplos hablan de lo tuyo:</p><ul class="ri-temas">${TEMAS.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
</div></section>

<section class="ri-sec ri-osc" id="regalar"><div class="marco ri-dos">
  <div class="ri-cab izq"><span class="ri-et">Regalar</span><h2>Regálaselo a un joven.</h2>
    <p>¿Conoces a alguien con un proyecto en la cabeza? A tu hija, a tu sobrino, a tus alumnos o a la brigada de tu colonia. Compras, te llega una liga por cada regalo y se la mandas por WhatsApp.</p>
    ${p ? `<div class="ri-ctas"><a class="ri-btn" href="?regalo=1#comprar">🎁 Regalar Ruta de Impacto ${FLECHA}</a></div>` : ''}</div>
  <ol class="ri-pasos">${[['Eliges «Para regalar»', 'Cuántos regalos, para quién y un mensaje.'], ['Te llega una liga por regalo', 'Por correo, lista para mandar por WhatsApp.'], ['Quien la abre confirma su correo', 'El acceso queda a su nombre y su año empieza ese día. Cada liga funciona una sola vez.']].map(([t, d], k) => `<li><span class="ri-num">0${k + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
</div></section>

${p ? seccionCompra({ titulo: 'Empieza tu Ruta', intro: `${precioT}, pago único con acceso por un año. Lo recibido va para <a href="${IMPACTO_URL}" target="_blank" rel="noopener">IMPACTO</a>.`,
  pasos: [['Pagas una sola vez', 'Con tarjeta, en OXXO o por SPEI. No se renueva solo.'], ['Te llega tu acceso por correo', 'Con el botón «Empezar mi Ruta». Si es regalo, te llega una liga por cada uno.'], ['Empiezas tu primer nivel', 'En el celular o la computadora, sin descargar nada.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Acceso por un año desde que entras', 'Soporte de personas por correo y WhatsApp'],
  form: formCompra(p, { error: url.searchParams.get('error') || '', ref: code || '', regalo, mensajeEjemplo: '¡Tu proyecto puede cambiar tu colonia!' }) })
  : `<section class="ri-sec suave" id="comprar"><div class="marco"><p class="ri-pronto">La venta abre muy pronto. ¿Dudas? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> o por <a href="${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>.</p></div></section>`}

${seccionResenas(rs)}
${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), whatsappTexto: 'Hola, tengo una duda sobre Ruta de Impacto',
  pie: `<p class="t-nota t-legal">Ruta de Impacto · Powered by vorka.mx · Lo recibido va para <a href="${IMPACTO_URL}" target="_blank" rel="noopener">IMPACTO</a></p>` })}
${await masTienda(env, 'examenes')}
${p ? `<div class="t-barra" id="barra-compra"><div><b class="num">${precioT}</b><small>Pago único · 1 año</small></div><a class="btn acento chico" href="#comprar">Empezar</a></div>` : ''}
</div>`,
  });
}

const CSS = `
.ri{--ri-tinta:#0f0d10;--ri-indigo:#2a2479;--ri-noche:#120e33;--ri-morado:#6b2a85;--ri-morado-c:#c59bd9;--ri-oro:#c8a45c;--ri-oro-c:#f5d08a;--ri-crema:#f4f2f5;font-family:'Inter Tight','Inter',system-ui,-apple-system,sans-serif}
[data-tema="oscuro"] .ri{--ri-morado:#c59bd9}
.ri-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--fg);color:var(--bg);font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 10px 26px -12px rgba(20,17,20,.5);transition:transform .2s var(--ease),background .2s}
.ri-btn:hover{transform:translateY(-1px)}.ri-hero .ri-btn:not(.ghost),.ri-osc .ri-btn:not(.ghost){background:var(--ri-oro-c);color:#1b1408;box-shadow:0 10px 26px -12px rgba(0,0,0,.6)}.ri-hero .ri-btn:not(.ghost):hover,.ri-osc .ri-btn:not(.ghost):hover{background:#fbe2ad}.ri-btn svg{width:17px;height:17px}
.ri-btn.ghost{background:rgba(255,255,255,.06);color:var(--ri-crema);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}.ri-btn.ghost:hover{background:rgba(255,255,255,.12)}
/* portada */
.ri-hero{position:relative;isolation:isolate;overflow:hidden;margin-top:-104px;padding:140px 0 26px;background:var(--ri-noche);color:var(--ri-crema)}
.ri-hero::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(55% 70% at 85% 25%,rgba(67,56,202,.55),transparent 70%),radial-gradient(40% 50% at 0% 100%,rgba(200,164,92,.16),transparent 70%)}
.ri-hero-g{display:grid;gap:40px;align-items:center;padding-bottom:30px}.ri-hero-g>*{min-width:0}
@media(min-width:960px){.ri-hero-g{grid-template-columns:1.1fr .9fr}}
.ri-marca{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:26px;letter-spacing:-.05em}.ri-marca i{width:30px;height:14px;border-bottom:3px solid var(--ri-crema);border-radius:0 0 50% 50%;position:relative}.ri-marca i::after{content:"";position:absolute;right:-4px;top:-2px;width:8px;height:8px;border-radius:50%;background:var(--ri-oro)}
.ri-h1{font-weight:800;font-size:clamp(40px,6.2vw,76px);line-height:1;letter-spacing:-.05em;margin:24px 0 0;max-width:13ch;text-wrap:balance}.ri-h1 em{font-style:normal;color:var(--ri-oro-c)}
.ri-lead{margin-top:20px;font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:rgba(244,242,245,.78);max-width:34em}
.ri-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.ri-hero .t-ya{color:rgba(244,242,245,.7)}.ri-hero .t-ya a{color:var(--ri-oro-c)}
.ri-chips{list-style:none;padding:0;margin:24px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14.5px;color:rgba(244,242,245,.75)}
.ri-chips li{display:inline-flex;align-items:center;gap:7px}.ri-chips svg{width:18px;height:18px;color:var(--ri-oro-c)}
.ri-hero .t-nav-tienda{margin-top:8px}.ri-hero .t-nav-tienda a{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:rgba(244,242,245,.8)}.ri-hero .t-nav-tienda a[aria-current]{background:var(--ri-crema);border-color:var(--ri-crema);color:var(--ri-tinta)}
.ri-hero>.t-nav-tienda{width:min(100% - 32px,1180px);margin:0 auto}
.ri-escena{position:relative;justify-self:center;width:min(100%,340px);padding:10px 0 60px}
.ri-cel{margin:0;border-radius:44px;padding:10px;background:#0a0a0a;box-shadow:0 0 0 2px #2a2a2a,0 50px 90px -40px rgba(0,0,0,.6)}
.ri-cel img{display:block;width:100%;height:auto;border-radius:35px;background:#faf9f7}
.ri-cel.corta{border-radius:30px}.ri-cel.corta img{border-radius:22px}
.ri-noti{position:absolute;left:-30px;right:20px;bottom:0;display:flex;gap:11px;align-items:flex-start;padding:12px 14px;border-radius:22px;background:rgba(244,242,245,.94);color:#111;font:14px/1.35 -apple-system,'Inter Tight',sans-serif;box-shadow:0 24px 50px -20px rgba(0,0,0,.7)}
.ri-noti b{display:block;font-weight:700}.ri-noti-ic{display:grid;place-items:center;flex:none;width:38px;height:38px;border-radius:10px;background:var(--ri-oro);color:#1b1408}.ri-noti-ic svg{width:21px;height:21px}
@media(max-width:600px){.ri-noti{left:-6px;right:-6px}}
/* secciones */
.ri-sec{padding:clamp(56px,8vw,104px) 0}.ri-sec.suave{background:var(--bg-2)}
.ri-osc{background:var(--ri-noche);color:var(--ri-crema)}
.ri-cab{max-width:700px;margin:0 auto 38px;text-align:center}.ri-cab.izq{text-align:left;margin:0 0 24px}
.ri-et{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ri-morado)}.ri-osc .ri-et{color:var(--ri-oro-c)}
.ri-cab h2{font-weight:800;font-size:clamp(30px,4.2vw,50px);line-height:1.04;letter-spacing:-.045em;margin:10px 0 0;text-wrap:balance}
.ri-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}.ri-osc .ri-cab p{color:rgba(244,242,245,.74)}
.ri-ben{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.ri-ben li,.ri-caja{padding:22px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.ri-ben svg,.ri-caja svg,.ri-campo svg{width:40px;height:40px;padding:9px;border-radius:12px;background:color-mix(in srgb,var(--ri-morado) 12%,transparent);color:var(--ri-morado)}
.ri-ben b{display:block;font-size:18px;letter-spacing:-.015em;margin-top:12px}.ri-ben p,.ri-caja p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
.ri-capturas{display:grid;gap:22px;margin-top:40px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));align-items:start;justify-items:center}
.ri-capturas .ri-cel{width:min(100%,290px)}.ri-capturas.dos{margin-top:0}
.ri-pie{margin:16px 0 0;text-align:center;color:var(--fg-2);font-size:13.5px}
.ri-niveles{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.ri-niveles li{padding:24px;border-radius:24px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}
.ri-niveles li.final{border-color:rgba(245,208,138,.5);background:rgba(245,208,138,.07)}
.ri-num{display:block;font-weight:800;font-size:14px;color:var(--ri-oro-c);letter-spacing:.06em;text-transform:uppercase}
.ri-niveles b,.ri-pasos b{display:block;font-size:21px;letter-spacing:-.02em;margin-top:10px}.ri-niveles p,.ri-pasos p{margin:6px 0 0;color:rgba(244,242,245,.72);line-height:1.5}
.ri-reto{margin-top:14px!important;padding-top:12px;border-top:1px solid rgba(255,255,255,.1);font-size:15px}.ri-reto span{display:block;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ri-morado-c);margin-bottom:4px}
.ri-dos{display:grid;gap:40px;align-items:start}.ri-dos>*{min-width:0}@media(min-width:980px){.ri-dos{grid-template-columns:1fr 1fr}}
.ri-campo{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:12px}.ri-campo li{display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:18px;background:var(--card);border:1px solid var(--line)}
.ri-campo svg{flex:none}.ri-campo b{display:block;font-size:17px;margin-bottom:2px}.ri-campo span{color:var(--fg-2);font-size:15px;line-height:1.5}.ri-campo span b{color:var(--fg)}
.ri-tabla-c{border-radius:22px;border:1px solid var(--line);background:var(--card);overflow:hidden}
.ri-tabla{width:100%;border-collapse:collapse;font-size:15.5px}.ri-tabla th,.ri-tabla td{padding:14px 18px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}
.ri-tabla thead th{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--fg-2);font-weight:700}.ri-tabla td{text-align:right;font-weight:800;font-size:20px;font-variant-numeric:tabular-nums}
.ri-tabla tbody th{font-weight:700}.ri-tabla small{display:block;font-weight:400;color:var(--fg-2);font-size:14px;margin-top:3px;line-height:1.45}.ri-tabla .tot>*{border-bottom:0;background:color-mix(in srgb,var(--ri-morado) 8%,transparent)}
.ri-sparks{display:grid;gap:22px;align-items:start}@media(min-width:620px){.ri-sparks{grid-template-columns:240px 1fr}}
.ri-sparks .ri-cel{width:min(100%,280px);justify-self:center}
.ri-sparks-t{padding:26px;border-radius:26px;background:var(--ri-noche);color:var(--ri-crema)}
.ri-sparks-t h3{font-weight:800;font-size:clamp(24px,2.6vw,30px);letter-spacing:-.03em;line-height:1.12;margin:14px 0 0}.ri-sparks-t p{margin:10px 0 0;color:rgba(244,242,245,.76);line-height:1.55}.ri-sparks-t p b{color:#fff}.ri-sparks-t a{color:var(--ri-oro-c)}
.ri-pill{display:inline-block;padding:5px 12px;border-radius:999px;background:linear-gradient(100deg,#a8853f,#c8a45c 55%,#e6cf96);color:#1b1408;font-size:12.5px;font-weight:800}
.ri-tres{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.ri-caja h3{font-size:20px;letter-spacing:-.02em;margin:12px 0 0}
.ri-impacto{background:var(--ri-noche);border-color:var(--ri-noche);color:var(--ri-crema)}.ri-impacto svg{background:rgba(245,208,138,.15);color:var(--ri-oro-c)}.ri-impacto h3{font-size:24px}.ri-impacto a{color:var(--ri-oro-c);font-weight:700}
.ri-sub{margin:0 0 12px;color:var(--fg-2)}
.ri-temas{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px}.ri-temas li{padding:9px 16px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-weight:650;font-size:15px}
.ri-pasos{list-style:none;padding:0;margin:0;display:grid;gap:12px}.ri-pasos li{padding:20px 22px;border-radius:22px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}.ri-pasos b{margin-top:6px}
.ri-pronto{text-align:center;font-size:18px;color:var(--fg-2)}
.ri #form-compra .btn.acento{background:var(--fg);color:var(--bg);box-shadow:0 10px 26px -12px rgba(20,17,20,.5)}`;
