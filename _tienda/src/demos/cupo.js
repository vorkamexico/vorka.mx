// Demo de Cupo: primero eres invitado (ves el evento, apartas tu lugar y el de un acompañante, y recibes tu entrada con QR) y
// luego cambias a la puerta, como organizador: la lista de registrados y el check-in con los mismos avisos que la app real
// (os.vorka.mx/cupo › checkin.js: «Cobrar en la puerta», «Puede pasar», «Ya había entrado»). Evento y personas de ejemplo.
// El plan es el gratis (hasta 30 personas, cover en la puerta, NIP para recuperar la entrada): nada de lo que solo trae Pro.
import qrcode from '../vendor/qrcode.js';

// QR reales (abren esta misma demo), uno por entrada: el tuyo y el de hasta dos acompañantes
const qr = texto => {
  const q = qrcode(0, 'M'); q.addData(texto, 'Byte'); q.make();
  const n = q.getModuleCount(); let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + 2} ${y + 2}h1v1h-1z`;
  return [n + 4, d];
};
const QRS = [1, 2, 3].map(i => qr(`https://vorka.mx/tienda/demo/cupo/?entrada=${i}`));

export default {
  titulo: 'Aparta tu lugar y luego recíbete en la puerta.',
  texto: 'Regístrate a un evento de ejemplo como invitado, saca tu entrada con QR y cambia a la vista de quien organiza para hacer el check-in.',
  prueba: ['Apartar tu lugar y el de un acompañante, sin crear cuenta', 'Ver tu entrada con QR, lista para mandarte por WhatsApp', 'Escanearla en la puerta: cobrar el cover y ver que no entra dos veces'],
  cta: 'Crear mi evento gratis',
  css: `
.cu-top{display:flex;gap:6px;padding:12px;background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:5}
.cu-top button{flex:1;min-height:44px;border:0;border-radius:12px;background:#F2F1F3;font-weight:650;font-size:14.5px;color:#5d5860;position:relative}
.cu-top button[aria-selected=true]{background:var(--pm);color:#fff}
.cu-top i{position:absolute;top:-5px;right:10px;min-width:20px;height:20px;border-radius:10px;background:#E5484D;color:#fff;font:700 12px/20px Inter,sans-serif;font-style:normal;padding:0 6px;display:none}
.cu-top i.si{display:block}
.cu-v{padding:16px 16px 22px}.cu-v[hidden],.cu-v [hidden]{display:none!important}
.cu-marca{font-weight:800;font-size:19px;letter-spacing:-.03em;margin:0 0 12px}.cu-marca i{color:var(--pm);font-style:normal}
.cu-port{position:relative;aspect-ratio:16/10;border-radius:20px;overflow:hidden;background:radial-gradient(circle at 78% 22%,#FFB86B 0 9%,transparent 10%),radial-gradient(120% 90% at 10% 100%,#E0457B 0,transparent 55%),linear-gradient(160deg,#2A1B5C,#6D28D9 60%,#B83280);color:#fff;padding:16px;display:flex;flex-direction:column;justify-content:flex-end}
.cu-port::before{content:"";position:absolute;inset:auto -10% 0;height:38%;background:repeating-linear-gradient(90deg,rgba(20,10,40,.55) 0 18px,rgba(20,10,40,.35) 18px 30px,rgba(20,10,40,.6) 30px 52px);clip-path:polygon(0 40%,8% 40%,8% 10%,16% 10%,16% 35%,27% 35%,27% 0,36% 0,36% 30%,48% 30%,48% 15%,60% 15%,60% 45%,72% 45%,72% 5%,82% 5%,82% 35%,100% 35%,100% 100%,0 100%)}
.cu-port small{position:relative;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.cu-port b{position:relative;font-size:27px;line-height:1.02;letter-spacing:-.03em;max-width:11ch}
.cu-org{display:flex;align-items:center;gap:10px;margin:12px 0 0;font-size:13.5px;color:#6b666e}.cu-org b{color:#141114}
.cu-dato{display:flex;gap:12px;align-items:center;margin:14px 0 0}
.cu-cal{flex:none;width:46px;height:50px;border-radius:12px;border:1px solid #E7E5E9;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05}
.cu-cal small{font-size:10px;font-weight:700;letter-spacing:.06em;color:#6b666e}.cu-cal b{font-size:20px}
.cu-ico{flex:none;width:46px;height:46px;border-radius:12px;border:1px solid #E7E5E9;display:grid;place-items:center;color:#6b666e}.cu-ico svg{width:22px;height:22px}
.cu-dato b{display:block;font-size:15px;line-height:1.3}.cu-dato small{display:block;color:#6b666e;font-size:13.5px}
.cu-reg{scroll-margin-top:120px;margin:18px 0 0;padding:16px;border-radius:20px;border:1px solid #E7E5E9;background:#FBFAFC}
.cu-reg-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.cu-reg-h b{font-size:17px}
.cu-precio{font-weight:700;font-size:14px;padding:5px 12px;border-radius:999px;background:#fff;border:1px solid #E7E5E9}
.cu-quedan{margin:0 0 10px;font-weight:700;color:var(--pm);font-size:14px}
.cu-campo{display:grid;gap:5px;margin:0 0 11px}.cu-campo>span{font-size:13.5px;font-weight:600}.cu-campo em{font-style:normal;color:#6b666e;font-weight:500}
.cu-campo input{width:100%;min-height:46px;padding:0 13px;border-radius:12px;border:1.5px solid #E7E5E9;background:#fff;font-size:16px}
.cu-campo input:focus{outline:none;border-color:var(--pm)}
.cu-campo small{font-size:12.5px;color:#6b666e}
.cu-fila{display:flex;gap:8px}.cu-fila input{flex:1}.cu-fila button{flex:none;width:46px;border-radius:12px;border:1.5px solid #E7E5E9;background:#fff;font-size:20px}
.cu-mas{width:100%;min-height:44px;border-radius:999px;border:1.5px dashed #CFCBD3;background:#fff;font-weight:650;font-size:14.5px;margin:0 0 12px}
.cu-check{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#5d5860;line-height:1.45;margin:4px 0 12px}.cu-check input{width:20px;height:20px;margin:1px 0 0;accent-color:var(--pm);flex:none}
.cu-btn{width:100%;min-height:52px;border:0;border-radius:999px;background:var(--pm);color:#fff;font-weight:700;font-size:16px}
.cu-btn2{width:100%;min-height:48px;border:1.5px solid #E7E5E9;background:#fff;border-radius:999px;font-weight:650;font-size:15px;margin-top:10px}
.cu-err{margin:0 0 10px;color:#B3261E;font-weight:600;font-size:14px;min-height:0}
.cu-mini{margin:8px 0 0;font-size:12.5px;color:#6b666e;text-align:center}
.cu-ok{text-align:center;margin:4px 0 14px}.cu-ok b{display:block;font-size:21px;letter-spacing:-.01em}.cu-ok p{margin:4px 0 0;color:#5d5860;font-size:14.5px}
.cu-chips{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:0 0 12px}
.cu-chips button{min-height:38px;padding:0 14px;border-radius:999px;border:1.5px solid #E7E5E9;background:#fff;font-weight:650;font-size:13.5px}
.cu-chips button[aria-pressed=true]{background:#141114;border-color:#141114;color:#fff}
.cu-pase{border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 18px 40px -22px rgba(40,20,80,.45);border:1px solid #ECE9EF}
.cu-pase-h{padding:14px 16px;background:var(--pm);color:#fff}.cu-pase-h small{display:block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.8}.cu-pase-h b{font-size:18px;letter-spacing:-.01em}
.cu-qr{display:block;width:62%;max-width:200px;margin:16px auto 6px}
.cu-pill{display:table;margin:0 auto 12px;font-size:12.5px;font-weight:700;padding:4px 12px;border-radius:999px;background:#FFF1D6;color:#7a4a00}
.cu-quien{display:flex;justify-content:space-between;gap:10px;padding:12px 16px;border-top:1px dashed #E2DEE6}
.cu-quien small{display:block;font-size:12px;color:#6b666e}.cu-quien b{font-size:15.5px}
.cu-wa{background:#25D366;color:#073b1d}
.cu-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 14px}
.cu-stats div{border-radius:16px;background:#F6F5F7;padding:10px;text-align:center}.cu-stats b{display:block;font-size:22px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}.cu-stats small{font-size:12px;color:#6b666e}
.cu-ev{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:0 0 12px}.cu-ev b{font-size:18px;letter-spacing:-.01em}.cu-ev span{font-size:13px;color:#6b666e;white-space:nowrap}
.cu-scan{position:relative;border-radius:22px;background:#141114;padding:14px;color:#fff;margin:0 0 14px}
.cu-visor{position:relative;height:120px;border-radius:16px;background:radial-gradient(circle at 50% 50%,#2c2830,#141114);display:grid;place-items:center;overflow:hidden}
.cu-visor::before{content:"";width:92px;height:92px;border-radius:14px;box-shadow:0 0 0 2px rgba(255,255,255,.85)}
.cu-visor::after{content:"";position:absolute;left:18%;right:18%;height:2px;background:#3ddc84;box-shadow:0 0 12px #3ddc84;animation:cuLinea 1.8s ease-in-out infinite alternate}
@keyframes cuLinea{from{top:18%}to{top:80%}}
@media(prefers-reduced-motion:reduce){.cu-visor::after{animation:none;top:50%}}
.cu-scan p{margin:10px 0 8px;font-size:13px;color:rgba(255,255,255,.75)}
.cu-scan-b{display:grid;gap:6px}
.cu-scan-b button{min-height:44px;border-radius:12px;border:0;background:rgba(255,255,255,.12);color:#fff;font-weight:650;font-size:14px;text-align:left;padding:0 12px}
.cu-scan-b button:disabled{opacity:.4}
.cu-res{scroll-margin-top:120px;border-radius:20px;padding:16px;text-align:center;margin:0 0 14px}
.cu-res b{display:block;font-size:15px}.cu-res h3{margin:4px 0 2px;font-size:22px;letter-spacing:-.02em}.cu-res p{margin:0 0 10px;font-size:14px}
.cu-res.ok{background:#E3F4EA;color:#0f4d29}.cu-res.cobrar,.cu-res.repetido{background:#FFF1D6;color:#5c3b00}
.cu-res button{width:100%;min-height:46px;border-radius:999px;border:0;background:#141114;color:#fff;font-weight:700;font-size:14.5px}
.cu-res button.borde{background:transparent;border:1.5px solid rgba(0,0,0,.2);color:inherit}
.cu-sec{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a858d;margin:4px 0 8px}
.cu-lista{display:grid;gap:7px}
.cu-r{display:flex;align-items:center;gap:10px;padding:10px 10px 10px 12px;border-radius:14px;background:#fff;border:1px solid #ECE9EF}
.cu-r .x{flex:1;min-width:0}.cu-r b{display:block;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cu-r small{display:block;font-size:12.5px;color:#6b666e}
.cu-r.nuevo{border-color:var(--pm);background:var(--pm-s)}
.cu-r.dentro{opacity:.62}
.cu-r button{flex:none;min-height:38px;padding:0 12px;border-radius:10px;border:1px solid #E2E0E4;background:#fff;font-size:13px;font-weight:650}
.cu-est{flex:none;font-size:12.5px;font-weight:700;color:#14663b}
.cu-tag{display:inline-block;background:var(--pm);color:#fff;font-size:10.5px;font-weight:700;border-radius:6px;padding:2px 6px;margin-left:6px;vertical-align:2px}
`,
  html: `
<div class="cu-top" role="tablist"><button type="button" role="tab" aria-selected="true" data-v="inv">Eres invitado</button><button type="button" role="tab" aria-selected="false" data-v="org">En la puerta <i>1</i></button></div>
<section class="cu-v" data-v="inv">
  <p class="cu-marca">cupo<i>.</i></p>
  <div class="cu-port" role="img" aria-label="Portada del evento"><small>Fiesta · cover en la puerta</small><b>Noche de Salsa en la Azotea</b></div>
  <p class="cu-org">Organiza <b>Colectivo Son de Barrio</b></p>
  <div class="cu-dato"><span class="cu-cal" aria-hidden="true"><small id="cu-mes"></small><b id="cu-dia"></b></span><span><b id="cu-fecha"></b><small>21:00 – 02:00</small></span></div>
  <div class="cu-dato"><span class="cu-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><span><b>La Azotea · Bar</b><small>Calle Morelos 214, Centro, Guadalajara</small></span></div>
  <div class="cu-reg" id="cu-reg">
    <div class="cu-reg-h"><b>Registro</b><span class="cu-precio">Cover $150</span></div>
    <p class="cu-quedan" id="cu-quedan"></p>
    <div id="cu-form">
      <label class="cu-campo"><span>Nombre</span><input id="cu-nom" autocomplete="off" maxlength="60" placeholder="Tu nombre completo"></label>
      <label class="cu-campo"><span>Correo</span><input id="cu-mail" type="email" autocomplete="off" maxlength="80" placeholder="tu@correo.com"><small>Para que quien organiza te identifique.</small></label>
      <label class="cu-campo"><span>Crea un NIP de 4 números</span><input id="cu-nip" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="••••"><small>Con tu correo y este NIP recuperas tu entrada si pierdes la liga.</small></label>
      <div id="cu-acomp"></div>
      <button class="cu-mas" type="button" id="cu-mas">+ Agregar acompañante</button>
      <label class="cu-check"><input type="checkbox" id="cu-priv"><span>Acepto el aviso de privacidad. Mis datos solo los ve quien organiza.</span></label>
      <p class="cu-err" id="cu-err" role="alert" hidden></p>
      <button class="cu-btn" type="button" id="cu-ok">Apartar mi lugar</button>
      <p class="cu-mini">El cover se paga en la puerta.</p>
    </div>
    <div id="cu-listo" hidden>
      <div class="cu-ok"><b>¡Tu lugar está apartado!</b><p id="cu-listo-t"></p></div>
      <div class="cu-chips" id="cu-chips"></div>
      <div class="cu-pase">
        <div class="cu-pase-h"><small>Tu entrada</small><b>Noche de Salsa en la Azotea</b></div>
        <svg class="cu-qr" id="cu-qr" role="img" aria-label="Código QR de la entrada" shape-rendering="crispEdges"></svg>
        <span class="cu-pill">El cover ($150) lo pagas al llegar</span>
        <div class="cu-quien"><span><small>A nombre de</small><b id="cu-pn"></b></span><span style="text-align:right"><small>Folio</small><b id="cu-pf"></b></span></div>
      </div>
      <button class="cu-btn cu-wa" type="button" id="cu-wa" style="margin-top:14px">Mandármela por WhatsApp</button>
      <button class="cu-btn2" type="button" id="cu-ir">Ahora, recíbete en la puerta</button>
    </div>
  </div>
</section>
<section class="cu-v" data-v="org" hidden>
  <div class="cu-ev"><b>Noche de Salsa</b><span id="cu-ev-f"></span></div>
  <div class="cu-stats"><div><b id="cu-n-reg">0</b><small>registrados</small></div><div><b id="cu-n-in">0</b><small>llegaron</small></div><div><b id="cu-n-cov">$0</b><small>cover cobrado</small></div></div>
  <div class="cu-scan"><div class="cu-visor" aria-hidden="true"></div><p>Apunta la cámara al QR de la entrada. Aquí, toca cuál escaneas:</p><div class="cu-scan-b" id="cu-scan-b"></div></div>
  <div id="cu-res" aria-live="polite"></div>
  <p class="cu-sec">Registrados</p>
  <div class="cu-lista" id="cu-lista"></div>
</section>`,
  js: `
(()=>{
const $=s=>document.querySelector(s),dm=$('#dm'),QRS=${JSON.stringify(QRS)};
const e=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const AL='ABCDEFGHJKMNPQRSTUVWXYZ23456789',folio=()=>Array.from({length:5},()=>AL[Math.floor(Math.random()*AL.length)]).join('');
const d=new Date();d.setDate(d.getDate()+((6-d.getDay()+7)%7||7));
const larga=new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'}).format(d);
$('#cu-mes').textContent=new Intl.DateTimeFormat('es-MX',{month:'short'}).format(d).replace('.','').toUpperCase();$('#cu-dia').textContent=d.getDate();
$('#cu-fecha').textContent=larga[0].toUpperCase()+larga.slice(1);$('#cu-ev-f').textContent=new Intl.DateTimeFormat('es-MX',{weekday:'short',day:'numeric',month:'short'}).format(d)+' · 21:00';
const CAP=30,COVER=150,MAX=2;
const OTROS=[['Andrea Villaseñor',1,1],['Luis Ortega',1,1],['Fernanda Ríos',0,0],['Miguel Ángel Soto',0,0],['Daniela Partida',0,0],['Ricardo Lomelí',0,0],['Karla Estrada',0,0],['Iván Corona',0,0]]
  .map(([n,dentro,pago],i)=>({n,f:folio(),dentro:dentro?'21:'+String(5+i*4).padStart(2,'0'):'',pago:!!pago}));
const resto=17;let mias=[],nuevos=0;
const ocupados=()=>OTROS.length+resto+mias.length;
const quedan=()=>{const l=CAP-ocupados();$('#cu-quedan').textContent=l===1?'Queda 1 lugar':'Quedan '+l+' lugares'};quedan();
const ac=$('#cu-acomp');
const pintaA=()=>{[...ac.children].forEach((c,i)=>c.querySelector('span').textContent='Acompañante '+(i+1));$('#cu-mas').hidden=ac.children.length>=MAX};
const err=m=>{const x=$('#cu-err');x.textContent=m;x.hidden=!m};
const ver=v=>{document.querySelectorAll('[role=tab]').forEach(x=>x.setAttribute('aria-selected',x.dataset.v===v));document.querySelectorAll('.cu-v').forEach(x=>x.hidden=x.dataset.v!==v);if(v==='org'){pintarOrg();$('.cu-top i').classList.remove('si')}scrollTo(0,0)};
let pase=0;
const verPase=i=>{pase=i;const g=mias[i],[t,p]=QRS[i];const q=$('#cu-qr');q.setAttribute('viewBox','0 0 '+t+' '+t);q.innerHTML='<rect width="'+t+'" height="'+t+'" fill="#fff"/><path d="'+p+'" fill="#141114"/>';
  $('#cu-pn').textContent=g.n;$('#cu-pf').textContent=g.f;document.querySelectorAll('#cu-chips button').forEach((b,k)=>b.setAttribute('aria-pressed',k===i))};
const registrar=()=>{const n=$('#cu-nom').value.trim(),m=$('#cu-mail').value.trim(),nip=$('#cu-nip').value.trim(),acs=[...ac.querySelectorAll('input')].map(i=>i.value.trim());
  if(n.length<2){$('#cu-nom').focus();return err('Escribe tu nombre.')}
  if(m&&!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(m)){$('#cu-mail').focus();return err('Escribe un correo válido.')}
  if(nip&&!/^[0-9]{4}$/.test(nip)){$('#cu-nip').focus();return err('Tu NIP son 4 números.')}
  for(let k=0;k<acs.length;k++)if(acs[k].length<2){ac.querySelectorAll('input')[k].focus();return err('Escribe el nombre de cada acompañante (o quítalo).')}
  if(!$('#cu-priv').checked)return err('Acepta el aviso de privacidad para apartar tu lugar.');
  err('');mias=[n,...acs].map((x,i)=>({n:x,f:folio(),dentro:'',pago:false,nuevo:1,va:i?n:''}));nuevos=mias.length;
  $('#cu-form').hidden=true;$('#cu-listo').hidden=false;quedan();
  $('#cu-listo-t').textContent=mias.length>1?'Cada quien tiene su propio QR: '+mias.length+' entradas.':'Muestra este código en la entrada.';
  $('#cu-chips').innerHTML=mias.length>1?mias.map((g,i)=>'<button type="button" aria-pressed="false" data-p="'+i+'">'+e(g.n.split(' ')[0])+'</button>').join(''):'';
  verPase(0);const b=$('.cu-top i');b.textContent=mias.length;b.classList.add('si');$('#cu-reg').scrollIntoView({block:'start'})};
const todos=()=>[...mias,...OTROS];
const pintarOrg=()=>{const t=todos(),dentro=t.filter(g=>g.dentro),cob=t.filter(g=>g.pago&&g.dentro).length;
  $('#cu-n-reg').textContent=ocupados()+'/'+CAP;$('#cu-n-in').textContent=dentro.length;$('#cu-n-cov').textContent='$'+(cob*COVER).toLocaleString('es-MX');
  const sc=[...mias.map((g,i)=>[i,'Escanear la entrada de '+g.n]),...(mias.length?[]:[[-1,'Primero aparta tu lugar como invitado']])];
  const usado=OTROS.findIndex(g=>g.dentro);
  $('#cu-scan-b').innerHTML=sc.map(([i,t])=>'<button type="button" data-scan="'+i+'"'+(i<0?' disabled':'')+'>'+e(t)+'</button>').join('')+'<button type="button" data-scan="o'+usado+'">Escanear la entrada de '+e(OTROS[usado].n)+'</button>';
  $('#cu-lista').innerHTML=t.map((g,i)=>'<div class="cu-r'+(g.nuevo?' nuevo':'')+(g.dentro?' dentro':'')+'"><div class="x"><b>'+e(g.n)+(g.nuevo?'<span class="cu-tag">Nuevo</span>':'')+'</b><small>Folio '+g.f+(g.va?' · va con '+e(g.va.split(' ')[0]):'')+' · '+(g.dentro?'Ya entró '+g.dentro:g.pago?'Cover pagado':'Cover en la puerta')+'</small></div>'+(g.dentro?'<span class="cu-est">✓ Dentro</span>':'<button type="button" data-l="'+i+'">Dejar pasar</button>')+'</div>').join('')+'<p class="cu-mini">y '+resto+' registrados más</p>'};
let min=41;const hora=()=>{min+=2;return (21+Math.floor(min/60))+':'+String(min%60).padStart(2,'0')};   // la hora del evento, no la de quien prueba
let actual=null;
const resultado=g=>{actual=g;const r=$('#cu-res');
  if(g.dentro){r.innerHTML='<div class="cu-res repetido"><b>⚠️ Ya había entrado</b><h3>'+e(g.n)+'</h3><p>Folio '+g.f+' · Ya entró a las '+g.dentro+'</p><button type="button" class="borde" data-a="forzar">Dejar pasar de todos modos</button></div>'}
  else if(!g.pago){r.innerHTML='<div class="cu-res cobrar"><b>💵 Cobrar en la puerta</b><h3>'+e(g.n)+'</h3><p>Folio '+g.f+' · Cobra $'+COVER+' en la puerta</p><button type="button" data-a="cobrado">Ya cobré $'+COVER+' · dejar pasar</button></div>'}
  else pasa(g);
  r.scrollIntoView({block:'nearest'})};
const pasa=g=>{g.dentro=hora();pintarOrg();$('#cu-res').innerHTML='<div class="cu-res ok"><b>✅ Puede pasar</b><h3>'+e(g.n)+'</h3><p>Folio '+g.f+(g.pago?' · cover pagado':'')+'</p></div>';
  if(g.nuevo&&mias.every(x=>x.dentro))avisoDemo('Prueba escanear otra vez la misma entrada: no deja pasar dos veces.')};
dm.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;
  if(b.matches('[role=tab]'))ver(b.dataset.v);
  else if(b.id==='cu-mas'){const c=document.createElement('label');c.className='cu-campo';c.innerHTML='<span></span><div class="cu-fila"><input maxlength="60" autocomplete="off" placeholder="Su nombre"><button type="button" aria-label="Quitar acompañante" data-quitar="1">×</button></div>';ac.appendChild(c);pintaA();c.querySelector('input').focus()}
  else if(b.dataset.quitar){b.closest('.cu-campo').remove();pintaA()}
  else if(b.id==='cu-ok')registrar();
  else if(b.dataset.p)verPase(+b.dataset.p);
  else if(b.id==='cu-wa')avisoDemo('Se abre WhatsApp con: «Mi entrada para Noche de Salsa en la Azotea ('+larga+', 21:00)» y la liga de tu QR.');
  else if(b.id==='cu-ir')ver('org');
  else if(b.dataset.scan){const s=b.dataset.scan;resultado(s[0]==='o'?OTROS[+s.slice(1)]:mias[+s])}
  else if(b.dataset.l)resultado(todos()[+b.dataset.l]);
  else if(b.dataset.a==='cobrado'&&actual){actual.pago=true;pasa(actual)}
  else if(b.dataset.a==='forzar'&&actual){$('#cu-res').innerHTML='<div class="cu-res ok"><b>✅ Puede pasar</b><h3>'+e(actual.n)+'</h3><p>Lo dejaste pasar de nuevo: queda anotado.</p></div>'}
});
})();`,
};
