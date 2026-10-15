// D1 falso sobre node:sqlite para probar el modelo con las migraciones reales, sin red ni Wrangler
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '..', 'migrations');

class Stmt {
  constructor(db, sql) { this.db = db; this.sql = sql; this.p = []; }
  bind(...p) { this.p = p; return this; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.p) }; }
  async first() { return this.db.prepare(this.sql).get(...this.p) ?? null; }
  async run() { const r = this.db.prepare(this.sql).run(...this.p); return { meta: { changes: Number(r.changes) } }; }
}

export function d1({ seed = true } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const f of readdirSync(DIR).filter(f => f.endsWith('.sql')).sort())
    if (seed || !f.includes('seed')) db.exec(readFileSync(join(DIR, f), 'utf8'));
  return {
    raw: db,
    prepare: sql => new Stmt(db, sql),
    async batch(stmts) {
      db.exec('BEGIN');
      try { const out = []; for (const s of stmts) out.push(await s.run()); db.exec('COMMIT'); return out; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}
