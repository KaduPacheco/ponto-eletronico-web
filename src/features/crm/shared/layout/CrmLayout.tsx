import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, BriefcaseBusiness, LayoutDashboard, LogOut, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultAuthorizedCrmRoute } from "@/features/crm/auth/lib/authAccess";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { CRM_ROUTES } from "@/features/crm/shared/constants/routes";
import { getErrorMessage } from "@/lib/appLogger";
import { cn } from "@/utils/cn";

const navigationItems = [
  {
    to: CRM_ROUTES.root,
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
    requiredPermission: "crm:dashboard:read" as const,
  },
  {
    to: CRM_ROUTES.analytics,
    label: "Analytics",
    icon: BarChart3,
    requiredPermission: "crm:dashboard:read" as const,
  },
  {
    to: CRM_ROUTES.operação,
    label: "Operação",
    icon: BriefcaseBusiness,
    requiredPermission: "crm:dashboard:read" as const,
  },
  {
    to: CRM_ROUTES.leads,
    label: "Leads",
    icon: Users,
    requiredPermission: "crm:leads:read" as const,
  },
] as const;

const CrmLayout = () => {
  const { access, hasPermission, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const homeRoute = getDefaultAuthorizedCrmRoute(access);
  const visibleNavigationItems = navigationItems.filter((item) => hasPermission(item.requiredPermission));

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate(CRM_ROUTES.login);
    } catch (error) {
      toast({
        title: "Não foi possível encerrar a sessão",
        description: getErrorMessage(error, "Tente novamente em instantes."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/88">
        <div className="container flex h-full items-center justify-between">
          <div className="flex min-h-16 items-center gap-5 lg:gap-6">
            <Link to={homeRoute} className="text-xl font-bold tracking-tight text-primary">
              CRM Admin
            </Link>
            <nav className="hidden items-center gap-1.5 md:flex lg:gap-2">
              {visibleNavigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-background/70 hover:text-foreground",
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <span className="hidden text-xs text-muted-foreground xl:block">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-8 crm-container">
        <Outlet />
      </main>
    </div>
  );
};

export default CrmLayout;
