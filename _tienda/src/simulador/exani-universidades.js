// EXANI-II por universidad (vorka.mx/simulador-exani-ii/<universidad>/) y el selector «¿Cuál te sirve?»
// (vorka.mx/simulador-exani-ii/universidades/): un solo simulador para todas las universidades que usan EXANI-II; cada
// página dice qué pide esa universidad y qué módulos elegir en el simulador. El selector incluye también las que usan
// otro examen (UNAM, IPN, PAA, EXCOBA…) y manda a cada quien a su simulador.
// Regla: solo datos verificados en la fuente oficial que se cita (revisión del 10-nov-2026); lo que es consejo nuestro se
// presenta como tal. No usar logos ni escudos.
import { esc, pagina } from '../paginas.js';
import { FLECHA, CHECK } from '../marco.generado.js';
import { RUTA, nombrePareja } from './exani-ii.js';
import { productoPorSlug } from '../modelo.js';
import { compraSimulador, CSS_COMPRA } from './compra-arriba.js';
import { RUTA as RUTA_EXCOBA, PLANES as PLANES_EXCOBA } from './excoba.js';

const SITIO = 'https://vorka.mx';
const VERIFICADO = '10 de noviembre de 2026';
const CENEVAL_EXANI = 'https://ceneval.edu.mx/examenes-ingreso-exani_ii/';
export const RUTA_UNIVERSIDADES = `${RUTA}/universidades/`;

