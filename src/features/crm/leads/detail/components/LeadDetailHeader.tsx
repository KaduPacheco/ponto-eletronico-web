import { Link } from "react-router-dom";
import LeadStageBadge from "@/features/crm/shared/components/LeadStageBadge";
import type { CrmLead } from "@/types/crm";

interface LeadDetailHeaderProps {
  lead: CrmLead;
  currentOwnerLabel: string;
}

const LeadDetailHeader = ({ lead, currentOwnerLabel }: LeadDetailHeaderProps) => {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2">
        <Link to="/crm/leads" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          â† Voltar para leads
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dossie do lead</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ownership, pendências e histórico comercial do lead em um único contexto.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Etapa atual</p>
          <div className="mt-2">
            <LeadStageBadge lead={lead} className="text-[10px]" />
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Responsavel atual</p>
          <p className="mt-2 text-sm font-medium text-foreground">{currentOwnerLabel}</p>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailHeader;
