# Centro de Fisioterapia · Carlos Ortiz — Guía de la versión 2.0

## Qué hay de nuevo
- **La cita es la ficha del paciente.** Cada paciente guarda todo su historial: tratamientos (episodios) con sus sesiones, motivo, lesión, importes y cobros.
- **Flujo de cita:** paciente nuevo → se crea desde la propia cita ("＋ Nuevo"); paciente existente → se elige y se propone continuar su tratamiento en curso o empezar uno nuevo.
- **Orden de la cita:** Paciente → Motivo de la consulta → Lesión (lista desplegable, se gestiona en Tratamientos → Lesiones) → Tratamiento → fecha/hora/cabina → Estado.
- **Al marcar "Realizada":** importe de la sesión, ¿pagada?, ¿ha terminado el tratamiento?, con resumen (sesiones, total, cobrado).
  - Realizada y **continúa** → la app ofrece la siguiente cita copiando los datos de la anterior.
  - Realizada y **terminado** → la app ofrece **facturar** (factura numerada AAAA-NNNN, una por tratamiento).
- **Cuentas:** resumen de ingresos y gastos por periodo, Gastos (a mano o adjuntando PDF/foto/documento) y Facturas. CSV e impresión.
- **Informes:** citas por periodo e **Historial de paciente** completo (todos sus tratamientos y sesiones), en pantalla, CSV o PDF.

## Cómo actualizar (en este orden)
**1. Google Apps Script (primero)**
1. Abre el script (Extensiones → Apps Script de tu hoja).
2. Borra todo el contenido de `Code.gs` y pega el nuevo `Code.gs`.
3. En `CLAVE_DE_ACCESO` pon **tu misma clave** de siempre.
4. Ejecuta la función **preparar** (▶). Acepta el permiso nuevo de Drive. Crea las pestañas nuevas (Lesiones, Facturas, Gastos, Config) y las columnas nuevas.
5. Implementar → Administrar implementaciones → lápiz ✏ → Versión: **Nueva versión** → Implementar. La URL /exec no cambia.

**2. GitHub (después)**
Sube al repositorio `citas-fisio`, sustituyendo los existentes: **index.html** y **sw.js** (Add file → Upload files → Commit changes).
No subas `Code.gs` a GitHub (el repositorio es público y contiene tu clave).

**3. Comprobar**
Abre la app; en ⚙ Ajustes debe verse **Versión 2.0**. Si ves la anterior, cierra y vuelve a abrir la app (o recarga con Ctrl+F5).
Si aparece "El script de Google es de una versión antigua", falta el paso 1.

## Primeros ajustes
- ⚙ Ajustes → **Datos para las facturas** (nombre, NIF, dirección, nota legal). Confirma con tu gestor el texto sobre IVA (los servicios sanitarios suelen estar exentos).
- Pacientes → Editar → **DNI/NIF y dirección** (necesarios para facturar a su nombre).
- Tratamientos → Lesiones: revisa o amplía la lista; en Tratamientos puedes poner un **precio** por defecto.

## Notas
- Los adjuntos de gastos se guardan en tu Drive, carpeta *Gastos - Centro de Fisioterapia* (máx. 4 MB). Los enlaces solo los abre la cuenta propietaria.
- Los ingresos se cuentan por la fecha de la sesión realizada.
- Un tratamiento facturado queda bloqueado (no se cambian importes ni estados de sus sesiones).
- Cambio de cuenta de Drive: nueva hoja → pegar Code.gs → poner CLAVE y SPREADSHEET_ID → preparar → implementar → ⚙ Cambiar conexión.
