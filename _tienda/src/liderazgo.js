// Evaluación de liderazgo Vorka (80 preguntas; el primer paso de toda Mentoría). La app vive en Vorka OS con dominio aislado
// (liderazgo.vorka.mx, ver vorka-os/src/liderazgo/index.js). Aquí solo se vende:
//   /tienda/evaluacion-liderazgo/ → ficha: qué mide, cómo se califica (lo que crees contra lo que has hecho), qué recibes,
//   el seguimiento a los 90 días, menores de edad, regalar, preguntas y compra.
// $149 MXN pago único, regalable (decisión de Dirección del 28-10-2026). No es una prueba psicométrica y no se presenta así.
// Entrega: la liga personal la da Vorka OS por service binding (ver ruta-entrega.js › APPS_OS). Aquí no hay datos de nadie.
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc, WHATSAPP } from './paginas.js';
import { refDeVisita, precio, navTienda, masTienda, seccionFaq, seccionCompra, formCompra, SCRIPT_COMPRA } from './tienda.js';
import { oferta, ofertas, migas } from './seo.js';
import { resenasDe, ldResenas, seccionResenas } from './resenas.js';
import { FLECHA } from './marco.generado.js';

export const SLUG_LIDERAZGO = 'evaluacion-liderazgo';
export const RUTA_LIDERAZGO = '/tienda/evaluacion-liderazgo/';
const APP = 'https://liderazgo.vorka.mx';
const MENTORIA = '/mentoriaoleynick/';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
// Precio decidido por Dirección: solo se usa en textos si el producto aún no está a la venta
const PRECIO_BASE = 149;

const DIMENSIONES = ['Liderazgo', 'Iniciativa', 'Servicio', 'Trabajo en equipo', 'Comunicación', 'Resiliencia', 'Claridad de propósito', 'Visión', 'Capacidad de ejecución', 'Medición de impacto', 'Autoconocimiento', 'Capacidad de movilización'];
// Ejemplo ilustrativo (no es de nadie): nota, lo que cree, lo que ha hecho
const EJEMPLO = [['Servicio', 7.4, 8.1, 7.2, 'Alineada'], ['Iniciativa', 5.2, 8.4, 3.3, 'Por demostrar'], ['Medición de impacto', 4.1, 6.9, 2.5, 'Por demostrar'], ['Resiliencia', 7.0, 5.6, 8.3, 'Subestimada']];

