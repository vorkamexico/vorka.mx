-- El Arranque en 7 días ahora incluye el diseño personalizado de la página (la mensualidad trae la página con diseño
-- profesional adaptado a su logo y colores). Así el Arranque pesa más y se elige más.
UPDATE products SET
  descripcion_corta = 'Diseñamos tu página a la medida de tu marca y te dejamos configuradas tu Agenda y tu tarjeta de Vuelve, con tu QR de mostrador y un video de uso, funcionando en 7 días. Pago único.'
WHERE id = 'prod_negocio_completo_instalacion';
