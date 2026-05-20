import { AppShell } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { authApi, type AppTheme } from "@/lib/api";
import { AlertCircle, Save, ShieldCheck, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ProfileDraft = {
  name: string;
  username: string;
  email: string;
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
  const {
    settings,
    loading,
    saving,
    refreshSettings,
    saveSettings,
    t,
  } = useAppSettings();

  const [activeTab, setActiveTab] = useState("profile");
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
        setActiveTab("security");
        toast.error(t("settings.fillAllPasswordFields"));
        return;
      }
      if (newPassword !== confirmPassword) {
        setActiveTab("security");
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

  return (
    <AppShell title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="space-y-5">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <article className="app-panel p-6 md:p-7">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="profile">{t("settings.profileTab")}</TabsTrigger>
                <TabsTrigger value="appearance">{t("settings.appearanceTab")}</TabsTrigger>
                <TabsTrigger value="security">{t("settings.securityTab")}</TabsTrigger>
                <TabsTrigger value="mfa">{t("settings.mfaTab")}</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-4">
                <div className="space-y-5">
                  <header>
                    <h3 className="text-lg font-semibold">{t("settings.profileTitle")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t("settings.profileSubtitle")}</p>
                  </header>

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

                  <div>
                    <label className="field-label" htmlFor="settings-email">{t("common.email")}</label>
                    <input
                      id="settings-email"
                      type="email"
                      className="field-input"
                      value={profileDraft.email}
                      readOnly
                      disabled
                    />
                    <p className="mt-2 text-xs text-muted-foreground">{t("settings.emailReadonly")}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="mt-4">
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-semibold">{t("settings.appearanceTitle")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t("settings.appearanceSubtitle")}</p>
                  </header>

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
              </TabsContent>

              <TabsContent value="security" className="mt-4">
                <div className="space-y-5">
                  <header>
                    <h3 className="text-lg font-semibold">{t("settings.securityTitle")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t("settings.securitySubtitle")}</p>
                  </header>

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

                  <p className="text-sm text-muted-foreground">{t("settings.passwordHelp")}</p>
                </div>
              </TabsContent>

              <TabsContent value="mfa" className="mt-4">
                <div className="space-y-4">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{t("settings.mfaTitle")}</h3>
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
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{mfaError}</span>
                      </div>
                    </div>
                  ) : null}

                  {!mfaStatus?.mfa_enabled ? (
                    <div className="space-y-4">
                      {!mfaSetup ? (
                        <button
                          type="button"
                          onClick={handleSetupMfa}
                          disabled={mfaBusy}
                          className="secondary-btn"
                        >
                          {mfaBusy ? t("common.processing") : t("settings.mfaSetupButton")}
                        </button>
                      ) : (
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
                            <button
                              type="button"
                              onClick={handleEnableMfa}
                              disabled={mfaBusy}
                              className="primary-btn"
                            >
                              {mfaBusy ? t("common.processing") : t("settings.mfaEnableButton")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
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
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </article>

          <aside className="app-panel p-6">
            <h3 className="text-lg font-semibold">{t("common.status")}</h3>
            <dl className="mt-4 space-y-3 text-sm">
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
          </aside>
        </section>

        <section className="app-panel p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              {hasUnsavedChanges ? t("settings.unsavedChanges") : t("settings.noPendingChanges")}
            </p>
            <button
              type="button"
              className="primary-btn"
              disabled={!hasUnsavedChanges || loading || profileLoading || saveBusy || saving}
              onClick={handleSaveAll}
            >
              <Save size={16} />
              <span>{saveBusy || saving ? t("common.saving") : t("settings.saveAll")}</span>
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
