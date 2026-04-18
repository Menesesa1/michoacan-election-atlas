// Helper centralizado para generar los 3 análisis (perfil, OSINT, discurso)
// de un candidato y persistirlos en candidato_analisis.
// Se usa al registrar un candidato (CandidatoForm) y desde el seed de Candidatos.tsx.

import { supabase } from "@/integrations/supabase/client";
import type { Candidato, TipoAnalisis } from "./types";

export const TIPOS_ANALISIS: TipoAnalisis[] = ["perfil", "osint", "discurso"];

export interface AutoAnalisisProgreso {
  candidato_id: string;
  tipo: TipoAnalisis;
  estado: "ok" | "error";
  error?: string;
}

interface CandidatoAnalizable {
  id: string;
  nombre: string;
  partido: string;
  nivel: string;
  territorio: string;
  cargo_buscado?: string | null;
  bio_breve?: string | null;
  redes?: Record<string, string | undefined> | null;
  notas?: string | null;
  war_room?: import("./types").WarRoomMiembro[] | null;
  trayectoria?: import("./types").TrayectoriaHito[] | null;
  metricas_redes?: import("./types").MetricasRedes | null;
}

/** Genera UN tipo de análisis y lo guarda. Devuelve true si tuvo éxito. */
export async function generarYGuardarAnalisis(
  candidato: CandidatoAnalizable,
  tipo: TipoAnalisis,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("analizar-candidato", {
      body: {
        tipo,
        candidato: {
          nombre: candidato.nombre,
          partido: candidato.partido,
          nivel: candidato.nivel,
          territorio: candidato.territorio,
          cargo_buscado: candidato.cargo_buscado ?? undefined,
          bio_breve: candidato.bio_breve ?? undefined,
          redes: candidato.redes ?? undefined,
          notas: candidato.notas ?? undefined,
          war_room: candidato.war_room ?? undefined,
          trayectoria: candidato.trayectoria ?? undefined,
          metricas_redes: candidato.metricas_redes ?? undefined,
        },
      },
    });
    if (error) throw error;
    const payload = data as { output?: unknown; model?: string; error?: string };
    if (payload.error) throw new Error(payload.error);
    if (!payload.output) throw new Error("Sin salida del modelo");

    const { error: insertError } = await supabase.from("candidato_analisis").insert([{
      candidato_id: candidato.id,
      user_id: userId,
      tipo,
      output_json: payload.output as never,
      model: payload.model ?? "google/gemini-2.5-flash",
    }]);
    if (insertError) throw insertError;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/**
 * Genera los 3 análisis en serie (para no saturar rate limits).
 * onProgress se invoca después de cada tipo terminado.
 */
export async function generarTodosLosAnalisis(
  candidato: CandidatoAnalizable,
  userId: string,
  onProgress?: (p: AutoAnalisisProgreso) => void,
): Promise<AutoAnalisisProgreso[]> {
  const resultados: AutoAnalisisProgreso[] = [];
  for (const tipo of TIPOS_ANALISIS) {
    const r = await generarYGuardarAnalisis(candidato, tipo, userId);
    const progreso: AutoAnalisisProgreso = {
      candidato_id: candidato.id,
      tipo,
      estado: r.ok ? "ok" : "error",
      error: r.error,
    };
    resultados.push(progreso);
    onProgress?.(progreso);
  }
  return resultados;
}

/** Devuelve los tipos de análisis que YA existen para una lista de candidatos. */
export async function obtenerTiposExistentes(
  candidatoIds: string[],
): Promise<Record<string, Set<TipoAnalisis>>> {
  const result: Record<string, Set<TipoAnalisis>> = {};
  if (candidatoIds.length === 0) return result;
  const { data } = await supabase
    .from("candidato_analisis")
    .select("candidato_id, tipo")
    .in("candidato_id", candidatoIds);
  for (const id of candidatoIds) result[id] = new Set();
  for (const row of data ?? []) {
    const set = result[row.candidato_id] ?? new Set<TipoAnalisis>();
    set.add(row.tipo as TipoAnalisis);
    result[row.candidato_id] = set;
  }
  return result;
}

/** Devuelve los tipos faltantes para UN candidato. */
export async function tiposFaltantes(candidatoId: string): Promise<TipoAnalisis[]> {
  const map = await obtenerTiposExistentes([candidatoId]);
  const presentes = map[candidatoId] ?? new Set<TipoAnalisis>();
  return TIPOS_ANALISIS.filter((t) => !presentes.has(t));
}
