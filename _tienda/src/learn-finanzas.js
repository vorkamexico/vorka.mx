// Vorka Learn › Finanzas personales (vorka.mx/learn/finanzas/…): guías de dinero para el día a día, con la misma plantilla
// editorial que las guías de exámenes (paginaArticulo en src/learn.js). Las rutas, la portada y el sitemap las conecta
// src/simulador/guias.js (rutasLearn, paginaLearnPortada, urlsGuias).
// Reglas (tema de dinero, política de la organización: sin inventar datos):
//  - Todo dato concreto (definiciones, reglas, plazos, derechos) sale de la fuente oficial que el artículo cita en «Fuentes»
//    (Banxico, CONDUSEF, leyes en diputados.gob.mx, DOF), revisadas el 31 de octubre de 2026. Lo que es consejo nuestro se
//    presenta como tal.
//  - Sin tasas «actuales» ni nombres de bancos, tarjetas o productos de terceros. Los números son ejemplos propios, marcados,
//    con cifras inventadas y la operación a la vista (la aritmética la revisa test/learn-finanzas.test.js).
//  - Un solo llamado final por artículo. Cuentas (/tienda/cuentas/) solo donde encaja de verdad: lleva el registro de lo que
//    PRESTAS a familiares y amigos; no presta, no mueve dinero, no negocia deudas y no organiza tandas (ver src/cuentas.js).
//  - Aviso al final de cada artículo: información general con fines educativos; no es asesoría financiera personalizada.
import { esc } from './paginas.js';
import { FLECHA } from './marco.generado.js';
import { paginaLearn, paginaArticulo, SITIO, RUTA_LEARN, p, ul, ol, tabla, nota, caja, a, ld, ORG, SITIO_LEARN, tarjeta, migas, migasLd, conMarca, textoPlano } from './learn.js';
import { espacioAnuncio } from './anuncios.js';

export const ACTUALIZADO_FIN = '2026-10-31';
const ACTUALIZADO_TXT = 'octubre de 2026';
export const OG_FINANZAS = `${SITIO}/img/ciudades/cdmx-reforma-1600.webp`;
export const AVISO_FINANZAS = 'Información general con fines educativos; no es asesoría financiera personalizada.';

export const FINANZAS = {
  clave: 'finanzas', nombre: 'Finanzas personales', corto: 'Finanzas',
  indice: {
    titulo: 'Finanzas personales: guías claras con fuentes',
    descripcion: 'Guías de finanzas personales: cómo funciona tu tarjeta de crédito, cómo prestar sin pleitos, cómo organizar una tanda y cómo salir de deudas.',
    h1: 'Guías de finanzas personales',
    lead: 'Tarjetas, préstamos entre conocidos, tandas y deudas, explicados sin tecnicismos y con lo que publican Banxico, CONDUSEF y las leyes que aplican.',
  },
};
export const RUTA_FINANZAS = '/learn/finanzas/';

// ---------- fuentes (todas revisadas el 31 de octubre de 2026) ----------
const F = {
  banxicoTerminos: { nombre: 'Banco de México, Comparador Crediticio: términos financieros de las tarjetas de crédito', url: 'https://comparador.banxico.org.mx/ComparadorCrediticio/terminos-tarjeta-de-credito.jsp' },
  banxicoReglas: { nombre: 'Banco de México: Circular 34/2010, Reglas de tarjetas de crédito (texto compilado; regla 4.1, pago mínimo, y 3.4, cargos no reconocidos)', url: 'https://www.banxico.org.mx/marco-normativo/normativa-emitida-por-el-banco-de-mexico/circular-34-2010/%7B0C55B906-6DB4-6B88-FED0-67987E9FB3CC%7D.pdf' },
  ltosf: { nombre: 'Ley para la Transparencia y Ordenamiento de los Servicios Financieros (artículo 3, definición de CAT)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LTOSF.pdf' },
  condusefEdoCta: { nombre: 'CONDUSEF, revista Proteja su Dinero: El nuevo estado de cuenta universal de tarjeta de crédito (abril de 2024)', url: 'https://revista.condusef.gob.mx/credito/2024/04/el-nuevo-estado-de-cuenta-universal-de-tarjeta-de-credito/' },
  condusefNo: { nombre: 'CONDUSEF, revista Proteja su Dinero: Cómo decir «no» cuando te piden prestado, sin romper la relación (febrero de 2026)', url: 'https://revista.condusef.gob.mx/usuario-inteligente/economia-joven/2026/02/limitesfinancieros/' },
  condusefRedFlags: { nombre: 'CONDUSEF, revista Proteja su Dinero: Red flags (alertas financieras) (febrero de 2026)', url: 'https://revista.condusef.gob.mx/destacados/2026/02/red-flags-alertas-financieras' },
  condusefAmistad: { nombre: 'CONDUSEF, revista Proteja su Dinero: Amor, amistad y dinero (febrero de 2026)', url: 'https://revista.condusef.gob.mx/usuario-inteligente/tu-bolsillo/2026/02/amor-amistad-y-dinero/' },
  ccf: { nombre: 'Código Civil Federal (artículos 2384, el mutuo, y 2395, el interés)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CCF.pdf' },
  lgtoc: { nombre: 'Ley General de Títulos y Operaciones de Crédito (artículo 170, requisitos del pagaré)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LGTOC.pdf' },
  condusefTanda: { nombre: 'CONDUSEF, revista Proteja su Dinero, núm. 290: ¿Y mi tanda? ¡Evita que te den baje! (2024)', url: 'https://revista.condusef.gob.mx/wp-content/uploads/2024/05/tanda_290.pdf' },
  condusefAhorro: { nombre: 'CONDUSEF, revista Proteja su Dinero: Ahorro (octubre de 2025)', url: 'https://revista.condusef.gob.mx/ahorro-general/2025/10/ahorro-2/' },
  condusefUrge: { nombre: 'CONDUSEF, revista Proteja su Dinero: Te urge liquidar tus deudas (enero de 2023)', url: 'https://revista.condusef.gob.mx/usuario-inteligente/buro-de-entidades-financieras/2023/01/te-urge-liquidar-tus-deudas/' },
  condusefLiberate: { nombre: 'CONDUSEF, revista Proteja su Dinero: Libérate del peso financiero (marzo de 2025)', url: 'https://revista.condusef.gob.mx/usuario-inteligente/primer-plano/2025/03/pp-marzo/' },
  condusefSalirGob: { nombre: 'CONDUSEF: ¿Cómo salir de deudas? (enero de 2017)', url: 'https://www.gob.mx/condusef/articulos/como-salir-de-deudas?idiom=es' },
  condusefSalir: { nombre: 'CONDUSEF, revista Proteja su Dinero: Cómo salir de deudas sin morir en el intento (octubre de 2016)', url: 'https://revista.condusef.gob.mx/credito/deudas/2016/10/como-salir-de-deudas-sin-morir-en-el-intento/' },
  condusefQuitas: { nombre: 'CONDUSEF, revista Proteja su Dinero: Opciones para liquidar tu deuda: consolidaciones, reestructuraciones y quitas (2017)', url: 'https://revista.condusef.gob.mx/wp-content/uploads/2017/05/PDF-s_2017_207_deuda.pdf' },
  condusefBuro: { nombre: 'CONDUSEF: Alerta por páginas que ofrecen borrarte del Buró de Crédito (julio de 2017)', url: 'https://www.gob.mx/condusef/prensa/alerta-condusef-por-paginas-que-ofrecen-borrarte-del-buro-de-credito' },
  lrsic: { nombre: 'Ley para Regular las Sociedades de Información Crediticia (artículos 23, 41 y 42)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LRSIC.pdf' },
  dofCobranza: { nombre: 'Diario Oficial de la Federación: Disposiciones de carácter general aplicables a las entidades financieras en materia de despachos de cobranza (CONDUSEF, 2014)', url: 'https://dof.gob.mx/nota_detalle_popup.php?codigo=5362845' },
};

