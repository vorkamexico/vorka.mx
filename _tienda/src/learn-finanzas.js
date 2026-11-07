// Vorka Learn › Finanzas personales (vorka.mx/learn/finanzas/…): guías de dinero para el día a día, con la misma plantilla
// editorial que las guías de exámenes (paginaArticulo en src/learn.js). Las rutas, la portada y el sitemap las conecta
// src/simulador/guias.js (rutasLearn, paginaLearnPortada, urlsGuias).
// Reglas (tema de dinero, política de la organización: sin inventar datos):
//  - Todo dato concreto (definiciones, reglas, plazos, derechos) sale de la fuente oficial que el artículo cita en «Fuentes»
//    (Banxico, CONDUSEF, INEGI, leyes en diputados.gob.mx, DOF), revisadas el 31 de octubre de 2026 (la guía de ahorro,
//    el 6 de noviembre de 2026, con su propio actualizado / actualizadoTxt). Lo que es consejo nuestro se
//    presenta como tal.
//  - Sin tasas «actuales» ni nombres de bancos, tarjetas o productos de terceros. Los números son ejemplos propios, marcados,
//    con cifras inventadas y la operación a la vista (la aritmética la revisa test/learn-finanzas.test.js).
//  - Un solo llamado final por artículo. Clara (/tienda/clara/) en la guía de ahorro, descrita con lo que hace su ficha
//    (src/clara.js) y lo que no (no es banco, no mueve dinero, no se conecta a cuentas). Cuentas (/tienda/cuentas/) solo donde encaja de verdad: lleva el registro de lo que
//    PRESTAS a familiares y amigos; no presta, no mueve dinero, no negocia deudas y no organiza tandas (ver src/cuentas.js).
//  - Aviso al final de cada artículo: información general con fines educativos; no es asesoría financiera personalizada.
import { esc } from './paginas.js';
import { FLECHA } from './marco.generado.js';
import { llamadoProducto, llamadoGuia } from './learn/cta.js';
import { paginaArticulo, SITIO, RUTA_LEARN, p, ul, ol, tabla, nota, caja, a, conMarca, textoPlano } from './learn.js';

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
  condusefEmergencia: { nombre: 'CONDUSEF, revista Proteja su Dinero: Fondo de emergencia (septiembre de 2024)', url: 'https://revista.condusef.gob.mx/ahorro-general/2024/09/fondo-de-emergencia/' },
  enif: { nombre: 'INEGI: Comunicado de prensa 49/25, Encuesta Nacional de Inclusión Financiera (ENIF) 2024 (13 de marzo de 2025)', url: 'https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/enif/ENIF2024_CP.pdf' },
  banxicoGat: { nombre: 'Banco de México: Ganancia Anual Total (GAT), nominal y real', url: 'https://www.banxico.org.mx/waGAT/' },
  lpab: { nombre: 'Ley de Protección al Ahorro Bancario (artículo 11, obligaciones garantizadas; última reforma DOF 11-05-2022)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LPAB.pdf' },
  inpc: { nombre: 'INEGI: Comunicado de prensa 619/26, Índice Nacional de Precios al Consumidor, septiembre de 2026 (8 de octubre de 2026)', url: 'https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/inpc/inpc_2q2026_10.pdf' },
  lft: { nombre: 'Ley Federal del Trabajo, texto vigente (última reforma DOF 14-05-2026; artículos 87, 291-F, 334 Bis, 516 y 1002)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf' },
  lisr: { nombre: 'Ley del Impuesto sobre la Renta (artículo 93, fracción XIV, gratificaciones anuales; última reforma DOF 01-04-2024)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf' },
  cpeum: { nombre: 'Constitución Política de los Estados Unidos Mexicanos (decreto de desindexación del salario mínimo, DOF 27-01-2016, artículo transitorio tercero)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf' },
  uma: { nombre: 'INEGI: Comunicado de prensa 1/26, Unidad de Medida y Actualización 2026 (8 de enero de 2026)', url: 'https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/uma/uma2026.pdf' },
  conasami: { nombre: 'CONASAMI: Tabla de salarios mínimos generales y profesionales 2026 (vigentes desde el 1 de enero de 2026)', url: 'https://www.gob.mx/cms/uploads/attachment/file/1041076/Tabla_de_Salarios_M_nimos_2026.pdf' },
  profedet: { nombre: 'PROFEDET: ¿Aún no recibes tu aguinaldo? Acércate a la PROFEDET (22 de enero de 2024)', url: 'https://www.gob.mx/profedet/articulos/aun-no-recibes-tu-aguinaldo-acercate-a-la-profedet?idiom=es' },
  gacetaAguinaldo: { nombre: 'Gaceta Parlamentaria de la Cámara de Diputados: iniciativa para reformar el artículo 87 de la Ley Federal del Trabajo (25 de marzo de 2026)', url: 'https://gaceta.diputados.gob.mx/PDF/66/2026/mar/20260325-II-6-1.pdf' },
  dofCobranza: { nombre: 'Diario Oficial de la Federación: Disposiciones de carácter general aplicables a las entidades financieras en materia de despachos de cobranza (CONDUSEF, 2014)', url: 'https://dof.gob.mx/nota_detalle_popup.php?codigo=5362845' },
};

