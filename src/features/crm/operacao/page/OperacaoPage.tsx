import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Users,
} from "lucide-react";
import { useAuth } from "@/features/crm/auth/hooks/useAuth";
import { useCrmDashboardData } from "@/features/crm/dashboard/useCrmDashboardData";
import { CRM_ROUTES } from "@/features/crm/shared/constants/routes";
import { formatDateTimePtBr } from "@/features/crm/shared/formatters/dateTime";
import PipelineChart from "@/features/crm/operacao/components/PipelineChart";
import SourceChart from "@/features/crm/operacao/components/SourceChart";
import KpiCard from "@/features/crm/shared/components/KpiCard";
import {
  DashboardClusterShell,
  DashboardMetricRail,
} from "@/features/crm/shared/components/DashboardSurface";
import { Button } from "@/components/ui/Button";

const OperaçãoPage = () => {
  const { hasPermission } = useAuth();
  const { leadsQuery, tasksQuery, leadMetrics, taskMetrics, pipelineData, sourceData, lastUpdatedAt } =
    useCrmDashboardData({
      includeLeads: true,
      includeTasks: true,
      includeEvents: false,
      includeAnalytics: false,
    });
  const canReadLeads = hasPermission("crm:leads:read");

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-[36px] border border-border/70 bg-card shadow-[0_32px_90px_-54px_rgba(15,23,42,0.58)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_40%)]" />
        <div className="relative grid gap-6 px-6 py-6 sm:px-7 sm:py-7 xl:grid-cols-[minmax(0,1.3fr),minmax(320px,380px)] xl:items-stretch xl:px-8 xl:py-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Operação comercial
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground lg:text-[2.7rem] lg:leading-[1.05]">
                Operação comercial
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-[15px]">
                Pipeline, origem comercial e carteira em uma leitura direta para o time comercial.
              </p>
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-[30px] border border-border/70 bg-background/75 p-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.55)] backdrop-blur sm:p-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Carteira operacional
                </p>
                <p className="text-base font-semibold tracking-tight text-foreground">
                  {leadsQuery.isError || tasksQuery.isError ? "Leitura parcial da operação" : "Visão estrutural da base"}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {lastUpdatedAt
                    ? `Última atualização em ${formatDateTimePtBr(lastUpdatedAt)}`
                    : "Sincronizando base comercial"}
                </p>
              </div>

              <div className="h-px bg-border/70" />

              <div className="space-y-3">
                <Button asChild variant="outline" className="h-auto w-full justify-between rounded-2xl px-4 py-3.5">
                  <Link to={CRM_ROUTES.root}>
                    Voltar ao dashboard
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                {canReadLeads ? (
                  <Button asChild className="h-auto w-full justify-between rounded-2xl px-4 py-3.5">
                    <Link to={CRM_ROUTES.leads}>
                      Abrir leads
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <DashboardClusterShell
        eyebrow="Carteira"
        title="Volume e cadencia comercial"
        description="Indicadores operacionais da base."
        tone="subtle"
      >
        <DashboardMetricRail
          eyebrow="Resumo comercial"
          title="Base e follow-ups"
          description="Carteira e agenda operacional."
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
        eyebrow="Pipeline"
        title="Distribuicao da carteira"
        description="Estagios e origens comerciais."
        tone="muted"
      >
        <div className="grid gap-6 2xl:grid-cols-2">
          <PipelineChart
            data={pipelineData}
            isLoading={leadsQuery.isLoading}
            errorMessage={leadsQuery.isError ? getErrorMessage(leadsQuery.error) : undefined}
          />
          <SourceChart
            data={sourceData}
            isLoading={leadsQuery.isLoading}
            errorMessage={leadsQuery.isError ? getErrorMessage(leadsQuery.error) : undefined}
          />
        </div>
      </DashboardClusterShell>

      <DashboardClusterShell
        eyebrow="Acesso rápido"
        title="Workspace de leads"
        description="Acesso direto para triagem e acompanhamento."
        tone="subtle"
      >
        <div className="rounded-[28px] border border-border/70 bg-background/[0.38] p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.55)] sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Workspace comercial
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Leads e acompanhamento individual</h2>
              <p className="max-w-2xl text-sm leading-5 text-muted-foreground">
                Continue a execução comercial na base detalhada de leads.
              </p>
            </div>

            {canReadLeads ? (
              <Button asChild className="h-auto rounded-2xl px-4 py-3.5">
                <Link to={CRM_ROUTES.leads}>
                  <Users className="h-4 w-4" />
                  Abrir leads
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </DashboardClusterShell>
    </div>
  );
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Tente novamente em instantes.";
}

export default OperaçãoPage;
