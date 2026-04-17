-- Tabla candidatos
CREATE TABLE public.candidatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  partido TEXT NOT NULL,
  nivel TEXT NOT NULL,
  territorio TEXT NOT NULL,
  cargo_buscado TEXT,
  bio_breve TEXT,
  redes JSONB DEFAULT '{}'::jsonb,
  foto_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own candidatos"
  ON public.candidatos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own candidatos"
  ON public.candidatos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own candidatos"
  ON public.candidatos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own candidatos"
  ON public.candidatos FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_candidatos_updated_at
  BEFORE UPDATE ON public.candidatos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_candidatos_user_nivel ON public.candidatos(user_id, nivel);
CREATE INDEX idx_candidatos_territorio ON public.candidatos(territorio);

-- Tabla candidato_analisis (cache de outputs IA)
CREATE TABLE public.candidato_analisis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('perfil', 'osint', 'discurso')),
  output_json JSONB NOT NULL,
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidato_analisis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analisis"
  ON public.candidato_analisis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own analisis"
  ON public.candidato_analisis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analisis"
  ON public.candidato_analisis FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_analisis_candidato_tipo ON public.candidato_analisis(candidato_id, tipo, created_at DESC);