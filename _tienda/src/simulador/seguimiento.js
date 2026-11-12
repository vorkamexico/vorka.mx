// Simuladores (nov 2026, migración 0087): lo que pasa después del diagnóstico gratis y después del examen real.
//
// 1. Seguimiento del diagnóstico (cron de cada hora, seguimientoDiagnosticos). Solo a quien no compró ese simulador, no se
//    dio de baja y pidió su diagnóstico desde SEGUIMIENTO_DESDE (los anteriores se siguieron a mano por WhatsApp):
//      · no terminó → un correo para retomarlo, 24 h después de pedir su clave;
//      · terminó → a los 2 días, su sección más débil con el consejo de los temas que le tocaron;
//      · 3 días después de ese → un código personal de 10 % que vence en 72 h (codigos_descuento, 1 uso).
//    Solo de 9:00 a 20:59 del centro de México. Cada correo trae /tienda/simulador-baja?i=&s= (GET pide confirmar, POST da
//    de baja: los revisores de correo abren las ligas solos).
// 2. Puntaje real (cron, pedirPuntajes): a quien usó un simulador (compra o liga de regalo) le preguntamos UNA vez cuánto
//    sacó en el examen de verdad, siempre después del correo de la reseña (que sale a los 14 días):
//      · con fecha de examen en su plan de estudio → 7 días después del examen (y nunca antes de 21 días de su compra);
//      · sin fecha → 45 días después de su compra.
//    /tienda/puntaje/<token> guarda puntaje, universidad, si se quedó, comentario y si podemos publicarlo (con su nombre).
//    El equipo lo ve en Vorka OS › Tienda › Reseñas › Puntajes (puntajesPanel).
import { one, all, run, enc, hex, iguales, sha256, aleatorio, ahoraISO, correoOculto } from '../util.js';
import { enviar, marco, boton, esc, P, SOPORTE } from '../correo.js';
import { pagina, aviso } from '../paginas.js';
import { dentroDelLimite } from '../modelo.js';
import { FLECHA, CHECK } from '../marco.generado.js';
import { enMexico } from './estudio.js';

const H = 36e5, DIA = 24 * H;
export const SEGUIMIENTO_DESDE = '2026-11-12T00:00:00.000Z';
export const SEG = { retomar: 24 * H, tema: 48 * H, oferta: 72 * H, vigencia: 72 * H, ventana: 10 * DIA, pct: 10, lote: 25 };
export const PUNTAJE = { tras_examen: 7 * DIA, minimo: 21 * DIA, sin_fecha: 45 * DIA, ventana: 21 * DIA, lote: 25, desde_compra: 200 * DIA };
export const HORARIO = [9, 20];        // horas del centro de México en que salen estos correos

const enHorario = fecha => { const { hora } = enMexico(fecha); return hora >= HORARIO[0] && hora <= HORARIO[1]; };
const primerNombre = n => String(n || '').trim().split(/\s+/)[0] || '';
const examenDe = sim => (sim.nombre === 'PAA' ? 'la PAA' : `el examen ${sim.nombre}`);
const textoResultado = r => (r.escala === 'paa' ? `alrededor de ${r.global} puntos (de 200 a 800)` : `alrededor de ${r.global} de ${r.de} aciertos`);

async function firmar(env, txt) {
  if (!env.DOWNLOAD_TOKEN_SECRET) throw new Error('Falta DOWNLOAD_TOKEN_SECRET');
  const k = await crypto.subtle.importKey('raw', enc.encode(env.DOWNLOAD_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(txt))).slice(0, 32);
}
export const ligaBaja = async (env, id) => `${env.SITE_URL}/tienda/simulador-baja?i=${id}&s=${await firmar(env, `dxbaja:${id}`)}`;

// ¿Ya compró ese simulador? (plan propio o paquete de varios simuladores; no cuentan regalos ni cortesías)
const COMPRO = `EXISTS (SELECT 1 FROM orders o JOIN order_items i ON i.order_id = o.id JOIN products p ON p.id = i.product_id
  WHERE lower(o.email) = d.email AND o.estado = 'paid' AND o.proveedor NOT IN ('regalo', 'cortesia')
    AND (p.slug LIKE d.app || '%' OR p.slug LIKE 'simuladores-%' || replace(d.app, 'simulador-', '') || '%'))`;

