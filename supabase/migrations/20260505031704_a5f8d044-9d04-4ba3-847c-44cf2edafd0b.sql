
-- =========================
-- TABLA: notificaciones
-- =========================
CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL, -- 'alerta_crisis' | 'cib' | 'run' | 'salud_municipio'
  severidad TEXT NOT NULL DEFAULT 'info', -- 'info' | 'preventiva' | 'urgente' | 'critica'
  titulo TEXT NOT NULL,
  descripcion TEXT,
  link TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  leida BOOLEAN NOT NULL DEFAULT false,
  leida_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notificaciones_user_unread ON public.notificaciones(user_id, leida, created_at DESC);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notificaciones"
  ON public.notificaciones FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notificaciones"
  ON public.notificaciones FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notificaciones"
  ON public.notificaciones FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================
-- TABLA: notificacion_preferencias
-- =========================
CREATE TABLE public.notificacion_preferencias (
  user_id UUID PRIMARY KEY,
  alertas_crisis BOOLEAN NOT NULL DEFAULT true,
  alertas_crisis_min_severidad TEXT NOT NULL DEFAULT 'preventiva', -- 'informativa' | 'preventiva' | 'urgente'
  cib BOOLEAN NOT NULL DEFAULT true,
  cib_min_severidad TEXT NOT NULL DEFAULT 'media', -- 'baja' | 'media' | 'alta'
  runs BOOLEAN NOT NULL DEFAULT false,
  runs_solo_errores BOOLEAN NOT NULL DEFAULT true,
  salud_municipio BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacion_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferencias"
  ON public.notificacion_preferencias FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_pref_updated_at
  BEFORE UPDATE ON public.notificacion_preferencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- TABLA: salud_municipio_estado
-- =========================
CREATE TABLE public.salud_municipio_estado (
  municipio_clave INTEGER PRIMARY KEY,
  municipio_nombre TEXT NOT NULL,
  estado TEXT NOT NULL, -- 'verde' | 'ambar' | 'rojo'
  estado_anterior TEXT,
  score NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  cambiado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.salud_municipio_estado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read salud municipio"
  ON public.salud_municipio_estado FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_salud_updated_at
  BEFORE UPDATE ON public.salud_municipio_estado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- HELPER: severidad ranking
-- =========================
CREATE OR REPLACE FUNCTION public.severidad_rank(_sev TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(_sev,''))
    WHEN 'informativa' THEN 1
    WHEN 'info' THEN 1
    WHEN 'baja' THEN 1
    WHEN 'preventiva' THEN 2
    WHEN 'media' THEN 2
    WHEN 'urgente' THEN 3
    WHEN 'alta' THEN 3
    WHEN 'critica' THEN 4
    ELSE 0 END
$$;

-- =========================
-- TRIGGER: alertas_crisis -> notificaciones
-- =========================
CREATE OR REPLACE FUNCTION public.fanout_alertas_crisis()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notificaciones (user_id, tipo, severidad, titulo, descripcion, link, metadata)
  SELECT
    p.user_id,
    'alerta_crisis',
    NEW.prioridad,
    '🚨 ' || NEW.titulo,
    NEW.descripcion,
    '/inteligencia',
    jsonb_build_object('alerta_id', NEW.id, 'distrito', NEW.distrito, 'fuente', NEW.fuente)
  FROM public.notificacion_preferencias p
  WHERE p.alertas_crisis = true
    AND severidad_rank(NEW.prioridad) >= severidad_rank(p.alertas_crisis_min_severidad);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_fanout_alertas_crisis
  AFTER INSERT ON public.alertas_crisis
  FOR EACH ROW EXECUTE FUNCTION public.fanout_alertas_crisis();

-- =========================
-- TRIGGER: cib_alertas -> notificaciones
-- =========================
CREATE OR REPLACE FUNCTION public.fanout_cib_alertas()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notificaciones (user_id, tipo, severidad, titulo, descripcion, link, metadata)
  SELECT
    p.user_id,
    'cib',
    NEW.severidad,
    '🕸️ CIB: ' || NEW.titulo,
    NEW.descripcion,
    '/inteligencia',
    jsonb_build_object('cib_id', NEW.id, 'patron', NEW.tipo_patron, 'entidad', NEW.entidad_nombre)
  FROM public.notificacion_preferencias p
  WHERE p.cib = true
    AND severidad_rank(NEW.severidad) >= severidad_rank(p.cib_min_severidad);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_fanout_cib_alertas
  AFTER INSERT ON public.cib_alertas
  FOR EACH ROW EXECUTE FUNCTION public.fanout_cib_alertas();

-- =========================
-- TRIGGER: salud_municipio_estado cambio -> notificaciones
-- =========================
CREATE OR REPLACE FUNCTION public.fanout_salud_municipio()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_titulo TEXT;
  v_sev TEXT;
BEGIN
  IF NEW.estado IS NOT DISTINCT FROM OLD.estado THEN
    RETURN NEW;
  END IF;
  v_sev := CASE NEW.estado WHEN 'rojo' THEN 'urgente' WHEN 'ambar' THEN 'preventiva' ELSE 'info' END;
  v_titulo := '📍 ' || NEW.municipio_nombre || ': ' || coalesce(OLD.estado,'?') || ' → ' || NEW.estado;

  INSERT INTO public.notificaciones (user_id, tipo, severidad, titulo, descripcion, link, metadata)
  SELECT
    p.user_id, 'salud_municipio', v_sev, v_titulo,
    'Cambio en pipeline de salud democrática',
    '/administracion',
    jsonb_build_object('municipio_clave', NEW.municipio_clave, 'estado_nuevo', NEW.estado, 'estado_anterior', OLD.estado)
  FROM public.notificacion_preferencias p
  WHERE p.salud_municipio = true;

  NEW.estado_anterior := OLD.estado;
  NEW.cambiado_en := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_fanout_salud_municipio
  BEFORE UPDATE ON public.salud_municipio_estado
  FOR EACH ROW EXECUTE FUNCTION public.fanout_salud_municipio();

-- =========================
-- TRIGGERS: runs terminados -> notificaciones
-- =========================
CREATE OR REPLACE FUNCTION public.fanout_run_generic(
  _tipo_label TEXT, _user_id UUID, _error TEXT, _resumen TEXT, _link TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notificaciones (user_id, tipo, severidad, titulo, descripcion, link, metadata)
  SELECT
    p.user_id, 'run',
    CASE WHEN _error IS NOT NULL THEN 'urgente' ELSE 'info' END,
    CASE WHEN _error IS NOT NULL
         THEN '❌ ' || _tipo_label || ' falló'
         ELSE '✅ ' || _tipo_label || ' completado' END,
    coalesce(_error, _resumen),
    _link,
    jsonb_build_object('tipo_run', _tipo_label, 'error', _error)
  FROM public.notificacion_preferencias p
  WHERE p.runs = true
    AND (p.runs_solo_errores = false OR _error IS NOT NULL)
    AND (_user_id IS NULL OR p.user_id = _user_id);
END $$;

CREATE OR REPLACE FUNCTION public.fanout_alertas_crisis_run()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.fanout_run_generic(
    'Alertas de crisis', NULL, NEW.error,
    format('Procesadas %s alertas (%s urgentes)', NEW.total_alertas, NEW.urgentes),
    '/inteligencia'
  );
  RETURN NEW;
END $$;
CREATE TRIGGER trg_fanout_alertas_crisis_run
  AFTER INSERT ON public.alertas_crisis_runs
  FOR EACH ROW EXECUTE FUNCTION public.fanout_alertas_crisis_run();

CREATE OR REPLACE FUNCTION public.fanout_trends_run()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.fanout_run_generic(
    'Google Trends estatal', NULL, NEW.error,
    format('Procesados %s términos', NEW.total_terminos),
    '/inteligencia'
  );
  RETURN NEW;
END $$;
CREATE TRIGGER trg_fanout_trends_run
  AFTER INSERT ON public.trends_runs
  FOR EACH ROW EXECUTE FUNCTION public.fanout_trends_run();

CREATE OR REPLACE FUNCTION public.fanout_social_run()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.fanout_run_generic(
    'Monitoreo social', NEW.user_id, NEW.error,
    format('%s entidades, %s menciones', NEW.entidades_procesadas, NEW.total_menciones),
    '/inteligencia'
  );
  RETURN NEW;
END $$;
CREATE TRIGGER trg_fanout_social_run
  AFTER INSERT ON public.social_runs
  FOR EACH ROW EXECUTE FUNCTION public.fanout_social_run();

CREATE OR REPLACE FUNCTION public.fanout_historico_run()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.fanout_run_generic(
    'Histórico municipios', NULL, NEW.error,
    format('%s solicitados, %s OK, %s fallidos', NEW.total_solicitados, NEW.total_exitosos, NEW.total_fallidos),
    '/datos'
  );
  RETURN NEW;
END $$;
CREATE TRIGGER trg_fanout_historico_run
  AFTER INSERT ON public.historico_municipios_runs
  FOR EACH ROW EXECUTE FUNCTION public.fanout_historico_run();

-- =========================
-- AUTO-CREAR PREFERENCIAS POR DEFECTO al insertar rol
-- =========================
CREATE OR REPLACE FUNCTION public.crear_preferencias_default()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notificacion_preferencias (user_id)
  VALUES (NEW.user_id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_pref_default
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.crear_preferencias_default();

-- Bootstrap preferencias para usuarios existentes
INSERT INTO public.notificacion_preferencias (user_id)
SELECT DISTINCT user_id FROM public.user_roles
ON CONFLICT (user_id) DO NOTHING;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
