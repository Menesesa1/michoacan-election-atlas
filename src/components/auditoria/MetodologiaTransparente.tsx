import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Cloud,
  Cpu,
  Network,
  BarChart3,
  GitBranch,
  Shield,
  Workflow,
  FileCode,
  Globe,
  Zap,
  Lock,
} from "lucide-react";

const fuentesDatos = [
  {
    nombre: "INE — Atlas Electoral / Cómputos Distritales",
    detalle: "Resultados oficiales 2018, 2021, 2024 a nivel sección, casilla, distrito federal y local.",
    cobertura: "11 distritos federales · 24 distritos locales · 113 municipios · 2,825 secciones",
    uso: "Cálculo de voto histórico, swing, volatilidad, baseline de simuladores.",
  },
  {
    nombre: "IEM Michoacán — Programa de Resultados Electorales Preliminares (PREP)",
    detalle: "Actas de cómputo de Gobernatura, Diputaciones Locales y Ayuntamientos.",
    cobertura: "Procesos 2018, 2021, 2024 + extraordinarios",
    uso: "Validación cruzada con INE y reconstrucción de coaliciones locales.",
  },
  {
    nombre: "DERFE — Padrón Electoral / Lista Nominal",
    detalle: "Distribución por sexo y rangos etarios (18-19, 20-24, 25-29… 65+) por sección.",
    cobertura: "≈3.7M ciudadanos en lista nominal Michoacán (corte 2026)",
    uso: "Pirámides poblacionales, segmentación GEOINT, ponderación demográfica.",
  },
  {
    nombre: "INEGI — Censo 2020 + Marco Geoestadístico",
    detalle: "Variables socioeconómicas (escolaridad, ingreso, vivienda, jefatura femenina).",
    cobertura: "AGEB y municipio cruzado a sección electoral",
    uso: "Modelos de correlación voto/ingreso, segmentación PSICOINT.",
  },
  {
    nombre: "Catálogo INE de Secciones (cartografía SIGE)",
    detalle: "Centroides y polígonos oficiales de cada sección electoral.",
    cobertura: "Geometrías 2825 secciones",
    uso: "Renderizado Leaflet, cálculo de distancias y clusters.",
  },
];

const apisExternas = [
  {
    nombre: "Lovable AI Gateway",
    proveedor: "Google Gemini 2.5 Pro/Flash · OpenAI GPT-5",
    funcion: "Clasificación NLP de menciones, extracción de tópicos, generación de narrativas P.D.A., análisis de sentimiento.",
    icon: Cpu,
  },
  {
    nombre: "SerpApi — Google Trends",
    proveedor: "SerpApi",
    funcion: "Series temporales de búsqueda por candidato y término estatal. Ingesta diaria con caché en Postgres.",
    icon: Globe,
  },
  {
    nombre: "Perplexity API",
    proveedor: "Perplexity (sonar-pro)",
    funcion: "Recuperación contextual con citas para alertas de crisis y validación factual.",
    icon: Zap,
  },
  {
    nombre: "Firecrawl",
    proveedor: "Firecrawl v2",
    funcion: "Scraping estructurado de portales de noticias locales y redes públicas para detección CIB.",
    icon: Network,
  },
  {
    nombre: "Lovable Cloud (Postgres + Edge Functions)",
    proveedor: "Supabase managed",
    funcion: "Base de datos con RLS, autenticación, almacenamiento, ejecución de pipelines en Edge Functions Deno.",
    icon: Cloud,
  },
];

const tecnicasEstadisticas = [
  {
    titulo: "Análisis de varianza electoral (volatilidad Pedersen)",
    formula: "V = ½ · Σ |Vᵢₜ − Vᵢₜ₋₁|",
    uso: "Mide cambio agregado de voto entre elecciones por sección. Identifica zonas inestables.",
  },
  {
    titulo: "Swing y abstención compensada",
    formula: "Swingₐ→ᵦ = (V_a − V_b) / 2 · ParticipaciónCorregida",
    uso: "Proyección de escenarios en el simulador electoral con corrección por lista nominal real.",
  },
  {
    titulo: "Correlaciones Pearson y Spearman",
    formula: "ρ(voto_partido, variable_socioeconómica)",
    uso: "Cruce voto × escolaridad / ingreso / edad / género en el módulo Demográfico.",
  },
  {
    titulo: "Clustering K-Means / DBSCAN sobre vectores sección",
    formula: "Vectores: [%voto_pᵢ, participación, edad_media, ingreso, ruralidad]",
    uso: "Tipologías de sección (voto duro, bisagra, abstencionista) para PSICOINT.",
  },
  {
    titulo: "Detección de Coordinated Inauthentic Behavior (CIB)",
    formula: "Grafo dirigido + similitud coseno temporal + score de sincronía",
    uso: "Identifica clusters de cuentas con publicación sincronizada (<5 min) y mensajes con similitud >0.85.",
  },
  {
    titulo: "Análisis de sentimiento NLP",
    formula: "Polaridad ∈ [−1, +1] + intensidad emocional (alegría/ira/miedo/tristeza)",
    uso: "Etiquetado por LLM con muestreo aleatorio para validación humana (≥10% de cada lote).",
  },
  {
    titulo: "Validación de paridad IEM",
    formula: "Reglas oficiales: 50/50 horizontal, bloques alto/medio/bajo, alternancia RP, suplencia mismo género",
    uso: "Auditoría automática de planillas registradas.",
  },
  {
    titulo: "Heatmaps GEOINT",
    formula: "Densidad ponderada = Σ(lista_nominal_segmento · peso_estratégico) / área",
    uso: "Priorización territorial por segmento (mujeres jóvenes, primer voto, adultos mayores).",
  },
];

