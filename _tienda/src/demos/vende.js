// Demo de Vende: «Hoy» con a quién escribirle (el WhatsApp ya redactado), anotar una venta a crédito con el total, tu costo y
// tu ganancia al momento, anotar el abono y ver la ganancia real del mes (vendido contra cobrado, para reponer y para ti).
// Mismas cuentas que la app (calcularPedido y resumenGanancia) y mismas plantillas de WhatsApp. Clientas y productos de ejemplo.
export default {
  titulo: 'Anota una venta y mira cuánto ganaste de verdad.',
  texto: 'Toma el pedido de una clienta, anota su abono y ve tu ganancia real del mes, con el mensaje de WhatsApp ya redactado para cobrar sin pena.',
  prueba: ['Anotar una venta a crédito y ver tu ganancia al momento', 'Registrar un abono en dos toques', 'Ver el WhatsApp listo para recordarle a tu clienta'],
  cta: 'Quiero Vende · gratis para empezar',
  css: `
#dm{background:#fff}
.ve-app{--ve-tinte:color-mix(in srgb,var(--pm) 8%,#fff);--ve-bg2:#f7f6f4;--ve-tx:#141114;--ve-mu:#5e5a60;--ve-mu2:#8d898f;--ve-bd:#eceaec;--ve-bd2:#d9d6d9;--ve-campo:#b9b5ba;
  --ve-ok:#1f7a47;--ve-okb:#e8f4ed;--ve-er:#b3261e;--ve-erb:#fcebe9;--ve-wab:#fff5dc;--ve-az:#1d4e89;--ve-azb:#e8f0fa;
  background:#fff;color:var(--ve-tx);font:17px/1.5 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",Roboto,sans-serif}
:where(.ve-app) button{font:inherit;color:inherit;cursor:pointer}
.ve-app h1{font-size:1.65rem;font-weight:750;letter-spacing:-.03em;margin:.2em 0 .3em;line-height:1.15}
.ve-app h2{font-size:1.15rem;font-weight:700;letter-spacing:-.015em;margin:1.3em 0 .5em}
.ve-app h3{font-size:1.05rem;font-weight:650;margin:.5em 0 .15em;line-height:1.3}
.ve-app p{margin:.35em 0}.ve-app b,.ve-app strong{font-weight:650}
.ve-app .num,.ve-n{font-variant-numeric:tabular-nums}
.ve-top{position:sticky;top:0;z-index:6;display:flex;align-items:center;gap:12px;min-height:58px;padding:10px 16px;background:#fff;border-bottom:1px solid var(--ve-bd)}
.ve-marca{width:34px;height:34px;flex:none;border-radius:10px;background:var(--pm);display:grid;place-items:center;color:#fff}.ve-marca svg{width:19px;height:19px}
.ve-top b{display:block;font-size:1.02rem;font-weight:700;line-height:1.2}.ve-top small{display:block;font-size:.78rem;color:var(--ve-mu)}
.ve-main{padding:12px 16px 20px}
.ve-v[hidden]{display:none}
.ve-s{color:var(--ve-mu);font-size:.9rem}
.ve-card{background:#fff;border:1px solid var(--ve-bd);border-radius:20px;padding:15px 16px;margin:12px 0;box-shadow:0 1px 2px rgba(20,17,20,.04),0 6px 20px rgba(20,17,20,.05)}
.ve-card.dest{border-color:transparent;background:var(--ve-tinte);box-shadow:none}
.ve-fila{display:flex;gap:10px;align-items:center;justify-content:space-between}
.ve-grande{font-size:1.9rem;font-weight:750;letter-spacing:-.03em}
.ve-hecho{background:var(--ve-okb);color:var(--ve-ok);border-radius:20px;padding:13px 16px;margin:10px 0;font-weight:650}
.ve-resumen{display:flex;align-items:center;gap:14px;background:var(--ve-bg2);border-radius:20px;padding:15px 16px;margin:12px 0 4px}
.ve-resumen .n{font-size:2.1rem;font-weight:750;letter-spacing:-.04em;line-height:1;color:var(--pm)}
.ve-accion{padding:16px}
.ve-tipo{display:flex;align-items:center;gap:10px;font-size:.88rem;font-weight:650;color:var(--ve-mu)}
.ve-tipo i{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:1rem;background:var(--ve-tinte)}
.ve-accion.cobro .ve-tipo i{background:var(--ve-erb)}.ve-accion.recompra .ve-tipo i{background:var(--ve-okb)}
.ve-acc{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.ve-accion .ve-acc .ve-btn{flex:1 1 100%}
.ve-mini{display:flex;gap:18px;flex-wrap:wrap;margin-top:6px;border-top:1px solid var(--ve-bd);padding-top:2px}
.ve-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:8px 20px;border-radius:999px;border:0;background:var(--pm);color:#fff;font-weight:650;letter-spacing:-.005em;text-align:center}
.ve-btn:active{transform:scale(.98)}
.ve-btn.sec{background:var(--ve-tinte);color:var(--pm)}.ve-btn.wa{background:var(--ve-okb);color:var(--ve-ok)}.ve-btn.peq{min-height:44px;padding:6px 16px;font-size:.95rem}.ve-btn.ancho{width:100%}
.ve-btn svg{width:22px;height:22px;flex:none}
.ve-btn:disabled{opacity:.5;cursor:default}
.ve-enlace{background:none;border:0;color:var(--pm);font-weight:600;padding:8px 2px;min-height:44px;display:inline-flex;align-items:center}
.ve-enlace.gris{color:var(--ve-mu)}
.ve-atajos{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ve-atajo{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:12px;min-height:100px;padding:15px;border-radius:20px;border:1px solid var(--ve-bd);background:#fff;font-weight:650;text-align:left;line-height:1.25}
.ve-atajo i{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-style:normal;background:var(--ve-tinte);color:var(--pm);font-size:1.3rem;font-weight:700}
.ve-atajo.prim{background:var(--pm);color:#fff;border-color:transparent}.ve-atajo.prim i{background:rgba(255,255,255,.2);color:inherit}
/* formulario */
.ve-app label{display:block;font-weight:650;margin:12px 0 6px}
.ve-app input,.ve-app select{width:100%;min-height:50px;padding:11px 14px;border:1.5px solid var(--ve-campo);border-radius:14px;background:#fff;color:var(--ve-tx);font:inherit;font-size:16px}
.ve-app input:focus,.ve-app select:focus{border-color:var(--pm);outline:none;box-shadow:0 0 0 4px var(--ve-tinte)}
.ve-app input[type=checkbox]{width:24px;height:24px;min-height:0;accent-color:var(--pm);flex:none;margin:1px 0 0}
.ve-check{display:flex!important;gap:12px;align-items:flex-start;font-weight:500!important}
.ve-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ve-g2>*{min-width:0}
.ve-seg{display:flex;flex-wrap:wrap;gap:8px}
.ve-seg button{flex:1 0 auto;padding:0 14px;min-height:46px;border:1.5px solid var(--ve-bd2);border-radius:999px;background:#fff;font-size:.93rem;font-weight:600}
.ve-seg button[aria-pressed=true]{background:var(--ve-tx);border-color:var(--ve-tx);color:#fff}
.ve-item{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--ve-bd);border-radius:20px;padding:12px 14px;margin:8px 0;min-height:60px}
.ve-item .cu{flex:1;min-width:0}.ve-item .t{display:block;font-weight:650;line-height:1.25}
.ve-cant{display:flex;align-items:center;gap:8px}.ve-cant b{min-width:1.2em;text-align:center}
.ve-cant .ve-btn{width:44px;padding:0;font-size:1.3rem}
details.ve-det{margin-top:6px}
details.ve-det summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center;gap:8px;list-style:none;color:var(--pm)}
details.ve-det summary::-webkit-details-marker{display:none}
details.ve-det summary::before{content:"+";display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--ve-tinte);font-weight:700;flex:none}
details.ve-det[open] summary::before{content:"−"}
.ve-chip{display:inline-block;font-size:.8rem;font-weight:650;padding:3px 11px;border-radius:999px;background:var(--ve-bg2);color:var(--ve-mu);white-space:nowrap;vertical-align:middle}
.ve-chip.rojo{background:var(--ve-erb);color:var(--ve-er)}.ve-chip.verde{background:var(--ve-okb);color:var(--ve-ok)}.ve-chip.aviso{background:var(--ve-wab);color:#855600}.ve-chip.marca{background:var(--ve-tinte);color:var(--pm)}
.ve-kpi{background:var(--ve-bg2);border-radius:14px;padding:11px 13px}
.ve-kpi .v{font-size:1.18rem;font-weight:750;letter-spacing:-.02em;line-height:1.2;white-space:nowrap;font-variant-numeric:tabular-nums}
.ve-kpi .l{font-size:.82rem;color:var(--ve-mu);line-height:1.3}
.ve-kpi.gan{background:var(--ve-tinte)}.ve-kpi.gan .v{color:var(--pm)}
.ve-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.ve-g3 .ve-kpi .v{font-size:1rem}
.ve-app table{width:100%;border-collapse:collapse;font-size:.92rem}
.ve-app th,.ve-app td{padding:9px 5px;border-bottom:1px solid var(--ve-bd);text-align:left;vertical-align:top}
.ve-app th{color:var(--ve-mu);font-weight:600;font-size:.84rem}
.ve-app td.n,.ve-app th.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.ve-app tr.nuevo td{background:var(--ve-tinte)}
.ve-barra{height:12px;background:var(--ve-bg2);border-radius:8px;overflow:hidden;margin:8px 0}.ve-barra i{display:block;height:100%;background:var(--pm);border-radius:8px;transition:width .5s}
.ve-ayuda{font-size:.86rem;color:var(--ve-mu);margin-top:4px}
.ve-aviso{font-size:.84rem;color:var(--ve-mu);border-top:1px solid var(--ve-bd);padding:12px 2px 0;margin:22px 0 6px}
/* navegación inferior */
.ve-nav{position:sticky;bottom:0;z-index:6;display:flex;justify-content:space-around;padding:6px 4px;background:#fff;border-top:1px solid var(--ve-bd)}
.ve-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;border:0;background:none;color:var(--ve-mu);font-size:.76rem;font-weight:600;min-height:58px;justify-content:center}
.ve-nav svg{width:24px;height:24px;padding:3px 13px;box-sizing:content-box;border-radius:999px}
.ve-nav button[aria-current=page]{color:var(--ve-tx)}.ve-nav button[aria-current=page] svg{background:var(--ve-tinte);color:var(--pm)}
/* hoja */
.ve-velo{position:fixed;inset:0;background:rgba(20,17,20,.38);z-index:40;display:flex;align-items:flex-end;justify-content:center}
.ve-hoja{background:#fff;width:100%;max-width:480px;max-height:92vh;overflow:auto;border-radius:26px 26px 0 0;padding:10px 18px 22px;animation:ve-sube .2s ease-out;overscroll-behavior:contain}
.ve-hoja::before{content:"";display:block;width:44px;height:5px;border-radius:3px;background:var(--ve-bd2);margin:0 auto 10px}
.ve-hoja-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.ve-hoja-top h2{margin:6px 0}
.ve-x{width:44px;height:44px;border:0;border-radius:50%;background:var(--ve-bg2);display:grid;place-items:center;flex:none}.ve-x svg{width:20px;height:20px}
@keyframes ve-sube{from{transform:translateY(30px);opacity:.5}}
@media (prefers-reduced-motion:reduce){.ve-hoja{animation:none}}
.ve-wa{background:#efe7dd;border-radius:18px;padding:14px;margin:10px 0 14px}
.ve-burbuja{background:#d9fdd3;border-radius:14px 14px 4px 14px;padding:10px 12px 18px;font-size:.95rem;line-height:1.45;white-space:pre-wrap;position:relative;margin-left:18px;box-shadow:0 1px 1px rgba(0,0,0,.08);color:#111b21}
.ve-burbuja small{position:absolute;right:10px;bottom:3px;font-size:.68rem;color:#667781}
.ve-para{font-size:.82rem;color:#54656f;margin:0 0 8px;font-weight:600}
`,
  html: `
<div class="ve-app">
  <div class="ve-top"><span class="ve-marca"><svg viewBox="69 225 940 909" aria-hidden="true"><path fill="currentColor" d="M69 226H311L652 877L526 1133Z"/><path fill="currentColor" d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg></span><span><b id="ve-tit">Hoy</b><small>Modo independiente</small></span></div>
  <div class="ve-main">
    <section class="ve-v" data-v="hoy"></section>
    <section class="ve-v" data-v="nuevo" hidden></section>
    <section class="ve-v" data-v="pedido" hidden></section>
    <section class="ve-v" data-v="cobros" hidden></section>
    <section class="ve-v" data-v="ganancia" hidden></section>
  </div>
  <nav class="ve-nav" aria-label="Secciones"></nav>
</div>`,
  js: `
(()=>{
const dm=document.getElementById('dm'),$=s=>dm.querySelector(s),$$=s=>[...dm.querySelectorAll(s)];
const P=c=>(c<0?'−':'')+'$'+(Math.abs(c)/100).toLocaleString('es-MX',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2});
const P2=c=>'$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const D=s=>{const a=s.split('-').map(Number);return new Date(a[0],a[1]-1,a[2])};
const mas=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const fLarga=s=>{const d=D(s);return d.getDate()+' de '+MESES[d.getMonth()]+' de '+d.getFullYear()};
const fSin=s=>{const d=D(s);return d.getDate()+' de '+MESES[d.getMonth()]};
const fCorta=s=>{const d=D(s);return d.getDate()+' '+MESES[d.getMonth()].slice(0,3)};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]);
const centavos=v=>Math.round((Number(String(v).replace(/[^\\d.]/g,''))||0)*100);
const HOY=iso(new Date()),VEND='Fernanda';
const ic=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const WA='<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z"/></svg>';
const I={hoy:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',pedidos:'<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',cobros:'<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',ganancia:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>'};
// ---------- datos de ejemplo ----------
const CLIENTAS=[{id:'a',nom:'Adriana Cruz',saldo:194167,venc:45000,dias:20,sig:{monto:37300,fecha:mas(HOY,4)},folio:12},{id:'x',nom:'Ximena Paredes',saldo:87000,venc:43500,dias:6,sig:{monto:43500,fecha:mas(HOY,4)},folio:17},
  {id:'y',nom:'Yolanda Ríos',saldo:0,venc:0},{id:'l',nom:'Lucía Torres',saldo:0,venc:0}];
const PRODS=[{id:'crema',nom:'Crema hidratante 50 ml',precio:29000,costo:18000},{id:'base',nom:'Base líquida',precio:34000,costo:21500},{id:'labial',nom:'Labial mate',precio:18900,costo:11000},{id:'perfume',nom:'Perfume 100 ml',precio:65000,costo:42000}];
const MES={vendido:842000,costo:531000,cobrado:612000,pedidos:12,retirado:80000,semana:182500};
const PEDIDOS=[{folio:18,fecha:mas(HOY,-2),total:63000,costo:45000},{folio:17,fecha:mas(HOY,-6),total:87000,costo:55500},{folio:16,fecha:mas(HOY,-9),total:63000,costo:39000}];
const S={vista:'hoy',acc:{cobro:'pendiente',recompra:'pendiente'},pedido:null};
const cl=id=>CLIENTAS.find(c=>c.id===id);
const prim=n=>n.split(' ')[0];
// mensajes (mismas plantillas que la app)
const MSJ={cobro:(c,monto,fecha)=>'¡Hola, '+prim(c.nom)+'! Te comparto un recordatorio amable: '+(fecha?'el '+fLarga(fecha)+' tocaba':'queda pendiente')+' un pago de '+P(monto)+'. Tu saldo total es '+P(c.saldo)+'. Cuando puedas me avisas, y si ya lo enviaste, ¡muchas gracias!',
  recompra:(c,p)=>'¡Hola, '+prim(c.nom)+'! Soy '+VEND+'. Calculo que tu '+p+' ya está por terminarse. ¿Quieres que te aparte otro? Con gusto te lo llevo.',
  pedido:p=>'¡Hola! Te comparto un recordatorio amable del pedido #'+p.folio+': quedan '+P(p.total-p.pagado)+' por cubrir. Cuando puedas me avisas. ¡Gracias!'};
// cuentas del pedido (calcularPedido) y cuotas
function calcular(d){let sub=0,cos=0;d.items.forEach(it=>{sub+=it.cant*it.precio;cos+=it.cant*it.costo});const total=sub;const costo=cos+d.envio+d.regalos;return{sub:sub,total:total,costo:costo,ganancia:total-costo}}
function cuotas(total,n,desde,cada){const base=Math.floor(total/n),r=[];for(let k=0;k<n;k++)r.push({monto:k===n-1?total-base*(n-1):base,fecha:mas(desde,k*cada)});return r}
// ---------- vistas ----------
const TIT={hoy:'Hoy',nuevo:'Nuevo pedido',pedido:'Pedido',cobros:'Cobros',ganancia:'Ganancia'};
function ver(v){S.vista=v;$$('.ve-v').forEach(x=>x.hidden=x.dataset.v!==v);$('#ve-tit').textContent=v==='pedido'&&S.pedido?'Pedido #'+S.pedido.folio:TIT[v];({hoy:pintarHoy,nuevo:pintarNuevo,pedido:pintarPedido,cobros:pintarCobros,ganancia:pintarGanancia})[v]();pintarNav();scrollTo(0,0)}
function pintarNav(){const act=S.vista==='nuevo'||S.vista==='pedido'?'nuevo':S.vista;$('.ve-nav').innerHTML=[['hoy','Hoy','hoy'],['nuevo','Pedidos','pedidos'],['cobros','Cobros','cobros'],['ganancia','Ganancia','ganancia']].map(x=>'<button type="button" data-ir="'+x[0]+'"'+(act===x[0]?' aria-current="page"':'')+'>'+ic(I[x[2]])+x[1]+'</button>').join('')}
function pintarHoy(){const a=cl('a'),y=cl('y'),pend=Object.values(S.acc).filter(x=>x==='pendiente').length;
  const card=(k,html)=>S.acc[k]==='pendiente'?html:'<div class="ve-hecho">'+(S.acc[k]==='hecha'?'✓ Hecho. ¡Bien!':'Lo dejamos para después.')+' <button type="button" class="ve-enlace" style="color:inherit;text-decoration:underline;min-height:32px;padding:0 4px" data-deshacer="'+k+'">Deshacer</button></div>';
  $('[data-v=hoy]').innerHTML='<h1>Hola, '+VEND+'</h1><p class="ve-s" style="margin-top:0">'+fLarga(HOY)+'</p>'
   +'<div class="ve-hecho">✓ Registraste '+P2(MES.semana)+' en cobros esta semana</div>'
   +(pend?'<div class="ve-resumen"><span class="n">'+pend+'</span><span><strong>'+(pend===1?'cosa por hacer hoy':'cosas por hacer hoy')+'</strong><br><span class="ve-s">Empieza por la primera.</span></span></div>':'')
   +card('cobro','<div class="ve-card ve-accion cobro"><div class="ve-tipo"><i aria-hidden="true">💵</i>Cobro</div><h3>Cobro pendiente: '+a.nom+'</h3><p class="ve-s">'+(a.venc?P(a.venc)+' del pedido #'+a.folio+' · '+a.dias+' días · ':'')+'saldo '+P(a.saldo)+'</p>'
     +'<div class="ve-acc"><button type="button" class="ve-btn wa" data-wa="cobro">'+WA+'Mandarle WhatsApp</button><button type="button" class="ve-btn sec" data-abono="a">Ya me pagó: anotar abono</button></div>'
     +'<div class="ve-mini"><button type="button" class="ve-enlace" data-marcar="cobro">✓ Ya lo hice</button><button type="button" class="ve-enlace gris" data-omitir="cobro">Hoy no</button></div></div>')
   +card('recompra','<div class="ve-card ve-accion recompra"><div class="ve-tipo"><i aria-hidden="true">🛍️</i>Le toca pedir</div><h3>'+y.nom+' podría necesitar Crema hidratante 50 ml</h3><p class="ve-s">Lo compró el '+fSin(mas(HOY,-52))+'; se le acaba el '+fSin(mas(HOY,3))+'</p>'
     +'<div class="ve-acc"><button type="button" class="ve-btn wa" data-wa="recompra">'+WA+'Mandarle WhatsApp</button></div>'
     +'<div class="ve-mini"><button type="button" class="ve-enlace" data-marcar="recompra">✓ Ya lo hice</button><button type="button" class="ve-enlace gris" data-omitir="recompra">Hoy no</button></div></div>')
   +'<h2>¿Qué quieres hacer?</h2><div class="ve-atajos"><button type="button" class="ve-atajo prim" data-ir="nuevo"><i aria-hidden="true">+</i>Anotar una venta</button><button type="button" class="ve-atajo" data-ir="ganancia"><i aria-hidden="true">$</i>Cuánto llevo ganado</button></div>'
   +'<p class="ve-aviso">Vende es una herramienta de registro: no mueve dinero, no presta y no cobra por ti.</p>'}
// nuevo pedido
let F=null;
function pintarNuevo(){if(!F)F={clienta:'',items:[],forma:'credito',mod:'cuotas',pagado:true,anticipo:0,envio:0,regalos:0};
  $('[data-v=nuevo]').innerHTML='<h1>Nuevo pedido</h1>'
   +'<div class="ve-card"><label for="ve-cl">Clienta</label><select id="ve-cl"><option value="">Elige a tu clienta…</option>'+CLIENTAS.map(c=>'<option value="'+c.id+'"'+(F.clienta===c.id?' selected':'')+'>'+c.nom+'</option>').join('')+'</select></div>'
   +'<div class="ve-card"><h2 style="margin-top:0">Productos</h2><div id="ve-cat">'+PRODS.map(p=>'<div class="ve-item"><span class="cu"><span class="t">'+p.nom+'</span><span class="ve-s">Belleza Ejemplo · '+P(p.precio)+'</span></span><button type="button" class="ve-btn sec peq" data-agregar="'+p.id+'" aria-label="Agregar '+p.nom+'">+ Agregar</button></div>').join('')+'</div><div id="ve-car"></div></div>'
   +'<div class="ve-card"><details class="ve-det"><summary>Envío que pagas tú y regalos</summary><div class="ve-g2"><div><label for="ve-env">Envío que pagas tú</label><input id="ve-env" inputmode="decimal" placeholder="$0"></div><div><label for="ve-reg">Regalos o muestras</label><input id="ve-reg" inputmode="decimal" placeholder="$0"></div></div></details></div>'
   +'<div class="ve-card"><h2 style="margin-top:0">Pago</h2><div class="ve-seg" role="group" aria-label="Forma de pago">'+[['efectivo','Efectivo'],['transferencia','Transferencia'],['credito','A crédito']].map(x=>'<button type="button" data-forma="'+x[0]+'" aria-pressed="'+(F.forma===x[0])+'">'+x[1]+'</button>').join('')+'</div>'
   +'<div id="ve-contado"'+(F.forma==='credito'?' hidden':'')+'><label class="ve-check" style="margin-top:12px"><input type="checkbox" id="ve-pagado"'+(F.pagado?' checked':'')+'> Ya me pagó completo</label></div>'
   +'<div id="ve-credito"'+(F.forma==='credito'?'':' hidden')+'><label for="ve-ant">Anticipo recibido</label><input id="ve-ant" inputmode="decimal" placeholder="$0"><div class="ve-seg" style="margin-top:12px" role="group" aria-label="Cómo te va a pagar"><button type="button" data-mod="libre" aria-pressed="'+(F.mod==='libre')+'">Pagos libres</button><button type="button" data-mod="cuotas" aria-pressed="'+(F.mod==='cuotas')+'">Pagos con fecha</button></div>'
   +'<p class="ve-ayuda" id="ve-cuotas-t"'+(F.mod==='cuotas'?'':' hidden')+'>2 pagos, uno cada quincena. Sin interés.</p></div></div>'
   +'<div class="ve-card dest" id="ve-res" aria-live="polite"></div><button type="button" class="ve-btn ancho" id="ve-guardar">Guardar pedido</button>';
  carrito()}
function carrito(){$('#ve-car').innerHTML=F.items.length?'<h3>En el pedido</h3>'+F.items.map(it=>'<div class="ve-item"><span class="cu"><span class="t">'+it.nom+'</span><span class="ve-s">'+P(it.precio)+' c/u</span></span><span class="ve-cant"><button type="button" class="ve-btn sec peq" data-menos="'+it.id+'" aria-label="Quitar uno">−</button><b aria-live="polite">'+it.cant+'</b><button type="button" class="ve-btn sec peq" data-mas="'+it.id+'" aria-label="Agregar uno">+</button></span></div>').join(''):'';resumen()}
function resumen(){const r=calcular(F),ant=F.forma==='credito'?Math.min(F.anticipo,r.total):0;
  const cs=F.forma==='credito'&&F.mod==='cuotas'&&r.total-ant>0?cuotas(r.total-ant,2,mas(HOY,15),15):[];
  $('#ve-res').innerHTML=!F.items.length?'<p style="margin:0">Agrega productos para ver el total y tu ganancia.</p>'
   :'<div class="ve-fila"><span>Total a cobrar</span><strong class="ve-grande ve-n">'+P(r.total)+'</strong></div><div class="ve-fila"><span>Tu costo</span><span class="ve-n">'+P(r.costo)+'</span></div><div class="ve-fila"><span>Tu ganancia estimada</span><strong class="ve-n" style="color:var(--pm)">'+P(r.ganancia)+'</strong></div>'
   +(F.forma==='credito'?'<div class="ve-fila"><span>Queda por cobrar</span><span class="ve-n">'+P(r.total-ant)+'</span></div>':'')+(cs.length?'<p class="ve-s" style="margin-bottom:0">Pagos: '+cs.map(q=>P(q.monto)+' el '+fCorta(q.fecha)).join(' · ')+'</p>':'')}
function guardarPedido(){if(!F.clienta){avisoDemo('Elige a la clienta');$('#ve-cl').focus();return}if(!F.items.length){avisoDemo('Agrega al menos un producto');return}
  const r=calcular(F),folio=19,c=cl(F.clienta),credito=F.forma==='credito',ant=credito?Math.min(F.anticipo,r.total):0,pagado=credito?ant:(F.pagado?r.total:0);
  const cs=credito&&F.mod==='cuotas'&&r.total-ant>0?cuotas(r.total-ant,2,mas(HOY,15),15):[];
  S.pedido={folio:folio,clienta:c.id,nom:c.nom,fecha:HOY,items:F.items.map(x=>Object.assign({},x)),total:r.total,costo:r.costo,ganancia:r.ganancia,forma:F.forma,pagado:pagado,ant:ant,cuotas:cs,envio:F.envio,regalos:F.regalos};
  c.saldo+=r.total-pagado;if(cs.length)c.sig={monto:cs[0].monto,fecha:cs[0].fecha};else if(credito)c.sig=null;
  if(pagado)registrarCobro(pagado);
  avisoDemo('Pedido #'+folio+' guardado. Ganancia estimada: '+P(r.ganancia));F=null;ver('pedido')}
// siguiente pago acordado del pedido (las cuotas empiezan después del anticipo)
function sigCuota(p){let acum=p.ant;for(const q of p.cuotas){acum+=q.monto;if(p.pagado<acum)return{monto:Math.min(q.monto,acum-p.pagado),fecha:q.fecha}}return null}
function registrarCobro(m){MES.cobrado+=m;MES.semana+=m}
function pintarPedido(){const p=S.pedido,el=$('[data-v=pedido]');if(!p){el.innerHTML='<div class="ve-card" style="text-align:center"><p>Aún no anotas un pedido en esta demo.</p><button type="button" class="ve-btn" data-ir="nuevo">Anotar una venta</button></div>';return}
  const falta=p.total-p.pagado;
  el.innerHTML='<div class="ve-fila"><h1>Pedido #'+p.folio+'</h1><span class="ve-chip aviso">Por entregar</span></div><p style="margin-top:0">'+p.nom+' · '+fLarga(p.fecha)+'</p>'
   +'<div class="ve-card"><table><thead><tr><th>Producto</th><th class="n">Cant.</th><th class="n">Importe</th></tr></thead><tbody>'+p.items.map(i=>'<tr><td>'+i.nom+'<br><span class="ve-s">Belleza Ejemplo</span></td><td class="n">'+i.cant+'</td><td class="n">'+P(i.cant*i.precio)+'</td></tr>').join('')+'<tr><th>Total</th><th></th><th class="n">'+P(p.total)+'</th></tr></tbody></table>'
   +'<div class="ve-g2" style="margin-top:10px"><div class="ve-kpi"><div class="l">Tu costo</div><div class="v">'+P(p.costo)+'</div></div><div class="ve-kpi gan"><div class="l">Ganancia</div><div class="v">'+P(p.ganancia)+'</div></div></div>'
   +(p.envio||p.regalos?'<p class="ve-s">El costo incluye '+[p.envio&&'envío '+P(p.envio),p.regalos&&'regalos '+P(p.regalos)].filter(Boolean).join(', ')+'.</p>':'')+'<p><span class="ve-chip">'+{efectivo:'Efectivo',transferencia:'Transferencia',credito:'Crédito'}[p.forma]+'</span></p></div>'
   +'<div class="ve-card'+(falta>0?' dest':'')+'"><div class="ve-fila"><span>'+(falta>0?'Falta por cobrar':'Pagado completo')+'</span><strong class="ve-grande ve-n">'+P(falta)+'</strong></div><div class="ve-s">Pagado: '+P(p.pagado)+' de '+P(p.total)+'</div>'
   +'<div class="ve-barra" role="img" aria-label="Cobrado '+Math.round(p.pagado/p.total*100)+' %"><i style="width:'+Math.round(p.pagado/p.total*100)+'%"></i></div>'
   +(p.cuotas.length?'<h3>Pagos acordados</h3><ul style="margin:0;padding-left:20px">'+p.cuotas.map(q=>'<li>'+P(q.monto)+' · '+fLarga(q.fecha)+'</li>').join('')+'</ul>':'')
   +(falta>0?'<div class="ve-acc"><button type="button" class="ve-btn" data-abono-pedido="1">Anotar pago</button><button type="button" class="ve-btn wa" data-wa="pedido">'+WA+'Recordar</button></div>':'<p class="ve-s">¡Listo! '+prim(p.nom)+' quedó al corriente con este pedido.</p>')+'</div>'
   +'<button type="button" class="ve-btn sec ancho" data-ir="ganancia">Ver mi ganancia del mes</button>'}
function pintarCobros(){const deben=CLIENTAS.filter(c=>c.saldo>0).sort((a,b)=>b.venc-a.venc),tot=deben.reduce((a,c)=>a+c.saldo,0),venc=deben.reduce((a,c)=>a+c.venc,0);
  $('[data-v=cobros]').innerHTML='<h1>Cobros</h1><div class="ve-g3"><div class="ve-kpi"><div class="l">Me deben en total</div><div class="v">'+P(tot)+'</div></div><div class="ve-kpi"><div class="l">Ya vencido</div><div class="v">'+P(venc)+'</div></div><div class="ve-kpi"><div class="l">Cobré este mes</div><div class="v">'+P(MES.cobrado)+'</div></div></div>'
   +'<h2>Quién me debe ('+deben.length+')</h2>'+(deben.length?deben.map(c=>'<div class="ve-card"><div class="ve-fila"><strong>'+c.nom+'</strong><strong class="ve-n" style="font-size:1.15rem">'+P(c.saldo)+'</strong></div><p style="margin:.4em 0 0">'+(c.venc?'<span class="ve-chip rojo">Pendiente '+P(c.venc)+' · '+c.dias+' días</span> ':'')+'<span class="ve-s">'+(c.sig?'Siguiente pago: '+P(c.sig.monto)+' '+fCorta(c.sig.fecha):'Pagos libres')+'</span></p>'
     +'<div class="ve-g2" style="margin-top:12px"><button type="button" class="ve-btn sec" data-abono="'+c.id+'" data-monto="'+(c.venc||(c.sig?c.sig.monto:0))+'">Ya me pagó</button><button type="button" class="ve-btn wa" data-wa="cobro-'+c.id+'">'+WA+'Recordarle</button></div></div>').join(''):'<p class="ve-s">Nadie te debe. ¡Así da gusto!</p>')+'<p class="ve-s">Tú decides a quién y cuándo recordarle. La app nunca le escribe ni le cobra a tus clientas por su cuenta.</p>'}
function pintarGanancia(){const p=S.pedido,vend=MES.vendido+(p?p.total:0),cos=MES.costo+(p?p.costo:0),gan=vend-cos,cob=MES.cobrado;
  const reponer=Math.round(cob*cos/vend),ganCob=cob-reponer,paraMi=Math.round(ganCob*.5),pct=paraMi?Math.min(100,Math.round(MES.retirado/paraMi*100)):0;
  const lista=(p?[{folio:p.folio,fecha:p.fecha,total:p.total,costo:p.costo,nuevo:1}]:[]).concat(PEDIDOS);
  $('[data-v=ganancia]').innerHTML='<h1>Ganancia</h1><p class="ve-s" style="margin-top:0">'+MESES[D(HOY).getMonth()].replace(/^./,m=>m.toUpperCase())+' '+D(HOY).getFullYear()+'</p>'
   +'<div class="ve-g2" style="margin-top:10px"><div class="ve-kpi"><div class="l">Vendido</div><div class="v">'+P(vend)+'</div><div class="l">'+(MES.pedidos+(p?1:0))+' pedidos</div></div><div class="ve-kpi"><div class="l">Cobrado</div><div class="v">'+P(cob)+'</div><div class="l">lo que sí recibiste</div></div>'
   +'<div class="ve-kpi"><div class="l">Costo</div><div class="v">'+P(cos)+'</div></div><div class="ve-kpi gan"><div class="l">Ganancia real</div><div class="v">'+P(gan)+'</div><div class="l">de cada $100 que vendes, te quedan $'+Math.round(gan/vend*100)+'</div></div></div>'
   +'<p class="ve-s">Ganancia = venta − costo de productos − descuentos − envíos que pagas − regalos − empaque. «Vendido» cuenta pedidos; «cobrado», abonos recibidos.</p>'
   +'<h2>Dinero del negocio y dinero para ti</h2><div class="ve-card"><p style="margin-top:0">De lo que cobraste este mes ('+P(cob)+'):</p><div class="ve-fila"><span>Para reponer producto</span><strong class="ve-n">'+P(reponer)+'</strong></div><div class="ve-fila"><span>Tu ganancia cobrada</span><strong class="ve-n">'+P(ganCob)+'</strong></div>'
   +'<div class="ve-fila"><span>Puedes pagarte (50% de la ganancia)</span><strong class="ve-n">'+P(paraMi)+'</strong></div><div class="ve-fila"><span>Ya te pagaste</span><span class="ve-n">'+P(MES.retirado)+'</span></div><div class="ve-barra" role="img" aria-label="Te has pagado '+pct+'% de lo sugerido"><i style="width:'+pct+'%"></i></div></div>'
   +'<h2>Por pedido</h2><div class="ve-card"><table><thead><tr><th>Pedido</th><th class="n">Venta</th><th class="n">Costo</th><th class="n">Ganancia</th></tr></thead><tbody>'+lista.map(x=>'<tr'+(x.nuevo?' class="nuevo"':'')+'><td>#'+x.folio+' <span class="ve-s">'+fCorta(x.fecha)+'</span></td><td class="n">'+P(x.total)+'</td><td class="n">'+P(x.costo)+'</td><td class="n">'+P(x.total-x.costo)+'</td></tr>').join('')+'</tbody></table></div>'}
// ---------- hojas ----------
let velo=null;
function hoja(tit,html){cerrar();velo=document.createElement('div');velo.className='ve-velo ve-app';velo.style.cssText='background:rgba(20,17,20,.38)';
  velo.innerHTML='<div class="ve-hoja" role="dialog" aria-modal="true" aria-label="'+esc(tit)+'"><div class="ve-hoja-top"><h2>'+esc(tit)+'</h2><button type="button" class="ve-x" data-cerrar aria-label="Cerrar">'+ic(I.x)+'</button></div>'+html+'</div>';
  dm.appendChild(velo);velo.addEventListener('click',e=>{if(e.target===velo||e.target.closest('[data-cerrar]'))cerrar()});setTimeout(()=>velo&&velo.querySelector('.ve-x').focus(),30);return velo.firstChild}
function cerrar(){if(velo){velo.remove();velo=null}}
document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrar()});
function hojaWA(texto,nombre,alEnviar){const h=hoja('Mensaje para '+prim(nombre),'<div class="ve-wa"><p class="ve-para">'+esc(nombre)+'</p><div class="ve-burbuja">'+esc(texto)+'<small>'+new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})+'</small></div></div>'
   +'<button type="button" class="ve-btn wa ancho" id="ve-enviar">'+WA+'Abrir WhatsApp</button><p class="ve-ayuda" style="text-align:center">Vende nunca le escribe por su cuenta: el mensaje sale de tu WhatsApp y tú decides si lo mandas.</p>','');
  h.querySelector('#ve-enviar').onclick=()=>{cerrar();avisoDemo('En tu teléfono se abre WhatsApp con este mensaje, listo para enviar.');alEnviar&&alEnviar()}}
function hojaAbono(c,sug,alTerminar){let medio='efectivo';
  const h=hoja('Anotar pago de '+c.nom,'<p style="margin-top:0">Saldo actual: <strong class="ve-n">'+P(c.saldo)+'</strong></p><label for="ve-ab">¿Cuánto te pagó?</label><input id="ve-ab" inputmode="decimal" value="'+(sug/100).toFixed(2).replace(/\\.00$/,'')+'">'
   +'<p style="font-weight:600;margin:14px 0 8px">¿Cómo te pagó?</p><div class="ve-seg" role="radiogroup" aria-label="¿Cómo te pagó?"><button type="button" role="radio" data-medio="efectivo" aria-pressed="true" aria-checked="true">Efectivo</button><button type="button" role="radio" data-medio="transferencia" aria-pressed="false" aria-checked="false">Transferencia</button></div>'
   +'<button type="button" class="ve-btn ancho" style="margin-top:16px" id="ve-ab-ok">Guardar pago</button><p class="ve-ayuda">Si paga de más, el excedente se aplica a su siguiente adeudo.</p>');
  h.addEventListener('click',e=>{const b=e.target.closest('[data-medio]');if(b){medio=b.dataset.medio;h.querySelectorAll('[data-medio]').forEach(x=>{x.setAttribute('aria-pressed',x===b);x.setAttribute('aria-checked',x===b)})}});
  h.querySelector('#ve-ab-ok').onclick=()=>{const m=Math.min(centavos(h.querySelector('#ve-ab').value),c.saldo);if(!(m>0)){avisoDemo('Escribe el monto');return}
    c.saldo-=m;c.venc=Math.max(0,c.venc-m);if(!c.venc)c.dias=0;registrarCobro(m);cerrar();
    avisoDemo(c.saldo===0?'¡Listo! '+prim(c.nom)+' quedó al corriente.':'Abono registrado. Le quedan '+P(c.saldo)+'.');alTerminar&&alTerminar(m)}}
// ---------- eventos ----------
dm.addEventListener('input',e=>{if(!F)return;const t=e.target;
  if(t.id==='ve-cl')F.clienta=t.value;else if(t.id==='ve-ant')F.anticipo=centavos(t.value);else if(t.id==='ve-env')F.envio=centavos(t.value);else if(t.id==='ve-reg')F.regalos=centavos(t.value);else if(t.id==='ve-pagado')F.pagado=t.checked;else return;resumen()});
dm.addEventListener('change',e=>{if(F&&e.target.id==='ve-cl')F.clienta=e.target.value;if(F&&e.target.id==='ve-pagado')F.pagado=e.target.checked});
dm.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.closest('.ve-hoja'))return;const d=b.dataset;
  if(d.ir)ver(d.ir);
  else if(d.agregar){const p=PRODS.find(x=>x.id===d.agregar),it=F.items.find(x=>x.id===p.id);if(it)it.cant++;else F.items.push({id:p.id,nom:p.nom,precio:p.precio,costo:p.costo,cant:1});carrito();avisoDemo(p.nom+' agregado')}
  else if(d.mas){F.items.find(x=>x.id===d.mas).cant++;carrito()}
  else if(d.menos){const it=F.items.find(x=>x.id===d.menos);if(--it.cant<=0)F.items.splice(F.items.indexOf(it),1);carrito()}
  else if(d.forma){F.forma=d.forma;$$('[data-forma]').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#ve-credito').hidden=F.forma!=='credito';$('#ve-contado').hidden=F.forma==='credito';resumen()}
  else if(d.mod){F.mod=d.mod;$$('[data-mod]').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#ve-cuotas-t').hidden=F.mod!=='cuotas';resumen()}
  else if(b.id==='ve-guardar')guardarPedido();
  else if(d.marcar||d.omitir){S.acc[d.marcar||d.omitir]=d.marcar?'hecha':'omitida';pintarHoy()}
  else if(d.deshacer){S.acc[d.deshacer]='pendiente';pintarHoy()}
  else if(d.abono)hojaAbono(cl(d.abono),d.monto?+d.monto:cl(d.abono).venc||cl(d.abono).saldo,()=>{if(d.abono==='a'&&S.vista==='hoy')S.acc.cobro='hecha';ver(S.vista)});
  else if(d.abonoPedido){const p=S.pedido,c=cl(p.clienta),q=sigCuota(p);
    hojaAbono(c,q?q.monto:p.total-p.pagado,m=>{p.pagado+=Math.min(m,p.total-p.pagado);const n=sigCuota(p);if(p.cuotas.length)c.sig=n;pintarPedido()})}
  else if(d.wa){const k=d.wa;
    if(k==='cobro')hojaWA(MSJ.cobro(cl('a'),cl('a').venc,mas(HOY,-cl('a').dias)),cl('a').nom,()=>{S.acc.cobro='hecha';pintarHoy()});
    else if(k==='recompra')hojaWA(MSJ.recompra(cl('y'),'Crema hidratante 50 ml'),cl('y').nom,()=>{S.acc.recompra='hecha';pintarHoy()});
    else if(k==='pedido')hojaWA(MSJ.pedido(S.pedido),S.pedido.nom);
    else{const c=cl(k.slice(6));hojaWA(MSJ.cobro(c,c.venc||(c.sig?c.sig.monto:c.saldo),null),c.nom)}}});
ver('hoy');
})();`,
};
