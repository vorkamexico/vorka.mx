// Vorka Learn · «Dividir un PDF por páginas». Todo en el navegador: pdf.js dibuja las miniaturas y pdf-lib copia las
// páginas tal cual (sin volver a comprimir: el texto se sigue pudiendo seleccionar).
import './unir-pdf.js';   // la pestaña «Unir» vive en la misma página
import { $, pesoTexto, nombreBase, bajar, zonaArchivos, avisador, abrirPdfjs, pdfLib, dibujarPagina, espera, hacerZip, avisoPdfProtegido } from './comun.js';

const raiz = $('dp');
if (raiz) {
  const zona = $('dp-zona'), entrada = $('dp-archivo'), panel = $('dp-panel'), info = $('dp-info'), paginas = $('dp-paginas'),
    rangos = $('dp-rangos'), cadaN = $('dp-n'), seleccion = $('dp-sel'), btn = $('dp-dividir'), progreso = $('dp-progreso'),
    otra = $('dp-otra'), res = $('dp-res'), lista = $('dp-lista'), zip = $('dp-zip'), resumen = $('dp-resumen'), aviso = avisador($('dp-aviso')),
    gRangos = $('dp-g-rangos'), gN = $('dp-g-n'), gSel = $('dp-g-sel');
  let archivo = null, datos = null, total = 0, elegidas = new Set(), salidas = [], turno = 0, docVista = null;

  const modo = () => raiz.querySelector('input[name="dp-modo"]:checked')?.value || 'cada';
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

  // «1-3, 5, 8-10» → [[1,3],[5,5],[8,10]] (o un texto de error)
  function leerRangos(t) {
    const l = [];
    for (const parte of String(t).split(/[,;]+/).map(x => x.trim()).filter(Boolean)) {
      const m = parte.match(/^(\d+)\s*(?:-|–|a)\s*(\d+)$/) || parte.match(/^(\d+)$/);
      if (!m) return 'No entendemos «' + parte + '». Escribe páginas así: 1-3, 5, 8-10.';
      const a = +m[1], b = +(m[2] || m[1]);
      if (a < 1 || b < 1 || a > total || b > total) return 'El PDF tiene ' + plural(total, 'página', 'páginas') + ': «' + parte + '» se sale.';
      l.push(a <= b ? [a, b] : [b, a]);
    }
    return l.length ? l : 'Escribe qué páginas quieres, por ejemplo: 1-3, 5, 8-10.';
  }
  const textoDe = set => {
    const l = [...set].sort((a, b) => a - b), out = [];
    for (let i = 0; i < l.length; i++) { let j = i; while (j + 1 < l.length && l[j + 1] === l[j] + 1) j++; out.push(l[i] === l[j] ? String(l[i]) : l[i] + '-' + l[j]); i = j; }
    return out.join(', ');
  };

  // Qué PDFs salen: [{ nombre, paginas: [1,2,3] }] o un texto de error
  function plan() {
    const base = nombreBase(archivo.name, 'documento'), m = modo(), dig = String(total).length, pad = n => String(n).padStart(dig, '0');
    const rango = ([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    if (m === 'cada') return Array.from({ length: total }, (_, i) => ({ nombre: base + '-pagina-' + pad(i + 1) + '.pdf', paginas: [i + 1] }));
    if (m === 'n') {
      const n = Math.max(1, Math.min(total, parseInt(cadaN.value, 10) || 1)), out = [];
      for (let a = 1; a <= total; a += n) { const b = Math.min(total, a + n - 1); out.push({ nombre: base + '-paginas-' + a + (a === b ? '' : '-' + b) + '.pdf', paginas: rango([a, b]) }); }
      return out;
    }
    if (m === 'rangos') {
      const r = leerRangos(rangos.value);
      return typeof r === 'string' ? r : r.map(([a, b]) => ({ nombre: base + '-paginas-' + a + (a === b ? '' : '-' + b) + '.pdf', paginas: rango([a, b]) }));
    }
    if (!elegidas.size) return 'Toca las páginas que quieres sacar o escríbelas, por ejemplo: 1, 3, 5-7.';
    return [{ nombre: base + '-paginas-' + textoDe(elegidas).replace(/,\s*/g, '_') + '.pdf', paginas: [...elegidas].sort((a, b) => a - b) }];
  }

  function actualizar() {
    const m = modo();
    gRangos.hidden = m !== 'rangos'; gN.hidden = m !== 'n'; gSel.hidden = m !== 'extraer';
    paginas.classList.toggle('dp-elegir', m === 'extraer');
    const p = archivo ? plan() : [];
    if (typeof p === 'string') { resumen.textContent = p; btn.disabled = true; }
    else { resumen.textContent = p.length === 1 ? 'Saldrá 1 PDF con ' + plural(p[0].paginas.length, 'página', 'páginas') + '.' : 'Saldrán ' + p.length + ' PDF.'; btn.disabled = !p.length; }
    for (const b of paginas.querySelectorAll('button')) b.setAttribute('aria-pressed', String(m === 'extraer' && elegidas.has(+b.dataset.n)));
  }
  function limpiarResultados() { salidas = []; lista.innerHTML = ''; res.hidden = true; }

  async function cargar([f]) {
    const mio = ++turno;
    archivo = f; elegidas = new Set(); limpiarResultados(); paginas.innerHTML = '';
    if (docVista) { docVista.destroy(); docVista = null; }
    progreso.textContent = 'Abriendo el PDF…';
    try {
      datos = new Uint8Array(await f.arrayBuffer());
      docVista = await abrirPdfjs(datos);
    } catch (e) { progreso.textContent = ''; aviso(avisoPdfProtegido(e)); archivo = null; return; }
    if (mio !== turno) return;
    total = docVista.numPages;
    info.innerHTML = '';
    const b = document.createElement('b'); b.textContent = f.name || 'Documento.pdf';
    const s = document.createElement('span'); s.textContent = plural(total, 'página', 'páginas') + ' · ' + pesoTexto(f.size);
    info.append(b, s);
    cadaN.max = total; if (+cadaN.value > total) cadaN.value = total;
    zona.hidden = true; panel.hidden = false; progreso.textContent = '';
    for (let i = 1; i <= total; i++) {
      const bt = document.createElement('button'); bt.type = 'button'; bt.dataset.n = i; bt.className = 'dp-pag';
      bt.setAttribute('aria-label', 'Página ' + i); bt.innerHTML = '<span class="dp-hoja"></span><small>' + i + '</small>';
      paginas.appendChild(bt);
    }
    actualizar();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // miniaturas, de una en una (las primeras 120)
    for (let i = 1; i <= Math.min(total, 120); i++) {
      if (mio !== turno) return;
      try {
        const pag = await docVista.getPage(i), e = 150 / pag.getViewport({ scale: 1 }).width;
        const { canvas } = await dibujarPagina(docVista, i, e);
        const hoja = paginas.querySelector('[data-n="' + i + '"] .dp-hoja');
        if (hoja) { hoja.replaceChildren(canvas); }
      } catch { /* sin miniatura */ }
      await espera();
    }
  }

  zonaArchivos({ zona, entrada, aviso, alCargar: cargar, acepta: f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '') });
  otra.addEventListener('click', () => { turno++; archivo = null; limpiarResultados(); panel.hidden = true; zona.hidden = false; aviso(''); entrada.click(); });
  raiz.addEventListener('change', e => { if (e.target !== entrada) { limpiarResultados(); actualizar(); } });
  rangos.addEventListener('input', () => { limpiarResultados(); actualizar(); });
  cadaN.addEventListener('input', () => { limpiarResultados(); actualizar(); });
  seleccion.addEventListener('input', () => {
    const r = leerRangos(seleccion.value);
    elegidas = new Set(typeof r === 'string' ? [] : r.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i)));
    limpiarResultados(); actualizar();
  });
  paginas.addEventListener('click', e => {
    const b = e.target.closest('button[data-n]');
    if (!b) return;
    const n = +b.dataset.n;
    if (modo() !== 'extraer') { raiz.querySelector('input[name="dp-modo"][value="extraer"]').checked = true; }
    elegidas.has(n) ? elegidas.delete(n) : elegidas.add(n);
    seleccion.value = textoDe(elegidas);
    limpiarResultados(); actualizar();
  });

  btn.addEventListener('click', async () => {
    const p = plan();
    if (typeof p === 'string' || !p.length) return;
    limpiarResultados(); aviso('');
    btn.disabled = true; btn.setAttribute('aria-busy', 'true');
    try {
      const { PDFDocument } = await pdfLib(), src = await PDFDocument.load(datos, { ignoreEncryption: true });
      for (let i = 0; i < p.length; i++) {
        progreso.textContent = 'Armando ' + (i + 1) + ' de ' + p.length + '…';
        const d = await PDFDocument.create();
        (await d.copyPages(src, p[i].paginas.map(n => n - 1))).forEach(pg => d.addPage(pg));
        const bytes = await d.save();
        salidas.push({ nombre: p[i].nombre, datos: bytes, paginas: p[i].paginas.length });
        const li = document.createElement('li'), t = document.createElement('span'), a = document.createElement('button');
        t.innerHTML = '<b></b><small></small>'; t.querySelector('b').textContent = p[i].nombre;
        t.querySelector('small').textContent = plural(p[i].paginas.length, 'página', 'páginas') + ' · ' + pesoTexto(bytes.length);
        a.type = 'button'; a.className = 'di-bajar'; a.textContent = 'Descargar'; a.setAttribute('aria-label', 'Descargar ' + p[i].nombre);
        a.addEventListener('click', () => bajar(new Blob([bytes], { type: 'application/pdf' }), p[i].nombre));
        li.append(t, a); lista.appendChild(li);
        await espera();
      }
      zip.hidden = salidas.length < 2;
      progreso.textContent = '';
      res.hidden = false;
      res.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (salidas.length === 1) bajar(new Blob([salidas[0].datos], { type: 'application/pdf' }), salidas[0].nombre);
    } catch (e) {
      progreso.textContent = '';
      aviso(/encrypt|password/i.test(String(e?.message)) ? 'Este PDF tiene contraseña. Ábrelo, guárdalo sin contraseña y vuelve a intentarlo.' : 'No pudimos dividir ese PDF. Puede estar dañado; prueba con otro.');
    } finally { btn.disabled = false; btn.removeAttribute('aria-busy'); actualizar(); }
  });
  zip.addEventListener('click', () => { if (salidas.length) bajar(hacerZip(salidas), nombreBase(archivo?.name, 'documento') + '-dividido.zip'); });
  raiz.classList.add('di-listo');
}
