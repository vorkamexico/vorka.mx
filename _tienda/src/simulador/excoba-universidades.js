// EXCOBA por universidad (vorka.mx/simulador-excoba/uaq/ y /ug/): qué asignaturas de bachillerato lleva cada carrera y
// cuál combinación elegir en el simulador. Regla: solo datos de los instructivos oficiales (excoba/FUENTES.md, revisados el
// 11-nov-2026); lo que es consejo nuestro se presenta como tal. No usar logos ni escudos.
import { esc, pagina } from '../paginas.js';
import { FLECHA, CHECK } from '../marco.generado.js';
import { RUTA, nombreCombo } from './excoba.js';
import { compraSimulador, CSS_COMPRA } from './compra-arriba.js';

const SITIO = 'https://vorka.mx';
const VERIFICADO = '11 de noviembre de 2026';
const UAQ_PDF = 'https://dsa.uaq.mx/convocatorias/Convocatoria-2026/Instructivo%20EXCOBA-UAQ-Licenciatura.pdf';
const UG_GUIA = 'https://www.ugto.mx/admisionug/descargar-guia-excoba';
const UG_CONV = 'https://www.ugto.mx/admisionug/images/admision2026/licenciatura/Conv_licenciaturas_ago_dic_2026_final.pdf';

// carreras: [combinación del simulador, [carreras]] en el orden de la tabla oficial
export const UNIVERSIDADES_EXCOBA = {
  uaq: {
    nombre: 'UAQ', completo: 'Universidad Autónoma de Querétaro',
    titulo: 'Simulador EXCOBA UAQ 2027: asignaturas por carrera y cómo practicar | Vorka México',
    descripcion: 'La UAQ usa el EXCOBA para licenciatura: 180 preguntas de primaria, secundaria y 3 asignaturas de bachillerato según tu carrera. Busca la tuya y practica.',
    h1: 'EXCOBA UAQ: qué asignaturas lleva tu carrera',
    lead: 'La Universidad Autónoma de Querétaro usa el Examen de Competencias Básicas (EXCOBA) para licenciatura. Todos presentan primaria y secundaria; las tres asignaturas de bachillerato dependen de tu carrera. Búscala aquí y elige esa combinación en el simulador.',
    fuentes: [{ nombre: 'Instructivo del Excoba de la UAQ, Anexo I. Programas educativos 2026-1', url: UAQ_PDF }],
    pide: [
      ['180 preguntas', 'Primaria: Español y Matemáticas, 20 cada una. Secundaria: Español, Matemáticas, Ciencias naturales y Ciencias sociales, 20 cada una. Bachillerato: tres asignaturas de 20.'],
      ['Un minuto por pregunta', 'El instructivo dice que, en promedio, tienes un minuto para contestar cada pregunta, y sugiere saltar las que tomen mucho tiempo y regresar después.'],
      ['Respuesta semiconstruida', 'Arrastrar elementos, seleccionar varios y escribir números o expresiones. Las de varias respuestas se califican por partes.'],
    ],
    fechas: 'Las fechas, sedes y costo salen en la convocatoria vigente de la UAQ (dsa.uaq.mx). Revísala antes de registrarte.',
    carreras: [
      ['est-bio-qui', ['Medicina General', 'Odontología', 'TSU en Manejo de Alimentos y Cultura del Vino']],
      ['fis-bio-qui', ['Biología', 'Educación Física y Ciencias del Deporte', 'Enfermería (Querétaro)', 'Enfermería (San Juan del Río)', 'Enfermería por Nivelación', 'Fisioterapia', 'Medicina Veterinaria y Zootecnia', 'Nutrición']],
      ['cal-fis-qui', ['Ingeniero en Agrobiotecnología', 'Ingeniería de Software', 'Ingeniería en Tecnologías Inteligentes Industriales (San Juan del Río)', 'Químico Farmacéutico Biólogo']],
      ['cal-fis-len', ['Animación Digital y Medios Interactivos', 'Arquitectura (Querétaro)', 'Arquitectura (Tequisquiapan)', 'Diseño Industrial (Querétaro)', 'Diseño Industrial (Tequisquiapan)', 'Ingeniería Agroindustrial (Amazcala)', 'Ingeniería Agroindustrial (Amealco)', 'Ingeniería Agroindustrial (Concá)', 'Ingeniería Biomédica', 'Ingeniería Civil (Querétaro)', 'Ingeniería Civil (San Juan del Río, tronco común)', 'Ingeniería Electromecánica (San Juan del Río)', 'Ingeniería en Automatización (Querétaro)', 'Ingeniería en Automatización (San Juan del Río, tronco común)', 'Ingeniería en Nanotecnología', 'Ingeniería Física', 'Ingeniería Industrial y de Manufactura (Querétaro)', 'Ingeniería Industrial y de Manufactura (San Juan del Río, tronco común)', 'Ingeniería Mecánica y Automotriz (San Juan del Río)', 'Matemáticas Aplicadas']],
      ['est-len-hum', ['Administración (Querétaro)', 'Administración (San Juan del Río)', 'Administración Financiera', 'Administración Virtual', 'Artes Visuales Artes Plásticas', 'Contador Público (Querétaro)', 'Contador Público (San Juan del Río)', 'Contador Público Virtual', 'Derecho (Querétaro)', 'Derecho (San Juan del Río)', 'Diseño y Comunicación Visual', 'Docencia de las Artes', 'Educación y Mediación Intercultural', 'Negocios y Comercio Internacional']],
    ],
    nota: 'Si tu carrera no está en la lista, revisa la versión vigente del instructivo: el Anexo I cambia cada periodo.',
  },
  ug: {
    nombre: 'UG', completo: 'Universidad de Guanajuato',
    titulo: 'Simulador EXCOBA UG 2027 para licenciatura: asignaturas por carrera | Vorka México',
    descripcion: 'La Universidad de Guanajuato usa el EXCOBA para licenciatura: 180 preguntas de primaria, secundaria y 3 asignaturas de bachillerato según tu carrera. Busca la tuya.',
    h1: 'EXCOBA UG: qué asignaturas lleva tu carrera',
    lead: 'Para licenciatura, la Universidad de Guanajuato aplica el Examen de Competencias Básicas (EXCOBA) de forma presencial y en computadora. Todos presentan primaria y secundaria; las tres asignaturas de bachillerato dependen de tu carrera. Búscala aquí y elige esa combinación en el simulador.',
    fuentes: [{ nombre: 'Instructivo y temario del EXCOBA de la UG', url: UG_GUIA }, { nombre: 'Convocatoria de licenciatura agosto–diciembre 2026', url: UG_CONV }],
    pide: [
      ['180 preguntas', 'Primaria: Español y Matemáticas, 20 cada una. Secundaria: Español, Matemáticas, Ciencias naturales y Ciencias sociales, 20 cada una. Bachillerato: tres asignaturas de 20. En la Licenciatura en Economía son 170, porque su primera asignatura trae 10.'],
      ['Calificación por partes', 'Las preguntas de varias respuestas valen por partes y no se restan puntos por respuestas erróneas.'],
      ['Demo obligatorio', 'La guía del aspirante pide hacer el demo oficial del EXCOBA antes del examen, para conocer la plataforma. Algunos programas aplican además otros instrumentos: revisa la ficha técnica del tuyo.'],
    ],
    fechas: 'Referencia: en la convocatoria de agosto–diciembre 2026 los exámenes se aplicaron del 6 al 24 de junio de 2026 y los resultados salieron a partir del 11 de julio. Revisa la convocatoria vigente en ugto.mx/admisionug.',
    carreras: [
      ['est-bio-len', ['Enfermería y Obstetricia (Celaya)', 'Enfermería y Obstetricia (Guanajuato)', 'Psicología', 'Psicología Clínica']],
      ['cal-cso-len', ['Arquitectura']],
      ['cal-bio-qui', ['Biología Experimental', 'Químico Farmacéutico Biólogo']],
      ['fis-bio-qui', ['Fisioterapia (Celaya)', 'Médico Cirujano', 'Nutrición (Celaya)']],
      ['est-cso-cea', ['Administración', 'Administración Financiera', 'Agronegocios (Salvatierra)', 'Contador Público (Celaya)', 'Contador Público (Guanajuato)', 'Gestión Empresarial (Salamanca)', 'Mercadotecnia']],
      ['hum-cso-len', ['Artes Visuales', 'Música (Cantante)', 'Música (Compositor)', 'Música (Educación Musical)', 'Música (Instrumentista)', 'Música (Musicología)']],
      ['cal-fis-qui', ['Física', 'Ingeniería Agroindustrial', 'Ingeniería Ambiental (Guanajuato)', 'Ingeniería Ambiental (Irapuato)', 'Ingeniería Biomédica', 'Ingeniería Civil (Celaya)', 'Ingeniería Civil (Guanajuato)', 'Ingeniería en Minas', 'Ingeniería en Agronomía (Irapuato)', 'Ingeniería en Alimentos (Irapuato)', 'Ingeniería en Biotecnología', 'Ingeniería en Energías Renovables', 'Ingeniería en Geología', 'Ingeniería en Mecatrónica', 'Ingeniería en Sistemas Computacionales (Salamanca)', 'Ingeniería Física', 'Ingeniería Geomática', 'Ingeniería Hidráulica', 'Ingeniería Mecánica', 'Ingeniería Mecánica Agrícola', 'Ingeniería Metalúrgica', 'Ingeniería Química', 'Ingeniería Química Sustentable', 'Química']],
      ['cal-len-hum', ['Artes Digitales']],
      ['cso-len-cea', ['Comercio Internacional']],
      ['cso-hum-cea', ['Administración de Recursos Turísticos']],
      ['len-hum-cea', ['Relaciones Industriales']],
      ['len-est-cea', ['Administración de la Calidad y la Productividad']],
    ],
    nota: 'La tabla del instructivo no dice qué asignaturas lleva la Licenciatura en Economía; si es tu carrera, confírmalo en su ficha técnica. Si tu carrera no está en la lista, revisa la ficha técnica de tu programa en ugto.mx/admisionug: algunos programas tienen otros instrumentos de evaluación.',
  },
};

