// Vorka Learn · Herramientas · «Dividir una imagen»: el código que corre en el navegador.
// Lo sirve el Worker en /learn/herramientas/dividir-imagen.js (script-src 'self', sin nonce). Todo pasa en el dispositivo:
// la imagen se lee con createImageBitmap, se corta con <canvas> y el .zip se arma aquí mismo (método «store», sin
// compresión: las imágenes ya vienen comprimidas). Nada se sube a ningún servidor.
// Es texto plano a propósito: sin comillas invertidas ni ${…} dentro, para que viva en una plantilla de JS.
export const V_DIVIDIR = '1';   // súbelo si cambia este archivo (el navegador lo guarda un día)
export const CLIENTE_DIVIDIR = `(function () {
  'use strict';
  var $ = function (s) { return document.getElementById(s); };
  var raiz = $('di');
  if (!raiz) return;
  var entrada = $('di-archivo'), zona = $('di-zona'), panel = $('di-panel'), lienzo = $('di-lienzo'), rejilla = $('di-rejilla'),
    filas = $('di-filas'), cols = $('di-cols'), ancho = $('di-ancho'), alto = $('di-alto'), formato = $('di-formato'),
    calidad = $('di-calidad'), calidadV = $('di-calidad-v'), filaCalidad = $('di-fila-calidad'), btn = $('di-dividir'),
    res = $('di-res'), lista = $('di-lista'), zip = $('di-zip'), info = $('di-info'), aviso = $('di-aviso'), otra = $('di-otra'),
    nombreArchivo = $('di-nombre'), orden = $('di-orden'), gPartes = $('di-g-partes'), gPx = $('di-g-px');
  var MAX_PIEZAS = 400, MAX_PX = 50000000;
  var img = null, W = 0, H = 0, base = 'imagen', tipoOriginal = 'image/png', piezas = [];

  function modo() { var m = raiz.querySelector('input[name="di-modo"]:checked'); return m ? m.value : 'partes'; }
  function entero(el, min, max, def) { var n = parseInt(el.value, 10); if (isNaN(n)) n = def; return Math.max(min, Math.min(max, n)); }
  function mostrarAviso(t) { aviso.textContent = t || ''; aviso.hidden = !t; }

  // Dónde se corta: { xs: [0, …, W], ys: [0, …, H] }
  function cortes() {
    var xs = [], ys = [], i;
    if (modo() === 'px') {
      var a = entero(ancho, 1, W, W), h = entero(alto, 1, H, H);
      for (i = 0; i < W; i += a) xs.push(i); xs.push(W);
      for (i = 0; i < H; i += h) ys.push(i); ys.push(H);
    } else {
      var c = entero(cols, 1, 50, 3), f = entero(filas, 1, 50, 1);
      for (i = 0; i <= c; i++) xs.push(Math.round(i * W / c));
      for (i = 0; i <= f; i++) ys.push(Math.round(i * H / f));
    }
    return { xs: xs, ys: ys };
  }

  function actualizar() {
    if (!img) return;
    gPartes.hidden = modo() !== 'partes';
    gPx.hidden = modo() !== 'px';
    var k = cortes(), nc = k.xs.length - 1, nf = k.ys.length - 1, total = nc * nf, html = '', i;
    for (i = 1; i < nc; i++) html += '<i class="di-v" style="left:' + (k.xs[i] / W * 100) + '%"></i>';
    for (i = 1; i < nf; i++) html += '<i class="di-h" style="top:' + (k.ys[i] / H * 100) + '%"></i>';
    rejilla.innerHTML = html;
    var pw = k.xs[1] - k.xs[0], ph = k.ys[1] - k.ys[0], unos = modo() === 'partes' && (W % nc || H % nf);
    info.textContent = 'Tu imagen mide ' + W + ' × ' + H + ' px. Saldrán ' + total + (total === 1 ? ' parte' : ' partes') + ' (' + nf + (nf === 1 ? ' fila' : ' filas') + ' × ' + nc + (nc === 1 ? ' columna' : ' columnas') + ') de ' +
      (unos ? 'unos ' : '') + pw + ' × ' + ph + ' px' + (modo() === 'px' && (W % pw || H % ph) ? '; las de la orilla quedan más chicas' : '') + '.';
    var mucho = total > MAX_PIEZAS;
    btn.disabled = mucho || total < 2;
    mostrarAviso(mucho ? 'Son demasiadas partes (' + total + '). El máximo es ' + MAX_PIEZAS + ': usa partes más grandes o menos filas y columnas.' : total < 2 ? 'Elige al menos 2 partes.' : '');
    calidadV.textContent = calidad.value + ' %';
    var f = tipoSalida();
    filaCalidad.hidden = f === 'image/png';
  }

  function tipoSalida() {
    var v = formato.value;
    if (v === 'original') return /^image\\/(png|jpeg|webp)$/.test(tipoOriginal) ? tipoOriginal : 'image/png';
    return v;
  }
  function extension(t) { return t === 'image/jpeg' ? 'jpg' : t === 'image/webp' ? 'webp' : 'png'; }

  function leer(archivo) {
    if (window.createImageBitmap) return createImageBitmap(archivo).catch(function () { return leerConImg(archivo); });
    return leerConImg(archivo);
  }
  function leerConImg(archivo) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = mal; i.src = r.result; };
      r.onerror = mal;
      r.readAsDataURL(archivo);
    });
  }

  function cargar(archivo) {
    if (!archivo) return;
    if (!/^image\\//.test(archivo.type)) { mostrarAviso('Ese archivo no es una imagen. Usa JPG, PNG, WebP o GIF.'); return; }
    mostrarAviso('');
    zona.classList.add('di-cargando');
    leer(archivo).then(function (b) {
      zona.classList.remove('di-cargando');
      var w = b.naturalWidth || b.width, h = b.naturalHeight || b.height;
      if (!w || !h) { mostrarAviso('No pudimos leer esa imagen. Prueba con otra.'); return; }
      if (w * h > MAX_PX) { mostrarAviso('La imagen es demasiado grande (' + w + ' × ' + h + ' px). Redúcela a menos de 50 megapíxeles y vuelve a intentarlo.'); return; }
      img = b; W = w; H = h;
      tipoOriginal = archivo.type;
      base = (archivo.name || 'imagen').replace(/\\.[^.]+$/, '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^\\w\\-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'imagen';
      var escala = Math.min(1, 1600 / Math.max(w, h));
      lienzo.width = Math.max(1, Math.round(w * escala)); lienzo.height = Math.max(1, Math.round(h * escala));
      lienzo.getContext('2d').drawImage(b, 0, 0, lienzo.width, lienzo.height);
      nombreArchivo.textContent = (archivo.name || 'Imagen pegada') + ' · ' + w + ' × ' + h + ' px';
      if (!ancho.value || +ancho.value > w) ancho.value = Math.round(w / 3);
      if (!alto.value || +alto.value > h) alto.value = h;
      zona.hidden = true; panel.hidden = false;
      limpiarResultados();
      actualizar();
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function () {
      zona.classList.remove('di-cargando');
      mostrarAviso('No pudimos abrir esa imagen. Si es HEIC (fotos de iPhone), compártela como JPG o haz una captura y vuelve a intentarlo.');
    });
  }

  function limpiarResultados() {
    piezas.forEach(function (p) { if (p.url) URL.revokeObjectURL(p.url); });
    piezas = []; lista.innerHTML = ''; res.hidden = true;
  }

  function aBlob(c, t, q) {
    return new Promise(function (ok, mal) {
      if (c.toBlob) c.toBlob(function (b) { b ? ok(b) : mal(new Error('toBlob')); }, t, q);
      else { try { var d = atob(c.toDataURL(t, q).split(',')[1]), u = new Uint8Array(d.length); for (var i = 0; i < d.length; i++) u[i] = d.charCodeAt(i); ok(new Blob([u], { type: t })); } catch (e) { mal(e); } }
    });
  }

  function dividir() {
    if (!img) return;
    var k = cortes(), nc = k.xs.length - 1, nf = k.ys.length - 1, t = tipoSalida(), q = entero(calidad, 40, 100, 92) / 100, ext = extension(t);
    if (nc * nf > MAX_PIEZAS) return;
    limpiarResultados();
    btn.disabled = true; btn.setAttribute('aria-busy', 'true');
    var digitos = String(nc * nf).length, trabajos = [], n = 0;
    for (var r = 0; r < nf; r++) for (var c = 0; c < nc; c++) {
      n++;
      trabajos.push({ n: n, r: r + 1, c: c + 1, x: k.xs[c], y: k.ys[r], w: k.xs[c + 1] - k.xs[c], h: k.ys[r + 1] - k.ys[r] });
    }
    var i = 0;
    (function siguiente() {
      if (i >= trabajos.length) { terminar(nc, nf); return; }
      var p = trabajos[i++], cv = document.createElement('canvas'), cx = cv.getContext('2d');
      cv.width = p.w; cv.height = p.h;
      if (t === 'image/jpeg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, p.w, p.h); }
      cx.drawImage(img, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
      aBlob(cv, t, q).then(function (b) {
        p.blob = b; p.url = URL.createObjectURL(b);
        p.nombre = base + '-' + String(p.n).padStart(digitos, '0') + '.' + ext;
        piezas.push(p);
        var li = document.createElement('li');
        li.style.setProperty('--di-ar', p.w + ' / ' + p.h);
        var vista = document.createElement('canvas'), e = Math.min(1, 360 / Math.max(p.w, p.h));
        vista.width = Math.max(1, Math.round(p.w * e)); vista.height = Math.max(1, Math.round(p.h * e));
        vista.getContext('2d').drawImage(cv, 0, 0, vista.width, vista.height);
        vista.setAttribute('role', 'img'); vista.setAttribute('aria-label', 'Parte ' + p.n + ': fila ' + p.r + ', columna ' + p.c);
        var pie = document.createElement('div'); pie.className = 'di-pie';
        pie.innerHTML = '<span><b>' + p.n + '</b> · ' + p.w + ' × ' + p.h + '</span>';
        var a = document.createElement('a'); a.href = p.url; a.download = p.nombre; a.className = 'di-bajar'; a.textContent = 'Descargar';
        a.setAttribute('aria-label', 'Descargar la parte ' + p.n);
        pie.appendChild(a);
        li.appendChild(vista); li.appendChild(pie);
        lista.appendChild(li);
        siguiente();
      }).catch(function () {
        btn.disabled = false; btn.removeAttribute('aria-busy');
        mostrarAviso('Tu navegador se quedó sin memoria al cortar la imagen. Prueba con menos partes o con una imagen más chica.');
      });
    })();
  }

  function terminar(nc, nf) {
    btn.disabled = false; btn.removeAttribute('aria-busy');
    lista.style.setProperty('--di-cols', String(Math.min(nc, 6)));
    lista.style.setProperty('--di-cols-m', String(Math.min(nc, 4)));
    var total = piezas.length;
    orden.textContent = nf > 1 && nc === 3
      ? 'Para armar el mosaico en tu perfil de Instagram, publica primero la parte ' + total + ' y al final la 1: Instagram pone la más nueva arriba a la izquierda.'
      : nf === 1 && nc > 1 ? 'Para un carrusel, súbelas en orden: de la 1 a la ' + total + '.' : '';
    orden.hidden = !orden.textContent;
    res.hidden = false;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.gtag) try { window.gtag('event', 'dividir_imagen', { partes: total }); } catch (e) {}
  }

  // ---------- .zip (método «store») ----------
  var TABLA = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = TABLA[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function hacerZip(archivos) {
    var partes = [], central = [], offset = 0, enc = new TextEncoder(), d = new Date();
    var hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    archivos.forEach(function (a) {
      var n = enc.encode(a.nombre), crc = crc32(a.datos), L = a.datos.length;
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, hora, true); h.setUint16(12, fecha, true); h.setUint32(14, crc, true); h.setUint32(18, L, true); h.setUint32(22, L, true);
      h.setUint16(26, n.length, true); h.setUint16(28, 0, true);
      partes.push(h.buffer, n, a.datos);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, hora, true); c.setUint16(14, fecha, true); c.setUint32(16, crc, true); c.setUint32(20, L, true); c.setUint32(24, L, true);
      c.setUint16(28, n.length, true); c.setUint32(42, offset, true);
      central.push(c.buffer, n);
      offset += 30 + n.length + L;
    });
    var tam = central.reduce(function (s, x) { return s + x.byteLength; }, 0);
    var f = new DataView(new ArrayBuffer(22));
    f.setUint32(0, 0x06054b50, true); f.setUint16(8, archivos.length, true); f.setUint16(10, archivos.length, true);
    f.setUint32(12, tam, true); f.setUint32(16, offset, true);
    return new Blob(partes.concat(central, [f.buffer]), { type: 'application/zip' });
  }
  function bajar(blob, nombre) {
    var u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 10000);
  }
  zip.addEventListener('click', function () {
    if (!piezas.length) return;
    zip.disabled = true; zip.setAttribute('aria-busy', 'true');
    Promise.all(piezas.map(function (p) { return p.blob.arrayBuffer().then(function (b) { return { nombre: p.nombre, datos: new Uint8Array(b) }; }); }))
      .then(function (l) { bajar(hacerZip(l), base + '-partes.zip'); })
      .catch(function () { mostrarAviso('No se pudo armar el .zip. Descarga las partes una por una.'); })
      .then(function () { zip.disabled = false; zip.removeAttribute('aria-busy'); });
  });

  // ---------- eventos ----------
  entrada.addEventListener('change', function () { cargar(entrada.files && entrada.files[0]); entrada.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('di-encima'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('di-encima'); }); });
  zona.addEventListener('drop', function (e) { cargar(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
  document.addEventListener('paste', function (e) {
    var fs = e.clipboardData && e.clipboardData.files;
    if (fs && fs.length && /^image\\//.test(fs[0].type)) { e.preventDefault(); cargar(fs[0]); }
  });
  raiz.addEventListener('input', function (e) { if (e.target !== entrada) { limpiarResultados(); actualizar(); } });
  raiz.addEventListener('change', function (e) { if (e.target !== entrada) { limpiarResultados(); actualizar(); } });
  Array.prototype.forEach.call(raiz.querySelectorAll('[data-f]'), function (b) {
    b.addEventListener('click', function () {
      raiz.querySelector('input[name="di-modo"][value="partes"]').checked = true;
      filas.value = b.getAttribute('data-f'); cols.value = b.getAttribute('data-c');
      limpiarResultados(); actualizar();
    });
  });
  btn.addEventListener('click', dividir);
  otra.addEventListener('click', function () { limpiarResultados(); img = null; panel.hidden = true; zona.hidden = false; mostrarAviso(''); entrada.click(); });
  raiz.classList.add('di-listo');
})();`;
