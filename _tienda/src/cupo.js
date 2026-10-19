// Cupo (eventos con registro, cover y QR; segunda app de Diversificación de Vorka México).
// /tienda/cupo/ → ficha comercial única: plan gratis, Cupo Pro por aforo, paquetes, preguntas y compra (usa /api/checkout de siempre).
// Los productos de Cupo (cupo-pro-*, cupo-paquete-*) no tienen página propia: redirigen aquí con ?plan=<slug>.
// La app vive en os.vorka.mx/cupo/ y los eventos en vorka.mx/cupo/<liga>. Aquí solo se vende.
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { ELEGIR } from './elegir.js';

const OS = 'https://os.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_CUPO = '/tienda/cupo/';

const NIVELES = [
  { slug: 'cupo-pro-100', personas: '100', para: 'Fiestas, reuniones y talleres' },
  { slug: 'cupo-pro', personas: '300', para: 'Fiestas grandes y eventos de negocio', recomendado: true },
  { slug: 'cupo-pro-1000', personas: '1,000', para: 'Antros, conciertos y festivales' },
  { slug: 'cupo-pro-3000', personas: '3,000', para: 'Eventos masivos' },
];
const PAQUETES = [
  { slug: 'cupo-paquete-5-100', nombre: '5 eventos de hasta 100', texto: 'Para cafés, talleres, comunidades y reuniones mensuales.' },
  { slug: 'cupo-paquete-5', nombre: '5 eventos de hasta 300', texto: 'Para organizadores que hacen un evento al mes.' },
  { slug: 'cupo-paquete-5-1000', nombre: '5 eventos de hasta 1,000', texto: 'Para antros, bares y fiestas de temporada.' },
];
const PRO = ['Entrada por correo y recordatorios un día y dos horas antes', '10 avisos por correo a tus asistentes', 'Cobro de cover sin comisión (transferencia, liga o en la puerta)',
  'Ligas para tus RPs con ranking y panel', 'Aprobar registros y preguntas propias', 'Check-in con tu equipo y lista en Excel'];
const GRATIS = ['Hasta 30 personas', 'Página del evento con tu foto o tema', 'Registro sin cuentas y entrada con QR', 'Check-in desde tu celular y lista de espera', 'Sin correos, cover ni RPs'];
const DEMOS = [['demo-halloween', 'halloween', 'Noche de Brujas', 'Fiesta con cover · transferencia o en la puerta'], ['demo-networking', 'networking', 'Café & Networking', 'Evento de negocio · con aprobación'], ['demo-fiesta', 'fiesta', 'Cumple de Vale', 'Fiesta gratis · 30 lugares']];
const FAQ = [
  ['¿Puedo usar Cupo gratis?', `Sí. Los eventos de hasta 30 personas son gratis: página, registro, entrada con QR y check-in. Entra a <a href="${OS}/cupo/">os.vorka.mx/cupo</a>, arma tu evento sin cuenta y publícalo. Pro lo activas solo si necesitas más lugares, correos, cover o RPs.`],
  ['¿Puedo armar mi evento antes de pagar?', `Sí. Arma todo (portada, cover, preguntas, tu liga) y ve cómo queda. Al publicar eliges: gratis, o Pro según tu aforo.`],
  ['¿Cuánto cuesta si van más personas?', 'Cupo Pro se paga una vez por evento según tu aforo: hasta 100 personas $99, hasta 300 $149, hasta 1,000 $299 y hasta 3,000 $599. Si se te llena, subes de nivel desde tu evento.'],
  ['¿Los correos son gratis?', 'No: la entrada por correo, los recordatorios y los avisos vienen con Pro. En el plan gratis cada persona ve su entrada al registrarse y la recupera en la página del evento con su correo y un NIP.'],
  ['¿Cupo cobra comisión por mi cover?', 'No. Las personas te pagan directo a ti (transferencia, tu liga de pago o en la puerta) y tú confirmas cada pago con un toque. Cupo solo cobra el plan Pro.'],
  ['¿Cómo funcionan las ligas de RP?', 'En tu evento entras a “RPs”, escribes el nombre de cada uno y le compartes su liga y su panel. Tú ves el ranking (registros, pagos y llegadas) y cada RP ve solo a su gente, sin correos ni teléfonos.'],
  ['¿Alguien puede entrar con el QR de otra persona?', 'No dos veces: el check-in muestra el nombre de cada entrada y no deja pasar el mismo QR otra vez. Y nadie saca la entrada de otra persona con solo su correo: se necesita su liga personal, su NIP o su correo.'],
  ['¿Qué son los paquetes?', 'Cinco eventos Pro para usar en 12 meses, hasta 20 % más baratos que comprarlos sueltos. Los aplicas al publicar cada evento.'],
  ['¿Cómo lo uso después de pagar?', 'Te llega un correo con el botón “Entrar a Cupo”. Al publicar tu evento eliges usar tu evento Pro; si ya está publicado, lo activas desde el evento.'],
  ['¿Cupo o Brindi?', 'Cupo es para lo rápido e informal: fiestas, antros, Halloween, networking y talleres. Para una boda, XV años o bautizo, donde la invitación es parte del recuerdo, te conviene <a href="/tienda/brindi/">Brindi</a>.'],
  ['¿Cómo pago? ¿Hay reembolsos?', 'Pago único con tarjeta u OXXO, procesado por Stripe. Si no has aplicado tu evento Pro a ningún evento publicado, te devolvemos tu dinero si lo pides dentro de los 10 días naturales siguientes. Detalles en las <a href="/legal/cupo/">condiciones de Cupo</a>.'],
];

