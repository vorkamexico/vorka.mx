// Diagnóstico gratis de un simulador (vorka.mx/<simulador>/diagnostico/): un simulacro breve con tutor para que la
// persona vea cómo funciona el simulador y sepa en qué punto está. Pide nombre, correo y WhatsApp; la clave para entrar
// llega al correo (así se valida). Al terminar ve su puntaje estimado, le llega por correo y la invitamos al Completo.
// Uno por correo y simulador: con la misma clave retoma el suyo o vuelve a ver su resultado.
//
// /<simulador>/diagnostico/          → página (el flujo lo pinta diag.js)
// /api/<app>/diagnostico/pedir       → POST { nombre, email, whatsapp, acepto, ref? } guarda los datos y manda la clave
// /api/<app>/diagnostico/codigo      → POST { email, codigo } valida la clave, deja la cookie y devuelve el estado
// /api/<app>/diagnostico/estado      → GET (cookie) reactivos que le tocaron y su resultado si ya terminó
// /api/<app>/diagnostico/terminar    → POST (cookie) { resp } califica en el servidor, guarda y manda el resultado por correo
import { one, run, json, fail, enc, sha256, iguales } from '../util.js';
import { hashToken } from '../entrega.js';
import { dentroDelLimite, productoPorSlug } from '../modelo.js';
import { enviar, marco, boton, P } from '../correo.js';
import { pagina, esc } from '../paginas.js';
import { refDeVisita } from '../tienda.js';
import { DIAG_JS } from './cliente.generado.js';

export const TOTAL_DIAG = 12;          // reactivos del diagnóstico
const CODIGO_MIN = 30;                 // vigencia de la clave
const CODIGO_INTENTOS = 5;
const DIAS_COOKIE = 30;
const LARGO_TEXTO = 1100;              // lecturas cortas: el diagnóstico es para probar, no para cansar
const PESO = { 1: 1, 2: 1.25, 3: 1.5 };
const CORREO = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,}$/i;
const codigo6 = () => { const b = new Uint32Array(1); do crypto.getRandomValues(b); while (b[0] >= 4294000000); return String(b[0] % 1e6).padStart(6, '0'); };

// WhatsApp de México a 10 dígitos (acepta +52, 52 o 521 al inicio, espacios y guiones). null si no es válido.
export function whatsappMx(v) {
  let d = String(v ?? '').replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
  else if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
  return /^[1-9]\d{9}$/.test(d) ? d : null;
}

// Azar con semilla (el mismo correo arma el mismo diagnóstico aunque se recalcule)
function azarDe(semilla) {
  let a = [...semilla].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 2166136261);
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const barajar = (l, azar) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const largoTexto = t => (t?.parrafos || []).join(' ').length;

// Reparte TOTAL_DIAG reactivos entre las secciones, de menor a mayor dificultad. En las secciones de lectura usa un solo
// texto corto con varias preguntas. Devuelve [{ id: seccion, items: [ids] }].
export function armarDiagnostico(BANCO, azar) {
  const secs = BANCO.SECCIONES;
  const base = Math.max(1, Math.floor(TOTAL_DIAG / secs.length));
  let extra = Math.max(0, TOTAL_DIAG - base * secs.length);
  const escalera = k => (k === 1 ? [2] : k === 2 ? [2, 3] : Array.from({ length: k }, (_, i) => [1, 2, 3][i % 3]));
  return secs.map(s => {
    const k = base + (extra > 0 ? (extra--, 1) : 0);
    const cand = BANCO.REACTIVOS.filter(r => r.seccion === s.id && r.tipo !== 'abierta' && Array.isArray(r.opciones) && (!r.texto || largoTexto(BANCO.TEXTOS[r.texto]) <= LARGO_TEXTO));
    let elegidos = null;
    const conTexto = cand.filter(r => r.texto);
    if (conTexto.length && conTexto.length * 2 >= cand.length) {
      const grupos = Object.values(conTexto.reduce((g, r) => ((g[r.texto] ||= []).push(r), g), {})).filter(g => g.length >= k);
      if (grupos.length) elegidos = barajar(grupos[Math.floor(azar() * grupos.length)], azar).slice(0, k);
    }
    if (!elegidos) {
      const libres = barajar(cand.filter(r => !r.texto).length >= k ? cand.filter(r => !r.texto) : cand, azar), usados = new Set();
      elegidos = escalera(k).map(d => { const r = libres.find(x => !usados.has(x.id) && x.dificultad === d) || libres.find(x => !usados.has(x.id)); if (r) usados.add(r.id); return r; }).filter(Boolean);
    }
    return { id: s.id, items: elegidos.sort((a, b) => a.dificultad - b.dificultad).map(r => r.id) };
  }).filter(s => s.items.length);
}

