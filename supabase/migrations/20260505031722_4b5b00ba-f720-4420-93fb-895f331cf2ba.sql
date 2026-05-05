
REVOKE EXECUTE ON FUNCTION public.fanout_alertas_crisis() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fanout_cib_alertas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fanout_salud_municipio() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fanout_run_generic(TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fanout_alertas_crisis_run() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fanout_trends_run() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fanout_social_run() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fanout_historico_run() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.crear_preferencias_default() FROM PUBLIC, anon, authenticated;
