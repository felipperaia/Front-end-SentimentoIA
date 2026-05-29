import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
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
  ApiRequestError,
  downloadReport,
  type ReportsListItem,
  sentimentApi,
} from "@/lib/api";

type ExportAction = "csv-raw" | "pdf-dashboard" | "pdf-insights" | "pdf-metrics";

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

function resolveReportExportErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiRequestError) {
    const status = error.status ?? 0;
    if (status === 400) {
      return "Filtro de exportacao invalido. Revise empresa e periodo selecionados.";
    }
    if (status === 404) {
      return "Nenhum dado encontrado para exportacao com os filtros informados.";
    }
    if (status === 408 || status === 504) {
      return "A exportacao excedeu o tempo limite. Tente reduzir o periodo e tente novamente.";
    }
    if (status >= 500) {
      return "Falha temporaria no servidor ao gerar o arquivo. Tente novamente em instantes.";
    }
    return error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    const normalized = error.message.trim().toLowerCase();
    if (normalized.includes("timeout") || normalized.includes("tempo limite")) {
      return "A exportacao excedeu o tempo limite. Tente reduzir o periodo e tente novamente.";
    }
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
}

export default function ReportsPage() {
  const { t } = useAppSettings();
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
  const [limit, setLimit] = useState(100);

  const [items, setItems] = useState<ReportsListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeExport, setActiveExport] = useState<ExportAction | null>(null);
  const exportInFlightRef = useRef(false);
  const hasRequiredFilters = Boolean(selectedCompanySlug && fromDate && toDate);


  async function loadReports() {
    if (!hasRequiredFilters) {
      setItems([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await sentimentApi.reports({
        company_slug: selectedCompanySlug,
        from: fromDate,
        to: toDate,
        limit,
      });
      setItems(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar relatórios.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(action: ExportAction) {
    if (exportInFlightRef.current) {
      return;
    }

    if (!hasRequiredFilters) {
      toast.error("Selecione empresa e período antes de exportar.");
      return;
    }

    if (fromDate > toDate) {
      toast.error("Periodo invalido: a data inicial deve ser menor ou igual a data final.");
      return;
    }

    exportInFlightRef.current = true;
    setActiveExport(action);

    try {
      if (action === "csv-raw") {
        await downloadReport("csv", {
          company_slug: selectedCompanySlug,
          from: fromDate,
          to: toDate,
          filename: `dados-captados-${selectedCompanySlug}-${fromDate}-${toDate}.csv`,
        });
      } else if (action === "pdf-insights") {
        await sentimentApi.exportInsightsPdf({
          companySlug: selectedCompanySlug,
          from: fromDate,
          to: toDate,
          limit,
          filename: `insights-${selectedCompanySlug}-${fromDate}-${toDate}.pdf`,
        });
      } else {
        await downloadReport("pdf", {
          company_slug: selectedCompanySlug,
          from: fromDate,
          to: toDate,
          source: action === "pdf-dashboard" ? "dashboard" : "metrics",
          filename:
            action === "pdf-dashboard"
              ? `dashboard-${selectedCompanySlug}-${fromDate}-${toDate}.pdf`
              : `metricas-${selectedCompanySlug}-${fromDate}-${toDate}.pdf`,
        });
      }
    } catch (err) {
      toast.error(resolveReportExportErrorMessage(err, t("reports.error")));
    } finally {
      exportInFlightRef.current = false;
      setActiveExport(null);
    }
  }


  useEffect(() => {
    if (!hasRequiredFilters) {
      setItems([]);
      setLoading(false);
      setError("");
      return;
    }

    void loadReports();
  }, [hasRequiredFilters, selectedCompanySlug, fromDate, toDate, limit]);

  const selectedCompanyName = useMemo(
    () => companies.find((company) => company.slug === selectedCompanySlug)?.name || "Não selecionada",
    [companies, selectedCompanySlug]
  );
  const hasCompanySelected = selectedCompanySlug.length > 0;

  let reportsContent: ReactNode;
  if (loading) {
    reportsContent = <p className="mt-4 text-sm text-muted-foreground">Carregando relatórios...</p>;
  } else if (items.length === 0) {
    reportsContent = (
      <p className="mt-4 text-sm text-muted-foreground">
        Nenhum relatório encontrado para os filtros selecionados.
      </p>
    );
  } else {
    reportsContent = (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground">
              <th className="px-3 py-2">Empresa - Período</th>
              <th className="px-3 py-2">Criado em</th>
              <th className="px-3 py-2">Formato</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/40">
                <td className="px-3 py-2 font-medium text-foreground">
                  {item.company_name} - {item.period_label}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "-"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{item.format || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <AppShell
      title={t("reports.title")}
      subtitle={
        hasRequiredFilters
          ? "Relatórios por empresa e período com exportações para dados brutos e apresentações."
          : "Selecione empresa e período para habilitar relatórios e exportação."
      }
      actions={
        <button
          type="button"
          onClick={() => void loadReports()}
          className="secondary-btn"
          disabled={!hasRequiredFilters || loading}
        >
          <RefreshCw size={16} /> {t("common.refresh")}
        </button>
      }
    >
      <section className="mb-5 app-panel p-5">
        <h2 className="panel-title">Filtros de relatório</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Empresa atual: <span className="font-semibold text-foreground">{selectedCompanyName}</span>
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
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
            <span className="text-muted-foreground">Até:</span>
            <input
              type="date"
              className="field-input h-9 py-1"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Limite:</span>
            <input
              type="number"
              min={1}
              max={500}
              className="field-input h-9 py-1"
              value={limit}
              onChange={(event) =>
                setLimit(Math.max(1, Math.min(500, Number(event.target.value || 100))))
              }
            />
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:col-span-2 xl:col-span-5">
            <button
              type="button"
              className="primary-btn w-full justify-center"
              disabled={activeExport !== null}
              onClick={() => void handleDownload("csv-raw")}
            >
              <Download size={16} />
              <span>{activeExport === "csv-raw" ? t("common.processing") : "CSV bruto"}</span>
            </button>

            <button
              type="button"
              className="secondary-btn w-full justify-center"
              disabled={activeExport !== null}
              onClick={() => void handleDownload("pdf-dashboard")}
            >
              <FileText size={16} />
              <span>{activeExport === "pdf-dashboard" ? t("common.processing") : "PDF Dashboard"}</span>
            </button>

            <button
              type="button"
              className="secondary-btn w-full justify-center"
              disabled={activeExport !== null}
              onClick={() => void handleDownload("pdf-insights")}
            >
              <FileText size={16} />
              <span>{activeExport === "pdf-insights" ? t("common.processing") : "PDF Insights"}</span>
            </button>

            <button
              type="button"
              className="secondary-btn w-full justify-center"
              disabled={activeExport !== null}
              onClick={() => void handleDownload("pdf-metrics")}
            >
              <FileText size={16} />
              <span>{activeExport === "pdf-metrics" ? t("common.processing") : "PDF Métricas"}</span>
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
          <p>CSV bruto: exporta os dados captados no período filtrado para uso analítico.</p>
          <p>PDFs de apresentação: dashboard, insights e métricas prontos para compartilhamento executivo.</p>
        </div>
      </section>

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {hasCompanySelected ? null : (
        <section className="app-panel mb-5 p-8 text-center">
          <p className="text-base font-semibold">Selecione uma empresa para carregar relatórios</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sem empresa selecionada, nenhuma leitura pesada e executada.
          </p>
        </section>
      )}

      {hasCompanySelected ? (
      <section className="app-panel p-5 md:p-6">
        <h2 className="panel-title">Relatórios disponíveis</h2>
        {reportsContent}
      </section>
      ) : null}
    </AppShell>
  );
}


