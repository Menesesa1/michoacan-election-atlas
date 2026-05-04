// Enriquece un SnapshotPayload con datos vivos: lista nominal oficial,
// inteligencia (sentimiento/CIB/alertas/narrativas), Trends y universo
// completo de contendientes esperados. Se usa en el Wizard de Estrategia
// para asegurarse de que la 360 está consumiendo TODO lo que tenemos.

import { supabase } from "@/integrations/supabase/client";
import { loadPadronOficial } from "@/lib/padron-loader";
import {
  contendientesEsperados,
  enlazarConRegistrados,
} from "@/lib/candidatos/contendientes-esperados";
import type { NivelEstrategia } from "@/data/estrategia-templates";
import type {
  SnapshotPayload,
  InteligenciaSnapshot,
  TrendsSnapshot,
} from "./types";

interface EnrichParams {
  nivel: NivelEstrategia;
  territorioLabel: string;
  /** id de candidato propio si está seleccionado, para Trends por candidato. */
  candidatoPropioId?: string;
  /** Filtra menciones por nombre del territorio (best-effort). */
  filtroEntidad?: string;
}

const SEVERIDAD_RANK = { baja: 1, media: 2, alta: 3, critica: 4 } as const;

export async function enriquecerSnapshot(
  base: SnapshotPayload,
  params: EnrichParams,
): Promise<SnapshotPayload> {
  const enriched: SnapshotPayload = { ...base };

  // 1) LN estatal oficial (única fuente de verdad)
  try {
    const padron = await loadPadronOficial();
    enriched.lista_nominal_estatal_oficial = padron.estado.lista_total;
  } catch {
    /* sin padrón cargado: no bloqueamos */
  }

  // 2) Universo de contendientes esperados (todos los partidos + indep)
  const slots = contendientesEsperados(params.nivel);
  try {
    // Mapea nivel de estrategia a nivel de candidatos en BD
    const { data: cands } = await supabase
      .from("candidatos")
      .select("id, nombre, partido, territorio, nivel")
      .eq("nivel", params.nivel);
    const filtrados = (cands ?? []).filter((c) => {
      if (!params.territorioLabel) return true;
      const t = params.territorioLabel.toLowerCase();
      return c.territorio?.toLowerCase().includes(t.split(" ")[0]);
    });
    enriched.contendientes_esperados = enlazarConRegistrados(slots, filtrados);
  } catch {
    enriched.contendientes_esperados = slots;
  }

  // 3) Inteligencia agregada (sentimiento, alertas, CIB, narrativas)
  try {
    const inteligencia: InteligenciaSnapshot = {};
    const filtroEnt = params.filtroEntidad ?? params.territorioLabel;

    const [sentRes, cibRes, alertasRes, narrRes] = await Promise.all([
      supabase
        .from("social_resumen")
        .select("sentimiento_promedio,pct_negativo,pct_positivo,total_menciones,top_temas,entidad_nombre")
        .order("generado_en", { ascending: false })
        .limit(8),
      supabase
        .from("cib_alertas")
        .select("severidad,entidad_nombre,detectada_en")
        .order("detectada_en", { ascending: false })
        .limit(20),
      supabase
        .from("alertas_crisis")
        .select("prioridad,distrito,detectada_en")
        .order("detectada_en", { ascending: false })
        .limit(20),
      supabase
        .from("narrativas_sugeridas")
        .select("mensaje,tono,urgencia,entidad_nombre,usado")
        .eq("usado", false)
        .order("urgencia", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    // Sentimiento ponderado por menciones (filtrando por entidad si aplica)
    const sentRows = (sentRes.data ?? []).filter((r) =>
      filtroEnt
        ? r.entidad_nombre?.toLowerCase().includes(filtroEnt.toLowerCase())
        : true,
    );
    const finalSent = sentRows.length > 0 ? sentRows : sentRes.data ?? [];
    const totalMenc = finalSent.reduce((s, r) => s + (r.total_menciones ?? 0), 0);
    if (totalMenc > 0) {
      inteligencia.total_menciones = totalMenc;
      inteligencia.sentimiento_promedio =
        finalSent.reduce(
          (a, r) => a + (r.sentimiento_promedio ?? 0) * (r.total_menciones ?? 0),
          0,
        ) / totalMenc;
      inteligencia.pct_negativo =
        finalSent.reduce((a, r) => a + (r.pct_negativo ?? 0) * (r.total_menciones ?? 0), 0) / totalMenc;
      inteligencia.pct_positivo =
        finalSent.reduce((a, r) => a + (r.pct_positivo ?? 0) * (r.total_menciones ?? 0), 0) / totalMenc;
      // top temas: combinar
      const temaCount = new Map<string, number>();
      for (const r of finalSent) {
        const arr = (r.top_temas as { tema: string; n: number }[] | null) ?? [];
        for (const t of arr) temaCount.set(t.tema, (temaCount.get(t.tema) ?? 0) + (t.n ?? 1));
      }
      inteligencia.top_temas = Array.from(temaCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tema, n]) => ({ tema, n }));
    }

    // CIB
    const cibRows = (cibRes.data ?? []).filter((r) =>
      filtroEnt ? r.entidad_nombre?.toLowerCase().includes(filtroEnt.toLowerCase()) : true,
    );
    if (cibRows.length > 0) {
      inteligencia.cib_alertas_activas = cibRows.length;
      const maxRank = Math.max(...cibRows.map((r) => SEVERIDAD_RANK[r.severidad as keyof typeof SEVERIDAD_RANK] ?? 1));
      inteligencia.cib_severidad_max = (Object.entries(SEVERIDAD_RANK).find(([, v]) => v === maxRank)?.[0] ?? "baja") as InteligenciaSnapshot["cib_severidad_max"];
    }

    // Alertas crisis
    const alertaRows = (alertasRes.data ?? []).filter((r) =>
      filtroEnt ? r.distrito?.toLowerCase().includes(filtroEnt.toLowerCase()) || r.distrito?.includes("Estatal") : true,
    );
    if (alertaRows.length > 0) {
      inteligencia.alertas_crisis_activas = alertaRows.length;
      inteligencia.alertas_urgentes = alertaRows.filter((r) => r.prioridad === "urgente").length;
    }

    // Narrativas pendientes
    const narrRows = (narrRes.data ?? []).filter((r) =>
      filtroEnt ? r.entidad_nombre?.toLowerCase().includes(filtroEnt.toLowerCase()) : true,
    );
    const narrFinal = narrRows.length > 0 ? narrRows : narrRes.data ?? [];
    if (narrFinal.length > 0) {
      inteligencia.narrativas_pendientes = narrFinal.slice(0, 5).map((n) => ({
        mensaje: n.mensaje,
        tono: n.tono ?? undefined,
        urgencia: n.urgencia,
      }));
    }

    if (Object.keys(inteligencia).length > 0) {
      enriched.inteligencia = inteligencia;
    }
  } catch {
    /* inteligencia opcional */
  }

  // 4) Trends — preferir candidato propio; fallback a estatal
  try {
    const trends: TrendsSnapshot = {};
    if (params.candidatoPropioId) {
      const { data } = await supabase
        .from("trends_candidato")
        .select("termino,promedio_interes,pico_interes,contexto_narrativo,related_top")
        .eq("candidato_id", params.candidatoPropioId)
        .order("ejecutada_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        trends.termino = data.termino;
        trends.promedio_interes = data.promedio_interes ?? undefined;
        trends.pico_interes = data.pico_interes ?? undefined;
        trends.contexto_narrativo = data.contexto_narrativo ?? undefined;
        trends.related_top = ((data.related_top as { query: string; value?: number }[] | null) ?? []).slice(0, 5);
      }
    }
    if (!trends.termino) {
      // Fallback estatal
      const { data } = await supabase
        .from("trends_estatal")
        .select("termino,valor_interes,variacion_pct,contexto_narrativo,related")
        .order("ejecutada_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        trends.termino = data.termino;
        trends.promedio_interes = data.valor_interes ?? undefined;
        trends.variacion_pct = data.variacion_pct ?? undefined;
        trends.contexto_narrativo = data.contexto_narrativo ?? undefined;
        trends.related_top = ((data.related as { query: string; value?: number }[] | null) ?? []).slice(0, 5);
      }
    }
    if (trends.termino) enriched.trends = trends;
  } catch {
    /* trends opcional */
  }

  return enriched;
}
