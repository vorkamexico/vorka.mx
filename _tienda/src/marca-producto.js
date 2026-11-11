// Marca de producto (la misma de las portadas v4, _tienda/simulador/portadas_v4.py): «V Producto by Vorka México», un titular
// en tinta con una sola frase en el color del producto, una línea de apoyo, los botones de la página y tres datos; a un lado,
// los mismos objetos de su portada (assets/tienda/v3/<clave>-objeto.webp). Así la portada y la página se ven iguales.
// Sigue el tema de la página (claro u oscuro): el blanco y la tinta son las variables de la tienda; el color es del producto.
import { esc } from './paginas.js';

const V = '<svg viewBox="69 225 940 909" fill="currentColor" aria-hidden="true"><path d="M69 226H311L652 877L526 1133Z"/><path d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg>';

// clave → [color, nombre, titular («[frase]» va en color), apoyo, datos (**negritas**)] · los mismos textos que las portadas
export const MARCAS = {
  'simulador-paa': ['#1E5BB8', 'Simulador PAA', 'Practica como el día del examen y [sube tu puntaje.]', ['**642** reactivos', '**Tutor** con pistas', 'Puntaje **200–800**']],
  'simulador-unam': ['#9A6B00', 'Simulador UNAM', 'Practica [con el peso de tu área.]', ['**476** reactivos', '**4** áreas', '**120** reactivos en 3 h']],
  'simulador-ecoems': ['#D9480F', 'Simulador ECOEMS', 'Llega a la prepa UNAM o al IPN [bien preparado.]', ['**320** reactivos', '**10** materias', '**128** reactivos en 3 h']],
  'simulador-ipn': ['#7A1C42', 'Simulador IPN', 'Practica para el IPN [con el peso de tu área.]', ['**1,012** reactivos', '**3** áreas', '**140** reactivos en 3 h']],
  'simulador-exani-ii': ['#3F38B5', 'Simulador EXANI-II', 'Un solo simulador [para tu universidad.]', ['**800** reactivos', '**10** módulos', '**168** reactivos en 4.5 h']],
  'simulador-excoba': ['#0B7285', 'Simulador EXCOBA', 'Para la UAQ y la UG, [con las asignaturas de tu carrera.]', ['**750** preguntas', '**9** asignaturas', '**180** preguntas por examen']],
  'simulador-prepa-ug': ['#2B8A3E', 'Simulador prepa UG', 'Prepárate para el EXANI-I [de la prepa de la UG.]', ['**400** reactivos', '**5** áreas', '**160** reactivos en 4.5 h']],
  brindi: ['#8A2E4A', 'Brindi', 'Tu invitación digital, [lista en minutos.]', ['**6** diseños premium', 'Confirmaciones **al momento**', 'Pase con **QR**']],
  cupo: ['#6D28D9', 'Cupo', 'Tu evento, con registro [y entrada con QR.]', ['**Gratis** hasta 30 personas', 'Cover **sin comisión**', 'Check-in con **QR**']],
  agenda: ['#05785A', 'Agenda', 'Tus clientes reservan solos, [a cualquier hora.]', ['Confirmación **al instante**', 'Recordatorios **automáticos**', 'Prueba **7 días** gratis']],
  vuelve: ['#B42A44', 'Vuelve', 'Que tus clientes [vuelvan solos.]', ['**Sin** descargar app', 'Avisos **automáticos**', 'Prueba **7 días** gratis']],
  cuentas: ['#0E6F78', 'Cuentas', 'Lo que prestas, [claro y en orden.]', ['Intereses **claros**', '**PDF** y Excel', 'Prueba **7 días** gratis']],
  vende: ['#C2256F', 'Vende', 'Clientas, pedidos y cobros, [en orden.]', ['Ganancia **real**', '**WhatsApp** listo', '**Gratis** para empezar']],
  'ruta-de-impacto': ['#4338CA', 'Ruta de Impacto', 'Tu proyecto social, [de la idea a la comunidad.]', ['**6** niveles + final', '**Tutor** con pistas', 'Pago único · **1 año**']],
  'test-vocacional': ['#5B1F7A', 'Test vocacional', 'Descubre [qué carreras van contigo.]', ['**48** preguntas', 'Perfil básico **gratis**', '**20** carreras afines']],
  'que-proyecto-social': ['#A8501F', '¿Qué proyecto social hago?', 'Tu proyecto social, [a tu medida.]', ['**10** preguntas · 5 min', 'De **5 a 8** proyectos', 'Indicadores y **ODS**']],
  'evaluacion-liderazgo': ['#5B2A63', 'Evaluación de liderazgo', 'Lo que crees de ti, [contra lo que has hecho.]', ['**80** preguntas · 25 min', '**12** dimensiones', '**2** aplicaciones']],
  portales: ['#0F5A8A', 'Portal', 'Tus propiedades, [en tu propio portal.]', ['Tu **portal** propio', 'Fotos y **ficha** por inmueble', 'Interesados por **WhatsApp**']],
  clara: ['#1F5FD6', 'Clara', 'Tu dinero, claro. Anota todo [en segundos.]', ['**Efectivo**, débito y crédito', '**Sin** conectar tu banco', 'Desde **15** años']],
  'idea-en-orden': ['#1F7A44', 'Kit Idea en Orden', 'Ordena tu idea y [planea tus próximos 7 días.]', ['Workbook **PDF** · 32 págs.', '**Word** y Excel', '**6** herramientas']],
  'idea-negocio': ['#5B2A9E', 'Kit Idea → Negocio', 'Valida tu idea con [clientes reales.]', ['Workbook **PDF** · 32 págs.', '**2** Excel', 'Incluye **Nivel 1**']],
};
export const colorDe = k => MARCAS[k]?.[0] || '#141114';
const negritas = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const titularHtml = t => { const [a, r = ''] = t.split('['), [m, z = ''] = r.split(']'); return `${esc(a)}${m ? `<em>${esc(m)}</em>` : ''}${esc(z)}`; };

