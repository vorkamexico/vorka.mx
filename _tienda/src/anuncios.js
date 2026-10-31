// Anuncios de Google AdSense: SOLO en Vorka Learn (vorka.mx/learn/…). Nunca en la tienda, el pago ni las páginas de cuenta.
// Apagados por defecto. Se encienden con dos variables del Worker (wrangler.jsonc › vars, o en el panel de Cloudflare):
//   ADSENSE_CLIENT = "ca-pub-1234567890123456"       ← el ID de editor de AdSense
//   ADSENSE_SLOTS  = "intro:1111111111,mitad:2222222222,final:3333333333,indice:4444444444"
//                    ← el ID de cada bloque de anuncio (AdSense › Anuncios › Por bloque de anuncios)
// Con ADSENSE_CLIENT válido: se carga el script de AdSense (con el nonce de la CSP), la CSP de las páginas de Learn se abre a
// los dominios de abajo y vorka.mx/ads.txt responde con la línea de Google. Solo se pinta el espacio de los lugares que
// tengan ID en ADSENSE_SLOTS; sin ID ese lugar no existe (no queda hueco). Apagados: ni script, ni espacio, ni dominios.
// Lugares: intro (tras la primera sección), mitad (a mitad del artículo), final (antes del llamado final),
//          indice (en los índices, entre grupos de guías).

export const LUGARES = ['intro', 'mitad', 'final', 'indice'];

// Dominios que AdSense necesita en una página con Content Security Policy (los que Google documenta para AdSense y los que
// usan sus anuncios hoy). Google los cambia de vez en cuando: el día que se enciendan, revisar la consola del navegador
// en una guía y sumar aquí lo que salga bloqueado. img-src ya permite cualquier https: en todas las páginas del Worker.
export const DOMINIOS_ADSENSE = {
  script: [
    'https://pagead2.googlesyndication.com',   // adsbygoogle.js
    'https://tpc.googlesyndication.com',       // creatividades y su código
    'https://*.googlesyndication.com',
    'https://*.adtrafficquality.google',       // calidad del tráfico (antifraude)
    'https://www.googletagservices.com',
    'https://adservice.google.com',
    'https://googleads.g.doubleclick.net',
    'https://*.doubleclick.net',
    'https://fundingchoicesmessages.google.com', // mensajes de consentimiento de Google (Privacidad y mensajes)
  ],
  frame: [
    'https://googleads.g.doubleclick.net',     // el iframe del anuncio
    'https://tpc.googlesyndication.com',
    'https://*.googlesyndication.com',
    'https://*.doubleclick.net',
    'https://*.adtrafficquality.google',
    'https://www.google.com',
    'https://fundingchoicesmessages.google.com',
  ],
  connect: [
    'https://pagead2.googlesyndication.com',
    'https://*.googlesyndication.com',
    'https://*.adtrafficquality.google',
    'https://*.doubleclick.net',
    'https://adservice.google.com',
    'https://csi.gstatic.com',
    'https://fundingchoicesmessages.google.com',
  ],
  img: ['https:'],   // ya incluido en la CSP general (img-src 'self' data: https:)
};

const RE_CLIENTE = /^ca-pub-\d{10,20}$/;
const RE_SLOT = /^\d{6,20}$/;

// { cliente, slots: { intro: '…', … } } o null si están apagados (variable vacía o con un valor que no es un ID de AdSense)
export function configAnuncios(env) {
  const cliente = String(env?.ADSENSE_CLIENT || '').trim();
  if (!RE_CLIENTE.test(cliente)) return null;
  const slots = {};
  for (const par of String(env?.ADSENSE_SLOTS || '').split(',')) {
    const [k, v] = par.split(':').map(s => (s || '').trim());
    if (LUGARES.includes(k) && RE_SLOT.test(v)) slots[k] = v;
  }
  return { cliente, slots };
}

// Espacio de anuncio con su alto reservado (no mueve la página cuando carga). '' si ese lugar no está encendido.
export const espacioAnuncio = (cfg, lugar) => cfg?.slots?.[lugar]
  ? `<aside class="lr-anuncio" data-lugar="${lugar}" aria-label="Publicidad"><span class="lr-anuncio-t">Publicidad</span><ins class="adsbygoogle lr-ins" data-ad-client="${cfg.cliente}" data-ad-slot="${cfg.slots[lugar]}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside>`
  : '';

// Script de AdSense + el empujón de cada espacio (solo si hay alguno en la página). '' si están apagados.
export const scriptAnuncios = (cfg, n, html = '') => cfg
  ? `<script async nonce="${n}" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cfg.cliente}" crossorigin="anonymous"></script>${html.includes('class="adsbygoogle') ? `<script nonce="${n}">(function(){var l=document.querySelectorAll('ins.adsbygoogle');for(var i=0;i<l.length;i++)(window.adsbygoogle=window.adsbygoogle||[]).push({});})();</script>` : ''}`
  : '';

// vorka.mx/ads.txt (la ruta pasa por el Worker): la línea de Google sale de ADSENSE_CLIENT. Apagados: 404.
export function adsTxt(env) {
  const cfg = configAnuncios(env);
  if (!cfg) return new Response('No encontrado', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  return new Response(`google.com, ${cfg.cliente.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
