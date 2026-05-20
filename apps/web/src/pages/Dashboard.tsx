import { useEffect, useMemo, useState, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardMetrics, DashboardResponse, Mention, NpsMetrics, sentimentApi } from "@/lib/api";
import { DataManagementModal } from "@/components/DataManagementModal";
import { SourceTierBadge } from "@/components/SourceTierBadge";
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
    label: "Situação Crítica",
    emoji: "🚨",
    className: "bg-red-600 text-white",
  },
  high: {
    label: "Atenção Necessária",
    emoji: "⚠️",
    className: "bg-orange-500 text-white",
  },
  medium: {
    label: "Monitoramento",
    emoji: "🟡",
    className: "bg-yellow-500 text-black",
  },
  low: {
    label: "Situação Estável",
    emoji: "🔵",
    className: "bg-blue-500 text-white",
  },
  ok: {
    label: "Excelente Reputação",
    emoji: "✅",
    className: "bg-green-500 text-white",
  },
};

function mapRecord(record?: Record<string, number>) {
  return Object.entries(record ?? {})
    .map(([name, value]) => {
      const normalized = Number(value);
      return { name, value: Number.isFinite(normalized) ? normalized : 0 };
    })
    .filter((item) => item.value > 0);
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
    return { symbol: "→", label: "Sem tendência" };
  }
  if (normalized.includes("up") || normalized.includes("alta") || normalized.includes("growth") || normalized.includes("cresc")) {
    return { symbol: "↑", label: "Em alta" };
  }
  if (normalized.includes("down") || normalized.includes("queda") || normalized.includes("drop") || normalized.includes("declin")) {
    return { symbol: "↓", label: "Em queda" };
  }
  return { symbol: "→", label: "Estável" };
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

