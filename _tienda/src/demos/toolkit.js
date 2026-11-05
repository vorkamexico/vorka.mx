// Demo del Toolkit: el saldo del mes en Mi Toolkit (Toolkit: pagas $599 y recibes $800), gastarlo en productos reales de la
// tienda a precio de lista, ver cuánto queda y cuánto ahorraste, y sacar un código de regalo (TK-XXXX-XXXX, un solo uso, con el
// mismo texto de WhatsApp que Mi Toolkit). Reglas de toolkit.js: precio de lista, sin pagos mixtos, el saldo no vence.
// Precios de lista tomados de las migraciones (no se inventan): test-vocacional $79 (0058), agenda-mensual $99 (0042),
// cupo-pro (hasta 300) $149 (0018/0019), brindi-celebracion $699 (0036); toolkit-mensual $599 → $800 de saldo (0063).
// Si cambian en la tienda, actualízalos aquí.
const PLAN = { paga: 599, recibe: 800 };
const PRODUCTOS = [
  ['test', 'Reporte del Test vocacional', 'Perfil de intereses y 20 carreras afines', 79],
  ['agenda', '1 mes de Agenda', 'Citas en línea para tu negocio', 99],
  ['cupo', 'Evento Cupo Pro · hasta 300 personas', 'Correos, cover sin comisión y RPs', 149],
  ['brindi', 'Invitación Brindi · plan Celebración', 'Hasta 600 invitados, QR por invitado', 699],
];

