import { jsPDF } from "jspdf";
import { writeFileSync } from "node:fs";

const Orig = jsPDF;
const Wrapped = function (...args) {
  const d = new Orig(...args);
  d.save = function (f) {
    writeFileSync("/tmp/" + f, Buffer.from(this.output("arraybuffer")));
    console.log("SAVED", f);
    return this;
  };
  return d;
};
Wrapped.prototype = Orig.prototype;
// Reemplazar la export
import * as jspdfMod from "jspdf";
jspdfMod.jsPDF = Wrapped;

const m = await import("./dossier-bundle.mjs");
m.generarDossierComercial({
  candidato: { id: "x", nombre: "María Fernanda Hernández García", cargo_buscado: "Diputación Federal", nivel: "diputados_federales", territorio: "Distrito Federal 8 - Morelia", partido: "MORENA", es_propio: true },
  metricasOficiales: {
    brechaPp: 12.4, intencionPropia: 28.6, intencionRival: 41,
    rivalPartido: "PAN", cicloRef: 2024, listaNominal: 412358,
    seccionesTotal: 312, seccionesRiesgo: 87, seccionesPivote: 54,
    participacionHist: 61.4,
    demografia: { hombres: 198000, mujeres: 214358, pctJovenes18a29: 24, pctAdultoMayor60mas: 17 },
    origen: "INE · D8 · DERFE 2026",
    fuenteResultados: "INE", fuentePadron: "INE-DERFE 2026", esEstimacion: false,
  },
});
