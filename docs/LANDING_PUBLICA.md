# Landing Publica

## Objetivo

Registrar o estado atual da landing pública do projeto, deixando claro o escopo da refatoração recente, os arquivos centrais envolvidos e as restrições que devem orientar futuras manutenções.

## Escopo

Esta nota cobre apenas a experiencia pública do frontend:

- home em `/`
- paginas legais públicas em `/politica-de-privacidade` e `/termos-de-uso`
- metadados, SEO e tracking ligados a essas rotas
- captação de leads iniciada pela landing

Esta nota nao cobre comportamento funcional do CRM autenticado em `/crm`.

## Rotas públicas relacionadas

- `/`: landing principal com proposta comercial, seções de confiança e captação
- `/politica-de-privacidade`: pagina institucional pública com informações sobre tratamento dos dados enviados pela landing
- `/termos-de-uso`: pagina institucional pública com regras gerais de uso da landing e do formulário

Fonte principal de roteamento: `src/App.tsx`

## Objetivos da refatoração

- melhorar a clareza comercial da mensagem principal
- aumentar a capacidade de conversão da home pública
- transmitir mais confiança na tomada de decisao comercial
- reforcar SEO e metadados da área pública
- manter a separação entre área pública e CRM autenticado

## Principais melhorias implementadas

### Estrutura da home

A home pública em `src/pages/HomePage.tsx` passou a compor a jornada principal com as seguintes seções:

- `Hero`
- `Problems`
- `Solution`
- `Benefits`
- `TrustSection`
- `Pricing`
- `Security`
- `FaqSection`
- `FinalCTA`
- `LeadForm`

Quando o formulário conclui com sucesso, a pagina troca para `SuccessView`.

### Confianca e clareza comercial

- a comunicação da hero e das seções centrais foi reposicionada para ênfase em retrabalho, fechamento da folha, visibilidade da jornada e contexto operacional
- a antiga abordagem de prova social foi substituida na home por `TrustSection`, que explicita segmentos atendidos e blocos de confiança sem depender de depoimentos genericos
- o formulário e a tela de sucesso foram ajustados para orientar melhor o proximo passo comercial

### SEO da área pública

- `index.html` recebeu ajustes de title, description, keywords, canonical e JSON-LD da aplicação
- `src/hooks/usePageMeta.ts` centraliza metadados dinamicos de title, description, Open Graph, Twitter e canonical
- `HomePage`, `PrivacyPage` e `TermsPage` usam `usePageMeta` para atualizar metadados por rota

### Paginas legais públicas

- `src/pages/PrivacyPage.tsx` implementa a pagina pública de Politica de Privacidade
- `src/pages/TermsPage.tsx` implementa a pagina pública de Termos de Uso
- `src/components/layout/LegalPageLayout.tsx` fornece o layout compartilhádo dessas paginas
- os links para essas paginas aparecem no rodapé e no texto de consentimento do formulário

## Compatibilidade preservada

- a landing continua fora da árvore de auth do CRM
- o CRM continua concentrado em `/crm` e nao foi alterado funcionalmente por está refatoração
- a captação de leads continua usando `src/services/leadService.ts`
- o contrato principal de envio continua baseado no endpoint publico configurado do Supabase
- o webhook opcional do n8n continua sendo disparado somente como etapa complementar e nao bloqueante
- o tracking existente continua centralizado em `src/services/analyticsService.ts`
- os tipos de evento atuais permanecem os mesmos:
  - `page_view`
  - `cta_click`
  - `lead_form_start`
  - `lead_form_submit_attempt`
  - `lead_form_submit_success`
  - `lead_form_submit_error`

## Arquivos principais envolvidos

- `index.html`: metadados base da área pública
- `src/App.tsx`: separação de rotas públicas e do CRM
- `src/pages/HomePage.tsx`: orquestração da landing principal
- `src/pages/PrivacyPage.tsx`
- `src/pages/TermsPage.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/LegalPageLayout.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Problems.tsx`
- `src/components/sections/Solution.tsx`
- `src/components/sections/Benefits.tsx`
- `src/components/sections/TrustSection.tsx`
- `src/components/sections/Pricing.tsx`
- `src/components/sections/Security.tsx`
- `src/components/sections/FaqSection.tsx`
- `src/components/sections/FinalCTA.tsx`
- `src/components/sections/LeadForm.tsx`
- `src/components/sections/SuccessView.tsx`
- `src/hooks/usePageMeta.ts`
- `src/services/leadService.ts`
- `src/services/analyticsService.ts`
- `src/lib/validations.ts`

## Restricoes para futuras alterações

- nao mover lógica do CRM para a área pública nem misturar wrappers de auth nas rotas de landing
- nao renomear nem remover eventos de tracking sem revisar todo o fluxo analitico existente
- nao alterar contratos de envio para Supabase ou webhook do n8n sem validar impacto na captação atual
- nao documentar prova social, integrações ou claims comerciais que nao estejám implementados ou sustentados no produto
- manter as paginas legais públicas acessíveis por rota dedicada e referênciadas no rodapé e no formulário
- ao alterar SEO da landing, revisar conjuntamente `index.html`, `usePageMeta` e as rotas públicas que definem metadados
