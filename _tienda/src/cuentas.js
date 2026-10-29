// Cuentas (registro de préstamos personales entre familiares y amigos; app propia en cuentas.vorka.mx, Worker aparte).
// /tienda/cuentas/ → ficha comercial: prueba de 7 días sin tarjeta (vive en la app), plan mensual, preguntas y compra.
// Se cobra por suscripción (ver suscripciones.js): la app pregunta por RPC (Admin.suscripcionApp(correo, 'cuentas')) si está al corriente.
// Aquí solo se vende. No es una entidad financiera: no mueve dinero ni otorga crédito (ver /legal/cuentas/).
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, navTienda, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';

const APP = 'https://cuentas.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_CUENTAS = '/tienda/cuentas/';
const pesosRedondo = c => '$' + (c / 100).toLocaleString('es-MX', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });
const PLANES = [{ slug: 'cuentas-mensual', nombre: 'Mensual', cada: 'al mes', renueva: 'cada mes' }, { slug: 'cuentas-anual', nombre: 'Anual', cada: 'al año', renueva: 'cada año' }];

const INCLUYE = ['Personas y préstamos ilimitados', 'Pagos flexibles o cuotas fijas, con o sin interés', 'Desglose de cada abono: cuánto va a interés y cuánto a capital',
  'Simulación de liquidación a cualquier fecha', 'Estado de cuenta en PDF y Excel', 'Enlace de solo lectura para la persona que te debe', 'Recordatorios por correo', 'Acceso para tu pareja o alguien de confianza'];
const FAQ = [
  ['¿Es gratis?', `Sí: con 1 préstamo activo, Cuentas es gratis para siempre, con todo (acuerdo, recibos, recordatorios y estado de cuenta). Los primeros 7 días puedes llevar los que quieras para probar. Si prestas a varias personas a la vez, el plan mensual o anual te deja llevar todos. Entra en <a href="${APP}/entrar">cuentas.vorka.mx</a> con tu correo; no pedimos tarjeta.`],
  ['¿Cuentas presta dinero o lo mueve?', 'No. Cuentas solo lleva el registro. El dinero se entrega y se paga directamente entre ustedes, por transferencia o depósito, como siempre. No somos banco, no pedimos tus datos bancarios y no nos conectamos a tu cuenta.'],
  ['¿Cómo calcula los intereses?', 'Con interés simple sobre lo que falta por pagar, por día, desde la fecha de cada abono. Nunca suma intereses al capital y no pone cargos por atraso que no hayan pactado. Cada número trae su explicación para que lo revises con calculadora.'],
  ['¿Sirve si presto sin intereses?', 'Sí. Puedes llevar préstamos sin interés, con pagos cuando se pueda o con cuotas fijas. Verás siempre cuánto falta y cuánto se ha pagado.'],
  ['¿La persona que me debe puede ver su saldo?', 'Si tú quieres. Le compartes un enlace privado de solo lectura con su estado de cuenta, y lo desactivas cuando quieras. Cuentas nunca le escribe ni le cobra: los avisos son solo para ti.'],
  ['¿Y si se equivocan en una fecha o un monto?', 'Editas el movimiento y todo se recalcula. Si ya estaba confirmado, te pide el motivo y queda en el historial de cambios, para que siempre haya claridad.'],
  ['¿Qué pasa si dejo de pagar la suscripción?', 'Vuelves al plan gratis. Si tienes más de 1 préstamo activo, tu cuenta queda en modo consulta: ves y descargas todo, pero para registrar archiva los que ya terminaron o vuelve a suscribirte. Todo sigue donde lo dejaste.'],
  ['¿Gano algo si la recomiendo?', 'Sí: en Cuentas › Ajustes tienes tu enlace para invitar. Por cada persona que se suscriba con él, te regalamos un mes.'],
  ['¿Cuánto cuesta y cómo pago?', 'Mensual ($99 al mes) o anual ($799 al año, ahorras $389), los dos con todo incluido. Pagas con tarjeta de crédito o débito, procesado por Stripe. Te emitimos factura (CFDI) si la pides.'],
  ['¿Y si pago el anual y no me convence?', 'Si cancelas dentro de los 10 días naturales siguientes al cobro anual, te devolvemos tu dinero completo. Escríbenos a hola@vorka.mx.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Cuentas › Ajustes › Suscripción, sin llamadas. Tu cuenta sigue completa hasta el final del mes pagado.'],
  ['¿Reemplaza un contrato?', 'No. Cuentas te ayuda a llevar en orden lo que acordaron y puedes adjuntar el contrato o pagaré que firmen, pero no sustituye un contrato ni asesoría legal o fiscal.'],
];