// ---------------------------------------------------------------------------------------------------------------------
// Correos del seguimiento
// ---------------------------------------------------------------------------------------------------------------------

const pie = baja => `<p style="${P};color:#8b8790;font-size:13px;text-align:center">Te escribimos porque hiciste el diagnóstico gratis. Si ya no quieres estos correos, <a href="${esc(baja)}" style="color:#8b8790;text-decoration:underline">avísanos aquí</a>.</p>`;
const pieTexto = baja => `Te escribimos porque hiciste el diagnóstico gratis. Si ya no quieres estos correos: ${baja}`;

export function correoRetomar(env, sim, d, baja) {
  const n = primerNombre(d.nombre), url = `${env.SITE_URL}${sim.RUTA}/diagnostico/`;
  const asunto = `Tu diagnóstico ${sim.nombre} gratis te espera`;
  const html = marco(asunto, `<p style="${P}">Hola${n ? `, ${esc(n)}` : ''}:</p>
<p style="${P}">Empezaste tu diagnóstico gratis para ${esc(examenDe(sim))} y quedó sin terminar. Son 12 preguntas con tutor, y al final ves tu puntaje estimado y dónde puedes ganar más puntos.</p>
<p style="${P}">Para retomarlo, escribe tu correo en la página y te mandamos una clave nueva.</p>
${boton(url, 'Terminar mi diagnóstico')}
<p style="${P}">Si la clave no te llega, revisa spam o promociones, o escríbenos por <a href="${SOPORTE.whatsapp}" style="color:#6b2a85;text-decoration:underline">WhatsApp</a>.</p>
${pie(baja)}`, { etiqueta: 'Diagnóstico gratis' });
  const texto = `Hola${n ? `, ${n}` : ''}:\n\nEmpezaste tu diagnóstico gratis para ${examenDe(sim)} y quedó sin terminar. Son 12 preguntas con tutor, y al final ves tu puntaje estimado y dónde puedes ganar más puntos.\n\nPara retomarlo, escribe tu correo en la página y te mandamos una clave nueva: ${url}\n\n${pieTexto(baja)}`;
  return { asunto, html, texto };
}

// Sección más débil del diagnóstico y los temas que le tocaron de ella, con su consejo del banco
export function temaDebil(sim, d, r) {
  const sec = r.reforzar || r.secciones?.slice().sort((a, b) => a.aciertos / (a.total || 1) - b.aciertos / (b.total || 1))[0]?.id;
  if (!sec) return null;
  const s = (r.secciones || []).find(x => x.id === sec);
  let items = [];
  try { items = (JSON.parse(d.items || '[]').find(x => x.id === sec)?.items) || []; } catch { }
  const vistos = new Set(), temas = [];
  for (const id of items) {
    const t = sim.BANCO.REACTIVOS.find(x => x.id === id)?.tema;
    const info = t && sim.BANCO.TEMAS[t];
    if (info?.consejo && !vistos.has(t)) { vistos.add(t); temas.push({ nombre: info.nombre, consejo: info.consejo }); }
  }
  return { id: sec, nombre: s?.nombre || sim.BANCO.SECCIONES.find(x => x.id === sec)?.nombre || sec, aciertos: s?.aciertos ?? null, total: s?.total ?? null, temas: temas.slice(0, 3) };
}

