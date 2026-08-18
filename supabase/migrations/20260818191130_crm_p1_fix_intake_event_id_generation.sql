-- P1 runtime fix: avoid extension-schema dependent gen_random_bytes lookup.
BEGIN;

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

  v_event_id := replace(gen_random_uuid()::text, '-', '');
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

REVOKE ALL ON FUNCTION public.create_lead_intake(text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_intake(text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text) TO service_role;

COMMIT;
