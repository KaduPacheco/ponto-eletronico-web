import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Radar } from "lucide-react";
import DashboardSection from "@/features/crm/shared/components/DashboardSection";
import {
  SectionEmptyState,
  SectionErrorState,
} from "@/features/crm/shared/components/SectionStates";
import { DashboardChartDatum } from "@/types/dashboard";

interface AnalyticsSourcesChartProps {
  data?: DashboardChartDatum[];
  isLoading?: boolean;
  errorMessage?: string;
}

const AnalyticsSourcesChart = ({ data, isLoading, errorMessage }: AnalyticsSourcesChartProps) => {
  return (
    <DashboardSection
      title="Origem do tráfego"
      subtitle="UTMs e referrers da landing."
    >
      {isLoading ? (
        <div className="grid gap-4 2xl:grid-cols-[220px,minmax(0,1fr)] 2xl:items-center">
          <div className="mx-auto h-52 w-52 animate-pulse rounded-full bg-muted/50" />
          <div className="rounded-3xl border border-border/60 bg-muted/15 p-3.5">
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          </div>
        </div>
      ) : errorMessage ? (
        <SectionErrorState
          title="Não foi possível carregar a origem do tráfego"
          description={errorMessage}
        />
      ) : !data || data.length === 0 ? (
        <SectionEmptyState
          title="Sem origem de tráfego consolidada"
          description="Assim que a landing registrar page views com UTM ou referrer, os canais aparecerao aqui."
          icon={<Radar className="h-5 w-5" />}
        />
      ) : (
        <div className="grid gap-4 2xl:grid-cols-[220px,minmax(0,1fr)] 2xl:items-center">
          <div className="h-[220px] rounded-3xl border border-border/60 bg-muted/[0.12] p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={3} strokeWidth={0}>
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                  }}
                  formatter={(value: number, name: string) => [`${value} visitors`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-3xl border border-border/60 bg-muted/[0.14] p-3.5">
            <div className="mb-3 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Origens</p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-1">
              {data.map((entry) => (
                <CompactSourceRow key={entry.id} entry={entry} unit="visitors" />
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardSection>
  );
};

function CompactSourceRow({ entry, unit }: { entry: DashboardChartDatum; unit: string }) {
  return (
    <div className="rounded-[20px] border border-border/60 bg-background/70 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
          <p className="truncate text-sm font-medium text-foreground" title={entry.label}>
            {formatCompactLabel(entry.label)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-sm font-semibold text-foreground">{entry.value}</span>
          <span className="text-[10px] text-muted-foreground">{entry.percentage}%</span>
        </div>
      </div>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Base de {unit}</p>
    </div>
  );
}

function formatCompactLabel(value: string) {
  return value.length > 26 ? `${value.slice(0, 14)}...${value.slice(-8)}` : value;
}

export default AnalyticsSourcesChart;
