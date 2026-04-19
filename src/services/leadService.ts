import { getSupabasePublicEnv } from "@/infra/supabase/env";
import { getErrorMessage, logAppEvent } from "@/lib/appLogger";

// Este script isola a logica de comunicacao com o Supabase sem dependencia de SDKs pesados.

export interface LeadData {
  nome: string;
  email?: string;
  whatsapp: string;
  empresa?: string;
  funcionarios?: number;
}

function getWebhookHost(webhookUrl: string) {
  try {
    return new URL(webhookUrl).host;
  } catch {
    return "invalid-url";
  }
}

export async function submitLeadToSupabase(lead: LeadData): Promise<boolean> {
  const supabaseEnv = getSupabasePublicEnv();

  const response = await fetch(supabaseEnv.intakeEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseEnv.anonKey,
      Authorization: `Bearer ${supabaseEnv.anonKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      ...lead,
      origem: "landing_page",
      status: "novo",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Supabase Error:", errorText);
    throw new Error(`Erro ao salvar lead (Status ${response.status})`);
  }

  if (!supabaseEnv.n8nWebhookUrl) {
    logAppEvent("lead.n8n", "warn", "Webhook complementar desabilitado por ausencia de VITE_N8N_WEBHOOK_URL.");
    return true;
  }

  try {
    const n8nResponse = await fetch(supabaseEnv.n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...lead,
        origem: "landing_page",
        status: "novo",
      }),
    });

    if (!n8nResponse.ok) {
      logAppEvent("lead.n8n", "warn", "Webhook do n8n retornou erro HTTP.", {
        status: n8nResponse.status,
        webhookHost: getWebhookHost(supabaseEnv.n8nWebhookUrl),
      });
    }
  } catch (error) {
    logAppEvent("lead.n8n", "warn", "Erro de rede ao enviar dados para o webhook do n8n.", {
      error: getErrorMessage(error),
      webhookHost: getWebhookHost(supabaseEnv.n8nWebhookUrl),
    });
  }

  return true;
}
