ALTER TABLE public.alertas_crisis_runs ADD COLUMN batch_id UUID;
CREATE INDEX idx_runs_batch ON public.alertas_crisis_runs(batch_id);

-- Backfill: emparejar runs existentes con su batch por timestamp cercano (< 2s)
UPDATE public.alertas_crisis_runs r
SET batch_id = (
  SELECT a.batch_id FROM public.alertas_crisis a
  WHERE a.detectada_en BETWEEN r.ejecutada_en - interval '5 seconds' AND r.ejecutada_en
  GROUP BY a.batch_id
  ORDER BY count(*) DESC
  LIMIT 1
)
WHERE r.batch_id IS NULL AND r.total_alertas > 0;