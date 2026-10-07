/**
 * IMPACTO — Movimientos de la estructura (altas, bajas, cambios y correcciones)
 * ============================================================================
 *
 * Cómo funciona:
 *   1. Una presidencia estatal entra al panel con su correo (le llega un enlace
 *      personal, sin contraseña) y llena un formulario: Alta, Baja, Cambio de
 *      presidente o Corrección de datos. Solo puede mover gente de su estado.
 *   2. La solicitud queda en la hoja SOLICITUDES como "pendiente" y Dirección
 *      Nacional recibe un correo con los botones Aprobar / Rechazar.
 *   3. Al aprobar, el script actualiza LISTA COMPLETA (fuente única), guarda el
 *      historial, manda la bienvenida con nombramiento en PDF (altas y cambios),
 *      agradece a quien sale (cambios) y avisa a quien lo pidió.
 *   4. GitHub regenera www.vorka.mx/impacto/estructura con la lista nueva
 *      (al momento si configuraste GH_TOKEN; si no, cada 3 horas).
 *
 * Es un proyecto INDEPENDIENTE (script.google.com → Nuevo proyecto). No toca el
 * script que ya tenga el Sheet ni las hojas ASISTENCIA, INDUCCIONES o Sheet5.
 *
 * Instalación: _impacto/GUIA-INSTALACION.md
 */

/* ================================ CONFIGURACIÓN ================================ */

var SHEET_ID = '12SpSCs6qsS5ZuC5lJbKGmhZpkPms0Rsy87a5Q3ZwVCk'; // Representaciones de Impacto
var HOJA_LISTA = 'LISTA COMPLETA';
var HOJA_SOLICITUDES = 'SOLICITUDES';
var HOJA_HISTORICO = 'HISTORICO';
var HOJA_BITACORA = 'BITACORA';

var URL_BIENVENIDA = 'https://www.vorka.mx/impacto/bienvenida/';
var URL_MANUAL = 'https://www.vorka.mx/impacto/manual/admisiones/';
var URL_PRIVACIDAD = 'https://www.vorka.mx/impacto/privacidad/';
var URL_DIRECTORIO = 'https://www.vorka.mx/impacto/estructura/';

var DIAS_SESION = 30;           // vigencia del enlace de acceso
var DIAS_ENLACE_APROBACION = 30;

var CARGOS = ['presidente', 'vicepresidente', 'secretaría', 'director', 'consejero', 'representante'];
var ESTRUCTURAS = ['estatal', 'distrital', 'municipal'];
var ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];

/* Columnas de LISTA COMPLETA. Las primeras 9 ya existen; las demás las agrega configurar(). */
var COLUMNAS = [
  { k: 'cargo', titulo: 'Cargo' },
  { k: 'estructura', titulo: 'Estructura' },
  { k: 'resultado', titulo: 'RESULTADO' },
  { k: 'nombre', titulo: 'Nombre completo' },
  { k: 'estado', titulo: 'Estado' },
  { k: 'telefono', titulo: 'TELÉFONO' },
  { k: 'rrss', titulo: 'RRSS' },
  { k: 'correo', titulo: 'Correo' },
  { k: 'carta', titulo: 'Carta de Representante' },
  { k: 'id', titulo: 'ID' },
  { k: 'estatus', titulo: 'Estatus' },
  { k: 'foto', titulo: 'Foto' },
  { k: 'fechaAlta', titulo: 'Fecha de alta' },
  { k: 'actualizado', titulo: 'Última actualización' }
];

var ENC_SOLICITUDES = ['Folio', 'Fecha', 'Tipo', 'Estatus', 'Estado', 'Resumen', 'Solicitó (correo)', 'Solicitó (nombre)',
  'Datos', 'Resolvió', 'Fecha de resolución', 'Motivo de rechazo'];
var ENC_HISTORICO = ['Fecha de salida', 'Motivo', 'Folio', 'ID', 'Cargo', 'Estructura', 'RESULTADO', 'Nombre completo',
  'Estado', 'TELÉFONO', 'RRSS', 'Correo', 'Fecha de alta'];
var ENC_BITACORA = ['Fecha', 'Quién', 'Acción', 'Detalle'];

/* ================================ INSTALACIÓN ================================ */

/** Ejecútalo una vez desde el editor. Es seguro volver a correrlo. */
function configurar() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('TOKEN')) props.setProperty('TOKEN', Utilities.getUuid().replace(/-/g, ''));
  if (!props.getProperty('SECRET')) props.setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid());
  if (!props.getProperty('ADMINS')) props.setProperty('ADMINS', Session.getEffectiveUser().getEmail());
  if (!props.getProperty('GH_REPO')) props.setProperty('GH_REPO', 'vorkamexico/vorka.mx');

  var ss = ss_();
  hoja_(ss, HOJA_SOLICITUDES, ENC_SOLICITUDES);
  hoja_(ss, HOJA_HISTORICO, ENC_HISTORICO);
  hoja_(ss, HOJA_BITACORA, ENC_BITACORA);

  var lista = ss.getSheetByName(HOJA_LISTA);
  if (!lista) throw new Error('No encontré la hoja "' + HOJA_LISTA + '".');
  var col = columnas_(lista);

  // IDs para quien todavía no tiene.
  var n = lista.getLastRow() - 1;
  if (n > 0) {
    var nombres = lista.getRange(2, col.nombre + 1, n, 1).getValues();
    var ids = lista.getRange(2, col.id + 1, n, 1).getValues();
    var siguiente = siguienteId_(ids.map(function (r) { return r[0]; }));
    var cambios = 0;
    for (var i = 0; i < n; i++) {
      if (String(nombres[i][0]).trim() && !String(ids[i][0]).trim()) { ids[i][0] = formatoId_(siguiente++); cambios++; }
    }
    lista.getRange(2, col.id + 1, n, 1).setValues(ids);
    Logger.log('IDs asignados: ' + cambios);
  }

  carpetaFotos_();
  Logger.log('✅ Listo.');
  Logger.log('🔑 TOKEN (cópialo a GitHub como IMPACTO_TOKEN): ' + props.getProperty('TOKEN'));
  Logger.log('👤 Aprueban (propiedad ADMINS): ' + props.getProperty('ADMINS'));
  Logger.log('Siguiente paso: Implementar → Nueva implementación → Aplicación web (ver GUIA-INSTALACION.md).');
}

