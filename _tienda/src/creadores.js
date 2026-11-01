// Portal de creadores · vorka.mx/creadores
//   /creadores                  solicitud para vender (pública)
//   /creadores/entrar           pedir enlace de acceso por correo
//   /creadores/acceso/<token>   canjear enlace → sesión
//   /creadores/panel            pagos (Stripe incrustado), productos y ventas
//   /creadores/productos/<id>   editor de producto (o "nuevo")
//   /api/creadores/*            acciones del portal (sesión + mismo origen)
import { z } from 'zod';
import { json, fail, all, one, run, sha256, pesos, ahoraISO } from './util.js';
import { dentroDelLimite } from './modelo.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { crearEnlace, canjearEnlace, creadorActual, cerrarSesion, mismoOrigen } from './creadores-acceso.js';
import { crearCuenta, sesionComponentes, enlacePanel } from './pagos/connect.js';
import { refrescarCreador, nuevoId, DIAS_PARA_TRANSFERIR, comisionSuscripcion } from './marketplace.js';
import { esSaas, appDeProducto, resumenSaas, crearLlave, urlAvisoValida, secretoFirma, enviarPrueba, apiV1 } from './creadores-saas.js';
import { paginaDocs } from './creadores-docs.js';
import { solicitudRecibida, avisoNuevaSolicitud, enlaceAcceso } from './correos-creadores.js';
import * as admin from './admin.js';
import { CONNECT_JS } from './vendor/connectjs.generado.js';

const base = { noindex: true };
const RESPUESTA_ENTRAR = 'Si ese correo es de un creador aprobado, en un momento te llega un enlace para entrar. Revisa también spam o promociones.';
const ESTADO_PROD = { borrador: ['Borrador', ''], en_revision: ['En revisión', 'espera'], aprobado: ['Publicado', 'c-ok'], rechazado: ['Necesita cambios', 'alerta'] };
// Aprobado pero sin pagos configurados: todavía no sale en la tienda
const estadoProd = (p, listo) => p.revision === 'aprobado' && !listo ? ['Aprobado · falta configurar tus pagos', 'espera'] : ESTADO_PROD[p.revision] || [p.revision, ''];
const ESTADO_TRF = { por_calcular: 'Programada', programada: 'Programada', enviada: 'Pagada', cancelada: 'Cancelada (reembolso)', revertida: 'Revertida (reembolso o aclaración)', error: 'En revisión' };
const fechaMx = iso => iso ? new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'short', year: 'numeric' }) : '';

// ---------- solicitud ----------
const EsquemaSolicitud = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido.').max(254)),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  ciudad: z.string().trim().max(80).optional().or(z.literal('')),
  que_vende: z.string().trim().min(20, 'Cuéntanos en al menos dos líneas qué quieres vender.').max(2000),
  enlaces: z.string().trim().max(600).optional().or(z.literal('')),
  terminos: z.preprocess(v => v === 'on' || v === true, z.literal(true, { error: 'Debes aceptar los términos para creadores y el aviso de privacidad.' })),
  sitio: z.string().max(0).optional(),
});

function paginaSolicitud({ error = '', datos = {} } = {}) {
  const v = k => esc(datos[k] || '');
  return pagina({ ...base, noindex: false, titulo: 'Vende tus productos en Vorka México', ruta: '/creadores',
    descripcion: 'Vende tus guías, plantillas y herramientas digitales en la tienda de Vorka México. Nosotros cobramos, entregamos y te pagamos en automático.',
    cuerpo: `
<section class="t-sec t-cab"><div class="marco">
  <span class="etiqueta">Creadores</span>
  <h1 class="h1 t-titulo">Vende tus productos digitales <span class="metal">con Vorka México.</span></h1>
  <p class="lead">Guías, plantillas, cuadernos de trabajo, calculadoras. Tú creas; nosotros cobramos, entregamos y atendemos a tus compradores.</p>
</div></section>
<section class="t-sec t-sin-arriba"><div class="marco t-hero-g">
  <div>
    <ul class="t-lista">
      <li>${CHECK}<span><b>Te quedas con el 80 %</b> de cada venta, menos la comisión de la pasarela de pago.</span></li>
      <li>${CHECK}<span><b>Pagos automáticos</b> a tu cuenta bancaria ${DIAS_PARA_TRANSFERIR} días después de cada venta.</span></li>
      <li>${CHECK}<span><b>Tarjeta, OXXO y SPEI</b> para tus compradores, con entrega inmediata por correo.</span></li>
      <li>${CHECK}<span><b>Revisamos cada producto</b> para cuidar la calidad de la tienda.</span></li>
      <li>${CHECK}<span><b>¿Tienes una app o un SaaS?</b> Véndelo por suscripción mensual o anual: cobramos cada renovación y te transferimos tu parte. <a href="/creadores/docs">Así se conecta tu app</a>.</span></li>
    </ul>
    <p class="t-nota">¿Ya eres creador? <a href="/creadores/entrar">Entra a tu portal</a>.</p>
  </div>
  <form class="t-form" method="post" action="/creadores/solicitud" novalidate>
    <div class="t-campo"><label for="nombre">Nombre o nombre de tu marca</label><input id="nombre" name="nombre" type="text" required maxlength="120" value="${v('nombre')}"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" required maxlength="254" value="${v('email')}"></div>
    <div class="t-campo"><label for="telefono">WhatsApp (opcional)</label><input id="telefono" name="telefono" type="text" maxlength="30" value="${v('telefono')}"></div>
    <div class="t-campo"><label for="ciudad">Ciudad</label><input id="ciudad" name="ciudad" type="text" maxlength="80" value="${v('ciudad')}"></div>
    <div class="t-campo"><label for="que_vende">¿Qué quieres vender?</label><textarea id="que_vende" name="que_vende" rows="4" maxlength="2000" required>${v('que_vende')}</textarea></div>
    <div class="t-campo"><label for="enlaces">Enlaces a tu trabajo (opcional)</label><input id="enlaces" name="enlaces" type="text" maxlength="600" placeholder="Instagram, sitio web, portafolio…" value="${v('enlaces')}"></div>
    <div class="t-trampa" aria-hidden="true"><label for="sitio">No llenar</label><input id="sitio" name="sitio" tabindex="-1" autocomplete="off"></div>
    <label class="t-casilla"><input type="checkbox" name="terminos" required><span>Acepto los <a href="/legal/creadores/" target="_blank">términos para creadores</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    ${error ? `<p class="t-error" role="alert">${esc(error)}</p>` : ''}
    <button class="btn tinta" type="submit">Enviar solicitud ${FLECHA}</button>
  </form>
</div></section>` });
}

