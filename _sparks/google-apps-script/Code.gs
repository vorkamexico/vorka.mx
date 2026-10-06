/**
 * SPARKS CELAYA — Puente entre Google Sheets y www.vorka.mx/sparks/celaya
 *
 * Qué hace:
 *  1. configurar()      → crea el Google Form ligado a esta hoja (una sola vez).
 *  2. doGet()           → entrega las noticias publicadas (JSON) y las fotos a GitHub,
 *                         protegido con un TOKEN. El Sheet y el Drive siguen privados.
 *  3. Menú "📰 Sparks"  → "Publicar ahora" para no esperar a la siguiente hora.
 *  4. alEnviarFormulario → publica en automático cada vez que llega una noticia nueva
 *                         (solo si configuraste GH_TOKEN y GH_REPO).
 *
 * Instrucciones completas: _sparks/GUIA-INSTALACION.md
 */

var NOMBRE_FORM = 'Sparks Celaya — Nueva noticia';
var CATEGORIAS = ['Logros', 'Eventos', 'Comunidad', 'Emprendimiento', 'Educación', 'Deportes', 'Cultura', 'Entrevistas'];

// Encabezados de la hoja → claves internas. Se buscan por "contiene", sin acentos ni mayúsculas.
var CAMPOS = [
  ['titulo',    ['titulo']],
  ['persona',   ['persona', 'protagonista']],
  ['categoria', ['categoria']],
  ['fecha',     ['fecha']],
  ['resumen',   ['resumen']],
  ['texto',     ['texto completo', 'texto', 'cuerpo']],
  ['fotos',     ['fotos', 'imagenes']],
  ['pie',       ['pie de foto', 'creditos']],
  ['video',     ['video']],
  ['autor',     ['autor', 'escribe']],
  ['etiquetas', ['etiquetas']],
  ['destacada', ['destacar', 'principal']],
  ['publicar',  ['publicar']],
  ['slug',      ['slug']],
  ['marca',     ['marca temporal', 'timestamp']]
];

/* ============================== CONFIGURACIÓN ============================== */

function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();

  if (!props.getProperty('TOKEN')) {
    props.setProperty('TOKEN', Utilities.getUuid().replace(/-/g, ''));
  }

  var formId = props.getProperty('FORM_ID');
  var form;
  if (formId) {
    form = FormApp.openById(formId);
  } else {
    form = FormApp.create(NOMBRE_FORM)
      .setDescription('Sube aquí cada noticia de Sparks Celaya. Se publica sola en www.vorka.mx/sparks/celaya en menos de una hora.')
      .setCollectEmail(false)
      .setAllowResponseEdits(true)
      .setConfirmationMessage('¡Listo! La noticia se publicará en www.vorka.mx/sparks/celaya en unos minutos.');

    form.addTextItem().setTitle('Título de la noticia').setHelpText('Corto y claro. Ej: "María López gana el Premio Estatal de Ciencia"').setRequired(true);
    form.addTextItem().setTitle('Persona o protagonista').setHelpText('Nombre de la persona, equipo u organización de la que trata la noticia (opcional).');
    form.addMultipleChoiceItem().setTitle('Categoría').setChoiceValues(CATEGORIAS).showOtherOption(true).setRequired(true);
    form.addDateItem().setTitle('Fecha de la noticia').setRequired(true);
    form.addParagraphTextItem().setTitle('Resumen').setHelpText('1 o 2 líneas. Es lo que se ve en la portada y al compartir en WhatsApp.').setRequired(true);
    form.addParagraphTextItem().setTitle('Texto completo').setHelpText('Cada renglón es un párrafo. Para un subtítulo empieza el renglón con ## . Para negritas usa **así**.').setRequired(true);
    form.addTextItem().setTitle('Pie de foto o créditos').setHelpText('Opcional. Ej: "Foto: Juan Pérez"');
    form.addTextItem().setTitle('Video (link de YouTube)').setHelpText('Opcional.');
    form.addTextItem().setTitle('Autor de la nota').setHelpText('Quién escribe la nota (opcional).');
    form.addTextItem().setTitle('Etiquetas').setHelpText('Opcional, separadas por comas. Ej: ciencia, jóvenes, premio');
    form.addMultipleChoiceItem().setTitle('¿Destacar como noticia principal?').setChoiceValues(['No', 'Sí']).setRequired(true);

    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    props.setProperty('FORM_ID', form.getId());
  }

  // Trigger: al recibir una respuesta se intenta publicar de inmediato.
  var yaExiste = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'alEnviarFormulario'; });
  if (!yaExiste) {
    ScriptApp.newTrigger('alEnviarFormulario').forSpreadsheet(ss).onFormSubmit().create();
  }

  Logger.log('✅ Form para tu equipo: ' + form.getPublishedUrl());
  Logger.log('✏️  Editar el Form (agrega aquí la pregunta "Fotos"): ' + form.getEditUrl());
  Logger.log('🔑 TOKEN (cópialo a GitHub como SPARKS_TOKEN): ' + props.getProperty('TOKEN'));
}

function verToken() {
  Logger.log(PropertiesService.getScriptProperties().getProperty('TOKEN'));
}

/* ============================== MENÚ ============================== */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📰 Sparks')
    .addItem('Publicar ahora', 'publicarAhoraMenu')
    .addToUi();
}

function publicarAhoraMenu() {
  var msg = publicarAhora_();
  SpreadsheetApp.getUi().alert(msg);
}

function alEnviarFormulario() {
  try { publicarAhora_(); } catch (err) { console.error(err); }
}

