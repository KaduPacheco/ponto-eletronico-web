import LeadStageBadge from "@/features/crm/shared/components/LeadStageBadge";
import LeadDetailField from "@/features/crm/leads/detail/components/LeadDetailField";
import type { CrmLead } from "@/types/crm";

interface LeadIdentityCardProps {
  lead: CrmLead;
  currentOwnerLabel: string;
}

const LeadIdentityCard = ({ lead, currentOwnerLabel }: LeadIdentityCardProps) => {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-muted/20 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Lead</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{lead.nome}</h2>
          <p className="text-sm text-muted-foreground">{lead.empresa || "Empresa não informada"}</p>
        </div>
        <LeadStageBadge lead={lead} />
      </div>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
        <LeadDetailField label="Contato" value={lead.whatsapp || "Não informado"} />
        <LeadDetailField label="E-mail" value={lead.email || "Não informado"} />
        <LeadDetailField label="Origem" value={lead.origem || "Não informada"} />
        <LeadDetailField label="Porte" value={lead.funcionarios ? `${lead.funcionarios} funcionários` : "Não informado"} />
        <LeadDetailField label="Criado em" value={new Date(lead.created_at).toLocaleString("pt-BR")} />
        <LeadDetailField label="Responsavel" value={currentOwnerLabel} />
      </div>
    </section>
  );
};

export default LeadIdentityCard;
