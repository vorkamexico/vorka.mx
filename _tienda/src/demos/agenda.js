// Demo de Agenda: primero reservas como cliente (servicio → día → hora → datos → confirmada) y luego ves tu día como dueña
// del negocio, con la cita nueva, «vino / no vino» y el recordatorio por WhatsApp. Negocio y personas de ejemplo.
export default {
  titulo: 'Agenda una cita como si fueras tu cliente.',
  texto: 'Reserva en la página de un consultorio de ejemplo y luego cambia a la vista del dueño: ahí aparece tu cita, lista para atenderla.',
  prueba: ['Elegir servicio, día y hora, con las horas ocupadas ya bloqueadas', 'Ver la confirmación que recibe tu cliente', 'Cambiar a «Tu día» y marcar quién vino o mandar un recordatorio'],
  cta: 'Quiero mi Agenda · 7 días gratis',
  css: `
.ag-top{display:flex;gap:6px;padding:12px;background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:5}
.ag-top button{flex:1;min-height:42px;border:0;border-radius:12px;background:#F2F1F3;font-weight:650;font-size:14.5px;color:#5d5860;position:relative}
.ag-top button[aria-selected=true]{background:var(--pm);color:#fff}
.ag-top i{position:absolute;top:-5px;right:10px;min-width:20px;height:20px;border-radius:10px;background:#E5484D;color:#fff;font:700 12px/20px Inter,sans-serif;font-style:normal;padding:0 6px;display:none}
.ag-top i.si{display:block}
.ag-v{padding:18px 16px 22px}.ag-v[hidden]{display:none}
.ag-neg{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.ag-logo{width:48px;height:48px;border-radius:14px;background:var(--pm);color:#fff;display:grid;place-items:center;font-weight:800;font-size:19px;flex:none}
.ag-neg b{display:block;font-size:17px}.ag-neg small{color:#6b666e;font-size:13.5px}
.ag-paso{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--pm);margin:20px 0 8px}
.ag-op{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left;border:1.5px solid #E7E5E9;background:#fff;border-radius:14px;padding:13px 14px;margin-bottom:8px}
.ag-op b{display:block;font-size:15.5px}.ag-op small{color:#6b666e;font-size:13.5px}
.ag-op[aria-pressed=true]{border-color:var(--pm);background:var(--pm-s)}
.ag-dias{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.ag-dia{border:1.5px solid #E7E5E9;background:#fff;border-radius:14px;padding:9px 0;text-align:center;line-height:1.15}
.ag-dia small{display:block;font-size:11.5px;color:#6b666e;text-transform:capitalize}.ag-dia b{font-size:19px}
.ag-dia[aria-pressed=true]{border-color:var(--pm);background:var(--pm);color:#fff}.ag-dia[aria-pressed=true] small{color:#fff;opacity:.85}
.ag-horas{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.ag-hora{min-height:44px;border:1.5px solid #E7E5E9;background:#fff;border-radius:12px;font-weight:650;font-variant-numeric:tabular-nums}
.ag-hora:disabled{background:#F4F3F5;color:#b3aeb6;text-decoration:line-through;border-color:transparent;cursor:not-allowed}
.ag-hora[aria-pressed=true]{background:var(--pm);color:#fff;border-color:var(--pm)}
.ag-campo{display:block;margin-bottom:10px}.ag-campo span{display:block;font-size:13.5px;font-weight:600;margin-bottom:5px}
.ag-campo input{width:100%;min-height:46px;border:1.5px solid #E7E5E9;border-radius:12px;padding:0 13px;background:#fff}
.ag-campo input:focus{outline:none;border-color:var(--pm)}
.ag-ok{width:100%;min-height:52px;border:0;border-radius:999px;background:var(--pm);color:#fff;font-weight:700;font-size:16px;margin-top:8px}
.ag-ok:disabled{opacity:.4;cursor:not-allowed}
.ag-res{margin:12px 0 0;font-size:14px;color:#5d5860;min-height:20px}
.ag-conf{text-align:center;padding:26px 6px 6px}
.ag-check{width:66px;height:66px;border-radius:50%;background:var(--pm-s);color:var(--pm);display:grid;place-items:center;margin:0 auto 14px}
.ag-check svg{width:34px;height:34px}
.ag-conf h3{margin:0;font-size:22px;letter-spacing:-.01em}.ag-conf p{color:#5d5860;margin:8px 0 0}
.ag-ficha{margin:18px 0 0;border:1px solid #eee;border-radius:16px;padding:14px;text-align:left;display:grid;gap:6px;font-size:15px}
.ag-ficha div{display:flex;justify-content:space-between;gap:10px}.ag-ficha span{color:#6b666e}
.ag-sec2{width:100%;min-height:48px;border:1.5px solid #E7E5E9;background:#fff;border-radius:999px;font-weight:650;margin-top:10px}
.ag-hoy-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}.ag-hoy-h b{font-size:20px}.ag-hoy-h span{color:#6b666e;font-size:14px}
.ag-cita{display:grid;grid-template-columns:52px 1fr;gap:4px 10px;align-items:center;padding:12px;border-radius:16px;background:#F6F5F7;margin-bottom:8px}
.ag-cita time{font-weight:750;font-variant-numeric:tabular-nums;font-size:15px}
.ag-cita b{display:block;font-size:15.5px}.ag-cita small{display:block;color:#6b666e;font-size:13px}
.ag-cita.nueva{background:var(--pm-s);box-shadow:inset 0 0 0 1.5px var(--pm)}
.ag-cita .ag-acc{grid-column:2;display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.ag-acc button{min-height:36px;padding:0 12px;border-radius:10px;border:1px solid #E2E0E4;background:#fff;font-size:13.5px;font-weight:650}
.ag-acc .wa{background:#E8F6EE;border-color:#E8F6EE;color:#14663b}
.ag-est{font-size:13px;font-weight:700}.ag-est.si{color:#14663b}.ag-est.no{color:#B3261E}
.ag-libre{border:1.5px dashed #DCD9DE;border-radius:16px;padding:12px;color:#8a858d;font-size:14px;margin-bottom:8px;display:flex;gap:10px}
.ag-libre time{font-weight:700;color:#6b666e;width:52px}
.ag-tag{display:inline-block;background:var(--pm);color:#fff;font-size:11px;font-weight:700;border-radius:6px;padding:2px 6px;margin-left:6px;vertical-align:2px}
`,
  html: `
<div class="ag-top" role="tablist"><button type="button" role="tab" aria-selected="true" data-v="cli">Tu cliente reserva</button><button type="button" role="tab" aria-selected="false" data-v="due">Tu día <i>1</i></button></div>
<section class="ag-v" data-v="cli">
  <div class="ag-neg"><span class="ag-logo">AR</span><div><b>Nutrición Ana Ruiz</b><small>vorka.mx/citas/nutricion-ana-ruiz</small></div></div>
  <div id="ag-form">
    <p class="ag-paso">1 · Servicio</p>
    <div id="ag-serv"></div>
    <p class="ag-paso">2 · Día</p>
    <div class="ag-dias" id="ag-dias"></div>
    <p class="ag-paso">3 · Hora</p>
    <div class="ag-horas" id="ag-horas"></div>
    <p class="ag-paso">4 · Tus datos</p>
    <label class="ag-campo"><span>Nombre</span><input id="ag-nom" autocomplete="off" placeholder="Ej. Laura Méndez"></label>
    <label class="ag-campo"><span>Correo (para tu confirmación y recordatorios)</span><input id="ag-mail" type="email" autocomplete="off" placeholder="laura@ejemplo.com"></label>
    <p class="ag-res" id="ag-res">Elige servicio, día y hora.</p>
    <button class="ag-ok" type="button" id="ag-ok" disabled>Confirmar cita</button>
  </div>
  <div class="ag-conf" id="ag-conf" hidden>
    <div class="ag-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg></div>
    <h3>¡Tu cita quedó confirmada!</h3><p>Te llega la confirmación por correo y un recordatorio 24 h y 2 h antes.</p>
    <div class="ag-ficha" id="ag-ficha"></div>
    <button class="ag-ok" type="button" id="ag-ver">Ver cómo le aparece al negocio</button>
    <button class="ag-sec2" type="button" id="ag-otra">Hacer otra reserva</button>
  </div>
</section>
<section class="ag-v" data-v="due" hidden>
  <div class="ag-hoy-h"><b id="ag-dia-t">Hoy</b><span id="ag-n"></span></div>
  <div id="ag-lista"></div>
</section>`,
  js: `
(()=>{
const $=s=>document.querySelector(s),dm=$('#dm');
const SERV=[['Primera consulta','60 min · plan de alimentación',60],['Seguimiento','30 min · revisión de avances',30],['Medición de composición corporal','20 min',20]];
const fmt=new Intl.DateTimeFormat('es-MX',{weekday:'short'}),larga=new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'});
const dias=[];for(let d=new Date(),i=0;dias.length<5&&i<10;i++){const x=new Date(d);x.setDate(d.getDate()+i+1);if(x.getDay()!==0)dias.push(x)}
const HORAS=['9:00','10:00','11:00','12:00','13:00','16:00','17:00','18:00','19:00'];
const ocupada=(di,h)=>((di*7+HORAS.indexOf(h)*3)%5)<2;
const st={s:null,d:0,h:null};
$('#ag-serv').innerHTML=SERV.map((s,i)=>'<button class="ag-op" type="button" aria-pressed="false" data-i="'+i+'"><span><b>'+s[0]+'</b><small>'+s[1]+'</small></span></button>').join('');
$('#ag-dias').innerHTML=dias.map((d,i)=>'<button class="ag-dia" type="button" aria-pressed="'+(i===0)+'" data-i="'+i+'"><small>'+fmt.format(d).replace('.','')+'</small><b>'+d.getDate()+'</b></button>').join('');
const horas=()=>{$('#ag-horas').innerHTML=HORAS.map(h=>'<button class="ag-hora" type="button" aria-pressed="'+(st.h===h)+'"'+(ocupada(st.d,h)?' disabled aria-label="'+h+' ocupada"':'')+' data-h="'+h+'">'+h+'</button>').join('')};horas();
const listo=()=>{const ok=st.s!==null&&st.h&&$('#ag-nom').value.trim().length>1;$('#ag-ok').disabled=!ok;
  $('#ag-res').textContent=st.s===null?'Elige servicio, día y hora.':!st.h?'Ahora elige una hora libre.':!$('#ag-nom').value.trim()?'Escribe tu nombre y listo.':SERV[st.s][0]+' · '+larga.format(dias[st.d])+', '+st.h};
dm.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.matches('.ag-op')){st.s=+b.dataset.i;document.querySelectorAll('.ag-op').forEach(x=>x.setAttribute('aria-pressed',x===b))}
  else if(b.matches('.ag-dia')){st.d=+b.dataset.i;st.h=null;document.querySelectorAll('.ag-dia').forEach(x=>x.setAttribute('aria-pressed',x===b));horas()}
  else if(b.matches('.ag-hora')){st.h=b.dataset.h;horas()}
  else if(b.matches('[role=tab]'))ver(b.dataset.v);
  else if(b.id==='ag-ok')confirmar();
  else if(b.id==='ag-ver')ver('due');
  else if(b.id==='ag-otra'){$('#ag-conf').hidden=true;$('#ag-form').hidden=false;st.h=null;horas();listo()}
  else if(b.dataset.a){const c=b.closest('.ag-cita');
    if(b.dataset.a==='wa')avisoDemo('Se abre WhatsApp con: «Hola '+c.dataset.n.split(' ')[0]+', te recuerdo tu cita de hoy a las '+c.dataset.h+'. ¡Te esperamos!»');
    else{c.querySelector('.ag-acc').innerHTML='<span class="ag-est '+(b.dataset.a==='si'?'si">✓ Vino':'no">No vino · queda en su historial')+'</span>';avisoDemo(b.dataset.a==='si'?'Listo: marcada como atendida.':'Anotado. Así sabes quién suele faltar.')}}
  listo()});
$('#ag-nom').addEventListener('input',listo);
const ver=v=>{document.querySelectorAll('[role=tab]').forEach(x=>x.setAttribute('aria-selected',x.dataset.v===v));document.querySelectorAll('.ag-v').forEach(x=>x.hidden=x.dataset.v!==v);if(v==='due'){pintarDia();$('.ag-top i').classList.remove('si')}scrollTo(0,0)};
let mia=null;
const confirmar=()=>{mia={n:$('#ag-nom').value.trim(),s:SERV[st.s][0],h:st.h,d:st.d};
  $('#ag-ficha').innerHTML=[['Servicio',mia.s],['Día',larga.format(dias[mia.d])],['Hora',mia.h],['Con','Ana Ruiz']].map(([a,b])=>'<div><span>'+a+'</span><b>'+b+'</b></div>').join('');
  $('#ag-form').hidden=true;$('#ag-conf').hidden=false;$('.ag-top i').classList.add('si');scrollTo(0,0)};
const NOMBRES=[['Laura Méndez','Primera consulta'],['Jorge Salas','Seguimiento'],['Mariana Cruz','Seguimiento'],['Pedro Ávila','Medición de composición corporal'],['Rosa Íñiguez','Seguimiento']];
const pintarDia=()=>{const d=mia?mia.d:0,citas=HORAS.filter(h=>ocupada(d,h)).map((h,i)=>({h,n:NOMBRES[(i+d)%NOMBRES.length][0],s:NOMBRES[(i+d)%NOMBRES.length][1]}));
  if(mia)citas.push({h:mia.h,n:mia.n,s:mia.s,nueva:1});citas.sort((a,b)=>HORAS.indexOf(a.h)-HORAS.indexOf(b.h));
  $('#ag-dia-t').textContent=larga.format(dias[d]).replace(/^./,m=>m.toUpperCase());$('#ag-n').textContent=citas.length+' citas';
  const libres=HORAS.filter(h=>!citas.some(c=>c.h===h)).slice(0,2);
  $('#ag-lista').innerHTML=citas.map(c=>'<div class="ag-cita'+(c.nueva?' nueva':'')+'" data-n="'+c.n.replace(/"/g,'')+'" data-h="'+c.h+'"><time>'+c.h+'</time><div><b>'+c.n.replace(/</g,'&lt;')+(c.nueva?'<span class="ag-tag">Nueva</span>':'')+'</b><small>'+c.s+' · Ana Ruiz</small></div><div class="ag-acc"><button type="button" data-a="si">✓ Vino</button><button type="button" data-a="no">No vino</button><button type="button" class="wa" data-a="wa">Recordar por WhatsApp</button></div></div>').join('')
   +libres.map(h=>'<div class="ag-libre"><time>'+h+'</time>Libre · tus clientes la pueden reservar</div>').join('')};
})();`,
};
