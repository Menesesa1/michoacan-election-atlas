import { useState } from "react";
import { ChevronDown, BookOpen, Calculator, AlertTriangle, Target, Database } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SeccionMeta {
  icon: typeof Calculator;
  titulo: string;
  resumen: string;
  detalle: { sub: string; texto: string; porque: string }[];
}

const SECCIONES: SeccionMeta[] = [
  {
    icon: Database,
    titulo: "Fuente de datos",
    resumen: "Cómputos oficiales INE/IEM 2018 → 2024, agregados por distrito y por partido.",
    detalle: [
      {
        sub: "Histórico real, no mock",
        texto: "La proyección consume el mismo DataContext que alimenta KPIs y mapas: cómputos distritales federales (11 distritos) y locales (24 distritos) de Michoacán.",
        porque: "Sin dato real no hay proyección honesta. Cualquier modelo entrenado con series sintéticas (random + senos) es ruido, no inteligencia.",
      },
      {
        sub: "Separación federal vs local",
        texto: "Nunca mezclamos elecciones federales con locales en la misma serie. Cada nivel se proyecta contra su propio histórico del mismo tipo.",
        porque: "El electorado activo, las coaliciones y los actores son distintos en cada nivel. Mezclarlos contamina la tendencia.",
      },
      {
        sub: "Ciclos disponibles (n)",
        texto: "Hoy contamos con 3 ciclos por nivel (2018, 2021, 2024). El sistema declara la calidad: alta (≥4), media (3) o baja (≤2).",
        porque: "Honestidad estadística. Con n=3 la regresión es indicativa, no concluyente, y así se etiqueta en el panel.",
      },
    ],
  },
  {
    icon: Calculator,
    titulo: "Método 1 · Regresión lineal por partido",
    resumen: "Ajusta una línea de tendencia sobre el % histórico de cada partido y la extrapola a 2027.",
    detalle: [
      {
        sub: "Mínimos cuadrados ordinarios (OLS)",
        texto: "Para cada partido calculamos pendiente e intercepto que minimizan el error cuadrático sobre los puntos (año, %).",
        porque: "Es el método estándar más transparente. Cualquier analista puede replicarlo con Excel y verificar el número.",
      },
      {
        sub: "R² como diagnóstico interno",
        texto: "Calculamos el coeficiente de determinación para saber qué tan bien la línea ajusta al histórico real.",
        porque: "Si R² es bajo significa que el partido oscila sin tendencia clara y la regresión sola no basta — por eso siempre la combinamos con swing.",
      },
      {
        sub: "Clasificación de tendencia",
        texto: "Pendiente >+0.5pp/ciclo = alza. <-0.5 = baja. Entre ambos = estable.",
        porque: "Convierte un número técnico en una señal operativa para el estratega.",
      },
    ],
  },
  {
    icon: Calculator,
    titulo: "Método 2 · Swing uniforme",
    resumen: "Toma el último resultado real y le aplica el cambio observado entre los dos últimos ciclos.",
    detalle: [
      {
        sub: "Fórmula: pct₂₀₂₇ = pct₂₀₂₄ + (pct₂₀₂₄ − pct₂₀₂₁)",
        texto: "Asume que el momentum reciente se mantiene. Es lo que usan BBC, FiveThirtyEight y Cook Political Report para midterms.",
        porque: "Cuando hay un realineamiento (ej. crecimiento sostenido de MORENA) la regresión lineal lo subestima. El swing lo captura mejor.",
      },
      {
        sub: "Aplicación distrito por distrito",
        texto: "En la proyección distrital aplicamos swing localmente con los pcts del distrito, no con el promedio estatal.",
        porque: "Los distritos de la sierra se mueven distinto a los urbanos. Un swing nacional uniforme borra estas asimetrías; uno por distrito las preserva.",
      },
    ],
  },
  {
    icon: Target,
    titulo: "Consenso entre métodos",
    resumen: "Promedio simple de regresión y swing como número operativo principal.",
    detalle: [
      {
        sub: "Por qué promediar y no elegir uno",
        texto: "Cada método tiene sesgos opuestos: regresión sobreaplana realineamientos, swing sobreproyecta volatilidad puntual. El promedio reduce ambos sesgos.",
        porque: "Es la misma lógica del 'forecast averaging' que usan los modelos de Nate Silver, Economist y Polymarket: ningún modelo solo es mejor que el ensamble.",
      },
      {
        sub: "Banda de incertidumbre 80%",
        texto: "Calculamos σ (desviación estándar) de las variaciones inter-elecciones del partido y construimos banda = consenso ± 1.28σ (con piso de 1.5pp).",
        porque: "1.28σ corresponde al intervalo de confianza del 80%, estándar en demoscopía. El piso de 1.5pp evita bandas irrealmente estrechas con n bajo.",
      },
    ],
  },
  {
    icon: AlertTriangle,
    titulo: "Clasificación distrital de riesgo",
    resumen: "Cada distrito se etiqueta según margen proyectado y cambio respecto al margen actual.",
    detalle: [
      {
        sub: "Volteado",
        texto: "El partido ganador proyectado es distinto al ganador actual. Bandera roja máxima.",
        porque: "Es el escenario que cambia el mapa político. Prioridad uno de presupuesto y candidato.",
      },
      {
        sub: "Competido",
        texto: "Margen proyectado <5pp. El distrito se decide por turnout y campaña, no por estructura.",
        porque: "Bajo este margen un buen candidato o una mala semana cambian el resultado. Aquí se gana o se pierde la elección estatal.",
      },
      {
        sub: "En riesgo",
        texto: "Mismo ganador pero margen cae más de 3pp. Erosión.",
        porque: "Indica que la tendencia favorece al rival. Requiere contención territorial antes de que se convierta en volteado.",
      },
      {
        sub: "Oportunidad",
        texto: "Mismo ganador y margen crece más de 3pp. Momentum.",
        porque: "Zonas donde la inversión adicional rinde más: el dato dice que la ola está a favor.",
      },
      {
        sub: "Consolidado",
        texto: "Margen proyectado ≥15pp y sin erosión significativa.",
        porque: "Bastión. Mantenimiento mínimo, recursos van a otro lado.",
      },
    ],
  },
  {
    icon: BookOpen,
    titulo: "Ajustes manuales del estratega",
    resumen: "Sliders ±10pp por partido que se suman al consenso para modelar supuestos.",
    detalle: [
      {
        sub: "Separación dato vs supuesto",
        texto: "El consenso base sale del dato histórico. El ajuste del estratega es subjetivo y se contabiliza por separado en la barra.",
        porque: "Un buen tablero distingue lo que el dato dice de lo que el operador asume. Mezclarlos sin marca pierde rigor analítico.",
      },
      {
        sub: "Rango limitado a ±10pp",
        texto: "El slider no permite mover más de 10 puntos porcentuales por partido.",
        porque: "Cambios mayores no son ajustes, son escenarios disruptivos que merecen su propio modelo (no una proyección lineal con override).",
      },
    ],
  },
  {
    icon: AlertTriangle,
    titulo: "Limitaciones que asumimos",
    resumen: "Lo que esta proyección NO hace y por qué.",
    detalle: [
      {
        sub: "No es pronóstico",
        texto: "No predecimos quién ganará 2027. Proyectamos qué pasaría si los patrones observados se mantienen.",
        porque: "Un pronóstico requiere modelo de turnout, encuestas en tiempo real y modelado de candidatos. Aquí solo proyectamos sobre estructura histórica.",
      },
      {
        sub: "No incorpora encuestas en vivo",
        texto: "El módulo de encuestadoras vive aparte (ComparadorEncuestadoras) con su propia metodología ponderada.",
        porque: "Mezclar histórico estructural con tracking de coyuntura requiere modelos bayesianos más complejos. Por ahora viven separados y se leen en paralelo.",
      },
      {
        sub: "n=3 ciclos es estadísticamente flaco",
        texto: "Con tres puntos cualquier regresión es sensible al outlier. Por eso siempre se acompaña con swing y banda ancha.",
        porque: "Ser explícitos con la limitación es lo que separa este tablero de los charts decorativos que generan números falsamente precisos.",
      },
    ],
  },
];

