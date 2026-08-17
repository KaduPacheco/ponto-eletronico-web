import { getSupabasePublicEnv, type SupabasePublicEnv } from "@/infra/supabase/env";
import { getErrorMessage, logAppEvent } from "@/lib/appLogger";
import { getAnalyticsContext } from "@/services/analyticsService";

// Isola a comunicacao da landing com os canais de captura sem trazer SDKs pesados para o bundle publico.

export interface LeadData {
  nome: string;
  email?: string;
  whatsapp: string;
  empresa?: string;
  funcionarios?: number;
}

export interface LeadIntakeResult {
  leadId: string;
  created: boolean;
}

function buildLeadPayload(lead: LeadData) {
  const analytics = getAnalyticsContext();

  return {
    ...lead,
    attribution: {
      visitor_id: analytics.visitorId,
      session_id: analytics.sessionId,
      page_url: analytics.pageUrl,
      referrer: analytics.referrer,
      utm_source: analytics.utm.source,
      utm_medium: analytics.utm.medium,
      utm_campaign: analytics.utm.campaign,
      utm_content: analytics.utm.content,
      utm_term: analytics.utm.term,
    },
  };
}

export async function submitLeadToSupabase(lead: LeadData): Promise<LeadIntakeResult> {
  const supabaseEnv = getSupabasePublicEnv();
  const payload = buildLeadPayload(lead);
  const idempotencyKey = createIdempotencyKey();

  try {
    return await postLeadToIntake(supabaseEnv, payload, idempotencyKey);
  } catch (error) {
    const intakeError = error instanceof Error ? error : new Error(getErrorMessage(error));
    logAppEvent("lead.intake", "error", "Falha ao enviar lead para o intake.", {
      error: intakeError.message,
    });
    throw intakeError;
  }
}

async function postLeadToIntake(
  supabaseEnv: SupabasePublicEnv,
  payload: ReturnType<typeof buildLeadPayload>,
  idempotencyKey: string,
): Promise<LeadIntakeResult> {
  const response = await fetch(supabaseEnv.intakeEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseEnv.anonKey,
      Authorization: `Bearer ${supabaseEnv.anonKey}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Intake retornou status ${response.status}: ${errorText || "sem detalhes"}`);
  }

  const body = (await response.json()) as { lead_id?: unknown; created?: unknown };
  if (typeof body.lead_id !== "string") throw new Error("Intake retornou uma resposta inválida.");
  return { leadId: body.lead_id, created: body.created === true };
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
