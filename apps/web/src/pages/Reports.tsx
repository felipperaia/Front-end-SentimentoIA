import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { downloadReport } from "@/lib/api";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const { t } = useAppSettings();

  async function handleDownload(format: "csv" | "pdf") {
    try {
      await downloadReport(format);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("reports.error"));
    }
  }

  return (
    <AppShell
      title={t("reports.title")}
      subtitle={t("reports.subtitle")}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <article className="app-panel p-6 md:p-7">
          <h2 className="panel-title">{t("reports.csvTitle")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("reports.csvText")}
          </p>
          <button type="button" onClick={() => void handleDownload("csv")} className="primary-btn mt-6">
            <Download size={16} />
            <span>{t("reports.csvButton")}</span>
          </button>
        </article>

        <article className="app-panel p-6 md:p-7">
          <h2 className="panel-title">{t("reports.pdfTitle")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("reports.pdfText")}
          </p>
          <button type="button" onClick={() => void handleDownload("pdf")} className="primary-btn mt-6">
            <FileText size={16} />
            <span>{t("reports.pdfButton")}</span>
          </button>
        </article>
      </div>
    </AppShell>
  );
}
