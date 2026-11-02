// Toolkit Vorka · páginas y API (la lógica del saldo vive en toolkit.js)
//   /tienda/toolkit/                 ficha de venta: los dos planes, para qué sirve, ejemplo con precios reales y el pago
//   /tienda/toolkit/entrar/<token>   botón del correo de bienvenida: abre la sesión de su cuenta y lleva a Mi Toolkit
//   /tienda/mi-toolkit/              Mi Toolkit (sesión de la cuenta de vorka.mx/tienda/cuenta): saldo, próximo abono,
//                                    historial, pagar meses de apps (?v=apps) y códigos de regalo (?v=codigos)
//   /tienda/canjear/[CODIGO]         canjear un código de regalo (cualquiera, con o sin cuenta: pide nombre y correo)
//   /api/toolkit/saldo · cotizar · pagar · app · codigos · devolver · canjear · portal
import { json, fail, one, all, sha256, pesos } from './util.js';
import { pagina, aviso, esc, WHATSAPP } from './paginas.js';
import { FLECHA, CHECK, LOGO } from './marco.generado.js';
import { productoPorSlug, VENDIBLE, dentroDelLimite, registrarAnalitica } from './modelo.js';
import { cuentaActual, crearSesion } from './puntos.js';
import { validarAcceso } from './brindi.js';
import { refDeVisita, navTienda, seccionFaq } from './tienda.js';
import { suscripcionApp } from './suscripciones.js';
import { lineaDe, LINEAS } from './lineas.js';
import {
  APP, APPS_SALDO, NOMBRE_APP_SALDO, FUNDADOR, EXCLUIDO_CREADOR, MAX_CODIGOS, MAX_MESES, fechaMx,
  estadoToolkit, cotizar, pagarConSaldo, pagarMesesApp, sacarCodigos, codigosDe, devolverCodigo, leerCodigo, canjearCodigo,
  movimientosDe, portalToolkit, planMensualApp, destinoSaldo, inicioMesesApp,
} from './toolkit.js';

