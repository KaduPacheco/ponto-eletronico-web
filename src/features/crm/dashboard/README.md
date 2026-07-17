# CRM Dashboard

Referencia técnica da área executiva do CRM.

## Papel da rota

- rota: `/crm`
- responsabilidade: visão geral de decisão rápida
- foco: situação atual, prioridades, atividade e proximos passos

## Estrutura atual

- página principal em `page/DashboardPage.tsx`
- componentes da feature em `components/`
- datasets e builders continuam expostos por `src/services/dashboardService.ts`
- orquestração de dados em `src/features/crm/dashboard/useCrmDashboardData.ts`
- wrappers legados podem continuar disponíveis em `src/pages/crm/DashboardPage.tsx` e `src/components/crm/dashboard/`
- internamente, o dashboard service foi fatiado em:
  - `src/services/dashboard/dashboard.api.ts`
  - `src/services/dashboard/dashboard.selectors.ts`
  - `src/services/dashboard/dashboard.constants.ts`
  - `src/services/dashboard/dashboard.formatters.ts`

## Arquitetura visual final

O dashboard foi reorganizado como uma sequencia de camadas com papeis visuais distintos. A intencao não foi mudar o comportamento da tela, e sim redistribuir o conteúdo para melhorar hierarquia, escaneabilidade e conforto visual.

### 1. Hero executivo

Responsabilidade:

- introduzir a leitura do dashboard
- mostrar contexto da sessão
- manter um CTA único para a base operacional

### 2. KPIs principais

Responsabilidade:

- concentrar os indicadores mais importantes no primeiro bloco útil da página
- separar visão comercial e visão analítica sem misturar tudo em uma única grade

### 3. Atencao e atividade

Responsabilidade:

- fechar a página com o que exige ação, contexto recente e leitura operacional curta
- separar prioridade, fila imediata e histórico recente

## Componentes estruturais

Os componentes abaixo funcionam como base de composição do dashboard:

- `DashboardSection`
- `DashboardSurface`
- `KpiCard`
- `AttentionPanel`
- `UpcomingTasksList`
- `RecentLeadsList`
- `ActivityFeed`

## Principios de UI adotados

- hierarquia em camadas: cada faixa da página tem um papel explicito
- prioridade visual progressiva: hero, KPIs, analytics, operação, atenção
- menos competicao no primeiro viewport: menos blocos fortes ao mesmo tempo
- gráficos como protagonistas: resumos e breakdowns laterais ficam mais compactos
- listas mais escaneaveis: menos caixas internas, mais respiro e metadados agrupados
- consistencia sem monotonia: mesma base de borda, raio, espacamento e tipografia, com pesos diferentes por camada

## Restricoes arquiteturais mantidas

- nenhuma camada visual altera query keys, services, auth, rotas ou contratos de dados
- os componentes continuam consumindo os mesmos builders e tipos já expostos
- a reorganização visual permanece desacoplada da lógica de negócio
