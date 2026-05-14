import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { downloadInsightsReport, downloadReport } from "@/lib/api";
import { Download, FileText, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ExportAction = "csv" | "pdf" | "insights-markdown" | "insights-pdf";

export default function ReportsPage() {
  const { t } = useAppSettings();
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [resolutionFilter, setResolutionFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all");
  const [limit, setLimit] = useState(100);
  const [activeExport, setActiveExport] = useState<ExportAction | null>(null);
  const [lastFailedExport, setLastFailedExport] = useState<ExportAction | null>(null);

  const insightExportParams = {
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    resolution: resolutionFilter === "all" ? undefined : resolutionFilter,
    limit,
  };

  async function handleDownload(format: "csv" | "pdf") {
    const action = format;
    setActiveExport(action);
    setLastFailedExport(null);

    try {
      await downloadReport(format);
    } catch (err) {
      setLastFailedExport(action);
      toast.error(err instanceof Error ? err.message : t("reports.error"));
    } finally {
      setActiveExport(null);
    }
  }

  async function handleInsightsDownload(format: "markdown" | "pdf") {
    const action: ExportAction = format === "markdown" ? "insights-markdown" : "insights-pdf";
    setActiveExport(action);
    setLastFailedExport(null);

    try {
      await downloadInsightsReport(format, insightExportParams);
    } catch (err) {
      setLastFailedExport(action);
      toast.error(err instanceof Error ? err.message : t("reports.error"));
    } finally {
      setActiveExport(null);
    }
  }

  async function retryLastExport() {
    if (!lastFailedExport) return;

    if (lastFailedExport === "csv") {
      await handleDownload("csv");
      return;
    }

    if (lastFailedExport === "pdf") {
      await handleDownload("pdf");
      return;
    }

    if (lastFailedExport === "insights-markdown") {
      await handleInsightsDownload("markdown");
      return;
    }

    await handleInsightsDownload("pdf");
  }

  return (
    <AppShell
      title={t("reports.title")}
      subtitle={t("reports.subtitle")}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <article className="app-panel p-6 md:col-span-2 md:p-7">
          <h2 className="panel-title">Filtros para exportar insights</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Os filtros abaixo valem para os botões de exportacao de insights em Markdown e PDF.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Prioridade:</span>
              <select
                className="field-input h-9 py-1"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as "all" | "high" | "medium" | "low")}
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baixa/OK</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Resolucao:</span>
              <select
                className="field-input h-9 py-1"
                value={resolutionFilter}
                onChange={(event) =>
                  setResolutionFilter(event.target.value as "all" | "pending" | "in_progress" | "resolved")
                }
              >
                <option value="all">Todas</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em andamento</option>
                <option value="resolved">Resolvido</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Limite:</span>
              <input
                type="number"
                min={1}
                max={500}
                value={limit}
                onChange={(event) => setLimit(Math.max(1, Math.min(500, Number(event.target.value || 100))))}
                className="field-input h-9 py-1"
              />
            </label>
          </div>

          {lastFailedExport ? (
            <div className="mt-4">
              <button type="button" onClick={() => void retryLastExport()} className="secondary-btn">
                <RefreshCw size={16} /> Tentar novamente ultima exportacao
              </button>
            </div>
          ) : null}
        </article>

        <article className="app-panel p-6 md:p-7">
          <h2 className="panel-title">{t("reports.csvTitle")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("reports.csvText")}
          </p>
          <button
            type="button"
            onClick={() => void handleDownload("csv")}
            className="primary-btn mt-6"
            disabled={activeExport !== null}
          >
            <Download size={16} />
            <span>{activeExport === "csv" ? t("common.processing") : t("reports.csvButton")}</span>
          </button>
        </article>

        <article className="app-panel p-6 md:p-7">
          <h2 className="panel-title">{t("reports.pdfTitle")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("reports.pdfText")}
          </p>
          <button
            type="button"
            onClick={() => void handleDownload("pdf")}
            className="primary-btn mt-6"
            disabled={activeExport !== null}
          >
            <FileText size={16} />
            <span>{activeExport === "pdf" ? t("common.processing") : t("reports.pdfButton")}</span>
          </button>
        </article>

        <article className="app-panel p-6 md:p-7">
          <h2 className="panel-title">Exportação de Insights (Markdown)</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Baixe os insights com prioridade, urgência, status, resolução, causa raiz e ação recomendada em arquivo .md.
          </p>
          <button
            type="button"
            onClick={() => void handleInsightsDownload("markdown")}
            className="primary-btn mt-6"
            disabled={activeExport !== null}
          >
            <Download size={16} />
            <span>{activeExport === "insights-markdown" ? t("common.processing") : "Baixar Markdown"}</span>
          </button>
        </article>

        <article className="app-panel p-6 md:p-7">
          <h2 className="panel-title">Exportação de Insights (PDF)</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Baixe os insights em PDF executivo com classificação de prioridade e situação de resolução.
          </p>
          <button
            type="button"
            onClick={() => void handleInsightsDownload("pdf")}
            className="primary-btn mt-6"
            disabled={activeExport !== null}
          >
            <FileText size={16} />
            <span>{activeExport === "insights-pdf" ? t("common.processing") : "Baixar PDF de Insights"}</span>
          </button>
        </article>
      </div>
    </AppShell>
  );
}