const NO_CACHE = { 'cache-control': 'no-store' };
const mx = c => `$${(Number(c || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const mismoOrigen = (req, env) => { const o = req.headers.get('origin'); return !o || o === new URL(env.SITE_URL).origin; };
const emailValido = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e || '');
const SLUGS = ['toolkit-mensual', 'toolkit-pro-mensual'];
// Ejemplos de la tabla: productos reales de la tienda; la página lee su precio de lista de la base al momento (solo los que
// están a la venta). Si un precio cambia en el panel, la tabla cambia sola.
const EJEMPLOS = ['simulador-paa-practica', 'test-vocacional', 'ruta-de-impacto', 'brindi-celebracion', 'cupo-pro', 'agenda-mensual', 'vuelve-mensual', 'cuentas-mensual', 'vende-mensual', 'clara-mensual', 'evaluacion-liderazgo'];

// ---------- estilos comunes ----------
const CSS = `<style>
.tk{padding:clamp(96px,11vw,132px) 0 40px}
.tk-g{display:grid;gap:34px;align-items:start}
@media(min-width:980px){.tk-g{grid-template-columns:1.05fr .95fr}}
.tk-et{display:inline-flex;gap:8px;align-items:center;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--oro)}
.tk h1{font-size:clamp(34px,5vw,56px);line-height:1.02;letter-spacing:-.045em;font-weight:800;margin:12px 0 18px}
.tk h1 span{color:var(--oro)}
.tk-cuatro{list-style:none;padding:0;margin:0 0 20px;display:grid;gap:12px;counter-reset:n}
.tk-cuatro li{display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:start;font-size:17px;line-height:1.45;counter-increment:n}
.tk-cuatro li::before{content:counter(n);display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--fg);color:var(--bg);font-weight:800;font-size:15px}
.tk-fundador{border-radius:16px;padding:14px 16px;background:rgba(200,164,92,.13);border:1px solid rgba(200,164,92,.45);font-size:14.5px;line-height:1.5;color:var(--fg)}
.tk-fundador b{color:var(--oro)}
.tk-port img{width:100%;height:auto;border-radius:22px;box-shadow:var(--sombra);margin-top:22px;display:block}
.tk-card{background:var(--card);border:1px solid var(--line);border-radius:26px;padding:24px;box-shadow:var(--sombra)}
.tk-planes{display:grid;gap:10px;margin:0 0 16px;border:0;padding:0}
.tk-plan{display:grid;grid-template-columns:22px 1fr auto;gap:12px;align-items:center;padding:14px 16px;border-radius:18px;border:1.5px solid var(--line);cursor:pointer;background:var(--bg)}
.tk-plan:has(input:checked){border-color:var(--fg);box-shadow:0 0 0 1px var(--fg)}
.tk-plan b{display:block;font-size:17px}.tk-plan small{color:var(--fg-2);font-size:14px}
.tk-plan .tk-recibe{text-align:right;font-weight:800;font-size:19px;letter-spacing:-.02em}.tk-plan .tk-recibe small{display:block;font-weight:600;font-size:12.5px}
.tk-extra{display:inline-block;margin-top:4px;font-size:12.5px;font-weight:700;color:var(--verde);background:var(--verde-suave);border-radius:999px;padding:2px 9px}
.tk-sec{padding:34px 0}
.tk-sec h2{font-size:clamp(26px,3.4vw,36px);letter-spacing:-.035em;margin:0 0 8px}
.tk-sec>.marco>p{color:var(--fg-2);max-width:46em}
.tk-usos{display:grid;gap:14px;margin-top:18px;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))}
.tk-usos div{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px}
.tk-usos b{display:block;font-size:17px;margin-bottom:4px}.tk-usos p{color:var(--fg-2);font-size:15px;margin:0}
.tk-tabla-c{overflow-x:auto;margin-top:16px;border:1px solid var(--line);border-radius:18px;background:var(--card)}
.tk-tabla{width:100%;border-collapse:collapse;font-size:15px}
@media(max-width:560px){.tk-tabla{font-size:13.5px}.tk-tabla th,.tk-tabla td{padding:10px 8px}}
.tk-tabla th,.tk-tabla td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--line)}
.tk-tabla th{font-size:12.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-2)}
.tk-tabla td.n,.tk-tabla th.n{text-align:right;font-variant-numeric:tabular-nums}
.tk-tabla tr:last-child td{border-bottom:0}
.tk-nota{font-size:13.5px;color:var(--fg-2);margin-top:10px}
.tk-no{display:grid;gap:8px;margin:14px 0 0;padding:0;list-style:none}.tk-no li{font-size:15.5px;padding-left:22px;position:relative}.tk-no li::before{content:'×';position:absolute;left:4px;color:var(--fg-3);font-weight:800}
/* Mi Toolkit */
.mt{padding:clamp(92px,10vw,120px) 0 60px}
.mt-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 20px}
.mt-tabs a{padding:9px 16px;border-radius:999px;border:1px solid var(--line);text-decoration:none;color:var(--fg);font-weight:650;font-size:15px;background:var(--card)}
.mt-tabs a[aria-current]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.mt-saldo{position:relative;overflow:hidden;border-radius:28px;background:var(--noche);color:var(--claro);padding:28px 26px;box-shadow:var(--sombra-2)}
.mt-saldo .v{position:absolute;right:-50px;bottom:-70px;width:260px;opacity:.06;color:#fff}.mt-saldo .v svg{width:100%;height:auto}
.mt-saldo small{color:var(--claro-2);font-size:14px;font-weight:600}
.mt-saldo .num{display:block;font-size:clamp(46px,9vw,68px);font-weight:800;letter-spacing:-.05em;line-height:1;margin:8px 0 6px;color:#fff}
.mt-saldo .num em{font-style:normal;font-size:.36em;color:var(--claro-3);letter-spacing:0;margin-left:6px}
.mt-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.mt-chips span{font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.15)}
.mt-chips .mt-activo{background:rgba(76,185,68,.2);border-color:rgba(126,217,87,.45)}
.mt-saldo p{color:var(--claro-2);font-size:15px;margin:14px 0 0}
.mt-acc{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));margin:18px 0 26px}
.mt-acc a,.mt-acc button{display:flex;gap:10px;align-items:center;justify-content:center;min-height:54px;padding:0 16px;border-radius:16px;font-weight:700;font-size:15.5px;text-decoration:none;border:1.5px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer;font-family:inherit}
.mt-acc svg{width:18px;height:18px;flex:none}
.mt-acc .pri{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.mt h2{font-size:22px;letter-spacing:-.03em;margin:26px 0 10px}
.mt-lista{display:grid;gap:0;background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.mt-mov{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:13px 16px;border-bottom:1px solid var(--line)}
.mt-mov:last-child{border-bottom:0}
.mt-mov b{font-size:15.5px;display:block}.mt-mov small{color:var(--fg-2);font-size:13px}
.mt-mov .m{font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}.mt-mov .m.mt-mas{color:var(--verde)}
.mt-vacio{padding:18px;color:var(--fg-2);font-size:15px}
.mt-cod{display:grid;grid-template-columns:1fr;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}
.mt-cod:last-child{border-bottom:0}
@media(min-width:720px){.mt-cod{grid-template-columns:1fr auto;align-items:center}}
.mt-cod code{font:800 17px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:1px}
.mt-cod small{display:block;color:var(--fg-2);font-size:13.5px;margin-top:3px}
.mt-est{display:inline-block;font-size:12px;font-weight:800;padding:2px 9px;border-radius:999px;margin-left:8px;vertical-align:2px}
.mt-est.disponible{background:var(--verde-suave);color:var(--verde)}.mt-est.usado{background:var(--bg-3);color:var(--fg-2)}.mt-est.devuelto{background:var(--bg-3);color:var(--fg-2)}
.mt-cod-a{display:flex;gap:8px;flex-wrap:wrap}
.mt-cod-a a,.mt-cod-a button{font:inherit;font-size:14px;font-weight:700;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--fg);text-decoration:none;cursor:pointer}
.mt-cod-a .wa{background:#1f8f4e;color:#fff;border-color:#1f8f4e}
.mt-apps{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.mt-app{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px;display:grid;gap:10px}
.mt-app h3{font-size:19px;margin:0}.mt-app .mt-p{color:var(--fg-2);font-size:14.5px;margin:0}
.mt-app .mt-fila{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.mt-app select,.mt-form select,.mt-form input{font:inherit;font-size:16px;padding:10px 12px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--fg)}
.mt-app button,.mt-form button[type=submit]{font:inherit;font-weight:750;font-size:15.5px;padding:12px 16px;border-radius:14px;border:0;background:var(--fg);color:var(--bg);cursor:pointer}
.mt-app button:disabled,.mt-form button:disabled{opacity:.45;cursor:not-allowed}
.mt-aviso{font-size:13.5px;color:var(--fg-2);background:var(--bg-2);border-radius:12px;padding:10px 12px}
.mt-ok{border-radius:16px;padding:14px 16px;background:var(--verde-suave);color:var(--fg);margin:0 0 16px;font-size:15.5px}
.mt-err{color:#b3261e;font-size:14.5px;font-weight:600;margin:0}
.mt-form{display:grid;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:20px}
.mt-form label{font-weight:700;font-size:15px;display:grid;gap:6px;min-width:0}
.mt-form select,.mt-form input{width:100%;max-width:100%;min-width:0}
.mt-form,.mt-app,.mt-lista{min-width:0;max-width:100%}
.mt-resumen{display:grid;gap:4px;font-size:15px;background:var(--bg-2);border-radius:14px;padding:12px 14px}
.mt-resumen div{display:flex;justify-content:space-between;gap:10px}.mt-resumen b{font-variant-numeric:tabular-nums}
.mt-nuevos{display:grid;gap:8px;margin-top:6px}
.mt-sub{color:var(--fg-2);font-size:15px;max-width:44em}
</style>`;

// ---------- ficha de venta /tienda/toolkit/ ----------
async function ejemplos(env) {
  const filas = [];
  for (const s of EJEMPLOS) {
    const p = await productoPorSlug(env, s);
    if (!p || p.creador_id) continue;
    const app = p.contenido?.suscripcion ? p.contenido.acceso?.app : null;
    filas.push({ nombre: app ? `1 mes de ${NOMBRE_APP_SALDO[app] || p.nombre}` : nombreCorto(p), precio: p.precio_centavos });
    if (filas.length >= 6) break;
  }
  return filas;
}
// El texto del precio fundador, tal cual, con la primera frase en negritas
const fundadorHtml = (([a, ...b]) => `<b>${esc(a)}.</b> ${esc(b.join('. '))}`)(FUNDADOR.split('. '));
const nombreCorto = p => ({ 'simulador-paa-practica': 'Simulador PAA · práctica ilimitada', 'test-vocacional': 'Reporte del Test vocacional', 'brindi-celebracion': 'Invitación Brindi · plan Celebración', 'cupo-pro': 'Evento Cupo Pro' }[p.slug] || p.nombre);

export async function paginaToolkit(env, req, url) {
  const planes = (await Promise.all(SLUGS.map(s => productoPorSlug(env, s, { inactivos: true })))).filter(Boolean);
  const aLaVenta = planes.filter(p => p.activo);
  const { code, cookie } = await refDeVisita(env, req, url);
  if (aLaVenta[0]) await registrarAnalitica(env, 'view_product', { product_id: aLaVenta[0].id, ref_code: code }, req).catch(() => {});
  const elegido = SLUGS.includes(url.searchParams.get('plan')) ? url.searchParams.get('plan') : SLUGS[0];
  const ej = await ejemplos(env);
  const [t, pro] = [planes.find(p => p.slug === SLUGS[0]), planes.find(p => p.slug === SLUGS[1])];
  const bono = p => p?.contenido?.toolkit?.bono_centavos || 0;
  const form = aLaVenta.length ? `
<form class="tk-card t-form" id="form-toolkit" method="post" action="/api/checkout" novalidate>
  ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
  <fieldset class="tk-planes"><legend class="sr">Elige tu plan</legend>
  ${aLaVenta.map(p => `<label class="tk-plan"><input type="radio" name="slug" value="${esc(p.slug)}"${p.slug === elegido ? ' checked' : ''}>
    <span><b>${p.slug === SLUGS[1] ? 'Toolkit Pro' : 'Toolkit'}</b><small>Pagas ${mx(p.precio_centavos)} al mes</small><br><span class="tk-extra">+${mx(bono(p) - p.precio_centavos)} extra cada mes</span></span>
    <span class="tk-recibe">${mx(bono(p))}<small>de saldo al mes</small></span></label>`).join('')}
  </fieldset>
  <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
  <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Con este correo entras a Mi Toolkit y usas tu saldo.</small></div>
  <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/#toolkit" target="_blank">términos del Toolkit</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
  <p class="t-error" id="error-toolkit" role="alert"${url.searchParams.get('error') ? '' : ' hidden'}>${esc(url.searchParams.get('error') || '')}</p>
  <button class="btn acento" type="submit" id="btn-toolkit">Suscribirme ${FLECHA}</button>
  <p class="tk-nota">Pago con tarjeta, cada mes. Cancelas cuando quieras desde Mi Toolkit y tu saldo se queda contigo.</p>
  <p class="tk-fundador" style="margin-top:12px">${fundadorHtml}</p>
</form>` : `<div class="tk-card"><b style="font-size:19px">Muy pronto</b><p class="tk-nota" style="font-size:15px">El Toolkit todavía no está a la venta. Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> y te avisamos en cuanto abra.</p></div>`;
  const tabla = ej.length ? `<div class="tk-tabla-c"><table class="tk-tabla"><thead><tr><th>Producto de la tienda</th><th class="n">Precio de lista</th><th class="n">Con Toolkit (${mx(bono(t))})</th><th class="n">Con Pro (${mx(bono(pro))})</th></tr></thead><tbody>
    ${ej.map(f => `<tr><td>${esc(f.nombre)}</td><td class="n">${mx(f.precio)}</td><td class="n">${Math.floor(bono(t) / f.precio)}</td><td class="n">${Math.floor(bono(pro) / f.precio)}</td></tr>`).join('')}
  </tbody></table></div><p class="tk-nota">Cuántas veces te alcanza un solo mes de saldo para cada producto, con los precios de hoy en la tienda. Puedes combinar lo que quieras y lo que no gastes se acumula.</p>` : '';
  const FAQ = [
    ['¿Mi saldo vence?', 'No. Tu saldo nunca vence y se acumula sin tope. Si cancelas, lo conservas y lo sigues usando en la tienda, en tus apps y en códigos de regalo; solo dejas de recibir abonos.'],
    ['¿Cómo uso mi saldo?', 'En la página de cualquier producto aparece «Pagar con mi saldo» cuando entras con tu cuenta. En Mi Toolkit pagas meses de tus apps y sacas códigos de regalo.'],
    ['¿Qué son los códigos de regalo?', 'Eliges un producto y cuántos; se descuenta su precio de lista de tu saldo y recibes códigos de un solo uso que valen ese producto completo (en apps, 1 mes). Los compartes por WhatsApp y quien lo recibe lo canjea con su correo, sin cuenta. No vencen, y si no lo usas puedes devolverlo a tu saldo.'],
    ['¿Puedo combinar saldo y tarjeta?', 'Por ahora no: si tu saldo no alcanza, la página te dice cuánto te falta y puedes pagar con tarjeta, OXXO o SPEI como siempre.'],
    ['¿Qué no se puede pagar con saldo?', 'Los productos de creadores independientes del marketplace (por ahora), el propio Toolkit y los complementos que se agregan desde cada app.'],
    ['¿Qué es el precio fundador?', FUNDADOR],
    ['¿Lo que compro con saldo da Puntos Vorka?', 'No: el saldo ya es tu beneficio. Los pagos de tu suscripción sí cuentan para quien te recomendó, como cualquier suscripción.'],
    ['¿Cómo cancelo?', 'En Mi Toolkit › Administrar mi suscripción (cambias tarjeta, ves recibos o cancelas). Se cancela al final del mes que ya pagaste.'],
  ];
  return pagina({
    titulo: 'Toolkit Vorka · Saldo cada mes para toda la tienda', ruta: '/tienda/toolkit/', navActual: 'catalogo', noindex: !aLaVenta.length,
    descripcion: 'Paga $599 al mes y recibe $800 de saldo para toda la tienda de Vorka México: simuladores, reportes, invitaciones, meses de apps y códigos de regalo. Tu saldo nunca vence.',
    imagen: 'https://vorka.mx/assets/tienda/v3/toolkit-og.jpg',
    headers: cookie ? { 'set-cookie': cookie } : {},
    head: CSS, script: SCRIPT_FICHA, whatsapp: true,
    cuerpo: `
<section class="tk"><div class="marco">
  ${navTienda('toolkit')}
  <div class="tk-g">
  <div>
    <span class="tk-et">Nuevo · Toolkit Vorka</span>
    <h1>Saldo cada mes para <span>toda la tienda</span>.</h1>
    <ol class="tk-cuatro">
      <li><span><b>Pagas ${mx(t?.precio_centavos)} al mes</b> (o ${mx(pro?.precio_centavos)} con Pro).</span></li>
      <li><span><b>Recibes ${mx(bono(t))} de saldo cada mes</b> (o ${mx(bono(pro))} con Pro), a precio de lista.</span></li>
      <li><span>Úsalo en simuladores, reportes, Brindi, Cupo, meses de Clara, Cuentas, Vende, Agenda y Vuelve, o saca <b>códigos de regalo</b> para regalar o revender.</span></li>
      <li><span><b>Tu saldo nunca vence</b> y se acumula. Si cancelas, te lo quedas.</span></li>
    </ol>
    <p class="tk-fundador">${fundadorHtml}</p>
    <div class="tk-port"><img src="/assets/tienda/v3/toolkit-portada.webp" alt="Toolkit Vorka: paga $599 y recibe $800 de saldo al mes" width="1600" height="1200" decoding="async"></div>
  </div>
  <aside id="comprar" aria-label="Suscribirme">${form}</aside>
  </div>
</div></section>
<section class="tk-sec"><div class="marco">
  <h2>Para qué sirve tu saldo</h2>
  <div class="tk-usos">
    <div><b>Compra para ti</b><p>Cualquier producto de la tienda sin volver a poner tu tarjeta: te llega igual que una compra normal, con sus mismos correos y accesos.</p></div>
    <div><b>Paga tus apps</b><p>Meses de Clara, Cuentas, Vende, Agenda y Vuelve a su precio mensual. Si ya tienes la app, el mes se suma después de lo que ya tenías.</p></div>
    <div><b>Regala o revende</b><p>Códigos de un solo uso del 100 % de un producto. Los copias o los mandas por WhatsApp desde tu cuenta y ves cuáles ya se usaron.</p></div>
  </div>
</div></section>
${tabla ? `<section class="tk-sec"><div class="marco"><h2>Ejemplo con precios reales</h2><p>Lo que te alcanza con un mes de saldo, con los precios de lista de la tienda hoy.</p>${tabla}</div></section>` : ''}
<section class="tk-sec"><div class="marco"><h2>Lo que todavía no se paga con saldo</h2>
  <ul class="tk-no"><li>Productos de creadores independientes del marketplace: ${esc(EXCLUIDO_CREADOR.split(': ')[1] || '')}</li><li>El propio Toolkit (no se compra ni se regala con saldo).</li><li>Pagos mixtos: si tu saldo no alcanza, te decimos cuánto falta y pagas con tarjeta, OXXO o SPEI.</li></ul>
</div></section>
${seccionFaq({ titulo: 'Preguntas del Toolkit', items: FAQ.map(([p, r]) => `<details><summary>${esc(p)}</summary><div>${esc(r)}</div></details>`).join(''), whatsappTexto: 'Hola, tengo una duda sobre el Toolkit Vorka' })}`,
  });
}

const SCRIPT_FICHA = `(function(){
  var f=document.getElementById('form-toolkit'); if(!f||!window.fetch) return;
  var err=document.getElementById('error-toolkit'), btn=document.getElementById('btn-toolkit'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var s=f.querySelector('input[name=slug]:checked'), d={slug:s?s.value:'',nombre:f.nombre.value.trim(),email:f.email.value.trim(),terminos:f.terminos.checked};
    if(f.ref) d.ref=f.ref.value;
    if(d.nombre.length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido.'); }
    if(!d.terminos) return mostrar('Acepta los términos y el aviso de privacidad.');
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo el pago…';
    fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok&&x.j.url) location.href=x.j.url; else mostrar(x.j.error||'No pudimos abrir el pago. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
})();`;

// ---------- Mi Toolkit ----------
const TIPOS = { abono: 'Abono de tu suscripción', compra: 'Compraste con saldo', app: 'Pagaste meses de una app', codigos: 'Sacaste códigos de regalo', devolucion: 'Devolviste un código', reembolso: 'Reembolso', ajuste: 'Ajuste' };
const fechaCorta = iso => new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'short', year: 'numeric' });
const textoWa = (env, c) => `Te regalo ${c.producto} de Vorka México 🎁 Canjéalo con tu correo aquí: ${env.SITE_URL || 'https://vorka.mx'}/tienda/canjear/${c.codigo} (código ${c.codigo}, un solo uso).`;

function filaCodigo(env, c) {
  const ligaCanje = `${env.SITE_URL || 'https://vorka.mx'}/tienda/canjear/${c.codigo}`;
  const que = c.estado === 'usado' ? `Se usó el ${fechaCorta(c.usado_at)}` : c.estado === 'devuelto' ? `Lo devolviste a tu saldo el ${fechaCorta(c.devuelto_at)}` : `Vale ${mx(c.precio_centavos)} · no vence`;
  return `<div class="mt-cod"><div><code>${esc(c.codigo)}</code><span class="mt-est ${c.estado}">${{ disponible: 'Disponible', usado: 'Usado', devuelto: 'Devuelto' }[c.estado]}</span><small>${esc(c.producto)} · ${esc(que)}</small></div>
  ${c.estado === 'disponible' ? `<div class="mt-cod-a"><button type="button" data-copiar="${esc(ligaCanje)}">Copiar liga</button><a class="wa" href="https://wa.me/?text=${encodeURIComponent(textoWa(env, c))}" target="_blank" rel="noopener">WhatsApp</a><button type="button" data-devolver="${esc(c.codigo)}" data-monto="${esc(mx(c.precio_centavos))}">Devolver a mi saldo</button></div>` : ''}</div>`;
}

// Productos para sacar códigos: lo vendible de Vorka que se puede regalar con saldo, por línea (las apps como «1 mes de …»)
async function opcionesCodigos(env) {
  const prods = (await all(env, `SELECT p.*, NULL creador_nombre FROM products p WHERE ${VENDIBLE} AND p.creador_id IS NULL ORDER BY p.orden, p.nombre`))
    .map(r => ({ ...r, contenido: JSON.parse(r.contenido || '{}') }));
  const vistos = new Set(), grupos = new Map();
  for (const p of prods) {
    const c = p.contenido;
    if (c.oculto && !c.suscripcion && !['plan', 'pro', 'paquete'].includes(c.acceso?.tipo)) continue;
    const d = await destinoSaldo(env, p, { para: 'codigos' });
    if (d.error) continue;
    const slug = d.tipo === 'app' ? d.plan.slug : p.slug;
    if (vistos.has(slug)) continue;
    vistos.add(slug);
    const linea = d.tipo === 'app' ? 'Meses de apps' : (LINEAS.find(l => l.id === lineaDe(p))?.linea || p.categoria || 'Más');
    if (!grupos.has(linea)) grupos.set(linea, []);
    grupos.get(linea).push({ slug, nombre: d.nombre, precio: d.precio });
  }
  return [...grupos.entries()];
}

export async function paginaMiToolkit(env, req, url) {
  const cta = await cuentaActual(req, env);
  if (!cta) return pagina({ titulo: 'Mi Toolkit · Vorka México', ruta: '/tienda/mi-toolkit/', noindex: true,
    cuerpo: aviso({ titulo: 'Entra para ver tu Toolkit', texto: 'Usa el mismo correo con el que te suscribiste. Te mandamos un código o entras con tu contraseña.',
      extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/cuenta/?volver=/tienda/mi-toolkit/">Entrar con mi correo ${FLECHA}</a><a class="btn blanco" href="/tienda/toolkit/">¿Qué es el Toolkit?</a></div>` }) });
  const e = await estadoToolkit(env, cta.email);
  if (!e.tiene) return pagina({ titulo: 'Mi Toolkit · Vorka México', ruta: '/tienda/mi-toolkit/', noindex: true,
    cuerpo: aviso({ titulo: 'Todavía no tienes Toolkit', texto: `Con ${esc(cta.email)} no encontramos una suscripción al Toolkit. Si te suscribiste con otro correo, sal de tu cuenta y entra con ese.`,
      extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/toolkit/">Conocer el Toolkit ${FLECHA}</a></div>` }) });
  const v = ['apps', 'codigos'].includes(url.searchParams.get('v')) ? url.searchParams.get('v') : 'inicio';
  const listo = url.searchParams.get('listo');
  const codigos = await codigosDe(env, e.email);
  const tabs = `<nav class="mt-tabs" aria-label="Mi Toolkit">${[['inicio', 'Mi saldo'], ['apps', 'Pagar meses de apps'], ['codigos', 'Códigos de regalo']].map(([k, t]) => `<a href="/tienda/mi-toolkit/${k === 'inicio' ? '' : `?v=${k}`}"${k === v ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;
  const estadoTxt = e.activo
    ? (e.suscripcion?.cancelar_al_final ? `Cancelado: tu último abono fue este mes. Tu saldo se queda contigo.` : e.proximo_abono ? `Próximo abono: ${mx(e.proximo_abono.centavos)} el ${fechaMx(e.proximo_abono.fecha)}` : 'Suscripción activa')
    : 'Tu suscripción terminó: ya no recibes abonos, pero tu saldo sigue disponible.';
  const tarjeta = `<div class="mt-saldo"><span class="v" aria-hidden="true">${LOGO}</span><small>Tu saldo del Toolkit</small>
    <span class="num" id="mt-saldo-num">${mx(e.saldo_centavos)}<em>MXN</em></span>
    <div class="mt-chips"><span${e.activo ? ' class="mt-activo"' : ''}>${esc(e.plan?.nombre || 'Toolkit')} · ${e.activo ? (e.suscripcion?.cancelar_al_final ? 'termina el ' + fechaMx(e.suscripcion.periodo_fin) : 'activo') : 'sin suscripción'}</span><span>Nunca vence</span><span>${esc(cta.email)}</span></div>
    <p>${esc(estadoTxt)}</p></div>`;
  let cuerpo;
  if (v === 'inicio') {
    const movs = await movimientosDe(env, e.email, 60);
    cuerpo = `${tarjeta}
  <div class="mt-acc"><a class="pri" href="/tienda/">Usar en la tienda ${FLECHA}</a><a href="/tienda/mi-toolkit/?v=apps">Pagar un mes de una app</a><a href="/tienda/mi-toolkit/?v=codigos">Sacar códigos de regalo</a>${e.suscripcion ? '<button type="button" id="mt-portal">Administrar mi suscripción</button>' : ''}</div>
  <p class="mt-err" id="mt-err" role="alert" hidden></p>
  ${!e.saldo_centavos && e.activo ? '<p class="mt-aviso">Tu primer abono aparece aquí en unos minutos, en cuanto Stripe confirma tu pago.</p>' : ''}
  <h2>Mis códigos de regalo</h2>
  <div class="mt-lista">${codigos.length ? codigos.slice(0, 5).map(c => filaCodigo(env, c)).join('') : '<p class="mt-vacio">Aún no sacas códigos. <a href="/tienda/mi-toolkit/?v=codigos">Saca tu primer código</a>.</p>'}</div>
  ${codigos.length > 5 ? `<p class="tk-nota"><a href="/tienda/mi-toolkit/?v=codigos">Ver los ${codigos.length} códigos</a></p>` : ''}
  <h2>Historial</h2>
  <div class="mt-lista">${movs.length ? movs.map(m => `<div class="mt-mov"><div><b>${esc(TIPOS[m.tipo] || m.tipo)}</b><small>${m.nota ? `${esc(m.nota)} · ` : ''}${fechaCorta(m.created_at)}</small></div><span class="m${m.centavos > 0 ? ' mt-mas' : ''}">${m.centavos > 0 ? '+' : '−'}${mx(Math.abs(m.centavos))}</span></div>`).join('') : '<p class="mt-vacio">Todavía no hay movimientos.</p>'}</div>`;
  } else if (v === 'apps') {
    const apps = [];
    for (const app of APPS_SALDO) {
      const plan = await planMensualApp(env, app);
      const s = plan ? await suscripcionApp(env, e.email, app) : null;
      const ini = plan ? await inicioMesesApp(env, e.email, app) : null;
      apps.push({ app, plan, s, ini });
    }
    cuerpo = `${listo && NOMBRE_APP_SALDO[listo] ? `<p class="mt-ok" role="status">¡Listo! Pagaste ${esc(NOMBRE_APP_SALDO[listo])} con tu saldo. Te mandamos el correo con el botón para entrar.</p>` : ''}
  <p class="mt-sub">Tienes <b>${mx(e.saldo_centavos)}</b> de saldo. Cada mes cuesta el precio mensual de lista de la app. Si ya la tienes, el mes se suma después de lo que ya tenías; la app lo ve como cortesía con su fecha.</p>
  <div class="mt-apps">${apps.map(({ app, plan, s, ini }) => !plan ? `<div class="mt-app"><h3>${esc(NOMBRE_APP_SALDO[app])}</h3><p class="mt-p">Por ahora no se puede pagar con saldo.</p></div>` : `
    <form class="mt-app" data-app="${app}" data-precio="${plan.precio_centavos}">
      <h3>${esc(NOMBRE_APP_SALDO[app])}</h3>
      <p class="mt-p">${mx(plan.precio_centavos)} al mes · ${s?.vigente ? `la tienes hasta el ${esc(fechaMx(s.periodo_fin))}${s.cortesia ? '' : s.cancelar_al_final ? '' : ' (se renueva sola)'}` : 'no la tienes activa'}</p>
      ${ini.stripe?.renueva ? `<p class="mt-aviso">Tu suscripción se renueva sola el ${esc(fechaMx(ini.stripe.periodo_fin))}: los meses con saldo empiezan cuando termine. Para no pagar doble, cancela la renovación desde la app.</p>` : ''}
      <div class="mt-fila"><select name="meses" aria-label="Meses">${Array.from({ length: MAX_MESES }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'meses' : 'mes'}</option>`).join('')}</select>
      <button type="submit"${e.saldo_centavos < plan.precio_centavos ? ' disabled' : ''}>Pagar con mi saldo (${mx(plan.precio_centavos)})</button></div>
      <p class="mt-err" role="alert"${e.saldo_centavos < plan.precio_centavos ? '' : ' hidden'}>${e.saldo_centavos < plan.precio_centavos ? `Te faltan ${mx(plan.precio_centavos - e.saldo_centavos)} de saldo.` : ''}</p>
    </form>`).join('')}</div>`;
  } else {
    const grupos = await opcionesCodigos(env);
    cuerpo = `${listo && /^\d+$/.test(listo) ? `<p class="mt-ok" role="status">¡Listo! Sacaste ${listo === '1' ? '1 código' : `${esc(listo)} códigos`}. Están arriba de la lista: cópialos o mándalos por WhatsApp.</p>` : ''}
  <p class="mt-sub">Elige un producto y cuántos códigos quieres. Se descuenta su precio de lista de tu saldo y cada código vale ese producto completo, una sola vez (en apps, 1 mes). Quien lo recibe lo canjea con su correo en vorka.mx/tienda/canjear, sin cuenta. <b>Los códigos no vencen</b>; si uno no lo usas, lo devuelves a tu saldo.</p>
  <form class="mt-form" id="mt-codigos">
    <label>Producto<select name="slug" required>${grupos.map(([g, ops]) => `<optgroup label="${esc(g)}">${ops.map(o => `<option value="${esc(o.slug)}" data-precio="${o.precio}">${esc(o.nombre)} · ${mx(o.precio)}</option>`).join('')}</optgroup>`).join('')}</select></label>
    <label>¿Cuántos códigos?<input name="cantidad" type="number" inputmode="numeric" min="1" max="${MAX_CODIGOS}" value="1"></label>
    <div class="mt-resumen" data-saldo="${e.saldo_centavos}"><div><span>Se descuenta de tu saldo</span><b id="mt-total">—</b></div><div><span>Tu saldo después</span><b id="mt-despues">—</b></div></div>
    <p class="mt-err" id="mt-err" role="alert" hidden></p>
    <button type="submit" id="mt-sacar">Sacar códigos</button>
    <div class="mt-nuevos" id="mt-nuevos" hidden></div>
  </form>
  <h2>Mis códigos (${codigos.length})</h2>
  <div class="mt-lista" id="mt-lista">${codigos.length ? codigos.map(c => filaCodigo(env, c)).join('') : '<p class="mt-vacio">Aún no sacas códigos.</p>'}</div>`;
  }
  return pagina({ titulo: 'Mi Toolkit · Vorka México', ruta: '/tienda/mi-toolkit/', noindex: true, head: CSS, script: SCRIPT_MI,
    cuerpo: `<section class="mt"><div class="marco" style="max-width:920px"><span class="tk-et">Toolkit Vorka</span><h1 class="t-h1" style="margin:8px 0 18px">Mi Toolkit</h1>${tabs}${cuerpo}</div></section>` });
}

const SCRIPT_MI = `(function(){
  function pesos(c){ return '$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2}); }
  function post(u,d){ return fetch(u,{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(d||{})}).then(function(r){ return r.json().catch(function(){return {};}).then(function(j){ return {ok:r.ok,j:j}; }); }).catch(function(){ return {ok:false,j:{error:'Sin conexión. Revisa tu internet e intenta de nuevo.'}}; }); }
  var pt=document.getElementById('mt-portal'); if(pt) pt.addEventListener('click',function(){ pt.disabled=true; post('/api/toolkit/portal').then(function(x){ if(x.ok&&x.j.url) location.href=x.j.url; else { var e=document.getElementById('mt-err'); e.textContent=(x.j.mensaje||x.j.error||'No pudimos abrir el portal. Escríbenos a hola@vorka.mx.'); e.hidden=false; pt.disabled=false; } }); });
  document.addEventListener('click',function(ev){
    var c=ev.target.closest('[data-copiar]'); if(c){ var t=c.dataset.copiar; (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){ c.textContent='¡Copiada!'; setTimeout(function(){ c.textContent='Copiar liga'; },1600); }).catch(function(){ prompt('Copia la liga:',t); }); return; }
    var d=ev.target.closest('[data-devolver]'); if(d){ if(!confirm('¿Devolver el código '+d.dataset.devolver+' a tu saldo? Se anula y ya nadie lo podrá usar. Te regresamos '+d.dataset.monto+'.')) return; d.disabled=true;
      post('/api/toolkit/devolver',{codigo:d.dataset.devolver}).then(function(x){ if(x.ok) location.reload(); else { alert(x.j.error||'No se pudo devolver.'); d.disabled=false; } }); }
  });
  [].forEach.call(document.querySelectorAll('form.mt-app'),function(f){ var b=f.querySelector('button'), s=f.querySelector('select'), er=f.querySelector('.mt-err'), p=+f.dataset.precio;
    s.addEventListener('change',function(){ b.textContent='Pagar con mi saldo ('+pesos(p*(+s.value))+')'; });
    f.addEventListener('submit',function(e){ e.preventDefault(); if(!confirm('¿Pagar '+s.value+(s.value==='1'?' mes':' meses')+' con '+pesos(p*(+s.value))+' de tu saldo?')) return; b.disabled=true; er.hidden=true;
      post('/api/toolkit/app',{app:f.dataset.app,meses:+s.value}).then(function(x){ if(x.ok&&x.j.url) location.href=x.j.url; else { er.textContent=x.j.error||'No se pudo pagar.'; er.hidden=false; b.disabled=false; } }); }); });
  var fc=document.getElementById('mt-codigos'); if(fc){ var sel=fc.slug, n=fc.cantidad, rs=fc.querySelector('.mt-resumen'), saldo=+rs.dataset.saldo, er=document.getElementById('mt-err'), b=document.getElementById('mt-sacar');
    function pinta(){ var o=sel.options[sel.selectedIndex], c=Math.min(${MAX_CODIGOS},Math.max(1,parseInt(n.value,10)||1)), t=(o?+o.dataset.precio:0)*c; document.getElementById('mt-total').textContent=pesos(t); document.getElementById('mt-despues').textContent=t>saldo?'No alcanza':pesos(saldo-t);
      b.disabled=t>saldo; er.hidden=t<=saldo; if(t>saldo) er.textContent='Te faltan '+pesos(t-saldo)+' de saldo para esta tanda.'; b.textContent='Sacar '+c+(c===1?' código':' códigos')+' ('+pesos(t)+')'; }
    sel.addEventListener('change',pinta); n.addEventListener('input',pinta); pinta();
    fc.addEventListener('submit',function(e){ e.preventDefault(); b.disabled=true; er.hidden=true;
      post('/api/toolkit/codigos',{slug:sel.value,cantidad:+n.value}).then(function(x){ if(x.ok){ location.href='/tienda/mi-toolkit/?v=codigos&listo='+x.j.codigos.length; } else { er.textContent=x.j.error||'No se pudieron sacar.'; er.hidden=false; b.disabled=false; } }); }); }
})();`;

// ---------- canjear un código ----------
export async function paginaCanjear(env, codigo) {
  const c = codigo ? await leerCodigo(env, codigo) : null;
  const malo = codigo && !c ? 'Ese código no existe. Revisa que esté completo (TK-XXXX-XXXX).' : c?.estado === 'usado' ? 'Este código ya se usó: cada código funciona una sola vez.'
    : c?.estado === 'devuelto' ? 'Este código ya no es válido: quien lo sacó lo canceló.' : c && !c.vendible ? 'Este producto ya no está a la venta. Escríbenos a hola@vorka.mx con tu código.' : '';
  const app = c?.contenido?.suscripcion ? c.contenido.acceso?.app : null;
  return pagina({ titulo: 'Canjear un código de regalo · Vorka México', ruta: '/tienda/canjear/', noindex: true, head: CSS + `<style>
.cj{padding:clamp(100px,12vw,140px) 0 70px}.cj-g{display:grid;gap:24px;max-width:960px;margin:0 auto}@media(min-width:900px){.cj-g{grid-template-columns:1fr 1fr}}
.cj-t{position:relative;overflow:hidden;border-radius:28px;background:var(--noche);color:var(--claro);padding:32px 28px;min-height:300px;display:flex;flex-direction:column;gap:10px}
.cj-t h1{font-size:clamp(28px,4vw,38px);letter-spacing:-.04em;line-height:1.05;color:#fff;margin:6px 0}.cj-t h1 span{color:var(--oro-claro)}.cj-t p{color:var(--claro-2);font-size:16px;margin:0}
.cj-t .v{position:absolute;right:-60px;bottom:-80px;width:300px;opacity:.06;color:#fff}.cj-t .v svg{width:100%;height:auto}
.cj-mal{border-radius:14px;padding:12px 14px;background:rgba(179,38,30,.22);border:1px solid rgba(242,194,189,.5);color:#fff;font-size:15px}
</style>`, script: SCRIPT_CANJE,
  cuerpo: `<section class="cj"><div class="marco"><div class="cj-g">
  <div class="cj-t"><span class="v" aria-hidden="true">${LOGO}</span><span style="font-size:40px" aria-hidden="true">🎁</span>
    <h1>${c && !malo ? `Tienes <span>${esc(c.producto)}</span>` : 'Canjea tu <span>código de regalo</span>'}</h1>
    <p>${c && !malo ? (app ? `Un mes completo de ${esc(NOMBRE_APP_SALDO[app] || c.producto)}, sin costo y sin tarjeta. Si ya tienes la app, se suma después de lo que ya tenías.` : `${esc(c.descripcion_corta || '')} Te llega a tu correo igual que una compra.`) : 'Escribe el código que te compartieron (TK-XXXX-XXXX) y tu correo. No necesitas cuenta ni tarjeta.'}</p>
    ${malo ? `<p class="cj-mal" role="alert">${esc(malo)}</p>` : ''}
  </div>
  <form class="tk-card t-form" id="form-canje" novalidate>
    <h2 style="font-size:22px;letter-spacing:-.03em;margin:0 0 6px">Canjear</h2>
    <p class="tk-nota" style="font-size:15px;margin:0 0 14px">Queda a tu nombre y te mandamos el acceso a tu correo.</p>
    <div class="t-campo"><label for="codigo">Código</label><input id="codigo" name="codigo" type="text" autocapitalize="characters" spellcheck="false" maxlength="12" placeholder="TK-XXXX-XXXX" value="${esc(c?.codigo || String(codigo || '').toUpperCase())}" required></div>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Tu correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llega tu acceso. Úsalo también para entrar después.</small></div>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos y condiciones</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    <p class="t-error" id="error-canje" role="alert" hidden></p>
    <button class="btn tinta" type="submit" id="btn-canje">Canjear mi regalo ${FLECHA}</button>
    <p class="tk-nota">🔒 Cada código funciona una sola vez.</p>
  </form>
</div></div></section>` });
}
const SCRIPT_CANJE = `(function(){
  var f=document.getElementById('form-canje'); if(!f||!window.fetch) return;
  var err=document.getElementById('error-canje'), btn=document.getElementById('btn-canje'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){ e.preventDefault();
    var d={codigo:f.codigo.value.trim().toUpperCase(),nombre:f.nombre.value.trim(),email:f.email.value.trim(),terminos:f.terminos.checked};
    if(!/^TK-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(d.codigo)){ f.codigo.focus(); return mostrar('Escribe el código completo: TK-XXXX-XXXX.'); }
    if(d.nombre.length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido: ahí te llega tu acceso.'); }
    if(!d.terminos) return mostrar('Acepta los términos y el aviso de privacidad.');
    err.hidden=true; btn.disabled=true; btn.textContent='Canjeando…';
    fetch('/api/toolkit/canjear',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok){ var h=document.createElement('h2'); h.textContent='¡Listo! Ya es tuyo'; var p=document.createElement('p'); p.textContent=x.j.mensaje; f.replaceChildren(h,p); } else mostrar(x.j.error||'No pudimos canjear tu código.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
})();`;

// ---------- rutas ----------
export async function rutasToolkit(req, env, url) {
  const p = url.pathname, M = req.method;
  if ((p === '/tienda/toolkit' || p === '/tienda/toolkit/') && M === 'GET') return p.endsWith('/') ? paginaToolkit(env, req, url) : Response.redirect(`${url.origin}/tienda/toolkit/${url.search}`, 301);
  let m;
  if ((m = p.match(/^\/tienda\/toolkit\/entrar\/([a-f0-9]{64})\/?$/)) && M === 'GET') {
    const a = await validarAcceso(env, m[1], APP);
    if (!a) return pagina({ titulo: 'Enlace vencido · Toolkit', ruta: '/tienda/mi-toolkit/', noindex: true, status: 410,
      cuerpo: aviso({ clase: 'alerta', titulo: 'Este enlace ya venció', texto: 'Entra a Mi Toolkit con tu correo: te mandamos un código o usas tu contraseña.', extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/cuenta/?volver=/tienda/mi-toolkit/">Entrar con mi correo ${FLECHA}</a></div>` }) });
    const email = String(a.email).trim().toLowerCase();
    await env.DB.prepare('INSERT OR IGNORE INTO puntos_cuentas (email, nombre) VALUES (?, ?)').bind(email, a.nombre || null).run();
    return new Response(null, { status: 303, headers: { location: '/tienda/mi-toolkit/', 'set-cookie': await crearSesion(env, email), 'referrer-policy': 'no-referrer', ...NO_CACHE } });
  }
  if ((p === '/tienda/mi-toolkit' || p === '/tienda/mi-toolkit/') && M === 'GET') return p.endsWith('/') ? paginaMiToolkit(env, req, url) : Response.redirect(`${url.origin}/tienda/mi-toolkit/${url.search}`, 301);
  if ((m = p.match(/^\/tienda\/canjear(?:\/([A-Za-z0-9-]{1,20}))?\/?$/)) && M === 'GET') return paginaCanjear(env, m[1] || null);
  if (!p.startsWith('/api/toolkit/')) return null;

  if (p === '/api/toolkit/saldo' && M === 'GET') {
    const c = await cuentaActual(req, env);
    if (!c) return json({ cuenta: false }, 200, NO_CACHE);
    const e = await estadoToolkit(env, c.email);
    return json({ cuenta: true, email: c.email, toolkit: e.tiene, activo: e.activo, usable: e.usable, saldo_centavos: e.saldo_centavos }, 200, NO_CACHE);
  }
  if (M !== 'POST') return fail('No encontrado', 404);
  if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
  const b = await req.json().catch(() => ({}));
  // Canjear: cualquiera (sin cuenta), con límite por IP para que no se adivinen códigos
  if (p === '/api/toolkit/canjear') {
    const ip = req.headers.get('cf-connecting-ip') || 'local';
    if (!(await dentroDelLimite(env, `toolkit:canje:${await sha256(ip)}`, 10, 600))) return fail('Demasiados intentos. Espera unos minutos.', 429);
    const email = String(b.email || '').trim().toLowerCase(), nombre = String(b.nombre || '').trim().slice(0, 120);
    if (nombre.length < 2) return fail('Escribe tu nombre.');
    if (!emailValido(email)) return fail('Escribe un correo válido.');
    if (b.terminos !== true) return fail('Acepta los términos y el aviso de privacidad.');
    const r = await canjearCodigo(env, { codigo: b.codigo, nombre, email });
    if (r.error) return fail(r.error, r.status || 400);
    const correo = email.replace(/^(.).*(@.*)$/, '$1•••$2');
    return json({ ok: true, mensaje: r.app ? `Tu mes de ${NOMBRE_APP_SALDO[r.app]} está activo hasta el ${fechaMx(r.hasta)}. Te mandamos a ${correo} el botón para entrar.${r.aviso ? ` ${r.aviso}` : ''}` : `Te mandamos a ${correo} tu acceso a ${r.producto}. Revisa también tu carpeta de spam.` });
  }
  const c = await cuentaActual(req, env);
  if (!c) return fail('Tu sesión terminó. Vuelve a entrar.', 401);
  if (!(await dentroDelLimite(env, `toolkit:${await sha256(c.email)}`, 30, 600))) return fail('Demasiados intentos. Espera unos minutos.', 429);
  const nombre = await nombreDe(env, c.email, b.nombre);
  const responder = r => r.error ? fail(r.error, r.status || 400) : json(r, 200, NO_CACHE);
  if (p === '/api/toolkit/cotizar') return json(await cotizar(env, c.email, String(b.slug || '').trim().toLowerCase()), 200, NO_CACHE);
  if (p === '/api/toolkit/pagar') return responder(await pagarConSaldo(env, { email: c.email, nombre, slug: String(b.slug || '').trim().toLowerCase() }));
  if (p === '/api/toolkit/app') return responder(await pagarMesesApp(env, { email: c.email, nombre, app: String(b.app || ''), meses: b.meses }));
  if (p === '/api/toolkit/codigos') return responder(await sacarCodigos(env, { email: c.email, slug: String(b.slug || '').trim().toLowerCase(), cantidad: b.cantidad }));
  if (p === '/api/toolkit/devolver') return responder(await devolverCodigo(env, { email: c.email, codigo: b.codigo }));
  if (p === '/api/toolkit/portal') {
    try {
      const r = await portalToolkit(env, c.email);
      return r ? json(r, 200, NO_CACHE) : fail('No encontramos tu suscripción. Escríbenos a hola@vorka.mx.', 404);
    } catch (e) { console.error('toolkit portal', e?.message); return fail('No pudimos abrir el portal. Intenta en un momento.', 502); }
  }
  return fail('No encontrado', 404);
}

// Nombre para la orden: el que escribió en el formulario, o el de su cuenta, o el de su correo
async function nombreDe(env, email, escrito) {
  const n = String(escrito || '').trim();
  if (n.length >= 2) return n.slice(0, 120);
  const c = await one(env, 'SELECT nombre FROM puntos_cuentas WHERE email = ?', email);
  return c?.nombre || email.split('@')[0];
}
