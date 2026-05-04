---
name: Lista nominal única
description: La lista nominal estatal de Michoacán es ÚNICA (~3.6M, INE-DERFE). Federal/local son cortes distintos de las mismas secciones. Usar useListaNominalOficial + ListaNominalBadge para validar agregaciones.
type: feature
---
**Regla:** La LN estatal es invariante. Sin importar si se agrega por 11 distritos federales o 24 distritos locales, la suma debe ser idéntica al total padrón oficial.

**Cómo aplicar:**
- Hook `useListaNominalOficial()` en `src/hooks/use-lista-nominal-oficial.ts` carga el padrón DERFE 2026 y expone `total`, `esConsistente()`, `cobertura()`.
- Componente `<ListaNominalBadge />` en `src/components/ListaNominalBadge.tsx` muestra el dato oficial y valida agregaciones parciales con tolerancia ±5%.
- KPICards y headers de paneles deben usar el total oficial, no la suma de mocks (`listaNominal2024`).
