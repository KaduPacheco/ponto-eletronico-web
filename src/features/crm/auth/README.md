# CRM Auth

Camada coesa de autenticação e autorização do frontend do CRM.

Escopo atual:

- `providers/AuthProvider.tsx`
- `hooks/useAuth.ts`
- `components/ProtectedRoute.tsx`
- `lib/authAccess.ts`
- `types/auth-access.ts`
- `types/auth-context.ts`

Compatibilidade temporaria:

- `src/contexts/AuthContext.tsx`
- `src/contexts/auth-context.ts`
- `src/hooks/useAuth.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/lib/authAccess.ts`

Esses caminhos legados seguem disponíveis por re-export para reduzir risco durante a migração por feature.
