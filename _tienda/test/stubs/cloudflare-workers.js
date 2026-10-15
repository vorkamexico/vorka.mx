// En Vitest (Node) no existe cloudflare:workers; basta una clase base con env
export class WorkerEntrypoint { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }
