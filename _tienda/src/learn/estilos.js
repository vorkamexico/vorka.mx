// Vorka Learn · estilos. Capa sobre /assets/v3/vorka.css y /tienda/estilos.css (los tokens claro/oscuro del sitio).
// Cada sección pinta con var(--sec-a/--sec-b) (degradado), var(--sec-t) (texto de acento) y var(--sec-s) (fondo suave):
// la clase lr-s-<clave> en <body> o en una tarjeta los define (src/learn/secciones.js), así el diseño funciona igual
// para los exámenes, Finanzas personales o cualquier sección nueva.
import { cssSecciones } from './secciones.js';

export const cssLearn = () => `<style>
${cssSecciones()}
:root[data-app="learn"]{--lr-col:720px}
.lr-main{overflow-x:clip;padding-top:92px;padding-bottom:clamp(40px,7vw,96px);min-height:70vh}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
:focus-visible{outline:2.5px solid var(--sec-t);outline-offset:2px}

/* ---------- encabezado (la píldora de la tienda) ---------- */
.nav.t-navs.lr-navs .marca b{color:var(--morado);font-weight:750}
.nav.t-navs.lr-navs .menu-btn{display:inline-flex;flex:none;color:var(--fg)}
.nav.t-navs.lr-navs .nav-links{display:none}
@media (min-width:960px){.nav.t-navs.lr-navs .nav-links{display:flex;margin-right:auto}.nav.t-navs.lr-navs .marca{margin-right:14px}.nav.t-navs.lr-navs .t-nav-ico{margin-left:0}}
@media (max-width:959px){.nav.t-navs.lr-navs .lr-lupa{margin-left:auto}}
.nav.t-navs.lr-navs .lr-lupa[aria-current]{background:var(--bg-2);color:var(--fg)}
.nav.t-navs.lr-navs .lr-practica{display:inline-flex;gap:7px;margin-right:4px}.lr-practica svg{width:18px;height:18px}
@media (max-width:430px){.nav.t-navs.lr-navs .t-pastilla{display:inline-flex;min-height:40px;padding:0 14px;margin-left:2px}.lr-practica svg{display:none}.nav.t-navs.lr-navs .nav-in{gap:4px;padding-left:16px}}
@media (max-width:359px){.nav.t-navs.lr-navs .marca{font-size:15px;gap:7px}.nav.t-navs.lr-navs .marca svg{width:22px}.nav.t-navs.lr-navs .t-pastilla{padding:0 11px;font-size:13.5px}}

/* ---------- menú ---------- */
.menu-movil.lr-menu{padding:92px var(--x) calc(28px + env(safe-area-inset-bottom));gap:4px}
.menu-movil.lr-menu:focus{outline:0}
.menu-abierto .menu-movil.lr-menu{transition-property:opacity,transform}
.menu-movil.lr-menu a:not(.btn){font-size:inherit;font-weight:inherit;letter-spacing:normal;padding:0;border:0}
.lr-m-buscar,.lr-buscador{display:flex;align-items:center;gap:6px;padding:4px 4px 4px 18px;border-radius:999px;background:var(--card);border:1px solid var(--line-2);box-shadow:var(--sombra)}
.lr-m-buscar:focus-within,.lr-buscador:focus-within{border-color:var(--sec-t)}
.lr-m-buscar input,.lr-buscador input{flex:1;min-width:0;min-height:46px;border:0;background:transparent;color:var(--fg);font:inherit;font-size:16px;outline:0}
.lr-m-buscar input::placeholder,.lr-buscador input::placeholder{color:var(--fg-3)}
.lr-m-buscar button,.lr-buscador button{flex:none;display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:50%;background:var(--fg);color:var(--bg);cursor:pointer}
.lr-m-buscar svg,.lr-buscador button svg{width:20px;height:20px}
.lr-m-t{margin:18px 0 6px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-2)}
.lr-m-secs{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.menu-movil.lr-menu a.lr-m-sec,.lr-m-sec{display:flex;align-items:center;gap:12px;min-height:56px;padding:7px 12px;border-radius:16px;background:var(--sec-s);border:1.5px solid transparent;color:var(--fg);text-decoration:none}
.lr-m-sec[aria-current]{border-color:var(--sec-t)}
.lr-m-ico{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--sec-a),var(--sec-b));color:#fff}
.lr-m-ico svg{width:22px;height:22px}
.lr-m-txt b{display:block;font-size:16.5px;line-height:1.25;font-weight:700;letter-spacing:-.01em}.lr-m-txt small{font-size:13px;color:var(--fg-2)}
.lr-m-fl{margin-left:auto;font-size:24px;line-height:1;color:var(--sec-t)}
.menu-movil.lr-menu .lr-m-practica{margin-top:18px;white-space:normal;text-align:center;line-height:1.25;padding:12px 20px}
.lr-m-mas{list-style:none;padding:0;margin:12px 0 0}
.menu-movil.lr-menu .lr-m-mas a{display:flex;align-items:center;min-height:50px;font-size:17px;font-weight:650;color:var(--fg);text-decoration:none;border-bottom:1px solid var(--line)}
.menu-movil.lr-menu .lr-m-mas a[aria-current]{color:var(--sec-t)}
.lr-m-discreto{display:flex;gap:22px}
.menu-movil.lr-menu .lr-m-discreto a{font-size:14.5px;font-weight:500;color:var(--fg-2);border:0;min-height:46px}
.lr-m-tema{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;margin-top:6px;font-size:14px;color:var(--fg-2)}
.tema-sel{display:inline-flex;padding:3px;border-radius:999px;background:var(--bg-2);border:1px solid var(--line)}
.tema-sel button{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 11px;border:0;border-radius:999px;background:transparent;color:var(--fg-2);font:inherit;font-size:13.5px;cursor:pointer}
.tema-sel svg{width:16px;height:16px}.tema-sel button[aria-checked="true"]{background:var(--card);color:var(--fg);box-shadow:var(--sombra)}
@media (min-width:1081px){
  .menu-movil.lr-menu{display:flex;inset:84px max(12px,calc((100vw - 1180px) / 2)) auto auto;width:400px;max-height:calc(100vh - 100px);padding:18px;border-radius:24px;background:var(--card);border:1px solid var(--line);box-shadow:var(--sombra-2)}
}

/* ---------- piezas comunes ---------- */
.lr-col{max-width:var(--lr-col);margin:0 auto}.lr-col.lr-ancha{max-width:1080px}
.lr-migas{font-size:14px;color:var(--fg-2);margin:clamp(12px,3vw,32px) 0 0}.lr-migas ol{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:4px}
.lr-migas li:not(:last-child)::after{content:"›";margin-left:6px;color:var(--fg-3)}.lr-migas a{color:inherit;text-decoration:none}.lr-migas a:hover{color:var(--fg);text-decoration:underline}
.lr-kicker{display:inline-flex;align-items:center;gap:7px;margin-top:18px;padding:5px 12px 5px 8px;border-radius:999px;background:var(--sec-s);font-size:12.5px;font-weight:750;letter-spacing:.1em;text-transform:uppercase;color:var(--sec-t)}
.lr-kicker svg{width:17px;height:17px}
.lr-h1{font-size:clamp(31px,5vw,52px);line-height:1.08;letter-spacing:-.035em;font-weight:780;margin:12px 0 0;text-wrap:balance}
.lr-lead{font-size:clamp(18px,2.2vw,21px);line-height:1.55;color:var(--fg-2);margin:16px 0 0;text-wrap:pretty}
.lr-h2{font-size:clamp(24px,3vw,32px);letter-spacing:-.03em;line-height:1.15;margin:10px 0 0}
.lr-sobre{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-2);margin:0}
.lr-nota{margin-top:44px;font-size:14px;color:var(--fg-2);line-height:1.6}.lr-nota a{color:var(--sec-t)}
.lr-arte{display:block;width:100%;height:auto}
.lr-etq{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 7px;border-radius:999px;background:var(--sec-s);color:var(--sec-t);font-size:11.5px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}
.lr-etq svg{width:15px;height:15px}

/* tarjetas de guías: miniatura con el dibujo de la sección y etiqueta de color */
.gu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:18px;margin-top:20px}
.gu-card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;color:inherit;text-decoration:none;transition:transform var(--t-medio) var(--ease),box-shadow var(--t-medio),border-color var(--t-rapido)}
.gu-card:hover{transform:translateY(-3px);box-shadow:var(--sombra-2);border-color:var(--line-2)}
.gu-card-img{display:block;aspect-ratio:16/9;background:linear-gradient(135deg,var(--sec-a),var(--sec-b))}
.gu-card-img img{display:block;width:100%;height:100%;object-fit:cover;border-radius:0}
.gu-card-c{display:flex;flex-direction:column;gap:8px;padding:16px 18px 18px;flex:1}
.gu-card h3{font-size:18.5px;letter-spacing:-.02em;line-height:1.28;margin:2px 0 0}.gu-card:hover h3{color:var(--sec-t)}
.gu-card p{color:var(--fg-2);font-size:15px;line-height:1.55;margin:0}
.gu-card-min{margin-top:auto;padding-top:4px;font-size:13px;color:var(--fg-3);font-weight:600}
@media (max-width:600px){
  .gu-grid{gap:12px}
  .gu-card{flex-direction:row;align-items:stretch;border-radius:18px}
  .gu-card-img{flex:none;width:104px;aspect-ratio:auto}
  .gu-card-c{padding:13px 14px;gap:6px}
  .gu-card h3{font-size:16.5px}
  .gu-card p{font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
}
.gu-card em{display:none}

/* ---------- portada ---------- */
.lr-portada{position:relative;display:grid;gap:clamp(20px,4vw,48px);align-items:center;padding:clamp(8px,2vw,24px) 0 0}
.lr-portada::before{content:"";position:absolute;z-index:-1;inset:-120px -40vw auto;height:620px;background:radial-gradient(40% 50% at 78% 40%,var(--sec-s),transparent 70%),radial-gradient(30% 40% at 10% 10%,rgba(200,164,92,.12),transparent 70%)}
.lr-portada .lr-h1{font-size:clamp(34px,5.6vw,60px)}
.lr-portada .lr-h1 span{background:linear-gradient(100deg,#6B2A85,#C8A45C);-webkit-background-clip:text;background-clip:text;color:transparent}
:root[data-tema="oscuro"] .lr-portada .lr-h1 span{background-image:linear-gradient(100deg,#D6AAEC,#E6CF96)}
.lr-portada-arte{max-width:520px;width:100%;justify-self:center}
.lr-hero-arte{display:block;width:100%;height:auto}
.lr-portada .lr-buscador{margin-top:24px;max-width:540px}
.lr-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.lr-chip{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 14px 0 10px;border-radius:999px;background:var(--sec-s);color:var(--sec-t);font-size:14.5px;font-weight:700;text-decoration:none;border:1px solid transparent}
.lr-chip:hover{border-color:var(--sec-t)}.lr-chip svg{width:18px;height:18px}
@media (min-width:900px){.lr-portada{grid-template-columns:1.1fr .9fr}}
@media (max-width:899px){.lr-portada-arte{order:-1;max-width:330px;margin-top:-6px}}
.lr-confianza{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;margin-top:clamp(28px,5vw,48px)}
.lr-confianza div{display:flex;gap:12px;align-items:flex-start;padding:16px;border-radius:18px;background:var(--bg-2);font-size:14.5px;line-height:1.5;color:var(--fg-2)}
.lr-confianza b{display:block;color:var(--fg);font-size:15.5px;margin-bottom:2px}
.lr-confianza svg{flex:none;width:22px;height:22px;color:var(--morado);margin-top:1px}
.lr-grupo{margin-top:clamp(44px,7vw,80px)}
.lr-grupo-cab{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.lr-grupo-cab .lr-m-ico{width:48px;height:48px;border-radius:14px}
.lr-grupo-cab .lr-h2{margin:0}
.lr-grupo-cab a.lr-todas{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:15px;color:var(--sec-t);text-decoration:none}
.lr-grupo-cab a.lr-todas svg{width:16px;height:16px}
.lr-grupo p.lr-grupo-lead{color:var(--fg-2);margin:10px 0 0;font-size:16.5px;max-width:720px}
.lr-practica-sec{margin-top:clamp(52px,8vw,96px);padding:clamp(24px,4vw,44px);border-radius:28px;background:var(--noche);color:#F4F2F5;position:relative;overflow:hidden;isolation:isolate}
.lr-practica-sec::after{content:"";position:absolute;z-index:-1;right:12%;top:-20%;bottom:-20%;width:110px;background:rgba(200,164,92,.12);transform:skewX(-28deg)}
.lr-practica-sec .lr-h2{color:#fff}.lr-practica-sec .lr-oro{color:#E6CF96}.lr-practica-sec p{color:rgba(244,242,245,.72);margin:10px 0 0;max-width:620px}
.lr-sims{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;margin-top:22px}
.lr-sim{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;text-decoration:none;font-weight:700}
.lr-sim:hover{background:rgba(255,255,255,.1)}.lr-sim small{display:block;font-weight:500;font-size:13px;color:rgba(244,242,245,.65)}
.lr-sim .lr-m-fl{color:#E6CF96}

/* ---------- índice de sección ---------- */
.lr-banner{display:grid;gap:clamp(18px,3vw,36px);align-items:center;margin-top:18px;padding:clamp(20px,4vw,40px);border-radius:28px;background:var(--sec-s)}
.lr-banner .lr-kicker{margin-top:0;background:var(--card)}
.lr-banner-arte{border-radius:20px;overflow:hidden;box-shadow:var(--sombra-2)}
@media (max-width:859px){.lr-banner-arte{aspect-ratio:5/2}.lr-banner-arte svg{width:100%;height:100%}}
@media (min-width:860px){.lr-banner{grid-template-columns:1.2fr .8fr}}

/* ---------- guía ---------- */
.lr-guia-cab{margin-top:4px}
.lr-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:20px 0 0;font-size:14px;color:var(--fg-2)}
.lr-autor{display:inline-flex;align-items:center;gap:9px;color:var(--fg);font-weight:650}
.lr-autor i{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--noche);color:#fff}.lr-autor i svg{width:15px;height:15px}
.lr-meta .lr-dato{display:inline-flex;align-items:center;gap:6px}.lr-meta .lr-dato svg{width:16px;height:16px;color:var(--sec-t)}
.lr-portadilla{margin:24px 0 0;border-radius:22px;overflow:hidden;aspect-ratio:16/7;box-shadow:var(--sombra)}
.lr-portadilla svg{width:100%;height:100%;display:block}
@media (max-width:600px){.lr-portadilla{border-radius:18px;aspect-ratio:2/1;margin-top:20px}.lr-meta{gap:4px 12px}.lr-meta .lr-autor{flex-basis:100%;margin-bottom:4px}.lr-meta .lr-dato:last-child{display:none}}
.lr-toc{margin:24px 0 0;border-radius:18px;background:var(--sec-s);border:1px solid transparent}
.lr-toc[open]{border-color:var(--line)}
.lr-toc summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:12px;min-height:60px;padding:10px 18px 10px 12px;font-weight:700;font-size:16px;color:var(--fg);border-radius:18px}
.lr-toc summary::-webkit-details-marker{display:none}
.lr-toc-ico{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,var(--sec-a),var(--sec-b));color:#fff}.lr-toc-ico svg{width:20px;height:20px}
.lr-toc-n{font-weight:500;font-size:14px;color:var(--fg-2)}
.lr-toc-fl{margin-left:auto;flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--card);color:var(--sec-t);transition:transform var(--t-medio) var(--ease)}
.lr-toc-fl svg{width:18px;height:18px}.lr-toc[open] .lr-toc-fl{transform:rotate(180deg)}
.lr-toc ol{list-style:none;counter-reset:t;margin:0;padding:2px 18px 16px;display:grid;gap:2px;font-size:15.5px}
.lr-toc li{counter-increment:t}
.lr-toc a{display:flex;gap:12px;align-items:baseline;padding:8px 6px;border-radius:10px;color:var(--fg);text-decoration:none;line-height:1.4}
.lr-toc a::before{content:counter(t,decimal-leading-zero);flex:none;font-size:12.5px;font-weight:750;color:var(--sec-t);font-variant-numeric:tabular-nums}
.lr-toc a:hover{background:var(--card)}
.lr-art{font-size:18px;line-height:1.72;margin-top:8px}
.lr-art h2{position:relative;font-size:clamp(24px,3vw,30px);letter-spacing:-.025em;line-height:1.2;margin:52px 0 14px;padding-top:16px;scroll-margin-top:100px}
.lr-art h2::before{content:"";position:absolute;top:0;left:0;width:40px;height:4px;border-radius:4px;background:linear-gradient(90deg,var(--sec-a),var(--sec-b))}
.lr-art p{margin:0 0 16px}.lr-art a{color:var(--sec-t);text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1.5px}
.lr-art b,.lr-art strong{font-weight:680}
.gu-lista{list-style:none;padding-left:0;margin:0 0 18px;display:grid;gap:8px}
.gu-lista li{position:relative;padding-left:24px}.gu-lista li::before{content:"";position:absolute;left:4px;top:.68em;width:8px;height:8px;border-radius:3px;background:var(--sec-t);transform:rotate(45deg)}
.gu-pasos{list-style:none;padding:0;margin:4px 0 18px;display:grid;gap:12px;counter-reset:p}
.gu-pasos li{display:grid;grid-template-columns:36px 1fr;gap:2px 14px;padding:14px 16px 14px 12px;border-radius:16px;background:var(--bg-2)}
.gu-pasos li::before{counter-increment:p;content:counter(p);grid-row:span 2;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--sec-a),var(--sec-b));color:#fff;display:grid;place-items:center;font-weight:750;font-size:15px}
.gu-pasos b{font-size:17px;line-height:1.4}.gu-pasos span{color:var(--fg-2);font-size:16px;line-height:1.6}
.gu-tabla-w{overflow-x:auto;margin:8px 0 16px;border:1px solid var(--line);border-radius:16px;background:var(--card)}
.gu-tabla{width:100%;border-collapse:collapse;font-size:15.5px;line-height:1.5}
.gu-tabla th,.gu-tabla td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
.gu-tabla tr:last-child th,.gu-tabla tr:last-child td{border-bottom:0}
.gu-tabla thead th{font-size:12.5px;color:var(--sec-t);background:var(--sec-s);font-weight:750;text-transform:uppercase;letter-spacing:.06em}.gu-tabla tbody th{font-weight:650}
@media (max-width:640px){.gu-tabla{font-size:14.5px}.gu-tabla th,.gu-tabla td{padding:10px 12px}}
.lr-art .gu-nota,.gu-nota{font-size:14.5px;color:var(--fg-2)}
.gu-caja{position:relative;margin:10px 0 20px;padding:16px 18px 16px 54px;border-radius:16px;background:var(--sec-s);border-left:4px solid var(--sec-t)}
.gu-caja::before{content:"";position:absolute;left:16px;top:17px;width:24px;height:24px;background:var(--sec-t);-webkit-mask:var(--lr-foco) center/contain no-repeat;mask:var(--lr-foco) center/contain no-repeat}
.gu-caja > b{display:block;margin-bottom:6px;color:var(--sec-t)}.gu-caja p:last-child,.gu-caja ul:last-child{margin-bottom:0}
:root[data-app="learn"]{--lr-foco:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z'/%3E%3C/svg%3E")}
.gu-ej{margin:12px 0 22px;padding:18px 20px;border-radius:18px;background:var(--card);border:1.5px dashed var(--line-2)}
.gu-ej-t{display:inline-flex;font-size:12px;font-weight:750;color:var(--sec-t);background:var(--sec-s);padding:4px 10px;border-radius:999px}
.lr-art .gu-ej-p{margin:12px 0;font-weight:600}
.gu-ej-o{list-style:none;padding:0;margin:0 0 10px;display:grid;gap:6px}.gu-ej-o li{display:flex;gap:10px;align-items:center;font-size:16.5px}
.gu-ej-o span{width:28px;height:28px;border-radius:9px;background:var(--sec-s);color:var(--sec-t);display:grid;place-items:center;font-size:13px;font-weight:750;flex:none}
.gu-ej summary{cursor:pointer;font-weight:700;color:var(--sec-t);min-height:40px;display:flex;align-items:center}.lr-art .gu-ej details p{margin:8px 0 0}
.lr-art .t-faq{margin-top:6px}.lr-art .t-faq div{font-size:16.5px}
.lr-art .t-faq summary::after{color:var(--sec-t)}
.gu-fuentes{list-style:decimal;padding-left:22px;display:grid;gap:8px;font-size:15.5px;line-height:1.55}.gu-fuentes a{word-break:break-word}
.lr-art ol.gu-fuentes li{display:list-item}.gu-fuentes li::marker{color:var(--sec-t);font-weight:700}
.lr-final{position:relative;overflow:hidden;isolation:isolate;margin:44px 0 0;padding:clamp(22px,4vw,34px);border-radius:24px;background:linear-gradient(135deg,var(--sec-a),var(--sec-b));color:#fff}
.lr-final::after{content:"";position:absolute;z-index:-1;right:8%;top:-30%;bottom:-30%;width:90px;background:rgba(255,255,255,.08);transform:skewX(-28deg)}
.lr-art .lr-final p{margin:0 0 18px;font-size:17px;color:rgba(255,255,255,.88)}.lr-final .lr-final-t{display:block;font-size:23px;font-weight:780;letter-spacing:-.02em;color:#fff;margin-bottom:6px}
:root[data-app] .lr-art .lr-final .btn.tinta{background:#fff;color:#141114;text-decoration:none;white-space:normal;text-align:center;box-shadow:0 10px 24px -12px rgba(0,0,0,.5)}
.gu-compartir{margin:22px 0 8px;padding:18px;border-radius:18px;background:var(--bg-2);display:grid;gap:12px}.lr-art .gu-compartir p{margin:0;font-size:16px}
.gu-comp-bot{display:flex;flex-wrap:wrap;gap:10px}.lr-art .gu-comp-bot a{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:10px 18px;border-radius:999px;font-weight:700;text-decoration:none;font-size:15px}
.lr-art .gu-comp-bot svg{width:18px;height:18px}
.lr-art .gu-wa{background:#0b7a3b;color:#fff}.lr-art .gu-fb{background:#1b4fb3;color:#fff}
.lr-sigue{margin-top:clamp(48px,7vw,80px);padding-top:clamp(32px,5vw,56px);border-top:1px solid var(--line)}

/* ---------- búsqueda y acerca ---------- */
.lr-buscar-f{margin-top:22px}
.lr-res{list-style:none;padding:0;margin:22px 0 0;display:grid;gap:12px}
.lr-res a{display:block;padding:16px 18px;border-radius:18px;background:var(--card);border:1px solid var(--line);color:inherit;text-decoration:none}
.lr-res a:hover{border-color:var(--sec-t)}
.lr-res h2{font-size:19px;letter-spacing:-.02em;margin:10px 0 6px;line-height:1.3}
.lr-res p{margin:0;color:var(--fg-2);font-size:15px;line-height:1.55}
.lr-res mark{background:var(--sec-s);color:var(--fg);border-radius:4px;padding:0 2px;box-shadow:inset 0 -2px 0 var(--sec-t)}
.lr-vacio{margin-top:22px;padding:22px;border-radius:18px;background:var(--bg-2);color:var(--fg-2)}
.lr-puntos{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px;margin-top:22px}
.lr-punto{padding:20px;border-radius:20px;background:var(--card);border:1px solid var(--line)}
.lr-punto .lr-m-ico{margin-bottom:12px}.lr-punto h2{font-size:19px;letter-spacing:-.02em;margin:0 0 6px}.lr-punto p{margin:0;color:var(--fg-2);font-size:15.5px;line-height:1.6}
.lr-punto a{color:var(--sec-t)}

/* ---------- lectura: barra de progreso y «subir» ---------- */
.lr-progreso{position:fixed;inset:0 0 auto;height:3px;z-index:120;pointer-events:none}
.lr-progreso i{display:block;height:100%;background:linear-gradient(90deg,var(--sec-a),var(--sec-b),#C8A45C);transform-origin:0 50%;transform:scaleX(0)}
.lr-subir{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:80;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:var(--fg);color:var(--bg);box-shadow:var(--sombra-2);opacity:0;visibility:hidden;transform:translateY(10px);transition:opacity var(--t-medio),transform var(--t-medio),visibility var(--t-medio)}
.lr-subir svg{width:20px;height:20px}
.lr-bajo .lr-subir{opacity:1;visibility:visible;transform:none}
.menu-abierto .lr-subir{opacity:0;visibility:hidden}

/* ---------- anuncios (solo si están encendidos; apagados no existen) ---------- */
.lr-anuncio{margin:36px 0;min-height:290px;display:grid;align-content:start;gap:6px;contain:layout}
.lr-anuncio-t{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-3)}
.lr-ins{display:block;min-height:250px;width:100%}
@media (prefers-reduced-motion: reduce){.gu-card,.lr-subir,.lr-toc-fl{transition:none}.gu-card:hover{transform:none}}
</style>`;
