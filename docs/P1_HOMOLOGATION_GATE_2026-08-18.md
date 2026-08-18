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

Required action to proceed: connect the Supabase integration or CLI session to the authorized staging organization/project so it appears in project discovery by name. Do not reuse the previous linked project. After objective selection is possible, verify no public traffic, then apply P1 migrations, deploy P1 Edge Functions, configure staging-only secrets, activate the worker schedule, and execute the remote E2E matrix.
