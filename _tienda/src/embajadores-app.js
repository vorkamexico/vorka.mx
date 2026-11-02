// Embajadores Vorka · pantallas (la lógica vive en embajadores.js):
//   · En la app de Puntos (/tienda/cuenta/): pestaña «Equipo» con tres vistas: Mi equipo (#equipo), Mis ganancias
//     (#ganancias) e Invita (#invita). Se arman aquí y puntos.js las pasa a paginaApp (d.vistasEmbajador).
//   · /tienda/puntos/unete/<código>: registro por invitación (deja la cookie vorka_unete 30 días).
//   · /tienda/puntos/embajadores/: la explicación del programa. PRIVADA (decisión del dueño): solo con sesión en la app de
//     Puntos o con una liga de invitación válida (?i=<código> o la cookie de /unete/). Sin eso, «Pide la liga a quien te
//     invitó». Siempre noindex (meta y X-Robots-Tag), fuera del sitemap y sin ligas desde páginas públicas.
// Nunca se muestran datos de clientes. Del equipo: nombre, nivel, rango y actividad; del nivel 2, nombre público y conteos.
import { esc, pagina } from './paginas.js';
import { all } from './util.js';
import { VENDIBLE } from './modelo.js';
import { PCT_REFERIDO } from './descuentos.js';
import { I, TOKENS, CSS_BASE, CSS_PROGRAMA, formEntrar, SCRIPT_ENTRAR, qrSvg } from './puntos-app.js';
import { invitadorDe, gananciasReales } from './embajadores.js';
import { NIVELES, PCT_RED, PCT_TOPE_VENTA, BONO_ARRANQUE, DIAS_ARRANQUE, LIDER_ACTIVOS, ELITE_LIDERES, RANGOS,
  FACTURAS_SUSCRIPCION, MIN_CUENTAS_GANANCIAS, PCT_TOPE, FACTOR_EQUIPO, puntosDe, pctRed } from './puntos-reglas.js';

