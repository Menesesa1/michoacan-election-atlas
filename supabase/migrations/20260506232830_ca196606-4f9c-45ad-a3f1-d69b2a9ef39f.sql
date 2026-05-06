
CREATE TABLE public.meta_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL,
  ad_archive_id text NOT NULL,
  page_id text,
  page_name text,
  ad_creative_body text,
  ad_creative_link_caption text,
  ad_creative_link_title text,
  ad_creative_link_description text,
  ad_snapshot_url text,
  ad_delivery_start_time timestamptz,
  ad_delivery_stop_time timestamptz,
  spend_lower numeric,
  spend_upper numeric,
  currency text,
  impressions_lower bigint,
  impressions_upper bigint,
  publisher_platforms text[],
  languages text[],
  demographic_distribution jsonb DEFAULT '[]'::jsonb,
  region_distribution jsonb DEFAULT '[]'::jsonb,
  raw jsonb,
  detectado_en timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidato_id, ad_archive_id)
);
CREATE INDEX idx_meta_ads_candidato ON public.meta_ads(candidato_id);
CREATE INDEX idx_meta_ads_detectado ON public.meta_ads(detectado_en DESC);

ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read meta_ads" ON public.meta_ads FOR SELECT TO authenticated USING (true);

CREATE TABLE public.meta_ads_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger text NOT NULL DEFAULT 'manual',
  candidatos_procesados integer NOT NULL DEFAULT 0,
  ads_encontrados integer NOT NULL DEFAULT 0,
  ads_nuevos integer NOT NULL DEFAULT 0,
  duracion_ms integer,
  error text,
  detalle jsonb DEFAULT '{}'::jsonb,
  ejecutada_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meta_ads_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read meta_ads_runs" ON public.meta_ads_runs FOR SELECT TO authenticated USING (true);
