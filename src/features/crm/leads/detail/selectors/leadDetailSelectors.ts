import type { User } from "@supabase/supabase-js";
import type { CrmLead, CrmLeadEvent, CrmLeadNote, CrmLeadTask, CrmOwnerOption, CrmOwnerProfile, PipelineStage } from "@/types/crm";
import { buildLeadTimelineItems } from "@/lib/crmTimeline";
import { buildOwnerLabelMap, buildOwnerOptionsFromProfiles, getOwnerDisplayLabel } from "@/lib/crmLeadPresentation/owners";
import {
  PIPELINE_STAGE_OPTIONS,
  getLeadStageOptionLabel,
  getLeadStageValue,
} from "@/lib/crmLeadPresentation/stages";
import { buildLeadTaskSummary, formatTaskDueDate } from "@/lib/crmLeadPresentation/taskSummary";

export interface LeadDetailViewModel {
  taskSummary: ReturnType<typeof buildLeadTaskSummary>;
  ownerOptions: CrmOwnerOption[];
  ownerLabelMap: ReadonlyMap<string, string>;
  timelineItems: ReturnType<typeof buildLeadTimelineItems>;
  currentStage: PipelineStage | "without_stage";
  currentOwnerLabel: string;
  selectedStageValue: PipelineStage | "";
  currentStageLabel: string;
  currentStageDescription: string;
  nextTaskHelper: string;
  openTasksHelper: string;
  slaHelper: string;
  slaTone: "neutral" | "danger";
}

export function selectLeadDetailViewModel(params: {
  lead: CrmLead | null | undefined;
  tasks: CrmLeadTask[] | undefined;
  ownerProfiles: CrmOwnerProfile[] | undefined;
  notes: CrmLeadNote[] | undefined;
  events: CrmLeadEvent[] | undefined;
  currentUser: Pick<User, "id" | "email" | "user_metadata"> | null | undefined;
}): LeadDetailViewModel {
  const { lead, tasks, ownerProfiles, notes, events, currentUser } = params;
  const taskSummary = buildLeadTaskSummary(tasks ?? []);
  const ownerOptions = buildOwnerOptionsFromProfiles(ownerProfiles ?? [], currentUser);
  const ownerLabelMap = buildOwnerLabelMap(ownerOptions);
  const timelineItems = buildLeadTimelineItems(notes ?? [], events ?? [], ownerLabelMap, currentUser?.id);
  const currentStage = getLeadStageValue(lead ?? { pipeline_stage: null, status: "novo" });
  const currentOwnerLabel = getOwnerDisplayLabel(lead?.owner_id ?? null, currentUser?.id, ownerLabelMap);
  const selectedStageValue = currentStage === "without_stage" ? "" : currentStage;
  const currentStageLabel = currentStage === "without_stage" ? "Sem etapa" : getLeadStageOptionLabel(currentStage);
  const currentStageDescription = currentStage === "without_stage"
    ? "Este lead ainda não foi classificado no funil comercial."
    : PIPELINE_STAGE_OPTIONS.find((stage) => stage.value === currentStage)?.description ?? "";

  return {
    taskSummary,
    ownerOptions,
    ownerLabelMap,
    timelineItems,
    currentStage,
    currentOwnerLabel,
    selectedStageValue,
    currentStageLabel,
    currentStageDescription,
    nextTaskHelper: taskSummary.nextTask
      ? `Ate ${formatTaskDueDate(taskSummary.nextTask.due_date)}`
      : "Crie uma tarefa para definir o proximo passo.",
    openTasksHelper: `${taskSummary.overdueCount} vencidas`,
    slaHelper: getSlaHelper(lead?.sla_due_at),
    slaTone: isSlaOverdue(lead?.sla_due_at) ? "danger" : "neutral",
  };
}

function isSlaOverdue(slaDueAt?: string | null) {
  return Boolean(slaDueAt && new Date(slaDueAt).getTime() < Date.now());
}

function getSlaHelper(slaDueAt?: string | null) {
  if (!slaDueAt) return "SLA será definido ao entrar na operação comercial.";
  return isSlaOverdue(slaDueAt)
    ? `SLA vencido em ${formatTaskDueDate(slaDueAt)}`
    : `SLA até ${formatTaskDueDate(slaDueAt)}`;
}
