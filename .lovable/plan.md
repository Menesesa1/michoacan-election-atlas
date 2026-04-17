

## Contexto

El usuario quiere convertir `/escenarios` (que hoy genera 3 escenarios con 4-5 estrategias genéricas vía IA) en un **generador sistematizado de estrategia 360 para consultor político** que aproveche TODOS los datos del sistema:

- Resultados electorales 2015-2024 (Gobernador, 24 distritos locales, 11 federales, 113 ayuntamientos)
- Demografía INE (lista nominal, pirámides, género/edad)
- Datos socioeconómicos INEGI (ECEG)
- Crisis/menciones (cuando RSS esté ingiriendo)
- Competitividad, lealtad, riesgo por distrito
- Catálogo IEM real (distritos + secciones)

Hoy los escenarios son **abstractos**: no leen contexto real del distrito/municipio, no priorizan secciones, no proponen presupuesto, no definen mensaje por segmento, no dan calendario.

## Diagnóstico: qué falta

### 1. Contexto real al prompt de IA
El edge function `generar-escenarios` solo recibe título, supuestos y métricas base. **No le pasamos** los datos electorales históricos, demografía ni socioeconómico del nivel/territorio elegido. Por eso las estrategias salen genéricas.

### 2. Selector de territorio
Hoy solo se elige nivel (Gobernador/Diputados/Ayuntamientos). Falta elegir **qué distrito o municipio específico** analizar para que la estrategia sea local.

### 3. Dimensiones 360 ausentes
Faltan los pilares clásicos de campaña:
- **Diagnóstico**: FODA basado en datos reales
- **Segmentación de votantes** (duro, blando, indeciso, opositor) con % y volumen
- **Mensaje y narrativa** por segmento
- **Plan territorial** (secciones prioritarias ordenadas por ROI)
- **Calendario 90/60/30 días**
- **Presupuesto sugerido** por rubro
- **Estructura de campaña** (coordinaciones, brigadistas estimados)
- **KPIs de seguimiento** semanales
- **Matriz de riesgos** + plan de contingencia
- **Alianzas** sugeridas (basado en histórico de coaliciones)

### 4. Salidas accionables
Hoy solo hay cards en pantalla. Falta:
- Export PDF ejecutivo con branding EME
- Guardar/versionar estrategias
- Comparar escenarios lado a lado

## Propuesta: Generador Estratégico 360

Reestructurar `/escenarios` (renombrar a "Estrategia 360" en sidebar, mantener ruta) en un **wizard de 3 pasos** que produce un brief ejecutivo completo.

### Paso 1 — Definir alcance
- Nivel: Gobernador / Diputado Local / Ayuntamiento
- Territorio: dropdown dinámico (estado / distrito 1-24 / municipio top 113)
- Posición de partida: Oficialismo / Oposición / Aspirante nuevo
- Coalición tentativa (multi-select de partidos)
- Horizonte: 2027 (default) / personalizado

### Paso 2 — Snapshot de datos (auto-generado, editable)
Panel que **lee del DataContext y archivos locales** y muestra:
- Histórico electoral del territorio (gráfica 2015-2024)
- Demografía: pirámide + lista nominal
- Socioeconómico: nivel marginación, % juventud, ocupación dominante
- Competitividad y margen del último proceso
- Alertas activas de `/crisis` relacionadas

El usuario puede ajustar supuestos (participación esperada, % voto duro, etc.).

### Paso 3 — Generación IA enriquecida
Edge function nueva `generar-estrategia-360` que recibe TODO el snapshot + supuestos y devuelve via tool calling un JSON con 10 secciones:

1. **FODA** (4 listas)
2. **3 escenarios** (optimista/moderado/pesimista) con probabilidad calibrada por datos reales
3. **Segmentación**: duro/blando/indeciso/opositor con % y volumen estimado
4. **Narrativa central** + 3 mensajes por segmento
5. **Plan territorial**: top 10 secciones/colonias prioritarias con justificación
6. **Calendario 90/60/30**: hitos semanales
7. **Presupuesto sugerido**: % por rubro (territorio, digital, medios, eventos, defensa del voto)
8. **Estructura mínima**: coordinaciones, brigadistas, casa de campaña
9. **Matriz de riesgos** con mitigación
10. **KPIs semanales** medibles

Modelo: `google/gemini-2.5-pro` (mejor reasoning para análisis multi-fuente).

### UI resultado
Tabs: `Resumen | FODA | Escenarios | Segmentos | Territorio | Calendario | Presupuesto | Riesgos | KPIs`

Botones: `Exportar PDF ejecutivo` · `Guardar versión` · `Comparar con otra estrategia`

## Qué se construye

### Backend (Lovable Cloud)
- Tabla `estrategias_guardadas` (id, user_id, nivel, territorio, snapshot_json, output_json, created_at) con RLS
- Edge function `generar-estrategia-360` (nueva, no toca la existente)
- Helper server-side `build-context-snapshot.ts` que arma el contexto desde los datos

### Frontend
- Refactor `src/pages/Escenarios.tsx` → wizard de 3 pasos
- `src/components/estrategia/WizardAlcance.tsx`
- `src/components/estrategia/SnapshotDatos.tsx` (lee DataContext)
- `src/components/estrategia/ResultadoTabs.tsx` (9 tabs)
- `src/components/estrategia/ExportarPDF.tsx` (usa jsPDF + branding EME)
- `src/lib/estrategia-context.ts` (extrae datos del territorio elegido)
- `src/data/estrategia-templates.ts` (segmentos, rubros presupuesto, KPIs base)

### Sidebar
- Renombrar "Escenarios IA" → "Estrategia 360"

## Fuera de alcance (siguiente iteración)
- Comparador lado a lado de versiones guardadas
- Auto-refresh cuando cambian datos de `/crisis`
- Integración con WhatsApp Business para distribuir tareas a coordinadores
- Modo colaborativo multi-usuario

## Preguntas antes de implementar

Para no asumir, necesito 3 decisiones clave del usuario.

