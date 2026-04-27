// Validación automática de jerarquía cruzada para una sección electoral.
// Conforme a la regla central: la sección es la unidad atómica del sistema y
// pertenece simultáneamente a Municipio, Distrito Local, Distrito Federal y Estado.
//
// Devuelve un reporte con la jerarquía completa + checks de consistencia
// contra el catálogo INE (SECCION.dbf + D16.pdf).

import {
  getCatalogoSync,
  getDistritosLocales,
  infoDistritoLocal,
  lookupSeccion,
  nombreMunicipio,
  TIPO_SECCION,
} from "./secciones-catalogo";

export type SeverityLevel = "ok" | "warning" | "error";

export interface ValidacionCheck {
  campo: string;
  estado: SeverityLevel;
  mensaje: string;
}

export interface JerarquiaSeccion {
  /** Número de sección INE. */
  seccion: number;
  /** Existe en el catálogo INE. */
  existe: boolean;
  /** Tipo INE (Urbana / Mixta / Rural). */
  tipo: { clave: number; nombre: string } | null;
  /** Estado: siempre Michoacán (16) si existe. */
  estado: { clave: number; nombre: string };
  /** Municipio (Ayuntamiento). */
  municipio: { clave: number; nombre: string } | null;
  /** Distrito local IEM (Diputación Local). */
  distritoLocal: { clave: number; cabecera: string; municipios: string[] } | null;
  /** Distrito federal INE (Diputación Federal). */
  distritoFederal: { clave: number } | null;
  /** Tipos de elección a los que aporta esta sección. */
  eleccionesAporta: string[];
  /** Checks de validación cruzada. */
  checks: ValidacionCheck[];
  /** Severidad agregada. */
  severidad: SeverityLevel;
}

const ESTADO_MICHOACAN = { clave: 16, nombre: "Michoacán de Ocampo" };

/**
 * Valida una sección electoral y construye su jerarquía cruzada completa.
 * Requiere que `loadCatalogo()` haya sido llamado previamente.
 */
