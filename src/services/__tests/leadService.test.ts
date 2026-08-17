import { beforeEach, describe, expect, it, vi } from "vitest";

describe("leadService - intake único", () => {
  const mockedFetch = vi.mocked(global.fetch);
  const leadData = { nome: "Teste", whatsapp: "11999999999", empresa: "Empresa", funcionarios: 10 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-public-key");
    vi.stubEnv("VITE_LEAD_INTAKE_URL", "https://demo.supabase.co/functions/v1/lead-intake");
  });

  it("envia lead e atribuição para um único endpoint", async () => {
    const { submitLeadToSupabase } = await import("../leadService");
    mockedFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("") } as Response);
    await expect(submitLeadToSupabase(leadData)).resolves.toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]?.[0]).toBe("https://demo.supabase.co/functions/v1/lead-intake");
    expect(mockedFetch.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ method: "POST", body: expect.stringContaining("attribution") }));
  });

  it("propaga a falha do intake sem tentar um segundo canal", async () => {
    const { submitLeadToSupabase } = await import("../leadService");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedFetch.mockResolvedValueOnce({ ok: false, status: 429, text: () => Promise.resolve("Rate limit exceeded") } as Response);
    await expect(submitLeadToSupabase(leadData)).rejects.toThrow("Intake retornou status 429: Rate limit exceeded");
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it("sends the public Supabase credentials to the intake", async () => {
    const { submitLeadToSupabase } = await import("../leadService");
    mockedFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("") } as Response);
    await submitLeadToSupabase(leadData);
    expect(mockedFetch.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ headers: expect.objectContaining({ apikey: "anon-public-key" }) }));
  });

  it("uses landing_page as the source", async () => {
    const { submitLeadToSupabase } = await import("../leadService");
    mockedFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("") } as Response);
    await submitLeadToSupabase(leadData);
    expect(mockedFetch.mock.calls[0]?.[1]?.body).toContain('"origem":"landing_page"');
  });

  it("does not expose a webhook URL in its client contract", async () => {
    const { getSupabasePublicEnv } = await import("@/infra/supabase/env");
    expect(getSupabasePublicEnv()).not.toHaveProperty("n8nWebhookUrl");
  });
});
