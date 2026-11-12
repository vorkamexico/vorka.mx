// Herramientas gratis de Vorka Learn · piezas que comparten (zona para soltar archivos, descargas, .zip, tamaños).
// Todo corre en el navegador: ningún archivo sale del dispositivo.
export const $ = id => document.getElementById(id);

export function pesoTexto(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB';
  return (b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 2 : 1) + ' MB';
}

export function nombreBase(n, def = 'archivo') {
  return String(n || def).replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || def;
}

export function bajar(blob, nombre) {
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 15000);
}

// Zona para elegir, arrastrar o pegar archivos. acepta(archivo) → true/false; alCargar(archivos)
export function zonaArchivos({ zona, entrada, acepta, alCargar, aviso }) {
  const recibir = lista => {
    const l = [...(lista || [])].filter(acepta);
    if (!l.length) { aviso?.('Ese archivo no se puede usar aquí. Revisa el tipo de archivo (las fotos HEIC del iPhone compártelas como JPG).'); return; }
    aviso?.('');
    alCargar(entrada.multiple ? l : [l[0]]);
  };
  entrada.addEventListener('change', () => { recibir(entrada.files); entrada.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.add('di-encima'); }));
  ['dragleave', 'drop'].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.remove('di-encima'); }));
  zona.addEventListener('drop', e => recibir(e.dataTransfer?.files));
  // pegar (Ctrl + V) solo le llega a la zona que está a la vista (en «Dividir y unir PDF» hay dos)
  document.addEventListener('paste', e => { const f = e.clipboardData?.files; if (f?.length && zona.offsetParent) { e.preventDefault(); recibir(f); } });
}

export function avisador(el) {
  return t => { el.textContent = t || ''; el.hidden = !t; };
}

// ---------- .zip (método «store»: las imágenes y PDF ya vienen comprimidos) ----------
const TABLA = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = TABLA[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
// archivos: [{ nombre, datos: Uint8Array }]
export function hacerZip(archivos) {
  const partes = [], central = [], enc = new TextEncoder(), d = new Date();
  let offset = 0;
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const a of archivos) {
    const n = enc.encode(a.nombre), crc = crc32(a.datos), L = a.datos.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint16(10, hora, true); h.setUint16(12, fecha, true); h.setUint32(14, crc, true); h.setUint32(18, L, true); h.setUint32(22, L, true);
    h.setUint16(26, n.length, true);
    partes.push(h.buffer, n, a.datos);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(12, hora, true); c.setUint16(14, fecha, true); c.setUint32(16, crc, true); c.setUint32(20, L, true); c.setUint32(24, L, true);
    c.setUint16(28, n.length, true); c.setUint32(42, offset, true);
    central.push(c.buffer, n);
    offset += 30 + n.length + L;
  }
  const tam = central.reduce((s, x) => s + x.byteLength, 0), f = new DataView(new ArrayBuffer(22));
  f.setUint32(0, 0x06054b50, true); f.setUint16(8, archivos.length, true); f.setUint16(10, archivos.length, true);
  f.setUint32(12, tam, true); f.setUint32(16, offset, true);
  return new Blob([...partes, ...central, f.buffer], { type: 'application/zip' });
}

// ---------- PDF (las librerías se cargan solo cuando hacen falta) ----------
const LIB = new URL('./lib/', import.meta.url).href;
let PDFJS = null;
export async function pdfjs() {
  if (!PDFJS) {
    PDFJS = await import(LIB + 'pdf.min.js');
    PDFJS.GlobalWorkerOptions.workerSrc = LIB + 'pdf.worker.min.js';
  }
  return PDFJS;
}
export async function abrirPdfjs(datos) {
  const p = await pdfjs();
  return p.getDocument({ data: datos.slice(), isEvalSupported: false, standardFontDataUrl: LIB + 'standard_fonts/', cMapUrl: LIB + 'cmaps/', cMapPacked: true }).promise;
}
export async function pdfLib() { return import(LIB + 'pdf-lib.min.js'); }

// Dibuja una página de pdf.js en un canvas a la escala pedida (fondo blanco)
export async function dibujarPagina(doc, n, escala) {
  const pag = await doc.getPage(n), vp = pag.getViewport({ scale: escala });
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.floor(vp.width)); c.height = Math.max(1, Math.floor(vp.height));
  const cx = c.getContext('2d');
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
  // intent «print»: pdf.js no espera a requestAnimationFrame, así sigue trabajando aunque la pestaña quede en segundo plano
  await pag.render({ canvasContext: cx, viewport: vp, intent: 'print' }).promise;
  const base = pag.getViewport({ scale: 1 });
  pag.cleanup();
  return { canvas: c, ancho: base.width, alto: base.height };
}

export const aBlob = (c, tipo, q) => new Promise((ok, mal) => c.toBlob(b => b ? ok(b) : mal(new Error('toBlob')), tipo, q));
export const espera = () => new Promise(r => setTimeout(r, 0));

export function avisoPdfProtegido(e) {
  const m = String(e?.name || '') + ' ' + String(e?.message || '');
  if (/password/i.test(m)) return 'Este PDF tiene contraseña. Ábrelo, guárdalo sin contraseña y vuelve a intentarlo.';
  return 'No pudimos abrir ese PDF. Puede estar dañado; prueba con otro.';
}