function verToken() { Logger.log(PropertiesService.getScriptProperties().getProperty('TOKEN')); }

/** Pide a GitHub que actualice el directorio ya (requiere GH_TOKEN). */
function publicarDirectorioAhora() { Logger.log(publicarDirectorio_()); }

/**
 * Borra de LISTA COMPLETA las filas marcadas como "baja" (ya están copiadas en HISTORICO).
 * Úsalo solo si ninguna otra hoja depende de la posición de las filas.
 */
function limpiarBajas() {
  var lista = ss_().getSheetByName(HOJA_LISTA);
  var col = columnas_(lista);
  var n = lista.getLastRow() - 1;
  if (n < 1) return;
  var est = lista.getRange(2, col.estatus + 1, n, 1).getValues();
  var borradas = 0;
  for (var i = n - 1; i >= 0; i--) {
    if (norm_(est[i][0]) === 'baja') { lista.deleteRow(i + 2); borradas++; }
  }
  Logger.log('Filas de baja eliminadas: ' + borradas);
}

/* ================================ WEB ================================ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var props = PropertiesService.getScriptProperties();

  // API para GitHub (protegida con TOKEN).
  if (p.api || p.img) {
    if (!props.getProperty('TOKEN') || p.token !== props.getProperty('TOKEN')) return json_({ error: 'no autorizado' });
    if (p.api === 'directorio') return json_({ lideres: directorioPublico_() });
    if (p.img) return json_(imagen_(p.img));
    return json_({ error: 'api desconocida' });
  }

  // Enlace de Aprobar / Rechazar que recibe Dirección Nacional.
  if (p.folio) {
    var t = HtmlService.createTemplateFromFile('Resolver');
    t.folio = p.folio; t.firma = p.f || ''; t.para = p.a || ''; t.decision = p.d || '';
    var sol = null, error = '';
    try {
      verificarFirmaAprobacion_(p.folio, p.a, p.f);
      sol = solicitud_(p.folio);
      if (!sol) error = 'No encontré esa solicitud.';
    } catch (err) { error = err.message; }
    t.datos = JSON.stringify({ solicitud: sol ? publicaSolicitud_(sol) : null, error: error });
    return pagina_(t.evaluate(), 'IMPACTO · Aprobar movimiento');
  }

  // Panel (con o sin sesión).
  var tp = HtmlService.createTemplateFromFile('Panel');
  tp.sesion = p.t || '';
  tp.catalogos = JSON.stringify({ cargos: CARGOS, estructuras: ESTRUCTURAS, estados: ESTADOS, privacidad: URL_PRIVACIDAD });
  return pagina_(tp.evaluate(), 'IMPACTO · Movimientos de la estructura');
}

function pagina_(out, titulo) {
  return out.setTitle(titulo)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ================================ ACCESO ================================ */

/** Paso 1 del acceso: si el correo tiene permiso, le manda su enlace personal. */
function pedirAcceso(correo) {
  correo = String(correo || '').trim().toLowerCase();
  var generico = 'Si tu correo está registrado como presidencia estatal, en unos minutos te llega un enlace para entrar. Revisa también spam.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return { ok: false, mensaje: 'Escribe un correo válido.' };
  var u = usuario_(correo);
  if (!u) { bitacora_(correo, 'acceso negado', 'correo sin permiso'); return { ok: true, mensaje: generico }; }

  var exp = Date.now() + DIAS_SESION * 864e5;
  var token = b64_(correo) + '.' + exp + '.' + firmar_('sesion|' + correo + '|' + exp);
  var url = urlPanel_() + '?t=' + encodeURIComponent(token);
  MailApp.sendEmail({
    to: correo,
    subject: 'Tu acceso al panel de movimientos de IMPACTO',
    htmlBody: correoHtml_('Hola, ' + esc_(primerNombre_(u.nombre)),
      '<p>Este es tu enlace personal para registrar altas, bajas, cambios y correcciones de tu estado.</p>' +
      boton_(url, 'Entrar al panel') +
      '<p style="color:#666;font-size:13px">Funciona ' + DIAS_SESION + ' días. No lo compartas: quien lo tenga puede hacer solicitudes a tu nombre.</p>'),
    name: 'IMPACTO'
  });
  bitacora_(correo, 'acceso enviado', '');
  return { ok: true, mensaje: generico };
}

/** Valida el enlace de sesión y devuelve al usuario, o lanza error. */
function sesion_(token) {
  var partes = String(token || '').split('.');
  if (partes.length !== 3) throw new Error('Tu enlace no es válido. Pide uno nuevo.');
  var correo = deb64_(partes[0]), exp = Number(partes[1]);
  if (!correo || !exp || firmar_('sesion|' + correo + '|' + exp) !== partes[2]) throw new Error('Tu enlace no es válido. Pide uno nuevo.');
  if (Date.now() > exp) throw new Error('Tu enlace venció. Pide uno nuevo.');
  var u = usuario_(correo);
  if (!u) throw new Error('Tu correo ya no tiene acceso. Si es un error, avisa a Dirección Nacional.');
  return u;
}

