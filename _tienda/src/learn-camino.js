// Vorka Learn › Elegir tu camino (vorka.mx/learn/camino/…): guías para decidir qué y dónde estudiar después de la
// secundaria o la prepa: becas federales, cómo elegir carrera, qué hacer si no te quedaste en tu primera opción y cómo
// hacer tu primer CV sin experiencia.
// Es un «tema» (no examen): plantilla común de src/learn/tema.js. Catálogo y rutas: src/learn/datos.js (TEMAS) y
// src/simulador/guias.js (rutasLearn, urlsGuias).
// Reglas (política de la organización: sin inventar datos):
//  - Todo dato concreto (nombres de becas, montos, requisitos, fechas, cómo se asignan lugares) sale de la fuente que el
//    artículo cita en «Fuentes»: Coordinación Nacional de Becas para el Bienestar Benito Juárez y SEP (gob.mx), DGAE UNAM,
//    UAM, UACM e IMCO (Compara Carreras). Revisadas el 31 de octubre de 2026. Montos solo con su fuente y su ciclo.
//    La guía del CV cita la Ley Federal del Trabajo (texto vigente, reforma DOF 14-05-2026: artículos 22, 22 Bis y 133)
//    la Constitución (artículo 123, apartado A, fracción III; reforma DOF 07-10-2026) y el Portal del Empleo;
//    revisadas el 6 de noviembre de 2026. Lo demás de esa guía se dice como consejo nuestro.
//  - Lo que no pudimos verificar en una fuente oficial no se afirma (p. ej. fechas 2027, otras universidades).
//  - Un solo llamado final por artículo.
import { p, ul, ol, tabla, nota, caja, a, ext } from './learn/piezas.js';
import { crearTema } from './learn/tema.js';
import { llamadoProducto, llamadoGuia } from './learn/cta.js';

export const ACTUALIZADO_CAM = '2026-10-31';
const ACTUALIZADO_TXT = 'octubre de 2026';

export const CAMINO = {
  clave: 'camino', nombre: 'Elegir tu camino', corto: 'Camino',
  indice: {
    titulo: 'Elegir tu camino: becas, carrera y opciones',
    descripcion: 'Guías para decidir qué y dónde estudiar: becas federales para prepa y universidad, cómo elegir carrera y qué hacer si no te quedaste en la UNAM.',
    h1: 'Guías para elegir tu camino',
    lead: 'Becas, carrera y plan B, con lo que publican la Coordinación Nacional de Becas, las universidades y el IMCO, y con preguntas para decidir con calma.',
  },
};

