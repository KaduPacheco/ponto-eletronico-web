import { describe, expect, it, vi } from "vitest";
import { computeBackoffDelayMs, deliverLeadOutboxEvent, signLeadAutomationPayload } from "./lead-automation";

describe("lead automation delivery", () => {
  it("preserves event_id in the HMAC signing input and headers", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response);

    const result = await deliverLeadOutboxEvent(
      {
        event_id: "event-123",
        payload: { lead_id: "lead-1" },
        attempts: 0,
      },
      { url: "https://automation.example/webhook", secret: "secret", timeoutMs: 5000 },
      fetcher,
    );

    expect(result.ok).toBe(true);
    const [, options] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(options.headers).toMatchObject({
      "X-Lead-Event-Id": "event-123",
      "Content-Type": "application/json",
    });
    expect(String((options.headers as Record<string, string>)["X-Lead-Signature"])).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it("generates different signatures when event_id changes", async () => {
    const first = await signLeadAutomationPayload("secret", "123", "event-a", '{"lead_id":"lead-1"}');
    const second = await signLeadAutomationPayload("secret", "123", "event-b", '{"lead_id":"lead-1"}');

    expect(first).not.toBe(second);
  });

  it("reports timeout without exposing payload details", async () => {
    const fetcher = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));

    const result = await deliverLeadOutboxEvent(
      {
        event_id: "event-timeout",
        payload: { whatsapp: "11999999999", email: "lead@example.com" },
        attempts: 0,
      },
      { url: "https://automation.example/webhook", secret: "secret", timeoutMs: 1000 },
      fetcher as typeof fetch,
    );

    expect(result).toEqual({ ok: false, error: "automation delivery timeout" });
  });

  it("applies capped exponential backoff with jitter", () => {
    expect(computeBackoffDelayMs(1, 0)).toBe(30_000);
    expect(computeBackoffDelayMs(2, 0)).toBe(60_000);
    expect(computeBackoffDelayMs(8, 1)).toBe(4_500_000);
    expect(computeBackoffDelayMs(30, 1)).toBe(4_500_000);
  });
});
