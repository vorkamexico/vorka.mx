// Tienda › Academias + Vuelve (vorka.mx/tienda/academias/): para academias de baile, idiomas, música, deporte o regularización.
// «Mi academia» vive dentro de Vuelve (os.vorka.mx/vuelve): grupos con horario, alumnos con su tutor, pase de lista y mensualidades,
// más la tarjeta de lealtad para premiar la constancia y las recomendaciones. Se cobra como paquete 'academias-vuelve'
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
const PLANES = [{ slug: 'academias-vuelve-mensual', nombre: 'Mensual', cada: 'al mes', renueva: 'cada mes' }, { slug: 'academias-vuelve-anual', nombre: 'Anual', cada: 'al año', renueva: 'cada año' }];
const pesosRedondo = c => '$' + (c / 100).toLocaleString('es-MX', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });

const QUE = [
  ['Grupos y horarios', 'Cada grupo con sus días, su hora de entrada y salida, su cupo y su mensualidad. Si se llena, la app te avisa antes de inscribir a alguien más.'],
  ['Pase de lista', 'Abres «Hoy» y ves las clases del día con sus alumnos. Palomeas quién vino y queda el porcentaje de asistencia de cada uno.'],
  ['Mensualidades', 'Quién ya pagó el mes, quién está por pagar y quién va atrasado. Registras el pago en dos toques y mandas el recordatorio por WhatsApp ya escrito.'],
  ['Tarjeta de lealtad', 'Vuelve en el celular de cada familia: sellos por constancia, premios que tú eliges y un regalo para quien recomiende a un alumno nuevo.'],
];
const INCLUYE = ['Grupos, alumnos y tutores sin límite práctico (hasta 800 alumnos)', 'Pase de lista y asistencia de los últimos 60 días', 'Mensualidad por grupo y precios especiales o becas', 'Recordatorio de pago por WhatsApp listo para enviar', 'Tarjeta Vuelve con tu logo en Apple y Google Wallet', 'Tu logo en la app y en la tarjeta', 'Soporte por WhatsApp, sin llamadas'];
const FAQ = [
  ['¿Puedo probarlo antes de pagar?', `Sí. Entra a <a href="${APP}">os.vorka.mx/vuelve</a> con tu correo, elige «Clases o escuela» como tipo de negocio y tienes 7 días con todo, sin tarjeta. Si te sirve, te suscribes aquí con el mismo correo y todo sigue tal cual.`],
  ['¿Vuelve cobra las mensualidades por mí?', 'No. Tus alumnos te pagan directo a ti, en efectivo, por transferencia o con tarjeta, como siempre. La app solo lleva el registro de quién pagó y te ayuda a recordarle a quien falta, desde tu WhatsApp.'],
  ['¿Sirve para cualquier academia?', 'Para las que trabajan por grupos con horario y mensualidad: baile, idiomas, música, artes, deportes, regularización o natación. Si cobras por clase suelta, también puedes registrar cada pago con su monto.'],
  ['¿Quién ve los datos de mis alumnos?', 'Solo tú, con tu correo. Ni siquiera el equipo de Vorka los ve cuando te ayuda a configurar tu tarjeta. Los descargas o los das de baja cuando quieras.'],
  ['¿Qué pasa si dejo de pagar?', 'Tu tarjeta de lealtad y Mi academia se pausan, pero tus alumnos, pagos y asistencias se quedan guardados. Al renovar, todo sigue donde lo dejaste.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Vuelve › Cuenta y pagos, sin llamadas. Sigues con todo hasta el final del periodo pagado.'],
];
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONOS = [svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'), svg('<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'),
  svg('<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>'), svg('<rect x="3" y="5.5" width="18" height="13" rx="3"/><circle cx="8" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/>')];

