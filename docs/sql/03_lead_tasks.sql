-- GESTÃO DE TAREFAS E FOLLOW-UPS (ETAPA 7 CRM)
-- Permite agendar compromissos vinculados a leads.

-- 1. Criar a tabela de tarefas
CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ativar Row Level Security (RLS)
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSÃO CRM: Apenas usuários autenticados podem gerenciar tarefas
DROP POLICY IF EXISTS "Authenticated users can manage lead tasks" ON lead_tasks;
DROP POLICY IF EXISTS "CRM operators can manage lead tasks" ON lead_tasks;
CREATE POLICY "CRM operators can manage lead tasks"
ON lead_tasks FOR ALL
TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']))
WITH CHECK (public.has_crm_role(ARRAY['manager', 'admin']));

-- 4. Index para performance em listagem por lead e filtro de vencimento
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON lead_tasks(due_date);
