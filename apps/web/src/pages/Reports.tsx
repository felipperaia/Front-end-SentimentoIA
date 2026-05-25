import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  downloadReport,
  type CompanyItem,
  type ReportsListItem,
  sentimentApi,
} from "@/lib/api";

type ExportAction = "csv" | "pdf";

export default function ReportsPage() {
  const { t } = useAppSettings();

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState(100);

  const [items, setItems] = useState<ReportsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeExport, setActiveExport] = useState<ExportAction | null>(null);

  async function loadCompanies() {
    try {
      const response = await sentimentApi.listCompanies();
      setCompanies(response.items || []);
    } catch {
      setCompanies([]);
    }
  }

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const response = await sentimentApi.reports({
        company_id: selectedCompanyId || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit,
      });
      setItems(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar relatorios.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(format: ExportAction) {
    setActiveExport(format);

    try {
      await downloadReport(format, {
        company_id: selectedCompanyId || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("reports.error"));
    } finally {
      setActiveExport(null);
    }
  }

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    void loadReports();
  }, [selectedCompanyId, fromDate, toDate, limit]);

  const selectedCompanyName = useMemo(
    () => companies.find((company) => company.companyId === selectedCompanyId)?.name || "Todas",
    [companies, selectedCompanyId]
  );

  let reportsContent: ReactNode;
  if (loading) {
    reportsContent = <p className="mt-4 text-sm text-muted-foreground">Carregando relatorios...</p>;
  } else if (items.length === 0) {
    reportsContent = (
      <p className="mt-4 text-sm text-muted-foreground">
        Nenhum relatorio encontrado para os filtros selecionados.
      </p>
    );
  } else {
    reportsContent = (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground">
              <th className="px-3 py-2">Empresa - Periodo</th>
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
      subtitle="Relatorios por empresa e periodo, com exportacao filtrada em CSV e PDF."
      actions={
        <button type="button" onClick={() => void loadReports()} className="secondary-btn">
          <RefreshCw size={16} /> {t("common.refresh")}
        </button>
      }
    >
      <section className="mb-5 app-panel p-5">
        <h2 className="panel-title">Filtros de relatorio</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Empresa atual: <span className="font-semibold text-foreground">{selectedCompanyName}</span>
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Empresa:</span>
            <select
              className="field-input h-9 py-1"
              value={selectedCompanyId}
              onChange={(event) => setSelectedCompanyId(event.target.value)}
            >
              <option value="">Todas</option>
              {companies.map((company) => (
                <option key={company.companyId} value={company.companyId}>
                  {company.name}
                </option>
              ))}
            </select>
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="primary-btn"
              disabled={activeExport !== null}
              onClick={() => void handleDownload("csv")}
            >
              <Download size={16} />
              <span>{activeExport === "csv" ? t("common.processing") : "Exportar CSV"}</span>
            </button>

            <button
              type="button"
              className="secondary-btn"
              disabled={activeExport !== null}
              onClick={() => void handleDownload("pdf")}
            >
              <FileText size={16} />
              <span>{activeExport === "pdf" ? t("common.processing") : "Exportar PDF"}</span>
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="app-panel p-5 md:p-6">
        <h2 className="panel-title">Relatorios disponiveis</h2>
        {reportsContent}
      </section>
    </AppShell>
  );
}
