import { useAppSettings } from "@/contexts/AppSettingsContext";
import { sentimentApi, type ChatMessage, type ChatThread } from "@/lib/api";
import { MessageSquareText, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AIChatBox, type Message } from "./AIChatBox";

type ThreadOption = {
  id: string;
  label: string;
};

const CHAT_ENABLED = String(import.meta.env.VITE_ENABLE_CHAT ?? "true") !== "false";

function normalizeMessageRole(role: ChatMessage["role"]): Message["role"] {
  if (role === "assistant") return "assistant";
  if (role === "system") return "system";
  return "user";
}

function mapMessages(items: ChatMessage[]): Message[] {
  return items.map((item) => ({
    role: normalizeMessageRole(item.role),
    content: item.content,
  }));
}

function normalizeThreadOptions(items: ChatThread[], fallbackLabel: string): ThreadOption[] {
  return items.map((thread) => ({
    id: thread.thread_id || thread.id,
    label: thread.title || fallbackLabel,
  }));
}

export function DomainChatWidget() {
  const { settings, t } = useAppSettings();
  const [open, setOpen] = useState(false);
  const [booting, setBooting] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(false);
  const [error, setError] = useState("");
  const [threadOptions, setThreadOptions] = useState<ThreadOption[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [backendMessages, setBackendMessages] = useState<ChatMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const ensureActiveThread = useCallback(async () => {
    const fallbackLabel = t("chat.threadFallback");
    const listed = await sentimentApi.listChatThreads(20);
    const options = normalizeThreadOptions(listed.items || [], fallbackLabel);
    setThreadOptions(options);

    if (options.length > 0) {
      return options[0].id;
    }

    const created = await sentimentApi.createChatThread();
    const createdId = created.item.thread_id || created.item.id;
    setThreadOptions([{ id: createdId, label: created.item.title || fallbackLabel }]);
    return createdId;
  }, [t]);

  const loadMessages = useCallback(async (threadId: string) => {
    const response = await sentimentApi.listChatMessages(threadId, 120);
    const items = response.items || [];
    setBackendMessages(items);
    setMessages(mapMessages(items));
  }, []);

  const bootstrap = useCallback(async () => {
    setBooting(true);
    setError("");
    try {
      const threadId = activeThreadId || (await ensureActiveThread());
      setActiveThreadId(threadId);
      await loadMessages(threadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat.openError"));
    } finally {
      setBooting(false);
    }
  }, [activeThreadId, ensureActiveThread, loadMessages, t]);

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

      try {
        const response = await sentimentApi.sendChatMessage(activeThreadId, trimmed);

        const threadId = response.thread?.thread_id || response.thread?.id;
        if (threadId) {
          const title = response.thread?.title || t("chat.threadFallback");
          setThreadOptions((current) => {
            const next = current.filter((item) => item.id !== threadId);
            return [{ id: threadId, label: title }, ...next];
          });
          setActiveThreadId(threadId);
          await loadMessages(threadId);
        } else {
          await loadMessages(activeThreadId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("chat.sendError"));
      } finally {
        setSending(false);
      }
    },
    [activeThreadId, loadMessages, t]
  );

  async function handleThreadChange(nextThreadId: string) {
    setActiveThreadId(nextThreadId);
    setError("");
    setBooting(true);
    try {
      await loadMessages(nextThreadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat.loadError"));
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
      const option = { id: threadId, label: created.item.title || t("chat.threadFallback") };
      setThreadOptions((current) => [option, ...current]);
      setActiveThreadId(threadId);
      setBackendMessages([]);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat.createError"));
    } finally {
      setBooting(false);
    }
  }

  async function handleDeleteThread() {
    if (!activeThreadId || deletingThread || booting || sending || deletingMessage) return;

    const confirmDelete = globalThis.confirm(
      settings.locale === "en-US"
        ? "Do you want to delete this conversation?"
        : "Deseja apagar esta conversa?"
    );
    if (!confirmDelete) return;

    setDeletingThread(true);
    setError("");

    try {
      await sentimentApi.deleteChatThread(activeThreadId);

      const remaining = threadOptions.filter((item) => item.id !== activeThreadId);
      setThreadOptions(remaining);

      if (remaining.length > 0) {
        const nextThreadId = remaining[0].id;
        setActiveThreadId(nextThreadId);
        await loadMessages(nextThreadId);
      } else {
        setActiveThreadId(null);
        setBackendMessages([]);
        setMessages([]);
        await handleCreateThread();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat.loadError"));
    } finally {
      setDeletingThread(false);
    }
  }

  async function handleDeleteLastMessage() {
    if (!activeThreadId || deletingMessage || booting || sending || deletingThread) return;

    const lastMessage = [...backendMessages]
      .reverse()
      .find((item) => item.role !== "system" && (item.message_id || item.id));
    const messageId = lastMessage?.message_id || lastMessage?.id;
    if (!messageId) return;

    const confirmDelete = globalThis.confirm(
      settings.locale === "en-US"
        ? "Do you want to delete the last message from this conversation?"
        : "Deseja apagar a ultima mensagem desta conversa?"
    );
    if (!confirmDelete) return;

    setDeletingMessage(true);
    setError("");

    try {
      await sentimentApi.deleteChatMessage(activeThreadId, messageId);
      await loadMessages(activeThreadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat.loadError"));
    } finally {
      setDeletingMessage(false);
    }
  }

  if (!CHAT_ENABLED) return null;

  const localePrefix = settings.locale === "en-US" ? "EN" : "PT";
  const hasDeletableMessage = backendMessages.some((item) => item.role !== "system" && (item.message_id || item.id));

  return (
    <>
      {open ? (
        <div className="fixed bottom-22 right-4 z-50 w-[calc(100vw-2rem)] max-w-[420px] rounded-lg border border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between border-b border-border px-3 py-2">
            <div>
              <p className="text-sm font-semibold">{t("chat.title")}</p>
              <p className="text-xs text-muted-foreground">
                {localePrefix} - {t("chat.domainLocked")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => void bootstrap()} className="icon-btn" title={t("chat.refreshContext")}>
                <RefreshCw size={16} />
              </button>
              <button onClick={() => setOpen(false)} className="icon-btn" title={t("common.close")}>
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
            <button onClick={() => void handleCreateThread()} className="icon-btn" title={t("chat.newConversation")}>
              <Plus size={16} />
            </button>
            <button
              onClick={() => void handleDeleteLastMessage()}
              className="icon-btn"
              title={settings.locale === "en-US" ? "Delete last message" : "Apagar ultima mensagem"}
              disabled={booting || sending || deletingThread || deletingMessage || !activeThreadId || !hasDeletableMessage}
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => void handleDeleteThread()}
              className="icon-btn text-rose-600"
              title={settings.locale === "en-US" ? "Delete conversation" : "Apagar conversa"}
              disabled={booting || sending || deletingThread || deletingMessage || !activeThreadId}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {error ? (
            <div className="border-b border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
              <div className="mb-2">{error}</div>
              <button className="secondary-btn h-8 px-3 py-1 text-xs" onClick={() => void bootstrap()}>
                {settings.locale === "en-US" ? "Retry" : "Tentar novamente"}
              </button>
            </div>
          ) : null}

          <AIChatBox
            messages={messages}
            onSendMessage={(value) => void handleSendMessage(value)}
            isLoading={booting || sending}
            placeholder={t("chat.placeholder")}
            className="rounded-none border-none shadow-none"
            height="430px"
            suggestedPrompts={[
              t("chat.promptCritical"),
              t("chat.promptSettings"),
              t("chat.promptScore"),
            ]}
            emptyStateMessage={t("chat.emptyState")}
          />
        </div>
      ) : null}

      <button
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-xl transition hover:-translate-y-0.5"
      >
        <MessageSquareText size={18} />
        <span className="text-sm font-semibold">{t("chat.launcher")}</span>
      </button>
    </>
  );
}
