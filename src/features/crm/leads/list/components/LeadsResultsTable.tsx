import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CalendarClock } from "lucide-react";
import LeadStageBadge from "@/features/crm/shared/components/LeadStageBadge";
import { getOwnerDisplayLabel } from "@/lib/crmLeadPresentation/owners";
import { getLeadOperationalPriority } from "@/lib/crmLeadPresentation/priority";
import { getLeadSourceLabel } from "@/lib/crmLeadPresentation/sources";
import { formatTaskDueDate } from "@/lib/crmLeadPresentation/taskSummary";
import { cn } from "@/utils/cn";
import type { LeadWithSummary } from "@/features/crm/leads/list/selectors/leadListSelectors";

interface LeadsResultsTableProps {
  items: LeadWithSummary[];
  currentUserId?: string;
  ownerLabelMap?: ReadonlyMap<string, string>;
}

const LeadsResultsTable = ({ items, currentUserId, ownerLabelMap }: LeadsResultsTableProps) => {
  return (
    <div className="overflow-x-auto rounded-[28px] border border-border/70 bg-card shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <tr>
            <th className="px-5 py-4">Lead</th>
            <th className="px-5 py-4">Contexto</th>
            <th className="px-5 py-4">Responsavel</th>
            <th className="px-5 py-4">Pendencias</th>
            <th className="px-5 py-4">Janela</th>
            <th className="px-5 py-4 text-right">Acao</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map(({ lead, taskSummary }) => {
            const priority = getLeadOperationalPriority({ lead, taskSummary });

            return (
              <tr key={lead.id} className="align-top transition-colors hover:bg-muted/20">
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <PriorityPill label={priority.label} tone={priority.tone} />
                    <p className="font-semibold text-foreground">{lead.nome || "Lead sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{lead.empresa || "Empresa não informada"}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.email || "Sem e-mail"} - {lead.whatsapp || "Sem telefone"}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <LeadStageBadge lead={lead} />
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {getLeadSourceLabel(lead.origem)}
                    </p>
                    <p className="text-xs text-muted-foreground">{priority.helper}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {getOwnerDisplayLabel(lead.owner_id, currentUserId, ownerLabelMap)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.owner_id ? "Lead com ownership definido" : "Disponivel para assumir"}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <TaskPill label={`${taskSummary.openCount} abertas`} />
                      <TaskPill label={`${taskSummary.overdueCount} vencidas`} danger={taskSummary.overdueCount > 0} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {taskSummary.nextTask ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Próxima: {taskSummary.nextTask.title} até {formatTaskDueDate(taskSummary.nextTask.due_date)}
                        </span>
                      ) : (
                        "Sem follow-up aberto"
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Entrada</p>
                      <p className="mt-1 font-medium text-foreground">
                        {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ultima atividade</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(lead.last_interaction_at || lead.updated_at || lead.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    to={`/crm/leads/${lead.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                  >
                    Gerenciar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const TaskPill = ({ label, danger }: { label: string; danger?: boolean }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        danger
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      {danger ? <AlertCircle className="h-3.5 w-3.5" /> : null}
      {label}
    </span>
  );
};

const PriorityPill = ({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "warning" | "success" | "neutral" | "muted";
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tone === "danger" && "border-destructive/20 bg-destructive/10 text-destructive",
        tone === "warning" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        tone === "success" && "border-secondary/20 bg-secondary/10 text-secondary",
        tone === "neutral" && "border-primary/20 bg-primary/10 text-primary",
        tone === "muted" && "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
};

export default LeadsResultsTable;
