import { AuthLayout } from "@/components/AuthLayout";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { authApi, setAuthSession } from "@/lib/api";
import { AlertCircle, Lock, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError(t("auth.requiredEmailPassword"));
        return;
      }

      if (mfaRequired && mfaCode.length !== 6) {
        setError(t("mfa.codeLength"));
        return;
      }

      const response = await authApi.login({
        email,
        password,
        mfa_code: mfaRequired ? mfaCode : undefined,
      });

      if ("mfa_required" in response && response.mfa_required) {
        setMfaRequired(true);
        setMfaCode("");
        setInfo(response.message || t("auth.loginMfaRequired"));
        return;
      }

      if (!("access_token" in response)) {
        setError(t("auth.loginError"));
        return;
      }

      setAuthSession(response.access_token, response.user, response.refresh_token);
      setLocation("/search");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      {error ? (
        <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      {info ? (
        <div className="mb-5 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{info}</span>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="field-label" htmlFor="login-email">
            {t("common.email")}
          </label>
          <div className="field-with-icon">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (mfaRequired) {
                  setMfaRequired(false);
                  setMfaCode("");
                  setInfo("");
                }
              }}
              placeholder={t("auth.emailPlaceholder")}
              className="field-input pl-10"
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="login-password">
            {t("common.password")}
          </label>
          <div className="field-with-icon">
            <Lock size={18} />
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (mfaRequired) {
                  setMfaRequired(false);
                  setMfaCode("");
                  setInfo("");
                }
              }}
              placeholder={t("auth.passwordPlaceholder")}
              className="field-input pl-10"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
        </div>

        {mfaRequired ? (
          <div>
            <label className="field-label" htmlFor="login-mfa-code">
              {t("mfa.codeLabel")}
            </label>
            <input
              id="login-mfa-code"
              type="text"
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value.replaceAll(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="field-input text-center text-xl"
              inputMode="numeric"
              maxLength={6}
              disabled={loading}
            />
          </div>
        ) : null}

        <button type="submit" disabled={loading} className="primary-btn w-full justify-center">
          {loading ? t("auth.loginLoading") : t("auth.loginButton")}
        </button>

        <div className="flex items-center justify-between gap-3 text-sm">
          <button type="button" onClick={() => setLocation("/recuperar-senha")} className="text-link">
            {t("auth.forgotPassword")}
          </button>
          <button type="button" onClick={() => setLocation("/")} className="text-link">
            {t("auth.backHome")}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <button onClick={() => setLocation("/register")} className="text-link">
          {t("auth.createLink")}
        </button>
      </p>

      <p className="mt-8 text-center text-xs text-muted-foreground">{t("auth.footer")}</p>
    </AuthLayout>
  );
}
