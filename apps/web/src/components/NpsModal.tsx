import { useEffect, useState, useCallback } from "react";
import { sentimentApi, getToken } from "@/lib/api";
import { X, Star, MessageSquare } from "lucide-react";

const NPS_SESSION_KEY = "sentimentoia_nps_session";
const NPS_INTERACTIONS_KEY = "sentimentoia_nps_interactions";

function getSessionId(): string {
  let id = sessionStorage.getItem(NPS_SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(NPS_SESSION_KEY, id);
  }
  return id;
}

function getInteractionCount(): number {
  return Number(sessionStorage.getItem(NPS_INTERACTIONS_KEY) || "0");
}

function incrementInteractions(): number {
  const count = getInteractionCount() + 1;
  sessionStorage.setItem(NPS_INTERACTIONS_KEY, String(count));
  return count;
}

const MODULE_MAP: Record<string, string> = {
  "/dashboard": "dashboard",
  "/search": "busca",
  "/analysis": "insights",
  "/reports": "relatorios",
  "/settings": "configuracoes",
};

export default function NpsModal() {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const currentRoute = typeof window !== "undefined" ? window.location.pathname : "/";
  const moduleKey = MODULE_MAP[currentRoute] || "geral";

  const checkNps = useCallback(async () => {
    if (!getToken()) return;
    const count = incrementInteractions();
    if (count < 5) return; // min interactions

    try {
      const { should_show } = await sentimentApi.npsCheck(getSessionId());
      if (should_show) {
        setVisible(true);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkNps, 8000); // check after 8s of page usage
    return () => clearTimeout(timer);
  }, [checkNps]);

  async function handleSubmit() {
    if (score === null || sending) return;
    setSending(true);
    try {
      await sentimentApi.npsSubmit({
        session_id: getSessionId(),
        module_key: moduleKey,
        score,
        comment: comment.trim() || undefined,
        route: currentRoute,
      });
      setSubmitted(true);
      setTimeout(() => setVisible(false), 2000);
    } catch {
      // still close on error
      setVisible(false);
    } finally {
      setSending(false);
    }
  }

  async function handleDismiss() {
    setVisible(false);
    try {
      await sentimentApi.npsDismiss({
        session_id: getSessionId(),
        module_key: moduleKey,
        route: currentRoute,
      });
    } catch {
      // silently ignore
    }
  }

  if (!visible) return null;

  return (
    <div
      id="nps-modal-overlay"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        maxWidth: "380px",
        width: "100%",
      }}
    >
      <div
        className="app-panel"
        style={{
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          borderRadius: "16px",
          position: "relative",
        }}
      >
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "var(--muted-foreground)",
          }}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <Star size={32} style={{ color: "var(--brand)", marginBottom: "8px" }} />
            <p style={{ fontWeight: 600, fontSize: "16px" }}>Obrigado pelo feedback!</p>
            <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginTop: "4px" }}>
              Sua opinião nos ajuda a melhorar.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
                Como você avalia o SentimentoIA?
              </h3>
              <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                De 0 a 10, qual a chance de recomendar?
              </p>
            </div>

            <div style={{ display: "flex", gap: "4px", marginBottom: "12px", flexWrap: "wrap" }}>
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    border: score === i ? "2px solid var(--brand)" : "1px solid var(--border)",
                    background: score === i ? "var(--brand)" : "transparent",
                    color: score === i ? "#fff" : "var(--foreground)",
                    fontWeight: score === i ? 700 : 400,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {i}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "12px" }}>
              <span>Nada provável</span>
              <span>Muito provável</span>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <MessageSquare size={14} style={{ color: "var(--muted-foreground)" }} />
                <label style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                  Comentário (opcional)
                </label>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="O que podemos melhorar?"
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  resize: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={handleDismiss}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--muted-foreground)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Depois
              </button>
              <button
                onClick={handleSubmit}
                disabled={score === null || sending}
                className="primary-btn"
                style={{ padding: "6px 16px", fontSize: "13px" }}
              >
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
