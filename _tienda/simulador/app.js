// Simuladores de examen (PAA, UNAM, ECOEMS) · cliente. Sin dependencias. La configuración del examen llega en api/banco.
// Se empaqueta dentro del Worker con: python3 _tienda/simulador/construir.py
(function () {
  'use strict';
  var SIM = window.SIM || {};
  var app = document.getElementById('app');
  var barra = document.getElementById('barra-der');
  var B = null;            // banco: { config, secciones, examen, calentamiento, areas, temas, textos, reactivos }
  var CFG = { examen: 'PAA', escala: 'paa', examenReactivos: 175, examenHoras: 3, globalSecciones: ['lectura', 'redaccion', 'matematicas'], oficial: 'College Board' };
  var APP = SIM.app || 'simulador-paa', RUTA = SIM.ruta || '/simulador-paa';
  var R = {};              // reactivos por id
  var YO = { historial: [] };
  var run = null;          // simulacro en curso (se guarda en localStorage para retomarlo)
  var reloj = null;
  var PESO = { 1: 1, 2: 1.25, 3: 1.5 };
  var LETRAS = ['A', 'B', 'C', 'D'];
  // Llaves de localStorage por cuenta (se completan al saber quién entró): dos personas en el mismo dispositivo no se mezclan
  var K_RUN, K_META, K_PEND, K_VISTOS, K_SPARKS, K_AREA;
  function llaves(email) {
    var h = 0; String(email || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
    var x = ':' + h.toString(36);
    var p = APP === 'simulador-paa' ? 'vk_paa' : 'vk_' + APP.replace('simulador-', '');
    K_RUN = p + '_run' + x; K_META = p + '_meta' + x; K_PEND = p + '_pendiente' + x; K_VISTOS = p + '_vistos' + x; K_SPARKS = p + '_sparks' + x; K_AREA = p + '_area' + x;
  }

  // ---------- utilidades ----------
  function guardar(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function leer(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Texto del banco: escapado, **negritas** y saltos de línea
  function rico(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function barajar(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function minutos(s) { var m = Math.round(s / 60); return m < 1 ? 'menos de 1 min' : m + ' min'; }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function esPAA() { return CFG.escala === 'paa'; }
  // Rango del puntaje global y de la meta: PAA 200–800; por aciertos, 0 al total del examen
  function rango() { return esPAA() ? { min: 200, max: 800 } : { min: 0, max: CFG.examenReactivos }; }
  function meta() { var m = leer(K_META); return m && m >= rango().min && m <= rango().max ? m : (CFG.meta && CFG.meta.inicial) || 600; }
  function unidad(n) { return esPAA() ? n + ' pts' : n + '/' + CFG.examenReactivos; }
  // Meta expresada en la escala de cada sección (PAA: 200–800; aciertos: porcentaje)
  function metaSec() { return esPAA() ? meta() : Math.round(100 * meta() / CFG.examenReactivos); }
  // Área (UNAM): la elige el estudiante; el examen se arma con su distribución
  function areas() { return B.areas || null; }
  function areaActual() { var a = areas(); if (!a) return null; var x = leer(K_AREA); return a.some(function (y) { return y.id === x; }) ? x : a[0].id; }
  function infoArea() { var a = areas(), id = areaActual(); if (!a) return null; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return a[0]; }
  function seccion(id) { for (var i = 0; i < B.secciones.length; i++) if (B.secciones[i].id === id) return B.secciones[i]; return { id: id, nombre: 'Práctica', minutos: 0, reactivos: 0 }; }
  function h(html) { app.innerHTML = html; app.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  function api(ruta, op) {
    return fetch('/api/' + APP + '/' + ruta, Object.assign({ credentials: 'same-origin', headers: { 'content-type': 'application/json' } }, op || {}))
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw Object.assign(new Error(d.error || 'Algo falló'), { status: r.status, datos: d }); return d; }); });
  }
  function fecha(iso) { try { return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  var ICONO = {
    reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    foco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    libro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
  };
  var FL = SIM.flecha || '→';

  // ---------- arranque ----------
  function iniciar() {
    Promise.all([api('banco'), api('yo')]).then(function (res) {
      B = res[0]; YO = res[1]; if (B.config) CFG = B.config;
      llaves(YO.email);
      // Resultado que no se pudo guardar por falta de conexión: se manda ahora
      var pend = leer(K_PEND);
      if (pend) api('resultados', { method: 'POST', body: JSON.stringify(pend) }).then(function () { guardar(K_PEND, null); }, function (e) { if (e.status) guardar(K_PEND, null); });
      B.reactivos.forEach(function (r) { R[r.id] = r; });
      run = leer(K_RUN);
      if (run && (!run.secciones || run.v !== 1)) { run = null; guardar(K_RUN, null); }
      pintarBarra();
      inicio();
    }).catch(function (e) {
      if (e.status === 401) { location.reload(); return; }
      h('<section class="sim-vacio"><h1>No pudimos cargar el simulador</h1><p>Revisa tu conexión e inténtalo de nuevo.</p><button class="btn tinta" id="reint">Reintentar</button></section>');
      document.getElementById('reint').onclick = function () { location.reload(); };
    });
  }

  function pintarBarra(tiempo) {
    if (tiempo) { barra.innerHTML = tiempo; return; }
    barra.innerHTML = '<button class="sim-link" id="b-salir" type="button">Cerrar sesión</button>';
    document.getElementById('b-salir').onclick = function () {
      if (!confirm('¿Cerrar sesión en este dispositivo? Para volver a entrar necesitarás el enlace de tu correo de compra.')) return;
      api('salir', { method: 'POST' }).finally(function () { location.reload(); });
    };
  }

  // ---------- armar simulacros ----------
  // Reactivos ya vistos (simulacros completos del servidor + prácticas en este dispositivo): se dejan para el final
  function vistos() {
    var v = {}; (YO.vistos || []).concat(leer(K_VISTOS) || []).forEach(function (id) { v[id] = 1; }); return v;
  }
  function marcarVistos(ids) { var v = vistos(); ids.forEach(function (id) { v[id] = 1; }); guardar(K_VISTOS, Object.keys(v)); }
  function porTema(lista, n) {
    var grupos = {}, v = vistos();
    barajar(lista).forEach(function (r) { (grupos[r.tema] = grupos[r.tema] || []).push(r); });
    Object.keys(grupos).forEach(function (t) { grupos[t].sort(function (a, b) { return (v[a.id] || 0) - (v[b.id] || 0); }); });
    var temas = barajar(Object.keys(grupos)), out = [];
    while (out.length < n && temas.some(function (t) { return grupos[t].length; }))
      temas.forEach(function (t) { if (out.length < n && grupos[t].length) out.push(grupos[t].shift()); });
    return out.sort(function (a, b) { return a.dificultad - b.dificultad; });
  }
  function delTexto(id) { return B.reactivos.filter(function (r) { return r.texto === id; }); }
  // Lecturas de la sección, las menos vistas primero
  function textosDe(sid, tipo) {
    var v = vistos(), visto = function (k) { return delTexto(k).filter(function (r) { return v[r.id]; }).length; };
    return barajar(Object.keys(B.textos).filter(function (k) { return B.textos[k].seccion === sid && (!tipo || B.textos[k].tipo === tipo); }))
      .sort(function (a, b) { return visto(a) - visto(b); });
  }
  function armarSeccion(sid) {
    var s = seccion(sid), sueltos = B.reactivos.filter(function (r) { return r.seccion === sid && !r.texto; }), items;
    if (sid === 'lectura') {
      items = delTexto(textosDe(sid, 'literario')[0]).concat(delTexto(textosDe(sid, 'no_literario')[0]));
      // Igual que en el servidor (armar.js): si las dos lecturas pasan del número de reactivos de la sección,
      // va una sola y se completa con vocabulario suelto (antes podían salir 18 preguntas para 14 minutos).
      if (items.length > s.reactivos) {
        items = delTexto(textosDe(sid, Math.random() < 0.5 ? 'literario' : 'no_literario')[0]).slice(0, s.reactivos);
        items = items.concat(porTema(sueltos, s.reactivos - items.length));
      }
    }
    else if (textosDe(sid).length) {
      // Materia con lecturas (inglés de la PAA; Español o Literatura): una lectura que quepa y el resto sueltos
      var lect = delTexto(textosDe(sid).filter(function (k) { return delTexto(k).length <= s.reactivos; })[0] || '');
      items = porTema(sueltos, s.reactivos - lect.length).concat(lect);
    }
    else items = porTema(sueltos, s.reactivos);
    return { id: sid, items: items.map(function (r) { return r.id; }), idx: 0, limite: s.minutos * 60, usado: 0, cerrada: false };
  }
  function nuevoRun(modo, secs) {
    var r = { v: 1, modo: modo, secciones: secs, actual: 0, resp: {}, orden: {}, inicio: new Date().toISOString(), fase: 'intro' };
    secs.forEach(function (s) { s.items.forEach(function (id) {
      var x = R[id]; if (x.opciones) r.orden[id] = x.fijo ? [0, 1, 2, 3] : barajar([0, 1, 2, 3]);
    }); });
    return r;
  }
  function empezar(modo, arg) {
    if (modo === 'examen' && !tieneExamen()) return comprarPlan('completo');
    if (modo !== 'examen' && !puedePracticar()) return comprarPlan('practica');
    if (esIntento(modo)) return empezarCompleto(modo);
    var secs = modo === 'seccion' ? [armarSeccion(arg)] : [armarPractica(arg)];
    run = nuevoRun(modo, secs); guardar(K_RUN, run); introSeccion();
  }
  // El simulacro corto y el examen completo gastan 1 intento: los abre el servidor (o retoma el que esté abierto, aunque sea de otro dispositivo)
  function empezarCompleto(modo) {
    modo = modo === 'examen' || modo === 'calentamiento' ? modo : 'completo';
    var it = cuentaDe(modo), ex = modo === 'examen', ca = modo === 'calentamiento', uno = it.disponibles === 1;
    var nombre = ex ? 'examen completo' : ca ? 'calentamiento' : 'simulacro de nivel Medio', cuantos = it.disponibles + ' ' + (ex ? (uno ? 'examen completo disponible' : 'exámenes completos disponibles') : ca ? (uno ? 'calentamiento disponible' : 'calentamientos disponibles') : (uno ? 'simulacro Medio disponible' : 'simulacros Medios disponibles'));
    if (!it.abierto) {
      if (it.disponibles <= 0) return comprar(modo);
      if (!confirm('Este ' + nombre + ' usa 1 de tus ' + cuantos + '. Aunque no lo termines, el intento cuenta.' + (ex && it.tutorSiguiente ? ' Este primero va con tutor: si fallas, te da una pista y el reloj se pausa mientras la lees.' : '') + (ex ? ' Son ' + exTotales().reactivos + ' reactivos y ' + horas(exTotales().minutos) + ', como el examen real' + (infoArea() ? ' (' + infoArea().nombre + ')' : '') + '; puedes pausar y seguir después.' : '') + ' ¿Empezar?')) return;
    }
    api('iniciar', { method: 'POST', body: JSON.stringify({ tipo: ex ? 'examen' : ca ? 'calentamiento' : 'corto', area: areaActual() }) }).then(function (d) {
      if (ex) YO.examenes = d.intentos; else if (ca) YO.calentamientos = d.intentos; else YO.intentos = d.intentos;
      // Las secciones vienen del servidor cuando dependen del área (UNAM); si no, son las fijas del banco (PAA)
      var base = d.secciones || (ex ? B.examen : ca ? B.calentamiento : B.secciones);
      var secs = base.map(function (s, i) { return { id: s.id, items: d.items[i], idx: 0, limite: s.minutos * 60, usado: 0, cerrada: false }; });
      run = nuevoRun(modo, secs); run.intento = d.id; run.area = areaActual(); if (ex && d.tutor) run.conTutor = true; else if (ex) run.sinTutor = true; guardar(K_RUN, run); introSeccion();
    }).catch(function (e) {
      if (e.status === 402) { var c = (e.datos || {}).intentos; if (c) { if (ex) YO.examenes = c; else if (ca) YO.calentamientos = c; else YO.intentos = c; } comprar(modo); }
      else alert(e.message || 'No pudimos abrir el simulacro. Revisa tu conexión.');
    });
  }
  function descartar() {
    var id = run && esIntento(run.modo) ? run.intento : null;
    run = null; guardar(K_RUN, null);
    if (!id) return inicio();
    api('abandonar', { method: 'POST', body: JSON.stringify({ id: id }) }).then(function (d) { YO.intentos = d.intentos; YO.examenes = d.examenes; if (d.calentamientos) YO.calentamientos = d.calentamientos; }).finally(inicio);
  }

  function suma(l, k) { return (l || []).reduce(function (a, s) { return a + (s[k] || 0); }, 0); }
  function exTotales() { var a = infoArea(); return a ? a.examen : { reactivos: suma(B.examen, 'reactivos'), minutos: suma(B.examen, 'minutos') }; }
  function medioTotales() { var a = infoArea(); return a ? a.medio : { reactivos: suma(B.secciones, 'reactivos'), minutos: suma(B.secciones, 'minutos') }; }
  function calTotales() { var a = infoArea(); return a ? a.calentamiento : { reactivos: suma(B.calentamiento, 'reactivos'), minutos: suma(B.calentamiento, 'minutos') }; }
  function horas(min) { var h = min / 60; return (h === Math.floor(h) ? h : h.toFixed(1)) + (h === 1 ? ' hora' : ' horas'); }

  // ---------- comprar simulacros adicionales ----------
  function precio(c) { return '$' + (c / 100).toLocaleString('es-MX') + ' MXN'; }
  function comprar(modo) {
    if (modo === 'examen' && !tieneExamen()) return comprarPlan('completo');
    if (modo !== 'examen' && !puedePracticar()) return comprarPlan('practica');
    detenerReloj(); pintarBarra();
    if (modo === 'calentamiento') { h('<section class="sim-intro"><span class="sim-paso">Nivel Calentamiento</span><h1>Ya usaste tus calentamientos</h1><p class="sim-lead">¡Bien! Ya estás listo para subir de nivel: sigue con el simulacro de nivel Medio. La práctica por sección y por temas sigue sin límite.</p><div class="botones"><button class="btn tinta" id="b-medio">Ir al nivel Medio</button><button class="btn blanco" id="b-inicio">Volver al inicio</button></div></section>'); document.getElementById('b-inicio').onclick = inicio; document.getElementById('b-medio').onclick = function () { empezarCompleto('completo'); }; return; }
    var ex = modo === 'examen', x = ex ? YO.examenExtra : YO.intentoExtra, it = cuentaDe(ex ? 'examen' : 'completo');
    var que = ex ? 'exámenes completos' : 'simulacros de nivel Medio', uno = ex ? 'examen completo adicional' : 'simulacro Medio adicional';
    if (!x) { h('<section class="sim-intro"><h1>Ya usaste tus ' + que + '</h1><p class="sim-lead">Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> para conseguir más intentos. Mientras tanto, puedes seguir practicando por sección sin límite.</p><div class="botones"><button class="btn tinta" id="b-inicio">Volver al inicio</button></div></section>'); document.getElementById('b-inicio').onclick = inicio; return; }
    h('<section class="sim-intro sim-comprar"><span class="sim-paso">' + (ex ? 'Nivel 3 · examen completo' : 'Nivel Medio') + '</span>' +
      '<h1>' + (it.disponibles ? 'Suma más ' + que : 'Ya usaste tus ' + (it.incluidos || (ex ? 1 : 2)) + ' ' + que) + '</h1>' +
      '<p class="sim-lead">Cada ' + uno + ' cuesta <b>' + precio(x.precio_centavos) + '</b> y queda disponible en cuanto se confirma tu pago.' + (ex ? ' Son ' + exTotales().reactivos + ' reactivos y ' + horas(exTotales().minutos) + ', como el examen real, con preguntas que priorizan lo que no has visto.' : '') + ' La práctica por sección y por temas sigue sin límite.</p>' +
      '<form class="sim-card sim-compra" id="f-compra">' +
        '<div class="sim-cant"><span>¿Cuántos quieres?</span><div class="sim-cant-c"><button type="button" id="c-menos" aria-label="Uno menos">−</button><b class="num" id="c-n" aria-live="polite">1</b><button type="button" id="c-mas" aria-label="Uno más">+</button></div></div>' +
        '<div class="sim-total"><span>Total</span><b class="num" id="c-total">' + precio(x.precio_centavos) + '</b></div>' +
        '<label class="sim-casilla"><input type="checkbox" id="c-term" required><span>Acepto los <a href="/legal/terminos/" target="_blank" rel="noopener">términos y condiciones</a> y el <a href="/privacidad/" target="_blank" rel="noopener">aviso de privacidad</a>.</span></label>' +
        '<p class="sim-nota">Se carga a la cuenta de ' + esc(YO.email) + '. Pagas con tarjeta, OXXO o SPEI.</p>' +
        '<p class="sim-error" id="c-error" role="alert" hidden></p>' +
        '<button class="btn tinta" id="c-pagar">Ir a pagar ' + FL + '</button>' +
      '</form>' +
      '<div class="botones"><button class="btn blanco" id="b-inicio">Volver al inicio</button></div></section>');
    var n = 1, out = document.getElementById('c-n'), tot = document.getElementById('c-total');
    function pinta() { out.textContent = n; tot.textContent = precio(n * x.precio_centavos); }
    document.getElementById('c-menos').onclick = function () { n = Math.max(1, n - 1); pinta(); };
    document.getElementById('c-mas').onclick = function () { n = Math.min(10, n + 1); pinta(); };
    document.getElementById('b-inicio').onclick = inicio;
    document.getElementById('f-compra').onsubmit = function (e) {
      e.preventDefault();
      var err = document.getElementById('c-error'), btn = document.getElementById('c-pagar');
      if (!document.getElementById('c-term').checked) { err.textContent = 'Acepta los términos para continuar.'; err.hidden = false; return; }
      btn.disabled = true; btn.textContent = 'Abriendo el pago…'; err.hidden = true;
      fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ slug: x.slug, cantidad: n }], nombre: YO.nombre, email: YO.email, terminos: true }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.url) throw new Error(d.error || 'No pudimos abrir el pago.'); location.href = d.url; }); })
        .catch(function (e2) { err.textContent = e2.message; err.hidden = false; btn.disabled = false; btn.innerHTML = 'Ir a pagar ' + FL; });
    };
  }
  // Práctica: hasta 10 reactivos de los temas pedidos; primero los que fallaste, luego los que no has visto
  function armarPractica(temas) {
    var ultimo = YO.historial[0] || {}, fallados = {}, visto = vistos();
    YO.historial.forEach(function (x) { (x.fallados || []).forEach(function (id) { fallados[id] = 1; }); });
    var cand = barajar(B.reactivos.filter(function (r) { return temas.indexOf(r.tema) >= 0; }));
    cand.sort(function (a, b) { return (fallados[b.id] || 0) - (fallados[a.id] || 0) || (visto[a.id] || 0) - (visto[b.id] || 0); });
    var items = porTema(cand.slice(0, Math.max(10, temas.length * 3)), 10);
    void ultimo;
    return { id: 'practica', temas: temas, items: items.map(function (r) { return r.id; }), idx: 0, limite: 0, usado: 0, cerrada: false };
  }

  // ---------- inicio ----------
  function ultimoCompleto() { for (var i = 0; i < YO.historial.length; i++) if (esIntento(YO.historial[i].modo)) return YO.historial[i]; return null; }
  function inicio() {
    detenerReloj(); pintarBarra();
    var u = ultimoCompleto(), m = meta();
    var totalR = medioTotales().reactivos, totalM = medioTotales().minutos;
    var retomar = run && run.fase !== 'fin' ? '<div class="sim-aviso"><div><b>Tienes un simulacro sin terminar.</b><span>' + esc(nombreModo(run)) + ' · ' + contestadas(run) + ' de ' + totalItems(run) + ' respondidas</span></div><div class="botones"><button class="btn tinta chico" id="b-ret">Continuar</button><button class="btn blanco chico" id="b-desc">Descartar</button></div></div>' : '';
    var resumen = u ? tarjetaResumen(u) : '<div class="sim-card sim-primera"><span class="etiqueta">Tu punto de partida</span><h2>Haz tu primer simulacro completo</h2><p>Con él calculamos tu ' + (esPAA() ? 'puntaje estimado por sección' : 'número de aciertos estimado por materia') + ', tu nivel de confianza y los temas exactos que debes reforzar.</p></div>';
    var debiles = u ? temasDebiles(u.temas, 3) : [];
    var it = cuentaDe('completo'), ie = cuentaDe('examen'), ic = cuentaDe('calentamiento');
    // Si el intento de este dispositivo ya se cerró en otro, se descarta aquí
    if (run && esIntento(run.modo) && (!cuentaDe(run.modo).abierto || cuentaDe(run.modo).abierto.id !== run.intento)) { run = null; guardar(K_RUN, null); retomar = ''; }
    var abiertoSrv = !run && (ie.abierto ? 'examen' : it.abierto ? 'completo' : ic.abierto ? 'calentamiento' : null);
    if (abiertoSrv) retomar = '<div class="sim-aviso"><div><b>Tienes ' + (abiertoSrv === 'examen' ? 'un examen completo' : abiertoSrv === 'calentamiento' ? 'un calentamiento' : 'un simulacro de nivel Medio') + ' abierto.</b><span>Lo empezaste en otro dispositivo o no lo terminaste. Puedes retomarlo sin gastar otro intento (las respuestas empiezan de cero).</span></div><div class="botones"><button class="btn tinta chico" id="b-ret-srv">Retomar</button></div></div>';
    var cajaIntentos = function (c, txt, extra, id) {
      if (c.ilimitado) return '<div class="sim-intentos ilimitado"><div><b class="num" aria-hidden="true">∞</b><span>' + esc(txt.replace(/ disponibles?$/, '')) + ' ilimitados con tu Práctica</span></div></div>';
      return '<div class="sim-intentos' + (c.disponibles ? '' : ' agotados') + '"><div><b class="num">' + c.disponibles + '</b><span>de ' + c.incluidos + ' ' + txt + '</span></div>' +
        (extra ? '<button class="btn ' + (c.disponibles ? 'blanco' : 'tinta') + ' chico" id="' + id + '">Comprar más · ' + precio(extra.precio_centavos) + ' c/u</button>' : '') + '</div>';
    };
    var intentos = cajaIntentos(it, 'simulacros Medios disponibles', YO.intentoExtra, 'b-comprar');
    var intentosEx = cajaIntentos(ie, ie.incluidos === 1 ? 'examen completo disponible' : 'exámenes completos disponibles', YO.examenExtra, 'b-comprar-ex');
    var intentosCa = cajaIntentos(ic, 'calentamientos disponibles', null, '');
    var caR = calTotales().reactivos, caM = calTotales().minutos, exR = exTotales().reactivos, exM = exTotales().minutos;
    var hayCal = !!(B.calentamiento || infoArea()), hayExamen = !!(B.examen || infoArea());
    // UNAM: el examen se arma con la distribución del área (cambia el peso de cada materia)
    var selArea = areas() ? '<div class="sim-card sim-area"><span class="etiqueta">Tu área</span><p class="sim-nota">El examen y los simulacros se arman con las materias y el peso de tu área.</p><div class="sim-area-ops" role="radiogroup" aria-label="Elige tu área">' +
      areas().map(function (a) { return '<button type="button" class="sim-chip-area' + (a.id === areaActual() ? ' sel' : '') + '" role="radio" aria-checked="' + (a.id === areaActual()) + '" data-area="' + a.id + '"><b>Área ' + a.id + '</b><small>' + esc(a.corto) + '</small></button>'; }).join('') + '</div></div>' : '';
    // Computadora: dos columnas (practicar a la izquierda; tu estado, meta y banco a la derecha).
    // Celular: una sola columna; el orden lo dan las clases o-* (las columnas se vuelven display: contents).
    h(
      '<section class="sim-hola"><div><span class="etiqueta">Simulador ' + esc(CFG.examen) + '</span><h1>Hola' + (SIM.nombre ? ', ' + esc(SIM.nombre) : '') + '</h1><p>Practica con tiempo real. Si fallas, el tutor te guía para intentarlo de nuevo.</p></div></section>' +
      retomar +
      '<div class="sim-home">' +
        '<div class="sim-col sim-col-main">' +
          '<section class="o-4">' + selArea + '<h2 class="sim-h2 sim-h2-top">Sube de nivel</h2><p class="sim-nota" style="margin-top:-4px">Empieza en Calentamiento, entrena en Medio y cierra con el examen completo, que tiene la dificultad y el tiempo del examen real.</p>' +
          (!puedePracticar() ? tarjetaPlan('practica', 'Llega al examen con práctica de sobra') : '') +
          (puedePracticar() && hayCal ? '<button class="sim-op sim-op-grande sim-op-nivel" data-modo="calentamiento"><span class="sim-op-t"><span class="sim-op-tag n1">Nivel 1 · para entrar en ritmo</span><b>Calentamiento</b><small>' + caR + ' reactivos · ' + caM + ' minutos · preguntas de dificultad básica e intermedia · con tutor</small></span><span class="sim-op-f">' + FL + '</span></button>' + intentosCa : '') +
          (puedePracticar() ? '<button class="sim-op sim-op-grande sim-op-nivel" data-modo="completo"><span class="sim-op-t"><span class="sim-op-tag n2">Nivel 2 · para ya estar bien</span><b>Medio</b><small>' + totalR + ' reactivos · ' + totalM + ' minutos · la mayoría de dificultad alta, como el examen real · con tutor</small></span><span class="sim-op-f">' + FL + '</span></button>' + intentos : '') +
          (hayExamen && !tieneExamen() ? tarjetaPlan('completo', 'Cuando estés listo, mídete con el examen real') : '') +
          (hayExamen && tieneExamen() ? '<button class="sim-op sim-op-grande sim-op-examen" data-modo="examen"><span class="sim-op-t"><span class="sim-op-tag">Nivel 3 · como el examen real</span><b>Examen ' + esc(CFG.examen) + ' completo</b><small>' + exR + ' reactivos · ' + horas(exM) + ' · ' + (infoArea() ? 'las materias de tu área con su peso' : 'las ' + B.examen.length + (esPAA() ? ' secciones' : ' materias') + ' cronometradas y con la dificultad del examen') + (ie.tutorSiguiente || (ie.abierto && ie.abierto.tutor) ? ' · <b>el primero, con tutor</b>: si fallas te da una pista, para que veas cómo es el examen sin presión. El segundo, sin pistas como el día del examen' : ' · sin pistas, la revisión va al final') + '</small></span><span class="sim-op-f">' + FL + '</span></button>' + intentosEx : '') +
          (puedePracticar() ? '<p class="sim-nota sim-libre">Práctica libre, sin gastar intentos:</p>' +
          '<div class="sim-secs">' + B.secciones.map(function (s) {
            return '<button class="sim-op" data-modo="seccion" data-sec="' + s.id + '"><span class="sim-punto s-' + s.color + '"></span><span class="sim-op-t"><b>' + esc(s.nombre) + '</b><small>' + s.reactivos + ' reactivos · ' + s.minutos + ' min</small></span><span class="sim-op-f">' + FL + '</span></button>';
          }).join('') + '</div>' : '') +
          (puedePracticar() && debiles.length ? '<button class="sim-op sim-op-practica" data-modo="practica" data-temas="' + debiles.map(function (t) { return t.id; }).join(',') + '"><span class="sim-op-i">' + ICONO.foco + '</span><span class="sim-op-t"><b>Practicar mis temas débiles</b><small>' + esc(debiles.map(function (t) { return t.nombre; }).join(' · ')) + '</small></span><span class="sim-op-f">' + FL + '</span></button>' : '') +
          '</section>' +
          '<section class="o-5">' + historial() + '</section>' +
        '</div>' +
        '<aside class="sim-col sim-col-lado">' +
          '<div class="o-1">' + resumen + '</div>' +
          (esPAA() ? '<div class="o-2 sim-card sim-meta"><span class="etiqueta">Tu meta por sección</span><div class="sim-meta-v"><b class="num" id="meta-v">' + m + '</b><small>de 800</small></div>' +
            '<input type="range" id="meta" min="400" max="800" step="10" value="' + m + '" aria-label="Meta de puntaje por sección (200 a 800)">' +
            '<p class="sim-nota">La PAA califica cada sección de 200 a 800. Pregunta en tu universidad el puntaje que piden y ajústalo aquí.</p></div>'
          : '<div class="o-2 sim-card sim-meta"><span class="etiqueta">Tu meta de aciertos</span><div class="sim-meta-v"><b class="num" id="meta-v">' + m + '</b><small>de ' + CFG.examenReactivos + '</small></div>' +
            '<input type="range" id="meta" min="' + CFG.meta.min + '" max="' + CFG.meta.max + '" step="' + CFG.meta.paso + '" value="' + m + '" aria-label="Meta de aciertos (de ' + CFG.examenReactivos + ')">' +
            '<p class="sim-nota">' + esc(CFG.metaNota || 'Se entra por número de aciertos hasta llenar el cupo de cada carrera. Revisa los aciertos de concursos anteriores de la tuya y ponlos aquí.') + '</p></div>') +
          '<div class="o-3">' + bancoHTML() + '</div>' +
          '<div class="o-6">' + compartirHTML() + regaloHTML() + '</div>' +
          '<div class="o-7">' + sparks('inicio') + '</div>' +
        '</aside>' +
      '</div>'
    );
    app.querySelectorAll('[data-area]').forEach(function (b) { b.onclick = function () { guardar(K_AREA, b.dataset.area); inicio(); }; });
    var r = document.getElementById('meta');
    r.oninput = function () { document.getElementById('meta-v').textContent = r.value; };
    r.onchange = function () { guardar(K_META, Number(r.value)); };
    app.querySelectorAll('[data-modo]').forEach(function (b) {
      b.onclick = function () {
        if (run && run.fase !== 'fin') {
          if (b.dataset.modo === run.modo && esIntento(run.modo)) return continuar();
          if (!confirm(esIntento(run.modo) ? 'Tienes ' + (run.modo === 'examen' ? 'un examen completo' : run.modo === 'calentamiento' ? 'un calentamiento' : 'un simulacro') + ' sin terminar. Si empiezas otra práctica lo pierdes y el intento ya cuenta. ¿Continuar?' : 'Tienes una práctica sin terminar. ¿Empezar otra y descartarla?')) return;
          if (esIntento(run.modo)) { var id = run.intento; run = null; guardar(K_RUN, null); api('abandonar', { method: 'POST', body: JSON.stringify({ id: id }) }).then(function (d) { YO.intentos = d.intentos; YO.examenes = d.examenes; if (d.calentamientos) YO.calentamientos = d.calentamientos; }); }
        }
        empezar(b.dataset.modo, b.dataset.modo === 'practica' ? b.dataset.temas.split(',') : b.dataset.sec);
      };
    });
    if (retomar) {
      var bd = document.getElementById('b-desc');
      if (bd) bd.onclick = function () { if (confirm(esIntento(run.modo) ? '¿Descartar ' + (run.modo === 'examen' ? 'el examen completo' : 'el simulacro') + '? El intento ya cuenta y no se recupera.' : '¿Descartar la práctica sin terminar?')) descartar(); };
      var bs = document.getElementById('b-ret-srv'); if (bs) bs.onclick = function () { empezarCompleto(abiertoSrv); };
      var br = document.getElementById('b-ret'); if (br) br.onclick = continuar;
    }
    var bc = document.getElementById('b-comprar'); if (bc) bc.onclick = function () { comprar('completo'); };
    var bce = document.getElementById('b-comprar-ex'); if (bce) bce.onclick = function () { comprar('examen'); };
    app.querySelectorAll('[data-plan]').forEach(function (b) { b.onclick = function () { comprarPlan(b.dataset.plan); }; });
    app.querySelectorAll('[data-hist]').forEach(function (b) { b.onclick = function () { reporte(YO.historial[Number(b.dataset.hist)], true); }; });
    conectarSparks();
  }
  // Tamaño del banco y cuánto ha visto el estudiante (los simulacros completos priorizan lo no visto)
  function bancoHTML() {
    var total = B.reactivos.length, v = vistos(), n = B.reactivos.filter(function (r) { return v[r.id]; }).length;
    return '<div class="sim-banco"><div class="sim-banco-t"><b class="num">' + total + '</b><span>reactivos en el banco · cada simulacro completo te trae preguntas que no has visto</span></div>' +
      '<div class="sim-banco-p" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + n + '" aria-label="Reactivos vistos"><span style="width:' + pct(n, total) + '%"></span></div>' +
      '<small>' + (n ? 'Has visto ' + n + ' de ' + total + ' (' + pct(n, total) + ' %)' : 'Aún no has visto ninguno: todo es nuevo para ti') + '</small></div>';
  }
  // Programa de puntos: comparte tu liga y gana del 10 % al 30 % de cada compra en puntos (se canjean en la tienda); tu amigo
  // tiene 5 % de descuento en su primer pago (src/puntos-reglas.js y src/descuentos.js)
  function compartirHTML() {
    return '<a class="sim-regalo sim-compartir" href="/tienda/puntos/"><span class="sim-regalo-i" aria-hidden="true">🤝</span><span><b>Comparte el simulador y gana</b><small>Por cada amigo que lo compre con tu liga ganas del 10 % al 30 % de lo que pagó en puntos para la tienda Vorka, y tu amigo tiene 5 % de descuento en su primer pago.</small></span><span class="sim-op-f">' + FL + '</span></a>';
  }
  // Regalar: abre la ficha de la tienda (con sesión, /simulador-paa/ muestra la app y no la página de venta)
  function regaloHTML() {
    return '<a class="sim-regalo" href="' + esc(CFG.regalo || '/tienda/simulador-paa/?regalo=1#comprar') + '"><span class="sim-regalo-i" aria-hidden="true">🎁</span><span><b>¿Conoces a alguien que va a presentar?</b><small>Regálale el simulador: le llega una liga de un solo uso con tu mensaje.</small></span><span class="sim-op-f">' + FL + '</span></a>';
  }
  // Niveles: 'calentamiento' · 'completo' = Medio · 'examen' = Oficial (examen completo). Los tres gastan intento.
  function esIntento(m) { return m === 'completo' || m === 'examen' || m === 'calentamiento'; }
  function cuentaDe(m) { return (m === 'examen' ? YO.examenes : m === 'calentamiento' ? YO.calentamientos : YO.intentos) || { incluidos: 0, disponibles: 0 }; }
  // Planes: practica (Calentamientos, Medios y práctica sin límite), completo (exámenes completos) o la compra de antes (legado)
  function plan() { return YO.plan || { legado: true }; }
  function puedePracticar() { var p = plan(); return !!(p.practica || p.legado); }
  function tieneExamen() { var e = cuentaDe('examen'); return !!(e.incluidos || e.usados || e.abierto); }
  // Textos de los planes (con el tamaño del examen de este simulador)
  function planInfo(k) {
    var ex = exTotales();
    return {
      practica: { nombre: 'Práctica', lead: 'Entrena todos los días antes de tu examen: Calentamientos, simulacros Medios y práctica por ' + (esPAA() ? 'sección' : 'materia') + ' y por tema, sin límite y con tutor.', trae: ['Calentamientos y simulacros Medios sin límite', 'Práctica por ' + (esPAA() ? 'sección' : 'materia') + ' y por tema', 'Tutor con pistas y explicación paso a paso'] },
      completo: { nombre: 'Examen', lead: 'Mídete como el día del examen: 2 exámenes completos con la misma cantidad de preguntas, el tiempo y la dificultad del examen ' + CFG.examen + ' real.', trae: ['2 exámenes completos: ' + ex.reactivos + ' reactivos en ' + horas(ex.minutos), 'El 1.º con tutor para entrenar; el 2.º sin pistas, como el día del examen', 'Reporte de preparación por ' + (esPAA() ? 'sección' : 'materia')] }
    }[k];
  }

  function tarjetaPlan(k, titulo) {
    var o = (YO.ofertas || {})[k], i = planInfo(k);
    return '<div class="sim-card sim-plan-up"><span class="sim-op-tag ' + (k === 'completo' ? 'n3' : 'n2') + '">' + i.nombre + '</span><h3>' + titulo + '</h3><p>' + i.lead + '</p>' +
      (o ? '<button class="btn tinta" data-plan="' + k + '">Desbloquear · ' + precio(o.precio_centavos) + '</button>' : '<p class="sim-nota">Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> para sumarlo a tu cuenta.</p>') + '</div>';
  }
  // Comprar el plan que le falta (se suma a su cuenta con el mismo correo)
  function comprarPlan(k) {
    detenerReloj(); pintarBarra();
    var o = (YO.ofertas || {})[k], i = planInfo(k);
    if (!o) { h('<section class="sim-intro"><h1>' + i.nombre + '</h1><p class="sim-lead">' + i.lead + ' Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> para sumarlo a tu cuenta.</p><div class="botones"><button class="btn tinta" id="b-inicio">Volver al inicio</button></div></section>'); document.getElementById('b-inicio').onclick = inicio; return; }
    h('<section class="sim-intro sim-comprar"><span class="sim-paso">' + i.nombre + '</span><h1>' + (k === 'completo' ? 'Mídete con el examen real' : 'Practica sin límite') + '</h1><p class="sim-lead">' + i.lead + '</p>' +
      '<form class="sim-card sim-compra" id="f-plan"><ul class="sim-plan-l">' + i.trae.map(function (t) { return '<li>' + ICONO.ok + '<span>' + esc(t) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="sim-total"><span>Total</span><b class="num">' + precio(o.precio_centavos) + '</b></div>' +
        '<label class="sim-casilla"><input type="checkbox" id="p-term" required><span>Acepto los <a href="/legal/terminos/" target="_blank" rel="noopener">términos y condiciones</a> y el <a href="/privacidad/" target="_blank" rel="noopener">aviso de privacidad</a>.</span></label>' +
        '<p class="sim-nota">Se suma a la cuenta de ' + esc(YO.email) + ' y queda disponible en cuanto se confirma tu pago. Pagas con tarjeta, OXXO o SPEI.</p>' +
        '<p class="sim-error" id="p-error" role="alert" hidden></p><button class="btn tinta" id="p-pagar">Ir a pagar ' + FL + '</button></form>' +
      '<div class="botones"><button class="btn blanco" id="b-inicio">Volver al inicio</button></div></section>');
    document.getElementById('b-inicio').onclick = inicio;
    document.getElementById('f-plan').onsubmit = function (e) {
      e.preventDefault();
      var err = document.getElementById('p-error'), btn = document.getElementById('p-pagar');
      if (!document.getElementById('p-term').checked) { err.textContent = 'Acepta los términos para continuar.'; err.hidden = false; return; }
      btn.disabled = true; btn.textContent = 'Abriendo el pago…'; err.hidden = true;
      fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ slug: o.slug, cantidad: 1 }], nombre: YO.nombre, email: YO.email, terminos: true }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.url) throw new Error(d.error || 'No pudimos abrir el pago.'); location.href = d.url; }); })
        .catch(function (e2) { err.textContent = e2.message; err.hidden = false; btn.disabled = false; btn.innerHTML = 'Ir a pagar ' + FL; });
    };
  }
  function nombreModo(r) { return r.modo === 'examen' ? 'Examen ' + CFG.examen + ' completo' + (r.tutor ? ' · con tutor' : '') : r.modo === 'calentamiento' ? 'Calentamiento' : r.modo === 'completo' ? 'Nivel Medio' : r.modo === 'seccion' ? 'Sección de ' + seccion(r.secciones[0].id).nombre : 'Práctica de temas'; }
  function totalItems(r) { return r.secciones.reduce(function (a, s) { return a + s.items.length; }, 0); }
  function contestadas(r) { return Object.keys(r.resp).filter(function (id) { return r.resp[id].fase === 'fin'; }).length; }
  function tarjetaResumen(u) {
    var c = u.confianza || 0, e = estado(c);
    return '<div class="sim-card sim-res-mini"><span class="etiqueta">Tu último ' + (u.modo === 'examen' ? 'examen completo' : u.modo === 'calentamiento' ? 'calentamiento' : 'simulacro Medio') + '</span>' +
      '<div class="sim-res-mini-f">' + medidor(c, 120) + '<div><b class="sim-estado e-' + e.clase + '">' + e.nombre + '</b>' +
      (u.global != null ? '<p>' + (esPAA() ? 'Puntaje estimado' : 'Aciertos estimados') + ': <b class="num">' + unidad(u.global) + '</b> · meta ' + (u.meta || meta()) + '</p>' : '') +
      '<p class="sim-nota">' + fecha(u.fecha) + '</p></div></div></div>';
  }
  function historial() {
    if (!YO.historial.length) return '';
    var comp = YO.historial.filter(function (x) { return esIntento(x.modo) && x.global != null; }).slice(0, 8).reverse();
    var graf = comp.length >= 2 ? graficaHistorial(comp) : '';
    return '<h2 class="sim-h2">Tu avance</h2>' + graf + '<ul class="sim-hist">' + YO.historial.slice(0, 8).map(function (x, i) {
      var t = x.modo === 'examen' ? 'Examen completo' : x.modo === 'calentamiento' ? 'Calentamiento' : x.modo === 'completo' ? 'Nivel Medio' : x.modo === 'seccion' ? seccion((x.secciones[0] || {}).id).nombre : 'Práctica de temas';
      var ok = x.secciones.reduce(function (a, s) { return a + s.aciertos; }, 0), tot = x.secciones.reduce(function (a, s) { return a + s.total; }, 0);
      return '<li><button data-hist="' + i + '"><span><b>' + esc(t) + '</b><small>' + fecha(x.fecha) + '</small></span><span class="num">' + (x.global != null && esIntento(x.modo) ? unidad(x.global) : pct(ok, tot) + ' %') + '</span>' + FL + '</button></li>';
    }).join('') + '</ul>';
  }
  // Puntaje global de los últimos simulacros (una serie: un solo color, valor y fecha en el tooltip)
  function graficaHistorial(lista) {
    var W = 560, H = 150, pad = 28, n = lista.length, bw = Math.min(44, (W - pad * 2) / n - 10);
    var R0 = rango(), y = function (v) { return H - 22 - (v - R0.min) / (R0.max - R0.min) * (H - 40); };
    var m = meta();
    var barras = lista.map(function (x, i) {
      var cx = pad + (i + .5) * (W - pad * 2) / n, top = y(x.global);
      return '<g class="sim-gh-b" tabindex="0"><title>' + esc(fecha(x.fecha)) + ': ' + (esPAA() ? x.global + ' puntos' : x.global + ' aciertos') + '</title>' +
        '<path d="M' + (cx - bw / 2) + ' ' + (H - 22) + 'V' + (top + 4) + 'q0 -4 4 -4h' + (bw - 8) + 'q4 0 4 4V' + (H - 22) + 'z"/>' +
        (i === n - 1 ? '<text x="' + cx + '" y="' + (top - 6) + '" text-anchor="middle">' + x.global + '</text>' : '') + '</g>';
    }).join('');
    return '<figure class="sim-card sim-gh"><figcaption>' + (esPAA() ? 'Puntaje estimado' : 'Aciertos estimados (de ' + CFG.examenReactivos + ')') + ' en tus simulacros completos</figcaption>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Puntajes: ' + lista.map(function (x) { return x.global; }).join(', ') + '">' +
      '<line class="sim-gh-base" x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (H - 22) + '" y2="' + (H - 22) + '"/>' +
      '<line class="sim-gh-meta" x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y(m) + '" y2="' + y(m) + '"/><text class="sim-gh-mt" x="' + (W - pad) + '" y="' + (y(m) - 6) + '" text-anchor="end">Meta ' + m + '</text>' +
      barras + '</svg></figure>';
  }

  // ---------- sección: intro, preguntas, cierre ----------
  function secActual() { return run.secciones[run.actual]; }
  function continuar() {
    var s = secActual();
    if (run.fase === 'intro') introSeccion(); else if (s.idx >= s.items.length || s.cerrada) finSeccion(); else pregunta();
  }
  function introSeccion() {
    detenerReloj(); pintarBarra();
    var s = secActual(), info = seccion(s.id), practica = s.id === 'practica';
    run.fase = 'intro'; guardar(K_RUN, run);
    var paso = run.secciones.length > 1 ? '<span class="sim-paso">Sección ' + (run.actual + 1) + ' de ' + run.secciones.length + '</span>' : '';
    h('<section class="sim-intro">' + paso + '<h1>' + (practica ? 'Práctica de tus temas' : esc(info.nombre)) + '</h1>' +
      '<p class="sim-lead">' + (practica ? esc(s.temas.map(function (t) { return B.temas[t].nombre; }).join(' · ')) + '. Sin límite de tiempo: enfócate en entender el método.' : esc(info.descripcion)) + '</p>' +
      '<ul class="sim-datos"><li><b class="num">' + s.items.length + '</b><span>reactivos</span></li>' + (s.limite ? '<li><b class="num">' + Math.round(s.limite / 60) + '</b><span>minutos</span></li><li><b class="num">' + Math.round(s.limite / s.items.length) + ' s</b><span>por reactivo</span></li>' : '<li><b>Libre</b><span>tiempo</span></li>') + '</ul>' +
      '<div class="sim-reglas"><h2>Cómo funciona</h2><ol>' +
        '<li><b>Primer intento.</b> Elige tu respuesta y confírmala. Este intento es el que cuenta para tu resultado, como en el examen real.</li>' +
        '<li><b>Si fallas,</b> el tutor no te da la respuesta: te explica el concepto y cómo resolverlo para que lo intentes otra vez.</li>' +
        '<li><b>Segundo intento.</b> Aciertes o no, verás la solución paso a paso y la regla teórica detrás.</li>' +
        (s.limite ? '<li><b>El cronómetro</b> solo corre mientras respondes por primera vez; leer pistas y explicaciones no te quita tiempo.</li>' : '') +
      '</ol></div>' +
      '<div class="botones"><button class="btn tinta" id="b-go">' + (s.idx ? 'Continuar sección' : 'Empezar') + ' ' + FL + '</button><button class="btn blanco" id="b-inicio">Volver al inicio</button></div></section>');
    document.getElementById('b-go').onclick = function () { run.fase = 'preguntas'; guardar(K_RUN, run); pregunta(); };
    document.getElementById('b-inicio').onclick = inicio;
  }

  function estadoDe(id) { return run.resp[id] || (run.resp[id] = { fase: 'r1', sel1: null, sel2: null, t: 0 }); }
  function pregunta() {
    var s = secActual(), id = s.items[s.idx], r = R[id], st = estadoDe(id);
    var texto = r.texto ? B.textos[r.texto] : null;
    var orden = run.orden[id] || [0, 1, 2, 3];
    var progreso = '<div class="sim-prog" role="progressbar" aria-valuemin="0" aria-valuemax="' + s.items.length + '" aria-valuenow="' + (s.idx + 1) + '" aria-label="Reactivo ' + (s.idx + 1) + ' de ' + s.items.length + '"><span style="width:' + pct(s.idx, s.items.length) + '%"></span></div>';
    var cab = '<div class="sim-q-cab"><span>' + esc(s.id === 'practica' ? 'Práctica' : seccion(s.id).nombre) + ' · <b class="num">' + (s.idx + 1) + '</b> de ' + s.items.length + '</span><span class="sim-q-der"><span class="sim-tema">' + esc(B.temas[r.tema].nombre) + '</span><button type="button" class="sim-pausa" id="b-pausa" aria-label="Pausar y volver al inicio">Pausar</button></span></div>';
    var lectura = texto ? '<details class="sim-texto"' + (window.innerWidth >= 960 || s.idx === 0 || !texto.visto ? ' open' : '') + '><summary>' + ICONO.libro + '<span><b>' + esc(texto.titulo) + '</b><small>' + esc(texto.genero) + '</small></span></summary><div class="sim-texto-c' + (texto.verso ? ' verso' : '') + '">' +
      texto.parrafos.map(function (p, i) { return '<p><span class="sim-np" aria-label="' + (texto.verso ? 'Estrofa ' : 'Párrafo ') + (i + 1) + '">' + (i + 1) + '</span>' + rico(p) + '</p>'; }).join('') + '</div></details>' : '';
    var tabla = r.tabla ? '<table class="sim-tabla"><thead><tr>' + r.tabla[0].map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + r.tabla.slice(1).map(function (f) { return '<tr>' + f.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '';
    var cuerpo;
    if (r.tipo === 'abierta') {
      cuerpo = '<form class="sim-abierta" id="f-abierta" autocomplete="off"><label for="resp">Tu respuesta</label><div class="sim-abierta-f"><input id="resp" inputmode="decimal" maxlength="12" ' + (st.fase === 'fin' ? 'disabled' : '') + ' value="' + esc(st.fase === 'r2' ? '' : (st.sel2 != null ? st.sel2 : st.sel1 != null ? st.sel1 : '')) + '"><button class="btn tinta" ' + (st.fase === 'fin' ? 'disabled' : '') + '>Confirmar</button></div>' +
        (st.sel1 != null && st.fase !== 'r1' ? '<p class="sim-nota">Primer intento: <b>' + esc(st.sel1) + '</b>' + (st.sel2 != null ? ' · Segundo intento: <b>' + esc(st.sel2) + '</b>' : '') + '</p>' : '') + '</form>';
    } else {
      cuerpo = '<div class="sim-ops" role="radiogroup" aria-label="Opciones">' + orden.map(function (o, i) {
        var cls = '', dis = st.fase === 'fin', marca = '';
        if (st.sel1 === o && o !== r.correcta) { cls = ' tachada'; dis = true; marca = ICONO.no; }
        if (st.fase === 'fin') {
          if (o === r.correcta) { cls = ' correcta'; marca = ICONO.ok; }
          else if (st.sel2 === o) { cls = ' mal'; marca = ICONO.no; }
        }
        return '<button type="button" class="sim-opc' + cls + '" role="radio" aria-checked="false" data-o="' + o + '"' + (dis ? ' disabled' : '') + '><span class="sim-letra">' + LETRAS[i] + '</span><span class="sim-opc-t">' + rico(r.opciones[o]) + '</span><span class="sim-marca">' + marca + '</span></button>';
      }).join('') + '</div>';
    }
    // La pista va justo arriba del botón para el segundo intento
    var accion = st.fase === 'fin' ? '' : r.tipo === 'abierta' ? '' : '<div class="sim-acc"><span class="sim-atajos" aria-hidden="true"><kbd>A</kbd>–<kbd>D</kbd> elegir · <kbd>Enter</kbd> confirmar</span><button class="btn tinta" id="b-conf" disabled>' + (st.fase === 'r2' ? 'Confirmar segundo intento' : 'Confirmar respuesta') + '</button></div>';
    h('<section class="sim-q' + (texto ? ' con-texto' : '') + '">' + progreso + cab +
      '<div class="sim-q-cols">' + lectura + '<div class="sim-q-main"><h1 class="sim-enun">' + rico(r.enunciado) + '</h1>' + (r.figura ? '<figure class="sim-fig">' + r.figura + '</figure>' : '') + tabla + cuerpo +
      '<div id="tutor">' + tutor(r, st, orden) + '</div>' + accion + '</div></div></section>');
    if (texto) texto.visto = true;
    conectarPregunta(r, st, orden);
    document.getElementById('b-pausa').onclick = function () { detenerReloj(); guardar(K_RUN, run); inicio(); };
    if (s.limite && st.fase === 'r1') correrReloj(); else { detenerReloj(); pintarBarra(s.limite ? relojHTML(s, true) : ''); }
  }
  // Las pistas y pasos usan {A}…{D} = posición de la opción en el banco; aquí se cambian por la letra que se ve
  function letras(txt, orden) { return rico(txt).replace(/\{([A-D])\}/g, function (_, L) { var i = orden.indexOf(LETRAS.indexOf(L)); return i < 0 ? L : LETRAS[i]; }); }
  function tutor(r, st, orden) {
    if (st.fase === 'r1') return '';
    if (st.fase === 'r2') return '<div class="sim-tutor pista" role="status"><div class="sim-tutor-i">' + ICONO.foco + '</div><div><b>Todavía no. Pista del tutor</b><p>' + letras(r.pista, orden) + '</p><small>Tienes un intento más. Esta vez te mostraremos la solución completa.</small></div></div>';
    var ok1 = st.ok1, ok2 = st.ok2;
    var titulo = ok1 ? '¡Correcto a la primera!' : ok2 ? 'Bien, lo lograste en el segundo intento' : st.sinTiempo ? 'Se acabó el tiempo en este reactivo' : 'Esta era la respuesta correcta';
    var correcta = r.tipo === 'abierta' ? r.respuestas[0] : LETRAS[orden.indexOf(r.correcta)] + ') ' + r.opciones[r.correcta];
    var ultimo = secActual().idx >= secActual().items.length - 1;
    return '<div class="sim-tutor ' + (ok1 || ok2 ? 'bien' : 'sol') + '" role="status"><div class="sim-tutor-i">' + (ok1 || ok2 ? ICONO.ok : ICONO.libro) + '</div><div>' +
      '<b>' + titulo + '</b><p class="sim-correcta">Respuesta: <b>' + rico(correcta) + '</b></p>' +
      '<details' + (ok1 ? '' : ' open') + '><summary>Solución paso a paso</summary><ol class="sim-pasos">' + r.pasos.map(function (p) { return '<li>' + letras(p, orden) + '</li>'; }).join('') + '</ol>' +
      '<div class="sim-regla"><span>La regla</span><p>' + letras(r.regla, orden) + '</p></div></details></div></div>' +
      '<div class="sim-acc"><button class="btn tinta" id="b-sig">' + (ultimo ? 'Terminar sección' : 'Siguiente') + ' ' + FL + '</button></div>';
  }
  function normal(v) {
    v = String(v || '').trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(/°$/, '');
    // 6,050 es separador de miles; 2,5 es decimal
    v = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(v) ? v.replace(/,/g, '') : v.replace(',', '.');
    var f = v.match(/^(-?\d+)\/(\d+)$/); if (f && Number(f[2])) return Number(f[1]) / Number(f[2]);
    return v === '' || isNaN(Number(v)) ? NaN : Number(v);
  }
  function esCorrecta(r, v) {
    if (r.tipo === 'abierta') { var n = normal(v); return r.respuestas.some(function (a) { return Math.abs(normal(a) - n) < 1e-6; }); }
    return v === r.correcta;
  }
  function responder(r, st, v) {
    var s = secActual();
    if (st.fase === 'r1' && run.sinTutor) {
      // Examen completo: como en la PAA, una sola respuesta y a la siguiente; las explicaciones van en el reporte
      st.sel1 = v; st.ok1 = esCorrecta(r, v); st.fase = 'fin';
      s.idx++; guardar(K_RUN, run);
      if (s.idx >= s.items.length) { detenerReloj(); finSeccion(); } else pregunta();
      return;
    }
    if (st.fase === 'r1') {
      st.sel1 = v; st.ok1 = esCorrecta(r, v);
      st.fase = st.ok1 ? 'fin' : 'r2';
      detenerReloj();
    } else if (st.fase === 'r2') {
      st.sel2 = v; st.ok2 = esCorrecta(r, v); st.fase = 'fin';
    }
    guardar(K_RUN, run);
    pregunta();
    var t = document.getElementById('tutor'); if (t && t.firstChild) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    void s;
  }
  function conectarPregunta(r, st, orden) {
    var elegido = null, conf = document.getElementById('b-conf');
    app.querySelectorAll('.sim-opc').forEach(function (b) {
      b.onclick = function () {
        app.querySelectorAll('.sim-opc').forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('sel'); b.setAttribute('aria-checked', 'true'); elegido = Number(b.dataset.o); if (conf) conf.disabled = false;
      };
    });
    if (conf) conf.onclick = function () { if (elegido != null) responder(r, st, elegido); };
    var f = document.getElementById('f-abierta');
    if (f) f.onsubmit = function (e) {
      e.preventDefault(); var v = document.getElementById('resp').value;
      if (isNaN(normal(v))) { document.getElementById('resp').setCustomValidity('Escribe un número (puede ser fracción, como 3/4).'); document.getElementById('resp').reportValidity(); return; }
      responder(r, st, v.trim());
    };
    var inp = document.getElementById('resp'); if (inp) inp.oninput = function () { inp.setCustomValidity(''); };
    var sig = document.getElementById('b-sig');
    if (sig) sig.onclick = function () { var s = secActual(); s.idx++; guardar(K_RUN, run); if (s.idx >= s.items.length) finSeccion(); else pregunta(); };
    void orden;
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || !app.querySelector('.sim-q')) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    var k = e.key.toLowerCase(), i = 'abcd'.indexOf(k); if (i < 0) i = '1234'.indexOf(k);
    var ops = app.querySelectorAll('.sim-opc');
    if (i >= 0 && ops[i] && !ops[i].disabled) { e.preventDefault(); ops[i].click(); ops[i].focus(); return; }
    if (k === 'enter') {
      var b = document.getElementById('b-sig') || document.getElementById('b-conf');
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    }
  });
  // Con el cronómetro corriendo, avisa antes de cerrar la pestaña (el avance se guarda igual)
  window.addEventListener('beforeunload', function (e) { if (reloj) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- cronómetro (solo corre en el primer intento) ----------
  function relojHTML(s, pausado) {
    var resta = s.limite - s.usado, poco = resta <= 60;
    return '<span class="sim-reloj' + (poco ? ' poco' : '') + (pausado ? ' pausa' : '') + '" role="timer" aria-label="Tiempo restante ' + mmss(resta) + (pausado ? ', en pausa' : '') + '">' + ICONO.reloj + '<b class="num">' + mmss(resta) + '</b>' + (pausado ? '<small>pausa</small>' : '') + '</span>';
  }
  function correrReloj() {
    detenerReloj();
    var s = secActual(), id = s.items[s.idx], antes = Date.now();
    pintarBarra(relojHTML(s));
    reloj = setInterval(function () {
      var ahora = Date.now(), d = (ahora - antes) / 1000; antes = ahora;
      s.usado += d; estadoDe(id).t += d;
      if (s.usado >= s.limite) { s.usado = s.limite; tiempoAgotado(); return; }
      pintarBarra(relojHTML(s));
      if (Math.round(s.usado) % 5 === 0) guardar(K_RUN, run);
    }, 1000);
  }
  function detenerReloj() { if (reloj) { clearInterval(reloj); reloj = null; } }
  function tiempoAgotado() {
    detenerReloj();
    var s = secActual();
    s.cerrada = true;
    // Lo que no se respondió cuenta como no contestado (no suma puntos)
    s.items.slice(s.idx).forEach(function (id) { var st = estadoDe(id); if (st.fase === 'r1') { st.fase = 'fin'; st.ok1 = false; st.sinTiempo = true; } });
    guardar(K_RUN, run);
    finSeccion(true);
  }
  function finSeccion(sinTiempo) {
    detenerReloj(); pintarBarra();
    var s = secActual(), res = calcSeccion(s), ultima = run.actual >= run.secciones.length - 1;
    if (ultima) { terminar(); return; }
    var sig = seccion(run.secciones[run.actual + 1].id);
    h('<section class="sim-intro"><span class="sim-paso">Sección ' + (run.actual + 1) + ' de ' + run.secciones.length + ' terminada</span>' +
      '<h1>' + (sinTiempo ? 'Se acabó el tiempo de ' : 'Terminaste ') + esc(seccion(s.id).nombre) + '</h1>' +
      '<ul class="sim-datos"><li><b class="num">' + res.aciertos + '/' + res.total + '</b><span>a la primera</span></li><li><b class="num">' + res.segundo + '</b><span>en el 2.º intento</span></li><li><b class="num">' + mmss(res.tiempo) + '</b><span>de ' + mmss(res.limite) + '</span></li></ul>' +
      '<p class="sim-lead">Respira un momento. Sigue <b>' + esc(sig.nombre) + '</b>: ' + sig.reactivos + ' reactivos en ' + sig.minutos + ' minutos.</p>' +
      '<div class="botones"><button class="btn tinta" id="b-sig">Ir a ' + esc(sig.nombre) + ' ' + FL + '</button><button class="btn blanco" id="b-inicio">Pausar y volver al inicio</button></div></section>');
    document.getElementById('b-sig').onclick = function () { run.actual++; run.fase = 'intro'; guardar(K_RUN, run); introSeccion(); };
    document.getElementById('b-inicio').onclick = function () { run.actual++; run.fase = 'intro'; guardar(K_RUN, run); inicio(); };
  }

  // ---------- cálculo de resultados ----------
  function calcSeccion(s) {
    var ok = 0, seg = 0, w = 0, wt = 0, sinR = 0;
    s.items.forEach(function (id) {
      var r = R[id], st = run.resp[id] || {}, p = PESO[r.dificultad] || 1;
      wt += p; if (st.ok1) { ok++; w += p; } else if (st.ok2) seg++;
      if (st.sinTiempo || st.fase !== 'fin') sinR++;
    });
    // PAA: 200–800 ponderado por dificultad · por aciertos: porcentaje de aciertos a la primera
    var puntaje = esPAA() ? Math.round((200 + 600 * (wt ? w / wt : 0)) / 10) * 10 : pct(ok, s.items.length);
    return { id: s.id, puntaje: puntaje, aciertos: ok, segundo: seg, total: s.items.length, tiempo: Math.round(s.usado), limite: s.limite, sinResponder: sinR };
  }
  function terminar() {
    detenerReloj();
    var secs = run.secciones.map(calcSeccion), temas = {}, fallados = [], vistos_ = [];
    run.secciones.forEach(function (s) { s.items.forEach(function (id) {
      var r = R[id], st = run.resp[id] || {};
      var t = temas[r.tema] || (temas[r.tema] = { ok: 0, total: 0 });
      t.total++; if (st.ok1) t.ok++; else fallados.push(id);
      vistos_.push(id);
    }); });
    var global = null;
    if (esIntento(run.modo) && esPAA()) {
      var base = secs.filter(function (s) { return (CFG.globalSecciones || []).indexOf(s.id) >= 0; });
      global = base.length ? Math.round(base.reduce(function (a, s) { return a + s.puntaje; }, 0) / base.length / 10) * 10 : null;
    } else if (esIntento(run.modo)) {
      // Aciertos estimados sobre el examen completo (en Calentamiento y Medio se escalan a su tamaño)
      var okT = secs.reduce(function (a, s) { return a + s.aciertos; }, 0), totT = secs.reduce(function (a, s) { return a + s.total; }, 0);
      global = totT ? Math.round(okT / totT * CFG.examenReactivos) : null;
    }
    var res = { modo: run.modo, tutor: !!run.conTutor || undefined, area: run.area || null, secciones: secs, temas: temas, fallados: fallados, vistos: vistos_, global: global, meta: meta(), fecha: new Date().toISOString(),
      resp: run.resp, orden: run.orden, items: run.secciones.map(function (s) { return s.items; }) };
    res.confianza = confianza(res, ultimoCompleto()).total;
    var intento = run.intento || null;
    marcarVistos(vistos_);
    run.fase = 'fin'; guardar(K_RUN, null); run = null;
    // Al servidor solo va el resumen (el detalle de respuestas se queda para este reporte)
    var envio = { modo: res.modo, tutor: res.tutor, area: res.area, intento: intento, secciones: secs, temas: temas, fallados: fallados, global: global, meta: res.meta, confianza: res.confianza };
    YO.historial.unshift(Object.assign({ fecha: res.fecha, vistos: vistos_ }, envio));
    if (intento) cuentaDe(res.modo).abierto = null;
    api('resultados', { method: 'POST', body: JSON.stringify(envio) }).catch(function (e) {
      // Sin conexión: se guarda y se reintenta al volver a abrir el simulador
      if (!e.status) { guardar(K_PEND, envio); var a = document.getElementById('aviso-guardar'); if (a) a.hidden = false; }
    });
    reporte(res, false);
  }

  // Medidor de preparación: combina nivel frente a la meta, tiempo, consistencia por tema, aprendizaje con el tutor y tendencia
  function confianza(res, previo) {
    var m = esPAA() ? (res.meta || meta()) : Math.round(100 * (res.meta || meta()) / CFG.examenReactivos), secs = res.secciones.filter(function (s) { return s.total; });
    var holgura = esPAA() ? 300 : 50;   // la mitad del rango de cada sección
    var nivel = secs.length ? secs.reduce(function (a, s) { return a + clamp(1 - Math.max(0, m - s.puntaje) / holgura, 0, 1); }, 0) / secs.length : 0;
    var conLimite = secs.filter(function (s) { return s.limite; });
    var tiempo = conLimite.length ? conLimite.reduce(function (a, s) { return a + (s.total - (s.sinResponder || 0)) / s.total; }, 0) / conLimite.length : 1;
    var ts = Object.keys(res.temas).map(function (k) { return res.temas[k]; });
    var consist = ts.length ? ts.filter(function (t) { return t.ok / t.total >= .6; }).length / ts.length : 0;
    var fallos = secs.reduce(function (a, s) { return a + s.total - s.aciertos; }, 0), recup = secs.reduce(function (a, s) { return a + s.segundo; }, 0);
    var aprend = fallos ? recup / fallos : 1;
    var tend = .5;
    var umbral = esPAA() ? 10 : 3;
    if (previo && previo.global && res.global) tend = res.global > previo.global + umbral ? 1 : res.global < previo.global - umbral ? .2 : .6;
    var partes = { nivel: nivel, tiempo: tiempo, consist: consist, aprend: aprend, tend: tend };
    var total = Math.round(100 * (.5 * nivel + .15 * tiempo + .15 * consist + .1 * aprend + .1 * tend));
    return { total: clamp(total, 0, 100), partes: partes };
  }
  function estado(c) {
    if (c >= 85) return { nombre: 'Listo para el examen', clase: 'listo' };
    if (c >= 70) return { nombre: 'Casi listo', clase: 'casi' };
    if (c >= 50) return { nombre: 'En construcción', clase: 'medio' };
    return { nombre: 'Base inicial', clase: 'base' };
  }
  function temasDebiles(temas, n) {
    return Object.keys(temas || {}).map(function (k) { var t = temas[k]; return { id: k, nombre: (B.temas[k] || {}).nombre || k, ok: t.ok, total: t.total, p: t.ok / t.total }; })
      .filter(function (t) { return B.temas[t.id] && t.p < .6; }).sort(function (a, b) { return a.p - b.p || b.total - a.total; }).slice(0, n);
  }
  function nivelIngles(s) { var p = s.aciertos / s.total; return p < .4 ? 'Novato' : p < .6 ? 'Básico' : p < .8 ? 'Intermedio' : 'Avanzado'; }

  // ---------- reporte (dashboard de retroalimentación) ----------
  function medidor(v, tam) {
    var r = 52, L = Math.PI * r, e = estado(v);
    return '<svg class="sim-medidor e-' + e.clase + '" viewBox="0 0 120 70" width="' + tam + '" role="img" aria-label="Medidor de preparación: ' + v + ' de 100">' +
      '<path class="sim-med-f" d="M8 64a52 52 0 0 1 104 0" pathLength="' + L + '"/>' +
      '<path class="sim-med-v" d="M8 64a52 52 0 0 1 104 0" stroke-dasharray="' + (L * v / 100) + ' ' + L + '" pathLength="' + L + '"/>' +
      '<text x="60" y="58" text-anchor="middle" class="num">' + v + '</text></svg>';
  }
  function mensaje(res, c) {
    var m = res.meta, secs = res.secciones.filter(function (s) { return s.id !== 'practica'; });
    if (!secs.length) {
      var ok = res.secciones[0].aciertos, tot = res.secciones[0].total, rec = res.secciones[0].segundo;
      return 'Acertaste ' + ok + ' de ' + tot + ' a la primera y recuperaste ' + rec + ' con la pista del tutor. ' + (ok / tot >= .7 ? 'Estos temas ya se están volviendo tuyos: pásalos a un simulacro con tiempo.' : 'Repite esta práctica en un par de días: la segunda vuelta es donde se fija el método.');
    }
    var bajo = secs.slice().sort(function (a, b) { return a.puntaje - b.puntaje; })[0], alto = secs.slice().sort(function (a, b) { return b.puntaje - a.puntaje; })[0];
    if (!esPAA()) return mensajeAciertos(res, c, bajo, alto);
    var ref = res.global || bajo.puntaje, dist = m - ref, txt = '';
    if (res.global) txt += dist > 0 ? 'Estás a <b>' + dist + ' puntos</b> de tu meta de ' + m + ' en promedio. ' : 'Tu promedio estimado (' + res.global + ') <b>ya alcanza tu meta</b> de ' + m + '. ';
    if (alto.puntaje >= m) txt += 'Tienes bases sólidas en <b>' + esc(seccion(alto.id).nombre) + '</b> (' + alto.puntaje + '). ';
    else if (alto !== bajo) txt += 'Tu sección más fuerte es <b>' + esc(seccion(alto.id).nombre) + '</b> (' + alto.puntaje + '). ';
    if (bajo.puntaje < m) {
      var faltan = Math.max(1, Math.ceil((m - bajo.puntaje) / 600 * bajo.total));
      txt += 'Tu mayor oportunidad está en <b>' + esc(seccion(bajo.id).nombre) + '</b>: subir de ' + bajo.puntaje + ' a ' + m + ' equivale a acertar unos <b>' + faltan + ' reactivo' + (faltan > 1 ? 's' : '') + ' más</b> de cada ' + bajo.total + '.';
    } else txt += 'Todas tus secciones están en tu meta: mantén el ritmo con un simulacro por semana.';
    if (c.partes.tend === 1) txt += ' Además, <b>mejoraste</b> respecto a tu simulacro anterior.';
    return txt;
  }
  // Mensaje del reporte para exámenes por aciertos (UNAM, ECOEMS): distancia a la meta y materia con más oportunidad
  function mensajeAciertos(res, c, bajo, alto) {
    var m = res.meta || meta(), T = CFG.examenReactivos, mp = Math.round(100 * m / T), txt = '';
    if (res.global != null) txt += res.global < m ? 'Llevas unos <b>' + res.global + ' aciertos de ' + T + '</b>: te faltan <b>' + (m - res.global) + '</b> para tu meta de ' + m + '. ' : 'Llevas unos <b>' + res.global + ' aciertos de ' + T + '</b>: <b>ya alcanzas tu meta</b> de ' + m + '. ';
    if (alto !== bajo) txt += 'Tu materia más fuerte es <b>' + esc(seccion(alto.id).nombre) + '</b> (' + alto.puntaje + ' % de aciertos). ';
    if (bajo.puntaje < mp) txt += 'Tu mayor oportunidad está en <b>' + esc(seccion(bajo.id).nombre) + '</b>: ' + bajo.aciertos + ' de ' + bajo.total + ' a la primera; subir a ' + mp + ' % en esa materia te acerca a tu meta.';
    else txt += 'Todas tus materias están al nivel de tu meta: mantén el ritmo con un simulacro por semana.';
    if (c.partes.tend === 1) txt += ' Además, <b>mejoraste</b> respecto a tu simulacro anterior.';
    return txt;
  }
  function reporte(res, desdeHistorial) {
    detenerReloj(); pintarBarra();
    var c = confianza(res, desdeHistorial ? null : ultimoCompleto()), e = estado(c.total), m = res.meta || meta();
    if (desdeHistorial && res.confianza != null) c.total = res.confianza;
    var secs = res.secciones.filter(function (s) { return s.id !== 'practica'; });
    var temas = Object.keys(res.temas).map(function (k) { var t = res.temas[k]; return { id: k, t: B.temas[k], ok: t.ok, total: t.total, p: t.ok / t.total }; }).filter(function (x) { return x.t; }).sort(function (a, b) { return a.p - b.p; });
    var debiles = temasDebiles(res.temas, 3), fuertes = temas.filter(function (x) { return x.p >= .75 && x.total >= 2; }).slice(-3).reverse();
    var totOk = res.secciones.reduce(function (a, s) { return a + s.aciertos; }, 0), totSeg = res.secciones.reduce(function (a, s) { return a + s.segundo; }, 0), tot = res.secciones.reduce(function (a, s) { return a + s.total; }, 0);

    var htmlSecs = secs.length ? '<div class="sim-card"><h2 class="sim-h3">' + (esPAA() ? 'Puntaje estimado por sección' : 'Aciertos por materia') + '</h2><p class="sim-nota">' + (esPAA() ? 'Escala de la PAA: 200 a 800. La línea marca tu meta (' + m + ').' : 'Porcentaje de aciertos a la primera. La línea marca el porcentaje de tu meta (' + m + ' de ' + CFG.examenReactivos + ').') + '</p><ul class="sim-barras">' + secs.map(function (s) {
      var w = esPAA() ? (s.puntaje - 200) / 6 : s.puntaje, mw = esPAA() ? (m - 200) / 6 : metaSec();
      return '<li title="' + esc(seccion(s.id).nombre) + ': ' + s.puntaje + ' puntos, ' + s.aciertos + ' de ' + s.total + ' a la primera"><div class="sim-barra-c"><b>' + esc(seccion(s.id).nombre) + '</b><span class="num">' + (esPAA() ? s.puntaje : s.aciertos + '/' + s.total) + (s.id === 'ingles' ? ' · ' + nivelIngles(s) : '') + '</span></div>' +
        '<div class="sim-barra-p"><span class="sim-barra-v" style="width:' + w + '%"></span><span class="sim-barra-m" style="left:' + mw + '%"></span></div>' +
        '<small>' + s.aciertos + '/' + s.total + ' a la primera · ' + s.segundo + ' recuperadas con el tutor' + (s.limite ? ' · ' + mmss(s.tiempo) + ' de ' + mmss(s.limite) + (s.sinResponder ? ' · ' + s.sinResponder + ' sin responder' : '') : '') + '</small></li>';
    }).join('') + '</ul></div>' : '';

    var htmlTemas = '<div class="sim-card"><h2 class="sim-h3">Aciertos por tema</h2><p class="sim-nota">Primer intento. Ordenados de menor a mayor.</p><ul class="sim-temas">' + temas.map(function (x) {
      var cl = x.p >= .75 ? 'alto' : x.p >= .6 ? 'medio' : 'bajo', et = x.p >= .75 ? 'Fortaleza' : x.p >= .6 ? 'En camino' : 'Reforzar';
      return '<li title="' + esc(x.t.nombre) + ': ' + x.ok + ' de ' + x.total + '"><span class="sim-tema-n">' + esc(x.t.nombre) + '<small>' + esc(seccion(x.t.seccion).nombre) + '</small></span><span class="sim-tema-b"><span style="width:' + Math.max(3, x.p * 100) + '%"></span></span><span class="sim-tema-v num">' + x.ok + '/' + x.total + '</span><span class="sim-chip c-' + cl + '">' + et + '</span></li>';
    }).join('') + '</ul></div>';

    var htmlRefuerza = debiles.length ? '<h2 class="sim-h2">Qué reforzar exactamente</h2><div class="sim-refuerzo">' + debiles.map(function (x) {
      return '<div class="sim-card sim-ref"><span class="sim-chip c-bajo">' + x.ok + '/' + x.total + ' a la primera</span><h3>' + esc(x.nombre) + '</h3><p>' + esc(B.temas[x.id].consejo) + '</p><button class="btn blanco chico" data-practica="' + x.id + '">Practicar este tema ' + FL + '</button></div>';
    }).join('') + '</div>' + (debiles.length > 1 ? '<button class="btn tinta" data-practica="' + debiles.map(function (x) { return x.id; }).join(',') + '">Practicar mis ' + debiles.length + ' temas débiles ' + FL + '</button>' : '') : '';

    var htmlFuertes = fuertes.length ? '<div class="sim-card"><h2 class="sim-h3">Tus fortalezas</h2><ul class="sim-fuertes">' + fuertes.map(function (x) { return '<li>' + ICONO.ok + '<span><b>' + esc(x.t.nombre) + '</b> · ' + x.ok + ' de ' + x.total + '</span></li>'; }).join('') + '</ul><p class="sim-nota">Mantén estos temas con práctica ligera; tu tiempo rinde más en los que están en rojo.</p></div>' : '';

    var htmlTutor = '<div class="sim-card"><h2 class="sim-h3">El tutor en números</h2><ul class="sim-datos chico"><li><b class="num">' + totOk + '</b><span>a la primera</span></li><li><b class="num">' + totSeg + '</b><span>con la pista</span></li><li><b class="num">' + (tot - totOk - totSeg) + '</b><span>por repasar</span></li></ul>' +
      '<p class="sim-nota">' + (tot - totOk ? 'Recuperaste ' + pct(totSeg, tot - totOk) + ' % de tus errores con una pista. ' + (totSeg / Math.max(1, tot - totOk) >= .5 ? 'Eso indica que conoces los temas: muchos errores son de método o de prisa, y eso se corrige con práctica cronometrada.' : 'Varios temas todavía necesitan teoría: lee la regla de cada reactivo fallado antes de volver a practicar.') : '¡Ningún error! Sube tu meta para seguir retándote.') + '</p></div>';

    // Siguiente paso: al llegar a su meta en el nivel Medio, ya está listo para medirse con el examen real
    var htmlListo = '';
    if (res.modo === 'completo' && res.global && !desdeHistorial) {
      if (res.global >= m) htmlListo = tieneExamen()
        ? '<div class="sim-card sim-listo"><span class="etiqueta">Siguiente paso</span><h2>¡Ya estás listo para tu examen completo!</h2><p>Llegaste a tu meta (' + m + ') en el nivel Medio. Ahora mídete con el tiempo y la dificultad del examen ' + esc(CFG.examen) + ' real.</p><button class="btn tinta" data-modo-otra="examen">Hacer mi examen completo ' + FL + '</button></div>'
        : '<div class="sim-card sim-listo"><span class="etiqueta">Siguiente paso</span><h2>¡Ya estás listo para el examen completo!</h2><p>Llegaste a tu meta (' + m + ') en el nivel Medio. Mídete como el día del examen: 2 exámenes completos de ' + exTotales().reactivos + ' reactivos en ' + horas(exTotales().minutos) + ': el primero con tutor y el segundo sin pistas, con tu reporte de preparación.</p><button class="btn tinta" data-plan="completo">Quiero los 2 exámenes ' + FL + '</button></div>';
      else if (!tieneExamen()) htmlListo = '<p class="sim-nota sim-casi">Te faltan <b>' + (m - res.global) + (esPAA() ? ' puntos' : ' aciertos') + '</b> para tu meta. Cuando la alcances en un simulacro Medio, te avisamos que ya estás listo para el simulador completo.</p>';
    }

    var revision = '';
    if (res.resp && res.fallados.length) {
      revision = '<h2 class="sim-h2">Repasa tus errores</h2><div class="sim-revision">' + res.fallados.map(function (id) {
        var r = R[id]; if (!r) return ''; var st = res.resp[id] || {}, orden = (res.orden || {})[id] || [0, 1, 2, 3];
        var correcta = r.tipo === 'abierta' ? r.respuestas[0] : r.opciones[r.correcta];
        var tuya = st.sinTiempo ? 'Sin responder (tiempo agotado)' : r.tipo === 'abierta' ? st.sel1 : (st.sel1 != null ? r.opciones[st.sel1] : '—');
        return '<details class="sim-card sim-rev"><summary><span class="sim-tema">' + esc(B.temas[r.tema].nombre) + '</span><b>' + rico(r.enunciado.split('\n')[0]) + '</b></summary>' +
          (r.texto ? '<p class="sim-nota">Lectura: ' + esc(B.textos[r.texto].titulo) + '</p>' : '') +
          '<p><span class="sim-no">Tu respuesta:</span> ' + rico(tuya) + '</p><p><span class="sim-si">Correcta:</span> ' + rico(correcta) + '</p>' +
          '<ol class="sim-pasos">' + r.pasos.map(function (p) { return '<li>' + letras(p, orden) + '</li>'; }).join('') + '</ol><div class="sim-regla"><span>La regla</span><p>' + letras(r.regla, orden) + '</p></div></details>';
      }).join('') + '</div>';
    }

    h('<section class="sim-rep">' +
      '<span class="etiqueta">' + esc(res.modo === 'examen' ? 'Resultado del examen completo' + (res.tutor ? ' con tutor' : '') : res.modo === 'calentamiento' ? 'Resultado del calentamiento' : res.modo === 'completo' ? 'Resultado del nivel Medio' : res.modo === 'seccion' ? 'Resultado de ' + seccion(res.secciones[0].id).nombre : 'Resultado de la práctica') + (desdeHistorial ? ' · ' + fecha(res.fecha) : '') + '</span>' +
      '<div class="sim-card sim-hero-rep"><div class="sim-hero-med">' + medidor(c.total, 220) + '<span>Medidor de preparación</span></div>' +
        '<div class="sim-hero-t"><b class="sim-estado e-' + e.clase + '">' + e.nombre + '</b>' + (res.global != null ? '<p class="sim-global">' + (esPAA() ? 'Puntaje estimado' : 'Aciertos estimados') + ' <b class="num">' + res.global + '</b><small> / ' + rango().max + ' · meta ' + m + '</small></p>' : '') +
        '<p>' + mensaje(res, c) + '</p></div></div>' + htmlListo +
      '<p class="sim-aviso-g" id="aviso-guardar" hidden>No pudimos guardar este resultado (sin conexión). Se guardará en tu historial la próxima vez que abras el simulador con internet.</p>' +
      '<div class="sim-grid2' + (htmlSecs ? '' : ' uno') + '">' + htmlSecs + htmlTutor + '</div>' +
      htmlRefuerza +
      (htmlFuertes ? '<div class="sim-grid2">' + htmlTemas + htmlFuertes + '</div>' : '<div class="sim-grid2 uno">' + htmlTemas + '</div>') +
      revision +
      '<p class="sim-nota sim-disc">' + (esPAA() ? 'El puntaje es una estimación de Vorka México basada en tus aciertos ponderados por dificultad; no es una calificación oficial del College Board.' : 'Los aciertos estimados se calculan sobre un examen de ' + CFG.examenReactivos + ' reactivos con reactivos originales de Vorka México; no es un resultado oficial de ' + esc(CFG.oficial) + '.') + ' Úsalo para orientar tu estudio y medir tu avance.</p>' +
      regaloHTML() +
      sparks('reporte') +
      '<div class="botones sim-fin"><button class="btn tinta" id="b-inicio">Volver al inicio</button>' + (esIntento(res.modo) ? '' : '<button class="btn blanco" data-modo-otra="completo">Hacer un simulacro corto</button>') + '</div>' +
      '</section>');
    document.getElementById('b-inicio').onclick = inicio;
    app.querySelectorAll('[data-practica]').forEach(function (b) { b.onclick = function () { empezar('practica', b.dataset.practica.split(',')); }; });
    app.querySelectorAll('[data-modo-otra]').forEach(function (o) { o.onclick = function () { empezar(o.dataset.modoOtra); }; });
    app.querySelectorAll('[data-plan]').forEach(function (b) { b.onclick = function () { comprarPlan(b.dataset.plan); }; });
    conectarSparks();
  }

  // ---------- Revista Sparks (boletín) ----------
  function sparks(donde) {
    return '<aside class="sim-sparks" aria-labelledby="sp-' + donde + '"><div class="sim-sparks-t"><span class="etiqueta">Revista Sparks</span>' +
      '<h2 id="sp-' + donde + '">Historias de jóvenes que ya están construyendo lo que sigue</h2>' +
      '<p>Cada semana, en tu correo: jóvenes de Guanajuato que emprenden, crean y cambian su comunidad. Inspiración real para lo que viene después del examen.</p></div>' +
      '<div class="sim-sparks-a"><button class="btn plata" data-sparks>Suscribirme gratis</button><a class="sim-link" href="/sparks/" target="_blank" rel="noopener">Ver la revista</a>' +
      '<small>Te llega al correo de tu compra. Puedes darte de baja cuando quieras.</small></div></aside>';
  }
  function conectarSparks() {
    app.querySelectorAll('[data-sparks]').forEach(function (b) {
      if (leer(K_SPARKS)) { listo(b); return; }
      b.onclick = function () {
        b.disabled = true; b.textContent = 'Suscribiendo…';
        fetch(SIM.os + '/api/publico/boletin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nombre: YO.nombre, correo: YO.email, acepto: true, origen: APP }) })
          .then(function (r) { if (!r.ok) throw new Error(); guardar(K_SPARKS, 1); app.querySelectorAll('[data-sparks]').forEach(listo); })
          .catch(function () { b.disabled = false; b.textContent = 'Reintentar suscripción'; });
      };
    });
    function listo(b) { b.disabled = true; b.innerHTML = (SIM.check || '') + ' ¡Listo! Ya estás suscrito'; b.classList.add('hecho'); }
  }

  iniciar();
})();
