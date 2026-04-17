
## Goal
Add a **Candidatos** module that lets the user register/manage candidates per nivel (gobernatura / diputado local / ayuntamiento), generate AI profiles (fortalezas, debilidades, OSINT, análisis discursivo), compare two side-by-side, and feed selected candidates into the Estrategia 360 snapshot.

Seed: Alfonso Martínez (PAN, Morelia) y Raúl Morón (Morena, Morelia).

## Architecture

```text
/candidatos (nueva ruta)
   ├── Lista filtrable por nivel + territorio
   ├── Form alta manual (nombre, partido, cargo, territorio, redes, bio)
   ├── Ficha individual: perfil IA + OSINT + discurso
   └── Comparador 2-up

Estrategia 360 (/escenarios)
   └── nuevo selector "Candidato propio + adversarios"
       └── inyecta candidatos al snapshot → IA los considera
```

## Backend

**1. Tabla `candidatos`** (RLS por user_id)
- id, user_id, nombre, partido, nivel, territorio, cargo_buscado
- bio_breve, redes (jsonb: twitter/fb/ig/web), foto_url
- tags (text[]), notas
- created_at, updated_at

**2. Tabla `candidato_analisis`** (cachea outputs de IA)
- id, candidato_id, tipo ('perfil' | 'osint' | 'discurso'), output_json, model, created_at

**3. Edge function `analizar-candidato`**
- Input: candidato + tipo de análisis + contexto territorial
- Modelo: `google/gemini-2.5-flash` (rápido, evita 504)
- Tool-calling con schema fijo:
  - **perfil**: fortalezas[], debilidades[], oportunidades[], amenazas[], score_competitividad (0-100), perfil_votante_natural
  - **osint**: presencia_digital{}, controversias[], aliados_clave[], temas_recurrentes[], menciones_recientes[]
  - **discurso**: ejes_narrativos[], tono, frames_dominantes[], vulnerabilidades_argumentales[], contraargumentos_sugeridos[]

**4. Seed inicial** (insert tool, asignado al user_id del usuario actual): Alfonso Martínez Alcázar y Raúl Morón Orozco.

## Frontend

**Nuevos archivos:**
- `src/pages/Candidatos.tsx` — lista + filtros + botón "Nuevo candidato" + acceso a ficha y comparador
- `src/components/candidatos/CandidatoForm.tsx` — alta/edición manual (Dialog)
- `src/components/candidatos/CandidatoCard.tsx` — tarjeta resumen
- `src/components/candidatos/FichaCandidato.tsx` — perfil IA + OSINT + discurso en tabs, con botón "Regenerar análisis"
- `src/components/candidatos/ComparadorCandidatos.tsx` — selector de 2 candidatos + tabla diff (FODA, score, ejes discursivos, vulnerabilidades)
- `src/lib/candidatos/types.ts`

**Integración Estrategia 360:**
- En `WizardAlcance.tsx` añadir paso opcional: seleccionar "candidato propio" + adversarios (multi) filtrados por nivel/territorio.
- En `snapshot-builder.ts` agregar campo `candidatos: { propio?, adversarios: [] }` al `SnapshotPayload` con perfil resumido (nombre, partido, FODA top, ejes discursivos).
- Edge `generar-estrategia-360` ya recibe el snapshot como JSON libre, así que el prompt incorporará automáticamente el bloque "Candidatos en escena" para análisis discursivo cruzado.

**Routing:** añadir `/candidatos` en `App.tsx` y entrada en `AppSidebar.tsx`.

## UX flow
1. Usuario entra a `/candidatos`, ve seed (Alfonso, Raúl) + botón "Agregar candidato".
2. Clic en ficha → tabs Perfil / OSINT / Discurso. Si no hay análisis, botón "Generar con IA". Resultados se cachean en `candidato_analisis`.
3. Botón "Comparar" → elige 2 → vista lado a lado con diff de FODA, score, narrativa.
4. En `/escenarios` paso 1, nuevo bloque "Candidatos" para anclar el análisis 360 a personas concretas.

## Disclaimer OSINT
El módulo OSINT generará análisis basado en conocimiento público del modelo (no scraping en vivo). Mostraremos badge "Análisis basado en información pública conocida — verificar fuentes" en la ficha.

## Entregables
- 2 migraciones (candidatos + candidato_analisis con RLS)
- 1 edge function nueva (`analizar-candidato`)
- 1 seed inicial (2 candidatos Morelia)
- 5 componentes + 1 página + integración wizard
- Update sidebar + rutas
