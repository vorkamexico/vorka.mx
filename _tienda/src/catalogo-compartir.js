// Catálogo para compartir (vorka.mx/tienda/catalogo/?ref=CÓDIGO): una página ligera con las portadas, el precio «desde» de cada
// producto y, si llega con código, quién lo recomienda y el descuento de su primera compra. Al pegar la liga en WhatsApp sale
// la portada del catálogo (JPG, que WhatsApp sí muestra). mensajeCatalogo arma el texto listo para grupos de venta.
// Solo productos de Vorka a la venta (sin los de creadores, que no llevan el descuento por recomendación).
import { all, one } from './util.js';
import { esc, pagina } from './paginas.js';
import { seccionesCatalogo } from './lineas.js';
import { PCT_REFERIDO } from './descuentos.js';
import { nombrePublico } from './puntos-reglas.js';

const SITIO = 'https://vorka.mx';
export const PORTADA_CATALOGO = `${SITIO}/assets/tienda/og/catalogo.jpg`;
const pesos = c => `$${Math.round(c / 100).toLocaleString('es-MX')}`;
const PLANES = ['plan', 'pro', 'paquete', 'suscripcion'];

// Un renglón por producto «de cara al cliente» (los planes de una misma app se juntan con su precio más bajo)
export async function itemsCatalogo(env) {
  const filas = (await all(env, 'SELECT id, slug, nombre, descripcion_corta, precio_centavos, imagen, categoria, contenido, orden FROM products WHERE activo = 1 AND creador_id IS NULL ORDER BY orden, nombre'))
    .map(p => ({ ...p, contenido: JSON.parse(p.contenido || '{}') }));
  const destino = p => p.contenido?.acceso?.ruta || `/tienda/${p.slug}/`;
  const visibles = filas.filter(p => !p.contenido?.oculto && p.precio_centavos > 0);
  const m = new Map();
  for (const p of visibles) {
    const r = destino(p), mensual = p.contenido?.acceso?.tipo === 'suscripcion' || /-mensual$/.test(p.slug);
    const x = m.get(r) || { ruta: r, nombre: nombreCorto(p), texto: p.descripcion_corta || '', imagen: p.imagen, categoria: p.categoria, contenido: p.contenido, desde: Infinity, varios: 0, mensual };
    x.desde = Math.min(x.desde, p.precio_centavos); x.varios++; x.mensual = x.mensual && mensual;
    m.set(r, x);
  }
  // planes ocultos de la misma app (p. ej. Brindi Íntimo) también cuentan para el «desde»
  for (const p of filas.filter(p => p.contenido?.oculto && p.precio_centavos > 0 && PLANES.includes(p.contenido?.acceso?.tipo))) {
    const x = m.get(destino(p)); if (x) { x.desde = Math.min(x.desde, p.precio_centavos); x.varios++; }
  }
  // con varias versiones (Práctica, Examen, Completo…) se nombra la línea: «Simulador UNAM», no la primera versión
  for (const x of m.values()) { if (x.varios > 1) x.nombre = x.nombre.split(' · ')[0]; }
  return seccionesCatalogo([...m.values()]).map(s => ({ id: s.id, linea: s.linea, titulo: s.titulo, items: s.productos.map(({ contenido, ...x }) => x) }));
}
// «Simulador PAA · Práctica» → «Simulador PAA»; «Brindi · Plan Celebración» → «Brindi»
const nombreCorto = p => {
  const app = p.contenido?.acceso?.app;
  if (/^simulador-/.test(app || '') || ['brindi', 'cupo', 'vuelve', 'vende', 'agenda', 'cuentas', 'clara'].includes(app)) return String(p.nombre).split(' · ')[0].replace(/ Pro$/, ' Pro');
  return String(p.nombre).replace(/ · Reporte completo$/, '').replace(/ · plan mensual$/, '').split(': ')[0];
};
const precioTxt = x => `${x.varios > 1 ? 'desde ' : ''}${pesos(x.desde)}${x.mensual ? ' al mes' : ''}`;
const EMOJI = { examenes: '📚', negocios: '💼', eventos: '🎉', finanzas: '💳', toolkit: '🧰' };

export const ligaCatalogo = code => `${SITIO}/tienda/catalogo/${code ? `?ref=${encodeURIComponent(code)}` : ''}`;

