// Vorka México · interacción del sitio (sin dependencias)
(function () {
  var d = document, raiz = d.documentElement;
  raiz.classList.add('js');
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = window.matchMedia('(pointer: fine)').matches;

  // Navegación
  var nav = d.querySelector('.nav');
  function alBajar() { if (nav) nav.classList.toggle('solida', window.scrollY > 30); }
  alBajar(); window.addEventListener('scroll', alBajar, { passive: true });
  var mb = d.querySelector('.menu-btn');
  function cerrarMenu() { d.body.classList.remove('menu-abierto'); mb.setAttribute('aria-expanded', 'false'); d.body.style.overflow = ''; }
  if (mb) {
    mb.addEventListener('click', function () {
      var a = d.body.classList.toggle('menu-abierto');
      mb.setAttribute('aria-expanded', a); d.body.style.overflow = a ? 'hidden' : '';
    });
    d.querySelectorAll('.menu-movil a').forEach(function (a) { a.addEventListener('click', cerrarMenu); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.body.classList.contains('menu-abierto')) cerrarMenu(); });
  }

  // Aparición al hacer scroll
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !quieto) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('visto'); });

  // Cifras que cuentan
  function contar(el) {
    var fin = Number(el.getAttribute('data-cuenta')), t0 = null, dur = 1400;
    if (quieto) return;
    function paso(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))).toLocaleString('es-MX'); if (p < 1) requestAnimationFrame(paso); }
    requestAnimationFrame(paso);
    setTimeout(function () { el.textContent = fin.toLocaleString('es-MX'); }, dur + 300);
  }
  if ('IntersectionObserver' in window) {
    var ic = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { contar(e.target); ic.unobserve(e.target); } }); }, { threshold: .6 });
    d.querySelectorAll('[data-cuenta]').forEach(function (el) { ic.observe(el); });
  }

  // La V como ventana: ciudades que cambian
  var cuadros = d.querySelectorAll('.ventana-v .cuadro'), lugar = d.getElementById('lugar');
  if (cuadros.length > 1 && !quieto) {
    var k = 0;
    setInterval(function () {
      if (d.hidden) return;
      cuadros[k].classList.remove('activa');
      k = (k + 1) % cuadros.length;
      cuadros[k].classList.add('activa');
      if (lugar) lugar.textContent = cuadros[k].getAttribute('data-lugar');
    }, 5200);
  }

  // Profundidad: las tarjetas siguen al mouse
  var escena = d.querySelector('.escena');
  if (escena && fino && !quieto) {
    var hijos = escena.querySelectorAll('.flota > *'), raf = null, mx = 0, my = 0;
    escena.addEventListener('mousemove', function (e) {
      var r = escena.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(function () { raf = null; hijos.forEach(function (h) { var z = Number(h.parentNode.getAttribute('data-z') || 1); h.style.transform = 'translate(' + (mx * 18 * z) + 'px,' + (my * 14 * z) + 'px)'; }); });
    });
    escena.addEventListener('mouseleave', function () { hijos.forEach(function (h) { h.style.transform = ''; }); });
  }

  // Proceso: pasos que avanzan solos (y se pueden elegir)
  var pasos = d.querySelectorAll('.paso-b'), pants = d.querySelectorAll('.pantalla'), ruta = d.getElementById('ruta-app');
  if (pasos.length) {
    var actual = 0, reloj = null, visible = false;
    function ir(n, auto) {
      actual = (n + pasos.length) % pasos.length;
      pasos.forEach(function (p, i) { p.classList.toggle('activo', i === actual); p.classList.remove('corre'); p.setAttribute('aria-selected', i === actual); });
      pants.forEach(function (p, i) { p.classList.toggle('activa', i === actual); });
      if (ruta) ruta.textContent = pasos[actual].getAttribute('data-ruta');
      if (auto && !quieto) { void pasos[actual].offsetWidth; pasos[actual].classList.add('corre'); }
    }
    function correr() { clearInterval(reloj); if (quieto || !visible) return; ir(actual, true); reloj = setInterval(function () { ir(actual + 1, true); }, 6000); }
    pasos.forEach(function (p, i) { p.addEventListener('click', function () { clearInterval(reloj); ir(i, false); }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) correr(); else clearInterval(reloj); }, { threshold: .4 }).observe(d.querySelector('.proceso'));
    ir(0, false);
  }

  // Últimas noticias de Sparks (si cargan; si no, se queda la tarjeta fija)
  var notas = d.getElementById('notas-sparks');
  if (notas) {
    fetch('/sparks/celaya/noticias.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.n || !j.n.length) return;
      var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
      var fijas = notas.innerHTML;
      notas.innerHTML = j.n.slice(0, 2).map(function (n) {
        var im = n.i ? '<img src="' + esc(j.img + '/' + n.i + '-800.webp') + '" alt="" loading="lazy">' : '';
        return '<a class="nota-h" href="/sparks/celaya/' + esc(n.s) + '/"><span class="im">' + im + '</span><span class="tx"><small>' + esc(n.c) + ' · ' + esc(n.f) + '</small><b>' + esc(n.t) + '</b></span></a>';
      }).join('');
      if (j.n.length < 2) { var t = d.createElement('div'); t.innerHTML = fijas; notas.appendChild(t.lastElementChild); }
    }).catch(function () {});
  }

  // Boletín Sparks
  var bol = d.getElementById('boletin');
  if (bol) bol.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(bol), nombre = String(f.get('nombre') || '').trim(), correo = String(f.get('correo') || '').trim();
    var msg = bol.querySelector('.msg'), btn = bol.querySelector('button');
    if (nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) { msg.textContent = 'Escribe tu nombre y un correo válido.'; return; }
    if (!f.get('acepto')) { msg.textContent = 'Acepta recibir comunicaciones para suscribirte.'; return; }
    btn.disabled = true; btn.textContent = 'Enviando…';
    // La suscripción queda en Vorka México (os.vorka.mx → Boletín semanal), desde donde sale el boletín cada semana
    fetch('https://os.vorka.mx/api/publico/boletin', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre, correo: correo, acepto: true, origen: 'vorka.mx', sitio: String(f.get('sitio') || '') }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ''); return j; }); })
      .then(function () { bol.innerHTML = '<p style="font-size:20px;font-weight:700;color:#fff;margin:0">Listo, te sumamos.</p><p style="margin:8px 0 0">Recibirás la próxima edición de Sparks en tu correo.</p>'; })
      .catch(function (er) { msg.textContent = (er && er.message) || 'No se pudo enviar. Intenta de nuevo en un momento.'; btn.disabled = false; btn.textContent = 'Suscribirme'; });
  });

  var anio = d.getElementById('anio'); if (anio) anio.textContent = new Date().getFullYear();
})();