export default {
  titulo: 'Gasta tu saldo del mes y mira cuánto te ahorras.',
  texto: 'Es Mi Toolkit con el abono de un mes: paga productos reales de la tienda con tu saldo y saca un código de regalo para mandarlo por WhatsApp.',
  prueba: ['Pagar 2 o 3 productos de la tienda con tu saldo, a precio de lista', 'Ver cuánto te queda y cuánto te ahorraste', 'Sacar un código de regalo y ver el mensaje para WhatsApp'],
  cta: 'Quiero mi Toolkit · $599 al mes',
  css: `
.tk-top{display:flex;gap:6px;padding:12px;background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:5}
.tk-top button{flex:1;min-height:44px;border:0;border-radius:12px;background:#F2F1F3;font-weight:650;font-size:14.5px;color:#5d5860}
.tk-top button[aria-selected=true]{background:var(--pm);color:#fff}
.tk-v{padding:16px 16px 22px}.tk-v[hidden],#dm [hidden]{display:none!important}
.tk-saldo{position:relative;overflow:hidden;border-radius:24px;background:var(--pm);color:#fff;padding:20px 20px 18px}
.tk-saldo::after{content:"";position:absolute;right:-60px;bottom:-80px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.08)}
.tk-saldo small{font-size:13.5px;font-weight:600;color:rgba(255,255,255,.85)}
.tk-num{display:block;font-size:48px;font-weight:800;letter-spacing:-.05em;line-height:1;margin:8px 0 6px;font-variant-numeric:tabular-nums}
.tk-num em{font-style:normal;font-size:16px;letter-spacing:0;margin-left:6px;color:rgba(255,255,255,.7)}
.tk-saldo p{margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.88);position:relative;z-index:1}
.tk-barra{position:relative;z-index:1;height:8px;border-radius:4px;background:rgba(255,255,255,.22);margin-top:12px;overflow:hidden}.tk-barra i{display:block;height:100%;background:#fff;border-radius:4px;transition:width .4s}
.tk-h{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a858d;margin:22px 0 8px}
.tk-prod{display:flex;align-items:center;gap:10px;padding:12px;border-radius:16px;border:1.5px solid #ECE9EF;background:#fff;margin-bottom:8px}
.tk-prod .x{flex:1;min-width:0}.tk-prod b{display:block;font-size:14.5px;line-height:1.25}.tk-prod small{display:block;font-size:12.5px;color:#6b666e}
.tk-prod .pr{font-weight:800;font-size:15px;margin-top:3px;display:block;font-variant-numeric:tabular-nums}
.tk-prod button{flex:none;min-height:44px;padding:0 12px;border-radius:12px;border:0;background:var(--pm);color:#fff;font-weight:700;font-size:13px;line-height:1.15;max-width:112px}
.tk-prod button.falta{background:#F2F1F3;color:#6b666e}
.tk-prod.hecho{border-color:var(--pm);background:var(--pm-s)}.tk-prod.hecho button{background:transparent;color:var(--pm)}
.tk-res{border-radius:18px;background:#F6F3EA;padding:14px;margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tk-res div{background:#fff;border-radius:12px;padding:10px}.tk-res b{display:block;font-size:20px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.tk-res small{font-size:12.5px;color:#6b666e;line-height:1.3;display:block}
.tk-res .ok b{color:#14663b}
.tk-res p{grid-column:1/-1;margin:0;font-size:13px;color:#5d5860;line-height:1.45}
.tk-mov{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #F0EEF2;font-size:14px}.tk-mov span{color:#5d5860}.tk-mov b{font-variant-numeric:tabular-nums;white-space:nowrap}.tk-mov b.mas{color:#14663b}
.tk-op{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1.5px solid #ECE9EF;background:#fff;border-radius:14px;padding:12px;margin-bottom:8px;min-height:52px}
.tk-op[aria-pressed=true]{border-color:var(--pm);background:var(--pm-s)}
.tk-op .x{flex:1}.tk-op b{display:block;font-size:14.5px}.tk-op small{color:#6b666e;font-size:12.5px}.tk-op .pr{font-weight:800}
.tk-cant{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0}
.tk-cant span{font-weight:650;font-size:14.5px}
.tk-step{display:flex;align-items:center;gap:6px}.tk-step button{width:44px;height:44px;border-radius:12px;border:1.5px solid #ECE9EF;background:#fff;font-size:20px;font-weight:700}.tk-step b{min-width:28px;text-align:center;font-size:18px}
.tk-btn{width:100%;min-height:52px;border:0;border-radius:999px;background:var(--pm);color:#fff;font-weight:700;font-size:15.5px}
.tk-btn:disabled{opacity:.45}
.tk-nota{font-size:12.5px;color:#6b666e;margin:8px 0 0;text-align:center}
.tk-cod{border-radius:16px;border:1.5px dashed var(--pm);background:var(--pm-s);padding:12px;margin-top:10px}
.tk-cod code{display:block;font:800 21px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em}
.tk-cod small{display:block;font-size:12.5px;color:#5d5860;margin:3px 0 10px}
.tk-cod .a{display:flex;gap:8px}.tk-cod .a button{flex:1;min-height:44px;border-radius:12px;border:1px solid #E2E0E4;background:#fff;font-weight:650;font-size:13.5px}
.tk-cod .a .wa{background:#E8F6EE;border-color:#E8F6EE;color:#14663b}
.tk-est{display:inline-block;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;background:#E3F4EA;color:#14663b;margin-left:8px;vertical-align:4px}
`,
  html: `
<div class="tk-top" role="tablist"><button type="button" role="tab" aria-selected="true" data-v="saldo">Mi saldo</button><button type="button" role="tab" aria-selected="false" data-v="cod">Códigos de regalo</button></div>
<section class="tk-v" data-v="saldo">
  <div class="tk-saldo"><small>Tu saldo del Toolkit</small><span class="tk-num"><span id="tk-num">$${PLAN.recibe}</span><em>MXN</em></span>
    <div class="tk-barra" aria-hidden="true"><i id="tk-barra" style="width:100%"></i></div>
    <p id="tk-abono"></p></div>
  <p class="tk-h">Úsalo en la tienda</p>
  <div id="tk-prods">${PRODUCTOS.map(([k, n, d, p]) => `<div class="tk-prod" data-k="${k}"><div class="x"><b>${n}</b><small>${d}</small><span class="pr">$${p}</span></div><button type="button" data-pagar="${k}">Pagar con mi saldo</button></div>`).join('')}</div>
  <div class="tk-res" id="tk-res" hidden aria-live="polite"></div>
  <p class="tk-h">Movimientos</p>
  <div id="tk-movs"></div>
</section>
<section class="tk-v" data-v="cod" hidden>
  <p class="tk-h" style="margin-top:4px">1 · ¿Qué quieres regalar?</p>
  <div id="tk-ops">${PRODUCTOS.slice(0, 3).map(([k, n, d, p], i) => `<button class="tk-op" type="button" aria-pressed="${i === 0}" data-op="${k}"><span class="x"><b>${n}</b><small>Vale el producto completo${k === 'agenda' ? ' (1 mes)' : ''}</small></span><span class="pr">$${p}</span></button>`).join('')}</div>
  <div class="tk-cant"><span>2 · ¿Cuántos códigos?</span><div class="tk-step"><button type="button" data-c="-1" aria-label="Menos">−</button><b id="tk-c">1</b><button type="button" data-c="1" aria-label="Más">+</button></div></div>
  <button class="tk-btn" type="button" id="tk-sacar"></button>
  <p class="tk-nota" id="tk-cnota">Se descuenta de tu saldo a precio de lista. No vencen y, si nadie los usa, los regresas a tu saldo.</p>
  <div id="tk-cods"></div>
</section>`,
  js: `
(()=>{
const $=s=>document.querySelector(s),dm=$('#dm'),PAGA=${PLAN.paga},RECIBE=${PLAN.recibe};
const PR=Object.fromEntries(${JSON.stringify(PRODUCTOS)}.map(([k,n,d,p])=>[k,{n,p}]));
const mx=n=>'$'+Math.round(n).toLocaleString('es-MX');
const mes=new Intl.DateTimeFormat('es-MX',{month:'long'}).format(new Date());
let saldo=RECIBE,gastado=0;const movs=[[RECIBE,'Abono de tu suscripción · '+mes]];
$('#tk-abono').textContent='Abono de '+mes+': pagaste '+mx(PAGA)+' y recibiste '+mx(RECIBE)+'. Tu saldo nunca vence.';
const pintar=()=>{$('#tk-num').textContent=mx(saldo);$('#tk-barra').style.width=(saldo/RECIBE*100)+'%';
  document.querySelectorAll('.tk-prod:not(.hecho) button').forEach(b=>{const f=PR[b.dataset.pagar].p>saldo;b.classList.toggle('falta',f);b.textContent=f?'Te faltan '+mx(PR[b.dataset.pagar].p-saldo):'Pagar con mi saldo'});
  $('#tk-movs').innerHTML=movs.slice().reverse().map(([c,t])=>'<div class="tk-mov"><span>'+t+'</span><b class="'+(c>0?'mas':'')+'">'+(c>0?'+':'−')+mx(Math.abs(c))+'</b></div>').join('');
  const r=$('#tk-res');r.hidden=!gastado;
  if(gastado){const pagaste=gastado*PAGA/RECIBE;
    r.innerHTML='<div><b>'+mx(gastado)+'</b><small>usaste, a precio de lista</small></div><div><b>'+mx(saldo)+'</b><small>te quedan, sin vencer</small></div><div><b>'+mx(pagaste)+'</b><small>es lo que te costó de tu mensualidad</small></div><div class="ok"><b>'+mx(gastado-pagaste)+'</b><small>te ahorraste contra pagarlo con tarjeta</small></div><p>Cada peso de saldo te cuesta '+(PAGA/RECIBE).toLocaleString('es-MX',{style:'currency',currency:'MXN'})+': pagas '+mx(PAGA)+' y recibes '+mx(RECIBE)+'.</p>'}
  cupon()};
let op='test',cant=1;
const cupon=()=>{const t=PR[op].p*cant,b=$('#tk-sacar');b.textContent=(cant===1?'Sacar 1 código':'Sacar '+cant+' códigos')+' · '+mx(t)+' de tu saldo';b.disabled=t>saldo;
  $('#tk-cnota').textContent=t>saldo?'Te faltan '+mx(t-saldo)+' de saldo para estos códigos.':'Se descuenta de tu saldo a precio de lista. No vencen y, si nadie los usa, los regresas a tu saldo.'};
const AL='ABCDEFGHJKMNPQRSTUVWXYZ23456789',r4=()=>Array.from({length:4},()=>AL[Math.floor(Math.random()*31)]).join('');
const textoWa=(n,c)=>'Te regalo '+n+' de Vorka México 🎁 Canjéalo con tu correo aquí: https://vorka.mx/tienda/canjear/'+c+' (código '+c+', un solo uso).';
const cods=[];
dm.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.matches('[role=tab]')){document.querySelectorAll('[role=tab]').forEach(x=>x.setAttribute('aria-selected',x===b));document.querySelectorAll('.tk-v').forEach(x=>x.hidden=x.dataset.v!==b.dataset.v);scrollTo(0,0)}
  else if(b.dataset.pagar){const k=b.dataset.pagar,p=PR[k];if(b.closest('.hecho'))return;
    if(p.p>saldo)return avisoDemo('Te faltan '+mx(p.p-saldo)+'. Por ahora no se combinan saldo y tarjeta: este lo pagarías con tarjeta, OXXO o SPEI.');
    saldo-=p.p;gastado+=p.p;movs.push([-p.p,'Compraste con saldo · '+p.n]);const c=b.closest('.tk-prod');c.classList.add('hecho');b.textContent='✓ Pagado';
    avisoDemo('¡Listo! Te llega igual que una compra normal, con su correo y su acceso.');pintar();if(gastado&&movs.length===3)$('#tk-res').scrollIntoView({block:'nearest',behavior:'smooth'})}
  else if(b.dataset.op){op=b.dataset.op;document.querySelectorAll('[data-op]').forEach(x=>x.setAttribute('aria-pressed',x===b));cupon()}
  else if(b.dataset.c){cant=Math.min(3,Math.max(1,cant+ +b.dataset.c));$('#tk-c').textContent=cant;cupon()}
  else if(b.id==='tk-sacar'){const p=PR[op],t=p.p*cant;if(t>saldo)return;saldo-=t;
    movs.push([-t,'Sacaste '+(cant===1?'1 código':cant+' códigos')+' de regalo · '+p.n]);
    for(let i=0;i<cant;i++)cods.unshift({c:'TK-'+r4()+'-'+r4(),n:p.n,p:p.p});
    $('#tk-cods').innerHTML='<p class="tk-h">Tus códigos</p>'+cods.map((x,i)=>'<div class="tk-cod"><code>'+x.c+'<span class="tk-est">Disponible</span></code><small>'+x.n+' · Vale '+mx(x.p)+' · no vence</small><div class="a"><button type="button" data-copia="'+i+'">Copiar liga</button><button type="button" class="wa" data-wa="'+i+'">WhatsApp</button></div></div>').join('');
    pintar();avisoDemo('Te quedan '+mx(saldo)+' de saldo.');$('#tk-cods').scrollIntoView({block:'start',behavior:'smooth'})}
  else if(b.dataset.copia)avisoDemo('Liga copiada: vorka.mx/tienda/canjear/'+cods[+b.dataset.copia].c)
  else if(b.dataset.wa){const x=cods[+b.dataset.wa];avisoDemo('Se abre WhatsApp con: «'+textoWa(x.n,x.c)+'»')}
});
pintar();
})();`,
};
