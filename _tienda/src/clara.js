// Clara (finanzas personales para jóvenes desde 15 años y para quien no entiende de tarjetas; app propia en clara.vorka.mx, Worker `clara`).
// /tienda/clara/ → ficha comercial: plan gratis con 1 tarjeta, prueba de 7 días de Pro sin tarjeta (vive en la app), planes y compra.
// Se cobra por suscripción (ver suscripciones.js): la app pregunta por RPC (Admin.suscripcionApp(correo, 'clara')) si está al corriente.
// Aquí solo se vende. Herramienta de organización y educación financiera: no es asesoría, no es banco y no mueve dinero (ver /legal/clara/).
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, navTienda, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { oferta, migas } from './seo.js';
import { resenasDe, ldResenas, seccionResenas } from './resenas.js';
import { FLECHA, CHECK } from './marco.generado.js';

const APP = 'https://clara.vorka.mx';
const GUIA_TARJETA = 'https://vorka.mx/learn/finanzas/como-funciona-una-tarjeta-de-credito/';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_CLARA = '/tienda/clara/';
// Imagen para compartir y portada (simulador/portadas_v3.py, con la captura real de la app)
export const OG_CLARA = 'https://vorka.mx/assets/tienda/v3/clara-og.jpg';
const pesosRedondo = c => '$' + (c / 100).toLocaleString('es-MX', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });
const PLANES = [{ slug: 'clara-mensual', nombre: 'Mensual', cada: 'al mes', renueva: 'cada mes' }, { slug: 'clara-anual', nombre: 'Anual', cada: 'al año', renueva: 'cada año' }];

const GRATIS = ['1 tarjeta de crédito con sus recordatorios', 'Registro de gastos e ingresos', '¿Me alcanza?', 'Resumen del mes', 'Sin tarjeta para empezar'];
const INCLUYE = ['Tarjetas ilimitadas', '¿Con cuál tarjeta pago hoy?', 'Presupuesto por categoría', 'Metas de ahorro con fecha', 'Meses anteriores', 'Exportar a Excel', 'Importar el CSV de tu banco'];
const FAQ = [
  ['¿Es gratis?', `Sí: con 1 tarjeta de crédito, Clara es gratis para siempre, con sus recordatorios, el registro de gastos e ingresos, «¿Me alcanza?» y el resumen del mes. Al entrar tienes 7 días de Pro para probar todo, sin tarjeta. Si quieres llevar más tarjetas, presupuesto o metas, Pro cuesta $49 al mes o $490 al año. Entra en <a href="${APP}/entrar">clara.vorka.mx</a> con tu correo.`],
  ['¿Se conecta a mi banco?', 'No. Clara no se conecta a tus cuentas bancarias ni a tu tarjeta: tú anotas tus movimientos a mano (o, con Pro, importas el archivo CSV que descargas de tu banco). Clara no es un banco y no mueve dinero.'],
  ['¿Qué datos de mi tarjeta pide?', 'Solo lo necesario para avisarte y hacer cuentas: un nombre para reconocerla, el banco (en texto), los días de corte y de pago, el límite, el saldo y, si quieres, los últimos 4 dígitos. <b>Nunca</b> te pide el número completo, el CVV, la fecha de vencimiento ni las contraseñas de tu banco.'],
  ['¿Me avisa en iPhone?', 'Sí, si instalas Clara en tu pantalla de inicio (desde Safari: Compartir › Agregar a inicio) y tu iPhone tiene iOS 16.4 o más reciente. En Android y en computadora basta con permitir las notificaciones. Además, siempre te llega un correo de respaldo y puedes agregar las fechas a tu calendario con un archivo .ics.'],
  ['¿Desde qué edad se puede usar?', 'Desde los 15 años. Si tienes entre 15 y 17, tu mamá, papá o tutor debe autorizar al registrarte. A menores de edad no les enviamos promociones.'],
  ['¿Es asesoría financiera?', `No. Clara es una herramienta de organización y educación financiera: te ayuda a ver tus fechas, tus gastos y tus cuentas, pero no te recomienda productos financieros ni sustituye a un asesor. Los cálculos son estimados y vienen marcados como tal; revisa siempre tu estado de cuenta. Si quieres entender lo básico, lee <a href="${GUIA_TARJETA}">cómo funciona una tarjeta de crédito</a>.`],
  ['¿Qué pasa si dejo de pagar Pro?', 'Vuelves al plan gratis. Si tienes más de 1 tarjeta, tu cuenta queda en modo consulta: ves todo, pero para registrar archiva las tarjetas que sobran o vuelve a suscribirte. Nada se borra.'],
  ['¿Cuánto cuesta y cómo pago?', 'Mensual ($49 al mes) o anual ($490 al año, 2 meses gratis). Pagas con tarjeta de crédito o débito, procesado por Stripe. Si pagas por alguien más, usa en la compra el mismo correo con el que esa persona entra a Clara.'],
  ['¿Cómo cancelo?', 'Desde Clara › Ajustes › Suscripción, en el portal de pagos de Stripe, sin llamadas. Sigues con Pro hasta el final del periodo pagado. Si pagaste el anual y cancelas dentro de los 10 días naturales siguientes al cobro, te devolvemos tu dinero completo; escríbenos a hola@vorka.mx.'],
  ['¿Cómo borro mi cuenta?', 'En Clara › Ajustes › Borrar mi cuenta. Se borra todo de inmediato: tus tarjetas, movimientos, metas y presupuesto. Antes puedes descargar tus datos en JSON, gratis. Si tienes Pro, al borrar tu cuenta se cancela solo: ya no se te vuelve a cobrar.'],
];

