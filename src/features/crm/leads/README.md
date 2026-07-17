# CRM Leads

Agrupa a estrutura atual da feature de leads do CRM.

## Papel da rota

- rota: `/crm/leads`
- responsabilidade: workspace operacional da base
- foco: triagem, filtros, tabela, kanban, detalhe do lead e acompanhamento individual

Subáreas:

- `list/`: página de listagem, filtros, ordenação, tabela, kanban e paginação
- `detail/`: workspace do lead, timeline, notas, ownership e pipeline

Estado atual:

- `list/` concentra estado local, selectors e componentes da listagem
- `detail/` concentra a composição da página e seus painéis menores
- os caminhos legados em `src/pages/crm/LeadsPage.tsx` e `src/pages/crm/LeadDetailPage.tsx` seguem disponíveis por re-export

## Relação com as outras áreas

- `/crm` aponta para Leads como continuidade dos proximos passos
- `/crm/operação` aponta para Leads como continuidade da execução comercial
- Analytics e Operação removem densidade da home, mas a execução detalhada continua centralizada aqui