// ---------- universidades que usan EXANI-II (fuente oficial) ----------
// estructura: lo que dice la fuente sobre áreas y módulos · modulos: [[carrera o área, pareja del simulador | null, texto]]
export const UNIVERSIDADES = {
  buap: {
    nombre: 'BUAP', completo: 'Benemérita Universidad Autónoma de Puebla (BUAP)', art: 'la', estado: 'Puebla',
    examen: 'EXANI-II-EPIU',
    titulo: 'EXANI-II BUAP: cómo es el examen y qué módulos practicar | Vorka México',
    descripcion: 'La BUAP aplica el EXANI-II-EPIU desde casa: 190 reactivos de tres opciones en máximo 5 horas, con 4 estructuras según tu área. Qué viene y cómo practicarlo.',
    h1: 'EXANI-II para la BUAP: cómo es y cómo practicarlo',
    lead: 'Para licenciatura, la BUAP aplica el EXANI-II de CENEVAL junto con su Evaluación del Perfil Integral Universitario (EPIU). Medicina presenta otro instrumento. Aquí está lo que dicen la convocatoria y la página de CENEVAL para la BUAP, y qué módulos elegir en el simulador.',
    fuentes: [
      { nombre: 'Convocatoria de registro, Nivel Superior, Admisión 2026 (BUAP)', url: 'https://admision.buap.mx/sites/default/files/Admision_2026/2.Nivel_Superior/Convocatoria_de_registro_nivel_superior_2026.pdf' },
      { nombre: 'CENEVAL: EXANI de la BUAP', url: 'https://ceneval.edu.mx/benem-universidad-autonoma-de-puebla-exani/' },
    ],
    pide: [
      ['Una sesión, máximo 5 horas', 'El EXANI-II-EPIU se aplica en una sola sesión de máximo 5 horas, con reactivos de tres opciones (CENEVAL).'],
      ['Desde casa', 'En 2026 la evaluación real fue «desde casa», del 20 al 27 de junio, con el navegador seguro de CENEVAL y grabación del espacio a 360° (convocatoria, pasos 6 y 9).'],
      ['Cuatro estructuras de 190 reactivos', 'Comprensión lectora 30, Redacción indirecta 30, Pensamiento matemático 30, Habilidades blandas y toma de decisiones 22, Inglés 30 (diagnóstico) y dos módulos de 24: uno general y uno de tu área (CENEVAL).'],
      ['Medicina va aparte', 'Medicina presenta el EXANI-II-EIPM en dos etapas: Premedicina (48) y Razonamiento clínico avanzado (20), y luego las áreas comunes, habilidades blandas e Inglés (CENEVAL).'],
    ],
    fechas: 'Proceso 2026 (referencia): póliza de $750 del 21 al 29 de abril; evaluación real desde casa del 20 al 27 de junio; resultados el 18 de julio. La convocatoria 2027 aún no está publicada.',
    modulosTitulo: 'Qué módulos elegir en el simulador',
    modulosNota: 'El módulo general es el mismo que trae el simulador. El módulo de área es propio de la BUAP y no tiene equivalente exacto: te sugerimos el más cercano. Habilidades blandas no se simula: CENEVAL no publica cómo se califica. Esto es consejo nuestro.',
    modulos: [
      ['Ciencias Económico Administrativas', 'cso-adm', 'Ciencias sociales (general) + Administración como el más cercano a tu área.'],
      ['Ciencias Sociales y Humanidades', 'cso-his', 'Ciencias sociales (general) + Historia como el más cercano a tu área.'],
      ['Ciencias Naturales y de Salud', 'cex-sal', 'Ciencias experimentales (general) + Ciencias de la salud como el más cercano a tu área.'],
      ['Ingenierías y Ciencias Exactas', 'cex-fis', 'Ciencias experimentales (general) + Física como el más cercano a tu área.'],
      ['Medicina', null, 'Premedicina aún no está en el simulador: practica las áreas comunes y el Inglés.'],
    ],
  },
  uanl: {
    nombre: 'UANL', completo: 'Universidad Autónoma de Nuevo León (UANL)', art: 'la', estado: 'Nuevo León',
    examen: 'EXANI-II',
    titulo: 'EXANI-II UANL: módulos por facultad y cómo practicar | Vorka México',
    descripcion: 'La UANL usa el EXANI-II: 4 áreas comunes y 2 módulos que elige cada facultad. Tabla oficial de módulos por facultad y qué elegir en el simulador.',
    h1: 'EXANI-II para la UANL: los módulos de tu facultad',
    lead: 'La UANL usa el EXANI-II de CENEVAL para su concurso de ingreso a licenciatura. Todas las facultades evalúan las mismas cuatro áreas y cada una elige dos módulos. Aquí está la tabla oficial y qué módulos elegir en el simulador.',
    fuentes: [
      { nombre: 'UANL: Concurso de ingreso a licenciatura', url: 'https://www.uanl.mx/tramites/concurso-de-ingreso-a-licenciatura/' },
      { nombre: 'UANL: tipos de examen por facultad, noviembre de 2026', url: 'https://www.uanl.mx/wp-content/uploads/2019/02/Tipos_de_examen_2026_nov_v5.pdf' },
    ],
    pide: [
      ['Seis áreas', 'Cuatro comunes para todas las facultades (Comprensión lectora, Redacción indirecta, Pensamiento matemático e Inglés) y dos módulos que selecciona cada facultad (tabla de tipos de examen).'],
      ['Guía de CENEVAL', 'La UANL dice que evalúa de acuerdo con la guía del EXANI-II de CENEVAL, versión 2026.'],
    ],
    fechas: 'Enero-junio 2027: el examen fue el sábado 7 de noviembre de 2026 y los resultados se publican del 27 de noviembre al 4 de diciembre. Revisa la convocatoria del siguiente periodo en uanl.mx.',
    modulosTitulo: 'Módulos por facultad',
    modulosNota: 'Tabla de la UANL de noviembre de 2026. Si tu facultad pide un módulo que aún no está en el simulador, practica las áreas comunes y el módulo que sí está.',
    modulos: [
      ['Medicina, Odontología, Enfermería, Organización Deportiva', 'bio-sal', 'Biología y Ciencias de la salud.'],
      ['Agronomía, Ciencias Biológicas', 'bio-qui', 'Biología y Química.'],
      ['Salud Pública y Nutrición', 'qui-sal', 'Química y Ciencias de la salud.'],
      ['Ingeniería Civil, Ingeniería Mecánica y Eléctrica', 'ari-fis', 'Aritmética y Física.'],
      ['Ciencias Químicas', 'ari-qui', 'Aritmética y Química.'],
      ['Medicina Veterinaria y Zootecnia', 'ari-bio', 'Aritmética y Biología.'],
      ['Ciencias Físico Matemáticas', 'ari-pye', 'Aritmética y Probabilidad y estadística.'],
      ['Arquitectura', 'ari-his', 'Aritmética e Historia.'],
      ['Contaduría Pública y Administración, Ciencias de la Comunicación, Trabajo Social-FACPYA', 'adm-pye', 'Administración y Probabilidad y estadística.'],
      ['Ciencias Políticas y Relaciones Internacionales, Música', 'adm-his', 'Administración e Historia.'],
      ['Derecho y Criminología', null, 'Derecho e Historia: Historia sí está en el simulador; Derecho todavía no.'],
      ['Filosofía y Letras', null, 'Literatura e Historia: Historia sí está; Literatura todavía no.'],
      ['Artes Visuales', null, 'Filosofía e Historia: Historia sí está; Filosofía todavía no.'],
      ['Psicología', null, 'Psicología y Ciencias de la salud: Ciencias de la salud sí está; Psicología todavía no.'],
      ['Trabajo Social y Desarrollo Humano', null, 'Psicología y Probabilidad y estadística: Probabilidad y estadística sí está; Psicología todavía no.'],
    ],
  },
  uady: {
    nombre: 'UADY', completo: 'Universidad Autónoma de Yucatán (UADY)', art: 'la', estado: 'Yucatán', examen: 'EXANI-II',
    titulo: 'EXANI-II UADY: cómo es el examen de admisión | Vorka México',
    descripcion: 'La UADY usa el EXANI-II: habilidades académicas y 2 módulos según tu licenciatura, en máximo 4 horas. Qué viene y cómo practicarlo.',
    h1: 'EXANI-II para la UADY',
    lead: 'La UADY usa el EXANI-II de CENEVAL para entrar a licenciatura: habilidades académicas y dos módulos de conocimientos según la licenciatura que elijas.',
    fuentes: [{ nombre: 'UADY: convocatoria de ingreso a licenciatura', url: 'https://ingreso.uady.mx/licenciatura/docs/conv.pdf' }],
    pide: [
      ['Habilidades y dos módulos', 'Habilidades académicas y dos módulos de conocimientos que dependen de la licenciatura (convocatoria).'],
      ['Presencial', 'Se presenta en sede; hay convocatoria aparte para programas virtuales.'],
    ],
    fechas: 'Ciclo 2026-2027 (referencia): examen el 13 y 14 de junio de 2026 y resultados el 26 de junio. La convocatoria 2027-2028 aún no está publicada.',
  },
  uaa: {
    nombre: 'UAA', completo: 'Universidad Autónoma de Aguascalientes (UAA)', art: 'la', estado: 'Aguascalientes', examen: 'EXANI-II',
    titulo: 'EXANI-II UAA: cómo es el examen de admisión | Vorka México',
    descripcion: 'La UAA usa el EXANI-II: 3 áreas de 30 reactivos y 2 módulos (138 reactivos); el examen pesa 70 % y tu promedio 30 %.',
    h1: 'EXANI-II para la UAA',
    lead: 'La Universidad Autónoma de Aguascalientes usa el EXANI-II de CENEVAL como su examen de admisión. Esto dice su convocatoria.',
    fuentes: [{ nombre: 'UAA: convocatoria de admisión 2026', url: 'https://www.uaa.mx/portal/wp-content/uploads/2026/02/Convocatoria-2026.pdf' }],
    pide: [
      ['138 reactivos', 'Comprensión lectora 30, Redacción indirecta 30, Pensamiento matemático 30 y dos módulos de conocimientos específicos (48 reactivos).'],
      ['70 % examen, 30 % promedio', 'El resultado del examen pesa 70 % y el promedio 30 % (convocatoria).'],
      ['Un proceso al año', 'La convocatoria 2026-2027 fue un solo proceso al año, presencial.'],
    ],
    fechas: 'Proceso 2026 (referencia): examen el 23 y 24 de mayo y resultados el 20 de junio de 2026.',
  },
  uv: {
    nombre: 'UV', completo: 'Universidad Veracruzana (UV)', art: 'la', estado: 'Veracruz', examen: 'EXANI-II UV',
    titulo: 'EXANI-II UV (Universidad Veracruzana): cómo es | Vorka México',
    descripcion: 'La Universidad Veracruzana aplica el EXANI-II UV: 4 áreas y 120 reactivos en máximo 3 horas, sin módulos específicos. Qué viene y cómo practicarlo.',
    h1: 'EXANI-II para la Universidad Veracruzana',
    lead: 'La UV aplica una versión propia del EXANI-II, sin módulos de conocimientos específicos. Esto dicen CENEVAL y la convocatoria de la UV.',
    fuentes: [{ nombre: 'CENEVAL: EXANI-II UV', url: 'https://ceneval.edu.mx/exani-uv/' }, { nombre: 'UV: convocatoria de licenciatura y TSU 2026', url: 'https://www.uv.mx/escolar/licenciatura2026/pdf/Convocatoria_Lic_y_TSU_2026.pdf' }],
    pide: [
      ['4 áreas, 120 reactivos', 'Comprensión lectora, Redacción indirecta, Pensamiento matemático e Inglés (B1), en máximo 3 horas. Sin módulos específicos.'],
      ['En sede o desde casa', 'En 2026 hubo aplicación en sede y «desde casa» con el navegador seguro de CENEVAL.'],
      ['Artes', 'Los programas de Artes piden además un Examen de Habilidades.'],
    ],
    fechas: 'Proceso 2026 (referencia): examen en sede el 30 y 31 de mayo y desde casa el 2 y 3 de junio; primera lista el 3 de julio.',
    sinModulos: true,
  },
  unison: {
    nombre: 'UNISON', completo: 'Universidad de Sonora (UNISON)', art: 'la', estado: 'Sonora', examen: 'EXANI-II Admisión',
    titulo: 'EXANI-II UNISON (Universidad de Sonora): cómo es | Vorka México',
    descripcion: 'La Universidad de Sonora aplica el EXANI-II Admisión desde casa, en 3 horas y sin módulos específicos; pesa 60 % y tu promedio 40 %.',
    h1: 'EXANI-II para la Universidad de Sonora',
    lead: 'La UNISON aplica el EXANI-II Admisión en versión computarizada, desde casa. Esto dice su convocatoria.',
    fuentes: [{ nombre: 'UNISON: convocatoria de admisión', url: 'https://admision.unison.mx/convocatoria.php' }],
    pide: [
      ['3 horas, sin módulos', 'Versión computarizada de 3 horas con las áreas comunes; el Inglés es solo diagnóstico.'],
      ['60 % examen, 40 % promedio', 'El examen pesa 60 % y el promedio 40 %.'],
      ['Habilidades específicas', 'Artes y Enseñanza del Inglés piden además un Examen de Habilidades Específicas.'],
    ],
    fechas: 'Proceso 2026 (referencia): prueba el 27 de abril y examen real el 4 de mayo de 2026, desde casa.',
    sinModulos: true,
  },
  ujat: {
    nombre: 'UJAT', completo: 'Universidad Juárez Autónoma de Tabasco (UJAT)', art: 'la', estado: 'Tabasco', examen: 'EXANI-II',
    titulo: 'EXANI-II UJAT: cómo es el examen de admisión | Vorka México',
    descripcion: 'La UJAT usa el EXANI-II: 3 áreas comunes y 2 módulos según tu programa. Examen del ciclo febrero-agosto 2027: 25 de noviembre de 2026.',
    h1: 'EXANI-II para la UJAT',
    lead: 'La UJAT usa el EXANI-II de CENEVAL, que aplica y califica CENEVAL. Esto dice su convocatoria.',
    fuentes: [{ nombre: 'UJAT: convocatoria de nuevo ingreso', url: 'https://archivos.ujat.mx/dse/convocatoria.pdf' }],
    pide: [
      ['3 áreas y 2 módulos', 'Comprensión lectora, Redacción indirecta, Pensamiento matemático y dos módulos específicos según el programa (por ejemplo, Actuaría pide Aritmética y Física).'],
    ],
    fechas: 'Ciclo febrero-agosto 2027: examen el miércoles 25 de noviembre de 2026.',
  },
  uadec: {
    nombre: 'UAdeC', completo: 'Universidad Autónoma de Coahuila (UAdeC)', art: 'la', estado: 'Coahuila', examen: 'EXANI-II',
    titulo: 'EXANI-II UAdeC: cómo es el examen de admisión | Vorka México',
    descripcion: 'La UAdeC usa el EXANI-II con las áreas transversales y los módulos generales de Ciencias sociales y Ciencias experimentales; Medicina presenta Premedicina.',
    h1: 'EXANI-II para la UAdeC',
    lead: 'La Universidad Autónoma de Coahuila usa el EXANI-II de CENEVAL para licenciatura. Esto dice su convocatoria.',
    fuentes: [{ nombre: 'UAdeC: convocatoria de admisiones', url: 'https://www2.uadec.mx/pub/DAA/convocatoria-admisiones.pdf' }],
    pide: [
      ['Los módulos generales', 'Áreas transversales, Ciencias sociales y Ciencias experimentales. Medicina: áreas transversales y Premedicina.'],
      ['Presencial o desde casa', 'Presencial; los programas en línea presentan el EXANI-II desde casa, con simulacro obligatorio.'],
    ],
    fechas: 'Enero-junio 2027: el examen fue el 24 de octubre de 2026.',
    modulos: [['Licenciaturas (excepto Medicina)', 'generales', 'Ciencias experimentales y Ciencias sociales: los dos módulos generales.'], ['Medicina', null, 'Premedicina aún no está en el simulador: practica las áreas comunes.']],
  },
  uach: {
    nombre: 'UACH', completo: 'Universidad Autónoma de Chihuahua (UACH)', art: 'la', estado: 'Chihuahua', examen: 'EXANI-II',
    titulo: 'EXANI-II UACH: examen de admisión enero-junio 2027 | Vorka México',
    descripcion: 'La UACH usa el EXANI-II. Examen del ciclo enero-junio 2027: 11 de diciembre de 2026, presencial o virtual.',
    h1: 'EXANI-II para la UACH',
    lead: 'La Universidad Autónoma de Chihuahua usa el EXANI-II de CENEVAL, con las áreas que corresponden a cada carrera. Esto dice su comunicado oficial.',
    fuentes: [{ nombre: 'UACH: abre su proceso de admisión para enero-junio 2027', url: 'https://uach.mx/noticias/2026/9/15/abre-la-uach-su-proceso-de-admision-para-el-ciclo-enero-junio-2027/' }],
    pide: [['Áreas según tu carrera', 'Las áreas que corresponden a la carrera; el detalle está en uach.mx/admision.'], ['Presencial o virtual', 'Hay aplicación presencial y virtual, con una práctica virtual antes.']],
    fechas: 'Enero-junio 2027: práctica virtual el 4 de diciembre y examen el 11 de diciembre de 2026.',
  },
  uan: {
    nombre: 'UAN', completo: 'Universidad Autónoma de Nayarit (UAN)', art: 'la', estado: 'Nayarit', examen: 'EXANI-II',
    titulo: 'EXANI-II UAN: examen de admisión enero 2027 | Vorka México',
    descripcion: 'La UAN usa el EXANI-II para sus programas presenciales (pesa 90 % y tu promedio 10 %). Examen para enero 2027: 14 de noviembre de 2026.',
    h1: 'EXANI-II para la UAN',
    lead: 'La Universidad Autónoma de Nayarit usa el EXANI-II de CENEVAL para licenciatura presencial. Esto dice su convocatoria.',
    fuentes: [{ nombre: 'UAN: convocatoria de admisión enero 2027, nivel superior', url: 'https://admision.uan.mx/d/convocatorias/AdmisionUAN2027-Superior-1.pdf' }],
    pide: [['90 % examen, 10 % promedio', 'El examen pesa 90 % y el promedio 10 %.'], ['Programas virtuales', 'Los programas virtuales presentan un examen institucional de conocimientos generales.']],
    fechas: 'Ingreso enero 2027: examen el sábado 14 de noviembre de 2026.',
  },
  uatx: {
    nombre: 'UATx', completo: 'Universidad Autónoma de Tlaxcala (UATx)', art: 'la', estado: 'Tlaxcala', examen: 'EXANI-II',
    titulo: 'EXANI-II UATx: examen de admisión primavera 2027 | Vorka México',
    descripcion: 'La UATx usa el EXANI-II de CENEVAL. Examen de primavera 2027: 3 de diciembre de 2026, presencial.',
    h1: 'EXANI-II para la UATx',
    lead: 'La Universidad Autónoma de Tlaxcala usa el EXANI-II de CENEVAL, presencial. Esto dice su convocatoria.',
    fuentes: [{ nombre: 'UATx: convocatoria de admisión primavera 2027', url: 'https://uatx.mx/admision/admision2027-4-1.pdf' }],
    pide: [['Presencial', 'Se presenta en la facultad o unidad académica.']],
    fechas: 'Primavera 2027: examen el 3 de diciembre de 2026 a las 9:00.',
  },
  uaemex: {
    nombre: 'UAEMéx', completo: 'Universidad Autónoma del Estado de México (UAEMéx)', art: 'la', estado: 'Estado de México', examen: 'EXANI-II',
    titulo: 'EXANI-II UAEMéx: cómo es el examen de admisión | Vorka México',
    descripcion: 'La UAEMéx usa el EXANI-II, con exámenes internos en algunos programas. Qué viene y cómo practicarlo.',
    h1: 'EXANI-II para la UAEMéx',
    lead: 'La Universidad Autónoma del Estado de México usa el EXANI-II de CENEVAL y, en algunos programas, exámenes internos. Esto dice su convocatoria.',
    fuentes: [{ nombre: 'UAEMéx: convocatoria de nuevo ingreso 26B', url: 'https://www.uaemex.mx/images/2026/aspirantes/ingreso/ConvocatoriaNuevoIngresoEP26B.pdf' }, { nombre: 'UAEMéx: guías de estudio', url: 'https://nuevoingreso.uaemex.mx/guiasEstudio' }],
    pide: [['EXANI-II y exámenes internos', 'Las áreas del EXANI-II y, en algunos programas, exámenes internos; el resultado se pondera según el espacio académico.'], ['Presencial', 'Presencial; los programas no escolarizados, en línea desde casa.']],
    fechas: 'Proceso 26B (referencia): registro del 6 al 20 de febrero de 2026.',
  },
  ucol: {
    nombre: 'UCOL', completo: 'Universidad de Colima (UCOL)', art: 'la', estado: 'Colima', examen: 'EXANI-II',
    titulo: 'EXANI-II Universidad de Colima: cómo es | Vorka México',
    descripcion: 'La Universidad de Colima usa el EXANI-II de CENEVAL, presencial en Colima o desde casa para foráneos.',
    h1: 'EXANI-II para la Universidad de Colima',
    lead: 'La Universidad de Colima usa el EXANI-II de CENEVAL. Esto dice su convocatoria general.',
    fuentes: [{ nombre: 'UCOL: convocatoria general de admisión 2026', url: 'https://portal.ucol.mx/content/micrositios/167/file/Convocatoria_General_2026.pdf' }],
    pide: [['Presencial o desde casa', 'Presencial para aspirantes de Colima y desde casa para foráneos.'], ['Carreras específicas', 'Algunas carreras tienen convocatoria propia y fechas aparte.']],
    fechas: 'Proceso 2026 (referencia): examen el 26 y 27 de mayo; resultados el 10 de agosto.',
  },
};

