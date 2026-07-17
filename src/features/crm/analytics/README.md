# CRM Analytics

Referencia técnica da área analítica do CRM.

## Papel da rota

- rota: `/crm/analytics`
- responsabilidade: concentrar a leitura de aquisição e conversão da landing
- objetivo: remover a carga analítica detalhada do dashboard executivo sem alterar dados, cálculos ou contratos

## Componentes principais

- `page/AnalyticsPage.tsx`
  - compoe a hierarquia completa da rota
- `components/AnalyticsTimelineChart.tsx`
  - série temporal de visitors, conversões e taxa
- `components/TrafficVsLeadsChart.tsx`
  - comparativo entre tráfego e leads por canal
- `components/AnalyticsSourcesChart.tsx`
  - origem do tráfego
- `components/AnalyticsFunnelChart.tsx`
  - funil de conversão

## Reaproveitamento

- os KPIs continuam sendo montados por `useCrmDashboardData`
- `KpiCard`, `DashboardSection`, `DashboardSurface` e `SectionStates` são compartilhados via `shared/components/`
- a página não cria services próprios nem altera o fluxo de dados existente

## Principios de UI

- gráficos como protagonistas
- comparações lado a lado apenas quando a largura comporta
- linguagem objetiva orientada a performance
- pouca competicao entre helper text e dado principal

## Restricoes mantidas

- nenhuma mudanca em backend, auth, query keys, services ou contratos
- a página existe apenas como redistribuição de contexto
