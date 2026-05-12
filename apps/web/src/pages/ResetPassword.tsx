import { AuthLayout } from "@/components/AuthLayout";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { authApi } from "@/lib/api";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function ResetPassword() {
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError(t("auth.resetInvalidToken"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("auth.passwordMin"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        token,
        new_password: newPassword,
      });
      setSuccess(response.message || t("auth.resetSuccess"));
      setTimeout(() => setLocation("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")}>
      {!token ? (
        <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("auth.resetInvalidToken")}</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="field-label" htmlFor="reset-password-new">
            {t("auth.newPassword")}
          </label>
          <div className="field-with-icon">
            <Lock size={18} />
            <input
              id="reset-password-new"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              className="field-input pl-10"
              disabled={loading || !token}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="reset-password-confirm">
            {t("auth.confirmNewPassword")}
          </label>
          <div className="field-with-icon">
            <Lock size={18} />
            <input
              id="reset-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("auth.confirmPasswordPlaceholder")}
              className="field-input pl-10"
              disabled={loading || !token}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="submit" disabled={loading || !token} className="primary-btn w-full justify-center">
          {loading ? t("common.processing") : t("auth.resetButton")}
        </button>

        <div className="flex items-center justify-between gap-3 text-sm">
          <button type="button" onClick={() => setLocation("/login")} className="text-link">
            {t("auth.backToLogin")}
          </button>
          <button type="button" onClick={() => setLocation("/")} className="text-link">
            {t("auth.backHome")}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
