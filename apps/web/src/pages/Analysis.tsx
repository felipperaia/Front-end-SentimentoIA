import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Archive,
  Brain,
  Clock3,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { InsightItem, sentimentApi } from "@/lib/api";

export default function AnalysisPage() {
  const [items, setItems] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState("");

  async function loadInsights(include = includeArchived) {
    setLoading(true);
    setError("");
    try {
      const response = await sentimentApi.insights({ include_archived: include, limit: 100 });
      setItems(response.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar insights");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInsights();
  }, [includeArchived]);

  async function handleGenerate() {
    setProcessing(true);
    setError("");
    try {
      await sentimentApi.generateInsight();
      await loadInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar insight");
    } finally {
      setProcessing(false);
    }
  }

  async function runItemAction(insightId: string, action: "archive" | "delete" | "regenerate") {
    setActiveActionId(insightId);
    setError("");
    try {
      if (action === "archive") {
        await sentimentApi.archiveInsight(insightId);
      } else if (action === "delete") {
        await sentimentApi.deleteInsight(insightId);
      } else {
        await sentimentApi.regenerateInsight(insightId);
      }
      await loadInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao executar acao no insight");
    } finally {
      setActiveActionId(null);
    }
  }

  let content: ReactNode;
  if (loading) {
    content = <div className="text-sm text-muted-foreground">Carregando insights...</div>;
  } else if (error) {
    content = (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
        {error}
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <div className="app-panel mx-auto max-w-3xl p-10 text-center">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-[color:var(--brand)]" />
        <h2 className="text-2xl font-semibold">Nenhum insight encontrado</h2>
        <p className="mb-6 mt-2 text-muted-foreground">
          Processe mencoes no pipeline e clique em gerar insight para criar o primeiro.
        </p>
        <button onClick={handleGenerate} disabled={processing} className="primary-btn mx-auto">
          {processing ? "GERANDO..." : "GERAR AGORA"}
        </button>
      </div>
    );
  } else {
    content = (
      <section className="space-y-4">
        {items.map((item) => {
          const isRunning = activeActionId === item.id;
          return (
            <article key={item.id} className="app-panel p-5 md:p-6">
              <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{item.executive_summary || "Insight sem resumo"}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="badge-chip">{item.trend || "indefinido"}</span>
                    <span className="badge-chip">batch: {item.batch_id || "-"}</span>
                    <span className="badge-chip">trigger: {item.trigger || "manual"}</span>
                    {item.archived ? <span className="badge-chip">arquivado</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 size={16} /> {formatDate(item.created_at)}
                </div>
              </header>

              <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">Visao de sentimento</h3>
                  <p className="text-sm">{item.sentiment_overview || "Sem visao consolidada."}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">Riscos</h3>
                  <ul className="space-y-1 text-sm">
                    {(item.risks && item.risks.length > 0 ? item.risks : ["Sem riscos mapeados."]).map((risk, idx) => (
                      <li key={`${item.id}-risk-${idx}`}>{idx + 1}. {risk}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">Acoes recomendadas</h3>
                  <ul className="space-y-1 text-sm">
                    {(item.recommended_actions && item.recommended_actions.length > 0
                      ? item.recommended_actions
                      : ["Sem acoes recomendadas."]
                    ).map((action, idx) => (
                      <li key={`${item.id}-action-${idx}`}>{idx + 1}. {action}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-border/70 bg-background/75 p-4">
                <h3 className="mb-2 text-sm uppercase text-muted-foreground">Direcionamento de decisao</h3>
                <p>{item.decision_guidance || "Sem direcionamento disponivel."}</p>
              </div>

              <footer className="flex flex-wrap gap-3">
                <button
                  onClick={() => runItemAction(item.id, "regenerate")}
                  disabled={isRunning}
                  className="secondary-btn"
                >
                  <Wand2 size={16} /> {isRunning ? "PROCESSANDO..." : "REGERAR"}
                </button>

                {!item.archived && (
                  <button
                    onClick={() => runItemAction(item.id, "archive")}
                    disabled={isRunning}
                    className="secondary-btn"
                  >
                    <Archive size={16} /> ARQUIVAR
                  </button>
                )}

                <button
                  onClick={() => runItemAction(item.id, "delete")}
                  disabled={isRunning}
                  className="rounded-xl border border-rose-300 px-4 py-2 text-rose-700 transition hover:bg-rose-100 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/30"
                >
                  <Trash2 size={16} /> APAGAR
                </button>
              </footer>
            </article>
          );
        })}
      </section>
    );
  }

  return (
    <AppShell
      title="Insights de IA"
      subtitle="Gestao de insights gerados a partir dos lotes processados no pipeline de mencoes."
      actions={
        <>
          <button onClick={() => loadInsights()} className="secondary-btn">
            <RefreshCw size={16} /> Atualizar
          </button>
          <button onClick={handleGenerate} disabled={processing} className="primary-btn">
            <Brain size={16} /> {processing ? "Gerando..." : "Gerar insight"}
          </button>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-border/70 bg-card/80 p-3 text-sm">
        <input
          id="show-archived"
          type="checkbox"
          checked={includeArchived}
          onChange={(event) => setIncludeArchived(event.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="show-archived">Mostrar insights arquivados</label>
      </div>

      {content}
    </AppShell>
  );
}

function formatDate(raw?: string) {
  if (!raw) return "Data indisponivel";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Data invalida";
  return date.toLocaleString("pt-BR");
}
