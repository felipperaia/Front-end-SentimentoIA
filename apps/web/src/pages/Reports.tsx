import { AppShell } from "@/components/AppShell";
import { downloadReport } from "@/lib/api";
import { Download, FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <AppShell
      title="Relatorios e exportacoes"
      subtitle="Exporte dados consolidados para auditoria, compartilhamento executivo e historico de reputacao."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <article className="app-panel p-6 md:p-7">
          <h2 className="panel-title">Exportacao CSV</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Arquivo tabular com marca, fonte, sentimento, criticidade, aspectos e texto da mencao.
          </p>
          <button onClick={() => downloadReport("csv")} className="primary-btn mt-6">
            <Download size={16} />
            <span>Baixar CSV</span>
          </button>
        </article>

        <article className="app-panel p-6 md:p-7">
          <h2 className="panel-title">Relatorio PDF</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Resumo executivo com metricas agregadas e lista de mencoes criticas e recentes.
          </p>
          <button onClick={() => downloadReport("pdf")} className="primary-btn mt-6">
            <FileText size={16} />
            <span>Baixar PDF</span>
          </button>
        </article>
      </div>
    </AppShell>
  );
}
