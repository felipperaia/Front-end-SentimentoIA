import { useAuth } from "@/_core/hooks/useAuth";
import { AuthLayout } from "@/components/AuthLayout";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { authApi, getToken } from "@/lib/api";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function MFAVerify() {
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replaceAll(/\D/g, "").slice(0, 6);
    setCode(value);
    if (error) setError("");
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length !== 6) {
      setError(t("mfa.codeLength"));
      return;
    }

    if (!getToken()) {
      setError(t("mfa.sessionExpired"));
      setLocation("/login");
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyMfa({ code });
      setSuccess(true);
      setTimeout(() => setLocation("/search"), 1200);
    } catch (err) {
      setCode("");
      setError(err instanceof Error ? err.message : t("mfa.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t("mfa.title")} subtitle={t("mfa.subtitle")}>
      <div className="mb-6 flex justify-center">
        <div className="rounded-full border border-border bg-accent p-3 text-[color:var(--brand)]">
          <Shield className="h-7 w-7" />
        </div>
      </div>

      {success ? (
        <div className="mb-5 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("mfa.success")}</span>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="field-label" htmlFor="mfa-code">
            {t("mfa.codeLabel")}
          </label>
          <input
            id="mfa-code"
            type="text"
            value={code}
            onChange={handleChange}
            placeholder="000000"
            maxLength={6}
            className="field-input text-center text-2xl"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="primary-btn w-full justify-center"
        >
          {loading ? t("mfa.verifying") : t("mfa.verify")}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">{t("mfa.help")}</p>
    </AuthLayout>
  );
}
