-- P1 grant hardening after staging migration apply.
-- Forward-only: does not rewrite earlier migration history.
BEGIN;

REVOKE ALL PRIVILEGES ON TABLE
  public.leads,
  public.crm_user_roles,
  public.crm_profiles,
  public.lead_notes,
  public.lead_tasks,
  public.lead_events,
  public.analytics_events,
  public.lead_attribution,
  public.lead_intake_requests,
  public.lead_outbox,
  public.lead_intake_rate_limits
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.leads,
  public.crm_profiles,
  public.lead_notes,
  public.lead_tasks,
  public.lead_events,
  public.analytics_events,
  public.lead_attribution
TO authenticated;

REVOKE ALL ON FUNCTION public.has_crm_role(text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_crm_access() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_crm_owner_profiles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.provision_crm_user(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_crm_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_lead_pipeline_stage(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_lead_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lead_note_with_audit(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lead_task_with_audit(uuid, text, timestamptz, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_task_status_with_audit(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_lead_as_won(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_lead_as_lost(uuid, text) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.check_lead_intake_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lead_intake(text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_analytics_event(text, text, text, timestamptz, text, text, text, text, text, text, text, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_lead_outbox_batch(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_lead_outbox_event(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_lead_outbox_delivered(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_lead_outbox_failed(text, timestamptz, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_lead_outbox_retention(integer, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_crm_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_crm_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_owner_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_lead_pipeline_stage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_lead_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_note_with_audit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_task_with_audit(uuid, text, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_task_status_with_audit(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_lead_as_won(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_lead_as_lost(uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.provision_crm_user(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_crm_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_lead_intake_rate_limit(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_lead_intake(text, text, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_analytics_event(text, text, text, timestamptz, text, text, text, text, text, text, text, text, jsonb, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_lead_outbox_batch(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_lead_outbox_event(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_lead_outbox_delivered(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_lead_outbox_failed(text, timestamptz, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_lead_outbox_retention(integer, integer) TO service_role;

DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
  END IF;
END $$;

COMMIT;
