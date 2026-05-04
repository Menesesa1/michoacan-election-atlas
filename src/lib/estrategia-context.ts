// Barrel re-export. La implementación vive en src/lib/estrategia/*
export type { SnapshotPayload, TerritorioOption, InteligenciaSnapshot, TrendsSnapshot } from "./estrategia/types";
export { getTerritorios } from "./estrategia/territorios";
export { buildSnapshot } from "./estrategia/snapshot-builder";
export { enriquecerSnapshot } from "./estrategia/snapshot-enricher";
