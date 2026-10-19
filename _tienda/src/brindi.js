// Brindi (invitaciones digitales, marca propia de Diversificación de Vorka México).
// - /tienda/brindi/ → ficha comercial: demostraciones, comparador de planes, complementos, preguntas y compra (usa /api/checkout de siempre)
// - RPC para Vorka OS (clase Admin): validarAcceso, comprasApp, resumenApp, productosApp
// La app vive en os.vorka.mx/brindi/ y las invitaciones en os.vorka.mx/i/<evento>. Aquí solo se vende.
import { one, all } from './util.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { hashToken } from './entrega.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio } from './tienda.js';
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
const PLANES = [
  { slug: 'brindi-esencial', nombre: 'Esencial', para: 'Para una fiesta sencilla', invitados: '100', items: ['Plantillas estándar', 'Textos, colores y fotos a tu gusto', 'Enlace y QR general', 'Ubicación con mapa', 'Confirmación de asistencia', 'Panel de confirmaciones'] },
  { slug: 'brindi-celebracion', nombre: 'Celebración', para: 'Bodas, XV años y graduaciones', invitados: '300', recomendado: true, items: ['Todo lo de Esencial', 'Enlace y QR personal por invitado', 'Lugares reservados por invitado', 'Importar desde Excel o CSV', 'Galería, cuenta regresiva e itinerario', 'Varias ubicaciones', 'Estadísticas y listas en Excel'] },
  { slug: 'brindi-premium', nombre: 'Premium', para: 'Eventos grandes con control de acceso', invitados: '1,000', items: ['Todo lo de Celebración', 'Plantillas premium', 'Pase de acceso con QR por invitado', 'Recepción con escáner desde el celular', 'Registro de entradas sin duplicados', 'Exportar accesos', 'Soporte prioritario'] },
];
const COMPLEMENTOS = [
  ['brindi-100-invitados', 'Se suma a un evento con plan. Puedes comprar varios.'],
  ['brindi-extension-90', 'Tu invitación y tus datos se quedan 90 días más.'],
  ['brindi-mejora-celebracion', 'De Esencial a Celebración en el mismo evento.'],
  ['brindi-mejora-premium', 'De Celebración a Premium en el mismo evento.'],
  ['brindi-plantilla-premium', 'Usa Gala, la plantilla de glamour, sin cambiar de plan.'],
  ['brindi-configuracion-asistida', 'Cargamos tu lista y dejamos todo listo contigo en 30 min.'],
  ['brindi-diseno-profesional', 'Nuestro equipo personaliza tu invitación (2 rondas de cambios).'],
  ['brindi-paquete-organizador', 'Cinco eventos Celebración para organizadores, salones y fotógrafos.'],
];
const DEMOS = [['demo-boda-editorial', 'Boda', 'Atelier · editorial de lujo', 'revista'], ['demo-boda', 'Boda', 'Aurora · romántica, con sobre que se abre', 'aurora'],
  ['demo-xv', 'XV años', 'Gala · glamour para una noche de fiesta', 'gala'], ['demo-bautizo', 'Bautizo', 'Jardín · botánica contemporánea', 'jardin'],
  ['demo-graduacion', 'Graduación', 'Línea · moderna y arquitectónica', 'linea'], ['demo-cumple', 'Cumpleaños', 'Confeti · expresiva y colorida', 'confeti']];
