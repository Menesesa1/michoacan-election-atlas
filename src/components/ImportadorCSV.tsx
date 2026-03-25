import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseINECsv } from "@/lib/csv-parser";
import { useElectoralData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";

const AÑOS_OPCIONES = [2006, 2009, 2012, 2015, 2018, 2021, 2024];

export function ImportadorCSV() {
  const { importData, importedKeys, resetToMock, isUsingMock } = useElectoralData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [año, setAño] = useState(2024);
  const [label, setLabel] = useState("Federal 2024");
  const [eleccionKey, setEleccionKey] = useState("fed2024_import");
  const [filterMichoacan, setFilterMichoacan] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    stats: { totalRows: number; distritosFound: number; partidosDetected: string[]; hasSeccionLevel: boolean };
    errors: string[];
    warnings: string[];
  } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({ title: "Error", description: "Solo se aceptan archivos CSV", variant: "destructive" });
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const result = await parseINECsv(file, eleccionKey, año, filterMichoacan ? 16 : undefined);
      setLastResult(result);

      if (result.success && result.distritos.length > 0) {
        importData(eleccionKey, label, año, result.distritos);
        toast({
          title: "✅ Importación exitosa",
          description: `${result.stats.distritosFound} distritos importados con ${result.stats.partidosDetected.length} partidos detectados`,
        });
      } else {
        toast({
          title: "Error en importación",
          description: result.errors[0] || "No se pudieron procesar los datos",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Error inesperado al procesar el archivo", variant: "destructive" });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="glass-panel p-4 animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-foreground">Importar Datos del INE</h3>
          <p className="text-[10px] text-muted-foreground font-mono">CSV de cómputos distritales · PREP · Lista Nominal</p>
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

      {/* Info box */}
      <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-[11px]">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-muted-foreground leading-relaxed">
            <p className="font-medium text-primary mb-1">Formatos soportados</p>
            <p>
              CSV del INE con columnas de <span className="font-mono text-foreground">DISTRITO</span> y partidos
              (<span className="font-mono text-foreground">PAN, PRI, PRD, PVEM, PT, MC, MORENA</span>).
              El sistema detecta automáticamente las columnas y agrega por distrito si los datos son a nivel casilla o sección.
            </p>
            <p className="mt-1">
              Descarga desde:{" "}
              <a href="https://computos2024.ine.mx/" target="_blank" rel="noopener" className="text-primary hover:underline">Cómputos 2024</a>,{" "}
              <a href="https://computos2018.ine.mx/" target="_blank" rel="noopener" className="text-primary hover:underline">2018</a>,{" "}
              <a href="https://www.ine.mx/voto-y-elecciones/resultados-electorales/" target="_blank" rel="noopener" className="text-primary hover:underline">Resultados Históricos</a>
            </p>
          </div>
        </div>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground font-mono block mb-1">AÑO</label>
          <select
            value={año}
            onChange={(e) => {
              const y = Number(e.target.value);
              setAño(y);
              setLabel(`Federal ${y}`);
              setEleccionKey(`fed${y}_import`);
            }}
            className="w-full h-9 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground"
          >
            {AÑOS_OPCIONES.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono block mb-1">ETIQUETA</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-9 text-xs bg-secondary/50"
            maxLength={30}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono block mb-1">CLAVE</label>
          <Input
            value={eleccionKey}
            onChange={(e) => setEleccionKey(e.target.value)}
            className="h-9 text-xs font-mono bg-secondary/50"
            maxLength={20}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono block mb-1">FILTRO</label>
          <label className="flex items-center gap-2 h-9 cursor-pointer">
            <input
              type="checkbox"
              checked={filterMichoacan}
              onChange={(e) => setFilterMichoacan(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-xs text-foreground">Solo Michoacán (16)</span>
          </label>
        </div>
      </div>

      {/* Upload */}
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
            <span className="text-xs text-primary animate-pulse-glow font-mono">Procesando CSV...</span>
          ) : (
            <>
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Arrastra o haz clic para subir un archivo CSV del INE
              </span>
            </>
          )}
        </div>
      </div>

      {/* Result */}
      {lastResult && (
        <div className={`p-3 rounded-md border text-[11px] ${lastResult.success ? "bg-primary/5 border-primary/20" : "bg-accent/5 border-accent/20"}`}>
          <div className="flex items-center gap-2 mb-2">
            {lastResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : (
              <AlertCircle className="w-4 h-4 text-accent" />
            )}
            <span className={`font-semibold ${lastResult.success ? "text-primary" : "text-accent"}`}>
              {lastResult.success ? "Importación exitosa" : "Error en importación"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
            <span>Filas procesadas:</span>
            <span className="font-mono text-foreground">{lastResult.stats.totalRows.toLocaleString()}</span>
            <span>Distritos encontrados:</span>
            <span className="font-mono text-foreground">{lastResult.stats.distritosFound}</span>
            <span>Partidos detectados:</span>
            <span className="font-mono text-foreground">{lastResult.stats.partidosDetected.join(", ")}</span>
            <span>Nivel de datos:</span>
            <span className="font-mono text-foreground">{lastResult.stats.hasSeccionLevel ? "Sección/Casilla → Agregado" : "Distrito"}</span>
          </div>

          {lastResult.errors.length > 0 && (
            <div className="mt-2 text-accent">
              {lastResult.errors.map((e, i) => <p key={i}>❌ {e}</p>)}
            </div>
          )}
          {lastResult.warnings.length > 0 && (
            <div className="mt-2 text-gold">
              {lastResult.warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Imported datasets */}
      {importedKeys.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground font-mono mb-2">DATASETS IMPORTADOS</p>
          <div className="flex flex-wrap gap-2">
            {importedKeys.map((key) => (
              <span key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-mono">
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