// ---------- piezas ----------
// Ejemplo numérico: siempre propio, con cifras inventadas y marcado como tal
const ejemplo = (titulo, html) => `<div class="gu-ej"><span class="gu-ej-t">Ejemplo propio de Vorka Learn, con cifras inventadas</span>
<p class="gu-ej-p">${titulo}</p>${html}</div>`;
const r = slug => `${RUTA_FINANZAS}${slug}/`;
const S = { tarjeta: 'como-funciona-una-tarjeta-de-credito', prestar: 'como-prestar-dinero-a-un-familiar-o-amigo', tanda: 'como-organizar-una-tanda', deudas: 'como-salir-de-deudas' };

// Llamados finales (uno por artículo). Cuentas se describe con lo que de verdad hace (src/cuentas.js y /legal/cuentas/).
const final = (etiqueta, t, d, href, boton) => `<aside class="lr-final" aria-label="${esc(etiqueta)}"><p><b class="lr-final-t">${t}</b>${d}</p>
  <a class="btn tinta" href="${href}">${boton} ${FLECHA}</a></aside>`;
const LLAMADO = {
  // Encaja directo: el artículo es sobre prestar y Cuentas lleva el registro de lo que prestas
  cuentas: final('Lleva la cuenta de lo que prestas', '¿Ya prestaste? Lleva la cuenta en orden',
    'Cuentas, de Vorka México, es una app para registrar el dinero que prestas a familiares y amigos: cada abono, cuánto falta y, si pactaron interés, cuánto fue a interés y cuánto a capital. Puedes compartir a la otra persona un enlace de solo lectura con su saldo. Con un préstamo activo es gratis. No presta ni mueve dinero y no sustituye un contrato.',
    '/tienda/cuentas/', 'Conoce Cuentas'),
  // Encaja solo en una parte: deudas con familiares o amigos. Se dice qué NO hace.
  cuentasDeudor: final('Si le debes a alguien cercano', '¿Parte de tu deuda es con alguien de tu familia?',
    'Cuando la cuenta es clara para los dos, es más fácil cumplir sin pleitos. Con Cuentas, de Vorka México, quien presta registra cada abono y te puede compartir un enlace de solo lectura con tu saldo al día. Cuentas no negocia con bancos, no presta dinero y no borra deudas.',
    '/tienda/cuentas/', 'Conoce Cuentas'),
  // Cuentas no tiene que ver con tarjetas: el siguiente paso útil es la guía de deudas
  deudas: final('Siguiente guía', '¿Ya traes un saldo que no alcanzas a liquidar?',
    'Si tu tarjeta ya se volvió una deuda, te explicamos cómo ordenarla, negociar con tu banco y cuidar tu historial, paso a paso.',
    r(S.deudas), 'Lee: cómo salir de deudas'),
  // Cuentas no organiza tandas: el siguiente paso útil es la guía de préstamos entre conocidos
  prestar: final('Siguiente guía', '¿También te piden prestado?',
    'Una tanda y un préstamo entre conocidos tienen el mismo reto: acuerdos claros y por escrito. Te explicamos cómo prestar sin perder la relación.',
    r(S.prestar), 'Lee: cómo prestar sin pleitos'),
};

