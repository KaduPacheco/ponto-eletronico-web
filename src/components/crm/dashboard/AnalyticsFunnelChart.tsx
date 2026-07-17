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
import { Filter } from "lucide-react";
import DashboardSection from "./DashboardSection";
import { SectionEmptyState, SectionErrorState } from "./SectionStates";
import { DashboardChartDatum } from "@/types/dashboard";

interface AnalyticsFunnelChartProps {
  data?: DashboardChartDatum[];
  isLoading?: boolean;
  errorMessage?: string;
}

const AnalyticsFunnelChart = ({ data, isLoading, errorMessage }: AnalyticsFunnelChartProps) => {
  return (
    <DashboardSection
      title="Funil de conversão"
      subtitle="Visitors por etapa da jornada."
    >
      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),232px]">
          <div className="h-[300px] animate-pulse rounded-3xl bg-muted/40" />
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
          title="Não foi possível montar o funil da landing"
          description={errorMessage}
        />
      ) : !data || data.every((entry) => entry.value === 0) ? (
        <SectionEmptyState
          title="Sem eventos suficientes para o funil"
          description="Assim que a landing registrar page views e interações reais, o funil aparecera aqui."
          icon={<Filter className="h-5 w-5" />}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),232px]">
          <div className="h-[292px] rounded-3xl border border-border/60 bg-muted/[0.12] p-3 sm:h-[300px] sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  width={126}
                  style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.08)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                  }}
                  formatter={(value: number, _name: string, item) => {
                    const entry = item?.payload as DashboardChartDatum | undefined;
                    return [`${value} visitors`, `${entry?.percentage ?? 0}% da base`];
                  }}
                />
                <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={24}>
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-3xl border border-border/60 bg-muted/[0.14] p-3.5">
            <div className="mb-3 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Etapas</p>
            </div>
            <div className="space-y-2.5">
              {data.map((entry) => (
                <CompactBreakdownRow
                  key={entry.id}
                  color={entry.color}
                  label={entry.label}
                  value={entry.value}
                  detail={`${entry.percentage}% da base inicial`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardSection>
  );
};

function CompactBreakdownRow({
  color,
  label,
  value,
  detail,
}: {
  color: string;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-border/60 bg-background/70 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
          <span className="truncate text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{detail}</p>
    </div>
  );
}

export default AnalyticsFunnelChart;
