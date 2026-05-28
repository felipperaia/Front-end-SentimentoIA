import { useState } from "react";
import { sentimentApi } from "@/lib/api";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { AlertTriangle, Trash2, X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDataDeleted: () => void;
};

export function DataManagementModal({ isOpen, onClose, onDataDeleted }: ModalProps) {
  const { t } = useAppSettings();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleDeleteAll = async () => {
    if (!window.confirm("Tem certeza? Essa ação não pode ser desfeita e APAGARÁ TUDO (pesquisas, conversas, insights, cache).")) {
      return;
    }
    
    setIsDeleting(true);
    setError("");
    setSuccess("");
    
    try {
      await sentimentApi.deleteAllUserData();
      setSuccess("Todos os seus dados foram apagados com sucesso.");
      setTimeout(() => {
        onDataDeleted();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar dados.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteByType = async (type: "conversations" | "searches" | "insights") => {
    if (!window.confirm(`Tem certeza que deseja apagar todos(as) os(as) ${type}?`)) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      if (type === "conversations") await sentimentApi.deleteAllChatThreads();
      if (type === "searches") await sentimentApi.deleteAllSearches();
      if (type === "insights") await sentimentApi.deleteAllInsights();
      
      setSuccess(`${type} apagados com sucesso.`);
      setTimeout(() => {
        onDataDeleted();
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao apagar ${type}.`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-management-title"
        className="app-panel w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h2 id="data-management-title" className="text-lg font-semibold">Gerenciar e Apagar Dados</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Fechar modal de gerenciamento de dados"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/70 p-4 bg-background/50">
              <div>
                <h3 className="font-medium">Pesquisas e Menções</h3>
                <p className="text-xs text-muted-foreground mt-1">Apaga todos os relatórios e menções salvas.</p>
              </div>
              <button 
                type="button"
                onClick={() => handleDeleteByType("searches")} 
                disabled={isDeleting}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 min-h-[44px]"
                aria-label="Apagar todas as pesquisas e menções"
              >
                Apagar
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 p-4 bg-background/50">
              <div>
                <h3 className="font-medium">Insights</h3>
                <p className="text-xs text-muted-foreground mt-1">Apaga todos os insights gerados pela IA.</p>
              </div>
              <button 
                type="button"
                onClick={() => handleDeleteByType("insights")} 
                disabled={isDeleting}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 min-h-[44px]"
                aria-label="Apagar todos os insights"
              >
                Apagar
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 p-4 bg-background/50">
              <div>
                <h3 className="font-medium">Conversas</h3>
                <p className="text-xs text-muted-foreground mt-1">Apaga todas as conversas do assistente.</p>
              </div>
              <button 
                type="button"
                onClick={() => handleDeleteByType("conversations")} 
                disabled={isDeleting}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 min-h-[44px]"
                aria-label="Apagar todas as conversas"
              >
                Apagar
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 dark:border-rose-900/30 dark:bg-rose-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-rose-600 dark:text-rose-400" size={20} />
              <div>
                <h3 className="font-medium text-rose-800 dark:text-rose-200">Zona de Perigo</h3>
                <p className="mt-1 text-sm text-rose-700/80 dark:text-rose-300/80">
                  Esta ação apagará <strong>todos</strong> os dados vinculados à sua conta (buscas, conversas, cache operacional, etc). Não há volta.
                </p>
                <button 
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50 min-h-[44px]"
                  aria-label="Apagar todos os dados da conta"
                >
                  <Trash2 size={16} />
                  Apagar Tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