// ---------- los artículos ----------
export const ARTICULOS_FINANZAS = [
  // =============== 1. Tarjeta de crédito ===============
  {
    slug: S.tarjeta, llamado: 'deudas',
    titulo: 'Cómo funciona una tarjeta de crédito',
    descripcion: 'Fecha de corte, fecha límite, pago mínimo, pago para no generar intereses, CAT y anualidad, explicados con lo que publican Banxico y CONDUSEF.',
    h1: 'Cómo funciona una tarjeta de crédito: fechas, pagos e intereses',
    lead: 'Una tarjeta de crédito es un préstamo que puedes usar una y otra vez hasta un límite. Si entiendes dos fechas y dos montos de tu estado de cuenta, puedes usarla sin pagar intereses; si no, te puede salir cara. Aquí está cómo funciona, con lo que publican Banxico y CONDUSEF.',
    secciones: [
      { h2: 'Lo básico: tu línea de crédito', html: p('Cuando te dan una tarjeta, el banco te fija una <b>línea de crédito</b> (o límite de crédito): lo máximo que te presta. Banxico lo explica así: lo que ya usaste se resta de ese límite, y a la diferencia se le llama <b>crédito disponible</b>. Cuando pagas, el disponible vuelve a crecer.')
        + p('No es dinero extra: es dinero prestado que tienes que devolver. Lo que cambia todo es <b>cuándo</b> y <b>cuánto</b> pagas.') },
      { h2: 'Fecha de corte y fecha límite de pago', html: tabla(['Fecha', 'Qué es'], [
          ['Fecha de corte', 'Según Banxico, es el día de cada mes en que termina la contabilización de los cargos del periodo. Lo que compraste hasta ese día entra en el estado de cuenta.'],
          ['Fecha límite de pago', 'El último día para pagar lo de ese periodo. Banxico explica que normalmente cae dentro de los 20 días naturales posteriores al corte; la fecha exacta viene en tu estado de cuenta.'],
        ])
        + p('Por eso una compra hecha justo después del corte tarda más en cobrarse que una hecha justo antes: entra hasta el siguiente estado de cuenta.')
        + ejemplo('Si tu corte es el 10 de cada mes y tu fecha límite el 30, ¿cuánto tiempo tienes para pagar cada compra sin intereses?', ul([
          'Compra del <b>9 de marzo</b>: entra en el corte del 10 de marzo y la pagas a más tardar el 30 de marzo, <b>21 días</b> después.',
          'Compra del <b>11 de marzo</b>: entra hasta el corte del 10 de abril y la pagas a más tardar el 30 de abril, <b>50 días</b> después (20 días que quedan de marzo + 30 de abril).',
        ]) + nota('Funciona así solo si liquidas el total cada mes. Si arrastras saldo, empiezas a pagar intereses.')) },
      { h2: 'Pago mínimo y pago para no generar intereses', html: p('Tu estado de cuenta trae dos montos que conviene no confundir:')
        + ul([
          '<b>Pago para no generar intereses.</b> Es lo que tienes que pagar antes de la fecha límite para no pagar intereses en ese periodo. Banxico llama «totalero» a quien paga el saldo total del periodo antes de la fecha límite: no paga ningún interés.',
          '<b>Pago mínimo.</b> Banxico lo define como la cantidad mínima a pagar cada periodo para que se considere que estás al corriente. No liquida tu deuda: sobre lo que dejas sin pagar se siguen cobrando intereses.',
        ])
        + caja('Cómo se calcula el pago mínimo en México', p('Las reglas de tarjetas de crédito de Banxico (regla 4.1) dicen que el pago mínimo es el <b>mayor</b> de estos dos montos:')
          + ul(['El 1.5 % del saldo de tu tarjeta al corte (sin intereses ni IVA), <b>más</b> los intereses del periodo y su IVA.', 'El 1.25 % de tu límite de crédito.'])
          + p('Si eso es más que lo que debes, te cobran solo lo que debes. Y cada banco puede pedir un pago mínimo más alto que ese (regla 4.2).'))
        + ejemplo('Tienes un límite de crédito de $20,000 y debes $10,000. Supón que el banco te cobró $500 de intereses del periodo (con una tasa anual de 60 % inventada para el ejemplo) y $80 de IVA de esos intereses (16 %). ¿Cuál es el pago mínimo según la regla de Banxico?', ul([
          'Opción a: 1.5 % de $10,000 = $150, más $500 de intereses y $80 de IVA = <b>$730</b>.',
          'Opción b: 1.25 % de $20,000 = <b>$250</b>.',
          'Se toma la mayor: el pago mínimo es de <b>$730</b>. De esos $730, solo $150 bajan tu deuda; los otros $580 son intereses e IVA.',
        ]) + nota('Por eso pagar solo el mínimo alarga la deuda: la mayor parte del pago se va en intereses.')) },
      { h2: 'Cómo se calculan los intereses', html: p('Banxico explica que los intereses del periodo se calculan aplicando la tasa de interés al <b>saldo promedio diario</b> de tu deuda en ese periodo. Para sacar la tasa diaria, divide la tasa anual ordinaria entre 360.')
        + ejemplo('Debes en promedio $10,000 durante un periodo de 30 días y tu tasa anual es de 60 % (inventada). ¿Cuánto pagas de intereses?', ul([
          'Tasa diaria: 60 % ÷ 360 = 0.1667 % al día.',
          'Intereses: $10,000 × 60 % ÷ 360 × 30 días = <b>$500</b>, más el IVA de los intereses.',
        ]) + nota('Es el mismo dato del ejemplo del pago mínimo. Tu tasa real viene en tu estado de cuenta y en tu contrato.'))
        + p('Si pagas tarde, además puede haber una <b>comisión por pago tardío</b>: Banxico la describe como la que se cobra por pagar después de la fecha límite.') },
      { h2: 'El CAT y la anualidad', html: p('El <b>CAT</b> (Costo Anual Total) es, según la Ley para la Transparencia y Ordenamiento de los Servicios Financieros, el costo anual total del financiamiento expresado en porcentaje que, <b>para fines informativos y de comparación</b>, incluye todos los costos y gastos del crédito. Sirve para comparar una tarjeta contra otra: a igualdad de lo demás, un CAT más bajo significa un crédito más barato.')
        + p('Banxico aclara que el CAT de la publicidad es un promedio que asume que no te atrasas en tus pagos, así que no necesariamente es lo que tú vas a pagar.')
        + p('La <b>anualidad</b> es, según Banxico, la comisión que se cobra cada año por tener la tarjeta titular. Hay tarjetas sin anualidad. Si siempre pagas el total, la tasa de interés casi no te afecta y la anualidad pesa más; si arrastras saldo, pesa más la tasa (esto ya es consejo nuestro).') },
      { h2: 'Cómo leer tu estado de cuenta', html: p('CONDUSEF explicó en 2024 el formato de estado de cuenta estandarizado para las tarjetas de crédito de personas físicas. Estos son los datos que te conviene buscar:')
        + tabla(['Dato', 'Para qué te sirve'], [
          ['Pago para no generar intereses', 'Lo que necesitas pagar antes de la fecha límite para no pagar intereses.'],
          ['Pago mínimo', 'Lo mínimo para estar al corriente. No es la meta.'],
          ['Fecha de corte y fecha límite de pago', 'Para planear tus compras y no pagar tarde.'],
          ['CAT y tasa de interés anual', 'Cuánto te cuesta el crédito si no pagas el total.'],
          ['Saldo, límite y crédito disponible', 'Cuánto debes y cuánto te queda.'],
          ['Compras a meses', 'Cuánto falta de cada compra diferida y cuántos pagos te quedan.'],
          ['Intereses y comisiones', 'Lo que te cobraron en el periodo y en lo que va del año, incluida la anualidad.'],
          ['Simulación del pago mínimo', 'Cuánto tardarías y cuánto pagarías de intereses si solo pagas el mínimo (o dos a cinco veces el mínimo).'],
          ['Cargos no reconocidos', 'El folio y el estado de tus aclaraciones.'],
        ])
        + p('Revisa también cada movimiento. Si ves un cargo que no hiciste, repórtalo a tu banco cuanto antes. Según las reglas de Banxico (regla 3.4), si avisas dentro de los <b>90 días naturales</b> siguientes al cargo, el banco debe abonarte ese monto a más tardar el segundo día hábil, salvo que te entregue un dictamen que compruebe que la operación se hizo correctamente.') },
      { h2: 'Errores comunes', html: ol([
        ['Pagar siempre solo el mínimo', 'Te mantiene al corriente, pero la deuda baja muy despacio y pagas muchos intereses.'],
        ['Confundir la fecha de corte con la fecha límite', 'El corte cierra el periodo; la fecha límite es para pagar. Anota las dos.'],
        ['Sacar efectivo con la tarjeta', 'CONDUSEF recomienda evitarlo por su costo, porque cobra comisiones.'],
        ['Comprar a meses sin hacer cuentas', 'CONDUSEF lo resume así: lo que compres debe durar más que el tiempo que tardas en pagarlo. Además, las mensualidades se suman a tu pago de cada mes.'],
        ['Tratar el límite como si fuera tu dinero', 'CONDUSEF lo recuerda: la tarjeta no es dinero extra de tus ingresos.'],
      ]) },
    ],
    faq: [
      { p: '¿Qué pasa si solo pago el mínimo de mi tarjeta?', r: 'Sigues al corriente, pero lo que no pagas genera intereses. Con la regla de Banxico, el pago mínimo incluye los intereses del periodo y su IVA, así que solo una parte pequeña baja tu deuda.' },
      { p: '¿Cuál es la diferencia entre la fecha de corte y la fecha límite de pago?', r: 'La fecha de corte es el día en que se cierra el periodo y se suman tus compras. La fecha límite es el último día para pagar lo de ese periodo; según Banxico, normalmente cae dentro de los 20 días naturales siguientes al corte.' },
      { p: '¿Cómo se calcula el pago mínimo en México?', r: 'Según la regla 4.1 de Banxico, es el mayor entre el 1.5 % del saldo al corte más los intereses y su IVA, y el 1.25 % de tu límite de crédito. Cada banco puede pedir un mínimo más alto.' },
      { p: '¿Qué es el CAT?', r: 'Es el Costo Anual Total: el costo del crédito en porcentaje anual, con todos sus costos y gastos, para fines informativos y de comparación. Sirve para comparar tarjetas; el de la publicidad asume que no te atrasas.' },
    ],
    fuentes: [F.banxicoTerminos, F.banxicoReglas, F.ltosf, F.condusefEdoCta],
    relacionadas: [S.deudas, S.prestar, S.tanda],
  },

  // =============== 2. Prestar a un familiar o amigo ===============
  {
    slug: S.prestar, llamado: 'cuentas',
    titulo: 'Cómo prestar dinero a un familiar sin perder la relación',
    descripcion: 'Qué preguntarte antes de prestar, cómo dejar el acuerdo por escrito, poner plazos, llevar la cuenta y qué hacer si no te pagan, con consejos de CONDUSEF.',
    h1: 'Cómo prestarle dinero a un familiar o amigo sin perder la relación',
    lead: 'Prestar a alguien cercano es fácil; lo difícil es cobrar sin que se rompa la relación. Lo que más ayuda es decidir con calma, dejar todo por escrito y llevar la cuenta clara. Aquí te decimos cómo, con lo que recomienda CONDUSEF.',
    secciones: [
      { h2: 'Antes de prestar: hazte estas preguntas', html: p('CONDUSEF sugiere pensarlo antes de decir que sí. Estas preguntas salen de sus recomendaciones:')
        + ul([
          '¿Puedo prestar sin poner en riesgo mi propia estabilidad?',
          '¿Tiene un plan realista para pagarme?',
          '¿El motivo es claro, o la historia cambia cada vez que la cuenta?',
          '¿Es la primera vez que me pide, o ya es costumbre?',
          '¿Podemos hablar claro de dinero, plazos y compromisos?',
        ])
        + p('Según CONDUSEF, si varias de estas preguntas te generan dudas, probablemente lo más sano sea decir que no. Y si no es posible hablar de dinero con esa persona, no conviene prestarle.') },
      { h2: 'Presta solo lo que podrías perder', html: p('Es la regla que CONDUSEF repite: nunca prestes más dinero del que estés dispuesto a perder. También recuerda que el dinero que prestas sale de tu ahorro, así que mientras está prestado deja de generarte rendimientos.')
        + p('Una forma práctica de verlo (consejo nuestro): si esa persona no te pagara nunca, ¿podrías seguir con tus gastos y seguir queriéndola igual? Si la respuesta es no, presta menos o no prestes.') },
      { h2: 'Deja el acuerdo por escrito', html: p('CONDUSEF recomienda un contrato por escrito, porque ayuda a evitar malentendidos y protege a las dos partes: ahí deben quedar los montos, las condiciones y los plazos, y se puede complementar con pagarés. Si eso se siente demasiado formal, por lo menos deja el compromiso en algo sencillo, como un mensaje de texto.')
        + p('Lo que conviene anotar (lista nuestra):')
        + ul(['Quién presta y quién recibe, con nombre completo.', 'Cuánto se prestó y en qué fecha se entregó.', 'Cómo se va a pagar: en una sola vez o en abonos, de cuánto y en qué fechas.', 'Si hay interés o no, y de cuánto.', 'Qué pasa si un pago se atrasa.', 'Cómo se va a pagar (transferencia, depósito o efectivo con recibo).'])
        + caja('Lo que dice la ley, en general', p('El Código Civil Federal llama <b>mutuo</b> al contrato en el que alguien transfiere una suma de dinero a otra persona, que se obliga a devolver otro tanto (artículo 2384). Cada estado tiene su propio código civil.')
          + p('El <b>pagaré</b> es un documento distinto. Según la Ley General de Títulos y Operaciones de Crédito (artículo 170), debe decir que es un pagaré, tener la promesa incondicional de pagar una suma determinada, el nombre de a quién se paga, la época y el lugar del pago, la fecha y el lugar en que se firma, y la firma de quien se obliga.')
          + p('Esto es información general, no asesoría legal. Para montos importantes, consulta a un abogado de tu estado.')) },
      { h2: '¿Con intereses o sin intereses?', html: p('Entre conocidos, muchos préstamos son sin interés, y está bien. Si deciden cobrar interés, déjenlo por escrito y con números que los dos entiendan. Como referencia, el Código Civil Federal dice que el interés legal es del 9 % anual, que las partes pueden pactar otro, y que si el interés es tan desproporcionado que parece abuso, un juez puede reducirlo (artículo 2395).')
        + ejemplo('Prestas $12,000 a seis meses. ¿Cómo quedan los pagos sin interés y con un interés simple de 12 % anual?', ul([
          '<b>Sin interés, en seis abonos:</b> $12,000 ÷ 6 = <b>$2,000 al mes</b>.',
          '<b>Con 12 % anual simple, en un solo pago al sexto mes:</b> interés = $12,000 × 12 % × 6 ÷ 12 = $720. Te devuelven <b>$12,720</b>.',
        ]) + nota('Las cifras son inventadas y no son una recomendación de tasa.')) },
      { h2: 'Lleva la cuenta de cada abono', html: p('La mayoría de los pleitos no son por el préstamo, sino por los números: «yo ya te había pagado eso». Lo que ayuda (consejo nuestro):')
        + ol([
          ['Anota cada abono el mismo día', 'Fecha, monto y forma de pago. Guarda el comprobante de cada transferencia.'],
          ['Que los dos vean la misma cuenta', 'Compartan el saldo de vez en cuando, sin reclamos: «llevamos tanto, faltan tanto».'],
          ['Si cambian el plan, actualícenlo por escrito', 'Un nuevo plazo o un abono menor también se anota.'],
        ]) },
      { h2: 'Qué hacer si no te pagan', html: ol([
        ['Habla pronto y en privado', 'Pregunta qué pasó antes de reclamar. A veces hay una razón y se puede reacomodar.'],
        ['Propón un plan nuevo y déjalo por escrito', 'Más tiempo o abonos más chicos es mejor que nada. Anota el acuerdo nuevo.'],
        ['No exhibas a la persona', 'Publicar la deuda o presionar con terceros rompe la relación y casi nunca acelera el pago.'],
        ['Si el monto es importante, busca asesoría', 'Un abogado de tu estado puede decirte qué opciones tienes con lo que firmaron.'],
      ]) + p('Estos pasos son consejo nuestro; no son asesoría legal.') },
      { h2: 'Está bien decir que no', html: p('CONDUSEF lo dice tal cual: está bien decir «no». Si te inclinas por no prestar, recomienda decirlo con respeto y claridad, y ofrecer otro tipo de apoyo. Su ejemplo: «Ojalá pudiera ayudarte, pero ahora no tengo disponibilidad».')
        + p('Decir que no a tiempo suele cuidar más la relación que prestar algo que después no te pueden pagar.') },
    ],
    faq: [
      { p: '¿Cómo le presto dinero a un familiar sin que se arruine la relación?', r: 'Presta solo lo que podrías perder, deja por escrito el monto, los plazos y si hay interés, y lleven la cuenta de cada abono con sus comprobantes. CONDUSEF recomienda un contrato por escrito, que se puede complementar con pagarés.' },
      { p: '¿Sirve un mensaje de WhatsApp como acuerdo?', r: 'CONDUSEF sugiere dejar los acuerdos por escrito siempre y menciona que puede bastar una vía sencilla, como un mensaje de texto con el compromiso. Para montos importantes recomienda un contrato, que puede complementarse con pagarés.' },
      { p: '¿Qué debe decir un pagaré?', r: 'Según el artículo 170 de la Ley General de Títulos y Operaciones de Crédito: que es un pagaré, la promesa incondicional de pagar una suma determinada, a quién se paga, cuándo y dónde, la fecha y el lugar en que se firma, y la firma de quien se obliga.' },
      { p: '¿Qué hago si no me pagan?', r: 'Habla pronto y en privado, propón un plan nuevo y déjalo por escrito, y no exhibas a la persona. Si el monto es importante, consulta a un abogado de tu estado.' },
    ],
    fuentes: [F.condusefNo, F.condusefRedFlags, F.ccf, F.lgtoc],
    relacionadas: [S.tanda, S.deudas, S.tarjeta],
  },

  // =============== 3. Tanda ===============
  {
    slug: S.tanda, llamado: 'prestar',
    titulo: 'Cómo organizar una tanda sin problemas',
    descripcion: 'Qué es una tanda, por qué no está regulada, sus riesgos y cómo organizarla con reglas claras por escrito y un registro de pagos, con fuentes de CONDUSEF.',
    h1: 'Cómo organizar una tanda sin problemas: reglas, riesgos y registro',
    lead: 'La tanda es de las formas de ahorro más comunes en México, y también de las que más pleitos causan. Aquí te explicamos cómo funciona, por qué nadie te protege si algo sale mal y cómo organizarla con reglas claras.',
    secciones: [
      { h2: 'Qué es una tanda', html: p('CONDUSEF la describe así: alguien organiza, todos aportan y cada quien recibe su dinero cuando le toca. Es un ahorro <b>informal</b>: CONDUSEF la cuenta junto con guardar dinero en casa y las cajas de ahorro, a diferencia del ahorro en cuentas bancarias o de nómina.')
        + ejemplo('Diez personas aportan $500 cada semana durante diez semanas. ¿Cuánto recibe cada una?', ul([
          'Cada semana se juntan 10 × $500 = <b>$5,000</b>, y se le entregan a quien le toca el turno.',
          'Al final, cada persona aportó 10 × $500 = $5,000 y recibió $5,000 una sola vez.',
          'Nadie gana nada extra: quien cobra primero recibe un adelanto del grupo, y quien cobra al último solo recupera lo que fue poniendo.',
        ])) },
      { h2: 'La tanda no está regulada', html: p('Esto es lo más importante. CONDUSEF lo explica así: las tandas carecen de regulación, por lo que, en caso de fraude, CONDUSEF está impedida de realizar cualquier acción legal. En otro artículo lo resume: si alguien deja de pagar, no hay a quién reclamar, y no hay contrato ni respaldo legal que te proteja.')
        + p('CONDUSEF también aclara que no pagar el dinero de una tanda puede tener consecuencias legales. Pero llegar a eso es lento y no garantiza que recuperes tu dinero: en el caso real que cuenta su revista, el dinero no se pudo recuperar.') },
      { h2: 'Los riesgos', html: ul([
        '<b>Alguien cobra y deja de pagar.</b> Si le tocó un turno temprano, el hueco lo pagan quienes todavía no cobran.',
        '<b>La persona que organiza desaparece</b> o deja de entregar el dinero.',
        '<b>Si te toca primero, dependes de todos</b>, como advierte CONDUSEF.',
        '<b>Tu dinero no genera rendimientos</b>, también según CONDUSEF.',
        '<b>Puede provocar conflictos y amistades rotas.</b>',
      ]) + caja('Ojo con las «tandas» que prometen ganancias', p('CONDUSEF advierte que algunos «grupos de ahorro entre amigos» en realidad funcionan como esquemas piramidales: prometen ganancias rápidas, para ganar necesitas invitar a más personas y el dinero de los nuevos paga a los primeros. Su resumen: si depende de traer más gente, no es ahorro, es un riesgo.')) },
      { h2: 'Reglas claras antes de empezar', html: p('CONDUSEF sugiere preguntarse, antes de entrar, si hay reglas claras y por escrito y qué pasa si alguien no paga. Si tú organizas, estas son las reglas que recomendamos acordar y mandar por escrito a todo el grupo (lista nuestra):')
        + ol([
          ['Monto, frecuencia y número de personas', 'Cuánto aporta cada quien, cada cuándo y cuántos son. El número no cambia a medio camino.'],
          ['Fecha y forma de pago', 'Qué día se paga, a quién y cómo (de preferencia por transferencia, para que quede comprobante).'],
          ['El orden de los turnos', 'Cómo se decide (por ejemplo, un sorteo frente a todos) y que quede anotado desde el día uno.'],
          ['Qué pasa si alguien se atrasa', 'Cuántos días de gracia hay y qué se hace después. Mejor acordarlo antes que improvisarlo.'],
          ['Solo gente que se conoce y puede pagar', 'Que nadie entre por presión. CONDUSEF pregunta: ¿estás participando por presión emocional?'],
        ]) },
      { h2: 'Lleva un registro de pagos', html: p('Un registro que todos puedan ver evita la mitad de los problemas. Basta una tabla con quién pagó, cuándo y a quién le tocó cobrar:')
        + ejemplo('Registro de las primeras tres semanas de la tanda de diez personas', tabla(['Semana', 'Le toca cobrar', 'Pagos recibidos', 'Entregado'], [
          ['1', 'Ana', '10 de 10', '$5,000 el lunes'],
          ['2', 'Luis', '10 de 10', '$5,000 el lunes'],
          ['3', 'Carmen', '9 de 10 (falta Jorge)', 'Pendiente hasta completar'],
        ]))
        + p('Guarda los comprobantes de cada pago y de cada entrega, y comparte la tabla con el grupo cada semana (consejo nuestro).') },
      { h2: 'Si alguien deja de pagar', html: ejemplo('En la tanda de diez personas, Luis cobró sus $5,000 en la semana 2 y dejó de pagar. ¿De cuánto es el hueco?', ul([
          'Faltan sus aportaciones de la semana 3 a la 10: son 8 semanas × $500 = <b>$4,000</b>.',
          'Ese dinero les falta a quienes todavía no cobran.',
        ]))
        + ol([
          ['Habla con la persona cuanto antes', 'Pregunta qué pasó y propón un plan para ponerse al corriente, por escrito.'],
          ['Avisa al grupo con datos', 'Con el registro en la mano, sin exhibir ni insultar a nadie.'],
          ['Decidan juntos qué hacer', 'Por ejemplo, recorrer los turnos o repartir el faltante, según lo que hayan acordado al inicio.'],
        ]) + p('Estos pasos son consejo nuestro. Recuerda que no hay una autoridad financiera que intervenga.') },
      { h2: 'Si lo que quieres es ahorrar', html: p('CONDUSEF recomienda considerar opciones más seguras para ahorrar. Si eliges una institución, verifica antes que esté autorizada: CONDUSEF sugiere revisar su registro en el SIPRES (Sistema de Registro de Prestadores de Servicios Financieros).') },
    ],
    faq: [
      { p: '¿Las tandas son legales en México?', r: 'Las tandas no están reguladas. CONDUSEF explica que, en caso de fraude, está impedida de realizar cualquier acción legal; también aclara que no pagar el dinero de una tanda puede tener consecuencias legales.' },
      { p: '¿Qué pasa si alguien no paga la tanda?', r: 'El hueco lo cubren quienes todavía no cobran, y no hay una autoridad financiera a quién reclamar. Por eso conviene acordar desde el inicio, por escrito, qué se hace si alguien se atrasa.' },
      { p: '¿Se gana dinero en una tanda?', r: 'No. Cada persona recibe lo mismo que aporta. CONDUSEF advierte que el dinero de una tanda no genera rendimientos, y que si te prometen ganancias por invitar a más gente puede ser un esquema piramidal.' },
      { p: '¿Cómo organizo una tanda sin problemas?', r: 'Acuerden por escrito el monto, la frecuencia, el número de personas, el orden de los turnos y qué pasa si alguien se atrasa, y lleven un registro de pagos que todos puedan ver, con comprobantes.' },
    ],
    fuentes: [F.condusefTanda, F.condusefAmistad, F.condusefAhorro, F.condusefUrge],
    relacionadas: [S.prestar, S.deudas, S.tarjeta],
  },

  // =============== 4. Salir de deudas ===============
  {
    slug: S.deudas, llamado: 'cuentasDeudor',
    titulo: 'Cómo salir de deudas paso a paso',
    descripcion: 'Haz el inventario de tus deudas, elige un orden de pago, negocia con tu banco, revisa tu Buró de Crédito y evita fraudes, con fuentes de CONDUSEF.',
    h1: 'Cómo salir de deudas paso a paso, sin caer en fraudes',
    lead: 'Salir de deudas no se logra de un día para otro, pero sí con un plan. Estos son los pasos que recomienda CONDUSEF, los dos métodos más conocidos para ordenar tus pagos y lo que tienes que saber de tu Buró de Crédito y de los despachos de cobranza.',
    secciones: [
      { h2: 'Paso 1: haz el inventario de tus deudas', html: p('CONDUSEF recomienda empezar por enlistar todas tus deudas. Para cada una anota cuánto debes, la tasa de interés, el pago mínimo o la mensualidad y la fecha de pago. Todo eso viene en tu estado de cuenta o en tu contrato.')
        + ejemplo('Así se vería el inventario de una persona con tres deudas (tasas inventadas)', tabla(['Deuda', 'Saldo', 'Tasa anual', 'Intereses de un mes (aprox.)'], [
          ['Tarjeta A', '$8,000', '70 %', '$466.67'],
          ['Tarjeta B', '$3,000', '45 %', '$112.50'],
          ['Préstamo personal', '$15,000', '35 %', '$437.50'],
        ], 'Intereses de un mes, simplificados: saldo × tasa anual ÷ 12, sin IVA. Por ejemplo, $8,000 × 70 % ÷ 12 = $466.67. En total, unos $1,016.67 al mes solo de intereses.'))
        },
      { h2: 'Paso 2: haz tu presupuesto', html: p('CONDUSEF sugiere hacer un presupuesto con todos tus ingresos y gastos para saber cuánto puedes destinar a tus deudas y qué gastos puedes recortar. Como referencia, en su revista menciona que el pago de tus deudas no debería ser mayor al 30 % de tus ingresos netos.')
        + p('Lo que salga de ese presupuesto es tu «monto para deudas»: con él pagas el mínimo de todas y lo que sobre lo pones en una sola deuda a la vez.') },
      { h2: 'Paso 3: elige un orden: avalancha o bola de nieve', html: p('Hay dos formas conocidas de decidir a qué deuda le metes el dinero extra. En las dos sigues pagando el mínimo de todas:')
        + tabla(['Método', 'Qué pagas primero', 'Ventaja'], [
          ['Avalancha', 'La deuda con la tasa de interés más alta.', 'Es la que más intereses te ahorra. Es el orden que recomendó CONDUSEF en 2016: primero la de mayor tasa.'],
          ['Bola de nieve', 'La deuda que puedes liquidar más rápido (la más chica).', 'Ves resultados pronto y eso ayuda a no soltar el plan. Se parece al «acelerador de pagos» de CONDUSEF (2025).'],
        ])
        + p('En el «acelerador de pagos», CONDUSEF propone ordenar tus deudas de la que se liquida más rápido a la más lenta, pagar el mínimo de todas, poner un extra en la primera y, cuando la termines, sumar ese pago a la siguiente. También recomienda definir durante cuánto tiempo aplicarás la estrategia y no cambiar el plan.')
        + ejemplo('Con el inventario del paso 1, ¿en qué orden pagarías?', ul([
          '<b>Avalancha:</b> Tarjeta A (70 %), luego Tarjeta B (45 %) y al final el préstamo (35 %).',
          '<b>Bola de nieve:</b> Tarjeta B ($3,000), luego Tarjeta A ($8,000) y al final el préstamo ($15,000).',
        ]) + nota('Las dos funcionan si las sostienes. Lo peor es no elegir ninguna.')) },
      { h2: 'Paso 4: deja de sumar deuda', html: p('CONDUSEF lo dice claro: no incrementes tu deuda. Mientras sales, no uses las tarjetas para comprar cosas innecesarias y paga más del mínimo para que la deuda no crezca.') },
      { h2: 'Paso 5: negocia con la institución', html: p('Si ya no alcanzas a pagar, habla directamente con tu banco o financiera, en su Unidad Especializada de atención a usuarios (UNE). CONDUSEF describe tres opciones que puedes pedir:')
        + tabla(['Opción', 'Qué es'], [
          ['Consolidación', 'Juntar varias deudas en una sola, idealmente con menor CAT y menor tasa. No todas las instituciones la ofrecen.'],
          ['Reestructura', 'Un acuerdo para ampliar el plazo, bajar la tasa o pagar cantidades fijas.'],
          ['Quita', 'Liquidar la deuda con un descuento. CONDUSEF advierte que, si pagas con quita, quedarás reportado en el Buró de Crédito con una mala nota.'],
        ])
        + caja('Pide todo por escrito', p('Según CONDUSEF, cuando acuerdas una quita la institución debe entregarte una <b>carta convenio</b> con lo pactado: fechas, montos a pagar y que la deuda queda liquidada. Si no te la entregan, no hagas ningún pago, porque significa que no existe ese acuerdo. Pregunta también cómo se va a reportar el acuerdo en tu historial.')) },
      { h2: 'Tu historial en el Buró de Crédito', html: p('El Buró de Crédito y Círculo de Crédito son sociedades de información crediticia: guardan tu historial de pagos. Lo que dice la ley que las regula:')
        + ul([
          '<b>Puedes pedir tu reporte gratis cada 12 meses</b> (Reporte de Crédito Especial), si lo pides por correo electrónico o lo recoges en la sociedad (artículo 41).',
          '<b>Los atrasos se borran después de 72 meses</b> de haberse registrado por primera vez (artículo 23). Los créditos chicos, menores a mil UDIS, se eliminan en los plazos que fija Banxico; hay excepciones, por ejemplo si el adeudo está en juicio.',
          '<b>Si hay un error, puedes reclamar</b> ante la sociedad, por escrito, correo, internet o teléfono, y te deben dar un número de control para darle seguimiento (artículo 42).',
        ])
        + p('CONDUSEF advierte que es falso que alguien pueda borrar tu historial en unas horas, aunque ya hayas pagado: solo las sociedades de información crediticia modifican los registros, por instrucción de quien te dio el crédito o en los casos que marca la ley.') },
      { h2: 'Despachos de cobranza: lo que no pueden hacer', html: p('Si un despacho te cobra a nombre de un banco o financiera, las disposiciones de CONDUSEF para despachos de cobranza (publicadas en el Diario Oficial en 2014) establecen, entre otras cosas, que:')
        + ul([
          'Solo pueden comunicarse o presentarse <b>de 7:00 a 22:00 horas</b>.',
          'Deben identificarse con el nombre del despacho y documentar por escrito cualquier acuerdo de pago, negociación o reestructura.',
          'No pueden amenazar, ofender ni intimidar a ti, a tu familia o a tus compañeros de trabajo.',
          'No pueden cobrarle a terceros (salvo avales u obligados solidarios) ni hacerse pasar por autoridad o por un juzgado.',
          'No pueden llamarte desde números ocultos o privados, ni publicar listas o cartelones de deudores.',
          '<b>No pueden recibir directamente el pago de la deuda.</b>',
        ])
        + p('Las mismas disposiciones prevén el Registro de Despachos de Cobranza (REDECO), que administra CONDUSEF. Si un despacho no respeta estas reglas, puedes acudir a CONDUSEF.') },
      { h2: 'Cuidado con los fraudes', html: ul([
        '<b>Nadie puede «borrarte del Buró».</b> CONDUSEF ha alertado sobre páginas que cobran por hacerlo; es falso.',
        '<b>Las «reparadoras de crédito» no tienen figura legal en México.</b> CONDUSEF explica que no están contempladas por la ley ni supervisadas por el gobierno, así que no hay a dónde reclamar si incumplen.',
        '<b>Paga solo a la institución.</b> Si un despacho te pide depositar a otra cuenta, desconfía: por las disposiciones de cobranza, ellos no pueden recibir el pago.',
        '<b>Desconfía de créditos «exprés» o «milagro».</b> CONDUSEF advierte que pueden ser fraude y recomienda verificar a la institución en el SIPRES.',
      ]) },
    ],
    faq: [
      { p: '¿Qué deuda pago primero?', r: 'Paga el mínimo de todas y pon el dinero extra en una sola: la de tasa más alta (método avalancha, el que más intereses ahorra) o la que puedes liquidar más rápido (bola de nieve, parecido al acelerador de pagos de CONDUSEF).' },
      { p: '¿Cuánto tiempo dura una deuda en el Buró de Crédito?', r: 'Según el artículo 23 de la ley de sociedades de información crediticia, los atrasos se borran 72 meses después de haberse registrado por primera vez; los créditos menores a mil UDIS, en los plazos que fija Banxico. Hay excepciones, como un juicio.' },
      { p: '¿Puedo ver mi Buró de Crédito gratis?', r: 'Sí. La ley te da derecho a un Reporte de Crédito Especial gratis cada 12 meses, si lo pides por correo electrónico o lo recoges en la sociedad de información crediticia.' },
      { p: '¿En qué horario me pueden cobrar los despachos de cobranza?', r: 'Según las disposiciones de CONDUSEF publicadas en el Diario Oficial en 2014, solo de 7:00 a 22:00 horas, y no pueden amenazar, cobrar a terceros ni recibir directamente el pago de la deuda.' },
    ],
    fuentes: [F.condusefLiberate, F.condusefSalirGob, F.condusefSalir, F.condusefUrge, F.condusefQuitas, F.lrsic, F.condusefBuro, F.dofCobranza],
    relacionadas: [S.tarjeta, S.prestar, S.tanda],
  },
];

