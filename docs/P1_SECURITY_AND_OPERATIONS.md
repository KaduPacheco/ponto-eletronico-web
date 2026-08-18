# P1 - seguranca e operacao comercial

## Intake de leads

A landing envia somente `nome`, `whatsapp`, `email`, `empresa`, `funcionarios` e `attribution` para `VITE_LEAD_INTAKE_URL`. O endpoint e a Edge Function `lead-intake`; o frontend nao acessa `leads`, `lead_outbox` nem conhece `service_role`, pepper, token interno ou segredo HMAC.

`lead-intake` aceita apenas `POST` com `application/json`, valida `Content-Length` e tambem le o corpo com limite real de 32 KB antes de chamar `JSON.parse`. Payload acima do limite retorna `413`. Origem CORS ausente ou proibida retorna `403`.

O servidor rejeita campos desconhecidos, normaliza dados, aplica idempotencia por `Idempotency-Key` e calcula buckets de rate limit separados para IP e telefone. O IP vem do `x-forwarded-for` recebido na Edge Function; a premissa operacional e que esse header seja definido pela plataforma Supabase/Vercel na borda e nao encaminhado cru de um proxy nao confiavel. O IP e o telefone sao armazenados apenas como hash com `INTAKE_RATE_LIMIT_PEPPER` server-side.

A repeticao idempotente e resolvida antes do rate limit, portanto replay legitimo da mesma chave nao consome novo bucket. O rate limit retorna `429` com `Retry-After`.

## Outbox e n8n

O lead e o evento `lead.created` entram na mesma transacao via `create_lead_intake`. A entrega imediata do intake e o worker usam o mesmo modulo `supabase/functions/_shared/lead-automation.ts`, que assina `timestamp.eventId.rawBody` com HMAC SHA-256 e preserva o `event_id` em todos os retries.

Estados da outbox: `pending`, `processing`, `delivered`, `failed` e `dead_letter`. O worker `lead-outbox-worker`:

- exige `Authorization: Bearer $LEAD_OUTBOX_WORKER_TOKEN`;
- chama `claim_lead_outbox_batch` com `FOR UPDATE SKIP LOCKED`;
- processa lote limitado por `LEAD_OUTBOX_BATCH_SIZE`;
- usa timeout de rede por `LEAD_OUTBOX_DELIVERY_TIMEOUT_MS`;
- marca sucesso com `mark_lead_outbox_delivered`;
- marca falha com backoff exponencial, jitter e maximo `LEAD_OUTBOX_MAX_ATTEMPTS`;
- minimiza payload ao mover para `dead_letter`.

Agendamento seguro em staging, exemplo:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/lead-outbox-worker" \
  -H "Authorization: Bearer $LEAD_OUTBOX_WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{}'
```

O agendamento automatico de staging deve usar `pg_cron`, `pg_net` e Supabase Vault conforme:

- `supabase/migrations/20260818193000_crm_p1_prepare_outbox_worker_cron.sql`
- `supabase/snippets/activate_lead_outbox_worker_cron_staging.sql`
- `docs/P1_STAGING_MANUAL_RUNBOOK.md`

A migration estrutural nao agenda o job e nao dispara chamada externa durante `supabase db reset`. O script operacional so deve ser executado em staging depois que o Vault possuir `lead_outbox_worker_url` e `lead_outbox_worker_token`.

## Analytics

O frontend envia analytics somente para `VITE_ANALYTICS_INTAKE_URL` (`analytics-intake`). Inserts anonimos diretos em `analytics_events` sao revogados. A Edge Function aceita apenas eventos conhecidos, metadata por allowlist, tamanho limitado e sem PII obvia como email ou telefone.

Eventos preservados para o funil comercial:

- `page_view`
- `cta_click`
- `lead_form_start`
- `lead_form_submit_attempt`
- `lead_form_submit_success`
- `lead_form_submit_error`

## Auditoria e LGPD

`lead_events.previous_state` e `next_state` nao devem duplicar linha completa de `leads`. A funcao `lead_audit_state` mantem apenas campos operacionais necessarios: etapa, status, responsavel, valor, motivo, proxima acao e datas de fechamento/acao.

Outbox entregue pode ser removida pela rotina `cleanup_lead_outbox_retention`. A janela minima protegida na RPC e 7 dias para `delivered` e 30 dias para `dead_letter`; a configuracao recomendada e 30 dias para entregues e 90 dias para dead letters. A rotina nunca apaga `pending` ou `failed`; dead letters antigas sao minimizadas para investigacao sem payload pessoal completo.

## Banco e RLS

Leads, tarefas, eventos, perfis e analytics nao aceitam mutacao direta de `anon`. Usuarios CRM precisam existir em `crm_user_roles` e `crm_profiles.is_active = true`. RPCs usam `SECURITY DEFINER` com `search_path = public, pg_temp` e grants restritos.

Antes de aplicar em staging, rode o preflight:

```sql
select count(*) as agent_roles_to_remove
from public.crm_user_roles
where role = 'agent';
```

Depois aplique as migracoes em ordem, incluindo `20260818110000_crm_p1_secure_automation_retention_analytics.sql`.

## Variaveis server-side

- `PUBLIC_SITE_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTAKE_RATE_LIMIT_PEPPER`
- `N8N_LEAD_AUTOMATION_URL`
- `N8N_LEAD_AUTOMATION_SECRET`
- `LEAD_OUTBOX_WORKER_TOKEN`
- `LEAD_OUTBOX_BATCH_SIZE`
- `LEAD_OUTBOX_MAX_ATTEMPTS`
- `LEAD_OUTBOX_DELIVERY_TIMEOUT_MS`

Nenhuma dessas variaveis deve receber prefixo `VITE_`, exceto URLs publicas de chamada do frontend: `VITE_LEAD_INTAKE_URL` e `VITE_ANALYTICS_INTAKE_URL`.
