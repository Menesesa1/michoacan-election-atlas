// Calendario Electoral Michoacán 2026-2027
// Fechas ESTIMADAS con base en proceso 2024 (IEM/INE). Marcar como tentativas
// hasta que el IEM publique el acuerdo oficial del proceso 2026-2027.
//
// Lógica de fases para campañas (basado en LEGIPE y Código Electoral Michoacán):
// - Aspirantes / Procesos internos: ~6 meses antes de jornada
// - Precampañas: ~febrero del año electoral
// - Intercampaña: marzo
// - Campañas constitucionales: abril-mayo
// - Jornada electoral: 1er domingo de junio
// - Cómputos y validación: junio
// - Toma de protesta: septiembre

import type { FaseCandidatura } from "./candidatos/fase";

export type EtapaCalendario =
  | "preparacion"
  | "aspirantes"
  | "precampana"
  | "intercampana"
  | "campana"
  | "veda"
  | "jornada"
  | "computos"
  | "post_eleccion";

export interface HitoCalendario {
  id: string;
  fecha_inicio: string; // ISO YYYY-MM-DD
  fecha_fin?: string; // ISO YYYY-MM-DD (si es periodo)
  etapa: EtapaCalendario;
  titulo: string;
  descripcion: string;
  cargos: ("gobernador" | "diputados_locales" | "ayuntamientos" | "diputados_federales" | "senadores")[];
  fuente: string;
  oficial: boolean; // false = estimado
  fundamento?: string; // Artículo CEEMO / norma aplicable
  reformado?: boolean; // true = modificado por Gaceta Parlamentaria 115-07 (27 mayo 2026)
}

export const ETAPA_LABEL: Record<EtapaCalendario, string> = {
  preparacion: "Preparación del proceso",
  aspirantes: "Aspirantes / Internas partidistas",
  precampana: "Precampañas oficiales",
  intercampana: "Intercampaña",
  campana: "Campañas constitucionales",
  veda: "Veda electoral",
  jornada: "Jornada electoral",
  computos: "Cómputos y validación",
  post_eleccion: "Post-elección",
};

export const ETAPA_COLOR: Record<EtapaCalendario, string> = {
  preparacion: "bg-muted text-muted-foreground border-border",
  aspirantes: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  precampana: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  intercampana: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  campana: "bg-primary/15 text-primary border-primary/40",
  veda: "bg-destructive/15 text-destructive border-destructive/40",
  jornada: "bg-green-500/15 text-green-400 border-green-500/40",
  computos: "bg-purple-500/15 text-purple-400 border-purple-500/40",
  post_eleccion: "bg-muted text-muted-foreground border-border",
};

// Mapeo etapa calendario → fase candidatura (lo que aplica a un candidato individual)
export const ETAPA_TO_FASE: Record<EtapaCalendario, FaseCandidatura | null> = {
  preparacion: "aspirante",
  aspirantes: "aspirante",
  precampana: "precampana",
  intercampana: "precampana",
  campana: "campana",
  veda: "campana",
  jornada: "campana",
  computos: "campana",
  post_eleccion: "electo",
};

