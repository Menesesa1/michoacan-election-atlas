CREATE TABLE public.historico_municipios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio_clave integer NOT NULL,
  municipio_nombre text NOT NULL,
  anio integer NOT NULL,
  partido_ganador text,
  candidato_ganador text,
  pct_ganador numeric,
  partido_segundo text,
  pct_segundo numeric,
  participacion_pct numeric,
  fuente text NOT NULL DEFAULT 'perplexity',
  fuente_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  notas text,
  ingerido_en timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(municipio_clave, anio)
);

ALTER TABLE public.historico_municipios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read historico"
  ON public.historico_municipios
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_historico_muni_anio ON public.historico_municipios(municipio_clave, anio);

CREATE TRIGGER update_historico_municipios_updated_at
  BEFORE UPDATE ON public.historico_municipios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.historico_municipios_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ejecutada_en timestamp with time zone NOT NULL DEFAULT now(),
  total_solicitados integer NOT NULL DEFAULT 0,
  total_exitosos integer NOT NULL DEFAULT 0,
  total_fallidos integer NOT NULL DEFAULT 0,
  duracion_ms integer,
  trigger text NOT NULL DEFAULT 'manual',
  error text,
  detalle jsonb
);

ALTER TABLE public.historico_municipios_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read historico runs"
  ON public.historico_municipios_runs
  FOR SELECT
  TO authenticated
  USING (true);
