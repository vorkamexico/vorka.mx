// Vuelve (tarjetas de lealtad digitales; tercera app de Diversificación de Vorka México).
// /tienda/vuelve/ → ficha comercial corta: portada con la demo en vivo, cómo funciona, qué incluye, un solo plan, compra y preguntas.
// Se cobra por suscripción (ver suscripciones.js). La app vive en os.vorka.mx/vuelve/ y el registro de clientes de cada
// negocio en vorka.mx/vuelve/<negocio> (→ os.vorka.mx/v/<negocio>). Aquí solo se vende.
import { lineaMarca, colorDe, indiceProducto, CSS_MARCA, CSS_SECCIONES } from './marca-producto.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { GIROS, RUTA_MIRA } from './miratunegocio.js';
import { oferta, ofertas, migas } from './seo.js';
import { resenasDe, ldResenas, seccionResenas } from './resenas.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { GIROS_VUELVE } from './vuelve-giros.generado.js';

const OS = 'https://os.vorka.mx';
// El negocio de ejemplo: el dueño saca una tarjeta en su celular y simula visitas (lo arma Vorka OS, se borra solo al día)
const DEMO = 'https://vorka.mx/vuelve/demo';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_VUELVE = '/tienda/vuelve/';
// "Te lo dejamos listo": videollamada de 15 minutos con el equipo, gratis para los primeros negocios
const WA_LISTO = `https://wa.me/528117804869?text=${encodeURIComponent('Hola, quiero que me ayuden a dejar listo Vuelve en una videollamada de 15 minutos.')}`;
const PLANES = [{ slug: 'vuelve-mensual', extra: 'vuelve-sucursal-mensual', nombre: 'Mensual', cada: 'al mes' }, { slug: 'vuelve-anual', extra: 'vuelve-sucursal-anual', nombre: 'Anual', cada: 'al año', nota: '2 meses gratis' }];

// Todo lo que trae el plan (la lista corta va en la tarjeta de precio; lo demás, en «Qué incluye»)
const INCLUYE = ['Clientes y avisos ilimitados', 'Sellos o puntos, premios y niveles (Bronce, Plata, Oro)', 'Tu tarjeta en Apple Wallet y Google Wallet, con tu logo y tus colores',
  'Avisos de cumpleaños, de «te extrañamos» y al pasar cerca, automáticos', 'Reporte de clientes que regresaron y del dinero que dejaron', 'Escáner para tu equipo con PIN y bitácora', 'Cartel con QR listo para imprimir'];
const faq = ({ dias = 7 } = {}) => [
  ['¿Puedo probar antes de pagar?', `Sí. Creas tu programa en <a href="${OS}/vuelve/">os.vorka.mx/vuelve</a> y lo usas completo ${dias} días, sin tarjeta. Si te sirve, te suscribes; si no, no pasa nada. Y si quieres verlo como lo verán tus clientes, <a href="${DEMO}">saca una tarjeta de ejemplo</a>.`],
  ['¿Mis clientes tienen que descargar una app?', 'No. Escanean tu QR, escriben su nombre y teléfono, y su tarjeta queda en Apple Wallet, Google Wallet o como tarjeta en su navegador. Tarda menos de 30 segundos.'],
  ['¿Me ayudan a dejarlo listo?', `Sí, gratis. En una videollamada de 15 minutos lo dejamos funcionando contigo: tu tarjeta con tu logo, tu premio, tu cartel con QR y tu primer cliente registrado. <a href="${WA_LISTO}" target="_blank" rel="noopener">Pídela por WhatsApp</a>.`],
  ['¿Cómo funcionan los avisos?', 'Vuelve manda solo la felicitación de cumpleaños con un regalo, un «te extrañamos» a quien lleva tiempo sin venir y los avisos que tú escribas para todos o para un grupo. Llegan a la tarjeta de su celular, sin costo por mensaje. En iPhone, cuando tu cliente pasa cerca de tu sucursal, su tarjeta aparece en la pantalla de bloqueo con tu mensaje; depende de los permisos de ubicación de cada persona y te lo decimos claro.'],
  ['¿Cómo sé si de verdad funciona?', 'En tu panel ves cuántos clientes regresaron, cada cuánto vienen y cuánto dinero te dejaron (con el ticket que registras al sellar o con tu ticket promedio). También ves cuántos regresaron después de cada aviso.'],
  ['¿Qué pasa con los datos de mis clientes?', 'Son tuyos. Los descargas en Excel cuando quieras, también si cancelas. Vorka solo los guarda para darte el servicio: no los vende ni los usa para publicidad. Cada cliente puede pedir su baja desde su tarjeta.'],
  ['¿Cuánto cuesta, cómo pago y cómo cancelo?', 'Un solo plan con todo, mensual o anual (con 2 meses gratis), con tarjeta y procesado por Stripe. Incluye una sucursal; cada sucursal o negocio adicional con el mismo correo se suma al precio de sucursal. Cancelas cuando quieras desde Vuelve › Cuenta, sin llamadas, y tu programa sigue hasta el final del periodo pagado. Tu comprobante de pago de cada cobro lo descargas en Vuelve › Cuenta. Si necesitas factura (CFDI), pídela a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> dentro del mismo mes del cobro.'],
];