/**
 * Quién puede entrar: Dirección Nacional (ADMINS) y quien aparezca en LISTA COMPLETA, activo,
 * con un cargo de ROLES_ACCESO (por defecto solo "presidente estatal").
 */
function usuario_(correo) {
  correo = String(correo || '').trim().toLowerCase();
  if (!correo) return null;
  if (admins_().indexOf(correo) !== -1) {
    var fila = filas_().filter(function (f) { return norm_(f.correo) === correo && f.activo; })[0];
    return { correo: correo, nombre: fila ? fila.nombre : 'Dirección Nacional', estado: '', cargo: 'Dirección Nacional', esAdmin: true };
  }
  var roles = (PropertiesService.getScriptProperties().getProperty('ROLES_ACCESO') || 'presidente estatal')
    .split(',').map(norm_);
  var mio = filas_().filter(function (f) {
    return f.activo && norm_(f.correo) === correo && roles.indexOf(norm_(f.cargo + ' ' + f.estructura)) !== -1;
  })[0];
  if (!mio) return null;
  return { correo: correo, nombre: mio.nombre, estado: mio.estado, cargo: mio.cargo + ' ' + mio.estructura, esAdmin: false };
}

function admins_() {
  return String(PropertiesService.getScriptProperties().getProperty('ADMINS') || '')
    .split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String);
}

/* ================================ PANEL ================================ */

function datosPanel(token) {
  var u = sesion_(token);
  var lideres = filas_().filter(function (f) { return f.activo && (u.esAdmin || f.estado === u.estado); })
    .map(function (f) {
      return { id: f.id, cargo: f.cargo, estructura: f.estructura, resultado: f.resultado, nombre: f.nombre,
        estado: f.estado, telefono: f.telefono, correo: f.correo, rrss: f.rrss };
    });
  var sol = solicitudes_().filter(function (s) { return u.esAdmin || s.solicitante === u.correo; })
    .slice(-50).reverse().map(publicaSolicitud_);
  return { usuario: u, lideres: lideres, solicitudes: sol };
}

/**
 * Crea una solicitud. tipo: alta | baja | cambio | correccion.
 * datos: campos del formulario. foto: {nombre, mime, base64} opcional.
 */
function enviarSolicitud(token, tipo, datos, foto) {
  var u = sesion_(token);
  datos = datos || {};
  if (['alta', 'baja', 'cambio', 'correccion'].indexOf(tipo) === -1) throw new Error('Tipo de movimiento desconocido.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var limpio = validar_(u, tipo, datos);
    if (foto && foto.base64) limpio.foto = guardarFoto_(foto, limpio.nombre || limpio.personaNombre);

    var folio = siguienteFolio_();
    var s = { folio: folio, fecha: new Date(), tipo: tipo, estatus: 'pendiente', estado: limpio.estado,
      resumen: resumen_(tipo, limpio), solicitante: u.correo, solicitanteNombre: u.nombre, datos: limpio };
    hojaSol_().appendRow([s.folio, s.fecha, s.tipo, s.estatus, s.estado, s.resumen, s.solicitante, s.solicitanteNombre,
      JSON.stringify(s.datos), '', '', '']);
    bitacora_(u.correo, 'solicitud ' + tipo, folio + ' · ' + s.resumen);
  } finally { lock.releaseLock(); }

  avisarAprobadores_(s);
  return { folio: folio, mensaje: 'Listo. Tu solicitud ' + folio + ' quedó pendiente de aprobación. Te avisaremos por correo.' };
}

