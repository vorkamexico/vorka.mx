// Tienda › Academias (vorka.mx/tienda/academias/): para academias de danza, idiomas, deportes, música y escuelas chicas.
// «Mi academia» vive dentro de Vuelve (os.vorka.mx/vuelve): grupos con horario, alumnos con su tutor, pase de lista y mensualidades.
// La tarjeta de lealtad de Vuelve viene incluida pero va en segundo plano: la página vende el control de la academia.
// Solo se anuncia lo que la app ya hace (src/vuelve/academia.js en Vorka OS). Aún NO hay credencial del alumno con QR ni pase
// de lista escaneando: la ficha de la maqueta es la del alumno en la app (grupo, asistencia de 60 días y mensualidad). Se cobra como paquete 'academias-vuelve'
// (ver PAQUETES en suscripciones.js): Vuelve lo ve como su suscripción y abre Mi academia. Prueba de 7 días sin tarjeta en la app.
// Vuelve no cobra a los alumnos ni mueve dinero: solo lleva el registro.
import { attrPlanesCarrito } from './carrito.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { oferta, migas } from './seo.js';
import { FLECHA, CHECK } from './marco.generado.js';

export const RUTA_ACADEMIAS = '/tienda/academias/';
const APP = 'https://os.vorka.mx/vuelve/';
const WA = 'https://wa.me/528117804869?text=' + encodeURIComponent('Hola, tengo una duda sobre Academias + Vuelve.');
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
// Dos tamaños (decisión del dueño, 27-11-2026): hasta 25 alumnos al precio de Vuelve ($399, paquete 'academias-chica', migración 0100;
// Vorka OS pone el tope de 25) y hasta 800 alumnos ($599, paquete 'academias-vuelve'). Cada uno mensual o anual con 2 meses gratis.
const TAMANOS = [
  { titulo: 'Hasta 25 alumnos', para: 'Para academias que empiezan o trabajan con pocos grupos.', m: 'academias-chica-mensual', a: 'academias-chica-anual' },
  { titulo: 'Hasta 800 alumnos', para: 'Para academias con varios grupos y niveles.', m: 'academias-vuelve-mensual', a: 'academias-vuelve-anual' },
];
const PLANES = TAMANOS.flatMap(t => [{ slug: t.m, nombre: `${t.titulo} · Mensual`, cada: 'al mes', renueva: 'cada mes' }, { slug: t.a, nombre: `${t.titulo} · Anual`, cada: 'al año', renueva: 'cada año' }]);
const pesosRedondo = c => '$' + (c / 100).toLocaleString('es-MX', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });

