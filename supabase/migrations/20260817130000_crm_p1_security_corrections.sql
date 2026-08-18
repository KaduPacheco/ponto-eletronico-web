-- Corrective migration for the P1 security review.
-- This migration is additive and must be applied after 20260817120000 in staging.
BEGIN;

-- The human CRM directory has exactly two roles in P1.
DELETE FROM public.crm_user_roles WHERE role = 'agent';
ALTER TABLE public.crm_user_roles DROP CONSTRAINT IF EXISTS crm_user_roles_role_check;
ALTER TABLE public.crm_user_roles ADD CONSTRAINT crm_user_roles_role_check
  CHECK (role IN ('manager', 'admin'));

CREATE OR REPLACE FUNCTION public.has_crm_role(required_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_user_roles r
    JOIN public.crm_profiles p ON p.id = r.user_id
    WHERE r.user_id = auth.uid() AND p.is_active AND r.role = ANY(required_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_crm_owner_profiles()
RETURNS TABLE(id uuid, full_name text, email text, role text, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT p.id, p.full_name, p.email, r.role, p.is_active
  FROM public.crm_profiles p
  JOIN public.crm_user_roles r ON r.user_id = p.id
  WHERE p.is_active AND r.role IN ('manager', 'admin')
    AND public.has_crm_role(ARRAY['manager', 'admin'])
  ORDER BY p.full_name NULLS LAST, p.email;
$$;

ALTER TABLE public.lead_events ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.lead_events ADD COLUMN IF NOT EXISTS previous_state jsonb;
ALTER TABLE public.lead_events ADD COLUMN IF NOT EXISTS next_state jsonb;

CREATE TABLE IF NOT EXISTS public.lead_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_outbox_pending
  ON public.lead_outbox(status, next_attempt_at) WHERE status IN ('pending', 'failed');
ALTER TABLE public.lead_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_outbox FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.create_lead_intake(text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text);

CREATE OR REPLACE FUNCTION public.create_lead_intake(
  p_idempotency_key text, p_request_fingerprint text, p_nome text, p_whatsapp text,
  p_email text, p_empresa text, p_funcionarios integer, p_visitor_id text,
  p_session_id text, p_page_url text, p_referrer text, p_utm_source text,
  p_utm_medium text, p_utm_campaign text, p_utm_content text, p_utm_term text
) RETURNS TABLE(lead_id uuid, created boolean, event_id text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_existing public.lead_intake_requests%ROWTYPE; v_lead_id uuid; v_event_id text;
BEGIN
  IF length(coalesce(p_idempotency_key, '')) < 16 OR length(p_idempotency_key) > 128 THEN RAISE EXCEPTION 'Invalid idempotency key'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_fingerprint, 0));
  SELECT * INTO v_existing FROM public.lead_intake_requests WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_fingerprint <> p_request_fingerprint THEN RAISE EXCEPTION 'Idempotency key reuse detected'; END IF;
    SELECT o.event_id INTO v_event_id FROM public.lead_outbox o WHERE o.lead_id = v_existing.lead_id ORDER BY o.created_at LIMIT 1;
    RETURN QUERY SELECT v_existing.lead_id, false, v_event_id; RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.lead_intake_requests WHERE request_fingerprint = p_request_fingerprint AND created_at > now() - interval '5 minutes') THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  INSERT INTO public.leads(nome, whatsapp, email, empresa, funcionarios, origem, status, pipeline_stage)
  VALUES (p_nome, p_whatsapp, NULLIF(p_email, ''), NULLIF(p_empresa, ''), p_funcionarios, 'landing_page', 'novo', 'novo')
  RETURNING id INTO v_lead_id;
  INSERT INTO public.lead_attribution(lead_id, visitor_id, session_id, page_url, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
  VALUES (v_lead_id, p_visitor_id, p_session_id, p_page_url, p_referrer, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term);
  INSERT INTO public.lead_intake_requests(idempotency_key, request_fingerprint, lead_id) VALUES (p_idempotency_key, p_request_fingerprint, v_lead_id);
  v_event_id := encode(gen_random_bytes(16), 'hex');
  INSERT INTO public.lead_outbox(event_id, lead_id, event_type, payload)
  VALUES (v_event_id, v_lead_id, 'lead.created', jsonb_build_object('lead_id', v_lead_id, 'nome', p_nome, 'whatsapp', p_whatsapp, 'email', nullif(p_email, ''), 'empresa', nullif(p_empresa, ''), 'funcionarios', p_funcionarios, 'attribution', jsonb_build_object('visitor_id', p_visitor_id, 'session_id', p_session_id, 'page_url', p_page_url, 'referrer', p_referrer, 'utm_source', p_utm_source, 'utm_medium', p_utm_medium, 'utm_campaign', p_utm_campaign, 'utm_content', p_utm_content, 'utm_term', p_utm_term)));
  RETURN QUERY SELECT v_lead_id, true, v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_lead_as_won(p_lead_id uuid, p_lifetime_value numeric)
RETURNS public.leads LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE before_state public.leads%ROWTYPE; after_state public.leads%ROWTYPE;
BEGIN
  IF NOT public.has_crm_role(ARRAY['manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  IF p_lifetime_value IS NULL OR p_lifetime_value <= 0 THEN RAISE EXCEPTION 'Lifetime value must be greater than zero'; END IF;
  SELECT * INTO before_state FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF before_state.owner_id IS NULL THEN RAISE EXCEPTION 'Owner required before closing'; END IF;
  UPDATE public.leads SET pipeline_stage = 'ganho', status = 'ganho', lifetime_value = p_lifetime_value, closed_at = coalesce(closed_at, now()), updated_at = now() WHERE id = p_lead_id RETURNING * INTO after_state;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state) VALUES (p_lead_id, auth.uid(), 'lead_won', jsonb_build_object('lifetime_value', p_lifetime_value), to_jsonb(before_state), to_jsonb(after_state));
  RETURN after_state;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_lead_as_lost(p_lead_id uuid, p_lost_reason text)
RETURNS public.leads LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE before_state public.leads%ROWTYPE; after_state public.leads%ROWTYPE; reason text;
BEGIN
  IF NOT public.has_crm_role(ARRAY['manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  reason := nullif(trim(p_lost_reason), '');
  IF reason IS NULL OR length(reason) > 500 THEN RAISE EXCEPTION 'Lost reason is required and must be at most 500 characters'; END IF;
  SELECT * INTO before_state FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF before_state.owner_id IS NULL THEN RAISE EXCEPTION 'Owner required before closing'; END IF;
  UPDATE public.leads SET pipeline_stage = 'perdido', status = 'perdido', lost_reason = reason, closed_at = coalesce(closed_at, now()), updated_at = now() WHERE id = p_lead_id RETURNING * INTO after_state;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state) VALUES (p_lead_id, auth.uid(), 'lead_lost', jsonb_build_object('lost_reason', reason), to_jsonb(before_state), to_jsonb(after_state));
  RETURN after_state;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_pipeline_stage(p_lead_id uuid, p_next_stage text)
RETURNS public.leads LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE before_state public.leads%ROWTYPE; after_state public.leads%ROWTYPE;
BEGIN
  IF NOT public.has_crm_role(ARRAY['manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  IF p_next_stage NOT IN ('novo','contato','diagnostico','demonstracao','proposta','negociacao') THEN RAISE EXCEPTION 'Use a close operation for terminal stages'; END IF;
  SELECT * INTO before_state FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF p_next_stage <> 'novo' AND before_state.owner_id IS NULL THEN RAISE EXCEPTION 'Owner required before advancing'; END IF;
  IF before_state.next_action_at IS NULL THEN RAISE EXCEPTION 'Next action required for open stage'; END IF;
  UPDATE public.leads SET pipeline_stage = p_next_stage, status = p_next_stage, closed_at = NULL, updated_at = now() WHERE id = p_lead_id RETURNING * INTO after_state;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state) VALUES (p_lead_id, auth.uid(), 'pipeline_change', jsonb_build_object('previous_stage', before_state.pipeline_stage, 'next_stage', p_next_stage), jsonb_build_object('pipeline_stage', before_state.pipeline_stage, 'closed_at', before_state.closed_at), jsonb_build_object('pipeline_stage', after_state.pipeline_stage, 'closed_at', after_state.closed_at));
  RETURN after_state;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_task_status_with_audit(p_task_id uuid, p_completed boolean)
RETURNS public.lead_tasks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE before_task public.lead_tasks%ROWTYPE; after_task public.lead_tasks%ROWTYPE; next_task public.lead_tasks%ROWTYPE;
BEGIN
  IF NOT public.has_crm_role(ARRAY['manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  SELECT * INTO before_task FROM public.lead_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
  UPDATE public.lead_tasks SET completed = p_completed, updated_at = now() WHERE id = p_task_id RETURNING * INTO after_task;
  SELECT * INTO next_task FROM public.lead_tasks WHERE lead_id = after_task.lead_id AND NOT completed ORDER BY due_date, created_at LIMIT 1;
  UPDATE public.leads SET next_action_at = next_task.due_date, next_action_type = next_task.title, updated_at = now() WHERE id = after_task.lead_id;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state) VALUES (after_task.lead_id, auth.uid(), CASE WHEN p_completed THEN 'task_completed' ELSE 'task_reopened' END, jsonb_build_object('task_id', p_task_id), jsonb_build_object('completed', before_task.completed), jsonb_build_object('completed', after_task.completed, 'next_action_at', next_task.due_date, 'next_action_type', next_task.title));
  RETURN after_task;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_lead_task_with_audit(p_lead_id uuid, p_title text, p_due_date timestamptz, p_assignee_id uuid)
RETURNS public.lead_tasks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE new_task public.lead_tasks%ROWTYPE; next_task public.lead_tasks%ROWTYPE;
BEGIN
  IF NOT public.has_crm_role(ARRAY['manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.crm_profiles p JOIN public.crm_user_roles r ON r.user_id = p.id WHERE p.id = p_assignee_id AND p.is_active AND r.role IN ('manager','admin')) THEN RAISE EXCEPTION 'Assignee is not provisioned'; END IF;
  INSERT INTO public.lead_tasks(lead_id, assignee_id, title, due_date) VALUES (p_lead_id, p_assignee_id, trim(p_title), p_due_date) RETURNING * INTO new_task;
  SELECT * INTO next_task FROM public.lead_tasks WHERE lead_id = p_lead_id AND NOT completed ORDER BY due_date, created_at LIMIT 1;
  UPDATE public.leads SET next_action_at = next_task.due_date, next_action_type = next_task.title, updated_at = now() WHERE id = p_lead_id;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state) VALUES (p_lead_id, auth.uid(), 'task_added', jsonb_build_object('task_id', new_task.id), '{}'::jsonb, jsonb_build_object('task_id', new_task.id, 'next_action_at', next_task.due_date, 'next_action_type', next_task.title));
  RETURN new_task;
END;
$$;

REVOKE ALL ON FUNCTION public.get_crm_owner_profiles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lead_intake(text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_owner_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_intake(text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.close_lead_as_won(uuid,numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.close_lead_as_lost(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_task_status_with_audit(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_lead_as_won(uuid,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_lead_as_lost(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_task_status_with_audit(uuid,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.update_lead_pipeline_stage(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_lead_pipeline_stage(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.create_lead_task_with_audit(uuid,text,timestamptz,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_lead_task_with_audit(uuid,text,timestamptz,uuid) TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.leads, public.lead_events, public.lead_notes, public.lead_tasks FROM anon, authenticated;
DROP POLICY IF EXISTS "crm operators read leads" ON public.leads;
DROP POLICY IF EXISTS "crm operators read notes" ON public.lead_notes;
DROP POLICY IF EXISTS "crm operators read tasks" ON public.lead_tasks;
CREATE POLICY "crm operators read leads" ON public.leads FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "crm operators read notes" ON public.lead_notes FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "crm operators read tasks" ON public.lead_tasks FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['manager','admin']));
COMMIT;
