-- 1. Tabla de uso de APIs
CREATE TABLE public.api_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio text NOT NULL, -- 'serpapi' | 'perplexity' | 'lovable_ai' | 'firecrawl'
  funcion text NOT NULL,  -- nombre del edge function que invoca
  operacion text,         -- detalle: 'trends_estatal', 'classify_sentiment', etc.
  run_id uuid,            -- referencia al run que originó la llamada
  costo_estimado_usd numeric(10,6) NOT NULL DEFAULT 0,
  tokens_in integer,
  tokens_out integer,
  duracion_ms integer,
  status text NOT NULL DEFAULT 'ok', -- 'ok' | 'error' | 'rate_limited' | 'cache_hit'
  cache_hit boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_log_created_at ON public.api_usage_log (created_at DESC);
CREATE INDEX idx_api_usage_log_servicio ON public.api_usage_log (servicio, created_at DESC);
CREATE INDEX idx_api_usage_log_funcion ON public.api_usage_log (funcion, created_at DESC);
CREATE INDEX idx_api_usage_log_run_id ON public.api_usage_log (run_id) WHERE run_id IS NOT NULL;

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read api_usage_log"
ON public.api_usage_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Función para registrar uso (llamada vía service role desde edge functions)
CREATE OR REPLACE FUNCTION public.registrar_uso_api(
  _servicio text,
  _funcion text,
  _operacion text DEFAULT NULL,
  _run_id uuid DEFAULT NULL,
  _costo numeric DEFAULT 0,
  _tokens_in integer DEFAULT NULL,
  _tokens_out integer DEFAULT NULL,
  _duracion_ms integer DEFAULT NULL,
  _status text DEFAULT 'ok',
  _cache_hit boolean DEFAULT false,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.api_usage_log (
    servicio, funcion, operacion, run_id,
    costo_estimado_usd, tokens_in, tokens_out, duracion_ms,
    status, cache_hit, metadata
  ) VALUES (
    _servicio, _funcion, _operacion, _run_id,
    coalesce(_costo, 0), _tokens_in, _tokens_out, _duracion_ms,
    coalesce(_status, 'ok'), coalesce(_cache_hit, false), coalesce(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- 3. Vista agregada de gasto diario (últimos 30 días)
CREATE OR REPLACE VIEW public.api_usage_diario AS
SELECT
  date_trunc('day', created_at)::date AS dia,
  servicio,
  funcion,
  count(*) AS llamadas,
  count(*) FILTER (WHERE status = 'error') AS errores,
  count(*) FILTER (WHERE cache_hit) AS cache_hits,
  sum(costo_estimado_usd) AS costo_total_usd,
  avg(duracion_ms)::integer AS duracion_promedio_ms
FROM public.api_usage_log
WHERE created_at >= now() - interval '30 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, costo_total_usd DESC;

-- 4. Locks de ejecución para prevenir runs solapados
-- pg_try_advisory_lock toma un lock no-bloqueante; si retorna false, otro proceso ya está corriendo.
CREATE OR REPLACE FUNCTION public.intentar_lock_pipeline(_nombre text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_try_advisory_lock(hashtext(_nombre)::bigint);
$$;

CREATE OR REPLACE FUNCTION public.liberar_lock_pipeline(_nombre text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_advisory_unlock(hashtext(_nombre)::bigint);
$$;

-- Permitir que el rol authenticated/service llame a estas funciones
GRANT EXECUTE ON FUNCTION public.registrar_uso_api TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.intentar_lock_pipeline TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.liberar_lock_pipeline TO authenticated, service_role;
GRANT SELECT ON public.api_usage_diario TO authenticated;