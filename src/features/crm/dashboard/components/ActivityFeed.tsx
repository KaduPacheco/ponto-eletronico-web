import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  History,
  ListTodo,
  RefreshCcw,
  UserPlus,
} from "lucide-react";
import DashboardSection from "@/features/crm/shared/components/DashboardSection";
import {
  SectionEmptyState,
  SectionErrorState,
  SectionSkeleton,
} from "@/features/crm/shared/components/SectionStates";
import { DashboardActivityItem } from "@/types/dashboard";

interface ActivityFeedProps {
  data?: DashboardActivityItem[];
  isLoading?: boolean;
  errorMessage?: string;
}

const ActivityFeed = ({ data, isLoading, errorMessage }: ActivityFeedProps) => {
  return (
    <DashboardSection
      title="Atividade recente"
      subtitle="Eventos recentes do CRM."
      action={
        <div className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
          Eventos
        </div>
      }
    >
      {isLoading ? (
        <SectionSkeleton rows={6} />
      ) : errorMessage ? (
        <SectionErrorState
          title="Falha ao carregar atividade recente"
          description={errorMessage}
        />
      ) : !data || data.length === 0 ? (
        <SectionEmptyState
          title="Nenhuma atividade registrada"
          description="Os eventos operacionais aparecerao aqui conforme o CRM for sendo útilizado."
          icon={<History className="h-5 w-5" />}
        />
      ) : (
        <div className="space-y-1">
          {data.map((item, index) => (
            <div key={item.id} className="relative pl-11 sm:pl-12">
              {index < data.length - 1 ? (
                <span
                  className="absolute left-4 top-10 h-[calc(100%+0.5rem)] w-px bg-border/80"
                  aria-hidden="true"
                />
              ) : null}

              <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-2xl border border-border/70 bg-background text-foreground">
                {getActivityIcon(item.eventType)}
              </div>

              <div className="rounded-2xl px-1 py-3 sm:py-3.5">
                <div className="mb-2 flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatDateTime(item.occurredAt)}</span>
                      {item.company ? <span className="truncate">{item.company}</span> : null}
                    </div>
                  </div>
                  <Link
                    to={`/crm/leads/${item.leadId}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {item.leadName}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <p className="text-sm leading-5 text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
};

function getActivityIcon(eventType: string) {
  switch (eventType) {
    case "lead_created":
      return <UserPlus className="h-4 w-4" />;
    case "note_added":
      return <FileText className="h-4 w-4" />;
    case "task_added":
      return <ListTodo className="h-4 w-4" />;
    case "task_completed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "task_reopened":
      return <RefreshCcw className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default ActivityFeed;
