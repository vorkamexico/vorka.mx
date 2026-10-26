# Vorka México · vorka.mx

Sitio oficial de **Vorka México**: consultora de estrategia, liderazgo e influencia. Sitio estático en **Cloudflare Pages**: cada commit a `main` se publica solo.

## Estructura

Cada URL es una carpeta con `index.html` (`/servicios/estrategia/` → `servicios/estrategia/index.html`).

### Páginas públicas (indexadas, en `sitemap.xml`)

| Carpeta | URL | Cómo se edita |
|---|---|---|
| `index.html`, `servicios/`, `agenda/`, `fc/`, `404.html` | `/`, `/servicios/…`, `/agenda/`, `/fc/` | **Generadas**: edita `_sitio/` y corre `python3 _sitio/build.py` |
| `voluntariado/`, `sparks/`, `sparks/sumate/`, `privacidad/`, `legal/` | | A mano |
| `sparks/celaya/` | `/sparks/celaya/` | **Automática** (bot cada hora). No editar a mano: ver `_sparks/GUIA-INSTALACION.md` |
| `oleynickhdz/`, `mentoriaoleynick/` | Sitio de Brandon Oleynick | A mano |
| `anaoleynick/` | Sitio de Ana Laura Hernández: inicio, `talleres/`, `portafolio/`, `trayectoria/` y `estilo.css` compartido. Sin marca Vorka, sólo "Powered by vorka.mx" al pie | A mano |
| `heymaya/`, `aviso/` | | A mano |

### Documentos de clientes y material interno (se abren con la URL, Google no los indexa)

`propuesta/`, `diagnostico/`, `1ertrimestrecelaya/`, `2dotrimestrecelaya/`, `consultor/`, `acuerdosaltamesa/`, `manual/`, `clubers/`, `imagen/`, `vorkacortazar/`, `eugetuagente/`, `fundamentos/`

Llevan `<meta name="robots" content="noindex">` y además la cabecera `X-Robots-Tag: noindex` (en `_headers`). **Si agregas una carpeta de este tipo, agrégala también en `_headers`**, y no la pongas en `sitemap.xml`.

### Código y herramientas (no se publican)

| Carpeta | Qué es |
|---|---|
| `_sitio/` | Generador de las páginas principales (Python) |
| `_sparks/` | Generador de Sparks Celaya + guía |
| `_impacto/` | Generador del directorio de IMPACTO (se ve en soyimpacto.org/directorio) |
| `_tienda/` | Worker de la tienda (`/tienda`, `/api`, `/descargas`, `/creadores`, ficha de Brindi en `/tienda/brindi/`): ver `_tienda/README-TIENDA.md` |
| `.github/workflows/` | Bots de Sparks e IMPACTO |

`_redirects` manda estas carpetas al inicio para que no se vean desde internet.

### Recursos compartidos

- `assets/v3/`: `vorka.css` y `vorka.js` (la misma tipografía y paleta que os.vorka.mx)
- `img/ciudades/`: fotos WebP en 960 / 1600 / 2400 (ver `img/README.md`)
- `img/fc/`: fotos de Celaya en blanco y negro y el lobo de Vorka FC (créditos al pie de `/fc/`)
- `assets/v3/fc.css`: estilos propios de Vorka FC (azul de Vorka Run, naranja, Anton)
- `vorka-logo.png`

## Archivos de Cloudflare

- `_redirects`: redirecciones (IMPACTO → soyimpacto.org, URLs viejas, carpetas internas)
- `_headers`: cabeceras de seguridad y `noindex` de documentos privados
- `robots.txt`, `sitemap.xml`

## Conexiones

- Agenda, voluntariado, boletín e inscripciones de Vorka FC (`/fc/`): van a **os.vorka.mx** (`/api/publico/…`)
- Formularios de `oleynickhdz/` y `heymaya/`: Formsubmit → vorkamexico@gmail.com
- Fotos de Sparks: `fotos.vorka.mx` (Cloudflare R2)

## Preview local

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` (los enlaces son absolutos, con doble clic en el archivo no navegan).

## Contacto

vorkamexico@gmail.com · WhatsApp +52 81 1780 4869 · [@vorka.mx](https://www.instagram.com/vorka.mx/)
