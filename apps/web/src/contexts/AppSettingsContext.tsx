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

const STORAGE_KEY = "sentimentoia_preferences";
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
  refreshSettings: () => Promise<void>;
  saveSettings: (partial?: Partial<UserSettings>) => Promise<void>;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

function loadStoredSettings(): UserSettings {
  try {
    const storedTheme = localStorage.getItem("theme");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_SETTINGS,
        theme: storedTheme === "dark" ? "dark" : "light",
      };
    }

    const parsed = JSON.parse(raw) as Partial<UserSettings>;

    let normalizedTheme: AppTheme;
    if (storedTheme === "dark" || storedTheme === "light") {
      normalizedTheme = storedTheme;
    } else {
      normalizedTheme = parsed.theme === "dark" ? "dark" : "light";
    }

    return {
      theme: normalizedTheme,
      locale: parsed.locale === "en-US" ? "en-US" : "pt-BR",
      llm_trigger_min_comments: Math.max(1, Number(parsed.llm_trigger_min_comments || 20)),
      updated_at: parsed.updated_at,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
}

export function AppSettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState<UserSettings>(() => loadStoredSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getToken()));

  useEffect(() => {
    document.documentElement.lang = settings.locale;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const refreshSettings = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setSettings(loadStoredSettings());
      setLoading(false);
      return;
    }

    try {
      const remote = await sentimentApi.getSettings();
      setSettings({
        theme: remote.theme === "dark" ? "dark" : "light",
        locale: remote.locale === "en-US" ? "en-US" : "pt-BR",
        llm_trigger_min_comments: Math.max(1, Number(remote.llm_trigger_min_comments || 20)),
        updated_at: remote.updated_at,
      });
    } catch {
      // Mantem fallback local se backend indisponivel.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings, isAuthenticated]);

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
      const merged: UserSettings = {
        ...settings,
        ...partial,
      };
      merged.theme = merged.theme === "dark" ? "dark" : "light";
      merged.locale = merged.locale === "en-US" ? "en-US" : "pt-BR";
      merged.llm_trigger_min_comments = Math.max(1, Number(merged.llm_trigger_min_comments || 20));

      setSettings(merged);

      if (!getToken()) {
        return;
      }

      setSaving(true);
      try {
        const updated = await sentimentApi.updateSettings(merged);
        setSettings({
          theme: updated.theme === "dark" ? "dark" : "light",
          locale: updated.locale === "en-US" ? "en-US" : "pt-BR",
          llm_trigger_min_comments: Math.max(1, Number(updated.llm_trigger_min_comments || 20)),
          updated_at: updated.updated_at,
        });
      } finally {
        setSaving(false);
      }
    },
    [settings]
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