async function postSolicitud(req, env, ctx) {
  const datos = Object.fromEntries(await req.formData().catch(() => new FormData()));
  const v = EsquemaSolicitud.safeParse(datos);
  if (!v.success) {
    if (datos.sitio) return gracias();
    return paginaSolicitud({ error: v.error.issues[0].message, datos });
  }
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (!(await dentroDelLimite(env, `solicitud:ip:${await sha256(ip)}`, 5, 3600))) return paginaSolicitud({ error: 'Demasiados intentos. Intenta más tarde.', datos });
  const d = v.data;
  const ya = await one(env, 'SELECT id, estado FROM creadores WHERE email = ?', d.email);
  if (!ya) {
    const c = { id: nuevoId('cre'), ...d, telefono: d.telefono || null, ciudad: d.ciudad || null, enlaces: d.enlaces || '' };
    await run(env, 'INSERT INTO creadores (id, nombre, email, telefono, ciudad, que_vende, enlaces, acepto_terminos_at) VALUES (?,?,?,?,?,?,?,?)',
      c.id, c.nombre, c.email, c.telefono, c.ciudad, c.que_vende, c.enlaces, ahoraISO());
    const trabajo = Promise.all([solicitudRecibida(env, c), avisoNuevaSolicitud(env, c)]).catch(e => console.error('solicitud correo', e.message));
    ctx?.waitUntil ? ctx.waitUntil(trabajo) : await trabajo;
  }
  return gracias();
}
const gracias = () => pagina({ ...base, titulo: 'Solicitud recibida · Vorka México', ruta: '/creadores',
  cuerpo: aviso({ icono: CHECK, clase: 'exito', titulo: '¡Gracias! Recibimos tu solicitud', texto: 'La revisamos a mano y te respondemos por correo en unos días.' }) });

// ---------- entrar ----------
const paginaEntrar = (msg = '') => pagina({ ...base, titulo: 'Entrar · Creadores Vorka México', ruta: '/creadores/entrar',
  cuerpo: msg ? aviso({ icono: CHECK, clase: 'exito', titulo: 'Revisa tu correo', texto: msg }) : `
<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Portal de creadores</span>
  <h1 class="t-h1">Entra a tu portal</h1>
  <p class="t-lead">Escribe tu correo y te mandamos un enlace para entrar, sin contraseña.</p>
  <form class="t-form" method="post" action="/creadores/entrar" novalidate>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" required autocomplete="email"></div>
    <button class="btn tinta" type="submit">Enviarme el enlace ${FLECHA}</button>
  </form>
  <p class="t-nota">¿Todavía no vendes con nosotros? <a href="/creadores">Envía tu solicitud</a>.</p>
</div></section>` });

async function postEntrar(req, env, ctx) {
  const f = Object.fromEntries(await req.formData().catch(() => new FormData()));
  const email = String(f.email || '').trim().toLowerCase();
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const ok = await dentroDelLimite(env, `entrar:ip:${await sha256(ip)}`, 10, 3600) && await dentroDelLimite(env, `entrar:email:${await sha256(email)}`, 4, 3600);
  if (ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const trabajo = (async () => {
      const c = await one(env, "SELECT * FROM creadores WHERE email = ? AND estado IN ('aprobado','suspendido')", email);
      if (c) await enlaceAcceso(env, c, await crearEnlace(env, c.id));
    })().catch(e => console.error('entrar', e.message));
    ctx?.waitUntil ? ctx.waitUntil(trabajo) : await trabajo;
  }
  return paginaEntrar(RESPUESTA_ENTRAR);
}

