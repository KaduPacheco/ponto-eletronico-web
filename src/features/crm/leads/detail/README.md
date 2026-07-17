# CRM Lead Detail

Estrutura coesa da tela de detalhe do lead no CRM.

Escopo atual:

- `page/LeadDetailPage.tsx`
- `hooks/useLeadDetailDrafts.ts`
- `hooks/useLeadWorkspace.ts`
- `selectors/leadDetailSelectors.ts`
- `components/LeadDetailHeader.tsx`
- `components/LeadIdentityCard.tsx`
- `components/LeadPipelineOwnershipPanel.tsx`
- `components/LeadTasksPanel.tsx`
- `components/LeadTimelinePanel.tsx`
- `components/LeadQuickNoteCard.tsx`
- `components/LeadOperationalSummaryAside.tsx`

Dependências preservadas:

- `src/hooks/useLeadWorkspace.ts`
- `src/services/crmService.ts`

Compatibilidade temporaria:

- `src/pages/crm/LeadDetailPage.tsx`

O caminho legado da página segue ativo por re-export para reduzir risco durante a migração da feature.
