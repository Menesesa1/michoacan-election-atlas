import { writeFileSync } from "node:fs";
import { jsPDF } from "jspdf";

jsPDF.prototype.save = function (f) {
  const buf = this.output("arraybuffer");
  writeFileSync("/tmp/" + f, Buffer.from(buf));
  console.log("Saved", f, buf.byteLength, "bytes");
};

const { generarDossierComercial } = await import("./dossier-bundle.mjs");

try {
  generarDossierComercial({
    candidato: {
      id: "x",
      nombre: "María Fernanda Hernández García",
      cargo_buscado: "Diputación Federal",
      nivel: "diputados_federales",
      territorio: "Distrito Federal 8 - Morelia",
      partido: "MORENA",
      es_propio: true,
    },
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
} catch (e) {
  console.error("ERR:", e.message);
  console.error(e.stack);
}
