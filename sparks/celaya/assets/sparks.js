/* SPARKS CELAYA — búsqueda, filtros, "cargar más", galería y compartir. Sin dependencias. */
(function () {
  var BASE = (document.querySelector('link[rel="stylesheet"][href*="/assets/sparks.css"]').getAttribute('href') || '').split('/assets/')[0];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var IMG = BASE + '/img';
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var hoy = document.querySelector('[data-hoy]');
  if (hoy) {
    var d = new Date();
    hoy.textContent = DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }

  /* ---------------- portada: buscar / filtrar / cargar más ---------------- */
  var grid = document.getElementById('grid');
  if (grid && document.getElementById('q')) portada();

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function tarjeta(n) {
    var img = n.i
      ? '<img src="' + IMG + '/' + n.i + '-800.webp" srcset="' + IMG + '/' + n.i + '-800.webp 800w, ' + IMG + '/' + n.i + '-1600.webp 1600w" sizes="(min-width:1024px) 400px, (min-width:640px) 50vw, 120px" width="' + n.w + '" height="' + n.h + '" alt="' + esc(n.p || n.t) + '" loading="lazy" decoding="async">'
      : '<span class="noimg tone-' + n.o + '" aria-hidden="true"><b>' + esc(n.c) + '</b></span>';
    var meta = (n.p ? '<span class="who">' + esc(n.p) + '</span><span class="dot" aria-hidden="true">·</span>' : '') + '<time datetime="' + n.d + '">' + esc(n.f) + '</time>';
    return '<article class="card"><a class="card-link" href="' + BASE + '/' + n.s + '/"><div class="card-img">' + img + '</div>' +
      '<div class="card-body"><span class="kicker tone-' + n.o + '">' + esc(n.c) + '</span><h3 class="card-title">' + esc(n.t) + '</h3>' +
      '<p class="card-sum">' + esc(n.r) + '</p><div class="meta">' + meta + '</div></div></a></article>';
  }

  function portada() {
    var q = document.getElementById('q');
    var mas = document.getElementById('mas');
    var vacio = document.getElementById('vacio');
    var front = document.getElementById('front');
    var titulo = document.getElementById('grid-title');
    var chips = [].slice.call(document.querySelectorAll('.chip'));
    var porPagina = +grid.getAttribute('data-por-pagina') || 12;
    var inicialesHTML = grid.innerHTML;
    var todas = null, cargando = null;
    var estado = { q: '', cat: '', visibles: porPagina, filtrando: false };

    function datos() {
      if (todas) return Promise.resolve(todas);
      if (!cargando) {
        var v = (document.querySelector('script[src*="sparks.js"]').getAttribute('src').split('?v=')[1]) || '';
        cargando = fetch(BASE + '/noticias.json?v=' + v).then(function (r) { return r.json(); }).then(function (data) {
          var j = data.n;
          IMG = data.img;
          j.forEach(function (n) { n._q = norm([n.t, n.p, n.c, n.r, n.g].join(' ')); });
          return (todas = j);
        });
      }
      return cargando;
    }

    function pintar() {
      var activo = !!(estado.q || estado.cat);
      if (!activo && !estado.filtrando) return;
      datos().then(function (lista) {
        var palabras = norm(estado.q).split(/\s+/).filter(Boolean);
        var res;
        if (activo) {
          res = lista.filter(function (n) {
            return (!estado.cat || n.k === estado.cat) && palabras.every(function (p) { return n._q.indexOf(p) !== -1; });
          });
        } else {
          res = lista.filter(function (n) { return !n.x; }); // sin filtro: lo que no está ya en la portada
        }
        if (front) front.hidden = activo;
        titulo.textContent = activo ? (res.length + (res.length === 1 ? ' noticia' : ' noticias')) : 'Lo más reciente';
        grid.innerHTML = res.slice(0, estado.visibles).map(tarjeta).join('');
        vacio.hidden = res.length > 0;
        mas.hidden = res.length <= estado.visibles;
      });
    }

    function actualizarURL() {
      var u = new URL(location.href);
      estado.q ? u.searchParams.set('q', estado.q) : u.searchParams.delete('q');
      estado.cat ? u.searchParams.set('categoria', estado.cat) : u.searchParams.delete('categoria');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }

    function marcarChip() {
      chips.forEach(function (c) { c.classList.toggle('is-on', c.getAttribute('data-cat') === estado.cat); });
    }

    var t;
    q.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        estado.q = q.value.trim(); estado.visibles = porPagina; estado.filtrando = true;
        actualizarURL(); pintar();
        if (!estado.q && !estado.cat) restaurar();
      }, 160);
    });
    q.addEventListener('focus', datos, { once: true });

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        estado.cat = c.getAttribute('data-cat'); estado.visibles = porPagina; estado.filtrando = true;
        marcarChip(); actualizarURL();
        if (!estado.q && !estado.cat) restaurar(); else pintar();
      });
    });

    mas.addEventListener('click', function () {
      estado.visibles += porPagina; estado.filtrando = true; pintar();
    });

    function restaurar() {
      estado.filtrando = estado.visibles > porPagina;
      if (estado.filtrando) return pintar();
      if (front) front.hidden = false;
      titulo.textContent = 'Lo más reciente';
      grid.innerHTML = inicialesHTML;
      vacio.hidden = true;
      datos().then(function (l) { mas.hidden = l.filter(function (n) { return !n.x; }).length <= porPagina; });
    }

    var p = new URLSearchParams(location.search);
    if (p.get('q') || p.get('categoria')) {
      estado.q = p.get('q') || ''; estado.cat = p.get('categoria') || ''; estado.filtrando = true;
      q.value = estado.q; marcarChip(); pintar();
      document.getElementById('buscar').scrollIntoView();
    }
  }

  /* ---------------- galería (lightbox) ---------------- */
  var lb = document.getElementById('lb');
  var fotos = [].slice.call(document.querySelectorAll('[data-lb]'));
  if (lb && fotos.length && lb.showModal) {
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap'), actual = 0;
    var cap = document.querySelector('.art-cover figcaption');
    function mostrar(i) {
      actual = (i + fotos.length) % fotos.length;
      lbImg.src = fotos[actual].getAttribute('href');
      lbImg.alt = fotos[actual].querySelector('img').alt;
      lbCap.textContent = (fotos.length > 1 ? (actual + 1) + ' / ' + fotos.length : '') + (cap ? '  ·  ' + cap.textContent : '');
    }
    fotos.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); mostrar(i); lb.showModal(); });
    });
    lb.querySelector('[data-lb-close]').onclick = function () { lb.close(); };
    lb.querySelector('[data-lb-prev]').onclick = function () { mostrar(actual - 1); };
    lb.querySelector('[data-lb-next]').onclick = function () { mostrar(actual + 1); };
    lb.querySelectorAll('.lb-nav').forEach(function (b) { b.hidden = fotos.length < 2; });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.open) return;
      if (e.key === 'ArrowRight') mostrar(actual + 1);
      if (e.key === 'ArrowLeft') mostrar(actual - 1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------------- video ---------------- */
  [].forEach.call(document.querySelectorAll('[data-yt]'), function (b) {
    b.addEventListener('click', function () {
      b.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video"></iframe>';
    }, { once: true });
  });

  /* ---------------- compartir ---------------- */
  var share = document.querySelector('[data-share]');
  if (share) {
    var url = share.getAttribute('data-url'), title = share.getAttribute('data-title');
    var copiar = share.querySelector('[data-copy]');
    if (navigator.share && matchMedia('(pointer:coarse)').matches) {
      copiar.textContent = 'Más opciones';
      copiar.addEventListener('click', function () { navigator.share({ title: title, url: url }).catch(function () {}); });
    } else {
      copiar.addEventListener('click', function () {
        navigator.clipboard.writeText(url).then(function () {
          copiar.textContent = '¡Copiado!';
          setTimeout(function () { copiar.textContent = 'Copiar link'; }, 1800);
        });
      });
    }
  }
})();
