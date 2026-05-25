import { useEffect, useMemo, useState } from "react";
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
import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  type CompanyItem,
  type MetricsResponse,
  sentimentApi,
} from "@/lib/api";

const SENTIMENT_COLORS: Record<string, string> = {
  positivo: "#16a34a",
  positive: "#16a34a",
  negativo: "#ef4444",
  negative: "#ef4444",
  neutro: "#6b7280",
  neutral: "#6b7280",
};
const ALL_COMPANIES_VALUE = "all";

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePercent(unitValue: number): number {
  if (unitValue <= 1) return Math.max(0, Math.min(100, unitValue * 100));
  return Math.max(0, Math.min(100, unitValue));
}

function formatUrgencyDate(rawDate: string): string {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return rawDate;
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function MetricsPage() {
  const { t } = useAppSettings();

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompanySlug, setSelectedCompanySlug] = useState(ALL_COMPANIES_VALUE);
  const [periodPreset, setPeriodPreset] = useState<"7" | "30" | "90" | "custom">("30");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<MetricsResponse | null>(null);

  async function loadCompanies() {
    try {
      const response = await sentimentApi.listCompanies();
      setCompanies(response || []);
    } catch {
      setCompanies([]);
    }
  }

  async function loadMetrics() {
    setLoading(true);
    setError("");

    try {
      const params: {
        company_slug?: string;
        period_days?: number;
        from?: string;
        to?: string;
      } = {};

      if (selectedCompanySlug !== ALL_COMPANIES_VALUE) {
        params.company_slug = selectedCompanySlug;
      }

      if (periodPreset === "custom") {
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
      } else {
        params.period_days = Number(periodPreset);
      }

      const response = await sentimentApi.metrics(params);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar metricas.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    if (periodPreset !== "custom") {
      const days = Number(periodPreset);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      setFromDate(toDateInput(start));
      setToDate(toDateInput(end));
    }
  }, [periodPreset]);

  useEffect(() => {
    void loadMetrics();
  }, [selectedCompanySlug, periodPreset, fromDate, toDate]);

  const sentimentData = useMemo(
    () =>
      Object.entries(data?.sentiment_distribution ?? {})
        .map(([name, value]) => ({ name, value: toFiniteNumber(value, 0) }))
        .filter((item) => item.value > 0),
    [data?.sentiment_distribution]
  );

  const urgencyEvolutionData = useMemo(
    () => (data?.urgency_evolution ?? []).filter((item) => String(item.date || "").trim().length > 0),
    [data?.urgency_evolution]
  );

  const negativeAspectsData = useMemo(
    () => (data?.top_negative_aspects ?? []).slice(0, 8),
    [data?.top_negative_aspects]
  );

  const positiveAspectsData = useMemo(
    () => (data?.top_positive_aspects ?? []).slice(0, 8),
    [data?.top_positive_aspects]
  );

  const mostCitedAspectsData = useMemo(
    () => (data?.most_cited_aspects ?? []).slice(0, 10),
    [data?.most_cited_aspects]
  );

  const averageUrgencyPercent = useMemo(
    () => normalizePercent(toFiniteNumber(data?.average_urgency, 0)),
    [data?.average_urgency]
  );

  const companyName = useMemo(() => {
    if (data?.company_name) return data.company_name;
    return companies.find((company) => company.slug === selectedCompanySlug)?.name || "Visao geral";
  }, [companies, data?.company_name, selectedCompanySlug]);

  return (
    <AppShell
      title={t("metrics.title")}
      subtitle={`Metricas por empresa e periodo. Empresa atual: ${companyName}.`}
      actions={
        <button type="button" className="secondary-btn" onClick={() => void loadMetrics()}>
          <RefreshCw size={16} /> {t("common.refresh")}
        </button>
      }
    >
      <section className="mb-5 app-panel p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Empresa:</span>
            <select
              className="field-input h-10 py-2"
              value={selectedCompanySlug}
              onChange={(event) => setSelectedCompanySlug(event.target.value)}
            >
              <option value={ALL_COMPANIES_VALUE}>Todas as empresas</option>
              {companies.map((company) => (
                <option key={company.slug} value={company.slug}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Preset:</span>
            <select
              className="field-input h-10 py-2"
              value={periodPreset}
              onChange={(event) =>
                setPeriodPreset(event.target.value as "7" | "30" | "90" | "custom")
              }
            >
              <option value="7">7 dias</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">De:</span>
            <input
              type="date"
              className="field-input h-10 py-2"
              value={fromDate}
              onChange={(event) => {
                setPeriodPreset("custom");
                setFromDate(event.target.value);
              }}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ate:</span>
            <input
              type="date"
              className="field-input h-10 py-2"
              value={toDate}
              onChange={(event) => {
                setPeriodPreset("custom");
                setToDate(event.target.value);
              }}
            />
          </label>

          <div className="rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
            <p>Periodo atual</p>
            <p className="font-medium text-foreground">{data?.period_label || "-"}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="stat-card p-5">
          <p className="text-sm uppercase text-muted-foreground">Volume de mencoes</p>
          <p className="mt-2 text-2xl font-semibold">{loading ? "-" : data?.total_mentions ?? 0}</p>
        </div>

        <div className="stat-card p-5">
          <p className="text-sm uppercase text-muted-foreground">Urgencia media</p>
          <p className="mt-2 text-2xl font-semibold">{loading ? "-" : `${averageUrgencyPercent.toFixed(1)}%`}</p>
        </div>

        <div className="stat-card p-5">
          <p className="text-sm uppercase text-muted-foreground">Empresa</p>
          <p className="mt-2 text-lg font-semibold">{companyName}</p>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="app-panel p-5 md:p-6">
          <h2 className="panel-title">Distribuicao de sentimento</h2>
          {sentimentData.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem dados de sentimento para exibir.</p>
          ) : (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={95} label>
                    {sentimentData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SENTIMENT_COLORS[entry.name.toLowerCase()] || "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="app-panel p-5 md:p-6">
          <h2 className="panel-title">Evolucao de urgencia</h2>
          {urgencyEvolutionData.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem dados de evolucao de urgencia para exibir.</p>
          ) : (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={urgencyEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="date" tickFormatter={formatUrgencyDate} stroke="var(--muted-foreground)" />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    formatter={(value: number | string) => [`${Math.round(Number(value) * 100)}%`, "Urgencia"]}
                  />
                  <Line type="monotone" dataKey="avg_urgency" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="app-panel p-5 md:p-6">
          <h2 className="panel-title">Principais aspectos negativos</h2>
          {negativeAspectsData.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem dados de aspectos negativos.</p>
          ) : (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={negativeAspectsData} layout="vertical" margin={{ left: 16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
                  <YAxis type="category" dataKey="label" width={170} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="mentions" fill="#ef4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="app-panel p-5 md:p-6">
          <h2 className="panel-title">Principais aspectos positivos</h2>
          {positiveAspectsData.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem dados de aspectos positivos.</p>
          ) : (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positiveAspectsData} layout="vertical" margin={{ left: 16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
                  <YAxis type="category" dataKey="label" width={170} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="mentions" fill="#16a34a" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      <section className="app-panel p-5 md:p-6">
        <h2 className="panel-title">Aspectos mais citados</h2>
        {mostCitedAspectsData.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Sem dados de aspectos mais citados.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {mostCitedAspectsData.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-background p-2 text-sm"
              >
                <span>{item.label}</span>
                <span className="font-semibold">{item.mentions}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
