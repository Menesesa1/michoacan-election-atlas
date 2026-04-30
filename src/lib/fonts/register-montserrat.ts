import type jsPDF from "jspdf";
import { Montserrat_Regular_BASE64 } from "./Montserrat-Regular";
import { Montserrat_Bold_BASE64 } from "./Montserrat-Bold";

/**
 * Registra Montserrat (Regular + Bold) en una instancia jsPDF y la deja activa.
 * Tras llamar esto, usa doc.setFont("Montserrat", "normal" | "bold").
 */
export function registerMontserrat(doc: jsPDF): void {
  doc.addFileToVFS("Montserrat-Regular.ttf", Montserrat_Regular_BASE64);
  doc.addFont("Montserrat-Regular.ttf", "Montserrat", "normal");
  doc.addFileToVFS("Montserrat-Bold.ttf", Montserrat_Bold_BASE64);
  doc.addFont("Montserrat-Bold.ttf", "Montserrat", "bold");
  doc.setFont("Montserrat", "normal");
}