// ---------- consultas ----------
export const articuloFinanzas = slug => ARTICULOS_FINANZAS.find(x => x.slug === slug) || null;
export const rutaArticuloFinanzas = x => r(x.slug);
export const tituloArticuloFinanzas = x => conMarca(x.titulo);
export const tituloIndiceFinanzas = () => conMarca(FINANZAS.indice.titulo);
export const llamadoDe = x => LLAMADO[x.llamado];
export const urlsFinanzas = () => [RUTA_FINANZAS, ...ARTICULOS_FINANZAS.map(rutaArticuloFinanzas)];
export const textoDeArticulo = x => [x.lead, ...x.secciones.map(y => textoPlano(y.html)), ...(x.faq || []).map(f => f.r)].join(' ');

const NOTA_PIE = `Vorka Learn es la sección de guías de Vorka México. ${AVISO_FINANZAS} No estamos afiliados a CONDUSEF, al Banco de México ni a ninguna institución financiera, y no recomendamos bancos, tarjetas ni productos de terceros.`;

// Página de un artículo de finanzas, o null si no existe. anuncios: configAnuncios(env) o null (apagados).
export function paginaArticuloFinanzas(slug, anuncios = null) {
  const x = articuloFinanzas(slug);
  if (!x) return null;
  const ruta = rutaArticuloFinanzas(x);
  const rel = x.relacionadas.map(articuloFinanzas).filter(Boolean).slice(0, 3).map(y => ({ href: rutaArticuloFinanzas(y), h1: y.h1, descripcion: y.descripcion }));
  return paginaArticulo(x, {
    ruta, titulo: tituloArticuloFinanzas(x), lugares: [['Vorka Learn', RUTA_LEARN], [FINANZAS.nombre, RUTA_FINANZAS], [x.h1, ruta]],
    kicker: `Guía · ${FINANZAS.nombre}`, imagen: OG_FINANZAS, actual: FINANZAS.clave, anuncios, actualizado: ACTUALIZADO_FIN, actualizadoTxt: ACTUALIZADO_TXT,
    notaFuentes: `<p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; las reglas y las condiciones de cada institución pueden cambiar, así que confírmalas en tu contrato o con la institución.</p>
    <p class="gu-nota lr-aviso-fin"><b>${AVISO_FINANZAS}</b></p>`,
    llamado: LLAMADO[x.llamado], compartirTexto: 'Compártela con quien le pueda ayudar a cuidar su dinero.',
    rel, relTitulo: 'Más guías de finanzas personales', notaPie: NOTA_PIE,
  });
}

