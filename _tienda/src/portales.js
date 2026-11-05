// Portales inmobiliarios (sitio, catálogo con mapa, fichas y CRM de prospectos para inmobiliarias y brokers).
// /tienda/portales/ → ficha comercial: tres planes mensuales (Básico, Broker, Inmobiliaria) + usuarios adicionales, preguntas y compra.
// Se cobra por suscripción (ver suscripciones.js). La plataforma vive en inmuebles.vorka.mx (Worker "portales") y pregunta por RPC
// (Admin.suscripcionApp(correo, 'portales')) si la cuenta está al corriente. Aquí solo se vende.
import { heroMarca, seccionQueEs, indiceProducto, colorDe, CSS_MARCA, CSS_SECCIONES } from './marca-producto.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { oferta, migas } from './seo.js';
import { FLECHA, CHECK } from './marco.generado.js';

const APP = 'https://inmuebles.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_PORTALES = '/tienda/portales/';
const USUARIO_EXTRA = 'portales-usuario-mensual';
const MAX_EXTRA = 20;
// Lo que distingue a cada plan; lo común va en INCLUYE
const PLANES = [
  { slug: 'portales-basico-mensual', nombre: 'Básico', para: 'Para empezar a mostrar tus propiedades', usuarios: 1,
    puntos: ['1 usuario', 'Tu catálogo en inmuebles.vorka.mx/tu-nombre', 'Fichas con galería, mapa y WhatsApp', 'Prospectos en tu panel'] },
  { slug: 'portales-broker-mensual', nombre: 'Broker', para: 'Para brokers independientes', usuarios: 1, rec: true,
    puntos: ['1 usuario', 'Tu propio dominio y tu marca', 'Portada, catálogo con mapa y fichas', 'CRM de prospectos con su campaña de origen'] },
  { slug: 'portales-inmobiliaria-mensual', nombre: 'Inmobiliaria', para: 'Para inmobiliarias con varios asesores', usuarios: 5,
    puntos: ['5 usuarios: quien administra + 4 asesores', 'Tu propio dominio y tu marca', 'Prospectos asignados por asesor', 'Todo lo del plan Broker'] },
];
const INCLUYE = [
  ['Tu portal, tu marca', 'Tu logo, tu color y tu dominio. Tus clientes ven a tu inmobiliaria, no a una plataforma.'],
  ['Catálogo con mapa', 'Filtros por compra, renta, preventa, zona y recámaras, y un mapa con los precios de cada propiedad.'],
  ['Fichas que venden', 'Galería, precio por m², esquema de pagos para preventas, amenidades, ubicación y botón de WhatsApp.'],
  ['Prospectos en un solo lugar', 'Quien te escribe desde tu sitio queda en tu panel con la propiedad y la campaña de donde llegó. Te avisamos por correo.'],
  ['Todo desde el celular', 'Subes propiedades y fotos desde tu teléfono; se optimizan solas para que tu sitio cargue rápido.'],
  ['Listo para Google', 'Cada propiedad con su propia página, mapa del sitio y vista previa con foto al compartir en WhatsApp.'],
];
const FAQ = [
  ['¿Necesito saber de páginas web?', 'No. Pagas, entras con tu correo y llenas tres datos: nombre, WhatsApp y tu logo. Tu portal queda en línea y desde el panel subes tus propiedades.'],
  ['¿Puedo usar mi propio dominio?', 'Sí, en los planes Broker e Inmobiliaria. Te decimos qué registro agregar donde compraste tu dominio (GoDaddy, Google, etc.) y nosotros hacemos el resto. El plan Básico vive en inmuebles.vorka.mx/tu-nombre.'],
  ['Ya tengo sitio en otra plataforma, ¿qué pasa con mis propiedades?', 'Te ayudamos a pasarlas. Si ya tienes ligas compartidas o en Google, las redirigimos a tus fichas nuevas para no perderlas.'],
  ['¿Cómo me llegan los interesados?', 'Por WhatsApp, con el mensaje armado y la propiedad que les interesó. Si llenan el formulario, además quedan en tu panel con su origen (por ejemplo, tu campaña de Facebook) y te llega un aviso por correo.'],
  ['¿Cobran comisión por venta?', 'No. Pagas tu plan mensual y ya. Lo que vendas o rentes es tuyo.'],
  ['¿Qué es un usuario adicional?', 'Un asesor más con su propio acceso al panel. Cada uno cuesta $99 al mes, en cualquier plan.'],
  ['¿Cuánto cuesta y cómo pago?', 'Básico $199, Broker $300 e Inmobiliaria $800 al mes, en pesos mexicanos con IVA incluido. Pagas con tarjeta de crédito o débito, procesado por Stripe, y se renueva solo. Si necesitas factura (CFDI), escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tus datos fiscales dentro del mismo mes del cobro.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde tu panel › Ajustes › Pagos y facturas, sin llamadas. Tu portal sigue en línea hasta el final del periodo que pagaste.'],
];


