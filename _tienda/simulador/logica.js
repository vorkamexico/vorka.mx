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

  // ---------- puntaje según la universidad (PAA) ----------
  // Partes de la PAA del College Board: Lectura y Redacción es UNA parte de 200 a 800 (el simulador la mide en dos secciones,
  // así que se combinan pesadas por reactivos) y Matemáticas otra. Total = las dos (400 a 1,600).
  function partesPAA(secciones) {
    var s = {}; (secciones || []).forEach(function (x) { if (x && x.total) s[x.id] = x; });
    var l = s.lectura, r = s.redaccion, m = s.matematicas;
    if (!m || (!l && !r)) return null;
    var nv = (l ? l.total : 0) + (r ? r.total : 0);
    var verbal = Math.round(((l ? l.puntaje * l.total : 0) + (r ? r.puntaje * r.total : 0)) / nv / 10) * 10;
    return { verbal: verbal, mate: m.puntaje, total: verbal + m.puntaje };
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

  return { fechaCorta: fechaCorta, hora: hora, fechaLarga: fechaLarga, tipoDe: tipoDe, miles: miles, pasoRedondo: pasoRedondo, rangoEje: rangoEje, datosGrafica: datosGrafica,
    partesPAA: partesPAA, puntajeUni: puntajeUni, metaEnEscala: metaEnEscala, cumpleMinimos: cumpleMinimos,
    temasPorSeccion: temasPorSeccion, hayTemas: hayTemas, desempenoTemas: desempenoTemas, temasDebiles: temasDebiles, elegirPractica: elegirPractica };
})();
