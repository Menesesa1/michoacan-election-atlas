-- Tabla pública de alertas de crisis (compartidas entre todos los usuarios autenticados de la organización)
CREATE TABLE public.alertas_crisis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prioridad TEXT NOT NULL CHECK (prioridad IN ('Urgente','Preventivo','Informativo')),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  distrito TEXT NOT NULL DEFAULT 'Michoacán · Estatal',
  fuente TEXT NOT NULL,
  url_fuente TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  detectada_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  batch_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_alertas_crisis_batch ON public.alertas_crisis(batch_id);
CREATE INDEX idx_alertas_crisis_detectada ON public.alertas_crisis(detectada_en DESC);

-- Tabla de metadata de cada corrida de monitoreo
CREATE TABLE public.alertas_crisis_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ejecutada_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_alertas INTEGER NOT NULL DEFAULT 0,
  urgentes INTEGER NOT NULL DEFAULT 0,
  preventivas INTEGER NOT NULL DEFAULT 0,
  informativas INTEGER NOT NULL DEFAULT 0,
  fuentes_consultadas INTEGER NOT NULL DEFAULT 0,
  duracion_ms INTEGER,
  error TEXT,
  trigger TEXT NOT NULL DEFAULT 'manual'
);

CREATE INDEX idx_runs_ejecutada ON public.alertas_crisis_runs(ejecutada_en DESC);

-- RLS: cualquier usuario autenticado puede leer (es inteligencia compartida del equipo)
ALTER TABLE public.alertas_crisis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_crisis_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read alertas"
  ON public.alertas_crisis FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can read runs"
  ON public.alertas_crisis_runs FOR SELECT
  TO authenticated USING (true);

-- Solo service role puede insertar (vía edge function); no se necesitan policies de INSERT para usuarios.