// Tienda › Tu página web (vorka.mx/tienda/pagina-web/): el plan de $299 al mes como SUSCRIPCIÓN (Stripe Billing, como Cuentas).
// El dominio no se cobra aquí: se paga por transferencia a Vorka por WhatsApp. Producto: migración 0070 (pagina-web-mensual).
// La página del servicio, con todo el detalle, es /servicios/pagina-web/ (_tienda no la genera: _sitio/paginaweb.py).
// Las condiciones (12 meses, dominio, cambios) son las mismas que allá y que en Vorka Learn (src/learn-web.js › PLAN_WEB).
import { pagina, esc } from './paginas.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { refDeVisita, precio, seccionFaq } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';

export const RUTA_PAGINA_WEB = '/tienda/pagina-web/';
export const SLUG_PAGINA_WEB = 'pagina-web-mensual';
export const WA_PAGINA_WEB = `https://wa.me/528117804869?text=${encodeURIComponent('Hola Vorka, ya pagué mi suscripción de Tu página web. ¿Qué necesitan para empezar?')}`;
const WA_DUDA = `https://wa.me/528117804869?text=${encodeURIComponent('Hola Vorka, tengo una duda sobre Tu página web de $299 al mes.')}`;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
const INCLUYE = ['Diseño de tu página, sin costo con el plan de 12 meses', 'Hospedaje con candado de seguridad (HTTPS)', 'Hasta 3 cambios pequeños al mes', 'Botón de WhatsApp y formulario de contacto', 'Alta en Google Search Console y en tu Perfil de Negocio'];
const FAQ = [
  ['¿Cómo pago el dominio?', 'Aparte, por transferencia a Vorka México. Después de suscribirte nos escribes por WhatsApp, te decimos el costo exacto de tu dominio (depende de la terminación, como .mx o .com) y te pasamos los datos. Se paga una vez al año.'],
  ['¿Cómo funciona el plan de 12 meses?', 'Tu suscripción se cobra cada mes en tu tarjeta. El diseño no tiene costo porque el plan es de 12 meses: si cancelas antes, pagas los meses que falten. Después de los 12 meses sigues mes con mes.'],
  ['¿Qué pasa después de pagar?', 'Nos escribes por WhatsApp (el botón te llega por correo y aparece al terminar el pago), te pedimos tu logo, fotos y textos, diseñamos tu página y te la mostramos antes de publicarla.'],
  ['¿El dominio queda a mi nombre?', 'Lo registramos nosotros para darte el servicio completo. Si dejas el plan, te lo transferimos para que lo sigas usando.'],
  ['¿Dónde cambio mi tarjeta o cancelo?', 'En vorka.mx/tienda/suscripcion, con el correo con el que te suscribiste.'],
];

export async function paginaPaginaWeb(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const p = await productoPorSlug(env, SLUG_PAGINA_WEB);
  if (p && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  const form = p ? `<form class="t-form t-compra" id="form-pagina-web" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llegan tu recibo y el botón para empezar por WhatsApp.</small></div>
    <p class="pw-total">Pagas hoy <b id="pw-hoy">${precio(p)}</b> <span id="pw-luego">y luego ${precio(p)} cada mes</span></p>
    <p class="pw-dominio">El dominio se paga aparte, por transferencia, una vez al año: te pasamos el costo exacto por WhatsApp.</p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, el <a href="/servicios/pagina-web/#t-cond" target="_blank">plan de 12 meses</a> con renovación automática mensual y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Suscribirme ${FLECHA}</button>
  </form>` : `<div class="t-aviso"><p>La suscripción abre muy pronto. Mientras, <a href="${WA_DUDA}">escríbenos por WhatsApp</a>.</p></div>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Service', name: 'Tu página web', provider: { '@type': 'Organization', name: 'Vorka México', url: 'https://vorka.mx/' },
    description: 'Página web para tu negocio por suscripción mensual: diseño, hospedaje con SSL, cambios cada mes, botón de WhatsApp y alta en Google.', url: `https://vorka.mx${RUTA_PAGINA_WEB}`,
    ...(p ? { offers: { '@type': 'Offer', price: (p.precio_centavos / 100).toFixed(2), priceCurrency: 'MXN', url: `https://vorka.mx${RUTA_PAGINA_WEB}`,
      priceSpecification: { '@type': 'UnitPriceSpecification', price: (p.precio_centavos / 100).toFixed(2), priceCurrency: 'MXN', unitText: 'MONTH' } } } : {}) }];
  return pagina({ navActual: 'catalogo',
    titulo: 'Tu página web por $299 al mes: suscríbete | Vorka México', ruta: RUTA_PAGINA_WEB,
    descripcion: 'Suscríbete a Tu página web: $299 al mes con diseño sin costo, hospedaje con SSL, cambios cada mes, botón de WhatsApp y alta en Google. El dominio se paga aparte.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT,
    cuerpo: `<section class="pw-hero"><div class="marco pw-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Servicios</nav>
    <span class="pw-chip">Suscripción mensual</span>
    <h1 class="t-h1">Tu página web por <span class="metal">${p ? precio(p).replace(' MXN', '') : '$299'} al mes.</span></h1>
    <p class="t-lead">La diseñamos, la publicamos y la mantenemos por ti. Te suscribes aquí con tarjeta y empezamos por WhatsApp.</p>
    <ul class="pw-inc">${INCLUYE.map(x => `<li>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>
    <p class="t-ya"><a href="/servicios/pagina-web/">Ver todo el detalle del servicio</a> · <a href="${WA_DUDA}" target="_blank" rel="noopener">¿Dudas? WhatsApp</a></p>
  </div>
  <aside id="comprar" aria-label="Suscribirme">${form}</aside>
</div></section>
${seccionFaq({ titulo: 'Antes de suscribirte', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('') })}`,
  });
}

const CSS = `.pw-hero{padding:clamp(12px,3vw,40px) 0 clamp(40px,5vw,64px)}
.pw-g{display:grid;gap:28px 56px;align-items:start}@media(min-width:980px){.pw-g{grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr)}}
.pw-g>*{min-width:0}
.pw-chip{display:inline-flex;margin-top:14px;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;background:var(--morado-suave);color:var(--morado)}
.pw-hero h1{margin-top:14px}.pw-hero .t-lead{margin-top:14px;max-width:560px}
.pw-inc{display:grid;gap:10px;margin:22px 0 0}.pw-inc li{display:flex;gap:10px;align-items:flex-start;font-size:16px;color:var(--fg-2)}.pw-inc svg{width:18px;height:18px;flex:none;margin-top:3px;color:var(--verde)}
#comprar .t-form{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(18px,3vw,28px);box-shadow:var(--sombra-2)}
.pw-total{font-size:15.5px;margin:6px 0 4px}.pw-total b{font-size:22px;letter-spacing:-.02em}
.pw-dominio{font-size:14px;color:var(--fg-2);margin:0 0 12px;padding:10px 12px;border-radius:12px;background:var(--bg-2)}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-pagina-web'); if(!f||!window.fetch) return;
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:'${SLUG_PAGINA_WEB}', sucursales:0, nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value) d.codigo=f.codigo.value.trim();
    if(!d.nombre||d.nombre.trim().length<2){ f.nombre.focus(); return mostrar('Te faltó poner tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Revisa tu correo: parece que le falta algo.'); }
    if(!d.terminos) return mostrar('Para seguir, acepta los términos, el plan de 12 meses y el aviso de privacidad.');
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo el pago…';
    fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok&&x.j.url) location.href=x.j.url; else mostrar(x.j.error||'No pudimos abrir el pago. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
})();`;
