import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GitCompareArrows } from "lucide-react";
import DashboardSection from "@/features/crm/shared/components/DashboardSection";
import {
  SectionEmptyState,
  SectionErrorState,
} from "@/features/crm/shared/components/SectionStates";
import { DashboardTrafficComparisonDatum } from "@/types/dashboard";

interface TrafficVsLeadsChartProps {
  data?: DashboardTrafficComparisonDatum[];
  isLoading?: boolean;
  errorMessage?: string;
}

const TrafficVsLeadsChart = ({ data, isLoading, errorMessage }: TrafficVsLeadsChartProps) => {
  return (
    <DashboardSection
      title="Canais de aquisição"
      subtitle="Visitors e conversões por canal."
    >
      {isLoading ? (
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr),280px]">
          <div className="h-[300px] animate-pulse rounded-3xl bg-muted/40" />
          <div className="rounded-3xl border border-border/60 bg-muted/15 p-3.5">
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          </div>
        </div>
      ) : errorMessage ? (
        <SectionErrorState
          title="Não foi possível comparar tráfego e leads"
          description={errorMessage}
        />
      ) : !data || data.length === 0 ? (
        <SectionEmptyState
          title="Sem canais suficientes para comparação"
          description="Assim que houver tráfego e conversões reais por origem, este comparativo sera habilitado."
          icon={<GitCompareArrows className="h-5 w-5" />}
        />
      ) : (
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr),280px]">
          <div className="h-[292px] rounded-3xl border border-border/60 bg-muted/[0.12] p-3 sm:h-[300px] sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickFormatter={formatAxisLabel}
                  tickLine={false}
                  axisLine={false}
                  width={112}
                  style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                  }}
                />
                <Bar dataKey="visitors" name="Visitors" radius={[0, 10, 10, 0]} barSize={22}>
                  {data.map((entry) => (
                    <Cell key={`${entry.id}-visitors`} fill={entry.color} fillOpacity={0.95} />
                  ))}
                </Bar>
                <Bar dataKey="leads" name="Leads" radius={[0, 10, 10, 0]} barSize={12}>
                  {data.map((entry) => (
                    <Cell key={`${entry.id}-leads`} fill={entry.color} fillOpacity={0.34} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-3xl border border-border/60 bg-muted/[0.14] p-3.5">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Canais</p>
              <p className="text-[11px] font-medium text-muted-foreground">Conv.</p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-1">
              {data.map((entry) => (
                <ChannelRow key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardSection>
  );
};

function ChannelRow({ entry }: { entry: DashboardTrafficComparisonDatum }) {
  return (
    <div className="rounded-[20px] border border-border/60 bg-background/70 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="truncate text-sm font-medium text-foreground" title={entry.label}>
              {formatAxisLabel(entry.label)}
            </p>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            {entry.visitors} visitors - {entry.leads} leads
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border/60 bg-muted/25 px-2 py-1 text-[11px] font-semibold text-foreground">
          {entry.conversionRate}%
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span>{entry.visitorsShare}% do tráfego</span>
        <span>{entry.leadsShare}% dos leads</span>
      </div>
    </div>
  );
}

function formatAxisLabel(value: string) {
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-5)}` : value;
}

export default TrafficVsLeadsChart;
