import { AppShell } from "@/components/AppShell";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function SettingsPage() {
  const {
    settings,
    loading,
    saving,
    setThemePreference,
    setLocalePreference,
    setThresholdPreference,
    saveSettings,
    t,
  } = useAppSettings();

  const [theme, setTheme] = useState(settings.theme);
  const [locale, setLocale] = useState(settings.locale);
  const [threshold, setThreshold] = useState(settings.llm_trigger_min_comments);

  useEffect(() => {
    setTheme(settings.theme);
    setLocale(settings.locale);
    setThreshold(settings.llm_trigger_min_comments);
  }, [settings]);

  const updatedAt = useMemo(() => {
    if (!settings.updated_at) return "-";
    const date = new Date(settings.updated_at);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(locale);
  }, [settings.updated_at, locale]);

  async function handleSave() {
    try {
      await saveSettings({
        theme,
        locale,
        llm_trigger_min_comments: threshold,
      });
      alert(locale === "en-US" ? "Settings saved." : "Configuracoes salvas.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao salvar configuracoes");
    }
  }

  function onThemeChange(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    setThemePreference(nextTheme);
  }

  function onLocaleChange(nextLocale: "pt-BR" | "en-US") {
    setLocale(nextLocale);
    setLocalePreference(nextLocale);
  }

  function onThresholdChange(value: number) {
    const normalized = Math.max(1, Math.min(10000, Number(value || 1)));
    setThreshold(normalized);
    setThresholdPreference(normalized);
  }

  return (
    <AppShell
      title={t("settings.title")}
      subtitle={t("settings.subtitle")}
      actions={
        <button className="primary-btn" disabled={saving || loading} onClick={handleSave}>
          <Save size={16} />
          <span>{saving ? "Salvando..." : t("settings.save")}</span>
        </button>
      }
    >
      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="app-panel p-6 md:p-7">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="field-label">{t("settings.theme")}</label>
              <select
                value={theme}
                onChange={(event) => onThemeChange(event.target.value as "light" | "dark")}
                className="field-input"
                disabled={loading}
              >
                <option value="light">{t("theme.light")}</option>
                <option value="dark">{t("theme.dark")}</option>
              </select>
            </div>

            <div>
              <label className="field-label">{t("settings.language")}</label>
              <select
                value={locale}
                onChange={(event) => onLocaleChange(event.target.value as "pt-BR" | "en-US")}
                className="field-input"
                disabled={loading}
              >
                <option value="pt-BR">Portuguese (Brazil)</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>
          </div>

          <div className="mt-7">
            <label className="field-label">{t("settings.threshold")}</label>
            <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_120px] md:items-center">
              <input
                type="range"
                min={1}
                max={500}
                value={Math.min(threshold, 500)}
                onChange={(event) => onThresholdChange(Number(event.target.value))}
                className="accent-[color:var(--brand)]"
                disabled={loading}
              />
              <input
                type="number"
                min={1}
                max={10000}
                value={threshold}
                onChange={(event) => onThresholdChange(Number(event.target.value))}
                className="field-input"
                disabled={loading}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "en-US"
                ? "Minimum number of comments required before automatic LLM insight generation."
                : "Quantidade minima de comentarios para acionar geracao automatica de insight por LLM."}
            </p>
          </div>
        </article>

        <aside className="app-panel p-6">
          <h3 className="text-lg font-semibold">Status</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Tema ativo</dt>
              <dd className="font-medium">{theme === "dark" ? t("theme.dark") : t("theme.light")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Idioma ativo</dt>
              <dd className="font-medium">{locale}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Limiar atual</dt>
              <dd className="font-medium">{threshold}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ultima atualizacao</dt>
              <dd className="font-medium">{updatedAt}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </AppShell>
  );
}