// ---------- selector: todas las universidades y su examen ----------
// [clave, nombre, estado, examen, a dónde mandar (ruta o null), nota]
const SIM = { exani: RUTA + '/', unam: '/simulador-unam/', ipn: '/simulador-ipn/', paa: '/simulador-paa/' };
const SELECTOR = [
  ...Object.entries(UNIVERSIDADES).map(([k, u]) => [k, u.nombre, u.estado, u.examen, `${RUTA}/${k}/`, u.sinModulos ? 'Sin módulos específicos: practica las áreas comunes y el Inglés.' : 'Elige en el simulador los módulos de tu carrera.', 'exani']),
  ['uaz', 'UAZ', 'Zacatecas', 'EXANI-II (confirmado para Ciencias de la Salud)', SIM.exani, 'Para otras áreas, confirma en su convocatoria.', 'exani', 'https://escolar.uaz.edu.mx/wp-content/uploads/2026/02/LINEAMIENTOS-GENERALES-PARA-INGRESO-2026.docx.pdf'],
  ['uaem', 'UAEM', 'Morelos', 'Examen de CENEVAL', SIM.exani, 'Su boletín dice que lo elabora y califica CENEVAL, sin nombrar el examen: confirma en su convocatoria.', 'probable', 'https://uaem.mx/difusion-y-medios/publicaciones/boletines/aplicara-uaem-el-examen-de-admision-al-nivel-superior'],
  ['ujed', 'UJED', 'Durango', 'Examen de CENEVAL', SIM.exani, 'Su comunicado dice «examen CENEVAL» sin nombrar el examen: confirma en su convocatoria.', 'probable', 'https://www.ujed.mx/noticias/2026/04/ujed-abre-proceso-de-admision-2026-y-aplicara-examen-ceneval-el-5-de-junio'],
  ['uat', 'UAT', 'Tamaulipas', 'EXANI-II (por facultad)', SIM.exani, 'Cada facultad pone sus criterios y fechas.', 'exani', 'https://escolares.uat.edu.mx/forms/FrmPDF.aspx?id_pdf=1&tipo=1'],
  ['umsnh', 'UMSNH', 'Michoacán', 'EXANI-II en Medicina, Nutrición y Fisioterapia', SIM.exani, 'Para otras carreras, confirma en su convocatoria.', 'probable', 'https://umich.mx/aspirantes-a-ingresar-a-medicina-nutricion-y-fisioterapia-de-la-umsnh-este-martes-realizaran-examen/'],
  ['uagro', 'UAGro', 'Guerrero', 'CENEVAL o EXADIES, según el programa', SIM.exani, 'Algunos programas aplican CENEVAL y otros su examen propio en línea: revisa tu programa.', 'probable', 'https://dae2.uagro.mx/wp-content/uploads/2026/03/CONVOCATORIA_FINAL_LICENCIATURA_PSU_compressed.pdf'],
  ['unam', 'UNAM', 'Ciudad de México', 'Examen propio de la UNAM', SIM.unam, 'Tiene su propio simulador, por área.', 'otro'],
  ['ipn', 'IPN', 'Ciudad de México', 'Examen propio del IPN', SIM.ipn, 'Tiene su propio simulador, por área.', 'otro'],
  ['udem', 'UDEM', 'Nuevo León', 'PAA', '/simulador-paa/udem/', 'Usa la Prueba de Aptitud Académica.', 'otro'],
  ['tec-de-monterrey', 'Tec de Monterrey', 'Varios estados', 'PAA', '/simulador-paa/tec-de-monterrey/', 'Usa la Prueba de Aptitud Académica.', 'otro'],
  ['udeg', 'UdeG', 'Jalisco', 'PAA', '/simulador-paa/udeg/', 'Usa la Prueba de Aptitud Académica.', 'otro'],
  ['itam', 'ITAM', 'Ciudad de México', 'PAA', '/simulador-paa/itam/', 'Usa la Prueba de Aptitud Académica.', 'otro'],
  ['iteso', 'ITESO', 'Jalisco', 'PAA', '/simulador-paa/iteso/', 'Usa la Prueba de Aptitud Académica.', 'otro'],
  // EXCOBA: mientras su simulador no está a la venta (migración 0086, inactivo) salen como «Próximamente»; ver paginaSelector
  ['uaq', 'UAQ', 'Querétaro', 'EXCOBA (examen propio)', null, 'No es el EXANI-II: es el Examen de Competencias Básicas, con preguntas de arrastrar, elegir varias y escribir números. Estamos preparando su simulador.', 'excoba', 'https://dsa.uaq.mx/index.php/licenciatura/admision'],
  ['ug', 'UG', 'Guanajuato', 'EXCOBA (examen propio)', null, 'Para licenciatura no es el EXANI-II: es el EXCOBA. Estamos preparando su simulador. (Para la prepa de la UG sí es EXANI-I: <a href="/simulador-prepa-ug/">Simulador prepa UG</a>.)', 'excoba', 'https://www.ugto.mx/admisionug/'],
  ['uam', 'UAM', 'Ciudad de México', 'Examen de selección propio', null, 'No es el EXANI-II. Por ahora no tenemos simulador de este examen.', 'sin', 'https://www.admision.uam.mx/'],
  ['uaslp', 'UASLP', 'San Luis Potosí', 'Examen propio de conocimientos', null, 'No es el EXANI-II. Por ahora no tenemos simulador de este examen.', 'sin', 'https://wp.uaslp.mx/noticias/servicios/abre-la-uaslp-convocatoria-para-el-proceso-de-admision-2026/'],
].sort((a, b) => a[1].localeCompare(b[1], 'es'));

