import { useEffect, useMemo, useState, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  BarChart3,
  Brain,
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
import { DashboardResponse, sentimentApi } from "@/lib/api";
import { DataManagementModal } from "@/components/DataManagementModal";

const COLORS = ["#0f766e", "#ea580c", "#0ea5e9", "#16a34a", "#db2777", "#7c3aed"];

function mapRecord(record?: Record<string, number>) {
  return Object.entries(record ?? {}).map(([name, value]) => ({ name, value }));
}

export default function Dashboard() {
  const { settings, t } = useAppSettings();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      setData(await sentimentApi.dashboard());
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
  const sourceDistribution = metrics.source_distribution ?? (metrics as { sources_distribution?: Record<string, number> }).sources_distribution;
  const sourceData = useMemo(
    () => mapRecord(sourceDistribution),
    [sourceDistribution]
  );
  const aspectData = useMemo(
    () => mapRecord(metrics.top_aspects).slice(0, 8),
    [metrics.top_aspects]
  );

  const totalMentions = metrics.total_mentions ?? mentions.length;
  const reputationScore = Math.round(metrics.reputation_score ?? 0);
  const criticalMentions = metrics.critical_mentions ?? 0;
  const averageUrgency = Math.round((metrics.average_urgency ?? 0) * 100);
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
          <button onClick={() => setIsDataModalOpen(true)} className="secondary-btn text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-900/30">Gerenciar Dados</button>
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
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={BarChart3} label={t("dashboard.metricMentions")} value={numberFormatter.format(totalMentions)} />
            <MetricCard icon={TrendingUp} label={t("dashboard.metricReputation")} value={`${numberFormatter.format(reputationScore)}/100`} />
            <MetricCard icon={AlertTriangle} label={t("dashboard.metricCritical")} value={numberFormatter.format(criticalMentions)} />
            <MetricCard icon={Brain} label={t("dashboard.metricUrgency")} value={`${numberFormatter.format(averageUrgency)}%`} />
          </section>

          <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article className="app-panel p-5 md:p-6">
              <h2 className="panel-title">{t("dashboard.sentiments")}</h2>
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
            </article>

            <article className="app-panel p-5 md:p-6">
              <h2 className="panel-title">{t("dashboard.sources")}</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                    <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--brand)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
                      <span className="badge-chip">{mention.source}</span>
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
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="stat-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm uppercase text-muted-foreground">{label}</span>
        <Icon size={22} className="text-[color:var(--brand)]" />
      </div>
      <div className="text-3xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
