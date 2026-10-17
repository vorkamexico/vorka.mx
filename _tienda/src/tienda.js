// /tienda            → catálogo (productos activos de D1)
// /tienda/<slug>     → página de venta con formulario de compra
// /tienda/sitemap.xml → sitemap dinámico de la tienda
// ?ref=CODIGO en cualquier página de la tienda guarda la cookie vorka_ref (30 días) si el afiliado existe y está activo.
import { pesos } from './util.js';
import { listarProductos, productoPorSlug, productoPorSlugAnterior, afiliadoActivo, registrarAnalitica } from './modelo.js';
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

// Para productos de acceso (apps como el Simulador PAA): cómo se recibe y la política de reembolso cambian
const FAQ_ACCESO = [
  { p: '¿Cómo recibo mi acceso?', r: 'En cuanto se confirma tu pago te llega un correo con el botón para entrar. Si cambias de dispositivo o lo pierdes, pide uno nuevo en <a href="/descargas/reenviar">vorka.mx/descargas/reenviar</a> con el correo de tu compra.' },
  FAQ_TIENDA[1], FAQ_TIENDA[2],
  { p: '¿Hay reembolsos?', r: 'Por ser un producto digital de acceso inmediato no hay reembolso una vez que entras. Si algo no funciona, escríbenos y lo resolvemos. Consulta la <a href="/legal/reembolsos/">política de reembolsos</a>.' },
  FAQ_TIENDA[4],
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

export const precio = p => p.precio_centavos % 100 ? pesos(p.precio_centavos) : `$${(p.precio_centavos / 100).toLocaleString('es-MX')} MXN`;

// Portada de la tienda: hero con el producto destacado (el primero del orden del catálogo), cómo funciona y el resto del catálogo
// Secciones del catálogo según la categoría del producto (se agrupan sin importar mayúsculas ni acentos).
// Una categoría nueva desde el panel aparece sola como sección con su propio nombre.
const SECCIONES_TIENDA = [
  { id: 'examenes', claves: ['examenes', 'educacion'], titulo: 'Preparación para exámenes', texto: 'Simuladores con tutor y reporte de preparación para llegar seguro a tu examen de admisión.' },
  { id: 'emprender', claves: ['kits', 'emprender'], titulo: 'Kits para emprender', texto: 'Herramientas paso a paso para ordenar tu idea, validarla con clientes y hacer tus números.' },
];
const sinAcentos = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function seccionesCatalogo(productos) {
  const grupos = new Map();
  for (const p of productos) {
    const k = sinAcentos(p.categoria);
    const def = SECCIONES_TIENDA.find(s => s.claves.includes(k));
    const id = def?.id || (k ? k.replace(/[^a-z0-9]+/g, '-') : 'mas');
    if (!grupos.has(id)) grupos.set(id, { id, titulo: def?.titulo || p.categoria || 'Más productos', texto: def?.texto || '', productos: [] });
    grupos.get(id).productos.push(p);
  }
  // El orden de las secciones sigue al primer producto de cada una (campo "orden" del panel)
  return [...grupos.values()];
}
// Producto que abre una app (Simulador PAA) en lugar de entregar archivos
const esAcceso = p => !!p.contenido?.acceso;
const enlace = p => p.contenido?.acceso?.ruta || `/tienda/${p.slug}/`;

export async function paginaCatalogo(env, req, url) {
  const { cookie } = await refDeVisita(env, req, url);
  const productos = await listarProductos(env);
  const [destacado] = productos;
  const secciones = seccionesCatalogo(productos);
  const tarjeta = (p, i) => `
    <a class="t-prod rv" style="--d:${(i % 3) * 0.06}s" href="${esc(enlace(p))}">
      <div class="t-prod-img">${portada(p)}</div>
      <div class="t-prod-t">
        <span class="t-cat">${esAcceso(p) ? 'Acceso en línea' : 'Descarga digital'}</span>
        <h2>${esc(p.nombre)}</h2>
        <p>${esc(p.descripcion_corta)}</p>
        <div class="t-prod-pie"><b class="num">${precio(p)}</b><span class="flecha">Ver ${FLECHA}</span></div>
      </div>
    </a>`;
  const incluye = (destacado?.contenido?.incluye || []).slice(0, 3);
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: productos.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}/tienda/${p.slug}/`, name: p.nombre })) };
  return pagina({
    titulo: 'Tienda · Vorka México', ruta: '/tienda/',
    descripcion: 'Simulador PAA, kits y herramientas digitales de Vorka México para preparar tu examen de admisión o lanzar tu negocio. Entrega inmediata.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    cuerpo: `
<section class="t-inicio"><div class="marco t-inicio-g">
  <div class="t-inicio-txt">
    <span class="etiqueta">Tienda Vorka México</span>
    <h1 class="h1 t-inicio-h1">Herramientas para <span class="metal">pasar a la acción.</span></h1>
    <p class="lead">Simuladores de examen, kits y plantillas que usamos con nuestros estudiantes y clientes. Cómpralos hoy y empieza a usarlos en minutos, a tu ritmo.</p>
    <div class="botones"><a class="btn tinta" href="${destacado ? esc(enlace(destacado)) : '#productos'}">${destacado ? 'Ver el destacado' : 'Ver productos'} ${FLECHA}</a>${productos.length > 1 ? `<a class="btn blanco" href="#productos">Todo el catálogo</a>` : ''}</div>
    <ul class="t-sellos" aria-label="Por qué comprar aquí">
      <li>${CHECK}<span>Entrega inmediata</span></li>
      <li>${CHECK}<span>Tarjeta, OXXO o SPEI</span></li>
      <li>${CHECK}<span>Soporte real</span></li>
    </ul>
  </div>
  ${destacado ? `<a class="t-destacado" href="${esc(enlace(destacado))}" aria-label="${esc(destacado.nombre)}">
    <span class="t-destacado-sello">Destacado</span>
    <div class="t-destacado-img">${portada(destacado)}</div>
    <div class="t-destacado-t">
      <h2>${esc(destacado.nombre)}</h2>
      <p>${esc(destacado.descripcion_corta)}</p>
      ${incluye.length ? `<ul>${incluye.map(x => `<li>${CHECK}<span>${esc(x.titulo)}</span></li>`).join('')}</ul>` : ''}
      <div class="t-prod-pie"><b class="num">${precio(destacado)}</b><span class="flecha">Conócelo ${FLECHA}</span></div>
    </div>
  </a>` : ''}
</div></section>
${destacado?.contenido?.regalable ? `<section class="t-gancho"><div class="marco t-gancho-g">
  <div>
    <span class="etiqueta">Nuevo · Producto estrella</span>
    <h2 class="h2">${esc(destacado.contenido.titular || destacado.nombre)}</h2>
    <p class="lead">${esc(destacado.descripcion_corta)}</p>
    <ul class="t-gancho-l">${(destacado.contenido.incluye || []).slice(0, 3).map(x => `<li>${CHECK}<span>${esc(x.titulo)}</span></li>`).join('')}</ul>
    <div class="botones"><a class="btn plata" href="${esc(enlace(destacado))}">Conócelo ${FLECHA}</a><a class="btn vidrio" href="${esc(enlace(destacado))}?regalo=1#comprar">🎁 Regalarlo</a></div>
  </div>
  <a class="t-gancho-img" href="${esc(enlace(destacado))}" tabindex="-1" aria-hidden="true"><img src="/tienda/img/portadas/simulador-paa-reporte.png" alt="" loading="lazy" width="1600" height="900"></a>
</div></section>` : ''}
<section class="t-sec t-como suave"><div class="marco">
  <ol class="t-como-g">
    <li class="rv"><span class="num">01</span><b>Elige tu herramienta</b><p>Cada producto explica qué incluye y para quién es, antes de pagar.</p></li>
    <li class="rv" style="--d:.06s"><span class="num">02</span><b>Paga seguro</b><p>Con tarjeta, en efectivo en OXXO o por SPEI. Lo procesa Stripe.</p></li>
    <li class="rv" style="--d:.12s"><span class="num">03</span><b>Recíbelo al momento</b><p>Te llega un correo con tus archivos o tu acceso en cuanto se confirma el pago.</p></li>
  </ol>
</div></section>
<section class="t-sec" id="productos"><div class="marco">
  <div class="cab rv"><span class="etiqueta">Catálogo</span><h2 class="h2">${productos.length > 1 ? 'Todo lo que puedes llevarte' : 'Lo que puedes llevarte'}</h2></div>
  ${secciones.length > 1 ? `<nav class="t-secciones-nav" aria-label="Secciones de la tienda">${secciones.map(g => `<a href="#${esc(g.id)}">${esc(g.titulo)}<small class="num">${g.productos.length}</small></a>`).join('')}</nav>` : ''}
  ${productos.length ? secciones.map(g => `
  <section class="t-seccion" id="${esc(g.id)}" aria-labelledby="sec-${esc(g.id)}">
    <div class="t-seccion-cab rv"><h3 class="h3" id="sec-${esc(g.id)}">${esc(g.titulo)}</h3>${g.texto ? `<p>${esc(g.texto)}</p>` : ''}</div>
    <div class="t-grid">${g.productos.map(tarjeta).join('')}</div>
  </section>`).join('') : `<p class="t-vacio">Muy pronto tendremos productos aquí. Mientras tanto, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>`}
  <p class="t-nota t-ayuda-pie">¿Dudas antes de comprar? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. ${env.MARKETPLACE === '1' ? '¿Creas recursos? <a href="/creadores">Vende en la tienda</a>.' : ''}</p>
</div></section>`,
  });
}

// Formulario de compra: funciona sin JavaScript (POST normal → 303 a Stripe) y con JavaScript (fetch + errores en línea)
// Formulario de compra. Los productos con contenido.regalable muestran "Para mí / Para regalar":
// al regalar se eligen cuántos (una liga de un solo uso por unidad), para quién y un mensaje.
// Sin JavaScript también funciona (el bloque de regalo se muestra con :has() y el servidor valida).
export const formCompra = (p, { error = '', ref = '', regalo = false } = {}) => {
  const regalable = !!p.contenido?.regalable;
  return `
<form class="t-form t-compra${regalable ? ' t-regalable' : ''}" id="form-compra" method="post" action="/api/checkout" novalidate data-unidad="${p.precio_centavos}">
  <input type="hidden" name="slug" value="${esc(p.slug)}">
  ${ref ? `<input type="hidden" name="ref" value="${esc(ref)}">` : ''}
  ${regalable ? `<div class="t-modo" role="radiogroup" aria-label="¿Para quién es?">
    <label><input type="radio" name="para_quien" value="yo"${regalo ? '' : ' checked'}><span>Para mí</span></label>
    <label><input type="radio" name="para_quien" value="regalo"${regalo ? ' checked' : ''}><span>🎁 Para regalar</span></label>
  </div>
  <input type="checkbox" name="regalo" value="on" id="es-regalo" hidden${regalo ? ' checked' : ''}>` : ''}
  <div class="t-precio"><b class="num" id="precio-total">${precio(p)}</b><span id="precio-nota">Pago único · ${esAcceso(p) ? 'acceso inmediato por un año' : 'descarga inmediata'}</span></div>
  ${regalable ? `<fieldset class="t-regalo-campos" id="regalo-campos">
    <legend class="sr">Datos del regalo</legend>
    <div class="t-cant"><span><b>¿Cuántos regalas?</b><small>Una liga por persona; cada una funciona una sola vez.</small></span>
      <div class="t-cant-c"><button type="button" data-cant="-1" aria-label="Uno menos">−</button><input id="cantidad" name="cantidad" type="number" inputmode="numeric" min="1" max="10" value="1" aria-label="Cantidad de regalos"><button type="button" data-cant="1" aria-label="Uno más">+</button></div></div>
    <div class="t-campo"><label for="regalo_para">¿Para quién es? <small>(opcional)</small></label><input id="regalo_para" name="regalo_para" type="text" maxlength="80" placeholder="Ej. Sofía"></div>
    <div class="t-campo"><label for="regalo_mensaje">Mensaje en la tarjeta <small>(opcional)</small></label><textarea id="regalo_mensaje" name="regalo_mensaje" maxlength="280" rows="3" placeholder="¡Mucho éxito en tu examen!"></textarea></div>
  </fieldset>` : ''}
  <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
  <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda" id="ayuda-email">${esAcceso(p) ? 'Aquí te llega tu acceso. Úsalo también para entrar después.' : 'Aquí te llegan tus archivos.'}</small>${regalable ? '<small class="t-ayuda t-ayuda-regalo">Aquí te llegan las ligas de regalo para que las compartas.</small>' : ''}</div>
  <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos y condiciones</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
  <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
  <button class="btn tinta" type="submit" id="btn-compra"><span class="t-btn-yo">Comprar ahora</span>${regalable ? '<span class="t-btn-regalo">Comprar regalo</span>' : ''} ${FLECHA}</button>
  <p class="t-pago">Tarjeta · OXXO · SPEI &nbsp;·&nbsp; Pago seguro con Stripe</p>
</form>`;
};

export const SCRIPT_COMPRA = `(function(){
  var f=document.getElementById('form-compra'); if(!f||!window.fetch) return;
  // Para mí / Para regalar: cantidad, precio total y textos
  var cant=document.getElementById('cantidad'), nota=document.getElementById('precio-nota'), total=document.getElementById('precio-total'), regalo=document.getElementById('es-regalo'), unidad=+f.dataset.unidad;
  function pesos(c){ return '$'+(c/100).toLocaleString('es-MX')+' MXN'; }
  function pinta(){ var esR=regalo&&regalo.checked, n=cant?Math.min(10,Math.max(1,parseInt(cant.value,10)||1)):1; if(cant) cant.value=n; if(total) total.textContent=pesos(unidad*(esR?n:1)); if(nota){ if(!nota.dataset.base) nota.dataset.base=nota.textContent; nota.textContent=esR?(n>1?n+' ligas de regalo':'1 liga de regalo')+' · cada una da un año de acceso':nota.dataset.base; } f.classList.toggle('es-regalo',!!esR); }
  f.querySelectorAll('input[name=para_quien]').forEach(function(r){ r.addEventListener('change',function(){ if(regalo) regalo.checked=(r.value==='regalo'&&r.checked); pinta(); }); });
  f.querySelectorAll('[data-cant]').forEach(function(b){ b.addEventListener('click',function(){ cant.value=(parseInt(cant.value,10)||1)+(+b.dataset.cant); pinta(); }); });
  if(cant) cant.addEventListener('input',pinta);
  pinta();
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={}; new FormData(f).forEach(function(v,k){d[k]=v;}); d.terminos=!!f.terminos.checked; delete d.para_quien;
    if(regalo&&regalo.checked){ d.regalo=true; d.cantidad=+cant.value||1; } else { delete d.regalo; delete d.cantidad; delete d.regalo_para; delete d.regalo_mensaje; }
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
  if (!p) {
    // Le cambiaron el enlace: redirigir para siempre al nuevo (conserva ?ref= y demás)
    const nuevo = await productoPorSlugAnterior(env, slug);
    if (nuevo) return new Response(null, { status: 301, headers: { location: `/tienda/${nuevo.slug}/${url.search}`, 'cache-control': 'public, max-age=3600' } });
  }
  // Productos ocultos (simulacros adicionales) se compran desde su app, no tienen página propia
  if (p?.contenido?.oculto) return new Response(null, { status: 302, headers: { location: p.contenido.acceso?.ruta || '/tienda/' } });
  if (!p) return pagina({
    titulo: 'Producto no disponible · Vorka México', ruta: `/tienda/${slug}/`, noindex: true, status: 404,
    cuerpo: aviso({ clase: 'alerta', titulo: 'Este producto no está disponible', texto: 'Puede que ya no esté a la venta o que el enlace tenga un error.',
      extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/">Ver la tienda ${FLECHA}</a></div>` }),
  });
  const { code, cookie } = await refDeVisita(env, req, url);
  if (!BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code });

  const c = p.contenido;
  // Si el producto tiene su propia página (p. ej. vorka.mx/simulador-paa/), esa es la canónica para Google
  const ruta = c.acceso?.ruta || `/tienda/${p.slug}/`;
  const imagen = p.imagen ? new URL(p.imagen, SITIO).toString() : undefined;
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.nombre, description: p.descripcion_corta, sku: p.id,
    brand: { '@type': 'Brand', name: 'Vorka México' }, ...(imagen ? { image: [imagen] } : {}),
    offers: { '@type': 'Offer', url: SITIO + ruta, price: (p.precio_centavos / 100).toFixed(2), priceCurrency: p.moneda, availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Vorka México' } },
  };
  const faq = [...(c.faq || []), ...(esAcceso(p) ? FAQ_ACCESO : FAQ_TIENDA)];
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
    ${formCompra(p, { error: url.searchParams.get('error') || '', ref: code || '', regalo: url.searchParams.get('regalo') === '1' })}
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
<div class="t-barra" id="barra-compra"><div><b class="num">${precio(p)}</b><small>${esAcceso(p) ? 'Acceso inmediato' : 'Descarga inmediata'}</small></div><a class="btn tinta chico" href="#comprar">Comprar</a></div>`,
  });
}

export async function sitemapTienda(env) {
  const ps = await listarProductos(env);
  const urls = [`<url><loc>${SITIO}/tienda/</loc><priority>0.8</priority></url>`,
    // Si el producto tiene página propia (p. ej. /simulador-paa/), en el sitemap va esa (es la canónica)
    ...ps.map(p => p.contenido.acceso?.ruta
      ? `<url><loc>${SITIO}${p.contenido.acceso.ruta}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><priority>0.9</priority></url>`
      : `<url><loc>${SITIO}/tienda/${p.slug}/</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><priority>0.7</priority></url>`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls.join('\n  ')}\n</urlset>\n`,
    { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
