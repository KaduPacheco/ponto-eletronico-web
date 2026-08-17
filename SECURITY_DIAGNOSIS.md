# Diagnóstico de segurança — estado P1

O fluxo público de lead usa exclusivamente a Edge Function `lead-intake`. O frontend envia apenas campos permitidos, atribuição e uma chave de idempotência; não há INSERT direto em `leads` nem URL pública de n8n.

As proteções aplicadas são:

- validação e normalização server-side, rejeição de campos desconhecidos e limites de tamanho;
- rate limit e replay seguro em `create_lead_intake`;
- persistência do lead e atribuição em uma transação;
- n8n apenas server-side, com HMAC, timeout e falha desacoplada da persistência;
- RLS sem mutações diretas de CRM e RPCs transacionais com auditoria;
- pipeline com validações de owner, próxima ação, ganho e perda;
- CSP, HSTS, proteção contra clickjacking, `nosniff`, Referrer-Policy e Permissions-Policy no Vercel.

## Dependências de homologação

- Aplicar as migrações em staging, nunca diretamente em produção.
- Configurar `SUPABASE_SERVICE_ROLE_KEY`, `N8N_LEAD_AUTOMATION_URL` e `N8N_LEAD_AUTOMATION_SECRET` somente nas Edge Functions.
- Restringir `PUBLIC_SITE_ORIGIN` ao domínio real da landing.
- Validar RLS com usuário anônimo, autenticado não provisionado e cada papel CRM.
- Executar o fluxo E2E landing → intake → atribuição → CRM usando staging.

A chave Supabase `anon` pode aparecer no frontend por ser uma credencial pública limitada por RLS. `service_role` nunca deve aparecer em `VITE_*`, frontend, bundle, logs ou respostas.
