import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import {
  importarCSVGanadores,
  CSV_PLANTILLA_AYTO,
  CSV_PLANTILLA_DIP,
  type ImportResumen,
} from "@/lib/paridad/importar-csv";
import { toast } from "sonner";

interface Props {
  onImported?: () => void;
}

function descargarPlantilla(nombre: string, contenido: string) {
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportadorGanadoresCSV({ onImported }: Props) {
  const [resumen, setResumen] = useState<ImportResumen | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const r = importarCSVGanadores(text);
    setResumen(r);
    if (r.aplicadas > 0) {
      toast.success(`${r.aplicadas} registros aplicados al motor de paridad`);
      onImported?.();
    }
    if (r.errores > 0) {
      toast.warning(`${r.errores} filas con errores — revisa el detalle`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          Importar ganadoras/ganadores históricos (CSV)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Carga un CSV con el género histórico por municipio o distrito local. Se actualiza
          automáticamente el motor de paridad y las sugerencias 2027. Esquemas aceptados:{" "}
          <code className="text-[10px] bg-muted px-1 rounded">anio,municipio,genero</code> o{" "}
          <code className="text-[10px] bg-muted px-1 rounded">anio,distrito,genero</code>.
          Valores de género: <strong>M</strong>/Mujer/F · <strong>H</strong>/Hombre/Masculino.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => inputRef.current?.click()} size="sm">
            <FileText className="w-4 h-4 mr-1" /> Seleccionar archivo CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => descargarPlantilla("plantilla-ayuntamientos.csv", CSV_PLANTILLA_AYTO)}
          >
            <Download className="w-4 h-4 mr-1" /> Plantilla ayuntamientos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => descargarPlantilla("plantilla-distritos.csv", CSV_PLANTILLA_DIP)}
          >
            <Download className="w-4 h-4 mr-1" /> Plantilla distritos
          </Button>
        </div>

        {resumen && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Total filas: {resumen.totalFilas}</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Aplicadas: {resumen.aplicadas}
              </Badge>
              {resumen.errores > 0 && (
                <Badge className="bg-destructive/15 text-destructive border-destructive/40">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Errores: {resumen.errores}
                </Badge>
              )}
            </div>

            {resumen.detalle.length > 0 && (
              <div className="max-h-64 overflow-y-auto border border-border rounded-md">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left py-1.5 px-2">Fila</th>
                      <th className="text-left py-1.5 px-2">Tipo</th>
                      <th className="text-left py-1.5 px-2">Estado</th>
                      <th className="text-left py-1.5 px-2">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.detalle.map((d, i) => (
                      <tr
                        key={i}
                        className={
                          d.ok
                            ? "border-b border-border/40"
                            : "border-b border-border/40 bg-destructive/5"
                        }
                      >
                        <td className="py-1.5 px-2 font-mono">{d.fila}</td>
                        <td className="py-1.5 px-2">{d.tipo ?? "—"}</td>
                        <td className="py-1.5 px-2">
                          {d.ok ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                          )}
                        </td>
                        <td className="py-1.5 px-2">{d.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <Alert>
          <AlertDescription className="text-xs">
            Los overrides se guardan en este navegador (localStorage). Para compartirlos con el
            equipo, exporta el CSV una sola vez y vuélvelo a importar en cada equipo.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
