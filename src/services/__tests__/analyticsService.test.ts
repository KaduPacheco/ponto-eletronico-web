import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAnalyticsPayload, trackAnalyticsEvent } from "../analyticsService";

describe("analyticsService - contrato e resiliencia", () => {
  const mockedFetch = vi.mocked(global.fetch);

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/?utm_source=google&utm_medium=cpc&utm_campaign=crm&utm_content=hero&utm_term=ponto");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://www.google.com/",
    });
  });

  it("monta o payload com visitor, session, page, referrer e UTM", () => {
    const payload = buildAnalyticsPayload("page_view", {
      metadata: {
        page_name: "landing_home",
      },
    });

    expect(payload.event_type).toBe("page_view");
    expect(payload.visitor_id).toBeTruthy();
    expect(payload.session_id).toBeTruthy();
    expect(payload.page_path).toBe("/");
    expect(payload.page_url).toContain("utm_source=google");
    expect(payload.referrer).toBe("https://www.google.com/");
    expect(payload.utm_source).toBe("google");
    expect(payload.utm_medium).toBe("cpc");
    expect(payload.utm_campaign).toBe("crm");
    expect(payload.utm_content).toBe("hero");
    expect(payload.utm_term).toBe("ponto");
    expect(payload.metadata).toEqual({
      page_name: "landing_home",
    });
  });

  it("posta o evento no endpoint do Supabase", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(""),
    } as Response);

    const result = await trackAnalyticsEvent("cta_click", {
      metadata: {
        cta_id: "hero_cta_começar_teste",
      },
    });

    expect(result).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockedFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toContain("/rest/v1/analytics_events");
    expect(options.method).toBe("POST");
    expect(options.headers).toMatchObject({
      "Content-Type": "application/json",
      Prefer: "return=mínimal",
    });

    const body = JSON.parse(String(options.body));
    expect(body.event_type).toBe("cta_click");
    expect(body.metadata).toEqual({
      cta_id: "hero_cta_começar_teste",
    });
  });

  it("não quebra a operação quando a API falha", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve("missing analytics_events"),
    } as Response);

    const result = await trackAnalyticsEvent("lead_form_submit_error", {
      metadata: {
        error_type: "transport",
      },
    });

    expect(result).toBe(false);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });
});
