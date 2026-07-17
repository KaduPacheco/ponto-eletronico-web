# CRM Features

Esta pasta concentra a arquitetura atual do frontend do CRM organizada por feature e por contexto de uso.

## Mapa de rotas

- `/crm`
  - papel: dashboard executivo
  - foco: situação atual, prioridades, atividade e atalhos
- `/crm/analytics`
  - papel: leitura analítica da aquisição
  - foco: tráfego, conversão, funil e origem do tráfego
- `/crm/operação`
  - papel: leitura comercial da carteira
  - foco: pipeline, distribuição por estágio e distribuição por origem comercial
- `/crm/leads`
  - papel: workspace operacional da base
  - foco: filtros, tabela, kanban, detalhe do lead e acompanhamento individual

## Organização atual

- `auth/`
  - autenticação, guards e contexto de acesso do CRM
- `dashboard/`
  - página e componentes do dashboard executivo
  - hook de orquestração `useCrmDashboardData`
- `analytics/`
  - página e componentes analíticos ligados a aquisição e conversão
- `operação/`
  - página e componentes da leitura comercial da carteira
- `leads/`
  - workspace operacional da base, dividido entre `list/` e `detail/`
- `shared/`
  - componentes estruturais, layout, constantes, tipos, query keys, permissões e formatters reutilizados

## Reaproveitamento entre áreas

- `useCrmDashboardData` continua como ponto único de orquestração dos dados usados por dashboard, analytics e operação
- `shared/components/`
  - `DashboardSection`
  - `DashboardSurface`
  - `KpiCard`
  - `SectionStates`
- `shared/layout/CrmLayout.tsx`
  - layout principal e navegação da área autenticada do CRM

Esse desenho preserva:

- query keys
- contracts de dados
- services e builders
- auth flow
- rotas públicas já estabilizadas

## Controle de acesso atual

- `buildAuthAccess` continua derivando o conjunto de permissões a partir da sessão do usuário
- `ProtectedRoute` aplica as permissões por rota sem criar um sistema novo de autorização
- dashboard, analytics e operação exigem `crm:dashboard:read`
- leads e detalhe do lead exigem `crm:leads:read`
- ações mutaveis do detalhe do lead respeitam `crm:leads:write`, `crm:notes:write` e `crm:tasks:write`
- o layout principal mostra apenas navegações que o usuário autenticado pode acessar com o conjunto atual de permissões

## Principios de UI adotados

- separação por contexto de uso: cada rota responde a uma pergunta operacional diferente
- dashboard mais executivo: menos densidade e mais decisão rápida
- analytics como área própria: gráficos e séries com protagonismo
- operação como área própria: pipeline e carteira sem competir com aquisição
- leads como workspace: execução detalhada fora do dashboard
- consistência visual: mesma base de cascas, grids, títulos e estados vazios e erro

## Compatibilidade

- `src/pages/crm/*.tsx` permanecem como entrypoints de rota e podem atuar como wrappers quando necessario
- `src/components/layout/CrmLayout.tsx` pode continuar existindo como ponto de compatibilidade para imports legados
- a landing pública continua fora desta pasta
- as páginas do CRM continuam lazy-loaded em `src/App.tsx`
- `src/infra/` continua concentrando adaptadores como o client do Supabase
