# Plan: marketplace de creadores en vorka.mx/tienda

Recomendación de integración con Stripe Connect, armada con las guías de Stripe y las decisiones de Vorka México (15 de octubre de 2026). Nada de esto está construido todavía.

**Decisiones ya tomadas**
- Creadores externos venden sus productos digitales en vorka.mx/tienda y reciben su parte automáticamente.
- Comisión de Vorka: **20 % por defecto**, ajustable por creador en Vorka OS.
- La comisión de Stripe de cada venta **se descuenta de la parte del creador** (tu 20 % queda completo).
- Acceso: el creador **solicita**, tú **apruebas** en Vorka OS y **cada producto se revisa** antes de publicarse.

## Recomendación

### A. Configuración de las cuentas de los creadores
- API: Accounts v2 (`/v2/core/accounts`), sin el `type` antiguo.
- Panel: **Express** (`dashboard: "express"`): un panel ligero de Stripe donde el creador ve sus depósitos.
- Comisiones: **las fija tu plataforma** (`fees_collector: "application"`).
- Saldos negativos: **responsabilidad de tu plataforma** (`losses_collector: "application"`).
- Cada creador tiene la configuración de receptor (`configuration.recipient`) con `stripe_transfers` en `stripe_balance`, para recibir transferencias de Vorka. **No** se pide la configuración de comercio (`merchant`) ni `card_payments`: no los necesita y harían su registro más largo.

Por qué: Vorka es quien vende (su nombre aparece en el estado de cuenta del comprador), cobra, entrega y atiende. El creador solo necesita recibir su dinero y ver sus depósitos.

### B. Cómo se cobra: cargo de Vorka + transferencia al creador (separate charges and transfers)
El comprador le paga a Vorka como hoy (Checkout con tarjeta, OXXO y SPEI). Cuando el pago se confirma y pasa el plazo de reembolso, Vorka le transfiere al creador su parte, calculada con la comisión **real** que cobró Stripe en esa venta.

Por qué este patrón y no el cargo a destino:
- **Comisión exacta.** El método de pago (tarjeta, OXXO o SPEI) se elige dentro del checkout, así que la comisión de Stripe solo se conoce después de pagar. Con la transferencia posterior se descuenta la cifra real, no un estimado.
- **Coincide con tu política de reembolsos.** Hay 5 días hábiles para pedir reembolso si no se descargó nada. Al transferir después de ese plazo casi no hace falta recuperar dinero del creador.
- **Deja listo el carrito** con productos de varios creadores en una misma compra.

### C. Registro de creadores
1. El creador llena una solicitud en **vorka.mx/creadores** (nombre, correo, qué vende, ejemplos).
2. Tú la apruebas en **Vorka OS → Tienda → Creadores** y le llega un correo con su acceso.
3. En su portal, el creador completa su registro con **Stripe incrustado en vorka.mx** (embedded onboarding): datos, identificación y cuenta bancaria. Stripe pide y verifica todo lo necesario y avisa si después falta algo.
4. Sus productos solo se pueden publicar cuando Stripe marca su cuenta como lista (`stripe_transfers` y depósitos activos).

Se elige el registro incrustado porque el creador nunca sale de vorka.mx. Stripe también se encarga de pedir datos nuevos cuando cambian los requisitos.

### D. Panel del creador
- Portal **vorka.mx/creadores** con acceso por enlace mágico al correo, sin contraseña.
- El creador **sube sus productos**: archivos, portada, precio y textos, con el mismo editor que Vorka OS. Cada producto queda "en revisión" hasta que lo apruebes.
- Ve sus **ventas, comisiones y transferencias**.
- Botón **"Ver mis depósitos"**: abre su panel Express de Stripe con un enlace de acceso que genera Vorka.

### E. Componentes de Stripe incrustados en el portal
- `account_onboarding`: registro y verificación.
- `notification_banner` (obligatorio): avisa cuando Stripe necesita algo más, para que su cuenta siga activa.
- `account_management`: actualizar datos y cuenta bancaria.
- `payouts`: depósitos y saldo.

Con este patrón de cobro, las vistas de pagos y disputas de Stripe muestran menos detalle al creador. Por eso el portal le muestra sus ventas con los datos de la tienda.

### F. Avisos de Stripe (webhooks)
Se usan los mismos avisos de Stripe, con su firma verificada, para confirmar pagos, hacer transferencias, revertirlas en reembolsos y disputas, y seguir el estado de las cuentas de los creadores.

