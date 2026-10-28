// Diagnóstico gratis de los simuladores · cliente. Datos → clave del correo → preguntas con tutor → resultado.
// Se empaqueta dentro del Worker con: python3 _tienda/simulador/construir.py (usa las clases de app.css)
(function () {
  'use strict';
  var D = window.DX || {}, caja = document.getElementById('dx');
  if (!caja) return;
  var LETRAS = ['A', 'B', 'C', 'D'];
  var E = null;            // estado del servidor: { id, nombre, secciones, reactivos, textos, temas, planes, resultado }
  var run = null;          // { i, resp: { id: { fase, sel1, sel2, ok1, ok2 } }, orden: { id: [..] } }
  var lista = [];          // [{ sec, id }] en orden
  var K = null;            // llave de localStorage del avance
  var K_DATOS = 'vk_dx_datos';
  var ICONO = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    foco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    libro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
    fl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  // ---------- utilidades ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rico(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function barajar(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function guardar(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function leer(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function pesos(c) { return '$' + Math.round(c / 100).toLocaleString('es-MX'); }
  function h(html, arriba) {
    caja.innerHTML = html;
    if (arriba !== false) { var y = caja.getBoundingClientRect().top + window.pageYOffset - 90; if (Math.abs(window.pageYOffset - y) > 40 && caja.getBoundingClientRect().top < 0) window.scrollTo({ top: y, behavior: 'smooth' }); }
  }
  function api(ruta, op) {
    op = op || {};
    return fetch(D.api + '/diagnostico/' + ruta, { method: op.method || 'GET', credentials: 'same-origin', headers: op.body ? { 'content-type': 'application/json' } : {}, body: op.body ? JSON.stringify(op.body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) { var e = new Error(d.error || 'Algo falló. Intenta de nuevo.'); e.status = r.status; throw e; }
          return d;
        });
      }, function () { throw new Error('No hay conexión. Revisa tu internet e intenta de nuevo.'); });
  }
  function error(id, msg) { var e = document.getElementById(id); if (e) { e.textContent = msg; e.hidden = !msg; } }
  function ocupado(b, txt) { if (!b.dataset.t) b.dataset.t = b.innerHTML; b.disabled = !!txt; b.innerHTML = txt || b.dataset.t; }

  // ---------- 1. datos ----------
  function formulario(msg) {
    var g = leer(K_DATOS) || {};
    h('<h2>Haz tu diagnóstico gratis</h2><p>Te mandamos una clave a tu correo para empezar.</p>' +
      '<form class="dx-form" id="f-datos" novalidate>' +
        '<div class="dx-campo"><label for="dx-nombre">Tu nombre</label><input id="dx-nombre" autocomplete="name" maxlength="80" required value="' + esc(g.nombre || '') + '"></div>' +
        '<div class="dx-campo"><label for="dx-email">Correo electrónico</label><input id="dx-email" type="email" autocomplete="email" inputmode="email" maxlength="254" required value="' + esc(g.email || '') + '"><small>Aquí te llega la clave para entrar.</small></div>' +
        '<div class="dx-campo"><label for="dx-wa">WhatsApp</label><div class="dx-tel"><span>+52</span><input id="dx-wa" type="tel" autocomplete="tel-national" inputmode="tel" maxlength="16" placeholder="10 dígitos" required value="' + esc(g.whatsapp || '') + '"></div></div>' +
        '<label class="dx-casilla"><input type="checkbox" id="dx-acepto"' + (g.acepto ? ' checked' : '') + '><span>Acepto el <a href="/privacidad/" target="_blank" rel="noopener">aviso de privacidad</a> y que Vorka México me escriba por correo y WhatsApp sobre mi preparación.</span></label>' +
        '<p class="dx-error" id="e-datos" role="alert"' + (msg ? '' : ' hidden') + '>' + esc(msg || '') + '</p>' +
        '<button class="btn tinta" id="b-datos">Recibir mi clave ' + ICONO.fl + '</button>' +
      '</form>', false);
    document.getElementById('f-datos').onsubmit = function (e) {
      e.preventDefault();
      var d = { nombre: val('dx-nombre'), email: val('dx-email').toLowerCase(), whatsapp: val('dx-wa'), acepto: document.getElementById('dx-acepto').checked, ref: D.ref || '' };
      var dig = d.whatsapp.replace(/\D/g, '');
      if (d.nombre.length < 2) return error('e-datos', 'Escribe tu nombre.');
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(d.email)) return error('e-datos', 'Revisa tu correo: parece que le falta algo.');
      if (!(dig.length === 10 || (dig.length === 12 && dig.indexOf('52') === 0) || (dig.length === 13 && dig.indexOf('521') === 0))) return error('e-datos', 'Escribe tu WhatsApp a 10 dígitos, por ejemplo 55 1234 5678.');
      if (!d.acepto) return error('e-datos', 'Para seguir, acepta el aviso de privacidad.');
      pedir(d, document.getElementById('b-datos'));
    };
  }
  function val(id) { return String(document.getElementById(id).value || '').trim(); }
  function pedir(d, b, alListo) {
    error('e-datos', ''); error('e-clave', '');
    if (b) ocupado(b, 'Enviando…');
    guardar(K_DATOS, { nombre: d.nombre, email: d.email, whatsapp: d.whatsapp, acepto: d.acepto });
    api('pedir', { method: 'POST', body: d }).then(function () {
      if (alListo) alListo(); else clave(d.email);
    }).catch(function (e) {
      if (b) ocupado(b, '');
      if (alListo) error('e-clave', e.message); else error('e-datos', e.message);
    });
  }

  // ---------- 2. clave ----------
  function clave(email, aviso) {
    h('<h2>Revisa tu correo</h2><p class="dx-sub">Te mandamos una clave de 6 dígitos a <b>' + esc(email) + '</b>. Si no la ves, búscala en spam o promociones.</p>' +
      '<form class="dx-form" id="f-clave" novalidate>' +
        '<div class="dx-campo"><label for="dx-clave">Clave</label><input id="dx-clave" class="dx-clave num" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required></div>' +
        '<p class="dx-error" id="e-clave" role="alert" hidden></p>' +
        '<p class="dx-sub" id="ok-clave" role="status"' + (aviso ? '' : ' hidden') + '>' + esc(aviso || '') + '</p>' +
        '<button class="btn tinta" id="b-clave">Empezar mi diagnóstico ' + ICONO.fl + '</button>' +
        '<div class="dx-links"><button type="button" id="b-otra">Mandarme otra clave</button><button type="button" id="b-cambiar">Cambiar mis datos</button></div>' +
      '</form>');
    var inp = document.getElementById('dx-clave');
    inp.focus({ preventScroll: true });
    inp.oninput = function () { inp.value = inp.value.replace(/\D/g, '').slice(0, 6); if (inp.value.length === 6) document.getElementById('b-clave').click(); };
    document.getElementById('f-clave').onsubmit = function (e) {
      e.preventDefault();
      var b = document.getElementById('b-clave');
      if (inp.value.length !== 6 || b.disabled) return error('e-clave', inp.value.length !== 6 ? 'La clave tiene 6 dígitos.' : '');
      error('e-clave', ''); ocupado(b, 'Revisando…');
      api('codigo', { method: 'POST', body: { email: email, codigo: inp.value } }).then(listo).catch(function (er) { ocupado(b, ''); inp.value = ''; inp.focus(); error('e-clave', er.message); });
    };
    document.getElementById('b-otra').onclick = function () {
      var g = leer(K_DATOS); if (!g) return formulario();
      var b = this; b.disabled = true;
      pedir({ nombre: g.nombre, email: g.email, whatsapp: g.whatsapp, acepto: true, ref: D.ref || '' }, null, function () { b.disabled = false; var ok = document.getElementById('ok-clave'); ok.textContent = 'Listo: te mandamos una clave nueva. Usa la del último correo.'; ok.hidden = false; });
      setTimeout(function () { b.disabled = false; }, 4000);
    };
    document.getElementById('b-cambiar').onclick = function () { formulario(); };
  }

  // ---------- 3. preguntas ----------
  function listo(d) {
    E = d;
    // En celular, ya adentro se esconde la introducción: solo el diagnóstico
    var g = caja.parentElement; if (g) g.classList.add('dx-foco');
    if (E.resultado) return resultado(E.resultado, false);
    lista = [];
    E.secciones.forEach(function (s) { s.items.forEach(function (id) { lista.push({ sec: s, id: id }); }); });
    K = 'vk_dx_' + D.app + '_' + E.id;
    run = leer(K);
    if (!run || !run.resp) { run = { i: 0, resp: {}, orden: {} }; return intro(); }
    if (run.i >= lista.length) return terminar();
    pregunta();
  }
  function intro() {
    h('<h2>¡Listo, ' + esc(E.nombre) + '!</h2><p class="dx-sub">Tu diagnóstico tiene <b>' + lista.length + ' preguntas</b> tipo ' + esc(D.examen) + ', de menor a mayor dificultad. Lo haces en unos 10 minutos.</p>' +
      '<div class="dx-secs">' + E.secciones.map(function (s) { return '<span><i class="sim-punto s-' + esc(s.color) + '"></i>' + esc(s.nombre) + ' · ' + s.items.length + '</span>'; }).join('') + '</div>' +
      '<ul class="dx-lista"><li>' + ICONO.ok + '<span><b>Si fallas, el tutor te da una pista</b> y tienes otro intento. Así funciona el simulador.</span></li>' +
      '<li>' + ICONO.ok + '<span>Para tu puntaje cuenta lo que aciertas <b>a la primera</b>.</span></li>' +
      '<li>' + ICONO.ok + '<span>Puedes cerrar y seguir después: tu avance se guarda en este dispositivo.</span></li></ul>' +
      '<button class="btn tinta" id="b-go" style="width:100%;justify-content:center">Empezar ' + ICONO.fl + '</button>');
    document.getElementById('b-go').onclick = function () { guardar(K, run); pregunta(); };
  }
  function estadoDe(id) { return run.resp[id] || (run.resp[id] = { fase: 'r1', sel1: null, sel2: null }); }
  function ordenDe(id) { return run.orden[id] || (run.orden[id] = barajar([0, 1, 2, 3])); }
  function letras(txt, orden) { return rico(txt).replace(/\{([A-D])\}/g, function (_, L) { var i = orden.indexOf(LETRAS.indexOf(L)); return i < 0 ? L : LETRAS[i]; }); }

  function pregunta() {
    var x = lista[run.i], r = E.reactivos[x.id], st = estadoDe(x.id), orden = ordenDe(x.id);
    var texto = r.texto ? E.textos[r.texto] : null;
    var progreso = '<div class="sim-prog" role="progressbar" aria-valuemin="0" aria-valuemax="' + lista.length + '" aria-valuenow="' + (run.i + 1) + '" aria-label="Pregunta ' + (run.i + 1) + ' de ' + lista.length + '"><span style="width:' + Math.round(100 * run.i / lista.length) + '%"></span></div>';
    var cab = '<div class="sim-q-cab"><span>' + esc(x.sec.nombre) + ' · <b class="num">' + (run.i + 1) + '</b> de ' + lista.length + '</span><span class="sim-q-der"><span class="sim-tema">' + esc(E.temas[r.tema] || '') + '</span></span></div>';
    var primeraDelTexto = texto && (run.i === 0 || E.reactivos[lista[run.i - 1].id].texto !== r.texto);
    var lectura = texto ? '<details class="sim-texto"' + (primeraDelTexto || window.innerWidth >= 960 ? ' open' : '') + '><summary>' + ICONO.libro + '<span><b>' + esc(texto.titulo) + '</b><small>' + esc(texto.genero || '') + '</small></span></summary><div class="sim-texto-c' + (texto.verso ? ' verso' : '') + '">' +
      (texto.parrafos || []).map(function (p, i) { return '<p><span class="sim-np" aria-label="' + (texto.verso ? 'Estrofa ' : 'Párrafo ') + (i + 1) + '">' + (i + 1) + '</span>' + rico(p) + '</p>'; }).join('') + '</div></details>' : '';
    var tabla = r.tabla ? '<table class="sim-tabla"><thead><tr>' + r.tabla[0].map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + r.tabla.slice(1).map(function (f) { return '<tr>' + f.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '';
    var ops = '<div class="sim-ops" role="radiogroup" aria-label="Opciones">' + orden.map(function (o, i) {
      var cls = '', dis = st.fase === 'fin', marca = '';
      if (st.sel1 === o && o !== r.correcta) { cls = ' tachada'; dis = true; marca = ICONO.no; }
      if (st.fase === 'fin') { if (o === r.correcta) { cls = ' correcta'; marca = ICONO.ok; } else if (st.sel2 === o) { cls = ' mal'; marca = ICONO.no; } }
      return '<button type="button" class="sim-opc' + cls + '" role="radio" aria-checked="false" data-o="' + o + '"' + (dis ? ' disabled' : '') + '><span class="sim-letra">' + LETRAS[i] + '</span><span class="sim-opc-t">' + rico(r.opciones[o]) + '</span><span class="sim-marca">' + marca + '</span></button>';
    }).join('') + '</div>';
    var accion = st.fase === 'fin' ? '' : '<div class="sim-acc"><button class="btn tinta" id="b-conf" disabled>' + (st.fase === 'r2' ? 'Confirmar segundo intento' : 'Confirmar respuesta') + '</button></div>';
    h('<section class="sim-q' + (texto ? ' con-texto' : '') + '">' + progreso + cab + '<div class="sim-q-cols">' + lectura + '<div class="sim-q-main"><h3 class="sim-enun">' + rico(r.enunciado) + '</h3>' +
      (r.figura ? '<figure class="sim-fig">' + r.figura + '</figure>' : '') + tabla + ops + '<div id="tutor">' + tutor(r, st, orden) + '</div>' + accion + '</div></div></section>');
    var elegido = null, conf = document.getElementById('b-conf');
    caja.querySelectorAll('.sim-opc').forEach(function (b) {
      b.onclick = function () {
        caja.querySelectorAll('.sim-opc').forEach(function (y) { y.classList.remove('sel'); y.setAttribute('aria-checked', 'false'); });
        b.classList.add('sel'); b.setAttribute('aria-checked', 'true'); elegido = Number(b.dataset.o); if (conf) conf.disabled = false;
      };
    });
    if (conf) conf.onclick = function () { if (elegido != null) responder(r, st, elegido); };
    var sig = document.getElementById('b-sig');
    if (sig) sig.onclick = function () { run.i++; guardar(K, run); if (run.i >= lista.length) terminar(); else pregunta(); };
  }
  function responder(r, st, v) {
    if (st.fase === 'r1') { st.sel1 = v; st.ok1 = v === r.correcta; st.fase = st.ok1 ? 'fin' : 'r2'; }
    else if (st.fase === 'r2') { st.sel2 = v; st.ok2 = v === r.correcta; st.fase = 'fin'; }
    guardar(K, run);
    pregunta();
    var t = document.getElementById('tutor'); if (t && t.firstChild) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function tutor(r, st, orden) {
    if (st.fase === 'r1') return '';
    if (st.fase === 'r2') return '<div class="sim-tutor pista" role="status"><div class="sim-tutor-i">' + ICONO.foco + '</div><div><b>Todavía no. Pista del tutor</b><p>' + letras(r.pista, orden) + '</p><small>Tienes un intento más. Después te mostramos la solución completa.</small></div></div>';
    var ok1 = st.ok1, ok2 = st.ok2, ultimo = run.i >= lista.length - 1;
    var titulo = ok1 ? '¡Correcto a la primera!' : ok2 ? 'Bien, lo lograste en el segundo intento' : 'Esta era la respuesta correcta';
    var correcta = LETRAS[orden.indexOf(r.correcta)] + ') ' + r.opciones[r.correcta];
    return '<div class="sim-tutor ' + (ok1 || ok2 ? 'bien' : 'sol') + '" role="status"><div class="sim-tutor-i">' + (ok1 || ok2 ? ICONO.ok : ICONO.libro) + '</div><div>' +
      '<b>' + titulo + '</b><p class="sim-correcta">Respuesta: <b>' + rico(correcta) + '</b></p>' +
      '<details' + (ok1 ? '' : ' open') + '><summary>Solución paso a paso</summary><ol class="sim-pasos">' + (r.pasos || []).map(function (p) { return '<li>' + letras(p, orden) + '</li>'; }).join('') + '</ol>' +
      (r.regla ? '<div class="sim-regla"><span>La regla</span><p>' + letras(r.regla, orden) + '</p></div>' : '') + '</details></div></div>' +
      '<div class="sim-acc"><button class="btn tinta" id="b-sig">' + (ultimo ? 'Ver mi resultado' : 'Siguiente') + ' ' + ICONO.fl + '</button></div>';
  }

  // ---------- 4. resultado ----------
  function terminar() {
    h('<div class="sim-cargando"><span class="sim-giro" aria-hidden="true"></span>Calculando tu resultado…</div>');
    var resp = {};
    Object.keys(run.resp).forEach(function (id) { var s = run.resp[id]; resp[id] = { sel1: s.sel1, sel2: s.sel2 }; });
    api('terminar', { method: 'POST', body: { resp: resp } }).then(function (d) {
      guardar(K, null); E.resultado = d.resultado; resultado(d.resultado, true);
    }).catch(function (e) {
      h('<h2>No pudimos guardar tu resultado</h2><p class="dx-sub">' + esc(e.message) + '</p><button class="btn tinta" id="b-reint" style="width:100%;justify-content:center;margin-top:18px">Intentar de nuevo</button>');
      document.getElementById('b-reint').onclick = terminar;
    });
  }
  function nivel(R) {
    var p = R.total ? R.aciertos / R.total : 0;
    if (p >= .75) return 'Muy buen punto de partida. Ahora toca asegurar esos puntos con práctica y medirte con un examen completo.';
    if (p >= .45) return 'Tienes base, pero hay puntos claros por ganar. Con práctica dirigida en tus temas débiles se sube rápido.';
    return 'Hay mucho por ganar, y eso es buena noticia: practicando con tutor es donde más rápido se sube.';
  }
  function resultado(R, nuevo) {
    var secs = R.secciones || [];
    var nombreDe = function (id) { var s = secs.filter(function (x) { return x.id === id; })[0]; return s ? s.nombre : ''; };
    var num = R.escala === 'paa' ? '<span class="dx-num num">' + R.global + '<small> de 800</small></span>' : '<span class="dx-num num">' + R.global + '<small> de ' + R.de + ' aciertos</small></span>';
    var barras = secs.map(function (s) {
      var p = s.total ? Math.round(100 * s.aciertos / s.total) : 0;
      return '<div class="dx-barra' + (p < 50 ? ' bajo' : '') + '"><div><b>' + esc(s.nombre) + '</b><span class="num">' + s.aciertos + ' de ' + s.total + (R.escala === 'paa' ? ' · ' + s.puntaje : '') + '</span></div><i><span style="width:' + (nuevo ? 0 : p) + '%" data-p="' + p + '"></span></i></div>';
    }).join('');
    var P = (E && E.planes) || {}, paq = P.paquete, suma = P.practica && P.completo ? P.practica.precio_centavos + P.completo.precio_centavos : 0;
    var reforzar = R.reforzar ? nombreDe(R.reforzar) : '';
    var cta = '<div class="dx-cta"><span class="etiqueta">Tu siguiente paso</span><h3>Sube tu puntaje con el plan Completo</h3>' +
      '<p>' + (reforzar ? 'Empieza por <b style="color:#fff">' + esc(reforzar) + '</b>, donde más puntos puedes ganar. ' : '') + 'Practica sin límite con el mismo tutor y mídete como el día del examen.</p>' +
      '<ul><li>' + ICONO.ok + '<span>Simulacros y práctica por tema sin límite, con tutor</span></li><li>' + ICONO.ok + '<span>2 exámenes completos como el real: el primero, con tutor</span></li><li>' + ICONO.ok + '<span>Tu avance y tu puntaje en cada intento</span></li></ul>' +
      (paq ? '<div class="dx-precio"><b class="num">' + pesos(paq.precio_centavos) + '</b>' + (suma > paq.precio_centavos ? '<s class="num">' + pesos(suma) + '</s><em>Ahorras ' + pesos(suma - paq.precio_centavos) + '</em>' : '') + '</div>' : '') +
      '<a class="btn acento" href="' + D.ruta + '/?plan=paquete#comprar">Quiero el Completo ' + ICONO.fl + '</a><a class="dx-otro" href="' + D.ruta + '/#diferencias">Ver los 3 planes</a></div>';
    h('<div class="dx-res-cab"><span class="etiqueta">Tu diagnóstico ' + esc(D.examen) + '</span><p class="dx-sub" style="margin-top:10px">Hoy sacarías alrededor de</p>' + num +
      '<p class="dx-sub">Acertaste <b>' + R.aciertos + ' de ' + R.total + '</b> a la primera. ' + esc(nivel(R)) + '</p></div>' +
      '<div class="dx-barras">' + barras + '</div>' +
      '<p class="dx-nota">Es una estimación con ' + R.total + ' preguntas: el examen completo del simulador te da la medida real. ' + (nuevo ? 'También te lo mandamos a tu correo.' : '') + '</p>' + cta);
    if (nuevo) setTimeout(function () { caja.querySelectorAll('.dx-barra i span').forEach(function (s) { s.style.width = s.dataset.p + '%'; }); }, 60);
  }

  // ---------- arranque: si ya tiene su cookie, sigue donde iba ----------
  api('estado').then(listo).catch(function () { formulario(); });
})();
