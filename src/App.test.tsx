import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];

  disconnect() {}

  observe() {}

  takeRecords() {
    return [];
  }

  unobserve() {}
}

function restoreDefaultPublicEnv() {
  vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-public-key");
  vi.stubEnv("VITE_SUPABASE_INTAKE_URL", "https://demo.supabase.co/rest/v1/leads");
  vi.stubEnv("VITE_N8N_WEBHOOK_URL", "https://n8n.example.com/webhook");
}

function installIntersectionObserverMock() {
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver,
  });
}

async function importFreshApp() {
  vi.resetModules();
  const module = await import("./App");
  return module.default;
}

describe("App bootstrap publico", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    installIntersectionObserverMock();
    restoreDefaultPublicEnv();
    window.history.pushState({}, "", "/");
  });

  it("mantem a landing publica funcional mesmo sem env obrigatoria do Supabase", async () => {
    vi.unstubAllEnvs();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    installIntersectionObserverMock();

    const App = await importFreshApp();

    window.history.pushState({}, "", "/");

    render(<App />);

    expect(await screen.findByRole("heading", { name: /feche a folha/i })).toBeInTheDocument();
    expect(screen.queryByText(/crm indisponivel no ambiente atual/i)).not.toBeInTheDocument();
  });

  it("mostra fallback controlado no /crm quando a env obrigatoria estiver ausente", async () => {
    vi.unstubAllEnvs();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    installIntersectionObserverMock();

    const App = await importFreshApp();

    window.history.pushState({}, "", "/crm");

    render(<App />);

    expect(await screen.findByText(/crm indisponivel no ambiente atual/i)).toBeInTheDocument();
    expect(screen.getByText(/vite_supabase_url/i)).toBeInTheDocument();
    expect(screen.getByText(/vite_supabase_anon_key/i)).toBeInTheDocument();
  });
});
