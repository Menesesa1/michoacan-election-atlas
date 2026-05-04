---
name: Situation Room
description: Mando Central abre con un Situation Room compacto que muestra líder político, alertas críticas, sentimiento agregado y narrativa accionable, todo enlazado al Monitor de Inteligencia.
type: feature
---
**Componente:** `src/components/mando/SituationRoom.tsx`. Se monta arriba del banner de fase en `MandoCentral.tsx`.

**Datos:** lee en paralelo `alertas_crisis`, `cib_alertas`, `social_resumen` y `narrativas_sugeridas` (limitado a las más recientes/urgentes). Usa `useElectoralData` para el líder de gobernatura y `useListaNominalOficial` para la LN.

**Regla:** Es la primera cosa visible al entrar a /mando-central — debe responder "¿cómo está el escenario hoy?" en menos de 5 segundos.
