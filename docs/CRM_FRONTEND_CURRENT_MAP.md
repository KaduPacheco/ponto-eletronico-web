# CRM Frontend Current Map

## Objetivo desta nota

Registrar a arquitetura final do frontend do CRM após a reorganização por feature, preservando uma referência técnica unica para futuras manutenções.

## Topologia geral

- `/`
  - landing pública fora da árvore de auth do CRM
- `/crm/login`
  - pagina de login do CRM dentro do `AuthProvider`, mas sem `ProtectedRoute`
- `/crm`
  - dashboard executivo autenticado do CRM
- `/crm/analytics`
  - leitura analítica de aquisição, conversão, canais e funil
- `/crm/operação`
  - leitura comercial da carteira, pipeline e distribuicoes
- `/crm/leads`
  - workspace principal da listagem de leads
- `/crm/leads/:id`
  - detalhe operacional do lead
- `*`
  - fallback global para `NotFoundPage`

Fonte principal: `src/App.tsx`

## Arvore de rotas do CRM

1. `QueryClientProvider`
2. `TooltipProvider`
3. `BrowserRouter`
4. rota `/crm`
5. `AuthProvider`
6. rota `login`
7. `ProtectedRoute`
8. `CrmLayout`
9. paginas lazy de dashboard, analytics, operação, leads e detalhe

Pontos preservados:

- `AuthProvider` continua acima de login e da área protegida
- `ProtectedRoute` continua protegendo apenas as rotas autenticadas
- `CrmLayout` continua encapsulando dashboard, analytics, operação, leads e detalhe
- o lazy loading foi aplicado apenas nas paginas do CRM, sem alterar a ordem dos wrappers

## Politica atual de acesso

As permissões continuam derivadas por `buildAuthAccess`, sem camada paralela de autorização.

Permissoes reconhecidas:

- `crm:access`
- `crm:dashboard:read`
- `crm:leads:read`
- `crm:leads:write`
- `crm:notes:write`
- `crm:tasks:write`

Aplicação atual nas rotas:

- entrada do CRM
  - exige `crm:access`
- `/crm`, `/crm/analytics`, `/crm/operação`
  - exigem `crm:dashboard:read`
- `/crm/leads` e `/crm/leads/:id`
  - exigem `crm:leads:read`

Aplicação atual nas ações do detalhe do lead:

- etapa e ownership
  - exigem `crm:leads:write`
- anotações
  - exigem `crm:notes:write`
- tarefas e follow-ups
  - exigem `crm:tasks:write`

Quando o usuário nao possui a permissão pedida, `ProtectedRoute` calcula o melhor fallback seguro a partir do próprio conjunto de permissões.

## Organização final por feature

### `src/features/crm/auth`

Responsavel por autenticação e autorização do CRM:

- `providers/AuthProvider.tsx`
- `hooks/useAuth.ts`
- `components/ProtectedRoute.tsx`
- `lib/authAccess.ts`
- `types/auth-access.ts`
- `types/auth-context.ts`

Compatibilidade legada mantida por re-export:

- `src/contexts/AuthContext.tsx`
- `src/contexts/auth-context.ts`
- `src/hooks/useAuth.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/lib/authAccess.ts`

### `src/features/crm/leads/list`

Responsavel pela listagem de leads:

- `page/LeadsPage.tsx`
- `components/LeadsWorkspaceToolbar.tsx`
- `components/LeadsResultsTable.tsx`
- `components/LeadsKanbanBoard.tsx`
- `components/LeadsPaginationControls.tsx`
- `hooks/useLeadsListState.ts`
- `selectors/leadListSelectors.ts`

### `src/features/crm/leads/detail`

Responsavel pelo detalhe e workspace do lead:

- `page/LeadDetailPage.tsx`
- componentes de header, identidade, pipeline, ownership, tasks, timeline, quick note e resumo operacional
- `hooks/useLeadDetailDrafts.ts`
- `hooks/useLeadWorkspace.ts`
- `selectors/leadDetailSelectors.ts`

