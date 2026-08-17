-- INFRAESTRUTURA DE ANALYTICS DA LANDING (ETAPA 9 CRM)
-- Registra eventos anonimos e autenticados para visitors, conversion e funil.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criar a tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'page_view',
      'cta_click',
      'lead_form_start',
      'lead_form_submit_attempt',
      'lead_form_submit_success',
      'lead_form_submit_error'
    )
  ),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  page_path TEXT NOT NULL,
  page_url TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Ativar Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSAO LANDING: usuarios anonimos podem inserir eventos
DROP POLICY IF EXISTS "Anonymous users can insert analytics events" ON analytics_events;
CREATE POLICY "Anonymous users can insert analytics events"
ON analytics_events FOR INSERT
TO anon
WITH CHECK (true);

-- 4. PERMISSAO APP: usuarios autenticados tambem podem inserir eventos
DROP POLICY IF EXISTS "Authenticated users can insert analytics events" ON analytics_events;
CREATE POLICY "Authenticated users can insert analytics events"
ON analytics_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. PERMISSAO CRM: usuarios autenticados podem consultar analytics
DROP POLICY IF EXISTS "Authenticated users can view analytics events" ON analytics_events;
CREATE POLICY "CRM operators can view analytics events"
ON analytics_events FOR SELECT
TO authenticated
USING (public.has_crm_role(ARRAY['manager', 'admin']));

-- 6. Indexes para funil, visitors e analise temporal
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON analytics_events(page_path);
