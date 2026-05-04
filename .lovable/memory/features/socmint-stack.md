---
name: SOCMINT Stack (PSICOINT + GEOINT + CIB + Narrativas)
description: Pipeline ampliado de social listening con emociones, geo-inferencia por sección/colonia, detección CIB y mensajes accionables
type: feature
---

# SOCMINT Stack

## Pipeline
- `monitor-social` (existente): clasifica menciones con sentimiento + tema + municipio + **emociones (6) + sarcasmo + sección_inferida + colonia_inferida**.
- `ingesta-medios-michoacan` (nuevo, cron 4h): scrapea 9 medios locales vía Firecrawl con dedup por hash URL → `medios_urls_procesadas`.
- `detectar-cib` (nuevo, cron 6h): heurísticas spike_anomalo, copy_paste (Jaccard ≥0.7), dominacion_fuente (>60%), rafaga_temporal (≥6 en 30min) → `cib_alertas`.
- `generar-narrativa-accionable` (nuevo, on-demand): 5 tipos de mensaje (defensivo/contraste/pivote/oportunidad/contranarrativa) → `narrativas_sugeridas` (RLS por user).

## Tablas
- `social_menciones` ampliada: `emociones jsonb`, `sarcasmo bool`, `seccion_inferida int`, `colonia_inferida text`.
- `cib_alertas`, `narrativas_sugeridas`, `medios_urls_procesadas`, `medios_michoacan_runs`.

## UI
Tabs nuevos en /inteligencia: cib, emociones (radar), geoint, narrativas.

## Limitaciones aceptadas
- Sin X/Twitter API (requiere $200/mes).
- Sin imágenes/memes (requiere visión multimodal).
- Sección/colonia solo inferida cuando texto la menciona explícitamente.