### `src/features/crm/dashboard`

Responsavel pela home executiva do CRM:

- `page/DashboardPage.tsx`
- componentes de leitura rápida, atividade, atenção, follow-ups e atalhos
- `useCrmDashboardData.ts` como orquestrador de datasets e builders reutilizados

### `src/features/crm/analytics`

Responsavel pela leitura analítica da aquisição:

- `page/AnalyticsPage.tsx`
- componentes de KPI, timeline, funil, origem do tráfego e comparativos de canal
- reaproveita o mesmo `useCrmDashboardData.ts` sem alterar query keys ou services

### `src/features/crm/operacao`

Responsavel pela leitura comercial da carteira:

- `page/OperaçãoPage.tsx`
- componentes de pipeline, distribuição por estágio e origem comercial
- reaproveita os mesmos datasets do dashboard para leitura operacional isolada

### `src/features/crm/shared`

Nucleo compartilhádo do CRM:

- `types/`: `crm.ts`, `dashboard.ts`, `auth-access.ts`
- `permissions/`: `authAccess.ts`
- `queryKeys/`: `crmQueryKeys.ts`
- `constants/`: `routes.ts`
- `formatters/`: `dateTime.ts`

## Infraestrutura

### `src/infra`

Camada de infraestrutura reutilizavel:

- `supabase/client.ts`: client singleton do Supabase
- `supabase/env.ts`: leitura tipada e validação das envs públicas

Compatibilidade preservada:

- `src/lib/supabase.ts` continua existindo como facháda segura

## Servicos e contratos

Os services permanecem como camada de acesso a dados e nao foram reorganizados para dentro de `features`:

- `src/services/crmService.ts`
- `src/services/dashboardService.ts`

No dashboard, o service foi fatiado internamente, mas segue exposto por uma facháda de compatibilidade em `src/services/dashboardService.ts`.

## Query keys criticas

As query keys foram centralizadas em:

- `src/features/crm/shared/queryKeys/crmQueryKeys.ts`

Valores preservados:

- `["crm-leads"]`
- `["crm-leads-task-overview"]`
- `["crm-lead", leadId]`
- `["crm-owner-ids"]`
- `["crm-lead-notes", leadId]`
- `["crm-lead-events", leadId]`
- `["crm-lead-tasks", leadId]`
- `["crm-dashboard", "leads"]`
- `["crm-dashboard", "tasks"]`
- `["crm-dashboard", "events"]`
- `["crm-dashboard", "analytics"]`

## Papel atual de cada área do produto

- `/crm`
  - dashboard executivo
  - foco em visao geral, alertas, atividade recente e proximos passos
- `/crm/analytics`
  - área analítica
  - foco em performance da landing, tráfego, conversão, funil e canais
- `/crm/operação`
  - área operacional e comercial
  - foco em pipeline, distribuicoes e leitura da carteira
- `/crm/leads`
  - workspace operacional da base
  - foco em filtros, tabela, kanban, detalhe, notas, tarefas e timeline

## Regras de compatibilidade preservadas

- o CRM continua separado da landing pública na árvore de rotas
- o auth flow continua usando sessão inicial mais `onAuthStateChange` do Supabase
- `buildAuthAccess` continua sendo a fonte de verdade de permissão no frontend
- `useLeadWorkspace` continua invalidando as mesmas query keys
- tipos compartilhados continuam acessíveis pelos caminhos legados `src/types/crm.ts` e `src/types/dashboard.ts`
- helpers antigos continuam disponíveis por fachádas e re-exports quando isso reduz risco de migração

## Lazy loading do CRM

As paginas abaixo sao carregadas via `React.lazy`:

- `LoginPage`
- `DashboardPage`
- `AnalyticsPage`
- `OperaçãoPage`
- `LeadsPage`
- `LeadDetailPage`

O fallback continua simples e seguro, sem alterar fluxo de sessão, redirecionamento ou layout.