// ---------- fuentes (todas revisadas el 31 de octubre de 2026) ----------
const F = {
  becas: { nombre: 'Coordinación Nacional de Becas para el Bienestar Benito Juárez: página principal (gob.mx)', url: 'https://www.gob.mx/becasbenitojuarez/' },
  becaMs: { nombre: 'Coordinación Nacional de Becas: Conoce todo sobre la Beca Universal de Educación Media Superior Benito Juárez (actualizada el 14 de septiembre de 2026)', url: 'https://www.gob.mx/becasbenitojuarez/es/articulos/conoce-todo-sobre-la-beca-universal-de-educacion-media-superior-benito-juarez' },
  becaJef: { nombre: 'Coordinación Nacional de Becas: Conoce todo sobre la Beca Jóvenes Escribiendo el Futuro (actualizada en septiembre de 2026)', url: 'https://www.gob.mx/becasbenitojuarez/es/articulos/conoce-todo-sobre-la-beca-jovenes-escribiendo-el-futuro' },
  becaGb: { nombre: 'Coordinación Nacional de Becas: Beca de Transporte «Gertrudis Bocanegra» (actualizada el 23 de septiembre de 2026)', url: 'https://www.gob.mx/becasbenitojuarez/articulos/beca-de-transporte-gertrudis-bocanegra' },
  imco: { nombre: 'IMCO: Compara Carreras', url: 'https://comparacarreras.imco.org.mx/' },
  imcoMet: { nombre: 'IMCO: Compara Carreras, metodología (fuentes e indicadores de la edición 2026)', url: 'https://comparacarreras.imco.org.mx/metodologia' },
  unamInstr: { nombre: 'DGAE UNAM: Instructivo del Concurso de Selección Ingreso a Licenciatura 2026', url: 'https://repositorio.dgae.unam.mx/Licenciatura2026/instructivo_licenciatura2026.pdf' },
  unamOferta: { nombre: 'UNAM: Oferta académica de licenciatura por área', url: 'https://oferta.unam.mx/' },
  uam: { nombre: 'UAM: Admisión a licenciatura, Tercer Proceso de Selección 2026', url: 'https://admision.uam.mx/' },
  uacm: { nombre: 'UACM: Convocatoria a Sorteo 2026, extensión del periodo de registro', url: 'https://uacm.edu.mx/publicaciones/2026/6/4/Convocatoriaingreso2026.pdf' },
  lft: { nombre: 'Ley Federal del Trabajo, texto vigente (última reforma DOF 14-05-2026; artículos 22, 22 Bis y 133), Cámara de Diputados', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf' },
  cpeum: { nombre: 'Constitución Política de los Estados Unidos Mexicanos, texto vigente (última reforma DOF 07-10-2026; artículo 123, apartado A, fracción III), Cámara de Diputados', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf' },
  empleo: { nombre: 'Portal del Empleo (gobierno de México)', url: 'https://www.empleo.gob.mx/' },
  sepUbbj: { nombre: 'SEP: Boletín 393, Universidades para el Bienestar Benito Juárez (28 de noviembre de 2025)', url: 'https://www.gob.mx/sep/prensa/boletin-393-universidades-para-el-bienestar-benito-juarez-proyecto-que-transforma-la-vida-comunitaria-20-nuevas-sedes-en-2026-secretario' },
};

const S = { becas: 'becas-para-prepa-y-universidad', carrera: 'como-elegir-carrera', unam: 'que-hacer-si-no-te-quedaste-en-la-unam', cv: 'como-hacer-tu-cv-sin-experiencia' };
const r = slug => `/learn/camino/${slug}/`;
// Agenda de Brandon Oleynick en Vorka OS (servicios express y mentoria, como en vorka.mx/oleynickhdz/; o = de dónde llegó)
const AGENDA_BRANDON = s => `https://os.vorka.mx/agendar/oleynickhdz?s=${s}&amp;o=learn-cv`;

const LLAMADO = {
  // Test vocacional Vorka (src/tests/): contestar y ver el perfil básico es gratis; el reporte completo es de pago
  practica: llamadoProducto({ etiqueta: 'Test vocacional gratis', producto: 'Test vocacional Vorka', de: 'Orientación vocacional · Vorka México', icono: 'brujula', chip: 'Gratis',
    titulo: '¿Todavía no sabes qué carrera elegir?',
    texto: '48 preguntas, de 8 a 10 minutos, basadas en los seis tipos de intereses de Holland (RIASEC).',
    puntos: ['Al terminar ves gratis tus 3 tipos de interés y tu carrera más afín.', 'Si quieres, el reporte completo trae 20 carreras, el examen que te toca y un plan de 30 días.', 'Para orientadores: se puede usar con todo el grupo.'],
    nota: 'Es orientativo: no es una prueba psicométrica.',
    href: '/test-vocacional/', boton: 'Hacer el test gratis' }),
  simUnam: llamadoProducto({ etiqueta: 'Practica con el simulador', producto: 'Simulador UNAM', de: 'Simulador de práctica · Vorka México', icono: 'palomita',
    titulo: '¿Vas por el siguiente concurso?',
    texto: 'Empieza con tiempo: haz un examen de práctica con el formato del examen de licenciatura.',
    puntos: ['Reactivos originales de las asignaturas de tu área.', 'Un reporte de qué reforzar.', 'Aciertos estimados para ponerte una meta.'],
    nota: 'Es un simulador de práctica; sus aciertos son una estimación para orientar tu estudio.',
    href: '/simulador-unam/', boton: 'Ir al Simulador UNAM' }),
  // Tú en Vorka (/voluntariado/): lo que promete esa página (16 a 29 años, 4 a 8 h por semana, sin costo, constancia y portafolio)
  tuEnVorka: llamadoProducto({ etiqueta: 'Tú en Vorka', producto: 'Tú en Vorka', de: 'Programa para jóvenes · Vorka México', icono: 'personas', chip: 'Sin costo',
    titulo: '¿Quieres experiencia real para tu CV?',
    texto: 'Para jóvenes de 16 a 29 años que quieren aprender construyendo proyectos sociales reales, con mentoría.',
    puntos: ['Áreas como redacción, diseño y redes, eventos y estrategia.', 'De 4 a 8 horas por semana, según tu área.', 'Es sin costo, con constancia y portafolio.', 'Presencial en el Bajío o a distancia desde cualquier parte de México.'],
    href: '/voluntariado/', boton: 'Conoce Tú en Vorka' }),
  becas: llamadoGuia({ titulo: '¿Ya sabes qué quieres estudiar?',
    texto: 'La beca te ayuda a sostener la carrera; elegir bien te ayuda a terminarla. Te damos un método en cinco pasos, con datos de empleo y salario por carrera.',
    href: r(S.carrera), boton: 'Lee: cómo elegir carrera' }),
};

// ---------- los artículos ----------
export const ARTICULOS_CAMINO = [
  // =============== 1. Becas ===============
  {
    slug: S.becas, llamado: 'becas',
    titulo: 'Becas para prepa y universidad en México',
    descripcion: 'Las becas federales para prepa y universidad del ciclo 2026-2027: Benito Juárez, Jóvenes Escribiendo el Futuro y Gertrudis Bocanegra, y dónde consultarlas.',
    h1: 'Becas para prepa y universidad en México: cuáles hay y cómo pedirlas',
    lead: 'El gobierno federal tiene becas para estudiantes de prepa y de universidad, y cada una tiene reglas distintas: a quién va, cuánto da y cuándo se pide. Aquí están las vigentes en el ciclo 2026-2027, con lo que publica la Coordinación Nacional de Becas.',
    secciones: [
      { h2: 'Quién da las becas federales', html: p(`Las becas federales para estudiantes las opera la <b>Coordinación Nacional de Becas para el Bienestar Benito Juárez</b>. Su página oficial es ${ext('https://www.gob.mx/becasbenitojuarez', 'gob.mx/becasbenitojuarez')}: ahí están las fichas de cada beca, sus calendarios de pago y los avisos.`)
        + p('En octubre de 2026, su página lista estas becas para prepa y universidad:')
        + tabla(['Beca', 'Para quién'], [
          ['Beca Universal de Educación Media Superior «Benito Juárez»', 'Prepa o bachillerato público, en modalidad escolarizada o mixta.'],
          ['Beca «Jóvenes Escribiendo el Futuro»', 'Licenciatura o técnico superior universitario, en escuelas consideradas prioritarias.'],
          ['Beca de Transporte «Gertrudis Bocanegra»', 'Educación superior, en algunos estados.'],
        ], 'La Coordinación también tiene becas de educación básica («Rita Cetina»), que no tratamos aquí.') },
      { h2: 'Para la prepa: Beca Universal «Benito Juárez»', html: p('Según la ficha de la Coordinación, actualizada en septiembre de 2026:')
        + ul([
          '<b>A quién va:</b> estudiantes inscritos en el ciclo 2026-2027 en un bachillerato o prepa <b>pública</b>, en modalidad <b>escolarizada o mixta</b>, de hasta 25 años cumplidos.',
          '<b>Cuánto da:</b> 1,900 pesos bimestrales durante los 10 meses del ciclo escolar, hasta un máximo de 40 meses (julio y agosto no cuentan).',
          '<b>Qué necesitas:</b> CURP certificada, una cuenta Llave MX y un comprobante de domicilio. Si eres menor de edad, también los datos, la CURP y la identificación de tu mamá, papá o tutor.',
          '<b>Cuándo se pidió:</b> para el ciclo 2026-2027, la solicitud en línea fue del 17 al 30 de septiembre, en becabenitojuarez.gob.mx, con la Clave de Centro de Trabajo (CCT) de tu escuela.',
        ])
        + nota('Los detalles (quién la recibe, cuánto y cuándo se paga) los fijan sus reglas de operación de cada año y el calendario de pagos que la Coordinación publica cada bimestre.') },
      { h2: 'Para la universidad: «Jóvenes Escribiendo el Futuro»', html: p('Según la ficha de la Coordinación (septiembre de 2026):')
        + ul([
          '<b>A quién va:</b> estudiantes de licenciatura, técnico superior universitario o equivalentes, en escuelas que la Coordinación considera prioritarias. La ficha menciona, entre otras, las universidades interculturales, las escuelas normales rurales, indígenas e interculturales, las Universidades para el Bienestar Benito Juárez García y escuelas de educación superior en localidades prioritarias.',
          '<b>Cuánto da:</b> 5,800 pesos bimestrales.',
          '<b>Cómo saber si te toca:</b> busca tu escuela con su CCT en el buscador de escuelas de la Coordinación; tiene que aparecer como «Susceptible de ser atendida».',
          '<b>Cuándo se pidió:</b> para 2026-2027, del 18 al 30 de septiembre, en becajovenesescribiendoelfuturo.gob.mx.',
        ]) },
      { h2: 'Transporte: Beca «Gertrudis Bocanegra»', html: p('Según su ficha, actualizada el 23 de septiembre de 2026, es para estudiantes de educación superior de <b>Michoacán, Campeche, Chiapas, Sonora y Zacatecas</b>, de hasta 29 años, en escuelas que aparecen como elegibles en el buscador. Da 1,900 pesos bimestrales durante los 10 meses del ciclo, hasta un máximo de 40 meses. Para 2026-2027, la solicitud en línea fue del 21 de septiembre al 9 de octubre.') },
      { h2: 'Cómo prepararte para el siguiente registro', html: p('Los periodos de registro son cortos (dos o tres semanas en 2026), así que conviene tener todo listo antes. Esto es consejo nuestro:')
        + ol([
          ['Saca tu Llave MX', 'Todas las becas de arriba la piden para registrarte.'],
          ['Revisa que tu CURP esté certificada', 'Si no lo está, la Coordinación indica acudir al Registro Civil.'],
          ['Ten la CCT de tu escuela', 'Viene en tu credencial o te la dan en control escolar.'],
          ['Escanea tu comprobante de domicilio', 'En PDF o imagen; la ficha de la beca de prepa pide un máximo de 3 MB.'],
          ['Sigue los canales oficiales', 'Las fechas se anuncian en gob.mx/becasbenitojuarez y en las asambleas informativas de tu escuela.'],
        ])
        + caja('Otras becas', p('Tu estado, tu municipio y tu propia escuela pueden tener becas aparte de las federales. Pregunta en servicios escolares de tu plantel y en la página de educación de tu estado. Y desconfía de quien te ofrezca «meterte» a una beca a cambio de dinero.')) },
    ],
    faq: [
      { p: '¿Cuánto da la Beca Benito Juárez de prepa?', r: 'Según la ficha de la Coordinación Nacional de Becas para el ciclo 2026-2027, 1,900 pesos bimestrales durante los 10 meses del ciclo escolar, hasta un máximo de 40 meses.' },
      { p: '¿La Beca Benito Juárez es para prepas privadas?', r: 'No. Según su ficha, es para estudiantes de bachilleratos o prepas públicas en modalidad escolarizada o mixta, de hasta 25 años, inscritos en el ciclo vigente.' },
      { p: '¿Qué beca federal hay para la universidad?', r: 'La beca «Jóvenes Escribiendo el Futuro», de 5,800 pesos bimestrales en 2026, para estudiantes de licenciatura o TSU en escuelas consideradas prioritarias. En cinco estados existe además la beca de transporte «Gertrudis Bocanegra».' },
      { p: '¿Necesito Llave MX para pedir la beca?', r: 'Sí. Las fichas de la Beca Benito Juárez, Jóvenes Escribiendo el Futuro y Gertrudis Bocanegra piden una cuenta Llave MX y una CURP certificada para registrarte.' },
    ],
    fuentes: [F.becas, F.becaMs, F.becaJef, F.becaGb],
    relacionadas: [S.carrera, S.unam],
  },

  // =============== 2. Elegir carrera ===============
  {
    slug: S.carrera, llamado: 'practica',
    titulo: 'Cómo elegir carrera: un método práctico',
    descripcion: 'Un método en cinco pasos para elegir carrera: tus intereses, tus habilidades, el empleo y salario de cada carrera con datos del IMCO y dónde estudiarla.',
    h1: 'Cómo elegir carrera: un método práctico en cinco pasos',
    lead: 'No hay una carrera perfecta, pero sí formas de decidir mejor que «la que estudió mi primo». Este método junta lo que te gusta, lo que se te da y lo que dicen los datos de empleo, y termina con preguntas para que decidas tú.',
    secciones: [
      { h2: 'Paso 1: tus intereses', html: p('Esto es consejo nuestro. Durante una semana, anota:')
        + ul([
          '<b>Qué haces sin que nadie te lo pida</b>: arreglar cosas, dibujar, organizar, explicar, investigar, cuidar a alguien.',
          '<b>Qué temas buscas por tu cuenta</b> en internet o en videos.',
          '<b>Qué clases se te pasan rápido</b>, aunque no sean en las que mejor te va.',
        ])
        + p('Busca el patrón: ¿te jalan más las personas, los datos, las cosas o las ideas? Ese patrón señala familias de carreras, no una sola.') },
      { h2: 'Paso 2: tus habilidades', html: p('Interés y habilidad no siempre coinciden, y está bien: una habilidad se entrena. Pero conviene saber dónde estás. Consejo nuestro:')
        + ul([
          'Revisa tus calificaciones de los últimos dos años por materia, no solo el promedio.',
          'Pregunta a dos profesores qué ven que se te da bien.',
          'Mira las materias de los primeros semestres de las carreras que te interesan: si traen mucho cálculo, mucha lectura o mucho laboratorio, pregúntate si estás dispuesto a trabajar en eso.',
        ]) },
      { h2: 'Paso 3: el trabajo y el salario, con datos', html: p(`El Instituto Mexicano para la Competitividad (IMCO) publica ${ext('https://comparacarreras.imco.org.mx/', 'Compara Carreras')}, una herramienta gratuita con información de más de 60 carreras universitarias, licenciaturas y técnicas (TSU). Según su metodología, la edición 2026 usa:`)
        + ul([
          'La <b>Encuesta Nacional de Ocupación y Empleo (ENOE) del INEGI</b>: el segundo, tercero y cuarto trimestres de 2025 y el primero de 2026.',
          'Los anuarios de educación superior de la <b>ANUIES</b>, ciclo 2024-2025, para matrícula, egreso, lugares y solicitudes.',
          'La <b>ENIGH 2024</b> del INEGI, para ajustar el subreporte de ingresos.',
        ])
        + tabla(['Indicador', 'Qué te dice'], [
          ['Salario promedio mensual', 'Cuánto ganan, en promedio, las personas de esa carrera.'],
          ['Tasa de ocupación y de desempleo', 'Cuántas de las que buscan trabajo lo tienen.'],
          ['Tasa de informalidad', 'Cuántas trabajan en un empleo no amparado por el marco legal (sin prestaciones, por ejemplo).'],
          ['Porcentaje de aceptación', 'En universidades públicas, cuántos de los que piden lugar entran.'],
          ['Retorno de la inversión', 'En cuánto tiempo se recupera lo que cuesta estudiarla.'],
        ], 'Definiciones tomadas de la metodología de Compara Carreras del IMCO.')
        + caja('Léelo con cuidado', p('La misma metodología advierte límites: los salarios se ajustan por subreporte (es un supuesto, no un dato observado), el retorno de inversión no distingue universidades públicas de privadas, y solo se publican las carreras con suficientes datos. Úsalo para comparar familias de carreras, no para predecir cuánto vas a ganar tú.')) },
      { h2: 'Paso 4: dónde se estudia y cómo se entra', html: p(`Una carrera con buen panorama no te sirve si no hay dónde estudiarla o si el ingreso es casi imposible para ti este año. Revisa la oferta de cada universidad; por ejemplo, la de la UNAM está en ${ext('https://oferta.unam.mx/', 'oferta.unam.mx')}.`)
        + p('El instructivo del concurso de licenciatura 2026 de la UNAM pide revisar las características de la carrera antes de registrarte, porque hay carreras <b>de muy alta demanda</b>, <b>de ingreso indirecto</b> y otras <b>con requisitos previos</b>, como dominio de un idioma, entrevistas o conocimientos de matemáticas. Además, algunas carreras de la UNAM se imparten también en las modalidades <b>abierta y a distancia</b>.')
        + p(`Si vas a presentar examen, revisa también ${a('/learn/unam/examen-unam-por-area/', 'qué viene en el examen de la UNAM según tu área')} o ${a('/learn/paa/que-es-la-paa/', 'qué es la PAA')}.`) },
      { h2: 'Paso 5: pruébala antes de decidir', html: p('Esto es consejo nuestro:')
        + ol([
          ['Platica con alguien que la estudia', 'Y con alguien que ya trabaja de eso. Pregúntales qué hacen en un día normal.'],
          ['Revisa el plan de estudios completo', 'No solo el nombre: las materias de los ocho o diez semestres.'],
          ['Haz una prueba corta', 'Un curso en línea gratuito, un taller o un fin de semana ayudando en algo relacionado.'],
        ])
        + nota(`Si eres orientadora u orientador y quieres trabajar este método con tu grupo, mira ${a('/test-vocacional/escuelas/', 'cómo usar el Test vocacional Vorka en tu escuela')}.`) },
      { h2: 'Preguntas para hacerte antes de elegir', html: ul([
          '¿Me imagino haciendo esto en un día normal, no solo en lo emocionante?',
          '¿Las materias de los primeros semestres me retan o me ahogan?',
          '¿Qué dicen los datos de empleo e informalidad de esta carrera?',
          '¿Dónde la puedo estudiar y qué tan difícil es entrar este año?',
          '¿Cuánto me cuesta estudiarla (transporte, materiales, tiempo) y cómo la voy a sostener?',
          '¿Hay una carrera cercana con la que podría llegar a lo mismo?',
          '¿Estoy eligiendo yo, o estoy eligiendo lo que esperan de mí?',
        ]) },
    ],
    faq: [
      { p: '¿Dónde veo cuánto gana cada carrera en México?', r: 'En Compara Carreras del IMCO. Su edición 2026 usa la ENOE del INEGI (del segundo trimestre de 2025 al primero de 2026) y muestra, entre otros, salario promedio mensual, tasa de ocupación e informalidad por carrera.' },
      { p: '¿Qué hago si me gustan dos carreras muy distintas?', r: 'Como consejo nuestro: compara las materias de los primeros semestres, platica con alguien de cada una y revisa sus datos de empleo. Si sigues en empate, elige la que te deje más puertas abiertas para cambiar después.' },
      { p: '¿Qué es una carrera de ingreso indirecto en la UNAM?', r: 'El instructivo de licenciatura 2026 de la UNAM distingue carreras de muy alta demanda, de ingreso indirecto y con requisitos previos. Revisa en la oferta de la UNAM y en la página de la facultad cómo se entra a la que te interesa.' },
    ],
    fuentes: [F.imco, F.imcoMet, F.unamInstr, F.unamOferta],
    relacionadas: [S.becas, S.unam],
  },

  // =============== 3. Plan B ===============
  {
    slug: S.unam, llamado: 'simUnam',
    titulo: 'Qué hacer si no te quedaste en la UNAM',
    descripcion: 'Si no te quedaste en la UNAM o en tu primera opción: el siguiente concurso, la modalidad abierta y a distancia, y otras universidades públicas.',
    h1: 'Qué hacer si no te quedaste en la UNAM (o en tu primera opción)',
    lead: 'No quedarte duele, pero no cierra el camino. Hay un siguiente concurso, otras modalidades en la misma UNAM y otras universidades públicas con procesos en distintas épocas del año. Estas son las opciones, con lo que publica cada institución.',
    secciones: [
      { h2: 'Primero, entiende tu resultado', html: p('Según el instructivo del concurso de licenciatura 2026 de la UNAM, concursas por <b>una sola</b> combinación de carrera, plantel y sistema o modalidad, y si tus aciertos no alcanzan para esa combinación, <b>no te asignan a otra</b>. Es decir: no quedarte en una carrera y un plantel no dice que no puedas entrar a otra combinación, ni el año siguiente.')
        + p(`Revisa tus aciertos contra la referencia de tu carrera y plantel. Lo explicamos en ${a('/learn/unam/cuantos-aciertos-para-entrar-a-la-unam/', 'cuántos aciertos necesitas para la UNAM')}.`) },
      { h2: 'Opción 1: preparar el siguiente concurso', html: p('El calendario del concurso 2026 te da una idea de los tiempos (el de 2027 lo publica la DGAE en su propia convocatoria):')
        + tabla(['Etapa', 'Concurso 2026'], [
          ['Lectura de la convocatoria', '12 de enero de 2026'],
          ['Registro', 'Del 23 de enero al 3 de febrero'],
          ['Examen', 'Del 23 de mayo al 10 de junio, en línea'],
          ['Resultados', '17 de julio'],
        ], 'Fuente: instructivo del concurso 2026 de la DGAE. Confirma las fechas de tu año en la convocatoria vigente.')
        + p('Esto es consejo nuestro: si vas a volver a intentarlo, usa estos meses para medir dónde estás, estudiar por asignatura y elegir una combinación de carrera y plantel que puedas alcanzar.') },
      { h2: 'Opción 2: la misma UNAM, en modalidad abierta o a distancia', html: p('En el concurso 2026, la UNAM ofreció licenciaturas en el <b>Sistema Escolarizado</b> y también en las modalidades <b>Abierta y a Distancia del SUAyED</b> (Sistema Universidad Abierta y Educación a Distancia), cada una con su propia oferta de lugares. Lo que dice el instructivo:')
        + ul([
          'Estudiar a distancia usa métodos y medios distintos a los de la educación presencial; por eso la UNAM sugiere su <b>Programa de Apoyo al Ingreso (PAI)</b> en línea. En 2026 fue del 18 de mayo al 14 de junio.',
          'En la modalidad a distancia, las actividades presenciales y los trámites de cada carrera siguen las reglas y calendarios de cada facultad o escuela.',
          'Conoce sus características en cuaed.unam.mx antes de registrarte.',
        ])
        + p('Como consejo nuestro: es una opción seria si necesitas trabajar o vives lejos de un plantel; revisa bien cómo es el día a día antes de elegirla solo por los aciertos.') },
      { h2: 'Opción 3: otras universidades públicas', html: p('No todas abren en las mismas fechas ni seleccionan igual. Tres ejemplos con lo que publican:')
        + tabla(['Universidad', 'Cómo entras', 'Lo que publicó en 2026'], [
          ['UAM (Universidad Autónoma Metropolitana)', 'Examen de selección.', 'Un «Tercer Proceso de Selección 2026» para entrar en el trimestre de invierno de 2027: registro del 5 al 11 de octubre, examen entre el 29 de octubre y el 15 de noviembre y resultados el 30 de noviembre.'],
          ['UACM (Universidad Autónoma de la Ciudad de México)', 'Sorteo entre quienes se registran.', 'Convocatoria a sorteo publicada el 5 de junio, registro ampliado del 15 al 23 de junio y sorteo el 25 de junio. Todos sus trámites de ingreso son gratuitos.'],
          ['Universidades para el Bienestar Benito Juárez García', 'Según su convocatoria (ubbj.gob.mx).', 'La SEP informó en noviembre de 2025 que tenían 214 sedes en el país y que en 2026 se construirían 20 nuevas.'],
        ], 'Fuentes: página de admisión de la UAM, convocatoria a sorteo 2026 de la UACM y boletín 393 de la SEP. Revisa la convocatoria vigente de cada una.')
        + p('Esto es consejo nuestro: revisa también la universidad pública de tu estado y haz una lista con fechas de registro de tres o cuatro opciones para no depender de un solo examen.') },
      { h2: 'Opción 4: estudiar y trabajar mientras', html: p(`Esto es consejo nuestro. Si decides esperar al siguiente concurso, que el año cuente: trabaja o estudia algo corto, y separa horas fijas a la semana para prepararte. Si vas a entrar a una pública, revisa también ${a(r(S.becas), 'las becas federales para la universidad')}.`)
        + caja('Si lo que buscabas era la prepa', p(`Si te tocaba entrar a la prepa en la Ciudad de México y su zona metropolitana, el proceso es otro: «Mi derecho, mi lugar». Lo explicamos en ${a('/learn/ecoems/como-elegir-tus-opciones-ecoems/', 'cómo elegir tus opciones del ECOEMS')}.`)) },
      { h2: 'Cuidado con quien te promete un lugar', html: p('El instructivo 2026 de la UNAM es claro: la UNAM <b>no tiene convenios</b> con ninguna institución para hacer trámites de ingreso a sus licenciaturas, no debes hacer trámites ni pagos en instituciones ajenas, y la UNAM <b>no cobra colegiaturas ni inscripción</b>: esos trámites son gratuitos.')
        + p('Si alguien te ofrece un lugar a cambio de dinero, es un fraude.') },
    ],
    faq: [
      { p: '¿Si no me quedé en la UNAM, me pueden dar otra carrera?', r: 'No. Según el instructivo 2026 de la DGAE, concursas solo por la carrera, plantel y sistema o modalidad que registraste; si no alcanzas, no te asignan a otra. Puedes volver a concursar en la siguiente convocatoria.' },
      { p: '¿La UNAM tiene licenciaturas en línea?', r: 'Sí. En el concurso 2026 la UNAM ofreció licenciaturas en las modalidades Abierta y a Distancia del SUAyED, cada una con su propia oferta de lugares, además del Sistema Escolarizado.' },
      { p: '¿Qué universidades públicas tienen otro proceso de admisión en el año?', r: 'Por ejemplo, la UAM tuvo en 2026 un tercer proceso de selección para entrar en invierno de 2027 (registro del 5 al 11 de octubre). La UACM asigna sus lugares por sorteo; en 2026 su registro fue en junio.' },
      { p: '¿Alguien me puede conseguir un lugar en la UNAM si le pago?', r: 'No. El instructivo de la UNAM dice que no tiene convenios con ninguna institución para trámites de ingreso y que sus trámites son gratuitos. Quien te cobre por un lugar te está estafando.' },
    ],
    fuentes: [F.unamInstr, F.unamOferta, F.uam, F.uacm, F.sepUbbj],
    relacionadas: [S.carrera, S.becas],
  },
  // =============== 4. Tu primer CV ===============
  {
    slug: S.cv, llamado: 'tuEnVorka', actualizado: '2026-11-06', actualizadoTxt: 'noviembre de 2026',
    titulo: 'Cómo hacer tu CV sin experiencia laboral',
    descripcion: 'Tu primer currículum sin experiencia: qué poner, cómo contar escuela, proyectos y voluntariado, qué datos omitir y qué dice la ley si tienes 15 a 17.',
    h1: 'Cómo hacer tu CV sin experiencia laboral, paso a paso',
    lead: '«Piden experiencia, pero nadie me la da.» Casi siempre sí tienes algo que contar: proyectos de la escuela, voluntariado, el negocio de tu familia o lo que haces por tu cuenta. Esta guía te dice cómo ponerlo en una hoja, qué datos no hace falta incluir y qué dice la Ley Federal del Trabajo si todavía no cumples 18.',
    secciones: [
      { h2: 'Qué busca quien lee tu CV', html: p('Esto es consejo nuestro. En un primer empleo nadie espera una carrera larga. Quien lee tu currículum quiere responder tres preguntas rápido:')
        + ol([
          ['¿Te puedo contactar?', 'Tus datos de contacto, claros y arriba.'],
          ['¿Sabes hacer algo útil para este puesto?', 'Habilidades con ejemplos, no solo una lista de palabras.'],
          ['¿Eres responsable?', 'Cosas que empezaste y terminaste: un proyecto, un voluntariado, un torneo, un negocio familiar.'],
        ])
        + p('Por eso un CV sin experiencia no se llena con relleno. Se llena con <b>ejemplos concretos</b> de lo que ya hiciste.') },
      { h2: 'Paso 1: tus datos de contacto (y los que no hacen falta)', html: p('Consejo nuestro: arriba, en dos o tres renglones:')
        + ul([
          '<b>Tu nombre completo</b>, más grande que el resto.',
          '<b>Tu ciudad</b>, por ejemplo «Celaya, Gto.». No hace falta tu dirección completa.',
          '<b>Tu celular con WhatsApp</b> y un <b>correo serio</b>, de preferencia tu nombre y apellido. Evita correos como «elmasperron2009».',
          'Si tienes algo que enseñar, <b>la liga a tu portafolio</b> o a tu perfil de LinkedIn.',
        ])
        + p('La Ley Federal del Trabajo, en su artículo 133, fracción I, prohíbe a quien contrata <b>negarse a aceptar trabajadores</b> por su origen étnico o nacional, género, edad, discapacidad, condición social, condiciones de salud, religión, opiniones, preferencias sexuales o estado civil. Como consejo nuestro: esos datos no dicen si sabes hacer el trabajo, así que no hace falta ponerlos. Lo mismo con la foto, tu CURP o tu número de seguridad social: se piden después, si te contratan.')
        + caja('Ojo', p('La misma ley prohíbe pedir un certificado médico de no embarazo para entrar, quedarte o subir de puesto en un empleo (artículo 133, fracción XIV).')) },
      { h2: 'Paso 2: un resumen de dos o tres líneas', html: p('Consejo nuestro: justo debajo de tus datos, di quién eres y qué buscas. Sin frases vacías como «soy proactivo y dinámico»: mejor algo que se pueda comprobar.')
        + caja('Ejemplo', p('«Estudiante de bachillerato (5.º semestre) con experiencia en atención a clientes en el negocio familiar y en redes sociales de un proyecto escolar. Busco empleo de medio tiempo por las tardes en ventas o atención a clientes.»'))
        + p('Cambia el resumen para cada vacante: si el puesto es de bodega, habla de orden y puntualidad; si es de cafetería, de trato con la gente.') },
      { h2: 'Paso 3: la experiencia que sí tienes', html: p('Esto es consejo nuestro. Haz una sección que se llame <b>«Experiencia y proyectos»</b> en lugar de «Experiencia laboral». Ahí cabe todo lo que hiciste con responsabilidad, aunque no te hayan pagado:')
        + tabla(['Lo que hiciste', 'Cómo escribirlo'], [
          ['Ayudas en la tienda o el negocio de tu familia', '«Atención a clientes y cobro en caja en tienda de abarrotes familiar, fines de semana (2024 a la fecha).»'],
          ['Un proyecto de la escuela', '«Coordiné a un equipo de 5 para una feria de ciencias; me encargué del presupuesto y de la presentación.»'],
          ['Voluntariado o servicio social', '«Voluntaria en colecta de víveres: organicé el registro de 120 donaciones en una hoja de cálculo.»'],
          ['Llevas las redes de alguien', '«Manejo de Instagram de una panadería local: 3 publicaciones por semana durante 6 meses.»'],
          ['Das clases, cuidas o haces encargos', '«Asesorías de matemáticas a 4 alumnos de secundaria, dos tardes por semana.»'],
          ['Deporte, música o concursos', '«Capitán del equipo de fútbol de la escuela (2025); segundo lugar en concurso estatal de oratoria.»'],
        ], 'Los ejemplos son ilustrativos: escribe solo lo que de verdad hiciste y que puedas contar en una entrevista.')
        + p('La fórmula que funciona: <b>verbo + qué hiciste + un dato</b> (cuánto, cuántos o por cuánto tiempo). «Ayudé en la tienda» dice poco; «Atendí clientes y cuadré la caja los sábados durante un año» dice mucho.') },
      { h2: 'Paso 4: estudios, cursos y habilidades', html: ul([
          '<b>Estudios</b>: lo último que estudias o terminaste, con la escuela y los años. Si tu promedio es bueno, puedes ponerlo; si no, no hace falta.',
          '<b>Cursos</b>: los que terminaste, aunque sean gratuitos y en línea, con el nombre de quien lo dio.',
          '<b>Habilidades con nivel honesto</b>: en lugar de «Excel», escribe «Excel: tablas, filtros y fórmulas básicas». En lugar de «inglés avanzado» si no lo es, escribe «inglés: leo y entiendo, conversación básica».',
          '<b>Disponibilidad</b>: si buscas medio tiempo, di qué días y horarios puedes.',
        ]) + nota('Consejo nuestro: no inventes. Todo lo que pongas te lo pueden preguntar o pedir que lo demuestres en la entrevista.') },
      { h2: 'Paso 5: el formato', html: p('Consejo nuestro, para que lo lean completo:')
        + ul([
          '<b>Una sola hoja.</b> Sin experiencia, una hoja bien hecha se ve mejor que dos con relleno.',
          '<b>En PDF</b> y con un nombre claro: «CV-Ana-Lopez.pdf», no «documento final final 2.pdf».',
          '<b>Letra legible</b>, de un solo tipo, y títulos claros para cada sección.',
          '<b>Sin faltas de ortografía.</b> Pídele a alguien que lo lea antes de mandarlo.',
          '<b>El orden</b>: datos de contacto, resumen, experiencia y proyectos, estudios, cursos y habilidades.',
        ])
        + caja('Si lo mandas por WhatsApp o correo', p('Escribe un mensaje corto con tu nombre, la vacante que te interesa y por qué, y adjunta el PDF. Un archivo solo, sin saludo, se pierde.')) },
      { h2: 'Si tienes 15, 16 o 17 años', html: p('Esto es lo que dice la Ley Federal del Trabajo (texto vigente con la reforma publicada el 14 de mayo de 2026):')
        + tabla(['Edad', 'Qué dice la ley'], [
          ['Menos de 15 años', 'El trabajo está prohibido (artículo 22 Bis).'],
          ['De 15 a menos de 16', 'Puedes trabajar con las limitaciones de la ley, pero necesitas autorización de tus padres o tutores; a falta de ellos, del sindicato, del Tribunal, del Inspector del Trabajo o de la Autoridad Política (artículo 22). Según la Constitución, tu jornada máxima es de seis horas (artículo 123, apartado A, fracción III).'],
          ['De 15 a menos de 18', 'No pueden contratarte si no terminaste tu educación básica obligatoria, salvo que la autoridad laboral lo apruebe porque el trabajo es compatible con tus estudios (artículo 22 Bis).'],
        ], 'Fuentes: Ley Federal del Trabajo, artículos 22 y 22 Bis, y Constitución, artículo 123, apartado A, fracción III. Además, la ley pone otras limitaciones para menores de 18 años; si te ofrecen un trabajo, pregunta en qué horario y en qué condiciones.')
        + p('Como consejo nuestro: si todavía estudias, busca un horario que no te quite la escuela. Un CV con «estudiante, disponible sábados y domingos» es perfectamente válido.') },
      { h2: 'Dónde buscar y de qué cuidarte', html: p(`El gobierno federal tiene el ${ext('https://www.empleo.gob.mx/', 'Portal del Empleo')}, donde puedes buscar vacantes. Como consejo nuestro, también sirven las bolsas de trabajo de tu escuela, los anuncios en los negocios de tu colonia y preguntar directamente con tu CV en la mano.`)
        + p('La Ley Federal del Trabajo prohíbe a quien contrata <b>exigir o aceptar dinero</b> de los trabajadores como gratificación para admitirlos en el trabajo (artículo 133, fracción III). Consejo nuestro: desconfía de cualquier «vacante» que te pida pagar antes de contratarte, por ejemplo por un curso obligatorio o un registro.') },
      { h2: 'Antes de mandarlo, revisa', html: ul([
          '¿Mi celular y mi correo están bien escritos?',
          '¿Cada cosa de «Experiencia y proyectos» tiene un verbo y un dato?',
          '¿Adapté el resumen a esta vacante?',
          '¿Cabe en una hoja y está en PDF?',
          '¿Lo leyó alguien más para buscar faltas?',
          '¿Puedo explicar en una entrevista todo lo que puse?',
        ]) },
      { h2: 'Si quieres que alguien lo revise contigo', html: p('Puedes agendar una sesión 1:1 por videollamada con <b>Brandon Oleynick</b>, fundador de Vorka México:')
        + ul([
          `<b>${ext(AGENDA_BRANDON('express'), 'Asesoría Express')}</b> (20 minutos): para revisar tu CV o resolver una duda concreta antes de mandarlo.`,
          `<b>${ext(AGENDA_BRANDON('mentoria'), 'Mentoría mensual')}</b> (45 minutos al mes): un plan personalizado y seguimiento mes a mes, con revisión de tu CV y WhatsApp directo entre sesiones.`,
        ])
        + nota('Las sesiones tienen costo; lo ves al agendar, eliges tu horario y te llega el enlace de la videollamada al confirmar.') },
    ],
    faq: [
      { p: '¿Qué pongo en mi CV si nunca he trabajado?', r: 'Una sección de «Experiencia y proyectos» con lo que hiciste con responsabilidad aunque no te pagaran: proyectos escolares, voluntariado, ayudar en el negocio familiar, dar asesorías o llevar redes. Escribe cada cosa con un verbo, qué hiciste y un dato concreto.' },
      { p: '¿Tengo que poner foto, edad o estado civil en mi CV?', r: 'No hace falta. La Ley Federal del Trabajo (artículo 133, fracción I) prohíbe negarse a aceptar trabajadores por edad, estado civil, género o religión, entre otros motivos. Como consejo nuestro, pon solo lo que muestra que puedes hacer el trabajo.' },
      { p: '¿A qué edad puedo trabajar en México?', r: 'Según la Ley Federal del Trabajo, desde los 15 años y con las limitaciones de la ley. De 15 a menos de 16 necesitas autorización de tus padres o tutores y tu jornada máxima es de seis horas, según la Constitución; de 15 a menos de 18 no pueden contratarte si no terminaste tu educación básica obligatoria, salvo que la autoridad laboral lo apruebe. El trabajo de menores de 15 está prohibido.' },
      { p: '¿Es normal que me pidan dinero para darme un trabajo?', r: 'No. La Ley Federal del Trabajo (artículo 133, fracción III) prohíbe exigir o aceptar dinero de los trabajadores como gratificación para admitirlos en el trabajo. Desconfía de cualquier oferta que te pida pagar antes de contratarte.' },
    ],
    fuentes: [F.lft, F.cpeum, F.empleo],
    relacionadas: [S.carrera, S.becas],
  },
];

const NOTA_PIE = 'Vorka Learn es la sección de guías de Vorka México. Estas guías son informativas: confirma siempre requisitos, montos y fechas en la convocatoria vigente. No estamos afiliados a la Coordinación Nacional de Becas, a la SEP, a la UNAM, a la UAM, a la UACM, a las Universidades para el Bienestar, al IMCO ni a la Secretaría del Trabajo y Previsión Social.';

export const TEMA_CAMINO = crearTema({
  seccion: CAMINO, articulos: ARTICULOS_CAMINO, llamados: LLAMADO, actualizado: ACTUALIZADO_CAM, actualizadoTxt: ACTUALIZADO_TXT,
  notaFuentes: `<p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; las becas, las convocatorias y las leyes cambian, así que confírmalos siempre en la fuente vigente.</p>`,
  notaPie: NOTA_PIE, compartirTexto: 'Compártela con quien está decidiendo qué estudiar.', relTitulo: 'Más guías para elegir tu camino',
});
export const RUTA_CAMINO = TEMA_CAMINO.ruta;