const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONO = {
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'), candado: ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'), reloj: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  calc: ico('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M16 11v6"/>'), doc: ico('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
  enlace: ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'), campana: ico('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  historial: ico('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'), corazon: ico('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
};
const V = '<svg viewBox="69 225 940 909" aria-hidden="true"><path fill="currentColor" d="M69 226H311L652 877L526 1133Z"/><path fill="currentColor" d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg>';

// Réplica de la pantalla de un préstamo en la app: tarjeta morada con el saldo, avance y movimientos
const pantalla = `<div class="cu-cel" aria-hidden="true"><i class="cu-isla"></i><div class="cu-pant">
  <div class="cu-app-top"><span class="cu-logo">${V}</span><b>Cuentas</b></div>
  <div class="cu-tarj"><div class="cu-q"><span class="cu-av">CM</span><span><b>Carla Méndez</b><small>Enganche del coche · 12 pagos</small></span></div>
    <small class="cu-rot">Para liquidar hoy</small><b class="cu-saldo">$20,685.27</b>
    <div class="cu-av-b">${Array.from({ length: 12 }, (_, i) => `<i${i < 4 ? ' class="on"' : ''}></i>`).join('')}</div><small class="cu-ley">Pagado a capital: $9,596.47 de $30,000</small></div>
  <div class="cu-rap">${['Registrar abono', 'Simular', 'Estado de cuenta'].map((t, i) => `<span><i class="${i ? '' : 'pri'}"></i>${t}</span>`).join('')}</div>
  <div class="cu-movs">${[['Abono recibido', '10 sep · Transferencia', '−$2,666.22'], ['Abono recibido', '10 ago · Transferencia', '−$2,666.22'], ['Abono recibido', '10 jul · Transferencia', '−$2,666.22']].map(([a, b, c]) => `<div><i></i><span><b>${a}</b><small>${b}</small></span><em>${c}</em></div>`).join('')}</div>
</div></div>`;

export async function paginaCuentas(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug) })))).filter(x => x.prod);
  const mensual = planes.find(x => x.slug === 'cuentas-mensual'), anual = planes.find(x => x.slug === 'cuentas-anual');
  const plan = mensual?.prod || planes[0]?.prod || null;
  const ahorro = mensual && anual ? mensual.prod.precio_centavos * 12 - anual.prod.precio_centavos : 0;
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : (planes[0]?.slug || '');
  const elegidoP = planes.find(x => x.slug === elegido);
  if (plan && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: plan.id, ref_code: code });
  const error = url.searchParams.get('error') || '';
  // Desde la app (Suscribirme) llega el correo de la cuenta para que la suscripción quede ligada a ella
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Cuentas · Administrador de préstamos personales', brand: { '@type': 'Brand', name: 'Vorka México' },
    description: 'Lleva en orden lo que prestas a familiares y amigos: abonos, intereses claros, saldo al día y estado de cuenta. Prueba 7 días gratis.', image: ['https://vorka.mx/assets/tienda/cuentas.webp'],
    ...(planes.length ? { offers: planes.map(x => ({ '@type': 'Offer', priceCurrency: 'MXN', price: (x.prod.precio_centavos / 100).toFixed(2), name: `Plan ${x.nombre.toLowerCase()}` })) } : {}) },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  return pagina({ navActual: 'catalogo', navOscuro: true, entrar: { url: `${APP}/`, app: 'Cuentas' },
    titulo: 'Cuentas: administra tus préstamos personales | Prueba 7 días gratis', ruta: RUTA_CUENTAS, imagen: 'https://vorka.mx/assets/tienda/cuentas-og.png',
    descripcion: 'Lleva en orden lo que prestas a familiares y amigos: cada abono, intereses claros, el saldo al día y estados de cuenta en PDF y Excel. Sin hojas de cálculo. Prueba 7 días gratis, sin tarjeta.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="cu">
<section class="cu-hero"><div class="marco cu-hero-g">
  <div>
    <span class="cu-marca"><span class="cu-logo grande">${V}</span>Cuentas <small>by Vorka</small></span>
    <h1 class="cu-h1">Lo que prestas, <em>claro y en orden.</em></h1>
    <p class="cu-lead">Registra el dinero que prestas a tu familia y amigos, cada abono que te hacen y mira al instante cuánto falta, cuánto fue a intereses y cuánto a capital. Sin hojas de cálculo ni pleitos por números.</p>
    <div class="cu-ctas"><a class="cu-btn" href="${APP}/entrar">Pruébala 7 días gratis ${FLECHA}</a><a class="cu-btn ghost" href="#planes">Ver precio</a></div>
    <p class="t-ya">¿Ya tienes cuenta? <a href="${APP}/">Entra aquí</a></p>
    <ul class="cu-chips"><li>${ICONO.check}Sin tarjeta para probar</li><li>${ICONO.candado}No pedimos datos bancarios</li><li>${ICONO.reloj}Lista en 2 minutos</li></ul>
  </div>
  <div class="cu-escena">${pantalla}</div>
</div>
${navTienda('finanzas')}
</section>

<section class="cu-sec"><div class="marco">
  <div class="cu-cab"><span class="cu-et">El problema</span><h2>¿Cuánto me debe? ¿Cuánto ya me pagó?</h2><p>Prestar a alguien de confianza es fácil. Lo difícil es llevar la cuenta: transferencias sueltas, notas en el celular y una conversación incómoda cuando los números no cuadran. Cuentas lo deja claro para los dos.</p></div>
  <ol class="cu-pasos">${[['Registra a la persona', 'Su nombre y cómo contactarla. Nada de cuentas bancarias.'], ['Crea el préstamo', 'Cuánto, cuándo y cómo se paga: con o sin interés, libre o en cuotas fijas.'],
    ['Anota cada transferencia', 'Al recibir un abono, lo registras y ves en qué se aplicó antes de guardarlo.'], ['Comparte el estado de cuenta', 'Un PDF, un Excel o un enlace de solo lectura para que los dos vean lo mismo.']].map(([t, d], k) => `<li><span class="cu-num">0${k + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
</div></section>

<section class="cu-sec cu-osc"><div class="marco cu-dos">
  <div class="cu-cab izq"><span class="cu-et">Números que se explican</span><h2>Cada peso, con su explicación.</h2><p>Nada de cajas negras. Cuentas usa interés simple sobre lo que falta por pagar y te muestra la operación de cada tramo, para que cualquiera la revise con calculadora.</p></div>
  <div class="cu-calc" role="img" aria-label="Ejemplo de cálculo de un abono">
    <small>Ejemplo · abono del 15 de agosto</small>
    <div class="cu-linea"><span>Interés del 1 jul al 15 ago (45 días)</span><b>$332.88</b></div>
    <p class="cu-form">$15,000.00 × 18 % × 45 ÷ 365</p>
    <div class="cu-linea"><span>Abono recibido</span><b>$3,000.00</b></div>
    <div class="cu-linea sub"><span>· a interés</span><b>$332.88</b></div>
    <div class="cu-linea sub"><span>· a capital</span><b>$2,667.12</b></div>
    <div class="cu-linea total"><span>Queda debiendo</span><b>$12,332.88</b></div>
  </div>
</div></section>

<section class="cu-sec"><div class="marco">
  <div class="cu-cab"><span class="cu-et">Lo que incluye</span><h2>Hecho para préstamos entre personas de confianza.</h2></div>
  <ul class="cu-ben">${[[ICONO.calc, 'Pagos flexibles o cuotas', 'Abonos cuando se pueda, o una tabla de pagos con fechas fijas. Si te pagan de más, eliges si termina antes o baja la cuota.'],
    [ICONO.doc, 'Estado de cuenta', 'Historial con cada entrega, abono, interés y saldo. Descárgalo en PDF o Excel a cualquier fecha.'],
    [ICONO.enlace, 'Enlace para la otra persona', 'Ve su saldo y sus pagos sin poder cambiar nada. Lo desactivas cuando quieras.'],
    [ICONO.campana, 'Recordatorios para ti', 'Un correo a las 8:00 con los pagos del día y lo que no se ha registrado. Nunca le escribe a quien te debe.'],
    [ICONO.historial, 'Historial de cambios', 'Si alguien corrige un movimiento, queda el antes, el después y el motivo.'],
    [ICONO.corazon, 'Cuida la relación', 'Sin amenazas ni presión: claridad para que el dinero no se interponga entre ustedes.']].map(([i, t, d]) => `<li>${i}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
  <p class="cu-aviso">Cuentas es una herramienta de registro: <b>no es un banco ni una financiera</b>, no mueve dinero, no otorga préstamos y no sustituye un contrato ni asesoría legal o fiscal.</p>
</div></section>

<section class="cu-sec suave" id="planes"><div class="marco">
  <div class="cu-cab"><span class="cu-et">Precio</span><h2>Gratis con 1 préstamo. Para más, un plan con todo.</h2><p>En pesos mexicanos con IVA incluido. Cancela cuando quieras.</p></div>
  <div class="cu-planes">
    <article class="cu-plan"><h3>Gratis</h3><p class="cu-para">Para quien presta de vez en cuando</p><p class="cu-precio"><b>$0</b> <small>para siempre</small></p>
      <ul>${['1 préstamo activo, con todo', 'Acuerdo, recibos y recordatorios', 'Los primeros 7 días, préstamos ilimitados', 'Sin tarjeta'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
      <a class="cu-btn ghost oscuro" href="${APP}/entrar">Empezar gratis</a></article>
    ${planes.map(x => `<article class="cu-plan${x.slug === 'cuentas-mensual' ? ' rec' : ''}">${x.slug === 'cuentas-anual' && ahorro > 0 ? `<span class="cu-sello">Ahorra ${pesosRedondo(ahorro)}</span>` : ''}<h3>${x.nombre}</h3><p class="cu-para">Préstamos ilimitados</p><p class="cu-precio"><b>${precio(x.prod)}</b> <small>${x.cada}</small></p>
      ${x.slug === 'cuentas-anual' ? `<p class="cu-para" style="margin-top:-4px">Equivale a ${pesosRedondo(Math.round(x.prod.precio_centavos / 12))} al mes, en un solo pago</p>` : ''}
      <ul>${(x.slug === 'cuentas-anual' ? ['Todo lo del plan mensual', 'Un solo pago al año', 'Si cancelas en los primeros 10 días, te devolvemos todo'] : INCLUYE).map(i => `<li>${CHECK}<span>${i}</span></li>`).join('')}</ul>
      <a class="cu-btn${x.slug === 'cuentas-mensual' ? '' : ' ghost oscuro'}" href="?plan=${x.slug}#comprar" data-ir="comprar" data-plan="${x.slug}">Suscribirme</a></article>`).join('')}
  </div>
  ${plan ? '' : `<p class="cu-nota" style="text-align:center">La suscripción abre muy pronto. Mientras, <a href="${APP}/entrar">empieza tu prueba gratis</a>.</p>`}
</div></section>

${plan ? seccionCompra({ titulo: 'Suscríbete a Cuentas', intro: `¿Aún no la pruebas? <a href="${APP}/entrar">Empieza gratis 7 días</a>, sin tarjeta. Si ya la estás probando, suscríbete con el mismo correo y todo sigue tal cual.`,
  pasos: [['Elige mensual o anual', 'Y escribe el mismo correo con el que entras a Cuentas.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Sigues donde estabas', 'Tu cuenta queda activa al instante, con todos tus registros.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por correo'],
  form: `<form class="t-form t-compra" id="form-cuentas" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <fieldset class="t-campo cu-elige"><legend>Plan</legend>${planes.map(x => `<label class="cu-op"><input type="radio" name="slug" value="${x.slug}"${x.slug === elegido ? ' checked' : ''}><span><b>${x.nombre} · ${precio(x.prod)} ${x.cada}</b>${x.slug === 'cuentas-anual' && ahorro > 0 ? `<small>Ahorra ${pesosRedondo(ahorro)} contra el mensual</small>` : '<small>Sin plazo forzoso</small>'}</span></label>`).join('')}</fieldset>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo con el que entras a Cuentas.</small></div>
    <p class="cu-total">Pagas hoy <b id="cu-hoy">${precio(elegidoP.prod)}</b> <span id="cu-luego">y luego ${precio(elegidoP.prod)} ${elegidoP.renueva}</span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/cuentas/" target="_blank">condiciones de Cuentas</a> (incluida la renovación automática) y el <a href="/legal/cuentas/privacidad/" target="_blank">aviso de privacidad de Cuentas</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="cu-precios">${JSON.stringify(Object.fromEntries(planes.map(x => [x.slug, { p: precio(x.prod), c: x.prod.precio_centavos, renueva: x.renueva }]))).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/cuentas/">Condiciones de Cuentas</a> · <a href="/legal/cuentas/privacidad/">Aviso de privacidad</a> · Cuentas · by Vorka México</p>' })}
${await masTienda(env, 'finanzas')}
</div>`,
  });
}

const CSS = `
.cu{--cu-tinta:#0f0b12;--cu-morado:#6b2a85;--cu-morado-c:#c79be0;--cu-h1:#4a1660;--cu-h2:#7a3497;--cu-h3:#a45bc0;--cu-crema:#f6f4f7}
[data-tema="oscuro"] .cu{--cu-morado:#c79be0}
.cu-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--cu-morado);color:#fff;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 12px 28px -12px rgba(107,42,133,.7);transition:transform .2s var(--ease),background .2s}
.cu-btn:hover{transform:translateY(-1px)}.cu-btn svg{width:17px;height:17px}
.cu-hero .cu-btn:not(.ghost){background:#fff;color:var(--cu-h1)}
.cu-btn.ghost{background:rgba(255,255,255,.08);color:var(--cu-crema);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}.cu-btn.ghost:hover{background:rgba(255,255,255,.14)}
.cu-btn.ghost.oscuro{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--line-2)}.cu-btn.ghost.oscuro:hover{box-shadow:inset 0 0 0 1.5px var(--fg)}
/* portada */
.cu-hero{position:relative;isolation:isolate;overflow:hidden;margin-top:-104px;padding:140px 0 26px;color:var(--cu-crema);
  background:radial-gradient(60% 80% at 85% 20%,var(--cu-h3) 0%,transparent 60%),linear-gradient(150deg,var(--cu-h1),var(--cu-h2))}
.cu-hero::after{content:"";position:absolute;right:-6%;bottom:-18%;width:min(60vw,640px);aspect-ratio:1;opacity:.1;z-index:-1;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='69 225 940 909'%3E%3Cpath fill='%23fff' d='M69 226H311L652 877L526 1133Z'/%3E%3Cpath fill='%23fff' d='M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z'/%3E%3C/svg%3E") no-repeat center/contain}
.cu-hero-g{display:grid;gap:40px;align-items:center;padding-bottom:30px}.cu-hero-g>*{min-width:0}
@media(min-width:960px){.cu-hero-g{grid-template-columns:1.1fr .9fr}}
.cu-marca{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:22px;letter-spacing:-.03em}.cu-marca small{font-weight:500;font-size:14px;opacity:.7;letter-spacing:0}
.cu-logo{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--cu-morado);color:#fff}.cu-logo svg{width:15px;height:15px}
.cu-logo.grande{width:40px;height:40px;border-radius:12px;background:#fff;color:var(--cu-h1)}.cu-logo.grande svg{width:21px;height:21px}
.cu-h1{font-weight:800;font-size:clamp(42px,6.4vw,78px);line-height:.98;letter-spacing:-.05em;margin:26px 0 0;max-width:12ch;text-wrap:balance}.cu-h1 em{font-style:normal;color:#ecd6f7}
.cu-lead{margin-top:20px;font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:#fff;max-width:34em}
.cu-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.cu-chips{list-style:none;padding:0;margin:26px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14.5px;color:rgba(246,244,247,.78)}
.cu-chips li{display:inline-flex;align-items:center;gap:7px}.cu-chips svg{width:18px;height:18px;color:#ecd6f7}
.cu-hero .t-nav-tienda{margin-top:8px}.cu-hero .t-nav-tienda a{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#F6F4F7}.cu-hero .t-nav-tienda a[aria-current]{background:#fff;border-color:#fff;color:var(--cu-h1)}
.cu-hero>.t-nav-tienda{width:min(100% - 32px,1180px);margin:0 auto}
/* el celular con la app */
.cu-escena{justify-self:center;width:min(100%,340px);padding:10px 0 30px}
.cu-cel{position:relative;padding:12px;border-radius:52px;background:#16101a;box-shadow:0 40px 80px -30px rgba(0,0,0,.6),inset 0 0 0 1.5px rgba(255,255,255,.12)}
.cu-isla{position:absolute;top:24px;left:50%;width:90px;height:26px;border-radius:20px;background:#000;transform:translateX(-50%);z-index:2}
.cu-pant{border-radius:41px;overflow:hidden;background:#0c0a0d;padding:58px 14px 18px;color:#f4f1f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.cu-app-top{display:flex;align-items:center;gap:8px;font-size:15px;margin:0 2px 12px}
.cu-tarj{position:relative;overflow:hidden;border-radius:22px;padding:16px;background:radial-gradient(120% 140% at 100% 0%,var(--cu-h3),transparent 55%),linear-gradient(135deg,#2e0d3d,#5a2272)}
.cu-q{display:flex;gap:10px;align-items:center}.cu-q b{display:block;font-size:14.5px}.cu-q small{display:block;font-size:11.5px;opacity:.75}
.cu-av{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.16);font-size:12px;font-weight:800}
.cu-rot{display:block;margin-top:16px;font-size:12px;opacity:.82}.cu-saldo{display:block;font-size:31px;letter-spacing:-.045em;font-weight:800;margin-top:2px}
.cu-av-b{display:flex;gap:3px;margin-top:14px}.cu-av-b i{flex:1;height:6px;border-radius:2px;background:rgba(255,255,255,.2);transform:skewX(-28deg)}.cu-av-b i.on{background:#fff}
.cu-ley{display:block;font-size:10.5px;opacity:.78;margin-top:7px}
.cu-rap{display:flex;justify-content:space-around;margin:16px 0 12px;font-size:10.5px;font-weight:600;text-align:center}
.cu-rap span{display:flex;flex-direction:column;align-items:center;gap:6px;width:76px}.cu-rap i{width:42px;height:42px;border-radius:50%;background:#1e1a21}.cu-rap i.pri{background:#8e3fb3}
.cu-movs{border-radius:18px;background:#17141a;padding:2px 12px}.cu-movs div{display:flex;align-items:center;gap:10px;padding:10px 0}.cu-movs div+div{border-top:1px solid #26222a}
.cu-movs i{width:30px;height:30px;border-radius:50%;background:#17291f;flex:none}.cu-movs span{flex:1;min-width:0}.cu-movs b{display:block;font-size:12.5px}.cu-movs small{display:block;font-size:10.5px;color:#a89fad}.cu-movs em{font-style:normal;font-size:12.5px;font-weight:700;color:#5cc18c}
/* secciones */
.cu-sec{padding:clamp(56px,8vw,104px) 0}.cu-sec.suave{background:var(--bg-2)}
.cu-osc{background:var(--cu-tinta);color:var(--cu-crema)}
.cu-cab{max-width:700px;margin:0 auto 38px;text-align:center}.cu-cab.izq{text-align:left;margin:0}
.cu-et{display:inline-flex;align-items:center;gap:10px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--cu-morado)}.cu-osc .cu-et{color:var(--cu-morado-c)}
.cu-et::before{content:"";width:4px;height:14px;border-radius:1px;background:currentColor;transform:skewX(-28deg)}
.cu-cab h2{font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.03;letter-spacing:-.045em;margin:10px 0 0;text-wrap:balance}
.cu-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}.cu-osc .cu-cab p{color:rgba(246,244,247,.74)}
.cu-pasos{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.cu-pasos li{padding:24px;border-radius:24px;background:var(--card);border:1px solid var(--line)}
.cu-num{display:block;font-weight:800;font-size:15px;color:var(--cu-morado);letter-spacing:.04em}.cu-pasos b{display:block;font-size:20px;letter-spacing:-.02em;margin-top:18px}.cu-pasos p{margin:6px 0 0;color:var(--fg-2);line-height:1.5}
.cu-dos{display:grid;gap:40px;align-items:center}@media(min-width:980px){.cu-dos{grid-template-columns:1fr 1fr}}
.cu-calc{padding:24px;border-radius:26px;background:#1a1520;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);font-variant-numeric:tabular-nums}
.cu-calc small{color:rgba(246,244,247,.55);font-size:12.5px}
.cu-linea{display:flex;justify-content:space-between;gap:16px;margin-top:14px;font-size:16px}.cu-linea b{font-weight:700}
.cu-linea.sub{margin-top:6px;font-size:14.5px;color:rgba(246,244,247,.7)}.cu-linea.total{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12);font-size:19px}.cu-linea.total b{color:#ecd6f7;font-weight:800}
.cu-form{margin:6px 0 0;padding-left:12px;border-left:3px solid var(--cu-h2);font-size:13.5px;color:rgba(246,244,247,.66)}
.cu-ben{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.cu-ben li{padding:22px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.cu-ben svg{width:42px;height:42px;padding:10px;border-radius:50%;background:color-mix(in srgb,var(--cu-morado) 12%,transparent);color:var(--cu-morado)}
.cu-ben b{display:block;font-size:17.5px;letter-spacing:-.015em;margin-top:12px}.cu-ben p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
.cu-aviso{max-width:720px;margin:28px auto 0;text-align:center;color:var(--fg-2);font-size:15px;line-height:1.55}
/* precio */
.cu-planes{display:grid;gap:18px;align-items:start;max-width:1120px;margin:0 auto;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr))}
.cu-plan{position:relative;background:var(--card);border:1.5px solid var(--line);border-radius:28px;padding:28px;display:grid;gap:8px}
.cu-sello{position:absolute;top:-13px;left:24px;background:linear-gradient(100deg,#a8853f,#c8a45c 55%,#e6cf96);color:#1b1408;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px}
.cu-elige{border:0;padding:0;margin:0 0 6px}.cu-elige legend{font-weight:650;font-size:14px;margin-bottom:8px;padding:0}
.cu-op{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);margin-bottom:8px;cursor:pointer}
.cu-op input{margin-top:3px;accent-color:var(--cu-morado)}.cu-op b{display:block;font-size:15px}.cu-op small{display:block;color:var(--fg-2);font-size:13px;margin-top:2px}
.cu-op:has(input:checked){border-color:var(--cu-morado);background:color-mix(in srgb,var(--cu-morado) 7%,transparent)}
.cu-plan.rec{border-color:var(--cu-morado);box-shadow:0 30px 60px -36px rgba(107,42,133,.55)}
.cu-plan h3{font-weight:800;font-size:26px;letter-spacing:-.035em;margin:4px 0 0}.cu-para{color:var(--fg-2);margin:0}
.cu-precio{margin:6px 0 0}.cu-precio b{font-size:40px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.cu-precio small{color:var(--fg-2)}
.cu-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:8px}.cu-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.cu-plan li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--cu-morado)}
.cu-nota{color:var(--fg-2);font-size:15px;margin-top:14px}
.cu-total{margin:4px 0 12px;font-size:16px}.cu-total b{font-size:20px;font-variant-numeric:tabular-nums}
.cu #form-cuentas .btn.acento{background:var(--cu-morado);color:#fff;box-shadow:0 12px 28px -12px rgba(107,42,133,.7)}
/* en oscuro el morado se aclara: el texto del botón pasa a tinta oscura para seguir en ≥ 4.5:1 */
[data-tema="oscuro"] .cu #form-cuentas .btn.acento{color:#141216}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-cuentas'); if(!f||!window.fetch) return;
  var P={}; try{ P=JSON.parse(document.getElementById('cu-precios').textContent); }catch(e){}
  function elegido(){ var r=f.querySelector('input[name=slug]:checked'); return r?r.value:''; }
  function pinta(){ var x=P[elegido()]; if(!x) return; var fr=VD.frase(x.c,x.renueva); document.getElementById('cu-hoy').textContent=fr.hoy; document.getElementById('cu-luego').textContent=fr.luego; }
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
