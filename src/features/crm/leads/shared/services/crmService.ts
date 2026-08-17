import { supabase } from "@/infra/supabase/client";
import { getErrorMessage, logAppEvent } from "@/lib/appLogger";
import type {
  CrmLead, CrmLeadEvent, CrmLeadEventPayload, CrmLeadNote, CrmLeadTask,
  CrmLeadTaskOverview, CrmOwnerProfile, PipelineStage,
} from "@/features/crm/shared/types/crm";

export interface LeadEventLogResult { ok: boolean; data: CrmLeadEvent | null; errorMessage?: string }

export async function getCrmLeads(): Promise<CrmLead[]> {
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao buscar leads: ${error.message}`);
  return (data ?? []) as CrmLead[];
}

export async function getCrmOwnerProfiles(): Promise<CrmOwnerProfile[]> {
  const { data, error } = await supabase.rpc("get_crm_owner_profiles");
  if (error) throw new Error(`Falha ao buscar responsáveis do CRM: ${error.message}`);
  return (data ?? []) as CrmOwnerProfile[];
}

export async function getCrmLeadById(id: string): Promise<CrmLead> {
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) throw new Error(`Falha ao buscar detalhes do lead: ${error.message}`);
  if (!data) throw new Error("Lead não encontrado");
  return data as CrmLead;
}

/** Kept only for backwards-compatible read/test imports. Writes use audited RPCs below. */
export async function logLeadEvent(leadId: string, eventType: CrmLeadEvent["event_type"], payload: CrmLeadEventPayload = {}): Promise<LeadEventLogResult> {
  const { data, error } = await supabase.from("lead_events").insert([{ lead_id: leadId, event_type: eventType, payload }]).select().single();
  if (error) {
    const errorMessage = getErrorMessage(error, "Falha desconhecida ao registrar evento.");
    logAppEvent("crm.audit", "error", "Falha ao registrar evento de lead", { leadId, eventType, error: errorMessage, payload });
    return { ok: false, data: null, errorMessage };
  }
  return { ok: true, data: (data ?? null) as CrmLeadEvent | null };
}

export async function getLeadEvents(leadId: string): Promise<CrmLeadEvent[]> {
  const { data, error } = await supabase.from("lead_events").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao buscar eventos: ${error.message}`);
  return (data ?? []) as CrmLeadEvent[];
}

export async function getLeadNotes(leadId: string): Promise<CrmLeadNote[]> {
  const { data, error } = await supabase.from("lead_notes").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao buscar notas: ${error.message}`);
  return (data ?? []) as CrmLeadNote[];
}

export async function createLeadNote(leadId: string, content: string, _authorId: string) {
  const { data, error } = await supabase.rpc("create_lead_note_with_audit", { p_lead_id: leadId, p_content: content });
  if (error) throw new Error(`Falha ao criar nota: ${error.message}`);
  return data;
}

export async function getLeadTasks(leadId: string): Promise<CrmLeadTask[]> {
  const { data, error } = await supabase.from("lead_tasks").select("*").eq("lead_id", leadId).order("due_date", { ascending: true });
  if (error) throw new Error(`Falha ao buscar tarefas: ${error.message}`);
  return (data ?? []) as CrmLeadTask[];
}

export async function getLeadTasksOverview(): Promise<CrmLeadTaskOverview[]> {
  const { data, error } = await supabase.from("lead_tasks").select("id,lead_id,assignee_id,title,due_date,completed").order("due_date", { ascending: true });
  if (error) throw new Error(`Falha ao buscar visão operacional de tarefas: ${error.message}`);
  return (data ?? []) as CrmLeadTaskOverview[];
}

export async function createLeadTask(task: { lead_id: string; title: string; due_date: string; assignee_id: string }) {
  const { data, error } = await supabase.rpc("create_lead_task_with_audit", {
    p_lead_id: task.lead_id, p_title: task.title, p_due_date: task.due_date, p_assignee_id: task.assignee_id,
  });
  if (error) throw new Error(`Falha ao criar tarefa: ${error.message}`);
  return data;
}

export async function updateTaskStatus(taskId: string, completed: boolean) {
  const { data, error } = await supabase.rpc("update_task_status_with_audit", { p_task_id: taskId, p_completed: completed });
  if (error) throw new Error(`Falha ao atualizar tarefa: ${error.message}`);
  return data;
}

export async function updateLeadPipelineStage(leadId: string, nextStage: PipelineStage) {
  const { data, error } = await supabase.rpc("update_lead_pipeline_stage", { p_lead_id: leadId, p_next_stage: nextStage });
  if (error) throw new Error(`Falha ao atualizar etapa do lead: ${error.message}`);
  return data as CrmLead;
}

export async function closeLeadAsWon(leadId: string, lifetimeValue: number) {
  const { data, error } = await supabase.rpc("close_lead_as_won", { p_lead_id: leadId, p_lifetime_value: lifetimeValue });
  if (error) throw new Error(`Falha ao concluir lead como ganho: ${error.message}`);
  return data as CrmLead;
}

export async function closeLeadAsLost(leadId: string, lostReason: string) {
  const { data, error } = await supabase.rpc("close_lead_as_lost", { p_lead_id: leadId, p_lost_reason: lostReason });
  if (error) throw new Error(`Falha ao concluir lead como perdido: ${error.message}`);
  return data as CrmLead;
}

export async function updateLeadOwner(leadId: string, nextOwnerId: string | null, _options?: { previousOwnerLabel?: string; nextOwnerLabel?: string }) {
  const { data, error } = await supabase.rpc("update_lead_owner", { p_lead_id: leadId, p_owner_id: nextOwnerId });
  if (error) throw new Error(`Falha ao atualizar responsável do lead: ${error.message}`);
  return data as CrmLead;
}
