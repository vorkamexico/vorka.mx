// Páginas de la PAA por universidad (vorka.mx/simulador-paa/<universidad>/): para que nos encuentre quien busca "PAA <universidad>".
// Cada una tiene contenido propio (sus reglas, con el numeral del documento oficial), su canonical y liga al simulador.
// Regla: solo datos verificados en la fuente oficial que se cita; lo que es consejo nuestro se presenta como tal.
// No usar logos ni escudos. La estructura de la PAA sale de la guía del College Board de 2020 (sin tiempos: pudieron cambiar).
import { esc, pagina } from '../paginas.js';
import { FLECHA, CHECK } from '../marco.generado.js';

const SITIO = 'https://vorka.mx';
const RUTA = '/simulador-paa';
const PAA_2020 = 'https://latam.collegeboard.org/wp-content/uploads/2020/04/2020-PAA-Preguntas-y-Respuestas.pdf';

export const UNIVERSIDADES = {
  udem: {
    nombre: 'UDEM', completo: 'Universidad de Monterrey (UDEM)',
    titulo: 'PAA UDEM: puntaje mínimo (1,200) y reglas de admisión | Vorka México',
    descripcion: 'Cuánto pide la UDEM en la PAA: 1,200 en total, 550 en razonamiento verbal y matemático y promedio de 80 (Enfermería: 1,100, 500 y 70). Vigencia, constancia de otra institución, cursos remediales y portafolio.',
    h1: 'PAA para la UDEM: puntajes mínimos y cómo prepararte',
    lead: 'La UDEM pide la Prueba de Aptitud Académica (PAA) para entrar a cualquiera de sus licenciaturas. Aquí está lo que dice su lineamiento oficial de admisión, con el numeral de cada regla, y un plan para llegar a tu puntaje con el simulador.',
    fuente: { nombre: 'Lineamiento de Admisión a Licenciatura de la UDEM (LO-DISE-003, versión B, emitido el 06/01/2026)', url: 'https://udem.edu.mx/sites/default/files/2026-03/LO-DISE-003-B%20Lineamiento%20Admisio%CC%81n%20a%20Licenciatura.pdf' },
    verificado: '25 de octubre de 2026',
    minimos: {
      columnas: ['PAA total', 'Razonamiento verbal', 'Razonamiento matemático', 'Promedio'],
      filas: [['Todas las licenciaturas', '1,200', '550', '550', '80'], ['Licenciatura en Enfermería', '1,100', '500', '500', '70']],
      nota: 'Numeral 5.3.6. El promedio es de bachillerato, o su equivalente en la escala de tu prepa.',
    },
    reglas: [
      ['Tu resultado vale un año', 'La PAA tiene validez de un año desde que la presentas y debe estar vigente cuando inicias tu proceso de admisión (5.3.1).'],
      ['Sirve la PAA de otra institución', 'Puedes entregar la constancia oficial vigente de una PAA que presentaste en otra institución (5.3.3).'],
      ['En la UDEM, máximo dos veces', 'Si la presentas en la UDEM, puedes hacerlo únicamente dos veces en el mismo periodo (5.3.4).'],
      ['Si una parte queda abajo', 'Si cumples el total y el promedio pero sacas menos de 550 en razonamiento verbal o matemático (500 en Enfermería), en el primer semestre debes inscribir y acreditar un curso remedial: Lógica, Aritmética y Álgebra, o Habilidades de Comunicación Escrita (5.6).'],
      ['Portafolio en Arquitectura y Diseño', 'En Arquitectura, Artes, Diseño Gráfico, Diseño de Moda, Diseño Industrial y Diseño de Interiores, con una PAA de 1,000 a 1,199 y promedio de 80 pueden admitirte si presentas un portafolio (5.8).'],
      ['Además de la PAA', 'Todo solicitante contesta una evaluación cualitativa (5.4.5). Enfermería, Medicina, Odontología, Ingeniería Biomédica, Ciencias Ambientales y Salud, Nutrición y las tres licenciaturas de Psicología piden también una entrevista (5.5.1).'],
    ],
    plan: [
      ['Mide tu punto de partida', 'Haz un simulacro corto: en una sola sentada ves tu puntaje estimado por sección y qué temas te restan más puntos.'],
      ['Pon 550 como meta', 'El simulador estima cada sección en la misma escala de 200 a 800. Ponle 550 de meta (500 si vas a Enfermería) y mide en cada simulacro cuánto te falta.'],
      ['Ataca la parte más baja', 'Si una parte queda debajo de 550, aunque entres, la UDEM te pide un curso remedial en el primer semestre. Practica esa sección por tema hasta que suba.'],
      ['Cierra con el examen completo', 'Cuando el simulador te diga que ya estás listo, presenta el examen completo, sin pistas, para medirte como el día del examen.'],
    ],
    faq: [
      { p: '¿Cuánto necesito en la PAA para entrar a la UDEM?', r: 'Según el numeral 5.3.6 de su lineamiento de admisión: al menos 1,200 puntos de PAA, 550 en razonamiento verbal, 550 en razonamiento matemático y promedio de 80. En la Licenciatura en Enfermería: 1,100, 500 y 500, y promedio de 70.' },
      { p: '¿Puedo usar la PAA que presenté en otra universidad?', r: 'Sí. El numeral 5.3.3 dice que puedes presentar la constancia oficial vigente de los resultados de una PAA que hayas presentado en otra institución. Recuerda que debe tener menos de un año.' },
      { p: '¿Cuánto tiempo vale mi resultado de la PAA?', r: 'Un año desde que la presentas, y debe estar vigente cuando inicias tu proceso de admisión (numeral 5.3.1). Si dejas el proceso a medias y se vence, tienes que volver a presentarla.' },
      { p: '¿Qué pasa si saco menos de 550 en una parte?', r: 'Si cumples el puntaje total y el promedio pero quedas debajo de 550 en razonamiento verbal o matemático, en el primer semestre debes inscribir y acreditar el curso remedial que corresponda (numeral 5.6). Si no lo apruebas, no te readmiten al siguiente periodo.' },
      { p: '¿Y si voy a Arquitectura o a una carrera de diseño?', r: 'En Arquitectura, Artes, Diseño Gráfico, Diseño de Moda, Diseño Industrial y Diseño de Interiores, si sacas entre 1,000 y 1,199 en la PAA y tienes promedio de 80, puedes ser admitido presentando un portafolio (numeral 5.8).' },
      { p: '¿El simulador de Vorka es la PAA oficial?', r: 'No. Es un simulador de práctica con reactivos originales y un puntaje estimado para orientar tu estudio. La PAA es una prueba del College Board y la aplica la universidad. No estamos afiliados a la UDEM ni al College Board.' },
    ],
  },
};

