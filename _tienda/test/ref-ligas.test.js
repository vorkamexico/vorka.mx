// Ligas de embajador hacia los simuladores: cualquier página con ?ref=CÓDIGO deja la cookie vorka_ref (30 días), aunque la
// página no la deje por su cuenta (la demo /tienda/demo/<clave>/, las páginas por universidad, la calculadora PAA, aciertos
// UNAM). Sin ella, el botón final de la prueba llevaba a la compra sin el código. Además, ese botón conserva ?ref=.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import SIM from '../src/demos/simulador.js';

let env;
beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  env.DB.raw.exec(`UPDATE products SET activo = 1;
    INSERT INTO affiliates (code, nombre, email, comision_pct, activo, tipo) VALUES ('EMBA1', 'Embajadora', 'emba@mail.com', 0, 1, 'puntos');
    INSERT INTO affiliates (code, nombre, email, comision_pct, activo, tipo) VALUES ('BAJA1', 'De baja', 'baja@mail.com', 0, 0, 'puntos');`);
});
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { headers: { 'user-agent': 'Mozilla/5.0', 'cf-connecting-ip': '5.6.7.8' } }), env);
const cookieDe = r => (r.headers.get('set-cookie') || '').match(/vorka_ref=([^;]+)/)?.[1] || null;
const visitas = code => env.DB.raw.prepare('SELECT COUNT(*) n FROM puntos_visitas WHERE code = ?').get(code).n;

describe('ligas de embajador hacia los simuladores', () => {
  const RUTAS = ['/tienda/demo/simulador-paa/', '/tienda/demo/simulador-unam/', '/tienda/demo/simulador-excoba/',
    '/simulador-paa/udem/', '/simulador-paa/calculadora/', '/simulador-unam/aciertos/', '/simulador-paa/'];
  for (const ruta of RUTAS) {
    it(`${ruta}?ref= deja la cookie de recomendación y no se guarda en caché`, async () => {
      const r = await pedir(`${ruta}?ref=emba1`);
      expect(r.status).toBe(200);
      expect(cookieDe(r)).toBe('EMBA1');
      expect(r.headers.get('set-cookie')).toMatch(/Max-Age=2592000; Path=\/; Secure; HttpOnly; SameSite=Lax/);
      expect(r.headers.get('cache-control')).not.toMatch(/public/);
    });
  }

  it('una sola cookie aunque la página ya la deje por su cuenta', async () => {
    const r = await pedir('/simulador-paa/?ref=EMBA1');
    expect((r.headers.get('set-cookie') || '').match(/vorka_ref=/g)).toHaveLength(1);
  });

  it('cuenta la visita para «personas que abrieron tu liga»', async () => {
    await pedir('/tienda/demo/simulador-paa/?ref=EMBA1');
    expect(visitas('EMBA1')).toBe(1);
  });

  it('código inexistente, de baja o con caracteres raros: sin cookie', async () => {
    for (const ref of ['NOEXISTE', 'BAJA1', '<x>']) expect(cookieDe(await pedir(`/tienda/demo/simulador-paa/?ref=${encodeURIComponent(ref)}`))).toBeNull();
    expect(cookieDe(await pedir('/tienda/demo/simulador-paa/'))).toBeNull();
  });

  it('las API y las páginas sin HTML no dejan cookie', async () => {
    expect(cookieDe(await pedir('/tienda/sitemap.xml?ref=EMBA1'))).toBeNull();
  });

  it('la cookie que deja la demo llega a la compra (ref_code en la orden)', async () => {
    const c = cookieDe(await pedir('/tienda/demo/simulador-paa/?ref=EMBA1'));
    const llamadas = [];
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = async (u, o) => { llamadas.push([u, o]); return new Response(JSON.stringify(String(u).endsWith('/customers') ? { id: 'cus_1' } : { id: 'cs_test_1', url: 'https://checkout.stripe.com/x' }), { headers: { 'content-type': 'application/json' } }); };
    try {
      const body = JSON.stringify({ slug: 'simulador-paa-paquete', email: 'alumna@mail.com', nombre: 'Alumna López', terminos: true });
      const r = await worker.fetch(new Request('https://vorka.mx/api/checkout', { method: 'POST', body,
        headers: { 'content-type': 'application/json', cookie: `vorka_ref=${c}`, 'cf-connecting-ip': '1.2.3.4' } }), env);
      expect(r.status, await r.clone().text()).toBe(200);
    } finally { globalThis.fetch = fetchOriginal; }
    const o = env.DB.raw.prepare("SELECT ref_code FROM orders WHERE email = 'alumna@mail.com'").get();
    expect(o.ref_code).toBe('EMBA1');
  });

  it('el botón final de la prueba conserva ?ref= de la página', () => {
    const js = SIM.paa.js;
    expect(js).toContain("D.ruta+'?plan=paquete'+REF+'#comprar");
    expect(js).toMatch(/const REF=/);
  });
});
