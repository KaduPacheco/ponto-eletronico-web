# P1 homologation gate - 2026-08-18

Status: BLOCKED

## Scope

This report covers only the P1 security homologation gate for branch `feat/crm-p1-secure-intake`.
P2 was not implemented or started.

## Preflight

- Timestamp: 2026-08-18 10:07:56 -03:00
- Commit tested locally: `2d12bf6`
- Branch: `feat/crm-p1-secure-intake`
- `git status -sb`: clean against `origin/feat/crm-p1-secure-intake`
- `git log -5 --oneline`:
  - `2d12bf6 feat(crm): route analytics through intake`
  - `6c99baf feat(crm): secure p1 intake automation`
  - `be97424 fix(crm): alinhar testes ao funil P1`
  - `407fec1 fix(crm): corrigir bloqueios de seguranca do P1`
  - `63b57bf feat(crm): implementa intake seguro e funil P1`
- `git diff --check`: PASS
- Applicable `AGENTS.md`: none in repository scope. The only file found was under `node_modules/recharts`.

## Resumption Preflight - New Staging Target

- Timestamp: 2026-08-18, resumed after commit `dd13cfe`.
- Requested target: organization and project names redacted in public report.
- `git status --short --branch`: clean against `origin/feat/crm-p1-secure-intake`.
- `git branch --show-current`: `feat/crm-p1-secure-intake`.
- `git log -5 --oneline`: current head is `dd13cfe`.
- `git fetch --all --prune`: PASS.
- Upstream: `origin/feat/crm-p1-secure-intake`.
- PR #17: open, draft, head `dd13cfe`.
- Local Supabase link: still points to the previous project and must not be used for mutations.
- Supabase MCP: scoped to a single project and does not expose a project selector or organization/project listing.
- Supabase CLI via `npx`: available for read-only discovery; listed accessible projects did not include the requested new staging organization/project.
- Decision: BLOCKED before any mutation because the requested staging project could not be objectively selected or proven from available access.

## Resumption Preflight - Confirmed New Staging CLI Session

- Timestamp: 2026-08-18 15:13:22 -03:00.
- Starting commit: `6d6d6ed`.
- Branch: `feat/crm-p1-secure-intake`.
- Initial `git status --short --branch`: clean against `origin/feat/crm-p1-secure-intake`.
- `npx supabase projects list`: PASS. The default CLI session listed exactly one project, `CaptacaoLeeds Staging`, ref `sxfpjiejppprumwuotvc`, linked `true`.
- Local Supabase link: PASS. `supabase/.temp/linked-project.json` points to `CaptacaoLeeds Staging`, ref `sxfpjiejppprumwuotvc`.
- `npx supabase migration list --linked`: PASS. Four local migrations were listed and every remote migration field was empty.
- CLI ignored-file warning: RESOLVED. `supabase/migrations/crm_p1_security_contract.test.ts` was confirmed to be a Vitest TypeScript contract test and moved to `supabase/tests/crm_p1_security_contract.test.ts`; it was not converted to SQL.
- Affected test: PASS. `npx vitest run supabase/tests/crm_p1_security_contract.test.ts` passed 4/4 tests.
- Re-run `npx supabase migration list --linked`: PASS. The four SQL migrations were listed with an empty remote history and no ignored TypeScript test warning.

## Public Traffic Preflight - Confirmed New Staging CLI Session

- `npx supabase functions list --output json`: PASS. No Edge Functions are currently deployed.
- `npx supabase db query "select count(*)::int as auth_users from auth.users;" --linked --output json`: PASS. `auth_users = 0`.
- `npx supabase db query` against `pg_stat_user_tables`: PASS for app-specific traffic. There were no public application tables yet and no user/auth/storage object data; only Supabase-managed internal schema migration rows were present.
- Decision: PASS for proceeding to local validation only. No public traffic or user data evidence was observed in the newly linked staging project.

## Local Empty-Database Validation - Confirmed New Staging CLI Session

