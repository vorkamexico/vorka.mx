// Tienda › Mostrador + Vuelve (vorka.mx/tienda/mostrador/): la versión profesional para negocios con mercancía (boutiques, papelerías,
// ferreterías, regalos, refaccionarias, naturistas, florerías, tiendas de mascotas…). Vende queda para vendedoras por catálogo.
// «Mi mostrador» vive dentro de Vuelve (os.vorka.mx/vuelve): vender con ticket, inventario con existencias y mínimos, corte del día
// con ganancia, y la tarjeta de lealtad para que regresen. Se cobra como paquete 'mostrador-vuelve' (ver PAQUETES en suscripciones.js).
// Mes gratis sin tarjeta con un código que da Vorka por WhatsApp, a cambio de un descuento para integrantes de IMPACTO. Vuelve no cobra a los clientes ni mueve dinero: solo registra.
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { oferta, migas } from './seo.js';
import { FLECHA, CHECK } from './marco.generado.js';

export const RUTA_MOSTRADOR = '/tienda/mostrador/';
const APP = 'https://os.vorka.mx/vuelve/?o=mostrador30';   // entrar (el mes gratis se activa con un código que da Vorka)
const WA_MES = 'https://wa.me/528117804869?text=' + encodeURIComponent('Hola, quiero probar Mostrador un mes gratis.');
const WA = 'https://wa.me/528117804869?text=' + encodeURIComponent('Hola, tengo una duda sobre Mostrador + Vuelve.');
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
// Dos opciones: solo Mostrador (ventas, inventario y corte) o el paquete con Vuelve (más la tarjeta de lealtad)
const PLANES = [
  { slug: 'mostrador-vuelve-mensual', nombre: 'Mostrador + Vuelve · Mensual', cada: 'al mes', renueva: 'cada mes' }, { slug: 'mostrador-vuelve-anual', nombre: 'Mostrador + Vuelve · Anual', cada: 'al año', renueva: 'cada año' },
  { slug: 'mostrador-mensual', nombre: 'Solo Mostrador · Mensual', cada: 'al mes', renueva: 'cada mes' }, { slug: 'mostrador-anual', nombre: 'Solo Mostrador · Anual', cada: 'al año', renueva: 'cada año' }];
const OPCIONES = [
  { k: 'mostrador', titulo: 'Mostrador', para: 'Ventas, inventario y corte del día', m: 'mostrador-mensual', a: 'mostrador-anual',
    incluye: ['Ventas con ticket: escaneas el código o tocas el producto', 'Sube tus productos desde tu Excel', 'Promociones que se aplican solas (2×1, % de descuento)', 'Te sugiere qué más ofrecer en cada venta', 'Tu equipo vende con su PIN', 'Ticket por correo para tu cliente', 'Inventario, mínimos y corte del día con tu ganancia'] },
  { k: 'mostrador-vuelve', titulo: 'Mostrador + Vuelve', para: 'Todo Mostrador, y que tus clientes regresen', m: 'mostrador-vuelve-mensual', a: 'mostrador-vuelve-anual', rec: true,
    incluye: ['Todo lo de Mostrador', 'Tarjeta de lealtad Vuelve con tu logo (Apple y Google Wallet)', 'Al cobrar, sus sellos o puntos se suman en la misma pantalla', 'Puntos o sellos por compra y premios que tú eliges', 'Avisos de cumpleaños y de «te extrañamos»', 'Equipo con PIN para sumar compras', 'Aparece en el catálogo de negocios de tu ciudad'] },
];
const pesosRedondo = c => '$' + (c / 100).toLocaleString('es-MX', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });

const QUE = [
  ['Vender con ticket', 'Escaneas el código o tocas el producto, la cuenta aplica tus promociones y te sugiere qué más ofrecer. Cobras y le mandas su ticket por correo.'],
  ['Inventario al día', 'Subes tus productos desde tu Excel. Existencias, aviso de lo que hay que surtir y entradas de mercancía con su costo.'],
  ['Corte del día', 'Cuánto vendiste, cuánto fue en efectivo, transferencia y tarjeta, y cuánto ganaste de verdad, sin hacer cuentas en libreta.'],
  ['Clientes que regresan', 'Tu tarjeta de lealtad Vuelve en el Wallet de cada cliente, con tu logo: puntos o sellos por compra, premios y avisos para que vuelvan.'],
];
// Para quién es: giros con ejemplos de cómo lo usan (sin nombres de clientes reales)
const PARA = [
  ['Boutiques y zapaterías', 'Tallas y modelos con sus existencias, y premios para la clienta que vuelve cada temporada.'],
  ['Papelerías', 'Cientos de artículos chicos con su código, el corte del día y lo que hay que surtir antes del regreso a clases.'],
  ['Ferreterías y tlapalerías', 'Lo que entra del proveedor con su costo, lo que se vende al mostrador y la ganancia real de cada día.'],
  ['Tiendas de regalos y novedades', 'Mercancía de temporada, ventas rápidas con ticket y clientes que regresan en cada fecha especial.'],
  ['Refaccionarias', 'Piezas con su código, existencias al momento y un premio para el taller o el cliente que más te compra.'],
  ['Tiendas naturistas y de suplementos', 'Productos que se recompran cada mes: inventario al día y avisos para que el cliente regrese.'],
  ['Tiendas de mascotas', 'Alimento y accesorios con su mínimo para surtir, y sellos por compra para que la familia vuelva contigo.'],
  ['Florerías y detalles', 'Arreglos con su precio, ventas del día por forma de pago y premios para quien te compra en cada fecha.'],
];
const FAQ = [
  ['¿Puedo probarlo antes de pagar?', `Sí. Entra a <a href="${APP}">os.vorka.mx/vuelve</a> con tu correo y elige tu tipo de negocio (tienda, boutique, papelería…). Pide tu código por <a href="https://wa.me/528117804869">WhatsApp</a>: te damos 30 días con todo, sin tarjeta, a cambio de un descuento para los integrantes de IMPACTO y aparecer en su catálogo de negocios aliados. Si te sirve, te suscribes aquí con el mismo correo y todo sigue tal cual.`],
  ['¿Cobra por mí o se conecta a una terminal?', 'No. Tus clientes te pagan como siempre: efectivo, transferencia o tu terminal. Mostrador registra la venta, descuenta el inventario y te arma el corte.'],
  ['¿En qué se diferencia de Vende?', 'Vende es para vendedoras por catálogo que llevan clientas y pedidos. Mostrador es para negocios con mercancía propia y mostrador: inventario, ventas con ticket, corte del día y tarjeta de lealtad.'],
  ['¿Puedo cargar muchos productos?', 'Sí. Das de alta cada producto con su precio y su foto, y le pones existencias, mínimo, costo y código. Si tienes tu lista en Excel, mándanosla por WhatsApp y te ayudamos a cargarla.'],
  ['¿Quién ve mis ventas?', 'Solo tú, con tu correo. Ni el equipo de Vorka las ve cuando te ayuda a configurar tu tarjeta.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Vuelve › Cuenta y pagos, sin llamadas. Sigues con todo hasta el final del periodo pagado; tus productos y ventas se quedan guardados.'],
];
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONOS = [svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'), svg('<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'),
  svg('<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>'), svg('<rect x="3" y="5.5" width="18" height="13" rx="3"/><circle cx="8" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/>')];

// Cómo se ve: un pase de lista y una tarjeta (ilustración hecha con HTML, no captura)
const VISTA = `<div class="ac-vista" aria-hidden="true">
  <div class="ac-pant"><small>Ticket · venta #128</small><b>Boutique Lirio</b>
    <ul>${[['1 × Blusa de lino', '$450'], ['2 × Aretes de plata', '$380'], ['1 × Bolsa de piel', '$900']].map(([n, v]) => `<li><span class="ac-chk si"></span><span><b>${n}</b><em>${v}</em></span></li>`).join('')}</ul>
    <span class="ac-btn">Cobrar $1,730</span></div>
  <div class="ac-tar"><b>Corte de hoy</b><p>18 ventas</p><p class="ac-cuenta"><b>$9,840</b></p>
    <small>Efectivo $4,210 · Tarjeta $3,950 · Transferencia $1,680</small><p style="margin-top:12px">Por surtir: 3 productos</p></div>
</div>`;