const CSS = `<style>
.pu-hero{padding:clamp(12px,3vw,40px) 0 clamp(32px,4vw,56px)}
.pu-hero h1{margin-top:14px;max-width:820px}.pu-hero .t-lead{margin-top:14px;max-width:720px}
.pu-fuente{margin-top:16px;font-size:14px;color:var(--fg-2);max-width:720px}.pu-fuente a{color:var(--morado)}
.pu-botones{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pu-tabla{width:100%;border-collapse:collapse;margin-top:22px;font-size:15.5px;background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra)}
.pu-tabla th,.pu-tabla td{text-align:left;padding:14px 16px;border-bottom:1px solid var(--line)}
.pu-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650}.pu-tabla td{font-weight:750;font-size:18px}
@media(max-width:640px){.pu-tabla thead{display:none}.pu-tabla tr{display:grid;grid-template-columns:1fr 1fr;padding:8px 0;border-bottom:1px solid var(--line)}.pu-tabla th{grid-column:1/-1;border:0;padding-bottom:4px}.pu-tabla td{border:0;padding:6px 16px}.pu-tabla td::before{content:attr(data-c);display:block;font-size:12px;font-weight:600;color:var(--fg-2)}}
.pu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:14px;margin-top:24px}
.pu-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px;box-shadow:var(--sombra)}
.pu-card h3{font-size:17.5px;letter-spacing:-.02em;margin-bottom:6px}.pu-card p{color:var(--fg-2);font-size:15.5px}
.pu-pasos{display:grid;gap:12px;margin-top:24px;counter-reset:p}
.pu-paso{display:grid;grid-template-columns:44px 1fr;gap:14px;align-items:start;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px}
.pu-paso::before{counter-increment:p;content:counter(p);width:36px;height:36px;border-radius:12px;background:var(--morado-suave);color:var(--morado);display:grid;place-items:center;font-weight:800}
.pu-paso b{display:block;font-size:17px}.pu-paso span{color:var(--fg-2);font-size:15.5px}
.pu-nota{margin-top:14px;font-size:14px;color:var(--fg-2)}
</style>`;

