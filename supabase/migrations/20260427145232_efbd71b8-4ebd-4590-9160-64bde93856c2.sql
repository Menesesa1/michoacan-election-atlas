-- =====================================================
-- Tabla: trends_estatal
-- Snapshots de Google Trends para Michoacán (geo MX-MIC)
-- =====================================================
CREATE TABLE public.trends_estatal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL,
  geo TEXT NOT NULL DEFAULT 'MX-MIC',
  -- 'top_searches' | 'rising_searches' | 'interest_over_time' | 'related_queries'
  tipo TEXT NOT NULL,
  termino TEXT NOT NULL,
  valor_interes NUMERIC, -- 0-100 cuando aplica
  variacion_pct NUMERIC, -- % de incremento (rising)
  serie_temporal JSONB DEFAULT '[]'::jsonb, -- [{ fecha, valor }]
  related JSONB DEFAULT '[]'::jsonb, -- consultas relacionadas
  contexto_narrativo TEXT, -- análisis perplexity
  citas JSONB DEFAULT '[]'::jsonb, -- [{ url, titulo, medio }]
  raw_serpapi JSONB, -- payload original para auditoría
  ejecutada_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_trends_estatal_batch ON public.trends_estatal(batch_id);
CREATE INDEX idx_trends_estatal_tipo ON public.trends_estatal(tipo, ejecutada_en DESC);
CREATE INDEX idx_trends_estatal_termino ON public.trends_estatal(termino);

ALTER TABLE public.trends_estatal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read trends estatal"
ON public.trends_estatal
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- Tabla: trends_candidato
-- Consultas Trends por candidato (on-demand desde Ficha)
-- =====================================================
CREATE TABLE public.trends_candidato (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidato_id UUID NOT NULL,
  user_id UUID NOT NULL,
  termino TEXT NOT NULL, -- nombre del candidato consultado
  geo TEXT NOT NULL DEFAULT 'MX-MIC',
  rango_temporal TEXT NOT NULL DEFAULT 'today 12-m',
  pico_interes NUMERIC,
  promedio_interes NUMERIC,
  serie_temporal JSONB DEFAULT '[]'::jsonb,
  related_top JSONB DEFAULT '[]'::jsonb,
  related_rising JSONB DEFAULT '[]'::jsonb,
  comparativos JSONB DEFAULT '[]'::jsonb, -- otros términos comparados
  contexto_narrativo TEXT,
  citas JSONB DEFAULT '[]'::jsonb,
  raw_serpapi JSONB,
  ejecutada_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_trends_candidato_candidato ON public.trends_candidato(candidato_id, ejecutada_en DESC);
CREATE INDEX idx_trends_candidato_user ON public.trends_candidato(user_id);

ALTER TABLE public.trends_candidato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trends candidato"
ON public.trends_candidato
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trends candidato"
ON public.trends_candidato
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trends candidato"
ON public.trends_candidato
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- Tabla: trends_runs
-- Bitácora de ejecuciones del cron estatal
-- =====================================================
CREATE TABLE public.trends_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID,
  trigger TEXT NOT NULL DEFAULT 'manual',
  total_terminos INTEGER NOT NULL DEFAULT 0,
  duracion_ms INTEGER,
  error TEXT,
  ejecutada_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trends_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read trends runs"
ON public.trends_runs
FOR SELECT
TO authenticated
USING (true);