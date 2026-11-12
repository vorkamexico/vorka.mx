// Vorka Learn · Herramientas gratis: «Reducir el peso de una foto o PDF», «Dividir y unir PDF», «Generador de código QR»
// y «Foto para trámites». Aquí van sus textos, preguntas frecuentes, portadas y el HTML de cada herramienta; el diseño de la página
// lo pone src/learn/herramientas.js. El código que corre en el navegador vive en el sitio estático:
// assets/herramientas/{peso,dividir-pdf,unir-pdf,qr,foto,comun}.js y sus librerías en assets/herramientas/lib/ (ver su README).
import { FLECHA } from '../marco.generado.js';
import qrcode from '../vendor/qrcode.js';

export const V_HERRAMIENTAS = '2';   // súbelo si cambian los scripts de assets/herramientas/
const js = nombre => `/assets/herramientas/${nombre}.js?v=${V_HERRAMIENTAS}`;
const SUBIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"/></svg>';
const DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
const CANDADO = '<p class="di-privado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const zona = (id, titulo, texto, boton, accept, noscript, multiple = false) => `<label class="di-zona" id="${id}-zona" for="${id}-archivo">
    ${SUBIR}
    <b>${titulo}</b>
    <p>${texto}</p>
    <span class="btn tinta">${boton}</span>
    <input id="${id}-archivo" class="vh" type="file" accept="${accept}"${multiple ? ' multiple' : ''}>
  </label>
  <noscript><p class="di-aviso">${noscript}</p></noscript>
  <p class="di-aviso" id="${id}-aviso" role="alert" hidden></p>`;

// ---------- CSS de las tres ----------
export const CSS_NUEVAS = `
.pe-arch{display:flex;gap:12px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:14px;flex-wrap:wrap}
.pe-arch>svg{width:34px;height:34px;color:var(--sec-t);flex:none}
.pe-info{margin:0;display:grid;gap:2px;flex:1;min-width:0}.pe-info b{overflow-wrap:anywhere}.pe-info span{font-size:14px;color:var(--fg-2)}
.pe-arch button,.dp-arch button{background:none;border:0;padding:0;font:inherit;font-size:14px;color:var(--sec-t);font-weight:650;cursor:pointer;text-decoration:underline}
.pe-panel{display:grid;gap:18px;max-width:640px;margin:0 auto}
.pe-cifras{display:flex;flex-wrap:wrap;align-items:center;gap:10px 22px;padding:18px 20px;border-radius:16px;background:var(--sec-s)}
.pe-cifras small{display:block;font-size:13px;color:var(--fg-2);font-weight:600}.pe-cifras b{font-size:clamp(24px,4vw,32px);letter-spacing:-.03em}
.pe-flecha{font-size:24px;color:var(--fg-2)}
.pe-ahorro{margin-left:auto;font-weight:800;font-size:15px;padding:6px 12px;border-radius:999px;background:var(--card);color:var(--sec-t)}
.pe-nota{margin:14px 0 0;font-size:14.5px;color:var(--fg-2);line-height:1.5}
.pe-vista{margin-top:16px;text-align:center}.pe-vista canvas{max-width:100%;height:auto;border-radius:10px;border:1px solid var(--line)}.pe-vista p{margin:6px 0 0;font-size:13px;color:var(--fg-2)}
.pe-acc{margin-top:18px;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.btn svg{width:17px;height:17px}
.dp-panel{display:grid;gap:22px;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start}
@media (max-width:860px){.dp-panel{grid-template-columns:1fr}}
.dp-paginas{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px;max-height:560px;overflow:auto;padding:4px;border-radius:14px;background:var(--bg-2,transparent)}
.dp-pag{display:grid;gap:4px;justify-items:center;background:none;border:0;padding:0;font:inherit;cursor:default;color:var(--fg-2)}
.dp-elegir .dp-pag{cursor:pointer}
.dp-hoja{display:block;width:100%;aspect-ratio:1/1.35;background:#fff;border:1px solid var(--line);border-radius:6px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);position:relative}
.dp-hoja canvas{width:100%;height:100%;object-fit:contain;display:block}
.dp-pag small{font-size:12.5px;font-weight:650}
.dp-pag[aria-pressed="true"] .dp-hoja{outline:3px solid var(--sec-t);outline-offset:2px}
.dp-pag[aria-pressed="true"] small{color:var(--sec-t)}
.dp-arch{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:space-between;align-items:baseline}
.dp-arch p{margin:0;display:grid}.dp-arch p span{font-size:14px;color:var(--fg-2)}
.dp-modos{display:grid;gap:8px}
.dp-modos label{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border:1px solid var(--line);border-radius:12px;cursor:pointer;font-weight:600;font-size:15px}
.dp-modos label small{display:block;font-weight:400;font-size:13px;color:var(--fg-2);margin-top:2px}
.dp-modos label:has(input:checked){border-color:var(--sec-t);background:var(--sec-s)}
.dp-modos input{margin-top:3px;accent-color:var(--sec-t)}
.dp-lista{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:8px}
.dp-lista li{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--line);border-radius:12px}
.dp-lista li span{display:grid;min-width:0}.dp-lista li b{font-size:14.5px;overflow-wrap:anywhere}.dp-lista li small{font-size:13px;color:var(--fg-2)}
.dp-lista .di-bajar{background:none;border:0;font:inherit;font-size:14px;cursor:pointer;flex:none}
/* dividir y unir PDF: pestañas y lista para unir */
.pdf-pest{margin-top:28px;max-width:440px}
.pdf-pest button{font:inherit;font-size:15px;font-weight:650;padding:10px 12px;border:0;border-radius:9px;background:none;color:var(--fg-2);cursor:pointer}
.pdf-pest button[aria-selected="true"]{background:var(--card);color:var(--fg);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.pdf-pest + .di{margin-top:14px}.pdf-pest ~ .di + .di{margin-top:14px}
.up-panel{display:grid;gap:16px;max-width:720px;margin:0 auto}
.up-lista{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.up-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card)}
.up-n{flex:none;width:26px;height:26px;border-radius:999px;display:grid;place-items:center;font-size:13px;font-weight:800;background:var(--sec-s);color:var(--sec-t)}
.up-mini{flex:none;width:46px;height:58px;display:grid;place-items:center;background:#fff;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.up-mini canvas{max-width:100%;max-height:100%}
.up-txt{display:grid;min-width:0;flex:1}.up-txt b{font-size:14.5px;overflow-wrap:anywhere}.up-txt small{font-size:13px;color:var(--fg-2)}
.up-acc{display:flex;gap:4px;flex:none}
.up-acc button{width:34px;height:34px;border-radius:9px;border:1px solid var(--line-2,var(--line));background:var(--card);color:var(--fg);font:inherit;font-size:15px;cursor:pointer}
.up-acc button:disabled{opacity:.35;cursor:default}
.up-mas{justify-self:start;cursor:pointer}
@media (max-width:560px){.up-item{flex-wrap:wrap}.up-txt{flex:1 1 calc(100% - 96px)}.up-acc{width:100%;justify-content:flex-end}}
/* foto para trámites */
.ft-panel{display:grid;gap:26px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}
@media (max-width:760px){.ft-panel{grid-template-columns:1fr}}
.ft-izq{display:grid;gap:12px}
.ft-marco{position:relative;width:min(100%,300px);margin:0 auto;border-radius:6px;overflow:hidden;background:#e9e9ee;cursor:grab;touch-action:none;box-shadow:0 6px 20px rgba(0,0,0,.15);outline-offset:3px}
.ft-marco.ft-moviendo{cursor:grabbing}
.ft-marco canvas{display:block;width:100%;height:100%}
.ft-guia{position:absolute;left:22%;right:22%;top:12%;bottom:24%;border:2px dashed rgba(255,255,255,.85);border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.18);pointer-events:none}
.ft-medida{text-align:center}
.ft-botones{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.ft-botones button{font:inherit;font-size:13.5px;font-weight:600;padding:7px 12px;border-radius:999px;border:1px solid var(--line-2,var(--line));background:var(--card);color:var(--fg);cursor:pointer}
.ft-mas{display:flex;flex-wrap:wrap;gap:8px}
.qr-panel{display:grid;gap:26px;grid-template-columns:minmax(0,1fr) minmax(0,.9fr);align-items:start}
.qr-tipos{grid-template-columns:repeat(4,1fr)}
@media (max-width:420px){.qr-tipos{grid-template-columns:repeat(2,1fr)}}
.di-campo textarea{font:inherit;font-size:16px;color:var(--fg);background:var(--bg,#fff);border:1px solid var(--line-2,var(--line));border-radius:10px;padding:10px 12px;width:100%;min-height:96px;resize:vertical}
.di-campo input[type=color]{padding:3px;height:46px;cursor:pointer}
.qr-check{display:flex;gap:8px;align-items:center;font-size:14.5px;color:var(--fg-2)}
.qr-lado{position:sticky;top:96px;display:grid;gap:14px}
.qr-vista{aspect-ratio:1;display:grid;place-items:center;border:1px solid var(--line);border-radius:18px;background:var(--bg-2,var(--card));padding:16px;overflow:hidden}
.qr-vista canvas{width:100%;height:auto;max-width:360px;image-rendering:pixelated;border-radius:6px}
.qr-vacio{margin:0;text-align:center;color:var(--fg-2);font-size:15px;max-width:240px}
.qr-info{margin:0;font-size:13.5px;color:var(--fg-2);overflow-wrap:anywhere}
.qr-botones{display:flex;flex-wrap:wrap;gap:10px}
/* celular: el QR va arriba del formulario y NO se queda pegado al bajar (va después de .qr-lado para ganarle) */
@media (max-width:860px){.qr-panel{grid-template-columns:1fr}.qr-lado{order:-1;position:static;top:auto}.qr-vista{width:min(100%,280px);margin:0 auto}.qr-botones{justify-content:center}}
`;

// ---------- portadas (SVG propios, 480 × 300) ----------
const marco = (fondo, interior, etiqueta) => `<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${etiqueta}" preserveAspectRatio="xMidYMid slice"><rect width="480" height="300" fill="${fondo}"/>${interior}</svg>`;
const hoja = (x, y, w, h, extra = '') => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="10" fill="#fff"/>${extra}</g>`;
const lineas = (w, n, y0 = 46, paso = 16, color = '#D9DEE7') => Array.from({ length: n }, (_, i) => `<rect x="18" y="${y0 + i * paso}" width="${(w - 36) * (i % 3 === 2 ? 0.6 : 1)}" height="7" rx="3.5" fill="${color}"/>`).join('');

function portadaPeso() {
  const sombra = '<filter id="pp-s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0F3B2E" flood-opacity=".22"/></filter>';
  const grande = hoja(74, 46, 150, 200, `<rect x="18" y="18" width="46" height="18" rx="5" fill="#E2504A"/><text x="41" y="31.5" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">PDF</text>${lineas(150, 8, 52)}<rect x="18" y="176" width="114" height="10" rx="5" fill="#E7ECEA"/><rect x="18" y="176" width="114" height="10" rx="5" fill="#E2504A"/>`);
  const chica = hoja(306, 108, 98, 132, `<rect x="12" y="12" width="32" height="13" rx="4" fill="#1F9D72"/><text x="28" y="21.8" font-family="Inter,Arial,sans-serif" font-size="8" font-weight="800" fill="#fff" text-anchor="middle">PDF</text>${lineas(98, 5, 36, 12, '#D9DEE7').replace(/height="7"/g, 'height="5"')}<rect x="12" y="112" width="74" height="8" rx="4" fill="#E7ECEA"/><rect x="12" y="112" width="22" height="8" rx="4" fill="#1F9D72"/>`);
  return marco('#E3F2EB', `<defs>${sombra}</defs><circle cx="420" cy="50" r="80" fill="#D2EADF"/><circle cx="40" cy="280" r="70" fill="#D2EADF"/>
  <g filter="url(#pp-s)">${grande}</g>
  <path d="M238 146 C262 132 280 132 294 146" fill="none" stroke="#1F9D72" stroke-width="7" stroke-linecap="round"/><path d="M284 132 L296 147 L279 154" fill="none" stroke="#1F9D72" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <g filter="url(#pp-s)">${chica}</g>`, 'Un PDF grande que se convierte en uno más ligero');
}

function portadaDividirPdf() {
  const sombra = '<filter id="pd-s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#5B1E2A" flood-opacity=".2"/></filter>';
  const pag = (x, y, rot, n, color) => `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#pd-s)"><rect width="104" height="140" rx="9" fill="#fff"/><rect x="14" y="14" width="40" height="8" rx="4" fill="${color}"/>${lineas(104, 5, 34, 13).replace(/height="7"/g, 'height="6"')}<circle cx="52" cy="116" r="12" fill="${color}"/><text x="52" y="120.5" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">${n}</text></g>`;
  return marco('#F8E4E4', `<defs>${sombra}</defs><circle cx="70" cy="40" r="80" fill="#F2D2D3"/><circle cx="440" cy="270" r="80" fill="#F2D2D3"/>
  ${pag(70, 92, -10, 1, '#E2504A')}${pag(188, 70, 0, 2, '#C2415B')}${pag(306, 88, 10, 3, '#8E3B78')}`, 'Un PDF separado en tres páginas');
}

function portadaQr() {
  const q = qrcode(0, 'M'); q.addData('https://vorka.mx/learn/herramientas/', 'Byte'); q.make();
  const n = q.getModuleCount(), lado = 132, m = lado / n;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${(c * m).toFixed(2)} ${(r * m).toFixed(2)}h${m.toFixed(2)}v${m.toFixed(2)}h-${m.toFixed(2)}z`;
  const sombra = '<filter id="pq-s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#1B2A55" flood-opacity=".25"/></filter>';
  return marco('#E4EAF8', `<defs>${sombra}</defs><circle cx="410" cy="60" r="90" fill="#D3DCF2"/><circle cx="60" cy="260" r="80" fill="#D3DCF2"/>
  <g transform="translate(150 22)" filter="url(#pq-s)"><rect width="180" height="270" rx="28" fill="#1C1830"/><rect x="10" y="10" width="160" height="250" rx="20" fill="#fff"/><rect x="66" y="18" width="48" height="8" rx="4" fill="#1C1830"/>
  <g transform="translate(24 62)"><path d="${d}" fill="#1C1830"/></g>
  <rect x="24" y="212" width="132" height="26" rx="13" fill="#6D4BD8"/><rect x="52" y="222" width="76" height="6" rx="3" fill="#fff" opacity=".85"/></g>`, 'Un celular con un código QR');
}

// ---------- «Reducir el peso de una foto o PDF» ----------
const panelPeso = llamado => `<div class="di" id="pe">
  ${zona('pe', 'Elige una foto o un PDF', 'Arrástralo aquí o tócalo para buscarlo. JPG, PNG, WebP o PDF.', 'Elegir archivo', 'image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf', 'Para reducir archivos necesitas activar JavaScript en tu navegador.')}
  <div class="pe-panel" id="pe-panel" hidden>
    <div class="pe-arch">${DOC}<p class="pe-info" id="pe-info"></p><button type="button" id="pe-otra">Usar otro archivo</button></div>
    <label class="di-campo">¿Cuánto debe pesar como máximo?<select id="pe-meta"><option value="0">Compresión recomendada (buena calidad)</option><option value="2097152">Menos de 2 MB</option><option value="1048576" selected>Menos de 1 MB</option><option value="512000">Menos de 500 KB</option><option value="307200">Menos de 300 KB</option><option value="204800">Menos de 200 KB</option><option value="102400">Menos de 100 KB</option></select></label>
    <label class="di-campo" id="pe-fila-max">Tamaño máximo de la foto<select id="pe-max"><option value="100000">Igual que la original</option><option value="3000">3000 px</option><option value="2000" selected>2000 px (recomendado)</option><option value="1600">1600 px</option><option value="1080">1080 px</option></select></label>
    <button class="btn acento" type="button" id="pe-reducir">Reducir peso ${FLECHA}</button>
    <p class="di-info" id="pe-progreso" aria-live="polite"></p>
  </div>
  <div class="di-res" id="pe-res" hidden>
    <div class="pe-cifras"><div><small>Antes</small><b id="pe-antes"></b></div><span class="pe-flecha" aria-hidden="true">→</span><div><small>Ahora</small><b id="pe-despues"></b></div><span class="pe-ahorro" id="pe-ahorro"></span></div>
    <p class="pe-nota" id="pe-nota" hidden></p>
    <div class="pe-vista" id="pe-vista"></div>
    <div class="pe-acc"><button class="btn acento" type="button" id="pe-bajar">Descargar archivo ${FLECHA}</button></div>
    ${llamado}
  </div>
  ${CANDADO}Tu archivo no sale de tu dispositivo: se reduce en tu navegador.</p>
</div>`;

const textoPeso = `<h2>Cómo reducir el peso de un archivo</h2>
  <p>Elige la foto o el PDF y escoge cuánto debe pesar como máximo. Si el lugar donde lo vas a subir pide «menos de 1 MB» o «menos de 2 MB», elige esa opción: la herramienta prueba varias calidades y se queda con la mejor que cabe en ese límite. Al terminar ves cuánto pesaba antes y cuánto pesa ahora, y lo descargas.</p>
  <h3>Fotos</h3>
  <p>La foto se guarda en JPG. Primero se baja la calidad poco a poco y, si con eso no alcanza, también el tamaño en píxeles. Para documentos escaneados, identificaciones o fotos para un registro, 2000 px de lado suele ser más que suficiente para que se lea bien.</p>
  <h3>PDF</h3>
  <p>Cada página se convierte en una imagen más ligera y se arma un PDF nuevo con las mismas páginas y el mismo tamaño de hoja. Funciona muy bien con PDF escaneados o con muchas fotos. La contra es que el texto deja de poder seleccionarse; revisa que todo se lea bien antes de enviarlo.</p>
  <h2>Para qué sirve</h2>
  <ul><li>Subir documentos al registro de un examen de admisión, una beca o un trámite que pide archivos chicos.</li><li>Mandar por correo un PDF que rebota por pesado.</li><li>Compartir fotos por WhatsApp o subirlas a una página sin que tarden en cargar.</li></ul>`;

const FAQ_PESO = [
  ['¿Mi archivo se sube a algún servidor?', 'No. Todo pasa en tu navegador: el archivo no se envía a Vorka ni a nadie más. Por eso puedes usarlo con documentos personales, como tu acta o tu comprobante de domicilio.'],
  ['¿Por qué después de reducir un PDF ya no puedo seleccionar el texto?', 'Para bajar el peso, cada página se guarda como imagen. Se ve igual, pero el texto ya no se puede copiar ni buscar. Si necesitas esas funciones, guarda un PDF más ligero desde el programa donde lo hiciste.'],
  ['¿Cuánto debe pesar mi archivo?', 'Depende de dónde lo subas. Muchos registros de exámenes, becas y trámites piden archivos de menos de 1 o 2 MB, pero revisa el límite exacto en la convocatoria o en la página donde lo vas a subir.'],
  ['¿Qué pasa si no llega al peso que elegí?', 'La herramienta baja la calidad hasta un punto en el que el archivo todavía se lee. Si aun así pesa más, te dice cuánto logró. Con un PDF largo, divídelo en partes; con una foto, recórtala o usa una más chica.'],
  ['¿Qué pasa con las fotos PNG con fondo transparente?', 'Se guardan en JPG, que no tiene transparencia, así que el fondo queda blanco.'],
  ['¿Funciona con fotos del iPhone?', 'En el iPhone, Safari normalmente entrega la foto en JPG al elegirla. En computadora, si tu foto termina en .heic, ábrela y guárdala como JPG antes de usarla aquí.'],
  ['¿Hay límite?', 'Funciona con PDF de hasta 300 páginas. Los archivos muy grandes tardan más y en celulares pueden quedarse sin memoria; si pasa, usa una computadora.'],
];

// ---------- «Dividir un PDF por páginas» ----------
const ACEPTA_UNIR = 'application/pdf,.pdf,image/jpeg,image/png,image/webp';
const panelUnir = llamado => `<div class="di" id="up" role="tabpanel" aria-labelledby="pt-unir" hidden>
  ${zona('up', 'Elige tus PDF o fotos', 'Puedes elegir varios a la vez, o arrastrarlos aquí. PDF, JPG, PNG o WebP.', 'Elegir archivos', ACEPTA_UNIR, 'Para unir PDF necesitas activar JavaScript en tu navegador.', true)}
  <div class="up-panel" id="up-panel" hidden>
    <ol class="up-lista" id="up-lista" aria-label="Archivos en el orden en que se van a unir"></ol>
    <label class="btn tinta up-mas">Agregar más archivos<input id="up-mas" class="vh" type="file" accept="${ACEPTA_UNIR}" multiple></label>
    <label class="di-campo">Nombre del PDF<input id="up-nombre" type="text" autocomplete="off"></label>
    <p class="di-info" id="up-resumen" aria-live="polite"></p>
    <button class="btn acento" type="button" id="up-unir">Unir en un PDF ${FLECHA}</button>
    <p class="di-info" id="up-progreso" aria-live="polite"></p>
  </div>
  <div class="di-res" id="up-res" hidden>
    <div class="di-res-cab"><h2>Tu PDF está listo</h2><button class="btn acento" type="button" id="up-bajar">Descargar PDF ${FLECHA}</button></div>
    <p class="di-info" id="up-info"></p>
    ${llamado}
  </div>
  ${CANDADO}Tus archivos no salen de tu dispositivo: se unen en tu navegador.</p>
</div>`;

const panelPdf = llamado => `<div class="di-seg pdf-pest" role="tablist" id="pdf-pestanas" aria-label="¿Qué quieres hacer?">
  <button type="button" role="tab" id="pt-dividir" data-pestana="dividir" aria-controls="dp" aria-selected="true">Dividir PDF</button>
  <button type="button" role="tab" id="pt-unir" data-pestana="unir" aria-controls="up" aria-selected="false" tabindex="-1">Unir PDF o fotos</button>
</div>
${panelDividirPdf(llamado)}
${panelUnir(llamado)}`;

const panelDividirPdf = llamado => `<div class="di" id="dp" role="tabpanel" aria-labelledby="pt-dividir">
  ${zona('dp', 'Elige un PDF', 'Arrástralo aquí o tócalo para buscarlo.', 'Elegir PDF', 'application/pdf,.pdf', 'Para dividir PDF necesitas activar JavaScript en tu navegador.')}
  <p class="di-info" id="dp-progreso" aria-live="polite"></p>
  <div class="dp-panel" id="dp-panel" hidden>
    <div class="dp-paginas" id="dp-paginas" aria-label="Páginas del PDF"></div>
    <div class="di-opc">
      <div class="dp-arch"><p id="dp-info"></p><button type="button" id="dp-otra">Usar otro PDF</button></div>
      <fieldset><legend>Cómo dividirlo</legend>
        <div class="dp-modos">
          <label><input type="radio" name="dp-modo" value="cada" checked><span>Cada página en un PDF<small>Un archivo por página.</small></span></label>
          <label><input type="radio" name="dp-modo" value="extraer"><span>Sacar solo algunas páginas<small>Toca las páginas o escríbelas; salen en un solo PDF.</small></span></label>
          <label><input type="radio" name="dp-modo" value="rangos"><span>Por rangos<small>Cada rango sale en su propio PDF.</small></span></label>
          <label><input type="radio" name="dp-modo" value="n"><span>Cada cierto número de páginas<small>Por ejemplo, de 2 en 2.</small></span></label>
        </div>
      </fieldset>
      <label class="di-campo" id="dp-g-sel" hidden>Páginas que quieres<input id="dp-sel" type="text" inputmode="numeric" placeholder="1, 3, 5-7" autocomplete="off"></label>
      <label class="di-campo" id="dp-g-rangos" hidden>Rangos<input id="dp-rangos" type="text" inputmode="numeric" placeholder="1-3, 4-8, 9" autocomplete="off"></label>
      <label class="di-campo" id="dp-g-n" hidden>Páginas por archivo<input id="dp-n" type="number" inputmode="numeric" min="1" value="2"></label>
      <p class="di-info" id="dp-resumen" aria-live="polite"></p>
      <button class="btn acento" type="button" id="dp-dividir">Dividir PDF ${FLECHA}</button>
    </div>
  </div>
  <div class="di-res" id="dp-res" hidden>
    <div class="di-res-cab"><h2>Tus PDF</h2><button class="btn tinta" type="button" id="dp-zip" hidden>Descargar todos (.zip)</button></div>
    <ul class="dp-lista" id="dp-lista"></ul>
    ${llamado}
  </div>
  ${CANDADO}Tu PDF no sale de tu dispositivo: se divide en tu navegador.</p>
</div>`;

const textoDividirPdf = `<h2>Cómo dividir un PDF</h2>
  <p>Elige el PDF y vas a ver todas sus páginas. Después escoge cómo dividirlo: cada página en su propio archivo, solo las páginas que necesitas, por rangos (por ejemplo «1-3, 4-8») o cada cierto número de páginas. Toca «Dividir PDF» y descarga los archivos uno por uno o todos juntos en un .zip.</p>
  <p>Las páginas se copian tal como están en el original: no pierden calidad, conservan su tamaño de hoja y el texto se sigue pudiendo seleccionar.</p>
  <h2>Para qué sirve</h2>
  <ul><li>Separar un documento escaneado en varios archivos: acta, CURP, comprobante de domicilio y certificado, cada uno por su lado.</li><li>Mandar solo el capítulo o las páginas que te pidieron de un libro o unos apuntes.</li><li>Subir un PDF largo a una plataforma que pide archivos más chicos.</li></ul>
  <h2>Cómo unir PDF y fotos en un solo archivo</h2>
  <p>En la pestaña <a href="#unir">«Unir PDF o fotos»</a> elige todos los archivos que quieres juntar: pueden ser PDF, fotos o una mezcla. Acomódalos con las flechas en el orden que quieras, ponle nombre al archivo y toca «Unir en un PDF». Las páginas de los PDF se copian tal cual, y cada foto ocupa una hoja tamaño carta.</p>
  <p>Sirve para mandar todos tus documentos de inscripción en un solo PDF, juntar las fotos de tus apuntes o de una tarea hecha a mano, o armar un expediente con varias partes.</p>`;

const FAQ_DIVIDIR_PDF = [
  ['¿Mi PDF se sube a algún servidor?', 'No. Todo pasa en tu navegador: el archivo no se envía a Vorka ni a nadie más.'],
  ['¿Las páginas pierden calidad?', 'No. Se copian tal cual del original, con su texto, sus imágenes y su tamaño de hoja.'],
  ['¿Cómo saco solo algunas páginas?', 'Elige «Sacar solo algunas páginas» y toca las miniaturas de las que quieres, o escríbelas así: 1, 3, 5-7. Salen juntas en un solo PDF y en el orden del original.'],
  ['¿Funciona con PDF con contraseña?', 'No con los que piden contraseña para abrirse. Ábrelo, guárdalo sin contraseña y vuelve a intentarlo.'],
  ['¿Puedo unir fotos con PDF?', 'Sí. En «Unir PDF o fotos» puedes mezclar PDF y fotos JPG, PNG o WebP. Cada foto queda en una hoja tamaño carta, centrada y del tamaño que quepa.'],
  ['¿Cómo cambio el orden de los archivos al unirlos?', 'Con las flechas ↑ y ↓ de cada archivo. El número de la izquierda es el orden en que van a quedar en el PDF.'],
  ['Después de dividirlo o unirlo, ¿cómo hago que pese menos?', 'Usa nuestra herramienta para reducir el peso de un PDF; funciona igual, en tu navegador.'],
];

// ---------- «Generador de código QR» ----------
const panelQr = () => `<div class="di" id="qr">
  <noscript><p class="di-aviso">Para crear códigos QR necesitas activar JavaScript en tu navegador.</p></noscript>
  <div class="qr-panel">
    <div class="di-opc">
      <fieldset><legend>¿A dónde debe llevar?</legend>
        <div class="di-seg qr-tipos"><label><input type="radio" name="qr-tipo" value="enlace" checked>Enlace</label><label><input type="radio" name="qr-tipo" value="whatsapp">WhatsApp</label><label><input type="radio" name="qr-tipo" value="wifi">Wi‑Fi</label><label><input type="radio" name="qr-tipo" value="texto">Texto</label></div>
      </fieldset>
      <div data-tipo="enlace" class="di-opc"><label class="di-campo">Enlace<input id="qr-url" type="url" inputmode="url" placeholder="https://tu-pagina.com" autocomplete="off"></label></div>
      <div data-tipo="whatsapp" class="di-opc" hidden><label class="di-campo">Número de WhatsApp<input id="qr-tel" type="tel" inputmode="tel" placeholder="10 dígitos, por ejemplo 461 123 4567" autocomplete="off"></label><label class="di-campo">Mensaje que ya aparece escrito (opcional)<textarea id="qr-msg" maxlength="500" placeholder="Hola, quiero información"></textarea></label></div>
      <div data-tipo="wifi" class="di-opc" hidden><label class="di-campo">Nombre de la red<input id="qr-red" type="text" autocomplete="off"></label><label class="di-campo">Contraseña<input id="qr-clave" type="text" autocomplete="off"></label><label class="di-campo">Seguridad<select id="qr-seg"><option value="WPA">WPA / WPA2 / WPA3 (la más común)</option><option value="WEP">WEP</option><option value="nopass">Sin contraseña</option></select></label><label class="qr-check"><input type="checkbox" id="qr-oculta">Es una red oculta</label></div>
      <div data-tipo="texto" class="di-opc" hidden><label class="di-campo">Texto<textarea id="qr-texto" maxlength="1500"></textarea></label></div>
      <fieldset><legend>Diseño</legend>
        <div class="di-par"><label class="di-campo">Color del código<input id="qr-color" type="color" value="#17131d"></label><label class="di-campo">Fondo<input id="qr-fondo" type="color" value="#ffffff"></label></div>
        <div class="di-par"><label class="di-campo">Tamaño al descargar<select id="qr-tam"><option value="512">512 px</option><option value="1024" selected>1024 px</option><option value="2048">2048 px</option></select></label><label class="di-campo">Resistencia a daños<select id="qr-nivel"><option value="L">Baja</option><option value="M" selected>Media (recomendada)</option><option value="Q">Alta</option><option value="H">Máxima (si le pones un logo encima)</option></select></label></div>
        <label class="di-campo">Nombre del archivo<input id="qr-nombre" type="text" value="codigo-qr" autocomplete="off"></label>
      </fieldset>
    </div>
    <div class="qr-lado">
      <div class="qr-vista" id="qr-vista"><p class="qr-vacio">Aquí aparece tu código QR.</p></div>
      <p class="qr-info" id="qr-info" aria-live="polite"></p>
      <p class="di-aviso" id="qr-aviso" role="alert" hidden></p>
      <div class="qr-botones"><button class="btn acento" type="button" id="qr-png" disabled>Descargar PNG ${FLECHA}</button><button class="btn tinta" type="button" id="qr-svg" disabled>Descargar SVG</button></div>
    </div>
  </div>
  ${CANDADO}El código se crea en tu navegador y lleva directo a lo que escribiste: no pasa por nuestros servidores.</p>
</div>`;

const textoQr = `<h2>Cómo crear un código QR</h2>
  <p>Escoge a dónde debe llevar el código: un enlace, un chat de WhatsApp con un mensaje ya escrito, tu red Wi‑Fi o un texto. Escribe los datos y el código aparece al momento. Cambia los colores si quieres y descárgalo en PNG para usarlo en redes o documentos, o en SVG para mandarlo a imprenta sin que se pixelee.</p>
  <h2>Ideas para usarlo</h2>
  <ul><li>En el mostrador o el menú de tu negocio, para que te escriban por WhatsApp.</li><li>En la recepción de tu casa o tu local, para compartir el Wi‑Fi sin dictar la contraseña.</li><li>En un cartel, una tarea o una presentación, para llevar a tu página, tu formulario o tu video.</li></ul>
  <p>Si lo que necesitas es un QR distinto para cada invitado de tu evento, con confirmación de asistencia, eso lo hace <a href="/tienda/brindi/">Brindi</a>, las invitaciones digitales de Vorka.</p>`;

const FAQ_QR = [
  ['¿El código QR caduca?', 'No. El código guarda directamente el enlace o el texto que escribiste; no pasa por ningún servidor nuestro. Va a funcionar mientras exista la página a la que lleva.'],
  ['¿Puedo cambiar a dónde lleva después de imprimirlo?', 'No. Para cambiarlo tendrías que crear e imprimir uno nuevo. Si crees que el destino va a cambiar, haz que lleve a una página que tú controles y cambia lo que hay en esa página.'],
  ['¿Lo descargo en PNG o en SVG?', 'PNG para redes, presentaciones y documentos. SVG para imprenta o para imprimirlo muy grande, porque no pierde nitidez a ningún tamaño.'],
  ['¿De qué tamaño lo imprimo?', 'Para escanearlo de cerca, que mida al menos 2 × 2 cm. Como regla práctica, el código debe medir alrededor de una décima parte de la distancia desde la que lo van a escanear, y siempre con un margen blanco alrededor.'],
  ['¿Qué colores funcionan?', 'Un color oscuro sobre un fondo claro, con buen contraste. Los códigos claros sobre fondo oscuro o con colores parecidos fallan en muchas cámaras; la herramienta te avisa si pasa.'],
  ['¿El QR de Wi‑Fi funciona en todos los celulares?', 'La mayoría de los celulares recientes, iPhone y Android, lo leen con la cámara y se conectan a la red al tocar el aviso.'],
];

// ---------- «Foto para trámites» ----------
function portadaFoto() {
  const sombra = '<filter id="pf-s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#4A3410" flood-opacity=".22"/></filter>';
  const persona = (x, y, w, h) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="#DCE7F4"/><circle cx="${w / 2}" cy="${h * .4}" r="${w * .2}" fill="#7A5A44"/><path d="M${w * .14} ${h} C${w * .18} ${h * .7} ${w * .82} ${h * .7} ${w * .86} ${h}Z" fill="#2E4A7A"/></g>`;
  const chicas = [0, 1, 2, 3].map(i => `<g transform="translate(${282 + (i % 2) * 64} ${70 + Math.floor(i / 2) * 78})"><rect width="56" height="68" fill="#fff"/>${persona(3, 3, 50, 62)}</g>`).join('');
  return marco('#F6EDDC', `<defs>${sombra}</defs><circle cx="420" cy="260" r="90" fill="#EEDFC2"/><circle cx="50" cy="40" r="70" fill="#EEDFC2"/>
  <g transform="translate(262 52)" filter="url(#pf-s)"><rect width="156" height="196" rx="8" fill="#fff"/></g>${chicas}
  <g filter="url(#pf-s)"><rect x="70" y="40" width="160" height="200" rx="6" fill="#fff"/></g>${persona(80, 50, 140, 180)}
  <g fill="none" stroke="#B07A1E" stroke-width="2.5" stroke-linecap="round"><path d="M80 258 H220 M80 252 v12 M220 252 v12"/><path d="M48 50 V230 M42 50 h12 M42 230 h12"/></g>
  <text x="150" y="282" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="800" fill="#8A5E12" text-anchor="middle">2.5 cm</text>
  <text x="30" y="145" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="800" fill="#8A5E12" text-anchor="middle" transform="rotate(-90 30 145)">3 cm</text>`, 'Una foto tamaño infantil con sus medidas y una hoja con varias copias');
}

const panelFoto = llamado => `<div class="di" id="ft">
  ${zona('ft', 'Elige tu foto', 'De frente, con fondo claro y buena luz. Arrástrala aquí o tócala para buscarla. JPG, PNG o WebP.', 'Elegir foto', 'image/jpeg,image/png,image/webp', 'Para preparar tu foto necesitas activar JavaScript en tu navegador.')}
  <div class="ft-panel" id="ft-panel" hidden>
    <div class="ft-izq">
      <div class="ft-marco" id="ft-marco" tabindex="0" role="img" aria-label="Recorte de tu foto. Arrástrala para acomodarla; también se mueve con las flechas del teclado."><canvas id="ft-lienzo" width="1" height="1"></canvas><span class="ft-guia" aria-hidden="true"></span></div>
      <p class="di-info ft-medida" id="ft-medida" aria-live="polite"></p>
      <label class="di-campo">Acercar<input id="ft-zoom" type="range" min="100" max="400" value="100"></label>
      <div class="ft-botones"><button type="button" id="ft-girar">Girar</button><button type="button" id="ft-centrar">Centrar</button><button type="button" id="ft-otra">Usar otra foto</button></div>
      <p class="di-info">Arrastra la foto para que tu cara quede dentro del óvalo.</p>
    </div>
    <div class="di-opc">
      <label class="di-campo">Medida<select id="ft-tam"><option value="2.5x3" selected>Infantil · 2.5 × 3 cm</option><option value="3.5x4.5">Pasaporte · 3.5 × 4.5 cm</option><option value="5x5">Cuadrada · 5 × 5 cm (2 × 2 pulgadas)</option><option value="6x9">Título · 6 × 9 cm</option><option value="otra">Otra medida</option></select></label>
      <div class="di-par" id="ft-g-otra" hidden><label class="di-campo">Ancho (cm)<input id="ft-ancho" type="number" inputmode="decimal" min="1" max="20" step="0.1" value="3"></label><label class="di-campo">Alto (cm)<input id="ft-alto" type="number" inputmode="decimal" min="1" max="25" step="0.1" value="4"></label></div>
      <div class="di-par"><label class="di-campo">Hoja para imprimir<select id="ft-hoja"><option value="carta">Hoja carta</option><option value="foto">Papel foto 10 × 15 cm</option></select></label><label class="di-campo">Copias<input id="ft-copias" type="number" inputmode="numeric" min="1" value="1"></label></div>
      <p class="di-info" id="ft-caben" aria-live="polite"></p>
      <button class="btn acento" type="button" id="ft-pdf">Descargar hoja en PDF ${FLECHA}</button>
      <div class="ft-mas"><button class="btn tinta" type="button" id="ft-jpg">Hoja en JPG</button><button class="btn tinta" type="button" id="ft-foto">Solo la foto (JPG)</button></div>
      <p class="pe-nota">Al imprimir el PDF elige «Tamaño real» o «100 %», no «Ajustar a la página», para que las fotos midan exacto.</p>
      ${llamado}
    </div>
  </div>
  ${CANDADO}Tu foto no sale de tu dispositivo: se recorta en tu navegador.</p>
</div>`;

const textoFoto = `<h2>Cómo hacer tu foto para trámites</h2>
  <p>Elige una foto tuya de frente, escoge la medida que te piden y arrástrala hasta que tu cara quede dentro del óvalo; si hace falta, acércala con la barra. Después elige la hoja: carta, para imprimir en cualquier impresora, o papel foto de 10 × 15 cm, para mandarla a imprimir a una tienda de fotos. Descarga la hoja en PDF, imprímela a tamaño real y recorta por las líneas.</p>
  <p>También puedes descargar solo la foto, ya recortada a la medida, para subirla a un registro en línea.</p>
  <h2>Consejos para que la foto salga bien</h2>
  <ul><li>Tómala de frente, con la cara completa y los hombros a la vista.</li><li>Ponte frente a una pared lisa y clara, con luz de día y sin sombras en la cara.</li><li>No uses filtros ni retoques, y deja una distancia de un metro o más para que la cara no se deforme.</li><li>Revisa lo que pide tu trámite: el color del fondo, si se permiten lentes y si la foto debe ser reciente.</li></ul>`;

const FAQ_FOTO = [
  ['¿Cuánto mide la foto tamaño infantil?', '2.5 cm de ancho por 3 cm de alto. Es una de las medidas que más piden escuelas y credenciales. Si tu trámite pide otra, elige «Otra medida» y escríbela en centímetros.'],
  ['¿Por qué al imprimir no salen del tamaño correcto?', 'Porque la impresora ajustó la hoja. Al imprimir el PDF, elige «Tamaño real» o «100 %» en lugar de «Ajustar a la página». En una tienda de fotos, pide que la impriman sin recortar ni ajustar.'],
  ['¿Puedo mandarla a imprimir a una tienda de fotos?', 'Sí. Elige «Papel foto 10 × 15 cm», descarga la hoja en JPG y pide que la impriman en ese tamaño (también se le llama 4 × 6 pulgadas).'],
  ['¿La herramienta quita o cambia el fondo?', 'No. Para que el fondo salga blanco o claro, toma la foto frente a una pared de ese color.'],
  ['¿Mi foto se sube a algún servidor?', 'No. Se recorta en tu navegador y no se envía a Vorka ni a nadie más.'],
  ['¿Sirve para cualquier trámite?', 'Te da la medida exacta, pero cada trámite tiene sus propias reglas. Algunos toman la foto en la oficina o piden una foto digital con requisitos propios; revisa siempre las instrucciones oficiales.'],
];

// Las tres herramientas, en el formato que usa src/learn/herramientas.js
export const NUEVAS = [
  { ruta: '/learn/herramientas/reducir-peso/', nombre: 'Reducir el peso de una foto o PDF', corto: 'Reducir peso',
    descripcion: 'Comprime una foto o un PDF para que pese menos de 1 MB, 2 MB o lo que te pidan. Gratis y en tu navegador.',
    usos: ['Menos de 1 MB', 'Registro de examen o beca', 'PDF escaneado'], portada: portadaPeso,
    titulo: 'Reducir el peso de un PDF o foto gratis (menos de 1 MB) | Vorka Learn',
    meta: 'Comprime un PDF o una foto gratis para que pese menos de 1 MB, 2 MB o 500 KB, como piden los registros de exámenes, becas y trámites. Tu archivo no se sube.',
    h1: 'Reducir el peso de una foto o PDF',
    lead: 'Comprime un PDF o una foto para que pese menos de lo que te piden: 2 MB, 1 MB, 500 KB o menos. Es gratis, no pide cuenta y tu archivo se queda en tu dispositivo.',
    panel: panelPeso, texto: textoPeso, faq: FAQ_PESO, script: js('peso'), modulo: true, llamado: true, anuncios: ['vuelve', 'brindi'], categoria: 'UtilitiesApplication' },
  { ruta: '/learn/herramientas/dividir-pdf/', nombre: 'Dividir y unir PDF', corto: 'Dividir y unir PDF', alias: ['/learn/herramientas/unir-pdf/'],
    descripcion: 'Separa un PDF en varios archivos, saca solo las páginas que necesitas o junta varios PDF y fotos en uno solo. Gratis y en tu navegador.',
    usos: ['Separar páginas', 'Unir PDF', 'Fotos a PDF'], portada: portadaDividirPdf,
    titulo: 'Dividir y unir PDF gratis (separar páginas, juntar PDF y fotos) | Vorka Learn',
    meta: 'Divide un PDF por páginas o une varios PDF y fotos en un solo archivo, gratis. Sin perder calidad y sin subir tus archivos.',
    h1: 'Dividir y unir PDF',
    lead: 'Separa un PDF en varios archivos o saca solo las páginas que necesitas. También puedes juntar varios PDF y fotos en uno solo. Es gratis, no pide cuenta y tus archivos se quedan en tu dispositivo.',
    panel: panelPdf, texto: textoDividirPdf, faq: FAQ_DIVIDIR_PDF, script: js('dividir-pdf'), modulo: true, llamado: true, anuncios: ['vuelve', 'brindi'], categoria: 'UtilitiesApplication' },
  { ruta: '/learn/herramientas/codigo-qr/', nombre: 'Generador de código QR', corto: 'Código QR',
    descripcion: 'Crea un código QR para un enlace, tu WhatsApp o tu Wi‑Fi y descárgalo en PNG o SVG. No caduca. Gratis y en tu navegador.',
    usos: ['Enlace', 'WhatsApp', 'Wi‑Fi'], portada: portadaQr,
    titulo: 'Generador de código QR gratis (enlace, WhatsApp, Wi‑Fi) | Vorka Learn',
    meta: 'Crea un código QR gratis para un enlace, WhatsApp o Wi‑Fi, con tus colores, y descárgalo en PNG o SVG. No caduca y no pide cuenta.',
    h1: 'Generador de código QR',
    lead: 'Crea un código QR para un enlace, tu WhatsApp o tu Wi‑Fi y descárgalo en PNG o SVG. Es gratis, no caduca y no pide cuenta.',
    panel: panelQr, texto: textoQr, faq: FAQ_QR, script: js('qr'), modulo: true, llamado: false, anuncios: ['brindi', 'vuelve'], categoria: 'UtilitiesApplication' },
  { ruta: '/learn/herramientas/foto-tramites/', nombre: 'Foto para trámites', corto: 'Foto para trámites',
    descripcion: 'Recorta tu foto a tamaño infantil, pasaporte u otra medida y arma la hoja para imprimir varias copias. Gratis y en tu navegador.',
    usos: ['Infantil 2.5 × 3 cm', 'Pasaporte', 'Hoja carta o 10 × 15'], portada: portadaFoto,
    titulo: 'Foto tamaño infantil gratis para imprimir (y pasaporte) | Vorka Learn',
    meta: 'Haz tu foto tamaño infantil (2.5 × 3 cm), pasaporte o la medida que necesites y descarga una hoja lista para imprimir varias copias. Gratis y sin subir tu foto.',
    h1: 'Foto para trámites',
    lead: 'Recorta tu foto a tamaño infantil, pasaporte o la medida que te pidan, y descarga una hoja lista para imprimir varias copias en tu casa o en una tienda de fotos. Es gratis, no pide cuenta y tu foto se queda en tu dispositivo.',
    panel: panelFoto, texto: textoFoto, faq: FAQ_FOTO, script: js('foto'), modulo: true, llamado: true, anuncios: ['brindi', 'vuelve'], categoria: 'PhotographyApplication' },
];