// ---------- identidad de Vuelve (la misma de la app: la familia de Vorka —tinta, marfil, morado y oro— y la palabra "vuelve") ----------
// La marca es solo la palabra "vuelve" (Inter Tight), en la familia de colores de Vorka
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONO = {
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'), wallet: ico('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>'), reloj: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  pesos: ico('<path d="M12 3v18M16.5 7.5c-.7-1.5-2.4-2.5-4.5-2.5-2.5 0-4.5 1.4-4.5 3.4 0 4.6 9 2.4 9 7.2 0 2-2 3.4-4.5 3.4-2.3 0-4.1-1-4.8-2.7"/>'), campana: ico('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  amigos: ico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.4 3.5 5.2"/>'), escudo: ico('<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
  pin: ico('<path d="M12 21s-7-6.3-7-11.5a7 7 0 0 1 14 0C19 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'), datos: ico('<path d="M4 5h16v14H4z"/><path d="M4 10h16M10 10v9"/>'),
};
// De dónde llega cada visita, para saber qué trae negocios: ?invita=<negocio que recomienda>&o=<tarjeta, dueno…>, ?utm_source
// o el sitio de donde vino. Se guarda 30 días en una cookie y viaja en las ligas a la app (ahí se queda con la cuenta).
const SITIOS = [[/instagram\./, 'instagram'], [/facebook\.|fb\.|messenger\./, 'facebook'], [/tiktok\./, 'tiktok'], [/google\./, 'google'], [/bing\.|duckduckgo\./, 'buscador'],
  [/whatsapp\.|wa\.me/, 'whatsapp'], [/(^|\.)t\.co$|twitter\.|x\.com/, 'x'], [/linkedin\./, 'linkedin']];
export function fuenteVisita(req, url) {
  const limpia = v => String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30) || null;
  const invita = /^[a-z0-9-]{3,60}$/.test(url.searchParams.get('invita') || '') ? url.searchParams.get('invita') : null;
  let o = limpia(url.searchParams.get('o') || url.searchParams.get('utm_source'));
  if (!o && !invita) {
    let host = ''; try { host = new URL(req.headers.get('referer') || '').hostname; } catch { /* sin referer */ }
    o = SITIOS.find(([re]) => re.test(host))?.[1] || null;
  }
  if (invita || o) return { invita, o, cookie: `vu_fuente=${encodeURIComponent(`${invita || ''}|${o || ''}`)}; Max-Age=${30 * 86400}; Path=/; Secure; SameSite=Lax` };
  const g = (req.headers.get('cookie') || '').match(/(?:^|;\s*)vu_fuente=([^;]+)/);
  if (!g) return { invita: null, o: null, cookie: null };
  const [i, oo] = decodeURIComponent(g[1]).split('|');
  return { invita: /^[a-z0-9-]{3,60}$/.test(i) ? i : null, o: limpia(oo), cookie: null };
}
// Pregunta a Vorka OS (por el enlace directo); si tarda o falla, la página sale igual
async function deOS(env, ruta) {
  try {
    const p = (env.OS ? env.OS.fetch(new Request(`${OS}${ruta}`)) : fetch(`${OS}${ruta}`)).then(r => r.ok ? r.json() : null);
    return await Promise.race([p, new Promise(res => setTimeout(() => res(null), 1500))]);
  } catch { return null; }
}


const WA_ICONO = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z"/></svg>';
// El quiz de la portada: tres preguntas (giro, nombre y premio) con la tarjeta armándose a la vista y, al final, cómo le llega
// el aviso a su cliente. «Crear mi cuenta gratis» abre el asistente de la app con todo lleno (?g&n&p&m&t, ver borradorDelQuiz en
// Vorka OS public/vuelve/app.js): solo falta su correo y empiezan sus días gratis.
const GIROS_QUIZ = ['cafeteria', 'restaurante', 'taqueria', 'barberia', 'salon', 'unas', 'gimnasio', 'dental'];
const quiz = ({ dias, app }) => `<div class="vq" id="quiz" data-app="${esc(app)}">
  <div class="vq-cab"><button class="vq-atras" type="button" hidden aria-label="Atrás">←</button><ol class="vq-barra" aria-label="Tu avance"><li class="on">Tu negocio</li><li>Tu premio</li><li>Tu tarjeta</li></ol></div>
  <section class="vq-paso" data-p="1"><h2 class="vq-t">Arma tu tarjeta en un minuto. ¿Qué tipo de negocio tienes?</h2>
    <div class="vq-giros">${Object.entries(GIROS_VUELVE).filter(([k]) => k !== 'otro').sort(([a], [b]) => (GIROS_QUIZ.indexOf(a) + 1 || 99) - (GIROS_QUIZ.indexOf(b) + 1 || 99)).map(([k, g], i) => `<button type="button" class="vq-giro" data-g="${k}"${i >= GIROS_QUIZ.length ? ' data-extra hidden' : ''}><span aria-hidden="true">${g.e}</span>${esc(g.n)}</button>`).join('')}<button type="button" class="vq-giro" data-g="otro" data-extra hidden><span aria-hidden="true">${GIROS_VUELVE.otro.e}</span>Otro negocio</button></div>
    <button class="vq-mas" type="button">Ver más giros</button>
    <p class="vq-eco" aria-live="polite" hidden></p></section>
  <section class="vq-paso" data-p="2" hidden><h2 class="vq-t">¿Cómo se llama tu negocio?</h2>
    <input class="vq-in" id="vq-nombre" maxlength="60" placeholder="Ej. Café La Paloma" autocomplete="organization" aria-label="Nombre de tu negocio">
    <div class="vq-prev" aria-hidden="true"></div>
    <button class="pm-btn vq-sig" type="button" data-ir="3">Siguiente ${FLECHA}</button></section>
  <section class="vq-paso" data-p="3" hidden><h2 class="vq-t">¿Qué le regalas a tus clientes?</h2>
    <div class="vq-ideas"></div>
    <input class="vq-in" id="vq-premio" maxlength="60" aria-label="El premio">
    <label class="vq-meta"><span id="vq-meta-l">Se lo gana con</span><span class="vq-cont"><button type="button" data-m="-1" aria-label="Menos">−</button><output id="vq-meta">10</output><button type="button" data-m="1" aria-label="Más">+</button></span><span id="vq-meta-u">visitas</span></label>
    <button class="pm-btn vq-sig" type="button" data-ir="4">Ver mi tarjeta ${FLECHA}</button></section>
  <section class="vq-paso" data-p="4" hidden><h2 class="vq-t">Así le llega a tu cliente.</h2>
    <div class="vq-cel" aria-hidden="true"><b class="vq-hora">9:41</b><div class="vq-notis"></div></div>
    <p class="vq-dice">Le llega a su celular, sin que tú hagas nada y sin costo por mensaje.</p>
    <a class="pm-btn vq-crear" href="${esc(app)}#/nuevo">Crear mi cuenta gratis ${FLECHA}</a>
    <p class="vq-nota">${dias} días gratis, sin tarjeta. Solo te pedimos tu correo.</p></section>
</div>
<script type="application/json" id="vq-giros">${JSON.stringify(GIROS_VUELVE).replace(/</g, '\\u003c')}</script>`;
// Giros que se ven en la página: cada uno abre «Mira tu negocio» con su giro ya elegido
const GIROS_VISTOS = ['cafeteria', 'restaurante', 'taqueria', 'panaderia', 'heladeria', 'barberia', 'estetica', 'unas', 'pestanas', 'spa', 'podologia', 'dental', 'fisioterapia', 'nutricion', 'optica', 'veterinaria', 'floreria', 'boutique', 'gimnasio', 'autolavado', 'lavanderia', 'taller'];

