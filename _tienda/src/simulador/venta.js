// Página de venta de un simulador (la que encuentra Google): mismo diseño para PAA, UNAM, ECOEMS…; el contenido sale de
// la configuración de cada uno (paa.js, unam.js, …). Si el simulador aún no tiene planes en D1, muestra "muy pronto".
import { esc } from '../paginas.js';
import { pagina } from '../paginas.js';
import { productoPorSlug, registrarAnalitica } from '../modelo.js';
import { formCompra, SCRIPT_COMPRA, precio, refDeVisita } from '../tienda.js';
import { FLECHA, CHECK } from '../marco.generado.js';
import { TOTAL_DIAG } from './diagnostico.js';

const SITIO = 'https://vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
const CSS = `<style>
.sv-hero{padding:clamp(12px,3vw,40px) 0 clamp(40px,5vw,64px)}
.sv-hero-g{display:grid;gap:32px 56px;align-items:start}
@media(min-width:980px){.sv-hero-g{grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr)}}
.sv-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.sv-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;background:var(--morado-suave);color:var(--morado)}
.sv-chip.oro{background:#fbf3e2;color:#8a6a2c}
.sv-hero h1{margin-top:16px}
.sv-hero .t-lead{margin-top:16px;max-width:600px}
.sv-sellos{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:18px;font-size:14.5px;color:var(--fg-2)}
.sv-sellos li{display:flex;align-items:center;gap:6px}.sv-sellos svg{width:16px;height:16px;color:var(--verde)}
.sv-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.sv-diag{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-top:16px;padding:16px 18px;border-radius:18px;background:var(--fg);color:var(--bg);text-decoration:none;box-shadow:var(--sombra-2)}
.sv-diag span{display:grid;gap:2px}.sv-diag b{font-size:17px;letter-spacing:-.015em}.sv-diag small{font-size:14px;opacity:.78}
.sv-diag em{font-style:normal;font-weight:750;font-size:14.5px;display:inline-flex;align-items:center;gap:6px;color:var(--acento)}.sv-diag em svg{width:16px;height:16px}
.sv-compra{position:sticky;top:96px}
.sv-planes{display:grid;gap:10px;margin-bottom:14px}
.sv-plan{position:relative;display:block;padding:16px 18px;border-radius:18px;background:var(--card);border:1.5px solid var(--line);color:inherit;text-decoration:none;transition:border-color var(--t-rapido),box-shadow var(--t-rapido)}
.sv-plan:hover{border-color:var(--line-2)}.sv-plan.sel{border-color:var(--fg);box-shadow:var(--sombra-2)}
.sv-plan.sel::before{content:"";position:absolute;top:18px;right:18px;width:18px;height:18px;border-radius:50%;background:var(--fg);box-shadow:inset 0 0 0 4px var(--card)}
.sv-plan-c{display:flex;align-items:baseline;gap:10px;padding-right:28px}.sv-plan-c b{font-size:17px;letter-spacing:-.015em}.sv-plan-c em{font-style:normal;font-weight:750;margin-left:auto}
.sv-plan small{display:block;color:var(--fg-2);font-size:13.5px;margin-top:2px}
.sv-plan ul{display:none;margin:10px 0 0;gap:6px}.sv-plan.sel ul{display:grid}
.sv-plan li{display:flex;gap:8px;align-items:flex-start;font-size:14px;color:var(--fg-2)}.sv-plan li svg{width:16px;height:16px;flex:none;margin-top:2px;color:var(--verde)}
.sv-ahorro{position:absolute;top:-10px;left:16px;padding:3px 10px;border-radius:999px;background:var(--acento);color:var(--sobre-acento);font-size:12px;font-weight:800}
.sv-plan.rec{border-color:color-mix(in srgb,var(--acento) 60%,var(--line))}.sv-plan.rec.sel{border-color:var(--fg)}
.sv-tag{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:var(--morado-suave);color:var(--morado);font-size:11.5px;font-weight:700;vertical-align:2px}.sv-tag.oro{background:color-mix(in srgb,var(--acento) 18%,transparent);color:color-mix(in srgb,var(--acento) 55%,var(--fg))}
.sv-pronto{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:26px;box-shadow:var(--sombra)}
.sv-pronto p{color:var(--fg-2);margin:8px 0 18px}
.sv-cifras{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--linea-o);border-radius:var(--r);overflow:hidden}
@media(min-width:760px){.sv-cifras{grid-template-columns:repeat(4,1fr)}}
.sv-cifras div{background:var(--noche-2);padding:26px 22px}
.sv-cifras b{display:block;font-size:clamp(36px,4.4vw,52px);font-weight:750;letter-spacing:-.04em;line-height:1;background:var(--metal-osc);-webkit-background-clip:text;background-clip:text;color:transparent}
.sv-cifras span{display:block;margin-top:8px;font-size:14.5px;color:var(--claro-2)}
.sv-pasos{display:grid;gap:18px;margin-top:28px}
@media(min-width:900px){.sv-pasos{grid-template-columns:repeat(3,1fr)}}
.sv-paso{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra);display:flex;flex-direction:column}
.sv-paso figure{aspect-ratio:16/10;background:var(--bg-2);overflow:hidden}
.sv-paso img{width:100%;height:100%;object-fit:cover;display:block}
.sv-paso div{padding:20px 22px 24px}
.sv-paso small{font-size:13px;font-weight:700;color:var(--morado)}
.sv-paso h3{font-size:19px;letter-spacing:-.02em;margin:6px 0 6px}
.sv-paso p{color:var(--fg-2);font-size:15px}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px;margin-top:28px}
.sv-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px;box-shadow:var(--sombra)}
.sv-card h3{font-size:18px;letter-spacing:-.02em;margin-bottom:8px}.sv-card p{color:var(--fg-2);font-size:15.5px}
.sv-tabla{width:100%;border-collapse:collapse;margin-top:24px;font-size:15px}
.sv-tabla th,.sv-tabla td{text-align:left;padding:14px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.sv-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650}
.sv-tabla td:last-child{color:var(--fg-2)}
.sv-dot{display:inline-block;width:7px;height:16px;border-radius:2px;transform:skewX(var(--skew));margin-right:10px;vertical-align:-2px}
.s-morado{background:var(--morado)}.s-oro{background:var(--oro)}.s-verde{background:var(--verde)}.s-tinta{background:var(--fg)}
@media(max-width:640px){.sv-tabla.sec td:last-child,.sv-tabla.sec thead th:last-child{display:none}}
.sv-comp th{font-weight:600}.sv-comp td{text-align:center;width:120px}.sv-comp thead th:not(:first-child){text-align:center}
.sv-comp thead th:nth-child(2){color:var(--morado)}
.sv-si svg{width:20px;height:20px;color:var(--verde);display:inline-block}
.sv-no{color:var(--fg-3);font-weight:700}
.sv-ej{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(20px,3vw,32px);margin-top:24px;box-shadow:var(--sombra)}
.sv-ej .sv-tema{display:inline-block;font-size:12.5px;font-weight:650;color:var(--morado);background:var(--morado-suave);padding:3px 10px;border-radius:999px}
.sv-ej h3{font-size:19px;letter-spacing:-.02em;line-height:1.4;margin-top:12px}
.sv-ops{display:flex;flex-direction:column;gap:9px;margin:16px 0 0}
.sv-ops button{display:flex;gap:12px;align-items:center;width:100%;text-align:left;padding:13px 15px;border:1.5px solid var(--line);border-radius:15px;background:var(--card);font:inherit;font-size:16px;cursor:pointer;transition:border-color .15s,background .15s}
.sv-ops button:hover:not(:disabled){border-color:var(--fg)}
.sv-ops button span{width:28px;height:28px;border-radius:9px;background:var(--bg-2);display:grid;place-items:center;font-size:13px;font-weight:750;flex:none}
.sv-ops button.sv-x{opacity:.5;border-style:dashed;text-decoration:line-through}
.sv-ops button.sv-ok{border-color:var(--verde);background:var(--verde-suave);opacity:1}.sv-ops button.sv-ok span{background:var(--verde);color:#fff}
.sv-ops button.sv-mal{border-color:#e9b4b0;background:#fdf1f0}
.sv-ops button:disabled{cursor:default}
.sv-tutor{margin-top:16px;padding:16px 18px;border-radius:16px;border:1px solid var(--line);font-size:15.5px;line-height:1.55}
.sv-tutor > b{display:block;margin-bottom:4px}.sv-tutor p b{display:inline}
.sv-tutor.pista{background:#fbf6ea;border-color:#eedfb8}.sv-tutor.bien{background:var(--verde-suave);border-color:#c6e5d2}.sv-tutor.sol{background:var(--morado-suave);border-color:#e3d4ea}
.sv-tutor ol{list-style:decimal;padding-left:20px;margin:8px 0;display:flex;flex-direction:column;gap:4px}
.sv-tutor small{display:block;margin-top:6px;color:var(--fg-2);font-size:13px}
.sv-ej-cta{margin-top:10px;font-weight:650}.sv-ej-cta a{color:var(--morado)}
.sv-regalo{display:grid;gap:28px 56px;align-items:center}
@media(min-width:900px){.sv-regalo{grid-template-columns:1fr 1fr}}
.sv-regalo img{width:100%;height:auto;border-radius:var(--r);display:block}
.sv-regalo ul{display:flex;flex-direction:column;gap:10px;margin:20px 0 26px}
.sv-regalo li{display:flex;gap:10px;align-items:flex-start;color:var(--fg-2);font-size:16px}
.sv-regalo li svg{width:18px;height:18px;color:var(--verde);flex:none;margin-top:3px}
.sv-final{text-align:center}
.sv-final .h2{max-width:760px;margin:0 auto}
.sv-final p{margin:16px auto 28px;max-width:560px}
.sv-final .botones{justify-content:center}
.sv-dos{display:grid;gap:28px 64px;align-items:start}
@media(min-width:960px){.sv-dos{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}.sv-pegado{position:sticky;top:110px}}
.sv-dos .sv-ej{margin-top:0}
.sv-probar{margin-top:26px}.sv-probar > b{display:block;font-size:15px;letter-spacing:-.01em}.sv-probar > small{display:block;color:var(--fg-2);font-size:14px;margin-top:2px}
.sv-probar .sv-ej{margin-top:12px}
.t-barra .sv-barra-b{display:flex;gap:6px}.t-barra b,.t-barra small{white-space:nowrap}.t-barra .sv-barra-b .btn{padding-inline:12px;font-size:14px}@media(max-width:370px){.t-barra small{display:none}}
.sv-mini-l{display:flex;flex-direction:column;gap:10px;margin-top:22px}
.sv-mini-l li{display:flex;gap:10px;align-items:flex-start;font-size:16px;color:var(--fg-2)}.sv-mini-l li b{color:var(--fg)}
.sv-mini-l svg{width:18px;height:18px;color:var(--verde);flex:none;margin-top:3px}
.sv-dos .t-faq{margin-top:0}
.sv-disc{padding:28px 0 56px}
.sv-ya{margin-top:28px;padding:22px;border-radius:var(--r);border:1px dashed var(--line-2);display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between}
.sv-ya p{color:var(--fg-2);font-size:15.5px;max-width:520px}
.sv-planes-cab{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 12px;margin-bottom:20px}.sv-planes-cab b{font-size:17px;letter-spacing:-.015em}.sv-planes-cab a{font-size:14px;font-weight:650;color:var(--morado)}
.sv-planes{gap:14px}
.sv-plan-c em{white-space:nowrap}.sv-plan-c em s{color:var(--fg-3);font-weight:500;font-size:14px;margin-right:2px}
.sv-falta{color:var(--fg-3)!important;font-size:13px!important}.sv-falta::before{content:"✕ ";font-weight:700}
.sv-plan.rec{background:color-mix(in srgb,var(--acento) 7%,var(--card))}
.sv-empuje{display:flex;flex-direction:column;gap:6px;margin:-2px 0 14px;padding:14px 16px;border-radius:16px;border:1.5px dashed color-mix(in srgb,var(--acento) 60%,var(--line));color:inherit;text-decoration:none;font-size:14.5px;line-height:1.45}
.sv-empuje > b{color:var(--morado);display:inline-flex;align-items:center;gap:6px}.sv-empuje svg{width:15px;height:15px}
.sv-dif-w{margin-top:28px;overflow-x:auto}
.sv-dif{width:100%;border-collapse:separate;border-spacing:0;font-size:15px;table-layout:fixed}.sv-dif thead th:first-child{width:40%}
.sv-dif th,.sv-dif td{padding:14px 10px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
.sv-dif tbody th{text-align:left;font-weight:600}
.sv-dif thead th{vertical-align:bottom}.sv-dif thead b{display:block;font-size:17px;letter-spacing:-.015em}.sv-dif thead span{display:block;color:var(--fg-2);font-weight:650;margin-top:2px}
.sv-dif thead small{display:inline-block;margin-bottom:6px;padding:2px 9px;border-radius:999px;background:var(--acento);color:var(--sobre-acento);font-size:11.5px;font-weight:800}
.sv-dif .rec{background:color-mix(in srgb,var(--acento) 9%,transparent)}.sv-dif thead .rec{border-radius:16px 16px 0 0}.sv-dif tfoot .rec{border-radius:0 0 16px 16px}
.sv-parcial{font-size:12.5px;font-weight:650;color:var(--fg-2);line-height:1.3}
.sv-dif tfoot td,.sv-dif tfoot th{border-bottom:0}
@media(max-width:560px){.sv-dif{font-size:13px}.sv-dif thead th:first-child{width:37%}.sv-dif th,.sv-dif td{padding:11px 3px}.sv-dif tbody th{padding-right:8px}.sv-dif thead b{font-size:13.5px;letter-spacing:-.02em}.sv-dif thead small{display:none}.sv-dif tfoot .btn{padding:8px 4px;font-size:12.5px;width:100%;justify-content:center}}
</style>`;

