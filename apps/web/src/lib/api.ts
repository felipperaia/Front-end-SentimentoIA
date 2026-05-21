import { translate, type TranslationKey } from "@/lib/i18n";

const configuredApiBaseUrl = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");
const configuredApiTimeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS || 90000);
const configuredRetryAttempts = Number(import.meta.env.VITE_API_RETRY_ATTEMPTS || 2);
const configuredRetryDelayMs = Number(import.meta.env.VITE_API_RETRY_DELAY_MS || 1000);

export const API_BASE_URL = configuredApiBaseUrl;
export const AUTH_TOKEN_KEY = "sentimentoia_access_token";
export const AUTH_USER_KEY = "sentimentoia_user";
const SETTINGS_STORAGE_KEY = "sentimentoia_preferences";
const API_TIMEOUT_MS = Number.isFinite(configuredApiTimeoutMs)
  ? Math.max(1000, configuredApiTimeoutMs)
  : 90000;
const API_RETRY_ATTEMPTS = Number.isFinite(configuredRetryAttempts)
  ? Math.max(0, Math.min(5, configuredRetryAttempts))
  : 2;
const API_RETRY_DELAY_MS = Number.isFinite(configuredRetryDelayMs)
  ? Math.max(100, configuredRetryDelayMs)
  : 1000;
const LONG_PATHS = ["/api/search", "/api/scrape"] as const;
const LONG_REQUEST_TIMEOUT_MS = 120_000;
const SEARCH_TIMEOUT_MESSAGE =
  "A busca demorou mais que o esperado. Tente selecionar menos fontes ou reduza o período de busca.";
const AI_UPSTREAM_PATH_PREFIXES = ["/api/chat", "/api/insights", "/api/analyze"] as const;
const SESSION_EXPIRED_PATTERNS = [/session expired/i, /token expired/i, /jwt/i, /authentication required/i];
const TIMEOUT_PATTERNS = [/timeout/i, /timed out/i, /deadline exceeded/i, /request aborted/i];
const NETWORK_UNAVAILABLE_PATTERNS = [/failed to fetch/i, /network error/i, /network request failed/i, /fetch failed/i];
const AI_TEMPORARY_UNAVAILABLE_PATTERNS = [/temporarily unavailable/i, /unavailable/i, /overloaded/i, /busy/i, /rate limit/i];
const AI_UPSTREAM_FAILURE_PATTERNS = [/llm/i, /gateway/i, /upstream/i, /provider/i, /model/i, /generation failed/i];
const INTERNAL_ERROR_DETAIL_PATTERNS = [/traceback/i, /stack/i, /exception/i, /gateway/i, /upstream/i, /model/i, /ollama/i];

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
    payload?.business_state?.actionable_message,
    payload?.meta?.actionable_message,
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

function extractErrorCode(payload: any): string | undefined {
  const candidates = [
    payload?.code,
    payload?.reason,
    payload?.meta?.reason,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeErrorText(candidate);
    if (normalized) return normalized;
  }

  return undefined;
}

