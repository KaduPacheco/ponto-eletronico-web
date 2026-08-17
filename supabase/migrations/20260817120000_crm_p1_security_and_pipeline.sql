-- P1: secure intake, attribution, commercial pipeline and transactional audit.
-- Apply after 20260817100000_crm_base.sql in staging first.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Preserve historical values while moving the CRM to the Jornada funnel.
UPDATE public.leads SET pipeline_stage = 'contato' WHERE pipeline_stage = 'em_contato';
UPDATE public.leads SET pipeline_stage = 'diagnostico' WHERE pipeline_stage = 'qualificado';
UPDATE public.leads SET status = 'contato' WHERE status = 'em_contato';
UPDATE public.leads SET status = 'diagnostico' WHERE status = 'qualificado';

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_pipeline_stage_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_pipeline_stage_check
  CHECK (pipeline_stage IS NULL OR pipeline_stage IN ('novo', 'contato', 'diagnostico', 'demonstracao', 'proposta', 'negociacao', 'ganho', 'perdido'));

ALTER TABLE public.crm_user_roles DROP CONSTRAINT IF EXISTS crm_user_roles_role_check;
ALTER TABLE public.crm_user_roles ADD CONSTRAINT crm_user_roles_role_check CHECK (role IN ('agent', 'manager', 'admin'));

