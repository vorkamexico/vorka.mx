// Vuelve (tarjetas de lealtad digitales; tercera app de Diversificación de Vorka México).
// /tienda/vuelve/ → ficha comercial única: prueba de 7 días, plan mensual o anual, sucursales adicionales, preguntas y compra.
// Se cobra por suscripción (ver suscripciones.js). La app vive en os.vorka.mx/vuelve/ y el registro de clientes de cada
// negocio en vorka.mx/vuelve/<negocio> (→ os.vorka.mx/v/<negocio>). Aquí solo se vende.
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, navTienda, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';
import qrcode from './vendor/qrcode.js';

const OS = 'https://os.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_VUELVE = '/tienda/vuelve/';
// El negocio de ejemplo: el dueño saca una tarjeta en su celular y simula visitas (lo arma Vorka OS, se borra solo al día)
const DEMO = 'https://vorka.mx/vuelve/demo';
// "Te lo dejamos listo": videollamada de 15 minutos con el equipo, gratis para los primeros negocios
const WA_LISTO = `https://wa.me/528117804869?text=${encodeURIComponent('Hola, quiero que me ayuden a dejar listo Vuelve en una videollamada de 15 minutos.')}`;
const PLANES = [{ slug: 'vuelve-mensual', extra: 'vuelve-sucursal-mensual', nombre: 'Mensual', cada: 'al mes' }, { slug: 'vuelve-anual', extra: 'vuelve-sucursal-anual', nombre: 'Anual', cada: 'al año', nota: '2 meses gratis' }];

const INCLUYE = ['Clientes ilimitados y tu propia página de registro con QR', 'Sellos o puntos, recompensas y niveles (Bronce, Plata, Oro)', 'Tarjeta en Apple Wallet, Google Wallet o en el navegador, con tu logo y una foto de tu negocio detrás de los sellos',
  'Avisos de cumpleaños, de "te extrañamos" y por cercanía, automáticos', 'Programa de referidos: "trae a un amigo" (ves quién invitó a quién)', 'Tu liga propia (vorka.mx/vuelve/tu-negocio) y lugar en el directorio de negocios Vuelve', 'Reporte de dinero recuperado y retorno de clientes', 'Escáner para tu equipo con PIN y bitácora antifraude', 'Cartel con QR listo para imprimir'];
