import { UserRound } from "lucide-react";
import LeadOperationalSummaryCard from "@/features/crm/leads/detail/components/LeadOperationalSummaryCard";
import type { CrmLead } from "@/types/crm";

interface LeadOperationalSummaryAsideProps {
  lead: CrmLead;
  currentOwnerLabel: string;
}

const LeadOperationalSummaryAside = ({ lead, currentOwnerLabel }: LeadOperationalSummaryAsideProps) => {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 text-foreground">
        <UserRound className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Resumo operacional</h2>
      </div>
      <div className="mt-4 space-y-3">
        <LeadOperationalSummaryCard
          label="Ownership"
          value={currentOwnerLabel}
          helper={lead.owner_id ? "Lead atribuído a uma pessoa responsável." : "Ainda disponível para distribuição."}
          tone={lead.owner_id ? "neutral" : "danger"}
        />
        <LeadOperationalSummaryCard
          label="Ultima entrada"
          value={new Date(lead.created_at).toLocaleDateString("pt-BR")}
          helper={lead.origem || "Origem não informada"}
          tone="neutral"
        />
      </div>
    </section>
  );
};

export default LeadOperationalSummaryAside;
