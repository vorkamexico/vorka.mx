// Puntos Vorka · reglas del programa (sin dependencias: las usan la lógica, las páginas y las pruebas)

export const COBRO_MINIMO = 1000;          // centavos: Stripe no cobra menos de $10 MXN
// Cada compra con tu liga da un % de lo cobrado en puntos (1 punto = $1 MXN), según tu nivel del semestre.
// En promociones y en productos que sugeriste (y aceptamos) se suman puntos extra: +10 puntos porcentuales, con tope de 40%.
export const PCT_EXTRA = 10;
export const PCT_TOPE = 40;
// Equipo de Vorka México (personas activas en Vorka OS, puntos_cuentas.equipo = 1): ganan sus puntos ×1.5. Se multiplica el %
// de cada venta (nivel + extra) y se respeta el mismo tope (PCT_TOPE): Inicial 15%, Bronce 22.5%, Plata 30%, Oro 37.5%,
// Diamante 40% (el tope). Única fuente del factor: cambiarlo aquí cambia el cálculo y lo que muestra Vorka OS.
export const FACTOR_EQUIPO = 1.5;
// % de una venta para una cuenta: el del nivel (+ extra), por el factor del equipo si aplica, con tope (máximo 1 decimal)
export const pctEfectivo = (pct, equipo = false) => Math.min(PCT_TOPE, Math.round(pct * (equipo ? FACTOR_EQUIPO : 1) * 10) / 10);
export const FACTURAS_SUSCRIPCION = 12;   // renovaciones de una suscripción que dan puntos (la compra es la 1)
// Equipo de Vorka en suscripciones (migración 0060): 'unico' = el % del nivel solo en el primer pago; 'recurrente' = este %
// fijo (sin ×1.5) en cada pago mientras la persona siga en el equipo. Cambiarlo aquí aplica a los pagos que vengan.
export const PCT_RECURRENTE = 5;
export const MODOS_SUSCRIPCION = ['unico', 'recurrente'];
// Transferencia a cuenta: solo cuentas habilitadas por el equipo (no se anuncia en ningún texto público)
export const MINIMO_RETIRO = 500;          // puntos
export const RETENCION_DIAS = 7;           // los puntos de una venta se pueden transferir 7 días después (reembolsos)

// Embajadores Vorka (red de vendedores, migración 0066, src/embajadores.js). Se gana por ventas reales a clientes, nunca por
// invitar. Sobre cada venta que da puntos a un vendedor (misma base que sus puntos): su patrocinador gana PCT_RED[0] y el
// patrocinador de su patrocinador PCT_RED[1]. Sin ×1.5 del equipo. Tope por venta: vendedor + red + descuento al cliente
// ≤ PCT_TOPE_VENTA (si se pasa, se recorta primero el nivel 2 y luego el nivel 1).
export const PCT_RED = [5, 2];
export const PCT_TOPE_VENTA = 50;
// Bono de arranque: puntos al vendedor nuevo si su primera venta válida es dentro de estos días desde su registro (una vez)
export const BONO_ARRANQUE = 50;
export const DIAS_ARRANQUE = 30;
// Rangos del mes (hora del centro de México). Reconocimiento: no dan dinero ni puntos.
//   Líder: LIDER_ACTIVOS personas de su equipo directo con al menos 1 venta válida en el mes (el líder no necesita vender).
//   Líder Élite: ser Líder y tener ELITE_LIDERES Líderes en su equipo directo.
export const LIDER_ACTIVOS = 3;
export const ELITE_LIDERES = 2;
export const RANGOS = [
  { id: 'vendedor', nombre: 'Vendedor(a)', color: '#A8A4A9' },
  { id: 'lider', nombre: 'Líder', color: '#E3C47E' },
  { id: 'elite', nombre: 'Líder Élite', color: '#B9E4F2' },
];
export const rangoDe = id => RANGOS.find(r => r.id === id) || RANGOS[0];
// Sin vender hace N días: a partir de aquí se sugiere mandar un mensaje de ánimo
export const DIAS_SIN_VENDER = 30;
// La sección «Ganancias reales» de la página del programa se muestra solo con al menos estas cuentas con ganancias
export const MIN_CUENTAS_GANANCIAS = 20;
// Reparto de la red para una venta: pctVendedor y pctDescuento en puntos porcentuales → [nivel 1, nivel 2] con el tope
export function pctRed(pctVendedor, pctDescuento = 0) {
  let libre = Math.max(0, PCT_TOPE_VENTA - (Number(pctVendedor) || 0) - (Number(pctDescuento) || 0));
  const n1 = Math.min(PCT_RED[0], libre); libre -= n1;
  const n2 = Math.min(PCT_RED[1], libre);
  return [Math.round(n1 * 10) / 10, Math.round(n2 * 10) / 10];
}
// Mes del centro de México: { id: 'AAAA-MM', desde, hasta (ISO UTC) }
export function mesMx(fecha = new Date()) {
  const id = typeof fecha === 'string' && /^\d{4}-\d{2}$/.test(fecha) ? fecha : diaMx(fecha).slice(0, 7);
  const [a, m] = id.split('-').map(Number), sig = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
  return { id, desde: inicioDiaMx(`${id}-01`), hasta: inicioDiaMx(`${sig}-01`) };
}