// La línea de marca, para usarla también fuera del hero (encabezados de compra, correos…)
export const lineaMarca = (k, { h = 'p' } = {}) => `<${h} class="pm-marca"><span class="pm-v">${V}</span><b>${esc(MARCAS[k]?.[1] || '')}</b><small>by Vorka México</small></${h}>`;

/**
 * heroMarca(k, { apoyo, botones, antes, despues, nav, titular, datos, h1 }) → <section> de arriba de la página
 * apoyo: texto (se escapa) · botones / antes / despues / nav: HTML que trae la página (sus ligas, avisos y pestañas)
 */
export function heroMarca(k, { apoyo = '', botones = '', antes = '', despues = '', nav = '', titular, datos, h1 = true } = {}) {
  const [color, , tit, ds] = MARCAS[k] || ['#141114', '', '', []];
  return `<section class="pm-hero" style="--pm:${color}"><div class="marco pm-g">
  <div class="pm-txt">${lineaMarca(k)}${antes}
    <${h1 ? 'h1' : 'h2'} class="pm-h1">${titularHtml(titular || tit)}</${h1 ? 'h1' : 'h2'}>
    ${apoyo ? `<p class="pm-lead">${esc(apoyo)}</p>` : ''}
    ${botones ? `<div class="pm-ctas">${botones}</div>` : ''}${despues}
    <ul class="pm-datos">${(datos || ds).map(d => `<li>${negritas(d)}</li>`).join('')}</ul>
  </div>
  <div class="pm-obj"><img src="/assets/tienda/v3/${esc(k)}-objeto.webp" alt="" width="672" height="1200" fetchpriority="high" decoding="async"></div>
</div>${nav}</section>`;
}