const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONO = {
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'), candado: ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'), reloj: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  tarjeta: ico('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'), campana: ico('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  balanza: ico('<path d="M12 4v16M7 20h10M5 8h14"/><path d="M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z"/>'), meta: ico('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'),
  grafica: ico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'), doc: ico('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
};
const V = '<svg viewBox="69 225 940 909" aria-hidden="true"><path fill="currentColor" d="M69 226H311L652 877L526 1133Z"/><path fill="currentColor" d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg>';

// Réplica de la pantalla de inicio de la app (datos de ejemplo): la tarjeta con sus fechas y lo que hay que pagar
const pantalla = `<div class="cl-cel" aria-hidden="true"><i class="cl-isla"></i><div class="cl-pant">
  <div class="cl-app-top"><span class="cl-logo">${V}</span><b>Clara</b></div>
  <div class="cl-tarj"><div class="cl-q"><span><b>Mi primera tarjeta</b><small>Terminación 4821</small></span><span class="cl-chip"></span></div>
    <small class="cl-rot">Para no pagar intereses, paga antes del 23 nov</small><b class="cl-saldo">$2,350.00</b>
    <div class="cl-uso"><i style="width:39%"></i></div><small class="cl-ley">Usas $2,350 de $6,000 de límite</small></div>
  <div class="cl-rap">${['Anotar gasto', '¿Me alcanza?', 'Mi mes'].map((t, i) => `<span><i class="${i ? '' : 'pri'}"></i>${t}</span>`).join('')}</div>
  <div class="cl-movs">${[['Corte de tu tarjeta', 'En 3 días · 3 nov', 'Aviso'], ['Comida con amigos', 'Ayer · Tarjeta', '−$280.00'], ['Pago de la semana', 'Lunes · Ingreso', '+$900.00']].map(([a, b, c]) => `<div><i></i><span><b>${a}</b><small>${b}</small></span><em>${c}</em></div>`).join('')}</div>
</div></div>`;

