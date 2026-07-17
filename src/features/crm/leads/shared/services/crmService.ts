import { supabase } from "@/infra/supabase/client";
import { getErrorMessage, logAppEvent } from "@/lib/appLogger";
import type {
  CrmLead,
  CrmLeadEvent,
  CrmLeadEventPayload,
  CrmLeadNote,
  CrmLeadTask,
  CrmLeadTaskOverview,
  PipelineStage,
} from "@/features/crm/shared/types/crm";

interface LeadStageLookup {
  id: string;
  pipeline_stage: PipelineStage | null;
  status: string;
}

interface LeadOwnerLookup {
  id: string;
  owner_id: string | null;
}

export interface LeadEventLogResult {
  ok: boolean;
  data: CrmLeadEvent | null;
  errorMessage?: string;
}

export async function getCrmLeads(): Promise<CrmLead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar leads: ${error.message}`);
  }

  return (data ?? []) as CrmLead[];
}

export async function getCrmOwnerIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("owner_id")
    .not("owner_id", "is", null);

  if (error) {
    throw new Error(`Falha ao buscar owners do CRM: ${error.message}`);
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map((record) => record.owner_id)
        .filter((ownerId): ownerId is string => typeof ownerId === "string" && ownerId.trim().length > 0),
    ),
  );
}

export async function getCrmLeadById(id: string): Promise<CrmLead> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Falha ao buscar detalhes do lead: ${error.message}`);
  }

  if (!data) {
    throw new Error("Lead não encontrado");
  }

  return data as CrmLead;
}

export async function logLeadEvent(
  leadId: string,
  eventType: CrmLeadEvent["event_type"],
  payload: CrmLeadEventPayload = {},
): Promise<LeadEventLogResult> {
  const { data, error } = await supabase
    .from("lead_events")
    .insert([{ lead_id: leadId, event_type: eventType, payload }])
    .select()
    .single();

  if (error) {
    const errorMessage = getErrorMessage(error, "Falha desconhecida ao registrar evento.");

    logAppEvent("crm.audit", "error", "Falha ao registrar evento de lead", {
      leadId,
      eventType,
      error: errorMessage,
      payload,
    });

    return {
      ok: false,
      data: null,
      errorMessage,
    };
  }

  return {
    ok: true,
    data: (data ?? null) as CrmLeadEvent | null,
  };
}

export async function getLeadEvents(leadId: string): Promise<CrmLeadEvent[]> {
  const { data, error } = await supabase
    .from("lead_events")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar eventos: ${error.message}`);
  }

  return (data ?? []) as CrmLeadEvent[];
}

export async function getLeadNotes(leadId: string): Promise<CrmLeadNote[]> {
  const { data, error } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar notas: ${error.message}`);
  }

  return (data ?? []) as CrmLeadNote[];
}

