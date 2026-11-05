// Demo de Portal: el portal de una inmobiliaria ficticia (Casa Alta, Querétaro) como lo ve un cliente: comprar o rentar,
// filtrar por recámaras y precio, lista o mapa con precios, ficha con galería, precio por m², amenidades y ubicación, y el
// botón «Me interesa» con el mensaje de WhatsApp ya armado. Solo lo que dice la página de venta (/tienda/portales/).
// Las «fotos» son ilustraciones hechas con CSS: nada se descarga de internet. Propiedades y precios de ejemplo.
export default {
  titulo: 'Busca casa como lo haría tu cliente.',
  texto: 'Es el portal de una inmobiliaria de ejemplo: filtra, abre una ficha y toca «Me interesa» para ver el mensaje que te llegaría por WhatsApp.',
  prueba: ['Filtrar por compra o renta, recámaras y precio', 'Ver las propiedades en lista o en el mapa con sus precios', 'Abrir una ficha con galería y mandar «Me interesa» por WhatsApp'],
  cta: 'Quiero mi portal · desde $199 al mes',
  css: `
.po{--po:#1F4E79;--po-s:#EAF1F8;background:#fff}
.po [hidden]{display:none!important}
.po-nav{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #EEF0F3;position:sticky;top:0;background:#fff;z-index:5}
.po-logo{width:38px;height:38px;border-radius:11px;background:var(--po);color:#fff;display:grid;place-items:center;font-weight:800;font-size:15px;letter-spacing:-.02em;flex:none}
.po-nav b{display:block;font-size:15.5px;line-height:1.15}.po-nav small{display:block;font-size:12px;color:#6b7480}
.po-wa{margin-left:auto;width:44px;height:44px;border-radius:50%;border:0;background:#E8F6EE;color:#14663b;display:grid;place-items:center;flex:none}.po-wa svg{width:20px;height:20px}
.po-hero{padding:16px 16px 4px}.po-hero small{font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--po)}.po-hero h2{margin:4px 0 0;font-size:23px;line-height:1.1;letter-spacing:-.03em}
.po-filtros{padding:12px 16px 4px;display:grid;gap:10px}
.po-seg{display:grid;grid-template-columns:1fr 1fr;background:#F1F3F6;border-radius:14px;padding:4px}
.po-seg button{min-height:42px;border:0;border-radius:11px;background:transparent;font-weight:700;font-size:15px;color:#5b6470}
.po-seg button[aria-pressed=true]{background:#fff;color:#141820;box-shadow:0 2px 8px -3px rgba(0,0,0,.25)}
.po-fila{display:flex;gap:8px;align-items:center}
.po-lbl{font-size:12.5px;font-weight:700;color:#5b6470;min-width:74px}
.po-chips{display:flex;gap:6px;flex-wrap:wrap}
.po-chips button{min-height:38px;min-width:44px;padding:0 12px;border-radius:999px;border:1.5px solid #E1E5EA;background:#fff;font-weight:650;font-size:13.5px}
.po-chips button[aria-pressed=true]{background:var(--po);border-color:var(--po);color:#fff}
.po-sel{flex:1;min-height:42px;border-radius:12px;border:1.5px solid #E1E5EA;background:#fff;padding:0 10px;font-size:15px}
.po-res{display:flex;justify-content:space-between;align-items:center;padding:12px 16px 8px}.po-res b{font-size:14px}
.po-vista{display:flex;background:#F1F3F6;border-radius:999px;padding:3px}
.po-vista button{min-height:36px;padding:0 14px;border:0;border-radius:999px;background:transparent;font-weight:650;font-size:13px;color:#5b6470}
.po-vista button[aria-pressed=true]{background:#fff;color:#141820;box-shadow:0 1px 4px rgba(0,0,0,.15)}
.po-lista{display:grid;gap:14px;padding:4px 16px 20px}
.po-card{display:block;width:100%;text-align:left;padding:0;border:1px solid #E6E9ED;border-radius:18px;overflow:hidden;background:#fff}
.po-card .po-foto{height:150px}
.po-card div.t{padding:11px 13px 13px}
.po-card b.p{display:block;font-size:19px;letter-spacing:-.02em}.po-card .p small{font-size:13px;font-weight:600;color:#6b7480}
.po-card span.n{display:block;font-size:14.5px;font-weight:600;margin-top:2px}.po-card span.z{display:block;font-size:13px;color:#6b7480}
.po-ds{display:flex;gap:12px;margin-top:8px;font-size:13px;color:#3b4350;font-weight:600}
.po-et{position:absolute;top:10px;left:10px;z-index:2;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:999px;background:#fff;color:#141820}
.po-vacio{text-align:center;color:#6b7480;padding:26px 10px;font-size:14.5px}
.po-vacio button{margin-top:10px;min-height:42px;padding:0 16px;border-radius:999px;border:1.5px solid #E1E5EA;background:#fff;font-weight:650}
.po-mapa{position:relative;height:420px;margin:4px 16px 20px;border-radius:18px;overflow:hidden;background:#E9EEF1;background-image:linear-gradient(90deg,rgba(255,255,255,.75) 2px,transparent 2px),linear-gradient(rgba(255,255,255,.75) 2px,transparent 2px);background-size:46px 46px}
.po-mapa::before{content:"";position:absolute;left:-10%;top:52%;width:120%;height:14px;background:#FFE7A8;transform:rotate(-14deg);box-shadow:0 0 0 2px #fff}
.po-mapa::after{content:"";position:absolute;right:8%;top:6%;width:30%;height:26%;border-radius:40% 50% 45% 55%;background:#CFE6CF}
.po-pin{position:absolute;z-index:2;transform:translate(-50%,-50%);min-height:32px;padding:0 10px;border-radius:999px;border:2px solid #fff;background:var(--po);color:#fff;font-weight:800;font-size:12.5px;box-shadow:0 6px 14px -6px rgba(0,0,0,.55);white-space:nowrap}
.po-zona{position:absolute;z-index:1;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7b8794}
/* fotos ilustradas */
.po-foto{position:relative;overflow:hidden;background:linear-gradient(180deg,var(--cielo,#BFDDF2),#EAF4FB 70%)}
.po-foto i{position:absolute;display:block}
.po-foto .sol{width:34px;height:34px;border-radius:50%;background:#FFE29A;right:14%;top:12%}
.po-foto .piso{left:0;right:0;bottom:0;height:20%;background:#9CC59A}
.po-foto .arbol{width:46px;height:46px;border-radius:50%;background:#6FA56C;left:6%;bottom:16%;box-shadow:16px 10px 0 -6px #5E955B}
.po-foto .cuerpo{left:24%;right:22%;bottom:18%;height:44%;background:var(--muro,#F3EDE4);box-shadow:inset 0 -6px 0 rgba(0,0,0,.06)}
.po-foto .techo{left:20%;right:18%;bottom:61%;height:24%;background:var(--techo,#8B5E3C);clip-path:polygon(8% 100%,50% 0,92% 100%)}
.po-foto .puerta{left:46%;width:9%;bottom:18%;height:24%;background:var(--acento,#5B3A26);border-radius:4px 4px 0 0}
.po-foto .ven{width:13%;height:14%;bottom:30%;background:#CFE7F7;box-shadow:inset 0 0 0 3px #fff}.po-foto .v1{left:29%}.po-foto .v2{left:61%}
.po-foto .torre{left:30%;right:28%;bottom:18%;top:12%;background:repeating-linear-gradient(90deg,var(--muro,#E8ECEF) 0 7px,transparent 7px 22px),repeating-linear-gradient(0deg,var(--muro,#E8ECEF) 0 6px,#8FB3D1 6px 18px);box-shadow:inset 0 0 0 4px var(--muro,#E8ECEF)}
.po-foto .torre2{left:8%;width:20%;bottom:18%;top:38%;background:#CED6DD repeating-linear-gradient(0deg,transparent 0 9px,rgba(70,110,150,.4) 9px 18px)}
.po-foto.int{background:var(--muro,#F1E9DF)}
.po-foto.int .suelo{left:0;right:0;bottom:0;height:28%;background:var(--suelo,#C9A57E) repeating-linear-gradient(90deg,transparent 0 38px,rgba(0,0,0,.06) 38px 40px)}
.po-foto.int .vent{left:12%;top:14%;width:30%;height:40%;background:linear-gradient(180deg,#BFDDF2,#EAF4FB);box-shadow:inset 0 0 0 4px #fff;border-radius:3px}
.po-foto.int .sofa{left:38%;right:8%;bottom:20%;height:24%;background:var(--acento,#4C6A8A);border-radius:14px 14px 6px 6px}
.po-foto.int .cojin{left:44%;bottom:34%;width:14%;height:13%;background:#F6C76B;border-radius:8px}
.po-foto.int .lampara{right:12%;top:12%;width:20px;height:44%;background:linear-gradient(#2C2C2C,#2C2C2C) center/2px 100% no-repeat}
.po-foto.int .lampara::before{content:"";position:absolute;top:0;left:-10px;width:40px;height:22px;background:#F8E3B5;clip-path:polygon(20% 0,80% 0,100% 100%,0 100%)}
.po-foto.int .planta{left:5%;bottom:24%;width:30px;height:46px;background:radial-gradient(circle at 50% 30%,#6FA56C 0 40%,transparent 41%),linear-gradient(#B07A4E,#B07A4E) bottom/70% 34% no-repeat;border-radius:4px}
.po-foto.int .cama{left:22%;right:22%;bottom:16%;height:24%;background:#fff;border-radius:8px;box-shadow:inset 0 -10px 0 var(--acento,#9BB7D4)}
.po-foto.int .cabecera{left:20%;right:20%;bottom:36%;height:22%;background:var(--techo,#8B6B4E);border-radius:10px 10px 0 0}
.po-foto.int .almo{bottom:37%;width:16%;height:9%;background:#F7F4EF;border-radius:6px;box-shadow:0 1px 0 rgba(0,0,0,.08)}.po-foto.int .a1{left:30%}.po-foto.int .a2{right:30%}
.po-foto.int .cuadro{left:40%;top:12%;width:20%;height:18%;background:linear-gradient(135deg,#F6C76B,#E07A5F);box-shadow:0 0 0 4px #fff}
/* ficha */
.po-ficha{padding-bottom:84px}
.po-volver{display:flex;align-items:center;gap:6px;min-height:44px;margin:8px 10px 4px;padding:0 10px;border:0;background:transparent;font-weight:700;font-size:14.5px;color:var(--po)}
.po-gal{position:relative}
.po-gal .po-foto{height:230px}
.po-gal-b{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.92);font-size:20px;font-weight:700;box-shadow:0 4px 12px -4px rgba(0,0,0,.4)}
.po-gal-b.a{left:10px}.po-gal-b.s{right:10px}
.po-cont{position:absolute;right:10px;bottom:10px;z-index:3;background:rgba(20,24,32,.75);color:#fff;font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px}
.po-pie{position:absolute;left:10px;bottom:10px;z-index:3;background:rgba(255,255,255,.92);font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px}
.po-f-t{padding:14px 16px 0}
.po-f-t b.p{display:block;font-size:26px;letter-spacing:-.03em}.po-f-t .m2{font-size:13.5px;color:#6b7480;font-weight:600}
.po-f-t h3{margin:6px 0 2px;font-size:18px;letter-spacing:-.01em}.po-f-t .z{font-size:14px;color:#6b7480}
.po-datos{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:14px 16px 0}
.po-datos div{background:#F4F6F8;border-radius:12px;padding:9px 4px;text-align:center}.po-datos b{display:block;font-size:16px}.po-datos small{font-size:11.5px;color:#6b7480}
.po-h4{margin:18px 16px 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7b8794}
.po-amen{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px}.po-amen span{font-size:13px;font-weight:600;padding:6px 10px;border-radius:999px;background:var(--po-s);color:var(--po)}
.po-desc{margin:0 16px;font-size:14.5px;line-height:1.5;color:#3b4350}
.po-ubi{position:relative;height:120px;margin:0 16px;border-radius:14px;background:#E9EEF1;background-image:linear-gradient(90deg,rgba(255,255,255,.75) 2px,transparent 2px),linear-gradient(rgba(255,255,255,.75) 2px,transparent 2px);background-size:34px 34px}
.po-ubi span{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);background:var(--po);color:#fff;font-size:12px;font-weight:700;padding:5px 10px;border-radius:999px;white-space:nowrap}
.po-ubi span::after{content:"";position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:var(--po)}
.po-barra{position:sticky;bottom:0;z-index:4;display:flex;gap:10px;align-items:center;padding:12px 16px;background:rgba(255,255,255,.96);border-top:1px solid #EEF0F3;margin-top:22px}
.po-barra b{display:block;font-size:16px}.po-barra small{display:block;font-size:12px;color:#6b7480}
.po-int{margin-left:auto;min-height:50px;padding:0 20px;border-radius:999px;border:0;background:#25D366;color:#073b1d;font-weight:800;font-size:15.5px;display:inline-flex;align-items:center;gap:8px}.po-int svg{width:19px;height:19px}
.po-hoja{position:fixed;inset:0;z-index:40;background:rgba(10,14,20,.5);display:flex;align-items:flex-end;justify-content:center}
.po-hoja>div{width:100%;max-width:480px;background:#fff;border-radius:22px 22px 0 0;padding:18px 16px 20px}
.po-hoja h3{margin:0 0 4px;font-size:18px}.po-hoja p.s{margin:0 0 12px;font-size:14px;color:#5b6470}
.po-chat{border-radius:16px;background:#ECE5DD;padding:12px}
.po-chat-h{display:flex;align-items:center;gap:8px;margin:-12px -12px 10px;padding:10px 12px;border-radius:16px 16px 0 0;background:#075E54;color:#fff;font-size:14px;font-weight:700}
.po-chat-h i{width:28px;height:28px;border-radius:50%;background:var(--po);display:grid;place-items:center;font-style:normal;font-size:11px}
.po-burb{margin-left:auto;max-width:92%;background:#DCF8C6;border-radius:12px 4px 12px 12px;padding:9px 11px;font-size:14px;line-height:1.45;color:#111;word-wrap:break-word;overflow-wrap:anywhere}
.po-burb small{display:block;text-align:right;font-size:11px;color:#667;margin-top:4px}
.po-hoja .po-int{width:100%;justify-content:center;margin:14px 0 0}
.po-cerrar{width:100%;min-height:46px;margin-top:8px;border-radius:999px;border:1.5px solid #E1E5EA;background:#fff;font-weight:650}
`,
  html: `
<div class="po">
  <header class="po-nav"><span class="po-logo">CA</span><div><b>Casa Alta</b><small>Bienes raíces · Querétaro</small></div>
    <button class="po-wa" type="button" id="po-wa" aria-label="Escribir por WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg></button></header>
  <section id="po-cat">
    <div class="po-hero"><small>BIENES RAÍCES EN QUERÉTARO</small><h2>Encuentra tu próxima casa.</h2></div>
    <div class="po-filtros">
      <div class="po-seg" role="group" aria-label="Operación"><button type="button" aria-pressed="true" data-op="venta">Comprar</button><button type="button" aria-pressed="false" data-op="renta">Rentar</button></div>
      <div class="po-fila"><span class="po-lbl" id="po-rl">Recámaras</span><div class="po-chips" role="group" aria-labelledby="po-rl">${[0, 1, 2, 3].map(n => `<button type="button" aria-pressed="${n === 0}" data-rec="${n}">${n ? `${n}+` : 'Todas'}</button>`).join('')}</div></div>
      <div class="po-fila"><label class="po-lbl" for="po-max">Precio hasta</label><select class="po-sel" id="po-max"></select></div>
    </div>
    <div class="po-res"><b id="po-n"></b><div class="po-vista" role="group" aria-label="Ver como"><button type="button" aria-pressed="true" data-vista="lista">Lista</button><button type="button" aria-pressed="false" data-vista="mapa">Mapa</button></div></div>
    <div class="po-lista" id="po-lista"></div>
    <div class="po-mapa" id="po-mapa" hidden></div>
  </section>
  <section id="po-ficha" class="po-ficha" hidden></section>
  <div class="po-hoja" id="po-hoja" hidden role="dialog" aria-modal="true" aria-labelledby="po-hoja-t"><div>
    <h3 id="po-hoja-t">Tu mensaje ya va armado</h3><p class="s">Así le llega a la inmobiliaria, con la propiedad que te interesó:</p>
    <div class="po-chat"><div class="po-chat-h"><i>CA</i>Casa Alta · Bienes raíces</div><div class="po-burb" id="po-msj"></div></div>
    <button class="po-int" type="button" id="po-enviar">Enviar por WhatsApp</button>
    <button class="po-cerrar" type="button" id="po-cerrar">Cerrar</button>
  </div></div>
</div>`,
  js: `
(()=>{
const $=s=>document.querySelector(s),dm=$('#dm');
// [id, operación, tipo, zona, precio, rec, baños, m², estac., x, y, paleta, amenidades]
const P=[
 ['CA-104','venta','Casa','Juriquilla',4950000,3,3.5,220,2,30,26,0,['Jardín','Cocina integral','Cuarto de servicio','Vigilancia 24 h']],
 ['CA-117','venta','Departamento','Milenio III',2850000,2,2,92,1,62,40,1,['Alberca','Gimnasio','Elevador','Roof garden']],
 ['CA-121','venta','Casa','El Refugio',3690000,3,2.5,165,2,74,62,2,['Casa club','Áreas verdes','Estudio','Vigilancia 24 h']],
 ['CA-130','venta','Departamento','Centro Sur',6200000,3,3,145,2,44,70,3,['Terraza','Elevador','Gimnasio','Bodega']],
 ['CA-138','venta','Casa','Zibatá',7800000,4,4.5,310,3,82,18,4,['Vista al campo de golf','Jardín','Alberca','Vigilancia 24 h']],
 ['CA-142','venta','Loft','Centro Histórico',1980000,1,1,58,0,20,56,5,['Terraza común','Muy iluminado','Cerca de todo']],
 ['CA-209','renta','Departamento','Juriquilla',18500,2,2,98,2,28,30,1,['Alberca','Gimnasio','Mascotas permitidas']],
 ['CA-214','renta','Casa','Milenio III',24000,3,2.5,180,2,60,44,0,['Jardín','Cocina integral','Vigilancia 24 h']],
 ['CA-220','renta','Loft','Centro',12500,1,1,55,0,22,62,5,['Amueblado','Servicios incluidos']],
 ['CA-226','renta','Casa','Zibatá',38000,4,3.5,260,3,84,22,4,['Alberca','Casa club','Jardín']],
 ['CA-231','renta','Departamento','Álamos',14900,2,1,75,1,50,80,3,['Elevador','Seguridad','Cerca del centro']]
].map(([id,op,tipo,zona,precio,rec,ban,m2,est,x,y,pal,amen])=>({id,op,tipo,zona,precio,rec,ban,m2,est,x,y,pal,amen,nombre:tipo+' en '+zona}));
const PAL=[{'--muro':'#F3EDE4','--techo':'#8B5E3C','--acento':'#4C6A8A'},{'--muro':'#E6EBEF','--techo':'#5B6B7A','--acento':'#B5654A','--cielo':'#C9E1F0'},{'--muro':'#F6F1E7','--techo':'#A0522D','--acento':'#6C8A5C'},
 {'--muro':'#E9E4F0','--techo':'#4F4766','--acento':'#3E6E8E','--cielo':'#D6E6F2'},{'--muro':'#FBF7EF','--techo':'#2F3E46','--acento':'#C28B4B','--cielo':'#B5D8EE'},{'--muro':'#EFE6DA','--techo':'#7A4E2D','--acento':'#2E5E4E'}];
const st={op:'venta',rec:0,max:0,vista:'lista',foto:0,p:null};
const TOPES={venta:[[0,'Sin límite'],[3000000,'$3 millones'],[5000000,'$5 millones'],[8000000,'$8 millones']],renta:[[0,'Sin límite'],[15000,'$15 mil al mes'],[25000,'$25 mil al mes'],[40000,'$40 mil al mes']]};
const mx=n=>'$'+n.toLocaleString('es-MX');
const corto=p=>p.op==='venta'?'$'+(p.precio/1e6).toLocaleString('es-MX',{maximumFractionDigits:2})+' M':'$'+(p.precio/1000).toLocaleString('es-MX',{maximumFractionDigits:1})+' mil';
const precio=p=>mx(p.precio)+(p.op==='renta'?'<small> /mes</small>':'');
const estilo=p=>Object.entries(PAL[p.pal]).map(([k,v])=>k+':'+v).join(';');
const exterior=p=>p.tipo==='Casa'?'<i class="sol"></i><i class="arbol"></i><i class="techo"></i><i class="cuerpo"></i><i class="ven v1"></i><i class="ven v2"></i><i class="puerta"></i><i class="piso"></i>'
  :'<i class="sol"></i><i class="torre2"></i><i class="torre"></i><i class="arbol" style="left:auto;right:8%"></i><i class="piso"></i>';
const FOTOS=[['Fachada',p=>'<div class="po-foto" style="'+estilo(p)+'">'+exterior(p)+'</div>'],
 ['Sala',p=>'<div class="po-foto int" style="'+estilo(p)+'"><i class="vent"></i><i class="cuadro" style="left:52%"></i><i class="lampara"></i><i class="suelo"></i><i class="planta"></i><i class="sofa"></i><i class="cojin"></i></div>'],
 ['Recámara',p=>'<div class="po-foto int" style="'+estilo(p)+';--suelo:#D8BF9F"><i class="cuadro"></i><i class="suelo"></i><i class="cabecera"></i><i class="cama"></i><i class="almo a1"></i><i class="almo a2"></i><i class="planta" style="left:auto;right:6%"></i></div>']];
const filtradas=()=>P.filter(p=>p.op===st.op&&p.rec>=st.rec&&(!st.max||p.precio<=st.max));
const topes=()=>{$('#po-max').innerHTML=TOPES[st.op].map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join('');st.max=0};
const pintar=()=>{const l=filtradas();$('#po-n').textContent=l.length===1?'1 propiedad':l.length+' propiedades';
  $('#po-lista').hidden=st.vista!=='lista';$('#po-mapa').hidden=st.vista!=='mapa';
  const vacio='<div class="po-vacio">No hay propiedades con esos filtros.<br><button type="button" id="po-limpiar">Quitar filtros</button></div>';
  $('#po-lista').innerHTML=l.length?l.map(p=>'<button class="po-card" type="button" data-id="'+p.id+'"><div style="position:relative"><span class="po-et">'+(p.op==='venta'?'En venta':'En renta')+'</span>'+FOTOS[0][1](p)+'</div><div class="t"><b class="p">'+precio(p)+'</b><span class="n">'+p.nombre+'</span><span class="z">'+p.zona+', Querétaro</span><div class="po-ds"><span>'+p.rec+' rec.</span><span>'+p.ban+(p.ban===1?' baño':' baños')+'</span><span>'+p.m2+' m²</span></div></div></button>').join(''):vacio;
  $('#po-mapa').innerHTML=(l.length?'':vacio)+[['Juriquilla',14,12],['Zibatá',70,8],['Centro',12,46],['El Refugio',66,74],['Álamos',36,90]].map(([z,x,y])=>'<span class="po-zona" style="left:'+x+'%;top:'+y+'%">'+z+'</span>').join('')
    +l.map(p=>'<button class="po-pin" type="button" data-id="'+p.id+'" style="left:'+p.x+'%;top:'+p.y+'%" aria-label="'+p.nombre+', '+mx(p.precio)+'">'+corto(p)+'</button>').join('')};
const foto=()=>{const p=st.p;$('#po-gal-f').innerHTML=FOTOS[st.foto][1](p);$('#po-cont').textContent=(st.foto+1)+' / '+FOTOS.length;$('#po-pie').textContent=FOTOS[st.foto][0]};
const ficha=id=>{const p=P.find(x=>x.id===id);st.p=p;st.foto=0;
  $('#po-ficha').innerHTML='<button class="po-volver" type="button" id="po-volver">← Ver todas</button><div class="po-gal"><div id="po-gal-f"></div><button class="po-gal-b a" type="button" data-f="-1" aria-label="Foto anterior">‹</button><button class="po-gal-b s" type="button" data-f="1" aria-label="Foto siguiente">›</button><span class="po-pie" id="po-pie"></span><span class="po-cont" id="po-cont"></span></div>'
   +'<div class="po-f-t"><b class="p">'+precio(p)+'</b>'+(p.op==='venta'?'<span class="m2">'+mx(Math.round(p.precio/p.m2))+' por m²</span>':'<span class="m2">Renta mensual</span>')+'<h3>'+p.nombre+'</h3><span class="z">'+p.zona+', Querétaro · ID '+p.id+'</span></div>'
   +'<div class="po-datos"><div><b>'+p.rec+'</b><small>recámaras</small></div><div><b>'+p.ban+'</b><small>'+(p.ban===1?'baño':'baños')+'</small></div><div><b>'+p.m2+'</b><small>m²</small></div><div><b>'+p.est+'</b><small>estac.</small></div></div>'
   +'<p class="po-h4">Amenidades</p><div class="po-amen">'+p.amen.map(a=>'<span>'+a+'</span>').join('')+'</div>'
   +'<p class="po-h4">Descripción</p><p class="po-desc">'+p.nombre+' de '+p.m2+' m² con '+p.rec+(p.rec===1?' recámara':' recámaras')+' y '+p.ban+(p.ban===1?' baño. ':' baños. ')+(p.op==='venta'?'Lista para escriturar; aceptamos crédito bancario e Infonavit.':'Contrato por un año con depósito y aval o póliza jurídica.')+'</p>'
   +'<p class="po-h4">Ubicación</p><div class="po-ubi"><span>'+p.zona+'</span></div>'
   +'<div class="po-barra"><span><b>'+mx(p.precio)+(p.op==='renta'?' /mes':'')+'</b><small>'+p.id+' · Casa Alta</small></span><button class="po-int" type="button" id="po-me">Me interesa</button></div>';
  foto();$('#po-cat').hidden=true;$('#po-ficha').hidden=false;scrollTo(0,0)};
const mensaje=p=>'Hola, me interesa '+p.nombre+' ('+p.id+', '+mx(p.precio)+(p.op==='renta'?' al mes':'')+') que vi en su portal. ¿Sigue disponible? inmuebles.vorka.mx/casa-alta/'+p.id.toLowerCase();
dm.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.op){st.op=b.dataset.op;document.querySelectorAll('[data-op]').forEach(x=>x.setAttribute('aria-pressed',x===b));topes();pintar()}
  else if(b.dataset.rec){st.rec=+b.dataset.rec;document.querySelectorAll('[data-rec]').forEach(x=>x.setAttribute('aria-pressed',x===b));pintar()}
  else if(b.dataset.vista){st.vista=b.dataset.vista;document.querySelectorAll('[data-vista]').forEach(x=>x.setAttribute('aria-pressed',x===b));pintar()}
  else if(b.id==='po-limpiar'){st.rec=0;document.querySelectorAll('[data-rec]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.rec==='0'));topes();pintar()}
  else if(b.dataset.id)ficha(b.dataset.id);
  else if(b.dataset.f){st.foto=(st.foto+ +b.dataset.f+FOTOS.length)%FOTOS.length;foto()}
  else if(b.id==='po-volver'){$('#po-ficha').hidden=true;$('#po-cat').hidden=false;scrollTo(0,0)}
  else if(b.id==='po-me'){$('#po-msj').innerHTML=mensaje(st.p).replace(/</g,'&lt;')+'<small>'+new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})+'</small>';$('#po-hoja').hidden=false;$('#po-enviar').focus()}
  else if(b.id==='po-enviar'){$('#po-hoja').hidden=true;avisoDemo('En tu portal, aquí se abre WhatsApp con este mensaje listo para enviarse a tu número.')}
  else if(b.id==='po-cerrar'||b.id==='po-wa'){if(b.id==='po-wa')avisoDemo('Este botón abre WhatsApp con la inmobiliaria.');$('#po-hoja').hidden=true}
});
$('#po-hoja').addEventListener('click',e=>{if(e.target.id==='po-hoja')$('#po-hoja').hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#po-hoja').hidden=true});
$('#po-max').addEventListener('change',e=>{st.max=+e.target.value;pintar()});
topes();pintar();
})();`,
};