const pipelines = [
  {
    nombre: "Ingesta histórica INE/IEM",
    pasos: ["Descarga CSV oficiales", "Normalización a esquema sección", "Validación cruzada totales (11/113/2825)", "Persistencia Postgres + caché"],
  },
  {
    nombre: "Monitor de Inteligencia (CIB · PSICOINT · Narrativas)",
    pasos: ["Scraping Firecrawl", "Clasificación NLP (Gemini/GPT-5)", "Detección CIB (grafo+similitud)", "Generación alertas con severidad"],
  },
  {
    nombre: "Google Trends (estatal + por candidato)",
    pasos: ["Pull SerpApi cada 24h", "Deduplicación y suavizado", "Persistencia series + cálculo deltas"],
  },
  {
    nombre: "Meta Andrómeda — Framework P.D.A.",
    pasos: ["Mapeo Problema-Diagnóstico-Acción por segmento", "Generación creativos vía LLM", "Diversificación anti-saturación", "Export a campañas Meta"],
  },
];

const garantias = [
  "Trazabilidad: cada métrica del dashboard se origina en una tabla auditable en la base de datos.",
  "Sin datos simulados en producción: el toggle mock-data está reservado a entornos de desarrollo.",
  "Row Level Security (RLS) activo en todas las tablas con datos de clientes y notificaciones.",
  "Roles separados (admin / analista / cliente) gestionados en tabla user_roles, nunca en profile.",
  "Logs de uso de APIs (api_usage_log) con costo, latencia y status por llamada.",
  "Locks de pipeline (advisory locks) para evitar ejecuciones duplicadas.",
  "Validación cruzada INE ↔ IEM ↔ Catálogo SIGE antes de publicar cualquier número.",
  "Secrets gestionados por Lovable Cloud — nunca expuestos en el cliente.",
];

export default function MetodologiaTransparente() {
  return (
    <Card className="p-5 border-primary/30 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex items-center gap-2 mb-1">
        <FileCode className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
          Metodología · Caja blanca completa
        </span>
      </div>
      <h2 className="text-xl font-bold mb-1">Cómo analizamos: APIs, datos y estadística</h2>
      <p className="text-xs text-muted-foreground mb-5 max-w-4xl">
        Documentación íntegra del stack analítico. Toda decisión que el sistema sugiere se sustenta en alguna
        de estas fuentes, conexiones y técnicas. Sin cajas negras.
      </p>

      {/* Fuentes de datos */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">1. Fuentes de datos oficiales</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {fuentesDatos.map((f) => (
            <div key={f.nombre} className="rounded border border-border/60 bg-card/40 p-3">
              <div className="text-xs font-semibold text-foreground">{f.nombre}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{f.detalle}</div>
              <Badge variant="outline" className="mt-2 text-[10px]">{f.cobertura}</Badge>
              <div className="text-[11px] mt-2"><span className="text-primary">Uso:</span> {f.uso}</div>
            </div>
          ))}
        </div>
      </section>

      {/* APIs / Conexiones */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">2. APIs y conexiones externas</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {apisExternas.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.nombre} className="rounded border border-border/60 bg-card/40 p-3 flex gap-3">
                <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">{a.nombre}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{a.proveedor}</div>
                  <div className="text-[11px] mt-1">{a.funcion}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Técnicas estadísticas */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">3. Técnicas estadísticas y modelos</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {tecnicasEstadisticas.map((t) => (
            <div key={t.titulo} className="rounded border border-border/60 bg-card/40 p-3">
              <div className="text-xs font-semibold">{t.titulo}</div>
              <div className="text-[10px] font-mono text-primary/80 mt-1 bg-primary/5 px-2 py-1 rounded">
                {t.formula}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">{t.uso}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipelines */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Workflow className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">4. Pipelines de procesamiento</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {pipelines.map((p) => (
            <div key={p.nombre} className="rounded border border-border/60 bg-card/40 p-3">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-primary" />
                {p.nombre}
              </div>
              <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
                {p.pasos.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Stack técnico */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">5. Stack tecnológico</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {[
            ["Frontend", "React 18 · Vite · TypeScript"],
            ["UI", "Tailwind · shadcn/ui · Recharts"],
            ["Mapas", "Leaflet · cartografía SIGE"],
            ["Backend", "Lovable Cloud (Postgres + Edge Functions Deno)"],
            ["IA", "Lovable AI Gateway (Gemini · GPT-5)"],
            ["Inteligencia", "SerpApi · Perplexity · Firecrawl"],
            ["Auth", "Email/Password + roles"],
            ["Observabilidad", "api_usage_log · run logs · advisory locks"],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-border/60 bg-card/40 p-2">
              <div className="text-[9px] uppercase tracking-wider text-primary">{k}</div>
              <div className="font-mono">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Garantías */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">6. Garantías de integridad</h3>
        </div>
        <ul className="space-y-1.5">
          {garantias.map((g) => (
            <li key={g} className="text-[11px] flex gap-2 items-start">
              <Lock className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </section>
    </Card>
  );
}
