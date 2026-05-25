import { useAppSettings } from "@/contexts/AppSettingsContext";
import { sentimentApi, type ChatMessage, type ChatThread } from "@/lib/api";
import { useIsMobile } from "@/hooks/useMobile";
import { MessageSquareText, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AIChatBox, type Message } from "./AIChatBox";

type ThreadOption = {
  id: string;
  label: string;
};

const CHAT_ENABLED = String(import.meta.env.VITE_ENABLE_CHAT ?? "true") !== "false";

function ignoreAsync(promise: Promise<unknown>) {
  promise.catch(() => undefined);
}

function normalizeMessageRole(role: ChatMessage["role"]): Message["role"] {
  if (role === "assistant") return "assistant";
  if (role === "system") return "system";
  return "user";
}

function mapMessages(items: ChatMessage[]): Message[] {
  return items
    .filter((item) => Boolean(String(item?.content || "").trim()))
    .map((item, index) => ({
      id: item.message_id || item.id || `${item.role}-${item.created_at || index}`,
      role: normalizeMessageRole(item.role),
      content: item.content || "",
    }));
}

function normalizeThreadOptions(items: ChatThread[], fallbackLabel: string): ThreadOption[] {
  return items
    .map((thread) => ({
      id: thread.thread_id || thread.id,
      label: thread.title || fallbackLabel,
    }))
    .filter((thread) => Boolean(thread.id));
}

export function DomainChatWidget() { // NOSONAR
  const { settings, t } = useAppSettings();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [booting, setBooting] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(false);
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
    if (!threadId) {
      setBackendMessages([]);
      setMessages([]);
      return;
    }

    const response = await sentimentApi.listChatMessages(threadId, 120);
    const items = response.items || [];
    setBackendMessages(items);
    setMessages(mapMessages(items));
  }, []);

  const bootstrap = useCallback(async () => {
    setBooting(true);
    try {
      const threadId = activeThreadId || (await ensureActiveThread());
      setActiveThreadId(threadId);
      await loadMessages(threadId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("chat.openError"));
    } finally {
      setBooting(false);
    }
  }, [activeThreadId, ensureActiveThread, loadMessages, t]);

  useEffect(() => {
    if (!open) return;
    ignoreAsync(bootstrap());
  }, [open, bootstrap]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeThreadId) return;

      const trimmed = content.trim();
      if (!trimmed) return;

      setSending(true);

      try {
        const response = await sentimentApi.sendChatMessage(activeThreadId, trimmed);

        const threadId = response.thread?.thread_id || response.thread?.id;
        const hasCompletePayload = Boolean(response.user_message?.id || response.user_message?.message_id) &&
          Boolean(response.assistant_message?.id || response.assistant_message?.message_id);

        if (threadId) {
          const title = response.thread?.title || t("chat.threadFallback");
          setThreadOptions((current) => {
            const next = current.filter((item) => item.id !== threadId);
            return [{ id: threadId, label: title }, ...next];
          });
          setActiveThreadId(threadId);
          await loadMessages(threadId);
        } else if (hasCompletePayload) {
          await loadMessages(activeThreadId);
        } else {
          await loadMessages(activeThreadId);
        }
      } catch {
        toast.error("O assistente esta temporariamente indisponivel. Tente novamente.");
        if (activeThreadId) {
          try {
            await loadMessages(activeThreadId);
          } catch {
            // Mantem erro principal e evita sobrescrever o estado atual.
          }
        }
      } finally {
        setSending(false);
      }
    },
    [activeThreadId, loadMessages, t]
  );

  async function handleThreadChange(nextThreadId: string) {
    if (!nextThreadId) return;
    setActiveThreadId(nextThreadId);
    setBooting(true);
    try {
      await loadMessages(nextThreadId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("chat.loadError"));
    } finally {
      setBooting(false);
    }
  }

  async function handleCreateThread() {
    setBooting(true);
    try {
      const created = await sentimentApi.createChatThread();
      const threadId = created.item.thread_id || created.item.id;
      const option = { id: threadId, label: created.item.title || t("chat.threadFallback") };
      setThreadOptions((current) => [option, ...current]);
      setActiveThreadId(threadId);
      setBackendMessages([]);
      setMessages([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("chat.createError"));
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
      toast.error(err instanceof Error ? err.message : t("chat.loadError"));
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

    try {
      await sentimentApi.deleteChatMessage(activeThreadId, messageId);
      await loadMessages(activeThreadId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("chat.loadError"));
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
        <div className="fixed inset-0 z-50 flex flex-col rounded-none border border-border bg-card shadow-2xl sm:inset-auto sm:bottom-22 sm:right-4 sm:w-[calc(100vw-2rem)] sm:max-w-[420px] sm:rounded-lg">
          <header className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t("chat.title")}</p>
              <p className="text-xs text-muted-foreground">
                {localePrefix} - {t("chat.domainLocked")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  ignoreAsync(bootstrap());
                }}
                className="icon-btn"
                title={t("chat.refreshContext")}
                aria-label={t("chat.refreshContext")}
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-btn"
                title={t("common.close")}
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <select
              className="field-input h-9 py-1 text-sm"
              value={activeThreadId || ""}
              onChange={(event) => {
                ignoreAsync(handleThreadChange(event.target.value));
              }}
              disabled={booting || sending || threadOptions.length === 0}
              aria-label={settings.locale === "en-US" ? "Select conversation" : "Selecionar conversa"}
            >
              {threadOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                ignoreAsync(handleCreateThread());
              }}
              className="icon-btn"
              title={t("chat.newConversation")}
              aria-label={t("chat.newConversation")}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                ignoreAsync(handleDeleteLastMessage());
              }}
              className="icon-btn"
              title={settings.locale === "en-US" ? "Delete last message" : "Apagar ultima mensagem"}
              aria-label={settings.locale === "en-US" ? "Delete last message" : "Apagar ultima mensagem"}
              disabled={booting || sending || deletingThread || deletingMessage || !activeThreadId || !hasDeletableMessage}
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                ignoreAsync(handleDeleteThread());
              }}
              className="icon-btn text-rose-600"
              title={settings.locale === "en-US" ? "Delete conversation" : "Apagar conversa"}
              aria-label={settings.locale === "en-US" ? "Delete conversation" : "Apagar conversa"}
              disabled={booting || sending || deletingThread || deletingMessage || !activeThreadId}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <AIChatBox
            messages={messages}
            onSendMessage={(value) => {
              ignoreAsync(handleSendMessage(value));
            }}
            isLoading={booting || sending}
            placeholder={t("chat.placeholder")}
            className="rounded-none border-none shadow-none"
            height={isMobile ? "calc(100dvh - 9.6rem)" : "430px"}
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
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`fixed bottom-4 right-4 z-50 items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-xl transition hover:-translate-y-0.5 ${
          open ? "hidden" : "inline-flex"
        }`}
        aria-label={t("chat.launcher")}
      >
        <MessageSquareText size={18} />
        <span className="text-sm font-semibold">{t("chat.launcher")}</span>
      </button>
    </>
  );
}
