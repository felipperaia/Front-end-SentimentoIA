import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  ChartNoAxesCombined,
  FileText,
  RefreshCw,
  SearchIcon,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { DataManagementModal } from "@/components/DataManagementModal";
import { MentionCard } from "@/components/MentionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  type AspectMentionsPoint,
  type CompanyItem,
  type DashboardMetrics,
  type DashboardResponse,
  type Mention,
  type UrgencyEvolutionPoint,
  sentimentApi,
} from "@/lib/api";
import { getSourceColor, getSourceLabel } from "@/lib/sourceColors";

const COLORS = ["#0f766e", "#ea580c", "#0ea5e9", "#16a34a", "#db2777", "#7c3aed"];
const LAST_SEARCH_ID_KEY = "sentimentoia_last_search_id";

type SourceChartItem = {
  source: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
};

type StatusBannerState = {
  level: "critical" | "high" | "medium" | "low" | "ok";
  label: string;
  emoji: string;
  className: string;
};

const STATUS_BANNER_STATES: Record<StatusBannerState["level"], Omit<StatusBannerState, "level">> = {
  critical: {
    label: "Situacao Critica",
    emoji: "CRIT",
    className: "bg-red-600 text-white",
  },
  high: {
    label: "Atencao Necessaria",
    emoji: "ATN",
    className: "bg-orange-500 text-white",
  },
  medium: {
    label: "Monitoramento",
    emoji: "MED",
    className: "bg-yellow-500 text-black",
  },
  low: {
    label: "Situacao Estavel",
    emoji: "LOW",
    className: "bg-blue-500 text-white",
  },
  ok: {
    label: "Excelente Reputacao",
    emoji: "OK",
    className: "bg-green-500 text-white",
  },
};

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRecord(record?: Record<string, number>) {
  return Object.entries(record ?? {})
    .map(([name, value]) => ({ name, value: toFiniteNumber(value, 0) }))
    .filter((item) => item.value > 0);
}

function mapAspectPoints(points?: AspectMentionsPoint[]) {
  return (points ?? [])
    .map((item) => ({
      label: String(item.label || "").trim(),
      mentions: Math.max(0, Math.round(toFiniteNumber(item.mentions, 0))),
    }))
    .filter((item) => item.label.length > 0 && item.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);
}

function mapAspectRecord(record?: Record<string, number>) {
  return Object.entries(record ?? {})
    .map(([label, mentions]) => ({
      label,
      mentions: Math.max(0, Math.round(toFiniteNumber(mentions, 0))),
    }))
    .filter((item) => item.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);
}