export function correoTema(env, sim, d, r, baja) {
  const n = primerNombre(d.nombre), t = temaDebil(sim, d, r);
  const url = `${env.SITE_URL}${sim.RUTA}/?plan=paquete#comprar`;
  const asunto = t ? `Cómo subir en ${t.nombre} para ${examenDe(sim)}` : `Tu siguiente paso para ${examenDe(sim)}`;
  const temasHtml = t?.temas.length ? t.temas.map(x => `<p style="${P};margin-bottom:6px"><b>${esc(x.nombre)}</b></p><p style="${P}">${esc(x.consejo)}</p>`).join('') : '';
  const html = marco(asunto, `<p style="${P}">Hola${n ? `, ${esc(n)}` : ''}:</p>
<p style="${P}">En tu diagnóstico sacaste <b>${esc(textoResultado(r))}</b>.${t ? ` Donde más puntos puedes ganar es <b>${esc(t.nombre)}</b>${t.total ? ` (acertaste ${t.aciertos} de ${t.total})` : ''}.` : ''}</p>
${temasHtml ? `<p style="${P}">Estos son los temas de ${esc(t.nombre)} que te tocaron, con un consejo para cada uno:</p>${temasHtml}` : ''}
<p style="${P}">Un consejo solo sirve si lo practicas. En el plan Completo del ${esc(sim.titulo)} entrenas ${t ? esc(t.nombre) : 'cada sección'} por tema, todas las veces que quieras, con un tutor que te da una pista cuando fallas. Además haces 2 exámenes completos como el real y armas tu plan de estudio hasta la fecha de tu examen.</p>
${boton(url, 'Ver el plan Completo')}
<p style="${P}">¿Dudas? Responde este correo o escríbenos por <a href="${SOPORTE.whatsapp}" style="color:#6b2a85;text-decoration:underline">WhatsApp</a>.</p>
${pie(baja)}`, { etiqueta: 'Diagnóstico gratis' });
  const texto = `Hola${n ? `, ${n}` : ''}:\n\nEn tu diagnóstico sacaste ${textoResultado(r)}.${t ? ` Donde más puntos puedes ganar es ${t.nombre}.` : ''}\n\n${t?.temas.length ? `${t.temas.map(x => `${x.nombre}: ${x.consejo}`).join('\n\n')}\n\n` : ''}En el plan Completo entrenas ${t ? t.nombre : 'cada sección'} por tema con tutor, haces 2 exámenes completos como el real y armas tu plan de estudio: ${url}\n\n${pieTexto(baja)}`;
  return { asunto, html, texto };
}

const fechaHora = iso => new Date(iso).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

export function correoOferta(env, sim, d, r, codigo, hasta, baja) {
  const n = primerNombre(d.nombre), url = `${env.SITE_URL}${sim.RUTA}/?plan=paquete&cupon=${encodeURIComponent(codigo)}#comprar`;
  const asunto = `Tu ${SEG.pct} % para el ${sim.titulo} vence en 3 días`;
  const html = marco(asunto, `<p style="${P}">Hola${n ? `, ${esc(n)}` : ''}:</p>
<p style="${P}">Hace unos días hiciste tu diagnóstico de ${esc(examenDe(sim))} y sacaste ${esc(textoResultado(r))}. Si quieres prepararte en serio, te dejamos un código personal con <b>${SEG.pct} % de descuento</b> en el ${esc(sim.titulo)}:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;width:100%"><tr><td align="center" style="background:#F4F2EF;border-radius:16px;padding:18px 12px"><div style="font-size:26px;font-weight:800;letter-spacing:4px;color:#141114;font-family:'SF Mono',Menlo,Consolas,monospace">${esc(codigo)}</div><div style="font-size:12.5px;color:#8b8790;margin-top:6px">Vence el ${esc(fechaHora(hasta))} · un solo uso</div></td></tr></table>
<p style="${P}">El botón ya lo lleva escrito. Puedes pagar con tarjeta, OXXO o SPEI, y entras en cuanto se confirma el pago.</p>
${boton(url, `Usar mi ${SEG.pct} %`)}
<p style="${P}">Si no es para ti, no pasa nada: este es el último correo de tu diagnóstico.</p>
${pie(baja)}`, { etiqueta: 'Diagnóstico gratis' });
  const texto = `Hola${n ? `, ${n}` : ''}:\n\nHace unos días hiciste tu diagnóstico de ${examenDe(sim)} y sacaste ${textoResultado(r)}. Te dejamos un código personal con ${SEG.pct} % de descuento en el ${sim.titulo}: ${codigo}\n\nVence el ${fechaHora(hasta)} y es de un solo uso. Úsalo aquí: ${url}\n\nSi no es para ti, no pasa nada: este es el último correo de tu diagnóstico.\n\n${pieTexto(baja)}`;
  return { asunto, html, texto };
}

// Código personal: DX-XXXXXX (sin 0/O/1/I para que se lea bien)
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const codigoDx = () => 'DX-' + [...crypto.getRandomValues(new Uint8Array(6))].map(b => LETRAS[b % LETRAS.length]).join('');

// ---------------------------------------------------------------------------------------------------------------------
// Cron: seguimiento del diagnóstico
// ---------------------------------------------------------------------------------------------------------------------

