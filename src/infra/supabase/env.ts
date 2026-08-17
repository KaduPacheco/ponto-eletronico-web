import { logAppEvent } from "@/lib/appLogger";

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
  analyticsEndpoint: string;
  intakeEndpoint: string;
}

let cachedEnv: SupabasePublicEnv | null = null;
let cachedError: Error | null = null;

export function hasSupabasePublicEnv() {
  return tryGetSupabasePublicEnv() !== null;
}

export function tryGetSupabasePublicEnv() {
  try {
    return getSupabasePublicEnv();
  } catch {
    return null;
  }
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  if (cachedError) {
    throw cachedError;
  }

  const url = readRequiredPublicEnv("VITE_SUPABASE_URL");
  const anonKey = readRequiredPublicEnv("VITE_SUPABASE_ANON_KEY");
  const intakeEndpoint = readRequiredPublicEnv("VITE_LEAD_INTAKE_URL");

  cachedEnv = {
    url,
    anonKey,
    analyticsEndpoint: `${url}/rest/v1/analytics_events`,
    intakeEndpoint,
  };

  return cachedEnv;
}

function readRequiredPublicEnv(key: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY" | "VITE_LEAD_INTAKE_URL") {
  const value = readOptionalPublicEnv(key);

  if (value) {
    return value;
  }

  const error = new Error(`[supabase] Variavel obrigatória ausente: ${key}.`);
  cachedError = error;
  logAppEvent("supabase", "error", error.message);
  throw error;
}

function readOptionalPublicEnv(
  key: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY" | "VITE_LEAD_INTAKE_URL",
) {
  const value = import.meta.env[key];

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}
