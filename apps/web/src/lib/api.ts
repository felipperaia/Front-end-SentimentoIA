import { translate, type TranslationKey } from "@/lib/i18n";

const configuredApiBaseUrl = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");
const configuredApiTimeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000);
const configuredRetryAttempts = Number(import.meta.env.VITE_API_RETRY_ATTEMPTS || 2);
const configuredRetryDelayMs = Number(import.meta.env.VITE_API_RETRY_DELAY_MS || 700);

export const API_BASE_URL = configuredApiBaseUrl;
export const AUTH_TOKEN_KEY = "sentimentoia_access_token";
export const AUTH_USER_KEY = "sentimentoia_user";
const SETTINGS_STORAGE_KEY = "sentimentoia_preferences";
const API_TIMEOUT_MS = Number.isFinite(configuredApiTimeoutMs)
  ? Math.max(1000, configuredApiTimeoutMs)
  : 20000;
const API_RETRY_ATTEMPTS = Number.isFinite(configuredRetryAttempts)
  ? Math.max(0, Math.min(5, configuredRetryAttempts))
  : 2;
const API_RETRY_DELAY_MS = Number.isFinite(configuredRetryDelayMs)
  ? Math.max(100, configuredRetryDelayMs)
  : 700;
const AI_UPSTREAM_PATH_PREFIXES = ["/api/chat", "/api/insights", "/api/analyze"] as const;
const SESSION_EXPIRED_PATTERNS = [/session expired/i, /token expired/i, /jwt/i, /authentication required/i];
const TIMEOUT_PATTERNS = [/timeout/i, /timed out/i, /deadline exceeded/i, /request aborted/i];
const NETWORK_UNAVAILABLE_PATTERNS = [/failed to fetch/i, /network error/i, /network request failed/i, /fetch failed/i];
const AI_TEMPORARY_UNAVAILABLE_PATTERNS = [/temporarily unavailable/i, /unavailable/i, /overloaded/i, /busy/i, /rate limit/i];
const AI_UPSTREAM_FAILURE_PATTERNS = [/llm/i, /gateway/i, /upstream/i, /provider/i, /model/i, /generation failed/i];

export type AuthUser = {
  id?: string;
  email: string;
  name: string;
  username?: string | null;
  phone?: string | null;
  role?: string;
  mfa_enabled?: boolean;
  mfa_verified?: boolean;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export type MfaChallengeResponse = {
  mfa_required: true;
  message: string;
};

export type LoginResponse = AuthResponse | MfaChallengeResponse;

export type AppTheme = "light" | "dark";
export type AppLocale = "pt-BR" | "en-US";

export type UserSettings = {
  theme: AppTheme;
  locale: AppLocale;
  llm_trigger_min_comments: number;
  updated_at?: string;
};

function getCurrentLocale(): AppLocale {
  if (typeof localStorage === "undefined") return "pt-BR";
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}") as Partial<UserSettings>;
    return parsed.locale === "en-US" ? "en-US" : "pt-BR";
  } catch {
    return "pt-BR";
  }
}

function tApi(key: TranslationKey) {
  return translate(getCurrentLocale(), key);
}

function normalizeErrorText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function extractErrorDetail(payload: any): string {
  const direct = normalizeErrorText(payload);
  if (direct) return direct;

  const candidates = [
    payload?.detail,
    payload?.message,
    payload?.error,
    payload?.errors?.[0]?.error,
    payload?.errors?.[0]?.detail,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeErrorText(candidate);
    if (normalized) return normalized;
  }

  return "";
}

