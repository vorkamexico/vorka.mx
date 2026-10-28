// Página pública de cada integrante: vorka.mx/equipo/<código> (opcional, la prende cada quien desde Vorka OS)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { normalizarWhatsapp } from '../src/equipo-pagina.js';

let env, A, code;
const ANA = 'ana@vorka.mx';
const FOTO = '/9j/' + 'A'.repeat(200);
const pedir = (ruta, ua = 'Mozilla/5.0 (iPhone)') => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual', headers: { 'user-agent': ua, 'cf-connecting-ip': '1.2.3.4' } }), env);
beforeEach(async () => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"x"}')));
  A = new Admin({}, env);
  code = await A.codigoPuntos(ANA, 'Ana López');
});
afterEach(() => vi.unstubAllGlobals());

describe('página del equipo', () => {
  it('sin página prendida, el código lleva a la tienda con su código; un código que no existe da 404', async () => {
    const r = await pedir(`/equipo/${code}`);
    expect(r.status).toBe(302);
    expect(r.headers.get('location')).toBe(`/tienda/?ref=${code}`);
    expect((await pedir('/equipo/NOEXISTE99')).status).toBe(404);
    expect((await A.perfilEquipo(ANA)).activo).toBe(false);
  });

  it('con página: foto, nombre, 5 %, cookie de recomendación, catálogo con su código, agendar, WhatsApp y noindex', async () => {
    expect(await A.guardarPerfil(ANA, { nombre: 'Ana López', rol: 'Embajador(a) de Vorka México', frase: 'Te ayudo a elegir tu simulador.', whatsapp: '461 123 4567', foto: FOTO })).toMatchObject({ ok: true, url: `https://vorka.mx/equipo/${code}` });
    const r = await pedir(`/equipo/${code.toLowerCase()}`);
    expect(r.status).toBe(200);
    expect(r.headers.get('set-cookie')).toContain(`vorka_ref=${code}`);
    const h = await r.text();
    for (const t of ['Ana López', 'Te ayudo a elegir tu simulador.', '5 %', `/agenda/?ref=${code}`, 'https://wa.me/524611234567', `/equipo/${code}/contacto.vcf`, `/equipo/${code}/foto.jpg?v=1`, 'noindex', 'no están afiliados'])
      expect(h).toContain(t);
    expect(h).toMatch(new RegExp(`href="[^"]+\\?ref=${code}"`));   // productos con su código
    expect(h).not.toContain(ANA);
    const f = await pedir(`/equipo/${code}/foto.jpg`);
    expect(f.headers.get('content-type')).toBe('image/jpeg');
    const v = await (await pedir(`/equipo/${code}/contacto.vcf`)).text();
    expect(v).toContain('FN:Ana López'); expect(v).toContain('TEL;TYPE=CELL:+524611234567'); expect(v).toContain(`?ref=${code}`);
    expect(await A.perfilEquipo(ANA)).toMatchObject({ activo: true, whatsapp: '4611234567', con_foto: true });
    // la visita cuenta en «personas que abrieron tu liga»
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM puntos_visitas WHERE code = ?').get(code).n).toBe(1);
  });

  it('con el código público (alias) abre la misma página; sin foto ni WhatsApp no los muestra; apagarla la quita', async () => {
    await A.cambiarCodigo(ANA, 'ANAVENDE');
    await A.guardarPerfil(ANA, { nombre: 'Ana López' });
    const h = await (await pedir('/equipo/ANAVENDE')).text();
    expect(h).toContain('Mi código: <b>ANAVENDE</b>');
    expect(h).not.toContain('Escribirme por WhatsApp'); expect(h).not.toContain('foto.jpg');
    expect((await pedir(`/equipo/${code}`)).status).toBe(200);   // el original también
    expect((await pedir('/equipo/ANAVENDE/foto.jpg')).status).toBe(404);
    await A.borrarPerfil(ANA);
    expect((await pedir('/equipo/ANAVENDE')).status).toBe(302);
  });

  it('valida lo que llega de Vorka OS', async () => {
    expect(normalizarWhatsapp('4611234567')).toBe('524611234567');
    expect(normalizarWhatsapp('+52 1 461 123 4567')).toBe('524611234567');
    expect(normalizarWhatsapp('123')).toBeUndefined();
    expect((await A.guardarPerfil(ANA, { nombre: 'Ana', whatsapp: '123' })).ok).toBe(false);
    expect((await A.guardarPerfil(ANA, { nombre: 'Ana', foto: 'iVBORw0KGgo=' })).ok).toBe(false);   // PNG: no
    expect((await A.guardarPerfil(ANA, { nombre: '' })).ok).toBe(false);
    expect((await A.guardarPerfil('nadie@mail.com', { nombre: 'X' })).ok).toBe(false);
    // texto con HTML se escapa
    await A.guardarPerfil(ANA, { nombre: 'Ana <script>', frase: '<img src=x onerror=1>' });
    const h = await (await pedir(`/equipo/${code}`)).text();
    expect(h).not.toContain('<img src=x'); expect(h).toContain('&lt;img');
  });
});