export default function Dashboard() {
  const { settings, t } = useAppSettings();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [sourceData, setSourceData] = useState<SourceChartItem[]>([]);
  const [npsMetrics, setNpsMetrics] = useState<NpsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const dashboardData = await sentimentApi.dashboard();
      setData(dashboardData);
      if (dashboardData.search_id) {
        localStorage.setItem(LAST_SEARCH_ID_KEY, dashboardData.search_id);
      }

      const [mentionsData, npsData] = await Promise.all([
        sentimentApi
          .mentions({
            batch_id: dashboardData.batch_id ?? undefined,
            limit: 1000,
          })
          .catch(() => dashboardData.mentions ?? []),
        sentimentApi.npsMetrics().catch(() => null),
      ]);

      const mentionSourceData = groupMentionsBySource(mentionsData.length ? mentionsData : dashboardData.mentions ?? []);
      const distributionSourceData = groupSourceDistribution(
        dashboardData.metrics?.source_distribution ?? dashboardData.metrics?.sources_distribution
      );

      setSourceData(mentionSourceData.length > 0 ? mentionSourceData : distributionSourceData);
      setNpsMetrics(npsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const metrics = data?.metrics ?? {};
  const mentions = data?.mentions ?? [];

  const sentimentData = useMemo(
    () => mapRecord(metrics.sentiment_distribution),
    [metrics.sentiment_distribution]
  );
  const aspectData = useMemo(
    () => mapRecord(metrics.top_aspects).slice(0, 8),
    [metrics.top_aspects]
  );

  const totalMentions = Math.max(0, Math.round(toFiniteNumber(metrics.total_mentions, mentions.length)));
  const sentimentScore = Math.round(toFiniteNumber(metrics.sentiment_score, metrics.reputation_score ?? 0));
  const reputationScore = Math.round(toFiniteNumber(metrics.reputation_score, sentimentScore));
  const criticalMentions = Math.max(0, Math.round(toFiniteNumber(metrics.critical_mentions, 0)));
  const topThemes = useMemo(
    () => resolveTopThemes(metrics.top_themes),
    [metrics.top_themes]
  );
  const averageUrgency = useMemo(() => {
    if (typeof metrics.urgency_score === "number") {
      return metrics.urgency_score <= 1 ? metrics.urgency_score * 100 : metrics.urgency_score;
    }

    const urgencyScores = mentions
      .map((mention) => mention.urgency_score)
      .filter((value): value is number => typeof value === "number");

    if (urgencyScores.length > 0) {
      return urgencyScores.reduce((acc, current) => acc + current, 0) / urgencyScores.length;
    }

    const fallback = toFiniteNumber(metrics.average_urgency, 0);
    if (!Number.isFinite(fallback)) return 0;
    return fallback <= 1 ? fallback * 100 : fallback;
  }, [mentions, metrics.average_urgency, metrics.urgency_score]);

  const totalComments = Math.max(
    1,
    Math.round(toFiniteNumber(metrics.total_comments, toFiniteNumber(metrics.total_mentions, mentions.length)))
  );
  const negativeCount = resolveNegativeCount(metrics, mentions);
  const negativeRatio = negativeCount / totalComments;
  const statusBanner = resolveStatusBanner(sentimentScore, negativeRatio);
  const trend = resolveTrend(data?.latest_insight?.trend ?? metrics.trend);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(settings.locale), [settings.locale]);

  if (loading) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-10 w-10 animate-spin text-[color:var(--brand)]" />
          <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title={t("nav.dashboard")}
      subtitle={
        data?.batch_id
          ? t("dashboard.subtitleBatch", { batchId: data.batch_id })
          : t("dashboard.subtitleEmpty")
      }
      actions={
        <>
          <button onClick={() => setIsDataModalOpen(true)} className="secondary-btn text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-900/30">
            Gerenciar Dados
          </button>
          <button onClick={() => setLocation("/search")} className="secondary-btn">
            {t("dashboard.newSearch")}
          </button>
          <button onClick={loadDashboard} className="primary-btn">
            <RefreshCw size={16} />
            <span>{t("common.refresh")}</span>
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {totalMentions === 0 ? (
        <div className="app-panel mx-auto max-w-3xl p-10 text-center">
          <SearchIcon className="mx-auto mb-4 h-10 w-10 text-[color:var(--brand)]" />
          <h2 className="text-2xl font-semibold">{t("dashboard.emptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            {t("dashboard.emptyText")}
          </p>
          <button onClick={() => setLocation("/search")} className="primary-btn mx-auto mt-6">
            {t("dashboard.emptyAction")}
          </button>
        </div>
      ) : (
        <>
          <section className={`sticky top-20 z-30 mb-6 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg ${statusBanner.className}`}>
            <p className="flex items-center gap-2">
              <span aria-hidden="true">{statusBanner.emoji}</span>
              <span>{statusBanner.label}</span>
            </p>
            <p className="mt-1 text-xs opacity-90">
              Score: {sentimentScore}/100 • Menções negativas: {negativeCount} ({(negativeRatio * 100).toFixed(1)}%)
            </p>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <MetricCard icon={BarChart3} label={t("dashboard.metricMentions")} value={numberFormatter.format(totalMentions)} />
            <MetricCard icon={TrendingUp} label={t("dashboard.metricReputation")} value={`${numberFormatter.format(reputationScore)}/100`} />
            <MetricCard icon={AlertTriangle} label={t("dashboard.metricCritical")} value={numberFormatter.format(criticalMentions)} />
            <MetricCard icon={Brain} label={t("dashboard.metricUrgency")} value={`${averageUrgency.toFixed(1)}%`} />
            <MetricCard icon={Brain} label="NPS" value={typeof npsMetrics?.nps_score === "number" ? npsMetrics.nps_score : "-"} />
            <MetricCard icon={ChartNoAxesCombined} label="Tendência" value={`${trend.symbol} ${trend.label}`} />
            <MetricCard icon={FileText} label="Top temas" value={topThemes.length > 0 ? topThemes.join(" • ") : "Sem dados"} />
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

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <article className="app-panel p-5 md:p-6 xl:col-span-2">
              <h2 className="panel-title">{t("dashboard.aspects")}</h2>
              {aspectData.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dashboard.noAspects")}</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aspectData} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
                      <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" width={110} />
                      <Tooltip />
                      <Bar dataKey="value" fill="var(--accent-strong)" radius={[0, 8, 8, 0]} />
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
                  <div key={mention.id} className="rounded-xl border border-border/70 bg-background/75 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: getSourceColor(mention.source) }}
                        >
                          {getSourceLabel(mention.source)}
                        </span>
                        <SourceTierBadge tier={mention?.source_tier} />
                      </div>
                      <span className="text-muted-foreground">{mention.sentiment}</span>
                    </div>
                    <p className="line-clamp-3 text-sm">{mention.text}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataDeleted={loadDashboard}
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
