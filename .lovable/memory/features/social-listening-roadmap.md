---
name: Social Listening Roadmap (Brandwatch-grade Michoacán)
description: Plan por fases para convertir el módulo de Inteligencia/Listening en una herramienta nivel Brandwatch/Sentione/YouScan, enfocada solo en Michoacán y actores políticos.
type: feature
---

# Social Listening — Roadmap a herramienta nivel Brandwatch (nicho Michoacán político)

Estado: **pendiente, en espera de luz verde del usuario.** Retomar cuando lo indique.

## Punto de partida (lo que ya existe)
- `social_menciones`, `social_resumen`, `social_runs` con sentimiento, tema, hashtags, municipio.
- Mapa de calor territorial por municipio.
- Alertas de crisis con prioridad.
- Análisis de narrativas y discurso ciudadano con IA Lovable Gateway.
- Firecrawl conectado como connector.
- Drilldown por tema/hashtag (`TemaDetailSheet.tsx`).

## Fases

### Fase 1 — Ingesta de medios michoacanos (2-3 semanas) 🔥🔥🔥
- Scraping programado vía **Firecrawl** de: Cambio de Michoacán, Quadratín, La Voz, Provincia, Respuesta, MiMorelia, Contramuro, Monitor Expresso, Atiempo, Changoonga.
- Cron `pg_cron` cada 2-4 horas + edge function nueva (`ingesta-medios-michoacan`).
- Deduplicación por URL + hash de título.
- Índice GIN full-text sobre `titulo + fragmento` en `social_menciones`.
- RSS donde exista (gratis).

### Fase 2 — Operación profesional (1-2 semanas) 🔥🔥🔥
- Tabla nueva `listening_proyectos` (workspaces por contienda) con queries booleanas guardadas, tags, filtros.
- Parser booleano cliente (`("Bedolla" OR "@bedolla") AND (seguridad OR violencia) NOT deportes`) → filtro SQL.
- Auto-tagging por reglas con IA Gateway.
- Export CSV masivo desde panel.
- Reportes diarios/semanales por email vía **Resend** (conector).

### Fase 3 — Análisis competitivo (1 semana) 🔥🔥
- Share of Voice entre candidatos (% menciones/semana).
- Net sentiment comparado lado a lado (sparklines).
- Issue ownership por tema (seguridad, salud, economía).
- Alertas de spike >200% vs media móvil 7 días.

### Fase 4 — Diferenciadores michoacanos (2 semanas) 🔥🔥
- Geofencing electoral: cruce municipio × 5,062 secciones.
- Cruce con padrón: alertar si arde municipio de voto duro propio.
- Detección heurística de bots (cuentas <30 días, ratio rt/originales, actividad nocturna) — solo aplica cuando haya datos de X.
- Emociones avanzadas en español MX (enojo, miedo, esperanza, indignación, sarcasmo) con Gemini 2.5.

### Fase 5 — Opcional, decisión del cliente
- **Twitter/X API**: $200-5,000 USD/mes. Integración 2 días si pagan.
- **Facebook/Instagram Graph**: requiere Meta Business Verification (1-3 meses). Mientras tanto, scraping limitado vía Firecrawl.
- **TikTok Research API**: solo académicos. No viable comercial.
- **Telegram**: solo canales que invitan al bot.

## Total estimado: 6-8 semanas para producto competitivo en el nicho.

## Ventajas defendibles vs Brandwatch
- Cobertura de medios locales que ellos no rastrean.
- Cruce único con data electoral propia (padrón, secciones, históricos).
- Precio 10-20× menor para el cliente.

## Recomendación
Arrancar por **Fase 1** (cuello de botella). Las demás se construyen encima sin esfuerzo adicional de infraestructura.
