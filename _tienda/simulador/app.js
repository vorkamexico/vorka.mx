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
  var K_RUN, K_META, K_PEND, K_VISTOS, K_SPARKS, K_AREA, K_UNI, K_INST, K_VISTOS_V;
  var L = window.SIM_LOGICA;   // funciones puras (simulador/logica.js): gráfica, temas y puntaje por universidad
  function llaves(email) {
    var h = 0; String(email || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
    var x = ':' + h.toString(36);
    var p = APP === 'simulador-paa' ? 'vk_paa' : 'vk_' + APP.replace('simulador-', '');
    K_RUN = p + '_run' + x; K_META = p + '_meta' + x; K_PEND = p + '_pendiente' + x; K_VISTOS = p + '_vistos' + x; K_SPARKS = p + '_sparks' + x; K_AREA = p + '_area' + x; K_UNI = p + '_universidad' + x; K_INST = p + '_instalar_no' + x; K_VISTOS_V = p + '_videos_vistos' + x;
  }

  // ---------- utilidades ----------
  function guardar(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function leer(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Texto del banco: escapado, **negritas** y saltos de línea
  function rico(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  // Índices de las opciones de un reactivo: 4 en PAA, UNAM y ECOEMS; 3 en el EXANI-I (prepa UG)
  function indices(r) { return (r && r.opciones ? r.opciones : [0, 1, 2, 3]).map(function (_, i) { return i; }); }
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
  // Universidad a la que quiere entrar (PAA): cambia la escala en la que ve su puntaje. Se guarda junto a la meta.
  function unis() { return esPAA() ? CFG.universidades || [] : []; }
  function uniId() { var x = leer(K_UNI); return x === 'otra' || unis().some(function (u) { return u.id === x; }) ? x : null; }
  function uniInfo() { var id = uniId(); for (var i = 0; i < unis().length; i++) if (unis()[i].id === id) return unis()[i]; return null; }
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
    lapiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    campana: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    pausa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
    candado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
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
      // App instalable (service worker) y, con plan Completo, el plan de estudio. #hoy = vino de un recordatorio
      registrarSW();
      cargarVideos();
      if (location.hash === '#hoy' || /[?&]app=1/.test(location.search)) try { history.replaceState(null, '', RUTA + '/'); } catch (e2) { }
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
      var x = R[id]; if (x.opciones) r.orden[id] = x.fijo ? indices(x) : barajar(indices(x));
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
  // Práctica: solo reactivos de los temas pedidos (10 o los que elija); primero los que fallaste, luego los que no has visto.
  // No gasta intentos: se arma aquí, sin pasar por /iniciar.
  var practicaN = 10;
  function armarPractica(temas) {
    var fallados = {};
    YO.historial.forEach(function (x) { (x.fallados || []).forEach(function (id) { fallados[id] = 1; }); });
    var items = L.elegirPractica(B.reactivos, temas, { n: practicaN, fallados: fallados, vistos: vistos() });
    practicaN = 10;
    return { id: 'practica', temas: temas, items: items.map(function (r) { return r.id; }), idx: 0, limite: 0, usado: 0, cerrada: false };
  }

  // ---------- práctica libre por temas (no gasta intentos) ----------
  // Elige sección (o materia) y uno o varios temas; los temas salen del banco con su etiqueta real, con cuántas preguntas
  // hay y cuántas ya vio. Sugiere sus temas más débiles con sus aciertos a la primera en todo su historial.
  var TS = { elegidos: {}, sec: null, n: 10 };
  function elegirTemas() {
    detenerReloj(); pintarBarra();
    var grupos = L.temasPorSeccion(B, vistos());
    if (!TS.sec || !grupos.some(function (g) { return g.id === TS.sec; })) TS.sec = grupos[0].id;
    var agg = L.desempenoTemas(YO.historial), debiles = L.temasDebiles(agg, B.temas, 4, 2), quien = esPAA() ? 'sección' : 'materia';
    var sug = debiles.length
      ? '<div class="sim-card sim-debiles"><h2 class="sim-h3">Tus temas más débiles</h2><p class="sim-nota">Con tus aciertos a la primera en todo tu historial.</p><div class="sim-debiles-l">' +
        debiles.map(function (t) { return '<span class="sim-chip c-bajo">' + esc(t.nombre) + ' · ' + t.ok + '/' + t.total + '</span>'; }).join('') + '</div>' +
        '<button type="button" class="btn tinta chico" id="t-debiles">Practicar estos ' + debiles.length + ' temas ' + FL + '</button></div>'
      : '<p class="sim-nota sim-debiles-vacio">Cuando termines un simulacro o una práctica, aquí te sugerimos tus temas más débiles.</p>';
    h('<section class="sim-intro sim-tsel"><span class="sim-paso">Práctica libre · no gasta intentos</span><h1>Elige qué temas practicar</h1>' +
      '<p class="sim-lead">Escoge una ' + quien + ' y marca uno o varios temas (puedes mezclar ' + (esPAA() ? 'secciones' : 'materias') + '). Te damos preguntas solo de esos temas, sin cronómetro y con tutor.</p>' + sug +
      '<div class="sim-tabs" role="tablist" aria-label="' + (esPAA() ? 'Secciones' : 'Materias') + '">' + grupos.map(function (g) {
        return '<button type="button" role="tab" id="tab-' + g.id + '" aria-controls="t-panel" aria-selected="' + (g.id === TS.sec) + '"' + (g.id === TS.sec ? '' : ' tabindex="-1"') + ' class="sim-tab' + (g.id === TS.sec ? ' sel' : '') + '" data-tsec="' + g.id + '">' + esc(g.nombre) + '<small class="num" data-tcuenta="' + g.id + '"></small></button>';
      }).join('') + '</div>' +
      '<div class="sim-card sim-tpanel" id="t-panel" role="tabpanel"></div>' +
      '<div class="sim-tpie"><p id="t-n" aria-live="polite"></p><label class="sim-tcant">Preguntas <select id="t-cant"><option value="10"' + (TS.n === 10 ? ' selected' : '') + '>10</option><option value="20"' + (TS.n === 20 ? ' selected' : '') + '>20</option></select></label>' +
      '<div class="botones"><button class="btn tinta" id="t-go" type="button">Practicar ' + FL + '</button><button class="btn blanco" id="b-inicio" type="button">Volver al inicio</button></div></div></section>');
    function cuenta() {
      var ids = Object.keys(TS.elegidos), total = B.reactivos.filter(function (r) { return TS.elegidos[r.tema]; }).length;
      document.getElementById('t-n').innerHTML = ids.length ? '<b>' + ids.length + (ids.length === 1 ? ' tema elegido' : ' temas elegidos') + '</b> · ' + total + ' preguntas en el banco' : 'Marca al menos un tema.';
      document.getElementById('t-go').disabled = !ids.length;
      grupos.forEach(function (g) { var n = g.temas.filter(function (t) { return TS.elegidos[t.id]; }).length; var c = app.querySelector('[data-tcuenta="' + g.id + '"]'); if (c) c.textContent = n ? ' · ' + n : ''; });
    }
    function panel() {
      var g = grupos.filter(function (x) { return x.id === TS.sec; })[0], todos = g.temas.every(function (t) { return TS.elegidos[t.id]; });
      var pn = document.getElementById('t-panel'); pn.setAttribute('aria-labelledby', 'tab-' + g.id);
      pn.innerHTML = '<fieldset><legend class="sim-h3">Temas de ' + esc(g.nombre) + '</legend><ul class="sim-tlista">' + g.temas.map(function (t) {
        var a = agg[t.id];
        return '<li><label class="sim-top"><input type="checkbox" value="' + t.id + '"' + (TS.elegidos[t.id] ? ' checked' : '') + '><span><b>' + esc(t.nombre) + '</b><small>' + t.total + ' preguntas · has visto ' + t.vistos + (a && a.total ? ' · ' + a.ok + '/' + a.total + ' a la primera' : '') + '</small></span></label></li>';
      }).join('') + '</ul></fieldset><button type="button" class="sim-link" id="t-todos">' + (todos ? 'Quitar todos' : 'Marcar todos') + ' los de ' + esc(g.nombre) + '</button>';
      pn.querySelectorAll('input').forEach(function (c) { c.onchange = function () { if (c.checked) TS.elegidos[c.value] = 1; else delete TS.elegidos[c.value]; cuenta(); var tb = document.getElementById('t-todos'); tb.textContent = (g.temas.every(function (t) { return TS.elegidos[t.id]; }) ? 'Quitar todos' : 'Marcar todos') + ' los de ' + g.nombre; }; });
      document.getElementById('t-todos').onclick = function () { var q = g.temas.every(function (t) { return TS.elegidos[t.id]; }); g.temas.forEach(function (t) { if (q) delete TS.elegidos[t.id]; else TS.elegidos[t.id] = 1; }); panel(); cuenta(); };
    }
    var tabs = app.querySelectorAll('[data-tsec]');
    tabs.forEach(function (b, k) {
      b.onclick = function () { TS.sec = b.dataset.tsec; tabs.forEach(function (x) { var s = x === b; x.classList.toggle('sel', s); x.setAttribute('aria-selected', s); x.tabIndex = s ? 0 : -1; }); panel(); };
      b.onkeydown = function (e) { var n = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : null; if (n == null) return; e.preventDefault(); var t = tabs[(n + tabs.length) % tabs.length]; t.click(); t.focus(); };
    });
    panel(); cuenta();
    document.getElementById('t-cant').onchange = function () { TS.n = Number(this.value) || 10; };
    var bd = document.getElementById('t-debiles'); if (bd) bd.onclick = function () { TS.elegidos = {}; debiles.forEach(function (t) { TS.elegidos[t.id] = 1; }); practicarElegidos(); };
    document.getElementById('t-go').onclick = practicarElegidos;
    document.getElementById('b-inicio').onclick = inicio;
  }
  function practicarElegidos() {
    var ids = Object.keys(TS.elegidos); if (!ids.length) return;
    if (run && run.fase !== 'fin') {
      if (!confirm(esIntento(run.modo) ? 'Tienes un simulacro sin terminar. Si empiezas una práctica lo pierdes y el intento ya cuenta. ¿Continuar?' : 'Tienes una práctica sin terminar. ¿Empezar otra y descartarla?')) return;
      if (esIntento(run.modo)) { var id = run.intento; run = null; guardar(K_RUN, null); api('abandonar', { method: 'POST', body: JSON.stringify({ id: id }) }).then(function (d) { YO.intentos = d.intentos; YO.examenes = d.examenes; if (d.calentamientos) YO.calentamientos = d.calentamientos; }); }
    }
    practicaN = TS.n; empezar('practica', ids);
  }

  // ---------- inicio ----------
  function ultimoCompleto() { for (var i = 0; i < YO.historial.length; i++) if (esIntento(YO.historial[i].modo)) return YO.historial[i]; return null; }
  function inicio() {
    detenerReloj(); pintarBarra();
    var u = ultimoCompleto(), m = meta();
    var totalR = medioTotales().reactivos, totalM = medioTotales().minutos;
    var retomar = run && run.fase !== 'fin' ? '<div class="sim-aviso"><div><b>Tienes un simulacro sin terminar.</b><span>' + esc(nombreModo(run)) + ' · ' + contestadas(run) + ' de ' + totalItems(run) + ' respondidas</span></div><div class="botones"><button class="btn tinta chico" id="b-ret">Continuar</button><button class="btn blanco chico" id="b-desc">Descartar</button></div></div>' : '';
    var resumen = u ? tarjetaResumen(u) : '<div class="sim-card sim-primera"><span class="etiqueta">Tu punto de partida</span><h2>Haz tu primer simulacro completo</h2><p>Con él calculamos tu ' + (esPAA() ? 'puntaje estimado por sección' : 'número de aciertos estimado por materia') + ', tu nivel de confianza y los temas exactos que debes reforzar.</p></div>';
    var debiles = L.temasDebiles(L.desempenoTemas(YO.historial), B.temas, 3, 2), conTemas = L.hayTemas(B);
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
          '<div class="o-0 sim-est-caja" id="est-card">' + tarjetaEstudio() + '</div>' +
          '<section class="o-4">' + selArea + '<h2 class="sim-h2 sim-h2-top">Sube de nivel</h2><p class="sim-nota" style="margin-top:-4px">Empieza en Calentamiento, entrena en Medio y cierra con el examen completo, que tiene la dificultad y el tiempo del examen real.</p>' +
          (!puedePracticar() ? tarjetaPlan('practica', 'Llega al examen con práctica de sobra') : '') +
          (puedePracticar() && hayCal ? '<button class="sim-op sim-op-grande sim-op-nivel" data-modo="calentamiento"><span class="sim-op-t"><span class="sim-op-tag n1">Nivel 1 · para entrar en ritmo</span><b>Calentamiento</b><small>' + caR + ' reactivos · ' + caM + ' minutos · preguntas de dificultad básica e intermedia · con tutor</small></span><span class="sim-op-f">' + FL + '</span></button>' + intentosCa : '') +
          (puedePracticar() ? '<button class="sim-op sim-op-grande sim-op-nivel" data-modo="completo"><span class="sim-op-t"><span class="sim-op-tag n2">Nivel 2 · para ya estar bien</span><b>Medio</b><small>' + totalR + ' reactivos · ' + totalM + ' minutos · la mayoría de dificultad alta, como el examen real · con tutor</small></span><span class="sim-op-f">' + FL + '</span></button>' + intentos : '') +
          (hayExamen && !tieneExamen() ? tarjetaPlan('completo', 'Cuando estés listo, mídete con el examen real') : '') +
          (hayExamen && tieneExamen() ? '<button class="sim-op sim-op-grande sim-op-examen" data-modo="examen"><span class="sim-op-t"><span class="sim-op-tag">Nivel 3 · como el examen real</span><b>Examen ' + esc(CFG.examen) + ' completo</b><small>' + exR + ' reactivos · ' + horas(exM) + ' · ' + (infoArea() ? 'las materias de tu área con su peso' : 'las ' + B.examen.length + (esPAA() ? ' secciones' : ' materias') + ' cronometradas y con la dificultad del examen') + (ie.tutorSiguiente || (ie.abierto && ie.abierto.tutor) ? ' · <b>el primero, con tutor</b>: si fallas te da una pista, para que veas cómo es el examen sin presión. El segundo, sin pistas como el día del examen' : ' · sin pistas, la revisión va al final') + '</small></span><span class="sim-op-f">' + FL + '</span></button>' + intentosEx : '') +
          (puedePracticar() ? '<p class="sim-nota sim-libre">Práctica libre, sin gastar intentos:</p>' +
          (conTemas ? '<button class="sim-op sim-op-temas" id="b-temas"><span class="sim-op-i">' + ICONO.foco + '</span><span class="sim-op-t"><b>Elige qué temas practicar</b><small>' + (esPAA() ? 'Sección' : 'Materia') + ' y temas que tú quieras · ' + Object.keys(B.temas).length + ' temas en el banco · sin cronómetro y con tutor</small></span><span class="sim-op-f">' + FL + '</span></button>' : '') +
          '<div class="sim-secs">' + B.secciones.map(function (s) {
            return '<button class="sim-op" data-modo="seccion" data-sec="' + s.id + '"><span class="sim-punto s-' + s.color + '"></span><span class="sim-op-t"><b>' + esc(s.nombre) + '</b><small>' + (conTemas ? 'Todos los temas · ' : '') + s.reactivos + ' reactivos · ' + s.minutos + ' min</small></span><span class="sim-op-f">' + FL + '</span></button>';
          }).join('') + '</div>' : '') +
          (puedePracticar() && debiles.length ? '<button class="sim-op sim-op-practica" data-modo="practica" data-temas="' + debiles.map(function (t) { return t.id; }).join(',') + '"><span class="sim-op-i">' + ICONO.foco + '</span><span class="sim-op-t"><b>Practicar mis temas débiles</b><small>' + esc(debiles.map(function (t) { return t.nombre; }).join(' · ')) + '</small></span><span class="sim-op-f">' + FL + '</span></button>' : '') +
          '</section>' +
          '<section class="o-5">' + historial() + '</section>' +
        '</div>' +
        '<aside class="sim-col sim-col-lado">' +
          '<div class="o-1">' + resumen + '</div>' +
          (esPAA() ? '<div class="o-2 sim-card sim-meta' + (unis().length && !uniId() ? ' sim-meta-pend' : '') + '">' + uniHTML() + '<span class="etiqueta">Tu meta por sección</span><div class="sim-meta-v"><b class="num" id="meta-v">' + m + '</b><small>de 800 por sección</small></div>' +
            '<input type="range" id="meta" min="400" max="800" step="10" value="' + m + '" aria-label="Meta de puntaje por sección (200 a 800)">' +
            '<p class="sim-nota" id="meta-nota">' + metaNota(m) + '</p></div>'
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
    r.oninput = function () { document.getElementById('meta-v').textContent = r.value; var n = document.getElementById('meta-nota'); if (n && esPAA()) n.innerHTML = metaNota(Number(r.value)); };
    r.onchange = function () { guardar(K_META, Number(r.value)); repintar('meta'); };
    app.querySelectorAll('[data-uni]').forEach(function (b) { b.onclick = function () { guardar(K_UNI, b.dataset.uni); repintar('[data-uni="' + b.dataset.uni + '"]'); }; });
    var um = document.getElementById('uni-meta'); if (um) um.onclick = function () { guardar(K_META, uniInfo().metaSeccion); repintar('meta'); };
    var bt = document.getElementById('b-temas'); if (bt) bt.onclick = function () { elegirTemas(); };
    conectarGrafica();
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
    conectarEstudio();
  }
  // Vuelve a pintar el inicio sin perder el lugar en la página (al cambiar meta o universidad) y deja el foco donde estaba
  function repintar(foco) {
    var y = window.scrollY; inicio(); window.scrollTo(0, y);
    var x = foco && (document.getElementById(foco) || document.querySelector(foco)); if (x) x.focus({ preventScroll: true });
  }
  // «¿A qué universidad quieres entrar?»: cómo califica cada una (datos verificados de paa-universidades.js, con su fuente)
  function uniHTML() {
    if (!unis().length) return '';
    var id = uniId(), u = uniInfo();
    var ops = unis().map(function (x) { return { id: x.id, nombre: x.nombre }; }).concat([{ id: 'otra', nombre: 'Otra o aún no sé' }]);
    var det = '';
    if (u) det = '<div class="sim-uni-det"><p><b>Cómo usa la PAA:</b> ' + esc(u.explica) + '</p>' +
      (u.sinMinimo ? '<p class="sim-uni-aviso">Esta universidad no publica un puntaje mínimo; revisa su convocatoria.</p>' : '') +
      '<p class="sim-nota">Fuente: <a href="' + esc(u.fuente.url) + '" target="_blank" rel="noopener">' + esc(u.fuente.nombre) + '</a> (' + esc(u.cita) + '), revisada el ' + esc(u.verificado) + '. <a href="' + esc(u.pagina) + '" target="_blank" rel="noopener">Más sobre la PAA y ' + esc(u.art + ' ' + u.nombre) + '</a>.</p>' +
      (u.metaSeccion && meta() !== u.metaSeccion ? '<button class="btn blanco chico" id="uni-meta" type="button">Usar ' + u.metaSeccion + ' como mi meta por sección</button>' : '') + '</div>';
    else if (id === 'otra') det = '<div class="sim-uni-det"><p>Verás tu puntaje en la escala del College Board: cada parte de la PAA va de 200 a 800. Cada universidad lo usa distinto; revisa su convocatoria.</p></div>';
    return '<div class="sim-uni"><span class="etiqueta" id="uni-t">Tu universidad</span><h3>¿A qué universidad quieres entrar?</h3>' +
      (id ? '' : '<p class="sim-nota">Así te mostramos tu puntaje como lo usa esa universidad (no todas califican igual).</p>') +
      '<div class="sim-uni-ops" role="radiogroup" aria-labelledby="uni-t">' + ops.map(function (o) {
        return '<button type="button" class="sim-chip-uni' + (o.id === id ? ' sel' : '') + '" role="radio" aria-checked="' + (o.id === id) + '" data-uni="' + o.id + '">' + esc(o.nombre) + '</button>';
      }).join('') + '</div>' + det + '</div>';
  }
  function metaNota(m) {
    var u = uniInfo();
    if (u && u.escala === 'total') return 'Cada sección va de 200 a 800. Para ' + esc(laUni(u)) + ' cuenta el total (Lectura y Redacción + Matemáticas): con ' + m + ' por sección llegarías a <b>' + L.miles(L.metaEnEscala(m, u)) + '</b> de 1,600' + (u.minimos ? '; el mínimo es ' + L.miles(u.minimos.total) + '.' : '.');
    return 'La PAA califica cada sección de 200 a 800. ' + (u ? '' : 'Pregunta en tu universidad el puntaje que piden y ajústalo aquí.');
  }
  // Puntaje de un resultado como lo ve su universidad: { html corto, detalle } (o null si no aplica)
  function laUni(u) { return u.art + ' ' + u.nombre; }
  function puntajeUniHTML(res) {
    var u = uniInfo(); if (!u || !esPAA()) return null;
    var p = L.puntajeUni(res, u); if (!p) return null;
    if (p.escala === 'total') {
      var c = L.cumpleMinimos(p.partes, u);
      return { corto: 'Para ' + esc(laUni(u)) + ': <b class="num">' + L.miles(p.valor) + '</b> de 1,600',
        detalle: 'Lectura y Redacción ' + p.partes.verbal + ' + Matemáticas ' + p.partes.mate + ' = <b>' + L.miles(p.valor) + '</b> de 1,600' +
          (c ? (c.todo ? ' · <span class="sim-si">cumple los mínimos de ' + esc(laUni(u)) + '</span>' : ' · <span class="sim-no">abajo del mínimo de ' + esc(laUni(u)) + ' (' + L.miles(u.minimos.total) + ' total, ' + u.minimos.verbal + ' por parte)</span>') : u.ref ? ' · referencia: ' + esc(u.ref.texto) + ' ' + L.miles(u.ref.valor) : '') };
    }
    return { corto: 'Escala del College Board (200 a 800)', detalle: 'Escala del College Board (200 a 800). Esta universidad no publica un puntaje mínimo; revisa su convocatoria.' };
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
      (u.global != null ? '<p>' + (esPAA() ? 'Puntaje estimado' : 'Aciertos estimados') + ': <b class="num">' + unidad(u.global) + '</b>' + (esPAA() ? ' por sección' : '') + ' · meta ' + (u.meta || meta()) + '</p>' : '') +
      (function () { var x = puntajeUniHTML(u); return x ? '<p class="sim-nota">' + x.detalle + '</p>' : ''; })() +
      '<p class="sim-nota">' + fecha(u.fecha) + '</p></div></div></div>';
  }
  function historial() {
    if (!YO.historial.length) return '';
    var idx = [];
    YO.historial.forEach(function (x, i) { if (esIntento(x.modo) && x.global != null && idx.length < 8) idx.push(i); });
    idx.reverse();
    var graf = idx.length >= 2 ? graficaHistorial(idx) : '';
    return '<h2 class="sim-h2">Tu avance</h2>' + graf + '<ul class="sim-hist">' + YO.historial.slice(0, 8).map(function (x, i) {
      var t = x.modo === 'examen' ? 'Examen completo' : x.modo === 'calentamiento' ? 'Calentamiento' : x.modo === 'completo' ? 'Nivel Medio' : x.modo === 'seccion' ? seccion((x.secciones[0] || {}).id).nombre : 'Práctica de temas';
      var ok = x.secciones.reduce(function (a, s) { return a + s.aciertos; }, 0), tot = x.secciones.reduce(function (a, s) { return a + s.total; }, 0);
      return '<li><button data-hist="' + i + '"><span><b>' + esc(t) + '</b><small>' + fecha(x.fecha) + '</small></span><span class="num">' + (x.global != null && esIntento(x.modo) ? unidad(x.global) : pct(ok, tot) + ' %') + '</span>' + FL + '</button></li>';
    }).join('') + '</ul>';
  }
  // Gráfica de avance (una serie): cada barra es un botón con su puntaje, tipo y fecha; la elegida va en color de acento
  // y su detalle completo aparece abajo. El eje no empieza en el mínimo de la escala si eso aplana las barras (y lo dice).
  var GH = null;   // { barras, idx, sel } de la gráfica pintada
  function escalaGrafica() {
    var u = uniInfo();
    if (!esPAA()) return { lim: { min: 0, max: CFG.examenReactivos }, valor: function (x) { return x.global; }, meta: meta(), unidad: 'aciertos', nombre: 'Aciertos estimados (de ' + CFG.examenReactivos + ')' };
    if (u && u.escala === 'total') return { lim: { min: 400, max: 1600 }, valor: function (x) { var p = L.puntajeUni(x, u); return p ? p.valor : null; }, meta: L.metaEnEscala(meta(), u), ref: u.ref, unidad: 'puntos', u: u,
      nombre: 'Total PAA estimado para ' + laUni(u) + ' (Lectura y Redacción + Matemáticas, de 400 a 1,600)' };
    return { lim: { min: 200, max: 800 }, valor: function (x) { return x.global; }, meta: meta(), unidad: 'puntos', nombre: 'Puntaje estimado por sección (escala de 200 a 800)' };
  }
  function graficaHistorial(idx) {
    var E = escalaGrafica();
    var d = L.datosGrafica(idx.map(function (i) { return YO.historial[i]; }), { valor: E.valor, lim: E.lim, meta: E.meta, ref: E.ref, unidad: E.unidad });
    if (d.barras.length < 2) { GH = null; return ''; }
    GH = { barras: d.barras, idx: idx, sel: d.barras.length - 1, E: E };
    var recorte = d.eje.min > E.lim.min || d.eje.max < E.lim.max;
    var lineas = d.ticks.map(function (t) { return '<span class="sim-gh-tick" style="bottom:' + t.pos + '%"><i>' + t.texto + '</i></span>'; }).join('') +
      (d.meta ? '<span class="sim-gh-linea meta" style="bottom:' + d.meta.pos + '%"></span>' : '') +
      (d.ref ? '<span class="sim-gh-linea ref" style="bottom:' + d.ref.pos + '%"></span>' : '');
    var leyenda = (d.meta ? '<span><i class="sim-gh-ley meta"></i>Tu meta: ' + L.miles(d.meta.valor) + (E.u ? ' (' + meta() + ' × 2)' : '') + '</span>' : '') +
      (d.ref ? '<span><i class="sim-gh-ley ref"></i>' + esc(d.ref.texto) + ': ' + L.miles(d.ref.valor) + '</span>' : '');
    var barras = d.barras.map(function (b, k) {
      return '<button type="button" class="sim-gh-b' + (k === GH.sel ? ' sel' : '') + '" data-gh="' + k + '" aria-pressed="' + (k === GH.sel) + '" aria-label="' + esc(b.etiqueta) + '"' + (k === GH.sel ? '' : ' tabindex="-1"') + '>' +
        '<span class="sim-gh-plot" aria-hidden="true"><span class="sim-gh-barra" style="height:' + b.alto + '%"></span><span class="sim-gh-v num" style="bottom:' + b.alto + '%">' + b.texto + '</span></span>' +
        '<span class="sim-gh-f" aria-hidden="true">' + esc(b.fechaCorta) + '<small>' + esc(b.hora) + '</small></span></button>';
    }).join('');
    return '<figure class="sim-card sim-gh"><figcaption><b>' + esc(E.nombre) + '</b><small>' + (recorte ? 'El eje va de ' + L.miles(d.eje.min) + ' a ' + L.miles(d.eje.max) + ' (no desde ' + L.miles(E.lim.min) + ') para que se noten las diferencias. ' : '') + 'Toca o pasa sobre una barra para ver su detalle.</small></figcaption>' + (leyenda ? '<div class="sim-gh-leyenda">' + leyenda + '</div>' : '') +
      '<div class="sim-gh-area"><div class="sim-gh-ejes" aria-hidden="true">' + lineas + '</div>' +
      '<div class="sim-gh-barras" role="group" aria-label="Tus simulacros completos, del más antiguo al más reciente. Usa las flechas para moverte.">' + barras + '</div></div>' +
      '<div class="sim-gh-det" id="gh-det" aria-live="polite">' + detalleBarra(GH.sel) + '</div></figure>';
  }
  function detalleBarra(k) {
    var b = GH.barras[k], i = GH.idx[b.indice], x = YO.historial[i], E = GH.E, u = E.u, extra = '';
    if (u) { var p = L.puntajeUni(x, u); if (p) extra = '<span>Lectura y Redacción ' + p.partes.verbal + ' + Matemáticas ' + p.partes.mate + '</span>'; }
    var falta = E.meta != null ? E.meta - b.valor : null;
    return '<div><b class="sim-gh-dv num">' + b.texto + ' <small>' + (E.unidad === 'aciertos' ? 'aciertos' : 'puntos') + '</small></b>' +
      '<span class="sim-gh-dt">' + esc(b.tipo) + '</span><span>' + esc(b.fechaLarga) + '</span>' + extra +
      (falta != null ? '<span>' + (falta > 0 ? 'A ' + L.miles(falta) + ' de tu meta (' + L.miles(E.meta) + ')' : 'Alcanza tu meta (' + L.miles(E.meta) + ')') + '</span>' : '') + '</div>' +
      '<button type="button" class="btn blanco chico" data-hist="' + i + '">Ver reporte ' + FL + '</button>';
  }
  function conectarGrafica() {
    if (!GH) return;
    var bs = app.querySelectorAll('[data-gh]');
    function elegir(k, foco) {
      GH.sel = k;
      bs.forEach(function (b, j) { var s = j === k; b.classList.toggle('sel', s); b.setAttribute('aria-pressed', s); b.tabIndex = s ? 0 : -1; });
      var det = document.getElementById('gh-det'); det.innerHTML = detalleBarra(k);
      det.querySelector('[data-hist]').onclick = function () { reporte(YO.historial[Number(this.dataset.hist)], true); };
      if (foco) bs[k].focus();
    }
    bs.forEach(function (b, k) {
      b.onclick = function () { elegir(k); };
      b.onmouseenter = function () { if (window.matchMedia && matchMedia('(hover: hover)').matches) elegir(k); };
      b.onkeydown = function (e) {
        var n = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? bs.length - 1 : null;
        if (n == null) return; e.preventDefault(); elegir(clamp(n, 0, bs.length - 1), true);
      };
    });
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
      (practica ? '<div class="sim-vintro">' + s.temas.map(function (t) { return cajaVideos(t, false); }).join('') + '</div>' : '') +
      '<ul class="sim-datos"><li><b class="num">' + s.items.length + '</b><span>reactivos</span></li>' + (s.limite ? '<li><b class="num">' + Math.round(s.limite / 60) + '</b><span>minutos</span></li><li><b class="num">' + Math.round(s.limite / s.items.length) + ' s</b><span>por reactivo</span></li>' : '<li><b>Libre</b><span>tiempo</span></li>') + '</ul>' +
      '<div class="sim-reglas"><h2>Cómo funciona</h2><ol>' +
        '<li><b>Primer intento.</b> Elige tu respuesta y confírmala. Este intento es el que cuenta para tu resultado, como en el examen real.</li>' +
        '<li><b>Si fallas,</b> el tutor no te da la respuesta: te explica el concepto y cómo resolverlo para que lo intentes otra vez.</li>' +
        '<li><b>Segundo intento.</b> Aciertes o no, verás la solución paso a paso y la regla teórica detrás.</li>' +
        (s.limite ? '<li><b>El cronómetro</b> solo corre mientras respondes por primera vez; leer pistas y explicaciones no te quita tiempo.</li>' : '') +
      '</ol></div>' +
      '<div class="botones"><button class="btn tinta" id="b-go">' + (s.idx ? 'Continuar sección' : 'Empezar') + ' ' + FL + '</button><button class="btn blanco" id="b-inicio">Volver al inicio</button></div></section>');
    document.getElementById('b-go').onclick = function () { run.fase = 'preguntas'; guardar(K_RUN, run); pregunta(); };
    if (practica) llenarVideos();
    document.getElementById('b-inicio').onclick = inicio;
  }

  function estadoDe(id) { return run.resp[id] || (run.resp[id] = { fase: 'r1', sel1: null, sel2: null, t: 0 }); }
  function pregunta() {
    var s = secActual(), id = s.items[s.idx], r = R[id], st = estadoDe(id);
    var texto = r.texto ? B.textos[r.texto] : null;
    var orden = run.orden[id] || indices(r);
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
    if (st.fase === 'r2') return '<div class="sim-tutor pista" role="status"><div class="sim-tutor-i">' + ICONO.foco + '</div><div><b>Todavía no. Pista del tutor</b><p>' + letras(r.pista, orden) + '</p><small>Tienes un intento más. Esta vez te mostraremos la solución completa.</small>' + cajaVideos(r.tema, true) + '</div></div>';
    var ok1 = st.ok1, ok2 = st.ok2;
    var titulo = ok1 ? '¡Correcto a la primera!' : ok2 ? 'Bien, lo lograste en el segundo intento' : st.sinTiempo ? 'Se acabó el tiempo en este reactivo' : 'Esta era la respuesta correcta';
    var correcta = r.tipo === 'abierta' ? r.respuestas[0] : LETRAS[orden.indexOf(r.correcta)] + ') ' + r.opciones[r.correcta];
    var ultimo = secActual().idx >= secActual().items.length - 1;
    return '<div class="sim-tutor ' + (ok1 || ok2 ? 'bien' : 'sol') + '" role="status"><div class="sim-tutor-i">' + (ok1 || ok2 ? ICONO.ok : ICONO.libro) + '</div><div>' +
      '<b>' + titulo + '</b><p class="sim-correcta">Respuesta: <b>' + rico(correcta) + '</b></p>' +
      '<details' + (ok1 ? '' : ' open') + '><summary>Solución paso a paso</summary><ol class="sim-pasos">' + r.pasos.map(function (p) { return '<li>' + letras(p, orden) + '</li>'; }).join('') + '</ol>' +
      '<div class="sim-regla"><span>La regla</span><p>' + letras(r.regla, orden) + '</p></div></details>' + (ok1 ? '' : cajaVideos(r.tema, true)) + apunteHTML(r) + '</div></div>' +
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
    conectarApunte(r);
    llenarVideos();
    void orden;
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || !app.querySelector('.sim-q') || VP) return;
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
  // Con CFG.ponderacion ({ seccion: peso en % }, p. ej. la ficha técnica de la prepa UG): aciertos de cada área por su peso, sobre 100
  function ponderadoHTML(res, secs) {
    var P = CFG.ponderacion; if (!P || !esIntento(res.modo)) return '';
    var ids = Object.keys(P); if (!ids.every(function (k) { return secs.some(function (s) { return s.id === k && s.total; }); })) return '';
    var v = secs.reduce(function (a, s) { return a + (P[s.id] || 0) * s.aciertos / s.total; }, 0);
    return '<p class="sim-global">' + esc(CFG.ponderacionNombre || 'Con los pesos del examen') + ' <b class="num">' + Math.round(v) + '</b><small> / 100</small></p>';
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
        var r = R[id]; if (!r) return ''; var st = res.resp[id] || {}, orden = (res.orden || {})[id] || indices(r);
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
        '<div class="sim-hero-t"><b class="sim-estado e-' + e.clase + '">' + e.nombre + '</b>' + (res.global != null ? '<p class="sim-global">' + (esPAA() ? 'Puntaje estimado' : 'Aciertos estimados') + ' <b class="num">' + res.global + '</b><small> / ' + rango().max + (esPAA() ? ' por sección' : '') + ' · meta ' + m + '</small></p>' : '') + ponderadoHTML(res, secs) +
        (function () { var x = esIntento(res.modo) && puntajeUniHTML(res); return x ? '<p class="sim-uni-rep">' + x.detalle + '</p>' : ''; })() +
        '<p>' + mensaje(res, c) + '</p></div></div>' + htmlListo +
      '<p class="sim-aviso-g" id="aviso-guardar" hidden>No pudimos guardar este resultado (sin conexión). Se guardará en tu historial la próxima vez que abras el simulador con internet.</p>' +
      '<div class="sim-grid2' + (htmlSecs ? '' : ' uno') + '">' + htmlSecs + htmlTutor + '</div>' +
      htmlRefuerza +
      (htmlFuertes ? '<div class="sim-grid2">' + htmlTemas + htmlFuertes + '</div>' : '<div class="sim-grid2 uno">' + htmlTemas + '</div>') +
      revision +
      '<p class="sim-nota sim-disc">' + (esPAA() ? 'El puntaje es una estimación de Vorka México basada en tus aciertos ponderados por dificultad; no es una calificación oficial del College Board.' : 'Los aciertos estimados se calculan sobre un examen de ' + CFG.examenReactivos + ' reactivos con reactivos originales de Vorka México; no es un resultado oficial de ' + esc(CFG.oficial) + '.') + ' Úsalo para orientar tu estudio y medir tu avance.</p>' +
      regaloHTML() +
      sparks('reporte') +
      '<div class="botones sim-fin"><button class="btn tinta" id="b-inicio">Volver al inicio</button>' + (res.modo === 'practica' && L.hayTemas(B) ? '<button class="btn blanco" id="b-otros-temas">Elegir otros temas</button>' : '') + (esIntento(res.modo) ? '' : '<button class="btn blanco" data-modo-otra="completo">Hacer un simulacro corto</button>') + '</div>' +
      '</section>');
    document.getElementById('b-inicio').onclick = inicio;
    var bot = document.getElementById('b-otros-temas'); if (bot) bot.onclick = function () { elegirTemas(); };
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

  // ---------- La app de estudio: instalarla, plan de estudio, recordatorios y apuntes ----------
  // Instalar: todos. Plan, recordatorios y apuntes: plan Completo (YO.plan.estudio; api/estudio, src/simulador/estudio.js).
  var EST = null, EST_CARGANDO = false, PROMPT_INSTALAR = null, K_INST;
  var TZ_MX = 'America/Mexico_City';
  var DIAS_C = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
  function tieneEstudio() { return !!(YO.plan && YO.plan.estudio); }
  function hoyMx() { return L.diaDe(new Date(), TZ_MX); }
  function standalone() { return !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true); }
  function esIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function pushPosible() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); PROMPT_INSTALAR = e; var b = document.getElementById('b-instalar'); if (b) b.hidden = false; });
  window.addEventListener('appinstalled', function () { PROMPT_INSTALAR = null; var c = document.querySelector('.sim-instalar'); if (c) c.remove(); });
  function registrarSW() {
    if (!('serviceWorker' in navigator)) return Promise.resolve(null);
    return navigator.serviceWorker.register(RUTA + '/sw.js', { scope: RUTA + '/' }).catch(function () { return null; });
  }
  function cargarEstudio() {
    if (!tieneEstudio()) return Promise.resolve(null);
    if (EST) return Promise.resolve(EST);
    if (EST_CARGANDO) return EST_CARGANDO;
    EST_CARGANDO = api('estudio').then(function (d) { EST = d; return d; }, function () { return null; }).then(function (d) { EST_CARGANDO = false; return d; });
    return EST_CARGANDO;
  }
  function apunteDe(ref) { var a = (EST && EST.apuntes) || []; for (var i = 0; i < a.length; i++) if (a[i].ref === ref) return a[i]; return null; }
  function nombreTema(id) { return B.temas[id] ? B.temas[id].nombre : 'Tema'; }
  function listaY(n) { return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1]; }
  // "jueves 12 de noviembre"
  function diaLargo(d) { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }); } catch (e) { return d; } }
  function diaCorto(d) { try { var t = new Date(d + 'T12:00:00Z').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(/\./g, '').replace(/,/g, ''); return t.charAt(0).toUpperCase() + t.slice(1); } catch (e) { return d; } }
  function horaTxt(h) { return (h % 12 || 12) + ':00 ' + (h < 12 ? 'a. m.' : 'p. m.'); }
  // La sesión de hoy o la siguiente
  function proximaSesion() { var e = EST && EST.estudio, h = hoyMx(); if (!e) return null; for (var i = 0; i < e.sesiones.length; i++) if (e.sesiones[i].f >= h) return e.sesiones[i]; return null; }
  function queToca(s) {
    if (s.k === 'simulacro') return 'Simulacro de nivel Medio para medir cuánto has subido';
    var n = s.t.map(nombreTema);
    if (s.k === 'repaso') return 'Repaso final' + (n.length ? ': ' + listaY(n) : '') + ' y tus apuntes';
    return n.length ? listaY(n) : 'Tus temas más débiles';
  }

  // ---------- tarjeta del inicio ----------
  function tarjetaEstudio() { return instalarHTML() + estudioHTML(); }
  function instalarHTML() {
    // La app instalable con recordatorios es del plan Completo
    if (!tieneEstudio() || standalone() || leer(K_INST)) return '';
    var ios = esIOS();
    return '<div class="sim-card sim-instalar"><img class="sim-instalar-i" src="' + esc(SIM.icono || '') + '" alt="" width="56" height="56"><div class="sim-instalar-t"><b>Instala tu simulador como app</b>' +
      '<small>Un acceso directo en tu pantalla de inicio: lo abres con un toque y te llegan los recordatorios de tu plan de estudio.</small>' +
      '<div class="botones">' + (ios ? '' : '<button class="btn tinta chico" id="b-instalar" type="button"' + (PROMPT_INSTALAR ? '' : ' hidden') + '>Instalar</button>') +
      '<button class="btn ' + (ios ? 'tinta' : 'blanco') + ' chico" type="button" data-ir="instalar">Cómo instalarla</button><button class="sim-link" type="button" id="b-inst-no">Ahora no</button></div></div></div>';
  }
  function estudioHTML() {
    if (!tieneEstudio()) return estudioBloqueado();
    if (!EST) return '<div class="sim-card sim-est"><span class="etiqueta">Tu plan de estudio</span><p class="sim-nota"><span class="sim-giro chico" aria-hidden="true"></span> Cargando tu plan…</p></div>';
    var e = EST.estudio, nAp = (EST.apuntes || []).length;
    var links = '<div class="sim-est-links"><button type="button" class="sim-est-link" data-ir="plan">' + ICONO.reloj + '<span>' + (e ? 'Mi plan y recordatorios' : 'Armar mi plan') + '</span></button><button type="button" class="sim-est-link" data-ir="apuntes">' + ICONO.lapiz + '<span>Mis apuntes' + (nAp ? ' <b class="num">' + nAp + '</b>' : '') + '</span></button>' +
      (VID && VID.videos && VID.videos.length && !VID.bloqueado ? '<button type="button" class="sim-est-link" data-ir="videos">' + ICONO.play + '<span>Videos de los temas</span></button>' : '') + '</div>';
    if (!e) return '<div class="sim-card sim-est sim-est-nuevo"><span class="etiqueta">Tu plan de estudio</span><h2>¿Cuándo es tu examen?</h2><p>Dinos la fecha y los días que puedes estudiar: te repartimos los temas hasta ese día, empezando por los que más te cuestan, y te recordamos en tu celular cuándo te toca.</p><div class="botones"><button class="btn tinta" type="button" data-ir="plan">Armar mi plan ' + FL + '</button></div>' + links + '</div>';
    var hoy = hoyMx(), faltan = L.diasEntre(hoy, e.fecha_examen);
    if (faltan < 0) return '<div class="sim-card sim-est"><span class="etiqueta">Tu plan de estudio</span><h2>Tu examen ya pasó</h2><p>Esperamos que te haya ido increíble. ¿Vas a presentar otra vez? Pon la nueva fecha y armamos otro plan.</p><div class="botones"><button class="btn tinta" type="button" data-ir="plan">Nueva fecha ' + FL + '</button></div>' + links + '</div>';
    var hechas = L.sesionesHechas(e.sesiones, YO.historial, TZ_MX), nHechas = e.sesiones.filter(function (x) { return hechas[x.f]; }).length;
    var s = proximaSesion(), esHoy = s && s.f === hoy, lista = s && esHoy && hechas[hoy];
    var cuenta = faltan === 0 ? '<b>¡Hoy!</b>' : '<b class="num">' + faltan + '</b><small>' + (faltan === 1 ? 'día' : 'días') + '</small>';
    var cuerpo;
    if (faltan === 0) cuerpo = '<h2>¡Hoy es tu examen!</h2><p>Lee con calma cada pregunta y administra tu tiempo. Ya te preparaste: ¡mucho éxito!</p>';
    else if (!s) cuerpo = '<h2>Ya no hay sesiones antes de tu examen</h2><p>Repasa tus apuntes y descansa bien la noche anterior.</p>';
    else cuerpo = '<h2>' + (lista ? '¡Sesión de hoy lista! ' + ICONO.ok : esHoy ? 'Hoy toca' : 'Siguiente sesión: ' + esc(diaLargo(s.f))) + '</h2>' +
      '<p class="sim-est-que">' + esc(queToca(s)) + '</p>' +
      (esHoy && !lista ? '<div class="botones"><button class="btn tinta" type="button" data-estudiar="' + s.f + '">Estudiar ahora ' + FL + '</button></div>' : esHoy ? '<p class="sim-nota">Si quieres más, practica otro tema o adelanta la siguiente sesión.</p><div class="botones"><button class="btn blanco chico" type="button" data-estudiar="' + s.f + '">Practicar otra vez</button></div>' : '<div class="botones"><button class="btn blanco chico" type="button" data-estudiar="' + s.f + '">Adelantarla hoy</button></div>');
    var avance = e.sesiones.length ? '<div class="sim-est-av"><div class="sim-banco-p" role="progressbar" aria-valuemin="0" aria-valuemax="' + e.sesiones.length + '" aria-valuenow="' + nHechas + '" aria-label="Sesiones cumplidas"><span style="width:' + pct(nHechas, e.sesiones.length) + '%"></span></div><small>' + nHechas + ' de ' + e.sesiones.length + ' sesiones cumplidas</small></div>' : '';
    var rec = e.recordatorios ? '' : '<p class="sim-nota sim-est-rec">' + ICONO.campana + '<span><button type="button" class="sim-link" data-ir="plan">Activa tus recordatorios</button> para que no se te pase ningún día.</span></p>';
    return '<div class="sim-card sim-est"><div class="sim-est-cab"><span class="etiqueta">Tu plan de estudio</span><span class="sim-est-faltan" title="Para tu examen">' + cuenta + '</span></div>' + cuerpo + avance + rec + links + '</div>';
  }
  // Sin plan Completo: lo que le falta para tenerlo (Práctica + Examen = Completo)
  function estudioBloqueado() {
    var falta = puedePracticar() && !tieneExamen() ? 'completo' : !puedePracticar() ? 'practica' : null;
    var o = falta && (YO.ofertas || {})[falta];
    return '<div class="sim-card sim-est sim-est-bloq"><span class="sim-op-tag n3">Plan Completo</span><h2>Tu plan de estudio, recordatorios y apuntes</h2>' +
      '<ul class="sim-plan-l">' + ['Un plan día por día hasta tu examen, empezando por tus temas débiles', 'Recordatorios en tu celular a la hora que elijas', 'Tus apuntes de cada pregunta y tema, en todos tus dispositivos'].map(function (t) { return '<li>' + ICONO.ok + '<span>' + t + '</span></li>'; }).join('') + '</ul>' +
      (o ? '<button class="btn tinta" type="button" data-plan="' + falta + '">Completar mi plan · ' + precio(o.precio_centavos) + '</button><p class="sim-nota">Te sumamos ' + (falta === 'completo' ? 'el Examen (2 exámenes completos)' : 'la Práctica sin límite') + ' y tu cuenta queda con el plan Completo.</p>' : '<p class="sim-nota">Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> para sumarlo a tu cuenta.</p>') + '</div>';
  }
  function conectarEstudio() {
    var caja = document.getElementById('est-card'); if (!caja) return;
    caja.querySelectorAll('[data-ir]').forEach(function (b) { b.onclick = function () { ir(b.dataset.ir); }; });
    caja.querySelectorAll('[data-estudiar]').forEach(function (b) { b.onclick = function () { estudiarSesion(b.dataset.estudiar); }; });
    caja.querySelectorAll('[data-plan]').forEach(function (b) { b.onclick = function () { comprarPlan(b.dataset.plan); }; });
    var bi = document.getElementById('b-instalar'); if (bi) bi.onclick = function () { if (!PROMPT_INSTALAR) return ir('instalar'); PROMPT_INSTALAR.prompt(); PROMPT_INSTALAR.userChoice.finally(function () { PROMPT_INSTALAR = null; bi.hidden = true; }); };
    var bn = document.getElementById('b-inst-no'); if (bn) bn.onclick = function () { guardar(K_INST, 1); var c = caja.querySelector('.sim-instalar'); if (c) c.remove(); };
    if (tieneEstudio() && (!EST || !VID)) Promise.all([cargarEstudio(), cargarVideos()]).then(function () { var c = document.getElementById('est-card'); if (c) { c.innerHTML = tarjetaEstudio(); conectarEstudio(); } });
  }
  function ir(a) { if (a === 'plan') pantallaPlan(); else if (a === 'apuntes') pantallaApuntes(); else if (a === 'instalar') guiaInstalar(); else if (a === 'videos') pantallaVideos(); else inicio(); }
  function estudiarSesion(f) {
    var e = EST && EST.estudio, s = null; if (!e) return;
    for (var i = 0; i < e.sesiones.length; i++) if (e.sesiones[i].f === f) s = e.sesiones[i];
    if (!s) return;
    if (run && run.fase !== 'fin' && !confirm(esIntento(run.modo) ? 'Tienes un simulacro sin terminar. Termínalo primero o descártalo desde el inicio.' : 'Tienes una práctica sin terminar. ¿Empezar la sesión de hoy y descartarla?')) return;
    if (run && run.fase !== 'fin' && esIntento(run.modo)) return inicio();
    if (s.k === 'simulacro') return empezar('completo');
    var temas = s.t.length ? s.t : L.temasDebiles(L.desempenoTemas(YO.historial), B.temas, 3, 1).map(function (t) { return t.id; });
    if (!temas.length) temas = Object.keys(B.temas).slice(0, 2);
    practicaN = s.k === 'repaso' ? 20 : 10;
    empezar('practica', temas);
  }

  // ---------- guía para instalar ----------
  function guiaInstalar() {
    detenerReloj(); pintarBarra();
    var ios = esIOS(), android = /Android/.test(navigator.userAgent);
    var compartir = '<svg class="sim-ico-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-label="Compartir"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8"/></svg>';
    var pasosIOS = ['Abre esta página en <b>Safari</b> (en otro navegador el iPhone no deja instalarla).', 'Toca el botón <b>Compartir</b> ' + compartir + ' (abajo, o arriba en iPad).', 'Desliza y elige <b>Agregar a inicio</b>. Luego toca <b>Agregar</b>.', 'Abre el simulador desde el ícono del librito en tu pantalla de inicio.'];
    var pasosAndroid = ['Abre esta página en <b>Chrome</b>.', 'Toca el menú <b>⋮</b> (arriba a la derecha).', 'Elige <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.', 'Abre el simulador desde el ícono del librito.'];
    var pasosPC = ['En Chrome o Edge, busca el ícono de <b>instalar</b> al final de la barra de direcciones.', 'Haz clic en <b>Instalar</b>.', 'El simulador se abre en su propia ventana y queda en tus aplicaciones.'];
    var bloque = function (t, p, abierto) { return '<details class="sim-card sim-guia"' + (abierto ? ' open' : '') + '><summary><b>' + t + '</b></summary><ol class="sim-guia-l">' + p.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol></details>'; };
    h('<section class="sim-intro sim-inst"><img class="sim-instalar-i grande" src="' + esc(SIM.icono || '') + '" alt="" width="88" height="88"><h1>Instala tu simulador</h1>' +
      '<p class="sim-lead">Es un acceso directo que funciona como app en iPhone, Android y computadora (no se descarga de ninguna tienda): la abres con un toque y te llegan los recordatorios de tu plan de estudio.</p>' +
      bloque('iPhone o iPad', pasosIOS, ios) + bloque('Android', pasosAndroid, android) + bloque('Computadora', pasosPC, !ios && !android) +
      '<div class="sim-card sim-guia-nota"><p><b>La primera vez que abras la app</b> puede pedirte tu correo: te mandamos un código de 6 dígitos y listo. Tu cuenta funciona en máximo 2 dispositivos: la app y el navegador del mismo celular cuentan como uno, así que al entrar en la app cerramos la sesión del navegador de ese celular.</p></div>' +
      '<div class="botones"><button class="btn tinta" id="b-inicio" type="button">Volver al inicio</button></div></section>');
    document.getElementById('b-inicio').onclick = inicio;
  }

  // ---------- plan de estudio ----------
  function temasDelBanco() { return L.temasPorSeccion(B, {}).reduce(function (a, g) { return a.concat(g.temas.map(function (t) { return { id: t.id, nombre: t.nombre, seccion: g.id }; })); }, []); }
  function pantallaPlan() {
    detenerReloj(); pintarBarra();
    if (!tieneEstudio()) return inicio();
    if (!EST) { h('<div class="sim-cargando"><span class="sim-giro" aria-hidden="true"></span>Cargando tu plan…</div>'); cargarEstudio().then(function (d) { if (d) pantallaPlan(); else inicio(); }); return; }
    var e = EST.estudio, hoy = hoyMx(), manana = L.masDias(hoy, 1);
    var dias = e ? e.dias : [1, 2, 3, 4, 5], hora = e ? e.hora : 19, rec = e ? e.recordatorios : true;
    var horas = []; for (var x = 6; x <= 22; x++) horas.push(x);
    var ios = esIOS() && !standalone();
    var recHTML = !pushPosible() || ios
      ? '<div class="sim-pe-rec sim-pe-rec-no">' + ICONO.campana + '<div><b>Recordatorios en tu celular</b><p class="sim-nota">' + (ios ? 'En iPhone, primero instala la app en tu pantalla de inicio y actívalos desde ahí. <button type="button" class="sim-link" data-ir="instalar">Cómo instalarla</button>' : 'Este navegador no permite recordatorios. Ábrelo en Chrome, Edge o Safari, o instala la app.') + '</p></div></div>'
      : '<label class="sim-pe-rec sim-casilla"><input type="checkbox" id="pe-rec"' + (rec ? ' checked' : '') + '><span><b>Recordarme en este dispositivo</b><small id="pe-rec-estado">Te avisamos los días que elegiste, a esa hora, qué tema te toca.</small></span></label>';
    var calendario = e && e.sesiones.length ? calendarioHTML(e) : '';
    // Temas que quiere reforzar (opcional), agrupados por sección; los que más le cuestan llevan una marca
    var elegidos = e && e.temas ? e.temas : [], grupos = L.temasPorSeccion(B, {});
    var cuesta = {}; L.temasDebiles(L.desempenoTemas(YO.historial), B.temas, 6, 2).forEach(function (x) { cuesta[x.id] = true; });
    var cuentaTxt = function (n) { return n ? n + (n === 1 ? ' elegido' : ' elegidos') : ''; };
    var temasHTML = !grupos.length ? '' : '<fieldset class="sim-pe-campo"><legend>¿Qué temas quieres reforzar? <small class="sim-nota">(opcional)</small></legend>' +
      '<p class="sim-nota">Los que elijas van primero y se repiten en los repasos. Si no eliges ninguno, el plan empieza por los que más te cuestan.</p>' +
      grupos.map(function (g) {
        var n = g.temas.filter(function (x) { return elegidos.indexOf(x.id) >= 0; }).length;
        return '<details class="sim-pe-grupo"' + (n || grupos.length === 1 ? ' open' : '') + '><summary><span>' + esc(g.nombre) + '</span><small class="sim-pe-cuenta" data-cuenta="' + esc(g.id) + '">' + cuentaTxt(n) + '</small></summary><div class="sim-pe-temas">' +
          g.temas.map(function (x) {
            return '<label class="sim-pe-tema"><input type="checkbox" name="pe-tema" value="' + esc(x.id) + '" data-grupo="' + esc(g.id) + '"' + (elegidos.indexOf(x.id) >= 0 ? ' checked' : '') + '><span>' + esc(x.nombre) + (cuesta[x.id] ? '<em>Te cuesta</em>' : '') + '</span></label>';
          }).join('') + '</div></details>';
      }).join('') +
      '<label class="sim-casilla sim-pe-solo"><input type="checkbox" id="pe-solo"' + (e && e.solo ? ' checked' : '') + '><span><b>Estudiar solo estos temas</b><small>Tu plan no incluirá los demás temas.</small></span></label></fieldset>';
    h('<section class="sim-intro sim-plan"><span class="sim-paso">Plan Completo</span><h1>Tu plan de estudio</h1>' +
      '<p class="sim-lead">Repartimos los temas en tus días de estudio hasta el examen: primero los que tú elijas reforzar y los que más te cuestan, un simulacro cada 6 sesiones para medir tu avance y un repaso final. Se reajusta cada vez que lo guardas, con tus resultados más recientes.</p>' +
      '<form class="sim-card sim-pe" id="f-pe" novalidate>' +
        '<label class="sim-pe-campo"><span>¿Cuándo es tu examen?</span><input type="date" id="pe-fecha" required min="' + manana + '" value="' + esc(e && e.fecha_examen >= manana ? e.fecha_examen : '') + '"></label>' +
        '<fieldset class="sim-pe-campo"><legend>¿Qué días puedes estudiar?</legend><div class="sim-pe-dias">' + ORDEN_DIAS.map(function (d) {
          return '<label class="sim-pe-dia"><input type="checkbox" name="pe-dia" value="' + d + '"' + (dias.indexOf(d) >= 0 ? ' checked' : '') + '><span>' + DIAS_C[d] + '</span></label>';
        }).join('') + '</div></fieldset>' +
        temasHTML +
        '<label class="sim-pe-campo"><span>¿A qué hora te recordamos?</span><select id="pe-hora">' + horas.map(function (x) { return '<option value="' + x + '"' + (x === hora ? ' selected' : '') + '>' + horaTxt(x) + '</option>'; }).join('') + '</select><small class="sim-nota">Hora del centro de México.</small></label>' +
        recHTML +
        '<p class="sim-error" id="pe-error" role="alert" hidden></p>' +
        '<button class="btn tinta" id="pe-guardar" type="submit">' + (e ? 'Guardar y reajustar mi plan' : 'Armar mi plan') + ' ' + FL + '</button>' +
      '</form>' + calendario +
      '<div class="botones"><button class="btn blanco" id="b-inicio" type="button">Volver al inicio</button>' + (e ? '<button class="sim-link" id="pe-borrar" type="button">Borrar mi plan</button>' : '') + '</div></section>');
    document.getElementById('b-inicio').onclick = inicio;
    app.querySelectorAll('[data-ir]').forEach(function (b) { b.onclick = function () { ir(b.dataset.ir); }; });
    app.querySelectorAll('[data-estudiar]').forEach(function (b) { b.onclick = function () { estudiarSesion(b.dataset.estudiar); }; });
    var pb = document.getElementById('pe-borrar');
    if (pb) pb.onclick = function () {
      if (!confirm('¿Borrar tu plan de estudio? Dejarás de recibir recordatorios. Tus apuntes se quedan.')) return;
      api('estudio/borrar', { method: 'POST', body: '{}' }).then(function () { EST.estudio = null; inicio(); }, function (er) { alert(er.message); });
    };
    // ¿Este dispositivo ya recibe los recordatorios?
    var est = document.getElementById('pe-rec-estado');
    if (est && 'serviceWorker' in navigator) navigator.serviceWorker.getRegistration(RUTA + '/').then(function (reg) { return reg && reg.pushManager.getSubscription(); }).then(function (sub) {
      if (sub && e && e.recordatorios) est.innerHTML = '<span class="sim-si">' + ICONO.ok + ' Este dispositivo ya recibe tus recordatorios.</span>';
    }).catch(function () { });
    app.querySelectorAll('input[name="pe-tema"]').forEach(function (c) {
      c.onchange = function () {
        var g = c.dataset.grupo, n = app.querySelectorAll('input[name="pe-tema"][data-grupo="' + g + '"]:checked').length;
        app.querySelectorAll('[data-cuenta]').forEach(function (s) { if (s.dataset.cuenta === g) s.textContent = cuentaTxt(n); });
      };
    });
    document.getElementById('f-pe').onsubmit = function (ev) {
      ev.preventDefault();
      var err = document.getElementById('pe-error'), btn = document.getElementById('pe-guardar');
      var fecha = document.getElementById('pe-fecha').value;
      var ds = [].map.call(app.querySelectorAll('input[name="pe-dia"]:checked'), function (c) { return Number(c.value); });
      var hr = Number(document.getElementById('pe-hora').value);
      var temas = [].map.call(app.querySelectorAll('input[name="pe-tema"]:checked'), function (c) { return c.value; });
      var solo = !!(document.getElementById('pe-solo') && document.getElementById('pe-solo').checked);
      var quiere = document.getElementById('pe-rec') ? document.getElementById('pe-rec').checked : !!(e && e.recordatorios);
      var falla = function (m) { err.textContent = m; err.hidden = false; btn.disabled = false; btn.innerHTML = (e ? 'Guardar y reajustar mi plan' : 'Armar mi plan') + ' ' + FL; };
      if (!fecha) return falla('Escribe la fecha de tu examen.');
      if (fecha < manana) return falla('La fecha de tu examen tiene que ser a partir de mañana.');
      if (!ds.length) return falla('Elige al menos un día para estudiar.');
      if (solo && !temas.length) return falla('Elige al menos un tema, o quita «Estudiar solo estos temas».');
      err.hidden = true; btn.disabled = true; btn.textContent = 'Guardando…';
      // Lo ya pasado se queda como estaba (para contar lo que cumpliste); de hoy en adelante se vuelve a repartir
      var previas = e ? e.sesiones.filter(function (x) { return x.f < hoy; }) : [];
      var nuevas = L.planEstudio({ hoy: hoy, fechaExamen: fecha, dias: ds, temas: temasDelBanco(), desempeno: L.desempenoTemas(YO.historial), prioridad: temas, solo: solo });
      var guardarPlan = function (conRec) {
        return api('estudio', { method: 'POST', body: JSON.stringify({ fecha_examen: fecha, dias: ds, hora: hr, recordatorios: conRec, sesiones: previas.concat(nuevas).slice(-400), temas: temas, solo: solo }) })
          .then(function (d) { EST = d; pantallaPlan(); var c = document.querySelector('.sim-cal'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      };
      // Sin la casilla (iPhone sin instalar, navegador sin push) se respeta lo que ya tenía; con ella, se activa aquí
      var conCasilla = !!document.getElementById('pe-rec');
      var paso = !conCasilla ? Promise.resolve(!!(e && e.recordatorios)) : !quiere ? Promise.resolve(false)
        : activarPush().then(function () { return true; }, function (m) { alert(m.message || m); return false; });
      paso.then(guardarPlan).catch(function (er) { falla(er.message || 'No pudimos guardar tu plan. Revisa tu conexión.'); });
    };
  }
  function calendarioHTML(e) {
    var hoy = hoyMx(), hechas = L.sesionesHechas(e.sesiones, YO.historial, TZ_MX), semanas = [], actual = null;
    e.sesiones.forEach(function (s) {
      var lunes = L.masDias(s.f, -((L.semanaDe(s.f) + 6) % 7));
      if (!actual || actual.lunes !== lunes) { actual = { lunes: lunes, s: [] }; semanas.push(actual); }
      actual.s.push(s);
    });
    var lunesHoy = L.masDias(hoy, -((L.semanaDe(hoy) + 6) % 7));
    return '<h2 class="sim-h2">Tu calendario</h2><p class="sim-nota" style="margin-top:-6px">Examen: <b>' + esc(diaLargo(e.fecha_examen)) + '</b> · recordatorio a las ' + horaTxt(e.hora) + (e.recordatorios ? '' : ' (apagado)') + '</p><div class="sim-cal">' +
      semanas.map(function (w) {
        var pasada = L.masDias(w.lunes, 6) < hoy, n = w.s.filter(function (s) { return hechas[s.f]; }).length;
        return '<details class="sim-card sim-cal-sem"' + (w.lunes === lunesHoy || (!pasada && w.lunes > lunesHoy && semanas.filter(function (x) { return x.lunes >= lunesHoy; })[0] === w) ? ' open' : '') + '><summary><b>Semana del ' + esc(diaCorto(w.lunes).replace(/^\S+\s/, '')) + '</b><small>' + n + ' de ' + w.s.length + ' cumplidas</small></summary><ul class="sim-cal-l">' +
          w.s.map(function (s) {
            var ok = hechas[s.f], esHoy = s.f === hoy, cls = ok ? ' hecha' : esHoy ? ' hoy' : s.f < hoy ? ' pasada' : '';
            return '<li class="sim-cal-s' + cls + '"><span class="sim-cal-d">' + esc(diaCorto(s.f)) + '</span><span class="sim-cal-q"><span class="sim-op-tag ' + (s.k === 'simulacro' ? 'n2' : s.k === 'repaso' ? 'n3' : 'n1') + '">' + (s.k === 'simulacro' ? 'Simulacro' : s.k === 'repaso' ? 'Repaso' : 'Temas') + '</span>' + esc(queToca(s)) + '</span>' +
              (ok ? '<span class="sim-cal-ok" aria-label="Cumplida">' + ICONO.ok + '</span>' : s.f >= hoy ? '<button type="button" class="btn ' + (esHoy ? 'tinta' : 'blanco') + ' chico" data-estudiar="' + s.f + '">' + (esHoy ? 'Estudiar' : 'Adelantar') + '</button>' : '<span class="sim-cal-no">Pendiente</span>') + '</li>';
          }).join('') + '</ul></details>';
      }).join('') + '</div>';
  }
  // Pide permiso, suscribe este dispositivo al servicio de push y lo registra en el servidor
  function b64aBytes(s) { var p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), out = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out; }
  function activarPush() {
    if (!pushPosible()) return Promise.reject(new Error('Este navegador no permite recordatorios.'));
    // Algunos navegadores nunca responden al suscribirse (modo incógnito, sin servicio de push): a los 20 s se avisa
    var limite = new Promise(function (_, no) { setTimeout(function () { no(new Error('No pudimos activar los recordatorios en este dispositivo. Revisa que las notificaciones estén permitidas e inténtalo de nuevo.')); }, 20000); });
    return Promise.race([limite, activarPush2()]);
  }
  function activarPush2() {
    return Notification.requestPermission().then(function (p) {
      if (p !== 'granted') throw new Error('Para recibir recordatorios, permite las notificaciones del simulador en la configuración de tu ' + (esIOS() ? 'iPhone' : 'navegador') + '.');
      return registrarSW().then(function () { return navigator.serviceWorker.ready; });
    }).then(function (reg) {
      // Si este dispositivo ya estaba suscrito y el servidor lo tiene, no se vuelve a registrar (ni a mandar el aviso de prueba)
      return reg.pushManager.getSubscription().then(function (sub) {
        if (sub && EST.push.suscripciones) return null;
        return (sub ? Promise.resolve(sub) : reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aBytes(EST.push.pub) }))
          .catch(function () { throw new Error('No pudimos activar los recordatorios en este navegador. Si estás en una ventana de incógnito, ábrelo en una normal o instala la app.'); })
          .then(function (s) { return api('push', { method: 'POST', body: JSON.stringify(s.toJSON()) }); })
          .then(function () { EST.push.suscripciones = (EST.push.suscripciones || 0) + 1; });
      });
    });
  }

  // ---------- apuntes ----------
  function tituloApunte(a) {
    if (a.ref === 'general') return { t: 'Apunte general', s: '' };
    if (a.ref.indexOf('t:') === 0) return { t: 'Tu apunte del tema', s: nombreTema(a.ref.slice(2)) };
    var r = R[a.ref.slice(2)]; if (!r) return { t: 'Pregunta', s: '' };
    var en = String(r.enunciado || '').replace(/\*\*/g, '').replace(/\s+/g, ' ');
    return { t: en.length > 110 ? en.slice(0, 107) + '…' : en, s: 'Pregunta · ' + nombreTema(r.tema) };
  }
  function temaDeApunte(a) { return a.ref.indexOf('t:') === 0 ? a.ref.slice(2) : a.ref.indexOf('r:') === 0 && R[a.ref.slice(2)] ? R[a.ref.slice(2)].tema : 'general'; }
  function guardarApunte(ref, texto) {
    return api('apuntes', { method: 'POST', body: JSON.stringify({ ref: ref, texto: texto }) }).then(function (d) {
      EST.apuntes = (EST.apuntes || []).filter(function (x) { return x.ref !== ref; });
      if (d.apunte) EST.apuntes.unshift(d.apunte);
      return d;
    });
  }
  function pantallaApuntes(filtro) {
    detenerReloj(); pintarBarra();
    if (!tieneEstudio()) return inicio();
    if (!EST) { h('<div class="sim-cargando"><span class="sim-giro" aria-hidden="true"></span>Cargando tus apuntes…</div>'); cargarEstudio().then(function (d) { if (d) pantallaApuntes(filtro); else inicio(); }); return; }
    var grupos = L.temasPorSeccion(B, {}), aps = EST.apuntes || [], q = String(filtro || '').toLowerCase();
    var visibles = aps.filter(function (a) { return !q || (a.texto + ' ' + tituloApunte(a).t + ' ' + tituloApunte(a).s).toLowerCase().indexOf(q) >= 0; });
    // Agrupados por tema, en el orden del banco
    var orden = ['general'].concat(grupos.reduce(function (x, g) { return x.concat(g.temas.map(function (t) { return t.id; })); }, []));
    var porTema = {}; visibles.forEach(function (a) { var t = temaDeApunte(a); (porTema[t] = porTema[t] || []).push(a); });
    var listas = orden.filter(function (t) { return porTema[t]; }).map(function (t) {
      return '<section class="sim-ap-g"><h2 class="sim-h3">' + esc(t === 'general' ? 'Generales' : nombreTema(t)) + '</h2>' + porTema[t].map(function (a) {
        var ti = tituloApunte(a);
        return '<article class="sim-card sim-ap" data-ref="' + esc(a.ref) + '"><header><small>' + esc(ti.s || 'Apunte') + ' · ' + esc(fecha(a.actualizado_at)) + '</small><b>' + esc(ti.t) + '</b></header><p class="sim-ap-t">' + esc(a.texto) + '</p>' +
          '<div class="sim-ap-acc"><button type="button" class="sim-link" data-ap-editar>Editar</button><button type="button" class="sim-link" data-ap-borrar>Borrar</button>' + (t !== 'general' ? '<button type="button" class="sim-link" data-ap-practicar="' + esc(t) + '">Practicar este tema</button>' : '') + '</div></article>';
      }).join('') + '</section>';
    }).join('');
    h('<section class="sim-intro sim-apuntes"><span class="sim-paso">Plan Completo</span><h1>Mis apuntes</h1>' +
      '<p class="sim-lead">Lo que anotes aquí o al revisar una pregunta se guarda en tu cuenta: lo ves en tu celular y en tu computadora.</p>' +
      '<form class="sim-card sim-ap-nuevo" id="f-ap"><label class="sim-pe-campo"><span>¿De qué tema?</span><select id="ap-tema"><option value="general">General (fórmulas, trucos, lo que sea)</option>' +
        grupos.map(function (g) { return '<optgroup label="' + esc(g.nombre) + '">' + g.temas.map(function (t) { return '<option value="t:' + esc(t.id) + '">' + esc(t.nombre) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select></label>' +
        '<label class="vh" for="ap-texto">Tu apunte</label><textarea id="ap-texto" rows="4" maxlength="4000" placeholder="Escribe con tus palabras lo que no quieres olvidar…"></textarea>' +
        '<p class="sim-error" id="ap-error" role="alert" hidden></p><div class="botones"><button class="btn tinta chico" type="submit">Guardar apunte</button></div></form>' +
      (aps.length > 4 ? '<label class="sim-ap-buscar"><span class="vh">Buscar en mis apuntes</span><input type="search" id="ap-q" placeholder="Buscar en mis apuntes" value="' + esc(filtro || '') + '"></label>' : '') +
      (listas || '<p class="sim-nota sim-ap-vacio">' + (q ? 'Ningún apunte coincide con tu búsqueda.' : 'Aún no tienes apuntes. Escribe el primero aquí arriba, o toca <b>Anotar</b> cuando revises una pregunta.') + '</p>') +
      '<div class="botones"><button class="btn blanco" id="b-inicio" type="button">Volver al inicio</button></div></section>');
    document.getElementById('b-inicio').onclick = inicio;
    var sel = document.getElementById('ap-tema'), txt = document.getElementById('ap-texto');
    // Si el tema ya tiene apunte, se edita ese
    sel.onchange = function () { var a = apunteDe(sel.value === 'general' ? 'general' : sel.value); txt.value = a ? a.texto : ''; };
    document.getElementById('f-ap').onsubmit = function (ev) {
      ev.preventDefault();
      var err = document.getElementById('ap-error'), ref = sel.value;
      if (!txt.value.trim()) { err.textContent = 'Escribe tu apunte.'; err.hidden = false; return; }
      guardarApunte(ref, txt.value).then(function () { pantallaApuntes(); }, function (er) { err.textContent = er.message; err.hidden = false; });
    };
    var qq = document.getElementById('ap-q'); if (qq) { qq.oninput = function () { var v = qq.value, pos = qq.selectionStart; pantallaApuntes(v); var n = document.getElementById('ap-q'); if (n) { n.focus({ preventScroll: true }); n.setSelectionRange(pos, pos); } }; }
    app.querySelectorAll('.sim-ap').forEach(function (art) {
      var ref = art.dataset.ref;
      art.querySelector('[data-ap-borrar]').onclick = function () { if (confirm('¿Borrar este apunte?')) guardarApunte(ref, '').then(function () { pantallaApuntes(filtro); }, function (er) { alert(er.message); }); };
      art.querySelector('[data-ap-editar]').onclick = function () { editorApunte(art.querySelector('.sim-ap-t'), ref, function () { pantallaApuntes(filtro); }); };
      var bp = art.querySelector('[data-ap-practicar]'); if (bp) bp.onclick = function () { practicaN = 10; empezar('practica', [bp.dataset.apPracticar]); };
    });
  }
  // Cambia un bloque por un editor (textarea + Guardar/Cancelar) del apunte ref
  function editorApunte(nodo, ref, listo) {
    var a = apunteDe(ref), caja = document.createElement('div');
    caja.className = 'sim-ap-ed';
    caja.innerHTML = '<label class="vh" for="ap-ed">Tu apunte</label><textarea id="ap-ed" rows="4" maxlength="4000" placeholder="¿Qué aprendiste con esta pregunta? El método, el error que no quieres repetir…">' + esc(a ? a.texto : '') + '</textarea><p class="sim-error" role="alert" hidden></p>' +
      '<div class="botones"><button type="button" class="btn tinta chico" data-g>Guardar</button><button type="button" class="btn blanco chico" data-c>Cancelar</button></div>';
    nodo.replaceWith(caja);
    var t = caja.querySelector('textarea'), e = caja.querySelector('.sim-error'); t.focus();
    caja.querySelector('[data-c]').onclick = function () { listo(caja); };
    caja.querySelector('[data-g]').onclick = function () {
      var b = this; b.disabled = true; b.textContent = 'Guardando…';
      guardarApunte(ref, t.value).then(function () { listo(caja); }, function (er) { e.textContent = er.message; e.hidden = false; b.disabled = false; b.textContent = 'Guardar'; });
    };
  }
  // En la revisión de cada pregunta (con tutor): «Anotar en mis apuntes»
  function apunteHTML(r) {
    if (!tieneEstudio()) return '';
    var a = apunteDe('r:' + r.id);
    return '<div class="sim-apunte" id="ap-r">' + (a ? '<div class="sim-apunte-v"><small>' + ICONO.lapiz + ' Tu apunte</small><p class="sim-ap-t">' + esc(a.texto) + '</p></div>' : '') +
      '<button type="button" class="sim-link" id="b-ap">' + (a ? 'Editar mi apunte' : ICONO.lapiz + ' Anotar en mis apuntes') + '</button></div>';
  }
  function conectarApunte(r) {
    var b = document.getElementById('b-ap'); if (!b) return;
    b.onclick = function () {
      var go = function () {
        var caja = document.getElementById('ap-r'); if (!caja) return;
        editorApunte(caja, 'r:' + r.id, function (ed) { var n = document.createElement('div'); n.innerHTML = apunteHTML(r); ed.replaceWith(n.firstChild); conectarApunte(r); });
      };
      if (EST) go(); else cargarEstudio().then(go);
    };
  }

  // ---------- Videos explicativos (plan Completo) ----------
  // Lecciones animadas con voz: la animación se dibuja aquí (no es un MP4) y sigue al audio. Cada paso trae su voz (que es
  // también el subtítulo), cuándo empieza y su vista (bloques: pregunta, barra, fórmula, pasos, tabla, tarjeta, turno).
  // Sin plan Completo, /api/<app>/videos solo lista títulos: el botón ofrece completar el plan.
  var VID = null, VID_CARGANDO = null, K_VISTOS_V;
  function cargarVideos() {
    if (VID) return Promise.resolve(VID);
    if (VID_CARGANDO) return VID_CARGANDO;
    VID_CARGANDO = api('videos' + (/[?&]borradores=1/.test(location.search) ? '?borradores=1' : '')).then(function (d) { VID = d; return d; }, function () { VID = { videos: [] }; return VID; });
    return VID_CARGANDO;
  }
  function videosDeTema(t) { return ((VID && VID.videos) || []).filter(function (v) { return v.tema === t; }); }
  function videoPorId(id) { var l = (VID && VID.videos) || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function videosVistos() { return leer(K_VISTOS_V) || {}; }
  function minSeg(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  // Botones «Ver video» para un tema (en el tutor y en la práctica). Vacío si el tema aún no tiene video.
  function botonesVideo(t, chico) { return videosDeTema(t).map(function (v) { return botonVideo(v, chico); }).join(''); }
  function botonVideo(v, chico) {
    {
      var visto = videosVistos()[v.id];
      return '<button type="button" class="sim-vbtn' + (chico ? ' chico' : '') + (VID.bloqueado ? ' bloq' : '') + '" data-video="' + esc(v.id) + '">' +
        '<span class="sim-vbtn-i" aria-hidden="true">' + (VID.bloqueado ? ICONO.candado : ICONO.play) + '</span>' +
        '<span class="sim-vbtn-t"><b>' + (VID.bloqueado ? 'Video del tema · plan Completo' : 'Video: ' + esc(v.titulo)) + '</b><small>' + (VID.bloqueado ? esc(v.titulo) + ' · ' : '') + minSeg(v.duracion) + ' min' + (visto ? ' · ya lo viste' : '') + '</small></span></button>';
    }
  }
  function conectarBotonesVideo(raiz) {
    (raiz || app).querySelectorAll('[data-video]').forEach(function (b) {
      b.onclick = function () {
        if (VID.bloqueado) return comprarPlan(puedePracticar() && !tieneExamen() ? 'completo' : 'practica');
        abrirVideo(videoPorId(b.dataset.video), b);
      };
    });
  }
  // Lugar para los botones de video de un tema; llenarVideos() los pinta cuando ya se sabe qué videos hay
  function cajaVideos(t, chico) { return '<div class="sim-vcaja" data-tema="' + esc(t) + '"' + (chico ? ' data-chico="1"' : '') + '></div>'; }
  function llenarVideos() {
    cargarVideos().then(function () {
      app.querySelectorAll('.sim-vcaja').forEach(function (c) { c.innerHTML = botonesVideo(c.dataset.tema, c.dataset.chico === '1'); conectarBotonesVideo(c); });
    });
  }

  // ---------- Pizarrón: lo que se escribe y se dibuja en el video ----------
  // Cada paso trae acciones (escribe, flecha, circulo, subraya, tacha, caja, relleno, palomita, trazo). Cada acción empieza cuando la
  // voz dice su frase («en») y dura lo que tarda en trazarse. Todo es función del tiempo: pinta(t) deja el pizarrón exacto en
  // el segundo t, así que adelantar, regresar o pausar siempre se ve bien. Un plumón sigue la punta de lo que se está trazando.
  var GIS = { blanco: '#F5F2E8', amarillo: '#FFD45C', azul: '#7CC8FF', verde: '#86E0A0', rojo: '#FF7A70', rosa: '#F7A8D8', tinta: '#14261F' };
  var SVGNS = 'http://www.w3.org/2000/svg';
  function nodo(tag, at, padre) { var e = document.createElementNS(SVGNS, tag); for (var k in at) e.setAttribute(k, at[k]); if (padre) padre.appendChild(e); return e; }
  function azar(sem) { return function () { sem = (sem * 9301 + 49297) % 233280; return sem / 233280; }; }
  function crearPizarron(v, contenedor) {
    var svg = nodo('svg', { viewBox: '0 0 1000 620', class: 'sv-pz', 'aria-hidden': 'true' }, contenedor);
    var defs = nodo('defs', {}, svg);
    var pat = nodo('pattern', { id: 'sv-rayas', width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    nodo('rect', { width: 14, height: 14, fill: 'rgba(255,122,112,.18)' }, pat);
    nodo('line', { x1: 0, y1: 0, x2: 0, y2: 14, stroke: GIS.rojo, 'stroke-width': 5 }, pat);
    var capa = nodo('g', {}, svg);
    var plumon = nodo('g', { class: 'sv-plumon', opacity: 0 }, svg);
    nodo('path', { d: 'M0 0 L10 -22 L34 -76 Q38 -84 46 -80 L52 -77 Q60 -73 56 -65 L32 -11 Z', fill: '#E9E4D8', stroke: '#14261F', 'stroke-width': 2.5 }, plumon);
    nodo('path', { d: 'M0 0 L10 -22 L20 -17 Z', fill: '#14261F' }, plumon);
    var dur = v.duracion, acc = [], porId = {};
    // Cuándo empieza cada acción: en la frase que la anuncia (proporcional al lugar de la frase en la voz del paso)
    v.pasos.forEach(function (p, k) {
      var fin = k + 1 < v.pasos.length ? v.pasos[k + 1].inicio : dur, largo = fin - p.inicio, voz = p.voz.toLowerCase();
      // Hasta cuándo se ve: hasta que un paso posterior borre el pizarrón
      var borra = dur + 1; for (var j = k + 1; j < v.pasos.length; j++) if (v.pasos[j].limpia) { borra = v.pasos[j].inicio; break; }
      var ultimo = p.inicio;
      (p.acciones || []).forEach(function (a, i, todas) {
        var pos = a.en ? voz.indexOf(a.en.toLowerCase()) : -1;
        var ini = pos >= 0 ? p.inicio + largo * 0.92 * pos / voz.length : p.inicio + largo * 0.8 * i / Math.max(1, todas.length);
        ini = Math.max(ini, ultimo - 0.2); ultimo = ini;
        var d = a.a === 'escribe' ? Math.min(1.6, Math.max(0.45, a.texto.length * 0.07)) : a.a === 'caja' || a.a === 'trazo' ? 0.9 : a.a === 'relleno' ? 0.7 : a.a === 'flecha' || a.a === 'circulo' ? 0.6 : 0.4;
        var x = { a: a, ini: ini, dur: d, borra: borra };
        // «sobre», «de» y «hacia» apuntan al texto más reciente con ese id (un id puede repetirse en otro paso)
        if (a.sobre) x.refS = porId[a.sobre];
        if (typeof a.de === 'string') x.refDe = porId[a.de];
        if (typeof a.hacia === 'string') x.refA = porId[a.hacia];
        acc.push(x); if (a.id) porId[a.id] = x;
      });
    });
    // 1) Los textos primero: hacen falta sus medidas para dibujar alrededor
    acc.forEach(function (x, n) {
      var a = x.a; if (a.a !== 'escribe') return;
      var g = nodo('g', {}, capa), clip = nodo('clipPath', { id: 'sv-c' + n }, defs);
      x.rect = nodo('rect', { x: a.x - 10, y: a.y - (a.tam || 76) * 1.1, width: 0, height: (a.tam || 76) * 1.6 }, clip);
      x.el = nodo('text', { x: a.x, y: a.y, 'font-size': a.tam || 76, fill: GIS[a.color || 'blanco'], 'clip-path': 'url(#sv-c' + n + ')', class: 'sv-letra' }, g);
      x.el.textContent = a.texto; x.g = g;
    });
    function caja(x) { if (!x) return null; if (x.bb) return x.bb; if (x.a.a === 'caja') return { x: x.a.x, y: x.a.y, width: x.a.w, height: x.a.h }; var b = x.el.getBBox(); return (x.bb = { x: b.x, y: b.y + b.height * 0.12, width: b.width, height: b.height * 0.8 }); }
    function punto(p, ref, otro) {
      if (typeof p !== 'string') return { x: p[0], y: p[1] };
      var b = caja(ref), o = otro; if (!b) return { x: 0, y: 0 };
      if (o && o.x > b.x + b.width) return { x: b.x + b.width + 12, y: b.y + b.height / 2 };
      if (o && o.y > b.y + b.height) return { x: b.x + b.width / 2, y: b.y + b.height + 10 };
      return { x: b.x + b.width / 2, y: b.y - 10 };
    }
    // 2) Los trazos (en el orden en que aparecen, para que lo nuevo quede encima)
    function trazo(d, color, ancho) { return nodo('path', { d: d, fill: 'none', stroke: GIS[color || 'blanco'], 'stroke-width': ancho || 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, capa); }
    acc.forEach(function (x, n) {
      var a = x.a, r = azar(n * 31 + 7), b, d;
      if (a.a === 'escribe') { capa.appendChild(x.g); return; }
      if (a.a === 'circulo') {
        b = caja(x.refS); var cx = b.x + b.width / 2, cy = b.y + b.height / 2, rx = b.width / 2 + 26, ry = b.height / 2 + 18, pts = [];
        for (var k = 0; k <= 26; k++) { var ang = -0.5 + (Math.PI * 2 + 0.6) * k / 26, f = 1 + (r() - 0.5) * 0.06; pts.push((cx + Math.cos(ang) * rx * f).toFixed(1) + ' ' + (cy + Math.sin(ang) * ry * f).toFixed(1)); }
        x.el = trazo('M' + pts.join(' L'), a.color);
      } else if (a.a === 'subraya') {
        b = caja(x.refS); var y = b.y + b.height + 14;
        x.el = trazo('M' + (b.x - 4) + ' ' + y + ' Q' + (b.x + b.width / 2) + ' ' + (y + 8) + ' ' + (b.x + b.width + 6) + ' ' + (y - 3), a.color);
      } else if (a.a === 'tacha') {
        b = caja(x.refS);
        x.el = trazo('M' + (b.x - 10) + ' ' + (b.y + b.height * 0.62) + ' L' + (b.x + b.width + 10) + ' ' + (b.y + b.height * 0.38), a.color || 'rojo', 8);
      } else if (a.a === 'flecha') {
        // «hacia» es un punto [x, y] o el id de un texto; «de» también
        var aa = punto(a.hacia, x.refA), de = punto(a.de, x.refDe, aa);
        var mx = (de.x + aa.x) / 2, my = (de.y + aa.y) / 2, dx = aa.x - de.x, dy = aa.y - de.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
        var c = { x: mx - dy / L * L * 0.12, y: my + dx / L * L * 0.12 };
        x.el = trazo('M' + de.x + ' ' + de.y + ' Q' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' ' + aa.x + ' ' + aa.y, a.color);
        var ux = (aa.x - c.x), uy = (aa.y - c.y), ul = Math.sqrt(ux * ux + uy * uy) || 1; ux /= ul; uy /= ul;
        x.punta = trazo('M' + (aa.x - ux * 24 - uy * 15).toFixed(1) + ' ' + (aa.y - uy * 24 + ux * 15).toFixed(1) + ' L' + aa.x + ' ' + aa.y + ' L' + (aa.x - ux * 24 + uy * 15).toFixed(1) + ' ' + (aa.y - uy * 24 - ux * 15).toFixed(1), a.color);
      } else if (a.a === 'caja') {
        x.el = trazo('M' + a.x + ' ' + a.y + ' L' + (a.x + a.w) + ' ' + (a.y + 2) + ' L' + (a.x + a.w - 1) + ' ' + (a.y + a.h) + ' L' + (a.x + 1) + ' ' + (a.y + a.h - 1) + ' Z', a.color, 5);
      } else if (a.a === 'relleno') {
        b = caja(x.refS);
        x.base = { x: b.x + b.width * a.desde + 4, y: b.y + 4, w: b.width * (a.hasta - a.desde) - 8, h: b.height - 8 };
        x.el = nodo('rect', { x: x.base.x, y: x.base.y, width: 0, height: x.base.h, rx: 6, fill: a.rayado ? 'url(#sv-rayas)' : GIS[a.color || 'verde'] }, capa);
      } else if (a.a === 'trazo') {   // figura libre: un camino SVG (triángulos, ejes, parábolas…)
        x.el = trazo(a.d, a.color, a.ancho);
      } else if (a.a === 'palomita') {
        x.el = trazo('M' + a.x + ' ' + a.y + ' l18 22 l40 -54', 'verde', 9);
      }
      // Los trazos empiezan ocultos (todo el largo «sin dibujar») y se descubren con el tiempo
      if (x.el && x.el.getTotalLength) { x.largo = x.el.getTotalLength(); x.el.style.strokeDasharray = x.largo; x.el.style.strokeDashoffset = x.largo; x.el.style.opacity = 0; }
      if (x.punta) { x.largoP = x.punta.getTotalLength(); x.punta.style.strokeDasharray = x.largoP; x.punta.style.strokeDashoffset = x.largoP; x.punta.style.opacity = 0; }
    });
    svg.appendChild(plumon);   // el plumón, siempre encima
    // 3) El pizarrón en el segundo t
    function pinta(t) {
      var punta = null;
      acc.forEach(function (x) {
        var a = x.a, p = (t - x.ini) / x.dur, vis = t >= x.ini && t < x.borra;
        var op = vis ? Math.min(1, (x.borra - t) / 0.35) : 0;   // al borrar el pizarrón, se desvanece
        var el = a.a === 'escribe' ? x.g : x.el; if (!el) return;
        el.style.opacity = op;
        if (x.punta) x.punta.style.opacity = op;
        if (!vis) return;
        p = Math.max(0, Math.min(1, p));
        if (a.a === 'escribe') {
          var w = x.w || (x.w = x.el.getBBox().width + 20);
          x.rect.setAttribute('width', (w * p).toFixed(1));
          if (p < 1) punta = { x: a.x + w * p - 10, y: a.y - (a.tam || 76) * 0.25 };
        } else if (a.a === 'relleno') {
          x.el.setAttribute('width', (x.base.w * p).toFixed(1));
          if (p < 1) punta = { x: x.base.x + x.base.w * p, y: x.base.y + x.base.h / 2 };
        } else if (x.largo) {
          var pp = x.punta ? Math.min(1, p / 0.8) : p;
          x.el.style.strokeDashoffset = (x.largo * (1 - pp)).toFixed(1);
          if (x.punta) { var q = Math.max(0, (p - 0.8) / 0.2); x.punta.style.opacity = op; x.punta.style.strokeDashoffset = (x.largoP * (1 - q)).toFixed(1); }
          if (pp < 1) { var pt = x.el.getPointAtLength(x.largo * pp); punta = { x: pt.x, y: pt.y }; }
        }
      });
      plumon.setAttribute('opacity', punta ? 1 : 0);
      if (punta) plumon.setAttribute('transform', 'translate(' + punta.x.toFixed(1) + ' ' + punta.y.toFixed(1) + ')');
    }
    return { pinta: pinta };
  }

  // Reloj del video: el audio de la voz, o (borradores sin voz) un reloj con los tiempos estimados
  function relojSinVoz(dur) {
    var t = 0, base = 0, corre = false, ev = {}, vel = 1;
    var r = {
      addEventListener: function (n, f) { (ev[n] = ev[n] || []).push(f); },
      emitir: function (n) { (ev[n] || []).forEach(function (f) { f(); }); },
      get currentTime() { var x = corre ? t + (performance.now() - base) / 1000 * vel : t; if (x >= dur && corre) { t = dur; corre = false; setTimeout(function () { r.emitir('pause'); r.emitir('ended'); }); } return Math.min(dur, x); },
      set currentTime(x) { t = Math.max(0, Math.min(dur, x)); base = performance.now(); },
      get paused() { return !corre; },
      get ended() { return !corre && t >= dur; },
      get playbackRate() { return vel; },
      set playbackRate(x) { t = r.currentTime; base = performance.now(); vel = x; },
      play: function () { if (!corre) { base = performance.now(); corre = true; r.emitir('play'); } return Promise.resolve(); },
      pause: function () { if (corre) { t = r.currentTime; corre = false; r.emitir('pause'); } }
    };
    return r;
  }

  var VP = null;   // reproductor abierto: { v, audio, i, raf, pausa, origen }
  function abrirVideo(v, origen) {
    if (!v || VP) return;
    detenerReloj();
    var escenas = []; v.pasos.forEach(function (p, i) { if (!escenas.length || escenas[escenas.length - 1].nombre !== p.escena) escenas.push({ nombre: p.escena, i: i }); });
    var caja = document.createElement('div');
    caja.className = 'sim-video';
    caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true'); caja.setAttribute('aria-label', 'Video: ' + v.titulo);
    caja.innerHTML = '<div class="sv-panel" style="--sv:' + esc(SIM.color || '#6B2A85') + '">' +
      '<header class="sv-cab"><div><span class="sv-cab-e">Video del tema · ' + esc(nombreTema(v.tema)) + '</span><b>' + esc(v.titulo) + '</b></div><button type="button" class="sv-x" id="sv-x" aria-label="Cerrar video">✕</button></header>' +
      '<div class="sv-escenario"><div class="sv-pizarra" id="sv-pizarra"></div><span class="sv-escena-n" id="sv-escena-n"></span>' +
        '<div class="sv-cuenta" id="sv-reloj" hidden><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19"/><circle class="sv-reloj-a" cx="22" cy="22" r="19"/></svg><b id="sv-reloj-n"></b><span>Resuélvelo</span></div>' +
        '<button type="button" class="sv-play-g" id="sv-play-g" aria-label="Reproducir">' + ICONO.play + '</button><button type="button" class="sv-saltar" id="sv-saltar" hidden>Ver la respuesta</button></div>' +
      '<p class="sv-sub" id="sv-sub"></p>' +
      '<div class="sv-ctrl"><button type="button" class="sv-btn" id="sv-play" aria-label="Reproducir">' + ICONO.play + '</button>' +
        '<button type="button" class="sv-btn" id="sv-atras" aria-label="Regresar 10 segundos">↺10</button>' +
        '<div class="sv-barra-t"><input type="range" id="sv-pos" min="0" max="' + Math.round(v.duracion * 10) + '" value="0" aria-label="Avance del video"><div class="sv-marcas" aria-hidden="true">' +
          escenas.map(function (e) { return '<i style="left:' + (100 * v.pasos[e.i].inicio / v.duracion).toFixed(2) + '%"></i>'; }).join('') + '</div></div>' +
        '<span class="sv-tiempo num" id="sv-tiempo">0:00 / ' + minSeg(v.duracion) + '</span>' +
        '<button type="button" class="sv-btn sv-vel" id="sv-vel" aria-label="Velocidad">1×</button></div>' +
      '<nav class="sv-escenas" aria-label="Partes del video">' + escenas.map(function (e) { return '<button type="button" data-ir-paso="' + e.i + '">' + esc(e.nombre) + '</button>'; }).join('') + '</nav>' +
      '</div>';
    document.body.appendChild(caja);
    document.body.classList.add('sv-abierto');
    var audio = v.audio ? new Audio(v.audio) : relojSinVoz(v.duracion);   // sin voz (borrador): tiempos estimados
    if (v.audio) audio.preload = 'auto';
    // El pizarrón mide sus letras para dibujar alrededor: espera a que cargue la letra de plumón (Caveat)
    var pz = null;
    (document.fonts && document.fonts.load ? document.fonts.load('700 60px Caveat') : Promise.resolve()).catch(function () { }).then(function () {
      if (!VP || VP.audio !== audio) return;
      pz = crearPizarron(v, document.getElementById('sv-pizarra')); pz.pinta(audio.currentTime);
    });
    VP = { v: v, audio: audio, i: -1, raf: 0, pausa: null, hechas: {}, origen: origen || document.activeElement, caja: caja };
    var $ = function (id) { return document.getElementById(id); };
    // El botón grande solo sale antes de empezar (o si el navegador bloqueó el autoplay); después, el de la barra
    function pintaPlay() { var p = !audio.paused || VP.pausa; if (p) VP.empezo = true; $('sv-play').innerHTML = p ? ICONO.pausa : ICONO.play; $('sv-play').setAttribute('aria-label', p ? 'Pausar' : 'Reproducir'); $('sv-play-g').hidden = p || VP.empezo; }
    function pasoEn(t) { var k = 0; for (var i = 0; i < v.pasos.length; i++) if (v.pasos[i].inicio <= t + 0.05) k = i; return k; }
    function render(k) {
      VP.i = k;
      var p = v.pasos[k], fin = k + 1 < v.pasos.length ? v.pasos[k + 1].inicio : v.duracion;
      $('sv-escena-n').textContent = p.escena;
      void fin;
      $('sv-sub').textContent = p.voz;
      caja.querySelectorAll('[data-ir-paso]').forEach(function (b) { var desde = Number(b.dataset.irPaso), sig = b.nextElementSibling ? Number(b.nextElementSibling.dataset.irPaso) : 1e9; b.classList.toggle('sel', k >= desde && k < sig); });
    }
    function tick() {
      var t = audio.currentTime;
      var k = pasoEn(t); if (k !== VP.i) render(k);
      if (pz) pz.pinta(t);
      // «Tu turno»: al terminar su voz, se detiene unos segundos con cuenta regresiva para que lo resuelva
      var p = v.pasos[k], fin = k + 1 < v.pasos.length ? v.pasos[k + 1].inicio : v.duracion;
      if (p.pausa && !VP.hechas[k] && !audio.paused && t >= fin - 0.25) { VP.hechas[k] = 1; pausaTurno(p.pausa); }
      $('sv-pos').value = Math.round(t * 10);
      $('sv-tiempo').textContent = minSeg(t) + ' / ' + minSeg(v.duracion);
      if (!audio.paused) VP.raf = requestAnimationFrame(tick);
    }
    function pausaTurno(seg) {
      audio.pause();
      var r = $('sv-reloj'), n = seg, sal = $('sv-saltar');
      if (r) { r.hidden = false; r.style.setProperty('--d', seg + 's'); r.classList.remove('corre'); void r.offsetWidth; r.classList.add('corre'); }
      sal.hidden = false;
      var listo = function () { clearInterval(VP.pausa); VP.pausa = null; sal.hidden = true; if (r) r.hidden = true; audio.play(); pintaPlay(); };
      if ($('sv-reloj-n')) $('sv-reloj-n').textContent = n;
      VP.pausa = setInterval(function () { n--; if ($('sv-reloj-n')) $('sv-reloj-n').textContent = Math.max(0, n); if (n <= 0) listo(); }, 1000);
      sal.onclick = listo;
      pintaPlay();
    }
    function alternar() {
      if (VP.pausa) { clearInterval(VP.pausa); VP.pausa = null; $('sv-saltar').hidden = true; if ($('sv-reloj')) $('sv-reloj').hidden = true; pintaPlay(); return; }
      if (audio.paused) { if (audio.ended) audio.currentTime = 0; audio.play().catch(function () { }); } else audio.pause();
    }
    function irA(t) { if (VP.pausa) { clearInterval(VP.pausa); VP.pausa = null; $('sv-saltar').hidden = true; $('sv-reloj').hidden = true; } audio.currentTime = Math.max(0, Math.min(v.duracion, t)); VP.hechas = {}; tick(); }
    audio.addEventListener('play', function () { pintaPlay(); cancelAnimationFrame(VP.raf); VP.raf = requestAnimationFrame(tick); });
    audio.addEventListener('pause', pintaPlay);
    audio.addEventListener('ended', function () { var x = videosVistos(); x[v.id] = 1; guardar(K_VISTOS_V, x); pintaPlay(); });
    audio.addEventListener('timeupdate', function () { if (audio.currentTime > v.duracion * 0.9) { var x = videosVistos(); if (!x[v.id]) { x[v.id] = 1; guardar(K_VISTOS_V, x); } } });
    $('sv-play').onclick = alternar; $('sv-play-g').onclick = alternar;
    $('sv-atras').onclick = function () { irA(audio.currentTime - 10); };
    $('sv-pos').oninput = function () { irA(Number(this.value) / 10); };
    var vels = [1, 1.25, 1.5, 0.85];
    $('sv-vel').onclick = function () { var i = (vels.indexOf(audio.playbackRate) + 1) % vels.length; audio.playbackRate = vels[i]; this.textContent = String(vels[i]).replace('.', '.') + '×'; };
    caja.querySelectorAll('[data-ir-paso]').forEach(function (b) { b.onclick = function () { irA(v.pasos[Number(b.dataset.irPaso)].inicio + 0.06); if (audio.paused) audio.play().catch(function () { }); }; });
    $('sv-x').onclick = cerrarVideo;
    caja.addEventListener('click', function (e) { if (e.target === caja) cerrarVideo(); });
    caja.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); cerrarVideo(); }
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') { e.preventDefault(); alternar(); }
      else if (e.key === 'Tab') {   // el foco se queda dentro del video
        var f = caja.querySelectorAll('button:not([hidden]), input'), a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    render(0); pintaPlay();
    $('sv-play-g').focus();
    audio.play().catch(function () { });   // si el navegador bloquea el autoplay, queda el botón grande
  }
  function cerrarVideo() {
    if (!VP) return;
    VP.audio.pause(); cancelAnimationFrame(VP.raf); if (VP.pausa) clearInterval(VP.pausa);
    VP.caja.remove(); document.body.classList.remove('sv-abierto');
    var o = VP.origen; VP = null;
    if (o && o.focus) o.focus({ preventScroll: true });
    // Los botones ahora dicen «ya lo viste»
    llenarVideos();
    if (app.querySelector('.sim-videos')) pantallaVideos();
  }

  // Todos los videos, por sección (desde la tarjeta del plan)
  function pantallaVideos() {
    detenerReloj(); pintarBarra();
    if (!VID) { h('<div class="sim-cargando"><span class="sim-giro" aria-hidden="true"></span>Cargando los videos…</div>'); cargarVideos().then(pantallaVideos); return; }
    var grupos = L.temasPorSeccion(B, {}), vistos = videosVistos(), total = VID.videos.length, n = VID.videos.filter(function (v) { return vistos[v.id]; }).length;
    var listas = grupos.map(function (g) {
      var vs = VID.videos.filter(function (v) { return g.temas.some(function (t) { return t.id === v.tema; }); });
      return vs.length ? '<section class="sim-vsec"><h2 class="sim-h3">' + esc(g.nombre) + '</h2><div class="sim-vlista">' + vs.map(function (v) { return botonVideo(v); }).join('') + '</div></section>' : '';
    }).join('');
    h('<section class="sim-intro sim-videos"><span class="sim-paso">Plan Completo</span><h1>Videos de los temas</h1>' +
      '<p class="sim-lead">Explicaciones paso a paso, con voz y subtítulos, de 2 a 3 minutos. También te aparecen junto a la pregunta cuando fallas un tema.</p>' +
      (total ? '<p class="sim-nota">' + n + ' de ' + total + ' vistos.</p>' + listas : '<p class="sim-nota">Muy pronto: estamos terminando los videos de este simulador.</p>') +
      '<div class="botones"><button class="btn blanco" id="b-inicio" type="button">Volver al inicio</button></div></section>');
    document.getElementById('b-inicio').onclick = inicio;
    conectarBotonesVideo();
  }

  iniciar();
})();
