-- La instalación de Negocio Completo pasa a «Arranque en 7 días» de $1,490 (antes $3,490). El diseño de la página ya va
-- incluido en la mensualidad (plan de 12 meses, igual que Tu página web); el Arranque cobra lo que el plan no trae:
-- el equipo da de alta y configura Agenda y Vuelve del cliente, QR de mostrador, video de uso y entrega garantizada en 7 días.
UPDATE products SET precio_centavos = 149000, nombre = 'Arranque en 7 días',
  descripcion_corta = 'Te dejamos configuradas tu Agenda y tu tarjeta de Vuelve con tus servicios y tu premio, con tu QR de mostrador y un video de uso, funcionando en 7 días. Pago único.'
WHERE id = 'prod_negocio_completo_instalacion';