export async function paginaCupo(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const niveles = (await Promise.all(NIVELES.map(async n => ({ ...n, prod: await productoPorSlug(env, n.slug) })))).filter(n => n.prod);
  const paquetes = (await Promise.all(PAQUETES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug) })))).filter(x => x.prod);
  const rec = niveles.find(n => n.recomendado) || niveles[0];
  if (rec && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: rec.prod.id, ref_code: code });
  const todos = [...niveles, ...paquetes];
  const elegido = todos.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : rec?.slug;
  const error = url.searchParams.get('error') || '';
  const desde = niveles.length ? Math.min(...niveles.map(n => n.prod.precio_centavos)) : null;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Cupo · Eventos con registro, cover y QR', brand: { '@type': 'Brand', name: 'Cupo' },
    description: 'Página de tu evento, registro sin cuentas, entrada con QR y check-in. Gratis hasta 30 personas; Cupo Pro desde $99 MXN con correos, cover sin comisión y ligas para RPs.',
    image: [`${OS}/cupo/og/halloween.png`],
    ...(niveles.length ? { offers: { '@type': 'AggregateOffer', priceCurrency: 'MXN', lowPrice: '0.00', highPrice: (Math.max(...todos.map(x => x.prod.precio_centavos)) / 100).toFixed(2), offerCount: todos.length + 1 } } : {}) },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const opcion = x => `<option value="${esc(x.slug)}"${elegido === x.slug ? ' selected' : ''}>${esc(x.etiqueta)} · ${precio(x.prod)}</option>`;
  return pagina({
    titulo: 'Cupo: página de tu evento con registro, cover y QR | Gratis hasta 30 personas', ruta: RUTA_CUPO, imagen: `${OS}/cupo/og/halloween.png`,
    descripcion: 'Crea la página de tu evento en un minuto: registro sin cuentas, entrada con QR y check-in. Gratis hasta 30 personas. Cupo Pro desde $99: correos y recordatorios, cover sin comisión y ligas para RPs.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="cu">
<section class="cu-hero"><div class="marco cu-hero-g">
  <div>
    <a class="t-volver" href="/tienda/">← Tienda</a>
    <span class="cu-logo">cupo<i>.</i></span>
    <h1 class="cu-h1">Tu evento, listo <i>en un minuto.</i></h1>
    <p class="cu-lead">Una página bonita para tu fiesta, taller o evento de negocio. La gente aparta su lugar en segundos, sin cuenta, y en la puerta escaneas su QR.</p>
    <div class="botones"><a class="btn tinta" href="${OS}/cupo/#/nuevo">Crear mi evento gratis ${FLECHA}</a><a class="btn blanco" href="#planes">Ver precios</a></div>
    <p class="cu-nota"><b>Gratis hasta 30 personas.</b> Cupo Pro desde <b>${desde ? precio({ precio_centavos: desde }) : '$99 MXN'}</b> por evento · sin comisión por tu cover · sin mensualidades</p>
  </div>
  <div class="cu-demos-h">${DEMOS.map(([s, og, t, d], i) => `<a class="cu-demo${i === 0 ? ' g' : ''}" href="${OS}/e/${s}" target="_blank" rel="noopener"><img src="${OS}/cupo/og/${og}.png" alt="" loading="${i ? 'lazy' : 'eager'}" width="1200" height="630"><span><b>${t}</b><small>${d}</small></span></a>`).join('')}</div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Así de fácil</span><h2 class="h2">De la idea a la puerta, desde tu celular</h2></div>
  <ol class="cu-pasos">${[['Arma tu evento', 'Título, fecha, lugar y portada. Lo ves como quedará, sin cuenta y sin pagar.'], ['Comparte tu liga', 'vorka.mx/cupo/tu-evento, con QR. La gente aparta su lugar con nombre y correo.'],
    ['Cobra y confirma', 'Con Pro, tu CLABE o tu liga de pago; confirmas cada pago con un toque. Sin comisión.'], ['Recibe a tu gente', 'Escaneas su QR en la puerta: nadie entra dos veces y sabes quién llegó.']].map(([t, d], k) => `<li class="rv" style="--d:${k * .05}s"><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
</div></section>

<section class="t-sec suave" id="planes"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Precios</span><h2 class="h2">Gratis para empezar. Pro según tu aforo.</h2><p class="lead">Pago único por evento, en pesos mexicanos con IVA incluido. Sin mensualidades ni comisión por boleto.</p></div>
  <div class="cu-planes">
    <article class="cu-plan"><h3>Gratis</h3><p class="cu-para">Para probar y eventos chicos</p><p class="cu-precio"><b>$0</b></p>
      <ul>${GRATIS.map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
      <a class="btn blanco" href="${OS}/cupo/#/nuevo">Crear mi evento gratis</a></article>
    <article class="cu-plan rec"><span class="cu-sello">Para eventos con cover o RPs</span><h3>Cupo Pro</h3><p class="cu-para">Elige según cuántas personas recibes</p>
      <div class="cu-niveles">${niveles.map(n => `<a class="cu-nivel${n.recomendado ? ' dest' : ''}" href="?plan=${n.slug}#comprar" data-plan="${n.slug}"><span><b>Hasta ${n.personas} personas</b><small>${n.para}</small></span><b class="num">${precio(n.prod)}</b></a>`).join('')}</div>
      <ul>${PRO.map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul></article>
  </div>
  ${paquetes.length ? `<div class="cu-paq"><div><span class="etiqueta">Paquetes de 5 eventos</span><h3>Si haces eventos seguido, hasta 20 % menos</h3><p>Todo lo de Pro en cada evento, para usar en 12 meses.</p></div>
    <div class="cu-paq-l">${paquetes.map(x => `<a class="cu-nivel" href="?plan=${x.slug}#comprar" data-plan="${x.slug}"><span><b>${x.nombre}</b><small>${x.texto}</small></span><b class="num">${precio(x.prod)}</b></a>`).join('')}</div></div>` : ''}
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Para quien organiza en serio</span><h2 class="h2">Lo que te ahorra Cupo Pro</h2></div>
  <ul class="cu-ben">${[['🎟️', 'Cover sin comisión', 'La gente te paga directo a ti. Avisan que ya pagaron y tú confirmas con un toque: les llega su entrada.'],
    ['📣', 'Ligas para tus RPs', 'Una liga y un QR por RP. Ves cuántos trajo cada quien, cuántos pagaron y cuántos llegaron. Se acabaron las capturas.'],
    ['📬', 'Correos y recordatorios', 'Cada persona recibe su entrada y un recordatorio un día antes y otro dos horas antes. Menos faltistas.'],
    ['📊', 'Tus números', 'Pon tus gastos y la ganancia que quieres: Cupo te dice cuántas entradas vender y cómo vas.']].map(([i, t, d], k) => `<li class="rv" style="--d:${(k % 2) * .05}s"><span aria-hidden="true">${i}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

${todos.length ? `<section class="t-sec suave" id="comprar"><div class="marco t-estrecho">
  <span class="etiqueta">Compra segura</span><h2 class="h2 t-h2-sec">Activa Cupo Pro</h2>
  <p class="t-nota" style="margin-top:-6px">¿Tu evento es de hasta 30 personas? No necesitas comprar nada: <a href="${OS}/cupo/#/nuevo">créalo gratis</a>.</p>
  <form class="t-form t-compra" id="form-cupo" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="slug">¿Qué quieres comprar?</label><select id="slug" name="slug">
      <optgroup label="Cupo Pro (un evento)">${niveles.map(n => opcion({ ...n, etiqueta: `Hasta ${n.personas} personas` })).join('')}</optgroup>
      ${paquetes.length ? `<optgroup label="Paquetes (5 eventos, 12 meses)">${paquetes.map(x => opcion({ ...x, etiqueta: x.nombre })).join('')}</optgroup>` : ''}</select></div>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llega tu acceso a Cupo. Si ya tienes eventos, usa el mismo correo.</small></div>
    <div id="puntos-cupo"></div>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/cupo/" target="_blank">condiciones de Cupo</a> y el <a href="/legal/cupo/privacidad/" target="_blank">aviso de privacidad de Cupo</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn tinta" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">Tarjeta · OXXO &nbsp;·&nbsp; Pago seguro con Stripe · Te llega el acceso al confirmarse el pago</p>
  </form>
</div></section>` : ''}

${ELEGIR('cupo')}
<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Preguntas frecuentes</span><h2 class="h2 t-h2-sec">Antes de empezar</h2>
  <div class="t-faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join('')}</div>
  <p class="t-nota"><a href="/legal/cupo/">Condiciones de Cupo</a> · <a href="/legal/cupo/privacidad/">Aviso de privacidad</a> · <a href="/legal/cupo/privacidad-asistentes/">Privacidad para asistentes</a> · Cupo · Powered by vorka.mx</p>
</div></section>
</div>`,
  });
}

const CSS = `
.cu{--cu-a:#ff5a36;--cu-t:#17161a;--cu-f:#f6f4f0}
.cu-hero{background:var(--cu-f);padding:clamp(28px,6vw,72px) 0;overflow:hidden}
.cu-hero-g{display:grid;gap:32px;align-items:center}
@media(min-width:900px){.cu-hero-g{grid-template-columns:1.05fr .95fr}}
.cu-logo{display:block;font:800 34px/1 system-ui,-apple-system,sans-serif;letter-spacing:-.04em;color:var(--cu-t);margin:16px 0 10px}.cu-logo i{color:var(--cu-a);font-style:normal}
.cu-h1{font:800 clamp(36px,6.4vw,62px)/1.02 system-ui,-apple-system,sans-serif;letter-spacing:-.04em;margin:0 0 14px;color:var(--cu-t)}.cu-h1 i{font-style:normal;color:var(--cu-a)}
.cu-lead{font-size:clamp(17px,2.2vw,20px);line-height:1.55;color:#4b4750;margin:0 0 22px;max-width:34em}
.cu-nota{color:#5f5b63;font-size:15px;margin-top:14px}
.cu-demos-h{display:grid;gap:12px;grid-template-columns:1fr 1fr}
.cu-demo{display:grid;background:#fff;border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;border:1px solid #e8e4dd;box-shadow:0 18px 40px -28px rgba(23,22,26,.45)}
.cu-demo.g{grid-column:1/-1}.cu-demo img{width:100%;height:auto;aspect-ratio:1200/630;object-fit:cover;display:block}
.cu-demo span{padding:10px 14px 12px}.cu-demo b{display:block;font-size:16px}.cu-demo small{color:#5f5b63;font-size:13px}
.cu-pasos{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));counter-reset:p}
.cu-pasos li{background:#fff;border:1px solid #e8e4dd;border-radius:18px;padding:18px;counter-increment:p}.cu-pasos li::before{content:counter(p);display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--cu-t);color:#fff;font-weight:800;margin-bottom:10px}
.cu-pasos b{font-size:17px}.cu-pasos p{margin:4px 0 0;color:#5f5b63}
.cu-planes{display:grid;gap:16px;align-items:start}
@media(min-width:900px){.cu-planes{grid-template-columns:.8fr 1.2fr}}
.cu-plan{position:relative;background:#fff;border:1.5px solid #e8e4dd;border-radius:22px;padding:24px;display:grid;gap:8px}
.cu-plan.rec{border-color:var(--cu-t);box-shadow:0 24px 50px -28px rgba(23,22,26,.5)}
.cu-sello{position:absolute;top:-12px;left:24px;background:var(--cu-a);color:#fff;font-size:12px;font-weight:800;padding:4px 12px;border-radius:999px}
.cu-plan h3{font:800 26px/1.1 system-ui,-apple-system,sans-serif;letter-spacing:-.03em;margin:4px 0 0}.cu-para{color:#5f5b63;margin:0}
.cu-precio{margin:6px 0 0}.cu-precio b{font-size:36px;letter-spacing:-.03em}
.cu-plan ul{list-style:none;padding:0;margin:8px 0 12px;display:grid;gap:8px}.cu-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.cu-plan li svg{flex:none;width:18px;height:18px;margin-top:3px;color:var(--cu-a)}
.cu-niveles,.cu-paq-l{display:grid;gap:8px;margin:6px 0}
.cu-nivel{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid #e8e4dd;background:var(--cu-f);text-decoration:none;color:var(--cu-t)}
.cu-nivel.dest{border:2px solid var(--cu-a);background:#fff}.cu-nivel small{display:block;color:#5f5b63;font-size:13px}.cu-nivel .num{font-size:20px;white-space:nowrap}
.cu-paq{margin-top:16px;background:#fff;border:1.5px solid #e8e4dd;border-radius:22px;padding:24px;display:grid;gap:14px}
@media(min-width:900px){.cu-paq{grid-template-columns:.8fr 1.2fr;align-items:center}}
.cu-paq h3{font:800 22px/1.15 system-ui,-apple-system,sans-serif;letter-spacing:-.02em;margin:6px 0}.cu-paq p{margin:0;color:#5f5b63}
.cu-ben{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.cu-ben li{background:#fff;border:1px solid #e8e4dd;border-radius:18px;padding:20px}.cu-ben span{font-size:28px}.cu-ben b{display:block;font-size:18px;margin:8px 0 4px}.cu-ben p{margin:0;color:#5f5b63}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-cupo'); if(!f||!window.fetch) return;
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(e){ var s=document.getElementById('slug'); if(!s) return; e.preventDefault(); s.value=a.dataset.plan; document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:f.slug.value, nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.usar_puntos&&f.usar_puntos.checked) d.usar_puntos=true;
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
