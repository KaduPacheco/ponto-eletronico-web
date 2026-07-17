import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/features/crm/auth/hooks/useAuth";
import { useLeadWorkspace } from "@/features/crm/leads/detail/hooks/useLeadWorkspace";
import LeadDetailHeader from "@/features/crm/leads/detail/components/LeadDetailHeader";
import LeadIdentityCard from "@/features/crm/leads/detail/components/LeadIdentityCard";
import LeadOperationalSummaryAside from "@/features/crm/leads/detail/components/LeadOperationalSummaryAside";
import LeadPipelineOwnershipPanel from "@/features/crm/leads/detail/components/LeadPipelineOwnershipPanel";
import LeadQuickNoteCard from "@/features/crm/leads/detail/components/LeadQuickNoteCard";
import LeadTasksPanel from "@/features/crm/leads/detail/components/LeadTasksPanel";
import LeadTimelinePanel from "@/features/crm/leads/detail/components/LeadTimelinePanel";
import { useLeadDetailDrafts } from "@/features/crm/leads/detail/hooks/useLeadDetailDrafts";
import { selectLeadDetailViewModel } from "@/features/crm/leads/detail/selectors/leadDetailSelectors";
import type { PipelineStage } from "@/features/crm/shared/types/crm";

const LeadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const drafts = useLeadDetailDrafts();
  const {
    permissions,
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
  } = useLeadWorkspace(id);

  const lead = leadQuery.data;
  const tasks = tasksQuery.data ?? [];
  const viewModel = useMemo(
    () => selectLeadDetailViewModel({
      lead,
      tasks: tasksQuery.data,
      ownerIds: ownerIdsQuery.data,
      notes: notesQuery.data,
      events: eventsQuery.data,
      currentUser: user,
    }),
    [eventsQuery.data, lead, notesQuery.data, ownerIdsQuery.data, tasksQuery.data, user],
  );

  const handleAddNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!drafts.newNote.trim() || !user?.id) {
      return;
    }

    noteMutation.mutate(drafts.newNote, {
      onSuccess: () => {
        drafts.resetNewNote();
      },
    });
  };

  const handleAddTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!drafts.taskTitle.trim() || !drafts.taskDate || !user?.id) {
      return;
    }

    taskMutation.mutate(
      {
        title: drafts.taskTitle,
        dueDate: drafts.taskDate,
      },
      {
        onSuccess: () => {
          drafts.resetTaskDraft();
        },
      },
    );
  };

  const handleStageChange = (nextStage: PipelineStage) => {
    stageMutation.mutate(nextStage);
  };

  const handleOwnerChange = (nextOwnerId: string | null) => {
    if (!lead || nextOwnerId === lead.owner_id) {
      return;
    }

    const nextOwnerOption = viewModel.ownerOptions.find((option) => option.id === nextOwnerId);

    ownerMutation.mutate({
      nextOwnerId,
      previousOwnerLabel: lead.owner_id ? viewModel.currentOwnerLabel : undefined,
      nextOwnerLabel: nextOwnerOption?.displayLabel,
    });
  };

  if (leadQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <div className="rounded-[28px] border border-border/70 bg-card p-12 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">Carregando dossie comercial...</p>
        </div>
      </div>
    );
  }

  if (leadQuery.isError || !lead) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-12 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-4 text-lg font-semibold text-foreground">Não foi possível carregar o lead</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {leadQuery.isError ? (leadQuery.error as Error).message : "Lead não encontrado."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-8">
      <LeadDetailHeader lead={lead} currentOwnerLabel={viewModel.currentOwnerLabel} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr),340px]">
        <div className="space-y-6">
          <LeadIdentityCard lead={lead} currentOwnerLabel={viewModel.currentOwnerLabel} />

          <LeadPipelineOwnershipPanel
            lead={lead}
            currentStage={viewModel.currentStage}
            currentStageLabel={viewModel.currentStageLabel}
            currentStageDescription={viewModel.currentStageDescription}
            currentOwnerLabel={viewModel.currentOwnerLabel}
            selectedStageValue={viewModel.selectedStageValue}
            ownerOptions={viewModel.ownerOptions}
            ownerIdsError={ownerIdsQuery.isError}
            taskSummary={viewModel.taskSummary}
            nextTaskHelper={viewModel.nextTaskHelper}
            openTasksHelper={viewModel.openTasksHelper}
            canEditLead={permissions.canEditLead}
            stageMutationPending={stageMutation.isPending}
            ownerMutationPending={ownerMutation.isPending}
            onStageChange={handleStageChange}
            onOwnerChange={handleOwnerChange}
          />

          <LeadTasksPanel
            tasks={tasks}
            loading={tasksQuery.isLoading}
            taskTitle={drafts.taskTitle}
            taskDate={drafts.taskDate}
            taskMutationPending={taskMutation.isPending}
            canManageTasks={permissions.canManageTasks && Boolean(user?.id)}
            onTaskTitleChange={drafts.setTaskTitle}
            onTaskDateChange={drafts.setTaskDate}
            onSubmitTask={handleAddTask}
            onToggleTask={(taskId, completed) => toggleTaskMutation.mutate({ taskId, completed })}
          />

          <LeadTimelinePanel
            timelineItems={viewModel.timelineItems}
            loading={notesQuery.isLoading || eventsQuery.isLoading}
          />
        </div>

        <aside className="space-y-6">
          <LeadQuickNoteCard
            newNote={drafts.newNote}
            canSaveNote={permissions.canSaveNote && Boolean(user?.id)}
            noteMutationPending={noteMutation.isPending}
            onNewNoteChange={drafts.setNewNote}
            onSubmitNote={handleAddNote}
          />
          <LeadOperationalSummaryAside lead={lead} currentOwnerLabel={viewModel.currentOwnerLabel} />
        </aside>
      </div>
    </div>
  );
};

export default LeadDetailPage;
