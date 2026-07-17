import { Package } from "lucide-react";
import { PIPELINE_STAGE_OPTIONS } from "@/lib/crmLeadPresentation/stages";
import LeadOperationalSummaryCard from "@/features/crm/leads/detail/components/LeadOperationalSummaryCard";
import type { CrmLead, CrmOwnerOption, PipelineStage } from "@/types/crm";

interface LeadPipelineOwnershipPanelProps {
  lead: CrmLead;
  currentStage: PipelineStage | "without_stage";
  currentStageLabel: string;
  currentStageDescription: string;
  currentOwnerLabel: string;
  selectedStageValue: PipelineStage | "";
  ownerOptions: CrmOwnerOption[];
  ownerIdsError: boolean;
  taskSummary: {
    openCount: number;
    overdueCount: number;
    nextTask: { title: string; due_date: string } | null;
  };
  nextTaskHelper: string;
  openTasksHelper: string;
  canEditLead: boolean;
  stageMutationPending: boolean;
  ownerMutationPending: boolean;
  onStageChange: (value: PipelineStage) => void;
  onOwnerChange: (nextOwnerId: string | null) => void;
}

const LeadPipelineOwnershipPanel = ({
  lead,
  currentStage,
  currentStageLabel,
  currentStageDescription,
  currentOwnerLabel,
  selectedStageValue,
  ownerOptions,
  ownerIdsError,
  taskSummary,
  nextTaskHelper,
  openTasksHelper,
  canEditLead,
  stageMutationPending,
  ownerMutationPending,
  onStageChange,
  onOwnerChange,
}: LeadPipelineOwnershipPanelProps) => {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-6 py-5">
        <Package className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold text-foreground">Pipeline e ownership</h2>
          <p className="text-sm text-muted-foreground">
            Atualize a etapa comercial e defina ownership real para o lead.
          </p>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr),280px]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <LeadOperationalSummaryCard
              label="Estagio vigente"
              value={currentStageLabel}
              helper="Toda mudanca fica registrada na timeline do lead."
              tone={currentStage === "without_stage" ? "danger" : "neutral"}
            />
            <LeadOperationalSummaryCard
              label="Ownership vigente"
              value={currentOwnerLabel}
              helper={lead.owner_id ? "Responsável definido para conduzir o lead." : "Lead disponível para distribuição."}
              tone={lead.owner_id ? "neutral" : "danger"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Etapa atual</label>
            <select
              value={selectedStageValue}
              onChange={(event) => {
                if (!event.target.value) {
                  return;
                }

                onStageChange(event.target.value as PipelineStage);
              }}
              disabled={!canEditLead || stageMutationPending}
              className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="" disabled>
                Sem etapa definida
              </option>
              {PIPELINE_STAGE_OPTIONS.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {canEditLead ? currentStageDescription : "Sem permissão para alterar a etapa deste lead."}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ownership</p>
            <select
              value={lead.owner_id ?? ""}
              onChange={(event) => onOwnerChange(event.target.value || null)}
              disabled={!canEditLead || ownerMutationPending}
              className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Sem responsável</option>
              {ownerOptions.map((ownerOption) => (
                <option key={ownerOption.id} value={ownerOption.id}>
                  {ownerOption.selectLabel}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {canEditLead
                ? lead.owner_id
                  ? `Responsavel atual: ${currentOwnerLabel}`
                  : "Este lead ainda não possui ownership definido."
                : "Sem permissão para atualizar ownership deste lead."}
            </p>
            {ownerIdsError ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                A lista de responsáveis está operando em modo reduzido. Sem uma tabela pública de perfis no backend,
                o CRM usa apenas owners já vistos nos leads e o usuário autenticado atual.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <LeadOperationalSummaryCard
            label="Próxima ação"
            value={taskSummary.nextTask ? taskSummary.nextTask.title : "Sem follow-up aberto"}
            helper={nextTaskHelper}
            tone={taskSummary.overdueCount > 0 ? "danger" : "neutral"}
          />
          <LeadOperationalSummaryCard
            label="Tarefas abertas"
            value={String(taskSummary.openCount)}
            helper={openTasksHelper}
            tone={taskSummary.overdueCount > 0 ? "danger" : "neutral"}
          />
        </div>
      </div>
    </section>
  );
};

export default LeadPipelineOwnershipPanel;