### G. Cuándo se le puede pagar a un creador
Antes de transferir, se consulta su cuenta con `stripe.v2.core.accounts.retrieve(id)` y se verifica:
- `configuration.recipient.capabilities.stripe_balance.stripe_transfers.status === 'active'`
- `configuration.recipient.capabilities.stripe_balance.payouts.status === 'active'`

Si no está activa, la transferencia queda pendiente y sale sola cuando se active.

### H. Comisiones y reparto
- Modelo: **porcentaje por creador** (20 % por defecto).
- Cálculo (transferencia posterior, sin `application_fee_amount`, que no aplica a este patrón):

  `transferencia al creador = precio − (precio × % de Vorka) − comisión real de Stripe de esa venta`

  `ganancia de Vorka = precio × % de Vorka` (completa)

```
  Comprador paga $279
          │
          ▼
  ┌────────────────┐
  │  Vorka México  │ ─── se queda 20 % ($55.80); la comisión de Stripe se descuenta de la parte del creador
  └───────┬────────┘
          │ transferencia: $279 − $55.80 − comisión de Stripe de esa venta
          ▼
  ┌────────────────┐
  │    Creador     │ ─── recibe el resto en su cuenta de Stripe → depósito a su banco
  └────────────────┘
```

Las tarifas de Stripe dependen del método de pago: consulta [stripe.com/mx/pricing](https://stripe.com/mx/pricing). Conviene revisar el reporte de márgenes de Connect en el Dashboard.

### I. Cobros recurrentes
No aplica por ahora: no hay suscripciones ni cuota mensual para los creadores.

### J. Plan de construcción
1. **Stripe (tú, en el Dashboard):** activar Connect, completar el perfil de plataforma y aceptar la responsabilidad de saldos negativos de la plataforma.
2. **Datos:** creadores (solicitud, estado, % de comisión, cuenta de Stripe), productos con dueño y estado de revisión, y transferencias por orden.
3. **Portal vorka.mx/creadores:** solicitud, acceso por enlace mágico, registro incrustado de Stripe, subir productos y ver ventas.
4. **Vorka OS → Tienda:** pestañas Creadores (aprobar, % por creador, estado de su cuenta de Stripe) y Revisión de productos.
5. **Pagos:** transferencia automática al terminar el plazo de reembolso, con la comisión real; reversión en reembolsos y disputas; reintentos si la cuenta del creador aún no está activa.
6. **Pruebas en modo prueba** con cuentas de creador de prueba: venta, transferencia, reembolso antes y después de transferir, y disputa.
7. **Arranque:** contrato con creadores y revisión fiscal (ver K).

### K. Riesgos y responsabilidad
**Responsabilidad de saldos negativos: tu plataforma.** Si un comprador desconoce un cargo, Stripe se lo cobra primero a Vorka. Vorka lo recupera revirtiendo la transferencia del creador. Si el creador ya no tiene saldo, su cuenta puede quedar en negativo y se descuenta de sus siguientes ventas.

**Control de fraude: tu plataforma, con Radar.** Como Vorka es quien vende, un cargo fraudulento sale primero del saldo de Vorka. Radar viene incluido y hace el trabajo pesado. Para productos digitales conviene revisar sus reglas.

**Fiscal (fuera de Stripe, decisivo):** en México, una plataforma que cobra por cuenta de personas físicas puede tener que **retener ISR e IVA** a los creadores y emitirles comprobantes (régimen de plataformas tecnológicas). Esto cambia la fórmula del reparto. **Hay que revisarlo con tu contador antes de abrir el marketplace.**

**Legal:** hace falta un contrato o términos para creadores: licencia para vender, responsabilidad por el contenido, comisión, reembolsos y plazos de pago.

### L. Por qué encaja con Vorka México
- Vorka es la tienda: cobra, entrega, da soporte y aparece en el estado de cuenta. Por eso los creadores solo reciben transferencias.
- El reparto se calcula después del pago, así que la comisión de Stripe se descuenta exacta de la parte del creador, como decidiste.
- Transferir después del plazo de reembolso reduce las recuperaciones y encaja con tu política actual.
- La aprobación de creadores y de productos protege la marca y la calidad de la tienda.

### M. Preguntas abiertas
- ¿Qué dice tu contador sobre retenciones y facturación con creadores personas físicas?
- ¿Cuántos días después de la venta se transfiere? Propuesta: 7 días naturales, que cubren los 5 días hábiles de reembolso.
- ¿Habrá carrito con productos de varios creadores en una misma compra, o una compra por producto como hoy?
