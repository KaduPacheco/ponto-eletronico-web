import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/crm/auth/hooks/useAuth";
import { AuthPermission, getDefaultAuthorizedCrmRoute } from "@/features/crm/auth/lib/authAccess";
import { CRM_ROUTES } from "@/features/crm/shared/constants/routes";
import { logAppEvent } from "@/lib/appLogger";

interface ProtectedRouteProps {
  requiredPermission?: AuthPermission;
  loginPath?: string;
  unauthorizedPath?: string;
}

const ProtectedRoute = ({
  requiredPermission,
  loginPath = CRM_ROUTES.login,
  unauthorizedPath,
}: ProtectedRouteProps) => {
  const { access, session, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    const fallbackPath = unauthorizedPath ?? getDefaultAuthorizedCrmRoute(access);

    logAppEvent("auth", "warn", "Acesso negado por permissão", {
      pathname: location.pathname,
      requiredPermission,
      userId: session.user.id,
      fallbackPath,
    });

    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location, reason: "missing_permission", requiredPermission }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
