import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260818110000_crm_p1_secure_automation_retention_analytics.sql"),
  "utf8",
);

const grantHardeningMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260818190326_crm_p1_lock_down_exposed_privileges.sql"),
  "utf8",
);

const runtimeFixMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260818191130_crm_p1_fix_intake_event_id_generation.sql"),
  "utf8",
);

describe("P1 security migration contract", () => {
  it("claims outbox rows with SKIP LOCKED and supports dead letters", () => {
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
    expect(migration).toContain("'dead_letter'");
    expect(migration).toContain("claim_lead_outbox_event");
    expect(migration).toContain("mark_lead_outbox_failed");
  });

  it("removes direct anonymous analytics inserts and exposes only service-role RPC", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "anonymous insert analytics"');
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON public.analytics_events FROM anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.create_analytics_event");
    expect(migration).toContain("TO service_role");
  });

  it("minimizes lead audit state instead of storing complete lead rows", () => {
    expect(migration).toContain("public.lead_audit_state(before_state)");
    expect(migration).not.toContain("to_jsonb(before_state)");
    expect(migration).not.toContain("to_jsonb(after_state)");
  });

  it("keeps pending and failed outbox records out of cleanup deletion", () => {
    expect(migration).toContain("WHERE status = 'delivered'");
    expect(migration).not.toContain("DELETE FROM public.lead_outbox\n  WHERE status IN ('pending', 'failed')");
  });

  it("removes anonymous execution from exposed security definer RPCs", () => {
    expect(grantHardeningMigration).toContain("REVOKE ALL ON FUNCTION public.has_crm_role(text[]) FROM PUBLIC, anon, authenticated");
    expect(grantHardeningMigration).toContain("REVOKE ALL ON FUNCTION public.create_lead_intake");
    expect(grantHardeningMigration).toContain("GRANT EXECUTE ON FUNCTION public.create_lead_intake");
    expect(grantHardeningMigration).toContain("TO service_role");
  });

  it("does not depend on gen_random_bytes visibility for intake event ids", () => {
    expect(runtimeFixMigration).toContain("replace(gen_random_uuid()::text, '-', '')");
    expect(runtimeFixMigration).not.toContain("gen_random_bytes(");
  });
});
