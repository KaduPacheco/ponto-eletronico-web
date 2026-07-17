import { Calendar, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatTaskDueDate } from "@/lib/crmLeadPresentation/taskSummary";
import type { CrmLeadTask } from "@/types/crm";
import { cn } from "@/utils/cn";

interface LeadTasksPanelProps {
  tasks: CrmLeadTask[];
  loading: boolean;
  taskTitle: string;
  taskDate: string;
  taskMutationPending: boolean;
  canManageTasks: boolean;
  onTaskTitleChange: (value: string) => void;
  onTaskDateChange: (value: string) => void;
  onSubmitTask: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
}

const LeadTasksPanel = ({
  tasks,
  loading,
  taskTitle,
  taskDate,
  taskMutationPending,
  canManageTasks,
  onTaskTitleChange,
  onTaskDateChange,
  onSubmitTask,
  onToggleTask,
}: LeadTasksPanelProps) => {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-6 py-5">
        <Calendar className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold text-foreground">Follow-ups e tarefas</h2>
          <p className="text-sm text-muted-foreground">Controle a agenda comercial e marque pendências concluída.</p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando agenda comercial...</p>
        ) : tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isOverdue = !task.completed && new Date(task.due_date).getTime() < Date.now();

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl border px-4 py-4",
                    task.completed ? "border-border/50 bg-muted/20 opacity-70" : "border-border/70 bg-background/80",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id, !task.completed)}
                    disabled={!canManageTasks}
                    className="mt-0.5 text-primary transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {task.completed ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                  </button>
                  <div className="flex-1">
                    <p className={cn("font-medium text-foreground", task.completed && "line-through")}>{task.title}</p>
                    <p className={cn("mt-1 text-xs", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                      {isOverdue ? "Vencida" : "Vence"} em {formatTaskDueDate(task.due_date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
            Sem tarefas agendadas para este lead.
          </div>
        )}

        <form onSubmit={onSubmitTask} className="grid gap-3 border-t border-dashed border-border pt-5 sm:grid-cols-[minmax(0,1fr),160px,auto]">
          <Input
            value={taskTitle}
            onChange={(event) => onTaskTitleChange(event.target.value)}
            placeholder="Nova tarefa ou follow-up"
            disabled={!canManageTasks}
          />
          <Input
            type="date"
            value={taskDate}
            onChange={(event) => onTaskDateChange(event.target.value)}
            disabled={!canManageTasks}
          />
          <Button type="submit" disabled={taskMutationPending || !taskTitle.trim() || !taskDate || !canManageTasks}>
            Agendar
          </Button>
        </form>
        {!canManageTasks ? (
          <p className="text-sm text-muted-foreground">Sem permissão para criar ou concluir tarefas neste lead.</p>
        ) : null}
      </div>
    </section>
  );
};

export default LeadTasksPanel;
