-- P1 corrective hardening: automatic outbox worker, PII-minimized audit,
-- intake abuse controls, analytics server intake and retention.
-- Forward-only. Apply to staging first.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.lead_outbox DROP CONSTRAINT IF EXISTS lead_outbox_status_check;
ALTER TABLE public.lead_outbox ADD CONSTRAINT lead_outbox_status_check
  CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'dead_letter'));
ALTER TABLE public.lead_outbox ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
ALTER TABLE public.lead_outbox ADD COLUMN IF NOT EXISTS claimed_by text;
ALTER TABLE public.lead_outbox ADD COLUMN IF NOT EXISTS dead_lettered_at timestamptz;
ALTER TABLE public.lead_outbox ADD COLUMN IF NOT EXISTS payload_redacted_at timestamptz;
ALTER TABLE public.lead_outbox ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_lead_outbox_claimable
  ON public.lead_outbox(next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_lead_outbox_retention
  ON public.lead_outbox(status, delivered_at, dead_lettered_at);

CREATE TABLE IF NOT EXISTS public.lead_intake_rate_limits (
  scope text NOT NULL,
  bucket_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, bucket_hash, window_start)
);
ALTER TABLE public.lead_intake_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_intake_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_lead_intake_rate_limit(
  p_scope text,
  p_bucket_hash text,
  p_limit integer,
  p_window_seconds integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF p_bucket_hash IS NULL OR length(p_bucket_hash) < 32 THEN
    RAISE EXCEPTION 'Invalid rate bucket';
  END IF;
  IF p_limit < 1 OR p_window_seconds < 60 THEN
    RAISE EXCEPTION 'Invalid rate policy';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  PERFORM pg_advisory_xact_lock(hashtextextended(p_scope || ':' || p_bucket_hash || ':' || v_window_start::text, 0));

  INSERT INTO public.lead_intake_rate_limits(scope, bucket_hash, window_start, request_count)
  VALUES (p_scope, p_bucket_hash, v_window_start, 1)
  ON CONFLICT (scope, bucket_hash, window_start)
  DO UPDATE SET request_count = public.lead_intake_rate_limits.request_count + 1, updated_at = now()
  RETURNING request_count INTO v_count;

  IF v_count > p_limit THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.create_lead_intake(text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text);

CREATE OR REPLACE FUNCTION public.create_lead_intake(
  p_idempotency_key text, p_request_fingerprint text, p_ip_bucket_hash text, p_phone_bucket_hash text,
  p_nome text, p_whatsapp text, p_email text, p_empresa text, p_funcionarios integer, p_visitor_id text,
  p_session_id text, p_page_url text, p_referrer text, p_utm_source text,
  p_utm_medium text, p_utm_campaign text, p_utm_content text, p_utm_term text
) RETURNS TABLE(lead_id uuid, created boolean, event_id text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_existing public.lead_intake_requests%ROWTYPE;
  v_lead_id uuid;
  v_event_id text;
BEGIN
  IF length(coalesce(p_idempotency_key, '')) < 16 OR length(p_idempotency_key) > 128 THEN
    RAISE EXCEPTION 'Invalid idempotency key';
  END IF;
  IF length(coalesce(p_request_fingerprint, '')) < 32 THEN
    RAISE EXCEPTION 'Invalid request fingerprint';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
  SELECT * INTO v_existing FROM public.lead_intake_requests WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_fingerprint <> p_request_fingerprint THEN
      RAISE EXCEPTION 'Idempotency key reuse detected';
    END IF;
    SELECT o.event_id INTO v_event_id
    FROM public.lead_outbox o
    WHERE o.lead_id = v_existing.lead_id
    ORDER BY o.created_at
    LIMIT 1;
    RETURN QUERY SELECT v_existing.lead_id, false, v_event_id;
    RETURN;
  END IF;

  PERFORM public.check_lead_intake_rate_limit('ip', p_ip_bucket_hash, 10, 300);
  PERFORM public.check_lead_intake_rate_limit('phone', p_phone_bucket_hash, 3, 1800);

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

  v_event_id := encode(gen_random_bytes(16), 'hex');
  INSERT INTO public.lead_outbox(event_id, lead_id, event_type, payload)
  VALUES (
    v_event_id,
    v_lead_id,
    'lead.created',
    jsonb_build_object(
      'lead_id', v_lead_id,
      'nome', p_nome,
      'whatsapp', p_whatsapp,
      'email', nullif(p_email, ''),
      'empresa', nullif(p_empresa, ''),
      'funcionarios', p_funcionarios,
      'attribution', jsonb_build_object(
        'visitor_id', p_visitor_id,
        'session_id', p_session_id,
        'page_url', p_page_url,
        'referrer', p_referrer,
        'utm_source', p_utm_source,
        'utm_medium', p_utm_medium,
        'utm_campaign', p_utm_campaign,
        'utm_content', p_utm_content,
        'utm_term', p_utm_term
      )
    )
  );

  RETURN QUERY SELECT v_lead_id, true, v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.lead_audit_state(p_lead public.leads)
RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'pipeline_stage', p_lead.pipeline_stage,
    'status', p_lead.status,
    'owner_id', p_lead.owner_id,
    'lifetime_value', p_lead.lifetime_value,
    'lost_reason', p_lead.lost_reason,
    'next_action_at', p_lead.next_action_at,
    'next_action_type', p_lead.next_action_type,
    'closed_at', p_lead.closed_at
  ));
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
  UPDATE public.leads
  SET pipeline_stage = 'ganho', status = 'ganho', lifetime_value = p_lifetime_value,
      lost_reason = NULL, closed_at = coalesce(closed_at, now()), updated_at = now()
  WHERE id = p_lead_id RETURNING * INTO after_state;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state)
  VALUES (
    p_lead_id,
    auth.uid(),
    'lead_won',
    jsonb_build_object('lifetime_value', p_lifetime_value),
    public.lead_audit_state(before_state),
    public.lead_audit_state(after_state)
  );
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
  UPDATE public.leads
  SET pipeline_stage = 'perdido', status = 'perdido', lost_reason = reason,
      closed_at = coalesce(closed_at, now()), updated_at = now()
  WHERE id = p_lead_id RETURNING * INTO after_state;
  INSERT INTO public.lead_events(lead_id, actor_id, event_type, payload, previous_state, next_state)
  VALUES (
    p_lead_id,
    auth.uid(),
    'lead_lost',
    jsonb_build_object('lost_reason', reason),
    public.lead_audit_state(before_state),
    public.lead_audit_state(after_state)
  );
  RETURN after_state;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_lead_outbox_batch(p_worker_id text, p_limit integer DEFAULT 10)
