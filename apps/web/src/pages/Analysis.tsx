import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  Brain,
  Clock3,
  Download,
  FileText,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  ApiRequestError,
  type InsightItem,
  sentimentApi,
} from "@/lib/api";
import { toast } from "sonner";

type PriorityUrgencyFilter = "any" | "high" | "medium" | "low";
type ResolutionFilter = "any" | "pending" | "in_progress" | "resolved";

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveDefaultDateRange(days = 30): { from: string; to: string } {
  const safeDays = Math.max(1, Math.min(365, Math.round(days || 30)));
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (safeDays - 1));
  return {
    from: toDateInput(start),
    to: toDateInput(end),
  };
}

function resolveInsightId(item: InsightItem): string {
  return item.insight_id || item.id;
}

function resolveInsightConfidence(item: InsightItem): number | null {
  if (typeof item.avg_confidence !== "number" || !Number.isFinite(item.avg_confidence)) {
    return null;
  }

  if (item.avg_confidence <= 1) {
    return Math.max(0, Math.min(1, item.avg_confidence));
  }

  return Math.max(0, Math.min(1, item.avg_confidence / 100));
}

function resolveInsightDateSortValue(item: InsightItem): number {
  const rawDate =
    item.period_to ||
    item.period_from ||
    item.timestamp ||
    item.created_at ||
    item.updated_at ||
    "";

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return 0;
  return parsed.getTime();
}

function resolveInsightPeriodLabel(item: InsightItem): string {
  if (item.period_label?.trim()) {
    return item.period_label;
  }

  if (item.period_from && item.period_to) {
    return `${item.period_from} - ${item.period_to}`;
  }

  if (item.period_from || item.period_to) {
    return item.period_from || item.period_to || "Periodo nao informado";
  }

  return item.batch_id || "Periodo nao informado";
}