const fmt = n => Number(n || 0).toLocaleString('es-MX');
const pesos = c => `$${(Number(c || 0) / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;
const plural = (n, a, b) => `${fmt(n)} ${n === 1 ? a : b}`;
const NOINDEX = { 'x-robots-tag': 'noindex, nofollow' };
const COOKIE_DIAS = 30;
const HONESTO = 'Es gratis. Ganas cuando tú o tu equipo venden a clientes reales; no se gana por invitar.';

// Mensajes listos para pegar
export const mensajeInvita = liga => `Te invito a Embajadores Vorka, el programa de Vorka México para recomendar sus productos (simuladores, invitaciones digitales, apps para negocios). Es gratis y no tienes que comprar nada. Ganas puntos (1 punto = $1) cuando vendes a clientes reales; no se gana por invitar. Regístrate aquí: ${liga}`;
const mensajeAnimo = nombre => `Hola, ${String(nombre || '').split(' ')[0]}. ¿Cómo vas con Vorka? Si quieres, te ayudo a elegir qué producto compartir esta semana y con quién. Tu liga está en tu app: vorka.mx/tienda/cuenta`;

// ---------- vistas dentro de la app ----------
const CSS_EQUIPO = `<style>
.seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:16px;background:var(--s2);margin:0 0 16px}
.seg a{display:grid;place-items:center;min-height:40px;border-radius:12px;font-size:14px;font-weight:650;color:var(--fg2);text-decoration:none}
.seg a[aria-pressed="true"]{background:var(--card);color:var(--fg);box-shadow:0 1px 3px rgba(0,0,0,.18)}
.rango{display:grid;gap:12px}
.rango-cab{display:flex;justify-content:space-between;align-items:center;gap:10px}
.rango-cab b{font-size:20px;letter-spacing:-.02em}.rango-cab small{display:block;color:var(--fg3);font-size:12.5px;font-weight:650;letter-spacing:.06em;text-transform:uppercase}
.insig{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:750;background:var(--s2);border:1px solid var(--line2);white-space:nowrap}
.insig i{width:10px;height:10px;border-radius:50%;background:var(--c);box-shadow:0 0 10px var(--c)}
.rangos3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.rangos3 span{text-align:center;padding:8px 4px;border-radius:12px;background:var(--s1);border:1px solid var(--line);font-size:12px;font-weight:650;color:var(--fg3)}
.rangos3 span.si{color:var(--fg);border-color:var(--c);background:var(--s2)}
.persona{display:grid;grid-template-columns:42px 1fr;gap:12px;align-items:start;padding:14px 2px;border-bottom:1px solid var(--line)}
.persona:last-child{border-bottom:0}
.persona .ini{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--s2);font-weight:750;color:var(--oro2)}
.persona b{font-size:15px;font-weight:650}.persona small{display:block;font-size:13px;color:var(--fg3);margin-top:2px;line-height:1.4}
.persona .alerta{color:var(--pend);font-weight:650}
.persona .acc{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.grupo2{padding:12px 2px;border-bottom:1px solid var(--line)}.grupo2:last-child{border-bottom:0}
.grupo2 b{font-size:14.5px}.grupo2 small{display:block;font-size:13px;color:var(--fg3);margin-top:2px;line-height:1.4}
.gan{display:grid;gap:0}
.gan-f{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 2px;border-bottom:1px solid var(--line);font-size:15px}
.gan-f:last-child{border-bottom:0}.gan-f span small{display:block;font-size:12.5px;color:var(--fg3)}
.gan-f b{font-variant-numeric:tabular-nums;font-size:16px}.gan-f.total b{font-size:20px}
.gan-barra{display:flex;height:10px;border-radius:10px;overflow:hidden;background:var(--s2);margin:4px 0 12px}
.gan-barra i{display:block;height:100%}
.leyenda{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--fg3);margin-bottom:6px}.leyenda span::before{content:"";display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:6px;background:var(--c)}
.msj{overflow-wrap:anywhere}
.honesto{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:18px;background:rgba(94,211,154,.09);border:1px solid rgba(94,211,154,.25);font-size:14.5px;line-height:1.5}
.honesto svg{width:20px;height:20px;flex:none;color:var(--verde);margin-top:1px}
</style>`;

const SEG = [['equipo', 'Mi equipo'], ['ganancias', 'Ganancias'], ['invita', 'Invita']];
const seg = actual => `<nav class="seg" aria-label="Embajadores" style="--i:1">${SEG.map(([k, t]) => `<a href="#${k}" data-ir="${k}" data-seg aria-pressed="${k === actual}">${t}</a>`).join('')}</nav>`;
const colorRango = id => RANGOS.find(r => r.id === id)?.color || '#A8A4A9';

function filaGanancia(t, sub, puntos, c) { return `<div class="gan-f"><span>${c ? `<i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${c};margin-right:8px"></i>` : ''}${t}${sub ? `<small>${sub}</small>` : ''}</span><b>${puntos < 0 ? '−' : ''}${fmt(Math.abs(puntos))} <small style="font-size:12px;color:var(--fg3);font-weight:650">pts</small></b></div>`; }
function bloqueGanancias(g, titulo) {
  const partes = [[Math.max(0, g.mis_ventas), '#C8A45C'], [Math.max(0, g.red1), '#9A4FBF'], [Math.max(0, g.red2), '#5ED39A']], suma = partes.reduce((t, [n]) => t + n, 0);
  return `<div class="card" style="--i:3;margin-bottom:12px"><div class="rango-cab" style="margin-bottom:6px"><div><small>${titulo}</small><b>${fmt(g.total)} puntos</b></div></div>
    ${suma ? `<div class="gan-barra" aria-hidden="true">${partes.filter(([n]) => n).map(([n, c]) => `<i style="width:${(n / suma * 100).toFixed(1)}%;background:${c}"></i>`).join('')}</div>` : ''}
    <div class="gan">
      ${filaGanancia('Mis ventas', g.arranque ? `Incluye ${fmt(g.arranque)} del bono de arranque` : 'Lo que ganas por tus ventas', g.mis_ventas, '#C8A45C')}
      ${filaGanancia('Mi equipo · nivel 1', `${PCT_RED[0]} % de las ventas de quien invitaste`, g.red1, '#9A4FBF')}
      ${filaGanancia('Mi equipo · nivel 2', `${PCT_RED[1]} % de las ventas del equipo de tu equipo`, g.red2, '#5ED39A')}
    </div></div>`;
}

export function vistasEmbajador(d) {
  const E = d.embajadores;
  if (!E) return '';
  const r = E.rango, liga = E.invita?.liga || '', msj = mensajeInvita(liga);
  const progreso = r.id === 'vendedor' ? r.activos / LIDER_ACTIVOS : r.id === 'lider' ? r.lideres / ELITE_LIDERES : 1;
  const persona = p => {
    const ini = esc(String(p.nombre || '?').trim().charAt(0).toUpperCase());
    const animo = p.dias_sin_vender != null ? mensajeAnimo(p.nombre) : null;
    return `<div class="persona"><span class="ini">${ini}</span><div><b>${esc(p.nombre)}</b>
      <small>Nivel ${esc(p.nivel)} · ${plural(p.ventas_mes, 'venta', 'ventas')} este mes${p.rango_id !== 'vendedor' ? ` · <b style="font-size:13px;color:${colorRango(p.rango_id)}">${esc(p.rango)}</b>` : ''}${p.equipo ? ` · ${plural(p.equipo, 'persona', 'personas')} en su equipo` : ''}</small>
      ${p.dias_sin_vender != null ? `<small class="alerta">${p.nunca ? `Aún no vende · se registró hace ${p.dias_sin_vender} días` : `Sin vender hace ${p.dias_sin_vender} días`}</small>
        <div class="acc">${p.whatsapp ? `<a class="pv-btn vidrio chico" href="https://wa.me/${esc(p.whatsapp)}?text=${encodeURIComponent(animo)}" target="_blank" rel="noopener">${I.wa}Darle ánimo</a>` : ''}<button class="pv-btn vidrio chico" type="button" data-copiar="${esc(animo)}">${I.copiar}Copiar mensaje de ánimo</button></div>` : ''}
    </div></div>`;
  };
  const equipo = `