- `npx supabase db reset`: BLOCKED before any local migration execution. Docker Desktop engine was unavailable: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`.
- `docker version`: BLOCKED. Docker client is installed, but the `desktop-linux` engine pipe is unavailable.
- `Get-Service *docker*`: `com.docker.service` exists but is `Stopped`.
- `Start-Service com.docker.service`: BLOCKED. Windows refused opening/starting `com.docker.service` from this session.
- Decision: BLOCKED before remote mutation. The gate explicitly requires validating the full migration chain with a local empty database and executing `supabase db reset` locally before `db push`/deploy. Because the local Docker engine could not be started, no remote `db push`, Edge Function deploy, secret configuration, synthetic data setup, n8n validation, worker activation, or real remote E2E gate was performed in this run.

## Resumption - Docker Recovered, Remote Role Blocked

- Timestamp: 2026-08-18 15:27 -03:00.
- Starting commit: `8d96660`.
- Branch: `feat/crm-p1-secure-intake`.
- `docker version`: PASS. Output included both `Client` and `Server`; Docker Desktop server engine reported `OS/Arch: linux/amd64`.
- `docker info --format '{{.OSType}}'`: PASS, returned `linux`.
- Local Supabase start: PASS after the CLI pulled the local images and started only this repository's Supabase stack.
- `npx supabase db reset`: PASS. The local database was recreated from empty and applied all four migrations in order:
  - `20260817100000_crm_base.sql`
  - `20260817120000_crm_p1_security_and_pipeline.sql`
  - `20260817130000_crm_p1_security_corrections.sql`
  - `20260818110000_crm_p1_secure_automation_retention_analytics.sql`
- `npm test -- --run`: PASS, 22 test files and 85 tests passed.
- `npx vitest run supabase/tests/crm_p1_security_contract.test.ts`: PASS, 4/4 tests passed.
- Local Supabase link file: PASS. `supabase/.temp/linked-project.json` points to `CaptacaoLeeds Staging`, ref `sxfpjiejppprumwuotvc`.
- `npx supabase projects list`: BLOCKED for objective reconfirmation. The CLI session listed only other accessible projects and did not list `CaptacaoLeeds Staging`.
- `npx supabase migration list --linked`: BLOCKED before listing migrations with `LegacyDbConfigLoginRoleStatusError`, `unexpected login role status 403`.
- `npx supabase db push --dry-run`: BLOCKED before producing a migration plan with the same `403` login-role error.
- No remote migration was applied, no Edge Function was deployed, no remote secrets were changed, and no old Supabase project was intentionally selected for mutation.
- Lint note: after `supabase start`, the CLI generated ignored local metadata under `supabase/.temp` and `supabase/.branches`; ESLint ignore/gitignore were updated so local CLI artifacts are not linted or staged.
- `npm run lint`: PASS after excluding Supabase CLI temporary metadata.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS, with only Git's LF-to-CRLF working-copy warning for `eslint.config.js`.
- Bundle secret scan: PASS for server-side secrets. The broad scan only matched React's bundled `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`; the focused scan found no `sb_secret_`, `service_role`, service-role env names, pepper, HMAC/n8n server secrets, worker token, JWT secret, or Postgres URL in `dist`.
- Decision: BLOCKED before remote mutation. The local empty-database gate is now validated, but the remote P1 gate cannot continue until the Supabase CLI session has privileges to access the linked staging project's login role and produce a dry-run plan.

## Resumption - Manual Migration Apply Confirmed, Remote P1 Continued

- Timestamp: 2026-08-18 16:11 -03:00.
- Starting commit: `3805bd2`.
- Branch: `feat/crm-p1-secure-intake`.
- Manual operator evidence accepted for `CaptacaoLeeds Staging`:
  - `npx supabase db push --dry-run --password ...`: PASS.
  - Exactly four migrations were reviewed before apply.
  - `npx supabase db push --password ...`: completed.
  - `npx supabase migration list --linked`: PASS.
  - Local and Remote columns matched for `20260817100000`, `20260817120000`, `20260817130000`, and `20260818110000`.
  - The database password was removed from the session after use.
- The four manually applied migrations were not reapplied, repaired, reset, or history-edited.
- Supabase connector migration history: PASS. The four expected migration versions were present.
- Remote schema: PASS for P1 tables. `leads`, CRM role/profile tables, notes/tasks/events, analytics, attribution, intake requests, outbox, and rate-limit tables exist with RLS enabled.
- Remote outbox shape: PASS. `lead_outbox` includes `pending`, `processing`, `delivered`, `failed`, and `dead_letter`, claim metadata, dead-letter metadata, payload redaction metadata, and retry timestamps.
- Initial security advisor check: BLOCKED. Public `EXECUTE` grants were still present on multiple `SECURITY DEFINER` RPCs.
- Corrective migration `20260818190326_crm_p1_lock_down_exposed_privileges.sql`: APPLIED via Supabase connector. It is forward-only and hardens table/RPC grants without editing prior migration history.
- Post-correction RPC grants: PASS for anon. `anon` no longer has `EXECUTE` on CRM/admin, intake, analytics, outbox, or retention RPCs checked.
- Remaining security advisor warnings for `authenticated` SECURITY DEFINER RPCs: REVIEWED. These are the role-guarded CRM RPCs intentionally callable by signed-in users; each checks `has_crm_role(...)` internally or returns current-user access.
- Runtime SQL test found `create_lead_intake` failed in staging because `gen_random_bytes` was not visible under the function `search_path`.
- Corrective migration `20260818191130_crm_p1_fix_intake_event_id_generation.sql`: APPLIED via Supabase connector. It replaces the event id generation with `replace(gen_random_uuid()::text, '-', '')` and preserves service-role-only execution.
- Local empty-database validation after both corrective migrations: PASS. `npx supabase db reset` applied all six local migrations from empty.
- Edge Functions deployed to staging only:
  - `lead-intake`, version 1, active, `verify_jwt=false`.
  - `analytics-intake`, version 1, active, `verify_jwt=false`.
  - `lead-outbox-worker`, version 1, active, `verify_jwt=false`.
- `verify_jwt=false` rationale: `lead-intake` and `analytics-intake` are public browser endpoints with explicit CORS, content-type, payload validation, rate limiting, and server-side service-role RPCs; `lead-outbox-worker` uses a dedicated bearer token and must not require a Supabase JWT.
- Required Edge Function secrets discovered from code:
  - `PUBLIC_SITE_ORIGIN`: allowed browser origin for CORS.
  - `SUPABASE_URL`: project API URL used by Edge Functions.
  - `SUPABASE_SERVICE_ROLE_KEY`: server-side database/RPC access for Edge Functions.
  - `INTAKE_RATE_LIMIT_PEPPER`: server-side pepper for IP/phone/body rate buckets.
  - `N8N_LEAD_AUTOMATION_URL`: staging-only n8n receiver endpoint.
  - `N8N_LEAD_AUTOMATION_SECRET`: HMAC signing secret shared with staging n8n receiver.
  - `LEAD_OUTBOX_WORKER_TOKEN`: bearer token for manual/scheduled worker invocation.
  - Optional worker tuning: `LEAD_OUTBOX_BATCH_SIZE`, `LEAD_OUTBOX_MAX_ATTEMPTS`, `LEAD_OUTBOX_DELIVERY_TIMEOUT_MS`.
- Secret inspection/configuration: BLOCKED. The available connector has no secret-management tool, and `npx supabase secrets list` failed with `403 LegacySecretsListUnexpectedStatusError`. No secret values were requested, extracted, printed, or persisted.
- Low-frequency REST security smokes:
  - Direct anon insert into `leads`: PASS, denied with `42501`.
  - Direct anon insert into `analytics_events`: PASS, denied with `42501`.
  - Anon RPC call to `has_crm_role`: PASS, denied with `42501`.
  - Anon RPC call to `create_lead_intake`: PASS, denied with `42501`.
  - Worker invocation without token: PASS, returned `403 Forbidden`.
- Edge Function CORS smoke:
  - `lead-intake` forbidden-origin preflight: BLOCKED, returned `500` instead of `403`, consistent with missing `PUBLIC_SITE_ORIGIN`.
  - `analytics-intake` forbidden-origin preflight: BLOCKED, returned `500` instead of `403`, consistent with missing `PUBLIC_SITE_ORIGIN`.
- Remote transactional RPC smoke with synthetic data: PASS.
  - Created a synthetic lead and outbox event through `create_lead_intake`.
  - Same idempotency key and same fingerprint replayed as `created=false` with the same lead/event.
  - Same idempotency key with a different fingerprint was rejected.
  - Outbox event claim succeeded.
  - Failure path with `p_max_attempts=1` produced `dead_letter` and redacted payload.
- Remote rate-limit smoke with synthetic data: PASS. Three synthetic leads were created for one phone bucket and the fourth attempt was blocked.
- Automatic worker evidence: BLOCKED. `pg_cron` is not installed and no `cron.job` table exists. No other authorized tool exposed a scheduled Edge Function configuration, so there is no evidence of a real automatic worker.
- n8n/HMAC/expiration/replay: BLOCKED. No configured staging n8n endpoint/secret could be verified, and no real HMAC receiver test can be run until `N8N_LEAD_AUTOMATION_URL` and `N8N_LEAD_AUTOMATION_SECRET` are configured in staging.
- No WhatsApp, email, or other external communication channel was invoked.
- No old Supabase project, Vercel Production, public app, P2 scope, merge, or non-Supabase Docker resource was changed.
- Local validation after corrective migrations:
  - `npx supabase db reset`: PASS with all six migrations.
  - `npm run lint`: PASS.
  - `npm test -- --run`: PASS, 22 test files and 87 tests.
  - `npx tsc --noEmit`: PASS.
  - `npm run build`: PASS.
  - `git diff --check`: PASS, with only Git LF-to-CRLF working-copy warnings.
  - Focused bundle secret scan: PASS.

Manual secret action required outside chat, with staging-only values:

```bash
npx supabase secrets set PUBLIC_SITE_ORIGIN=<staging public origin> INTAKE_RATE_LIMIT_PEPPER=<random pepper> N8N_LEAD_AUTOMATION_URL=<staging n8n receiver URL> N8N_LEAD_AUTOMATION_SECRET=<shared HMAC secret> LEAD_OUTBOX_WORKER_TOKEN=<random worker bearer token> LEAD_OUTBOX_BATCH_SIZE=10 LEAD_OUTBOX_MAX_ATTEMPTS=8 LEAD_OUTBOX_DELIVERY_TIMEOUT_MS=5000
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must also be present for the Edge Functions. If they are not automatically provided in this project, set them manually through the same staging-only secret channel without exposing values in chat or commits.

