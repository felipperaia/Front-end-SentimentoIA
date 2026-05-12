import { AuthLayout } from "@/components/AuthLayout";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { authApi } from "@/lib/api";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function ForgotPassword() {
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.includes("@")) {
      setError(t("auth.emailInvalid"));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.requestPasswordReset({ email });
      setSuccess(response.message || t("auth.forgotSuccess"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t("auth.forgotTitle")} subtitle={t("auth.forgotSubtitle")}>
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
          <label className="field-label" htmlFor="forgot-email">
            {t("common.email")}
          </label>
          <div className="field-with-icon">
            <Mail size={18} />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className="field-input pl-10"
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="primary-btn w-full justify-center">
          {loading ? t("common.processing") : t("auth.forgotButton")}
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
