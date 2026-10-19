// Puntos Vorka · reglas del programa (sin dependencias: las usan la lógica, las páginas y las pruebas)

export const PUNTOS_POR_COMPRA = 10;
export const MULTIPLICADOR_DOBLE = 2;      // sugerencia aceptada o promoción: 20 puntos por esa compra (no se acumulan)
export const COBRO_MINIMO = 1000;          // centavos: Stripe no cobra menos de $10 MXN

// Niveles por compras con tu liga (de por vida, sin contar las reembolsadas). Son reconocimiento: no dan dinero ni puntos extra.
export const NIVELES = [
  { id: 'inicial', nombre: 'Inicial', min: 0, color: '#A8A4A9', texto: 'Tu liga lista para compartir.' },
  { id: 'bronce', nombre: 'Bronce', min: 3, color: '#C98B5A', texto: 'Insignia y tarjeta Bronce en tu app.' },
  { id: 'plata', nombre: 'Plata', min: 10, color: '#C9CCD1', texto: 'Insignia y tarjeta Plata en tu app.' },
  { id: 'oro', nombre: 'Oro', min: 25, color: '#E3C47E', texto: 'Insignia y tarjeta Oro en tu app.' },
  { id: 'diamante', nombre: 'Diamante', min: 50, color: '#B9E4F2', texto: 'Insignia Diamante: lo más alto del programa.' },
];
export function nivelDe(ventas) {
  let i = 0;
  NIVELES.forEach((n, k) => { if (ventas >= n.min) i = k; });
  const actual = NIVELES[i], siguiente = NIVELES[i + 1] || null;
  const progreso = siguiente ? (ventas - actual.min) / (siguiente.min - actual.min) : 1;
  return { actual, siguiente, indice: i, faltan: siguiente ? siguiente.min - ventas : 0, progreso: Math.max(0, Math.min(1, progreso)) };
}

// Meta personal: un producto de la tienda. Como siempre se cobran $10, bastan (precio − $10) puntos para llevártelo.
export const objetivoMeta = precioCentavos => Math.max(0, Math.round((precioCentavos - COBRO_MINIMO) / 100));
export const ventasPara = puntos => Math.max(0, Math.ceil(puntos / PUNTOS_POR_COMPRA));

// Logros (insignias). Se calculan con los datos de la cuenta; no dan puntos.
export const LOGROS = [
  { id: 'primera', nombre: 'Primera venta', texto: 'Alguien compró con tu liga.', icono: 'estrella' },
  { id: 'cinco', nombre: '5 ventas', texto: 'Cinco compras con tu liga.', icono: 'fuego' },
  { id: 'diez', nombre: '10 ventas', texto: 'Diez compras con tu liga.', icono: 'cohete' },
  { id: 'veinticinco', nombre: '25 ventas', texto: 'Veinticinco compras con tu liga.', icono: 'corona' },
  { id: 'cincuenta', nombre: '50 ventas', texto: 'Cincuenta compras con tu liga.', icono: 'diamante' },
  { id: 'variedad', nombre: '3 productos', texto: 'Vendiste 3 productos distintos.', icono: 'cajas' },
  { id: 'doble', nombre: 'Puntos dobles', texto: 'Ganaste puntos dobles en una compra.', icono: 'rayo' },
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
