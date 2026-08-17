# Escala e métricas do CRM

A migração `07_crm_scale_and_metrics.sql` desloca duas operações caras do navegador para o PostgreSQL:

- `get_crm_leads_page`: pagina e filtra a carteira, calculando próximo follow-up e atrasos por lead;
- `get_crm_analytics_summary`: devolve KPIs, funil e série diária agregados, sem expor eventos brutos.

As funções já verificam o papel comercial no banco e limitam a página a 100 registros. A ativação na interface deve substituir as leituras atuais de coleção inteira depois da aplicação em homologação.