/** Revisa permisos y datos. Devuelve los datos limpios que se guardan en la solicitud. */
function validar_(u, tipo, d) {
  var t = function (k) { return String(d[k] == null ? '' : d[k]).trim().replace(/\s+/g, ' '); };
  var filas = filas_().filter(function (f) { return f.activo; });
  var porId = function (id) {
    var f = filas.filter(function (x) { return x.id === id; })[0];
    if (!f) throw new Error('No encontré a esa persona en la lista (¿ya fue dada de baja?).');
    if (!u.esAdmin && f.estado !== u.estado) throw new Error('Solo puedes mover a personas de ' + u.estado + '.');
    if (!u.esAdmin && f.id && norm_(f.correo) === u.correo) throw new Error('No puedes solicitar movimientos sobre tu propio cargo. Pídelo a Dirección Nacional.');
    return f;
  };
  var persona = function () {
    var p = { nombre: t('nombre'), telefono: t('telefono'), correo: t('correo').toLowerCase(), rrss: t('rrss') };
    if (p.nombre.split(' ').length < 2) throw new Error('Escribe el nombre completo (nombre y apellidos).');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.correo)) throw new Error('Escribe un correo válido.');
    if (p.telefono.replace(/\D/g, '').length < 10) throw new Error('El teléfono debe tener 10 dígitos.');
    if (d.privacidad !== true) throw new Error('Falta confirmar que la persona aceptó el aviso de privacidad.');
    var dup = filas.filter(function (f) { return norm_(f.correo) === p.correo; })[0];
    if (dup) throw new Error('Ese correo ya está registrado con ' + dup.nombre + ' (' + dup.cargo + ' ' + dup.estructura + ', ' + dup.resultado + ').');
    return p;
  };
  var motivo = t('motivo');

  if (tipo === 'alta') {
    var p = persona();
    var cargo = norm_(t('cargo')), estructura = norm_(t('estructura'));
    cargo = CARGOS.filter(function (c) { return norm_(c) === cargo; })[0];
    if (!cargo) throw new Error('Elige un cargo.');
    if (ESTRUCTURAS.indexOf(estructura) === -1) throw new Error('Elige la estructura (estatal, distrital o municipal).');
    var estado = u.esAdmin ? t('estado') : u.estado;
    if (ESTADOS.indexOf(estado) === -1) throw new Error('Elige el estado.');
    var resultado = estructura === 'estatal' ? estado : t('resultado');
    if (!resultado) throw new Error('Escribe el municipio o distrito.');
    if (cargo === 'presidente') {
      var ocupado = filas.filter(function (f) {
        return norm_(f.cargo) === 'presidente' && norm_(f.estructura) === estructura && norm_(f.resultado) === norm_(resultado) && f.estado === estado;
      })[0];
      if (ocupado) throw new Error('Esa presidencia ya la tiene ' + ocupado.nombre + '. Usa "Cambio de presidente".');
    }
    return { cargo: cargo, estructura: estructura, resultado: resultado, estado: estado, nombre: p.nombre, telefono: p.telefono,
      correo: p.correo, rrss: p.rrss, propone: t('propone'), motivo: motivo };
  }

  if (tipo === 'baja') {
    var f = porId(t('id'));
    if (!motivo) throw new Error('Escribe el motivo de la baja.');
    return { id: f.id, personaNombre: f.nombre, cargo: f.cargo, estructura: f.estructura, resultado: f.resultado, estado: f.estado, motivo: motivo };
  }

  if (tipo === 'cambio') {
    var s = porId(t('id'));
    var n = persona();
    return { id: s.id, saliente: s.nombre, salienteCorreo: s.correo, cargo: s.cargo, estructura: s.estructura,
      resultado: s.resultado, estado: s.estado, nombre: n.nombre, telefono: n.telefono, correo: n.correo, rrss: n.rrss,
      agradecer: d.agradecer !== false, motivo: motivo };
  }

  // correccion
  var c = porId(t('id'));
  var cambios = {};
  ['nombre', 'telefono', 'correo', 'rrss', 'resultado'].forEach(function (k) {
    var v = t(k);
    if (k === 'correo') v = v.toLowerCase();
    if (v && v !== String(c[k] || '').trim()) cambios[k] = v;
  });
  var nuevoCargo = norm_(t('cargo'));
  nuevoCargo = CARGOS.filter(function (x) { return norm_(x) === nuevoCargo; })[0];
  if (nuevoCargo && nuevoCargo !== c.cargo) cambios.cargo = nuevoCargo;
  if (cambios.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cambios.correo)) throw new Error('El correo nuevo no es válido.');
  if (cambios.correo && filas.some(function (f) { return f.id !== c.id && norm_(f.correo) === cambios.correo; })) throw new Error('Ese correo ya lo usa otra persona.');
  if (!Object.keys(cambios).length && !d.conFoto) throw new Error('No cambiaste ningún dato.');
  return { id: c.id, personaNombre: c.nombre, estado: c.estado, cambios: cambios, motivo: motivo };
}

function resumen_(tipo, d) {
  var lugar = d.cargo + ' ' + d.estructura + ' · ' + d.resultado + (d.estructura === 'estatal' ? '' : ', ' + d.estado);
  if (tipo === 'alta') return 'Alta: ' + d.nombre + ' — ' + lugar;
  if (tipo === 'baja') return 'Baja: ' + d.personaNombre + ' — ' + lugar;
  if (tipo === 'cambio') return 'Cambio: ' + d.saliente + ' → ' + d.nombre + ' — ' + lugar;
  var campos = Object.keys(d.cambios).concat(d.foto ? ['foto'] : []);
  return 'Corrección: ' + d.personaNombre + ' (' + campos.join(', ') + ')';
}

/* ================================ APROBACIÓN ================================ */

function avisarAprobadores_(s) {
  admins_().forEach(function (correo) {
    var base = urlPanel_(true) + '?folio=' + encodeURIComponent(s.folio) + '&a=' + encodeURIComponent(correo) +
      '&f=' + firmar_('aprobar|' + s.folio + '|' + correo);
    MailApp.sendEmail({
      to: correo,
      subject: '[IMPACTO] ' + s.folio + ' · ' + s.resumen,
      htmlBody: correoHtml_('Movimiento por aprobar',
        '<p><b>' + esc_(s.resumen) + '</b></p>' + tablaDatos_(s.tipo, s.datos) +
        '<p style="color:#666;font-size:13px">Lo pidió ' + esc_(s.solicitanteNombre) + ' (' + esc_(s.solicitante) + ').</p>' +
        boton_(base + '&d=aprobar', 'Aprobar') + ' &nbsp; ' + boton_(base + '&d=rechazar', 'Rechazar', true)),
      name: 'IMPACTO'
    });
  });
}

function verificarFirmaAprobacion_(folio, correo, firma) {
  correo = String(correo || '').toLowerCase();
  if (!folio || !correo || firmar_('aprobar|' + folio + '|' + correo) !== firma) throw new Error('Este enlace no es válido.');
  if (admins_().indexOf(correo) === -1) throw new Error('Este correo ya no puede aprobar movimientos.');
}

