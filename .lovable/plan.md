

## Lo que pides

En el brief de **Estrategia 360**, además del FODA/segmentos/calendario actual, agregar dos ejes nuevos:

1. **Métricas territoriales del camino a ganar**: cuántas secciones electorales y de qué municipios se necesitan para superar el umbral de victoria (con votos requeridos, no solo "zonas prioritarias" cualitativas).
2. **Estrategia digital y de comunicación política**: ya no como un rubro presupuestal aislado, sino como un plan completo — sentimiento detectado, arquitectura de mensaje, plataformas, cadencia de contenidos, voceros, manejo de adversarios y de crisis reputacional.

## Diseño

### A. Cálculo determinístico antes de la IA (no inventado)

En `snapshot-builder.ts` añado un bloque `meta_victoria` calculado con datos reales del snapshot:

- `votos_requeridos_estimado` = `lista_nominal × participación_esperada (o último histórico) × umbral (margen_ultimo + colchón 2pp, mínimo 35%)`
- `secciones_totales` y desglose por municipio (top municipios por número de secciones dentro del territorio, usando el catálogo INE ya cargado)
- `secciones_minimas_a_movilizar` = secciones ordenadas por densidad de lista nominal hasta cubrir los votos requeridos (aprox: votos_requeridos ÷ promedio_votos_por_sección)
- Top 5-8 **municipios pivote** por aportación de votos (clave INEGI + nombre + secciones + % del total)

Esto va al edge function como contexto **duro** para que la IA razone sobre cifras reales, no estime.

### B. Schema ampliado del edge function

`generar-estrategia-360/index.ts` recibe los nuevos campos y agrega 2 secciones obligatorias al tool schema:

**`meta_victoria`** (la IA refina y narra el cálculo):
- `votos_objetivo`, `participacion_supuesta_pct`, `umbral_pct`
- `secciones_clave[]`: { municipio, num_secciones, votos_aporte_estimado, justificacion, tipo_seccion (urb/mix/rur) }
- `municipios_pivote[]`: { nombre, peso_pct_total, secciones, accion_clave }
- `narrativa_camino`: 2-3 frases tipo "Para ganar Morelia necesitas X votos repartidos en Y secciones de Z colonias"

**`estrategia_digital_comunicacion`**:
- `diagnostico_sentimiento`: { tono_actual ("hostil"/"neutro"/"favorable"/"polarizado"), temas_calientes[], adversarios_dominantes_en_red[] } — derivado de alertas + análisis de candidatos del snapshot
- `arquitectura_mensaje`: { eje_emocional, eje_racional, frases_paraguas[3], tabús[] }
- `plataformas[]`: { red (FB/IG/TT/X/YT/WhatsApp), prioridad alta/media/baja, formato dominante, frecuencia_semanal, KPI_principal, justificacion_por_audiencia }
- `voceros[]`: { perfil, función ("ataque"/"empatía"/"propuesta"/"territorio") } — usa War Room del snapshot si existe
- `calendario_contenido_semanal`: { lunes...domingo: tipo de contenido }
- `contraataque_y_crisis`: { triggers[], protocolo_24h, mensajes_pre_aprobados[2-3] }
- `aliados_influencia[]`: micro-influencers/medios locales recomendados por región

### C. UI: dos pestañas nuevas en `ResultadoTabs.tsx`

- **"Camino a la victoria"** (icono `Trophy` o `Target`): tarjeta superior con la cifra grande de votos objetivo y % participación supuesta; tabla de municipios pivote con barra de aportación; lista de secciones clave agrupadas por municipio con badges urb/mix/rural.
- **"Comunicación 360"** (icono `Megaphone` o `Radio`): bloque sentimiento (con color según tono), tarjeta de arquitectura de mensaje con las 3 frases paraguas destacadas, grid de plataformas con prioridad, calendario semanal en mini-grid 7 días, panel rojo de crisis.

Pasamos de 9 a 11 pestañas; en mobile (888px ya cabe en 2 filas) se acomoda con `grid-cols-3 md:grid-cols-11`.

### D. PDF

`ExportarPDF.tsx` añade las dos secciones nuevas al final del documento con el mismo estilo de los otros bloques.

## Archivos a tocar

1. `src/lib/estrategia/types.ts` — añadir `meta_victoria` al `SnapshotPayload`.
2. `src/lib/estrategia/snapshot-builder.ts` — calcular `meta_victoria` por nivel (gobernador = estatal; diputados = secciones del distrito local; ayuntamientos = secciones del municipio).
3. `supabase/functions/generar-estrategia-360/index.ts` — recibir nuevo bloque, expandir prompt y añadir 2 schemas obligatorios.
4. `src/components/estrategia/ResultadoTabs.tsx` — 2 pestañas nuevas + ampliar `EstrategiaOutput`.
5. `src/components/estrategia/ExportarPDF.tsx` — render de las 2 secciones en el PDF.

## Notas

- El cálculo de votos por sección usa promedio histórico del territorio (lista nominal ÷ secciones × participación), no datos inventados.
- El sentimiento se construye a partir de `alertas_activas`, `candidatos.adversarios.ejes_narrativos` y `vulnerabilidades_argumentales` que ya viajan en el snapshot — la IA los sintetiza, no los inventa.
- Si el catálogo INE aún no se cargó (`getCatalogoSync()` devuelve null), `meta_victoria` se omite y la IA recibe un fallback más cualitativo.