export async function seguimientoDiagnosticos(env, ahora = new Date(), sims = []) {
  const out = { revisados: 0, retomar: 0, tema: 0, oferta: 0, fallidos: 0 };
  if (!enHorario(ahora)) return out;
  const t = ahora.getTime(), iso = x => new Date(x).toISOString();
  const desde = SEGUIMIENTO_DESDE > iso(t - SEG.ventana) ? SEGUIMIENTO_DESDE : iso(t - SEG.ventana);
  const base = `d.seg_baja_at IS NULL AND d.created_at >= '${SEGUIMIENTO_DESDE}' AND NOT ${COMPRO}`;
  const [retomar, tema, oferta] = await Promise.all([
    all(env, `SELECT d.* FROM simulador_diagnosticos d WHERE ${base} AND d.terminado_at IS NULL AND d.seg_retomar_at IS NULL
      AND d.created_at BETWEEN ? AND ? ORDER BY d.created_at LIMIT ?`, desde, iso(t - SEG.retomar), SEG.lote),
    all(env, `SELECT d.* FROM simulador_diagnosticos d WHERE ${base} AND d.resultado IS NOT NULL AND d.seg_tema_at IS NULL
      AND d.terminado_at BETWEEN ? AND ? ORDER BY d.terminado_at LIMIT ?`, desde, iso(t - SEG.tema), SEG.lote),
    all(env, `SELECT d.* FROM simulador_diagnosticos d WHERE ${base} AND d.resultado IS NOT NULL AND d.seg_oferta_at IS NULL
      AND d.seg_tema_at BETWEEN ? AND ? ORDER BY d.seg_tema_at LIMIT ?`, iso(t - SEG.ventana), iso(t - SEG.oferta), SEG.lote),
  ]);
  out.revisados = retomar.length + tema.length + oferta.length;
  const sim = d => sims.find(s => s.APP === d.app);

  // Aparta el paso (si otra corrida ya lo tomó, no entra) y lo regresa si el correo falla
  const paso = async (d, col, armar, extra = async () => {}, deshacer = async () => {}) => {
    const s = sim(d); if (!s) return false;
    const marca = iso(t);
    const u = await run(env, `UPDATE simulador_diagnosticos SET ${col} = ?, updated_at = ? WHERE id = ? AND ${col} IS NULL`, marca, marca, d.id);
    if (!u.meta.changes) return false;
    try {
      const datos = await extra(s);
      const c = await armar(s, await ligaBaja(env, d.id), datos);
      await enviar(env, { para: d.email, asunto: c.asunto, html: c.html, texto: c.texto, idempotencia: `dx-seg-${col}-${d.id}` });
      return true;
    } catch (e) {
      out.fallidos++; console.error('seguimiento dx', col, d.id, correoOculto(d.email), e?.message);
      await run(env, `UPDATE simulador_diagnosticos SET ${col} = NULL WHERE id = ?`, d.id);
      await deshacer();
      return false;
    }
  };

  for (const d of retomar) if (await paso(d, 'seg_retomar_at', (s, baja) => correoRetomar(env, s, d, baja))) out.retomar++;
  for (const d of tema) if (await paso(d, 'seg_tema_at', (s, baja) => correoTema(env, s, d, JSON.parse(d.resultado), baja))) out.tema++;
  for (const d of oferta) {
    let codigo = null;
    const ok = await paso(d, 'seg_oferta_at',
      (s, baja, x) => correoOferta(env, s, d, JSON.parse(d.resultado), x.codigo, x.hasta, baja),
      async () => {
        const hasta = iso(t + SEG.vigencia);
        for (let i = 0; i < 4 && !codigo; i++) {
          const c = codigoDx();
          const r = await run(env, `INSERT OR IGNORE INTO codigos_descuento (codigo, pct, meses, solo_mensual, activo, desde, hasta, max_usos, max_por_app, nombre)
            VALUES (?, ?, NULL, 0, 1, NULL, ?, 1, NULL, ?)`, c, SEG.pct, hasta, `Diagnóstico ${d.app} · ${d.email}`);
          if (r.meta.changes) codigo = c;
        }
        if (!codigo) throw new Error('no se pudo crear el código');
        await run(env, 'UPDATE simulador_diagnosticos SET seg_codigo = ? WHERE id = ?', codigo, d.id);
        return { codigo, hasta };
      },
      async () => { if (codigo) { await run(env, 'UPDATE codigos_descuento SET activo = 0 WHERE codigo = ?', codigo); await run(env, 'UPDATE simulador_diagnosticos SET seg_codigo = NULL WHERE id = ?', d.id); } });
    if (ok) out.oferta++;
  }
  return out;
}

