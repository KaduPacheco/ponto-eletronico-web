import { lazy, Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { tryGetSupabasePublicEnv } from "@/infra/supabase/env";
import { logAppEvent } from "@/lib/appLogger";

const LazyAuthProvider = lazy(() =>
  import("@/features/crm/auth/providers/AuthProvider").then((module) => ({
    default: module.AuthProvider,
  })),
);

const CrmBootstrapOutlet = () => {
  const supabaseEnv = tryGetSupabasePublicEnv();

  useEffect(() => {
    if (supabaseEnv) {
      return;
    }

    logAppEvent("crm", "error", "Bootstrap autenticado indisponível por configuração ausente");
  }, [supabaseEnv]);

  if (!supabaseEnv) {
    return <CrmConfigFallback />;
  }

  return (
    <Suspense fallback={<CrmBootstrapLoadingFallback />}>
      <LazyAuthProvider>
        <Outlet />
      </LazyAuthProvider>
    </Suspense>
  );
};

function CrmBootstrapLoadingFallback() {
  return (
    <div className="flex min-h-[240px] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

function CrmConfigFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">CRM indisponível no ambiente atual.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> para acessar as rotas autenticadas do
          CRM.
        </p>
      </div>
    </div>
  );
}

export default CrmBootstrapOutlet;
