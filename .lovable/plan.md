

## Plan: Sistema de Mando Estratégico Michoacán 360

Transformación del dashboard actual en una plataforma ejecutiva con login, sidebar de inteligencia, módulo de crisis y rebrand visual completo. Mantengo toda la funcionalidad existente (electoral, demografía, mapas, importador CSV) y la reorganizo bajo el nuevo sistema.

### 1. Rebrand visual "Executive Dark Mode / Corporate Blue"

**Archivos**: `src/index.css`, `tailwind.config.ts`

Nueva paleta en HSL (manteniendo el sistema de tokens semánticos):
- `--background`: Azul marino profundo (`#1a2b4b` → `217 49% 20%`)
- `--card`: Azul marino más oscuro para paneles
- `--primary`: Dorado metálico (`#c5a059` → `40 49% 56%`)
- `--accent`: Dorado claro para hover/glow
- `--foreground`: Gris neutro claro (`#f4f4f4`)
- `--muted`: Azul intermedio
- Tipografía: Inter (ya cargada, se mantiene como sustituto profesional de Arial)
- Nuevos utilitarios: `.executive-panel`, `.gold-border`, `.glow-gold`

Se actualizan colores de partidos para que mantengan contraste sobre fondo azul marino.

### 2. Pantalla de login profesional

**Nuevo**: `src/pages/Login.tsx`, `src/context/AuthContext.tsx`

- Login client-side simple (sin backend) usando `localStorage` con un usuario demo configurable. **Nota importante para el usuario**: esto es solo una "puerta de presentación", no seguridad real. Si necesitan auth real, se debe activar Lovable Cloud después.
- Layout: split screen — izquierda branding ("EME Gabinete Estratégico" + eslogan "Movemos realidades" + logo SVG generado), derecha formulario.
- Validación con `zod`.
- Ruta protegida: `App.tsx` envuelve rutas con `<RequireAuth>`.

### 3. Layout con Sidebar "Herramientas de Inteligencia"

**Nuevo**: `src/components/AppSidebar.tsx`, `src/layouts/AppLayout.tsx`

Usando `shadcn/sidebar` (`collapsible="icon"`):

Secciones del sidebar:
- **Mando Central** (interno): Resumen, Distritos, Demografía, Tendencias, Crisis, Fuentes
- **Herramientas de Inteligencia** (externos, abren en nueva pestaña):
  - Meta Business Suite → `https://business.facebook.com/`
  - Google Trends Michoacán → `https://trends.google.com/trends/explore?geo=MX-MIC`
  - IEM Michoacán → `https://iem.org.mx/`
  - Repositorio Drive → placeholder configurable

`SidebarTrigger` siempre visible en el header. La navegación interna reemplaza las tabs actuales del `Header`.

### 4. Nuevo módulo "Alertas de Operación" (Crisis)

**Nuevo**: `src/components/AlertasOperacion.tsx`, `src/data/alertas-mock.ts`

- Feed estilo timeline de noticias.
- Cada alerta: tag de prioridad (`Urgente` rojo, `Preventivo` dorado, `Informativo` azul claro), distrito, timestamp, descripción, fuente.
- Filtros por prioridad y distrito.
- Preparado para recibir datos vía:
  - JSON local (mock inicial)
  - URL de Google Sheets publicada como CSV (input configurable + parser usando el `csv-parser` ya existente)
- Skeleton loader (`@/components/ui/skeleton`) mientras carga.
- Auto-refresh cada 60s cuando hay URL configurada.

### 5. Dashboard ejecutivo con charts dinámicos

**Nuevo**: `src/components/IntencionVotoChart.tsx`, `src/components/SentimientoMoreliaChart.tsx`

- Recharts: línea temporal de intención de voto por partido en Morelia
- Área apilada del sentimiento social (positivo/neutro/negativo) en el tiempo
- Skeleton loaders mientras montan
- Datos desde `src/data/intencion-voto-mock.ts` (preparado para reemplazar con CSV/JSON)

