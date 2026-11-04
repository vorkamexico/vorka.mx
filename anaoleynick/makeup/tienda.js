/* Ana Laura · Makeup · tienda conectada a Vende (https://vende.vorka.mx)
   - Productos, precios, existencias y totales: de la API pública de Vende (fuente única).
   - CATALOGO (abajo): textos largos y fotos de cada producto, ligados por el id de Vende (o por nombre).
   - Si la API no responde o la tienda aún no recibe pedidos: se muestra este catálogo y la bolsa se manda por WhatsApp.
   - La bolsa vive en localStorage (con try/catch: si el navegador no deja guardar, funciona igual en memoria). */
(function () {
  'use strict';

  var SLUG = 'ana-laura-hernandez';
  var API = 'https://vende.vorka.mx/api/tienda/' + SLUG;
  var PEDIDO_URL = 'https://vende.vorka.mx/v/' + SLUG + '/pedido/';
  var WA = '524611796915';
  var K_BOLSA = 'al-makeup-bolsa-v1';
  var K_PEDIDO = 'al-makeup-pedido-v1';
  var ENVIO_GRATIS_C = 300000; // solo para el modo WhatsApp; en línea lo calcula Vende
  var ENVIO_MAX_C = 25000;
  var ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila',
    'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];

  // ---------------- Catálogo de Ana Laura (textos del catálogo oficial) ----------------
  var CATALOGO = [
    {
      slug: 'base-liquida-mate', id: 'ad42ff9c-8a27-444b-b634-6262c8b4261d', nombre: 'Base Líquida Mate', categoria: 'Rostro', precio: 900, contenido: '40 g',
      etiqueta: 'Cobertura media', resumen: 'Cobertura media con acabado mate natural y auténtico efecto segunda piel.',
      fotos: [{ src: 'img/base-liquida-frente.webp', w: 195, h: 605, alt: 'Base Líquida Mate Ana Laura, frente' }],
      parrafos: [
        'La Base Líquida Mate Ana Laura es maquillaje de nivel profesional, creada para quienes buscan resultados visibles, piel impecable y un acabado que se nota desde la primera aplicación.',
        'Su fórmula no comedogénica y Cruelty Free está diseñada para cuidar la piel mientras la perfecciona, ofreciendo un desempeño superior frente a bases convencionales. No solo cubre: eleva la calidad visual de tu piel.',
        'Gracias a su tecnología de adaptación, sin importar el tono que tengas, la base se integra de manera natural con tu piel, logrando un auténtico efecto segunda piel. El acabado mate natural deja el rostro uniforme, pulido y equilibrado, ideal tanto para el uso diario como para trabajos de maquillaje más exigentes.',
        'Su efecto 3D mejora visualmente la textura del rostro, aportando profundidad, uniformidad y un aspecto más profesional desde cualquier ángulo. Es la base que cumple cuando necesitas que tu maquillaje se vea bien en persona y se sienta correcto durante todo el día.'
      ],
      lista: { titulo: '¿Por qué elegirla?', items: ['Maquillaje de nivel profesional', 'Cruelty Free', 'Fórmula no comedogénica', 'Tecnología de adaptación que se integra a tu tono de piel', 'Acabado mate natural', 'Efecto 3D para una piel más uniforme y perfeccionada', 'Textura ligera y fácil de difuminar'] },
      tip: { titulo: 'Tip profesional de aplicación', texto: 'Aplica poca cantidad y difumina bien. Construye cobertura solo donde lo necesites para lograr un acabado más limpio y profesional.' }
    },
    {
      slug: 'base-en-crema-cobertura-maxima', id: '1d3c8a4d-4335-4f43-b382-75c9f5232efb', nombre: 'Base en Crema Cobertura Máxima', categoria: 'Rostro', precio: 900, contenido: '30 ml',
      etiqueta: 'Cobertura máxima', resumen: 'Cobertura impresionante y larga duración, aun en condiciones exigentes.',
      fotos: [{ src: 'img/base-crema.webp', w: 250, h: 555, alt: 'Base en Crema Cobertura Máxima Ana Laura, 30 ml' }],
      parrafos: [
        'La Base en Crema Máxima Cobertura Ana Laura es el maquillaje ideal para quienes exigen resultados de alto impacto: cobertura impresionante, piel uniforme desde la primera aplicación y un acabado que se mantiene durante horas, aun en condiciones exigentes.',
        'Su fórmula cremosa y altamente pigmentada está diseñada para ocultar imperfecciones, manchas y desigualdades de tono, ofreciendo un rendimiento superior a bases convencionales. No solo cubre: transforma la apariencia de tu piel, perfeccionándola con un acabado impecable que se ve profesional.',
        'Gracias a su textura en crema de alta densidad, la base se funde con la piel sin dejar sensación pesada, logrando un aspecto uniforme y pulido. Su cobertura máxima camufla imperfecciones visibles mientras mantiene un acabado natural y sofisticado, ideal tanto para uso diario si quieres un look fuerte, como para maquillaje social y sesiones fotográficas.',
        'La fórmula ha sido desarrollada para ofrecer larga duración, resistiendo sudor, calor y el paso del tiempo sin desvanecerse ni marcar parches. Además, se difumina fácilmente con brocha, esponja o dedos, permitiéndote construir cobertura según lo necesites sin generar un efecto apelmazado.'
      ],
      lista: { titulo: '¿Por qué elegirla?', items: ['Cobertura máxima que oculta imperfecciones visibles', 'Textura en crema de acabado impecable', 'Fórmula de larga duración para todo el día', 'Se integra con naturalidad a tu tono de piel', 'Acabado profesional sin sensación pesada', 'Fácil de aplicar y difuminar'] },
      tip: { titulo: 'Tip profesional de aplicación', texto: 'Para un acabado perfecto, hidrata tu piel antes de aplicar la base. Empieza con una capa ligera y construye la cobertura solo en las zonas que lo necesites para mantener un acabado uniforme y sin exceso de producto.' }
    },
    {
      slug: 'corrector-camouflage', id: '46bb533d-d272-4604-99d0-420ee3ee224a', nombre: 'Corrector en Crema Camouflage', categoria: 'Rostro', precio: 350, contenido: '5.7 g',
      etiqueta: 'Tono Yellow', resumen: 'Tono Yellow para neutralizar ojeras y manchas oscuras con muy poca cantidad.',
      fotos: [{ src: 'img/corrector-frente.webp', w: 280, h: 280, alt: 'Corrector en Crema Camouflage Ana Laura, tono Yellow, abierto' }, { src: 'img/corrector-reverso.webp', w: 280, h: 280, alt: 'Corrector en Crema Camouflage Ana Laura, reverso con ingredientes' }],
      parrafos: [
        'El Corrector en Crema Camouflage Ana Laura es una herramienta de maquillaje de alto rendimiento, diseñada para neutralizar, corregir y cubrir imperfecciones con precisión profesional desde la primera aplicación.',
        'Su alta concentración de pigmento permite corregir ojeras, manchas, rojeces y zonas oscurecidas sin necesidad de aplicar grandes cantidades. El tono Yellow está especialmente formulado para neutralizar tonos morados y violáceos, logrando una corrección limpia antes de la base o el corrector final.',
        'Su fórmula no comedogénica y Cruelty Free está diseñada para cuidar la piel mientras la perfecciona, ofreciendo un desempeño superior frente a correctores convencionales. No solo cubre: eleva la calidad visual de tu piel.',
        'Gracias a su textura cremosa y densa, el producto se adhiere perfectamente a la piel sin correrse ni marcar pliegues, manteniendo una corrección uniforme durante horas. No solo cubre: corrige visualmente el tono, mejorando el acabado del maquillaje completo.',
        'Su fórmula libre de talco y parabenos permite trabajar el producto con mayor control, ideal para maquillaje profesional, social y de alta exigencia. Funciona perfectamente para técnicas de corrección, contour correctivo y preparación de piel impecable.'
      ],
      lista: { titulo: '¿Por qué elegirlo?', items: ['Corrector tipo camouflage de alta cobertura', 'Tono Yellow ideal para neutralizar ojeras y manchas oscuras', 'Alta pigmentación con poca cantidad', 'Textura cremosa de fácil manejo', 'Fórmula libre de talco y parabenos', 'Ideal para maquillaje profesional y correctivo'] },
      tip: { titulo: 'Tip profesional de aplicación', texto: 'Aplica muy poca cantidad solo en la zona a corregir y difumina bien.' }
    },
    {
      slug: 'mineral-hd-setting-powder', id: '721fb0c2-8d99-4758-aca6-143ae075667d', nombre: 'Mineral HD Setting Powder', categoria: 'Rostro', precio: 650, contenido: '19 g',
      etiqueta: 'Translúcido', resumen: 'Sella el maquillaje, controla el brillo y difumina poros sin alterar el tono.',
      fotos: [{ src: 'img/polvo.webp', w: 465, h: 315, alt: 'Mineral HD Setting Powder Ana Laura' }],
      parrafos: [
        'El Mineral HD Setting Powder Ana Laura es el paso clave para sellar el maquillaje con un acabado impecable, ligero y de apariencia profesional, sin alterar el tono natural de la piel ni de la base.',
        'Su fórmula mineral y ultrafina está diseñada para fijar el maquillaje, controlar el brillo y perfeccionar visualmente la textura del rostro. No solo sella: refina el acabado, dejando una piel mate, uniforme y pulida, ideal tanto para uso diario como para fotografía y video.',
        'Su fórmula no comedogénica y Cruelty Free está diseñada para sellar el maquillaje y cuidar la piel, ofreciendo un acabado más limpio y duradero frente a polvos convencionales. No solo fija: perfecciona visualmente la textura de la piel, dejando un acabado uniforme, mate y profesional.',
        'Gracias a su tecnología HD, difumina ópticamente poros y líneas finas, creando un efecto de piel más lisa desde cualquier ángulo. Al ser translúcido, se adapta a todos los tonos de piel sin dejar efecto blanco ni sensación pesada.',
        'Su textura ligera permite trabajar el producto en capas, sellando zonas específicas o todo el rostro sin sobrecargar el maquillaje. Es el polvo ideal para lograr un acabado limpio, duradero y profesional.'
      ],
      lista: { titulo: '¿Por qué elegirlo?', items: ['Polvo mineral HD de acabado profesional', 'No altera el tono de la base ni del corrector', 'Controla el brillo y fija el maquillaje', 'Difumina visualmente poros y líneas finas', 'Textura ultrafina y ligera', 'Ideal para fotografía, video y uso diario'] },
      tip: { titulo: 'Tip profesional de aplicación', texto: 'Aplica con brocha para un acabado natural o con esponja para sellar zonas específicas. Retira el exceso para una piel más limpia y equilibrada.' }
    },
    {
      slug: 'simply-clean', id: '1f662b45-a4bc-4291-839d-b3f5014cf6fa', nombre: 'Simply Clean Eye Makeup Remover', categoria: 'Cuidado', precio: 800, contenido: '118 ml (4.0 fl oz)',
      etiqueta: 'Desmaquillante en spray', resumen: 'Desmaquillante y limpiador en spray con Aloe Vera: remueve sin frotar ni irritar.',
      fotos: [{ src: 'img/desmaquillante.webp', w: 110, h: 245, alt: 'Simply Clean Eye Makeup Remover Ana Laura, 118 ml' }],
      parrafos: [
        'Simply Clean Eye Makeup Remover Ana Laura es un limpiador–desmaquillante en spray de grado profesional, formulado para remover el maquillaje de ojos de manera suave, eficaz y sin irritar.',
        'Su fórmula ligera y no agresiva elimina delicadamente los restos de maquillaje, incluso de larga duración, sin necesidad de frotar ni maltratar la piel. No solo desmaquilla: limpia y calma la zona del contorno de ojos, dejando una sensación fresca y confortable.',
        'Su fórmula no comedogénica y Cruelty Free está diseñada para cuidar la piel, ofreciendo un desempeño superior. Limpia y cuida tu piel al mismo tiempo.',
        'Enriquecido con Aloe Vera, ayuda a hidratar, suavizar y reconfortar la piel durante la limpieza. Su textura acuosa no deja residuos grasos, lo que lo hace ideal para el uso diario y para todo tipo de piel, incluso las más sensibles.',
        'Gracias a su presentación en spray, permite una aplicación práctica, controlada e higiénica, ideal tanto para uso personal como profesional.'
      ],
      lista: { titulo: '¿Por qué elegirlo?', items: ['2 en 1, desmaquillante y limpiador facial', 'Remueve maquillaje sin irritar ni frotar', 'No deja sensación aceitosa', 'Enriquecido con Aloe Vera', 'Fórmula libre de parabenos', 'Ideal para uso diario y maquillaje profesional'] },
      tip: { titulo: 'Modo de uso', texto: 'Rocía el producto sobre un algodón y limpia suavemente el área de los ojos. Repite si es necesario.' }
    },
    {
      slug: 'shampoo-personalizado', id: 'eba363c6-24b4-408e-aba3-3509b3c7ff0b', nombre: 'Shampoo Personalizado 250 ml', alias: ['Shampoo Personalizado 250ml', 'Shampoo Personalizado'], categoria: 'Cabello', precio: 350, contenido: '250 ml',
      etiqueta: 'Personalizado', resumen: 'Formulado según tu tipo de cabello, su textura, necesidades y objetivos.',
      fotos: [{ src: 'img/shampoo.webp', w: 95, h: 245, alt: 'Shampoo personalizado Oleynick de 250 ml' }],
      parrafos: [
        'Porque ningún cabello es igual, tu shampoo tampoco debería serlo.',
        'Nuestro shampoo personalizado está diseñado para adaptarse a las necesidades reales de tu cabello. Tú nos dices y nos muestras cómo es tu pelo (tipo, textura, necesidades y objetivos) y nosotros formulamos y enviamos el shampoo que mejor le convenga a tu cabello.',
        'No es un producto genérico: es una solución pensada específicamente para ti. Ya sea que busques hidratación, control de frizz, reparación, brillo o limpieza profunda, tu shampoo se adapta a lo que tu cabello necesita en ese momento.'
      ],
      pasos: { titulo: '¿Cómo funciona?', items: ['Nos cuentas y nos muestras cómo es tu cabello', 'Analizamos tu tipo de pelo y sus necesidades', 'Te enviamos un shampoo personalizado para ti'] },
      lista: { titulo: 'Beneficios', items: ['Shampoo personalizado según tu tipo de cabello', 'Fórmula adaptada a tus necesidades', 'Ideal para todo tipo de pelo', 'Enfoque en cuidado y resultados reales'] },
      pers: { pregunta: 'Cuéntanos cómo es tu cabello: tipo, textura, necesidades y objetivos', fotos: 3, preparacion: 'Hasta 7 días hábiles' }
    }
  ];

  // Tono de fondo de cada producto (la foto, con fondo blanco, se integra con mix-blend-mode:multiply)
  var TONOS = {
    'base-liquida-mate': '#EADCCD',          // nude
    'base-en-crema-cobertura-maxima': '#E8DCC8', // champagne
    'corrector-camouflage': '#E5DFD7',       // piedra
    'mineral-hd-setting-powder': '#E3E2DE',  // niebla
    'simply-clean': '#DFE3DC',               // salvia
    'shampoo-personalizado': '#DCD2C7'       // arena
  };
  var TONO_BASE = '#ECE6DF';
  function tono(p) { return TONOS[p.key] || TONO_BASE; }

  // ---------------- Utilidades ----------------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function pesos(c) { var n = (c || 0) / 100; return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }); }
  function precioHTML(c, normal) { return '<span class="precio">' + (normal && normal > c ? '<s>' + pesos(normal) + '</s>' : '') + pesos(c) + '<small>MXN</small></span>'; }
  function leer(k) { try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function guardar(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: queda en memoria */ } }
  var ICONO_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var ICONO_WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.2-4.4A8.4 8.4 0 1 1 21 11.5Z"/></svg>';

  /** fetch a la API de Vende con tiempo límite. Devuelve { ok, status, datos }. */
  function api(ruta, opciones, ms) {
    opciones = opciones || {};
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 9000) : null;
    var init = { method: opciones.method || 'GET', headers: {}, credentials: 'omit', mode: 'cors' };
    if (ctrl) init.signal = ctrl.signal;
    if (opciones.json !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(opciones.json); }
    if (opciones.blob) { init.headers['content-type'] = opciones.tipo; init.body = opciones.blob; }
    return fetch(API + ruta, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, datos: d || {} }; });
    }).catch(function () { return { ok: false, status: 0, datos: {} }; }).then(function (r) { if (t) clearTimeout(t); return r; });
  }

  // ---------------- Estado ----------------
  var S = {
    modo: 'cargando',          // 'cargando' | 'linea' (Vende recibe pedidos) | 'whatsapp' (respaldo)
    tienda: null,
    productos: CATALOGO.map(desdeCatalogo),
    filtro: 'Todo',
    bolsa: (function () { var b = leer(K_BOLSA); return b && Array.isArray(b.items) ? b.items.filter(function (i) { return i && i.key && i.cantidad > 0; }) : []; })(),
    codigo: null, cot: null, cotN: 0, fotos: {}, enviando: false
  };
  var listo;

  function desdeCatalogo(l) {
    return {
      key: l.slug, id: l.id, nombre: l.nombre, categoria: l.categoria, precio_c: l.precio * 100, precio_normal_c: null, disponible: true, variantes: [],
      fotos: l.fotos, local: l, descripcion: null, contenido: l.contenido,
      personalizado: l.pers ? { pregunta: l.pers.pregunta, fotos: l.pers.fotos } : null, preparacion: l.pers ? l.pers.preparacion : null
    };
  }
  var porId = {}, porNombre = {};
  CATALOGO.forEach(function (l, i) { l.orden = i; porId[l.id] = l; porNombre[norm(l.nombre)] = l; (l.alias || []).forEach(function (a) { porNombre[norm(a)] = l; }); });

  function desdeApi(p) {
    var l = porId[p.id] || porNombre[norm(p.nombre)] || null;
    var fotos = (p.fotos || []).length ? p.fotos.map(function (u, i) {
      var f = l && l.fotos[i];
      return { src: u, alt: f ? f.alt : p.nombre + (i ? ' · foto ' + (i + 1) : '') };
    }) : (l ? l.fotos : []);
    return {
      key: l ? l.slug : 'v-' + p.id, id: p.id, nombre: p.nombre, categoria: p.categoria || (l && l.categoria) || 'Más', precio_c: p.precio_final_c,
      precio_normal_c: p.en_oferta ? p.precio_c : null, precio_desde: !!p.precio_desde, disponible: p.disponible !== false, existencias: p.existencias,
      variantes: (p.variantes || []), fotos: fotos, local: l, descripcion: p.descripcion || null, contenido: (l && l.contenido) || p.unidad || null,
      personalizado: p.personalizado || null, preparacion: p.preparacion || null, orden: l ? l.orden : 100
    };
  }
  function producto(key) { for (var i = 0; i < S.productos.length; i++) if (S.productos[i].key === key) return S.productos[i]; return null; }

  // ---------------- Carga desde Vende ----------------
  function cargar() {
    return Promise.all([api(''), api('/productos')]).then(function (r) {
      var t = r[0], p = r[1];
      if (!t.ok || !t.datos.tienda || !p.ok || !Array.isArray(p.datos.productos) || !p.datos.productos.length) { ponerModo('whatsapp'); return; }
      S.tienda = t.datos.tienda;
      // Solo maquillaje y cuidado: lo del catálogo, o lo que ella dé de alta en Vende en estas categorías (su cuenta puede tener otros negocios)
      var CATS = ['rostro', 'ojos', 'labios', 'cuidado', 'cabello', 'maquillaje', 'accesorios'];
      S.productos = p.datos.productos.filter(function (x) { return porId[x.id] || porNombre[norm(x.nombre)] || CATS.indexOf(norm(x.categoria || '')) >= 0; })
        .map(desdeApi).sort(function (a, b) { return a.orden - b.orden; });
      if (!S.productos.length) { ponerModo('whatsapp'); return; }
      // Quita de la bolsa lo que ya no existe en la tienda
      S.bolsa = S.bolsa.filter(function (i) { return !!producto(i.key); });
      guardarBolsa();
      politicasDeVende(S.tienda.politicas || {});
      ponerModo(S.tienda.acepta_pedidos ? 'linea' : 'whatsapp');
    });
  }
  function politicasDeVende(pol) {
    [['envio', 'pol-envio'], ['cambios', 'pol-cambios'], ['privacidad', 'pol-privacidad']].forEach(function (x) {
      var txt = pol[x[0]], caja = document.getElementById(x[1]);
      if (!txt || !caja) return;
      $('.txt', caja).innerHTML = String(txt).split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('');
    });
  }
  function ponerModo(m) {
    S.modo = m;
    $('#aviso-modo').hidden = m !== 'whatsapp';
    $('#aviso-wa').href = ligaWhatsapp();
    if (m === 'linea') {
      var h = (S.tienda && S.tienda.pago && S.tienda.pago.horas_para_pagar) || 24;
      $('#pasos-compra').innerHTML =
        '<li><b>Elige tus productos</b> y agrégalos a tu bolsa. En el shampoo nos cuentas cómo es tu cabello.</li>' +
        '<li><b>Haz tu pedido</b> con tus datos de envío. Tus productos quedan apartados y te llega la confirmación por correo.</li>' +
        '<li><b>Transfiere en ' + h + ' horas</b> con tu número de pedido como concepto y sube tu comprobante. Te avisamos cuando lo confirmemos.</li>';
    }
    pintarColeccion();
    pintarBolsa();
  }

  // ---------------- Colección ----------------
  function categorias() {
    var c = [];
    S.productos.forEach(function (p) { if (p.categoria && c.indexOf(p.categoria) < 0) c.push(p.categoria); });
    return c;
  }
  function imgHTML(f, extra) {
    if (!f) return '<span class="vacia" aria-hidden="true">AL</span>';
    return '<img src="' + esc(f.src) + '"' + (f.w ? ' width="' + f.w + '" height="' + f.h + '"' : '') + ' alt="' + esc(f.alt || '') + '" loading="lazy" decoding="async"' + (extra || '') + '>';
  }
  /** Línea corta bajo el nombre: «Cobertura media · 40 g» (o la primera frase de la descripción de Vende). */
  function descriptor(p) {
    var l = p.local;
    if (l) return [l.etiqueta, p.contenido].filter(Boolean).join(' · ');
    var d = (String(p.descripcion || '').split(/\n/)[0].match(/^[^.]*\.?/) || [''])[0];
    return d.length > 60 ? d.slice(0, 58).replace(/\s+\S*$/, '') + '…' : d;
  }
  function precioCorto(c, normal) { return '<span class="precio">' + (normal && normal > c ? '<s>' + pesos(normal) + '</s>' : '') + pesos(c) + '</span>'; }
  function pintarColeccion() {
    var cats = categorias();
    if (cats.indexOf(S.filtro) < 0) S.filtro = 'Todo';
    $('#filtros').innerHTML = cats.length > 1 ? ['Todo'].concat(cats).map(function (c) {
      return '<button type="button" data-filtro="' + esc(c) + '" aria-pressed="' + (S.filtro === c) + '">' + esc(c) + '</button>';
    }).join('') : '';
    $('#rejilla').innerHTML = S.productos.filter(function (p) { return S.filtro === 'Todo' || p.categoria === S.filtro; }).map(function (p) {
      var sello = !p.disponible ? '<span class="sello">Agotado</span>' : p.personalizado ? '<span class="sello">Personalizado</span>' : p.precio_normal_c ? '<span class="sello">Precio especial</span>' : '';
      var accion = !p.disponible ? '<button class="agregar" type="button" disabled>Agotado</button>'
        : p.variantes.length ? '<button class="agregar" type="button" data-ver="' + esc(p.key) + '">Elegir opción</button>'
        : '<button class="agregar" type="button" data-agregar="' + esc(p.key) + '" aria-label="Agregar ' + esc(p.nombre) + ' a la bolsa">Agregar</button>';
      return '<li class="tarjeta">' +
        '<button class="foto" type="button" data-ver="' + esc(p.key) + '" aria-label="Ver ' + esc(p.nombre) + '" style="--tono:' + tono(p) + '">' + sello + imgHTML(p.fotos[0]) + '</button>' +
        '<div class="info"><div class="fila-n"><h3><button type="button" data-ver="' + esc(p.key) + '">' + esc(p.nombre) + '</button></h3>' +
        (p.precio_desde ? '<span class="precio"><small>desde</small> ' + pesos(p.precio_c) + '</span>' : precioCorto(p.precio_c, p.precio_normal_c)) + '</div>' +
        '<p class="desc">' + esc(descriptor(p)) + '</p>' + accion + '</div></li>';
    }).join('');
  }

  // ---------------- Hojas (dialog) ----------------
  function abrirHoja(d) {
    $$('dialog[open]').forEach(function (o) { if (o !== d) o.close(); });
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
    document.documentElement.classList.add('fijo');
  }
  function cerrarHoja(d) { if (d.open) { if (d.close) d.close(); else d.removeAttribute('open'); } }
  $$('dialog.hoja').forEach(function (d) {
    d.addEventListener('close', function () {
      if (!$$('dialog[open]').length) document.documentElement.classList.remove('fijo');
      if (d.id === 'dlg-producto' && /^#p\//.test(location.hash)) quitarHash();
    });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar]')) { cerrarHoja(d); return; }
      if (e.target === d) {
        var r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrarHoja(d);
      }
    });
  });
  function quitarHash() { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* nada */ } }

  // ---------------- Ficha de producto ----------------
  function abrirProducto(key) {
    var p = producto(key);
    if (!p) return;
    var l = p.local, d = $('#dlg-producto');
    S.actual = p.key;
    var fotos = p.fotos.length ? p.fotos : [null];
    var parrafos = l ? l.parrafos : String(p.descripcion || '').split(/\n\s*\n|\n/).filter(Boolean);
    var html = '<div class="hoja-cab"><p class="migas-f">Makeup <span aria-hidden="true">/</span> ' + esc(p.categoria || '') + '</p><button class="cerrar" type="button" data-cerrar aria-label="Cerrar">' + ICONO_X + '</button></div>' +
      '<div class="producto-g"><div class="galeria" style="--tono:' + tono(p) + '"><div class="grande">' + imgHTML(fotos[0], ' id="g-img"').replace(' loading="lazy"', '') + '</div>' +
      (fotos.length > 1 ? '<div class="miniaturas">' + fotos.map(function (f, i) {
        return '<button type="button" data-foto="' + i + '" aria-current="' + (i === 0) + '" aria-label="Ver foto ' + (i + 1) + ' de ' + fotos.length + '">' + imgHTML(f).replace(/ alt="[^"]*"/, ' alt=""') + '</button>';
      }).join('') + '</div>' : '') + '</div>' +
      '<div class="ficha"><div class="ficha-sup"><h3 id="p-titulo" tabindex="-1" autofocus>' + esc(p.nombre) + '</h3>' +
      (l && l.etiqueta ? '<p class="sub-n">' + esc(l.etiqueta) + '</p>' : '') +
      '<div class="meta">' + precioHTML(p.precio_c, p.precio_normal_c) +
      (p.contenido ? '<span class="neto">Contenido neto: ' + esc(p.contenido) + '</span>' : '') + '</div>' +
      (l && l.resumen ? '<p class="resumen-f">' + esc(l.resumen) + '</p>' : '') + '</div>';
    if (p.variantes.length) {
      html += '<div class="opciones-v"><label for="p-variante">Elige una opción</label><select id="p-variante">' + p.variantes.map(function (v) {
        return '<option value="' + esc(v.id) + '"' + (v.disponible === false ? ' disabled' : '') + '>' + esc(v.nombre) + ' · ' + pesos(v.precio_c) + (v.disponible === false ? ' (agotado)' : '') + '</option>';
      }).join('') + '</select></div>';
    }
    if (p.personalizado) {
      html += '<div class="nota-pers"><b>Hecho para ti.</b><span>Al finalizar tu pedido te preguntaremos: «' + esc(p.personalizado.pregunta) + '»' +
        (p.personalizado.fotos ? ' y podrás mandarnos hasta ' + p.personalizado.fotos + ' fotos de tu cabello.' : '.') + '</span>' +
        (p.preparacion ? '<span>Preparación: ' + esc(p.preparacion.charAt(0).toLowerCase() + p.preparacion.slice(1)) + '.</span>' : '') + '</div>';
    }
    html += p.disponible
      ? '<div class="comprar-fila"><div class="cantidad" role="group" aria-label="Cantidad"><button type="button" data-cant="-1" aria-label="Uno menos">−</button><output id="p-cant">1</output><button type="button" data-cant="1" aria-label="Uno más">+</button></div>' +
        '<button class="boton" type="button" id="p-agregar" data-key="' + esc(p.key) + '">Agregar a la bolsa</button></div>'
      : '<p class="nota-pers"><b>Agotado por ahora.</b><span><a class="enlace" href="' + esc(ligaWhatsapp('Hola, ¿cuándo vuelve a estar disponible ' + p.nombre + '?')) + '" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a></span></p>';
    var gratis = S.modo === 'linea' && S.tienda && S.tienda.entrega && S.tienda.entrega.envio ? S.tienda.entrega.envio.gratis_desde_c : ENVIO_GRATIS_C;
    html += '<ul class="confianza"><li>Envío a todo México' + (gratis ? ', gratis desde ' + pesos(gratis) : '') + '</li>' +
      '<li>' + (S.modo === 'linea' ? 'Pago por transferencia; tus productos quedan apartados' : 'Pedido y pago por WhatsApp, con atención personal') + '</li></ul>';
    // Textos largos organizados como ficha de marca: Descripción · Beneficios · Cómo usar / Cómo funciona · Contenido
    var sec = function (titulo, cuerpo, abierta) { return '<details' + (abierta ? ' open' : '') + '><summary>' + esc(titulo) + '</summary><div class="txt">' + cuerpo + '</div></details>'; };
    var lista = function (items, tag) { return '<' + tag + ' class="lista-f">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</' + tag + '>'; };
    html += '<div class="acordeon ficha-ac">';
    if (parrafos.length) html += sec('Descripción', parrafos.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join(''), !l);
    if (l && l.pasos) html += sec('Cómo funciona', lista(l.pasos.items, 'ol'));
    if (l && l.lista) html += sec('Beneficios', lista(l.lista.items, 'ul'));
    if (l && l.tip) html += sec('Cómo usar', '<p><b>' + esc(l.tip.titulo) + '.</b> ' + esc(l.tip.texto) + '</p>');
    if (p.contenido || p.preparacion) html += sec('Contenido', (p.contenido ? '<p>Contenido neto: ' + esc(p.contenido) + '.</p>' : '') + (p.preparacion ? '<p>Preparación: ' + esc(p.preparacion.charAt(0).toLowerCase() + p.preparacion.slice(1)) + '.</p>' : ''));
    html += '</div></div></div>';
    d.innerHTML = html;
    d.scrollTop = 0;
    abrirHoja(d);
    try { history.replaceState(null, '', '#p/' + p.key); } catch (e) { /* nada */ }
  }
  $('#dlg-producto').addEventListener('click', function (e) {
    var b = e.target.closest('[data-foto]');
    if (b) {
      var p = producto(S.actual);
      var f = p && p.fotos[Number(b.dataset.foto)], img = $('#g-img');
      if (f && img) { img.src = f.src; img.alt = f.alt || ''; if (f.w) { img.width = f.w; img.height = f.h; } }
      $$('[data-foto]', this).forEach(function (x) { x.setAttribute('aria-current', String(x === b)); });
      return;
    }
    var c = e.target.closest('[data-cant]');
    if (c) { var o = $('#p-cant'); o.value = o.textContent = String(Math.min(50, Math.max(1, Number(o.textContent) + Number(c.dataset.cant)))); return; }
    var a = e.target.closest('#p-agregar');
    if (a) {
      var v = $('#p-variante');
      agregar(a.dataset.key, Number($('#p-cant').textContent) || 1, v ? v.value : null);
      cerrarHoja($('#dlg-producto'));
    }
  });

  // ---------------- Bolsa ----------------
  function guardarBolsa() { guardar(K_BOLSA, { items: S.bolsa }); }
  function claveItem(key, variante) { return key + '|' + (variante || ''); }
  function agregar(key, cantidad, variante) {
    var p = producto(key);
    if (!p) return;
    var k = claveItem(key, variante), it = null;
    S.bolsa.forEach(function (i) { if (claveItem(i.key, i.variante_id) === k) it = i; });
    if (it) it.cantidad = Math.min(50, it.cantidad + cantidad);
    else S.bolsa.push({ key: key, variante_id: variante || null, cantidad: Math.min(50, cantidad) });
    guardarBolsa();
    pintarBolsa();
    aviso(p.nombre + ' · en tu bolsa');
  }
  function lineas() {
    return S.bolsa.map(function (i) {
      var p = producto(i.key);
      if (!p) return null;
      var v = null;
      p.variantes.forEach(function (x) { if (x.id === i.variante_id) v = x; });
      var precio = v ? v.precio_c : p.precio_c;
      return { item: i, p: p, v: v, precio_c: precio, importe_c: precio * i.cantidad };
    }).filter(Boolean);
  }
  function subtotal() { return lineas().reduce(function (s, l) { return s + l.importe_c; }, 0); }
  function piezas() { return S.bolsa.reduce(function (s, i) { return s + i.cantidad; }, 0); }

  function pintarBolsa() {
    var n = piezas(), cuenta = $('#cuenta-bolsa');
    cuenta.hidden = !n; cuenta.textContent = String(n);
    $('#cuenta-txt').textContent = n ? ', ' + n + (n === 1 ? ' pieza' : ' piezas') : ', vacía';
    var ls = lineas(), cuerpo = $('#bolsa-cuerpo'), pie = $('#bolsa-pie');
    var ult = leer(K_PEDIDO), ultHTML = ult && ult.token && Date.now() - (ult.t || 0) < 8 * 864e5 && S.modo === 'linea'
      ? '<p class="ultimo">¿Ya hiciste un pedido? <button type="button" id="ver-ultimo">Ver mi pedido ' + esc(ult.numero || '') + '</button></p>' : '';
    if (!ls.length) {
      cuerpo.innerHTML = '<div class="vacio"><p>Tu bolsa está vacía</p><button class="boton claro" type="button" data-cerrar data-ir="#coleccion">Ver la colección</button></div>';
      pie.innerHTML = ultHTML;
      pie.hidden = !ultHTML;
      return;
    }
    pie.hidden = false;
    cuerpo.innerHTML = '<ul class="renglones">' + ls.map(function (l) {
      var k = esc(claveItem(l.item.key, l.item.variante_id));
      return '<li class="renglon"><span class="mini-foto" style="--tono:' + tono(l.p) + '">' + imgHTML(l.p.fotos[0]).replace(/ alt="[^"]*"/, ' alt=""') + '</span>' +
        '<div><h3>' + esc(l.p.nombre) + '</h3><p class="det">' + (l.v ? esc(l.v.nombre) + ' · ' : '') + pesos(l.precio_c) + (l.p.personalizado ? ' · personalizado' : '') + '</p>' +
        '<div class="cantidad" role="group" aria-label="Cantidad de ' + esc(l.p.nombre) + '"><button type="button" data-mas="-1" data-k="' + k + '" aria-label="Uno menos">−</button><output>' + l.item.cantidad + '</output><button type="button" data-mas="1" data-k="' + k + '" aria-label="Uno más">+</button></div></div>' +
        '<div class="der">' + '<span class="precio">' + pesos(l.importe_c) + '</span><button class="quitar" type="button" data-quitar="' + k + '">Quitar</button></div></li>';
    }).join('') + '</ul>';
    var sub = subtotal(), envioTxt;
    var envioVende = S.tienda && S.tienda.entrega && S.tienda.entrega.envio;
    var gratis = S.modo === 'linea' ? (envioVende ? envioVende.gratis_desde_c : null) : ENVIO_GRATIS_C;
    if (gratis && sub >= gratis) envioTxt = 'Tu envío es gratis.';
    else if (gratis) envioTxt = 'Te faltan ' + pesos(gratis - sub) + ' para el envío gratis. El envío se calcula con tu estado' + (S.modo === 'linea' ? '.' : ', con un máximo de ' + pesos(ENVIO_MAX_C) + '.');
    else envioTxt = 'El envío se calcula con tu estado en el siguiente paso.';
    var avance = gratis ? '<div class="avance" role="presentation"><span style="width:' + Math.min(100, Math.round(sub / gratis * 100)) + '%"></span></div>' : '';
    var boton = S.modo === 'linea'
      ? '<button class="boton" type="button" id="ir-pago">Continuar al pago</button>'
      : S.modo === 'cargando'
        ? '<button class="boton" type="button" id="ir-pago">Continuar</button>'
        : '<a class="boton" href="' + esc(ligaWhatsapp()) + '" target="_blank" rel="noopener">' + ICONO_WA + ' Enviar pedido por WhatsApp</a><p class="nota">Te confirmamos existencias, envío y datos de pago por WhatsApp.</p>';
    cuerpo.insertAdjacentHTML('afterbegin', '<div class="envio-b"><p>' + envioTxt + '</p>' + avance + '</div>');
    pie.innerHTML = '<div class="suma"><span>Subtotal</span>' + '<span class="precio">' + pesos(sub) + '<small>MXN</small></span></div>' + boton + ultHTML;
  }
  $('#dlg-bolsa').addEventListener('click', function (e) {
    var m = e.target.closest('[data-mas]'), q = e.target.closest('[data-quitar]');
    if (m || q) {
      var k = (m || q).dataset.k || q.dataset.quitar;
      S.bolsa = S.bolsa.map(function (i) {
        if (claveItem(i.key, i.variante_id) !== k) return i;
        var c = q ? 0 : Math.min(50, i.cantidad + Number(m.dataset.mas));
        return c > 0 ? { key: i.key, variante_id: i.variante_id, cantidad: c } : null;
      }).filter(Boolean);
      guardarBolsa(); pintarBolsa();
      return;
    }
    var ir = e.target.closest('[data-ir]');
    if (ir) { var dest = $(ir.dataset.ir); if (dest) setTimeout(function () { dest.scrollIntoView({ behavior: 'smooth' }); }, 50); return; }
    if (e.target.closest('#ir-pago')) { abrirPago(); return; }
    if (e.target.closest('#ver-ultimo')) { verUltimo(); }
  });
  $('#abrir-bolsa').addEventListener('click', function () { pintarBolsa(); abrirHoja($('#dlg-bolsa')); });

  function ligaWhatsapp(texto) {
    if (!texto) {
      var ls = lineas();
      if (!ls.length) texto = 'Hola, vi la tienda de Ana Laura Makeup y quiero hacer un pedido.';
      else {
        var sub = subtotal();
        texto = 'Hola, quiero hacer este pedido de Ana Laura Makeup:\n' + ls.map(function (l) {
          return '• ' + l.item.cantidad + ' × ' + l.p.nombre + (l.v ? ' (' + l.v.nombre + ')' : '') + ' · ' + pesos(l.precio_c);
        }).join('\n') + '\n\nSubtotal: ' + pesos(sub) + ' MXN\nEnvío: ' + (sub >= ENVIO_GRATIS_C ? 'gratis (compra desde ' + pesos(ENVIO_GRATIS_C) + ')' : 'según mi estado (máximo ' + pesos(ENVIO_MAX_C) + ')') +
          (ls.some(function (l) { return l.p.personalizado; }) ? '\n\nPara el shampoo personalizado les cuento cómo es mi cabello y les mando fotos.' : '') +
          '\n\nMi nombre:\nCiudad y estado:';
      }
    }
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto);
  }

  // ---------------- Aviso flotante ----------------
  var avisoT;
  function aviso(txt, sinBoton) {
    var a = $('#aviso-f');
    $('#aviso-txt').textContent = txt;
    $('#aviso-btn').hidden = !!sinBoton;
    a.classList.add('ver');
    clearTimeout(avisoT);
    avisoT = setTimeout(function () { a.classList.remove('ver'); }, 4200);
  }
  $('#aviso-btn').addEventListener('click', function () { $('#aviso-f').classList.remove('ver'); pintarBolsa(); abrirHoja($('#dlg-bolsa')); });

  // ---------------- Pago ----------------
  function entregas() {
    var e = (S.tienda && S.tienda.entrega) || {};
    var r = [];
    if (e.envio) r.push('envio');
    if (e.recoger) r.push('recoger');
    return r.length ? r : ['envio'];
  }
  function abrirPago() {
    if (S.modo === 'cargando') { var b = $('#ir-pago'); if (b) { b.textContent = 'Un momento…'; b.disabled = true; } listo.then(abrirPago); return; }
    if (S.modo !== 'linea') { window.open(ligaWhatsapp(), '_blank', 'noopener'); return; }
    if (!lineas().length) return;
    S.codigo = null; S.cot = null;
    var ents = entregas(), e = S.tienda.entrega || {};
    var pers = lineas().filter(function (l) { return l.p.personalizado; });
    var opcionesEstado = '<option value="">Elige tu estado</option>' + ESTADOS.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    var html = '<div class="pago-g"><form class="pago-form" id="f-pago" novalidate>' +
      '<fieldset class="grupo"><legend>Tus datos<small>Te mandamos tu pedido y los datos para pagar a tu correo.</small></legend><div class="campos">' +
      campo('f-nombre', 'Nombre completo', '<input type="text" id="f-nombre" autocomplete="name" maxlength="80" required>', true) +
      campo('f-correo', 'Correo', '<input type="email" id="f-correo" autocomplete="email" maxlength="254" required>') +
      campo('f-wa', 'WhatsApp <i>(10 dígitos)</i>', '<input type="tel" id="f-wa" autocomplete="tel-national" inputmode="numeric" maxlength="16" required>') +
      '</div></fieldset>';
    if (ents.length > 1) {
      html += '<fieldset class="grupo"><legend>Entrega</legend>' +
        '<label class="check"><input type="radio" name="entrega" value="envio" checked><span>Envío a domicilio' + (e.envio && e.envio.nota ? '<br><small>' + esc(e.envio.nota) + '</small>' : '') + '</span></label>' +
        '<label class="check"><input type="radio" name="entrega" value="recoger"><span>Recoger' + (e.recoger && e.recoger.nota ? '<br><small>' + esc(e.recoger.nota) + '</small>' : '') + '</span></label></fieldset>';
    }
    html += '<fieldset class="grupo" id="g-direccion"' + (ents[0] === 'recoger' && ents.length === 1 ? ' hidden' : '') + '><legend>Dirección de envío<small>' + esc((e.envio && e.envio.nota) || 'Enviamos a todo México.') + '</small></legend><div class="campos">' +
      campo('f-calle', 'Calle y número', '<input type="text" id="f-calle" autocomplete="address-line1" maxlength="160" required>', true) +
      campo('f-colonia', 'Colonia', '<input type="text" id="f-colonia" autocomplete="address-level3" maxlength="100" required>') +
      campo('f-cp', 'Código postal', '<input type="text" id="f-cp" autocomplete="postal-code" inputmode="numeric" maxlength="5" required>') +
      campo('f-ciudad', 'Ciudad o municipio', '<input type="text" id="f-ciudad" autocomplete="address-level2" maxlength="80" required>') +
      campo('f-estado', 'Estado', '<select id="f-estado" autocomplete="address-level1" required>' + opcionesEstado + '</select>') +
      campo('f-ref', 'Referencias <i>(opcional)</i>', '<input type="text" id="f-ref" maxlength="200" placeholder="Entre calles, color de la casa…">', true) +
      '</div></fieldset>';
    if (pers.length) {
      html += '<fieldset class="grupo"><legend>Tu producto personalizado<small>Solo Ana Laura y su equipo ven tus respuestas y fotos; se usan únicamente para formular tu producto.</small></legend>' +
        pers.map(function (l) {
          var k = esc(l.p.key), nf = l.p.personalizado.fotos || 0;
          return '<div class="pers"><h3>' + esc(l.p.nombre) + '</h3>' +
            campo('f-resp-' + k, esc(l.p.personalizado.pregunta), '<textarea id="f-resp-' + k + '" data-resp="' + k + '" maxlength="1000" required placeholder="Por ejemplo: lacio, grueso, con frizz; quiero más brillo e hidratación"></textarea>', true) +
            (nf ? '<div class="campo"><span class="lbl">Fotos de tu cabello <i>(opcional, hasta ' + nf + ')</i></span><div class="fotos-sel" id="fotos-' + k + '"></div></div>' : '') +
            (l.p.preparacion ? '<p class="campo ayuda">Preparación: ' + esc(l.p.preparacion.charAt(0).toLowerCase() + l.p.preparacion.slice(1)) + '.</p>' : '') + '</div>';
        }).join('') + '</fieldset>';
    }
    html += '<fieldset class="grupo"><legend>Algo más</legend><div class="campos">' +
      campo('f-nota', 'Nota para tu pedido <i>(opcional)</i>', '<textarea id="f-nota" maxlength="500"></textarea>', true) +
      '</div></fieldset>' +
      '<fieldset class="grupo"><legend>Confirmación</legend>' +
      '<label class="check" id="c-priv"><input type="checkbox" id="f-priv" required><span>Acepto el <a href="' + esc(S.tienda.aviso_privacidad_url || 'https://vorka.mx/legal/vende/privacidad-clientas/') + '" target="_blank" rel="noopener">aviso de privacidad</a> y las <a href="#politicas" data-cerrar-pago>políticas de envío, cambios y privacidad</a>.</span></label>' +
      '<label class="check"><input type="checkbox" id="f-promo"><span>Quiero recibir novedades y descuentos especiales <i>(opcional)</i>.</span></label>' +
      '<p class="campo err" id="err-priv" hidden>Para hacer tu pedido acepta el aviso de privacidad.</p>' +
      '</fieldset>' +
      '<div class="error-gral" id="error-gral" role="alert" hidden></div>' +
      '<button class="boton enviar" type="submit" id="f-enviar">Hacer mi pedido</button>' +
      '<p class="seguro" style="margin-top:14px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>Pago por transferencia: al confirmar recibes los datos de la cuenta y ' + ((S.tienda.pago && S.tienda.pago.horas_para_pagar) || 24) + ' horas para transferir. Tus productos quedan apartados mientras tanto.</span></p>' +
      '</form>' +
      '<aside class="pago-res" aria-label="Resumen del pedido"><div class="pegajoso"><p class="res-tit">Tu pedido</p><ul class="res-items" id="res-items"></ul>' +
      '<div class="campo"><label for="f-codigo">Código de descuento</label><div class="codigo-fila"><input type="text" id="f-codigo" maxlength="30" autocomplete="off" spellcheck="false"><button class="mini claro" type="button" id="f-aplicar">Aplicar</button></div><p class="msg" id="msg-codigo" aria-live="polite"></p></div>' +
      '<div class="totales" id="totales"></div><p class="estado-cot" id="estado-cot" aria-live="polite"></p></div></aside></div>';
    $('#pg-titulo').textContent = 'Finalizar pedido';
    $('#pago-cuerpo').innerHTML = html;
    pers.forEach(function (l) { pintarFotos(l.p.key); });
    pintarResumen();
    abrirHoja($('#dlg-pago'));
    $('#dlg-pago').scrollTop = 0;
    cotizar();
  }
  function campo(id, etiqueta, control, ancho) {
    return '<div class="campo' + (ancho ? ' ancho' : '') + '" data-campo="' + id + '"><label for="' + id + '">' + etiqueta + '</label>' + control + '<span class="err" hidden></span></div>';
  }
  function entregaElegida() { var r = $('input[name=entrega]:checked'); return r ? r.value : entregas()[0]; }
  function itemsApi(conRespuesta) {
    return lineas().map(function (l) {
      var it = { producto_id: l.p.id, cantidad: l.item.cantidad };
      if (l.item.variante_id) it.variante_id = l.item.variante_id;
      if (conRespuesta && l.p.personalizado) { var t = $('[data-resp="' + l.p.key + '"]'); it.respuesta = t ? t.value.trim() : ''; }
      return it;
    });
  }

  function pintarResumen() {
    var ul = $('#res-items');
    if (!ul) return;
    ul.innerHTML = lineas().map(function (l) {
      return '<li><span class="mini-foto">' + imgHTML(l.p.fotos[0]).replace(/ alt="[^"]*"/, ' alt=""') + '<b>' + l.item.cantidad + '</b></span><span>' + esc(l.p.nombre) + (l.v ? '<br><small>' + esc(l.v.nombre) + '</small>' : '') + '</span><span class="precio">' + pesos(l.importe_c) + '</span></li>';
    }).join('');
    var c = S.cot, sub = c ? c.subtotal_c : subtotal(), est = $('#f-estado') ? $('#f-estado').value : '';
    var envio = !c ? '<span>Por calcular</span>' : c.envio_c === 0 ? '<span>' + (entregaElegida() === 'recoger' ? 'Sin costo' : 'Gratis') + '</span>' : '<span>' + pesos(c.envio_c) + '</span>';
    $('#totales').innerHTML = '<div><span>Subtotal</span><span>' + pesos(sub) + '</span></div>' +
      (c && c.descuento_c ? '<div class="desc"><span>Descuento' + (S.codigo ? ' (' + esc(S.codigo) + ')' : '') + '</span><span>−' + pesos(c.descuento_c) + '</span></div>' : '') +
      '<div><span>' + (entregaElegida() === 'recoger' ? 'Entrega' : 'Envío' + (c && c.envio_c && !est ? ' <small>(estimado)</small>' : '')) + '</span>' + envio + '</div>' +
      '<div class="total"><span>Total</span><span class="precio">' + pesos(c ? c.total_c : sub) + '<small>MXN</small></span></div>';
  }

  var cotT;
  function cotizar(inmediato) {
    clearTimeout(cotT);
    cotT = setTimeout(function () {
      var n = ++S.cotN, est = $('#f-estado') ? $('#f-estado').value : '', ent = entregaElegida();
      var cuerpo = { items: itemsApi(false), entrega: ent };
      if (ent === 'envio' && est) cuerpo.estado = est;
      if (S.codigo) cuerpo.codigo = S.codigo;
      $('#estado-cot').textContent = 'Calculando con los precios de la tienda…';
      api('/cotizar', { method: 'POST', json: cuerpo }).then(function (r) {
        if (n !== S.cotN || !$('#estado-cot')) return;
        if (r.ok && r.datos.valido === false && S.codigo) {
          S.codigo = null;
          mensajeCodigo(r.datos.mensaje || 'Ese código ya no aplica.', false);
          cotizar(true);
          return;
        }
        if (!r.ok) { S.cot = null; $('#estado-cot').textContent = r.datos.error || 'No pudimos calcular el total. Revisa tu conexión.'; pintarResumen(); return; }
        S.cot = r.datos;
        $('#estado-cot').textContent = '';
        pintarResumen();
      });
    }, inmediato ? 0 : 350);
  }
  function mensajeCodigo(t, ok) { var m = $('#msg-codigo'); if (m) { m.textContent = t || ''; m.className = 'msg ' + (ok ? 'ok' : 'mal'); } }
  function aplicarCodigo() {
    var c = ($('#f-codigo').value || '').trim().toUpperCase();
    if (!c) { S.codigo = null; mensajeCodigo('', true); cotizar(true); return; }
    if (!/^[\w-]{1,30}$/.test(c)) { mensajeCodigo('Revisa el código: solo letras, números y guiones.', false); return; }
    var b = $('#f-aplicar'); b.disabled = true;
    var est = $('#f-estado').value, ent = entregaElegida();
    var cuerpo = { codigo: c, items: itemsApi(false), entrega: ent };
    if (ent === 'envio' && est) cuerpo.estado = est;
    api('/promos/validar', { method: 'POST', json: cuerpo }).then(function (r) {
      b.disabled = false;
      if (r.ok && r.datos.valido) { S.codigo = c; S.cot = r.datos; mensajeCodigo(r.datos.mensaje || 'Código aplicado.', true); pintarResumen(); }
      else { S.codigo = null; mensajeCodigo((r.datos && (r.datos.mensaje || r.datos.error)) || 'No pudimos revisar el código. Intenta de nuevo.', false); cotizar(true); }
    });
  }

  // Fotos del producto personalizado (se suben después de crear el pedido)
  function pintarFotos(key) {
    var caja = document.getElementById('fotos-' + key);
    if (!caja) return;
    var p = producto(key), max = (p.personalizado && p.personalizado.fotos) || 0, sel = S.fotos[key] || [];
    caja.innerHTML = sel.map(function (f, i) { return '<figure><img src="' + f.url + '" alt="Foto ' + (i + 1) + ' de tu cabello"><button type="button" data-quitar-foto="' + esc(key) + '" data-i="' + i + '" aria-label="Quitar foto ' + (i + 1) + '">×</button></figure>'; }).join('') +
      (sel.length < max ? '<label class="archivo">+ Agregar foto<input type="file" accept="image/jpeg,image/png,image/webp,image/*" data-fotos="' + esc(key) + '"' + (max - sel.length > 1 ? ' multiple' : '') + '></label>' : '');
  }
  function reducir(file, max, calidad) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var e = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * e); c.height = Math.round(img.naturalHeight * e);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : mal(new Error('foto')); }, 'image/jpeg', calidad);
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error('foto')); };
      img.src = url;
    });
  }

  function validar() {
    var errores = [];
    function marca(id, msg) {
      var c = document.querySelector('[data-campo="' + id + '"]');
      if (!c) return;
      c.classList.toggle('error', !!msg);
      var s = $('.err', c); s.hidden = !msg; s.textContent = msg || '';
      var ctl = document.getElementById(id); if (ctl) ctl.setAttribute('aria-invalid', String(!!msg));
      if (msg) errores.push(id);
    }
    var v = function (id) { var x = document.getElementById(id); return x ? x.value.trim() : ''; };
    marca('f-nombre', v('f-nombre').length < 2 ? 'Escribe tu nombre.' : '');
    marca('f-correo', /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,24}$/i.test(v('f-correo')) ? '' : 'Revisa tu correo: ahí te mandamos tu pedido y los datos para pagar.');
    var wa = v('f-wa').replace(/\D/g, ''); if (wa.length === 12 && wa.indexOf('52') === 0) wa = wa.slice(2); if (wa.length === 13 && wa.indexOf('521') === 0) wa = wa.slice(3);
    marca('f-wa', wa.length === 10 ? '' : 'Escribe los 10 dígitos de tu WhatsApp.');
    if (entregaElegida() === 'envio') {
      marca('f-calle', v('f-calle').length < 3 ? 'Escribe la calle y el número.' : '');
      marca('f-colonia', v('f-colonia') ? '' : 'Escribe la colonia.');
      marca('f-cp', /^\d{5}$/.test(v('f-cp')) ? '' : 'El código postal son 5 números.');
      marca('f-ciudad', v('f-ciudad') ? '' : 'Escribe la ciudad o municipio.');
      marca('f-estado', v('f-estado') ? '' : 'Elige tu estado.');
    }
    $$('[data-resp]').forEach(function (t) { marca(t.id, t.value.trim().length < 3 ? 'Cuéntanos un poco de tu cabello para formular tu shampoo.' : ''); });
    var priv = $('#f-priv').checked;
    $('#err-priv').hidden = priv;
    if (!priv) errores.push('f-priv');
    if (errores.length) { var p = document.getElementById(errores[0]); if (p) { p.focus(); p.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    return { ok: !errores.length, wa: wa };
  }

  function enviarPedido(e) {
    e.preventDefault();
    if (S.enviando) return;
    var val = validar();
    if (!val.ok) return;
    var v = function (id) { var x = document.getElementById(id); return x ? x.value.trim() : ''; };
    var ent = entregaElegida();
    var cuerpo = { cliente: { nombre: v('f-nombre'), correo: v('f-correo').toLowerCase(), whatsapp: val.wa }, entrega: ent, items: itemsApi(true), acepta_privacidad: true, acepta_promociones: $('#f-promo').checked };
    if (ent === 'envio') {
      cuerpo.direccion = { calle: v('f-calle'), colonia: v('f-colonia'), cp: v('f-cp'), ciudad: v('f-ciudad'), estado: v('f-estado') };
      if (v('f-ref')) cuerpo.direccion.referencias = v('f-ref');
    }
    if (v('f-nota')) cuerpo.nota = v('f-nota');
    if (S.codigo) cuerpo.codigo = S.codigo;
    var boton = $('#f-enviar'), err = $('#error-gral');
    S.enviando = true; boton.setAttribute('aria-busy', 'true'); boton.textContent = 'Apartando tus productos…'; err.hidden = true;
    api('/pedidos', { method: 'POST', json: cuerpo }, 20000).then(function (r) {
      if (!r.ok || !r.datos.pedido) {
        S.enviando = false; boton.removeAttribute('aria-busy'); boton.textContent = 'Hacer mi pedido';
        var msg = r.status === 0 ? 'No pudimos conectar con la tienda. Revisa tu conexión e intenta de nuevo.' : (r.datos.error || 'No pudimos crear tu pedido. Intenta de nuevo.');
        err.innerHTML = esc(msg) + ' <a class="enlace" href="' + esc(ligaWhatsapp()) + '" target="_blank" rel="noopener">También puedes pedir por WhatsApp</a>.';
        err.hidden = false;
        err.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (r.status === 409) cotizar(true);
        return;
      }
      var pedido = r.datos.pedido;
      guardar(K_PEDIDO, { numero: pedido.numero, token: pedido.token, t: Date.now() });
      boton.textContent = 'Enviando tus fotos…';
      return subirFotos(pedido).then(function (resFotos) {
        S.bolsa = []; guardarBolsa(); pintarBolsa();
        S.fotos = {}; S.enviando = false; S.codigo = null; S.cot = null;
        pintarConfirmacion(pedido, pedido.token, resFotos);
      });
    });
  }
  function subirFotos(pedido) {
    var tareas = [], usadas = {};
    lineas().forEach(function (l) {
      var sel = S.fotos[l.p.key] || [];
      if (!sel.length) return;
      var partida = null;
      (pedido.items || []).forEach(function (it) { if (partida === null && it.producto_id === l.p.id && it.fotos_pedidas && !usadas[it.partida]) partida = it.partida; });
      if (partida === null) return;
      usadas[partida] = true;
      sel.forEach(function (f) { tareas.push({ partida: partida, blob: f.blob }); });
    });
    var res = { enviadas: 0, fallidas: 0 };
    return tareas.reduce(function (cadena, t) {
      return cadena.then(function () {
        return api('/pedidos/' + encodeURIComponent(pedido.token) + '/fotos/' + t.partida, { method: 'POST', blob: t.blob, tipo: 'image/jpeg' }, 30000)
          .then(function (r) { if (r.ok) res.enviadas++; else res.fallidas++; });
      });
    }, Promise.resolve()).then(function () { return res; });
  }

  // ---------------- Confirmación ----------------
  function pintarConfirmacion(p, token, fotos) {
    var esperando = p.estado === 'esperando_pago' && p.transferencia;
    var url = p.url || (token ? PEDIDO_URL + token : null);
    var tr = p.transferencia || {};
    var clabe = String(tr.clabe || '').replace(/(\d{3})(\d{3})(\d{11})(\d)/, '$1 $2 $3 $4');
    var h = '<div class="confirma">' +
      '<div class="confirma-enc"><span class="sello-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
      '<p class="num-pedido">Pedido<b>' + esc(p.numero) + '</b></p>' +
      '<h2 class="display" id="conf-titulo">' + (esperando ? 'Tus productos están apartados' : esc(p.estado_texto || 'Tu pedido')) + '</h2>' +
      '<p>' + (esperando ? 'Te enviamos este resumen y los datos para pagar a tu correo. Para confirmar tu pedido, transfiere el total y sube tu comprobante.' : 'Estado actual de tu pedido: ' + esc(p.estado_texto || '') + '.') + '</p></div>';
    if (esperando) {
      h += '<div class="limite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>Transfiere antes del <b>' + esc(p.limite_texto || '') + '</b>. Si no registramos tu pago a tiempo, el pedido se cancela y las piezas vuelven a la tienda.</span></div>' +
        '<section class="transferencia" aria-labelledby="t-tit"><div class="cab"><h3 id="t-tit">Datos para transferir</h3><p>Monto exacto: ' + pesos(tr.monto_c) + ' MXN</p></div><dl class="datos-t">' +
        filaDato('Banco', esc(tr.banco || '')) +
        filaDato('CLABE', esc(clabe), tr.clabe, true) +
        filaDato('Titular', esc(tr.titular || '')) +
        filaDato('Concepto', esc(tr.concepto || p.numero), tr.concepto || p.numero) +
        filaDato('Monto', pesos(tr.monto_c), String((tr.monto_c || 0) / 100)) +
        '</dl></section>' +
        '<section class="comprobante" aria-labelledby="c-tit"><h3 id="c-tit">¿Ya transferiste?</h3><p>Sube la captura o el PDF de tu comprobante. Lo revisamos y te avisamos por correo cuando confirmemos tu pago.</p>' +
        (p.comprobante_recibido ? '<p class="msg ok">Ya recibimos tu comprobante. Si necesitas cambiarlo, súbelo de nuevo.</p>' : '') +
        '<div class="fila"><label class="archivo">Subir comprobante<input type="file" id="f-comprobante" accept="image/jpeg,image/png,image/webp,application/pdf"></label>' +
        (url ? '<a class="enlace" href="' + esc(url) + '" target="_blank" rel="noopener">Ver mi pedido en línea</a>' : '') + '</div><p class="msg" id="msg-comprobante" aria-live="polite"></p></section>';
    } else if (url) {
      h += '<p style="text-align:center"><a class="enlace" href="' + esc(url) + '" target="_blank" rel="noopener">Ver el detalle de mi pedido</a></p>';
    }
    if (fotos && (fotos.enviadas || fotos.fallidas)) {
      h += '<p class="msg ' + (fotos.fallidas ? 'mal' : 'ok') + '" style="text-align:center">' + (fotos.fallidas
        ? 'Recibimos ' + fotos.enviadas + ' de ' + (fotos.enviadas + fotos.fallidas) + ' fotos de tu cabello. Mándanos las demás por WhatsApp con tu número de pedido.'
        : 'Recibimos ' + (fotos.enviadas === 1 ? 'tu foto' : 'tus ' + fotos.enviadas + ' fotos') + ' para formular tu shampoo.') + '</p>';
    }
    h += '<div class="resumen-c"><h3>Resumen</h3><ul class="res-items">' + (p.items || []).map(function (i) {
      return '<li><span class="mini-foto">' + imgHTML((producto(keyDeId(i.producto_id)) || { fotos: [] }).fotos[0]).replace(/ alt="[^"]*"/, ' alt=""') + '<b>' + i.cantidad + '</b></span><span>' + esc(i.nombre) +
        (i.preparacion ? '<br><small>Preparación: ' + esc(i.preparacion.toLowerCase()) + '</small>' : '') + '</span><span class="precio">' + pesos(i.importe_c) + '</span></li>';
    }).join('') + '</ul><div class="totales"><div><span>Subtotal</span><span>' + pesos(p.subtotal_c) + '</span></div>' +
      (p.descuento_c ? '<div class="desc"><span>Descuento' + (p.codigo ? ' (' + esc(p.codigo) + ')' : '') + '</span><span>−' + pesos(p.descuento_c) + '</span></div>' : '') +
      '<div><span>' + (p.entrega === 'recoger' ? 'Entrega' : 'Envío') + '</span><span>' + (p.envio_c ? pesos(p.envio_c) : (p.entrega === 'recoger' ? 'Sin costo' : 'Gratis')) + '</span></div>' +
      '<div class="total"><span>Total</span><span class="precio">' + pesos(p.total_c) + '<small>MXN</small></span></div></div></div>' +
      '<p style="text-align:center;display:flex;flex-wrap:wrap;gap:12px;justify-content:center"><button class="boton claro" type="button" data-cerrar>Seguir viendo la colección</button>' +
      '<a class="boton claro" href="' + esc(ligaWhatsapp('Hola, hice el pedido ' + p.numero + ' en la tienda de Ana Laura Makeup.')) + '" target="_blank" rel="noopener">' + ICONO_WA + ' Escribirnos</a></p>' +
      (p.politicas_url ? '<p style="text-align:center;font-size:13.5px;color:var(--suave)">Consulta las <a href="' + esc(p.politicas_url) + '" target="_blank" rel="noopener">políticas de envío, cambios y privacidad</a>.</p>' : '') + '</div>';
    $('#pg-titulo').textContent = 'Pedido ' + p.numero;
    $('#pago-cuerpo').innerHTML = h;
    var d = $('#dlg-pago');
    abrirHoja(d);
    d.scrollTop = 0;
    var comp = $('#f-comprobante');
    if (comp) comp.addEventListener('change', function () { subirComprobante(comp, token); });
  }
  function filaDato(nombre, valorHTML, copiar, grande) {
    return '<div><dt>' + nombre + '</dt><dd' + (grande ? ' class="grande"' : '') + '>' + valorHTML + '</dd>' +
      (copiar != null ? '<button class="copiar" type="button" data-copiar="' + esc(copiar) + '" aria-label="Copiar ' + nombre.toLowerCase() + '">Copiar</button>' : '<span></span>') + '</div>';
  }
  function keyDeId(id) { for (var i = 0; i < S.productos.length; i++) if (S.productos[i].id === id) return S.productos[i].key; return null; }
  function subirComprobante(input, token) {
    var f = input.files && input.files[0], msg = $('#msg-comprobante');
    if (!f || !token) return;
    var tipos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    msg.className = 'msg'; msg.textContent = 'Subiendo tu comprobante…';
    var listoArchivo;
    if (f.type === 'application/pdf') {
      if (f.size > 5 * 1024 * 1024) { msg.className = 'msg mal'; msg.textContent = 'El PDF pesa más de 5 MB. Sube una captura de pantalla del comprobante.'; return; }
      listoArchivo = Promise.resolve({ blob: f, tipo: f.type });
    } else if (tipos.indexOf(f.type) >= 0 && f.size <= 4.5 * 1024 * 1024) listoArchivo = Promise.resolve({ blob: f, tipo: f.type });
    else listoArchivo = reducir(f, 2000, 0.88).then(function (b) { return { blob: b, tipo: 'image/jpeg' }; });
    listoArchivo.then(function (a) {
      return api('/pedidos/' + encodeURIComponent(token) + '/comprobante', { method: 'POST', blob: a.blob, tipo: a.tipo }, 30000);
    }).then(function (r) {
      msg.className = 'msg ' + (r.ok ? 'ok' : 'mal');
      msg.textContent = r.ok ? 'Recibimos tu comprobante. Lo revisamos y te avisamos por correo cuando confirmemos tu pago.' : (r.datos.error || 'No pudimos subir tu comprobante. Intenta de nuevo.');
    }, function () { msg.className = 'msg mal'; msg.textContent = 'No pudimos leer ese archivo. Sube una foto (JPG o PNG) o un PDF.'; });
    input.value = '';
  }
  function verUltimo() {
    var u = leer(K_PEDIDO);
    if (!u || !u.token) return;
    $('#pg-titulo').textContent = 'Tu pedido';
    $('#pago-cuerpo').innerHTML = '<div class="confirma"><p class="estado-cot" style="text-align:center">Buscando tu pedido…</p></div>';
    abrirHoja($('#dlg-pago'));
    api('/pedidos/' + encodeURIComponent(u.token)).then(function (r) {
      if (r.ok && r.datos.pedido) pintarConfirmacion(r.datos.pedido, u.token);
      else {
        if (r.status === 404) guardar(K_PEDIDO, null);
        $('#pago-cuerpo').innerHTML = '<div class="confirma"><p class="estado-cot" style="text-align:center">' + esc(r.datos.error || 'No pudimos abrir tu pedido. Revisa el correo de confirmación.') + '</p></div>';
      }
    });
  }

  // ---------------- Eventos generales ----------------
  document.addEventListener('click', function (e) {
    var ver = e.target.closest('[data-ver]');
    if (ver) { e.preventDefault(); abrirProducto(ver.dataset.ver); return; }
    var ag = e.target.closest('[data-agregar]');
    if (ag) { agregar(ag.dataset.agregar, 1, null); return; }
    var fi = e.target.closest('[data-filtro]');
    if (fi) { S.filtro = fi.dataset.filtro; pintarColeccion(); return; }
    var cp = e.target.closest('[data-copiar]');
    if (cp) {
      var t = cp.dataset.copiar.replace(/\s/g, '');
      var hecho = function () { cp.textContent = 'Copiado'; setTimeout(function () { cp.textContent = 'Copiar'; }, 1800); };
      try { navigator.clipboard.writeText(t).then(hecho, function () { aviso(t, true); }); } catch (x) { aviso(t, true); }
      return;
    }
    var qf = e.target.closest('[data-quitar-foto]');
    if (qf) {
      var k = qf.dataset.quitarFoto, lista = S.fotos[k] || [], f = lista.splice(Number(qf.dataset.i), 1)[0];
      if (f) URL.revokeObjectURL(f.url);
      pintarFotos(k);
      return;
    }
    if (e.target.closest('[data-cerrar-pago]')) { cerrarHoja($('#dlg-pago')); }
  });
  document.addEventListener('submit', function (e) { if (e.target.id === 'f-pago') enviarPedido(e); });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'f-estado' || t.name === 'entrega') {
      if (t.name === 'entrega') { var g = $('#g-direccion'); if (g) g.hidden = t.value !== 'envio'; }
      cotizar();
    }
    if (t.dataset && t.dataset.fotos) {
      var k = t.dataset.fotos, p = producto(k), max = (p && p.personalizado && p.personalizado.fotos) || 0;
      S.fotos[k] = S.fotos[k] || [];
      var archivos = Array.prototype.slice.call(t.files || []).slice(0, Math.max(0, max - S.fotos[k].length));
      Promise.all(archivos.map(function (f) { return reducir(f, 1600, 0.85).catch(function () { return null; }); })).then(function (blobs) {
        blobs.forEach(function (b) { if (b && b.size <= 3 * 1024 * 1024) S.fotos[k].push({ blob: b, url: URL.createObjectURL(b) }); });
        if (blobs.some(function (b) { return !b; })) aviso('Una de las fotos no se pudo leer. Usa JPG o PNG.', true);
        pintarFotos(k);
      });
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'f-codigo') { if (!e.target.value.trim() && S.codigo) { S.codigo = null; mensajeCodigo('', true); cotizar(); } }
    var c = e.target.closest && e.target.closest('.campo.error');
    if (c) { c.classList.remove('error'); var s = $('.err', c); if (s) s.hidden = true; }
    if (e.target.id === 'f-priv') $('#err-priv').hidden = true;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'f-codigo') { e.preventDefault(); aplicarCodigo(); }
  });
  document.addEventListener('click', function (e) { if (e.target.closest('#f-aplicar')) aplicarCodigo(); });
  window.addEventListener('hashchange', function () { if (/^#p\//.test(location.hash)) abrirProducto(decodeURIComponent(location.hash.slice(3))); });

  // ---------------- Inicio ----------------
  pintarColeccion();
  pintarBolsa();
  $('#aviso-wa').href = ligaWhatsapp();
  listo = cargar().catch(function () { ponerModo('whatsapp'); });
  if (/^#p\//.test(location.hash)) { var inicial = decodeURIComponent(location.hash.slice(3)); listo.then(function () { abrirProducto(inicial); }); }
})();