<section class="vista" id="v-equipo" data-vista="equipo" aria-label="Mi equipo" hidden>${CSS_EQUIPO}
  <h1 class="titulo" style="--i:0">Mi <span class="pv-metal">equipo</span></h1>
  ${seg('equipo')}
  <div class="card rango" style="--i:2;--c:${r.color}">
    <div class="rango-cab"><div><small>Tu rango de este mes</small><b>${esc(r.nombre)}</b></div><span class="insig" style="--c:${r.color}"><i></i>${esc(r.nombre)}</span></div>
    <div class="rangos3">${RANGOS.map((x, k) => `<span class="${RANGOS.findIndex(y => y.id === r.id) >= k ? 'si' : ''}" style="--c:${x.color}">${esc(x.nombre)}</span>`).join('')}</div>
    <div class="barra-p"><i data-p="${Math.min(1, progreso)}"></i></div>
    <p class="pv-sub" style="font-size:14px">${r.id === 'vendedor' ? `${plural(r.activos, 'persona', 'personas')} de tu equipo directo ${r.activos === 1 ? 'vendió' : 'vendieron'} este mes. ` : r.id === 'lider' ? `${plural(r.lideres, 'Líder', 'Líderes')} en tu equipo directo. ` : ''}${esc(E.falta)}</p>
    <p class="pv-sub" style="font-size:12.5px">Los rangos son un reconocimiento y se cuentan cada mes: no dan dinero ni puntos extra.</p>
  </div>
  ${E.patrocinador ? `<p class="frase" style="--i:3">Te invitó <b>${esc(E.patrocinador)}</b></p>` : ''}
  <div class="sec-t" style="--i:4"><h2>Tu equipo directo</h2><span style="font-size:13px;color:var(--fg3)">${plural(E.equipo.length, 'persona', 'personas')}</span></div>
  <div class="card lista" style="--i:5;padding:4px 16px">${E.equipo.length ? E.equipo.map(persona).join('')
    : `<div class="vacio">${I.equipo}Aún no tienes equipo. Invita a alguien: quien se registre con tu liga de invitación queda en tu equipo.<br><a class="pv-btn oro chico" href="#invita" data-ir="invita" style="margin-top:12px">Invitar</a></div>`}</div>
  ${E.nivel2.length ? `<div class="sec-t" style="--i:6"><h2>Nivel 2</h2><span style="font-size:13px;color:var(--fg3)">${plural(E.nivel2.reduce((t, g) => t + g.personas, 0), 'persona', 'personas')}</span></div>
  <div class="card lista" style="--i:7;padding:4px 16px">${E.nivel2.map(g => `<div class="grupo2"><b>Equipo de ${esc(g.de)}</b><small>${plural(g.personas, 'persona', 'personas')} · ${g.activos} ${g.activos === 1 ? 'vendió' : 'vendieron'} este mes · ${plural(g.ventas_mes, 'venta', 'ventas')}</small><small>${g.nombres.map(esc).join(', ')}</small></div>`).join('')}</div>` : ''}
  <div class="sec-t" style="--i:8"><h2>Líderes del mes</h2>${d.ranking ? '' : '<button type="button" data-abrir="h-ajustes">Participar</button>'}</div>
  <div class="card" style="--i:9">${E.lideres.length ? `<div class="top">${E.lideres.map(t => `<div class="top-f${t.yo ? ' yo' : ''}"><span>${t.lugar}</span><b>${esc(t.nombre)}${t.yo ? ' (tú)' : ''}</b><em style="color:${colorRango(t.rango_id)}">${esc(t.rango)}</em></div>`).join('')}</div>`
    : `<div class="vacio" style="padding:12px">${I.trofeo}Todavía no hay Líderes este mes.</div>`}
    <p class="pv-sub" style="font-size:13px;margin-top:10px">Aparecen quienes activaron «Aparecer en el Top del mes», con su nombre y la inicial de su apellido.</p></div>
  <p class="legal"><a href="/tienda/puntos/embajadores/">Cómo funciona Embajadores Vorka</a> · Nunca te mostramos datos de los clientes.</p>