/** Lo llama la página Resolver al dar clic en Aprobar o Rechazar. */
function resolver(folio, correo, firma, decision, motivo) {
  verificarFirmaAprobacion_(folio, correo, firma);
  if (['aprobar', 'rechazar'].indexOf(decision) === -1) throw new Error('Decisión inválida.');
  correo = correo.toLowerCase();

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var s;
  try {
    s = solicitud_(folio);
    if (!s) throw new Error('No encontré esa solicitud.');
    var limite = s.fecha.getTime() + DIAS_ENLACE_APROBACION * 864e5;
    if (s.estatus !== 'pendiente') return { ok: true, mensaje: 'Esta solicitud ya estaba ' + s.estatus + '.' };
    if (Date.now() > limite) throw new Error('El enlace venció. Pide que la vuelvan a enviar.');

    if (decision === 'rechazar') {
      if (!String(motivo || '').trim()) throw new Error('Escribe el motivo del rechazo.');
      marcarSolicitud_(s, 'rechazada', correo, motivo);
      bitacora_(correo, 'rechazó', folio);
    } else {
      aplicar_(s, correo);
      marcarSolicitud_(s, 'aprobada', correo, '');
      bitacora_(correo, 'aprobó', folio + ' · ' + s.resumen);
    }
  } finally { lock.releaseLock(); }

  // Correos y publicación fuera del candado.
  if (decision === 'rechazar') {
    avisarSolicitante_(s, 'rechazada', motivo);
    return { ok: true, mensaje: 'Rechazada. Avisamos a ' + s.solicitanteNombre + '.' };
  }
  try { correosPostAprobacion_(s); } catch (err) { console.error(err); bitacora_('sistema', 'error correo', folio + ' · ' + err.message); }
  avisarSolicitante_(s, 'aprobada', '');
  var pub = publicarDirectorio_();
  return { ok: true, mensaje: 'Aprobada y registrada. ' + pub };
}

/** Escribe el movimiento en LISTA COMPLETA / HISTORICO. */
function aplicar_(s, quien) {
  var d = s.datos, lista = ss_().getSheetByName(HOJA_LISTA), col = columnas_(lista), hoy = new Date();
  var ancho = lista.getLastColumn();

  if (s.tipo === 'alta') {
    var fila = new Array(ancho).fill('');
    var nuevoId = formatoId_(siguienteId_(lista.getRange(2, col.id + 1, Math.max(lista.getLastRow() - 1, 1), 1).getValues().map(function (r) { return r[0]; })));
    var v = { cargo: d.cargo, estructura: d.estructura, resultado: d.resultado, nombre: d.nombre, estado: d.estado,
      telefono: d.telefono, rrss: d.rrss, correo: d.correo, id: nuevoId, estatus: 'activo',
      foto: d.foto || '', fechaAlta: hoy, actualizado: hoy };
    Object.keys(v).forEach(function (k) { if (col[k] !== undefined) fila[col[k]] = v[k]; });
    lista.appendRow(fila);
    d.idAsignado = nuevoId;
    return;
  }

  var r = filaPorId_(lista, col, d.id);
  if (!r) throw new Error('La persona ' + d.id + ' ya no está en la lista. Revisa si alguien la movió antes.');
  var actual = lista.getRange(r, 1, 1, ancho).getValues()[0];
  var get = function (k) { return col[k] === undefined ? '' : actual[col[k]]; };
  var set = function (k, val) { if (col[k] !== undefined) lista.getRange(r, col[k] + 1).setValue(val); };
  var historico = function (motivo) {
    hojaHist_().appendRow([hoy, motivo, s.folio, get('id'), get('cargo'), get('estructura'), get('resultado'), get('nombre'),
      get('estado'), get('telefono'), get('rrss'), get('correo'), get('fechaAlta')]);
  };

  if (s.tipo === 'baja') {
    historico('Baja: ' + d.motivo);
    set('estatus', 'baja'); set('actualizado', hoy);
    lista.getRange(r, 1, 1, ancho).setFontColor('#999999');
    return;
  }

  if (s.tipo === 'cambio') {
    historico('Cambio de presidencia' + (d.motivo ? ': ' + d.motivo : ''));
    var ids = lista.getRange(2, col.id + 1, lista.getLastRow() - 1, 1).getValues().map(function (x) { return x[0]; });
    var nuevo = formatoId_(siguienteId_(ids));
    // La fila es el cargo: se queda en su lugar y cambia la persona.
    set('nombre', d.nombre); set('telefono', d.telefono); set('rrss', d.rrss); set('correo', d.correo);
    set('foto', d.foto || ''); set('carta', ''); set('id', nuevo);
    set('estatus', 'activo'); set('fechaAlta', hoy); set('actualizado', hoy);
    d.idAsignado = nuevo;
    return;
  }

  // correccion
  Object.keys(d.cambios).forEach(function (k) { set(k, d.cambios[k]); });
  if (d.foto) set('foto', d.foto);
  set('actualizado', hoy);
}

