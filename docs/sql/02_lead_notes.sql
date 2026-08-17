-- CRIAÇÃO DA TABELA DE NOTAS (ETAPA 6 CRM)
-- Permite registrar o histórico de interações com cada lead.

-- 1. Criar a tabela de notas
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ativar Row Level Security (RLS)
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSÃO CRM: Apenas usuários autenticados podem gerenciar notas
-- Diferente da tabela 'leads' que permite insert anônimo, 'notes' é 100% privada.
DROP POLICY IF EXISTS "Authenticated users can manage lead notes" ON lead_notes;
DROP POLICY IF EXISTS "CRM operators can manage lead notes" ON lead_notes;
CREATE POLICY "CRM operators can manage lead notes"
ON lead_notes FOR ALL
TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']))
WITH CHECK (public.has_crm_role(ARRAY['manager', 'admin']));

-- 4. Criar index para performance em buscas por lead
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
