import {
  AUTH_SESSION_CHANGED_EVENT,
  getToken,
  sentimentApi,
  type AppLocale,
  type AppTheme,
  type UserSettings,
} from "@/lib/api";
import { translate, type TranslationKey, type TranslationValues } from "@/lib/i18n";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const DEFAULT_LOCALE: AppLocale = import.meta.env.VITE_DEFAULT_LOCALE === "en-US" ? "en-US" : "pt-BR";

const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  locale: DEFAULT_LOCALE,
  llm_trigger_min_comments: 20,
};

type AppSettingsContextType = {
  settings: UserSettings;
  loading: boolean;
  saving: boolean;
  setThemePreference: (theme: AppTheme) => void;
  setLocalePreference: (locale: AppLocale) => void;
  setThresholdPreference: (value: number) => void;
  resetSettings: () => void;
  refreshSettings: () => Promise<void>;
  saveSettings: (partial?: Partial<UserSettings>) => Promise<void>;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

function normalizeSettings(value: Partial<UserSettings> | null | undefined): UserSettings {
  return {
    theme: value?.theme === "dark" ? "dark" : "light",
    locale: value?.locale === "en-US" ? "en-US" : DEFAULT_LOCALE,
    llm_trigger_min_comments: Math.max(1, Number(value?.llm_trigger_min_comments || DEFAULT_SETTINGS.llm_trigger_min_comments)),
    updated_at: value?.updated_at,
  };
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.dataset.theme = theme;
}

export function AppSettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState<UserSettings>(() => normalizeSettings(DEFAULT_SETTINGS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getToken()));

  useEffect(() => {
    document.documentElement.lang = settings.locale;
  }, [settings]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const resetSettings = useCallback(() => {
    setSettings(normalizeSettings(DEFAULT_SETTINGS));
    setLoading(false);
  }, []);

  const refreshSettings = useCallback(async () => {
    const token = getToken();
    if (!token) {
      resetSettings();
      return;
    }

    setLoading(true);
    try {
      const remote = await sentimentApi.getSettings();
      setSettings(normalizeSettings(remote));
    } catch {
      resetSettings();
    } finally {
      setLoading(false);
    }
  }, [resetSettings]);

  useEffect(() => {
    void refreshSettings();
  }, [isAuthenticated, refreshSettings]);

  useEffect(() => {
    function handleSessionChange() {
      setIsAuthenticated(Boolean(getToken()));
      void refreshSettings();
    }

    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);
      globalThis.window.addEventListener("storage", handleSessionChange);
    }

    return () => {
      if (globalThis.window !== undefined) {
        globalThis.window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);
        globalThis.window.removeEventListener("storage", handleSessionChange);
      }
    };
  }, [refreshSettings]);

  const saveSettings = useCallback(
    async (partial?: Partial<UserSettings>) => {
      const merged = normalizeSettings({
        ...settings,
        ...partial,
      });

      if (!getToken()) {
        resetSettings();
        return;
      }

      setSettings(merged);
      setSaving(true);
      try {
        const updated = await sentimentApi.updateSettings(merged);
        setSettings(normalizeSettings(updated));
      } finally {
        setSaving(false);
      }
    },
    [resetSettings, settings]
  );

  const setThemePreference = useCallback((theme: AppTheme) => {
    const normalizedTheme: AppTheme = theme === "dark" ? "dark" : "light";
    void saveSettings({ theme: normalizedTheme });
  }, [saveSettings]);

  const setLocalePreference = useCallback((locale: AppLocale) => {
    const normalizedLocale: AppLocale = locale === "en-US" ? "en-US" : "pt-BR";
    void saveSettings({ locale: normalizedLocale });
  }, [saveSettings]);

  const setThresholdPreference = useCallback((value: number) => {
    const normalized = Math.max(1, Number(value || 1));
    setSettings((current) => ({ ...current, llm_trigger_min_comments: normalized }));
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) => translate(settings.locale, key, values),
    [settings.locale]
  );

  const value = useMemo(
    () => ({
      settings,
      loading,
      saving,
      setThemePreference,
      setLocalePreference,
      setThresholdPreference,
      resetSettings,
      refreshSettings,
      saveSettings,
      t,
    }),
    [
      settings,
      loading,
      saving,
      setThemePreference,
      setLocalePreference,
      setThresholdPreference,
      resetSettings,
      refreshSettings,
      saveSettings,
      t,
    ]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return context;
}
