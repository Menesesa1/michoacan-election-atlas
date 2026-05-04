---
name: Estrategia 360 cruza todo
description: El SnapshotPayload de /escenarios incorpora LN oficial INE-DERFE, contendientes esperados (todos los partidos + indep), inteligencia (sentimiento/CIB/alertas/narrativas) y Trends, además del histórico/demografía/composición ya existentes.
type: feature
---
**Pipeline:**
1. `buildSnapshot` (sync) arma histórico + demografía + composición + meta de victoria + alertas mock + candidatos seleccionados.
2. `enriquecerSnapshot` (async, en `snapshot-enricher.ts`) inyecta LN estatal oficial, `contendientes_esperados` (de `lib/candidatos/contendientes-esperados.ts`), inteligencia agregada (social_resumen + cib_alertas + alertas_crisis + narrativas_sugeridas) y Trends (candidato propio o estatal).

**Contendientes esperados:** universo COMPLETO por cargo antes de la lista oficial IEM/INE. Coaliciones probables 2027 (Sigamos Haciendo Historia, Fuerza y Corazón, MC, PCM) + slot(s) de candidatura independiente. `enlazarConRegistrados` marca slots como "registrado" cuando ya hay candidato en BD.

**UI:** `SnapshotExtras.tsx` muestra todo en el paso 2 del Wizard (Escenarios.tsx). El payload completo se envía a la edge `generar-estrategia-360`.