// Página de una universidad, o null si no existe
export function paginaPaaUniversidad(clave) {
  const u = UNIVERSIDADES[clave];
  if (!u) return null;
  const ruta = `${RUTA}/${clave}/`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: u.faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Simulador PAA', item: `${SITIO}${RUTA}/` },
      { '@type': 'ListItem', position: 2, name: `PAA ${u.nombre}`, item: `${SITIO}${ruta}` }] },
  ];
  const m = u.minimos;
  return pagina({ titulo: u.titulo, ruta, descripcion: u.descripcion, imagen: `${SITIO}/tienda/img/portadas/simulador-paa-og.png`,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>${CSS}`,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador PAA</a> / PAA ${esc(u.nombre)}</nav>
  <h1 class="t-h1">${esc(u.h1)}</h1>
  <p class="t-lead">${esc(u.lead)}</p>
  <p class="pu-fuente">Fuente: <a href="${esc(u.fuente.url)}" rel="noopener">${esc(u.fuente.nombre)}</a>. Revisado el ${esc(u.verificado)}. Confirma siempre los requisitos vigentes con la ${esc(u.completo)}.</p>
  <div class="pu-botones"><a class="btn tinta" href="${RUTA}/">Practicar con el simulador PAA ${FLECHA}</a><a class="btn blanco" href="${RUTA}/#probar">Probar un reactivo gratis</a></div>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">Puntajes mínimos</span><h2 class="h2" style="margin-top:14px">Lo que pide la ${esc(u.nombre)} en la PAA</h2></div>
  <table class="pu-tabla"><thead><tr><th scope="col">Programa</th>${m.columnas.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
  <tbody>${m.filas.map(([p, ...v]) => `<tr><th scope="row">${esc(p)}</th>${v.map((x, i) => `<td data-c="${esc(m.columnas[i])}" class="num">${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <p class="pu-nota">${esc(m.nota)}</p>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">Reglas que conviene saber</span><h2 class="h2" style="margin-top:14px">Antes de presentar la PAA para la ${esc(u.nombre)}</h2></div>
  <div class="pu-grid">${u.reglas.map(([t, p]) => `<div class="pu-card"><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">Tu plan, con el simulador</span><h2 class="h2" style="margin-top:14px">Cómo llegar a tu puntaje</h2>
  <p class="lead">Esto ya es consejo nuestro, no regla de la ${esc(u.nombre)}.</p></div>
  <div class="pu-pasos">${u.plan.map(([t, p]) => `<div class="pu-paso"><div><b>${esc(t)}</b><span>${esc(p)}</span></div></div>`).join('')}</div>
  <div class="pu-botones"><a class="btn tinta" href="${RUTA}/">Ver planes del simulador ${FLECHA}</a></div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">La prueba</span><h2 class="h2" style="margin-top:14px">Cómo es la PAA</h2></div>
  <ul class="pu-grid" style="list-style:none;padding:0">
    <li class="pu-card"><h3>Lectura y Redacción</h3><p>70 reactivos. Es la parte verbal.</p></li>
    <li class="pu-card"><h3>Matemáticas</h3><p>55 reactivos. Es la parte matemática.</p></li>
    <li class="pu-card"><h3>Inglés</h3><p>50 reactivos.</p></li>
  </ul>
  <p class="pu-nota">${CHECK.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} Cada parte se califica de 200 a 800. Fuente: <a href="${PAA_2020}" rel="noopener">guía de preguntas y respuestas de la PAA del College Board (2020)</a>. Puede haber cambiado: confírmalo con la universidad donde la vas a presentar.</p>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">PAA y admisión a la ${esc(u.nombre)}</h2></div>
  <div class="t-faq" style="margin-top:22px">${u.faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
</div></section>

<section class="t-sec"><div class="marco"><p class="t-nota">Página informativa de Vorka México. No estamos afiliados a la ${esc(u.completo)} ni al College Board; PAA es una prueba del College Board. Los requisitos salen del documento oficial citado arriba y pueden cambiar.</p></div></section>`,
  });
}
