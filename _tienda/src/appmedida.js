// Tienda › App a la medida (vorka.mx/tienda/app-a-la-medida/): Vorka diseña y desarrolla una app solo para ese negocio y la
// publica en App Store y Google Play con su cuenta de desarrollador (migración 0099). Se cobra como Tu página web:
// suscripción de $999 al mes + pago único de $501 con el primer mes = $1,500 el mes de preparación. Plan mínimo de 12 meses.
// Apple rechaza las apps hechas en serie desde una plantilla (regla 4.2.6): cada app se hace de verdad para su negocio.
import { attrPlanesCarrito } from './carrito.js';
import { pagina, esc } from './paginas.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { one } from './util.js';
import { refDeVisita, precio, seccionFaq } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { barraCompra } from './barra-compra.js';

export const RUTA_APP_MEDIDA = '/tienda/app-a-la-medida/';
export const SLUG_APP_MEDIDA = 'app-medida-mensual';
export const WA_APP_MEDIDA = `https://wa.me/528117804869?text=${encodeURIComponent('Hola Vorka, ya pagué mi App a la medida. ¿Cuándo empezamos?')}`;
const WA_DUDA = `https://wa.me/528117804869?text=${encodeURIComponent('Hola Vorka, quiero una app para mi negocio. ¿Me cuentan cómo funciona?')}`;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
const INCLUYE = [
  'Una app pensada solo para tu negocio, con tu nombre, tu logo y tus colores',
  'Publicada en App Store (iPhone) y Google Play (Android)',
  'Avisos directos al celular de tus clientes: citas, promociones y novedades',
  'Un mes de preparación: la diseñamos contigo y te la mostramos antes de publicarla',
  'Mantenimiento cada mes: ajustes, actualizaciones de iOS y Android y revisiones de las tiendas',
  'Somos tu equipo de tecnología: te asesoramos y hacemos crecer tu app junto con tu negocio',
];
// Lo que cubre la mensualidad de $999 (decidido 2026-11-25: límites para que una app con mucho uso o un proyecto de startup
// no quede dentro del plan básico). Si se pasa, el plan sube según el uso, siempre avisando antes.
const LIMITES = [
  ['Usuarios', 'Hasta 1,000 personas usando tu app cada mes'],
  ['Almacenamiento', 'Hasta 5 GB para fotos, archivos y datos de tu app, con respaldo diario'],
  ['Avisos', 'Hasta 10,000 avisos al celular de tus clientes cada mes'],
  ['Cambios y mejoras', 'Hasta 4 horas al mes de cambios, funciones nuevas y asesoría'],
];
const FAQ = [
  ['¿Qué pasa si mi app crece?', 'Tu plan crece con ella. Si un mes pasas de lo que incluye la mensualidad (usuarios, almacenamiento, avisos u horas de cambios), te avisamos antes y te proponemos el siguiente nivel según tu uso real. Nunca te cobramos un extra sin avisarte.'],
  ['¿Sirve para una startup o un proyecto grande?', 'El plan de $999 es para negocios. Si tu app es el negocio en sí (una startup, un marketplace, pagos entre usuarios, miles de usuarios desde el inicio o conexiones con otros sistemas), la cotizamos aparte, con un plan a la medida de lo que necesita.'],
  ['¿Mis datos son míos?', 'Sí. Lo que se guarda en tu app es tuyo: lo respaldamos todos los días y, si un día te vas, te entregamos una copia.'],
  ['¿Cómo funciona el pago?', 'Hoy pagas $1,500 por tu mes de preparación: en ese mes diseñamos, desarrollamos y publicamos tu app. Después se cobran $999 cada mes en tu tarjeta. El plan es de 12 meses: si cancelas antes, pagas los meses que falten. Después de los 12 meses sigues mes con mes.'],
  ['¿Qué tipo de app me pueden hacer?', 'La que tu negocio necesite: citas, catálogo y pedidos, tarjeta de puntos, avisos a tus clientes, reservaciones, menú, cursos y más. Antes de empezar platicamos por WhatsApp qué quieres que haga y te decimos con claridad qué entra en tu plan.'],
  ['¿Con qué cuenta se publica?', 'La publicamos con la cuenta de desarrollador de Vorka en App Store y Google Play, con tu autorización para usar tu marca. No tienes que abrir cuentas ni pagar licencias de Apple o Google. Si un día prefieres tenerla en tu propia cuenta, te la transferimos.'],
  ['¿Cuándo aparece en las tiendas?', 'Al terminar el mes de preparación la mandamos a revisión. Apple y Google revisan cada app antes de publicarla y suelen tardar de unos días a dos semanas. Si piden cambios, los hacemos sin costo extra.'],
  ['¿Hay giros que no se pueden?', 'Sí. Apple y Google piden que las apps de bancos, préstamos, salud, apuestas y otros giros regulados se publiquen con la cuenta del propio negocio. Si tu negocio es de esos, te lo decimos antes de cobrarte.'],
  ['¿Qué pasa si cancelo o dejo de pagar?', 'Al terminar tu plan puedes cancelar cuando quieras. Si cancelas, la app se retira de las tiendas o te la transferimos a tu propia cuenta de desarrollador. Si dejas de pagar, la app se retira.'],
  ['¿Dónde cambio mi tarjeta o cancelo?', 'En vorka.mx/tienda/suscripcion, con el correo con el que te suscribiste.'],
];

