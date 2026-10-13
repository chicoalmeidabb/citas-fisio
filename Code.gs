/**
 * Centro de Fisioterapia · Carlos Ortiz
 * Backend de la aplicación de citas (Google Apps Script)
 *
 * Usa la hoja de cálculo como base de datos con tres pestañas:
 *   Pacientes · Tratamientos · Citas
 *
 * INSTALACIÓN (resumen; el detalle está en LEEME.md):
 *  1. Abre la hoja de cálculo → Extensiones → Apps Script.
 *  2. Pega este archivo entero en Code.gs y guarda.
 *  3. Cambia CLAVE_DE_ACCESO por una clave tuya.
 *  4. Ejecuta la función "preparar" una vez (te pedirá permisos).
 *  5. Implementar → Nueva implementación → Aplicación web
 *       Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 *  6. Copia la URL que termina en /exec y pégala en la app (pantalla de acceso).
 */

// ⚠️ Cambia esta clave. La app la pedirá al entrar.
var CLAVE_DE_ACCESO = 'cambia-esta-clave';

// ID de la hoja (por si el script no está vinculado a ella).
var SPREADSHEET_ID = '1aZn5PFuFh_rHcmFp17T3gZ3nRbIKlpbfeYxm6KlHVJ0';

var TABLAS = {
  Pacientes: ['id', 'nombre', 'telefono', 'email', 'dolencia', 'tratamiento', 'observaciones', 'creado'],
  Tratamientos: ['id', 'nombre', 'duracion', 'observaciones', 'creado'],
  Citas: ['id', 'pacienteId', 'tratamientoId', 'fecha', 'hora', 'duracion', 'cabina', 'estado', 'observaciones', 'creado']
};

// Columnas que deben guardarse como texto (evita que Sheets convierta fechas/horas/teléfonos).
var COLUMNAS_TEXTO = ['id', 'pacienteId', 'tratamientoId', 'telefono', 'fecha', 'hora', 'creado'];

function libro_() {
  try {
    var activo = SpreadsheetApp.getActiveSpreadsheet();
    if (activo) return activo;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/** Crea las pestañas y cabeceras si no existen. Ejecutar una vez. */
function preparar() {
  var ss = libro_();
  Object.keys(TABLAS).forEach(function (nombre) {
    var cols = TABLAS[nombre];
    var hoja = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
    hoja.getRange(1, 1, 1, cols.length).setValues([cols])
      .setFontWeight('bold').setBackground('#297ade').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    cols.forEach(function (c, i) {
      if (COLUMNAS_TEXTO.indexOf(c) >= 0) {
        hoja.getRange(2, i + 1, Math.max(hoja.getMaxRows() - 1, 1), 1).setNumberFormat('@');
      }
    });
    hoja.autoResizeColumns(1, cols.length);
  });
  // Quita la hoja vacía por defecto si sobra
  var por_defecto = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (por_defecto && ss.getSheets().length > 1 && por_defecto.getLastRow() === 0) ss.deleteSheet(por_defecto);
  return 'Listo: pestañas Pacientes, Tratamientos y Citas preparadas.';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function leer_(nombre) {
  var hoja = libro_().getSheetByName(nombre);
  if (!hoja) throw new Error('Falta la pestaña "' + nombre + '". Ejecuta la función preparar().');
  var cols = TABLAS[nombre];
  var n = hoja.getLastRow() - 1;
  if (n < 1) return [];
  var filas = hoja.getRange(2, 1, n, cols.length).getDisplayValues();
  return filas.filter(function (f) { return f[0] !== ''; }).map(function (f) {
    var o = {};
    cols.forEach(function (c, i) { o[c] = f[i]; });
    return o;
  });
}

function guardar_(nombre, registro) {
  var cols = TABLAS[nombre];
  var hoja = libro_().getSheetByName(nombre);
  if (!hoja) throw new Error('Falta la pestaña "' + nombre + '". Ejecuta la función preparar().');
  if (!registro.id) registro.id = Utilities.getUuid().slice(0, 8);
  if (!registro.creado) registro.creado = new Date().toISOString();
  var fila = cols.map(function (c) { return registro[c] === undefined || registro[c] === null ? '' : String(registro[c]); });

  var n = hoja.getLastRow() - 1;
  var destino = -1;
  if (n > 0) {
    var ids = hoja.getRange(2, 1, n, 1).getDisplayValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] === registro.id) { destino = i + 2; break; }
    }
  }
  if (destino < 0) destino = Math.max(hoja.getLastRow(), 1) + 1;
  var rango = hoja.getRange(destino, 1, 1, cols.length);
  rango.setNumberFormat('@');
  rango.setValues([fila]);
  return registro;
}

function borrar_(nombre, id) {
  var hoja = libro_().getSheetByName(nombre);
  var n = hoja.getLastRow() - 1;
  if (n < 1) return false;
  var ids = hoja.getRange(2, 1, n, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) { hoja.deleteRow(i + 2); return true; }
  }
  return false;
}

function hora_a_min_(h) {
  var p = String(h).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
}

/** Comprueba que la cita no se solape con otra en la misma cabina. */
function hayConflicto_(cita) {
  var ini = hora_a_min_(cita.hora);
  var fin = ini + parseInt(cita.duracion || 30, 10);
  return leer_('Citas').some(function (c) {
    if (c.id === cita.id) return false;
    if (c.estado === 'cancelada') return false;
    if (c.fecha !== cita.fecha || String(c.cabina) !== String(cita.cabina)) return false;
    var i2 = hora_a_min_(c.hora);
    var f2 = i2 + parseInt(c.duracion || 30, 10);
    return ini < f2 && i2 < fin;
  });
}

function autorizado_(clave) {
  return clave && clave === CLAVE_DE_ACCESO && CLAVE_DE_ACCESO !== 'cambia-esta-clave';
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!autorizado_(p.clave)) return json_({ ok: false, error: 'Clave incorrecta o sin configurar.' });
  try {
    return json_({
      ok: true,
      pacientes: leer_('Pacientes'),
      tratamientos: leer_('Tratamientos'),
      citas: leer_('Citas')
    });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var body = JSON.parse(e.postData.contents);
    if (!autorizado_(body.clave)) return json_({ ok: false, error: 'Clave incorrecta o sin configurar.' });
    var tabla = body.tabla;
    if (!TABLAS[tabla]) return json_({ ok: false, error: 'Tabla desconocida.' });

    if (body.accion === 'guardar') {
      if (tabla === 'Citas' && body.registro.estado !== 'cancelada' && hayConflicto_(body.registro)) {
        return json_({ ok: false, error: 'Esa cabina ya está ocupada en ese horario.' });
      }
      return json_({ ok: true, registro: guardar_(tabla, body.registro) });
    }
    if (body.accion === 'borrar') {
      return json_({ ok: true, borrado: borrar_(tabla, body.id) });
    }
    return json_({ ok: false, error: 'Acción desconocida.' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
