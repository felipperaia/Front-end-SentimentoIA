import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { sentimentApi, type AlertItem } from "@/lib/api";

function resolveAlertText(alert: AlertItem): string {
  if (typeof alert.title === "string" && alert.title) return alert.title;
  if (typeof alert.message === "string" && alert.message) return alert.message;
  return "Alerta";
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const items = await sentimentApi.alerts();
      setAlerts(items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar alertas.");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell
      title="Alertas"
      subtitle="Alertas do usuario gerados a partir das mencoes monitoradas."
      actions={
        <button type="button" className="secondary-btn" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} />
          <span>Atualizar</span>
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando alertas...</p>
      ) : alerts.length === 0 ? (
        <div className="app-panel flex flex-col items-center gap-2 p-10 text-center">
          <BellRing size={28} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className="app-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{resolveAlertText(alert)}</p>
                {alert.severity ? (
                  <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                    {String(alert.severity)}
                  </span>
                ) : null}
              </div>
              {alert.message && alert.message !== resolveAlertText(alert) ? (
                <p className="mt-1 text-xs text-muted-foreground">{String(alert.message)}</p>
              ) : null}
              {alert.created_at ? (
                <p className="mt-2 text-xs text-muted-foreground">{String(alert.created_at)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
