import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
    <button
      onClick={handleDownload}
      disabled={loading}
      className="print:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-2xl shadow-primary/40 hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-70"
      aria-label="Descargar PDF Completo"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">PDF Completo</span>
    </button>
  );
}
