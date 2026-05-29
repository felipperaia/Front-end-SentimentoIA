import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  sentimentApi,
  type AdminUser,
  type AdminAuditLog,
  type AdminSystemStats,
  type AlertItem,
} from "@/lib/api";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [stats, setStats] = useState<AdminSystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [statsResult, usersResult, logsResult, alertsResult] = await Promise.allSettled([
      sentimentApi.adminSystemStats(),
      sentimentApi.adminUsers({ limit: 50 }),
      sentimentApi.adminAuditLogs({ limit: 50 }),
      sentimentApi.adminAlerts(),
    ]);

    if (statsResult.status === "fulfilled") setStats(statsResult.value);
    if (usersResult.status === "fulfilled") setUsers(usersResult.value);
    if (logsResult.status === "fulfilled") setAuditLogs(logsResult.value);
    if (alertsResult.status === "fulfilled") setAlerts(alertsResult.value);

    if (
      [statsResult, usersResult, logsResult, alertsResult].some((result) => result.status === "rejected")
    ) {
      toast.error("Alguns dados administrativos nao puderam ser carregados.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!isAdmin) return;
    void load();
  }, [isAdmin]);

  async function handleToggleActive(targetUserId: string) {
    setTogglingId(targetUserId);
    try {
      const result = await sentimentApi.adminToggleUserActive(targetUserId);
      setUsers((current) =>
        current.map((item) =>
          item.id === targetUserId ? { ...item, is_active: result.is_active ?? !item.is_active } : item
        )
      );
      toast.success("Status do usuario atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao alternar status do usuario.");
    } finally {
      setTogglingId(null);
    }
  }

  if (!authLoading && !isAdmin) {
    return (
      <AppShell title="Administracao" subtitle="Area restrita a administradores.">
        <div className="app-panel flex flex-col items-center gap-2 p-10 text-center">
          <ShieldAlert size={28} className="text-rose-600" />
          <p className="text-sm text-muted-foreground">
            Voce nao possui permissao de administrador para acessar esta area.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Administracao"
      subtitle="KPIs operacionais, usuarios, logs de auditoria e alertas globais."
      actions={
        <button type="button" className="secondary-btn" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} />
          <span>Atualizar</span>
        </button>
      }
    >
      <section className="mb-5 app-panel p-6">
        <h2 className="panel-title">Estatisticas do sistema</h2>
        {stats ? (
          <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
            {JSON.stringify(stats, null, 2)}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Sem dados.</p>
        )}
      </section>

      <section className="mb-5 app-panel p-6">
        <h2 className="panel-title">Usuarios ({users.length})</h2>
        <div className="mt-3 space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuario.</p>
          ) : (
            users.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{item.name || item.email || item.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.email || "-"} · {item.role || "user"} ·{" "}
                    {item.is_active === false ? "inativo" : "ativo"}
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={togglingId === item.id}
                  onClick={() => void handleToggleActive(item.id)}
                >
                  {togglingId === item.id ? "..." : item.is_active === false ? "Ativar" : "Inativar"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-5 app-panel p-6">
        <h2 className="panel-title">Logs de auditoria ({auditLogs.length})</h2>
        <ul className="mt-3 max-h-72 space-y-1 overflow-auto text-xs text-muted-foreground">
          {auditLogs.map((log) => (
            <li key={log.id} className="rounded border border-border/50 p-2">
              <span className="font-medium text-foreground">{log.action || "acao"}</span>
              {log.created_at ? ` · ${log.created_at}` : ""}
              {log.detail ? ` · ${log.detail}` : ""}
            </li>
          ))}
          {auditLogs.length === 0 ? <li>Nenhum log.</li> : null}
        </ul>
      </section>

      <section className="mb-5 app-panel p-6">
        <h2 className="panel-title">Alertas globais ({alerts.length})</h2>
        <ul className="mt-3 max-h-72 space-y-1 overflow-auto text-xs text-muted-foreground">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded border border-border/50 p-2">
              {String(alert.title || alert.message || "Alerta")}
              {alert.severity ? ` · ${String(alert.severity)}` : ""}
            </li>
          ))}
          {alerts.length === 0 ? <li>Nenhum alerta.</li> : null}
        </ul>
      </section>
    </AppShell>
  );
}