## Remote Supabase Observed

- Project URL: redacted in public report
- Project ref: redacted in public report
- Linked project name: redacted in public report
- Supabase branches: none listed
- Supabase CLI: not installed locally
- Remote Edge Functions: none listed

The selected Supabase project was later confirmed by the requester to contain only fictitious data and to be authorized for staging-only P1 testing. Before any mutation, Supabase logs were queried for public traffic. The logs showed recent traffic from a public landing domain connected to this project. Because the requester required stopping if public traffic or possible real data ingress existed, no remote mutation was performed.

## Public Traffic Preflight

- Vercel CLI/project link: unavailable locally; no `.vercel/` project link was present and no Vercel CLI was installed.
- Repository/local config search: no committed Vercel project metadata was available.
- Supabase log sources in the checked 24-hour window: activity present in gateway, PostgREST, Postgres, Auth, Storage, and pooler logs.
- Supabase gateway referer aggregation: activity was present from `localhost` and from a public landing domain.
- Decision: BLOCKED before any mutation because a public application is connected to the project.

## Remote Read-Only Evidence

Remote migrations listed by MCP:

- Remote migration history exists and does not match the local P1 migration filenames exactly.
- Exact remote migration identifiers are omitted from this public report.

Local P1 migration files present:

- `20260817100000_crm_base.sql`
- `20260817120000_crm_p1_security_and_pipeline.sql`
- `20260817130000_crm_p1_security_corrections.sql`
- `20260818110000_crm_p1_secure_automation_retention_analytics.sql`

