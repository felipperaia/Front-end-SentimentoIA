import { useAppSettings } from "@/contexts/AppSettingsContext";
import type { AppLocale } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

type LanguageSelectorProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSelector({ className, compact = false }: LanguageSelectorProps) {
  const { settings, setLocalePreference, t } = useAppSettings();

  return (
    <label className={cn("language-select", compact ? "language-select-compact" : "", className)}>
      <Languages size={16} aria-hidden="true" />
      <span className="sr-only">{t("common.language")}</span>
      <select
        className="language-select-control"
        value={settings.locale}
        onChange={(event) => setLocalePreference(event.target.value as AppLocale)}
        aria-label={t("common.language")}
      >
        <option value="pt-BR">{compact ? "PT" : t("common.portugueseBrazil")}</option>
        <option value="en-US">{compact ? "EN" : t("common.englishUs")}</option>
      </select>
    </label>
  );
}
