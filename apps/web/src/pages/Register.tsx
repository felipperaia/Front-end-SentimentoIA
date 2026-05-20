import { AuthLayout } from "@/components/AuthLayout";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { authApi, setAuthSession } from "@/lib/api";
import { AlertCircle, CheckCircle2, Lock, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Register() {
  const { t } = useAppSettings();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = t("auth.nameRequired");
    if (!formData.email.includes("@")) nextErrors.email = t("auth.emailInvalid");
    if (formData.password.length < 8) nextErrors.password = t("auth.passwordMin");
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = t("auth.passwordMismatch");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.trim() || undefined,
        password: formData.password,
      });
      setAuthSession(response.access_token, response.user);
      setSuccess(true);
      setTimeout(() => setLocation("/search"), 800);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : t("auth.registerError") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t("auth.registerTitle")} subtitle={t("auth.registerSubtitle")}>
      {success ? (
        <div className="mb-5 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("auth.registerSuccess")}</span>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          id="register-name"
          name="name"
          label={t("common.name")}
          value={formData.name}
          onChange={handleChange}
          placeholder={t("auth.namePlaceholder")}
          icon={User}
          autoComplete="name"
          error={errors.name}
        />

        <FormInput
          id="register-email"
          name="email"
          type="email"
          label={t("common.email")}
          value={formData.email}
          onChange={handleChange}
          placeholder={t("auth.emailPlaceholder")}
          icon={Mail}
          autoComplete="email"
          error={errors.email}
        />

        <FormInput
          id="register-phone"
          name="phone"
          type="tel"
          label={t("common.phone")}
          value={formData.phone}
          onChange={handleChange}
          placeholder={t("auth.phonePlaceholder")}
          icon={Phone}
          autoComplete="tel"
          error={errors.phone}
        />

        <FormInput
          id="register-password"
          name="password"
          type="password"
          label={t("common.password")}
          value={formData.password}
          onChange={handleChange}
          placeholder={t("auth.passwordPlaceholder")}
          icon={Lock}
          autoComplete="new-password"
          error={errors.password}
        />

        <FormInput
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          label={t("common.confirmPassword")}
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder={t("auth.confirmPasswordPlaceholder")}
          icon={Lock}
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        {errors.submit ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errors.submit}</span>
            </div>
          </div>
        ) : null}

        <button type="submit" disabled={loading} className="primary-btn w-full justify-center">
          {loading ? t("auth.registerLoading") : t("auth.registerButton")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <button onClick={() => setLocation("/login")} className="text-link">
          {t("auth.loginLink")}
        </button>
      </p>
    </AuthLayout>
  );
}

type FormInputProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: typeof User;
  type?: string;
  autoComplete?: string;
  error?: string;
};

function FormInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  autoComplete,
  error,
}: Readonly<FormInputProps>) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="field-with-icon">
        <Icon size={18} />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="field-input pl-10"
          autoComplete={autoComplete}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
