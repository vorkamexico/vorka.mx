# Vorka México

Sitio web oficial de **Vorka México** — consultora de estrategia, liderazgo e influencia.

## Estructura

```
vorka web/
├── index.html                              — Página principal
├── LOGO.png                                — Logo institucional
├── vorka-shared.css                        — Sistema de diseño (subpáginas)
├── vorka-service.js                        — Manejo de formularios y WhatsApp
└── servicios/
    ├── estrategia-y-direccion.html
    ├── liderazgo-y-talento.html
    └── comunicacion-e-influencia.html
```

## Cómo abrirla localmente

Doble clic en `index.html` — funciona directo con `file://`, sin necesidad de servidor.

## Deploy

Sitio 100 % estático. Compatible con cualquier hosting:

- **GitHub Pages** — sube esta carpeta al repositorio y activa Pages desde Settings
- **Netlify** — arrastra la carpeta a app.netlify.com/drop
- **Vercel** — importa el repositorio, sin configuración
- **cPanel / hosting compartido** — sube el contenido vía FTP

## Formularios

Los formularios (contacto principal, subpáginas de servicios, y boletín Sparks) usan **Formsubmit** para enviar directo a `vorkamexico@gmail.com` sin backend.

En el primer envío desde el dominio de producción, llegará un correo de activación de Formsubmit al buzón. Hay que confirmarlo una sola vez. Después todos los mensajes fluyen sin fricción.

Cada formulario incluye el nombre del servicio en el subject del correo, así se identifica rápido de dónde viene el lead.

## Contacto directo

- Correo: vorkamexico@gmail.com
- WhatsApp: +52 81 1780 4869
- Instagram: [@vorka.mx](https://www.instagram.com/vorka.mx/)

---

© 2026 Vorka México. Todos los derechos reservados.
