import { tryGetSupabasePublicEnv } from "@/infra/supabase/env";

export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "cta_click",
  "lead_form_start",
  "lead_form_submit_attempt",
  "lead_form_submit_success",
  "lead_form_submit_error",
] as const;

const VISITOR_STORAGE_KEY = "capturaleads.analytics.visitor_id";
const SESSION_STORAGE_KEY = "capturaleads.analytics.session_id";

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export interface AnalyticsEventPayload {
  event_type: AnalyticsEventType;
  visitor_id: string;
  session_id: string;
  occurred_at: string;
  page_path: string;
  page_url: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  metadata: Record<string, unknown>;
}

interface TrackAnalyticsOptions {
  metadata?: Record<string, unknown>;
  pagePath?: string;
  pageUrl?: string;
  referrer?: string | null;
}

export function buildAnalyticsPayload(
  eventType: AnalyticsEventType,
  options: TrackAnalyticsOptions = {},
): AnalyticsEventPayload {
  const context = getAnalyticsContext();

  return {
    event_type: eventType,
    visitor_id: context.visitorId,
    session_id: context.sessionId,
    occurred_at: new Date().toISOString(),
    page_path: options.pagePath ?? context.pagePath,
    page_url: options.pageUrl ?? context.pageUrl,
    referrer: options.referrer ?? context.referrer,
    utm_source: context.utm.source,
    utm_medium: context.utm.medium,
    utm_campaign: context.utm.campaign,
    utm_content: context.utm.content,
    utm_term: context.utm.term,
    metadata: options.metadata ?? {},
  };
}

export async function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  options: TrackAnalyticsOptions = {},
) {
  const supabaseEnv = tryGetSupabasePublicEnv();

  if (!supabaseEnv) {
    console.warn(`[Analytics] Variaveis do Supabase ausentes. Evento '${eventType}' não foi enviado.`);
    return false;
  }

  const payload = buildAnalyticsPayload(eventType, options);

  try {
    const response = await fetch(supabaseEnv.analyticsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseEnv.anonKey,
        Authorization: `Bearer ${supabaseEnv.anonKey}`,
        Prefer: "return=mínimal",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Analytics] Falha ao gravar '${eventType}': ${response.status} ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`[Analytics] Erro de rede ao gravar '${eventType}':`, error);
    return false;
  }
}

export function trackPageView(metadata: Record<string, unknown> = {}) {
  return trackAnalyticsEvent("page_view", { metadata });
}

export function trackCtaClick(metadata: Record<string, unknown>) {
  return trackAnalyticsEvent("cta_click", { metadata });
}

export function trackLeadFormStart(metadata: Record<string, unknown> = {}) {
  return trackAnalyticsEvent("lead_form_start", { metadata });
}

export function trackLeadFormSubmitAttempt(metadata: Record<string, unknown> = {}) {
  return trackAnalyticsEvent("lead_form_submit_attempt", { metadata });
}

export function trackLeadFormSubmitSuccess(metadata: Record<string, unknown> = {}) {
  return trackAnalyticsEvent("lead_form_submit_success", { metadata });
}

export function trackLeadFormSubmitError(metadata: Record<string, unknown> = {}) {
  return trackAnalyticsEvent("lead_form_submit_error", { metadata });
}

export function getAnalyticsContext() {
  const location = getCurrentLocation();
  const searchParams = new URLSearchParams(location.search);

  return {
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateSessionId(),
    pagePath: location.pathname,
    pageUrl: location.href,
    referrer: getCurrentReferrer(),
    utm: {
      source: searchParams.get("utm_source"),
      medium: searchParams.get("utm_medium"),
      campaign: searchParams.get("utm_campaign"),
      content: searchParams.get("utm_content"),
      term: searchParams.get("utm_term"),
    },
  };
}

function getOrCreateVisitorId() {
  return getOrCreateStorageId("localStorage", VISITOR_STORAGE_KEY);
}

function getOrCreateSessionId() {
  return getOrCreateStorageId("sessionStorage", SESSION_STORAGE_KEY);
}

function getOrCreateStorageId(storageType: "localStorage" | "sessionStorage", key: string) {
  const storage = getStorage(storageType);

  if (!storage) {
    return createClientId();
  }

  const existingValue = storage.getItem(key);

  if (existingValue) {
    return existingValue;
  }

  const nextValue = createClientId();
  storage.setItem(key, nextValue);
  return nextValue;
}

function getStorage(storageType: "localStorage" | "sessionStorage") {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window[storageType];
  } catch {
    return null;
  }
}

function getCurrentLocation() {
  if (typeof window === "undefined") {
    return {
      href: "",
      pathname: "",
      search: "",
    };
  }

  return window.location;
}

function getCurrentReferrer() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.referrer || null;
}

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `analytics-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}
