// Vorka Learn · «Foto para trámites»: recorta una foto a la medida que piden (infantil, pasaporte, cuadrada…) y arma la
// hoja para imprimir (carta o foto de 10 × 15 cm) con varias copias y líneas de corte, en PDF a tamaño real o en JPG.
// Todo en el navegador. Las medidas se guardan a 300 dpi.
import { $, nombreBase, bajar, zonaArchivos, avisador, pdfLib, aBlob } from './comun.js';

const raiz = $('ft');
if (raiz) {
  const zona = $('ft-zona'), entrada = $('ft-archivo'), panel = $('ft-panel'), marco = $('ft-marco'), lienzo = $('ft-lienzo'),
    tam = $('ft-tam'), gOtra = $('ft-g-otra'), anchoCm = $('ft-ancho'), altoCm = $('ft-alto'), zoom = $('ft-zoom'), girar = $('ft-girar'),
    centrar = $('ft-centrar'), hoja = $('ft-hoja'), copias = $('ft-copias'), caben = $('ft-caben'), btnFoto = $('ft-foto'), btnPdf = $('ft-pdf'),
    btnJpg = $('ft-jpg'), otra = $('ft-otra'), medida = $('ft-medida'), aviso = avisador($('ft-aviso'));
  const DPI = 300, CM = DPI / 2.54, PT = 72 / 2.54;   // px por cm a 300 dpi · puntos PDF por cm
  const HOJAS = { carta: [21.59, 27.94], foto: [10.16, 15.24] };
  let img = null, nombre = 'foto', rot = 0, ox = 0, oy = 0;

  const medidas = () => {
    if (tam.value === 'otra') return [Math.min(20, Math.max(1, +anchoCm.value || 3)), Math.min(25, Math.max(1, +altoCm.value || 4))];
    return tam.value.split('x').map(Number);
  };
  // Tamaño de la foto ya girada y la escala con la que cubre un rectángulo de w × h
  const dims = () => rot % 180 ? [img.height, img.width] : [img.width, img.height];
  const escalaCubre = (w, h) => { const [iw, ih] = dims(); return Math.max(w / iw, h / ih) * (+zoom.value / 100); };
  function limitar(w, h) {
    const [iw, ih] = dims(), e = escalaCubre(w, h), mx = Math.max(0, (iw * e - w) / 2), my = Math.max(0, (ih * e - h) / 2);
    ox = Math.max(-mx / w, Math.min(mx / w, ox)); oy = Math.max(-my / h, Math.min(my / h, oy));   // desplazamiento en fracción del marco
  }
  // Dibuja el recorte en un canvas de w × h (la vista previa o la foto final)
  function dibujar(c, w, h) {
    limitar(w, h);
    const cx = c.getContext('2d'), e = escalaCubre(w, h);
    c.width = Math.round(w); c.height = Math.round(h);
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
    cx.save(); cx.translate(w / 2 + ox * w, h / 2 + oy * h); cx.rotate(rot * Math.PI / 180); cx.scale(e, e);
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, -img.width / 2, -img.height / 2);
    cx.restore();
  }
  function vista() {
    if (!img) return;
    const [w, h] = medidas();
    marco.style.aspectRatio = w + ' / ' + h;
    gOtra.hidden = tam.value !== 'otra';
    const r = marco.getBoundingClientRect(), pw = Math.max(1, r.width), ph = pw * h / w;
    dibujar(lienzo, pw * devicePixelRatio, ph * devicePixelRatio);
    medida.textContent = fmt(w) + ' × ' + fmt(h) + ' cm · ' + Math.round(w * CM) + ' × ' + Math.round(h * CM) + ' px a 300 dpi';
    const n = acomodo().total;
    copias.max = Math.max(1, n);
    // 8 copias de entrada (no gastar tinta de más); si la persona ya eligió, solo se ajusta a lo que cabe
    if (!copias.dataset.tocado) copias.value = Math.min(n, 8); else if (+copias.value > n) copias.value = n;
    caben.textContent = n ? 'Caben hasta ' + n + ' en la hoja.' : 'La foto no cabe en esa hoja.';
    btnPdf.disabled = btnJpg.disabled = !n;
  }
  const fmt = n => String(Math.round(n * 100) / 100).replace('.', '.');

  // Cuántas copias caben: margen 0.5 cm y 0.3 cm entre fotos
  function acomodo() {
    const [w, h] = medidas(), [W, H] = HOJAS[hoja.value], m = 0.5, g = 0.3;
    const cols = Math.max(0, Math.floor((W - 2 * m + g) / (w + g))), filas = Math.max(0, Math.floor((H - 2 * m + g) / (h + g)));
    return { w, h, W, H, cols, filas, total: cols * filas, x0: (W - (cols * w + (cols - 1) * g)) / 2, y0: m + 0.2, g };
  }
  const posiciones = a => { const n = Math.min(a.total, Math.max(1, parseInt(copias.value, 10) || 1)), out = [];
    for (let i = 0; i < n; i++) { const c = i % a.cols, f = Math.floor(i / a.cols); out.push([a.x0 + c * (a.w + a.g), a.y0 + f * (a.h + a.g)]); } return out; };

  async function fotoFinal() {
    const [w, h] = medidas(), c = document.createElement('canvas');
    dibujar(c, Math.round(w * CM), Math.round(h * CM));
    return { canvas: c, blob: await aBlob(c, 'image/jpeg', 0.95) };
  }

  function cargar([f]) {
    createImageBitmap(f).then(b => {
      img = b; nombre = nombreBase(f.name, 'foto'); rot = 0; ox = oy = 0; zoom.value = 100; delete copias.dataset.tocado;
      zona.hidden = true; panel.hidden = false; aviso('');
      setTimeout(vista, 0);   // después de mostrar el panel, para medir el marco (sin requestAnimationFrame: sigue en segundo plano)
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(() => aviso('No pudimos abrir esa foto. Si es HEIC (iPhone), compártela como JPG y vuelve a intentarlo.'));
  }
  zonaArchivos({ zona, entrada, aviso, alCargar: cargar, acepta: f => /^image\/(jpeg|png|webp|gif|bmp)$/.test(f.type) });
  otra.addEventListener('click', () => { img = null; panel.hidden = true; zona.hidden = false; entrada.click(); });

  // Arrastrar para acomodar la cara (mouse y dedo)
  let arrastre = null;
  marco.addEventListener('pointerdown', e => { if (!img) return; arrastre = { x: e.clientX, y: e.clientY, ox, oy }; marco.setPointerCapture(e.pointerId); marco.classList.add('ft-moviendo'); });
  marco.addEventListener('pointermove', e => {
    if (!arrastre) return;
    const r = marco.getBoundingClientRect();
    ox = arrastre.ox + (e.clientX - arrastre.x) / r.width; oy = arrastre.oy + (e.clientY - arrastre.y) / r.height;
    vista();
  });
  const soltar = () => { arrastre = null; marco.classList.remove('ft-moviendo'); };
  marco.addEventListener('pointerup', soltar); marco.addEventListener('pointercancel', soltar);
  marco.addEventListener('wheel', e => { if (!img) return; e.preventDefault(); zoom.value = Math.max(100, Math.min(400, +zoom.value - Math.sign(e.deltaY) * 8)); vista(); }, { passive: false });
  marco.addEventListener('keydown', e => {
    const p = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0], ArrowUp: [0, -0.02], ArrowDown: [0, 0.02] }[e.key];
    if (!p || !img) return; e.preventDefault(); ox += p[0]; oy += p[1]; vista();
  });

  zoom.addEventListener('input', vista);
  [tam, anchoCm, altoCm, hoja].forEach(el => el.addEventListener('input', vista));
  tam.addEventListener('change', vista); hoja.addEventListener('change', vista);
  copias.addEventListener('input', () => { copias.dataset.tocado = '1'; });
  girar.addEventListener('click', () => { rot = (rot + 90) % 360; ox = oy = 0; vista(); });
  centrar.addEventListener('click', () => { ox = oy = 0; zoom.value = 100; vista(); });
  addEventListener('resize', vista);

  const nombreSalida = (ext, extra = '') => { const [w, h] = medidas(); return nombre + '-' + fmt(w).replace('.', '_') + 'x' + fmt(h).replace('.', '_') + 'cm' + extra + '.' + ext; };

  btnFoto.addEventListener('click', async () => { if (img) bajar((await fotoFinal()).blob, nombreSalida('jpg')); });

  btnPdf.addEventListener('click', async () => {
    if (!img) return;
    btnPdf.disabled = true;
    try {
      const a = acomodo(), { blob } = await fotoFinal(), { PDFDocument, rgb } = await pdfLib(), doc = await PDFDocument.create();
      const foto = await doc.embedJpg(new Uint8Array(await blob.arrayBuffer())), pag = doc.addPage([a.W * PT, a.H * PT]);
      for (const [x, y] of posiciones(a)) {
        const X = x * PT, Y = (a.H - y - a.h) * PT, w = a.w * PT, h = a.h * PT;
        pag.drawImage(foto, { x: X, y: Y, width: w, height: h });
        pag.drawRectangle({ x: X, y: Y, width: w, height: h, borderColor: rgb(0.78, 0.78, 0.8), borderWidth: 0.4 });
      }
      bajar(new Blob([await doc.save()], { type: 'application/pdf' }), nombreSalida('pdf', '-hoja-' + hoja.value));
    } catch { aviso('No pudimos armar la hoja. Vuelve a intentarlo.'); } finally { btnPdf.disabled = false; }
  });

  btnJpg.addEventListener('click', async () => {
    if (!img) return;
    btnJpg.disabled = true;
    try {
      const a = acomodo(), { canvas } = await fotoFinal(), c = document.createElement('canvas');
      c.width = Math.round(a.W * CM); c.height = Math.round(a.H * CM);
      const cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
      cx.strokeStyle = '#c8c8cc'; cx.lineWidth = 2;
      for (const [x, y] of posiciones(a)) { cx.drawImage(canvas, Math.round(x * CM), Math.round(y * CM), Math.round(a.w * CM), Math.round(a.h * CM)); cx.strokeRect(Math.round(x * CM), Math.round(y * CM), Math.round(a.w * CM), Math.round(a.h * CM)); }
      bajar(await aBlob(c, 'image/jpeg', 0.92), nombreSalida('jpg', '-hoja-' + hoja.value));
    } catch { aviso('No pudimos armar la hoja. Vuelve a intentarlo.'); } finally { btnJpg.disabled = false; }
  });
  raiz.classList.add('di-listo');
}