function isAiUpstreamPath(path: string): boolean {
  return AI_UPSTREAM_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isLongRequestPath(path: string): boolean {
  return LONG_PATHS.some((prefix) => path.startsWith(prefix));
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

function resolveTimeoutFriendlyMessage(path: string): string {
  return isLongRequestPath(path) ? SEARCH_TIMEOUT_MESSAGE : tApi("api.timeout");
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
    return resolveTimeoutFriendlyMessage(params.path);
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

  if (detailText && matchesAnyPattern(detailText, INTERNAL_ERROR_DETAIL_PATTERNS)) {
    return aiRequest ? tApi("api.aiFallback") : tApi(params.fallbackKey);
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

type RequestAttemptResult = {
  response: Response | null;
  networkError?: unknown;
};

async function runRequestAttempt(params: {
  url: string;
  options: RequestInit;
  token: string | null;
  attempt: number;
  timeoutMs: number;
}): Promise<RequestAttemptResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const response = await fetch(params.url, {
      ...params.options,
      headers: buildAuthHeaders(params.options, params.token),
      signal: controller.signal,
    });

    if (response.status === 401) {
      clearAuthSession();
    }

    if (!response.ok && shouldRetryStatus(response.status) && params.attempt < API_RETRY_ATTEMPTS) {
      await wait(API_RETRY_DELAY_MS * (params.attempt + 1));
      return { response: null };
    }

    return { response };
  } catch (err) {
    if (params.attempt < API_RETRY_ATTEMPTS) {
      await wait(API_RETRY_DELAY_MS * (params.attempt + 1));
    }

    return {
      response: null,
      networkError: err,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestWithRetry(path: string, options: RequestInit = {}): Promise<Response> {
  const apiBaseUrl = ensureApiBaseUrl();
  const token = getToken();
  const url = `${apiBaseUrl}${path}`;
  const apiTimeout = API_TIMEOUT_MS;
  const isLongRequest = isLongRequestPath(path);

  let lastNetworkError: unknown = null;

  for (let attempt = 0; attempt <= API_RETRY_ATTEMPTS; attempt += 1) {
    const timeout = isLongRequest ? LONG_REQUEST_TIMEOUT_MS : apiTimeout;
    const { response, networkError } = await runRequestAttempt({
      url,
      options,
      token,
      attempt,
      timeoutMs: timeout,
    });

    if (networkError !== undefined) {
      lastNetworkError = networkError;
    }

    if (response) {
      return response;
    }
  }

  if (lastNetworkError instanceof DOMException && lastNetworkError.name === "AbortError") {
    throw new Error(resolveTimeoutFriendlyMessage(path));
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

function parseFilenameFromDisposition(dispositionHeader: string | null): string | null {
  if (!dispositionHeader) return null;

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(dispositionHeader);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(dispositionHeader);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return null;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}

function ensureObject(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, any>;
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function asNullableString(value: unknown): string | undefined {
  const resolved = asString(value, "");
  return resolved || undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeNumericRecord(value: unknown): Record<string, number> {
  const raw = ensureObject(value);
  const output: Record<string, number> = {};
  for (const [key, item] of Object.entries(raw)) {
    const parsed = Number(item);
    if (Number.isFinite(parsed)) {
      output[key] = parsed;
    }
  }
  return output;
}

function normalizeSourceTier(value: unknown): "S" | "A" | "B" | null {
  const normalized = asString(value, "").toUpperCase();
  if (normalized === "S" || normalized === "A" || normalized === "B") {
    return normalized;
  }
  return null;
}

function normalizeMention(item: unknown): Mention {
  const raw = ensureObject(item);
  return {
    id: asString(raw.id || raw._id || raw.external_id, "unknown"),
    brand_id: asNullableString(raw.brand_id),
    brand_name: asNullableString(raw.brand_name || raw.query || raw.entity),
    text: asString(raw.text || raw.snippet || raw.title, ""),
    source: asString(raw.source, "web"),
    sentiment: asString(raw.sentiment, "neutro"),
    score: raw.score === null || raw.score === undefined ? null : asNumber(raw.score, 0),
    source_tier: normalizeSourceTier(raw.source_tier),
    criticality: asString(raw.criticality, "baixa"),
    urgency_score: asNumber(raw.urgency_score, 0),
    confidence: raw.confidence === null || raw.confidence === undefined ? undefined : asNumber(raw.confidence, 0),
    aspects: ensureArray<string>(raw.aspects),
    critical_terms: ensureArray<string>(raw.critical_terms),
    rating: raw.rating === null || raw.rating === undefined ? undefined : asNumber(raw.rating, 0),
    author: asNullableString(raw.author),
    url: asNullableString(raw.url || raw.canonical_url),
    published_at: asNullableString(raw.published_at),
    created_at: asNullableString(raw.created_at),
  };
}

function normalizeInsight(item: unknown): InsightItem {
  const raw = ensureObject(item);
  return {
    id: asString(raw.id || raw._id || raw.insight_id || raw.context_id, "unknown"),
    insight_id: asNullableString(raw.insight_id),
    job_id: asNullableString(raw.job_id),
    user_id: asNullableString(raw.user_id),
    batch_id: asNullableString(raw.batch_id),
    context_id: asNullableString(raw.context_id),
    context_type: asNullableString(raw.context_type),
    company: asNullableString(raw.company || raw.snapshot?.brand),
    trigger: asNullableString(raw.trigger),
    archived: Boolean(raw.archived),
    priority: asNullableString(raw.priority),
    urgency: asNullableString(raw.urgency),
    root_cause: asNullableString(raw.root_cause),
    recommended_action: asNullableString(raw.recommended_action),
    status: asNullableString(raw.status),
    resolution: asNullableString(raw.resolution),
    timestamp: asNullableString(raw.timestamp),
    executive_summary: asNullableString(raw.executive_summary),
    sentiment_overview: asNullableString(raw.sentiment_overview),
    risks: ensureArray<string>(raw.risks),
    opportunities: ensureArray<string>(raw.opportunities),
    recommended_actions: ensureArray<string>(raw.recommended_actions),
    decision_guidance: asNullableString(raw.decision_guidance),
    trend: asNullableString(raw.trend),
    created_at: asNullableString(raw.created_at),
    updated_at: asNullableString(raw.updated_at),
  };
}

function normalizeSearchErrors(
  errors: unknown
): Array<{ source?: string; error?: string; reason?: string; timeout?: boolean } | string> {
  return ensureArray<any>(errors)
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      const raw = ensureObject(entry);
      const source = asString(raw.source || raw.name, "fonte");
      const error = asString(raw.error || raw.detail || raw.message, "Erro temporario na coleta");
      const reason = asNullableString(raw.reason);
      const timeout = Boolean(raw.timeout) || reason === "timeout";
      return { source, error, reason, timeout };
    })
    .filter(Boolean);
}

function normalizeChatThread(item: unknown): ChatThread {
  const raw = ensureObject(item);
  const threadId = asString(raw.thread_id || raw.id, "");
  return {
    id: asString(raw.id || threadId, threadId || "unknown"),
    thread_id: threadId || asString(raw.id, "unknown"),
    title: asString(raw.title, "Nova conversa"),
    locale: asNullableString(raw.locale),
    archived: raw.archived === undefined ? undefined : Boolean(raw.archived),
    created_at: asNullableString(raw.created_at),
    updated_at: asNullableString(raw.updated_at),
    last_message_at: asNullableString(raw.last_message_at),
  };
}

function normalizeChatMessage(item: unknown): ChatMessage {
  const raw = ensureObject(item);
  const messageId = asString(raw.message_id || raw.id, "");
  const role = asString(raw.role, "assistant").toLowerCase();
  return {
    id: asString(raw.id || messageId, messageId || "unknown"),
    message_id: messageId || asString(raw.id, "unknown"),
    thread_id: asString(raw.thread_id, ""),
    role: role === "system" || role === "user" || role === "assistant" ? role : "assistant",
    content: asString(raw.content, ""),
    created_at: asNullableString(raw.created_at),
  };
}

function normalizeDashboardMetrics(rawMetrics: unknown, mentions: Mention[] = []): Partial<DashboardMetrics> {
  const raw = ensureObject(rawMetrics);
  const totalMentions = asNumber(raw.total_mentions, mentions.length);
  const sentimentDistribution = normalizeNumericRecord(raw.sentiment_distribution);
  const sourceDistribution = normalizeNumericRecord(raw.source_distribution || raw.sources_distribution);
  const sourcesDistribution = normalizeNumericRecord(raw.sources_distribution || raw.source_distribution);
  const topAspects = normalizeNumericRecord(raw.top_aspects);

  let topThemes: Record<string, number> | string[] | undefined;
  if (Array.isArray(raw.top_themes)) {
    topThemes = ensureArray<string>(raw.top_themes);
  } else {
    topThemes = normalizeNumericRecord(raw.top_themes || raw.top_aspects);
  }

  return {
    total_mentions: totalMentions,
    total_comments: asNumber(raw.total_comments, totalMentions),
    sentiment_distribution: sentimentDistribution,
    source_distribution: sourceDistribution,
    sources_distribution: sourcesDistribution,
    top_aspects: topAspects,
    top_themes: topThemes,
    critical_mentions: asNumber(raw.critical_mentions, 0),
    average_urgency: asNumber(raw.average_urgency, 0),
    urgency_score: raw.urgency_score === undefined || raw.urgency_score === null ? undefined : asNumber(raw.urgency_score, 0),
    reputation_score: asNumber(raw.reputation_score, 0),
    sentiment_score: raw.sentiment_score === undefined || raw.sentiment_score === null ? undefined : asNumber(raw.sentiment_score, 0),
    negative_count: raw.negative_count === undefined || raw.negative_count === null ? undefined : asNumber(raw.negative_count, 0),
    trend: asNullableString(raw.trend),
    recent_mentions: ensureArray<any>(raw.recent_mentions).map(normalizeMention),
  };
}

function normalizeScrapeItem(item: unknown, fallbackSource: string): ScrapeItem {
  const raw = ensureObject(item);
  return {
    source: asString(raw.source, fallbackSource),
    title: asString(raw.title, "Resultado"),
    url: asString(raw.url || raw.canonical_url, ""),
    snippet: asString(raw.snippet || raw.text, ""),
    author: asNullableString(raw.author) ?? null,
    published_at: asNullableString(raw.published_at) ?? null,
    canonical_url: asNullableString(raw.canonical_url) ?? null,
    content_hash: asNullableString(raw.content_hash),
    quality_score: raw.quality_score === undefined || raw.quality_score === null ? undefined : asNumber(raw.quality_score, 0),
    source_priority:
      raw.source_priority === undefined || raw.source_priority === null ? undefined : asNumber(raw.source_priority, 0),
  };
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

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  data?: any;
  path: string;

  constructor(
    message: string,
    params: {
      path: string;
      status?: number;
      code?: string;
      data?: any;
    }
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.path = params.path;
    this.status = params.status;
    this.code = params.code;
    this.data = params.data;
  }
}

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
    const message = resolveFriendlyErrorMessage({
      path,
      status: response.status,
      detail: data,
      fallbackKey: "api.requestError",
    });
    throw new ApiRequestError(message, {
      path,
      status: response.status,
      code: extractErrorCode(data),
      data,
    });
  }

  return data as T;
}

async function apiFetchBlob(path: string, options: RequestInit = {}): Promise<{ blob: Blob; filename: string | null }> {
  const response = await requestWithRetry(path, options);

  if (!response.ok) {
    const data = await parseResponseJson(response);
    const message = resolveFriendlyErrorMessage({
      path,
      status: response.status,
      detail: data,
      fallbackKey: "api.reportError",
    });
    throw new ApiRequestError(message, {
      path,
      status: response.status,
      code: extractErrorCode(data),
      data,
    });
  }

  const blob = await response.blob();
  const filename = parseFilenameFromDisposition(response.headers.get("content-disposition"));
  return { blob, filename };
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

export type ExecutionStatus = "success" | "partial_success" | "empty" | "failed";

export type SourceExecutionStatus = {
  source: string;
  ok: boolean;
  count: number;
  error?: string | null;
  reason?: string | null;
  timeout?: boolean;
};

export type ExecutionStatusSummary = {
  status: ExecutionStatus;
  partial_success: boolean;
  message?: string;
  sources_requested?: number;
  sources_with_data?: number;
  sources_failed?: number;
  timeout_sources?: string[];
  source_status?: SourceExecutionStatus[];
  unmapped_error_count?: number;
};

export type SearchResponse = {
  search_id: string;
  query?: string;
  cached?: boolean;
  status?: ExecutionStatus;
  partial_success?: boolean;
  status_summary?: ExecutionStatusSummary;
  total: number;
  mentions: Mention[];
  metrics: Partial<DashboardMetrics>;
  llm_analysis?: any;
  alerts?: any[];
  errors?: Array<{ source?: string; error?: string; reason?: string; timeout?: boolean } | string>;
};

export type ScrapeSource =
  | "reclameaqui"
  | "reddit"
  | "youtube"
  | "appstore"
  | "playstore"
  | "glassdoor"
  | "trustpilot"
  | "mastodon"
  | "web"
  | "google"
  | "x"
  | "twitter";

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
  status?: ExecutionStatus;
  partial_success?: boolean;
  status_summary?: ExecutionStatusSummary;
  total: number;
  results: Record<string, ScrapeItem[]>;
  errors: Array<{ source: string; error: string; reason?: string; timeout?: boolean }>;
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

export type IntegrationSourceMetadata = {
  name: string;
  type: string;
  base_url?: string;
  active: boolean;
  priority: number;
  fetch_mode: string;
  rate_limit_per_minute: number;
  parser: string;
  deprecated?: boolean;
};

export type IntegrationsStatusResponse = {
  scraping_enabled: boolean;
  scraper_delay_seconds: number;
  scraper_default_limit: number;
  scraper_default_sources: string[];
  scraper_active_sources: string[];
  scraper_source_metadata: IntegrationSourceMetadata[];
  mongodb_configured: boolean;
  llm?: Record<string, any>;
  external_source_apis_removed?: boolean;
};

function normalizeExecutionStatus(value: unknown, fallback: ExecutionStatus = "success"): ExecutionStatus {
  const normalized = asString(value, "").toLowerCase();
  if (normalized === "success" || normalized === "partial_success" || normalized === "empty" || normalized === "failed") {
    return normalized;
  }
  return fallback;
}

function normalizeStatusSummary(value: unknown): ExecutionStatusSummary | undefined {
  const raw = ensureObject(value);
  if (Object.keys(raw).length === 0) return undefined;

  const sourceStatus = ensureArray<any>(raw.source_status).map((entry) => {
    const item = ensureObject(entry);
    return {
      source: asString(item.source, "unknown"),
      ok: Boolean(item.ok),
      count: asNumber(item.count, 0),
      error: asNullableString(item.error) ?? null,
      reason: asNullableString(item.reason) ?? null,
      timeout: Boolean(item.timeout),
    };
  });

  return {
    status: normalizeExecutionStatus(raw.status, "success"),
    partial_success: Boolean(raw.partial_success),
    message: asNullableString(raw.message),
    sources_requested: raw.sources_requested === undefined ? undefined : asNumber(raw.sources_requested, 0),
    sources_with_data: raw.sources_with_data === undefined ? undefined : asNumber(raw.sources_with_data, 0),
    sources_failed: raw.sources_failed === undefined ? undefined : asNumber(raw.sources_failed, 0),
    timeout_sources: ensureArray<string>(raw.timeout_sources),
    source_status: sourceStatus,
    unmapped_error_count: raw.unmapped_error_count === undefined ? undefined : asNumber(raw.unmapped_error_count, 0),
  };
}

export const sentimentApi = {
  async dashboard(params?: { batch_id?: string; period_days?: number; limit_mentions?: number }) {
    const query = new URLSearchParams();
    if (params?.batch_id) query.set("batch_id", params.batch_id);
    if (params?.period_days) query.set("period_days", String(params.period_days));
    if (params?.limit_mentions) query.set("limit_mentions", String(params.limit_mentions));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/dashboard${suffix}`);
    const data = ensureObject(raw);
    const mentions = ensureArray<any>(data.mentions).map(normalizeMention);

    return {
      search_id: asNullableString(data.search_id || data.batch_id) ?? null,
      batch_id: asNullableString(data.batch_id || data.search_id) ?? null,
      query: asNullableString(data.query),
      metrics: normalizeDashboardMetrics(data.metrics, mentions),
      mentions,
      latest_insight: data.latest_insight ? normalizeInsight(data.latest_insight) : null,
      alerts: ensureArray<any>(data.alerts),
      llm_analysis: ensureObject(data.llm_analysis),
      errors: normalizeSearchErrors(data.errors),
    };
  },
  async search(payload: {
    brand_name?: string;
    query?: string;
    sources: string[];
    period_days?: number;
    locality?: string;
    replace_existing?: boolean;
    limit?: number;
    sentiment_filter?: string;
    min_criticality?: string;
  }) {
    const raw = await apiFetch<any>("/api/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = ensureObject(raw);
    const mentions = ensureArray<any>(data.mentions).map(normalizeMention);
    const statusSummary = normalizeStatusSummary(data.status_summary);
    const fallbackStatus = mentions.length > 0 ? "success" : "empty";
    const status = normalizeExecutionStatus(data.status || statusSummary?.status, fallbackStatus);
    const partialSuccess = Boolean(data.partial_success ?? statusSummary?.partial_success ?? status === "partial_success");

    return {
      search_id: asString(data.search_id, ""),
      query: asNullableString(data.query || payload.brand_name || payload.query),
      cached: Boolean(data.cached),
      status,
      partial_success: partialSuccess,
      status_summary: statusSummary,
      total: asNumber(data.total, mentions.length),
      mentions,
      metrics: normalizeDashboardMetrics(data.metrics, mentions),
      llm_analysis: ensureObject(data.llm_analysis),
      alerts: ensureArray<any>(data.alerts),
      errors: normalizeSearchErrors(data.errors),
    } as SearchResponse;
  },
  async scrape(payload: { query: string; sources: ScrapeSource[]; limit_per_source?: number; limit?: number }) {
    const raw = await apiFetch<any>("/api/scrape", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = ensureObject(raw);
    const requestedSources = payload.sources.map((source) => asString(source));
    const rawResults = ensureObject(data.results);
    const results: Record<string, ScrapeItem[]> = {};

    for (const source of requestedSources) {
      const sourceItems = ensureArray<any>(rawResults[source]);
      results[source] = sourceItems.map((item) => normalizeScrapeItem(item, source));
    }

    for (const [source, sourceItems] of Object.entries(rawResults)) {
      if (!results[source]) {
        results[source] = ensureArray<any>(sourceItems).map((item) => normalizeScrapeItem(item, source));
      }
    }

    const errors = ensureArray<any>(data.errors).map((entry) => {
      const item = ensureObject(entry);
      return {
        source: asString(item.source, "unknown"),
        error: asString(item.error || item.detail || item.message, "Falha temporaria na coleta da fonte"),
        reason: asNullableString(item.reason),
        timeout: Boolean(item.timeout),
      };
    });

    const computedTotal = asNumber(data.total, Object.values(results).reduce((acc, items) => acc + items.length, 0));
    let fallbackStatus: ExecutionStatus = "empty";
    if (computedTotal > 0) {
      fallbackStatus = errors.length > 0 ? "partial_success" : "success";
    } else if (errors.length > 0) {
      fallbackStatus = "failed";
    }
    const statusSummary = normalizeStatusSummary(data.status_summary);
    const status = normalizeExecutionStatus(data.status || statusSummary?.status, fallbackStatus);
    const partialSuccess = Boolean(data.partial_success ?? statusSummary?.partial_success ?? status === "partial_success");

    return {
      query: asString(data.query, payload.query),
      sources: ensureArray<string>(data.sources).length > 0 ? ensureArray<string>(data.sources) : requestedSources,
      limit_per_source: asNumber(data.limit_per_source, payload.limit_per_source || payload.limit || 5),
      status,
      partial_success: partialSuccess,
      status_summary: statusSummary,
      total: computedTotal,
      results,
      errors,
      metadata: ensureObject(data.metadata) as ScrapeResponse["metadata"],
    };
  },
  async mentions(params?: { batch_id?: string; search_id?: string; status?: string; sentiment?: string; limit?: number }) {
    const query = new URLSearchParams();
    const resolvedContextId = asNullableString(params?.batch_id) ?? asNullableString(params?.search_id);
    if (resolvedContextId) {
      query.set("batch_id", resolvedContextId);
      query.set("search_id", resolvedContextId);
    }

    const resolvedStatus = asNullableString(params?.status);
    if (resolvedStatus && resolvedStatus !== "all") query.set("status", resolvedStatus);

    const resolvedSentiment = asNullableString(params?.sentiment);
    if (resolvedSentiment && resolvedSentiment !== "all") query.set("sentiment", resolvedSentiment);

    if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
      query.set("limit", String(Math.max(1, Math.min(Math.round(params.limit), 1000))));
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/mentions${suffix}`);
    const payload = ensureObject(raw);
    const items = Array.isArray(raw)
      ? raw
      : ensureArray<any>(payload.items || payload.mentions || payload.data);
    return items.map(normalizeMention);
  },
  async insights(params?: {
    batch_id?: string;
    include_archived?: boolean;
    limit?: number;
    priority?: string;
    resolution?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.batch_id) query.set("batch_id", params.batch_id);
    if (params?.include_archived) query.set("include_archived", "true");
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.priority) query.set("priority", params.priority);
    if (params?.resolution) query.set("resolution", params.resolution);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/insights${suffix}`);
    const data = ensureObject(raw);
    return {
      items: ensureArray<any>(data.items).map(normalizeInsight),
    };
  },
  async generateInsight(payload?: { batch_id?: string; force?: boolean }) {
    const raw = await apiFetch<any>("/api/insights/generate", {
      method: "POST",
      body: JSON.stringify({
        batch_id: payload?.batch_id ?? null,
        force: Boolean(payload?.force),
      }),
    });
    const data = ensureObject(raw);
    return {
      ok: Boolean(data.ok),
      item: normalizeInsight(data.item),
    };
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
  async regenerateInsight(insightId: string) {
    const raw = await apiFetch<any>(`/api/insights/${encodeURIComponent(insightId)}/regenerate`, {
      method: "POST",
    });
    const data = ensureObject(raw);
    return {
      ok: Boolean(data.ok),
      item: normalizeInsight(data.item),
    };
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
  async listChatThreads(limit = 20) {
    const raw = await apiFetch<any>(`/api/chat/threads?limit=${Math.max(1, Math.min(limit, 200))}`);
    const data = ensureObject(raw);
    return {
      items: ensureArray<any>(data.items).map(normalizeChatThread),
    };
  },
  async createChatThread(payload?: { title?: string }) {
    const raw = await apiFetch<any>("/api/chat/threads", {
      method: "POST",
      body: JSON.stringify({ title: payload?.title ?? null }),
    });
    const data = ensureObject(raw);
    return {
      item: normalizeChatThread(data.item),
    };
  },
  async listChatMessages(threadId: string, limit = 100) {
    const raw = await apiFetch<any>(
      `/api/chat/threads/${encodeURIComponent(threadId)}/messages?limit=${Math.max(1, Math.min(limit, 500))}`
    );
    const data = ensureObject(raw);
    return {
      items: ensureArray<any>(data.items).map(normalizeChatMessage),
    };
  },
  async sendChatMessage(threadId: string, content: string) {
    const raw = await apiFetch<any>(`/api/chat/threads/${encodeURIComponent(threadId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    const data = ensureObject(raw);
    return {
      thread: normalizeChatThread(data.thread),
      user_message: normalizeChatMessage(data.user_message),
      assistant_message: normalizeChatMessage(data.assistant_message),
    };
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
  async analyze(payload: { text: string; brand_name?: string; source?: string }) {
    const raw = await apiFetch<any>("/api/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeMention(raw);
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
  async npsCheck(sessionId: string) {
    const raw = await apiFetch<any>(
      `/api/nps/check?session_id=${encodeURIComponent(sessionId)}`
    );
    const data = ensureObject(raw);
    return {
      should_show: Boolean(data.should_show),
      trigger: asNullableString(data.trigger) ?? null,
    };
  },
  async npsMetrics(params?: { period_days?: number; module_key?: string }) {
    const query = new URLSearchParams();
    if (params?.period_days) query.set("period_days", String(params.period_days));
    if (params?.module_key) query.set("module_key", params.module_key);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const raw = await apiFetch<any>(`/api/nps/metrics${suffix}`);
    const data = ensureObject(raw);
    return {
      total_responses: asNumber(data.total_responses, 0),
      promoters: asNumber(data.promoters, 0),
      passives: asNumber(data.passives, 0),
      detractors: asNumber(data.detractors, 0),
      nps_score: asNumber(data.nps_score, 0),
      average_score: asNumber(data.average_score, 0),
      by_module: ensureObject(data.by_module) as NpsMetrics["by_module"],
      recent_comments: ensureArray<any>(data.recent_comments).map((item) => {
        const rawComment = ensureObject(item);
        return {
          comment: asString(rawComment.comment, ""),
          score: asNumber(rawComment.score, 0),
          module_key: asString(rawComment.module_key, "geral"),
          created_at: asString(rawComment.created_at, ""),
        };
      }),
    };
  },
  privacyConsent(payload: { session_id: string; analytics: boolean; marketing: boolean }) {
    return apiFetch<{ ok: boolean }>("/api/privacy/consent", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async integrationsStatus() {
    const raw = await apiFetch<any>("/api/status/integrations");
    const data = ensureObject(raw);
    return {
      scraping_enabled: Boolean(data.scraping_enabled),
      scraper_delay_seconds: asNumber(data.scraper_delay_seconds, 0),
      scraper_default_limit: asNumber(data.scraper_default_limit, 5),
      scraper_default_sources: ensureArray<string>(data.scraper_default_sources),
      scraper_active_sources: ensureArray<string>(data.scraper_active_sources),
      scraper_source_metadata: ensureArray<IntegrationSourceMetadata>(data.scraper_source_metadata),
      mongodb_configured: Boolean(data.mongodb_configured),
      llm: ensureObject(data.llm),
      external_source_apis_removed: Boolean(data.external_source_apis_removed),
    };
  },
  async searchHistory(limit = 20) {
    const raw = await apiFetch<any>(
      `/api/search/history?limit=${Math.max(1, Math.min(limit, 100))}`
    );
    const data = ensureObject(raw);
    return {
      history: ensureArray<any>(data.history).map((item) => {
        const rawItem = ensureObject(item);
        return {
          search_id: asNullableString(rawItem.search_id),
          query: asNullableString(rawItem.query),
          created_at: asNullableString(rawItem.created_at),
          status: asNullableString(rawItem.status),
        };
      }),
    };
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
  params?: { source?: string; filename?: string; search_id?: string }
) {
  const query = new URLSearchParams();
  if (params?.search_id) query.set("search_id", params.search_id);
  if (params?.source) query.set("source", params.source);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const endpoint = params?.search_id ? `/api/reports/${format}${suffix}` : `/api/reports/export/${format}${suffix}`;
  const { blob, filename } = await apiFetchBlob(endpoint);
  const resolvedFilename =
    filename ||
    params?.filename ||
    (format === "csv" ? "relatorio_sentimento.csv" : "relatorio_sentimento.pdf");
  triggerBlobDownload(blob, resolvedFilename);
}

export async function downloadInsightsReport(
  format: "markdown" | "pdf",
  params?: { priority?: string; resolution?: string; limit?: number }
) {
  const query = new URLSearchParams();
  if (params?.priority) query.set("priority", params.priority);
  if (params?.resolution) query.set("resolution", params.resolution);
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { blob, filename } = await apiFetchBlob(`/api/insights/export/${format}${suffix}`);
  const resolvedFilename = filename || (format === "markdown" ? "insights.md" : "insights.pdf");
  triggerBlobDownload(blob, resolvedFilename);
}
