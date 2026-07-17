import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ActivitySquare } from "lucide-react";
import DashboardSection from "@/features/crm/shared/components/DashboardSection";
import {
  SectionEmptyState,
  SectionErrorState,
} from "@/features/crm/shared/components/SectionStates";
import { DashboardAnalyticsSeriesDatum } from "@/types/dashboard";

interface AnalyticsTimelineChartProps {
  data?: DashboardAnalyticsSeriesDatum[];
  isLoading?: boolean;
  errorMessage?: string;
}

const AnalyticsTimelineChart = ({ data, isLoading, errorMessage }: AnalyticsTimelineChartProps) => {
  const hasData = Boolean(data?.some((entry) => entry.visitors > 0 || entry.leads > 0 || entry.pageViews > 0));

  return (
    <DashboardSection
      title="Conversão por período"
      subtitle="Visitors, conversões e taxa no período."
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-[300px] animate-pulse rounded-3xl bg-muted/40" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        </div>
      ) : errorMessage ? (
        <SectionErrorState
          title="Não foi possível montar a série de performance"
          description={errorMessage}
        />
      ) : !data || !hasData ? (
        <SectionEmptyState
          title="Sem volume suficiente no período"
          description="Quando a landing acumular visitors e conversões reais, a série executiva aparecera aqui."
          icon={<ActivitySquare className="h-5 w-5" />}
        />
      ) : (
        <div className="space-y-5">
          <div className="h-[320px] rounded-3xl border border-border/60 bg-muted/[0.12] p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  yAxisId="volume"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  tickFormatter={(value: number) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "Taxa de conversão") {
                      return [`${value}%`, name];
                    }

                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="volume"
                  dataKey="visitors"
                  name="Visitors"
                  fill="#2563eb"
                  radius={[10, 10, 0, 0]}
                  barSize={22}
                />
                <Bar
                  yAxisId="volume"
                  dataKey="leads"
                  name="Leads"
                  fill="#0f766e"
                  radius={[10, 10, 0, 0]}
                  barSize={18}
                />
                <Line
                  yAxisId="rate"
                  type="monotone"
                  dataKey="conversionRate"
                  name="Taxa de conversão"
                  stroke="#ea580c"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              label="Visitors"
              value={data.reduce((sum, entry) => sum + entry.visitors, 0)}
              helper="Unicos no período."
            />
            <SummaryCard
              label="Conversões"
              value={data.reduce((sum, entry) => sum + entry.leads, 0)}
              helper="Envios concluídos."
            />
            <SummaryCard
              label="Melhor dia"
              value={`${getBestConversionRate(data)}%`}
              helper="Pico de conversão."
            />
          </div>
        </div>
      )}
    </DashboardSection>
  );
};

function SummaryCard({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/[0.14] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{helper}</p>
    </div>
  );
}

function getBestConversionRate(data: DashboardAnalyticsSeriesDatum[]) {
  return data.reduce((best, entry) => Math.max(best, entry.conversionRate), 0);
}

export default AnalyticsTimelineChart;