const FAQ = [
  ['¿Brindi o Cupo?', 'Brindi es para los momentos importantes (bodas, XV años, bautizos, aniversarios): invitación con diseño de autor y confirmación por invitado. Para algo rápido o informal (una fiesta, Halloween, networking, un taller) usa <a href="/tienda/cupo-pro/">Cupo</a>: página con los datos, registro en segundos y cover directo a ti. Es gratis para eventos gratis.'],
  ['¿Cómo funciona?', 'Compras tu plan, entras a Brindi con tu correo, eliges una plantilla y la personalizas viendo cómo queda en tiempo real. Al publicar te damos un enlace y un QR para compartir. Tus invitados la abren desde su celular y confirman ahí mismo.'],
  ['¿Mis invitados tienen que instalar algo?', 'No. La invitación se abre en el navegador del celular desde WhatsApp, un mensaje o escaneando el QR. No necesitan cuenta.'],
  ['¿Puedo probar antes de pagar?', `Sí. En <a href="${OS}/brindi/">os.vorka.mx/brindi</a> creas tu invitación gratis y la ves en vista previa. Solo pagas cuando la quieres publicar.`],
  ['¿Qué tanto puedo personalizar?', 'Mucho: eliges entre seis diseños y cualquiera de sus 18 paletas y 12 tipografías, ajustas colores, tamaño de los títulos y el encuadre de tu foto de portada, y sumas fotos destacadas y galería. También decides qué secciones aparecen y en qué orden: padres y padrinos, ubicaciones, itinerario, vestimenta, mesa de regalos, hospedaje, transporte y secciones libres. El contraste se corrige solo para que tu invitación siempre se lea bien.'],
  ['¿Cómo la comparto por WhatsApp?', 'Desde tu panel tocas el ícono de WhatsApp junto a cada invitado y el mensaje sale listo con su enlace personal (planes Celebración y Premium). También puedes mandar un enlace general a grupos.'],
  ['¿Cómo funcionan las confirmaciones?', 'Cada invitado dice si asiste, cuántas personas van (hasta los lugares que le reservaste) y si tiene alguna preferencia de alimentación. Tú ves todo en tiempo real y puedes poner una fecha límite.'],
  ['¿Qué diferencia hay entre el QR de invitación y el QR de acceso?', 'El QR de invitación abre la invitación (general o personal). El QR de acceso es el pase personal de cada invitado confirmado (plan Premium): en la entrada lo escaneas, ves cuántos lugares tiene y registras quién llegó. Si alguien intenta entrar dos veces con el mismo pase, te avisa.'],
  ['¿Puedo importar mi lista de invitados?', 'Sí, en Celebración y Premium: subes un Excel o CSV, o pegas las filas de tu hoja de cálculo. Antes de importar te mostramos qué filas tienen errores o están repetidas.'],
  ['¿Puedo cambiar algo después de publicar?', 'Sí, cuantas veces quieras. Editas y tocas “Publicar cambios”; el enlace y los QR no cambian. Si cambia la fecha del evento, la actualizas igual y la vigencia se recalcula.'],
  ['¿Cuánto tiempo está en línea?', 'Hasta 30 días después de la fecha de tu evento. Después mostramos un mensaje de agradecimiento y guardamos tus datos 90 días más para que los descargues; luego se borran. Puedes extenderlo con el complemento de 90 días.'],
  ['¿Y si necesito más invitados?', 'Compras un paquete de +100 invitados y lo aplicas a tu evento desde Ajustes. O mejoras tu plan pagando solo la diferencia.'],
  ['¿Cómo pago? ¿Hay reembolsos?', 'Pago único con tarjeta u OXXO, procesado por Stripe: nunca vemos los datos de tu tarjeta. Si no has publicado ninguna invitación con tu plan, te devolvemos tu dinero completo si lo pides dentro de los 10 días naturales siguientes a la compra. Detalles en las <a href="/legal/brindi/">condiciones de Brindi</a>.'],
  ['¿Qué pasa con los datos de mis invitados?', 'Solo tú los ves. Las invitaciones no aparecen en Google (salvo que tú lo actives) y los enlaces personales usan códigos aleatorios que no revelan nombres. No vendemos ni compartimos datos y puedes borrar todo cuando quieras. Lee el <a href="/legal/brindi/privacidad-invitados/">aviso de privacidad para invitados</a>.'],
  ['¿Tienen soporte?', 'Sí. Escríbenos desde la sección Ayuda de tu panel o a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. En Premium te atendemos con prioridad. Si prefieres que lo hagamos contigo, existe la configuración asistida.'],
  ['¿Sirve para eventos de empresa?', 'Sí: lanzamientos, posadas, congresos o cenas de gala. Con Premium controlas el acceso en la entrada. Para varios eventos al año, el paquete Organizador sale más barato.'],
];

