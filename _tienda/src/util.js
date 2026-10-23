// Utilidades compartidas (mismo estilo que vorka-os/src/util.js)

export const ahoraISO = () => new Date().toISOString();

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
export const fail = (msg, status = 400) => json({ error: msg }, status);

export const all = async (env, sql, ...p) => (await env.DB.prepare(sql).bind(...p).all()).results;
export const one = (env, sql, ...p) => env.DB.prepare(sql).bind(...p).first();
export const run = (env, sql, ...p) => env.DB.prepare(sql).bind(...p).run();

export const enc = new TextEncoder();
export const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
export const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
export const aleatorio = (n = 32) => hex(crypto.getRandomValues(new Uint8Array(n)));
export function iguales(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Para registros: nunca guardar correos completos. "ana.lopez@gmail.com" → "an***@gmail.com"
export const correoOculto = e => {
  const [u, d] = String(e || '').split('@');
  return d ? `${u.slice(0, 2)}***@${d}` : '***';
};

export const pesos = centavos => '$' + (Number(centavos || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' MXN';

// CLABE interbancaria: 18 dígitos; el último es el verificador (pesos 3, 7, 1 sobre los primeros 17, módulo 10)
export function clabeValida(clabe) {
  const c = String(clabe || '').replace(/\s+/g, '');
  if (!/^\d{18}$/.test(c)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(c[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(c[17]);
}
