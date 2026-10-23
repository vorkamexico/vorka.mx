// POST /api/checkout · crea la orden (pending) y manda al comprador a pagar a la pasarela.
// Acepta JSON (fetch desde la página del producto → { url }) o formulario normal (→ 303 a la pasarela),
// para que la compra funcione aunque el JavaScript no cargue.
import { z } from 'zod';
import { json, fail, sha256, correoOculto } from './util.js';
import { crearOrden, aplicarPago, guardarSesion, registrarAnalitica, dentroDelLimite } from './modelo.js';
import { proveedor } from './pagos/index.js';
import { puedeComprarIntento } from './simulador/index.js';
import { productoPorSlug, afiliadoActivo } from './modelo.js';
import { cuentaActual, saldoDe } from './puntos.js';
import { suscripcionDe, itemsSuscripcion, vigente } from './suscripciones.js';

const casilla = z.preprocess(v => v === true || v === 'on' || v === 'true' || v === '1', z.literal(true, { error: 'Debes aceptar los términos y el aviso de privacidad.' }));
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,80}$/);

export const EsquemaCheckout = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido.').max(254)),
  terminos: casilla,
  // Un producto (formulario de la página de venta) o varios (carrito, más adelante)
  slug: slug.optional(),
  items: z.array(z.object({ slug, cantidad: z.number().int().min(1).max(10).default(1) })).min(1).max(20).optional(),
  ref: z.string().trim().regex(/^[A-Za-z0-9_-]{1,40}$/).optional().or(z.literal('')),
  // Código de quien te recomendó escrito en el formulario (gana sobre la liga); si no existe o está inactivo se ignora
  codigo: z.string().trim().max(40).optional().or(z.literal('')),
  // Comprar para regalar (solo productos con contenido.regalable): una liga de un solo uso por unidad
  para_quien: z.enum(['yo', 'regalo']).optional(),   // formulario sin JavaScript
  regalo: z.preprocess(v => v === true || v === 'on' || v === 'true' || v === '1', z.boolean()).optional(),
  cantidad: z.coerce.number().int().min(1, 'Elige cuántos regalos.').max(10, 'Puedes regalar hasta 10 por compra.').optional(),
  regalo_para: z.string().trim().max(80).optional().or(z.literal('')),
  regalo_mensaje: z.string().trim().max(280, 'El mensaje puede tener hasta 280 caracteres.').optional().or(z.literal('')),
  // Canjear puntos Vorka (requiere la sesión de la cuenta de puntos y comprar con su mismo correo)
  usar_puntos: z.preprocess(v => v === true || v === 'on' || v === 'true' || v === '1', z.boolean()).optional(),
  // Suscripciones (Vuelve): sucursales adicionales a la incluida en el plan
  sucursales: z.coerce.number().int().min(0).max(20, 'Hasta 20 sucursales adicionales; para más, escríbenos.').optional(),
}).refine(d => d.slug || d.items, { message: 'Falta el producto.', path: ['slug'] });

// Límites: por IP 10 intentos / 10 min, por correo 5 / 10 min
const LIMITES = [['ip', 10], ['email', 5]];
const VENTANA = 600;

export const cookie = (req, nombre) =>
  (req.headers.get('cookie') || '').split(';').map(s => s.trim().split('=')).find(([k]) => k === nombre)?.[1];

async function leerCuerpo(req) {
  const tipo = req.headers.get('content-type') || '';
  if (tipo.includes('application/json')) return { datos: await req.json().catch(() => ({})), esJson: true };
  const f = await req.formData();
  return { datos: Object.fromEntries(f), esJson: false };
}