// ---------- panel ----------
async function paginaPanel(env, c) {
  const productos = (await all(env, `SELECT p.id, p.slug, p.nombre, p.precio_centavos, p.revision, p.nota_revision, p.activo, p.contenido,
      (SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id = i.order_id WHERE i.product_id = p.id AND o.estado = 'paid') vendidos
    FROM products p WHERE p.creador_id = ? ORDER BY p.updated_at DESC`, c.id)).map(p => ({ ...p, contenido: JSON.parse(p.contenido || '{}') }));
  const trf = await all(env, `SELECT t.*, (SELECT GROUP_CONCAT(i.nombre, ' + ') FROM order_items i WHERE i.order_id = t.order_id AND i.creador_id = t.creador_id) productos
    FROM transferencias t WHERE t.creador_id = ? ORDER BY t.created_at DESC LIMIT 200`, c.id);
  const tot = trf.reduce((s, t) => {
    if (t.estado === 'enviada') s.pagado += t.monto_centavos;
    if (['programada', 'por_calcular'].includes(t.estado)) s.porPagar += t.monto_centavos;
    if (['enviada', 'programada', 'por_calcular'].includes(t.estado)) s.ventas += t.venta_centavos;
    return s;
  }, { pagado: 0, porPagar: 0, ventas: 0 });
  const unicas = trf.filter(t => !t.factura_id).slice(0, 100);
  const listo = !!c.stripe_listo;
  const suspendido = c.estado === 'suspendido';
  // SaaS: métricas, cobros por factura, próximos depósitos e integración (llave de API y avisos)
  const tieneSaas = productos.some(esSaas);
  const saas = tieneSaas ? await resumenSaas(env, c) : null;
  return pagina({ ...base, stripe: true, titulo: 'Mi portal · Creadores Vorka México', ruta: '/creadores/panel', head: CSS_SAAS,
    cuerpo: `
<section class="t-sec"><div class="marco">
  <div class="c-cab"><div><span class="etiqueta">Portal de creadores</span><h1 class="t-h1">Hola, ${esc(c.nombre.split(' ')[0])}</h1></div>
    <form method="post" action="/creadores/salir"><button class="btn blanco chico" type="submit">Salir</button></form></div>
  ${suspendido ? `<p class="t-error" role="alert">Tu cuenta está pausada${c.nota ? `: ${esc(c.nota)}` : ''}. Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>` : ''}
  <div id="stripe-aviso"></div>

  <div class="c-tarjetas">
    <div class="c-dato"><b class="num">${pesos(tot.ventas)}</b><span>Ventas</span></div>
    <div class="c-dato"><b class="num">${pesos(tot.porPagar)}</b><span>Por recibir</span></div>
    <div class="c-dato"><b class="num">${pesos(tot.pagado)}</b><span>Ya recibido</span></div>
    <div class="c-dato"><b class="num">${c.comision_pct} %</b><span>Comisión de Vorka</span>${tieneSaas && comisionSuscripcion(c.comision_pct) !== c.comision_pct ? `<small>${comisionSuscripcion(c.comision_pct)} % en suscripciones</small>` : ''}</div>
  </div>

  <h2 class="t-h2 c-sec">Cómo recibes tus pagos</h2>
  ${listo ? `<div class="c-caja c-ok"><p><b>Tu cuenta está lista para recibir pagos.</b> Las ventas se depositan ${DIAS_PARA_TRANSFERIR} días después, cuando termina el plazo de reembolso.</p>
      <div class="botones"><button class="btn blanco chico" type="button" id="btn-depositos">Ver mis depósitos ${FLECHA}</button><button class="btn blanco chico" type="button" id="btn-datos">Actualizar mis datos</button></div></div>
      <div id="stripe-gestion" hidden></div>`
    : `<div class="c-caja"><p><b>Configura cómo recibes tus pagos.</b> Stripe (nuestro procesador de pagos) te pedirá tus datos, una identificación y tu cuenta bancaria. Tus productos se publican cuando esto esté listo.</p>
      <div id="stripe-registro" class="c-stripe"><button class="btn tinta" type="button" id="btn-registro">Configurar mis pagos ${FLECHA}</button></div></div>`}

  <div class="c-sec c-sec-fila"><h2 class="t-h2">Mis productos</h2>${suspendido ? '' : `<span class="botones"><a class="btn blanco chico" href="/creadores/productos/nuevo">Nuevo descargable</a><a class="btn tinta chico" href="/creadores/productos/nuevo?tipo=saas">Nuevo SaaS / app</a></span>`}</div>
  ${productos.length ? `<ul class="c-lista">${productos.map(p => { const [t, cl] = estadoProd(p, listo); return `
    <li><a href="/creadores/productos/${esc(p.id)}"><span><b>${esc(p.nombre)}</b><small>${esSaas(p) ? `Suscripción · ${preciosTexto(p)}` : `${pesos(p.precio_centavos)} · ${p.vendidos} ${p.vendidos === 1 ? 'vendido' : 'vendidos'}`}${p.revision === 'rechazado' && p.nota_revision ? ` · ${esc(p.nota_revision)}` : ''}</small></span><span class="c-pill ${cl}">${t}</span></a></li>`; }).join('')}</ul>`
    : `<p class="t-nota">Aún no tienes productos. Crea el primero: un descargable (archivos) o tu SaaS / app por suscripción, y envíalo a revisión.</p>`}
  ${saas ? seccionSaas(c, saas) : ''}

  <h2 class="t-h2 c-sec">${saas ? 'Ventas de descargables' : 'Mis ventas'}</h2>
  ${unicas.length ? `<div class="c-tabla"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Venta</th><th>Vorka</th><th>Stripe</th><th>Recibes</th><th>Estado</th></tr></thead><tbody>
    ${unicas.map(t => `<tr><td>${fechaMx(t.created_at)}</td><td>${esc(t.productos || '')}</td><td class="num">${pesos(t.venta_centavos)}</td><td class="num">−${pesos(t.comision_vorka_centavos)}</td><td class="num">−${pesos(t.comision_stripe_centavos)}</td><td class="num"><b>${pesos(t.monto_centavos)}</b></td>
      <td>${ESTADO_TRF[t.estado] || t.estado}${t.estado === 'programada' ? `<small>${fechaMx(t.disponible_en)}</small>` : ''}</td></tr>`).join('')}
  </tbody></table></div>` : '<p class="t-nota">Cuando vendas, aquí verás cada venta y cuándo se deposita.</p>'}
  <p class="t-nota">¿Dudas? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. <a href="/legal/creadores/">Términos para creadores</a>${tieneSaas ? ' · <a href="/creadores/docs">Documentación de la API</a>' : ''}.</p>
</div></section>`,
    modulo: `
import { loadConnectAndInitialize } from '/creadores/connect.mjs';
let instancia;
const iniciar = () => instancia ||= loadConnectAndInitialize({
  publishableKey: ${JSON.stringify(env.STRIPE_PUBLISHABLE_KEY || '')},
  locale: 'es-419',
  fetchClientSecret: async () => { const r = await fetch('/api/creadores/stripe/sesion', { method: 'POST' }); const d = await r.json(); if (!r.ok) throw new Error(d.error); return d.client_secret; },
  appearance: { variables: { colorPrimary: '#6B2A85', fontFamily: 'Inter, -apple-system, sans-serif', borderRadius: '12px' } },
});
const montar = (id, nombre, alSalir) => { const el = document.getElementById(id); if (!el) return; el.hidden = false; el.innerHTML = ''; const c = iniciar().create(nombre); if (alSalir) c.setOnExit(alSalir); el.appendChild(c); };
${listo ? `montar('stripe-aviso', 'notification-banner');` : ''}
document.getElementById('btn-registro')?.addEventListener('click', () => montar('stripe-registro', 'account-onboarding', () => location.reload()));
document.getElementById('btn-datos')?.addEventListener('click', () => montar('stripe-gestion', 'account-management'));
document.getElementById('btn-depositos')?.addEventListener('click', async e => {
  e.target.disabled = true; const r = await fetch('/api/creadores/stripe/panel', { method: 'POST' }); const d = await r.json();
  if (d.url) location.href = d.url; else { alert(d.error || 'No se pudo abrir'); e.target.disabled = false; }
});
${tieneSaas ? SCRIPT_INTEGRACION : ''}`,
  });
}