const ETIQUETA = { exani: 'Simulador EXANI-II', probable: 'Simulador EXANI-II · confirma', otro: 'Su propio simulador', excoba: 'Próximamente', 'excoba-si': 'Simulador EXCOBA', sin: 'Sin simulador por ahora' };
// Con el Simulador EXCOBA a la venta, la UAQ y la UG mandan a su página (asignaturas por carrera)
const EXCOBA_VIVO = {
  uaq: 'No es el EXANI-II: es el Examen de Competencias Básicas, con preguntas de arrastrar, elegir varias y escribir números. Busca tu carrera y sus 3 asignaturas.',
  ug: 'Para licenciatura no es el EXANI-II: es el EXCOBA. Busca tu carrera y sus 3 asignaturas. (Para la prepa de la UG es EXANI-I: <a href="/simulador-prepa-ug/">Simulador prepa UG</a>.)',
};

export async function paginaSelector(env) {
  const excoba = env ? !!(await productoPorSlug(env, PLANES_EXCOBA.paquete).catch(() => null)) : false;
  const lista = excoba ? SELECTOR.map(f => (EXCOBA_VIVO[f[0]] ? [f[0], f[1], f[2], f[3], `${RUTA_EXCOBA}/${f[0]}/`, EXCOBA_VIVO[f[0]], 'excoba-si', f[7]] : f)) : SELECTOR;
  const filas = lista.map(([k, nombre, estado, examen, ruta, nota, tipo, fuente]) => `<li class="eu-u" data-q="${esc(`${nombre} ${estado} ${examen}`.toLowerCase())}" data-t="${tipo}">
    <div class="eu-u-x"><b>${esc(nombre)}</b><span>${esc(estado)}</span></div>
    <div class="eu-u-e"><b>${esc(examen)}</b><p>${nota}${fuente ? ` <a href="${esc(fuente)}" rel="noopener">Fuente</a>.` : ''}</p></div>
    ${ruta ? `<a class="eu-u-ir t-${tipo}" href="${esc(ruta)}">${esc(ETIQUETA[tipo])} ${FLECHA}</a>` : `<span class="eu-u-ir t-${tipo}">${esc(ETIQUETA[tipo])}</span>`}
  </li>`).join('');
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Simulador EXANI-II', item: `${SITIO}${RUTA}/` },
    { '@type': 'ListItem', position: 2, name: '¿Cuál te sirve?', item: `${SITIO}${RUTA_UNIVERSIDADES}` }] }];
  return pagina({ titulo: `¿Qué examen de admisión pide tu universidad? EXANI-II, PAA, UNAM, IPN${excoba ? ', EXCOBA' : ''} | Vorka México`, ruta: RUTA_UNIVERSIDADES,
    descripcion: 'Busca tu universidad y ve qué examen de admisión pide (EXANI-II, PAA, examen propio) y con qué simulador practicar. Con la fuente oficial de cada una.',
    imagen: `${SITIO}/assets/tienda/v3/simulador-exani-ii-og.jpg`,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>${CSS}`,
    script: SCRIPT_FILTRO,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador EXANI-II</a> / ¿Cuál te sirve?</nav>
  <h1 class="t-h1">¿Qué simulador te sirve para tu universidad?</h1>
  <p class="t-lead">No necesitas un simulador por universidad. Muchas públicas usan el mismo examen, el EXANI-II de CENEVAL, y con un solo simulador eliges los módulos que pide la tuya. Busca tu universidad y te decimos qué examen pide y con qué practicar.</p>
  <label class="eu-buscar"><span class="vh">Busca tu universidad</span><input type="search" id="eu-q" placeholder="Escribe tu universidad o tu estado" autocomplete="off"></label>
</div></section>
<section class="t-sec suave"><div class="marco">
  <ul class="eu-lista" id="eu-lista">${filas}</ul>
  <p class="eu-vacio" id="eu-vacio" hidden>No la tenemos en la lista todavía. Revisa en su convocatoria qué examen pide y escríbenos a hola@vorka.mx: la agregamos.</p>
  <p class="pu-nota">Revisado el ${VERIFICADO} en las convocatorias y páginas oficiales de cada universidad y de CENEVAL. Los procesos cambian cada año: confirma siempre en la convocatoria vigente. «Confirma» quiere decir que la fuente oficial dice CENEVAL pero no nombra el EXANI-II.</p>
</div></section>
<section class="t-sec"><div class="marco"><p class="t-nota">Página informativa de Vorka México. No estamos afiliados a CENEVAL, al College Board ni a ninguna universidad.</p></div></section>`,
  });
}

