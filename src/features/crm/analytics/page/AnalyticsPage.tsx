import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  MousePointerClick,
  SendHorizontal,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import AnalyticsFunnelChart from "@/features/crm/analytics/components/AnalyticsFunnelChart";
import AnalyticsSourcesChart from "@/features/crm/analytics/components/AnalyticsSourcesChart";
import AnalyticsTimelineChart from "@/features/crm/analytics/components/AnalyticsTimelineChart";
import TrafficVsLeadsChart from "@/features/crm/analytics/components/TrafficVsLeadsChart";
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

const AnalyticsPage = () => {
  const { hasPermission } = useAuth();
  const {
    analyticsMetrics,
    analyticsQuery,
    analyticsSeriesData,
    analyticsFunnelData,
    analyticsSourceData,
    trafficVsLeadsData,
    analyticsWindowDays,
    lastUpdatedAt,
  } = useCrmDashboardData({
    includeLeads: false,
    includeTasks: false,
    includeEvents: false,
    includeAnalytics: true,
  });
  const canReadLeads = hasPermission("crm:leads:read");

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-[36px] border border-border/70 bg-card shadow-[0_32px_90px_-54px_rgba(15,23,42,0.58)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_42%)]" />
        <div className="relative grid gap-6 px-6 py-6 sm:px-7 sm:py-7 xl:grid-cols-[minmax(0,1.3fr),minmax(320px,380px)] xl:items-stretch xl:px-8 xl:py-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground lg:text-[2.7rem] lg:leading-[1.05]">
                Performance da landing
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-[15px]">
                Visitors, cliques, conversões e canais de aquisição da landing nos ultimos {analyticsWindowDays} dias.
              </p>
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-[30px] border border-border/70 bg-background/75 p-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.55)] backdrop-blur sm:p-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Janela de analise
                </p>
                <p className="text-base font-semibold tracking-tight text-foreground">
                  {analyticsQuery.isError ? "Dados analíticos com alerta" : `${analyticsWindowDays} dias monitorados`}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {lastUpdatedAt
                    ? `Última atualização em ${formatDateTimePtBr(lastUpdatedAt)}`
                    : "Sincronizando eventos da landing"}
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
                      Explorar leads
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
        eyebrow="Aquisicao e conversão"
        title="KPIs de performance da landing"
        description="Volume, interação e conversão."
        tone="subtle"
      >
        <DashboardMetricRail
          eyebrow="Resumo do período"
          title="Indicadores principais"
          description="Visitors, cliques, conversões e taxa."
        >
          <KpiCard
            metric={analyticsMetrics.find((metric) => metric.id === "landing_visitors")}
            icon={UsersRound}
            isLoading={analyticsQuery.isLoading}
            errorMessage={analyticsQuery.isError ? getErrorMessage(analyticsQuery.error) : undefined}
            variant="compact"
          />
          <KpiCard
            metric={analyticsMetrics.find((metric) => metric.id === "landing_cta_clicks")}
            icon={MousePointerClick}
            isLoading={analyticsQuery.isLoading}
            errorMessage={analyticsQuery.isError ? getErrorMessage(analyticsQuery.error) : undefined}
            variant="compact"
          />
          <KpiCard
            metric={analyticsMetrics.find((metric) => metric.id === "landing_submit_success")}
            icon={SendHorizontal}
            isLoading={analyticsQuery.isLoading}
            errorMessage={analyticsQuery.isError ? getErrorMessage(analyticsQuery.error) : undefined}
            variant="compact"
          />
          <KpiCard
            metric={analyticsMetrics.find((metric) => metric.id === "landing_conversion_rate")}
            icon={TrendingUp}
            isLoading={analyticsQuery.isLoading}
            errorMessage={analyticsQuery.isError ? getErrorMessage(analyticsQuery.error) : undefined}
            variant="compact"
          />
        </DashboardMetricRail>
      </DashboardClusterShell>

      <DashboardClusterShell
        eyebrow="Conversão por período"
        title="Volume e taxa de conversão"
        description="Serie temporal de visitors, conversões e taxa."
      >
        <AnalyticsTimelineChart
          data={analyticsSeriesData}
          isLoading={analyticsQuery.isLoading}
          errorMessage={analyticsQuery.isError ? getErrorMessage(analyticsQuery.error) : undefined}
        />
      </DashboardClusterShell>

      <DashboardClusterShell
        eyebrow="Canais de aquisição"
        title="Tráfego, leads e origem do tráfego"
        description="Comparativo entre canais e contribuicao para conversão."
        tone="muted"
      >
        <div className="grid gap-6 2xl:grid-cols-2">
          <TrafficVsLeadsChart
            data={trafficVsLeadsData}
            isLoading={analyticsQuery.isLoading}
            errorMessage={analyticsQuery.isError ? getErrorMessage(analyticsQuery.error) : undefined}
          />
          <AnalyticsSourcesChart
            data={analyticsSourceData}
            isLoading={analyticsQuery.isLoading}
            errorMessage={analyticsQuery.isError ? getErrorMessage(analyticsQuery.error) : undefined}
          />
        </div>
      </DashboardClusterShell>

      <DashboardClusterShell
        eyebrow="Funil de conversão"
        title="Etapas da landing"
        description="Visitors por etapa da jornada."
      >
        <AnalyticsFunnelChart
          data={analyticsFunnelData}
          isLoading={analyticsQuery.isLoading}
          errorMessage={analyticsQuery.isError ? getErrorMessage(analyticsQuery.error) : undefined}
        />
      </DashboardClusterShell>
    </div>
  );
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Tente novamente em instantes.";
}

export default AnalyticsPage;
