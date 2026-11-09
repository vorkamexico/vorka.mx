// Tienda › Negocio Completo (vorka.mx/tienda/negocio-completo/): página web + Agenda + Vuelve en una suscripción de $749 al mes,
// con el «Arranque en 7 días» como casilla OPCIONAL de pago único ($1,490, migración 0081). Productos: migración 0079.
// El diseño de la página va incluido en la mensualidad; el Arranque cobra la configuración de Agenda y Vuelve por el equipo.
// Se guarda como el paquete Agenda + Vuelve (abre las dos apps con el mismo correo); la página web se empieza por WhatsApp.
// Quien llega por la campaña de WhatsApp puede pagar el primer mes por transferencia (en Vorka OS se le da 1 mes de cortesía
// de este plan) y al mes siguiente se suscribe aquí con tarjeta.
import { pagina, esc } from './paginas.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { refDeVisita, precio, seccionFaq } from './tienda.js';
import { FLECHA, CHECK } from './marco.generado.js';

export const RUTA_NEGOCIO_COMPLETO = '/tienda/negocio-completo/';
export const SLUG_NEGOCIO_COMPLETO = 'negocio-completo-mensual';
const WA = 'https://wa.me/528117804869?text=';
const WA_DUDA = WA + encodeURIComponent('Hola, tengo una duda sobre Negocio Completo.');
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
const INCLUYE = [
  'Tu página web con botón de WhatsApp, hospedaje seguro y alta en Google (el dominio se paga aparte)',
  'Agenda: tus clientes reservan solos y reciben su recordatorio',
  'Vuelve: tarjeta de sellos o puntos en el celular de tus clientes, con tu QR para el mostrador',
  'Hasta 3 cambios pequeños al mes en tu página',
  'Soporte por WhatsApp, sin llamadas',
];
const FAQ = [
  ['¿Qué incluye el Arranque en 7 días?', 'Es opcional. Tu página web ya va incluida en la mensualidad, igual que en cualquier página con nosotros. Con el Arranque, además, nosotros damos de alta y configuramos tu Agenda (servicios, horarios y profesionales) y tu tarjeta de Vuelve (premio, sellos o puntos y tu logo), te mandamos tu QR para el mostrador y un video corto de cómo usar todo. Sin él, configuras Agenda y Vuelve tú mismo con su asistente.'],
  ['¿Cuánto tarda?', 'Con el Arranque, en 7 días está funcionando a partir de que nos mandas tu logo, tus servicios, tus horarios y tu premio. Si en ese plazo no está funcionando, te devolvemos el Arranque.'],
  ['¿Puedo pagar por transferencia?', 'Sí. Escríbenos por WhatsApp: el Arranque se paga por transferencia y te mandamos un código para que tu primer mes vaya de regalo. Con ese código activas aquí tu suscripción con tarjeta y tu primer mes sale en $10.'],
  ['¿Cómo pago el dominio?', 'El dominio (tunegocio.mx o .com) no está incluido en los $749: corre por tu cuenta y se paga aparte, por transferencia a Vorka, una vez al año. Te decimos el costo exacto por WhatsApp; depende de la terminación.'],
  ['¿Puedo bajar de plan?', 'Sí. Puedes quedarte solo con Vuelve ($399 al mes), solo con Agenda ($99 al mes) o con las dos ($449 al mes); nos escribes por WhatsApp y lo cambiamos sin cobrarte doble. Al bajar, tu página web se da de baja. Si es antes de los primeros 12 meses, liquidas los meses que falten de la página ($349 cada uno).'],
  ['¿Cómo funciona el plan de 12 meses?', 'La suscripción se cobra cada mes en tu tarjeta y el plan es de 12 meses. Si cancelas antes, pagas los meses que falten. Si dejas de pagar, tu página, tu Agenda y tu tarjeta de Vuelve se dan de baja, y el dominio se queda con Vorka hasta que se liquide lo pendiente. Después de los 12 meses sigues mes con mes y cancelas cuando quieras en vorka.mx/tienda/suscripcion.'],
];

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
    ${inst ? `<label class="t-casilla nc-inst"><input type="checkbox" name="instalacion" value="on"${conInst ? ' checked' : ''}><span><b>Agregar Arranque en 7 días: ${precio(inst)}</b> (pago único). Nosotros configuramos tu Agenda y tu Vuelve, con tu QR y un video de uso.</span></label>` : ''}
    <div class="t-campo"><label for="codigo">Código de regalo <span class="nc-opc">(si te dimos uno)</span></label><input id="codigo" name="codigo" type="text" autocomplete="off" maxlength="40" value="${esc(cupon)}"${cupon ? '' : ' placeholder="REGALO-XXXX-XXXX"'}>${cupon ? '<small class="t-ayuda">Tu código se aplica en el pago: tu primer mes queda con descuento y después sigue en $749 al mes.</small>' : ''}</div>
    <p class="pw-total">Pagas hoy <b id="nc-hoy">${precio({ precio_centavos: mes + (conInst ? extra : 0) })}</b> <span>y luego ${precio(p)} cada mes · plan de 12 meses</span></p>
    <p class="pw-dominio">El dominio corre por tu cuenta: se paga aparte, por transferencia, una vez al año. Te pasamos el costo exacto por WhatsApp.</p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, el plan de 12 meses con cobro mensual automático (si cancelo antes pago los meses que falten; si dejo de pagar, el servicio se da de baja y el dominio se queda con Vorka hasta liquidar lo pendiente) y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Contratar ${FLECHA}</button>
    <p class="nc-transfer">¿Prefieres pagar por transferencia? <a href="${WA_DUDA}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>.</p>
  </form>` : `<div class="t-aviso"><p>Muy pronto. Mientras, <a href="${WA_DUDA}">escríbenos por WhatsApp</a>.</p></div>`;
  return pagina({ navActual: 'catalogo',
    titulo: 'Negocio Completo: página web, agenda y tarjeta de lealtad por $749 al mes | Vorka México', ruta: RUTA_NEGOCIO_COMPLETO,
    imagen: 'https://vorka.mx/assets/tienda/v3/pagina-web-og.jpg',
    descripcion: 'Tu página web, tu agenda de citas en línea y tu tarjeta de lealtad digital en una sola suscripción de $749 al mes. Arranque en 7 días opcional.',
    head: `<style>${CSS}</style>`, headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT,
    cuerpo: `<section class="pw-hero"><div class="marco pw-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Servicios</nav>
    <h1 class="t-h1">Tu negocio completo por ${p ? precio(p).replace(' MXN', '') : '$749'} al mes.</h1>
    <p class="t-lead">Página web, agenda de citas y tarjeta de lealtad, con la misma cuenta. Para negocios con clientes que regresan: estéticas, barberías, consultorios, cafeterías y más.</p>
    <ul class="pw-inc">${INCLUYE.map(x => `<li>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>
    <p class="t-ya"><a href="/tienda/demo/agenda/">Prueba la agenda</a> · <a href="/tienda/demo/vuelve/">Prueba la tarjeta</a> · <a href="${WA_DUDA}" target="_blank" rel="noopener">¿Dudas? WhatsApp</a></p>
  </div>
  <aside id="comprar" aria-label="Contratar">${form}</aside>
</div></section>
${seccionFaq({ titulo: 'Antes de contratar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('') })}`,
  });
}

const CSS = `.pw-hero{padding:clamp(12px,3vw,40px) 0 clamp(40px,5vw,64px)}
.pw-g{display:grid;gap:28px 56px;align-items:start}@media(min-width:980px){.pw-g{grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr)}}
.pw-g>*{min-width:0}
.pw-hero h1{margin-top:14px}.pw-hero .t-lead{margin-top:14px;max-width:560px}
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
  if(f.instalacion) f.instalacion.addEventListener('change',function(){ hoy.textContent=pesos(mes+(f.instalacion.checked?inst:0)); });
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