export async function paginaAppMedida(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const p = await productoPorSlug(env, SLUG_APP_MEDIDA);
  // El pago único (prod_app_medida_preparacion): el checkout lo agrega siempre; aquí solo se muestra en el total
  const prep = p?.contenido?.suscripcion?.instalacion ? await one(env, 'SELECT precio_centavos FROM products WHERE id = ? AND activo = 1', p.contenido.suscripcion.instalacion) : null;
  if (p && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  const hoy = p ? { precio_centavos: p.precio_centavos + (prep?.precio_centavos || 0) } : null;
  const form = p && prep ? `<form class="t-form t-compra" id="form-app-medida" method="post" action="/api/checkout" novalidate${attrPlanesCarrito([p])}>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llegan tu recibo y el botón para empezar por WhatsApp.</small></div>
    <p class="am-total">Pagas hoy <b>${precio(hoy)}</b> <span>por tu mes de preparación y luego ${precio(p)} cada mes</span></p>
    <p class="am-desglose">Tu primer mes (${precio(p)}) + preparación de tu app (${precio(prep)}, una sola vez).</p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, el plan de 12 meses con renovación automática mensual (si cancelo antes, pago los meses que falten; si dejo de pagar, la app se retira de las tiendas), los límites de uso de la mensualidad (si los paso, el plan sube según el uso, con aviso previo), autorizo a Vorka a publicar la app con mi marca y acepto el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Empezar mi app ${FLECHA}</button>
    <p class="am-wa"><a href="${WA_DUDA}" target="_blank" rel="noopener">¿Primero quieres platicar tu idea? Escríbenos por WhatsApp</a></p>
  </form>` : `<div class="t-aviso"><p>La contratación en línea abre muy pronto. Mientras, <a href="${WA_DUDA}">escríbenos por WhatsApp</a>.</p></div>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Service', name: 'App a la medida', provider: { '@type': 'Organization', name: 'Vorka México', url: 'https://vorka.mx/' },
    description: 'Diseño y desarrollo de la app de tu negocio, publicada en App Store y Google Play, con mantenimiento mensual.', url: `https://vorka.mx${RUTA_APP_MEDIDA}`,
    ...(p ? { offers: { '@type': 'Offer', price: (p.precio_centavos / 100).toFixed(2), priceCurrency: 'MXN', url: `https://vorka.mx${RUTA_APP_MEDIDA}`,
      priceSpecification: { '@type': 'UnitPriceSpecification', price: (p.precio_centavos / 100).toFixed(2), priceCurrency: 'MXN', unitText: 'MONTH' } } } : {}) }];
  return pagina({ navActual: 'catalogo',
    titulo: 'App a la medida para tu negocio en App Store y Google Play | Vorka México', ruta: RUTA_APP_MEDIDA,
    descripcion: 'La app de tu negocio, hecha a la medida y publicada en App Store y Google Play: $1,500 el mes de preparación y luego $999 al mes, con mantenimiento incluido.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT,
    cuerpo: `<section class="am-hero"><div class="marco am-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Servicios</nav>
    <span class="am-chip">Hecha solo para tu negocio</span>
    <h1 class="t-h1">Tu negocio con <span class="metal">su propia app.</span></h1>
    <p class="t-lead">Tus clientes la descargan de App Store o Google Play, les llegan tus avisos al celular y te encuentran con un toque. Nosotros la diseñamos, la publicamos y la mantenemos.</p>
    <figure class="am-portada"><img src="/assets/tienda/v3/app-medida-portada.webp?v=2" width="1600" height="1200" alt="Ejemplo de una app de negocio en el celular, con avisos para sus clientes y disponible en App Store y Google Play"></figure>
    <ul class="am-inc">${INCLUYE.map(x => `<li>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>
    <p class="t-ya"><a href="${WA_DUDA}" target="_blank" rel="noopener">¿Dudas? WhatsApp</a></p>
  </div>
${barraCompra({ titulo: 'App a la medida', detalle: p ? `${precio(p)} al mes · 12 meses` : '', href: '#comprar', boton: 'Empezar' })}
  <aside id="comprar" aria-label="Empezar mi app">${form}</aside>
</div></section>
<section class="am-lim"><div class="marco">
  <h2 class="t-h2">Lo que incluye tu mensualidad</h2>
  <p class="am-lim-intro">Somos el equipo de tecnología de tu negocio: guardamos tu información, cuidamos que la app funcione y la hacemos crecer contigo. Tu plan de $999 al mes incluye:</p>
  <dl class="am-lim-g">${LIMITES.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  <p class="am-lim-nota">Si tu app pasa de esto, tu plan crece según su uso y siempre te avisamos antes. Las startups y los proyectos grandes se cotizan aparte.</p>
</div></section>
${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('') })}`,
  });
}

const CSS = `.am-hero{padding:clamp(12px,3vw,40px) 0 clamp(40px,5vw,64px)}
.am-g{display:grid;gap:28px 56px;align-items:start}@media(min-width:980px){.am-g{grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr)}}
.am-g>*{min-width:0}
.am-chip{display:inline-flex;margin-top:14px;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;background:var(--morado-suave);color:var(--morado)}
.am-portada{margin:22px 0 0;border-radius:var(--r);overflow:hidden;border:1px solid var(--line);box-shadow:var(--sombra-2)}.am-portada img{display:block;width:100%;height:auto}
.am-hero h1{margin-top:14px}.am-hero .t-lead{margin-top:14px;max-width:560px}
.am-inc{display:grid;gap:10px;margin:22px 0 0}.am-inc li{display:flex;gap:10px;align-items:flex-start;font-size:16px;color:var(--fg-2)}.am-inc svg{width:18px;height:18px;flex:none;margin-top:3px;color:var(--verde)}
#comprar .t-form{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(18px,3vw,28px);box-shadow:var(--sombra-2)}
.am-total{font-size:15.5px;margin:6px 0 4px}.am-total b{font-size:22px;letter-spacing:-.02em}.am-desglose{font-size:14px;color:var(--fg-2);margin:0 0 12px}
.am-lim{padding:clamp(28px,4vw,56px) 0}.am-lim-intro{margin-top:12px;max-width:720px;font-size:17px;color:var(--fg-2)}
.am-lim-g{display:grid;gap:14px;margin:22px 0 0}@media(min-width:760px){.am-lim-g{grid-template-columns:repeat(2,minmax(0,1fr))}}
.am-lim-g>div{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px}.am-lim-g dt{font-weight:750;font-size:16px}.am-lim-g dd{margin:4px 0 0;color:var(--fg-2);font-size:15.5px}
.am-lim-nota{margin-top:16px;font-size:15px;color:var(--fg-2)}
.am-wa{font-size:14px;margin:12px 0 0;text-align:center}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-app-medida'); if(!f||!window.fetch) return;
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:'${SLUG_APP_MEDIDA}', sucursales:0, nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked, instalacion:true }; if(f.ref) d.ref=f.ref.value;
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