// Maqueta del portal (genérica: sin datos de ningún cliente)
const maqueta = `<div class="pi-nav" aria-hidden="true"><i></i><i></i><i></i><span>tuinmobiliaria.com.mx</span></div>
<div class="pi-sitio" role="img" aria-label="Ejemplo de un portal: portada con buscador, propiedades destacadas y mapa con precios">
  <div class="pi-portada"><small>BIENES RAÍCES</small><b>Encuentra tu próxima <em>propiedad.</em></b><div class="pi-busca"><span>Comprar</span><span>Rentar</span><span>Preventa</span></div></div>
  <div class="pi-tarjetas">${['$4.9 M', '$18 mil/mes', '$7.2 M'].map((p, k) => `<div class="pi-t"><i class="pi-f${k}"></i><b>${p}</b><span></span><span class="c"></span></div>`).join('')}</div>
  <div class="pi-mapa"><span class="g">5</span><span class="p p1">$3.4 M</span><span class="p p2">$6.6 M</span><span class="g g2">3</span></div>
</div>`;

export async function paginaPortales(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async (x) => ({ ...x, prod: await productoPorSlug(env, x.slug) })))).filter((x) => x.prod);
  const extra = await productoPorSlug(env, USUARIO_EXTRA);
  const elegido = planes.some((x) => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : (planes.find((x) => x.rec) || planes[0])?.slug || '';
  const base = planes.find((x) => x.slug === 'portales-basico-mensual')?.prod;
  if (base && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: base.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Portal inmobiliario · Vorka México', brand: { '@type': 'Brand', name: 'Vorka México' },
    description: 'Sitio, catálogo con mapa, fichas y CRM de prospectos para inmobiliarias y brokers, con tu dominio y tu marca.', image: ['https://vorka.mx/assets/tienda/v3/portales-og.jpg'],
    ...(planes.length ? { offers: planes.map((x) => oferta({ ruta: RUTA_PORTALES, centavos: x.prod.precio_centavos, name: `Plan ${x.nombre}` })) } : {}) },
  migas('Portales inmobiliarios', RUTA_PORTALES),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  return pagina({ navActual: 'catalogo', entrar: { url: `${APP}/panel`, app: 'mi portal' },
    titulo: 'Portal inmobiliario con tu dominio y tu marca | Desde $199 al mes', ruta: RUTA_PORTALES, imagen: 'https://vorka.mx/assets/tienda/v3/portales-og.jpg',
    descripcion: 'Para inmobiliarias y brokers: sitio con tu marca, catálogo con mapa, fichas con galería y prospectos por WhatsApp en un panel. Desde $199 al mes, sin comisión por venta.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="pi">
${heroMarca('portales', {
  apoyo: 'Sitio, catálogo con mapa y fichas que se ven increíbles en el celular. Tú subes las propiedades; los interesados te llegan por WhatsApp y quedan registrados en tu panel.',
  botones: `<a class="pm-btn" href="#planes">Ver planes ${FLECHA}</a><a class="pm-btn sec" href="${APP}/panel">Ya tengo cuenta</a>`,
  despues: `<p class="pm-precio">Desde <b>${base ? precio(base) : '$199 MXN'}</b> al mes · sin comisión por venta · cancela cuando quieras</p>`,
})}
${indiceProducto('portales', [['que-es', 'Qué es'], ['incluye', 'Qué incluye'], ['como', 'Cómo funciona'], ['planes', 'Planes'], ['ayuda', 'Preguntas']], '<a class="pm-btn" href="#planes">Ver planes</a>')}
${seccionQueEs('portales', { titulo: 'Tu sitio inmobiliario, con tu marca y tu dominio.',
  texto: 'Un sitio con portada, catálogo con mapa y una ficha por propiedad que se ve bien en el celular. Tú subes las propiedades desde tu teléfono; <b>los interesados te escriben por WhatsApp</b> y quedan en tu panel con la campaña de donde llegaron.',
  para: [['Brokers independientes', 'Que tus clientes vean a tu inmobiliaria, con tu logo y tu dominio, no a una plataforma.'], ['Inmobiliarias con varios asesores', 'Cada asesor con su acceso y los prospectos asignados a cada uno.'], ['Quien empieza a vender en línea', 'Tener tu portal sin saber de páginas web: nombre, WhatsApp y tu logo, y listo.']] })}

<section class="pi-sec" id="incluye"><div class="marco">
  <div class="pi-cab"><span class="pi-et">Lo que incluye</span><h2>Todo lo que una inmobiliaria necesita para vender en línea.</h2></div>
  <ul class="pi-ben">${INCLUYE.map(([t, d]) => `<li><b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="pi-sec suave" id="como"><div class="marco pi-dos">
  <div><div class="pi-cab izq"><span class="pi-et">Cómo funciona</span><h2>De pagar a tener tu portal en línea, en minutos.</h2></div>
  <ol class="pi-pasos">${[['Elige tu plan', 'Y escribe el correo con el que vas a entrar a tu panel.'], ['Entra con el botón de tu correo', 'Llenas tu nombre comercial, tu WhatsApp, tu logo y tu color.'], ['Sube tus propiedades', 'Fotos, precio, ubicación y descripción, desde el celular.'], ['Comparte tu liga', 'En tus anuncios, en tu Instagram y por WhatsApp. Cada prospecto queda en tu panel.']].map(([t, d], k) => `<li><span class="pi-num">0${k + 1}</span><div><b>${t}</b><p>${d}</p></div></li>`).join('')}</ol></div>
  <div class="pi-escena">${maqueta}</div>
</div></section>

<section class="pi-sec" id="planes"><div class="marco">
  <div class="pi-cab"><span class="pi-et">Planes</span><h2>Un precio claro, sin comisiones.</h2><p>Mensual, en pesos mexicanos con IVA incluido. Usuario adicional: ${extra ? precio(extra) : '$99 MXN'} al mes.</p></div>
  <div class="pi-planes">${planes.map((x) => `<article class="pi-plan${x.rec ? ' rec' : ''}">${x.rec ? '<span class="pi-sello">El más elegido</span>' : ''}<h3>${x.nombre}</h3><p class="pi-para">${x.para}</p>
    <p class="pi-precio"><b>${precio(x.prod)}</b> <small>al mes</small></p>
    <ul>${x.puntos.map((i) => `<li>${CHECK}<span>${i}</span></li>`).join('')}</ul>
    <a class="pi-btn${x.rec ? '' : ' ghost oscuro'}" href="?plan=${x.slug}#comprar" data-ir="comprar" data-plan="${x.slug}">Elegir ${x.nombre}</a></article>`).join('')}</div>
  ${planes.length ? '' : '<p class="pi-nota" style="text-align:center">Los portales abren muy pronto. Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>'}
</div></section>

${planes.length ? seccionCompra({ titulo: 'Contrata tu portal', intro: 'Pagas aquí con tu tarjeta y te llega un correo con el botón para entrar a tu panel.',
  pasos: [['Elige tu plan', 'Y cuántos asesores adicionales necesitas.'], ['Pagas con tarjeta', 'Se renueva cada mes; lo cancelas cuando quieras.'], ['Entras a tu panel', 'Con el botón de tu correo, sin contraseñas.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por correo y WhatsApp'],
  form: `<form class="t-form t-compra" id="form-portales" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <fieldset class="t-campo pi-elige"><legend>Plan</legend>${planes.map((x) => `<label class="pi-op"><input type="radio" name="slug" value="${x.slug}"${x.slug === elegido ? ' checked' : ''}><span><b>${x.nombre} · ${precio(x.prod)} al mes</b><small>${x.usuarios === 1 ? '1 usuario' : `${x.usuarios} usuarios`} incluido${x.usuarios === 1 ? '' : 's'}</small></span></label>`).join('')}</fieldset>
    ${extra ? `<div class="t-campo"><label for="sucursales">Usuarios adicionales <small>(${precio(extra)} c/u al mes)</small></label><input id="sucursales" name="sucursales" type="number" inputmode="numeric" min="0" max="${MAX_EXTRA}" value="0"></div>` : ''}
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Con este correo entras a tu panel.</small></div>
    <p class="pi-total">Pagas hoy <b id="pi-hoy">—</b> <span id="pi-luego"></span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a> (incluida la renovación automática cada mes) y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva cada mes y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="pi-precios">${JSON.stringify({ planes: Object.fromEntries(planes.map((x) => [x.slug, x.prod.precio_centavos])), extra: extra?.precio_centavos || 9900 }).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionFaq({ titulo: 'Antes de contratar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/terminos/">Términos</a> · <a href="/privacidad/">Aviso de privacidad</a> · Portal · by Vorka México</p>' })}
<section class="pm-sec pi-cierre" style="--pm:${colorDe('portales')}"><div class="marco"><h2 class="pm-h2">Un precio claro, sin comisiones.</h2><p>Pagas tu plan mensual y ya. Lo que vendas o rentes es tuyo. Cancela cuando quieras.</p><div class="pm-ctas"><a class="pm-btn" href="#planes">Ver planes ${FLECHA}</a></div></div></section>
${await masTienda(env, 'negocios')}
</div>`,
  });
}

const CSS = `${CSS_MARCA}${CSS_SECCIONES}
/* Estilo de marca (portadas v4): blanco, tinta y el azul de Portal; sin fondos oscuros */
.pi{--pi-c:#0F5A8A;--pi-c2:#0F5A8A;--morado:#0F5A8A}
[data-tema="oscuro"] .pi{--pi-c2:color-mix(in srgb,#0F5A8A 55%,#fff);--morado:var(--pi-c2)}
/* en oscuro, los acentos de las secciones de marca se aclaran para leerse bien */
[data-tema="oscuro"] .pm-et:not(.gris),[data-tema="oscuro"] .pm-grande b{color:color-mix(in srgb,var(--pm) 55%,#fff)}
.pm-precio{margin:16px 0 0;font-size:15px;color:var(--fg-2)}.pm-precio b{font-size:22px;color:var(--fg);letter-spacing:-.02em}
.pi-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--pi-c);color:#fff;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 12px 28px -14px var(--pi-c);transition:transform .2s var(--ease)}
.pi-btn:hover{transform:translateY(-1px)}.pi-btn svg{width:17px;height:17px}
.pi-btn.ghost,.pi-btn.ghost.oscuro{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--line-2)}.pi-btn.ghost:hover{box-shadow:inset 0 0 0 1.5px var(--fg)}
/* maqueta del portal (un sitio de ejemplo: siempre claro, como se ve en el navegador) */
.pi-escena{border-radius:20px;overflow:hidden;background:#fff;color:#1c1815;border:1px solid var(--line);box-shadow:0 40px 80px -40px rgba(0,0,0,.45);max-width:560px;justify-self:center;width:100%}
.pi-nav{display:flex;align-items:center;gap:6px;padding:10px 12px;background:#EEF1F4;font-size:12px;color:#5f6770}.pi-nav i{width:10px;height:10px;border-radius:50%;background:#D5DAE0}.pi-nav span{margin-left:10px;background:#fff;border-radius:8px;padding:3px 10px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pi-portada{padding:22px 20px 18px;color:#fff;background:linear-gradient(180deg,rgba(8,30,46,.2),rgba(8,30,46,.8)),linear-gradient(120deg,#4F86AD,#0F5A8A 60%,#0A3A5A)}
.pi-portada small{font-size:10px;font-weight:700;letter-spacing:.1em;color:#CFE3F1}.pi-portada b{display:block;font-size:24px;line-height:1.05;letter-spacing:-.03em;margin-top:6px;max-width:12ch}.pi-portada em{font-style:normal;color:#BFDDF2}
.pi-busca{display:flex;gap:4px;margin-top:14px;padding:4px;border-radius:10px;background:rgba(255,255,255,.18);width:max-content;max-width:100%}.pi-busca span{font-size:11px;padding:5px 10px;border-radius:7px}.pi-busca span:first-child{background:#fff;color:#1c1815;font-weight:700}
.pi-tarjetas{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px}
.pi-t{border:1px solid #E4E8EC;border-radius:10px;overflow:hidden;display:grid;gap:4px;padding-bottom:8px}.pi-t i{height:62px;background:linear-gradient(135deg,#D6E3EC,#B3C9D9)}.pi-t i.pi-f1{background:linear-gradient(135deg,#E8E2DA,#CDC2B4)}.pi-t i.pi-f2{background:linear-gradient(135deg,#DCE4E0,#B9C9C2)}
.pi-t b{font-size:12px;padding:0 8px}.pi-t span{height:6px;margin:0 8px;border-radius:3px;background:#E9EDF0}.pi-t span.c{width:50%}
.pi-mapa{position:relative;height:120px;margin:0 12px 12px;border-radius:10px;background:#EEF0F2;background-image:linear-gradient(90deg,rgba(255,255,255,.7) 2px,transparent 2px),linear-gradient(rgba(255,255,255,.7) 2px,transparent 2px);background-size:34px 34px}
.pi-mapa .g{position:absolute;left:30%;top:40%;width:30px;height:30px;border-radius:50%;background:var(--pi-c);color:#fff;font-size:12px;font-weight:800;display:grid;place-items:center;border:3px solid #fff}.pi-mapa .g2{left:62%;top:58%}
.pi-mapa .p{position:absolute;font-size:11px;font-weight:800;color:#0F5A8A;background:#fff;border-radius:999px;padding:3px 8px;box-shadow:0 4px 10px -4px rgba(0,0,0,.4)}.pi-mapa .p1{left:12%;top:16%}.pi-mapa .p2{left:70%;top:14%}
/* secciones */
.pi-sec{padding:clamp(64px,9vw,112px) 0;scroll-margin-top:54px}.pi-sec.suave{background:var(--bg-2)}
.pi-cab{max-width:720px;margin:0 auto 44px;text-align:center}.pi-cab.izq{text-align:left;margin:0 0 32px}
.pi-et{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--pi-c2)}
.pi-cab h2{font-weight:800;font-size:clamp(30px,4.2vw,48px);line-height:1.05;letter-spacing:-.04em;margin:10px 0 0;text-wrap:balance}
.pi-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}
.pi-ben{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
.pi-ben li{padding:24px;border-radius:22px;background:var(--card);border:1px solid var(--line)}.pi-ben li::before{content:"";display:block;width:28px;height:4px;border-radius:2px;background:var(--pi-c2);margin-bottom:16px}
.pi-ben b{display:block;font-size:18px;letter-spacing:-.015em}.pi-ben p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
.pi-dos{display:grid;gap:48px;align-items:center}.pi-dos>*{min-width:0}@media(min-width:980px){.pi-dos{grid-template-columns:.95fr 1.05fr;gap:64px}}
.pi-pasos{list-style:none;padding:0;margin:0;display:grid;gap:22px}.pi-pasos li{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:start}
.pi-num{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:color-mix(in srgb,var(--pi-c) 12%,transparent);font-weight:800;font-size:14px;color:var(--pi-c2)}.pi-pasos b{display:block;font-size:19px;letter-spacing:-.02em;padding-top:8px}.pi-pasos p{margin:4px 0 0;color:var(--fg-2);font-size:15.5px;line-height:1.5}
.pi-planes{display:grid;gap:20px;align-items:start;max-width:1120px;margin:0 auto;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr))}
.pi-plan{position:relative;background:var(--card);border:1.5px solid var(--line);border-radius:28px;padding:28px;display:grid;gap:8px}
.pi-plan.rec{border-color:var(--pi-c);box-shadow:0 30px 60px -40px var(--pi-c)}
.pi-sello{position:absolute;top:-13px;left:24px;background:var(--pi-c);color:#fff;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px}
.pi-plan h3{font-weight:800;font-size:26px;letter-spacing:-.035em;margin:4px 0 0}.pi-para{color:var(--fg-2);margin:0}
.pi-precio{margin:6px 0 0}.pi-precio b{font-size:40px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.pi-precio small{color:var(--fg-2)}
.pi-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:9px}.pi-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.pi-plan li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--pi-c2)}
.pi-nota{color:var(--fg-2);font-size:15px;margin-top:14px}
.pi-elige{border:0;padding:0;margin:0 0 6px}.pi-elige legend{font-weight:650;font-size:14px;margin-bottom:8px;padding:0}
.pi-op{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);margin-bottom:8px;cursor:pointer}
.pi-op input{margin-top:3px;accent-color:var(--pi-c)}.pi-op b{display:block;font-size:15px}.pi-op small{display:block;color:var(--fg-2);font-size:13px;margin-top:2px}
.pi-op:has(input:checked){border-color:var(--pi-c);background:color-mix(in srgb,var(--pi-c) 7%,transparent)}
.pi-total{margin:4px 0 12px;font-size:16px}.pi-total b{font-size:20px;font-variant-numeric:tabular-nums}
.pi #form-portales .btn.acento{background:var(--pi-c);color:#fff;box-shadow:0 12px 28px -14px var(--pi-c)}
/* cierre */
.pi-cierre{padding-bottom:88px;text-align:center}.pi-cierre .marco{max-width:760px}.pi-cierre p{margin:14px auto 0;font-size:18px;line-height:1.55;color:var(--fg-2);max-width:560px}.pi-cierre .pm-ctas{justify-content:center}
`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-portales'); if(!f||!window.fetch) return;
  var P={planes:{},extra:9900}; try{ P=JSON.parse(document.getElementById('pi-precios').textContent); }catch(e){}
  var fmt=function(c){ return '$'+(c/100).toLocaleString('es-MX',{maximumFractionDigits:2})+' MXN'; };
  function elegido(){ var r=f.querySelector('input[name=slug]:checked'); return r?r.value:''; }
  function extras(){ var n=parseInt((f.sucursales&&f.sucursales.value)||'0',10); return isNaN(n)?0:Math.max(0,Math.min(20,n)); }
  function pinta(){ var c=(P.planes[elegido()]||0)+extras()*P.extra; document.getElementById('pi-hoy').textContent=fmt(c); document.getElementById('pi-luego').textContent='y luego '+fmt(c)+' cada mes'; }
  f.querySelectorAll('input[name=slug]').forEach(function(r){ r.addEventListener('change',pinta); }); if(f.sucursales) f.sucursales.addEventListener('input',pinta); pinta();
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(){ var r=f.querySelector('input[name=slug][value="'+a.dataset.plan+'"]'); if(r){ r.checked=true; pinta(); } }); });
  document.querySelectorAll('[data-ir]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:elegido(), sucursales:extras(), nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value;
    if(!d.slug) return mostrar('Elige un plan.');
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