// /tienda/simulador-baja?i=<id>&s=<firma>: GET pide confirmar, POST da de baja
export async function bajaSeguimiento(request, env, url) {
  const id = Number(url.searchParams.get('i')) || 0, s = String(url.searchParams.get('s') || '');
  const valida = id > 0 && /^[0-9a-f]{32}$/.test(s) && iguales(s, await firmar(env, `dxbaja:${id}`));
  const d = valida ? await one(env, 'SELECT id, seg_baja_at FROM simulador_diagnosticos WHERE id = ?', id) : null;
  const pag = (cuerpo, status = 200) => pagina({ titulo: 'Correos del diagnóstico · Vorka México', ruta: '/tienda/', noindex: true, status, cuerpo, headers: { 'referrer-policy': 'same-origin' } });
  if (!d) return pag(aviso({ clase: 'alerta', titulo: 'Esta liga no es válida', texto: 'Si ya no quieres nuestros correos, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> y te damos de baja.' }), 404);
  const listo = aviso({ icono: CHECK, clase: 'exito', titulo: 'Listo, ya no te escribimos', texto: 'No te vamos a mandar más correos sobre tu diagnóstico. Si cambias de opinión, el simulador sigue en vorka.mx.' });
  if (d.seg_baja_at) return pag(listo);
  if (request.method === 'POST') { await run(env, 'UPDATE simulador_diagnosticos SET seg_baja_at = ?, updated_at = ? WHERE id = ?', ahoraISO(), ahoraISO(), id); return pag(listo); }
  return pag(aviso({ titulo: '¿Ya no quieres estos correos?', texto: 'Dejamos de mandarte correos sobre tu diagnóstico gratis.',
    extra: `<form method="post" class="botones t-centro"><button class="btn tinta" type="submit">Sí, darme de baja</button></form>` }));
}

// ---------------------------------------------------------------------------------------------------------------------
// Puntaje real del examen
// ---------------------------------------------------------------------------------------------------------------------

// Escala de cada examen para validar lo que escriben (los que no están: número libre)
export const ESCALAS = {
  'simulador-paa': { min: 200, max: 800, texto: 'Tu puntaje global (de 200 a 800)' },
  'simulador-exani-ii': { min: 700, max: 1300, texto: 'Tu puntaje (Índice Ceneval, de 700 a 1300)' },
  'simulador-prepa-ug': { min: 700, max: 1300, texto: 'Tu puntaje (Índice Ceneval, de 700 a 1300)' },
  'simulador-unam': { min: 0, max: 120, texto: 'Tus aciertos (de 120)' },
  'simulador-ecoems': { min: 0, max: 128, texto: 'Tus aciertos (de 128)' },
};
const escalaDe = app => ESCALAS[app] || { min: 0, max: 2000, texto: 'Tu puntaje o tus aciertos' };

export function correoPuntaje(env, sim, o, url) {
  const n = primerNombre(o.nombre);
  const asunto = `¿Cuánto sacaste en ${examenDe(sim)}?`;
  const html = marco(asunto, `<p style="${P}">Hola${n ? `, ${esc(n)}` : ''}:</p>
<p style="${P}">Te preparaste con el ${esc(sim.titulo)} y queremos saber cómo te fue en ${esc(examenDe(sim))}. Toma menos de un minuto: tu puntaje, a qué universidad aplicaste y si ya sabes si te quedaste.</p>
<p style="${P}">Nos ayuda a revisar qué tan cerca estuvo el simulador del examen real y a mejorarlo para quien viene detrás de ti. Solo lo publicamos si tú nos das permiso, con el nombre que elijas.</p>
${boton(url, 'Contar mi resultado')}
<p style="${P}">¿Todavía no tienes tu resultado? Puedes abrir la liga cuando te llegue: funciona 60 días.</p>
<p style="${P};color:#8b8790;font-size:13px;text-align:center">Te escribimos solo esta vez por este simulador.</p>`, { etiqueta: 'Tu resultado' });
  const texto = `Hola${n ? `, ${n}` : ''}:\n\nTe preparaste con el ${sim.titulo} y queremos saber cómo te fue en ${examenDe(sim)}. Toma menos de un minuto: ${url}\n\nSolo lo publicamos si tú nos das permiso, con el nombre que elijas. La liga funciona 60 días.\n\nTe escribimos solo esta vez por este simulador.`;
  return { asunto, html, texto };
}

