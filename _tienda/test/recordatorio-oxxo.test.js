// Recordatorio de ficha OXXO sin pagar (src/recordatorio-oxxo.js) y SPEI fuera del pago (nov 2026)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import { crearOrden } from '../src/modelo.js';
import { recordatoriosOxxo, correoFichaOxxo, OXXO } from '../src/recordatorio-oxxo.js';
import { recordatoriosAutomaticos } from '../src/recordatorio.js';

let env, correos, pi;
const HORA = 3600e3;
// 18:00 UTC = 12:00 en el centro de México
const MEDIODIA = Date.parse('2026-11-27T18:00:00Z');
const vence = Math.floor((MEDIODIA + 40 * HORA) / 1000);
const fichaPi = (extra = {}) => ({ id: 'pi_oxxo', status: 'requires_action', next_action: { type: 'oxxo_display_details', oxxo_display_details: { expires_after: vence, hosted_voucher_url: 'https://payments.stripe.com/oxxo/voucher/x', number: '12345678901234' } }, ...extra });

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), RESEND_API_KEY: 're_x', STRIPE_SECRET_KEY: 'sk_test_x' };
  env.DB.raw.exec('UPDATE products SET activo = 1;');
  correos = []; pi = fichaPi();
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    if (String(url).includes('api.resend.com')) { correos.push(JSON.parse(init.body)); return new Response('{"id":"em"}'); }
    if (String(url).includes('/payment_intents/')) return new Response(JSON.stringify(pi));
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function oxxo(horas, email = 'ana@mail.com', { estado = 'pending', metodo = 'oxxo' } = {}) {
  const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email, nombre: 'Ana López' });
  env.DB.raw.prepare('UPDATE orders SET created_at = ?, metodo_pago = ?, provider_payment_id = ?, estado = ? WHERE id = ?')
    .run(new Date(MEDIODIA - horas * HORA).toISOString(), metodo, 'pi_oxxo', estado, o.id);
  return o;
}
const orden = id => env.DB.raw.prepare('SELECT * FROM orders WHERE id = ?').get(id);

describe('recordatorio de ficha OXXO', () => {
  it('manda un solo correo con el botón a su ficha, la referencia y la fecha de vencimiento', async () => {
    const o = await oxxo(22);
    const r = await recordatoriosOxxo(env, MEDIODIA);
    expect(r).toMatchObject({ revisadas: 1, enviados: 1 });
    expect(correos).toHaveLength(1);
    expect(correos[0].to).toEqual(['ana@mail.com']);
    expect(correos[0].subject).toMatch(/^Tu ficha de OXXO vence el domingo 29 de noviembre$/);
    expect(correos[0].text).toContain('https://payments.stripe.com/oxxo/voucher/x');
    expect(correos[0].text).toContain('12345678901234');
    expect(correos[0].text).not.toMatch(/retomar|SPEI/);
    expect(orden(o.id)).toMatchObject({ seguimientos: 1, estado: 'pending' });
    // No se repite
    await recordatoriosOxxo(env, MEDIODIA + 2 * HORA);
    expect(correos).toHaveLength(1);
    // Y el recordatorio de compra sin terminar no toca una ficha que sigue vigente
    await recordatoriosAutomaticos(env, MEDIODIA + 2 * HORA, { desde: '2026-01-01T00:00:00.000Z' });
    expect(correos).toHaveLength(1);
  });

  it('espera ~20 h, no manda fuera de horario, ni si ya venció, ni si ya pagó o compró después', async () => {
    await oxxo(5);                                   // muy reciente
    expect((await recordatoriosOxxo(env, MEDIODIA)).enviados).toBe(0);
    await oxxo(22, 'beto@mail.com');
    expect((await recordatoriosOxxo(env, Date.parse('2026-11-28T06:00:00Z'))).revisadas).toBe(0);   // 0:00 en México
    pi = fichaPi({ status: 'succeeded' });           // ya pagada en Stripe
    expect((await recordatoriosOxxo(env, MEDIODIA)).enviados).toBe(0);
    pi = fichaPi(); pi.next_action.oxxo_display_details.expires_after = Math.floor((MEDIODIA - HORA) / 1000);
    expect((await recordatoriosOxxo(env, MEDIODIA)).enviados).toBe(0);
    // Pagó otra compra con tarjeta después
    pi = fichaPi();
    const n = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'beto@mail.com', nombre: 'Beto' });
    env.DB.raw.prepare("UPDATE orders SET estado = 'paid', created_at = ? WHERE id = ?").run(new Date(MEDIODIA - HORA).toISOString(), n.id);
    expect((await recordatoriosOxxo(env, MEDIODIA)).enviados).toBe(0);
    expect(correos).toHaveLength(0);
    expect(OXXO.horario).toEqual([9, 20]);
  });

  it('si el correo falla, la orden queda como estaba para reintentar', async () => {
    const o = await oxxo(22);
    vi.stubGlobal('fetch', vi.fn(async url => String(url).includes('/payment_intents/') ? new Response(JSON.stringify(pi)) : new Response('mal', { status: 500 })));
    expect((await recordatoriosOxxo(env, MEDIODIA)).enviados).toBe(0);
    expect(orden(o.id)).toMatchObject({ seguimientos: 0, recordatorio_at: null });
  });

  it('el texto no promete SPEI', () => {
    const c = correoFichaOxxo({ id: 'o1', nombre: 'Ana', monto_centavos: 24900 }, [{ nombre: 'Simulador ECOEMS' }], pi.next_action.oxxo_display_details);
    expect(c.texto).toMatch(/\$249/);
    expect(c.html).not.toMatch(/SPEI/);
  });
});
