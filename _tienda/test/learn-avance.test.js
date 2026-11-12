// Vorka Learn · portada nueva y «Tu avance» (gamificación local: guías terminadas, racha, nivel, logros).
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { secciones, articulos } from '../src/learn/datos.js';
import { LOGROS, NIVELES, scriptAvance } from '../src/learn/avance.js';
import { HERRAMIENTAS } from '../src/learn/herramientas.js';

let env;
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`), env);
const principal = html => html.split('<main')[1].split('</main>')[0];
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx' }; });

describe('Vorka Learn · portada nueva', () => {
  it('va de lo útil a lo de apoyo: portada, secciones, guías con filtros, herramientas, logros y practica', async () => {
    const html = principal(await (await pedir('/learn/')).text());
    const orden = ['class="lr-portada"', 'id="secciones"', 'data-av-sigue', 'id="indice"', 'id="herramientas"', 'id="logros"', 'id="practica"'].map(x => html.indexOf(x));
    expect(orden.every(i => i > 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    // Cada sección una sola vez en el mosaico (antes se repetía índice + todas las guías por sección)
    for (const s of secciones()) expect(html.match(new RegExp(`<a class="lr-mos lr-s-${s.clave}" href="${s.ruta}">`, 'g'))).toHaveLength(1);
    // Todas las guías siguen enlazadas una vez (Google y enlaces internos), con un filtro por sección
    for (const a of articulos()) expect(html.split(`<a class="gu-card lr-s-${a.clave}" href="${a.ruta}">`)).toHaveLength(2);
    for (const s of secciones()) expect(html).toContain(`data-filtro="${s.ruta}"`);
    for (const h of HERRAMIENTAS) expect(html).toContain(`<a href="${h.ruta}">`);
    expect(html).toMatch(/<button type="button" class="btn blanco" data-mas hidden>/);
  });

  it('«Tu avance»: panel, avance por sección, niveles y logros; sin letreros en mayúsculas', async () => {
    const pagina = await (await pedir('/learn/')).text(), html = principal(pagina);
    expect(html).toContain('data-av-panel');
    for (const s of secciones()) expect(html).toContain(`data-av-sec="${s.ruta}" data-total="${s.n}"`);
    for (const [k] of LOGROS) expect(html).toContain(`data-logro="${k}"`);
    for (const [, n] of NIVELES) expect(html).toContain(`<span>${n}<small>`);
    expect(html).toContain('se guarda solo en este dispositivo');
    expect(pagina).not.toMatch(/\.lr-kicker\{[^}]*text-transform:uppercase/);
    expect(pagina).not.toMatch(/\.lr-etq\{[^}]*text-transform:uppercase/);
  });

  it('el script de avance va en todas las páginas de Learn con el nonce, y sabe cuántas guías tiene cada sección', async () => {
    for (const ruta of ['/learn/', secciones()[0].ruta, articulos()[0].ruta, '/learn/herramientas/']) {
      const r = await pedir(ruta), html = await r.text();
      const n = html.match(/<script nonce="([^"]+)">\(function\(\)\{var K='vk-learn'/);
      expect(n, ruta).not.toBeNull();
      expect(r.headers.get('content-security-policy'), ruta).toContain(`'nonce-${n[1]}'`);
    }
    const s = scriptAvance({ '/learn/paa/': 4 });
    expect(s).toContain('"/learn/paa/":4');
    expect(s).toContain('localStorage');
    expect(s).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon/);   // nada sale del dispositivo
  });

  it('índice de sección: muestra el avance de esa sección', async () => {
    for (const s of secciones()) {
      const html = principal(await (await pedir(s.ruta)).text());
      expect(html, s.ruta).toContain(`<div class="lr-banner-av"><span class="lr-av-sec" data-av-sec="${s.ruta}" data-total="${s.n}">`);
    }
  });
});
