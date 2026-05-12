import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppSettingsProvider, useAppSettings } from "./contexts/AppSettingsContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/Search";
import AnalysisPage from "./pages/Analysis";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import MFAVerify from "./pages/MFAVerify";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NpsModal from "./components/NpsModal";
import { AlertTriangle, RotateCcw } from "lucide-react";

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
        <ErrorBoundary fallback={(error) => <AppErrorFallback error={error} />}>
          <TooltipProvider>
            <Toaster />
            <Router />
            <NpsModal />
          </TooltipProvider>
        </ErrorBoundary>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}

function AppErrorFallback({ error }: { error: Error | null }) {
  const { t } = useAppSettings();

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-8">
      <div className="app-panel flex w-full max-w-2xl flex-col items-center p-8 text-center">
        <AlertTriangle size={48} className="mb-6 text-destructive" />
        <h2 className="mb-4 text-xl font-semibold">{t("errorBoundary.title")}</h2>
        {error?.stack ? (
          <div className="mb-6 max-h-72 w-full overflow-auto rounded-md bg-muted p-4 text-left">
            <pre className="whitespace-break-spaces text-sm text-muted-foreground">{error.stack}</pre>
          </div>
        ) : null}
        <button onClick={() => window.location.reload()} className="primary-btn">
          <RotateCcw size={16} />
          {t("errorBoundary.reload")}
        </button>
      </div>
    </div>
  );
}

export default App;
