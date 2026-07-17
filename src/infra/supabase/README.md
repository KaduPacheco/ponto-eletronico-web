# Infra Supabase

Area reservada para infraestrutura compartilhada de acesso ao Supabase.

Objetivo atual:

- concentrar cliente, leitura de env pública e adaptadores de integração técnica
- separar infraestrutura de regras de negócio e features

Nestá etapa:

- `src/infra/supabase/client.ts` concentra o client singleton do frontend
- `src/infra/supabase/env.ts` concentra a leitura tipada e a validação das variaveis públicas
- `src/lib/supabase.ts` permanece como facháda de compatibilidade para imports legados
