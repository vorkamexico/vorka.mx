// Vorka Learn · «Dividir y unir PDF», parte de UNIR: junta varios PDF y fotos en un solo PDF, en el orden que elijas.
// También maneja las pestañas Dividir / Unir de la página (#unir en la dirección abre la de unir).
// Todo en el navegador: pdf-lib copia las páginas de los PDF tal cual y las fotos van cada una en una hoja carta.
import { $, pesoTexto, nombreBase, bajar, zonaArchivos, avisador, abrirPdfjs, pdfLib, dibujarPagina, aBlob, espera } from './comun.js';

// ---------- pestañas ----------
const tabs = [...document.querySelectorAll('[data-pestana]')];
function mostrar(cual, enfocar) {
  for (const t of tabs) {
    const si = t.dataset.pestana === cual;
    t.setAttribute('aria-selected', String(si));
    t.tabIndex = si ? 0 : -1;
    const panel = $(t.getAttribute('aria-controls'));
    if (panel) panel.hidden = !si;
    if (si && enfocar) t.focus();
  }
  try { history.replaceState(null, '', cual === 'unir' ? '#unir' : location.pathname + location.search); } catch { /* sin historial */ }
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => mostrar(t.dataset.pestana));
  t.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const otro = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    mostrar(otro.dataset.pestana, true);
  });
});
if (tabs.length && location.hash === '#unir') mostrar('unir');
for (const a of document.querySelectorAll('a[href="#unir"]')) a.addEventListener('click', e => { e.preventDefault(); mostrar('unir'); $('pdf-pestanas')?.scrollIntoView({ behavior: 'smooth' }); });