export async function paginaExaniUniversidad(env, clave) {
  const u = UNIVERSIDADES[clave];
  if (!u) return null;
  const { tarjeta, barra } = await compraSimulador(env, { app: 'simulador-exani-ii', nombre: 'Simulador EXANI-II', para: `para ${u.art} ${u.nombre}` });
  const ruta = `${RUTA}/${clave}/`;
  const faq = [
    { p: `¿Qué examen pide ${u.art} ${u.nombre} para licenciatura?`, r: `${u.examen}, de CENEVAL. ${u.pide[0][1]}` },
    { p: '¿Cuándo es el examen?', r: u.fechas },
    { p: '¿El simulador de Vorka es el examen oficial?', r: `No. Es un simulador de práctica con reactivos originales que siguen la estructura del EXANI-II. No estamos afiliados a CENEVAL ni ${u.art === 'el' ? 'al' : 'a la'} ${u.completo}.` },
  ];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Simulador EXANI-II', item: `${SITIO}${RUTA}/` },
      { '@type': 'ListItem', position: 2, name: `EXANI-II ${u.nombre}`, item: `${SITIO}${ruta}` }] },
  ];
  const modulos = u.modulos ? `<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">Tus módulos</span><h2 class="h2" style="margin-top:14px">${esc(u.modulosTitulo || 'Qué módulos elegir en el simulador')}</h2>${u.modulosNota ? `<p class="lead">${esc(u.modulosNota)}</p>` : ''}</div>
  <table class="pu-tabla eu-mod"><thead><tr><th scope="col">${clave === 'buap' ? 'Área' : 'Carrera o facultad'}</th><th scope="col">Módulos</th><th scope="col">En el simulador</th></tr></thead>
  <tbody>${u.modulos.map(([c, p, t]) => `<tr><th scope="row">${esc(c)}</th><td data-c="Módulos">${esc(t)}</td><td data-c="En el simulador">${p ? `<b>${esc(nombrePareja(p))}</b>` : '<span class="eu-no">Áreas comunes</span>'}</td></tr>`).join('')}</tbody></table>
</div></section>` : u.sinModulos ? `<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">En el simulador</span><h2 class="h2" style="margin-top:14px">Cómo practicar para ${u.art} ${esc(u.nombre)}</h2>
  <p class="lead">Como ${u.art} ${esc(u.nombre)} no pide módulos específicos, enfócate en las áreas comunes y el Inglés: practícalas por separado en el simulador. Esto es consejo nuestro.</p></div>
</div></section>` : `<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">Tus módulos</span><h2 class="h2" style="margin-top:14px">Cómo saber qué módulos te tocan</h2>
  <p class="lead">Los módulos dependen de tu carrera y vienen en la convocatoria o en la guía de ${u.art} ${esc(u.nombre)}. Cuando los sepas, elígelos en el simulador: trae ${esc('Ciencias experimentales, Ciencias sociales, Biología, Ciencias de la salud, Química, Física, Aritmética, Probabilidad y estadística, Administración e Historia')}.</p></div>
</div></section>`;
  return pagina({ titulo: u.titulo, ruta, descripcion: u.descripcion, imagen: `${SITIO}/assets/tienda/v3/simulador-exani-ii-og.jpg`,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>${CSS}${CSS_COMPRA}`,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador EXANI-II</a> / <a href="${RUTA_UNIVERSIDADES}">Universidades</a> / ${esc(u.nombre)}</nav>
  <h1 class="t-h1">${esc(u.h1)}</h1>
  <p class="t-lead">${esc(u.lead)}</p>
  ${tarjeta}
  <p class="pu-fuente">${u.fuentes.length > 1 ? 'Fuentes' : 'Fuente'}: ${u.fuentes.map(x => `<a href="${esc(x.url)}" rel="noopener">${esc(x.nombre)}</a>`).join('; ')}. Revisado el ${VERIFICADO}. Confirma siempre los requisitos vigentes con ${u.art} ${esc(u.nombre)}.</p>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">Lo que dice la fuente</span><h2 class="h2" style="margin-top:14px">Cómo es el examen ${u.art === 'el' ? 'del' : 'de la'} ${esc(u.nombre)}</h2></div>
  <div class="pu-grid">${u.pide.map(([t, p]) => `<div class="pu-card"><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
  <p class="pu-nota">${CHECK.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} ${esc(u.fechas)}</p>
</div></section>
${modulos}
<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">El EXANI-II en general</span><h2 class="h2" style="margin-top:14px">Lo que trae el examen</h2></div>
  <ul class="pu-grid" style="list-style:none;padding:0">
    <li class="pu-card"><h3>Tres áreas comunes</h3><p>Comprensión lectora, Redacción indirecta y Pensamiento matemático: 30 reactivos cada una.</p></li>
    <li class="pu-card"><h3>Dos módulos</h3><p>De 24 reactivos cada uno, según tu carrera. Con las tres áreas forman el puntaje global (138 reactivos).</p></li>
    <li class="pu-card"><h3>Inglés</h3><p>30 reactivos de nivel B1. Es diagnóstico: no entra al puntaje global.</p></li>
  </ul>
  <p class="pu-nota">Estructura general de la <a href="${CENEVAL_EXANI}" rel="noopener">página oficial del EXANI-II de CENEVAL</a>: una sesión de máximo 4 horas y media, con tres opciones por reactivo. Cada universidad puede usar una versión propia, como dice arriba.</p>
  <div class="pu-botones"><a class="btn acento" href="${RUTA}/?plan=paquete#comprar">Comprar el simulador EXANI-II ${FLECHA}</a><a class="btn blanco" href="${RUTA_UNIVERSIDADES}">Ver otras universidades</a></div>
</div></section>

<section class="t-sec"><div class="marco">
  <div><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">EXANI-II y ${esc(u.nombre)}</h2></div>
  <div class="t-faq" style="margin-top:22px">${faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
</div></section>

<section class="t-sec"><div class="marco"><p class="t-nota">Página informativa de Vorka México. No estamos afiliados ${u.art === 'el' ? 'al' : 'a la'} ${esc(u.completo)} ni a CENEVAL; EXANI-II es un examen de CENEVAL. Los datos salen de las fuentes oficiales citadas arriba y pueden cambiar.</p></div></section>${barra}`,
  });
}

const SCRIPT_FILTRO = `(function(){var q=document.getElementById('eu-q'),l=document.getElementById('eu-lista'),v=document.getElementById('eu-vacio');if(!q||!l)return;
var n=function(s){return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();};
q.addEventListener('input',function(){var t=n(q.value.trim()),k=0;l.querySelectorAll('.eu-u').forEach(function(li){var ok=!t||n(li.dataset.q).indexOf(t)>=0;li.hidden=!ok;if(ok)k++;});v.hidden=k>0;});})();`;

const CSS = `<style>
.pu-hero{padding:clamp(12px,3vw,40px) 0 clamp(32px,4vw,56px)}
.pu-hero h1{margin-top:14px;max-width:820px}.pu-hero .t-lead{margin-top:14px;max-width:720px}
.pu-fuente{margin-top:16px;font-size:14px;color:var(--fg-2);max-width:720px}.pu-fuente a{color:var(--morado)}
.pu-botones{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pu-tabla{width:100%;border-collapse:collapse;margin-top:22px;font-size:15.5px;background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra)}
.pu-tabla th,.pu-tabla td{text-align:left;padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:top}
.pu-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650}
.eu-mod td{color:var(--fg-2)}.eu-mod td b{color:var(--fg)}.eu-no{color:var(--fg-2)}
@media(max-width:640px){.pu-tabla thead{display:none}.pu-tabla tr{display:block;padding:8px 0;border-bottom:1px solid var(--line)}.pu-tabla th{display:block;border:0;padding-bottom:4px}.pu-tabla td{display:block;border:0;padding:4px 16px}.pu-tabla td::before{content:attr(data-c);display:block;font-size:12px;font-weight:600;color:var(--fg-2)}}
.pu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:14px;margin-top:24px}
.pu-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px;box-shadow:var(--sombra)}
.pu-card h3{font-size:17.5px;letter-spacing:-.02em;margin-bottom:6px}.pu-card p{color:var(--fg-2);font-size:15.5px}
.pu-nota{margin-top:14px;font-size:14px;color:var(--fg-2)}.pu-nota a{color:var(--morado)}
.eu-buscar{display:block;margin-top:22px;max-width:520px}
.eu-buscar input{width:100%;font:inherit;font-size:17px;padding:14px 18px;border-radius:14px;border:1.5px solid var(--line-2);background:var(--card);color:var(--fg)}
.eu-buscar input:focus{outline:2px solid var(--fg);outline-offset:1px}
.eu-lista{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.eu-u{display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr) auto;gap:8px 18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px}
.eu-u[hidden]{display:none}
.eu-u-x{display:flex;flex-direction:column;min-width:0}.eu-u-x b{font-size:18px;letter-spacing:-.01em}.eu-u-x span{font-size:13.5px;color:var(--fg-2)}
.eu-u-e{min-width:0}.eu-u-e b{font-size:15.5px}.eu-u-e p{margin:2px 0 0;font-size:14px;color:var(--fg-2)}.eu-u-e a{color:var(--morado)}
.eu-u-ir{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:700;text-decoration:none;color:var(--fg);white-space:nowrap}
.eu-u-ir svg{width:16px;height:16px}.eu-u-ir.t-excoba,.eu-u-ir.t-sin{color:var(--fg-2);font-weight:600}
@media(max-width:700px){.eu-u{grid-template-columns:1fr}.eu-u-ir{white-space:normal}}
.eu-vacio{margin-top:14px;color:var(--fg-2)}
</style>`;
