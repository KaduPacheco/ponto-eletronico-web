-- RASTREABILIDADE E HISTÓRICO DE EVENTOS (ETAPA 8 CRM)
-- Registra logs imutáveis de ações relevantes para auditoria e inteligência comercial.

-- 1. Criar a tabela de eventos
CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ativar Row Level Security (RLS)
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSÃO CRM: Apenas usuários autenticados podem ver o histórico
DROP POLICY IF EXISTS "Authenticated users can view lead events" ON lead_events;
DROP POLICY IF EXISTS "CRM operators can view lead events" ON lead_events;
CREATE POLICY "CRM operators can view lead events"
ON lead_events FOR SELECT
TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']));

-- 4. PERMISSÃO CRM: Apenas usuários autenticados podem registrar eventos
DROP POLICY IF EXISTS "Authenticated users can insert lead events" ON lead_events;
DROP POLICY IF EXISTS "CRM operators can insert lead events" ON lead_events;
CREATE POLICY "CRM operators can insert lead events"
ON lead_events FOR INSERT
TO authenticated
WITH CHECK (public.has_crm_role(ARRAY['manager', 'admin']));

-- 5. Index para performance em ordenação cronológica por lead
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at);
