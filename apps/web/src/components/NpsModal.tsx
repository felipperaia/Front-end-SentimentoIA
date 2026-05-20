import { useCallback, useEffect, useRef, useState } from "react";
import { sentimentApi, getToken } from "@/lib/api";
import { MessageSquare, Star, X } from "lucide-react";
import { toast } from "sonner";

const SEARCH_COMPLETED_EVENT = "sentimentoia:search-completed";
const NPS_HANDLED_KEY = "sentimentoia_nps_handled";
const NPS_SESSION_ID_KEY = "sentimentoia_nps_session_id";
const NPS_ENABLED = String(import.meta.env.VITE_ENABLE_NPS ?? "true") !== "false";

function currentRoutePath() {
  if (globalThis.window === undefined) return undefined;
  return globalThis.window.location.pathname || undefined;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateNpsSessionId() {
  const current = sessionStorage.getItem(NPS_SESSION_ID_KEY);
  if (current) return current;
  const next = createSessionId();
  sessionStorage.setItem(NPS_SESSION_ID_KEY, next);
  return next;
}

function hasHandledNpsInSession() {
  return sessionStorage.getItem(NPS_HANDLED_KEY) === "1";
}

function markNpsAsHandled() {
  sessionStorage.setItem(NPS_HANDLED_KEY, "1");
}

export default function NpsModal() {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const delayedOpenRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkingRef = useRef(false);

  const checkAndOpenNps = useCallback(async () => {
    if (!NPS_ENABLED) return;
    if (!getToken()) return;
    if (hasHandledNpsInSession()) return;
    if (visible) return;
    if (checkingRef.current) return;

    checkingRef.current = true;

    const nextSessionId = getOrCreateNpsSessionId();
    setSessionId(nextSessionId);

    try {
      const { should_show, trigger } = await sentimentApi.npsCheck(nextSessionId);
      if (!should_show) return;
      if (trigger && trigger !== "post_search") return;

      if (delayedOpenRef.current !== null) {
        globalThis.clearTimeout(delayedOpenRef.current);
      }

      delayedOpenRef.current = globalThis.setTimeout(() => {
        setVisible(true);
      }, 3000);
    } catch {
      // Nao interrompe a navegação; apenas evita abertura indevida.
    } finally {
      checkingRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    const onSearchCompleted: EventListener = (event: Event) => {
      const detail = (event as CustomEvent<{ searchId?: string; mentionsCount?: number; total?: number }>).detail;
      if (!detail?.searchId) return;
      checkAndOpenNps().catch(() => undefined);
    };

    globalThis.addEventListener(SEARCH_COMPLETED_EVENT, onSearchCompleted);
    return () => {
      globalThis.removeEventListener(SEARCH_COMPLETED_EVENT, onSearchCompleted);
      if (delayedOpenRef.current !== null) {
        globalThis.clearTimeout(delayedOpenRef.current);
      }
    };
  }, [checkAndOpenNps]);

  async function handleSubmit() {
    if (score === null || sending || !sessionId) return;

    setSending(true);
    try {
      await sentimentApi.npsSubmit({
        session_id: sessionId,
        score,
        comment: comment.trim() || undefined,
        module_key: "search",
        route: currentRoutePath(),
      });
      markNpsAsHandled();
      sessionStorage.removeItem(NPS_SESSION_ID_KEY);
      setVisible(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel enviar sua avaliacao agora. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  async function handleDismiss() {
    if (sessionId) {
      try {
        await sentimentApi.npsDismiss({
          session_id: sessionId,
          module_key: "search",
          route: currentRoutePath(),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Nao foi possivel registrar o adiamento agora. Tente novamente.");
        return;
      }
    }

    markNpsAsHandled();
    sessionStorage.removeItem(NPS_SESSION_ID_KEY);
    setVisible(false);
  }

  if (!NPS_ENABLED) return null;
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <dialog
        open
        aria-labelledby="nps-title"
        className="app-panel relative w-full max-w-md p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => void handleDismiss()}
          aria-label="Fechar pesquisa NPS"
          className="icon-btn absolute right-3 top-3"
        >
          <X size={18} />
        </button>

        <div className="mb-4 pr-10">
          <h3 id="nps-title" className="text-base font-semibold sm:text-lg">
            Como você avalia o SentimentoIA?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            De 0 a 10, qual a chance de recomendar?
          </p>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, value) => {
            const selected = score === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setScore(value)}
                aria-label={`Selecionar nota ${value}`}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border text-sm font-medium transition ${
                  selected
                    ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-white"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Nada provável</span>
          <span>Muito provável</span>
        </div>

        <div className="mb-4">
          <label htmlFor="nps-comment" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare size={14} /> Comentário (opcional)
          </label>
          <textarea
            id="nps-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="O que podemos melhorar?"
            rows={3}
            className="field-input mt-0 resize-none"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void handleDismiss()}
            className="secondary-btn min-h-[44px]"
            aria-label="Responder depois"
          >
            Depois
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={score === null || sending}
            className="primary-btn min-h-[44px]"
            aria-label="Enviar resposta NPS"
          >
            <Star size={14} />
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
