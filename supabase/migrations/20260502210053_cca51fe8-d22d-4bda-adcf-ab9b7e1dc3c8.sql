-- Restringir SELECT en social_runs: solo el dueño del run o un admin puede verlo.
-- Esto evita que cualquier usuario autenticado vea qué otros usuarios ejecutaron monitoreos.
DROP POLICY IF EXISTS "Authenticated can read runs" ON public.social_runs;

CREATE POLICY "Owners or admins can read social_runs"
ON public.social_runs
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);