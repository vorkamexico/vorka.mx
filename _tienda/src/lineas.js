// Líneas de la tienda (Educación, Negocios, Eventos, Finanzas personales). Viven aparte de tienda.js para que las usen
// también los descuentos (cupones de regalo por línea) sin importaciones circulares.
// Líneas de la tienda según la categoría del producto (se agrupan sin importar mayúsculas ni acentos).
// Una categoría nueva desde el panel aparece sola como línea con su propio nombre.
export const SECCIONES_TIENDA = [
  { id: 'examenes', claves: ['examenes', 'educacion', 'proyectos sociales', 'cursos'], linea: 'Educación', titulo: 'Preparación para exámenes', texto: 'Simuladores con tutor y reporte de preparación para llegar seguro a tu examen de admisión: PAA, UNAM, ECOEMS y prepa UG.',
    // Con Ruta de Impacto a la venta, la línea también habla del curso (si no, se queda como estaba)
    variante: { si: p => p.contenido?.acceso?.app === 'ruta', titulo: 'Exámenes y proyectos', texto: 'Simuladores con tutor para tu examen de admisión (PAA, UNAM, ECOEMS y prepa UG) y Ruta de Impacto, el curso para sacar adelante tu proyecto social.' } },
  { id: 'negocios', claves: ['negocios', 'citas', 'agenda', 'lealtad', 'ventas', 'vende', 'kits', 'emprender'], linea: 'Negocios', titulo: 'Herramientas para tu negocio',
    texto: 'Agenda para que tus clientes reserven solos, Vuelve para que regresen y Vende para tus pedidos y cobros. Pruébalas gratis.' },
  { id: 'eventos', claves: ['eventos', 'invitaciones', 'celebraciones'], linea: 'Eventos', titulo: 'Eventos e invitaciones',
    texto: 'Brindi: invitaciones digitales para bodas, XV años y toda celebración. Cupo: la página de tu evento con registro, cover y check-in con QR, gratis hasta 30 personas.' },
  { id: 'finanzas', claves: ['finanzas', 'finanzas personales'], linea: 'Finanzas personales', titulo: 'Tus préstamos en orden', texto: 'Cuentas: lleva lo que prestas a familiares y amigos, cada abono, intereses claros y el saldo al día. Prueba gratis 7 días.',
    // Con Clara a la venta, la línea también habla de ella (si no, se queda como estaba)
    variante: { si: p => p.contenido?.acceso?.app === 'clara', titulo: 'Tus finanzas en orden', texto: 'Clara: tus tarjetas, fechas de corte y de pago y tus gastos claros, desde 15 años y gratis con 1 tarjeta. Cuentas: lo que prestas a familiares y amigos, al día.' } },
];
export const sinAcentos = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function seccionesCatalogo(productos) {
  const grupos = new Map();
  for (const p of productos) {
    const k = sinAcentos(p.categoria);
    const def = SECCIONES_TIENDA.find(s => s.claves.includes(k));
    const id = def?.id || (k ? k.replace(/[^a-z0-9]+/g, '-') : 'mas');
    if (!grupos.has(id)) grupos.set(id, { id, def, linea: def?.linea || p.categoria || 'Más', titulo: def?.titulo || p.categoria || 'Más productos', texto: def?.texto || '', productos: [] });
    grupos.get(id).productos.push(p);
  }
  for (const g of grupos.values()) { const v = g.def?.variante; if (v && g.productos.some(v.si)) Object.assign(g, { titulo: v.titulo, texto: v.texto }); delete g.def; }
  // El orden de las secciones sigue al primer producto de cada una (campo "orden" del panel)
  return [...grupos.values()];
}

// Id de la línea de un producto ('examenes', 'negocios', 'eventos', 'finanzas' o el de su categoría)
export const lineaDe = p => seccionesCatalogo([p])[0]?.id || null;
// Las líneas fijas, para elegir el alcance de un cupón de regalo
export const LINEAS = SECCIONES_TIENDA.map(s => ({ id: s.id, linea: s.linea }));
