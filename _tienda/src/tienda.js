// /tienda            → catálogo (productos activos de D1)
// /tienda/<slug>     → página de venta con formulario de compra
// /tienda/sitemap.xml → sitemap dinámico de la tienda
// ?ref=CODIGO en cualquier página de la tienda guarda la cookie vorka_ref (30 días) si el afiliado existe y está activo.
import { pesos } from './util.js';
import { listarProductos, productoPorSlug, afiliadoActivo, registrarAnalitica } from './modelo.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA, CHECK, LOGO } from './marco.generado.js';

const SITIO = 'https://vorka.mx';
const COOKIE_DIAS = 30;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;

// Preguntas que aplican a todos los productos digitales (se suman a las del producto)
const FAQ_TIENDA = [
  { p: '¿Cómo recibo mis archivos?', r: 'En cuanto se confirma tu pago te llega un correo con un enlace de descarga. Funciona 7 días y puedes descargar cada archivo hasta 10 veces. Si se vence, pides uno nuevo en <a href="/descargas/reenviar">vorka.mx/descargas/reenviar</a>.' },
  { p: '¿Cómo puedo pagar?', r: 'Con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI. El pago es seguro y lo procesa Stripe; nosotros nunca vemos los datos de tu tarjeta.' },
  { p: 'Pagué en OXXO o por SPEI, ¿cuándo me llega?', r: 'En cuanto el pago se refleja te llega el correo automáticamente. En OXXO suele tardar unos minutos y tienes 3 días para pagar con tu referencia.' },
  { p: '¿Hay reembolsos?', r: 'Por ser un producto digital descargable no hay reembolso una vez descargado. Si un archivo llega dañado o no abre, te lo reponemos. Consulta la <a href="/legal/reembolsos/">política de reembolsos</a>.' },
  { p: '¿Me pueden facturar?', r: 'Sí. Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tus datos fiscales y el número de orden que viene en tu correo, dentro del mismo mes de la compra.' },
];

// Guarda la cookie de afiliado (si el código es válido) y devuelve el código vigente
export async function refDeVisita(env, req, url) {
  const nuevo = url.searchParams.get('ref');
  if (nuevo && /^[A-Za-z0-9_-]{1,40}$/.test(nuevo)) {
    const a = await afiliadoActivo(env, nuevo);
    if (a) return { code: a.code, cookie: `vorka_ref=${a.code}; Max-Age=${COOKIE_DIAS * 86400}; Path=/; Secure; HttpOnly; SameSite=Lax` };
  }
  return { code: null, cookie: null };
}

// Portada: la imagen del producto o, si no hay, una portada con la V y el nombre
const portada = (p, clase = '') => p.imagen
  ? `<img class="t-portada-img ${clase}" src="${esc(p.imagen)}" alt="Portada de ${esc(p.nombre)}" width="1200" height="1500" decoding="async">`
  : `<div class="t-portada ${clase}" role="img" aria-label="Portada de ${esc(p.nombre)}"><span class="t-portada-v">${LOGO}</span><b>${esc(p.contenido.portada || p.nombre.split(':')[0])}</b><small>Vorka México</small></div>`;

const precio = p => p.precio_centavos % 100 ? pesos(p.precio_centavos) : `$${(p.precio_centavos / 100).toLocaleString('es-MX')} MXN`;

