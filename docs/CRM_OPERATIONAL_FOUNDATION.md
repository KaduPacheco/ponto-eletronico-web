# Fundação operacional do CRM

O P1 usa o funil `novo → contato → diagnostico → demonstracao → proposta → negociacao → ganho/perdido`.

- cada responsável deve estar provisionado em `crm_profiles` e `crm_user_roles`;
- toda etapa aberta após `novo` exige responsável e próxima ação;
- `perdido` exige `lost_reason`;
- `ganho` exige `lifetime_value > 0`;
- `closed_at` é preenchido automaticamente em ganho/perdido;
- alterações comerciais e auditoria são gravadas pela mesma RPC transacional.

## Implantação

1. Faça backup e valide o schema em um projeto Supabase de homologação.
2. Execute `20260817120000_crm_p1_security_and_pipeline.sql` após a migração base.
3. Provisione usuários pelo fluxo administrativo/SQL autorizado; não use INSERT anônimo.
4. Faça o smoke test: atribuir responsável → criar follow-up → avançar pelo funil → testar ganho e perda.

As migrações devem ser aplicadas em ordem, em staging antes de produção, sem alterar segredos ou executar deploy automaticamente.
