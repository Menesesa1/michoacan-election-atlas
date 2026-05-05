// Botón reutilizable de exportación PDF/XLSX
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface ExportOption {
  label: string;
  icon: "pdf" | "xlsx";
  handler: () => Promise<void> | void;
}

interface Props {
  options: ExportOption[];
  label?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
}

export function ExportButton({
  options,
  label = "Exportar",
  size = "sm",
  variant = "outline",
}: Props) {
  const [loading, setLoading] = useState(false);

  const ejecutar = async (opt: ExportOption) => {
    setLoading(true);
    try {
      await opt.handler();
      toast.success(`${opt.label} generado`);
    } catch (e: any) {
      toast.error(`Error: ${e?.message ?? "no se pudo generar"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          {loading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Download className="h-3 w-3 mr-1" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Generar entregable</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt, i) => (
          <DropdownMenuItem
            key={i}
            onClick={() => ejecutar(opt)}
            className="text-xs cursor-pointer"
          >
            {opt.icon === "pdf" ? (
              <FileText className="h-3 w-3 mr-2 text-red-500" />
            ) : (
              <FileSpreadsheet className="h-3 w-3 mr-2 text-green-600" />
            )}
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
