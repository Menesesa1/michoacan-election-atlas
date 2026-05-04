import { useState } from "react";
import {
  ChevronDown, BookOpen, LayoutDashboard, Landmark, Vote, Building, PieChart, Users,
  TrendingUp, Sparkles, Zap, ShieldAlert, Database, Map, Network, MessageCircle, ShieldCheck,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface Pestana {
  nombre: string;
  metodo: string;
  porque: string;
}

interface ModuloMeta {
  icon: typeof LayoutDashboard;
  ruta: string;
  nombre: string;
  proposito: string;
  estado: "produccion" | "beta" | "proximo";
  fuentes: string[];
  pestanas: Pestana[];
  limitaciones: string[];
}

const MODULOS: ModuloMeta[] = [
  // ───────── MANDO CENTRAL ─────────
  {
    icon: LayoutDashboard,
    ruta: "/mando",
    nombre: "Mando Central",
    proposito: "Vista ejecutiva consolidada: lo que el estratega necesita ver primero antes de bajar al detalle.",
    estado: "produccion",
    fuentes: ["Cómputos INE/IEM 2018-2024 (DataContext global)", "Análisis derivados de los demás módulos"],
    pestanas: [
      {
        nombre: "Resumen ejecutivo",
        metodo: "KPIs estatales (votos, participación, distritos), contiendas activas, candidatos destacados, estrategias recientes y tendencia electoral resumida con sparkline + swings reales entre las dos últimas elecciones.",
        porque: "Un mando central debe responder en 30 segundos: ¿cómo vamos, dónde está el riesgo, dónde la oportunidad? Cualquier cosa más profunda merece su propia pestaña.",
      },
      {
        nombre: "Detalle electoral",
        metodo: "Resultados por partido, índice de competitividad por distrito y tabla completa con cómputos reales por elección seleccionada.",
        porque: "Permite zoom desde la vista ejecutiva sin salir del módulo. Los números son los oficiales, no derivaciones.",
      },
    ],
    limitaciones: [
      "No incluye tracking semanal: se removieron los charts de 'evolución semanal' porque su fuente eran series sintéticas (Math.random + sin/cos), no encuestas reales.",
      "Las contiendas y estrategias mostradas dependen del módulo de Candidatos y Estrategia 360 — si están vacíos, el panel lo refleja.",
    ],
  },
  // ───────── GOBERNADOR / DIPUTADOS / AYUNTAMIENTOS ─────────
  {
    icon: Landmark,
    ruta: "/gobernador",
    nombre: "Gobernador",
    proposito: "Análisis específico de la elección estatal a la gubernatura.",
    estado: "produccion",
    fuentes: ["IEM Michoacán cómputos estatales", "Datos demográficos INE para contexto"],
    pestanas: [
      {
        nombre: "Resumen estatal",
        metodo: "Agregación estatal de los 24 distritos locales con votos por partido y participación.",
        porque: "Es la unidad real de competencia para gobernador: el estado completo, no distritos federales.",
      },
    ],
    limitaciones: ["La elección 2027 se proyecta en el módulo de Tendencias, aquí solo se muestra histórico."],
  },
  {
    icon: Vote,
    ruta: "/diputados-locales",
    nombre: "Diputados Locales",
    proposito: "Análisis distrital de los 24 distritos electorales locales del IEM.",
    estado: "produccion",
    fuentes: ["IEM Michoacán cómputos distritales locales 2018, 2021, 2024"],
    pestanas: [
      {
        nombre: "Mapa y tabla distrital",
        metodo: "Cómputos reales por distrito local, ganador y margen.",
        porque: "Los distritos locales son la unidad real de operación territorial: donde se asignan candidatos, recursos y presencia.",
      },
    ],
    limitaciones: ["Distritación 2023 vigente: comparativa con ciclos previos asume reseccionamiento equivalente."],
  },
  {
    icon: Building,
    ruta: "/ayuntamientos",
    nombre: "Ayuntamientos",
    proposito: "Resultados por los 113 municipios de Michoacán.",
    estado: "produccion",
    fuentes: ["IEM cómputos municipales", "Catálogo de municipios INEGI/INE"],
    pestanas: [
      {
        nombre: "Vista municipal",
        metodo: "Resultados por presidencia municipal con ganador y margen.",
        porque: "El ayuntamiento es la elección más cercana al ciudadano y donde se construye base territorial real.",
      },
    ],
    limitaciones: ["Cobertura completa requiere importación CSV cuando el IEM publica el ciclo correspondiente."],
  },
  // ───────── SOCIOECONÓMICO ─────────
  {
    icon: PieChart,
    ruta: "/socioeconomico",
    nombre: "Socioeconómico",
    proposito: "Caracterización del electorado por indicadores de marginación, escolaridad y carencias.",
    estado: "produccion",
    fuentes: [
      "INEGI ECEG (Estadísticas de Carencias y Escolaridad por Geografía)",
      "Catálogo de secciones electorales INE para agregación municipal y distrital",
    ],
    pestanas: [
      {
        nombre: "Vista municipal y distrital",
        metodo: "Cargamos el dataset ECEG por sección electoral y lo agregamos a nivel municipio o distrito local según el catálogo INE de secciones.",
        porque: "El INEGI publica por sección, pero la operación electoral piensa por municipio o distrito. Esta agregación une ambas geografías sin perder fidelidad.",
      },
    ],
    limitaciones: [
      "ECEG es transversal (un corte temporal), no longitudinal. No mide cambios en el tiempo.",
      "Variables se promedian con peso de población por sección; cualquier reseccionamiento posterior no está reflejado.",
    ],
  },
  // ───────── DEMOGRAFÍA ─────────
  {
    icon: Users,
    ruta: "/demografia",
    nombre: "Demografía",
    proposito: "Estructura del padrón y lista nominal por edad, sexo y geografía.",
    estado: "produccion",
    fuentes: [
      "Padrón Electoral y Lista Nominal INE (corte 2026 vigente)",
      "DERFE Datos Abiertos por entidad y rango de edad",
    ],
    pestanas: [
      {
        nombre: "Pirámide poblacional",
        metodo: "Lista nominal por sexo (M = Mujeres, H = Hombres) y rango etario, agregada a nivel estatal, municipal y distrital.",
        porque: "Saber cuántos electores hay y cómo están distribuidos por edad/sexo determina segmentación de campaña, mensaje y canales.",
      },
      {
        nombre: "Heatmap territorial",
        metodo: "Densidad de electores por sección con codificación de género/edad dominante.",
        porque: "Permite identificar zonas con perfil joven vs adulto mayor, masculinizado vs feminizado, sin promediar todo a un solo número estatal.",
      },
    ],
    limitaciones: [
      "Lista nominal cambia cada cierre de padrón. El corte usado debe estar declarado en cada análisis.",
      "No incluye nivel socioeconómico — eso se consulta en el módulo Socioeconómico.",
    ],
  },
  // ───────── TENDENCIAS Y PROYECCIÓN 2027 ─────────
  {
    icon: TrendingUp,
    ruta: "/tendencias",
    nombre: "Tendencias y proyección 2027",
    proposito: "Lectura honesta del histórico y proyección al ciclo 2027 con metodología auditable.",
    estado: "produccion",
    fuentes: ["DataContext global (cómputos federales y locales 2018-2024)"],
    pestanas: [
      {
        nombre: "Proyección estatal por partido",
        metodo: "Consenso entre dos métodos: regresión lineal por mínimos cuadrados (OLS) sobre el histórico de % por partido + swing uniforme (último ciclo + delta entre los dos últimos). Banda 80% calculada con desviación estándar de variaciones inter-elecciones (1.28σ con piso de 1.5pp). Sliders ±10pp para ajustes manuales del estratega.",
        porque: "Cada método tiene sesgos opuestos: regresión sobreaplana realineamientos, swing sobreproyecta volatilidad. Promediar reduce ambos (forecast averaging, lo que usan FiveThirtyEight, Economist y Polymarket). La banda 80% (1.28σ) es estándar demoscópico. El piso de 1.5pp evita bandas falsamente estrechas con n bajo.",
      },
      {
        nombre: "Proyección distrital 2027",
        metodo: "Swing uniforme aplicado distrito por distrito con sus propios pcts. Clasificación: volteado (cambia ganador), competido (margen <5pp), riesgo (mismo ganador, margen cae >3pp), oportunidad (mismo ganador, margen crece >3pp), consolidado (margen ≥15pp).",
        porque: "Los distritos de la sierra se mueven distinto a los urbanos: un swing estatal uniforme borra esas asimetrías; uno por distrito las preserva. La clasificación operativa convierte el dato en decisión de presupuesto y candidato.",
      },
      {
        nombre: "Histórico y simulador",
        metodo: "Tendencia histórica de % por partido a lo largo de los ciclos disponibles + simulador de escenarios con ajuste de turnout y vote swing.",
        porque: "El histórico es la base contra la que se valida cualquier proyección. El simulador permite stress-testing de hipótesis específicas.",
      },
    ],
    limitaciones: [
      "n=3 ciclos por nivel (2018, 2021, 2024) es estadísticamente flaco. Por eso siempre se acompaña con swing y banda ancha.",
      "No es pronóstico: proyectamos qué pasaría si los patrones observados se mantienen, no quién ganará.",
      "No incorpora encuestas en vivo (eso vive en módulo Comparador Multi-Encuestadora con metodología propia).",
    ],
  },
  // ───────── ESTRATEGIA 360 ─────────
  {
    icon: Sparkles,
    ruta: "/escenarios",
    nombre: "Estrategia 360",
    proposito: "Generación de estrategia integral con IA contextualizada al snapshot real del candidato y territorio.",
    estado: "produccion",
    fuentes: [
      "Lovable AI Gateway (Gemini 2.5 Pro / Flash con cadena de fallback)",
      "Snapshot histórico-electoral del territorio (composición territorial + resultados)",
      "Ficha del candidato (war room, trayectoria, métricas redes)",
    ],
    pestanas: [
      {
        nombre: "Wizard de alcance",
        metodo: "Selección guiada de nivel (gobernador/diputado/ayuntamiento), territorio y candidato propio. Construcción de snapshot que combina composición territorial e histórico electoral del territorio elegido.",
        porque: "La estrategia es inservible si no parte del territorio y candidato concretos. El snapshot da el contexto que el LLM necesita para no inventar.",
      },
      {
        nombre: "Resultado y exportación PDF",
        metodo: "El LLM devuelve JSON estructurado: KPIs semanales, plataformas digitales, voceros, calendario, contraataque y aliados de influencia. Renderizado en tabs y exportable a PDF con jsPDF.",
        porque: "JSON estructurado evita texto suelto que no se puede operacionalizar. El PDF es el entregable real al war room.",
      },
      {
        nombre: "Estrategias guardadas",
        metodo: "Persistencia en base de datos con RLS por usuario. Permite comparar versiones e iterar.",
        porque: "Una estrategia no es un evento único: se itera, se compara y se reusa. Sin persistencia, cada generación es desechable.",
      },
    ],
    limitaciones: [
      "El LLM es asistente, no oráculo: las recomendaciones deben validarse con el conocimiento territorial del operador.",
      "La calidad del output es proporcional a la calidad del snapshot — territorios con poco dato producen estrategias genéricas.",
    ],
  },
  // ───────── OPERACIÓN 360 ─────────
  {
    icon: Zap,
    ruta: "/operacion",
    nombre: "Operación 360",
    proposito: "Ejecución y monitoreo de la estrategia en el día a día de la campaña.",
    estado: "beta",
    fuentes: ["Estrategias generadas en Estrategia 360", "Calendario de contenido y voceros declarados"],
    pestanas: [
      {
        nombre: "Calendario semanal de contenido",
        metodo: "Visualización del calendario de mensajes y formatos por día y plataforma según la estrategia activa.",
        porque: "Convierte la estrategia abstracta en agenda ejecutable por el equipo de comunicación.",
      },
      {
        nombre: "Alertas de operación",
        metodo: "Listado de eventos detectados que requieren acción inmediata (mock + tracking de crisis cuando se conecta).",
        porque: "Una operación sin sistema de alertas no opera, reacciona tarde.",
      },
    ],
    limitaciones: ["Aún sin integración nativa con plataformas de publicación (Meta, X) — se opera vía herramientas externas listadas en sidebar."],
  },
  // ───────── CANDIDATOS ─────────
  {
    icon: Users,
    ruta: "/candidatos",
    nombre: "Candidatos",
    proposito: "Ficha completa de candidatos propios y rivales con análisis IA.",
    estado: "produccion",
    fuentes: [
      "Captura manual del operador (war room, trayectoria, métricas)",
      "Firecrawl para precarga desde web pública",
      "Lovable AI Gateway para análisis derivados",
    ],
    pestanas: [
      {
        nombre: "Ficha y comparador",
        metodo: "CRUD de candidatos con foto, partido, nivel, territorio, fase, war room (FODA), trayectoria y métricas de redes. Comparador lado a lado entre dos candidatos del mismo nivel.",
        porque: "Comparar propio vs rival con campos paralelos es el ejercicio analítico básico antes de cualquier estrategia.",
      },
      {
        nombre: "Evaluación digital",
        metodo: "Métricas de redes editables manualmente + análisis IA que califica presencia, narrativa y vulnerabilidades digitales.",
        porque: "La presencia digital es campo de batalla principal en 2027. Sin diagnóstico no hay plan.",
      },
      {
        nombre: "Análisis IA del candidato",
        metodo: "Edge function 'analizar-candidato' con cadena de fallback Gemini 2.5 Flash → Pro → Flash-Lite. Output guardado en tabla candidato_analisis con RLS.",
        porque: "Persistir el análisis evita regenerar (caro) y permite ver evolución de diagnóstico en el tiempo.",
      },
    ],
    limitaciones: [
      "El análisis IA es solo tan bueno como la ficha capturada — bio breve y métricas vacías = análisis genérico.",
      "Firecrawl precarga información pública pero no reemplaza el conocimiento del operador local.",
    ],
  },
  // ───────── INTELIGENCIA ─────────
  {
    icon: ShieldAlert,
    ruta: "/inteligencia",
    nombre: "Inteligencia",
    proposito: "Monitor unificado del entorno: crisis, CIB, emociones, GEOINT, sentimiento y narrativas accionables.",
    estado: "produccion",
    fuentes: [
      "Edge functions monitor-crisis, monitor-social, detectar-cib, ingesta-medios-michoacan, generar-narrativa-accionable (Lovable AI Gateway)",
      "Firecrawl para extracción de medios públicos de Michoacán",
      "Tablas alertas_crisis, social_menciones, social_resumen, cib_alertas, narrativas_sugeridas con RLS",
    ],
    pestanas: [
      {
        nombre: "Alertas y crisis",
        metodo: "Edge function monitor-crisis con clasificación por prioridad (urgente/preventiva/informativa). Tracking de runs y dedupe.",
        porque: "Una crisis sin detección temprana se descubre cuando ya es viral. La prioridad evita saturar al war room.",
      },
      {
        nombre: "CIB / Bots",
        metodo: "Heurísticas sobre social_menciones: spike >300% sobre la media, copy-paste con Jaccard ≥0.7, dominación de fuente >60%, ráfagas temporales.",
        porque: "El comportamiento coordinado inauténtico distorsiona la lectura del sentimiento si no se aísla.",
      },
      {
        nombre: "PSICOINT · Emociones",
        metodo: "Clasificación con Gemini 2.5 en 6 emociones (enojo, miedo, esperanza, indignación, desconfianza, orgullo) + sarcasmo. Radar por entidad.",
        porque: "El positivo/negativo plano oculta qué emoción mueve la conversación. La emoción dominante define el mensaje correcto.",
      },
      {
        nombre: "GEOINT por sección",
        metodo: "Inferencia de sección INE y colonia/tenencia desde el texto, agregada por sección con sentimiento.",
        porque: "La unidad atómica es la sección. Saber dónde se concentra el ruido permite reasignar recursos territoriales.",
      },
      {
        nombre: "Narrativas accionables",
        metodo: "Edge function generar-narrativa-accionable (Gemini 2.5) que produce mensajes defensivos, contraste, pivote, oportunidad o contranarrativa con tono y plataforma.",
        porque: "Datos sin mensaje listo para publicar son ruido. Cierra el bucle inteligencia → comunicación.",
      },
      {
        nombre: "Sentimiento y comparador",
        metodo: "Listening estatal y por candidato con share of voice y comparativo propio vs rival.",
        porque: "Permite contrastar conversación propia y rival sin promediar señales sesgadas.",
      },
    ],
    limitaciones: [
      "El monitoreo depende del crawler: redes cerradas (WhatsApp, grupos privados) no se ven.",
      "El comparador multi-encuestadora fue retirado: la mayoría de encuestadoras locales presentan sesgo conocido y promediarlas amplifica el sesgo en lugar de neutralizarlo.",
    ],
  },
  // ───────── OPERACIÓN DE CAMPAÑA ─────────
  {
    icon: Network,
    ruta: "/operacion-territorial",
    nombre: "Operación territorial",
    proposito: "Coordinación de promotores, secciones y casillas en territorio.",
    estado: "proximo",
    fuentes: ["Padrón electoral", "Catálogo INE de secciones", "Captura del operador"],
    pestanas: [
      {
        nombre: "Mapa de promoción",
        metodo: "Asignación de promotores por sección con cobertura y meta de movilización (en construcción).",
        porque: "La elección se gana en la sección, no en el estado. Sin sistema territorial estructurado, la operación es caótica.",
      },
    ],
    limitaciones: ["Módulo en preparación: registra solicitudes de acceso anticipado en tabla solicitudes_acceso_anticipado."],
  },
  {
    icon: MessageCircle,
    ruta: "/crm-simpatizantes",
    nombre: "CRM Simpatizantes",
    proposito: "Base de datos de simpatizantes con segmentación y comunicación dirigida.",
    estado: "proximo",
    fuentes: ["Captura propia del operador con consentimiento explícito"],
    pestanas: [
      {
        nombre: "Listado y segmentación",
        metodo: "CRUD con tags, sección, contacto y vínculo con casilla.",
        porque: "Sin CRM no hay movilización el día D. Es la diferencia entre saber a quién jalar y rezar.",
      },
    ],
    limitaciones: ["Requiere consentimiento ARCO conforme a la LGPDPPSO. Diseño con privacidad por diseño."],
  },
  {
    icon: ShieldCheck,
    ruta: "/dia-d",
    nombre: "Día D · Casilla",
    proposito: "Operación del día de la jornada electoral: representantes, incidencias y cómputos en vivo.",
    estado: "proximo",
    fuentes: ["Catálogo de casillas INE", "Captura en vivo de representantes"],
    pestanas: [
      {
        nombre: "Tablero jornada",
        metodo: "Listado de casillas con asignación de representantes, captura de incidencias y reporte de cómputo preliminar.",
        porque: "Lo que pasa el día D no se puede analizar en frío — necesita módulo dedicado con captura optimizada para celular.",
      },
    ],
    limitaciones: ["Módulo en preparación. Activación se programa cercana al ciclo electoral."],
  },
  // ───────── DISTRITOS FEDERALES ─────────
  {
    icon: Map,
    ruta: "/distritos",
    nombre: "Distritos federales",
    proposito: "Análisis de los 11 distritos federales de Michoacán como referencia comparativa.",
    estado: "produccion",
    fuentes: ["INE cómputos distritales federales 2018, 2021, 2024"],
    pestanas: [
      {
        nombre: "Mapa y tabla federal",
        metodo: "Cómputos reales por distrito federal con ganador, margen y composición de votos.",
        porque: "El nivel federal contextualiza al local: una elección a gobernador en 2027 ocurre en el clima generado por la federal 2024.",
      },
    ],
    limitaciones: ["Distritación 2017 vigente para 2018-2024 ciclos federales."],
  },
];

const ESTADO_BADGE = {
  produccion: { label: "Producción", cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
  beta: { label: "Beta", cls: "text-foreground border-foreground/40 bg-foreground/10" },
  proximo: { label: "Próximamente", cls: "text-primary border-primary/40 bg-primary/10" },
} as const;

// ───────── PRINCIPIOS TRANSVERSALES ─────────
const PRINCIPIOS = [
  {
    titulo: "Dato real sobre dato sintético",
    texto: "Cualquier visualización que requiera datos en tiempo real o tracking se alimenta de fuentes auditables (INE, IEM, INEGI, edge functions con LLM). Si no hay dato real, el módulo lo declara explícitamente. Hemos removido los charts que se alimentaban de Math.random + funciones senoidales porque destruyen credibilidad ejecutiva.",
  },
  {
    titulo: "Separación dato vs supuesto",
    texto: "Las proyecciones distinguen siempre entre lo que el dato dice (extrapolación) y lo que el estratega asume (sliders de ajuste). Mezclarlos sin marca pierde rigor analítico.",
  },
  {
    titulo: "Banda de incertidumbre antes que punto único",
    texto: "Toda proyección incluye banda 80% (1.28σ) y declara la calidad de la estimación según número de ciclos disponibles. Un solo número mágico tipo 'MORENA ganará con 42.3%' es deshonesto con n bajo.",
  },
  {
    titulo: "Cadena de fallback en LLMs",
    texto: "Las edge functions con IA usan cadena Gemini 2.5 Flash → Pro → Flash-Lite (Lovable AI Gateway). Esto evita caídas por sobrecarga del modelo principal y permite degradación elegante.",
  },
  {
    titulo: "Persistencia con RLS por usuario",
    texto: "Análisis de candidatos, estrategias guardadas, solicitudes de acceso y datos sensibles viven en tablas con Row-Level Security: cada usuario solo ve lo suyo. Las menciones sociales y alertas son lectura compartida para el equipo autenticado.",
  },
  {
    titulo: "Estándar de color semántico",
    texto: "Verde = positivo/momentum favorable. Rojo (destructive) = negativo/erosión. Blanco/foreground = neutro. Colores de partidos solo para identificar partido, nunca para indicar tendencia.",
  },
  {
    titulo: "Tablero ejecutivo, no académico",
    texto: "Cada vista responde a una pregunta operativa: ¿dónde estoy?, ¿dónde está el riesgo?, ¿qué hago?. La metodología existe para sustentar la decisión, no para lucir compleja.",
  },
];

export function MetodologiaMaestra() {
  const [abierto, setAbierto] = useState<string | null>(null);
  const [seccion, setSeccion] = useState<"modulos" | "principios">("modulos");

  return (
    <section className="executive-panel p-5 space-y-4">
      <header className="flex items-start gap-3 border-b border-border/40 pb-4">
        <BookOpen className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Documento maestro · Cierre del proyecto</div>
          <h2 className="text-2xl font-bold text-foreground mt-0.5">Metodología del Sistema de Mando EME</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-3xl leading-relaxed">
            Declaración única y completa de cómo está construido cada módulo del sistema, qué datos consume y por qué se
            eligió cada método. Este documento existe para que cualquier decisión tomada sobre el tablero sea
            auditable y replicable.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40">
        <button
          onClick={() => setSeccion("modulos")}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            seccion === "modulos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Por módulo y pestaña
        </button>
        <button
          onClick={() => setSeccion("principios")}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            seccion === "principios"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Principios transversales
        </button>
      </div>

      {/* Contenido por módulo */}
      {seccion === "modulos" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Cada módulo del sidebar tiene aquí su ficha completa: propósito, fuentes que consume, método de cada pestaña con el porqué de su elección, y limitaciones declaradas.
          </p>
          {MODULOS.map((m) => {
            const Icon = m.icon;
            const open = abierto === m.ruta;
            const estadoCfg = ESTADO_BADGE[m.estado];
            return (
              <Collapsible
                key={m.ruta}
                open={open}
                onOpenChange={(o) => setAbierto(o ? m.ruta : null)}
              >
                <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 rounded-md bg-secondary/40 hover:bg-secondary/60 transition-colors text-left">
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{m.nombre}</span>
                      <Badge variant="outline" className={`text-[9px] font-mono ${estadoCfg.cls}`}>
                        {estadoCfg.label}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">{m.ruta}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{m.proposito}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pt-3 pb-2 space-y-4">
                  {/* Fuentes */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">Fuentes que consume</div>
                    <ul className="space-y-1">
                      {m.fuentes.map((f) => (
                        <li key={f} className="text-[11px] text-foreground/85 flex items-start gap-2">
                          <Database className="w-3 h-3 text-primary/70 mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pestañas */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">Pestañas y método</div>
                    <div className="space-y-3">
                      {m.pestanas.map((p) => (
                        <div key={p.nombre} className="border-l-2 border-primary/40 pl-3 py-1 space-y-1">
                          <div className="text-xs font-bold text-foreground">{p.nombre}</div>
                          <p className="text-[11px] text-foreground/85 leading-relaxed">
                            <strong className="text-muted-foreground">Método:</strong> {p.metodo}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            <strong className="text-primary/90">Por qué:</strong> {p.porque}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Limitaciones */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-destructive/80 mb-1.5">Limitaciones declaradas</div>
                    <ul className="space-y-1">
                      {m.limitaciones.map((l, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                          <span className="text-destructive/70 flex-shrink-0">·</span>
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Principios transversales */}
      {seccion === "principios" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Reglas de diseño y análisis aplicadas a todo el sistema. Si en algún módulo notas inconsistencia con estos principios, es un bug, no un feature.
          </p>
          {PRINCIPIOS.map((p, i) => (
            <div key={p.titulo} className="p-3 rounded-md bg-secondary/30 border-l-2 border-primary/50 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-primary">P{String(i + 1).padStart(2, "0")}</span>
                <h4 className="text-sm font-bold text-foreground">{p.titulo}</h4>
              </div>
              <p className="text-[11px] text-foreground/85 leading-relaxed">{p.texto}</p>
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] font-mono text-muted-foreground/80 border-t border-border/30 pt-3 leading-relaxed">
        <strong className="text-foreground/80">Principio rector del proyecto:</strong> mostramos cómo llegamos al
        número porque un tablero ejecutivo sin metodología visible es indistinguible de adivinación. Cualquier supuesto
        se puede cuestionar; cualquier cálculo se puede replicar.
      </div>
    </section>
  );
}
