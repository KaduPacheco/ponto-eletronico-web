import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { computeBackoffDelayMs, deliverLeadOutboxEvent } from "../_shared/lead-automation.ts";
import { assertJsonPost, getCorsHeaders, HttpError, json, readLimitedJson, safeCorsHeaders } from "../_shared/http.ts";
import { getTrustedClientIp, pepperedHash, sha256Hex } from "../_shared/security.ts";

const allowedTopLevelKeys = new Set(["nome", "whatsapp", "email", "empresa", "funcionarios", "attribution"]);
const allowedAttributionKeys = new Set([
  "visitor_id",
  "session_id",
  "page_url",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

Deno.serve(async (request) => {
  const allowedOrigin = Deno.env.get("PUBLIC_SITE_ORIGIN")?.trim();

  try {
    if (!allowedOrigin) throw new Error("Missing PUBLIC_SITE_ORIGIN");
    const corsHeaders = getCorsHeaders(request, allowedOrigin);
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    assertJsonPost(request);
    const { rawBody, value } = await readLimitedJson(request);
    const body = asRecord(value);
    const lead = validateLead(body);
    const attribution = validateAttribution(body.attribution);
    const suppliedKey = request.headers.get("idempotency-key")?.trim();
    const idempotencyKey = suppliedKey || await sha256Hex(rawBody);
    if (idempotencyKey.length < 16 || idempotencyKey.length > 128) throw new HttpError(400, "Invalid idempotency key");

    const pepper = requiredEnv("INTAKE_RATE_LIMIT_PEPPER");
    const requestFingerprint = await pepperedHash(pepper, "lead-body", rawBody);
    const ipBucketHash = await pepperedHash(pepper, "ip", getTrustedClientIp(request));
    const phoneBucketHash = await pepperedHash(pepper, "phone", lead.whatsapp);

    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase.rpc("create_lead_intake", {
      p_idempotency_key: idempotencyKey,
      p_request_fingerprint: requestFingerprint,
      p_ip_bucket_hash: ipBucketHash,
      p_phone_bucket_hash: phoneBucketHash,
      p_nome: lead.nome,
      p_whatsapp: lead.whatsapp,
      p_email: lead.email ?? "",
      p_empresa: lead.empresa ?? "",
      p_funcionarios: lead.funcionarios ?? null,
      p_visitor_id: attribution.visitor_id,
      p_session_id: attribution.session_id,
      p_page_url: attribution.page_url ?? null,
      p_referrer: attribution.referrer ?? null,
      p_utm_source: attribution.utm_source ?? null,
      p_utm_medium: attribution.utm_medium ?? null,
      p_utm_campaign: attribution.utm_campaign ?? null,
      p_utm_content: attribution.utm_content ?? null,
      p_utm_term: attribution.utm_term ?? null,
    });

    if (error) {
      const status = error.message.includes("Rate limit") ? 429 : error.message.includes("Idempotency") ? 409 : 400;
      return json(
        { error: status === 429 ? "Rate limit exceeded" : "Lead intake rejected" },
        status,
        status === 429 ? { ...corsHeaders, "Retry-After": "300" } : corsHeaders,
      );
    }

    const result = data?.[0];
    if (!result?.lead_id) return json({ error: "Lead intake failed" }, 500, corsHeaders);
    if (result.created && result.event_id) await notifyAutomation(supabase, result.event_id);
    return json({ lead_id: result.lead_id, created: result.created }, result.created ? 201 : 200, corsHeaders);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError && status < 500 ? error.message : "Unable to process lead intake";
    return json({ error: message }, status, safeCorsHeaders(request, allowedOrigin));
  }
});

function validateLead(value: Record<string, unknown>) {
  rejectUnknownKeys(value, allowedTopLevelKeys);
  if (typeof value.nome !== "string" || typeof value.whatsapp !== "string") throw new HttpError(400, "Invalid lead");
  const nome = normalizeText(value.nome, 2, 100);
  const whatsapp = normalizePhone(value.whatsapp);
  const email = optionalText(value.email, 255)?.toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Invalid email");
  const empresa = optionalText(value.empresa, 100);
  const funcionarios = value.funcionarios === undefined ? undefined : value.funcionarios;
  if (funcionarios !== undefined && (!Number.isInteger(funcionarios) || funcionarios < 1 || funcionarios > 1_000_000)) {
    throw new HttpError(400, "Invalid employee count");
  }
  return { nome, whatsapp, email, empresa, funcionarios: funcionarios as number | undefined };
}

function validateAttribution(value: unknown) {
  const attribution = asRecord(value);
  rejectUnknownKeys(attribution, allowedAttributionKeys);
  const visitor_id = normalizeText(attribution.visitor_id, 8, 128);
  const session_id = normalizeText(attribution.session_id, 8, 128);
  const page_url = optionalUrl(attribution.page_url);
  const referrer = optionalUrl(attribution.referrer);
  return {
    visitor_id,
    session_id,
    page_url,
    referrer,
    utm_source: optionalText(attribution.utm_source, 100),
    utm_medium: optionalText(attribution.utm_medium, 100),
    utm_campaign: optionalText(attribution.utm_campaign, 150),
    utm_content: optionalText(attribution.utm_content, 150),
    utm_term: optionalText(attribution.utm_term, 150),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "Invalid request body");
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>) {
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) throw new HttpError(400, `Unknown field: ${unknown}`);
}

function normalizeText(value: unknown, min: number, max: number) {
  if (typeof value !== "string") throw new HttpError(400, "Invalid text field");
  const normalized = value.normalize("NFC").trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max) throw new HttpError(400, "Invalid text field");
  return normalized;
}

function optionalText(value: unknown, max: number) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new HttpError(400, "Invalid text field");
  const normalized = value.normalize("NFC").trim().replace(/\s+/g, " ");
  if (normalized.length > max) throw new HttpError(400, "Invalid text field");
  return normalized || undefined;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) throw new HttpError(400, "Invalid phone");
  return digits;
}

function optionalUrl(value: unknown) {
  const text = optionalText(value, 2048);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new HttpError(400, "Invalid URL");
  }
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function notifyAutomation(supabase: ReturnType<typeof createClient>, eventId: string) {
  const { data } = await supabase.rpc("claim_lead_outbox_event", {
    p_event_id: eventId,
    p_worker_id: `lead-intake-${crypto.randomUUID()}`,
  });
  const event = data?.[0];
  if (!event) return;

  const delivery = await deliverLeadOutboxEvent(
    event,
    {
      url: Deno.env.get("N8N_LEAD_AUTOMATION_URL"),
      secret: Deno.env.get("N8N_LEAD_AUTOMATION_SECRET"),
      timeoutMs: 5000,
    },
  );

  if (delivery.ok) {
    await supabase.rpc("mark_lead_outbox_delivered", { p_event_id: event.event_id });
    return;
  }

  const nextAttemptAt = new Date(Date.now() + computeBackoffDelayMs(Number(event.attempts ?? 0) + 1)).toISOString();
  await supabase.rpc("mark_lead_outbox_failed", {
    p_event_id: event.event_id,
    p_next_attempt_at: nextAttemptAt,
    p_max_attempts: 8,
    p_error: delivery.error ?? "automation delivery failed",
  });
}
