// POST /api/checkout · crea la orden (pending) y manda al comprador a pagar a la pasarela.
// Acepta JSON (fetch desde la página del producto → { url }) o formulario normal (→ 303 a la pasarela),
// para que la compra funcione aunque el JavaScript no cargue.
import { z } from 'zod';
import { json, fail, sha256, correoOculto } from './util.js';
import { crearOrden, aplicarPago, guardarSesion, registrarAnalitica, dentroDelLimite } from './modelo.js';
import { proveedor } from './pagos/index.js';

const casilla = z.preprocess(v => v === true || v === 'on' || v === 'true' || v === '1', z.literal(true, { error: 'Debes aceptar los términos y el aviso de privacidad.' }));
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,80}$/);

export const EsquemaCheckout = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.email('Escribe un correo válido.').max(254),
  terminos: casilla,
  // Un producto (formulario de la página de venta) o varios (carrito, más adelante)
  slug: slug.optional(),
  items: z.array(z.object({ slug, cantidad: z.number().int().min(1).max(10).default(1) })).min(1).max(20).optional(),
  ref: z.string().trim().regex(/^[A-Za-z0-9_-]{1,40}$/).optional().or(z.literal('')),
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

  const ip = req.headers.get('cf-connecting-ip') || 'local';
  for (const [tipo, max] of LIMITES) {
    const valor = tipo === 'ip' ? ip : d.email.toLowerCase();
    if (!(await dentroDelLimite(env, `checkout:${tipo}:${await sha256(valor)}`, max, VENTANA)))
      return error('Demasiados intentos. Espera unos minutos y vuelve a intentarlo.', 429);
  }

  let orden;
  try {
    orden = await crearOrden(env, {
      items: d.items || [{ slug: d.slug }],
      email: d.email, nombre: d.nombre,
      ref: d.ref || cookie(req, 'vorka_ref'),
    });
  } catch (e) {
    if (e.message === 'producto') return error('Este producto no está disponible.', 404);
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
    await aplicarPago(env, orden.id, { resultado: 'rechazado' }); // la orden huérfana no queda colgada en pending
    return error('No pudimos abrir el pago. Intenta de nuevo en un momento.', 502);
  }
  await guardarSesion(env, orden.id, cobro.sessionId);
  for (const it of orden.items) await registrarAnalitica(env, 'begin_checkout', { product_id: it.product_id, order_id: orden.id, ref_code: orden.ref_code });

  return esJson ? json({ url: cobro.url, order: orden.id }) : Response.redirect(cobro.url, 303);
}
