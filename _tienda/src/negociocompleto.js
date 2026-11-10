// Tienda › Negocio Completo (vorka.mx/tienda/negocio-completo/): página web + Agenda + Vuelve en una suscripción de $749 al mes,
// con el «Arranque en 7 días» como casilla OPCIONAL de pago único ($1,490, migración 0081). Productos: migración 0079.
// La mensualidad trae la página con diseño profesional adaptado a su logo y colores; el Arranque suma el diseño PERSONALIZADO de la página
// (a la medida de su marca) y la configuración de Agenda y Vuelve por el equipo (migración 0083).
// Se guarda como el paquete Agenda + Vuelve (abre las dos apps con el mismo correo); la página web se empieza por WhatsApp.
// Quien llega por la campaña de WhatsApp puede pagar el primer mes por transferencia (en Vorka OS se le da 1 mes de cortesía
// de este plan) y al mes siguiente se suscribe aquí con tarjeta.
import { pagina, esc } from './paginas.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { refDeVisita, precio, seccionFaq } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { CSS_MIRA, GIROS } from './miratunegocio.js';

export const RUTA_NEGOCIO_COMPLETO = '/tienda/negocio-completo/';
export const SLUG_NEGOCIO_COMPLETO = 'negocio-completo-mensual';
const WA = 'https://wa.me/528117804869?text=';
const WA_DUDA = WA + encodeURIComponent('Hola, tengo una duda sobre Negocio Completo.');
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
const INCLUYE = [
  'Tu página web con diseño profesional adaptado a tu logo y colores, botón de WhatsApp, hospedaje seguro y alta en Google (el dominio se paga aparte)',
  'Agenda: tus clientes reservan solos y reciben su recordatorio',
  'Vuelve: tarjeta de sellos o puntos en el celular de tus clientes, con tu QR para el mostrador',
  'Hasta 3 cambios pequeños al mes en tu página',
  'Soporte por WhatsApp, sin llamadas',
];
const FAQ = [
  ['¿Qué incluye el Arranque en 7 días?', 'Es opcional. La mensualidad ya trae tu página web con un diseño profesional adaptado a tu logo y tus colores. Con el Arranque, tu página se diseña personalizada, a la medida de tu marca y de tu negocio; además damos de alta y configuramos tu Agenda (servicios, horarios y profesionales) y tu tarjeta de Vuelve (premio, sellos o puntos y tu logo), te mandamos tu QR para el mostrador y un video corto de cómo usar todo, y tu primer mes va de regalo. Sin él, configuras Agenda y Vuelve tú mismo con su asistente.'],
  ['¿Cuánto tarda?', 'Con el Arranque, en 7 días está funcionando a partir de que nos mandas tu logo, tus servicios, tus horarios y tu premio. Si en ese plazo no está funcionando, te devolvemos el Arranque.'],
  ['¿Puedo pagar por transferencia?', 'Sí. Escríbenos por WhatsApp: el Arranque se paga por transferencia y te mandamos un código para que tu primer mes vaya de regalo. Con ese código activas aquí tu suscripción con tarjeta y tu primer mes sale en $10.'],
  ['¿Cómo pago el dominio?', 'El dominio (tunegocio.mx o .com) no está incluido en los $749: corre por tu cuenta y se paga aparte, por transferencia a Vorka, una vez al año. Te decimos el costo exacto por WhatsApp; depende de la terminación.'],
  ['¿Puedo bajar de plan?', 'Sí. Puedes quedarte solo con Vuelve ($399 al mes), solo con Agenda ($99 al mes) o con las dos ($449 al mes); nos escribes por WhatsApp y lo cambiamos sin cobrarte doble. Al bajar, tu página web se da de baja. Si es antes de los primeros 12 meses, liquidas los meses que falten de la página ($499 cada uno).'],
  ['¿Cómo funciona el plan de 12 meses?', 'La suscripción se cobra cada mes en tu tarjeta y el plan es de 12 meses. Si cancelas antes, pagas los meses que falten. Si dejas de pagar, tu página, tu Agenda y tu tarjeta de Vuelve se dan de baja, y el dominio se queda con Vorka hasta que se liquide lo pendiente. Después de los 12 meses sigues mes con mes y cancelas cuando quieras en vorka.mx/tienda/suscripcion.'],
];

