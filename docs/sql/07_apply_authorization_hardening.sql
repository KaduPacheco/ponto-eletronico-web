-- CORRECAO PARA BANCOS JA IMPLANTADOS
-- Execute 00_crm_authorization.sql imediatamente antes deste script.
-- Este script remove as policies permissivas antigas e recria as restritivas.

BEGIN;

-- Remove qualquer policy anterior das tabelas protegidas, inclusive policies
-- com nomes divergentes dos scripts deste repositorio.
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('leads', 'lead_notes', 'lead_tasks', 'lead_events', 'analytics_events')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END;
$$;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for anonymous users"
ON public.leads FOR INSERT TO anon
WITH CHECK (origem = 'landing_page' AND status = 'novo');
CREATE POLICY "CRM operators can manage leads"
ON public.leads FOR ALL TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']))
WITH CHECK (public.has_crm_role(ARRAY['manager', 'admin']));

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM operators can manage lead notes"
ON public.lead_notes FOR ALL TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']))
WITH CHECK (public.has_crm_role(ARRAY['manager', 'admin']));

ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM operators can manage lead tasks"
ON public.lead_tasks FOR ALL TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']))
WITH CHECK (public.has_crm_role(ARRAY['manager', 'admin']));

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM operators can view lead events"
ON public.lead_events FOR SELECT TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']));
CREATE POLICY "CRM operators can insert lead events"
ON public.lead_events FOR INSERT TO authenticated
WITH CHECK (public.has_crm_role(ARRAY['manager', 'admin']));

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anonymous users can insert analytics events"
ON public.analytics_events FOR INSERT TO anon
WITH CHECK (true);
CREATE POLICY "Authenticated users can insert analytics events"
ON public.analytics_events FOR INSERT TO authenticated
WITH CHECK (true);
CREATE POLICY "CRM operators can view analytics events"
ON public.analytics_events FOR SELECT TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']));

COMMIT;
