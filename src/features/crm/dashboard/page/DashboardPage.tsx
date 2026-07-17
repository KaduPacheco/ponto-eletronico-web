import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  LayoutDashboard,
  Users,
} from "lucide-react";
import ActivityFeed from "@/features/crm/dashboard/components/ActivityFeed";
import AttentionPanel from "@/features/crm/dashboard/components/AttentionPanel";
import RecentLeadsList from "@/features/crm/dashboard/components/RecentLeadsList";
import UpcomingTasksList from "@/features/crm/dashboard/components/UpcomingTasksList";
import { useAuth } from "@/features/crm/auth/hooks/useAuth";
import { useCrmDashboardData } from "@/features/crm/dashboard/useCrmDashboardData";
import { CRM_ROUTES } from "@/features/crm/shared/constants/routes";
import { formatDateTimePtBr } from "@/features/crm/shared/formatters/dateTime";
import KpiCard from "@/features/crm/shared/components/KpiCard";
import {
  DashboardClusterShell,
  DashboardMetricRail,
} from "@/features/crm/shared/components/DashboardSurface";
import { Button } from "@/components/ui/Button";

const DashboardPage = () => {
  const { hasPermission } = useAuth();
  const {
    leadsQuery,
    tasksQuery,
    eventsQuery,
    leadMetrics,
    taskMetrics,
    recentLeads,
    upcomingTasks,
    activityFeed,
    attentionData,
    lastUpdatedAt,
  } = useCrmDashboardData({
    includeLeads: true,
    includeTasks: true,
    includeEvents: true,
    includeAnalytics: false,
  });

  const totalLeadsMetric = leadMetrics.find((metric) => metric.id === "total_leads");
  const overdueTasksMetric = taskMetrics.find((metric) => metric.id === "overdue_tasks");
  const canReadLeads = hasPermission("crm:leads:read");

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-[36px] border border-border/70 bg-card shadow-[0_32px_90px_-54px_rgba(15,23,42,0.58)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.14),transparent_40%)]" />
        <div className="relative grid gap-6 px-6 py-6 sm:px-7 sm:py-7 xl:grid-cols-[minmax(0,1.35fr),minmax(320px,380px)] xl:items-stretch xl:px-8 xl:py-8">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard executivo
            </div>

            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground lg:text-[2.8rem] lg:leading-[1.05]">
                Situação atual do CRM
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-[15px]">
                Visão geral para decidir rápido e seguir para analytics, operação ou leads.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:max-w-2xl">
              <SummaryPill
                label="Base total"
                value={totalLeadsMetric?.value ?? 0}
                helper={totalLeadsMetric?.helperText ?? "Volume atual da carteira."}
              />
              <SummaryPill
                label="Atrasos"
                value={overdueTasksMetric?.value ?? 0}
                helper={overdueTasksMetric?.helperText ?? "Follow-ups com prioridade imediata."}
                tone={overdueTasksMetric?.value ? "danger" : "neutral"}
              />
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-[30px] border border-border/70 bg-background/75 p-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.55)] backdrop-blur sm:p-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Situação atual
                </p>
                <p className="text-base font-semibold tracking-tight text-foreground">
                  {leadsQuery.isError || tasksQuery.isError || eventsQuery.isError
                    ? "Leitura com alertas"
                    : "Painel atualizado"}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {lastUpdatedAt
                    ? `Última atualização em ${formatDateTimePtBr(lastUpdatedAt)}`
                    : "Sincronizando dados do CRM"}
                </p>
              </div>

              <div className="h-px bg-border/70" />

              <div className="space-y-2.5">
                {canReadLeads ? (
                  <Button asChild className="h-auto w-full justify-between rounded-2xl px-4 py-3.5">
                    <Link to={CRM_ROUTES.leads}>
                      Leads
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  className="h-auto w-full justify-between rounded-2xl border-border/70 px-4 py-3.5"
                >
                  <Link to={CRM_ROUTES.operação}>
                    Operação
                    <BriefcaseBusiness className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto w-full justify-between rounded-2xl border-border/70 px-4 py-3.5"
                >
                  <Link to={CRM_ROUTES.analytics}>
                    Analytics
                    <BarChart3 className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DashboardClusterShell
        eyebrow="Situação atual"
        title="KPIs principais"
        description="Base, entradas recentes e agenda operacional."
        tone="subtle"
      >
        <DashboardMetricRail
          eyebrow="Resumo executivo"
          title="Base e prioridades"
          description="Indicadores centrais da operação."
          columnsClassName="sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiCard
            metric={leadMetrics.find((metric) => metric.id === "total_leads")}
            icon={Users}
            isLoading={leadsQuery.isLoading}
            errorMessage={leadsQuery.isError ? getErrorMessage(leadsQuery.error) : undefined}
            variant="compact"
          />
          <KpiCard
            metric={leadMetrics.find((metric) => metric.id === "new_leads")}
            icon={BriefcaseBusiness}
            isLoading={leadsQuery.isLoading}
            errorMessage={leadsQuery.isError ? getErrorMessage(leadsQuery.error) : undefined}
            variant="compact"
          />
          <KpiCard
            metric={taskMetrics.find((metric) => metric.id === "open_tasks")}
            icon={CalendarClock}
            isLoading={tasksQuery.isLoading}
            errorMessage={tasksQuery.isError ? getErrorMessage(tasksQuery.error) : undefined}
            variant="compact"
          />
          <KpiCard
            metric={taskMetrics.find((metric) => metric.id === "overdue_tasks")}
            icon={Activity}
            isLoading={tasksQuery.isLoading}
            errorMessage={tasksQuery.isError ? getErrorMessage(tasksQuery.error) : undefined}
            variant="compact"
          />
        </DashboardMetricRail>
      </DashboardClusterShell>

      <DashboardClusterShell
        eyebrow="Prioridades"
        title="Painel de atenção"
        description="Alertas e follow-ups que pedem ação imediata."
        tone="subtle"
      >
        <AttentionPanel
          data={attentionData}
          isLoading={leadsQuery.isLoading || tasksQuery.isLoading}
          errorMessage={
            leadsQuery.isError
              ? getErrorMessage(leadsQuery.error)
              : tasksQuery.isError
                ? getErrorMessage(tasksQuery.error)
                : undefined
          }
        />
      </DashboardClusterShell>

      <DashboardClusterShell
        eyebrow="Proximos passos"
        title="Agenda e base recente"
        description="Follow-ups e ultimas entradas."
        tone="muted"
      >
        <div className="grid gap-6 2xl:grid-cols-2">
          <UpcomingTasksList
            data={upcomingTasks}
            isLoading={tasksQuery.isLoading}
            errorMessage={tasksQuery.isError ? getErrorMessage(tasksQuery.error) : undefined}
          />
          <RecentLeadsList
            data={recentLeads}
            isLoading={leadsQuery.isLoading}
            errorMessage={leadsQuery.isError ? getErrorMessage(leadsQuery.error) : undefined}
          />
        </div>
      </DashboardClusterShell>

      <DashboardClusterShell
        eyebrow="Atividade"
        title="Contexto recente"
        description="Eventos recentes da operação."
        tone="subtle"
      >
        <ActivityFeed
          data={activityFeed}
          isLoading={eventsQuery.isLoading}
          errorMessage={eventsQuery.isError ? getErrorMessage(eventsQuery.error) : undefined}
        />
      </DashboardClusterShell>
    </div>
  );
};

function SummaryPill({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  helper: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <div
      className={`rounded-[24px] border px-4 py-4 ${
        tone === "danger"
          ? "border-destructive/20 bg-destructive/6"
          : "border-border/70 bg-background/60"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{helper}</p>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Tente novamente em instantes.";
}

export default DashboardPage;
