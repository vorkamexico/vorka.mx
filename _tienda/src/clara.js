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
// Imagen para compartir y portada: hechas con el diseño final de la app (blanco, tinta y un solo azul) y copiadas a
// assets/tienda/v3/ con estos nombres fijos (la D1 también los usa). Ya no salen de simulador/portadas_v3.py.
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
// La V de Clara: trazo largo en tinta y el corto en azul (como en la app)
const V = '<svg viewBox="69 225 940 909" aria-hidden="true"><path fill="currentColor" d="M69 226H311L652 877L526 1133Z"/><path class="cl-v2" d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg>';
const icoApp = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const APPICO = {
  cal: icoApp('<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4M12 13v4M10 15h4"/>'), comida: icoApp('<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 21V3c-2 1.5-3 4-3 7h3"/>'),
  casa: icoApp('<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10M10 20v-5h4v5"/>'), tarjetas: icoApp('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'),
  lista: icoApp('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'), mes: icoApp('<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  sol: icoApp('<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
};

// Réplica de la pantalla «Hoy» de la app (datos de ejemplo): cuánto te alcanza al día, el próximo pago y lo último que anotaste.
// Sigue el tema de la página (claro u oscuro), igual que la app.
const pantalla = `<div class="cl-cel" aria-hidden="true"><div class="cl-pant">
  <div class="cl-app-top"><span class="cl-v">${V}</span><b>Clara</b><small>by Vorka</small><span class="cl-sol">${APPICO.sol}</span></div>
  <p class="cl-hola"><b>Hola, Ana</b></p>
  <div class="cl-prueba"><span>Prueba de Clara Pro: te quedan 7 días</span><em>Ver</em></div>
  <div class="cl-caja cl-alc"><small>Te alcanzan</small><p><b>$133</b> al día</p><small>hasta el 15 de noviembre · 14 días</small><em>Ver cómo se calcula</em></div>
  <div class="cl-caja cl-prox"><div class="cl-prox-f"><i class="cl-ic">${APPICO.cal}</i><span><small>Próximo pago · La del súper</small><b>15 de noviembre</b></span><b class="cl-monto">$900.00</b></div>
    <div class="cl-prox-b"><span class="pri">Anotar pago</span><span>Ver detalle</span></div></div>
  <div class="cl-ult"><b>Lo último</b><em>Ver todos</em></div>
  <div class="cl-caja cl-movs">${[[APPICO.comida, 'Tacos', 'Comida · Efectivo · Hoy', '−$150.00'], [APPICO.casa, 'Luz', 'Casa y servicios · Efectivo', '−$420.00']].map(([i, a, b, c]) => `<div><i class="cl-ic ${a === 'Luz' ? 'casa' : 'sale'}">${i}</i><span><b>${a}</b><small>${b}</small></span><em>${c}</em></div>`).join('')}</div>
  <div class="cl-acc"><span class="gasto"><i>−</i>Gasto</span><span class="ingreso"><i>+</i>Ingreso</span></div>
  <div class="cl-tabs">${[['casa', 'Hoy'], ['tarjetas', 'Tarjetas'], ['lista', 'Movimientos'], ['mes', 'Mes']].map(([i, t], k) => `<span${k ? '' : ' class="act"'}><i>${APPICO[i]}</i>${t}</span>`).join('')}</div>
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
  return pagina({ navActual: 'catalogo', entrar: { url: `${APP}/`, app: 'Clara' },
    titulo: 'Clara: tus tarjetas y tu dinero claros | Gratis con 1 tarjeta', ruta: RUTA_CLARA, imagen: OG_CLARA,
    descripcion: 'Recordatorios del corte y del pago de tu tarjeta, registro de gastos, ¿Me alcanza? y resumen del mes. Gratis con 1 tarjeta, desde 15 años. Pro desde $49 al mes.',
    head: `<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="cl">
<section class="cl-hero"><div class="marco cl-hero-g">
  <div>
    <span class="cl-marca"><span class="cl-v grande">${V}</span>Clara <small>by Vorka</small></span>
    <h1 class="cl-h1">Tu dinero, claro. Anota todo <em>en segundos.</em></h1>
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
/* Clara: blanco primero, tinta para el texto y UN azul para lo que se toca. Verde y coral solo para dinero que entra o sale;
   ámbar solo para lo que pide atención. En oscuro sigue a las superficies de la tienda. */
.cl{--cl-fondo:#fff;--cl-sup:#F2F4F7;--cl-borde:#E6E9EE;--cl-tinta:#16181D;--cl-suave:#5B616E;--cl-azul:#1F5FD6;--cl-azul-s:#E8EFFD;--cl-azul-t:#1A50B8;--cl-sobre-azul:#fff;
  --cl-verde:#16803C;--cl-verde-s:#E6F4EA;--cl-rojo:#B3261E;--cl-rojo-s:#FCE8E6;--cl-ambar:#F2A900;--cl-ambar-s:#FEF3D6;
  --cl-p-fondo:#fff;--cl-p-caja:#fff;--cl-p-sup:#F2F4F7;--cl-p-borde:#E6E9EE;--cl-p-tinta:#16181D;--cl-p-suave:#5B616E}
[data-tema="oscuro"] .cl{--cl-fondo:var(--bg);--cl-sup:var(--bg-2);--cl-borde:var(--line);--cl-tinta:var(--fg);--cl-suave:var(--fg-2);--cl-azul:#8DB2F7;--cl-azul-s:rgba(141,178,247,.14);--cl-azul-t:#8DB2F7;--cl-sobre-azul:#0E1A33;
  --cl-verde:#6FD39B;--cl-verde-s:rgba(111,211,155,.13);--cl-rojo:#FF9A8F;--cl-rojo-s:rgba(255,138,128,.14);--cl-ambar-s:rgba(242,169,0,.16);
  --cl-p-fondo:#131416;--cl-p-caja:#1E2024;--cl-p-sup:#26292E;--cl-p-borde:#2C2F35;--cl-p-tinta:#F1F2F4;--cl-p-suave:#A7ACB5}
.cl{--morado:var(--cl-azul-t);--morado-suave:var(--cl-azul-s)}
.cl-v2{fill:var(--cl-azul)}
/* secciones compartidas de la tienda (compra, preguntas, más productos) con las superficies de Clara */
.cl .t-sec{background:var(--cl-fondo)}.cl .t-sec.suave{background:var(--cl-sup)}
/* en esta página «Entrar» va en tinta (sin el dorado de la tienda) para no sumar otro color junto al azul */
.nav.t-navs .t-pastilla.t-entrar{background:#16181D;color:#fff;box-shadow:none}
[data-tema="oscuro"] .nav.t-navs .t-pastilla.t-entrar{background:#F1F2F4;color:#16181D}
.cl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--cl-azul);color:var(--cl-sobre-azul);font-weight:700;font-size:16px;text-decoration:none;transition:transform .2s var(--ease),background .2s,box-shadow .2s}
.cl-btn:hover{transform:translateY(-1px);background:color-mix(in srgb,var(--cl-azul) 88%,#000)}.cl-btn svg{width:17px;height:17px}
[data-tema="oscuro"] .cl-btn:hover{background:color-mix(in srgb,var(--cl-azul) 88%,#fff)}
.cl-btn.ghost{background:transparent;color:var(--cl-tinta);box-shadow:inset 0 0 0 1.5px var(--cl-borde)}.cl-btn.ghost:hover{background:transparent;box-shadow:inset 0 0 0 1.5px var(--cl-tinta)}
/* portada: blanca, tipografía en tinta y el celular sobre una superficie gris suave */
.cl-hero{position:relative;margin-top:-104px;padding:140px 0 26px;background:var(--cl-fondo);color:var(--cl-tinta)}
.cl-hero-g{display:grid;gap:36px;align-items:center;padding-bottom:30px}.cl-hero-g>*{min-width:0}
@media(min-width:960px){.cl-hero-g{grid-template-columns:1.08fr .92fr}}
.cl-marca{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:22px;letter-spacing:-.03em}.cl-marca small{font-weight:500;font-size:14px;color:var(--cl-suave);letter-spacing:0}
.cl-v{display:inline-block;width:22px;height:21px;color:var(--cl-tinta);flex:none}.cl-v svg{display:block;width:100%;height:100%}.cl-v.grande{width:32px;height:31px}
.cl-h1{font-weight:800;font-size:clamp(40px,6vw,74px);line-height:1;letter-spacing:-.05em;margin:24px 0 0;max-width:13ch;text-wrap:balance}.cl-h1 em{font-style:normal;color:var(--cl-azul)}
.cl-lead{margin-top:20px;font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:var(--cl-suave);max-width:34em}
.cl-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.cl-hero .t-ya{color:var(--cl-suave);opacity:1}.cl-hero .t-ya a{color:var(--cl-azul-t)}
.cl-chips{list-style:none;padding:0;margin:26px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14.5px;color:var(--cl-suave)}
.cl-chips li{display:inline-flex;align-items:center;gap:7px}.cl-chips svg{width:18px;height:18px;color:var(--cl-tinta)}
.cl-hero .t-nav-tienda{margin-top:8px}
.cl-hero>.t-nav-tienda{width:min(100% - 32px,1180px);margin:0 auto}
/* el celular con la pantalla «Hoy» */
.cl-escena{display:grid;place-items:center;padding:34px 16px;border-radius:32px;background:var(--cl-sup)}
.cl-cel{width:min(100%,318px);padding:9px;border-radius:46px;background:#16181D;box-shadow:0 40px 70px -40px rgba(22,24,29,.45),inset 0 0 0 1.5px rgba(255,255,255,.08)}
[data-tema="oscuro"] .cl-cel{background:#0A0B0D;box-shadow:0 40px 70px -40px rgba(0,0,0,.8),inset 0 0 0 1.5px rgba(255,255,255,.1)}
.cl-pant{border-radius:38px;overflow:hidden;background:var(--cl-p-fondo);padding:22px 12px 0;color:var(--cl-p-tinta);font-family:Figtree,Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;line-height:1.3}
.cl-pant b{font-weight:700}.cl-pant em{font-style:normal;color:var(--cl-azul-t);font-weight:600}
.cl-app-top{display:flex;align-items:center;gap:6px;margin:0 4px 12px}.cl-app-top .cl-v{width:17px;height:16px;color:var(--cl-p-tinta)}.cl-app-top b{font-size:15px;letter-spacing:-.02em}.cl-app-top small{font-size:10px;color:var(--cl-p-suave)}
.cl-sol{margin-left:auto;width:16px;height:16px;color:var(--cl-p-suave)}.cl-sol svg{width:100%;height:100%}
.cl-hola{margin:0 4px 9px;font-size:11.5px}
.cl-prueba{display:flex;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:12px;background:var(--cl-p-sup);font-size:10.5px}
.cl-caja{margin-top:8px;border-radius:16px;background:var(--cl-p-caja);border:1px solid var(--cl-p-borde)}
.cl-alc{padding:12px 14px;display:grid;gap:2px}.cl-alc small{color:var(--cl-p-suave);font-size:10.5px}.cl-alc p{margin:0;font-size:12px;color:var(--cl-p-suave);font-weight:600}
.cl-alc p b{font-size:34px;letter-spacing:-.045em;color:var(--cl-p-tinta);font-weight:800;line-height:1.05;font-variant-numeric:tabular-nums}.cl-alc em{margin-top:6px;font-size:11px}
.cl-prox{padding:11px 12px}.cl-prox-f{display:flex;align-items:center;gap:9px}.cl-prox-f span{flex:1;min-width:0}.cl-prox-f small{display:block;color:var(--cl-p-suave);font-size:9.5px}.cl-prox-f span b{display:block;font-size:12.5px}
.cl-monto{font-size:12.5px;font-variant-numeric:tabular-nums}
.cl-ic{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--cl-p-sup);color:var(--cl-p-tinta)}.cl-ic svg{width:15px;height:15px}
.cl-ic.sale{background:var(--cl-rojo-s);color:var(--cl-rojo)}
.cl-prox-b{display:flex;gap:6px;margin-top:9px}.cl-prox-b span{padding:6px 12px;border-radius:999px;background:var(--cl-p-sup);font-weight:700;font-size:10.5px}
.cl-prox-b .pri{background:var(--cl-azul);color:var(--cl-sobre-azul)}
.cl-ult{display:flex;justify-content:space-between;align-items:baseline;margin:13px 4px 0;font-size:12.5px}.cl-ult em{font-size:10.5px}
.cl-movs{padding:0 12px}.cl-movs div{display:flex;align-items:center;gap:9px;padding:9px 0}.cl-movs div+div{border-top:1px solid var(--cl-p-borde)}
.cl-movs span{flex:1;min-width:0}.cl-movs span b{display:block;font-size:12px}.cl-movs small{display:block;font-size:9.5px;color:var(--cl-p-suave);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cl-movs div>em{color:var(--cl-rojo);font-weight:700;font-size:12px;font-variant-numeric:tabular-nums}
.cl-acc{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.cl-acc span{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 0;border-radius:999px;font-weight:700;font-size:12px;border:1px solid var(--cl-p-borde);background:var(--cl-p-sup)}
.cl-acc i{font-style:normal;font-size:18px;line-height:1;font-weight:500}.cl-acc .gasto i{color:var(--cl-rojo)}
.cl-acc .ingreso{background:var(--cl-verde-s);border-color:color-mix(in srgb,var(--cl-verde) 30%,transparent);color:var(--cl-verde)}
.cl-tabs{display:grid;grid-template-columns:repeat(4,1fr);margin:10px -12px 0;padding:7px 4px 14px;border-top:1px solid var(--cl-p-borde);font-size:9px;color:var(--cl-p-suave);text-align:center}
.cl-tabs span{display:grid;justify-items:center;gap:3px}.cl-tabs i{display:grid;place-items:center;width:38px;height:22px;border-radius:999px}.cl-tabs svg{width:15px;height:15px}
.cl-tabs .act{color:var(--cl-p-tinta);font-weight:700}.cl-tabs .act i{background:var(--cl-azul-s);color:var(--cl-azul)}
/* secciones */
.cl-sec{padding:clamp(56px,8vw,104px) 0;background:var(--cl-fondo)}.cl-sec.suave,.cl-osc{background:var(--cl-sup)}
.cl-cab{max-width:700px;margin:0 auto 38px;text-align:center}.cl-cab.izq{text-align:left;margin:0}
.cl-cab a{color:var(--cl-azul-t);text-decoration:underline;text-underline-offset:3px}
.cl-et{display:inline-flex;align-items:center;gap:10px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--cl-suave)}
.cl-et::before{content:"";width:4px;height:14px;border-radius:1px;background:var(--cl-azul);transform:skewX(-28deg)}
.cl-cab h2{font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.03;letter-spacing:-.045em;margin:10px 0 0;text-wrap:balance;color:var(--cl-tinta)}
.cl-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--cl-suave)}
.cl-pasos{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.cl-pasos li{padding:24px;border-radius:24px;background:var(--card);border:1px solid var(--cl-borde)}
.cl-num{display:block;font-weight:700;font-size:15px;color:var(--cl-suave);letter-spacing:.04em;font-variant-numeric:tabular-nums}.cl-pasos b{display:block;font-size:20px;letter-spacing:-.02em;margin-top:18px}.cl-pasos p{margin:6px 0 0;color:var(--cl-suave);line-height:1.5}
.cl-dos{display:grid;gap:40px;align-items:center}@media(min-width:980px){.cl-dos{grid-template-columns:1fr 1fr}}
.cl-linea-t{list-style:none;margin:0;padding:10px 24px;border-radius:24px;background:var(--card);border:1px solid var(--cl-borde);display:grid}
.cl-linea-t li{position:relative;padding:14px 0 14px 28px}.cl-linea-t li+li{border-top:1px solid var(--cl-borde)}
.cl-linea-t li::before{content:"";position:absolute;left:3px;top:20px;width:10px;height:10px;border-radius:50%;background:var(--cl-ambar);box-shadow:0 0 0 4px var(--cl-ambar-s)}
.cl-linea-t b{display:block;font-size:17px}.cl-linea-t span{display:block;margin-top:2px;font-size:14.5px;color:var(--cl-suave)}
.cl-ben{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.cl-ben li{padding:22px;border-radius:22px;background:var(--card);border:1px solid var(--cl-borde)}
.cl-ben svg{width:42px;height:42px;padding:10px;border-radius:12px;background:var(--cl-sup);color:var(--cl-tinta)}
.cl-ben b{display:block;font-size:17.5px;letter-spacing:-.015em;margin-top:12px}.cl-ben p{margin:6px 0 0;color:var(--cl-suave);font-size:15px;line-height:1.5}
.cl-aviso{max-width:760px;margin:28px auto 0;text-align:center;color:var(--cl-suave);font-size:15px;line-height:1.55}
/* precio */
.cl-planes{display:grid;gap:18px;align-items:start;max-width:1120px;margin:0 auto;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr))}
.cl-plan{position:relative;background:var(--card);border:1.5px solid var(--cl-borde);border-radius:28px;padding:28px;display:grid;gap:8px}
.cl-sello{position:absolute;top:-13px;left:24px;background:var(--cl-tinta);color:var(--cl-fondo);font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px}
.cl-elige{border:0;padding:0;margin:0 0 6px}.cl-elige legend{font-weight:650;font-size:14px;margin-bottom:8px;padding:0}
.cl-op{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;border:1.5px solid var(--cl-borde);margin-bottom:8px;cursor:pointer}
.cl-op input{margin-top:3px;accent-color:var(--cl-azul)}.cl-op b{display:block;font-size:15px}.cl-op small{display:block;color:var(--cl-suave);font-size:13px;margin-top:2px}
.cl-op:has(input:checked){border-color:var(--cl-azul);background:var(--cl-azul-s)}
.cl-plan.rec{border-color:var(--cl-azul);box-shadow:0 30px 60px -40px rgba(31,95,214,.45)}
.cl-plan h3{font-weight:800;font-size:26px;letter-spacing:-.035em;margin:4px 0 0}.cl-para{color:var(--cl-suave);margin:0}
.cl-precio{margin:6px 0 0}.cl-precio b{font-size:40px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.cl-precio small{color:var(--cl-suave)}
.cl-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:8px}.cl-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.cl-plan li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--cl-tinta)}
.cl-nota{color:var(--cl-suave);font-size:15px;margin-top:14px}.cl-nota a{color:var(--cl-azul-t)}
.cl-total{margin:4px 0 12px;font-size:16px}.cl-total b{font-size:20px;font-variant-numeric:tabular-nums}
.cl #form-clara .btn.acento{background:var(--cl-azul);color:var(--cl-sobre-azul);box-shadow:none}
.cl #form-clara a{color:var(--cl-azul-t)}`;

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