</section>`;

  const g = E.ganancias;
  const ganancias = `
<section class="vista" id="v-ganancias" data-vista="ganancias" aria-label="Mis ganancias" hidden>
  <h1 class="titulo" style="--i:0">Mis <span class="pv-metal">ganancias</span></h1>
  ${seg('ganancias')}
  <p class="subt" style="--i:2">En puntos (1 punto = $1 MXN en la tienda), ya con los reembolsos descontados.</p>
  ${bloqueGanancias(g.mes, 'Este mes')}
  ${bloqueGanancias(g.semestre, 'Este semestre')}
  <div class="pv-nota" style="--i:4">${I.ayuda}<span>Tus ventas: el % de tu nivel (${NIVELES[0].pct} % a ${NIVELES.at(-1).pct} %). Tu equipo: ${PCT_RED[0]} % de las ventas de quien invitaste y ${PCT_RED[1]} % de las de su equipo, cuando venden a clientes reales. Invitar no da puntos.</span></div>
</section>`;

  const invita = `
<section class="vista" id="v-invita" data-vista="invita" aria-label="Invita" hidden>
  <h1 class="titulo" style="--i:0"><span class="pv-metal">Invita</span></h1>
  ${seg('invita')}
  <div class="honesto" style="--i:2">${I.check}<span><b>${esc(HONESTO)}</b></span></div>
  <p class="subt" style="--i:3;margin-top:14px">Quien se registre con esta liga queda en tu equipo. Cuando venda, tú ganas ${PCT_RED[0]} % de su venta (y ${PCT_RED[1]} % de las ventas de su equipo). Si ya tenía cuenta, no cambia de equipo. Esta liga es para invitar; para vender usa la de «Compartir».</p>
  ${liga ? `<article class="prod" style="--i:4">
    <div class="liga"><code>${esc(liga.replace(/^https:\/\//, ''))}</code><button class="pv-btn vidrio chico" type="button" data-copiar="${esc(liga)}" aria-label="Copiar liga de invitación">${I.copiar}</button></div>
    <div class="acciones2" style="margin-top:0;grid-template-columns:1fr 1fr">
      <a class="pv-btn oro" href="https://wa.me/?text=${encodeURIComponent(msj)}" target="_blank" rel="noopener">${I.wa}WhatsApp</a>
      <button class="pv-btn vidrio" type="button" data-compartir="${esc(msj)}" data-url="${esc(liga)}" data-titulo="Embajadores Vorka">${I.enviar}Compartir</button>
    </div>
    <div class="qr-caja" style="width:min(220px,100%)">${qrSvg(liga)}</div>
    <button class="pv-btn vidrio chico" type="button" data-qr="inv" style="justify-self:center">${I.qr}Ver QR grande</button>
    <div class="msj">${esc(msj)}<br><button class="pv-enlace" type="button" data-copiar="${esc(msj)}">${I.copiar}Copiar mensaje</button></div>
    <div hidden data-qr-svg="inv" data-qr-liga="${esc(liga.replace(/^https:\/\//, ''))}" data-qr-titulo="Únete a Embajadores Vorka">${qrSvg(liga)}</div>
  </article>` : ''}
  <p class="legal"><a href="/tienda/puntos/embajadores/">Cómo funciona Embajadores Vorka</a></p>