ALTER TABLE public.lead_events ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.lead_events ADD COLUMN IF NOT EXISTS previous_state jsonb;
ALTER TABLE public.lead_events ADD COLUMN IF NOT EXISTS next_state jsonb;

ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_lead_id ON public.analytics_events(lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_intake_requests_fingerprint_recent
  ON public.lead_intake_requests(request_fingerprint, created_at);

CREATE OR REPLACE FUNCTION public.has_crm_role(required_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_user_roles
    WHERE user_id = auth.uid() AND role = ANY(required_roles)
  ) AND EXISTS (
    SELECT 1 FROM public.crm_profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.create_lead_intake(
  p_idempotency_key text, p_request_fingerprint text, p_nome text, p_whatsapp text,
  p_email text, p_empresa text, p_funcionarios integer, p_visitor_id text,
  p_session_id text, p_page_url text, p_referrer text, p_utm_source text,
  p_utm_medium text, p_utm_campaign text, p_utm_content text, p_utm_term text
) RETURNS TABLE(lead_id uuid, created boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_existing public.lead_intake_requests%ROWTYPE;
  v_lead_id uuid;
BEGIN
  IF length(coalesce(p_idempotency_key, '')) < 16 OR length(p_idempotency_key) > 128 THEN
    RAISE EXCEPTION 'Invalid idempotency key';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_fingerprint, 0));
  SELECT * INTO v_existing FROM public.lead_intake_requests WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_fingerprint <> p_request_fingerprint THEN
      RAISE EXCEPTION 'Idempotency key reuse detected';
    END IF;
    RETURN QUERY SELECT v_existing.lead_id, false;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.lead_intake_requests
    WHERE request_fingerprint = p_request_fingerprint
      AND created_at > now() - interval '5 minutes'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;

  INSERT INTO public.leads(nome, whatsapp, email, empresa, funcionarios, origem, status, pipeline_stage)
  VALUES (p_nome, p_whatsapp, NULLIF(p_email, ''), NULLIF(p_empresa, ''), p_funcionarios, 'landing_page', 'novo', 'novo')
  RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_attribution(
    lead_id, visitor_id, session_id, page_url, referrer, utm_source, utm_medium,
    utm_campaign, utm_content, utm_term
  ) VALUES (
    v_lead_id, p_visitor_id, p_session_id, p_page_url, p_referrer, p_utm_source,
    p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term
  );

  INSERT INTO public.lead_intake_requests(idempotency_key, request_fingerprint, lead_id)
  VALUES (p_idempotency_key, p_request_fingerprint, v_lead_id);
  RETURN QUERY SELECT v_lead_id, true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_pipeline_stage(p_lead_id uuid, p_next_stage text)
RETURNS public.leads LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_before public.leads%ROWTYPE;
  v_after public.leads%ROWTYPE;
  v_closed_at timestamptz;
BEGIN
  IF NOT public.has_crm_role(ARRAY['agent','manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  IF p_next_stage NOT IN ('novo','contato','diagnostico','demonstracao','proposta','negociacao','ganho','perdido') THEN
    RAISE EXCEPTION 'Invalid pipeline stage';
  END IF;
  SELECT * INTO v_before FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF p_next_stage <> 'novo' AND v_before.owner_id IS NULL THEN RAISE EXCEPTION 'Owner required before advancing'; END IF;
  IF p_next_stage IN ('contato','diagnostico','demonstracao','proposta','negociacao')
    AND v_before.next_action_at IS NULL THEN RAISE EXCEPTION 'Next action required for open stage'; END IF;
  IF p_next_stage = 'perdido' AND nullif(trim(v_before.lost_reason), '') IS NULL THEN RAISE EXCEPTION 'Lost reason required'; END IF;
  IF p_next_stage = 'ganho' AND coalesce(v_before.lifetime_value, 0) <= 0 THEN RAISE EXCEPTION 'Lifetime value must be greater than zero'; END IF;
  v_closed_at := CASE WHEN p_next_stage IN ('ganho','perdido') THEN coalesce(v_before.closed_at, now()) ELSE NULL END;
  UPDATE public.leads SET pipeline_stage = p_next_stage, status = p_next_stage, closed_at = v_closed_at, updated_at = now()
  WHERE id = p_lead_id RETURNING * INTO v_after;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state)
  VALUES (p_lead_id, auth.uid(), 'pipeline_change', jsonb_build_object('previous_stage', v_before.pipeline_stage, 'next_stage', p_next_stage),
    jsonb_build_object('pipeline_stage', v_before.pipeline_stage, 'owner_id', v_before.owner_id, 'next_action_at', v_before.next_action_at),
    jsonb_build_object('pipeline_stage', v_after.pipeline_stage, 'owner_id', v_after.owner_id, 'next_action_at', v_after.next_action_at, 'closed_at', v_after.closed_at));
  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_owner(p_lead_id uuid, p_owner_id uuid)
RETURNS public.leads LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_before public.leads%ROWTYPE; v_after public.leads%ROWTYPE;
BEGIN
  IF NOT public.has_crm_role(ARRAY['agent','manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  IF p_owner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.crm_profiles WHERE id = p_owner_id AND is_active) THEN RAISE EXCEPTION 'Owner is not provisioned'; END IF;
  SELECT * INTO v_before FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  UPDATE public.leads SET owner_id = p_owner_id, updated_at = now() WHERE id = p_lead_id RETURNING * INTO v_after;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state)
  VALUES (p_lead_id, auth.uid(), 'owner_changed', jsonb_build_object('previous_owner_id', v_before.owner_id, 'next_owner_id', p_owner_id),
    jsonb_build_object('owner_id', v_before.owner_id), jsonb_build_object('owner_id', v_after.owner_id));
  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_lead_note_with_audit(p_lead_id uuid, p_content text)
RETURNS public.lead_notes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_note public.lead_notes%ROWTYPE;
BEGIN
  IF NOT public.has_crm_role(ARRAY['agent','manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  INSERT INTO public.lead_notes(lead_id, author_id, content) VALUES (p_lead_id, auth.uid(), p_content) RETURNING * INTO v_note;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state)
  VALUES (p_lead_id, auth.uid(), 'note_added', jsonb_build_object('content_preview', left(p_content, 80)), '{}'::jsonb, jsonb_build_object('note_id', v_note.id));
  RETURN v_note;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_lead_task_with_audit(p_lead_id uuid, p_title text, p_due_date timestamptz, p_assignee_id uuid)
RETURNS public.lead_tasks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_task public.lead_tasks%ROWTYPE;
BEGIN
  IF NOT public.has_crm_role(ARRAY['agent','manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.crm_profiles WHERE id = p_assignee_id AND is_active) THEN RAISE EXCEPTION 'Assignee is not provisioned'; END IF;
  INSERT INTO public.lead_tasks(lead_id, assignee_id, title, due_date) VALUES (p_lead_id, p_assignee_id, p_title, p_due_date) RETURNING * INTO v_task;
  UPDATE public.leads SET next_action_at = p_due_date, next_action_type = p_title, updated_at = now() WHERE id = p_lead_id;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state)
  VALUES (p_lead_id, auth.uid(), 'task_added', jsonb_build_object('title', p_title, 'due_date', p_due_date), '{}'::jsonb, jsonb_build_object('task_id', v_task.id));
  RETURN v_task;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_task_status_with_audit(p_task_id uuid, p_completed boolean)
RETURNS public.lead_tasks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_before public.lead_tasks%ROWTYPE; v_after public.lead_tasks%ROWTYPE;
BEGIN
  IF NOT public.has_crm_role(ARRAY['agent','manager','admin']) THEN RAISE EXCEPTION 'CRM access denied'; END IF;
  SELECT * INTO v_before FROM public.lead_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
  UPDATE public.lead_tasks SET completed = p_completed, updated_at = now() WHERE id = p_task_id RETURNING * INTO v_after;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state)
  VALUES (v_after.lead_id, auth.uid(), CASE WHEN p_completed THEN 'task_completed' ELSE 'task_reopened' END,
    jsonb_build_object('title', v_after.title), jsonb_build_object('completed', v_before.completed), jsonb_build_object('completed', v_after.completed));
  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION public.update_lead_pipeline_stage(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_lead_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_lead_note_with_audit(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_lead_task_with_audit(uuid, text, timestamptz, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_task_status_with_audit(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_lead_pipeline_stage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_lead_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_note_with_audit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_task_with_audit(uuid, text, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_task_status_with_audit(uuid, boolean) TO authenticated;

-- Direct table mutations are intentionally removed. CRM writes go through the
-- RPCs above so validation and audit are one transaction.
DROP POLICY IF EXISTS "crm operators manage leads" ON public.leads;
DROP POLICY IF EXISTS "crm operators manage notes" ON public.lead_notes;
DROP POLICY IF EXISTS "crm operators manage tasks" ON public.lead_tasks;
DROP POLICY IF EXISTS "crm operators insert events" ON public.lead_events;
CREATE POLICY "crm operators read leads" ON public.leads FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['agent','manager','admin']));
CREATE POLICY "crm operators read notes" ON public.lead_notes FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['agent','manager','admin']));
CREATE POLICY "crm operators read tasks" ON public.lead_tasks FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['agent','manager','admin']));

COMMIT;
