// Brindi (invitaciones digitales, marca propia de Diversificación de Vorka México).
// - /tienda/brindi/ → ficha comercial: demostraciones, comparador de planes, complementos, preguntas y compra (usa /api/checkout de siempre)
// - RPC para Vorka OS (clase Admin): validarAcceso, comprasApp, resumenApp, productosApp
// La app vive en os.vorka.mx/brindi/ y las invitaciones en os.vorka.mx/i/<evento>. Aquí solo se vende.
import { one, all } from './util.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { hashToken } from './entrega.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, navTienda, masTienda, seccionFaq, seccionCompra } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { ELEGIR } from './elegir.js';

export const APP = 'brindi';
const OS = 'https://os.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
const accesoDe = c => { try { return JSON.parse(c || '{}').acceso || null; } catch { return null; } };

// ---------- RPC (solo Vorka OS por service binding) ----------
// Token del correo de compra (el mismo de /descargas/<token>): vigente, sin revocar, orden pagada y con un producto de la app
export async function validarAcceso(env, token, app) {
  if (!/^[a-f0-9]{64}$/.test(String(token || ''))) return null;
  const t = await one(env, `SELECT t.order_id, o.email, o.nombre FROM download_tokens t JOIN orders o ON o.id = t.order_id
    WHERE t.token_hash = ? AND t.revocado = 0 AND t.expires_at > ? AND o.estado = 'paid'`, await hashToken(env, token), new Date().toISOString());
  if (!t) return null;
  const items = await all(env, 'SELECT p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', t.order_id);
  if (!items.some(i => accesoDe(i.contenido)?.app === app)) return null;
  return { order_id: t.order_id, email: t.email, nombre: t.nombre };
}

// Compras de un correo con productos de la app (pagadas o reembolsadas: Vorka OS revoca lo reembolsado)
export async function comprasApp(env, email, app) {
  const filas = await all(env, `SELECT o.id order_id, o.estado, o.paid_at, i.product_id, i.nombre, i.cantidad, p.slug, p.contenido FROM orders o
    JOIN order_items i ON i.order_id = o.id JOIN products p ON p.id = i.product_id
    WHERE o.email = ? AND o.estado IN ('paid', 'refunded') AND o.regalo = 0 ORDER BY o.created_at`, String(email || '').trim().toLowerCase());
  const ordenes = new Map();
  for (const f of filas) {
    const acceso = accesoDe(f.contenido);
    if (acceso?.app !== app) continue;
    if (!ordenes.has(f.order_id)) ordenes.set(f.order_id, { order_id: f.order_id, estado: f.estado, paid_at: f.paid_at, items: [] });
    ordenes.get(f.order_id).items.push({ product_id: f.product_id, slug: f.slug, nombre: f.nombre, cantidad: f.cantidad, acceso });
  }
  return [...ordenes.values()];
}

export async function productosApp(env, app) {
  return (await all(env, 'SELECT id, slug, nombre, precio_centavos, activo, contenido FROM products ORDER BY orden'))
    .map(p => ({ ...p, activo: !!p.activo, acceso: accesoDe(p.contenido), contenido: undefined })).filter(p => p.acceso?.app === app);
}

// Embudo y ventas por producto desde una fecha (ISO). Las visitas de /tienda/brindi/ se registran en el plan Celebración.
export async function resumenApp(env, app, { desde } = {}) {
  desde = /^\d{4}-\d{2}-\d{2}T/.test(desde || '') ? desde : new Date(Date.now() - 30 * 864e5).toISOString();
  const productos = [];
  for (const p of await productosApp(env, app)) {
    const ev = Object.fromEntries((await all(env, 'SELECT tipo, COUNT(*) n FROM events WHERE product_id = ? AND created_at >= ? GROUP BY tipo', p.id, desde)).map(x => [x.tipo, x.n]));
    const v = await one(env, `SELECT COUNT(DISTINCT o.id) n, COALESCE(SUM(i.precio_centavos * i.cantidad), 0) monto FROM orders o JOIN order_items i ON i.order_id = o.id
      WHERE i.product_id = ? AND o.estado = 'paid' AND o.proveedor NOT IN ('regalo', 'cortesia') AND o.paid_at >= ?`, p.id, desde);
    const r = await one(env, "SELECT COUNT(DISTINCT o.id) n FROM orders o JOIN order_items i ON i.order_id = o.id WHERE i.product_id = ? AND o.estado = 'refunded' AND o.updated_at >= ?", p.id, desde);
    productos.push({ id: p.id, slug: p.slug, nombre: p.nombre, precio_centavos: p.precio_centavos, activo: p.activo, tipo: p.acceso.tipo,
      vistas: ev.view_product || 0, checkouts: ev.begin_checkout || 0, compras: v.n, monto_centavos: v.monto, reembolsos: r.n });
  }
  return { desde, productos };
}

