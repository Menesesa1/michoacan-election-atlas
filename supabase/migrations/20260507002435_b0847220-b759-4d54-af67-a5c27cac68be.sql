CREATE TABLE public.belief_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_nombre TEXT NOT NULL,
  candidato_id UUID,
  tipo_shift TEXT NOT NULL,
  severidad TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  delta NUMERIC,
  valor_anterior NUMERIC,
  valor_actual NUMERIC,
  temas_nuevos JSONB NOT NULL DEFAULT '[]'::jsonb,
  temas_abandonados JSONB NOT NULL DEFAULT '[]'::jsonb,
  ventana_anterior TIMESTAMPTZ,
  ventana_actual TIMESTAMPTZ,
  evidencia JSONB NOT NULL DEFAULT '{}'::jsonb,
  detectado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_belief_shifts_entidad ON public.belief_shifts(entidad_nombre, detectado_en DESC);
CREATE INDEX idx_belief_shifts_detectado ON public.belief_shifts(detectado_en DESC);

ALTER TABLE public.belief_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read belief_shifts"
ON public.belief_shifts FOR SELECT TO authenticated USING (true);

CREATE TABLE public.belief_shifts_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger TEXT NOT NULL DEFAULT 'manual',
  entidades_analizadas INTEGER NOT NULL DEFAULT 0,
  shifts_detectados INTEGER NOT NULL DEFAULT 0,
  por_tipo JSONB NOT NULL DEFAULT '{}'::jsonb,
  duracion_ms INTEGER,
  error TEXT,
  ejecutada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.belief_shifts_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read belief_shifts_runs"
ON public.belief_shifts_runs FOR SELECT TO authenticated USING (true);