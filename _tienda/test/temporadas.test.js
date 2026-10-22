import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { temporadaDe, temporadaVigente, decoracion, TEMPORADAS, olvidarTemporada } from '../src/temporadas.js';
import { temporada, guardarTemporada } from '../src/admin.js';

// Fecha a mediodía de CDMX (UTC−6)
const cdmx = f => new Date(`${f}T18:00:00Z`);
let env;
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`), env, { waitUntil() {} });
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx' }; env.DB.raw.exec('UPDATE products SET activo = 1'); olvidarTemporada(); });

describe('temas de temporada', () => {
  it('el calendario: cada fecha con su temporada (y Buen Fin y Día del Padre se calculan cada año)', () => {
    const id = f => temporadaDe(cdmx(f))?.id ?? null;
    expect(id('2026-02-10')).toBe('san-valentin');
    expect(id('2026-02-20')).toBe(null);
    expect(id('2026-05-10')).toBe('dia-de-las-madres');
    expect(id('2026-06-21')).toBe('dia-del-padre');      // tercer domingo de junio de 2026
    expect(id('2026-06-22')).toBe(null);
    expect(id('2026-09-15')).toBe('fiestas-patrias');
    expect(id('2026-10-31')).toBe('halloween');
    expect(id('2026-11-12')).toBe(null);
    expect(id('2026-11-13')).toBe('buen-fin');           // 13 al 17 de noviembre de 2026
    expect(id('2026-11-17')).toBe('buen-fin');
    expect(id('2026-11-18')).toBe(null);
    expect(id('2027-11-12')).toBe('buen-fin');           // 2027: tercer lunes es el 15 → viernes 12
    expect(id('2026-12-24')).toBe('navidad');
    expect(id('2026-12-31')).toBe('ano-nuevo');
    expect(id('2027-01-06')).toBe('ano-nuevo');
    // medianoche de CDMX: el 1 de febrero a las 00:30 ya es San Valentín (06:30 UTC)
    expect(temporadaDe(new Date('2026-02-01T06:30:00Z'))?.id).toBe('san-valentin');
    expect(temporadaDe(new Date('2026-02-01T05:30:00Z'))?.id ?? null).toBe(null);
  });

  it('el panel decide: automático, apagado o uno fijo', () => {
    expect(temporadaVigente('apagado', cdmx('2026-12-24'))).toBe(null);
    expect(temporadaVigente('san-valentin', cdmx('2026-08-01'))?.id).toBe('san-valentin');
    expect(temporadaVigente('auto', cdmx('2026-12-24'))?.id).toBe('navidad');
    expect(temporadaVigente('inventado', cdmx('2026-12-24'))).toBe(null);
  });

  it('cada temporada tiene su decoración en SVG (sin imágenes) y ningún aviso promete descuentos', () => {
    for (const t of TEMPORADAS) {
      const svg = decoracion(t);
      expect(svg, t.id).toMatch(/^<svg class="t-deco [a-z]+" viewBox="0 0 1440 \d+"/);
      expect(svg).not.toContain('NaN');
      expect(t.aviso).not.toMatch(/descuento|%|gratis|rebaja/i);
    }
    expect(decoracion(null)).toBe('');
  });

  it('se guarda desde el panel y la tienda se viste con el tema elegido', async () => {
    await expect(guardarTemporada(env, { modo: '<script>' })).rejects.toThrow();
    const r = await guardarTemporada(env, { modo: 'navidad' });
    expect(r).toMatchObject({ modo: 'navidad', actual: 'navidad' });
    expect(r.lista.find(t => t.id === 'buen-fin').cuando).toMatch(/^\d+ nov – \d+ nov$/);
    const html = await (await pedir('/tienda/')).text();
    expect(html).toContain('data-temporada="navidad"');
    expect(html).toContain('--acento:#2FA36B');
    expect(html).toContain('<svg class="t-deco luces"');
    expect(html).toContain('class="t-hero-chip temporada"');
    expect(html).toContain('Invitaciones para tus posadas');
    // las demás páginas toman el color, sin la decoración de la portada
    const ficha = await (await pedir('/tienda/cupo/')).text();
    expect(ficha).toContain('--acento:#2FA36B');
    await guardarTemporada(env, { modo: 'apagado' });
    const sin = await (await pedir('/tienda/')).text();
    expect(sin).not.toContain('data-temporada');
    expect(sin).not.toContain('t-deco');
    expect((await temporada(env)).modo).toBe('apagado');
  });
});
