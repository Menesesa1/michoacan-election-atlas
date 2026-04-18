
## Plan: agregar "War Room" al perfil de cada candidato

El usuario quiere capturar el equipo de campaña real (oficial + operadores ocultos) con sus trayectorias e inconsistencias. Ejemplos: Morón → Humberto Moreno; Alfonso → Goberna y EME. Se usa como contexto OSINT profundo y se inyecta a la IA para que no invente.

### Modelo de datos
Nueva columna `war_room jsonb default '[]'` en `candidatos`. Cada miembro:
- `nombre`, `rol` (jefe campaña / vocero / consultor estrategia / digital / financista / coordinador territorial / jurídico / etc.)
- `tipo`: persona | consultora
- `visible`: true (oficial) | false (operador en la sombra)
- `trayectoria_breve`, `inconsistencias[]`, `fuentes[]` (URLs)

### UI — pestaña "War Room" en `FichaCandidato.tsx`
Nuevo componente `WarRoomEditor.tsx`: tabla editable con add/edit/delete por fila. Badges:
- "Oficial" vs "🔍 Operador oculto"
- "Persona" vs "Consultora"
- Chips para inconsistencias (rojo) y fuentes (link)
Nota explicativa: "Captura aquí el equipo conocido del candidato, incluidos operadores no oficiales. Esta información se usa como contexto verificado para los análisis IA y NO se inventa."

### Integración con IA
- Edge `analizar-candidato`: el `war_room` viaja en el prompt como contexto obligatorio.
- Schema OSINT añade `war_room_resumen`: coherencia con narrativa pública + alertas reputacionales por miembro.
- Schema FODA: equipo se considera fortaleza/amenaza.
- Schema Discurso: evalúa si la narrativa refleja al equipo real.
- Snapshot a Estrategia 360 incluye War Room resumido para análisis cruzado entre candidatos.
- Editar War Room dispara regeneración (mismo flujo que ya existe para campos clave) si el toggle "Regenerar análisis IA" está activo.

### Seed inicial (marcado "borrador por verificar")
- **Raúl Morón Orozco** → Humberto Moreno (rol: operador político, visible=false, inconsistencias: placeholder "por documentar con fuentes", fuentes: [])
- **Alfonso Martínez Alcázar** → Goberna (consultora estrategia, visible=true), EME (consultora comunicación/imagen, visible=true)

Cada entrada con `notas_internas: "Borrador inicial — completar fuentes antes de usar en estrategia"` para que sea evidente que requiere validación.

### Entregables
1. Migración: `ALTER TABLE candidatos ADD COLUMN war_room jsonb NOT NULL DEFAULT '[]'`.
2. `src/lib/candidatos/types.ts` → tipo `WarRoomMiembro` + campo en `Candidato` y en `CandidatoSnapshot`.
3. `src/components/candidatos/WarRoomEditor.tsx` (nuevo).
4. `src/components/candidatos/FichaCandidato.tsx` → nueva pestaña "War Room".
5. `supabase/functions/analizar-candidato/index.ts` → contexto obligatorio + nuevo campo `war_room_resumen` en schema OSINT.
6. `src/components/candidatos/CandidatoForm.tsx` → contar `war_room` como cambio que dispara regeneración.
7. `src/lib/estrategia/snapshot-builder.ts` → incluir resumen de War Room en snapshot.
8. Seed via insert tool (3 miembros marcados como borrador).

### Después (turno aparte)
Cuando aprobemos Firecrawl/Perplexity, el edge `investigar-candidato` precargará War Room desde fuentes públicas; tú validas antes de guardar.

<lov-actions>
<lov-suggestion message="Procede con todo el plan: migración, editor War Room, integración IA, seed marcado como borrador y regeneración automática al editarlo.">Sí, procede con todo</lov-suggestion>
<lov-suggestion message="Hazlo todo pero NO siembres datos iniciales (ni siquiera marcados como borrador). Prefiero capturar yo cada miembro desde cero para no contaminar el expediente.">Sin seed, yo capturo todo</lov-suggestion>
<lov-suggestion message="Implementa solo el editor War Room y la migración por ahora. La integración con la IA (war_room_resumen, snapshot a Estrategia 360, regeneración) la hacemos en un segundo paso para validar primero el flujo de captura.">Solo captura primero, IA después</lov-suggestion>
<lov-suggestion message="Agrega también campo de foto opcional y handles de redes por cada miembro del War Room, para poder perfilar también a los operadores clave (no solo al candidato).">Incluye foto y redes por miembro</lov-suggestion>
</lov-actions>
