// Apps de Vorka OS que se venden aquí con una liga que da os: Ruta de Impacto (RUTA → entrypoint Ruta, ver src/ruta.js y
// vorka-os/src/ruta/tienda.js) y la Evaluación de liderazgo (LIDERAZGO → entrypoint Liderazgo, ver src/liderazgo.js y
// vorka-os/src/liderazgo/index.js). Las dos responden la misma forma, así que comparten este camino (APPS_OS). Separado de la ficha para que entrega.js, regalos.js y el webhook no
// carguen las páginas de la tienda.
//   darAcceso({ correo, nombre, orden, curso, dias }) → { enlace, hasta } para el correo de compra (un solo uso, 7 días)
//   crearRegalo({ orden, curso, de_nombre, mensaje }) → { liga } por cada unidad regalada (ruta.vorka.mx/regalo/…)
//   revocar({ orden, curso }) en reembolso o contracargo · estado({ orden }) para la ficha de la orden en el panel
// Todo es idempotente por (orden, curso) en os: si el webhook se repite o se reenvía el correo, no se duplica nada y la liga
// del regalo es la misma. Si os no responde, la orden NO se pierde: queda marcada para revisar (orders.revisar, sale en el
// panel), se registra un ALERTA y el error sube para que el webhook responda 500 y Stripe reintente.
import { all, one, run, correoOculto } from './util.js';

const contenidoDe = i => { try { return typeof i.contenido === 'string' ? JSON.parse(i.contenido || '{}') : i.contenido || {}; } catch { return {}; } };
// binding: el service binding; nombre: el prefijo de la nota en orders.revisar (para quitarla sola cuando el reintento sale bien)
export const APPS_OS = {
  ruta: { binding: 'RUTA', nombre: 'Ruta de Impacto', host: 'ruta.vorka.mx' },
  liderazgo: { binding: 'LIDERAZGO', nombre: 'Evaluación de liderazgo', host: 'liderazgo.vorka.mx' },
};
export const appOsDe = i => (contenidoDe(i).acceso?.app in APPS_OS ? contenidoDe(i).acceso.app : null);
export const esItemRuta = i => !!appOsDe(i);   // cualquier app de os con liga (el nombre se queda por Ruta, la primera)
const cursoDe = i => contenidoDe(i).acceso?.curso || 'jovenes';
const diasDe = i => contenidoDe(i).acceso?.dias || 365;

// La orden que se manda a os por cada unidad: la primera es el id de la orden; en una compra de varios regalos, las demás
// llevan :2, :3… (os acepta [\w:.-]{3,120} y es idempotente por orden y curso).
export const clavesRuta = (orderId, cantidad = 1) => Array.from({ length: Math.max(1, cantidad) }, (_, k) => (k ? `${orderId}:${k + 1}` : orderId));

async function llamar(env, orderId, que, f, app = 'ruta') {
  const A = APPS_OS[app];
  try {
    if (!env[A.binding]) throw new Error(`falta el service binding ${A.binding}`);
    const r = await f(env[A.binding]);
    await run(env, 'UPDATE orders SET revisar = NULL WHERE id = ? AND revisar LIKE ?', orderId, `${A.nombre}:%`);
    return r;
  } catch (e) {
    const msg = String(e?.message || e).slice(0, 200);
    console.error(`ALERTA ${app}: os no respondió`, que, orderId, msg);
    await run(env, 'UPDATE orders SET revisar = ? WHERE id = ?', `${A.nombre}: no se pudo ${que} en ${A.host} (${msg}). La tienda lo reintenta sola con el webhook; si sigue, usa Reenviar en esta orden.`, orderId).catch(() => {});
    throw new Error(`${A.nombre}: ${que} falló (${msg})`);
  }
}

// Compra para uno mismo (o regalo ya canjeado / cortesía directa): acceso por un año con el correo de la orden
export async function accesoRuta(env, orden, items) {
  const it = items.find(esItemRuta);
  if (!it) return null;
  const app = appOsDe(it);
  const r = await llamar(env, orden.id, 'dar el acceso', R => R.darAcceso({ correo: orden.email, nombre: orden.nombre, orden: orden.id, curso: cursoDe(it), dias: diasDe(it) }), app);
  if (!/^https:\/\/[a-z0-9.-]+\.vorka\.mx\//.test(r?.enlace || '')) throw new Error(`${APPS_OS[app].nombre}: os no devolvió el enlace de entrada`);
  console.log(`${app}: acceso dado`, orden.id, correoOculto(orden.email));
  return { enlace: r.enlace, hasta: r.hasta || null, app };
}

// Compra para regalar: una liga de ruta.vorka.mx por unidad. Pedirla otra vez (reenvío) devuelve la misma.
export async function ligasRegaloRuta(env, orden, items) {
  const ligas = [];
  for (const it of items.filter(esItemRuta)) {
    for (const clave of clavesRuta(orden.id, it.cantidad || 1)) {
      const app = appOsDe(it);
      const r = await llamar(env, orden.id, 'crear la liga de regalo', R => R.crearRegalo({ orden: clave, curso: cursoDe(it), dias: diasDe(it), de_nombre: orden.nombre || null, mensaje: orden.regalo_mensaje || null }), app);
      if (!/^https:\/\/[a-z0-9.-]+\.vorka\.mx\//.test(r?.liga || '')) throw new Error(`${APPS_OS[app].nombre}: os no devolvió la liga del regalo`);
      ligas.push({ token: r.liga, url: r.liga, producto: it.nombre, ruta: true, app, abierto: !!r.abierto });
    }
  }
  return ligas;
}

// Reembolso, contracargo o cortesía quitada: se apaga en os el acceso (o la liga de regalo) de cada unidad de la orden
export async function revocarRuta(env, orderId) {
  const o = await one(env, 'SELECT id, regalo FROM orders WHERE id = ?', String(orderId));
  if (!o) return 0;
  const items = (await all(env, 'SELECT i.cantidad, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', o.id)).filter(esItemRuta);
  let revocados = 0;
  for (const it of items)
    for (const clave of clavesRuta(o.id, o.regalo ? it.cantidad || 1 : 1))
      revocados += (await llamar(env, o.id, 'quitar el acceso', R => R.revocar({ orden: clave, curso: cursoDe(it) }), appOsDe(it)))?.revocados || 0;
  return revocados;
}

// Para la ficha de la orden en el panel: qué dio en Ruta de Impacto y si el regalo ya se abrió (null si no aplica u os no responde)
export async function estadoRuta(env, o, items) {
  const its = items.filter(esItemRuta);
  const app = its.length ? appOsDe(its[0]) : null, B = app && env[APPS_OS[app].binding];
  if (!B) return null;
  try {
    const n = o.regalo ? its.reduce((s, i) => s + (i.cantidad || 1), 0) : 1;
    return (await Promise.all(clavesRuta(o.id, n).map(orden => B.estado({ orden })))).flat();
  } catch (e) { console.error(`${app} estado`, o.id, e?.message); return null; }
}

