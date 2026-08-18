-- P1 staging-only operational script.
-- Run only after these Vault secrets exist:
--   lead_outbox_worker_url
--   lead_outbox_worker_token
-- This script stores no literal URL or token in cron.job.

BEGIN;

DO $$
DECLARE
  v_url_count integer;
  v_token_count integer;
  v_existing_jobs integer;
  v_existing_jobid bigint;
BEGIN
  SELECT count(*) INTO v_url_count
  FROM vault.decrypted_secrets
  WHERE name = 'lead_outbox_worker_url'
    AND nullif(trim(decrypted_secret), '') IS NOT NULL;

  SELECT count(*) INTO v_token_count
  FROM vault.decrypted_secrets
  WHERE name = 'lead_outbox_worker_token'
    AND nullif(trim(decrypted_secret), '') IS NOT NULL;

  IF v_url_count <> 1 OR v_token_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one non-empty Vault secret for lead_outbox_worker_url and lead_outbox_worker_token';
  END IF;

  SELECT count(*), max(jobid)
  INTO v_existing_jobs, v_existing_jobid
  FROM cron.job
  WHERE jobname = 'crm_p1_lead_outbox_worker_every_minute';

  IF v_existing_jobs > 1 THEN
    RAISE EXCEPTION 'Duplicate crm_p1_lead_outbox_worker_every_minute jobs exist; resolve manually before activation';
  END IF;

  IF v_existing_jobs = 1 THEN
    PERFORM cron.unschedule(v_existing_jobid);
  END IF;

  PERFORM cron.schedule(
    'crm_p1_lead_outbox_worker_every_minute',
    '* * * * *',
    $cron$select public.invoke_lead_outbox_worker_from_vault();$cron$
  );
END;
$$;

COMMIT;
