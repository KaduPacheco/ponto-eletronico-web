import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Clock3 } from "lucide-react";
import DashboardSection from "@/features/crm/shared/components/DashboardSection";
import {
  SectionEmptyState,
  SectionErrorState,
  SectionSkeleton,
} from "@/features/crm/shared/components/SectionStates";
import { DashboardRecentLeadItem } from "@/types/dashboard";

interface RecentLeadsListProps {
  data?: DashboardRecentLeadItem[];
  isLoading?: boolean;
  errorMessage?: string;
}

const RecentLeadsList = ({ data, isLoading, errorMessage }: RecentLeadsListProps) => {
  return (
    <DashboardSection
      title="Leads recentes"
      subtitle="Ultimas entradas."
      action={
        <Link
          to="/crm/leads"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          Ver base
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {isLoading ? (
        <SectionSkeleton rows={5} />
      ) : errorMessage ? (
        <SectionErrorState
          title="Falha ao carregar leads recentes"
          description={errorMessage}
        />
      ) : !data || data.length === 0 ? (
        <SectionEmptyState
          title="Nenhum lead recente encontrado"
          description="Assim que novos contatos forem capturados pela landing, eles aparecerao aqui."
        />
      ) : (
        <div className="space-y-3">
          {data.map((lead) => (
            <Link
              key={lead.id}
              to={`/crm/leads/${lead.id}`}
              className="block rounded-[20px] border border-border/65 bg-muted/[0.12] px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-foreground">{lead.name}</p>
                    <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      {lead.stageLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="truncate">{lead.company || "Empresa não informada"}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                    <span
                      className="max-w-[22ch] truncate rounded-full border border-border/70 bg-background/55 px-2.5 py-1 text-[10px] font-medium text-foreground/85"
                      title={lead.source}
                    >
                      {lead.source}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDateTime(lead.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardSection>
  );
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default RecentLeadsList;
