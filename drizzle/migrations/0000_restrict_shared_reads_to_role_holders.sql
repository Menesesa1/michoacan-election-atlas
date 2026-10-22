CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) $$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('social_resumen','Authenticated can read resumen'),
    ('historico_municipios','Authenticated can read historico'),
    ('medios_urls_procesadas','Authenticated can read urls procesadas'),
    ('alertas_crisis','Authenticated can read alertas'),
    ('meta_ads_runs','Authenticated can read meta_ads_runs'),
    ('cib_alertas','Authenticated can read cib_alertas'),
    ('historico_municipios_runs','Authenticated can read historico runs'),
    ('belief_shifts','Authenticated can read belief_shifts'),
    ('alertas_crisis_runs','Authenticated can read runs'),
    ('belief_shifts_runs','Authenticated can read belief_shifts_runs'),
    ('social_menciones','Authenticated can read menciones'),
    ('trends_runs','Authenticated can read trends runs'),
    ('medios_michoacan_runs','Authenticated can read medios_michoacan_runs'),
    ('salud_municipio_estado','Authenticated read salud municipio'),
    ('mencion_rol_clasificacion','Authenticated can read mencion_rol_clasificacion'),
    ('trends_estatal','Authenticated can read trends estatal'),
    ('meta_ads','Authenticated can read meta_ads')
  ) AS t(tbl, pol) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol, r.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()))', 'Role holders can read', r.tbl);
  END LOOP;
END $$;