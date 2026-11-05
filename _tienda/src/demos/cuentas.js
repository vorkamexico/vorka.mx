// Demo de Cuentas: registras un préstamo (persona, monto, cómo se paga e interés, con vista previa de los pagos), registras el
// primer abono viendo antes cuánto va a interés y cuánto a capital, y ves el saldo, el estado de cuenta y el recibo para la
// otra persona. Mismo motor que la app (interés simple por día sobre lo que falta; cuotas despejadas con los días reales).
// Personas y montos de ejemplo; nada se guarda.
export default {
  titulo: 'Registra un préstamo y su primer abono.',
  texto: 'Presta $20,000 a alguien de ejemplo, anota su primer pago y mira al instante cuánto fue a intereses, cuánto a capital y cuánto falta.',
  prueba: ['Elegir con o sin interés y ver de cuánto queda cada pago', 'Registrar un abono y ver antes de guardarlo cómo se aplica', 'Abrir el estado de cuenta y el recibo que le compartes'],
  cta: 'Quiero Cuentas · 7 días gratis',
  css: `
#dm{background:#f6f4f7}
.cu-app{--cu-bg:#f6f4f7;--cu-card:#fff;--cu-bg2:#f1edf3;--cu-bg3:#e8e2eb;--cu-fg:#17121a;--cu-fg2:#6b6370;--cu-fg3:#8f8794;--cu-line:#ece7ef;--cu-good:#2b8553;--cu-good-s:#e5f4eb;--cu-warn:#8a5d0e;--cu-warn-s:#fbf2e1;--cu-sh:0 1px 2px rgba(40,20,50,.04),0 8px 24px rgba(40,20,50,.06);
  background:var(--cu-bg);color:var(--cu-fg);font:15px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Inter,sans-serif;padding:0 16px 22px;min-height:620px}
:where(.cu-app) button{background:none;border:0;padding:0;cursor:pointer;color:inherit;font:inherit}
.cu-app .num,.cu-app .cu-m{font-variant-numeric:tabular-nums}
.cu-barra{display:flex;align-items:center;gap:10px;padding:14px 0 6px;font-weight:750;font-size:17px;letter-spacing:-.02em}
.cu-logo{width:32px;height:32px;border-radius:10px;background:var(--pm);color:#fff;display:grid;place-items:center}.cu-logo svg{width:17px;height:17px}
.cu-barra small{font-weight:550;color:var(--cu-fg3);font-size:12px;letter-spacing:0;margin-left:-4px}
.cu-p[hidden]{display:none}
.cu-tit{margin:12px 0 18px}.cu-tit h1{margin:0;font-size:27px;font-weight:780;letter-spacing:-.02em}.cu-tit p{margin:3px 0 0;color:var(--cu-fg2)}
.cu-volver{display:inline-flex;align-items:center;gap:4px;margin:6px 0 10px;min-height:40px;font-size:14px;font-weight:600;color:var(--cu-fg2)}
.cu-volver svg{width:16px;height:16px}
/* tarjeta de tinta con el saldo */
.cu-hero{position:relative;overflow:hidden;border-radius:26px;padding:20px 20px 18px;color:#fff;isolation:isolate;
  background:radial-gradient(70% 90% at 100% 0%,color-mix(in srgb,var(--pm) 55%,transparent) 0%,transparent 62%),linear-gradient(135deg,#17131a,#2a2430);box-shadow:0 14px 36px rgba(20,14,24,.22)}
.cu-hero::after{content:"";position:absolute;right:-36px;bottom:-60px;width:220px;height:220px;opacity:.12;z-index:-1;background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='69 225 940 909'%3E%3Cpath fill='%23fff' d='M69 226H311L652 877L526 1133Z'/%3E%3Cpath fill='%23fff' d='M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z'/%3E%3C/svg%3E")}
.cu-rot{font-size:14px;font-weight:600;color:rgba(255,255,255,.82);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cu-saldo{font-size:36px;font-weight:800;letter-spacing:-.045em;margin:4px 0 2px;line-height:1.1;font-variant-numeric:tabular-nums}
.cu-nota-h{font-size:13px;color:rgba(255,255,255,.75)}
.cu-datos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.16)}
.cu-datos span{display:block;font-size:12px;color:rgba(255,255,255,.7)}.cu-datos b{display:block;font-size:15.5px;margin-top:2px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.cu-quien{display:flex;align-items:center;gap:12px}.cu-quien h2{margin:0;font-size:18px;font-weight:700;letter-spacing:-.02em}.cu-quien small{display:block;font-size:12.5px;color:rgba(255,255,255,.75)}
.cu-av{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:750;font-size:14px;flex:none;background:var(--cu-bg3);color:var(--cu-fg2)}
.cu-hero .cu-av{background:rgba(255,255,255,.16);color:#fff}
.cu-chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:650;background:var(--cu-bg3);color:var(--cu-fg2);white-space:nowrap}
.cu-chip.bueno{background:var(--cu-good-s);color:var(--cu-good)}.cu-chip.nuevo{background:var(--pm-s);color:var(--pm)}
.cu-hero .cu-chip{background:rgba(255,255,255,.16);color:#fff}
.cu-avance{margin-top:16px}.cu-avance div{display:flex;gap:4px}.cu-avance i{flex:1;height:8px;border-radius:2px;background:rgba(255,255,255,.2);transform:skewX(-28deg);transition:background .4s}.cu-avance i.on{background:#fff}
.cu-avance p{display:flex;justify-content:space-between;gap:8px;margin:8px 0 0;font-size:12px;color:rgba(255,255,255,.78)}
/* acciones rápidas */
.cu-rapidas{display:flex;justify-content:space-around;gap:4px;padding:16px 0 4px}
.cu-rapida{width:86px;display:flex;flex-direction:column;align-items:center;gap:7px;font-size:12.5px;font-weight:600;text-align:center;line-height:1.2}
.cu-circ{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--cu-card);box-shadow:var(--cu-sh)}
.cu-circ svg{width:23px;height:23px}
.cu-rapida.pri .cu-circ{background:var(--pm);color:#fff}
/* bloques */
.cu-sec{display:flex;align-items:center;justify-content:space-between;margin:24px 0 10px}
.cu-sec h3{margin:0;font-size:17px;font-weight:750;letter-spacing:-.02em}
.cu-sec h3::before,.cu-leg::before{content:"";display:inline-block;width:4px;height:15px;background:var(--pm);transform:skewX(-28deg);border-radius:1px;margin-right:10px;vertical-align:-2px}
.cu-tarj{background:var(--cu-card);border-radius:22px;box-shadow:var(--cu-sh)}
.cu-pad{padding:18px}
.cu-fila{display:flex;align-items:center;gap:12px;padding:13px 16px;min-height:66px;width:100%;text-align:left}
.cu-fila+.cu-fila{border-top:1px solid var(--cu-line)}
.cu-fila .cu-cuerpo{flex:1;min-width:0}.cu-fila .t{display:block;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cu-fila .s{display:block;font-size:13px;color:var(--cu-fg2);margin-top:1px}
.cu-fila .cu-der{text-align:right;flex:none;font-weight:700;font-variant-numeric:tabular-nums}
.cu-icm{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--cu-bg3);color:var(--cu-fg2)}.cu-icm svg{width:18px;height:18px}
.cu-icm.abono{background:var(--cu-good-s);color:var(--cu-good)}
.cu-menos{color:var(--cu-good)}
.cu-par{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
.cu-mini{padding:14px 15px}.cu-mini span{display:block;font-size:12.5px;font-weight:600;color:var(--cu-fg2)}.cu-mini b{display:block;font-size:18px;font-weight:750;letter-spacing:-.02em;margin-top:3px;font-variant-numeric:tabular-nums}.cu-mini small{display:block;font-size:12px;color:var(--cu-fg3)}
.cu-pest{display:flex;gap:6px;margin:22px 0 12px;overflow-x:auto;scrollbar-width:none;padding:2px}
.cu-pest button{flex:none;padding:0 13px;min-height:40px;font-weight:650;font-size:13.5px;color:var(--cu-fg2);border-radius:999px;background:var(--cu-card);box-shadow:var(--cu-sh);white-space:nowrap}
.cu-pest button[aria-selected=true]{background:var(--cu-fg);color:#fff}
.cu-pista{font-size:12.5px;color:var(--cu-fg3);margin:10px 4px 0}
.cu-hecho{display:flex;gap:12px;align-items:flex-start;margin-top:14px;padding:14px 16px;border-radius:18px;background:var(--cu-good-s);color:#1d5c39;font-size:14px}
.cu-hecho b{color:#174a2e}.cu-hecho button{margin-top:6px;font-weight:700;color:#174a2e;text-decoration:underline;text-underline-offset:3px;min-height:32px}
/* formulario */
.cu-form fieldset{border:0;padding:0;margin:0 0 8px;min-width:0}
.cu-leg{font-weight:750;font-size:16.5px;margin:4px 0 12px;padding:0;letter-spacing:-.01em}
.cu-campo{display:block;margin-bottom:14px}.cu-campo>span{display:block;font-size:13px;font-weight:650;color:var(--cu-fg2);margin-bottom:6px}
.cu-app input,.cu-app select{width:100%;min-height:48px;padding:11px 14px;border-radius:14px;border:1.5px solid transparent;background:var(--cu-bg2);color:var(--cu-fg);font:inherit;font-size:16px;outline:none;-webkit-appearance:none;appearance:none}
.cu-app select{background-image:linear-gradient(45deg,transparent 50%,var(--cu-fg3) 50%),linear-gradient(135deg,var(--cu-fg3) 50%,transparent 50%);background-position:calc(100% - 20px) 21px,calc(100% - 15px) 21px;background-size:5px 5px;background-repeat:no-repeat;padding-right:36px}
.cu-app input:focus,.cu-app select:focus{border-color:var(--pm);background-color:#fff}
.cu-pre{position:relative}.cu-pre i{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--cu-fg3);font-style:normal;font-weight:600}.cu-pre input{padding-left:28px;font-weight:650;font-variant-numeric:tabular-nums}
.cu-suf{position:relative}.cu-suf i{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--cu-fg3);font-style:normal}
.cu-dos{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cu-ops{display:grid;gap:8px;margin-bottom:14px}.cu-ops.h{grid-template-columns:1fr 1fr}
.cu-op{display:flex;gap:10px;align-items:flex-start;padding:12px 13px;border:1.5px solid transparent;border-radius:16px;background:var(--cu-bg2);text-align:left;width:100%}
.cu-op b{display:block;font-weight:650}.cu-op small{display:block;color:var(--cu-fg2);font-size:12.5px;line-height:1.35}
.cu-op[aria-pressed=true]{border-color:var(--pm);background:#fff}
.cu-op .cu-r{width:18px;height:18px;border-radius:50%;border:2px solid var(--cu-fg3);flex:none;margin-top:2px}.cu-op[aria-pressed=true] .cu-r{border:5.5px solid var(--pm)}
.cu-guias{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 10px;scrollbar-width:none}
.cu-guia{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-start;padding:9px 13px;border-radius:16px;background:var(--cu-bg2);border:1.5px solid transparent;min-width:104px;text-align:left}
.cu-guia b{font-size:15.5px;font-variant-numeric:tabular-nums}.cu-guia span{font-size:11.5px;color:var(--cu-fg2)}
.cu-guia[aria-pressed=true]{border-color:var(--pm);background:#fff}
.cu-ayuda{font-size:12.5px;color:var(--cu-fg3);margin:6px 0 0}
.cu-nota{background:var(--cu-bg2);border-radius:16px;padding:12px 14px;font-size:13.5px;color:var(--cu-fg2);line-height:1.5;margin:0 0 14px}.cu-nota b{color:var(--cu-fg)}
.cu-previa{margin:4px 0 16px;padding:16px;border-radius:18px;background:var(--pm-s)}
.cu-et{display:block;font-size:12.5px;font-weight:650;color:var(--cu-fg2);margin-bottom:8px}
.cu-des{display:grid;grid-template-columns:auto 1fr;gap:7px 14px;font-size:14px}
.cu-des .cu-m{text-align:right;font-weight:600}.cu-des .sub{color:var(--cu-fg2)}
.cu-des .total{font-weight:750;border-top:1px solid var(--cu-line);padding-top:9px;margin-top:2px;font-size:15px}
.cu-previa .cu-des .total{border-color:color-mix(in srgb,var(--pm) 22%,transparent)}
.cu-explica{font-size:12.5px;color:var(--cu-fg2);margin:8px 0 0;padding-left:12px;border-left:3px solid var(--pm-s)}
.cu-previa .cu-explica{border-color:color-mix(in srgb,var(--pm) 30%,transparent)}
.cu-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:50px;padding:0 20px;border-radius:999px;font-weight:650;font-size:16px;background:var(--cu-bg3)}
.cu-btn.pri{background:var(--pm);color:#fff}.cu-btn.bloque{width:100%}.cu-btn.borde{background:transparent;box-shadow:inset 0 0 0 1.5px var(--cu-line)}
.cu-btn svg{width:18px;height:18px}
.cu-btn+.cu-btn{margin-top:8px}
/* tabla del plan y estado de cuenta */
.cu-tabla{overflow-x:auto;border-radius:22px}
.cu-tabla table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
.cu-tabla th{text-align:left;font-size:11.5px;font-weight:650;color:var(--cu-fg2);padding:12px 10px 8px;border-bottom:1px solid var(--cu-line);white-space:nowrap}
.cu-tabla td{padding:10px;border-bottom:1px solid var(--cu-line);white-space:nowrap}
.cu-tabla tr:last-child td{border-bottom:0}.cu-tabla .m{text-align:right}
.cu-tabla tr.pagada td{color:var(--cu-fg3)}
.cu-item{padding:15px 17px}.cu-item+.cu-item{border-top:1px solid var(--cu-line)}
.cu-item-t{display:flex;justify-content:space-between;gap:10px;font-weight:700}.cu-item .s{font-size:12.5px;color:var(--cu-fg3)}
/* hoja */
.cu-velo{position:fixed;inset:0;z-index:40;background:rgba(23,18,26,.5);display:flex;align-items:flex-end;justify-content:center;animation:cu-ap .16s ease-out}
.cu-hoja{width:100%;max-width:480px;max-height:92vh;overflow:auto;background:#fff;border-radius:26px 26px 0 0;padding:6px 18px 22px;animation:cu-sube .22s cubic-bezier(.2,.8,.2,1);overscroll-behavior:contain;color:var(--cu-fg)}
.cu-hoja::before{content:"";display:block;width:40px;height:5px;border-radius:3px;background:var(--cu-bg3);margin:6px auto 2px}
.cu-hoja-top{display:flex;align-items:center;justify-content:space-between;padding:8px 0 12px}.cu-hoja-top h2{margin:0;font-size:19px;font-weight:750;letter-spacing:-.02em}
.cu-x{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--cu-bg2);color:var(--cu-fg2)}.cu-x svg{width:18px;height:18px}
@keyframes cu-ap{from{opacity:0}}@keyframes cu-sube{from{transform:translateY(40px);opacity:.5}}
@media (prefers-reduced-motion:reduce){.cu-velo,.cu-hoja{animation:none}}
.cu-recibo{border-radius:22px;padding:18px;box-shadow:inset 0 0 0 1.5px var(--cu-line)}
.cu-recibo-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:12px;color:var(--cu-fg3)}
.cu-recibo-top span:first-child{display:flex;align-items:center;gap:8px;font-weight:750;font-size:15px;color:var(--cu-fg)}
.cu-recibo-top .cu-logo{width:26px;height:26px;border-radius:8px}.cu-recibo-top .cu-logo svg{width:14px;height:14px}
.cu-recibo-m{font-size:34px;font-weight:800;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.cu-msj{white-space:pre-wrap;background:#e7f6e0;border-radius:16px 16px 16px 4px;padding:12px 14px;font-size:14.5px;line-height:1.5;margin:0 0 14px}
`,
  html: `
<div class="cu-app">
  <div class="cu-barra"><span class="cu-logo"><svg viewBox="69 225 940 909" aria-hidden="true"><path fill="currentColor" d="M69 226H311L652 877L526 1133Z"/><path fill="currentColor" d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg></span>Cuentas <small>by Vorka</small></div>

  <section class="cu-p" data-p="inicio">
    <div class="cu-tit"><h1>Hola, Mariana</h1><p id="cu-fecha"></p></div>
    <div class="cu-hero">
      <div class="cu-rot">Por cobrar hoy</div>
      <div class="cu-saldo" id="cu-tot"></div>
      <div class="cu-nota-h" id="cu-tot-n"></div>
      <div class="cu-datos"><div><span>Capital</span><b id="cu-tot-c"></b></div><div><span>Intereses</span><b id="cu-tot-i"></b></div><div><span>Vencido</span><b>$0.00</b></div></div>
    </div>
    <div class="cu-rapidas">
      <button type="button" class="cu-rapida pri" data-ir="nuevo"><span class="cu-circ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span>Nuevo préstamo</button>
      <button type="button" class="cu-rapida" id="cu-mepagaron"><span class="cu-circ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg></span>Me pagaron</button>
    </div>
    <div class="cu-sec"><h3>Tus préstamos</h3></div>
    <div class="cu-tarj" id="cu-lista"></div>
  </section>

  <section class="cu-p" data-p="nuevo" hidden>
    <button type="button" class="cu-volver" data-ir="inicio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Inicio</button>
    <div class="cu-tit" style="margin-top:0"><h1>Nuevo préstamo</h1><p>Cuánto se entrega y bajo qué condiciones.</p></div>
    <div class="cu-tarj cu-pad cu-form">
      <fieldset><legend class="cu-leg">¿A quién?</legend>
        <label class="cu-campo"><span>Persona</span><select id="cu-per"><option>Carla Méndez</option><option>Tomás Rivera</option><option>Lucía Herrera</option></select></label>
        <label class="cu-campo"><span>Concepto (opcional)</span><input id="cu-con" maxlength="60" value="Enganche del coche"></label>
      </fieldset>
      <fieldset><legend class="cu-leg">¿Cuánto y cuándo?</legend>
        <div class="cu-dos"><label class="cu-campo"><span>Capital prestado</span><span class="cu-pre"><i>$</i><input id="cu-cap" inputmode="decimal" value="20,000"></span></label>
        <label class="cu-campo"><span>Fecha de entrega</span><input id="cu-ent" type="date"></label></div>
      </fieldset>
      <fieldset><legend class="cu-leg">¿Cómo se paga?</legend>
        <div class="cu-ops" role="group" aria-label="Cómo se paga">
          <button type="button" class="cu-op" data-tipo="cuotas" aria-pressed="true"><span class="cu-r"></span><span><b>Pagos programados</b><small>Cuotas iguales en fechas fijas.</small></span></button>
          <button type="button" class="cu-op" data-tipo="flexible" aria-pressed="false"><span class="cu-r"></span><span><b>Pagos flexibles</b><small>Abona cuando pueda. El interés corre sobre lo que falta.</small></span></button>
        </div>
        <label class="cu-campo" id="cu-n-c"><span>Número de pagos mensuales</span><select id="cu-n"><option>3</option><option selected>6</option><option>12</option></select></label>
      </fieldset>
      <fieldset><legend class="cu-leg">Interés</legend>
        <div class="cu-guias" role="group" aria-label="Tasas de referencia">
          <button type="button" class="cu-guia" data-tasa="0" aria-pressed="false"><b>0 %</b><span>Sin interés</span></button>
          <button type="button" class="cu-guia" data-tasa="3.45" aria-pressed="false"><b>3.45 %</b><span>Que no pierda valor</span></button>
          <button type="button" class="cu-guia" data-tasa="6.5" aria-pressed="false"><b>6.5 %</b><span>Como invertirlo</span></button>
          <button type="button" class="cu-guia" data-tasa="22" aria-pressed="true"><b>22 %</b><span>La mitad que un banco</span></button>
        </div>
        <label class="cu-campo"><span>Tasa anual (máximo 50 %)</span><span class="cu-suf"><input id="cu-tasa" inputmode="decimal" value="22"><i>%</i></span><small class="cu-ayuda" id="cu-mens"></small></label>
        <p class="cu-nota" id="cu-guia-t"></p>
      </fieldset>
      <div class="cu-previa" aria-live="polite"><span class="cu-et">Vista previa</span><div id="cu-prev"></div></div>
      <button type="button" class="cu-btn pri bloque" id="cu-crear">Crear préstamo</button>
    </div>
  </section>

  <section class="cu-p" data-p="prestamo" hidden>
    <button type="button" class="cu-volver" data-ir="inicio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Inicio</button>
    <div class="cu-hero">
      <div class="cu-quien"><span class="cu-av" id="cu-p-av"></span><div style="min-width:0"><h2 id="cu-p-nom"></h2><small id="cu-p-desc"></small></div></div>
      <div class="cu-rot" style="margin-top:20px">Para liquidar hoy <span class="cu-chip" id="cu-p-est"></span></div>
      <div class="cu-saldo" id="cu-p-saldo"></div>
      <div class="cu-avance"><div id="cu-p-bar"></div><p><span id="cu-p-cap"></span><span id="cu-p-de"></span></p></div>
    </div>
    <div class="cu-rapidas">
      <button type="button" class="cu-rapida pri" id="cu-abonar"><span class="cu-circ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg></span>Registrar abono</button>
      <button type="button" class="cu-rapida" data-pest="estado"><span class="cu-circ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg></span>Estado de cuenta</button>
      <button type="button" class="cu-rapida" id="cu-compartir"><span class="cu-circ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg></span>Compartir</button>
    </div>
    <div id="cu-hecho"></div>
    <div class="cu-par" id="cu-p-mini"></div>
    <div class="cu-pest" role="tablist" aria-label="Detalle del préstamo"></div>
    <div id="cu-cont"></div>
  </section>
</div>`,
  js: `
(()=>{
const dm=document.getElementById('dm'),$=s=>dm.querySelector(s),$$=s=>[...dm.querySelectorAll(s)];
const P=c=>'$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const D=s=>{const a=s.split('-').map(Number);return new Date(a[0],a[1]-1,a[2])};
const sumarMes=(s,n)=>{const d=D(s),x=new Date(d.getFullYear(),d.getMonth()+n,1),u=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();x.setDate(Math.min(d.getDate(),u));return iso(x)};
const dias=(a,b)=>Math.round((D(b)-D(a))/864e5);
const fL=s=>D(s).toLocaleDateString('es-MX',{day:'numeric',month:'long'});
const fC=s=>D(s).toLocaleDateString('es-MX',{day:'numeric',month:'short'}).replace('.','');
const HOY=iso(new Date());
const ic=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const IC={abajo:ic('<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>'),arriba:ic('<path d="M12 20V8M6 13l6-6 6 6M5 4h14"/>'),x:ic('<path d="M6 6l12 12M18 6 6 18"/>'),doc:ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),compartir:ic('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>')};
const ini=n=>n.split(' ').map(x=>x[0]).slice(0,2).join('');
const centavos=v=>Math.round((Number(String(v).replace(/[^\\d.]/g,''))||0)*100);
const tasaDe=v=>Math.min(50,Math.max(0,Number(String(v).replace(',','.'))||0));
// interés simple por día sobre lo que falta (base 365)
const simple=(cap,d,t)=>cap>0&&d>0&&t?Math.round(cap*t/100*d/365):0;
// cuotas iguales con los días reales de cada periodo (como la app)
function planificar(cap,desde,fechas,t){const r=t/100/365,f=[];let prev=desde;fechas.forEach(x=>{f.push(1+r*dias(prev,x));prev=x});
  const prod=i=>f.slice(i).reduce((a,b)=>a*b,1);let den=0;for(let k=1;k<=f.length;k++)den+=prod(k);
  const cuota=Math.round(cap*prod(0)/den),cuotas=[];let saldo=cap;prev=desde;
  fechas.forEach((x,k)=>{const int=simple(saldo,dias(prev,x),t);let c=Math.max(0,cuota-int);if(k===fechas.length-1||c>=saldo)c=saldo;cuotas.push({n:k+1,fecha:x,monto:c+int,capital:c,interes:int});saldo-=c;prev=x});
  return{cuotas,cuota}}
// estado de cuenta a una fecha: cada abono va primero a interés y luego a capital
function estado(pr,corte,extra){const ms=pr.movs.concat(extra?[extra]:[]).filter(m=>m.fecha<=corte).sort((a,b)=>a.fecha<b.fecha?-1:a.fecha>b.fecha?1:(a.tipo==='entrega'?-1:1));
  let cap=0,int=0,prev=null,ab=0,aI=0,aC=0;const filas=[];
  ms.forEach(m=>{const d=prev?dias(prev,m.fecha):0,sobre=cap,dev=simple(cap,d,pr.t);int+=dev;prev=m.fecha;const f={m:m,dev:dev,d:d,sobre:sobre,desde:ms[filas.length-1]?ms[filas.length-1].fecha:m.fecha};
    if(m.tipo==='entrega')cap+=m.monto;else{const ai=Math.min(int,m.monto),ac=Math.min(cap,m.monto-ai);int-=ai;cap-=ac;ab+=m.monto;aI+=ai;aC+=ac;f.aI=ai;f.aC=ac;f.favor=m.monto-ai-ac}
    f.cap=cap;f.int=int;filas.push(f)});
  if(prev&&corte>prev)int+=simple(cap,dias(prev,corte),pr.t);
  return{filas:filas,cap:cap,int:int,liq:cap+int,ab:ab,aI:aI,aC:aC}}
const explica=(f,t)=>f.dev?'<div class="cu-explica">Interés '+fC(f.desde)+' → '+fC(f.m.fecha)+' ('+f.d+' días): '+P(f.sobre)+' × '+t.toLocaleString('es-MX')+' % × '+f.d+' ÷ 365 = <b>'+P(f.dev)+'</b></div>':'';
// préstamo que ya existía (sin interés)
const JORGE={nom:'Jorge Salas',desc:'Colegiatura · sin interés',saldo:350000};
let pr=null,pest='movimientos',ultimo=null;
$('#cu-fecha').textContent=D(HOY).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'}).replace(/^./,m=>m.toUpperCase());
$('#cu-ent').value=sumarMes(HOY,-1);$('#cu-ent').max=HOY;
const ir=p=>{$$('.cu-p').forEach(x=>x.hidden=x.dataset.p!==p);if(p==='inicio')pintarInicio();if(p==='nuevo')previa();if(p==='prestamo')pintarPrestamo();scrollTo(0,0)};
// ---------- inicio ----------
function pintarInicio(){const e=pr?estado(pr,HOY):null,cap=JORGE.saldo+(e?e.cap:0),int=e?e.int:0;
  $('#cu-tot').textContent=P(cap+int);$('#cu-tot-c').textContent=P(cap);$('#cu-tot-i').textContent=P(int);
  $('#cu-tot-n').textContent='Capital más intereses ya generados · '+(pr?'2 préstamos activos':'1 préstamo activo');
  $('#cu-lista').innerHTML=(pr?'<button type="button" class="cu-fila" data-ir="prestamo"><span class="cu-av">'+ini(pr.nom)+'</span><span class="cu-cuerpo"><span class="t">'+esc(pr.nom)+'</span><span class="s">'+esc(pr.desc)+'</span></span><span class="cu-der">'+P(e.liq)+'<br><span class="cu-chip nuevo">Nuevo</span></span></button>':'')
   +'<div class="cu-fila"><span class="cu-av">JS</span><span class="cu-cuerpo"><span class="t">'+JORGE.nom+'</span><span class="s">'+JORGE.desc+'</span></span><span class="cu-der">'+P(JORGE.saldo)+'</span></div>'}
// ---------- nuevo préstamo ----------
const tipoSel=()=>$('.cu-op[aria-pressed=true]').dataset.tipo;
function guia(t){if(!t)return'<b>Sin interés:</b> solo se devuelve lo prestado. Ideal entre familia.';
  const s=' Interés <b>simple</b>, por día, sobre lo que falta por pagar. Nunca se suma al capital.';
  if(t<=3.45)return'<b>Cubre la inflación:</b> tu dinero no pierde valor, pero no ganas.'+s;
  if(t<=7)return'<b>Interés bajo:</b> cerca de lo que paga invertir sin riesgo.'+s;
  if(t<=22)return'<b>Interés moderado:</b> ganas algo y es mucho más barato que un banco o una tarjeta de crédito.'+s;
  return'<b>Interés alto para un préstamo entre conocidos</b>, aunque todavía más barato que un banco o una tarjeta.'+s}
function datos(){const cap=centavos($('#cu-cap').value),t=tasaDe($('#cu-tasa').value),tipo=tipoSel(),n=+$('#cu-n').value,ent=$('#cu-ent').value||sumarMes(HOY,-1);
  const fechas=[];for(let k=1;k<=n;k++)fechas.push(sumarMes(ent,k));
  return{cap:cap,t:t,tipo:tipo,n:n,ent:ent,plan:tipo==='cuotas'&&cap?planificar(cap,ent,fechas,t):null}}
function previa(){const d=datos();$('#cu-n-c').hidden=d.tipo!=='cuotas';
  $$('.cu-guia').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.tasa)===d.t));
  $('#cu-mens').textContent=d.t?'Equivale a '+(d.t/12).toLocaleString('es-MX',{maximumFractionDigits:4})+' % mensual (anual ÷ 12).':'Deja 0 si es sin interés.';
  $('#cu-guia-t').innerHTML=guia(d.t);
  if(!d.cap){$('#cu-prev').innerHTML='<p style="margin:0;color:var(--cu-fg2)">Escribe el capital para ver el resumen.</p>';$('#cu-crear').disabled=true;return}
  $('#cu-crear').disabled=false;
  const l=[['Capital',P(d.cap)],['Interés',d.t?d.t.toLocaleString('es-MX')+' % anual':'Sin interés']];
  if(d.t)l.push(['Interés por día hoy',P(Math.round(d.cap*d.t/100/365))]);
  if(d.plan){const c=d.plan.cuotas,tot=c.reduce((a,x)=>a+x.monto,0);l.push(['Pagos',c.length+' de '+P(d.plan.cuota)+' al mes'],['Primer pago',fL(c[0].fecha)],['Último pago',fL(c[c.length-1].fecha)]);if(d.t)l.push(['Intereses del plan',P(tot-d.cap)]);l.push(['Total a pagar',P(tot)])}
  $('#cu-prev').innerHTML='<div class="cu-des">'+l.map((x,i)=>{const tt=d.plan&&i===l.length-1;return'<span class="'+(tt?'total':'sub')+'">'+x[0]+'</span><span class="cu-m '+(tt?'total':'')+'">'+x[1]+'</span>'}).join('')+'</div>'
   +(d.tipo==='flexible'?'<p class="cu-ayuda" style="margin-top:10px">'+(d.t?'El interés se genera día a día sobre lo que falte. Cada abono lo baja desde la fecha en que llega.':'Verás siempre cuánto falta y cuánto se ha pagado.')+'</p>':'')}
function crear(){const d=datos();if(!d.cap)return;const nom=$('#cu-per').value,con=$('#cu-con').value.trim();
  pr={nom:nom,con:con,cap:d.cap,t:d.t,tipo:d.tipo,ent:d.ent,cuotas:d.plan?d.plan.cuotas:[],cuota:d.plan?d.plan.cuota:0,movs:[{id:1,tipo:'entrega',fecha:d.ent,monto:d.cap,forma:'Transferencia'}]};
  pr.desc=(con?con+' · ':'')+(d.tipo==='cuotas'?d.n+' pagos mensuales':'pagos flexibles')+(d.t?' · '+d.t.toLocaleString('es-MX')+' %':' · sin interés');
  pest='movimientos';ultimo=null;avisoDemo('Préstamo creado');ir('prestamo')}
// ---------- préstamo ----------
function proximo(e){if(!pr.cuotas.length)return null;let acum=0;for(const c of pr.cuotas){acum+=c.monto;if(e.ab<acum)return{fecha:c.fecha,monto:Math.min(c.monto,acum-e.ab)}}return null}
function pintarPrestamo(){const e=estado(pr,HOY),pag=Math.min(1,e.aC/pr.cap),nb=12,on=Math.round(pag*nb),px=proximo(e);
  const venc=pr.cuotas.length&&px&&px.fecha<HOY;
  $('#cu-p-av').textContent=ini(pr.nom);$('#cu-p-nom').textContent=pr.nom;$('#cu-p-desc').textContent=pr.desc;
  $('#cu-p-est').textContent=e.liq<=0?'Liquidado':venc?'Con atraso':'Al corriente';
  $('#cu-p-saldo').textContent=P(Math.max(0,e.liq));
  $('#cu-p-bar').innerHTML=Array.from({length:nb},(_,i)=>'<i class="'+(i<on?'on':'')+'"></i>').join('');
  $('#cu-p-bar').parentNode.setAttribute('aria-label','Capital pagado: '+Math.round(pag*100)+' %');
  $('#cu-p-cap').innerHTML='Pagado a capital: <b>'+P(e.aC)+'</b>';$('#cu-p-de').textContent='de '+P(pr.cap);
  $('#cu-p-mini').innerHTML=[['Capital',P(e.cap)],['Interés generado',P(e.int)],['Próximo pago',px?P(px.monto):'Sin fecha fija',px?fL(px.fecha):''],['Abonado',P(e.ab),P(e.aI)+' a intereses']]
    .map(x=>'<div class="cu-tarj cu-mini"><span>'+x[0]+'</span><b'+(x[1]==='Sin fecha fija'?' style="font-size:15px;color:var(--cu-fg2)"':'')+'>'+x[1]+'</b>'+(x[2]?'<small>'+x[2]+'</small>':'')+'</div>').join('');
  $('#cu-hecho').innerHTML=ultimo?'<div class="cu-hecho"><span>'+IC.abajo.replace('<svg','<svg width="22" height="22"')+'</span><div>Abono de <b>'+P(ultimo.m.monto)+'</b> registrado: <b>'+P(ultimo.aI)+'</b> a interés y <b>'+P(ultimo.aC)+'</b> a capital. Queda debiendo '+P(ultimo.cap+ultimo.int)+'.<br><button type="button" data-recibo="'+ultimo.m.id+'">Ver el recibo para '+esc(pr.nom.split(' ')[0])+'</button></div></div>':'';
  const ps=[['movimientos','Movimientos'],['estado','Estado de cuenta']].concat(pr.cuotas.length?[['plan','Plan de pagos']]:[]);
  $('.cu-pest').innerHTML=ps.map(x=>'<button type="button" role="tab" data-pest="'+x[0]+'" aria-selected="'+(pest===x[0])+'">'+x[1]+'</button>').join('');
  const c=$('#cu-cont');
  if(pest==='movimientos')c.innerHTML='<div class="cu-tarj">'+pr.movs.slice().reverse().map(m=>'<button type="button" class="cu-fila" data-mov="'+m.id+'"><span class="cu-icm '+m.tipo+'">'+(m.tipo==='abono'?IC.abajo:IC.arriba)+'</span><span class="cu-cuerpo"><span class="t">'+(m.tipo==='abono'?'Abono recibido':'Dinero prestado')+'</span><span class="s">'+m.forma+' · '+fL(m.fecha)+'</span></span><span class="cu-der '+(m.tipo==='abono'?'cu-menos':'')+'">'+(m.tipo==='abono'?'−':'+')+P(m.monto)+'</span></button>').join('')+'</div><p class="cu-pista">«+» aumenta lo que se debe; «−» lo disminuye. Toca un movimiento para ver cómo se aplicó.</p>';
  if(pest==='estado')c.innerHTML='<div class="cu-tarj">'+e.filas.slice().reverse().map(f=>'<div class="cu-item"><div class="cu-item-t"><span>'+(f.m.tipo==='abono'?'Abono recibido':'Dinero prestado')+'</span><span class="num">'+P(f.m.monto)+'</span></div><div class="s">'+fL(f.m.fecha)+' · '+f.m.forma+'</div>'
     +'<div class="cu-des" style="margin-top:8px;font-size:13px">'+(f.dev?'<span class="sub">Interés generado</span><span class="cu-m">'+P(f.dev)+'</span>':'')+(f.m.tipo==='abono'?'<span class="sub">A interés</span><span class="cu-m">'+P(f.aI)+'</span><span class="sub">A capital</span><span class="cu-m">'+P(f.aC)+'</span>':'')+'<span class="sub">Capital restante</span><span class="cu-m">'+P(f.cap)+'</span><span class="sub">Total adeudado</span><span class="cu-m"><b>'+P(f.cap+f.int)+'</b></span></div>'+explica(f,pr.t)+'</div>').join('')+'</div>'
     +'<div class="cu-tarj cu-pad" style="margin-top:12px"><span class="cu-et">Al '+fL(HOY)+'</span><div class="cu-des"><span class="sub">Capital</span><span class="cu-m">'+P(e.cap)+'</span><span class="sub">Interés devengado</span><span class="cu-m">'+P(e.int)+'</span><span class="total">Para liquidar</span><span class="cu-m total">'+P(Math.max(0,e.liq))+'</span></div></div>'
     +'<p class="cu-pista">Interés simple: saldo × tasa anual × días ÷ 365, redondeado al centavo en cada tramo. El interés no se suma al capital. En la app lo descargas en PDF o Excel.</p>';
  if(pest==='plan'){let acum=0;c.innerHTML='<div class="cu-tarj cu-tabla"><table><thead><tr><th>#</th><th>Fecha</th><th class="m">Cuota</th><th class="m">Capital</th><th class="m">Interés</th></tr></thead><tbody>'+pr.cuotas.map(q=>{acum+=q.monto;return'<tr class="'+(e.ab>=acum?'pagada':'')+'"><td>'+q.n+'</td><td>'+fC(q.fecha)+'</td><td class="m">'+P(q.monto)+'</td><td class="m">'+P(q.capital)+'</td><td class="m">'+P(q.interes)+'</td></tr>'}).join('')+'</tbody></table></div><p class="cu-pista">El interés de cada cuota es una proyección si se paga en cada fecha: se cobra el que se genere según la fecha real de cada pago.</p>'}}
// ---------- hojas ----------
let velo=null;
function hoja(tit,html){cerrar();velo=document.createElement('div');velo.className='cu-velo cu-app';velo.style.cssText='padding:0;min-height:0;background:rgba(23,18,26,.5)';
  velo.innerHTML='<div class="cu-hoja" role="dialog" aria-modal="true" aria-label="'+esc(tit)+'"><div class="cu-hoja-top"><h2>'+esc(tit)+'</h2><button type="button" class="cu-x" data-cerrar aria-label="Cerrar">'+IC.x+'</button></div>'+html+'</div>';
  dm.appendChild(velo);velo.addEventListener('click',e=>{if(e.target===velo||e.target.closest('[data-cerrar]'))cerrar()});setTimeout(()=>velo&&velo.querySelector('.cu-x').focus(),30);return velo}
function cerrar(){if(velo){velo.remove();velo=null}}
document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrar()});
function hojaAbono(){const e=estado(pr,HOY),px=proximo(e),sug=px?px.monto:Math.min(200000,Math.max(0,e.liq));
  const h=hoja('Registrar abono','<p style="margin:-4px 0 14px;color:var(--cu-fg2)">'+esc(pr.nom)+(pr.con?' · '+esc(pr.con):'')+'</p>'
    +'<div class="cu-dos"><label class="cu-campo"><span>Importe</span><span class="cu-pre"><i>$</i><input id="cu-a-m" inputmode="decimal" value="'+(sug/100).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})+'"></span></label>'
    +'<label class="cu-campo"><span>Fecha en que se hizo</span><input id="cu-a-f" type="date" value="'+HOY+'" min="'+pr.ent+'" max="'+HOY+'"></label></div>'
    +'<span class="cu-et">¿Cómo te lo dio?</span><div class="cu-ops h" role="group" aria-label="Forma de pago"><button type="button" class="cu-op" data-forma="Transferencia" aria-pressed="true"><span class="cu-r"></span><span><b>Transferencia</b></span></button><button type="button" class="cu-op" data-forma="Efectivo" aria-pressed="false"><span class="cu-r"></span><span><b>Efectivo</b></span></button></div>'
    +'<div class="cu-previa" aria-live="polite" id="cu-a-prev"></div><button type="button" class="cu-btn pri bloque" id="cu-a-ok">Registrar</button>');
  const prev=()=>{const f=h.querySelector('#cu-a-f').value||HOY,mm=centavos(h.querySelector('#cu-a-m').value);
    const el=h.querySelector('#cu-a-prev'),ok=h.querySelector('#cu-a-ok');ok.disabled=!mm;if(!mm){el.innerHTML='<p style="margin:0">Escribe el importe.</p>';return}
    const antes=estado(pr,f),des=estado(pr,f,{id:0,tipo:'abono',fecha:f,monto:mm,forma:''}),x=des.filas.find(z=>z.m.id===0);
    el.innerHTML='<span class="cu-et">Así se aplicará</span>'+(x.dev?'<p style="margin:0 0 4px;font-size:13.5px">Interés generado hasta ese día: '+P(x.dev)+'</p>'+explica(x,pr.t):'')
     +'<div class="cu-des" style="margin-top:10px"><span class="sub">A interés</span><span class="cu-m">'+P(x.aI)+'</span><span class="sub">A capital</span><span class="cu-m">'+P(x.aC)+'</span>'+(x.favor?'<span class="sub">Queda a su favor</span><span class="cu-m">'+P(x.favor)+'</span>':'')
     +'<span class="sub">Saldo antes</span><span class="cu-m">'+P(antes.liq)+'</span><span class="total">Saldo después</span><span class="cu-m total">'+P(Math.max(0,des.liq))+'</span></div>'};
  h.addEventListener('input',prev);h.addEventListener('change',prev);
  h.addEventListener('click',ev=>{const b=ev.target.closest('[data-forma]');if(b)h.querySelectorAll('[data-forma]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  h.querySelector('#cu-a-ok').onclick=()=>{const mm=centavos(h.querySelector('#cu-a-m').value);if(!mm)return;const id=pr.movs.length+1;
    pr.movs.push({id:id,tipo:'abono',fecha:h.querySelector('#cu-a-f').value||HOY,monto:mm,forma:h.querySelector('[data-forma][aria-pressed=true]').dataset.forma});
    ultimo=estado(pr,HOY).filas.find(z=>z.m.id===id);cerrar();pest='movimientos';avisoDemo('Movimiento registrado');pintarPrestamo();scrollTo(0,0)};
  prev()}
function hojaMov(id){const e=estado(pr,HOY),f=e.filas.find(z=>z.m.id===id);if(!f)return;const m=f.m;
  hoja(m.tipo==='abono'?'Abono recibido':'Dinero prestado','<div class="cu-des" style="margin-bottom:14px"><span class="sub">Fecha</span><span class="cu-m">'+fL(m.fecha)+'</span><span class="sub">Importe</span><span class="cu-m"><b>'+P(m.monto)+'</b></span><span class="sub">Forma</span><span class="cu-m">'+m.forma+'</span></div>'
    +(m.tipo==='abono'?'<div class="cu-previa"><span class="cu-et">Cómo se aplicó</span>'+(f.dev?'<p style="margin:0 0 4px;font-size:13.5px">Hasta ese día se generaron '+P(f.dev)+' de interés.</p>'+explica(f,pr.t):'')+'<div class="cu-des" style="margin-top:10px"><span class="sub">A interés</span><span class="cu-m">'+P(f.aI)+'</span><span class="sub">A capital</span><span class="cu-m">'+P(f.aC)+'</span><span class="total">Quedó debiendo</span><span class="cu-m total">'+P(f.cap+f.int)+'</span></div></div><button type="button" class="cu-btn pri bloque" data-recibo="'+id+'">'+IC.doc+'Recibo para '+esc(pr.nom.split(' ')[0])+'</button>'
     :'<p class="cu-nota" style="margin:0">Desde este día corre el interés pactado sobre lo que falte por pagar.</p>'))}
function hojaRecibo(id){const e=estado(pr,HOY),f=e.filas.find(z=>z.m.id===id);if(!f)return;
  hoja('Recibo','<div class="cu-recibo"><div class="cu-recibo-top"><span><span class="cu-logo">'+$('.cu-barra .cu-logo').innerHTML+'</span>Cuentas</span><span>Folio R-27-'+id+'</span></div>'
    +'<span class="cu-et" style="margin:0">Recibo de pago</span><div class="cu-recibo-m">'+P(f.m.monto)+'</div><p style="margin:4px 0 14px;font-size:13.5px;color:var(--cu-fg2)">Mariana recibió de <b style="color:var(--cu-fg)">'+esc(pr.nom)+'</b> el '+fL(f.m.fecha)+' · '+f.m.forma+(pr.con?' · '+esc(pr.con):'')+'</p>'
    +'<div class="cu-des"><span class="sub">A interés</span><span class="cu-m">'+P(f.aI)+'</span><span class="sub">A lo prestado (capital)</span><span class="cu-m">'+P(f.aC)+'</span><span class="total">Queda por pagar</span><span class="cu-m total">'+P(f.cap+f.int)+'</span></div>'
    +'<p class="cu-ayuda" style="margin-top:12px">Registro personal hecho con Cuentas (cuentas.vorka.mx). No es un comprobante fiscal ni bancario.</p></div>'
    +'<div style="margin-top:14px"><button type="button" class="cu-btn pri bloque" data-demo="El recibo se comparte como imagen o se descarga en PDF.">'+IC.compartir+'Compartir imagen</button></div>')}
function hojaCompartir(){const e=estado(pr,HOY),px=proximo(e),n1=pr.nom.split(' ')[0];
  const t='Hola '+n1+', te comparto cómo va el préstamo'+(pr.con?' ('+pr.con+')':'')+' al '+fL(HOY)+':\\n· Para liquidar hoy: '+P(Math.max(0,e.liq))+'\\n· Abonado hasta ahora: '+P(e.ab)+(px?'\\n· Próximo pago: '+P(px.monto)+' el '+fL(px.fecha):'');
  hoja('Compartir con '+n1,'<p class="cu-msj">'+esc(t)+'</p><p class="cu-nota">Además le puedes mandar un <b>enlace de solo lectura</b> con su estado de cuenta, y lo desactivas cuando quieras. Cuentas nunca le escribe ni le cobra.</p>'
    +'<button type="button" class="cu-btn pri bloque" data-demo="Se abre WhatsApp con este mensaje, listo para que tú lo mandes.">Mandar por WhatsApp</button><button type="button" class="cu-btn borde bloque" data-demo="Mensaje copiado (en la demo no se copia nada).">Copiar</button>')}
// ---------- eventos ----------
dm.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.ir)ir(b.dataset.ir);
  else if(b.dataset.tipo){$$('.cu-op[data-tipo]').forEach(x=>x.setAttribute('aria-pressed',x===b));previa()}
  else if(b.dataset.tasa){$('#cu-tasa').value=b.dataset.tasa;previa()}
  else if(b.id==='cu-crear')crear();
  else if(b.id==='cu-abonar')hojaAbono();
  else if(b.id==='cu-compartir')hojaCompartir();
  else if(b.id==='cu-mepagaron'){if(pr){ir('prestamo');hojaAbono()}else avisoDemo('Primero crea un préstamo con «Nuevo préstamo».')}
  else if(b.dataset.pest){pest=b.dataset.pest;pintarPrestamo();if(!b.closest('.cu-pest'))$('.cu-pest').scrollIntoView({behavior:'smooth',block:'start'})}
  else if(b.dataset.mov)hojaMov(+b.dataset.mov);
  else if(b.dataset.recibo)hojaRecibo(+b.dataset.recibo);
  else if(b.dataset.demo)avisoDemo(b.dataset.demo)});
$('.cu-form').addEventListener('input',previa);$('.cu-form').addEventListener('change',previa);
pintarInicio();
})();`,
};