RETURNS TABLE(event_id text, event_type text, payload jsonb, attempts integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_limit < 1 OR p_limit > 50 THEN
    RAISE EXCEPTION 'Invalid outbox batch size';
  END IF;

  RETURN QUERY
  WITH claimed AS (
    SELECT o.id
    FROM public.lead_outbox o
    WHERE o.status IN ('pending', 'failed')
      AND o.next_attempt_at <= now()
    ORDER BY o.next_attempt_at, o.created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.lead_outbox o
  SET status = 'processing',
      claimed_at = now(),
      claimed_by = left(p_worker_id, 128),
      last_attempt_at = now(),
      updated_at = now()
  FROM claimed
  WHERE o.id = claimed.id
  RETURNING o.event_id, o.event_type, o.payload, o.attempts;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_lead_outbox_event(p_event_id text, p_worker_id text)
RETURNS TABLE(event_id text, event_type text, payload jsonb, attempts integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT o.id
    FROM public.lead_outbox o
    WHERE o.event_id = p_event_id
      AND o.status IN ('pending', 'failed')
      AND o.next_attempt_at <= now()
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.lead_outbox o
  SET status = 'processing',
      claimed_at = now(),
      claimed_by = left(p_worker_id, 128),
      last_attempt_at = now(),
      updated_at = now()
  FROM claimed
  WHERE o.id = claimed.id
  RETURNING o.event_id, o.event_type, o.payload, o.attempts;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_lead_outbox_delivered(p_event_id text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.lead_outbox
  SET status = 'delivered',
      delivered_at = now(),
      claimed_at = NULL,
      claimed_by = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE event_id = p_event_id
    AND status = 'processing';
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_lead_outbox_failed(
  p_event_id text,
  p_next_attempt_at timestamptz,
  p_max_attempts integer,
  p_error text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_attempts integer;
BEGIN
  UPDATE public.lead_outbox
  SET attempts = attempts + 1,
      last_error = left(coalesce(p_error, 'delivery failed'), 200),
      updated_at = now()
  WHERE event_id = p_event_id
    AND status = 'processing'
  RETURNING attempts INTO v_attempts;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.lead_outbox
  SET status = CASE WHEN v_attempts >= p_max_attempts THEN 'dead_letter' ELSE 'failed' END,
      next_attempt_at = CASE WHEN v_attempts >= p_max_attempts THEN next_attempt_at ELSE p_next_attempt_at END,
      dead_lettered_at = CASE WHEN v_attempts >= p_max_attempts THEN now() ELSE dead_lettered_at END,
      claimed_at = NULL,
      claimed_by = NULL,
      payload = CASE
        WHEN v_attempts >= p_max_attempts THEN jsonb_build_object('lead_id', payload->>'lead_id', 'event_type', event_type)
        ELSE payload
      END,
      payload_redacted_at = CASE WHEN v_attempts >= p_max_attempts THEN now() ELSE payload_redacted_at END,
      updated_at = now()
  WHERE event_id = p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_lead_outbox_retention(
  p_delivered_days integer DEFAULT 30,
  p_dead_letter_days integer DEFAULT 90
) RETURNS TABLE(delivered_deleted integer, dead_letters_minimized integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_delivered integer; v_dead integer;
BEGIN
  IF p_delivered_days < 7 OR p_dead_letter_days < 30 THEN
    RAISE EXCEPTION 'Retention window too short';
  END IF;

  DELETE FROM public.lead_outbox
  WHERE status = 'delivered'
    AND delivered_at < now() - make_interval(days => p_delivered_days);
  GET DIAGNOSTICS v_delivered = ROW_COUNT;

  UPDATE public.lead_outbox
  SET payload = jsonb_build_object('lead_id', payload->>'lead_id', 'event_type', event_type),
      payload_redacted_at = coalesce(payload_redacted_at, now()),
      updated_at = now()
  WHERE status = 'dead_letter'
    AND dead_lettered_at < now() - make_interval(days => p_dead_letter_days)
    AND payload_redacted_at IS NULL;
  GET DIAGNOSTICS v_dead = ROW_COUNT;

  RETURN QUERY SELECT v_delivered, v_dead;
END;
$$;

DROP POLICY IF EXISTS "anonymous insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "authenticated insert analytics" ON public.analytics_events;
REVOKE INSERT, UPDATE, DELETE ON public.analytics_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_analytics_event(
  p_event_type text,
  p_visitor_id text,
  p_session_id text,
  p_occurred_at timestamptz,
  p_page_path text,
  p_page_url text,
  p_referrer text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_content text,
  p_utm_term text,
  p_metadata jsonb,
  p_lead_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN
  IF p_event_type NOT IN ('page_view', 'cta_click', 'lead_form_start', 'lead_form_submit_attempt', 'lead_form_submit_success', 'lead_form_submit_error') THEN
    RAISE EXCEPTION 'Invalid analytics event';
  END IF;

  INSERT INTO public.analytics_events(
    event_type, visitor_id, session_id, occurred_at, page_path, page_url, referrer,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, metadata, lead_id
  )
  VALUES (
    p_event_type, p_visitor_id, p_session_id, coalesce(p_occurred_at, now()), p_page_path, p_page_url, p_referrer,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, coalesce(p_metadata, '{}'::jsonb), p_lead_id
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.check_lead_intake_rate_limit(text,text,integer,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lead_intake(text,text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lead_audit_state(public.leads) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_lead_outbox_batch(text,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_lead_outbox_event(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_lead_outbox_delivered(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_lead_outbox_failed(text,timestamptz,integer,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_lead_outbox_retention(integer,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_analytics_event(text,text,text,timestamptz,text,text,text,text,text,text,text,text,jsonb,uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_lead_intake(text,text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_lead_outbox_batch(text,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_lead_outbox_event(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_lead_outbox_delivered(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_lead_outbox_failed(text,timestamptz,integer,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_lead_outbox_retention(integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_analytics_event(text,text,text,timestamptz,text,text,text,text,text,text,text,text,jsonb,uuid) TO service_role;

COMMIT;