// Texto para WhatsApp (grupos de venta): breve, con precios reales, el código y la liga (la vista previa trae la portada)
export function mensajeCatalogo(secciones, { code, nombre } = {}) {
  const lineas = ['✨ *Catálogo Vorka México* ✨', 'Productos digitales con entrega inmediata, se pagan con tarjeta, OXXO o transferencia.', ''];
  for (const s of secciones) {
    lineas.push(`${EMOJI[s.id] || '•'} *${s.titulo}*`);
    for (const x of s.items.slice(0, 6)) lineas.push(`• ${x.nombre}: ${precioTxt(x)}`);
    lineas.push('');
  }
  if (code) lineas.push(`🎁 Con mi código *${code}* tienes ${PCT_REFERIDO} % de descuento en tu primera compra.`);
  lineas.push(`👉 Ve todo aquí: ${ligaCatalogo(code)}`);
  if (nombre) lineas.push('', `Cualquier duda, escríbeme. — ${nombre}`);
  return lineas.join('\n');
}

async function quienRecomienda(env, ref) {
  if (!/^[A-Za-z0-9_-]{2,40}$/.test(ref || '')) return null;
  const a = await one(env, "SELECT a.code, COALESCE(a.publico, a.code) publico, a.nombre, a.activo, c.nombre cn FROM affiliates a LEFT JOIN puntos_cuentas c ON c.email = a.email WHERE (a.code = ? OR a.publico = ?) AND a.activo = 1 LIMIT 1", ref.toUpperCase(), ref).catch(() => null);
  if (!a) return null;
  return { code: a.publico, nombre: nombrePublico(a.cn || a.nombre || '') || null };
}

export async function paginaCatalogo(env, url) {
  const secciones = await itemsCatalogo(env), ref = url.searchParams.get('ref');
  const quien = await quienRecomienda(env, ref);
  const conRef = r => quien ? `${r}${r.includes('?') ? '&' : '?'}ref=${encodeURIComponent(quien.code)}` : r;
  const titulo = quien?.nombre ? `Catálogo Vorka México · te lo comparte ${quien.nombre}` : 'Catálogo Vorka México';
  const descripcion = `Simuladores de examen, invitaciones digitales y herramientas para tu negocio. Entrega inmediata.${quien ? ` Con el código ${quien.code}: ${PCT_REFERIDO} % de descuento en tu primera compra.` : ''}`;
  const cuerpo = `<main class="cat-c"><div class="marco">
    <header class="cat-h"><p class="cat-ojo">Catálogo · Vorka México</p><h1>Todo lo que tenemos para ti</h1>
      ${quien ? `<div class="cat-quien"><span>Te lo recomienda${quien.nombre ? ` <b>${esc(quien.nombre)}</b>` : ''}</span><span class="cat-cod">Código <b>${esc(quien.code)}</b> · ${PCT_REFERIDO} % de descuento en tu primera compra</span></div>` : '<p class="cat-sub">Productos digitales con entrega inmediata. Paga con tarjeta, OXXO o transferencia.</p>'}
    </header>
    <div class="cat-f" role="search"><label class="cat-busca"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="cat-q" type="search" placeholder="Buscar: simulador, invitación, negocio…" autocomplete="off" aria-label="Buscar en el catálogo"></label>
      <div class="cat-chips" role="group" aria-label="Filtrar por tipo"><button type="button" class="cat-chip" data-s="" aria-pressed="true">Todo</button>${secciones.map(s => `<button type="button" class="cat-chip" data-s="${esc(s.id)}" aria-pressed="false">${esc(s.linea)}</button>`).join('')}</div></div>
    <p class="cat-nada" id="cat-nada" hidden>No encontramos eso. Prueba con otra palabra o mira todo el catálogo.</p>
    ${secciones.map(s => `<section class="cat-s" id="${esc(s.id)}"><h2>${esc(s.titulo)}</h2><div class="cat-g">${s.items.map(x => `<a class="cat-p" href="${esc(conRef(x.ruta))}">
      <img src="${esc(x.imagen?.startsWith('http') ? x.imagen : SITIO + (x.imagen || '/vorka-logo.png'))}" alt="" loading="lazy" width="600" height="400">
      <span class="cat-pt"><b>${esc(x.nombre)}</b>${x.texto ? `<small>${esc(x.texto)}</small>` : ''}<span class="cat-pp">${esc(precioTxt(x))}</span></span><span class="cat-ir">Ver y comprar →</span></a>`).join('')}</div></section>`).join('')}
    <p class="cat-pie">Pago protegido con Stripe · Entrega inmediata por correo · <a href="${esc(conRef('/tienda/'))}">Ir a la tienda</a></p>
  </div></main>`;
  return pagina({ titulo, descripcion, ruta: '/tienda/catalogo/', imagen: PORTADA_CATALOGO, navActual: 'catalogo', cuerpo, head: `<style>${CSS}</style>`, script: FILTRO, noindex: !!quien });
}

