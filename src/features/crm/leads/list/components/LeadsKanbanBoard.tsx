import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import LeadStageBadge from "@/features/crm/shared/components/LeadStageBadge";
import { getOwnerDisplayLabel } from "@/lib/crmLeadPresentation/owners";
import { getLeadOperationalPriority } from "@/lib/crmLeadPresentation/priority";
import { getLeadSourceLabel } from "@/lib/crmLeadPresentation/sources";
import { getLeadStageValue } from "@/lib/crmLeadPresentation/stages";
import { formatTaskDueDate } from "@/lib/crmLeadPresentation/taskSummary";
import { PipelineStage } from "@/types/crm";
import { cn } from "@/utils/cn";
import type { LeadWithSummary } from "@/features/crm/leads/list/selectors/leadListSelectors";

interface LeadsKanbanBoardProps {
  items: LeadWithSummary[];
  currentUserId?: string;
  ownerLabelMap?: ReadonlyMap<string, string>;
}

const stageColumns: Array<{ key: PipelineStage | "without_stage"; title: string; helper: string }> = [
  { key: "novo", title: "Novo", helper: "Entrada e primeira abordagem" },
  { key: "em_contato", title: "Em contato", helper: "Conversas e follow-ups ativos" },
  { key: "qualificado", title: "Qualificado", helper: "Fit confirmado e próxima etapa definida" },
  { key: "ganho", title: "Ganho", helper: "Negocios convertidos" },
  { key: "perdido", title: "Perdido", helper: "Oportunidades encerradas" },
  { key: "without_stage", title: "Sem etapa", helper: "Leads que ainda precisam ser classificados" },
];

const LeadsKanbanBoard = ({ items, currentUserId, ownerLabelMap }: LeadsKanbanBoardProps) => {
  return (
    <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {stageColumns.map((column) => {
        const columnItems = items.filter(({ lead }) => getLeadStageValue(lead) === column.key);

        return (
          <section key={column.key} className="flex min-h-[320px] flex-col rounded-[28px] border border-border/70 bg-card p-4 shadow-sm">
            <div className="border-b border-border pb-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">{column.title}</h3>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {columnItems.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{column.helper}</p>
            </div>

            <div className="mt-4 flex flex-1 flex-col gap-3">
              {columnItems.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum lead nesta coluna.
                </div>
              ) : (
                columnItems.map(({ lead, taskSummary }) => {
                  const priority = getLeadOperationalPriority({ lead, taskSummary });

                  return (
                    <article key={lead.id} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <LeadStageBadge lead={lead} className="text-[10px]" />
                          <p
                            className={cn(
                              "pt-2 text-[11px] font-semibold uppercase tracking-[0.14em]",
                              priority.tone === "danger" && "text-destructive",
                              priority.tone === "warning" && "text-amber-700 dark:text-amber-300",
                              priority.tone === "success" && "text-secondary",
                              priority.tone === "neutral" && "text-primary",
                              priority.tone === "muted" && "text-muted-foreground",
                            )}
                          >
                            {priority.label}
                          </p>
                          <p className="pt-2 font-semibold text-foreground">{lead.nome || "Lead sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{lead.empresa || "Empresa não informada"}</p>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Responsavel: {getOwnerDisplayLabel(lead.owner_id, currentUserId, ownerLabelMap)}</p>
                          <p>Origem: {getLeadSourceLabel(lead.origem)}</p>
                          <p>{taskSummary.openCount} follow-ups abertos - {taskSummary.overdueCount} vencidos</p>
                          <p>{priority.helper}</p>
                        </div>

                        {taskSummary.nextTask ? (
                          <div
                            className={cn(
                              "rounded-2xl border px-3 py-2 text-xs",
                              taskSummary.overdueCount > 0
                                ? "border-destructive/20 bg-destructive/5 text-destructive"
                                : "border-border bg-muted/20 text-muted-foreground",
                            )}
                          >
                            <div className="inline-flex items-center gap-1 font-medium">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Próxima ação
                            </div>
                            <p className="mt-1">{taskSummary.nextTask.title}</p>
                            <p className="mt-1">Ate {formatTaskDueDate(taskSummary.nextTask.due_date)}</p>
                          </div>
                        ) : null}

                        <Link
                          to={`/crm/leads/${lead.id}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          Abrir lead
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default LeadsKanbanBoard;
