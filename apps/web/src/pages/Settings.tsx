import { AppShell } from "@/components/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { authApi, sentimentApi, type AppTheme } from "@/lib/api";
import { AlertCircle, Database, Save, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ProfileDraft = {
  name: string;
  username: string;
  email: string;
};

const DELETE_CONFIRM_TEXT = "ENCERRAR CONTA";

const SEED_EXAMPLE = {
  company_name: "Acme Corp",
  company_slug: "acme-corp",
  period_label: "Ultimos 30 dias",
  mentions: [
    {
      source: "google",
      sentiment: "negativo",
      urgency: "high",
      text: "O atendimento demorou muito para responder.",
      aspect: "atendimento",
      date: "2025-02-10",
    },
    {
      source: "reclameaqui",
      sentiment: "positivo",
      urgency: "low",
      text: "Equipe resolveu meu problema no mesmo dia.",
      aspect: "resolucao",
      date: "2025-02-14",
    },
  ],
};

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/[._-]{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);
}

function usernameFromEmail(email: string) {
  return normalizeUsername((email || "").split("@", 1)[0] || "usuario");
}

export default function SettingsPage() {
  const { resetToDefaults, settings, loading, saving, refreshSettings, saveSettings, t } = useAppSettings();

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: "",
    username: "",
    email: "",
  });
  const [savedProfile, setSavedProfile] = useState({ name: "", username: "" });
  const [profileLoading, setProfileLoading] = useState(true);

  const [themeDraft, setThemeDraft] = useState<AppTheme>(settings.theme);
  const [thresholdDraft, setThresholdDraft] = useState(settings.llm_trigger_min_comments);
  const [savedAppearance, setSavedAppearance] = useState({
    theme: settings.theme,
    threshold: settings.llm_trigger_min_comments,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saveBusy, setSaveBusy] = useState(false);

  const [mfaStatus, setMfaStatus] = useState<{ mfa_enabled: boolean; mfa_verified: boolean } | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaPassword, setMfaPassword] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qr_code: string } | null>(null);

  const [seedJson, setSeedJson] = useState(JSON.stringify(SEED_EXAMPLE, null, 2));
  const [seedBusy, setSeedBusy] = useState(false);

  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    setThemeDraft(settings.theme);
    setThresholdDraft(settings.llm_trigger_min_comments);
    setSavedAppearance({
      theme: settings.theme,
      threshold: settings.llm_trigger_min_comments,
    });
  }, [settings.theme, settings.llm_trigger_min_comments]);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const me = await authApi.me();
      const profile: ProfileDraft = {
        name: (me.name || "").trim(),
        username: normalizeUsername(me.username || usernameFromEmail(me.email || "")),
        email: me.email || "",
      };

      setProfileDraft(profile);
      setSavedProfile({
        name: profile.name,
        username: profile.username,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.profileLoadError"));
    } finally {
      setProfileLoading(false);
    }
  }, [t]);

  const refreshMfaStatus = useCallback(async () => {
    try {
      const status = await authApi.mfaStatus();
      setMfaStatus(status);
    } catch {
      setMfaStatus(null);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    void refreshMfaStatus();
  }, [loadProfile, refreshMfaStatus]);

  const updatedAt = useMemo(() => {
    if (!settings.updated_at) return "-";
    const date = new Date(settings.updated_at);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(settings.locale);
  }, [settings.updated_at, settings.locale]);

  const profileDirty =
    profileDraft.name.trim() !== savedProfile.name ||
    profileDraft.username.trim() !== savedProfile.username;

  const appearanceDirty =
    themeDraft !== savedAppearance.theme ||
    thresholdDraft !== savedAppearance.threshold;

  const passwordDirty = Boolean(currentPassword || newPassword || confirmPassword);
  const hasUnsavedChanges = profileDirty || appearanceDirty || passwordDirty;

  async function handleSaveAll() {
    if (passwordDirty) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error(t("settings.fillAllPasswordFields"));
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error(t("settings.passwordMismatch"));
        return;
      }
    }

    setSaveBusy(true);
    try {
      let changed = false;

      if (profileDirty) {
        const updatedUser = await authApi.updateProfile({
          name: profileDraft.name.trim(),
          username: profileDraft.username.trim(),
        });

        const nextProfile: ProfileDraft = {
          name: (updatedUser.name || profileDraft.name).trim(),
          username: normalizeUsername(updatedUser.username || profileDraft.username),
          email: updatedUser.email || profileDraft.email,
        };

        setProfileDraft(nextProfile);
        setSavedProfile({
          name: nextProfile.name,
          username: nextProfile.username,
        });
        changed = true;
      }

      if (appearanceDirty) {
        await saveSettings({
          theme: themeDraft,
          locale: settings.locale,
          llm_trigger_min_comments: thresholdDraft,
        });
        setSavedAppearance({
          theme: themeDraft,
          threshold: thresholdDraft,
        });
        changed = true;
      }

      if (passwordDirty) {
        await authApi.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        changed = true;
      }

      await Promise.all([loadProfile(), refreshSettings(), refreshMfaStatus()]);

      if (changed) {
        toast.success(t("settings.saved"));
      } else {
        toast.success(t("settings.noChanges"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.saveError"));
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleSetupMfa() {
    setMfaError("");
    setMfaBusy(true);
    try {
      const response = await authApi.setupMfa();
      setMfaSetup({ secret: response.secret, qr_code: response.qr_code });
      setMfaCode("");
      toast.success(t("settings.mfaSetupReady"));
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : t("settings.mfaSetupError"));
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleEnableMfa() {
    if (mfaCode.length !== 6) {
      setMfaError(t("mfa.codeLength"));
      return;
    }

    setMfaError("");
    setMfaBusy(true);
    try {
      await authApi.enableMfa({ code: mfaCode });
      setMfaSetup(null);
      setMfaCode("");
      await refreshMfaStatus();
      toast.success(t("settings.mfaEnabledSuccess"));
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : t("settings.mfaEnableError"));
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleDisableMfa() {
    if (!mfaPassword) {
      setMfaError(t("settings.mfaDisablePasswordRequired"));
      return;
    }

    setMfaError("");
    setMfaBusy(true);
    try {
      await authApi.disableMfa({ password: mfaPassword });
      setMfaPassword("");
      setMfaSetup(null);
      setMfaCode("");
      await refreshMfaStatus();
      toast.success(t("settings.mfaDisabledSuccess"));
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : t("settings.mfaDisableError"));
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleSeedData() {
    setSeedBusy(true);
    try {
      const parsed = JSON.parse(seedJson);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        toast.error("O JSON de seed deve ser um objeto no formato esperado.");
        return;
      }

      await sentimentApi.seedDemoData(parsed as Record<string, unknown>);
      toast.success("Seeds enviados com sucesso.");
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error("JSON invalido. Revise o conteudo antes de enviar.");
      } else {
        toast.error(err instanceof Error ? err.message : "Falha ao executar seeds.");
      }
    } finally {
      setSeedBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmInput.trim().toUpperCase() !== DELETE_CONFIRM_TEXT) {
      toast.error(`Digite exatamente "${DELETE_CONFIRM_TEXT}" para confirmar.`);
      return;
    }

    setDeleteBusy(true);
    try {
      await authApi.deleteAccount();
      resetToDefaults();
      await authApi.logout();
      toast.success("Conta encerrada com sucesso.");
      globalThis.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao encerrar conta.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <AppShell
      title={t("settings.title")}
      subtitle="Ajustes de perfil, preferencias, seguranca, seeds e controle de conta."
      actions={
        <button
          type="button"
          className="primary-btn"
          disabled={!hasUnsavedChanges || loading || profileLoading || saveBusy || saving}
          onClick={handleSaveAll}
        >
          <Save size={16} />
          <span>{saveBusy || saving ? t("common.saving") : t("settings.saveAll")}</span>
        </button>
      }
    >
      <section className="mb-5 app-panel p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <a href="#profile" className="secondary-btn">Perfil</a>
          <a href="#appearance" className="secondary-btn">Aparencia</a>
          <a href="#security" className="secondary-btn">Seguranca</a>
          <a href="#mfa" className="secondary-btn">MFA</a>
          <a href="#seeds" className="secondary-btn">Seeds</a>
          <a href="#danger-zone" className="secondary-btn text-rose-600">Danger Zone</a>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {hasUnsavedChanges ? t("settings.unsavedChanges") : t("settings.noPendingChanges")}
        </p>
      </section>

      <section className="mb-5 app-panel p-6">
        <h3 className="text-lg font-semibold">{t("common.status")}</h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">{t("settings.activeTheme")}</dt>
            <dd className="font-medium">{themeDraft === "dark" ? t("theme.dark") : t("theme.light")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("settings.currentThreshold")}</dt>
            <dd className="font-medium">{thresholdDraft}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("settings.lastUpdate")}</dt>
            <dd className="font-medium">{updatedAt}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("settings.username")}</dt>
            <dd className="font-medium">{profileDraft.username || "-"}</dd>
          </div>
        </dl>
      </section>

      <section id="profile" className="mb-5 app-panel p-6 md:p-7">
        <h2 className="panel-title">{t("settings.profileTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.profileSubtitle")}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="settings-name">{t("common.name")}</label>
            <input
              id="settings-name"
              type="text"
              className="field-input"
              value={profileDraft.name}
              onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
              disabled={loading || profileLoading || saveBusy || saving}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="settings-username">{t("settings.username")}</label>
            <input
              id="settings-username"
              type="text"
              className="field-input"
              value={profileDraft.username}
              onChange={(event) =>
                setProfileDraft((current) => ({
                  ...current,
                  username: normalizeUsername(event.target.value),
                }))
              }
              disabled={loading || profileLoading || saveBusy || saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="field-label" htmlFor="settings-email">{t("common.email")}</label>
            <input id="settings-email" type="email" className="field-input" value={profileDraft.email} readOnly disabled />
            <p className="mt-2 text-xs text-muted-foreground">{t("settings.emailReadonly")}</p>
          </div>
        </div>
      </section>

      <section id="appearance" className="mb-5 app-panel p-6 md:p-7">
        <h2 className="panel-title">{t("settings.appearanceTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.appearanceSubtitle")}</p>

        <div className="mt-5 space-y-5">
          <div className="rounded-xl border border-border/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{t("settings.darkMode")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("settings.darkModeHelp")}</p>
              </div>
              <Switch
                checked={themeDraft === "dark"}
                onCheckedChange={(checked) => setThemeDraft(checked ? "dark" : "light")}
                disabled={loading || saveBusy || saving}
                aria-label={t("settings.darkMode")}
              />
            </div>
          </div>

          <div>
            <label className="field-label">{t("settings.threshold")}</label>
            <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_120px] md:items-center">
              <input
                type="range"
                min={1}
                max={500}
                value={Math.min(thresholdDraft, 500)}
                onChange={(event) =>
                  setThresholdDraft(Math.max(1, Math.min(10000, Number(event.target.value || 1))))
                }
                className="accent-[color:var(--brand)]"
                disabled={loading || saveBusy || saving}
              />
              <input
                type="number"
                min={1}
                max={10000}
                value={thresholdDraft}
                onChange={(event) =>
                  setThresholdDraft(Math.max(1, Math.min(10000, Number(event.target.value || 1))))
                }
                className="field-input"
                disabled={loading || saveBusy || saving}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t("settings.thresholdHelp")}</p>
          </div>
        </div>
      </section>

      <section id="security" className="mb-5 app-panel p-6 md:p-7">
        <h2 className="panel-title">{t("settings.securityTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.securitySubtitle")}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="settings-current-password">
              {t("settings.currentPassword")}
            </label>
            <input
              id="settings-current-password"
              type="password"
              className="field-input"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={loading || saveBusy || saving}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="settings-new-password">{t("settings.newPassword")}</label>
            <input
              id="settings-new-password"
              type="password"
              className="field-input"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={loading || saveBusy || saving}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="settings-confirm-password">
              {t("settings.confirmNewPassword")}
            </label>
            <input
              id="settings-confirm-password"
              type="password"
              className="field-input"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={loading || saveBusy || saving}
            />
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{t("settings.passwordHelp")}</p>
      </section>

      <section id="mfa" className="mb-5 app-panel p-6 md:p-7">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="panel-title">{t("settings.mfaTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("settings.mfaSubtitle")}</p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              mfaStatus?.mfa_enabled
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100"
            }`}
          >
            {mfaStatus?.mfa_enabled ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
            {mfaStatus?.mfa_enabled ? t("settings.mfaEnabled") : t("settings.mfaDisabled")}
          </span>
        </header>

        {mfaError ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{mfaError}</span>
            </div>
          </div>
        ) : null}

        {mfaStatus?.mfa_enabled ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{t("settings.mfaDisableHelp")}</p>
            <div className="max-w-sm">
              <label className="field-label" htmlFor="settings-mfa-disable-password">
                {t("common.password")}
              </label>
              <input
                id="settings-mfa-disable-password"
                type="password"
                value={mfaPassword}
                onChange={(event) => setMfaPassword(event.target.value)}
                className="field-input"
                placeholder={t("settings.mfaDisablePasswordPlaceholder")}
                autoComplete="current-password"
                disabled={mfaBusy}
              />
            </div>
            <button
              type="button"
              onClick={handleDisableMfa}
              disabled={mfaBusy}
              className="secondary-btn text-rose-600"
            >
              {mfaBusy ? t("common.processing") : t("settings.mfaDisableButton")}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {mfaSetup ? (
              <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
                <div className="rounded-lg border border-border/70 bg-background p-3">
                  <img src={mfaSetup.qr_code} alt={t("settings.mfaQrAlt")} loading="lazy" className="mx-auto h-44 w-44" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t("settings.mfaSetupHelp")}</p>
                  <div>
                    <label className="field-label">{t("settings.mfaSecret")}</label>
                    <input readOnly value={mfaSetup.secret} className="field-input font-mono text-xs" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="settings-mfa-code">
                      {t("mfa.codeLabel")}
                    </label>
                    <input
                      id="settings-mfa-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(event) => setMfaCode(event.target.value.replaceAll(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="field-input text-center"
                      disabled={mfaBusy}
                    />
                  </div>
                  <button type="button" onClick={handleEnableMfa} disabled={mfaBusy} className="primary-btn">
                    {mfaBusy ? t("common.processing") : t("settings.mfaEnableButton")}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={handleSetupMfa} disabled={mfaBusy} className="secondary-btn">
                {mfaBusy ? t("common.processing") : t("settings.mfaSetupButton")}
              </button>
            )}
          </div>
        )}
      </section>

      <section id="seeds" className="mb-5 app-panel p-6 md:p-7">
        <header className="flex flex-wrap items-center gap-2">
          <Database size={18} className="text-[color:var(--brand)]" />
          <h2 className="panel-title">Seeds de dados</h2>
        </header>
        <p className="mt-2 text-sm text-muted-foreground">
          Envie um payload JSON para popular dados de exemplo no dashboard e nas analises.
        </p>

        <div className="mt-4 space-y-3">
          <textarea
            className="field-input min-h-[220px] font-mono text-xs"
            value={seedJson}
            onChange={(event) => setSeedJson(event.target.value)}
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setSeedJson(JSON.stringify(SEED_EXAMPLE, null, 2))}
            >
              Preencher exemplo de JSON
            </button>
            <button
              type="button"
              className="primary-btn"
              disabled={seedBusy}
              onClick={() => void handleSeedData()}
            >
              {seedBusy ? t("common.processing") : "Executar seed"}
            </button>
          </div>
        </div>
      </section>

      <section id="danger-zone" className="app-panel border border-rose-300/70 bg-rose-50/30 p-6 md:p-7 dark:border-rose-900/60 dark:bg-rose-950/20">
        <header className="flex items-center gap-2">
          <Trash2 size={18} className="text-rose-600" />
          <h2 className="panel-title text-rose-700 dark:text-rose-300">Danger Zone</h2>
        </header>
        <p className="mt-2 max-w-2xl text-sm text-rose-800/90 dark:text-rose-200/90">
          Ao encerrar a conta, todos os seus dados serao removidos permanentemente e o acesso sera encerrado.
        </p>

        <div className="mt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="secondary-btn border-rose-300 text-rose-700 hover:bg-rose-100">
                Encerrar conta
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar encerramento da conta</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acao e irreversivel. Para continuar, digite <strong>{DELETE_CONFIRM_TEXT}</strong> no campo abaixo.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div>
                <label className="field-label" htmlFor="delete-account-confirm-input">Confirmacao textual</label>
                <input
                  id="delete-account-confirm-input"
                  type="text"
                  className="field-input"
                  value={deleteConfirmInput}
                  onChange={(event) => setDeleteConfirmInput(event.target.value)}
                  placeholder={DELETE_CONFIRM_TEXT}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteBusy}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault();
                    void handleDeleteAccount();
                  }}
                  disabled={deleteBusy || deleteConfirmInput.trim().toUpperCase() !== DELETE_CONFIRM_TEXT}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  {deleteBusy ? t("common.processing") : "Confirmar encerramento"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </AppShell>
  );
}