// sim: lo que devuelve crearSimulador · v: contenido de la página (ver paa.js)
export async function paginaVentaSimulador(sim, v, env, req, url) {
  const RUTA = sim.RUTA;
  // Planes a la venta; si todavía no están, la compra de siempre (PAA) o "muy pronto"
  const planes = (await Promise.all(v.planesVenta.map(async x => ({ ...x, prod: await productoPorSlug(env, sim.planes[x.k]) })))).filter(x => x.prod);
  const elegido = planes.find(x => x.k === url.searchParams.get('plan')) || planes.find(x => x.k === v.planInicial) || planes.find(x => x.k === 'paquete') || planes[0];
  const prod = elegido?.prod || (v.slugLegado ? await productoPorSlug(env, v.slugLegado) : null);
  const pk = k => planes.find(x => x.k === k);
  const ahorro = pk('practica') && pk('completo') && pk('paquete') ? pk('practica').prod.precio_centavos + pk('completo').prod.precio_centavos - pk('paquete').prod.precio_centavos : 0;
  // El Completo va primero y marcado; a quien elige solo una parte le decimos cuánto más cuesta llevarse las dos
  const orden = [...planes].sort((a, b) => (b.k === 'paquete') - (a.k === 'paquete'));
  const otro = { practica: pk('completo'), completo: pk('practica') }[elegido?.k];
  const extra = otro && pk('paquete') ? pk('paquete').prod.precio_centavos - elegido.prod.precio_centavos : 0;
  const empuje = extra > 0 ? `<a class="sv-empuje" href="?plan=paquete#comprar"><span>Por <b>${precio({ precio_centavos: extra })} más</b> te llevas también ${elegido.k === 'practica' ? 'los 2 exámenes completos' : 'la práctica ilimitada con tutor'} (${elegido.k === 'practica' ? 'solos cuestan' : 'sola cuesta'} ${precio(otro.prod)}).</span><b>Cambiar a Completo ${FLECHA}</b></a>` : '';
  const selector = planes.length ? `<div class="sv-planes-cab"><b>Elige tu plan</b>${v.diferencias ? '<a href="#diferencias">¿Cuál es la diferencia?</a>' : ''}</div>
    <div class="sv-planes" role="radiogroup" aria-label="Elige tu plan">${orden.map(x => `<a class="sv-plan${x === elegido ? ' sel' : ''}${x.k === 'paquete' ? ' rec' : ''}" role="radio" aria-checked="${x === elegido}" href="?plan=${x.k}#comprar">
      ${x.k === 'paquete' ? `<span class="sv-ahorro">Recomendado${ahorro > 0 ? ` · Ahorras ${precio({ precio_centavos: ahorro })}` : ''}</span>` : ''}<span class="sv-plan-c"><b>${x.nombre}</b><em class="num">${x.k === 'paquete' && ahorro > 0 ? `<s>${precio({ precio_centavos: x.prod.precio_centavos + ahorro }).replace(' MXN', '')}</s> ` : ''}${precio(x.prod)}</em></span><small>${esc(x.para)}</small>${x.falta ? `<small class="sv-falta">${esc(x.falta)}</small>` : ''}
      <ul>${x.trae().map(t => `<li>${CHECK}<span>${esc(t)}</span></li>`).join('')}</ul></a>`).join('')}</div>${empuje}` : '';
  // Tabla "¿Cuál es la diferencia?" (Práctica · Examen · Completo)
  const cols = ['practica', 'completo', 'paquete'].map(pk);
  const marca = b => typeof b === 'string' ? `<span class="sv-parcial">${esc(b)}</span>` : b ? `<span class="sv-si">${CHECK}<span class="sr">Incluye</span></span>` : '<span class="sv-no" aria-label="No incluye">—</span>';
  const diferencias = v.diferencias && cols.every(Boolean) ? `<section class="t-sec" id="diferencias"><div class="marco">
  <div class="cab"><span class="etiqueta">Los planes</span><h2 class="h2" style="margin-top:14px">¿Cuál es la diferencia?</h2>
  <p class="lead"><b>Práctica</b> es para entrenar. <b>Examen</b> es para medirte como el día del examen. <b>Completo</b> trae las dos cosas${ahorro > 0 ? ` y cuesta ${precio({ precio_centavos: ahorro })} menos que comprarlas por separado` : ''}.</p></div>
  <div class="sv-dif-w"><table class="sv-dif"><thead><tr><th scope="col"><span class="sr">Qué incluye</span></th>${cols.map(x => `<th scope="col"${x.k === 'paquete' ? ' class="rec"' : ''}>${x.k === 'paquete' ? '<small>Recomendado</small>' : ''}<b>${x.nombre}</b><span class="num">${precio(x.prod).replace(' MXN', '')}</span></th>`).join('')}</tr></thead>
  <tbody>${v.diferencias.map(([t, ...b]) => `<tr><th scope="row">${esc(t)}</th>${b.map((y, i) => `<td${i === 2 ? ' class="rec"' : ''}>${marca(y)}</td>`).join('')}</tr>`).join('')}</tbody>
  <tfoot><tr><th scope="row"></th>${cols.map(x => `<td${x.k === 'paquete' ? ' class="rec"' : ''}><a class="btn ${x.k === 'paquete' ? 'tinta' : 'blanco'} chico" href="?plan=${x.k}#comprar">Elegir</a></td>`).join('')}</tr></tfoot></table></div>
</div></section>` : '';
  const { code, cookie } = await refDeVisita(env, req, url);
  // Visita a la página de venta (como en el resto de la tienda)
  if (prod && req.method === 'GET' && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: prod.id, ref_code: code });
  const precioTxt = prod ? precio(prod) : null;
  const ej = v.ejemplo;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Product', name: v.nombreProducto, description: v.descripcion, image: v.imagenesLD,
      brand: { '@type': 'Brand', name: 'Vorka México' }, category: 'Preparación para exámenes de admisión', sku: v.sku,
      ...(planes.length ? { offers: { '@type': 'AggregateOffer', url: `${SITIO}${RUTA}/`, lowPrice: (Math.min(...planes.map(x => x.prod.precio_centavos)) / 100).toFixed(2), highPrice: (Math.max(...planes.map(x => x.prod.precio_centavos)) / 100).toFixed(2), offerCount: planes.length, priceCurrency: planes[0].prod.moneda, availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Vorka México' } } }
        : prod ? { offers: { '@type': 'Offer', url: `${SITIO}${RUTA}/`, price: (prod.precio_centavos / 100).toFixed(2), priceCurrency: prod.moneda, availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Vorka México' } } } : {}) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: v.faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Tienda', item: `${SITIO}/tienda/` },
      { '@type': 'ListItem', position: 2, name: sim.titulo, item: `${SITIO}${RUTA}/` }] },
  ];
  const sinLetras = t => esc(String(t).replace(/\{([A-D])\}/g, '$1'));
  const ejemplo = { correcta: ej.correcta, pista: ej.pista, pasos: ej.pasos.map(x => x.replace(/\{([A-D])\}/g, '$1')), regla: ej.regla };
  const comparar = v.comparar.map(([t, a, b]) => `<tr><th scope="row">${esc(t)}</th><td>${a === true ? `<span class="sv-si">${CHECK}<span class="sr">Sí</span></span>` : esc(a)}</td><td>${b === true ? `<span class="sv-si">${CHECK}</span>` : b ? esc(b) : '<span class="sv-no" aria-label="No">—</span>'}</td></tr>`).join('');
  const SCRIPT_EJEMPLO = `(function(){
  var box=document.getElementById('sv-ej'); if(!box) return;
  var D=${JSON.stringify(ejemplo).replace(/</g, '\\u003c')}, intentos=0, fin=false;
  var tutor=document.getElementById('sv-tutor');
  function li(t){var e=document.createElement('li');e.textContent=t;return e;}
  box.querySelectorAll('[data-o]').forEach(function(b){ b.addEventListener('click',function(){
    if(fin||b.disabled) return; var o=+b.dataset.o; intentos++;
    if(o===D.correcta||intentos>=2){ fin=true;
      box.querySelectorAll('[data-o]').forEach(function(x){ x.disabled=true; if(+x.dataset.o===D.correcta) x.classList.add('sv-ok'); });
      if(o!==D.correcta) b.classList.add('sv-mal');
      tutor.className='sv-tutor '+(o===D.correcta?'bien':'sol'); tutor.innerHTML='';
      var h=document.createElement('b'); h.textContent=o===D.correcta?(intentos===1?'¡Correcto a la primera!':'¡Bien! Lo lograste en el segundo intento'):'Esta era la respuesta correcta'; tutor.appendChild(h);
      var ol=document.createElement('ol'); D.pasos.forEach(function(p){ol.appendChild(li(p));}); tutor.appendChild(ol);
      var r=document.createElement('p'); r.innerHTML='<b>La regla:</b> '; r.appendChild(document.createTextNode(D.regla)); tutor.appendChild(r);
      var c=document.createElement('p'); c.className='sv-ej-cta'; c.innerHTML='Así funciona en cada uno de los ${v.banco} reactivos. <a href="${RUTA}/diagnostico/">Haz tu diagnóstico gratis →</a>'; tutor.appendChild(c);
    } else { b.disabled=true; b.classList.add('sv-x');
      tutor.className='sv-tutor pista'; tutor.innerHTML='<b>Todavía no. Pista del tutor</b>'; var p=document.createElement('p'); p.textContent=D.pista; tutor.appendChild(p);
      var s=document.createElement('small'); s.textContent='Tienes un intento más.'; tutor.appendChild(s); }
    tutor.hidden=false;
  }); });
})();`;
  const img = v.imagenes;
  return pagina({ entrar: { url: '/descargas/reenviar?para=simulador', app: sim.titulo },
    titulo: v.tituloSEO, ruta: `${RUTA}/`, descripcion: v.descripcion, imagen: v.og,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: (prod ? SCRIPT_COMPRA : '') + SCRIPT_EJEMPLO,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
${CSS}${v.css || ''}`,
    cuerpo: `
<section class="sv-hero"><div class="marco sv-hero-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Preparación para exámenes</nav>
    <div class="sv-chips"><span class="sv-chip">${esc(v.chip)}</span><span class="sv-chip oro"><span aria-hidden="true">🎁</span> También para regalar</span></div>
    <h1 class="t-h1">${esc(v.hero.h1)}</h1>
    <p class="t-lead">${esc(v.hero.lead)}</p>
    <ul class="sv-sellos">${v.hero.sellos.map(t => `<li>${CHECK}${esc(t)}</li>`).join('')}</ul>
    <div class="sv-probar" id="probar">
      <b>Pruébalo gratis: contesta un reactivo con el tutor</b><small>Si fallas, te da una pista; en el segundo intento, la solución paso a paso.</small>
      <div class="sv-ej" id="sv-ej">
        <span class="sv-tema">${esc(ej.etiqueta)}</span>
        <h3>${esc(ej.enunciado)}</h3>
        <div class="sv-ops">${ej.opciones.map((o, i) => `<button type="button" data-o="${i}"><span>${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>
        <div class="sv-tutor" id="sv-tutor" role="status" aria-live="polite" hidden></div>
        <noscript><p class="t-nota" style="margin-top:14px">Respuesta: ${'ABCD'[ej.correcta]}) ${esc(ej.opciones[ej.correcta])}. ${sinLetras(ej.regla)}</p></noscript>
      </div>
    </div>
    <a class="sv-diag" href="${RUTA}/diagnostico/"><span><b>¿Cuánto sacarías hoy?</b><small>Diagnóstico gratis: ${TOTAL_DIAG} preguntas con tutor y tu puntaje estimado</small></span><em>Hacerlo gratis ${FLECHA}</em></a>
    ${prod ? `<div class="sv-links"><a class="btn blanco chico" href="?regalo=1#comprar">🎁 Regalarlo</a></div>` : ''}
    <p class="t-ya">¿Ya lo compraste? <a href="/descargas/reenviar?para=simulador">Entra aquí</a></p>
  </div>
  <aside class="sv-compra" id="comprar" aria-label="Comprar el simulador">
    ${selector}${prod ? formCompra(prod, { error: url.searchParams.get('error') || '', ref: code || '', regalo: url.searchParams.get('regalo') === '1' }) : `<div class="sv-pronto"><b class="h3">Muy pronto en la tienda</b><p>Estamos por abrir las ventas del ${esc(sim.titulo)}.</p><a class="btn tinta" href="/tienda/">Ver la tienda ${FLECHA}</a></div>`}
  </aside>
</div></section>
${diferencias}
${v.despuesHero || ''}
<section class="t-sec oscura"><div class="marco">
  <div class="cab"><span class="etiqueta">Un banco que no se acaba en el primer intento</span><h2 class="h2">Cada intento es <span class="metal">diferente</span></h2>
  <p class="lead">Cada simulacro y cada examen prioriza preguntas que todavía no has visto, así que al repetir no te aprendes las respuestas: practicas de verdad.</p></div>
  <div class="sv-cifras">${v.cifras.map(([n, t]) => `<div><b class="num">${n}</b><span>${esc(t)}</span></div>`).join('')}</div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">Cómo funciona</span><h2 class="h2">Practica, aprende de cada error y mide tu avance</h2></div>
  <div class="sv-pasos">
    <article class="sv-paso"><figure><img src="${img.paso1 || img.portada}" alt="" loading="lazy" width="1600" height="${img.paso1 ? 1000 : 1200}"></figure><div><small>01 · Con cronómetro</small><h3>${esc(v.pasos[0][0])}</h3><p>${esc(v.pasos[0][1])}</p></div></article>
    <article class="sv-paso"><figure><img src="${img.paso2 || img.og}" alt="Pista del tutor después del primer error" loading="lazy" width="${img.paso2 ? 1600 : 1200}" height="${img.paso2 ? 1000 : 630}"></figure><div><small>02 · Tutor de dos intentos</small><h3>Si fallas, no te da la respuesta</h3><p>Te da una pista de método para que lo intentes otra vez. En el segundo intento ves la solución paso a paso y la regla detrás.</p></div></article>
    <article class="sv-paso"><figure><img src="${img.reporte}" alt="Reporte del simulador con medidor de preparación, resultado por sección y aciertos por tema" loading="lazy" width="1600" height="900"></figure><div><small>03 · Reporte</small><h3>Sabes exactamente qué reforzar</h3><p>${esc(v.pasos[2][1])}</p></div></article>
  </div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">Qué incluye</span><h2 class="h2">Más que un examen de práctica</h2></div>
  <div class="sv-grid">${v.incluye.map(x => `
    <div class="sv-card"><h3>${esc(x.titulo)}${x.tag ? ` <small class="sv-tag${x.oro ? ' oro' : ''}">${esc(x.tag)}</small>` : ''}</h3><p>${esc(x.texto)}</p></div>`).join('')}
  </div>
  <table class="sv-tabla sv-comp" style="margin-top:40px"><thead><tr><th scope="col">Lo que necesitas para prepararte</th><th scope="col">Simulador Vorka</th><th scope="col">Guía en PDF</th></tr></thead><tbody>${comparar}</tbody></table>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab par"><div><span class="etiqueta">Estructura</span><h2 class="h2" style="margin-top:14px">${esc(v.estructura.titulo)}</h2></div>
  <p class="lead">${v.estructura.lead}</p></div>
  ${v.estructura.tabla}
</div></section>
${v.antesRegalo || ''}
${prod ? `<section class="t-sec"><div class="marco sv-regalo">
  <img src="${img.regalo}" alt="Tarjeta de regalo del ${esc(sim.titulo)} con mensaje personalizado" loading="lazy" width="1200" height="900">
  <div>
    <span class="etiqueta">Para regalar</span><h2 class="h2" style="margin-top:14px">Regálalo a quien va a presentar</h2>
    <ul>
      <li>${CHECK}<span>Elige <b>Para regalar</b> y cuántos: te llega una liga por cada persona, con tu mensaje.</span></li>
      <li>${CHECK}<span>Cada liga funciona <b>una sola vez</b>: al abrirla, el acceso queda a nombre de quien la recibe y nadie más puede usarla.</span></li>
      <li>${CHECK}<span>Ideal para hijos, sobrinos, amigos o todo un grupo de estudiantes.</span></li>
    </ul>
    <a class="btn tinta" href="?regalo=1#comprar">Regalar el simulador ${FLECHA}</a>
  </div>
</div></section>` : ''}

<section class="t-sec suave"><div class="marco sv-dos">
  <div class="sv-dos-t sv-pegado">
    <span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">${esc(v.faqTitulo)}</h2>
    <div class="sv-ya"><p><b>¿Ya lo compraste o te lo regalaron?</b> Entra con el botón de tu correo. Si cambiaste de dispositivo o no encuentras el correo, te mandamos un enlace nuevo.</p><a class="btn blanco chico" href="/descargas/reenviar">Recibir mi enlace ${FLECHA}</a></div>
  </div>
  <div class="t-faq">${v.faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
</div></section>

${prod ? `<section class="t-sec oscura sv-final"><div class="marco">
  <span class="etiqueta">Tu próximo paso</span>
  <h2 class="h2" style="margin-top:14px">Llega al examen sabiendo <span class="metal">qué esperar</span></h2>
  <p class="lead">${esc(v.final)}</p>
  <div class="botones"><a class="btn plata" href="#comprar">Comprar por ${precioTxt} ${FLECHA}</a><a class="btn vidrio" href="${RUTA}/diagnostico/">Diagnóstico gratis</a></div>
</div></section>` : ''}
<section class="sv-disc"><div class="marco"><p class="t-nota">${esc(v.aviso)}</p></div></section>
${prod ? `<div class="t-barra" id="barra-compra"><div><b class="num">${precioTxt}</b><small>Acceso inmediato</small></div><div class="sv-barra-b"><a class="btn blanco chico" href="${RUTA}/diagnostico/">Prueba gratis</a><a class="btn tinta chico" href="#comprar">Comprar</a></div></div>` : ''}`,
  });
}
