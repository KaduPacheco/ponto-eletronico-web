# Scripts SQL legados

Para novos ambientes, use `supabase/migrations/20260817100000_crm_base.sql`.
Ele contém o schema completo, RLS, provisionamento e atribuição.

Estes scripts só existem para referência de instalações anteriores e seguem
esta ordem sem duplicidade: `00`, `01`–`05`, `07`, `08`, `09`. Não os misture
com a migração-base sem antes testar a execução em uma restauração de backup.
