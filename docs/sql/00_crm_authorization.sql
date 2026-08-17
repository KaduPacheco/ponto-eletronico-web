-- AUTORIZACAO DO CRM (EXECUTAR ANTES DOS SCRIPTS 01 A 05)
-- Estar autenticado NAO concede acesso: somente usuarios provisionados.

CREATE TABLE IF NOT EXISTS public.crm_user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_user_roles ENABLE ROW LEVEL SECURITY;

-- Nao ha policy para authenticated: os papeis nao sao expostos ao cliente.
-- Provisionamento e administrativo (service_role / SQL administrativo).
CREATE OR REPLACE FUNCTION public.has_crm_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (required_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.has_crm_role(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_crm_role(TEXT[]) TO authenticated;

-- Exemplo (executar como administrador):
-- INSERT INTO public.crm_user_roles (user_id, role)
-- VALUES ('<auth-user-uuid>', 'manager')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now();