export async function pedirPuntajes(env, ahora = new Date(), sims = []) {
  const out = { revisadas: 0, enviadas: 0, fallidas: 0 };
  if (!enHorario(ahora)) return out;
  const t = ahora.getTime(), iso = x => new Date(x).toISOString();
  // Quien usó un simulador: compra con cobro o liga de regalo canjeada, con al menos un resultado guardado
  const filas = await all(env, `SELECT o.id, lower(o.email) email, o.nombre, o.paid_at, json_extract(p.contenido, '$.acceso.app') app, e.fecha_examen
    FROM orders o JOIN order_items i ON i.order_id = o.id JOIN products p ON p.id = i.product_id
    LEFT JOIN simulador_estudio e ON e.email = lower(o.email) AND e.app = json_extract(p.contenido, '$.acceso.app')
    WHERE o.estado = 'paid' AND o.regalo = 0 AND (o.monto_centavos > 0 OR o.proveedor = 'regalo')
      AND json_extract(p.contenido, '$.acceso.app') LIKE 'simulador-%'
      AND COALESCE(json_extract(p.contenido, '$.acceso.tipo'), '') NOT IN ('intento', 'examen')
      AND o.paid_at BETWEEN ? AND ?
      AND EXISTS (SELECT 1 FROM simulador_resultados r WHERE r.order_id = o.id)
      AND NOT EXISTS (SELECT 1 FROM simulador_puntajes s WHERE s.email = lower(o.email) AND s.app = json_extract(p.contenido, '$.acceso.app'))
      AND NOT EXISTS (SELECT 1 FROM resenas_bajas b WHERE b.email = lower(o.email))
    ORDER BY o.paid_at LIMIT 200`, iso(t - PUNTAJE.desde_compra), iso(t - PUNTAJE.minimo));
  const vistos = new Set();
  for (const o of filas) {
    const k = `${o.app}|${o.email}`;
    if (vistos.has(k)) continue; vistos.add(k);
    const pagado = Date.parse(o.paid_at);
    const examen = o.fecha_examen ? Date.parse(`${o.fecha_examen}T12:00:00Z`) : null;
    const toca = examen ? Math.max(examen + PUNTAJE.tras_examen, pagado + PUNTAJE.minimo) : pagado + PUNTAJE.sin_fecha;
    if (t < toca || t > toca + PUNTAJE.ventana) continue;
    const s = sims.find(x => x.APP === o.app); if (!s) continue;
    if (out.revisadas >= PUNTAJE.lote) break;
    out.revisadas++;
    const token = aleatorio(32), hash = await sha256(token);
    const r = await run(env, 'INSERT OR IGNORE INTO simulador_puntajes (token_hash, app, email, order_id, pedida_at) VALUES (?, ?, ?, ?, ?)', hash, o.app, o.email, o.id, iso(t));
    if (!r.meta.changes) continue;
    try {
      const c = correoPuntaje(env, s, o, `${env.SITE_URL}/tienda/puntaje/${token}`);
      await enviar(env, { para: o.email, asunto: c.asunto, html: c.html, texto: c.texto, idempotencia: `puntaje-${o.app}-${hash.slice(0, 24)}` });
      out.enviadas++;
    } catch (e) {
      out.fallidas++; console.error('puntaje: pedir', o.id, correoOculto(o.email), e?.message);
      await run(env, 'DELETE FROM simulador_puntajes WHERE token_hash = ? AND respondida_at IS NULL', hash);
    }
  }
  return out;
}

export const VIGENCIA_PUNTAJE_DIAS = 60;
const QUEDO = { si: 'Sí, me quedé', no: 'No me quedé', espera: 'Todavía no sé' };
const limpiar = (s, max) => String(s ?? '').normalize('NFC').replace(/[\p{Cc}]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

async function puntajePorToken(env, token) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const p = await one(env, 'SELECT * FROM simulador_puntajes WHERE token_hash = ?', await sha256(token));
  if (!p || Date.parse(p.pedida_at) + VIGENCIA_PUNTAJE_DIAS * DIA < Date.now()) return null;
  return p;
}

