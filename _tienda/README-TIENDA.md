# Tienda de Vorka México · configuración

Tienda de productos digitales en **vorka.mx/tienda**: cobro con tarjeta, OXXO y SPEI (Stripe), entrega automática por correo (Resend) y descarga desde un bucket privado (R2). Se administra desde **Vorka OS → Tienda** (solo rol Ejecutivo), sin tocar código.

## Cómo está armada

| Pieza | Dónde |
|---|---|
| Páginas de la tienda, checkout, webhook y descargas | Worker `vorka-tienda` (esta carpeta) en las rutas `vorka.mx/tienda*`, `vorka.mx/api/*` y `vorka.mx/descargas*`. El resto del sitio sigue igual (Cloudflare Pages). |
| Base de datos | D1 `vorka-tienda` (migraciones en `migrations/`) |
| Archivos que se venden | R2 privado `vorka-productos`. Solo salen por `/descargas/<token>`. Las portadas viven en `portadas/` y se sirven por `/tienda/img/…` |
| Pagos | Stripe Checkout (`src/pagos/stripe.js`). Mercado Pago se agrega después con la misma interfaz (`src/pagos/index.js`) |
| Correo | Resend, desde `tienda@vorka.mx` |
| Panel | Vorka OS → Tienda. Llama a la clase `Admin` de este Worker por *service binding* (RPC, sin ruta pública) |
| Páginas legales | `/legal/terminos/` y `/legal/reembolsos/` (generadas con `python3 _tienda/legales.py`) y `/privacidad/` (editado a mano) |

Flujo: `/tienda/<producto>` → `POST /api/checkout` (orden `pending`, precio leído de D1) → Stripe → `POST /api/webhooks/stripe` (firma verificada, consulta a Stripe, orden `paid`) → correo con enlace → `/descargas/<token>` (7 días, 10 descargas por archivo). `/tienda/gracias` muestra el estado y se actualiza sola.

## Paso a paso para ponerla en línea

Todo desde `vorka.mx/_tienda`, con `npx wrangler login` hecho en la cuenta de Cloudflare de vorka.mx.

### 1. Base de datos y bucket

> **Hecho el 15 de octubre de 2026:** D1 `vorka-tienda` (id `7e6febec-475c-4810-a32f-c8a79659dbfd`, ya en `wrangler.jsonc`) con las migraciones 0001–0005 aplicadas, y bucket privado `vorka-productos` (sin acceso público). Los comandos quedan como referencia.

```bash
npm ci
npx wrangler d1 create vorka-tienda
```

Pega el `database_id` que te da en `wrangler.jsonc` (en lugar de los ceros) y corre las migraciones:

```bash
npx wrangler d1 migrations apply vorka-tienda --remote
npx wrangler r2 bucket create vorka-productos
```

El bucket se crea **privado**. No le actives acceso público ni dominio `r2.dev`.

Verifica que se crearon las tablas (alguna vez `--file` falló en silencio):

```bash
npx wrangler d1 execute vorka-tienda --remote --command "SELECT slug, precio_centavos, activo FROM products"
```

### 2. Secretos

```bash
npx wrangler secret put STRIPE_SECRET_KEY        # clave restringida rk_test_… (prueba) o rk_live_… (producción), ver paso 4
npx wrangler secret put STRIPE_WEBHOOK_SECRET    # whsec_… del paso 4
npx wrangler secret put RESEND_API_KEY           # la misma de Vorka OS sirve
npx wrangler secret put DOWNLOAD_TOKEN_SECRET    # openssl rand -hex 32
```

`SITE_URL` está en `wrangler.jsonc` (no es secreto). Nunca pongas claves en el código ni en archivos que se suben a GitHub. Para desarrollo local copia `.dev.vars.example` a `.dev.vars`.

### 3. Publicar el Worker

**Se publica solo:** el Worker `vorka-tienda` está conectado a GitHub (Workers Builds, rama `main`, carpeta `/_tienda`). Cada push a `main` aplica las migraciones pendientes de D1 y publica (`npx wrangler d1 migrations apply vorka-tienda --remote && npx wrangler deploy`). Antes de unir a `main`, corre las pruebas:

```bash
npm test          # todas las pruebas deben pasar
```

Los scripts `publicar-*.command` y `npm run deploy` quedan solo como respaldo si Workers Builds fallara.

Revisa que `https://vorka.mx/api/tienda/salud` responda `{"ok":true}` y que la página de inicio y `/sparks/` sigan igual.

### 4. Stripe

> **Modo real configurado el 15 de octubre de 2026:** OXXO activado (condiciones aceptadas); webhook real `we_1UQx3VCSlkfDAZsFXUZQBe32` (importado del de prueba, versión `2026-09-30.endive`, 6 eventos); clave restringida real con los 5 permisos; correos de instrucciones de OXXO y transferencias activados; correo de soporte hola@vorka.mx. **Transferencias bancarias (SPEI) en modo real piden verificar identidad** (INE/pasaporte y selfie) en Stripe → Configuración → Verificaciones; hasta entonces el checkout ofrece tarjeta y OXXO. Los correos de entrega salen por Vorka OS (binding `CORREO`), así que la tienda no necesita `RESEND_API_KEY`.

> **Hecho en modo prueba el 15 de octubre de 2026:** OXXO y Transferencias bancarias activados; webhook `Tienda vorka.mx` (`we_1UQwYNCSlkfDAZsFpyAqaxDS`) a `https://vorka.mx/api/webhooks/stripe` con versión `2026-09-30.endive` y los 6 eventos; clave restringida `Tienda vorka.mx (Worker vorka-tienda)` con los 5 permisos de la tabla. Worker publicado y `DOWNLOAD_TOKEN_SECRET` guardado. Falta cargar la clave restringida, el `whsec_` y la clave de Resend con `cargar-claves.command` (doble clic). Los correos de instrucciones OXXO/SPEI se activan al pasar a modo real (Stripe los oculta en prueba).

La integración usa **Stripe Checkout** (página de pago de Stripe) con la API fijada en **`2026-09-30.endive`** (`src/pagos/stripe.js`).

1. Cuenta de Stripe México (persona física con RFC y cuenta bancaria mexicana).
2. **Settings → Payment methods**: activa **Cards**, **OXXO** y **Bank transfers** (SPEI). La tienda usa *métodos de pago dinámicos*: Stripe muestra los que tengas activos ahí, sin tocar código. SPEI necesita un cliente de Stripe; la tienda lo crea solo (uno por correo, tabla `stripe_clientes`) para que cada comprador conserve su misma CLABE.
3. **Settings → Emails**: activa los correos de instrucciones de **OXXO** y de **transferencia bancaria**, para que el comprador reciba su ficha o su CLABE aunque cierre la página.
4. **Clave restringida (recomendada en lugar de la secreta):** Developers → API keys → *Create restricted key*, con solo estos permisos:

   | Recurso | Permiso |
   |---|---|
   | Checkout Sessions | Write |
   | Customers | Write |
   | PaymentIntents | Read |
   | Charges | Read (para leer si un reembolso fue total) |
   | Disputes | Read |
   | Coupons | Write (descuentos de Puntos Vorka; sin este permiso el checkout con descuento responde que se puede pagar sin él) |

   Todo lo demás en *None*. Guárdala con `npx wrangler secret put STRIPE_SECRET_KEY`. Si algo falla con `403`, el error dice qué permiso falta. Usa claves distintas para prueba y producción, y renuévalas si alguien con acceso deja el equipo.
