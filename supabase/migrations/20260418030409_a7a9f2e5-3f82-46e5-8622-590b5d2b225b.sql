ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS trayectoria jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metricas_redes jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.candidatos.trayectoria IS 'Historial político estructurado: array de hitos { anio, cargo, partido, tipo (electo|designado|cambio_partido|candidatura|otro), descripcion, fuentes[] }';
COMMENT ON COLUMN public.candidatos.metricas_redes IS 'Métricas por plataforma: { facebook: { seguidores, engagement_rate, ultima_actualizacion }, twitter: {...}, instagram: {...}, tiktok: {...}, youtube: {...} }';