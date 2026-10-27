// Comparte y gana (Vorka OS › #/puntos): Admin.catalogoPuntos(code) por RPC.
// Productos activos de Vorka por línea, con su página pública y la liga ?ref=; sin creadores ni ocultos; y cada liga
// lleva a una página que de verdad guarda el código (cookie vorka_ref), para que la compra cuente para los puntos.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { NIVELES, PCT_EXTRA, PCT_TOPE } from '../src/puntos-reglas.js';

let env, A;
beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx' };
  env.DB.raw.exec(`UPDATE products SET activo = 1;
    INSERT INTO affiliates (code, nombre, email, comision_pct, activo, tipo) VALUES ('EQUIPO1', 'Equipo', 'equipo@vorka.mx', 0, 1, 'puntos');
    INSERT INTO creadores (id, nombre, email, estado, stripe_listo) VALUES ('cre_a', 'Ale', 'ale@mail.com', 'aprobado', 1);
    INSERT INTO products (id, slug, nombre, precio_centavos, r2_keys, creador_id, revision, activo) VALUES ('prod_ale', 'guia-ale', 'Guía de Ale', 9900, '[]', 'cre_a', 'aprobado', 1);`);
  A = new Admin({}, env);
});
const todos = c => c.lineas.flatMap(l => l.productos);

describe('catalogoPuntos', () => {
  it('agrupa por línea los productos activos de Vorka, una tarjeta por página, con precio y liga con ?ref=', async () => {
    const c = await A.catalogoPuntos('equipo1');
    expect(c.tienda).toEqual({ url: 'https://vorka.mx/tienda/', liga: 'https://vorka.mx/tienda/?ref=EQUIPO1' });
    expect(c.cuenta).toBe('https://vorka.mx/tienda/puntos/');
    const lineas = c.lineas.map(l => l.linea);
    for (const l of ['Educación', 'Negocios', 'Eventos']) expect(lineas).toContain(l);
    const ps = todos(c);
    expect(ps.length).toBeGreaterThan(5);
    expect(new Set(ps.map(p => p.url)).size).toBe(ps.length);   // los planes de una misma página van en una sola tarjeta
    for (const p of ps) {
      expect(p.nombre).toBeTruthy();
      expect(p.precio).toBeTruthy();
      expect(p.url).toMatch(/^https:\/\/vorka\.mx\//);
      expect(new URL(p.liga).searchParams.get('ref')).toBe('EQUIPO1');
      expect(new URL(p.liga).pathname).toBe(new URL(p.url).pathname);
      if (p.imagen) expect(p.imagen).toMatch(/^https:\/\//);
    }
    // Brindi y Cupo: una sola tarjeta que lleva a su página única
    expect(ps.filter(p => p.app === 'brindi')).toHaveLength(1);
    expect(ps.find(p => p.app === 'brindi').url).toBe('https://vorka.mx/tienda/brindi/');
    expect(ps.find(p => p.app === 'cupo').url).toBe('https://vorka.mx/tienda/cupo/');
  });

  it('sin productos de creadores, sin ocultos (intentos y exámenes adicionales) y sin páginas por universidad', async () => {
    const ps = todos(await A.catalogoPuntos('EQUIPO1'));
    const ocultos = env.DB.raw.prepare("SELECT id FROM products WHERE json_extract(contenido, '$.oculto') = 1").all().map(x => x.id);
    expect(ocultos.length).toBeGreaterThan(0);
    for (const p of ps) {
      expect(p.id).not.toBe('prod_ale');
      expect(ocultos).not.toContain(p.id);
      expect(p.url).not.toMatch(/\/simulador-paa\/[a-z0-9-]+\/$/);
    }
    expect(ps.some(p => /intento|adicional/i.test(p.nombre))).toBe(false);
  });

  it('los productos inactivos no salen', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE json_extract(contenido, '$.acceso.app') = 'cupo'");
    expect(todos(await A.catalogoPuntos('EQUIPO1')).some(p => p.app === 'cupo')).toBe(false);
  });

  it('sin código (o con uno inválido) da las páginas sin liga', async () => {
    for (const code of [null, 'no válido!']) {
      const c = await A.catalogoPuntos(code);
      expect(c.tienda.liga).toBeNull();
      expect(todos(c).every(p => p.liga === null && p.url)).toBe(true);
    }
  });

  it('trae las reglas reales del programa (niveles, extra y tope)', async () => {
    const { reglas } = await A.catalogoPuntos('EQUIPO1');
    expect(reglas.niveles).toEqual(NIVELES.map(n => ({ nombre: n.nombre, min: n.min, pct: n.pct })));
    expect(reglas).toMatchObject({ extra: PCT_EXTRA, tope: PCT_TOPE, punto_mxn: 1 });
  });

  it('cada liga abre una página que guarda el código para la compra (cookie vorka_ref)', async () => {
    const c = await A.catalogoPuntos('EQUIPO1');
    for (const liga of [c.tienda.liga, ...todos(c).map(p => p.liga)]) {
      let u = new URL(liga), r;
      for (let i = 0; i < 3; i++) {   // sigue redirecciones internas (conservan ?ref=)
        r = await worker.fetch(new Request(u.toString()), env);
        if (r.status < 300 || r.status >= 400) break;
        u = new URL(r.headers.get('location'), u);
        expect(u.searchParams.get('ref'), `${liga} pierde ?ref= al redirigir`).toBe('EQUIPO1');
      }
      expect(r.status, liga).toBe(200);
      expect(r.headers.get('set-cookie') || '', `${liga} no guarda el código`).toContain('vorka_ref=EQUIPO1');
    }
  });
});