export async function paginaBrindi(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = await Promise.all(PLANES.map(async p => ({ ...p, prod: await productoPorSlug(env, p.slug) })));
  const extras = (await Promise.all(COMPLEMENTOS.map(async ([slug, texto]) => ({ slug, texto, prod: await productoPorSlug(env, slug) })))).filter(x => x.prod);
  const aLaVenta = planes.some(p => p.prod);
  const rec = planes.find(p => p.recomendado);
  if (rec.prod && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: rec.prod.id, ref_code: code });
  const desde = planes.filter(p => p.prod).map(p => p.prod.precio_centavos).sort((a, b) => a - b)[0];
  const error = url.searchParams.get('error') || '';
  const elegido = url.searchParams.get('plan') || rec.slug;
  const ld = [{ '@context': 'https://schema.org', '@type': aLaVenta ? 'Product' : 'Service', name: 'Brindi · Invitaciones digitales', ...(aLaVenta ? {} : { serviceType: 'Invitaciones digitales', areaServed: 'MX', provider: { '@type': 'Organization', name: 'Vorka México', url: 'https://vorka.mx/' } }), description: 'Invitaciones digitales con QR para bodas, XV años, cumpleaños y toda celebración: confirmaciones, control de acompañantes y acceso con QR.',
    ...(aLaVenta ? { brand: { '@type': 'Brand', name: 'Brindi' } } : {}), image: [`${OS}/brindi/og/aurora.png`],
    ...(aLaVenta ? { offers: { '@type': 'AggregateOffer', priceCurrency: 'MXN', lowPrice: (desde / 100).toFixed(2), highPrice: (Math.max(...planes.filter(p => p.prod).map(p => p.prod.precio_centavos)) / 100).toFixed(2), offerCount: planes.filter(p => p.prod).length } } : {}) },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const opcion = (p, n) => `<option value="${esc(p.slug)}"${elegido === p.slug ? ' selected' : ''}>${esc(n)} · ${precio(p)}</option>`;
  return pagina({
    titulo: 'Invitaciones digitales con QR para bodas, XV años y fiestas | Brindi', ruta: '/tienda/brindi/', imagen: `${OS}/brindi/og/aurora.png`,
    descripcion: 'Invitaciones digitales para bodas, XV años, bautizos, cumpleaños y graduaciones. Compártelas por WhatsApp, recibe confirmaciones y controla el acceso con QR. Pago único desde $299 MXN.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&display=swap" rel="stylesheet"><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    frames: [OS],   // demostración interactiva en el celular
    script: SCRIPT,
    cuerpo: `<div class="br">
<section class="br-hero"><div class="marco br-hero-g">
  <div class="br-hero-t">
    <a class="t-volver" href="/tienda/">← Tienda</a>
    <span class="br-logo">brindi<i>✦</i></span>
    <h1 class="br-h1">Invitaciones digitales inolvidables. Compártelas en segundos.</h1>
    <p class="br-lead">Invitaciones digitales con diseño de autor para bodas, XV años, cumpleaños, graduaciones y bautizos. Tus invitados confirman desde su celular y tú organizas todo desde un solo lugar.</p>
    <div class="botones">${aLaVenta ? `<a class="btn tinta" href="#comprar">Elegir mi plan ${FLECHA}</a>` : ''}<a class="btn blanco" href="${OS}/brindi/" rel="noopener">Crear gratis y ver cómo queda</a></div>
    <p class="br-nota">${aLaVenta ? `Pago único desde <b>${precio({ precio_centavos: desde })}</b> por evento · tarjeta u OXXO · sin mensualidades` : 'Muy pronto a la venta. Ya puedes crear tu invitación gratis y verla en vista previa.'}</p>
  </div>
  <div class="br-tel" aria-label="Ejemplo de invitación en un celular"><iframe src="${OS}/i/demo-boda" title="Demostración de una invitación de boda" loading="lazy"></iframe><span class="br-tel-cinta">Toca y explora · demostración</span></div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Por qué Brindi</span><h2 class="h2">Todo lo de una invitación impresa, y lo que el papel no puede</h2></div>
  <ul class="br-ben">${[['💌', 'Invitaciones que sorprenden', 'Plantillas con composición propia —un sobre que se abre, un arco floral, una portada de revista— que puedes hacer tuyas sin saber de diseño.'],
    ['⚡', 'Compartidas en segundos', 'Un enlace y un QR para todos, o uno personal por invitado listo para WhatsApp.'], ['🌱', 'Sin gastos de impresión', 'Ni imprenta ni mensajería. Si cambia un dato, lo corriges y todos lo ven al instante.'],
    ['✅', 'Confirmaciones en orden', 'Quién viene, cuántos y qué comen, en tiempo real, con fecha límite y recordatorios por WhatsApp.'], ['👪', 'Control de acompañantes', 'Cada invitado confirma hasta los lugares que le reservaste. Nada de sorpresas.'],
    ['🎟️', 'Acceso con QR', 'En Premium, cada invitado trae su pase y tu equipo lo escanea en la entrada sin duplicados.']].map(([i, t, d], k) => `<li class="rv" style="--d:${(k % 3) * .05}s"><span aria-hidden="true">${i}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="t-sec suave" id="demos"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Demostraciones</span><h2 class="h2">Ábrelas como si fueras invitado</h2><p class="lead">Datos ficticios, identificados como demostración. Las respuestas no se guardan.</p></div>
  <div class="br-demos">${DEMOS.map(([s, t, d, og]) => `<a class="br-demo rv" href="${OS}/i/${s}" target="_blank" rel="noopener"><img src="${OS}/brindi/og/${og}.png" alt="" loading="lazy" width="1200" height="630"><b>${t}</b><span>${d}</span><span class="flecha">Abrir ${FLECHA}</span></a>`).join('')}</div>
</div></section>

<section class="t-sec" id="planes"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Planes</span><h2 class="h2">Un pago por evento. Sin mensualidades.</h2><p class="lead">Tu invitación queda en línea hasta 30 días después de tu evento. Precios en pesos mexicanos con IVA incluido.</p></div>
  <div class="br-planes">${planes.map(p => `<article class="br-plan${p.recomendado ? ' rec' : ''}">${p.recomendado ? '<span class="br-sello">Recomendado</span>' : ''}<h3>${p.nombre}</h3><p class="br-para">${p.para}</p>
    <p class="br-precio">${p.prod ? `<b>${precio(p.prod)}</b><small>por evento</small>` : '<b>Muy pronto</b>'}</p><p class="br-inv">Hasta <b>${p.invitados}</b> invitados</p>
    <ul>${p.items.map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
    ${p.prod ? `<a class="btn ${p.recomendado ? 'tinta' : 'blanco'}" href="?plan=${p.slug}#comprar" data-plan="${p.slug}">Elegir ${p.nombre}</a>` : ''}</article>`).join('')}</div>
</div></section>

${extras.length ? `<section class="t-sec suave" id="complementos"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Complementos</span><h2 class="h2">Agrega solo lo que necesitas</h2><p class="lead">Se aplican a un evento desde su sección de Ajustes. Compra con el mismo correo de tu cuenta.</p></div>
  <div class="br-extras">${extras.map(x => `<div class="br-extra"><b>${esc(x.prod.nombre.replace('Brindi · ', ''))}</b><span>${esc(x.texto)}</span><span class="br-extra-p"><b class="num">${precio(x.prod)}</b><a class="btn blanco chico" href="?plan=${x.slug}#comprar" data-plan="${x.slug}">Comprar</a></span></div>`).join('')}</div>
</div></section>` : ''}

${aLaVenta ? `<section class="t-sec" id="comprar"><div class="marco t-estrecho">
  <span class="etiqueta">Compra segura</span><h2 class="h2 t-h2-sec">Empieza tu invitación</h2>
  <form class="t-form t-compra" id="form-brindi" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="slug">¿Qué quieres comprar?</label><select id="slug" name="slug">
      <optgroup label="Planes (un evento)">${planes.filter(p => p.prod).map(p => opcion(p.prod, `Plan ${p.nombre}`)).join('')}</optgroup>
      ${extras.length ? `<optgroup label="Complementos">${extras.map(x => opcion(x.prod, x.prod.nombre.replace('Brindi · ', ''))).join('')}</optgroup>` : ''}</select></div>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llega tu acceso a Brindi. Si ya tienes cuenta, usa el mismo correo.</small></div>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/brindi/" target="_blank">condiciones de Brindi</a> y el <a href="/legal/brindi/privacidad/" target="_blank">aviso de privacidad de Brindi</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn tinta" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">Tarjeta · OXXO &nbsp;·&nbsp; Pago seguro con Stripe · Te llega el acceso al confirmarse el pago</p>
  </form>
</div></section>` : ''}

${ELEGIR('brindi')}
<section class="t-sec suave"><div class="marco t-estrecho">
  <span class="etiqueta">Preguntas frecuentes</span><h2 class="h2 t-h2-sec">Antes de empezar</h2>
  <div class="t-faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join('')}</div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="br-confianza">${[['Pago seguro', 'Stripe procesa el pago; nunca vemos tu tarjeta. Factura disponible escribiendo a hola@vorka.mx.'], ['Tus datos, tuyos', 'Invitaciones fuera de Google por defecto, enlaces con códigos aleatorios y borrado cuando tú quieras.'],
    ['Soporte de personas', 'Escríbenos desde tu panel o a hola@vorka.mx. Respondemos en horario laboral de México.'], ['Respaldo', 'Brindi es una marca desarrollada por Vorka México.']].map(([t, d]) => `<div><b>${t}</b><p>${d}</p></div>`).join('')}</div>
  <p class="t-nota"><a href="/legal/brindi/">Condiciones de Brindi</a> · <a href="/legal/brindi/privacidad/">Aviso de privacidad</a> · <a href="/legal/brindi/privacidad-invitados/">Privacidad para invitados</a> · <a href="/legal/reembolsos/">Reembolsos</a> · Hecha con Brindi · Powered by vorka.mx</p>
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
.br-extras{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.br-extra{background:#fff;border-radius:16px;padding:16px;display:grid;gap:6px;border:1px solid #eee7dc}.br-extra span{color:#5c4a50;font-size:14px}
.br-extra-p{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px}.br-extra-p b{color:#1f1a1d;font-size:18px}
.br-confianza{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}.br-confianza div{border-top:2px solid var(--br-vino);padding-top:10px}.br-confianza p{margin:4px 0 0;color:#5c4a50;font-size:15px}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-brindi'); if(!f||!window.fetch) return;
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(e){ var s=document.getElementById('slug'); if(!s) return; e.preventDefault(); s.value=a.dataset.plan; document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:f.slug.value, nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value;
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