</section>`;
  return equipo + ganancias + invita;
}

// ---------- página del programa (privada) y registro por invitación ----------
const CSS_EMB = `
.em-sec{padding:clamp(40px,6vw,72px) 0}
.em-tabla{width:100%;border-collapse:collapse;margin-top:18px;font-size:15px}
.em-tabla th,.em-tabla td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line)}
.em-tabla th{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--fg-3)}
.em-tabla td b{font-variant-numeric:tabular-nums}
.em-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.em-caja{padding:20px;border-radius:22px;background:var(--card);border:1px solid var(--line);margin-top:18px}
.em-caja h3{font-size:18px;letter-spacing:-.02em;margin:0 0 6px}
.em-caja p,.em-caja li{color:var(--fg-2);font-size:15.5px;line-height:1.55}
.em-lista{display:grid;gap:10px;margin-top:14px;padding-left:20px;list-style:disc}
.em-honesto{display:inline-block;margin-top:18px;padding:12px 16px;border-radius:16px;background:rgba(94,211,154,.12);border:1px solid rgba(94,211,154,.3);color:#CFF5E1;font-weight:650;line-height:1.45}
.em-borrador{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.08em;padding:4px 10px;border-radius:999px;background:#FDECEA;color:#B3261E;margin-bottom:8px}
.em-inv{display:flex;gap:12px;align-items:center;margin-top:16px;color:rgba(244,242,245,.8);font-size:15px}
.em-inv span{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#F0DDA8,#B08A45);color:#1B1408;font-weight:800;flex:none}`;

async function ejemplos(env) {
  const ps = (await all(env, `SELECT p.nombre, p.precio_centavos, p.contenido FROM products p WHERE ${VENDIBLE} AND p.creador_id IS NULL AND p.precio_centavos >= 5000 ORDER BY p.precio_centavos`))
    .filter(p => { try { const c = JSON.parse(p.contenido || '{}'); return !c.oculto && !c.complemento && c.acceso?.app !== 'toolkit'; } catch { return false; } });
  if (!ps.length) return [];
  const idx = [...new Set([0, Math.floor(ps.length / 2), ps.length - 1])];
  return idx.map(i => ps[i]).map(p => {
    const cobrado = p.precio_centavos - Math.round(p.precio_centavos * PCT_REFERIDO / 100);   // con el 5 % del primer pago
    const pv = NIVELES[0].pct, [r1, r2] = pctRed(pv, PCT_REFERIDO);
    return { nombre: p.nombre, precio: p.precio_centavos, cobrado, vendedor: puntosDe(cobrado, pv), n1: puntosDe(cobrado, r1), n2: puntosDe(cobrado, r2) };
  });
}

const CONDICIONES = () => [
  `<b>Participación gratuita.</b> Embajadores Vorka es parte del programa de puntos de Vorka México. Crear una cuenta y participar es gratis. No hay cuota de inscripción, paquete de inicio ni compra mínima, y nadie tiene que comprar nada para participar, mantenerse activo o subir de rango.`,
  `<b>Solo se gana por ventas reales.</b> Los puntos se generan únicamente por compras pagadas de clientes en la tienda de Vorka México. Invitar a otras personas o que se registren no da puntos ni ningún otro beneficio.`,
  `<b>Patrocinador.</b> Quien crea su cuenta con la liga de invitación de otra persona queda en su equipo (esa persona es su patrocinador). Una cuenta que ya existía no cambia de patrocinador al abrir otra liga. Solo Vorka puede cambiar un patrocinador, a petición de la persona o para corregir un error o un abuso, y deja registro del cambio y su motivo; los puntos ya ganados no cambian.`,
  `<b>Ganancias de equipo, dos niveles.</b> Por cada compra que le da puntos a una persona de tu equipo directo, ganas ${PCT_RED[0]} % de lo que se pagó (la misma base de sus puntos: después de descuentos, con IVA, sin productos de creadores); por las de su equipo, ${PCT_RED[1]} %. No hay más niveles. En suscripciones aplica a los pagos que le den puntos a quien vendió, hasta el pago ${FACTURAS_SUSCRIPCION}.`,
  `<b>Tope.</b> En cada compra, la suma de los puntos de quien vendió, las ganancias de equipo y el descuento al cliente no pasa de ${PCT_TOPE_VENTA} % de lo pagado. Si se pasara, se reduce primero lo del nivel 2 y después lo del nivel 1.`,
  `<b>Qué no cuenta.</b> Las compras hechas con el correo de quien vendió, de su patrocinador o del patrocinador de su patrocinador; lo pagado con saldo del Toolkit; y los productos de creadores independientes.`,
  `<b>Bono de arranque.</b> ${BONO_ARRANQUE} puntos, una sola vez, a quien creó su cuenta con una liga de invitación y hace su primera venta dentro de los ${DIAS_ARRANQUE} días siguientes. Se revierte si esa compra se reembolsa.`,
  `<b>Rangos.</b> Vendedor(a), Líder (${LIDER_ACTIVOS} personas de tu equipo directo con al menos una venta en el mes) y Líder Élite (ser Líder y tener ${ELITE_LIDERES} Líderes en tu equipo directo). Se cuentan cada mes en hora del centro de México y son solo un reconocimiento: no dan dinero ni puntos.`,
  `<b>Reembolsos.</b> Si una compra se reembolsa o se desconoce el cargo, se descuentan los puntos que dio, también las ganancias de equipo (en un reembolso parcial, la parte proporcional) y el bono de arranque si fue por esa compra.`,
  `<b>Sin promesa de ingresos.</b> Vorka no garantiza ni promete ganancias. Lo que cada persona gana depende solo de las compras de clientes reales. Los puntos valen $1 MXN cada uno en productos de Vorka México, con las mismas reglas del programa de puntos.`,
  `<b>Datos.</b> Dentro de tu equipo se ve tu nombre, tu nivel, tu rango y cuántas ventas haces; nunca los datos de tus clientes. Del nivel 2 solo se muestran nombres públicos (nombre e inicial del apellido) y conteos.`,
  `Podemos cancelar puntos obtenidos con engaños (compras falsas, cuentas duplicadas o suplantación). Si cambiamos o terminamos el programa, avisaremos con al menos 30 días.`,
];

const sinAcceso = () => pagina({ titulo: 'Embajadores Vorka', ruta: '/tienda/puntos/embajadores/', noindex: true, status: 404, headers: NOINDEX,
  cuerpo: `<section class="t-sec"><div class="marco" style="max-width:640px;text-align:center"><h1 class="h2">Pide la liga a quien te invitó</h1>
    <p class="lead" style="margin-top:12px">Esta página es solo para quienes ya participan o recibieron una invitación.</p>
    <div class="botones t-centro" style="margin-top:20px"><a class="btn tinta" href="/tienda/puntos/">Ir a Puntos Vorka</a></div></div></section>` });

export async function paginaEmbajadores(env, { cuenta, invitador }) {
  if (!cuenta && !invitador) return sinAcceso();
  const ej = await ejemplos(env), reales = await gananciasReales(env);
  const volver = cuenta ? '<a class="pv-btn oro" href="/tienda/cuenta/#equipo">Abrir mi equipo</a>' : `<a class="pv-btn oro" href="/tienda/puntos/unete/${encodeURIComponent(invitador.code)}#entrar">Crear mi cuenta gratis</a>`;
  const [d1, d2] = pctRed(PCT_TOPE, PCT_REFERIDO);
  return pagina({ navOscuro: true, noindex: true, headers: NOINDEX, titulo: 'Embajadores Vorka · cómo funciona', ruta: '/tienda/puntos/embajadores/',
    descripcion: 'Cómo funciona Embajadores Vorka.',
    head: `<style>.pv-lp,#toast{${TOKENS}}${CSS_BASE}${CSS_PROGRAMA}${CSS_EMB}</style>`,
    cuerpo: `
<section class="pv-lp"><div class="marco"><div class="pv-hero" style="grid-template-columns:1fr">
  <div>
    <p class="pv-et"><i></i>Embajadores Vorka</p>
    <h1>Vende a clientes reales.<br>Crece con tu <span class="pv-metal">equipo.</span></h1>
    <p class="lead">Recomiendas productos de la tienda de Vorka México con tu liga y ganas puntos por cada compra. Si invitas a alguien y esa persona vende, también ganas una parte de sus ventas.</p>
    <p class="em-honesto">${esc(HONESTO)}</p>
    ${invitador ? `<div class="em-inv"><span>${esc(invitador.nombre.charAt(0))}</span><div>Te invitó <b>${esc(invitador.nombre)}</b>.</div></div>` : ''}
    <div class="botones">${volver}</div>
  </div>
</div></div></section>
<section class="t-sec"><div class="marco" style="max-width:860px">
  <span class="etiqueta">Cómo se gana</span>
  <h2 class="h2" style="margin-top:14px">Tres formas, todas por ventas</h2>
  <div class="em-caja"><h3>1 · Tus ventas: del ${NIVELES[0].pct} % al ${NIVELES.at(-1).pct} %</h3><p>Cada compra pagada que entra con tu liga te da un % de lo que se pagó, según tu nivel del semestre: ${NIVELES.map(n => `${n.nombre} ${n.pct} %`).join(', ')}. 1 punto = $1 MXN en la tienda.</p></div>
  <div class="em-caja"><h3>2 · Tu equipo: ${PCT_RED[0]} % y ${PCT_RED[1]} %</h3><p>Quien se registra con tu liga de invitación queda en tu equipo. Cuando esa persona vende, ganas ${PCT_RED[0]} % de su venta (nivel 1). Cuando vende alguien a quien ella invitó, ganas ${PCT_RED[1]} % (nivel 2). No hay más niveles. No necesitas vender tú para ganar de tu equipo, pero tu equipo sí tiene que vender a clientes reales.</p></div>
  <div class="em-caja"><h3>3 · Bono de arranque: ${BONO_ARRANQUE} puntos</h3><p>Una sola vez, si haces tu primera venta dentro de tus primeros ${DIAS_ARRANQUE} días. Es para quien empieza, no para quien invita.</p></div>
  <span class="etiqueta" style="margin-top:44px;display:inline-block">Ejemplo con precios de hoy</span>
  ${ej.length ? `<p class="lead" style="margin-top:10px">Precios de la tienda hoy. Quien compra con una liga tiene ${PCT_REFERIDO} % de descuento en su primer pago; todo se calcula sobre lo que pagó. Vendedor en nivel ${NIVELES[0].nombre} (${NIVELES[0].pct} %).</p>
  <div class="em-scroll"><table class="em-tabla"><thead><tr><th>Producto</th><th>Pagó el cliente</th><th>Quien vendió</th><th>Nivel 1 (${PCT_RED[0]} %)</th><th>Nivel 2 (${PCT_RED[1]} %)</th></tr></thead><tbody>
    ${ej.map(x => `<tr><td>${esc(x.nombre)}<br><small style="color:var(--fg-3)">Precio ${pesos(x.precio)}</small></td><td><b>${pesos(x.cobrado)}</b></td><td><b>${fmt(x.vendedor)}</b> pts</td><td><b>${fmt(x.n1)}</b> pts</td><td><b>${fmt(x.n2)}</b> pts</td></tr>`).join('')}
  </tbody></table></div>` : '<p class="lead">Pronto mostraremos un ejemplo con los precios de la tienda.</p>'}
  <p class="t-nota">Los puntos se redondean al entero. Es un ejemplo de cómo se calcula, no una estimación de lo que vas a ganar.</p>
  <span class="etiqueta" style="margin-top:44px;display:inline-block">Tope por venta</span>
  <p class="lead" style="margin-top:10px">En cada compra, lo que gana quien vendió + lo de su equipo + el descuento al cliente no pasa de ${PCT_TOPE_VENTA} % de lo pagado. Ejemplo: alguien del equipo de Vorka en Diamante gana ${PCT_TOPE} % (${NIVELES.at(-1).pct} % × ${FACTOR_EQUIPO}, con tope), más ${PCT_REFERIDO} % de descuento al cliente: queda ${d1} % para el nivel 1 y ${d2} % para el nivel 2.</p>
  <span class="etiqueta" style="margin-top:44px;display:inline-block">Rangos del mes</span>
  <div class="em-caja"><ul class="em-lista"><li><b>Vendedor(a)</b>: al registrarte.</li><li><b>Líder</b>: ${LIDER_ACTIVOS} personas de tu equipo directo con al menos una venta en el mes.</li><li><b>Líder Élite</b>: ser Líder y tener ${ELITE_LIDERES} Líderes en tu equipo directo.</li></ul><p style="margin-top:10px">Son un reconocimiento (insignia en tu app y «Líderes del mes»): no dan dinero ni puntos.</p></div>
  <span class="etiqueta" style="margin-top:44px;display:inline-block">Lo que no cuenta</span>
  <div class="em-caja"><ul class="em-lista"><li>Registrarse o invitar: no da puntos.</li><li>Compras con tu propio correo, o con el de tu patrocinador o el del suyo.</li><li>Lo pagado con saldo del Toolkit y los productos de creadores independientes.</li><li>Compras reembolsadas: se descuentan los puntos de todos (en un reembolso parcial, la parte proporcional).</li></ul></div>
  ${reales.visible ? `<span class="etiqueta" style="margin-top:44px;display:inline-block">Ganancias reales</span>
  <div class="em-caja" id="ganancias-reales"><p>De las ${fmt(reales.cuentas)} cuentas que ganaron puntos en los últimos ${reales.meses} meses, en los meses en que ganaron: <b>promedio ${fmt(reales.promedio)} puntos</b> y <b>mediana ${fmt(reales.mediana)} puntos</b> al mes. Muchas cuentas no ganan nada en un mes; estas cifras no son una promesa de ingresos.</p></div>` : `<!-- Ganancias reales: se muestra con al menos ${MIN_CUENTAS_GANANCIAS} cuentas con ganancias -->`}
</div></section>
<section class="t-sec suave" id="condiciones"><div class="marco" style="max-width:860px">
  <span class="em-borrador">BORRADOR · PENDIENTE DE REVISIÓN LEGAL</span>
  <h2 class="h2" style="margin-top:6px">Condiciones de Embajadores Vorka</h2>
  <p class="lead" style="margin-top:10px">Se suman a las <a href="/legal/terminos/#puntos">condiciones del programa de puntos</a>.</p>
  <div class="em-caja"><ul class="em-lista">${CONDICIONES().map(x => `<li>${x}</li>`).join('')}</ul></div>
</div></section>`,
  });
}

// /tienda/puntos/unete/<código>: registro gratis por invitación. Deja la cookie para que el patrocinador quede aunque la
// persona termine su registro después (o desde la app). Quien ya tiene cuenta no cambia de patrocinador.
export async function paginaUnete(env, { codigo, cuenta }) {
  const inv = await invitadorDe(env, codigo);
  if (!inv) return pagina({ titulo: 'Invitación no válida · Embajadores Vorka', ruta: '/tienda/puntos/', noindex: true, status: 404, headers: NOINDEX,
    cuerpo: `<section class="t-sec"><div class="marco" style="max-width:640px;text-align:center"><h1 class="h2">Esta liga de invitación no es válida</h1><p class="lead" style="margin-top:12px">Pide la liga otra vez a quien te invitó.</p><div class="botones t-centro" style="margin-top:20px"><a class="btn tinta" href="/tienda/puntos/">Ir a Puntos Vorka</a></div></div></section>` });
  const cookie = `vorka_unete=${encodeURIComponent(inv.code)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_DIAS * 86400}`;
  const como = `/tienda/puntos/embajadores/?i=${encodeURIComponent(inv.code)}`;
  return pagina({ navOscuro: true, noindex: true, headers: { ...NOINDEX, 'set-cookie': cookie, 'referrer-policy': 'no-referrer' },
    titulo: `${inv.nombre} te invita a Embajadores Vorka`, ruta: '/tienda/puntos/', descripcion: 'Invitación a Embajadores Vorka.',
    head: `<style>.pv-lp,#toast{${TOKENS}}${CSS_BASE}${CSS_PROGRAMA}${CSS_EMB}</style>`,
    script: cuenta ? '' : SCRIPT_ENTRAR,
    cuerpo: `
<section class="pv-lp" id="entrar"><div class="marco"><div class="pv-form">
  <div>
    <p class="pv-et"><i></i>Invitación · Embajadores Vorka</p>
    <div class="em-inv" style="margin-top:18px"><span>${esc(inv.nombre.charAt(0))}</span><div><b>${esc(inv.nombre)}</b> te invita</div></div>
    <h2 style="margin-top:16px">Recomienda Vorka y gana por cada venta.</h2>
    <p class="lead">Compartes productos de la tienda de Vorka México con tu liga. Cada compra pagada de un cliente te da del ${NIVELES[0].pct} % al ${NIVELES.at(-1).pct} % en puntos (1 punto = $1). Si un día invitas a alguien y vende, también ganas una parte.</p>
    <p class="em-honesto">${esc(HONESTO)}</p>
    <ul>${['Crear tu cuenta es gratis y no tienes que comprar nada.', `Si tu primera venta llega en tus primeros ${DIAS_ARRANQUE} días, te damos ${BONO_ARRANQUE} puntos de bono.`, `<a href="${esc(como)}" style="color:#E6CF96">Lee cómo funciona y las condiciones</a> antes de registrarte.`].map(x => `<li>${I.check}<span>${x}</span></li>`).join('')}</ul>
  </div>
  ${cuenta ? `<div class="pv-entrada pv-ya"><h2>Ya tienes cuenta</h2><p class="pv-sub">Entraste como <b>${esc(cuenta.email)}</b>. Tu equipo no cambia al abrir una invitación.</p><a class="pv-btn oro ancho" href="/tienda/cuenta/">Abrir mi app ${I.flecha}</a></div>`
    : `<div>${formEntrar({ invito: inv.code, condiciones: `${como}#condiciones` })}<p class="pv-sub" style="font-size:13.5px;margin-top:12px;color:rgba(244,242,245,.6)">¿Ya tienes cuenta? Entra con tu correo: tu equipo no cambia.</p></div>`}
</div></div></section>
<div class="toast" id="toast" role="status" aria-live="polite" style="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);opacity:0;pointer-events:none"></div>`,
  });
}