const QUE = [
  ['Grupos y horarios', 'Cada grupo con sus días, su hora de entrada y salida, su cupo y su mensualidad. Si se llena, la app te avisa antes de inscribir a alguien más.'],
  ['Pase de lista', 'Abres «Hoy» y ves las clases del día con sus alumnos. Palomeas quién vino y queda el porcentaje de asistencia de cada uno.'],
  ['La ficha de cada alumno', 'Su grupo, su tutor con WhatsApp, su día de pago, si tiene beca o precio especial y cómo va su asistencia de los últimos 60 días.'],
  ['Mensualidades', 'Quién ya pagó el mes, quién está por pagar y quién va atrasado. Registras el pago en dos toques y mandas el recordatorio por WhatsApp ya escrito.'],
];
// Para quién es: giros con ejemplos de cómo lo usan (sin nombres de academias reales)
const PARA = [
  ['Danza y ballet', 'Grupos por edad y nivel, con su horario y su mensualidad.'],
  ['Idiomas', 'Niveles con cupo, alumnos adultos o con tutor, y becas.'],
  ['Deportes y natación', 'Entrenamientos varios días a la semana y quién sí está viniendo.'],
  ['Música y artes', 'Clases grupales o casi individuales, cada una con su precio.'],
  ['Escuelas chicas y regularización', 'Grupos, tutores y colegiaturas al día sin hojas de Excel.'],
];
const INCLUYE = ['Grupos con horario, cupo y mensualidad; alumnos con su tutor', 'Pase de lista y asistencia de los últimos 60 días', 'Mensualidad por grupo y precios especiales o becas', 'Recordatorio de pago por WhatsApp listo para enviar', 'Tu logo en la app', 'Si quieres, tarjeta de lealtad para las familias en Apple y Google Wallet', 'Soporte por WhatsApp, sin llamadas'];
const FAQ = [
  ['¿Puedo probarlo antes de pagar?', `Sí. Entra a <a href="${APP}">os.vorka.mx/vuelve</a> con tu correo, elige «Clases o escuela» como tipo de negocio y tienes 7 días con todo, sin tarjeta. Si te sirve, te suscribes aquí con el mismo correo y todo sigue tal cual.`],
  ['¿Vuelve cobra las mensualidades por mí?', 'No. Tus alumnos te pagan directo a ti, en efectivo, por transferencia o con tarjeta, como siempre. La app solo lleva el registro de quién pagó y te ayuda a recordarle a quien falta, desde tu WhatsApp.'],
  ['¿Sirve para cualquier academia?', 'Para las que trabajan por grupos con horario y mensualidad: baile, idiomas, música, artes, deportes, regularización o natación. Si cobras por clase suelta, también puedes registrar cada pago con su monto.'],
  ['¿Quién ve los datos de mis alumnos?', 'Solo tú, con tu correo. Ni siquiera el equipo de Vorka los ve cuando te ayuda a configurar tu tarjeta. Los descargas o los das de baja cuando quieras.'],
  ['¿Qué pasa si dejo de pagar?', 'Tu tarjeta de lealtad y Mi academia se pausan, pero tus alumnos, pagos y asistencias se quedan guardados. Al renovar, todo sigue donde lo dejaste.'],
  ['¿Y si mi academia pasa de 25 alumnos?', `Escríbenos <a href="${WA}" target="_blank" rel="noopener">por WhatsApp</a> y te pasamos al plan de hasta 800 alumnos. Tus grupos, alumnos, pagos y asistencias se quedan como están.`],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Vuelve › Cuenta y pagos, sin llamadas. Sigues con todo hasta el final del periodo pagado.'],
];
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONOS = [svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'), svg('<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'),
  svg('<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>'), svg('<rect x="3" y="5.5" width="18" height="13" rx="3"/><circle cx="8" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/>')];

// Cómo se ve: el pase de lista de hoy y la ficha de una alumna (ilustración hecha con HTML, no captura; academia de ejemplo)
const VISTA = `<div class="ac-vista" aria-hidden="true">
  <div class="ac-pant"><small>Hoy · Lun 17:00–18:00</small><b>Ballet infantil</b>
    <ul>${[['Sofía', 1, 'Al corriente'], ['Mateo', 1, 'Al corriente'], ['Valeria', 0, 'Mensualidad atrasada'], ['Emilia', 1, 'Al corriente']].map(([n, si, e]) => `<li><span class="ac-chk${si ? ' si' : ''}"></span><span><b>${n}</b><em class="${e.includes('atrasada') ? 'av' : ''}">${e}</em></span></li>`).join('')}</ul>
    <span class="ac-btn">Guardar asistencia</span></div>
  <div class="ac-ficha"><div class="ac-ficha-cab"><span class="ac-logo">DA</span><span><b>Danza Aurora</b><small>Ficha de alumna</small></span></div>
    <p class="ac-nom">Sofía Ramírez</p><p class="ac-gr">Ballet infantil · Lun y Mié 17:00</p>
    <dl><div><dt>Asistencia (60 días)</dt><dd>92%</dd></div><div><dt>Noviembre</dt><dd class="ac-ok">Pagado</dd></div><div><dt>Tutor</dt><dd>Mariana R.</dd></div></dl></div>
</div>`;

