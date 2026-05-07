import { useEffect, useMemo, useState, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";
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

const COLORS = ["#0f766e", "#ea580c", "#0ea5e9", "#16a34a", "#db2777", "#7c3aed"];

function mapRecord(record?: Record<string, number>) {
  return Object.entries(record ?? {}).map(([name, value]) => ({ name, value }));
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      setData(await sentimentApi.dashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
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

  if (loading) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-10 w-10 animate-spin text-[color:var(--brand)]" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle={
        data?.batch_id
          ? `Batch atual: ${data.batch_id}`
          : "Execute uma busca para preencher indicadores e recomendacoes da IA."
      }
      actions={
        <>
          <button onClick={() => setLocation("/search")} className="secondary-btn">
            Nova busca
          </button>
          <button onClick={loadDashboard} className="primary-btn">
            <RefreshCw size={16} />
            <span>Atualizar</span>
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
          <h2 className="text-2xl font-semibold">Nenhum dado no dashboard</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Inicie uma busca para gerar metricas, graficos e insights de reputacao em tempo real.
          </p>
          <button onClick={() => setLocation("/search")} className="primary-btn mx-auto mt-6">
            Iniciar busca
          </button>
        </div>
      ) : (
        <>
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={BarChart3} label="Mencoes" value={totalMentions} />
            <MetricCard icon={TrendingUp} label="Reputacao" value={`${reputationScore}/100`} />
            <MetricCard icon={AlertTriangle} label="Criticas" value={criticalMentions} />
            <MetricCard icon={Brain} label="Urgencia media" value={`${averageUrgency}%`} />
          </section>

          <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article className="app-panel p-5 md:p-6">
              <h2 className="panel-title">Sentimentos</h2>
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
              <h2 className="panel-title">Fontes</h2>
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
              <h2 className="panel-title">Aspectos mais citados</h2>
              {aspectData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aspecto detectado.</p>
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
                <FileText size={18} /> Mencoes recentes
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
