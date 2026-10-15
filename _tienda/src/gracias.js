// /tienda/gracias?order=<uuid> · estado de la orden; se actualiza solo cada 5 s durante 2 minutos.
// GET /api/ordenes/<uuid> · estado mínimo para ese sondeo (sin datos personales).
import { one, json, fail, correoOculto } from './util.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA, CHECK } from './marco.generado.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ESPERA_EFECTIVO = ['oxxo', 'customer_balance'];

async function leer(env, id) {
  if (!UUID.test(id || '')) return null;
  return one(env, `SELECT o.id, o.estado, o.metodo_pago, o.email, o.correo_enviado_at,
      (SELECT p.slug FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = o.id ORDER BY i.id LIMIT 1) slug
    FROM orders o WHERE o.id = ?`, id);
}

// Qué ve el comprador en cada caso. 'cancelado' = volvió de Stripe sin pagar.
export function vista(o, { cancelado = false } = {}) {
  if (o.estado === 'paid') return 'pagado';
  if (o.estado === 'refunded') return 'reembolsado';
  if (o.estado === 'failed') return 'rechazado';
  if (ESPERA_EFECTIVO.includes(o.metodo_pago)) return 'pendiente_efectivo';
  if (cancelado) return 'rechazado';
  return 'confirmando';
}

export async function apiOrden(env, id) {
  const o = await leer(env, id);
  if (!o) return fail('No encontrada', 404);
  return json({ estado: o.estado, vista: vista(o) });
}

const ICONOS = {
  ok: CHECK,
  reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>',
  carga: '<span class="t-girando" aria-hidden="true"></span>',
};

function bloques(o, v) {
  const reintentar = `<div class="botones t-centro"><a class="btn tinta" href="/tienda/${esc(o.slug || '')}#comprar">Intentar de nuevo ${FLECHA}</a><a class="btn blanco" href="/tienda/">Volver a la tienda</a></div>`;
  return {
    pagado: { clase: 'exito', icono: ICONOS.ok, titulo: '¡Listo! Revisa tu correo',
      texto: `Enviamos tus archivos a <b>${esc(correoOculto(o.email))}</b>. Si no lo ves en unos minutos, revisa la carpeta de spam o promociones.`,
      extra: '<p class="t-nota">¿No te llegó? <a href="/descargas/reenviar">Pide que te lo reenviemos</a>.</p>' },
    pendiente_efectivo: { clase: 'espera', icono: ICONOS.reloj, titulo: 'Tu pedido está apartado',
      texto: 'Tu pago se confirma al realizarlo; te llegará el correo automáticamente. Si pagas en OXXO, tienes 3 días con la referencia que te dio Stripe. Si es por SPEI, usa la CLABE que te mostró.' },
    confirmando: { clase: 'espera', icono: ICONOS.carga, titulo: 'Estamos confirmando tu pago',
      texto: 'Esto suele tardar unos segundos. No cierres esta página.' },
    rechazado: { clase: 'alerta', icono: ICONOS.x, titulo: 'No se completó el pago',
      texto: 'No se hizo ningún cargo. Puedes intentarlo otra vez con otra tarjeta, en OXXO o por SPEI.', extra: reintentar },
    reembolsado: { clase: 'alerta', icono: ICONOS.x, titulo: 'Esta compra fue reembolsada',
      texto: 'Si tienes dudas, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.' },
  }[v];
}

// Sondeo: cada 5 s, máximo 2 min, solo mientras no haya un estado final. Respeta pestañas ocultas.
const SONDEO = `(function(){
  var caja=document.getElementById('estado'); if(!caja) return;
  var id=caja.getAttribute('data-order'), v=caja.getAttribute('data-vista'), fin=Date.now()+120000;
  if(v!=='confirmando'&&v!=='pendiente_efectivo') return;
  function paso(){
    if(Date.now()>fin){ var n=document.getElementById('estado-nota'); if(n) n.hidden=false; return; }
    if(document.hidden){ setTimeout(paso,5000); return; }
    fetch('/api/ordenes/'+id,{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
      if(d.vista&&d.vista!==v){ location.reload(); return; }
      setTimeout(paso,5000);
    }).catch(function(){ setTimeout(paso,5000); });
  }
  setTimeout(paso,5000);
})();`;

export async function paginaGracias(env, url) {
  const o = await leer(env, url.searchParams.get('order'));
  if (!o) return pagina({
    titulo: 'Orden no encontrada · Vorka México', ruta: '/tienda/gracias', noindex: true, status: 404,
    cuerpo: aviso({ icono: ICONOS.x, clase: 'alerta', titulo: 'No encontramos esa orden', texto: 'Revisa el enlace o escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.',
      extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/">Ir a la tienda ${FLECHA}</a></div>` }),
  });
  const v = vista(o, { cancelado: url.searchParams.get('cancelado') === '1' });
  const b = bloques(o, v);
  const nota = `<p class="t-nota" id="estado-nota" hidden>Seguimos esperando la confirmación. No te preocupes: en cuanto llegue te mandamos el correo automáticamente.</p>`;
  return pagina({
    titulo: `${b.titulo} · Vorka México`, ruta: '/tienda/gracias', noindex: true,
    cuerpo: `<div id="estado" data-order="${esc(o.id)}" data-vista="${v}" role="status" aria-live="polite">${aviso({ ...b, extra: (b.extra || '') + nota })}</div>`,
    script: SONDEO,
  });
}