// Índice de la sección (/learn/finanzas/). otras: [{ href, h1, descripcion }] de las otras secciones de Learn.
export function paginaIndiceFinanzas(anuncios = null, otras = []) {
  const ruta = RUTA_FINANZAS, s = FINANZAS.indice, lugares = [['Vorka Learn', RUTA_LEARN], [FINANZAS.nombre, ruta]];
  const datos = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: s.h1, description: s.descripcion, inLanguage: 'es-MX', url: `${SITIO}${ruta}`, publisher: ORG, isPartOf: SITIO_LEARN,
      mainEntity: { '@type': 'ItemList', itemListElement: ARTICULOS_FINANZAS.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}${rutaArticuloFinanzas(x)}`, name: x.h1 })) } },
    migasLd(lugares),
  ];
  return paginaLearn({ titulo: tituloIndiceFinanzas(), ruta, descripcion: s.descripcion, imagen: OG_FINANZAS, actual: FINANZAS.clave, anuncios,
    head: ld(datos),
    cuerpo: `<div class="marco"><div class="lr-col lr-ancha">
  ${migas(lugares)}
  <span class="lr-kicker">Vorka Learn · ${esc(FINANZAS.nombre)}</span>
  <h1 class="lr-h1">${esc(s.h1)}</h1>
  <p class="lr-lead">${esc(s.lead)}</p>
  <div class="gu-grid lr-primero">${ARTICULOS_FINANZAS.map(x => tarjeta(rutaArticuloFinanzas(x), x.h1, x.descripcion)).join('')}</div>
  ${espacioAnuncio(anuncios, 'indice')}
  ${otras.length ? `<section class="lr-grupo"><h2 class="lr-h2">Guías para exámenes de admisión</h2>
  <div class="gu-grid">${otras.map(y => tarjeta(y.href, y.h1, y.descripcion)).join('')}</div></section>` : ''}
  <p class="lr-nota">${NOTA_PIE}</p>
</div></div>`,
  });
}
