-- Tipo de entidad monitoreada
CREATE TYPE public.social_entidad_tipo AS ENUM ('estatal', 'candidato_propio', 'rival');

-- Menciones individuales
CREATE TABLE public.social_menciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL,
  entidad_tipo public.social_entidad_tipo NOT NULL,
  entidad_nombre TEXT NOT NULL,
  candidato_id UUID REFERENCES public.candidatos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  fragmento TEXT,
  url TEXT,
  fuente TEXT,
  sentimiento NUMERIC(3,2) NOT NULL CHECK (sentimiento BETWEEN -1 AND 1),
  tema TEXT,
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  publicada_en TIMESTAMPTZ,
  detectada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_menciones_batch ON public.social_menciones(batch_id);
CREATE INDEX idx_social_menciones_entidad ON public.social_menciones(entidad_tipo, entidad_nombre);
CREATE INDEX idx_social_menciones_detectada ON public.social_menciones(detectada_en DESC);
CREATE INDEX idx_social_menciones_candidato ON public.social_menciones(candidato_id);

-- Resumen agregado por entidad (último snapshot)
CREATE TABLE public.social_resumen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL,
  entidad_tipo public.social_entidad_tipo NOT NULL,
  entidad_nombre TEXT NOT NULL,
  candidato_id UUID REFERENCES public.candidatos(id) ON DELETE SET NULL,
  total_menciones INTEGER NOT NULL DEFAULT 0,
  sentimiento_promedio NUMERIC(3,2),
  pct_positivo NUMERIC(5,2),
  pct_neutro NUMERIC(5,2),
  pct_negativo NUMERIC(5,2),
  top_hashtags JSONB DEFAULT '[]'::jsonb,
  top_temas JSONB DEFAULT '[]'::jsonb,
  generado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_resumen_batch ON public.social_resumen(batch_id);
CREATE INDEX idx_social_resumen_entidad ON public.social_resumen(entidad_tipo, entidad_nombre, generado_en DESC);

-- Bitácora
CREATE TABLE public.social_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL UNIQUE,
  ejecutada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  entidades_procesadas INTEGER NOT NULL DEFAULT 0,
  total_menciones INTEGER NOT NULL DEFAULT 0,
  duracion_ms INTEGER,
  trigger TEXT NOT NULL DEFAULT 'manual',
  error TEXT,
  user_id UUID
);

CREATE INDEX idx_social_runs_ejecutada ON public.social_runs(ejecutada_en DESC);

-- RLS: lectura para autenticados, escritura solo service role
ALTER TABLE public.social_menciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_resumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read menciones"
  ON public.social_menciones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read resumen"
  ON public.social_resumen FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read runs"
  ON public.social_runs FOR SELECT TO authenticated USING (true);

-- Realtime para auto-refresh al terminar corrida
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_runs;