// ---------- ficha comercial ----------
// Pensada para que sea lo más fácil entender y contratar: primero cómo funciona (tutorial), luego por qué Brindi,
// después qué plan te conviene según tus invitados y, aparte, los complementos para quien ya tiene su invitación.
const PLANES = [
  { slug: 'brindi-esencial', nombre: 'Esencial', para: 'Una fiesta sencilla', invitados: '100', items: ['Tu invitación con tu diseño, fotos y textos', 'Un enlace y un QR para compartir con todos', 'Mapa para llegar', 'Tus invitados confirman desde su celular', 'Ves quién viene en tiempo real'] },
  { slug: 'brindi-celebracion', nombre: 'Celebración', para: 'Bodas, XV años y graduaciones', invitados: '300', recomendado: true, items: ['Todo lo de Esencial', 'Un enlace personal por invitado, listo para WhatsApp', 'Lugares contados por invitado (nadie lleva de más)', 'Sube tu lista desde Excel', 'Galería, cuenta regresiva e itinerario'] },
  { slug: 'brindi-premium', nombre: 'Premium', para: 'Eventos grandes con control en la entrada', invitados: '1,000', items: ['Todo lo de Celebración', 'Diseños premium', 'Pase con QR de acceso para cada invitado', 'Tu equipo lo escanea en la entrada con el celular', 'Nadie entra dos veces con el mismo pase', 'Atención prioritaria'] },
];
// Complementos agrupados por la necesidad de quien ya tiene su invitación (el Paquete Organizador va con los planes)
const GRUPOS_EXTRA = [
  { titulo: '¿Te faltan lugares o tiempo?', items: [
    ['brindi-100-invitados', '+100 invitados', 'Tu lista creció: suma 100 lugares más. Puedes comprar los que necesites.'],
    ['brindi-extension-90', '90 días más en línea', 'Tu invitación y tu lista siguen disponibles 90 días más después del evento.'],
  ] },
  { titulo: '¿Quieres más funciones?', items: [
    ['brindi-mejora-celebracion', 'Subir de Esencial a Celebración', 'Para tener enlaces personales por invitado. Pagas solo la diferencia.'],
    ['brindi-mejora-premium', 'Subir de Celebración a Premium', 'Para tener pases con QR en la entrada. Pagas solo la diferencia.'],
    ['brindi-plantilla-premium', 'Diseño Gala', 'Usa el diseño Gala (glamour) sin cambiar de plan.'],
  ] },
  { titulo: '¿Prefieres que lo hagamos por ti?', items: [
    ['brindi-configuracion-asistida', 'Te ayudamos a configurarla', 'Una videollamada de 30 minutos: cargamos tu lista contigo y la dejamos lista.'],
    ['brindi-diseno-profesional', 'Diseño hecho por nuestro equipo', 'Nos dices qué quieres y diseñamos tu invitación. Incluye 2 rondas de cambios.'],
  ] },
];
const ORGANIZADOR = 'brindi-paquete-organizador';
// Tutorial: los 4 pasos de siempre y, abierto a quien quiera, el detalle de cada uno
const PASOS = [
  ['Créala gratis', 'Entra con tu correo, elige un diseño y cambia textos, fotos y colores. Ves cómo queda al instante. Todavía no pagas nada.'],
  ['Elige tu plan', 'Según cuántos invitados tienes. Un solo pago por evento, con tarjeta u OXXO.'],
  ['Publica y comparte', 'Te damos un enlace y un QR. Mándalo por WhatsApp a cada invitado o a tus grupos.'],
  ['Recibe confirmaciones', 'Tus invitados confirman desde su celular y tú ves quién viene y cuántos son.'],
];
const TUTORIAL = [
  ['Entra a Brindi', `Abre <a href="${OS}/brindi/">os.vorka.mx/brindi</a> y escribe tu correo. Te llega un enlace para entrar; no necesitas contraseña.`],
  ['Crea tu evento', 'Toca “Nueva invitación”, elige el tipo (boda, XV años, bautizo, cumpleaños…) y pon la fecha y el lugar.'],
  ['Elige un diseño', 'Escoge una de las plantillas. Puedes cambiar la paleta de colores y la tipografía cuando quieras.'],
  ['Personalízala', 'Cambia los textos, sube tu foto de portada y elige qué secciones aparecen: padrinos, itinerario, vestimenta, mesa de regalos, hospedaje… La vista previa se actualiza mientras editas.'],
  ['Agrega a tus invitados', 'Escríbelos uno por uno o sube tu lista desde Excel (Celebración y Premium). A cada uno le pones cuántos lugares tiene.'],
  ['Publícala', 'Cuando te guste, toca “Publicar”. Si aún no tienes plan, ahí mismo te lleva a comprarlo; con el mismo correo se activa solo.'],
  ['Compártela', 'Copia el enlace o descarga el QR. En Celebración y Premium, junto a cada invitado hay un botón que abre WhatsApp con su mensaje y su enlace personal.'],
  ['Sigue las confirmaciones', 'En tu panel ves quién confirmó, cuántos van y quién falta. Puedes poner fecha límite y recordarles a los que no han contestado.'],
  ['El día del evento', 'En Premium, cada invitado confirmado trae su pase con QR. Tu equipo lo escanea en la entrada desde el celular y ve cuántos lugares tiene.'],
  ['Después del evento', 'Descarga tu lista en Excel. La invitación sigue en línea 30 días después del evento y luego muestra un mensaje de agradecimiento.'],
];
const DEMOS = [['demo-boda-editorial', 'Boda', 'Atelier · editorial de lujo', 'revista'], ['demo-boda', 'Boda', 'Aurora · romántica, con sobre que se abre', 'aurora'],
  ['demo-xv', 'XV años', 'Gala · glamour para una noche de fiesta', 'gala'], ['demo-bautizo', 'Bautizo', 'Jardín · botánica contemporánea', 'jardin'],
  ['demo-graduacion', 'Graduación', 'Línea · moderna y arquitectónica', 'linea'], ['demo-cumple', 'Cumpleaños', 'Confeti · expresiva y colorida', 'confeti']];
