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

  var J = null;
  // La persona marca desde su liga: hitos (con evidencia) y renglones del checklist. Vorka OS revisa que sean de este token.
  function enviar(ruta, cuerpo) {
    return fetch(api + token + ruta, { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'No se pudo guardar. Intenta de nuevo.'); return j; }); });
  }

  function pintar(j) {
    J = j;
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

    tablero(j);
    var rd = x('radar'); if (rd) rd.innerHTML = m.competencias.length >= 3 ? '<figcaption>Perfil por competencia</figcaption>' + radar(m.competencias.map(function (k) { return { nombre: k.nombre, valor: k.actual, base: k.base, meta: k.meta }; }), 10) + '<p class="dx-ley"><i class="b"></i>Punto de partida <i class="s"></i>Hoy <i class="m"></i>Meta</p>' : '';
    var cv = x('curva'); if (cv) cv.innerHTML = curva(j.hitos || []);

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
        return '<li class="dx-hito ' + esc(h.estado) + (tarde ? ' tarde' : '') + '" data-id="' + esc(h.id) + '"><span class="dx-check">' + (h.estado === 'cumplido' ? OK : '') + '</span><div><b>' + md(h.titulo) + '</b><small>' +
          [h.competencia && nombreComp[h.competencia] ? esc(nombreComp[h.competencia]) + ' +' + esc(h.puntos) : '', h.estado === 'cumplido' ? 'Cumplido ' + fecha(h.cumplido_en) : h.fecha_limite ? (tarde ? 'Pasó su fecha · ' : 'Para el ') + fecha(h.fecha_limite) : '', h.estado === 'en_curso' ? 'En curso' : ''].filter(Boolean).join(' · ') + '</small>' + evi + acciones(h) + '</div></li>';
      }).join('') + '</ul></li>';
    }).join('') || '<li class="dx-vacio">El plan de hitos se publica después de la primera sesión.</li>';

    // Secciones del contenido
    var secs = c.secciones || [];
    if (secs.length) {
      var ind = x('indice'); ind.hidden = false;
      ind.innerHTML = '<span>' + secs.length + ' secciones</span>' + secs.map(function (s, i) { return '<a href="#' + esc(s.id || 's' + i) + '"><i>' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</i>' + esc(s.titulo) + '</a>'; }).join('');
    }
    x('secciones').innerHTML = secs.map(function (s, i) {
      return '<section class="dx-sec rv" id="' + esc(s.id || 's' + i) + '"><span class="etiqueta"><b class="dx-rom">' + ROM(i + 1) + '.</b>' + (s.etiqueta ? ' ' + esc(s.etiqueta) : '') + '</span><h2 class="h3">' + md(s.titulo) + '</h2>' + s.bloques.map(function (b, bi) { return bloque(b, s.id || 's' + i, bi); }).join('') + '</section>';
    }).join('');
    if (secs.some(function (s) { return s.id === 'ruta'; })) { /* el enlace "Ruta" del menú lleva a su sección */ } else d.querySelector('.dx-nav a[href="#ruta"]').hidden = true;

    x('actualizado').textContent = 'Actualizado el ' + fecha((j.actualizado || '').slice(0, 10)) + '. Documento privado de trabajo: solo lo ve quien tiene la liga y no aparece en buscadores.';
    main.removeAttribute('aria-busy'); d.body.classList.add('dx-listo');
    aparecer();
  }

  function bloque(b, sid, bi) {
    switch (b.tipo) {
      case 'p': return '<p>' + md(b.texto) + '</p>';
      case 'lista': var tag = b.numerada ? 'ol' : 'ul'; return (b.titulo ? '<h3 class="dx-h4">' + md(b.titulo) + '</h3>' : '') + '<' + tag + ' class="dx-lista">' + (b.items || []).map(function (i) { return '<li>' + md(i) + '</li>'; }).join('') + '</' + tag + '>';
      case 'cifras': return '<div class="dx-cifras">' + (b.items || []).map(function (i) { return '<div><b class="num">' + esc(i.valor) + '</b><span>' + md(i.texto) + '</span></div>'; }).join('') + '</div>';
      case 'nota': return '<div class="dx-nota ' + (b.tono === 'aviso' || b.tono === 'ojo' ? 'dx-ojo' : 'dx-dato') + '"><p>' + md(b.texto) + '</p></div>';
      case 'tarjetas': return '<div class="dx-grid">' + (b.items || []).map(function (i) { return '<div class="dx-card"><h3>' + md(i.titulo) + '</h3><p>' + md(i.texto) + '</p></div>'; }).join('') + '</div>';
      // Checklist palomeable: la persona lo marca y se guarda (clave = sección:bloque:renglón)
      case 'checklist':
        var marcas = (J && J.marcas) || {}, its = b.items || [], hechos = 0;
        var lis = its.map(function (i, n) { var k = (String(sid).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 's') + ':' + bi + ':' + n, ok = !!marcas[k]; if (ok) hechos++;
          return '<li class="' + (ok ? 'hecho' : '') + '"><button type="button" class="dx-palomita" role="checkbox" aria-checked="' + ok + '" data-marca="' + esc(k) + '" aria-label="Marcar: ' + esc(String(i).replace(/\*\*/g, '')) + '">' + (ok ? OK : '') + '</button><span class="dx-ck-t">' + md(i) + '</span></li>'; }).join('');
        return '<div class="dx-ck-h"><span>' + hechos + ' de ' + its.length + ' listos</span><i><b style="width:' + (its.length ? hechos / its.length * 100 : 0) + '%"></b></i></div><ul class="dx-check-l">' + lis + '</ul>' + (b.pie ? '<p class="dx-pie-b">' + md(b.pie) + '</p>' : '');
      // Indicadores con meta: valor actual contra la meta (lo actualiza el mentor en el contenido)
      case 'kpis': return '<div class="dx-kpis">' + (b.items || []).map(function (i) {
        var a = Number(i.actual), mt = Number(i.meta), num = isFinite(a) && isFinite(mt) && mt > 0, pct = num ? Math.max(0, Math.min(100, a / mt * 100)) : 0;
        return '<div class="dx-kpi' + (num && a >= mt ? ' logrado' : '') + '"><span>' + md(i.nombre) + '</span><b class="num">' + esc(i.actual == null || i.actual === '' ? '—' : i.actual) + '<small> / ' + esc(i.meta) + (i.unidad ? ' ' + esc(i.unidad) : '') + '</small></b>' +
          (num ? '<i><b style="width:' + pct + '%"></b></i>' : '') + (i.nota ? '<p>' + md(i.nota) + '</p>' : '') + '</div>';
      }).join('') + '</div>';
      case 'radar': return '<figure class="dx-fig claro">' + (b.titulo ? '<figcaption>' + md(b.titulo) + '</figcaption>' : '') + radar((b.items || []).map(function (i) { return { nombre: i.nombre, valor: Number(i.valor) || 0, meta: i.meta != null ? Number(i.meta) : null }; }), Number(b.max) || 10) + '</figure>';
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

  // ---------- Tablero: lo que se mide del plan, calculado de los hitos ----------
  function tablero(j) {
    var el = x('tablero'); if (!el) return;
    var hs = j.hitos || [], mes = hoy.slice(0, 7), pts = function (l) { return l.reduce(function (a, h) { return a + (Number(h.puntos) || 1); }, 0); };
    var hechos = hs.filter(function (h) { return h.estado === 'cumplido'; }), delMes = hs.filter(function (h) { return (h.fecha_limite || '').slice(0, 7) === mes; });
    var porRevisar = hechos.filter(function (h) { return !h.validado; }).length, enCurso = hs.filter(function (h) { return h.estado === 'en_curso'; }).length;
    var prox = hs.filter(function (h) { return h.estado !== 'cumplido' && h.fecha_limite && h.fecha_limite >= hoy; }).sort(function (a, b) { return a.fecha_limite < b.fecha_limite ? -1 : 1; });
    var dias = function (f) { return Math.round((Date.parse(f) - Date.parse(hoy)) / 864e5); };
    var tarde = hs.filter(function (h) { return h.estado !== 'cumplido' && h.fecha_limite && h.fecha_limite < hoy; }).length;
    var k = [
      ['Puntos ganados', (Math.round(pts(hechos) * 10) / 10) + '<small> / ' + (Math.round(pts(hs) * 10) / 10) + '</small>', 'con evidencia'],
      ['Este mes', delMes.filter(function (h) { return h.estado === 'cumplido'; }).length + '<small> / ' + delMes.length + '</small>', 'hitos de ' + MES_L[Number(mes.slice(5)) - 1].toLowerCase()],
      ['Próximo', prox.length ? (dias(prox[0].fecha_limite) === 0 ? 'Hoy' : dias(prox[0].fecha_limite) + '<small> días</small>') : '—', prox.length ? esc(prox[0].titulo) : 'sin pendientes con fecha'],
      ['En curso', String(enCurso), enCurso === 1 ? 'hito avanzando' : 'hitos avanzando'],
      ['Atrasados', String(tarde), tarde ? 'pasaron su fecha' : 'todo a tiempo'],
      ['Por revisar', String(porRevisar), 'con tu mentor']];
    el.innerHTML = k.map(function (c, i) { return '<div class="dx-kp' + (i === 4 && tarde ? ' mal' : '') + '"><span>' + c[0] + '</span><b class="num">' + c[1] + '</b><small>' + c[2] + '</small></div>'; }).join('');
    var px = x('proximos');
    if (px) px.innerHTML = prox.slice(0, 3).map(function (h) { var n = dias(h.fecha_limite);
      return '<div class="dx-px"><b class="num">' + (n === 0 ? 'Hoy' : n) + '</b><small>' + (n === 0 ? '' : n === 1 ? 'día' : 'días') + '</small><p>' + md(h.titulo) + '</p><span>' + fecha(h.fecha_limite) + '</span></div>'; }).join('') || '<p class="dx-ayuda">No hay hitos por venir.</p>';
  }

  // Radar (SVG): punto de partida, hoy y meta por competencia. items: [{nombre, valor, base?, meta?}]
  function radar(items, max) {
    var n = items.length; if (n < 3) return '';
    var W = 440, c = W / 2, R = 128, ang = function (i) { return -Math.PI / 2 + i * 2 * Math.PI / n; };
    var pt = function (i, v) { var r = Math.max(0, Math.min(1, v / max)) * R; return (c + r * Math.cos(ang(i))).toFixed(1) + ',' + (c + r * Math.sin(ang(i))).toFixed(1); };
    var poli = function (k, cls) { if (items.some(function (it) { return it[k] == null; })) return ''; return '<polygon class="' + cls + '" points="' + items.map(function (it, i) { return pt(i, it[k]); }).join(' ') + '"/>'; };
    var red = [.25, .5, .75, 1].map(function (f) { return '<polygon class="red" points="' + items.map(function (it, i) { return pt(i, f * max); }).join(' ') + '"/>'; }).join('');
    var ejes = items.map(function (it, i) { return '<line class="eje" x1="' + c + '" y1="' + c + '" x2="' + pt(i, max).split(',')[0] + '" y2="' + pt(i, max).split(',')[1] + '"/>'; }).join('');
    var etq = items.map(function (it, i) {
      var a = ang(i), x0 = c + (R + 16) * Math.cos(a), y0 = c + (R + 16) * Math.sin(a), anc = Math.abs(Math.cos(a)) < .2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
      var pal = String(it.nombre).split(' '), l1 = '', l2 = '';
      pal.forEach(function (w) { if ((l1 + ' ' + w).trim().length <= 16 && !l2) l1 = (l1 + ' ' + w).trim(); else l2 = (l2 + ' ' + w).trim(); });
      if (l2.length > 18) l2 = l2.slice(0, 17) + '…';
      var dy = Math.sin(a) < -.5 ? (l2 ? -14 : -4) : Math.sin(a) > .5 ? 10 : (l2 ? -3 : 4);
      return '<text x="' + x0.toFixed(1) + '" y="' + (y0 + dy).toFixed(1) + '" text-anchor="' + anc + '">' + esc(l1) + (l2 ? '<tspan x="' + x0.toFixed(1) + '" dy="1.15em">' + esc(l2) + '</tspan>' : '') + '<tspan class="v" x="' + x0.toFixed(1) + '" dy="1.15em">' + esc(it.valor) + (it.meta != null ? ' / ' + esc(it.meta) : '') + '</tspan></text>';
    }).join('');
    return '<svg class="dx-radar" viewBox="-60 -10 ' + (W + 120) + ' ' + (W + 20) + '" role="img" aria-label="' + esc(items.map(function (it) { return it.nombre + ' ' + it.valor + (it.meta != null ? ' de meta ' + it.meta : ''); }).join(', ')) + '">' +
      red + ejes + poli('meta', 'meta') + poli('base', 'base') + poli('valor', 'hoy') + items.map(function (it, i) { var p = pt(i, it.valor).split(','); return '<circle class="pto" cx="' + p[0] + '" cy="' + p[1] + '" r="3.5"/>'; }).join('') + etq + '</svg>';
  }

  // Curva de avance (SVG): puntos que el plan espera acumular por fecha contra los que ya tienen evidencia
  function curva(hs) {
    var con = hs.filter(function (h) { return h.fecha_limite; }); if (con.length < 2) return '';
    var pts = function (h) { return Number(h.puntos) || 1; }, total = hs.reduce(function (a, h) { return a + pts(h); }, 0);
    var fechas = con.map(function (h) { return h.fecha_limite; }).concat(hs.filter(function (h) { return h.cumplido_en; }).map(function (h) { return h.cumplido_en.slice(0, 10); }), [hoy]).sort();
    var t0 = Date.parse(fechas[0]) - 5 * 864e5, t1 = Math.max(Date.parse(fechas[fechas.length - 1]), Date.parse(hoy)) + 3 * 864e5;
    var chico = innerWidth < 640, W = chico ? 380 : 640, H = chico ? 230 : 250, L = 44, B = 26, T = 14, Rm = 12;
    var X = function (f) { return L + (Date.parse(f) - t0) / (t1 - t0) * (W - L - Rm); }, Y = function (v) { return H - B - v / total * (H - B - T); };
    var escal = function (lista, campo, hasta) {
      var orden = lista.slice().sort(function (a, b) { return a[campo] < b[campo] ? -1 : 1; }), acc = 0, d = 'M' + L + ',' + Y(0);
      orden.forEach(function (h) { var f = h[campo].slice(0, 10); if (hasta && f > hasta) return; d += ' H' + X(f).toFixed(1); acc += pts(h); d += ' V' + Y(acc).toFixed(1); });
      return { d: d + (hasta ? ' H' + X(hasta).toFixed(1) : ' H' + (W - Rm)), acc: acc };
    };
    var plan = escal(con, 'fecha_limite'), real = escal(hs.filter(function (h) { return h.estado === 'cumplido' && h.cumplido_en; }), 'cumplido_en', hoy);
    var esperadoHoy = con.filter(function (h) { return h.fecha_limite <= hoy; }).reduce(function (a, h) { return a + pts(h); }, 0);
    var meses = [], f = new Date(t0); f.setUTCDate(1); f.setUTCMonth(f.getUTCMonth() + 1);
    while (f.getTime() < t1) { meses.push(f.toISOString().slice(0, 10)); f.setUTCMonth(f.getUTCMonth() + 1); }
    var guia = [0, .5, 1].map(function (q) { return '<line class="g" x1="' + L + '" x2="' + (W - Rm) + '" y1="' + Y(q * total) + '" y2="' + Y(q * total) + '"/><text class="ey" x="' + (L - 8) + '" y="' + (Y(q * total) + 4) + '" text-anchor="end">' + Math.round(q * 100) + '%</text>'; }).join('');
    var mx = meses.map(function (m) { return '<line class="g" x1="' + X(m) + '" x2="' + X(m) + '" y1="' + T + '" y2="' + (H - B) + '"/><text class="ex" x="' + (X(m) + 4) + '" y="' + (H - 8) + '">' + MES[Number(m.slice(5, 7)) - 1] + '</text>'; }).join('');
    var xh = X(hoy).toFixed(1);
    return '<figcaption>Avance contra el plan</figcaption><svg class="dx-curva" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="A hoy el plan espera ' + Math.round(esperadoHoy / total * 100) + ' por ciento y lleva ' + Math.round(real.acc / total * 100) + ' por ciento">' +
      guia + mx + '<path class="plan" d="' + plan.d + '"/><path class="real" d="' + real.d + '"/><circle class="pto" cx="' + xh + '" cy="' + Y(real.acc).toFixed(1) + '" r="4.5"/>' +
      '<line class="hoy" x1="' + xh + '" x2="' + xh + '" y1="' + T + '" y2="' + (H - B) + '"/><text class="th" x="' + xh + '" y="' + (T + 2) + '" text-anchor="middle">hoy</text></svg>' +
      '<p class="dx-ley"><i class="p"></i>Lo que pide el plan <i class="s"></i>Lo cumplido con evidencia</p>';
  }

  // Acciones de cada hito en la liga de la persona
  function acciones(h) {
    if (h.estado === 'cumplido' && h.validado) return '<span class="dx-val">' + OK + 'Validado por tu mentor</span>';
    if (h.estado === 'cumplido') return '<div class="dx-acc"><span class="dx-rev">Por revisar con tu mentor</span><button type="button" data-a="pendiente">Deshacer</button></div>';
    return '<div class="dx-acc"><button type="button" class="pri" data-a="tengo">Ya lo cumplí</button>' + (h.estado === 'en_curso' ? '<button type="button" data-a="pendiente">Aún no empiezo</button>' : '<button type="button" data-a="en_curso">Lo estoy haciendo</button>') + '</div>' +
      '<form class="dx-evi-f" hidden><label>¿Qué lo demuestra?<textarea name="evidencia" maxlength="1000" rows="2" placeholder="Ej. Envié mi preselección el 13 de noviembre; adjunto la captura."></textarea></label>' +
      '<label>Liga a la evidencia (opcional)<input name="evidencia_url" type="url" inputmode="url" placeholder="https://drive.google.com/…"></label>' +
      '<p class="dx-err" role="alert"></p><div class="dx-acc"><button type="submit" class="pri">Guardar</button><button type="button" data-a="cancelar">Cancelar</button></div></form>';
  }

  main.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b || !J) return;
    if (b.dataset.marca) {
      var k = b.dataset.marca, ok = b.getAttribute('aria-checked') !== 'true';
      b.setAttribute('aria-checked', ok); b.innerHTML = ok ? OK : ''; b.parentNode.classList.toggle('hecho', ok);
      J.marcas = J.marcas || {}; if (ok) J.marcas[k] = hoy; else delete J.marcas[k];
      var lista = b.closest('.dx-check-l'), cab = lista && lista.previousElementSibling;
      if (cab && cab.classList.contains('dx-ck-h')) { var tot = lista.children.length, he = lista.querySelectorAll('[aria-checked="true"]').length; cab.querySelector('span').textContent = he + ' de ' + tot + ' listos'; cab.querySelector('b').style.width = (he / tot * 100) + '%'; }
      enviar('/marcas', { clave: k, hecho: ok }).catch(function (e) { b.setAttribute('aria-checked', !ok); b.innerHTML = !ok ? OK : ''; b.parentNode.classList.toggle('hecho', !ok); alert(e.message); });
      return;
    }
    var a = b.dataset.a, li = b.closest('.dx-hito'); if (!a || !li) return;
    var form = li.querySelector('.dx-evi-f');
    if (a === 'tengo') { form.hidden = false; li.querySelector('.dx-acc').hidden = true; form.querySelector('textarea').focus(); return; }
    if (a === 'cancelar') { form.hidden = true; li.querySelector('.dx-acc').hidden = false; return; }
    b.disabled = true;
    enviar('/hitos/' + li.dataset.id, { estado: a }).then(repintar).catch(function (e) { b.disabled = false; alert(e.message); });
  });
  main.addEventListener('submit', function (ev) {
    var form = ev.target.closest('.dx-evi-f'); if (!form) return;
    ev.preventDefault();
    var li = form.closest('.dx-hito'), err = form.querySelector('.dx-err'), btn = form.querySelector('[type=submit]');
    var ev1 = form.evidencia.value.trim(), url = form.evidencia_url.value.trim();
    if (!ev1 && !url) { err.textContent = 'Cuéntanos qué lo demuestra o pega una liga.'; return; }
    btn.disabled = true; err.textContent = '';
    enviar('/hitos/' + li.dataset.id, { estado: 'cumplido', evidencia: ev1, evidencia_url: url }).then(repintar).catch(function (e) { btn.disabled = false; err.textContent = e.message; });
  });
  function repintar(j) { var y = scrollY; pintar(j); scrollTo(0, y); }

  function aparecer() {
    var rv = d.querySelectorAll('.dx .rv:not(.visto)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { rv.forEach(function (n) { n.classList.add('visto'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: .04 });
    rv.forEach(function (n) { io.observe(n); });
  }
})();
