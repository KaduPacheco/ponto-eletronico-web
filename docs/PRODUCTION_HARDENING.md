# Produção: hardening CRM e intake

## Fonte única de acesso

`public.crm_user_roles` é a única fonte de autorização. O frontend chama
`get_my_crm_access()` para obter somente o próprio papel, e todas as tabelas
do CRM aplicam `has_crm_role(...)` via RLS. `app_metadata` não participa mais
da autorização e `crm_profiles` não possui papel nem é legível por usuários
autenticados sem acesso ao CRM.

Provisionamento e remoção ocorrem exclusivamente por uma sessão administrativa
(SQL Editor ou job com `service_role`):

```sql
select public.provision_crm_user('<auth-user-uuid>', 'manager', 'Nome da pessoa');
select public.revoke_crm_user('<auth-user-uuid>');
```

Não faça `INSERT` manual em `crm_profiles`, nem altere `app_metadata.crm_role`.

## Migrações

A fonte canônica é `supabase/migrations/20260817100000_crm_base.sql`. Ela cria
o schema completo, é idempotente e também atualiza instalações antigas. Os
scripts em `docs/sql/` são material histórico; não devem ser aplicados em uma
nova instalação nem misturados a essa migração.

Ordem de homologação:

1. Gere um backup restaurável e registre o hash/horário.
2. Restaure esse backup em um projeto isolado e execute a migração duas vezes.
3. Compare o schema esperado com `supabase db diff` e execute os smoke tests
   abaixo.
4. Aplique no projeto de homologação e repita os testes com usuários reais.
5. Só então agende produção com backup validado e janela de reversão.

Nunca use `DISABLE ROW LEVEL SECURITY` como rollback. A reversão é feita
restaurando o backup validado ou por uma migração corretiva que preserve RLS.

## Smoke tests de segurança e schema

- um usuário autenticado sem `crm_user_roles` não lê `leads` ou `crm_profiles`;
- um `manager` lê a carteira e o diretório de responsáveis;
- `revoke_crm_user` bloqueia o acesso no próximo refresh de sessão;
- a tabela `leads` contém `lifetime_value` e os campos operacionais;
- `lead_attribution` contém `visitor_id`, `session_id` e UTMs para cada lead;
- duas requisições com a mesma `Idempotency-Key` retornam o mesmo `lead_id`;
- uma repetição do mesmo IP/WhatsApp dentro de cinco minutos recebe `429`.

## Intake único

A landing usa somente `VITE_LEAD_INTAKE_URL`, apontando para a Edge Function
`lead-intake`. A função valida dados, limita frequência, cria a chave de
idempotência, grava `leads` e `lead_attribution` em uma operação do banco e
só depois dispara automação. Configure `N8N_LEAD_AUTOMATION_URL` apenas como
segredo da Edge Function; ela não pode ser uma variável `VITE_*`.