export async function paginaExcobaUniversidad(env, clave) {
  const u = UNIVERSIDADES_EXCOBA[clave];
  if (!u) return null;
  const { tarjeta, barra } = await compraSimulador(env, { app: 'simulador-excoba', nombre: 'Simulador EXCOBA', para: `para ${u.art || 'la'} ${u.nombre}` });
  const ruta = `${RUTA}/${clave}/`;
  const total = u.carreras.reduce((t, [, cs]) => t + cs.length, 0);
  const ejemplo = u.carreras[0];
  const faq = [
    { p: `¿Qué examen pide la ${u.nombre} para licenciatura?`, r: `El EXCOBA (Examen de Competencias Básicas), elaborado por Métrica Educativa, A.C. ${u.pide[0][1]}` },
    { p: '¿Qué asignaturas de bachillerato me tocan?', r: `Dependen de tu carrera. Por ejemplo, ${ejemplo[1][0]} lleva ${nombreCombo(ejemplo[0])}. La tabla de esta página trae las ${total} carreras del instructivo oficial.` },
    { p: '¿Cuándo es el examen?', r: u.fechas },
    { p: '¿El simulador de Vorka es el examen oficial?', r: `No. Es un simulador de práctica con preguntas originales que siguen la estructura y el temario del instructivo oficial. No estamos afiliados a Métrica Educativa ni a la ${u.completo}.` },
  ];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Simulador EXCOBA', item: `${SITIO}${RUTA}/` },
      { '@type': 'ListItem', position: 2, name: `EXCOBA ${u.nombre}`, item: `${SITIO}${ruta}` }] },
  ];
  const filas = u.carreras.flatMap(([c, cs]) => cs.map(nombre => `<tr class="ex-c" data-q="${esc(nombre.toLowerCase())}"><th scope="row">${esc(nombre)}</th><td data-c="Asignaturas de bachillerato"><b>${esc(nombreCombo(c))}</b></td></tr>`)).join('');
  const otra = clave === 'uaq' ? 'ug' : 'uaq';
  return pagina({ titulo: u.titulo, ruta, descripcion: u.descripcion, imagen: `${SITIO}/assets/tienda/v3/simulador-excoba-og.jpg`,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>${CSS}${CSS_COMPRA}`,
    script: SCRIPT_FILTRO,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador EXCOBA</a> / ${esc(u.nombre)}</nav>
  <h1 class="t-h1">${esc(u.h1)}</h1>
  <p class="t-lead">${esc(u.lead)}</p>
  ${tarjeta}
  <p class="pu-fuente">${u.fuentes.length > 1 ? 'Fuentes' : 'Fuente'}: ${u.fuentes.map(x => `<a href="${esc(x.url)}" rel="noopener">${esc(x.nombre)}</a>`).join('; ')}. Revisado el ${VERIFICADO}. Confirma siempre los requisitos vigentes con la ${esc(u.completo)}.</p>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab"><h2 class="h2">Tu carrera y sus asignaturas</h2>
  <p class="lead">Elige en el simulador la combinación que dice la tabla: el examen se arma con primaria, secundaria y esas tres asignaturas.</p></div>
  <label class="eu-buscar"><span class="vh">Busca tu carrera</span><input type="search" id="ex-q" placeholder="Escribe tu carrera" autocomplete="off"></label>
  <table class="pu-tabla ex-tabla"><thead><tr><th scope="col">Carrera</th><th scope="col">Asignaturas de bachillerato</th></tr></thead><tbody id="ex-lista">${filas}</tbody></table>
  <p class="eu-vacio" id="ex-vacio" hidden>No encontramos esa carrera en la tabla del instructivo. ${esc(u.nota)}</p>
  <p class="pu-nota">${esc(u.nota)}</p>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><h2 class="h2">Cómo es el examen en la ${esc(u.nombre)}</h2></div>
  <div class="pu-grid">${u.pide.map(([t, p]) => `<div class="pu-card"><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
  <p class="pu-nota">${CHECK.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} ${esc(u.fechas)}</p>
  <div class="pu-botones"><a class="btn acento" href="${RUTA}/?plan=paquete#comprar">Comprar el simulador EXCOBA ${FLECHA}</a><a class="btn blanco" href="${RUTA}/${otra}/">EXCOBA ${UNIVERSIDADES_EXCOBA[otra].nombre}</a></div>
</div></section>

<section class="t-sec suave"><div class="marco">
  <h2 class="h2">EXCOBA y ${esc(u.nombre)}</h2>
  <div class="t-faq" style="margin-top:22px">${faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
</div></section>

<section class="t-sec"><div class="marco"><p class="t-nota">Página informativa de Vorka México. No estamos afiliados a la ${esc(u.completo)} ni a Métrica Educativa, A.C. Los datos salen de las fuentes oficiales citadas arriba y pueden cambiar.</p></div></section>${barra}`,
  });
}

const SCRIPT_FILTRO = `(function(){var q=document.getElementById('ex-q'),l=document.getElementById('ex-lista'),v=document.getElementById('ex-vacio');if(!q||!l)return;
var n=function(s){return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();};
q.addEventListener('input',function(){var t=n(q.value.trim()),k=0;l.querySelectorAll('.ex-c').forEach(function(tr){var ok=!t||n(tr.dataset.q).indexOf(t)>=0;tr.hidden=!ok;if(ok)k++;});v.hidden=k>0;});})();`;

const CSS = `<style>
.pu-hero{padding:clamp(12px,3vw,40px) 0 clamp(32px,4vw,56px)}
.pu-hero h1{margin-top:14px;max-width:820px}.pu-hero .t-lead{margin-top:14px;max-width:720px}
.pu-fuente{margin-top:16px;font-size:14px;color:var(--fg-2);max-width:720px}.pu-fuente a{color:var(--morado)}
.pu-botones{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pu-tabla{width:100%;border-collapse:collapse;margin-top:18px;font-size:15.5px;background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra)}
.pu-tabla th,.pu-tabla td{text-align:left;padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:top}
.pu-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650}
.ex-tabla tbody th{font-weight:600}.ex-tabla td{color:var(--fg-2)}.ex-tabla td b{color:var(--fg)}.ex-c[hidden]{display:none}
@media(max-width:640px){.pu-tabla thead{display:none}.pu-tabla tr{display:block;padding:8px 0;border-bottom:1px solid var(--line)}.pu-tabla th{display:block;border:0;padding-bottom:4px}.pu-tabla td{display:block;border:0;padding:4px 16px}.pu-tabla td::before{content:attr(data-c);display:block;font-size:12px;font-weight:600;color:var(--fg-2)}}
.pu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:14px;margin-top:24px}
.pu-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px;box-shadow:var(--sombra)}
.pu-card h3{font-size:17.5px;letter-spacing:-.02em;margin-bottom:6px}.pu-card p{color:var(--fg-2);font-size:15.5px}
.pu-nota{margin-top:14px;font-size:14px;color:var(--fg-2)}.pu-nota a{color:var(--morado)}
.eu-buscar{display:block;margin-top:22px;max-width:520px}
.eu-buscar input{width:100%;font:inherit;font-size:17px;padding:14px 18px;border-radius:14px;border:1.5px solid var(--line-2);background:var(--card);color:var(--fg)}
.eu-buscar input:focus{outline:2px solid var(--fg);outline-offset:1px}
.eu-vacio{margin-top:14px;color:var(--fg-2)}
</style>`;
