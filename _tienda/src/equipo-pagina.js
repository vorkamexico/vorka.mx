// Página pública de cada integrante: vorka.mx/equipo/<código> (código público o el original)
// Foto, nombre, su 5 % de descuento (deja la cookie de recomendación como ?ref=), Comprar con su código, Agendar el
// diagnóstico de 20 min, WhatsApp (si lo muestra) y Guardar contacto (.vcf). Fuera de Google (noindex).
// Los datos los manda Vorka OS por RPC (Admin.guardarPerfil / borrarPerfil) solo cuando la persona prende su página.
import { one, run } from './util.js';
import { pagina, aviso, esc } from './paginas.js';
import { refDeVisita, catalogoCompartir } from './tienda.js';
import { afiliado, PCT_REFERIDO } from './descuentos.js';
import { LOGO } from './marco.generado.js';

const FOTO_MAX = 300_000;   // caracteres de base64 (~220 KB): Vorka OS la manda ya reducida
const limpio = (v, n) => { const s = String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n); return s || null; };
// WhatsApp de México: 10 dígitos → 52 + 10; también acepta con 52 o 521 delante
export function normalizarWhatsapp(v) {
  const d = String(v ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length === 10) return `52${d}`;
  if (/^52\d{10}$/.test(d)) return d;
  if (/^521\d{10}$/.test(d)) return `52${d.slice(3)}`;
  return undefined;   // inválido
}
const cuentaDe = (env, email) => one(env, "SELECT code, publico FROM affiliates WHERE email = ? AND tipo = 'puntos'", String(email || '').trim().toLowerCase());
const urlDe = (env, a) => `${(env.SITE_URL || 'https://vorka.mx').replace(/\/$/, '')}/equipo/${a.publico || a.code}`;

