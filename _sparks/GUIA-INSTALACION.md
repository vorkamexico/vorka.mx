# Sparks Celaya: guía de instalación (se hace una sola vez)

Así funciona:

```
Tu equipo llena el Google Form
        ↓
Google Sheet (privado)  ←  aquí corriges o despublicas
        ↓  cada hora, o al momento con "Publicar ahora"
GitHub Action → genera www.vorka.mx/sparks/celaya → Cloudflare lo publica
                → sube las fotos a Cloudflare R2 (fotos.vorka.mx)
```

El Sheet y las fotos de Drive **siguen siendo privados**. Solo el periódico es público.

- **Repositorio:** `vorkamexico/vorka.mx`. Los archivos ya están ahí.
- **Fotos:** van a Cloudflare R2, no al repositorio, para que el repo no crezca con cada noticia. R2 es gratis hasta 10 GB y no cobra por visitas. Mientras R2 no esté conectado, las fotos se guardan en el repo. Cuando lo conectes, el bot las mueve solo a R2.

---

## Paso 1. Crear el Sheet, el Form y el script (10 min)

1. Crea un Google Sheet nuevo llamado **Sparks Celaya — Noticias**.
2. Ve a **Extensiones → Apps Script**.
3. Borra lo que aparece y pega todo el contenido de `_sparks/google-apps-script/Code.gs`. Guarda con el disquete.
4. Arriba, en el selector de funciones, elige **`configurar`** y dale **Ejecutar**.
   - Google te pedirá permisos. Acepta con la cuenta de Vorka. Si sale "Google no verificó esta app", da clic en *Configuración avanzada → Ir a…*.
5. Abre **Registro de ejecución**. Ahí aparecen 3 cosas:
   - El link del **Form para tu equipo**.
   - El link para **editar el Form**.
   - El **TOKEN**. Cópialo, lo usarás en el paso 3.

## Paso 2. Agregar la pregunta de fotos al Form (2 min)

Google no deja crear la pregunta de "subir archivo" por código, así que se agrega a mano:

1. Abre el link de **editar el Form**.
2. Agrega una pregunta → tipo **Subir archivo**.
   - Título: **Fotos** (la primera foto será la portada).
   - Solo tipos: **Imagen**.
   - Número máximo de archivos: **10**.
   - Tamaño máximo: **10 MB**.
3. Muévela debajo de "Texto completo" (opcional, es solo el orden).

> Para subir archivos, quien llena el Form necesita entrar con su cuenta de Google.

## Paso 3. Publicar el script como API (3 min)

1. En Apps Script: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**. Sin el TOKEN nadie puede leer nada, y solo entrega las noticias publicadas.
3. **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).

> Si después cambias el código del script: **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva**. Así la URL no cambia.

## Paso 4. Conectar GitHub (3 min)

1. En https://github.com/vorkamexico/vorka.mx/settings/secrets/actions → **New repository secret**, crea dos:
   - `SPARKS_API_URL` → la URL `/exec` del paso 3.
   - `SPARKS_TOKEN` → el TOKEN del paso 1.
2. Ve a **Actions → "Sparks Celaya — publicar noticias" → Run workflow** para la primera publicación.

Cloudflare detecta el commit y publica solo. Revisa **www.vorka.mx/sparks/celaya**.

## Paso 5. Fotos en Cloudflare R2 (10 min)

1. **Cloudflare → R2 Object Storage → activar R2.** Pide una tarjeta, pero los primeros 10 GB son gratis y el tráfico no se cobra.
2. **Create bucket** → nombre: `sparks-fotos`.
3. Dentro del bucket: **Settings → Custom Domains → Connect Domain** → `fotos.vorka.mx`. Cloudflare crea el DNS solo.
4. **R2 → Manage API tokens → Create API token**:
   - Permisos: **Object Read & Write**.
   - Bucket: solo **sparks-fotos**.
   - Copia el **Access Key ID**, el **Secret Access Key** y el **Account ID**. El Account ID son 32 letras y números; está en *R2 → Account Details*.
