import { ReactNode, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/infra/supabase/client";
import { buildAuthAccess, hasPermission } from "@/features/crm/auth/lib/authAccess";
import { AuthContext } from "@/features/crm/auth/types/auth-context";
import { getErrorMessage, logAppEvent } from "@/lib/appLogger";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const access = useMemo(() => buildAuthAccess(user), [user]);

  useEffect(() => {
    let isMounted = true;

    const syncSessionState = (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthError(null);
      setLoading(false);
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }

        syncSessionState(data.session);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        const message = getErrorMessage(error, "Não foi possível restáurar a sessão.");

        logAppEvent("auth", "error", "Falha ao carregar sessão inicial", {
          error: message,
        });

        setAuthError(message);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      logAppEvent("auth", "info", "Mudanca de autenticação recebida", {
        event,
        userId: nextSession?.user?.id ?? null,
      });

      syncSessionState(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      const message = getErrorMessage(error, "Não foi possível encerrar a sessão.");

      logAppEvent("auth", "error", "Falha ao encerrar sessão", {
        error: message,
      });

      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        access,
        loading,
        authError,
        hasPermission: (permission) => hasPermission(access, permission),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
