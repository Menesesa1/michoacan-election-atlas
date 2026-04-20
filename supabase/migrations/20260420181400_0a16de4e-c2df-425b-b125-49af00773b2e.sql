-- Tabla para capturar interés en módulos "Próximamente"
CREATE TABLE public.solicitudes_acceso_anticipado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modulo TEXT NOT NULL CHECK (modulo IN ('territorial', 'crm', 'dia_d', 'encuestas')),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  organizacion TEXT,
  cargo TEXT,
  prioridad_percibida SMALLINT NOT NULL DEFAULT 3 CHECK (prioridad_percibida BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX idx_solicitudes_acceso_user_id ON public.solicitudes_acceso_anticipado(user_id);
CREATE INDEX idx_solicitudes_acceso_modulo ON public.solicitudes_acceso_anticipado(modulo);

-- Habilitar RLS
ALTER TABLE public.solicitudes_acceso_anticipado ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario maneja únicamente sus propias solicitudes
CREATE POLICY "Users can view their own solicitudes"
  ON public.solicitudes_acceso_anticipado
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own solicitudes"
  ON public.solicitudes_acceso_anticipado
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own solicitudes"
  ON public.solicitudes_acceso_anticipado
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own solicitudes"
  ON public.solicitudes_acceso_anticipado
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_solicitudes_acceso_updated_at
  BEFORE UPDATE ON public.solicitudes_acceso_anticipado
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();