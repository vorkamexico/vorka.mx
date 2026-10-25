import { describe, it, expect } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { GUIAS } from '../src/brindi-guias.js';

const env = { DB: d1(), SITE_URL: 'https://vorka.mx' };
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`), env);
// Texto visible en frases de 5 palabras, para medir cuánto se parecen dos páginas
const frases = html => { const t = html.replace(/<(script|style|header|footer|nav)[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').toLowerCase().split(/\s+/).filter(Boolean);
  return new Set(t.slice(4).map((_, i) => t.slice(i, i + 5).join(' '))); };
const parecido = (a, b) => { let c = 0; for (const x of a) if (b.has(x)) c++; return c / (a.size + b.size - c); };

describe('Brindi por tipo de evento', () => {
  it('cada página tiene su propia guía y sus preguntas en los datos estructurados', async () => {
    for (const [k, g] of Object.entries(GUIAS)) {
      const html = await (await pedir(`/tienda/brindi/${k}/`)).text();
      expect(html).toContain(g.titulo);
      expect(html).toContain(JSON.stringify(g.preguntas[0][0]).slice(1, -1).replace(/</g, '\\u003c'));
    }
    expect(await (await pedir('/tienda/brindi/')).text()).not.toContain('id="guia"');
  });

  it('las páginas de evento ya no son casi idénticas (Google las trataba como duplicadas)', async () => {
    const pags = {};
    for (const k of ['', ...Object.keys(GUIAS)]) pags[k] = frases(await (await pedir(`/tienda/brindi/${k ? k + '/' : ''}`)).text());
    const claves = Object.keys(pags);
    let max = 0;
    for (let i = 0; i < claves.length; i++) for (let j = i + 1; j < claves.length; j++) max = Math.max(max, parecido(pags[claves[i]], pags[claves[j]]));
    console.log('parecido máximo entre páginas de Brindi:', max.toFixed(2));
    expect(max).toBeLessThan(0.85);
  });
});