function correosPostAprobacion_(s) {
  var d = s.datos;
  if (s.tipo === 'alta' || s.tipo === 'cambio') {
    var pdf = nombramientoPdf_(d.nombre, d.cargo, d.estructura, d.resultado, d.estado, d.idAsignado, s.folio);
    MailApp.sendEmail({
      to: d.correo,
      subject: 'Bienvenida a IMPACTO — tu nombramiento',
      htmlBody: correoHtml_('Te damos la bienvenida, ' + esc_(primerNombre_(d.nombre)),
        '<p>Desde hoy formas parte de IMPACTO en la <b>' + esc_(cargoLargo_(d.cargo, d.estructura)) + '</b> de ' +
        esc_(lugar_(d)) + '. Te adjuntamos tu nombramiento.</p>' +
        '<p>Para arrancar:</p><ol><li>Lee la guía de bienvenida.</li><li>Revisa el manual de admisiones.</li>' +
        '<li>Tu presidencia estatal te agregará a los grupos de tu estado.</li></ol>' +
        boton_(URL_BIENVENIDA, 'Guía de bienvenida') + ' &nbsp; ' + boton_(URL_MANUAL, 'Manual de admisiones', true) +
        '<p style="color:#666;font-size:13px">Tu ID de IMPACTO es ' + esc_(d.idAsignado) + '. Aparecerás en el directorio nacional en unas horas: ' + URL_DIRECTORIO + '</p>'),
      attachments: [pdf],
      name: 'IMPACTO'
    });
  }
  if (s.tipo === 'cambio' && d.agradecer && d.salienteCorreo) {
    MailApp.sendEmail({
      to: d.salienteCorreo,
      subject: 'Gracias por tu liderazgo en IMPACTO',
      htmlBody: correoHtml_('Gracias, ' + esc_(primerNombre_(d.saliente)),
        '<p>Concluye tu etapa en la <b>' + esc_(cargoLargo_(d.cargo, d.estructura)) + '</b> de ' + esc_(lugar_(d)) +
        '. Gracias por el tiempo, la constancia y todo lo que construiste para tu comunidad.</p>' +
        '<p>Las puertas de IMPACTO siguen abiertas para ti.</p>'),
      name: 'IMPACTO'
    });
  }
}

function avisarSolicitante_(s, estatus, motivo) {
  var cuerpo = estatus === 'aprobada'
    ? '<p>Dirección Nacional aprobó tu solicitud <b>' + s.folio + '</b>:</p><p>' + esc_(s.resumen) + '</p>' +
      '<p>Ya quedó registrada. El directorio se actualiza en unas horas.</p>'
    : '<p>Tu solicitud <b>' + s.folio + '</b> no fue aprobada:</p><p>' + esc_(s.resumen) + '</p><p><b>Motivo:</b> ' + esc_(motivo) + '</p>';
  MailApp.sendEmail({ to: s.solicitante, subject: '[IMPACTO] ' + s.folio + ' ' + estatus, name: 'IMPACTO',
    htmlBody: correoHtml_('Solicitud ' + estatus, cuerpo) });
}

/** Pide a GitHub que regenere el directorio. Requiere propiedades GH_TOKEN y GH_REPO. */
function publicarDirectorio_() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GH_TOKEN'), repo = props.getProperty('GH_REPO');
  if (!token || !repo) return 'El directorio se actualiza solo en las próximas horas.';
  var res = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/dispatches', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
    payload: JSON.stringify({ event_type: 'impacto-directorio' })
  });
  if (res.getResponseCode() === 204) return 'El directorio se actualiza en 2–3 minutos.';
  bitacora_('sistema', 'error GitHub', res.getResponseCode() + ' ' + res.getContentText().slice(0, 200));
  return 'El directorio se actualiza solo en las próximas horas.';
}

/* ================================ DIRECTORIO (API) ================================ */

/** Solo datos públicos: nada de correos ni teléfonos. */
function directorioPublico_() {
  return filas_().filter(function (f) { return f.activo && f.nombre && f.cargo && f.estructura && f.estado; })
    .map(function (f) {
      return { id: f.id, cargo: norm_(f.cargo) === 'secretaria' ? 'secretaría' : String(f.cargo).trim().toLowerCase(),
        estructura: String(f.estructura).trim().toLowerCase(), resultado: f.resultado, nombre: f.nombre,
        estado: f.estado, foto: idDrive_(f.foto) };
    });
}

