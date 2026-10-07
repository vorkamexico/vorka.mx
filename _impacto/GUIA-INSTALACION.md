# IMPACTO — Directorio Nacional automático

`www.vorka.mx/impacto/estructura` se genera desde la hoja `LISTA COMPLETA` del Sheet *Representaciones de Impacto*. Ya no se edita a mano.

```
Movimiento aprobado en voluntariosimpacto.vorka.mx (pestaña Movimientos)
        ↓  Apps Script "IMPACTO — Estructura y movimientos" lo escribe en LISTA COMPLETA
        ↓  (al momento si tiene GH_TOKEN; si no, cada 3 horas)
GitHub Action → _impacto/build_directorio.py → reescribe la lista de impacto/estructura/index.html y baja fotos nuevas
```

Las altas, bajas y cambios viven en el repo `vorkamexico/sandbox` (Base de Voluntarios): ver `MOVIMIENTOS.md` y `scripts/estructura-movimientos.gs`.

## Conectar (5 min, después de instalar el Apps Script)

1. En el Apps Script: **Implementar → Nueva implementación → Aplicación web** (ejecutar como Yo, acceso Cualquier persona). Copia la URL `/exec`.
2. En https://github.com/vorkamexico/vorka.mx/settings/secrets/actions crea:
   - `IMPACTO_API_URL` → la URL `/exec`.
   - `IMPACTO_TOKEN` → la llave del directorio (función `verLlaveDirectorio` del script).
3. **Actions → IMPACTO — actualizar directorio → Run workflow**. El registro lista a quién agrega (➕) y quita (➖).

## Qué cuida

- Solo cambia el bloque `const DATA = [...]` de la página; el diseño queda igual.
- Si la lista nueva trae menos del 80 % de las personas publicadas, no publica (hoja vacía o filtrada). Para una limpieza grande a propósito: variable `IMPACTO_FORZAR=1`.
- La API solo entrega nombre, cargo, lugar y foto; nunca correos ni teléfonos.
- Las fotos se guardan como `impacto/estructura/fotos/<nombre>.webp` (400×400) y solo se bajan cuando cambian.

## Antes de activarlo

Hoy hay dos diferencias entre el Sheet y el directorio publicado:
- **Dana Valeria Ochoa Almarza** (secretaría estatal, Guanajuato) está en el directorio pero no en LISTA COMPLETA: si sigue, agrégala al Sheet.
- **Emmanuel Armando Martínez Gálvez** (presidente municipal, La Paz, BCS) está en el Sheet pero no en el directorio: aparecerá.