export function MetodologiaProyeccion() {
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <section className="executive-panel p-5 space-y-3">
      <header className="flex items-start gap-3 border-b border-border/40 pb-3">
        <BookOpen className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Transparencia metodológica</div>
          <h3 className="text-xl font-bold text-foreground mt-0.5">Cómo se construye la proyección 2027</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Toda la lógica que mueve los números de esta página, qué método usamos en cada paso y por qué lo elegimos.
            Sin esto, el tablero sería opaco y por tanto poco confiable para tomar decisiones.
          </p>
        </div>
      </header>

      <div className="space-y-2">
        {SECCIONES.map((s) => {
          const Icon = s.icon;
          const open = abierta === s.titulo;
          return (
            <Collapsible
              key={s.titulo}
              open={open}
              onOpenChange={(o) => setAbierta(o ? s.titulo : null)}
            >
              <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 rounded-md bg-secondary/40 hover:bg-secondary/60 transition-colors text-left">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">{s.titulo}</div>
                  <div className="text-[11px] text-muted-foreground">{s.resumen}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pt-2 pb-1 space-y-3">
                {s.detalle.map((d) => (
                  <div key={d.sub} className="border-l-2 border-primary/40 pl-3 py-1 space-y-1">
                    <div className="text-xs font-bold text-foreground">{d.sub}</div>
                    <p className="text-[11px] text-foreground/85 leading-relaxed">{d.texto}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-primary/90">Por qué:</strong> {d.porque}
                    </p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <div className="text-[10px] font-mono text-muted-foreground/80 border-t border-border/30 pt-3 leading-relaxed">
        <strong className="text-foreground/80">Principio rector:</strong> mostramos cómo llegamos al número porque un
        tablero ejecutivo sin metodología visible es indistinguible de adivinación. Cualquier supuesto se puede
        cuestionar; cualquier cálculo se puede replicar.
      </div>
    </section>
  );
}