// ---------- suscripciones (SaaS) en el portal ----------
const PLAN_TXT = { month: 'mes', year: 'año' };
// "$199 MXN /mes · $1,990 MXN /año"
export const preciosTexto = p => Object.entries(p.contenido?.suscripcion?.precios || {}).filter(([, v]) => v > 0).map(([k, v]) => `${pesos(v)} /${PLAN_TXT[k]}`).join(' · ');
const ESTADO_AVISO = { pendiente: 'Reintentando', enviado: 'Entregado', fallido: 'Falló' };
// Los campos url y los que no llevan type (nombre, categoría, listas) con el mismo estilo que los de texto
const CSS_CAMPOS = `.t-campo input[type="url"],.t-campo input:not([type]),.c-item input:not([type]){width:100%;min-height:50px;padding:0 16px;border-radius:14px;border:1px solid var(--line-2);background:var(--bg);font:inherit;font-size:16px;color:var(--fg)}`;
const CSS_SAAS = `<style>${CSS_CAMPOS}
.c-dato small{display:block;color:var(--fg-2);font-size:12.5px;margin-top:2px}
.c-proximos{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin:0;padding:0;list-style:none}
.c-proximos li{border:1px solid var(--line);border-radius:14px;padding:10px 12px;display:grid;gap:2px}.c-proximos small{color:var(--fg-2)}
.c-integra{display:grid;gap:14px}.c-integra .t-campo{margin:0}
.c-llave{font:600 14px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--bg-2,#f4f2ef);border:1px dashed var(--line);border-radius:10px;padding:10px 12px;overflow-wrap:anywhere;margin:0}
.c-fila{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.c-tabla td small{display:block;color:var(--fg-2)}
@media (max-width:640px){.c-tabla{overflow-x:auto}}
</style>`;
function seccionSaas(c, s) {
  const fila = t => `<tr><td>${fechaMx(t.created_at)}</td><td>${esc(t.producto || '')}<small>${esc(t.factura_id)}</small></td><td class="num">${pesos(t.venta_centavos)}</td>
    <td class="num">−${pesos(t.comision_vorka_centavos)}<small>${t.comision_pct} %</small></td><td class="num">${t.estado === 'por_calcular' ? '<small>por calcular</small>' : `−${pesos(t.comision_stripe_centavos)}`}</td>
    <td class="num"><b>${pesos(t.monto_centavos)}</b></td><td>${ESTADO_TRF[t.estado] || t.estado}${['programada', 'por_calcular'].includes(t.estado) ? `<small>${fechaMx(t.disponible_en)}</small>` : ''}</td></tr>`;
  return `
  <h2 class="t-h2 c-sec">Suscripciones</h2>
  <div class="c-tarjetas">
    <div class="c-dato"><b class="num">${s.suscriptores}</b><span>Suscriptores activos</span>${s.por_cancelar ? `<small>${s.por_cancelar} cancelan al final del periodo</small>` : ''}</div>
    <div class="c-dato"><b class="num">${pesos(s.mrr.bruto)}</b><span>Ingreso mensual (MRR)</span><small>Lo que pagan tus suscriptores al mes</small></div>
    <div class="c-dato"><b class="num">${pesos(s.mrr.vorka)}</b><span>Vorka (${s.pct} %)</span><small>Mínimo 20 % en suscripciones</small></div>
    <div class="c-dato"><b class="num">${pesos(s.mrr.tuyo)}</b><span>Tu parte al mes</span><small>Antes de la comisión de Stripe</small></div>
    <div class="c-dato"><b class="num">${s.cancelaciones_30}</b><span>Cancelaciones</span><small>Últimos 30 días</small></div>
  </div>
  <h3 class="t-h3 c-sec">Próximos depósitos</h3>
  ${s.proximos.length ? `<ul class="c-proximos">${s.proximos.map(x => `<li><b class="num">${pesos(x.monto)}${x.estimado ? '*' : ''}</b><small>${fechaMx(`${x.dia}T12:00:00Z`)} · ${x.n} ${x.n === 1 ? 'cobro' : 'cobros'}</small></li>`).join('')}</ul>
    ${s.proximos.some(x => x.estimado) ? '<p class="t-nota">* Aún sin la comisión de Stripe de algún cobro: se descuenta al calcularse.</p>' : ''}` : '<p class="t-nota">Sin depósitos programados.</p>'}
  <h3 class="t-h3 c-sec">Cobros de suscripciones</h3>
  ${s.facturas.length ? `<div class="c-tabla"><table><thead><tr><th>Fecha</th><th>Producto · factura</th><th>Cobro</th><th>Vorka</th><th>Stripe</th><th>Recibes</th><th>Estado</th></tr></thead><tbody>${s.facturas.map(fila).join('')}</tbody></table></div>`
    : '<p class="t-nota">Cada cobro (el primero y cada renovación) aparece aquí con su desglose y la fecha en que se deposita: 7 días después en planes mensuales y 11 en anuales.</p>'}

  <h2 class="t-h2 c-sec" id="integracion">Integración con tu app</h2>
  <div class="c-caja c-integra">
    <p>Tu app revisa si un correo tiene la suscripción al corriente con la <b>API</b> y recibe <b>avisos firmados</b> cuando alguien se suscribe, renueva, falla un pago o cancela. <a href="/creadores/docs">Ver la documentación con ejemplos</a>.</p>
    <div><b>Llave de API</b>
      <p class="t-nota" id="llave-estado">${c.api_llave_hash ? `Activa · termina en <code>…${esc(c.api_llave_pista || '')}</code> · creada el ${fechaMx(c.api_llave_creada_at)}${c.api_usada_at ? ` · último uso ${fechaMx(c.api_usada_at)}` : ''}` : 'Aún no tienes llave.'}</p>
      <pre class="c-llave" id="llave-nueva" hidden></pre>
      <div class="c-fila"><button class="btn ${c.api_llave_hash ? 'blanco' : 'tinta'} chico" type="button" id="btn-llave">${c.api_llave_hash ? 'Rotar llave' : 'Crear llave'}</button></div></div>
    <form id="form-aviso" class="c-integra" novalidate>
      <div class="t-campo"><label for="webhook_url">URL de tu app para los avisos</label><input id="webhook_url" name="webhook_url" type="url" inputmode="url" maxlength="500" placeholder="https://miapp.com/webhooks/vorka" value="${esc(c.webhook_url || '')}">
        <small class="t-ayuda">https. Te mandamos un POST con JSON y la cabecera <code>Vorka-Firma</code>. Respondes 2xx; si no, reintentamos durante unos dos días.</small></div>
      <div class="c-fila"><button class="btn tinta chico" type="submit">Guardar URL</button><button class="btn blanco chico" type="button" id="btn-prueba"${c.webhook_url ? '' : ' disabled'}>Enviar prueba</button><button class="btn blanco chico" type="button" id="btn-secreto">Ver secreto de firma</button></div>
      <pre class="c-llave" id="secreto" hidden></pre>
      <p class="t-nota" id="aviso-msj" role="status" aria-live="polite"></p>
    </form>
    ${s.avisos.length ? `<div class="c-tabla"><table><thead><tr><th>Fecha</th><th>Aviso</th><th>Estado</th><th>Respuesta</th></tr></thead><tbody>${s.avisos.map(a => `<tr><td>${fechaMx(a.created_at)}</td><td><code>${esc(a.tipo)}</code></td><td>${ESTADO_AVISO[a.estado] || a.estado}<small>${a.intentos} ${a.intentos === 1 ? 'intento' : 'intentos'}</small></td><td>${a.ultimo_status ? esc(a.ultimo_status) : ''}${a.ultimo_error ? `<small>${esc(a.ultimo_error)}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
  </div>`;
}

const SCRIPT_INTEGRACION = `
const api = async (m, u, b) => { const r = await fetch(u, { method: m, headers: { 'content-type': 'application/json' }, body: JSON.stringify(b || {}) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'No se pudo'); return d; };
const msj = t => { const el = document.getElementById('aviso-msj'); if (el) el.textContent = t; };
document.getElementById('btn-llave')?.addEventListener('click', async e => {
  if (e.target.textContent.includes('Rotar') && !confirm('La llave actual dejará de funcionar en este momento. ¿Crear una nueva?')) return;
  e.target.disabled = true;
  try { const d = await api('POST', '/api/creadores/integracion/llave'); const el = document.getElementById('llave-nueva'); el.hidden = false; el.textContent = d.llave;
    document.getElementById('llave-estado').textContent = 'Cópiala ahora: es la única vez que la verás completa. Guárdala como secreto en tu servidor.'; e.target.textContent = 'Rotar llave'; }
  catch (x) { alert(x.message); } e.target.disabled = false;
});
document.getElementById('form-aviso')?.addEventListener('submit', async e => {
  e.preventDefault();
  try { const d = await api('PUT', '/api/creadores/integracion/aviso', { url: e.target.webhook_url.value.trim() }); document.getElementById('btn-prueba').disabled = !d.url; msj(d.url ? 'Guardada. Prueba que tu app la reciba con «Enviar prueba».' : 'Quitamos la URL: ya no te mandaremos avisos.'); }
  catch (x) { msj(x.message); }
});
document.getElementById('btn-prueba')?.addEventListener('click', async e => {
  e.target.disabled = true; msj('Enviando…');
  try { const d = await api('POST', '/api/creadores/integracion/prueba'); msj(d.ok ? 'Tu app respondió ' + d.status + '. ¡Funciona!' : 'No se pudo entregar: ' + (d.error || 'sin respuesta')); }
  catch (x) { msj(x.message); } e.target.disabled = false;
});
document.getElementById('btn-secreto')?.addEventListener('click', async e => {
  try { const d = await api('POST', '/api/creadores/integracion/secreto'); const el = document.getElementById('secreto'); el.hidden = false; el.textContent = d.secreto; }
  catch (x) { msj(x.message); }
});`;

// ---------- editor de producto ----------
const LISTAS = {
  incluye: ['Qué incluye', 'Cada archivo o parte del producto', [['titulo', 'Qué es'], ['texto', 'Detalle (opcional)']]],
  pasos: ['Pasos', 'El camino que sigue quien compra (opcional)', [['titulo', 'Paso'], ['texto', 'En qué consiste (opcional)', true]]],
  para_quien: ['Para quién es', 'Frases que empiezan con “Te sirve si…”', [['', 'Frase']]],
  faq: ['Preguntas frecuentes', 'Las de pago, entrega y reembolsos ya salen solas', [['p', 'Pregunta'], ['r', 'Respuesta', true]]],
};
function paginaEditor(env, c, p, { tipo: tipoNuevo = 'descarga' } = {}) {
  const nuevo = !p;
  p = p || { nombre: '', precio_centavos: 0, descripcion_corta: '', categoria: '', r2_keys: [], contenido: tipoNuevo === 'saas' ? { tipo: 'saas' } : {}, revision: 'borrador' };
  const co = p.contenido || {};
  const saas = co.tipo === 'saas';
  const pctSaas = comisionSuscripcion(c.comision_pct);
  const precios = co.suscripcion?.precios || {};
  const ps = v => v ? v / 100 : '';
  const [et, ecl] = nuevo ? ['', ''] : estadoProd(p, !!c.stripe_listo);
  const item = (tipo, x) => `<div class="c-item" data-item>${LISTAS[tipo][2].map(([k, l, largo]) => {
    const val = k ? (x?.[k] || '') : (typeof x === 'string' ? x : '');
    return `<div class="t-campo"><label>${l}</label>${largo ? `<textarea data-k="${k}" rows="2">${esc(val)}</textarea>` : `<input data-k="${k}" value="${esc(val)}" maxlength="400">`}</div>`;
  }).join('')}<button type="button" class="link c-quitar" data-quitar>Quitar</button></div>`;
  const lista = tipo => `<fieldset class="c-fs"><legend>${LISTAS[tipo][0]} <small>${LISTAS[tipo][1]}</small></legend>
    <div data-lista="${tipo}">${(co[tipo] || []).map(x => item(tipo, x)).join('')}</div>
    <button type="button" class="btn blanco chico" data-agregar="${tipo}">Agregar</button><template id="tpl-${tipo}">${item(tipo, null)}</template></fieldset>`;
  const titulo = nuevo ? (saas ? 'Nuevo SaaS / app por suscripción' : 'Nuevo producto') : esc(p.nombre);
  return pagina({ ...base, titulo: `${titulo} · Creadores Vorka México`, ruta: '/creadores/productos', head: CSS_EDITOR,
    cuerpo: `
<section class="t-sec"><div class="marco t-estrecho">
  <a class="t-volver" href="/creadores/panel">← Mi portal</a>
  <h1 class="t-h1">${titulo}</h1>
  ${nuevo ? '' : `<p class="t-nota"><span class="c-pill ${ecl}">${et}</span>${p.revision === 'rechazado' && p.nota_revision ? ` ${esc(p.nota_revision)}` : ''}${p.revision === 'aprobado' && c.stripe_listo ? ` · <a href="/tienda/${esc(p.slug)}/" target="_blank">Ver en la tienda</a>. Si guardas cambios, vuelve a revisión antes de publicarse de nuevo.` : ''}</p>`}
  <form class="t-form" id="editor" novalidate data-id="${esc(p.id || '')}" data-tipo="${saas ? 'saas' : 'descarga'}">
    ${nuevo ? `<fieldset class="c-fs c-tipo"><legend>Tipo de producto</legend>
      <label class="c-opcion"><input type="radio" name="tipo" value="descarga"${saas ? '' : ' checked'}><span><b>Descargable</b><small>Guías, plantillas, archivos. Pago único.</small></span></label>
      <label class="c-opcion"><input type="radio" name="tipo" value="saas"${saas ? ' checked' : ''}><span><b>Suscripción (SaaS / app)</b><small>Tu app en línea. Cobro mensual o anual.</small></span></label></fieldset>`
      : `<p class="t-nota">Tipo: <b>${saas ? 'Suscripción (SaaS / app)' : 'Descargable'}</b></p>`}
    <div class="t-campo"><label for="nombre">${saas ? 'Nombre de tu app' : 'Nombre del producto'}</label><input id="nombre" name="nombre" required maxlength="160" value="${esc(p.nombre)}"></div>
    <div class="t-campo" data-solo="descarga"><label for="precio">Precio (MXN)</label><input id="precio" name="precio" type="number" min="20" step="1" required value="${!saas && p.precio_centavos ? p.precio_centavos / 100 : ''}"><small class="t-ayuda">Mínimo $20. Recibes el precio − ${c.comision_pct} % − comisión de Stripe.</small></div>
    <fieldset class="c-fs" data-solo="saas"><legend>Suscripción <small>Pon el precio mensual, el anual o los dos (mínimo $20 cada uno)</small></legend>
      <div class="c-dos">
        <div class="t-campo"><label for="precio_mensual">Precio al mes (MXN)</label><input id="precio_mensual" name="precio_mensual" type="number" min="20" step="1" inputmode="numeric" value="${ps(precios.month)}"></div>
        <div class="t-campo"><label for="precio_anual">Precio al año (MXN)</label><input id="precio_anual" name="precio_anual" type="number" min="20" step="1" inputmode="numeric" value="${ps(precios.year)}"></div>
      </div>
      <p class="t-ayuda" id="calculo" data-pct="${pctSaas}">En cada cobro (el primero y cada renovación) recibes el precio − ${pctSaas} % de Vorka − la comisión de Stripe de ese cobro. En suscripciones la comisión de Vorka es de 20 % como mínimo.</p>
      <div class="t-campo"><label for="app_url">URL donde tu cliente entra a tu app</label><input id="app_url" name="app_url" type="url" inputmode="url" maxlength="300" placeholder="https://miapp.com/entrar" value="${esc(co.acceso?.url || '')}"><small class="t-ayuda">Va en el botón del correo de compra. Tu cliente entra con el mismo correo con el que pagó.</small></div>
      <div class="t-campo"><label for="soporte">Correo de soporte de tu app</label><input id="soporte" name="soporte" type="email" maxlength="254" placeholder="soporte@miapp.com" value="${esc(co.acceso?.soporte || '')}"><small class="t-ayuda">Tú das el soporte de la app; Vorka atiende cobros, tarjeta, facturas y cancelaciones.</small></div>
      ${nuevo ? '' : '<p class="t-ayuda">Si cambias el precio, aplica a las suscripciones nuevas; las que ya existen siguen con el precio con el que se contrataron.</p>'}
    </fieldset>
    <div class="t-campo"><label for="descripcion_corta">Descripción corta</label><textarea id="descripcion_corta" name="descripcion_corta" rows="2" maxlength="300">${esc(p.descripcion_corta)}</textarea></div>
    <div class="t-campo"><label for="categoria">Categoría (opcional)</label><input id="categoria" name="categoria" maxlength="40" value="${esc(p.categoria || '')}" placeholder="Guías, Plantillas, Kits…"></div>
    <div class="t-campo"><label for="titular">Titular de la página</label><input id="titular" name="titular" maxlength="400" value="${esc(co.titular || '')}"></div>
    <div class="t-campo"><label for="subtitulo">Subtítulo</label><textarea id="subtitulo" name="subtitulo" rows="2" maxlength="600">${esc(co.subtitulo || '')}</textarea></div>
    ${lista('incluye')}${lista('pasos')}${lista('para_quien')}${lista('faq')}
    ${nuevo ? '<p class="t-nota">Guarda el producto para poder subir sus archivos, su portada y sus capturas.</p>' : `
    ${saas ? '' : `<fieldset class="c-fs"><legend>Archivos que recibe quien compra <small>Hasta 100 MB cada uno</small></legend>
      <ul class="c-lista">${p.r2_keys.map(a => `<li><span><b>${esc(a.nombre)}</b><small>${esc(a.key.split('/').pop())}</small></span><button type="button" class="link c-quitar" data-quitar-archivo="${esc(a.key)}">Quitar</button></li>`).join('')}</ul>
      <label class="btn blanco chico">Subir archivos<input type="file" id="archivos" multiple hidden></label>
      <p class="t-ayuda" id="progreso" hidden></p></fieldset>`}
    <fieldset class="c-fs"><legend>Portada <small>Horizontal, JPG/PNG/WebP, menos de 8 MB (opcional)</small></legend>
      ${p.imagen ? `<img src="${esc(p.imagen)}" alt="" class="c-portada">` : ''}
      <label class="btn blanco chico">${p.imagen ? 'Cambiar portada' : 'Subir portada'}<input type="file" id="portada" accept="image/jpeg,image/png,image/webp" hidden></label></fieldset>
    ${saas ? `<fieldset class="c-fs"><legend>Capturas de tu app <small>Hasta ${MAX_CAPTURAS}, JPG/PNG/WebP, menos de 8 MB cada una (opcional)</small></legend>
      <div class="c-capturas">${(co.capturas || []).map(x => `<figure><img src="${esc(x.src)}" alt=""><button type="button" class="link c-quitar" data-quitar-captura="${esc(x.src)}">Quitar</button></figure>`).join('')}</div>
      ${(co.capturas || []).length < MAX_CAPTURAS ? '<label class="btn blanco chico">Subir captura<input type="file" id="captura" accept="image/jpeg,image/png,image/webp" hidden></label>' : ''}
      <p class="t-ayuda" id="progreso" hidden></p></fieldset>` : ''}`}
    <p class="t-error" id="error" role="alert" hidden></p>
    <div class="botones"><button class="btn blanco" type="submit" data-accion="guardar">Guardar borrador</button>${nuevo ? '' : '<button class="btn tinta" type="submit" data-accion="revision">Enviar a revisión</button>'}</div>
  </form>
</div></section>`,
    script: SCRIPT_EDITOR });
}

const MAX_CAPTURAS = 4;
const CSS_EDITOR = `<style>${CSS_CAMPOS}
.c-tipo{display:grid;gap:10px}.c-opcion{display:flex;gap:12px;align-items:flex-start;border:1px solid var(--line);border-radius:14px;padding:12px 14px;cursor:pointer}
.c-opcion:has(input:checked){border-color:var(--fg,#141114);box-shadow:0 0 0 1px var(--fg,#141114)}.c-opcion span{display:grid;gap:2px}.c-opcion small{color:var(--fg-2)}
.c-dos{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))}
.c-capturas{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-bottom:10px}.c-capturas figure{margin:0;display:grid;gap:4px}
.c-capturas img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;border:1px solid var(--line)}
#editor[data-tipo="saas"] [data-solo="descarga"],#editor[data-tipo="descarga"] [data-solo="saas"]{display:none}
</style>`;
const SCRIPT_EDITOR = `(function(){
  var f=document.getElementById('editor'), id=f.dataset.id, err=document.getElementById('error');
  function mal(m){ err.textContent=m; err.hidden=false; }
  f.querySelectorAll('input[name=tipo]').forEach(function(r){ r.addEventListener('change',function(){ if(r.checked){ f.dataset.tipo=r.value; history.replaceState(null,'',r.value==='saas'?'?tipo=saas':location.pathname); } }); });
  f.addEventListener('click',function(e){
    var ag=e.target.closest('[data-agregar]'); if(ag){ var t=document.getElementById('tpl-'+ag.dataset.agregar); f.querySelector('[data-lista="'+ag.dataset.agregar+'"]').appendChild(t.content.cloneNode(true)); return; }
    var q=e.target.closest('[data-quitar]'); if(q){ q.closest('[data-item]').remove(); return; }
    var qa=e.target.closest('[data-quitar-archivo]'); if(qa){ if(!confirm('¿Quitar este archivo?'))return; api('DELETE','/api/creadores/productos/'+id+'/archivos',{key:qa.dataset.quitarArchivo}).then(function(){location.reload();}).catch(function(x){mal(x.message);}); }
    var qc=e.target.closest('[data-quitar-captura]'); if(qc){ if(!confirm('¿Quitar esta captura?'))return; api('DELETE','/api/creadores/productos/'+id+'/capturas',{src:qc.dataset.quitarCaptura}).then(function(){location.reload();}).catch(function(x){mal(x.message);}); }
  });
  function lista(tipo){ return Array.prototype.map.call(f.querySelectorAll('[data-lista="'+tipo+'"] [data-item]'),function(it){ var o={}; it.querySelectorAll('[data-k]').forEach(function(x){o[x.dataset.k]=x.value.trim();}); return tipo==='para_quien'?o['']:o; }).filter(function(x){ return typeof x==='string'?x:Object.values(x)[0]; }); }
  function api(m,u,b){ return fetch(u,{method:m,headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).then(function(r){return r.json().then(function(j){ if(!r.ok) throw new Error(j.error||'No se pudo guardar'); return j; });}); }
  f.addEventListener('submit',function(e){
    e.preventDefault(); err.hidden=true;
    var accion=(e.submitter&&e.submitter.dataset.accion)||'guardar';
    var d={ tipo:f.dataset.tipo, nombre:f.nombre.value.trim(), precio:f.precio.value, descripcion_corta:f.descripcion_corta.value.trim(), categoria:f.categoria.value.trim(),
      contenido:{ titular:f.titular.value.trim(), subtitulo:f.subtitulo.value.trim(), incluye:lista('incluye'), pasos:lista('pasos'), para_quien:lista('para_quien'), faq:lista('faq') } };
    if(f.dataset.tipo==='saas') d.saas={ precio_mensual:f.precio_mensual.value, precio_anual:f.precio_anual.value, app_url:f.app_url.value.trim(), soporte:f.soporte.value.trim() };
    api(id?'PUT':'POST', '/api/creadores/productos'+(id?'/'+id:''), d)
      .then(function(p){ return accion==='revision' ? api('POST','/api/creadores/productos/'+p.id+'/revision') : p; })
      .then(function(p){ location.href='/creadores/productos/'+p.id; }).catch(function(x){ mal(x.message); });
  });
  function subir(u,file,cb){ var x=new XMLHttpRequest(); x.open('PUT',u); x.setRequestHeader('content-type',file.type||'application/octet-stream'); x.setRequestHeader('x-nombre',encodeURIComponent(file.name));
    var pr=document.getElementById('progreso'); x.upload.onprogress=function(e){ if(e.lengthComputable&&pr){ pr.hidden=false; pr.textContent='Subiendo '+file.name+' · '+Math.round(e.loaded/e.total*100)+' %'; } };
    x.onload=function(){ var j={}; try{j=JSON.parse(x.responseText);}catch(_){} x.status<300?cb():mal(j.error||'No se pudo subir'); }; x.onerror=function(){mal('Se cortó la conexión');}; x.send(file); }
  var fa=document.getElementById('archivos'); if(fa) fa.onchange=function(){ var fs=Array.prototype.slice.call(fa.files), i=0; (function sig(){ if(i>=fs.length) return location.reload(); subir('/api/creadores/productos/'+id+'/archivos',fs[i++],sig); })(); };
  var fp=document.getElementById('portada'); if(fp) fp.onchange=function(){ if(fp.files[0]) subir('/api/creadores/productos/'+id+'/portada',fp.files[0],function(){location.reload();}); };
  var fc=document.getElementById('captura'); if(fc) fc.onchange=function(){ if(fc.files[0]) subir('/api/creadores/productos/'+id+'/capturas',fc.files[0],function(){location.reload();}); };
})();`;

// ---------- API ----------
async function productoPropio(env, c, id) {
  const p = await admin.productoPorId(env, id);
  return p && p.creador_id === c.id ? p : null;
}

async function api(req, env, c, p, M) {
  if (c.estado !== 'aprobado') return fail('Tu cuenta está pausada.', 403);
  let m;
  if (p === '/api/creadores/stripe/sesion' && M === 'POST') {
    if (!c.stripe_account_id) {
      const cuenta = await crearCuenta(env, c);
      await run(env, 'UPDATE creadores SET stripe_account_id = ? WHERE id = ? AND stripe_account_id IS NULL', cuenta.id, c.id);
      c.stripe_account_id = (await one(env, 'SELECT stripe_account_id FROM creadores WHERE id = ?', c.id)).stripe_account_id;
    }
    return json({ client_secret: await sesionComponentes(env, c.stripe_account_id) });
  }
  if (p === '/api/creadores/stripe/panel' && M === 'POST') {
    if (!c.stripe_account_id) return fail('Primero configura tus pagos.');
    return json({ url: await enlacePanel(env, c.stripe_account_id) });
  }
  if (p === '/api/creadores/productos' && M === 'POST') return guardar(env, c, null, await req.json().catch(() => ({})));
  if ((m = p.match(/^\/api\/creadores\/productos\/([\w-]{1,80})$/)) && M === 'PUT') {
    const prod = await productoPropio(env, c, m[1]);
    return prod ? guardar(env, c, prod, await req.json().catch(() => ({}))) : fail('No encontrado.', 404);
  }
  if ((m = p.match(/^\/api\/creadores\/productos\/([\w-]{1,80})\/revision$/)) && M === 'POST') {
    const prod = await productoPropio(env, c, m[1]);
    if (!prod) return fail('No encontrado.', 404);
    if (esSaas(prod)) {
      if (!prod.contenido.acceso?.url || !prod.contenido.acceso?.soporte) return fail('Escribe la URL de tu app y tu correo de soporte antes de enviarlo a revisión.');
    } else if (!prod.r2_keys.length) return fail('Sube al menos un archivo antes de enviarlo a revisión.');
    await run(env, "UPDATE products SET revision = 'en_revision', nota_revision = NULL, updated_at = ? WHERE id = ?", ahoraISO(), prod.id);
    return json({ ...prod, revision: 'en_revision' });
  }
  if ((m = p.match(/^\/api\/creadores\/productos\/([\w-]{1,80})\/capturas$/))) {
    const prod = await productoPropio(env, c, m[1]);
    if (!prod || !esSaas(prod)) return fail('No encontrado.', 404);
    const capturas = prod.contenido.capturas || [];
    if (M === 'PUT') {
      const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[req.headers.get('content-type')];
      if (!ext) return fail('La captura debe ser JPG, PNG o WebP.');
      if (capturas.length >= MAX_CAPTURAS) return fail(`Hasta ${MAX_CAPTURAS} capturas.`);
      const cuerpo = await req.arrayBuffer();
      if (!cuerpo.byteLength || cuerpo.byteLength > 8 * 1048576) return fail('La captura debe pesar menos de 8 MB.');
      const key = `portadas/${prod.slug}-cap-${Date.now().toString(36)}.${ext}`;
      await env.PRODUCTOS.put(key, cuerpo, { httpMetadata: { contentType: req.headers.get('content-type'), cacheControl: 'public, max-age=31536000, immutable' } });
      await guardarContenido(env, prod.id, { ...prod.contenido, capturas: [...capturas, { src: `/tienda/img/${key}` }] });
      await aBorrador(env, prod);
      return json({ ok: true });
    }
    if (M === 'DELETE') {
      const { src } = await req.json().catch(() => ({}));
      await guardarContenido(env, prod.id, { ...prod.contenido, capturas: capturas.filter(x => x.src !== src) });
      return json({ ok: true });
    }
  }
  // Integración con la app del creador: llave de API, URL de avisos, secreto de firma y aviso de prueba
  if (p === '/api/creadores/integracion/llave' && M === 'POST') return json({ llave: await crearLlave(env, c.id) });
  if (p === '/api/creadores/integracion/aviso' && M === 'PUT') {
    const { url } = await req.json().catch(() => ({}));
    const limpia = String(url || '').trim() ? urlAvisoValida(url) : '';
    if (limpia === null) return fail('Escribe una URL https con dominio (no IP ni localhost) de tu app.');
    await run(env, 'UPDATE creadores SET webhook_url = ? WHERE id = ?', limpia || null, c.id);
    return json({ url: limpia || null });
  }
  if (p === '/api/creadores/integracion/secreto' && M === 'POST') return json({ secreto: await secretoFirma(env, c) });
  if (p === '/api/creadores/integracion/prueba' && M === 'POST') {
    if (!(await dentroDelLimite(env, `aviso-prueba:${c.id}`, 10, 600))) return fail('Espera unos minutos para otra prueba.', 429);
    return json(await enviarPrueba(env, c));
  }
  if ((m = p.match(/^\/api\/creadores\/productos\/([\w-]{1,80})\/(archivos|portada)$/))) {
    const prod = await productoPropio(env, c, m[1]);
    if (!prod) return fail('No encontrado.', 404);
    if (M === 'PUT') {
      if (!req.headers.get('x-nombre')) return fail('Solicitud inválida.', 400);
      const a = { nombre: decodeURIComponent(req.headers.get('x-nombre')), tipo: req.headers.get('content-type') || 'application/octet-stream', cuerpo: req.body, tamano: Number(req.headers.get('content-length') || 0) };
      const r = m[2] === 'archivos' ? await admin.subirArchivo(env, prod.id, a) : await admin.subirPortada(env, prod.id, a);
      await aBorrador(env, prod);
      return json(r);
    }
    if (M === 'DELETE' && m[2] === 'archivos') {
      const { key } = await req.json().catch(() => ({}));
      await aBorrador(env, prod); // primero sale de la venta: un producto publicado sin archivos no se permite
      return json(await admin.quitarArchivo(env, prod.id, String(key || '')));
    }
  }
  return fail('No encontrado.', 404);
}

// Cualquier cambio regresa el producto a borrador (y lo quita de la venta hasta que se apruebe otra vez)
const aBorrador = (env, prod) => run(env, "UPDATE products SET revision = 'borrador', activo = 0, updated_at = ? WHERE id = ?", ahoraISO(), prod.id);

const guardarContenido = (env, id, contenido) => run(env, 'UPDATE products SET contenido = ?, updated_at = ? WHERE id = ?', JSON.stringify(contenido), ahoraISO(), id);

// SaaS: precio al mes y/o al año (mínimo $20 cada uno), la URL de su app y su correo de soporte
const precioOpcional = z.preprocess(v => v === '' || v == null ? undefined : Number(v),
  z.number({ error: 'Escribe el precio con números.' }).min(20, 'El precio mínimo es $20 MXN.').max(100000, 'El precio máximo es $100,000 MXN.').optional());
const EsquemaSaas = z.object({
  precio_mensual: precioOpcional, precio_anual: precioOpcional,
  app_url: z.string().trim().max(300).refine(u => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.includes('.'); } catch { return false; } }, 'La URL de tu app debe empezar con https://'),
  soporte: z.string().trim().toLowerCase().pipe(z.email('Escribe tu correo de soporte.').max(254)),
}).refine(d => d.precio_mensual || d.precio_anual, { message: 'Pon el precio mensual, el anual o los dos.', path: ['precio_mensual'] });

async function guardar(env, c, prod, d) {
  // El tipo se elige al crear y no cambia (un SaaS ya vendido tiene suscripciones vivas)
  const saas = prod ? esSaas(prod) : d.tipo === 'saas';
  let s = null;
  if (saas) {
    const v = EsquemaSaas.safeParse(d.saas || {});
    if (!v.success) return fail(v.error.issues[0].message);
    s = v.data;
  } else if (Number(d.precio) < 20) return fail('El precio mínimo es $20 MXN.');
  const precios = s ? Object.fromEntries([['month', s.precio_mensual], ['year', s.precio_anual]].filter(([, v]) => v).map(([k, v]) => [k, Math.round(v * 100)])) : null;
  try {
    const p = await admin.guardarProducto(env, { ...d, precio: s ? (precios.month || precios.year) / 100 : d.precio, id: prod?.id, activo: false, orden: prod?.orden ?? 50, archivos: undefined });
    await run(env, "UPDATE products SET creador_id = ?, revision = 'borrador', activo = 0 WHERE id = ?", c.id, p.id);
    if (s) {
      // Lo que hace que se venda como suscripción: tipo, acceso (su app) y suscripcion (precios). Lo arma el servidor, nunca el navegador.
      const contenido = { ...p.contenido, tipo: 'saas',
        acceso: { app: appDeProducto(p.id), tipo: 'saas', url: s.app_url, soporte: s.soporte, creador: c.nombre, boton: `Entrar a ${p.nombre}`.slice(0, 60),
          detalle: precios.month ? 'Suscripción mensual · cancela cuando quieras' : 'Suscripción anual · cancela cuando quieras' },
        suscripcion: { intervalo: precios.month ? 'month' : 'year', precios } };
      await guardarContenido(env, p.id, contenido);
      return json({ ...p, contenido, creador_id: c.id, revision: 'borrador' });
    }
    return json({ ...p, creador_id: c.id, revision: 'borrador' });
  } catch (e) { return fail(e.message); }
}

// ---------- router ----------
export async function rutasCreadores(req, env, ctx, url) {
  const p = url.pathname.replace(/\/$/, '') || '/';
  const M = req.method;
  if (!p.startsWith('/creadores') && !p.startsWith('/api/creadores')) return null;
  if (env.MARKETPLACE !== '1') return null; // apagado hasta abrir el marketplace
  if (p === '/creadores/connect.mjs') return new Response(CONNECT_JS, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
  if (p === '/creadores' && M === 'GET') return paginaSolicitud();
  if (p === '/creadores/solicitud' && M === 'POST') return postSolicitud(req, env, ctx);
  if (p === '/creadores/entrar') return M === 'POST' ? postEntrar(req, env, ctx) : paginaEntrar();
  // Documentación pública de la API y de los avisos, y la API para las apps de los creadores (con su llave, sin cookies)
  if (p === '/creadores/docs' && M === 'GET') return paginaDocs(env);
  if (p.startsWith('/api/creadores/v1/')) {
    try { return await apiV1(req, env, url); }
    catch (e) { console.error('creadores api v1', p, e.message); return fail('Algo falló. Intenta de nuevo.', 500); }
  }
  let m;
  if ((m = p.match(/^\/creadores\/acceso\/([a-f0-9]{64})$/)) && M === 'GET') {
    const cookie = await canjearEnlace(env, m[1]);
    if (!cookie) return pagina({ ...base, titulo: 'Enlace vencido · Vorka México', ruta: '/creadores', status: 410,
      cuerpo: aviso({ clase: 'alerta', titulo: 'Este enlace ya no funciona', texto: 'Los enlaces duran 30 minutos y sirven una sola vez.', extra: `<div class="botones t-centro"><a class="btn tinta" href="/creadores/entrar">Pedir otro enlace ${FLECHA}</a></div>` }) });
    return new Response(null, { status: 303, headers: { location: '/creadores/panel', 'set-cookie': cookie } });
  }
  if (p === '/creadores/salir' && M === 'POST') return new Response(null, { status: 303, headers: { location: '/creadores/entrar', 'set-cookie': await cerrarSesion(req, env) } });

  const c = await creadorActual(req, env);
  if (!c) return p.startsWith('/api/') ? fail('Inicia sesión.', 401) : new Response(null, { status: 303, headers: { location: '/creadores/entrar' } });
  if (p.startsWith('/api/')) {
    if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
    try { return await api(req, env, c, p, M); }
    catch (e) { console.error('creadores api', p, e.message); return fail('Algo falló. Intenta de nuevo.', 500); }
  }
  if (p === '/creadores/panel' && M === 'GET') {
    if (c.stripe_account_id && !c.stripe_listo) c.stripe_listo = await refrescarCreador(env, c).catch(() => false);
    return paginaPanel(env, c);
  }
  if ((m = p.match(/^\/creadores\/productos\/([\w-]{1,80})$/)) && M === 'GET') {
    if (m[1] === 'nuevo') return c.estado === 'aprobado' ? paginaEditor(env, c, null, { tipo: url.searchParams.get('tipo') === 'saas' ? 'saas' : 'descarga' }) : Response.redirect(new URL('/creadores/panel', env.SITE_URL), 303);
    const prod = await productoPropio(env, c, m[1]);
    if (!prod) return new Response(null, { status: 303, headers: { location: '/creadores/panel' } });
    prod.contenido.faq = (prod.contenido.faq || []).map(f => ({ p: f.p, r: admin.faqComoTexto(f.r) }));
    return paginaEditor(env, c, prod);
  }
  return null;
}
