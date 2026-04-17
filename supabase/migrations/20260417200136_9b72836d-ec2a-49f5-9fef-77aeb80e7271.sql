-- Añadir fase de la candidatura (precampaña, campaña, electo, aspirante)
ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS fase text NOT NULL DEFAULT 'precampana';

-- Validación: solo valores permitidos
ALTER TABLE public.candidatos
  DROP CONSTRAINT IF EXISTS candidatos_fase_check;

ALTER TABLE public.candidatos
  ADD CONSTRAINT candidatos_fase_check
  CHECK (fase IN ('aspirante', 'precampana', 'campana', 'electo'));

-- Índice para agrupar por contienda interna (mismo partido + cargo + territorio)
CREATE INDEX IF NOT EXISTS idx_candidatos_contienda
  ON public.candidatos (user_id, nivel, territorio, partido, fase);

COMMENT ON COLUMN public.candidatos.fase IS
  'Fase del proceso: aspirante (busca candidatura interna), precampana (oficial precampaña), campana (campaña constitucional), electo (ya ganó cargo).';