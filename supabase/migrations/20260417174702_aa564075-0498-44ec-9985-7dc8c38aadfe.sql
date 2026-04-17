-- Tabla para guardar estrategias 360 generadas
CREATE TABLE public.estrategias_guardadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nivel TEXT NOT NULL,
  territorio TEXT NOT NULL,
  titulo TEXT NOT NULL,
  snapshot_json JSONB NOT NULL,
  output_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.estrategias_guardadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own estrategias"
ON public.estrategias_guardadas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own estrategias"
ON public.estrategias_guardadas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estrategias"
ON public.estrategias_guardadas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estrategias"
ON public.estrategias_guardadas FOR DELETE
USING (auth.uid() = user_id);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_estrategias_guardadas_updated_at
BEFORE UPDATE ON public.estrategias_guardadas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_estrategias_user ON public.estrategias_guardadas(user_id, created_at DESC);