// Las primeras 8 se ven siempre; el resto, en "Más preguntas"
const FAQ = [
  ['¿Puedo probar antes de pagar?', `Sí. En <a href="${OS}/brindi/">os.vorka.mx/brindi</a> creas tu invitación gratis y la ves en vista previa. Solo pagas cuando la quieres publicar.`],
  ['¿Mis invitados tienen que instalar algo?', 'No. La invitación se abre en el navegador del celular desde WhatsApp, un mensaje o escaneando el QR. No necesitan cuenta.'],
  ['¿Cómo la comparto por WhatsApp?', 'Tú la mandas desde tu propio WhatsApp (Brindi no envía mensajes por ti): en tu panel tocas el ícono junto a cada invitado y el mensaje sale listo con su enlace personal (planes Celebración y Premium). También puedes mandar un enlace general a grupos.'],
  ['¿Qué plan me conviene?', 'Si es algo sencillo para menos de 100 personas, Esencial. Para una boda, XV años o graduación, Celebración: cada invitado recibe su enlace y confirma sus lugares. Si son más de 300 o quieres controlar quién entra, Premium.'],
  ['¿Puedo cambiar algo después de publicar?', 'Sí, cuantas veces quieras. Editas y tocas “Publicar cambios”; el enlace y los QR no cambian. Si cambia la fecha del evento, la actualizas igual y la vigencia se recalcula.'],
  ['¿Y si necesito más invitados?', 'Compras un paquete de +100 invitados y lo aplicas a tu evento desde Ajustes. O subes de plan pagando solo la diferencia.'],
  ['¿Cómo pago? ¿Hay reembolsos?', 'Pago único con tarjeta u OXXO, procesado por Stripe: nunca vemos los datos de tu tarjeta. Si no has publicado ninguna invitación con tu plan, te devolvemos tu dinero completo si lo pides dentro de los 10 días naturales siguientes a la compra. Detalles en las <a href="/legal/brindi/">condiciones de Brindi</a>.'],
  ['¿Brindi o Cupo?', 'Brindi es para los momentos importantes (bodas, XV años, bautizos, aniversarios): invitación con diseño de autor y confirmación por invitado. Para algo rápido o informal (una fiesta, Halloween, networking, un taller) usa <a href="/tienda/cupo/">Cupo</a>: página con los datos, registro en segundos y cover directo a ti. Es gratis hasta 30 personas.'],
  ['¿Cómo uso un complemento?', 'Cómpralo con el mismo correo de tu cuenta de Brindi. Luego entra a tu invitación → Ajustes → “Aplicar un complemento” y toca “Aplicar a este evento”.'],
  ['¿Qué tanto puedo personalizar?', 'Mucho: eliges entre seis diseños y cualquiera de sus 18 paletas y 12 tipografías, ajustas colores, tamaño de los títulos y el encuadre de tu foto de portada, y sumas fotos destacadas y galería. También decides qué secciones aparecen y en qué orden: padres y padrinos, ubicaciones, itinerario, vestimenta, mesa de regalos, hospedaje, transporte y secciones libres. El contraste se corrige solo para que tu invitación siempre se lea bien.'],
  ['¿Cómo funcionan las confirmaciones?', 'Cada invitado dice si asiste, cuántas personas van (hasta los lugares que le reservaste) y si tiene alguna preferencia de alimentación. Tú ves todo en tiempo real y puedes poner una fecha límite.'],
  ['¿Qué diferencia hay entre el QR de invitación y el QR de acceso?', 'El QR de invitación abre la invitación (general o personal). El QR de acceso es el pase personal de cada invitado confirmado (plan Premium): en la entrada lo escaneas, ves cuántos lugares tiene y registras quién llegó. Si alguien intenta entrar dos veces con el mismo pase, te avisa.'],
  ['¿Puedo importar mi lista de invitados?', 'Sí, en Celebración y Premium: subes un Excel o CSV, o pegas las filas de tu hoja de cálculo. Antes de importar te mostramos qué filas tienen errores o están repetidas.'],
  ['¿Cuánto tiempo está en línea?', 'Hasta 30 días después de la fecha de tu evento. Después mostramos un mensaje de agradecimiento y guardamos tus datos 90 días más para que los descargues; luego se borran. Puedes extenderlo con el complemento de 90 días.'],
  ['¿Qué pasa con los datos de mis invitados?', 'Solo tú los ves. Las invitaciones no aparecen en Google (salvo que tú lo actives) y los enlaces personales usan códigos aleatorios que no revelan nombres. No vendemos ni compartimos datos y puedes borrar todo cuando quieras. Lee el <a href="/legal/brindi/privacidad-invitados/">aviso de privacidad para invitados</a>.'],
  ['¿Tienen soporte?', 'Sí. Escríbenos desde la sección Ayuda de tu panel o a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. En Premium te atendemos con prioridad. Si prefieres que lo hagamos contigo, existe la configuración asistida.'],
  ['¿Sirve para eventos de empresa?', 'Sí: lanzamientos, posadas, congresos o cenas de gala. Con Premium controlas el acceso en la entrada. Para varios eventos al año, el paquete Organizador sale más barato.'],
];
const VISIBLES_FAQ = 8;

