// Los simuladores como app instalable (PWA): manifiesto, service worker (recordatorios y página sin conexión) y el ícono
// de cada uno. El ícono es un librito (no el logo de Vorka), con un color por simulador; los PNG los genera
// _tienda/simulador/icono/iconos.mjs en assets/tienda/simulador-app/ (los sirve Cloudflare Pages).
export const COLORES_APP = {
  paa: ['#4A1561', '#8E3FB0'],
  unam: ['#12306B', '#2F6FD6'],
  ecoems: ['#11593A', '#2E9E68'],
  'prepa-ug': ['#9A3412', '#EA7A2E'],
  ipn: ['#5A1230', '#A3305C'],
  'exani-ii': ['#2E2A7A', '#5B54D6'],
};
const ICONOS = '/assets/tienda/simulador-app';
export const idIcono = app => app.replace(/^simulador-/, '');
export const iconoDe = (app, nombre = 'icono-192') => `${ICONOS}/${idIcono(app)}-${nombre}.png`;
export const colorDe = app => (COLORES_APP[idIcono(app)] || COLORES_APP.paa)[0];

// start_url lleva ?app=1: si la app instalada abre sin sesión (en iPhone la app de la pantalla de inicio no siempre
// comparte cookies con Safari), va directo a «Entrar con mi correo» y no a la página de venta
export function manifiesto({ app, ruta, nombre, titulo }) {
  return {
    id: `${ruta}/`,
    name: titulo,
    short_name: `Simulador ${nombre}`.length <= 15 ? `Simulador ${nombre}` : nombre,
    description: `Tu ${titulo}: simulacros, plan de estudio, recordatorios y apuntes.`,
    lang: 'es-MX',
    start_url: `${ruta}/?app=1`,
    scope: `${ruta}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBFAF8',
    theme_color: colorDe(app),
    categories: ['education'],
    icons: [
      { src: iconoDe(app, 'icono-192'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: iconoDe(app, 'icono-512'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: iconoDe(app, 'maskable-192'), sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: iconoDe(app, 'maskable-512'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

// Service worker: muestra los recordatorios, abre la app al tocarlos y, sin internet, una página amable en vez del
// dinosaurio. No guarda la app en caché: cada pantalla trae el acceso vigente del servidor.
export function serviceWorker({ ruta, app, titulo }) {
  const offline = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sin conexión</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FBFAF8;color:#141114;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px">
<div><img src="${iconoDe(app, 'icono-192')}" alt="" width="72" height="72" style="border-radius:18px"><h1 style="font-size:24px;letter-spacing:-.02em;margin:18px 0 8px">Sin conexión</h1>
<p style="color:#6D696E;max-width:320px;margin:0 auto 20px">Tu ${titulo} necesita internet. Tu avance está guardado: cuando vuelva la señal, sigue donde te quedaste.</p>
<button onclick="location.reload()" style="font:inherit;font-weight:700;border:0;border-radius:999px;background:#141114;color:#fff;padding:12px 22px">Reintentar</button>
<p style="font-size:12px;color:#A8A4A9;margin-top:28px">Powered by vorka.mx</p></div></body></html>`;
  return `// Service worker de ${titulo} (generado por src/simulador/instalable.js)
const RUTA = ${JSON.stringify(ruta)}, ICONO = ${JSON.stringify(iconoDe(app, 'icono-192'))}, OFFLINE = ${JSON.stringify(offline)};
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { 'content-type': 'text/html; charset=utf-8' } })));
});
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { cuerpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Hora de estudiar', {
    body: d.cuerpo || '', icon: ICONO, badge: ICONO, tag: d.tag || 'estudio', renotify: true, data: { url: d.url || RUTA + '/?app=1' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || RUTA + '/?app=1', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
    for (const c of lista) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return (c.navigate ? c.navigate(url) : Promise.resolve()).then(() => c.focus());
    return self.clients.openWindow(url);
  }));
});
`;
}
