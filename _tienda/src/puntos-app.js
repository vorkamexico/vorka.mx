// Puntos Vorka · páginas: la mini app (/tienda/cuenta/), su entrada con código, la página del programa (/tienda/puntos/),
// el service worker, el manifiesto y los íconos. Sin frameworks: HTML del servidor + un script inline con nonce.
import { esc, nonce, seguridad, pagina } from './paginas.js';
import { LOGO, FLECHA, CHECK } from './marco.generado.js';
import { ICONOS } from './puntos-iconos.generado.js';
import qrcode from './vendor/qrcode.js';
import { navTienda } from './tienda.js';
import { TEMA_HEAD, selectorTema } from './tema.js';
import { PUNTOS_POR_COMPRA, MULTIPLICADOR_DOBLE, NIVELES, LOGROS, nivelDe, objetivoMeta, ventasPara, nombrePublico } from './puntos-reglas.js';

const SITIO = 'https://vorka.mx';
const TZ = 'America/Mexico_City';

// ---------- íconos (trazo de 24 px) ----------
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const I = {
  inicio: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>'),
  compartir: svg('<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.4M8.3 13.2l7.4 4.4"/>'),
  metas: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
  actividad: svg('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8.5 3 8.5H3S6 15 6 8"/><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/>'),
  copiar: svg('<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>'),
  enviar: svg('<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  qr: svg('<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 18.5v2M18.5 14h2"/>'),
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.5-.3Z"/></svg>',
  tg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.4 4.3 2.9 11.4c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.5ZM9 14.6l9-5.7c.4-.3.8-.1.5.2l-7.7 7-.3 3.2L9 14.6Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  candado: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  ajustes: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  instalar: svg('<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 7.5v7M9 11.5l3 3 3-3"/>'),
  ios: svg('<path d="M12 3v12"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/>'),
  mas: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>'),
  foco: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z"/>'),
  rayo: svg('<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8Z"/>'),
  ojo: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  ojoNo: svg('<path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a9.9 9.9 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  reloj: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  bolsa: svg('<path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>'),
  moneda: svg('<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.4-.9-1.5-1.5-2.8-1.5-1.7 0-2.8.9-2.8 2.1 0 2.8 5.8 1.4 5.8 4.3 0 1.2-1.2 2.2-3 2.2-1.4 0-2.6-.6-3-1.6M12 6v1.7M12 16.3V18"/>'),
  trofeo: svg('<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  salir: svg('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>'),
  flecha: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  cerrar: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  tienda: svg('<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12v8h13v-8"/>'),
  ayuda: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.3-2.5 3.8M12 17.2v.1"/>'),
  correo: svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>'),
};
const LOGRO_ICONO = {
  estrella: svg('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>'),
  fuego: svg('<path d="M12 21c4 0 7-2.7 7-6.8 0-4.6-4-6.4-4.6-10.7C11.6 5.8 10 8.4 10 11c-1.2-.7-2-2-2.2-3.3C6.2 9.3 5 11.6 5 14.2 5 18.3 8 21 12 21Z"/>'),
  cohete: svg('<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9-.8-.8-2.1-.8-2.9-.1Z"/><path d="M12 15 9 12c1.5-4.5 5-8.5 11-9-.5 6-4.5 9.5-9 11Z"/><path d="M9 12H5l2-4h4M12 15v4l4-2v-4"/>'),
  corona: svg('<path d="M3 7.5 7.5 11 12 4.5l4.5 6.5L21 7.5 19 18H5L3 7.5Z"/><path d="M5 21h14"/>'),
  cajas: svg('<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16V8Z"/><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8"/>'),
  rayo: I.rayo, regalo: svg('<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8C10 4.5 6.5 5 7.5 7c.5 1 4.5 1 4.5 1Zm0 0c2-3.5 5.5-3 4.5-1-.5 1-4.5 1-4.5 1Z"/>'),
  diamante: svg('<path d="M6 3.5h12l3.5 5.5L12 20.5 2.5 9 6 3.5Z"/><path d="M2.5 9h19M9 3.5 12 20.5 15 3.5"/>'),
  foco: I.foco, bandera: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'), campana: I.actividad,
};

// ---------- utilidades ----------
const fmt = n => Number(n || 0).toLocaleString('es-MX');
const pesosCortos = c => `$${(Number(c || 0) / 100).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
const plural = (n, a, b) => `${fmt(n)} ${n === 1 ? a : b}`;
const fechaCorta = iso => new Date(iso).toLocaleDateString('es-MX', { timeZone: TZ, day: 'numeric', month: 'short' }).replace('.', '');
function hace(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return 'hace un momento';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  if (s < 172800) return 'ayer';
  return fechaCorta(iso);
}
const terminaTexto = dia => new Date(`${dia}T12:00:00Z`).toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short' }).replace('.', '');
const ligaDe = (ruta, code) => `${SITIO}${ruta}?ref=${encodeURIComponent(code)}`;
const sinProtocolo = u => u.replace(/^https:\/\//, '');
const datosJson = o => JSON.stringify(o).replace(/</g, '\\u003c');

export function qrSvg(texto) {
  const q = qrcode(0, 'M');
  q.addData(texto, 'Byte');
  q.make();
  const n = q.getModuleCount(), m = 2, t = n + m * 2;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + m} ${y + m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges" role="img" aria-label="Código QR de tu liga"><rect width="${t}" height="${t}" fill="#ffffff"/><path d="${d}" fill="#141114"/></svg>`;
}

// Mensajes listos para pegar, según lo que se comparte
function mensajes(c, liga) {
  if (c.tipo === 'simulador') return [`¿Vas a presentar el examen de admisión? Este simulador de la PAA te dice en qué temas vas bien y en cuáles no, con un tutor que te explica cada respuesta: ${liga}`, `Yo lo recomiendo para practicar la PAA antes del examen: ${liga}`];
  if (c.tipo === 'brindi') return [`¿Tienes boda, XV años o bautizo? Con Brindi mandas la invitación por WhatsApp, recibes las confirmaciones y controlas la entrada con QR: ${liga}`, `Las invitaciones digitales de Brindi se ven increíbles y te quitan el lío de las confirmaciones: ${liga}`];
  if (c.tipo === 'cupo') return [`Si organizas fiestas, talleres o eventos: con Cupo tienes página de registro, cover y entrada con QR. Gratis hasta 30 personas: ${liga}`, `Para tu próximo evento prueba Cupo, el registro y el check-in quedan resueltos: ${liga}`];
  if (c.tipo === 'tienda') return [`Mira la tienda de Vorka México: simulador de la PAA, invitaciones digitales, eventos con registro y kits para emprender. ${liga}`];
  return [`Te recomiendo «${c.titulo}»: ${String(c.texto || '').trim()} ${liga}`.replace(/\s+/g, ' '), `Esto te puede servir: ${c.titulo} ${liga}`];
}

// ---------- estilos ----------
const TOKENS = `--bg:#0B090C;--bg2:#121014;--panel:#17141A;--card:rgba(255,255,255,.045);--card2:rgba(255,255,255,.07);--line:rgba(255,255,255,.08);--line2:rgba(255,255,255,.14);
--fg:#F4F2F5;--fg2:rgba(244,242,245,.66);--fg3:rgba(244,242,245,.42);--morado:#6B2A85;--morado2:#9A4FBF;--oro:#C8A45C;--oro2:#E6CF96;--verde:#5ED39A;--rojo:#FF8A7A;
--metal:linear-gradient(100deg,#6f5420 0%,#a8853f 35%,#c8a45c 62%,#8a6a2c 100%);--metal-osc:linear-gradient(100deg,#ffffff 0%,#c9ccd1 40%,#e3c47e 75%,#b8924a 100%);
--btn-oro:linear-gradient(135deg,#F0DDA8 0%,#D4B26A 45%,#B08A45 100%);--ease:cubic-bezier(.2,.8,.2,1);--r:22px;
--s1:rgba(255,255,255,.04);--s2:rgba(255,255,255,.07);--s3:rgba(255,255,255,.14);--hundido:rgba(0,0,0,.28);--campo:rgba(255,255,255,.04);--panel2:#17141A;
--barra-bg:rgba(11,9,12,.9);--tabs-bg:rgba(16,13,18,.9);--avatar-in:#1C1720;--err-t:#FFB4A8;--err-s:rgba(255,138,122,.1);--err-l:rgba(255,138,122,.25);
--toast-bg:#F4F2F5;--toast-t:#141114;--sombra-g:0 30px 80px -30px rgba(0,0,0,.6);--brillo:1;--pend:#E2C27A;
--font:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
// Claro (Puntos Vorka en modo claro): marfil cálido, tinta y oro más oscuro para que se lea sobre fondo claro.
const TOKENS_CLARO = `--bg:#F7F5F2;--bg2:#EFECE8;--panel:#FFFFFF;--card:#FFFFFF;--card2:#F4F2EF;--line:rgba(20,17,20,.08);--line2:rgba(20,17,20,.14);
--fg:#141114;--fg2:#5E5960;--fg3:#8B868C;--oro2:#8A6A2C;--verde:#1F7A4A;--rojo:#C2362C;--morado2:#6B2A85;
--s1:rgba(20,17,20,.03);--s2:rgba(20,17,20,.055);--s3:rgba(20,17,20,.16);--hundido:rgba(20,17,20,.04);--campo:#FFFFFF;--panel2:#FFFFFF;
--barra-bg:rgba(247,245,242,.92);--tabs-bg:rgba(255,255,255,.92);--avatar-in:#FFFFFF;--err-t:#B3261E;--err-s:#FDECEA;--err-l:#F2C2BD;
--toast-bg:#141114;--toast-t:#F4F2F5;--sombra-g:0 24px 60px -30px rgba(20,17,20,.25);--brillo:0;--pend:#8A6D2F`;

const CSS_BASE = `

.pv-metal{background:var(--metal-osc);-webkit-background-clip:text;background-clip:text;color:transparent}
.pv-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 20px;border-radius:999px;border:1px solid transparent;font:inherit;font-size:15.5px;font-weight:650;letter-spacing:-.01em;cursor:pointer;text-decoration:none;transition:transform .18s var(--ease),filter .2s,background .2s,opacity .2s;-webkit-tap-highlight-color:transparent;white-space:nowrap}
.pv-btn svg{width:18px;height:18px;flex:none}.pv-btn:active{transform:scale(.97)}
.pv-btn.oro{background:var(--btn-oro);color:#1B1408;box-shadow:0 10px 30px -10px rgba(200,164,92,.55),inset 0 1px 0 rgba(255,255,255,.5)}
.pv-btn.vidrio{background:var(--s2);border-color:var(--line2);color:var(--fg)}
.pv-btn:focus-visible{outline:2px solid var(--oro2);outline-offset:3px}.pv-btn.vidrio:hover{background:var(--s3)}
.pv-btn.ancho{width:100%}.pv-btn.chico{min-height:40px;padding:0 14px;font-size:14px}
.pv-btn[disabled]{opacity:.65;cursor:progress}
.pv-giro{width:18px;height:18px;border-radius:50%;border:2.2px solid currentColor;border-right-color:transparent;animation:pvgiro .7s linear infinite;flex:none}
@keyframes pvgiro{to{transform:rotate(360deg)}}
.pv-campo{display:grid;gap:7px}.pv-clave{position:relative}.pv-clave input{padding-right:52px}.pv-ojo{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:42px;height:42px;display:grid;place-items:center;border:0;background:none;color:var(--fg3);cursor:pointer;border-radius:12px}.pv-ojo svg{width:20px;height:20px}.pv-campo label{font-size:13.5px;font-weight:650;color:var(--fg2)}
.pv-campo input,.pv-campo textarea{width:100%;min-height:52px;padding:0 16px;border-radius:15px;border:1px solid var(--line2);background:var(--campo);color:var(--fg);font:inherit;font-size:16px;transition:border-color .2s,box-shadow .2s}
.pv-campo textarea{padding:13px 16px;min-height:84px;resize:vertical}
.pv-campo input::placeholder,.pv-campo textarea::placeholder{color:var(--fg3)}
.pv-campo input:focus,.pv-campo textarea:focus{outline:none;border-color:var(--oro);box-shadow:0 0 0 4px rgba(200,164,92,.16)}
.pv-casilla{display:flex;gap:11px;align-items:flex-start;font-size:14px;line-height:1.45;color:var(--fg2);cursor:pointer}
.pv-casilla input{width:20px;height:20px;margin:1px 0 0;accent-color:var(--oro);flex:none}.pv-casilla a{color:var(--oro2)}
.pv-error{margin:0;padding:11px 14px;border-radius:13px;background:var(--err-s);border:1px solid var(--err-l);color:var(--err-t);font-size:14px;font-weight:600}
.pv-entrada{position:relative;background:var(--card);border:1px solid var(--line2);border-radius:26px;padding:24px 20px;display:grid;gap:16px;box-shadow:var(--sombra-g)}
.pv-entrada h2{margin:0;font-size:22px;letter-spacing:-.02em;line-height:1.2}.pv-entrada p{margin:0}
.pv-sub{color:var(--fg2);font-size:15px;line-height:1.5}
.pv-ok-ico{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 30% 30%,#F0DDA8,#B08A45);color:#1B1408;box-shadow:0 0 0 8px rgba(200,164,92,.12);animation:pvpop .5s var(--ease)}
.pv-ok-ico svg{width:28px;height:28px;stroke-width:2.6}
@keyframes pvpop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
.pv-codigo{font-family:"SF Mono",ui-monospace,Menlo,Consolas,monospace;font-size:30px!important;letter-spacing:.42em;text-align:center;font-weight:700;padding-left:.42em!important;min-height:64px!important}
.pv-pie{display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:space-between;align-items:center;font-size:14px;color:var(--fg3)}
.pv-enlace{background:none;border:0;padding:0;font:inherit;color:var(--oro2);font-weight:600;cursor:pointer;text-decoration:none}
.pv-enlace[disabled]{color:var(--fg3);cursor:default}
.pv-nota{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;background:var(--s1);font-size:13.5px;color:var(--fg2);line-height:1.45}
.pv-nota svg{width:18px;height:18px;flex:none;margin-top:1px;color:var(--oro2)}
.pv-paso{animation:pventra .45s var(--ease) both}
@keyframes pventra{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}`;

const CSS_APP = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;background:var(--bg)}
body{margin:0;min-height:100vh;background:var(--bg);color:var(--fg);font-family:var(--font);font-size:16px;line-height:1.45;-webkit-font-smoothing:antialiased;overscroll-behavior-y:none}
body::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:var(--brillo);background:radial-gradient(60% 40% at 85% -5%,rgba(107,42,133,.45),transparent 70%),radial-gradient(50% 35% at -10% 30%,rgba(107,42,133,.18),transparent 70%),radial-gradient(40% 30% at 100% 100%,rgba(200,164,92,.08),transparent 70%);z-index:0}
h1,h2,h3,p{margin:0}button{font:inherit;color:inherit}a{color:inherit}img,svg{display:block;max-width:100%}[hidden]{display:none!important}
:focus-visible{outline:2px solid var(--oro2);outline-offset:3px;border-radius:8px}
.app{position:relative;z-index:1;max-width:520px;overflow-x:clip;margin:0 auto;min-height:100vh;padding:0 16px calc(104px + env(safe-area-inset-bottom))}
.barra{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 -16px;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;background:var(--barra-bg);-webkit-backdrop-filter:saturate(1.4) blur(18px);backdrop-filter:saturate(1.4) blur(18px);border-bottom:1px solid transparent;transition:border-color .2s}
.barra.sombra{border-bottom-color:var(--line)}
.marca{display:flex;align-items:center;gap:10px;font-weight:750;letter-spacing:-.02em;font-size:17px;text-decoration:none}
.marca-v{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(145deg,#2A1633,#141114);border:1px solid rgba(230,207,150,.28);color:var(--oro2)}
.marca-v svg{width:17px;height:17px}.marca small{display:block;font-size:11.5px;font-weight:600;color:var(--fg3);letter-spacing:0;margin-top:1px}
.avatar{position:relative;width:40px;height:40px;border-radius:50%;border:0;padding:2px;background:var(--btn-oro);cursor:pointer}
.avatar span{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:var(--avatar-in);font-weight:750;font-size:16px;color:var(--oro2)}
.vista{padding-top:14px}
.vista>*{animation:pventra .5s var(--ease) both;animation-delay:calc(var(--i,0)*55ms)}
.titulo{font-size:28px;font-weight:780;letter-spacing:-.035em;line-height:1.1;margin:6px 2px 4px}
.subt{color:var(--fg2);font-size:15px;margin:0 2px 18px;line-height:1.5}
.sec-t{display:flex;justify-content:space-between;align-items:baseline;margin:26px 2px 10px}
.sec-t h2{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fg3)}
.sec-t a,.sec-t button{font-size:14px;color:var(--oro2);background:none;border:0;padding:0;cursor:pointer;font-weight:600;text-decoration:none}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px}
.hola{display:flex;justify-content:space-between;align-items:center;margin:4px 2px 14px}
.hola b{font-size:22px;letter-spacing:-.025em;font-weight:760}.hola span{display:block;color:var(--fg3);font-size:13.5px;margin-top:1px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 11px 5px 8px;border-radius:999px;font-size:12.5px;font-weight:700;background:var(--s2);border:1px solid var(--line2);white-space:nowrap}
.chip i{display:inline-block;flex:none;margin-right:2px;width:9px;height:9px;border-radius:50%;background:var(--nivel,#A8A4A9);box-shadow:0 0 10px var(--nivel,#A8A4A9)}
/* tarjeta de saldo */
.saldo{position:relative;overflow:hidden;border-radius:28px;padding:22px 22px 18px;min-height:208px;color:#fff;background:radial-gradient(120% 90% at 100% 0%,rgba(154,79,191,.55),transparent 55%),radial-gradient(90% 80% at 0% 100%,rgba(200,164,92,.22),transparent 60%),linear-gradient(150deg,#2B1638 0%,#1A1020 48%,#120D15 100%);box-shadow:0 30px 60px -28px rgba(107,42,133,.75),inset 0 0 0 1px rgba(255,255,255,.09)}
.saldo::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(135deg,rgba(240,221,168,.7),rgba(255,255,255,.05) 35%,rgba(255,255,255,0) 60%,rgba(200,164,92,.45));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.saldo-v{position:absolute;right:-18px;bottom:-30px;width:170px;color:rgba(230,207,150,.07)}
.saldo-cab{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:650;color:rgba(255,255,255,.7);letter-spacing:.02em}
.saldo-num{display:flex;align-items:baseline;gap:10px;margin-top:16px}
.saldo-num b{font-size:62px;line-height:1;font-weight:800;letter-spacing:-.05em;font-variant-numeric:tabular-nums;background:var(--metal-osc);-webkit-background-clip:text;background-clip:text;color:transparent}
.saldo-num span{font-size:17px;font-weight:650;color:rgba(255,255,255,.75)}
.saldo-mxn{margin-top:6px;font-size:14.5px;color:rgba(255,255,255,.72)}.saldo-mxn b{color:#fff}
.saldo-pie{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;font-size:12px;color:rgba(255,255,255,.55);letter-spacing:.08em;text-transform:uppercase}
.saldo-nivel{display:block;margin-top:3px;font-size:16px;font-weight:800;letter-spacing:-.01em;text-transform:none}
.saldo-pie code{display:block;margin-top:3px;font:700 15px/1 "SF Mono",ui-monospace,Menlo,monospace;letter-spacing:.12em;color:#fff;text-transform:none}
/* nivel */
.nivel{margin-top:12px;display:grid;gap:10px}
.nivel-fila{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:var(--fg2)}.nivel-fila b{color:var(--fg)}
.barra-p{height:9px;border-radius:9px;background:var(--s2);overflow:hidden}
.barra-p i{display:block;height:100%;width:0;border-radius:inherit;background:var(--btn-oro);box-shadow:0 0 14px rgba(230,207,150,.45);transition:width 1.1s var(--ease) .25s}
.saldo-ojo{display:inline-grid;place-items:center;width:36px;height:36px;margin:-8px -8px -8px 0;border:0;border-radius:50%;background:none;color:rgba(255,255,255,.7);cursor:pointer;transition:background .15s,color .15s}
.saldo-ojo:hover{background:rgba(255,255,255,.1);color:#fff}.saldo-ojo svg{width:19px;height:19px}.saldo-ojo .no{display:none}
.pv-oculto .saldo-ojo .si{display:none}.pv-oculto .saldo-ojo .no{display:block}
.pv-oculto [data-sensible]{position:relative;visibility:hidden}.pv-oculto [data-sensible]::after{content:"••••";visibility:visible;position:absolute;left:0;bottom:0;color:#fff;-webkit-text-fill-color:#fff;letter-spacing:.08em}
.saldo-cab-d{display:flex;align-items:center;gap:6px}
.filtros{display:flex;gap:6px;margin:0 2px 10px;overflow-x:auto;scrollbar-width:none}.filtros::-webkit-scrollbar{display:none}
.filtros button{flex:none;min-height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--line2);background:none;color:var(--fg2);font:inherit;font-size:13.5px;font-weight:650;cursor:pointer;transition:background .15s,color .15s}
.filtros button[aria-pressed="true"]{background:var(--fg);border-color:var(--fg);color:var(--bg)}
.mes{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fg3);padding:16px 2px 4px}.mes:first-child{padding-top:8px}
.mov .n{white-space:nowrap}.mov .n small{display:inline;font-size:12px;font-weight:650;color:var(--fg3);margin-left:3px}
.mov.pend .n{color:var(--pend)}.n.usado{color:var(--fg)}.mov-i.pend{background:var(--s2);color:var(--pend)}
.mov .estado{display:inline-block;margin-left:6px;font-size:11px;font-weight:750;padding:2px 7px;border-radius:999px;background:var(--s2);color:var(--pend);vertical-align:1px}
.tema-sel{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:16px;background:var(--s2);margin:10px 0 0}
.tema-sel button{display:grid;justify-items:center;gap:4px;min-height:58px;padding:8px 4px;border:0;border-radius:12px;background:none;color:var(--fg2);font:inherit;font-size:12.5px;font-weight:650;cursor:pointer;transition:background .15s,color .15s}
.tema-sel button svg{width:20px;height:20px}.tema-sel button[aria-checked="true"]{background:var(--card);color:var(--fg);box-shadow:0 1px 3px rgba(0,0,0,.18)}
.tema-cambio,.tema-cambio *{transition:background-color .25s ease,border-color .25s ease,color .25s ease!important}
@media (prefers-reduced-motion:reduce){.tema-cambio,.tema-cambio *{transition:none!important}}
.acciones2{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:10px;margin-top:14px}.acciones2 .pv-btn{padding:0 14px}
/* estadísticas */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px 12px}
.stat svg{width:19px;height:19px;color:var(--oro2);margin-bottom:10px}
.stat span{display:block;line-height:1.3}.stat b{display:block;font-size:24px;font-weight:780;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.stat span{font-size:12.5px;color:var(--fg3)}
.frase{margin:10px 2px 0;font-size:14px;color:var(--fg2)}.frase b{color:var(--fg)}
/* meta */
.meta{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center}
.anillo{position:relative;width:84px;height:84px}.anillo svg{width:84px;height:84px;transform:rotate(-90deg)}
.anillo circle{fill:none;stroke-width:8}.anillo .fondo{stroke:var(--s2)}.anillo .valor{stroke:url(#gOro);stroke-linecap:round;transition:stroke-dashoffset 1.2s var(--ease) .3s}
.anillo b{position:absolute;inset:0;display:grid;place-items:center;font-size:18px;font-weight:780;letter-spacing:-.02em}
.meta h3{font-size:16.5px;letter-spacing:-.015em;line-height:1.3}.meta p{font-size:14px;color:var(--fg2);margin-top:4px}
.meta-ok{color:var(--verde)!important;font-weight:650}
.vacio-meta{display:flex;gap:14px;align-items:center}
.ico-c{width:46px;height:46px;border-radius:15px;flex:none;display:grid;place-items:center;background:rgba(200,164,92,.12);color:var(--oro2)}.ico-c svg{width:22px;height:22px}
/* tarjetas promocionales */
.promo{display:flex;gap:14px;align-items:center;margin-top:12px}
.promo h3{font-size:15.5px;letter-spacing:-.01em}.promo p{font-size:13.5px;color:var(--fg2);margin-top:3px;line-height:1.45}
.promo .pv-btn{margin-top:10px}
.ico-in{display:inline-block;width:17px;height:17px;vertical-align:-3px;color:var(--oro2)}.ico-in svg{width:17px;height:17px}
.promo.doble{background:linear-gradient(135deg,rgba(200,164,92,.16),rgba(107,42,133,.12));border-color:rgba(230,207,150,.25)}
.cerrar-x{margin-left:auto;align-self:flex-start;background:none;border:0;color:var(--fg3);padding:2px;cursor:pointer}.cerrar-x svg{width:18px;height:18px}
/* compartir */
.codigo-card{display:flex;justify-content:space-between;align-items:center;gap:12px}
.codigo-card small{display:block;color:var(--fg3);font-size:12.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.codigo-card>div{min-width:0}.codigo-card .pv-btn{flex:none}.codigo-card code{overflow-wrap:anywhere;display:block;font:800 clamp(17px,5vw,24px)/1.2 "SF Mono",ui-monospace,Menlo,monospace;letter-spacing:.1em;margin-top:2px}
.prods{display:grid;gap:14px}
.prod{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px;display:grid;grid-template-columns:minmax(0,1fr);gap:14px}.prod>*{min-width:0}
.prod-top{display:grid;grid-template-columns:62px minmax(0,1fr);gap:14px;align-items:center}
.prod-img{position:relative;width:62px;height:62px;border-radius:16px;overflow:hidden;background:linear-gradient(145deg,#2B1638,#141114);display:grid;place-items:center;color:var(--oro2);border:1px solid var(--line)}
.prod-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.prod-img svg{width:26px;height:26px}
.prod h3{font-size:16px;letter-spacing:-.015em;line-height:1.25}.prod p{font-size:13.5px;color:var(--fg2);margin-top:3px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.insignia{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:750;background:var(--btn-oro);color:#1B1408;width:max-content}
.insignia svg{width:13px;height:13px;stroke-width:2.4}
.liga{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 14px;border-radius:14px;background:var(--hundido);border:1px solid var(--line)}
.liga code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 13px "SF Mono",ui-monospace,Menlo,monospace;color:var(--fg2)}
.redes{display:grid;grid-template-columns:1.6fr repeat(4,1fr);gap:8px}
.red{display:grid;place-items:center;height:46px;border-radius:14px;border:1px solid var(--line);background:var(--s1);color:var(--fg);cursor:pointer;text-decoration:none;transition:transform .15s var(--ease),background .2s}
.red:active{transform:scale(.95)}.red svg{width:20px;height:20px}
.red.prin{display:flex;gap:8px;font-weight:700;font-size:14.5px;background:var(--btn-oro);color:#1B1408;border:0}
.red.wa{color:#43D27A}.red.tg{color:#4FB3F0}
.msjs summary{list-style:none;cursor:pointer;font-size:14px;font-weight:650;color:var(--oro2);display:flex;align-items:center;gap:6px}
.msjs summary::-webkit-details-marker{display:none}.msjs summary::after{content:"";width:7px;height:7px;border-right:2px solid;border-bottom:2px solid;transform:rotate(45deg) translateY(-2px);transition:transform .2s}
.msjs[open] summary::after{transform:rotate(225deg)}
.msj{margin-top:10px;padding:12px 14px;border-radius:14px;background:var(--s1);border:1px dashed var(--line2);font-size:14px;color:var(--fg2);line-height:1.5}
.msj .pv-enlace{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:13.5px}.msj svg{width:15px;height:15px}
/* metas */
.niveles{position:relative;display:grid;gap:4px}
.nv{position:relative;display:grid;grid-template-columns:44px 1fr auto;gap:14px;align-items:center;padding:12px 14px;border-radius:18px}
.nv-p{position:relative;z-index:1;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:13px;color:#141114;background:var(--c);box-shadow:0 0 0 4px var(--bg)}
.nv:not(:last-child)::after{content:"";position:absolute;left:35px;top:50px;height:calc(100% - 30px);width:2px;background:var(--line2)}
.nv.ok:not(:last-child)::after{background:linear-gradient(var(--c),var(--line2))}
.nv.bloq .nv-p{background:var(--s2);color:var(--fg3);box-shadow:0 0 0 4px var(--bg),inset 0 0 0 1px var(--line2)}
.nv.bloq .nv-p svg{width:17px;height:17px}
.nv b{font-size:15.5px}.nv small{display:block;font-size:13px;color:var(--fg3);margin-top:1px}
.nv em{font-style:normal;font-size:12.5px;font-weight:700;color:var(--fg3)}
.nv.actual{background:var(--s2);border:1px solid var(--line2)}
.nv.actual .nv-p{box-shadow:0 0 0 4px var(--bg),0 0 22px var(--c)}
.nv.actual em{color:var(--oro2)}
.logros{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.logro{display:grid;justify-items:center;text-align:center;gap:8px;padding:16px 8px 14px;border-radius:18px;background:var(--card);border:1px solid var(--line)}
.logro i{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 30% 25%,#F0DDA8,#B08A45 70%);color:#1B1408;box-shadow:0 8px 22px -8px rgba(200,164,92,.7)}
.logro i svg{width:22px;height:22px;stroke-width:2}
.logro b{font-size:12.5px;line-height:1.25}.logro small{font-size:11px;color:var(--fg3);line-height:1.3}
.logro.no i{background:var(--s2);color:var(--fg3);box-shadow:inset 0 0 0 1px var(--line2)}.logro.no b{color:var(--fg2)}
.sug{display:grid;gap:10px}
.sug-item{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:12px 2px;border-top:1px solid var(--line)}
.sug-item b{font-size:14.5px;font-weight:600}.sug-item small{display:block;color:var(--fg3);font-size:12.5px;margin-top:2px}
.pill{flex:none;font-size:11.5px;font-weight:750;padding:4px 9px;border-radius:999px;background:var(--s2);color:var(--fg2)}
.pill.aceptada{background:rgba(94,211,154,.14);color:var(--verde)}.pill.descartada{color:var(--fg3)}
.top{display:grid;gap:2px}
.top-f{display:grid;grid-template-columns:30px 1fr auto;gap:12px;align-items:center;padding:10px 6px;border-radius:12px}
.top-f.yo{background:rgba(200,164,92,.12)}
.top-f span{font-weight:800;color:var(--fg3);text-align:center}.top-f:nth-child(1) span{color:#E3C47E}.top-f:nth-child(2) span{color:#C9CCD1}.top-f:nth-child(3) span{color:#C98B5A}
.top-f em{font-style:normal;font-size:13.5px;color:var(--fg2);font-variant-numeric:tabular-nums}
/* actividad */
.lista{display:grid}
.mov{display:grid;grid-template-columns:42px 1fr auto;gap:12px;align-items:center;padding:12px 2px;border-bottom:1px solid var(--line)}
.mov:last-child{border-bottom:0}
.mov-i{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--s2)}
.mov-i svg{width:19px;height:19px}
.mov b{font-size:15px;font-weight:650}.mov small{display:block;font-size:13px;color:var(--fg3);margin-top:1px;line-height:1.35}
.mov .n{font-weight:780;font-size:16px;font-variant-numeric:tabular-nums}
.n.mas{color:var(--verde)}.n.menos{color:var(--rojo)}
.mov-i.mas{background:rgba(94,211,154,.12);color:var(--verde)}.mov-i.menos{background:rgba(255,138,122,.12);color:var(--rojo)}.mov-i.oro{background:rgba(200,164,92,.14);color:var(--oro2)}
.aviso-f{position:relative;display:grid;grid-template-columns:42px 1fr;gap:12px;padding:12px 2px;border-bottom:1px solid var(--line);text-decoration:none}
.aviso-f:last-child{border-bottom:0}
.aviso-f b{font-size:15px;font-weight:650}.aviso-f p{font-size:13.5px;color:var(--fg2);margin-top:2px;line-height:1.4}.aviso-f small{display:block;font-size:12px;color:var(--fg3);margin-top:4px}
.aviso-f.nueva::after{content:"";position:absolute;right:4px;top:18px;width:9px;height:9px;border-radius:50%;background:var(--oro2);box-shadow:0 0 10px var(--oro2)}
.vacio{text-align:center;padding:26px 16px;color:var(--fg2);font-size:14.5px}.vacio svg{width:34px;height:34px;margin:0 auto 10px;color:var(--fg3)}
/* barra de pestañas */
.tabs{position:fixed;z-index:30;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:520px;display:grid;grid-template-columns:repeat(4,1fr);padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:var(--tabs-bg);-webkit-backdrop-filter:saturate(1.5) blur(22px);backdrop-filter:saturate(1.5) blur(22px);border-top:1px solid var(--line)}
.tab{position:relative;display:grid;justify-items:center;gap:3px;padding:6px 0 4px;border:0;background:none;color:var(--fg3);font-size:11px;font-weight:650;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .2s}
.tab svg{width:24px;height:24px;transition:transform .25s var(--ease)}
.tab[aria-current="page"]{color:var(--oro2)}.tab[aria-current="page"] svg{transform:translateY(-1px) scale(1.06)}
.tab[aria-current="page"]::before{content:"";position:absolute;top:-9px;width:22px;height:3px;border-radius:0 0 3px 3px;background:var(--btn-oro)}
.tab .badge{position:absolute;top:3px;left:calc(50% + 6px);min-width:17px;height:17px;padding:0 5px;border-radius:9px;background:#E5484D;color:#fff;font-size:10.5px;font-weight:800;display:grid;place-items:center;border:2px solid var(--bg)}
/* hojas (ajustes, QR, meta, sugerir) */
.hoja{position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center}
.hoja-fondo{position:absolute;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:aparece .25s ease both}
.hoja-panel{position:relative;width:100%;max-width:520px;max-height:88vh;overflow:auto;background:var(--panel2);border:1px solid var(--line2);border-bottom:0;border-radius:28px 28px 0 0;padding:10px 20px calc(24px + env(safe-area-inset-bottom));animation:sube .38s var(--ease) both;overscroll-behavior:contain}
@keyframes sube{from{transform:translateY(100%)}to{transform:none}}@keyframes aparece{from{opacity:0}}
.hoja.sale .hoja-panel{animation:baja .25s ease both}.hoja.sale .hoja-fondo{animation:aparece .25s ease reverse both}
@keyframes baja{to{transform:translateY(100%)}}
.asa{width:40px;height:5px;border-radius:5px;background:var(--line2);margin:0 auto 14px}
.hoja h2{font-size:21px;letter-spacing:-.02em;margin-bottom:4px}.hoja .pv-sub{margin-bottom:16px}
.hoja-cab{display:flex;justify-content:space-between;align-items:center;gap:10px}
.grupo{background:var(--s1);border:1px solid var(--line);border-radius:18px;margin-top:12px}
.opcion{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid var(--line);text-decoration:none;font-size:15px}
.opcion:last-child{border-bottom:0}.opcion small{display:block;font-size:13px;color:var(--fg3);margin-top:2px;line-height:1.35}
.opcion>svg{width:20px;height:20px;color:var(--fg3);flex:none}
button.opcion{width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer;color:inherit}
.switch{position:relative;width:52px;height:32px;flex:none}
.switch input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}
.switch i{position:absolute;inset:0;border-radius:32px;background:var(--s3);transition:background .25s}
.switch i::after{content:"";position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:transform .25s var(--ease)}
.switch input:checked+i{background:var(--oro)}.switch input:checked+i::after{transform:translateX(20px)}
.switch input:disabled+i{opacity:.5}
.qr-caja{background:#fff;border-radius:24px;padding:18px;width:min(280px,100%);margin:6px auto 14px;box-shadow:0 20px 50px -20px rgba(200,164,92,.5)}
.qr-caja svg{width:100%;height:auto}
.metas-op{display:grid;gap:8px;margin-top:6px}
.meta-op{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:14px 16px;border-radius:16px;border:1px solid var(--line);background:var(--s1);cursor:pointer}
.meta-op input{position:absolute;opacity:0}.meta-op:has(input:checked){border-color:var(--oro);background:rgba(200,164,92,.1)}
.meta-op b{font-size:14.5px;font-weight:650}.meta-op small{display:block;font-size:12.5px;color:var(--fg3);margin-top:2px}.meta-op em{font-style:normal;font-weight:750;font-size:14px;color:var(--oro2)}
.toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));z-index:60;transform:translate(-50%,20px);opacity:0;pointer-events:none;padding:12px 18px;border-radius:999px;background:var(--toast-bg);color:var(--toast-t);font-weight:650;font-size:14.5px;box-shadow:0 12px 30px rgba(0,0,0,.3);transition:opacity .25s,transform .3s var(--ease);white-space:nowrap}
.toast.ver{opacity:1;transform:translate(-50%,0)}
.legal{margin:26px 2px 0;font-size:12.5px;color:var(--fg3);line-height:1.5;text-align:center}.legal a{color:var(--fg2)}
/* entrada sin sesión */
.entrar-app{min-height:100vh;display:grid;align-content:center;gap:26px;padding:calc(30px + env(safe-area-inset-top)) 0 calc(30px + env(safe-area-inset-bottom))}
.entrar-hero{text-align:center;display:grid;justify-items:center;gap:12px}
.entrar-hero .marca-v{width:72px;height:72px;border-radius:22px;box-shadow:0 20px 50px -15px rgba(107,42,133,.8)}.entrar-hero .marca-v svg{width:34px;height:34px}
.entrar-hero h1{font-size:34px;letter-spacing:-.04em;line-height:1.05;font-weight:800}
.entrar-hero p{color:var(--fg2);font-size:16px;max-width:340px;line-height:1.5}
.ventajas{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
.ventajas span{font-size:12.5px;font-weight:650;color:var(--fg2);padding:6px 11px;border-radius:999px;background:var(--s1);border:1px solid var(--line)}
@media (min-width:760px){
  .app{padding-top:12px}
  .tabs{bottom:16px;border-radius:24px;border:1px solid var(--line2);width:calc(100% - 32px);max-width:488px;padding-bottom:8px;box-shadow:0 20px 50px -20px rgba(0,0,0,.8)}
  .tab[aria-current="page"]::before{top:-8px}
  .hoja{align-items:center}.hoja-panel{border-radius:28px;border-bottom:1px solid var(--line2);max-height:84vh}
  .toast{bottom:110px}
}`;

// ---------- piezas compartidas ----------
const V = LOGO.replace('<svg ', '<svg width="100%" ');

// Formulario de entrada (página del programa y app sin sesión): primero el correo; la app sabe si ya tienes cuenta.
// Nueva → nombre + contraseña. Con contraseña → entrar. Sin contraseña (cuentas de antes) u olvido → código al correo para crearla.
const ojo = id => `<button class="pv-ojo" type="button" data-ojo="${id}" aria-label="Mostrar contraseña">${I.ojo || '👁'}</button>`;
export const formEntrar = ({ enApp = false } = {}) => `
<div class="pv-entrada" id="pv-entrada">
  <form class="pv-paso" id="pv-p-correo" novalidate>
    <div style="display:grid;gap:16px">
      <div><h2>${enApp ? 'Entra o crea tu cuenta' : 'Crea tu cuenta o entra'}</h2><p class="pv-sub" style="margin-top:6px">Escribe tu correo: si ya tienes cuenta, te pedimos tu contraseña; si no, la creas en un minuto.</p></div>
      <div class="pv-campo"><label for="pv-email">Correo electrónico</label><input id="pv-email" name="email" type="email" inputmode="email" autocomplete="username" required maxlength="254" placeholder="tu@correo.com"></div>
      <p class="pv-error" role="alert" hidden></p>
      <button class="pv-btn oro ancho" type="submit"><span>Continuar</span>${I.flecha}</button>
      <div class="pv-pie"><span>Usa el correo con el que compras en la tienda.</span></div>
    </div>
  </form>
  <form class="pv-paso" id="pv-p-nueva" novalidate hidden>
    <div style="display:grid;gap:16px">
      <div><h2>Crea tu cuenta</h2><p class="pv-sub" style="margin-top:6px"><b class="pv-correo"></b> · <button class="pv-enlace" type="button" data-cambiar>Cambiar</button></p></div>
      <div class="pv-campo"><label for="pv-nombre">Tu nombre</label><input id="pv-nombre" name="nombre" type="text" autocomplete="name" required maxlength="80" placeholder="Ana López"></div>
      <div class="pv-campo"><label for="pv-clave-n">Crea una contraseña</label><div class="pv-clave"><input id="pv-clave-n" name="clave" type="password" autocomplete="new-password" required minlength="8" maxlength="200" placeholder="Mínimo 8 caracteres">${ojo('pv-clave-n')}</div></div>
      <label class="pv-casilla"><input type="checkbox" name="terminos" required><span>Acepto las <a href="/legal/terminos/#puntos" target="_blank" rel="noopener">condiciones del programa</a> y el <a href="/privacidad/" target="_blank" rel="noopener">aviso de privacidad</a>.</span></label>
      <p class="pv-error" role="alert" hidden></p>
      <button class="pv-btn oro ancho" type="submit"><span>Crear mi cuenta</span>${I.flecha}</button>
    </div>
  </form>
  <form class="pv-paso" id="pv-p-clave" novalidate hidden>
    <div style="display:grid;gap:16px">
      <div><h2 id="pv-hola">Hola de nuevo</h2><p class="pv-sub" style="margin-top:6px">Ya tienes cuenta con <b class="pv-correo"></b> · <button class="pv-enlace" type="button" data-cambiar>Cambiar</button></p></div>
      <div class="pv-campo"><label for="pv-clave">Tu contraseña</label><div class="pv-clave"><input id="pv-clave" name="clave" type="password" autocomplete="current-password" required maxlength="200">${ojo('pv-clave')}</div></div>
      <p class="pv-error" role="alert" hidden></p>
      <button class="pv-btn oro ancho" type="submit"><span>Entrar</span>${I.flecha}</button>
      <div class="pv-pie"><button class="pv-enlace" type="button" id="pv-olvide">¿Olvidaste tu contraseña?</button></div>
    </div>
  </form>
  <form class="pv-paso" id="pv-p-codigo" novalidate hidden>
    <div style="display:grid;gap:16px">
      <div><h2>Crea tu contraseña</h2><p class="pv-sub" style="margin-top:6px" id="pv-cod-txt">Te mandamos un código de 6 dígitos a <b class="pv-correo"></b>. Escríbelo aquí junto con tu nueva contraseña.</p></div>
      <div class="pv-campo"><label for="pv-cod">Código de 6 dígitos</label><input class="pv-codigo" id="pv-cod" name="codigo" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="······"></div>
      <div class="pv-campo"><label for="pv-clave-c">Nueva contraseña</label><div class="pv-clave"><input id="pv-clave-c" name="clave" type="password" autocomplete="new-password" required minlength="8" maxlength="200" placeholder="Mínimo 8 caracteres">${ojo('pv-clave-c')}</div></div>
      <p class="pv-error" role="alert" hidden></p>
      <button class="pv-btn oro ancho" type="submit"><span>Guardar y entrar</span>${I.flecha}</button>
      <div class="pv-nota">${I.correo}<span>¿No llega? Revisa spam o promociones. El código vence en 15 minutos.</span></div>
      <div class="pv-pie"><button class="pv-enlace" type="button" id="pv-reenviar" disabled>Reenviar en 60 s</button><button class="pv-enlace" type="button" data-cambiar>Cambiar correo</button></div>
      <p class="pv-sub" id="pv-dev" hidden style="font-size:13px"></p>
    </div>
  </form>
</div>`;

// Script del formulario: nunca deja la pantalla congelada (carga, éxito, error y tiempo límite visibles)
export const SCRIPT_ENTRAR = String.raw`(function(){
  var raiz=document.getElementById('pv-entrada'); if(!raiz) return;
  var P={correo:document.getElementById('pv-p-correo'),nueva:document.getElementById('pv-p-nueva'),clave:document.getElementById('pv-p-clave'),codigo:document.getElementById('pv-p-codigo')};
  var email='', timer=null, re=document.getElementById('pv-reenviar'), dev=document.getElementById('pv-dev');
  function ir(k){ for(var x in P) P[x].hidden=x!==k; [].forEach.call(raiz.querySelectorAll('.pv-correo'),function(b){ b.textContent=email; });
    [].forEach.call(raiz.querySelectorAll('.pv-error'),function(e){ e.hidden=true; });
    var f=P[k].querySelector('input:not([type=checkbox])'); setTimeout(function(){ try{ f&&f.focus({preventScroll:true}); }catch(e){} },250); }
  function error(form,msg){ var e=form.querySelector('.pv-error'); e.textContent=msg; e.hidden=false; }
  function cargando(b,si,txt){ if(si){ b.dataset.html=b.innerHTML; b.disabled=true; b.innerHTML='<span class="pv-giro"></span><span>'+txt+'</span>'; } else { b.disabled=false; if(b.dataset.html) b.innerHTML=b.dataset.html; } }
  function llamar(url,datos){
    var ctl=window.AbortController?new AbortController():null, t=setTimeout(function(){ if(ctl) ctl.abort(); },20000);
    return fetch(url,{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(datos),signal:ctl?ctl.signal:undefined})
      .then(function(r){ clearTimeout(t); return r.json().catch(function(){ return {}; }).then(function(j){ return {ok:r.ok,status:r.status,j:j}; }); })
      .catch(function(err){ clearTimeout(t); return {ok:false,j:{error:err&&err.name==='AbortError'?'Tardó demasiado. Revisa tu conexión e intenta de nuevo.':'Sin conexión. Revisa tu internet e intenta de nuevo.'}}; });
  }
  function adentro(b){ b.innerHTML='<span class="pv-giro"></span><span>¡Bienvenido!</span>'; location.href='/tienda/cuenta/'; }
  function cuenta(seg){ clearInterval(timer); re.disabled=true; var s=seg; re.textContent='Reenviar en '+s+' s';
    timer=setInterval(function(){ s--; if(s<=0){ clearInterval(timer); re.disabled=false; re.textContent='Reenviar código'; } else re.textContent='Reenviar en '+s+' s'; },1000); }
  function pedirCodigo(texto){ document.getElementById('pv-cod-txt').innerHTML=(texto||'Te mandamos un código de 6 dígitos a')+' <b class="pv-correo"></b>. Escríbelo aquí junto con tu nueva contraseña.'; ir('codigo');
    return llamar('/api/puntos/clave/codigo',{email:email}).then(function(x){ if(!x.ok){ error(P.codigo,x.j.error||'No se pudo enviar el código.'); re.disabled=false; re.textContent='Reenviar código'; return; }
      cuenta(x.j.reenviar_en||60); if(x.j.codigo){ dev.hidden=false; dev.innerHTML='Modo prueba (sin correo): código <b>'+x.j.codigo+'</b>'; } }); }
  // 1) correo
  P.correo.addEventListener('submit',function(ev){ ev.preventDefault(); var f=P.correo, b=f.querySelector('button[type=submit]');
    var em=f.email.value.trim().toLowerCase(); if(!em||!f.email.checkValidity()){ error(f,'Escribe un correo válido.'); f.email.focus(); return; }
    email=em; cargando(b,true,'Revisando…');
    llamar('/api/puntos/existe',{email:em}).then(function(x){ cargando(b,false); if(!x.ok){ error(f,x.j.error||'No se pudo revisar. Intenta de nuevo.'); return; }
      if(!x.j.existe) ir('nueva');
      else if(x.j.con_clave){ document.getElementById('pv-hola').textContent=x.j.nombre?'Hola de nuevo, '+x.j.nombre:'Hola de nuevo'; ir('clave'); }
      else pedirCodigo('Ya tienes cuenta. Para entrar, crea tu contraseña (solo esta vez). Te mandamos un código a'); });
  });
  // 2) cuenta nueva
  P.nueva.addEventListener('submit',function(ev){ ev.preventDefault(); var f=P.nueva, b=f.querySelector('button[type=submit]');
    if(f.nombre.value.trim().length<2){ error(f,'Escribe tu nombre.'); f.nombre.focus(); return; }
    if(f.clave.value.length<8){ error(f,'La contraseña debe tener al menos 8 caracteres.'); f.clave.focus(); return; }
    if(!f.terminos.checked){ error(f,'Acepta las condiciones del programa para continuar.'); return; }
    cargando(b,true,'Creando tu cuenta…');
    llamar('/api/puntos/registro',{email:email,nombre:f.nombre.value.trim(),clave:f.clave.value,terminos:true}).then(function(x){
      if(x.ok) return adentro(b); cargando(b,false);
      if(x.j.existe){ if(x.j.con_clave) ir('clave'); else pedirCodigo('Ese correo ya tiene cuenta. Para entrar, crea tu contraseña. Te mandamos un código a'); return; }
      error(f,x.j.error||'No se pudo crear la cuenta. Intenta de nuevo.'); });
  });
  // 3) entrar con contraseña
  P.clave.addEventListener('submit',function(ev){ ev.preventDefault(); var f=P.clave, b=f.querySelector('button[type=submit]');
    if(!f.clave.value){ error(f,'Escribe tu contraseña.'); f.clave.focus(); return; }
    cargando(b,true,'Entrando…');
    llamar('/api/puntos/login',{email:email,clave:f.clave.value}).then(function(x){ if(x.ok) return adentro(b); cargando(b,false);
      if(x.j.existe===false){ ir('nueva'); return; } if(x.j.con_clave===false){ pedirCodigo(); return; }
      error(f,x.j.error||'No se pudo entrar.'); f.clave.select(); });
  });
  document.getElementById('pv-olvide').onclick=function(){ pedirCodigo('Para crear una contraseña nueva, te mandamos un código a'); };
  // 4) código + contraseña nueva
  P.codigo.addEventListener('submit',function(ev){ ev.preventDefault(); var f=P.codigo, b=f.querySelector('button[type=submit]');
    var c=f.codigo.value.replace(/\D/g,''); if(c.length!==6){ error(f,'El código tiene 6 dígitos.'); f.codigo.focus(); return; }
    if(f.clave.value.length<8){ error(f,'La contraseña debe tener al menos 8 caracteres.'); f.clave.focus(); return; }
    cargando(b,true,'Guardando…');
    llamar('/api/puntos/clave/nueva',{email:email,codigo:c,clave:f.clave.value}).then(function(x){ if(x.ok) return adentro(b); cargando(b,false); error(f,x.j.error||'No se pudo guardar. Intenta de nuevo.'); });
  });
  document.getElementById('pv-cod').addEventListener('input',function(e){ e.target.value=e.target.value.replace(/\D/g,'').slice(0,6); });
  re.onclick=function(){ pedirCodigo(); };
  [].forEach.call(raiz.querySelectorAll('[data-cambiar]'),function(b){ b.onclick=function(){ clearInterval(timer); ir('correo'); P.correo.email.value=email; }; });
  [].forEach.call(raiz.querySelectorAll('[data-ojo]'),function(b){ b.onclick=function(){ var i=document.getElementById(b.dataset.ojo); i.type=i.type==='password'?'text':'password'; b.setAttribute('aria-label',i.type==='password'?'Mostrar contraseña':'Ocultar contraseña'); }; });
})();`;

// ---------- documento de la app ----------
function documento({ titulo, cuerpo, script, status = 200 }) {
  const n = nonce();
  const html = `<!doctype html>
<html lang="es-MX" data-app="puntos">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script nonce="${n}">${TEMA_HEAD}try{if(localStorage.getItem('pv-ocultar-saldo')==='1')document.documentElement.classList.add('pv-oculto');}catch(e){}</script>
<title>${esc(titulo)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Tu liga, tus puntos y tus metas del programa de puntos de Vorka México.">
<meta name="theme-color" content="#0B090C" data-claro="#F7F5F2" data-oscuro="#0B090C">
<meta name="color-scheme" content="dark light">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Puntos Vorka">
<link rel="manifest" href="/tienda/cuenta/manifest.webmanifest">
<link rel="icon" href="/tienda/cuenta/iconos/192.png" type="image/png">
<link rel="apple-touch-icon" href="/tienda/cuenta/iconos/180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>:root{${TOKENS};color-scheme:dark}:root[data-tema="claro"]{${TOKENS_CLARO};color-scheme:light}@media (prefers-color-scheme:light){:root:not([data-tema]){${TOKENS_CLARO};color-scheme:light}}${CSS_BASE}${CSS_APP}</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="gOro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0DDA8"/><stop offset=".55" stop-color="#D4B26A"/><stop offset="1" stop-color="#B08A45"/></linearGradient></defs></svg>
${cuerpo}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script nonce="${n}">${script}</script>
</body>
</html>`;
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...seguridad(n) } });
}

// App sin sesión: entrada con correo y código (funciona dentro de la app instalada)
export function paginaEntrarApp() {
  return documento({
    titulo: 'Puntos Vorka',
    cuerpo: `<div class="app"><main class="entrar-app">
  <div class="entrar-hero pv-paso">
    <span class="marca-v">${V}</span>
    <h1>Puntos <span class="pv-metal">Vorka</span></h1>
    <p>Comparte lo que te gusta de la tienda y gana descuentos. Cada compra con tu liga son ${PUNTOS_POR_COMPRA} puntos = $${PUNTOS_POR_COMPRA}.</p>
    <div class="ventajas"><span>Puntos dobles</span><span>Metas y niveles</span><span>Avisos al instante</span></div>
  </div>
  ${formEntrar({ enApp: true })}
  <p class="legal">Vorka México · <a href="/tienda/puntos/">Cómo funciona</a> · <a href="/legal/terminos/#puntos">Condiciones</a></p>
</main></div>`,
    script: SCRIPT_ENTRAR + SCRIPT_SW,
  });
}

const SCRIPT_SW = String.raw`
if('serviceWorker' in navigator) window.addEventListener('load',function(){ navigator.serviceWorker.register('/tienda/cuenta/sw.js',{scope:'/tienda/cuenta/'}).catch(function(){}); });`;

const TIPOS_MOV = {
  ganado: ['Ganaste', 'mas', I.moneda], revertido: ['Se revirtió', 'menos', I.flecha], canje: ['Usaste en la tienda', 'oro', I.bolsa],
  devuelto: ['Te regresamos', 'mas', I.flecha], ajuste: ['Ajuste', 'oro', I.ajustes], bono: ['Bono', 'oro', I.rayo],
};
const ICONO_AVISO = { ganado: I.moneda, nivel: I.trofeo, meta: LOGRO_ICONO.bandera, sugerencia: I.foco, promo: I.rayo };

// Movimientos agrupados por mes (hora de México), con signo y unidad
function movimientosPorMes(lista) {
  let mes = '';
  return lista.map(m => {
    const [t, c, ic] = TIPOS_MOV[m.tipo] || [m.tipo, 'oro', I.moneda];
    const este = new Date(m.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: TZ });
    const cab = este !== mes ? `<p class="mes">${esc(este)}</p>` : ''; mes = este;
    return `${cab}<div class="mov" data-signo="${m.puntos >= 0 ? 'mas' : 'menos'}"><span class="mov-i ${c}">${ic}</span><div><b>${t}${m.multiplicador > 1 && m.tipo === 'ganado' ? ' · doble' : ''}</b><small>${m.nota ? `${esc(m.nota)} · ` : ''}${fechaCorta(m.created_at)}</small></div><span class="n ${m.puntos >= 0 ? 'mas' : m.tipo === 'canje' ? 'usado' : 'menos'}">${m.puntos >= 0 ? '+' : '−'}${fmt(Math.abs(m.puntos))}<small>pts</small></span></div>`;
  }).join('');
}

function anillo(p, centro) {
  const r = 36, c = 2 * Math.PI * r;
  return `<div class="anillo"><svg viewBox="0 0 84 84"><circle class="fondo" cx="42" cy="42" r="${r}"/><circle class="valor" cx="42" cy="42" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}" data-offset="${(c * (1 - p)).toFixed(1)}"/></svg><b>${centro}</b></div>`;
}

export function paginaApp(env, d) {
  const n = d.nivel, inicial = (d.nombre || d.email).trim().charAt(0).toUpperCase();
  const s = d.saldo;
  const metaHtml = d.meta ? (() => {
    const p = d.meta.objetivo ? Math.min(1, s.disponibles / d.meta.objetivo) : 1, faltan = Math.max(0, d.meta.objetivo - s.disponibles), ventas = ventasPara(faltan);
    return `<div class="meta">${anillo(p, `${Math.round(p * 100)}%`)}<div><span class="chip" style="margin-bottom:8px">Mi meta</span><h3>${esc(d.meta.nombre)}</h3>
      ${faltan ? `<p>Te faltan <b>${plural(faltan, 'punto', 'puntos')}</b> · unas <b>${plural(ventas, 'venta', 'ventas')}</b> con tu liga.</p>` : '<p class="meta-ok">¡Ya te alcanza! Lo pagas con solo $10.</p>'}
      <button class="pv-enlace" type="button" data-abrir="h-meta" style="margin-top:8px;font-size:14px">Cambiar meta</button></div></div>`;
  })() : `<div class="vacio-meta"><span class="ico-c">${LOGRO_ICONO.bandera}</span><div><h3 style="font-size:16px">Ponte una meta</h3><p class="pv-sub" style="font-size:14px;margin-top:2px">Elige un producto de la tienda y te decimos cuántas ventas te faltan para llevártelo.</p>
      <button class="pv-btn vidrio chico" type="button" data-abrir="h-meta" style="margin-top:10px">Elegir mi meta</button></div></div>`;

  const dobles = d.compartir.filter(c => c.ids.some(id => d.dobles[id]));
  const dobleDe = c => c.ids.map(id => d.dobles[id]).filter(Boolean).sort((a, b) => (a.motivo === 'sugerencia' ? -1 : 1))[0];
  const tarjetasCompartir = [...d.compartir, { ruta: '/tienda/', titulo: 'Toda la tienda', tipo: 'tienda', texto: 'Simulador, invitaciones, eventos y kits para emprender.', ids: [], imagen: null }];

  const inicio = `
<section class="vista" id="v-inicio" data-vista="inicio" aria-label="Inicio">
  <div class="hola" style="--i:0"><div><span>Hola,</span><b>${esc(String(d.nombre).split(' ')[0])}</b></div><span class="chip" style="--nivel:${n.actual.color}"><i></i>Nivel ${esc(n.actual.nombre)}</span></div>
  <div class="saldo" style="--i:1">
    <span class="saldo-v">${V}</span>
    <div class="saldo-cab"><span>Tu saldo</span><span class="saldo-cab-d">Puntos Vorka<button class="saldo-ojo" type="button" id="b-ocultar" aria-pressed="false" aria-label="Ocultar saldo"><span class="si">${I.ojo}</span><span class="no">${I.ojoNo}</span></button></span></div>
    <div class="saldo-num"><b data-sensible>${fmt(s.disponibles)}</b><span>${s.disponibles === 1 ? 'punto' : 'puntos'}</span></div>
    <p class="saldo-mxn">= <b data-sensible>$${fmt(s.disponibles)} MXN</b> para usar en la tienda${s.apartados ? ` · <a href="#actividad" data-ir="actividad" style="color:inherit">${fmt(s.apartados)} apartados</a> en una compra por pagar` : ''}</p>
    <div class="saldo-pie"><span>Tu código<code>${esc(d.code)}</code></span><span style="text-align:right">${plural(d.ventas, 'venta', 'ventas')}<b class="saldo-nivel" style="color:${n.actual.color}">${esc(n.actual.nombre)}</b></span></div>
  </div>
  <div class="card nivel" style="--i:2">
    <div class="nivel-fila"><span><b>${esc(n.actual.nombre)}</b>${n.siguiente ? ` → ${esc(n.siguiente.nombre)}` : ''}</span><span>${n.siguiente ? `${plural(n.faltan, 'venta más', 'ventas más')}` : 'Nivel máximo'}</span></div>
    <div class="barra-p"><i data-p="${n.progreso}"></i></div>
  </div>
  <div class="acciones2" style="--i:3"><button class="pv-btn oro" type="button" data-ir="compartir">${I.compartir}Compartir mi liga</button><a class="pv-btn vidrio" href="/tienda/">${I.bolsa}Usar puntos</a></div>
  <div class="sec-t" style="--i:4"><h2>Últimos 7 días</h2></div>
  <div class="stats" style="--i:5">
    <div class="stat">${I.ojo}<b data-contar="${d.semana.visitas}">${fmt(d.semana.visitas)}</b><span>Visitas a tu liga</span></div>
    <div class="stat">${I.bolsa}<b data-contar="${d.semana.compras}">${fmt(d.semana.compras)}</b><span>Compras</span></div>
    <div class="stat">${I.moneda}<b data-contar="${d.semana.puntos}">${fmt(d.semana.puntos)}</b><span>Puntos</span></div>
  </div>
  <p class="frase" style="--i:6">${d.semana.visitas ? `<b>${plural(d.semana.visitas, 'persona abrió', 'personas abrieron')}</b> tu liga esta semana.` : 'Nadie ha abierto tu liga esta semana. Compártela en tus grupos y estados.'}</p>
  <div class="sec-t" style="--i:7"><h2>Mi meta</h2></div>
  <div class="card" style="--i:8">${metaHtml}</div>
  ${dobles.length ? `<div class="card promo doble" style="--i:9"><span class="ico-c">${I.rayo}</span><div><h3>Puntos dobles en ${esc(dobles[0].titulo)}${dobles.length > 1 ? ` y ${dobles.length - 1} más` : ''}</h3><p>Cada compra con tu liga ${dobleDe(dobles[0]).termina ? `hasta el ${terminaTexto(dobleDe(dobles[0]).termina)}` : ''} vale ${PUNTOS_POR_COMPRA * MULTIPLICADOR_DOBLE} puntos.</p><button class="pv-btn oro chico" type="button" data-ir="compartir">Compartir ahora</button></div></div>` : ''}
  <div class="card promo" id="c-instalar" hidden style="--i:10"><span class="ico-c">${I.instalar}</span><div><h3>Ponla en tu inicio</h3><p id="c-instalar-t">Tenla a un toque, como una app, para ver tus puntos y tu meta.</p><p id="c-instalar-and" hidden>En Chrome toca el menú <b>⋮</b> (arriba a la derecha) y elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</p><p id="c-instalar-ios" hidden>En Safari toca <b>Compartir</b> <span class="ico-in">${I.ios}</span> y luego <b>Agregar a inicio</b>. Así la tienes como app y recibes avisos.</p><button class="pv-btn oro chico" type="button" id="b-instalar" hidden>Instalar app</button></div><button class="cerrar-x" type="button" data-descartar="instalar" aria-label="Ahora no">${I.cerrar}</button></div>
  <div class="card promo" id="c-avisos" hidden style="--i:11"><span class="ico-c">${I.actividad}</span><div><h3>Entérate al instante</h3><p id="c-avisos-t">Te avisamos cuando alguien compre con tu liga, subas de nivel o alcances tu meta.</p><button class="pv-btn oro chico" type="button" id="b-avisos">Activar avisos</button></div><button class="cerrar-x" type="button" data-descartar="avisos" aria-label="Ahora no">${I.cerrar}</button></div>
  <div class="card promo" style="--i:12"><span class="ico-c">${I.foco}</span><div><h3>Sugiere un producto, gana el doble</h3><p>Si lo agregamos a la tienda, ganas ${PUNTOS_POR_COMPRA * MULTIPLICADOR_DOBLE} puntos por cada compra de ese producto con tu liga.</p><button class="pv-btn vidrio chico" type="button" data-abrir="h-sugerir">Sugerir</button></div></div>
</section>`;

  const compartir = `
<section class="vista" id="v-compartir" data-vista="compartir" aria-label="Compartir" hidden>
  <h1 class="titulo" style="--i:0">Comparte y <span class="pv-metal">gana</span></h1>
  <p class="subt" style="--i:1">Cada compra con tu liga son ${PUNTOS_POR_COMPRA} puntos (${PUNTOS_POR_COMPRA * MULTIPLICADOR_DOBLE} con puntos dobles). La persona tiene 30 días para comprar.</p>
  <div class="card codigo-card" style="--i:2"><div><small>Tu código</small><code>${esc(d.code)}</code></div><button class="pv-btn vidrio chico" type="button" data-copiar="${esc(ligaDe('/tienda/', d.code))}">${I.copiar}Copiar liga</button></div>
  <div class="sec-t" style="--i:3"><h2>Elige qué compartir</h2></div>
  <div class="prods">${tarjetasCompartir.map((c, i) => {
    const liga = ligaDe(c.ruta, c.code || d.code), doble = dobleDe(c), msjs = mensajes(c, liga), principal = msjs[0];
    const sinLiga = principal.replace(liga, '').trim();
    return `<article class="prod" style="--i:${4 + i}">
      <div class="prod-top"><div class="prod-img">${c.tipo === 'tienda' ? I.tienda : V}${c.imagen ? `<img src="${esc(c.imagen)}" alt="" loading="lazy" decoding="async">` : ''}</div>
        <div>${doble ? `<span class="insignia">${I.rayo}Puntos dobles${doble.motivo === 'sugerencia' ? ' · tu idea' : doble.termina ? ` · hasta ${terminaTexto(doble.termina)}` : ''}</span>` : ''}<h3 style="${doble ? 'margin-top:6px' : ''}">${esc(c.titulo)}</h3><p>${esc(c.texto || '')}</p></div></div>
      <div class="liga"><code>${esc(sinProtocolo(liga))}</code><button class="pv-btn vidrio chico" type="button" data-copiar="${esc(liga)}" aria-label="Copiar liga de ${esc(c.titulo)}">${I.copiar}</button></div>
      <div class="redes">
        <button class="red prin" type="button" data-compartir="${esc(principal)}" data-url="${esc(liga)}" data-titulo="${esc(c.titulo)}">${I.enviar}Compartir</button>
        <a class="red wa" href="https://wa.me/?text=${encodeURIComponent(principal)}" target="_blank" rel="noopener" aria-label="Compartir por WhatsApp">${I.wa}</a>
        <a class="red tg" href="https://t.me/share/url?url=${encodeURIComponent(liga)}&amp;text=${encodeURIComponent(sinLiga)}" target="_blank" rel="noopener" aria-label="Compartir por Telegram">${I.tg}</a>
        <a class="red" href="https://x.com/intent/post?text=${encodeURIComponent(principal)}" target="_blank" rel="noopener" aria-label="Compartir en X">${I.x}</a>
        <button class="red" type="button" data-qr="${i}" aria-label="Ver código QR">${I.qr}</button>
      </div>
      <details class="msjs"><summary>Mensajes listos para pegar</summary>${msjs.map(m => `<div class="msj">${esc(m)}<br><button class="pv-enlace" type="button" data-copiar="${esc(m)}">${I.copiar}Copiar mensaje</button></div>`).join('')}</details>
      <div hidden data-qr-svg="${i}" data-qr-liga="${esc(sinProtocolo(liga))}" data-qr-titulo="${esc(c.titulo)}">${qrSvg(liga)}</div>
    </article>`;
  }).join('')}</div>
</section>`;

  const metas = `
<section class="vista" id="v-metas" data-vista="metas" aria-label="Metas" hidden>
  <h1 class="titulo" style="--i:0">Tus <span class="pv-metal">metas</span></h1>
  <p class="subt" style="--i:1">Sube de nivel con cada compra que entra con tu liga. Los niveles son reconocimiento: tus puntos valen lo mismo en todos.</p>
  <div class="card" style="--i:2">${metaHtml}</div>
  <div class="sec-t" style="--i:3"><h2>Niveles</h2><span style="font-size:13px;color:var(--fg3)">${plural(d.ventas, 'venta', 'ventas')}</span></div>
  <div class="card niveles" style="--i:4;padding:8px">${NIVELES.map((x, k) => {
    const ok = d.ventas >= x.min, actual = k === n.indice;
    return `<div class="nv${ok ? ' ok' : ' bloq'}${actual ? ' actual' : ''}" style="--c:${x.color}"><span class="nv-p">${ok ? I.check.replace('<svg ', '<svg width="20" ') : I.candado}</span><div><b>${esc(x.nombre)}</b><small>${esc(x.texto)}</small></div><em>${actual ? 'Tu nivel' : x.min ? `${x.min}+ ventas` : 'Inicio'}</em></div>`;
  }).join('')}</div>
  <div class="sec-t" style="--i:5"><h2>Logros</h2><span style="font-size:13px;color:var(--fg3)">${d.logros.filter(l => l.ok).length} de ${d.logros.length}</span></div>
  <div class="logros" style="--i:6">${d.logros.map(l => `<div class="logro${l.ok ? '' : ' no'}" title="${esc(l.texto)}"><i>${LOGRO_ICONO[l.icono] || I.check}</i><b>${esc(l.nombre)}</b><small>${esc(l.texto)}</small></div>`).join('')}</div>
  <div class="sec-t" style="--i:7"><h2>Sugiere un producto</h2><button type="button" data-abrir="h-sugerir">Nueva idea</button></div>
  <div class="card sug" style="--i:8">
    <div class="promo" style="margin:0"><span class="ico-c">${I.foco}</span><div><h3>¿Qué le falta a la tienda?</h3><p>Si aceptamos tu idea y la convertimos en producto, ganas <b>puntos dobles</b> (${PUNTOS_POR_COMPRA * MULTIPLICADOR_DOBLE} por compra) en ese producto con tu liga.</p><button class="pv-btn oro chico" type="button" data-abrir="h-sugerir">Sugerir un producto</button></div></div>
    ${d.sugerencias.length ? `<div>${d.sugerencias.map(x => `<div class="sug-item"><div><b>${esc(x.idea)}</b><small>${fechaCorta(x.created_at)}${x.producto ? ` · Ahora es «${esc(x.producto)}»` : ''}${x.nota ? ` · ${esc(x.nota)}` : ''}</small></div><span class="pill ${x.estado}">${{ nueva: 'En revisión', aceptada: 'Aceptada', descartada: 'No por ahora' }[x.estado]}</span></div>`).join('')}</div>` : ''}
  </div>
  <div class="sec-t" style="--i:9"><h2>Top del mes</h2>${d.ranking ? '' : '<button type="button" data-abrir="h-ajustes">Participar</button>'}</div>
  <div class="card" style="--i:10">${d.top.length ? `<div class="top">${d.top.map(t => `<div class="top-f${t.yo ? ' yo' : ''}"><span>${t.lugar}</span><b>${esc(t.nombre)}${t.yo ? ' (tú)' : ''}</b><em>${plural(t.ventas, 'venta', 'ventas')}</em></div>`).join('')}</div>`
    : `<div class="vacio" style="padding:12px">${I.trofeo}${d.ranking ? 'Aún no hay ventas este mes. ¡La primera puede ser tuya!' : 'Nadie aparece todavía.'}</div>`}
    ${d.ranking ? '' : '<p class="pv-sub" style="font-size:13.5px;margin-top:10px">Es opcional: solo aparecen quienes lo activan, con su nombre y la inicial de su apellido.</p>'}</div>
</section>`;

  const actividad = `
<section class="vista" id="v-actividad" data-vista="actividad" aria-label="Actividad" hidden>
  <h1 class="titulo" style="--i:0">Actividad</h1>
  <p class="subt" style="--i:1">Tus avisos y cada movimiento de tus puntos.</p>
  <div class="sec-t" style="--i:2"><h2>Avisos</h2></div>
  <div class="card lista" style="--i:3;padding:6px 16px">${d.notificaciones.length ? d.notificaciones.map(a => `<a class="aviso-f${a.leida_at ? '' : ' nueva'}" href="${esc(a.url || '#inicio')}"><span class="mov-i oro">${ICONO_AVISO[a.tipo] || I.actividad}</span><div><b>${esc(a.titulo)}</b>${a.cuerpo ? `<p>${esc(a.cuerpo)}</p>` : ''}<small>${hace(a.created_at)}</small></div></a>`).join('')
    : `<div class="vacio">${I.actividad}Aquí verás cuando alguien compre con tu liga, subas de nivel o alcances tu meta.</div>`}</div>
  <div class="sec-t" style="--i:4"><h2>Movimientos</h2></div>
  ${d.movimientos.length || s.apartados ? `<div class="filtros" role="group" aria-label="Filtrar movimientos" style="--i:5"><button type="button" data-filtro="" aria-pressed="true">Todos</button><button type="button" data-filtro="mas" aria-pressed="false">Ganados</button><button type="button" data-filtro="menos" aria-pressed="false">Usados y reembolsos</button></div>` : ''}
  <div class="card lista" id="movs" style="--i:6;padding:6px 16px">${s.apartados ? `<div class="mov pend" data-signo="menos"><span class="mov-i pend">${I.reloj}</span><div><b>Apartados<span class="estado">Pendiente</span></b><small>En una compra por pagar. Si se paga, se usan; si vence, regresan a tu saldo.</small></div><span class="n">−${fmt(s.apartados)}<small>pts</small></span></div>` : ''}${movimientosPorMes(d.movimientos)}
    ${d.movimientos.length || s.apartados ? '<div class="vacio" id="movs-vacio" hidden>No hay movimientos de este tipo.</div>' : `<div class="vacio">${I.moneda}Todavía no tienes movimientos. Comparte tu liga y aquí verás cada compra.</div>`}</div>
  <p class="legal">1 punto = $1 MXN en productos de Vorka México. Siempre se cobran al menos $10 por compra. <a href="/legal/terminos/#puntos">Condiciones del programa</a></p>
</section>`;

  const hojas = `
<div class="hoja" id="h-ajustes" role="dialog" aria-modal="true" aria-labelledby="ha-t" hidden><div class="hoja-fondo" data-cerrar></div><div class="hoja-panel"><div class="asa"></div>
  <div class="hoja-cab"><div style="display:flex;gap:12px;align-items:center"><span class="avatar" style="width:48px;height:48px"><span>${esc(inicial)}</span></span><div><h2 id="ha-t" style="margin:0">${esc(d.nombre)}</h2><span style="font-size:13.5px;color:var(--fg3)">${esc(d.email)}</span></div></div><button class="cerrar-x" type="button" data-cerrar aria-label="Cerrar">${I.cerrar}</button></div>
  <div class="grupo">
    <div class="opcion"><div>Avisos en este dispositivo<small id="push-estado">Cuando alguien compre con tu liga, subas de nivel o cumplas tu meta.</small></div><label class="switch"><input type="checkbox" id="sw-push" aria-label="Avisos en este dispositivo"><i></i></label></div>
    <div class="opcion"><div>Aparecer en el Top del mes<small>Con tu nombre y la inicial de tu apellido${d.ranking ? `. Apareces como <b id="nom-pub">${esc(nombrePublico(d.nombre_ranking))}</b>` : '.'}</small></div><label class="switch"><input type="checkbox" id="sw-top" ${d.ranking ? 'checked' : ''} aria-label="Aparecer en el Top del mes"><i></i></label></div>
    <div class="opcion" id="op-nombre" ${d.ranking || !d.nombre_ranking ? '' : 'hidden'}><div class="pv-campo" style="width:100%"><label for="in-nombre">Tu nombre y apellido</label><input id="in-nombre" maxlength="60" autocomplete="name" value="${esc(d.nombre_ranking)}" placeholder="Ana López"></div></div>
  </div>
  <div class="grupo" style="padding:14px 16px"><div>Apariencia<small style="display:block;font-size:13px;color:var(--fg3);margin-top:2px">Automático sigue el modo de tu celular.</small></div>${selectorTema()}</div>
  <div class="grupo">
    <a class="opcion" href="/tienda/">Ir a la tienda y usar mis puntos ${I.tienda}</a>
    <a class="opcion" href="/tienda/puntos/#instalar">Ponla en tu celular (instrucciones) ${I.instalar}</a>
    <button class="opcion" type="button" data-compartir="Te comparto Puntos Vorka: recomiendas productos de la tienda de Vorka México y ganas descuentos. Es gratis: https://vorka.mx/tienda/puntos/" data-url="https://vorka.mx/tienda/puntos/" data-titulo="Puntos Vorka">Invitar a alguien a Puntos Vorka ${I.compartir}</button>
    <a class="opcion" href="/tienda/puntos/">Cómo funciona el programa ${I.ayuda}</a>
    <a class="opcion" href="/legal/terminos/#puntos">Condiciones del programa ${I.flecha}</a>
    <a class="opcion" href="mailto:hola@vorka.mx?subject=Puntos%20Vorka">¿Dudas? hola@vorka.mx ${I.correo}</a>
  </div>
  <div class="grupo"><button class="opcion" type="button" id="b-salir" style="color:var(--rojo)">Cerrar sesión ${I.salir}</button></div>
</div></div>
<div class="hoja" id="h-qr" role="dialog" aria-modal="true" aria-labelledby="hq-t" hidden><div class="hoja-fondo" data-cerrar></div><div class="hoja-panel" style="text-align:center"><div class="asa"></div>
  <h2 id="hq-t">Tu QR</h2><p class="pv-sub" id="hq-s">Que lo escaneen con la cámara: entra con tu código.</p>
  <div class="qr-caja" id="hq-svg"></div>
  <p style="font:500 13px 'SF Mono',ui-monospace,Menlo,monospace;color:var(--fg3);word-break:break-all;margin-bottom:14px" id="hq-liga"></p>
  <div class="acciones2" style="grid-template-columns:1fr 1fr"><button class="pv-btn oro" type="button" id="hq-guardar">${I.enviar}Guardar imagen</button><button class="pv-btn vidrio" type="button" data-cerrar>Listo</button></div>
</div></div>
<div class="hoja" id="h-meta" role="dialog" aria-modal="true" aria-labelledby="hm-t" hidden><div class="hoja-fondo" data-cerrar></div><div class="hoja-panel"><div class="asa"></div>
  <h2 id="hm-t">Elige tu meta</h2><p class="pv-sub">Un producto que quieras llevarte con tus puntos. Siempre se pagan al menos $10.</p>
  <form id="f-meta"><div class="metas-op">${d.productos.map(p => { const o = objetivoMeta(p.precio_centavos);
    return `<label class="meta-op"><input type="radio" name="meta" value="${esc(p.id)}" ${d.meta?.id === p.id ? 'checked' : ''}><div><b>${esc(p.nombre)}</b><small>${pesosCortos(p.precio_centavos)} · unas ${plural(ventasPara(o), 'venta', 'ventas')}</small></div><em>${fmt(o)} pts</em></label>`; }).join('')}</div>
  <p class="pv-error" id="hm-err" role="alert" hidden style="margin-top:12px"></p>
  <div class="acciones2" style="margin-top:16px;grid-template-columns:1fr auto"><button class="pv-btn oro" type="submit">Guardar meta</button>${d.meta ? '<button class="pv-btn vidrio" type="button" id="hm-quitar">Quitar</button>' : '<button class="pv-btn vidrio" type="button" data-cerrar>Cancelar</button>'}</div></form>
</div></div>
<div class="hoja" id="h-sugerir" role="dialog" aria-modal="true" aria-labelledby="hs-t" hidden><div class="hoja-fondo" data-cerrar></div><div class="hoja-panel"><div class="asa"></div>
  <form id="f-sugerir" novalidate style="display:grid;gap:14px">
    <div><h2 id="hs-t">Sugiere un producto</h2><p class="pv-sub" style="margin:4px 0 0">Si lo agregamos a la tienda, ganas ${PUNTOS_POR_COMPRA * MULTIPLICADOR_DOBLE} puntos por cada compra de ese producto con tu liga. Te avisamos cuando lo revisemos.</p></div>
    <div class="pv-campo"><label for="s-idea">¿Qué producto te gustaría ver?</label><input id="s-idea" name="idea" maxlength="200" required placeholder="Ej. Guía para preparar el examen de la UNAM"></div>
    <div class="pv-campo"><label for="s-para">¿Para quién es?</label><input id="s-para" name="para_quien" maxlength="160" placeholder="Ej. Estudiantes de prepa"></div>
    <div class="pv-campo"><label for="s-porque">¿Por qué crees que se vendería?</label><textarea id="s-porque" name="por_que" maxlength="600" placeholder="Cuéntanos a quién se lo recomendarías"></textarea></div>
    <p class="pv-error" id="hs-err" role="alert" hidden></p>
    <button class="pv-btn oro ancho" type="submit">Enviar idea ${I.flecha}</button>
  </form>
  <div id="hs-ok" hidden style="text-align:center;display:grid;justify-items:center;gap:12px;padding:10px 0"><div class="pv-ok-ico">${I.check}</div><h2>¡Gracias por tu idea!</h2><p class="pv-sub">La revisamos y te avisamos aquí. Si la aceptamos, tendrás puntos dobles en ese producto.</p><button class="pv-btn vidrio" type="button" data-cerrar>Listo</button></div>
</div></div>`;

  const tabs = [['inicio', 'Inicio'], ['compartir', 'Compartir'], ['metas', 'Metas'], ['actividad', 'Actividad']];
  return documento({
    titulo: 'Puntos Vorka',
    cuerpo: `<div class="app">
<header class="barra" id="barra"><a class="marca" href="#inicio" data-ir="inicio"><span class="marca-v">${V}</span><span>Puntos Vorka<small>Vorka México</small></span></a>
  <button class="avatar" type="button" data-abrir="h-ajustes" aria-label="Ajustes de tu cuenta"><span>${esc(inicial)}</span></button></header>
<main id="contenido">${inicio}${compartir}${metas}${actividad}</main>
<nav class="tabs" aria-label="Secciones">${tabs.map(([k, t]) => `<button class="tab" type="button" data-ir="${k}" ${k === 'inicio' ? 'aria-current="page"' : ''}>${I[k]}<span>${t}</span>${k === 'actividad' && d.no_leidas ? `<b class="badge" id="badge">${d.no_leidas > 9 ? '9+' : d.no_leidas}</b>` : ''}</button>`).join('')}</nav>
${hojas}
</div>
<script type="application/json" id="datos">${datosJson({ total: s.total, no_leidas: d.no_leidas, push: d.push })}</script>`,
    script: SCRIPT_APP + SCRIPT_SW + SCRIPT_BILLETERA,
  });
}

// Ocultar o mostrar el saldo (se recuerda en este dispositivo) y filtrar los movimientos
const SCRIPT_BILLETERA = String.raw`(function(){
  var d=document.documentElement, b=document.getElementById('b-ocultar');
  function pinta(){ var o=d.classList.contains('pv-oculto'); if(b){ b.setAttribute('aria-pressed',o?'true':'false'); b.setAttribute('aria-label',o?'Mostrar saldo':'Ocultar saldo'); } }
  if(b) b.addEventListener('click',function(){ d.classList.toggle('pv-oculto'); try{ localStorage.setItem('pv-ocultar-saldo',d.classList.contains('pv-oculto')?'1':'0'); }catch(e){} pinta(); });
  pinta();
  var fs=document.querySelectorAll('[data-filtro]');
  Array.prototype.forEach.call(fs,function(f){ f.addEventListener('click',function(){ var v=f.dataset.filtro, n=0;
    Array.prototype.forEach.call(fs,function(x){ x.setAttribute('aria-pressed',x===f?'true':'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('#movs .mov'),function(m){ var si=!v||m.dataset.signo===v; m.hidden=!si; if(si) n++; });
    Array.prototype.forEach.call(document.querySelectorAll('#movs .mes'),function(h){ var x=h.nextElementSibling, ver=false; while(x&&!x.classList.contains('mes')){ if(x.classList.contains('mov')&&!x.hidden) ver=true; x=x.nextElementSibling; } h.hidden=!ver; });
    var vac=document.getElementById('movs-vacio'); if(vac) vac.hidden=n>0; }); });
})();`;

const SCRIPT_APP = String.raw`(function(){
  var $=function(s,el){ return (el||document).querySelector(s); }, $$=function(s,el){ return Array.prototype.slice.call((el||document).querySelectorAll(s)); };
  var D={}; try{ D=JSON.parse($('#datos').textContent); }catch(e){}
  var reducido=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toastT; function toast(m){ var t=$('#toast'); t.textContent=m; t.classList.add('ver'); clearTimeout(toastT); toastT=setTimeout(function(){ t.classList.remove('ver'); },2200); }
  function post(url,datos){ return fetch(url,{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(datos||{})})
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(r.status===401){ location.reload(); } return {ok:r.ok,j:j}; }); })
    .catch(function(){ return {ok:false,j:{error:'Sin conexión. Intenta de nuevo.'}}; }); }
  function guardar(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } function leer(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }

  // ----- animaciones: saldo y números, barras y anillos -----
  function contar(el){ var fin=+el.dataset.contar||0; if(reducido||fin<=0){ return; } var ini=performance.now(), dur=Math.min(1400,500+fin*8);
    el.textContent='0'; (function paso(t){ var p=Math.min(1,(t-ini)/dur), e=1-Math.pow(1-p,3); el.textContent=Math.round(fin*e).toLocaleString('es-MX'); if(p<1) requestAnimationFrame(paso); })(ini); }
  function animar(vista){ $$('[data-contar]',vista).forEach(function(el){ if(!el.dataset.hecho){ el.dataset.hecho=1; contar(el); } });
    requestAnimationFrame(function(){ $$('.barra-p i',vista).forEach(function(i){ i.style.width=(Math.max(.03,+i.dataset.p||0)*100)+'%'; });
      $$('.anillo .valor',vista).forEach(function(c){ c.style.strokeDashoffset=c.dataset.offset; }); }); }

  // ----- pestañas -----
  var VISTAS=['inicio','compartir','metas','actividad'];
  function ir(v,sinScroll){ if(VISTAS.indexOf(v)<0) v='inicio';
    $$('.vista').forEach(function(s){ var si=s.dataset.vista===v; if(si&&s.hidden){ s.hidden=false; $$('.vista>*',s).forEach(function(x){ x.style.animation='none'; x.offsetHeight; x.style.animation=''; }); } else if(!si) s.hidden=true; });
    $$('.tab').forEach(function(t){ if(t.dataset.ir===v) t.setAttribute('aria-current','page'); else t.removeAttribute('aria-current'); });
    if(location.hash!=='#'+v) history.replaceState(null,'','#'+v);
    if(!sinScroll) window.scrollTo(0,0);
    animar($('#v-'+v));
    if(v==='actividad'&&D.no_leidas){ D.no_leidas=0; post('/api/puntos/leidas'); var b=$('#badge'); if(b) setTimeout(function(){ b.remove(); },600); setTimeout(function(){ $$('.aviso-f.nueva').forEach(function(a){ a.classList.remove('nueva'); }); },2500); }
  }
  document.addEventListener('click',function(e){ var a=e.target.closest('[data-ir]'); if(a){ e.preventDefault(); cerrarHojas(); ir(a.dataset.ir); } });
  window.addEventListener('hashchange',function(){ ir(location.hash.slice(1)); });
  window.addEventListener('scroll',function(){ $('#barra').classList.toggle('sombra',scrollY>4); },{passive:true});

  // ----- hojas -----
  var abierta=null, foco=null;
  function abrir(id){ var h=document.getElementById(id); if(!h) return; cerrarHojas(true); foco=document.activeElement; h.hidden=false; h.classList.remove('sale'); abierta=h; document.body.style.overflow='hidden';
    setTimeout(function(){ var f=h.querySelector('input:not([type=radio]):not([type=checkbox]),button'); if(f&&id!=='h-ajustes') try{ f.focus({preventScroll:true}); }catch(e){} },300); }
  function cerrarHojas(ya){ if(!abierta) return; var h=abierta; abierta=null; document.body.style.overflow='';
    if(ya||reducido){ h.hidden=true; return; } h.classList.add('sale'); setTimeout(function(){ h.hidden=true; h.classList.remove('sale'); },240); if(foco) try{ foco.focus({preventScroll:true}); }catch(e){} }
  document.addEventListener('click',function(e){ var a=e.target.closest('[data-abrir]'); if(a){ e.preventDefault(); abrir(a.dataset.abrir); return; } if(e.target.closest('[data-cerrar]')) cerrarHojas(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') cerrarHojas(); });

  // ----- copiar y compartir -----
  function copiar(t){ if(navigator.clipboard&&window.isSecureContext) return navigator.clipboard.writeText(t).then(function(){ toast('Copiado'); },function(){ copiarViejo(t); }); copiarViejo(t); }
  function copiarViejo(t){ var x=document.createElement('textarea'); x.value=t; x.setAttribute('readonly',''); x.style.position='fixed'; x.style.opacity='0'; document.body.appendChild(x); x.select(); try{ document.execCommand('copy'); toast('Copiado'); }catch(e){ toast('No se pudo copiar'); } x.remove(); }
  document.addEventListener('click',function(e){ var c=e.target.closest('[data-copiar]'); if(c){ copiar(c.dataset.copiar); if(navigator.vibrate) navigator.vibrate(12); }
    var s=e.target.closest('[data-compartir]'); if(s){ var txt=s.dataset.compartir, url=s.dataset.url;
      if(navigator.share) navigator.share({title:s.dataset.titulo,text:txt.replace(url,'').trim(),url:url}).catch(function(){}); else copiar(txt); } });

  // ----- QR -----
  document.addEventListener('click',function(e){ var q=e.target.closest('[data-qr]'); if(!q) return; var src=$('[data-qr-svg="'+q.dataset.qr+'"]');
    $('#hq-svg').innerHTML=src.innerHTML; $('#hq-liga').textContent=src.dataset.qrLiga; $('#hq-t').textContent=src.dataset.qrTitulo; abrir('h-qr'); });
  $('#hq-guardar').onclick=function(){ var s=$('#hq-svg svg'); if(!s) return; var img=new Image(), n=900;
    img.onload=function(){ var c=document.createElement('canvas'); c.width=n; c.height=n+120; var x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(img,0,0,n,n);
      x.fillStyle='#141114'; x.font='600 34px -apple-system,Segoe UI,Inter,sans-serif'; x.textAlign='center'; x.fillText($('#hq-t').textContent,n/2,n+50); x.fillStyle='#6D696E'; x.font='26px -apple-system,Segoe UI,Inter,sans-serif'; x.fillText('Puntos Vorka · '+$('#hq-liga').textContent.replace(/^.*ref=/,'código '),n/2,n+92);
      c.toBlob(function(b){ var f=window.File?new File([b],'qr-vorka.png',{type:'image/png'}):null;
        if(f&&navigator.canShare&&navigator.canShare({files:[f]})) navigator.share({files:[f]}).catch(function(){});
        else { var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='qr-vorka.png'; a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); },4000); } },'image/png'); };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(s)); };

  // ----- meta -----
  var fm=$('#f-meta'); if(fm){ fm.onsubmit=function(e){ e.preventDefault(); var r=fm.querySelector('input[name=meta]:checked'), er=$('#hm-err');
      if(!r){ er.textContent='Elige un producto.'; er.hidden=false; return; } var b=fm.querySelector('[type=submit]'); b.disabled=true;
      post('/api/puntos/meta',{product_id:r.value}).then(function(x){ b.disabled=false; if(x.ok){ location.hash='#inicio'; location.reload(); } else { er.textContent=x.j.error||'No se pudo guardar.'; er.hidden=false; } }); };
    var q=$('#hm-quitar'); if(q) q.onclick=function(){ post('/api/puntos/meta',{product_id:null}).then(function(){ location.reload(); }); }; }

  // ----- sugerir -----
  var fs=$('#f-sugerir'); fs.onsubmit=function(e){ e.preventDefault(); var er=$('#hs-err'); er.hidden=true;
    if(fs.idea.value.trim().length<3){ er.textContent='Cuéntanos qué producto te gustaría ver.'; er.hidden=false; fs.idea.focus(); return; }
    var b=fs.querySelector('[type=submit]'), h=b.innerHTML; b.disabled=true; b.innerHTML='<span class="pv-giro"></span>Enviando…';
    post('/api/puntos/sugerir',{idea:fs.idea.value,para_quien:fs.para_quien.value,por_que:fs.por_que.value}).then(function(x){ b.disabled=false; b.innerHTML=h;
      if(x.ok){ fs.hidden=true; $('#hs-ok').hidden=false; fs.reset(); $('#hs-ok [data-cerrar]').addEventListener('click',function(){ location.hash='#metas'; location.reload(); }); }
      else { er.textContent=x.j.error||'No se pudo enviar.'; er.hidden=false; } }); };

  // ----- ajustes: Top del mes -----
  var swTop=$('#sw-top'), opN=$('#op-nombre'), inN=$('#in-nombre');
  function guardarTop(){ var on=swTop.checked; if(on&&!inN.value.trim()){ opN.hidden=false; inN.focus(); swTop.checked=false; toast('Escribe tu nombre primero'); return; }
    swTop.disabled=true; post('/api/puntos/ajustes',{ranking:on,nombre:inN.value}).then(function(x){ swTop.disabled=false;
      if(x.ok){ toast(on?'Apareces como '+x.j.nombre_publico:'Ya no apareces en el Top'); setTimeout(function(){ location.hash='#metas'; location.reload(); },900); }
      else { swTop.checked=!on; toast(x.j.error||'No se pudo guardar'); } }); }
  swTop.onchange=guardarTop;
  inN.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); swTop.checked=true; guardarTop(); } });

  // ----- salir -----
  $('#b-salir').onclick=function(){ this.disabled=true; post('/api/puntos/salir').then(function(){ location.href='/tienda/cuenta/'; }); };

  // ----- instalar en el inicio -----
  var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  function descartado(k){ var t=+leer('pv_no_'+k)||0; return Date.now()-t<7*864e5; }
  $$('[data-descartar]').forEach(function(b){ b.onclick=function(){ guardar('pv_no_'+b.dataset.descartar,String(Date.now())); b.closest('.card').hidden=true; }; });
  var aviso=null;
  if(!standalone&&!descartado('instalar')){
    if(ios){ $('#c-instalar-t').hidden=true; $('#c-instalar-ios').hidden=false; $('#c-instalar').hidden=false; }
    window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); aviso=e; $('#c-instalar').hidden=false; $('#b-instalar').hidden=false; $('#c-instalar-and').hidden=true; $('#c-instalar-t').hidden=false; });
    // Android sin el botón automático del navegador: instrucciones a mano
    if(/android/i.test(navigator.userAgent)) setTimeout(function(){ if(!aviso){ $('#c-instalar-t').hidden=true; $('#c-instalar-and').hidden=false; $('#c-instalar').hidden=false; } },1500);
  }
  $('#b-instalar').onclick=function(){ if(!aviso) return; aviso.prompt(); aviso.userChoice.then(function(r){ if(r.outcome==='accepted'){ $('#c-instalar').hidden=true; toast('¡Listo! Búscala en tu inicio'); } aviso=null; }); };
  window.addEventListener('appinstalled',function(){ $('#c-instalar').hidden=true; });

  // ----- avisos push -----
  var soporta='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window, swP=$('#sw-push'), est=$('#push-estado');
  function b64(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); s+='==='.slice((s.length+3)%4); var r=atob(s), a=new Uint8Array(r.length); for(var i=0;i<r.length;i++) a[i]=r.charCodeAt(i); return a; }
  function registro(){ return navigator.serviceWorker.register('/tienda/cuenta/sw.js',{scope:'/tienda/cuenta/'}).then(function(){ return navigator.serviceWorker.ready; }); }
  function estadoPush(){ if(!soporta){ swP.disabled=true; est.textContent=ios&&!standalone?'En iPhone primero agrega la app a tu inicio (Compartir → Agregar a inicio) y ábrela desde ahí.':'Este navegador no permite avisos.'; return Promise.resolve(null); }
    return registro().then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(sub){ swP.checked=!!sub;
      if(Notification.permission==='denied'){ swP.disabled=true; est.textContent='Bloqueaste los avisos. Actívalos en los ajustes del navegador para este sitio.'; }
      else if(!sub&&!descartado('avisos')) $('#c-avisos').hidden=false;
      return sub; }).catch(function(){ return null; }); }
  function activar(){ return Notification.requestPermission().then(function(p){ if(p!=='granted') throw new Error('permiso');
      return Promise.all([registro(),fetch('/api/puntos/push/clave',{credentials:'same-origin'}).then(function(r){ return r.json(); })]); })
    .then(function(x){ return x[0].pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(x[1].pub)}); })
    .then(function(sub){ return post('/api/puntos/push/suscribir',sub.toJSON()); })
    .then(function(r){ if(!r.ok) throw new Error(r.j.error); swP.checked=true; $('#c-avisos').hidden=true; toast('Avisos activados'); })
    .catch(function(e){ swP.checked=false; toast(e&&e.message==='permiso'?'No diste permiso para avisos':'No se pudieron activar los avisos'); }); }
  function desactivar(){ return registro().then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(sub){ if(!sub) return;
      return post('/api/puntos/push/quitar',{endpoint:sub.endpoint}).then(function(){ return sub.unsubscribe(); }); }).then(function(){ toast('Avisos desactivados'); }); }
  swP.onchange=function(){ swP.disabled=true; (swP.checked?activar():desactivar()).then(function(){ swP.disabled=false; }); };
  $('#b-avisos').onclick=function(){ if(!soporta){ toast(ios?'Primero agrega la app a tu inicio':'Tu navegador no permite avisos'); return; } activar(); };
  if(soporta) estadoPush(); else { estadoPush(); if(ios&&!standalone&&!descartado('avisos')){ $('#c-avisos-t').textContent='En iPhone los avisos funcionan cuando agregas la app a tu inicio. Hazlo y actívalos desde ahí.'; $('#b-avisos').hidden=true; $('#c-avisos').hidden=false; } }

  // ----- al volver a la app: si hay novedades, se recarga -----
  var ultima=Date.now();
  document.addEventListener('visibilitychange',function(){ if(document.visibilityState!=='visible'||Date.now()-ultima<45e3) return; ultima=Date.now();
    fetch('/api/puntos/estado',{credentials:'same-origin'}).then(function(r){ return r.json(); }).then(function(j){ if(!j.cuenta){ location.reload(); return; }
      if(j.total!==D.total||j.no_leidas>D.no_leidas) location.reload(); }).catch(function(){}); });

  // Portada que no carga: queda la V de fondo
  document.addEventListener('error',function(e){ var t=e.target; if(t&&t.tagName==='IMG'&&t.closest('.prod-img')) t.remove(); },true);
  ir(location.hash.slice(1)||'inicio',true);
})();`;

// ---------- service worker, manifiesto e íconos ----------
export const SW = `// Puntos Vorka · service worker (alcance /tienda/cuenta/): avisos push y la app sin conexión
const CACHE = 'puntos-vorka-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/tienda/cuenta/iconos/192.png'])).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
// La app siempre pide datos frescos; si no hay conexión, muestra la última versión guardada
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put('/tienda/cuenta/', c)); } return res; })
    .catch(() => caches.match('/tienda/cuenta/').then(x => x || new Response('<meta name=viewport content="width=device-width"><body style="background:#0B090C;color:#F4F2F5;font-family:sans-serif;padding:40px;text-align:center">Sin conexión. Vuelve a intentar en un momento.</body>', { headers: { 'content-type': 'text/html; charset=utf-8' } }))));
});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { titulo: 'Puntos Vorka', cuerpo: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Puntos Vorka', {
    body: d.cuerpo || '', icon: '/tienda/cuenta/iconos/192.png', badge: '/tienda/cuenta/iconos/192.png', tag: d.tag, renotify: !!d.tag, data: { url: d.url || '/tienda/cuenta/' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/tienda/cuenta/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) if (w.url.includes('/tienda/cuenta/') && 'focus' in w) { w.navigate(url).catch(() => {}); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
`;

export const manifiesto = () => ({
  name: 'Puntos Vorka',
  short_name: 'Puntos Vorka',
  description: 'Comparte tu liga de Vorka México, junta puntos y alcanza tus metas.',
  id: '/tienda/cuenta/',
  start_url: '/tienda/cuenta/',
  scope: '/tienda/cuenta/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0B090C',
  theme_color: '#0B090C',
  lang: 'es-MX',
  dir: 'ltr',
  categories: ['shopping', 'lifestyle'],
  icons: [
    { src: '/tienda/cuenta/iconos/192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/tienda/cuenta/iconos/512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/tienda/cuenta/iconos/maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Compartir mi liga', url: '/tienda/cuenta/#compartir', icons: [{ src: '/tienda/cuenta/iconos/192.png', sizes: '192x192' }] },
    { name: 'Mis metas', url: '/tienda/cuenta/#metas', icons: [{ src: '/tienda/cuenta/iconos/192.png', sizes: '192x192' }] },
  ],
});

const PNG = {};
export function icono(n) {
  if (!PNG[n]) PNG[n] = Uint8Array.from(atob(ICONOS[n]), c => c.charCodeAt(0));
  return PNG[n];
}

// ---------- página del programa (pública, con el menú del sitio) ----------
const CSS_PROGRAMA = `
.pv-lp{background:#0B090C;color:#F4F2F5;position:relative;overflow:hidden}
.pv-lp::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(50% 50% at 85% 10%,rgba(107,42,133,.55),transparent 70%),radial-gradient(40% 40% at 0% 90%,rgba(200,164,92,.12),transparent 70%)}
.pv-lp .marco{position:relative}
.pv-hero{display:grid;gap:44px;align-items:center;padding:clamp(40px,7vw,96px) 0 clamp(56px,8vw,110px)}
@media (min-width:920px){.pv-hero{grid-template-columns:1.1fr .9fr}}
.pv-hero .t-volver{color:rgba(244,242,245,.6)}.pv-form .pv-entrada h2{font-size:24px;letter-spacing:-.02em;line-height:1.2}
.pv-et{display:flex;width:max-content;max-width:100%;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#E6CF96}
.pv-et i{width:8px;height:8px;border-radius:50%;background:#E6CF96;box-shadow:0 0 12px #E6CF96}
.pv-hero h1{font-size:clamp(40px,6.4vw,74px);line-height:1.02;letter-spacing:-.045em;font-weight:800;margin:16px 0 18px}
.pv-hero .lead{color:rgba(244,242,245,.7);max-width:560px}
.pv-hero .botones{margin-top:28px}
.pv-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.pv-chips span{font-size:13px;font-weight:650;color:rgba(244,242,245,.75);padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
/* teléfono de muestra */
.pv-tel{position:relative;width:min(330px,86vw);margin:0 auto;aspect-ratio:9/17;border-radius:48px;padding:12px;background:linear-gradient(145deg,#3a3340,#141114 40%,#2a2430);box-shadow:0 60px 120px -40px rgba(107,42,133,.9),0 0 0 1px rgba(255,255,255,.12) inset;transform:rotate(-3deg)}
.pv-tel-in{position:relative;height:100%;border-radius:38px;overflow:hidden;background:#0B090C;padding:44px 14px 0;display:grid;align-content:start;gap:10px}
.pv-tel-in::before{content:"";position:absolute;top:10px;left:50%;transform:translateX(-50%);width:96px;height:26px;border-radius:20px;background:#000}
.pv-tel-in::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(70% 40% at 90% 0%,rgba(107,42,133,.5),transparent 70%)}
.pv-m-cab{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:750}
.pv-m-cab span:last-child{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#F0DDA8,#B08A45)}
.pv-m-saldo{position:relative;z-index:1;border-radius:20px;padding:14px;background:radial-gradient(120% 90% at 100% 0%,rgba(154,79,191,.55),transparent 55%),linear-gradient(150deg,#2B1638,#120D15);box-shadow:inset 0 0 0 1px rgba(240,221,168,.25)}
.pv-m-saldo small{font-size:10px;color:rgba(255,255,255,.6);font-weight:650}
.pv-m-saldo b{display:block;font-size:40px;font-weight:800;letter-spacing:-.05em;line-height:1.05;margin-top:6px;background:linear-gradient(100deg,#fff,#c9ccd1 40%,#e3c47e 75%,#b8924a);-webkit-background-clip:text;background-clip:text;color:transparent}
.pv-m-saldo em{font-style:normal;font-size:10.5px;color:rgba(255,255,255,.7)}
.pv-m-barra{position:relative;z-index:1;height:7px;border-radius:7px;background:rgba(255,255,255,.08);overflow:hidden}.pv-m-barra i{display:block;height:100%;width:64%;background:linear-gradient(90deg,#F0DDA8,#B08A45)}
.pv-m-stats{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.pv-m-stats div{border-radius:12px;padding:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)}
.pv-m-stats b{display:block;font-size:16px;font-weight:800}.pv-m-stats span{font-size:8.5px;color:rgba(244,242,245,.5)}
.pv-m-card{position:relative;z-index:1;display:flex;gap:10px;align-items:center;border-radius:14px;padding:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);font-size:10.5px}
.pv-m-card i{width:30px;height:30px;border-radius:10px;flex:none;background:rgba(200,164,92,.16)}.pv-m-card b{display:block;font-size:11.5px}
.pv-m-card em{font-style:normal;margin-left:auto;font-size:9px;font-weight:800;padding:3px 7px;border-radius:9px;background:linear-gradient(135deg,#F0DDA8,#B08A45);color:#1B1408}
.pv-m-tabs{position:absolute;z-index:2;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(4,1fr);padding:10px 8px 18px;background:rgba(16,13,18,.92);border-top:1px solid rgba(255,255,255,.08);font-size:8.5px;text-align:center;color:rgba(244,242,245,.45)}
.pv-m-tabs span:first-child{color:#E6CF96}.pv-m-tabs span::before{content:"";display:block;width:16px;height:16px;margin:0 auto 3px;border-radius:5px;border:1.6px solid currentColor}
.pv-notif{position:absolute;z-index:3;top:3%;right:-6%;width:min(260px,70vw);display:flex;gap:10px;align-items:center;padding:12px;border-radius:18px;background:rgba(40,35,44,.82);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);box-shadow:0 20px 50px -10px rgba(0,0,0,.6);font-size:12px;transform:rotate(2deg);animation:pvflota 5s ease-in-out infinite}
.pv-notif img{width:34px;height:34px;border-radius:9px}.pv-notif b{display:block;font-size:12.5px}.pv-notif span{color:rgba(244,242,245,.7)}
@keyframes pvflota{50%{transform:rotate(2deg) translateY(-8px)}}
@media (max-width:520px){.pv-notif{right:-2%;top:0}}
/* beneficios */
.pv-ben{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-top:34px}
.pv-ben article{padding:24px;border-radius:24px;background:var(--card);border:1px solid var(--line);box-shadow:var(--sombra)}
.pv-ben i{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:var(--morado-suave);color:var(--morado);margin-bottom:16px}.pv-ben i svg{width:22px;height:22px}
.pv-ben h3{font-size:19px;letter-spacing:-.02em;margin-bottom:6px}.pv-ben p{color:var(--fg-2);font-size:15.5px;line-height:1.55}
.pv-pasos{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:34px;counter-reset:p}
.pv-pasos li{counter-increment:p;padding:22px 22px 22px 70px;position:relative;border-radius:22px;background:var(--bg-2);font-size:15.5px;line-height:1.5;color:var(--fg-2)}
.pv-pasos li::before{content:counter(p);position:absolute;left:20px;top:20px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--fg);color:var(--bg);font-weight:800}
.pv-pasos b{color:var(--fg);display:block;font-size:17px;margin-bottom:2px}
.pv-niv{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pv-niv span{display:inline-flex;align-items:center;gap:8px;padding:9px 14px 9px 10px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-weight:650;font-size:14.5px}
.pv-niv i{width:12px;height:12px;border-radius:50%;background:var(--c)}.pv-niv small{color:var(--fg-3);font-weight:600}
.pv-form{display:grid;gap:28px;align-items:start;padding:clamp(56px,8vw,100px) 0}
@media (min-width:920px){.pv-form{grid-template-columns:1fr 460px}}
.pv-form h2{font-size:clamp(30px,4.2vw,46px);letter-spacing:-.04em;line-height:1.05;font-weight:800}
.pv-form .lead{color:rgba(244,242,245,.7);margin-top:14px}
.pv-form ul{display:grid;gap:12px;margin-top:24px}.pv-form li{display:flex;gap:12px;color:rgba(244,242,245,.78);font-size:15.5px;line-height:1.5}
.pv-form li svg{width:20px;height:20px;color:#E6CF96;flex:none;margin-top:2px}
.pv-ya{display:grid;gap:14px;justify-items:start}
.pv-inst{display:grid;gap:14px;margin-top:26px;grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))}
.pv-inst article{background:var(--card,#fff);border:1px solid var(--line);border-radius:20px;padding:22px}
.pv-inst h3{font-size:18px;font-weight:750;letter-spacing:-.02em}
.pv-inst ol{list-style:decimal;margin:12px 0 0;padding-left:22px;display:grid;gap:8px;color:var(--fg-2);font-size:15px;line-height:1.5}
.pv-inst ol b{color:var(--fg)}.pv-inst li::marker{font-weight:800;color:var(--fg)}
.pv-inst p{color:var(--fg-2);font-size:15px;margin-top:8px}
.pv-inv .botones{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
#toast.ver{opacity:1!important}`;

const SCRIPT_COPIAR_PROG = `(function(){ var b=document.getElementById('pv-copiar-prog'); if(!b) return; b.addEventListener('click',function(){ var u='https://vorka.mx/tienda/puntos/', t=document.getElementById('toast');
  function ok(){ if(t){ t.textContent='Enlace copiado'; t.style.opacity=1; setTimeout(function(){ t.style.opacity=0; },1800); } }
  if(navigator.share){ navigator.share({title:'Puntos Vorka',url:u}).catch(function(){}); return; }
  if(navigator.clipboard) navigator.clipboard.writeText(u).then(ok,function(){ prompt('Copia el enlace:',u); }); else prompt('Copia el enlace:',u); }); })();`;

export function paginaPrograma(env, { cuenta }) {
  const ben = [
    [I.moneda, `${PUNTOS_POR_COMPRA} puntos por compra`, `Cada compra que entra con tu liga suma ${PUNTOS_POR_COMPRA} puntos. 1 punto = $1 MXN en cualquier producto de Vorka México.`],
    [I.rayo, 'Puntos dobles', `En productos con promoción, y en los productos que tú sugieras y agreguemos a la tienda: ${PUNTOS_POR_COMPRA * MULTIPLICADOR_DOBLE} puntos por compra.`],
    [LOGRO_ICONO.bandera, 'Metas y niveles', 'Elige un producto como meta y ve cuántas ventas te faltan. Sube de Inicial a Diamante y desbloquea logros.'],
    [I.actividad, 'Avisos en tu celular', 'Te avisamos al momento cuando alguien compra con tu liga, subes de nivel o alcanzas tu meta.'],
    [I.compartir, 'Comparte en un toque', 'Tu liga para cada producto con WhatsApp, Telegram, X, código QR y mensajes listos para pegar.'],
    [I.instalar, 'Instálala en tu inicio', 'Funciona como app en iPhone y Android, sin descargar nada de una tienda de apps.'],
  ];
  return pagina({
    titulo: 'Puntos Vorka: comparte y gana descuentos en la tienda', ruta: '/tienda/puntos/',
    descripcion: `La app de puntos de Vorka México: comparte tu liga, gana ${PUNTOS_POR_COMPRA} puntos por cada compra (dobles en promociones), ponte metas y recibe avisos. 1 punto = $1 MXN.`,
    head: `<style>.pv-lp,#toast{${TOKENS}}${CSS_BASE}${CSS_PROGRAMA}</style>`,
    script: (cuenta ? '' : SCRIPT_ENTRAR) + SCRIPT_COPIAR_PROG,
    cuerpo: `
<section class="pv-lp"><div class="marco">
  <div class="pv-hero">
    <div>
      ${navTienda('puntos')}
      <p class="pv-et" style="margin-top:22px"><i></i>Puntos Vorka · la app</p>
      <h1>Recomienda.<br>Gana <span class="pv-metal">descuentos.</span></h1>
      <p class="lead">Tu propia app para compartir el Simulador PAA, Brindi, Cupo y todo lo de la tienda. Cada compra con tu liga son ${PUNTOS_POR_COMPRA} puntos, y cada punto vale $1.</p>
      <div class="botones">${cuenta ? `<a class="pv-btn oro" href="/tienda/cuenta/">Abrir mi app ${I.flecha}</a>` : `<a class="pv-btn oro" href="#entrar">Crear mi cuenta gratis ${I.flecha}</a><a class="pv-btn vidrio" href="/tienda/cuenta/">Ya tengo cuenta</a>`}</div>
      <div class="pv-chips"><span>Gratis</span><span>Sin contraseñas</span><span>Puntos dobles</span><span>Avisos al instante</span></div>
    </div>
    <div style="position:relative;padding:10px 0" aria-hidden="true">
      <div class="pv-tel"><div class="pv-tel-in">
        <div class="pv-m-cab"><span>Hola, Ana</span><span></span></div>
        <div class="pv-m-saldo"><small>TU SALDO · NIVEL PLATA</small><b>180</b><em>= $180 MXN para usar en la tienda</em></div>
        <div class="pv-m-barra"><i></i></div>
        <div class="pv-m-stats"><div><b>23</b><span>Visitas</span></div><div><b>4</b><span>Compras</span></div><div><b>+50</b><span>Puntos</span></div></div>
        <div class="pv-m-card"><i></i><div><b>Cupo · Eventos</b>vorka.mx/tienda/cupo/?ref=ANA</div><em>2×</em></div>
        <div class="pv-m-card"><i></i><div><b>Mi meta: Simulador PAA</b>Te faltan 7 ventas</div></div>
        <div class="pv-m-tabs"><span>Inicio</span><span>Compartir</span><span>Metas</span><span>Actividad</span></div>
      </div></div>
      <div class="pv-notif"><img src="/tienda/cuenta/iconos/192.png" alt="" width="34" height="34"><div><b>¡Puntos dobles! +20 puntos</b><span>Alguien compró Cupo Pro con tu liga.</span></div></div>
    </div>
  </div>
</div></section>
<section class="t-sec"><div class="marco">
  <span class="etiqueta">Qué incluye</span>
  <h2 class="h2" style="margin-top:14px;max-width:760px">Una app hecha para que recomendar <span class="metal">valga la pena.</span></h2>
  <div class="pv-ben">${ben.map(([ic, t, x]) => `<article><i>${ic}</i><h3>${t}</h3><p>${x}</p></article>`).join('')}</div>
  <ol class="pv-pasos">
    <li><b>Crea tu cuenta</b>Con tu correo, sin contraseña. Te llega un enlace y un código.</li>
    <li><b>Comparte tu liga</b>En tus grupos, estados o redes. La persona tiene 30 días para comprar.</li>
    <li><b>Usa tus puntos</b>Al pagar en la tienda, con el mismo correo. Siempre se cobran al menos $10.</li>
  </ol>
  <div class="pv-niv">${NIVELES.map(x => `<span style="--c:${x.color}"><i></i>${x.nombre} <small>${x.min ? `${x.min}+ ventas` : 'al empezar'}</small></span>`).join('')}</div>
  <p class="t-nota">Los niveles son reconocimiento (insignias y el color de tu tarjeta); los puntos valen lo mismo en todos. No cuentan las compras que te hagas a ti mismo y si una compra se reembolsa, sus puntos se descuentan. <a href="/legal/terminos/#puntos">Condiciones del programa</a>.</p>
</div></section>
<section class="t-sec suave" id="instalar"><div class="marco">
  <span class="etiqueta">Instálala y compártela</span>
  <h2 class="h2" style="margin-top:14px">Tenla en tu celular como app</h2>
  <p class="lead" style="margin-top:10px;max-width:640px">No se descarga de ninguna tienda de apps: se agrega a tu inicio en tres toques y queda con su ícono, como cualquier app.</p>
  <div class="pv-inst">
    <article><h3>iPhone · Safari</h3><ol><li>Abre <b>vorka.mx/tienda/cuenta</b> en Safari.</li><li>Toca <b>Compartir</b> (el cuadro con la flecha hacia arriba, abajo al centro).</li><li>Elige <b>Agregar a inicio</b> y toca <b>Agregar</b>.</li></ol></article>
    <article><h3>Android · Chrome</h3><ol><li>Abre <b>vorka.mx/tienda/cuenta</b> en Chrome.</li><li>Toca el menú <b>⋮</b> (arriba a la derecha).</li><li>Elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</li></ol></article>
    <article class="pv-inv"><h3>Invita a alguien</h3><p>Comparte Puntos Vorka para que también gane descuentos con su propia liga.</p>
      <div class="botones"><a class="btn tinta chico" href="https://wa.me/?text=${encodeURIComponent('Te comparto Puntos Vorka: recomiendas productos de la tienda de Vorka México y ganas descuentos. Es gratis: https://vorka.mx/tienda/puntos/')}" target="_blank" rel="noopener">WhatsApp</a><button class="btn blanco chico" type="button" id="pv-copiar-prog">Copiar enlace</button></div></article>
  </div>
  <p class="t-nota">Ya instalada, entra con tu correo y el código de 6 dígitos que te llega. Activa los avisos para enterarte de cada compra con tu liga.</p>
</div></section>
<section class="pv-lp" id="entrar"><div class="marco"><div class="pv-form">
  <div>
    <p class="pv-et"><i></i>${cuenta ? 'Tu cuenta' : 'Empieza hoy'}</p>
    <h2 style="margin-top:14px">${cuenta ? 'Ya tienes tu app lista.' : 'Tu liga en un minuto.'}</h2>
    <p class="lead">${cuenta ? `Entraste como <b>${esc(cuenta.email)}</b>.` : 'Escribe tu correo. Te mandamos un enlace para entrar desde aquí y un código de 6 dígitos para entrar desde la app instalada.'}</p>
    <ul>${['Ábrela desde tu celular y agrégala a tu inicio: queda como app.', 'Activa los avisos para enterarte de cada compra con tu liga.', '¿Eres creador de contenido, escuela o institución? También hay comisiones en dinero, solo por invitación: <a href="mailto:hola@vorka.mx" style="color:#E6CF96">hola@vorka.mx</a>.'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
  </div>
  ${cuenta ? `<div class="pv-entrada pv-ya"><h2>Hola de nuevo</h2><p class="pv-sub">Tu liga, tus metas y tus puntos están en tu app.</p><a class="pv-btn oro ancho" href="/tienda/cuenta/">Abrir mi app ${I.flecha}</a></div>` : formEntrar()}
</div></div></section>
<div class="toast" id="toast" role="status" aria-live="polite" style="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);opacity:0;pointer-events:none;padding:12px 18px;border-radius:999px;background:#141114;color:#fff;font-weight:650;transition:opacity .25s"></div>`,
  });
}