// Fechas estimadas Proceso Electoral Local Michoacán 2026-2027
// Jornada estimada: domingo 6 de junio de 2027 (1er domingo de junio)
export const CALENDARIO_MICHOACAN_2027: HitoCalendario[] = [
  {
    id: "iem-inicio-proceso",
    fecha_inicio: "2026-09-04",
    etapa: "preparacion",
    titulo: "Inicio formal del proceso electoral local 2026-2027",
    descripcion:
      "El IEM declara el inicio del proceso electoral local. Comienzan plazos para registro de partidos, definición de distritación y financiamiento.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "IEM Michoacán (estimado)",
    oficial: false,
  },
  {
    id: "internas-aspirantes",
    fecha_inicio: "2026-10-01",
    fecha_fin: "2027-01-15",
    etapa: "aspirantes",
    titulo: "Procesos internos de partidos · Aspirantes",
    descripcion:
      "Fase clave: los aspirantes buscan la candidatura dentro de su partido. Aquí se decide quién compite. Los partidos evalúan perfiles, redes, trayectoria y potencia mediática.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "Estatutos de cada partido",
    oficial: false,
  },
  {
    id: "registro-precandidatos",
    fecha_inicio: "2027-01-20",
    fecha_fin: "2027-02-04",
    etapa: "aspirantes",
    titulo: "Registro de precandidatos ante partidos / IEM",
    descripcion:
      "Los aspirantes formalizan su registro como precandidatos ante su partido y/o autoridad electoral.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "Código Electoral Michoacán (estimado)",
    oficial: false,
  },
  {
    id: "precampana-gob",
    fecha_inicio: "2027-02-05",
    fecha_fin: "2027-03-15",
    etapa: "precampana",
    titulo: "Precampañas oficiales — Gubernatura",
    descripcion:
      "Periodo de precampaña registrado ante el IEM. Los precandidatos pueden hacer actos para obtener la candidatura sin pedir el voto explícito.",
    cargos: ["gobernador"],
    fuente: "IEM Michoacán (estimado, ~40 días)",
    oficial: false,
  },
  {
    id: "precampana-locales",
    fecha_inicio: "2027-02-15",
    fecha_fin: "2027-03-15",
    etapa: "precampana",
    titulo: "Precampañas oficiales — Diputados locales y ayuntamientos",
    descripcion: "Periodo de precampaña para diputaciones locales y ayuntamientos.",
    cargos: ["diputados_locales", "ayuntamientos"],
    fuente: "IEM Michoacán (estimado, ~30 días)",
    oficial: false,
  },
  {
    id: "intercampana",
    fecha_inicio: "2027-03-16",
    fecha_fin: "2027-04-04",
    etapa: "intercampana",
    titulo: "Intercampaña",
    descripcion:
      "Periodo entre precampaña y campaña. No se pueden realizar actos de campaña ni propaganda electoral.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "IEM Michoacán (estimado)",
    oficial: false,
  },
  {
    id: "registro-candidatos",
    fecha_inicio: "2027-03-20",
    fecha_fin: "2027-04-03",
    etapa: "intercampana",
    titulo: "Registro de candidaturas ante el IEM",
    descripcion: "Plazo para que partidos y coaliciones registren candidaturas oficiales.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "IEM Michoacán (estimado)",
    oficial: false,
  },
  {
    id: "campana-gob",
    fecha_inicio: "2027-04-05",
    fecha_fin: "2027-06-02",
    etapa: "campana",
    titulo: "Campaña constitucional — Gubernatura",
    descripcion:
      "Campaña oficial. Los candidatos piden el voto y enfrentan a candidatos de otros partidos. ~60 días.",
    cargos: ["gobernador"],
    fuente: "IEM Michoacán (estimado, ~60 días)",
    oficial: false,
  },
  {
    id: "campana-locales",
    fecha_inicio: "2027-04-20",
    fecha_fin: "2027-06-02",
    etapa: "campana",
    titulo: "Campaña constitucional — Diputados locales y ayuntamientos",
    descripcion: "Campaña oficial para diputaciones locales y ayuntamientos. ~45 días.",
    cargos: ["diputados_locales", "ayuntamientos"],
    fuente: "IEM Michoacán (estimado, ~45 días)",
    oficial: false,
  },
  {
    id: "veda",
    fecha_inicio: "2027-06-03",
    fecha_fin: "2027-06-05",
    etapa: "veda",
    titulo: "Veda electoral",
    descripcion: "3 días previos a la jornada. Prohibida toda propaganda y difusión de encuestas.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "INE/IEM (estimado)",
    oficial: false,
  },
  {
    id: "jornada",
    fecha_inicio: "2027-06-06",
    etapa: "jornada",
    titulo: "Jornada electoral",
    descripcion:
      "Día de la elección: gobernador, 24 diputados locales (16 MR + 8 RP) y 113 ayuntamientos. Casillas 8:00–18:00.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "IEM Michoacán (1er domingo de junio, estimado)",
    oficial: false,
  },
  {
    id: "computos",
    fecha_inicio: "2027-06-09",
    fecha_fin: "2027-06-12",
    etapa: "computos",
    titulo: "Cómputos distritales y municipales",
    descripcion: "Sesiones de cómputo en consejos distritales y municipales. Asignación de RP.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "IEM Michoacán (estimado)",
    oficial: false,
  },
  {
    id: "validacion",
    fecha_inicio: "2027-06-15",
    fecha_fin: "2027-08-31",
    etapa: "post_eleccion",
    titulo: "Calificación e impugnaciones",
    descripcion: "Tribunal Electoral Michoacán resuelve impugnaciones y entrega constancias definitivas.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "TEEM (estimado)",
    oficial: false,
  },
  {
    id: "toma-protesta-ayto",
    fecha_inicio: "2027-09-01",
    etapa: "post_eleccion",
    titulo: "Toma de protesta · Ayuntamientos",
    descripcion: "Inicio de la administración municipal 2027-2030.",
    cargos: ["ayuntamientos"],
    fuente: "Constitución Michoacán",
    oficial: false,
  },
  {
    id: "toma-protesta-gob",
    fecha_inicio: "2027-10-01",
    etapa: "post_eleccion",
    titulo: "Toma de protesta · Gobernador y diputados locales",
    descripcion: "Inicio del periodo constitucional 2027-2033 (gob) y 2027-2030 (dip).",
    cargos: ["gobernador", "diputados_locales"],
    fuente: "Constitución Michoacán",
    oficial: false,
  },
];

