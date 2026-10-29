-- Borrado de los datos de quien recibe un cupón de regalo (aviso de privacidad, vorka.mx/privacidad/#conservamos y #arco).
-- Ver src/cupones-regalo.js (anonimizarCuponesViejos, borrarDatosCupon, borrarDatosCuponCorreo).
--
-- «Borrar» = anonimizar el cupón: envio_nombre, envio_email, envio_error, para y nota quedan en NULL. Se conserva lo de
-- contabilidad y reportes: código, tanda, montos, alcance, usos, vigencia, revocación, cuándo se mandó, si salió y cuántos
-- envíos lleva, y las órdenes (orders no se toca: su correo es de quien compra y tiene su propia regla).
--
-- Bitácora mínima: un renglón por cupón anonimizado. NUNCA guarda el dato borrado (ni el nombre ni el correo).
-- por      correo de quien del equipo lo borró (desde Vorka OS) o 'automatico' (el cron, a los 12 meses)
-- motivo   'panel' (botón «Borrar datos de quien lo recibe») · 'arco' (búsqueda por correo para una solicitud ARCO)
--          · 'plazo' (12 meses después de que el cupón venció, se terminó de usar o se revocó)
CREATE TABLE cupones_regalo_borrados (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo      TEXT NOT NULL,
  borrado_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  por         TEXT NOT NULL,
  motivo      TEXT NOT NULL CHECK (motivo IN ('panel', 'arco', 'plazo'))
);
CREATE INDEX idx_cupones_regalo_borrados_codigo ON cupones_regalo_borrados (codigo, borrado_at);
