import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAnalyticsFunnel,
  buildAnalyticsKpis,
  buildAnalyticsSeries,
  buildAnalyticsSourceDistribution,
  buildTrafficVsLeadsComparison,
} from "../dashboardService";

const analyticsEvents = [
  {
    id: "1",
    event_type: "page_view",
    visitor_id: "visitor-a",
    session_id: "session-a",
    occurred_at: "2026-04-12T10:00:00.000Z",
    page_path: "/",
    page_url: "https://example.com/?utm_source=google",
    referrer: "https://www.google.com/",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "crm",
    utm_term: "ponto",
    utm_content: "hero",
    metadata: {},
  },
  {
    id: "2",
    event_type: "page_view",
    visitor_id: "visitor-b",
    session_id: "session-b",
    occurred_at: "2026-04-12T10:01:00.000Z",
    page_path: "/",
    page_url: "https://example.com/",
    referrer: "",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    metadata: {},
  },
  {
    id: "3",
    event_type: "cta_click",
    visitor_id: "visitor-a",
    session_id: "session-a",
    occurred_at: "2026-04-12T10:02:00.000Z",
    page_path: "/",
    page_url: "https://example.com/",
    referrer: "https://www.google.com/",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "crm",
    utm_term: "ponto",
    utm_content: "hero",
    metadata: {},
  },
  {
    id: "4",
    event_type: "lead_form_start",
    visitor_id: "visitor-a",
    session_id: "session-a",
    occurred_at: "2026-04-12T10:03:00.000Z",
    page_path: "/",
    page_url: "https://example.com/",
    referrer: "https://www.google.com/",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "crm",
    utm_term: "ponto",
    utm_content: "hero",
    metadata: {},
  },
  {
    id: "5",
    event_type: "lead_form_submit_attempt",
    visitor_id: "visitor-a",
    session_id: "session-a",
    occurred_at: "2026-04-12T10:04:00.000Z",
    page_path: "/",
    page_url: "https://example.com/",
    referrer: "https://www.google.com/",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "crm",
    utm_term: "ponto",
    utm_content: "hero",
    metadata: {},
  },
  {
    id: "6",
    event_type: "lead_form_submit_success",
    visitor_id: "visitor-a",
    session_id: "session-a",
    occurred_at: "2026-04-12T10:05:00.000Z",
    page_path: "/obrigado",
    page_url: "https://example.com/obrigado",
    referrer: "https://www.google.com/",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "crm",
    utm_term: "ponto",
    utm_content: "hero",
    metadata: {},
  },
  {
    id: "7",
    event_type: "lead_form_submit_error",
    visitor_id: "visitor-b",
    session_id: "session-b",
    occurred_at: "2026-04-12T10:06:00.000Z",
    page_path: "/",
    page_url: "https://example.com/",
    referrer: "",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    metadata: {},
  },
];

describe("dashboardService analytics builders", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("gera KPIs reais de visitors, CTA, conversão e taxa", () => {
    const metrics = buildAnalyticsKpis(analyticsEvents);

    expect(metrics.find((metric) => metric.id === "landing_visitors")?.value).toBe(2);
    expect(metrics.find((metric) => metric.id === "landing_cta_clicks")?.value).toBe(1);
    expect(metrics.find((metric) => metric.id === "landing_submit_success")?.value).toBe(1);
    expect(metrics.find((metric) => metric.id === "landing_conversion_rate")?.value).toBe(50);
  });

  it("gera leitura do funil baseada em page views", () => {
    const funnel = buildAnalyticsFunnel(analyticsEvents);

    expect(funnel.map((entry) => entry.id)).toEqual([
      "page_view",
      "cta_click",
      "lead_form_start",
      "lead_form_submit_attempt",
      "lead_form_submit_success",
    ]);
    expect(funnel[0]?.value).toBe(2);
    expect(funnel[1]?.percentage).toBe(50);
    expect(funnel[4]?.percentage).toBe(50);
  });

  it("consolida origem real de tráfego por utm e acesso direto", () => {
    const sources = buildAnalyticsSourceDistribution(analyticsEvents);

    expect(sources).toHaveLength(2);
    expect(sources[0]).toMatchObject({
      label: "UTM: google",
      value: 1,
      percentage: 50,
    });
    expect(sources[1]).toMatchObject({
      label: "Direto",
      value: 1,
      percentage: 50,
    });
  });

  it("gera série por período com visitors, leads e taxa diaria", () => {
    const séries = buildAnalyticsSeries(analyticsEvents, 2);

    expect(séries).toHaveLength(2);
    expect(séries[1]).toMatchObject({
      periodStart: "2026-04-12",
      visitors: 2,
      pageViews: 2,
      ctaClicks: 1,
      leads: 1,
      conversionRate: 50,
    });
  });

  it("compara tráfego e leads por canal com base nos eventos reais", () => {
    const comparison = buildTrafficVsLeadsComparison(analyticsEvents);

    expect(comparison).toHaveLength(2);
    expect(comparison[0]).toMatchObject({
      label: "UTM: google",
      visitors: 1,
      leads: 1,
      conversionRate: 100,
      visitorsShare: 50,
      leadsShare: 100,
    });
    expect(comparison[1]).toMatchObject({
      label: "Direto",
      visitors: 1,
      leads: 0,
      conversionRate: 0,
      visitorsShare: 50,
      leadsShare: 0,
    });
  });
});
