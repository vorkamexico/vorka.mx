-- Toolkit Vorka: recarga mensual de saldo (decisión del dueño, 2026-11-02). Ver src/toolkit.js y README-TIENDA.md › Toolkit.
--   Toolkit:     $599 MXN al mes → $800 de saldo cada mes
--   Toolkit Pro: $1,199 MXN al mes → $1,800 de saldo cada mes
-- Se cobra por SUSCRIPCIÓN (Stripe Billing, precios en línea como Vuelve, Cuentas y Clara: no hay que crear nada en el Dashboard).
-- Cada factura pagada (invoice.paid) abona el bono del plan a un libro de saldo (toolkit_movimientos); el saldo se usa en la
-- tienda a precio de lista: comprar productos para sí, pagar meses de Clara, Cuentas, Vende, Agenda y Vuelve (como cortesía),
-- o sacar códigos de regalo de un solo uso. Decisión final del dueño: el saldo NUNCA vence (tampoco si cancela o deja de
-- pagar: solo deja de recibir abonos) y los códigos sacados con saldo tampoco vencen; un código sin usar se puede devolver al
-- saldo desde Mi Toolkit.
-- Entran INACTIVOS: se activan desde Vorka OS › Tienda › Productos cuando Vorka decida abrir la venta (falta la revisión
-- fiscal y legal del saldo prepagado). La ficha /tienda/toolkit/ se ve sin compra y con noindex mientras tanto.
-- El plan Pro va oculto en el catálogo: los dos se eligen en /tienda/toolkit/ (una sola tarjeta «Desde $599 al mes»).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_toolkit_mensual', 'toolkit-mensual', 'Toolkit Vorka · plan mensual', 'Pagas $599 al mes y recibes $800 de saldo para toda la tienda: simuladores, reportes, invitaciones, meses de apps y códigos de regalo. Tu saldo nunca vence.', 59900, 0, 'Toolkit', 95, '[]', '/assets/tienda/v3/toolkit-portada.webp',
  json('{"portada":"Toolkit","acceso":{"app":"toolkit","tipo":"suscripcion","ruta":"/tienda/toolkit/","boton":"Ver mi Toolkit","detalle":"Suscripción mensual · cancela cuando quieras"},"suscripcion":{"intervalo":"month"},"toolkit":{"plan":"toolkit","bono_centavos":80000}}'));
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_toolkit_pro_mensual', 'toolkit-pro-mensual', 'Toolkit Vorka Pro · plan mensual', 'Pagas $1,199 al mes y recibes $1,800 de saldo para toda la tienda. Para quien compra seguido o revende con códigos de regalo. Tu saldo nunca vence.', 119900, 0, 'Toolkit', 96, '[]', '/assets/tienda/v3/toolkit-pro-portada.webp',
  json('{"oculto":true,"portada":"Toolkit Pro","acceso":{"app":"toolkit","tipo":"suscripcion","ruta":"/tienda/toolkit/","boton":"Ver mi Toolkit","detalle":"Suscripción mensual · cancela cuando quieras"},"suscripcion":{"intervalo":"month"},"toolkit":{"plan":"toolkit-pro","bono_centavos":180000}}'));

-- Libro de saldo: movimientos inmutables en centavos (abono +, cargos −). Saldo = SUM(centavos) por correo.
-- clave: única por operación, para que un reintento (del webhook o del navegador) no duplique nada:
--   abono      'factura:<in_…>'            (una por factura pagada de Stripe)
--   compra     'orden:<order id>'          (producto para sí, pagado con saldo)
--   app        'orden:<order id>'          (meses de una app como cortesía)
--   codigos    'codigos:<uuid>'            (tanda de códigos de regalo)
--   devolucion 'devolucion:<código>'       (un código de regalo sin usar que su dueño regresa a su saldo: + su precio)
--   reembolso  'reembolso:<in_…>:<monto>'  (reembolso o contracargo del pago de una factura)
--   ajuste     a mano (corrección del equipo)
-- Los cargos se insertan con INSERT … SELECT … WHERE saldo >= monto dentro de un batch (D1 lo corre como una transacción),
-- así dos compras simultáneas no pueden dejar el saldo negativo.
CREATE TABLE toolkit_movimientos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN ('abono', 'compra', 'app', 'codigos', 'devolucion', 'reembolso', 'ajuste')),
  centavos       INTEGER NOT NULL,
  clave          TEXT NOT NULL UNIQUE,
  plan           TEXT,                 -- abono: 'toolkit' | 'toolkit-pro'
  factura_id     TEXT,                 -- abono y reembolso: la factura de Stripe
  pago_id        TEXT,                 -- abono: el PaymentIntent que pagó la factura (así se encuentra al reembolsarse)
  suscripcion_id TEXT,
  periodo_fin    TEXT,                 -- abono: hasta cuándo cubre ese pago
  order_id       TEXT,                 -- compra / app: la orden que se entregó
  product_id     TEXT,
  cantidad       INTEGER,
  nota           TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_toolkit_mov_email ON toolkit_movimientos (email, id);
CREATE INDEX idx_toolkit_mov_pago ON toolkit_movimientos (pago_id);
CREATE INDEX idx_toolkit_mov_tipo ON toolkit_movimientos (tipo, created_at);

-- Códigos de regalo sacados con saldo: 100 % de UN producto (en apps, 1 mes de cortesía). Un solo uso y NO vencen (son saldo
-- ya pagado). Mientras nadie lo use, quien lo sacó puede devolverlo a su saldo (devuelto_at; ya no se puede canjear).
-- Se guardan en claro porque quien los sacó los vuelve a ver y copiar desde Mi Toolkit (como los cupones de regalo).
CREATE TABLE toolkit_codigos (
  codigo          TEXT PRIMARY KEY,           -- TK-XXXX-XXXX
  email           TEXT NOT NULL,              -- quien lo sacó con su saldo
  movimiento      TEXT NOT NULL,              -- clave del cargo de la tanda en toolkit_movimientos
  product_id      TEXT NOT NULL REFERENCES products (id),
  producto        TEXT NOT NULL,              -- nombre al sacarlo
  precio_centavos INTEGER NOT NULL,           -- precio de lista que se descontó por este código
  usado_at        TEXT,
  usado_email     TEXT,
  order_id        TEXT,                       -- la orden de $0 del canje
  devuelto_at     TEXT,                       -- su dueño lo regresó a su saldo (movimiento 'devolucion')
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_toolkit_codigos_email ON toolkit_codigos (email, created_at);

-- Reembolsos que no se pudieron restar completos porque el saldo ya se había usado: para revisión manual (el saldo nunca
-- queda negativo). Sale en Admin.resumenToolkit().revisar.
CREATE TABLE toolkit_revisar (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL,
  factura_id        TEXT,
  clave             TEXT NOT NULL UNIQUE,
  faltante_centavos INTEGER NOT NULL,
  nota              TEXT,
  resuelto_at       TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Órdenes pagadas con saldo (proveedor 'saldo', monto_centavos 0: el ingreso ya se cobró en la factura del Toolkit).
-- saldo_centavos: lo que se descontó del saldo a precio de lista. toolkit_codigo: el código con que se canjeó (si aplica).
ALTER TABLE orders ADD COLUMN saldo_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN toolkit_codigo TEXT;
