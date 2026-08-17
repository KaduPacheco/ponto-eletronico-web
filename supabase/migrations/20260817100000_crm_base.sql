-- CRM base schema — idempotent and safe for an empty project or an existing one.
-- Apply to staging first. This migration never disables RLS and never grants
-- authenticated users broad CRM access.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  empresa text,
  funcionarios integer,
  origem text NOT NULL DEFAULT 'landing_page',
  status text NOT NULL DEFAULT 'novo',
  pipeline_stage text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lifetime_value numeric(14,2),
  next_action_at timestamptz,
  next_action_type text,
  sla_due_at timestamptz,
  closed_at timestamptz,
  lost_reason text,
  duplicate_of uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pipeline_stage text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS empresa text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS funcionarios integer;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS origem text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lifetime_value numeric(14,2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action_type text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS duplicate_of uuid REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lifetime_value numeric(14,2);
ALTER TABLE public.leads ALTER COLUMN origem SET DEFAULT 'landing_page';
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'novo';
ALTER TABLE public.leads ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.leads ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_pipeline_stage_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_pipeline_stage_check CHECK (pipeline_stage IS NULL OR pipeline_stage IN ('novo', 'em_contato', 'qualificado', 'ganho', 'perdido'));

CREATE TABLE IF NOT EXISTS public.crm_user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('manager', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_profiles' AND column_name = 'role') THEN
    EXECUTE 'INSERT INTO public.crm_user_roles(user_id, role) SELECT id, role FROM public.crm_profiles WHERE role IN (''manager'', ''admin'') ON CONFLICT (user_id) DO NOTHING';
  END IF;
END $$;
ALTER TABLE public.crm_profiles DROP COLUMN IF EXISTS role;

CREATE TABLE IF NOT EXISTS public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assignee_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  due_date timestamptz NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'cta_click', 'lead_form_start', 'lead_form_submit_attempt', 'lead_form_submit_success', 'lead_form_submit_error')),
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  page_path text NOT NULL,
  page_url text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.lead_attribution (
  lead_id uuid PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  page_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_intake_requests (
  idempotency_key text PRIMARY KEY,
  request_fingerprint text NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.has_crm_role(required_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.crm_user_roles WHERE user_id = auth.uid() AND role = ANY(required_roles));
$$;

CREATE OR REPLACE FUNCTION public.get_my_crm_access()
RETURNS TABLE(role text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.crm_user_roles WHERE user_id = auth.uid();
$$;

-- Administrative procedure. Run only through the SQL editor or a service-role job.
CREATE OR REPLACE FUNCTION public.provision_crm_user(p_user_id uuid, p_role text, p_full_name text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text;
BEGIN
  IF p_role NOT IN ('manager', 'admin') THEN RAISE EXCEPTION 'Invalid CRM role'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Auth user not found'; END IF;
  INSERT INTO public.crm_user_roles(user_id, role) VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now();
  INSERT INTO public.crm_profiles(id, full_name, email, is_active) VALUES (p_user_id, p_full_name, v_email, true)
  ON CONFLICT (id) DO UPDATE SET full_name = COALESCE(EXCLUDED.full_name, public.crm_profiles.full_name), email = EXCLUDED.email, is_active = true, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_crm_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.crm_user_roles WHERE user_id = p_user_id;
  UPDATE public.crm_profiles SET is_active = false, updated_at = now() WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_lead_intake(
  p_idempotency_key text, p_request_fingerprint text, p_nome text, p_whatsapp text, p_email text, p_empresa text, p_funcionarios integer,
  p_visitor_id text, p_session_id text, p_page_url text, p_referrer text, p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_content text, p_utm_term text
) RETURNS TABLE(lead_id uuid, created boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lead_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.lead_intake_requests WHERE idempotency_key = p_idempotency_key) THEN
    RETURN QUERY SELECT lead_id, false FROM public.lead_intake_requests WHERE idempotency_key = p_idempotency_key;
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.lead_intake_requests WHERE request_fingerprint = p_request_fingerprint AND created_at > now() - interval '5 minutes') THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  INSERT INTO public.leads(nome, whatsapp, email, empresa, funcionarios, origem, status) VALUES (p_nome, p_whatsapp, NULLIF(p_email, ''), NULLIF(p_empresa, ''), p_funcionarios, 'landing_page', 'novo') RETURNING id INTO v_lead_id;
  INSERT INTO public.lead_attribution(lead_id, visitor_id, session_id, page_url, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term) VALUES (v_lead_id, p_visitor_id, p_session_id, p_page_url, p_referrer, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term);
  INSERT INTO public.lead_intake_requests(idempotency_key, request_fingerprint, lead_id) VALUES (p_idempotency_key, p_request_fingerprint, v_lead_id);
  RETURN QUERY SELECT v_lead_id, true;
END;
$$;

REVOKE ALL ON FUNCTION public.has_crm_role(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_crm_access() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_crm_user(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_crm_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_lead_intake(text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_crm_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_crm_access() TO authenticated;

-- One policy reset makes the migration safe across old policy names.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('leads','crm_user_roles','crm_profiles','lead_notes','lead_tasks','lead_events','analytics_events','lead_attribution','lead_intake_requests') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_intake_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm operators manage leads" ON public.leads FOR ALL TO authenticated USING (public.has_crm_role(ARRAY['manager','admin'])) WITH CHECK (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "crm operators read profiles" ON public.crm_profiles FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "crm operators manage notes" ON public.lead_notes FOR ALL TO authenticated USING (public.has_crm_role(ARRAY['manager','admin'])) WITH CHECK (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "crm operators manage tasks" ON public.lead_tasks FOR ALL TO authenticated USING (public.has_crm_role(ARRAY['manager','admin'])) WITH CHECK (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "crm operators read events" ON public.lead_events FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "crm operators insert events" ON public.lead_events FOR INSERT TO authenticated WITH CHECK (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "anonymous insert analytics" ON public.analytics_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated insert analytics" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm operators read analytics" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['manager','admin']));
CREATE POLICY "crm operators read attribution" ON public.lead_attribution FOR SELECT TO authenticated USING (public.has_crm_role(ARRAY['manager','admin']));

CREATE INDEX IF NOT EXISTS idx_leads_stage_created_at ON public.leads(pipeline_stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_owner_next_action ON public.leads(owner_id, next_action_at) WHERE closed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source_created_at ON public.leads(origem, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_open_due ON public.lead_tasks(lead_id, due_date) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_created_at ON public.lead_events(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON public.analytics_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_attribution_campaign ON public.lead_attribution(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_lead_attribution_visitor_session ON public.lead_attribution(visitor_id, session_id);

COMMIT;