function resolveConfidenceBadge(confidence: number, t: ReturnType<typeof useAppSettings>["t"]) {
  if (confidence >= 0.75) {
    return {
      label: t("mention.confidenceHigh"),
      icon: "✓",
      className: "badge-chip border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    };
  }

  if (confidence >= 0.5) {
    return {
      label: t("mention.confidenceMedium"),
      icon: "~",
      className: "badge-chip border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    };
  }

  return {
    label: t("mention.confidenceLow"),
    icon: "⚠",
    className: "badge-chip border border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
  };
}

export default function AnalysisPage() {
  const { settings, t } = useAppSettings();
  const [defaultRange] = useState(() => resolveDefaultDateRange(30));
  const [selectedCompanySlug, setSelectedCompanySlug] = useState("");
  const { data: companiesData } = useQuery({
    queryKey: ["companies"],
    queryFn: sentimentApi.listCompanies,
    staleTime: 5 * 60 * 1000,
  });
  const companies = companiesData ?? [];
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [items, setItems] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeExport, setActiveExport] = useState<"pdf" | "csv" | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityUrgencyFilter>("any");
  const [urgencyFilter, setUrgencyFilter] = useState<PriorityUrgencyFilter>("any");
  const [resolutionFilter, setResolutionFilter] = useState<ResolutionFilter>("any");
  const [error, setError] = useState("");
  const [expectedStateMessage, setExpectedStateMessage] = useState("");
  const hasRequiredFilters = Boolean(selectedCompanySlug && fromDate && toDate);

  async function loadInsights(include = includeArchived): Promise<InsightItem[]> {
    if (!hasRequiredFilters) {
      setItems([]);
      setLoading(false);
      setError("");
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const existingParams = {
        include_archived: include,
        limit: 100,
        priority: priorityFilter === "any" ? undefined : priorityFilter,
        urgency: urgencyFilter === "any" ? undefined : urgencyFilter,
        resolution: resolutionFilter === "any" ? undefined : resolutionFilter,
        company_slug: selectedCompanySlug,
        from: fromDate,
        to: toDate,
      };
      const response = await sentimentApi.insights(existingParams);
      let normalizedItems: InsightItem[] = [];
      if (Array.isArray(response?.items)) {
        normalizedItems = response.items;
      } else if (Array.isArray(response as unknown)) {
        normalizedItems = response as unknown as InsightItem[];
      }
      const sortedItems = [...normalizedItems].sort(
        (a, b) => resolveInsightDateSortValue(b) - resolveInsightDateSortValue(a)
      );
      setItems(
        sortedItems
      );
      return sortedItems;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("analysis.loadError"));
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasRequiredFilters) {
      setItems([]);
      setLoading(false);
      setError("");
      return;
    }

    void loadInsights();
  }, [hasRequiredFilters, includeArchived, priorityFilter, urgencyFilter, resolutionFilter, selectedCompanySlug, fromDate, toDate]);

  async function handleGenerate() {
    if (!hasRequiredFilters) {
      toast.error("Selecione empresa e periodo antes de gerar insights.");
      return;
    }

    setProcessing(true);
    setError("");
    setExpectedStateMessage("");

    try {
      const existingItems = await loadInsights();
      if (existingItems.length > 0) {
        toast.info("Insight persistido encontrado para o filtro atual. Reutilizando resultado existente.");
        return;
      }

      await sentimentApi.generateInsight({
        company_slug: selectedCompanySlug,
        from: fromDate,
        to: toDate,
      });
      await loadInsights();
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "threshold_not_met") {
        const meta = (err.data?.meta ?? {}) as Record<string, unknown>;
        const threshold = Number(meta.threshold ?? 0);
        const processedCount = Number(meta.processed_count ?? 0);
        const fallbackMessage =
          threshold > 0
            ? `Ainda nao ha mencoes suficientes para gerar insight (${processedCount}/${threshold}). Execute mais buscas ou aguarde o processamento.`
            : "Ainda nao ha mencoes suficientes para gerar insight. Execute mais buscas ou aguarde o processamento.";

        const actionableMessage =
          typeof meta.actionable_message === "string" && meta.actionable_message.trim().length > 0
            ? meta.actionable_message
            : fallbackMessage;

        setExpectedStateMessage(actionableMessage);
        return;
      }
      setError(err instanceof Error ? err.message : t("analysis.generateError"));
    } finally {
      setProcessing(false);
    }
  }

  async function runItemAction(insightId: string, action: "delete" | "regenerate") {
    setActiveActionId(insightId);
    setError("");
    try {
      if (action === "delete") {
        await sentimentApi.deleteInsight(insightId);
      } else {
        await sentimentApi.regenerateInsight(insightId);
      }
      await loadInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("analysis.actionError"));
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleInsightsExport(format: "pdf" | "csv") {
    if (!hasRequiredFilters) {
      toast.error("Selecione empresa e periodo antes de exportar insights.");
      return;
    }

    setActiveExport(format);
    try {
      const exportFilters = {
        priority: priorityFilter === "any" ? undefined : priorityFilter,
        resolution: resolutionFilter === "any" ? undefined : resolutionFilter,
        companySlug: selectedCompanySlug,
        from: fromDate,
        to: toDate,
        limit: 100,
      };

      if (format === "pdf") {
        await sentimentApi.exportInsightsPdf(exportFilters);
      } else {
        await sentimentApi.exportInsightsCsv(exportFilters);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao exportar insights.");
    } finally {
      setActiveExport(null);
    }
  }

  let content: ReactNode;
  if (!hasRequiredFilters) {
    content = (
      <div className="app-panel mx-auto max-w-3xl p-10 text-center">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-[color:var(--brand)]" />
        <h2 className="text-2xl font-semibold">Selecione uma empresa para iniciar</h2>
        <p className="mb-6 mt-2 text-muted-foreground">
          Insights sao carregados apenas com empresa e faixa de datas definidas.
        </p>
      </div>
    );
  } else if (loading) {
    content = <div className="text-sm text-muted-foreground">{t("analysis.loading")}</div>;
  } else if (error) {
    content = (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
        <p className="mb-3">{error}</p>
        <button onClick={() => void loadInsights()} className="secondary-btn">
          <RefreshCw size={16} /> {t("common.refresh")}
        </button>
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <div className="app-panel mx-auto max-w-3xl p-10 text-center">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-[color:var(--brand)]" />
        <h2 className="text-2xl font-semibold">{t("analysis.emptyTitle")}</h2>
        <p className="mb-6 mt-2 text-muted-foreground">
          {t("analysis.emptyText")}
        </p>
        <button onClick={handleGenerate} disabled={processing} className="primary-btn mx-auto">
          {processing ? t("analysis.generating") : t("analysis.emptyAction")}
        </button>
      </div>
    );
  } else {
    content = (
      <section className="space-y-4">
        {items.map((item) => {
          const insightId = resolveInsightId(item);
          const isRunning = activeActionId === insightId;
          const confidence = resolveInsightConfidence(item);
          const confidencePercent = confidence === null ? null : Math.round(confidence * 100);
          const confidenceBadge = confidence === null ? null : resolveConfidenceBadge(confidence, t);
          return (
            <article key={insightId} className="app-panel p-5 md:p-6">
              <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{item.executive_summary || t("analysis.untitled")}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="badge-chip">{item.trend || t("analysis.undefinedTrend")}</span>
                    <span className="badge-chip">Empresa: {item.company_name || item.company || "Nao informada"}</span>
                    <span className="badge-chip">Periodo: {resolveInsightPeriodLabel(item)}</span>
                    <span className="badge-chip">{t("analysis.trigger")}: {item.trigger || t("analysis.manual")}</span>
                    <span className={priorityBadgeClass(item.priority)}>
                      Prioridade: {priorityLabel(item.priority)}
                    </span>
                    <span className="badge-chip">Urgência: {urgencyLabel(item.urgency)}</span>
                    <span className="badge-chip">Status: {statusLabel(item.status)}</span>
                    <span className="badge-chip">Resolução: {resolutionLabel(item.resolution)}</span>
                    {confidenceBadge ? (
                      <span className={confidenceBadge.className} title={t("analysis.confidenceTooltip")}>
                        {confidenceBadge.icon} {confidenceBadge.label} ({confidencePercent}%)
                      </span>
                    ) : null}
                    {item.archived ? <span className="badge-chip">{t("analysis.archived")}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 size={16} /> {formatDate(item.created_at, settings.locale, t)}
                </div>
              </header>

              <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">{t("analysis.sentimentOverview")}</h3>
                  <p className="text-sm">{item.sentiment_overview || t("analysis.noSentimentOverview")}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">{t("analysis.risks")}</h3>
                  <ul className="space-y-1 text-sm">
                    {(item.risks && item.risks.length > 0 ? item.risks : [t("analysis.noRisks")]).map((risk, idx) => (
                      <li key={`${insightId}-risk-${idx}`}>{idx + 1}. {risk}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">{t("analysis.actions")}</h3>
                  <ul className="space-y-1 text-sm">
                    {(item.recommended_actions && item.recommended_actions.length > 0
                      ? item.recommended_actions
                      : [t("analysis.noActions")]
                    ).map((action, idx) => (
                      <li key={`${insightId}-action-${idx}`}>{idx + 1}. {action}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-border/70 bg-background/75 p-4">
                <h3 className="mb-2 text-sm uppercase text-muted-foreground">{t("analysis.guidance")}</h3>
                <p>{item.decision_guidance || t("analysis.noGuidance")}</p>
              </div>

              <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">Empresa</h3>
                  <p>{item.company_name || item.company || "-"}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">Periodo</h3>
                  <p>{resolveInsightPeriodLabel(item)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">Causa raiz</h3>
                  <p>{item.root_cause || "Não informado"}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                  <h3 className="mb-2 text-sm uppercase text-muted-foreground">Ação recomendada</h3>
                  <p>{item.recommended_action || "Não informado"}</p>
                </div>
              </div>

              <footer className="flex flex-wrap gap-3">
                <button
                  onClick={() => runItemAction(insightId, "regenerate")}
                  disabled={isRunning}
                  className="secondary-btn"
                >
                  <Wand2 size={16} /> {isRunning ? t("common.processing") : t("analysis.regenerate")}
                </button>

                <button
                  onClick={() => runItemAction(insightId, "delete")}
                  disabled={isRunning}
                  className="rounded-xl border border-rose-300 px-4 py-2 text-rose-700 transition hover:bg-rose-100 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/30"
                >
                  <Trash2 size={16} /> {t("analysis.delete")}
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
      title={t("analysis.title")}
      subtitle={hasRequiredFilters ? t("analysis.subtitle") : "Escolha empresa e periodo para consultar insights."}
      actions={
        <>
          <button
            onClick={() => {
              void handleInsightsExport("pdf");
            }}
            className="secondary-btn"
            disabled={activeExport !== null || !hasRequiredFilters || items.length === 0}
          >
            <FileText size={16} /> {activeExport === "pdf" ? t("common.processing") : "Exportar PDF"}
          </button>
          <button
            onClick={() => {
              void handleInsightsExport("csv");
            }}
            className="secondary-btn"
            disabled={activeExport !== null || !hasRequiredFilters || items.length === 0}
          >
            <Download size={16} /> {activeExport === "csv" ? t("common.processing") : "Exportar CSV"}
          </button>
          <button onClick={() => void loadInsights()} className="secondary-btn" disabled={!hasRequiredFilters}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </button>
          <button onClick={handleGenerate} disabled={processing || !hasRequiredFilters} className="primary-btn">
            <Brain size={16} /> {processing ? t("analysis.generating") : t("analysis.generate")}
          </button>
        </>
      }
    >
      <div className="mb-5 grid gap-3 rounded-xl border border-border/70 bg-card/80 p-3 text-sm md:grid-cols-3">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Empresa:</span>
          <Select value={selectedCompanySlug || undefined} onValueChange={setSelectedCompanySlug}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={companies.length > 0 ? "Selecione uma empresa" : "Nenhuma empresa cadastrada"} />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.slug} value={company.slug}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">De:</span>
          <input
            type="date"
            className="field-input h-9 py-1"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Ate:</span>
          <input
            type="date"
            className="field-input h-9 py-1"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            id="show-archived"
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
            className="h-4 w-4"
          />
          <span>{t("analysis.showArchived")}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Prioridade:</span>
          <select
            className="field-input h-9 py-1"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as PriorityUrgencyFilter)}
          >
            <option value="any">Qualquer</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Urgencia:</span>
          <select
            className="field-input h-9 py-1"
            value={urgencyFilter}
            onChange={(event) =>
              setUrgencyFilter(event.target.value as PriorityUrgencyFilter)
            }
          >
            <option value="any">Qualquer</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baixa</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Resolução:</span>
          <select
            className="field-input h-9 py-1"
            value={resolutionFilter}
            onChange={(event) =>
              setResolutionFilter(event.target.value as ResolutionFilter)
            }
          >
            <option value="any">Qualquer</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em andamento</option>
            <option value="resolved">Resolvido</option>
          </select>
        </label>
      </div>

      {expectedStateMessage ? (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
          {expectedStateMessage}
        </div>
      ) : null}

      {content}
    </AppShell>
  );
}

function formatDate(raw: string | undefined, locale: string, t: ReturnType<typeof useAppSettings>["t"]) {
  if (!raw) return t("analysis.dateUnavailable");
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return t("analysis.dateInvalid");
  return date.toLocaleString(locale);
}

function priorityLabel(priority: string | undefined) {
  const normalized = String(priority || "medium").toLowerCase();
  if (normalized === "high") return "Alta";
  if (normalized === "low" || normalized === "ok") return "Baixa/OK";
  return "Média";
}

function urgencyLabel(urgency: string | undefined) {
  const normalized = String(urgency || "medium").toLowerCase();
  if (normalized === "high") return "Alta";
  if (normalized === "low") return "Baixa";
  return "Média";
}

function statusLabel(status: string | undefined) {
  const normalized = String(status || "open").toLowerCase();
  if (normalized === "resolved") return "Resolvido";
  if (normalized === "in_progress") return "Em andamento";
  return "Aberto";
}

function resolutionLabel(resolution: string | undefined) {
  const normalized = String(resolution || "pending").toLowerCase();
  if (normalized === "resolved") return "Resolvido";
  if (normalized === "in_progress") return "Em andamento";
  return "Pendente";
}

function priorityBadgeClass(priority: string | undefined) {
  const normalized = String(priority || "medium").toLowerCase();
  if (normalized === "high") {
    return "badge-chip border border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200";
  }
  if (normalized === "low" || normalized === "ok") {
    return "badge-chip border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
  }
  return "badge-chip border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
}
