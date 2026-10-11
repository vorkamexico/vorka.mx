// Vorka México · interacción del sitio (sin dependencias)
(function () {
  var d = document, raiz = d.documentElement;
  raiz.classList.add('js');
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Navegación: se vuelve sólida al bajar; menú en celular
  var nav = d.querySelector('.nav');
  function alBajar() { if (nav) nav.classList.toggle('solida', window.scrollY > 40); }
  alBajar(); window.addEventListener('scroll', alBajar, { passive: true });
  var mb = d.querySelector('.menu-btn');
  if (mb) {
    mb.addEventListener('click', function () {
      var abierto = d.body.classList.toggle('menu-abierto');
      mb.setAttribute('aria-expanded', abierto);
      d.body.style.overflow = abierto ? 'hidden' : '';
    });
    d.querySelectorAll('.menu-movil a').forEach(function (a) {
      a.addEventListener('click', function () { d.body.classList.remove('menu-abierto'); mb.setAttribute('aria-expanded', 'false'); d.body.style.overflow = ''; });
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.body.classList.contains('menu-abierto')) mb.click(); });
  }

  // Aparición al hacer scroll
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !quieto) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('visto'); });

  // Cifras que cuentan hacia arriba
  var cifras = d.querySelectorAll('[data-cuenta]');
  function contar(el) {
    var fin = Number(el.getAttribute('data-cuenta')), t0 = null, dur = 1600;
    if (quieto) { el.textContent = fin.toLocaleString('es-MX'); return; }
    function paso(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), v = Math.round(fin * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString('es-MX'); if (p < 1) requestAnimationFrame(paso); }
    requestAnimationFrame(paso);
    setTimeout(function () { el.textContent = fin.toLocaleString('es-MX'); }, dur + 300);
  }
  if ('IntersectionObserver' in window) {
    var ic = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { contar(e.target); ic.unobserve(e.target); } }); }, { threshold: .5 });
    cifras.forEach(function (el) { ic.observe(el); });
  }

  // Portada: diapositivas de ciudades
  var diapos = d.querySelectorAll('.diapo'), botones = d.querySelectorAll('.ciudad-btn');
  if (diapos.length > 1) {
    var i = 0, reloj = null;
    function ir(n) {
      i = (n + diapos.length) % diapos.length;
      diapos.forEach(function (x, k) { x.classList.toggle('activa', k === i); });
      botones.forEach(function (b, k) { b.classList.remove('activa'); b.setAttribute('aria-pressed', k === i); if (k === i) { void b.offsetWidth; b.classList.add('activa'); } });
      var sig = diapos[(i + 1) % diapos.length].querySelector('img');
      if (sig && sig.loading === 'lazy') sig.loading = 'eager';
    }
    function arrancar() { clearInterval(reloj); if (!quieto) reloj = setInterval(function () { ir(i + 1); }, 6500); }
    botones.forEach(function (b, k) { b.addEventListener('click', function () { ir(k); arrancar(); }); });
    d.addEventListener('visibilitychange', function () { if (d.hidden) clearInterval(reloj); else arrancar(); });
    ir(0); arrancar();
  }

  // Selects con etiqueta flotante
  d.querySelectorAll('.campo select').forEach(function (s) {
    function marcar() { s.classList.toggle('lleno', !!s.value); }
    marcar(); s.addEventListener('change', marcar);
  });

  // Boletín Sparks (llega al correo del equipo)
  var bol = d.getElementById('boletin');
  if (bol) bol.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(bol), nombre = (f.get('nombre') || '').trim(), correo = (f.get('correo') || '').trim();
    var msg = bol.querySelector('.msg'), btn = bol.querySelector('button');
    if (nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) { msg.textContent = 'Escribe tu nombre y un correo válido.'; return; }
    if (!f.get('acepto')) { msg.textContent = 'Acepta recibir comunicaciones para suscribirte.'; return; }
    btn.disabled = true; btn.firstChild.textContent = 'Enviando…';
    fetch('https://formsubmit.co/ajax/vorkamexico@gmail.com', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: 'Sparks — nueva suscripción: ' + nombre, _template: 'table', _captcha: 'false', nombre: nombre, correo: correo, organizacion: f.get('organizacion') || '' }) })
      .then(function (r) { if (!r.ok) throw 0; bol.innerHTML = '<h3>Listo. Te sumamos.</h3><p style="margin-top:10px;color:var(--tinta-2)">Recibirás la próxima edición de Sparks en tu correo.</p>'; })
      .catch(function () { msg.textContent = 'No se pudo enviar. Intenta de nuevo en un momento.'; btn.disabled = false; btn.firstChild.textContent = 'Suscribirme '; });
  });

  var anio = d.getElementById('anio'); if (anio) anio.textContent = new Date().getFullYear();
})();
