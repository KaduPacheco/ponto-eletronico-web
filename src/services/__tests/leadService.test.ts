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

  it("envia lead e atribuição para um único endpoint com idempotência", async () => {
    const { submitLeadToSupabase } = await import("../leadService");
    mockedFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ lead_id: "lead-1", created: true }) } as Response);
    await expect(submitLeadToSupabase(leadData)).resolves.toEqual({ leadId: "lead-1", created: true });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]?.[0]).toBe("https://demo.supabase.co/functions/v1/lead-intake");
    expect(mockedFetch.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      method: "POST",
      body: expect.stringContaining("attribution"),
      headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }),
    }));
  });

  it("propaga a falha do intake sem tentar um segundo canal", async () => {
    const { submitLeadToSupabase } = await import("../leadService");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedFetch.mockResolvedValueOnce({ ok: false, status: 429, text: () => Promise.resolve("Rate limit exceeded") } as Response);
    await expect(submitLeadToSupabase(leadData)).rejects.toThrow("Intake retornou status 429: Rate limit exceeded");
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it("sends only public credentials and no privileged CRM fields", async () => {
    const { submitLeadToSupabase } = await import("../leadService");
    mockedFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ lead_id: "lead-1", created: true }) } as Response);
    await submitLeadToSupabase(leadData);
    const [, requestOptions] = mockedFetch.mock.calls[0] as [string, RequestInit];
    expect(requestOptions.headers).toEqual(expect.objectContaining({ apikey: "anon-public-key" }));
    expect(String(requestOptions.body)).not.toContain("owner_id");
    expect(String(requestOptions.body)).not.toContain("pipeline_stage");
    expect(String(requestOptions.body)).not.toContain("lifetime_value");
  });
});
