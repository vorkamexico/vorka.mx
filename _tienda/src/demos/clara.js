// Demo de Clara: anotas un gasto en segundos (monto con el teclado, efectivo, débito o tarjeta, y categoría) y ves cómo cambia
// «Te alcanzan … al día» o, si fue con crédito, lo que debes en la tarjeta, lo disponible y cuándo lo pagas (corte y fecha
// para pagar sin intereses). Mismas reglas que la app: ¿Me alcanza? = efectivo + débito − pagos de tarjeta que vencen antes
// del próximo ingreso, entre los días que faltan; el crédito no baja tu dinero, sube el saldo de la tarjeta. Datos de ejemplo.
export default {
  titulo: 'Anota un gasto y mira cuánto te queda.',
  texto: 'Escribe un gasto como en la app: en efectivo baja lo que te alcanza al día; con tarjeta, sube lo que debes y ves hasta cuándo pagar sin intereses.',
  prueba: ['Anotar un gasto en dos toques: monto y Guardar', 'Pagar con la tarjeta y ver lo disponible y la fecha de pago', 'Revisar el resumen del mes en palabras simples'],
  cta: 'Quiero Clara · gratis con 1 tarjeta',
  css: `
#dm{background:#fff}
.cl-app{--cl-bg2:#f3f4f6;--cl-bg3:#e3e6ea;--cl-fg:#16181d;--cl-fg2:#4f5560;--cl-fg3:#626874;--cl-line:#e6e8ec;--cl-acc:var(--pm);--cl-acc-s:#e8effd;--cl-acc-t:#1a50b8;
  --cl-in:#146c34;--cl-in-s:#e6f4ea;--cl-out:#b3261e;--cl-out-s:#fce8e6;--cl-warn:#7a5200;--cl-warn-s:#fef3d6;--cl-warn-f:#b07800;
  background:#fff;color:var(--cl-fg);font:16px/1.5 Figtree,Inter,-apple-system,"Segoe UI",Roboto,sans-serif;position:relative}
:where(.cl-app) button{background:none;border:0;padding:0;cursor:pointer;color:inherit;font:inherit}
.cl-app p{margin:0}.cl-app .num{font-variant-numeric:tabular-nums}
.cl-neg{display:inline-block;transform:scaleX(1.45);margin:0 .14em 0 .06em;font-weight:700}
.cl-top{display:flex;align-items:center;gap:8px;padding:14px 16px 6px;font-weight:700;font-size:18px;letter-spacing:-.02em}
.cl-top svg{width:22px;height:22px}.cl-top small{font-weight:500;font-size:12px;color:var(--cl-fg3);letter-spacing:0}
.cl-main{padding:0 16px 16px}
.cl-v[hidden]{display:none}
.cl-saludo{font-size:14px;font-weight:600;margin:8px 4px 14px}.cl-saludo span{font-weight:400;color:var(--cl-fg2)}
.cl-pila{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
.cl-card{background:#fff;border:1px solid var(--cl-line);border-radius:24px;padding:16px;box-shadow:0 1px 2px rgba(22,24,29,.04)}
.cl-fila{display:flex;align-items:center;gap:12px;min-width:0}.cl-crece{flex:1;min-width:0}
.cl-etq{font-size:12px;font-weight:600;color:var(--cl-fg2);letter-spacing:.02em}
.cl-mini{font-size:14px;color:var(--cl-fg2)}
.cl-ayuda{font-size:12px;color:var(--cl-fg3);line-height:1.5}
.cl-alc{padding:22px 20px 14px}
.cl-alc .cl-etq{font-size:14px;letter-spacing:0}
.cl-grande{font-size:40px;font-weight:700;letter-spacing:-.03em;line-height:1.1;margin:4px 0}
.cl-grande small{font-size:16px;font-weight:600;color:var(--cl-fg2);letter-spacing:0;margin-left:6px}
.cl-alc.neg .cl-grande{color:var(--cl-out)}
.cl-enlace{color:var(--cl-acc-t);font-weight:600;font-size:14px;min-height:40px;display:inline-flex;align-items:center}
.cl-tudin{display:flex;align-items:center;gap:12px;width:100%;margin-top:8px;padding:12px 0 2px;border-top:1px solid var(--cl-line);text-align:left}
.cl-tudin .cl-crece{display:grid}.cl-tudin b{font-size:20px;font-weight:700}
.cl-ico{width:40px;height:40px;flex:none;border-radius:12px;display:grid;place-items:center;background:var(--cl-bg2);color:var(--cl-fg2)}
.cl-ico svg{width:20px;height:20px}
.cl-ico.ok{background:var(--cl-in-s);color:var(--cl-in)}.cl-ico.in{background:var(--cl-in-s);color:var(--cl-in)}
.c-comida{background:#fbeae8;color:#c0483e}.c-transporte{background:#e7f0f5;color:#3a6f8f}.c-escuela{background:#efebfa;color:#6a4fc0}.c-casa{background:#e4f2ef;color:#2f7d6f}
.c-celular{background:#eaecf8;color:#4a55b5}.c-gustos{background:#f9e8ef;color:#b0436f}.c-ropa{background:#f3ece7;color:#7d5d4b}.c-otros{background:#f1f3f4;color:#5f6368}
.cl-der{display:grid;justify-items:end;gap:4px}.cl-der b{font-size:16px}
.cl-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;background:var(--cl-bg2);color:var(--cl-fg2);white-space:nowrap}
.cl-chip.aviso{background:var(--cl-warn-s);color:var(--cl-warn)}.cl-chip.bueno{background:var(--cl-in-s);color:var(--cl-in)}
.cl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 18px;border-radius:999px;font-weight:700;background:var(--cl-bg2);color:var(--cl-fg)}
.cl-btn.prim{background:var(--cl-acc);color:#fff}.cl-btn.bloque{width:100%}.cl-btn svg{width:20px;height:20px}
.cl-btn:disabled{opacity:.45;cursor:default}
.cl-dos{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cl-sec{display:flex;align-items:baseline;justify-content:space-between;margin:10px 4px -4px}.cl-sec h2{margin:0;font-size:16px;font-weight:700}
.cl-lista{padding:0 16px}
.cl-it{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--cl-line);min-height:64px}.cl-it:last-child{border-bottom:0}
.cl-it .t{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cl-it .cl-mini{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cl-monto{font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}.cl-monto.menos{color:var(--cl-out)}.cl-monto.mas{color:var(--cl-in)}
.cl-it.nuevo{animation:cl-luz 1.6s ease-out}@keyframes cl-luz{from{background:var(--cl-acc-s)}}
.cl-nota{background:var(--cl-acc-s);border:0;box-shadow:none}
.cl-nota b{color:var(--cl-fg)}
.cl-legal{font-size:12px;color:var(--cl-fg3);text-align:center;margin:20px 8px 0!important;line-height:1.5}
/* tarjeta */
.cl-h1{display:flex;align-items:center;gap:8px;margin:6px 4px 12px}.cl-h1 h1{margin:0;font-size:22px;font-weight:700;letter-spacing:-.015em}
.cl-barra{height:8px;border-radius:999px;background:var(--cl-bg2);overflow:hidden;margin:8px 0}.cl-barra i{display:block;height:100%;background:var(--cl-fg2);border-radius:999px;transition:width .5s}
.cl-barra.alta i{background:var(--cl-warn-f)}.cl-barra.llena i{background:var(--cl-out)}
.cl-fechas{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cl-fechas>div{background:var(--cl-bg2);border-radius:16px;padding:12px;min-width:0}.cl-fechas b{display:block;font-size:14px}.cl-fechas .cl-mini{display:block;font-size:13px}
.cl-fechas>div.cerca{background:var(--cl-warn-s)}.cl-fechas>div.cerca b{color:var(--cl-warn)}
.cl-t3{font-size:20px;font-weight:700;letter-spacing:-.01em}
.cl-compara{display:grid;gap:8px}
.cl-compara .r{display:flex;justify-content:space-between;gap:8px;padding:12px;border-radius:12px;background:var(--cl-bg2);font-size:14px}
.cl-compara .r b{white-space:nowrap}
.cl-compara .r.total{font-weight:700;background:transparent;border:1px solid var(--cl-line)}
.cl-compara .r.dif{background:var(--cl-warn-s);color:var(--cl-warn);font-weight:700}
/* mes */
.cl-mezcla{display:flex;gap:2px;height:12px;border-radius:999px;overflow:hidden;margin:6px 0 8px}.cl-mezcla i{display:block;min-width:6px}
.cl-ley{display:flex;align-items:center;gap:8px;min-height:32px;font-size:14px}.cl-ley .p{width:10px;height:10px;border-radius:999px;flex:none}.cl-ley b{min-width:72px;text-align:right;font-variant-numeric:tabular-nums}
.cl-frases{display:grid;gap:6px;font-size:15px}
/* pie: Gasto / Ingreso y pestañas, fijos abajo como en la app */
.cl-pie{position:sticky;bottom:0;z-index:5;margin-top:8px}
.cl-acciones{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px 16px 8px;background:linear-gradient(to top,#fff 60%,rgba(255,255,255,0))}
.cl-accion{display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;border-radius:999px;font-weight:700;font-size:16px;border:1px solid transparent}
.cl-accion svg{width:22px;height:22px}
.cl-accion.gasto{background:var(--cl-bg2);border-color:var(--cl-bg3)}.cl-accion.gasto svg{color:var(--cl-out)}
.cl-accion.ingreso{background:var(--cl-in-s);color:var(--cl-in);border-color:color-mix(in srgb,var(--cl-in) 22%,transparent)}
.cl-nav{display:grid;grid-template-columns:repeat(3,1fr);height:62px;background:#fff;border-top:1px solid var(--cl-line)}
.cl-nav button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:12px;font-weight:600;color:var(--cl-fg2);isolation:isolate}
.cl-nav button svg{width:22px;height:22px}
.cl-nav button::before{content:"";position:absolute;top:6px;width:56px;height:30px;border-radius:999px;z-index:-1}
.cl-nav button[aria-current=page]{color:var(--cl-fg)}.cl-nav button[aria-current=page]::before{background:var(--cl-acc-s)}.cl-nav button[aria-current=page] svg{color:var(--cl-acc-t)}
.cl-nav i{position:absolute;top:4px;right:calc(50% - 22px);width:9px;height:9px;border-radius:50%;background:var(--cl-out);display:none}.cl-nav i.si{display:block}
/* hoja de anotar */
.cl-velo{position:fixed;inset:0;z-index:40;background:rgba(22,24,29,.4);display:flex;align-items:flex-end;justify-content:center;animation:cl-ap .15s ease-out}
.cl-hoja{width:100%;max-width:480px;max-height:94vh;overflow-y:auto;background:#fff;border-radius:24px 24px 0 0;padding:8px 16px 16px;animation:cl-sube .2s ease-out;box-shadow:0 12px 32px rgba(22,24,29,.14);overscroll-behavior:contain}
.cl-asa{width:40px;height:4px;border-radius:9px;background:var(--cl-bg3);margin:0 auto 8px}
@keyframes cl-ap{from{opacity:0}}@keyframes cl-sube{from{transform:translateY(30px);opacity:.6}}
@media (prefers-reduced-motion:reduce){.cl-velo,.cl-hoja,.cl-it.nuevo{animation:none}}
.cl-seg{display:flex;padding:4px;border-radius:999px;background:var(--cl-bg2);gap:2px}
.cl-seg button{flex:1;min-height:40px;border-radius:999px;font-size:14px;font-weight:600;color:var(--cl-fg2)}
.cl-seg button[aria-pressed=true]{background:#fff;color:var(--cl-fg);box-shadow:0 1px 3px rgba(22,24,29,.12)}
.cl-x{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;color:var(--cl-fg2)}.cl-x svg{width:22px;height:22px}
.cl-pm{text-align:center;font-size:46px;font-weight:700;letter-spacing:-.03em;margin:6px 0 2px;line-height:1.1;color:var(--cl-fg3)}
.cl-hoja[data-tipo=gasto] .cl-pm.si{color:var(--cl-out)}.cl-hoja[data-tipo=ingreso] .cl-pm.si{color:var(--cl-in)}
.cl-metodo{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;justify-content:safe center;margin-top:6px}
.cl-metodo button{flex:none;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px 0 12px;border-radius:999px;border:1px solid var(--cl-bg3);font-size:14px;font-weight:600;color:var(--cl-fg2)}
.cl-metodo button svg{width:18px;height:18px}
.cl-metodo button[aria-pressed=true]{background:var(--cl-acc-s);border-color:var(--cl-acc);color:var(--cl-acc-t)}
.cl-tec{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0 8px}
.cl-tec button{min-height:46px;border-radius:16px;background:var(--cl-bg2);font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}
.cl-tec button:active{background:var(--cl-bg3)}.cl-tec button svg{width:22px;height:22px;margin:auto}
.cl-cats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px}
.cl-cats button{display:grid;justify-items:center;align-content:start;gap:4px;padding:8px 2px;border-radius:16px;background:var(--cl-bg2);font-size:12px;font-weight:600;line-height:1.25;min-height:66px}
.cl-cats .cl-ico{background:#fff;width:30px;height:30px;border-radius:10px}.cl-cats .cl-ico svg{width:18px;height:18px}
.cl-cats button[aria-checked=true]{background:var(--cl-acc-s);box-shadow:inset 0 0 0 2px var(--cl-acc)}.cl-cats button[aria-checked=true] .cl-ico{color:var(--cl-acc-t)}
.cl-guardar{margin-top:12px;min-height:54px;font-size:16px}
.cl-aviso-c{margin-top:10px;padding:10px 12px;border-radius:12px;background:var(--cl-warn-s);color:var(--cl-warn);font-size:13px;font-weight:600}
/* aviso con Deshacer */
.cl-toast{position:fixed;left:50%;bottom:150px;transform:translate(-50%,16px);z-index:30;width:max-content;max-width:calc(100% - 32px);background:#16181d;color:#fff;padding:10px 12px 10px 16px;border-radius:16px;font-size:14px;font-weight:600;display:flex;gap:14px;align-items:center;opacity:0;pointer-events:none;transition:all .2s;box-shadow:0 12px 32px rgba(22,24,29,.24)}
.cl-toast.ver{opacity:1;transform:translate(-50%,0);pointer-events:auto}
.cl-toast button{color:#8db2f7;font-weight:700;min-height:36px;padding:0 4px}
`,
  html: `
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&amp;display=swap">
<div class="cl-app">
  <div class="cl-top"><svg viewBox="69 225 940 909" aria-hidden="true"><path fill="#16181d" d="M69 226H311L652 877L526 1133Z"/><path style="fill:var(--pm)" d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg>Clara <small>by Vorka</small></div>
  <div class="cl-main">
    <section class="cl-v" data-v="hoy"></section>
    <section class="cl-v" data-v="tarjeta" hidden></section>
    <section class="cl-v" data-v="mes" hidden></section>
  </div>
  <div class="cl-pie">
    <div class="cl-acciones"><button type="button" class="cl-accion gasto" data-anotar="gasto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>Gasto</button><button type="button" class="cl-accion ingreso" data-anotar="ingreso"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Ingreso</button></div>
    <nav class="cl-nav" aria-label="Secciones"></nav>
  </div>
  <div class="cl-toast" role="status" aria-live="polite"><span></span><button type="button" id="cl-deshacer">Deshacer</button></div>
</div>`,
  js: `
(()=>{
const dm=document.getElementById('dm'),$=s=>dm.querySelector(s),$$=s=>[...dm.querySelectorAll(s)];
const pesos=c=>'$'+(Math.abs(c)/100).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
const pc=c=>'$'+(Math.abs(c)/100).toLocaleString('es-MX',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2});
const P=c=>(c<0?'<span class="cl-neg">−</span>':'')+pesos(c),PC=c=>(c<0?'<span class="cl-neg">−</span>':'')+pc(c);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const D=s=>{const a=s.split('-').map(Number);return new Date(a[0],a[1]-1,a[2])};
const mas=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const sumarMes=(s,n,dia)=>{const d=D(s),x=new Date(d.getFullYear(),d.getMonth()+n,1),u=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();x.setDate(Math.min(dia||d.getDate(),u));return iso(x)};
const dias=(a,b)=>Math.round((D(b)-D(a))/864e5);
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmt=(s,o)=>D(s).toLocaleDateString('es-MX',o).replace(/\\./g,'');
const fLarga=s=>fmt(s,{weekday:'long'})+' '+D(s).getDate()+' de '+fmt(s,{month:'long'});
const fFrase=s=>'el '+fLarga(s);
const fCorta=s=>fmt(s,{weekday:'short'})+' '+D(s).getDate()+' '+fmt(s,{month:'short'});
const fTexto=s=>D(s).toLocaleDateString('es-MX',{day:'numeric',month:'long'});
const HOY=iso(new Date());
const ic=(p,s)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const I={hoy:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',tarjeta:'<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',mes:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 efectivo:'<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',debito:'<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M15 15h3"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',borrar:'<path d="M9 6h11v12H9l-6-6z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',calendario:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4"/>',ingreso:'<path d="M12 20V6M6 12l6-6 6 6"/>',pago:'<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M8 12l2.5 2.5L16 9"/>',atras:'<path d="M15 5l-7 7 7 7"/>',
 comida:'<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1.5-2.5 4-2.5 7H17V3zM17 10v11"/>',transporte:'<rect x="4" y="4" width="16" height="12" rx="3"/><path d="M4 11h16M7.5 19l1-3M16.5 19l-1-3"/><circle cx="8" cy="13.5" r=".8" fill="currentColor"/><circle cx="16" cy="13.5" r=".8" fill="currentColor"/>',
 escuela:'<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.6 3.4 2.5 5.5 2.5s4-.9 5.5-2.5V11"/>',casa:'<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',celular:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
 gustos:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',ropa:'<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-.5 1.7-2 3-4 3S8.5 4.7 8 3z"/>',otros:'<circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/>'};
const CATS=[['comida','Comida','#c0483e'],['transporte','Transporte','#3a6f8f'],['escuela','Escuela o trabajo','#6a4fc0'],['casa','Casa y servicios','#2f7d6f'],['celular','Celular e internet','#4a55b5'],['gustos','Salidas y gustos','#b0436f'],['ropa','Ropa y cuidado personal','#7d5d4b'],['otros','Otros','#5f6368']];
const catDe=k=>CATS.find(c=>c[0]===k);
// ---------- datos de ejemplo ----------
const corte=mas(HOY,-8),cDia=D(corte).getDate(),DESPUES=20;      // la tarjeta cortó hace 8 días; se paga 20 días después del corte
const T={alias:'La azul',u4:'4821',lim:1200000,saldo:419900,sinInt:385000,min:32000,tasa:60,corte:corte,pago:mas(corte,DESPUES),prox:sumarMes(corte,1,cDia),periodo:34900,pagada:false};
const ultDia=new Date(D(HOY).getFullYear(),D(HOY).getMonth()+1,0).getDate(),dHoy=D(HOY).getDate();
const ING=dHoy<15?sumarMes(HOY,0,15):dHoy<ultDia?sumarMes(HOY,0,31):sumarMes(HOY,1,15);   // te llega dinero cada quincena
const S={ef:185000,db:240000,ult:{metodo:'efectivo',cat:'comida'},vista:'hoy'};
const movs=[{id:3,tipo:'gasto',cat:'comida',nota:'Tacos',monto:15000,metodo:'efectivo',fecha:mas(HOY,-1)},{id:2,tipo:'gasto',cat:'casa',nota:'Luz',monto:42000,metodo:'efectivo',fecha:mas(HOY,-2)},{id:1,tipo:'gasto',cat:'celular',nota:'Recarga',monto:10000,metodo:'debito',fecha:mas(HOY,-4)}];
const MES={ingresos:450000,gastos:{comida:124000,transporte:38000,casa:42000,celular:10000,gustos:56000},tarjeta:34900};
let sigId=10;
// ---------- cálculos (como calculos.js de la app) ----------
const pendiente=()=>T.pagada?0:T.sinInt;
function alcanza(){const bolsillo=S.ef+S.db,pagos=!T.pagada&&T.pago<=ING?[{alias:T.alias,monto:pendiente()}]:[];
  const libre=bolsillo-pagos.reduce((a,p)=>a+p.monto,0),d=Math.max(1,dias(HOY,ING));return{bolsillo:bolsillo,pagos:pagos,libre:libre,dias:d,porDia:Math.floor(libre/d/100)*100}}
const uso=()=>Math.round(T.saldo/T.lim*100);
// ---------- pintar ----------
const filaMov=m=>{const c=catDe(m.cat),tit=m.tipo==='gasto'?c[1]:m.tipo==='ingreso'?'Ingreso':'Pago a '+T.alias,como=m.metodo==='tarjeta'?T.alias:m.metodo==='debito'?'Débito':'Efectivo';
  const cuando=m.fecha===HOY?'Hoy':dias(m.fecha,HOY)===1?'Ayer':cap(fCorta(m.fecha));
  return'<div class="cl-it'+(m.nuevo?' nuevo':'')+'"><span class="cl-ico '+(m.tipo==='gasto'?'c-'+m.cat:m.tipo==='ingreso'?'in':'ok')+'">'+ic(I[m.tipo==='gasto'?m.cat:m.tipo==='ingreso'?'ingreso':'pago'])+'</span><span class="cl-crece"><span class="t">'+(m.nota||tit)+'</span><span class="cl-mini">'+[m.nota?tit:'',m.tipo==='pago'?'':como,cuando].filter(Boolean).join(' · ')+'</span></span><span class="cl-monto '+(m.tipo==='ingreso'?'mas':m.tipo==='gasto'?'menos':'')+'">'+(m.tipo==='ingreso'?'+':'<span class="cl-neg">−</span>')+pesos(m.monto)+'</span></div>'};
function pintarHoy(){const a=alcanza(),falta=a.libre<0,dP=dias(HOY,T.pago),cerca=!T.pagada&&dP<=5;
  const hero='<section class="cl-card cl-alc'+(falta?' neg':'')+'" aria-label="¿Me alcanza?"><p class="cl-etq">'+(falta?'Te faltan':'Te alcanzan')+'</p>'
    +'<p class="cl-grande num">'+(falta?pc(-a.libre):pc(a.porDia)+'<small>al día</small>')+'</p><p class="cl-mini">'+(falta?'para cubrir tus pagos antes '+fFrase(ING).replace(/^el /,'del '):'hasta '+fFrase(ING)+' · '+(a.dias===1?'1 día':a.dias+' días'))+'</p>'
    +'<button type="button" class="cl-enlace" id="cl-calc">Ver cómo se calcula</button>'
    +'<div class="cl-tudin"><span class="cl-crece"><span class="cl-etq" style="font-size:14px;color:var(--cl-fg)">Tu dinero</span><span class="cl-mini">Efectivo '+PC(S.ef)+' · Débito '+PC(S.db)+'</span></span><b class="num">'+PC(S.ef+S.db)+'</b></div></section>';
  const sigue=T.pagada?'<button type="button" class="cl-card cl-fila" data-ver="tarjeta" style="text-align:left;width:100%"><span class="cl-ico ok">'+ic(I.check)+'</span><span class="cl-crece"><b>'+T.alias+': pagada</b><p class="cl-mini" style="margin-top:2px">Tu siguiente fecha para pagar es '+fFrase(mas(T.prox,DESPUES))+'.</p></span></button>'
    :'<section class="cl-card" aria-label="Próximo pago" style="display:grid;gap:12px"><div class="cl-fila"><span class="cl-ico">'+ic(I.calendario)+'</span><div class="cl-crece"><p class="cl-etq">Próximo pago · '+T.alias+'</p><p><b>'+cap(fCorta(T.pago))+'</b></p></div><div class="cl-der"><b class="num">'+P(pendiente())+'</b>'+(cerca?'<span class="cl-chip aviso">'+(dP<=0?'Hoy':dP===1?'Mañana':'En '+dP+' días')+'</span>':'')+'</div></div>'
     +'<div class="cl-dos"><button type="button" class="cl-btn prim" id="cl-ya">'+ic(I.check)+'Ya pagué</button><button type="button" class="cl-btn" data-ver="tarjeta">Ver detalle</button></div></section>';
  const ultimo=movs[0],credito=ultimo&&ultimo.nuevo&&ultimo.metodo==='tarjeta';
  const nota=credito?'<div class="cl-card cl-nota cl-fila" style="align-items:flex-start"><span class="cl-ico" style="background:#fff;color:var(--cl-acc-t)">'+ic(I.tarjeta)+'</span><div class="cl-crece"><p style="font-size:15px">Con <b>'+T.alias+'</b> no baja tu dinero de hoy: ahora debes <b>'+pesos(T.saldo)+'</b> y te quedan <b>'+pesos(T.lim-T.saldo)+'</b> disponibles.</p><p class="cl-mini" style="margin-top:4px">Esta compra entra en tu corte '+fFrase(T.prox).replace(/^el /,'del ')+' y la pagas sin intereses a más tardar '+fFrase(mas(T.prox,DESPUES))+'.</p><button type="button" class="cl-enlace" data-ver="tarjeta">Ver tarjeta</button></div></div>':'';
  $('[data-v=hoy]').innerHTML='<p class="cl-saludo">Hola, Ana <span>· '+cap(fLarga(HOY))+'</span></p>'
    +'<div class="cl-pila">'+hero+nota+sigue+'<div class="cl-sec"><h2>Lo último</h2><button type="button" class="cl-enlace" data-ver="mes" style="min-height:32px">Ver el mes</button></div><div class="cl-card cl-lista">'+movs.slice(0,4).map(filaMov).join('')+'</div></div>'
    +'<p class="cl-legal">Clara te ayuda a organizarte y a aprender. No es asesoría financiera.</p>'}
function pintarTarjeta(){const u=uso(),dP=dias(HOY,T.pago),cerca=!T.pagada&&dP<=5,costo=Math.round((T.sinInt-T.min)*T.tasa/100/360*30*1.16);
  const pago=T.pagada?'<section class="cl-card" style="display:grid;gap:10px"><div class="cl-fila"><span class="cl-ico ok">'+ic(I.check)+'</span><div class="cl-crece"><p class="cl-t3">Pagada</p><p class="cl-mini">Ya pagaste lo del corte del '+fTexto(T.corte)+'. Ya no te recordamos ese pago.</p></div></div></section>'
    :'<section class="cl-card" style="display:grid;gap:12px'+(cerca?';border-color:var(--cl-warn-f)':'')+'"><div class="cl-fila"><div class="cl-crece"><p class="cl-etq">Fecha para pagar sin intereses</p><p class="cl-t3">'+cap(fFrase(T.pago).replace(/^el /,''))+'</p></div><div class="cl-der"><b class="num" style="font-size:19px">'+P(T.sinInt)+'</b><span class="cl-mini" style="font-size:12px">para no generar intereses</span></div></div><button type="button" class="cl-btn prim bloque" id="cl-ya">'+ic(I.check)+'Ya pagué</button></section>';
  $('[data-v=tarjeta]').innerHTML='<div class="cl-h1"><button type="button" class="cl-x" data-ver="hoy" aria-label="Volver">'+ic(I.atras)+'</button><h1>'+T.alias+'</h1><span class="cl-chip" style="margin-left:auto">•••• '+T.u4+'</span></div>'
    +'<div class="cl-pila">'+pago+'<div class="cl-card"><p class="cl-etq">Debes hoy</p><p class="cl-grande num" style="font-size:36px">'+P(T.saldo)+'</p><p class="cl-mini" style="margin-top:6px">Disponible: '+P(T.lim-T.saldo)+' de '+PC(T.lim)+' · usas el '+u+' %</p>'
    +'<div class="cl-barra'+(u>90?' llena':u>30?' alta':'')+'" role="img" aria-label="Usas el '+u+' % de tu límite"><i style="width:'+Math.min(100,u)+'%"></i></div>'+(u>30?'<p class="cl-ayuda" style="color:var(--cl-warn)">Consejo de Clara: arriba del 30 % de tu límite conviene frenar con esta tarjeta.</p>':'<p class="cl-ayuda">Se mueve con lo que anotas. Si no coincide con tu banco, corrígelo en Editar.</p>')+'</div>'
    +'<div class="cl-fechas"><div><span class="cl-mini">Próximo corte</span><b>'+cap(fFrase(T.prox).replace(/^el /,''))+'</b><span class="cl-mini">Corta el día '+cDia+'</span></div><div><span class="cl-mini">Llevas en este periodo</span><b class="num">'+P(T.periodo)+'</b><span class="cl-mini">Lo que anotaste con ella</span></div></div>'
    +'<section class="cl-card" style="display:grid;gap:10px"><h2 style="margin:0;font-size:17px">Pago sin intereses vs. pago mínimo</h2><p class="cl-mini">De tu estado de cuenta del corte del '+fTexto(T.corte)+'.</p><div class="cl-compara"><div class="r"><span>Pago para no generar intereses</span><b class="num">'+P(T.sinInt)+'</b></div><div class="r"><span>Pago mínimo</span><b class="num">'+P(T.min)+'</b></div><div class="r dif"><span>Si solo pagas el mínimo, pagarías cerca de</span><b class="num">'+P(costo)+'</b></div></div>'
    +'<p class="cl-mini">de intereses en un mes (<b>estimado</b>: '+PC(T.sinInt-T.min)+' que quedarían × tasa de '+T.tasa+' % anual ÷ 360 × 30 días, más 16 % de IVA).</p></section></div>'
    +'<p class="cl-legal">Nunca escribas aquí el número completo de tu tarjeta, su código de seguridad ni las claves de tu banco. Clara no los necesita.</p>'}
function pintarMes(){const g=Object.assign({},MES.gastos);let ing=MES.ingresos,tar=MES.tarjeta;
  movs.filter(m=>m.nuevo).forEach(m=>{if(m.tipo==='gasto'){g[m.cat]=(g[m.cat]||0)+m.monto;if(m.metodo==='tarjeta')tar+=m.monto}else if(m.tipo==='ingreso')ing+=m.monto});
  const tot=Object.values(g).reduce((a,b)=>a+b,0),cs=Object.entries(g).sort((a,b)=>b[1]-a[1]),top=cs[0];
  const nom=cap(D(HOY).toLocaleDateString('es-MX',{month:'long'}));
  $('[data-v=mes]').innerHTML='<div class="cl-h1"><h1>'+nom+'</h1></div><div class="cl-pila">'
    +'<div class="cl-dos"><div class="cl-card"><p class="cl-etq">Entró</p><p class="cl-t3 num" style="color:var(--cl-in)">+'+pc(ing)+'</p></div><div class="cl-card"><p class="cl-etq">Salió</p><p class="cl-t3 num" style="color:var(--cl-out)"><span class="cl-neg">−</span>'+pc(tot)+'</p></div></div>'
    +'<section class="cl-card"><p class="cl-etq">En qué se fue</p><div class="cl-mezcla" role="img" aria-label="Gastos por categoría">'+cs.map(x=>'<i style="flex:'+x[1]+';background:'+catDe(x[0])[2]+'"></i>').join('')+'</div>'
    +cs.map(x=>'<div class="cl-ley"><span class="p" style="background:'+catDe(x[0])[2]+'"></span><span class="cl-crece">'+catDe(x[0])[1]+'</span><b>'+pc(x[1])+'</b></div>').join('')+'</section>'
    +'<section class="cl-card cl-frases"><p class="cl-etq">Tu mes en palabras</p><p>Te entraron '+pc(ing)+' y gastaste '+pc(tot)+'.</p><p>Donde más se fue: '+catDe(top[0])[1].toLowerCase()+' ('+pc(top[1])+', '+Math.round(top[1]/tot*100)+' % de tus gastos).</p>'+(tar?'<p>'+pc(tar)+' los pagaste con tarjeta de crédito: eso lo pagas después.</p>':'')+'</section></div>'}
function pintarNav(){$('.cl-nav').innerHTML=[['hoy','Hoy'],['tarjeta','Tarjetas'],['mes','Mes']].map(x=>'<button type="button" data-ver="'+x[0]+'"'+(S.vista===x[0]?' aria-current="page"':'')+'>'+ic(I[x[0]==='hoy'?'hoy':x[0]==='tarjeta'?'tarjeta':'mes'])+x[1]+(x[0]==='tarjeta'?'<i'+(S.punto?' class="si"':'')+'></i>':'')+'</button>').join('')}
function render(){if(S.vista==='hoy')pintarHoy();if(S.vista==='tarjeta'){pintarTarjeta();S.punto=false}if(S.vista==='mes')pintarMes();$$('.cl-v').forEach(v=>v.hidden=v.dataset.v!==S.vista);pintarNav()}
const ver=v=>{S.vista=v;render();scrollTo(0,0)};
// ---------- hojas ----------
let velo=null;
function hoja(html,label){cerrar();velo=document.createElement('div');velo.className='cl-velo cl-app';velo.style.cssText='background:rgba(22,24,29,.4)';
  velo.innerHTML='<div class="cl-hoja" role="dialog" aria-modal="true" aria-label="'+label+'"><div class="cl-asa"></div>'+html+'</div>';dm.appendChild(velo);
  velo.addEventListener('click',e=>{if(e.target===velo||e.target.closest('[data-cerrar]'))cerrar()});return velo.firstChild}
function cerrar(){if(velo){velo.remove();velo=null}}
document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrar()});
const cabeza=t=>'<div class="cl-fila" style="margin-bottom:12px"><h2 class="cl-crece" style="margin:0;font-size:20px">'+t+'</h2><button type="button" class="cl-x" data-cerrar aria-label="Cerrar">'+ic(I.x)+'</button></div>';
function hojaCalculo(){const a=alcanza(),r=(t,v,c)=>'<div class="r '+(c||'')+'"><span>'+t+'</span><b class="num">'+v+'</b></div>';
  hoja(cabeza('Cómo se calcula')+'<div class="cl-compara">'+r('Tienes hoy (efectivo y débito)',P(a.bolsillo))+a.pagos.map(p=>r('Pago de '+p.alias,P(-p.monto))).join('')
    +r(a.libre<0?'Te faltan':'Libre',P(Math.abs(a.libre)),'total')+(a.libre>=0?r('÷ '+(a.dias===1?'1 día':a.dias+' días')+' hasta '+fFrase(ING),P(Math.floor(a.libre/a.dias))+' al día','total'):'')+'</div>'
    +'<p class="cl-ayuda" style="margin-top:14px">Solo contamos los pagos de tarjeta que vencen antes de que te llegue dinero'+(a.pagos.length?'':': el de '+T.alias+' vence '+fFrase(T.pago)+', después de tu quincena')+'. Tu próximo ingreso es '+fFrase(ING)+'.</p>','Cómo se calcula')}
function hojaYa(){let de='debito';
  const h=hoja(cabeza('Ya pagué '+T.alias)+'<div class="cl-pila"><div class="cl-compara"><div class="r"><span>Fecha para pagar</span><b>'+fTexto(T.pago)+'</b></div><div class="r"><span>Pago para no generar intereses</span><b class="num">'+P(T.sinInt)+'</b></div></div>'
    +'<div><p class="cl-etq" style="margin-bottom:8px">¿De dónde salió el dinero?</p><div class="cl-seg" role="group" aria-label="¿De dónde salió el dinero?"><button type="button" data-de="debito" aria-pressed="true">Débito</button><button type="button" data-de="efectivo" aria-pressed="false">Efectivo</button></div></div>'
    +'<button type="button" class="cl-btn prim bloque cl-guardar" id="cl-todo">'+ic(I.check)+'Pagué todo · '+pc(T.sinInt)+'</button><p class="cl-ayuda" id="cl-t-todo"></p></div>','Ya pagué');
  const ex=()=>{h.querySelector('#cl-t-todo').textContent='Anotamos un pago de '+pesos(T.sinInt)+(de==='debito'?' de tu débito':' en efectivo')+' con fecha de hoy y la marcamos como pagada.'};ex();
  h.addEventListener('click',e=>{const b=e.target.closest('[data-de]');if(b){de=b.dataset.de;h.querySelectorAll('[data-de]').forEach(x=>x.setAttribute('aria-pressed',x===b));ex()}
    if(e.target.closest('#cl-todo')){const m={id:sigId++,tipo:'pago',monto:T.sinInt,metodo:de,fecha:HOY,nuevo:1};movs.unshift(m);S[de==='debito'?'db':'ef']-=T.sinInt;T.saldo-=T.sinInt;T.pagada=true;cerrar();
      toast(T.alias+': pagada ✓',()=>{movs.shift();S[de==='debito'?'db':'ef']+=T.sinInt;T.saldo+=T.sinInt;T.pagada=false});render()}})}
function hojaAnotar(tipo){let monto='',metodo=S.ult.metodo,cat=S.ult.cat;if(tipo!=='gasto'&&metodo==='tarjeta')metodo='efectivo';
  const h=hoja('<div class="cl-fila"><div class="cl-seg cl-crece" role="group" aria-label="Tipo"><button type="button" data-tipo="gasto">Gasto</button><button type="button" data-tipo="ingreso">Ingreso</button></div><button type="button" class="cl-x" data-cerrar aria-label="Cerrar">'+ic(I.x)+'</button></div>'
    +'<p class="cl-pm num" id="cl-pm" aria-live="polite"></p><p class="cl-etq" id="cl-t-met" style="text-align:center"></p><div class="cl-metodo" id="cl-met" role="group" aria-labelledby="cl-t-met"></div>'
    +'<div class="cl-tec">'+['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>'<button type="button" data-k="'+k+'" aria-label="'+(k==='⌫'?'Borrar':k)+'">'+(k==='⌫'?ic(I.borrar):k)+'</button>').join('')+'</div>'
    +'<div id="cl-dest"></div><div id="cl-av"></div><button type="button" class="cl-btn prim bloque cl-guardar" id="cl-guardar" disabled>Escribe el monto</button>','Anotar');
  const pintar=()=>{h.dataset.tipo=tipo;const n=Number(monto.replace(/\\.$/,''))||0,c=Math.round(n*100);
    h.querySelectorAll('[data-tipo]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tipo===tipo));
    const pm=h.querySelector('#cl-pm');pm.textContent=monto?'$'+n.toLocaleString('es-MX',{maximumFractionDigits:2})+(monto.endsWith('.')?'.':''):'$0';pm.classList.toggle('si',!!monto);
    h.querySelector('#cl-t-met').textContent=tipo==='gasto'?'¿Con qué pagaste?':'¿Dónde lo recibiste?';
    const ops=[['efectivo','Efectivo',I.efectivo],['debito','Débito',I.debito]].concat(tipo==='gasto'?[['tarjeta',T.alias,I.tarjeta]]:[]);
    h.querySelector('#cl-met').innerHTML=ops.map(o=>'<button type="button" data-m="'+o[0]+'" aria-pressed="'+(o[0]===metodo)+'">'+ic(o[2])+'<span>'+o[1]+'</span></button>').join('');
    h.querySelector('#cl-dest').innerHTML=tipo==='gasto'?'<p class="cl-etq" style="margin:8px 4px">Categoría</p><div class="cl-cats" role="radiogroup" aria-label="Categoría">'+CATS.map(x=>'<button type="button" role="radio" data-cat="'+x[0]+'" aria-checked="'+(x[0]===cat)+'"><span class="cl-ico">'+ic(I[x[0]])+'</span>'+x[1]+'</button>').join('')+'</div>':'';
    const queda=T.lim-T.saldo-c;h.querySelector('#cl-av').innerHTML=tipo==='gasto'&&metodo==='tarjeta'&&c&&(queda<0||Math.round((T.saldo+c)/T.lim*100)>30)?'<p class="cl-aviso-c">'+(queda<0?'No te alcanza el disponible de '+T.alias+'.':'Con esta compra usarías el '+Math.round((T.saldo+c)/T.lim*100)+' % de tu límite. Lo sano es menos del 30 %.')+'</p>':'';
    const g=h.querySelector('#cl-guardar');g.disabled=!(c>0);g.textContent=c>0?'Guardar '+tipo+' de '+pc(c):'Escribe el monto'};
  h.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.tipo){tipo=b.dataset.tipo;if(tipo!=='gasto'&&metodo==='tarjeta')metodo='efectivo'}
    else if(b.dataset.m)metodo=b.dataset.m;else if(b.dataset.cat)cat=b.dataset.cat;
    else if(b.dataset.k){const k=b.dataset.k;if(k==='⌫')monto=monto.slice(0,-1);else if(k==='.'){if(!monto.includes('.'))monto=(monto||'0')+'.'}else if(!(monto.includes('.')&&monto.split('.')[1].length>=2)&&monto.replace('.','').length<7)monto=(monto==='0'?'':monto)+k}
    else if(b.id==='cl-guardar'){guardar();return}else return;pintar()});
  const guardar=()=>{const c=Math.round((Number(monto)||0)*100);if(!c)return;const m={id:sigId++,tipo:tipo,cat:tipo==='gasto'?cat:null,monto:c,metodo:metodo,fecha:HOY,nuevo:1};
    movs.forEach(x=>x.nuevo=0);movs.unshift(m);aplicar(m,1);if(tipo==='gasto')S.ult={metodo:metodo,cat:cat};cerrar();
    const como=metodo==='tarjeta'?'con '+T.alias:metodo==='debito'?'con débito':'en efectivo';
    toast((tipo==='gasto'?'Gasto':'Ingreso')+' de '+pc(c)+' '+como+' guardado',()=>{movs.splice(movs.indexOf(m),1);aplicar(m,-1)});if(metodo==='tarjeta')S.punto=true;S.vista='hoy';render();scrollTo(0,0)};
  pintar();setTimeout(()=>h.querySelector('.cl-x').focus({preventScroll:true}),40)}
function aplicar(m,s){const c=m.monto*s;if(m.tipo==='ingreso'){if(m.metodo==='debito')S.db+=c;else S.ef+=c}
  else if(m.metodo==='tarjeta'){T.saldo+=c;T.periodo+=c}else if(m.metodo==='debito')S.db-=c;else S.ef-=c}
// aviso con Deshacer
let tT,deshacer=null;
function toast(t,fn){const el=$('.cl-toast');el.querySelector('span').textContent=t;deshacer=fn;el.querySelector('button').hidden=!fn;el.classList.add('ver');clearTimeout(tT);tT=setTimeout(()=>el.classList.remove('ver'),5000)}
$('#cl-deshacer').onclick=()=>{if(deshacer){deshacer();deshacer=null;$('.cl-toast').classList.remove('ver');movs.forEach(x=>x.nuevo=0);render();avisoDemo('Listo, lo quitamos')}};
// ---------- eventos ----------
dm.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.closest('.cl-hoja'))return;
  if(b.dataset.anotar)hojaAnotar(b.dataset.anotar);else if(b.dataset.ver)ver(b.dataset.ver);
  else if(b.id==='cl-calc')hojaCalculo();else if(b.id==='cl-ya')hojaYa()});
render();
})();`,
};
