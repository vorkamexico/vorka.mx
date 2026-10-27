-- Códigos de descuento (FUNDADOR30 y los que vengan) y el 5 % por recomendación (ver src/descuentos.js).
-- El campo «código» del formulario de compra acepta los dos: si el código está en esta tabla es un descuento; si es de
-- una persona de referidos (affiliates) cuenta como recomendación y da 5 % a quien compra. No se acumulan: se aplica el
-- mayor; quien recomendó sigue ganando sus puntos sobre lo efectivamente cobrado.
--
-- codigo        MAYÚSCULAS, único
-- pct           % de descuento (0 < pct <= 100)
-- meses         en suscripciones: cuántas facturas lleva el descuento (cupón de Stripe 'repeating'); NULL = una sola vez
-- solo_mensual  1 = solo en suscripciones mensuales (en el anual un cupón por meses se aplicaría a todo el año)
-- desde, hasta  vigencia (AAAA-MM-DD = día completo en hora del centro de México, o ISO completo); NULL = sin límite
-- max_usos      tope total de compras pagadas con el código; NULL = sin tope
-- max_por_app   tope de compras pagadas por app (Vuelve, Agenda, Vende, Cuentas); NULL = sin tope
-- usos          compras pagadas con el código (sube al pagarse la orden, no al abrir el pago; no baja con reembolsos)
-- nombre        cómo se le dice en los mensajes («Los 10 lugares de fundador de Vuelve ya se ocuparon»)
CREATE TABLE codigos_descuento (
  codigo        TEXT PRIMARY KEY CHECK (codigo = UPPER(codigo) AND length(codigo) BETWEEN 1 AND 40),
  pct           REAL NOT NULL CHECK (pct > 0 AND pct <= 100),
  meses         INTEGER CHECK (meses IS NULL OR meses > 0),
  solo_mensual  INTEGER NOT NULL DEFAULT 0,
  activo        INTEGER NOT NULL DEFAULT 1,
  desde         TEXT,
  hasta         TEXT,
  max_usos      INTEGER CHECK (max_usos IS NULL OR max_usos >= 0),
  max_por_app   INTEGER CHECK (max_por_app IS NULL OR max_por_app >= 0),
  usos          INTEGER NOT NULL DEFAULT 0,
  nombre        TEXT,
  creado        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Usos pagados por código y app (para max_por_app). La app es la de la suscripción (contenido.acceso.app):
-- 'vuelve', 'agenda', 'vende', 'cuentas'. El paquete Agenda + Vuelve ('agenda-vuelve') cuenta dentro de 'agenda'
-- (decisión del dueño: no tiene lugares propios y no gasta uno de Vuelve). Ver appDelCupo en src/descuentos.js.
CREATE TABLE codigos_descuento_usos (
  codigo  TEXT NOT NULL REFERENCES codigos_descuento (codigo),
  app     TEXT NOT NULL,
  usos    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (codigo, app)
);

-- FUNDADOR30: 30 % los primeros 3 meses en planes mensuales; los primeros 10 negocios de cada app; sin fecha fin.
INSERT OR IGNORE INTO codigos_descuento (codigo, pct, meses, solo_mensual, activo, desde, hasta, max_usos, max_por_app, nombre)
  VALUES ('FUNDADOR30', 30, 3, 1, 1, NULL, NULL, NULL, 10, 'fundador');

-- En la orden: qué descuento se usó y cuánto (la parte de descuento_centavos que dio el código; el resto son puntos).
-- descuento_codigo: el de la tabla (FUNDADOR30) o 'REFERIDO' (5 % por recomendación; quién recomendó sigue en ref_code).
-- descuento_duracion: solo en suscripciones ('once' | 'repeating' | 'forever'); NULL en pagos únicos (cupón por monto).
-- descuento_app: la app donde cuenta el uso al pagarse (Agenda + Vuelve → 'agenda').
ALTER TABLE orders ADD COLUMN descuento_codigo TEXT;
ALTER TABLE orders ADD COLUMN descuento_pct REAL;
ALTER TABLE orders ADD COLUMN descuento_duracion TEXT;
ALTER TABLE orders ADD COLUMN descuento_meses INTEGER;
ALTER TABLE orders ADD COLUMN descuento_codigo_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN descuento_app TEXT;
CREATE INDEX idx_orders_descuento ON orders (descuento_codigo, paid_at) WHERE descuento_codigo IS NOT NULL;
