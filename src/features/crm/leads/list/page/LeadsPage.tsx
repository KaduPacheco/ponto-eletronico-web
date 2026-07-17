import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCcw } from "lucide-react";
import LeadStageBadge from "@/features/crm/shared/components/LeadStageBadge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { CRM_QUERY_KEYS } from "@/features/crm/shared/queryKeys/crmQueryKeys";
import LeadsKanbanBoard from "@/features/crm/leads/list/components/LeadsKanbanBoard";
import LeadsPaginationControls from "@/features/crm/leads/list/components/LeadsPaginationControls";
import LeadsResultsTable from "@/features/crm/leads/list/components/LeadsResultsTable";
import LeadsWorkspaceToolbar from "@/features/crm/leads/list/components/LeadsWorkspaceToolbar";
import { useLeadsListState } from "@/features/crm/leads/list/hooks/useLeadsListState";
import { selectLeadsListViewModel } from "@/features/crm/leads/list/selectors/leadListSelectors";
import { getCrmLeads, getLeadTasksOverview } from "@/features/crm/leads/shared/services/crmService";

const LeadsPage = () => {
  const { user } = useAuth();
  const listState = useLeadsListState();

  const leadsQuery = useQuery({
    queryKey: CRM_QUERY_KEYS.leads,
    queryFn: getCrmLeads,
  });

  const tasksOverviewQuery = useQuery({
    queryKey: CRM_QUERY_KEYS.leadsTaskOverview,
    queryFn: getLeadTasksOverview,
  });

  const listViewModel = useMemo(
    () => selectLeadsListViewModel({
      leads: leadsQuery.data,
      tasksOverview: tasksOverviewQuery.data,
      currentUser: user,
      state: {
        searchTerm: listState.deferredSearchTerm,
        stageFilter: listState.stageFilter,
        ownerFilter: listState.ownerFilter,
        sourceFilter: listState.sourceFilter,
        periodFilter: listState.periodFilter,
        sortOption: listState.sortOption,
        page: listState.page,
        pageSize: listState.pageSize,
      },
    }),
    [
      leadsQuery.data,
      listState.deferredSearchTerm,
      listState.ownerFilter,
      listState.page,
      listState.pageSize,
      listState.periodFilter,
      listState.sortOption,
      listState.sourceFilter,
      listState.stageFilter,
      tasksOverviewQuery.data,
      user,
    ],
  );

  if (leadsQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-8">
        <div className="rounded-[28px] border border-border/70 bg-card p-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">Sincronizando pipeline comercial...</p>
        </div>
      </div>
    );
  }

  if (leadsQuery.isError) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-8">
        <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-10 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-4 text-lg font-semibold text-foreground">Não foi possível carregar os leads</p>
          <p className="mt-2 text-sm text-muted-foreground">{(leadsQuery.error as Error).message}</p>
          <Button className="mt-5" onClick={() => leadsQuery.refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Gestão de leads</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            Trabalhe ownership, próxima ação e etapa comercial no mesmo fluxo. O objetivo aqui e deixar claro quem está
            conduzindo cada lead e o que precisa acontecer a seguir.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Visão atual</p>
          <div className="mt-2 flex items-center gap-2">
            <LeadStageBadge lead={{ pipeline_stage: null, status: "novo" }} className="text-[10px]" />
            <p className="text-sm text-muted-foreground">Pipeline pronto para operar em lista e kanban.</p>
          </div>
        </div>
      </header>

      <LeadsWorkspaceToolbar
        totalLeads={listViewModel.leadRows.length}
        visibleLeads={listViewModel.filteredRows.length}
        overdueLeads={listViewModel.overdueLeads}
        unassignedLeads={listViewModel.unassignedLeads}
        searchTerm={listState.searchTerm}
        stageFilter={listState.stageFilter}
        ownerFilter={listState.ownerFilter}
        sourceFilter={listState.sourceFilter}
        periodFilter={listState.periodFilter}
        sortOption={listState.sortOption}
        ownerOptions={listViewModel.ownerOptions}
        sourceOptions={listViewModel.sourceOptions}
        viewMode={listState.viewMode}
        hasActiveFilters={listViewModel.hasActiveFilters}
        onSearchTermChange={listState.updateSearchTerm}
        onStageFilterChange={listState.updateStageFilter}
        onOwnerFilterChange={listState.updateOwnerFilter}
        onSourceFilterChange={listState.updateSourceFilter}
        onPeriodFilterChange={listState.updatePeriodFilter}
        onSortOptionChange={listState.updateSortOption}
        onClearFilters={listState.clearFilters}
        onViewModeChange={listState.setViewMode}
      />

      {tasksOverviewQuery.isError ? (
        <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-700 shadow-sm dark:text-amber-300">
          A leitura de pendências do lead falhou nesta sincronização. A listagem continua disponível, mas os indicadores
          de follow-up podem estar incompletos.
        </div>
      ) : null}

      {listViewModel.sortedRows.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">Nenhum lead encontrado neste recorte</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste busca, filtros ou período para voltar a ver a operação.
          </p>
        </div>
      ) : listState.viewMode === "list" ? (
        <LeadsResultsTable
          items={listViewModel.pagination.items}
          currentUserId={user?.id}
          ownerLabelMap={listViewModel.ownerLabelMap}
        />
      ) : (
        <LeadsKanbanBoard
          items={listViewModel.pagination.items}
          currentUserId={user?.id}
          ownerLabelMap={listViewModel.ownerLabelMap}
        />
      )}

      <LeadsPaginationControls
        currentPage={listViewModel.pagination.currentPage}
        totalPages={listViewModel.pagination.totalPages}
        totalItems={listViewModel.pagination.totalItems}
        startIndex={listViewModel.pagination.startIndex}
        endIndex={listViewModel.pagination.endIndex}
        pageSize={listState.pageSize}
        onPageChange={listState.setPage}
        onPageSizeChange={listState.updatePageSize}
      />
    </div>
  );
};

export default LeadsPage;