// Niveles por compras con tu liga en el SEMESTRE (ene–jun y jul–dic, hora del centro de México; sin contar las
// reembolsadas). Cada semestre todos empiezan en Inicial. El % de una venta es el del nivel que tenías antes de ella.
export const NIVELES = [
  { id: 'inicial', nombre: 'Inicial', min: 0, pct: 10, color: '#A8A4A9', texto: '10% de cada compra con tu liga.' },
  { id: 'bronce', nombre: 'Bronce', min: 3, pct: 15, color: '#C98B5A', texto: '15% de cada compra con tu liga.' },
  { id: 'plata', nombre: 'Plata', min: 10, pct: 20, color: '#C9CCD1', texto: '20% de cada compra con tu liga.' },
  { id: 'oro', nombre: 'Oro', min: 25, pct: 25, color: '#E3C47E', texto: '25% de cada compra con tu liga.' },
  { id: 'diamante', nombre: 'Diamante', min: 50, pct: 30, color: '#B9E4F2', texto: '30%: lo más alto del programa.' },
];
export function nivelDe(ventas) {
  let i = 0;
  NIVELES.forEach((n, k) => { if (ventas >= n.min) i = k; });
  const actual = NIVELES[i], siguiente = NIVELES[i + 1] || null;
  const progreso = siguiente ? (ventas - actual.min) / (siguiente.min - actual.min) : 1;
  return { actual, siguiente, indice: i, faltan: siguiente ? siguiente.min - ventas : 0, progreso: Math.max(0, Math.min(1, progreso)) };
}
// % de una venta: el del nivel con las ventas previas del semestre, + extra si aplica, con tope
export const pctPara = (ventasPrevias, extra = false, equipo = false) => pctEfectivo(nivelDe(ventasPrevias).actual.pct + (extra ? PCT_EXTRA : 0), equipo);
// Puntos enteros de una venta: base en centavos × % (redondeado)
export const puntosDe = (baseCentavos, pct) => Math.max(0, Math.round(baseCentavos * pct / 10000));

// Semestre del centro de México de una fecha: { id: '2026-2', inicio: '2026-07-01', fin: '2026-12-31', desde, hasta (ISO UTC) }
export function semestreMx(fecha = new Date()) {
  const dia = diaMx(fecha), anio = Number(dia.slice(0, 4)), segundo = Number(dia.slice(5, 7)) >= 7;
  const inicio = `${anio}-${segundo ? '07' : '01'}-01`, siguiente = segundo ? `${anio + 1}-01-01` : `${anio}-07-01`;
  return { id: `${anio}-${segundo ? 2 : 1}`, inicio, fin: sumarDias(siguiente, -1), desde: inicioDiaMx(inicio), hasta: inicioDiaMx(siguiente) };
}

// Meta personal: un producto de la tienda. Como siempre se cobran $10, bastan (precio − $10) puntos para llevártelo.
export const objetivoMeta = precioCentavos => Math.max(0, Math.round((precioCentavos - COBRO_MINIMO) / 100));
// Cuántas compras de un producto con tu liga te faltan para juntar `puntos` con tu % actual (estimado)
export const ventasPara = (puntos, precioCentavos, pct) => {
  const porVenta = puntosDe(precioCentavos, pct);
  return puntos <= 0 ? 0 : porVenta > 0 ? Math.ceil(puntos / porVenta) : null;
};

// Logros (insignias). Se calculan con los datos de la cuenta; no dan puntos.
export const LOGROS = [
  { id: 'primera', nombre: 'Primera venta', texto: 'Alguien compró con tu liga.', icono: 'estrella' },
  { id: 'cinco', nombre: '5 ventas', texto: 'Cinco compras con tu liga.', icono: 'fuego' },
  { id: 'diez', nombre: '10 ventas', texto: 'Diez compras con tu liga.', icono: 'cohete' },
  { id: 'veinticinco', nombre: '25 ventas', texto: 'Veinticinco compras con tu liga.', icono: 'corona' },
  { id: 'cincuenta', nombre: '50 ventas', texto: 'Cincuenta compras con tu liga.', icono: 'diamante' },
  { id: 'variedad', nombre: '3 productos', texto: 'Vendiste 3 productos distintos.', icono: 'cajas' },
  { id: 'doble', nombre: 'Puntos extra', texto: 'Ganaste puntos extra en una compra.', icono: 'rayo' },
  { id: 'canje', nombre: 'Primer canje', texto: 'Usaste tus puntos en la tienda.', icono: 'regalo' },
  { id: 'sugeriste', nombre: 'Primera idea', texto: 'Nos mandaste una sugerencia.', icono: 'foco' },
  { id: 'idea', nombre: 'Buena idea', texto: 'Aceptamos un producto que sugeriste.', icono: 'estrella' },
  { id: 'meta', nombre: 'Meta cumplida', texto: 'Juntaste los puntos de tu meta.', icono: 'bandera' },
  { id: 'avisos', nombre: 'Siempre al tanto', texto: 'Activaste los avisos en tu celular.', icono: 'campana' },
];

// Fechas en hora del centro de México (UTC−6 todo el año desde 2022)
export const diaMx = (fecha = new Date()) => new Date(new Date(fecha).getTime() - 6 * 3600e3).toISOString().slice(0, 10);
export const inicioDiaMx = dia => `${dia}T06:00:00.000Z`;
export const sumarDias = (dia, n) => { const t = new Date(`${dia}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

// Nombre para el ranking: nombre y la inicial del apellido ("Ana López Pérez" → "Ana L.")
export function nombrePublico(nombre) {
  const p = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'Anónimo';
  const may = s => s.charAt(0).toLocaleUpperCase('es-MX') + s.slice(1);
  return p.length > 1 ? `${may(p[0])} ${p[1].charAt(0).toLocaleUpperCase('es-MX')}.` : may(p[0]);
}