function normalizeSource(source: string): string {
  return String(source || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function groupMentionsBySource(mentions: Mention[]): SourceChartItem[] {
  const grouped = mentions.reduce<Record<string, number>>((acc, mention) => {
    const key = normalizeSource(mention.source) || "web";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const total = Math.max(1, mentions.length);
  return Object.entries(grouped)
    .map(([source, value]) => ({
      source,
      label: getSourceLabel(source),
      value,
      percentage: (value / total) * 100,
      color: getSourceColor(source),
    }))
    .sort((a, b) => b.value - a.value);
}

function groupSourceDistribution(distribution?: Record<string, number>): SourceChartItem[] {
  const entries = Object.entries(distribution ?? {}).filter(([, value]) => toFiniteNumber(value, 0) > 0);
  const total = Math.max(1, entries.reduce((acc, [, value]) => acc + toFiniteNumber(value, 0), 0));

  return entries
    .map(([source, value]) => {
      const normalized = normalizeSource(source) || "web";
      const normalizedValue = toFiniteNumber(value, 0);
      return {
        source: normalized,
        label: getSourceLabel(normalized),
        value: normalizedValue,
        percentage: (normalizedValue / total) * 100,
        color: getSourceColor(normalized),
      };
    })
    .sort((a, b) => b.value - a.value);
}

function resolveNegativeCount(metrics: Partial<DashboardMetrics>, mentions: Mention[]): number {
  if (typeof metrics.negative_count === "number") {
    return metrics.negative_count;
  }

  const distribution = metrics.sentiment_distribution ?? {};
  const fromDistribution =
    Number(distribution.negative ?? 0) +
    Number(distribution.negativo ?? 0) +
    Number(distribution.negatives ?? 0);

  if (fromDistribution > 0) {
    return fromDistribution;
  }

  return mentions.filter((mention) => {
    const sentiment = String(mention.sentiment || "").toLowerCase();
    return sentiment.includes("neg");
  }).length;
}

function resolveStatusBanner(score: number, negativeRatio: number): StatusBannerState {
  if (score < 30 && negativeRatio > 0.6) {
    return { level: "critical", ...STATUS_BANNER_STATES.critical };
  }
  if (score < 45 && negativeRatio > 0.45) {
    return { level: "high", ...STATUS_BANNER_STATES.high };
  }
  if (score < 60 && negativeRatio > 0.3) {
    return { level: "medium", ...STATUS_BANNER_STATES.medium };
  }
  if (score < 75) {
    return { level: "low", ...STATUS_BANNER_STATES.low };
  }
  return { level: "ok", ...STATUS_BANNER_STATES.ok };
}

function resolveTrend(trend?: string) {
  const normalized = String(trend || "").toLowerCase();
  if (!normalized) {
    return { symbol: "->", label: "Sem tendencia" };
  }
  if (
    normalized.includes("up") ||
    normalized.includes("alta") ||
    normalized.includes("growth") ||
    normalized.includes("cresc")
  ) {
    return { symbol: "+", label: "Em alta" };
  }
  if (
    normalized.includes("down") ||
    normalized.includes("queda") ||
    normalized.includes("drop") ||
    normalized.includes("declin")
  ) {
    return { symbol: "-", label: "Em queda" };
  }
  return { symbol: "=", label: "Estavel" };
}

function formatUrgencyDate(rawDate: string): string {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return rawDate;
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

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

function resolvePeriodLabel(data: DashboardResponse | null): string {
  if (!data) return "Periodo nao informado";
  const explicit = String(data.period_label || data.metrics?.period_label || "").trim();
  if (explicit) return explicit;

  const from = String(data.period_from || data.metrics?.period_from || "").trim();
  const to = String(data.period_to || data.metrics?.period_to || "").trim();
  if (from && to) return `${from} - ${to}`;
  return from || to || "Periodo nao informado";
}

function resolveCurrentCompanyName(data: DashboardResponse | null, selectedCompany?: CompanyItem | null): string {
  if (selectedCompany?.name) return selectedCompany.name;

  const directName = String(
    data?.current_company_name || data?.metrics?.current_company_name || ""
  ).trim();
  if (directName) return directName;

  const fromMentions = data?.mentions.find((mention) => String(mention.brand_name || "").trim());
  if (fromMentions?.brand_name) return fromMentions.brand_name;

  const fromQuery = String(data?.query || "").trim();
  if (fromQuery) return fromQuery;

  return "Visao geral";
}

function resolveTopThemes(rawThemes: DashboardMetrics["top_themes"] | undefined): string[] {
  if (!rawThemes) return [];

  if (Array.isArray(rawThemes)) {
    return rawThemes.filter(Boolean).slice(0, 3);
  }

  return Object.entries(rawThemes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);
}

function resolveAverageUrgency(metrics: Partial<DashboardMetrics>, mentions: Mention[]): number {
  if (typeof metrics.urgency_score === "number") {
    return metrics.urgency_score <= 1 ? metrics.urgency_score * 100 : metrics.urgency_score;
  }

  const urgencyScores = mentions
    .map((mention) => mention.urgency_score)
    .filter((value): value is number => typeof value === "number");

  if (urgencyScores.length > 0) {
    const average = urgencyScores.reduce((acc, current) => acc + current, 0) / urgencyScores.length;
    return average <= 1 ? average * 100 : average;
  }

  const fallback = toFiniteNumber(metrics.average_urgency, 0);
  return fallback <= 1 ? fallback * 100 : fallback;
}

function SourceDistributionTooltip({
  active,
  payload,
}: Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload: SourceChartItem }>;
}>) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="font-semibold">{item.label}</p>
      <p>Quantidade: {item.value}</p>
      <p>Percentual: {item.percentage.toFixed(1)}%</p>
    </div>
  );
}

export default function Dashboard() { // NOSONAR
  const { settings, t } = useAppSettings();
  const [, setLocation] = useLocation();
  const [defaultRange] = useState(() => resolveDefaultDateRange(30));

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [sourceData, setSourceData] = useState<SourceChartItem[]>([]);
  const [selectedCompanySlug, setSelectedCompanySlug] = useState("");
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const { data: companiesData } = useQuery({
    queryKey: ["companies"],
    queryFn: sentimentApi.listCompanies,
    staleTime: 5 * 60 * 1000,
  });
  const companies = companiesData ?? [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const hasRequiredFilters = Boolean(selectedCompanySlug && fromDate && toDate);

  async function loadDashboard() {
    if (!hasRequiredFilters) {
      setData(null);
      setSourceData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dashboardData = await sentimentApi.dashboard({
        company_slug: selectedCompanySlug,
        from: fromDate,
        to: toDate,
      });
      setData(dashboardData);

      if (dashboardData.search_id) {
        localStorage.setItem(LAST_SEARCH_ID_KEY, dashboardData.search_id);
      }

      const mentionSourceData = groupMentionsBySource(dashboardData.mentions ?? []);
      const distributionSourceData = groupSourceDistribution(
        dashboardData.metrics?.source_distribution ?? dashboardData.metrics?.sources_distribution
      );

      setSourceData(mentionSourceData.length > 0 ? mentionSourceData : distributionSourceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.error"));
      setData(null);
      setSourceData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasRequiredFilters) {
      setData(null);
      setSourceData([]);
      setLoading(false);
      return;
    }

    void loadDashboard();
  }, [hasRequiredFilters, selectedCompanySlug, fromDate, toDate]);

  const metrics = data?.metrics ?? {};
  const mentions = data?.mentions ?? [];

  const selectedCompanyData = useMemo(
    () => companies.find((company) => company.slug === selectedCompanySlug) ?? null,
    [companies, selectedCompanySlug]
  );

  const dashboardCompanyName = useMemo(
    () => resolveCurrentCompanyName(data, selectedCompanyData),
    [data, selectedCompanyData]
  );
  const dashboardPeriodLabel = useMemo(() => resolvePeriodLabel(data), [data]);

  const sentimentData = useMemo(
    () => mapRecord(metrics.sentiment_distribution),
    [metrics.sentiment_distribution]
  );

  const mostCitedAspectData = useMemo(() => {
    const listData = mapAspectPoints(metrics.most_cited_aspects);
    if (listData.length > 0) return listData;
    return mapAspectRecord(metrics.top_aspects);
  }, [metrics.most_cited_aspects, metrics.top_aspects]);

  const topNegativeAspectData = useMemo(() => {
    const listData = mapAspectPoints(metrics.top_negative_aspects_list);
    if (listData.length > 0) return listData;
    return mapAspectRecord(metrics.top_negative_aspects);
  }, [metrics.top_negative_aspects_list, metrics.top_negative_aspects]);

  const urgencyTrend = useMemo<UrgencyEvolutionPoint[]>(
    () => (metrics.urgency_evolution ?? []).filter((point) => String(point.date || "").trim().length > 0),
    [metrics.urgency_evolution]
  );

  const totalMentions = Math.max(0, Math.round(toFiniteNumber(metrics.total_mentions, mentions.length)));
  const sentimentScore = Math.round(toFiniteNumber(metrics.sentiment_score, metrics.reputation_score ?? 0));
  const reputationScore = Math.round(toFiniteNumber(metrics.reputation_score, sentimentScore));
  const criticalMentions = Math.max(0, Math.round(toFiniteNumber(metrics.critical_mentions, 0)));
  const topThemes = useMemo(() => resolveTopThemes(metrics.top_themes), [metrics.top_themes]);

  const averageUrgency = useMemo(() => resolveAverageUrgency(metrics, mentions), [metrics, mentions]);

  const totalComments = Math.max(
    1,
    Math.round(toFiniteNumber(metrics.total_comments, toFiniteNumber(metrics.total_mentions, mentions.length)))
  );
  const negativeCount = resolveNegativeCount(metrics, mentions);
  const negativeRatio = negativeCount / totalComments;
  const statusBanner = resolveStatusBanner(sentimentScore, negativeRatio);
  const trend = resolveTrend(data?.latest_insight?.trend ?? metrics.trend);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(settings.locale), [settings.locale]);

  return (
    <AppShell
      title={t("nav.dashboard")}
      subtitle={
        hasRequiredFilters && data
          ? `Empresa atual: ${dashboardCompanyName} - ${dashboardPeriodLabel}`
          : "Selecione uma empresa e um periodo para carregar o dashboard."
      }
      actions={
        <>
          <button
            onClick={() => setIsDataModalOpen(true)}
            className="secondary-btn text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-900/30"
          >
            Gerenciar Dados
          </button>
          <button onClick={() => setLocation("/search")} className="secondary-btn">
            {t("dashboard.newSearch")}
          </button>
          <button onClick={() => void loadDashboard()} className="primary-btn" disabled={!hasRequiredFilters || loading}>
            <RefreshCw size={16} />
            <span>{t("common.refresh")}</span>
          </button>
        </>
      }
    >
      <section className="mb-5 app-panel p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Empresa:</span>
            <Select value={selectedCompanySlug || undefined} onValueChange={setSelectedCompanySlug}>
              <SelectTrigger className="w-[220px]" aria-label="Selecionar empresa">
                <SelectValue
                  placeholder={
                    companies.length > 0 ? "Selecione uma empresa" : "Nenhuma empresa cadastrada"
                  }
                />
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
            <span className="text-sm text-muted-foreground">De:</span>
            <input
              type="date"
              className="field-input h-10 py-2"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ate:</span>
            <input
              type="date"
              className="field-input h-10 py-2"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>

          <div className="rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
            <p>Periodo aplicado</p>
            <p className="font-medium text-foreground">
              {fromDate && toDate ? `${fromDate} a ${toDate}` : "Defina as datas"}
            </p>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => void loadDashboard()}
              disabled={!hasRequiredFilters || loading}
            >
              <RefreshCw size={16} /> Aplicar filtros
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {!selectedCompanySlug ? (
        <div className="app-panel mx-auto max-w-3xl p-10 text-center">
          <SearchIcon className="mx-auto mb-4 h-10 w-10 text-[color:var(--brand)]" />
          <h2 className="text-2xl font-semibold">Selecione uma empresa para iniciar</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            O dashboard so carrega dados apos a escolha explicita da empresa e do periodo.
          </p>
        </div>
      ) : loading ? (
        <div className="app-panel mx-auto max-w-3xl p-10 text-center">
          <RefreshCw className="mx-auto h-10 w-10 animate-spin text-[color:var(--brand)]" />
          <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.loading")}</p>
        </div>
      ) : totalMentions === 0 ? (
        <div className="app-panel mx-auto max-w-3xl p-10 text-center">
          <SearchIcon className="mx-auto mb-4 h-10 w-10 text-[color:var(--brand)]" />
          <h2 className="text-2xl font-semibold">{t("dashboard.emptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{t("dashboard.emptyText")}</p>
          <button onClick={() => setLocation("/search")} className="primary-btn mx-auto mt-6">
            {t("dashboard.emptyAction")}
          </button>
        </div>
      ) : (
        <>
          <section
            className={`sticky top-20 z-30 mb-6 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg ${statusBanner.className}`}
          >
            <p className="flex items-center gap-2">
              <span aria-hidden="true">{statusBanner.emoji}</span>
              <span>{statusBanner.label}</span>
            </p>
            <p className="mt-1 text-xs opacity-90">
              Score: {sentimentScore}/100 - Mencoes negativas: {negativeCount} ({(negativeRatio * 100).toFixed(1)}%)
            </p>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <MetricCard
              icon={BarChart3}
              label={t("dashboard.metricMentions")}
              value={numberFormatter.format(totalMentions)}
            />
            <MetricCard
              icon={TrendingUp}
              label={t("dashboard.metricReputation")}
              value={`${numberFormatter.format(reputationScore)}/100`}
            />
            <MetricCard
              icon={AlertTriangle}
              label={t("dashboard.metricCritical")}
              value={numberFormatter.format(criticalMentions)}
            />
            <MetricCard
              icon={Brain}
              label={t("dashboard.metricUrgency")}
              value={`${averageUrgency.toFixed(1)}%`}
            />
            <MetricCard icon={ChartNoAxesCombined} label="Tendencia" value={`${trend.symbol} ${trend.label}`} />
            <MetricCard
              icon={FileText}
              label="Top temas"
              value={topThemes.length > 0 ? topThemes.join(" - ") : "Sem dados"}
            />
          </section>

          <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article className="app-panel p-5 md:p-6">
              <h2 className="panel-title">{t("dashboard.sentiments")}</h2>
              {sentimentData.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Sem dados de sentimento para exibir.</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={102} label>
                        {sentimentData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="app-panel p-5 md:p-6">
              <h2 className="panel-title">{t("dashboard.sources")}</h2>
              {sourceData.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Sem dados de fontes para exibir.</p>
              ) : (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sourceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="label" stroke="var(--muted-foreground)" />
                        <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                        <Tooltip content={<SourceDistributionTooltip />} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {sourceData.map((entry) => (
                            <Cell key={entry.source} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {sourceData.map((entry) => (
                      <span key={`legend-${entry.source}`} className="badge-chip gap-2">
                        <span
                          className="inline-flex h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                          aria-hidden="true"
                        />
                        {entry.label}: {numberFormatter.format(entry.value)} ({entry.percentage.toFixed(1)}%)
                      </span>
                    ))}
                  </div>
                </>
              )}
            </article>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article className="app-panel p-5 md:p-6">
              <h2 className="panel-title">Evolucao da Urgencia</h2>
              {urgencyTrend.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Sem dados de evolucao de urgencia para exibir.</p>
              ) : (
                <div className="h-[260px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={urgencyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatUrgencyDate} />
                      <YAxis domain={[0, 1]} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} />
                      <Tooltip
                        formatter={(value: number | string) => [`${Math.round(Number(value) * 100)}%`, "Urgencia media"]}
                      />
                      <Line type="monotone" dataKey="avg_urgency" stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="app-panel p-5 md:p-6">
              <h2 className="panel-title">Principais aspectos negativos</h2>
              {topNegativeAspectData.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Sem dados de aspectos negativos para exibir.</p>
              ) : (
                <div className="h-[260px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topNegativeAspectData} layout="vertical" margin={{ left: 12, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
                      <YAxis type="category" dataKey="label" width={160} stroke="var(--muted-foreground)" />
                      <Tooltip />
                      <Bar dataKey="mentions" fill="#ef4444" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <article className="app-panel p-5 md:p-6 xl:col-span-2">
              <h2 className="panel-title">Aspectos mais citados</h2>
              {mostCitedAspectData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados de aspectos mais citados.</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mostCitedAspectData} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
                      <YAxis type="category" dataKey="label" stroke="var(--muted-foreground)" width={160} />
                      <Tooltip />
                      <Bar dataKey="mentions" fill="var(--accent-strong)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="app-panel p-5 md:p-6">
              <h2 className="panel-title flex items-center gap-2">
                <FileText size={18} /> {t("dashboard.recentMentions")}
              </h2>
              <div className="space-y-3 pr-1">
                {mentions.slice(0, 6).map((mention) => (
                  <MentionCard key={mention.id} mention={mention} />
                ))}
              </div>
            </article>
          </section>
        </>
      )}

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataDeleted={() => {
          void loadDashboard();
        }}
      />
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: Readonly<{
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
}>) {
  return (
    <div className="stat-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm uppercase text-muted-foreground">{label}</span>
        <Icon size={22} className="text-[color:var(--brand)]" />
      </div>
      <div className="text-lg font-semibold text-foreground sm:text-xl">{value}</div>
    </div>
  );
}
