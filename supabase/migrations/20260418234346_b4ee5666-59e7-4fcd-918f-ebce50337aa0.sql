ALTER TABLE public.social_menciones 
ADD COLUMN IF NOT EXISTS municipio text;

CREATE INDEX IF NOT EXISTS idx_social_menciones_municipio 
ON public.social_menciones(municipio) 
WHERE municipio IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_menciones_batch_municipio 
ON public.social_menciones(batch_id, municipio) 
WHERE municipio IS NOT NULL;