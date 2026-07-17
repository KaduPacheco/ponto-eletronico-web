# CRM Leads List

Estrutura coesa da listagem operacional de leads do CRM.

Escopo atual:

- `page/LeadsPage.tsx`
- `hooks/useLeadsListState.ts`
- `selectors/leadListSelectors.ts`
- `components/LeadsWorkspaceToolbar.tsx`
- `components/LeadsResultsTable.tsx`
- `components/LeadsKanbanBoard.tsx`
- `components/LeadsPaginationControls.tsx`

Compatibilidade temporaria:

- `src/pages/crm/LeadsPage.tsx`
- `src/components/crm/leads/LeadsWorkspaceToolbar.tsx`
- `src/components/crm/leads/LeadsResultsTable.tsx`
- `src/components/crm/leads/LeadsKanbanBoard.tsx`
- `src/components/crm/leads/LeadsPaginationControls.tsx`

Os caminhos legados seguem ativos por re-export para reduzir risco durante a migração da feature.