export function validarPuntaje(app, d) {
  const e = escalaDe(app), quedo = String(d.quedo || '');
  if (!QUEDO[quedo]) return { error: { campo: 'quedo', texto: '¿Te quedaste? Elige una opción.' } };
  const crudo = String(d.puntaje ?? '').replace(/[,\s]/g, '');
  let puntaje = null;
  if (crudo) {
    puntaje = Number(crudo);
    if (!Number.isInteger(puntaje) || puntaje < e.min || puntaje > e.max) return { error: { campo: 'puntaje', texto: `Escribe un número entre ${e.min} y ${e.max}.` } };
  } else if (quedo !== 'espera') return { error: { campo: 'puntaje', texto: 'Escribe tu puntaje.' } };
  const publicar = d.publicar === '1' || d.publicar === 'on';
  const nombre = limpiar(d.nombre, 60);
  if (publicar && nombre.length < 2) return { error: { campo: 'nombre', texto: 'Para publicarlo, escribe con qué nombre quieres aparecer.' } };
  if (/@|https?:|www\./i.test(nombre)) return { error: { campo: 'nombre', texto: 'Escribe solo un nombre (sin correos ni ligas).' } };
  return { puntaje, quedo, universidad: limpiar(d.universidad, 80) || null, comentario: limpiar(d.comentario, 600) || null, publicar: publicar ? 1 : 0, nombre: nombre || null };
}

function formPuntaje(sim, p, token, { v = {}, error = null } = {}) {
  const e = escalaDe(p.app), err = k => (error?.campo === k ? ' aria-invalid="true" aria-describedby="pj-error"' : '');
  const val = { puntaje: p.puntaje ?? '', universidad: p.universidad || '', quedo: p.quedo || '', comentario: p.comentario || '', nombre: p.nombre_publico || '', publicar: !!p.publicar, ...v };
  return `<section class="t-sec"><div class="marco t-estrecho"><div class="rs-caja">
  <p class="rs-et">Tu resultado</p>
  <h1 class="t-h1 rs-h1">¿Cuánto sacaste en ${esc(examenDe(sim))}?</h1>
  <p class="t-lead">Nos ayuda a saber qué tan cerca estuvo el simulador del examen real. Si aún no tienes tu resultado, vuelve con esta misma liga cuando te llegue.</p>
  <form class="rs-form" method="post" action="/tienda/puntaje/${esc(token)}" novalidate>
    ${error ? `<p class="t-error" role="alert" id="pj-error">${esc(error.texto)}</p>` : ''}
    <fieldset class="t-campo"${err('quedo')}><legend>¿Te quedaste en la universidad que querías?</legend>
      ${Object.entries(QUEDO).map(([k, txt]) => `<label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="radio" name="quedo" value="${k}"${val.quedo === k ? ' checked' : ''} required> ${txt}</label>`).join('')}</fieldset>
    <div class="t-campo"><label for="pj-puntaje">${esc(e.texto)}</label>
      <input id="pj-puntaje" name="puntaje" type="number" inputmode="numeric" min="${e.min}" max="${e.max}" value="${esc(val.puntaje)}"${err('puntaje')}>
      <small class="t-ayuda">Si todavía no lo tienes, déjalo vacío y elige «Todavía no sé».</small></div>
    <div class="t-campo"><label for="pj-uni">¿A qué universidad aplicaste? <small>(opcional)</small></label>
      <input id="pj-uni" name="universidad" type="text" maxlength="80" value="${esc(val.universidad)}" placeholder="Por ejemplo, UDEM"></div>
    <div class="t-campo"><label for="pj-com">¿Algo que quieras contarnos? <small>(opcional)</small></label>
      <textarea id="pj-com" name="comentario" rows="4" maxlength="600" placeholder="¿Qué se pareció al examen real? ¿Qué te faltó?">${esc(val.comentario)}</textarea></div>
    <div class="t-campo"><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" name="publicar" value="1"${val.publicar ? ' checked' : ''}> <span>Pueden publicar mi resultado en vorka.mx con el nombre de abajo</span></label></div>
    <div class="t-campo"><label for="pj-nombre">¿Con qué nombre? <small>(solo si aceptas que se publique)</small></label>
      <input id="pj-nombre" name="nombre" type="text" maxlength="60" value="${esc(val.nombre)}" placeholder="Mariana, Monterrey"${err('nombre')}>
      <small class="t-ayuda">Por ejemplo, tu nombre y tu ciudad. Tu correo nunca se publica.</small></div>
    <p class="rs-legal">Puedes cambiar tu respuesta con esta misma liga o pedir que la borremos escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. Más en el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</p>
    <button class="btn acento" type="submit">${p.respondida_at ? 'Guardar cambios' : 'Enviar mi resultado'} ${FLECHA}</button>
  </form></div></div></section>`;
}