/** Le pide a GitHub que regenere el sitio ya. Requiere propiedades GH_TOKEN y GH_REPO (ej. "vorkamx/vorka-web"). */
function publicarAhora_() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GH_TOKEN');
  var repo = props.getProperty('GH_REPO');
  if (!token || !repo) {
    return 'No está configurada la publicación instantánea (GH_TOKEN / GH_REPO). Las noticias se publican solas cada hora.';
  }
  var res = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/dispatches', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
    payload: JSON.stringify({ event_type: 'sparks-publicar' }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() === 204) return '🚀 Publicando. En 2–3 minutos estará en www.vorka.mx/sparks/celaya';
  return 'GitHub respondió ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300);
}

/* ============================== API PARA GITHUB ============================== */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || p.token !== token) return json_({ error: 'no autorizado' });

  if (p.img) return json_(imagen_(p.img));
  return json_({ noticias: noticias_() });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function hojaRespuestas_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = ss.getSheets();
  for (var i = 0; i < hojas.length; i++) {
    if (hojas[i].getFormUrl()) return hojas[i];
  }
  return hojas[0];
}

function norm_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function mapearColumnas_(encabezados) {
  var mapa = {};
  CAMPOS.forEach(function (campo) {
    var clave = campo[0], buscar = campo[1];
    for (var b = 0; b < buscar.length && mapa[clave] === undefined; b++) {
      for (var c = 0; c < encabezados.length; c++) {
        var h = norm_(encabezados[c]);
        var usada = Object.keys(mapa).some(function (k) { return mapa[k] === c; });
        if (!usada && h.indexOf(buscar[b]) !== -1) { mapa[clave] = c; break; }
      }
    }
  });
  return mapa;
}

/** Asegura que existan las columnas "Publicar" y "Slug" (las agrega al final si faltan). */
function asegurarColumnas_(hoja) {
  var ultima = hoja.getLastColumn();
  var enc = hoja.getRange(1, 1, 1, ultima).getValues()[0];
  var normalizados = enc.map(norm_);
  if (normalizados.indexOf('publicar') === -1) {
    ultima++;
    hoja.getRange(1, ultima).setValue('Publicar').setNote('Escribe NO para ocultar la noticia de la web. Vacío o SÍ = publicada.');
  }
  if (normalizados.indexOf('slug') === -1) {
    ultima++;
    hoja.getRange(1, ultima).setValue('Slug').setNote('Dirección web de la noticia. Se llena sola; no la cambies después de publicar o el link compartido dejará de funcionar.');
  }
}

function slugify_(s) {
  return norm_(s).replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '') || 'noticia';
}

function fechaISO_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  return String(v || '');
}

function idsDrive_(celda) {
  var ids = [];
  String(celda || '').split(/[,\s]+/).forEach(function (u) {
    var m = u.match(/[?&]id=([\w-]{10,})/) || u.match(/\/d\/([\w-]{10,})/);
    if (m) ids.push(m[1]);
  });
  return ids;
}

function noticias_() {
  var hoja = hojaRespuestas_();
  asegurarColumnas_(hoja);
  var datos = hoja.getDataRange().getValues();
  var col = mapearColumnas_(datos[0]);
  var usados = {};
  var resultado = [];

  // Primero registra los slugs que ya existen para no repetirlos.
  for (var r = 1; r < datos.length; r++) {
    var s = String(datos[r][col.slug] || '').trim();
    if (s) usados[s] = true;
  }

  for (var i = 1; i < datos.length; i++) {
    var fila = datos[i];
    var val = function (k) { return col[k] === undefined ? '' : fila[col[k]]; };
    var titulo = String(val('titulo')).trim();
    if (!titulo) continue;

    var slug = String(val('slug')).trim();
    if (!slug) {
      var base = slugify_(titulo), n = 2;
      slug = base;
      while (usados[slug]) slug = base + '-' + (n++);
      usados[slug] = true;
      hoja.getRange(i + 1, col.slug + 1).setValue(slug);
    }

    var publicar = norm_(val('publicar'));
    if (publicar === 'no' || publicar === 'n' || publicar === 'false' || publicar === 'oculta') continue;

    resultado.push({
      slug: slug,
      titulo: titulo,
      persona: String(val('persona')).trim(),
      categoria: String(val('categoria')).trim() || 'Noticias',
      fecha: fechaISO_(val('fecha') || val('marca')),
      creada: fechaISO_(val('marca')),
      resumen: String(val('resumen')).trim(),
      texto: String(val('texto')),
      fotos: idsDrive_(val('fotos')),
      pie: String(val('pie')).trim(),
      video: String(val('video')).trim(),
      autor: String(val('autor')).trim(),
      etiquetas: String(val('etiquetas')).split(',').map(function (t) { return t.trim(); }).filter(String),
      destacada: norm_(val('destacada')).indexOf('si') === 0
    });
  }
  return resultado;
}

/** Devuelve una foto de Drive ya reducida (máx. 1600 px) en base64, sin hacerla pública. */
function imagen_(id) {
  var oauth = ScriptApp.getOAuthToken();
  try {
    var meta = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '?fields=thumbnailLink,mimeType&supportsAllDrives=true', {
      headers: { Authorization: 'Bearer ' + oauth }, muteHttpExceptions: true
    });
    if (meta.getResponseCode() === 200) {
      var link = JSON.parse(meta.getContentText()).thumbnailLink;
      if (link) {
        var thumb = UrlFetchApp.fetch(link.replace(/=s\d+.*$/, '=s1600'), { headers: { Authorization: 'Bearer ' + oauth }, muteHttpExceptions: true });
        if (thumb.getResponseCode() === 200) {
          var b = thumb.getBlob();
          return { id: id, mime: b.getContentType(), data: Utilities.base64Encode(b.getBytes()) };
        }
      }
    }
  } catch (err) { console.warn(err); }

  // Plan B: el archivo original.
  var blob = DriveApp.getFileById(id).getBlob();
  return { id: id, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}