const faq = ({ precioN = PRECIO_BASE } = {}) => [
  ['¿Qué es la Evaluación de liderazgo Vorka?', 'Son 80 preguntas en línea, unos 25 minutos, que te dan una foto de dónde estás hoy como líder en 12 dimensiones. Cruza dos cosas: lo que crees de ti (cómo actúas y qué harías en situaciones reales) y lo que has hecho (cargos, proyectos, cifras y constancias). La diferencia entre las dos es justo lo que se puede trabajar.'],
  ['¿Es una prueba psicométrica?', 'No. No es psicométrica ni está validada como tal, y no la presentamos así. Es la herramienta que usamos en Vorka México para empezar cada mentoría: ordena lo que la persona cree de sí y lo que ha hecho, y de ahí sale un plan de trabajo concreto.'],
  ['¿Me dice si me voy a quedar en una beca?', 'No. Tu resultado no es una probabilidad de admisión a Líderes del Mañana ni a ningún otro programa. Te dice en qué dimensiones tienes evidencia, en cuáles te falta demostrar con hechos y qué hacer en los próximos 30 días.'],
  ['¿Cómo se califica?', 'Cada dimensión va de 0 a 10. Una cuarta parte sale de cómo te ves, otra cuarta parte de lo que eliges en las situaciones, y la mitad de los hechos que declaras: lo hecho pesa más que lo dicho. El global va de 0 a 100. Para cada dimensión ves si está «alineada», «por demostrar» (te ves capaz, pero faltan hechos) o «subestimada» (has hecho más de lo que crees).'],
  ['¿Qué recibo al terminar?', 'Tu resultado en las 12 dimensiones y el global, tus 3 fortalezas, tus 3 áreas de mejora y 3 acciones concretas para los próximos 30 días, cada una con la evidencia que te deja. Lo ves en pantalla, te llega por correo y lo puedes guardar en PDF.'],
  ['¿Qué es la segunda aplicación?', 'Tu compra incluye 2 aplicaciones con la misma liga: la de hoy y una de seguimiento que se abre 90 días después de terminar la primera. En tu segundo resultado ves cuánto subió cada dimensión.'],
  ['Soy menor de edad, ¿la puedo contestar?', 'Sí, si tienes 12 años o más y con autorización de tu mamá, papá o tutor: antes de empezar escribe su nombre y su correo, y marca la autorización. Le mandamos una copia de tus resultados. Si tienes menos de 12 años, la evaluación todavía no es para ti.'],
  ['¿Qué hacen con mis respuestas?', 'Solo las usamos para darte tus resultados y, si contratas Mentoría, para tu plan de trabajo. No se venden ni se comparten. Puedes pedir que las borremos escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. Consulta el <a href="/privacidad/#evaluacion-liderazgo">aviso de privacidad</a>.'],
  ['¿Qué tiene que ver con la Mentoría?', `Es el primer paso de toda <a href="${MENTORIA}">mentoría con Brandon Oleynick</a>: con tus resultados fijamos tu punto de partida y medimos tu avance con hechos. Si ya eres cliente de Mentoría, te la mandamos sin costo. Al terminar, si quieres trabajar tu liderazgo, puedes agendar tu sesión de mentoría.`],
  ['¿Cómo la regalo?', 'En la compra elige «Para regalar». Te llega por correo una liga por cada regalo para que se la mandes a quien quieras, por ejemplo por WhatsApp. La liga es personal: la primera persona que la abre y escribe sus datos es quien la contesta.'],
  ['¿Cómo recibo mi acceso?', 'En cuanto se confirma tu pago te llega un correo con el botón «Empezar mi evaluación». Funciona en el navegador del celular o de la computadora; no tienes que descargar nada. Si una mamá o un papá la compra para su hija o hijo, la reenvía tal cual: quien contesta escribe sus propios datos.'],
  ['¿Cómo puedo pagar?', `Con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI. Es un pago único de $${precioN} MXN: no se renueva solo. El pago lo procesa Stripe; nosotros nunca vemos los datos de tu tarjeta.`],
  ['¿Hay reembolsos?', 'Por ser un producto digital de acceso inmediato, no hay reembolso una vez que empiezas a contestar. Si algo no funciona, escríbenos y lo resolvemos. Consulta la <a href="/legal/reembolsos/">política de reembolsos</a>.'],
];