// sim: { c, APP, RUTA, API, BANCO, REACTIVO, firma, cssUrl }
export function crearDiagnostico({ c, APP, RUTA, API, BANCO, REACTIVO, firma, cssUrl }) {
  const COOKIE = `${c.cookie}_dx`;
  const escalaPAA = c.escala.tipo === 'paa';
  const EXAMEN = c.cliente.examen;
  const seccion = id => BANCO.SECCIONES.find(s => s.id === id);

  // ---------- cookie del diagnóstico ----------
  async function cookieDe(env, id) {
    const exp = Math.floor(Date.now() / 1000) + DIAS_COOKIE * 86400;
    return `${COOKIE}=${id}.${exp}.${await firma(env, `dx.${id}.${exp}`)}; Max-Age=${DIAS_COOKIE * 86400}; Path=/; Secure; HttpOnly; SameSite=Lax`;
  }
  async function diagDe(env, req) {
    const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d{1,12})\\.(\\d{9,11})\\.([0-9a-f]{64})`));
    if (!m || Number(m[2]) * 1000 < Date.now()) return null;
    if (!iguales(m[3], await firma(env, `dx.${m[1]}.${m[2]}`))) return null;
    return one(env, 'SELECT * FROM simulador_diagnosticos WHERE id = ? AND app = ? AND verificado_at IS NOT NULL', Number(m[1]), APP);
  }

  // ---------- lo que necesita el cliente ----------
  const seccionesDe = d => { try { return JSON.parse(d.items || '[]'); } catch { return []; } };
  async function estado(env, d) {
    const secs = seccionesDe(d);
    const ids = secs.flatMap(s => s.items).filter(id => REACTIVO[id]);
    const textos = {}, temas = {};
    for (const id of ids) { const r = REACTIVO[id]; if (r.texto) textos[r.texto] = BANCO.TEXTOS[r.texto]; temas[r.tema] = BANCO.TEMAS[r.tema]?.nombre || ''; }
    const planes = {};
    for (const [k, slug] of Object.entries(c.planes || {})) { const p = await productoPorSlug(env, slug); if (p) planes[k] = { precio_centavos: p.precio_centavos }; }
    return {
      id: d.id, nombre: String(d.nombre).split(' ')[0], email: d.email,
      secciones: secs.map(s => ({ id: s.id, nombre: seccion(s.id)?.nombre || s.id, color: seccion(s.id)?.color || 'morado', items: s.items.filter(id => REACTIVO[id]) })),
      reactivos: Object.fromEntries(ids.map(id => [id, REACTIVO[id]])), textos, temas, planes,
      resultado: d.resultado ? JSON.parse(d.resultado) : null,
    };
  }

  // ---------- calificación (en el servidor, con las respuestas correctas del banco) ----------
  function calificar(d, resp) {
    const secs = seccionesDe(d);
    const secciones = secs.map(s => {
      let ok = 0, seg = 0, w = 0, wt = 0;
      const items = s.items.filter(id => REACTIVO[id]);
      for (const id of items) {
        const r = REACTIVO[id], st = resp?.[id] || {}, p = PESO[r.dificultad] || 1;
        wt += p;
        if (Number(st.sel1) === r.correcta && st.sel1 != null) { ok++; w += p; } else if (Number(st.sel2) === r.correcta && st.sel2 != null) seg++;
      }
      const puntaje = escalaPAA ? Math.round((200 + 600 * (wt ? w / wt : 0)) / 10) * 10 : (items.length ? Math.round(100 * ok / items.length) : 0);
      return { id: s.id, nombre: seccion(s.id)?.nombre || s.id, aciertos: ok, segundo: seg, total: items.length, puntaje };
    });
    const ok = secciones.reduce((a, s) => a + s.aciertos, 0), total = secciones.reduce((a, s) => a + s.total, 0);
    let global;
    if (escalaPAA) {
      const base = secciones.filter(s => (c.cliente.globalSecciones || []).includes(s.id));
      const l = base.length ? base : secciones;
      global = Math.round(l.reduce((a, s) => a + s.puntaje, 0) / l.length / 10) * 10;
    } else global = total ? Math.round(ok / total * c.cliente.examenReactivos) : 0;
    const orden = secciones.slice().sort((a, b) => b.aciertos / (b.total || 1) - a.aciertos / (a.total || 1));
    return { global, escala: escalaPAA ? 'paa' : 'aciertos', de: escalaPAA ? 800 : c.cliente.examenReactivos, aciertos: ok, total, secciones,
      fuerte: orden[0]?.id || null, reforzar: orden.length > 1 ? orden[orden.length - 1].id : null, fecha: new Date().toISOString() };
  }
  const textoGlobal = r => (r.escala === 'paa' ? `alrededor de ${r.global} puntos (de 200 a 800)` : `alrededor de ${r.global} de ${r.de} aciertos`);

  // ---------- correos ----------
  async function correoClave(env, email, nombre, cod) {
    await enviar(env, { para: email, asunto: `${cod} es tu clave para el diagnóstico gratis ${EXAMEN}`, idempotencia: `dx-cod-${APP}-${await sha256(email + cod)}`,
      html: marco(`Tu clave para el diagnóstico ${EXAMEN}`, `<p style="${P}">Hola, ${esc(String(nombre).split(' ')[0])}:</p><p style="${P}">Escribe esta clave en la página del diagnóstico para empezar:</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;width:100%"><tr><td align="center" style="background:#F4F2EF;border-radius:16px;padding:18px 12px"><div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#141114;font-family:'SF Mono',Menlo,Consolas,monospace">${cod}</div><div style="font-size:12.5px;color:#A8A4A9;margin-top:6px">Vence en ${CODIGO_MIN} minutos</div></td></tr></table><p style="${P}">Son ${TOTAL_DIAG} preguntas tipo ${esc(EXAMEN)}, con un tutor que te da una pista si fallas. Al terminar ves tu puntaje estimado y qué te conviene reforzar.</p><p style="${P};color:#8b8790;font-size:13px">Si no pediste esta clave, ignora este correo.</p>`, { etiqueta: 'Diagnóstico gratis' }),
      texto: `Tu clave para el diagnóstico gratis ${EXAMEN}: ${cod} (vence en ${CODIGO_MIN} minutos).\n\nSi no la pediste, ignora este correo.` });
  }
  async function correoResultado(env, d, r) {
    const url = `${env.SITE_URL}${RUTA}/?plan=paquete#comprar`;
    const filas = r.secciones.map(s => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:15px">${esc(s.nombre)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee;font-size:15px;font-weight:700">${s.aciertos} de ${s.total}${r.escala === 'paa' ? ` · ${s.puntaje}` : ''}</td></tr>`).join('');
    const reforzar = r.reforzar ? seccion(r.reforzar)?.nombre : null;
    await enviar(env, { para: d.email, asunto: `Tu diagnóstico ${EXAMEN}: ${textoGlobal(r)}`, idempotencia: `dx-res-${APP}-${d.id}`,
      html: marco(`Tu diagnóstico ${EXAMEN}`, `<p style="${P}">Hola, ${esc(String(d.nombre).split(' ')[0])}:</p><p style="${P}">Con tus respuestas, hoy sacarías <b>${textoGlobal(r)}</b>. Acertaste ${r.aciertos} de ${r.total} a la primera.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px">${filas}</table>${reforzar ? `<p style="${P}">Donde más puntos puedes ganar: <b>${esc(reforzar)}</b>.</p>` : ''}<p style="${P}">Es una estimación con ${r.total} preguntas. Para subir tu puntaje y medirte de verdad, el plan <b>Completo</b> trae práctica ilimitada con tutor y 2 exámenes completos como el real (el primero, con tutor).</p>${boton(url, 'Ver el plan Completo')}<p style="${P};color:#8b8790;font-size:13px">¿Dudas? Responde este correo o escríbenos por WhatsApp.</p>`, { etiqueta: 'Diagnóstico gratis' }),
      texto: `Hola, ${String(d.nombre).split(' ')[0]}:\n\nCon tus respuestas, hoy sacarías ${textoGlobal(r)}. Acertaste ${r.aciertos} de ${r.total} a la primera.\n\n${r.secciones.map(s => `${s.nombre}: ${s.aciertos} de ${s.total}`).join('\n')}\n\nPlan Completo (práctica ilimitada con tutor y 2 exámenes completos): ${url}` });
  }

  // ---------- rutas ----------
  const mismoOrigen = (req, env) => { const o = req.headers.get('origin'); return !o || o === new URL(env.SITE_URL).origin || o === new URL(req.url).origin; };
  async function rutas(req, env, url) {
    const p = url.pathname, M = req.method;
    if (p === `${RUTA}/diagnostico`) return Response.redirect(`${url.origin}${RUTA}/diagnostico/`, 301);
    if (p === `${RUTA}/diagnostico/` && (M === 'GET' || M === 'HEAD')) return paginaDiag(env, req, url);
    if (!p.startsWith(`${API}/diagnostico/`)) return null;
    if (M === 'POST' && !mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
    const ip = await sha256(req.headers.get('cf-connecting-ip') || 'local');

    if (p === `${API}/diagnostico/pedir` && M === 'POST') {
      const b = await req.json().catch(() => ({}));
      const nombre = String(b.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      const email = String(b.email || '').trim().toLowerCase();
      const whatsapp = whatsappMx(b.whatsapp);
      if (nombre.length < 2) return fail('Escribe tu nombre.');
      if (!CORREO.test(email) || email.length > 254) return fail('Revisa tu correo: parece que le falta algo.');
      if (!whatsapp) return fail('Escribe tu WhatsApp a 10 dígitos, por ejemplo 55 1234 5678.');
      if (b.acepto !== true) return fail('Para seguir, acepta el aviso de privacidad.');
      if (!(await dentroDelLimite(env, `dx-ip:${ip}`, 8, 600)) || !(await dentroDelLimite(env, `dx-mail:${APP}:${await sha256(email)}`, 3, 600)))
        return fail('Ya te mandamos varias claves. Espera unos minutos y revisa tu correo (también en spam o promociones).', 429);
      const cod = codigo6(), ahora = new Date().toISOString();
      const ref = /^[a-z0-9_-]{2,40}$/i.test(b.ref || '') ? b.ref : null;
      await run(env, `INSERT INTO simulador_diagnosticos (app, email, nombre, whatsapp, acepto_at, ref_code, codigo_hash, codigo_expira_at, codigo_intentos)
        VALUES (?,?,?,?,?,?,?,?,0)
        ON CONFLICT (app, email) DO UPDATE SET nombre = excluded.nombre, whatsapp = excluded.whatsapp, acepto_at = excluded.acepto_at,
          ref_code = COALESCE(simulador_diagnosticos.ref_code, excluded.ref_code), codigo_hash = excluded.codigo_hash,
          codigo_expira_at = excluded.codigo_expira_at, codigo_intentos = 0, updated_at = excluded.acepto_at`,
        APP, email, nombre, whatsapp, ahora, ref, await hashToken(env, `dx:${APP}:${email}:${cod}`), new Date(Date.now() + CODIGO_MIN * 60e3).toISOString());
      try { await correoClave(env, email, nombre, cod); }
      catch (e) { console.error('diagnóstico: correo de clave', e?.message); return fail('No pudimos mandar la clave. Intenta de nuevo en un momento.', 502); }
      return json({ ok: true, email });
    }

    if (p === `${API}/diagnostico/codigo` && M === 'POST') {
      if (!(await dentroDelLimite(env, `dx-cod-ip:${ip}`, 30, 600))) return fail('Demasiados intentos. Espera unos minutos.', 429);
      const b = await req.json().catch(() => ({}));
      const email = String(b.email || '').trim().toLowerCase(), cod = String(b.codigo || '').replace(/\D/g, '');
      const d = await one(env, 'SELECT * FROM simulador_diagnosticos WHERE app = ? AND email = ?', APP, email);
      if (!d || !d.codigo_hash || Date.parse(d.codigo_expira_at) < Date.now()) return fail('Esa clave ya venció. Pide una nueva.', 410);
      if (d.codigo_intentos >= CODIGO_INTENTOS) return fail('Demasiados intentos con esa clave. Pide una nueva.', 429);
      if (cod.length !== 6 || !iguales(d.codigo_hash, await hashToken(env, `dx:${APP}:${email}:${cod}`))) {
        await run(env, 'UPDATE simulador_diagnosticos SET codigo_intentos = codigo_intentos + 1 WHERE id = ?', d.id);
        return fail('Esa clave no es correcta. Revisa el último correo que te mandamos.');
      }
      const ahora = new Date().toISOString();
      const items = d.items || JSON.stringify(armarDiagnostico(BANCO, azarDe(`${APP}:${email}`)));
      await run(env, 'UPDATE simulador_diagnosticos SET codigo_hash = NULL, codigo_expira_at = NULL, codigo_intentos = 0, verificado_at = COALESCE(verificado_at, ?), items = ?, updated_at = ? WHERE id = ?',
        ahora, items, ahora, d.id);
      return json(await estado(env, { ...d, items, verificado_at: d.verificado_at || ahora }), 200, { 'set-cookie': await cookieDe(env, d.id) });
    }

    const d = await diagDe(env, req);
    if (!d) return fail('Entra con la clave que te mandamos a tu correo.', 401);
    if (p === `${API}/diagnostico/estado` && M === 'GET') return json(await estado(env, d), 200, { 'cache-control': 'no-store' });
    if (p === `${API}/diagnostico/terminar` && M === 'POST') {
      if (d.resultado) return json({ resultado: JSON.parse(d.resultado) });
      const b = await req.json().catch(() => ({}));
      const r = calificar(d, b.resp && typeof b.resp === 'object' ? b.resp : {});
      const ahora = new Date().toISOString();
      const ok = await run(env, 'UPDATE simulador_diagnosticos SET resultado = ?, terminado_at = ?, updated_at = ? WHERE id = ? AND resultado IS NULL', JSON.stringify(r), ahora, ahora, d.id);
      if (ok.meta.changes) await correoResultado(env, d, r).catch(e => console.error('diagnóstico: correo de resultado', e?.message));
      else return json({ resultado: JSON.parse((await one(env, 'SELECT resultado FROM simulador_diagnosticos WHERE id = ?', d.id)).resultado) });
      return json({ resultado: r });
    }
    return fail('No encontrado', 404);
  }

  // ---------- página ----------
  async function paginaDiag(env, req, url) {
    const { code, cookie } = await refDeVisita(env, req, url);
    const n = BANCO.SECCIONES.length;
    const secs = BANCO.SECCIONES.map(s => esc(s.nombre));
    const ultima = BANCO.SECCIONES[n - 1].nombre;
    const listaSecs = n === 1 ? secs[0] : n <= 5 ? `${secs.slice(0, -1).join(', ')} ${/^h?i(?!e)/i.test(ultima.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ? 'e' : 'y'} ${secs[n - 1]}` : `${n} materias`;
    const cfg = { app: APP, ruta: RUTA, api: API, examen: EXAMEN, total: TOTAL_DIAG, ref: code || '', escala: escalaPAA ? 'paa' : 'aciertos' };
    return pagina({
      titulo: `Diagnóstico ${EXAMEN} gratis: ¿cuánto sacarías hoy? | Vorka México`, ruta: `${RUTA}/diagnostico/`,
      descripcion: `Haz gratis un simulacro breve de ${TOTAL_DIAG} preguntas tipo ${EXAMEN} con tutor y descubre tu puntaje estimado y qué te conviene reforzar.`,
      headers: cookie ? { 'set-cookie': cookie } : {},
      head: `<link rel="stylesheet" href="${cssUrl}">${CSS}`,
      script: `window.DX=${JSON.stringify(cfg).replace(/</g, '\\u003c')};${DIAG_JS}`,
      cuerpo: `
<section class="dx-hero"><div class="marco dx-g">
  <div class="dx-intro">
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / <a href="${RUTA}/">${esc(c.titulo)}</a> / Diagnóstico gratis</nav>
    <span class="dx-chip">Gratis · sin tarjeta</span>
    <h1 class="t-h1">¿Cuánto sacarías hoy en ${esc(EXAMEN === 'PAA' ? 'la PAA' : `el examen ${EXAMEN}`)}?</h1>
    <p class="t-lead">Haz un simulacro breve de <b>${TOTAL_DIAG} preguntas</b> de ${listaSecs}, con el mismo tutor del simulador: si fallas, te da una pista y otro intento. Al final ves tu puntaje estimado y dónde puedes ganar más puntos.</p>
    <ul class="dx-pasos">
      <li><b>1</b><span>Deja tus datos y te mandamos una clave a tu correo.</span></li>
      <li><b>2</b><span>Contesta ${TOTAL_DIAG} preguntas en unos 10 minutos, desde tu celular.</span></li>
      <li><b>3</b><span>Ve tu puntaje estimado y qué reforzar. También te llega por correo.</span></li>
    </ul>
  </div>
  <div class="dx-caja" id="dx" aria-live="polite"><div class="sim-cargando"><span class="sim-giro" aria-hidden="true"></span>Cargando…</div>
    <noscript><p>Para hacer el diagnóstico necesitas activar JavaScript en tu navegador.</p></noscript></div>
</div></section>`,
    });
  }

  return { rutas };
}

const CSS = `<style>
.dx-hero{padding:clamp(12px,3vw,40px) 0 clamp(48px,6vw,80px)}
.dx-g{display:grid;gap:28px 56px;align-items:start}
@media(min-width:980px){.dx-g{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}.dx-intro{position:sticky;top:110px}}
.dx-g > *{min-width:0}
@media(max-width:979px){.dx-foco .dx-intro{display:none}.dx-foco{padding-top:8px}}
.dx-chip{display:inline-flex;margin-top:14px;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;background:var(--verde-suave);color:var(--verde)}
.dx-intro h1{margin-top:14px}.dx-intro .t-lead{margin-top:14px}
.dx-pasos{display:grid;gap:10px;margin-top:22px}
.dx-pasos li{display:flex;gap:12px;align-items:flex-start;font-size:15.5px;color:var(--fg-2)}
.dx-pasos b{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--fg);color:var(--bg);font-size:13px}
.dx-caja{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(18px,3vw,30px);box-shadow:var(--sombra-2);min-height:320px}
.dx-caja .sim-cargando{padding:60px 0}
.dx-caja h2{font-size:clamp(22px,3vw,28px);letter-spacing:-.025em;line-height:1.15}
.dx-caja > p,.dx-sub{color:var(--fg-2);margin-top:8px}
.dx-form{display:grid;gap:14px;margin-top:20px}
.dx-campo label{display:block;font-weight:650;font-size:14.5px;margin-bottom:6px}
.dx-campo input{width:100%;font:inherit;font-size:16px;padding:13px 14px;border-radius:14px;border:1.5px solid var(--line);background:var(--bg);color:var(--fg)}
.dx-campo input:focus{outline:none;border-color:var(--fg)}
.dx-campo small{display:block;margin-top:5px;color:var(--fg-3);font-size:13px}
.dx-tel{display:flex;align-items:stretch;gap:8px}.dx-tel span{display:grid;place-items:center;padding:0 12px;border-radius:14px;background:var(--bg-2);font-weight:650;font-size:15px}
.dx-casilla{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--fg-2);line-height:1.45}.dx-casilla input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:var(--fg)}
.dx-casilla a{color:inherit;text-decoration:underline}
.dx-error{color:#b3261e;font-weight:600;font-size:14.5px}
.dx-form .btn{width:100%;justify-content:center}
.dx-clave{font-size:30px!important;letter-spacing:.5em;text-align:center;font-weight:800;padding-left:.5em!important}
.dx-links{display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:center;font-size:14px}
.dx-links button{background:none;border:0;padding:4px 0;font:inherit;font-weight:650;color:var(--morado);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.dx-secs{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 22px}
.dx-secs span{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:650;padding:7px 12px;border-radius:999px;background:var(--bg-2)}
.dx-lista{display:grid;gap:8px;margin:0 0 22px}.dx-lista li{display:flex;gap:10px;align-items:flex-start;color:var(--fg-2);font-size:15px}.dx-lista svg{width:18px;height:18px;flex:none;color:var(--verde);margin-top:2px}
.dx-caja .sim-q{margin:0}
.dx-caja .sim-q-cols{display:block}
.dx-caja .sim-texto{margin-bottom:16px}
.dx-caja .sim-texto-c p,.dx-caja .sim-enun,.dx-caja .sim-tutor p{text-align:left}
.dx-res-cab{text-align:center;padding:6px 0 18px}
.dx-res-cab .etiqueta{justify-content:center}
.dx-num{display:block;font-size:clamp(56px,12vw,88px);font-weight:800;letter-spacing:-.05em;line-height:1;margin:12px 0 4px}
.dx-num small{font-size:.32em;letter-spacing:-.01em;color:var(--fg-2);font-weight:650}
.dx-barras{display:grid;gap:12px;margin:8px 0 20px}
.dx-barra > div{display:flex;justify-content:space-between;gap:10px;font-size:14.5px;margin-bottom:5px}.dx-barra b{font-weight:650}
.dx-barra i{display:block;height:10px;border-radius:999px;background:var(--bg-2);overflow:hidden}.dx-barra i span{display:block;height:100%;border-radius:inherit;background:var(--verde);transition:width .8s var(--ease)}
.dx-barra.bajo i span{background:#d9822b}
.dx-nota{font-size:13.5px;color:var(--fg-3);margin:4px 0 20px}
.dx-cta{background:var(--noche,#141114);color:#fff;border-radius:22px;padding:22px;display:grid;gap:12px}
.dx-cta .etiqueta{color:rgba(255,255,255,.75)}
.dx-cta h3{font-size:21px;letter-spacing:-.02em;line-height:1.2;color:#fff}
.dx-cta p{color:rgba(255,255,255,.78);font-size:15px}
.dx-cta ul{display:grid;gap:7px}.dx-cta li{display:flex;gap:9px;font-size:15px;color:rgba(255,255,255,.9)}.dx-cta li svg{width:17px;height:17px;flex:none;color:#7bd3a0;margin-top:2px}
.dx-precio{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.dx-precio b{font-size:30px;letter-spacing:-.03em}.dx-precio s{color:rgba(255,255,255,.55)}.dx-precio em{font-style:normal;font-size:12.5px;font-weight:800;padding:3px 9px;border-radius:999px;background:var(--acento);color:var(--sobre-acento)}
.dx-cta .btn{width:100%;justify-content:center}
.dx-cta a.dx-otro{color:rgba(255,255,255,.8);text-align:center;font-size:14px;font-weight:600}
</style>`;