function isAiUpstreamPath(path: string): boolean {
  return AI_UPSTREAM_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function matchesAnyPattern(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function isAuthExpiredError(status: number | undefined, detailText: string): boolean {
  return status === 401 || (Boolean(detailText) && matchesAnyPattern(detailText, SESSION_EXPIRED_PATTERNS));
}

function isTimeoutError(status: number | undefined, detailText: string): boolean {
  return (
    status === 408 ||
    status === 504 ||
    (Boolean(detailText) && matchesAnyPattern(detailText, TIMEOUT_PATTERNS))
  );
}

function resolveAiSpecificError(status: number | undefined, detailText: string): TranslationKey | null {
  if (status === 502 || status === 503 || status === 504) {
    return "api.aiUnavailable";
  }

  if (detailText && matchesAnyPattern(detailText, AI_TEMPORARY_UNAVAILABLE_PATTERNS)) {
    return "api.aiUnavailable";
  }

  if (detailText && matchesAnyPattern(detailText, AI_UPSTREAM_FAILURE_PATTERNS)) {
    return "api.aiFallback";
  }

  return null;
}

function resolveFriendlyErrorMessage(params: {
  path: string;
  status?: number;
  detail?: unknown;
  fallbackKey: TranslationKey;
}): string {
  const detailText = extractErrorDetail(params.detail);
  const aiRequest = isAiUpstreamPath(params.path);

  if (isAuthExpiredError(params.status, detailText)) {
    return tApi("api.authExpired");
  }

  if (isTimeoutError(params.status, detailText)) {
    return tApi("api.timeout");
  }

  if (detailText && matchesAnyPattern(detailText, NETWORK_UNAVAILABLE_PATTERNS)) {
    return aiRequest ? tApi("api.aiUnavailable") : tApi(params.fallbackKey);
  }

  if (aiRequest) {
    const aiErrorKey = resolveAiSpecificError(params.status, detailText);
    if (aiErrorKey) {
      return tApi(aiErrorKey);
    }
  }

  if (detailText) {
    return detailText;
  }

  return tApi(params.fallbackKey);
}

function ensureApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(tApi("api.missingBaseUrl"));
  }
  return API_BASE_URL;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function buildAuthHeaders(options: RequestInit, token: string | null): Headers {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    headers.set("Accept-Encoding", "gzip");
  } catch {
    // Browsers can block unsafe headers; ignore to keep request resilient.
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function requestWithRetry(path: string, options: RequestInit = {}): Promise<Response> {
  const apiBaseUrl = ensureApiBaseUrl();
  const token = getToken();
  const url = `${apiBaseUrl}${path}`;

  let lastNetworkError: unknown = null;

  for (let attempt = 0; attempt <= API_RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers: buildAuthHeaders(options, token),
        signal: controller.signal,
      });

      if (response.status === 401) {
        clearAuthSession();
      }

      if (!response.ok && shouldRetryStatus(response.status) && attempt < API_RETRY_ATTEMPTS) {
        await wait(API_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      return response;
    } catch (err) {
      lastNetworkError = err;

      if (attempt < API_RETRY_ATTEMPTS) {
        await wait(API_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastNetworkError instanceof DOMException && lastNetworkError.name === "AbortError") {
    throw new Error(tApi("api.timeout"));
  }

  if (lastNetworkError instanceof Error) {
    throw new Error(
      resolveFriendlyErrorMessage({
        path,
        detail: lastNetworkError.message,
        fallbackKey: "api.requestError",
      })
    );
  }

  throw new Error(tApi("api.requestError"));
}

async function parseResponseJson(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export type ChatThread = {
  id: string;
  thread_id: string;
  title: string;
  locale?: string;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
};

export type ChatMessage = {
  id: string;
  message_id: string;
  thread_id: string;
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
};

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("manus-runtime-user-info");
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await requestWithRetry(path, options);
  const data = await parseResponseJson(response);

  if (!response.ok) {
    throw new Error(
      resolveFriendlyErrorMessage({
        path,
        status: response.status,
        detail: data,
        fallbackKey: "api.requestError",
      })
    );
  }

  return data as T;
}

async function apiFetchBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const response = await requestWithRetry(path, options);

  if (!response.ok) {
    const data = await parseResponseJson(response);
    throw new Error(
      resolveFriendlyErrorMessage({
        path,
        status: response.status,
        detail: data,
        fallbackKey: "api.reportError",
      })
    );
  }

  return response.blob();
}

export const authApi = {
  register(payload: { name: string; email: string; phone?: string; password: string }) {
    return apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string; mfa_code?: string }) {
    return apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  me() {
    return apiFetch<AuthUser>("/api/auth/me");
  },
  updateProfile(payload: { name?: string; username?: string }) {
    return apiFetch<AuthUser>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  changePassword(payload: { current_password: string; new_password: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  mfaStatus() {
    return apiFetch<{ mfa_enabled: boolean; mfa_verified: boolean }>("/api/auth/mfa/status");
  },
  setupMfa() {
    return apiFetch<{ status: string; secret: string; qr_code: string; message: string }>("/api/auth/mfa/setup", {
      method: "POST",
    });
  },
  enableMfa(payload: { code: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/mfa/enable", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  verifyMfa(payload: { code: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  disableMfa(payload: { password: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/mfa/disable", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  requestPasswordReset(payload: { email: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  resetPassword(payload: { token: string; new_password: string }) {
    return apiFetch<{ status: string; message: string }>("/api/auth/password/reset", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  logout() {
    clearAuthSession();
  },
};


export type Mention = {
  id: string;
  brand_id?: string;
  brand_name?: string;
  text: string;
  source: string;
  sentiment: string;
  score?: number | null;
  source_tier?: "S" | "A" | "B" | null;
  criticality: string;
  urgency_score?: number;
  confidence?: number;
  aspects?: string[];
  critical_terms?: string[];
  rating?: number;
  author?: string;
  url?: string;
  published_at?: string;
  created_at?: string;
};

export type DashboardMetrics = {
  total_mentions: number;
  total_comments?: number;
  sentiment_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  sources_distribution?: Record<string, number>;
  top_aspects: Record<string, number>;
  top_themes?: Record<string, number> | string[];
  critical_mentions: number;
  average_urgency: number;
  urgency_score?: number;
  reputation_score: number;
  sentiment_score?: number;
  negative_count?: number;
  trend?: string;
  recent_mentions?: Mention[];
};

export type DashboardResponse = {
  search_id: string | null;
  batch_id?: string | null;
  query?: string;
  metrics: Partial<DashboardMetrics>;
  mentions: Mention[];
  latest_insight?: InsightItem | null;
  alerts?: any[];
  llm_analysis?: any;
  errors?: any[];
};

export type InsightItem = {
  id: string;
  insight_id?: string;
  job_id?: string;
  user_id?: string;
  batch_id?: string;
  context_id?: string;
  context_type?: string;
  company?: string;
  trigger?: string;
  archived?: boolean;
  priority?: string;
  urgency?: string;
  root_cause?: string;
  recommended_action?: string;
  status?: string;
  resolution?: string;
  timestamp?: string;
  executive_summary?: string;
  sentiment_overview?: string;
  risks?: string[];
  opportunities?: string[];
  recommended_actions?: string[];
  decision_guidance?: string;
  trend?: string;
  created_at?: string;
  updated_at?: string;
};

export type InsightsResponse = {
  items: InsightItem[];
};

export type NpsMetrics = {
  total_responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps_score: number;
  average_score: number;
  by_module: Record<string, { total: number; average: number; nps_score: number; promoters: number; detractors: number }>;
  recent_comments: Array<{ comment: string; score: number; module_key: string; created_at: string }>;
};

export type SearchResponse = {
  search_id: string;
  query?: string;
  cached?: boolean;
  total: number;
  mentions: Mention[];
  metrics: Partial<DashboardMetrics>;
  llm_analysis?: any;
  alerts?: any[];
  errors?: Array<{ source?: string; error?: string } | string>;
};

export type ScrapeSource = "reclameaqui" | "reddit" | "web";

export type ScrapeItem = {
  source: string;
  title: string;
  url: string;
  snippet: string;
  author?: string | null;
  published_at?: string | null;
  canonical_url?: string | null;
  content_hash?: string;
  quality_score?: number;
  source_priority?: number;
};

export type ScrapeResponse = {
  query: string;
  sources: string[];
  limit_per_source: number;
  total: number;
  results: Record<string, ScrapeItem[]>;
  errors: Array<{ source: string; error: string }>;
  metadata?: {
    incremental_mode?: boolean;
    max_total_items?: number;
    sources?: Array<{
      name: string;
      active: boolean;
      priority: number;
      type: string;
      parser: string;
      fetch_mode: string;
      rate_limit_per_minute: number;
      deprecated?: boolean;
    }>;
  };
};

export const sentimentApi = {
  dashboard(params?: { batch_id?: string; period_days?: number; limit_mentions?: number }) {
    const query = new URLSearchParams();
    if (params?.batch_id) query.set("batch_id", params.batch_id);
    if (params?.period_days) query.set("period_days", String(params.period_days));
    if (params?.limit_mentions) query.set("limit_mentions", String(params.limit_mentions));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<DashboardResponse>(`/api/dashboard${suffix}`);
  },
  search(payload: { brand_name: string; sources: string[]; period_days?: number; locality?: string }) {
    return apiFetch<SearchResponse>("/api/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  scrape(payload: { query: string; sources: ScrapeSource[]; limit_per_source?: number }) {
    return apiFetch<ScrapeResponse>("/api/scrape", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  mentions(params?: { batch_id?: string; status?: string; sentiment?: string; source?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.batch_id) query.set("batch_id", params.batch_id);
    if (params?.status) query.set("status", params.status);
    if (params?.sentiment) query.set("sentiment", params.sentiment);
    if (params?.source) query.set("source", params.source);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<Mention[]>(`/api/mentions${suffix}`);
  },
  insights(params?: {
    batch_id?: string;
    include_archived?: boolean;
    limit?: number;
    priority?: string;
    resolution?: string;
    source?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.batch_id) query.set("batch_id", params.batch_id);
    if (params?.include_archived) query.set("include_archived", "true");
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.priority) query.set("priority", params.priority);
    if (params?.resolution) query.set("resolution", params.resolution);
    if (params?.source) query.set("source", params.source);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<InsightsResponse>(`/api/insights${suffix}`);
  },
  generateInsight(payload?: { batch_id?: string; force?: boolean }) {
    return apiFetch<{ ok: boolean; item: InsightItem }>("/api/insights/generate", {
      method: "POST",
      body: JSON.stringify({
        batch_id: payload?.batch_id ?? null,
        force: Boolean(payload?.force),
      }),
    });
  },
  archiveInsight(insightId: string) {
    return apiFetch<{ ok: boolean }>(`/api/insights/${encodeURIComponent(insightId)}/archive`, {
      method: "POST",
    });
  },
  deleteInsight(insightId: string) {
    return apiFetch<{ ok: boolean }>(`/api/insights/${encodeURIComponent(insightId)}`, {
      method: "DELETE",
    });
  },
  regenerateInsight(insightId: string) {
    return apiFetch<{ ok: boolean; item: InsightItem }>(`/api/insights/${encodeURIComponent(insightId)}/regenerate`, {
      method: "POST",
    });
  },
  getSettings() {
    return apiFetch<UserSettings>("/api/settings");
  },
  updateSettings(payload: UserSettings) {
    return apiFetch<UserSettings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  listChatThreads(limit = 20) {
    return apiFetch<{ items: ChatThread[] }>(`/api/chat/threads?limit=${Math.max(1, Math.min(limit, 200))}`);
  },
  createChatThread(payload?: { title?: string }) {
    return apiFetch<{ item: ChatThread }>("/api/chat/threads", {
      method: "POST",
      body: JSON.stringify({ title: payload?.title ?? null }),
    });
  },
  listChatMessages(threadId: string, limit = 100) {
    return apiFetch<{ items: ChatMessage[] }>(
      `/api/chat/threads/${encodeURIComponent(threadId)}/messages?limit=${Math.max(1, Math.min(limit, 500))}`
    );
  },
  sendChatMessage(threadId: string, content: string) {
    return apiFetch<{
      thread: ChatThread;
      user_message: ChatMessage;
      assistant_message: ChatMessage;
    }>(`/api/chat/threads/${encodeURIComponent(threadId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
  deleteChatThread(threadId: string) {
    return apiFetch<{ ok: boolean }>(`/api/chat/threads/${encodeURIComponent(threadId)}`, {
      method: "DELETE",
    });
  },
  deleteChatMessage(threadId: string, messageId: string) {
    return apiFetch<{ ok: boolean }>(
      `/api/chat/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}`,
      { method: "DELETE" }
    );
  },
  deleteAllChatThreads() {
    return apiFetch<{ ok: boolean }>("/api/chat/threads", { method: "DELETE" });
  },
  analyze(payload: { text: string; brand_name?: string; source?: string }) {
    return apiFetch<Mention>("/api/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  npsSubmit(payload: { session_id: string; score: number; comment?: string; module_key?: string; route?: string }) {
    return apiFetch<{ ok: boolean }>("/api/nps/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  npsDismiss(payload: { session_id: string; module_key?: string; route?: string }) {
    return apiFetch<{ ok: boolean }>("/api/nps/dismiss", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  npsCheck(sessionId: string) {
    return apiFetch<{ should_show: boolean }>(`/api/nps/check?session_id=${encodeURIComponent(sessionId)}`);
  },
  npsMetrics(params?: { period_days?: number; module_key?: string }) {
    const query = new URLSearchParams();
    if (params?.period_days) query.set("period_days", String(params.period_days));
    if (params?.module_key) query.set("module_key", params.module_key);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<NpsMetrics>(`/api/nps/metrics${suffix}`);
  },
  privacyConsent(payload: { session_id: string; analytics: boolean; marketing: boolean }) {
    return apiFetch<{ ok: boolean }>("/api/privacy/consent", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteConversation(id: string) {
    return apiFetch<{ ok: boolean }>(`/api/chat/threads/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  deleteMessage(threadId: string, messageId: string) {
    return apiFetch<{ ok: boolean }>(
      `/api/chat/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}`,
      { method: "DELETE" }
    );
  },
  deleteAllConversations() {
    return apiFetch<{ ok: boolean }>("/api/chat/threads", { method: "DELETE" });
  },
  deleteSearch(id: string) {
    return apiFetch<{ ok: boolean }>(`/api/searches/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  deleteAllSearches() {
    return apiFetch<{ ok: boolean }>("/api/searches/all", { method: "DELETE" });
  },
  deleteAllInsights() {
    return apiFetch<{ ok: boolean }>("/api/insights/all", { method: "DELETE" });
  },
  deleteAllUserData() {
    return apiFetch<{ ok: boolean; message: string }>("/api/user/data/all", { method: "DELETE" });
  },
};

export async function downloadReport(
  format: "csv" | "pdf",
  params?: { source?: string; filename?: string }
) {
  const query = new URLSearchParams();
  if (params?.source) query.set("source", params.source);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const blob = await apiFetchBlob(`/api/reports/export/${format}${suffix}`);
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    params?.filename ||
    (format === "csv" ? "relatorio_sentimento.csv" : "relatorio_sentimento.pdf");
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}

export async function downloadInsightsReport(
  format: "markdown" | "pdf",
  params?: { priority?: string; resolution?: string; source?: string; limit?: number }
) {
  const query = new URLSearchParams();
  if (params?.priority) query.set("priority", params.priority);
  if (params?.resolution) query.set("resolution", params.resolution);
  if (params?.source) query.set("source", params.source);
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const blob = await apiFetchBlob(`/api/insights/export/${format}${suffix}`);
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = format === "markdown" ? "insights.md" : "insights.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}
