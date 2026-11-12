import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PdfDownloadFab() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Usa la API nativa de impresión para generar PDF del contenido visible
      // (más adelante se puede cambiar a jsPDF/html2canvas para reporte custom)
      window.print();
      toast.success("Diálogo de impresión abierto", {
        description: "Selecciona 'Guardar como PDF' para descargar el reporte.",
      });
    } catch (e) {
      toast.error("No se pudo generar el PDF");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant="outline"
      className="print:hidden gap-2"
      aria-label="Descargar PDF Completo"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">PDF Completo</span>
    </Button>
  );
}
