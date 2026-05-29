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
import {
  ApiRequestError,
  authApi,
  sentimentApi,
  type AppTheme,
  type CommitResponse,
  type StagingCommentsResponse,
} from "@/lib/api";
import { Activity, AlertCircle, BellRing, Database, Save, ShieldCheck, ShieldOff, Trash2, Users2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type ProfileDraft = {
  name: string;
  username: string;
  email: string;
};

const DELETE_CONFIRM_TEXT = "ENCERRAR CONTA";

type IngestValidationError = {
  index: number;
  field?: string;
  message: string;
};

type IngestSummary = {
  parsedCount: number;
  sentCount: number;
  insertedCount: number;
  duplicateCount: number;
  batchId?: string;
  status?: string;
  fileName?: string;
  backendRejectedCount?: number;
  backendRejectedPreview?: string[];
  errors: IngestValidationError[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function pickFirstString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value) return value;
  }
  return "";
}

function resolveItemArray(parsed: unknown): { items: unknown[]; shared: Record<string, unknown> } {
  if (Array.isArray(parsed)) {
    return {
      items: parsed,
      shared: {},
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      items: [],
      shared: {},
    };
  }

  const mentions = parsed.mentions;
  if (Array.isArray(mentions)) {
    const { mentions: _, ...shared } = parsed;
    return {
      items: mentions,
      shared,
    };
  }

  const comments = parsed.comments;
  if (Array.isArray(comments)) {
    const { comments: _, ...shared } = parsed;
    return {
      items: comments,
      shared,
    };
  }

  return {
    items: [parsed],
    shared: {},
  };
}

function buildNormalizedIngestionItem(
  item: Record<string, unknown>,
  shared: Record<string, unknown>
): Record<string, unknown> {
  const source = pickFirstString(item, ["source"]) || pickFirstString(shared, ["source"]);
  const text = pickFirstString(item, ["text", "title", "content", "body"]);
  const company_name = pickFirstString(item, ["company_name"]) || pickFirstString(shared, ["company_name"]);
  const company_slug = pickFirstString(item, ["company_slug"]) || pickFirstString(shared, ["company_slug"]);
  const query = pickFirstString(item, ["query"]) || pickFirstString(shared, ["query"]);
  const entity = pickFirstString(item, ["entity"]) || pickFirstString(shared, ["entity"]);
  const author = pickFirstString(item, ["author"]) || pickFirstString(shared, ["author"]);
  const published_at = pickFirstString(item, ["published_at", "date", "created_at"]) || pickFirstString(shared, ["published_at"]);
  const url = pickFirstString(item, ["url"]) || pickFirstString(shared, ["url"]);
  const canonical_url =
    pickFirstString(item, ["canonical_url"]) || pickFirstString(shared, ["canonical_url"]);
  const external_id = pickFirstString(item, ["external_id"]) || pickFirstString(shared, ["external_id"]);
  const source_item_id =
    pickFirstString(item, ["source_item_id"]) || pickFirstString(shared, ["source_item_id"]);
  const ratingValue = item.rating ?? shared.rating;
  const rating =
    typeof ratingValue === "number" && Number.isFinite(ratingValue) ? ratingValue : undefined;

  const normalized: Record<string, unknown> = {
    source,
    text,
    author: author || undefined,
    published_at: published_at || undefined,
    url: url || undefined,
    canonical_url: canonical_url || undefined,
    query: query || undefined,
    entity: entity || undefined,
    company_name: company_name || undefined,
    company_slug: company_slug || undefined,
    external_id: external_id || undefined,
    source_item_id: source_item_id || undefined,
    rating,
    raw: isPlainObject(item) ? item : { input: item },
  };

  return normalized;
}

function prepareIngestPayload(parsed: unknown): {
  payload: Record<string, unknown>[];
  itemCount: number;
  validationErrors: IngestValidationError[];
} {
  const { items, shared } = resolveItemArray(parsed);
  const validationErrors: IngestValidationError[] = [];
  const normalizedItems: Record<string, unknown>[] = [];

  if (!Array.isArray(items) || items.length === 0) {
    return {
      payload: [],
      itemCount: 0,
      validationErrors: [
        {
          index: -1,
          message: "JSON deve ser um array de itens, ou objeto com campo mentions/comments.",
        },
      ],
    };
  }

  items.forEach((rawItem, index) => {
    if (!isPlainObject(rawItem)) {
      validationErrors.push({
        index,
        message: "Cada item deve ser um objeto JSON.",
      });
      return;
    }

    const normalized = buildNormalizedIngestionItem(rawItem, shared);
    const source = typeof normalized.source === "string" ? normalized.source.trim() : "";
    const text = typeof normalized.text === "string" ? normalized.text.trim() : "";
    const hasCompanyReference = [
      normalized.company_slug,
      normalized.company_name,
      normalized.query,
      normalized.entity,
    ].some((value) => typeof value === "string" && value.trim().length > 0);

    if (!source) {
      validationErrors.push({
        index,
        field: "source",
        message: "Campo source obrigatorio.",
      });
    }

    if (!text) {
      validationErrors.push({
        index,
        field: "text",
        message: "Campo text (ou title/content/body) obrigatorio.",
      });
    }

    if (!hasCompanyReference) {
      validationErrors.push({
        index,
        field: "company",
        message: "Informe company_slug, company_name, query ou entity.",
      });
    }

    normalizedItems.push(normalized);
  });

  return {
    payload: normalizedItems,
    itemCount: items.length,
    validationErrors,
  };
}

