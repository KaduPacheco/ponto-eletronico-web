# CRM Operação

Referencia técnica da área operacional e comercial do CRM.

## Papel da rota

- rota: `/crm/operação`
- responsabilidade: concentrar a leitura estrutural da carteira comercial
- objetivo: separar pipeline e distribuicoes comerciais do dashboard executivo

## Componentes principais

- `page/OperaçãoPage.tsx`
  - compoe a hierarquia da rota
- `components/PipelineChart.tsx`
  - distribuição por estágio
- `components/SourceChart.tsx`
  - distribuição por origem comercial

## Reaproveitamento

- os indicadores operacionais seguem vindo de `useCrmDashboardData`
- `KpiCard`, `DashboardSection`, `DashboardSurface` e `SectionStates` são compartilhados via `shared/components/`
- o acesso para `/crm/leads` foi mantido como continuidade natural da execução comercial

## Principios de UI

- leitura direta de carteira
- menos texto redundante
- charts com mais espaco útil
- mesma base visual de dashboard e analytics para manter consistencia

## Restricoes mantidas

- nenhuma mudanca em backend, auth, query keys, services ou contratos
- a página só reorganiza o contexto de leitura da operação
