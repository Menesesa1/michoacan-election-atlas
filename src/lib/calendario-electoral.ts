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

// Calendario oficial Proceso Electoral Local Michoacán 2026-2027
// Basado en CEEMO vigente + reformas Gaceta Parlamentaria 115-07 (27 mayo 2026, Transitorio Décimo).
// Jornada: domingo 6 de junio de 2027.
const FUENTE_OFICIAL = "CEEMO + Reforma Gaceta Parlamentaria 115-07 (27 mayo 2026)";

export const CALENDARIO_MICHOACAN_2027: HitoCalendario[] = [
  {
    id: "limite-sin-proselitismo",
    fecha_inicio: "2026-03-01",
    etapa: "preparacion",
    titulo: "Límite sin proselitismo anticipado",
    descripcion:
      "Ningún ciudadano, organización o partido puede realizar actividades de promoción personal o proselitismo con miras al proceso electoral. La restricción aplica desde seis meses antes del inicio formal del proceso (septiembre 2026).",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 169 CEEMO",
    oficial: true,
  },
  {
    id: "separacion-magistrados-consejeros",
    fecha_inicio: "2026-06-06",
    etapa: "preparacion",
    titulo: "Separación del cargo: Magistrados TEEM y Consejeros IEM",
    descripcion:
      "Fecha límite para que magistrados del Tribunal Electoral y consejeros del IEM que aspiren a contender se separen del cargo (un año antes de la jornada).",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 13 CEEMO",
    oficial: true,
  },
  {
    id: "iem-inicio-proceso",
    fecha_inicio: "2026-09-07",
    etapa: "preparacion",
    titulo: "Inicio formal del proceso electoral local 2026-2027",
    descripcion:
      "El Consejo General del IEM celebra la sesión formal de apertura del proceso electoral ordinario. Se activa la normativa electoral, corren plazos legales y se prohíbe la propaganda gubernamental fuera de los supuestos permitidos.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 183 CEEMO",
    oficial: true,
  },
  {
    id: "topes-campana",
    fecha_inicio: "2026-09-12",
    etapa: "preparacion",
    titulo: "Topes de gastos de CAMPAÑA determinados",
    descripcion:
      "Dentro de los 5 días posteriores al inicio del proceso, el Consejo General fija y publica los topes máximos de gasto para cada tipo de campaña (Gobernador, Diputados, Ayuntamientos).",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 170 BIS CEEMO",
    oficial: true,
  },
  {
    id: "independientes-registro-aspirantes",
    fecha_inicio: "2026-10-01",
    fecha_fin: "2026-10-31",
    etapa: "aspirantes",
    titulo: "Registro de ASPIRANTES a candidatura independiente",
    descripcion:
      "Apertura y cierre del periodo para solicitar registro como aspirante a candidatura independiente. Requiere constitución de A.C., alta SAT y cuenta bancaria. Nueva restricción 2026: colores e imagen no pueden ser iguales ni semejantes a los de otros aspirantes independientes.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Arts. 303-306 CEEMO (reformados)",
    oficial: true,
    reformado: true,
  },
  {
    id: "independientes-respaldo",
    fecha_inicio: "2026-11-01",
    fecha_fin: "2026-12-15",
    etapa: "aspirantes",
    titulo: "Respaldo ciudadano · Candidaturas independientes",
    descripcion:
      "Tras la declaratoria de aspirantes con derecho a registro, inicia recolección de respaldo ciudadano: 30 días para Gobernador y 20 días para Diputados y Ayuntamientos. Se requiere 2% de la lista nominal en cada caso.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Arts. 307-308, 314 CEEMO",
    oficial: true,
  },
  {
    id: "topes-precampana",
    fecha_inicio: "2026-11-30",
    etapa: "preparacion",
    titulo: "Topes de PRECAMPAÑA determinados",
    descripcion:
      "El Consejo General determina los topes máximos de gasto de precampaña para cada cargo. Equivale al 20% del tope de campaña respectivo.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 162 CEEMO",
    oficial: true,
  },
  {
    id: "partidos-metodo-seleccion",
    fecha_inicio: "2026-12-05",
    etapa: "aspirantes",
    titulo: "Partidos notifican al IEM su MÉTODO DE SELECCIÓN de candidatos",
    descripcion:
      "Cada partido comunica al Consejo General el procedimiento (convención, encuesta, votación directa), reglamentos, topes, fechas, órgano interno y mecanismos de paridad. El IEM solo recibe; no modifica el método interno (Art. 157 y 339 reformados).",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 158 CEEMO (reformado)",
    oficial: true,
    reformado: true,
  },
  {
    id: "instalacion-consejos",
    fecha_inicio: "2026-12-18",
    etapa: "preparacion",
    titulo: "Instalación de Consejos Electorales distritales y municipales",
    descripcion:
      "Los comités electorales distritales y municipales se instalan e inician sesiones conforme al calendario del Consejo General (Art. 58 reformado: ya no existe el plazo fijo de 170 días).",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 58 CEEMO (reformado)",
    oficial: true,
    reformado: true,
  },
  {
    id: "precampana-unificada",
    fecha_inicio: "2027-01-04",
    fecha_fin: "2027-02-03",
    etapa: "precampana",
    titulo: "PRECAMPAÑAS — todos los cargos (inicio unificado)",
    descripcion:
      "Con la reforma de la Gaceta 115-07 se UNIFICA el inicio de precampañas: Gobernador, Diputados y Ayuntamientos arrancan la primera semana de enero del año electoral, sin distinción. Precandidatos pueden realizar reuniones, asambleas y propaganda interna dentro de los topes autorizados. Concluye con la elección interna del partido.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 158a CEEMO (REFORMADO — Gaceta 115-07)",
    oficial: true,
    reformado: true,
  },
  {
    id: "convocatoria-elecciones",
    fecha_inicio: "2027-01-07",
    etapa: "preparacion",
    titulo: "Convocatoria para elecciones ordinarias publicada",
    descripcion:
      "A más tardar 150 días antes de la jornada, el Consejo General publica la convocatoria oficial en el Periódico Oficial, sitio web y redes sociales del IEM (reforma 2026), en versión accesible y en lenguas indígenas regionales.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 14 CEEMO (reformado)",
    oficial: true,
    reformado: true,
  },
  {
    id: "informe-precampana",
    fecha_inicio: "2027-02-18",
    etapa: "intercampana",
    titulo: "Informe de gastos de PRECAMPAÑA",
    descripcion:
      "Dentro de los 15 días posteriores al fin de precampañas, cada partido entrega a la Unidad de Fiscalización del IEM el informe del origen y destino de los recursos de precampaña, desglosado por aspirante.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 163 CEEMO",
    oficial: true,
  },
  {
    id: "registro-gobernador-inicio",
    fecha_inicio: "2027-03-09",
    fecha_fin: "2027-03-24",
    etapa: "intercampana",
    titulo: "Registro de candidatura — GOBERNADOR (15 días)",
    descripcion:
      "Periodo de 15 días para registro formal ante el Consejo General. Documentación Art. 189 reformado: Declaración 8 de 8, no antecedentes penales (≤30 días), no condena por violencia política contra las mujeres, no inhabilitación vigente, declaración patrimonial y fiscal. Cierre 24 de marzo (74 días antes de la jornada).",
    cargos: ["gobernador"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Arts. 189-190 CEEMO (reformados)",
    oficial: true,
    reformado: true,
  },
  {
    id: "registro-diputados-ayuntamientos",
    fecha_inicio: "2027-03-13",
    fecha_fin: "2027-03-28",
    etapa: "intercampana",
    titulo: "Registro — DIPUTADOS MR y AYUNTAMIENTOS (15 días)",
    descripcion:
      "Periodo de 15 días para registro de diputados MR y planillas de ayuntamientos. Las planillas inician con Presidencia Municipal y siguen orden de prelación (también lista para regidurías RP, Art. 21 reformado). ATENCIÓN: el cierre se ADELANTÓ con la Gaceta 115-07 de 59 a 70 días antes de la jornada (11 días menos).",
    cargos: ["diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 190 IV y VI CEEMO (REFORMADO — Gaceta 115-07)",
    oficial: true,
    reformado: true,
  },
  {
    id: "sesion-registro-gob-rp",
    fecha_inicio: "2027-04-03",
    etapa: "intercampana",
    titulo: "Sesión Consejo General: registro oficial Gobernador y Diputados RP",
    descripcion:
      "10 días después del cierre de Gobernador, sesión cuyo único objeto es el registro formal de candidaturas a Gobernador y lista de Diputados RP. A partir de este momento existe candidatura registrada legalmente.",
    cargos: ["gobernador", "diputados_locales"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 190 VII CEEMO (reformado)",
    oficial: true,
    reformado: true,
  },
  {
    id: "campana-gob",
    fecha_inicio: "2027-04-04",
    fecha_fin: "2027-06-02",
    etapa: "campana",
    titulo: "CAMPAÑA — GOBERNADOR (60 días)",
    descripcion:
      "60 días antes de la jornada arranca formalmente la campaña a Gobernador. Activación de tiempos de radio/TV, propaganda autorizada y plan de medios completo. Se suspende propaganda gubernamental hasta la jornada.",
    cargos: ["gobernador"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 184 CEEMO / LGIPE Art. 227",
    oficial: true,
  },
  {
    id: "sesion-registro-mr-ayto",
    fecha_inicio: "2027-04-17",
    etapa: "intercampana",
    titulo: "Sesión Consejo General: registro oficial Diputados MR y Ayuntamientos",
    descripcion:
      "20 días después del cierre (antes eran 10), el Consejo General registra candidaturas a Diputados MR y planillas de Ayuntamientos. La reforma amplía la ventana de revisión institucional.",
    cargos: ["diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 190 VII CEEMO (REFORMADO — Gaceta 115-07)",
    oficial: true,
    reformado: true,
  },
  {
    id: "campana-locales",
    fecha_inicio: "2027-04-19",
    fecha_fin: "2027-06-02",
    etapa: "campana",
    titulo: "CAMPAÑA — DIPUTADOS y AYUNTAMIENTOS (45 días)",
    descripcion:
      "45 días antes de la jornada arrancan campañas para Diputados MR y planillas de Ayuntamientos. Se activan todos los instrumentos: medios, digital, territorial, eventos, propaganda impresa y vía pública.",
    cargos: ["diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 184 CEEMO / LGIPE Art. 227",
    oficial: true,
  },
  {
    id: "cierre-registro-rp",
    fecha_inicio: "2027-04-22",
    etapa: "campana",
    titulo: "CIERRE registro — DIPUTADOS RP",
    descripcion: "Último día (45 días antes de la jornada) para registro de listas de Diputados por representación proporcional.",
    cargos: ["diputados_locales"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 190 V CEEMO",
    oficial: true,
  },
  {
    id: "limite-sustitucion-renuncia",
    fecha_inicio: "2027-04-27",
    etapa: "campana",
    titulo: "Límite sustitución por RENUNCIA · Boletas intangibles",
    descripcion:
      "40 días antes de la jornada (antes 30): último día para sustituir candidaturas por renuncia; después solo procede por fallecimiento o inhabilitación. Mismo día, las boletas se vuelven INTANGIBLES: no más correcciones ni reimpresiones (plazo ampliado de 35 a 40 días).",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Arts. 191 y 193 CEEMO (REFORMADOS — Gaceta 115-07)",
    oficial: true,
    reformado: true,
  },
  {
    id: "ultimo-dia-campana",
    fecha_inicio: "2027-06-02",
    etapa: "campana",
    titulo: "Último día de campaña",
    descripcion: "Cierre de actos formales: redes activas, eventos, mítines y proselitismo.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 169 CEEMO",
    oficial: true,
  },
  {
    id: "veda",
    fecha_inicio: "2027-06-03",
    fecha_fin: "2027-06-05",
    etapa: "veda",
    titulo: "VEDA ELECTORAL",
    descripcion:
      "Tres días previos a la jornada: prohibición total de actos de campaña y proselitismo. Suspensión de publicidad en redes sociales de campaña. Las casillas se instalan a las 8:00 del domingo.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 169 CEEMO",
    oficial: true,
  },
  {
    id: "jornada",
    fecha_inicio: "2027-06-06",
    etapa: "jornada",
    titulo: "JORNADA ELECTORAL",
    descripcion:
      "Primer domingo de junio. Casillas abren 8:00 hrs y cierran cuando todos los electores en fila hayan votado (no antes de 18:00). Se elige Gobernador, 24 diputados locales (16 MR + 8 RP) y 113 ayuntamientos.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 184 CEEMO",
    oficial: true,
  },
  {
    id: "computos",
    fecha_inicio: "2027-06-09",
    fecha_fin: "2027-06-12",
    etapa: "computos",
    titulo: "Sesión permanente de CÓMPUTOS distritales y municipales",
    descripcion:
      "Miércoles siguiente a la jornada, 8:00 hrs: inicio en orden Gubernatura → Diputaciones MR → Diputaciones RP → Ayuntamientos. Con Art. 207 reformado, los cómputos pueden realizarse sucesivamente (ya no necesariamente ininterrumpidos).",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 207 CEEMO (reformado)",
    oficial: true,
    reformado: true,
  },
  {
    id: "impugnaciones",
    fecha_inicio: "2027-06-09",
    fecha_fin: "2027-06-14",
    etapa: "post_eleccion",
    titulo: "Plazo para MEDIOS DE IMPUGNACIÓN (5 días hábiles)",
    descripcion:
      "Con la Gaceta 115-07 se UNIFICÓ en 5 días el plazo para interponer cualquier medio de impugnación (antes 4 días, salvo Juicio de Inconformidad y JDCP que ya eran 5). Corre desde el día siguiente al conocimiento del acto impugnado.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: FUENTE_OFICIAL,
    fundamento: "Art. 9 Ley de Justicia Electoral (REFORMADO — Gaceta 115-07)",
    oficial: true,
    reformado: true,
  },
  {
    id: "validacion",
    fecha_inicio: "2027-06-15",
    fecha_fin: "2027-08-31",
    etapa: "post_eleccion",
    titulo: "Calificación e impugnaciones (TEEM)",
    descripcion: "Tribunal Electoral del Estado de Michoacán resuelve impugnaciones y entrega constancias definitivas.",
    cargos: ["gobernador", "diputados_locales", "ayuntamientos"],
    fuente: "TEEM",
    oficial: true,
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
