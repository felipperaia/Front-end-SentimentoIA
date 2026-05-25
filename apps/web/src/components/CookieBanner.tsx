import { useEffect, useState } from "react";
import {
  sentimentApi,
  type CookieConsentPreferences,
} from "@/lib/api";
import {
  DEFAULT_COOKIE_PREFERENCES,
  PrivacyPolicyDialog,
} from "@/components/PrivacyPolicyDialog";

const CONSENT_STORAGE_KEY = "sentimentoia_consent";

export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  accepted: boolean;
  preferences: CookieConsentPreferences;
};

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `consent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [storedPreferences, setStoredPreferences] = useState<CookieConsentPreferences>(
    DEFAULT_COOKIE_PREFERENCES
  );

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    setVisible(!stored);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<ConsentState>;
        setStoredPreferences({
          cookies_estritamente_necessarios: true,
          cookies_analiticos: Boolean(
            parsed.preferences?.cookies_analiticos ?? parsed.analytics
          ),
          cookies_personalizacao: Boolean(
            parsed.preferences?.cookies_personalizacao ?? parsed.marketing
          ),
          cookies_treinamento_ia: Boolean(
            parsed.preferences?.cookies_treinamento_ia
          ),
        });
      } catch {
        setStoredPreferences(DEFAULT_COOKIE_PREFERENCES);
      }
    }
  }, []);

  async function saveConsent(preferences: CookieConsentPreferences) {
    const analytics = Boolean(preferences.cookies_analiticos);
    const marketing = Boolean(
      preferences.cookies_personalizacao || preferences.cookies_treinamento_ia
    );

    const consent: ConsentState = {
      analytics,
      marketing,
      accepted: true,
      preferences,
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
    setStoredPreferences(preferences);

    try {
      await sentimentApi.privacyConsent({
        session_id: createSessionId(),
        analytics,
        marketing,
        accepted: true,
        consent: preferences,
      });
    } catch {
      // Falha silenciosa por requisito.
    }
  }

  async function handleSaveFromDialog(preferences: CookieConsentPreferences) {
    setSavingPreferences(true);
    try {
      await saveConsent(preferences);
      setDialogOpen(false);
    } finally {
      setSavingPreferences(false);
    }
  }

  if (!visible) return null;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preferências de cookies"
          className="container py-3 sm:py-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">
              Utilizamos cookies essenciais e opcionais para melhorar sua
              experiência em conformidade com a LGPD (Lei 13.709/2018).
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="secondary-btn min-h-[44px]"
                aria-label="Ver políticas de privacidade"
              >
                Ver políticas de privacidade
              </button>
              <button
                type="button"
                onClick={() =>
                  void saveConsent({
                    cookies_estritamente_necessarios: true,
                    cookies_analiticos: false,
                    cookies_personalizacao: false,
                    cookies_treinamento_ia: false,
                  })
                }
                className="secondary-btn min-h-[44px]"
                aria-label="Aceitar somente cookies essenciais"
              >
                Somente essenciais
              </button>
              <button
                type="button"
                onClick={() =>
                  void saveConsent({
                    cookies_estritamente_necessarios: true,
                    cookies_analiticos: true,
                    cookies_personalizacao: true,
                    cookies_treinamento_ia: true,
                  })
                }
                className="primary-btn min-h-[44px]"
                aria-label="Aceitar todos os cookies"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </div>
      </div>

      <PrivacyPolicyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialPreferences={storedPreferences}
        saving={savingPreferences}
        onSave={handleSaveFromDialog}
      />
    </>
  );
}