/** Devuelve una foto de Drive reducida (máx. 800 px) en base64, sin hacerla pública. Solo fotos del directorio. */
function imagen_(id) {
  var permitidas = filas_().map(function (f) { return idDrive_(f.foto); });
  if (permitidas.indexOf(id) === -1) return { error: 'foto desconocida' };
  var oauth = ScriptApp.getOAuthToken();
  try {
    var meta = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '?fields=thumbnailLink&supportsAllDrives=true',
      { headers: { Authorization: 'Bearer ' + oauth }, muteHttpExceptions: true });
    if (meta.getResponseCode() === 200) {
      var link = JSON.parse(meta.getContentText()).thumbnailLink;
      if (link) {
        var th = UrlFetchApp.fetch(link.replace(/=s\d+.*$/, '=s800'), { headers: { Authorization: 'Bearer ' + oauth }, muteHttpExceptions: true });
        if (th.getResponseCode() === 200) return { id: id, mime: th.getBlob().getContentType(), data: Utilities.base64Encode(th.getBlob().getBytes()) };
      }
    }
  } catch (err) { console.warn(err); }
  var blob = DriveApp.getFileById(id).getBlob();
  return { id: id, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/* ================================ DATOS ================================ */

function ss_() { return SpreadsheetApp.openById(SHEET_ID); }

function hoja_(ss, nombre, encabezados) {
  var h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}
function hojaSol_() { return hoja_(ss_(), HOJA_SOLICITUDES, ENC_SOLICITUDES); }
function hojaHist_() { return hoja_(ss_(), HOJA_HISTORICO, ENC_HISTORICO); }

/** Ubica cada columna por su encabezado; agrega al final las que falten. */
function columnas_(hoja) {
  var ancho = Math.max(hoja.getLastColumn(), 1);
  var enc = hoja.getRange(1, 1, 1, ancho).getValues()[0].map(norm_);
  var col = {};
  COLUMNAS.forEach(function (c) {
    var i = enc.indexOf(norm_(c.titulo));
    if (i === -1) {
      i = enc.length;
      hoja.getRange(1, i + 1).setValue(c.titulo).setFontWeight('bold');
      enc.push(norm_(c.titulo));
    }
    col[c.k] = i;
  });
  return col;
}

var cacheFilas_ = null;
function filas_() {
  if (cacheFilas_) return cacheFilas_;
  var lista = ss_().getSheetByName(HOJA_LISTA);
  var col = columnas_(lista);
  var n = lista.getLastRow() - 1;
  if (n < 1) return (cacheFilas_ = []);
  var valores = lista.getRange(2, 1, n, lista.getLastColumn()).getValues();
  cacheFilas_ = valores.map(function (v, i) {
    var f = { fila: i + 2 };
    COLUMNAS.forEach(function (c) {
      var x = v[col[c.k]];
      f[c.k] = x instanceof Date ? x : String(x == null ? '' : x).trim();
    });
    f.activo = !!f.nombre && norm_(f.estatus) !== 'baja';
    return f;
  });
  return cacheFilas_;
}

function filaPorId_(lista, col, id) {
  var n = lista.getLastRow() - 1;
  if (n < 1 || !id) return 0;
  var ids = lista.getRange(2, col.id + 1, n, 1).getValues();
  for (var i = 0; i < n; i++) if (String(ids[i][0]).trim() === id) return i + 2;
  return 0;
}

function solicitudes_() {
  var h = hojaSol_(), n = h.getLastRow() - 1;
  if (n < 1) return [];
  return h.getRange(2, 1, n, ENC_SOLICITUDES.length).getValues().map(function (r, i) {
    var datos = {};
    try { datos = JSON.parse(r[8] || '{}'); } catch (e) {}
    return { fila: i + 2, folio: String(r[0]), fecha: r[1] instanceof Date ? r[1] : new Date(r[1]), tipo: r[2],
      estatus: r[3], estado: r[4], resumen: r[5], solicitante: String(r[6]).toLowerCase(), solicitanteNombre: r[7],
      datos: datos, resolvio: r[9], fechaResolucion: r[10], motivoRechazo: r[11] };
  });
}
function solicitud_(folio) { return solicitudes_().filter(function (s) { return s.folio === folio; })[0] || null; }

function marcarSolicitud_(s, estatus, quien, motivo) {
  var h = hojaSol_();
  h.getRange(s.fila, 4).setValue(estatus);
  h.getRange(s.fila, 9).setValue(JSON.stringify(s.datos)); // guarda el ID asignado
  h.getRange(s.fila, 10, 1, 3).setValues([[quien, new Date(), motivo || '']]);
  s.estatus = estatus;
}

function publicaSolicitud_(s) {
  return { folio: s.folio, fecha: Utilities.formatDate(s.fecha, 'America/Mexico_City', 'dd/MM/yyyy HH:mm'), tipo: s.tipo,
    estatus: s.estatus, resumen: s.resumen, solicitante: s.solicitanteNombre, motivoRechazo: s.motivoRechazo || '',
    detalle: tablaDatos_(s.tipo, s.datos) };
}

function siguienteFolio_() {
  var año = new Date().getFullYear(), max = 0;
  solicitudes_().forEach(function (s) {
    var m = String(s.folio).match(/^MOV-(\d{4})-(\d+)$/);
    if (m && Number(m[1]) === año) max = Math.max(max, Number(m[2]));
  });
  return 'MOV-' + año + '-' + ('000' + (max + 1)).slice(-4);
}

function siguienteId_(ids) {
  var max = 0;
  ids.forEach(function (x) { var m = String(x).match(/^IMP-(\d+)$/); if (m) max = Math.max(max, Number(m[1])); });
  // También cuenta los del histórico para no reciclar IDs.
  var h = ss_().getSheetByName(HOJA_HISTORICO);
  if (h && h.getLastRow() > 1) h.getRange(2, 4, h.getLastRow() - 1, 1).getValues().forEach(function (r) {
    var m = String(r[0]).match(/^IMP-(\d+)$/); if (m) max = Math.max(max, Number(m[1]));
  });
  return max + 1;
}
function formatoId_(n) { return 'IMP-' + ('0000' + n).slice(-4); }

function bitacora_(quien, accion, detalle) {
  try { hoja_(ss_(), HOJA_BITACORA, ENC_BITACORA).appendRow([new Date(), quien, accion, detalle]); } catch (e) { console.warn(e); }
}

/* ================================ FOTOS Y PDF ================================ */

function carpetaFotos_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CARPETA_FOTOS');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var c = DriveApp.createFolder('IMPACTO — Fotos de la estructura');
  props.setProperty('CARPETA_FOTOS', c.getId());
  return c;
}

function guardarFoto_(foto, nombre) {
  if (!/^image\/(jpeg|png|webp)$/.test(foto.mime)) throw new Error('La foto debe ser JPG, PNG o WEBP.');
  var bytes = Utilities.base64Decode(foto.base64);
  if (bytes.length > 5 * 1024 * 1024) throw new Error('La foto pesa más de 5 MB.');
  var ext = foto.mime.split('/')[1].replace('jpeg', 'jpg');
  var blob = Utilities.newBlob(bytes, foto.mime, slug_(nombre || 'foto') + '-' + Date.now() + '.' + ext);
  return carpetaFotos_().createFile(blob).getId();
}

