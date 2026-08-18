-- P1 structural preparation for the staging outbox worker scheduler.
-- This migration installs dependencies and a Vault-backed invoker only.
-- It intentionally does not schedule a cron job, so local db reset performs no
-- external HTTP calls and staging does not start failing before Vault is ready.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;

CREATE OR REPLACE FUNCTION public.invoke_lead_outbox_worker_from_vault()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, vault, pg_temp
AS $$
DECLARE
  v_worker_url text;
  v_worker_token text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret
  INTO v_worker_url
  FROM vault.decrypted_secrets
  WHERE name = 'lead_outbox_worker_url'
  ORDER BY updated_at DESC
  LIMIT 1;

  SELECT decrypted_secret
  INTO v_worker_token
  FROM vault.decrypted_secrets
  WHERE name = 'lead_outbox_worker_token'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF nullif(trim(coalesce(v_worker_url, '')), '') IS NULL
     OR nullif(trim(coalesce(v_worker_token, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Missing lead outbox worker Vault configuration';
  END IF;

  SELECT net.http_post(
    url := v_worker_url,
    body := jsonb_build_object('source', 'pg_cron', 'triggered_at', now()),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_worker_token
    ),
    timeout_milliseconds := 5000
  )
  INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_lead_outbox_worker_from_vault() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invoke_lead_outbox_worker_from_vault() TO service_role;

COMMIT;
