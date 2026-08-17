import { CrmLead, PipelineStage } from "@/types/crm";

export const PIPELINE_STAGE_ORDER: PipelineStage[] = ["novo", "contato", "diagnostico", "demonstracao", "proposta", "negociacao", "ganho", "perdido"];

export const PIPELINE_STAGE_OPTIONS: Array<{ value: PipelineStage; label: string; description: string }> = [
  { value: "novo", label: "Novo", description: "Lead recém-capturado aguardando primeiro contato." },
  { value: "contato", label: "Contato", description: "Primeira abordagem e entendimento inicial do cenário." },
  { value: "diagnostico", label: "Diagnóstico", description: "Necessidade, fit e contexto operacional validados." },
  { value: "demonstracao", label: "Demonstração", description: "Demonstração orientada ao cenário do lead." },
  { value: "proposta", label: "Proposta", description: "Proposta comercial apresentada e em avaliação." },
  { value: "negociacao", label: "Negociação", description: "Condições comerciais em negociação." },
  { value: "ganho", label: "Ganho", description: "Oportunidade convertida em negócio." },
  { value: "perdido", label: "Perdido", description: "Lead encerrado sem avançar no funil." },
];

export type LeadStageFilter = "all" | PipelineStage | "without_stage";

const STAGE_LABELS: Record<PipelineStage, string> = {
  novo: "Novo", contato: "Contato", diagnostico: "Diagnóstico", demonstracao: "Demonstração",
  proposta: "Proposta", negociacao: "Negociação", ganho: "Ganho", perdido: "Perdido",
};

const STAGE_BADGE_STYLES: Record<PipelineStage | "without_stage", string> = {
  novo: "border-primary/20 bg-primary/10 text-primary",
  contato: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  diagnostico: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  demonstracao: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  proposta: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  negociacao: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  ganho: "border-secondary/20 bg-secondary/10 text-secondary",
  perdido: "border-destructive/20 bg-destructive/10 text-destructive",
  without_stage: "border-border bg-muted text-muted-foreground",
};

export function getLeadStageValue(lead: Pick<CrmLead, "pipeline_stage" | "status">): PipelineStage | "without_stage" {
  const rawValue = (lead.pipeline_stage || lead.status || "").trim().toLowerCase();
  if (rawValue in STAGE_LABELS) return rawValue as PipelineStage;
  return "without_stage";
}

export function getLeadStageLabel(lead: Pick<CrmLead, "pipeline_stage" | "status">) {
  const stage = getLeadStageValue(lead);
  return stage === "without_stage" ? "Sem etapa" : STAGE_LABELS[stage];
}

export function getLeadStageBadgeClassName(lead: Pick<CrmLead, "pipeline_stage" | "status">) {
  return STAGE_BADGE_STYLES[getLeadStageValue(lead)];
}

export function getLeadStageOptionLabel(stage: PipelineStage) {
  return STAGE_LABELS[stage];
}