const paginaPuntaje = (cuerpo, status = 200) => pagina({ titulo: 'Tu resultado · Vorka México', ruta: '/tienda/', noindex: true, status, cuerpo, headers: { 'referrer-policy': 'no-referrer' } });
const puntajeNoValido = () => paginaPuntaje(aviso({ clase: 'alerta', titulo: 'Esta liga ya no es válida', texto: 'Puede que esté incompleta o que ya hayan pasado 60 días. Si quieres contarnos tu resultado, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.' }), 404);

// /tienda/puntaje/<token>: GET el formulario, POST lo guarda (funciona sin JavaScript)
export async function paginaPuntajeRuta(request, env, token, url, sims) {
  const p = await puntajePorToken(env, token);
  const sim = p && sims.find(s => s.APP === p.app);
  if (!p || !sim) return puntajeNoValido();
  if (request.method !== 'POST') {
    if (url.searchParams.has('gracias')) return paginaPuntaje(aviso({ icono: CHECK, clase: 'exito', titulo: '¡Gracias por contarnos!',
      texto: p.quedo === 'si' ? 'Felicidades. Nos da mucho gusto haberte acompañado.' : p.quedo === 'espera' ? 'Mucha suerte con tu resultado. Cuando lo tengas, puedes actualizarlo con esta misma liga.' : 'Gracias por la confianza. Tu respuesta nos ayuda a mejorar el simulador.',
      extra: `<div class="botones t-centro"><a class="btn blanco" href="/tienda/puntaje/${esc(token)}">Cambiar mi respuesta</a></div>` }));
    return paginaPuntaje(formPuntaje(sim, p, token));
  }
  if (!(await dentroDelLimite(env, `puntaje:${p.token_hash.slice(0, 24)}`, 20, 3600)))
    return paginaPuntaje(aviso({ clase: 'alerta', titulo: 'Demasiados intentos', texto: 'Espera un rato y vuelve a intentarlo.' }), 429);
  let d = {};
  try { d = Object.fromEntries(await request.formData()); } catch { }
  const v = validarPuntaje(p.app, d);
  if (v.error) return paginaPuntaje(formPuntaje(sim, p, token, { v: { puntaje: String(d.puntaje || '').slice(0, 8), universidad: String(d.universidad || '').slice(0, 80), quedo: String(d.quedo || ''), comentario: String(d.comentario || '').slice(0, 600), nombre: String(d.nombre || '').slice(0, 60), publicar: !!d.publicar }, error: v.error }), 422);
  await run(env, `UPDATE simulador_puntajes SET puntaje = ?, universidad = ?, quedo = ?, comentario = ?, nombre_publico = ?, publicar = ?, respondida_at = ? WHERE id = ?`,
    v.puntaje, v.universidad, v.quedo, v.comentario, v.nombre, v.publicar, ahoraISO(), p.id);
  return new Response(null, { status: 303, headers: { location: `/tienda/puntaje/${token}?gracias=1`, 'cache-control': 'no-store' } });
}

// Vorka OS › Tienda › Reseñas › Puntajes: respuestas (y cuántos se pidieron), con el último diagnóstico o simulacro para comparar
export async function puntajesPanel(env) {
  const [filas, conteo] = await Promise.all([
    all(env, `SELECT s.id, s.app, s.email, s.puntaje, s.universidad, s.quedo, s.comentario, s.nombre_publico, s.publicar, s.pedida_at, s.respondida_at
      FROM simulador_puntajes s WHERE s.respondida_at IS NOT NULL ORDER BY s.respondida_at DESC LIMIT 200`),
    one(env, 'SELECT COUNT(*) pedidos, SUM(respondida_at IS NOT NULL) respondidos FROM simulador_puntajes'),
  ]);
  return { pedidos: conteo?.pedidos || 0, respondidos: conteo?.respondidos || 0, puntajes: filas };
}
