// QA del dossier comercial: genera el PDF con datos de muestra y lo guarda en /tmp.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Stub jsdom-free: jsPDF funciona en Node sin DOM.
const { default: jsPDF } = await import("jspdf");

// Cargamos el módulo TS via tsx
const { generarDossierComercial } = await import("/dev-server/src/lib/pdf-dossier-comercial.ts");

// jsPDF en Node guarda con .save() llamando a fs en algunos entornos; no es fiable.
// Mejor: replicar la firma manualmente — pero como save() fuerza descarga browser,
// monkey-patch:
const origSave = jsPDF.prototype.save;
jsPDF.prototype.save = function (filename) {
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
  brechaPp: 12.4,
  intencionPropia: 28.6,
  intencionRival: 41.0,
  rivalPartido: "PAN",
  cicloRef: 2024,
  listaNominal: 412358,
  seccionesTotal: 312,
  seccionesRiesgo: 87,
  seccionesPivote: 54,
  participacionHist: 61.4,
  demografia: {
    hombres: 198000,
    mujeres: 214358,
    pctJovenes18a29: 24,
    pctAdultoMayor60mas: 17,
  },
  origen: "INE · Distrito Federal 8 · Padrón DERFE 2026",
  fuenteResultados: "INE",
  fuentePadron: "INE-DERFE 2026",
  esEstimacion: false,
};

generarDossierComercial({ candidato, metricasOficiales: oficial });
