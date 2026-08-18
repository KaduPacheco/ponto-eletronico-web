import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { assertJsonPost, getCorsHeaders, HttpError, json, readLimitedJson, safeCorsHeaders } from "../_shared/http.ts";

const allowedEventTypes = new Set([
  "page_view",
  "cta_click",
  "lead_form_start",
  "lead_form_submit_attempt",
  "lead_form_submit_success",
  "lead_form_submit_error",
]);

const allowedTopLevelKeys = new Set([
  "event_type",
  "visitor_id",
  "session_id",
  "occurred_at",
  "page_path",
  "page_url",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "metadata",
  "lead_id",
]);

const metadataAllowlist: Record<string, Set<string>> = {
  page_view: new Set(["page_name"]),
  cta_click: new Set(["cta_id", "location"]),
  lead_form_start: new Set(["form_id"]),
  lead_form_submit_attempt: new Set(["form_id"]),
  lead_form_submit_success: new Set(["form_id", "lead_id"]),
  lead_form_submit_error: new Set(["form_id", "error_type"]),
};

Deno.serve(async (request) => {
  const allowedOrigin = Deno.env.get("PUBLIC_SITE_ORIGIN")?.trim();

  try {
    if (!allowedOrigin) throw new Error("Missing PUBLIC_SITE_ORIGIN");
    const corsHeaders = getCorsHeaders(request, allowedOrigin);
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    assertJsonPost(request);
    const { value } = await readLimitedJson(request, 16 * 1024);
    const payload = validateAnalyticsPayload(value);

    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase.rpc("create_analytics_event", {
      p_event_type: payload.event_type,
      p_visitor_id: payload.visitor_id,
      p_session_id: payload.session_id,
      p_occurred_at: payload.occurred_at,
      p_page_path: payload.page_path,
      p_page_url: payload.page_url,
      p_referrer: payload.referrer,
      p_utm_source: payload.utm_source,
      p_utm_medium: payload.utm_medium,
      p_utm_campaign: payload.utm_campaign,
      p_utm_content: payload.utm_content,
      p_utm_term: payload.utm_term,
      p_metadata: payload.metadata,
      p_lead_id: payload.lead_id,
    });

    if (error) return json({ error: "Analytics rejected" }, 400, corsHeaders);
    return json({ ok: true }, 202, corsHeaders);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError && status < 500 ? error.message : "Unable to process analytics";
    return json({ error: message }, status, safeCorsHeaders(request, allowedOrigin));
  }
});

function validateAnalyticsPayload(value: unknown) {
  const body = asRecord(value);
  rejectUnknownKeys(body, allowedTopLevelKeys);
  const eventType = normalizeText(body.event_type, 1, 80);
  if (!allowedEventTypes.has(eventType)) throw new HttpError(400, "Invalid analytics event");
  const metadata = validateMetadata(eventType, body.metadata);

  return {
    event_type: eventType,
    visitor_id: normalizeText(body.visitor_id, 8, 128),
    session_id: normalizeText(body.session_id, 8, 128),
    occurred_at: optionalIsoDate(body.occurred_at),
    page_path: normalizeText(body.page_path, 1, 512),
    page_url: normalizeUrl(body.page_url),
    referrer: optionalUrl(body.referrer),
    utm_source: optionalText(body.utm_source, 100),
    utm_medium: optionalText(body.utm_medium, 100),
    utm_campaign: optionalText(body.utm_campaign, 150),
    utm_content: optionalText(body.utm_content, 150),
    utm_term: optionalText(body.utm_term, 150),
    metadata,
    lead_id: optionalUuid(body.lead_id),
  };
}

function validateMetadata(eventType: string, value: unknown) {
  const metadata = value === undefined ? {} : asRecord(value);
  const allowedKeys = metadataAllowlist[eventType] ?? new Set<string>();
  rejectUnknownKeys(metadata, allowedKeys);
  const result: Record<string, string> = {};

  for (const [key, metadataValue] of Object.entries(metadata)) {
    if (typeof metadataValue !== "string") throw new HttpError(400, "Invalid metadata");
    if (looksLikePii(metadataValue)) throw new HttpError(400, "Invalid metadata");
    result[key] = normalizeText(metadataValue, 1, 120);
  }

  return result;
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
  if (value === undefined || value === null || value === "") return null;
  return normalizeText(value, 1, max);
}

function normalizeUrl(value: unknown) {
  const text = normalizeText(value, 1, 2048);
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new HttpError(400, "Invalid URL");
  }
}

function optionalUrl(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return normalizeUrl(value);
}

function optionalIsoDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const text = normalizeText(value, 1, 64);
  const timestamp = Date.parse(text);
  if (!Number.isFinite(timestamp)) throw new HttpError(400, "Invalid timestamp");
  return new Date(timestamp).toISOString();
}

function optionalUuid(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const text = normalizeText(value, 36, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw new HttpError(400, "Invalid lead id");
  }
  return text;
}

function looksLikePii(value: string) {
  return /@/.test(value) || /\b\d{10,13}\b/.test(value);
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
