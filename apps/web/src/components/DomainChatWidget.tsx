import { useAppSettings } from "@/contexts/AppSettingsContext";
import { sentimentApi, type ChatMessage, type ChatThread } from "@/lib/api";
import { MessageSquareText, Plus, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AIChatBox, type Message } from "./AIChatBox";

type ThreadOption = {
  id: string;
  label: string;
};

function mapMessages(items: ChatMessage[]): Message[] {
  return items.map((item) => ({
    role: item.role === "assistant" ? "assistant" : item.role === "system" ? "system" : "user",
    content: item.content,
  }));
}

function normalizeThreadOptions(items: ChatThread[]): ThreadOption[] {
  return items.map((thread) => ({
    id: thread.thread_id || thread.id,
    label: thread.title || "Nova conversa",
  }));
}

export function DomainChatWidget() {
  const { settings, t } = useAppSettings();
  const [open, setOpen] = useState(false);
  const [booting, setBooting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [threadOptions, setThreadOptions] = useState<ThreadOption[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const ensureActiveThread = useCallback(async () => {
    const listed = await sentimentApi.listChatThreads(20);
    const options = normalizeThreadOptions(listed.items || []);
    setThreadOptions(options);

    if (options.length > 0) {
      return options[0].id;
    }

    const created = await sentimentApi.createChatThread();
    const createdId = created.item.thread_id || created.item.id;
    setThreadOptions([{ id: createdId, label: created.item.title || "Nova conversa" }]);
    return createdId;
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    const response = await sentimentApi.listChatMessages(threadId, 120);
    setMessages(mapMessages(response.items || []));
  }, []);

  const bootstrap = useCallback(async () => {
    setBooting(true);
    setError("");
    try {
      const threadId = activeThreadId || (await ensureActiveThread());
      setActiveThreadId(threadId);
      await loadMessages(threadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao abrir chat");
    } finally {
      setBooting(false);
    }
  }, [activeThreadId, ensureActiveThread, loadMessages]);

  useEffect(() => {
    if (!open) return;
    void bootstrap();
  }, [open, bootstrap]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeThreadId) return;

      const trimmed = content.trim();
      if (!trimmed) return;

      setError("");
      setSending(true);
      setMessages((current) => [...current, { role: "user", content: trimmed }]);

      try {
        const response = await sentimentApi.sendChatMessage(activeThreadId, trimmed);
        const assistantText = response.assistant_message?.content || "";
        if (assistantText) {
          setMessages((current) => [...current, { role: "assistant", content: assistantText }]);
        }

        const threadId = response.thread?.thread_id || response.thread?.id;
        if (threadId) {
          const title = response.thread?.title || "Nova conversa";
          setThreadOptions((current) => {
            const next = current.filter((item) => item.id !== threadId);
            return [{ id: threadId, label: title }, ...next];
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      } finally {
        setSending(false);
      }
    },
    [activeThreadId]
  );

  async function handleThreadChange(nextThreadId: string) {
    setActiveThreadId(nextThreadId);
    setError("");
    setBooting(true);
    try {
      await loadMessages(nextThreadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar mensagens");
    } finally {
      setBooting(false);
    }
  }

  async function handleCreateThread() {
    setBooting(true);
    setError("");
    try {
      const created = await sentimentApi.createChatThread();
      const threadId = created.item.thread_id || created.item.id;
      const option = { id: threadId, label: created.item.title || "Nova conversa" };
      setThreadOptions((current) => [option, ...current]);
      setActiveThreadId(threadId);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar nova conversa");
    } finally {
      setBooting(false);
    }
  }

  const localePrefix = settings.locale === "en-US" ? "EN" : "PT";

  return (
    <>
      {open ? (
        <div className="fixed bottom-22 right-4 z-50 w-[calc(100vw-2rem)] max-w-[420px] rounded-2xl border border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between border-b border-border px-3 py-2">
            <div>
              <p className="text-sm font-semibold">{t("chat.title")}</p>
              <p className="text-xs text-muted-foreground">{localePrefix} · Domain locked</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => void bootstrap()} className="icon-btn" title="Atualizar contexto">
                <RefreshCw size={16} />
              </button>
              <button onClick={() => setOpen(false)} className="icon-btn" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <select
              className="field-input h-9 py-1 text-sm"
              value={activeThreadId || ""}
              onChange={(event) => void handleThreadChange(event.target.value)}
              disabled={booting || sending || threadOptions.length === 0}
            >
              {threadOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button onClick={() => void handleCreateThread()} className="icon-btn" title="Nova conversa">
              <Plus size={16} />
            </button>
          </div>

          {error ? (
            <div className="border-b border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <AIChatBox
            messages={messages}
            onSendMessage={(value) => void handleSendMessage(value)}
            isLoading={booting || sending}
            placeholder={t("chat.placeholder")}
            className="rounded-none border-none shadow-none"
            height="430px"
            suggestedPrompts={
              settings.locale === "en-US"
                ? [
                    "How do I read critical mentions?",
                    "Where can I change language settings?",
                    "How is the reputation score calculated?",
                  ]
                : [
                    "Como interpreto as mencoes criticas?",
                    "Onde altero idioma e tema?",
                    "Como o score de reputacao e calculado?",
                  ]
            }
            emptyStateMessage={
              settings.locale === "en-US"
                ? "I can help with SentimentoIA features and your authorized account data."
                : "Posso ajudar com funcionalidades do SentimentoIA e dados autorizados da sua conta."
            }
          />
        </div>
      ) : null}

      <button
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-xl transition hover:-translate-y-0.5"
      >
        <MessageSquareText size={18} />
        <span className="text-sm font-semibold">Chat IA</span>
      </button>
    </>
  );
}
