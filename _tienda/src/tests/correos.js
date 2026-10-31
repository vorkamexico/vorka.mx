// Tests · correos: el resultado gratis (cuando la persona lo pide) y UN recordatorio al día siguiente («tu resultado te
// espera»), solo si aceptó recibirlo (novedades = 1), no compró y no se dio de baja. Nada más: no hay secuencias.
import { marco, boton, lista, enviar, esc, P } from '../correo.js';
import { all, run, ahoraISO, correoOculto, pesos } from '../util.js';
import { calcular as calcularV } from './vocacional.js';
import { calcular as calcularP } from './proyecto.js';
import { TIPOS } from './vocacional-datos.js';
import { PRODUCTOS_TEST, cuponVigente, horaVence, contar } from './comun.js';

const ENLACE = 'color:#6b2a85;text-decoration:underline';
function contenido(env, f) {
  const def = PRODUCTOS_TEST[f.producto];
  const url = `${env.SITE_URL}${def.ruta}resultado/${f.id}`;
  if (f.producto === 'vocacional') {
    const r = calcularV(f.respuestas);
    return { def, url, titulo: `Tu código vocacional: ${r.codigo}`, puntos: r.tipos.slice(0, 3).map(t => `${TIPOS[t].nombre}: ${TIPOS[t].frase}`), extra: `Tu carrera más afín: ${r.carreras[0].n}.` };
  }
  const r = calcularP(f.respuestas);
  return { def, url, titulo: 'Tus 3 ideas de proyecto social', puntos: r.gratis.map(x => `${x.n}: ${x.l}`), extra: `Tu reporte completo trae ${r.reporte.length} proyectos a detalle.` };
}
const baja = (env, f) => `${env.SITE_URL}${PRODUCTOS_TEST[f.producto].ruta}resultado/${f.id}/baja`;

export async function mandarResultado(env, f) {
  const c = contenido(env, f);
  const cupon = await cuponVigente(env, f);
  const nombre = (f.nombre || '').split(' ')[0];
  const lineaCupon = cupon ? `Por terminar, tienes ${pesos(cupon.monto)} de descuento en el reporte completo con el cupón ${cupon.codigo}. Vence el ${horaVence(cupon.hasta)}.` : '';
  const html = marco(c.titulo, `
<p style="${P}">Hola${nombre ? `, ${esc(nombre)}` : ''}:</p>
<p style="${P}">Aquí está tu resultado de <b>${esc(c.def.nombre)}</b>, para que lo tengas a la mano.</p>
${lista(c.puntos.map(esc))}
<p style="${P}">${esc(c.extra)}</p>
${boton(c.url, 'Ver mi resultado')}
${cupon ? `<p style="${P}">${esc(lineaCupon)}</p>` : ''}
<p style="${P};color:#8b8790;font-size:13px">Es orientativo. Puedes borrar tus respuestas desde tu resultado.${f.novedades ? ` ¿No quieres más correos? <a href="${baja(env, f)}" style="${ENLACE}">Darme de baja</a>.` : ''}</p>`);
  const texto = `Hola${nombre ? `, ${nombre}` : ''}:\n\nTu resultado de ${c.def.nombre}:\n\n${c.puntos.map(x => `- ${x}`).join('\n')}\n\n${c.extra}\n\nVer mi resultado: ${c.url}\n${lineaCupon ? `\n${lineaCupon}\n` : ''}\nVorka México · Guanajuato, México`;
  await enviar(env, { para: f.email, asunto: c.titulo, html, texto, idempotencia: `test-resultado-${f.id}` });
}

export function correoRecordatorio(env, f, cupon) {
  const c = contenido(env, f);
  const nombre = (f.nombre || '').split(' ')[0];
  const asunto = f.producto === 'vocacional' ? 'Tu resultado vocacional te espera' : 'Tus ideas de proyecto social te esperan';
  const lineaCupon = cupon ? `Tu descuento de ${pesos(cupon.monto)} (cupón ${cupon.codigo}) sigue vigente hasta el ${horaVence(cupon.hasta)}.` : '';
  const html = marco(asunto, `
<p style="${P}">Hola${nombre ? `, ${esc(nombre)}` : ''}:</p>
<p style="${P}">Ayer terminaste <b>${esc(c.def.nombre)}</b>. Tu resultado sigue guardado y tu reporte completo está listo para desbloquearse cuando quieras.</p>
${lista(c.puntos.map(esc))}
${boton(c.url, 'Ver mi resultado')}
${cupon ? `<p style="${P}">${esc(lineaCupon)}</p>` : ''}
<p style="${P};color:#8b8790;font-size:13px">Es el único recordatorio que te mandamos. <a href="${baja(env, f)}" style="${ENLACE}">No quiero recibir más correos de esto</a>.</p>`);
  const texto = `Hola${nombre ? `, ${nombre}` : ''}:\n\nAyer terminaste ${c.def.nombre}. Tu resultado sigue guardado:\n${c.url}\n${lineaCupon ? `\n${lineaCupon}\n` : ''}\nEs el único recordatorio que te mandamos. Darte de baja: ${baja(env, f)}\n\nVorka México · Guanajuato, México`;
  return { asunto, html, texto };
}

/**
 * Cron de cada hora: el recordatorio a quien terminó hace 20 a 48 h, aceptó recibirlo, no compró y no se dio de baja.
 * Se marca ANTES de enviar (recordatorio_at), así nunca sale dos veces aunque se crucen corridas.
 */
export async function mandarRecordatorios(env, ahora = new Date(), { limite = 40 } = {}) {
  const t = ahora.getTime();
  const filas = await all(env, `SELECT * FROM tests_resultados r WHERE r.recordatorio_at IS NULL AND r.novedades = 1 AND r.baja = 0 AND r.email IS NOT NULL
      AND r.created_at <= ? AND r.created_at >= ? AND r.respuestas <> '{}'
      AND (r.order_id IS NULL OR r.order_id NOT IN (SELECT id FROM orders WHERE estado = 'paid'))
      AND NOT EXISTS (SELECT 1 FROM tests_resultados x JOIN orders o ON o.id = x.order_id WHERE lower(x.email) = lower(r.email) AND x.producto = r.producto AND o.estado = 'paid')
    ORDER BY r.created_at LIMIT ?`, new Date(t - 20 * 3600e3).toISOString(), new Date(t - 48 * 3600e3).toISOString(), limite);
  let enviados = 0;
  for (const fila of filas) {
    const marcado = await run(env, 'UPDATE tests_resultados SET recordatorio_at = ? WHERE id = ? AND recordatorio_at IS NULL', ahoraISO(), fila.id);
    if (!marcado.meta.changes) continue;
    const f = { ...fila, respuestas: JSON.parse(fila.respuestas || '{}') };
    try {
      await enviar(env, { para: f.email, ...correoRecordatorio(env, f, await cuponVigente(env, f, ahora.toISOString())), idempotencia: `test-recordatorio-${f.id}` });
      await contar(env, f.producto, 'recordatorio');
      enviados++;
    } catch (e) { console.error('tests: recordatorio falló', correoOculto(f.email), e.message); }
  }
  return { revisados: filas.length, enviados };
}
