import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/crm/auth/hooks/useAuth";
import type { AuthPermission } from "@/features/crm/auth/lib/authAccess";
import {
  createLeadNote,
  createLeadTask,
  getCrmLeadById,
  getCrmOwnerIds,
  getLeadEvents,
  getLeadNotes,
  getLeadTasks,
  updateLeadOwner,
  updateLeadPipelineStage,
  updateTaskStatus,
} from "@/features/crm/leads/shared/services/crmService";
import { CRM_QUERY_KEYS } from "@/features/crm/shared/queryKeys/crmQueryKeys";
import type { PipelineStage } from "@/features/crm/shared/types/crm";
import { getErrorMessage, logAppEvent } from "@/lib/appLogger";
import { useToast } from "@/hooks/useToast";

interface UpdateLeadOwnerInput {
  nextOwnerId: string | null;
  previousOwnerLabel?: string;
  nextOwnerLabel?: string;
}

interface CreateLeadTaskInput {
  title: string;
  dueDate: string;
}

export function useLeadWorkspace(leadId?: string) {
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canEditLead = hasPermission("crm:leads:write");
  const canSaveNote = hasPermission("crm:notes:write");
  const canManageTasks = hasPermission("crm:tasks:write");

  const leadQuery = useQuery({
    queryKey: CRM_QUERY_KEYS.lead(leadId),
    queryFn: () => getCrmLeadById(leadId!),
    enabled: Boolean(leadId),
  });

  const ownerIdsQuery = useQuery({
    queryKey: CRM_QUERY_KEYS.ownerIds,
    queryFn: getCrmOwnerIds,
    enabled: Boolean(leadId),
  });

  const notesQuery = useQuery({
    queryKey: CRM_QUERY_KEYS.leadNotes(leadId),
    queryFn: () => getLeadNotes(leadId!),
    enabled: Boolean(leadId),
  });

  const eventsQuery = useQuery({
    queryKey: CRM_QUERY_KEYS.leadEvents(leadId),
    queryFn: () => getLeadEvents(leadId!),
    enabled: Boolean(leadId),
  });

  const tasksQuery = useQuery({
    queryKey: CRM_QUERY_KEYS.leadTasks(leadId),
    queryFn: () => getLeadTasks(leadId!),
    enabled: Boolean(leadId),
  });

  const noteMutation = useMutation({
    mutationFn: async (content: string) => {
      ensureLeadMutationPreconditions(leadId, user?.id);
      ensureLeadPermission("crm:notes:write", canSaveNote);
      return createLeadNote(leadId!, content, user!.id);
    },
    onSuccess: () => {
      invalidateLeadWorkspace(queryClient, leadId);
      toast({ title: "Nota adicionada" });
    },
    onError: (error) => {
      reportLeadMutationError("Não foi possível salvar a nota.", error, leadId, toast);
    },
  });

  const taskMutation = useMutation({
    mutationFn: async ({ title, dueDate }: CreateLeadTaskInput) => {
      ensureLeadMutationPreconditions(leadId, user?.id);
      ensureLeadPermission("crm:tasks:write", canManageTasks);
      return createLeadTask({
        lead_id: leadId!,
        title,
        due_date: dueDate,
        assignee_id: user!.id,
      });
    },
    onSuccess: () => {
      invalidateLeadWorkspace(queryClient, leadId);
      queryClient.invalidateQueries({ queryKey: CRM_QUERY_KEYS.leadsTaskOverview });
      toast({ title: "Follow-up agendado" });
    },
    onError: (error) => {
      reportLeadMutationError("Não foi possível agendar o follow-up.", error, leadId, toast);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      ensureLeadPermission("crm:tasks:write", canManageTasks);
      return updateTaskStatus(taskId, completed);
    },
    onSuccess: () => {
      invalidateLeadWorkspace(queryClient, leadId);
      queryClient.invalidateQueries({ queryKey: CRM_QUERY_KEYS.leadsTaskOverview });
    },
    onError: (error) => {
      reportLeadMutationError("Não foi possível atualizar a tarefa.", error, leadId, toast);
    },
  });

  const stageMutation = useMutation({
    mutationFn: (nextStage: PipelineStage) => {
      ensureLeadMutationPreconditions(leadId, user?.id);
      ensureLeadPermission("crm:leads:write", canEditLead);
      return updateLeadPipelineStage(leadId!, nextStage);
    },
    onSuccess: () => {
      invalidateLeadWorkspace(queryClient, leadId);
      queryClient.invalidateQueries({ queryKey: CRM_QUERY_KEYS.leads });
      toast({ title: "Etapa atualizada" });
    },
    onError: (error) => {
      reportLeadMutationError("Não foi possível atualizar a etapa.", error, leadId, toast);
    },
  });

  const ownerMutation = useMutation({
    mutationFn: (input: UpdateLeadOwnerInput) => {
      ensureLeadMutationPreconditions(leadId, user?.id);
      ensureLeadPermission("crm:leads:write", canEditLead);
      return updateLeadOwner(leadId!, input.nextOwnerId, {
        previousOwnerLabel: input.previousOwnerLabel,
        nextOwnerLabel: input.nextOwnerLabel,
      });
    },
    onSuccess: (_, variables) => {
      invalidateLeadWorkspace(queryClient, leadId);
      queryClient.invalidateQueries({ queryKey: CRM_QUERY_KEYS.leads });
      queryClient.invalidateQueries({ queryKey: CRM_QUERY_KEYS.ownerIds });
      toast({ title: variables.nextOwnerId ? "Lead atribuído" : "Ownership removido" });
    },
    onError: (error) => {
      reportLeadMutationError("Não foi possível atualizar o ownership.", error, leadId, toast);
    },
  });

  return {
    user,
    permissions: {
      canEditLead,
      canSaveNote,
      canManageTasks,
    },
    leadQuery,
    ownerIdsQuery,
    notesQuery,
    eventsQuery,
    tasksQuery,
    noteMutation,
    taskMutation,
    toggleTaskMutation,
    stageMutation,
    ownerMutation,
  };
}

function ensureLeadMutationPreconditions(leadId?: string, userId?: string) {
  if (!leadId) {
    throw new Error("Lead não informado para a operação.");
  }

  if (!userId) {
    throw new Error("Sessão autenticada obrigatória para esta operação.");
  }
}

function ensureLeadPermission(permission: AuthPermission, allowed: boolean) {
  if (!allowed) {
    throw new Error(getLeadPermissionMessage(permission));
  }
}

function getLeadPermissionMessage(permission: AuthPermission) {
  switch (permission) {
    case "crm:leads:write":
      return "Você não possui permissão para editar etapa ou ownership deste lead.";
    case "crm:notes:write":
      return "Você não possui permissão para salvar anotações neste lead.";
    case "crm:tasks:write":
      return "Você não possui permissão para gerenciar tarefas deste lead.";
    default:
      return "Você não possui permissão para concluir esta operação.";
  }
}

function reportLeadMutationError(
  title: string,
  error: unknown,
  leadId: string | undefined,
  toast: ReturnType<typeof useToast>["toast"],
) {
  const description = getErrorMessage(error, "Tente novamente em instantes.");

  logAppEvent("crm.lead-workspace", "warn", title, {
    leadId,
    error: description,
  });

  toast({
    title,
    description,
    variant: "destructive",
  });
}

function invalidateLeadWorkspace(queryClient: ReturnType<typeof useQueryClient>, leadId?: string) {
  CRM_QUERY_KEYS.leadWorkspace(leadId).forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}
