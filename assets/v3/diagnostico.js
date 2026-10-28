// Vorka México · diagnósticos de talento con progreso real (vorka.mx/diagnostico/ver/#<token>)
// Pide a Vorka OS el contenido y el avance de la persona y los pinta. Todo el texto se escapa; solo **negritas** pasan.
// En local (localhost) se puede probar con otra API: ?api=http://127.0.0.1:8787/api/publico/diagnostico/
(function () {
  var d = document, main = d.getElementById('contenido');
  var token = (location.hash.match(/^#([a-f0-9]{18})$/) || [])[1];
  var api = main.dataset.api;
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var otra = local && new URLSearchParams(location.search).get('api');
  if (otra) api = otra;

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var md = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); };
  var x = function (k) { return d.querySelector('[data-x="' + k + '"]'); };
  var v = function (k) { return d.querySelector('[data-v="' + k + '"]'); };
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var fecha = function (s) { return s ? Number(s.slice(8, 10)) + ' ' + MES[Number(s.slice(5, 7)) - 1] + (s.slice(0, 4) !== String(new Date().getFullYear()) ? ' ' + s.slice(0, 4) : '') : ''; };
  var hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  var ROM = function (n) { var r = '', v = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; v.forEach(function (p) { while (n >= p[0]) { r += p[1]; n -= p[0]; } }); return r; };
  var OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function error() { main.removeAttribute('aria-busy'); d.body.classList.add('dx-sin'); d.querySelector('.dx-error').hidden = false; }
  if (!token) return error();
  // Que el token no se quede en el historial de otras pestañas ni en capturas de la barra: se queda en el hash, nunca en la URL que viaja
  fetch(api + token, { credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(pintar).catch(error);

  function pintar(j) {
    var c = j.contenido || {}, enc = c.encabezado || {}, m = j.medida;
    d.title = (enc.persona || j.nombre) + ' · Mapa de ruta · Vorka México';
    x('etiqueta').textContent = enc.etiqueta || j.objetivo || 'Mapa de ruta';
    d.querySelector('.dx-nombre').textContent = enc.persona || j.nombre;
    d.querySelector('.dx-titulo').innerHTML = enc.titulo ? md(enc.titulo) : esc(j.objetivo || '');
    d.querySelector('.dx-lugar').innerHTML = [enc.rol, enc.lugar].filter(Boolean).map(esc).join('<br>');
    d.querySelector('.dx-extra').innerHTML = (enc.bajada ? '<p class="dx-bajada">' + md(enc.bajada) + '</p>' : '') + (enc.frase ? '<q>' + md(enc.frase) + '</q>' : '');

    // Avance en vivo
    var anillo = d.querySelector('.dx-anillo');
    // Circunferencia del anillo: 2π·52 ≈ 326.7. En 0 se oculta (la punta redonda dejaría un punto).
    var arco = function (sel, pct) { anillo.querySelector(sel).style.strokeDasharray = (pct * 3.267).toFixed(1) + ' 326.7'; };
    arco('.fondo-esp', m.esperado);
    if (!m.avance) anillo.querySelector('.avance').style.opacity = 0;
    setTimeout(function () { arco('.avance', m.avance); }, 60);
    anillo.querySelector('b').textContent = m.avance + ' %';
    v('esperado').textContent = m.esperado + ' %';
    v('score').innerHTML = (m.score_actual !== m.score_base ? esc(m.score_base) + ' → ' : '') + '<b>' + esc(m.score_actual) + '</b><small> / ' + esc(m.score_meta) + '</small>';
    v('hitos').textContent = m.hitos_cumplidos + ' de ' + m.hitos_total;
    v('dias').textContent = m.dias_al_objetivo == null ? '—' : m.dias_al_objetivo >= 0 ? m.dias_al_objetivo + ' días' : 'Cerrado';
    var proximo = (j.hitos || []).filter(function (h) { return h.estado !== 'cumplido' && h.fecha_limite && h.fecha_limite >= hoy; }).map(function (h) { return h.fecha_limite; }).sort()[0];
    var ritmo = !m.hitos_total ? ['', 'El plan se está armando.'] : !m.hitos_cumplidos && !m.esperado && !m.atrasados ? ['bien', 'El plan arranca' + (proximo ? ': primeros hitos para el ' + fecha(proximo) + '.' : '.')] : m.atrasados ? ['tarde', m.atrasados + (m.atrasados === 1 ? ' hito pasó su fecha' : ' hitos pasaron su fecha') + ' sin evidencia todavía.'] : m.avance >= m.esperado ? ['bien', 'Al día con el plan.'] : ['lento', 'Un poco detrás de lo esperado a hoy.'];
    var rt = v('ritmo'); rt.className = 'dx-ritmo ' + ritmo[0]; rt.textContent = ritmo[1];

    // Tarjetas del encabezado
    if ((c.tarjetas || []).length) { var t = x('tarjetas'); t.hidden = false; t.innerHTML = c.tarjetas.map(function (k, i) { return '<div class="dx-tarjeta rv" style="--d:' + i * 0.06 + 's"><span>' + esc(k.titulo) + '</span><p>' + md(k.texto) + '</p></div>'; }).join(''); }

    // Competencias: punto de partida, lo que subió con evidencia y la meta
    x('competencias').innerHTML = m.competencias.map(function (k) {
      return '<div class="dx-comp"><div class="dx-comp-h"><span>' + esc(k.nombre) + '</span><b class="num">' + esc(k.base) + (k.actual !== k.base ? ' → ' + esc(k.actual) : '') + '<small> / ' + esc(k.meta) + '</small></b></div>' +
        '<div class="dx-escala" role="img" aria-label="' + esc(k.nombre) + ': partió de ' + k.base + ', va en ' + k.actual + ', meta ' + k.meta + ' de 10"><i class="b" style="width:' + k.base * 10 + '%"></i><i class="s" style="left:' + k.base * 10 + '%;width:' + (k.actual - k.base) * 10 + '%"></i><em style="left:' + k.meta * 10 + '%"></em></div></div>';
    }).join('') + (m.competencias.length ? '<p class="dx-ley"><i class="b"></i>Punto de partida <i class="s"></i>Lo que subió con evidencia <i class="m"></i>Meta</p>' : '');

    // Hitos agrupados por mes
    var nombreComp = {}; m.competencias.forEach(function (k) { nombreComp[k.clave] = k.nombre; });
    var grupos = [], ult = null;
    (j.hitos || []).slice().sort(function (a, b) { return (a.fecha_limite || '9') < (b.fecha_limite || '9') ? -1 : 1; }).forEach(function (h) {
      var k = h.fecha_limite ? h.fecha_limite.slice(0, 7) : 'sin';
      if (k !== ult) { grupos.push({ k: k, items: [] }); ult = k; }
      grupos[grupos.length - 1].items.push(h);
    });
    x('hitos').innerHTML = grupos.map(function (g) {
      var hechos = g.items.filter(function (h) { return h.estado === 'cumplido'; }).length;
      return '<li class="dx-mes"><div class="dx-mes-h"><b>' + (g.k === 'sin' ? 'Sin fecha' : MES_L[Number(g.k.slice(5)) - 1] + ' ' + g.k.slice(0, 4)) + '</b><span>' + hechos + ' de ' + g.items.length + '</span></div><ul>' + g.items.map(function (h) {
        var tarde = h.estado !== 'cumplido' && h.fecha_limite && h.fecha_limite < hoy;
        var evi = h.estado === 'cumplido' && (h.evidencia || h.evidencia_url) ? '<span class="dx-evi">' + OK + (h.evidencia ? md(h.evidencia) : 'Evidencia') + (h.evidencia_url ? ' · <a href="' + esc(h.evidencia_url) + '" target="_blank" rel="noopener noreferrer">ver</a>' : '') + '</span>' : '';
        return '<li class="dx-hito ' + esc(h.estado) + (tarde ? ' tarde' : '') + '"><span class="dx-check">' + (h.estado === 'cumplido' ? OK : '') + '</span><div><b>' + md(h.titulo) + '</b><small>' +
          [h.competencia && nombreComp[h.competencia] ? esc(nombreComp[h.competencia]) : '', h.estado === 'cumplido' ? 'Cumplido ' + fecha(h.cumplido_en) : h.fecha_limite ? (tarde ? 'Pasó su fecha · ' : 'Para el ') + fecha(h.fecha_limite) : '', h.estado === 'en_curso' ? 'En curso' : ''].filter(Boolean).join(' · ') + '</small>' + evi + '</div></li>';
      }).join('') + '</ul></li>';
    }).join('') || '<li class="dx-vacio">El plan de hitos se publica después de la primera sesión.</li>';

    // Secciones del contenido
    var secs = c.secciones || [];
    if (secs.length) {
      var ind = x('indice'); ind.hidden = false;
      ind.innerHTML = '<span>' + secs.length + ' secciones</span>' + secs.map(function (s, i) { return '<a href="#' + esc(s.id || 's' + i) + '"><i>' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</i>' + esc(s.titulo) + '</a>'; }).join('');
    }
    x('secciones').innerHTML = secs.map(function (s, i) {
      return '<section class="dx-sec rv" id="' + esc(s.id || 's' + i) + '"><span class="etiqueta"><b class="dx-rom">' + ROM(i + 1) + '.</b>' + (s.etiqueta ? ' ' + esc(s.etiqueta) : '') + '</span><h2 class="h3">' + md(s.titulo) + '</h2>' + s.bloques.map(bloque).join('') + '</section>';
    }).join('');
    if (secs.some(function (s) { return s.id === 'ruta'; })) { /* el enlace "Ruta" del menú lleva a su sección */ } else d.querySelector('.dx-nav a[href="#ruta"]').hidden = true;

    x('actualizado').textContent = 'Actualizado el ' + fecha((j.actualizado || '').slice(0, 10)) + '. Documento privado de trabajo: solo lo ve quien tiene la liga y no aparece en buscadores.';
    main.removeAttribute('aria-busy'); d.body.classList.add('dx-listo');
    aparecer();
  }

  function bloque(b) {
    switch (b.tipo) {
      case 'p': return '<p>' + md(b.texto) + '</p>';
      case 'lista': var tag = b.numerada ? 'ol' : 'ul'; return (b.titulo ? '<h3 class="dx-h4">' + md(b.titulo) + '</h3>' : '') + '<' + tag + ' class="dx-lista">' + (b.items || []).map(function (i) { return '<li>' + md(i) + '</li>'; }).join('') + '</' + tag + '>';
      case 'cifras': return '<div class="dx-cifras">' + (b.items || []).map(function (i) { return '<div><b class="num">' + esc(i.valor) + '</b><span>' + md(i.texto) + '</span></div>'; }).join('') + '</div>';
      case 'nota': return '<div class="dx-nota ' + (b.tono === 'aviso' ? 'dx-ojo' : 'dx-dato') + '"><p>' + md(b.texto) + '</p></div>';
      case 'tarjetas': return '<div class="dx-grid">' + (b.items || []).map(function (i) { return '<div class="dx-card"><h3>' + md(i.titulo) + '</h3><p>' + md(i.texto) + '</p></div>'; }).join('') + '</div>';
      case 'checklist': return '<ul class="dx-check-l">' + (b.items || []).map(function (i) { return '<li><span></span>' + md(i) + '</li>'; }).join('') + '</ul>' + (b.pie ? '<p class="dx-pie-b">' + md(b.pie) + '</p>' : '');
      case 'tabla': return '<div class="dx-tabla"><table><thead><tr>' + (b.encabezados || []).map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + (b.filas || []).map(function (f) { return '<tr>' + f.map(function (c, i) { return i ? '<td>' + md(c) + '</td>' : '<th scope="row">' + md(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      case 'etapas':
        if (b.flujo) return '<ol class="dx-flujo">' + (b.items || []).map(function (i) { return '<li><b>' + md(i.titulo) + '</b><span>' + md(i.objetivo) + '</span></li>'; }).join('') + '</ol>';
        return '<ol class="dx-etapas">' + (b.items || []).map(function (i, n) {
          return '<li><div class="dx-et-h"><span class="dx-et-n">' + (n + 1) + '</span><div><small>' + esc(i.cuando) + '</small><h3>' + md(i.titulo) + '</h3></div></div>' +
            (i.objetivo ? '<p class="dx-et-o">' + md(i.objetivo) + '</p>' : '') +
            ((i.entregables || []).length ? '<h4>Entregables</h4><ul>' + i.entregables.map(function (e) { return '<li>' + md(e) + '</li>'; }).join('') + '</ul>' : '') +
            (i.paralelo ? '<p class="dx-et-p"><b>En paralelo:</b> ' + md(i.paralelo) + '</p>' : '') +
            (i.criterio ? '<p class="dx-et-c"><b>Avanza cuando:</b> ' + md(i.criterio) + '</p>' : '') + '</li>';
        }).join('') + '</ol>';
      // Calificaciones en barra (matriz de competencias, score): valor sobre max (10 o 100)
      case 'barras': return (b.titulo ? '<h3 class="dx-h4">' + md(b.titulo) + '</h3>' : '') + '<div class="dx-barras">' + (b.items || []).map(function (i) {
        var max = Number(i.max || b.max || 10), pct = Math.max(0, Math.min(100, Number(i.valor) / max * 100));
        return '<div class="dx-barra-f"><span>' + md(i.nombre) + (i.nota ? '<small>' + md(i.nota) + '</small>' : '') + '</span><i><b style="width:' + pct + '%"></b></i><em class="num">' + esc(i.valor) + '</em></div>';
      }).join('') + '</div>' + (b.total ? '<div class="dx-total"><span>' + md(b.total.titulo || 'Total') + '</span><b class="num">' + esc(b.total.valor) + '</b>' + (b.total.texto ? '<p>' + md(b.total.texto) + '</p>' : '') + '</div>' : '');
      // Línea de tiempo (trayectoria, evolución profesional)
      case 'linea': return '<ol class="dx-linea">' + (b.items || []).map(function (i) {
        return '<li><div class="dx-li-h"><small>' + esc(i.cuando) + '</small><h3>' + md(i.titulo) + '</h3></div>' + (i.texto ? '<p>' + md(i.texto) + '</p>' : '') + (i.nota ? '<p class="dx-li-n">' + md(i.nota) + '</p>' : '') + '</li>';
      }).join('') + '</ol>';
      case 'frase': return '<blockquote class="dx-frase"><p>' + md(b.texto) + '</p>' + (b.pie ? '<footer>' + md(b.pie) + '</footer>' : '') + '</blockquote>';
      // Varias listas cortas en rejilla (Top 10 del diagnóstico final)
      case 'grupos': return '<div class="dx-grupos">' + (b.items || []).map(function (g) {
        return '<div class="dx-grupo' + (g.tono ? ' ' + esc(g.tono) : '') + '"><h3>' + md(g.titulo) + '</h3><ol>' + (g.items || []).map(function (x) { return '<li>' + md(x) + '</li>'; }).join('') + '</ol></div>';
      }).join('') + '</div>';
      default: return '';
    }
  }

  function aparecer() {
    var rv = d.querySelectorAll('.dx .rv:not(.visto)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { rv.forEach(function (n) { n.classList.add('visto'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: .04 });
    rv.forEach(function (n) { io.observe(n); });
  }
})();