export async function paginaBrindi(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = await Promise.all(PLANES.map(async p => ({ ...p, prod: await productoPorSlug(env, p.slug) })));
  const grupos = (await Promise.all(GRUPOS_EXTRA.map(async g => ({ ...g, items: (await Promise.all(g.items.map(async ([slug, titulo, texto]) => ({ slug, titulo, texto, prod: await productoPorSlug(env, slug) })))).filter(x => x.prod) })))).filter(g => g.items.length);
  const extras = grupos.flatMap(g => g.items);
  // Se pueden sumar a un plan en la misma compra (las mejoras no: son para quien ya tiene un plan)
  const conPlan = extras.filter(x => !/mejora/.test(x.slug));
  const org = await productoPorSlug(env, ORGANIZADOR);
  const aLaVenta = planes.some(p => p.prod);
  const rec = planes.find(p => p.recomendado);
  if (rec.prod && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: rec.prod.id, ref_code: code });
  const desde = planes.filter(p => p.prod).map(p => p.prod.precio_centavos).sort((a, b) => a - b)[0];
  const ahorroOrg = org && rec.prod ? rec.prod.precio_centavos * 5 - org.precio_centavos : 0;
  const error = url.searchParams.get('error') || '';
  const elegido = url.searchParams.get('plan') || rec.slug;
  const ld = [{ '@context': 'https://schema.org', '@type': aLaVenta ? 'Product' : 'Service', name: 'Brindi · Invitaciones digitales', ...(aLaVenta ? {} : { serviceType: 'Invitaciones digitales', areaServed: 'MX', provider: { '@type': 'Organization', name: 'Vorka México', url: 'https://vorka.mx/' } }), description: 'Invitaciones digitales con QR para bodas, XV años, cumpleaños y toda celebración: confirmaciones, control de acompañantes y acceso con QR.',
    ...(aLaVenta ? { brand: { '@type': 'Brand', name: 'Brindi' } } : {}), image: [`${OS}/brindi/og/aurora.png`],
    ...(aLaVenta ? { offers: { '@type': 'AggregateOffer', priceCurrency: 'MXN', lowPrice: (desde / 100).toFixed(2), highPrice: (Math.max(...planes.filter(p => p.prod).map(p => p.prod.precio_centavos)) / 100).toFixed(2), offerCount: planes.filter(p => p.prod).length } } : {}) },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) },
  { '@context': 'https://schema.org', '@type': 'HowTo', name: 'Cómo hacer tu invitación digital con Brindi', step: TUTORIAL.map(([n, t], i) => ({ '@type': 'HowToStep', position: i + 1, name: n, text: t.replace(/<[^>]+>/g, '') })) }];
  const opcion = (p, n) => `<option value="${esc(p.slug)}" data-precio="${p.precio_centavos}"${elegido === p.slug ? ' selected' : ''}>${esc(n)} · ${precio(p)}</option>`;
  const faq = ([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`;
  return pagina({
    titulo: 'Invitaciones digitales con QR para bodas, XV años y fiestas | Brindi', ruta: '/tienda/brindi/', imagen: `${OS}/brindi/og/aurora.png`,
    descripcion: 'Invitaciones digitales para bodas, XV años, bautizos, cumpleaños y graduaciones. Créala gratis, compártela por WhatsApp con un enlace o QR y recibe confirmaciones. Pago único desde $399 MXN.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&display=swap" rel="stylesheet"><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    frames: [OS],   // demostración interactiva en el celular
    script: SCRIPT,
    cuerpo: `<div class="br">
<section class="br-hero"><div class="marco br-hero-g">
  <div class="br-hero-t">
    ${navTienda('invitaciones')}
    <span class="br-logo">brindi<i>✦</i></span>
    <h1 class="br-h1">Tu invitación digital, lista en minutos.</h1>
    <p class="br-lead">Para bodas, XV años, bautizos, cumpleaños y graduaciones. La mandas por WhatsApp, tus invitados confirman desde su celular y tú ves quién viene.</p>
    <div class="botones"><a class="btn tinta" href="${OS}/brindi/" rel="noopener">Créala gratis ${FLECHA}</a>${aLaVenta ? '<a class="btn blanco" href="#planes">Ver precios</a>' : ''}</div>
    <p class="br-nota">${aLaVenta ? `Pagas solo cuando la quieras publicar: <b>un pago por evento desde ${precio({ precio_centavos: desde })}</b>, sin mensualidades.` : 'Muy pronto a la venta. Ya puedes crear tu invitación gratis y verla en vista previa.'}</p>
  </div>
  <div class="br-tel" aria-label="Ejemplo de invitación en un celular"><iframe src="${OS}/i/demo-boda" title="Demostración de una invitación de boda" loading="lazy"></iframe><span class="br-tel-cinta">Toca y explora · demostración</span></div>
</div></section>

<section class="t-sec" id="como-funciona"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Cómo funciona</span><h2 class="h2">Cuatro pasos y listo</h2></div>
  <ol class="br-pasos">${PASOS.map(([t, d], i) => `<li class="rv" style="--d:${i * .05}s"><span class="br-num" aria-hidden="true">${i + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
  <details class="br-tuto" id="tutorial"><summary><span>Ver el tutorial paso a paso</span><small>${TUTORIAL.length} pasos · 3 minutos de lectura</small></summary>
    <ol>${TUTORIAL.map(([t, d]) => `<li><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
    <p class="br-tuto-fin"><a class="btn tinta" href="${OS}/brindi/" rel="noopener">Empezar mi invitación gratis ${FLECHA}</a></p>
  </details>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Beneficios</span><h2 class="h2">Por qué Brindi</h2></div>
  <ul class="br-ben">${[['💌', 'Se ve increíble', 'Diseños de autor —un sobre que se abre, un arco floral, una portada de revista— que haces tuyos sin saber de diseño.'],
    ['⚡', 'La mandas en segundos', 'Un enlace y un QR para todos, o uno personal por invitado listo para WhatsApp.'], ['🌱', 'Cero impresión', 'Sin imprenta ni mensajería. Si cambia un dato, lo corriges y todos lo ven al instante.'],
    ['✅', 'Sabes quién viene', 'Quién confirma, cuántos son y qué comen, en tiempo real. Con fecha límite y lista de quién falta.'], ['👪', 'Nadie lleva de más', 'Cada invitado confirma solo los lugares que le reservaste.'],
    ['🎟️', 'Entrada ordenada', 'En Premium, cada invitado trae su pase con QR y tu equipo lo escanea en la puerta.']].map(([i, t, d], k) => `<li class="rv" style="--d:${(k % 3) * .05}s"><span aria-hidden="true">${i}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="t-sec" id="demos"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Ejemplos</span><h2 class="h2">Ábrelas como si fueras invitado</h2><p class="lead">Son de demostración: puedes tocar todo, las respuestas no se guardan.</p></div>
  <div class="br-demos">${DEMOS.map(([s, t, d, og]) => `<a class="br-demo rv" href="${OS}/i/${s}" target="_blank" rel="noopener"><img src="${OS}/brindi/og/${og}.png" alt="" loading="lazy" width="1200" height="630"><b>${t}</b><span>${d}</span><span class="flecha">Abrir ${FLECHA}</span></a>`).join('')}</div>
</div></section>

<section class="t-sec suave" id="planes"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Precios</span><h2 class="h2">Un solo pago por evento</h2><p class="lead">Sin mensualidades. Eliges según cuántos invitados tienes. Precios en pesos con IVA incluido.</p></div>
  <div class="br-guia" role="group" aria-label="¿Qué plan me conviene?"><b>¿Cuál me conviene?</b>${planes.map(p => `<button type="button" data-ver="${p.slug}"><span>${p.slug === 'brindi-esencial' ? 'Hasta 100 invitados' : p.slug === 'brindi-celebracion' ? 'Boda o XV · hasta 300' : 'Más de 300 o control en la puerta'}</span><em>${p.nombre}</em></button>`).join('')}</div>
  <div class="br-planes">${planes.map(p => `<article class="br-plan${p.recomendado ? ' rec' : ''}" id="plan-${p.slug}">${p.recomendado ? '<span class="br-sello">Recomendado</span>' : ''}<h3>${p.nombre}</h3><p class="br-para">${p.para}</p>
    <p class="br-precio">${p.prod ? `<b>${precio(p.prod)}</b><small>un solo pago</small>` : '<b>Muy pronto</b>'}</p><p class="br-inv">Hasta <b>${p.invitados}</b> invitados</p>
    <ul>${p.items.map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
    ${p.prod ? `<a class="btn ${p.recomendado ? 'tinta' : 'blanco'}" href="?plan=${p.slug}#comprar" data-plan="${p.slug}">Quiero ${p.nombre}</a>` : ''}</article>`).join('')}</div>
  <p class="br-gratis">¿No sabes todavía? <a href="${OS}/brindi/" rel="noopener">Créala gratis</a> y decide al publicar. Tu diseño se guarda.</p>
  ${org ? `<div class="br-org"><div><b>¿Organizas eventos?</b><span>Paquete Organizador: 5 eventos Celebración por ${precio(org)}${ahorroOrg > 0 ? ` (ahorras ${precio({ precio_centavos: ahorroOrg })})` : ''}. Para salones, fotógrafos y planners.</span></div><a class="btn blanco chico" href="?plan=${ORGANIZADOR}#comprar" data-plan="${ORGANIZADOR}">Quiero el paquete</a></div>` : ''}
</div></section>

${grupos.length ? `<section class="t-sec" id="complementos"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Complementos</span><h2 class="h2">¿Ya tienes tu invitación? Agrégale lo que te falte</h2><p class="lead">No son necesarios para empezar: tu plan ya trae todo lo básico.</p></div>
  <ol class="br-como"><li><i>1</i><span>Compra con el <b>mismo correo</b> de tu cuenta de Brindi</span></li><li><i>2</i><span>Entra a tu invitación → <b>Ajustes</b></span></li><li><i>3</i><span>Toca <b>“Aplicar a este evento”</b></span></li></ol>
  <div class="br-grupos">${grupos.map(g => `<div class="br-grupo"><h3>${g.titulo}</h3>${g.items.map(x => `<div class="br-extra"><div><b>${esc(x.titulo)}</b><span>${esc(x.texto)}</span></div><span class="br-extra-p"><b class="num">${precio(x.prod)}</b><a class="btn blanco chico" href="?plan=${x.slug}#comprar" data-plan="${x.slug}">Agregar</a></span></div>`).join('')}</div>`).join('')}</div>
</div></section>` : ''}

${aLaVenta ? seccionCompra({ titulo: 'Contrata en un minuto', intro: '¿Ya creaste tu invitación gratis? Usa el mismo correo y el plan se activa solo.',
  pasos: [['Eliges tu plan', 'Y si quieres, le sumas complementos en la misma compra.'], ['Pagas con tarjeta u OXXO', 'Un solo pago, sin mensualidades.'], ['Te llega tu acceso por correo', 'Entras con un toque, sin contraseña.'], ['Terminas y publicas tu invitación', 'Y la compartes por WhatsApp.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Si no has publicado, te devolvemos tu dinero en los primeros 10 días', 'Soporte de personas por correo y WhatsApp'],
  form: `<form class="t-form t-compra" id="form-brindi" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="slug">¿Qué vas a comprar?</label><select id="slug" name="slug">
      <optgroup label="Planes (para un evento)">${planes.filter(p => p.prod).map(p => opcion(p.prod, `Plan ${p.nombre} · hasta ${p.invitados} invitados`)).join('')}${org ? opcion(org, 'Paquete Organizador · 5 eventos') : ''}</optgroup>
      ${extras.length ? `<optgroup label="Complementos (si ya tienes tu invitación)">${extras.map(x => opcion(x.prod, x.titulo)).join('')}</optgroup>` : ''}</select></div>
    ${conPlan.length ? `<fieldset class="br-suma" id="br-suma" hidden><legend>¿Le agregas algo a tu plan? <small>(opcional, en la misma compra)</small></legend>
      ${conPlan.map(x => `<label class="t-casilla"><input type="checkbox" name="extra" value="${esc(x.slug)}" data-precio="${x.prod.precio_centavos}"><span><b>${esc(x.titulo)}</b> · ${precio(x.prod)}</span></label>`).join('')}
      <p class="br-total">Total: <b class="num" id="br-total"></b></p></fieldset>` : ''}
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Tu correo</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llega tu acceso. Si ya creaste tu invitación gratis, usa ese mismo correo y el plan se activa solo.</small></div>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/brindi/" target="_blank">condiciones de Brindi</a> y el <a href="/legal/brindi/privacidad/" target="_blank">aviso de privacidad de Brindi</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn tinta" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">Tarjeta · OXXO &nbsp;·&nbsp; Pago seguro con Stripe</p>
  </form>` }) : ''}

${ELEGIR('brindi')}
${seccionFaq({ titulo: 'Lo que más nos preguntan', items: FAQ.slice(0, VISIBLES_FAQ).map(faq).join(''), pie: `<details class="br-mas"><summary>Más preguntas</summary><div class="t-faq">${FAQ.slice(VISIBLES_FAQ).map(faq).join('')}</div></details>` })}

${await masTienda(env, 'invitaciones')}
<section class="t-sec"><div class="marco">
  <div class="br-confianza">${[['Pago seguro', 'Stripe procesa el pago; nunca vemos tu tarjeta. Factura disponible escribiendo a hola@vorka.mx.'], ['Tus datos, tuyos', 'Invitaciones fuera de Google por defecto, enlaces con códigos aleatorios y borrado cuando tú quieras.'],
    ['Soporte de personas', 'Escríbenos desde tu panel o a hola@vorka.mx. Respondemos en horario laboral de México.'], ['Respaldo', 'Brindi es una marca desarrollada por Vorka México.']].map(([t, d]) => `<div><b>${t}</b><p>${d}</p></div>`).join('')}</div>
  <p class="t-nota t-legal"><a href="/legal/brindi/">Condiciones de Brindi</a> · <a href="/legal/brindi/privacidad/">Aviso de privacidad</a> · <a href="/legal/brindi/privacidad-invitados/">Privacidad para invitados</a> · <a href="/legal/reembolsos/">Reembolsos</a> · Hecha con Brindi · Powered by vorka.mx</p>
</div></section>
</div>`,
  });
}

const CSS = `
.br{--br-vino:#6e1f3a;--br-champan:#f7efe3;--br-oro:#b98a2e}
.br-hero{background:var(--br-champan);padding:clamp(28px,6vw,72px) 0;overflow:hidden}
.br-hero-g{display:grid;gap:36px;align-items:center}
@media(min-width:900px){.br-hero-g{grid-template-columns:1.1fr .9fr}}
.br-logo{display:block;font:italic 500 34px/1 Fraunces,Georgia,serif;color:var(--br-vino);margin:16px 0 10px}.br-logo i{color:var(--br-oro);font-style:normal;font-size:.7em}
.br-h1{font:500 clamp(34px,6vw,58px)/1.05 Fraunces,Georgia,serif;letter-spacing:-.02em;margin:0 0 14px;color:#1f1a1d}
.br-lead{font-size:clamp(17px,2.2vw,20px);line-height:1.55;color:#4a3f43;margin:0 0 22px;max-width:36em}
.br-nota{color:#5c4a50;font-size:15px;margin-top:14px}
.br-tel{position:relative;justify-self:center;width:min(340px,86vw);aspect-ratio:9/18.5;border:10px solid #1f1a1d;border-radius:44px;overflow:hidden;background:#fff;box-shadow:0 40px 80px -30px rgba(31,26,29,.55)}
.br-tel iframe{width:100%;height:100%;border:0;display:block}
.br-tel-cinta{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);background:rgba(31,26,29,.85);color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;white-space:nowrap;pointer-events:none}
.br-ben{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.br-ben li{background:#fff;border:1px solid #eee7dc;border-radius:18px;padding:20px}.br-ben span{font-size:28px}.br-ben b{display:block;font-size:18px;margin:8px 0 4px}.br-ben p{margin:0;color:#5c4a50}
.br-demos{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.br-demo{display:grid;gap:4px;background:#fff;border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;border:1px solid #eee7dc;padding-bottom:14px}
.br-demo img{width:100%;height:auto;aspect-ratio:1200/630;object-fit:cover}.br-demo b,.br-demo span{padding:0 16px}.br-demo b{font-size:18px;margin-top:8px}.br-demo span{color:#5c4a50;font-size:14px}.br-demo .flecha{color:var(--br-vino);font-weight:700}
.br-planes{display:grid;gap:16px;align-items:start}
@media(min-width:900px){.br-planes{grid-template-columns:repeat(3,1fr)}}
.br-plan{position:relative;background:#fff;border:1.5px solid #eee7dc;border-radius:22px;padding:24px;display:grid;gap:8px}
.br-plan.rec{border-color:var(--br-vino);box-shadow:0 24px 50px -28px rgba(110,31,58,.6)}
.br-sello{position:absolute;top:-12px;left:24px;background:var(--br-vino);color:#fff;font-size:12px;font-weight:800;padding:4px 12px;border-radius:999px;letter-spacing:.04em}
.br-plan h3{font:500 28px/1.1 Fraunces,Georgia,serif;margin:4px 0 0}.br-para{color:#5c4a50;margin:0}
.br-precio{margin:6px 0 0;display:flex;align-items:baseline;gap:8px}.br-precio b{font-size:34px;letter-spacing:-.02em}.br-precio small{color:#5c4a50}
.br-inv{margin:0;color:#1f1a1d}.br-plan ul{list-style:none;padding:0;margin:8px 0 12px;display:grid;gap:8px}.br-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.br-plan li svg{flex:none;width:18px;height:18px;margin-top:3px;color:var(--br-vino)}.br-plan li span{min-width:0}
.br-pasos{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.br-pasos li{background:#fff;border:1px solid #eee7dc;border-radius:18px;padding:20px}.br-pasos b{display:block;font-size:18px;margin:10px 0 4px}.br-pasos p{margin:0;color:#5c4a50}
.br-num{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--br-vino);color:#fff;font-weight:800;font-size:17px}
.br-tuto{margin-top:18px;background:#fff;border:1px solid #eee7dc;border-radius:18px;padding:0 20px}
.br-tuto summary{cursor:pointer;list-style:none;padding:18px 0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;font-weight:700;font-size:17px;color:var(--br-vino)}
.br-tuto summary::-webkit-details-marker{display:none}.br-tuto summary span::after{content:" ↓"}.br-tuto[open] summary span::after{content:" ↑"}.br-tuto summary small{font-weight:500;color:#5c4a50;font-size:14px}
.br-tuto ol{margin:0;padding:0 0 4px 22px;display:grid;gap:14px}.br-tuto li::marker{color:var(--br-vino);font-weight:800}.br-tuto li b{display:block;font-size:16px}.br-tuto li p{margin:2px 0 0;color:#5c4a50}
.br-tuto-fin{margin:18px 0 20px}
.br-guia{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 18px}.br-guia>b{margin-right:4px}
.br-guia button{display:grid;text-align:left;gap:1px;padding:8px 14px;border-radius:14px;border:1.5px solid #e5dccf;background:#fff;font:inherit;cursor:pointer;color:#1f1a1d}
.br-guia button span{font-size:13px;color:#5c4a50}.br-guia button em{font-style:normal;font-weight:700}.br-guia button.si{border-color:var(--br-vino);box-shadow:0 0 0 3px rgba(110,31,58,.12)}
.br-plan.si{outline:3px solid var(--br-vino);outline-offset:3px}
.br-gratis{margin:18px 0 0;color:#5c4a50}.br-gratis a{color:var(--br-vino);font-weight:700}
.br-org{margin-top:16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;background:#fff;border:1px dashed #d9cbb8;border-radius:16px;padding:16px 18px}
.br-org b{display:block}.br-org span{color:#5c4a50;font-size:15px}
.br-como{list-style:none;padding:0;margin:0 0 20px;display:flex;flex-wrap:wrap;gap:8px}
.br-como li{background:var(--br-champan);border-radius:12px;padding:10px 14px;font-size:15px;display:flex;align-items:center;gap:8px}.br-como li>i{flex:none;font-style:normal;font-weight:800;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--br-vino);color:#fff;font-size:12px}
.br-grupos{display:grid;gap:18px}
@media(min-width:900px){.br-grupos{grid-template-columns:repeat(3,1fr);align-items:start}}
.br-grupo h3{font-size:17px;margin:0 0 10px}
.br-extra{background:#fff;border-radius:16px;padding:16px;display:grid;gap:10px;border:1px solid #eee7dc;margin-bottom:10px}.br-extra b{display:block;font-size:16px}.br-extra span{color:#5c4a50;font-size:14px}
.br-extra-p{display:flex;align-items:center;justify-content:space-between;gap:10px}.br-extra-p b{color:#1f1a1d;font-size:18px}
.br-despues{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:6px 16px;color:#5c4a50;font-size:13.5px}.br-despues li{display:flex;align-items:center;gap:6px}.br-despues i{font-style:normal;font-weight:800;font-size:11px;display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--br-champan);color:var(--br-vino)}
.br-suma{border:1px solid #eee7dc;border-radius:14px;padding:12px 14px;margin:0;display:grid;gap:8px}.br-suma legend{font-weight:700;padding:0 4px}.br-suma legend small{font-weight:500;color:#5c4a50}.br-suma .t-casilla{margin:0}.br-total{margin:4px 0 0;font-size:15px}.br-total b{font-size:18px}
.br-mas{margin-top:10px}.br-mas>summary{cursor:pointer;font-weight:700;color:var(--br-vino);padding:10px 0}
.br-confianza{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}.br-confianza div{border-top:2px solid var(--br-vino);padding-top:10px}.br-confianza p{margin:4px 0 0;color:#5c4a50;font-size:15px}`;

const SCRIPT = `(function(){
  document.querySelectorAll('[data-ver]').forEach(function(b){ b.addEventListener('click',function(){
    document.querySelectorAll('[data-ver]').forEach(function(x){ x.classList.toggle('si', x===b); });
    document.querySelectorAll('.br-plan').forEach(function(p){ p.classList.toggle('si', p.id==='plan-'+b.dataset.ver); });
    var p=document.getElementById('plan-'+b.dataset.ver); if(p) p.scrollIntoView({behavior:'smooth',block:'center'});
  }); });
  var f=document.getElementById('form-brindi'); if(!f||!window.fetch) return;
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(e){ var s=document.getElementById('slug'); if(!s) return; e.preventDefault(); s.value=a.dataset.plan; document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  // Complementos en la misma compra: solo cuando lo elegido es un plan
  var suma=document.getElementById('br-suma'), tot=document.getElementById('br-total');
  function esPlan(){ return /^brindi-(esencial|celebracion|premium)$/.test(f.slug.value); }
  function extrasElegidos(){ return suma&&esPlan()?[].slice.call(suma.querySelectorAll('input[name=extra]:checked')):[]; }
  function precioDe(){ var o=f.slug.options[f.slug.selectedIndex]; return o?+o.dataset.precio||0:0; }
  function total(){ if(!suma) return; suma.hidden=!esPlan(); var c=precioDe(); extrasElegidos().forEach(function(x){ c+=+x.dataset.precio; }); tot.textContent='$'+(c/100).toLocaleString('es-MX')+' MXN'; }
  f.slug.addEventListener('change',total); if(suma) suma.addEventListener('change',total); total();
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:f.slug.value, nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value) d.codigo=f.codigo.value.trim(); if(f.usar_puntos&&f.usar_puntos.checked) d.usar_puntos=true;
    var ex=extrasElegidos(); if(ex.length){ d.items=[{slug:d.slug}].concat(ex.map(function(x){return {slug:x.value};})); }
    if(!d.nombre||d.nombre.trim().length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido.'); }
    if(!d.terminos) return mostrar('Debes aceptar los términos y el aviso de privacidad.');
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo el pago…';
    fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok&&x.j.url) location.href=x.j.url; else mostrar(x.j.error||'No pudimos abrir el pago. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
})();`;