function resolveApiRequestErrorDetails(error: ApiRequestError): string {
  const status = typeof error.status === "number" ? `HTTP ${error.status}` : "HTTP ?";
  const path = error.path || "unknown";
  const data = error.data;
  if (data && typeof data === "object") {
    const detail = (data as Record<string, unknown>).detail;
    if (detail && typeof detail === "object") {
      const message = (detail as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim()) {
        return `${status} ${path}: ${message.trim()}`;
      }
      const items = (detail as Record<string, unknown>).items;
      if (Array.isArray(items) && items.length > 0) {
        const first = items[0];
        if (first && typeof first === "object") {
          const errors = (first as Record<string, unknown>).errors;
          if (Array.isArray(errors) && errors.length > 0) {
            const firstErr = errors[0];
            if (firstErr && typeof firstErr === "object") {
              const msg = (firstErr as Record<string, unknown>).msg;
              if (typeof msg === "string" && msg.trim()) {
                return `${status} ${path}: ${msg.trim()}`;
              }
            }
          }
        }
      }
    }
  }
  return `${status} ${path}: ${error.message}`;
}

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
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

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

  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestFileName, setIngestFileName] = useState("");
  const [ingestPayload, setIngestPayload] = useState<Record<string, unknown>[]>([]);
  const [ingestParsedCount, setIngestParsedCount] = useState(0);
  const [ingestSummary, setIngestSummary] = useState<IngestSummary | null>(null);
  const [stagingBusy, setStagingBusy] = useState(false);
  const [stagingPreview, setStagingPreview] = useState<StagingCommentsResponse | null>(null);
  const [commitBusy, setCommitBusy] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);

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

  async function handleIngestFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Selecione um arquivo .json valido.");
      return;
    }

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      const prepared = prepareIngestPayload(parsed);

      setIngestFileName(file.name);
      setIngestPayload(prepared.payload);
      setIngestParsedCount(prepared.itemCount);

      if (prepared.itemCount <= 0 || prepared.validationErrors.length > 0) {
        const errors =
          prepared.validationErrors.length > 0
            ? prepared.validationErrors
            : [{ index: -1, message: "Nenhum item valido encontrado no arquivo." }];
        setIngestSummary({
          parsedCount: prepared.itemCount,
          sentCount: 0,
          insertedCount: 0,
          duplicateCount: 0,
          fileName: file.name,
          errors,
        });
        toast.error(errors[0]?.message || "Arquivo JSON invalido para ingestao.");
        return;
      }

      setIngestSummary(null);
      toast.success(`Arquivo JSON carregado com ${prepared.itemCount} item(ns).`);
    } catch (err) {
      setIngestPayload([]);
      setIngestParsedCount(0);
      setIngestSummary({
        parsedCount: 0,
        sentCount: 0,
        insertedCount: 0,
        duplicateCount: 0,
        fileName: file.name,
        errors: [{ index: -1, message: "JSON invalido. Corrija o arquivo e tente novamente." }],
      });
      toast.error(err instanceof Error ? err.message : "Falha ao ler o arquivo JSON.");
    }
  }

  async function handleIngestData() {
    if (!ingestFileName) {
      toast.error("Selecione um arquivo JSON antes de enviar.");
      return;
    }

    if (ingestPayload.length <= 0 || ingestParsedCount <= 0) {
      toast.error("Arquivo sem itens validos para ingestao.");
      return;
    }

    if (ingestSummary && ingestSummary.errors.length > 0 && ingestSummary.sentCount === 0) {
      toast.error("Corrija os erros do arquivo antes de enviar.");
      return;
    }

    setIngestBusy(true);
    setIngestSummary(null);
    setStagingPreview(null);
    setCommitResult(null);

    try {
      const response = await sentimentApi.ingest(ingestPayload);
      const responseErrors: IngestValidationError[] = response.errors.map((item) => ({
        index: item.index,
        field: item.field,
        message: item.message,
      }));

      setIngestSummary({
        parsedCount: ingestParsedCount,
        sentCount: ingestPayload.length,
        insertedCount: response.inserted ?? 0,
        duplicateCount: response.duplicates ?? 0,
        batchId: response.batch_id,
        status: response.status,
        fileName: ingestFileName,
        backendRejectedCount: response.rejected_count,
        backendRejectedPreview: response.rejected_messages,
        errors: responseErrors,
      });

      if (responseErrors.length > 0) {
        toast.warning(`Ingestao concluida com ${responseErrors.length} erro(s) de item.`);
      } else {
        toast.success(
          `Ingestao concluida: ${response.inserted ?? 0} inserido(s), ${response.duplicates ?? 0} duplicado(s).`
        );
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        console.error("Erro de ingestao", {
          path: err.path,
          status: err.status,
          code: err.code,
          data: err.data,
        });
        toast.error(resolveApiRequestErrorDetails(err));
      } else {
        toast.error(err instanceof Error ? err.message : "Falha ao enviar JSON para ingestao.");
      }
    } finally {
      setIngestBusy(false);
    }
  }

  async function handlePreviewStaging() {
    const batchId = ingestSummary?.batchId;
    if (!batchId) {
      toast.error("Envie um arquivo para ingestao antes de pre-visualizar o staging.");
      return;
    }

    setStagingBusy(true);
    try {
      const preview = await sentimentApi.listStagingComments({ batch_id: batchId, limit: 100 });
      setStagingPreview(preview);
      if (preview.total === 0) {
        toast.info("Nenhum comentario encontrado no staging para este lote.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar o staging.");
    } finally {
      setStagingBusy(false);
    }
  }

  async function handleCommitStaging() {
    const batchId = ingestSummary?.batchId;
    if (!batchId) {
      toast.error("Envie um arquivo para ingestao antes de confirmar a importacao.");
      return;
    }

    setCommitBusy(true);
    try {
      const result = await sentimentApi.commitStaging({ batch_id: batchId });
      setCommitResult(result);
      toast.success(
        `Importacao confirmada: ${result.inserted} registro(s) enviado(s) para producao.`
      );
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(resolveApiRequestErrorDetails(err));
      } else {
        toast.error(err instanceof Error ? err.message : "Falha ao confirmar importacao para producao.");
      }
    } finally {
      setCommitBusy(false);
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
      subtitle="Ajustes de perfil, preferencias, seguranca, ingestao e controle de conta."
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
          <a href="#ingest" className="secondary-btn">Ingestao</a>
          <a href="#workspace-areas" className="secondary-btn">Areas</a>
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

      <section id="workspace-areas" className="mb-5 app-panel p-6 md:p-7">
        <header className="flex flex-wrap items-center gap-2">
          <ShieldCheck size={18} className="text-[color:var(--brand)]" />
          <h2 className="panel-title">Outras areas</h2>
        </header>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesse alertas, central de privacidade e diagnostico do sistema.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/10 p-4 text-left transition-colors hover:bg-muted/30"
            onClick={() => setLocation("/alerts")}
          >
            <BellRing size={18} className="text-[color:var(--brand)]" />
            <span>
              <span className="block text-sm font-medium text-foreground">Alertas</span>
              <span className="block text-xs text-muted-foreground">
                Alertas gerados a partir das mencoes monitoradas.
              </span>
            </span>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/10 p-4 text-left transition-colors hover:bg-muted/30"
            onClick={() => setLocation("/privacy")}
          >
            <ShieldCheck size={18} className="text-[color:var(--brand)]" />
            <span>
              <span className="block text-sm font-medium text-foreground">Privacidade</span>
              <span className="block text-xs text-muted-foreground">
                Politica, direitos LGPD, consentimento e resumo de dados.
              </span>
            </span>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/10 p-4 text-left transition-colors hover:bg-muted/30"
            onClick={() => setLocation("/diagnostics")}
          >
            <Activity size={18} className="text-[color:var(--brand)]" />
            <span>
              <span className="block text-sm font-medium text-foreground">Diagnostico</span>
              <span className="block text-xs text-muted-foreground">
                Disponibilidade da API e estado das integracoes.
              </span>
            </span>
          </button>

          {isAdmin ? (
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/10 p-4 text-left transition-colors hover:bg-muted/30"
              onClick={() => setLocation("/admin")}
            >
              <Users2 size={18} className="text-[color:var(--brand)]" />
              <span>
                <span className="block text-sm font-medium text-foreground">Administracao</span>
                <span className="block text-xs text-muted-foreground">
                  KPIs, usuarios, logs de auditoria e alertas globais.
                </span>
              </span>
            </button>
          ) : null}
        </div>
      </section>

      <section id="ingest" className="mb-5 app-panel p-6 md:p-7">
        <header className="flex flex-wrap items-center gap-2">
          <Database size={18} className="text-[color:var(--brand)]" />
          <h2 className="panel-title">Ingestao de dados JSON</h2>
        </header>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione um arquivo .json para enviar os dados ao banco secundario (staging).
        </p>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <label className="field-label" htmlFor="ingest-file">Arquivo JSON</label>
            <input
              id="ingest-file"
              type="file"
              accept=".json,application/json"
              className="mt-2 block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-[color:var(--brand)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[color:var(--brand-strong)]"
              onChange={(event) => void handleIngestFileChange(event)}
              disabled={ingestBusy}
            />
            {ingestFileName ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Arquivo carregado: {ingestFileName} ({ingestParsedCount} item(ns))
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="primary-btn"
              disabled={ingestBusy || ingestPayload.length <= 0 || !ingestFileName}
              onClick={() => void handleIngestData()}
            >
              {ingestBusy ? t("common.processing") : "Enviar arquivo para ingestao"}
            </button>
          </div>

          {ingestSummary ? (
            <div className="rounded-xl border border-border/70 bg-background p-4">
              <p className="text-sm font-semibold">Resumo da ingestao</p>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                <p>Arquivo: {ingestSummary.fileName || "-"}</p>
                <p>Itens parseados: {ingestSummary.parsedCount}</p>
                <p>Itens enviados: {ingestSummary.sentCount}</p>
                <p>Inseridos: {ingestSummary.insertedCount}</p>
                <p>Duplicados ignorados: {ingestSummary.duplicateCount}</p>
                <p>Batch ID: {ingestSummary.batchId || "-"}</p>
                <p>Status: {ingestSummary.status || "-"}</p>
              </div>

              {typeof ingestSummary.backendRejectedCount === "number" && ingestSummary.backendRejectedCount > 0 ? (
                <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  <p>Itens rejeitados pelo backend: {ingestSummary.backendRejectedCount}</p>
                  {ingestSummary.backendRejectedPreview && ingestSummary.backendRejectedPreview.length > 0 ? (
                    <p className="mt-1">
                      Motivos (amostra): {ingestSummary.backendRejectedPreview.join(" | ")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {ingestSummary.errors.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase text-rose-700 dark:text-rose-300">Erros por indice</p>
                  <ul className="space-y-2 text-sm">
                    {ingestSummary.errors.map((error, index) => (
                      <li
                        key={`${error.index}-${error.field || "global"}-${index}`}
                        className="rounded-lg border border-rose-300 bg-rose-50 p-2 text-rose-800 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200"
                      >
                        <span className="font-semibold">[{error.index >= 0 ? error.index : "global"}]</span>{" "}
                        {error.field ? `${error.field}: ` : ""}
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Sem erros por indice.</p>
              )}
            </div>
          ) : null}

          {ingestSummary?.batchId ? (
            <div className="rounded-xl border border-border/70 bg-muted/10 p-4">
              <p className="text-sm font-semibold">Pre-visualizacao e commit para producao</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Os dados ingeridos ficam no staging (secundario). Pre-visualize e confirme a importacao
                para que apareçam no dashboard (primario).
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={stagingBusy || commitBusy}
                  onClick={() => void handlePreviewStaging()}
                >
                  {stagingBusy ? t("common.processing") : "Pre-visualizar staging"}
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={commitBusy || stagingBusy}
                  onClick={() => void handleCommitStaging()}
                >
                  {commitBusy ? t("common.processing") : "Confirmar importacao para producao"}
                </button>
              </div>

              {stagingPreview ? (
                <div className="mt-3 rounded-lg border border-border/70 bg-background p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    Staging: {stagingPreview.total} registro(s) (exibindo {stagingPreview.items.length})
                  </p>
                  <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {stagingPreview.items.slice(0, 20).map((item) => (
                      <li key={item.id} className="rounded border border-border/50 p-2">
                        <span className="font-medium text-foreground">[{item.source}]</span>{" "}
                        {item.company_name || item.company_slug || "-"} —{" "}
                        {item.text ? item.text.slice(0, 120) : "(sem texto)"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {commitResult ? (
                <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <p>Commit ID: {commitResult.commit_id || "-"}</p>
                  <p>Selecionados: {commitResult.selected}</p>
                  <p>Inseridos no primario: {commitResult.inserted}</p>
                  <p>Status: {commitResult.status || "-"}</p>
                </div>
              ) : null}
            </div>
          ) : null}
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
