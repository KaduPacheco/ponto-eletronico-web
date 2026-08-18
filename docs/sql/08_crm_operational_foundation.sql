-- FUNDAÇÃO OPERACIONAL DO CRM (ETAPA 2)
-- Execute depois dos scripts 01 a 04. O script é idempotente e não apaga dados.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Diretório comercial: substitui a descoberta de responsáveis a partir dos próprios leads.
CREATE TABLE IF NOT EXISTS crm_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE crm_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read CRM profiles" ON crm_profiles;
CREATE POLICY "Authenticated users can read CRM profiles"
ON crm_profiles FOR SELECT TO authenticated USING (true);

-- O provisionamento inicial é automático; a definição de função/cargo fica restrita ao SQL Editor
-- até existir uma tela administrativa protegida por RLS de papéis.
CREATE OR REPLACE FUNCTION public.handle_new_crm_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.crm_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_crm_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_crm_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_crm_profile();

INSERT INTO public.crm_profiles (id, full_name, email)
SELECT id, COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', email), email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Contrato operacional da carteira.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_pipeline_stage_check;
ALTER TABLE leads ADD CONSTRAINT leads_pipeline_stage_check CHECK (
  pipeline_stage IS NULL OR pipeline_stage IN ('novo', 'em_contato', 'qualificado', 'ganho', 'perdido')
);

CREATE INDEX IF NOT EXISTS idx_leads_owner_next_action ON leads(owner_id, next_action_at) WHERE closed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_sla_due_at ON leads(sla_due_at) WHERE closed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_duplicate_of ON leads(duplicate_of) WHERE duplicate_of IS NOT NULL;

-- O primeiro atendimento deve acontecer em até 24h. A política pode ser ajustada depois
-- sem alterar o frontend, mudando apenas esta função.
CREATE OR REPLACE FUNCTION public.apply_lead_operational_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.pipeline_stage := COALESCE(NEW.pipeline_stage, NULLIF(NEW.status, ''), 'novo');

  IF TG_OP = 'INSERT' AND NEW.sla_due_at IS NULL THEN
    NEW.sla_due_at := COALESCE(NEW.created_at, now()) + interval '24 hours';
  END IF;

  IF NEW.pipeline_stage IN ('em_contato', 'qualificado')
    AND (TG_OP = 'INSERT' OR NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage)
    AND NEW.owner_id IS NULL THEN
    RAISE EXCEPTION 'Defina um responsável antes de avançar o lead para %.', NEW.pipeline_stage;
  END IF;

  IF NEW.pipeline_stage = 'qualificado'
    AND (TG_OP = 'INSERT' OR NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage)
    AND NEW.next_action_at IS NULL THEN
    RAISE EXCEPTION 'Defina uma próxima ação antes de qualificar o lead.';
  END IF;

  IF NEW.pipeline_stage IN ('ganho', 'perdido') THEN
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  ELSE
    NEW.closed_at := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_operational_rules ON leads;
CREATE TRIGGER leads_operational_rules
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION public.apply_lead_operational_rules();

-- Mantém próxima ação e último contato consistentes a partir das tarefas.
CREATE OR REPLACE FUNCTION public.sync_lead_next_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_lead_id UUID := COALESCE(NEW.lead_id, OLD.lead_id);
  next_task RECORD;
BEGIN
  SELECT due_date, title INTO next_task
  FROM lead_tasks
  WHERE lead_id = target_lead_id AND completed = false
  ORDER BY due_date ASC
  LIMIT 1;

  UPDATE leads
  SET next_action_at = next_task.due_date,
      next_action_type = next_task.title,
      last_interaction_at = now()
  WHERE id = target_lead_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS lead_tasks_sync_next_action ON lead_tasks;
CREATE TRIGGER lead_tasks_sync_next_action
AFTER INSERT OR UPDATE OR DELETE ON lead_tasks
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_next_action();

-- Marca novas submissões repetidas sem perder o histórico nem bloquear a landing.
CREATE OR REPLACE FUNCTION public.mark_duplicate_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  canonical_lead_id UUID;
BEGIN
  IF NEW.duplicate_of IS NOT NULL OR COALESCE(trim(NEW.whatsapp), '') = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO canonical_lead_id
  FROM leads
  WHERE id <> NEW.id
    AND regexp_replace(COALESCE(whatsapp, ''), '\\D', '', 'g') = regexp_replace(NEW.whatsapp, '\\D', '', 'g')
    AND duplicate_of IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF canonical_lead_id IS NOT NULL THEN
    NEW.duplicate_of := canonical_lead_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_mark_duplicate ON leads;
CREATE TRIGGER leads_mark_duplicate
BEFORE INSERT ON leads
FOR EACH ROW EXECUTE FUNCTION public.mark_duplicate_lead();