export const CSS_MARCA = `
.pm-hero{background:var(--bg);color:var(--fg);padding:28px 0 8px}
.pm-g{display:grid;gap:28px;align-items:center}.pm-g>*{min-width:0}
@media(min-width:960px){.pm-g{grid-template-columns:1.1fr .9fr;gap:56px;padding-top:20px;padding-bottom:34px}}
.pm-marca{display:flex;flex-wrap:wrap;align-items:baseline;gap:.1em .4em;margin:0;font:750 22px/1.2 var(--font,Inter,sans-serif);letter-spacing:-.02em;color:var(--fg)}
.pm-marca small{font-size:.66em;font-weight:600;color:var(--fg-2);letter-spacing:0;white-space:nowrap}
.pm-v{display:inline-block;width:1.05em;height:1em;vertical-align:-.12em;color:var(--fg)}.pm-v svg{width:100%;height:100%;display:block}
.pm-h1{font:800 clamp(38px,6.4vw,64px)/1.03 var(--font,Inter,sans-serif);letter-spacing:-.045em;margin:22px 0 0;color:var(--fg)}
.pm-h1 em{font-style:normal;color:var(--pm)}
:root[data-tema=oscuro] .pm-h1 em{color:color-mix(in srgb,var(--pm) 55%,#fff)}
@media(prefers-color-scheme:dark){:root:not([data-tema=claro]) .pm-h1 em{color:color-mix(in srgb,var(--pm) 55%,#fff)}}
.pm-lead{font-size:clamp(17px,2vw,19px);line-height:1.55;color:var(--fg-2);margin:18px 0 0;max-width:560px}
.pm-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.pm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--pm);color:#fff;font-weight:700;font-size:16px;text-decoration:none;border:0;cursor:pointer;box-shadow:0 12px 28px -14px var(--pm)}
.pm-btn svg{width:18px;height:18px}.pm-btn:hover{filter:brightness(1.06);transform:translateY(-1px)}
.pm-btn.sec{background:transparent;color:var(--fg);border:1.5px solid var(--line);box-shadow:none}
.pm-hero .t-ya{margin-top:14px}
.pm-datos{list-style:none;display:flex;flex-wrap:wrap;gap:8px 22px;padding:0;margin:26px 0 0;font-size:15px;color:var(--fg-2)}.pm-datos b{color:var(--fg);font-weight:750}
.pm-obj{border-radius:28px;overflow:hidden;background:#F1F0F2;max-width:520px;width:100%;justify-self:center}
/* oscuro: se atenúa la caja entera (fondo e imagen juntos) para que no queden franjas a los lados */
:root[data-tema=oscuro] .pm-obj{filter:brightness(.88)}@media(prefers-color-scheme:dark){:root:not([data-tema=claro]) .pm-obj{filter:brightness(.88)}}
.pm-obj img{display:block;width:100%;height:auto;aspect-ratio:672/1000;object-fit:contain;object-position:center}
@media(max-width:959px){.pm-obj{max-width:400px}}
.pm-hero .t-nav-tienda{margin-top:18px}
/* Legibilidad en todas las páginas de producto: títulos con espacio entre palabras (no «Menosllamadas»), renglones
   parejos y nada de cortes; los campos de compra nunca se salen de la pantalla en celulares chicos */
:is(h1,h2,h3):not(.sr),.pm-h1,.pm-h2{letter-spacing:-.02em!important;word-spacing:.04em;text-wrap:balance;overflow-wrap:break-word}
:is(h1,h2,h3) :is(em,span,b,strong,i){letter-spacing:inherit!important}
p,li,figcaption{text-wrap:pretty}
.t-campo{min-width:0}.t-campo :is(select,input,textarea){max-width:100%;min-width:0;box-sizing:border-box}
`;

