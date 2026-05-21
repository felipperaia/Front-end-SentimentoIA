import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppSettingsProvider, useAppSettings } from "./contexts/AppSettingsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NpsModal from "./components/NpsModal";
import { CookieBanner } from "./components/CookieBanner";
import { AlertTriangle, RotateCcw } from "lucide-react";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SearchPage = lazy(() => import("./pages/Search"));
const AnalysisPage = lazy(() => import("./pages/Analysis"));
const MetricsPage = lazy(() => import("./pages/Metrics"));
const ReportsPage = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const MFAVerify = lazy(() => import("./pages/MFAVerify"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function renderAppErrorFallback(error: Error | null) {
  return <AppErrorFallback error={error} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/recuperar-senha" component={ForgotPassword} />
      <Route path="/redefinir-senha" component={ResetPassword} />
      <Route path="/mfa-verify" component={MFAVerify} />
      <Route path="/dashboard">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
      <Route path="/search">{() => <ProtectedRoute><SearchPage /></ProtectedRoute>}</Route>
      <Route path="/analysis">{() => <ProtectedRoute><AnalysisPage /></ProtectedRoute>}</Route>
      <Route path="/metrics">{() => <ProtectedRoute><MetricsPage /></ProtectedRoute>}</Route>
      <Route path="/reports">{() => <ProtectedRoute><ReportsPage /></ProtectedRoute>}</Route>
      <Route path="/settings">{() => <ProtectedRoute><SettingsPage /></ProtectedRoute>}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" switchable>
      <AppSettingsProvider>
        <ErrorBoundary fallback={renderAppErrorFallback}>
          <TooltipProvider>
            <Toaster />
            <Suspense fallback={<RouteLoadingFallback />}>
              <Router />
            </Suspense>
            <NpsModal />
            <CookieBanner />
          </TooltipProvider>
        </ErrorBoundary>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="app-bg flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[color:var(--brand)]" />
    </div>
  );
}

function AppErrorFallback({ error: _error }: Readonly<{ error: Error | null }>) {
  const { t } = useAppSettings();

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-8">
      <div className="app-panel flex w-full max-w-2xl flex-col items-center p-8 text-center">
        <AlertTriangle size={48} className="mb-6 text-destructive" />
        <h2 className="mb-4 text-xl font-semibold">{t("errorBoundary.title")}</h2>
        <button onClick={() => globalThis.location.reload()} className="primary-btn">
          <RotateCcw size={16} />
          {t("errorBoundary.reload")}
        </button>
      </div>
    </div>
  );
}

export default App;
