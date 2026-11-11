// vorka.mx/tienda/simuladores/ · la entrada de todos los simuladores de examen en la tienda (nov 2026).
// En el catálogo los simuladores y sus paquetes son una sola tarjeta que trae aquí (tienda.js › vistas), para no llenar la
// tienda de simuladores. Cada simulador conserva su propia página (/simulador-paa/, …: ya tienen su posicionamiento, la app
// instalada, las ligas de acceso y las de Puntos); esta página ayuda a elegir y vende los paquetes:
//   UNAM + IPN $499 · PAA + UNAM $549 · PAA + IPN $549 · los 3 $699 (migración 0077, contenido.acceso.apps).
// El paquete se elige con ?paquete=<slug> y abajo sale su formulario de compra, como los planes en la página de cada simulador.
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc, WHATSAPP } from './paginas.js';
import { refDeVisita, precio, seccionFaq, seccionCompra, formCompra, SCRIPT_COMPRA, navTienda } from './tienda.js';
import { ofertas } from './seo.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { simuladorDe } from './simulador/index.js';
import { RUTA_UNIVERSIDADES } from './simulador/exani-universidades.js';

export const RUTA_SIMULADORES = '/tienda/simuladores/';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;

// Por examen: [app, nombre, para qué es, datos]
const UNIVERSIDAD = [
  ['simulador-paa', 'Simulador PAA', 'Prueba de Aptitud Académica: Tec, UDEM, ITAM, ITESO, UdeG y más.', 'Lectura, Redacción, Matemáticas e Inglés · puntaje 200–800'],
  ['simulador-unam', 'Simulador UNAM', 'Examen de licenciatura de la UNAM, en sus 4 áreas.', '120 reactivos en 3 horas · el peso de tu área'],
  ['simulador-ipn', 'Simulador IPN', 'Examen de licenciatura del IPN, en sus 3 áreas.', '140 reactivos en 3 horas · 8 materias'],
  // Sale solo cuando su producto ya está a la venta (entró inactivo: migración 0085)
  ['simulador-exani-ii', 'Simulador EXANI-II', 'Un solo simulador para la BUAP, la UANL, la UADY y las demás que usan EXANI-II.', '168 reactivos en 4 horas y media · tus 2 módulos', true],
  // Igual: sale cuando su producto está a la venta (migración 0086)
  ['simulador-excoba', 'Simulador EXCOBA', 'Examen de licenciatura de la UAQ y la UG, con las 3 asignaturas de tu carrera.', '180 preguntas · clasificar, elegir varias y escribir', true],
];
const PREPA = [
  ['simulador-ecoems', 'Simulador ECOEMS', 'Para la prepa de la UNAM y las vocacionales del IPN (CECyT y CET).', '128 reactivos en 3 horas · 10 materias'],
  ['simulador-prepa-ug', 'Simulador prepa UG', 'EXANI-I para el bachillerato de la Universidad de Guanajuato.', '160 reactivos en 4 horas y media · 5 áreas'],
];
export const PAQUETES = ['simuladores-universidad', 'simuladores-unam-ipn', 'simuladores-paa-unam', 'simuladores-paa-ipn'];

const FAQ = [
  ['¿Qué incluye cada simulador del paquete?', 'El plan Completo de cada uno, igual que si lo compraras por separado: práctica sin límite con tutor, los 2 exámenes completos, plan de estudio con recordatorios, apuntes y la app en tu celular.'],
  ['¿Cómo entro a cada simulador?', 'Te llega un correo con el botón para ver tus simuladores; desde ahí entras a cada uno. Después, en la página de cada simulador entras con este mismo correo.'],
  ['¿Cuánto dura el acceso?', 'Seis meses desde tu compra, en todos los simuladores del paquete. Tu historial se guarda en tu cuenta.'],
  ['¿Por qué no hay paquetes de prepa?', 'Porque quien va a la prepa presenta un solo examen: el ECOEMS en la Ciudad de México y zona metropolitana, o el EXANI-I para la prepa de la UG. Los paquetes son para quien aplica a varias universidades a la vez.'],
  ['¿Lo puedo regalar?', 'Sí. Al comprar elige Para regalar: te llega una liga por cada regalo y el acceso queda a nombre de quien la abre.'],
  ['¿Y si ya tengo uno de los simuladores?', 'Escríbenos a hola@vorka.mx antes de comprar y vemos la mejor opción para ti.'],
];

