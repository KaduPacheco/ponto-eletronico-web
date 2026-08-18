export interface LeadOutboxEvent {
  event_id: string;
  event_type?: string;
  payload: unknown;
  attempts: number;
}

export interface DeliveryResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export const DEFAULT_MAX_ATTEMPTS = 8;

export function computeBackoffDelayMs(attemptNumber: number, jitterRatio = Math.random()) {
  const baseSeconds = 30;
  const cappedAttempt = Math.max(1, Math.min(attemptNumber, 8));
  const exponentialSeconds = Math.min(3600, baseSeconds * (2 ** (cappedAttempt - 1)));
  const jitterSeconds = Math.floor(exponentialSeconds * 0.25 * Math.max(0, Math.min(jitterRatio, 1)));
  return (exponentialSeconds + jitterSeconds) * 1000;
}

export async function signLeadAutomationPayload(secret: string, timestamp: string, eventId: string, rawBody: string) {
  const signingInput = `${timestamp}.${eventId}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  return `sha256=${toHex(new Uint8Array(signature))}`;
}

export async function deliverLeadOutboxEvent(
  event: LeadOutboxEvent,
  config: { url?: string | null; secret?: string | null; timeoutMs: number },
  fetcher: typeof fetch = fetch,
): Promise<DeliveryResult> {
  const url = config.url?.trim();
  const secret = config.secret?.trim();
  if (!url || !secret) {
    return { ok: false, error: "automation not configured" };
  }

  const rawBody = JSON.stringify(event.payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await signLeadAutomationPayload(secret, timestamp, event.event_id, rawBody);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lead-Event-Id": event.event_id,
        "X-Lead-Timestamp": timestamp,
        "X-Lead-Signature": signature,
      },
      body: rawBody,
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, status: response.status, error: "automation delivery failed" };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === "AbortError";
    return { ok: false, error: isAbort ? "automation delivery timeout" : "automation delivery failed" };
  } finally {
    clearTimeout(timeout);
  }
}

function toHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
