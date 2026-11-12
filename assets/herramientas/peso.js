// Vorka Learn · «Reducir el peso de una foto o PDF». Todo en el navegador.
// Foto: se vuelve a guardar en JPG bajando la calidad (y, si hace falta, el tamaño) hasta que pese menos de la meta.
// PDF: cada página se dibuja con pdf.js como imagen JPG y se arma un PDF nuevo con pdf-lib (el texto deja de poder
// seleccionarse; lo decimos en la página). Se prueban resoluciones de mayor a menor hasta llegar a la meta.
import { $, pesoTexto, nombreBase, bajar, zonaArchivos, avisador, abrirPdfjs, pdfLib, dibujarPagina, aBlob, espera, avisoPdfProtegido } from './comun.js';

const raiz = $('pe');
if (raiz) {
  const zona = $('pe-zona'), entrada = $('pe-archivo'), panel = $('pe-panel'), info = $('pe-info'), meta = $('pe-meta'),
    filaMax = $('pe-fila-max'), maxLado = $('pe-max'), btn = $('pe-reducir'), progreso = $('pe-progreso'), otra = $('pe-otra'),
    res = $('pe-res'), antes = $('pe-antes'), despues = $('pe-despues'), ahorro = $('pe-ahorro'), vista = $('pe-vista'),
    btnBajar = $('pe-bajar'), nota = $('pe-nota'), aviso = avisador($('pe-aviso'));
  let archivo = null, salida = null, nombreSalida = '';

  const esPdf = f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
  const esImagen = f => /^image\/(jpeg|png|webp|gif|bmp)$/.test(f.type);

  function limpiar() { salida = null; res.hidden = true; vista.innerHTML = ''; progreso.textContent = ''; }
  function cargar([f]) {
    archivo = f; limpiar();
    info.innerHTML = '<b>' + escapar(f.name || 'Archivo') + '</b><span>' + (esPdf(f) ? 'PDF' : 'Imagen') + ' · ' + pesoTexto(f.size) + '</span>';
    filaMax.hidden = esPdf(f);
    zona.hidden = true; panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const escapar = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  zonaArchivos({ zona, entrada, aviso, alCargar: cargar,
    acepta: f => esPdf(f) || esImagen(f) });
  otra.addEventListener('click', () => { archivo = null; limpiar(); panel.hidden = true; zona.hidden = false; aviso(''); entrada.click(); });
  meta.addEventListener('change', limpiar); maxLado.addEventListener('change', limpiar);

  // ---------- foto ----------
  async function reducirImagen(f, limite, lado) {
    const bmp = await createImageBitmap(f);
    let escala = Math.min(1, lado / Math.max(bmp.width, bmp.height));
    const dibujar = e => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * e)); c.height = Math.max(1, Math.round(bmp.height * e));
      const cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(bmp, 0, 0, c.width, c.height); return c; };
    if (!limite) { const c = dibujar(escala); return { blob: await aBlob(c, 'image/jpeg', 0.78), ancho: c.width, alto: c.height }; }
    let mejor = null;
    for (let vuelta = 0; vuelta < 12; vuelta++) {
      const c = dibujar(escala);
      let bajo = 0.35, alto = 0.9, bien = null;
      const minimo = await aBlob(c, 'image/jpeg', bajo);
      if (minimo.size <= limite) {
        bien = minimo;
        for (let i = 0; i < 6; i++) { const q = (bajo + alto) / 2, b = await aBlob(c, 'image/jpeg', q); if (b.size <= limite) { bien = b; bajo = q; } else alto = q; }
        return { blob: bien, ancho: c.width, alto: c.height };
      }
      if (!mejor || minimo.size < mejor.blob.size) mejor = { blob: minimo, ancho: c.width, alto: c.height };
      if (Math.min(c.width, c.height) < 160) break;
      escala *= Math.max(0.5, Math.min(0.85, Math.sqrt(limite / minimo.size) * 0.95));
      progreso.textContent = 'Ajustando el tamaño de la foto…';
    }
    return { ...mejor, noLlego: true };
  }

  // ---------- PDF ----------
  const PASOS = [{ dpi: 150, q: 0.72 }, { dpi: 120, q: 0.62 }, { dpi: 100, q: 0.55 }, { dpi: 85, q: 0.5 }, { dpi: 72, q: 0.42 }, { dpi: 60, q: 0.36 }];
  async function armarPdf(doc, paso, vuelta) {
    const { PDFDocument } = await pdfLib(), nuevo = await PDFDocument.create(), n = doc.numPages;
    for (let i = 1; i <= n; i++) {
      progreso.textContent = 'Página ' + i + ' de ' + n + (vuelta ? ' · intento ' + (vuelta + 1) : '') + '…';
      const { canvas, ancho, alto } = await dibujarPagina(doc, i, paso.dpi / 72);
      const jpg = await aBlob(canvas, 'image/jpeg', paso.q);
      canvas.width = canvas.height = 0;
      const img = await nuevo.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
      nuevo.addPage([ancho, alto]).drawImage(img, { x: 0, y: 0, width: ancho, height: alto });
      await espera();
    }
    return new Blob([await nuevo.save()], { type: 'application/pdf' });
  }
  async function reducirPdf(f, limite) {
    let doc;
    try { doc = await abrirPdfjs(new Uint8Array(await f.arrayBuffer())); } catch (e) { throw new Error(avisoPdfProtegido(e)); }
    if (doc.numPages > 300) throw new Error('El PDF tiene ' + doc.numPages + ' páginas. Aquí funcionan PDF de hasta 300 páginas; divídelo primero.');
    let mejor = null;
    const pasos = limite ? PASOS : [PASOS[0]];
    for (let v = 0; v < pasos.length; v++) {
      const b = await armarPdf(doc, pasos[v], v);
      if (!mejor || b.size < mejor.size) mejor = b;
      if (!limite || b.size <= limite) break;
    }
    doc.destroy();
    return { blob: mejor, noLlego: limite && mejor.size > limite };
  }

  btn.addEventListener('click', async () => {
    if (!archivo) return;
    limpiar(); aviso('');
    btn.disabled = true; btn.setAttribute('aria-busy', 'true'); progreso.textContent = esPdf(archivo) ? 'Abriendo el PDF…' : 'Reduciendo la foto…';
    const limite = +meta.value || 0, pdf = esPdf(archivo);
    try {
      const r = pdf ? await reducirPdf(archivo, limite) : await reducirImagen(archivo, limite, +maxLado.value || 100000);
      let blob = r.blob, mensaje = '';
      if (blob.size >= archivo.size) {
        blob = archivo;
        mensaje = limite && archivo.size <= limite
          ? 'Tu archivo ya pesaba menos de ' + pesoTexto(limite) + ': te dejamos el original.'
          : 'No logramos que pesara menos sin que se viera mal: te dejamos el original.';
      } else if (r.noLlego) mensaje = 'Lo más que pudimos bajarlo sin que se vuelva ilegible fue a ' + pesoTexto(blob.size) + '. Para llegar a ' + pesoTexto(limite) + (pdf ? ', divide el PDF en partes.' : ', recorta la foto o usa una más chica.');
      else if (pdf) mensaje = 'Las páginas ahora son imágenes: el texto ya no se puede seleccionar ni buscar. Revisa que se lea bien antes de enviarlo.';
      salida = blob;
      nombreSalida = nombreBase(archivo.name) + (blob === archivo ? '' : '-reducido') + (pdf ? '.pdf' : blob === archivo ? (archivo.name.match(/\.[^.]+$/) || ['.jpg'])[0] : '.jpg');
      antes.textContent = pesoTexto(archivo.size);
      despues.textContent = pesoTexto(blob.size);
      const pct = Math.round((1 - blob.size / archivo.size) * 100);
      ahorro.textContent = pct > 0 ? pct + ' % menos' : 'Sin cambio';
      nota.textContent = mensaje; nota.hidden = !mensaje;
      if (!pdf && blob !== archivo) {
        const b = await createImageBitmap(blob), c = document.createElement('canvas'), e = Math.min(1, 520 / Math.max(b.width, b.height));
        c.width = Math.round(b.width * e); c.height = Math.round(b.height * e); c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
        c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Vista previa de la foto reducida (' + r.ancho + ' × ' + r.alto + ' px)');
        vista.appendChild(c);
        const p = document.createElement('p'); p.textContent = r.ancho + ' × ' + r.alto + ' px'; vista.appendChild(p);
      }
      progreso.textContent = '';
      res.hidden = false;
      res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      progreso.textContent = '';
      aviso(e?.message && !/toBlob|undefined/.test(e.message) ? e.message : 'No pudimos reducir ese archivo. Prueba con otro o con una meta más grande.');
    } finally { btn.disabled = false; btn.removeAttribute('aria-busy'); }
  });
  btnBajar.addEventListener('click', () => { if (salida) bajar(salida, nombreSalida); });
  raiz.classList.add('di-listo');
}
