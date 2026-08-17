export const PIPELINE_COLORS: Record<string, string> = {
  novo: "#2563eb",
  contato: "#0ea5e9",
  diagnostico: "#d97706",
  demonstracao: "#7c3aed",
  proposta: "#ea580c",
  negociacao: "#0891b2",
  em_contato: "#f59e0b",
  qualificado: "#0f766e",
  ganho: "#16a34a",
  perdido: "#dc2626",
  sem_estagio: "#94a3b8",
};

export const SOURCE_COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#ea580c", "#dc2626", "#0891b2", "#64748b"];
export const ANALYTICS_FUNNEL_COLORS = ["#2563eb", "#0f766e", "#f59e0b", "#7c3aed", "#16a34a"];
export const ANALYTICS_FETCH_PAGE_SIZE = 1000;
export const ANALYTICS_FETCH_MAX_RECORDS = 5000;

export const PIPELINE_ORDER = ["novo", "contato", "diagnostico", "demonstracao", "proposta", "negociacao", "ganho", "perdido", "sem_estagio"];
export const ANALYTICS_FUNNEL_ORDER = [
  "page_view",
  "cta_click",
  "lead_form_start",
  "lead_form_submit_attempt",
  "lead_form_submit_success",
] as const;