// ---------- unir ----------
const raiz = $('up');
if (raiz) {
  const zona = $('up-zona'), entrada = $('up-archivo'), mas = $('up-mas'), panel = $('up-panel'), lista = $('up-lista'), resumen = $('up-resumen'),
    btn = $('up-unir'), progreso = $('up-progreso'), res = $('up-res'), info = $('up-info'), btnBajar = $('up-bajar'), nombre = $('up-nombre'),
    aviso = avisador($('up-aviso'));
  const MAX = 60;
  let items = [], salida = null, cuenta = 0;

  const esPdf = f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
  const esImg = f => /^image\/(jpeg|png|webp|gif|bmp)$/.test(f.type);
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

  function pintar() {
    lista.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.className = 'up-item';
      const mini = document.createElement('span'); mini.className = 'up-mini'; if (it.mini) mini.appendChild(it.mini);
      const txt = document.createElement('span'); txt.className = 'up-txt';
      const b = document.createElement('b'); b.textContent = it.archivo.name || (it.pdf ? 'Documento.pdf' : 'Foto');
      const s = document.createElement('small'); s.textContent = (it.pdf ? (it.paginas ? plural(it.paginas, 'página', 'páginas') : 'PDF') : 'Foto · 1 hoja') + ' · ' + pesoTexto(it.archivo.size);
      txt.append(b, s);
      const acc = document.createElement('span'); acc.className = 'up-acc';
      const boton = (t, etq, fn, off) => { const x = document.createElement('button'); x.type = 'button'; x.textContent = t; x.setAttribute('aria-label', etq); x.disabled = !!off; x.addEventListener('click', fn); acc.appendChild(x); };
      boton('↑', 'Subir ' + b.textContent, () => mover(i, -1), i === 0);
      boton('↓', 'Bajar ' + b.textContent, () => mover(i, 1), i === items.length - 1);
      boton('✕', 'Quitar ' + b.textContent, () => { items.splice(i, 1); limpiar(); pintar(); });
      const n = document.createElement('span'); n.className = 'up-n'; n.textContent = i + 1;
      li.append(n, mini, txt, acc);
      lista.appendChild(li);
    });
    const hojas = items.reduce((s, it) => s + (it.pdf ? it.paginas || 0 : 1), 0);
    resumen.textContent = items.length < 2 ? (items.length ? 'Agrega al menos otro archivo para unirlos.' : '') : 'Saldrá 1 PDF con ' + plural(hojas, 'página', 'páginas') + '. Cambia el orden con las flechas.';
    btn.disabled = items.length < 2 || items.some(it => it.error);
    panel.hidden = !items.length; zona.hidden = !!items.length;
  }
  function mover(i, d) { const j = i + d; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; limpiar(); pintar(); }
  function limpiar() { salida = null; res.hidden = true; }

  async function agregar(archivos) {
    limpiar();
    const nuevos = archivos.slice(0, Math.max(0, MAX - items.length));
    if (archivos.length > nuevos.length) aviso('Puedes unir hasta ' + MAX + ' archivos a la vez.');
    const mio = ++cuenta;
    for (const f of nuevos) items.push({ archivo: f, pdf: esPdf(f), id: mio + '-' + items.length });
    pintar();
    if (!nombre.value) nombre.value = nombreBase(items[0]?.archivo.name, 'documento') + '-unido';
    // miniaturas y número de páginas, de uno en uno
    for (const it of items.filter(x => !x.mini && !x.error)) {
      try {
        if (it.pdf) {
          const doc = await abrirPdfjs(new Uint8Array(await it.archivo.arrayBuffer()));
          it.paginas = doc.numPages;
          const pag = await doc.getPage(1), e = 80 / pag.getViewport({ scale: 1 }).width;
          it.mini = (await dibujarPagina(doc, 1, e)).canvas;
          doc.destroy();
        } else {
          const bmp = await createImageBitmap(it.archivo), c = document.createElement('canvas'), e = 80 / Math.max(bmp.width, bmp.height);
          c.width = Math.max(1, Math.round(bmp.width * e)); c.height = Math.max(1, Math.round(bmp.height * e));
          c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); it.mini = c;
        }
      } catch (e) {
        it.error = true;
        aviso(/password/i.test(String(e?.name) + String(e?.message)) ? '«' + it.archivo.name + '» tiene contraseña: ábrelo, guárdalo sin contraseña y vuelve a agregarlo.' : 'No pudimos abrir «' + it.archivo.name + '». Quítalo de la lista o prueba con otro.');
      }
      pintar();
      await espera();
    }
  }

  zonaArchivos({ zona, entrada, aviso, alCargar: agregar, acepta: f => esPdf(f) || esImg(f) });
  mas.addEventListener('change', () => { const l = [...mas.files].filter(f => esPdf(f) || esImg(f)); mas.value = ''; if (l.length) agregar(l); });
  nombre.addEventListener('input', limpiar);

  // Foto → página carta (vertical u horizontal según la foto), centrada con margen
  async function paginaFoto(nuevo, f) {
    const CARTA = [612, 792], M = 28;
    let bytes, tipo = f.type;
    if (tipo === 'image/jpeg' || tipo === 'image/png') bytes = new Uint8Array(await f.arrayBuffer());
    else {
      const bmp = await createImageBitmap(f), c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
      const cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(bmp, 0, 0);
      bytes = new Uint8Array(await (await aBlob(c, 'image/jpeg', 0.9)).arrayBuffer()); tipo = 'image/jpeg';
    }
    const img = tipo === 'image/png' ? await nuevo.embedPng(bytes) : await nuevo.embedJpg(bytes);
    const horizontal = img.width > img.height, [W, H] = horizontal ? [CARTA[1], CARTA[0]] : CARTA;
    const e = Math.min((W - 2 * M) / img.width, (H - 2 * M) / img.height), w = img.width * e, h = img.height * e;
    nuevo.addPage([W, H]).drawImage(img, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h });
  }

  btn.addEventListener('click', async () => {
    if (items.length < 2) return;
    limpiar(); aviso('');
    btn.disabled = true; btn.setAttribute('aria-busy', 'true');
    try {
      const { PDFDocument } = await pdfLib(), nuevo = await PDFDocument.create();
      for (let i = 0; i < items.length; i++) {
        progreso.textContent = 'Agregando ' + (i + 1) + ' de ' + items.length + '…';
        const it = items[i];
        if (it.pdf) {
          const src = await PDFDocument.load(new Uint8Array(await it.archivo.arrayBuffer()), { ignoreEncryption: true });
          (await nuevo.copyPages(src, src.getPageIndices())).forEach(p => nuevo.addPage(p));
        } else await paginaFoto(nuevo, it.archivo);
        await espera();
      }
      const bytes = await nuevo.save();
      salida = new Blob([bytes], { type: 'application/pdf' });
      info.textContent = plural(nuevo.getPageCount(), 'página', 'páginas') + ' · ' + pesoTexto(salida.size);
      progreso.textContent = '';
      res.hidden = false;
      res.scrollIntoView({ behavior: 'smooth', block: 'start' });
      bajar(salida, nombreArchivo());
    } catch (e) {
      progreso.textContent = '';
      aviso(/encrypt|password/i.test(String(e?.message)) ? 'Uno de los PDF tiene contraseña. Ábrelo, guárdalo sin contraseña y vuelve a intentarlo.' : 'No pudimos unir los archivos. Quita el que esté dañado y vuelve a intentarlo.');
    } finally { btn.removeAttribute('aria-busy'); pintar(); }
  });
  const nombreArchivo = () => nombreBase(nombre.value, 'documento-unido') + '.pdf';
  btnBajar.addEventListener('click', () => { if (salida) bajar(salida, nombreArchivo()); });
  raiz.classList.add('di-listo');
}
