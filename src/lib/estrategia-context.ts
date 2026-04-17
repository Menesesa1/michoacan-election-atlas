// Barrel re-export. La implementación vive en src/lib/estrategia/*
// Mantener este archivo evita romper imports existentes.
export type { SnapshotPayload, TerritorioOption } from "./estrategia/types";
export { getTerritorios } from "./estrategia/territorios";
export { buildSnapshot } from "./estrategia/snapshot-builder";