// Cómo se ve: un pase de lista y una tarjeta (ilustración hecha con HTML, no captura)
const VISTA = `<div class="ac-vista" aria-hidden="true">
  <div class="ac-pant"><small>Hoy · Lun 17:00–18:00</small><b>Ballet infantil</b>
    <ul>${[['Sofía', 1, 'Al corriente'], ['Mateo', 1, 'Al corriente'], ['Valeria', 0, 'Mensualidad atrasada'], ['Emilia', 1, '']].map(([n, si, e]) => `<li><span class="ac-chk${si ? ' si' : ''}"></span><span><b>${n}</b>${e ? `<em class="${e.includes('atrasada') ? 'av' : ''}">${e}</em>` : ''}</span></li>`).join('')}</ul>
    <span class="ac-btn">Guardar asistencia</span></div>
  <div class="ac-tar"><b>Danza Aurora</b><p>Hola, familia de Sofía</p><p class="ac-cuenta"><b>6</b> / 8 sellos</p>
    <div class="ac-sellos">${Array.from({ length: 8 }, (_, i) => `<i class="${i < 6 ? 'si' : i === 7 ? 'premio' : ''}"></i>`).join('')}</div><small>2 meses más y te llevas una clase de regalo.</small></div>
</div>`;

export async function paginaAcademias(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug) })))).filter(x => x.prod);
  const mensual = planes.find(x => x.slug === 'academias-vuelve-mensual'), anual = planes.find(x => x.slug === 'academias-vuelve-anual');
  const ahorro = mensual && anual ? mensual.prod.precio_centavos * 12 - anual.prod.precio_centavos : 0;
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : (planes[0]?.slug || '');
  const elegidoP = planes.find(x => x.slug === elegido);
  if (mensual && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: mensual.prod.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Academias + Vuelve · Control de alumnos, asistencia y mensualidades', brand: { '@type': 'Brand', name: 'Vorka México' },
    description: 'Grupos, alumnos, pase de lista y mensualidades para academias, con tarjeta de lealtad para las familias.',
    ...(planes.length ? { offers: planes.map(x => oferta({ ruta: RUTA_ACADEMIAS, centavos: x.prod.precio_centavos, name: `Plan ${x.nombre.toLowerCase()}` })) } : {}) },
  migas('Academias', RUTA_ACADEMIAS),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const desde = mensual ? precio(mensual.prod) : null;
  return pagina({ navActual: 'catalogo', entrar: { url: APP, app: 'Vuelve' },
    titulo: 'Academias + Vuelve: alumnos, asistencia y mensualidades | Vorka México', ruta: RUTA_ACADEMIAS,
    descripcion: 'Para academias de baile, idiomas, música y deporte: grupos con horario, pase de lista, quién pagó el mes y recordatorios por WhatsApp, con tarjeta de lealtad para las familias.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT,
    cuerpo: `<div class="ac">
<section class="ac-hero"><div class="marco ac-hero-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Academias</nav>
    <h1 class="t-h1">Tu academia en orden: quién vino, quién pagó y quién regresa.</h1>
    <p class="t-lead">Grupos, alumnos, pase de lista y mensualidades en tu celular, con tu logo. Y una tarjeta de lealtad para que las familias sigan inscritas y te recomienden.</p>
    <div class="ac-btns"><a class="btn acento" href="${APP}">Pruébalo 7 días gratis ${FLECHA}</a><a class="btn blanco" href="#comprar" data-ir="comprar">Ver precio</a></div>
    <p class="ac-mini">${desde ? `${desde} al mes · ` : ''}Sin tarjeta para probar · Soporte por WhatsApp</p>
  </div>${VISTA}
</div></section>

<section class="ac-sec"><div class="marco">
  <h2 class="t-h2 ac-h2">Lo que hoy llevas en libreta y en tu cabeza.</h2>
  <div class="ac-cuatro">${QUE.map(([t, d], i) => `<article class="ac-card"><span class="ac-ico">${ICONOS[i]}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
  <p class="ac-aviso">Vuelve <b>no cobra a tus alumnos ni mueve dinero</b>: te pagan directo a ti, como siempre. La app lleva el registro y te ayuda a recordar.</p>
</div></section>

<section class="ac-sec suave" id="precio"><div class="marco">
  <h2 class="t-h2 ac-h2">Un precio, todo incluido.</h2>
  <p class="ac-sub">En pesos mexicanos con IVA incluido. Cancela cuando quieras.</p>
  <div class="ac-planes">${planes.map(x => `<article class="ac-plan${x.slug.endsWith('mensual') ? ' rec' : ''}">${x.slug.endsWith('anual') && ahorro > 0 ? `<span class="ac-sello">Ahorra ${pesosRedondo(ahorro)}</span>` : ''}
    <h3>${x.nombre}</h3><p class="ac-precio"><b>${precio(x.prod)}</b> <small>${x.cada}</small></p>
    <ul>${(x.slug.endsWith('anual') ? ['Todo lo del plan mensual', 'Un solo pago al año', '2 meses gratis'] : INCLUYE).map(i => `<li>${CHECK}<span>${esc(i)}</span></li>`).join('')}</ul>
    <a class="btn${x.slug.endsWith('mensual') ? ' acento' : ' blanco'}" href="?plan=${x.slug}#comprar" data-ir="comprar" data-plan="${x.slug}">Suscribirme</a></article>`).join('')}</div>
  ${planes.length ? '' : `<p class="ac-sub">Muy pronto. Mientras, <a href="${APP}">pruébalo gratis</a> o <a href="${WA}" target="_blank" rel="noopener">escríbenos por WhatsApp</a>.</p>`}
</div></section>

${planes.length ? seccionCompra({ titulo: 'Suscríbete a Academias + Vuelve', intro: `¿Aún no lo pruebas? <a href="${APP}">Empieza gratis</a>, sin tarjeta. Si ya lo usas, suscríbete con el mismo correo y todo sigue tal cual.`,
  pasos: [['Elige mensual o anual', 'Y escribe el correo con el que entras a Vuelve.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Sigues donde estabas', 'Mi academia y tu tarjeta quedan activas al instante.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por WhatsApp'],
  form: `<form class="t-form t-compra" id="form-ac" method="post" action="/api/checkout" novalidate${attrPlanesCarrito(planes.map(x => x.prod))}>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <fieldset class="t-campo ac-elige"><legend>Plan</legend>${planes.map(x => `<label class="ac-op"><input type="radio" name="slug" value="${x.slug}"${x.slug === elegido ? ' checked' : ''}><span><b>${x.nombre} · ${precio(x.prod)} ${x.cada}</b><small>${x.slug.endsWith('anual') && ahorro > 0 ? `Ahorra ${pesosRedondo(ahorro)} contra el mensual` : 'Sin plazo forzoso'}</small></span></label>`).join('')}</fieldset>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo con el que entras a Vuelve.</small></div>
    <p class="ac-total">Pagas hoy <b id="ac-hoy-p">${precio(elegidoP.prod)}</b> <span id="ac-luego">y luego ${precio(elegidoP.prod)} ${elegidoP.renueva}</span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/vuelve/" target="_blank">condiciones de Vuelve</a> (incluida la renovación automática) y el <a href="/legal/vuelve/privacidad/" target="_blank">aviso de privacidad de Vuelve</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="ac-precios">${JSON.stringify(Object.fromEntries(planes.map(x => [x.slug, { c: x.prod.precio_centavos, renueva: x.renueva }]))).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/vuelve/">Condiciones de Vuelve</a> · <a href="/legal/vuelve/privacidad/">Aviso de privacidad</a> · Academias + Vuelve · by Vorka México</p>' })}
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
.ac-plan h3{margin:0;font-size:20px}.ac-precio{margin:0}.ac-precio b{font-size:34px;letter-spacing:-.03em}.ac-precio small{color:var(--fg-2)}
.ac-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:9px}.ac-plan li{display:flex;gap:8px;font-size:15px}.ac-plan li svg{flex:none;width:18px;height:18px;margin-top:2px}
.ac-sello{position:absolute;top:-13px;left:24px;background:var(--ac);color:#fff;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px}
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
