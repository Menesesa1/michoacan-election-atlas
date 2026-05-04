// Fuente única de verdad para Lista Nominal de Michoacán.
// El estado tiene UNA SOLA lista nominal (~3.6M). Los cortes por distrito
// federal (11) o local (24) son distintas formas de agrupar las MISMAS
// secciones del catálogo INE — su suma debe coincidir con el total estatal.
//
// Este hook carga el padrón oficial DERFE 2026 y expone el total estatal
// invariante para validar cualquier agregación parcial.

import { useEffect, useState } from "react";
import { loadPadronOficial, type PadronOficial } from "@/lib/padron-loader";

const TOTAL_OFICIAL_REFERENCIA = 3_600_000; // Banda nominal (~3.6M)
const TOLERANCIA_PCT = 5; // ±5% se considera consistente con el oficial

export interface ListaNominalOficial {
  loading: boolean;
  total: number;             // LN estatal real desde padrón oficial
  hombres: number;
  mujeres: number;
  secciones: number;         // Debe ser 2825
  distritosFederales: number; // 11
  municipios: number;         // 113
  fuente: string;
  /** Valida si una LN agregada arbitraria es consistente con el total estatal. */
  esConsistente: (ln: number) => boolean;
  /** % de la LN estatal que representa una LN parcial. */
  cobertura: (ln: number) => number;
}

let cache: PadronOficial | null = null;

export function useListaNominalOficial(): ListaNominalOficial {
  const [padron, setPadron] = useState<PadronOficial | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let mounted = true;
    loadPadronOficial()
      .then((p) => {
        cache = p;
        if (mounted) {
          setPadron(p);
          setLoading(false);
        }
      })
      .catch(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const total = padron?.estado.lista_total ?? TOTAL_OFICIAL_REFERENCIA;

  return {
    loading,
    total,
    hombres: padron?.estado.lista_hombres ?? 0,
    mujeres: padron?.estado.lista_mujeres ?? 0,
    secciones: padron?.estado.secciones ?? 2825,
    distritosFederales: padron?.distritos.length ?? 11,
    municipios: padron?.municipios.length ?? 113,
    fuente: padron?.fuente ?? "INE-DERFE 2026",
    esConsistente: (ln: number) => {
      if (!total || !ln) return false;
      const deltaPct = Math.abs((ln - total) / total) * 100;
      return deltaPct <= TOLERANCIA_PCT;
    },
    cobertura: (ln: number) => (total > 0 ? (ln / total) * 100 : 0),
  };
}