5. En los secrets de GitHub (mismo lugar que en el paso 4) crea tres más:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
6. Corre **Run workflow** otra vez. Las fotos se suben a `fotos.vorka.mx/celaya/…`.

Si quieres otro nombre de bucket o de dominio, cámbialo en `_sparks/config.json` → `fotos`.

## Paso 6 (recomendado). Botón "Publicar ahora" (5 min)

Sin esto, las noticias salen solas **cada hora de 7 am a 11 pm**. Con esto, salen **2–3 minutos** después de enviar el Form, y en el Sheet aparece el menú **📰 Sparks → Publicar ahora**.

1. En GitHub: tu foto → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Repository access: **Only select repositories** → el repo de la web.
   - Permissions → Repository → **Contents: Read and write**.
   - Expiración: la más larga posible. Anota en el calendario cuándo renovarlo.
2. En Apps Script: ⚙️ **Configuración del proyecto → Propiedades de la secuencia de comandos → Agregar**:
   - `GH_TOKEN` → el token que acabas de crear.
   - `GH_REPO` → `vorkamexico/vorka.mx`

## Paso 7. Que Google lo encuentre (5 min, una vez)

1. Entra a **Google Search Console** con la propiedad `vorka.mx`, o créala.
2. **Sitemaps** → agrega `https://www.vorka.mx/sparks/celaya/sitemap.xml`.
3. En Cloudflare: **Pages → tu proyecto → Metrics → Web Analytics → Enable**. Es gratis y así sabes cuántas visitas tienes.

---

## Monetizar con Google AdSense

1. Solicita AdSense con `vorka.mx`. Conviene tener primero unas **20–30 noticias** publicadas y una página de privacidad.
2. Cuando te aprueben, edita `_sparks/config.json`:
   ```json
   "adsense": {
     "cliente": "ca-pub-1234567890123456",
     "slotFeed": "1111111111",
     "slotArticulo": "2222222222"
   }
   ```
   - Con solo `cliente`, se activan los **anuncios automáticos** de Google.
   - Con los `slot`, además salen anuncios fijos: uno en la portada y otro dentro de cada noticia, después del 2º párrafo.
3. Haz commit. El sitio se regenera solo y crea `ads.txt`.

---

## Qué pasa con las noticias

| Quiero… | Hago… |
|---|---|
| Publicar | Llenar el Form. |
| Corregir un error | Editar la celda en el Sheet → 📰 Sparks → Publicar ahora. |
| Ocultar una noticia | Escribir **NO** en la columna *Publicar*. |
| Ponerla de portada | Escribir **Sí** en *¿Destacar como noticia principal?* Gana la destacada más reciente. |
| Cambiar el link | No lo hagas después de compartirla: la columna *Slug* es su dirección web. |
| Agregar categorías | Editar las opciones de "Categoría" en el Form. Salen solas como filtros. |

## Archivos

```
_sparks/
├── build.py                    ← generador (Python + Pillow)
├── config.json                 ← nombre, textos, R2, AdSense
├── assets/                     ← CSS, JS, logo, imagen para compartir
└── google-apps-script/Code.gs  ← va pegado en el Sheet
.github/workflows/sparks-celaya.yml
sparks/celaya/                  ← lo genera el bot. NO editar a mano.
```

Para cambiar el diseño, edita `_sparks/assets/sparks.css` o `build.py`. Al hacer commit se regenera todo.

## Si algo falla

- **GitHub → Actions** muestra el error en rojo. Los más comunes:
  - `Apps Script respondió: no autorizado` → el `SPARKS_TOKEN` no coincide. Ejecuta `verToken` en Apps Script.
  - `Faltan SPARKS_API_URL...` → faltan los secrets del paso 4.
- **Una foto no aparece**: revisa que sea imagen (no PDF). El bot la salta y sigue publicando lo demás.
- **Las fotos no cargan después de activar R2**: revisa que `fotos.vorka.mx` esté conectado como Custom Domain del bucket (paso 5.3) y que diga *Active*.
