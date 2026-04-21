// Plantillas base de escenarios por nivel electoral.
// La IA enriquece estas plantillas con datos actuales y genera estrategias.

export type NivelEscenario = "gobernador" | "diputados_federales" | "diputados" | "ayuntamientos";
export type TipoEscenario = "optimista" | "moderado" | "pesimista";

export interface EscenarioBase {
  tipo: TipoEscenario;
  titulo: string;
  probabilidad: number; // 0-100, baseline
  supuestos: string[];
  metricas: {
    label: string;
    valor: string;
    delta?: string;
  }[];
}

export const ESCENARIOS_BASE: Record<NivelEscenario, EscenarioBase[]> = {
  gobernador: [
    {
      tipo: "optimista",
      titulo: "Continuidad consolidada",
      probabilidad: 30,
      supuestos: [
        "Coalición oficialista mantiene unidad y disciplina interna",
        "Participación electoral 55-60% favorece base movilizada",
        "Indicadores de seguridad mejoran 8-12% en últimos 6 meses previos",
        "Sentimiento social positivo sostenido en Morelia, Uruapan, Lázaro Cárdenas",
      ],
      metricas: [
        { label: "Margen estimado", valor: "+12 a +18 pp", delta: "+5 vs hoy" },
        { label: "Distritos ganados", valor: "18-22 de 24" },
        { label: "Bastiones consolidados", valor: "8 municipios top" },
        { label: "Voto duro estimado", valor: "38-42%" },
      ],
    },
    {
      tipo: "moderado",
      titulo: "Competencia ajustada",
      probabilidad: 45,
      supuestos: [
        "Oposición articula coalición parcial PAN-PRI sin PRD pleno",
        "Participación 48-52%, en línea con histórico estatal",
        "Crisis localizadas (Tierra Caliente, Apatzingán) sin escalamiento estatal",
        "Sentimiento social mixto, polarizado por región",
      ],
      metricas: [
        { label: "Margen estimado", valor: "+3 a +8 pp" },
        { label: "Distritos ganados", valor: "13-16 de 24" },
        { label: "Municipios estratégicos", valor: "11-14 de 20" },
        { label: "Indecisos clave", valor: "18-22%" },
      ],
    },
    {
      tipo: "pesimista",
      titulo: "Erosión y empate técnico",
      probabilidad: 25,
      supuestos: [
        "Coalición opositora amplia (PAN-PRI-PRD-MC) con candidato único competitivo",
        "Crisis de seguridad o económica nacional con efecto local",
        "Participación >60% impulsada por voto de castigo",
        "Sentimiento negativo dominante en redes y medios locales",
      ],
      metricas: [
        { label: "Margen estimado", valor: "-2 a +3 pp", delta: "Empate técnico" },
        { label: "Distritos ganados", valor: "10-13 de 24" },
        { label: "Bastiones en riesgo", valor: "4-6 municipios" },
        { label: "Voto castigo", valor: "12-18% adicional" },
      ],
    },
  ],
  diputados: [
    {
      tipo: "optimista",
      titulo: "Mayoría calificada en el Congreso",
      probabilidad: 25,
      supuestos: [
        "Arrastre del candidato a gobernador favorece boleta completa",
        "PR (representación proporcional) entrega 8-10 plurinominales adicionales",
        "Disciplina de coalición en distritos competitivos",
        "Operación territorial reforzada en 6 distritos bisagra",
      ],
      metricas: [
        { label: "Diputaciones MR", valor: "16-19 de 24" },
        { label: "Diputaciones RP", valor: "+8 a +10" },
        { label: "Total estimado", valor: "26-29 de 40" },
        { label: "Mayoría calificada", valor: "≥27 escaños" },
      ],
    },
    {
      tipo: "moderado",
      titulo: "Mayoría simple sin calificada",
      probabilidad: 50,
      supuestos: [
        "Resultado mixto: gana mayoría de MR pero pierde 2-3 distritos clave",
        "RP balanceada por el principio de subrepresentación",
        "Competencia real en D5 Zamora, D7 Pátzcuaro, D17 Uruapan",
      ],
      metricas: [
        { label: "Diputaciones MR", valor: "12-15 de 24" },
        { label: "Diputaciones RP", valor: "+6 a +8" },
        { label: "Total estimado", valor: "20-23 de 40" },
        { label: "Distritos bisagra", valor: "5-7 en disputa" },
      ],
    },
    {
      tipo: "pesimista",
      titulo: "Congreso dividido",
      probabilidad: 25,
      supuestos: [
        "Voto diferenciado entre boleta de gobernador y diputados",
        "Oposición gana cabeceras urbanas (Morelia, Uruapan, Zamora)",
        "Independientes y MC arañan 2-3 distritos",
      ],
      metricas: [
        { label: "Diputaciones MR", valor: "8-11 de 24" },
        { label: "Diputaciones RP", valor: "+5 a +7" },
        { label: "Total estimado", valor: "15-18 de 40" },
        { label: "Riesgo bloqueo legislativo", valor: "Alto" },
      ],
    },
  ],
  diputados_federales: [
    {
      tipo: "optimista",
      titulo: "Bancada federal robusta por Michoacán",
      probabilidad: 30,
      supuestos: [
        "Coalición oficialista federal mantiene unidad y arrastre presidencial",
        "Participación 55-60% en elección intermedia favorece movilización",
        "Triunfo en al menos 8 de 11 distritos federales",
        "RP entrega 2-3 plurinominales adicionales por la 5ta circunscripción",
      ],
      metricas: [
        { label: "Distritos federales MR", valor: "8-10 de 11", delta: "+2 vs 2021" },
        { label: "Plurinominales (RP)", valor: "+2 a +3" },
        { label: "Bancada Michoacán", valor: "10-13 diputados" },
        { label: "Voto duro federal", valor: "36-40%" },
      ],
    },
    {
      tipo: "moderado",
      titulo: "División de boleta federal",
      probabilidad: 50,
      supuestos: [
        "Voto diferenciado: gana mayoría pero pierde 2-3 distritos urbanos",
        "Oposición compite seriamente en D5 Zamora y D11 Morelia",
        "Participación 48-52% en línea con histórico federal intermedio",
        "Bancada estatal con disciplina parcial frente a Morelia y CDMX",
      ],
      metricas: [
        { label: "Distritos federales MR", valor: "6-8 de 11" },
        { label: "Plurinominales (RP)", valor: "+1 a +2" },
        { label: "Bancada Michoacán", valor: "7-10 diputados" },
        { label: "Distritos bisagra", valor: "3-4 en disputa" },
      ],
    },
    {
      tipo: "pesimista",
      titulo: "Pérdida de hegemonía federal",
      probabilidad: 20,
      supuestos: [
        "Coalición opositora (PAN-PRI-MC) coordinada en cabeceras urbanas",
        "Voto de castigo por crisis nacional o regional de seguridad",
        "Pérdida de Morelia, Zamora, Uruapan, Pátzcuaro a nivel federal",
        "Participación >60% impulsada por castigo",
      ],
      metricas: [
        { label: "Distritos federales MR", valor: "3-5 de 11" },
        { label: "Plurinominales (RP)", valor: "+1" },
        { label: "Bancada Michoacán", valor: "4-6 diputados" },
        { label: "Distritos urbanos perdidos", valor: "4-6" },
      ],
    },
  ],
  ayuntamientos: [
    {
      tipo: "optimista",
      titulo: "Hegemonía municipal",
      probabilidad: 25,
      supuestos: [
        "Renovación de bastiones (Lázaro Cárdenas, Apatzingán, Morelia centro)",
        "Recuperación de 3-5 municipios opositores en Tierra Caliente",
        "Candidaturas locales con arraigo y trayectoria",
        "Sin alternancia en municipios estratégicos",
      ],
      metricas: [
        { label: "Municipios ganados", valor: "75-90 de 113" },
        { label: "Top 20 estratégicos", valor: "16-18 ganados" },
        { label: "Población gobernada", valor: "≥75%" },
        { label: "Alternancias en contra", valor: "0-2" },
      ],
    },
    {
      tipo: "moderado",
      titulo: "Mayoría con desgaste localizado",
      probabilidad: 50,
      supuestos: [
        "Pérdida de 2-3 cabeceras importantes por desgaste de gestión",
        "Ganancia compensatoria en municipios pequeños",
        "Alternancia esperada en municipios con 2 períodos del mismo partido",
      ],
      metricas: [
        { label: "Municipios ganados", valor: "55-70 de 113" },
        { label: "Top 20 estratégicos", valor: "11-14 ganados" },
        { label: "Población gobernada", valor: "55-65%" },
        { label: "Alternancias en contra", valor: "3-5" },
      ],
    },
    {
      tipo: "pesimista",
      titulo: "Pérdida de cabeceras urbanas",
      probabilidad: 25,
      supuestos: [
        "Voto urbano de castigo en Morelia, Uruapan, Zamora",
        "Coalición opositora coordinada en municipios >100k habitantes",
        "Crisis de seguridad afecta percepción de gestión local",
      ],
      metricas: [
        { label: "Municipios ganados", valor: "40-55 de 113" },
        { label: "Top 20 estratégicos", valor: "7-10 ganados" },
        { label: "Población gobernada", valor: "≤45%" },
        { label: "Alternancias en contra", valor: "6-9" },
      ],
    },
  ],
};

export const NIVEL_LABEL: Record<NivelEscenario, string> = {
  gobernador: "Gubernatura 2027",
  diputados_federales: "Cámara de Diputados Federales (11 distritos)",
  diputados: "Congreso Local (24 distritos + RP)",
  ayuntamientos: "113 Ayuntamientos",
};
