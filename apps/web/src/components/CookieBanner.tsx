import { useEffect, useState } from "react";
import { sentimentApi } from "@/lib/api";

const CONSENT_STORAGE_KEY = "sentimentoia_consent";

export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  accepted: boolean;
};

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `consent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    setVisible(!stored);
  }, []);

  async function saveConsent(analytics: boolean, marketing: boolean) {
    const consent: ConsentState = {
      analytics,
      marketing,
      accepted: true,
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);

    try {
      await sentimentApi.privacyConsent({
        session_id: createSessionId(),
        analytics,
        marketing,
      });
    } catch {
      // Falha silenciosa por requisito.
    }
  }

  if (!visible) return null;

  const privacyPolicyUrl = String(import.meta.env.VITE_PRIVACY_POLICY_URL || "/api/privacy/policy");

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Preferências de cookies"
        className="container py-3 sm:py-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-muted-foreground">
            Utilizamos cookies essenciais, analíticos e de marketing para melhorar sua experiência em conformidade com a
            LGPD (Lei 13.709/2018). Consulte a{" "}
            <a href={privacyPolicyUrl} className="text-link" target="_blank" rel="noreferrer">
              Política de Privacidade
            </a>
            .
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => void saveConsent(false, false)}
              className="secondary-btn min-h-[44px]"
              aria-label="Aceitar somente cookies essenciais"
            >
              Somente essenciais
            </button>
            <button
              type="button"
              onClick={() => void saveConsent(true, false)}
              className="secondary-btn min-h-[44px]"
              aria-label="Aceitar cookies analíticos"
            >
              Aceitar analíticos
            </button>
            <button
              type="button"
              onClick={() => void saveConsent(true, true)}
              className="primary-btn min-h-[44px]"
              aria-label="Aceitar todos os cookies"
            >
              Aceitar todos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