const faq = ({ dias = 7, directorio = false } = {}) => [
  ['¿Puedo probar antes de pagar?', `Sí. Creas tu programa en <a href="${OS}/vuelve/">os.vorka.mx/vuelve</a> y lo usas completo ${dias} días, sin tarjeta. Si te sirve, te suscribes; si no, no pasa nada. Y si quieres verlo antes como lo verán tus clientes, <a href="${DEMO}">saca una tarjeta de ejemplo</a>.`],
  ['¿Mis clientes tienen que descargar una app?', 'No. Escanean tu QR, escriben su nombre y teléfono, y su tarjeta queda en Apple Wallet, Google Wallet o como tarjeta en su navegador. Tarda menos de 30 segundos.'],
  ['¿Cómo funcionan los avisos?', 'Vuelve manda solo: felicitación de cumpleaños con un regalo, un "te extrañamos" a quien lleva tiempo sin venir y los avisos que tú escribas para todos o para un grupo (por nivel o por visitas). Llegan a la tarjeta de su celular y, si nos dio su correo, también por correo. Sin costo por mensaje.'],
  ['¿Y lo de "cuando pasan cerca"?', 'En iPhone, cuando tu cliente pasa cerca de tu sucursal, su tarjeta aparece en la pantalla de bloqueo con tu mensaje (por ejemplo, "¡Estás cerca! Pasa por tu sello"). Es una sugerencia del teléfono, no una notificación con sonido, y depende de los permisos de ubicación de cada persona. Te lo decimos claro para que no te vendan humo.'],
  ['¿Cómo sé si de verdad funciona?', 'En tu panel ves cuántos clientes regresaron, cada cuánto vienen y cuánto dinero te trajeron de vuelta (con el ticket que registras al sellar o con tu ticket promedio). También ves cuántos regresaron después de cada aviso.'],
  ['¿Y si mi equipo regala sellos?', 'Cada persona de tu equipo sella con su PIN, hay un tope de sellos por cliente al día y todo queda en una bitácora. Si alguien sella de más, te avisamos.'],
  ['¿Qué pasa con los datos de mis clientes?', 'Son tuyos. Los descargas en Excel cuando quieras, también si cancelas. Vorka solo los guarda por tu cuenta para darte el servicio: no los vende ni los usa para publicidad. Cada cliente puede pedir su baja desde su tarjeta.'],
  ['¿Cuánto cuesta y cómo pago?', 'Mensual o anual (con 2 meses gratis), con tarjeta, procesado por Stripe. La suscripción incluye una sucursal; cada sucursal adicional, o cada negocio distinto que manejes con el mismo correo (por ejemplo, tu cafetería y tu panadería), se suma a tu plan al mismo precio de sucursal. Tu comprobante de pago de cada cobro lo descargas en Vuelve › Cuenta › Administrar suscripción. Si necesitas factura (CFDI), pídela a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tus datos fiscales dentro del mismo mes del cobro.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Vuelve › Cuenta, sin llamadas. Tu programa sigue activo hasta el final del periodo que pagaste y tus clientes conservan su tarjeta.'],
  ['¿Mi negocio puede aparecer en un directorio?', `Sí, si tú quieres. Con tu suscripción activa, tu negocio puede aparecer en el directorio de negocios Vuelve${directorio ? ' (<a href="/vuelve/negocios">vorka.mx/vuelve/negocios</a>)' : ''} con tu logo, tu ciudad y tu premio, para que te encuentren clientes nuevos. Lo prendes o apagas en Vuelve › Mi liga.`],
  ['¿Es difícil de usar?', 'No. Está pensado para dueños que no son de computadora: todo desde el celular, con botones grandes, una pregunta a la vez y preguntas frecuentes dentro de la app. Y si te atoras, te ayuda una persona.'],
  ['¿Me ayudan a dejarlo listo?', `Sí. En una videollamada de 15 minutos lo dejamos funcionando contigo: tu tarjeta con tu logo, tu premio, tu cartel con QR y tu primer cliente registrado. Es gratis para los primeros 10 negocios: <a href="${WA_LISTO}" target="_blank" rel="noopener">escríbenos por WhatsApp</a>.`],
  ['¿Para qué negocios sirve?', 'Cafeterías, restaurantes, barberías, salones, estéticas, gimnasios, autolavados, tintorerías, panaderías: cualquier negocio con clientes que pueden regresar. Al empezar eliges tu giro y Vuelve te sugiere sellos, premios y mensajes.'],
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
function qrSvg(texto) {
  const q = qrcode(0, 'M'); q.addData(texto, 'Byte'); q.make();
  const n = q.getModuleCount(), m = 2, t = n + m * 2;
  let d = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + m} ${y + m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges" role="img" aria-label="Código QR de la tarjeta de ejemplo"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#141114"/></svg>`;
}

// Tarjetas de muestra: las tiras son las reales que pinta Vuelve para el Wallet (assets/tienda/vuelve/tira-*.png)
const MUESTRAS = [
  { nombre: 'Café La Paloma', fondo: '#121212', tinta: '#f4f1ea', tinta2: '#8a8781', etiqueta: 'SELLOS', valor: '7 de 10', tira: 'tira-logo', cliente: 'María González', nivel: 'Oro', premioEt: 'PREMIO', premio: 'Bebida gratis', logo: true, pie: 'Tu logo como sello' },
  { nombre: 'Bodega Santa Rita', fondo: '#3b111a', tinta: '#f4f1ea', tinta2: '#a98c90', etiqueta: 'SELLOS', valor: '5 de 8', tira: 'tira-bodega', cliente: 'Jorge Ramírez', nivel: 'Plata', premioEt: 'PREMIO', premio: 'Botella de la casa', inicial: 'B', pie: 'Monedas de oro' },
  { nombre: 'Verde Bistró', fondo: '#12291f', tinta: '#f4f1ea', tinta2: '#93a098', etiqueta: 'PUNTOS', valor: '2,160', tira: 'tira-puntos', cliente: 'Ana Torres', nivel: 'Bronce', premioEt: 'TU META', premio: 'Postre gratis', inicial: 'V', pie: 'Puntos por cada peso' },
  { nombre: 'Café La Paloma', fondo: '#0e1a33', tinta: '#f4f1ea', tinta2: '#8d95a6', etiqueta: 'SELLOS', valor: '4 de 6', tira: 'tira-circulo', cliente: 'Luis Herrera', nivel: 'Plata', premioEt: 'YA CASI', premio: 'Pan dulce gratis', logo: true, pie: 'Tu logo en círculo' },
];
// Réplica fiel de una storeCard de Apple Wallet: logo y nombre, saldo arriba, la tira, cliente · nivel, premio y QR
const pase = d => `<div class="vu-pase${d.cls ? ` ${d.cls}` : ''}" style="--pf:${d.fondo};--pt:${d.tinta};--pt2:${d.tinta2}">
  <div class="vu-pase-cab">${d.logo ? '<span class="vu-pase-logo con"><img src="/assets/tienda/vuelve/logo-paloma-pase.png" alt="" height="30"></span>' : ''}<b>${esc(d.nombre)}</b><span class="vu-pase-h"><small>${d.etiqueta}</small>${d.valor}</span></div>
  <img class="vu-pase-tira" src="/assets/tienda/vuelve/${d.tira}.png" alt="" width="375" height="123" loading="lazy" decoding="async">
  <div class="vu-pase-campos"><span><small>CLIENTE</small>${esc(d.cliente)}</span><span class="der"><small>NIVEL</small>${d.nivel}</span></div>
  <div class="vu-pase-campos aux"><span><small>${d.premioEt}</small>${esc(d.premio)}</span></div>
  <div class="vu-pase-qr"><img src="/assets/tienda/vuelve/qr-demo.svg" alt="" width="84" height="84" loading="lazy"><small>LP7Q2K</small></div>
</div>`;

export async function paginaVuelve(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug), sucursal: await productoPorSlug(env, x.extra) })))).filter(x => x.prod);
  if (planes[0] && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: planes[0].prod.id, ref_code: code });
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : planes[0]?.slug;
  const error = url.searchParams.get('error') || '';
  // Desde la app (Suscribirme) llega el correo de la cuenta para que la suscripción quede ligada a ella
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  // y cuántos lugares adicionales ya usa (sucursales o negocios de más con el mismo correo)
  const lugares = Math.min(20, Math.max(0, parseInt(url.searchParams.get('sucursales') || '0', 10) || 0));
  const mensual = planes.find(x => x.slug === 'vuelve-mensual');
  // Quién lo recomendó (prueba de 30 días) y si el directorio ya tiene suficientes negocios para presumirlo
  const fuente = fuenteVisita(req, url);
  const [dir, reco] = await Promise.all([deOS(env, '/api/vuelve/publico/directorio'), fuente.invita ? deOS(env, `/api/vuelve/publico/recomienda/${fuente.invita}`) : null]);
  const dias = reco?.dias || 7, FAQ = faq({ dias, directorio: !!dir?.visible });
  const q = new URLSearchParams(Object.entries({ invita: reco ? fuente.invita : null, o: fuente.o }).filter(([, v]) => v)).toString();
  const nuevo = `${OS}/vuelve/${q ? `?${q}` : ''}#/nuevo`;
  const precioMes = mensual ? mensual.prod.precio_centavos / 100 : 399;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Vuelve · Tarjeta de lealtad digital para tu negocio', brand: { '@type': 'Brand', name: 'Vuelve' },
    description: 'Sellos o puntos en el celular de tus clientes, avisos automáticos de cumpleaños y de regreso, referidos y el dinero que te traen de vuelta, medido. Prueba 7 días gratis.',
    image: [`${OS}/vuelve/og.png`],
    ...(planes.length ? { offers: planes.map(x => ({ '@type': 'Offer', priceCurrency: 'MXN', price: (x.prod.precio_centavos / 100).toFixed(2), name: `Plan ${x.nombre.toLowerCase()}` })) } : {}) },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const datos = Object.fromEntries(planes.map(x => [x.slug, { p: x.prod.precio_centavos, s: x.sucursal?.precio_centavos ?? null, cada: x.cada }]));
  const res = pagina({ navActual: 'catalogo', navOscuro: true, entrar: { url: `${OS}/vuelve/#entrar`, app: 'Vuelve' },
    titulo: 'Vuelve: tarjeta de lealtad digital para tu negocio | Prueba 7 días gratis', ruta: RUTA_VUELVE, imagen: `${OS}/vuelve/og.png`,
    descripcion: 'Que tus clientes vuelvan solos: sellos o puntos en su celular, sin app ni cartón. Avisos automáticos, referidos y el dinero que te traen de vuelta, medido. Prueba 7 días gratis, sin tarjeta.',
    head: `<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="vu">
<section class="vu-hero"><div class="marco vu-hero-g">
  <div class="vu-hero-txt">
    <span class="vu-marca"><span>vuelve</span></span>
    ${reco ? `<p class="vu-reco">🎁 Te recomendó <b>${esc(reco.nombre)}</b>: pruébalo ${dias} días gratis</p>` : ''}
    <h1 class="vu-h1">Que tus clientes <em>vuelvan solos.</em></h1>
    <p class="vu-lead">La tarjeta de lealtad de tu negocio en Apple Wallet y Google Wallet de tus clientes. Sin app, sin cartón. Vuelve les avisa en su cumpleaños y cuando llevan tiempo sin venir, y te dice cuánto dinero regresó.</p>
    <div class="vu-ctas"><a class="vu-btn" href="${esc(nuevo)}">Pruébalo ${dias} días gratis ${FLECHA}</a><a class="vu-btn ghost" href="#ejemplo">Vívelo como tu cliente</a></div>
    <p class="t-ya">¿Ya tienes cuenta? <a href="${OS}/vuelve/#entrar">Entra aquí</a> · <a href="#planes">Ver precios</a></p>
    <ul class="vu-chips"><li>${ICONO.check}Sin tarjeta para probar</li><li>${ICONO.wallet}Apple y Google Wallet</li><li>${ICONO.reloj}Lista en 5 minutos</li></ul>
  </div>
  <div class="vu-escena" aria-hidden="true">
    <div class="vu-cel"><i class="vu-isla"></i><div class="vu-pantalla"><p class="vu-wallet-t">Wallet</p>${pase(MUESTRAS[0])}${pase({ ...MUESTRAS[1], cls: 'abajo' })}</div></div>
    <div class="vu-noti"><span class="vu-noti-ic"><img src="/assets/tienda/vuelve/logo-paloma.png" alt="" width="38" height="38"></span><span><b>Café La Paloma <small>ahora</small></b>¡Ya tienes tu bebida gratis! Pídela al pagar ☕</span></div>
  </div>
</div>
${navTienda('lealtad')}
</section>

<section class="vu-sec"><div class="marco">
  <div class="vu-cab"><span class="vu-et">Así se ve en sus celulares</span><h2>Tu marca, en su Wallet.</h2><p>Estos son ejemplos de lo que puedes armar. Eliges colores, metal y sellos, o usas tu logo como sello. También puedes poner una foto de tu negocio detrás.</p></div>
  <div class="vu-galeria">${MUESTRAS.map(d => `<figure>${pase(d)}<figcaption>${d.pie}</figcaption></figure>`).join('')}</div>
</div></section>

<section class="vu-sec vu-osc" id="ejemplo"><div class="marco vu-demo">
  <div class="vu-cab izq"><span class="vu-et">Pruébalo como tu cliente</span><h2>Vive en 20 segundos lo que vivirán tus clientes.</h2>
    <p>Saca una tarjeta de ejemplo en tu celular, guárdala en tu Wallet y simula visitas: verás cómo se suman los sellos y cómo llega el aviso del premio. Solo te pedimos tu nombre y se borra sola mañana.</p>
    <div class="vu-ctas"><a class="vu-btn" href="${DEMO}">Sacar mi tarjeta de ejemplo ${FLECHA}</a></div></div>
  <figure class="vu-demo-qr"><div>${qrSvg(DEMO)}</div><figcaption>¿Estás en la computadora? Escanéalo con la cámara de tu celular.</figcaption></figure>
</div></section>

<section class="vu-sec vu-osc"><div class="marco">
  <div class="vu-cab"><span class="vu-et">Cómo funciona</span><h2>Listo hoy. Desde tu celular.</h2></div>
  <ol class="vu-pasos">${[['Arma tu tarjeta', 'Tu logo, tus colores, una foto de tu negocio y tus premios. Vuelve te sugiere todo según tu giro.'], ['Pon tu QR en caja', 'Te damos el cartel listo para imprimir. Tus clientes sacan su tarjeta en 30 segundos, sin descargar nada.'],
    ['Sella con un toque', 'Tú o tu equipo escanean su tarjeta. Cada quien con su PIN y todo queda en la bitácora.'], ['Vuelve hace el resto', 'Avisos de cumpleaños y de "te extrañamos", su tarjeta al día en el Wallet y tus números cada mes.']].map(([t, d], k) => `<li><span class="vu-num">0${k + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
</div></section>

<section class="vu-sec"><div class="marco vu-dos">
  <div class="vu-cab izq"><span class="vu-et">Lo que te hace ganar</span><h2>Clientes que regresan, medidos en pesos.</h2><p>No es solo una tarjeta de sellos: es saber quién volvió, cuándo y cuánto dejó. Y que se lo recuerden solos.</p>
    <div class="vu-panel" role="img" aria-label="Ejemplo del panel de Vuelve"><small>Ejemplo · panel de este mes</small><div class="vu-kpis"><span><b>148</b>visitas de regreso</span><span><b>$41,300</b>dinero que regresó</span><span><b>23</b>volvieron tras un aviso</span></div><div class="vu-barras">${[38, 52, 47, 61, 58, 73, 80].map(v => `<i style="height:${v}%"></i>`).join('')}</div></div></div>
  <ul class="vu-ben">${[[ICONO.pesos, 'Dinero recuperado, medido', 'Cuántos regresaron, cada cuánto y cuánto dejaron. Y cuántos volvieron después de cada aviso.'],
    [ICONO.campana, 'Avisos que trabajan solos', 'Cumpleaños con regalo, "te extrañamos" y tus promociones. Llegan a su Wallet, sin costo por mensaje.'],
    [ICONO.amigos, 'Trae a un amigo', 'Cada tarjeta trae su invitación. Cuando el amigo viene por primera vez, los dos ganan.'],
    [ICONO.escudo, 'Sin sellos regalados', 'PIN por persona, tope de sellos al día y bitácora. Te avisamos si algo se ve raro.'],
    [ICONO.pin, 'Por sucursal', 'Cada sucursal con su ubicación, su equipo y su aviso cuando pasan cerca.'],
    [ICONO.datos, 'Tus datos son tuyos', 'Descargas a tus clientes en Excel. Aviso de privacidad listo y comprobante de pago de tu suscripción.']].map(([ic, t, d]) => `<li>${ic}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="vu-sec" id="calcula"><div class="marco vu-calc">
  <div class="vu-cab izq"><span class="vu-et">¿Cuánto te deja?</span><h2>Haz la cuenta con tus números.</h2><p>Cámbialos y mira cuánto representa que algunos de tus clientes regresen una vez más al mes.</p></div>
  <div class="vu-calc-c">
    <form class="vu-calc-f" id="vu-calc" novalidate>
      <label>Clientes distintos que atiendes al mes<input id="c-cli" type="number" inputmode="numeric" min="1" max="100000" value="300"></label>
      <label>Lo que gasta un cliente por visita (pesos)<input id="c-tic" type="number" inputmode="numeric" min="1" max="100000" value="80"></label>
      <label>De cada 10, ¿cuántos regresarían una vez más al mes con su tarjeta? <output id="c-reg-o">1 de cada 10</output><input id="c-reg" type="range" min="0" max="5" step="1" value="1"></label>
    </form>
    <div class="vu-calc-r" aria-live="polite" data-precio="${precioMes}"><small>Ventas extra al mes</small><b id="c-extra">$2,400</b><p id="c-paga">Vuelve cuesta $${precioMes.toLocaleString('es-MX')} al mes: se paga con ${Math.ceil(precioMes / 80)} visitas extra.</p>
      <p class="vu-nota">Es un cálculo con tus números, no una promesa. En tu panel de Vuelve ves el dinero que de verdad regresó.</p></div>
  </div>
</div></section>

<section class="vu-sec suave" id="planes"><div class="marco">
  <div class="vu-cab"><span class="vu-et">Precios</span><h2>Pruébalo ${dias} días. Después, un solo plan con todo.</h2><p>En pesos mexicanos con IVA incluido. Clientes y avisos ilimitados. Cancela cuando quieras.</p></div>
  <div class="vu-planes">
    <article class="vu-plan"><h3>Prueba</h3><p class="vu-para">Todo Vuelve, ${dias} días</p><p class="vu-precio"><b>$0</b></p>
      <ul>${['Sin tarjeta', 'Todas las funciones', 'Tus clientes conservan su tarjeta si decides seguir'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
      <a class="vu-btn ghost oscuro" href="${esc(nuevo)}">Empezar gratis</a></article>
    ${planes.map(x => `<article class="vu-plan${x.slug === 'vuelve-mensual' ? ' rec' : ''}">${x.nota ? `<span class="vu-sello">${x.nota}</span>` : ''}<h3>${x.nombre}</h3><p class="vu-para">Una sucursal incluida</p>
      <p class="vu-precio"><b>${precio(x.prod)}</b> <small>${x.cada}</small></p>
      <ul>${INCLUYE.slice(0, 5).map(i => `<li>${CHECK}<span>${i}</span></li>`).join('')}${x.sucursal ? `<li>${CHECK}<span>Sucursal o negocio adicional: ${precio(x.sucursal)} ${x.cada}</span></li>` : ''}</ul>
      <a class="vu-btn${x.slug === 'vuelve-mensual' ? '' : ' ghost oscuro'}" href="?plan=${x.slug}#comprar" data-plan="${x.slug}">Suscribirme</a></article>`).join('')}
  </div>
  ${planes.length ? '' : `<p class="vu-nota" style="text-align:center">La suscripción abre muy pronto. Mientras, <a href="${esc(nuevo)}">empieza tu prueba gratis</a>.</p>`}
  <div class="vu-listo"><div><b>¿Sin tiempo? Te lo dejamos listo, gratis.</b><p>Una videollamada de 15 minutos: tu tarjeta con tu logo, tu premio, tu cartel con QR y tu primer cliente registrado. Gratis para los primeros 10 negocios.</p></div>
    <a class="vu-btn ghost oscuro" href="${WA_LISTO}" target="_blank" rel="noopener">Pedirlo por WhatsApp</a></div>
</div></section>

${planes.length ? seccionCompra({ titulo: 'Suscríbete a Vuelve', intro: `¿Aún no lo pruebas? <a href="${esc(nuevo)}">Empieza gratis ${dias} días</a>, sin tarjeta. Si ya lo estás probando, suscríbete con el mismo correo y tu programa sigue tal cual.`,
  pasos: [['Eliges mensual o anual', 'Y cuántas sucursales o negocios adicionales necesitas.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Te llega tu acceso por correo', 'Con el mismo correo de tu prueba, todo sigue igual.']],
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

${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/vuelve/">Condiciones de Vuelve</a> · <a href="/legal/vuelve/privacidad/">Aviso de privacidad</a> · <a href="/legal/vuelve/privacidad-clientes/">Privacidad para clientes de cada negocio</a> · Vuelve · Powered by vorka.mx</p>' })}
${await masTienda(env, 'lealtad')}
</div>`,
  });
  if (fuente.cookie) res.headers.append('set-cookie', fuente.cookie);
  return res;
}

const CSS = `
.vu{--vu-tinta:#0f0d10;--vu-tinta2:#171519;--vu-morado:#6b2a85;--vu-morado-c:#c59bd9;--vu-oro:#c8a45c;--vu-crema:#f4f2f5;font-family:'Inter Tight','Inter',system-ui,-apple-system,sans-serif}
[data-tema="oscuro"] .vu{--vu-morado:#c59bd9}
.vu-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--fg);color:var(--bg);font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 10px 26px -12px rgba(20,17,20,.5);transition:transform .2s var(--ease),background .2s}
.vu-btn:hover{transform:translateY(-1px)}.vu-hero .vu-btn:not(.ghost),.vu-osc .vu-btn:not(.ghost){background:var(--vu-crema);color:var(--vu-tinta);box-shadow:0 10px 26px -12px rgba(0,0,0,.6)}.vu-hero .vu-btn:not(.ghost):hover,.vu-osc .vu-btn:not(.ghost):hover{background:#fff}.vu-btn svg{width:17px;height:17px}
.vu-btn.ghost{background:rgba(255,255,255,.06);color:var(--vu-crema);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}.vu-btn.ghost:hover{background:rgba(255,255,255,.12)}
.vu-btn.ghost.oscuro{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--line-2)}.vu-btn.ghost.oscuro:hover{box-shadow:inset 0 0 0 1.5px var(--fg)}
/* portada */
.vu-hero{position:relative;isolation:isolate;overflow:hidden;margin-top:-104px;padding:140px 0 26px;background:var(--vu-tinta);color:var(--vu-crema)}
.vu-hero::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(55% 70% at 80% 30%,rgba(107,42,133,.38),transparent 70%),radial-gradient(40% 50% at 0% 100%,rgba(200,164,92,.1),transparent 70%)}
.vu-hero-g{display:grid;gap:40px;align-items:center;padding-bottom:30px}.vu-hero-g>*{min-width:0}
@media(min-width:960px){.vu-hero-g{grid-template-columns:1.05fr .95fr}}
.vu-marca{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:30px;letter-spacing:-.05em;color:var(--vu-crema)}.vu-marca span{margin-top:-3px}
.vu-h1{font-weight:800;font-size:clamp(42px,6.6vw,80px);line-height:.98;letter-spacing:-.05em;margin:26px 0 0;max-width:11ch;text-wrap:balance}.vu-h1 em{font-style:normal;color:var(--vu-morado-c)}
.vu-lead{margin-top:20px;font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:rgba(244,242,245,.76);max-width:33em}
.vu-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.vu-chips{list-style:none;padding:0;margin:26px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14.5px;color:rgba(244,242,245,.7)}
.vu-chips li{display:inline-flex;align-items:center;gap:7px}.vu-chips svg{width:18px;height:18px;color:var(--vu-morado-c)}
.vu-hero .t-nav-tienda{margin-top:8px}.vu-hero .t-nav-tienda a{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:rgba(244,242,245,.8)}.vu-hero .t-nav-tienda a[aria-current]{background:var(--vu-crema);border-color:var(--vu-crema);color:var(--vu-tinta)}
.vu-hero>.t-nav-tienda{width:min(100% - 32px,1180px);margin:0 auto}
/* el celular con el Wallet abierto */
.vu-escena{position:relative;justify-self:center;width:min(100%,360px);padding:10px 0 40px}
.vu-cel{position:relative;border-radius:54px;padding:12px;background:#0a0a0a;box-shadow:0 0 0 2px #2a2a2a,0 50px 90px -40px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.06)}
.vu-isla{position:absolute;top:22px;left:50%;width:96px;height:28px;border-radius:20px;background:#000;transform:translateX(-50%);z-index:2}
.vu-pantalla{border-radius:43px;overflow:hidden;background:#000;padding:62px 10px 0;height:600px;position:relative}
.vu-wallet-t{margin:0 8px 12px;font:700 30px/1 -apple-system,'SF Pro Display','Inter Tight',sans-serif;letter-spacing:-.02em;color:#fff}
.vu-pantalla .vu-pase.abajo{position:absolute;left:10px;right:10px;top:540px}
.vu-noti{position:absolute;left:-36px;right:24px;bottom:22px;display:flex;gap:11px;align-items:flex-start;padding:12px 14px;border-radius:22px;background:rgba(244,242,245,.88);color:#111;font:14px/1.35 -apple-system,'Inter Tight',sans-serif;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:0 24px 50px -20px rgba(0,0,0,.7)}
.vu-noti b{display:flex;justify-content:space-between;gap:8px;font-weight:650}.vu-noti b small{font-weight:400;color:#6b6b6b}.vu-noti-ic img{display:block;width:38px;height:38px;border-radius:9px}
@media(max-width:600px){.vu-noti{left:-6px;right:-6px}.vu-pantalla{height:540px}}
/* tarjeta de Apple Wallet (storeCard) */
.vu-pase{background:var(--pf);color:var(--pt);border-radius:14px;overflow:hidden;font-family:-apple-system,'SF Pro Text','Inter Tight',sans-serif;box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 20px 40px -24px rgba(0,0,0,.7)}
.vu-pase-cab{display:flex;align-items:center;gap:9px;padding:11px 12px}
.vu-pase-logo img,.vu-pase-logo i{display:grid;place-items:center;width:30px;height:30px;border-radius:7px;background:#fff;color:#111;font:700 15px/1 Georgia,serif;font-style:normal}.vu-pase-logo.con img{width:auto;height:30px;border-radius:0;background:none}
.vu-pase-cab b{font-size:15px;font-weight:600;letter-spacing:-.01em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vu-pase-h{margin-left:auto;text-align:right;font-size:17px;font-weight:500;line-height:1.1;white-space:nowrap}.vu-pase small{display:block;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:var(--pt2);margin-bottom:2px}
.vu-pase-tira{display:block;width:100%;height:auto}
.vu-pase-campos{display:flex;justify-content:space-between;gap:12px;padding:10px 12px 0;font-size:15px}.vu-pase-campos .der{text-align:right}.vu-pase-campos.aux{font-size:13px;padding-top:8px}
.vu-pase-qr{display:grid;justify-items:center;gap:2px;width:max-content;margin:14px auto 14px;padding:8px 8px 4px;border-radius:9px;background:#fff}.vu-pase-qr img{display:block;width:84px;height:84px}.vu-pase-qr small{color:#333;font-size:10px;letter-spacing:.04em;margin:0}
/* secciones */
.vu-sec{padding:clamp(56px,8vw,104px) 0}.vu-sec.suave{background:var(--bg-2)}
.vu-osc{background:var(--vu-tinta);color:var(--vu-crema)}
.vu-cab{max-width:680px;margin:0 auto 38px;text-align:center}.vu-cab.izq{text-align:left;margin:0}
.vu-et{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--vu-morado)}.vu-osc .vu-et{color:var(--vu-morado-c)}
.vu-cab h2{font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.02;letter-spacing:-.045em;margin:10px 0 0;text-wrap:balance}
.vu-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}.vu-osc .vu-cab p{color:rgba(244,242,245,.72)}
.vu-galeria{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))}
.vu-galeria figure{margin:0}.vu-galeria figcaption{margin-top:12px;text-align:center;font-weight:650;color:var(--fg-2);font-size:15px}
.vu-pasos{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.vu-pasos li{padding:24px;border-radius:24px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
.vu-num{display:block;font-weight:800;font-size:15px;color:var(--vu-morado-c);letter-spacing:.04em}.vu-pasos b{display:block;font-size:20px;letter-spacing:-.02em;margin-top:18px}.vu-pasos p{margin:6px 0 0;color:rgba(244,242,245,.7);line-height:1.5}
.vu-dos{display:grid;gap:40px;align-items:start}@media(min-width:980px){.vu-dos{grid-template-columns:.95fr 1.05fr}}
.vu-panel{margin-top:28px;padding:20px;border-radius:24px;background:var(--vu-tinta);color:var(--vu-crema);box-shadow:var(--sombra-2)}
.vu-panel small{color:rgba(244,242,245,.55);font-size:12.5px}
.vu-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.vu-kpis span{font-size:12.5px;color:rgba(244,242,245,.66);line-height:1.3}.vu-kpis b{display:block;font-size:clamp(20px,2.4vw,28px);letter-spacing:-.03em;color:#fff;margin-bottom:4px}
.vu-barras{display:flex;align-items:flex-end;gap:8px;height:90px;margin-top:18px}.vu-barras i{flex:1;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,var(--vu-morado-c),rgba(197,155,217,.3))}
.vu-ben{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.vu-ben li{padding:20px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.vu-ben svg{width:40px;height:40px;padding:9px;border-radius:12px;background:color-mix(in srgb,var(--vu-morado) 12%,transparent);color:var(--vu-morado)}
.vu-ben b{display:block;font-size:17.5px;letter-spacing:-.015em;margin-top:12px}.vu-ben p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
/* precios */
.vu-planes{display:grid;gap:18px;align-items:start;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))}
.vu-plan{position:relative;background:var(--card);border:1.5px solid var(--line);border-radius:26px;padding:26px;display:grid;gap:8px}
.vu-plan.rec{border-color:var(--vu-morado);box-shadow:0 30px 60px -36px rgba(107,42,133,.5)}
.vu-sello{position:absolute;top:-13px;left:24px;background:linear-gradient(100deg,#a8853f,#c8a45c 55%,#e6cf96);color:#1b1408;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px}
.vu-plan h3{font-weight:800;font-size:26px;letter-spacing:-.035em;margin:4px 0 0}.vu-para{color:var(--fg-2);margin:0}
.vu-precio{margin:6px 0 0}.vu-precio b{font-size:38px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.vu-precio small{color:var(--fg-2)}
.vu-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:8px}.vu-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.vu-plan li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--vu-morado)}
.vu-nota{color:var(--fg-2);font-size:15px;margin-top:14px}
.vu-total{margin:4px 0 12px;font-size:16px}.vu-total b{font-size:20px;font-variant-numeric:tabular-nums}
.vu-reco{display:inline-block;margin:22px 0 -6px;padding:8px 14px;border-radius:999px;background:rgba(200,164,92,.16);color:#f1dfb8;font-size:15px}.vu-reco b{color:#fff}
.vu-demo{display:grid;gap:34px;align-items:center}@media(min-width:900px){.vu-demo{grid-template-columns:1.2fr .8fr}}
.vu-demo-qr{margin:0;justify-self:center;text-align:center;max-width:280px}.vu-demo-qr div{background:#fff;border-radius:22px;padding:14px;box-shadow:0 30px 60px -30px rgba(0,0,0,.8)}.vu-demo-qr svg{display:block;width:100%;height:auto}
.vu-demo-qr figcaption{margin-top:12px;color:rgba(244,242,245,.7);font-size:14.5px}
.vu-calc-c{display:grid;gap:22px;margin-top:30px}@media(min-width:900px){.vu-calc-c{grid-template-columns:1.1fr .9fr;align-items:start}}
.vu-calc-f{display:grid;gap:18px;padding:24px;border-radius:24px;background:var(--card);border:1px solid var(--line)}.vu-calc-f label{display:grid;gap:8px;font-weight:650;font-size:15.5px}
.vu-calc-f input[type=number]{font:inherit;font-size:18px;min-height:50px;padding:10px 14px;border-radius:14px;border:1.5px solid var(--line-2);background:var(--bg);color:var(--fg)}.vu-calc-f input[type=range]{width:100%;accent-color:var(--vu-morado)}
.vu-calc-f output{font-weight:800;color:var(--vu-morado)}
.vu-calc-r{padding:26px;border-radius:24px;background:var(--vu-tinta);color:var(--vu-crema)}.vu-calc-r small{color:rgba(244,242,245,.6)}.vu-calc-r b{display:block;font-size:clamp(40px,6vw,58px);letter-spacing:-.04em;margin:4px 0 6px;font-variant-numeric:tabular-nums}
.vu-calc-r p{margin:0;color:rgba(244,242,245,.8);line-height:1.5}.vu-calc-r .vu-nota{color:rgba(244,242,245,.55);font-size:13.5px;margin-top:12px}
.vu-listo{display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center;justify-content:space-between;margin-top:22px;padding:22px 24px;border-radius:24px;border:1.5px dashed var(--line-2);background:var(--card)}.vu-listo b{font-size:18px;letter-spacing:-.02em}.vu-listo p{margin:4px 0 0;color:var(--fg-2);max-width:40em}
.vu #form-vuelve .btn.acento{background:var(--fg);color:var(--bg);box-shadow:0 10px 26px -12px rgba(20,17,20,.5)}`;

const SCRIPT = `(function(){
  // calculadora: clientes al mes × de cada 10 cuántos regresan una vez más × lo que gastan
  var cf=document.getElementById('vu-calc');
  if(cf){ var cr=document.querySelector('.vu-calc-r'), precio=Number(cr.dataset.precio)||399;
    var m=function(n){ return '$'+Math.round(n).toLocaleString('es-MX'); };
    var calc=function(){ var cli=Math.max(0,Number(cf.querySelector('#c-cli').value)||0), tic=Math.max(0,Number(cf.querySelector('#c-tic').value)||0), reg=Number(cf.querySelector('#c-reg').value)||0;
      var visitas=Math.round(cli*reg/10); document.getElementById('c-reg-o').textContent=reg+' de cada 10';
      document.getElementById('c-extra').textContent=m(visitas*tic);
      document.getElementById('c-paga').textContent=tic>0?'Vuelve cuesta '+m(precio)+' al mes: se paga con '+Math.ceil(precio/tic)+' visitas extra'+(visitas?' (de las '+visitas.toLocaleString('es-MX')+' de tu cálculo).':'.'):''; };
    cf.addEventListener('input',calc); cf.addEventListener('submit',function(e){e.preventDefault();}); calc(); }
  var f=document.getElementById('form-vuelve'); if(!f||!window.fetch) return;
  var P={}; try{ P=JSON.parse(document.getElementById('vu-precios').textContent); }catch(e){}
  var tot=document.getElementById('vu-total'), cada=document.getElementById('vu-cada');
  function pesos(c){ return '$'+(c/100).toLocaleString('es-MX',{maximumFractionDigits:2})+' MXN'; }
  function pinta(){ var x=P[f.slug.value]; if(!x) return; var n=Math.min(20,Math.max(0,parseInt(f.sucursales.value,10)||0)); var t=x.p+(x.s||0)*n; tot.textContent=pesos(t); cada.textContent='y luego '+pesos(t)+' '+x.cada; }
  f.slug.addEventListener('change',pinta); f.sucursales.addEventListener('input',pinta); pinta();
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
