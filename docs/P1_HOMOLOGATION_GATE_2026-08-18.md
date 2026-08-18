# P1 homologation gate - 2026-08-18

Status: P1 BLOQUEADO

## Scope

This report covers only the P1 security homologation gate for branch `feat/crm-p1-secure-intake`. P2 was not implemented or started.

## Confirmed Evidence

- Current baseline commit before this resumption: `5ad93ad`.
- Six local migrations were previously validated from an empty database with `npx supabase db reset`.
- Staging Edge Functions were previously published: `lead-intake`, `analytics-intake`, and `lead-outbox-worker`.
- PR #17 has an active Vercel Preview.
- The Preview origin for CORS is documented in `docs/P1_STAGING_MANUAL_RUNBOOK.md`.
- Direct anonymous writes to protected CRM and analytics surfaces were previously denied.
- The remote transactional intake RPC smoke with synthetic data previously passed.
- The outbox claim, failure, dead-letter, and payload redaction path previously passed with synthetic data.
- Local validation after the published P1 corrections previously passed: lint, tests, typecheck, build, diff check, and focused bundle secret scan.

## New Versioned Artifacts

- `n8n/staging/lead-automation-receiver.json`: importable staging-only receiver with `POST` webhook, Raw Body enabled, HMAC-SHA256 validation over `timestamp.eventId.rawBody`, 300-second maximum age, future timestamp rejection, timing-safe signature comparison, persistent replay protection, and no external effect nodes.
- `n8n/staging/README.md`: import, activation, and staging smoke-test instructions for the n8n receiver.
- `supabase/migrations/20260818193000_crm_p1_prepare_outbox_worker_cron.sql`: forward-only structural migration for `pg_cron`, `pg_net`, Supabase Vault, and a Vault-backed worker invoker. It does not schedule a job and performs no external calls during local reset.
- `supabase/snippets/activate_lead_outbox_worker_cron_staging.sql`: staging-only operational script that validates Vault secret presence, prevents duplicate deterministic jobs, and schedules the worker every minute after manual secret setup.
- `docs/P1_STAGING_MANUAL_RUNBOOK.md`: exact staging-only setup steps for Vercel Preview, Edge Function secrets, n8n, Vault, and cron activation.

## Local Validation - This Resumption

- `npx supabase db reset`: PASS with all seven local migrations. The new structural cron/Vault migration applied from empty and did not schedule a job.
- `npx vitest run supabase/tests/n8n_lead_receiver_contract.test.ts`: PASS, 10/10 tests.
- `npx vitest run supabase/tests/lead_outbox_worker_cron_contract.test.ts supabase/tests/crm_p1_security_contract.test.ts`: PASS, 10/10 tests.
- `npm run lint`: PASS.
- `npm test -- --run`: PASS, 24 test files and 101 tests. First sandboxed attempt hit local esbuild `spawn EPERM`; elevated rerun passed.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS, with only Git LF-to-CRLF working-copy warnings for edited docs.
- Focused artifact and bundle scans: PASS for literal private URLs, project refs, bearer tokens, Supabase secret-key patterns, and committed secret values. Matches for secret variable names are expected documentation/configuration names, not values.

## Required Manual Configuration

The CLI available to this session does not expose secret management. No secret values were requested, printed, or committed.

Configure only in staging:

- Vercel Preview public env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` or publishable key, `VITE_LEAD_INTAKE_URL`, `VITE_ANALYTICS_INTAKE_URL`.
- Edge Function secrets: `PUBLIC_SITE_ORIGIN`, `INTAKE_RATE_LIMIT_PEPPER`, `N8N_LEAD_AUTOMATION_URL`, `N8N_LEAD_AUTOMATION_SECRET`, `LEAD_OUTBOX_WORKER_TOKEN`, `LEAD_OUTBOX_BATCH_SIZE=10`, `LEAD_OUTBOX_MAX_ATTEMPTS=8`, `LEAD_OUTBOX_DELIVERY_TIMEOUT_MS=5000`.
- Vault secrets: `lead_outbox_worker_url`, `lead_outbox_worker_token`.

`N8N_LEAD_AUTOMATION_SECRET` must match between n8n and Edge Functions. `LEAD_OUTBOX_WORKER_TOKEN` must match between Edge Functions and Vault.

## Current Blockers

- Edge Function secrets still require manual staging configuration through an authorized secret-management channel.
- The staging n8n receiver must be imported, configured with the protected shared secret, activated, and tested with real signed requests.
- The Vault-backed `pg_cron` job must be activated only after Vault contains the worker URL and token.
- A real end-to-end staging pass is still required for CORS, intake, analytics, outbox worker delivery, HMAC validity, expiration, replay, retry, dead-letter, and bundle/secret evidence.

## Result

P1 BLOQUEADO

Required action to proceed: complete the manual staging configuration in `docs/P1_STAGING_MANUAL_RUNBOOK.md`, activate the staging n8n receiver and Vault-backed cron job, then rerun the P1 E2E homologation gate with redacted evidence.
