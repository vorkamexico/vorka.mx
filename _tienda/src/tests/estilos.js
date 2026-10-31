// Estilos de los tests (vocacional y proyecto social). Usan las variables del sitio (claro/oscuro sale solo de vorka.css).
// Celular primero: una columna, botones de 48 px o más, sin desbordes horizontales.
export const CSS_TESTS = `
.tv{--tv-acento:var(--morado,#6b2a85);--tv-oro:var(--oro,#c8a45c)}
.tv-hero{padding:clamp(88px,11vw,140px) 0 clamp(28px,5vw,56px);background:radial-gradient(60% 80% at 100% 0%,color-mix(in srgb,var(--tv-acento) 14%,transparent),transparent 70%)}
.tv-hero-g{display:grid;gap:28px;align-items:center}.tv-hero-g>*{min-width:0}@media(min-width:960px){.tv-hero-g{grid-template-columns:1.15fr .85fr}}
.tv-et{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tv-acento)}
.tv-h1{font-weight:800;font-size:clamp(36px,6vw,66px);line-height:1.02;letter-spacing:-.045em;margin:14px 0 0;text-wrap:balance}
.tv-h1 em{font-style:normal;color:var(--tv-acento)}
.tv-lead{margin:18px 0 0;font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:var(--fg-2);max-width:36em}
.tv-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.tv-chips{list-style:none;padding:0;margin:18px 0 0;display:flex;flex-wrap:wrap;gap:8px}.tv-chips li{padding:7px 13px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:14px;color:var(--fg-2)}
.tv-tarjeta{padding:22px;border-radius:24px;background:var(--card);border:1px solid var(--line);box-shadow:0 30px 60px -40px rgba(0,0,0,.35)}
.tv-sec{padding:clamp(44px,7vw,88px) 0}.tv-sec.suave{background:var(--bg-2)}
.tv-cab{max-width:720px;margin:0 0 26px}.tv-cab h2{font-weight:800;font-size:clamp(28px,4vw,44px);line-height:1.06;letter-spacing:-.04em;margin:8px 0 0;text-wrap:balance}
.tv-cab p{margin:12px 0 0;font-size:17px;line-height:1.55;color:var(--fg-2)}
.tv-tres{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.tv-tres li{padding:20px;border-radius:20px;background:var(--card);border:1px solid var(--line)}.tv-tres b{display:block;font-size:18px;margin-top:6px}.tv-tres p{margin:6px 0 0;color:var(--fg-2);line-height:1.5}
.tv-num{font-weight:800;font-size:13px;color:var(--tv-acento)}
.tv-nota{font-size:14px;color:var(--fg-2);line-height:1.55}.tv-nota a{color:inherit;text-decoration:underline;text-underline-offset:3px}
/* formulario del test */
.tv-form{display:grid;gap:14px;max-width:760px}
.tv-progreso{position:sticky;top:92px;z-index:5;display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:14px;font-weight:650}
.tv-barra{flex:1;height:8px;border-radius:99px;background:var(--bg-2);overflow:hidden}.tv-barra i{display:block;height:100%;width:0;background:var(--tv-acento);transition:width .3s}
.tv-parte{margin:18px 0 0;font-size:22px;font-weight:800;letter-spacing:-.02em}.tv-parte small{display:block;font-size:15px;font-weight:500;color:var(--fg-2);margin-top:4px;letter-spacing:0}
.tv-q{border:1px solid var(--line);border-radius:18px;padding:16px;margin:0;background:var(--card);min-width:0}
.tv-q.falta{border-color:#c0392b;box-shadow:0 0 0 3px rgba(192,57,43,.15)}
.tv-q legend{float:left;width:100%;padding:0;margin:0 0 12px;font-size:16.5px;font-weight:650;line-height:1.4;display:flex;gap:10px}
.tv-q legend .tv-n{flex:none;min-width:26px;height:26px;border-radius:50%;background:var(--bg-2);display:inline-grid;place-items:center;font-size:12.5px;font-weight:700;color:var(--fg-2)}
.tv-op{clear:both;display:flex;flex-wrap:wrap;gap:8px}
.tv-op label{flex:1 1 0;min-width:min(100%,92px);position:relative}.tv-op.lista label{flex:1 1 auto}
.tv-op input{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}
.tv-op span{display:flex;align-items:center;justify-content:center;text-align:center;min-height:48px;padding:8px 10px;border-radius:14px;border:1.5px solid var(--line);font-size:14.5px;font-weight:600;line-height:1.25;transition:background .15s,border-color .15s}
.tv-op input:checked+span{background:var(--tv-acento);border-color:var(--tv-acento);color:#fff}
.tv-op input:focus-visible+span{outline:3px solid var(--tv-oro);outline-offset:2px}
.tv-op.lista{flex-direction:column}.tv-op.lista span{justify-content:flex-start;text-align:left}
.tv-campo{display:grid;gap:6px}.tv-campo label{font-weight:650}.tv-campo select,.tv-campo input[type=text],.tv-campo input[type=email]{min-height:48px;padding:10px 14px;border-radius:14px;border:1.5px solid var(--line);background:var(--bg);color:var(--fg);font:inherit;width:100%}
.tv-error{padding:14px 16px;border-radius:14px;background:rgba(192,57,43,.1);color:#c0392b;font-weight:600}
.tv-ok{padding:14px 16px;border-radius:14px;background:rgba(46,139,87,.12);color:#2E8B57;font-weight:600}
.tv-enviar{justify-self:start}
/* resultado */
.tv-codigo{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 0}
.tv-tipo{flex:1 1 200px;padding:18px;border-radius:20px;background:var(--card);border:1px solid var(--line);border-top:5px solid var(--c)}
.tv-tipo>b{display:block;font-size:20px;letter-spacing:-.02em}.tv-tipo p b{color:var(--fg)}.tv-tipo small{color:var(--fg-2)}.tv-tipo p{margin:8px 0 0;line-height:1.5;color:var(--fg-2)}
.tv-pt{font-weight:800;font-size:28px;color:var(--c)}
.tv-barras{display:grid;gap:10px}.tv-b{display:grid;grid-template-columns:110px 1fr 40px;gap:10px;align-items:center;font-size:14.5px;font-weight:600}
.tv-b i{display:block;height:10px;border-radius:99px;background:var(--bg-2);overflow:hidden}.tv-b i span{display:block;height:100%;background:var(--c)}
.tv-carreras{list-style:none;padding:0;margin:0;display:grid;gap:10px;counter-reset:c}
.tv-carreras>li{counter-increment:c;padding:14px 16px 14px 54px;border-radius:16px;background:var(--card);border:1px solid var(--line);position:relative;line-height:1.45}
.tv-carreras>li::before{content:counter(c);position:absolute;left:14px;top:14px;width:28px;height:28px;border-radius:50%;background:var(--bg-2);display:grid;place-items:center;font-size:13px;font-weight:800}
.tv-carreras b{font-size:16.5px}.tv-af{float:right;font-weight:800;color:var(--tv-acento);margin-left:8px}
.tv-chip{display:inline-block;margin:6px 6px 0 0;padding:3px 10px;border-radius:999px;background:var(--bg-2);font-size:12.5px;font-weight:650;color:var(--fg-2)}
.tv-det{margin:8px 0 0;color:var(--fg-2);font-size:15px}.tv-det b{color:var(--fg);font-size:15px}
/* vista previa con candado */
.tv-candado{position:relative;border-radius:24px;border:1px solid var(--line);background:var(--card);padding:20px;overflow:hidden}
.tv-bloq{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:8px}
.tv-bloq li{height:46px;border-radius:14px;background:repeating-linear-gradient(90deg,var(--bg-2) 0 60%,transparent 60% 100%);filter:blur(3px);opacity:.9}
.tv-velo{position:relative;margin-top:-120px;padding:90px 0 0;background:linear-gradient(to bottom,transparent,var(--card) 55%);text-align:center}
.tv-velo svg{width:28px;height:28px;color:var(--tv-acento)}
.tv-candado .tv-et svg,.tv-candado h2 svg{width:1em;height:1em;vertical-align:-0.12em;display:inline-block;color:var(--tv-acento)}
.tv-incluye{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:6px;text-align:left}.tv-incluye li{display:flex;gap:8px;line-height:1.4}.tv-incluye li::before{content:"🔒";flex:none}
.tv-compra{display:grid;gap:12px;padding:20px;border-radius:24px;background:var(--card);border:2px solid var(--tv-acento);margin-top:16px}
.tv-precio{display:flex;align-items:baseline;flex-wrap:wrap;gap:10px}.tv-precio b{font-size:34px;font-weight:800;letter-spacing:-.03em}.tv-precio s{color:var(--fg-3,#8b8790);font-size:.55em;font-weight:600}
.tv-opcion{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:16px;border:1.5px solid var(--line);cursor:pointer}
.tv-opcion:has(input:checked){border-color:var(--tv-acento);background:color-mix(in srgb,var(--tv-acento) 7%,transparent)}
.tv-opcion input{margin-top:4px;width:20px;height:20px;flex:none}.tv-opcion b{display:block}.tv-opcion small{color:var(--fg-2);line-height:1.4;display:block;margin-top:2px}
.tv-ahorro{display:inline-block;padding:2px 8px;border-radius:999px;background:rgba(46,139,87,.14);color:#2E8B57;font-size:12.5px;font-weight:700}
.tv-casilla{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;line-height:1.45}.tv-casilla input{width:20px;height:20px;flex:none;margin-top:1px}
.tv-dos{display:grid;gap:24px;align-items:start}.tv-dos>*{min-width:0}@media(min-width:980px){.tv-dos{grid-template-columns:1.1fr .9fr}}
.tv-acciones{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.tv-acciones .btn,.tv .btn{white-space:normal;text-align:center;max-width:100%;height:auto}
.tv-mini{background:none;border:0;padding:0;color:var(--fg-2);text-decoration:underline;text-underline-offset:3px;font:inherit;font-size:14px;cursor:pointer}
/* licencias */
.tv-lic{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))}
.tv-lic form{display:grid;gap:10px;padding:20px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.tv-lic .dest{border:2px solid var(--tv-acento)}
.tv-lic h3{margin:0;font-size:20px}.tv-lic .tv-pp{font-size:30px;font-weight:800;letter-spacing:-.03em}
.tv-lic input[type=text],.tv-lic input[type=email]{min-height:46px;padding:8px 12px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--fg);font:inherit;width:100%}
/* reporte */
.tv-rep h2{font-weight:800;font-size:clamp(24px,3.4vw,34px);letter-spacing:-.03em;margin:0 0 14px}
.tv-rep section{padding:28px 0;border-top:1px solid var(--line)}
.tv-rep .tv-carreras>li{break-inside:avoid}
.tv-plan{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.tv-plan div{padding:18px;border-radius:18px;background:var(--card);border:1px solid var(--line);break-inside:avoid}.tv-plan b{display:block;margin-bottom:8px}
.tv-plan ul,.tv-rep ul.tv-l{margin:0;padding-left:20px;display:grid;gap:6px;line-height:1.45;list-style:disc}.tv-rep ol.tv-l{margin:0;padding-left:20px;display:grid;gap:6px;line-height:1.45;list-style:decimal}
.tv-sig{padding:20px;border-radius:22px;background:color-mix(in srgb,var(--tv-acento) 8%,var(--card));border:1px solid var(--line)}
.tv-idea{padding:20px;border-radius:22px;background:var(--card);border:1px solid var(--line);break-inside:avoid;margin:0 0 14px}
.tv-idea h3{margin:0;font-size:21px;letter-spacing:-.02em}.tv-idea h4{margin:14px 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-2)}
.tv-idea p{margin:6px 0 0;line-height:1.55}
.tv-ods{display:inline-flex;gap:6px;align-items:center;margin:4px 6px 0 0;padding:4px 10px;border-radius:999px;background:var(--bg-2);font-size:13px;font-weight:650}
.tv-ods b{color:var(--tv-acento);white-space:nowrap}
.tv-tabla{width:100%;border-collapse:collapse;font-size:14.5px}.tv-tabla th,.tv-tabla td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:top}
.tv-tabla-w{overflow-x:auto}
@media print{
  .nav,.menu-movil,footer,.pie,.t-wa,.saltar,.tv-no-imprimir{display:none!important}
  body{background:#fff!important;color:#000!important}.tv-hero{padding:0 0 12px;background:none}.tv-sec{padding:12px 0}
  .tv-tarjeta,.tv-tipo,.tv-carreras>li,.tv-idea,.tv-plan div{box-shadow:none}
  a{color:inherit}
}`;
