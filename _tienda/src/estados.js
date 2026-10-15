// Máquina de estados de la orden. No sabe de Stripe ni de Mercado Pago:
// cada proveedor traduce su evento a un resultado normalizado y aquí se decide qué pasa.

export const ESTADOS = ['pending', 'paid', 'failed', 'refunded'];
export const RESULTADOS = ['aprobado', 'pendiente', 'rechazado', 'reembolsado'];

// accion: 'entregar' (generar token + correo) · 'revocar' (apagar tokens) · null (nada)
const TABLA = {
  pending:  { aprobado: ['paid', 'entregar'], pendiente: ['pending', null], rechazado: ['failed', null], reembolsado: ['refunded', null] },
  // Un pago "fallido" de OXXO/SPEI no revive; si llega aprobado tarde (raro, pero pasa) sí se entrega
  failed:   { aprobado: ['paid', 'entregar'], pendiente: ['failed', null], rechazado: ['failed', null], reembolsado: ['refunded', null] },
  // Ya pagada: repetir "aprobado" no vuelve a entregar (idempotencia)
  paid:     { aprobado: ['paid', null], pendiente: ['paid', null], rechazado: ['paid', null], reembolsado: ['refunded', 'revocar'] },
  refunded: { aprobado: ['refunded', null], pendiente: ['refunded', null], rechazado: ['refunded', null], reembolsado: ['refunded', null] },
};

export function transicion(actual, resultado) {
  const fila = TABLA[actual];
  if (!fila) throw new Error(`Estado desconocido: ${actual}`);
  const paso = fila[resultado];
  if (!paso) throw new Error(`Resultado desconocido: ${resultado}`);
  const [estado, accion] = paso;
  return { estado, accion, cambia: estado !== actual };
}