export async function paginaMostrador(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug) })))).filter(x => x.prod);
  const de = slug => planes.find(x => x.slug === slug)?.prod;
  const mensual = planes.find(x => x.slug === 'mostrador-mensual') || planes[0];
  const ahorroDe = slug => { const x = planes.find(y => y.slug === slug), m = x && de(slug.replace('-anual', '-mensual')); return x && m && slug.endsWith('-anual') ? m.precio_centavos * 12 - x.prod.precio_centavos : 0; };
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : (planes.find(x => x.slug === 'mostrador-vuelve-mensual') || planes[0])?.slug || '';
  const elegidoP = planes.find(x => x.slug === elegido);
  if (mensual && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: mensual.prod.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Mostrador + Vuelve · Inventario, ventas y clientes que regresan', brand: { '@type': 'Brand', name: 'Vorka México' },
    description: 'Para negocios con mercancía: ventas con ticket, inventario, corte del día y tarjeta de lealtad para tus clientes.',
    ...(planes.length ? { offers: planes.map(x => oferta({ ruta: RUTA_MOSTRADOR, centavos: x.prod.precio_centavos, name: `Plan ${x.nombre.toLowerCase()}` })) } : {}) },
  migas('Mostrador', RUTA_MOSTRADOR),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const desde = mensual ? precio(mensual.prod) : null;   // el de entrada: solo Mostrador
  return pagina({ navActual: 'catalogo', entrar: { url: APP, app: 'Vuelve' },
    titulo: 'Mostrador + Vuelve: inventario, ventas y corte de caja para tu negocio | Vorka México', ruta: RUTA_MOSTRADOR,
    descripcion: 'Para boutiques, papelerías, ferreterías, tiendas de regalos y más: vende con ticket, lleva tu inventario, haz el corte del día y haz que tus clientes regresen.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT,
    cuerpo: `<div class="ac">
<section class="ac-hero"><div class="marco ac-hero-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Mostrador</nav>
    <h1 class="t-h1">Tu negocio en orden: lo que vendes, lo que te queda y quién regresa.</h1>
    <p class="t-lead">Ventas con ticket, inventario y corte del día en tu celular o tu compu, con tu logo. Y una tarjeta de lealtad para que tus clientes vuelvan a comprarte.</p>
    <div class="ac-btns"><a class="btn acento" href="${WA_MES}" target="_blank" rel="noopener">Pide tu mes gratis ${FLECHA}</a><a class="btn blanco" href="#comprar" data-ir="comprar">Ver precio</a></div>
    <p class="ac-mini">${desde ? `Desde ${desde} al mes · ` : ''}Primer mes gratis a cambio de un descuento para IMPACTO · Soporte por WhatsApp</p>
  </div>${VISTA}
</div></section>

<section class="ac-sec"><div class="marco">
  <h2 class="t-h2 ac-h2">Lo que hoy llevas en libreta, en Excel y en tu cabeza.</h2>
  <div class="ac-cuatro">${QUE.map(([t, d], i) => `<article class="ac-card"><span class="ac-ico">${ICONOS[i]}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
  <p class="ac-aviso">Mostrador <b>no cobra por ti ni mueve dinero</b>: tus clientes te pagan como siempre. La app registra cada venta y lleva tu inventario.</p>
</div></section>

<section class="ac-sec suave" id="para-quien"><div class="marco">
  <h2 class="t-h2 ac-h2">Para negocios que venden mercancía todos los días.</h2>
  <p class="ac-sub">Si tienes mostrador, existencias y clientes que podrían volver más seguido, es para ti.</p>
  <div class="ac-cuatro">${PARA.map(([t, d]) => `<article class="ac-card"><h3 style="margin-top:0">${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
  <p class="ac-aviso">¿Vendes por catálogo (Jafra, Avon, Natura…)? Lo tuyo es <a href="/tienda/vende/">Vende</a>, hecho para vendedoras.</p>
</div></section>

<section class="ac-sec" id="precio"><div class="marco">
  <h2 class="t-h2 ac-h2">Solo Mostrador, o con tu tarjeta de lealtad.</h2>
  <p class="ac-sub">En pesos mexicanos con IVA incluido. Cancela cuando quieras. Puedes empezar con Mostrador y sumar Vuelve después.</p>
  <div class="ac-planes">${OPCIONES.filter(o => de(o.m)).map(o => `<article class="ac-plan${o.rec ? ' rec' : ''}">${o.rec ? '<span class="ac-sello">El más completo</span>' : ''}
    <h3>${o.titulo}</h3><p class="ac-para">${esc(o.para)}</p><p class="ac-precio"><b>${precio(de(o.m))}</b> <small>al mes</small></p>
    ${de(o.a) ? `<p class="ac-para">o ${precio(de(o.a))} al año (ahorras ${pesosRedondo(ahorroDe(o.a))})</p>` : ''}
    <ul>${o.incluye.map(i => `<li>${CHECK}<span>${esc(i)}</span></li>`).join('')}</ul>
    <a class="btn${o.rec ? ' acento' : ' blanco'}" href="?plan=${o.m}#comprar" data-ir="comprar" data-plan="${o.m}">Quiero ${esc(o.titulo)}</a></article>`).join('')}</div>
  ${planes.length ? '' : `<p class="ac-sub">Muy pronto. Mientras, <a href="${APP}">pruébalo gratis</a> o <a href="${WA}" target="_blank" rel="noopener">escríbenos por WhatsApp</a>.</p>`}
</div></section>

${planes.length ? seccionCompra({ titulo: 'Suscríbete a Mostrador + Vuelve', intro: `¿Aún no lo pruebas? <a href="${APP}">Empieza gratis</a>, sin tarjeta. Si ya lo usas, suscríbete con el mismo correo y todo sigue tal cual.`,
  pasos: [['Elige tu plan', 'Solo Mostrador o con Vuelve, mensual o anual, y el correo con el que entras.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Sigues donde estabas', 'Mi mostrador y tu tarjeta quedan activos al instante.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por WhatsApp'],
  form: `<form class="t-form t-compra" id="form-mo" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <fieldset class="t-campo ac-elige"><legend>Plan</legend>${planes.map(x => `<label class="ac-op"><input type="radio" name="slug" value="${x.slug}"${x.slug === elegido ? ' checked' : ''}><span><b>${x.nombre} · ${precio(x.prod)} ${x.cada}</b><small>${ahorroDe(x.slug) > 0 ? `Ahorra ${pesosRedondo(ahorroDe(x.slug))} contra el mensual` : 'Sin plazo forzoso'}</small></span></label>`).join('')}</fieldset>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo con el que entras a Vuelve.</small></div>
    <p class="ac-total">Pagas hoy <b id="ac-hoy-p">${precio(elegidoP.prod)}</b> <span id="ac-luego">y luego ${precio(elegidoP.prod)} ${elegidoP.renueva}</span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/vuelve/" target="_blank">condiciones de Vuelve</a> (incluida la renovación automática) y el <a href="/legal/vuelve/privacidad/" target="_blank">aviso de privacidad de Vuelve</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="ac-precios">${JSON.stringify(Object.fromEntries(planes.map(x => [x.slug, { c: x.prod.precio_centavos, renueva: x.renueva }]))).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/vuelve/">Condiciones de Vuelve</a> · <a href="/legal/vuelve/privacidad/">Aviso de privacidad</a> · Mostrador + Vuelve · by Vorka México</p>' })}
${await masTienda(env, 'negocios')}
</div>`,
  });
}

const CSS = `
.ac{--ac:#B42A44}
.ac-hero{padding:clamp(28px,5vw,64px) 0 clamp(40px,6vw,80px)}
.ac-hero-g{display:grid;gap:40px;align-items:center}.ac-hero-g>*{min-width:0}@media(min-width:980px){.ac-hero-g{grid-template-columns:1.05fr .95fr;gap:56px}}
.ac-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.ac-mini{margin:14px 0 0;color:var(--fg-2);font-size:14px}
.ac-vista{position:relative;display:grid;gap:16px;grid-template-columns:1fr;max-width:520px;justify-self:center;width:100%}
@media(min-width:560px){.ac-vista{grid-template-columns:1.1fr .9fr;align-items:end}}
.ac-pant,.ac-tar{border-radius:24px;padding:20px;background:var(--card);border:1px solid var(--line);box-shadow:0 30px 60px -36px rgba(0,0,0,.45)}
.ac-pant small{color:var(--fg-2);font-size:12.5px}.ac-pant>b{display:block;font-size:19px;letter-spacing:-.02em;margin:2px 0 10px}
.ac-pant ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}.ac-pant li{display:flex;gap:10px;align-items:center;font-size:14.5px}.ac-pant li span:last-child{display:grid}
.ac-pant em{font-style:normal;font-size:12px;color:var(--fg-2)}.ac-pant em.av{color:#B4532A}
.ac-chk{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--line-2);flex:none}.ac-chk.si{background:var(--ac);border-color:var(--ac);box-shadow:inset 0 0 0 3px var(--card)}
.ac-btn{display:block;margin-top:14px;text-align:center;padding:11px;border-radius:999px;background:var(--ac);color:#fff;font-weight:700;font-size:14px}
.ac-tar{background:linear-gradient(160deg,#3b111a,#24090f);color:#f4f1ea;border:0}.ac-tar>b{font-size:15px}.ac-tar p{margin:8px 0 0;font-size:13px;opacity:.8}
.ac-cuenta{font-size:14px!important;opacity:1!important}.ac-cuenta b{font-size:34px;letter-spacing:-.03em}
.ac-sellos{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.ac-sellos i{aspect-ratio:1;border-radius:50%;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.3)}
.ac-sellos i.si{background:radial-gradient(circle at 35% 30%,#fbebc6,#d9b87c 55%,#9c7a3e);box-shadow:none}.ac-sellos i.premio{box-shadow:inset 0 0 0 1.5px #d9b87c}
.ac-tar small{font-size:12px;opacity:.85}
.ac-sec{padding:clamp(56px,8vw,96px) 0}.ac-sec.suave{background:var(--bg-2)}
.ac-h2{text-align:center;max-width:760px;margin:0 auto}.ac-sub{text-align:center;color:var(--fg-2);margin:12px auto 0;max-width:620px}
.ac-cuatro{display:grid;gap:14px;margin-top:36px;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))}
.ac-card{padding:24px;border-radius:22px;background:var(--card);border:1px solid var(--line)}.ac-card h3{margin:14px 0 0;font-size:18px;letter-spacing:-.015em}.ac-card p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
.ac-ico{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:12px;background:color-mix(in srgb,var(--ac) 12%,transparent);color:var(--ac)}.ac-ico svg{width:22px;height:22px}
[data-tema="oscuro"] .ac-ico{color:color-mix(in srgb,var(--ac) 55%,#fff)}
.ac-aviso{margin:24px auto 0;max-width:680px;text-align:center;color:var(--fg-2);font-size:14.5px}
.ac-planes{display:grid;gap:20px;margin:36px auto 0;max-width:820px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));align-items:start}
.ac-plan{position:relative;padding:28px;border-radius:28px;background:var(--card);border:1.5px solid var(--line);display:grid;gap:8px}.ac-plan.rec{border-color:var(--ac)}
.ac-plan h3{margin:0;font-size:20px}.ac-para{margin:0;color:var(--fg-2);font-size:14.5px}.ac-precio{margin:0}.ac-precio b{font-size:34px;letter-spacing:-.03em}.ac-precio small{color:var(--fg-2)}
.ac-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:9px}.ac-plan li{display:flex;gap:8px;font-size:15px}.ac-plan li svg{flex:none;width:18px;height:18px;margin-top:2px}
.ac-sello{position:absolute;top:-13px;left:24px;background:var(--ac);color:#fff;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px}
.ac-elige{display:grid;gap:8px;border:0;padding:0;margin:0}.ac-op{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:1.5px solid var(--line);border-radius:14px;cursor:pointer}
.ac-op:has(input:checked){border-color:var(--ac)}.ac-op span{display:grid}.ac-op small{color:var(--fg-2);font-size:13px}
.ac-total{margin:6px 0 0;font-size:15px}.ac-total b{font-size:19px}.ac-total span{color:var(--fg-2)}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-mo');
  document.querySelectorAll('[data-ir]').forEach(function(a){ a.addEventListener('click',function(e){ var c=document.getElementById('comprar'); if(!c) return; e.preventDefault(); c.scrollIntoView({behavior:'smooth'}); if(f) setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  if(!f||!window.fetch) return;
  var P={}; try{ P=JSON.parse(document.getElementById('ac-precios').textContent); }catch(e){}
  function elegido(){ var r=f.querySelector('input[name=slug]:checked'); return r?r.value:''; }
  function pinta(){ var x=P[elegido()]; if(!x||!window.VD) return; var fr=VD.frase(x.c,x.renueva); document.getElementById('ac-hoy-p').textContent=fr.hoy; document.getElementById('ac-luego').textContent=fr.luego; }
  document.addEventListener('vorka:descuento',pinta);
  f.querySelectorAll('input[name=slug]').forEach(function(r){ r.addEventListener('change',pinta); }); pinta();
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(){ var r=f.querySelector('input[name=slug][value="'+a.dataset.plan+'"]'); if(r){ r.checked=true; pinta(); } }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:elegido(), nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value) d.codigo=f.codigo.value.trim();
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
