import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260818193000_crm_p1_prepare_outbox_worker_cron.sql"),
  "utf8",
);

const activationScript = readFileSync(
  resolve(process.cwd(), "supabase/snippets/activate_lead_outbox_worker_cron_staging.sql"),
  "utf8",
);

describe("P1 outbox worker cron contract", () => {
  it("prepares pg_cron, pg_net, Vault, and a Vault-backed invoker", () => {
    expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS pg_net");
    expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS pg_cron");
    expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS supabase_vault");
    expect(migration).toContain("vault.decrypted_secrets");
    expect(migration).toContain("lead_outbox_worker_url");
    expect(migration).toContain("lead_outbox_worker_token");
    expect(migration).toContain("net.http_post");
    expect(migration).toContain("'Authorization', 'Bearer ' || v_worker_token");
  });

  it("does not schedule the worker during local db reset", () => {
    expect(migration).not.toContain("cron.schedule");
    expect(migration).not.toContain("cron.unschedule");
  });

  it("activation script is deterministic and guards against duplicate jobs", () => {
    expect(activationScript).toContain("crm_p1_lead_outbox_worker_every_minute");
    expect(activationScript).toContain("* * * * *");
    expect(activationScript).toContain("v_existing_jobs > 1");
    expect(activationScript).toContain("cron.unschedule(v_existing_jobid)");
    expect(activationScript).toContain("select public.invoke_lead_outbox_worker_from_vault();");
  });

  it("does not persist literal worker URLs or tokens in SQL artifacts", () => {
    expect(`${migration}\n${activationScript}`).not.toMatch(/https?:\/\//i);
    expect(`${migration}\n${activationScript}`).not.toMatch(/Bearer\s+[a-z0-9._-]+/i);
    expect(`${migration}\n${activationScript}`).not.toMatch(/sb_(secret|service)_/i);
  });
});
