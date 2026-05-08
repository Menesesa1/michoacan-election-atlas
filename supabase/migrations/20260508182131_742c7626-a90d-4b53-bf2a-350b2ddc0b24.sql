
ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS es_funcionario_publico boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cargo_publico_actual text;

-- Tabla de cache de clasificación rol (candidato vs funcionario) por mención
CREATE TABLE IF NOT EXISTS public.mencion_rol_clasificacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mencion_id uuid NOT NULL,
  candidato_id uuid NOT NULL,
  rol text NOT NULL CHECK (rol IN ('candidato','funcionario','ambos','indefinido')),
  confianza numeric,
  razonamiento text,
  modelo text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (mencion_id, candidato_id)
);

ALTER TABLE public.mencion_rol_clasificacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read mencion_rol_clasificacion"
  ON public.mencion_rol_clasificacion FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mencion_rol_candidato ON public.mencion_rol_clasificacion(candidato_id);
CREATE INDEX IF NOT EXISTS idx_mencion_rol_mencion ON public.mencion_rol_clasificacion(mencion_id);
