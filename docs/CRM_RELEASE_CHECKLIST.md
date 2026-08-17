# Checklist de release do CRM

## Antes do merge

- [ ] `npm run lint`, `npm test` e `npm run build` passam no CI.
- [ ] Migrações SQL foram aplicadas e validadas em homologação, na ordem documentada.
- [ ] Usuários comerciais necessários estão provisionados com `crm_role` no `app_metadata` e papel em `crm_user_roles`.

## Smoke test de homologação

- [ ] Landing cria um lead com `origem = landing_page` e `status = novo`.
- [ ] Usuário não provisionado não acessa `/crm` nem dados pela API.
- [ ] Manager cria nota, tarefa, atribui owner e avança o pipeline.
- [ ] Qualificação sem owner ou próxima ação é rejeitada pelo banco.
- [ ] Dashboard e analytics carregam sem erro de permissão.

## Após o deploy

- [ ] Confirmar captura real do formulário e fluxo n8n.
- [ ] Verificar erros no provedor de observabilidade e nos logs do Supabase.
- [ ] Validar a primeira atualização de pipeline e o SLA no CRM.