export async function paginaClara(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug) })))).filter(x => x.prod);
  const mensual = planes.find(x => x.slug === 'clara-mensual'), anual = planes.find(x => x.slug === 'clara-anual');
  const plan = mensual?.prod || planes[0]?.prod || null;
  const ahorro = mensual && anual ? mensual.prod.precio_centavos * 12 - anual.prod.precio_centavos : 0;
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : (planes[0]?.slug || '');
  const elegidoP = planes.find(x => x.slug === elegido);
  if (plan && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: plan.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  // Desde la app (Suscribirme) llega el correo de la cuenta para que la suscripción quede ligada a ella
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const rs = planes.length ? await resenasDe(env, RUTA_CLARA) : null;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Clara · Finanzas personales para jóvenes', brand: { '@type': 'Brand', name: 'Vorka México' }, image: ['https://vorka.mx/assets/tienda/v3/clara-portada.webp', OG_CLARA],
    description: 'Tus tarjetas de crédito y tu dinero claros: recordatorios del corte y del pago, ¿Me alcanza?, presupuesto y metas de ahorro. Gratis con 1 tarjeta.',
    ...(planes.length ? { offers: planes.map(x => oferta({ ruta: RUTA_CLARA, centavos: x.prod.precio_centavos, name: `Clara Pro · plan ${x.nombre.toLowerCase()}` })), ...ldResenas(rs) } : {}) },
  migas('Clara', RUTA_CLARA),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  return pagina({ navActual: 'catalogo', navOscuro: true, entrar: { url: `${APP}/`, app: 'Clara' },
    titulo: 'Clara: tus tarjetas y tu dinero claros | Gratis con 1 tarjeta', ruta: RUTA_CLARA, imagen: OG_CLARA,
    descripcion: 'Recordatorios del corte y del pago de tu tarjeta, registro de gastos, ¿Me alcanza? y resumen del mes. Gratis con 1 tarjeta, desde 15 años. Pro desde $49 al mes.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="cl">
<section class="cl-hero"><div class="marco cl-hero-g">
  <div>
    <span class="cl-marca"><span class="cl-logo grande">${V}</span>Clara <small>by Vorka</small></span>
    <h1 class="cl-h1">Tu dinero, <em>claro desde el principio.</em></h1>
    <p class="cl-lead">Clara te avisa cuándo es el corte y hasta cuándo pagar tu tarjeta para no pagar intereses, lleva tus gastos e ingresos y te dice si te alcanza antes de comprar. Para quien empieza con su primera tarjeta o nunca le entendió.</p>
    <div class="cl-ctas"><a class="cl-btn" href="${APP}/entrar">Empieza gratis ${FLECHA}</a><a class="cl-btn ghost" href="#planes">Ver precio</a></div>
    <p class="t-ya">¿Ya tienes cuenta? <a href="${APP}/">Entra aquí</a></p>
    <ul class="cl-chips"><li>${ICONO.check}Gratis con 1 tarjeta</li><li>${ICONO.candado}Nunca pide el número de tu tarjeta</li><li>${ICONO.reloj}7 días de Pro sin tarjeta</li></ul>
  </div>
  <div class="cl-escena">${pantalla}</div>
</div>
${navTienda('clara')}
</section>

<section class="cl-sec"><div class="marco">
  <div class="cl-cab"><span class="cl-et">Cómo funciona</span><h2>¿Cuándo es el corte? ¿Cuánto tengo que pagar?</h2><p>Una tarjeta de crédito es útil si sabes dos fechas y pagas a tiempo. Clara te las recuerda y te explica cada número. Si quieres entender lo básico primero, lee <a href="${GUIA_TARJETA}">cómo funciona una tarjeta de crédito</a>.</p></div>
  <ol class="cl-pasos">${[['Agrega tu tarjeta', 'Un nombre, el banco, el día de corte y el día de pago. Nada de números completos ni contraseñas.'], ['Anota lo que gastas', 'Gastos e ingresos en segundos, con efectivo, débito o tarjeta.'],
    ['Recibe tus avisos', 'Antes del corte y antes de la fecha de pago, en tu celular y por correo.'], ['Revisa tu mes', 'Cuánto entró, cuánto salió y en qué se fue, en un resumen claro.']].map(([t, d], k) => `<li><span class="cl-num">0${k + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
</div></section>

<section class="cl-sec cl-osc"><div class="marco cl-dos">
  <div class="cl-cab izq"><span class="cl-et">Recordatorios</span><h2>Que no se te pase la fecha.</h2><p>Te avisamos en el celular y te mandamos un correo de respaldo. En iPhone, los avisos llegan si instalas Clara en tu pantalla de inicio (iOS 16.4 o más reciente). También puedes agregar las fechas a tu calendario con un archivo .ics.</p></div>
  <ol class="cl-linea-t" aria-label="Cuándo te avisa Clara">${[['Día del corte', 'Tu tarjeta cerró el periodo: ya sabes cuánto vas a pagar.'], ['5 días antes del pago', 'Tiempo para juntar lo que falta.'], ['1 día antes del pago', 'Último aviso para no pagar intereses.'], ['Día de pago', 'Hoy es el día. Anota tu pago y listo.']]
    .map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
</div></section>

<section class="cl-sec"><div class="marco">
  <div class="cl-cab"><span class="cl-et">Lo que incluye</span><h2>Lo básico gratis. Lo demás con Pro.</h2></div>
  <ul class="cl-ben">${[[ICONO.tarjeta, 'Tu tarjeta en orden', 'Fechas de corte y de pago, límite y saldo, con avisos a tiempo. Gratis con 1 tarjeta; ilimitadas con Pro.'],
    [ICONO.balanza, '¿Me alcanza?', 'Lo que tienes, menos los pagos de tus tarjetas que caen antes de tu próximo ingreso. Así sabes si te alcanza antes de comprar.'],
    [ICONO.grafica, 'Resumen del mes', 'Cuánto entró, cuánto salió y en qué se fue. Con Pro, también tus meses anteriores.'],
    [ICONO.campana, '¿Con cuál tarjeta pago hoy?', 'Con Pro y varias tarjetas, te dice con cuál tienes más días para pagar lo que compres hoy, y te avisa si te acercas a tu límite.'],
    [ICONO.meta, 'Presupuesto y metas', 'Con Pro: un tope por categoría y metas de ahorro con fecha para saber cuánto apartar.'],
    [ICONO.doc, 'Excel y CSV', 'Con Pro: exporta todo a Excel e importa el archivo CSV de movimientos de tu banco.']].map(([i, t, d]) => `<li>${i}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
  <p class="cl-aviso">Clara <b>nunca pide</b> el número completo de tu tarjeta, el CVV, la fecha de vencimiento ni las contraseñas de tu banco, y <b>no se conecta</b> a tus cuentas: tus movimientos los anotas tú. Es una herramienta de organización y educación financiera: <b>no es asesoría financiera, no es un banco y no mueve dinero</b>. Los cálculos son estimados; revisa siempre tu estado de cuenta.</p>
</div></section>

<section class="cl-sec suave" id="planes"><div class="marco">
  <div class="cl-cab"><span class="cl-et">Precio</span><h2>Gratis con 1 tarjeta. Pro si quieres más.</h2><p>En pesos mexicanos con IVA incluido. Desde 15 años; de 15 a 17, con autorización de tu mamá, papá o tutor.</p></div>
  <div class="cl-planes">
    <article class="cl-plan"><h3>Gratis</h3><p class="cl-para">Para empezar con tu primera tarjeta</p><p class="cl-precio"><b>$0</b> <small>para siempre</small></p>
      <ul>${GRATIS.map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
      <a class="cl-btn ghost oscuro" href="${APP}/entrar">Empezar gratis</a></article>
    ${planes.map(x => `<article class="cl-plan${x.slug === 'clara-mensual' ? ' rec' : ''}">${x.slug === 'clara-anual' && ahorro > 0 ? `<span class="cl-sello">2 meses gratis</span>` : ''}<h3>Pro ${x.nombre.toLowerCase()}</h3><p class="cl-para">Todo lo gratis, y además</p><p class="cl-precio"><b>${precio(x.prod)}</b> <small>${x.cada}</small></p>
      ${x.slug === 'clara-anual' ? `<p class="cl-para" style="margin-top:-4px">Ahorras ${pesosRedondo(ahorro)} contra pagar 12 meses, en un solo pago</p>` : ''}
      <ul>${(x.slug === 'clara-anual' ? ['Todo lo de Pro mensual', 'Un solo pago al año', 'Si cancelas en los primeros 10 días, te devolvemos todo'] : INCLUYE).map(i => `<li>${CHECK}<span>${i}</span></li>`).join('')}</ul>
      <a class="cl-btn${x.slug === 'clara-mensual' ? '' : ' ghost oscuro'}" href="?plan=${x.slug}#comprar" data-ir="comprar" data-plan="${x.slug}">Suscribirme</a></article>`).join('')}
  </div>
  ${plan ? '' : `<p class="cl-nota" style="text-align:center">Clara Pro abre muy pronto. Mientras, <a href="${APP}/entrar">empieza gratis</a>: al entrar tienes 7 días de Pro sin tarjeta.</p>`}
</div></section>

${plan ? seccionCompra({ titulo: 'Suscríbete a Clara Pro', intro: `¿Aún no la pruebas? <a href="${APP}/entrar">Empieza gratis</a> y ten 7 días de Pro, sin tarjeta. Si ya la usas, suscríbete con el mismo correo y todo sigue tal cual. <b>Si pagas por alguien más (por ejemplo, tu hijo), usa en la compra el mismo correo con el que esa persona entra a Clara.</b>`,
  pasos: [['Elige mensual o anual', 'Y escribe el correo con el que se entra a Clara.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Sigues donde estabas', 'Pro queda activo al instante, con todos tus registros.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por correo'],
  form: `<form class="t-form t-compra" id="form-clara" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <fieldset class="t-campo cl-elige"><legend>Plan</legend>${planes.map(x => `<label class="cl-op"><input type="radio" name="slug" value="${x.slug}"${x.slug === elegido ? ' checked' : ''}><span><b>Pro ${x.nombre.toLowerCase()} · ${precio(x.prod)} ${x.cada}</b>${x.slug === 'clara-anual' && ahorro > 0 ? `<small>2 meses gratis: ahorras ${pesosRedondo(ahorro)}</small>` : '<small>Sin plazo forzoso</small>'}</span></label>`).join('')}</fieldset>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">El mismo correo con el que se entra a Clara. Si pagas por alguien más, usa el suyo.</small></div>
    <p class="cl-total">Pagas hoy <b id="cl-hoy">${precio(elegidoP.prod)}</b> <span id="cl-luego">y luego ${precio(elegidoP.prod)} ${elegidoP.renueva}</span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/clara/" target="_blank">condiciones de Clara</a> (incluida la renovación automática) y el <a href="/legal/clara/privacidad/" target="_blank">aviso de privacidad de Clara</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="cl-precios">${JSON.stringify(Object.fromEntries(planes.map(x => [x.slug, { p: precio(x.prod), c: x.prod.precio_centavos, renueva: x.renueva }]))).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionResenas(rs)}
${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/clara/">Condiciones de Clara</a> · <a href="/legal/clara/privacidad/">Aviso de privacidad</a> · Clara · by Vorka México</p>' })}
${await masTienda(env, 'finanzas')}
</div>`,
  });
}

const CSS = `
.cl{--cl-tinta:#0b1412;--cl-verde:#0d5c4f;--cl-verde-c:#6cc7ab;--cl-h1:#08413a;--cl-h2:#0d5c4f;--cl-h3:#2f8f76;--cl-crema:#f5f4ef}
[data-tema="oscuro"] .cl{--cl-verde:#6cc7ab}
.cl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--cl-verde);color:#fff;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 12px 28px -12px rgba(13,92,79,.7);transition:transform .2s var(--ease),background .2s}
.cl-btn:hover{transform:translateY(-1px)}.cl-btn svg{width:17px;height:17px}
.cl-hero .cl-btn:not(.ghost){background:#fff;color:var(--cl-h1)}
.cl-btn.ghost{background:rgba(255,255,255,.08);color:var(--cl-crema);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}.cl-btn.ghost:hover{background:rgba(255,255,255,.14)}
.cl-btn.ghost.oscuro{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--line-2)}.cl-btn.ghost.oscuro:hover{box-shadow:inset 0 0 0 1.5px var(--fg)}
/* portada */
.cl-hero{position:relative;isolation:isolate;overflow:hidden;margin-top:-104px;padding:140px 0 26px;color:var(--cl-crema);
  background:radial-gradient(60% 80% at 85% 20%,var(--cl-h3) 0%,transparent 60%),linear-gradient(150deg,var(--cl-h1),var(--cl-h2))}
.cl-hero::after{content:"";position:absolute;right:-6%;bottom:-18%;width:min(60vw,640px);aspect-ratio:1;opacity:.1;z-index:-1;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='69 225 940 909'%3E%3Cpath fill='%23fff' d='M69 226H311L652 877L526 1133Z'/%3E%3Cpath fill='%23fff' d='M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z'/%3E%3C/svg%3E") no-repeat center/contain}
.cl-hero-g{display:grid;gap:40px;align-items:center;padding-bottom:30px}.cl-hero-g>*{min-width:0}
@media(min-width:960px){.cl-hero-g{grid-template-columns:1.1fr .9fr}}
.cl-marca{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:22px;letter-spacing:-.03em}.cl-marca small{font-weight:500;font-size:14px;opacity:.7;letter-spacing:0}
.cl-logo{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--cl-verde);color:#fff}.cl-logo svg{width:15px;height:15px}
.cl-logo.grande{width:40px;height:40px;border-radius:12px;background:#fff;color:var(--cl-h1)}.cl-logo.grande svg{width:21px;height:21px}
.cl-h1{font-weight:800;font-size:clamp(42px,6.4vw,78px);line-height:.98;letter-spacing:-.05em;margin:26px 0 0;max-width:12ch;text-wrap:balance}.cl-h1 em{font-style:normal;color:#c9efe2}
.cl-lead{margin-top:20px;font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:#fff;max-width:34em}
.cl-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.cl-chips{list-style:none;padding:0;margin:26px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14.5px;color:rgba(245,244,239,.8)}
.cl-chips li{display:inline-flex;align-items:center;gap:7px}.cl-chips svg{width:18px;height:18px;color:#c9efe2}
.cl-hero .t-nav-tienda{margin-top:8px}.cl-hero .t-nav-tienda a{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#F5F4EF}.cl-hero .t-nav-tienda a[aria-current]{background:#fff;border-color:#fff;color:var(--cl-h1)}
.cl-hero>.t-nav-tienda{width:min(100% - 32px,1180px);margin:0 auto}
/* el celular con la app */
.cl-escena{justify-self:center;width:min(100%,340px);padding:10px 0 30px}
.cl-cel{position:relative;padding:12px;border-radius:52px;background:#0f1715;box-shadow:0 40px 80px -30px rgba(0,0,0,.6),inset 0 0 0 1.5px rgba(255,255,255,.12)}
.cl-isla{position:absolute;top:24px;left:50%;width:90px;height:26px;border-radius:20px;background:#000;transform:translateX(-50%);z-index:2}
.cl-pant{border-radius:41px;overflow:hidden;background:#0d1211;padding:58px 14px 18px;color:#eef3f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.cl-app-top{display:flex;align-items:center;gap:8px;font-size:15px;margin:0 2px 12px}
.cl-tarj{position:relative;overflow:hidden;border-radius:22px;padding:16px;background:radial-gradient(120% 140% at 100% 0%,var(--cl-h3),transparent 55%),linear-gradient(135deg,#06302a,#0d5c4f)}
.cl-q{display:flex;justify-content:space-between;gap:10px;align-items:center}.cl-q b{display:block;font-size:14.5px}.cl-q small{display:block;font-size:11.5px;opacity:.75}
.cl-chip{width:34px;height:26px;border-radius:6px;background:linear-gradient(135deg,#e6cf96,#a8853f)}
.cl-rot{display:block;margin-top:16px;font-size:12px;opacity:.85}.cl-saldo{display:block;font-size:31px;letter-spacing:-.045em;font-weight:800;margin-top:2px}
.cl-uso{height:6px;border-radius:3px;background:rgba(255,255,255,.2);margin-top:14px;overflow:hidden}.cl-uso i{display:block;height:100%;background:#fff;border-radius:3px}
.cl-ley{display:block;font-size:10.5px;opacity:.8;margin-top:7px}
.cl-rap{display:flex;justify-content:space-around;margin:16px 0 12px;font-size:10.5px;font-weight:600;text-align:center}
.cl-rap span{display:flex;flex-direction:column;align-items:center;gap:6px;width:76px}.cl-rap i{width:42px;height:42px;border-radius:50%;background:#18201e}.cl-rap i.pri{background:#3fa98c}
.cl-movs{border-radius:18px;background:#141b19;padding:2px 12px}.cl-movs div{display:flex;align-items:center;gap:10px;padding:10px 0}.cl-movs div+div{border-top:1px solid #222b28}
.cl-movs i{width:30px;height:30px;border-radius:50%;background:#17302a;flex:none}.cl-movs span{flex:1;min-width:0}.cl-movs b{display:block;font-size:12.5px}.cl-movs small{display:block;font-size:10.5px;color:#9aa6a2}.cl-movs em{font-style:normal;font-size:12.5px;font-weight:700;color:#6cc7ab}
/* secciones */
.cl-sec{padding:clamp(56px,8vw,104px) 0}.cl-sec.suave{background:var(--bg-2)}
.cl-osc{background:var(--cl-tinta);color:var(--cl-crema)}
.cl-cab{max-width:700px;margin:0 auto 38px;text-align:center}.cl-cab.izq{text-align:left;margin:0}
.cl-cab a{color:inherit;text-decoration:underline;text-underline-offset:3px}
.cl-et{display:inline-flex;align-items:center;gap:10px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--cl-verde)}.cl-osc .cl-et{color:var(--cl-verde-c)}
.cl-et::before{content:"";width:4px;height:14px;border-radius:1px;background:currentColor;transform:skewX(-28deg)}
.cl-cab h2{font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.03;letter-spacing:-.045em;margin:10px 0 0;text-wrap:balance}
.cl-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}.cl-osc .cl-cab p{color:rgba(245,244,239,.76)}
.cl-pasos{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.cl-pasos li{padding:24px;border-radius:24px;background:var(--card);border:1px solid var(--line)}
.cl-num{display:block;font-weight:800;font-size:15px;color:var(--cl-verde);letter-spacing:.04em}.cl-pasos b{display:block;font-size:20px;letter-spacing:-.02em;margin-top:18px}.cl-pasos p{margin:6px 0 0;color:var(--fg-2);line-height:1.5}
.cl-dos{display:grid;gap:40px;align-items:center}@media(min-width:980px){.cl-dos{grid-template-columns:1fr 1fr}}
.cl-linea-t{list-style:none;margin:0;padding:24px;border-radius:26px;background:#121c19;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);display:grid;gap:4px}
.cl-linea-t li{position:relative;padding:12px 0 12px 28px}.cl-linea-t li+li{border-top:1px solid rgba(255,255,255,.08)}
.cl-linea-t li::before{content:"";position:absolute;left:4px;top:18px;width:10px;height:10px;border-radius:50%;background:var(--cl-verde-c)}
.cl-linea-t b{display:block;font-size:17px}.cl-linea-t span{display:block;margin-top:2px;font-size:14.5px;color:rgba(245,244,239,.7)}
.cl-ben{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.cl-ben li{padding:22px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.cl-ben svg{width:42px;height:42px;padding:10px;border-radius:50%;background:color-mix(in srgb,var(--cl-verde) 12%,transparent);color:var(--cl-verde)}
.cl-ben b{display:block;font-size:17.5px;letter-spacing:-.015em;margin-top:12px}.cl-ben p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
.cl-aviso{max-width:760px;margin:28px auto 0;text-align:center;color:var(--fg-2);font-size:15px;line-height:1.55}
/* precio */
.cl-planes{display:grid;gap:18px;align-items:start;max-width:1120px;margin:0 auto;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr))}
.cl-plan{position:relative;background:var(--card);border:1.5px solid var(--line);border-radius:28px;padding:28px;display:grid;gap:8px}
.cl-sello{position:absolute;top:-13px;left:24px;background:linear-gradient(100deg,#a8853f,#c8a45c 55%,#e6cf96);color:#1b1408;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px}
.cl-elige{border:0;padding:0;margin:0 0 6px}.cl-elige legend{font-weight:650;font-size:14px;margin-bottom:8px;padding:0}
.cl-op{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);margin-bottom:8px;cursor:pointer}
.cl-op input{margin-top:3px;accent-color:var(--cl-verde)}.cl-op b{display:block;font-size:15px}.cl-op small{display:block;color:var(--fg-2);font-size:13px;margin-top:2px}
.cl-op:has(input:checked){border-color:var(--cl-verde);background:color-mix(in srgb,var(--cl-verde) 7%,transparent)}
.cl-plan.rec{border-color:var(--cl-verde);box-shadow:0 30px 60px -36px rgba(13,92,79,.55)}
.cl-plan h3{font-weight:800;font-size:26px;letter-spacing:-.035em;margin:4px 0 0}.cl-para{color:var(--fg-2);margin:0}
.cl-precio{margin:6px 0 0}.cl-precio b{font-size:40px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.cl-precio small{color:var(--fg-2)}
.cl-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:8px}.cl-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.cl-plan li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--cl-verde)}
.cl-nota{color:var(--fg-2);font-size:15px;margin-top:14px}
.cl-total{margin:4px 0 12px;font-size:16px}.cl-total b{font-size:20px;font-variant-numeric:tabular-nums}
.cl #form-clara .btn.acento{background:var(--cl-verde);color:#fff;box-shadow:0 12px 28px -12px rgba(13,92,79,.7)}
/* en oscuro el verde se aclara: el texto del botón pasa a tinta oscura para seguir en ≥ 4.5:1 */
[data-tema="oscuro"] .cl #form-clara .btn.acento{color:#06120f}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-clara'); if(!f||!window.fetch) return;
  var P={}; try{ P=JSON.parse(document.getElementById('cl-precios').textContent); }catch(e){}
  function elegido(){ var r=f.querySelector('input[name=slug]:checked'); return r?r.value:''; }
  function pinta(){ var x=P[elegido()]; if(!x) return; var fr=VD.frase(x.c,x.renueva); document.getElementById('cl-hoy').textContent=fr.hoy; document.getElementById('cl-luego').textContent=fr.luego; }
  document.addEventListener('vorka:descuento',pinta);
  f.querySelectorAll('input[name=slug]').forEach(function(r){ r.addEventListener('change',pinta); }); pinta();
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(){ var r=f.querySelector('input[name=slug][value="'+a.dataset.plan+'"]'); if(r){ r.checked=true; pinta(); } }); });
  document.querySelectorAll('[data-ir]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:elegido(), sucursales:0, nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value) d.codigo=f.codigo.value.trim();
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
