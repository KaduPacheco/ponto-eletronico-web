# Fundação operacional do CRM

O CRM passa a operar com quatro regras explícitas:

- cada responsável pertence ao diretório `crm_profiles`, criado automaticamente para novos usuários autenticados;
- para mover um lead a `em_contato` ou `qualificado`, é obrigatório atribuir um responsável;
- para qualificá-lo, é obrigatório existir uma próxima ação aberta;
- tarefas atualizam automaticamente `next_action_at`, `next_action_type`, `last_interaction_at` e a situação de SLA do lead.

## Implantação

1. Faça backup e valide o schema atual em um projeto Supabase de homologação.
2. Para instalações legadas, execute `docs/sql/08_crm_operational_foundation.sql` após os scripts 01–04 e 07. Para novos ambientes, use exclusivamente a migração canônica em `supabase/migrations`.
3. Para cada membro do time, configure `full_name`, `role` e `is_active` na tabela `crm_profiles` pelo SQL Editor até a tela administrativa existir.
4. Faça o smoke test: atribuir responsável → criar follow-up → mover para `em_contato` → mover para `qualificado` → concluir a tarefa.

O prazo de SLA inicial é de 24 horas após a captura. Ele está centralizado na função `apply_lead_operational_rules`, portanto pode ser alterado sem modificar o frontend.
