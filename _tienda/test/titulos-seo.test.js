import { describe, it, expect } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { tituloSeo } from '../src/paginas.js';

// Google muestra ~60 caracteres del título: ninguna página del sitemap pasa de 70 (la marca del final se quita sola si estorba)
describe('títulos para Google', () => {
  it('tituloSeo quita la marca del final solo cuando el título ya es largo', () => {
    expect(tituloSeo('Simulador PAA en línea | Vorka México')).toBe('Simulador PAA en línea | Vorka México');
    expect(tituloSeo('Aciertos para Medicina Veterinaria y Zootecnia en la UNAM por plantel | Vorka México')).toBe('Aciertos para Medicina Veterinaria y Zootecnia en la UNAM por plantel');
    expect(tituloSeo('Invitaciones digitales para boda con confirmación por WhatsApp | Brindi')).toBe('Invitaciones digitales para boda con confirmación por WhatsApp');
    expect(tituloSeo('Agenda: citas en línea para consultorios y negocios de todo México | Prueba 7 días gratis')).toContain('Prueba 7 días');   // un gancho no es marca
  });

  it('todas las páginas del sitemap tienen título de 70 caracteres o menos', async () => {
    const env = { DB: d1(), SITE_URL: 'https://vorka.mx' };
    env.DB.raw.exec('UPDATE products SET activo = 1');
    const pedir = r => worker.fetch(new Request(`https://vorka.mx${r}`), env);
    const sm = await (await pedir('/tienda/sitemap.xml')).text();
    const rutas = [...sm.matchAll(/<loc>https:\/\/vorka\.mx([^<]+)<\/loc>/g)].map(m => m[1]);
    expect(rutas.length).toBeGreaterThan(100);
    const largos = [];
    for (const r of rutas) {
      const h = await (await pedir(r)).text();
      const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
      if (t == null) continue;
      const txt = t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      if (txt.length > 70) largos.push(`${txt.length} ${r} ${txt}`);
    }
    expect(largos).toEqual([]);
  }, 120000);
});