export async function paginaCatalogo(env, req, url) {
  const { cookie } = await refDeVisita(env, req, url);
  const productos = await listarProductos(env);
  const tarjetas = productos.map((p, i) => `
    <a class="t-prod rv" style="--d:${(i % 3) * 0.06}s" href="/tienda/${esc(p.slug)}/">
      <div class="t-prod-img">${portada(p)}</div>
      <div class="t-prod-t">
        ${p.categoria ? `<span class="t-cat">${esc(p.categoria)}</span>` : ''}
        <h2>${esc(p.nombre)}</h2>
        <p>${esc(p.descripcion_corta)}</p>
        <div class="t-prod-pie"><b class="num">${precio(p)}</b><span class="flecha">Ver ${FLECHA}</span></div>
      </div>
    </a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: productos.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}/tienda/${p.slug}/`, name: p.nombre })) };
  return pagina({
    titulo: 'Tienda · Vorka México', ruta: '/tienda/',
    descripcion: 'Kits, guías y herramientas digitales de Vorka México para lanzar y hacer crecer tu negocio o proyecto social. Descarga inmediata.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    cuerpo: `
<section class="t-sec t-cab"><div class="marco">
  <span class="etiqueta">Tienda</span>
  <h1 class="h1 t-titulo">Herramientas para <span class="metal">pasar a la acción.</span></h1>
  <p class="lead">Kits, guías y plantillas que usamos con nuestros clientes, listos para descargar y trabajar a tu ritmo.</p>
</div></section>
<section class="t-sec t-sin-arriba"><div class="marco">
  ${productos.length ? `<div class="t-grid">${tarjetas}</div>` : `<p class="t-vacio">Muy pronto tendremos productos aquí. Mientras tanto, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>`}
  <ul class="t-garantias">
    <li>${CHECK}<span><b>Descarga inmediata</b> por correo al confirmar tu pago</span></li>
    <li>${CHECK}<span><b>Tarjeta, OXXO o SPEI</b> con pago seguro de Stripe</span></li>
    <li>${CHECK}<span><b>Soporte real</b> por correo y WhatsApp si algo falla</span></li>
  </ul>
</div></section>`,
  });
}

// Formulario de compra: funciona sin JavaScript (POST normal → 303 a Stripe) y con JavaScript (fetch + errores en línea)
const formCompra = (p, { error = '', ref = '' } = {}) => `
<form class="t-form t-compra" id="form-compra" method="post" action="/api/checkout" novalidate>
  <input type="hidden" name="slug" value="${esc(p.slug)}">
  ${ref ? `<input type="hidden" name="ref" value="${esc(ref)}">` : ''}
  <div class="t-precio"><b class="num">${precio(p)}</b><span>Pago único · descarga inmediata</span></div>
  <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
  <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llegan tus archivos.</small></div>
  <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos y condiciones</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
  <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
  <button class="btn tinta" type="submit" id="btn-compra">Comprar ahora ${FLECHA}</button>
  <p class="t-pago">Tarjeta · OXXO · SPEI &nbsp;·&nbsp; Pago seguro con Stripe</p>
</form>`;

const SCRIPT_COMPRA = `(function(){
  var f=document.getElementById('form-compra'); if(!f||!window.fetch) return;
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={}; new FormData(f).forEach(function(v,k){d[k]=v;}); d.terminos=!!f.terminos.checked;
    if(!d.nombre||d.nombre.trim().length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido.'); }
    if(!d.terminos){ return mostrar('Debes aceptar los términos y el aviso de privacidad.'); }
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo el pago…';
    fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok&&x.j.url){ location.href=x.j.url; } else mostrar(x.j.error||'No pudimos abrir el pago. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
  // Barra fija en celular: se oculta cuando el formulario está a la vista
  var barra=document.getElementById('barra-compra');
  if(barra&&'IntersectionObserver' in window) new IntersectionObserver(function(es){ barra.classList.toggle('oculta',es[0].isIntersecting); }).observe(f);
})();`;

const lista = items => `<ul class="t-lista">${items.map(t => `<li>${CHECK}<span>${typeof t === 'string' ? esc(t) : `<b>${esc(t.titulo)}</b>${t.texto ? ` ${esc(t.texto)}` : ''}`}</span></li>`).join('')}</ul>`;

export async function paginaProducto(env, req, url, slug) {
  const p = await productoPorSlug(env, slug);
  if (!p) return pagina({
    titulo: 'Producto no disponible · Vorka México', ruta: `/tienda/${slug}/`, noindex: true, status: 404,
    cuerpo: aviso({ clase: 'alerta', titulo: 'Este producto no está disponible', texto: 'Puede que ya no esté a la venta o que el enlace tenga un error.',
      extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/">Ver la tienda ${FLECHA}</a></div>` }),
  });
  const { code, cookie } = await refDeVisita(env, req, url);
  if (!BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code });

  const c = p.contenido;
  const ruta = `/tienda/${p.slug}/`;
  const imagen = p.imagen ? new URL(p.imagen, SITIO).toString() : undefined;
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.nombre, description: p.descripcion_corta, sku: p.id,
    brand: { '@type': 'Brand', name: 'Vorka México' }, ...(imagen ? { image: [imagen] } : {}),
    offers: { '@type': 'Offer', url: SITIO + ruta, price: (p.precio_centavos / 100).toFixed(2), priceCurrency: p.moneda, availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Vorka México' } },
  };
  const faq = [...(c.faq || []), ...FAQ_TIENDA];
  const pasos = c.pasos || [];

  return pagina({
    titulo: `${p.nombre} · Vorka México`, descripcion: p.descripcion_corta, ruta, imagen,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT_COMPRA,
    cuerpo: `
<section class="t-sec t-hero"><div class="marco t-hero-g">
  <div class="t-hero-txt">
    <a class="t-volver" href="/tienda/">← Tienda</a>
    <h1 class="t-h1 t-nombre">${esc(c.titular || p.nombre)}</h1>
    ${c.titular ? `<p class="t-sub">${esc(p.nombre)}</p>` : ''}
    <p class="t-lead">${esc(c.subtitulo || p.descripcion_corta)}</p>
    <div class="t-portada-hero">${portada(p, 'grande')}</div>
    ${c.incluye?.length ? `<div class="t-bloque rv"><h2 class="t-h2">Qué incluye</h2>${lista(c.incluye)}</div>` : ''}
  </div>
  <aside class="t-hero-compra" id="comprar" aria-label="Comprar">
    ${formCompra(p, { error: url.searchParams.get('error') || '', ref: code || '' })}
  </aside>
</div></section>
${pasos.length ? `<section class="t-sec suave"><div class="marco">
  <div class="cab rv"><span class="etiqueta">El camino</span><h2 class="h2">${pasos.length === 7 ? 'Los 7 pasos' : 'Paso a paso'}</h2></div>
  <ol class="t-pasos">${pasos.map((s, i) => `<li class="rv" style="--d:${(i % 4) * 0.05}s"><span class="t-paso-n num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.titulo)}</h3>${s.texto ? `<p>${esc(s.texto)}</p>` : ''}</li>`).join('')}</ol>
</div></section>` : ''}
${c.para_quien?.length ? `<section class="t-sec"><div class="marco t-estrecho">
  <div class="rv"><span class="etiqueta">Para quién es</span><h2 class="h2 t-h2-sec">Te sirve si…</h2>${lista(c.para_quien)}</div>
</div></section>` : ''}
<section class="t-sec${c.para_quien?.length ? ' suave' : ''}"><div class="marco t-estrecho">
  <span class="etiqueta">Preguntas frecuentes</span><h2 class="h2 t-h2-sec">Antes de comprar</h2>
  <div class="t-faq">${faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${f.r}</div></details>`).join('')}</div>
  <div class="botones t-faq-cta"><a class="btn tinta" href="#comprar">Comprar por ${precio(p)} ${FLECHA}</a></div>
</div></section>
<div class="t-barra" id="barra-compra"><div><b class="num">${precio(p)}</b><small>Descarga inmediata</small></div><a class="btn tinta chico" href="#comprar">Comprar</a></div>`,
  });
}

export async function sitemapTienda(env) {
  const ps = await listarProductos(env);
  const urls = [`<url><loc>${SITIO}/tienda/</loc><priority>0.8</priority></url>`,
    ...ps.map(p => `<url><loc>${SITIO}/tienda/${p.slug}/</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><priority>0.7</priority></url>`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls.join('\n  ')}\n</urlset>\n`,
    { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
