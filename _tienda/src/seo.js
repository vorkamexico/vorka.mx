// Datos estructurados (JSON-LD de schema.org) que comparten las páginas de producto de la tienda: ofertas, migas y la
// etiqueta <script>. Un solo lugar para que todas las fichas digan lo mismo a Google.
//
// Política de devoluciones (hasMerchantReturnPolicy): NO se publica, a propósito. Lo que está publicado
// (vorka.mx/legal/reembolsos/ y las condiciones de cada app) es condicional: en descargables y simuladores hay reembolso
// dentro de 5 días hábiles solo si no descargaste ni usaste nada; en Brindi y Cupo Pro, 10 días naturales si no publicaste;
// en suscripciones, solo el plan anual dentro de 10 días. schema.org no puede expresar «solo si no lo usaste», y una
// ventana de N días sin esa condición le prometería a Google (y a quien ve el resultado) algo que no ofrecemos; tampoco
// sirve «sin devoluciones», porque sí las hay. Además son productos digitales: no hay envío ni devolución física.
// Si algún día la política es una ventana sin condiciones, se agrega aquí y sale en todas las fichas.

export const SITIO = 'https://vorka.mx';
export const VENDEDOR = Object.freeze({ '@type': 'Organization', name: 'Vorka México', url: SITIO });
const DISPONIBLE = 'https://schema.org/InStock';
const PRONTO = 'https://schema.org/PreOrder';

const absoluta = ruta => /^https?:/.test(ruta) ? ruta : SITIO + ruta;
const pesos = centavos => (Number(centavos) / 100).toFixed(2);

/**
 * Una oferta. ruta: la canónica de la página (relativa o absoluta). Lleva disponibilidad, vendedor y URL siempre.
 * centavos o price (ya en pesos con 2 decimales); disponible = false → PreOrder (fichas que aún no se venden).
 */
export function oferta({ ruta, centavos, price, moneda = 'MXN', disponible = true, ...extra }) {
  return { '@type': 'Offer', ...extra, url: absoluta(ruta), price: price ?? pesos(centavos), priceCurrency: moneda,
    availability: disponible ? DISPONIBLE : PRONTO, seller: VENDEDOR };
}

/**
 * Varias ofertas en una ficha (planes): AggregateOffer con el rango de precios, cuántas son y, si se pasan, cada una
 * como Offer completa. desde: precio mínimo en centavos si hay un plan gratis que no está en la tienda (Cupo).
 */
export function ofertas({ ruta, centavos, moneda = 'MXN', desde, cuantas, detalle }) {
  const lista = centavos.filter(c => Number.isFinite(c));
  return { '@type': 'AggregateOffer', url: absoluta(ruta), priceCurrency: moneda,
    lowPrice: pesos(desde ?? Math.min(...lista)), highPrice: pesos(Math.max(...lista)), offerCount: cuantas ?? lista.length,
    availability: DISPONIBLE, seller: VENDEDOR, ...(detalle?.length ? { offers: detalle.map(d => oferta({ ruta, moneda, ...d })) } : {}) };
}

/**
 * Oferta de una suscripción (SaaS de creadores): el precio es por periodo, así que va con priceSpecification
 * UnitPriceSpecification y referenceQuantity de 1 mes (MON) o 1 año (ANN) (códigos UN/CEFACT) — así Google no la lee
 * como pago único. seller: quien cobra (Vorka México, el comercio); la marca del producto va aparte (brand).
 */
export function ofertaSuscripcion({ ruta, centavos, intervalo, moneda = 'MXN', nombre }) {
  const price = pesos(centavos);
  return { ...oferta({ ruta, price, moneda, ...(nombre ? { name: nombre } : {}) }),
    priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: moneda,
      referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: intervalo === 'year' ? 'ANN' : 'MON' } } };
}

/**
 * Migas: Inicio › Tienda › Producto. ruta: la canónica del producto. medio: [nombre, ruta] opcionales entre Tienda y el
 * producto (p. ej. Brindi › Bodas).
 */
export function migas(nombre, ruta, medio = []) {
  const pasos = [['Inicio', '/'], ['Tienda', '/tienda/'], ...medio, [nombre, ruta]];
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: pasos.map(([name, r], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absoluta(r) })) };
}

// <script type="application/ld+json"> seguro para incrustar en el HTML (ningún «</script>» del texto lo puede cerrar)
export const ldScript = ld => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
