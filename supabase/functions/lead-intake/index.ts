import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json();
    const lead = validateLead(body);
    const attribution = validateAttribution(body.attribution);
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? await fingerprint(JSON.stringify({ lead, attribution }));
    const requestFingerprint = await fingerprint(`${clientIp(request)}:${lead.whatsapp}`);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase.rpc("create_lead_intake", {
      p_idempotency_key: idempotencyKey, p_request_fingerprint: requestFingerprint, p_nome: lead.nome, p_whatsapp: lead.whatsapp,
      p_email: lead.email ?? "", p_empresa: lead.empresa ?? "", p_funcionarios: lead.funcionarios ?? null,
      p_visitor_id: attribution.visitor_id, p_session_id: attribution.session_id, p_page_url: attribution.page_url ?? null, p_referrer: attribution.referrer ?? null,
      p_utm_source: attribution.utm_source ?? null, p_utm_medium: attribution.utm_medium ?? null, p_utm_campaign: attribution.utm_campaign ?? null, p_utm_content: attribution.utm_content ?? null, p_utm_term: attribution.utm_term ?? null,
    });
    if (error) return json({ error: error.message }, error.message.includes("Rate limit") ? 429 : 400);
    const result = data[0];
    if (result.created) {
      try {
        await notifyAutomation({ lead_id: result.lead_id, ...lead, attribution });
      } catch (error) {
        console.error("Lead created but automation delivery failed", error);
      }
    }
    return json({ lead_id: result.lead_id, created: result.created }, result.created ? 201 : 200);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
  }
});

function validateLead(value: Record<string, unknown>) {
  if (!value || typeof value.nome !== "string" || typeof value.whatsapp !== "string") throw new Error("Invalid lead");
  return { nome: value.nome.trim(), whatsapp: value.whatsapp.trim(), email: text(value.email), empresa: text(value.empresa), funcionarios: typeof value.funcionarios === "number" ? value.funcionarios : undefined };
}
function validateAttribution(value: Record<string, unknown>) {
  if (!value || typeof value.visitor_id !== "string" || typeof value.session_id !== "string") throw new Error("Invalid attribution");
  return { visitor_id: value.visitor_id, session_id: value.session_id, page_url: text(value.page_url), referrer: text(value.referrer), utm_source: text(value.utm_source), utm_medium: text(value.utm_medium), utm_campaign: text(value.utm_campaign), utm_content: text(value.utm_content), utm_term: text(value.utm_term) };
}
function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function clientIp(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"; }
async function fingerprint(value: string) { const bytes = new TextEncoder().encode(value); const hash = await crypto.subtle.digest("SHA-256", bytes); return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function notifyAutomation(payload: Record<string, unknown>) { const url = Deno.env.get("N8N_LEAD_AUTOMATION_URL"); if (!url) return; await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
function json(body: unknown, status: number) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
