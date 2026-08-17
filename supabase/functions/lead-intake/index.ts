import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const allowedTopLevelKeys = new Set(["nome", "whatsapp", "email", "empresa", "funcionarios", "attribution"]);
const allowedAttributionKeys = new Set([
  "visitor_id", "session_id", "page_url", "referrer", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
]);

Deno.serve(async (request) => {
  try {
    const corsHeaders = getCorsHeaders(request);
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);
    const body = await request.json();
    const lead = validateLead(body);
    const attribution = validateAttribution(body.attribution);
    const suppliedKey = request.headers.get("idempotency-key")?.trim();
    const idempotencyKey = suppliedKey || await fingerprint(JSON.stringify({ lead, attribution }));
    if (idempotencyKey.length < 16 || idempotencyKey.length > 128) throw new Error("Invalid idempotency key");

    const requestFingerprint = await fingerprint(`${clientIp(request)}:${lead.whatsapp}:${attribution.visitor_id}`);
    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.rpc("create_lead_intake", {
      p_idempotency_key: idempotencyKey,
      p_request_fingerprint: requestFingerprint,
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
      return json({ error: status === 429 ? "Rate limit exceeded" : "Lead intake rejected" }, status, corsHeaders);
    }

    const result = data?.[0];
    if (!result?.lead_id) return json({ error: "Lead intake failed" }, 500, corsHeaders);
    if (result.created && result.event_id) await notifyAutomation(supabase, result.event_id);
    return json({ lead_id: result.lead_id, created: result.created }, result.created ? 201 : 200, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message.startsWith("Invalid") || message.startsWith("Unknown") ? 400 : 500;
    return json({ error: status === 400 ? message : "Unable to process lead intake" }, status, safeCorsHeaders(request));
  }
});

function getCorsHeaders(request: Request) {
  const configuredOrigin = requiredEnv("PUBLIC_SITE_ORIGIN");
  const requestOrigin = request.headers.get("Origin")?.trim();
  if (!requestOrigin || requestOrigin !== configuredOrigin) throw new Error("Origin not allowed");
  return {
    "Access-Control-Allow-Origin": configuredOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, idempotency-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function safeCorsHeaders(request: Request) {
  const origin = request.headers.get("Origin")?.trim();
  const configured = Deno.env.get("PUBLIC_SITE_ORIGIN")?.trim();
  return origin && configured && origin === configured ? { "Access-Control-Allow-Origin": configured, Vary: "Origin" } : { Vary: "Origin" };
}

function validateLead(value: unknown) {
  const body = asRecord(value);
  rejectUnknownKeys(body, allowedTopLevelKeys);
  if (typeof body.nome !== "string" || typeof body.whatsapp !== "string") throw new Error("Invalid lead");
  const nome = normalizeText(body.nome, 2, 100);
  const whatsapp = normalizePhone(body.whatsapp);
  const email = optionalText(body.email, 255)?.toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  const empresa = optionalText(body.empresa, 100);
  const funcionarios = body.funcionarios === undefined ? undefined : body.funcionarios;
  if (funcionarios !== undefined && (!Number.isInteger(funcionarios) || funcionarios < 1 || funcionarios > 1_000_000)) throw new Error("Invalid employee count");
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
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request body");
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>) {
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) throw new Error(`Unknown field: ${unknown}`);
}

function normalizeText(value: unknown, min: number, max: number) {
  if (typeof value !== "string") throw new Error("Invalid text field");
  const normalized = value.normalize("NFC").trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max) throw new Error("Invalid text field");
  return normalized;
}

function optionalText(value: unknown, max: number) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error("Invalid text field");
  const normalized = value.normalize("NFC").trim().replace(/\s+/g, " ");
  if (normalized.length > max) throw new Error("Invalid text field");
  return normalized || undefined;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) throw new Error("Invalid phone");
  return digits;
}

function optionalUrl(value: unknown) {
  const text = optionalText(value, 2048);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error("Invalid URL");
  }
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function fingerprint(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function notifyAutomation(supabase: ReturnType<typeof createClient>, eventId: string) {
  const url = Deno.env.get("N8N_LEAD_AUTOMATION_URL")?.trim();
  const secret = Deno.env.get("N8N_LEAD_AUTOMATION_SECRET")?.trim();
  if (!url || !secret) return;
  const { data: event } = await supabase.from("lead_outbox").select("event_id,payload,attempts").eq("event_id", eventId).eq("status", "pending").single();
  if (!event) return;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify(event.payload);
  const signingInput = `${timestamp}.${event.event_id}.${body}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const digest = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Lead-Event-Id": event.event_id, "X-Lead-Timestamp": timestamp, "X-Lead-Signature": `sha256=${digest}` },
      body,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await supabase.from("lead_outbox").update({ status: "delivered", delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("event_id", event.event_id);
  } catch {
    const attempts = Number(event.attempts ?? 0) + 1;
    const delaySeconds = Math.min(3600, 30 * (2 ** Math.min(attempts, 7)));
    await supabase.from("lead_outbox").update({ status: "failed", attempts, next_attempt_at: new Date(Date.now() + delaySeconds * 1000).toISOString(), last_error: "automation delivery failed", updated_at: new Date().toISOString() }).eq("event_id", event.event_id);
  } finally {
    clearTimeout(timeout);
  }
}

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