export async function paginaLiderazgo(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  // A la venta: activo. Si todavía no, la ficha se ve (para revisarla) pero sin compra y sin indexar.
  const p = await productoPorSlug(env, SLUG_LIDERAZGO);
  if (p && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code }, req);
  const precioN = p ? p.precio_centavos / 100 : PRECIO_BASE;
  const precioT = p ? precio(p) : `$${PRECIO_BASE} MXN`;
  const regalo = url.searchParams.get('regalo') === '1';
  const FAQ = faq({ precioN });
  const rs = p ? await resenasDe(env, RUTA_LIDERAZGO) : null;
  const descripcion = `80 preguntas para saber dónde estás como líder: 12 dimensiones, lo que crees de ti contra lo que has hecho y 3 acciones para 30 días. ${precioT}, pago único.`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Evaluación de liderazgo Vorka', description: descripcion, url: `https://vorka.mx${RUTA_LIDERAZGO}`, brand: { '@type': 'Organization', name: 'Vorka México' },
    offers: oferta({ ruta: RUTA_LIDERAZGO, price: precioN.toFixed(2), disponible: !!p }), ...ldResenas(rs) },
  migas('Evaluación de liderazgo Vorka', RUTA_LIDERAZGO),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const comprar = p ? '#comprar' : '#ayuda';
  return pagina({ navActual: 'catalogo', navOscuro: true, entrar: { url: `${APP}/`, app: 'la Evaluación de liderazgo' }, noindex: !p,
    titulo: 'Evaluación de liderazgo Vorka: dónde estás hoy como líder | 12 dimensiones', ruta: RUTA_LIDERAZGO, descripcion,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: p ? SCRIPT_COMPRA : '',
    cuerpo: `<div class="lv">
<section class="lv-hero"><div class="marco lv-hero-g">
  <div>
    <span class="lv-et">Evaluación de liderazgo Vorka</span>
    <h1 class="lv-h1">¿Dónde estás hoy <em>como líder?</em></h1>
    <p class="lv-lead">80 preguntas, unos 25 minutos. Comparamos lo que crees de ti con lo que has hecho y te decimos, dimensión por dimensión, qué ya está respaldado con hechos y qué todavía tienes que demostrar.</p>
    <div class="lv-ctas"><a class="lv-btn" href="${comprar}">${p ? `Empezar por ${precioT}` : 'Muy pronto'} ${FLECHA}</a>${p ? '<a class="lv-btn ghost" href="?regalo=1#comprar">🎁 Regalarla</a>' : ''}</div>
    <ul class="lv-chips"><li>12 dimensiones</li><li>2 aplicaciones: hoy y a los 90 días</li><li>Desde 12 años</li></ul>
  </div>
  <figure class="lv-muestra" aria-label="Ejemplo ilustrativo de resultados">
    <figcaption>Ejemplo ilustrativo</figcaption>
    <div class="lv-glob"><b>58</b><span>de 100 · En construcción</span></div>
    ${EJEMPLO.map(([n, nota, per, evi, l]) => `<div class="lv-dim"><div class="lv-dim-h"><span>${n}</span><b>${nota.toFixed(1)}</b></div><div class="lv-pista"><i class="r" style="width:${nota * 10}%"></i><i class="m per" style="left:${per * 10}%"></i><i class="m evi" style="left:${evi * 10}%"></i></div><small class="lv-l ${l === 'Por demostrar' ? 'pd' : l === 'Subestimada' ? 'sub' : ''}">${l}</small></div>`).join('')}
    <p class="lv-ley"><span><i class="per"></i> Lo que crees de ti</span><span><i class="evi"></i> Lo que has hecho</span></p>
  </figure>
</div>
${navTienda('examenes')}
</section>

<section class="lv-sec" id="que-mide"><div class="marco">
  <div class="lv-cab"><span class="lv-et">Qué mide</span><h2>12 dimensiones, las mismas que trabajamos en cada mentoría.</h2><p>Para becas y programas como Líderes del Mañana no basta con decir que eres líder: hay que mostrarlo con hechos.</p></div>
  <ul class="lv-dims">${DIMENSIONES.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
</div></section>

<section class="lv-sec suave" id="como"><div class="marco">
  <div class="lv-cab"><span class="lv-et">Cómo funciona</span><h2>Lo que crees de ti, contra lo que has hecho.</h2></div>
  <ol class="lv-tres">${[['Cómo actúas', '48 preguntas sobre qué tan seguido haces ciertas cosas. Algunas están al revés a propósito, para detectar respuestas al aire.'],
    ['Qué harías', '12 situaciones reales con 4 opciones. Ninguna es la «obvia»: miden tu criterio, no lo que suena bien.'],
    ['Lo que has hecho', '20 preguntas sobre hechos de los últimos 2 años: cargos, proyectos, horas, cifras y constancias. Pesan la mitad de tu nota.']].map(([t, d], k) => `<li><span class="lv-n">0${k + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
  <p class="lv-pie">No es una prueba psicométrica ni dice tu probabilidad de entrar a una beca: es una foto honesta para saber por dónde empezar.</p>
</div></section>

<section class="lv-sec" id="recibes"><div class="marco lv-dos">
  <div class="lv-cab izq"><span class="lv-et">Lo que recibes</span><h2>Un resultado que se convierte en plan.</h2>
    <p>Al terminar lo ves en pantalla, te llega por correo y lo puedes guardar en PDF.</p></div>
  <ul class="lv-lista">${['Tu global sobre 100 y tu nota de 0 a 10 en cada dimensión', 'Por dimensión: alineada, por demostrar o subestimada', 'Tus 3 fortalezas y tus 3 áreas de mejora', '3 acciones para los próximos 30 días, cada una con la evidencia que te deja', 'Una segunda aplicación a los 90 días para ver cuánto avanzaste', 'Si quieres trabajar tu liderazgo, la liga para agendar tu sesión de mentoría'].map(x => `<li>${x}</li>`).join('')}</ul>
</div></section>

<section class="lv-sec lv-osc" id="mentoria"><div class="marco lv-dos">
  <div class="lv-cab izq"><span class="lv-et">Mentoría</span><h2>El primer paso de cada mentoría.</h2>
    <p>Con tus resultados fijamos tu punto de partida y medimos tu avance con hechos, no con impresiones. Si ya eres cliente de <a href="${MENTORIA}">Mentoría</a>, te la mandamos sin costo.</p></div>
  <div class="lv-cab izq"><span class="lv-et">Menores de edad</span><h2>Desde 12 años, con permiso.</h2>
    <p>De 12 a 17 años, antes de empezar se pide la autorización de su mamá, papá o tutor, que recibe una copia de los resultados. No pedimos datos sensibles.</p></div>
</div></section>

${p ? seccionCompra({ titulo: 'Haz tu evaluación', intro: `${precioT}, pago único con 2 aplicaciones.`,
  pasos: [['Pagas una sola vez', 'Con tarjeta, en OXXO o por SPEI. No se renueva solo.'], ['Te llega tu liga por correo', 'Con el botón «Empezar mi evaluación». Si es regalo, te llega una liga por cada uno.'], ['Contestas en 25 minutos', 'En el celular o la computadora, sin descargar nada.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Tus respuestas no se venden ni se comparten', 'Soporte de personas por correo y WhatsApp'],
  form: formCompra(p, { error: url.searchParams.get('error') || '', ref: code || '', regalo, mensajeEjemplo: '¡Para que sepas todo lo que ya has logrado!' }) })
  : `<section class="lv-sec suave" id="comprar"><div class="marco"><p class="lv-pronto">La venta abre muy pronto. ¿Dudas? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> o por <a href="${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>.</p></div></section>`}

${seccionResenas(rs)}
${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), whatsappTexto: 'Hola, tengo una duda sobre la Evaluación de liderazgo Vorka',
  pie: '<p class="t-nota t-legal">Evaluación de liderazgo Vorka · No es una prueba psicométrica ni una probabilidad de admisión · Vorka México</p>' })}
${await masTienda(env, 'examenes')}
${p ? `<div class="t-barra" id="barra-compra"><div><b class="num">${precioT}</b><small>Pago único · 2 aplicaciones</small></div><a class="btn acento chico" href="#comprar">Empezar</a></div>` : ''}
</div>`,
  });
}

const CSS = `
.lv{--lv-noche:#0f0d10;--lv-morado:#6b2a85;--lv-oro:#c8a45c;--lv-oro-c:#e6cf96;--lv-crema:#f4f2f5}
.lv-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--lv-oro-c);color:#1b1408;font-weight:700;font-size:16px;text-decoration:none;transition:transform .2s var(--ease)}
.lv-btn:hover{transform:translateY(-1px)}.lv-btn svg{width:17px;height:17px}
.lv-btn.ghost{background:rgba(255,255,255,.06);color:var(--lv-crema);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.lv-hero{position:relative;isolation:isolate;overflow:hidden;margin-top:-104px;padding:140px 0 26px;background:var(--lv-noche);color:var(--lv-crema)}
.lv-hero::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(55% 70% at 85% 25%,rgba(107,42,133,.5),transparent 70%),radial-gradient(40% 50% at 0% 100%,rgba(200,164,92,.16),transparent 70%)}
.lv-hero-g{display:grid;gap:40px;align-items:center;padding-bottom:30px}.lv-hero-g>*{min-width:0}@media(min-width:960px){.lv-hero-g{grid-template-columns:1.1fr .9fr}}
.lv-et{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--lv-morado)}.lv-hero .lv-et,.lv-osc .lv-et{color:var(--lv-oro-c)}
.lv-h1{font-weight:800;font-size:clamp(40px,6.2vw,72px);line-height:1;letter-spacing:-.05em;margin:18px 0 0;max-width:13ch;text-wrap:balance}.lv-h1 em{font-style:normal;color:var(--lv-oro-c)}
.lv-lead{margin-top:20px;font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:rgba(244,242,245,.78);max-width:34em}
.lv-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
.lv-chips{list-style:none;padding:0;margin:22px 0 0;display:flex;flex-wrap:wrap;gap:8px}.lv-chips li{padding:7px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.16);font-size:14px;color:rgba(244,242,245,.8)}
.lv-hero .t-nav-tienda a{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:rgba(244,242,245,.8)}.lv-hero .t-nav-tienda a[aria-current]{background:var(--lv-crema);border-color:var(--lv-crema);color:var(--lv-noche)}
.lv-hero>.t-nav-tienda{width:min(100% - 32px,1180px);margin:0 auto}
.lv-muestra{margin:0;padding:22px;border-radius:26px;background:#fff;color:#141114;box-shadow:0 50px 90px -40px rgba(0,0,0,.6);display:grid;gap:12px;max-width:440px;justify-self:center;width:100%}
.lv-muestra figcaption{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#a8a4a9}
.lv-glob{display:flex;align-items:baseline;gap:10px}.lv-glob b{font-size:44px;letter-spacing:-.04em;line-height:1}.lv-glob span{color:#6d696e;font-size:14px}
.lv-dim-h{display:flex;justify-content:space-between;font-size:14.5px;font-weight:600}
.lv-pista{position:relative;height:8px;border-radius:99px;background:#eceae6;margin:8px 0 4px}.lv-pista .r{position:absolute;inset:0 auto 0 0;border-radius:99px;background:#141114;opacity:.14}
.lv-pista .m{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid #fff}
.lv .per{background:var(--lv-morado)}.lv .evi{background:var(--lv-oro)}
.lv-l{font-size:12px;font-weight:700;color:#6d696e}.lv-l.pd{color:var(--lv-morado)}.lv-l.sub{color:#2b8553}
.lv-ley{display:flex;flex-wrap:wrap;gap:14px;margin:4px 0 0;font-size:12.5px;color:#6d696e}.lv-ley span{display:inline-flex;align-items:center;gap:6px}.lv-ley i{width:10px;height:10px;border-radius:50%;display:inline-block}
.lv-sec{padding:clamp(56px,8vw,100px) 0}.lv-sec.suave{background:var(--bg-2)}.lv-osc{background:var(--lv-noche);color:var(--lv-crema)}
.lv-cab{max-width:700px;margin:0 auto 34px;text-align:center}.lv-cab.izq{text-align:left;margin:0}
.lv-cab h2{font-weight:800;font-size:clamp(30px,4.2vw,48px);line-height:1.05;letter-spacing:-.045em;margin:10px 0 0;text-wrap:balance}
.lv-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}.lv-osc .lv-cab p{color:rgba(244,242,245,.74)}.lv-osc a{color:var(--lv-oro-c)}
.lv-dims{list-style:none;padding:0;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:900px}.lv-dims li{padding:10px 18px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-weight:650}
.lv-tres{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.lv-tres li{padding:24px;border-radius:22px;background:var(--card);border:1px solid var(--line)}.lv-n{font-weight:800;font-size:14px;color:var(--lv-morado)}
.lv-tres b{display:block;font-size:20px;letter-spacing:-.02em;margin-top:8px}.lv-tres p{margin:6px 0 0;color:var(--fg-2);line-height:1.5}
.lv-pie{margin:22px auto 0;text-align:center;color:var(--fg-2);font-size:14.5px;max-width:640px}
.lv-dos{display:grid;gap:40px;align-items:start}.lv-dos>*{min-width:0}@media(min-width:980px){.lv-dos{grid-template-columns:1fr 1fr}}
.lv-lista{list-style:none;padding:0;margin:0;display:grid;gap:10px}.lv-lista li{padding:14px 18px 14px 46px;border-radius:16px;background:var(--card);border:1px solid var(--line);position:relative;line-height:1.45}
.lv-lista li::before{content:"";position:absolute;left:18px;top:19px;width:12px;height:12px;border-radius:50%;background:var(--lv-oro)}
.lv-pronto{text-align:center;font-size:18px;color:var(--fg-2)}
.lv #form-compra .btn.acento{background:var(--fg);color:var(--bg)}`;
