# Project Memory

## Core
Platform: Analista Electoral Michoacán (2018-2025). Focus: Federal, local, judicial elections.
**Unidad atómica = SECCIÓN ELECTORAL.** Toda agregación se construye sumando secciones del catálogo INE.
Una sección pertenece simultáneamente a: Municipio, Distrito Local, Distrito Federal y Estado (jerarquía cruzada, NO 1:1).
Casillas por sección: básica, contigua, extraordinaria, especial.
Tipos de elección: Gobernatura, Dip. Federal, Dip. Local, Ayuntamiento — todo módulo debe soportar los 4.
Design: Dark theme, glassmorphism, Tailwind CSS, political party colors.
Tech: React, global DataContext (mock/real data toggle), Recharts, Leaflet.
Filter INE CSVs exclusively for Michoacán (Clave 16).
Districts: 11 federal, 24 local (IEM), 113 municipios.
INE Tech encoding: "M" = Mujeres.

## Memories
- [Unidad Electoral](mem://core/unidad-electoral) — Lógica fundamental: sección como unidad atómica, jerarquía cruzada y tipos de casilla
- [Project Scope](mem://project/scope) — Analista Electoral Michoacán platform for federal, local, and judicial elections (2018-2025)
- [Visual Identity](mem://style/visual-identity) — Data intelligence aesthetic with dark theme, glassmorphism, and political party colors
- [Frontend Architecture](mem://tech/architecture) — React, global DataContext, Recharts, and Leaflet synchronization
- [Interactive Mapping](mem://features/mapping) — Leaflet maps with SIGE cartography, district/section levels, and centroid fallback
- [Election Simulator](mem://features/analysis-tools) — Simulator for projecting results via turnout adjustments and vote swings
- [Data Processing](mem://features/data-processing) — CSV importer via PapaParse, filtering for Michoacán (Clave 16)
- [CSV Import Detector](mem://features/csv-import-detector) — Detector multi-esquema (INE 2024/2021/2018, IEM) con preview y modelo unificado por sección
- [Multi-level Analysis](mem://features/multi-level-analysis) — Dynamic toggle between federal (11 districts) and local (24 districts) analysis
- [Demographic Analysis](mem://features/demographic-analysis) — INE Nominal List analysis with population pyramids and gender/age heatmaps
- [Google Trends](mem://features/google-trends) — Ingesta estatal + por candidato vía SerpApi + Perplexity con persistencia
- [Concentrado INE](mem://reference/concentrado-ine-michoacan) — Totales oficiales Michoacán (11/113/2825) para validación cruzada
- [Control de acceso](mem://features/access-control) — Roles admin/analista/cliente, signup cerrado, panel /administracion
- [SOCMINT Stack](mem://features/socmint-stack) — Pipeline PSICOINT (emociones+sarcasmo) + GEOINT (sección/colonia) + CIB (4 heurísticas) + Narrativas accionables
