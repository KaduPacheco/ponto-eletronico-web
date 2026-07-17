import { beforeEach, describe, expect, it, vi } from "vitest";

describe("supabase env helper", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("normaliza as envs públicas e monta os endpoints derivados", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", " https://demo.supabase.co ");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", " anon-public-key ");
    vi.stubEnv("VITE_SUPABASE_INTAKE_URL", " https://api.example.com/intake ");
    vi.stubEnv("VITE_N8N_WEBHOOK_URL", " https://n8n.example.com/webhook ");

    const { getSupabasePublicEnv, hasSupabasePublicEnv } = await import("./env");

    expect(hasSupabasePublicEnv()).toBe(true);
    expect(getSupabasePublicEnv()).toEqual({
      url: "https://demo.supabase.co",
      anonKey: "anon-public-key",
      analyticsEndpoint: "https://demo.supabase.co/rest/v1/analytics_events",
      intakeEndpoint: "https://api.example.com/intake",
      n8nWebhookUrl: "https://n8n.example.com/webhook",
    });
  });

  it("falha com mensagem clara quando faltarem envs obrigatórias", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { getSupabasePublicEnv, tryGetSupabasePublicEnv } = await import("./env");

    expect(tryGetSupabasePublicEnv()).toBeNull();
    expect(() => getSupabasePublicEnv()).toThrow("[supabase] Variavel obrigatória ausente: VITE_SUPABASE_URL.");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