// Filtros: por tipo (chips) y búsqueda sin acentos sobre nombre y descripción; se esconden las secciones vacías
const FILTRO = `(function(){var q=document.getElementById('cat-q'),nada=document.getElementById('cat-nada'),sec='';
var norm=function(t){return (t||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();};
function pinta(){var t=norm(q.value.trim()),total=0;document.querySelectorAll('.cat-s').forEach(function(s){var n=0;
s.querySelectorAll('.cat-p').forEach(function(p){var ok=!t||norm(p.textContent).indexOf(t)>-1;p.hidden=!ok;if(ok)n++;});
var ver=n>0&&(!sec||s.id===sec);s.hidden=!ver;if(ver)total+=n;});nada.hidden=total>0;}
document.querySelectorAll('.cat-chip').forEach(function(b){b.onclick=function(){sec=b.dataset.s;document.querySelectorAll('.cat-chip').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});pinta();};});
q.addEventListener('input',pinta);})();`;

const CSS = `.cat-c{padding:28px 0 56px}.cat-h{margin:0 0 22px}.cat-ojo{font-size:12.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--oro);margin:0 0 6px}
.cat-h h1{font-size:clamp(28px,6vw,44px);line-height:1.05;letter-spacing:-.03em;margin:0 0 10px}.cat-sub{color:var(--fg-2);margin:0}
.cat-quien{display:grid;gap:4px;padding:14px 16px;border-radius:16px;background:var(--bg-2);border:1px solid var(--line)}
.cat-quien span{font-size:15px}.cat-cod{font-size:13.5px!important;color:var(--fg-2)}
.cat-s{margin-top:30px}.cat-s h2{font-size:20px;letter-spacing:-.01em;margin:0 0 12px}
.cat-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.cat-p{display:grid;grid-template-rows:auto 1fr auto;border:1px solid var(--line);border-radius:18px;overflow:hidden;color:inherit;text-decoration:none;background:var(--card,var(--bg))}
.cat-p:hover{box-shadow:0 14px 40px -24px rgba(0,0,0,.4)}.cat-p img{width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;display:block;background:var(--bg-2)}
@media (max-width:560px){.cat-g{grid-template-columns:1fr;gap:10px}.cat-p{grid-template-columns:112px 1fr;grid-template-rows:auto auto;align-items:center}.cat-p img{grid-row:1/3;width:112px;height:112px!important;aspect-ratio:1;object-fit:cover}.cat-pt{padding:10px 12px 0}.cat-ir{padding:4px 12px 10px;font-size:13px}}
.cat-pt{display:grid;gap:4px;padding:12px 14px 4px}.cat-pt b{font-size:16px}.cat-pt small{font-size:13.5px;line-height:1.4;color:var(--fg-2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-height:2.8em}
.cat-pp{font-weight:750;font-size:15px;margin-top:2px}.cat-ir{padding:10px 14px 14px;font-weight:650;font-size:14px;color:var(--oro)}
.cat-f{position:sticky;top:84px;z-index:5;display:grid;gap:10px;padding:10px;margin:0 -10px;border-radius:18px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px)}
.cat-busca{display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;border-radius:14px;border:1px solid var(--line);background:var(--card,var(--bg))}
.cat-busca svg{width:20px;height:20px;fill:none;stroke:var(--fg-2);stroke-width:2;stroke-linecap:round;flex:none}.cat-busca input{flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:16px;color:var(--fg);outline:none}
.cat-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.cat-chips::-webkit-scrollbar{display:none}
.cat-chip{flex:none;height:38px;padding:0 16px;border-radius:999px;border:1px solid var(--line);background:var(--card,var(--bg));color:var(--fg);font:600 14px var(--font,inherit);cursor:pointer}
.cat-chip[aria-pressed=true]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.cat-p[hidden],.cat-s[hidden]{display:none}.cat-nada{margin:26px 0;text-align:center;color:var(--fg-2)}
.cat-pie{margin-top:34px;text-align:center;color:var(--fg-2);font-size:13.5px}`;
