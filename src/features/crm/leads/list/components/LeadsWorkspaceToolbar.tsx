import { KanbanSquare, LayoutList, ListFilter, RotateCcw, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  LEAD_OWNER_FILTER_ALL,
  LEAD_OWNER_FILTER_MINE,
  LEAD_OWNER_FILTER_UNASSIGNED,
  getOwnerFilterValueForId,
  type LeadOwnerFilter,
} from "@/lib/crmLeadPresentation/owners";
import {
  LEAD_SOURCE_FILTER_ALL,
  LEAD_SOURCE_FILTER_WITHOUT_SOURCE,
  getLeadSourceFilterValue,
  type LeadSourceFilter,
} from "@/lib/crmLeadPresentation/sources";
import { type LeadPeriodFilter, type LeadsViewMode } from "@/lib/crmLeadPresentation/filters";
import { type LeadSortOption } from "@/lib/crmLeadPresentation/sorting";
import { PIPELINE_STAGE_OPTIONS, type LeadStageFilter } from "@/lib/crmLeadPresentation/stages";
import { CrmOwnerOption, CrmSourceOption } from "@/types/crm";
import { cn } from "@/utils/cn";

interface LeadsWorkspaceToolbarProps {
  totalLeads: number;
  visibleLeads: number;
  overdueLeads: number;
  unassignedLeads: number;
  searchTerm: string;
  stageFilter: LeadStageFilter;
  ownerFilter: LeadOwnerFilter;
  sourceFilter: LeadSourceFilter;
  periodFilter: LeadPeriodFilter;
  sortOption: LeadSortOption;
  ownerOptions: CrmOwnerOption[];
  sourceOptions: CrmSourceOption[];
  viewMode: LeadsViewMode;
  hasActiveFilters: boolean;
  onSearchTermChange: (value: string) => void;
  onStageFilterChange: (value: LeadStageFilter) => void;
  onOwnerFilterChange: (value: LeadOwnerFilter) => void;
  onSourceFilterChange: (value: LeadSourceFilter) => void;
  onPeriodFilterChange: (value: LeadPeriodFilter) => void;
  onSortOptionChange: (value: LeadSortOption) => void;
  onClearFilters: () => void;
  onViewModeChange: (value: LeadsViewMode) => void;
}

const LeadsWorkspaceToolbar = ({
  totalLeads,
  visibleLeads,
  overdueLeads,
  unassignedLeads,
  searchTerm,
  stageFilter,
  ownerFilter,
  sourceFilter,
  periodFilter,
  sortOption,
  ownerOptions,
  sourceOptions,
  viewMode,
  hasActiveFilters,
  onSearchTermChange,
  onStageFilterChange,
  onOwnerFilterChange,
  onSourceFilterChange,
  onPeriodFilterChange,
  onSortOptionChange,
  onClearFilters,
  onViewModeChange,
}: LeadsWorkspaceToolbarProps) => {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <ListFilter className="h-3.5 w-3.5" />
            Operação comercial
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pipeline e ownership dos leads</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Filtre por etapa e ownership, acompanhe pendências e alterne entre lista e kanban sem sair da operação.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:grid-cols-3">
          <StatCard label="Leads visíveis" value={String(visibleLeads)} helper={`${totalLeads} no total`} />
          <StatCard
            label="Com follow-up vencido"
            value={String(overdueLeads)}
            helper="Exigem ação imediata"
            danger={overdueLeads > 0}
          />
          <StatCard label="Sem responsável" value={String(unassignedLeads)} helper="Ownership pendente" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.3fr),minmax(0,1fr)]">
        <label className="space-y-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Busca</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Buscar por nome, empresa, e-mail ou whatsapp"
              className="h-11 rounded-2xl pl-10"
            />
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Etapa</span>
            <select
              value={stageFilter}
              onChange={(event) => onStageFilterChange(event.target.value as LeadStageFilter)}
              className="h-10 w-full rounded-2xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="all">Todas as etapas</option>
              <option value="without_stage">Sem etapa definida</option>
              {PIPELINE_STAGE_OPTIONS.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Origem</span>
            <select
              value={sourceFilter}
              onChange={(event) => onSourceFilterChange(event.target.value as LeadSourceFilter)}
              className="h-10 w-full rounded-2xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value={LEAD_SOURCE_FILTER_ALL}>Todas as origens</option>
              <option value={LEAD_SOURCE_FILTER_WITHOUT_SOURCE}>Sem origem</option>
              {sourceOptions.map((source) => (
                <option key={source.value} value={getLeadSourceFilterValue(source.value)}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Responsavel</span>
            <select
              value={ownerFilter}
              onChange={(event) => onOwnerFilterChange(event.target.value as LeadOwnerFilter)}
              className="h-10 w-full rounded-2xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value={LEAD_OWNER_FILTER_ALL}>Todos os responsáveis</option>
              <option value={LEAD_OWNER_FILTER_MINE}>Sob minha responsabilidade</option>
              <option value={LEAD_OWNER_FILTER_UNASSIGNED}>Sem responsável</option>
              {ownerOptions.map((owner) => (
                <option key={owner.id} value={getOwnerFilterValueForId(owner.id)}>
                  {owner.selectLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Periodo</span>
            <select
              value={periodFilter}
              onChange={(event) => onPeriodFilterChange(event.target.value as LeadPeriodFilter)}
              className="h-10 w-full rounded-2xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="all">Todo o histórico</option>
              <option value="today">Hoje</option>
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="90d">Ultimos 90 dias</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="space-y-2 text-sm sm:min-w-[220px]">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ordenação</span>
            <select
              value={sortOption}
              onChange={(event) => onSortOptionChange(event.target.value as LeadSortOption)}
              className="h-10 w-full rounded-2xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="priority">Prioridade operacional</option>
              <option value="next_follow_up">Proximo follow-up</option>
              <option value="newest">Entrada mais recente</option>
              <option value="oldest">Entrada mais antiga</option>
              <option value="name_asc">Nome A-Z</option>
            </select>
          </label>

          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Recorte atual</p>
            <p className="mt-1 text-sm font-medium text-foreground">{visibleLeads} leads visíveis</p>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters ? "Busca e filtros aplicados na operação." : "Nenhum filtro adicional ativo."}
            </p>
          </div>

          <Button type="button" variant="outline" onClick={onClearFilters} disabled={!hasActiveFilters}>
            <RotateCcw className="h-4 w-4" />
            Limpar filtros
          </Button>
        </div>

        <div className="inline-flex rounded-2xl border border-border bg-muted/20 p-1">
          <ViewToggleButton
            label="Lista"
            icon={LayoutList}
            active={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
          />
          <ViewToggleButton
            label="Kanban"
            icon={KanbanSquare}
            active={viewMode === "kanban"}
            onClick={() => onViewModeChange("kanban")}
          />
        </div>
      </div>
    </section>
  );
};

const StatCard = ({
  label,
  value,
  helper,
  danger,
}: {
  label: string;
  value: string;
  helper: string;
  danger?: boolean;
}) => {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <Users className={cn("h-4 w-4 text-muted-foreground", danger && "text-destructive")} />
      </div>
      <p className={cn("mt-3 text-2xl font-semibold tracking-tight text-foreground", danger && "text-destructive")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
};

const ViewToggleButton = ({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof LayoutList;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
};

export default LeadsWorkspaceToolbar;