// ---------- piezas ----------
// Ejemplo numérico: siempre propio, con cifras inventadas y marcado como tal
const ejemplo = (titulo, html) => `<div class="gu-ej"><span class="gu-ej-t">Ejemplo propio de Vorka Learn, con cifras inventadas</span>
<p class="gu-ej-p">${titulo}</p>${html}</div>`;
const r = slug => `${RUTA_FINANZAS}${slug}/`;
const S = { tarjeta: 'como-funciona-una-tarjeta-de-credito', prestar: 'como-prestar-dinero-a-un-familiar-o-amigo', tanda: 'como-organizar-una-tanda', deudas: 'como-salir-de-deudas', ahorro: 'como-ahorrar-si-eres-joven', aguinaldo: 'aguinaldo-cuanto-te-toca' };

// Llamados finales (uno por artículo). Cuentas se describe con lo que de verdad hace (src/cuentas.js y /legal/cuentas/).
const final = (etiqueta, t, d, href, boton) => `<aside class="lr-final" aria-label="${esc(etiqueta)}"><p><b class="lr-final-t">${t}</b>${d}</p>
  <a class="btn tinta" href="${href}">${boton} ${FLECHA}</a></aside>`;
const LLAMADO = {
  // Encaja directo: el artículo es sobre prestar y Cuentas lleva el registro de lo que prestas
  cuentas: llamadoProducto({ etiqueta: 'Lleva la cuenta de lo que prestas', producto: 'Cuentas', de: 'Préstamos entre conocidos · Vorka México', icono: 'libreta', chip: 'Gratis con un préstamo activo',
    titulo: '¿Ya prestaste? Lleva la cuenta en orden',
    texto: 'Una app para registrar el dinero que prestas a familiares y amigos, sin pleitos por «¿cuánto te falta?».',
    puntos: ['Cada abono y cuánto falta, siempre al día.', 'Si pactaron interés, cuánto fue a interés y cuánto a capital.', 'Un enlace de solo lectura para que la otra persona vea su saldo.'],
    nota: 'Cuentas no presta ni mueve dinero y no sustituye un contrato.',
    href: '/tienda/cuentas/', boton: 'Conoce Cuentas' }),
  // Encaja solo en una parte: deudas con familiares o amigos. Se dice qué NO hace.
  cuentasDeudor: llamadoProducto({ etiqueta: 'Si le debes a alguien cercano', producto: 'Cuentas', de: 'Préstamos entre conocidos · Vorka México', icono: 'libreta',
    titulo: '¿Parte de tu deuda es con alguien de tu familia?',
    texto: 'Cuando la cuenta es clara para los dos, es más fácil cumplir sin pleitos.',
    puntos: ['Quien te prestó registra cada abono.', 'Te comparte un enlace de solo lectura con tu saldo al día.', 'Los dos ven lo mismo: sin malentendidos.'],
    nota: 'Cuentas no negocia con bancos, no presta dinero y no borra deudas.',
    href: '/tienda/cuentas/', boton: 'Conoce Cuentas' }),
  // Clara (/tienda/clara/): lo que dice su ficha (src/clara.js): gratis con 1 tarjeta; metas y presupuesto son de Pro; no es banco
  clara: llamadoProducto({ etiqueta: 'Conoce Clara', producto: 'Clara', de: 'Finanzas para jóvenes · Vorka México', icono: 'cartera', chip: 'Gratis para empezar',
    titulo: '¿Quieres llevar tus gastos y tu ahorro en el celular?',
    texto: 'Una app de finanzas para jóvenes desde 15 años: anotas tus gastos y antes de comprar te dice «¿me alcanza?».',
    puntos: ['El resumen de tu mes, para ver a dónde se va tu dinero.', 'Si tienes tarjeta de crédito, te recuerda el corte y el pago.', 'Con Clara Pro: metas de ahorro con fecha y presupuesto por categoría; pruébalo 7 días sin poner tarjeta.'],
    nota: 'Clara no es un banco, no mueve dinero, no se conecta a tus cuentas y no da asesoría financiera.',
    href: '/tienda/clara/', boton: 'Conoce Clara' }),
  // Clara para planear el aguinaldo (mismos datos de la ficha que el llamado «clara»)
  claraAguinaldo: llamadoProducto({ etiqueta: 'Planea tu aguinaldo con Clara', producto: 'Clara', de: 'Finanzas para jóvenes · Vorka México', icono: 'cartera', chip: 'Gratis para empezar',
    titulo: '¿Quieres que tu aguinaldo no se te vaya en una semana?',
    texto: 'Clara es una app de finanzas para jóvenes desde 15 años: anotas tus gastos y antes de comprar te dice «¿me alcanza?».',
    puntos: ['El resumen de tu mes, para ver a dónde se va tu dinero en diciembre.', 'Si tienes tarjeta de crédito, te recuerda el corte y el pago para no generar intereses.', 'Con Clara Pro: metas de ahorro con fecha y presupuesto por categoría; pruébalo 7 días sin poner tarjeta.'],
    nota: 'Clara no es un banco, no mueve dinero, no se conecta a tus cuentas y no da asesoría financiera.',
    href: '/tienda/clara/', boton: 'Conoce Clara' }),
  // Cuentas no tiene que ver con tarjetas: el siguiente paso útil es la guía de deudas
  deudas: llamadoGuia({ titulo: '¿Ya traes un saldo que no alcanzas a liquidar?',
    texto: 'Si tu tarjeta ya se volvió una deuda, te explicamos cómo ordenarla, negociar con tu banco y cuidar tu historial, paso a paso.',
    href: r(S.deudas), boton: 'Lee: cómo salir de deudas' }),
  // Cuentas no organiza tandas: el siguiente paso útil es la guía de préstamos entre conocidos
  prestar: llamadoGuia({ titulo: '¿También te piden prestado?',
    texto: 'Una tanda y un préstamo entre conocidos tienen el mismo reto: acuerdos claros y por escrito. Te explicamos cómo prestar sin perder la relación.',
    href: r(S.prestar), boton: 'Lee: cómo prestar sin pleitos' }),
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

  // =============== 5. Ahorrar si eres joven (Clara) ===============
  // Revisada el 6 de noviembre de 2026. Fuentes: CONDUSEF (ahorro, oct 2025; fondo de emergencia, sep 2024), INEGI (ENIF 2024,
  // comunicado 49/25; INPC septiembre 2026), Banxico (GAT) y la Ley de Protección al Ahorro Bancario (art. 11). La regla
  // 50/30/20 no está publicada por CONDUSEF: si se menciona, como método popular, no como regla oficial.
  {
    slug: S.ahorro, llamado: 'clara', actualizado: '2026-11-06', actualizadoTxt: 'noviembre de 2026',
    titulo: 'Cómo ahorrar si eres joven (aunque ganes poco)',
    descripcion: 'Cómo empezar a ahorrar con poco dinero: ahorrar primero, una meta con fecha, tu fondo de emergencia y dónde guardarlo, con datos de CONDUSEF y Banxico.',
    h1: 'Cómo ahorrar si eres joven, aunque ganes poco',
    lead: 'Ahorrar no es guardar lo que sobra: casi nunca sobra. Es apartar primero una parte, aunque sea pequeña, con un propósito claro. Aquí está cómo empezar con tu domingo, tu beca o tu primer sueldo, cuánto juntar para emergencias y dónde guardarlo, con lo que dicen CONDUSEF, Banxico y el INEGI.',
    secciones: [
      { h2: 'Primero ahorra, luego gasta', html: p('CONDUSEF lo resume así: ahorrar no significa «guardar lo que sobra», y su consejo es <b>primero ahorrar y luego gastar</b>. Es decir: el día que recibes dinero, apartas tu ahorro antes de gastar en lo demás.')
        + p('No eres el único que batalla. Según la Encuesta Nacional de Inclusión Financiera (ENIF) 2024 del INEGI, el <b>63.0 %</b> de las personas de 18 a 70 años tenía al menos una cuenta de ahorro formal; el resto, no.')
        + ejemplo('Recibes $4,000 al mes entre beca y trabajo de fin de semana, y decides apartar el 10 % el mismo día que te llega. ¿Cuánto juntas en seis meses?', ul([
          'Cada mes apartas 10 % de $4,000 = <b>$400</b>.',
          'En seis meses: 6 × $400 = <b>$2,400</b>, sin contar rendimientos.',
        ])) },
      { h2: 'Ponle nombre y fecha a tu ahorro', html: p('Esto es consejo nuestro. «Ahorrar» a secas cansa; «juntar para mi laptop en junio» motiva. Escribe:')
        + ol([
          ['Para qué', 'Una cosa concreta: la inscripción, un curso, un viaje, tu fondo de emergencia.'],
          ['Cuánto', 'El precio real, con impuestos y envío si aplica.'],
          ['Para cuándo', 'Una fecha. Divide el monto entre los meses que faltan y sabrás cuánto apartar cada mes.'],
        ])
        + ejemplo('Quieres juntar $3,000 para un curso que empieza en 5 meses. ¿Cuánto apartas cada mes?', ul([
          '$3,000 ÷ 5 meses = <b>$600</b> al mes.',
          'Si no te alcanza, mueve la fecha o busca una versión más barata del curso, pero no dejes de apartar.',
        ])) },
      { h2: 'Tu fondo de emergencia', html: p('CONDUSEF recomienda tener un fondo de emergencia equivalente a <b>tres a seis meses de tus gastos mensuales</b>, y aclara que el monto depende de cada persona. Sirve para lo que no se planea: una consulta médica, un celular roto, una semana sin trabajo.')
        + ejemplo('Tus gastos fijos son de $3,000 al mes. ¿Cuánto sería tu fondo de emergencia?', ul([
          'Con tres meses: 3 × $3,000 = <b>$9,000</b>.',
          'Con seis meses: 6 × $3,000 = <b>$18,000</b>.',
          'Si hoy te parece mucho, empieza con la meta de un mes ($3,000) y súbela poco a poco.',
        ]))
        + nota('Consejo nuestro: guarda el fondo de emergencia aparte de tu dinero de todos los días, para que no se te vaya en antojos.') },
      { h2: 'Que no se te vaya en gastos hormiga', html: p('Esto es consejo nuestro. Durante dos semanas, anota <b>todo</b> lo que gastas, hasta los dulces y las recargas. Al final, separa en tres:')
        + tabla(['Tipo de gasto', 'Ejemplos', 'Qué hacer'], [
          ['Necesario', 'Transporte, comida, escuela', 'Mantenlo, pero busca opciones más baratas.'],
          ['Gusto que sí vale la pena', 'Salir con tus amigos una vez a la semana', 'Déjale un monto fijo al mes.'],
          ['Gasto hormiga', 'Antojos diarios, suscripciones que no usas, envíos', 'Recórtalo y manda esa diferencia a tu ahorro.'],
        ])
        + p('Hay un método popular que reparte el ingreso en 50 % necesidades, 30 % gustos y 20 % ahorro. No es una regla oficial: úsalo como punto de partida y ajústalo a lo que ganas.') },
      { h2: 'Dónde guardar tu ahorro', html: ul([
          '<b>En una institución regulada.</b> Según la Ley de Protección al Ahorro Bancario (artículo 11), el IPAB garantiza los depósitos bancarios hasta por el equivalente a <b>400 mil UDIS por persona</b> en cada banco. Las UDIS cambian de valor con la inflación, así que el monto en pesos se actualiza.',
          '<b>Compara el rendimiento real.</b> Banco de México explica que la <b>GAT Real</b> es el rendimiento total de tu dinero <b>descontando la inflación</b>, y que puede ser negativa: si tu ahorro rinde menos que la inflación, pierde poder de compra. Como referencia, según el INEGI, la inflación anual fue de 3.45 % en septiembre de 2026.',
          '<b>Cuidado con lo que promete mucho.</b> Consejo nuestro: si alguien te promete rendimientos muy altos y seguros, desconfía y revisa en CONDUSEF que la institución exista y esté autorizada.',
        ]) },
    ],
    faq: [
      { p: '¿Cuánto debería ahorrar si gano poco?', r: 'No hay una cifra oficial. CONDUSEF recomienda ahorrar primero y luego gastar; como consejo nuestro, empieza con un porcentaje que sí puedas sostener, aunque sea pequeño, y súbelo cuando ganes más.' },
      { p: '¿De cuánto debe ser mi fondo de emergencia?', r: 'CONDUSEF recomienda que equivalga a tres a seis meses de tus gastos mensuales, y aclara que depende de cada persona. Si es mucho para empezar, ponte la meta de un mes y súbela poco a poco.' },
      { p: '¿Mi dinero está protegido en el banco?', r: 'Según la Ley de Protección al Ahorro Bancario, el IPAB garantiza los depósitos bancarios hasta por el equivalente a 400 mil UDIS por persona en cada banco.' },
      { p: '¿Qué es la GAT Real?', r: 'Según Banco de México, es el rendimiento total de tu dinero descontando la inflación. Si es negativa, tu ahorro pierde poder de compra.' },
    ],
    fuentes: [F.condusefAhorro, F.condusefEmergencia, F.enif, F.banxicoGat, F.lpab, F.inpc],
    relacionadas: [S.tarjeta, S.deudas, S.prestar],
  },

  // =============== 6. Aguinaldo (Clara) ===============
  // Revisada el 7 de noviembre de 2026: LFT (texto vigente, reforma DOF 14-05-2026: arts. 87, 334 Bis, 516 y 1002), LISR
  // (art. 93-XIV) con el transitorio tercero de la desindexación (DOF 27-01-2016, en la CPEUM), UMA 2026 (INEGI), salarios
  // mínimos 2026 (CONASAMI), PROFEDET y la iniciativa de 30 días (Gaceta Parlamentaria, 25-03-2026; no aprobada).
  // No afirmamos qué salario exacto (cuota diaria o integrado) se usa: la ley no lo dice; se recomienda revisar el recibo.
  {
    slug: S.aguinaldo, llamado: 'claraAguinaldo', actualizado: '2026-11-07', actualizadoTxt: 'noviembre de 2026',
    titulo: 'Aguinaldo 2026: cuánto te toca y cómo calcularlo',
    descripcion: 'Cuánto aguinaldo te toca en 2026, cómo calcularlo (también si no trabajaste el año completo), cuánto está exento de ISR y qué hacer si no te lo pagan.',
    h1: 'Aguinaldo 2026: cuánto te toca, cómo calcularlo y qué hacer si no te lo pagan',
    lead: 'Por ley te toca, como mínimo, el equivalente a 15 días de salario, pagado antes del 20 de diciembre. Aquí está cómo calcular el tuyo, también si entraste a medio año, cuánto queda libre de impuestos y a dónde acudir si no te lo pagan, con lo que dicen la Ley Federal del Trabajo, la Ley del ISR y PROFEDET.',
    secciones: [
      { h2: 'Lo que dice la ley', html: p('La Ley Federal del Trabajo (artículo 87) dice que tienes derecho a un aguinaldo anual que debe pagarse <b>antes del 20 de diciembre</b>, equivalente a <b>15 días de salario, por lo menos</b>. Tu contrato o tu empresa pueden darte más, pero no menos.')
        + ul([
          'Si no trabajaste el año completo, te toca <b>la parte proporcional</b> al tiempo que trabajaste, sigas o no en ese empleo en diciembre.',
          'También tienen derecho las <b>trabajadoras y trabajadores del hogar</b> (artículo 334 Bis).',
          'Si trabajas en plataformas digitales, la ley dice que el pago por cada tarea ya incluye la parte proporcional del aguinaldo (artículo 291-F).',
          'El aguinaldo es para quien tiene una relación de trabajo subordinada. Si cobras por honorarios o como independiente, la ley laboral no te da aguinaldo.',
        ])
        + caja('¿Ya son 30 días?', p('No. En marzo de 2026 se presentó en la Cámara de Diputados una iniciativa para subir el aguinaldo a 30 días, pero no se ha aprobado. Hoy la ley sigue diciendo 15 días como mínimo.')) },
      { h2: 'Cómo calcular tu aguinaldo', html: p('Si trabajaste todo el año, multiplica tu salario diario por 15 (o por los días que te dé tu empresa, si son más). Si te pagan por mes, una forma común de sacar tu salario diario es dividir tu sueldo mensual entre 30.')
        + ejemplo('Ganas $400 al día y trabajaste todo 2026. ¿Cuánto es tu aguinaldo mínimo?', ul([
          '15 días × $400 = <b>$6,000</b>.',
        ]))
        + ejemplo('Ganas $9,000 al mes. ¿Cuál es tu aguinaldo mínimo si trabajaste todo el año?', ul([
          'Salario diario: $9,000 ÷ 30 = <b>$300</b>.',
          'Aguinaldo: 15 × $300 = <b>$4,500</b>.',
        ]))
        + p('La ley no dice si se calcula con tu salario base o con el integrado (que suma otras prestaciones). Revisa tu contrato y tu recibo; si tu empresa te da más de 15 días, también viene ahí.') },
      { h2: 'Si no trabajaste el año completo', html: p('Te toca la parte proporcional. La forma de calcularla: divide tu aguinaldo de año completo entre 365 y multiplícalo por los días que trabajaste.')
        + ejemplo('Ganas $400 al día y entraste a trabajar a mediados de año: llevas 182 días. ¿Cuánto te toca?', ul([
          'Aguinaldo de año completo: 15 × $400 = $6,000.',
          'Proporcional: $6,000 ÷ 365 × 182 = <b>$2,991.78</b>.',
        ])) },
      { h2: 'Cuánto queda libre de impuestos', html: p('La Ley del ISR (artículo 93, fracción XIV) exenta las gratificaciones anuales, como el aguinaldo, hasta el equivalente de <b>30 días de salario mínimo</b>. Por la reforma constitucional de desindexación de 2016, las referencias al salario mínimo como unidad de medida se entienden hechas a la <b>UMA</b>, que en 2026 vale 117.31 pesos diarios (INEGI, vigente desde el 1 de febrero de 2026).')
        + ejemplo('Tu aguinaldo es de $6,000. ¿Cuánto paga ISR?', ul([
          'Parte exenta: 30 × $117.31 = <b>$3,519.30</b>.',
          'Parte que sí paga ISR: $6,000 − $3,519.30 = <b>$2,480.70</b>, que se suma a tu sueldo para calcular la retención.',
        ]))
        + nota('Como referencia, el salario mínimo general de 2026 es de 315.04 pesos diarios y el de la Zona Libre de la Frontera Norte, de 440.87 pesos (CONASAMI). Tu retención exacta depende de tu sueldo: revisa tu recibo de nómina.') },
      { h2: 'Si no te lo pagan', html: ol([
          ['Pídelo por escrito', 'Un correo o un mensaje a recursos humanos, con fecha. Guarda tus recibos de nómina.'],
          ['Acude a PROFEDET', 'La Procuraduría Federal de la Defensa del Trabajo da orientación y representación gratuitas. En su nota sobre el aguinaldo publica los teléfonos 800 911 7877 y 800 717 2942 y el correo orientacionprofedet@stps.gob.mx.'],
          ['No dejes pasar el plazo', 'Según la ley (artículo 516), tienes un año para reclamar, contado a partir del día siguiente a que debió pagarse.'],
        ])
        + p('No pagar el aguinaldo puede costarle al patrón una multa de 50 a 5,000 veces la UMA (artículo 1002 de la Ley Federal del Trabajo).') },
      { h2: 'Qué hacer con tu aguinaldo', html: p('Esto es consejo nuestro: antes de que llegue, decide en qué se va. Una forma sencilla:')
        + ol([
          ['Primero, lo que debes', 'Si tienes una tarjeta con saldo, pagarla te ahorra intereses. Lo explicamos en cómo salir de deudas.'],
          ['Luego, tu colchón', 'Una parte a tu fondo de emergencia.'],
          ['Después, enero', 'Aparta para los gastos de inicio de año: inscripciones, predial, seguros.'],
          ['Y el gusto, con monto fijo', 'Date un gusto, pero con un tope decidido desde antes.'],
        ])
        + p(`Si quieres empezar a ahorrar con lo que te sobre, revisa ${a(r(S.ahorro), 'cómo ahorrar si eres joven')}.`) },
    ],
    faq: [
      { p: '¿Cuántos días de aguinaldo me tocan en 2026?', r: 'Por lo menos 15 días de salario, según el artículo 87 de la Ley Federal del Trabajo. La iniciativa para subirlo a 30 días no se ha aprobado. Tu empresa puede darte más, pero no menos.' },
      { p: '¿Cuándo es la fecha límite para pagar el aguinaldo?', r: 'Antes del 20 de diciembre, según la Ley Federal del Trabajo.' },
      { p: '¿Me toca aguinaldo si no trabajé todo el año?', r: 'Sí, la parte proporcional al tiempo que trabajaste, aunque ya no estés en ese empleo en diciembre. Divide tu aguinaldo de año completo entre 365 y multiplícalo por los días trabajados.' },
      { p: '¿El aguinaldo paga impuestos?', r: 'Solo la parte que pase de 30 días de salario mínimo, que por la desindexación de 2016 se calcula con la UMA: en 2026, 30 × 117.31 pesos. Lo demás se suma a tu sueldo para calcular la retención.' },
      { p: '¿Qué hago si no me pagan el aguinaldo?', r: 'Pídelo por escrito y, si no te lo pagan, acude a PROFEDET, que orienta y representa gratis. Tienes un año para reclamar.' },
    ],
    fuentes: [F.lft, F.lisr, F.cpeum, F.uma, F.conasami, F.profedet, F.gacetaAguinaldo],
    relacionadas: [S.ahorro, S.deudas, S.tarjeta],
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
    kicker: `Guía · ${FINANZAS.nombre}`, imagen: OG_FINANZAS, actual: FINANZAS.clave, anuncios, actualizado: x.actualizado || ACTUALIZADO_FIN, actualizadoTxt: x.actualizadoTxt || ACTUALIZADO_TXT,
    notaFuentes: `<p class="gu-nota">Actualizado: ${x.actualizadoTxt || ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; las reglas y las condiciones de cada institución pueden cambiar, así que confírmalas en tu contrato o con la institución.</p>
    <p class="gu-nota lr-aviso-fin"><b>${AVISO_FINANZAS}</b></p>`,
    llamado: LLAMADO[x.llamado], compartirTexto: 'Compártela con quien le pueda ayudar a cuidar su dinero.',
    rel, relTitulo: 'Más guías de finanzas personales', notaPie: NOTA_PIE,
  });
}

// El índice de la sección (/learn/finanzas/) lo arma src/learn/paginas.js › paginaIndiceSeccion('finanzas'), igual que el
// de cada examen; la sección está registrada en el catálogo de Learn (src/learn/datos.js).
