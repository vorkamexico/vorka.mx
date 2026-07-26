# Vorka México

Sitio web oficial de **Vorka México** — consultora de estrategia, liderazgo e influencia.

## Estructura

```
vorka web/
├── index.html                                → https://www.vorka.mx/
└── servicios/
    ├── estrategia/
    │   └── index.html                        → https://www.vorka.mx/servicios/estrategia
    ├── liderazgo/
    │   └── index.html                        → https://www.vorka.mx/servicios/liderazgo
    └── influencia/
        └── index.html                        → https://www.vorka.mx/servicios/influencia
```

Cada URL es una **carpeta con `index.html` adentro** — así el servidor sirve automáticamente la URL sin `.html` (`/servicios/estrategia` en vez de `/servicios/estrategia.html`).

Este patrón funciona en **cualquier hosting** sin necesidad de reglas de reescritura: Cloudflare Pages, Netlify, Vercel, GitHub Pages, cPanel, Apache, nginx — todos sirven `index.html` de una carpeta automáticamente.

## Optimización

- **Logo en base64** dentro del CSS de cada página, guardado **una sola vez por archivo** como `--logo` (variable CSS) y referenciado desde topbar y footer. Sin duplicación.
- **Sin peticiones HTTP externas**: ni fuentes web, ni CDNs, ni imágenes externas. Cada página carga completa en una sola petición.
- **Sin frameworks**: HTML + CSS + JS vanilla.
- Tamaño promedio: ~165 KB por página. Total del sitio: 680 KB.

## Enlaces internos

Todos los enlaces usan **rutas absolutas desde la raíz** (`/`, `/servicios/estrategia`, etc.), no relativas. Esto garantiza que funcionen desde cualquier profundidad sin `../` propensos a romperse.

## Deploy

Sitio 100% estático. Sube toda la carpeta a cualquier hosting:

- **Cloudflare Pages / Netlify / Vercel** — arrastra la carpeta o conecta el repositorio. Sin configuración.
- **GitHub Pages** — activa Pages en Settings → Pages → Source `main` / (root).
- **cPanel / FTP** — sube el contenido directamente al `public_html`.

### Preview local

Los enlaces internos usan rutas absolutas (`/servicios/estrategia`), por eso **abrir `index.html` con doble clic (`file://`) no funciona para navegar** — los links quedan rotos localmente.

Para previsualizar bien, corre un servidor local:

```bash
cd "vorka web"
python3 -m http.server 8000
```

Y abre `http://localhost:8000` en el navegador.

## Formularios

Los 4 formularios (contacto principal + 3 subpáginas + boletín Sparks) usan **Formsubmit** para enviar directo a `vorkamexico@gmail.com` sin backend.

**Primer envío desde producción:** llegará un correo de activación de Formsubmit. Confírmalo una sola vez y después todos los mensajes fluyen sin fricción.

Subject de cada correo identifica de qué formulario vino:

| Formulario | Subject |
|---|---|
| Contacto principal | `Nueva solicitud — {nombre} ({organización})` |
| Estrategia | `Solicitud [Estrategia y Dirección] — {nombre} ({organización})` |
| Liderazgo | `Solicitud [Liderazgo y Talento] — {nombre} ({organización})` |
| Influencia | `Solicitud [Comunicación e Influencia] — {nombre} ({organización})` |
| Boletín Sparks | `Sparks — nueva suscripción: {nombre}` |

## WhatsApp

Botón "Contrátanos directo por WhatsApp" abre `wa.me/528117804869` con mensaje pre-cargado personalizado según la página (en las subpáginas menciona el servicio específico).

## Contacto

- Correo: vorkamexico@gmail.com
- WhatsApp: +52 81 1780 4869
- Instagram: [@vorka.mx](https://www.instagram.com/vorka.mx/)

---

© 2026 Vorka México. Todos los derechos reservados.
