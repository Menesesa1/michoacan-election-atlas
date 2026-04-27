import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Info,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  detectAndParse,
  aSnapshotDistritalFederal,
  type ParsedDataset,
} from "@/lib/csv-schema-detector";
import { loadCatalogo, lookupSeccion } from "@/lib/secciones-catalogo";
import { useElectoralData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";

const ORIGEN_LABEL: Record<string, string> = {
  INE_2024: "INE Cómputos 2024",
  INE_2021: "INE Cómputos 2021",
  INE_2018: "INE Cómputos 2018",
  IEM_2024: "IEM Michoacán 2024",
  IEM_2021: "IEM Michoacán 2021",
  IEM_HISTORICO: "IEM histórico",
  INE_PADRON: "INE Padrón / Lista Nominal",
  desconocido: "Esquema no reconocido",
};

const TIPO_LABEL: Record<string, string> = {
  presidencia: "Presidencia",
  diputacion_federal: "Diputación Federal",
  gobernatura: "Gubernatura",
  diputacion_local: "Diputación Local",
  ayuntamiento: "Ayuntamiento",
  padron_lista_nominal: "Padrón / Lista Nominal",
  desconocido: "—",
};

export function ImportadorCSV() {
  const { importData, importedKeys, resetToMock, isUsingMock } = useElectoralData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<{
    file: File;
    parsed: ParsedDataset;
    suggestedKey: string;
    suggestedLabel: string;
  } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Error", description: "Solo se aceptan archivos CSV", variant: "destructive" });
      return;
    }

    setLoading(true);
    setPending(null);

    try {
      // Pre-cargar catálogo para que el mapeo sección→distrito federal funcione
      await loadCatalogo().catch(() => null);
      const parsed = await detectAndParse(file);

      const slug = `${parsed.origen.toLowerCase()}_${parsed.tipo_eleccion}`;
      const label = `${ORIGEN_LABEL[parsed.origen]} · ${TIPO_LABEL[parsed.tipo_eleccion]}`;

      setPending({ file, parsed, suggestedKey: slug, suggestedLabel: label });
    } catch {
      toast({ title: "Error", description: "Error inesperado al procesar el archivo", variant: "destructive" });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirmImport = () => {
    if (!pending) return;
    const { parsed, suggestedKey, suggestedLabel } = pending;

    if (parsed.tipo_eleccion === "padron_lista_nominal") {
      toast({
        title: "Padrón detectado",
        description:
          "Este archivo es de Padrón/Lista Nominal y no se incorpora como elección. Usa el módulo de Demografía para esta data.",
      });
      setPending(null);
      return;
    }

    // Construye el mapa sección → distrito federal usando el catálogo
    const catMap = new Map<number, number>();
    for (const s of parsed.secciones) {
      const cat = lookupSeccion(s.seccion);
      if (cat) catMap.set(s.seccion, cat.dis);
    }

    const distritos = aSnapshotDistritalFederal(parsed, suggestedKey, catMap);
    if (distritos.length === 0) {
      toast({
        title: "Sin agregación posible",
        description: "No se pudo asociar ninguna sección a un distrito federal del catálogo INE.",
        variant: "destructive",
      });
      return;
    }

    importData(
      suggestedKey,
      suggestedLabel,
      parsed.anio,
      distritos.map((d) => ({
        ...d,
        // electoral-data espera tipos canónicos de Partido; el detector ya los normaliza
      })) as Parameters<typeof importData>[3],
    );

    toast({
      title: "✅ Importado",
      description: `${parsed.stats.secciones_unicas} secciones · ${distritos.length} distritos federales reconstruidos`,
    });
    setPending(null);
  };

  return (
    <div className="glass-panel p-4 animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Importar Datos · Detección automática
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono">
            Reconoce esquemas INE 2024 / 2021 / 2018 e IEM Michoacán · agrega por sección electoral
          </p>
        </div>
        {!isUsingMock && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToMock}
            className="text-[10px] text-muted-foreground hover:text-accent"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Restaurar datos mock
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-[11px]">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-muted-foreground leading-relaxed space-y-1">
            <p className="font-medium text-primary">Cómo funciona</p>
            <p>
              Sube el CSV oficial sin transformarlo. El detector identifica el origen
              (INE federal o IEM local), el tipo de elección, los partidos (incluyendo
              coaliciones 2024) y filtra Michoacán automáticamente. El modelo unificado
              guarda <strong>una fila por sección electoral</strong> (la unidad atómica
              del sistema), de donde se reconstruye municipio, distrito local, distrito
              federal y estado.
            </p>
            <p>
              Fuentes:{" "}
              <a href="https://computos2024.ine.mx/" target="_blank" rel="noopener" className="text-primary hover:underline">INE 2024</a>{" "}·{" "}
              <a href="https://computos2021.ine.mx/" target="_blank" rel="noopener" className="text-primary hover:underline">2021</a>{" "}·{" "}
              <a href="https://computos2018.ine.mx/" target="_blank" rel="noopener" className="text-primary hover:underline">2018</a>{" "}·{" "}
              <a href="https://iem.org.mx/" target="_blank" rel="noopener" className="text-primary hover:underline">IEM Michoacán</a>
            </p>
          </div>
        </div>
      </div>

      {/* Upload */}
      {!pending && (
        <div className="relative">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            disabled={loading}
          />
          <div className="flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors bg-secondary/20">
            {loading ? (
              <span className="text-xs text-primary animate-pulse-glow font-mono">
                Detectando esquema...
              </span>
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Arrastra o haz clic para subir un CSV (INE o IEM)
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview de detección */}
      {pending && (
        <DetectionPreview
          parsed={pending.parsed}
          fileName={pending.file.name}
          onConfirm={confirmImport}
          onCancel={() => setPending(null)}
        />
      )}

      {/* Datasets importados */}
      {importedKeys.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground font-mono mb-2">
            DATASETS IMPORTADOS
          </p>
          <div className="flex flex-wrap gap-2">
            {importedKeys.map((key) => (
              <span
                key={key}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-mono"
              >
                <FileSpreadsheet className="w-3 h-3" />
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------

function DetectionPreview({
  parsed,
  fileName,
  onConfirm,
  onCancel,
}: {
  parsed: ParsedDataset;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ok = parsed.errores.length === 0 && parsed.secciones.length > 0;
  const conf = Math.round(parsed.confianza * 100);

  return (
    <div
      className={`p-4 rounded-md border space-y-3 text-[11px] ${
        ok ? "bg-primary/5 border-primary/30" : "bg-accent/5 border-accent/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {ok ? (
            <CheckCircle2 className="w-4 h-4 text-primary" />
          ) : (
            <AlertCircle className="w-4 h-4 text-accent" />
          )}
          <span className={`font-semibold ${ok ? "text-primary" : "text-accent"}`}>
            {ok ? "Esquema detectado" : "No se pudo procesar"}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{fileName}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Origen" value={ORIGEN_LABEL[parsed.origen]} />
        <Field label="Elección" value={TIPO_LABEL[parsed.tipo_eleccion]} />
        <Field label="Año" value={parsed.anio || "—"} />
        <Field label="Confianza" value={`${conf}%`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/40">
        <Field label="Filas totales" value={parsed.stats.total_filas.toLocaleString()} />
        <Field label="Filas Michoacán" value={parsed.stats.filas_michoacan.toLocaleString()} />
        <Field label="Secciones" value={parsed.stats.secciones_unicas.toLocaleString()} />
        <Field label="Casillas" value={parsed.stats.casillas_total.toLocaleString()} />
      </div>

      {parsed.partidos.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground font-mono mb-1">
            PARTIDOS DETECTADOS
          </p>
          <div className="flex flex-wrap gap-1.5">
            {parsed.partidos.map((p) => (
              <Badge key={p} variant="outline" className="text-[10px]">
                {p}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <details className="text-muted-foreground">
        <summary className="cursor-pointer text-[10px] font-mono uppercase tracking-wide">
          <Layers className="w-3 h-3 inline mr-1" />
          Pistas de detección y mapeo
        </summary>
        <div className="mt-2 space-y-1 pl-4 text-[10px]">
          {parsed.pistas.map((p, i) => (
            <p key={i}>· {p}</p>
          ))}
          {parsed.stats.columnas_partido_detectadas.length > 0 && (
            <p className="pt-1">
              <strong>Columnas mapeadas:</strong>{" "}
              {parsed.stats.columnas_partido_detectadas.join(" · ")}
            </p>
          )}
          {parsed.stats.columnas_omitidas.length > 0 && (
            <p>
              <strong>Columnas omitidas:</strong>{" "}
              {parsed.stats.columnas_omitidas.join(", ")}
            </p>
          )}
        </div>
      </details>

      {parsed.warnings.length > 0 && (
        <div className="text-[10px] text-amber-500 space-y-0.5">
          {parsed.warnings.map((w, i) => (
            <p key={i}>⚠️ {w}</p>
          ))}
        </div>
      )}
      {parsed.errores.length > 0 && (
        <div className="text-[10px] text-accent space-y-0.5">
          {parsed.errores.map((e, i) => (
            <p key={i}>❌ {e}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={onConfirm} disabled={!ok} className="text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Confirmar e importar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="text-xs">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xs text-foreground font-medium">{value}</p>
    </div>
  );
}