export function validarJerarquiaSeccion(seccion: number): JerarquiaSeccion {
  const checks: ValidacionCheck[] = [];
  const cat = getCatalogoSync();

  // 1. Catálogo cargado
  if (!cat) {
    return {
      seccion,
      existe: false,
      tipo: null,
      estado: ESTADO_MICHOACAN,
      municipio: null,
      distritoLocal: null,
      distritoFederal: null,
      eleccionesAporta: [],
      checks: [
        {
          campo: "catalogo",
          estado: "error",
          mensaje: "Catálogo INE no cargado. Llama a loadCatalogo() antes de validar.",
        },
      ],
      severidad: "error",
    };
  }

  // 2. Existencia de la sección
  const sec = lookupSeccion(seccion);
  if (!sec) {
    checks.push({
      campo: "seccion",
      estado: "error",
      mensaje: `La sección ${seccion} no existe en el catálogo INE de Michoacán (2,703 secciones).`,
    });
    return {
      seccion,
      existe: false,
      tipo: null,
      estado: ESTADO_MICHOACAN,
      municipio: null,
      distritoLocal: null,
      distritoFederal: null,
      eleccionesAporta: [],
      checks,
      severidad: "error",
    };
  }

  // 3. Municipio
  let municipio: JerarquiaSeccion["municipio"] = null;
  if (sec.mun > 0) {
    municipio = { clave: sec.mun, nombre: nombreMunicipio(sec.mun) };
    checks.push({
      campo: "municipio",
      estado: "ok",
      mensaje: `Pertenece al municipio ${municipio.nombre} (clave INEGI ${sec.mun}).`,
    });
  } else {
    checks.push({
      campo: "municipio",
      estado: "error",
      mensaje: "La sección no tiene municipio asignado en el catálogo.",
    });
  }

  // 4. Distrito federal
  let distritoFederal: JerarquiaSeccion["distritoFederal"] = null;
  if (sec.dis > 0) {
    distritoFederal = { clave: sec.dis };
    checks.push({
      campo: "distritoFederal",
      estado: "ok",
      mensaje: `Pertenece al Distrito Federal ${String(sec.dis).padStart(2, "0")} (INE).`,
    });
  } else {
    checks.push({
      campo: "distritoFederal",
      estado: "error",
      mensaje: "La sección no tiene distrito federal asignado.",
    });
  }

  // 5. Distrito local — buscamos en el payload de distritación local 2016
  let distritoLocal: JerarquiaSeccion["distritoLocal"] = null;
  const dlList = getDistritosLocales();
  const dl = dlList.find((d) => d.secciones.includes(seccion));
  if (dl) {
    distritoLocal = {
      clave: dl.distrito,
      cabecera: dl.cabecera,
      municipios: dl.municipios,
    };
    checks.push({
      campo: "distritoLocal",
      estado: "ok",
      mensaje: `Pertenece al Distrito Local ${String(dl.distrito).padStart(2, "0")} · ${dl.cabecera} (IEM/INE 2016).`,
    });

    // 5b. Coherencia: el municipio de la sección debe estar listado en el distrito local
    if (municipio && !dl.municipios.includes(municipio.nombre)) {
      checks.push({
        campo: "coherencia",
        estado: "warning",
        mensaje: `El municipio "${municipio.nombre}" no aparece en la lista oficial del Distrito Local ${dl.distrito}. Posible diferencia de nomenclatura INEGI vs IEM.`,
      });
    }
  } else {
    checks.push({
      campo: "distritoLocal",
      estado: "warning",
      mensaje: "No se encontró distrito local para esta sección en el descriptivo D16.pdf.",
    });
  }

  // 6. Tipo de sección (urbana/mixta/rural)
  const tipoNombre = TIPO_SECCION[sec.tipo];
  const tipo = tipoNombre ? { clave: sec.tipo, nombre: tipoNombre } : null;

  // 7. Elecciones a las que aporta — toda sección aporta a los 4 tipos.
  const eleccionesAporta: string[] = [];
  eleccionesAporta.push("Gobernatura (Estatal)");
  if (distritoFederal) eleccionesAporta.push(`Diputación Federal D${String(distritoFederal.clave).padStart(2, "0")}`);
  if (distritoLocal) eleccionesAporta.push(`Diputación Local D${String(distritoLocal.clave).padStart(2, "0")}`);
  if (municipio) eleccionesAporta.push(`Ayuntamiento de ${municipio.nombre}`);
  // Federales adicionales:
  eleccionesAporta.push("Presidencia de la República");
  eleccionesAporta.push("Senaduría");

  const severidad: SeverityLevel = checks.some((c) => c.estado === "error")
    ? "error"
    : checks.some((c) => c.estado === "warning")
      ? "warning"
      : "ok";

  return {
    seccion,
    existe: true,
    tipo,
    estado: ESTADO_MICHOACAN,
    municipio,
    distritoLocal,
    distritoFederal,
    eleccionesAporta,
    checks,
    severidad,
  };
}

/** Helper para validar un lote de secciones (ej. al importar CSV). */
export interface ReporteLote {
  total: number;
  validas: number;
  conWarning: number;
  conError: number;
  noEncontradas: number[];
}

export function validarLoteSecciones(secciones: number[]): ReporteLote {
  const reporte: ReporteLote = {
    total: secciones.length,
    validas: 0,
    conWarning: 0,
    conError: 0,
    noEncontradas: [],
  };
  for (const s of secciones) {
    const r = validarJerarquiaSeccion(s);
    if (!r.existe) {
      reporte.conError++;
      reporte.noEncontradas.push(s);
      continue;
    }
    if (r.severidad === "ok") reporte.validas++;
    else if (r.severidad === "warning") reporte.conWarning++;
    else reporte.conError++;
  }
  return reporte;
}
