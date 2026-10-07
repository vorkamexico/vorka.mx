# IMPACTO — Movimientos de la estructura: guía de instalación

Altas, bajas, cambios de presidente y correcciones, sin WhatsApp y sin capturar a mano.

```
Presidencia estatal entra al panel (enlace personal por correo, sin contraseña)
        ↓  llena Alta / Baja / Cambio / Corrección (solo de su estado)
Hoja SOLICITUDES (pendiente)  →  correo a Dirección Nacional con Aprobar / Rechazar
        ↓  al aprobar
LISTA COMPLETA se actualiza  +  HISTORICO guarda a quien sale  +  BITACORA registra todo
        ↓  correos: bienvenida con nombramiento PDF · agradecimiento a quien sale · aviso a quien lo pidió
GitHub Action → reescribe www.vorka.mx/impacto/estructura con la lista y las fotos nuevas
```

**Fuente única:** la hoja `LISTA COMPLETA` del Sheet *Representaciones de Impacto*. El directorio público se genera desde ahí; ya no se edita a mano.

**Qué agrega al Sheet** (no borra ni mueve nada):
- En `LISTA COMPLETA`, columnas nuevas a la derecha: `ID`, `Estatus`, `Escuela`, `Foto`, `Fecha de alta`, `Última actualización`. A cada persona actual le asigna un ID (`IMP-0001`…).
- Hojas nuevas: `SOLICITUDES`, `HISTORICO`, `BITACORA`.
- Las bajas **no se borran**: quedan con `Estatus = baja` (texto gris) y copiadas en `HISTORICO`. El directorio ya no las muestra. Si confirmas que ninguna otra hoja depende de la posición de las filas, puedes borrarlas con la función `limpiarBajas`.
- Los cambios de presidente reemplazan a la persona **en el mismo renglón** (el renglón es el cargo), así que ninguna fórmula se mueve.

No toca `ASISTENCIA`, `INDUCCIONES`, `Sheet5` ni el script que ya tenga el Sheet.

---

## Antes de empezar (5 min)

1. En `LISTA COMPLETA`, revisa que **cada presidencia estatal tenga su correo**. Sin correo no pueden entrar.
2. Compara contra el directorio actual. Hoy hay dos diferencias; decide cuál está bien antes del paso 4:
   - **Dana Valeria Ochoa Almarza** (secretaría estatal, Guanajuato) está en el directorio pero no en `LISTA COMPLETA`. Si sigue, agrégala al Sheet; si no, el directorio la quitará.
   - **Emmanuel Armando Martínez Gálvez** (presidente municipal, La Paz, BCS) está en el Sheet pero no en el directorio. Aparecerá.

## Paso 1. Crear el script (5 min)

1. Entra a https://script.google.com → **Nuevo proyecto**. Nómbralo *IMPACTO — Movimientos*.
   Usa la misma cuenta dueña del Sheet (oleynickhdz@gmail.com).
2. Pega el contenido de `_impacto/google-apps-script/Code.gs` en `Código.gs`.
3. Agrega dos archivos HTML (**+ → HTML**) llamados exactamente `Panel` y `Resolver`, y pega `Panel.html` y `Resolver.html`.
4. ⚙️ **Configuración del proyecto** → marca *Mostrar el archivo de manifiesto "appsscript.json"* → pega `appsscript.json` (zona horaria de México).
5. En el selector de funciones elige **`configurar`** → **Ejecutar**. Acepta los permisos (si dice "Google no verificó esta app": *Configuración avanzada → Ir a…*).
6. En el **Registro de ejecución** copia el **TOKEN**.

## Paso 2. Quién aprueba y quién entra (2 min)

⚙️ **Configuración del proyecto → Propiedades del script**:

| Propiedad | Para qué | Valor inicial |
|---|---|---|
| `ADMINS` | Correos de Dirección Nacional que aprueban y pueden mover cualquier estado (separados por coma) | tu correo |
| `ROLES_ACCESO` | Quién entra al panel | `presidente estatal` |
| `PANEL_URL` | *(Opcional)* página propia que incrusta el panel, p. ej. en voluntariosimpacto.vorka.mx | vacío |
| `GH_TOKEN` | *(Opcional)* para que el directorio se actualice al momento de aprobar | vacío |
| `GH_REPO` | Repositorio del sitio | `vorkamexico/vorka.mx` |

Para abrir el panel también a vicepresidencias estatales: `ROLES_ACCESO = presidente estatal, vicepresidente estatal`.

## Paso 3. Publicar el panel (3 min)

1. **Implementar → Nueva implementación → Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**. Nadie ve datos sin su enlace personal; la API para GitHub pide el TOKEN y solo entrega nombre, cargo, lugar y foto (nunca correos ni teléfonos).
2. Copia la **URL de la aplicación web** (termina en `/exec`). Ese es el panel.

> Si cambias el código: **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva**. La URL no cambia.

## Paso 4. Conectar GitHub (3 min)

En https://github.com/vorkamexico/vorka.mx/settings/secrets/actions → **New repository secret**:
- `IMPACTO_API_URL` → la URL `/exec` del paso 3.
- `IMPACTO_TOKEN` → el TOKEN del paso 1.

Luego en **Actions → IMPACTO — actualizar directorio → Run workflow**. Revisa el registro: lista a quién agrega (➕) y a quién quita (➖). Si quitaría a más del 20 % de la gente, se detiene sin publicar.

Desde ahí corre solo cada 3 horas. Para que sea inmediato al aprobar, crea un token en https://github.com/settings/personal-access-tokens (solo este repositorio, permiso *Contents: Read and write*) y ponlo como `GH_TOKEN` en el script (puede ser el mismo que usas para Sparks).

## Paso 5. Ponerlo en voluntariosimpacto.vorka.mx

Opción rápida: un botón **"Movimientos de la estructura"** que abra la URL `/exec`.

Opción integrada: una página que lo incruste y le pase el enlace personal:

```html
<iframe id="mov" style="width:100%;height:100vh;border:0"></iframe>
<script>
  var t = new URLSearchParams(location.search).get('t');
  document.getElementById('mov').src = 'URL_EXEC' + (t ? '?t=' + encodeURIComponent(t) : '');
</script>
```

Si la usas, pon la dirección de esa página en `PANEL_URL` para que los enlaces de acceso lleguen ahí.

## Prueba completa (10 min)

1. Abre el panel, escribe tu correo de presidencia estatal de prueba → llega el enlace.
2. Haz un alta con tu propio correo alterno como la persona nueva.
3. En el correo de Dirección Nacional da **Aprobar** → en la página que se abre, **Aprobar** otra vez (el doble clic evita que el antivirus del correo apruebe solo).
4. Revisa: fila nueva en `LISTA COMPLETA` con ID, bienvenida con PDF en el correo alterno, aviso al solicitante.
5. Da de baja a esa persona de prueba y aprueba. Corre el Action: ya no aparece en el directorio.

## Reglas que aplica solo

- Una presidencia estatal solo ve y mueve a gente de su estado, y no puede moverse a sí misma.
- No deja dar de alta una presidencia que ya está ocupada: pide usar *Cambio de persona*.
- No deja repetir un correo que ya tiene otra persona activa.
- Alta y cambio exigen confirmar el aviso de privacidad y el permiso para aparecer en el directorio.
- Cada solicitud tiene folio `MOV-2026-0001`; nada se aplica dos veces.
- Las fotos se guardan en la carpeta privada *IMPACTO — Fotos de la estructura*; GitHub baja solo una copia de 400×400 para el directorio.
