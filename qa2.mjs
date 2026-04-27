import { writeFileSync } from "node:fs";
import { generarDossierComercial } from "./dossier-bundle.mjs";

// monkey-patch save
const test = await import("jspdf");
test.jsPDF.prototype.save = function (filename) {
  const buf = this.output("arraybuffer");
  writeFileSync(`/tmp/${filename}`, Buffer.from(buf));
  console.log(`Guardado: /tmp/${filename}`);
};

const candidato = {
  id: "test-1",
  nombre: "María Fernanda Hernández García",
  cargo_buscado: "Diputación Federal",
  nivel: "diputados_federales",
  territorio: "Distrito Federal 8 - Morelia",
  partido: "MORENA",
  es_propio: true,
};
const oficial = {
  brechaPp: 12.4, intencionPropia: 28.6, intencionRival: 41.0,
  rivalPartido: "PAN", cicloRef: 2024, listaNominal: 412358,
  seccionesTotal: 312, seccionesRiesgo: 87, seccionesPivote: 54,
  participacionHist: 61.4,
  demografia: { hombres: 198000, mujeres: 214358, pctJovenes18a29: 24, pctAdultoMayor60mas: 17 },
  origen: "INE · Distrito Federal 8 · Padrón DERFE 2026",
  fuenteResultados: "INE", fuentePadron: "INE-DERFE 2026", esEstimacion: false,
};
generarDossierComercial({ candidato, metricasOficiales: oficial });
