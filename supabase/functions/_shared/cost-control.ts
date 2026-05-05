// Helpers compartidos para control de costos y prevención de loops.
// Cualquier edge function que llame a APIs externas debe:
//  1. Tomar un lock con `withPipelineLock` para evitar runs solapados.
//  2. Registrar cada llamada externa con `logApiCall` (incluye costo estimado).
//
// Costos estimados (USD) por defecto — ajustar conforme a facturas reales.
// Fuentes: SerpApi $50/5k = $0.01, Perplexity sonar ~ $0.001/1k tokens,
// Lovable AI gemini-flash ~ $0.0001/1k tokens, Firecrawl scrape ~ $0.002.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Servicio = "serpapi" | "perplexity" | "lovable_ai" | "firecrawl" | "otro";

const COSTO_DEFAULT: Record<Servicio, number> = {
  serpapi: 0.01,
  perplexity: 0.005,
  lovable_ai: 0.0005,
  firecrawl: 0.002,
  otro: 0,
};

const sb = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

export interface LogApiCallParams {
  servicio: Servicio;
  funcion: string;
  operacion?: string;
  runId?: string | null;
  costoUsd?: number;
  tokensIn?: number;
  tokensOut?: number;
  duracionMs?: number;
  status?: "ok" | "error" | "rate_limited" | "cache_hit";
  cacheHit?: boolean;
  metadata?: Record<string, unknown>;
}

/** Registra una llamada a API externa. Nunca lanza — fallar logging no debe romper el pipeline. */
export async function logApiCall(p: LogApiCallParams): Promise<void> {
  try {
    const costo = p.costoUsd ?? (p.cacheHit ? 0 : COSTO_DEFAULT[p.servicio] ?? 0);
    await sb().rpc("registrar_uso_api", {
      _servicio: p.servicio,
      _funcion: p.funcion,
      _operacion: p.operacion ?? null,
      _run_id: p.runId ?? null,
      _costo: costo,
      _tokens_in: p.tokensIn ?? null,
      _tokens_out: p.tokensOut ?? null,
      _duracion_ms: p.duracionMs ?? null,
      _status: p.status ?? "ok",
      _cache_hit: p.cacheHit ?? false,
      _metadata: p.metadata ?? {},
    });
  } catch (e) {
    console.error("[cost-control] logApiCall failed", e);
  }
}

/** Ejecuta `fn` solo si se obtiene el lock. Si otro proceso ya corre, retorna `skipped`. */
export async function withPipelineLock<T>(
  nombre: string,
  fn: () => Promise<T>,
): Promise<{ ok: true; result: T } | { ok: false; reason: "locked" }> {
  const client = sb();
  const { data: acquired, error } = await client.rpc("intentar_lock_pipeline", { _nombre: nombre });
  if (error) {
    console.error("[cost-control] lock error", error);
    // En caso de error de lock, dejamos pasar para no bloquear operaciones legítimas.
    const result = await fn();
    return { ok: true, result };
  }
  if (!acquired) {
    console.warn(`[cost-control] pipeline "${nombre}" already running — skipping`);
    return { ok: false, reason: "locked" };
  }
  try {
    const result = await fn();
    return { ok: true, result };
  } finally {
    try {
      await client.rpc("liberar_lock_pipeline", { _nombre: nombre });
    } catch (e) {
      console.error("[cost-control] unlock failed", e);
    }
  }
}

/** Cap duro: aborta si `count` excede `max`. Útil para evitar loops accidentales. */
export function assertCap(count: number, max: number, label: string): void {
  if (count > max) {
    throw new Error(`Cap excedido en ${label}: ${count} > ${max}. Posible loop — abortando.`);
  }
}
