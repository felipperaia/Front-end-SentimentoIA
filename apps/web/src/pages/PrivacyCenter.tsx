import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { sentimentApi } from "@/lib/api";

const SESSION_ID_KEY = "sentimentoia_session_id";

function resolveSessionId(): string {
  const existing = localStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SESSION_ID_KEY, next);
  return next;
}

type JsonRecord = Record<string, unknown>;

function JsonPanel({ title, data }: Readonly<{ title: string; data: JsonRecord | null }>) {
  return (
    <section className="mb-5 app-panel p-6">
      <h2 className="panel-title">{title}</h2>
      {data ? (
        <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Sem dados disponiveis.</p>
      )}
    </section>
  );
}

export default function PrivacyCenter() {
  const [policy, setPolicy] = useState<JsonRecord | null>(null);
  const [rights, setRights] = useState<JsonRecord | null>(null);
  const [consent, setConsent] = useState<JsonRecord | null>(null);
  const [exportSummary, setExportSummary] = useState<JsonRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const sessionId = resolveSessionId();
      const [policyResult, rightsResult, consentResult, summaryResult] = await Promise.allSettled([
        sentimentApi.getPrivacyPolicy(),
        sentimentApi.getPrivacyRights(),
        sentimentApi.getConsent(sessionId),
        sentimentApi.getPrivacyExportSummary(),
      ]);

      if (!active) return;

      if (policyResult.status === "fulfilled") setPolicy(policyResult.value);
      if (rightsResult.status === "fulfilled") setRights(rightsResult.value);
      if (consentResult.status === "fulfilled") setConsent(consentResult.value);
      if (summaryResult.status === "fulfilled") setExportSummary(summaryResult.value);

      const failed = [policyResult, rightsResult, consentResult, summaryResult].filter(
        (result) => result.status === "rejected"
      );
      if (failed.length > 0) {
        toast.error("Algumas informacoes de privacidade nao puderam ser carregadas.");
      }

      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell
      title="Central de Privacidade"
      subtitle="Politica, direitos LGPD, consentimento atual e resumo de dados do usuario."
      actions={<ShieldCheck size={20} className="text-[color:var(--brand)]" />}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando informacoes de privacidade...</p>
      ) : (
        <>
          <JsonPanel title="Politica de privacidade" data={policy} />
          <JsonPanel title="Direitos LGPD" data={rights} />
          <JsonPanel title="Consentimento atual" data={consent} />
          <JsonPanel title="Resumo de dados (transparencia)" data={exportSummary} />
        </>
      )}
    </AppShell>
  );
}
