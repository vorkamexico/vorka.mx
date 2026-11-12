# Librerías de las herramientas gratis de Vorka Learn

Se sirven desde vorka.mx (la CSP de Learn solo permite scripts propios). No editar a mano.

- `pdf-lib.min.js`: pdf-lib 1.17.1 (MIT), build ESM. Arma y divide PDF.
- `pdf.min.js`, `pdf.worker.min.js`, `standard_fonts/`, `cmaps/`: pdf.js (pdfjs-dist 4.10.38, build legacy, Apache-2.0). Dibuja las páginas.
- `qrcode.js`: qrcode-generator 1.4.4 (MIT), la misma copia de `_tienda/src/vendor/qrcode.js`.

Para actualizar: `npm pack <paquete>@<versión>`, copiar los mismos archivos y subir `V_HERRAMIENTAS` en `_tienda/src/learn/herramientas.js`.
