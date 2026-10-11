# Imágenes de vorka.mx

## Sistema
- Formato WebP en tres anchos: `-960`, `-1600`, `-2400` (`srcset` + `sizes`).
- Contenedor `.foto` con `<img>` a pantalla completa (`object-fit:cover`).
- Encuadre por variables en el contenedor:
  - `--foco: 50% 70%` → punto focal en escritorio
  - `--foco-m: 80% 60%` → punto focal en celular (≤760px)
- Siempre con `alt` descriptivo (o `alt=""` si es decorativa) y crédito si no es foto propia.
- Comprimir antes de subir (calidad ~78). Nada de más de ~400 KB en la versión 1600.

## Fotos actuales (`img/ciudades/`, temporales de Unsplash, licencia libre)
| Archivo | Uso | Autor |
|---|---|---|
| monterrey-* | Portada (hero) | Jorge Orozco |
| cdmx-* | Mosaico "Dónde trabajamos" y 404 | Diwei Zhu |
| guadalajara-* | Mosaico | Roman Lopez |
| queretaro-* | Mosaico | Daniel Uribarren |
| celaya-* | Mosaico | Martin Arriola |

## Para reemplazarlas por fotos propias
Pon el mismo nombre de archivo en los tres anchos y quita el crédito (`.foto-credito`) del HTML.