const RUTA_MIRA = '/tienda/mira-tu-negocio/';
const TRES = [
  ['Página web', 'Tu negocio en Google con tus servicios, tu horario, tu ubicación y un botón directo a tu WhatsApp.', ['Diseño con tu logo y tus colores', 'Alta en Google', 'Hasta 3 cambios al mes']],
  ['Agenda en línea', 'Tus clientes eligen día y hora desde su celular. Se acabaron las citas cruzadas y la libreta.', ['Reservas las 24 horas', 'Recordatorio automático', 'Varios profesionales']],
  ['Tarjeta de sellos', 'Vuelve: tus clientes juntan sellos o puntos en su celular y les llega aviso para que regresen.', ['Sin descargar apps', 'Con tu logo y tu premio', 'QR para tu mostrador']],
];
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONOS_NC = {
  'Página web': svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>'),
  'Agenda en línea': svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17M8.5 14.5l2 2 4-4"/>'),
  'Tarjeta de sellos': svg('<rect x="3" y="5.5" width="18" height="13" rx="3"/><circle cx="8" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><path d="M16 10.4l.5 1.1 1.2.1-.9.8.3 1.2-1.1-.6-1.1.6.3-1.2-.9-.8 1.2-.1z"/>'),
};
const MENSUAL = ['Página web con diseño profesional adaptado a tu logo y colores', 'Agenda en línea con recordatorios', 'Tarjeta de sellos o puntos con tu logo', 'Configuras Agenda y Vuelve tú mismo con su asistente', 'Soporte por WhatsApp'];
const ARRANQUE = ['Diseño personalizado de tu página, a la medida de tu marca', 'Configuramos tu Agenda y tu tarjeta por ti', 'QR para tu mostrador y video de cómo usar todo', 'Funcionando en 7 días o te devolvemos el Arranque', 'Tu primer mes, de regalo'];
// Collage del hero: los mismos modelos de «Mira tu negocio», con un negocio de ejemplo
const EJ = { n: 'Estética Lumbre', g: GIROS.estetica, dominio: 'esteticalumbre.mx' };
const COLLAGE = `<div class="nc-pz nc-pz-web"><div class="mt-web">
    <div class="mt-web-barra"><i></i><i></i><i></i><span>${EJ.dominio}</span></div>
    <div class="mt-web-hero"><span class="mt-logo">E</span><b>${EJ.n}</b><p>${EJ.g.frase}</p><div class="mt-web-btns"><span>Reservar</span><span>WhatsApp</span></div></div>
    <ul class="mt-web-serv">${EJ.g.servicios.slice(0, 3).map(([x, v]) => `<li><span>${x}</span><span>$${v.toLocaleString('es-MX')}</span></li>`).join('')}</ul>
  </div></div>
  <div class="nc-pz nc-pz-tar"><div class="mt-tarjeta">
    <div class="mt-tar-top"><span class="mt-logo">E</span><b>${EJ.n}</b></div>
    <p class="mt-hola">Hola, Ana</p><p class="mt-cuenta"><b>7</b> / 10 sellos</p>
    <div class="mt-sellos">${Array.from({ length: 10 }, (_, i) => `<span class="${i < 7 ? 'si' : i === 9 ? 'premio' : ''}"></span>`).join('')}</div>
    <p class="mt-falta">3 visitas más y te llevas <b>${EJ.g.premio}</b>.</p>
  </div></div>
  <div class="nc-pz nc-pz-ag"><div class="mt-agenda">
    <p class="mt-ag-dia">Agenda de hoy</p><b class="mt-ag-neg">${EJ.n}</b>
    <ul class="mt-ag-lista"><li><time>9:00</time><div><span>Corte de cabello</span><small>Ana</small></div></li><li><time>10:30</time><div><span>Tinte</span><small>Sofía</small></div></li><li class="libre"><time>12:00</time><div>Disponible · reserva en línea</div></li></ul>
  </div></div>`;

