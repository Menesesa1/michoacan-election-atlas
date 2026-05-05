-- Vista con security_invoker para respetar RLS del consultante
ALTER VIEW public.api_usage_diario SET (security_invoker = true);

-- Restringir ejecución de funciones SECURITY DEFINER al service_role
REVOKE EXECUTE ON FUNCTION public.registrar_uso_api(text, text, text, uuid, numeric, integer, integer, integer, text, boolean, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.intentar_lock_pipeline(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.liberar_lock_pipeline(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.registrar_uso_api(text, text, text, uuid, numeric, integer, integer, integer, text, boolean, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.intentar_lock_pipeline(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.liberar_lock_pipeline(text) TO service_role;