-- 1. Ampliar social_menciones con PSICOINT + GEOINT
ALTER TABLE public.social_menciones
  ADD COLUMN IF NOT EXISTS emociones jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sarcasmo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seccion_inferida integer,
  ADD COLUMN IF NOT EXISTS colonia_inferida text;

CREATE INDEX IF NOT EXISTS idx_social_menciones_seccion ON public.social_menciones(seccion_inferida);
CREATE INDEX IF NOT EXISTS idx_social_menciones_municipio ON public.social_menciones(municipio);

-- 2. Deduplicación de URLs ingeridas
CREATE TABLE public.medios_urls_procesadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash text NOT NULL UNIQUE,
  url text NOT NULL,
  fuente text NOT NULL,
  procesada_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medios_urls_procesadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read urls procesadas"
  ON public.medios_urls_procesadas FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_medios_urls_hash ON public.medios_urls_procesadas(url_hash);

-- 3. Alertas CIB (Coordinated Inauthentic Behavior)
CREATE TABLE public.cib_alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid,
  tipo_patron text NOT NULL,           -- 'spike_anomalo' | 'copy_paste' | 'dominacion_fuente' | 'rafaga_temporal'
  severidad text NOT NULL,             -- 'baja' | 'media' | 'alta' | 'critica'
  entidad_tipo text NOT NULL,
  entidad_nombre text NOT NULL,
  candidato_id uuid,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  evidencia jsonb NOT NULL DEFAULT '{}'::jsonb, -- urls, conteos, fragmentos similares, etc.
  ventana_inicio timestamptz NOT NULL,
  ventana_fin timestamptz NOT NULL,
  detectada_en timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cib_alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read cib_alertas"
  ON public.cib_alertas FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_cib_alertas_severidad ON public.cib_alertas(severidad, detectada_en DESC);
CREATE INDEX idx_cib_alertas_entidad ON public.cib_alertas(entidad_nombre);

-- 4. Narrativas sugeridas (mensajes accionables)
CREATE TABLE public.narrativas_sugeridas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  candidato_id uuid,
  entidad_nombre text NOT NULL,
  contexto text NOT NULL,
  tipo text NOT NULL,                  -- 'defensivo' | 'contraste' | 'pivote' | 'oportunidad' | 'contranarrativa'
  mensaje text NOT NULL,
  tono text,                           -- 'firme' | 'empatico' | 'optimista' | 'directo'
  plataforma text,                     -- 'twitter' | 'facebook' | 'rueda_prensa' | 'whatsapp'
  urgencia smallint NOT NULL DEFAULT 3, -- 1-5
  emocion_objetivo text,
  cib_alerta_id uuid REFERENCES public.cib_alertas(id) ON DELETE SET NULL,
  usado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.narrativas_sugeridas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own narrativas"
  ON public.narrativas_sugeridas FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own narrativas"
  ON public.narrativas_sugeridas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own narrativas"
  ON public.narrativas_sugeridas FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own narrativas"
  ON public.narrativas_sugeridas FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_narrativas_sugeridas_updated_at
  BEFORE UPDATE ON public.narrativas_sugeridas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Bitácora de runs del cron de medios michoacanos
CREATE TABLE public.medios_michoacan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid,
  medios_consultados integer NOT NULL DEFAULT 0,
  urls_descubiertas integer NOT NULL DEFAULT 0,
  urls_nuevas integer NOT NULL DEFAULT 0,
  menciones_creadas integer NOT NULL DEFAULT 0,
  duracion_ms integer,
  trigger text NOT NULL DEFAULT 'cron',
  error text,
  ejecutada_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medios_michoacan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read medios_michoacan_runs"
  ON public.medios_michoacan_runs FOR SELECT TO authenticated USING (true);