Se integran en una nueva vista **Mando Central** (reemplaza/complementa "Resumen").

### 6. Mapa con tooltips de Lealtad y Riesgo

**Edita**: `src/components/MapaInteractivo.tsx`

- Añadir campos `lealtad` (0-100) y `riesgo` ("Alto"/"Medio"/"Bajo") al modelo de distrito (en `electoral-data.ts` y `distritos-locales.ts`, calculados desde competitividad + mock).
- Tooltip permanente en hover (no solo popup en click) mostrando: distrito, lealtad %, nivel de riesgo, ganador.
- Color de borde según riesgo (rojo/dorado/verde).

### 7. Conectividad JSON / Google Sheets CSV

**Nuevo**: `src/lib/data-source.ts`, `src/components/DataSourceConfig.tsx` (en pestaña Fuentes)

- Helper `fetchFromUrl(url)` que detecta JSON vs CSV.
- Soporte para URLs públicas de Google Sheets (`/pub?output=csv`).
- Hook `useRemoteData(url, parser)` con estado loading/error/data → habilita Skeletons en consumidores.

### 8. Skeleton loaders consistentes

**Edita**: `KPICards`, `ResultadosPorPartido`, `CompetitividadChart`, `TablaDistritos`, `DemografiaPanel`, nuevos charts y alertas.

Usar `<Skeleton>` ya disponible. Patrón: `if (loading) return <SkeletonVariant />`.

### 9. Reestructura de rutas

```text
/login                  → Login (público)
/                       → AppLayout (protegido)
  /                     → Mando Central (dashboard ejecutivo)
  /distritos            → Distritos + Mapa
  /demografia           → Demografía
  /tendencias           → Tendencias + Simulador
  /crisis               → Alertas de Operación  [NUEVO]
  /fuentes              → Importador + Config remota + Fuentes
*                       → NotFound
```

`Header.tsx` se simplifica (solo branding + user menu + logout); la navegación pasa al sidebar.

### Detalles técnicos

- **Auth**: `AuthContext` con `login(user, pass)`, `logout()`, `isAuthenticated`. Persistencia en `localStorage`. Usuario demo: `admin / eme2025` (configurable). Documentar limitación.
- **Logo EME**: SVG inline generado con monograma "EME" en dorado sobre azul marino, reusable en login, sidebar y header.
- **Tipografía**: mantener Inter (cumple "limpia y profesional" tipo Arial). Sin nuevas fuentes para evitar peso.
- **Compatibilidad**: el `DataContext` actual se mantiene intacto; solo se añade `AuthContext` y el nuevo layout por encima.
- **Mobile**: sidebar colapsa a offcanvas en <768px, header muestra `SidebarTrigger`.

### Archivos creados (≈10)
`src/pages/Login.tsx`, `src/pages/MandoCentral.tsx`, `src/pages/Crisis.tsx`, `src/context/AuthContext.tsx`, `src/components/RequireAuth.tsx`, `src/components/AppSidebar.tsx`, `src/components/AlertasOperacion.tsx`, `src/components/IntencionVotoChart.tsx`, `src/components/SentimientoMoreliaChart.tsx`, `src/components/EmeLogo.tsx`, `src/components/DataSourceConfig.tsx`, `src/layouts/AppLayout.tsx`, `src/lib/data-source.ts`, `src/data/alertas-mock.ts`, `src/data/intencion-voto-mock.ts`

### Archivos editados (≈8)
`src/App.tsx`, `src/index.css`, `tailwind.config.ts`, `src/pages/Index.tsx` (se convierte en redirect o se integra en MandoCentral), `src/components/Header.tsx`, `src/components/MapaInteractivo.tsx`, `src/data/electoral-data.ts`, `src/data/distritos-locales.ts`

### Fuera de alcance (sugerido como siguiente paso)
- Auth real con backend (requiere activar Lovable Cloud)
- Embebido directo de Meta/Trends dentro de la app (los sitios bloquean iframes; se enlaza en pestaña nueva)
- Integración real con APIs de Meta Ads (requiere OAuth y backend)

