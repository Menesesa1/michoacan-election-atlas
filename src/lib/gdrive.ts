// Cliente para subir archivos a Google Drive vía edge function gdrive-upload.
// Mantiene un contexto global (elección/periodo) que los exportadores PDF/XLSX usan
// para auto-subir cada archivo generado a una carpeta jerárquica en Drive.

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DriveContext {
  enabled: boolean;
  eleccion?: string | null;
  periodo?: string | null;
}

let CTX: DriveContext = { enabled: false };

export function setDriveContext(ctx: DriveContext) {
  CTX = { ...ctx };
}
export function getDriveContext(): DriveContext {
  return CTX;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function subirADrive(
  blob: Blob,
  filename: string,
  opts?: { eleccion?: string | null; periodo?: string | null; silent?: boolean },
): Promise<{ webViewLink?: string } | null> {
  try {
    const base64 = await blobToBase64(blob);
    const { data, error } = await supabase.functions.invoke("gdrive-upload", {
      body: {
        filename,
        mime: blob.type || "application/octet-stream",
        base64,
        eleccion: opts?.eleccion ?? CTX.eleccion ?? null,
        periodo: opts?.periodo ?? CTX.periodo ?? null,
      },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error ?? "Error desconocido");
    if (!opts?.silent) {
      toast.success("Subido a Google Drive", {
        description: filename,
        action: data.webViewLink
          ? { label: "Abrir", onClick: () => window.open(data.webViewLink, "_blank") }
          : undefined,
      });
    }
    return { webViewLink: data.webViewLink };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!opts?.silent) toast.error(`Drive: ${msg}`);
    return null;
  }
}

/** Helper para exportadores: sube si el contexto global lo permite. */
export function autoSubirSiActivo(blob: Blob, filename: string) {
  if (!CTX.enabled) return;
  void subirADrive(blob, filename);
}
