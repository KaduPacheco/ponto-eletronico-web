-- BLINDAGEM DA TABELA LEADS (ETAPA 1 CRM)
-- Este script deve ser executado no SQL Editor do Supabase para garantir que 
-- o desenvolvimento do CRM não quebre a captura pública da Landing Page.

-- 1. Ativar Row Level Security (RLS) na tabela leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 2. BLOQUEIO DE SEGURANÇA: Remover permissões públicas de leitura
-- Garante que o role 'anon' (chave pública da LP) não consiga listar leads via API.
-- O Supabase por padrão bloqueia SELECT se não houver policy, mas é boa prática ser explícito.
DROP POLICY IF EXISTS "Public leads are viewable by everyone" ON leads;

-- 3. PERMISSÃO DE CAPTURA: Permitir apenas INSERT para usuários anônimos
-- A Landing Page precisa conseguir inserir leads sem estar logada.
CREATE POLICY "Enable insert for anonymous users" 
ON leads FOR INSERT 
TO anon 
WITH CHECK (origem = 'landing_page' AND status = 'novo');

-- 4. PERMISSÃO CRM: Permitir acesso total apenas para usuários autenticados (Admin)
-- Futuramente, os usuários do CRM deverão estar logados para ver os leads.
DROP POLICY IF EXISTS "Enable all access for authenticated users only" ON leads;
DROP POLICY IF EXISTS "CRM operators can manage leads" ON leads;
CREATE POLICY "CRM operators can manage leads"
ON leads FOR ALL
TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']))
WITH CHECK (public.has_crm_role(ARRAY['manager', 'admin']));

-- 5. ESTABILIDADE DE SCHEMA: Garantir retrocompatibilidade
-- Garante que colunas críticas tenham defaults, permitindo que o formulário antigo
-- continue funcionando mesmo sem enviar todos os campos que o CRM possa exigir no futuro.

-- Garantir que origem e status tenham valores padrão se não forem enviados
ALTER TABLE leads ALTER COLUMN origem SET DEFAULT 'landing_page';
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'novo';
ALTER TABLE leads ALTER COLUMN created_at SET DEFAULT now();

-- 15/05/2024: Qualquer campo NOVO adicionado para o CRM (ex: assigned_to, notes)
-- DEVE ser criado como NULLABLE para não quebrar o INSERT do formulário público.