export async function paginaNegocioCompleto(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const p = await productoPorSlug(env, SLUG_NEGOCIO_COMPLETO);
  const inst = p?.contenido?.suscripcion?.instalacion ? await env.DB.prepare('SELECT precio_centavos FROM products WHERE id = ? AND activo = 1').bind(p.contenido.suscripcion.instalacion).first() : null;
  if (p && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  const conInst = url.searchParams.get('instalacion') === '1';
  // Cupón de regalo (Vorka OS › Tienda › Regalar): la liga trae ?cupon=REGALO-XXXX-XXXX y deja el primer mes en el cobro mínimo
  const cupon = String(url.searchParams.get('cupon') || url.searchParams.get('codigo') || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40);
  const mes = p?.precio_centavos || 0, extra = inst?.precio_centavos || 0;
  const form = p ? `<form class="t-form t-compra" id="form-nc" method="post" action="/api/checkout" novalidate data-mes="${mes}" data-inst="${extra}">
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Con este correo entras a Agenda y a Vuelve, y aquí te llega tu recibo.</small></div>
    ${inst ? `<label class="t-casilla nc-inst"><input type="checkbox" name="instalacion" value="on"${conInst ? ' checked' : ''}><span><b>Agregar Arranque en 7 días: ${precio(inst)}</b> (pago único). Diseño personalizado de tu página y configuramos tu Agenda y tu Vuelve, con tu QR y un video de uso.</span></label>` : ''}
    <div class="t-campo"><label for="codigo">Código de regalo <span class="nc-opc">(si te dimos uno)</span></label><input id="codigo" name="codigo" type="text" autocomplete="off" maxlength="40" value="${esc(cupon)}"${cupon ? '' : ' placeholder="REGALO-XXXX-XXXX"'}>${cupon ? '<small class="t-ayuda">Tu código se aplica en el pago: tu primer mes queda con descuento y después sigue en $749 al mes.</small>' : ''}</div>
    <p class="pw-total">Pagas hoy <b id="nc-hoy">${precio({ precio_centavos: mes + (conInst ? extra : 0) })}</b> <span>y luego ${precio(p)} cada mes · plan de 12 meses</span></p>
    <p class="pw-dominio">El dominio corre por tu cuenta: se paga aparte, por transferencia, una vez al año. Te pasamos el costo exacto por WhatsApp.</p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, el plan de 12 meses con cobro mensual automático (si cancelo antes pago los meses que falten; si dejo de pagar, el servicio se da de baja y el dominio se queda con Vorka hasta liquidar lo pendiente) y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Contratar ${FLECHA}</button>
    <p class="nc-transfer">¿Prefieres pagar por transferencia? <a href="${WA_DUDA}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>.</p>
  </form>` : `<div class="t-aviso"><p>Muy pronto. Mientras, <a href="${WA_DUDA}">escríbenos por WhatsApp</a>.</p></div>`;
  const mesTxt = p ? precio(p).replace(' MXN', '') : '$749', instTxt = inst ? precio(inst).replace(' MXN', '') : '$1,490';
  return pagina({ navActual: 'catalogo',
    titulo: 'Negocio Completo: página web, agenda y tarjeta de lealtad por $749 al mes | Vorka México', ruta: RUTA_NEGOCIO_COMPLETO,
    imagen: 'https://vorka.mx/assets/tienda/v3/negocio-completo-og.jpg',
    descripcion: 'Tu página web, tu agenda de citas en línea y tu tarjeta de lealtad digital en una sola suscripción de $749 al mes. Arranque en 7 días opcional.',
    head: `<style>${CSS_MIRA}${CSS}</style>`, headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT,
    cuerpo: `<section class="nc-hero"><div class="marco nc-hero-g">
  <div class="nc-hero-txt">
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Servicios</nav>
    <h1 class="t-h1">Tu negocio completo por ${mesTxt} al mes.</h1>
    <p class="t-lead">Página web, agenda de citas y tarjeta de lealtad, con la misma cuenta. Para que te encuentren, te reserven solos y regresen.</p>
    <div class="nc-btns">
      <a class="btn acento" href="${RUTA_MIRA}">Mira cómo quedaría tu negocio ${FLECHA}</a>
      <a class="btn blanco" href="#comprar">Contratar</a>
    </div>
    <p class="nc-mini">Con el Arranque en 7 días, tu primer mes va de regalo · Soporte por WhatsApp, sin llamadas</p>
  </div>
  <div class="nc-collage" aria-hidden="true">${COLLAGE}</div>
</div></section>

<section class="nc-sec"><div class="marco">
  <h2 class="t-h2 nc-h2">Tres herramientas que trabajan juntas.</h2>
  <p class="nc-sub">Tus clientes te encuentran en Google, reservan desde tu página y juntan sellos en cada visita. Tú lo ves todo desde tu celular.</p>
  <div class="nc-tres">${TRES.map(([t, d, l]) => `<article class="nc-card"><span class="nc-ico">${ICONOS_NC[t]}</span><h3>${esc(t)}</h3><p>${esc(d)}</p><ul>${l.map(x => `<li>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul></article>`).join('')}</div>
</div></section>

<section class="nc-sec nc-planes-sec"><div class="marco">
  <h2 class="t-h2 nc-h2">Elige cómo empezar.</h2>
  <p class="nc-sub">Las dos opciones traen todo. La diferencia es quién lo deja listo y qué tan a tu medida queda tu página.</p>
  <div class="nc-planes">
    <article class="nc-plan">
      <h3>Mensualidad</h3>
      <p class="nc-precio"><b>${mesTxt}</b> al mes</p>
      <ul>${MENSUAL.map(x => `<li>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>
      <a class="btn blanco" href="?instalacion=0#comprar" data-inst="0">Empezar con la mensualidad</a>
    </article>
    <article class="nc-plan nc-plan-arr">
      <p class="nc-sello">Recomendado</p>
      <h3>Mensualidad + Arranque en 7 días</h3>
      <p class="nc-precio"><b>${instTxt}</b> una sola vez, y ${mesTxt} al mes</p>
      <ul>${ARRANQUE.map((x, i) => `<li${i === 0 ? ' class="nc-dest"' : ''}>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>
      <a class="btn acento" href="?instalacion=1#comprar" data-inst="1">Lo quiero con Arranque ${FLECHA}</a>
    </article>
  </div>
</div></section>

<section class="nc-sec"><div class="marco nc-giros-box">
  <div><h2 class="t-h2 nc-h2">Para negocios con clientes que regresan.</h2><p class="nc-sub">Elige tu giro y mira cómo quedaría con el nombre de tu negocio.</p></div>
  <div class="nc-giros">${Object.entries(GIROS).filter(([k]) => k !== 'otro').map(([k, v]) => `<a class="nc-giro" href="${RUTA_MIRA}?g=${k}">${esc(v.nombre)}</a>`).join('')}</div>
</div></section>

<section class="nc-sec nc-compra-sec" id="comprar"><div class="marco nc-compra-g">
  <div>
    <h2 class="t-h2 nc-h2">Contrata en línea.</h2>
    <p class="nc-sub">Pagas con tarjeta y te llega tu acceso a Agenda y a Vuelve a tu correo. Tu página la empezamos por WhatsApp.</p>
    <ul class="pw-inc">${INCLUYE.map(x => `<li>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>
    <p class="t-ya"><a href="/tienda/demo/agenda/">Prueba la agenda</a> · <a href="/tienda/demo/vuelve/">Prueba la tarjeta</a> · <a href="${WA_DUDA}" target="_blank" rel="noopener">¿Dudas? WhatsApp</a></p>
  </div>
  <aside aria-label="Contratar">${form}</aside>
</div></section>
${seccionFaq({ titulo: 'Antes de contratar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('') })}`,
  });
}

const CSS = `.nc-hero{padding:clamp(12px,3vw,40px) 0 clamp(36px,5vw,64px);overflow:hidden}
.nc-hero-g{display:grid;gap:36px 48px;align-items:center}@media(min-width:980px){.nc-hero-g{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.nc-hero-g>*{min-width:0}
.nc-hero h1{margin-top:14px}.nc-hero .t-lead{margin-top:14px;max-width:540px}
.nc-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.nc-mini{margin:16px 0 0;font-size:14px;color:var(--fg-2)}
.nc-collage{position:relative;--marca:#1f6f54;min-height:520px;border-radius:28px;background:radial-gradient(120% 90% at 85% 10%,color-mix(in srgb,#1f6f54 26%,transparent),transparent 60%),radial-gradient(90% 80% at 10% 90%,color-mix(in srgb,var(--morado) 22%,transparent),transparent 60%),var(--bg-2);border:1px solid var(--line)}
.nc-pz{position:absolute}
.nc-pz-web{width:54%;left:4%;top:5%;transform:rotate(-2.5deg)}
.nc-pz-tar{width:46%;right:4%;top:16%;transform:rotate(2.5deg);z-index:2}
.nc-pz-ag{width:46%;left:9%;top:55%;transform:rotate(1deg);z-index:3}
.nc-pz .mt-tarjeta,.nc-pz .mt-agenda,.nc-pz .mt-web{box-shadow:0 18px 40px rgba(0,0,0,.2)}
.nc-pz .mt-ag-lista li:nth-child(3){display:none}
@media(max-width:560px){.nc-collage{min-height:560px}.nc-pz-web{width:72%;left:3%;top:4%}.nc-pz-tar{width:60%;right:3%;top:24%}.nc-pz-ag{width:64%;left:5%;top:56%}.nc-pz .mt-cuenta b{font-size:32px}.nc-pz .mt-web-serv{display:none}}
.nc-sec{padding:clamp(36px,5vw,64px) 0}
.nc-h2{max-width:720px}.nc-sub{margin:10px 0 0;color:var(--fg-2);font-size:17px;max-width:640px}
.nc-tres{display:grid;gap:16px;margin-top:28px}@media(min-width:860px){.nc-tres{grid-template-columns:repeat(3,minmax(0,1fr))}}
.nc-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(20px,3vw,28px);box-shadow:var(--sombra)}
.nc-ico{display:inline-flex;width:46px;height:46px;border-radius:14px;align-items:center;justify-content:center;background:var(--verde-suave);color:var(--verde);margin-bottom:14px}.nc-ico svg{width:24px;height:24px}
.nc-card h3{font-size:20px;margin:0}.nc-card p{margin:8px 0 14px;color:var(--fg-2)}
.nc-card ul,.nc-plan ul{display:grid;gap:9px;margin:0;padding:0;list-style:none}
.nc-card li,.nc-plan li{display:flex;gap:10px;align-items:flex-start;font-size:15.5px}
.nc-card li svg,.nc-plan li svg{width:18px;height:18px;flex:none;margin-top:3px;color:var(--verde)}
.nc-planes{display:grid;gap:18px;margin-top:28px;align-items:stretch}@media(min-width:860px){.nc-planes{grid-template-columns:1fr 1fr}}
.nc-plan{position:relative;display:flex;flex-direction:column;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(22px,3vw,32px);box-shadow:var(--sombra)}
.nc-plan h3{font-size:21px;margin:0}
.nc-plan ul{flex:1}
.nc-plan .btn{align-self:flex-start}
.nc-precio{margin:0;color:var(--fg-2)}.nc-precio b{font-size:30px;letter-spacing:-.02em;color:var(--fg)}
.nc-plan-arr{border:2px solid var(--oro);box-shadow:var(--sombra-2)}
.nc-sello{position:absolute;top:-13px;left:24px;margin:0;padding:4px 12px;border-radius:999px;background:var(--oro);color:#1b1b1b;font-size:13px;font-weight:700}
.nc-dest span{font-weight:700}
.nc-giros-box{display:grid;gap:22px}
.nc-giros{display:flex;flex-wrap:wrap;gap:10px}
.nc-giro{padding:10px 16px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--fg);text-decoration:none;font-weight:600;font-size:15px;transition:transform .15s var(--ease),border-color .15s}
.nc-giro:hover{transform:translateY(-2px);border-color:var(--oro)}
.nc-compra-g{display:grid;gap:28px 56px;align-items:start}@media(min-width:980px){.nc-compra-g{grid-template-columns:minmax(0,1.05fr) minmax(340px,.95fr)}}
.nc-compra-g>*{min-width:0}
.pw-inc{display:grid;gap:10px;margin:22px 0 0}.pw-inc li{display:flex;gap:10px;align-items:flex-start;font-size:16px;color:var(--fg-2)}.pw-inc svg{width:18px;height:18px;flex:none;margin-top:3px;color:var(--verde)}
#comprar .t-form{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(18px,3vw,28px);box-shadow:var(--sombra-2)}
.nc-inst{padding:12px;border-radius:12px;background:var(--bg-2)}
.pw-total{font-size:15.5px;margin:10px 0 8px}.pw-total b{font-size:22px;letter-spacing:-.02em}
.pw-dominio{font-size:14px;color:var(--fg-2);margin:0 0 12px;padding:10px 12px;border-radius:12px;background:var(--bg-2)}
.nc-opc{font-weight:400;color:var(--fg-2)}
.nc-transfer{font-size:14px;color:var(--fg-2);margin-top:12px;text-align:center}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-nc'); if(!f||!window.fetch) return;
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML, hoy=document.getElementById('nc-hoy');
  var mes=+f.dataset.mes, inst=+f.dataset.inst;
  function pesos(c){ return '$'+(c/100).toLocaleString('es-MX',{maximumFractionDigits:0})+' MXN'; }
  function total(){ hoy.textContent=pesos(mes+(f.instalacion&&f.instalacion.checked?inst:0)); }
  if(f.instalacion) f.instalacion.addEventListener('change',total);
  // Botones de los planes: marcan o quitan el Arranque sin recargar (no se pierde el ?cupon=) y bajan al formulario
  document.querySelectorAll('[data-inst]').forEach(function(a){ a.addEventListener('click',function(e){
    if(!f.instalacion) return; e.preventDefault(); f.instalacion.checked=a.dataset.inst==='1'; total();
    document.getElementById('comprar').scrollIntoView({behavior:'smooth',block:'start'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:'${SLUG_NEGOCIO_COMPLETO}', nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked, instalacion:!!(f.instalacion&&f.instalacion.checked) }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value.trim()) d.codigo=f.codigo.value.trim();
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
