import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { MetricsClassificationResponse, sentimentApi } from "@/lib/api";
import { ASPECT_LABELS } from "@/lib/aspectLabels";
import { getSourceLabel } from "@/lib/sourceColors";
import { AlertTriangle, BarChart3, Gauge, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const PERIOD_OPTIONS = [
  { value: 7, key: "search.last7" as const },
  { value: 30, key: "search.last30" as const },
  { value: 90, key: "search.last90" as const },
];

const SENTIMENT_COLORS = {
  positivo: "#16a34a",
  negativo: "#ef4444",
  neutro: "#6b7280",
};

const CRITICALITY_COLORS = {
  baixa: "#6b7280",
  media: "#eab308",
  alta: "#f97316",
  critica: "#ef4444",
};

function safePercent(value: number): number {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return 0;
  if (normalized <= 1) {
    return Math.max(0, Math.min(100, Math.round(normalized * 100)));
  }
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function urgencyToneClass(percent: number): string {
  if (percent >= 70) return "text-rose-600";
  if (percent >= 40) return "text-amber-600";
  return "text-emerald-600";
}

export default function MetricsPage() {
  const { t } = useAppSettings();
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<MetricsClassificationResponse | null>(null);

  const loadMetrics = async (period: number) => {
    setLoading(true);
    setError("");

    try {
      const response = await sentimentApi.metricsClassification(period);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar métricas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics(periodDays);
  }, [periodDays]);

  const sentimentData = useMemo(() => {
    const bySentiment = data?.by_sentiment ?? {};
    const positive = (bySentiment.positivo ?? 0) + (bySentiment.positive ?? 0);
    const negative = (bySentiment.negativo ?? 0) + (bySentiment.negative ?? 0);
    const neutral = (bySentiment.neutro ?? 0) + (bySentiment.neutral ?? 0);

    return [
      { name: "positivo", value: positive },
      { name: "negativo", value: negative },
      { name: "neutro", value: neutral },
    ].filter((item) => item.value > 0);
  }, [data?.by_sentiment]);

  const criticalityData = useMemo(() => {
    const byCriticality = data?.by_criticality ?? {};
    return [
      {
        name: t("urgency.low"),
        value: (byCriticality.baixa ?? 0) + (byCriticality.low ?? 0),
        color: CRITICALITY_COLORS.baixa,
      },
      {
        name: t("urgency.medium"),
        value: (byCriticality.média ?? 0) + (byCriticality.media ?? 0) + (byCriticality.medium ?? 0),
        color: CRITICALITY_COLORS.media,
      },
      {
        name: t("urgency.high"),
        value: (byCriticality.alta ?? 0) + (byCriticality.high ?? 0),
        color: CRITICALITY_COLORS.alta,
      },
      {
        name: t("urgency.critical"),
        value: (byCriticality.crítica ?? 0) + (byCriticality.critica ?? 0) + (byCriticality.critical ?? 0),
        color: CRITICALITY_COLORS.critica,
      },
    ];
  }, [data?.by_criticality, t]);

  const urgencyFactors = (data?.top_urgency_factors ?? []).slice(0, 10);
  const topNegativeAspects = (data?.top_aspects_negative ?? []).slice(0, 10);
  const sourcesCoverage = useMemo(
    () => [...(data?.sources_coverage ?? [])].sort((a, b) => b.count - a.count),
    [data?.sources_coverage]
  );

  const maxUrgencyFactor = urgencyFactors.reduce((acc, item) => Math.max(acc, item.count), 1);
  const avgUrgencyPercent = safePercent(data?.avg_urgency_score ?? 0);
  const avgConfidencePercent = safePercent(data?.avg_confidence ?? 0);

  return (
    <AppShell
      title={t("metrics.title")}
      subtitle="Painel quantitativo com indicadores objetivos da classificação de menções."
      actions={
        <button type="button" className="secondary-btn" onClick={() => void loadMetrics(periodDays)}>
          <RefreshCw size={16} /> {t("common.refresh")}
        </button>
      }
    >
      <section className="mb-5 app-panel p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="metrics-period" className="text-sm font-medium text-muted-foreground">
            {t("metrics.period")}
          </label>
          <select
            id="metrics-period"
            value={periodDays}
            onChange={(event) => setPeriodDays(Number(event.target.value))}
            className="field-input h-10 py-2 max-w-[220px]"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground uppercase">{t("metrics.totalAnalyzed")}</p>
            <BarChart3 className="h-5 w-5 text-[color:var(--brand)]" />
          </div>
          <p className="text-2xl font-semibold">{loading ? "-" : data?.total_analyzed ?? 0}</p>
        </div>

        <div className="stat-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground uppercase">{t("metrics.avgUrgency")}</p>
            <Gauge className="h-5 w-5 text-[color:var(--brand)]" />
          </div>
          <p className={`text-2xl font-semibold ${urgencyToneClass(avgUrgencyPercent)}`}>
            {loading ? "-" : `${avgUrgencyPercent}%`}
          </p>
        </div>

        <div className="stat-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground uppercase">{t("metrics.avgConfidence")}</p>
            <ShieldCheck className="h-5 w-5 text-[color:var(--brand)]" />
          </div>
          <p className="text-2xl font-semibold">{loading ? "-" : `${avgConfidencePercent}%`}</p>
        </div>

        <div className="stat-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground uppercase">{t("metrics.criticalCount")}</p>
            <AlertTriangle className="h-5 w-5 text-[color:var(--brand)]" />
          </div>
          <p className="text-2xl font-semibold text-rose-600">{loading ? "-" : data?.critical_mentions ?? 0}</p>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="app-panel p-5 md:p-6">
          <h2 className="panel-title">{t("metrics.bySentiment")}</h2>
          {sentimentData.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem dados de sentimento para exibir.</p>
          ) : (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={95} label>
                    {sentimentData.map((entry) => (
                      <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutro} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="app-panel p-5 md:p-6">
          <h2 className="panel-title">{t("metrics.byCriticality")}</h2>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={criticalityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {criticalityData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="app-panel p-5 md:p-6">
          <h2 className="panel-title">{t("metrics.topFactors")}</h2>
          <div className="mt-4 space-y-2">
            {urgencyFactors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem fatores de urgência para exibir.</p>
            ) : (
              urgencyFactors.map((factor) => {
                const width = Math.max(8, Math.round((factor.count / maxUrgencyFactor) * 100));
                return (
                  <div key={factor.factor}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{factor.factor}</span>
                      <span className="text-muted-foreground">{factor.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-rose-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="app-panel p-5 md:p-6">
          <h2 className="panel-title">{t("metrics.topNegativeAspects")}</h2>
          <div className="mt-4 space-y-2">
            {topNegativeAspects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem aspectos negativos para exibir.</p>
            ) : (
              topNegativeAspects.map((aspect) => (
                <div key={aspect.aspect} className="flex items-center justify-between rounded-lg border border-border/70 bg-background p-2 text-sm">
                  <span>{ASPECT_LABELS[aspect.aspect] ?? aspect.aspect}</span>
                  <span className="font-semibold text-rose-600">{aspect.count}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="app-panel p-5 md:p-6">
        <h2 className="panel-title">{t("metrics.sourcesCoverage")}</h2>
        {sourcesCoverage.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Sem cobertura por fonte para exibir.</p>
        ) : (
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourcesCoverage} layout="vertical" margin={{ left: 12, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="source" tickFormatter={(value: string) => getSourceLabel(value)} width={140} stroke="var(--muted-foreground)" />
                <Tooltip labelFormatter={(value) => getSourceLabel(String(value))} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </AppShell>
  );
}