export async function checkout(req, env) {
  const { datos, esJson } = await leerCuerpo(req);
  const volver = d => `/tienda/${encodeURIComponent(d?.slug || '')}`;
  const error = (msg, status = 400) => esJson ? fail(msg, status) : Response.redirect(new URL(`${volver(datos)}?error=${encodeURIComponent(msg)}#comprar`, env.SITE_URL).toString(), 303);

  const v = EsquemaCheckout.safeParse(datos);
  if (!v.success) return error(v.error.issues[0].message);
  const d = v.data;
  if (d.para_quien === 'regalo') d.regalo = true;

  const ip = req.headers.get('cf-connecting-ip') || 'local';
  for (const [tipo, max] of LIMITES) {
    const valor = tipo === 'ip' ? ip : d.email.toLowerCase();
    if (!(await dentroDelLimite(env, `checkout:${tipo}:${await sha256(valor)}`, max, VENTANA)))
      return error('Demasiados intentos. Espera unos minutos y vuelve a intentarlo.', 429);
  }

  // Varias unidades del mismo producto solo tienen sentido al regalar (o en el carrito con items)
  let items = d.items || [{ slug: d.slug, cantidad: d.regalo ? (d.cantidad || 1) : 1 }];
  // Suscripción: un solo plan por compra (+ sucursales adicionales del mismo intervalo); sin regalos ni puntos
  const subs = [];
  for (const it of items) { const p = await productoPorSlug(env, it.slug); if (suscripcionDe(p)) subs.push(p); }
  if (subs.length) {
    const plan = subs[0];
    if (items.length > 1 || plan.contenido.complemento) return error('Elige un solo plan; las sucursales adicionales se agregan junto con él.');
    if (d.regalo) return error('Las suscripciones no se pueden regalar.');
    if (d.usar_puntos) return error('Los puntos no se pueden usar en suscripciones.');
    if (await vigente(env, d.email, plan.contenido.acceso?.app))
      return error('Ya tienes una suscripción activa con este correo. Adminístrala desde la app, en Cuenta.', 409);
    try { items = await itemsSuscripcion(env, plan, d.sucursales || 0); }
    catch { return error('Las sucursales adicionales no están disponibles por ahora.'); }
  }
  for (const it of items) {
    const p = await productoPorSlug(env, it.slug);
    // Los simulacros adicionales del Simulador PAA solo los compra quien ya tiene el simulador
    if (['intento', 'examen'].includes(p?.contenido?.acceso?.tipo) && !(await puedeComprarIntento(env, d.email)))
      return error('Para comprar simulacros adicionales primero necesitas el Simulador PAA, con el mismo correo de tu compra.', 403);
    if (d.regalo && p && !p.contenido?.regalable) return error('Este producto no se puede regalar.');
  }

  // Puntos: descuento hasta el saldo disponible, dejando siempre el cobro mínimo de la pasarela (se calcula en crearOrden)
  let puntos = null;
  if (d.usar_puntos) {
    const cta = await cuentaActual(req, env);
    if (!cta) return error('Entra a tu cuenta de puntos para usarlos (vorka.mx/tienda/puntos).', 401);
    if (cta.email !== d.email) return error(`Para usar tus puntos, compra con el correo de tu cuenta (${cta.email}).`);
    for (const it of items) { const p = await productoPorSlug(env, it.slug); if (p?.creador_id) return error('Los puntos se canjean en productos de Vorka México, no en los de creadores.'); }
    puntos = { email: cta.email, disponibles: (await saldoDe(env, cta.email)).disponibles };
  }
  // Quién recomendó: el código escrito gana sobre la liga (?ref= en el formulario o la cookie de 30 días)
  const codigoEscrito = /^[A-Za-z0-9_-]{1,40}$/.test(d.codigo || '') && (await afiliadoActivo(env, d.codigo)) ? d.codigo : null;

  let orden;
  try {
    orden = await crearOrden(env, { puntos,
      items,
      email: d.email, nombre: d.nombre,
      regalo: d.regalo ? { para: d.regalo_para || null, mensaje: d.regalo_mensaje || null } : null,
      ref: codigoEscrito || d.ref || cookie(req, 'vorka_ref'),
    });
  } catch (e) {
    if (e.message === 'producto') return error('Este producto no está disponible.', 404);
    if (e.message === 'puntos') return error('Tus puntos cambiaron mientras comprabas (¿tienes otra compra abierta?). Revisa tu saldo e intenta de nuevo.', 409);
    throw e;
  }

  const pasarela = proveedor(orden.proveedor);
  const gracias = new URL('/tienda/gracias', env.SITE_URL);
  gracias.searchParams.set('order', orden.id);
  const cancelar = new URL(gracias); cancelar.searchParams.set('cancelado', '1');
  let cobro;
  try {
    cobro = await pasarela.crearCobro(env, orden, { exito: gracias.toString(), cancelar: cancelar.toString() });
  } catch (e) {
    console.error('checkout: pasarela', orden.id, correoOculto(orden.email), e.message);
    await aplicarPago(env, orden.id, { resultado: 'rechazado' }); // la orden huérfana no queda colgada en pending (y suelta los puntos)
    // El cupón del descuento no se pudo crear (p. ej. la llave de Stripe sin permiso de Coupons): mensaje claro y alerta
    if (e.cupon) {
      console.error('ALERTA checkout: Stripe no dejó crear el cupón de descuento', e.status, e.message, 'revisa el permiso Coupons (Write) de la llave restringida');
      const sinPuntos = orden.puntos_usados > 0;
      const msg = sinPuntos
        ? 'No pudimos aplicar tus puntos en este momento. Puedes pagar sin puntos (quita la casilla "Usar mis puntos") o intentar más tarde: tus puntos siguen en tu cuenta.'
        : 'No pudimos aplicar el descuento de tu código en este momento. Puedes comprar sin el código o intentar más tarde.';
      return esJson ? json({ error: msg, sin_puntos: sinPuntos, sin_descuento: !sinPuntos }, 503) : error(msg, 503);
    }
    return error('No pudimos abrir el pago. Intenta de nuevo en un momento.', 502);
  }
  await guardarSesion(env, orden.id, cobro.sessionId);
  for (const it of orden.items) await registrarAnalitica(env, 'begin_checkout', { product_id: it.product_id, order_id: orden.id, ref_code: orden.ref_code });

  return esJson ? json({ url: cobro.url, order: orden.id }) : Response.redirect(cobro.url, 303);
}