// «Qué es» (en palabras simples) y «Para quién es» (el problema de cada quien, en su idioma: así también lo encuentra Google)
export function seccionQueEs(k, { titulo, texto, para = [], id = 'que-es' }) {
  return `<section class="pm-sec pm-que" id="${id}" style="--pm:${colorDe(k)}"><div class="marco pm-que-g">
  <div><p class="pm-et">Qué es</p><h2 class="pm-h2">${esc(titulo)}</h2><p class="pm-grande">${texto}</p></div>
  ${para.length ? `<div><p class="pm-et gris">Para quién es</p><ul class="pm-para">${para.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul></div>` : ''}
</div></section>`;
}
// Índice fijo bajo el encabezado: brinca a cada parte de la página y deja el botón principal siempre a la mano
export function indiceProducto(k, partes, boton) {
  return `<nav class="pm-indice" aria-label="Partes de la página" style="--pm:${colorDe(k)}"><div class="marco">${partes.map(([id, t]) => `<a href="#${esc(id)}">${esc(t)}</a>`).join('')}${boton ? `<span class="pm-indice-btn">${boton}</span>` : ''}</div></nav>`;
}
export const CSS_SECCIONES = `
.pm-indice{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.pm-indice .marco{display:flex;align-items:center;gap:24px;min-height:54px;overflow-x:auto;scrollbar-width:none}.pm-indice .marco::-webkit-scrollbar{display:none}
.pm-indice a{flex:none;font-size:14.5px;font-weight:600;color:var(--fg-2);text-decoration:none;padding:16px 0}.pm-indice a:hover{color:var(--fg)}
.pm-indice-btn{margin-left:auto;flex:none}.pm-indice .pm-btn,.pm-hero .pm-btn:not(.sec){color:#fff!important}.pm-indice-btn .pm-btn{min-height:40px;padding:0 18px;font-size:14.5px}
@media(max-width:720px){.pm-indice-btn{display:none}}
.pm-sec{padding:76px 0 0;scroll-margin-top:64px}
.pm-et{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--pm);margin:0}.pm-et.gris{color:var(--fg-2)}
.pm-h2{font:800 clamp(28px,4vw,42px)/1.1 var(--font,Inter,sans-serif);letter-spacing:-.035em;margin:10px 0 0;color:var(--fg)}
.pm-que-g{display:grid;gap:36px}@media(min-width:900px){.pm-que-g{grid-template-columns:1.1fr .9fr;gap:60px;align-items:start}}
.pm-grande{font-size:clamp(18px,2.2vw,21px);line-height:1.55;margin:18px 0 0;color:var(--fg)}.pm-grande b{color:var(--pm)}
.pm-para{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:10px}.pm-para li{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card,var(--bg))}
.pm-para b{display:block;font-size:16.5px;color:var(--fg)}.pm-para span{display:block;font-size:15px;color:var(--fg-2);margin-top:2px;line-height:1.45}
/* «Pruébalo aquí»: demo en vivo dentro de un celular (src/demos) */
.pm-demo-g{display:grid;gap:40px;align-items:center}@media(min-width:960px){.pm-demo-g{grid-template-columns:1fr auto;gap:72px}}
.pm-demo-lista{list-style:none;padding:0;margin:22px 0 0;display:grid;gap:10px}
.pm-demo-lista li{position:relative;padding-left:30px;font-size:16.5px;line-height:1.45;color:var(--fg)}
.pm-demo-lista li::before{content:"";position:absolute;left:0;top:.2em;width:20px;height:20px;border-radius:50%;background:color-mix(in srgb,var(--pm) 14%,transparent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M6 10.5l2.6 2.6L14 7.6' fill='none' stroke='%23000' stroke-opacity='.55' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/16px no-repeat}
.pm-demo-acc{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}.pm-demo-acc .pm-btn{min-height:48px;padding:0 20px;font-size:15px}
.pm-demo-acc .pm-btn:not(.sec){color:#fff!important}.pm-demo-acc svg{width:18px;height:18px}
.pm-medida{margin:22px 0 0;padding:16px 18px;border:1px solid var(--line);border-radius:16px;font-size:15px;line-height:1.5;color:var(--fg-2);max-width:560px}.pm-medida b{color:var(--fg)}.pm-medida a{color:var(--pm);font-weight:700;white-space:nowrap}
.pm-demo-nota{margin:16px 0 0;font-size:14px;color:var(--fg-2);max-width:520px}
.pm-tel{justify-self:center;width:min(360px,88vw);height:min(720px,82vh);border:10px solid #1d1a1f;border-radius:46px;overflow:hidden;background:#fff;box-shadow:0 40px 80px -34px rgba(20,17,20,.55)}
.pm-tel iframe{width:100%;height:100%;border:0;display:block}
`;
