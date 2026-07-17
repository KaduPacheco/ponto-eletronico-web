import { PIPELINE_ORDER } from "@/services/dashboard/dashboard.constants";
import { DashboardAnalyticsEventRecord, DashboardEventRecord, DashboardLeadRecord } from "@/services/dashboard/dashboard.api";

export function getLeadStageKey(lead: Pick<DashboardLeadRecord, "pipeline_stage" | "status">) {
  const rawValue = (lead.pipeline_stage || lead.status || "").trim().toLowerCase();
  return rawValue || "sem_estagio";
}

export function getLeadStageLabel(lead: Pick<DashboardLeadRecord, "pipeline_stage" | "status">) {
  return getStageLabelFromKey(getLeadStageKey(lead));
}

export function getStageLabelFromKey(stageKey: string) {
  switch (stageKey) {
    case "novo":
      return "Novo";
    case "em_contato":
      return "Em contato";
    case "qualificado":
      return "Qualificado";
    case "ganho":
      return "Ganho";
    case "perdido":
      return "Perdido";
    default:
      return stageKey === "sem_estagio" ? "Sem estágio" : toTitleCase(stageKey);
  }
}

export function getSourceLabel(source: string | null | undefined) {
  const normalized = (source || "").trim();
  return normalized || "Não informado";
}

export function getEventTitle(eventType: string) {
  switch (eventType) {
    case "lead_created":
      return "Lead capturado";
    case "note_added":
      return "Nota registrada";
    case "task_added":
      return "Follow-up agendado";
    case "task_completed":
      return "Tarefa concluída";
    case "task_reopened":
      return "Tarefa reaberta";
    case "status_change":
      return "Status atualizado";
    case "pipeline_change":
      return "Estagio atualizado";
    case "owner_changed":
      return "Ownership ajustado";
    default:
      return toTitleCase(eventType);
  }
}

export function getEventDescription(event: DashboardEventRecord) {
  const taskTitle = getPayloadString(event.payload, "title");
  const contentPreview = getPayloadString(event.payload, "content_preview");
  const nextStatus = getPayloadString(event.payload, "to");
  const previousStage = getPayloadString(event.payload, "previous_stage");
  const nextStage = getPayloadString(event.payload, "next_stage");
  const previousOwnerLabel = getPayloadString(event.payload, "previous_owner_label");
  const nextOwnerLabel = getPayloadString(event.payload, "next_owner_label");
  const nextOwnerId = getPayloadString(event.payload, "next_owner_id");

  switch (event.event_type) {
    case "lead_created":
      return "Novo lead entrou no CRM e já está disponível para acompanhamento.";
    case "note_added":
      return contentPreview ? `Resumo da nota: ${contentPreview}` : "Uma anotação interna foi adicionada ao lead.";
    case "task_added":
      return taskTitle ? `Nova tarefa criada: ${taskTitle}` : "Uma nova tarefa foi criada para este lead.";
    case "task_completed":
      return taskTitle ? `Tarefa concluída: ${taskTitle}` : "Uma tarefa foi concluída.";
    case "task_reopened":
      return taskTitle ? `Tarefa reaberta: ${taskTitle}` : "Uma tarefa voltou para a fila de execução.";
    case "status_change":
      return nextStatus ? `Novo estado registrado: ${toTitleCase(nextStatus)}` : "Houve atualização no status comercial.";
    case "pipeline_change":
      if (previousStage && nextStage) {
        return `${toTitleCase(previousStage)} -> ${toTitleCase(nextStage)}`;
      }

      if (nextStage) {
        return `Lead classificado em ${toTitleCase(nextStage)}.`;
      }

      return "Houve atualização no pipeline comercial.";
    case "owner_changed":
      if (previousOwnerLabel && nextOwnerLabel) {
        return `${previousOwnerLabel} -> ${nextOwnerLabel}`;
      }

      if (nextOwnerLabel) {
        return `Lead atribuído para ${nextOwnerLabel}.`;
      }

      if (nextOwnerId) {
        return `Lead atribuído para responsável ${nextOwnerId.slice(0, 8)}.`;
      }

      return "Ownership atualizado para fila sem responsável.";
    default:
      return "Atividade registrada automaticamente pelo CRM.";
  }
}

export function getAnalyticsEventLabel(eventType: string) {
  switch (eventType) {
    case "page_view":
      return "Page view";
    case "cta_click":
      return "CTA click";
    case "lead_form_start":
      return "Início do formulário";
    case "lead_form_submit_attempt":
      return "Tentativa de envio";
    case "lead_form_submit_success":
      return "Envio com sucesso";
    default:
      return toTitleCase(eventType);
  }
}

export function getAnalyticsSourceLabel(event: DashboardAnalyticsEventRecord) {
  const utmSource = (event.utm_source || "").trim();

  if (utmSource) {
    return `UTM: ${utmSource}`;
  }

  const referrer = (event.referrer || "").trim();

  if (!referrer) {
    return "Direto";
  }

  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer;
  }
}

export function sortPipelineEntries(a: string, b: string) {
  const aIndex = PIPELINE_ORDER.indexOf(a);
  const bIndex = PIPELINE_ORDER.indexOf(b);

  if (aIndex === -1 && bIndex === -1) {
    return a.localeCompare(b);
  }

  if (aIndex === -1) {
    return 1;
  }

  if (bIndex === -1) {
    return -1;
  }

  return aIndex - bIndex;
}

export function getDateKey(value: string) {
  return value.slice(0, 10);
}

export function formatSeriesLabel(dateKey: string) {
  const [, month, day] = dateKey.split("-");

  return `${day}/${month}`;
}

export function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getPayloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
