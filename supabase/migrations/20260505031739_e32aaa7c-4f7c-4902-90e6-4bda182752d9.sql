
CREATE OR REPLACE FUNCTION public.severidad_rank(_sev TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_sev,''))
    WHEN 'informativa' THEN 1 WHEN 'info' THEN 1 WHEN 'baja' THEN 1
    WHEN 'preventiva' THEN 2 WHEN 'media' THEN 2
    WHEN 'urgente' THEN 3 WHEN 'alta' THEN 3
    WHEN 'critica' THEN 4 ELSE 0 END
$$;
