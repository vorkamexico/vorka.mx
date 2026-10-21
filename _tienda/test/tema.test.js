// Apariencia (automático · claro · oscuro) y la billetera de Puntos Vorka: el tema se decide antes de pintar con un
// script que sí pasa la CSP (mismo nonce), todas las páginas del Worker lo traen y Puntos Vorka ofrece ocultar el saldo,
// filtrar movimientos y mostrar lo apartado como pendiente (dato real del saldo, no inventado).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden } from '../src/modelo.js';
import { TEMA_HEAD, selectorTema } from '../src/tema.js';
import { ESTILOS } from '../src/paginas.js';

let env;
const SITIO = 'https://vorka.mx';
const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);
async function entrar(email, nombre = 'Ana') {
  const r = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email, nombre, terminos: true } })).json();
  return (await pedir(r.enlace)).headers.get('set-cookie').split(';')[0];
}
const nonceDe = res => res.headers.get('content-security-policy').match(/'nonce-([^']+)'/)[1];

beforeEach(() => {
  env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'x', url: 'https://checkout.stripe.com/c/pay/x' }))));
});
afterEach(() => vi.unstubAllGlobals());

describe('Apariencia en las páginas de la tienda', () => {
  it('cada página del Worker decide el tema en <head> con el nonce de su CSP y trae el selector en el pie', async () => {
    for (const ruta of ['/tienda/', '/tienda/vuelve/', '/tienda/cupo/', '/tienda/brindi/', '/tienda/puntos/']) {
      const r = await pedir(ruta);
      expect(r.status, ruta).toBe(200);
      const h = await r.text(), n = nonceDe(r);
      expect(h, ruta).toContain('<html lang="es-MX" data-app="tienda">');
      // el script del tema va antes de cualquier hoja de estilos: así no hay destello del tema equivocado
      const iTema = h.indexOf(`<script nonce="${n}">${TEMA_HEAD}`), iCss = h.indexOf('<link rel="stylesheet"');
      expect(iTema, ruta).toBeGreaterThan(0);
      expect(iTema, ruta).toBeLessThan(iCss);
      expect(h, ruta).toContain('name="color-scheme" content="light dark"');
      expect(h, ruta).toContain('data-claro="#FBFAF8" data-oscuro="#141216"');
      expect(h, ruta).toContain('class="t-tema-pie"');
      for (const op of ['auto', 'claro', 'oscuro']) expect(h, ruta).toContain(`data-tema-op="${op}"`);
    }
  });
  it('los colores oscuros viven en tokens escopados a las páginas del Worker (el resto del sitio no cambia)', () => {
    expect(ESTILOS).toContain(':root[data-app][data-tema="oscuro"]');
    expect(ESTILOS).toContain(':root[data-app]:not([data-tema])');
    expect(ESTILOS).toContain('prefers-reduced-motion');
    // ninguna regla oscura sin escopar: todas cuelgan de [data-app]
    const sueltas = ESTILOS.split('\n').filter(l => /data-tema="oscuro"/.test(l) && !/\[data-app\]/.test(l));
    expect(sueltas).toEqual([]);
  });
  it('el selector es un grupo de 3 opciones accesible', () => {
    const s = selectorTema();
    expect(s).toContain('role="radiogroup"');
    expect(s.match(/role="radio"/g)).toHaveLength(3);
    expect(s).toContain('Automático');
  });
  it('el script del tema respeta auto, claro y oscuro y guarda la elección', () => {
    // se corre el script con un DOM mínimo
    const atributos = {}, guardado = {}, oyentes = {};
    const doc = { documentElement: { setAttribute: (k, v) => { atributos[k] = v; }, classList: { add() {}, remove() {} } },
      querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };
    const ventana = { matchMedia: () => ({ matches: true, addEventListener: (e, f) => { oyentes.cambio = f; } }), addEventListener: () => {} };
    const ls = { getItem: k => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = v; }, removeItem: k => { delete guardado[k]; } };
    new Function('document', 'window', 'localStorage', 'matchMedia', 'setTimeout', TEMA_HEAD)(doc, ventana, ls, ventana.matchMedia, f => f());
    expect(atributos['data-tema']).toBe('oscuro');          // automático + sistema oscuro
    expect(atributos['data-tema-pref']).toBe('auto');
    ventana.vorkaTema.poner('claro');
    expect(guardado['vorka-tema']).toBe('claro');
    expect(atributos['data-tema']).toBe('claro');
    ventana.vorkaTema.poner('auto');
    expect(guardado['vorka-tema']).toBeUndefined();
    expect(atributos['data-tema']).toBe('oscuro');
  });
});

describe('Puntos Vorka · billetera', () => {
  it('la app decide el tema antes de pintar, recuerda el saldo oculto y trae Apariencia en Ajustes', async () => {
    const cookie = await entrar('ana@mail.com');
    const r = await pedir('/tienda/cuenta/', { cookie }), h = await r.text(), n = nonceDe(r);
    expect(h).toContain('<html lang="es-MX" data-app="puntos">');
    expect(h.indexOf(`<script nonce="${n}">${TEMA_HEAD}`)).toBeGreaterThan(0);
    expect(h).toContain("localStorage.getItem('pv-ocultar-saldo')");
    expect(h).toContain('id="b-ocultar"');
    expect(h).toContain(':root[data-tema="claro"]{');
    expect(h.slice(h.indexOf('id="h-ajustes"'))).toContain('data-tema-op="oscuro"');
    // sin brillo animado infinito sobre el saldo
    expect(h).not.toContain('animation:brillo');
  });
  it('los puntos apartados en una compra por pagar salen como pendientes (no se inventan movimientos)', async () => {
    const cookie = await entrar('ana@mail.com');
    let h = await (await pedir('/tienda/cuenta/', { cookie })).text();
    expect(h).not.toContain('class="mov pend"');
    expect(h).toContain('Todavía no tienes movimientos');
    // 30 puntos y una orden pendiente que aparta 20
    env.DB.raw.prepare("INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('ana@mail.com', 'bono', 30, 'Prueba')").run();
    const o = await crearOrden(env, { items: [{ slug: 'cupo-pro-100' }], email: 'otra@mail.com', nombre: 'X' });
    env.DB.raw.prepare("UPDATE orders SET puntos_email = 'ana@mail.com', puntos_usados = 20, estado = 'pending' WHERE id = ?").run(o.id);
    h = await (await pedir('/tienda/cuenta/', { cookie })).text();
    expect(h).toContain('class="mov pend"');
    expect(h).toMatch(/Apartados<span class="estado">Pendiente<\/span>/);
    expect(h).toContain('−20<small>pts</small>');
    expect(h).toContain('data-sensible>10</b>');          // disponible = 30 − 20
    expect(h).toContain('data-filtro="mas"');
  });
});
