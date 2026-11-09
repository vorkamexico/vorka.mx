// Simuladores de examen · lógica pura del cliente (sin DOM): gráfica de avance, práctica por temas y puntaje por universidad.
// construir.py la pega antes de app.js; las pruebas la corren en node con vm (test/simulador-avance.test.js).
var SIM_LOGICA = (function () {
  'use strict';

  // ---------- fechas y tipos ----------
  function opcionesTz(o, tz) { if (tz) o.timeZone = tz; return o; }
  // "1 nov"
  function fechaCorta(iso, tz) { try { return new Date(iso).toLocaleDateString('es-MX', opcionesTz({ day: 'numeric', month: 'short' }, tz)).replace('.', ''); } catch (e) { return ''; } }
  // "20:10"
  function hora(iso, tz) { try { return new Date(iso).toLocaleTimeString('es-MX', opcionesTz({ hour: '2-digit', minute: '2-digit', hour12: false }, tz)); } catch (e) { return ''; } }
  // "sábado, 1 de noviembre de 2026, 8:10 p.m."
  function fechaLarga(iso, tz) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('es-MX', opcionesTz({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, tz)) + ', ' +
        d.toLocaleTimeString('es-MX', opcionesTz({ hour: 'numeric', minute: '2-digit', hour12: true }, tz));
    } catch (e) { return ''; }
  }
  function tipoDe(x) {
    if (x.modo === 'examen') return 'Examen completo' + (x.tutor ? ' con tutor' : '');
    return x.modo === 'calentamiento' ? 'Calentamiento' : x.modo === 'completo' ? 'Simulacro Medio' : x.modo === 'seccion' ? 'Sección' : 'Práctica de temas';
  }
  function miles(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  // ---------- eje de la gráfica ----------
  // Paso "redondo" (1, 2, 5 × 10^k) cercano a x
  function pasoRedondo(x) {
    if (!(x > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(x) / Math.LN10)), f = x / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }
  // Rango del eje que hace visibles las diferencias: no empieza en el mínimo de la escala si eso aplana las barras.
  // valores: puntajes (y meta o referencia, para que sus líneas se vean); lim: { min, max } de la escala del examen
  function rangoEje(valores, lim) {
    var v = valores.filter(function (x) { return typeof x === 'number' && isFinite(x) && x >= lim.min && x <= lim.max; });
    var paso = pasoRedondo((lim.max - lim.min) / 12);
    if (!v.length) return { min: lim.min, max: lim.max, paso: paso, ticks: ticksDe(lim.min, lim.max, paso) };
    var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), holgura = Math.max(paso, (hi - lo) * 0.15);
    var min = Math.max(lim.min, Math.floor((lo - holgura) / paso) * paso), max = Math.min(lim.max, Math.ceil((hi + holgura) / paso) * paso);
    // Al menos 4 pasos de alto, para que una diferencia pequeña no parezca enorme
    while ((max - min) / paso < 4 && (min > lim.min || max < lim.max)) { if (min > lim.min) min -= paso; if ((max - min) / paso < 4 && max < lim.max) max += paso; }
    return { min: min, max: max, paso: paso, ticks: ticksDe(min, max, paso) };
  }
  function ticksDe(min, max, paso) {
    var p = paso; while ((max - min) / p > 4) p = pasoRedondo(p * 2);
    var t = [], x = Math.ceil(min / p) * p; for (; x <= max + 1e-9; x += p) t.push(x);
    return t;
  }
  // Datos de la gráfica de avance. lista: resultados (del más viejo al más nuevo); o: { valor(x) → número|null, lim, meta?, ref?: { valor, texto }, tz?, unidad? }
  function datosGrafica(lista, o) {
    var items = [];
    lista.forEach(function (x, i) { var v = o.valor(x); if (v != null && isFinite(v)) items.push({ x: x, i: i, valor: v }); });
    var extra = [o.meta, o.ref && o.ref.valor];
    var eje = rangoEje(items.map(function (b) { return b.valor; }).concat(extra), o.lim);
    var pos = function (v) { return Math.max(0, Math.min(100, 100 * (v - eje.min) / (eje.max - eje.min))); };
    var u = o.unidad || 'puntos';
    var barras = items.map(function (b, k) {
      var tipo = tipoDe(b.x), fc = fechaCorta(b.x.fecha, o.tz), hr = hora(b.x.fecha, o.tz), fl = fechaLarga(b.x.fecha, o.tz);
      return { indice: b.i, valor: b.valor, texto: miles(b.valor), alto: Math.max(4, pos(b.valor)), tipo: tipo, fechaCorta: fc, hora: hr, fechaLarga: fl,
        etiqueta: tipo + ', ' + fl + ': ' + miles(b.valor) + ' ' + u + (k === items.length - 1 ? ' (el más reciente)' : '') };
    });
    return { eje: eje, barras: barras, meta: o.meta != null && o.meta >= eje.min && o.meta <= eje.max ? { valor: o.meta, pos: pos(o.meta) } : null,
      ref: o.ref && o.ref.valor >= eje.min && o.ref.valor <= eje.max ? { valor: o.ref.valor, texto: o.ref.texto, pos: pos(o.ref.valor) } : null,
      ticks: eje.ticks.map(function (t) { return { valor: t, texto: miles(t), pos: pos(t) }; }) };
  }

  // ---------- tabla de conversión de aciertos a la escala PAA (200 a 800) ----------
  // Tabla de referencia que usan los cursos de preparación: Lectura y Redacción va sobre 70 aciertos y Matemáticas sobre 55
  // (igual que el examen completo del simulador: 45 + 25 y 55). Índice = aciertos. No es una tabla oficial del College Board.
  var TABLA_LR = [200,208,217,225,234,242,251,259,268,276,284,293,301,310,318,326,335,343,352,360,363,377,385,394,402,411,419,428,436,445,453,462,470,479,487,495,504,512,521,529,538,546,554,563,571,580,588,596,605,613,621,630,638,647,655,663,672,681,689,698,707,715,724,733,742,752,761,771,780,790,800];
  var TABLA_M = [200,205,212,222,232,245,258,271,285,300,315,330,342,360,375,390,405,419,434,449,463,477,491,504,518,530,543,555,566,577,588,598,608,617,626,634,642,650,658,665,673,680,688,696,704,712,721,730,740,749,759,769,778,787,795,800];
  var REACTIVOS_LR = 70, REACTIVOS_M = 55;
  function tablaDe(parte) { return parte === 'mate' ? TABLA_M : TABLA_LR; }
  // Aciertos de un simulacro de cualquier tamaño, llevados al tamaño del examen real de esa parte
  function aciertosEquivalentes(ok, total, parte) {
    var n = parte === 'mate' ? REACTIVOS_M : REACTIVOS_LR;
    return total ? Math.max(0, Math.min(n, Math.round(ok / total * n))) : 0;
  }
  // Puntaje PAA (200–800) de una parte según sus aciertos: 'lr' (Lectura y Redacción) o 'mate'
  function puntajeTabla(ok, total, parte) { return tablaDe(parte)[aciertosEquivalentes(ok, total, parte)]; }
  // Sección del simulador → parte de la tabla (inglés no está en la tabla: null)
  function parteDeSeccion(id) { return id === 'matematicas' ? 'mate' : id === 'lectura' || id === 'redaccion' ? 'lr' : null; }
  // Menos aciertos de Lectura y Redacción que necesitas para llegar a «meta» (total de 1,600) con «m» aciertos de Matemáticas (null si no alcanza)
  function minimoLR(meta, m) { var falta = meta - TABLA_M[m]; for (var i = 0; i <= REACTIVOS_LR; i++) if (TABLA_LR[i] >= falta) return i; return null; }
  // Combinaciones mínimas para llegar a «meta»: [{ mate, lr, total }], de más aciertos de Matemáticas a menos
  function combinacionesMeta(meta) {
    var out = [];
    for (var m = REACTIVOS_M; m >= 0; m--) { var l = minimoLR(meta, m); if (l == null) break; out.push({ mate: m, lr: l, total: TABLA_M[m] + TABLA_LR[l] }); }
    return out;
  }
  // ¿Cuántos aciertos más te faltan para «meta»? Con tus aciertos actuales (en tamaño de examen real) prueba todas las formas de repartirlos.
  // { alcanza, faltan, lr, mate }: lr y mate = cómo quedarías con el reparto que pide menos aciertos (si empatan, más parejo)
  function faltanParaMeta(meta, lr, mate) {
    if (TABLA_LR[lr] + TABLA_M[mate] >= meta) return { alcanza: true, faltan: 0, lr: lr, mate: mate };
    var mejor = null;
    for (var i = lr; i <= REACTIVOS_LR; i++) for (var j = mate; j <= REACTIVOS_M; j++) {
      if (TABLA_LR[i] + TABLA_M[j] < meta) continue;
      var k = (i - lr) + (j - mate), dif = Math.abs((i - lr) - (j - mate));
      if (!mejor || k < mejor.faltan || (k === mejor.faltan && dif < mejor.dif)) mejor = { alcanza: false, faltan: k, lr: i, mate: j, dif: dif };
      break;
    }
    if (mejor) delete mejor.dif;
    return mejor;
  }

  // ---------- puntaje según la universidad (PAA) ----------
  // Partes de la PAA del College Board: Lectura y Redacción es UNA parte de 200 a 800 (el simulador la mide en dos secciones,
  // así que se combinan pesadas por reactivos) y Matemáticas otra. Total = las dos (400 a 1,600).
  function partesPAA(secciones) {
    var s = {}; (secciones || []).forEach(function (x) { if (x && x.total) s[x.id] = x; });
    var l = s.lectura, r = s.redaccion, m = s.matematicas;
    if (!m || (!l && !r)) return null;
    var nv = (l ? l.total : 0) + (r ? r.total : 0);
    // Sin aciertos (resultados que solo traen el puntaje): se combinan los puntajes pesados por reactivos, como antes
    if ([l, r, m].some(function (x) { return x && x.aciertos == null; })) {
      var vb = Math.round(((l ? l.puntaje * l.total : 0) + (r ? r.puntaje * r.total : 0)) / nv / 10) * 10;
      return { verbal: vb, mate: m.puntaje, total: vb + m.puntaje };
    }
    var okv = (l ? l.aciertos : 0) + (r ? r.aciertos : 0);
    // Con la tabla de conversión: Lectura y Redacción juntas sobre 70 aciertos y Matemáticas sobre 55
    var aLR = aciertosEquivalentes(okv, nv, 'lr'), aM = aciertosEquivalentes(m.aciertos || 0, m.total, 'mate');
    var verbal = TABLA_LR[aLR], mate = TABLA_M[aM];
    return { verbal: verbal, mate: mate, total: verbal + mate, aciertosLR: aLR, aciertosMate: aM };
  }
  // Puntaje de un resultado en la escala de la universidad elegida. u: config de la universidad (o null = escala estándar)
  function puntajeUni(res, u) {
    if (u && u.escala === 'total') {
      var p = partesPAA(res.secciones);
      return p ? { valor: p.total, min: 400, max: 1600, partes: p, escala: 'total' } : null;
    }
    return res.global == null ? null : { valor: res.global, min: 200, max: 800, escala: 'paa' };
  }
  // Meta (por sección, de 200 a 800) en la escala de la universidad
  function metaEnEscala(meta, u) { return u && u.escala === 'total' ? meta * 2 : meta; }
  // ¿Cumple los mínimos por parte de la universidad? (solo si los publica)
  function cumpleMinimos(p, u) {
    if (!p || !u || !u.minimos) return null;
    var m = u.minimos;
    return { total: p.total >= m.total, verbal: p.verbal >= m.verbal, mate: p.mate >= m.mate, todo: p.total >= m.total && p.verbal >= m.verbal && p.mate >= m.mate };
  }

  // ---------- práctica por temas ----------
  // Temas de cada sección que tienen reactivos en el banco, con cuántos hay y cuántos ha visto
  function temasPorSeccion(B, visto) {
    visto = visto || {};
    var cuenta = {};
    B.reactivos.forEach(function (r) { var c = cuenta[r.tema] || (cuenta[r.tema] = { total: 0, vistos: 0 }); c.total++; if (visto[r.id]) c.vistos++; });
    return B.secciones.map(function (s) {
      return { id: s.id, nombre: s.nombre, temas: Object.keys(B.temas).filter(function (k) { return B.temas[k].seccion === s.id && cuenta[k]; })
        .map(function (k) { return { id: k, nombre: B.temas[k].nombre, total: cuenta[k].total, vistos: cuenta[k].vistos }; }) };
    }).filter(function (s) { return s.temas.length; });
  }
  // El selector solo tiene sentido si al menos una sección tiene 2 o más temas etiquetados
  function hayTemas(B) { return temasPorSeccion(B).some(function (s) { return s.temas.length >= 2; }); }
  // Aciertos a la primera por tema en todo el historial (simulacros, secciones y prácticas)
  function desempenoTemas(historial) {
    var t = {};
    (historial || []).forEach(function (x) { Object.keys(x.temas || {}).forEach(function (k) { var v = x.temas[k], a = t[k] || (t[k] = { ok: 0, total: 0 }); a.ok += v.ok || 0; a.total += v.total || 0; }); });
    return t;
  }
  // Temas con menos de 60 % de aciertos y al menos minTotal respuestas, del más débil al menos débil
  function temasDebiles(agg, TEMAS, n, minTotal) {
    minTotal = minTotal == null ? 2 : minTotal;
    return Object.keys(agg || {}).filter(function (k) { return TEMAS[k] && agg[k].total >= minTotal && agg[k].ok / agg[k].total < 0.6; })
      .map(function (k) { return { id: k, nombre: TEMAS[k].nombre, seccion: TEMAS[k].seccion, ok: agg[k].ok, total: agg[k].total, p: agg[k].ok / agg[k].total }; })
      .sort(function (a, b) { return a.p - b.p || b.total - a.total; }).slice(0, n);
  }
  function barajar(a, azar) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(azar() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Reactivos para practicar SOLO los temas elegidos: reparte entre temas y dentro de cada uno van primero los que
  // fallaste, luego los que no has visto. o: { n, fallados, vistos, azar }
  function elegirPractica(reactivos, temas, o) {
    o = o || {}; var n = o.n || 10, fal = o.fallados || {}, vis = o.vistos || {}, azar = o.azar || Math.random;
    var grupos = {};
    barajar(reactivos.filter(function (r) { return temas.indexOf(r.tema) >= 0; }), azar).forEach(function (r) { (grupos[r.tema] = grupos[r.tema] || []).push(r); });
    Object.keys(grupos).forEach(function (t) { grupos[t].sort(function (a, b) { return (fal[b.id] ? 1 : 0) - (fal[a.id] ? 1 : 0) || (vis[a.id] ? 1 : 0) - (vis[b.id] ? 1 : 0); }); });
    var orden = barajar(Object.keys(grupos), azar), out = [];
    while (out.length < n && orden.some(function (t) { return grupos[t].length; }))
      orden.forEach(function (t) { if (out.length < n && grupos[t].length) out.push(grupos[t].shift()); });
    return out.sort(function (a, b) { return a.dificultad - b.dificultad; });
  }

  // ---------- plan de estudio (plan Completo) ----------
  // 'AAAA-MM-DD' de una fecha en la zona dada (o la del dispositivo)
  function diaDe(fecha, tz) {
    try {
      var p = {}; new Intl.DateTimeFormat('en-CA', opcionesTz({ year: 'numeric', month: '2-digit', day: '2-digit' }, tz)).formatToParts(new Date(fecha)).forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day;
    } catch (e) { return ''; }
  }
  // Suma días a 'AAAA-MM-DD' (a mediodía UTC para que no brinque de día) y el día de la semana (0 = domingo)
  function masDias(dia, n) { return new Date(Date.parse(dia + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function semanaDe(dia) { return new Date(dia + 'T12:00:00Z').getUTCDay(); }
  function diasEntre(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5); }
  // Reparte los temas en los días de estudio que quedan antes del examen, empezando por los más débiles.
  // o: { hoy, fechaExamen, dias: [0..6], temas: [{ id, nombre, seccion }], desempeno: { id: { ok, total } }, porSesion?,
  //      prioridad?: [ids que el estudiante eligió reforzar], solo?: true = estudiar únicamente esos }
  // Devuelve [{ f, k, t }]: k = 'temas' (practicar t), 'simulacro' (cada 6.ª sesión, para medir el avance) o 'repaso' (la última)
  function planEstudio(o) {
    var hoy = o.hoy, fin = o.fechaExamen, dias = o.dias || [], fechas = [];
    if (!hoy || !fin || diasEntre(hoy, fin) < 1) return [];
    for (var d = hoy; d < fin && fechas.length < 400; d = masDias(d, 1)) if (dias.indexOf(semanaDe(d)) >= 0) fechas.push(d);
    if (!fechas.length) return [];
    var des = o.desempeno || {};
    // Débiles primero (aciertos a la primera); lo que no ha practicado va en medio (0.55); lo que domina, al final
    var nota = function (t) { var a = des[t.id]; return a && a.total ? a.ok / a.total : 0.55; };
    // Los temas que eligió reforzar van primero (entre ellos, el más débil antes); con «solo», únicamente esos
    var elegidos = (o.prioridad || []).filter(function (id) { return (o.temas || []).some(function (t) { return t.id === id; }); });
    var pri = function (t) { return elegidos.indexOf(t.id) >= 0 ? 0 : 1; };
    var base = o.solo && elegidos.length ? (o.temas || []).filter(function (t) { return pri(t) === 0; }) : (o.temas || []);
    var ranking = base.map(function (t, i) { return { t: t, n: nota(t), i: i }; })
      .sort(function (a, b) { return pri(a.t) - pri(b.t) || a.n - b.n || a.i - b.i; }).map(function (x) { return x.t; });
    var foco = elegidos.length ? ranking.filter(function (t) { return pri(t) === 0; }) : ranking.slice(0, Math.max(1, Math.ceil(ranking.length / 2)));
    if (!ranking.length) return fechas.map(function (f) { return { f: f, k: 'temas', t: [] }; });
    var tipos = fechas.map(function (f, i) {
      if (fechas.length >= 3 && i === fechas.length - 1) return 'repaso';
      if (fechas.length >= 6 && i % 6 === 5) return 'simulacro';
      return 'temas';
    });
    var huecos = tipos.filter(function (k) { return k === 'temas'; }).length;
    var por = o.porSesion || Math.max(1, Math.min(3, Math.ceil(ranking.length / Math.max(1, huecos))));
    // Primera vuelta: todos los temas; después se repasan los elegidos (o, si no eligió, la mitad más débil) y luego otra vez todo
    var cola = [], vuelta = 0;
    function siguiente() {
      if (!cola.length) { cola = vuelta % 2 === 1 ? foco.slice() : ranking.slice(); vuelta++; }
      return cola.shift();
    }
    return fechas.map(function (f, i) {
      var k = tipos[i], t = [];
      if (k === 'repaso') t = (foco.length >= 3 ? foco : ranking).slice(0, 3).map(function (x) { return x.id; });
      if (k === 'temas') while (t.length < Math.min(por, ranking.length)) { var x = siguiente(); if (t.indexOf(x.id) < 0) t.push(x.id); }
      return { f: f, k: k, t: t };
    });
  }
  // Fechas de sesiones ya cumplidas: ese día terminó una práctica o sección de alguno de esos temas (temas/repaso) o un
  // simulacro (simulacro). historial: los resultados de /yo (con fecha ISO)
  function sesionesHechas(sesiones, historial, tz) {
    var porDia = {};
    (historial || []).forEach(function (x) { var d = diaDe(x.fecha, tz); (porDia[d] = porDia[d] || []).push(x); });
    var out = {};
    (sesiones || []).forEach(function (s) {
      var del = porDia[s.f] || [];
      var ok = s.k === 'simulacro'
        ? del.some(function (x) { return x.modo === 'completo' || x.modo === 'examen' || x.modo === 'calentamiento'; })
        : del.some(function (x) { return !s.t.length || s.t.some(function (t) { return x.temas && x.temas[t]; }); });
      if (ok) out[s.f] = true;
    });
    return out;
  }

  return { diaDe: diaDe, masDias: masDias, semanaDe: semanaDe, diasEntre: diasEntre, planEstudio: planEstudio, sesionesHechas: sesionesHechas,
    fechaCorta: fechaCorta, hora: hora, fechaLarga: fechaLarga, tipoDe: tipoDe, miles: miles, pasoRedondo: pasoRedondo, rangoEje: rangoEje, datosGrafica: datosGrafica,
    partesPAA: partesPAA, puntajeUni: puntajeUni, TABLA_LR: TABLA_LR, TABLA_M: TABLA_M, puntajeTabla: puntajeTabla, parteDeSeccion: parteDeSeccion,
    aciertosEquivalentes: aciertosEquivalentes, minimoLR: minimoLR, combinacionesMeta: combinacionesMeta, faltanParaMeta: faltanParaMeta, metaEnEscala: metaEnEscala, cumpleMinimos: cumpleMinimos,
    temasPorSeccion: temasPorSeccion, hayTemas: hayTemas, desempenoTemas: desempenoTemas, temasDebiles: temasDebiles, elegirPractica: elegirPractica };
})();
