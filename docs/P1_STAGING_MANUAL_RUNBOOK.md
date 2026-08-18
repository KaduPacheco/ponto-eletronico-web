# P1 staging manual runbook

Use this runbook only for staging homologation on branch `feat/crm-p1-secure-intake`.

Do not change Vercel Production, Supabase Production, or legacy Supabase projects. Do not send secret values in chat, commits, PR text, workflow JSON, screenshots, or public reports.

## Vercel Preview

Configure the PR #17 Preview environment with public browser variables only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or the current Supabase publishable key
- `VITE_LEAD_INTAKE_URL`
- `VITE_ANALYTICS_INTAKE_URL`

Never use a service-role key in any `VITE_*` variable.

Preview origin for CORS, without a trailing slash:

```text
https://captura-leeds-git-feat-crm-p1-bbf08e-admforteia-3739s-projects.vercel.app
```

## Edge Function Secrets

Configure these secrets only in the staging Supabase project:

- `PUBLIC_SITE_ORIGIN`
- `INTAKE_RATE_LIMIT_PEPPER`
- `N8N_LEAD_AUTOMATION_URL`
- `N8N_LEAD_AUTOMATION_SECRET`
- `LEAD_OUTBOX_WORKER_TOKEN`
- `LEAD_OUTBOX_BATCH_SIZE=10`
- `LEAD_OUTBOX_MAX_ATTEMPTS=8`
- `LEAD_OUTBOX_DELIVERY_TIMEOUT_MS=5000`

`N8N_LEAD_AUTOMATION_SECRET` must match the protected n8n staging variable. `LEAD_OUTBOX_WORKER_TOKEN` must match the Vault secret `lead_outbox_worker_token`.

Hosted Supabase Edge Functions normally receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically. If this staging project does not provide them automatically, configure them through the same staging-only secret channel without exposing values.

## n8n Staging Receiver

Import and activate `n8n/staging/lead-automation-receiver.json` in the staging n8n workspace. Follow `n8n/staging/README.md`.

The workflow must remain staging-only and must not contain WhatsApp, e-mail, CRM, or any other external communication node.

## Supabase Vault

Create exactly one non-empty Vault secret for each name:

- `lead_outbox_worker_url`: complete staging URL for the `lead-outbox-worker` Edge Function.
- `lead_outbox_worker_token`: the same bearer token configured as `LEAD_OUTBOX_WORKER_TOKEN`.

Use Dashboard Vault or SQL such as `vault.create_secret(...)`; never commit the values.

## Worker Cron Activation

After Vault is configured and the structural migration exists in staging, run:

```bash
npx supabase db query --linked --file supabase/snippets/activate_lead_outbox_worker_cron_staging.sql
```

The script creates one deterministic `pg_cron` job named `crm_p1_lead_outbox_worker_every_minute`, scheduled every minute, and stores no literal URL or token in `cron.job`.

## Required Evidence

Keep `P1 BLOQUEADO` until all items pass with redacted evidence:

- Preview variables are set only for PR #17 Preview.
- Edge Function secrets are present in staging.
- n8n receiver accepts valid HMAC, rejects bad HMAC, rejects expired/future timestamps, and enforces replay protection.
- Cron job invokes `lead-outbox-worker` automatically every minute from Vault-backed URL/token.
- Intake, analytics, CORS, outbox delivery, retry/dead-letter, and bundle secret scans pass end to end.
