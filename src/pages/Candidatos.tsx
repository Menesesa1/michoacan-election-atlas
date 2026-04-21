import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, GitCompare, Search, Layers, Star, Swords } from "lucide-react";
import { CandidatoCard } from "@/components/candidatos/CandidatoCard";
import { CandidatoForm } from "@/components/candidatos/CandidatoForm";
import { FichaCandidato } from "@/components/candidatos/FichaCandidato";
import { ComparadorCandidatos } from "@/components/candidatos/ComparadorCandidatos";
import type { Candidato, TipoAnalisis } from "@/lib/candidatos/types";
import { obtenerTiposExistentes, generarTodosLosAnalisis } from "@/lib/candidatos/auto-analisis";
import { FASES_CANDIDATURA, FASE_LABEL, contiendaKey, contiendaLabel, type FaseCandidatura, type ContiendaKey as ContiendaKeyT } from "@/lib/candidatos/fase";
import { cn } from "@/lib/utils";

export default function Candidatos() {
  const { toast } = useToast();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState<string>("all");
  const [filtroPartido, setFiltroPartido] = useState<string>("all");
  const [filtroFase, setFiltroFase] = useState<string>("all");
  const [filtroEquipo, setFiltroEquipo] = useState<"all" | "propios" | "oposicion">("all");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [comparando, setComparando] = useState(false);
  const [agruparContienda, setAgruparContienda] = useState(false);
  const [fichaAbierta, setFichaAbierta] = useState<Candidato | null>(null);
  const [analisisMap, setAnalisisMap] = useState<Record<string, Set<TipoAnalisis>>>({});

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidatos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error cargando candidatos", description: error.message, variant: "destructive" });
    } else {
      const lista = (data ?? []) as unknown as Candidato[];
      setCandidatos(lista);
      // Carga estado de análisis por candidato
      if (lista.length > 0) {
        const map = await obtenerTiposExistentes(lista.map((c) => c.id));
        setAnalisisMap(map);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    void cargar();
    void seedSiVacio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inserta automáticamente Alfonso Martínez y Raúl Morón si el usuario no tiene candidatos.
  const seedSiVacio = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;
    const { count } = await supabase
      .from("candidatos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authData.user.id);
    if ((count ?? 0) > 0) return;

    const seed = [
      {
        user_id: authData.user.id,
        nombre: "Alfonso Martínez Alcázar",
        partido: "PAN",
        nivel: "ayuntamientos",
        territorio: "Morelia",
        cargo_buscado: "Presidencia Municipal de Morelia",
        bio_breve: "Presidente municipal de Morelia. Ganó la alcaldía en 2015 como candidato INDEPENDIENTE (primer alcalde independiente de la capital michoacana), y reelecto en 2021 por el PAN. Diputado local previo.",
        redes: { twitter: "@AlfonsoMtzAl", facebook: "AlfonsoMartinezAlcazar" },
        notas: "Trayectoria atípica: independiente en 2015 → PAN en 2021. Perfil técnico-administrativo, cercanía con clase media urbana de Morelia.",
        war_room: [
          {
            id: crypto.randomUUID(),
            nombre: "Goberna",
            rol: "consultor_estrategia",
            tipo: "consultora",
            visible: true,
            trayectoria_breve: "Consultora política asociada a estrategia de campaña de Alfonso Martínez (referencia pública del entorno).",
            inconsistencias: [],
            fuentes: [],
            notas_internas: "Borrador inicial — completar fuentes antes de usar en estrategia.",
          },
          {
            id: crypto.randomUUID(),
            nombre: "EME Comunicación",
            rol: "consultor_imagen",
            tipo: "consultora",
            visible: true,
            trayectoria_breve: "Consultora de comunicación e imagen pública asociada al entorno de campaña.",
            inconsistencias: [],
            fuentes: [],
            notas_internas: "Borrador inicial — completar fuentes antes de usar en estrategia.",
          },
        ],
      },
      {
        user_id: authData.user.id,
        nombre: "Raúl Morón Orozco",
        partido: "MORENA",
        nivel: "ayuntamientos",
        territorio: "Morelia",
        cargo_buscado: "Presidencia Municipal de Morelia",
        bio_breve: "Ex presidente municipal de Morelia (2018-2021), ex senador. Figura histórica de la izquierda morelense.",
        redes: { twitter: "@raulmoronoficial", facebook: "raulmoronoficial" },
        notas: "Liderazgo morenista con base en colonias populares y zona rural del municipio.",
        war_room: [
          {
            id: crypto.randomUUID(),
            nombre: "Humberto Moreno",
            rol: "operador_politico",
            tipo: "persona",
            visible: false,
            trayectoria_breve: "Operador político vinculado al entorno de Raúl Morón. Mencionado en reportes locales como articulador detrás de movimientos clave.",
            inconsistencias: ["Por documentar con fuentes verificables"],
            fuentes: [],
            notas_internas: "Borrador inicial — completar fuentes antes de usar en estrategia.",
          },
        ],
      },
    ];
    const { data: insertados, error } = await supabase.from("candidatos").insert(seed).select();
    if (error || !insertados) return;
    await cargar();

    // Auto-genera análisis para los seed (en background, sin bloquear UI)
    toast({
      title: "Generando análisis IA de candidatos demo…",
      description: "Alfonso Martínez y Raúl Morón. Tarda ~1-2 min.",
    });
    for (const cand of insertados) {
      void generarTodosLosAnalisis(
        { ...(cand as unknown as Candidato), redes: (cand.redes ?? {}) as Record<string, string | undefined> },
        authData.user.id,
      ).then(() => {
        void cargar();
      });
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este candidato y todos sus análisis?")) return;
    const { error } = await supabase.from("candidatos").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Candidato eliminado" });
    await cargar();
  };

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filtrados = useMemo(() => {
    return candidatos.filter((c) => {
      if (filtroNivel !== "all" && c.nivel !== filtroNivel) return false;
      if (filtroPartido !== "all" && c.partido !== filtroPartido) return false;
      if (filtroFase !== "all" && (c.fase ?? "precampana") !== filtroFase) return false;
      if (filtroEquipo === "propios" && !c.es_propio) return false;
      if (filtroEquipo === "oposicion" && c.es_propio) return false;
      if (busqueda && !`${c.nombre} ${c.partido} ${c.territorio}`.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [candidatos, filtroNivel, filtroPartido, filtroFase, filtroEquipo, busqueda]);

  const conteoEquipo = useMemo(() => ({
    propios: candidatos.filter((c) => c.es_propio).length,
    oposicion: candidatos.filter((c) => !c.es_propio).length,
  }), [candidatos]);

  // Lista de partidos únicos detectados (para el selector de filtro)
  const partidosDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidatos) set.add(c.partido);
    return Array.from(set).sort();
  }, [candidatos]);

  // Agrupa por contienda (mismo cargo + territorio + partido + fase)
  const grupos = useMemo(() => {
    const map = new Map<string, { key: ContiendaKeyT; candidatos: Candidato[] }>();
    for (const c of filtrados) {
      const key: ContiendaKeyT = {
        nivel: c.nivel,
        territorio: c.territorio,
        partido: c.partido,
        fase: (c.fase ?? "precampana") as FaseCandidatura,
      };
      const k = contiendaKey(key);
      const g = map.get(k);
      if (g) g.candidatos.push(c);
      else map.set(k, { key, candidatos: [c] });
    }
    // Ordena: grupos con más aspirantes primero (los más interesantes para comparar)
    return Array.from(map.values()).sort((a, b) => b.candidatos.length - a.candidatos.length);
  }, [filtrados]);

  const candidatosCompare = seleccionados
    .map((id) => candidatos.find((c) => c.id === id))
    .filter(Boolean) as Candidato[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Inteligencia · Candidatos
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Análisis de candidatos
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Registra candidatos por nivel y territorio. Genera perfil FODA, OSINT y análisis discursivo con IA.
            Compáralos lado a lado y conéctalos a tu Estrategia 360.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {seleccionados.length >= 2 && (
            <Button variant="outline" onClick={() => setComparando(true)}>
              <GitCompare className="w-4 h-4 mr-1.5" /> Comparar ({seleccionados.length})
            </Button>
          )}
          {seleccionados.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSeleccionados([])}>
              Limpiar selección
            </Button>
          )}
          <CandidatoForm onSaved={cargar} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">Equipo:</span>
          {([
            { value: "all", label: "Todos", icon: null, count: candidatos.length },
            { value: "propios", label: "Mis candidatos", icon: Star, count: conteoEquipo.propios },
            { value: "oposicion", label: "Oposición", icon: Swords, count: conteoEquipo.oposicion },
          ] as const).map((opt) => {
            const active = filtroEquipo === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFiltroEquipo(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs border font-medium transition-colors flex items-center gap-1.5",
                  active
                    ? opt.value === "propios"
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : opt.value === "oposicion"
                      ? "bg-muted/50 border-muted-foreground/40 text-foreground"
                      : "bg-secondary border-border text-foreground"
                    : "bg-card/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}
              >
                {Icon && <Icon className={cn("w-3 h-3", active && opt.value === "propios" && "fill-primary")} />}
                {opt.label}
                <span className="text-[10px] font-mono opacity-70">{opt.count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, partido o territorio…"
              className="pl-9"
            />
          </div>
          <Select value={filtroNivel} onValueChange={setFiltroNivel}>
            <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cargos</SelectItem>
              <SelectItem value="gobernador">Gobernatura</SelectItem>
              <SelectItem value="diputados_federales">Diputado Federal</SelectItem>
              <SelectItem value="diputados">Diputado Local</SelectItem>
              <SelectItem value="ayuntamientos">Ayuntamiento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPartido} onValueChange={setFiltroPartido}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Partido" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los partidos</SelectItem>
              {partidosDisponibles.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroFase} onValueChange={setFiltroFase}>
            <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fases</SelectItem>
              {FASES_CANDIDATURA.map((f) => (
                <SelectItem key={f} value={f}>{FASE_LABEL[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 px-1">
          <Switch id="agrupar" checked={agruparContienda} onCheckedChange={setAgruparContienda} />
          <Label htmlFor="agrupar" className="text-xs cursor-pointer flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Agrupar por contienda interna (mismo partido + cargo + territorio + fase)
          </Label>
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">
            {filtrados.length} candidato{filtrados.length === 1 ? "" : "s"} · {grupos.length} contienda{grupos.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {comparando && candidatosCompare.length >= 2 && (
        <ComparadorCandidatos
          candidatos={candidatosCompare}
          onClose={() => setComparando(false)}
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-48 w-full" />))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No hay candidatos que coincidan con los filtros. Agrega uno nuevo arriba.
        </div>
      ) : agruparContienda ? (
        <div className="space-y-6">
          {grupos.map((g) => (
            <div key={contiendaKey(g.key)} className="space-y-2">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {g.candidatos.length} aspirante{g.candidatos.length === 1 ? "" : "s"}
                  </Badge>
                  <h3 className="text-sm font-semibold">{contiendaLabel(g.key)}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">
                    {g.key.nivel === "gobernador"
                      ? "Gobernatura"
                      : g.key.nivel === "diputados_federales"
                      ? "Diputado federal"
                      : g.key.nivel === "diputados"
                      ? "Diputado local"
                      : "Ayuntamiento"}
                  </span>
                </div>
                {g.candidatos.length >= 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSeleccionados(g.candidatos.map((c) => c.id));
                      setComparando(true);
                    }}
                  >
                    <GitCompare className="w-3.5 h-3.5 mr-1.5" /> Comparar grupo
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.candidatos.map((c) => (
                  <CandidatoCard
                    key={c.id}
                    candidato={c}
                    onOpen={() => setFichaAbierta(c)}
                    onDelete={() => eliminar(c.id)}
                    onChanged={cargar}
                    selected={seleccionados.includes(c.id)}
                    onToggleSelect={() => toggleSeleccion(c.id)}
                    analisisHechos={analisisMap[c.id]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map((c) => (
            <CandidatoCard
              key={c.id}
              candidato={c}
              onOpen={() => setFichaAbierta(c)}
              onDelete={() => eliminar(c.id)}
              onChanged={cargar}
              selected={seleccionados.includes(c.id)}
              onToggleSelect={() => toggleSeleccion(c.id)}
              analisisHechos={analisisMap[c.id]}
            />
          ))}
        </div>
      )}

      <FichaCandidato
        candidato={fichaAbierta}
        open={!!fichaAbierta}
        onClose={() => setFichaAbierta(null)}
      />
    </div>
  );
}
