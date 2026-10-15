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
npx wrangler secret put STRIPE_SECRET_KEY        # sk_test_… (prueba) o sk_live_… (producción)
npx wrangler secret put STRIPE_WEBHOOK_SECRET    # whsec_… del paso 4
npx wrangler secret put RESEND_API_KEY           # la misma de Vorka OS sirve
npx wrangler secret put DOWNLOAD_TOKEN_SECRET    # openssl rand -hex 32
```

`SITE_URL` y `STRIPE_METODOS` están en `wrangler.jsonc` (no son secretos). Para desarrollo local copia `.dev.vars.example` a `.dev.vars`.

### 3. Publicar el Worker

```bash
npm test          # todas las pruebas deben pasar
npm run deploy
```

Revisa que `https://vorka.mx/api/tienda/salud` responda `{"ok":true}` y que la página de inicio y `/sparks/` sigan igual.

### 4. Stripe

1. Cuenta de Stripe México (persona física con RFC y cuenta bancaria mexicana).
2. **Settings → Payment methods**: activa **Cards**, **OXXO** y **Bank transfers** (SPEI). Si alguno no está disponible, quítalo de `STRIPE_METODOS` en `wrangler.jsonc` y vuelve a publicar.
3. **Developers → Webhooks → Add endpoint**: `https://vorka.mx/api/webhooks/stripe` con estos eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
   - `charge.dispute.created`
4. Copia el *Signing secret* (`whsec_…`) a `STRIPE_WEBHOOK_SECRET`.
5. Haz todo primero en **modo de prueba** (claves `sk_test_`, webhook de prueba) y repítelo en modo real al final.

### 5. Resend

El dominio `vorka.mx` ya está verificado (Vorka OS envía desde `hola@vorka.mx`), así que `tienda@vorka.mx` funciona sin pasos extra. Confirma en el DNS de Cloudflare que existen los registros SPF y DKIM que pide Resend y un DMARC (por ejemplo `v=DMARC1; p=none; rua=mailto:hola@vorka.mx`). Las respuestas a los correos de la tienda llegan a `hola@vorka.mx`.

### 6. Conectar el panel en Vorka OS

Solo después del paso 3 (si el Worker no existe, publicar Vorka OS falla):

1. En `vorka-os/wrangler.jsonc` descomenta el bloque `"services"` (binding `TIENDA` → `vorka-tienda`, entrypoint `Admin`).
2. `cd vorka-os && npx wrangler deploy`.
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
| OXXO pendiente | Elegir OXXO en el checkout de prueba | Orden `pending` con mensaje de OXXO; al confirmarse (Stripe lo simula en unos minutos) llega el correo |
| Webhook repetido 3 veces | Dashboard de Stripe → evento → *Resend* tres veces | Un solo correo y un solo enlace (cubierto también por `test/webhook.test.js`) |
| Firma inválida | `curl -X POST https://vorka.mx/api/webhooks/stripe -d '{}'` | `401` y nada cambia |
| Enlace vencido o sin descargas | Esperar o descargar 10 veces | Mensaje claro y botón para pedir uno nuevo |
| Reembolso | Reembolsar el pago completo en Stripe | Orden `refunded` y el enlace deja de funcionar |
| Sitio actual | Abrir `/`, `/servicios/`, `/sparks/`, `/agenda/` | Igual que antes |

## Del modo de prueba a producción

- [ ] Todas las pruebas pasan (`npm test`) y los casos de aceptación funcionaron en modo prueba.
- [ ] Textos legales revisados por un abogado (quitar el aviso de BORRADOR en `legales.py` y regenerar).
- [ ] Contenido final del producto: 7 pasos, portada y archivos reales.
- [ ] Stripe en modo real: `STRIPE_SECRET_KEY` con `sk_live_…`, webhook real creado y su `whsec_…` en `STRIPE_WEBHOOK_SECRET`.
- [ ] Una compra real de bajo monto de punta a punta (y reembolsarla).
- [ ] HSTS activado en la zona.
- [ ] Vorka OS conectado (paso 6) y probado: reenviar correo, revocar y CSV.

## Desarrollo local

```bash
npm run db:local                  # migraciones en la D1 local
npm run dev                       # Worker en http://localhost:8787 (o --port 8790)
python3 _tienda/marco.py          # si cambia el menú o el pie del sitio (_sitio/partes.py)
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
