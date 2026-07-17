import { getSupabasePublicEnv, type SupabasePublicEnv } from "@/infra/supabase/env";
import { getErrorMessage, logAppEvent } from "@/lib/appLogger";

// Isola a comunicacao da landing com os canais de captura sem trazer SDKs pesados para o bundle publico.

export interface LeadData {
  nome: string;
  email?: string;
  whatsapp: string;
  empresa?: string;
  funcionarios?: number;
}

interface LeadSubmissionResult {
  supabaseSaved: boolean;
  webhookDelivered: boolean;
}

function getWebhookHost(webhookUrl: string) {
  try {
    return new URL(webhookUrl).host;
  } catch {
    return "invalid-url";
  }
}

function buildLeadPayload(lead: LeadData) {
  return {
    ...lead,
    origem: "landing_page",
    status: "novo",
  };
}

export async function submitLeadToSupabase(lead: LeadData): Promise<boolean> {
  const supabaseEnv = getSupabasePublicEnv();
  const payload = buildLeadPayload(lead);
  const result: LeadSubmissionResult = {
    supabaseSaved: false,
    webhookDelivered: false,
  };
  let supabaseError: Error | null = null;
  let webhookError: Error | null = null;

  try {
    await postLeadToSupabase(supabaseEnv, payload);
    result.supabaseSaved = true;
  } catch (error) {
    supabaseError = error instanceof Error ? error : new Error(getErrorMessage(error));
    logAppEvent("lead.supabase", "error", "Falha ao salvar lead no Supabase.", {
      error: supabaseError.message,
    });
  }

  if (supabaseEnv.n8nWebhookUrl) {
    try {
      await postLeadToWebhook(supabaseEnv.n8nWebhookUrl, payload);
      result.webhookDelivered = true;
    } catch (error) {
      webhookError = error instanceof Error ? error : new Error(getErrorMessage(error));
      logAppEvent("lead.n8n", "warn", "Erro ao enviar dados para o webhook do n8n.", {
        error: webhookError.message,
        webhookHost: getWebhookHost(supabaseEnv.n8nWebhookUrl),
      });
    }
  } else {
    logAppEvent("lead.n8n", "warn", "Webhook complementar desabilitado por ausencia de VITE_N8N_WEBHOOK_URL.");
  }

  if (result.supabaseSaved || result.webhookDelivered) {
    return true;
  }

  throw new Error(buildLeadSubmissionErrorMessage(supabaseError, webhookError));
}

async function postLeadToSupabase(supabaseEnv: SupabasePublicEnv, payload: ReturnType<typeof buildLeadPayload>) {
  const response = await fetch(supabaseEnv.intakeEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseEnv.anonKey,
      Authorization: `Bearer ${supabaseEnv.anonKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase retornou status ${response.status}: ${errorText || "sem detalhes"}`);
  }
}

async function postLeadToWebhook(webhookUrl: string, payload: ReturnType<typeof buildLeadPayload>) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`n8n retornou status ${response.status}`);
  }
}

function buildLeadSubmissionErrorMessage(supabaseError: Error | null, webhookError: Error | null) {
  const supabaseMessage = supabaseError?.message ?? "canal Supabase indisponivel";
  const webhookMessage = webhookError?.message ?? "canal n8n indisponivel";
  return `Erro ao salvar lead. Supabase: ${supabaseMessage}. Webhook: ${webhookMessage}.`;
}
