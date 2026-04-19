import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "./components/ui/Tooltip";
import { Toaster } from "./components/ui/Toaster";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

// Rotas CRM (Isoladas)
import CrmLayout from "./features/crm/shared/layout/CrmLayout";
import CrmBootstrapOutlet from "./features/crm/auth/components/CrmBootstrapOutlet";
import ProtectedRoute from "./features/crm/auth/components/ProtectedRoute";

const queryClient = new QueryClient();
const LoginPage = lazy(() => import("./features/crm/auth/page/LoginPage"));
const DashboardPage = lazy(() => import("./features/crm/dashboard/page/DashboardPage"));
const AnalyticsPage = lazy(() => import("./features/crm/analytics/page/AnalyticsPage"));
const OperacaoPage = lazy(() => import("./features/crm/operacao/page/OperacaoPage"));
const LeadsPage = lazy(() => import("./pages/crm/LeadsPage"));
const LeadDetailPage = lazy(() => import("./pages/crm/LeadDetailPage"));

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing pública */}
            <Route path="/" element={<HomePage />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPage />} />
            <Route path="/termos-de-uso" element={<TermsPage />} />

            {/* Contexto de CRM (Isolado) */}
            <Route path="/crm">
              <Route element={<CrmBootstrapOutlet />}>
                <Route path="login" element={renderLazyCrmPage(<LoginPage />)} />
                <Route element={<ProtectedRoute requiredPermission="crm:access" />}>
                  <Route element={<CrmLayout />}>
                    <Route element={<ProtectedRoute requiredPermission="crm:dashboard:read" />}>
                      <Route index element={renderLazyCrmPage(<DashboardPage />)} />
                      <Route path="analytics" element={renderLazyCrmPage(<AnalyticsPage />)} />
                      <Route path="operacao" element={renderLazyCrmPage(<OperacaoPage />)} />
                    </Route>
                    <Route element={<ProtectedRoute requiredPermission="crm:leads:read" />}>
                      <Route path="leads" element={renderLazyCrmPage(<LeadsPage />)} />
                      <Route path="leads/:id" element={renderLazyCrmPage(<LeadDetailPage />)} />
                    </Route>
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

function renderLazyCrmPage(page: ReactNode) {
  return <Suspense fallback={<CrmPageLoadingFallback />}>{page}</Suspense>;
}

function CrmPageLoadingFallback() {
  return (
    <div className="flex min-h-[240px] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

export default App;
