# CRM Stage 0 Baseline

Resumo tecnico criado antes de reorganizações maiores no frontend do CRM.

## Escopo atual do sistema

- landing pública em `/`
- CRM autenticado em `/crm`
- rotas ativas do CRM:
  - `/crm`
  - `/crm/analytics`
  - `/crm/operação`
  - `/crm/leads`
  - `/crm/leads/:id`

## Fluxos críticos preservados

- autenticação e guard de acesso via `AuthProvider` e `ProtectedRoute`
- leitura de permissão via `buildAuthAccess` e `hasPermission`
- captura de leads da landing via `leadService`
- tracking analitico via `analyticsService`
- leitura operacional e mutações do workspace de lead via `crmService` e `useLeadWorkspace`
- agregações executivas do CRM via builders puros de `dashboard.selectors`

## Regras puras com cobertura prioritaria

- auth:
  - `buildAuthAccess`
  - `hasPermission`
- apresentação operacional de leads:
  - `getLeadStageValue`
  - `getLeadStageLabel`
  - `buildLeadTaskSummary`
  - `paginateCollection`
  - `filterLeadRows`
  - `sortLeadRows`
- dashboard:
  - KPIs de leads e tarefas
  - distribuicoes de pipeline e origem
  - attention panel
  - builders de analytics consolidados por `dashboardService`

## Arquivos-base auditados nesta etapa

- `src/App.tsx`
- `src/lib/supabase.ts`
- `src/contexts/AuthContext.tsx`
- `src/contexts/auth-context.ts`
- `src/hooks/useAuth.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/lib/authAccess.ts`
- `src/lib/crmLeadPresentation.ts`
- `src/hooks/useLeadWorkspace.ts`
- `src/services/crmService.ts`
- `src/services/dashboardService.ts`
- `src/services/leadService.ts`
- `src/services/analyticsService.ts`
- `src/types/crm.ts`
- `src/types/dashboard.ts`
- `src/tests/setup.ts`

## Validação mínima esperada antes de etapas maiores

- `npm run build`
- `npm run test`

## Limites desta etapa

- sem alteração de regra de negócio
- sem reorganização de arquitetura
- sem mudanca visual
- sem alteração de backend, schema, RLS ou integração externa