export async function paginaAcademias(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug) })))).filter(x => x.prod);
  const de = slug => planes.find(x => x.slug === slug)?.prod;
  const ahorroDe = a => { const t = TAMANOS.find(x => x.a === a), m = t && de(t.m), y = de(a); return m && y ? m.precio_centavos * 12 - y.precio_centavos : 0; };
  const tamanos = TAMANOS.filter(t => de(t.m));
  const mensual = planes.find(x => x.slug === TAMANOS[0].m) || planes.find(x => x.slug.endsWith('mensual'));   // el de entrada: hasta 25 alumnos
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : (planes[0]?.slug || '');
  const elegidoP = planes.find(x => x.slug === elegido);
  if (mensual && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: mensual.prod.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Academias + Vuelve · Control de alumnos, asistencia y mensualidades', brand: { '@type': 'Brand', name: 'Vorka México' },
    description: 'Grupos, alumnos, pase de lista y mensualidades para academias de danza, idiomas, deportes, música y escuelas chicas.',
    ...(planes.length ? { offers: planes.map(x => oferta({ ruta: RUTA_ACADEMIAS, centavos: x.prod.precio_centavos, name: `Plan ${x.nombre.toLowerCase()}` })) } : {}) },
  migas('Academias', RUTA_ACADEMIAS),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const desde = mensual ? precio(mensual.prod) : null;
  return pagina({ navActual: 'catalogo', entrar: { url: APP, app: 'Academia' },
    titulo: 'Academias: alumnos, pase de lista y mensualidades | Vorka México', ruta: RUTA_ACADEMIAS,
    descripcion: 'Para academias de danza, idiomas, deportes, música y escuelas chicas: grupos con horario, pase de lista, la ficha de cada alumno, quién pagó el mes y recordatorios por WhatsApp.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT,
    cuerpo: `<div class="ac">
<section class="ac-hero"><div class="marco ac-hero-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Academias</nav>
    <h1 class="ac-h1">Tu academia en orden: <b>quién vino, quién pagó y quién sigue.</b></h1>
    <p class="t-lead">Para academias de danza, idiomas, deportes, música y escuelas chicas. Grupos con horario, pase de lista en un toque y mensualidades al día, en tu celular y con tu logo.</p>
    <div class="ac-btns"><a class="btn acento" href="${APP}">Pruébalo 7 días gratis ${FLECHA}</a><a class="btn blanco" href="#precio">Ver precio</a></div>
    <p class="ac-mini">${desde ? `Desde ${desde} al mes · ` : ''}Sin tarjeta para probar · Soporte por WhatsApp</p>
  </div>${VISTA}
</div></section>

<section class="ac-sec"><div class="marco">
  <h2 class="ac-h2">Lo que hoy llevas en libreta <b>y en tu cabeza.</b></h2>
  <div class="ac-cuatro">${QUE.map(([t, d], i) => `<article class="ac-card"><span class="ac-ico">${ICONOS[i]}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
  <p class="ac-aviso">La app <b>no cobra a tus alumnos ni mueve dinero</b>: te pagan directo a ti, como siempre. Lleva el registro y te ayuda a recordar.</p>
</div></section>

<section class="ac-sec suave" id="para-quien"><div class="marco">
  <h2 class="ac-h2">Para academias que trabajan <b>por grupos y mensualidad.</b></h2>
  <ul class="ac-para">${PARA.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul>
  <p class="ac-aviso">Incluye la tarjeta de lealtad de Vuelve por si quieres premiar la constancia y las recomendaciones de las familias. Es opcional.</p>
</div></section>

<section class="ac-sec" id="precio"><div class="marco">
  <div class="ac-cab"><h2 class="ac-h2">Paga según el tamaño <b>de tu academia.</b></h2><p class="ac-sub">Los dos planes traen todo. En pesos mexicanos con IVA incluido. Cancelas cuando quieras.</p></div>
  <div class="ac-precio-g">
    <div class="ac-izq">
      ${tamanos.length ? `<div class="ac-tam">${tamanos.map(t => `<article class="ac-t">
        <h3>${t.titulo}</h3><p class="ac-para-t">${esc(t.para)}</p>
        <p class="ac-precio"><b>${precio(de(t.m))}</b> <small>al mes</small></p>
        ${de(t.a) ? `<p class="ac-anual">o ${precio(de(t.a))} al año, con 2 meses gratis${ahorroDe(t.a) > 0 ? ` (ahorras ${pesosRedondo(ahorroDe(t.a))})` : ''}</p>` : ''}
        <a class="btn blanco ac-ancho" href="?plan=${t.m}#comprar" data-ir="comprar" data-plan="${t.m}">Suscribirme</a></article>`).join('')}</div>` : ''}
      <article class="ac-plan">
        <h3>Los dos planes incluyen</h3>
        <ul>${INCLUYE.map(i => `<li>${CHECK}<span>${esc(i)}</span></li>`).join('')}</ul>
        <a class="btn acento ac-ancho" href="${APP}">Empieza tus 7 días gratis ${FLECHA}</a>
        <p class="ac-nota">${planes.length ? 'Sin tarjeta. Si decides seguir, todo lo que capturaste se queda.' : `Muy pronto. Mientras, <a href="${APP}">pruébalo gratis</a> o <a href="${WA}" target="_blank" rel="noopener">escríbenos por WhatsApp</a>.`}</p>
      </article>
    </div>
    <div class="ac-lado">
      <aside class="ac-caja"><b>Tus alumnos te pagan a ti.</b><p>En efectivo, por transferencia o con tarjeta, como siempre. La app solo registra quién pagó y te deja el recordatorio listo para mandarlo desde tu WhatsApp.</p></aside>
      <aside class="ac-caja"><b>Los datos de tus alumnos son tuyos.</b><p>Solo tú los ves con tu correo; ni el equipo de Vorka entra a esta parte cuando te ayuda. Muchos alumnos son menores, por eso se cuida así.</p></aside>
      <aside class="ac-caja"><b>¿Dudas antes de empezar?</b><p>Te contestamos personas, por WhatsApp.</p><a class="btn blanco ac-ancho" href="${WA}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a></aside>
    </div>
  </div>
</div></section>

${planes.length ? seccionCompra({ titulo: 'Suscríbete a Academias', intro: `¿Aún no lo pruebas? <a href="${APP}">Empieza gratis</a>, sin tarjeta. Si ya lo usas, suscríbete con el mismo correo y todo sigue tal cual.`,
  pasos: [['Elige tu plan', 'Según cuántos alumnos tienes, mensual o anual. Y escribe el correo con el que entras a Vuelve.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Sigues donde estabas', 'Mi academia queda activa al instante.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por WhatsApp'],
  form: `<form class="t-form t-compra" id="form-ac" method="post" action="/api/checkout" novalidate${attrPlanesCarrito(planes.map(x => x.prod))}>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <fieldset class="t-campo ac-elige"><legend>Plan</legend>${planes.map(x => `<label class="ac-op"><input type="radio" name="slug" value="${x.slug}"${x.slug === elegido ? ' checked' : ''}><span><b>${x.nombre} · ${precio(x.prod)} ${x.cada}</b><small>${x.slug.endsWith('anual') && ahorroDe(x.slug) > 0 ? `Ahorra ${pesosRedondo(ahorroDe(x.slug))} contra el mensual` : 'Sin plazo forzoso'}</small></span></label>`).join('')}</fieldset>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo con el que entras a Vuelve.</small></div>
    <p class="ac-total">Pagas hoy <b id="ac-hoy-p">${precio(elegidoP.prod)}</b> <span id="ac-luego">y luego ${precio(elegidoP.prod)} ${elegidoP.renueva}</span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/vuelve/" target="_blank">condiciones de Vuelve</a> (incluida la renovación automática) y el <a href="/legal/vuelve/privacidad/" target="_blank">aviso de privacidad de Vuelve</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="ac-precios">${JSON.stringify(Object.fromEntries(planes.map(x => [x.slug, { c: x.prod.precio_centavos, renueva: x.renueva }]))).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/vuelve/">Condiciones de Vuelve</a> · <a href="/legal/vuelve/privacidad/">Aviso de privacidad</a> · Academias · by Vorka México</p>' })}
${await masTienda(env, 'negocios')}
</div>`,
  });
}

// Fino como Vuelve (nov-2026): Inter delgada para decir y negrita en el color para lo importante; precio con el plan a la izquierda
const CSS = `
.ac{--ac:#F2B705;--ac-tx:#1F1800;--ac-t:#8A6200;font-family:'Inter',system-ui,-apple-system,sans-serif}
:root[data-tema=oscuro] .ac{--ac-t:#F5C842}@media(prefers-color-scheme:dark){:root:not([data-tema=claro]) .ac{--ac-t:#F5C842}}
.ac-hero{padding:clamp(28px,5vw,64px) 0 clamp(40px,6vw,80px)}
.ac-hero-g{display:grid;gap:40px;align-items:center}.ac-hero-g>*{min-width:0}@media(min-width:980px){.ac-hero-g{grid-template-columns:1.05fr .95fr;gap:56px}}
.ac-h1{font:300 clamp(34px,4.6vw,52px)/1.06 'Inter',system-ui,sans-serif;letter-spacing:-.045em!important;margin:14px 0 0;color:var(--fg)}
.ac-h1 b,.ac-h2 b{font-weight:700;color:var(--ac-t)}
.ac-h2{font:300 clamp(26px,3.2vw,36px)/1.15 'Inter',system-ui,sans-serif;letter-spacing:-.04em!important;text-align:center;max-width:760px;margin:0 auto;color:var(--fg)}
.ac-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.ac-mini{margin:14px 0 0;color:var(--fg-2);font-size:14px}
.ac .btn{border-radius:999px}.ac .btn.acento{background:var(--ac);color:var(--ac-tx)}
.ac-vista{display:grid;gap:16px;grid-template-columns:1fr;max-width:540px;justify-self:center;width:100%}
@media(min-width:560px){.ac-vista{grid-template-columns:1.05fr .95fr;align-items:end}}
.ac-pant,.ac-ficha{border-radius:24px;padding:20px;background:var(--card,var(--bg));border:1px solid var(--line);box-shadow:0 30px 60px -36px rgba(0,0,0,.45)}
.ac-pant small{color:var(--fg-2);font-size:12.5px}.ac-pant>b{display:block;font-size:19px;font-weight:650;letter-spacing:-.02em;margin:2px 0 10px}
.ac-pant ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}.ac-pant li{display:flex;gap:10px;align-items:center;font-size:14.5px}.ac-pant li span:last-child{display:grid}
.ac-pant li b{font-weight:600}.ac-pant em{font-style:normal;font-size:12px;color:var(--fg-2)}.ac-pant em.av{color:#B4532A}
.ac-chk{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--line-2,var(--line));flex:none}.ac-chk.si{background:var(--ac);border-color:color-mix(in srgb,var(--ac) 80%,#000);box-shadow:inset 0 0 0 3px var(--card,var(--bg))}
.ac-btn{display:block;margin-top:14px;text-align:center;padding:11px;border-radius:999px;background:var(--ac);color:var(--ac-tx);font-weight:700;font-size:14px}
.ac-ficha-cab{display:flex;gap:10px;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--line)}
.ac-logo{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--ac);color:var(--ac-tx);font-weight:700;font-size:13px;letter-spacing:.02em;flex:none}
.ac-ficha-cab span:last-child{display:grid}.ac-ficha-cab b{font-size:14.5px;font-weight:650}.ac-ficha-cab small{font-size:12px;color:var(--fg-2)}
.ac-nom{margin:14px 0 0;font-size:20px;font-weight:650;letter-spacing:-.02em}.ac-gr{margin:2px 0 0;font-size:13px;color:var(--fg-2)}
.ac-ficha dl{margin:14px 0 0;display:grid;gap:0}.ac-ficha dl div{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line);font-size:13.5px}
.ac-ficha dt{color:var(--fg-2)}.ac-ficha dd{margin:0;font-weight:650;font-variant-numeric:tabular-nums}.ac-ficha dd.ac-ok{color:#1E7A46}
:root[data-tema=oscuro] .ac-ficha dd.ac-ok{color:#6FD39A}@media(prefers-color-scheme:dark){:root:not([data-tema=claro]) .ac-ficha dd.ac-ok{color:#6FD39A}}
.ac-sec{padding:clamp(56px,8vw,96px) 0}.ac-sec.suave{background:var(--bg-2)}
.ac-sub{text-align:center;color:var(--fg-2);margin:12px auto 0;max-width:620px}
.ac-cuatro{display:grid;gap:14px;margin-top:36px;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))}
.ac-card{padding:24px;border-radius:22px;background:var(--card,var(--bg));border:1px solid var(--line)}.ac-card h3{margin:14px 0 0;font-size:17px;font-weight:650;letter-spacing:-.015em}.ac-card p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
.ac-ico{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:12px;background:color-mix(in srgb,var(--ac) 12%,transparent);color:var(--ac-t)}.ac-ico svg{width:22px;height:22px}
.ac-aviso{margin:24px auto 0;max-width:680px;text-align:center;color:var(--fg-2);font-size:14.5px}.ac-aviso b{color:var(--fg);font-weight:650}
.ac-para{list-style:none;padding:0;margin:32px auto 0;max-width:1000px;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))}
.ac-para li{padding:18px;border-radius:18px;background:var(--card,var(--bg));border:1px solid var(--line)}.ac-para b{display:block;font-size:15.5px;font-weight:650}.ac-para span{display:block;margin-top:4px;color:var(--fg-2);font-size:14.5px;line-height:1.45}
.ac-cab{margin-bottom:32px}
.ac-precio-g{display:grid;gap:18px;max-width:1040px;margin:0 auto;align-items:start}@media(min-width:900px){.ac-precio-g{grid-template-columns:1.3fr .7fr}}
.ac-izq{display:grid;gap:18px}
.ac-tam{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}
.ac-t{display:flex;flex-direction:column;padding:24px;border-radius:26px;background:var(--card,var(--bg));border:1.5px solid var(--line)}.ac-t:hover{border-color:var(--ac)}
.ac-t h3{margin:0;font-weight:650;font-size:18px;letter-spacing:-.02em}.ac-para-t{margin:6px 0 0;color:var(--fg-2);font-size:14.5px;line-height:1.45;flex:1 0 auto}
.ac-t .ac-precio{margin-top:14px}.ac-t .ac-anual{margin-bottom:16px}
.ac-plan{display:flex;flex-direction:column;background:var(--card,var(--bg));border:1.5px solid var(--ac);border-radius:26px;padding:28px;box-shadow:0 30px 70px -48px color-mix(in srgb,var(--ac) 80%,transparent)}
.ac-plan h3{margin:0;font-weight:650;font-size:18px;color:var(--fg)}
.ac-plan ul{grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.ac-precio{margin:8px 0 0}.ac-precio b{font-weight:650;font-size:40px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.ac-precio small{color:var(--fg-2);font-size:16px}
.ac-anual{margin:2px 0 0;color:var(--fg-2);font-size:15px}
.ac-plan ul{list-style:none;padding:0;margin:18px 0 22px;display:grid;gap:9px}.ac-plan li{display:flex;gap:9px;align-items:flex-start;font-size:15px;line-height:1.45}.ac-plan li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--ac-t)}
.ac-ancho{width:100%}
.ac-nota{color:var(--fg-2);font-size:14.5px;margin:12px 0 0;text-align:center}.ac-nota a{color:var(--ac-t);font-weight:700}
.ac-sus{margin:14px 0 0;padding-top:14px;border-top:1px solid var(--line);font-size:15px;color:var(--fg-2);text-align:center}.ac-sus a{color:var(--ac-t);font-weight:700}
.ac-lado{display:grid;gap:18px;align-content:start}
.ac-caja{padding:24px;border-radius:26px;background:var(--bg-2);border:1px solid var(--line)}
.ac-caja>b{display:block;font-size:18px;font-weight:650;letter-spacing:-.02em;line-height:1.25}.ac-caja>p{margin:8px 0 0;color:var(--fg-2);line-height:1.5;font-size:15px}.ac-caja .btn{margin-top:16px}
.ac-elige{display:grid;gap:8px;border:0;padding:0;margin:0}.ac-op{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:1.5px solid var(--line);border-radius:14px;cursor:pointer}
.ac-op:has(input:checked){border-color:var(--ac)}.ac-op span{display:grid}.ac-op small{color:var(--fg-2);font-size:13px}
.ac-total{margin:6px 0 0;font-size:15px}.ac-total b{font-size:19px}.ac-total span{color:var(--fg-2)}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-ac');
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
