---
name: Datos en 3 tabs
description: /datos consolida toda la estadística referencial en Resultados (con selector de elección+nivel), Contexto (Demografía+Socioeconómico) y Cruces. Distritos NO es tab independiente.
type: feature
---
**Estructura:** `src/pages/Datos.tsx` con 3 tabs:
- **Resultados** (`ResultadosPanel.tsx`): selector interno entre Gobernatura, Dip. Locales, Ayuntamientos y Cartografía distrital.
- **Contexto** (`ContextoPanel.tsx`): toggle Demografía/Socioeconómico.
- **Cruces** (`CrucesPanel.tsx`): correlaciones voto × socioeconómico.

**Aliases:** URLs antiguas (`/datos/gobernador`, `/datos/distritos`, etc.) redirigen al tab nuevo correspondiente vía mapa `ALIAS` en Datos.tsx.

**Regla:** Distritos federales NO debe reaparecer como tab — es un corte de los mismos datos.
