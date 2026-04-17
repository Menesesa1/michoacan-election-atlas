-- Marcar candidatos como propios (mi equipo) vs adversarios/observados
ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS es_propio boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_candidatos_propio
  ON public.candidatos (user_id, es_propio) WHERE es_propio = true;

COMMENT ON COLUMN public.candidatos.es_propio IS
  'Marca si el candidato pertenece al equipo propio del usuario (vs adversario u observado). Usado para foco automático en Mando Central.';