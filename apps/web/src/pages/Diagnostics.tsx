import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { sentimentApi, type HealthResponse } from "@/lib/api";

type IntegrationStatus = Record<string, unknown>;

export default function DiagnosticsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState("");
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [integrationsError, setIntegrationsError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setHealthError("");
    setIntegrationsError("");

    const [healthResult, integrationsResult] = await Promise.allSettled([
      sentimentApi.health(),
      sentimentApi.integrationsStatus(),
    ]);

    if (healthResult.status === "fulfilled") setHealth(healthResult.value);
    else setHealthError(healthResult.reason instanceof Error ? healthResult.reason.message : "Falha no healthcheck.");

    if (integrationsResult.status === "fulfilled") setIntegrations(integrationsResult.value);
    else
      setIntegrationsError(
        integrationsResult.reason instanceof Error ? integrationsResult.reason.message : "Falha ao consultar integracoes."
      );

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell
      title="Diagnostico do sistema"
      subtitle="Disponibilidade da API e estado das integracoes (Mongo primario/secundario e LLM)."
      actions={
        <button type="button" className="secondary-btn" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} />
          <span>Atualizar</span>
        </button>
      }
    >
      <section className="mb-5 app-panel p-6">
        <header className="flex items-center gap-2">
          <Activity size={18} className="text-[color:var(--brand)]" />
          <h2 className="panel-title">Healthcheck (/health)</h2>
        </header>
        {healthError ? (
          <p className="mt-3 text-sm text-rose-600">{healthError}</p>
        ) : health ? (
          <div className="mt-3 text-sm text-muted-foreground">
            <p>Status: {health.status}</p>
            {health.version ? <p>Versao: {health.version}</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Carregando...</p>
        )}
      </section>

      <section className="mb-5 app-panel p-6">
        <h2 className="panel-title">Integracoes (/api/status/integrations)</h2>
        {integrationsError ? (
          <p className="mt-3 text-sm text-rose-600">{integrationsError}</p>
        ) : integrations ? (
          <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
            {JSON.stringify(integrations, null, 2)}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Carregando...</p>
        )}
      </section>
    </AppShell>
  );
}