5. **Developers → Webhooks → Add endpoint**: `https://vorka.mx/api/webhooks/stripe`, **versión de API `2026-09-30.endive`** (la misma del código), con estos eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
   - `charge.dispute.created`
6. Copia el *Signing secret* (`whsec_…`) a `STRIPE_WEBHOOK_SECRET`.
7. Activa la verificación en dos pasos con app o llave de acceso (no SMS) en tu cuenta de Stripe.
8. Haz todo primero en **modo de prueba** (claves `rk_test_`, webhook de prueba) y repítelo en modo real al final.

### 5. Resend

El dominio `vorka.mx` ya está verificado (Vorka OS envía desde `hola@vorka.mx`), así que `tienda@vorka.mx` funciona sin pasos extra. Confirma en el DNS de Cloudflare que existen los registros SPF y DKIM que pide Resend y un DMARC (por ejemplo `v=DMARC1; p=none; rua=mailto:hola@vorka.mx`). Las respuestas a los correos de la tienda llegan a `hola@vorka.mx`.

### 6. Conectar el panel en Vorka OS

Solo después del paso 3 (si el Worker no existe, publicar Vorka OS falla):

1. En `vorka-os/wrangler.jsonc` descomenta el bloque `"services"` (binding `TIENDA` → `vorka-tienda`, entrypoint `Admin`).
2. Haz commit y push a `main` en `vorkamexico/os`: Cloudflare publica el panel solo (no uses `npx wrangler deploy` desde la Mac).
3. Entra como Ejecutivo: **Tienda** aparece en el menú lateral y en **Yo**.

Archivos de Vorka OS que forman parte de la tienda: `src/tienda.js`, `src/index.js` (import, ruta y subida de archivos), `public/tienda-app.js`, `public/tienda-app.css`, `public/index.html`, `public/app.js` (menú y rutas) y `wrangler.jsonc`.

### 7. Cargar el primer producto (sin código)

En **Vorka OS → Tienda → De Idea a Proyecto**:

1. Sube los 3 archivos (`1_Guia_De_Idea_a_Proyecto.pdf`, `2_Cuaderno_de_trabajo.docx`, `3_Calculadora_De_Idea_a_Proyecto.xlsx`) con **Subir archivos** y ponles el nombre que verá el comprador.
2. Quita de la lista los archivos de ejemplo que trae la migración si sus nombres no coinciden con lo que subiste.
3. Sube la portada, completa los **7 pasos** y revisa los textos de la página de venta (la migración `0004` trae un borrador).
4. Activa **A la venta** y guarda.

Para un producto nuevo: **Nuevo producto** → nombre y precio → **Crear** → portada, archivos y textos → **A la venta**.

### 8. Seguridad del dominio

- **HSTS**: Cloudflare → SSL/TLS → Edge Certificates → HTTP Strict Transport Security (las páginas de la tienda ya mandan el encabezado).
- **Admin**: no se usa Cloudflare Access. El panel vive en Vorka OS con su inicio de sesión y solo lo ve el rol Ejecutivo. La clase `Admin` no tiene ruta pública.

## Pruebas

```bash
npm test
```

Cubre: verificación de firma, máquina de estados, idempotencia del webhook, validación de tokens, checkout, descargas, reenviar, catálogo, afiliados y panel.

