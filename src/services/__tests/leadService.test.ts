import { beforeEach, describe, expect, it, vi } from "vitest";

describe("leadService - Resiliencia e API", () => {
  const mockedFetch = vi.mocked(global.fetch);
  const leadData = {
    nome: "Teste Erro",
    whatsapp: "11999999999",
    empresa: "Empresa Erro",
    funcionarios: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-public-key");
    vi.stubEnv("VITE_SUPABASE_INTAKE_URL", "https://demo.supabase.co/rest/v1/leads");
    vi.stubEnv("VITE_N8N_WEBHOOK_URL", "https://n8n.example.com/webhook");
  });

  it("deve enviar ao Supabase primeiro e depois acionar o webhook quando configurado", async () => {
    const { submitLeadToSupabase } = await import("../leadService");

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("OK"),
    } as Response);

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("OK"),
    } as Response);

    const result = await submitLeadToSupabase(leadData);

    expect(result).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch.mock.calls[0]?.[0]).toBe("https://demo.supabase.co/rest/v1/leads");
    expect(mockedFetch.mock.calls[1]?.[0]).toBe("https://n8n.example.com/webhook");
  });

  it("deve capturar pelo webhook quando o Supabase falhar", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { submitLeadToSupabase } = await import("../leadService");

    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve("RLS blocked"),
    } as Response);

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("OK"),
    } as Response);

    const result = await submitLeadToSupabase(leadData);

    expect(result).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[lead.supabase] Falha ao salvar lead no Supabase.",
      expect.objectContaining({
        error: "Supabase retornou status 403: RLS blocked",
      }),
    );

    consoleErrorSpy.mockRestore();
  });

  it("deve retornar true mesmo se o n8n falhar depois do Supabase salvar", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { submitLeadToSupabase } = await import("../leadService");

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("OK"),
    } as Response);

    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await submitLeadToSupabase(leadData);
    expect(result).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[lead.n8n] Erro ao enviar dados para o webhook do n8n.",
      expect.objectContaining({
        error: "n8n retornou status 404",
        webhookHost: "n8n.example.com",
      }),
    );

    consoleWarnSpy.mockRestore();
  });

  it("deve retornar true mesmo se houver erro de rede no webhook depois do Supabase salvar", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { submitLeadToSupabase } = await import("../leadService");

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("OK"),
    } as Response);

    mockedFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await submitLeadToSupabase(leadData);

    expect(result).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[lead.n8n] Erro ao enviar dados para o webhook do n8n.",
      expect.objectContaining({
        error: "Failed to fetch",
        webhookHost: "n8n.example.com",
      }),
    );

    consoleWarnSpy.mockRestore();
  });

  it("deve retornar true e registrar ausencia explicita da env do webhook quando Supabase salvar", async () => {
    vi.stubEnv("VITE_N8N_WEBHOOK_URL", "");
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { submitLeadToSupabase } = await import("../leadService");

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("OK"),
    } as Response);

    const result = await submitLeadToSupabase(leadData);

    expect(result).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[lead.n8n] Webhook complementar desabilitado por ausencia de VITE_N8N_WEBHOOK_URL.",
      {},
    );

    consoleWarnSpy.mockRestore();
  });

  it("deve lancar erro amigavel se Supabase e webhook falharem", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { submitLeadToSupabase } = await import("../leadService");

    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Database connection failed"),
    } as Response);

    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(submitLeadToSupabase(leadData)).rejects.toThrow(
      "Erro ao salvar lead. Supabase: Supabase retornou status 500: Database connection failed. Webhook: n8n retornou status 500.",
    );

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
});
