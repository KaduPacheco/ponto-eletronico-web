# P1 — segurança e operação comercial

## Intake

A landing envia somente `nome`, `whatsapp`, `email`, `empresa`, `funcionarios` e `attribution` para `VITE_LEAD_INTAKE_URL`. O endpoint é a Edge Function `lead-intake`; o frontend não acessa `leads` nem conhece `service_role`.

O servidor rejeita campos desconhecidos, normaliza dados, valida limites, aplica idempotência por `Idempotency-Key` e rate limit por fingerprint. O n8n é acionado somente após a transação de persistência, usando `N8N_LEAD_AUTOMATION_URL`, `N8N_LEAD_AUTOMATION_SECRET`, assinatura HMAC e timeout de cinco segundos. Falha no n8n não duplica nem remove o lead persistido.

## Atribuição

`lead_attribution` relaciona visitor, sessão, UTMs, referrer e página de conversão ao lead. O evento de conversão recebe `lead_id` em `analytics_events`; nenhum campo de contato é enviado para analytics.

## Pipeline

O funil P1 é `novo → contato → diagnostico → demonstracao → proposta → negociacao → ganho/perdido`. A migração converte `em_contato` para `contato` e `qualificado` para `diagnostico` sem apagar dados. Avanços, ganho e perda são validados em RPC transacional no Postgres.

## Segurança de banco

Leads não têm INSERT anônimo. Usuários CRM precisam existir em `crm_user_roles` e em um `crm_profiles` ativo. As RPCs fixam `search_path`, restringem grants a `authenticated` e gravam alteração e auditoria na mesma transação.

## CSP por ambiente

O `vercel.json` permite conexão com Supabase hospedado (`*.supabase.co`, `*.supabase.in`) e WebSocket Supabase. Se um ambiente usar domínio customizado de API, ele deve ser adicionado ao `connect-src` antes da homologação. O domínio do intake é coberto pelo host Supabase ou deve ser incluído explicitamente.

## Homologação

1. Aplicar `20260817120000_crm_p1_security_and_pipeline.sql` em staging.
2. Configurar as variáveis server-side da Edge Function; não usar prefixo `VITE_`.
3. Testar submissão, replay da mesma chave, rate limit e indisponibilidade do n8n.
4. Validar RLS com usuário anônimo, usuário autenticado não provisionado e cada papel CRM.
5. Confirmar os headers no preview Vercel e executar a suíte E2E contra staging.