Casos de aceptación con Stripe en modo prueba (tarjetas en https://docs.stripe.com/testing):

| Caso | Cómo | Resultado esperado |
|---|---|---|
| Tarjeta aprobada | `4242 4242 4242 4242` | Orden `paid`, llega el correo y los archivos se descargan |
| Tarjeta rechazada | `4000 0000 0000 0002` | Stripe no deja pagar; al volver, `/tienda/gracias` ofrece reintentar |
| OXXO pendiente | Elegir OXXO con un correo como `prueba@test.com` | Orden `pending` con mensaje de OXXO; Stripe simula el pago a los 3 minutos y llega el correo (`succeed_immediately@test.com` lo paga al instante, `expire_immediately@test.com` lo vence → `failed`) |
| SPEI | Elegir transferencia; luego en el Dashboard de prueba, en el cliente → *Add* → *Cash balance (test only)* por el monto exacto | Orden `pending` y, al “llegar” la transferencia, `paid` con correo |
| Webhook repetido 3 veces | Dashboard de Stripe → evento → *Resend* tres veces | Un solo correo y un solo enlace (cubierto también por `test/webhook.test.js`) |
| Firma inválida | `curl -X POST https://vorka.mx/api/webhooks/stripe -d '{}'` | `401` y nada cambia |
| Enlace vencido o sin descargas | Esperar o descargar 10 veces | Mensaje claro y botón para pedir uno nuevo |
| Reembolso | Reembolsar el pago completo en Stripe | Orden `refunded` y el enlace deja de funcionar |
| Sitio actual | Abrir `/`, `/servicios/`, `/sparks/`, `/agenda/` | Igual que antes |

## Del modo de prueba a producción

- [ ] Todas las pruebas pasan (`npm test`) y los casos de aceptación funcionaron en modo prueba.
- [ ] Textos legales revisados por un abogado (se publicaron sin el aviso de BORRADOR el 2026-10-16, a decisión de Vorka México).
- [ ] Contenido final del producto: 7 pasos, portada y archivos reales.
- [ ] Stripe en modo real: `STRIPE_SECRET_KEY` con `sk_live_…`, webhook real creado y su `whsec_…` en `STRIPE_WEBHOOK_SECRET`.
- [ ] Una compra real de bajo monto de punta a punta (y reembolsarla).
- [ ] HSTS activado en la zona.
- [ ] Vorka OS conectado (paso 6) y probado: reenviar correo, revocar y CSV.

## Desarrollo local

```bash
npm run db:local                  # migraciones en la D1 local
npm run dev                       # Worker en http://localhost:8787 (o --port 8790)
python3 _tienda/marco.py          # si cambia el menú o el pie (_sitio/partes.py) o assets/v3/tienda.css
python3 _tienda/legales.py        # si cambian los textos legales
```

Con `ESTATICO_DEV` en `.dev.vars` apuntando a un servidor estático del repo, las páginas locales cargan el CSS y el menú del sitio.

## Fuera de esta fase (la arquitectura ya lo permite)

- **Mercado Pago**: agregar `src/pagos/mercadopago.js` con `crearCobro`, `leerWebhook` e `interpretar`, y registrarlo en `src/pagos/index.js`. El webhook ya acepta `/api/webhooks/<proveedor>`.
- **Marketplace con varios vendedores** y pago automático a afiliados (Stripe Connect).
- **Facturas automáticas (CFDI)**.
- **Marca de agua con el correo del comprador**: implementar `personalizeFile(orden, archivo)` en `src/entrega.js`.
- **Suscripciones o membresías**.
- **Carrito**: el modelo ya tiene `order_items` y el checkout acepta `items`.

## Ajustes de octubre 2026
- **Recordatorio de compra sin terminar** (`src/recordatorio.js`): en Vorka OS › Tienda › Órdenes, al abrir una orden pendiente o no pagada aparece *Enviar recordatorio*. Es un solo correo por orden (queda registrado en `orders.recordatorio_at`), con una liga firmada `/tienda/retomar/<orden>` que abre un pago nuevo con los mismos productos y datos (dura 14 días). No se manda si la orden tiene menos de 1 hora, si esa persona ya compró el producto o si a ese correo ya se le recordó algo en la última semana. WhatsApp no se incluye: las órdenes no guardan teléfono.
- **Enlace editable**: el editor del producto tiene *Enlace del producto*. Se valida (minúsculas, números y guiones; único; no reservado) y el enlace anterior queda en `slugs_anteriores` y redirige con 301 al nuevo (también funciona si alguien compra desde una página vieja).
- **Portada nueva de /tienda**: hero con el producto destacado (el primero según *Orden en el catálogo*), "cómo funciona" y el catálogo.
- Publicar: `_tienda/publicar-octubre.command` (aplica la migración 0007, publica la tienda y Vorka OS).

## Simulador PAA (vorka.mx/simulador-paa)

Producto de **acceso** (no de descarga): `contenido.acceso.app = "simulador-paa"` en el producto `prod_simulador_paa` (migración 0008, entra inactivo con precio provisional de $249).

- Compra → el correo de entrega lleva el botón **Entrar al simulador** (`/simulador-paa/entrar/<token>`). La página `/descargas/<token>` también lo muestra.
- El enlace deja la cookie `vk_paa` (HttpOnly, firmada con `DOWNLOAD_TOKEN_SECRET`). En cada petición se revisa en D1 que la orden siga pagada y dentro de su año de vigencia (`VIGENCIA_DIAS`). Un reembolso corta el acceso.
- Cambió de dispositivo → `/descargas/reenviar` manda un enlace nuevo, como con las descargas.
- Código: `src/simulador/` (rutas + banco de reactivos `banco.js`). Cliente en `simulador/app.js` y `app.css`; después de editarlos: `python3 _tienda/simulador/construir.py`.
- Historial de resultados en la tabla `simulador_resultados` (últimos 60 por compra).
- El botón de la Revista Sparks suscribe al boletín en `os.vorka.mx/api/publico/boletin` con el correo de la compra (`origen: simulador-paa`).

**Planes** (migración 0029): la página de venta deja escoger entre **Práctica ilimitada** (`simulador-paa-practica`, $199: Calentamientos, Medios y práctica sin límite, `acceso.ilimitado`), **Simulador completo** (`simulador-paa-completo`, $249: 2 exámenes Oficiales) y **Paquete completo** (`simulador-paa-paquete`, $379: los dos). El producto anterior `prod_simulador_paa` queda inactivo pero sus compras conservan lo que traían. En la app, lo que no incluye su plan aparece como tarjeta para desbloquearlo (se compra con el mismo correo), y el reporte de un Medio que llega a la meta dice "¡Ya estás listo para el simulador completo!". En el catálogo los tres planes salen como una sola tarjeta "Desde $199".

**Intentos** (migración 0009): la compra trae 2 simulacros completos (`contenido.acceso.intentos`). El producto oculto `simulador-paa-intento` ($50, `contenido.oculto`) suma 1 por unidad y solo lo compra quien ya tiene el simulador (candado en `/api/checkout`). Se cuentan por correo en `simulador_intentos`; el servidor arma cada simulacro completo (`src/simulador/armar.js`) y un intento abandonado también cuenta. Secciones sueltas y práctica de temas no gastan intentos.

**Examen PAA completo** (migración 0012): misma cantidad de preguntas y tiempo que la PAA real (`SECCIONES_EXAMEN` en `banco.js`: Lectura 45/50 min, Redacción 25/30, Matemáticas 55/60, Inglés 50/40 = 175 reactivos, 3 h), sin tutor. La compra trae 1 (`contenido.acceso.examenes`) además de los 2 cortos; el producto oculto `simulador-paa-examen` ($100) suma 1. `simulador_intentos.tipo` distingue `corto` y `examen`.

**Panel (os.vorka.mx → Tienda)**: hasta 3 correos de seguimiento por orden sin pagar (48 h entre uno y otro), "Borrar" una orden sin pagar la archiva (si el pago llega tarde se entrega y vuelve a aparecer), y las ligas de regalo se pueden apagar/prender una por una o borrar una tanda de cortesías que nadie ha usado.

**Tienda por secciones**: el catálogo agrupa por categoría (`SECCIONES_TIENDA` en `src/tienda.js`); una categoría nueva aparece sola como sección.

**Google**: `vorka.mx/simulador-paa/` es la página canónica (título, FAQ y Product en JSON-LD, imagen para compartir) y es la que va en `/tienda/sitemap.xml`. Portadas: `python3 _tienda/simulador/portadas.py` y subirlas a R2 como `portadas/simulador-paa-v2.png` y `portadas/simulador-paa-og.png`.

**Banco** (642 reactivos): base en `src/simulador/banco.js` + ampliaciones `extra-*.js`, `extra3-*.js` y `extra4-*.js` (Matemáticas trae figuras SVG originales en el campo `figura`; no se copian imágenes de la guía del College Board). Antes de agregar reactivos corre `node scripts/validar-banco.mjs` (ids, opciones, letras o "primera/última opción" en pistas, SVG seguro, y avisa si una lectura pasa de la extensión de referencia: Lectura 380 palabras, pareadas 420, Inglés 260). Si recortas una lectura, deja el mismo número de párrafos (las preguntas citan "párrafo N") y no cambies ids. Dificultad: Medio y Oficial prefieren dificultad 3, pero llevan una cuota de dificultad 2 (1 de cada 4 en Medio, 1 de cada 5 en Oficial; `CUOTA_MEDIA` en `armar.js`). El servidor arma cada simulacro y examen priorizando lo no visto por ese correo (`vistosDe` + `armar.js`). Las secciones sueltas hacen lo mismo en el cliente con lo que ya vio.

**Regalos** (migración 0010, `src/regalos.js`): en productos con `contenido.regalable` el formulario ofrece *Para regalar* (cantidad, para quién, mensaje). Al pagarse, quien compra recibe una liga `/tienda/regalo/<token>` por unidad (no recibe acceso). Cada liga se canjea una sola vez: crea una orden de $0 (`proveedor = 'regalo'`, `regalo_de`) a nombre de quien la abre, le manda su acceso y lo deja entrar. Reenviar cambia las ligas no usadas; un reembolso apaga las pendientes y el acceso de quien canjeó.

**Cortesías** (accesos gratis): en Vorka México → Tienda → *Regalar accesos* creas N ligas de un solo uso (para quién, mensaje y nota interna). Es una orden de $0 con `proveedor = 'cortesia'` a nombre de Vorka México; las ligas solo se muestran al crearlas y nunca se reenvían. Se pueden apagar las que no se usaron. Regalos y cortesías no cuentan como ventas ni salen en el CSV del contador.

**Google**: `/simulador-paa/` está en `sitemap.xml` (raíz, a mano) y en `/tienda/sitemap.xml`; tiene enlaces desde el inicio (tarjeta) y el pie de todo el sitio (`_sitio/partes.py`).

**Portadas**: se sirven con caché de un año; si cambias una, súbela con otro nombre (p. ej. `simulador-paa-v3.png`) y actualiza `products.imagen`.

Publicar: doble clic en `_tienda/publicar-simulador.command` después del merge (migraciones, deploy y, si dices que sí, lo pone a la venta).

## Brindi (vorka.mx/tienda/brindi)

Invitaciones digitales con marca propia (Diversificación). Aquí solo se vende; la app vive en `os.vorka.mx/brindi/` (ver `vorka-os/PLAN-BRINDI.md`).

- Productos de **acceso** (`contenido.acceso.app = "brindi"`, migración 0012): 3 planes y 8 complementos. Entran **ocultos**; solo el plan Celebración sale en el catálogo y todos se compran desde `/tienda/brindi/` (`src/brindi.js`).
- El correo de compra lleva a `acceso.url` (`https://os.vorka.mx/brindi/entrar/<token>`). Vorka OS valida ese token con `Admin.validarAcceso` y convierte cada unidad pagada en un crédito con `Admin.comprasApp`. Un reembolso revoca el crédito y despublica el evento.
- La analítica de ventas para Diversificación sale de `Admin.resumenApp`. Las visitas a la ficha se registran en el producto Celebración.
- Condiciones: `/legal/brindi/` (generada con `python3 _tienda/legales.py`).
- Publicar: `_tienda/publicar-brindi.command` después de unir los PR.

## Vuelve (vorka.mx/tienda/vuelve) · suscripciones

Tarjetas de lealtad para negocios (Diversificación). Aquí solo se vende; la app vive en `os.vorka.mx/vuelve/` (ver `vorka-os/PLAN-VUELVE.md`). Es el primer producto de la tienda que se cobra **por suscripción** (Stripe Billing).

- Productos (migración 0025, entran **inactivos**): `vuelve-mensual` ($399), `vuelve-anual` ($3,990, oculto) y la sucursal adicional de cada intervalo (`vuelve-sucursal-*`, ocultas). `contenido.suscripcion = { intervalo, extra }` le dice al checkout que abra Stripe en `mode: 'subscription'` con precios recurrentes en línea (`src/suscripciones.js`, `sesionSuscripcion` en `src/pagos/stripe.js`). Sin OXXO ni SPEI: no sirven para cobros automáticos.
- La primera compra es una orden normal (paid → correo con `os.vorka.mx/vuelve/entrar/<token>`). Renovaciones, fallas de pago y cancelaciones llegan por webhook y solo actualizan la tabla `suscripciones` (siempre consultando la suscripción en la API, nunca el cuerpo del webhook).
- Vorka OS lee el estado con `Admin.suscripcionApp(correo, 'vuelve')`, abre el portal de clientes con `Admin.portalApp` y muestra MRR con `Admin.resumenSuscripciones`.
- Ligas: `vorka.mx/vuelve/<negocio>` → registro de clientes en `os.vorka.mx/v/<negocio>` (cartel con QR). Condiciones: `/legal/vuelve/`, `/legal/vuelve/privacidad/`, `/legal/vuelve/privacidad-clientes/`.

**Antes de activar los productos** (en este orden):
1. Unir el PR y aplicar la migración: `npx wrangler d1 migrations apply vorka-tienda --remote`.
2. Stripe (modo real) → *Settings → Billing → Customer portal*: activarlo con cambiar tarjeta, ver facturas y **cancelar al final del periodo**; sin cambio de plan por ahora. Guardar.
3. Stripe → *Developers → Webhooks* → el endpoint de la tienda: agregar `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`. La llave restringida necesita lectura en *Subscriptions* e *Invoices*, y escritura en *Customer portal*.
4. Publicar el Worker (agrega la ruta `vorka.mx/vuelve*`).
5. Probar una suscripción en modo prueba (tarjeta 4242) con un correo propio, cancelarla desde el portal y confirmar que en Vuelve › Cuenta cambia el estado.
6. Activar `vuelve-mensual`, `vuelve-anual` y las dos sucursales en Vorka México → Tienda → Productos.

## Cuentas (vorka.mx/tienda/cuentas) · suscripción mensual

Cuentas (administrador de préstamos personales) es una app aparte: Worker `cuentas` en **cuentas.vorka.mx** (repo `vorkamexico/cuentas`). Aquí solo se vende.

- Producto `prod_cuentas_mensual` (slug `cuentas-mensual`, $99 MXN al mes, migración 0031). Entra **activo**. Usa la misma maquinaria de suscripciones que Vuelve: el checkout abre Stripe en modo suscripción y los webhooks actualizan la tabla `suscripciones` con `app = 'cuentas'`.
- La prueba de 7 días sin tarjeta vive en la app. Cuando termina sin suscripción, la cuenta queda en **modo consulta**: se puede ver y descargar todo, pero no registrar nada nuevo.
- La app consulta por service binding `TIENDA` → `Admin` con estos métodos: `suscripcionApp(correo, 'cuentas')`, `portalApp(...)` para el portal de Stripe y `validarAcceso(token, 'cuentas')` para el botón del correo de compra (`cuentas.vorka.mx/entrar/<token>`).
- Ficha: `src/cuentas.js`. Legales: `/legal/cuentas/` y `/legal/cuentas/privacidad/` (en `legales.py`). Portadas: `assets/tienda/cuentas.webp` y `cuentas-og.png`.
- No necesita nada nuevo en Stripe: el portal de clientes y los eventos de suscripción del webhook ya están desde Vuelve.

## Auditoría de regalos y puntos (octubre 2026, migración 0026)

- **Reenviar desde /descargas/reenviar ya no cambia ligas de regalo.** Cualquiera que sepa el correo puede pedir el reenvío, así que las ligas ya enviadas (quizá ya compartidas) no se tocan: en D1 solo vive su HMAC, no se pueden volver a mandar, y quien compró recibe un correo para buscar el original o escribirnos. Cambiar las ligas queda solo en Vorka OS (Órdenes › Reenviar).
- **Canje atómico:** la orden de $0, su renglón y marcar la liga como canjeada van en un solo batch; si algo falla, la liga sigue pendiente.
- **Reenvío con varios productos regalables:** lo canjeado se cuenta por producto.
- **Prender una liga apagada:** no se puede si ya hay otra liga vigente (o canjeada) para esa misma unidad pagada.
- **Descargables de regalo:** si la compra original se reembolsa, quien lo recibió también pierde las descargas.
- **Puntos apartados sin límite de tiempo** mientras la orden esté pendiente (OXXO dura 3 días); se liberan cuando vence o se rechaza (`orders.puntos_usados`). El apartado es atómico (INSERT condicional): dos compras simultáneas no pueden usar los mismos puntos.
- **Al confirmarse el pago** se revisa el saldo antes del canje. Si ya no alcanza, el canje se registra igual (el descuento ya se cobró), el saldo queda negativo a la vista y la orden se marca en `orders.revisar` (sale en el detalle de la orden en Vorka OS) con un `ALERTA` en los registros.
- **Si Stripe no deja crear el cupón** (401/403), el checkout responde 503 con un mensaje que ofrece pagar sin puntos (o sin el código) y registra `ALERTA checkout` en los registros. Revisa que la llave restringida tenga **Coupons: Write**.

## Puntos Vorka unificado (migración 0033; Socios Vorka quedó integrado aquí)

Un solo programa, abierto a cualquiera: cada compra que entra con tu liga (`?ref=`, y también las ligas anteriores de socio `?socio=` / `?codigo=`, o el código escrito en "¿Tienes un código de descuento o de quien te recomendó?" del formulario de compra) da **un % de lo cobrado en puntos** (1 punto = $1 MXN). Reglas en `src/puntos-reglas.js`; lógica en `src/puntos.js`.

- **Base:** lo efectivamente cobrado de productos de Vorka (`orders.monto_centavos`, neto de descuentos, IVA incluido, antes de la comisión de Stripe; prorrateado si la orden mezcla productos de creadores, que no dan puntos). Comprarse a uno mismo no cuenta.
- **Niveles por semestre** (ene–jun y jul–dic, hora del centro de México; ventas vigentes, sin reembolsadas): Inicial 10% (0–2), Bronce 15% (3+), Plata 20% (10+), Oro 25% (25+), Diamante 30% (50+). El % de una venta es el del nivel con las ventas previas; se calcula dentro del mismo `INSERT` (atómico). Cada semestre todos vuelven a Inicial; los logros son de por vida.
- **Puntos extra** (promoción vigente o producto sugerido y aceptado): +10 puntos porcentuales, tope 40%, una vez por orden (`multiplicador = 2`).
- **Suscripciones (Vuelve):** cada `invoice.paid` de renovación da puntos hasta el pago 12 con el % del nivel en ese momento (`clave = factura:<in_…>`); no suben de nivel. El reembolso de una renovación no se revierte solo (ajuste manual).
- Cada `ganado` guarda `base_centavos`, `pct` y `semestre`.

### Transferencia a cuenta (privada)

- **Nunca se anuncia** en textos públicos (página del programa, términos, correos masivos). Solo existe para las cuentas que el equipo habilita en Vorka OS › Tienda › Puntos Vorka (`puntos_cuentas.puede_retirar`). Para las demás, `/api/puntos/retiro` responde 404 y la app no muestra nada.
- Mínimo **500 puntos**. Los puntos de cada venta se pueden transferir **7 días** después (reembolsos y contracargos). Una sola solicitud en proceso por persona. La solicitud es atómica: movimiento `retiro` negativo + renglón `puntos_retiros` `por_pagar`.
- El equipo hace el **SPEI a mano** (sin Stripe Connect: no hay comisión extra de Stripe) y lo marca como pagado con la clave de rastreo (le llega un correo), o lo cancela (un `ajuste` regresa los puntos). CSV para el contador. Código: `src/puntos-retiros.js`.
- Las personas con transferencia necesitan un **acuerdo privado por escrito**: los términos públicos dicen que Vorka puede acordar condiciones adicionales con participantes específicos.

> **Impuestos (antes de la primera transferencia):** el sistema no retiene ISR ni IVA ni emite CFDI. Revisar con el contador.

Las tablas `socios_*` y las columnas `orders.socio_*` se quedaron (sin datos al migrar); el código ya no las usa. `/tienda/socios/` redirige a `/tienda/puntos/` y `/legal/socios/` a `/legal/terminos/#puntos`.

## Temas de temporada (vorka.mx/tienda)

La tienda se viste sola en las fechas que importan en México (`src/temporadas.js`, hora de CDMX): color de acento, decoración en la portada (papel picado, luces, corazones, estrellas o confeti, en SVG), un aviso en la pastilla de arriba y su línea primero (chips y producto destacado). Los avisos nunca prometen descuentos.

- Calendario: Año Nuevo, San Valentín, Día del Niño, Día de las Madres, Día del Padre, Regreso a clases, Fiestas patrias, Halloween y Día de Muertos, El Buen Fin (viernes antes del tercer lunes de noviembre al martes siguiente; 2026: 13–17 nov) y Navidad.
- Se elige en Vorka OS › Tienda › Tema de temporada: **Automático por calendario** (de fábrica), **Apagado** o una **fija**. Se guarda en la tabla `ajustes` (migración 0028, clave `temporada`) y la tienda la toma en un minuto.
- Las tarjetas de Vuelve tienen sus propios temas de temporada (opcionales para cada negocio, ver `PLAN-VUELVE.md` en Vorka OS).

## Vende (vorka.mx/tienda/vende)

App propia en **vende.vorka.mx** (Worker `vende`, repo `vorkamexico/vende`): clientas, pedidos, cobros y ganancia para vendedoras por catálogo y por encargo. Se cobra igual que Cuentas: **suscripción** (Stripe Billing) con la app preguntando por RPC `Admin.suscripcionApp(correo, 'vende')`; el botón del correo de compra lleva a `vende.vorka.mx/entrar/<token>` (`validarAcceso(token, 'vende')`).

- Migración `0038_vende.sql`: `vende-mensual` y `vende-anual` (oculto), categoría **Ventas**. **Entran inactivos con precio provisional** ($99/mes, $799/año, igual que Cuentas). Para vender: Vorka OS › Tienda › Vende Pro → precio definitivo → *A la venta*.
- Ficha: `src/vende.js` (`/tienda/vende/`), con plan gratis (los límites deben coincidir con `LIMITES_GRATIS` del Worker `vende`), Pro y programas patrocinados. Portadas: `assets/tienda/vende.webp` y `vende-og.png`.
- Legales: `/legal/vende/`, `/legal/vende/privacidad/` y `/legal/vende/privacidad-clientas/` (generadas con `legales.py`). **Borrador: revisarlos con un abogado antes de activar la venta.**
- Los programas patrocinados (marcas, distribuidores, directoras) **no** pasan por la tienda: Vende genera el reporte mensual de vendedoras activas y Vorka factura por fuera.
- Pruebas: `test/vende.test.js`.

## Agenda (vorka.mx/tienda/agenda) · suscripción por profesional y paquete con Vuelve

Citas en línea para consultorios y negocios de servicios (Diversificación). Aquí solo se vende; la app vive en Vorka OS: el dueño entra por `agenda.vorka.mx` y sus clientes reservan en `vorka.mx/citas/<negocio>` (ver `vorka-os/PLAN-AGENDA.md`).

- Productos (migración 0042, entran **inactivos**): `agenda-mensual` ($99, 1 profesional incluido), `agenda-anual` ($990, oculto), `agenda-profesional-mensual` / `-anual` (complementos ocultos, $99 / $990), y el paquete `agenda-vuelve-mensual` ($449) / `agenda-vuelve-anual` ($4,490), ambos ocultos y vendidos en la ficha. Precios con IVA incluido.
- `contenido.suscripcion.extras = { profesional, sucursal }` dice qué complementos admite cada plan (Vuelve sigue con su `extra` = sucursal). El checkout recibe `profesionales` (total, 1 incluido) y `sucursales` (solo en el paquete).
- **Paquete:** la suscripción se guarda con `app = 'agenda-vuelve'` y cuenta para las dos apps (`suscripciones.js › PAQUETES`): `suscripcionApp(correo, 'agenda')` y `suscripcionApp(correo, 'vuelve')` la devuelven con `paquete: 'agenda-vuelve'`, `portalApp` la encuentra desde cualquiera y `lugaresApp(correo, app, n, tipo)` cambia solo el complemento de esa app (`'sucursal'` en Vuelve, `'profesional'` en Agenda). El correo de entrega trae dos botones (Agenda y Vuelve) con el mismo token; `validarAcceso` lo acepta para las dos (`acceso.apps`). No se puede comprar el paquete encima de Vuelve o Agenda sueltas con el mismo correo (ni al revés).
- La tabla `suscripciones` ganó la columna `profesionales` (adicionales, sin el incluido).
- Ligas: `vorka.mx/citas/<negocio>` → `os /con/<negocio>`, `/citas/cita/<token>[/calendario.ics]` → `os /cita/…`, `/citas/api/*` → `os /api/citas/publico/*`, `/citas/logo/<id>` → la misma ruta (todo con `x-citas-base: 1`). `vorka.mx/citas/` lleva a `agenda.vorka.mx`. `vorka.mx/agenda/` («Agenda tu diagnóstico») no pasa por el Worker. Condiciones: `/legal/agenda/` y `/legal/agenda/privacidad/` (generadas con `legales.py`); el aviso para clientes vive en `agenda.vorka.mx/citas/privacidad-clientes`.
- Portada del catálogo `assets/tienda/agenda.webp` e imagen OG `assets/tienda/agenda-og.png` (archivos estáticos del sitio, hechos con Playwright).

**Antes de activar los productos** (en este orden):
1. Unir el PR de Vorka OS (`agenda-tienda`) y después el de este repo: Workers Builds aplica la migración 0042 y publica la ruta `vorka.mx/citas*`.
2. Stripe ya tiene el portal y los eventos de suscripción de Vuelve; no hace falta nada nuevo. Revisar solo que el portal de clientes siga **sin cambio de plan** (los profesionales se cambian desde la app).
3. Si `vuelve-sucursal-mensual` / `-anual` no están activos, el paquete no puede llevar sucursales adicionales hasta activarlos.
4. Activar desde Vorka OS › Tienda › Productos, o:
   `npx wrangler d1 execute vorka-tienda --remote --command "UPDATE products SET activo = 1 WHERE slug IN ('agenda-mensual','agenda-anual','agenda-profesional-mensual','agenda-profesional-anual','agenda-vuelve-mensual','agenda-vuelve-anual')"`

## Ruta de Impacto (vorka.mx/tienda/ruta-de-impacto) · pago único y regalable

Curso interactivo para jóvenes de 15 a 29 años que hacen proyectos sociales. Aquí solo se vende; la app vive en Vorka OS con dominio aislado: **ruta.vorka.mx** (ver `vorka-os/PLAN-RUTA-DE-IMPACTO.md`). Decisión de Dirección (26-10-2026): **$99 MXN, pago único, acceso por 1 año, regalable**. Lo recibido va para IMPACTO.

- Producto `prod_ruta_de_impacto` (slug `ruta-de-impacto`, migración `0044_ruta_de_impacto.sql`, categoría **Educación**). **Entra inactivo.** `contenido.acceso = { app: 'ruta', curso: 'jovenes', dias: 365, boton: 'Empezar mi Ruta', url: 'https://ruta.vorka.mx/entrar/' }` y `contenido.regalable`.
- Ficha: `src/ruta.js` (`/tienda/ruta-de-impacto/`, con `Course` y `FAQPage` en JSON-LD). Mientras el producto está inactivo la ficha se ve sin compra y con `noindex`. Capturas reales de la app en `assets/tienda/ruta/*.webp`; portada e imagen para compartir en `assets/tienda/v3/ruta-de-impacto-portada.webp` y `-og.jpg` (`SOLO=ruta-de-impacto python3 _tienda/simulador/portadas_v3.py`).
- **Entrega distinta a las demás apps** (`src/ruta-entrega.js`): el enlace no es de la tienda, lo da Vorka OS por el service binding `RUTA` (`vorka-os`, entrypoint `Ruta`):
  - Compra para uno mismo, cortesía directa o regalo de la tienda ya canjeado → `darAcceso({ correo, nombre, orden, curso, dias })` y el correo lleva el botón **Empezar mi Ruta** con su `enlace` (un solo uso, 7 días).
  - Compra para regalar → `crearRegalo({ orden, curso, de_nombre, mensaje })` por unidad (la 1.ª con el id de la orden, las demás `id:2`, `id:3`…) y el correo a quien paga lleva las ligas `ruta.vorka.mx/regalo/…`. La tienda no crea ligas propias para Ruta. Reenviar manda **las mismas** ligas (no apaga nada de lo compartido).
  - Reembolso o contracargo (webhook), *Revocar* del panel o quitar una cortesía → `revocar({ orden, curso })` por unidad. La ficha de la orden en el panel trae `ruta` con `estado({ orden })`.
  - **Si os no responde, la orden no se pierde:** no se manda correo ni se crea token, la orden queda con la nota `Ruta de Impacto: …` en `orders.revisar` (sale en el panel), se registra `ALERTA ruta` en los registros y el webhook responde 500 para que Stripe reintente. Cuando sale bien, la nota se quita sola. También se puede usar *Reenviar* en la orden.
- Pruebas: `test/ruta.test.js`.

**Antes de activar** (en este orden):
1. Unir el PR de este repo: Workers Builds aplica la migración 0044 y publica el binding `RUTA` (Vorka OS ya exporta la clase `Ruta` en `main`).
2. Confirmar que `ruta.vorka.mx` responde (la app del alumno en Vorka OS).
3. Una compra de prueba con tarjeta 4242 en el entorno de pruebas: llega «Empezar mi Ruta» y entra a ruta.vorka.mx; un regalo de 1 y su liga; un reembolso que quita el acceso.
4. Activar desde Vorka OS › Tienda › Productos, o:
   `npx wrangler d1 execute vorka-tienda --remote --command "UPDATE products SET activo = 1 WHERE slug = 'ruta-de-impacto'"`

## Códigos de descuento y 5 % por recomendación (migración 0045)

- **Un solo campo «código»** en todos los formularios de compra (tienda, Brindi, Cupo, Vuelve, Agenda, Vende y Cuentas): acepta un código de descuento de la tabla `codigos_descuento` o el código de una persona de referidos (`affiliates`). Antes de pagar dice qué descuento se aplica y por qué, sin datos de quien recomendó (`/api/puntos/liga?c=…&slug=…`). Lógica en `src/descuentos.js`.
- **FUNDADOR30**: 30 % los primeros 3 meses, solo en planes mensuales, 10 lugares por app (Vuelve, Agenda, Vende, Cuentas; el paquete Agenda + Vuelve cuenta dentro de Agenda). El lugar cuenta al **pagarse** la orden y no se libera con reembolsos o cancelaciones. En anuales y pagos únicos no aplica: la compra sigue sin ese descuento y se avisa por qué.
- **5 % por recomendación**: solo en el primer pago (también en suscripciones), con el código escrito o por la liga (`?ref=` / cookie `vorka_ref`). No aplica si quien compra usa su propio código. Quien recomendó sigue ganando sus puntos sobre lo cobrado.
- **Textos públicos** (marco: «por ser parte del ecosistema Vorka»): página y app de Puntos (`src/puntos-app.js`: beneficios, preguntas frecuentes y mensajes para compartir; los de productos de creadores no ofrecen el 5 %), correos de bienvenida y de puntos ganados (`src/puntos.js`), banda de la tienda, gracias, Brindi para organizadores, tarjeta del simulador y el apartado `#descuentos` de `/legal/terminos/` (`legales.py`). Si cambian el %, los meses o los lugares, cámbialos ahí y en los kits de venta de os (`public/kit/*`).
- **No se acumulan**: se aplica el mayor; el código de quien recomendó sigue contando para sus puntos. En pagos únicos el 5 % sí se suma a los puntos de quien compra, siempre dejando el cobro mínimo de $10.
- **Stripe**: pagos únicos → un cupón `amount_off` de un solo uso con todo el descuento. Suscripciones → cupón por % reutilizable (`vorka_FUNDADOR30`: 3 meses `repeating`; `vorka_ref5`: `once`, solo el primer pago) en `discounts`, sin `allow_promotion_codes`. La llave restringida necesita **Coupons: Write**.
- **Orden**: `descuento_codigo` (`FUNDADOR30` o `REFERIDO`), `descuento_pct`, `descuento_duracion`, `descuento_meses`, `descuento_codigo_centavos` (parte de `descuento_centavos` que dio el código) y `descuento_app`. `monto_centavos` sigue siendo lo cobrado neto (CSV y reportes).
- Ver y administrar (no hay pantalla en el panel todavía):
  `npx wrangler d1 execute vorka-tienda --remote --command "SELECT c.codigo, c.activo, c.usos, u.app, u.usos FROM codigos_descuento c LEFT JOIN codigos_descuento_usos u ON u.codigo = c.codigo"`
  `npx wrangler d1 execute vorka-tienda --remote --command "UPDATE codigos_descuento SET activo = 0 WHERE codigo = 'FUNDADOR30'"`

## Cupones de regalo (migración 0055)

Se crean en **Vorka OS › Tienda › Regalar › Cupón de descuento** (permiso `tienda_productos`). Lógica: `src/cupones-regalo.js` (crear, lista, revocar, correo) y `src/descuentos.js` (`evaluarRegalo`, `centavosDe`). Pruebas: `test/cupones-regalo.test.js`.

- **Transferibles:** no van ligados a un correo; quien tenga el código lo usa en el mismo campo «código» de cualquier compra. Código `REGALO-XXXX-XXXX` (alfabeto sin 0/O/1/I/L, 31^8 combinaciones, único también frente a `codigos_descuento`).
- **Datos:** % (5–100) o monto en pesos; alcance toda la tienda (solo Vorka, nunca creadores), una línea (`src/lineas.js`: Educación, Negocios, Eventos, Finanzas personales) o un producto; usos por cupón (1 por omisión); de 1 a 50 por tanda; vigencia 90 días por omisión (`hasta` = último día, hora del centro de México); «para quién» y nota solo internos.
- **Al pagar:** como cualquier código. No se acumula con FUNDADOR30 (un solo campo) ni con el 5 % (gana el mayor **en pesos**; si gana el 5 %, se avisa y el cupón no gasta uso; quien recomendó suma sus puntos en cualquier caso). En pago único se suman los puntos de quien compra. Siempre queda el cobro mínimo de $10. Un monto mayor que el precio se pierde (no hay saldo) y la página lo dice antes de pagar (`#codigo-sobra`). El uso cuenta al pagarse la orden. Mientras una compra con el cupón espera su pago (24 h), sus usos quedan apartados para **otros** correos.
- **Alcance en la compra:** pago único → solo lo que entra en el alcance (Brindi: un cupón de un plan no descuenta sus complementos). Suscripción → si el plan entra, todo el primer cobro (plan y complementos), que es lo que Stripe descuenta.
- **Stripe:** pago único → el cupón `amount_off` de un uso de siempre (con puntos incluidos). Suscripción (`once`) → `vorka_regalo_<pct>p_once` (`percent_off`) o `vorka_regalo_<centavos>c_once` (`amount_off`, también cuando un % topa con el cobro mínimo), reutilizados por valor.
- **Ligas:** `vorka.mx/tienda/?cupon=CODIGO` (con `#linea` si es de una línea) o la ficha del producto con `?cupon=`. Cualquier página de la tienda guarda `?cupon=` en el navegador (30 días) y la página de compra prellena y revisa el campo; la portada muestra una banda con lo que da el cupón o por qué ya no sirve.
- **Correo (opcional):** «Enviar por correo» al crear (lista `Nombre, correo` por renglón: un cupón por persona) o desde la lista («Enviar» / «Reenviar»). Sale de `tienda@vorka.mx` con `enviar()` de `src/correo.js` (Resend o la clase `Correo` de Vorka OS). Se guarda solo el último envío (nombre, correo, cuándo, resultado). Tope: 50 por tanda y 200 por hora en toda la tienda. El correo no amarra el cupón: sigue siendo transferible.
- **Orden:** `descuento_codigo = 'REGALO-…'`, `descuento_pct` (NULL si es por monto), `descuento_monto_centavos` (valor del cupón por monto) y `descuento_codigo_centavos` (lo que de verdad descontó).
- **Admin (RPC):** `cuponesRegalo()`, `crearCuponesRegalo(d)`, `revocarCuponesRegalo({ codigo | lote })`, `enviarCuponRegalo(codigo, { nombre, email }?)`, `borrarDatosCupon({ codigo, por })`, `buscarDatosCuponCorreo(email)`, `borrarDatosCuponCorreo({ email, por })`.
- **Orden de despliegue:** esta tienda primero (Workers Builds aplica 0055 y publica los RPC); después Vorka OS. Si OS sale antes, la opción «Cupón de descuento» muestra que la tienda aún no lo tiene.
- Condiciones: párrafo «Cupones de regalo» en `/legal/terminos/#descuentos` (`legales.py`).
- **Borrado de los datos de quien lo recibe (migración 0056, `/privacidad/#conservamos` y `#arco`):** «borrar» = anonimizar `envio_nombre`, `envio_email`, `envio_error`, `para` y `nota` (NULL). Se conserva lo contable (código, montos, usos, vigencia, revocación, cuándo se mandó, si salió, cuántos envíos) y `orders` no se toca. Tres caminos, todos con renglón en la bitácora `cupones_regalo_borrados` (código, quién, cuándo y motivo; nunca el dato borrado):
  - **Automático:** `anonimizarCuponesViejos` corre una vez al día dentro del cron de cada hora (la corrida de las 09 UTC; no se gasta otro cron). Anonimiza 12 meses después de que el cupón venció, se revocó o se terminó de usar (fecha de pago de la última orden). Un cupón con usos pendientes no ha terminado hasta que vence (máximo 3 años).
  - **Panel:** «Borrar datos de quien lo recibe» en el detalle del cupón (`Admin.borrarDatosCupon({ codigo, por })`).
  - **ARCO por correo:** `Admin.buscarDatosCuponCorreo(email)` y `Admin.borrarDatosCuponCorreo({ email, por })`: busca el correo en el envío, «para quién», la nota y el error; también quita el correo de la descripción de los códigos personales de Sparks (`Regalo Sparks · correo` → `Regalo Sparks`).
  - Pruebas: `test/cupones-regalo-borrado.test.js`.

## Puntos Vorka en Vorka OS: «Comparte y gana» y equipo ×1.5 (migración 0046)

- **`Admin.catalogoPuntos(code)`**: productos activos de Vorka para recomendar, por línea (las mismas tarjetas, nombres y precios del catálogo de `/tienda/`), con su página pública y la liga `?ref=CODE`. Sin productos de creadores ni ocultos (intentos y exámenes adicionales, complementos, planes que se venden dentro de otra página). Todas las páginas de destino leen `?ref=` (prueba: `test/catalogo-puntos.test.js`); nunca usa las páginas por universidad del Simulador PAA. Trae las reglas del programa (`reglas`: niveles, extra, tope y `factor_equipo`) para que OS las explique sin copiar porcentajes.
- **Equipo de Vorka ×1.5** (`FACTOR_EQUIPO` en `src/puntos-reglas.js`, única fuente): las cuentas con `puntos_cuentas.equipo = 1` ganan el % de su nivel (+ extra) × 1.5, con el **mismo tope de 40 %** (`PCT_TOPE`) y sobre lo efectivamente cobrado: Inicial 15 %, Bronce 22.5 %, Plata 30 %, Oro 37.5 %, Diamante 40 %. Cada movimiento guarda su `factor`. Los puntos ya ganados no cambian; comprarse a sí mismo sigue sin contar; el reembolso revierte exacto; las renovaciones también llevan el factor.
- **`Admin.equipoPuntos(emails)`**: Vorka OS manda los correos de sus personas activas; marca exactamente esas cuentas y desmarca al resto (bajas). No crea cuentas. OS lo llama en `GET /api/puntos/yo`, en el cron diario y al dar de baja a alguien.
- `puntosApp` ahora también devuelve `equipo`, `factor` y `pct_efectivo` (`pct` sigue siendo el del nivel).
- **Orden de despliegue**: esta tienda primero (aplica 0046 y publica los RPC); después Vorka OS. Si OS sale antes: la tarjeta del Inicio muestra los puntos sin el ×1.5 y «Comparte y gana» no lista productos (aviso amable), porque `catalogoPuntos` y `equipoPuntos` aún no existen.
- Pendiente: la app `vorka.mx/tienda/cuenta/` todavía muestra el % del nivel, no el efectivo del equipo (los avisos de «ganaste» sí dicen el % aplicado).

## Tests: Test vocacional Vorka y ¿Qué proyecto social hago? (migración 0058, `src/tests/`)
- **Rutas** (nuevas en `wrangler.jsonc`: `vorka.mx/test-vocacional*` y `vorka.mx/que-proyecto-social*`): el test gratis (indexable, en el sitemap por `acceso.ruta`), `/resultado/<id>` (noindex), `/reporte/<token>` (noindex), `/entrar/<token>` (botón del correo de entrega), `/ver/<orden>` (desde gracias, solo con la cookie del navegador donde se contestó), `/pagar/<id>` («que lo pague mi mamá o mi papá»), `/panel/<token>` y `/grupo/<codigo>` (licencias). `/tienda/<slug>/` redirige con 301 a la página del test.
- **Costo marginal cero**: resultados por reglas (`vocacional.js`, `proyecto.js`) con contenido propio (`*-datos.js`). Sin IA ni APIs de pago por uso. Base del vocacional: teoría RIASEC de Holland con preguntas originales; el O*NET Interest Profiler solo fue referencia conceptual (no se usan sus reactivos). Orientativo: no es prueba psicométrica.
- **Precios**: reporte vocacional $79, reporte de proyecto social $149, licencias de grupo 10/$490, 30/$1,170, 100/$2,900 (ocultas del catálogo, se venden en la ficha). Entran activos por encargo del dueño; se cambian en Vorka OS › Tienda › Productos.
- **Embudo honesto**: el precio se ve antes de empezar; al terminar, «¡Tu perfil está listo!» pide nombre y correo (se puede saltar); perfil gratis (3 tipos + carrera n.º 1 / 3 ideas) y el reporte con candado (títulos visibles, detalle bloqueado). Cupón real de 1 uso, solo para el reporte, que vence a las 24 h (`cupones_regalo`, lote `auto-<app>`: $20 vocacional, $40 proyecto). Paquete test + simulador del examen que le toca (plan de práctica) con $40 de descuento fijo (`PAQUETE-TEST`, no se acumula: gana el mayor).
- **Recordatorio**: UN correo «tu resultado te espera» entre 20 y 48 h después, solo con la casilla de recordatorio marcada, sin compra y sin baja (cron de cada hora, `mandarRecordatorios`). Baja con un clic.
- **Métricas**: `Admin.metricasTests({ dias })` → inicio, mitad, termino, correo, candado, checkout, recordatorio, compras, compras_cupon, recuperadas e ingresos por producto (tabla `tests_metricas` + órdenes).
- **Datos**: `Admin.borrarDatosTests(email)` (ARCO); la persona puede borrar sus respuestas desde su resultado; limpieza diaria: 12 meses sin compra, 24 con compra. Ver `privacidad/#tests`.
- **Panel en Vorka OS › Tienda › Tests** (`src/tests/panel.js`, migración 0059): `Admin.panelTests({ rango: 'hoy' | '7d' | '30d' })` (embudo con % por paso y ventas de reportes, paquetes y licencias; el día es el del centro de México), `gruposTests()` (correo oculto, lugares usados, liga del grupo), `ligaPanelTests({ order_id, por })` (liga nueva del panel del orientador), `reenviarPanelTests({ order_id, por })`, `buscarDatosTestsCorreo(email)` y `borrarDatosTestsCorreo({ email, por })` (ARCO), y `bitacoraTests()`. La bitácora `tests_bitacora` dice qué pasó, cuándo y quién (o «persona» si la borró ella misma desde su resultado); nunca guarda el dato borrado.
- **Pendiente**: un enlace desde Vorka Learn al test (Learn se está rediseñando en otra rama).