// ---------- RPC (Vorka OS) ----------
export async function guardarPerfil(env, email, d = {}) {
  const a = await cuentaDe(env, email);
  if (!a) throw new Error('Esa cuenta de puntos no existe.');
  const nombre = limpio(d.nombre, 80);
  if (!nombre) throw new Error('Falta el nombre.');
  const whatsapp = d.whatsapp ? normalizarWhatsapp(d.whatsapp) : null;
  if (whatsapp === undefined) throw new Error('Escribe un WhatsApp de 10 dígitos.');
  let foto = null;
  if (d.foto) {
    foto = String(d.foto).replace(/^data:image\/jpeg;base64,/, '');
    if (!/^\/9j\//.test(foto) || foto.length > FOTO_MAX || !/^[A-Za-z0-9+/=]+$/.test(foto)) throw new Error('La foto no es válida.');
  }
  await run(env, `INSERT INTO equipo_perfiles (code, nombre, rol, frase, whatsapp, foto, foto_v, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7)
    ON CONFLICT (code) DO UPDATE SET nombre = ?2, rol = ?3, frase = ?4, whatsapp = ?5, foto = ?6,
      foto_v = equipo_perfiles.foto_v + (COALESCE(equipo_perfiles.foto, '') != COALESCE(?6, '')), updated_at = ?7`,
    a.code, nombre, limpio(d.rol, 60), limpio(d.frase, 140), whatsapp, foto, new Date().toISOString());
  return { ok: true, url: urlDe(env, a) };
}
export async function borrarPerfil(env, email) {
  const a = await cuentaDe(env, email);
  if (a) await run(env, 'DELETE FROM equipo_perfiles WHERE code = ?', a.code);
  return { ok: true };
}
export async function perfilEquipo(env, email) {
  const a = await cuentaDe(env, email);
  if (!a) return null;
  const p = await one(env, 'SELECT frase, whatsapp, foto IS NOT NULL con_foto FROM equipo_perfiles WHERE code = ?', a.code);
  return p ? { activo: true, frase: p.frase, whatsapp: p.whatsapp ? p.whatsapp.slice(2) : null, con_foto: !!p.con_foto, url: urlDe(env, a) } : { activo: false, url: urlDe(env, a) };
}

// ---------- página ----------
const vcardEsc = s => String(s || '').replace(/([\;,])/g, '\\$1').replace(/\n/g, '\\n');
const primer = n => String(n || '').split(' ')[0];
const CSS = `<style>
.eq{padding:clamp(96px,12vw,140px) 0 72px}
.eq-g{display:grid;gap:22px;max-width:980px;margin:0 auto;align-items:start}
@media(min-width:900px){.eq-g{grid-template-columns:380px 1fr}}
.eq-cred{position:relative;overflow:hidden;border-radius:28px;background:linear-gradient(155deg,var(--noche) 0%,var(--morado) 70%,#8d3fae 100%);color:#fff;padding:26px 24px 24px;text-align:center;box-shadow:var(--sombra-2)}
.eq-cred .eq-v{position:absolute;right:-70px;bottom:-90px;width:320px;color:#fff;opacity:.07;pointer-events:none}
.eq-cred .eq-v svg{width:100%;height:auto}
.eq-marca{display:flex;align-items:center;justify-content:center;gap:8px;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.9}
.eq-marca svg{width:20px;height:20px}
.eq-foto{width:120px;height:120px;border-radius:50%;margin:20px auto 12px;object-fit:cover;display:block;box-shadow:0 0 0 4px rgba(255,255,255,.85)}
.eq-ini{width:120px;height:120px;border-radius:50%;margin:20px auto 12px;display:grid;place-items:center;background:rgba(255,255,255,.14);font-size:40px;font-weight:750;box-shadow:0 0 0 4px rgba(255,255,255,.85)}
.eq-cred h1{font-size:clamp(26px,4vw,32px);letter-spacing:-.03em;line-height:1.1;color:#fff;margin:0}
.eq-rol{margin-top:4px;opacity:.85;font-size:15px}
.eq-frase{margin:14px auto 0;max-width:30ch;font-size:16px;line-height:1.45;color:var(--claro)}
.eq-desc{margin-top:18px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);font-size:14.5px;line-height:1.45}
.eq-desc b{color:var(--oro-claro);font-size:17px}
.eq-cod{margin-top:10px;font-size:13px;opacity:.85}
.eq-cod b{letter-spacing:.08em}
.eq-acc{display:grid;gap:10px;margin-top:20px}
.eq-acc .btn{width:100%;justify-content:center}
.eq-sec h2{font-size:22px;letter-spacing:-.03em;margin:0 0 4px}
.eq-sec > p{color:var(--fg-2);margin:0 0 14px}
.eq-linea{margin:18px 0 8px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--fg-2)}
.eq-prods{display:grid;gap:10px}
@media(min-width:620px){.eq-prods{grid-template-columns:1fr 1fr}}
.eq-prod{display:flex;gap:12px;align-items:center;padding:12px;border-radius:18px;background:var(--card);border:1px solid var(--line);text-decoration:none;color:var(--fg);min-width:0}
.eq-prod img{width:64px;height:64px;border-radius:12px;object-fit:cover;flex:none;background:var(--bg-2)}
.eq-prod span{display:flex;flex-direction:column;gap:2px;min-width:0}
.eq-prod b{font-size:15px;line-height:1.25}
.eq-prod small{color:var(--fg-2);font-size:13.5px}
.eq-agenda{margin-top:26px;padding:20px;border-radius:22px;background:var(--bg-2);display:grid;gap:10px;justify-items:start}
.eq-agenda h2{margin:0}
.eq-nota{margin-top:22px;color:var(--fg-3);font-size:13px;line-height:1.5}
</style>`;

export async function rutasEquipo(req, env, url) {
  const m = url.pathname.match(/^\/equipo\/([A-Za-z0-9_-]{1,40})(?:\/(foto\.jpg|contacto\.vcf))?\/?$/);
  if (!/^\/equipo(\/|$)/.test(url.pathname)) return null;
  const noExiste = () => pagina({ titulo: 'Esta página no existe · Vorka México', ruta: '/equipo/', noindex: true, status: 404,
    cuerpo: aviso({ titulo: 'Esta página no existe', texto: 'Revisa la liga o visita la tienda de Vorka México.', extra: '<p><a class="btn tinta" href="/tienda/">Ir a la tienda</a></p>' }) });
  if (!m || req.method !== 'GET' && req.method !== 'HEAD') return noExiste();
  const af = await afiliado(env, m[1]);
  if (!af) return noExiste();
  const [p, a] = await Promise.all([one(env, 'SELECT * FROM equipo_perfiles WHERE code = ?', af.code), one(env, 'SELECT code, publico FROM affiliates WHERE code = ?', af.code)]);
  const codigo = a.publico || a.code;
  // Código válido sin página: a la tienda con su código (nunca un error para quien escaneó)
  if (!p) return new Response(null, { status: 302, headers: { location: `/tienda/?ref=${encodeURIComponent(codigo)}`, 'cache-control': 'no-store' } });
  if (m[2] === 'foto.jpg') {
    if (!p.foto) return new Response('No encontrado', { status: 404 });
    const bin = Uint8Array.from(atob(p.foto), c => c.charCodeAt(0));
    return new Response(bin, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400', 'x-robots-tag': 'noindex' } });
  }
  const sitio = (env.SITE_URL || 'https://vorka.mx').replace(/\/$/, '');
  const pagUrl = `${sitio}/equipo/${codigo}`, tienda = `${sitio}/tienda/?ref=${encodeURIComponent(codigo)}`;
  if (m[2] === 'contacto.vcf') {
    const [nom, ...ap] = p.nombre.split(' ');
    const v = ['BEGIN:VCARD', 'VERSION:3.0', `N:${vcardEsc(ap.join(' '))};${vcardEsc(nom)};;;`, `FN:${vcardEsc(p.nombre)}`, 'ORG:Vorka México', p.rol ? `TITLE:${vcardEsc(p.rol)}` : null,
      p.whatsapp ? `TEL;TYPE=CELL:+${p.whatsapp}` : null, `URL:${pagUrl}`, `NOTE:${vcardEsc(`Compra en Vorka México con mi código ${codigo}: ${tienda}`)}`, 'END:VCARD'].filter(Boolean).join('\r\n');
    return new Response(v + '\r\n', { headers: { 'content-type': 'text/vcard; charset=utf-8', 'content-disposition': `attachment; filename="${codigo.toLowerCase()}-vorka.vcf"`, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
  }
  // La visita deja la cookie de recomendación (como ?ref=) y cuenta en «personas que abrieron tu liga»
  const { cookie } = await refDeVisita(env, req, new URL(`${sitio}/tienda/?ref=${encodeURIComponent(codigo)}`)).catch(() => ({}));
  const cat = await catalogoCompartir(env, codigo).catch(() => ({ lineas: [] }));
  const nombre = primer(p.nombre);
  const wa = p.whatsapp ? `https://wa.me/${p.whatsapp}?text=${encodeURIComponent(`Hola, ${nombre}. Vi tu página de Vorka México y quiero más información.`)}` : null;
  const foto = p.foto ? `<img class="eq-foto" src="/equipo/${esc(codigo)}/foto.jpg?v=${p.foto_v}" alt="Foto de ${esc(p.nombre)}" width="120" height="120">`
    : `<div class="eq-ini" aria-hidden="true">${esc(p.nombre.split(' ').slice(0, 2).map(x => x[0] || '').join('').toUpperCase())}</div>`;
  const prods = (cat.lineas || []).map(l => `<div class="eq-linea">${esc(l.linea)}</div><div class="eq-prods">${l.productos.map(x =>
    `<a class="eq-prod" href="${esc(x.liga || x.url)}">${x.imagen ? `<img src="${esc(x.imagen)}" alt="" loading="lazy" width="64" height="64">` : ''}<span><b>${esc(x.nombre)}</b><small>${esc(x.precio || '')}</small></span></a>`).join('')}</div>`).join('');
  const cuerpo = `<section class="eq"><div class="marco"><div class="eq-g">
    <aside class="eq-cred">
      <div class="eq-v" aria-hidden="true">${LOGO}</div>
      <div class="eq-marca">${LOGO}<span>Vorka México</span></div>
      ${foto}
      <h1>${esc(p.nombre)}</h1>
      <div class="eq-rol">${esc(p.rol || 'Equipo Vorka México')}</div>
      ${p.frase ? `<p class="eq-frase">${esc(p.frase)}</p>` : ''}
      <div class="eq-desc">Compra con mi recomendación y tienes <b>${PCT_REFERIDO} %</b> de descuento en tu primer pago.</div>
      <div class="eq-cod">Mi código: <b>${esc(codigo)}</b> · ya quedó aplicado</div>
      <div class="eq-acc">
        <a class="btn blanco" href="#comprar">Comprar con mi código</a>
        <a class="btn vidrio" href="/agenda/?ref=${encodeURIComponent(codigo)}">Agendar un diagnóstico</a>
        ${wa ? `<a class="btn vidrio" href="${esc(wa)}" target="_blank" rel="noopener">Escribirme por WhatsApp</a>` : ''}
        <a class="btn vidrio" href="/equipo/${esc(codigo)}/contacto.vcf">Guardar contacto</a>
      </div>
    </aside>
    <div class="eq-sec" id="comprar">
      <h2>Lo que puedes comprar con mi código</h2>
      <p>Toca un producto para ver sus detalles. El descuento se aplica solo al pagar.</p>
      ${prods || `<p><a class="btn tinta" href="${esc(tienda)}">Ver la tienda</a></p>`}
      <div class="eq-agenda"><h2>¿Tu proyecto u organización necesita ayuda?</h2><p style="margin:0;color:var(--fg-2)">Agenda un diagnóstico de 20 minutos, sin costo, con el equipo de Vorka México.</p><a class="btn tinta" href="/agenda/?ref=${encodeURIComponent(codigo)}">Agendar diagnóstico</a></div>
      <p class="eq-nota">Los simuladores de Vorka México son material de práctica original y no están afiliados a ninguna universidad ni institución. ${esc(nombre)} forma parte del equipo de Vorka México.</p>
    </div>
  </div></div></section>`;
  return pagina({ titulo: `${p.nombre} · Vorka México`, descripcion: `Compra en Vorka México con la recomendación de ${nombre} y ten ${PCT_REFERIDO} % de descuento en tu primer pago.`,
    ruta: `/equipo/${codigo}`, noindex: true, head: CSS, cuerpo, imagen: p.foto ? `${sitio}/equipo/${codigo}/foto.jpg?v=${p.foto_v}` : undefined,
    headers: { 'cache-control': 'no-store', ...(cookie ? { 'set-cookie': cookie } : {}) } });
}
