import { CrmLead } from "@/types/crm";
import { getLeadStageValue } from "@/lib/crmLeadPresentation/stages";
import { LeadTaskStatusSummary } from "@/lib/crmLeadPresentation/taskSummary";

export interface LeadOperationalPriority {
  label: string;
  helper: string;
  tone: "danger" | "warning" | "success" | "neutral" | "muted";
}

export function getLeadOperationalPriority(
  row: { lead: Pick<CrmLead, "owner_id" | "pipeline_stage" | "status">; taskSummary: LeadTaskStatusSummary },
): LeadOperationalPriority {
  const stageValue = getLeadStageValue(row.lead);

  if (row.taskSummary.overdueCount > 0) {
    return {
      label: "Acao imediata",
      helper: `${row.taskSummary.overdueCount} follow-ups vencidos.`,
      tone: "danger",
    };
  }

  if (!row.lead.owner_id) {
    return {
      label: "Distribuir owner",
      helper: "Lead ainda sem responsável definido.",
      tone: "warning",
    };
  }

  if (stageValue === "without_stage") {
    return {
      label: "Classificar etapa",
      helper: "Lead precisa entrar formalmente no pipeline.",
      tone: "warning",
    };
  }

  if (!row.taskSummary.nextTask && stageValue !== "ganho" && stageValue !== "perdido") {
    return {
      label: "Definir próxima ação",
      helper: "Nao há follow-up aberto no momento.",
      tone: "warning",
    };
  }

  if (stageValue === "ganho") {
    return {
      label: "Negocio ganho",
      helper: "Lead convertido com sucesso.",
      tone: "success",
    };
  }

  if (stageValue === "perdido") {
    return {
      label: "Encerrado",
      helper: "Oportunidade perdida no funil.",
      tone: "muted",
    };
  }

  return {
    label: "Em andamento",
    helper: row.taskSummary.nextTask ? "Lead com fluxo comercial ativo." : "Lead com ownership definido.",
    tone: "neutral",
  };
}
