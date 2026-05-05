// Informe ejecutivo XLSX de la situación general (espejo del briefing PDF)
import { supabase } from "@/integrations/supabase/client";
import { generarXLSX, type SheetSpec } from "./utils";

export async function descargarInformeGeneralXLSX() {
  const fecha = new Date().toISOString().slice(0, 10);

  // Datos
  const [crisisRunRes, socialRunRes] = await Promise.all([
    supabase.from("alertas_crisis_runs").select("*").order("ejecutada_en", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("social_runs").select("*").order("ejecutada_en", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const crisisRun = crisisRunRes.data;
  const socialRun = socialRunRes.data;

  const [alertasRes, resumenesRes, mencionesRes, cibRes, trendsRes] = await Promise.all([
    supabase.from("alertas_crisis").select("*").order("detectada_en", { ascending: false }).limit(100),
    socialRun?.batch_id
      ? supabase.from("social_resumen").select("*").eq("batch_id", socialRun.batch_id)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from("social_menciones").select("*").order("detectada_en", { ascending: false }).limit(200),
    supabase.from("cib_alertas").select("*").order("detectada_en", { ascending: false }).limit(50),
    supabase.from("trends_estatal").select("*").order("ejecutada_en", { ascending: false }).limit(50),
  ]);

  const alertas = alertasRes.data ?? [];
  const resumenes = resumenesRes.data ?? [];
  const menciones = mencionesRes.data ?? [];
  const cib = cibRes.data ?? [];
  const trends = trendsRes.data ?? [];

  // KPIs hoja
  const urgentes = alertas.filter((a: any) => a.prioridad === "Urgente").length;
  const preventivas = alertas.filter((a: any) => a.prioridad === "Preventivo").length;

  const sheets: SheetSpec[] = [
    {
      name: "Resumen ejecutivo",
      rows: [
        ["EME · Michoacán 360 — Informe ejecutivo general"],
        [`Generado: ${new Date().toLocaleString("es-MX")}`],
        [],
        ["Indicador", "Valor"],
        ["Alertas urgentes", urgentes],
        ["Alertas preventivas", preventivas],
        ["Total alertas (últimas 100)", alertas.length],
        ["Patrones CIB detectados", cib.length],
        ["Términos en Google Trends monitoreados", trends.length],
        ["Entidades en monitoreo social", resumenes.length],
        ["Menciones recientes", menciones.length],
        ["Última corrida crisis", crisisRun ? new Date(crisisRun.ejecutada_en).toLocaleString("es-MX") : "—"],
        ["Última corrida social", socialRun ? new Date(socialRun.ejecutada_en).toLocaleString("es-MX") : "—"],
      ],
    },
    {
      name: "Alertas",
      rows: [
        ["Prioridad", "Título", "Descripción", "Distrito", "Fuente", "URL", "Detectada"],
        ...alertas.map((a: any) => [
          a.prioridad, a.titulo, a.descripcion, a.distrito, a.fuente, a.url_fuente, a.detectada_en,
        ]),
      ],
    },
    {
      name: "CIB",
      rows: [
        ["Severidad", "Patrón", "Entidad", "Título", "Descripción", "Detectada"],
        ...cib.map((c: any) => [c.severidad, c.tipo_patron, c.entidad_nombre, c.titulo, c.descripcion, c.detectada_en]),
      ],
    },
    {
      name: "Sentimiento por entidad",
      rows: [
        ["Entidad", "Tipo", "Menciones", "Sentimiento prom.", "% Positivo", "% Negativo", "% Neutro"],
        ...resumenes.map((r: any) => [
          r.entidad_nombre, r.entidad_tipo, r.total_menciones,
          r.sentimiento_promedio, r.pct_positivo, r.pct_negativo, r.pct_neutro,
        ]),
      ],
    },
    {
      name: "Menciones",
      rows: [
        ["Sent.", "Entidad", "Título", "Fragmento", "Fuente", "Tema", "URL", "Detectada"],
        ...menciones.map((m: any) => [
          m.sentimiento, m.entidad_nombre, m.titulo, m.fragmento, m.fuente, m.tema, m.url, m.detectada_en,
        ]),
      ],
    },
    {
      name: "Google Trends",
      rows: [
        ["Término", "Tipo", "Interés", "Variación %", "Geo", "Ejecutada"],
        ...trends.map((t: any) => [t.termino, t.tipo, t.valor_interes, t.variacion_pct, t.geo, t.ejecutada_en]),
      ],
    },
  ];

  generarXLSX(`informe-general-michoacan-${fecha}.xlsx`, sheets);
}
