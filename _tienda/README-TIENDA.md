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
   | Coupons | Write (descuentos de Puntos Vorka y de códigos de socio; sin este permiso el checkout con descuento responde que se puede pagar sin él) |

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

## Auditoría de regalos y puntos (octubre 2026, migración 0026)

- **Reenviar desde /descargas/reenviar ya no cambia ligas de regalo.** Cualquiera que sepa el correo puede pedir el reenvío, así que las ligas ya enviadas (quizá ya compartidas) no se tocan: en D1 solo vive su HMAC, no se pueden volver a mandar, y quien compró recibe un correo para buscar el original o escribirnos. Cambiar las ligas queda solo en Vorka OS (Órdenes › Reenviar).
- **Canje atómico:** la orden de $0, su renglón y marcar la liga como canjeada van en un solo batch; si algo falla, la liga sigue pendiente.
- **Reenvío con varios productos regalables:** lo canjeado se cuenta por producto.
- **Prender una liga apagada:** no se puede si ya hay otra liga vigente (o canjeada) para esa misma unidad pagada.
- **Descargables de regalo:** si la compra original se reembolsa, quien lo recibió también pierde las descargas.
- **Puntos apartados sin límite de tiempo** mientras la orden esté pendiente (OXXO dura 3 días); se liberan cuando vence o se rechaza (`orders.puntos_usados`). El apartado es atómico (INSERT condicional): dos compras simultáneas no pueden usar los mismos puntos.
- **Al confirmarse el pago** se revisa el saldo antes del canje. Si ya no alcanza, el canje se registra igual (el descuento ya se cobró), el saldo queda negativo a la vista y la orden se marca en `orders.revisar` (sale en el detalle de la orden en Vorka OS) con un `ALERTA` en los registros.
- **Si Stripe no deja crear el cupón** (401/403), el checkout responde 503 con un mensaje que ofrece pagar sin puntos (o sin el código) y registra `ALERTA checkout` en los registros. Revisa que la llave restringida tenga **Coupons: Write**.

## Socios Vorka (programa de socios, migración 0027)

Programa **solo por invitación** para que personas (a menudo dueños de negocios que ya usan nuestros productos) ganen dinero recomendando la tienda con su propio código. Código: `src/socios.js` (reglas, comisiones, pagos y RPC del panel) y `src/socios-portal.js` (portal del socio). Panel: Vorka OS › Tienda › Socios (permiso *Socios* de la tienda).

- **Alta:** el equipo crea a cada socio con nombre, correo, teléfono, CLABE (18 dígitos con dígito verificador), banco, RFC (opcional), notas, descuento para quien compra (0% por defecto) y, si se quiere, niveles propios. El código (p. ej. `ANA-CELAYA`) se edita y no distingue mayúsculas. *Mandar acceso* le envía la bienvenida con su código, su liga y el portal.
- **Atribución:** `vorka.mx/tienda/?socio=CODIGO` (o `?codigo=`) en cualquier página deja la cookie `vorka_socio` 30 días. En el formulario de compra aparece *¿Tienes un código de socio?*; el código escrito gana sobre la liga. Códigos inexistentes o suspendidos se ignoran, y comprarse a uno mismo no cuenta. El descuento del socio aplica a productos de Vorka (no a suscripciones) y se suma al de puntos en un solo cupón de Stripe.
- **Comisión escalonada por mes calendario** (hora del centro de México): por defecto 15% en las ventas 1 a 10 del socio y 25% desde la 11; se reinicia cada mes. El % queda fijo en cada venta (las ventas canceladas no cuentan para el nivel). Niveles editables en general y por socio.
- **Base de la comisión:** lo efectivamente cobrado de productos de Vorka (`orders.monto_centavos`: neto de descuentos de puntos y de socio, **IVA incluido**, antes de la comisión de Stripe). Se guardan la base y el % usados. Productos de creadores del marketplace no dan comisión.
- **Suscripciones (Vuelve):** la compra es el pago 1; cada `invoice.paid` de renovación da comisión hasta el pago 12 (configurable). Las renovaciones usan el % del nivel que el socio lleva ese mes y no suben de nivel.
- **Ciclo:** `pendiente` al pagarse → `disponible` tras la retención (7 días, configurable; el cron de cada hora la libera) → `pagada` cuando el equipo marca el SPEI. Reembolso o contracargo antes del pago: se cancela (y sale del pago por hacer). Después: ajuste negativo que se descuenta del siguiente pago.
- **Pagos (nada se transfiere solo):** cada lunes (hora del centro de México) el cron arma un pago `por_pagar` por socio activo con saldo positivo. El socio puede pedir *Pedir mi pago ahora* desde su portal: crea un pago inmediato y avisa por correo a `correo_avisos` (hola@vorka.mx por defecto). El equipo transfiere por SPEI y lo marca como pagado con la clave de rastreo y la fecha; al socio le llega un correo. CSV de comisiones en el panel.
- **Portal del socio:** `vorka.mx/tienda/socios/`, sin contraseña (enlace por correo de 30 minutos y un uso → sesión de 30 días). Muestra su código y liga (copiar, compartir, QR), ventas y nivel del mes, comisiones por estado, pagos y el botón de pago. Nunca muestra datos de quien compró (solo producto, fecha, monto y comisión) ni la CLABE completa. `/api/socios/codigo` tiene límite por IP.
- **Condiciones:** `/legal/socios/` (generada con `python3 _tienda/legales.py`), marcada como **versión preliminar**.

> **Impuestos (pendiente, antes del primer pago):** el sistema **no retiene ISR ni IVA ni emite CFDI** por las comisiones. Antes de pagarle al primer socio, revisa con el contador si corresponde retener (personas físicas con o sin actividad empresarial, RESICO, personas morales) y qué comprobante pedir. Por eso el alta guarda el RFC y el CSV de comisiones lo incluye.

**Pendiente / límites conocidos:** el reembolso de una *renovación* de suscripción no cancela su comisión automáticamente (los reembolsos de facturas no traen la orden en su metadata); si pasa, usa *Anular* en esa comisión desde el detalle del socio en Vorka OS (si ya se pagó, crea el ajuste negativo). Los afiliados con comisión en dinero de antes (`affiliates.tipo = 'dinero'`, `?ref=`) siguen funcionando aparte.