Remote aggregate row-count evidence, without PII:

- CRM and analytics tables contain existing synthetic rows.
- Outbox/intake staging tables were present.
- No `agent` role rows were present.

Security/performance advisors were read before any schema change. Notable security findings included RLS-enabled tables with no policies for internal tables, mutable `search_path` on `set_row_updated_at`, and SECURITY DEFINER functions executable by `anon` or `authenticated`. These were not changed because the public traffic preflight failed.

## Gate Matrix

- Migrations applied in staging: BLOCKED - public traffic preflight failed.
- RLS/RPC remote matrix: BLOCKED - public traffic preflight failed before mutation.
- Edge Functions published: BLOCKED - public traffic preflight failed; no functions currently listed remotely.
- Edge Function secrets present: BLOCKED - no deployment/secret inspection was performed.
- Automatic outbox schedule: BLOCKED - no staging scheduler evidence available.
- Intake E2E, CORS, idempotency, concurrency: BLOCKED - public traffic preflight failed before mutation.
- n8n HMAC, expiration, replay: BLOCKED - no verified homologation workflow access/evidence.
- Failure and recovery: BLOCKED - requires controlled staging receiver and automatic worker.
- Analytics remote gate: BLOCKED - public traffic preflight failed before mutation.
- Vercel preview and headers: BLOCKED - no validated preview URL/access was available in the connected context.
- Bundle secret scan: PASS for server-side secrets in `dist`; only public Vite Supabase values were present.
- Local lint: PASS.
- Local tests: PASS after rerun with elevated execution due local `esbuild` spawn `EPERM`.
- Local build: PASS.
- `npx tsc --noEmit`: PASS.
- Final `git diff --check`: PASS.

## Local Validation Commands

- `npm ci`: FAIL - Windows `EPERM` while unlinking `node_modules/@esbuild/.../esbuild.exe`.
- `npm install`: PASS - restored local dependencies.
- `npm run lint`: PASS.
- `npm test`: first run failed with `spawn EPERM` for esbuild; rerun with elevated execution passed.
- `npm run build`: PASS.
- `npx tsc --noEmit`: PASS.
- `git diff --check`: PASS.
- Secret/bundle scan: PASS for server-side secrets in `dist`.

`npm install` reported 20 dependency audit findings. No dependency fix was applied because that is outside the P1 homologation gate scope.

## Result

P1 BLOQUEADO

Required action to proceed: configure the required staging Edge Function secrets, configure/verify a real automatic worker schedule, and provide redacted evidence or access for the staging n8n HMAC receiver so CORS, intake E2E, worker delivery, HMAC validity, expiration, and replay can be verified end-to-end.
