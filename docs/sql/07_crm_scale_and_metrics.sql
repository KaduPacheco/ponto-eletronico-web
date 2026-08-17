-- ESCALA E MÉTRICAS DO CRM (ETAPA 3)
-- Execute após 00_crm_authorization.sql, 06_apply_authorization_hardening.sql
-- e 06_crm_operational_foundation.sql.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_stage_created_at ON public.leads(pipeline_stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source_created_at ON public.leads(origem, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_open_due ON public.lead_tasks(lead_id, due_date ASC) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_type ON public.analytics_events(occurred_at DESC, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_page_view_visitor ON public.analytics_events(occurred_at DESC, visitor_id) WHERE event_type = 'page_view';

-- Lista paginada: retorna apenas a página solicitada e seu resumo operacional.
CREATE OR REPLACE FUNCTION public.get_crm_leads_page(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 25,
  p_search text DEFAULT NULL,
  p_stage text DEFAULT NULL,
  p_owner_id uuid DEFAULT NULL,
  p_unassigned boolean DEFAULT false,
  p_source text DEFAULT NULL,
  p_period_days integer DEFAULT NULL,
  p_sort text DEFAULT 'priority'
)
RETURNS TABLE (lead jsonb, open_task_count integer, overdue_task_count integer, next_task_at timestamptz, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH permitted AS (
    SELECT public.has_crm_role(ARRAY['manager', 'admin']) AS allowed
  ), filtered AS (
    SELECT l.*,
      count(*) OVER() AS all_count,
      (SELECT count(*) FROM lead_tasks t WHERE t.lead_id = l.id AND NOT t.completed)::integer AS open_count,
      (SELECT count(*) FROM lead_tasks t WHERE t.lead_id = l.id AND NOT t.completed AND t.due_date < now())::integer AS overdue_count,
      (SELECT min(t.due_date) FROM lead_tasks t WHERE t.lead_id = l.id AND NOT t.completed) AS next_due
    FROM leads l, permitted p
    WHERE p.allowed
      AND (p_search IS NULL OR btrim(p_search) = '' OR concat_ws(' ', l.nome, l.empresa, l.email, l.whatsapp) ILIKE '%' || p_search || '%')
      AND (p_stage IS NULL OR p_stage = 'all' OR (p_stage = 'without_stage' AND l.pipeline_stage IS NULL) OR l.pipeline_stage = p_stage)
      AND (p_owner_id IS NULL OR l.owner_id = p_owner_id)
      AND (NOT p_unassigned OR l.owner_id IS NULL)
      AND (p_source IS NULL OR p_source = 'all' OR lower(coalesce(l.origem, '')) = lower(p_source))
      AND (p_period_days IS NULL OR l.created_at >= now() - make_interval(days => p_period_days))
  )
  SELECT to_jsonb(f.*) - 'all_count' - 'open_count' - 'overdue_count' - 'next_due', f.open_count, f.overdue_count, f.next_due, f.all_count
  FROM filtered f
  ORDER BY
    CASE WHEN p_sort = 'priority' THEN f.overdue_count END DESC,
    CASE WHEN p_sort IN ('priority', 'next_follow_up') THEN f.next_due END ASC NULLS LAST,
    CASE WHEN p_sort = 'oldest' THEN f.created_at END ASC,
    CASE WHEN p_sort <> 'oldest' THEN f.created_at END DESC
  LIMIT least(greatest(p_page_size, 1), 100)
  OFFSET (greatest(p_page, 1) - 1) * least(greatest(p_page_size, 1), 100);
$$;

REVOKE ALL ON FUNCTION public.get_crm_leads_page(integer, integer, text, text, uuid, boolean, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_crm_leads_page(integer, integer, text, text, uuid, boolean, text, integer, text) TO authenticated;

-- Métricas agregadas: evita transferir eventos brutos para renderizar o dashboard.
CREATE OR REPLACE FUNCTION public.get_crm_analytics_summary(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH permitted AS (SELECT public.has_crm_role(ARRAY['manager', 'admin']) AS allowed),
  events AS (SELECT e.* FROM analytics_events e, permitted p WHERE p.allowed AND e.occurred_at >= now() - make_interval(days => greatest(p_days, 1))),
  totals AS (
    SELECT count(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view') AS visitors,
           count(*) FILTER (WHERE event_type = 'cta_click') AS cta_clicks,
           count(*) FILTER (WHERE event_type = 'lead_form_submit_success') AS conversions,
           count(*) FILTER (WHERE event_type = 'lead_form_submit_error') AS submit_errors
    FROM events
  )
  SELECT jsonb_build_object(
    'kpis', (SELECT to_jsonb(totals) FROM totals),
    'funnel', (SELECT coalesce(jsonb_agg(jsonb_build_object('event_type', event_type, 'visitors', visitors)), '[]'::jsonb) FROM (SELECT event_type, count(DISTINCT visitor_id) AS visitors FROM events GROUP BY event_type) f),
    'series', (SELECT coalesce(jsonb_agg(jsonb_build_object('date', day, 'visitors', visitors, 'cta_clicks', cta_clicks, 'conversions', conversions) ORDER BY day), '[]'::jsonb) FROM (SELECT date_trunc('day', occurred_at)::date AS day, count(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view') AS visitors, count(*) FILTER (WHERE event_type = 'cta_click') AS cta_clicks, count(*) FILTER (WHERE event_type = 'lead_form_submit_success') AS conversions FROM events GROUP BY 1) s)
  );
$$;

REVOKE ALL ON FUNCTION public.get_crm_analytics_summary(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_crm_analytics_summary(integer) TO authenticated;

COMMIT;
