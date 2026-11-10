// Mira tu negocio: /tienda/mira-tu-negocio/ arma en el navegador la tarjeta, la agenda y la página con el nombre del negocio.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { GIROS } from '../src/miratunegocio.js';

let env;
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { headers: { 'cf-connecting-ip': '1.1.1.1' }, redirect: 'manual' }), env);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx' }; });

describe('Mira tu negocio', () => {
  it('muestra el formulario con los giros, el precio y «Lo quiero» a WhatsApp', async () => {
    const r = await pedir('/tienda/mira-tu-negocio/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('id="form-mira"');
    expect(h).toContain('value="barberia"');
    expect(h).toContain('$749 al mes');
    expect(h).toContain('528117804869');
    expect(h).toContain('id="mt-datos"');
    expect(h).toContain('Lo quiero');
    expect(h).not.toMatch(/href="tel:/);
  });

  it('la liga armada llena el formulario y escapa lo que escriben', async () => {
    const h = await (await pedir('/tienda/mira-tu-negocio/?n=%3Cscript%3EEst%C3%A9tica&g=estetica&c=Celaya')).text();
    expect(h).toContain('value="&lt;script&gt;Estética"');
    expect(h).toContain('<option value="estetica" selected>');
    expect(h).toContain('value="Celaya"');
    expect(h).not.toContain('<script>Estética');
  });

  it('un giro que no existe no se selecciona', async () => {
    const h = await (await pedir('/tienda/mira-tu-negocio/?n=Hola&g=xyz')).text();
    expect(h).not.toContain(' selected>');
  });

  it('sin diagonal redirige', async () => {
    const r = await pedir('/tienda/mira-tu-negocio?n=A');
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe('https://vorka.mx/tienda/mira-tu-negocio/?n=A');
  });

  it('cada giro trae 4 servicios y su premio', () => {
    for (const g of Object.values(GIROS)) { expect(g.servicios).toHaveLength(4); expect(g.premio).toBeTruthy(); }
  });

  it('«Lo quiero» manda el prospecto a Vorka OS con el giro y valida el WhatsApp', async () => {
    const pedidos = [];
    env.OS = { fetch: async r => { pedidos.push({ url: r.url, body: await r.json() }); return new Response(JSON.stringify({ ok: true, folio: 'VK-1' })); } };
    const mandar = body => worker.fetch(new Request('https://vorka.mx/api/mira-tu-negocio', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '2.2.2.2' }, body: JSON.stringify(body) }), env);
    let r = await mandar({ nombre: 'Laura', whatsapp: '461', negocio: 'Estética Lumbre', giro: 'estetica' });
    expect(r.status).toBe(400);
    expect(pedidos).toHaveLength(0);
    r = await mandar({ nombre: 'Laura', whatsapp: '461 123 4567', negocio: 'Estética Lumbre', giro: 'estetica', ciudad: 'Celaya' });
    expect(r.status).toBe(200);
    expect(pedidos[0].url).toBe('https://os.vorka.mx/api/publico/vorka/mira-negocio');
    expect(pedidos[0].body).toMatchObject({ nombre: 'Laura', negocio: 'Estética Lumbre', giro: 'Estética', ciudad: 'Celaya' });
    for (let i = 0; i < 5; i++) r = await mandar({ nombre: 'Laura', whatsapp: '4611234567', negocio: 'X Y' });
    expect(r.status).toBe(429);
  });

  it('Negocio Completo tiene el botón a Mira tu negocio', async () => {
    const h = await (await pedir('/tienda/negocio-completo/')).text();
    expect(h).toContain('href="/tienda/mira-tu-negocio/"');
  });
});
