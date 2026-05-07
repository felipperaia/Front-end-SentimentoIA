import { useAuth } from "@/_core/hooks/useAuth";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { Brain, FileText, LayoutDashboard, LogOut, Search, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";

type ShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

type MenuItem = {
  path: string;
  label: string;
  icon: typeof Search;
};

export function AppShell({ title, subtitle, actions, children }: ShellProps) {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();
  const { t } = useAppSettings();

  const menuItems: MenuItem[] = [
    { path: "/search", label: t("nav.search"), icon: Search },
    { path: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { path: "/analysis", label: t("nav.insights"), icon: Brain },
    { path: "/reports", label: t("nav.reports"), icon: FileText },
    { path: "/settings", label: t("nav.settings"), icon: Settings2 },
  ];

  return (
    <div className="app-bg min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 app-glass backdrop-blur-xl">
        <div className="container py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="brand-pill">SentimentoIA</div>
              <p className="hidden text-sm text-muted-foreground md:block">Inteligencia de reputacao com IA</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {menuItems.map((item) => {
                const active = location === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`shell-nav-btn ${active ? "shell-nav-btn-active" : ""}`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button onClick={logout} className="shell-nav-btn text-rose-600">
                <LogOut size={16} />
                <span>{t("nav.logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <section className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </section>

        {children}
      </main>
    </div>
  );
}