export async function paginaVuelve(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug), sucursal: await productoPorSlug(env, x.extra) })))).filter(x => x.prod);
  if (planes[0] && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: planes[0].prod.id, ref_code: code }, req);
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : planes[0]?.slug;
  const error = url.searchParams.get('error') || '';
  // Desde la app (Suscribirme) llega el correo de la cuenta para que la suscripción quede ligada a ella
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  // y cuántos lugares adicionales ya usa (sucursales o negocios de más con el mismo correo)
  const lugares = Math.min(20, Math.max(0, parseInt(url.searchParams.get('sucursales') || '0', 10) || 0));
  const mensual = planes.find(x => x.slug === 'vuelve-mensual'), anual = planes.find(x => x.slug === 'vuelve-anual');
  // Quién lo recomendó (prueba de 30 días) y si el directorio ya tiene suficientes negocios para presumirlo
  const fuente = fuenteVisita(req, url);
  const [dir, reco] = await Promise.all([deOS(env, '/api/vuelve/publico/directorio'), fuente.invita ? deOS(env, `/api/vuelve/publico/recomienda/${fuente.invita}`) : null]);
  const dias = reco?.dias || 7, FAQ = faq({ dias });
  const q = new URLSearchParams(Object.entries({ invita: reco ? fuente.invita : null, o: fuente.o }).filter(([, v]) => v)).toString();
  const nuevo = `${OS}/vuelve/${q ? `?${q}` : ''}#/nuevo`;
  const rs = planes.length ? await resenasDe(env, RUTA_VUELVE) : null;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Vuelve · Tarjeta de lealtad digital para tu negocio', brand: { '@type': 'Brand', name: 'Vuelve' },
    description: 'Tarjeta de lealtad digital con sellos o puntos en Apple Wallet y Google Wallet, sin app. Avisos automáticos de cumpleaños y de regreso, y el dinero que te traen de vuelta, medido. Prueba 7 días gratis.',
    image: ['https://vorka.mx/assets/tienda/v3/vuelve-og.jpg'],
    ...(planes.length ? { offers: planes.map(x => oferta({ ruta: RUTA_VUELVE, centavos: x.prod.precio_centavos, name: `Plan ${x.nombre.toLowerCase()}` })), ...ldResenas(rs) } : {}) },
  migas('Vuelve', RUTA_VUELVE),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const datos = Object.fromEntries(planes.map(x => [x.slug, { p: x.prod.precio_centavos, s: x.sucursal?.precio_centavos ?? null, cada: x.cada }]));
  const res = pagina({ navActual: 'catalogo', entrar: { url: `${OS}/vuelve/#entrar`, app: 'Vuelve' },
    titulo: 'Vuelve: tarjeta de lealtad digital para tu negocio | Prueba 7 días gratis', ruta: RUTA_VUELVE, imagen: 'https://vorka.mx/assets/tienda/v3/vuelve-og.jpg',
    descripcion: 'Tu tarjeta de lealtad digital en Apple Wallet y Google Wallet, sin app ni cartón: sellos o puntos, avisos automáticos y el dinero que regresó, medido. Prueba 7 días gratis, sin tarjeta.',
    head: `<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="vu" style="--pm:${colorDe('vuelve')}">
<section class="pm-hero vu-hero"><div class="marco pm-g vu-hero-g">
  <div class="pm-txt">${lineaMarca('vuelve')}${reco ? `<p class="vu-reco">🎁 Te recomendó <b>${esc(reco.nombre)}</b>: pruébalo ${dias} días gratis</p>` : ''}
    <h1 class="pm-h1">Tu <em>tarjeta de lealtad digital</em>, en el celular de tus clientes.</h1>
    <p class="pm-lead">Sellos o puntos en su Apple Wallet o Google Wallet, sin app y sin cartón. Vuelve les recuerda regresar y tú ves cuánto dinero te dejaron.</p>
    <div class="pm-ctas"><a class="pm-btn" href="#quiz">Pruébalo ${dias} días gratis ${FLECHA}</a><a class="pm-btn sec" href="${WA_LISTO}" target="_blank" rel="noopener">${WA_ICONO} Te lo dejamos listo</a></div>
    <p class="pm-precio">${mensual ? `<b>${precio(mensual.prod)}</b> al mes con todo incluido · ` : ''}${dias} días gratis, sin tarjeta</p>
    <p class="vu-listo-h">¿Sin tiempo? En una videollamada de 15 minutos lo dejamos funcionando contigo, gratis.</p>
    <p class="t-ya">¿Ya tienes cuenta? <a href="${OS}/vuelve/#entrar">Entra aquí</a></p>
  </div>
  <div class="vu-quiz" id="ejemplo">${quiz({ dias, app: `${OS}/vuelve/${q ? `?${q}` : ''}` })}
    <p class="vu-quiz-pie">¿La quieres ver primero como tu cliente? <a href="${DEMO}" target="_blank" rel="noopener">Saca la tarjeta de ejemplo</a></p></div>
</div></section>
${indiceProducto('vuelve', [['como', 'Cómo funciona'], ['incluye', 'Qué incluye'], ['planes', 'Precio'], ['ayuda', 'Preguntas']], `<a class="pm-btn" href="#quiz">Pruébalo gratis</a>`)}

<section class="vu-sec" id="como"><div class="marco">
  <div class="vu-cab"><h2>Lista hoy, desde tu celular.</h2><p>Sin computadora y sin instalar nada. Si te atoras, te ayuda una persona.</p></div>
  <ul class="vu-tres">${[[ICONO.wallet, 'Armas tu tarjeta', 'Tu logo, tus colores y tu premio. Vuelve te sugiere sellos y mensajes según tu giro.'],
    [ICONO.check, 'Tus clientes la guardan', 'Escanean el QR de tu caja y la guardan en su celular en 30 segundos, sin descargar nada.'],
    [ICONO.campana, 'Regresan solos', 'Les avisa en su cumpleaños y cuando llevan tiempo sin venir. Tú ves quién regresó y cuánto dejó.']].map(([ic, t, d]) => `<li>${ic}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="vu-sec suave" id="incluye"><div class="marco">
  <div class="vu-cab"><h2>Lo que hace que regresen.</h2><p>Todo viene en el mismo plan desde el primer día.</p></div>
  <ul class="vu-ben">${[[ICONO.campana, 'Avisos que trabajan solos', 'Cumpleaños con regalo, «te extrañamos» y tus promociones. Llegan a su tarjeta, sin costo por mensaje, y en iPhone aparece cuando pasan cerca de tu sucursal.'],
    [ICONO.pesos, 'El dinero que regresó, medido', 'Cuántos clientes volvieron, cada cuánto y cuánto dejaron. También cuántos regresaron después de cada aviso.'],
    [ICONO.escudo, 'Sin sellos regalados', 'Cada persona de tu equipo sella con su PIN, hay tope de sellos al día y todo queda en una bitácora.']].map(([ic, t, d]) => `<li>${ic}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
  <ul class="vu-mas">${['Trae a un amigo: los dos ganan en su primera visita', 'Varias sucursales, cada una con su equipo', 'Tus clientes en Excel cuando quieras', 'Cartel con QR listo para imprimir', `Tu liga propia${dir?.visible ? ' y lugar en el <a href="/vuelve/negocios">directorio de negocios Vuelve</a>' : ''}`, 'Aviso de privacidad listo para tu negocio'].map(t => `<li>${CHECK}<span>${t}</span></li>`).join('')}</ul>
  <div class="vu-giros"><p>Sirve para cualquier negocio con clientes que pueden regresar:</p>
    <ul>${GIROS_VISTOS.filter(k => GIROS[k]).map(k => `<li><a href="${RUTA_MIRA}?g=${k}">${esc(GIROS[k].nombre)}</a></li>`).join('')}</ul>
    <a class="vu-liga" href="${RUTA_MIRA}">Mira cómo quedaría la tarjeta de tu negocio ${FLECHA}</a></div>
</div></section>

<section class="vu-sec" id="planes"><div class="marco">
  <div class="vu-cab"><h2>Un solo plan, con todo incluido.</h2><p>Clientes y avisos ilimitados. En pesos mexicanos con IVA incluido. Cancelas cuando quieras.</p></div>
  <div class="vu-precio-g">
    <article class="vu-plan">
      <h3>Vuelve</h3>
      ${mensual ? `<p class="vu-precio"><b>${precio(mensual.prod)}</b> <small>al mes</small></p>${anual ? `<p class="vu-anual">o ${precio(anual.prod)} al año, con 2 meses gratis</p>` : ''}` : `<p class="vu-precio"><b>${dias} días gratis</b></p>`}
      <ul>${INCLUYE.map(i => `<li>${CHECK}<span>${i}</span></li>`).join('')}${mensual?.sucursal ? `<li>${CHECK}<span>Sucursal o negocio adicional: ${precio(mensual.sucursal)} al mes</span></li>` : ''}</ul>
      <a class="pm-btn vu-ancho" href="#quiz">Empieza tus ${dias} días gratis ${FLECHA}</a>
      <p class="vu-nota">Sin tarjeta. Si decides seguir, tus clientes conservan su tarjeta.</p>
      ${planes.length ? `<p class="vu-sus">¿Ya lo probaste? Suscríbete ${planes.map(x => `<a href="?plan=${x.slug}#comprar" data-plan="${x.slug}">${x.nombre.toLowerCase()}</a>`).join(' o ')}.</p>` : `<p class="vu-nota">La suscripción abre muy pronto. Mientras, <a href="${esc(nuevo)}">empieza tu prueba gratis</a>.</p>`}
    </article>
    <aside class="vu-listo">
      <b>Te lo dejamos listo en 15 minutos, gratis.</b>
      <p>Una videollamada con una persona del equipo y sales con todo funcionando:</p>
      <ul>${['Tu tarjeta con tu logo y tu premio', 'Tu cartel con QR para la caja', 'Tu primer cliente registrado'].map(t => `<li>${CHECK}<span>${t}</span></li>`).join('')}</ul>
      <a class="pm-btn sec vu-ancho" href="${WA_LISTO}" target="_blank" rel="noopener">${WA_ICONO} Pedirla por WhatsApp</a>
    </aside>
  </div>
</div></section>

${planes.length ? seccionCompra({ titulo: 'Suscríbete a Vuelve', intro: `¿Aún no lo pruebas? <a href="#quiz">Empieza gratis ${dias} días</a>, sin tarjeta. Si ya lo estás probando, suscríbete con el mismo correo y tu programa sigue tal cual.`,
  pasos: [],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por correo y WhatsApp'],
  form: `<form class="t-form t-compra" id="form-vuelve" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="slug">Plan</label><select id="slug" name="slug">${planes.map(x => `<option value="${esc(x.slug)}"${elegido === x.slug ? ' selected' : ''}>${x.nombre} · ${precio(x.prod)} ${x.cada}${x.nota ? ` (${x.nota})` : ''}</option>`).join('')}</select></div>
    <div class="t-campo"><label for="sucursales">Sucursales o negocios adicionales</label><input id="sucursales" name="sucursales" type="number" inputmode="numeric" min="0" max="20" value="${lugares}"><small class="t-ayuda">Tu plan incluye un lugar. Cada sucursal de más, o cada negocio distinto con el mismo correo, se suma aquí al mismo precio.</small></div>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo de tu prueba para que tu programa siga igual.</small></div>
    <p class="vu-total">Pagas hoy <b id="vu-total">${planes[0] ? precio(planes.find(x => x.slug === elegido)?.prod || planes[0].prod) : ''}</b> <span id="vu-cada"></span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/vuelve/" target="_blank">condiciones de Vuelve</a> (incluida la renovación automática) y el <a href="/legal/vuelve/privacidad/" target="_blank">aviso de privacidad de Vuelve</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="vu-precios">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionResenas(rs)}
${seccionFaq({ titulo: 'Antes de empezar', whatsappTexto: 'Hola, tengo una pregunta sobre Vuelve.', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/vuelve/">Condiciones de Vuelve</a> · <a href="/legal/vuelve/privacidad/">Aviso de privacidad</a> · <a href="/legal/vuelve/privacidad-clientes/">Privacidad para clientes de cada negocio</a> · Vuelve · Powered by vorka.mx</p>' })}
</div>`,
  });
  if (fuente.cookie) res.headers.append('set-cookie', fuente.cookie);
  return res;
}

const CSS = `${CSS_MARCA}${CSS_SECCIONES}
.vu{--pm-t:var(--pm);font-family:'Inter Tight','Inter',system-ui,-apple-system,sans-serif}
/* en oscuro, el color de Vuelve se aclara para que ligas e iconos se lean */
:root[data-tema=oscuro] .vu{--pm-t:color-mix(in srgb,var(--pm) 55%,#fff)}@media(prefers-color-scheme:dark){:root:not([data-tema=claro]) .vu{--pm-t:color-mix(in srgb,var(--pm) 55%,#fff)}}
/* Sin letreritos en mayúsculas ni pasos numerados en esta página */
.vu .etiqueta,.vu .t-pasos-compra:empty{display:none}
.vu .pm-btn svg{width:18px;height:18px}
/* portada: el texto a la izquierda y el celular con la demo a la derecha (abajo en celular) */
.vu-hero-g{align-items:center}
.pm-precio{margin:16px 0 0;font-size:15px;color:var(--fg-2)}.pm-precio b{font-size:20px;color:var(--fg);letter-spacing:-.02em}
.vu-listo-h{margin:8px 0 0;font-size:15px;color:var(--fg-2);max-width:34em}
.vu-reco{display:inline-block;margin:16px 0 0;padding:8px 14px;border-radius:999px;background:color-mix(in srgb,var(--pm) 12%,transparent);color:var(--fg);font-size:15px}
/* quiz de la portada */
.vu-quiz{justify-self:center;width:min(460px,100%)}
.vu-quiz-pie{margin:12px 0 0;text-align:center;font-size:14.5px;color:var(--fg-2)}.vu-quiz-pie a{color:var(--pm-t);font-weight:700}
.vq{scroll-margin-top:96px;position:relative;padding:22px;border-radius:28px;background:var(--card,var(--bg));border:1px solid var(--line);box-shadow:0 40px 80px -50px rgba(20,17,20,.55);min-height:430px}
.vq-cab{display:flex;align-items:center;gap:10px}
.vq-atras{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:none;color:var(--fg);font-size:17px;cursor:pointer}
.vq-barra{flex:1;list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.vq-barra li{font-size:12.5px;font-weight:650;color:var(--fg-2);padding-top:9px;border-top:4px solid var(--line);border-radius:2px}
.vq-barra li.on{color:var(--fg);border-top-color:var(--pm)}
.vq-t{font-weight:800;font-size:clamp(22px,2.6vw,27px);line-height:1.15;letter-spacing:-.03em;margin:20px 0 14px;text-wrap:balance}
.vq-giros{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.vq-giro{display:flex;align-items:center;gap:9px;min-height:54px;padding:8px 12px;border-radius:16px;border:1.5px solid var(--line);background:var(--bg);color:var(--fg);font:600 14.5px/1.25 inherit;text-align:left;cursor:pointer}
.vq-giro span{font-size:22px;flex:none}.vq-giro:hover,.vq-giro[aria-pressed=true]{border-color:var(--pm);background:color-mix(in srgb,var(--pm) 8%,var(--bg))}
.vq-mas{display:block;margin:12px auto 0;border:0;background:none;color:var(--pm-t);font:700 15px inherit;text-decoration:underline;cursor:pointer}
.vq-eco{margin:14px 0 0;padding:12px 14px;border-radius:14px;background:color-mix(in srgb,var(--pm) 10%,transparent);font-size:15px;line-height:1.45}
.vq-in{width:100%;box-sizing:border-box;font:inherit;font-size:17px;min-height:52px;padding:10px 14px;border-radius:14px;border:1.5px solid var(--line-2);background:var(--bg);color:var(--fg)}
.vq-sig,.vq-crear{width:100%;margin-top:16px}
.vq-ideas{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.vq-ideas button{padding:8px 13px;border-radius:999px;border:1.5px solid var(--line);background:var(--bg);color:var(--fg);font:600 14px inherit;cursor:pointer}.vq-ideas button[aria-pressed=true]{border-color:var(--pm);color:var(--pm-t)}
.vq-meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:12px;font-weight:650;font-size:15.5px}
.vq-cont{display:inline-flex;align-items:center;border:1.5px solid var(--line-2);border-radius:999px;overflow:hidden}.vq-cont button{width:42px;height:40px;border:0;background:none;color:var(--fg);font-size:20px;cursor:pointer}.vq-cont output{min-width:54px;text-align:center;font-variant-numeric:tabular-nums}
/* la tarjeta que se arma (con los colores del giro) */
.vq-prev{margin-top:14px}
.vq-tj{border-radius:16px;padding:14px;background:var(--tc);color:#fff;box-shadow:0 20px 40px -26px rgba(0,0,0,.7)}
.vq-tj-cab{display:flex;align-items:center;gap:9px;font-weight:650;font-size:15.5px}.vq-tj-cab i{font-style:normal;display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.14)}
.vq-tj-cab span{margin-left:auto;font-weight:500;font-size:13px;opacity:.8;white-space:nowrap}
.vq-sellos{display:grid;grid-template-columns:repeat(var(--col,5),1fr);gap:7px;margin:14px 0 12px}
.vq-sellos i{aspect-ratio:1;border-radius:50%;border:2px solid color-mix(in srgb,var(--ta) 60%,transparent)}.vq-sellos i.si{background:var(--ta);border-color:var(--ta)}
.vq-puntos{margin:14px 0 10px;font-size:28px;font-weight:700;letter-spacing:-.02em}.vq-puntos small{font-size:14px;font-weight:500;opacity:.75}
.vq-tj-pie{font-size:13.5px;opacity:.85}.vq-tj-pie b{opacity:1}
.vq-cel{border-radius:26px;padding:16px 12px 14px;background:linear-gradient(160deg,#20242c,#0d0f13);color:#fff;min-height:200px}
.vq-hora{display:block;text-align:center;font-size:36px;font-weight:600;letter-spacing:-.02em;margin-bottom:12px}
.vq-noti{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:16px;background:rgba(245,245,247,.9);color:#111;font-size:13.5px;line-height:1.35;margin-top:8px;opacity:0;transform:translateY(-8px);transition:opacity .4s,transform .4s}
.vq-noti.ver{opacity:1;transform:none}.vq-noti i{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:8px;font-style:normal;color:#fff}
.vq-noti b{display:flex;justify-content:space-between;gap:8px;font-weight:650}.vq-noti b small{font-weight:400;color:#666}
.vq-dice{margin:12px 0 0;font-size:15px;color:var(--fg-2);line-height:1.45}
.vq-nota{margin:10px 0 0;text-align:center;font-size:14px;color:var(--fg-2)}
@media(prefers-reduced-motion:reduce){.vq-noti{transition:none}}
/* secciones */
.vu-sec{padding:clamp(56px,8vw,96px) 0;scroll-margin-top:64px}.vu-sec.suave{background:var(--bg-2)}
.vu-cab{max-width:640px;margin:0 auto 36px;text-align:center}
.vu-cab h2{font-weight:800;font-size:clamp(30px,4.2vw,46px);line-height:1.05;letter-spacing:-.04em;margin:0;text-wrap:balance}
.vu-cab p{margin:12px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}
.vu-tres,.vu-ben{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.vu-tres li,.vu-ben li{padding:24px;border-radius:24px;background:var(--card,var(--bg));border:1px solid var(--line)}
.vu-tres svg,.vu-ben svg{width:44px;height:44px;padding:10px;border-radius:14px;background:color-mix(in srgb,var(--pm) 12%,transparent);color:var(--pm-t)}
.vu-tres b,.vu-ben b{display:block;font-size:19px;letter-spacing:-.02em;margin-top:14px}.vu-tres p,.vu-ben p{margin:6px 0 0;color:var(--fg-2);font-size:15.5px;line-height:1.5}
.vu-mas{list-style:none;padding:0;margin:22px 0 0;display:grid;gap:10px 22px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.vu-mas li,.vu-plan li,.vu-listo li{display:flex;gap:9px;align-items:flex-start;font-size:15.5px;line-height:1.45}.vu-mas svg,.vu-plan li svg,.vu-listo li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--pm-t)}
.vu-mas a{color:var(--pm-t);font-weight:650}
.vu-giros{margin-top:40px;padding-top:30px;border-top:1px solid var(--line);text-align:center}.vu-giros p{margin:0;font-weight:650;font-size:16.5px}
.vu-giros ul{list-style:none;padding:0;margin:16px auto 0;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:900px}
.vu-giros ul a{display:inline-block;padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:var(--card,var(--bg));color:var(--fg);font-size:14.5px;text-decoration:none}.vu-giros ul a:hover{border-color:var(--pm);color:var(--pm-t)}
.vu-liga{display:inline-flex;align-items:center;gap:6px;margin-top:18px;color:var(--pm-t);font-weight:700;text-decoration:none}.vu-liga svg{width:16px;height:16px}
/* precio */
.vu-precio-g{display:grid;gap:18px;max-width:900px;margin:0 auto;align-items:start}@media(min-width:860px){.vu-precio-g{grid-template-columns:1.15fr .85fr}}
.vu-plan{background:var(--card,var(--bg));border:1.5px solid var(--pm);border-radius:26px;padding:28px;box-shadow:0 30px 60px -40px color-mix(in srgb,var(--pm) 70%,transparent)}
.vu-plan h3{font-weight:800;font-size:24px;letter-spacing:-.03em;margin:0}
.vu-precio{margin:8px 0 0}.vu-precio b{font-size:34px;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.vu-precio small{color:var(--fg-2);font-size:16px}
.vu-anual{margin:2px 0 0;color:var(--fg-2);font-size:15px}
.vu-plan ul,.vu-listo ul{list-style:none;padding:0;margin:18px 0 22px;display:grid;gap:9px}
.vu-ancho{width:100%}
.vu-nota{color:var(--fg-2);font-size:14.5px;margin:12px 0 0;text-align:center}
.vu-sus{margin:14px 0 0;padding-top:14px;border-top:1px solid var(--line);font-size:15px;color:var(--fg-2);text-align:center}.vu-sus a{color:var(--pm-t);font-weight:700}
.vu-listo{padding:26px;border-radius:26px;background:var(--bg-2);border:1px solid var(--line)}.vu-sec.suave .vu-listo{background:var(--card,var(--bg))}
.vu-listo>b{display:block;font-size:20px;letter-spacing:-.02em;line-height:1.25}.vu-listo>p{margin:8px 0 0;color:var(--fg-2);line-height:1.5}
.vu-total{margin:4px 0 12px;font-size:16px}.vu-total b{font-size:20px;font-variant-numeric:tabular-nums}
.vu #form-vuelve .btn.acento{background:var(--pm);color:#fff}
`;

const SCRIPT = `(function(){
  // quiz de la portada: giro → nombre → premio → cómo le llega el aviso → «Crear mi cuenta gratis» con todo lleno
  var Q=document.getElementById('quiz'); if(!Q) return;
  var G={}; try{ G=JSON.parse(document.getElementById('vq-giros').textContent); }catch(e){}
  var $=function(s){ return Q.querySelector(s); }, $$=function(s){ return Array.prototype.slice.call(Q.querySelectorAll(s)); };
  var esc=function(t){ return String(t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var d={ g:null, n:'', p:'', m:10, t:'sellos' }, paso=1, timer=null, visto=false;
  var gi=function(){ return G[d.g]||G.otro||{}; }, pts=function(){ return d.t==='puntos'; };
  function tarjeta(){
    var g=gi(), m=Number(d.m)||1, lleva=pts()?Math.round(m*.7/10)*10:Math.max(1,Math.min(m-1,Math.round(m*.6)));
    var cuerpo=pts()?'<p class="vq-puntos">'+lleva.toLocaleString('es-MX')+' <small>de '+m.toLocaleString('es-MX')+' puntos</small></p>'
      :'<div class="vq-sellos" style="--col:'+(m>10?6:m>6?5:m)+'">'+Array.apply(null,Array(Math.min(m,30))).map(function(_,i){ return '<i class="'+(i<lleva?'si':'')+'"></i>'; }).join('')+'</div>';
    return '<div class="vq-tj" style="--tc:'+g.c+';--ta:'+g.a+'"><div class="vq-tj-cab"><i>'+(g.e||'⭐')+'</i>'+esc(d.n||'Tu negocio')+'<span>'+(pts()?'Puntos':lleva+' de '+m)+'</span></div>'+cuerpo+'<p class="vq-tj-pie">Premio: <b>'+esc(d.p||g.p||'')+'</b></p></div>';
  }
  function pinta(){ $$('.vq-prev').forEach(function(x){ x.innerHTML=tarjeta(); }); }
  function ir(p){
    paso=p; $$('.vq-paso').forEach(function(s){ s.hidden=Number(s.dataset.p)!==p; });
    var hasta=p<=2?1:p===3?2:3; $$('.vq-barra li').forEach(function(li,i){ li.className=i<hasta?'on':''; });
    $('.vq-atras').hidden=p===1;
    if(p===2){ $('#vq-nombre').value=d.n; pinta(); setTimeout(function(){ $('#vq-nombre').focus({preventScroll:true}); },50); }
    if(p===3) premio();
    if(p===4) avisos();
  }
  function premio(){
    var g=gi(); $('#vq-premio').value=d.p;
    $('.vq-ideas').innerHTML=(g.i||[]).map(function(x,k){ return '<button type="button" data-i="'+k+'" aria-pressed="'+(x[0]===d.p)+'">'+esc(x[0])+'</button>'; }).join('');
    $$('.vq-ideas button').forEach(function(b){ b.onclick=function(){ var x=g.i[b.dataset.i]; d.p=x[0]; d.m=x[1]; premio(); }; });
    $('#vq-meta').textContent=Number(d.m).toLocaleString('es-MX'); $('#vq-meta-u').textContent=pts()?'puntos (1 por cada peso)':'visitas';
  }
  function avisos(){
    var g=gi(), n=d.n||'Tu negocio', falta=pts()?'Te faltan 50 puntos para tu premio: '+d.p+'.':'Te falta 1 sello para tu premio: '+d.p+'.';
    var L=[['ahora','¡Ya casi! '+falta],['ayer','¡Feliz cumpleaños! Te espera un regalo en '+n+'.']];
    $('.vq-notis').innerHTML=L.map(function(x){ return '<div class="vq-noti"><i style="background:'+g.c+'">'+(g.e||'⭐')+'</i><span><b>'+esc(n)+' <small>'+x[0]+'</small></b>'+esc(x[1])+'</span></div>'; }).join('');
    $$('.vq-noti').forEach(function(el,k){ setTimeout(function(){ el.classList.add('ver'); },250+k*700); });
    var u=new URL(Q.dataset.app, location.href); u.searchParams.set('g',d.g); u.searchParams.set('n',d.n); u.searchParams.set('p',d.p); u.searchParams.set('m',String(d.m)); u.searchParams.set('t',d.t);
    if(!u.searchParams.get('o')) u.searchParams.set('o','quiz'); u.hash='#/nuevo'; $('.vq-crear').href=u.toString();
  }
  $$('.vq-giro').forEach(function(b){ b.onclick=function(){
    var g=G[b.dataset.g]; if(!g) return; d.g=b.dataset.g; d.t=g.t; d.m=g.m; d.p=g.p;
    $$('.vq-giro').forEach(function(x){ x.setAttribute('aria-pressed', x===b); });
    var eco=$('.vq-eco'); eco.hidden=false; eco.textContent=g.e+' Listo. Si un cliente lleva '+g.d+' días sin venir, Vuelve le manda un «te extrañamos» solo.';
    if(!visto){ visto=true; if(window.vorkaEvento) window.vorkaEvento('ViewContent',{content_name:'Quiz Vuelve',content_category:d.g}); }
    clearTimeout(timer); timer=setTimeout(function(){ ir(2); },1300);
  }; });
  $('.vq-mas').onclick=function(){ $$('[data-extra]').forEach(function(x){ x.hidden=false; }); this.hidden=true; };
  $('#vq-nombre').oninput=function(e){ d.n=e.target.value; pinta(); };
  $('#vq-nombre').onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); $('[data-ir="3"]').click(); } };
  $('#vq-premio').oninput=function(e){ d.p=e.target.value; $$('.vq-ideas button').forEach(function(b){ b.setAttribute('aria-pressed','false'); }); };
  $$('[data-m]').forEach(function(b){ b.onclick=function(){ var s=pts()?50:1, max=pts()?100000:30; d.m=Math.min(max,Math.max(s,(Number(d.m)||0)+Number(b.dataset.m)*s)); premio(); }; });
  $$('[data-ir]').forEach(function(b){ b.onclick=function(){
    if(b.dataset.ir==='3'&&d.n.trim().length<2){ var i=$('#vq-nombre'); i.focus(); i.setAttribute('aria-invalid','true'); i.placeholder='Escribe el nombre de tu negocio'; return; }
    if(b.dataset.ir==='4'&&!d.p.trim()){ $('#vq-premio').focus(); return; }
    ir(Number(b.dataset.ir)); if(Q.getBoundingClientRect().top<0) Q.scrollIntoView({behavior:'smooth',block:'start'});
  }; });
  $('.vq-atras').onclick=function(){ clearTimeout(timer); ir(Math.max(1,paso-1)); };
  $('.vq-crear').addEventListener('click',function(){ if(window.vorkaEvento) window.vorkaEvento('Lead',{content_name:'Quiz Vuelve',content_category:d.g}); });
})();
(function(){
  var f=document.getElementById('form-vuelve'); if(!f||!window.fetch) return;
  var P={}; try{ P=JSON.parse(document.getElementById('vu-precios').textContent); }catch(e){}
  var tot=document.getElementById('vu-total'), cada=document.getElementById('vu-cada');
  function pinta(){ var x=P[f.slug.value]; if(!x) return; var n=Math.min(20,Math.max(0,parseInt(f.sucursales.value,10)||0)); var t=x.p+(x.s||0)*n; var fr=VD.frase(t,x.cada); tot.textContent=fr.hoy; cada.textContent=fr.luego; }
  f.slug.addEventListener('change',pinta); f.sucursales.addEventListener('input',pinta); document.addEventListener('vorka:descuento',pinta); pinta();
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); f.slug.value=a.dataset.plan; pinta(); document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:f.slug.value, sucursales:Math.max(0,parseInt(f.sucursales.value,10)||0), nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value) d.codigo=f.codigo.value.trim();
    if(!d.nombre||d.nombre.trim().length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido.'); }
    if(!d.terminos) return mostrar('Debes aceptar los términos, las condiciones y el aviso de privacidad.');
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo el pago…';
    fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok&&x.j.url) location.href=x.j.url; else mostrar(x.j.error||'No pudimos abrir el pago. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
})();`;
