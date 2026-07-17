import { Link } from "react-router-dom";
import { ArrowUpRight, CircleAlert, UserRoundX } from "lucide-react";
import DashboardSection from "./DashboardSection";
import { SectionEmptyState, SectionErrorState, SectionSkeleton } from "./SectionStates";
import { DashboardAttentionData } from "@/types/dashboard";

interface AttentionPanelProps {
  data?: DashboardAttentionData;
  isLoading?: boolean;
  errorMessage?: string;
}

const AttentionPanel = ({ data, isLoading, errorMessage }: AttentionPanelProps) => {
  const hasAttentionItems = data?.metrics.some((metric) => metric.count > 0);
  const totalOpenIssues = data?.metrics.reduce((sum, metric) => sum + metric.count, 0) ?? 0;
  const activeMetrics = data?.metrics.filter((metric) => metric.count > 0).length ?? 0;
  const metricsGrid = data ? (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {data.metrics.map((metric) => (
        <div
          key={metric.id}
          className={`rounded-[24px] border px-4 py-4 ${
            metric.tone === "danger"
              ? "border-destructive/20 bg-destructive/6"
              : metric.tone === "warning"
                ? "border-amber-500/20 bg-amber-500/6"
                : "border-secondary/20 bg-secondary/6"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {metric.label}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">{metric.count}</p>
            </div>
            <span className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {metric.count > 0 ? "Acao" : "Ok"}
            </span>
          </div>
          <p className="mt-2 max-w-[28ch] text-xs leading-5 text-muted-foreground">{metric.description}</p>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <DashboardSection
      title="Painel de atenção"
      subtitle="Pontos que pedem ação imediata."
      action={
        <Link
          to="/crm/leads"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          Revisar leads
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {isLoading ? (
        <SectionSkeleton rows={4} />
      ) : errorMessage ? (
        <SectionErrorState
          title="Falha ao montar o painel de atenção"
          description={errorMessage}
        />
      ) : !data ? (
        <SectionEmptyState
          title="Sem dados de atenção"
          description="Quando o CRM tiver dados suficientes, os alertas operacionais aparecerao aqui."
        />
      ) : (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-destructive/15 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.16),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.82))] p-5 shadow-[0_20px_60px_-42px_rgba(239,68,68,0.45)] sm:p-6">
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr),minmax(240px,0.65fr)] 2xl:items-end">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72">
                  <CircleAlert className="h-3.5 w-3.5 text-destructive" />
                  Prioridade operacional
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-[2.9rem]">
                    {totalOpenIssues}
                  </p>
                  <p className="max-w-2xl text-sm leading-5 text-slate-200/82">
                    Ocorrencias abertas em {activeMetrics} frentes de atenção.
                  </p>
                </div>
              </div>

              {data.overdueTasksPreview.length > 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Follow-ups vencidos
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                    {data.overdueTasksPreview.length}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-200/78">
                    Contatos com prazo expirado.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {data.overdueTasksPreview.length > 0 ? (
            <div className="space-y-4">
              {metricsGrid}
              <div className="rounded-[28px] border border-border/70 bg-muted/[0.18] p-4 sm:p-5">
                <div className="mb-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CircleAlert className="h-4 w-4 text-destructive" />
                    Tarefas vencidas com maior urgencia
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Itens com prazo vencido.
                  </p>
                </div>
                <div className="grid gap-3 2xl:grid-cols-2">
                  {data.overdueTasksPreview.map((task) => (
                    <Link
                      key={task.id}
                      to={`/crm/leads/${task.leadId}`}
                      className="flex items-start justify-between gap-3 rounded-[22px] border border-destructive/12 bg-background/80 px-4 py-3 transition-colors hover:border-destructive/25 hover:bg-destructive/[0.06]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {task.leadName}
                          {task.company ? ` - ${task.company}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-destructive/15 bg-destructive/8 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                        {formatDate(task.dueDate)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            metricsGrid
          )}

          {!hasAttentionItems ? (
            <SectionEmptyState
              title="Operação sob controle"
              description="Nenhum alerta crítico foi identificado nos dados visíveis para esta sessão."
              icon={<UserRoundX className="h-5 w-5" />}
              className="min-h-[160px]"
            />
          ) : null}
        </div>
      )}
    </DashboardSection>
  );
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export default AttentionPanel;