const tarjetaSim = (p, [app, nombre, para, datos]) => `<a class="ts-sim" href="/${app}/">
  <span class="ts-sim-img"><img src="/assets/tienda/v3/${app}-objeto.webp" alt="" width="672" height="1200" loading="lazy" decoding="async"></span>
  <span class="ts-sim-x"><b>${esc(nombre)}</b><span>${esc(para)}</span><small>${esc(datos)}</small>${p ? `<em>Desde ${esc(precio(p))}</em>` : ''}</span>
  <span class="ts-sim-f" aria-hidden="true">${FLECHA}</span></a>`;

export async function paginaSimuladores(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  // «Desde»: el plan más barato de cada simulador
  const desde = async app => {
    const s = simuladorDe(app); if (!s) return null;
    const ps = (await Promise.all(Object.values(s.planes).map(slug => productoPorSlug(env, slug)))).filter(Boolean);
    return ps.sort((a, b) => a.precio_centavos - b.precio_centavos)[0] || null;
  };
  const sims = Object.fromEntries(await Promise.all([...UNIVERSIDAD, ...PREPA].map(async x => [x[0], await desde(x[0])])));
  // Paquetes a la venta y cuánto costaría el plan Completo de cada simulador por separado
  const completoDe = async app => { const s = simuladorDe(app); return s ? productoPorSlug(env, s.planes.paquete) : null; };
  const paquetes = (await Promise.all(PAQUETES.map(async slug => {
    const p = await productoPorSlug(env, slug); if (!p) return null;
    const apps = p.contenido?.acceso?.apps || [], nombres = p.contenido?.acceso?.nombres || [];
    const sueltos = await Promise.all(apps.map(completoDe));
    const suma = sueltos.every(Boolean) ? sueltos.reduce((t, x) => t + x.precio_centavos, 0) : 0;
    return { p, apps, nombres, suma, ahorro: suma > p.precio_centavos ? suma - p.precio_centavos : 0 };
  }))).filter(Boolean);
  const elegido = paquetes.find(x => x.p.slug === url.searchParams.get('paquete')) || paquetes[0] || null;
  if (elegido && req.method === 'GET' && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: elegido.p.id, ref_code: code }, req);
  const regalo = url.searchParams.get('regalo') === '1';

  const opciones = paquetes.map(x => `<a class="ts-paq${x === elegido ? ' sel' : ''}${x.apps.length === 3 ? ' rec' : ''}" role="radio" aria-checked="${x === elegido}" href="?paquete=${esc(x.p.slug)}${regalo ? '&regalo=1' : ''}#comprar">
    ${x.apps.length === 3 ? '<span class="ts-paq-tag">El que más conviene</span>' : ''}
    <b>${esc(x.nombres.join(' + '))}</b>
    <span class="ts-paq-p"><em class="num">${esc(precio(x.p))}</em>${x.suma ? `<s class="num">${esc(precio({ precio_centavos: x.suma }))}</s>` : ''}</span>
    ${x.ahorro ? `<small>Ahorras ${esc(precio({ precio_centavos: x.ahorro }))}</small>` : ''}</a>`).join('');

  const ld = paquetes.length ? [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Paquetes de simuladores de examen', brand: { '@type': 'Brand', name: 'Vorka México' },
    description: 'El plan Completo de 2 o 3 simuladores de examen de universidad (PAA, UNAM e IPN) por menos que comprarlos por separado.', image: ['https://vorka.mx/assets/tienda/v3/simuladores-portada.webp'],
    category: 'Preparación para exámenes de admisión', offers: ofertas({ ruta: RUTA_SIMULADORES, centavos: paquetes.map(x => x.p.precio_centavos), moneda: paquetes[0].p.moneda }) }] : [];

  return pagina({ navActual: 'catalogo',
    titulo: 'Simuladores de examen de admisión en línea: PAA, UNAM, IPN, ECOEMS y prepa UG | Vorka México', ruta: RUTA_SIMULADORES,
    descripcion: 'Elige el simulador de tu examen de admisión (PAA, UNAM, IPN, ECOEMS o prepa UG) o llévate un paquete si presentas en varias universidades: 2 desde $499 y los 3 por $699.',
    imagen: 'https://vorka.mx/assets/tienda/v3/simuladores-og.jpg',
    head: `${ld.length ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}<style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {}, script: elegido ? SCRIPT_COMPRA : '',
    cuerpo: `${navTienda('examenes')}
<section class="ts-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Exámenes</nav>
  <div style="margin-top:18px"><span class="etiqueta">Simuladores de examen</span></div>
  <h1 class="t-h1">Practica para tu examen de admisión, <span class="metal">como el día del examen.</span></h1>
  <p class="t-lead">Simulacros con cronómetro, un tutor que te da una pista cuando fallas y un reporte que te dice qué reforzar. Elige tu examen o, si presentas en varias universidades, llévate un paquete.</p>
  ${paquetes.length ? `<p class="ts-atajo"><a class="btn tinta chico" href="#paquetes">Ver paquetes · 2 desde ${esc(precio({ precio_centavos: Math.min(...paquetes.filter(x => x.apps.length === 2).map(x => x.p.precio_centavos)) }))} ${FLECHA}</a></p>` : ''}
</div></section>
<section class="t-sec" id="examenes"><div class="marco">
  <div class="cab"><span class="etiqueta">¿Qué examen vas a presentar?</span><h2 class="h2">Elige tu simulador</h2></div>
  <h3 class="ts-grupo">Para entrar a la universidad</h3>
  <div class="ts-sims">${UNIVERSIDAD.filter(x => !x[4] || sims[x[0]]).map(x => tarjetaSim(sims[x[0]], x)).join('')}</div>
  ${sims['simulador-exani-ii'] ? `<p class="ts-cual">¿No sabes qué examen pide tu universidad? <a href="${RUTA_UNIVERSIDADES}">Búscala aquí y te decimos qué simulador te sirve ${FLECHA}</a></p>` : ''}
  <h3 class="ts-grupo">Para entrar a la prepa</h3>
  <div class="ts-sims">${PREPA.map(x => tarjetaSim(sims[x[0]], x)).join('')}</div>
</div></section>
${paquetes.length ? `<section class="t-sec suave" id="paquetes"><div class="marco">
  <div class="cab"><span class="etiqueta">Paquetes</span><h2 class="h2">¿Presentas en varias universidades?</h2>
  <p class="lead">Llévate el plan Completo de 2 o 3 simuladores por menos. Cada uno trae todo: práctica sin límite con tutor, 2 exámenes completos, plan de estudio, apuntes y la app.</p></div>
  <div class="ts-paqs" role="radiogroup" aria-label="Elige tu paquete">${opciones}</div>
  <ul class="ts-trae">${['El plan Completo de cada simulador', '6 meses de acceso a todo', 'Un solo pago con tarjeta, OXXO o SPEI', 'Se puede regalar'].map(t => `<li>${CHECK}<span>${t}</span></li>`).join('')}</ul>
</div></section>
${seccionCompra({ titulo: `Paquete ${esc(elegido.nombres.join(' + '))}`, intro: `${esc(precio(elegido.p))}, pago único.${elegido.ahorro ? ` Ahorras ${esc(precio({ precio_centavos: elegido.ahorro }))} contra comprarlos por separado.` : ''}`,
  pasos: [['Pagas una sola vez', 'Con tarjeta, en OXXO o por SPEI. No se renueva solo.'], ['Te llega un correo', 'Con el botón para ver tus simuladores y entrar a cada uno.'], ['Practicas en cada uno', 'Con su plan Completo durante 6 meses.']],
  garantias: ['Pago 100% protegido con Stripe', 'Si algo falla, lo resolvemos o te devolvemos tu dinero', 'Acceso inmediato al confirmarse tu pago'],
  form: formCompra(elegido.p, { error: url.searchParams.get('error') || '', ref: code || '', regalo, mensajeEjemplo: '¡Mucho éxito en tus exámenes!' }) })}` : ''}
${seccionFaq({ titulo: 'Sobre los simuladores y los paquetes', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join(''), whatsappTexto: 'Hola Vorka, tengo una duda sobre los simuladores.' })}`,
  });
}

const CSS = `.ts-hero{padding:clamp(12px,3vw,36px) 0 clamp(20px,3vw,32px)}
.ts-hero .t-h1{margin-top:12px;max-width:860px}.ts-hero .t-lead{margin-top:14px;max-width:680px}
.ts-atajo{margin-top:20px}
.ts-grupo{font-size:15px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--fg-2);margin:28px 0 12px}
.ts-sims{display:grid;gap:14px}@media(min-width:760px){.ts-sims{grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}}
.ts-sim{display:flex;align-items:center;gap:16px;padding:14px 18px 14px 14px;border-radius:var(--r);background:var(--card);border:1px solid var(--line);text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s;min-width:0}
.ts-sim:hover{transform:translateY(-2px);box-shadow:var(--sombra)}
.ts-sim-img{width:84px;height:110px;flex:none;border-radius:14px;overflow:hidden;background:var(--bg-2)}.ts-sim-img img{width:100%;height:100%;object-fit:cover;object-position:center}
.ts-sim-x{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.ts-sim-x b{font-size:18px;letter-spacing:-.01em}
.ts-sim-x span{font-size:14.5px;color:var(--fg-2)}.ts-sim-x small{font-size:13px;color:var(--fg-3,#A8A4A9)}.ts-sim-x em{font-style:normal;font-weight:700;font-size:14.5px;margin-top:4px}
.ts-cual{margin-top:16px;font-size:15px;color:var(--fg-2)}.ts-cual a{color:var(--fg);font-weight:700;display:inline-flex;align-items:center;gap:6px}.ts-cual svg{width:16px;height:16px}
.ts-sim-f{flex:none;color:var(--fg-2)}.ts-sim-f svg{width:18px;height:18px}
.ts-paqs{display:grid;gap:12px;margin-top:22px}@media(min-width:760px){.ts-paqs{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ts-paq{position:relative;display:flex;flex-direction:column;gap:6px;padding:18px;border-radius:18px;background:var(--card);border:1.5px solid var(--line-2);text-decoration:none;color:inherit;min-width:0}
.ts-paq.sel{border-color:var(--fg);box-shadow:0 0 0 2px var(--fg) inset}
.ts-paq.rec{padding-top:30px}
.ts-paq-tag{position:absolute;top:-1px;left:-1px;right:-1px;border-radius:18px 18px 0 0;background:var(--morado);color:#fff;font-size:12px;font-weight:700;text-align:center;padding:5px 8px}
.ts-paq b{font-size:17px;letter-spacing:-.01em}
.ts-paq-p{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.ts-paq-p em{font-style:normal;font-size:24px;font-weight:800;letter-spacing:-.02em}.ts-paq-p s{color:var(--fg-2);font-size:14px}
.ts-paq small{font-size:13px;font-weight:700;color:var(--verde)}
.ts-trae{display:flex;flex-wrap:wrap;gap:10px 22px;margin:18px 0 0;padding:0;list-style:none}.ts-trae li{display:flex;gap:8px;align-items:center;font-size:14.5px;color:var(--fg-2)}.ts-trae svg{width:16px;height:16px;color:var(--verde)}`;