function nombramientoPdf_(nombre, cargo, estructura, resultado, estado, id, folio) {
  var fecha = Utilities.formatDate(new Date(), 'America/Mexico_City', "d 'de' MMMM 'de' yyyy");
  fecha = fecha.replace(/January|February|March|April|May|June|July|August|September|October|November|December/, function (m) {
    return { January: 'enero', February: 'febrero', March: 'marzo', April: 'abril', May: 'mayo', June: 'junio', July: 'julio',
      August: 'agosto', September: 'septiembre', October: 'octubre', November: 'noviembre', December: 'diciembre' }[m];
  });
  var html = '<html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;padding:48px 56px">' +
    '<div style="border:2px solid #111;padding:48px 40px;text-align:center">' +
    '<div style="font-size:13px;letter-spacing:4px">IMPACTO · JUVENTUDES IMPACTANDO MÉXICO A.C.</div>' +
    '<div style="font-size:34px;font-weight:bold;margin:36px 0 8px">NOMBRAMIENTO</div>' +
    '<div style="font-size:15px;margin-bottom:32px">IMPACTO otorga el presente nombramiento a</div>' +
    '<div style="font-size:28px;font-weight:bold;margin-bottom:24px">' + esc_(nombre) + '</div>' +
    '<div style="font-size:16px;line-height:1.6">para ejercer la <b>' + esc_(cargoLargo_(cargo, estructura)) + '</b><br>de ' +
    esc_(lugar_({ estructura: estructura, resultado: resultado, estado: estado })) + '.</div>' +
    '<div style="font-size:14px;margin-top:40px">Expedido el ' + fecha + '</div>' +
    '<div style="font-size:14px;margin-top:56px">Dirección Nacional de IMPACTO</div>' +
    '<div style="font-size:11px;color:#666;margin-top:40px">ID ' + esc_(id) + ' · Folio ' + esc_(folio) + '</div>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html).getBlob().getAs('application/pdf').setName('Nombramiento IMPACTO - ' + nombre + '.pdf');
}

/* ================================ UTILIDADES ================================ */

function firmar_(texto) {
  var secreto = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!secreto) throw new Error('Falta correr configurar().');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(texto, secreto)).replace(/=+$/, '');
}
function b64_(s) { return Utilities.base64EncodeWebSafe(s, Utilities.Charset.UTF_8).replace(/=+$/, ''); }
function deb64_(s) {
  try { while (s.length % 4) s += '='; return Utilities.newBlob(Utilities.base64DecodeWebSafe(s)).getDataAsString('UTF-8'); }
  catch (e) { return ''; }
}

/** URL del panel. PANEL_URL permite usar una página propia (p. ej. voluntariosimpacto.vorka.mx) que lo incrusta. */
function urlPanel_(directa) {
  var propia = PropertiesService.getScriptProperties().getProperty('PANEL_URL');
  return (!directa && propia) ? propia : ScriptApp.getService().getUrl();
}

function norm_(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}
function slug_(s) { return norm_(s).replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'); }
function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
function idDrive_(v) {
  var m = String(v || '').match(/[-\w]{25,}/);
  return m ? m[0] : '';
}
function primerNombre_(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }

function cargoLargo_(cargo, estructura) {
  var c = norm_(cargo);
  var base = { presidente: 'Presidencia', vicepresidente: 'Vicepresidencia', secretaria: 'Secretaría', director: 'Dirección',
    consejero: 'Consejería', representante: 'Representación' }[c] || cargo;
  var e = { estatal: 'Estatal', distrital: 'Distrital', municipal: 'Municipal', nacional: 'Nacional' }[norm_(estructura)] || '';
  return (base + ' ' + e).trim();
}
function lugar_(d) {
  return norm_(d.estructura) === 'estatal' ? d.estado : d.resultado + ', ' + d.estado;
}

function correoHtml_(titulo, cuerpo) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#111;line-height:1.5">' +
    '<div style="font-size:12px;letter-spacing:3px;color:#666;margin-bottom:12px">IMPACTO</div>' +
    '<h2 style="margin:0 0 16px">' + titulo + '</h2>' + cuerpo +
    '<p style="color:#999;font-size:12px;margin-top:32px">Juventudes Impactando México A.C.</p></div>';
}
function boton_(url, texto, secundario) {
  return '<a href="' + url + '" style="display:inline-block;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;' +
    (secundario ? 'border:1px solid #111;color:#111' : 'background:#111;color:#fff') + '">' + esc_(texto) + '</a>';
}

var ETIQUETAS_ = { nombre: 'Nombre', cargo: 'Cargo', estructura: 'Estructura', resultado: 'Municipio / distrito', estado: 'Estado',
  telefono: 'Teléfono', correo: 'Correo', rrss: 'Redes', propone: 'Propone', motivo: 'Motivo',
  personaNombre: 'Persona', saliente: 'Sale', id: 'ID', foto: 'Foto' };

function tablaDatos_(tipo, d) {
  var filas = [];
  var add = function (k, v) { if (v !== undefined && v !== null && String(v) !== '') filas.push([ETIQUETAS_[k] || k, v]); };
  if (tipo === 'correccion') {
    add('personaNombre', d.personaNombre); add('id', d.id);
    Object.keys(d.cambios || {}).forEach(function (k) { add(k, '→ ' + d.cambios[k]); });
    if (d.foto) add('foto', 'nueva foto');
    add('motivo', d.motivo);
  } else {
    ['saliente', 'personaNombre', 'nombre', 'cargo', 'estructura', 'resultado', 'estado', 'telefono', 'correo', 'rrss',
      'propone', 'motivo', 'id'].forEach(function (k) { add(k, d[k]); });
    if (d.foto) add('foto', 'adjunta');
  }
  return '<table style="border-collapse:collapse;font-size:14px;margin:8px 0 16px">' + filas.map(function (f) {
    return '<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">' + esc_(f[0]) + '</td><td style="padding:4px 0">' + esc_(f[1]) + '</td></tr>';
  }).join('') + '</table>';
}

function include(nombre) { return HtmlService.createHtmlOutputFromFile(nombre).getContent(); }