export async function createLeadNote(leadId: string, content: string, authorId: string) {
  const { data, error } = await supabase
    .from("lead_notes")
    .insert([
      {
        lead_id: leadId,
        content,
        author_id: authorId,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao criar nota: ${error.message}`);
  }

  const auditResult = await logLeadEvent(leadId, "note_added", { content_preview: content.substring(0, 80) });
  warnWhenLeadAuditFails("note_added", leadId, auditResult);

  return data;
}

export async function getLeadTasks(leadId: string): Promise<CrmLeadTask[]> {
  const { data, error } = await supabase
    .from("lead_tasks")
    .select("*")
    .eq("lead_id", leadId)
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(`Falha ao buscar tarefas: ${error.message}`);
  }

  return (data ?? []) as CrmLeadTask[];
}

export async function getLeadTasksOverview(): Promise<CrmLeadTaskOverview[]> {
  const { data, error } = await supabase
    .from("lead_tasks")
    .select("id,lead_id,assignee_id,title,due_date,completed")
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(`Falha ao buscar visão operacional de tarefas: ${error.message}`);
  }

  return (data ?? []) as CrmLeadTaskOverview[];
}

export async function createLeadTask(task: {
  lead_id: string;
  title: string;
  due_date: string;
  assignee_id: string;
}) {
  const { data, error } = await supabase
    .from("lead_tasks")
    .insert([task])
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao criar tarefa: ${error.message}`);
  }

  const auditResult = await logLeadEvent(task.lead_id, "task_added", { title: task.title, due_date: task.due_date });
  warnWhenLeadAuditFails("task_added", task.lead_id, auditResult);

  return data;
}

export async function updateTaskStatus(taskId: string, completed: boolean) {
  const { data, error } = await supabase
    .from("lead_tasks")
    .update({ completed, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao atualizar tarefa: ${error.message}`);
  }

  const eventType = completed ? "task_completed" : "task_reopened";
  const auditResult = await logLeadEvent(data.lead_id, eventType, { title: data.title });
  warnWhenLeadAuditFails(eventType, data.lead_id, auditResult);

  return data;
}

export async function updateLeadPipelineStage(leadId: string, nextStage: PipelineStage) {
  const currentLead = await getLeadStageLookup(leadId);
  const previousStage = normalizeLeadStage(currentLead.pipeline_stage, currentLead.status);

  const { data, error } = await supabase
    .from("leads")
    .update({
      pipeline_stage: nextStage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Falha ao atualizar etapa do lead: ${error.message}`);
  }

  if (previousStage !== nextStage) {
    const auditResult = await logLeadEvent(leadId, "pipeline_change", {
      previous_stage: previousStage,
      next_stage: nextStage,
    });
    warnWhenLeadAuditFails("pipeline_change", leadId, auditResult);
  }

  return data as CrmLead;
}

export async function updateLeadOwner(
  leadId: string,
  nextOwnerId: string | null,
  options?: {
    previousOwnerLabel?: string;
    nextOwnerLabel?: string;
  },
) {
  const currentLead = await getLeadOwnerLookup(leadId);

  const { data, error } = await supabase
    .from("leads")
    .update({
      owner_id: nextOwnerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Falha ao atualizar responsável do lead: ${error.message}`);
  }

  if (currentLead.owner_id !== nextOwnerId) {
    const auditResult = await logLeadEvent(leadId, "owner_changed", {
      previous_owner_id: currentLead.owner_id,
      next_owner_id: nextOwnerId,
      previous_owner_label: options?.previousOwnerLabel ?? null,
      next_owner_label: options?.nextOwnerLabel ?? null,
    });
    warnWhenLeadAuditFails("owner_changed", leadId, auditResult);
  }

  return data as CrmLead;
}

async function getLeadStageLookup(leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("id,pipeline_stage,status")
    .eq("id", leadId)
    .single();

  if (error) {
    throw new Error(`Falha ao ler etapa atual do lead: ${error.message}`);
  }

  return data as LeadStageLookup;
}

async function getLeadOwnerLookup(leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("id,owner_id")
    .eq("id", leadId)
    .single();

  if (error) {
    throw new Error(`Falha ao ler ownership atual do lead: ${error.message}`);
  }

  return data as LeadOwnerLookup;
}

function normalizeLeadStage(pipelineStage: PipelineStage | null, status: string) {
  if (pipelineStage) {
    return pipelineStage;
  }

  const normalizedStatus = status.trim().toLowerCase();

  if (
    normalizedStatus === "novo"
    || normalizedStatus === "em_contato"
    || normalizedStatus === "qualificado"
    || normalizedStatus === "ganho"
    || normalizedStatus === "perdido"
  ) {
    return normalizedStatus as PipelineStage;
  }

  return null;
}

function warnWhenLeadAuditFails(
  eventType: CrmLeadEvent["event_type"],
  leadId: string,
  auditResult: LeadEventLogResult,
) {
  if (auditResult.ok) {
    return;
  }

  logAppEvent("crm.audit", "warn", "Operação concluída sem persistir trilha de auditoria", {
    leadId,
    eventType,
    error: auditResult.errorMessage,
  });
}
