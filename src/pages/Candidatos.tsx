import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GitCompare, Search } from "lucide-react";
import { CandidatoCard } from "@/components/candidatos/CandidatoCard";
import { CandidatoForm } from "@/components/candidatos/CandidatoForm";
import { FichaCandidato } from "@/components/candidatos/FichaCandidato";
import { ComparadorCandidatos } from "@/components/candidatos/ComparadorCandidatos";
import type { Candidato } from "@/lib/candidatos/types";

export default function Candidatos() {
  const { toast } = useToast();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState<string>("all");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [comparando, setComparando] = useState(false);
  const [fichaAbierta, setFichaAbierta] = useState<Candidato | null>(null);

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidatos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error cargando candidatos", description: error.message, variant: "destructive" });
    } else {
      setCandidatos((data ?? []) as unknown as Candidato[]);
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
        cargo_buscado: "Reelección Presidencia Municipal de Morelia",
        bio_breve: "Presidente municipal de Morelia (Movimiento Ciudadano y luego PAN). Diputado local previo. Base electoral en zona urbana de Morelia.",
        redes: { twitter: "@AlfonsoMtzAl", facebook: "AlfonsoMartinezAlcazar" },
        notas: "Perfil técnico-administrativo. Cercanía con clase media urbana de Morelia.",
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
      },
    ];
    const { error } = await supabase.from("candidatos").insert(seed);
    if (!error) await cargar();
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
    setSeleccionados((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const filtrados = useMemo(() => {
    return candidatos.filter((c) => {
      if (filtroNivel !== "all" && c.nivel !== filtroNivel) return false;
      if (busqueda && !`${c.nombre} ${c.partido} ${c.territorio}`.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [candidatos, filtroNivel, busqueda]);

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
        <div className="flex gap-2">
          {seleccionados.length === 2 && (
            <Button variant="outline" onClick={() => setComparando(true)}>
              <GitCompare className="w-4 h-4 mr-1.5" /> Comparar ({seleccionados.length})
            </Button>
          )}
          <CandidatoForm onSaved={cargar} />
        </div>
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
          <SelectTrigger className="w-full md:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            <SelectItem value="gobernador">Gobernatura</SelectItem>
            <SelectItem value="diputados">Diputado Local</SelectItem>
            <SelectItem value="ayuntamientos">Ayuntamiento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {comparando && candidatosCompare.length === 2 && (
        <ComparadorCandidatos
          candidatos={candidatosCompare as [Candidato, Candidato]}
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
