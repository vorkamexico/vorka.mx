// Vuelve (tarjetas de lealtad digitales; tercera app de Diversificación de Vorka México).
// /tienda/vuelve/ → ficha comercial única: prueba de 7 días, plan mensual o anual, sucursales adicionales, preguntas y compra.
// Se cobra por suscripción (ver suscripciones.js). La app vive en os.vorka.mx/vuelve/ y el registro de clientes de cada
// negocio en vorka.mx/vuelve/<negocio> (→ os.vorka.mx/v/<negocio>). Aquí solo se vende.
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, navTienda, masTienda, seccionFaq, seccionCompra } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';

const OS = 'https://os.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_VUELVE = '/tienda/vuelve/';
const PLANES = [{ slug: 'vuelve-mensual', extra: 'vuelve-sucursal-mensual', nombre: 'Mensual', cada: 'al mes' }, { slug: 'vuelve-anual', extra: 'vuelve-sucursal-anual', nombre: 'Anual', cada: 'al año', nota: '2 meses gratis' }];

const INCLUYE = ['Clientes ilimitados y tu propia página de registro con QR', 'Sellos o puntos, recompensas y niveles (Bronce, Plata, Oro)', 'Tarjeta en Apple Wallet, Google Wallet o en el navegador',
  'Avisos de cumpleaños, de "te extrañamos" y por cercanía, automáticos', 'Programa de referidos: "trae a un amigo"', 'Reporte de dinero recuperado y retorno de clientes', 'Escáner para tu equipo con PIN y bitácora antifraude', 'Cartel con QR listo para imprimir'];
const FAQ = [
  ['¿Puedo probar antes de pagar?', `Sí. Creas tu programa en <a href="${OS}/vuelve/">os.vorka.mx/vuelve</a> y lo usas completo 7 días, sin tarjeta. Si te sirve, te suscribes; si no, no pasa nada.`],
  ['¿Mis clientes tienen que descargar una app?', 'No. Escanean tu QR, escriben su nombre y teléfono, y su tarjeta queda en Apple Wallet, Google Wallet o como tarjeta en su navegador. Tarda menos de 30 segundos.'],
  ['¿Cómo funcionan los avisos?', 'Vuelve manda solo: felicitación de cumpleaños con un regalo, un "te extrañamos" a quien lleva tiempo sin venir y los avisos que tú escribas para todos o para un grupo (por nivel o por visitas). Llegan a la tarjeta de su celular y, si nos dio su correo, también por correo. Sin costo por mensaje.'],
  ['¿Y lo de "cuando pasan cerca"?', 'En iPhone, cuando tu cliente pasa cerca de tu sucursal, su tarjeta aparece en la pantalla de bloqueo con tu mensaje (por ejemplo, "¡Estás cerca! Pasa por tu sello"). Es una sugerencia del teléfono, no una notificación con sonido, y depende de los permisos de ubicación de cada persona. Te lo decimos claro para que no te vendan humo.'],
  ['¿Cómo sé si de verdad funciona?', 'En tu panel ves cuántos clientes regresaron, cada cuánto vienen y cuánto dinero te trajeron de vuelta (con el ticket que registras al sellar o con tu ticket promedio). También ves cuántos regresaron después de cada aviso.'],
  ['¿Y si mi equipo regala sellos?', 'Cada persona de tu equipo sella con su PIN, hay un tope de sellos por cliente al día y todo queda en una bitácora. Si alguien sella de más, te avisamos.'],
  ['¿Qué pasa con los datos de mis clientes?', 'Son tuyos. Los descargas en Excel cuando quieras, también si cancelas. Vorka solo los guarda por tu cuenta para darte el servicio: no los vende ni los usa para publicidad. Cada cliente puede pedir su baja desde su tarjeta.'],
  ['¿Cuánto cuesta y cómo pago?', 'Mensual o anual (con 2 meses gratis), con tarjeta, procesado por Stripe. La suscripción incluye una sucursal; cada sucursal adicional se suma a tu plan. Te emitimos factura (CFDI) si la pides.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Vuelve › Cuenta, sin llamadas. Tu programa sigue activo hasta el final del periodo que pagaste y tus clientes conservan su tarjeta.'],
  ['¿Para qué negocios sirve?', 'Cafeterías, restaurantes, barberías, salones, estéticas, gimnasios, autolavados, tintorerías, panaderías: cualquier negocio con clientes que pueden regresar. Al empezar eliges tu giro y Vuelve te sugiere sellos, premios y mensajes.'],
];

