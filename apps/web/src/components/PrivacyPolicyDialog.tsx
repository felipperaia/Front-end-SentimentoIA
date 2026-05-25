import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { CookieConsentPreferences } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

export const DEFAULT_COOKIE_PREFERENCES: CookieConsentPreferences = {
  cookies_estritamente_necessarios: true,
  cookies_analiticos: false,
  cookies_personalizacao: false,
  cookies_treinamento_ia: false,
};

type PrivacyPolicyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPreferences?: Partial<CookieConsentPreferences>;
  saving?: boolean;
  onSave: (preferences: CookieConsentPreferences) => void | Promise<void>;
};

function normalizePreferences(
  input?: Partial<CookieConsentPreferences>
): CookieConsentPreferences {
  return {
    cookies_estritamente_necessarios: true,
    cookies_analiticos: Boolean(input?.cookies_analiticos),
    cookies_personalizacao: Boolean(input?.cookies_personalizacao),
    cookies_treinamento_ia: Boolean(input?.cookies_treinamento_ia),
  };
}

export function PrivacyPolicyDialog({
  open,
  onOpenChange,
  initialPreferences,
  saving = false,
  onSave,
}: Readonly<PrivacyPolicyDialogProps>) {
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(
    normalizePreferences(initialPreferences)
  );

  useEffect(() => {
    if (!open) return;
    setPreferences(normalizePreferences(initialPreferences));
  }, [initialPreferences, open]);

  const preferenceRows = useMemo(
    () => [
      {
        key: "cookies_estritamente_necessarios" as const,
        label: "Cookies estritamente necessarios",
        description:
          "Mantem autenticacao, seguranca da sessao e funcionamento basico da plataforma.",
        disabled: true,
      },
      {
        key: "cookies_analiticos" as const,
        label: "Cookies analiticos",
        description:
          "Ajudam a medir uso da aplicacao para melhorar performance e usabilidade.",
      },
      {
        key: "cookies_personalizacao" as const,
        label: "Cookies de personalizacao",
        description:
          "Permitem adaptar experiencia, atalhos e preferencias de exibicao.",
      },
      {
        key: "cookies_treinamento_ia" as const,
        label: "Cookies para treinamento de IA",
        description:
          "Permitem uso de metadados anonimizados para melhoria de modelos de IA.",
      },
    ],
    []
  );

  async function handleSave() {
    await onSave(preferences);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Politicas de privacidade e cookies</DialogTitle>
          <DialogDescription>
            Revise como os dados sao tratados e escolha suas preferencias de
            consentimento de cookies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="max-h-56 space-y-3 overflow-y-auto rounded-md border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            <p>
              A Sentimento AI processa dados para autenticacao, seguranca,
              analise de reputacao e geracao de insights. O tratamento respeita
              os principios da LGPD, com minimizacao, finalidade e seguranca.
            </p>
            <p>
              Cookies estritamente necessarios sao obrigatorios para manter
              sessao autenticada e recursos essenciais. Os demais cookies sao
              opcionais e podem ser ajustados a qualquer momento.
            </p>
            <p>
              Para solicitacoes de acesso, correcao ou exclusao de dados,
              utilize as opcoes de gerenciamento na area de configuracoes da
              conta.
            </p>
          </div>

          <div className="space-y-3">
            {preferenceRows.map((row) => {
              const checked = preferences[row.key];
              return (
                <label
                  key={row.key}
                  className="flex items-start gap-3 rounded-md border border-border/70 bg-background/70 p-3"
                >
                  <Checkbox
                    checked={checked}
                    disabled={row.disabled || saving}
                    onCheckedChange={(nextValue) => {
                      if (row.disabled) return;
                      setPreferences((current) => ({
                        ...current,
                        [row.key]: Boolean(nextValue),
                      }));
                    }}
                    aria-label={row.label}
                    className="mt-0.5"
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-foreground">
                      {row.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {row.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Fechar
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar preferencias"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
