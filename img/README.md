# Imágenes de vorka.mx

## Sistema
- WebP en tres anchos: `-960`, `-1600`, `-2400` (`srcset` + `sizes`). Las páginas principales se generan con `python3 _sitio/build.py`; las fotos se declaran en `_sitio/partes.py` (`FOTOS`). Estilos: `assets/v3/vorka.css` y `vorka.js`.
- Contenedor `.foto` con `<img>` a pantalla completa (`object-fit: cover`). Encuadre con variables:
  - `--foco: 50% 70%` → punto focal en escritorio
  - `--foco-m: 80% 60%` → punto focal en celular (≤760px)
- Siempre con `alt` descriptivo. Comprimir antes de subir (calidad ~70; la versión 1600 idealmente < 400 KB).

## Fotos actuales (temporales, Unsplash, licencia libre; el sitio no muestra créditos)
| Archivo | Autor | Unsplash |
|---|---|---|
| cdmx-reforma | Leonardo Gaspar | DegQnHS1tk0 |
| cdmx-chapultepec | paws and prints | Tajg_JeZ_6o |
| cdmx-noche | Humberto Arellano | TJYqbIAYs-E |
| cdmx | Diwei Zhu | nEj6sIzBht4 |
| monterrey-silla | Jorge Gardner | 6YkqE50Gin0 |
| monterrey-skyline | Jesus Herrera | NNALse8o_uY |
| monterrey-torres | Jesus Herrera | I_iNbhznH3M |
| monterrey | Jorge Orozco | ffy8GyD73q4 |
| guadalajara | Roman Lopez | cGOkS_UvttU |
| queretaro | Daniel Uribarren | CSYOVRSJ1mY |
| celaya | Martin Arriola | pBiFYYVmXWE |
| sala-consejo | Benjamin Child | GWe0dlVD9e0 |

## Para reemplazarlas por fotos propias
Guarda la foto con el mismo nombre en los tres anchos (o agrega una nueva en `FOTOS`) y vuelve a correr el generador.

## Vorka FC (`img/fc/`, blanco y negro)
| Archivo | Autor | Licencia |
|---|---|---|
| madero, carmen, bola-agua | Juan Carlos Fonseca Mata (Wikimedia Commons) | CC BY-SA 4.0: el crédito va al pie de `/fc/` |
| balon | Peter Glaser (Unsplash, vía Wikimedia Commons) | CC0 |
| lobo.png | Logo de Vorka FC (silueta blanca, se usa como máscara CSS) | Propio |