/** Devuelve el hito activo en la fecha dada (o el más cercano en el futuro). */
export function getHitoActivo(fecha: Date = new Date()): {
  activo: HitoCalendario | null;
  proximo: HitoCalendario | null;
  pasado: HitoCalendario | null;
} {
  const f = fecha.toISOString().slice(0, 10);
  let activo: HitoCalendario | null = null;
  let proximo: HitoCalendario | null = null;
  let pasado: HitoCalendario | null = null;

  for (const h of CALENDARIO_MICHOACAN_2027) {
    const ini = h.fecha_inicio;
    const fin = h.fecha_fin ?? h.fecha_inicio;
    if (f >= ini && f <= fin) {
      // Prioriza el más específico (con fin más cercano)
      if (!activo || fin < (activo.fecha_fin ?? activo.fecha_inicio)) {
        activo = h;
      }
    } else if (ini > f) {
      if (!proximo || ini < proximo.fecha_inicio) proximo = h;
    } else {
      if (!pasado || (h.fecha_fin ?? h.fecha_inicio) > (pasado.fecha_fin ?? pasado.fecha_inicio)) pasado = h;
    }
  }
  return { activo, proximo, pasado };
}

/** Días restantes entre hoy y una fecha objetivo. Negativo si ya pasó. */
export function diasHasta(fechaISO: string, desde: Date = new Date()): number {
  const target = new Date(fechaISO + "T00:00:00");
  const ms = target.getTime() - desde.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Etapa actual derivada del calendario (para banner/contexto global). */
export function getEtapaActual(fecha: Date = new Date()): {
  etapa: EtapaCalendario;
  faseCandidato: FaseCandidatura;
  hito: HitoCalendario | null;
  diasParaProximo: number | null;
  proximo: HitoCalendario | null;
} {
  const { activo, proximo } = getHitoActivo(fecha);
  const etapa: EtapaCalendario = activo?.etapa ?? "preparacion";
  return {
    etapa,
    faseCandidato: ETAPA_TO_FASE[etapa] ?? "aspirante",
    hito: activo,
    diasParaProximo: proximo ? diasHasta(proximo.fecha_inicio, fecha) : null,
    proximo,
  };
}

/** Formatea un rango de fechas en español compacto. */
export function formatearRango(inicio: string, fin?: string): string {
  const fmt = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  if (!fin || fin === inicio) return fmt(inicio);
  return `${fmt(inicio)} → ${fmt(fin)}`;
}
