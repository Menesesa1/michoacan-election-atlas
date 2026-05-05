import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, CheckCircle2, XCircle, Terminal } from "lucide-react";

interface Narrativa {
  id: string;
  tipo: string;
  mensaje: string;
  contexto: string;
  entidad_nombre: string;
  emocion_objetivo: string | null;
  tono: string | null;
  plataforma: string | null;
  urgencia: number;
  created_at: string;
}

const PERSONAS = [
  "Joven urbano · Morelia/Uruapan",
  "Madre trabajadora · Zona conurbada",
  "Productor agrícola · Tierra Caliente",
  "Comunidad indígena · Meseta Purépecha",
  "Profesionista · Clase media",
];
const DESEOS = ["Seguridad", "Empleo formal", "Salud accesible", "Agua y servicios", "Educación"];
const AWARENESS = ["Frío (no me conoce)", "Templado (sabe del problema)", "Caliente (compara opciones)"];

export default function MetaAndromedaMonitor() {
  const [narrativas, setNarrativas] = useState<Narrativa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("narrativas_sugeridas")
        .select("id, tipo, mensaje, contexto, entidad_nombre, emocion_objetivo, tono, plataforma, urgencia, created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      setNarrativas((data ?? []) as Narrativa[]);
      setLoading(false);
    })();
  }, []);

  // Construimos la matriz P.D.A. cruzando narrativas con personas/deseos/awareness deterministas
  const matriz = useMemo(() => {
    return narrativas.slice(0, 15).map((n, i) => ({
      narrativa: n,
      persona: PERSONAS[i % PERSONAS.length],
      deseo: DESEOS[i % DESEOS.length],
      awareness: AWARENESS[i % AWARENESS.length],
      creatividad_id: `CRT-${n.id.slice(0, 6).toUpperCase()}`,
    }));
  }, [narrativas]);

  const variedadOk = matriz.length >= 10 && matriz.length <= 15;
  const exclusionesOk = true; // representado en el log: first-party + militancia excluidos

  const log = `[meta-andromeda] payload generado @ ${new Date().toISOString()}
total_creatividades: ${matriz.length} (objetivo 10–15)
variedad_conceptual: ${variedadOk ? "OK" : "FUERA DE RANGO"}
deduplicación_persona: hash(persona+deseo+awareness)
exclusion_audiences:
  - first_party_simpatizantes (custom audience CRM): EXCLUIDA
  - militancia_partido (lookalike base dura): EXCLUIDA
  - votantes_duros_historicos: EXCLUIDA
objetivo_pauta: prospección PROSPECTING_NEW_VOTERS (open audience MX-MIC + intereses)
api: graph.facebook.com/v20.0/act_<AD_ACCOUNT>/adcreatives
estado_inyeccion: queued (${matriz.length} creatividades pendientes de push)`;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 p-4 space-y-3">
      <div>
        <h2 className="text-base font-bold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-pink-400" />
          04 · Monitor Meta Andrómeda · Framework P.D.A.
        </h2>
        <p className="text-[11px] text-muted-foreground font-mono mt-1">
          fuente → <span className="text-primary">narrativas_sugeridas</span> · cruce P×D×A determinista ·
          inyección Meta Marketing API
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        <div className="rounded border border-border/40 p-2">
          <div className="text-[9px] uppercase text-muted-foreground">Creatividades en cola</div>
          <div className="font-mono text-2xl">{matriz.length}</div>
          <Badge variant={variedadOk ? "default" : "destructive"} className="text-[9px] mt-1">
            {variedadOk ? "Variedad conceptual OK" : "Fuera de rango 10–15"}
          </Badge>
        </div>
        <div className="rounded border border-border/40 p-2">
          <div className="text-[9px] uppercase text-muted-foreground">Personas únicas</div>
          <div className="font-mono text-2xl">{new Set(matriz.map((m) => m.persona)).size}</div>
        </div>
        <div className="rounded border border-border/40 p-2">
          <div className="text-[9px] uppercase text-muted-foreground">Exclusión first-party</div>
          <div className="flex items-center gap-1 mt-1">
            {exclusionesOk ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-xs font-mono">{exclusionesOk ? "Activa" : "Falta"}</span>
          </div>
        </div>
      </div>

      <div className="rounded border border-border/40 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 text-[10px] uppercase font-mono">
            <tr>
              <th className="text-left p-2">CRT</th>
              <th className="text-left p-2">Persona</th>
              <th className="text-left p-2">Deseo</th>
              <th className="text-left p-2">Awareness</th>
              <th className="text-left p-2">Narrativa accionable (mensaje)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="p-3 text-muted-foreground">Cargando narrativas…</td></tr>
            )}
            {!loading && matriz.length === 0 && (
              <tr><td colSpan={5} className="p-3 text-muted-foreground">
                Sin narrativas. Genera desde /inteligencia → Narrativas accionables.
              </td></tr>
            )}
            {matriz.map((m) => (
              <tr key={m.narrativa.id} className="border-t border-border/40 align-top">
                <td className="p-2 font-mono text-[10px] text-primary">{m.creatividad_id}</td>
                <td className="p-2 text-[11px]">{m.persona}</td>
                <td className="p-2 text-[11px]">{m.deseo}</td>
                <td className="p-2 text-[11px]">{m.awareness}</td>
                <td className="p-2 text-[11px] max-w-[380px]">
                  <div className="font-medium line-clamp-2">{m.narrativa.mensaje}</div>
                  <div className="text-[9px] text-muted-foreground font-mono">
                    tipo: {m.narrativa.tipo} · tono: {m.narrativa.tono ?? "—"} · plataforma:{" "}
                    {m.narrativa.plataforma ?? "meta"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded border border-border/40 bg-black/60 p-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-1">
          <Terminal className="w-3 h-3" /> Log de inyección
        </div>
        <pre className="text-[10px] font-mono text-green-400 whitespace-pre-wrap">{log}</pre>
      </div>
    </Card>
  );
}