export async function paginaVuelve(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug), sucursal: await productoPorSlug(env, x.extra) })))).filter(x => x.prod);
  if (planes[0] && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: planes[0].prod.id, ref_code: code });
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : planes[0]?.slug;
  const error = url.searchParams.get('error') || '';
  // Desde la app (Suscribirme) llega el correo de la cuenta para que la suscripción quede ligada a ella
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const mensual = planes.find(x => x.slug === 'vuelve-mensual');
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Vuelve · Tarjeta de lealtad digital para tu negocio', brand: { '@type': 'Brand', name: 'Vuelve' },
    description: 'Sellos o puntos en el celular de tus clientes, avisos automáticos de cumpleaños y de regreso, referidos y el dinero que te traen de vuelta, medido. Prueba 7 días gratis.',
    image: [`${OS}/vuelve/og.png`],
    ...(planes.length ? { offers: planes.map(x => ({ '@type': 'Offer', priceCurrency: 'MXN', price: (x.prod.precio_centavos / 100).toFixed(2), name: `Plan ${x.nombre.toLowerCase()}` })) } : {}) },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const datos = Object.fromEntries(planes.map(x => [x.slug, { p: x.prod.precio_centavos, s: x.sucursal?.precio_centavos ?? null, cada: x.cada }]));
  return pagina({
    titulo: 'Vuelve: tarjeta de lealtad digital para tu negocio | Prueba 7 días gratis', ruta: RUTA_VUELVE, imagen: `${OS}/vuelve/og.png`,
    descripcion: 'Que tus clientes vuelvan solos: sellos o puntos en su celular, sin app ni cartón. Avisos automáticos, referidos y el dinero que te traen de vuelta, medido. Prueba 7 días gratis, sin tarjeta.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="vu">
<section class="vu-hero"><div class="marco vu-hero-g">
  <div>
    ${navTienda('lealtad')}
    <span class="vu-logo">vuelve<i aria-hidden="true">↻</i></span>
    <h1 class="vu-h1">Que tus clientes <i>vuelvan solos.</i></h1>
    <p class="vu-lead">La tarjeta de sellos de tu negocio, en el celular de tus clientes. Sin app y sin cartón. Vuelve les avisa en su cumpleaños, cuando llevan tiempo sin venir y cuando pasan cerca, y tú ves cuánto dinero te traen de vuelta.</p>
    <div class="botones"><a class="btn tinta" href="${OS}/vuelve/#/nuevo">Probar 7 días gratis ${FLECHA}</a><a class="btn blanco" href="#planes">Ver precios</a></div>
    <p class="vu-nota"><b>Sin tarjeta para probar.</b> Después, ${mensual ? `<b>${precio(mensual.prod)}</b> al mes` : 'una mensualidad'} con clientes ilimitados · cancela cuando quieras</p>
  </div>
  <div class="vu-cel" aria-hidden="true"><div class="vu-tarjeta"><div class="vu-t-cab"><span class="vu-t-logo">☕</span><span><b>Café La Paloma</b><small>Tarjeta de cliente</small></span><span class="vu-t-nivel">Oro</span></div>
    <div class="vu-sellos">${Array.from({ length: 10 }, (_, i) => `<span class="${i < 7 ? 'si' : ''}">${i < 7 ? '☕' : ''}</span>`).join('')}</div>
    <p class="vu-t-meta"><b>7 de 10</b> · te faltan 3 para tu bebida gratis</p>
    <div class="vu-t-pie"><span><small>Cliente</small><b>María G.</b></span><span class="vu-qr"></span></div></div>
    <div class="vu-aviso"><b>Café La Paloma</b><span>¡Feliz cumpleaños, María! Tu bebida va por nuestra cuenta esta semana 🎂</span></div></div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Así funciona</span><h2 class="h2">Listo en minutos, desde tu celular</h2></div>
  <ol class="vu-pasos">${[['Arma tu tarjeta', 'Elige tu giro, sube tu logo y define sellos y premios. Vuelve te sugiere todo.'], ['Pon tu QR en el mostrador', 'Te damos un cartel listo para imprimir. Tus clientes se registran en 30 segundos.'],
    ['Sella con el celular', 'Tu equipo escanea la tarjeta del cliente con su PIN. Un toque y listo.'], ['Vuelve hace el resto', 'Avisos de cumpleaños, de "te extrañamos" y de cercanía, y tus números de cada mes.']].map(([t, d], k) => `<li class="rv" style="--d:${k * .05}s"><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Lo que te hace ganar</span><h2 class="h2">Más que una tarjeta de sellos</h2></div>
  <ul class="vu-ben">${[['💸', 'Dinero recuperado, medido', 'Ves cuántos clientes regresaron, cada cuánto y cuánto dejaron. Y cuántos volvieron después de cada aviso.'],
    ['🎂', 'Avisos que trabajan solos', 'Cumpleaños con regalo, "te extrañamos" a quien no ha venido y tus promociones para todos o por grupo. Sin costo por mensaje.'],
    ['🤝', 'Trae a un amigo', 'Cada tarjeta trae una liga para invitar. Cuando el amigo hace su primera visita, los dos ganan sellos.'],
    ['🔐', 'Sin sellos regalados', 'PIN por persona de tu equipo, tope de sellos por cliente al día y bitácora de todo. Te avisamos si algo se ve raro.'],
    ['📍', 'Por sucursal', 'Cada sucursal con su ubicación, su equipo y su mensaje de cercanía.'],
    ['🧾', 'Tuyos, tus datos', 'Descargas a tus clientes en Excel cuando quieras. Aviso de privacidad listo para tu negocio y factura de tu suscripción.']].map(([i, t, d], k) => `<li class="rv" style="--d:${(k % 2) * .05}s"><span aria-hidden="true">${i}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="t-sec" id="planes"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Precios</span><h2 class="h2">Pruébalo 7 días. Después, un solo plan con todo.</h2><p class="lead">En pesos mexicanos con IVA incluido. Clientes y avisos ilimitados. Cancela cuando quieras.</p></div>
  <div class="vu-planes">
    <article class="vu-plan"><h3>Prueba</h3><p class="vu-para">Todo Vuelve, 7 días</p><p class="vu-precio"><b>$0</b></p>
      <ul>${['Sin tarjeta', 'Todas las funciones', 'Tus clientes conservan su tarjeta si decides seguir'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
      <a class="btn blanco" href="${OS}/vuelve/#/nuevo">Empezar gratis</a></article>
    ${planes.map(x => `<article class="vu-plan${x.slug === 'vuelve-mensual' ? ' rec' : ''}">${x.nota ? `<span class="vu-sello">${x.nota}</span>` : ''}<h3>${x.nombre}</h3><p class="vu-para">Una sucursal incluida</p>
      <p class="vu-precio"><b>${precio(x.prod)}</b> <small>${x.cada}</small></p>
      <ul>${INCLUYE.slice(0, 5).map(i => `<li>${CHECK}<span>${i}</span></li>`).join('')}${x.sucursal ? `<li>${CHECK}<span>Sucursal adicional: ${precio(x.sucursal)} ${x.cada}</span></li>` : ''}</ul>
      <a class="btn ${x.slug === 'vuelve-mensual' ? 'tinta' : 'blanco'}" href="?plan=${x.slug}#comprar" data-plan="${x.slug}">Suscribirme</a></article>`).join('')}
  </div>
  ${planes.length ? '' : `<p class="vu-nota" style="text-align:center">La suscripción abre muy pronto. Mientras, <a href="${OS}/vuelve/#/nuevo">empieza tu prueba gratis</a>.</p>`}
</div></section>

${planes.length ? seccionCompra({ titulo: 'Suscríbete a Vuelve', intro: `¿Aún no lo pruebas? <a href="${OS}/vuelve/#/nuevo">Empieza gratis 7 días</a>, sin tarjeta. Si ya lo estás probando, suscríbete con el mismo correo y tu programa sigue tal cual.`,
  pasos: [['Eliges mensual o anual', 'Y cuántas sucursales adicionales necesitas.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Te llega tu acceso por correo', 'Con el mismo correo de tu prueba, todo sigue igual.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por correo y WhatsApp'],
  form: `<form class="t-form t-compra" id="form-vuelve" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="slug">Plan</label><select id="slug" name="slug">${planes.map(x => `<option value="${esc(x.slug)}"${elegido === x.slug ? ' selected' : ''}>${x.nombre} · ${precio(x.prod)} ${x.cada}${x.nota ? ` (${x.nota})` : ''}</option>`).join('')}</select></div>
    <div class="t-campo"><label for="sucursales">Sucursales adicionales</label><input id="sucursales" name="sucursales" type="number" inputmode="numeric" min="0" max="20" value="0"><small class="t-ayuda">Tu plan incluye una sucursal. Suma aquí las demás.</small></div>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo de tu prueba para que tu programa siga igual.</small></div>
    <p class="vu-total">Pagas hoy <b id="vu-total">${planes[0] ? precio(planes.find(x => x.slug === elegido)?.prod || planes[0].prod) : ''}</b> <span id="vu-cada"></span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/vuelve/" target="_blank">condiciones de Vuelve</a> (incluida la renovación automática) y el <a href="/legal/vuelve/privacidad/" target="_blank">aviso de privacidad de Vuelve</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn tinta" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">Tarjeta de crédito o débito · Pago seguro con Stripe · Se renueva solo y lo cancelas cuando quieras</p>
  </form><script type="application/json" id="vu-precios">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/vuelve/">Condiciones de Vuelve</a> · <a href="/legal/vuelve/privacidad/">Aviso de privacidad</a> · <a href="/legal/vuelve/privacidad-clientes/">Privacidad para clientes de cada negocio</a> · Vuelve · Powered by vorka.mx</p>' })}
${await masTienda(env, 'lealtad')}
</div>`,
  });
}

const CSS = `
.vu{--vu-a:#16a36a;--vu-t:#0f241c;--vu-f:#f2f6f1;--vu-o:#ff8a3d}
.vu-hero{background:var(--vu-f);padding:clamp(28px,6vw,72px) 0;overflow:hidden}
.vu-hero-g{display:grid;gap:36px;align-items:center}
@media(min-width:900px){.vu-hero-g{grid-template-columns:1.1fr .9fr}}
.vu-logo{display:flex;align-items:center;gap:6px;font:800 34px/1 system-ui,-apple-system,sans-serif;letter-spacing:-.04em;color:var(--vu-t);margin:16px 0 10px}.vu-logo i{color:var(--vu-a);font-style:normal;font-size:.8em}
.vu-h1{font:800 clamp(36px,6.4vw,62px)/1.02 system-ui,-apple-system,sans-serif;letter-spacing:-.04em;margin:0 0 14px;color:var(--vu-t)}.vu-h1 i{font-style:normal;color:var(--vu-a)}
.vu-lead{font-size:clamp(17px,2.2vw,20px);line-height:1.55;color:#3f4a45;margin:0 0 22px;max-width:34em}
.vu-nota{color:#53605a;font-size:15px;margin-top:14px}
.vu-cel{position:relative;max-width:360px;margin:0 auto;width:100%}
.vu-tarjeta{background:linear-gradient(160deg,#1b3a2e,#0f241c);color:#fff;border-radius:24px;padding:20px;box-shadow:0 30px 60px -30px rgba(15,36,28,.7)}
.vu-t-cab{display:flex;align-items:center;gap:12px}.vu-t-logo{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#fff;font-size:22px}
.vu-t-cab b{display:block;font-size:17px}.vu-t-cab small{color:#b9d3c6;font-size:12.5px}.vu-t-nivel{margin-left:auto;background:#e8c46a;color:#3d2c00;font-weight:800;font-size:12px;padding:4px 10px;border-radius:999px}
.vu-sellos{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:18px 0 10px}
.vu-sellos span{aspect-ratio:1;border-radius:50%;border:2px dashed rgba(255,255,255,.35);display:grid;place-items:center;font-size:20px}.vu-sellos .si{background:#fff;border:0}
.vu-t-meta{margin:0;color:#d7e9df;font-size:14px}.vu-t-meta b{color:#fff}
.vu-t-pie{display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px}.vu-t-pie small{display:block;color:#b9d3c6;font-size:12px}
.vu-qr{width:64px;height:64px;border-radius:10px;background:#fff;background-image:repeating-linear-gradient(90deg,#0f241c 0 6px,transparent 6px 10px),repeating-linear-gradient(0deg,#0f241c 0 6px,transparent 6px 10px);background-blend-mode:multiply;border:6px solid #fff}
.vu-aviso{position:absolute;left:-14px;right:18px;bottom:-26px;background:#fff;border-radius:18px;padding:12px 14px;box-shadow:0 20px 40px -22px rgba(15,36,28,.6);font-size:14px;display:grid;gap:2px}
.vu-aviso b{font-size:13px;color:var(--vu-a)}
.vu-pasos{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));counter-reset:p}
.vu-pasos li{background:#fff;border:1px solid #e1e8e3;border-radius:18px;padding:18px;counter-increment:p}.vu-pasos li::before{content:counter(p);display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--vu-t);color:#fff;font-weight:800;margin-bottom:10px}
.vu-pasos b{font-size:17px}.vu-pasos p{margin:4px 0 0;color:#53605a}
.vu-ben{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.vu-ben li{background:#fff;border:1px solid #e1e8e3;border-radius:18px;padding:20px}.vu-ben span{font-size:28px}.vu-ben b{display:block;font-size:18px;margin:8px 0 4px}.vu-ben p{margin:0;color:#53605a}
.vu-planes{display:grid;gap:18px;align-items:start;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.vu-plan{position:relative;background:#fff;border:1.5px solid #e1e8e3;border-radius:22px;padding:24px;display:grid;gap:8px}
.vu-plan.rec{border-color:var(--vu-t);box-shadow:0 24px 50px -28px rgba(15,36,28,.5)}
.vu-sello{position:absolute;top:-12px;left:24px;background:var(--vu-o);color:#fff;font-size:12px;font-weight:800;padding:4px 12px;border-radius:999px}
.vu-plan h3{font:800 26px/1.1 system-ui,-apple-system,sans-serif;letter-spacing:-.03em;margin:4px 0 0}.vu-para{color:#53605a;margin:0}
.vu-precio{margin:6px 0 0}.vu-precio b{font-size:34px;letter-spacing:-.03em}.vu-precio small{color:#53605a}
.vu-plan ul{list-style:none;padding:0;margin:8px 0 12px;display:grid;gap:8px}.vu-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.vu-plan li svg{flex:none;width:18px;height:18px;margin-top:3px;color:var(--vu-a)}
.vu-total{margin:4px 0 12px;font-size:16px}.vu-total b{font-size:20px}`;

const SCRIPT = `(function(){
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
    var d={ slug:f.slug.value, sucursales:Math.max(0,parseInt(f.sucursales.value,10)||0), nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value;
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
