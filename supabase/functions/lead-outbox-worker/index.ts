import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { computeBackoffDelayMs, DEFAULT_MAX_ATTEMPTS, deliverLeadOutboxEvent, type LeadOutboxEvent } from "../_shared/lead-automation.ts";
import { json } from "../_shared/http.ts";

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, {});
    if (!isAuthorized(request)) return json({ error: "Forbidden" }, 403, {});

    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const workerId = `edge-${crypto.randomUUID()}`;
    const batchSize = readIntEnv("LEAD_OUTBOX_BATCH_SIZE", 10, 1, 50);
    const maxAttempts = readIntEnv("LEAD_OUTBOX_MAX_ATTEMPTS", DEFAULT_MAX_ATTEMPTS, 1, 20);
    const timeoutMs = readIntEnv("LEAD_OUTBOX_DELIVERY_TIMEOUT_MS", 5000, 1000, 15000);
    const { data, error } = await supabase.rpc("claim_lead_outbox_batch", {
      p_worker_id: workerId,
      p_limit: batchSize,
    });
    if (error) throw error;

    const events = (data ?? []) as LeadOutboxEvent[];
    const summary = { claimed: events.length, delivered: 0, failed: 0 };

    for (const event of events) {
      const delivery = await deliverLeadOutboxEvent(event, {
        url: Deno.env.get("N8N_LEAD_AUTOMATION_URL"),
        secret: Deno.env.get("N8N_LEAD_AUTOMATION_SECRET"),
        timeoutMs,
      });

      if (delivery.ok) {
        const delivered = await supabase.rpc("mark_lead_outbox_delivered", { p_event_id: event.event_id });
        if (delivered.error) throw delivered.error;
        summary.delivered += 1;
        continue;
      }

      const nextAttemptAt = new Date(Date.now() + computeBackoffDelayMs(Number(event.attempts ?? 0) + 1)).toISOString();
      const failed = await supabase.rpc("mark_lead_outbox_failed", {
        p_event_id: event.event_id,
        p_next_attempt_at: nextAttemptAt,
        p_max_attempts: maxAttempts,
        p_error: delivery.error ?? "automation delivery failed",
      });
      if (failed.error) throw failed.error;
      summary.failed += 1;
    }

    return json(summary, 200, {});
  } catch {
    return json({ error: "Worker failed" }, 500, {});
  }
});

function isAuthorized(request: Request) {
  const expected = Deno.env.get("LEAD_OUTBOX_WORKER_TOKEN")?.trim();
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  return Boolean(expected) && authorization === `Bearer ${expected}`;
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function readIntEnv(name: string, fallback: number, min: number, max: number) {
  const rawValue = Deno.env.get(name)?.trim();
  const parsed = rawValue ? Number(rawValue) : fallback;
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid ${name}`);
  }
  return parsed;
}
